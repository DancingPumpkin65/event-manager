import { useEffect, useRef, useState, useCallback } from 'react';
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode';
import { Button, Alert, Skeleton } from '@/components/ui';
import { Card } from './Card';

// Responsive qrbox sizing based on screen width
const getResponsiveQrbox = () => {
  const width = window.innerWidth;
  if (width >= 768) {
    // Tablet/Desktop - larger scanning area
    return { width: 350, height: 120 };
  }
  // Mobile - smaller but still usable
  return { width: 280, height: 90 };
};

interface BarcodeScannerProps {
  onScan: (data: string) => void | Promise<void>;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  showManualInput?: boolean;
}

export const BarcodeScanner = ({
  onScan,
  onError,
  title = 'Scan QR Code or Barcode',
  description = 'Position the QR code or barcode within the camera frame',
  fps = 15,
  qrbox,
  aspectRatio = 1.5,
  showManualInput = true,
}: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const scannerDivId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);

  const startScanner = useCallback(async () => {
    try {
      setError('');
      setSuccess('');
      setPermissionDenied(false);

      // Dynamically import html5-qrcode only when scanner is needed
      const { Html5Qrcode } = await import('html5-qrcode');

      // Create scanner instance
      const scanner = new Html5Qrcode(scannerDivId.current);
      scannerRef.current = scanner;

      // Use responsive qrbox if not explicitly provided
      const effectiveQrbox = qrbox || getResponsiveQrbox();

      // Start scanning
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: fps,
          qrbox: effectiveQrbox,
          aspectRatio: aspectRatio,
        },
        async (decodedText) => {
          // Success callback
          setSuccess(`Code detected: ${decodedText.substring(0, 20)}...`);

          try {
            await onScan(decodedText);
          } catch (err: any) {
            const errorMsg = err.message || 'Failed to process scan';
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
        },
        (errorMessage) => {
          // Error callback (usually just scanning errors, can be ignored)
          // Only log if it's not a common scanning error
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.debug('Scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start scanner';
      
      // Check for permission denied errors
      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed') || errorMsg.includes('denied')) {
        setPermissionDenied(true);
        setError('Camera access was denied. Please allow camera access in your browser settings.');
      } else {
        setError(errorMsg);
      }
      
      if (onError) onError(errorMsg);
      console.error('Scanner error:', err);
    }
  }, [fps, qrbox, aspectRatio, onScan, onError]);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err: any) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualCode.trim()) {
      setError('Please enter a code');
      return;
    }

    setError('');
    setSuccess(`Manual code: ${manualCode.substring(0, 20)}...`);

    try {
      await onScan(manualCode);
      setManualCode('');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process code';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <Card>
      <Card.Body>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Permission Denied Help */}
          {permissionDenied && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">📷 Camera Access Required</h4>
              <p className="text-sm text-amber-700 mb-3">
                To scan barcodes, please allow camera access:
              </p>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                <li>Click the camera/lock icon in your browser's address bar</li>
                <li>Select "Allow" for camera access</li>
                <li>Click "Start Camera" again</li>
              </ol>
            </div>
          )}

          {/* Scanner Controls - Larger touch targets for tablet */}
          <div className="flex justify-center gap-4">
            {!isScanning ? (
              <Button
                onClick={startScanner}
                variant="primary"
                leftIcon={<span className="text-xl">📷</span>}
                className="!py-4 !px-8 text-lg touch-manipulation"
              >
                Start Camera
              </Button>
            ) : (
              <Button
                onClick={stopScanner}
                variant="danger"
                leftIcon={<span className="text-xl">⏹️</span>}
                className="!py-4 !px-8 text-lg touch-manipulation"
              >
                Stop Camera
              </Button>
            )}
          </div>

          {/* Scanner View - Responsive height for different devices */}
          <div className="relative">
            <div
              id={scannerDivId.current}
              className="w-full rounded-lg overflow-hidden bg-gray-900"
              style={{ minHeight: isScanning ? 'min(400px, 50vh)' : '0' }}
            />

            {!isScanning && (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 md:p-12 border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <div className="text-5xl md:text-6xl mb-4">📷</div>
                  <p className="text-sm md:text-base">Tap "Start Camera" to begin scanning</p>
                  <p className="text-xs text-gray-400 mt-2 hidden md:block">
                    Position the barcode within the scanning frame
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input - Touch-friendly for tablet */}
          {showManualInput && (
            <div className="border-t pt-6">
              <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-3">
                Or Enter Code Manually
              </h4>
              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter barcode or QR code data"
                  className="flex-1 px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Button 
                  type="submit" 
                  variant="secondary"
                  className="!py-3 md:!py-4 !px-6 text-base touch-manipulation"
                >
                  Submit
                </Button>
              </form>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

interface QuickScanProps {
  onScan: (data: string) => void | Promise<void>;
  onClose?: () => void;
  participantName?: string;
  eventName?: string;
}

export const QuickScan = ({
  onScan,
  onClose,
  participantName,
  eventName,
}: QuickScanProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleScan = async (data: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      await onScan(data);
      setResult({
        success: true,
        message: participantName
          ? `✓ Attendance recorded for ${participantName}`
          : '✓ Attendance recorded successfully',
      });

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to record attendance',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto safe-all">
      <div className="flex min-h-dvh items-center justify-center p-4 safe-bottom">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 transition-opacity"
          onClick={onClose}
        />

        {/* Modal - Larger on tablet for better touch interaction */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full z-10 mx-2 md:mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quick Scan</h2>
              {eventName && (
                <p className="text-sm text-gray-600 mt-1">{eventName}</p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-3xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 touch-manipulation"
                aria-label="Close scanner"
              >
                ×
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                {/* Animated processing indicator */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce"></div>
                </div>
                <p className="text-lg text-gray-600">Processing attendance...</p>
                {/* Skeleton preview of result card */}
                <div className="w-full max-w-sm mt-4">
                  <Skeleton height="h-4" width="w-3/4" className="mx-auto" />
                </div>
              </div>
            ) : result ? (
              <div className="py-8">
                <Alert
                  type={result.success ? 'success' : 'error'}
                  onClose={() => setResult(null)}
                >
                  <span className="text-lg">{result.message}</span>
                </Alert>
                {/* Larger action buttons after scan result */}
                <div className="flex justify-center gap-4 mt-6">
                  {result.success ? (
                    <Button
                      onClick={onClose}
                      variant="primary"
                      className="!py-4 !px-8 text-lg touch-manipulation"
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setResult(null)}
                      variant="secondary"
                      className="!py-4 !px-8 text-lg touch-manipulation"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <BarcodeScanner
                onScan={handleScan}
                title="Scan Participant Badge"
                description="Position the barcode within the camera frame"
                showManualInput={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
