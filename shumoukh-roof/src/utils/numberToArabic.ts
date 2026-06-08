// @ts-nocheck
const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
  "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر",
  "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];

const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];

const HUNDREDS = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];

const THOUSANDS = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف",
  "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];

function twoDigits(n) {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return TENS[t];
  return ONES[u] + " و" + TENS[t];
}

function threeDigits(n) {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let result = "";
  if (h > 0) result = HUNDREDS[h];
  if (rem > 0) {
    if (result) result += " و";
    result += twoDigits(rem);
  }
  return result;
}

function convertUpTo999999(n) {
  if (n === 0) return "";
  const thousands = Math.floor(n / 1000);
  const rem = n % 1000;
  let result = "";
  if (thousands > 0) {
    if (thousands === 1) result = "ألف";
    else if (thousands === 2) result = "ألفان";
    else if (thousands <= 10) result = THOUSANDS[thousands];
    else result = threeDigits(thousands) + " ألفاً";
  }
  if (rem > 0) {
    if (result) result += " و";
    result += threeDigits(rem);
  }
  return result;
}

export function numberToArabicWords(num) {
  if (num === 0) return "صفر دينار";
  if (num < 0) return "سالب " + numberToArabicWords(-num);

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let words;

  if (intPart === 0) {
    words = "صفر";
  } else if (intPart < 1000) {
    words = threeDigits(intPart);
  } else if (intPart < 1000000) {
    words = convertUpTo999999(intPart);
  } else {
    const millions = Math.floor(intPart / 1000000);
    const rem = intPart % 1000000;
    if (millions === 1) {
      words = "مليون";
    } else if (millions === 2) {
      words = "مليونان";
    } else {
      words = numberToArabicWords(millions) + " مليوناً";
    }
    if (rem > 0) {
      words += " و" + (rem < 1000 ? threeDigits(rem) : convertUpTo999999(rem));
    }
  }

  if (intPart === 1) words = "دينار واحد";
  else if (intPart === 2) words = "ديناران";
  else if (intPart > 2) words += " ديناراً";

  if (decPart > 0) {
    const pi = Math.floor(decPart);
    let pWord = twoDigits(pi);
    if (!pWord) pWord = threeDigits(pi);
    if (pi === 1) pWord = "قرش واحد";
    else if (pi === 2) pWord = "قرشان";
    else pWord += " قرشاً";

    words += " و" + pWord;
  }

  return "فقط " + words + " لا غير";
}