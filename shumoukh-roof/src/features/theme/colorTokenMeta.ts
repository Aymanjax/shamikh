import type { ThemeTokens } from "./themeTypes";

export interface TokenField {
  key: keyof ThemeTokens;
  labelAr: string;
  /** color → swatch picker + hex; text → free text (borders, glows, fonts) */
  type: "color" | "text";
}

export interface TokenGroup {
  titleAr: string;
  fields: TokenField[];
}

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    titleAr: "الأسطح",
    fields: [
      { key: "surfaceBg", labelAr: "خلفية عامة", type: "color" },
      { key: "surfaceCard", labelAr: "البطاقات", type: "color" },
      { key: "surfaceElevated", labelAr: "المرتفعة", type: "color" },
      { key: "surfaceSidebar", labelAr: "الشريط الجانبي", type: "color" },
      { key: "surfaceNav", labelAr: "شريط التنقل", type: "color" },
      { key: "surfaceCardBorder", labelAr: "حد البطاقة", type: "text" },
    ],
  },
  {
    titleAr: "النصوص",
    fields: [
      { key: "inkPrimary", labelAr: "أساسي", type: "color" },
      { key: "inkSecondary", labelAr: "ثانوي", type: "color" },
      { key: "inkMuted", labelAr: "خافت", type: "color" },
      { key: "inkInverse", labelAr: "معكوس", type: "color" },
    ],
  },
  {
    titleAr: "اللون الأساسي · برونز",
    fields: [
      { key: "accentTerracotta", labelAr: "أساسي", type: "color" },
      { key: "accentTerracottaSoft", labelAr: "فاتح", type: "color" },
      { key: "accentTerracottaBorder", labelAr: "حد", type: "color" },
      { key: "accentTerracottaGlow", labelAr: "توهج", type: "text" },
    ],
  },
  {
    titleAr: "الثانوي · تيل",
    fields: [
      { key: "accentOlive", labelAr: "أساسي", type: "color" },
      { key: "accentOliveSoft", labelAr: "فاتح", type: "color" },
      { key: "accentOliveBorder", labelAr: "حد", type: "color" },
      { key: "accentOliveGlow", labelAr: "توهج", type: "text" },
    ],
  },
  {
    titleAr: "مساعد · ذهبي",
    fields: [
      { key: "accentAmber", labelAr: "أساسي", type: "color" },
      { key: "accentAmberSoft", labelAr: "فاتح", type: "color" },
      { key: "accentAmberBorder", labelAr: "حد", type: "color" },
      { key: "accentAmberGlow", labelAr: "توهج", type: "text" },
    ],
  },
  {
    titleAr: "تنبيه · أحمر",
    fields: [
      { key: "accentRed", labelAr: "أساسي", type: "color" },
      { key: "accentRedSoft", labelAr: "فاتح", type: "color" },
      { key: "accentRedBorder", labelAr: "حد", type: "color" },
    ],
  },
  {
    titleAr: "الخطوط",
    fields: [
      { key: "fontSans", labelAr: "الخط الأساسي", type: "text" },
      { key: "fontMono", labelAr: "الخط الرقمي", type: "text" },
    ],
  },
];
