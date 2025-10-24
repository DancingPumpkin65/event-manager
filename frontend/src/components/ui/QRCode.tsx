import { useState } from 'react';
import { Button, Alert } from '@/components/ui';
import { generateQRCode, type BadgeData } from '@/lib/qr-utils';

interface QRCodeDisplayProps {
  data: string;
  label?: string;
  size?: number;
  downloadFileName?: string;
}

export const QRCodeDisplay = ({ data, label, size = 256, downloadFileName }: QRCodeDisplayProps) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const code = await generateQRCode(data, { width: size });
      setQrCode(code);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = downloadFileName || 'qr-code.png';
    link.click();
  };

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      )}
      
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {!qrCode && (
        <Button
          onClick={generateCode}
          isLoading={isLoading}
          variant="primary"
        >
          Generate QR Code
        </Button>
      )}
      
      {qrCode && (
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
            <img src={qrCode} alt="QR Code" className="max-w-full h-auto" />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={downloadQRCode}
              variant="secondary"
              leftIcon={<span>⬇️</span>}
            >
              Download QR Code
            </Button>
            <Button
              onClick={generateCode}
              variant="ghost"
              leftIcon={<span>🔄</span>}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface BadgePreviewProps {
  badge: BadgeData;
  onPrint?: () => void;
  onClose?: () => void;
}

export const BadgePreview = ({ badge, onPrint, onClose }: BadgePreviewProps) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useState(() => {
    const loadQRCode = async () => {
      try {
        const qrData = JSON.stringify({
          id: badge.participantId,
          eventId: badge.eventId,
          timestamp: Date.now(),
        });
        const code = await generateQRCode(qrData, { width: 200 });
        setQrCode(code);
      } catch (err: any) {
        setError(err.message || 'Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQRCode();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Generating badge...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" onClose={() => setError('')}>
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Badge Preview */}
      <div className="relative mx-auto" style={{ width: '4in', aspectRatio: '2/3' }}>
        <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white p-5 text-center border-b-4 border-primary-600">
            <div className="text-2xl font-bold text-primary-600 mb-2">
              🎫 EVENT BADGE
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-8 flex flex-col items-center justify-between">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 break-words max-w-full">
                {badge.name}
              </div>
              <div className="text-base text-white/90 break-words max-w-full">
                {badge.email}
              </div>
              {badge.role && (
                <div className="mt-3 inline-block px-4 py-2 bg-white/20 rounded-full text-lg text-white/90">
                  {badge.role}
                </div>
              )}
            </div>
            
            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl mt-6">
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-black/20 p-3 text-center text-white/80 text-xs">
            Participant ID: {badge.participantId.substring(0, 8)}...
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {onPrint && (
          <Button
            onClick={onPrint}
            variant="primary"
            leftIcon={<span>🖨️</span>}
          >
            Print Badge
          </Button>
        )}
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
