import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  splitting: false,
  sourcemap: false,
  clean: true,
  // Bundle all workspace packages inline so Render doesn't need them
  noExternal: [
    "@clinic/ai",
    "@clinic/db",
    "@clinic/auth",
    "@clinic/queue",
    "@clinic/types",
    "@clinic/observability",
  ],
  // Keep native node modules external (they can't be bundled)
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
    "langchain",
    "langraph",
    "@langchain/openai",
    "@langchain/core",
    "@langchain/langgraph",
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});
