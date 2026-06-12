// تسجيل خط Cairo (يدعم العربية) لمولّد @react-pdf — يُستورد مرة واحدة من pdfService.
// المسار مطلق من جذر التطبيق (BASE_URL) — كان سابقًا يُبنى من مسار الصفحة الحالية
// فيطلب /calculator/fonts/... ويفشل على كل صفحة غير الجذر، فتنهار كل ملفات الـPDF.
import { Font } from "@react-pdf/renderer";

const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const fontPath = `${base}/fonts/Cairo`;

Font.register({
  family: "Cairo",
  fonts: [
    { src: `${fontPath}-Regular.ttf`, fontWeight: 400 },
    { src: `${fontPath}-Bold.ttf`, fontWeight: 700 },
    { src: `${fontPath}-Black.ttf`, fontWeight: 900 },
  ],
});

// تعطيل فصل المقاطع — يشوّه الكلمات العربية
Font.registerHyphenationCallback((word) => [word]);
