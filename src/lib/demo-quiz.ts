"use client";

// Builds a ready-made, 6-stage "Kino Zakovati" (movie quiz) demo so a new
// user can see the app fully working with real content instead of a blank
// slate. All media is generated in-house (gradient/typography clue cards,
// hand-drawn genre icons, originally-synthesized short melodies) — nothing
// is a real movie poster, still, or soundtrack, so there's no copyright
// concern. Facts referenced in questions (directors, release years, studio
// history) are ordinary public trivia.

import { uid } from "@/lib/utils";
import { useQuizStore } from "@/lib/store";
import { saveMediaBlob } from "@/lib/media";
import type {
  LocalizedText,
  MediaKind,
  Question,
  Quiz,
  RevealMode,
  Stage,
  TimerSeconds,
} from "@/types/quiz";

function lt(text: string): LocalizedText {
  return [{ language: "uz", content: `<p>${text}</p>` }];
}

async function registerMedia(
  path: string,
  name: string,
  kind: MediaKind,
  mimeType: string,
  width?: number,
  height?: number
): Promise<string> {
  const res = await fetch(path);
  const blob = await res.blob();
  const id = uid();
  await saveMediaBlob(id, blob);
  useQuizStore.getState().addMedia({
    id,
    kind,
    name,
    mimeType,
    size: blob.size,
    createdAt: Date.now(),
    width,
    height,
  });
  return id;
}

function baseQuestion(
  now: number,
  prompt: string,
  correct: string,
  timerSeconds: TimerSeconds = 30,
  explanation?: string
) {
  return {
    id: uid(),
    prompt: lt(prompt),
    timerSeconds,
    answer: {
      correctText: lt(correct),
      explanation: explanation ? lt(explanation) : undefined,
      mediaId: null,
    },
    backgroundImageId: null,
    createdAt: now,
    updatedAt: now,
  };
}

function mkStage(now: number, name: string, revealMode: RevealMode, questions: Question[]): Stage {
  return {
    id: uid(),
    name: lt(name),
    description: lt(""),
    revealMode,
    questions,
    createdAt: now,
    updatedAt: now,
  };
}

export async function installDemoQuiz(): Promise<string> {
  const now = Date.now();

  const [
    clue1,
    clue2,
    clue3,
    clue4,
    clue5,
    genreAction,
    genreComedy,
    genreScifi,
    genreHorror,
    genreRomance,
    genreAdventure,
    genreDrama,
    genreAnimation,
    melodyMysterious,
    melodyEpic,
    melodyPlayful,
    melodyRomantic,
    melodySuspense,
  ] = await Promise.all([
    registerMedia("/demo/clue-1.png", "3 so'z jumboq — 1", "image", "image/png", 1200, 800),
    registerMedia("/demo/clue-2.png", "3 so'z jumboq — 2", "image", "image/png", 1200, 800),
    registerMedia("/demo/clue-3.png", "3 so'z jumboq — 3", "image", "image/png", 1200, 800),
    registerMedia("/demo/clue-4.png", "3 so'z jumboq — 4", "image", "image/png", 1200, 800),
    registerMedia("/demo/clue-5.png", "3 so'z jumboq — 5", "image", "image/png", 1200, 800),
    registerMedia("/demo/genre-action.png", "Janr: Aksiya", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-comedy.png", "Janr: Komediya", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-scifi.png", "Janr: Fantastika", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-horror.png", "Janr: Dahshat", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-romance.png", "Janr: Romantik", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-adventure.png", "Janr: Sarguzasht", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-drama.png", "Janr: Drama", "image", "image/png", 800, 800),
    registerMedia("/demo/genre-animation.png", "Janr: Multfilm", "image", "image/png", 800, 800),
    registerMedia("/demo/melody-mysterious.mp3", "Sirli ohang — mistik", "audio", "audio/mpeg"),
    registerMedia("/demo/melody-epic.mp3", "Sirli ohang — epik", "audio", "audio/mpeg"),
    registerMedia("/demo/melody-playful.mp3", "Sirli ohang — o'yinqaroq", "audio", "audio/mpeg"),
    registerMedia("/demo/melody-romantic.mp3", "Sirli ohang — romantik", "audio", "audio/mpeg"),
    registerMedia("/demo/melody-suspense.mp3", "Sirli ohang — talvasali", "audio", "audio/mpeg"),
  ]);

  // Stage 1 — guess the movie from a short plot description
  const stage1 = mkStage(now, "Tavsif bo'yicha top", "after-each", [
    {
      ...baseQuestion(
        now,
        "Katta kema muzliklarga urilib, kemada uchrashgan ikki yosh oshiqning taqdiri hal bo'ladigan tarixiy melodrama qaysi film?",
        "Titanik"
      ),
      type: "text",
    },
    {
      ...baseQuestion(
        now,
        "Genetik tajriba yordamida qayta tiklangan dinozavrlar bilan to'la oroldagi park haqidagi film qaysi?",
        "Yurasik park"
      ),
      type: "text",
    },
    {
      ...baseQuestion(
        now,
        "Qahramon o'zi yashayotgan dunyoning aslida kompyuter simulyatsiyasi ekanini bilib qoladigan fantastik film qaysi?",
        "Matritsa"
      ),
      type: "text",
    },
    {
      ...baseQuestion(
        now,
        "Bayram arafasida oilasi tomonidan uyda yolg'iz qoldirilgan bola uyni o'g'rilardan himoya qiladigan komediya qaysi?",
        "Uyda yolg'iz"
      ),
      type: "text",
    },
  ]);

  // Stage 2 — multiple-choice movie trivia
  const stage2 = mkStage(now, "Variantli bilim", "after-each", [
    {
      ...baseQuestion(now, "«Titanik» filmining rejissyori kim?", "James Cameron", 20),
      type: "multiple-choice",
      options: [
        { id: uid(), text: lt("James Cameron") },
        { id: uid(), text: lt("Steven Spielberg") },
        { id: uid(), text: lt("Christopher Nolan") },
        { id: uid(), text: lt("Ridley Scott") },
      ],
      correctOptionId: null,
    },
    {
      ...baseQuestion(
        now,
        "Marvel kinematografik olamidagi birinchi film (\"Temir odam\") qaysi yili chiqqan?",
        "2008",
        20
      ),
      type: "multiple-choice",
      options: [
        { id: uid(), text: lt("2008") },
        { id: uid(), text: lt("2000") },
        { id: uid(), text: lt("2012") },
        { id: uid(), text: lt("2016") },
      ],
      correctOptionId: null,
    },
    {
      ...baseQuestion(
        now,
        "«Yuzuklar Hukmdori» trilogiyasi qaysi yozuvchining romani asosida suratga olingan?",
        "J.R.R. Tolkien",
        20
      ),
      type: "multiple-choice",
      options: [
        { id: uid(), text: lt("J.R.R. Tolkien") },
        { id: uid(), text: lt("J.K. Rowling") },
        { id: uid(), text: lt("George R.R. Martin") },
        { id: uid(), text: lt("C.S. Lewis") },
      ],
      correctOptionId: null,
    },
    {
      ...baseQuestion(
        now,
        "Pixar studiyasining birinchi to'liq metrajli animatsion filmi qaysi?",
        "O'yinchiqlar hikoyasi",
        20
      ),
      type: "multiple-choice",
      options: [
        { id: uid(), text: lt("O'yinchiqlar hikoyasi") },
        { id: uid(), text: lt("Ivasi") },
        { id: uid(), text: lt("Merilar") },
        { id: uid(), text: lt("Kelib chiqishi") },
      ],
      correctOptionId: null,
    },
  ]);

  // Fix correctOptionId now that option ids exist
  for (const q of stage2.questions) {
    if (q.type === "multiple-choice") {
      q.correctOptionId = q.options[0].id;
    }
  }

  // Stage 3 — "3 so'z bilan top" image clue cards
  const clueDefs: { mediaId: string; answer: string; explanation: string }[] = [
    { mediaId: clue1, answer: "Yuzuklar Hukmdori", explanation: "Oltin uzuk, Mordor vulqoni — Sauronning yuzugi." },
    { mediaId: clue2, answer: "Muzlik yurak (Frozen)", explanation: "Muzdan qasr va sehrli kuch — Elsa haqida." },
    { mediaId: clue3, answer: "Avatar", explanation: "Pandora ormoni, mexanik kostyumlar, begona sayyora." },
    { mediaId: clue4, answer: "Dune", explanation: "Cho'l sayyorasi Arrakis, qum va ulkan qurtlar." },
    { mediaId: clue5, answer: "Boshlanish (Inception)", explanation: "Tushlar, aylanuvchi shahar, ko'p qavatli xayol." },
  ];
  const stage3 = mkStage(
    now,
    "3 so'z bilan top",
    "after-each",
    clueDefs.map((c) => ({
      ...baseQuestion(now, "Ushbu uchta so'z qaysi filmga ishora qiladi?", c.answer, 30, c.explanation),
      type: "image" as const,
      mediaId: c.mediaId,
    }))
  );

  // Stage 4 — genre-icon collage rounds
  const stage4 = mkStage(now, "Janrni top", "manual", [
    {
      ...baseQuestion(
        now,
        "Ushbu to'rtta belgi qaysi kino janrlarini anglatadi? Barchasini sanab bering.",
        "Aksiya, Komediya, Fantastika, Dahshat",
        60
      ),
      type: "multi-image",
      mediaIds: [genreAction, genreComedy, genreScifi, genreHorror],
      revealStyle: "sequential",
    },
    {
      ...baseQuestion(
        now,
        "Ushbu to'rtta belgi qaysi kino janrlarini anglatadi? Barchasini sanab bering.",
        "Romantik, Sarguzasht, Drama, Multfilm",
        60
      ),
      type: "multi-image",
      mediaIds: [genreRomance, genreAdventure, genreDrama, genreAnimation],
      revealStyle: "sequential",
    },
  ]);

  // Stage 5 — "Sirli ohang" mood-guessing music round
  const melodyDefs: { mediaId: string; answer: string }[] = [
    { mediaId: melodyMysterious, answer: "Sirli / mistik kayfiyat" },
    { mediaId: melodyEpic, answer: "Epik / jasoratli kayfiyat" },
    { mediaId: melodyPlayful, answer: "O'yinqaroq / quvnoq kayfiyat" },
    { mediaId: melodyRomantic, answer: "Romantik kayfiyat" },
    { mediaId: melodySuspense, answer: "Talvasali / hayajonli kayfiyat" },
  ];
  const stage5 = mkStage(
    now,
    "Sirli ohang",
    "after-each",
    melodyDefs.map((m) => ({
      ...baseQuestion(now, "Ushbu ohang qaysi kayfiyatni ifodalaydi?", m.answer, 20),
      type: "music" as const,
      mediaId: m.mediaId,
    }))
  );

  // Stage 6 — mixed finale bonus round
  const stage6 = mkStage(now, "Final: Aralash bonus", "manual", [
    {
      ...baseQuestion(
        now,
        "IMDb reytingida ko'plab yillar birinchi o'rinni saqlab turgan 1994 yilgi drama film qaysi?",
        "Shoushank qamog'idan qochish",
        null
      ),
      type: "text",
    },
    {
      ...baseQuestion(now, "«Boshlanish» (Inception) filmining rejissyori kim?", "Christopher Nolan", null),
      type: "multiple-choice",
      options: [
        { id: uid(), text: lt("Christopher Nolan") },
        { id: uid(), text: lt("James Cameron") },
        { id: uid(), text: lt("Denis Villeneuve") },
        { id: uid(), text: lt("David Fincher") },
      ],
      correctOptionId: null,
    },
    {
      ...baseQuestion(
        now,
        "Yaponiyaning Ghibli studiyasi tomonidan suratga olingan va \"Oskar\" mukofotini yutgan animatsion film qaysi?",
        "Ruhlar olib qochilishi",
        null
      ),
      type: "text",
    },
  ]);
  for (const q of stage6.questions) {
    if (q.type === "multiple-choice") {
      q.correctOptionId = q.options[0].id;
    }
  }

  const quiz: Quiz = {
    id: uid(),
    title: "Kino Zakovati",
    description: "Tayyor namuna: 6 bosqichdan iborat kino mavzusidagi to'liq zakovat.",
    defaultLanguage: "uz",
    stages: [stage1, stage2, stage3, stage4, stage5, stage6],
    createdAt: now,
    updatedAt: now,
  };

  useQuizStore.getState().installQuiz(quiz);
  return quiz.id;
}
