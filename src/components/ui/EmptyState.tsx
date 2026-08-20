// ═══════════════════════════════════════════════════════════════════════════════
// iSCARB — EmptyState Component
// Shown when a list or data source has no items.
// ═══════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-2xl bg-muted p-4">
        {icon || <Inbox className="h-8 w-8 text-muted-foreground" />}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <AppButton variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </AppButton>
      )}
    </div>
  );
}
