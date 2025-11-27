"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, ServerCrash, WifiOff, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ============================================
// Error Boundary Component
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorDisplay
          title="Something went wrong"
          description="An unexpected error occurred. Please try refreshing the page."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error Display Components
// ============================================

interface ErrorDisplayProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  showHomeLink?: boolean;
  showBackLink?: boolean;
}

export function ErrorDisplay({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  icon,
  onRetry,
  showHomeLink = true,
  showBackLink = false,
}: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          {icon || <AlertTriangle className="h-8 w-8 text-destructive" />}
        </div>
        <h3 className="font-mono text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {showBackLink && (
            <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
          {showHomeLink && (
            <Button asChild variant="ghost" className="gap-2">
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Specific Error States
// ============================================

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Connection Failed"
      description="Unable to connect to the server. Please check your internet connection and try again."
      icon={<WifiOff className="h-8 w-8 text-destructive" />}
      onRetry={onRetry}
      showHomeLink={false}
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Server Error"
      description="Our servers are having trouble right now. Please try again in a few moments."
      icon={<ServerCrash className="h-8 w-8 text-destructive" />}
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ 
  resourceType = "Resource",
  showBackLink = true 
}: { 
  resourceType?: string;
  showBackLink?: boolean;
}) {
  return (
    <ErrorDisplay
      title={`${resourceType} Not Found`}
      description={`The ${resourceType.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      icon={<FileQuestion className="h-8 w-8 text-muted-foreground" />}
      showBackLink={showBackLink}
    />
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Get started by creating your first item.",
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="border-border/50 bg-card/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="font-mono text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}

// ============================================
// Inline Error States (for cards/sections)
// ============================================

export function InlineError({
  message = "Failed to load",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-destructive">{message}</span>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 text-xs">
          Retry
        </Button>
      )}
    </div>
  );
}

// ============================================
// Loading Error Combo (for async data)
// ============================================

interface AsyncStateProps<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  loadingComponent: ReactNode;
  errorComponent?: ReactNode;
  children: (data: T) => ReactNode;
  onRetry?: () => void;
}

export function AsyncState<T>({
  isLoading,
  error,
  data,
  loadingComponent,
  errorComponent,
  children,
  onRetry,
}: AsyncStateProps<T>) {
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorDisplay
            title="Failed to load"
            description={error.message}
            onRetry={onRetry}
          />
        )}
      </>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No data"
        description="No data available to display."
      />
    );
  }

  return <>{children(data)}</>;
}

