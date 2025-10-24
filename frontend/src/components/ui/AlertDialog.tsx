import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from './Button';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;  
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  icon?: ReactNode;
}

/**
 * AlertDialog - Accessible confirmation dialog for destructive actions
 * 
 * Features:
 * - Focus trapping within the dialog
 * - Auto-focuses the cancel button (safer default)
 * - Closes on Escape key
 * - Prevents body scroll when open
 * - aria-describedby for screen readers
 * - role="alertdialog" for assistive technology
 */
export default function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap - keep focus within dialog
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [onClose, isLoading]);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      const previouslyFocused = document.activeElement as HTMLElement;
      
      // Focus the cancel button (safer default for destructive actions)
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus when dialog closes
        previouslyFocused?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmVariant: 'danger' as const,
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmVariant: 'primary' as const,
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmVariant: 'primary' as const,
    },
  };

  const styles = variantStyles[variant];

  const defaultIcon = variant === 'danger' ? (
    <Trash2 className="h-6 w-6" />
  ) : (
    <AlertTriangle className="h-6 w-6" />
  );

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto safe-all"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 safe-bottom">
        <div
          ref={dialogRef}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
                {icon || defaultIcon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 
                  id="alert-dialog-title" 
                  className="text-lg font-semibold text-gray-900 text-balance"
                >
                  {title}
                </h3>
                <p 
                  id="alert-dialog-description" 
                  className="mt-2 text-sm text-gray-600"
                >
                  {description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                ref={cancelButtonRef}
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {cancelLabel}
              </Button>
              <Button
                ref={confirmButtonRef}
                variant={styles.confirmVariant}
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  confirmLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
