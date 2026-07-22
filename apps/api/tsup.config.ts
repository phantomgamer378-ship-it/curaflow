import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  splitting: false,
  sourcemap: false,
  clean: true,
  // Bundle all workspace packages AND AI packages inline
  noExternal: [
    "@clinic/ai",
    "@clinic/db",
    "@clinic/auth",
    "@clinic/queue",
    "@clinic/types",
    "@clinic/observability",
    "@langchain/core",
    "@langchain/langgraph",
    "@langchain/openai",
    "langchain",
  ],
  // Keep only native binary modules and true runtime deps external
  external: [
    "bcryptjs",
    "bullmq",
    "cors",
    "dotenv",
    "express",
    "helmet",
    "ioredis",
    "jsonwebtoken",
    "socket.io",
    "@socket.io/redis-adapter",
    "zod",
    "google-auth-library",
    "@prisma/client",
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});
