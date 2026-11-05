import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId =
    searchParams.get("client_id") ||
    process.env.YOUTUBE_CLIENT_ID ||
    "1032994851591-i6lqbe5l4oheq64s4b564oa50ujchrtk.apps.googleusercontent.com";

  const host = req.headers.get("host") || "video-multi-poster.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
  );

  // access_type=offline y prompt=consent garantizan recibir un Refresh Token permanente
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
