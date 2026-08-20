"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorDisplay({ error, onRetry, title }: ErrorDisplayProps) {
  return (
    <Card className="py-12 text-center">
      <CardContent>
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p className="text-red-600 mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
