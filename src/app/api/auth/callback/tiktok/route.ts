import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "video-multi-poster.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error || "No_code")}`);
  }

  // Credenciales de Sandbox de TikTok
  const clientKey = "sbaw3qhchee8ajhvb1";
  const clientSecret = "mtrLpT84hJOhukh2hht9iPnEgZzbUnsv";
  const redirectUri = `${baseUrl}/api/auth/callback/tiktok`;

  try {
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token || tokenData.data?.access_token) {
      const accessToken = tokenData.access_token || tokenData.data?.access_token;
      const refreshToken = tokenData.refresh_token || tokenData.data?.refresh_token || "";
      return NextResponse.redirect(`${baseUrl}/?tiktok_token=${accessToken}&tiktok_refresh=${refreshToken}`);
    } else {
      console.error("TikTok token error:", tokenData);
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(tokenData.error_description || "token_failed")}`
      );
    }
  } catch (err: any) {
    console.error("Error exchanging TikTok token:", err);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(err.message)}`);
  }
}
