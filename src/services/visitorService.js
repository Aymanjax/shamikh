import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, limit as fbLimit } from "firebase/firestore";

const VISIT_KEY = "shamikh_visit_date";

export async function trackVisit() {
  try {
    const today = new Date().toISOString().split("T")[0];
    if (localStorage.getItem(VISIT_KEY) === today) return;
    localStorage.setItem(VISIT_KEY, today);

    let country = "غير معروف";
    let countryCode = "";
    let city = "";
    try {
      const geo = await fetch("https://ip-api.com/json/?fields=country,countryCode,city,query,status").then((r) => r.json());
      if (geo.status === "success") {
        country = geo.country;
        countryCode = geo.countryCode?.toLowerCase() || "";
        city = geo.city || "";
      }
    } catch {}

    await addDoc(collection(db, "visitors"), {
      country,
      countryCode,
      city,
      date: Timestamp.now(),
      dateDay: today,
    });
  } catch {
    // silent
  }
}

export async function getVisitorStats() {
  try {
    const snap = await getDocs(query(collection(db, "visitors"), orderBy("date", "desc"), fbLimit(1000)));
    const all = snap.docs.map((d) => d.data());

    const total = all.length;
    const today = all.filter((v) => v.dateDay === new Date().toISOString().split("T")[0]).length;
    const countries = {};
    all.forEach((v) => {
      const key = v.country || "غير معروف";
      countries[key] = (countries[key] || 0) + 1;
    });
    const countryList = Object.entries(countries)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, today, countryList };
  } catch {
    return { total: 0, today: 0, countryList: [] };
  }
}
