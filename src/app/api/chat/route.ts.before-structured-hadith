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

  // Direct reference such as Qur'an 3:50 or 3:50
  const direct = text.match(/\b(?:quran\s*)?(\d{1,3})\s*:\s*(\d{1,3})\b/);

  if (direct) {
    return {
      chapter: Number(direct[1]),
      verse: Number(direct[2]),
    };
  }

  // Named Surah with a verse number
  const verseMatch = text.match(
    /\b(?:verse|ayah|ayat)\s*(?:number\s*)?(\d{1,3})\b/
  );

  if (!verseMatch) return null;

  const verse = Number(verseMatch[1]);

  for (const [name, chapter] of Object.entries(SURAH_NAMES)) {
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

  return { success: true, reply };
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
        success: result.success,
        type: "answer",
        reply: result.reply,
      }, {
        status: result.success ? 200 : 502,
      });
    }

    // Answer general questions with the AI model.
    const apiKey = process.env.GEMINI_API_KEY;

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
Use readable paragraphs and concise lists when helpful.
Answer in the language the user uses.`;

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: instructions }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();

      console.error(
        "Gemini API error:",
        aiResponse.status,
        errorBody.slice(0, 1200)
      );

      return NextResponse.json(
        {
          success: false,
          reply: `Gemini service error (${aiResponse.status}). Check the server terminal for details.`,
        },
        { status: 502 }
      );
    }

    const result = await aiResponse.json();

    const reply = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("\n")
      .trim();

    if (!reply) {
      console.error(
        "Gemini returned no text:",
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
  } catch {
    return NextResponse.json(
      {
        success: false,
        reply: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
