import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { askEcoPathAi } from "@/lib/ecopath.functions";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantProps {
  /** Plain-text briefing describing the current trip / user profile. */
  context: string;
  suggestions: string[];
  trigger: ReactNode;
  title?: string;
  description?: string;
}

export function AiAssistant({
  context,
  suggestions,
  trigger,
  title = "Ask EcoPath AI",
  description = "Personalised guidance based on your sensitivity and this journey.",
}: AiAssistantProps) {
  const ask = useServerFn(askEcoPathAi);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (history: ChatMessage[]) => ask({ data: { context, messages: history } }),
    onSuccess: (result) => {
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "EcoPath AI could not answer right now.",
        },
      ]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, messages.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    mutation.mutate(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-primary">
              <Bot className="size-4" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="min-h-[16rem] flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                EcoPath AI already knows your sensitivity level and this trip's pollution data. Ask
                anything, or start with:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-surface-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> EcoPath AI is thinking...
            </p>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-border px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this route..."
            aria-label="Message EcoPath AI"
          />
          <Button type="submit" size="icon" disabled={mutation.isPending || !input.trim()}>
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The promotional card shown under route results. */
export function AiAssistantCard({
  context,
  suggestions,
  description = "Want to know how this route affects your pollution exposure, or which option suits you best?",
}: {
  context: string;
  suggestions: string[];
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/6 p-5">
      <p className="flex items-center gap-2 font-display text-base font-semibold">
        <Bot className="size-4 text-primary" /> Ask EcoPath AI
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

      <AiAssistant
        context={context}
        suggestions={suggestions}
        trigger={
          <Button className="mt-4">
            <Bot className="size-4" /> Ask EcoPath AI
          </Button>
        }
      />
    </div>
  );
}
