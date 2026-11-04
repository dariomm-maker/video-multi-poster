"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Settings,
  Share2,
  Copy,
  Check,
  Play,
  Pause,
  Clock,
  FileVideo,
  Layers
} from "lucide-react";
import { YouTubeIcon, InstagramIcon, TikTokIcon } from "@/components/Icons";
import SettingsModal from "@/components/SettingsModal";

interface GeneratedData {
  hooks: string[];
  title: string;
  description: string;
  hashtags: string[];
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoContext, setVideoContext] = useState("");
  const [tone, setTone] = useState("Viral y persuasivo");

  const [loadingAI, setLoadingAI] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Redes seleccionadas para publicar
  const [channels, setChannels] = useState({
    youtube: true,
    instagram: true,
    tiktok: true,
  });

  // Estado de publicación
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Modal de configuración
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Manejo de archivo de vídeo
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Por favor, sube un archivo de vídeo válido (.mp4, .mov, etc.)");
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setPublishSuccess(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Generar Copy con Gemini
  const handleGenerateCopy = async () => {
    setLoadingAI(true);
    const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("omnipost_gemini_key") : "";

    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoContext,
          tone,
          apiKey: savedApiKey,
          videoDetails: videoFile
            ? {
                name: videoFile.name,
                duration: videoDuration,
                size: (videoFile.size / (1024 * 1024)).toFixed(2) + " MB",
              }
            : null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGeneratedData(json.data);
        setTitle(json.data.title || "");
        setDescription(json.data.description || "");
        setHashtags(json.data.hashtags || []);
      } else {
        alert("Error al generar copy: " + (json.error || "Inténtalo de nuevo"));
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // Copiar al portapapeles
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Publicación simultánea (Orquestación)
  const handlePublishAll = async () => {
    if (!videoFile) {
      alert("Sube un vídeo antes de publicar.");
      return;
    }
    if (!title) {
      alert("Por favor define un título para el vídeo.");
      return;
    }

    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      if (channels.youtube) {
        setPublishStep("Subiendo a YouTube Shorts...");
        await new Promise((r) => setTimeout(r, 1400));
      }
      if (channels.instagram) {
        setPublishStep("Subiendo a Instagram Reels...");
        await new Promise((r) => setTimeout(r, 1400));
      }
      if (channels.tiktok) {
        setPublishStep("Subiendo a TikTok...");
        await new Promise((r) => setTimeout(r, 1400));
      }

      setPublishStep(null);
      setPublishSuccess(true);
    } catch (e) {
      alert("Ocurrió un error al procesar la subida.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Barra de Navegación Superior */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                OmniPost
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                AI Multi-Publisher
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Configuración & APIs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Subida y Reproductor de Vídeo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur shadow-sm">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-indigo-400" />
                1. Archivo de Vídeo
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                Sube tu vídeo en formato vertical (9:16) para Shorts, Reels y TikTok.
              </p>

              {/* Zona de Drop o Vista previa */}
              {!videoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-neutral-700/80 hover:border-indigo-500/80 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-neutral-950/40 hover:bg-neutral-950/80 group"
                >
                  <div className="w-14 h-14 rounded-full bg-neutral-800/80 group-hover:bg-indigo-950 flex items-center justify-center transition-colors">
                    <Upload className="w-7 h-7 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      Arrastra y suelta tu vídeo aquí
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      O haz clic para explorar (.mp4, .mov, .webm)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Reproductor Vertical 9:16 */}
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[460px] mx-auto border border-neutral-800 shadow-xl group">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                  </div>

                  {/* Ficha técnica del vídeo */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <div className="truncate max-w-[200px] text-neutral-300 font-medium">
                      {videoFile?.name}
                    </div>
                    <div className="flex items-center gap-3">
                      {videoDuration && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.round(videoDuration)}s
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setVideoFile(null);
                          setVideoUrl(null);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />

              {/* Opciones de contexto para la IA */}
              <div className="mt-5 space-y-3 pt-5 border-t border-neutral-800/80">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Tema o contexto adicional (Opcional):
                  </label>
                  <input
                    type="text"
                    value={videoContext}
                    onChange={(e) => setVideoContext(e.target.value)}
                    placeholder="Ej: Trucos para ganar seguidores en 2026..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Tono del contenido:
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Viral y persuasivo">🔥 Viral y persuasivo (Alta retención)</option>
                    <option value="Educativo y claro">📚 Educativo y directo al grano</option>
                    <option value="Humorístico y casual">😂 Humorístico y casual</option>
                    <option value="Profesional y B2B">💼 Profesional y de negocios</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateCopy}
                  disabled={loadingAI}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-amber-300 ${loadingAI ? "animate-spin" : ""}`} />
                  <span>
                    {loadingAI
                      ? "Gemini analizando y creando copy..."
                      : "✨ Generar Copy & Hashtags con IA"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Estrategia de IA y Publicador Multi-Canal */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tarjeta de Contenido Generado */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  2. Estrategia & Copys Virales
                </h2>
                {generatedData && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                    Generado con Gemini
                  </span>
                )}
              </div>

              {/* Títulos tipo Gancho / Hooks */}
              {generatedData?.hooks && generatedData.hooks.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-2">
                    Ganchos sugeridos (Haz clic para usar como título):
                  </label>
                  <div className="space-y-2">
                    {generatedData.hooks.map((hook, idx) => (
                      <div
                        key={idx}
                        onClick={() => setTitle(hook)}
                        className={`text-xs p-2.5 rounded-xl border cursor-pointer transition-all ${
                          title === hook
                            ? "bg-indigo-950/40 border-indigo-500/80 text-white"
                            : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        {hook}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Título Principal */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Título principal:
                  </label>
                  <span className="text-[11px] text-neutral-500">{title.length} / 100</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Escribe o genera un título con gancho..."
                  className="w-full px-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Descripción / Copy del post:
                  </label>
                  <button
                    onClick={() => handleCopy(description, "desc")}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedText === "desc" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === "desc" ? "¡Copiado!" : "Copiar"}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aquí aparecerá la descripción optimizada con llamada a la acción..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Hashtags ({hashtags.length}):
                  </label>
                  {hashtags.length > 0 && (
                    <button
                      onClick={() => handleCopy(hashtags.join(" "), "tags")}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedText === "tags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === "tags" ? "¡Copiados!" : "Copiar todos"}</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  {hashtags.length > 0 ? (
                    hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-indigo-300 font-mono"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-600">
                      Los hashtags generados aparecerán aquí...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta de Publicación Simultánea (1 Clic) */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                3. Publicación Simultánea
              </h2>

              <p className="text-xs text-neutral-400">
                Selecciona las plataformas donde deseas publicar este vídeo en simultáneo:
              </p>

              {/* Toggles de Redes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* YouTube */}
                <div
                  onClick={() => setChannels({ ...channels, youtube: !channels.youtube })}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    channels.youtube
                      ? "bg-red-950/20 border-red-800/60 text-white"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <YouTubeIcon className={`w-5 h-5 ${channels.youtube ? "text-red-500" : "text-neutral-500"}`} />
                    <span className="text-xs font-semibold">Shorts</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      channels.youtube ? "bg-red-500 border-red-500 text-white" : "border-neutral-700"
                    }`}
                  >
                    {channels.youtube && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* Instagram */}
                <div
                  onClick={() => setChannels({ ...channels, instagram: !channels.instagram })}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    channels.instagram
                      ? "bg-pink-950/20 border-pink-800/60 text-white"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <InstagramIcon className={`w-5 h-5 ${channels.instagram ? "text-pink-500" : "text-neutral-500"}`} />
                    <span className="text-xs font-semibold">Reels</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      channels.instagram ? "bg-pink-500 border-pink-500 text-white" : "border-neutral-700"
                    }`}
                  >
                    {channels.instagram && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* TikTok */}
                <div
                  onClick={() => setChannels({ ...channels, tiktok: !channels.tiktok })}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    channels.tiktok
                      ? "bg-cyan-950/20 border-cyan-800/60 text-white"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TikTokIcon className={`w-5 h-5 ${channels.tiktok ? "text-cyan-400" : "text-neutral-500"}`} />
                    <span className="text-xs font-semibold">TikTok</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      channels.tiktok ? "bg-cyan-500 border-cyan-500 text-black" : "border-neutral-700"
                    }`}
                  >
                    {channels.tiktok && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Estado de Publicación o Progreso */}
              {isPublishing && (
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60 flex items-center gap-3 animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-indigo-300 font-medium">{publishStep}</span>
                </div>
              )}

              {publishSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      ¡Publicación completada con éxito!
                    </p>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      El vídeo se ha procesado en las redes seleccionadas.
                    </p>
                  </div>
                </div>
              )}

              {/* Botón Principal de Publicación */}
              <button
                onClick={handlePublishAll}
                disabled={isPublishing || !videoFile}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? "Publicando en simultáneo..."
                    : "🚀 Publicar en 1 Clic en todas las redes"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Configuración */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
