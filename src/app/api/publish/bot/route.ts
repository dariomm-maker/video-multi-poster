import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const { videoPath, title, description, hashtags = [], platforms = ["tiktok", "instagram", "youtube", "x"] } = await req.json();

    if (!videoPath || !fs.existsSync(videoPath)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encuentra el archivo de vídeo en la ruta local: ${videoPath || "vacía"}`,
        },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve("..", "social-uploader", "publish_cli.py");

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encuentra el script del robot en: ${scriptPath}`,
        },
        { status: 500 }
      );
    }

    const formattedHashtags = Array.isArray(hashtags) ? hashtags.join(" ") : hashtags;
    const selectedPlatforms = Array.isArray(platforms) ? platforms.join(",") : platforms;

    // Escapar comillas para la línea de comandos
    const safeTitle = (title || "Video Viral").replace(/"/g, '\\"');
    const safeDesc = (description || "").replace(/"/g, '\\"');
    const safeTags = (formattedHashtags || "").replace(/"/g, '\\"');

    const cmd = `python "${scriptPath}" --video "${videoPath}" --title "${safeTitle}" --description "${safeDesc}" --hashtags "${safeTags}" --platforms "${selectedPlatforms}"`;

    console.log("Ejecutando robot de subida local:", cmd);

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { cwd: path.dirname(scriptPath) }, (error, stdout, stderr) => {
        console.log("Salida del robot:", stdout);
        if (stderr) console.error("Errores del robot:", stderr);

        if (error) {
          resolve(
            NextResponse.json({
              success: false,
              error: `Error ejecutando el robot: ${error.message}`,
              output: stdout,
            })
          );
        } else {
          resolve(
            NextResponse.json({
              success: true,
              message: "Proceso del robot finalizado.",
              output: stdout,
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
