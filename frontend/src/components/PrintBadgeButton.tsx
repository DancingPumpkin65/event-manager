import { Button } from './ui';
import { usePrintBadge } from '@/features/badge/hooks/usePrintBadge';
import { Printer, PrinterCheck, Loader2 } from 'lucide-react';

interface PrintBadgeButtonProps {
  id: string;
  eventId?: string;
  type: 'participant' | 'staff';
  participantFields?: Record<string, any>; // Kept for interface compatibility, mostly unused
  status?: string;
  badgePrintedAt?: Date | null;
  badgePrintedBy?: string | null;
  printedBy: string;
  onPrintSuccess?: () => void;
  onPrintError?: (error: Error) => void;
}

export function PrintBadgeButton({
  id,
  eventId,
  type,
  status,
  badgePrintedAt,
  badgePrintedBy,
  printedBy,
  onPrintSuccess,
  onPrintError,
}: PrintBadgeButtonProps) {
  const { mutate: printBadge, isPending } = usePrintBadge();

  const handlePrint = () => {
    printBadge(
      { id, eventId, type, printedBy },
      {
        onSuccess: () => {
          onPrintSuccess?.();
        },
        onError: (error) => {
          onPrintError?.(error as Error);
        },
      }
    );
  };

  if (badgePrintedAt) {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 mb-2">
            {status || 'CONFIRMED'}
          </div>
          <div className="text-gray-500 text-xs">
            {new Date(badgePrintedAt).toLocaleString()}
          </div>
          {badgePrintedBy && (
            <div className="text-gray-500 text-xs">by {badgePrintedBy}</div>
          )}
        </div>
        <Button
          onClick={handlePrint}
          disabled={isPending}
          size="sm"
          variant="success"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <PrinterCheck />}
        </Button>
      </div>
    );
  }

  // Show status badge if not confirmed
  const showStatusBadge = type === 'participant' && status !== 'CONFIRMED';

  return (
    <div className="flex items-center justify-between gap-2">
      {showStatusBadge && (
        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
          {status || 'PENDING'}
        </span>
      )}
      <Button
        onClick={handlePrint}
        disabled={isPending}
        size="sm"
        variant="ghost"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Printer />}
      </Button>
    </div>
  );
}
