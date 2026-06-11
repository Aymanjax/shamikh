import { Component, type ErrorInfo, type ReactNode } from "react";
import { t } from "../i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-bg p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-lg font-black text-ink-primary mb-2">{t("misc.errorBoundary.title")}</h1>
          <p className="text-sm text-ink-muted mb-6 max-w-md">
            {t("misc.errorBoundary.message")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-ice-blue-600 hover:bg-ice-blue-700 text-paper font-bold py-2.5 px-6 rounded-xl transition text-sm cursor-pointer"
          >
            {t("misc.errorBoundary.reload")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
