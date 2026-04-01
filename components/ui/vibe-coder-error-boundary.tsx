import React from 'react';

type State = { hasError: boolean; error: string };

/**
 * Isolates Vibe Coder render failures so the rest of the app (chat, dock) keeps working.
 */
export class VibeCoderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('VibeCoderErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0a0a0a] p-8 text-center text-[#e5e5e5]">
          <p className="text-sm text-white/90">Vibe Coder could not render this response.</p>
          {this.state.error ? (
            <pre className="max-h-48 max-w-lg overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 text-left font-mono text-[11px] leading-relaxed text-white/55">
              {this.state.error}
            </pre>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/[0.12]"
            onClick={() => this.setState({ hasError: false, error: '' })}
          >
            Reset view
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
