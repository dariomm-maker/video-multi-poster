import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { videoUrl, caption, token, accountId } = await req.json();

    const instagramToken = token || process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramAccountId = accountId || process.env.INSTAGRAM_ACCOUNT_ID;

    if (!instagramToken || !instagramAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan las credenciales de Instagram (Token o Account ID).",
        },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Instagram Reels requiere una URL de vídeo pública accesible (ej: https://.../video.mp4).",
        },
        { status: 400 }
      );
    }

    // Paso 1: Crear Contenedor de Medios para Reels
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption: caption || "",
          share_to_feed: true,
          access_token: instagramToken,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      console.error("Error creating Instagram container:", containerData);
      return NextResponse.json(
        {
          success: false,
          error: containerData.error?.message || "Error al crear el contenedor en Instagram.",
        },
        { status: 400 }
      );
    }

    const containerId = containerData.id;

    // Paso 2: Consultar estado de procesamiento (Polling)
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 15; // Hasta 45 segundos

    while (!isReady && attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${instagramToken}`
      );
      const statusData = await statusRes.json();

      if (statusData.status_code === "FINISHED") {
        isReady = true;
        break;
      } else if (statusData.status_code === "ERROR" || statusData.status_code === "EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            error: "Meta no pudo procesar el vídeo. Asegúrate de que el formato sea vertical (9:16) y códec H.264.",
          },
          { status: 400 }
        );
      }
    }

    if (!isReady) {
      return NextResponse.json(
        {
          success: false,
          error: "El vídeo tardó demasiado en ser procesado por los servidores de Instagram.",
        },
        { status: 408 }
      );
    }

    // Paso 3: Publicar el Reel
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: instagramToken,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return NextResponse.json(
        {
          success: false,
          error: publishData.error?.message || "Error al publicar el Reel en Instagram.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: publishData.id,
      message: "¡Reel publicado con éxito en @realdreams.crew!",
    });
  } catch (error: any) {
    console.error("Error in publish/instagram:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno al publicar en Instagram.",
      },
      { status: 500 }
    );
  }
}
