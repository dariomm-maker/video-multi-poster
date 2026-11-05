import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { videoUrl, title, token, privacyLevel = "PUBLIC_TO_EVERYONE" } = await req.json();

    const tiktokToken = token || process.env.TIKTOK_ACCESS_TOKEN;

    if (!tiktokToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta el token de acceso de TikTok. Conecta tu cuenta en Configuración.",
        },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere una URL pública de vídeo para publicar en TikTok.",
        },
        { status: 400 }
      );
    }

    // TikTok Content Posting API (v2) - PULL_FROM_URL
    const postPayload = {
      post_info: {
        title: title ? title.slice(0, 150) : "Video viral #fyp #viral",
        privacy_level: privacyLevel, // 'PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', o 'SELF_ONLY'
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    };

    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tiktokToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(postPayload),
    });

    const data = await res.json();

    if (!res.ok || data.error?.code !== "ok") {
      console.error("Error iniciando publicación en TikTok:", data);
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || "Error al enviar el vídeo a TikTok.",
        },
        { status: res.status || 400 }
      );
    }

    const publishId = data.data?.publish_id;

    return NextResponse.json({
      success: true,
      publishId,
      message: `¡Vídeo enviado a TikTok con éxito! Publish ID: ${publishId}`,
    });
  } catch (error: any) {
    console.error("Error in publish/tiktok:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno al publicar en TikTok.",
      },
      { status: 500 }
    );
  }
}
