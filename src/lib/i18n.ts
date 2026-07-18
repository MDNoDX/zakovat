"use client";

// App-wide interface language (uz/ru/en). This is deliberately separate from
// a quiz's own content language(s): this dictionary only covers the
// surrounding chrome — buttons, labels, empty states, dialogs — for both
// Edit Mode/Dashboard (driven by the presenter's own UI preference) and the
// small amount of Presentation Mode chrome that the audience sees (driven by
// whatever content language is currently selected on stage).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CollageRevealStyle, Language, PromptSize, QuestionType, RevealMode } from "@/types/quiz";

type Dict = Record<Language, string>;

export const UI_STRINGS = {
  // Dashboard
  yourQuizzes: { uz: "Sizning viktorinalaringiz", ru: "Ваши викторины", en: "Your quizzes" },
  newQuiz: { uz: "Yangi Zakovat", ru: "Новый Заковат", en: "New Quiz" },
  loadDemo: { uz: "Namuna: Kino Zakovati", ru: "Пример: Кино-викторина", en: "Demo: Movie Quiz" },
  viewDemo: {
    uz: "Tayyor namunani ko'rish",
    ru: "Посмотреть готовый пример",
    en: "View ready-made demo",
  },
  noQuizzesYet: {
    uz: "Hali hech qanday Zakovat yaratilmagan.",
    ru: "Пока не создано ни одной викторины.",
    en: "No quizzes created yet.",
  },
  createFirst: { uz: "Birinchisini yarating", ru: "Создать первую", en: "Create your first one" },

  // New quiz dialog
  newQuizDialogTitle: {
    uz: "Yangi Zakovat yaratish",
    ru: "Создание новой викторины",
    en: "Create new quiz",
  },
  nameLabel: { uz: "Nomi", ru: "Название", en: "Name" },
  descriptionLabel: { uz: "Tavsif", ru: "Описание", en: "Description" },
  optional: { uz: "(ixtiyoriy)", ru: "(необязательно)", en: "(optional)" },
  useRulesTemplate: {
    uz: "Qoidalar shabloni",
    ru: "Шаблон правил",
    en: "Rules template",
  },
  quizDescriptionHint: {
    uz: "Boshlash ekranida ko'rsatiladi — shartlar va ball olish tartibini shu yerga yozing.",
    ru: "Показывается на стартовом экране — опишите здесь правила и систему начисления баллов.",
    en: "Shown on the start screen — describe the rules and scoring here.",
  },
  descriptionPlaceholder: {
    uz: "Bu zakovat haqida qisqacha izoh...",
    ru: "Краткое описание этой викторины...",
    en: "A short note about this quiz...",
  },
  cancel: { uz: "Bekor qilish", ru: "Отмена", en: "Cancel" },
  create: { uz: "Yaratish", ru: "Создать", en: "Create" },

  // Quiz card / general nouns
  stageWord: { uz: "bosqich", ru: "этап", en: "stage" },
  questionWord: { uz: "savol", ru: "вопрос", en: "question" },
  start: { uz: "Boshlash", ru: "Начать", en: "Start" },
  quizNotFound: { uz: "Zakovat topilmadi.", ru: "Викторина не найдена.", en: "Quiz not found." },
  backToHome: {
    uz: "Bosh sahifaga qaytish",
    ru: "Вернуться на главную",
    en: "Back to home",
  },

  // Sidebar / edit mode
  addStage: { uz: "Bosqich qo'shish", ru: "Добавить этап", en: "Add stage" },
  mediaLibrary: { uz: "Media kutubxona", ru: "Медиатека", en: "Media library" },
  settings: { uz: "Sozlamalar", ru: "Настройки", en: "Settings" },
  duplicate: { uz: "Nusxalash", ru: "Дублировать", en: "Duplicate" },
  delete: { uz: "O'chirish", ru: "Удалить", en: "Delete" },
  addQuestion: { uz: "Savol qo'shish", ru: "Добавить вопрос", en: "Add question" },
  confirmDeleteQuestion: {
    uz: "Savolni o'chirasizmi?",
    ru: "Удалить этот вопрос?",
    en: "Delete this question?",
  },
  editModeAutosave: {
    uz: "Tahrirlash rejimi · avtomatik saqlanadi",
    ru: "Режим редактирования · сохраняется автоматически",
    en: "Edit mode · autosaves as you go",
  },
  startPresentation: {
    uz: "Taqdimotni boshlash",
    ru: "Начать презентацию",
    en: "Start presentation",
  },
  createStagePrompt: {
    uz: "Boshlash uchun chapdan bosqich yarating",
    ru: "Создайте этап слева, чтобы начать",
    en: "Create a stage on the left to get started",
  },

  // Quiz-level settings panel
  quizSettingsLabel: { uz: "Zakovat sozlamalari", ru: "Настройки викторины", en: "Quiz settings" },
  quizSettingsHeading: {
    uz: "Umumiy ma'lumotlar",
    ru: "Общая информация",
    en: "General information",
  },
  defaultLanguageLabel: {
    uz: "Asosiy til",
    ru: "Основной язык",
    en: "Default language",
  },
  defaultLanguageHint: {
    uz: "Taqdimot boshlanganda birinchi tanlanadigan til.",
    ru: "Язык, выбранный первым при запуске презентации.",
    en: "The language selected first when a presentation starts.",
  },
  quizOverviewLabel: { uz: "Umumiy holat", ru: "Обзор", en: "Overview" },

  // Stage settings panel
  stageSettingsLabel: { uz: "Bosqich sozlamalari", ru: "Настройки этапа", en: "Stage settings" },
  introAndRules: {
    uz: "Kirish slaydi va qoidalar",
    ru: "Вступительный слайд и правила",
    en: "Intro slide and rules",
  },
  stageNameLabel: { uz: "Bosqich nomi", ru: "Название этапа", en: "Stage name" },
  stageNamePlaceholder: { uz: "Masalan: 1-BOSQICH", ru: "Например: ЭТАП 1", en: "e.g. STAGE 1" },
  descRulesLabel: { uz: "Tavsif / qoidalar", ru: "Описание / правила", en: "Description / rules" },
  descRulesPlaceholder: {
    uz: "Ushbu bosqich qoidalarini yozing...",
    ru: "Опишите правила этого этапа...",
    en: "Write this stage's rules...",
  },
  revealOrderLabel: {
    uz: "Javob ochilish tartibi",
    ru: "Порядок показа ответов",
    en: "Answer reveal order",
  },

  // Stage intro slide styling
  introStyleLabel: {
    uz: "Kirish slaydi ko'rinishi",
    ru: "Вид вступительного слайда",
    en: "Intro slide look",
  },
  nameSizeLabel: { uz: "Nom o'lchami", ru: "Размер названия", en: "Name size" },
  descriptionSizeLabel: { uz: "Tavsif o'lchami", ru: "Размер описания", en: "Description size" },
  textAlignLabel: { uz: "Matn joylashuvi", ru: "Выравнивание текста", en: "Text alignment" },
  alignLeft: { uz: "Chapga", ru: "Слева", en: "Left" },
  alignCenter: { uz: "Markazda", ru: "По центру", en: "Center" },
  alignRight: { uz: "O'ngda", ru: "Справа", en: "Right" },
  textColorLabel: { uz: "Matn rangi", ru: "Цвет текста", en: "Text color" },
  useThemeColor: {
    uz: "Standart (mavzu rangi)",
    ru: "По умолчанию (цвет темы)",
    en: "Default (theme color)",
  },
  backgroundStyleLabel: { uz: "Fon uslubi", ru: "Стиль фона", en: "Background style" },
  bgNone: { uz: "Yo'q", ru: "Нет", en: "None" },
  bgGradient: { uz: "Gradient", ru: "Градиент", en: "Gradient" },
  bgSolid: { uz: "Bir xil rang", ru: "Сплошной цвет", en: "Solid color" },
  backgroundColorLabel: { uz: "Fon rangi", ru: "Цвет фона", en: "Background color" },
  sizeSmall: { uz: "Kichik", ru: "Маленький", en: "Small" },
  sizeMedium: { uz: "O'rta", ru: "Средний", en: "Medium" },
  sizeLarge: { uz: "Katta", ru: "Большой", en: "Large" },
  sizeHero: { uz: "Juda katta", ru: "Очень большой", en: "Hero" },

  // Media library
  mediaLibraryDescription: {
    uz: "Fayllarni yuklang yoki avval yuklangan mediadan qayta foydalaning.",
    ru: "Загрузите файлы или используйте уже загруженные медиа.",
    en: "Upload files or reuse media you've already uploaded.",
  },
  uploading: { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Uploading..." },
  clickToUpload: {
    uz: "Fayl yuklash uchun bosing",
    ru: "Нажмите, чтобы загрузить файл",
    en: "Click to upload a file",
  },
  noMediaYet: { uz: "Hali media yo'q", ru: "Пока нет медиа", en: "No media yet" },
  confirmDeleteMedia: {
    uz: "Ushbu faylni o'chirasizmi?",
    ru: "Удалить этот файл?",
    en: "Delete this file?",
  },
  select: { uz: "Tanlash", ru: "Выбрать", en: "Select" },
  editCaption: { uz: "Sarlavha qo'shish", ru: "Добавить подпись", en: "Add caption" },
  captionPromptMessage: {
    uz: "Ushbu media uchun qisqa matn (ixtiyoriy):",
    ru: "Короткая подпись для этого медиа (необязательно):",
    en: "Short caption for this media (optional):",
  },
  trimMedia: { uz: "Qirqish", ru: "Обрезать", en: "Trim" },
  trimMediaTitle: { uz: "Mediani qirqish", ru: "Обрезка медиа", en: "Trim media" },
  trimMediaDescription: {
    uz: "Kerakli qismini belgilang va yangi fayl sifatida saqlang.",
    ru: "Выберите нужный отрезок и сохраните как новый файл.",
    en: "Pick the part you need and save it as a new file.",
  },
  trimUnsupported: {
    uz: "Brauzeringiz mediani qirqishni qo'llab-quvvatlamaydi. Chrome yoki Edge'da urinib ko'ring.",
    ru: "Ваш браузер не поддерживает обрезку медиа. Попробуйте Chrome или Edge.",
    en: "Your browser doesn't support media trimming. Try Chrome or Edge.",
  },
  trimStartLabel: { uz: "Boshlanishi", ru: "Начало", en: "Start" },
  trimEndLabel: { uz: "Tugashi", ru: "Конец", en: "End" },
  extractAudioOnly: {
    uz: "Faqat audio sifatida olish (videosiz)",
    ru: "Извлечь только аудио (без видео)",
    en: "Extract audio only (no video)",
  },
  trimFailed: {
    uz: "Qirqishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
    ru: "Не удалось обрезать. Попробуйте ещё раз.",
    en: "Trimming failed. Please try again.",
  },
  processingTrim: { uz: "Ishlanmoqda...", ru: "Обработка...", en: "Processing..." },
  saveTrimAsNew: {
    uz: "Yangi fayl sifatida saqlash",
    ru: "Сохранить как новый файл",
    en: "Save as new file",
  },

  // Presentation start screen
  back: { uz: "Orqaga", ru: "Назад", en: "Back" },
  shortcutsTitle: {
    uz: "Klaviatura tugmalari",
    ru: "Горячие клавиши",
    en: "Keyboard shortcuts",
  },
  noQuestionsYet: {
    uz: "Ushbu zakovatda hali savollar yo'q.",
    ru: "В этой викторине пока нет вопросов.",
    en: "This quiz has no questions yet.",
  },
  backToEditing: {
    uz: "Tahrirlashga qaytish",
    ru: "Вернуться к редактированию",
    en: "Back to editing",
  },

  // Presentation-mode audience-facing chrome (driven by content language)
  correctAnswerLabel: { uz: "To'g'ri javob", ru: "Правильный ответ", en: "Correct answer" },
  recapLabel: {
    uz: "Savolni eslaymiz",
    ru: "Вспомним вопрос",
    en: "Recalling the question",
  },
  answerNotProvided: {
    uz: "Javob kiritilmagan",
    ru: "Ответ не указан",
    en: "No answer provided",
  },
  stageComplete: { uz: "Bosqich yakunlandi", ru: "Этап завершён", en: "Stage complete" },
  seeAnswers: { uz: "Javoblarni ko'ramiz", ru: "Смотрим ответы", en: "Let's see the answers" },
  reviewQuestionsAgain: {
    uz: "Savollarni yana bir bor ko'rib chiqish",
    ru: "Ещё раз просмотреть вопросы",
    en: "Review the questions once more",
  },
  backToAnswers: {
    uz: "Javoblarga qaytish",
    ru: "Вернуться к ответам",
    en: "Back to answers",
  },
  showAnswerCta: {
    uz: "Javobni ko'rsatish",
    ru: "Показать ответ",
    en: "Show the answer",
  },
  newStage: { uz: "Yangi bosqich", ru: "Новый этап", en: "New stage" },
  untitledStage: { uz: "Nomsiz bosqich", ru: "Этап без названия", en: "Untitled stage" },

  // Question editor panel
  editQuestion: { uz: "Savolni tahrirlash", ru: "Редактирование вопроса", en: "Edit question" },
  questionTextLabel: { uz: "Savol matni", ru: "Текст вопроса", en: "Question text" },
  questionTextPlaceholder: {
    uz: "Savolni shu yerga yozing...",
    ru: "Введите текст вопроса...",
    en: "Write the question here...",
  },
  quickAddTypeLabel: { uz: "Savol turi", ru: "Тип вопроса", en: "Question type" },
  quickAddSubmit: { uz: "Qo'shish", ru: "Добавить", en: "Add" },
  optionsLabel: { uz: "Variantlar", ru: "Варианты", en: "Options" },
  optionsHint: {
    uz: "To'g'ri javobni doiraga bosib belgilang",
    ru: "Отметьте правильный ответ, нажав на кружок",
    en: "Mark the correct answer by clicking its circle",
  },
  markCorrectTitle: {
    uz: "To'g'ri javob sifatida belgilash",
    ru: "Отметить как правильный ответ",
    en: "Mark as correct answer",
  },
  addOption: { uz: "Variant qo'shish", ru: "Добавить вариант", en: "Add option" },
  imageLabel: { uz: "Rasm", ru: "Изображение", en: "Image" },
  audioFileLabel: { uz: "Audio fayl", ru: "Аудиофайл", en: "Audio file" },
  audioStartPointLabel: {
    uz: "Boshlanish nuqtasi",
    ru: "Точка начала",
    en: "Start point",
  },
  audioStartPointHint: {
    uz: "Taqdimotda audio shu vaqtdan boshlanadi (faylning o'zi o'zgarmaydi)",
    ru: "В презентации аудио начнётся с этой отметки (сам файл не меняется)",
    en: "Playback in presentation starts here (the file itself is untouched)",
  },
  videoFileLabel: { uz: "Video fayl", ru: "Видеофайл", en: "Video file" },
  videoDisplaySizeLabel: {
    uz: "Ekranda ko'rinishi",
    ru: "Отображение на экране",
    en: "Screen display",
  },
  videoSizeContain: { uz: "Konteynerda", ru: "В рамке", en: "Contained" },
  videoSizeContainHint: {
    uz: "Video to'liq ko'rinadi, atrofida joy qoladi",
    ru: "Видео полностью видно, вокруг остаётся поле",
    en: "Whole video visible, framed with space around it",
  },
  videoSizeCover: { uz: "To'liq ekran", ru: "Во весь экран", en: "Full screen" },
  videoSizeCoverHint: {
    uz: "Ekranni to'liq qoplaydi, chetlari qirqilishi mumkin",
    ru: "Заполняет весь экран, края могут обрезаться",
    en: "Fills the whole screen, edges may be cropped",
  },
  imagesLabel: { uz: "Rasmlar", ru: "Изображения", en: "Images" },
  backgroundImageLabel: {
    uz: "Fon rasm (ixtiyoriy)",
    ru: "Фоновое изображение (необязательно)",
    en: "Background image (optional)",
  },
  backgroundImageHint: {
    uz: "Taqdimotda savol matni ortida to'liq ekran fon sifatida ko'rsatiladi",
    ru: "Показывается как полноэкранный фон за текстом вопроса во время презентации",
    en: "Shown as a full-screen background behind the question text during presentation",
  },
  timerLabel: { uz: "Vaqt hisoblagich", ru: "Таймер", en: "Timer" },
  timerOff: { uz: "O'chirilgan", ru: "Выключен", en: "Off" },
  answerSlideLabel: { uz: "Javob slaydi", ru: "Слайд ответа", en: "Answer slide" },
  correctAnswerFieldLabel: { uz: "To'g'ri javob", ru: "Правильный ответ", en: "Correct answer" },
  correctAnswerPlaceholder: {
    uz: "To'g'ri javobni yozing...",
    ru: "Введите правильный ответ...",
    en: "Write the correct answer...",
  },
  explanationLabel: { uz: "Izoh (ixtiyoriy)", ru: "Пояснение (необязательно)", en: "Explanation (optional)" },
  explanationPlaceholder: {
    uz: "Qo'shimcha izoh...",
    ru: "Дополнительное пояснение...",
    en: "Extra explanation...",
  },
  answerImageLabel: {
    uz: "Javob uchun rasm, video yoki audio (ixtiyoriy)",
    ru: "Фото, видео или аудио для ответа (необязательно)",
    en: "Image, video, or audio for the answer (optional)",
  },
  addAnswerMedia: {
    uz: "Media qo'shish (ixtiyoriy)",
    ru: "Добавить медиа (необязательно)",
    en: "Add media (optional)",
  },
  replaceMedia: { uz: "Almashtirish", ru: "Заменить", en: "Replace" },
  chooseFile: { uz: "Fayl tanlash", ru: "Выбрать файл", en: "Choose file" },
  collageImagesInfoSuffix: {
    uz: "ta rasm — tizim avtomatik kollaj yaratadi",
    ru: "фото — коллаж собирается автоматически",
    en: "image(s) — the collage builds automatically",
  },

  // Localized text/rich-text editor rows
  addLanguageAction: { uz: "Til qo'shish", ru: "Добавить язык", en: "Add language" },
  removeLanguageTitle: {
    uz: "Bu tilni o'chirish",
    ru: "Удалить этот язык",
    en: "Remove this language",
  },

  // Rich text toolbar
  toolbarBold: { uz: "Qalin", ru: "Жирный", en: "Bold" },
  toolbarItalic: { uz: "Kursiv", ru: "Курсив", en: "Italic" },
  toolbarUnderline: { uz: "Tag'ich chizilgan", ru: "Подчёркнутый", en: "Underline" },
  toolbarAlignLeft: { uz: "Chapga", ru: "По левому краю", en: "Align left" },
  toolbarAlignCenter: { uz: "Markazga", ru: "По центру", en: "Align center" },
  toolbarBulletList: { uz: "Ro'yxat", ru: "Список", en: "Bullet list" },
  toolbarOrderedList: { uz: "Raqamli ro'yxat", ru: "Нумерованный список", en: "Numbered list" },
  toolbarLink: { uz: "Havola", ru: "Ссылка", en: "Link" },
  linkPromptMessage: {
    uz: "Havola manzili (URL):",
    ru: "Адрес ссылки (URL):",
    en: "Link address (URL):",
  },

  // Presenter controls
  muteSounds: { uz: "Ovozlarni o'chirish", ru: "Выключить звук", en: "Mute sounds" },
  unmuteSounds: { uz: "Ovozlarni yoqish", ru: "Включить звук", en: "Unmute sounds" },
  prevSlide: { uz: "Oldingi slayd", ru: "Предыдущий слайд", en: "Previous slide" },
  nextSlide: { uz: "Keyingi slayd", ru: "Следующий слайд", en: "Next slide" },
  enterFullscreen: { uz: "To'liq ekran", ru: "Во весь экран", en: "Enter fullscreen" },
  exitFullscreen: { uz: "To'liq ekrandan chiqish", ru: "Выйти из полноэкранного режима", en: "Exit fullscreen" },

  // Backup / restore
  downloadBackup: { uz: "Zaxira yuklab olish", ru: "Скачать резервную копию", en: "Download backup" },
  restoreBackup: { uz: "Zaxiradan tiklash", ru: "Восстановить из копии", en: "Restore from backup" },
  backupHint: {
    uz: "Barcha ma'lumotlar faqat shu brauzerda saqlanadi — vaqti-vaqti bilan zaxira nusxa yuklab oling.",
    ru: "Все данные хранятся только в этом браузере — периодически скачивайте резервную копию.",
    en: "All data lives only in this browser — download a backup now and then.",
  },
  importSuccess: {
    uz: "tiklandi",
    ru: "восстановлено",
    en: "restored",
  },
  importFailed: {
    uz: "Faylni o'qib bo'lmadi. U to'g'ri Zakovat zaxira fayli ekanini tekshiring.",
    ru: "Не удалось прочитать файл. Проверьте, что это корректный файл резервной копии Zakovat.",
    en: "Couldn't read the file. Make sure it's a valid Zakovat backup file.",
  },
  pressEForExplanation: {
    uz: "Izoh uchun \"E\" tugmasini bosing",
    ru: "Нажмите «E» для пояснения",
    en: "Press \"E\" for the explanation",
  },
} satisfies Record<string, Dict>;

export type UiStringKey = keyof typeof UI_STRINGS;

const STAGE_QUESTION_INFO: Record<Language, { before: string; after: string }> = {
  uz: { before: "Ushbu bosqichda", after: "ta savol bor. Savol qo'shish yoki tartiblash uchun chapdagi ro'yxatdan foydalaning." },
  ru: { before: "В этом этапе", after: "вопрос(ов). Используйте список слева, чтобы добавлять или переставлять их." },
  en: { before: "This stage has", after: "question(s). Use the list on the left to add or reorder them." },
};

export function stageQuestionInfoParts(language: Language) {
  return STAGE_QUESTION_INFO[language];
}

export function confirmDeleteStageMessage(name: string, language: Language): string {
  switch (language) {
    case "ru":
      return `Удалить этап "${name}"?`;
    case "en":
      return `Delete stage "${name}"?`;
    default:
      return `"${name}" bosqichini o'chirasizmi?`;
  }
}

export function confirmDeleteQuizMessage(title: string, language: Language): string {
  switch (language) {
    case "ru":
      return `Удалить викторину "${title}"?`;
    case "en":
      return `Delete quiz "${title}"?`;
    default:
      return `"${title}"ni o'chirasizmi?`;
  }
}

interface UiLanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useUiLanguageStore = create<UiLanguageState>()(
  persist(
    (set) => ({
      language: "uz",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "zakovat-ui-language",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Translate a key against an explicit language — for Presentation Mode chrome. */
export function tFor(key: UiStringKey, language: Language): string {
  return UI_STRINGS[key][language] ?? UI_STRINGS[key].uz;
}

/** Hook for app chrome (dashboard/editor): reads the presenter's own UI-language preference. */
export function useT() {
  const language = useUiLanguageStore((s) => s.language);
  return (key: UiStringKey): string => tFor(key, language);
}

/**
 * A ready-made starting point for the quiz-level description: a brief
 * explanation of the rules plus a simple scoring scheme — exactly the kind
 * of content the presenter is expected to fill in there, just pre-written
 * so they can edit it down instead of starting from a blank box.
 */
const RULES_TEMPLATE: Dict = {
  uz: "<p><strong>Qoidalar:</strong> har bir savolga belgilangan vaqt ichida javob bering.</p><ul><li>To'g'ri javob — 1 ball</li><li>Vaqtida javob bermaslik — 0 ball</li><li>Eng ko'p ball to'plagan jamoa g'olib bo'ladi</li></ul>",
  ru: "<p><strong>Правила:</strong> отвечайте на каждый вопрос в отведённое время.</p><ul><li>Правильный ответ — 1 балл</li><li>Нет ответа вовремя — 0 баллов</li><li>Побеждает команда с наибольшим количеством баллов</li></ul>",
  en: "<p><strong>Rules:</strong> answer each question within the given time.</p><ul><li>Correct answer — 1 point</li><li>No answer in time — 0 points</li><li>The team with the most points wins</li></ul>",
};

export function rulesTemplateHtml(language: Language): string {
  return RULES_TEMPLATE[language] ?? RULES_TEMPLATE.uz;
}

// --- Editor picklists (question types, reveal modes, collage styles) -------
// These are structural editor labels (not quiz content), so they follow the
// same app UI language as the rest of the chrome, translated here rather
// than in types/quiz.ts to keep that file focused on data shape.

const QUESTION_TYPE_I18N: Record<QuestionType, { label: Dict; description: Dict }> = {
  text: {
    label: { uz: "Matnli savol", ru: "Текстовый вопрос", en: "Text question" },
    description: { uz: "Faqat savol matni", ru: "Только текст вопроса", en: "Question text only" },
  },
  "multiple-choice": {
    label: { uz: "Variantli savol", ru: "Вопрос с вариантами", en: "Multiple choice" },
    description: {
      uz: "4 ta variant, biri to'g'ri",
      ru: "4 варианта, один верный",
      en: "4 options, one correct",
    },
  },
  image: {
    label: { uz: "Rasmli savol", ru: "Вопрос с изображением", en: "Image question" },
    description: { uz: "Bitta rasm yuklanadi", ru: "Загружается одно изображение", en: "One image is uploaded" },
  },
  "multi-image": {
    label: { uz: "Kollaj savol", ru: "Вопрос-коллаж", en: "Collage question" },
    description: {
      uz: "Bir nechta rasm, avto-kollaj",
      ru: "Несколько изображений, авто-коллаж",
      en: "Multiple images, auto-collage",
    },
  },
  music: {
    label: { uz: "Musiqa savoli", ru: "Музыкальный вопрос", en: "Music question" },
    description: { uz: "Audio fayl, pleer bilan", ru: "Аудиофайл с плеером", en: "Audio file with a player" },
  },
  video: {
    label: { uz: "Video savol", ru: "Видеовопрос", en: "Video question" },
    description: {
      uz: "To'liq ekranli video pleer",
      ru: "Полноэкранный видеоплеер",
      en: "Full-screen video player",
    },
  },
};

export function questionTypeLabel(type: QuestionType, language: Language): string {
  return QUESTION_TYPE_I18N[type].label[language];
}

export function questionTypeDescription(type: QuestionType, language: Language): string {
  return QUESTION_TYPE_I18N[type].description[language];
}

const REVEAL_MODE_I18N: Record<RevealMode, { label: Dict; description: Dict }> = {
  "after-each": {
    label: { uz: "Har savoldan keyin", ru: "После каждого вопроса", en: "After each question" },
    description: {
      uz: "Savol → Javob → Keyingi savol",
      ru: "Вопрос → Ответ → Следующий вопрос",
      en: "Question → Answer → Next question",
    },
  },
  "end-of-stage": {
    label: { uz: "Bosqich oxirida", ru: "В конце этапа", en: "At the end of the stage" },
    description: {
      uz: "Barcha savollar → keyin barcha javoblar",
      ru: "Все вопросы → затем все ответы",
      en: "All questions → then all answers",
    },
  },
  manual: {
    label: { uz: "Qo'lda boshqarish", ru: "Ручное управление", en: "Manual control" },
    description: {
      uz: "Taqdimotchi o'zi qachon ochishni hal qiladi",
      ru: "Ведущий сам решает, когда открыть ответ",
      en: "The presenter decides when to reveal it",
    },
  },
};

export function revealModeLabel(mode: RevealMode, language: Language): string {
  return REVEAL_MODE_I18N[mode].label[language];
}

const PROMPT_SIZE_KEY: Record<PromptSize, "sizeSmall" | "sizeMedium" | "sizeLarge" | "sizeHero"> = {
  small: "sizeSmall",
  medium: "sizeMedium",
  large: "sizeLarge",
  hero: "sizeHero",
};

export function promptSizeLabel(size: PromptSize, language: Language): string {
  return tFor(PROMPT_SIZE_KEY[size], language);
}

export function revealModeDescription(mode: RevealMode, language: Language): string {
  return REVEAL_MODE_I18N[mode].description[language];
}

const COLLAGE_REVEAL_I18N: Record<CollageRevealStyle, { label: Dict; description: Dict }> = {
  "all-at-once": {
    label: { uz: "Barchasi birdan", ru: "Все сразу", en: "All at once" },
    description: {
      uz: "Kollaj to'liq holda darhol ko'rinadi",
      ru: "Коллаж сразу показывается целиком",
      en: "The collage appears fully at once",
    },
  },
  sequential: {
    label: { uz: "Ketma-ket", ru: "По очереди", en: "Sequential" },
    description: {
      uz: "Har bosishda navbatdagi rasm ochiladi",
      ru: "Каждое нажатие открывает следующее фото",
      en: "Each click reveals the next image",
    },
  },
};

export function collageRevealLabel(style: CollageRevealStyle, language: Language): string {
  return COLLAGE_REVEAL_I18N[style].label[language];
}

export function collageRevealDescription(style: CollageRevealStyle, language: Language): string {
  return COLLAGE_REVEAL_I18N[style].description[language];
}
