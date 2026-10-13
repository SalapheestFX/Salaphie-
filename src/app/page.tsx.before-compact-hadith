"use client";

import { FormEvent, useState } from "react";
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

const suggestions = [
  {
    icon: BookOpen,
    title: "Find a Qur'an verse",
    prompt: "Give me verse number 50 in Ali Imran",
  },
  {
    icon: BookMarked,
    title: "Explore Hadith",
    prompt: "Give me Hadith number 1200 in Sahih al-Bukhari",
  },
  {
    icon: ScrollText,
    title: "Study Tafsir",
    prompt: "Explain how Salaphie will help me study Tafsir Ibn Kathir",
  },
];

const modules = [
  { icon: BookOpen, title: "Qur'an", detail: "Verses and translations" },
  { icon: BookMarked, title: "Hadith", detail: "Prophetic narrations" },
  { icon: ScrollText, title: "Tafsir", detail: "Qur'anic explanations" },
  { icon: ShieldCheck, title: "Aqidah", detail: "Islamic creed" },
  { icon: Quote, title: "Statements of the Salaf", detail: "Early scholars" },
  { icon: LibraryBig, title: "Islamic Library", detail: "Trusted references" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function sendMessage(value?: string) {
    const question = (value ?? input).trim();
    if (!question || loading) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: question },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();

      if (
        data.success &&
        ["quran_verse", "hadith"].includes(data.type)
      ) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            reference: data.reference,
            arabic: data.arabic,
            translation: data.translation ?? data.english ?? null,
            translationName: data.translationName ?? data.collection ?? "",
            source: data.source ?? data.sourceName ?? "",
            success: true,
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text:
              data.reply ??
              data.error ??
              "I couldn't retrieve that information. Please try again.",
            success: false,
          },
        ]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I couldn't connect to Salaphie's research service. Please try again.",
          success: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f9ff] text-[#142746]">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-32 left-[-10%] h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[-10%] top-64 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mt-4 flex items-center justify-between rounded-2xl border border-white/80 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-2xl sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#142746] text-white shadow-sm">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Salaphie</p>
              <p className="text-[10px] font-medium tracking-wide text-slate-500">
                ISLAMIC KNOWLEDGE. AUTHENTIC SOURCES.
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <a href="#research" className="transition hover:text-blue-700">
              Research
            </a>
            <a href="#library" className="transition hover:text-blue-700">
              Library
            </a>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck size={14} />
              Evidence first
            </span>
          </div>
        </header>

        <section id="research" className="mx-auto max-w-4xl pb-16 pt-12 sm:pt-16">
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 px-4 py-2 text-xs font-medium text-[#345478] shadow-sm backdrop-blur-xl">
              <Sparkles size={14} className="text-sky-600" />
              Your Islamic research companion
            </span>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Seek knowledge.
              <span className="mt-1 block bg-gradient-to-r from-[#17365e] via-[#3379b8] to-[#65a8dc] bg-clip-text text-transparent">
                Find the evidence.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore the Qur'an and authentic Islamic sources with a research
              assistant designed to put evidence first.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl rounded-[28px] border border-white/90 bg-white/70 p-3 shadow-[0_18px_70px_rgba(50,94,145,0.10)] backdrop-blur-2xl sm:p-5">
            <form onSubmit={handleSubmit}>
              <label htmlFor="question" className="sr-only">
                Ask Salaphie a question
              </label>
              <textarea
                id="question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask for a verse, Hadith, or Islamic reference..."
                rows={2}
                className="w-full resize-none bg-transparent px-3 py-3 text-base leading-7 outline-none placeholder:text-slate-400 sm:px-4"
              />

              <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                <span className="flex items-center gap-1.5 pl-2 text-xs text-slate-500">
                  <ShieldCheck size={14} />
                  Source-based answers
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#142746] px-5 text-sm font-medium text-white shadow-md transition hover:bg-[#203e67] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <ArrowUp size={17} />
                  )}
                  {loading ? "Searching..." : "Ask Salaphie"}
                </button>
              </div>
            </form>
          </div>

          {messages.length === 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {suggestions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => void sendMessage(item.prompt)}
                    className="group rounded-2xl border border-white/90 bg-white/55 p-4 text-left shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#2f6caa]">
                      <Icon size={19} />
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {messages.length > 0 && (
            <section
              aria-label="Conversation"
              className="mt-6 space-y-3"
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  Your conversation
                </h2>
                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-white/80 hover:text-slate-800"
                >
                  <Plus size={14} />
                  New chat
                </button>
              </div>

              {messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-[#183457] px-4 py-3 text-sm leading-6 text-white shadow-sm sm:max-w-[75%]"
                      : "max-w-full"
                  }
                >
                  {message.role === "user" ? (
                    message.text
                  ) : message.reference ? (
                    <article className="overflow-hidden rounded-2xl border border-white/80 bg-white/45 shadow-[0_6px_24px_rgba(44,86,135,0.06)] backdrop-blur-2xl">
                      <div className="flex items-center justify-between gap-3 border-b border-white/70 bg-white/25 px-3.5 py-2.5 sm:px-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <BookOpen size={17} className="text-sky-700" />
                          {message.reference}
                        </div>
                        <span className="rounded-full border border-sky-100/80 bg-sky-50/65 px-2 py-1 text-[9px] font-medium text-sky-800">
                          Retrieved source
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4">
                        <p
                          dir="rtl"
                          lang="ar"
                          className="text-right text-xl leading-[2] text-[#172e4e] sm:text-2xl sm:leading-[2]"
                        >
                          {message.arabic}
                        </p>

                        <div className="my-3.5 h-px bg-white/80" />

                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          English translation
                        </p>
                        {message.translation ? (
                          <p className="mt-1.5 text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-6">
                            {message.translation}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            An English translation was not available from the
                            selected source.
                          </p>
                        )}

                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/80 pt-3">
                          <div className="text-xs leading-5 text-slate-500">
                            <p>{message.translationName}</p>
                            <p>{message.source}</p>
                          </div>
                          <button
                            onClick={() =>
                              void copyText(
                                `${message.reference}\n\n${message.arabic}\n\n${message.translation ?? ""}`
                              )
                            }
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied" : "Copy verse"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="rounded-2xl border border-white/80 bg-white/45 px-3.5 py-3 text-[13px] leading-6 text-slate-700 shadow-sm backdrop-blur-2xl">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#2e659a]">
                        <Sparkles size={15} />
                        Salaphie
                      </div>
                      {message.text}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle size={16} className="animate-spin text-sky-600" />
                  Retrieving Islamic source material...
                </div>
              )}
            </section>
          )}

          <section id="library" className="mt-16 sm:mt-20">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                  Explore knowledge
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Your Islamic library
                </h2>
              </div>
              <span className="text-xs text-slate-500">More sources coming</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.title}
                    className="rounded-2xl border border-white/90 bg-white/55 p-4 shadow-sm backdrop-blur-xl sm:p-5"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#2f6caa]">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-semibold">{module.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {module.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="pb-8 pt-12 text-center">
            <div className="mx-auto mb-4 h-px max-w-xs bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <p className="text-xs font-medium text-slate-500">
              Salaphie · Islamic Knowledge. Authentic Sources.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Verify references and consult qualified scholars for complex
              religious matters.
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
