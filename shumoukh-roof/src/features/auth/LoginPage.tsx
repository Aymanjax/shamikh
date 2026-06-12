// @ts-nocheck
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { LogIn, HardHat, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { loginUser, loginWithGoogle } from "./authService";
import { useAuthStore } from "../../store/authStore";
import "../../styles/cockpit.css";
import { useUiTheme } from "../../store/uiThemeStore";
import { useT } from "../../i18n";

const easing = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const reducedMotion = useReducedMotion();
  const t = useT();
  const uiLight = useUiTheme((s) => s.light);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      setUser(user);
      navigate("/");
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? t("auth.error.userNotFound") :
        err.code === "auth/wrong-password" ? t("auth.error.wrongPassword") :
        err.code === "auth/invalid-credential" ? t("auth.error.invalidCredential") :
        err.code === "auth/invalid-email" ? t("auth.error.invalidEmail") :
        err.code === "auth/too-many-requests" ? t("auth.error.tooManyRequests") :
        err.message || t("auth.error.loginFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      useAuthStore.getState().setUser(user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || t("auth.error.googleLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`cockpit-root${uiLight ? " cockpit-light" : ""} min-h-screen bg-earth-100 flex items-center justify-center p-4 relative z-10`}>
      <div className="cockpit-grid" />
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
            <HardHat className="w-8 h-8 text-paper" />
          </motion.div>
          <h1 className="text-xl font-black text-earth-800 tracking-tight">{t("auth.loginTitle")}</h1>
          <p className="text-sm text-earth-500 mt-1">{t("app.name")} — {t("app.tagline")}</p>
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
            { label: t("auth.email"), type: "email", value: email, setter: setEmail, placeholder: "info@example.com", dir: "ltr" },
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
              <input type={field.type} value={field.value} onChange={(e) => field.setter(e.target.value)}
                required dir={field.dir}
                className="w-full bg-earth-100 border border-earth-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-400/10 transition-colors duration-200 font-medium text-earth-800 placeholder:text-earth-400"
                placeholder={field.placeholder}
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
            <label className="text-xs font-bold text-earth-600">{t("auth.password")}</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} required dir="ltr"
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
              className="w-full bg-olive-500 hover:bg-olive-600 disabled:bg-olive-400 disabled:cursor-not-allowed text-earth-100 font-black py-2.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-olive-500/15"
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
                    <LogIn className="w-4 h-4" />
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
                    {t("auth.loggingIn")}
                  </motion.span>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                  >
                    {t("auth.loginButton")}
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
          className="relative my-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-earth-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-earth-50 px-3 text-earth-400 font-bold">{t("auth.or")}</span>
          </div>
        </motion.div>

        <motion.button
          onClick={handleGoogle}
          disabled={loading}
          whileHover={loading ? {} : { scale: reducedMotion ? 1 : 1.01 }}
          whileTap={loading ? {} : { scale: reducedMotion ? 1 : 0.97 }}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 10, x: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: easing, delay: reducedMotion ? 0 : 0.55 }}
          className="w-full bg-white hover:bg-earth-100 disabled:opacity-50 border border-earth-200 text-earth-700 font-black py-2.5 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t("auth.google")}
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.6 }}
          className="mt-6 text-center text-xs text-earth-500 font-bold"
        >
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-terracotta-600 hover:text-terracotta-700 font-black transition-colors">{t("auth.createAccount")}</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
