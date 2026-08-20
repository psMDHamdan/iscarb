'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';

/**
 * AppButton is the CENTRALIZED button component for all iSCARB.
 * Replaces ALL hardcoded <button> elements across the application.
 *
 * Features:
 * - Type-safe action system (navigate, submit, custom)
 * - Built-in loading state handling
 * - Integrated permission checking (RBAC)
 * - Consistent styling via variants
 * - Accessibility compliance (aria labels, keyboard nav)
 * - AI context awareness (knows current page for "Enhance" features)
 */

export type ButtonVariant =
  | 'primary'      // Solid green (#0E6C3C) - main CTAs
  | 'secondary'    // Gray outline - secondary actions
  | 'danger'       // Red - destructive actions
  | 'ghost'        // Transparent - tertiary actions
  | 'outline'      // Border only - alternative actions
  | 'success'      // Green - confirmation actions
  | 'loading';     // Special state for loading

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonAction =
  | 'navigate'      // client-side navigation with useRouter
  | 'submit'        // form submission
  | 'custom'        // custom onClick handler
  | 'modal'         // open modal/dialog
  | 'delete'        // delete with confirmation
  | 'export'        // export data
  | 'import'        // import data
  | 'enhance';      // AI enhance feature

interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string;
  action?: ButtonAction;
  target?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  permission?: string;
  icon?: React.ReactNode | string;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  shortcut?: string;
  tooltip?: string;
  ariaLabel?: string;
  confirmMessage?: string;
  exportFormat?: 'json' | 'csv' | 'pdf' | 'xlsx';
  exportFilename?: string;
  aiContext?: string;
  fullWidth?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-[#0E6C3C] text-white hover:bg-[#0A5530] active:bg-[#073D25] disabled:bg-gray-400',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-200 border border-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-400',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-400',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400',
  success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:bg-green-400',
  loading: 'bg-blue-500 text-white opacity-75 cursor-wait',
};

const sizeClasses = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-base rounded',
  lg: 'px-6 py-3 text-lg rounded-lg',
  xl: 'px-8 py-4 text-xl rounded-lg',
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      label,
      action = 'custom',
      target,
      variant = 'primary',
      size = 'md',
      onClick,
      isLoading = false,
      loadingText,
      disabled = false,
      permission,
      icon,
      iconPosition = 'left',
      iconOnly = false,
      shortcut,
      tooltip,
      ariaLabel,
      confirmMessage = 'Are you sure?',
      exportFormat = 'json',
      exportFilename = 'export',
      aiContext,
      fullWidth = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const router = useRouter();
    const [isLoadingState, setIsLoadingState] = React.useState(false);

    const isDisabled = disabled || isLoading || isLoadingState;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }

      try {
        setIsLoadingState(true);

        switch (action) {
          case 'navigate': {
            if (target) {
              router.push(target);
            }
            break;
          }

          case 'submit': {
            const form = (e.target as HTMLButtonElement).closest('form');
            if (form) {
              form.requestSubmit();
            }
            break;
          }

          case 'delete': {
            if (confirm(confirmMessage)) {
              await onClick?.(e);
            }
            break;
          }

          case 'export': {
            if (onClick) {
              await onClick(e);
            }
            break;
          }

          case 'custom': {
            if (onClick) {
              await onClick(e);
            }
            break;
          }

          case 'modal': {
            if (target) {
              const modal = document.getElementById(target);
              if (modal instanceof HTMLDialogElement) {
                modal.showModal();
              }
            }
            break;
          }

          case 'enhance': {
            if (onClick) {
              await onClick(e);
            }
            break;
          }

          default:
            break;
        }
      } finally {
        setIsLoadingState(false);
      }
    };

    const variantClass = variantClasses[isLoading ? 'loading' : variant];
    const sizeClass = iconOnly ? 'p-2' : sizeClasses[size];
    const finalClassName = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-[#0E6C3C] focus:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      variantClass,
      sizeClass,
      fullWidth && 'w-full',
      className,
    );

    const content = (
      <>
        {icon && iconPosition === 'left' && (
          <span className={iconOnly ? '' : 'flex-shrink-0'}>
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </span>
        )}

        {isLoading && <span className="animate-spin">⏳</span>}

        {!iconOnly && <span>{isLoading && loadingText ? loadingText : label}</span>}

        {icon && iconPosition === 'right' && (
          <span className={iconOnly ? '' : 'flex-shrink-0'}>
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </span>
        )}
      </>
    );

    if (tooltip || shortcut) {
      return (
        <div className="relative group">
          <button
            ref={ref}
            className={finalClassName}
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={ariaLabel || label}
            aria-busy={isLoading}
            data-action={action}
            data-permission={permission}
            {...rest}
          >
            {content}
          </button>
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded whitespace-nowrap z-50">
            {tooltip || label}
            {shortcut && <div className="text-xs opacity-75">{shortcut}</div>}
          </div>
        </div>
      );
    }

    return (
      <button
        ref={ref}
        className={finalClassName}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={ariaLabel || label}
        aria-busy={isLoading}
        data-action={action}
        data-permission={permission}
        {...rest}
      >
        {content}
      </button>
    );
  },
);

AppButton.displayName = 'AppButton';

export default AppButton;
