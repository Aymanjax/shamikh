// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Building2, Save, Check, ArrowRight, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n";
import GlassButton from "../../components/ui/GlassButton";

const NAME_MAX_LENGTH = 200;
const ADDRESS_MAX_LENGTH = 500;
const PHONE_MAX_LENGTH = 20;

export default function CompanyTab() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    cancelledRef.current = false;
    getDoc(doc(db, "users", user.uid, "profile", "main"))
      .then((snap) => {
        if (cancelledRef.current) return;
        if (snap.exists()) {
          const data = snap.data();
          setCompanyName(data.companyName || "");
          setAddress(data.address || "");
          setPhone(data.phone || "");
          setLogoURL(data.logoURL || "");
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelledRef.current) setLoading(false); });
    return () => { cancelledRef.current = true; };
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `logos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLogoURL(url);
    } catch {}
    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    if (!user || !logoURL) return;
    try {
      await deleteObject(ref(storage, `logos/${user.uid}`));
      setLogoURL("");
    } catch {}
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveError("");
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid, "profile", "main"), {
        companyName: companyName.trim(),
        address: address.trim(),
        phone,
        logoURL,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("settings.errors.saveFailed");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-earth-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-earth-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-earth-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="earth-card p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-earth-200 rounded mb-2 animate-pulse" />
              <div className="h-11 w-full bg-earth-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="earth-card p-8 text-center">
        <Building2 className="w-10 h-10 text-ink-muted mx-auto mb-3" />
        <p className="text-sm font-black text-ink-primary">{t("settings.notSignedIn")}</p>
        <p className="text-xs text-ink-muted mt-1">{t("settings.company.signInPrompt")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink-primary tracking-tight truncate">{t("settings.company.title")}</h1>
            <p className="text-sm text-ink-muted truncate">{t("settings.company.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link to="/settings" className="text-ink-muted hover:text-ink-secondary transition p-2 touch-target">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <GlassButton variant="primary" size="sm" icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
            {saving ? t("settings.saving") : saved ? t("settings.done") : t("common.save")}
          </GlassButton>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded" role="alert">{t(saveError)}</div>
      )}

      <div className="earth-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {logoURL ? (
            <div className="relative shrink-0">
              <img src={logoURL} alt={t("settings.company.logo")} className="w-20 h-20 rounded object-cover border-2 border-earth-200" />
              <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="w-20 h-20 shrink-0 rounded border-2 border-dashed border-earth-300 flex items-center justify-center cursor-pointer hover:border-terracotta-400 transition bg-earth-100">
              {uploading ? (
                <span className="text-xs text-ink-muted">{t("settings.company.uploading")}</span>
              ) : (
                <Upload className="w-6 h-6 text-ink-muted" />
              )}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
            </label>
          )}
          <div>
            <h3 className="text-sm font-black text-ink-primary">{t("settings.company.logo")}</h3>
            <p className="text-xs text-ink-muted">{t("settings.company.logoHint")}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="company-name" className="text-sm font-bold text-ink-muted">{t("settings.company.nameLabel")}</label>
            <span className="text-[10px] font-bold text-ink-muted font-mono">{companyName.length}/{NAME_MAX_LENGTH}</span>
          </div>
          <input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="organization"
            dir="auto"
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px] break-words"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="company-address" className="text-sm font-bold text-ink-muted">{t("settings.company.addressLabel")}</label>
            <span className="text-[10px] font-bold text-ink-muted font-mono">{address.length}/{ADDRESS_MAX_LENGTH}</span>
          </div>
          <input
            id="company-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={ADDRESS_MAX_LENGTH}
            autoComplete="street-address"
            dir="auto"
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px] break-words"
          />
        </div>
        <div>
          <label htmlFor="company-phone" className="block text-sm font-bold text-ink-muted mb-1.5">{t("settings.phoneLabel")}</label>
          <input
            id="company-phone"
            value={phone}
            onChange={(e) => e.target.value.length <= PHONE_MAX_LENGTH && setPhone(e.target.value)}
            maxLength={PHONE_MAX_LENGTH}
            dir="ltr"
            autoComplete="tel"
            inputMode="tel"
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
