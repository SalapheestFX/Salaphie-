import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTIONS: Record<string, string> = {
  bukhari: "bukhari",
  muslim: "muslim",
  abudawud: "abudawud",
  "abu-dawud": "abudawud",
  tirmidhi: "tirmidhi",
  nasai: "nasai",
  "ibn-majah": "ibnmajah",
  ibnmajah: "ibnmajah",
  malik: "malik",
};

function getJSONOnce(url: string): Promise<any> {
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
          if (res.statusCode === 404) {
            resolve(null);
            return;
          }

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
            reject(
              new Error(`Hadith source returned HTTP ${res.statusCode}`)
            );
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

async function getJSON(url: string): Promise<any> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await getJSONOnce(url);
    } catch (error) {
      lastError = error;
      console.error(
        `[Salaphie Hadith] Attempt ${attempt}/3 failed:`,
        error
      );

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Hadith source unavailable after three attempts");
}

async function retrieve(edition: string, number: number) {
  const url =
    "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/" +
    `${edition}/${number}.json`;

  try {
    const data = await getJSON(url);

    if (data === null) {
      return null;
    }

    if (!Array.isArray(data.hadiths)) {
      throw new Error("Hadith records missing from response");
    }

    if (
      !data.metadata ||
      typeof data.metadata !== "object"
    ) {
      throw new Error("Hadith source metadata is missing or invalid");
    }

    const hadith = data.hadiths.find(
      (item: any) =>
        item &&
        Number(item.hadithnumber) === number
    );

    if (!hadith) {
      return null;
    }

    if (Number(hadith.hadithnumber) !== number) {
      throw new Error(
        "Hadith number mismatch: requested " +
        number +
        ", received " +
        String(hadith.hadithnumber)
      );
    }

    if (
      hadith.reference !== undefined &&
      hadith.reference !== null &&
      (
        typeof hadith.reference !== "object" ||
        Array.isArray(hadith.reference)
      )
    ) {
      throw new Error("Hadith reference has an invalid format");
    }

    return {
      metadata: data.metadata,
      hadith,
    };
  } catch (error) {
    console.error(`[Salaphie Hadith] ${edition}:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const requestedCollection = (
    params.get("collection") || "bukhari"
  )
    .toLowerCase()
    .trim();

  const number = Number(params.get("number") || "1");
  const collection = COLLECTIONS[requestedCollection];

  if (!collection) {
    return NextResponse.json(
      { success: false, error: "Unsupported Hadith collection." },
      { status: 400 }
    );
  }

  if (!Number.isSafeInteger(number) || number < 1) {
    return NextResponse.json(
      { success: false, error: "Enter a valid Hadith number." },
      { status: 400 }
    );
  }

  const outcomes = await Promise.allSettled([
    retrieve(`eng-${collection}`, number),
    retrieve(`ara-${collection}`, number),
  ]);

  const englishOutcome = outcomes[0];
  const arabicOutcome = outcomes[1];

  const englishResult =
    englishOutcome.status === "fulfilled"
      ? englishOutcome.value
      : null;

  const arabicResult =
    arabicOutcome.status === "fulfilled"
      ? arabicOutcome.value
      : null;

  const englishRecord = englishResult?.hadith;
  const arabicRecord = arabicResult?.hadith;

  const englishText =
    typeof englishRecord?.text === "string" &&
    englishRecord.text.trim().length > 0
      ? englishRecord.text.trim()
      : null;

  const arabicText =
    typeof arabicRecord?.text === "string" &&
    arabicRecord.text.trim().length > 0
      ? arabicRecord.text.trim()
      : null;

  if (!englishText && !arabicText) {
    const requestFailed =
      englishOutcome.status === "rejected" ||
      arabicOutcome.status === "rejected";

    return NextResponse.json(
      {
        success: false,
        error: requestFailed
          ? "The Hadith source could not be reached. Please try again."
          : "The requested record has no Arabic or English text in this dataset. No substitute Hadith was used.",
        collection,
        number,
        source: "Fawaz Ahmed Hadith API dataset",
      },
      { status: requestFailed ? 503 : 404 }
    );
  }

  const grades =
    englishRecord?.grades?.length
      ? englishRecord.grades
      : arabicRecord?.grades ?? [];

  const reference =
    englishRecord?.reference ?? arabicRecord?.reference ?? null;

  const metadata =
    englishResult?.metadata ?? arabicResult?.metadata;

  const section =
    metadata?.section?.[String(reference?.book)] ?? null;

  return NextResponse.json({
    success: true,
    collection: metadata?.name ?? collection,
    section,
    number,
    arabic: arabicText,
    english: englishText,
    reference,
    grades,
    gradingNote: grades.length
      ? "Grades supplied by the dataset; Salaphie has not independently " +
      "verified them against a named scholarly source."
      : "No individual grading is supplied in this dataset record. " +
      "This absence does not itself establish or negate authenticity.",
    source: "Fawaz Ahmed Hadith API dataset",
  });
}
