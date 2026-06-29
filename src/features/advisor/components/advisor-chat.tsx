"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdvisorChat } from "@/features/advisor/hooks/use-advisor-chat";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Posso comprar um computador de 250000?",
  "Quanto posso gastar este mês?",
  "Quando atinjo a minha meta?",
  "Onde posso economizar?",
  "Quanto terei daqui a 6 meses?",
  "Como elimino as minhas dívidas?",
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

export function AdvisorChat() {
  const { messages, send, streaming, reset, mode } = useAdvisorChat();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Consultor Financeiro</p>
            <p className="text-xs text-muted-foreground">
              Baseado nos seus dados reais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode && (
            <Badge variant={mode === "openai" ? "default" : "secondary"}>
              {mode === "openai" ? "OpenAI" : "Modo local"}
            </Badge>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Limpar">
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="mt-4 max-w-sm text-balance text-sm text-muted-foreground">
              Sou o seu consultor financeiro pessoal. Conheço o seu saldo, dívidas,
              metas e missões. Pergunte-me qualquer coisa.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground",
              )}
            >
              {m.content || (streaming && <TypingDots />)}
            </div>
          </div>
        ))}
      </div>

      {/* Sugestões */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva a sua pergunta…"
          disabled={streaming}
          className="h-11"
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={streaming || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
