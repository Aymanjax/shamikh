import { useState } from "react";
import { Shield, Check, ArrowRight, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useT } from "../../i18n";
import GlassButton from "../../components/ui/GlassButton";

export default function SecurityTab() {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!currentPassword || !newPassword) { setError("settings.security.fillAllFields"); return; }
    if (newPassword.length < 6) { setError("settings.security.newPasswordMinLength"); return; }
    if (newPassword !== confirmPassword) { setError("settings.security.passwordMismatch"); return; }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser!.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPassword);
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password") setError("settings.security.wrongPassword");
      else if (err.code === "auth/weak-password") setError("settings.security.weakPassword");
      else setError("settings.security.genericError");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink-primary tracking-tight">{t("settings.security.title")}</h1>
            <p className="text-sm text-ink-muted">{t("settings.security.subtitle")}</p>
          </div>
        </div>
        <Link to="/settings" className="text-ink-muted hover:text-ink-secondary transition p-2 touch-target self-end sm:self-auto shrink-0">
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="earth-card p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm rounded py-2.5 px-4">
            {t(error)}
          </div>
        )}
        {saved && (
          <div className="bg-olive-100 border-2 border-olive-200 text-olive-500 font-bold text-sm rounded py-2.5 px-4 flex items-center gap-2">
            <Check className="w-4 h-4" /> {t("settings.security.passwordChanged")}
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-ink-muted mb-1.5">{t("settings.security.currentPassword")}</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px]" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-bold text-ink-muted mb-1.5">{t("settings.security.newPassword")}</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px]" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-bold text-ink-muted mb-1.5">{t("settings.security.confirmPassword")}</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-medium min-h-[44px]" dir="ltr" />
        </div>
        <GlassButton variant="primary" className="w-full justify-center min-h-[48px]" onClick={handleSave} disabled={saving} icon={<KeyRound className="w-4 h-4" />}>
          {saving ? "..." : t("settings.security.changePassword")}
        </GlassButton>
      </div>
    </div>
  );
}
