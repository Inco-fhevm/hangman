/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC,
  },
};

export default nextConfig;
