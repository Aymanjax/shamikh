import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-surface-alt p-4">
          <div className="bg-surface border border-red-200 rounded-3xl p-8 text-center max-w-md shadow-sm">
            <i className="fa-solid fa-bug text-5xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-black text-red-700 mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-ink-muted text-sm mb-4">حدث خطأ أثناء تحميل الصفحة. يرجى إعادة المحاولة.</p>
            <p className="text-[10px] text-ink-muted mb-4 bg-surface rounded-xl p-2 font-mono break-all">
              {this.state.error.message}
            </p>
            <button onClick={() => { this.setState({ error: null }); window.location.hash = "#/"; window.location.reload(); }}
              className="bg-brand-600 text-white py-2.5 px-6 rounded-xl font-bold text-sm hover:bg-brand-700 transition">
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
