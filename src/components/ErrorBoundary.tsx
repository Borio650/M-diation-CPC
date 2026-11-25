import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Une erreur inattendue est survenue.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Erreur capturée par ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#D8E5F3] rounded-xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-semibold text-[#0F2942] mb-3">
              MÉDITATION CPC
            </h1>
            <p className="text-sm text-[#4A637D] leading-relaxed mb-6">
              L’application a rencontré une difficulté technique temporaire. Vous pouvez recharger la page pour continuer votre méditation.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1769AA] text-white text-sm font-medium hover:bg-[#2876C8] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
