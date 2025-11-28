import QRCode from 'qrcode';

/**
 * Generate QR code as a data URL
 */
export const generateQRCode = async (data: string, options?: {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: options?.width || 256,
      margin: options?.margin || 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as SVG string
 */
export const generateQRCodeSVG = async (data: string, options?: {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}): Promise<string> => {
  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      width: options?.width || 256,
      margin: options?.margin || 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
    return svg;
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Generate participant badge data
 */
export interface BadgeData {
  participantId: string;
  eventId: string;
  name: string;
  email: string;
  role?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Generate QR code data for a participant badge
 */
export const generateBadgeQRData = (badge: BadgeData): string => {
  return JSON.stringify({
    id: badge.participantId,
    eventId: badge.eventId,
    timestamp: Date.now(),
  });
};

/**
 * Parse QR code data from badge
 */
export const parseBadgeQRData = (qrData: string): {
  id: string;
  eventId: string;
  timestamp: number;
} | null => {
  try {
    const data = JSON.parse(qrData);
    if (data.id && data.eventId && data.timestamp) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
};

/**
 * Validate badge QR data
 */
export const validateBadgeQRData = (
  qrData: { id: string; eventId: string; timestamp: number },
  expectedEventId: string,
  maxAgeMs: number = 86400000 // 24 hours default
): { valid: boolean; error?: string } => {
  if (qrData.eventId !== expectedEventId) {
    return { valid: false, error: 'Invalid event ID' };
  }

  const age = Date.now() - qrData.timestamp;
  if (age > maxAgeMs) {
    return { valid: false, error: 'QR code expired' };
  }

  return { valid: true };
};

/**
 * Generate participant badge as HTML for printing
 */
export const generateBadgeHTML = async (badge: BadgeData): Promise<string> => {
  const qrData = generateBadgeQRData(badge);
  const qrCodeDataUrl = await generateQRCode(qrData, { width: 200 });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Badge - ${badge.name}</title>
      <style>
        @page {
          size: 4in 6in;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        
        .badge {
          width: 4in;
          height: 6in;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .badge-header {
          background: white;
          padding: 20px;
          text-align: center;
          border-bottom: 4px solid #0066cc;
        }
        
        .badge-logo {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 8px;
        }
        
        .badge-content {
          flex: 1;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }
        
        .badge-name {
          font-size: 32px;
          font-weight: bold;
          color: white;
          text-align: center;
          margin-bottom: 8px;
          word-wrap: break-word;
          max-width: 100%;
        }
        
        .badge-email {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          margin-bottom: 4px;
          word-wrap: break-word;
          max-width: 100%;
        }
        
        .badge-role {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin-top: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
        
        .badge-qr {
          background: white;
          padding: 16px;
          border-radius: 12px;
          margin-top: 24px;
        }
        
        .badge-qr img {
          display: block;
          width: 200px;
          height: 200px;
        }
        
        .badge-footer {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
        }
        
        @media print {
          body {
            background: none;
          }
          
          .badge {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="badge">
        <div class="badge-header">
          <div class="badge-logo">🎫 EVENT BADGE</div>
        </div>
        
        <div class="badge-content">
          <div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-email">${badge.email}</div>
            ${badge.role ? `<div class="badge-role">${badge.role}</div>` : ''}
          </div>
          
          <div class="badge-qr">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          </div>
        </div>
        
        <div class="badge-footer">
          Participant ID: ${badge.participantId.substring(0, 8)}...
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Print badge(s) in new window
 */
export const printBadges = async (badges: BadgeData[]): Promise<void> => {
  const badgesHTML = await Promise.all(badges.map(badge => generateBadgeHTML(badge)));
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow pop-ups for this site.');
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print Badges</title>
      <style>
        @page {
          size: 4in 6in;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      ${badgesHTML.map((html, index) => 
        `<div class="${index < badgesHTML.length - 1 ? 'page-break' : ''}">${html}</div>`
      ).join('')}
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for images to load before printing
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 1000);
};
