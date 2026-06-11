import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "../components/ErrorBoundary";
import { applyLangToDocument, getLang } from "../i18n";
import "../index.css";
import { fetchPublicTheme } from "../features/theme/themeService";
import { useThemeStore } from "../store/themeStore";
import { applyTokens } from "../features/theme/applyTheme";

// ضبط اتجاه الصفحة واللغة قبل أول رسم بناءً على اللغة المحفوظة
applyLangToDocument(getLang());

const queryClient = new QueryClient();

// Load the admin-tuned theme as soon as possible. theme.css already ships the
// Shamikh defaults so first paint is correct; this overlays any admin overrides.
fetchPublicTheme()
  .then((theme) => {
    useThemeStore.getState().setTheme(theme);
    applyTokens(theme.tokens);
  })
  .catch(() => {
    /* keep CSS defaults on failure */
  });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
