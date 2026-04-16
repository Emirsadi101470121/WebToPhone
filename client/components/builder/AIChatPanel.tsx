import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Bot, User } from "lucide-react";
import type { TreeNode } from "./ComponentTree";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  tree: TreeNode[];
  selectedNode: TreeNode | null;
  onApplyChanges: (newTree: TreeNode[]) => void;
  projectId?: string;
  userId?: string;
}

export default function AIChatPanel({ tree, selectedNode, onApplyChanges, projectId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can help you modify your design. Try things like:\n- \"Make the header darker\"\n- \"Add a footer with 3 tabs\"\n- \"Change the button text to Sign Up\"\n- \"Make all text larger\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/builder-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          tree,
          selectedNodeId: selectedNode?.id ?? null,
          projectId,
          userId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "AI request failed" }));
        setMessages((prev) => [...prev, { role: "assistant", content: err.error || "Something went wrong. Try again." }]);
        return;
      }

      const data = await response.json();

      if (data.tree) {
        onApplyChanges(data.tree);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message || "Done! I've updated your design." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message || "I understood your request but couldn't make changes. Try being more specific." },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-medium">AI Design Assistant</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              msg.role === "user" ? "bg-violet-600" : "bg-zinc-700"
            )}>
              {msg.role === "user" ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-violet-400" />}
            </div>
            <div className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
              msg.role === "user"
                ? "bg-violet-600 text-white"
                : "bg-muted/80 text-muted-foreground"
            )}>
              {msg.content.split("\n").map((line, j) => (
                <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700">
              <Bot className="h-3 w-3 text-violet-400" />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/80 px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected context indicator */}
      {selectedNode && (
        <div className="border-t border-white/5 px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">
            Context: <span className="font-medium text-violet-400">{selectedNode.label}</span>
          </span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Describe a change..."
            disabled={loading}
            className="flex-1 rounded-lg border border-white/10 bg-muted/50 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-violet-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
