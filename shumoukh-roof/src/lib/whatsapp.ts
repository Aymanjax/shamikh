// Helpers for sharing via WhatsApp — the default channel for Jordanian
// contractors talking to workers, clients, and suppliers.

/** Normalize a Jordanian phone to international form for wa.me (962…). */
export function normalizeJordanPhone(raw?: string): string {
  if (!raw) return "";
  let p = raw.replace(/[^0-9]/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("962")) return p;
  if (p.startsWith("07")) return "962" + p.slice(1); // 07XXXXXXXX → 9627XXXXXXXX
  if (p.length === 9 && p.startsWith("7")) return "962" + p;
  return p;
}

/** Open a WhatsApp chat (to a number if given, else the share picker). */
export function openWhatsApp(phone: string | undefined, message: string): void {
  const p = normalizeJordanPhone(phone);
  const url = p
    ? `https://wa.me/${p}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
