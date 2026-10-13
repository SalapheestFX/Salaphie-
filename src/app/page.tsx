"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  BookMarked,
  Sparkles,
  ShieldCheck,
  ScrollText,
  LibraryBig,
  Quote,
  Copy,
  Check,
  LoaderCircle,
  Plus,
  Menu,
  X,
  History,
  Trash2,
  MessageSquare,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  text?: string;
  reference?: string;
  arabic?: string;
  translation?: string | null;
  translationName?: string;
  source?: string;
  success?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const HISTORY_KEY = "salaphie_chat_history_v1";

const suggestions = [
  {
    title: "Find a Qur'an verse",
    description: "Explore a verse and its meaning",
    prompt: "Give me verse number 50 in Ali Imran",
    icon: BookOpen,
  },
  {
    title: "Explore Hadith",
    description: "Look up a Hadith by reference",
    prompt: "Give me Hadith number 1200 in Sahih al-Bukhari",
    icon: BookMarked,
  },
  {
    title: "Study Tafsir",
    description: "Explore classical Qur'anic explanations",
    prompt: "Explain how Salaphie will help me study Tafsir Ibn Kathir",
    icon: ScrollText,
  },
];

const modules = [
  { title: "Qur'an & Tafsir", description: "Verses, translations, and classical explanations", icon: BookOpen },
  { title: "Hadith", description: "Hadith collections, references, and explanations", icon: BookMarked },
  { title: "Aqidah", description: "Islamic beliefs and their evidence", icon: ShieldCheck },
  { title: "Islamic Library", description: "Classical sources and statements of the Salaf", icon: LibraryBig },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isChat = messages.length > 0;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (item): item is Conversation =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              Array.isArray(item.messages)
          );
          setHistory(valid);
          if (valid.length > 0) {
            const latest = [...valid].sort(
              (a, b) => b.updatedAt - a.updatedAt
            )[0];
            setActiveChatId(latest.id);
            setMessages(latest.messages);
          }
        }
      }
    } catch (error) {
      console.error("Could not load Salaphie chat history:", error);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Could not save Salaphie chat history:", error);
    }
  }, [history, historyReady]);

  useEffect(() => {
    if (!historyReady || messages.length === 0) return;

    const id = activeChatId ?? (
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    if (!activeChatId) setActiveChatId(id);

    const firstQuestion =
      messages.find((message) => message.role === "user")?.text?.trim() ||
      "New conversation";

    const conversation: Conversation = {
      id,
      title:
        firstQuestion.length > 48
          ? firstQuestion.slice(0, 48).trimEnd() + "…"
          : firstQuestion,
      messages,
      updatedAt: Date.now(),
    };

    setHistory((previous) => [
      conversation,
      ...previous.filter((item) => item.id !== id),
    ]);
  }, [messages, activeChatId, historyReady]);

  useEffect(() => {
    if (isChat) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, isChat]);

  function openConversation(conversation: Conversation) {
    setActiveChatId(conversation.id);
    setMessages(conversation.messages);
    setInput("");
    setCopiedIndex(null);
    setHistoryOpen(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteConversation(id: string) {
    setHistory((previous) => previous.filter((item) => item.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([]);
      setInput("");
      setCopiedIndex(null);
    }
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setLoading(false);
    setCopiedIndex(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: trimmed },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Request failed.");
      }

      if (data.success && ["quran_verse", "hadith"].includes(data.type)) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            reference: data.reference ?? "",
            arabic: data.arabic ?? "",
            translation: data.translation ?? data.english ?? null,
            translationName: data.translationName ?? data.collection ?? "",
            source: data.source ?? data.sourceName ?? "",
            success: true,
          },
        ]);
      } else {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: data.reply ?? data.error ?? "I couldn't retrieve that information. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Salaphie chat error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `The request failed: ${errorMessage}. Please check the server terminal for details.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() && !loading) void sendMessage(input);
    }
  }

  async function copyText(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  function researchText(message: Message) {
    return [
      message.reference,
      message.arabic,
      message.translation,
      message.translationName,
      message.source,
    ].filter(Boolean).join("\n\n");
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f4f9ff] text-[#172b4d]">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute right-[-100px] top-[35%] h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/25 text-[#23466f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_24px_rgba(77,135,190,0.08)] backdrop-blur-2xl transition hover:bg-white/45"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            onClick={startNewChat}
            className="flex items-center gap-2.5 rounded-xl text-left"
            aria-label="Salaphie home"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img src="/salaphie-logo.svg" alt="Salaphie logo" className="h-10 w-10 object-contain" />
            </span>
            <span className="text-[21px] font-bold tracking-[-0.8px] text-[#142d52]">Salaphie</span>
          </button>
          <button
            type="button"
            onClick={startNewChat}
            className="ml-auto flex items-center gap-2 rounded-xl border border-white/60 bg-white/30 px-3 py-2.5 text-sm font-medium text-[#23466f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(77,135,190,0.10)] backdrop-blur-2xl transition hover:bg-white/50"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-[#102747]/35 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col border-r border-white/80 bg-[#f4f9ff]/80 shadow-[12px_0_45px_rgba(77,135,190,0.10),inset_-1px_0_0_rgba(255,255,255,0.95)] backdrop-blur-2xl">
            <div className="flex h-[68px] items-center justify-between border-b border-white/80 bg-white/35 px-4">
              <div className="flex items-center gap-2.5">
                <img src="/salaphie-logo.svg" alt="" className="h-9 w-9 object-contain" />
                <span className="text-lg font-bold text-[#142d52]">Salaphie</span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/60 bg-white/35 p-2 text-[#45658b] shadow-sm backdrop-blur-xl transition hover:bg-white/65"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-white/70 bg-white/20 p-3">
              <button
                type="button"
                onClick={startNewChat}
                className="flex w-full items-center gap-3 rounded-xl border border-white/70 bg-white/30 px-3.5 py-3 text-left text-sm font-semibold text-[#23466f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(77,135,190,0.08)] backdrop-blur-xl transition hover:bg-white/55"
              >
                <Plus size={18} />
                New chat
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <h2 className="mb-2 mt-1 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[#7290b2]">
                Islamic topics
              </h2>
              {modules.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void sendMessage(`Help me research ${item.title} using reliable Islamic sources.`);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm text-[#23466f] transition hover:border-white/80 hover:bg-white/45 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  >
                    <Icon size={18} className="shrink-0 text-[#5785b5]" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
              <a
                href="#library"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm text-[#23466f] transition hover:border-white/80 hover:bg-white/45"
              >
                <LibraryBig size={18} className="text-[#5785b5]" />
                Explore topics
              </a>

              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#7290b2]">
                Recent chats
              </h2>
              {history.length === 0 ? (
                <p className="px-2 py-4 text-sm leading-6 text-[#7892b0]">
                  Your conversations will appear here.
                </p>
              ) : (
                history.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`mb-1 flex items-center gap-1 rounded-xl border border-white/50 bg-white/20 p-1 backdrop-blur-xl ${
                      activeChatId === conversation.id ? "border-white/90 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_15px_rgba(77,135,190,0.07)]" : "hover:bg-white/45"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-left text-sm text-[#23466f] transition hover:bg-white/40"
                    >
                      <span className="block truncate font-medium">{conversation.title}</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(conversation.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${conversation.title}`}
                      title="Delete conversation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}

            </div>

            <div className="border-t border-white/80 bg-white/25 px-4 py-3 text-xs text-[#7892b0] backdrop-blur-xl">
              Islamic research · Source-first answers
            </div>
          </aside>
        </div>
      )}
      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-68px)] max-w-6xl flex-col px-4 sm:px-6">
        {!isChat ? (
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center pb-10 pt-12 sm:pt-16">
            <div className="mb-7 flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[23px] border border-white/80 bg-white/55 text-[#17365f] shadow-[0_8px_35px_rgba(44,91,145,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                <BookOpen size={34} strokeWidth={1.7} />
              </div>
            </div>

            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/50 px-3.5 py-1.5 text-xs font-medium text-[#45658b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_20px_rgba(77,135,190,0.06)] backdrop-blur-2xl">
                <Sparkles size={14} className="text-sky-600" />
                Your Islamic research companion
              </div>

              <h1 className="text-3xl font-semibold tracking-[-1.3px] text-[#142d52] sm:text-5xl sm:tracking-[-2px]">
                Seek knowledge with
                <span className="mt-1 block text-[#4387c9]">
                  clarity and care.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                Explore the Qur’an, authentic Hadith, classical Tafsir, and
                the understanding of the early generations of Muslims.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="group rounded-[25px] border border-white/80 bg-white/55 p-3 shadow-[0_12px_40px_rgba(42,84,132,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/70 backdrop-blur-2xl transition focus-within:ring-blue-200 sm:p-4"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about a verse, Hadith, scholar, or Islamic topic..."
                rows={3}
                className="max-h-40 min-h-[82px] w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-7 text-[#203b60] outline-none placeholder:text-slate-400 sm:px-3"
              />
              <div className="flex items-center justify-between gap-3 px-1 pt-2">
                <span className="hidden text-xs text-slate-400 sm:block">
                  Explore carefully. Verify important references.
                </span>
                <span className="text-[11px] text-slate-400 sm:hidden">
                  Enter to send
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#17365f] text-white shadow-md transition hover:bg-[#214b7d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={21} />
                </button>
              </div>
            </form>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {suggestions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => void sendMessage(item.prompt)}
                    className="group rounded-2xl border border-white/80 bg-white/45 p-4 text-left shadow-[0_8px_25px_rgba(77,135,190,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5ff] text-[#376da5] transition group-hover:bg-[#e0efff]">
                      <Icon size={19} strokeWidth={1.8} />
                    </span>
                    <span className="block text-sm font-semibold text-[#234266]">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div id="library" className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#234266]">
                    Explore Islamic knowledge
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a topic to begin your research.
                  </p>
                </div>
                <LibraryBig size={19} className="text-[#7197bf]" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {modules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() =>
                        void sendMessage(
                          `Help me research ${item.title} using reliable Islamic sources.`
                        )
                      }
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/75 bg-white/45 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl transition hover:border-blue-100 hover:bg-white sm:p-3.5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#416f9e]">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#2a4668] sm:text-sm">
                          {item.title}
                        </span>
                        <span className="mt-1 hidden text-[11px] leading-4 text-slate-500 sm:block">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-lg text-center text-[11px] leading-5 text-slate-400">
              Salaphie supports Islamic study and research. Verify quotations,
              chains of narration, and scholarly explanations with reliable
              primary sources and qualified scholars.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-40 pt-7 sm:pt-10">
            <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Islamic research session
            </div>

            <div className="flex flex-col gap-7">
              {messages.map((message, index) => (
                <article
                  key={`${index}-${message.role}`}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex items-start gap-3"
                  }
                >
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#234b79] shadow-sm">
                      <BookOpen size={18} />
                    </div>
                  )}

                  {message.role === "user" ? (
                    <div className="max-w-[88%] rounded-[22px] rounded-br-md bg-[#17365f] px-4 py-3.5 text-[14px] leading-7 text-white shadow-sm sm:max-w-[82%] sm:px-5">
                      <p className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 pt-1">
                      {message.success && (message.arabic || message.reference) ? (
                        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-[0_5px_25px_rgba(37,77,122,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/70 bg-sky-100/35 px-4 py-3 backdrop-blur-xl sm:px-5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#23466f]">
                              <BookMarked size={17} />
                              Research reference
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void copyText(researchText(message), index)
                              }
                              className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-medium text-[#45658b] transition hover:bg-blue-50"
                            >
                              {copiedIndex === index ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedIndex === index ? "Copied" : "Copy"}
                            </button>
                          </div>

                          <div className="p-4 sm:p-5">
                            {message.reference && (
                              <p className="mb-4 text-sm font-semibold text-[#376da5]">
                                {message.reference}
                              </p>
                            )}

                            {message.arabic && (
                              <p
                                dir="rtl"
                                lang="ar"
                                className="mb-5 text-right text-xl leading-[2] text-[#172f50] sm:text-2xl"
                              >
                                {message.arabic}
                              </p>
                            )}

                            {message.translation && (
                              <div className="border-t border-blue-50 pt-4">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1px] text-slate-400">
                                  {message.translationName || "Translation"}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                  {message.translation}
                                </p>
                              </div>
                            )}

                          </div>
                        </div>
                      ) : (
                        <div className="text-[14px] leading-7 text-slate-700 sm:text-[15px]">
                          <p className="whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          {message.text && (
                            <button
                              type="button"
                              onClick={() => void copyText(message.text || "", index)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-white hover:text-[#376da5]"
                            >
                              {copiedIndex === index ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}
                              {copiedIndex === index ? "Copied" : "Copy answer"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#234b79] shadow-sm">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/50 px-4 py-3.5 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                    <LoaderCircle size={17} className="animate-spin text-[#4c84bc]" />
                    Researching your question...
                  </div>
                </div>
              )}
            </div>

            <div ref={bottomRef} className="h-2 shrink-0" />
          </div>
        )}
      </section>

      {isChat && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/80 bg-[#edf6ff]/75 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl sm:px-6 sm:pt-4">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="rounded-[22px] border border-white/85 bg-white/60 p-2.5 shadow-[0_6px_30px_rgba(42,84,132,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/80 backdrop-blur-2xl sm:p-3"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up question..."
                rows={2}
                className="max-h-32 min-h-[48px] w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-[#203b60] outline-none placeholder:text-slate-400 sm:px-3"
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-blue-50 hover:text-[#23466f]"
                >
                  <Plus size={15} />
                  New chat
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#17365f] text-white shadow-sm transition hover:bg-[#214b7d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={20} />
                </button>
              </div>
            </form>
            <p className="px-2 pt-2 text-center text-[10px] leading-4 text-slate-400">
              Verify important Islamic references with trusted primary sources.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
