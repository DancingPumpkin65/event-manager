// Re-export the existing BarcodeScanner and create a simple manual entry component
export { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { useState } from 'react';
import { Button } from '@/components/ui';

interface ManualEntryProps {
  onSubmit: (badgeId: string) => void;
}

export function ManualBadgeEntry({ onSubmit }: ManualEntryProps) {
  const [badgeId, setBadgeId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (badgeId.trim()) {
      onSubmit(badgeId.trim());
      setBadgeId('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Badge ID Manually
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            className="input flex-1"
            placeholder="Badge ID or QR Code"
          />
          <Button type="submit" className="whitespace-nowrap">
            Submit
          </Button>
        </div>
      </div>
    </form>
  );
}
