'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Camera } from 'lucide-react';

interface FaceEnrollmentProps {
    employeeId: string;
    onSuccess?: () => void;
}

type Step = 'STRAIGHT' | 'LEFT' | 'RIGHT' | 'UP' | 'DONE';

const STEPS: { id: Step; label: string; count: number; icon: any }[] = [
    { id: 'STRAIGHT', label: 'Lihat Lurus ke Kamera', count: 2, icon: Camera },
    { id: 'LEFT', label: 'Toleh Kiri Sedikit', count: 1, icon: ArrowLeft },
    { id: 'RIGHT', label: 'Toleh Kanan Sedikit', count: 1, icon: ArrowRight },
    { id: 'UP', label: 'Angkat Dagu Sedikit', count: 1, icon: ArrowUp },
];

export default function FaceEnrollment({ employeeId, onSuccess }: FaceEnrollmentProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null); // Store timer ID
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [capturedEmbeddings, setCapturedEmbeddings] = useState<Float32Array[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [message, setMessage] = useState('Memuat Model AI...');
    const [processing, setProcessing] = useState(false);

    // 1. Load Models 
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setIsModelLoaded(true);
            setMessage('Siap. Silakan mulai pendaftaran.');
        };
        loadModels();

        // Cleanup timer on unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startVideo = async () => {
        setCapturedEmbeddings([]);
        setCurrentStepIndex(0);
        setIsCapturing(true); // Force UI update immediately
        setMessage('Memulai kamera...');

        try {
            let stream: MediaStream;
            try {
                // Try to get front camera explicitly
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });
            } catch (err: any) {
                // Fallback if overconstrained (e.g., PC with generic webcam)
                console.warn("FacingMode failed, falling back to basic video:", err);
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // Add a small delay to ensure video plays before starting step
            setTimeout(() => startStep(0), 500);
        } catch (err: any) {
            console.error("Final camera error:", err);
            setIsCapturing(false); // Reset UI
            setMessage(`Akses Kamera Ditolak (${err.name || 'Error'})`);
        }
    };

    const startStep = (stepIndex: number) => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (stepIndex >= STEPS.length) {
            finishEnrollment();
            return;
        }

        const step = STEPS[stepIndex];
        setCurrentStepIndex(stepIndex); // Ensure state is explicitly set
        setMessage(step.label);
        setCountdown(3);
        setIsCapturing(true);

        // Start new timer
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null) return 3;
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    // Provide a small buffer before capturing to ensure UI updates
                    setTimeout(() => captureStep(stepIndex), 200);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const captureStep = async (stepIdx: number) => {
        if (!videoRef.current) return;

        // Ensure we use the step definition matching the passed index
        const step = STEPS[stepIdx];

        setProcessing(true);
        const stepEmbeddings: Float32Array[] = [];
        let failures = 0;

        for (let i = 0; i < step.count; i++) {
            try {
                const detection = await faceapi.detectSingleFace(videoRef.current)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    stepEmbeddings.push(detection.descriptor);
                } else {
                    setMessage('Wajah tidak terdeteksi! Ulangi...');
                    i--;
                    failures++;
                    if (failures > 10) break; // Safety break
                    await new Promise(r => setTimeout(r, 500));
                }
                await new Promise(r => setTimeout(r, 300)); // Gap between multi-shots
            } catch (e) {
                console.error(e);
            }
        }

        if (stepEmbeddings.length > 0) {
            setCapturedEmbeddings(prev => {
                const newEmbeddings = [...prev, ...stepEmbeddings];
                // Check if this was the last step by length or index
                if (stepIdx === STEPS.length - 1) {
                    // Properly finish using the FRESH embeddings
                    finishEnrollment(newEmbeddings);
                } else {
                    // Trigger next step
                    const nextIndex = stepIdx + 1;
                    setCurrentStepIndex(nextIndex);
                    setTimeout(() => startStep(nextIndex), 1000);
                }
                return newEmbeddings;
            });
            setProcessing(false);
        } else {
            setMessage("Gagal menangkap wajah. Coba lagi.");
            setIsCapturing(false);
            setProcessing(false);
        }
    };

    const isFinished = useRef(false);

    const finishEnrollment = async (finalEmbeddings?: Float32Array[]) => {
        if (isFinished.current) return;

        // Prefer passed embeddings, fallback to state (but state might be stale if not careful)
        const embeddingsToSubmit = finalEmbeddings || capturedEmbeddings;

        if (embeddingsToSubmit.length === 0) {
            setMessage("Error: Tidak ada data wajah yang tersimpan.");
            return;
        }

        isFinished.current = true;
        stopVideo();
        setMessage('Menyimpan data wajah...');
        setProcessing(true);

        const payload = embeddingsToSubmit.map(e => Array.from(e));

        try {
            const res = await fetch(`/api/admin/employees/${employeeId}/enroll-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeddings: payload })
            });

            if (res.ok) {
                setMessage('Pendaftaran Wajah Berhasil!');
                if (onSuccess) onSuccess();
            } else {
                setMessage('❌ Gagal menyimpan data.');
                isFinished.current = false; // Allow retry if failed
            }
        } catch (error) {
            setMessage('Error koneksi.');
            isFinished.current = false; // Allow retry
        } finally {
            setProcessing(false);
        }
    };

    const stopVideo = () => {
        setIsCapturing(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const currentStep = STEPS[currentStepIndex];

    return (
        <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-4">Pendaftaran Wajah</h3>

            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 shadow-inner">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${processing ? 'opacity-50' : 'opacity-100'}`}
                />

                {/* Overlays */}
                {!isCapturing && !message.includes('Berhasil') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white backdrop-blur-sm">
                        <button
                            onClick={startVideo}
                            disabled={!isModelLoaded}
                            className="bg-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg"
                        >
                            {isModelLoaded ? 'Mulai Pendaftaran' : 'Memuat Model AI...'}
                        </button>
                    </div>
                )}

                {/* Countdown */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
                            {countdown}
                        </span>
                    </div>
                )}

                {/* Step Guide Icon */}
                {isCapturing && countdown === null && !processing && (
                    <div className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white backdrop-blur-md border border-white/20">
                        {currentStep && <currentStep.icon size={32} />}
                    </div>
                )}

                {/* Success Overlay */}
                {message.includes('Berhasil') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                        <div className="bg-white p-4 rounded-full shadow-xl">
                            <CheckCircle2 size={64} className="text-green-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Instruction Text */}
            <div className="text-center min-h-[60px]">
                {isCapturing ? (
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                            Langkah {Math.min(currentStepIndex + 1, STEPS.length)} dari {STEPS.length}
                        </p>
                        <h4 className="text-2xl font-black text-blue-600 animate-in fade-in slide-in-from-bottom-2">
                            {currentStep?.label}
                        </h4>
                    </div>
                ) : (
                    <p className={`font-bold text-lg ${message.includes('Berhasil') ? 'text-green-600' : 'text-gray-600'}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            {isCapturing && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(((currentStepIndex) / STEPS.length) * 100, 100)}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
}
