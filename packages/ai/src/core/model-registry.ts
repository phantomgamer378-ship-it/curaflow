import { ChatOpenAI } from "@langchain/openai";
import { AI_MODELS } from "./constants";

/**
 * Model registry — single source of truth for LLM instantiation.
 * Swap providers here without touching any agent code.
 */
const modelCache = new Map<string, ChatOpenAI>();

export function getModel(
  modelName: string = AI_MODELS.DEFAULT,
  options: { temperature?: number; maxTokens?: number } = {}
): ChatOpenAI {
  const cacheKey = `${modelName}:${options.temperature ?? 0}:${options.maxTokens ?? 1024}`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Set it in .env to enable AI agent functionality."
    );
  }

  const model = new ChatOpenAI({
    model: modelName,
    temperature: options.temperature ?? 0,
    maxTokens: options.maxTokens ?? 1024,
    apiKey,
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    }
  });

  modelCache.set(cacheKey, model);
  return model;
}

/** Check if AI is configured (API key present). */
export function isAIConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}
