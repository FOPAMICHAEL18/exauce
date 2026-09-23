import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    images: {
        unoptimized: true,
        remotePatterns: [
        { protocol: 'https', hostname: 'images.unsplash.com' },
        { protocol: 'https', hostname: 'res.cloudinary.com' },
        { protocol: 'https', hostname: 'picsum.photos' },
        // ... tous les domaines que tu utilises pour les images produits
        ],
    },
};

export default nextConfig;
