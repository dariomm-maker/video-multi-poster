import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    let mediaPath = "";
    let title = "Publicación";
    let description = "";
    let formattedHashtags = "";
    let selectedPlatforms = "tiktok,instagram,facebook,youtube,x";
    let profile = "mi_marca";
    let postType = "video";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("media") as File | null) || (formData.get("video") as File | null);
      title = (formData.get("title") as string) || "Publicación";
      description = (formData.get("description") as string) || "";
      const rawTags = formData.get("hashtags") as string;
      formattedHashtags = rawTags || "";
      selectedPlatforms = (formData.get("platforms") as string) || "tiktok,instagram,facebook,youtube,x";
      profile = (formData.get("profile") as string) || "mi_marca";
      postType = (formData.get("postType") as string) || "video";

      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const scriptDir = path.resolve("..", "social-uploader");
        const ext = file.name ? path.extname(file.name) : (postType === "image" ? ".jpg" : ".mp4");
        const tempFileName = `temp_upload_${Date.now()}${ext}`;
        mediaPath = path.join(scriptDir, tempFileName);
        fs.writeFileSync(mediaPath, buffer);
      } else {
        const passedPath = (formData.get("mediaPath") as string) || (formData.get("videoPath") as string);
        if (passedPath) mediaPath = passedPath;
      }
    } else {
      const body = await req.json();
      mediaPath = body.mediaPath || body.videoPath || "";
      title = body.title || "Publicación";
      description = body.description || "";
      const tags = body.hashtags || [];
      formattedHashtags = Array.isArray(tags) ? tags.join(" ") : tags || "";
      const plats = body.platforms || ["tiktok", "instagram", "facebook", "youtube", "x"];
      selectedPlatforms = Array.isArray(plats) ? plats.join(",") : plats;
      profile = body.profile || "mi_marca";
      postType = body.postType || "video";
    }

    if (postType !== "text" && (!mediaPath || !fs.existsSync(mediaPath))) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encuentra el archivo multimedia para subir: ${mediaPath || "ninguno recibido"}`,
        },
        { status: 400 }
      );
    }

    const scriptDir = path.resolve("..", "social-uploader");
    const scriptPath = path.join(scriptDir, "publish_cli.py");

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encuentra el script del robot en: ${scriptPath}`,
        },
        { status: 500 }
      );
    }

    // Escribir archivo JSON payload temporal para evitar errores con saltos de línea y comillas en Windows
    const payloadPath = path.join(scriptDir, `payload_${Date.now()}.json`);
    const payloadContent = {
      mediaPath,
      postType,
      title,
      description,
      hashtags: formattedHashtags,
      platforms: selectedPlatforms,
      profile,
    };

    fs.writeFileSync(payloadPath, JSON.stringify(payloadContent, null, 2), "utf-8");

    const cmd = `python "${scriptPath}" --payload "${payloadPath}"`;
    console.log("Ejecutando robot de subida local:", cmd, "Perfil:", profile);

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { cwd: scriptDir, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        console.log("Salida del robot:", stdout);
        if (stderr) console.error("Errores del robot:", stderr);

        let results = null;
        try {
          const match = stdout.match(/--- RESULTADOS FINALES ---\s*([\s\S]*)$/);
          if (match && match[1]) {
            results = JSON.parse(match[1].trim());
          }
        } catch {
          // Salida en crudo
        }

        if (error) {
          resolve(
            NextResponse.json({
              success: false,
              error: `Error durante la ejecución del robot: ${error.message}`,
              output: stdout,
              results,
            })
          );
        } else {
          resolve(
            NextResponse.json({
              success: true,
              message: "Proceso del robot finalizado con éxito.",
              output: stdout,
              results,
            })
          );
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
