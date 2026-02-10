'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (base64: string) => void;
    label?: string;
    isProcessing?: boolean; // NEW: From parent to disable button
}

export default function CameraCapture({ onCapture, label = "Ambil Foto", isProcessing = false }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // NEW: Camera loading
    const [isTakingPhoto, setIsTakingPhoto] = useState(false); // NEW: Photo capture

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        setIsLoading(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false);
                };
            }
            setError(null);
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Gagal mengakses kamera. Pastikan izin diberikan.");
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current || isTakingPhoto || isProcessing) return;

        setIsTakingPhoto(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            // OPTIMIZE: Resize untuk mengurangi ukuran file drastis
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 960;

            let width = video.videoWidth;
            let height = video.videoHeight;

            // Maintain aspect ratio while resizing
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            // Set canvas to resized dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw resized video frame
            context.drawImage(video, 0, 0, width, height);

            // Add Watermark (Timestamp)
            const now = new Date();
            const timestamp = now.toLocaleString('id-ID', {
                dateStyle: 'full',
                timeStyle: 'medium'
            });

            // Adjust font size based on canvas size (responsive watermark)
            const fontSize = Math.max(16, Math.min(width / 40, 24));
            context.font = `bold ${fontSize}px monospace`;
            context.fillStyle = 'white';
            context.strokeStyle = 'black';
            context.lineWidth = 2;
            context.textAlign = 'right';

            const x = width - 10;
            const y = height - 10;

            context.strokeText(timestamp, x, y);
            context.fillText(timestamp, x, y);

            // OPTIMIZE: Compress aggressively (65% quality = 80-90% size reduction)
            // Still looks great for attendance verification!
            const dataUrl = canvas.toDataURL('image/jpeg', 0.65);

            // Small delay for visual feedback
            setTimeout(() => {
                setIsTakingPhoto(false);
                onCapture(dataUrl);
            }, 200);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-200 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={startCamera} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
                    <Loader2 className="animate-spin text-white mb-4" size={48} />
                    <p className="text-white font-bold text-sm">Membuka Kamera...</p>
                </div>
            )}

            {/* Flash Effect when taking photo */}
            {isTakingPhoto && (
                <div className="absolute inset-0 bg-white z-20 animate-flash" />
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-6 left-0 right-0 flex justify-center pb-safe z-20">
                <button
                    onClick={takePhoto}
                    type="button"
                    disabled={isLoading || isTakingPhoto || isProcessing}
                    className={`bg-white/90 p-4 rounded-full shadow-xl transition-all border-4 ${isLoading || isTakingPhoto || isProcessing
                        ? 'opacity-50 cursor-not-allowed border-gray-400'
                        : 'active:scale-95 border-gray-200 hover:bg-white'
                        }`}
                    aria-label="Ambil Foto"
                >
                    {isTakingPhoto || isProcessing ? (
                        <Loader2 className="animate-spin text-black" size={32} />
                    ) : (
                        <Camera size={32} className="text-black" />
                    )}
                </button>
            </div>

            {label && (
                <div className="absolute top-4 left-4 right-4 text-center">
                    <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
}
