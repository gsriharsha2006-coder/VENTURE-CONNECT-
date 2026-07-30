/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_VENTURE_CONNECT_DEMO_DATA:
      process.env.ENABLE_DEMO_DATA === "true" ? "true" : "false"
  }
};

export default nextConfig;
