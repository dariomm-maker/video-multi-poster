import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, videoDetails, apiKey: userApiKey, tone, frames = [], postType = "video" } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta la clave de Gemini API. Por favor introduce tu clave en Configuración & APIs de la web.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const isImage = postType === "image";
    const isText = postType === "text";

    const systemInstruction = `
Eres un estratega experto en marketing digital y creación de contenido viral para redes sociales (Instagram, TikTok, YouTube Shorts y X / Twitter).
Tu objetivo es analizar minuciosamente el contenido multimedia o tema provisto (${isImage ? "imagen fija para post de feed" : isText ? "post de texto" : "vídeo vertical"}) para crear la publicación más atractiva y efectiva posible.

Instrucciones:
1. ${isImage ? "Analiza la imagen recibida: colores, protagonistas, estilo, detalles, contexto y mensaje." : isText ? "Desarrolla el tema con ganchos persuasivos." : "Analiza los fotogramas del vídeo, acciones, ambiente y emociones."}
2. Redacta el contenido en español, optimizado para alto engagement, comentarios y guardados.
3. Adapta el contenido al tono: ${tone || "Viral y persuasivo"}.

Debes responder estrictamente en formato JSON válido con la siguiente estructura:
{
  "summary": "Breve resumen en 1 frase de lo que se ve o el mensaje central",
  "hooks": [
    "Gancho 1 llamativo y directo",
    "Gancho 2 con pregunta intrigante o curiosidad",
    "Gancho 3 de advertencia o beneficio directo"
  ],
  "title": "Título o primera línea del post con emojis y gancho (máximo 60 caracteres)",
  "description": "Texto completo y persuasivo para el pie de foto / cuerpo del post, con formato agradable, saltos de línea y una llamada a la acción clara.",
  "hashtags": ["#viral", "#post", "#instagram", "#tendencia", "#tag1", "#tag2", "#tag3"]
}
`;

    const userPrompt = `
Tipo de publicación: ${postType.toUpperCase()}
Detalles:
- Archivo: ${videoDetails?.name || (isImage ? "imagen.jpg" : isText ? "solo texto" : "video.mp4")}
${videoDetails?.duration ? `- Duración: ${Math.round(videoDetails.duration)}s` : ""}
- Contexto o idea del autor: ${prompt || "Analiza directamente el contenido visual"}
${frames.length > 0 ? `\nSe te adjuntan ${frames.length} imagen(es) para su análisis visual.` : ""}

Genera la estrategia y copy de publicación ahora en formato JSON.
`;

    const contents: any[] = [];

    if (Array.isArray(frames) && frames.length > 0) {
      for (const base64Img of frames) {
        if (typeof base64Img === "string" && base64Img.trim()) {
          const cleanBase64 = base64Img.replace(/^data:image\/\w+;base64,/, "").trim();
          contents.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          });
        }
      }
    }

    contents.push({
      text: userPrompt,
    });

    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || "{}";
        const parsedData = JSON.parse(responseText);
        const data = Array.isArray(parsedData) ? parsedData[0] : parsedData;

        return NextResponse.json({
          success: true,
          modelUsed: model,
          analyzedFramesCount: frames.length,
          data: {
            summary: data.summary || "",
            hooks: Array.isArray(data.hooks) ? data.hooks : [],
            title: data.title || "",
            description: data.description || "",
            hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
          },
        });
      } catch (err: any) {
        console.warn(`Fallo con el modelo ${model}:`, err.message);
        lastError = err;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `No se pudo generar el copy con Gemini: ${lastError?.message || "Error desconocido"}`,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
