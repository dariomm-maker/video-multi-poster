import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, videoDetails, apiKey: userApiKey, tone } = await req.json();

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
Eres un estratega experto de contenido viral para YouTube Shorts, Instagram Reels y TikTok.
Tu misión es generar copys de altísima retención y optimización SEO en español.

Debes devolver obligatoriamente un JSON válido con esta estructura exacta:
{
  "hooks": [
    "Gancho 1 ultra llamativo (menos de 60 caracteres)",
    "Gancho 2 con curiosidad o pregunta intrigante",
    "Gancho 3 de advertencia o beneficio directo"
  ],
  "title": "Título principal recomendado con emojis (máximo 60 caracteres)",
  "description": "Descripción persuasiva de 2 a 4 frases con llamada a la acción clara para comentar o guardar.",
  "hashtags": ["#viral", "#shorts", "#reels", "#fyp", "#creadordecontenido", "#tendencia"]
}

El tono solicitado es: ${tone || "Viral y persuasivo"}.
`;

    const userPrompt = `
Información del vídeo:
- Nombre de archivo: ${videoDetails?.name || "video_viral.mp4"}
- Duración: ${videoDetails?.duration ? `${Math.round(videoDetails.duration)} segundos` : "No especificada"}
- Tema / Contexto indicado: ${prompt || "Consejos y contenido viral para creadores"}

Genera la estrategia de publicación ahora en el formato JSON pedido.
`;

    // Modelos de Gemini optimizados
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
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
          data: {
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
        console.warn(`Reintentando con siguiente modelo... ${model}:`, err.message);
      }
    }

    throw lastError || new Error("No se pudo generar con Gemini AI.");
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
