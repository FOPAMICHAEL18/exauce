import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    images: {
        remotePatterns: [
        { protocol: 'https', hostname: 'images.unsplash.com' },
        { protocol: 'https', hostname: 'res.cloudinary.com' },
        // ... tous les domaines que tu utilises pour les images produits
        ],
    },
};

export default nextConfig;
