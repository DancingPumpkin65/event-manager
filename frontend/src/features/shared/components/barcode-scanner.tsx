import { useState, useRef, useEffect } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function BarcodeScanner({
  onScan,
  disabled = false,
  placeholder = 'Scan or enter barcode...',
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and when scan completes
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
      // Re-focus for next scan
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);
    
    // Auto-submit when barcode scanner completes (typically ends with Enter)
    // Most barcode scanners append Enter automatically
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-lg border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-6 h-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Use a barcode scanner or type the barcode and press Enter
      </p>
    </form>
  );
}
