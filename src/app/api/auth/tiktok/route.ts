import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientKey = searchParams.get("client_key") || "sbaw3qhchee8ajhvb1";

  // URL del host actual (Vercel o localhost)
  const host = req.headers.get("host") || "video-multi-poster.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/callback/tiktok`;

  const csrfState = Math.random().toString(36).substring(7);

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic,video.upload&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${csrfState}`;

  return NextResponse.redirect(authUrl);
}
