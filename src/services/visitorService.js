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
    let ip = "";
    try {
      const geo = await fetch("https://ip-api.com/json/?fields=country,countryCode,city,query,status").then((r) => r.json());
      if (geo.status === "success") {
        country = geo.country;
        countryCode = geo.countryCode?.toLowerCase() || "";
        city = geo.city || "";
        ip = geo.query || "";
      }
    } catch {}

    await addDoc(collection(db, "visitors"), {
      country,
      countryCode,
      city,
      ip,
      date: Timestamp.now(),
      dateDay: today,
      page: window.location.hash || "/",
    });
  } catch {
    // silent
  }
}

function getDateStr(d) {
  return d.toISOString().split("T")[0];
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function getVisitorStats() {
  try {
    const snap = await getDocs(query(collection(db, "visitors"), orderBy("date", "desc"), fbLimit(5000)));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const now = new Date();
    const todayStr = getDateStr(now);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const today = all.filter((v) => v.dateDay === todayStr).length;
    const thisWeek = all.filter((v) => v.date?.toDate?.() >= weekAgo).length;
    const thisMonth = all.filter((v) => v.date?.toDate?.() >= monthAgo).length;
    const total = all.length;

    const countries = {};
    const cities = {};
    all.forEach((v) => {
      const c = v.country || "غير معروف";
      countries[c] = (countries[c] || 0) + 1;
      if (v.city && v.city !== "-") {
        const key = `${c} - ${v.city}`;
        cities[key] = (cities[key] || 0) + 1;
      }
    });
    const countryList = Object.entries(countries)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const cityList = Object.entries(cities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = getDateStr(d);
      last7.push({ date: ds, count: all.filter((v) => v.dateDay === ds).length });
    }

    const recent = all.slice(0, 20).map((v) => ({
      ip: v.ip || "-",
      country: v.country || "-",
      countryCode: v.countryCode || "",
      city: v.city || "-",
      time: v.date?.toDate?.()?.toLocaleString("ar-JO") || "-",
    }));

    return { total, today, thisWeek, thisMonth, countryList, cityList, last7, recent };
  } catch {
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0, countryList: [], cityList: [], last7: [], recent: [] };
  }
}
