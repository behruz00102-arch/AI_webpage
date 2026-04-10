"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ChatApiResponse = {
  reply?: string;
  error?: string;
  details?: string;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isTextareaCapped, setIsTextareaCapped] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [showNotice, setShowNotice] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
const fileInputRef = useRef<HTMLInputElement | null>(null);
const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [search, setSearch] = useState("");
    const [conversationTitle, setConversationTitle] = useState("AI Chat (Gemini)");
const [isRenamingTitle, setIsRenamingTitle] = useState(false);
const [activeMatchIdx, setActiveMatchIdx] = useState(0);
const [openConvMenuIdx, setOpenConvMenuIdx] = useState<number | null>(null);
const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
const [renameDraft, setRenameDraft] = useState("");
const [conversations, setConversations] = useState<string[]>([
  "Project ideas",
  "Gemini API setup",
  "Frontend polish",
  "Rate limit handling",
  "Bug triage",
  "Design review",
  "Docs draft",
  "Pricing page copy",
  "Auth flow",
  "Database schema",
  "API error handling",
  "Streaming responses",
  "Markdown rendering",
  "File uploads",
  "Image generation",
  "Accessibility fixes",
  "Performance audit",
  "Refactor components",
  "Dark mode polish",
  "Deploy checklist",
  "User feedback #1",
  "User feedback #2",
  "User feedback #3",
  "Sprint planning",
  "Release notes",
  "Customer support",
  "Onboarding flow",
  "Analytics events",
  "Logging and monitoring",
  "Edge cases",
  "Security review",
  "Long conversation title example to test truncation",
]);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return conversations
      .map((title, idx) => ({ title, idx }))
      .filter((c) => c.title.toLowerCase().includes(q));
  }, [search, conversations]);
  
  useEffect(() => {
    setActiveMatchIdx(0);
  }, [search]);
  const canSend = useMemo(
    () => input.trim().length > 0 && !loading && cooldownSec === 0,
    [input, loading, cooldownSec],
  );
  useEffect(() => {
    function onDocPointerDown() {
      setOpenConvMenuIdx(null);
    }
  
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
  
    const MAX_H = 220;
  
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, MAX_H);
    el.style.height = `${next}px`;
  
    setIsTextareaCapped(el.scrollHeight > MAX_H);
  }, [input, attachedFiles]);
  useEffect(() => {
    const hidden = window.localStorage.getItem("hideLimitNotice") === "true";
    setShowNotice(!hidden);
    setDontShowAgain(hidden);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);
  useEffect(() => {
    if (cooldownSec <= 0) return;

    const timer = setTimeout(() => {
      setCooldownSec((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldownSec]);
  function newConversation() {
    setMessages([]);
    setInput("");
    setAttachedFiles([]);
    setLoading(false);
    setCooldownSec(0);
    setConversationTitle("AI Chat (Gemini)");
    setIsRenamingTitle(false);
  }
    function closeNotice() {
    if (dontShowAgain) {
      window.localStorage.setItem("hideLimitNotice", "true");
    } else {
      window.localStorage.removeItem("hideLimitNotice");
    }
    setShowNotice(false);
  }

  async function send() {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    setCooldownSec(3);

    try {
      const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  // Wrap the message in the structure the backend expects:
  body: JSON.stringify({ 
    messages: [{ role: "user", content: userText }] 
  }),
});

      const data = (await res.json()) as ChatApiResponse;

      if (!res.ok) {
        const friendly = data.error || "Unable to process your request right now.";
        throw new Error(friendly);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply ?? "" },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="flex h-full w-full">
      <aside className="hidden h-full w-72 shrink-0 border-r border-black/10 bg-white/70 p-4 dark:border-white/15 dark:bg-zinc-950/60 md:flex md:flex-col">
  <div>
  <h2 className="mb-3 text-sm font-semibold">Conversations</h2>

<button
  type="button"
  onClick={() => {
    if (confirm("Start a new conversation? This will clear the current chat.")) {
      newConversation();
    }
  }}
  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
  aria-label="New conversation"
  title="New conversation"
>
  <span aria-hidden="true">＋</span>
  <span>New conversation</span>
  </button>

<div className="my-3 h-px w-full bg-zinc-200 dark:bg-white/15" />

<div className="mb-2 flex items-center gap-2">
  <input
    type="search"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search conversations..."
    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-black"
  />

  {search.trim() ? (
    <button
      type="button"
      onClick={() => setSearch("")}
      className="shrink-0 rounded-md px-2 py-2 text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
      aria-label="Clear search"
    >
      X
    </button>
  ) : null}
</div>

{search.trim() ? (
  <div className="mb-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
    <span>
      {matches.length === 0 ? "0 matches" : `${activeMatchIdx + 1} of ${matches.length}`}
    </span>

    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={matches.length === 0}
        onClick={() =>
          setActiveMatchIdx((prev) =>
            matches.length ? (prev - 1 + matches.length) % matches.length : 0,
          )
        }
        className="rounded-md px-2 py-1 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
        aria-label="Previous match"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={matches.length === 0}
        onClick={() =>
          setActiveMatchIdx((prev) =>
            matches.length ? (prev + 1) % matches.length : 0,
          )
        }
        className="rounded-md px-2 py-1 hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
        aria-label="Next match"
      >
        ↓
      </button>
    </div>
    </div>
) : null}

</div>

<div
  className="mt-auto h-1/2 overflow-y-auto rounded-xl bg-zinc-100/70 p-2 pt-3 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10"
  onClick={() => setOpenConvMenuIdx(null)}
>
  <div className="space-y-1">
    {conversations.map((title, idx) => {
      const isMatch = matches.length > 0 && matches[activeMatchIdx]?.idx === idx;

      return (
        <div
  key={idx}
  className={`group relative flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm ${
    isMatch
      ? "bg-blue-600/15 ring-1 ring-blue-500/40"
      : openConvMenuIdx === idx
        ? "bg-zinc-200/70 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/15"
        : "hover:bg-black/5 dark:hover:bg-white/10"
  }`}
>
  <div className="min-w-0 flex-1">
    {renamingIdx === idx ? (
      <input
        autoFocus
        value={renameDraft}
        onChange={(e) => setRenameDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setConversations((prev) =>
              prev.map((t, i) => (i === idx ? renameDraft.trim() || t : t)),
            );
            setRenamingIdx(null);
          }
          if (e.key === "Escape") {
            setRenamingIdx(null);
          }
        }}
        onBlur={() => setRenamingIdx(null)}
        className="w-full rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-black"
      />
    ) : (
      <div className="truncate">{title}</div>
    )}
  </div>

  <button
    type="button"
    className="invisible flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-black/5 group-hover:visible dark:text-zinc-300 dark:hover:bg-white/10"
    aria-label="Conversation options"
    title="Options"
    onPointerDown={(e) => e.stopPropagation()}
onClick={() => setOpenConvMenuIdx((prev) => (prev === idx ? null : idx))}
  >
    ⋯
  </button>

  {openConvMenuIdx === idx ? (
    <div
    className="absolute ..."
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
  >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => {
          setOpenConvMenuIdx(null);
          setRenamingIdx(idx);
          setRenameDraft(title);
        }}
      >
        <span aria-hidden="true">✏️</span>
        <span>Rename</span>
      </button>

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        onClick={() => {
          setOpenConvMenuIdx(null);
          setConversations((prev) => prev.filter((_, i) => i !== idx));
          setRenamingIdx((current) => (current === idx ? null : current));
        }}
      >
        <span aria-hidden="true">🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  ) : null}
</div>
      );
    })}
  </div>
</div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-6">
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              showNotice ? "pointer-events-none select-none blur-sm" : ""
            }`}
          >
          <header className="w-full shrink-0 rounded-3xl border border-white/15 bg-gradient-to-br from-white/20 to-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl dark:border-white/10 dark:from-white/10 dark:to-white/5">
          <div className="group inline-flex items-center gap-2 rounded-md px-1">
  {isRenamingTitle ? (
    <input
      autoFocus
      value={conversationTitle}
      onChange={(e) => setConversationTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setIsRenamingTitle(false);
        if (e.key === "Escape") setIsRenamingTitle(false);
      }}
      onBlur={() => setIsRenamingTitle(false)}
      className="w-64 max-w-[60vw] rounded-md border border-black/10 bg-white px-2 py-1 text-2xl font-semibold tracking-tight outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-black"
      aria-label="Conversation title"
    />
  ) : (
    <h1 className="text-2xl font-semibold tracking-tight">{conversationTitle}</h1>
  )}

  <button
    type="button"
    onClick={() => setIsRenamingTitle(true)}
    className="invisible rounded-md p-1 text-zinc-600 hover:bg-black/5 group-hover:visible dark:text-zinc-300 dark:hover:bg-white/10"
    aria-label="Rename conversation"
    title="Rename conversation"
  >
    ✏️
  </button>
</div>
</header>
<section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/10 dark:border-white/10 dark:bg-white/5">
              <div className="flex h-full min-h-0 flex-col">
              <div
  ref={messagesContainerRef}
  className="flex-1 overflow-y-auto p-3 pt-6 sm:p-4 sm:pt-8"
>
                  {messages.length === 0 ? (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Send a message to start.
                    </div>
                  ) : (
                    <div className="space-y-2 text-base leading-relaxed">
                      {messages.map((m, i) => (
                        <div
                          key={i}
                          className={
                            m.role === "user" ? "flex justify-end" : "flex justify-start"
                          }
                        >
                          <div
                            className={
                              m.role === "user"
                                ? "max-w-[92%] rounded-3xl bg-blue-600 px-4 py-3 text-white"
                                : "max-w-[92%] rounded-3xl bg-zinc-100 px-4 py-3 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                            }
                          >
                            <div className="prose prose-zinc dark:prose-invert max-w-none text-[15px] sm:text-base">
  <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
</div>
                          </div>
                        </div>
                      ))}
                      {loading ? (
                        <div className="flex items-center gap-2 text-[15px] sm:text-base text-zinc-500 dark:text-zinc-400">
                        <span>Gemini is thinking</span>
                        <span className="inline-flex items-end gap-1" aria-hidden="true">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                        </span>
                      </div>
                      ) : null}
                      <div ref={endRef} />
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-black/10 p-3 dark:border-white/15">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const list = e.target.files;
                      if (list?.length) {
                        setAttachedFiles((prev) => [...prev, ...Array.from(list)]);
                      }
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-2 rounded-[1.75rem] border border-black/10 bg-zinc-100/80 p-2 dark:border-white/15 dark:bg-zinc-900/60">
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl font-light leading-none text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
                      aria-label="Add files"
                      title="Add files"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      +
                    </button>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-black">
  {attachedFiles.length > 0 ? (
    <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-black/10 px-3 py-2 text-sm dark:border-white/15">
      {attachedFiles.map((f, i) => (
        <span
          key={`${f.name}-${i}`}
          className="inline-flex max-w-full items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <span className="truncate" title={f.name}>
            {f.name}
          </span>
          <button
            type="button"
            className="shrink-0 rounded px-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label={`Remove ${f.name}`}
            onClick={() =>
              setAttachedFiles((prev) => prev.filter((_, j) => j !== i))
            }
          >
            ×
          </button>
        </span>
      ))}
    </div>
  ) : null}
  <textarea
    ref={textareaRef}
    className={`block min-h-[44px] w-full resize-none border-0 bg-transparent px-4 py-3 text-base leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 [scrollbar-gutter:stable] ${
      isTextareaCapped ? "overflow-y-auto" : "overflow-y-hidden [scrollbar-gutter:auto]"
    }`}
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void send();
      }
    }}
    placeholder="Type your message..."
  />
</div>
                    <button
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                      onClick={() => void send()}
                      disabled={!canSend}
                    >
                      {cooldownSec > 0 ? `Wait ${cooldownSec}s` : "Send"}
                      </button>
                </div>
                </div>
              </div>
            </section>
          </div>

          {showNotice ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
              <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/15 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={closeNotice}
                  className="absolute right-3 top-3 cursor-pointer rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label="Close reminder"
                >
                  X
                </button>

                <h2 className="mb-3 pr-8 text-lg font-semibold">Reminder</h2>

                <p className="mb-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
  Due to the use of the free tier of the Gemini API, the server is limited to a
  total of 20 requests per day.
  <br />
  Additionally, due to high demand, requests can only be sent once every 3 seconds.
  <br />
  We kindly ask you to use requests thoughtfully.
  <br />
  <br />
  Thank you for your understanding :)
</p>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300"
                  />
                  Don&apos;t show it again
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}