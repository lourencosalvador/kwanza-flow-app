import "server-only";
import OpenAI from "openai";
import { serverEnv } from "@/lib/env";

/**
 * Cliente OpenAI — EXCLUSIVAMENTE no servidor.
 * A chave nunca é exposta ao frontend.
 */
let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: serverEnv.openaiApiKey });
  }
  return client;
}

export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stream de texto do consultor via Responses API.
 * Devolve um async iterator de deltas de texto.
 */
export async function* streamAdvisor(params: {
  instructions: string;
  input: AdvisorMessage[];
}): AsyncGenerator<string> {
  const openai = getOpenAI();
  const stream = await openai.responses.create({
    model: serverEnv.openaiModel,
    instructions: params.instructions,
    input: params.input.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.4,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      yield event.delta;
    }
  }
}

/** Versão não-streaming (para sugestões pontuais, ex.: explicar alocação). */
export async function completeAdvisor(params: {
  instructions: string;
  input: string;
}): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.responses.create({
    model: serverEnv.openaiModel,
    instructions: params.instructions,
    input: params.input,
    temperature: 0.4,
  });
  return res.output_text ?? "";
}
