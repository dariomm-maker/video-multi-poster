import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "video-multi-poster.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error || "Google_auth_cancelled")}`);
  }

  const clientId =
    process.env.YOUTUBE_CLIENT_ID ||
    "1032994851591-i6lqbe5l4oheq64s4b564oa50ujchrtk.apps.googleusercontent.com";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || "";
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token || "";
      return NextResponse.redirect(
        `${baseUrl}/?youtube_token=${accessToken}&youtube_refresh=${refreshToken}`
      );
    } else {
      console.error("Error canjeando token de Google:", tokenData);
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(tokenData.error_description || "google_token_failed")}`
      );
    }
  } catch (err: any) {
    console.error("Error exchanging Google token:", err);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(err.message)}`);
  }
}
