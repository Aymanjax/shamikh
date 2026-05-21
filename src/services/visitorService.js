import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

const VISITOR_KEY = "shamikh_visitor_id";
const VISIT_KEY = "shamikh_visit_date";

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export async function trackVisit() {
  try {
    const today = new Date().toISOString().split("T")[0];
    if (localStorage.getItem(VISIT_KEY) === today) return;
    localStorage.setItem(VISIT_KEY, today);

    const visitorId = getVisitorId();
    const geo = await fetch("https://ip-api.com/json/?fields=country,countryCode,city,query,status").then((r) => r.json());

    await addDoc(collection(db, "visitors"), {
      visitorId,
      country: geo.status === "success" ? geo.country : "غير معروف",
      countryCode: geo.status === "success" ? geo.countryCode?.toLowerCase() : "unknown",
      city: geo.status === "success" ? geo.city : "",
      ip: geo.query || "",
      userAgent: navigator.userAgent || "",
      date: Timestamp.now(),
      dateDay: today,
    });
  } catch {
    // silent
  }
}

export async function getVisitorStats() {
  const snap = await getDocs(query(collection(db, "visitors"), orderBy("date", "desc")));
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
}
