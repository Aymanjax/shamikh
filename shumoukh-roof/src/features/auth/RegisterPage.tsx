// @ts-nocheck
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { UserPlus, Eye, EyeOff, AlertCircle, Loader2, Gift } from "lucide-react";
import { registerUser, getUserProfile } from "./authService";
import { useAuthStore } from "../../store/authStore";

const easing = [0.22, 1, 0.36, 1];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setSubscription = useAuthStore((s) => s.setSubscription);
  const reducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("يرجى إدخال الاسم");
      return;
    }
    if (password.length < 6) {
      setError("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser(email, password, name);
      // مزامنة الاشتراك المجاني (6 أشهر) مع المتجر مباشرة حتى تُفتح كل الميزات فوراً
      const profile = await getUserProfile(user.uid).catch(() => null);
      if (profile) {
        setRole(profile.role || "user");
        setSubscription(profile.subscription || null);
      }
      setUser(user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 16, x: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.35, ease: easing }}
        className="bg-earth-50 rounded-2xl border border-earth-200 shadow-card p-8 w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: easing, delay: reducedMotion ? 0 : 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: reducedMotion ? 1 : 0.8, opacity: reducedMotion ? 1 : 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: easing, delay: reducedMotion ? 0 : 0.2 }}
            className="w-16 h-16 rounded-xl bg-terracotta-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-terracotta-500/25"
          >
            <UserPlus className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-xl font-black text-earth-800 tracking-tight">إنشاء حساب</h1>
          <p className="text-sm text-earth-500 mt-1">انضم إلى شموخ ERP</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-olive-700 bg-olive-100 border border-olive-200 px-3 py-1.5 rounded-sm">
            <Gift className="w-3.5 h-3.5" />
            اشتراك مجاني كامل الميزات لمدة 6 أشهر
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: easing }}
              className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700 font-bold flex items-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.06, delayChildren: reducedMotion ? 0 : 0.25 } }
          }}
        >
          {[
            { label: "الاسم", type: "text", value: name, setter: setName, placeholder: "محمد أحمد", dir: "rtl" },
            { label: "البريد الإلكتروني", type: "email", value: email, setter: setEmail, placeholder: "info@example.com", dir: "ltr" },
          ].map((field) => (
            <motion.div
              key={field.label}
              variants={{
                hidden: { opacity: 0, y: reducedMotion ? 0 : 10, x: reducedMotion ? 0 : 6 },
                visible: { opacity: 1, y: 0, x: 0 }
              }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: easing }}
              className="space-y-1"
            >
              <label className="text-xs font-bold text-earth-600">{field.label}</label>
              <input type={field.type} value={field.value} onChange={(e) => {
                const val = field.type === "text" ? e.target.value.slice(0, 100) : e.target.value;
                field.setter(val);
              }}
                required dir={field.dir}
                className="w-full bg-earth-100 border border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-400/10 transition-colors duration-200 font-medium text-earth-800 placeholder:text-earth-400"
                placeholder={field.placeholder}
                maxLength={field.type === "text" ? 100 : undefined}
              />
            </motion.div>
          ))}

          <motion.div
            variants={{
              hidden: { opacity: 0, y: reducedMotion ? 0 : 10, x: reducedMotion ? 0 : 6 },
              visible: { opacity: 1, y: 0, x: 0 }
            }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: easing }}
            className="space-y-1"
          >
            <label className="text-xs font-bold text-earth-600">كلمة السر</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} required dir="ltr" minLength={6}
                className="w-full bg-earth-100 border border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-400/10 transition-colors duration-200 font-medium text-earth-800 placeholder:text-earth-400 ltr pr-10"
                placeholder="••••••••"
              />
              <motion.button
                type="button"
                onClick={() => setShowPw(!showPw)}
                whileTap={{ scale: reducedMotion ? 1 : 0.9 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
              >
                <motion.div
                  key={showPw ? "eyeoff" : "eye"}
                  initial={{ rotate: reducedMotion ? 0 : -90, opacity: reducedMotion ? 1 : 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.15, ease: easing }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.div>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: reducedMotion ? 0 : 10, x: reducedMotion ? 0 : 6 },
              visible: { opacity: 1, y: 0, x: 0 }
            }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: easing }}
          >
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: reducedMotion ? 1 : 1.01 }}
              whileTap={loading ? {} : { scale: reducedMotion ? 1 : 0.97 }}
              transition={{ duration: reducedMotion ? 0 : 0.1 }}
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-terracotta-400 disabled:cursor-not-allowed text-white font-black py-2.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-terracotta-500/15"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="icon"
                    initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading-text"
                    initial={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                  >
                    جارٍ إنشاء الحساب...
                  </motion.span>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                  >
                    إنشاء حساب
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.5 }}
          className="mt-6 text-center text-xs text-earth-500 font-bold"
        >
          لديك حساب؟{" "}
          <Link to="/login" className="text-terracotta-600 hover:text-terracotta-700 font-black transition-colors">تسجيل دخول</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
