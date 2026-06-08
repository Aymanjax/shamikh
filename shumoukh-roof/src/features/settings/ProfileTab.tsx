// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { User, Save, Check, RotateCw, AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import GlassButton from "../../components/ui/GlassButton";

const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 20;
const PHONE_PATTERN = /^[\d+\s\-().]+$/;

export default function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setDisplayName(user.displayName || "");
    setOriginalName(user.displayName || "");
    setLoading(true);
    setLoadError("");
    cancelledRef.current = false;
    getDoc(doc(db, "users", user.uid, "profile", "main"))
      .then((snap) => {
        if (cancelledRef.current) return;
        if (snap.exists()) {
          const savedPhone = snap.data().phone || "";
          setPhone(savedPhone);
          setOriginalPhone(savedPhone);
        }
      })
      .catch(() => {
        if (cancelledRef.current) return;
        setLoadError("فشل تحميل بيانات الملف الشخصي");
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
    return () => { cancelledRef.current = true; };
  }, [user]);

  const hasChanges = displayName.trim() !== originalName || phone !== originalPhone;

  const handleNameChange = useCallback((value: string) => {
    setNameError("");
    setDisplayName(value);
    if (value.length >= NAME_MAX_LENGTH) {
      setNameError(`الحد الأقصى ${NAME_MAX_LENGTH} حرف`);
    }
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneError("");
    if (value.length > PHONE_MAX_LENGTH) return;
    const stripped = value.replace(/\s/g, "");
    if (stripped.length > 0 && !PHONE_PATTERN.test(stripped)) {
      setPhoneError("أرقام فقط");
      return;
    }
    setPhone(value);
  }, []);

  const handleReset = useCallback(() => {
    setDisplayName(originalName);
    setPhone(originalPhone);
    setNameError("");
    setPhoneError("");
  }, [originalName, originalPhone]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError("الاسم مطلوب");
      nameRef.current?.focus();
      return;
    }
    if (trimmed.length < 2) {
      setNameError("الاسم قصير جداً");
      nameRef.current?.focus();
      return;
    }
    setDisplayName(trimmed);
    setSaving(true);
    setNameError("");
    setPhoneError("");
    try {
      await Promise.all([
        updateProfile(user, { displayName: trimmed }),
        setDoc(doc(db, "users", user.uid, "profile", "main"), { displayName: trimmed, phone }, { merge: true }),
      ]);
      setOriginalName(trimmed);
      setOriginalPhone(phone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err?.code === "auth/network-request-failed"
        ? "لا يوجد اتصال بالإنترنت، حاول مرة أخرى"
        : "فشل الحفظ، حاول مرة أخرى";
      setNameError(msg);
    }
    setSaving(false);
  }, [user, displayName, phone]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-earth-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-earth-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-earth-100 rounded animate-pulse" />
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
        <User className="w-10 h-10 text-ink-muted mx-auto mb-3" />
        <p className="text-sm font-black text-ink-primary">لم يتم تسجيل الدخول</p>
        <p className="text-xs text-ink-muted mt-1">سجل الدخول لعرض الملف الشخصي</p>
      </div>
    );
  }

  const displayedName = user.displayName || "";
  const firstChar = displayedName ? [...displayedName][0] : "?";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <span className="text-white font-black text-base" aria-hidden="true">{firstChar}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-ink-primary tracking-tight truncate">الملف الشخصي</h1>
            <p className="text-sm text-ink-muted truncate">{user.email || "الاسم، البريد الإلكتروني، رقم الهاتف"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {hasChanges && (
            <GlassButton variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={handleReset}>
              إلغاء
            </GlassButton>
          )}
          <GlassButton variant="primary" size="sm" icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "جارٍ الحفظ..." : saved ? "تم" : "حفظ"}
          </GlassButton>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2" role="alert">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="earth-card p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="profile-name" className="text-sm font-bold text-ink-muted">الاسم</label>
            <span className={`text-[10px] font-bold font-mono ${displayName.length > NAME_MAX_LENGTH * 0.85 ? "text-red-500" : "text-ink-muted"}`}>
              {displayName.length}/{NAME_MAX_LENGTH}
            </span>
          </div>
          <input
            id="profile-name"
            ref={nameRef}
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="name"
            dir="auto"
            className={`w-full bg-white border-2 rounded-xl py-2.5 px-4 text-sm outline-none transition font-medium min-h-[44px] break-words ${
              nameError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-earth-200 focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100"
            }`}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "profile-name-error" : undefined}
            disabled={saving}
          />
          {nameError && (
            <p id="profile-name-error" className="text-[11px] text-red-500 font-medium mt-1" role="alert">{nameError}</p>
          )}
        </div>
        <div>
          <label htmlFor="profile-email" className="block text-sm font-bold text-ink-muted mb-1.5">البريد الإلكتروني</label>
          <input
            id="profile-email"
            value={user.email || ""}
            disabled
            dir="ltr"
            className="w-full bg-earth-50 border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none text-ink-muted cursor-not-allowed min-h-[44px] break-all"
          />
          <p className="text-xs text-ink-muted mt-1">لا يمكن تغيير البريد الإلكتروني</p>
        </div>
        <div>
          <label htmlFor="profile-phone" className="block text-sm font-bold text-ink-muted mb-1.5">رقم الهاتف</label>
          <input
            id="profile-phone"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            maxLength={PHONE_MAX_LENGTH}
            dir="ltr"
            autoComplete="tel"
            inputMode="tel"
            className={`w-full bg-white border-2 rounded-xl py-2.5 px-4 text-sm outline-none transition font-medium min-h-[44px] ${
              phoneError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-earth-200 focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100"
            }`}
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? "profile-phone-error" : undefined}
            disabled={saving}
          />
          {phoneError && (
            <p id="profile-phone-error" className="text-[11px] text-red-500 font-medium mt-1" role="alert">{phoneError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
