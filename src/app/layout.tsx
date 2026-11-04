import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniPost AI - Publicador Multiplataforma",
  description: "Sube un vídeo y publícalo en YouTube Shorts, TikTok e Instagram Reels a la vez con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}
