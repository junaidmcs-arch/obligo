import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary
      fallback={
        <main className="fatal">
          <h1>We couldn’t open Obligo</h1>
          <p>
            Your browser may be blocking local storage. Enable IndexedDB and
            reload to try again.
          </p>
          <button
            className="button button-primary"
            onClick={() => location.reload()}
          >
            Try again
          </button>
        </main>
      }
    >
      {children}
    </ReactErrorBoundary>
  );
}
