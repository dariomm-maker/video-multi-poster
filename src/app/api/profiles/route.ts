import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const scriptPath = path.resolve("..", "social-uploader", "list_profiles.py");

    if (!fs.existsSync(scriptPath)) {
      // Perfiles por defecto si no existe la carpeta local
      return NextResponse.json({
        success: true,
        profiles: [
          {
            id: "mi_marca",
            name: "Mi Marca (@realdreams.crew)",
            networks: { tiktok: true, instagram: true, youtube: true, x: false },
          },
        ],
      });
    }

    return new Promise<NextResponse>((resolve) => {
      exec(`python "${scriptPath}"`, { cwd: path.dirname(scriptPath) }, (error, stdout) => {
        if (error) {
          console.error("Error listing profiles:", error);
          resolve(
            NextResponse.json({
              success: true,
              profiles: [
                {
                  id: "mi_marca",
                  name: "Mi Marca (@realdreams.crew)",
                  networks: { tiktok: true, instagram: true, youtube: true, x: false },
                },
              ],
            })
          );
        } else {
          try {
            const data = JSON.parse(stdout);
            resolve(NextResponse.json({ success: true, profiles: data }));
          } catch {
            resolve(
              NextResponse.json({
                success: true,
                profiles: [
                  {
                    id: "mi_marca",
                    name: "Mi Marca (@realdreams.crew)",
                    networks: { tiktok: true, instagram: true, youtube: true, x: false },
                  },
                ],
              })
            );
          }
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
