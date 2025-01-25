import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] relative overflow-hidden rounded-lg border border-red-900/50 bg-gray-900/50 backdrop-blur-md p-6">
          <div className="tech-circuit opacity-5" />
          <div className="data-grid" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h3 className="text-lg font-mono text-red-500">System Alert</h3>
            </div>
            <p className="text-red-400/80 font-mono mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md font-mono text-sm transition-colors"
            >
              Reinitialize System
            </button>
          </div>
          <div className="auth-scan opacity-20" />
        </div>
      );
    }

    return this.props.children;
  }
}