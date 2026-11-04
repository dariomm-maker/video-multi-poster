import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, videoDetails, apiKey: userApiKey, tone } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Si no hay API key aún, proporcionamos una respuesta inteligente simulada de muestra
    // para que el usuario pueda probar la interfaz inmediatamente antes de configurar su clave.
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        isDemo: true,
        data: {
          hooks: [
            "😱 ¡El truco definitivo que NADIE te había contado hasta hoy!",
            "🔥 Deja de hacer esto si quieres multiplicar tus resultados ya",
            "👀 3 Secretos que cambiarán por completo tu forma de crear contenido"
          ],
          title: "🔥 ¡El método definitivo que cambiará tus resultados!",
          description: `¿Estás listo para llevar tu contenido al siguiente nivel? En este vídeo te revelo los puntos clave que necesitas aplicar hoy mismo. \n\n👉 Guárdalo para no perderlo y compártelo con alguien que lo necesite.\n\nComenta 'INFO' si quieres la guía completa.`,
          hashtags: [
            "#viral",
            "#creadordecontenido",
            "#shorts",
            "#reels",
            "#tiktoktips",
            "#productividad",
            "#crecimientopersonal",
            "#tendencia",
            "#trucos",
            "#marketingdigital"
          ]
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Eres un experto estratega de contenido viral especializado en YouTube Shorts, TikTok e Instagram Reels.
Tu objetivo es analizar los detalles del vídeo provisto y generar:
1. Tres (3) títulos tipo 'gancho' (hooks de alta retención).
2. Un título principal recomendado (máximo 60 caracteres, con emojis).
3. Una descripción persuasiva adaptada a redes sociales (con llamada a la acción).
4. Entre 10 y 15 hashtags de alta relevancia y tendencia en español.

El tono solicitado es: ${tone || "Viral y persuasivo"}.

Responde estrictamente en formato JSON válido con la siguiente estructura:
{
  "hooks": ["gancho 1", "gancho 2", "gancho 3"],
  "title": "título principal",
  "description": "descripción completa",
  "hashtags": ["#tag1", "#tag2", ...]
}
`;

    const userPrompt = `
Detalles del vídeo:
- Nombre de archivo: ${videoDetails?.name || "video_viral.mp4"}
- Duración: ${videoDetails?.duration ? `${Math.round(videoDetails.duration)} segundos` : "No especificada"}
- Contexto adicional o tema indicado por el usuario: ${prompt || "Vídeo para redes sociales"}

Genera la estrategia viral completa ahora en el formato JSON pedido.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      isDemo: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error generating copy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al generar el copy con IA",
      },
      { status: 500 }
    );
  }
}
