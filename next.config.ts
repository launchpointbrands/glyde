import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @react-pdf/renderer pulls in fontkit / pdfkit which use Node-only
  // APIs. Keep them external so Next doesn't try to bundle them.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
