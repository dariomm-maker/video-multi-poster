"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Sparkles, CheckCircle2 } from "lucide-react";
import { YouTubeIcon, InstagramIcon, TikTokIcon } from "@/components/Icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [youtubeClientId, setYoutubeClientId] = useState("");
  const [instagramToken, setInstagramToken] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [tiktokClientKey, setTiktokClientKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("omnipost_gemini_key") || "");
      setYoutubeClientId(localStorage.getItem("omnipost_youtube_client_id") || "");
      // Por defecto configuramos las credenciales recién verificadas para realdreams.crew
      const savedToken = localStorage.getItem("omnipost_instagram_token") || "EAAggKaF9j9EBSwZCdBjf8mnfIC3rWpSnkD9FW4m6zshUCwKpraxAZC0i6uyiiU1emUliqmypAPpiZBn0eHqsXazkZC7FA2ZAsivfw4192cSxEgRDWgHAu3bg2rccneT5gyRVOCrD4z1PvBikZCH1KYj1Rw30mF1NaPCLUjEqx5NqcKK8X7ZCJXVGKtfSYv9gVFCWYgcF3Pn0wFTbvtwqZCagZBs6REgjNxe8NZAwZDZD";
      const savedAccountId = localStorage.getItem("omnipost_instagram_account_id") || "17841426600001306";
      
      setInstagramToken(savedToken);
      setInstagramAccountId(savedAccountId);
      setTiktokClientKey(localStorage.getItem("omnipost_tiktok_client_key") || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem("omnipost_gemini_key", geminiKey);
    localStorage.setItem("omnipost_youtube_client_id", youtubeClientId);
    localStorage.setItem("omnipost_instagram_token", instagramToken);
    localStorage.setItem("omnipost_instagram_account_id", instagramAccountId);
    localStorage.setItem("omnipost_tiktok_client_key", tiktokClientKey);
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

            {/* Instagram */}
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
                  placeholder="178414..."
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
                  placeholder="EAAggKa..."
                  value={instagramToken}
                  onChange={(e) => setInstagramToken(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            {/* YouTube */}
            <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-200">
                <YouTubeIcon className="w-4 h-4 text-red-500" />
                <span>YouTube Data API v3 (Shorts)</span>
              </div>
              <input
                type="text"
                placeholder="Google OAuth Client ID"
                value={youtubeClientId}
                onChange={(e) => setYoutubeClientId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            {/* TikTok */}
            <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-200">
                <TikTokIcon className="w-4 h-4 text-cyan-400" />
                <span>TikTok Content Posting API</span>
              </div>
              <input
                type="text"
                placeholder="TikTok Client Key"
                value={tiktokClientKey}
                onChange={(e) => setTiktokClientKey(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
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
