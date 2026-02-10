declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface PWAConfig {
        dest?: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: any[];
        buildExcludes?: string[];
        publicExcludes?: string[];
    }

    export default function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
