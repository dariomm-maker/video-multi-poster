"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Layers,
  Link as LinkIcon,
  Bot,
  UserCheck,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Trash2,
} from "lucide-react";
import { YouTubeIcon, InstagramIcon, FacebookIcon, TikTokIcon, XIcon } from "@/components/Icons";
import SettingsModal from "@/components/SettingsModal";

interface GeneratedData {
  summary?: string;
  hooks: string[];
  title: string;
  description: string;
  hashtags: string[];
}

interface PublishReportItem {
  channel: string;
  success: boolean;
  message: string;
  actionRequired?: "open_settings";
}

export default function Home() {
  const [postType, setPostType] = useState<"video" | "image" | "text">("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publicVideoUrl, setPublicVideoUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoContext, setVideoContext] = useState("");
  const [tone, setTone] = useState("Viral y persuasivo");

  // Fotogramas extraídos para análisis visual con Gemini Vision
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  const [loadingAI, setLoadingAI] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Redes seleccionadas para publicar
  const [channels, setChannels] = useState({
    youtube: true,
    instagram: true,
    facebook: true,
    tiktok: true,
    x: true,
  });

  // Perfiles / Clientes para multi-cuenta
  const [profiles, setProfiles] = useState<
    Array<{
      id: string;
      name: string;
      networks?: { tiktok: boolean; instagram: boolean; youtube: boolean; x: boolean };
    }>
  >([
    {
      id: "mi_marca",
      name: "Mi Marca (@realdreams.crew)",
      networks: { tiktok: true, instagram: true, youtube: true, x: false },
    },
  ]);
  const [selectedProfile, setSelectedProfile] = useState<string>("mi_marca");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);

  // Cargar perfiles configurados desde el robot local
  const fetchProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
        setProfiles(data.profiles);
        const saved = typeof window !== "undefined" ? localStorage.getItem("omnipost_selected_profile") : null;
        if (saved && data.profiles.some((p: any) => p.id === saved)) {
          setSelectedProfile(saved);
        } else {
          setSelectedProfile(data.profiles[0].id);
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar perfiles locales:", e);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleProfileChange = (id: string) => {
    setSelectedProfile(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("omnipost_selected_profile", id);
    }
  };

  // Estado de publicación
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string | null>(null);
  const [publishReports, setPublishReports] = useState<PublishReportItem[]>([]);

  // Modal de configuración
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isInstagramConfigured, setIsInstagramConfigured] = useState(false);
  const [isYouTubeConfigured, setIsYouTubeConfigured] = useState(false);
  const [isTikTokConfigured, setIsTikTokConfigured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Manejo de archivo de imagen para posts tradicionales
  const handleImageChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, sube un archivo de imagen válido (.jpg, .png, .webp)");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPublishReports([]);
    setExtractedFrames([]);
    setAiSummary("");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setExtractedFrames([reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Comprobar parámetros de retorno de OAuth y estado de conexiones
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ttToken = urlParams.get("tiktok_token");
      const ttRefresh = urlParams.get("tiktok_refresh");
      if (ttToken) {
        localStorage.setItem("omnipost_tiktok_token", ttToken);
        if (ttRefresh) localStorage.setItem("omnipost_tiktok_refresh", ttRefresh);
        setIsTikTokConfigured(true);
      }

      const ytTokenParam = urlParams.get("youtube_token");
      const ytRefreshParam = urlParams.get("youtube_refresh");
      if (ytTokenParam) {
        localStorage.setItem("omnipost_youtube_token", ytTokenParam);
        if (ytRefreshParam) localStorage.setItem("omnipost_youtube_refresh", ytRefreshParam);
        setIsYouTubeConfigured(true);
      }

      if (ttToken || ytTokenParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const igToken = localStorage.getItem("omnipost_instagram_token");
      const igAccId = localStorage.getItem("omnipost_instagram_account_id");
      if (igToken && igAccId) setIsInstagramConfigured(true);

      const ytToken = localStorage.getItem("omnipost_youtube_token");
      if (ytToken) setIsYouTubeConfigured(true);

      const savedTtToken = localStorage.getItem("omnipost_tiktok_token");
      if (savedTtToken) setIsTikTokConfigured(true);

      // Cargar lista de perfiles locales
      fetchProfiles();
    }
  }, [isSettingsOpen]);

  // Extraer fotogramas clave del vídeo en el navegador usando Canvas
  const extractFramesFromVideo = (file: File, count = 4): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const frames: string[] = [];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = async () => {
        const duration = video.duration || 1;
        // Puntos temporales distribuidos a lo largo del vídeo (ej. 15%, 40%, 65%, 85%)
        const timestamps: number[] = [];
        for (let i = 1; i <= count; i++) {
          timestamps.push((duration / (count + 1)) * i);
        }

        // Redimensionar para optimizar peso (máx 640px de ancho/alto)
        const maxDim = 640;
        let w = video.videoWidth || 640;
        let h = video.videoHeight || 360;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;

        for (const t of timestamps) {
          await new Promise<void>((res) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              if (ctx) {
                try {
                  ctx.drawImage(video, 0, 0, w, h);
                  frames.push(canvas.toDataURL("image/jpeg", 0.7));
                } catch (e) {
                  console.warn("Error capturando fotograma:", e);
                }
              }
              res();
            };
            video.addEventListener("seeked", onSeeked);
            video.currentTime = Math.max(0.1, Math.min(t, duration - 0.1));
            // timeout de seguridad por si el evento seeked se retrasa
            setTimeout(() => {
              video.removeEventListener("seeked", onSeeked);
              res();
            }, 1200);
          });
        }

        URL.revokeObjectURL(url);
        resolve(frames);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
    });
  };

  // Manejo de archivo de vídeo
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Por favor, sube un archivo de vídeo válido (.mp4, .mov, etc.)");
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setPublishReports([]);
    setExtractedFrames([]);
    setAiSummary("");

    // Extracción automática de fotogramas para visión con Gemini
    setIsExtractingFrames(true);
    try {
      const frames = await extractFramesFromVideo(file, 4);
      setExtractedFrames(frames);
    } catch (e) {
      console.warn("No se pudieron extraer fotogramas automáticamente:", e);
    } finally {
      setIsExtractingFrames(false);
    }
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

  // Generar Copy con Gemini analizando multimedia o texto
  const handleGenerateCopy = async () => {
    const activeFile = postType === "image" ? imageFile : postType === "video" ? videoFile : null;
    if (!activeFile && !videoContext && postType !== "text") {
      alert(`Por favor, sube ${postType === "image" ? "una imagen" : "un vídeo"} o escribe un tema para generar el contenido.`);
      return;
    }

    setLoadingAI(true);
    const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("omnipost_gemini_key") : "";

    try {
      // Si es vídeo y aún no se extrajeron fotogramas, extraerlos ahora
      let framesToSend = extractedFrames;
      if (postType === "video" && videoFile && framesToSend.length === 0) {
        setIsExtractingFrames(true);
        framesToSend = await extractFramesFromVideo(videoFile, 4);
        setExtractedFrames(framesToSend);
        setIsExtractingFrames(false);
      }

      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoContext,
          tone,
          apiKey: savedApiKey,
          frames: framesToSend,
          postType,
          videoDetails: activeFile
            ? {
                name: activeFile.name,
                duration: postType === "video" ? videoDuration : null,
                size: (activeFile.size / (1024 * 1024)).toFixed(2) + " MB",
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
        if (json.data.summary) {
          setAiSummary(json.data.summary);
        }
      } else {
        alert("Error al generar copy: " + (json.error || "Inténtalo de nuevo"));
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setLoadingAI(false);
      setIsExtractingFrames(false);
    }
  };

  // Copiar al portapapeles
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Publicación simultánea (Orquestación en las 3 plataformas)
  const handlePublishAll = async () => {
    if (!videoFile && !publicVideoUrl) {
      alert("Sube un vídeo o introduce una URL de vídeo antes de publicar.");
      return;
    }
    if (!title) {
      alert("Por favor define un título para el vídeo.");
      return;
    }

    setIsPublishing(true);
    setPublishReports([]);
    const reports: PublishReportItem[] = [];

    const captionText = `${title}\n\n${description}\n\n${hashtags.join(" ")}`;
    const targetVideoUrl = publicVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

    try {
      // 1. INSTAGRAM REELS (API REAL)
      if (channels.instagram) {
        setPublishStep("Publicando en Instagram Reels (@realdreams.crew)...");

        const savedToken = localStorage.getItem("omnipost_instagram_token") || "EAAggKaF9j9EBSwRn5Tghp0AZB9GVFoa2bl1QHrduZCPBOlgegZCOmNullHMpSFCofrwlYahG8xmdZBvaehBCG5VeG8bBqEfudt6VOtVL3wIUnFbZCSjoF0Te8h2DmAxEAZB87GvCBxUTsMCIXADmUMmr60R2XfPlWXtcBiZB4POeKtoyZBS0ZBfNXgcbhVZCvd";
        const savedAccountId = localStorage.getItem("omnipost_instagram_account_id") || "17841426600001306";

        try {
          const igRes = await fetch("/api/publish/instagram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: targetVideoUrl,
              caption: captionText,
              token: savedToken,
              accountId: savedAccountId,
            }),
          });

          const igData = await igRes.json();
          if (igData.success) {
            reports.push({
              channel: "Instagram Reels",
              success: true,
              message: `¡Publicado con éxito en @realdreams.crew! (ID: ${igData.postId})`,
            });
          } else {
            const err = igData.error || "Error al publicar";
            const isExpired = err.toLowerCase().includes("expired") || err.toLowerCase().includes("session") || err.toLowerCase().includes("token");
            reports.push({
              channel: "Instagram Reels",
              success: false,
              message: isExpired
                ? "El token de acceso de Meta ha caducado. Pulsa 'Abrir Configuración' y renueva tu token en Graph Explorer."
                : err,
              actionRequired: isExpired ? "open_settings" : undefined,
            });
          }
        } catch (e: any) {
          reports.push({
            channel: "Instagram Reels",
            success: false,
            message: `Error de conexión: ${e.message}`,
          });
        }
      }

      // 2. YOUTUBE SHORTS (API REAL / CONECTADA)
      if (channels.youtube) {
        setPublishStep("Subiendo a YouTube Shorts...");

        const ytToken = localStorage.getItem("omnipost_youtube_token");
        const ytRefreshToken = localStorage.getItem("omnipost_youtube_refresh") || "";

        if (ytToken || ytRefreshToken) {
          try {
            const ytRes = await fetch("/api/publish/youtube", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoUrl: targetVideoUrl,
                title,
                description,
                hashtags,
                token: ytToken,
                refreshToken: ytRefreshToken,
                privacyStatus: "public",
              }),
            });
            const ytData = await ytRes.json();
            if (ytData.success) {
              reports.push({
                channel: "YouTube Shorts",
                success: true,
                message: `¡Publicado con éxito! (${ytData.url})`,
              });
            } else {
              const err = ytData.error || "Error al subir a YouTube";
              const isExpired = err.toLowerCase().includes("invalid authentication") || err.toLowerCase().includes("oauth") || ytRes.status === 401;
              reports.push({
                channel: "YouTube Shorts",
                success: false,
                message: isExpired
                  ? "Tu sesión de Google ha caducado (duran 1 hora). Pulsa 'Abrir Configuración' y haz clic en 'Reconectar Canal' para renovarla en 1 segundo."
                  : err,
                actionRequired: isExpired ? "open_settings" : undefined,
              });
            }
          } catch (e: any) {
            reports.push({
              channel: "YouTube Shorts",
              success: false,
              message: `Error de conexión: ${e.message}`,
            });
          }
        } else {
          reports.push({
            channel: "YouTube Shorts",
            success: false,
            message: "Canal no conectado. Pulsa 'Abrir Configuración' y conecta tu canal de Google.",
            actionRequired: "open_settings",
          });
        }
      }

      // 3. TIKTOK (API REAL CONTENT POSTING)
      if (channels.tiktok) {
        setPublishStep("Enviando vídeo a TikTok...");

        const ttToken = localStorage.getItem("omnipost_tiktok_token");

        if (ttToken) {
          try {
            const ttRes = await fetch("/api/publish/tiktok", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoUrl: targetVideoUrl,
                title: `${title} ${hashtags.slice(0, 4).join(" ")}`,
                token: ttToken,
                privacyLevel: "PUBLIC_TO_EVERYONE",
              }),
            });
            const ttData = await ttRes.json();
            if (ttData.success) {
              reports.push({
                channel: "TikTok",
                success: true,
                message: `¡Publicado con éxito en TikTok! (Publish ID: ${ttData.publishId})`,
              });
            } else {
              reports.push({
                channel: "TikTok",
                success: false,
                message: ttData.error || "Error al publicar en TikTok.",
              });
            }
          } catch (e: any) {
            reports.push({
              channel: "TikTok",
              success: false,
              message: `Error de conexión: ${e.message}`,
            });
          }
        } else {
          reports.push({
            channel: "TikTok",
            success: false,
            message: "TikTok requiere autorización. Pulsa 'Abrir Configuración' y haz clic en 'Conectar TikTok' para autorizar tu perfil.",
            actionRequired: "open_settings",
          });
        }
      }

      setPublishReports(reports);
      setPublishStep(null);
    } catch (e: any) {
      alert("Error en el proceso de publicación: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Publicación con el Robot Local (Vídeos, Posts de Imagen y Texto)
  const handlePublishWithBot = async () => {
    const activeMedia = postType === "image" ? imageFile : postType === "video" ? videoFile : null;

    if (postType !== "text" && !activeMedia) {
      alert(`Por favor arrastra o sube un archivo de ${postType === "image" ? "imagen (.jpg, .png)" : "vídeo (.mp4)"} antes de publicar.`);
      return;
    }
    if (!title && !description) {
      alert("Por favor define o genera un título o texto para el post.");
      return;
    }

    const activeChannels = Object.entries(channels)
      .filter(([_, active]) => active)
      .map(([k]) => k);

    if (activeChannels.length === 0) {
      alert("Selecciona al menos una red social donde publicar.");
      return;
    }

    setIsPublishing(true);
    const activeProfileObj = profiles.find((p) => p.id === selectedProfile);
    const profileLabel = activeProfileObj ? activeProfileObj.name : selectedProfile;

    setPublishStep(`Iniciando robot para '${profileLabel}' (${postType.toUpperCase()})...`);
    setPublishReports([]);

    try {
      const formData = new FormData();
      if (activeMedia) {
        formData.append("media", activeMedia);
      }
      formData.append("title", title);
      formData.append("description", description);
      formData.append("hashtags", hashtags.join(" "));
      formData.append("platforms", activeChannels.join(","));
      formData.append("profile", selectedProfile);
      formData.append("postType", postType);

      setPublishStep(`El robot está abriendo Chrome para publicar en ${activeChannels.map((c) => c.toUpperCase()).join(", ")}...`);

      const res = await fetch("/api/publish/bot", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      const reports: PublishReportItem[] = [];

      if (json.results && typeof json.results === "object") {
        for (const [platform, result] of Object.entries<any>(json.results)) {
          reports.push({
            channel: platform,
            success: result.success,
            message: result.message || result.error || "Completado",
          });
        }
      } else {
        reports.push({
          channel: "Robot de Publicación",
          success: json.success,
          message: json.success
            ? "¡Publicación completada en todas las redes con éxito!"
            : (json.error || "Hubo un error al ejecutar el robot"),
        });
      }

      setPublishReports(reports);
    } catch (err: any) {
      setPublishReports([
        {
          channel: "Robot Local",
          success: false,
          message: `Error de conexión con el robot local: ${err.message}`,
        },
      ]);
    } finally {
      setIsPublishing(false);
      setPublishStep(null);
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
              {(isInstagramConfigured || isYouTubeConfigured || isTikTokConfigured) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Selector de Modo: Vídeo Reel vs Post con Foto vs Solo Texto */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl gap-2">
            <button
              type="button"
              onClick={() => {
                setPostType("video");
                setChannels({ youtube: true, instagram: true, facebook: true, tiktok: true, x: true });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                postType === "video"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileVideo className="w-4 h-4" />
              <span>🎬 Reel / Vídeo Vertical</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPostType("image");
                setChannels({ youtube: false, instagram: true, facebook: true, tiktok: true, x: true });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                postType === "image"
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>📸 Post con Foto / Imagen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPostType("text");
                setChannels({ youtube: false, instagram: false, facebook: true, tiktok: false, x: true });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                postType === "text"
                  ? "bg-gradient-to-r from-neutral-700 to-neutral-800 text-white shadow-lg shadow-neutral-800/40"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Type className="w-4 h-4" />
              <span>📝 Post de Solo Texto</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Subida Multimedia o Modo Texto */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur shadow-sm">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                {postType === "video" && <FileVideo className="w-5 h-5 text-indigo-400" />}
                {postType === "image" && <ImageIcon className="w-5 h-5 text-pink-400" />}
                {postType === "text" && <Type className="w-5 h-5 text-cyan-400" />}
                <span>
                  {postType === "video" && "1. Archivo de Vídeo (Reel / Short)"}
                  {postType === "image" && "1. Foto o Imagen del Post"}
                  {postType === "text" && "1. Modo Post de Texto"}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                {postType === "video" && "Sube tu vídeo vertical (9:16) para Shorts, Reels y TikTok."}
                {postType === "image" && "Sube tu foto o diseño (1:1 o 4:5) para el feed de Instagram y X."}
                {postType === "text" && "Crea un post directo o hilo para publicar en X (Twitter)."}
              </p>

              {/* MODO VIDEO */}
              {postType === "video" && (
                <>
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
                              setExtractedFrames([]);
                              setAiSummary("");
                            }}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>

                      {/* Estado y Miniaturas de Fotogramas para la IA */}
                      {isExtractingFrames && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-xs animate-pulse">
                          <Sparkles className="w-4 h-4 animate-spin text-amber-300 flex-shrink-0" />
                          <span>Analizando escenas y extrayendo fotogramas para visión IA...</span>
                        </div>
                      )}

                      {extractedFrames.length > 0 && (
                        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              Visión IA: {extractedFrames.length} fotogramas capturados
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">Gemini Vision</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {extractedFrames.map((frame, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-[9/16] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 group"
                              >
                                <img
                                  src={frame}
                                  alt={`Escena ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-[9px] px-1 py-0.2 rounded text-neutral-300 font-mono">
                                  #{idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-neutral-400 text-center">
                            La IA analizará estos fotogramas para redactar el título y descripción exactos de tu vídeo.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* URL pública opcional */}
                  <div className="mt-4 pt-4 border-t border-neutral-800/60">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1">
                      <LinkIcon className="w-3 h-3 text-pink-400" />
                      URL pública del vídeo (.mp4 para Instagram, Shorts y TikTok):
                    </label>
                    <input
                      type="text"
                      value={publicVideoUrl}
                      onChange={(e) => setPublicVideoUrl(e.target.value)}
                      placeholder="https://.../mi_video.mp4 (o déjalo vacío para usar demo)"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </>
              )}

              {/* MODO FOTO / IMAGEN */}
              {postType === "image" && (
                <>
                  {!imageUrl ? (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleImageChange(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-neutral-700/80 hover:border-pink-500/80 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-neutral-950/40 hover:bg-neutral-950/80 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-neutral-800/80 group-hover:bg-pink-950 flex items-center justify-center transition-colors">
                        <ImageIcon className="w-7 h-7 text-neutral-400 group-hover:text-pink-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-200">
                          Arrastra tu foto o imagen aquí
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Soporta .jpg, .jpeg, .png, .webp (para post de Instagram o X)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Vista previa de la imagen */}
                      <div className="relative rounded-2xl overflow-hidden bg-neutral-950 max-h-[460px] mx-auto border border-neutral-800 shadow-xl flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt="Post preview"
                          className="w-full h-auto max-h-[440px] object-contain rounded-2xl"
                        />
                      </div>

                      {/* Datos del archivo */}
                      <div className="flex items-center justify-between text-xs text-neutral-400 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                        <div className="truncate max-w-[200px] text-neutral-300 font-medium">
                          {imageFile?.name}
                        </div>
                        <div className="flex items-center gap-3">
                          {imageFile && (
                            <span className="text-neutral-500 font-mono">
                              {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImageUrl(null);
                              setExtractedFrames([]);
                              setAiSummary("");
                            }}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Cambiar imagen
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Imagen lista para análisis visual con Gemini y publicación en Instagram / X</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* MODO SOLO TEXTO */}
              {postType === "text" && (
                <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-400">
                    <Type className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Publicación de Solo Texto</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      No necesitas subir fotos ni vídeos. Escribe tu tema a continuación y Gemini creará tweets o textos persuasivos para publicar directamente en X (Twitter).
                    </p>
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

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageChange(e.target.files[0]);
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
                    placeholder="Ej: Vídeo motivacional sobre disciplina y constancia..."
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

              {/* Lo que Gemini ha detectado visualmente */}
              {aiSummary && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/60 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Análisis visual de Gemini:</span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/70">
                    &ldquo;{aiSummary}&rdquo;
                  </p>
                </div>
              )}

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

              {/* Selector de Perfil / Marca / Cliente */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Perfil o Cliente Destino:</span>
                  </label>
                  <button
                    onClick={fetchProfiles}
                    disabled={isLoadingProfiles}
                    title="Actualizar lista de perfiles"
                    className="text-[11px] text-neutral-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingProfiles ? "animate-spin" : ""}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                <select
                  value={selectedProfile}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>
                    Carpeta: <span className="font-mono text-neutral-400">profiles/{selectedProfile}/</span>
                  </span>
                  <span className="text-indigo-400 font-medium">Multi-cuenta activo</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                Selecciona las plataformas donde deseas publicar este vídeo en simultáneo:
              </p>

              {/* Toggles de las 5 Redes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* YouTube */}
                <div
                  onClick={() => {
                    if (postType === "video") {
                      setChannels({ ...channels, youtube: !channels.youtube });
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    postType !== "video"
                      ? "bg-neutral-950/20 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-40"
                      : channels.youtube
                      ? "bg-red-950/20 border-red-800/60 text-white shadow-lg shadow-red-950/20 cursor-pointer"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60 cursor-pointer"
                  }`}
                  title={postType !== "video" ? "YouTube Shorts solo admite formato vídeo" : ""}
                >
                  <div className="flex items-center gap-2">
                    <YouTubeIcon className={`w-4 h-4 ${postType === "video" && channels.youtube ? "text-red-500" : "text-neutral-500"}`} />
                    <div>
                      <span className="text-xs font-semibold block">Shorts</span>
                      <span className="text-[10px] text-red-400/90 font-medium">
                        {postType === "video" ? "YouTube" : "Solo Vídeo"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      postType === "video" && channels.youtube ? "bg-red-500 border-red-500 text-white" : "border-neutral-700"
                    }`}
                  >
                    {postType === "video" && channels.youtube && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Instagram */}
                <div
                  onClick={() => {
                    if (postType !== "text") {
                      setChannels({ ...channels, instagram: !channels.instagram });
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    postType === "text"
                      ? "bg-neutral-950/20 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-40"
                      : channels.instagram
                      ? "bg-pink-950/20 border-pink-800/60 text-white shadow-lg shadow-pink-950/20 cursor-pointer"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60 cursor-pointer"
                  }`}
                  title={postType === "text" ? "Instagram requiere foto o vídeo" : ""}
                >
                  <div className="flex items-center gap-2">
                    <InstagramIcon className={`w-4 h-4 ${postType !== "text" && channels.instagram ? "text-pink-500" : "text-neutral-500"}`} />
                    <div>
                      <span className="text-xs font-semibold block">
                        {postType === "image" ? "Feed Post" : "Reels"}
                      </span>
                      <span className="text-[10px] text-pink-400/90 font-medium">Instagram</span>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      postType !== "text" && channels.instagram ? "bg-pink-500 border-pink-500 text-white" : "border-neutral-700"
                    }`}
                  >
                    {postType !== "text" && channels.instagram && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Facebook */}
                <div
                  onClick={() => setChannels({ ...channels, facebook: !channels.facebook })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    channels.facebook
                      ? "bg-blue-950/20 border-blue-800/60 text-white shadow-lg shadow-blue-950/20"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FacebookIcon className={`w-4 h-4 ${channels.facebook ? "text-blue-500" : "text-neutral-500"}`} />
                    <div>
                      <span className="text-xs font-semibold block">Facebook</span>
                      <span className="text-[10px] text-blue-400/90 font-medium">
                        {postType === "video" ? "Reels" : "Feed Post"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      channels.facebook ? "bg-blue-500 border-blue-500 text-white" : "border-neutral-700"
                    }`}
                  >
                    {channels.facebook && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* TikTok */}
                <div
                  onClick={() => {
                    if (postType !== "text") {
                      setChannels({ ...channels, tiktok: !channels.tiktok });
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    postType === "text"
                      ? "bg-neutral-950/20 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-40"
                      : channels.tiktok
                      ? "bg-cyan-950/20 border-cyan-800/60 text-white shadow-lg shadow-cyan-950/20 cursor-pointer"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TikTokIcon className={`w-4 h-4 ${postType !== "text" && channels.tiktok ? "text-cyan-400" : "text-neutral-500"}`} />
                    <div>
                      <span className="text-xs font-semibold block">TikTok</span>
                      <span className="text-[10px] text-cyan-400/90 font-medium">
                        {postType === "image" ? "Foto Post" : "Vídeo"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      postType !== "text" && channels.tiktok ? "bg-cyan-500 border-cyan-500 text-black" : "border-neutral-700"
                    }`}
                  >
                    {postType !== "text" && channels.tiktok && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* X (Twitter) */}
                <div
                  onClick={() => setChannels({ ...channels, x: !channels.x })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    channels.x
                      ? "bg-neutral-800 border-neutral-600 text-white shadow-lg shadow-neutral-900/40"
                      : "bg-neutral-950/30 border-neutral-800/60 text-neutral-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XIcon className={`w-4 h-4 ${channels.x ? "text-white" : "text-neutral-500"}`} />
                    <div>
                      <span className="text-xs font-semibold block">X (Twitter)</span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {postType === "text" ? "Tweet" : "Post"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      channels.x ? "bg-white border-white text-black" : "border-neutral-700"
                    }`}
                  >
                    {channels.x && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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

              {publishReports.length > 0 && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    publishReports.every((r) => r.success)
                      ? "bg-emerald-950/40 border-emerald-800/60"
                      : publishReports.some((r) => r.success)
                      ? "bg-amber-950/30 border-amber-800/60"
                      : "bg-neutral-900/90 border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {publishReports.every((r) => r.success) ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      <p className="text-xs font-bold text-white">
                        {publishReports.every((r) => r.success)
                          ? "¡Vídeo publicado con éxito en todas las redes!"
                          : publishReports.some((r) => r.success)
                          ? "Publicación parcial completada:"
                          : "Informe de publicación:"}
                      </p>
                    </div>
                    {publishReports.some((r) => !r.success && r.actionRequired) && (
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm shadow-indigo-600/30"
                      >
                        Abrir Configuración
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                    {publishReports.map((report, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                          report.success
                            ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-300"
                            : "bg-neutral-950/70 border-neutral-800 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {report.success ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                            )}
                            {report.channel}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              report.success
                                ? "bg-emerald-900/60 text-emerald-300"
                                : "bg-amber-950 text-amber-400 border border-amber-800/60"
                            }`}
                          >
                            {report.success ? "Publicado" : "Pendiente"}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed pl-3.5">
                          {report.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Principal: Robot Autónomo Local */}
              <button
                onClick={handlePublishWithBot}
                disabled={isPublishing || (postType === "video" && !videoFile) || (postType === "image" && !imageFile)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bot className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? "Robot publicando en segundo plano..."
                    : `🤖 Publicar ${postType === "image" ? "Post con Foto" : postType === "text" ? "Post de Texto" : "Vídeo / Reel"} en "${profiles.find((p) => p.id === selectedProfile)?.name || selectedProfile}"`}
                </span>
              </button>

              {/* Opción secundaria: APIs Directas OAuth */}
              <div className="pt-1 text-center">
                <button
                  onClick={handlePublishAll}
                  disabled={isPublishing || (!videoFile && !publicVideoUrl)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 underline decoration-neutral-700 hover:decoration-neutral-400 transition-colors"
                >
                  O publicar mediante APIs directas (OAuth Cloud)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Configuración */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
