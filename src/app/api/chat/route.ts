import { NextResponse } from "next/server";
import https from "node:https";

const SURAH_NAMES: Record<string, number> = {
  "al fatihah": 1,
  "al fatiha": 1,
  "fatihah": 1,
  "baqarah": 2,
  "al baqarah": 2,
  "ali imran": 3,
  "aal imran": 3,
  "al imran": 3,
  "an nisa": 4,
  "nisa": 4,
  "al maidah": 5,
  "al an am": 6,
  "al anam": 6,
  "al araf": 7,
  "al anfal": 8,
  "at tawbah": 9,
  "yunus": 10,
  "hud": 11,
  "yusuf": 12,
  "ar rad": 13,
  "ibrahim": 14,
  "al hijr": 15,
  "an nahl": 16,
  "al isra": 17,
  "al kahf": 18,
  "maryam": 19,
  "ta ha": 20,
  "al anbiya": 21,
  "al hajj": 22,
  "al muminun": 23,
  "an nur": 24,
  "al furqan": 25,
  "ash shuaara": 26,
  "an naml": 27,
  "al qasas": 28,
  "al ankabut": 29,
  "ar rum": 30,
  "luqman": 31,
  "as sajdah": 32,
  "al ahzab": 33,
  "saba": 34,
  "fatir": 35,
  "ya sin": 36,
  "yasin": 36,
  "as saffat": 37,
  "sad": 38,
  "az zumar": 39,
  "ghafir": 40,
  "fussilat": 41,
  "ash shura": 42,
  "az zukhruf": 43,
  "ad dukhan": 44,
  "al jathiyah": 45,
  "al ahqaf": 46,
  "muhammad": 47,
  "al fath": 48,
  "al hujurat": 49,
  "qaf": 50,
  "adh dhariyat": 51,
  "at tur": 52,
  "an najm": 53,
  "al qamar": 54,
  "ar rahman": 55,
  "al waqiah": 56,
  "al hadid": 57,
  "al mujadilah": 58,
  "al hashr": 59,
  "al mumtahanah": 60,
  "as saff": 61,
  "al jumuah": 62,
  "al munafiqun": 63,
  "at taghabun": 64,
  "at talaq": 65,
  "at tahrim": 66,
  "al mulk": 67,
  "al qalam": 68,
  "al haqqah": 69,
  "al maarij": 70,
  "nuh": 71,
  "al jinn": 72,
  "al muddaththir": 74,
  "al qiyamah": 75,
  "al insan": 76,
  "an naba": 78,
  "an naziat": 79,
  "abasa": 80,
  "at takwir": 81,
  "al infitar": 82,
  "al mutaffifin": 83,
  "al inshiqaq": 84,
  "al buruj": 85,
  "at tariq": 86,
  "al ala": 87,
  "al ghashiyah": 88,
  "al fajr": 89,
  "al balad": 90,
  "ash shams": 91,
  "al layl": 92,
  "ad duha": 93,
  "ash sharh": 94,
  "at tin": 95,
  "al alaq": 96,
  "al qadr": 97,
  "al bayyinah": 98,
  "az zalzalah": 99,
  "al adiyat": 100,
  "al qariah": 101,
  "at takathur": 102,
  "al asr": 103,
  "al humazah": 104,
  "al fil": 105,
  "quraysh": 106,
  "al maun": 107,
  "al kawthar": 108,
  "al kafirun": 109,
  "an nasr": 110,
  "al masad": 111,
  "al ikhlas": 112,
  "al falaq": 113,
  "an nas": 114,
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9:\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findReference(message: string) {
  const text = normalize(message);

  // Direct reference: Quran 23:50 or 23:50
  const direct = text.match(
    /\b(?:quran\s*)?(\d{1,3})\s*:\s*(\d{1,3})\b/
  );

  if (direct) {
    return {
      chapter: Number(direct[1]),
      verse: Number(direct[2]),
    };
  }

  // Common Hausa number words.
  const numberWords: Record<string, number> = {
    daya: 1,
    biyu: 2,
    uku: 3,
    hudu: 4,
    biyar: 5,
    shida: 6,
    bakwai: 7,
    takwas: 8,
    tara: 9,
    goma: 10,
    "sha daya": 11,
    "sha biyu": 12,
    "sha uku": 13,
    "sha hudu": 14,
    "sha biyar": 15,
    "sha shida": 16,
    "sha bakwai": 17,
    "sha takwas": 18,
    "sha tara": 19,
    ashirin: 20,
    talatin: 30,
    "arba'in": 40,
    arbain: 40,
    hamsin: 50,
    sittin: 60,
    "saba'in": 70,
    tamanin: 80,
    "casa'in": 90,
  };

  // Match numeric or written verse references in Hausa or English.
  const numericMatch = text.match(
    /\b(?:verse|ayah|ayat|aya)\s*(?:(?:ta|na|number)\s*)?(\d{1,3})\b/
  );

  let verse: number | undefined;

  if (numericMatch) {
    verse = Number(numericMatch[1]);
  } else {
    const wordMatch = text.match(
      /\b(?:aya|ayat|ayah|verse)\s+(?:(?:ta|na|number)\s+)?([a-z]+(?:\s+[a-z]+)?)\b/
    );

    if (wordMatch) {
      const numberText = wordMatch[1].trim();
      verse = numberWords[numberText];
    }
  }

  if (!verse || verse < 1 || verse > 286) {
    return null;
  }

  // Longest Surah names first to avoid matching shorter aliases prematurely.
  const names = Object.entries({
    ...SURAH_NAMES,
    ...SURAH_ALIASES,
  }).sort(([a], [b]) => b.length - a.length);

  for (const [name, chapter] of names) {
    if (text.includes(name)) {
      return { chapter, verse };
    }
  }

  return null;
}


const SURAH_ALIASES: Record<string, number> = {
  "kausar": 108,
  "kauthar": 108,
  "kawthar": 108,
  "al kausar": 108,
  "al kauthar": 108,
  "al kawthar": 108,
  "muzzammil": 73,
  "al muzzammil": 73,
  "mursalat": 77,
  "al mursalat": 77,
};

function findSurah(message: string) {
  const text = normalize(message);

  const combined = { ...SURAH_NAMES, ...SURAH_ALIASES };
  const names = Object.entries(combined).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [name, chapter] of names) {
    if (text.includes(name)) return chapter;
  }

  return null;
}

function wantsFullSurah(message: string) {
  const text = normalize(message);

  // A recognized individual verse always takes priority.
  if (findReference(message)) return false;

  return (
    /\b(full|complete|entire|whole|recite|read)\b/.test(text) ||
    (/\b(give me|show me|provide|display)\b/.test(text) &&
      /\b(surah|suratul|surat|chapter)\b/.test(text)) ||
    /\bsuratul\b/.test(text)
  );
}

function cleanTranslation(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}



const HADITH_COLLECTIONS: Record<string, string> = {
  "sahih al bukhari": "bukhari",
  "sahih bukhari": "bukhari",
  "bukhari": "bukhari",
  "sahih al muslim": "muslim",
  "sahih muslim": "muslim",
  "muslim": "muslim",
  "sunan abi dawud": "abudawud",
  "sunan abu dawud": "abudawud",
  "abu dawud": "abudawud",
  "abu-dawud": "abudawud",
  "abudawud": "abudawud",
  "jami at tirmidhi": "tirmidhi",
  "sunan al tirmidhi": "tirmidhi",
  "tirmidhi": "tirmidhi",
  "sunan an nasai": "nasai",
  "sunan al nasai": "nasai",
  "nasai": "nasai",
  "sunan ibn majah": "ibnmajah",
  "ibn majah": "ibnmajah",
  "ibnmajah": "ibnmajah",
  "muwatta malik": "malik",
  "muwatta": "malik",
  "malik": "malik",
};

function findHadithRequest(message: string) {
  const text = normalize(message).replace(/-/g, " ");

  if (!/\b(hadith|hadeeth|ahadith)\b/.test(text)) {
    return null;
  }

  const numberMatch =
    text.match(/\b(?:number|no)\s*(\d+)\b/) ||
    text.match(/\b(?:hadith|hadeeth|ahadith)\s+(\d+)\b/) ||
    text.match(/\b(\d+)\s+(?:hadith|hadeeth)\b/);

  if (!numberMatch) return null;

  const number = Number(numberMatch[1]);

  if (!Number.isSafeInteger(number) || number < 1) {
    return null;
  }

  const names = Object.entries(HADITH_COLLECTIONS)
    .sort(([a], [b]) => b.length - a.length);

  let collection = "bukhari";

  for (const [name, value] of names) {
    if (new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(text)) {
      collection = value;
      break;
    }
  }

  return { number, collection };
}

function getHadithJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Salaphie/1.0" } },
      (res) => {
        let body = "";
        res.setEncoding("utf8");

        res.on("data", (chunk: string) => {
          body += chunk;
        });

        res.on("end", () => {
          if (
            res.statusCode &&
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error("Invalid JSON from Hadith source"));
            }
          } else {
            reject(new Error("Hadith source HTTP " + res.statusCode));
          }
        });
      }
    );

    req.setTimeout(20000, () => {
      req.destroy(new Error("Hadith request timed out"));
    });

    req.on("error", reject);
  });
}

async function retrieveHadithEdition(
  edition: string,
  number: number
) {
  const url =
    "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/" +
    edition + "/" + number + ".json";

  const data = await getHadithJSON(url);

  if (!Array.isArray(data.hadiths)) {
    throw new Error("Invalid Hadith dataset response");
  }

  const hadith = data.hadiths.find(
    (item: { hadithnumber?: number | string }) =>
      Number(item.hadithnumber) === number
  );

  if (!hadith) return null;

  return { metadata: data.metadata, hadith };
}

async function retrieveHadithWithRetry(
  edition: string,
  number: number
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await retrieveHadithEdition(edition, number);
    } catch (error) {
      lastError = error;

      console.error(
        "[Salaphie Chat Hadith]",
        edition,
        "attempt",
        attempt,
        error
      );

      if (attempt < 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 700)
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Hadith source unavailable");
}

async function answerHadithRequest(
  collection: string,
  number: number
) {
  const [englishOutcome, arabicOutcome] = await Promise.allSettled([
    retrieveHadithWithRetry("eng-" + collection, number),
    retrieveHadithWithRetry("ara-" + collection, number),
  ]);

  const englishResult =
    englishOutcome.status === "fulfilled"
      ? englishOutcome.value
      : null;

  const arabicResult =
    arabicOutcome.status === "fulfilled"
      ? arabicOutcome.value
      : null;

  const english = englishResult?.hadith;
  const arabic = arabicResult?.hadith;

  const englishText =
    typeof english?.text === "string" ? english.text.trim() : "";

  const arabicText =
    typeof arabic?.text === "string" ? arabic.text.trim() : "";

  const englishFailed = englishOutcome.status === "rejected";
  const arabicFailed = arabicOutcome.status === "rejected";

  if (!englishText && !arabicText) {
    if (englishFailed || arabicFailed) {
      return {
        success: false,
        reply:
          "I couldn't connect reliably to the Hadith source after " +
          "three attempts. No alternative Hadith was substituted. " +
          "Please try again shortly.",
      };
    }

    return {
      success: false,
      reply:
        "The requested Hadith number " + number +
        " has no usable Arabic or English text in the retrieved dataset. " +
        "I will not substitute a different Hadith. Please verify the " +
        "number and collection against a reliable edition.",
    };
  }

  const metadata =
    englishResult?.metadata ?? arabicResult?.metadata;

  const reference =
    english?.reference ?? arabic?.reference;

  const grades =
    english?.grades ?? arabic?.grades ?? [];

  const section =
    metadata?.section?.[String(reference?.book)] ?? null;

  const parts = [
    metadata?.name ?? "Hadith collection",
    "Requested Hadith number: " + number,
  ];

  if (section) parts.push("Chapter: " + section);

  if (reference?.book && reference?.hadith) {
    parts.push(
      "In-book reference: Book " +
      reference.book +
      ", Hadith " +
      reference.hadith
    );
  }

  let reply = parts.join("\n") + "\n\n";

  if (arabicText) {
    reply += "Arabic:\n" + arabicText + "\n\n";
  } else if (arabicFailed) {
    reply +=
      "Arabic text could not be retrieved because the source " +
      "connection failed.\n\n";
  } else {
    reply +=
      "Arabic text was not available in this dataset record.\n\n";
  }

  if (englishText) {
    reply += "English translation:\n" + englishText + "\n\n";
  } else if (englishFailed) {
    reply +=
      "English translation could not be retrieved because the source " +
      "connection failed.\n\n";
  } else {
    reply +=
      "English text was not available in this dataset record.\n\n";
  }

  if (grades.length) {
    reply += "Grading information supplied by the dataset " +
      "(not independently verified by Salaphie):\n";

    for (const grade of grades) {
      reply +=
        "- " +
        (grade.name ?? "Grading") +
        ": " +
        (grade.grade ?? "Not specified") +
        "\n";
    }

    reply += "\n";
  } else {
    reply +=
      "Individual authenticity grading: Not supplied for this record " +
      "by the dataset. This absence does not itself establish " +
      "or negate authenticity.\n";
  }

  reply +=
    "\nSource: Fawaz Ahmed Hadith API dataset. " +
    "The dataset's text, numbering, and references should be checked " +
    "against a reliable edition. No missing text or grading has been invented.";

  return {
    success: true,
    reply,
    reference: parts.slice(0, 2).join(" — "),
    arabic: arabicText || "",
    translation: englishText || "",
    translationName: metadata?.name ?? "Hadith collection",
    source: "Hadith source",
    type: "hadith",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Please enter a question." },
        { status: 400 }
      );
    }

    // Preserve direct Qur'an verse lookup.
    const reference = findReference(message);

    if (reference) {
      if (
        reference.chapter < 1 ||
        reference.chapter > 114 ||
        reference.verse < 1
      ) {
        return NextResponse.json(
          { success: false, error: "That Qur'an reference is invalid." },
          { status: 400 }
        );
      }

      const url =
        `https://api.quran.com/api/v4/verses/by_key/` +
        `${reference.chapter}:${reference.verse}` +
        `?fields=text_uthmani&translations=85`;

      const response = await fetch(url, {
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            reply: "I couldn't retrieve that verse. Please check the reference.",
          },
          { status: 404 }
        );
      }

      const data = await response.json();
      const verse = data.verse;

      if (!verse?.text_uthmani) {
        return NextResponse.json(
          { success: false, reply: "The source did not return the verse text." },
          { status: 404 }
        );
      }

      const translation = verse.translations?.find(
        (item: { resource_id: number; text: string }) =>
          item.resource_id === 85 && item.text
      );

      return NextResponse.json({
        success: true,
        type: "quran_verse",
        reference: `Qur'an ${verse.verse_key}`,
        arabic: verse.text_uthmani,
        translation: translation ? cleanTranslation(translation.text) : null,
        translationName: "M.A.S. Abdel Haleem",
        source: "Quran.com API",
      });
    }

    // Retrieve a complete Surah when requested.
    if (wantsFullSurah(message)) {
      const chapter = findSurah(message);

      if (chapter) {
        const url =
          `https://api.quran.com/api/v4/verses/by_chapter/${chapter}` +
          `?fields=text_uthmani&translations=85&per_page=300`;

        const response = await fetch(url, {
          next: { revalidate: 86400 },
        });

        if (!response.ok) {
          return NextResponse.json(
            {
              success: false,
              reply: "I couldn't retrieve the complete Surah. Please try again.",
            },
            { status: 502 }
          );
        }

        const data = await response.json();
        const verses = data.verses;

        if (!Array.isArray(verses) || verses.length === 0) {
          return NextResponse.json(
            {
              success: false,
              reply: "The Qur'an source returned no verses for that Surah.",
            },
            { status: 502 }
          );
        }

        const arabic = verses
          .map(
            (v: { verse_key: string; text_uthmani: string }) =>
              `${v.text_uthmani} ۝${v.verse_key.split(":")[1]}`
          )
          .join("\n\n");

        const translation = verses
          .map(
            (v: {
              verse_key: string;
              translations?: { resource_id: number; text: string }[];
            }) => {
              const item = v.translations?.find(
                (t) => t.resource_id === 85 && t.text
              );

              return `${v.verse_key.split(":")[1]}. ${
                item ? cleanTranslation(item.text) : "[Translation unavailable]"
              }`;
            }
          )
          .join("\n\n");

        const surahName =
          Object.entries({ ...SURAH_NAMES, ...SURAH_ALIASES })
            .find(([, number]) => number === chapter)?.[0] ??
          `Chapter ${chapter}`;

        return NextResponse.json({
          success: true,
          type: "quran_verse",
          reference: `Surah ${surahName} — Qur'an ${chapter}:1-${verses.length}`,
          arabic,
          translation,
          translationName: "M.A.S. Abdel Haleem",
          source: "Quran.com API",
        });
      }
    }

    // Retrieve numbered Hadith directly from the source dataset.
    const hadithRequest = findHadithRequest(message);

    if (hadithRequest) {
      const result = await answerHadithRequest(
        hadithRequest.collection,
        hadithRequest.number
      );

      return NextResponse.json({
        ...result,
        type: result.success ? "hadith" : "answer",
      }, {
        status: result.success ? 200 : 502,
      });
    }

    // Natural-language Qur'an topic research
    const researchIntent = /\b(qur.?an|quranic|ayah|ayat|verse|verses|surah|surat|tafsir|allah|prophet|islamic|ayoyin|surorin|al.?qur.?ani|hakuri|iyaye|zunubi|rahama|imani|azaba)\b/i.test(message);
    const researchRequest = /\b(find|show|list|search|bring|collect|gather|all|more|verses|ayat|evidence|mentions?|about|what|give me|provide|retrieve|nemo|kawo|tara|duk|ina son|ina neman)\b/i.test(message);

    if (researchIntent && researchRequest && process.env.GROQ_API_KEY) {
      try {
        const intentResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              temperature: 0,
              max_tokens: 150,
              messages: [
                {
                  role: "system",
                  content:
                    'Understand the user request in English or Hausa. Convert it into 1-3 short English search queries for finding relevant Qur’an verses in English translations. Return only JSON in this format: {"queries":["patience","being patient"]}. Do not answer the question.',
                },
                { role: "user", content: message },
              ],
            }),
          }
        );

        if (intentResponse.ok) {
          const intentData = await intentResponse.json();
          const raw = intentData.choices?.[0]?.message?.content ?? "";
          const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          const parsed =
            start >= 0 && end > start
              ? JSON.parse(cleaned.slice(start, end + 1))
              : null;

          const queries: string[] = Array.isArray(parsed?.queries)
            ? parsed.queries
                .filter((q: unknown) => typeof q === "string" && q.trim())
                .slice(0, 3)
            : [];

          const results = await Promise.all(
            queries.map(async (query) => {
              const url =
                `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=10&language=en`;
              const response = await fetch(url, {
                next: { revalidate: 3600 },
              });
              if (!response.ok) return [];
              const data = await response.json();
              return Array.isArray(data.search) ? data.search : [];
            })
          );

          const unique = new Map<string, any>();
          for (const item of results.flat()) {
            if (typeof item.verse_key === "string") {
              unique.set(item.verse_key, item);
            }
          }

          const candidates = [...unique.values()].slice(0, 10);

          const retrieved = await Promise.all(
            candidates.map(async (item) => {
              const response = await fetch(
                `https://api.quran.com/api/v4/verses/by_key/${item.verse_key}?fields=text_uthmani&translations=85`,
                { next: { revalidate: 86400 } }
              );

              if (!response.ok) return null;

              const data = await response.json();
              const verse = data.verse;
              if (!verse?.text_uthmani) return null;

              const translation = verse.translations?.find(
                (t: { resource_id: number; text: string }) =>
                  t.resource_id === 85 && t.text
              );

              return {
                key: verse.verse_key,
                arabic: verse.text_uthmani,
                translation: translation
                  ? cleanTranslation(translation.text)
                  : "",
              };
            })
          );

          const verses = retrieved.filter(
            (v): v is {
              key: string;
              arabic: string;
              translation: string;
            } => v !== null
          );

          if (verses.length > 0) {
            const reply =
              `Qur'an search results for: "${message}"\n\n` +
              `Found ${verses.length} relevant search matches. This is not a guarantee that every verse on this topic has been found.\n\n` +
              verses
                .map(
                  (v, i) =>
                    `${i + 1}. Qur'an ${v.key}\n${v.arabic}\n${v.translation || "English translation unavailable."}`
                )
                .join("\n\n") +
              "\n\nTranslation: M.A.S. Abdel Haleem. Source: Quran.com API. Read each verse in its surrounding context.";

            return NextResponse.json({
              success: true,
              type: "answer",
              reply,
            });
          }
        }
      } catch (error) {
        console.error("[Salaphie Qur'an topic search]", error);
      }
    }

    // Answer general questions with the AI model.
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          reply: "Gemini is not configured. Please check GEMINI_API_KEY in .env.local.",
        },
        { status: 503 }
      );
    }

    const instructions = `You are Salaphie, an Islamic research assistant.

Answer the user's actual question directly, naturally, clearly, and helpfully.
You may also answer general educational, historical, language, science, and other knowledge questions.

For Islamic questions, prioritize the Qur'an, authentic Sunnah, and careful explanations consistent with the understanding of the Salaf al-Salih.
Never invent Qur'an quotations, Hadith wording, collection names, Hadith numbers, authenticity gradings, scholarly quotations, or citations.
Do not claim you verified a Hadith or consulted a book or scholar unless the source was actually provided and checked.
When a religious reference cannot be verified, say so clearly.
Distinguish established evidence from explanation and acknowledge genuine scholarly disagreement where relevant.
Do not refuse a question merely because it is not a verse lookup.
RESPONSE STYLE AND PRESENTATION:
Write in a polished, professional, natural style that is easy to read on a mobile phone.

Avoid excessive Markdown. Do not use repeated ### headings, excessive **bold text**, blockquotes, decorative horizontal rules, or unnecessary bullet lists.
Use plain, descriptive headings only when they genuinely improve clarity. Keep headings short and use them sparingly.
Prefer short, well-structured paragraphs with natural transitions.
For Islamic research answers, organize the content only as needed: direct answer, verified evidence, explanation, and source references.
When citing Qur'an, provide the surah name and verse number. Never invent Arabic text, translations, Hadith references, authenticity grades, or scholarly quotations.
Clearly distinguish the original Arabic text, its translation, and your explanation when all three are relevant.
Do not repeat the same point in multiple sections. Avoid lengthy introductions and unnecessary closing offers.
Never claim that a source was independently verified unless it was actually checked.
Answer in the language the user uses, preserving the user's language naturally and accurately.`;

    const aiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: instructions },
            { role: "user", content: message },
          ],
          temperature: 0.4,
          max_tokens: 1200,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();

      console.error(
        "Groq API error:",
        aiResponse.status,
        errorBody.slice(0, 1200)
      );

      return NextResponse.json(
        {
          success: false,
          reply: `Groq service error (${aiResponse.status}). Check the server terminal for details.`,
        },
        { status: 502 }
      );
    }

    const result = await aiResponse.json();

    const reply = result.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error(
        "Groq returned no text:",
        JSON.stringify(result.promptFeedback ?? result.candidates?.[0]?.finishReason ?? {})
      );

      return NextResponse.json(
        {
          success: false,
          reply: "Gemini returned no answer. Please try rephrasing your question.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      type: "answer",
      reply,
    });
  } catch (error) {
    console.error("Salaphie API route error:", error);

    const details =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        reply: "Salaphie encountered a server error. Please check the server logs.",
        error: process.env.NODE_ENV === "development" ? details : undefined,
      },
      { status: 500 }
    );
  }
}
