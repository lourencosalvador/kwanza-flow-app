import { NextRequest } from "next/server";
import { isOpenAIConfigured } from "@/lib/env";
import { buildAdvisorInstructions } from "@/lib/ai/system-prompt";
import { buildContextBlock } from "@/lib/ai/context-builder";
import { streamAdvisor, type AdvisorMessage } from "@/lib/ai/openai";
import { localAdvice } from "@/lib/ai/local-advisor";
import type { FinancialReport } from "@/lib/financial-engine/types";
import type { Mission } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  messages: AdvisorMessage[];
  report: FinancialReport;
  missions: Mission[];
  userName: string;
}

const encoder = new TextEncoder();

function streamFromString(text: string): ReadableStream<Uint8Array> {
  // Simula streaming palavra-a-palavra para uma UX consistente sem OpenAI.
  const tokens = text.match(/\S+\s*/g) ?? [text];
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= tokens.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(tokens[i]));
      i += 1;
    },
  });
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response("Pedido inválido", { status: 400 });
  }

  const { messages, report, missions, userName } = body;
  if (!messages?.length || !report) {
    return new Response("Dados em falta", { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  // Fallback determinístico quando a OpenAI não está configurada.
  if (!isOpenAIConfigured) {
    const answer = localAdvice(
      lastUser?.content ?? "",
      report,
      missions ?? [],
      userName ?? "Utilizador",
    );
    return new Response(streamFromString(answer), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Advisor-Mode": "local",
      },
    });
  }

  // Caminho OpenAI (Responses API), só no backend.
  const contextBlock = buildContextBlock({
    userName: userName ?? "Utilizador",
    report,
    missions: missions ?? [],
  });
  const instructions = buildAdvisorInstructions(contextBlock);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamAdvisor({ instructions, input: messages })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg =
          "Desculpe, ocorreu um problema ao contactar o consultor. Tente novamente.";
        controller.enqueue(encoder.encode(msg));
        console.error("[ai/chat]", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Advisor-Mode": "openai",
    },
  });
}
