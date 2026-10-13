import { NextResponse } from "next/server";

const QURAN_API = "https://api.quran.com/api/v4";
const TRANSLATION_ID = 85;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));

  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(verse) ||
    chapter < 1 ||
    chapter > 114 ||
    verse < 1
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Please provide a valid chapter and verse number.",
      },
      { status: 400 }
    );
  }

  try {
    const url =
      `${QURAN_API}/verses/by_key/${chapter}:${verse}` +
      `?fields=text_uthmani&translations=${TRANSLATION_ID}`;

    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "The Qur'an source could not retrieve this reference.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const result = data.verse;

    if (!result || !result.text_uthmani) {
      return NextResponse.json(
        {
          success: false,
          error: "The verse text was not available.",
        },
        { status: 404 }
      );
    }

    const translation = result.translations?.find(
      (item: { resource_id: number; text: string }) =>
        item.resource_id === TRANSLATION_ID && item.text
    );

    return NextResponse.json({
      success: true,
      reference: `Qur'an ${result.verse_key}`,
      chapter: result.verse_key.split(":")[0],
      verse: result.verse_number,
      arabic: result.text_uthmani,
      translation: translation?.text ?? null,
      translationName: "M.A.S. Abdel Haleem",
      source: "Quran.com API",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not connect to the Qur'an source. Please try again.",
      },
      { status: 502 }
    );
  }
}
