import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      videoUrl,
      title,
      description,
      hashtags = [],
      token,
      refreshToken,
      privacyStatus = "public",
    } = await req.json();

    let youtubeToken = token || process.env.YOUTUBE_ACCESS_TOKEN;
    const youtubeRefreshToken = refreshToken || process.env.YOUTUBE_REFRESH_TOKEN;
    const clientId =
      process.env.YOUTUBE_CLIENT_ID ||
      "1032994851591-i6lqbe5l4oheq64s4b564oa50ujchrtk.apps.googleusercontent.com";
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || "";

    // Función para auto-renovar el token de Google con el Refresh Token permanente
    async function getFreshGoogleToken(): Promise<string | null> {
      if (!youtubeRefreshToken || !clientSecret) return null;
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: youtubeRefreshToken,
            grant_type: "refresh_token",
          }).toString(),
        });
        const d = await res.json();
        return d.access_token || null;
      } catch {
        return null;
      }
    }

    if (!youtubeToken && youtubeRefreshToken) {
      youtubeToken = (await getFreshGoogleToken()) || undefined;
    }

    if (!youtubeToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta el token de acceso de YouTube. Por favor conecta tu canal en Configuración.",
        },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere un vídeo para subir a YouTube Shorts.",
        },
        { status: 400 }
      );
    }

    // Aseguramos que el título tenga el hashtag #Shorts para que YouTube lo procese como Short
    const formattedTitle = title.toLowerCase().includes("#shorts")
      ? title
      : `${title.slice(0, 90)} #Shorts`;

    const formattedDescription = `${description}\n\n${Array.isArray(hashtags) ? hashtags.join(" ") : ""}\n\n#Shorts #Viral`;

    // Paso 1: Iniciar subida reanudable (Resumable Upload)
    const metadata = {
      snippet: {
        title: formattedTitle,
        description: formattedDescription,
        categoryId: "22", // Personas y blogs / General
      },
      status: {
        privacyStatus: privacyStatus, // 'public', 'unlisted' o 'private'
        selfDeclaredMadeForKids: false,
      },
    };

    let initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${youtubeToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/*",
        },
        body: JSON.stringify(metadata),
      }
    );

    // Si el token caducó (401) e intentamos refrescarlo automáticamente:
    if (initRes.status === 401 && youtubeRefreshToken && clientSecret) {
      const freshToken = await getFreshGoogleToken();
      if (freshToken) {
        youtubeToken = freshToken;
        initRes = await fetch(
          "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${youtubeToken}`,
              "Content-Type": "application/json; charset=UTF-8",
              "X-Upload-Content-Type": "video/*",
            },
            body: JSON.stringify(metadata),
          }
        );
      }
    }

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      console.error("Error iniciando subida a YouTube:", err);
      return NextResponse.json(
        {
          success: false,
          error: err.error?.message || `Error de Google API: ${initRes.statusText}`,
        },
        { status: initRes.status }
      );
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      return NextResponse.json(
        { success: false, error: "No se recibió la URL de subida de YouTube." },
        { status: 500 }
      );
    }

    // Paso 2: Descargar el archivo de vídeo y subirlo a YouTube
    const videoStreamRes = await fetch(videoUrl);
    if (!videoStreamRes.ok) {
      return NextResponse.json(
        { success: false, error: "No se pudo descargar el archivo de vídeo para enviarlo a YouTube." },
        { status: 400 }
      );
    }

    const videoBuffer = await videoStreamRes.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": videoBuffer.byteLength.toString(),
      },
      body: videoBuffer,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.id) {
      console.error("Error subiendo binario a YouTube:", uploadData);
      return NextResponse.json(
        {
          success: false,
          error: uploadData.error?.message || "Error al transferir el vídeo a YouTube.",
        },
        { status: 400 }
      );
    }

    const videoId = uploadData.id;

    return NextResponse.json({
      success: true,
      videoId,
      url: `https://youtube.com/shorts/${videoId}`,
      message: `¡Vídeo publicado con éxito en YouTube Shorts! ID: ${videoId}`,
    });
  } catch (error: any) {
    console.error("Error in publish/youtube:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno al publicar en YouTube Shorts.",
      },
      { status: 500 }
    );
  }
}
