import { Component } from 'react';
import { Button, Card } from './ui';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking service (Sentry, etc.)
    // captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center p-4">
          <Card className="max-w-md text-center">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Oops! Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer font-mono text-xs">Details</summary>
                <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload page
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                className="flex-1"
              >
                Go home
              </Button>
            </div>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}