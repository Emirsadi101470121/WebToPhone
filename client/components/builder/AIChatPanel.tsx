import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Loader2, Sparkles, Bot, User, RotateCcw } from "lucide-react";
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

/** Build a human-readable description of a node for the AI */
function describeNode(node: TreeNode | null): string | null {
  if (!node) return null;
  const s = node.props?.style ?? {};
  const parts: string[] = [];
  parts.push(`"${node.label}" (${node.type})`);

  if (node.props?.text) parts.push(`text: "${node.props.text}"`);
  if (s.backgroundColor) parts.push(`bg: ${s.backgroundColor}`);
  if (s.color) parts.push(`color: ${s.color}`);
  if (s.fontSize) parts.push(`${s.fontSize}px`);
  if (s.fontWeight && s.fontWeight !== "normal") parts.push(`weight: ${s.fontWeight}`);
  if (s.padding) parts.push(`padding: ${s.padding}`);
  if (s.borderRadius) parts.push(`radius: ${s.borderRadius}`);

  const childCount = node.children?.length ?? 0;
  if (childCount > 0) parts.push(`${childCount} children`);

  return parts.join(", ");
}

/** Build context-aware suggestion chips */
function getSuggestions(node: TreeNode | null): string[] {
  if (!node) {
    return [
      "Add a bottom navigation bar",
      "Change the color scheme to blue",
      "Make the layout more minimal",
      "Add a search bar at the top",
    ];
  }
  if (node.type === "Text") {
    return [
      "Make this text larger",
      "Change this to bold",
      "Update the text color",
      "Center this text",
    ];
  }
  if (node.label.toLowerCase().includes("button")) {
    return [
      "Make this button rounded",
      "Change the button color",
      "Make it full width",
      "Add an icon before the text",
    ];
  }
  return [
    "Change the background color",
    "Add more padding",
    "Make this more rounded",
    "Add a child element",
  ];
}

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Hi! I'm your AI design assistant. I remember our conversation, so you can say things like:\n- \"Make the header darker\"\n- \"Actually, make it a gradient instead\"\n- \"Now change the button below it too\"",
};

export default function AIChatPanel({ tree, selectedNode, onApplyChanges, projectId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Smart context description
  const nodeDescription = useMemo(() => describeNode(selectedNode), [selectedNode]);
  const suggestions = useMemo(() => getSuggestions(selectedNode), [selectedNode]);

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history for the API (skip welcome, limit to last 20 messages)
      const chatHistory = updatedMessages
        .filter((_, i) => i > 0) // skip welcome message
        .slice(-20) // keep last 20 for context window
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/builder-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          tree,
          selectedNodeId: selectedNode?.id ?? null,
          selectedNodeDescription: nodeDescription,
          chatHistory,
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

  const clearChat = () => {
    setMessages([WELCOME_MSG]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium">AI Assistant</span>
        </div>
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            title="Clear conversation"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
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

      {/* Suggestion chips */}
      {!loading && messages.length <= 3 && (
        <div className="border-t border-white/5 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart context indicator */}
      {selectedNode && (
        <div className="border-t border-white/5 px-3 py-1.5">
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
            <span className="text-[10px] leading-tight text-muted-foreground">
              Selected: <span className="font-medium text-violet-400">{selectedNode.label}</span>
              {selectedNode.props?.text && (
                <span className="text-muted-foreground/60"> — "{selectedNode.props.text}"</span>
              )}
              {selectedNode.props?.style?.backgroundColor && (
                <span className="inline-flex items-center gap-1 ml-1">
                  <span
                    className="inline-block h-2 w-2 rounded-sm border border-white/20"
                    style={{ backgroundColor: selectedNode.props.style.backgroundColor }}
                  />
                </span>
              )}
            </span>
          </div>
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
            placeholder={selectedNode ? `Edit "${selectedNode.label}"...` : "Describe a change..."}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/10 bg-muted/50 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-violet-500"
          />
          <button
            onClick={() => sendMessage()}
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
