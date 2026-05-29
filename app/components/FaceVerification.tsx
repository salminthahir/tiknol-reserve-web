'use client';

import { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, ScanFace, CheckCircle2, Smile, User } from 'lucide-react';

interface FaceVerificationProps {
    onVerified: (embedding: number[], photoBase64: string) => void;
    onCancel: () => void;
}

type LivenessStep = 'DETECT_FACE' | 'DETECT_NEUTRAL' | 'DETECT_SMILE' | 'DONE';

export default function FaceVerification({ onVerified, onCancel }: FaceVerificationProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [message, setMessage] = useState('Memuat AI...');
    const [livenessStep, setLivenessStep] = useState<LivenessStep>('DETECT_FACE');
    const [debugExpression, setDebugExpression] = useState<string>('');

    // Load Models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Added Expression Net
            ]);
            setIsModelLoaded(true);
            setMessage('Posisikan wajah di tengah kamera.');
            startVideo();
        };
        loadModels();
        return () => stopVideo();
    }, []);

    const startVideo = async () => {
        try {
            let stream: MediaStream;
            try {
                // First try to get explicit user camera (better for phones)
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });
            } catch (err: any) {
                // Fallback for basic camera (desktops, external Webcams)
                console.warn("FacingMode failed, falling back:", err);
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error("Camera Error:", err);
            setMessage(`Gagal akses kamera (${err.name || 'Error'})`);
        }
    };

    const stopVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Main Detection Loop
    useEffect(() => {
        if (!isModelLoaded || !videoRef.current) return;

        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
            if (livenessStep === 'DONE') return;

            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceExpressions() // Added Expressions
                .withFaceDescriptor();

            if (detection) {
                const { expressions } = detection;

                // Debug UI
                const maxExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
                setDebugExpression(`${maxExpression[0]} (${Math.round(maxExpression[1] * 100)}%)`);

                processLiveness(expressions);
            } else {
                setDebugExpression('No Face');
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isModelLoaded, livenessStep]);

    // Liveness State Machine
    const processLiveness = (expressions: faceapi.FaceExpressions) => {
        const NEUTRAL_THRESHOLD = 0.6; // High confidence for neutral
        const HAPPY_THRESHOLD = 0.7;   // High confidence for smiling

        if (livenessStep === 'DETECT_FACE') {
            setLivenessStep('DETECT_NEUTRAL');
            setMessage('Pasang wajah NETRAL / Datar');
        }

        if (livenessStep === 'DETECT_NEUTRAL') {
            // Ensure user is NOT smiling heavily (neutral or maybe angry/sad is fine, just not happy)
            if (expressions.neutral > NEUTRAL_THRESHOLD || (expressions.happy < 0.1 && expressions.neutral > 0.4)) {
                // Buffer to ensure it's stable? For now instant transition
                setLivenessStep('DETECT_SMILE');
                setMessage('Sekarang, SENYUM Lebar! 😁');
            }
        }

        if (livenessStep === 'DETECT_SMILE') {
            if (expressions.happy > HAPPY_THRESHOLD) {
                handleLivenessSuccess();
            }
        }
    };


    const handleLivenessSuccess = async () => {
        if (livenessStep === 'DONE') return;
        setLivenessStep('DONE');
        setMessage('Sempurna! Memverifikasi...');

        try {
            // Wait a slight moment to capture the smile or neutral? 
            // Better to capture the smile as it's a positive confirmation
            await new Promise(r => setTimeout(r, 200));

            if (videoRef.current) {
                const detection = await faceapi.detectSingleFace(videoRef.current)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(videoRef.current, 0, 0);
                        const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        onVerified(Array.from(detection.descriptor), photoBase64);
                    } else {
                        throw new Error('Canvas context null');
                    }
                } else {
                    throw new Error('Wajah tidak terdeteksi saat capture final');
                }
            }
        } catch (error) {
            console.error("Liveness capture error:", error);
            setMessage('Gagal capture wajah. Silakan ulangi.');
            // Small delay to let user read the error before resetting
            setTimeout(() => {
                setLivenessStep('DETECT_NEUTRAL');
                setMessage('Pasang wajah NETRAL / Datar');
            }, 2000);
        }
    };

    // Eye Aspect Ratio Formula
    const getEAR = (eye: faceapi.Point[]) => {
        // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
        const p1 = eye[0];
        const p2 = eye[1];
        const p3 = eye[2];
        const p4 = eye[3];
        const p5 = eye[4];
        const p6 = eye[5];

        const dist = (p1: faceapi.Point, p2: faceapi.Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const A = dist(p2, p6);
        const B = dist(p3, p5);
        const C = dist(p1, p4);

        return (A + B) / (2.0 * C);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] bg-black overflow-hidden rounded-2xl border-4 border-[#333]">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror
                />

                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
                    <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl text-center border border-white/10 shadow-2xl">

                        {/* Status Icon */}
                        <div className="flex justify-center mb-4">
                            {livenessStep === 'DONE' && <CheckCircle2 size={48} className="text-green-500 animate-bounce" />}
                            {livenessStep === 'DETECT_SMILE' && <Smile size={48} className="text-[#FBC02D] animate-pulse" />}
                            {livenessStep === 'DETECT_NEUTRAL' && <User size={48} className="text-white" />}
                            {livenessStep === 'DETECT_FACE' && <ScanFace size={48} className="text-gray-400 animate-pulse" />}
                        </div>

                        <h3 className="text-[#FBC02D] font-black uppercase text-xl mb-2">
                            {livenessStep === 'DONE' ? 'Terverifikasi' : 'Cek Keaslian'}
                        </h3>
                        <p className="text-white font-bold text-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {message}
                        </p>

                        {/* Low-key debug info if needed, maybe hide in production */}
                        {/* <p className="text-[10px] text-gray-500 mt-2 font-mono">{debugExpression}</p> */}
                    </div>

                    {livenessStep !== 'DONE' && (
                        <div className="text-center">
                            <button onClick={onCancel} className="text-white font-bold text-xs uppercase tracking-widest hover:text-red-500 bg-black/50 px-6 py-3 rounded-full transition-colors border border-white/10">
                                Batalkan
                            </button>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {!isModelLoaded && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                        <Loader2 className="animate-spin text-[#FBC02D] mb-4" size={48} />
                        <p className="text-white font-bold animate-pulse">Memuat Model AI...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
