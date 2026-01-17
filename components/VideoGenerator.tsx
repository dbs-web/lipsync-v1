"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mic, Image as ImageIcon, Video as VideoIcon, Loader2, Play, AlertCircle, RefreshCw, Smartphone, X } from "lucide-react";

export default function VideoGenerator() {
    const videos = useQuery(api.videos.getVideos) || [];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<"portrait" | "landscape">("portrait");
    const [orientationInfo, setOrientationInfo] = useState<{ type: "portrait" | "landscape"; message: string } | null>(null);
    const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
    const [modalVideo, setModalVideo] = useState<{ url: string; id: string } | null>(null);

    // Detect image orientation when file is selected
    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setOrientationInfo(null);

        if (!file) return;

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            if (width > height) {
                setAspectRatio("landscape");
                setOrientationInfo({ type: "landscape", message: "Imagem Horizontal" });
            } else {
                setAspectRatio("portrait");
                setOrientationInfo({ type: "portrait", message: "Imagem Vertical" });
            }

            URL.revokeObjectURL(url);
        };

        img.src = url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!imageFile || !audioFile) {
            setError("Please select both image and audio files.");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("audio", audioFile);
            formData.append("aspectRatio", aspectRatio);

            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate video");
            }

            // Reset form
            setImageFile(null);
            setAudioFile(null);
            setOrientationInfo(null);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async (videoId: string) => {
        setCheckingStatus(videoId);
        try {
            const res = await fetch(`/api/status?videoId=${videoId}`);
            if (!res.ok) {
                console.error("Failed to check status");
            }
        } catch (err) {
            console.error("Error checking status:", err);
        } finally {
            setCheckingStatus(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Lipsync v1
                </h1>
                <p className="text-gray-500">Crie seu próprio vídeo com lipsync perfeito.</p>
            </div>

            {/* Upload Form */}
            <div className="bg-white/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <div className={`
                relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
                ${imageFile ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
              `}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                    <div className={`p-3 rounded-full ${imageFile ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <ImageIcon size={24} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {imageFile ? imageFile.name : "Upload Image"}
                                        </p>
                                        <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Orientation Indicator */}
                            {orientationInfo && (
                                <div className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium
                  ${orientationInfo.type === 'portrait' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}
                `}>
                                    <Smartphone
                                        size={18}
                                        className={orientationInfo.type === 'landscape' ? 'rotate-90' : ''}
                                    />
                                    <span>{orientationInfo.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Audio Upload */}
                        <div className={`
              relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
              ${audioFile ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
            `}>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className={`p-3 rounded-full ${audioFile ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Mic size={24} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {audioFile ? audioFile.name : "Upload Audio"}
                                    </p>
                                    <p className="text-xs text-gray-500">MP3, WAV (Max 5MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !imageFile || !audioFile}
                        className={`
              w-full py-3 px-6 rounded-xl font-medium text-white shadow-lg transition-all
              ${loading || !imageFile || !audioFile
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-purple-500/25 active:scale-[0.99]'}
            `}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Generating...</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center space-x-2">
                                <VideoIcon size={20} />
                                <span>Generate Video</span>
                            </span>
                        )}
                    </button>

                    {error && (
                        <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </form>
            </div>

            {/* Results List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No videos generated yet.
                        </div>
                    ) : (
                        videos.map((video) => (
                            <div
                                key={video._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
                            >
                                {/* Thumbnail */}
                                <div
                                    className="relative aspect-video bg-gray-100 cursor-pointer"
                                    onClick={() => video.status === 'completed' && video.url && setModalVideo({ url: video.url, id: video.heygenId })}
                                >
                                    {video.thumbnailUrl ? (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <VideoIcon size={32} className="text-gray-300" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    {video.status === 'completed' && video.url && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="p-3 bg-white/90 rounded-full">
                                                <Play size={24} className="text-purple-600" />
                                            </div>
                                        </div>
                                    )}

                                    {video.status === 'processing' && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white" size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${video.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                video.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}
                    `}>
                                            {video.status}
                                        </span>

                                        {video.status === 'processing' && (
                                            <button
                                                onClick={() => checkStatus(video.heygenId)}
                                                disabled={checkingStatus === video.heygenId}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Check Status"
                                            >
                                                <RefreshCw
                                                    size={14}
                                                    className={`text-gray-400 ${checkingStatus === video.heygenId ? 'animate-spin' : ''}`}
                                                />
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-400">
                                        {new Date(video.createdAt).toLocaleString()}
                                    </p>

                                    {video.error && (
                                        <p className="text-xs text-red-500 truncate">{video.error}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Video Modal */}
            {modalVideo && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setModalVideo(null)}
                >
                    <div
                        className="relative bg-black rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setModalVideo(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                        <video
                            src={modalVideo.url}
                            controls
                            autoPlay
                            className="w-full h-auto max-h-[90vh]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
