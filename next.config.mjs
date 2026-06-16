import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Pin the workspace/tracing root to this project so the standalone build
  // (used by the Docker image) traces files from here — not a stray parent
  // lockfile that Next 16 might otherwise infer as the root.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  env: {
    BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC,
  },
};

export default nextConfig;
