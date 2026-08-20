import React from "react";
import { PageHeader } from "@/components/iscarb/PageHeader";

interface CareerPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
}

export function CareerPageHeader({ title, description, icon, actionButton }: CareerPageHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      leftElement={icon}
      action={
        actionButton
          ? {
              label: actionButton.label,
              onClick: actionButton.onClick,
              variant: actionButton.variant || "primary",
            }
          : undefined
      }
    />
  );
}
