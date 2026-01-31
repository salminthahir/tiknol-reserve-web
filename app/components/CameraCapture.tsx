'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (base64: string) => void;
    label?: string;
}

export default function CameraCapture({ onCapture, label = "Ambil Foto" }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Gagal mengakses kamera. Pastikan izin diberikan.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Add Watermark (Timestamp)
            const now = new Date();
            const timestamp = now.toLocaleString('id-ID', {
                dateStyle: 'full',
                timeStyle: 'medium'
            });

            context.font = 'bold 24px monospace';
            context.fillStyle = 'white';
            context.strokeStyle = 'black';
            context.lineWidth = 3;
            context.textAlign = 'right';

            const x = canvas.width - 20;
            const y = canvas.height - 20;

            context.strokeText(timestamp, x, y);
            context.fillText(timestamp, x, y);

            // Convert to Base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(dataUrl);
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
                    className="bg-white/90 p-4 rounded-full shadow-xl active:scale-95 transition-transform border-4 border-gray-200"
                    aria-label="Ambil Foto"
                >
                    <Camera size={32} className="text-black" />
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
