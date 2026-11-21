/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export, served by Cloudflare Workers static assets (see
  // wrangler.jsonc). The app has no backend/API: quizzes live in the
  // browser (IndexedDB). Security headers moved to public/_headers and the
  // dynamic quiz routes are handled by public/_redirects.
  output: "export",
};

export default nextConfig;
