"use client";

import * as React from "react";
import { analyze } from "@/lib/financial-engine";
import { useFinancialStore } from "@/store/financial-store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let counter = 0;
const nextId = () => `m${++counter}`;

/**
 * Gere a conversa com o Consultor IA.
 * O relatório do Motor Financeiro é calculado no cliente e enviado já processado
 * para o backend, que o interpreta (regra: a IA nunca calcula).
 */
export function useAdvisorChat() {
  const snapshot = useFinancialStore((s) => s.snapshot);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [mode, setMode] = React.useState<"local" | "openai" | null>(null);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: ChatMessage = { id: nextId(), role: "user", content: trimmed };
      const assistantMsg: ChatMessage = { id: nextId(), role: "assistant", content: "" };
      const history = [...messages, userMsg];
      setMessages([...history, assistantMsg]);
      setStreaming(true);

      try {
        const report = analyze(snapshot);
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            report,
            missions: snapshot.missions,
            userName: snapshot.profile.fullName,
          }),
        });

        setMode(
          (res.headers.get("X-Advisor-Mode") as "local" | "openai" | null) ?? null,
        );

        if (!res.body) throw new Error("Sem corpo de resposta");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: acc } : m,
            ),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Ocorreu um erro. Tente novamente." }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
      }
    },
    [messages, snapshot, streaming],
  );

  const reset = React.useCallback(() => setMessages([]), []);

  return { messages, send, streaming, reset, mode };
}
