import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas';
import path from 'path';

// Patch Node.js environment for face-api.js
faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any, ImageData: ImageData as any });

const MODELS_URL = path.join(process.cwd(), 'public/models');

let isModelLoaded = false;

export const loadModels = async () => {
    if (isModelLoaded) return;

    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_URL),
    ]);

    isModelLoaded = true;
};

export const getFaceEmbedding = async (imageBuffer: Buffer): Promise<Float32Array | null> => {
    await loadModels();

    const img = await (faceapi.env.getEnv().createCanvasElement() as any); // Mock canvas creation
    // Load image from buffer logic here depends on 'canvas' lib specifics
    const image = await faceapi.bufferToImage(imageBuffer);

    const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    return dot / (magA * magB);
};
