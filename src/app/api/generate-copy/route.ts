import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, videoDetails, apiKey: userApiKey, tone, frames = [] } = await req.json();

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

    const systemInstruction = `
Eres un estratega experto en marketing viral para YouTube Shorts, Instagram Reels y TikTok.
Tu objetivo es analizar minuciosamente el vídeo provisto (sus fotogramas reales, subtítulos, ambiente, protagonista, acciones y temática) para crear la estrategia de publicación más efectiva y viral posible.

Instrucciones de análisis:
1. Si recibes fotogramas del vídeo, analízalos detalladamente: ¿Qué ocurre? ¿Qué se ve? ¿Hay texto en pantalla? ¿Quién aparece? ¿Qué producto, lección o emoción transmite?
2. Redacta el contenido en español, optimizado para máxima retención de audiencia y posicionamiento en buscadores (SEO).
3. Adapta el contenido al tono: ${tone || "Viral y persuasivo"}.

Debes responder estrictamente en formato JSON válido con la siguiente estructura:
{
  "summary": "Breve resumen en 1 frase de lo que la IA vio en el vídeo",
  "hooks": [
    "Gancho 1 ultra llamativo (menos de 60 caracteres)",
    "Gancho 2 con pregunta intrigante o curiosidad",
    "Gancho 3 de advertencia o beneficio directo"
  ],
  "title": "Título principal recomendado con emojis y palabras clave (máximo 60 caracteres)",
  "description": "Descripción persuasiva de 2 a 4 frases explicando de qué trata el vídeo e incluyendo una llamada a la acción clara.",
  "hashtags": ["#viral", "#shorts", "#reels", "#fyp", "#tagEspecifico1", "#tagEspecifico2", "#tagEspecifico3"]
}
`;

    const userPrompt = `
Detalles del archivo:
- Nombre: ${videoDetails?.name || "video.mp4"}
- Duración: ${videoDetails?.duration ? `${Math.round(videoDetails.duration)} segundos` : "No especificada"}
- Contexto o tema adicional indicado por el creador: ${prompt || "Sin contexto adicional, analiza directamente el contenido visual del vídeo"}
${frames.length > 0 ? `\nSe te adjuntan ${frames.length} fotogramas clave extraídos del vídeo a lo largo de su duración. Analízalos para comprender qué ocurre exactamente en el vídeo.` : ""}

Genera la estrategia de publicación ahora en formato JSON.
`;

    // Estructuramos el contenido multimodal (fotogramas + texto)
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

    // Modelos con capacidad visual multimodal
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
            hooks: data.hooks || [
              data.hook || "🔥 ¡El secreto que cambiará tus resultados hoy!",
              "👀 No cometas este error en tus vídeos",
              "🚀 3 Claves indispensables que necesitas conocer"
            ],
            title: data.title || "🔥 ¡El método viral definitivo!",
            description: data.description || "Aplica estos trucos en tu contenido hoy mismo. Guárdalo para no olvidarlo.",
            hashtags: data.hashtags || ["#viral", "#shorts", "#reels", "#tiktok", "#tendencia"],
          },
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`Error con el modelo ${model}, probando siguiente...`, err.message);
      }
    }

    throw lastError || new Error("No se pudo analizar el vídeo con Gemini AI.");
  } catch (error: any) {
    console.error("Error generating copy with Gemini:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al conectar con la API de Gemini",
      },
      { status: 500 }
    );
  }
}
