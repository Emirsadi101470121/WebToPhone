import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            {this.props.fallbackMessage || "An unexpected error occurred. Try refreshing the page."}
          </p>
          {this.state.error && (
            <code className="mt-4 max-w-md rounded-lg bg-red-500/5 px-4 py-2 text-xs text-red-400">
              {this.state.error.message}
            </code>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
