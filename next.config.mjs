/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for container hosts (Railway/Fly/Render) — the
  // persistent LISTEN/SSE connection rules out serverless (Vercel) runtimes.
  output: "standalone",
  eslint: {
    // Lint is run explicitly via `npm run lint`; don't fail production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
