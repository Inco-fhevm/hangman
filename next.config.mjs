/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // The @inco/lightning-js v1 bundle trips a panic in Next 14's SWC minifier
  // (FRACTIONAL_BITWISE_OPERAND in the expression simplifier). Fall back to
  // Terser for minification, which handles the SDK's BigInt/bitwise code fine.
  swcMinify: false,
  env: {
    BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC,
  },
};

export default nextConfig;
