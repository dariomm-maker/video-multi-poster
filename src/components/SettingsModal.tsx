"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Sparkles, CheckCircle2, LogIn } from "lucide-react";
import { YouTubeIcon, InstagramIcon, TikTokIcon } from "@/components/Icons";

declare global {
  interface Window {
    google?: any;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState("");
  
  // YouTube
  const [youtubeClientId, setYoutubeClientId] = useState(
    "1032994851591-i6lqbe5l4oheq64s4b564oa50ujchrtk.apps.googleusercontent.com"
  );
  const [youtubeToken, setYoutubeToken] = useState("");
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);

  // Instagram
  const [instagramToken, setInstagramToken] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  
  // TikTok
  const [tiktokClientKey, setTiktokClientKey] = useState("awv1wzl5z2vr09by");
  const [tiktokClientSecret, setTiktokClientSecret] = useState("f8Z8CgCSMH361tIwP9lISgLQhdaoi5OO");
  const [tiktokToken, setTiktokToken] = useState("");
  const [isTikTokConnected, setIsTikTokConnected] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("omnipost_gemini_key") || "");
      
      // YouTube
      const savedYtId =
        localStorage.getItem("omnipost_youtube_client_id") ||
        "1032994851591-i6lqbe5l4oheq64s4b564oa50ujchrtk.apps.googleusercontent.com";
      const savedYtToken = localStorage.getItem("omnipost_youtube_token") || "";
      setYoutubeClientId(savedYtId);
      setYoutubeToken(savedYtToken);
      if (savedYtToken) setIsYouTubeConnected(true);

      // Instagram
      const savedToken =
        localStorage.getItem("omnipost_instagram_token") ||
        "EAAggKaF9j9EBSwZCdBjf8mnfIC3rWpSnkD9FW4m6zshUCwKpraxAZC0i6uyiiU1emUliqmypAPpiZBn0eHqsXazkZC7FA2ZAsivfw4192cSxEgRDWgHAu3bg2rccneT5gyRVOCrD4z1PvBikZCH1KYj1Rw30mF1NaPCLUjEqx5NqcKK8X7ZCJXVGKtfSYv9gVFCWYgcF3Pn0wFTbvtwqZCagZBs6REgjNxe8NZAwZDZD";
      const savedAccountId =
        localStorage.getItem("omnipost_instagram_account_id") || "17841426600001306";
      
      setInstagramToken(savedToken);
      setInstagramAccountId(savedAccountId);

      // TikTok
      const savedTtKey = localStorage.getItem("omnipost_tiktok_client_key") || "awv1wzl5z2vr09by";
      const savedTtSecret = localStorage.getItem("omnipost_tiktok_client_secret") || "f8Z8CgCSMH361tIwP9lISgLQhdaoi5OO";
      const savedTtToken = localStorage.getItem("omnipost_tiktok_token") || "";
      setTiktokClientKey(savedTtKey);
      setTiktokClientSecret(savedTtSecret);
      setTiktokToken(savedTtToken);
      if (savedTtToken || savedTtKey) setIsTikTokConnected(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectYouTube = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: youtubeClientId,
          scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
          callback: (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              localStorage.setItem("omnipost_youtube_token", tokenResponse.access_token);
              setYoutubeToken(tokenResponse.access_token);
              setIsYouTubeConnected(true);
              alert("¡Canal de YouTube conectado con éxito!");
            }
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        alert("Error al iniciar autorización de Google: " + err.message);
      }
    } else {
      alert("Cargando servicios de Google... Por favor espera 3 segundos y vuelve a pulsar.");
    }
  };

  const handleConnectTikTok = () => {
    window.location.href = `/api/auth/tiktok?client_key=${tiktokClientKey}`;
  };

  const handleSave = () => {
    localStorage.setItem("omnipost_gemini_key", geminiKey);
    localStorage.setItem("omnipost_youtube_client_id", youtubeClientId);
    localStorage.setItem("omnipost_youtube_token", youtubeToken);
    localStorage.setItem("omnipost_instagram_token", instagramToken);
    localStorage.setItem("omnipost_instagram_account_id", instagramAccountId);
    localStorage.setItem("omnipost_tiktok_client_key", tiktokClientKey);
    localStorage.setItem("omnipost_tiktok_client_secret", tiktokClientSecret);
    localStorage.setItem("omnipost_tiktok_token", tiktokToken);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Configuración de APIs y Conexiones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Gemini API Key */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Google Gemini API Key (100% Gratis)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline"
              >
                Obtener clave gratuita &rarr;
              </a>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Usada para generar los ganchos virales, descripciones SEO y hashtags automáticos a partir del vídeo.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Social Platforms APIs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-300">Conexiones de Redes Sociales</h3>

            {/* Instagram Reels */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-pink-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-200">
                  <InstagramIcon className="w-4 h-4 text-pink-500" />
                  <span className="font-semibold">Instagram Reels API</span>
                </div>
                {instagramAccountId === "17841426600001306" && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                    🟢 Conectado con @realdreams.crew
                  </span>
                )}
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Instagram Account ID:
                </label>
                <input
                  type="text"
                  value={instagramAccountId}
                  onChange={(e) => setInstagramAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Meta Access Token:
                </label>
                <input
                  type="password"
                  value={instagramToken}
                  onChange={(e) => setInstagramToken(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            {/* YouTube Shorts */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-red-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-200">
                  <YouTubeIcon className="w-4 h-4 text-red-500" />
                  <span className="font-semibold">YouTube Shorts API</span>
                </div>
                {isYouTubeConnected ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                    🟢 Canal Conectado
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                    ⚪ No conectado
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Google OAuth Client ID:
                </label>
                <input
                  type="text"
                  value={youtubeClientId}
                  onChange={(e) => setYoutubeClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">
                  Inicia sesión una vez para autorizar la subida de Shorts:
                </p>
                <button
                  type="button"
                  onClick={handleConnectYouTube}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all shadow-md shadow-red-600/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isYouTubeConnected ? "Reconectar Canal" : "Conectar Canal"}</span>
                </button>
              </div>
            </div>

            {/* TikTok */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-cyan-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-200">
                  <TikTokIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">TikTok Content Posting API</span>
                </div>
                {isTikTokConnected ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                    🟢 Credenciales Listas
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                    ⚪ Pendiente
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  TikTok Client Key:
                </label>
                <input
                  type="text"
                  value={tiktokClientKey}
                  onChange={(e) => setTiktokClientKey(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  TikTok Client Secret:
                </label>
                <input
                  type="password"
                  value={tiktokClientSecret}
                  onChange={(e) => setTiktokClientSecret(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">
                  Vincula tu cuenta de TikTok con 1 clic:
                </p>
                <button
                  type="button"
                  onClick={handleConnectTikTok}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-semibold transition-all shadow-md shadow-cyan-600/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Conectar TikTok</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <span className="text-xs text-neutral-500">
            Tus claves se guardan de forma local en tu navegador.
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>¡Guardado!</span>
              </>
            ) : (
              "Guardar Configuración"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
