import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import {
  type BadgeLayoutConfig,
  PAPER_DIMENSIONS,
  loadLayoutConfig,
} from './badge-layout-types';

export interface BadgePDFData {
  id: string;
  name: string;
  role: string;
  barcode: string;
  customData?: Record<string, any>;
  layoutConfig?: BadgeLayoutConfig;
}

/**
 * Generate a simple barcode representation
 */
export const generateBarcode = (number: string, length: 12): string => {
  return number.toUpperCase().replace(/[^0-9]/g, '').slice(0, length);
}

/**
 * Generate a professional barcode image as data URL
 */
const generateBarcodeImage = (barcodeText: string): string => {
  const canvas = document.createElement('canvas');

  try {
    JsBarcode(canvas, barcodeText, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: false,
      fontSize: 12,
      margin: 5,
      background: '#ffffff',
      lineColor: '#000000',
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[Barcode] Error generating barcode:', error);
    throw new Error('Failed to generate barcode');
  }
}

/**
 * Get field value from participant data
 */
const getFieldValue = (fieldName: string, data: BadgePDFData): string => {
  // First try customData (participant fields)
  if (data.customData) {
    if (fieldName.includes(',')) {
      // Combined fields (e.g., "firstName,lastName")
      return fieldName.split(',').map(f => {
        const trimmed = f.trim();
        return data.customData?.[trimmed] || '';
      }).filter(Boolean).join(' ');
    }
    if (data.customData[fieldName]) {
      return String(data.customData[fieldName]);
    }
  }

  // Fallback to standard fields
  if (fieldName === 'name' || fieldName.includes('Name')) {
    return data.name;
  }
  if (fieldName === 'role') {
    return data.role;
  }

  return '';
}

/**
 * Generate badge PDF and open in new tab
 */
export const generateBadgePDF = async (
  data: BadgePDFData
): Promise<void> => {


  try {
    if (!data.id) throw new Error('Participant ID is required');
    if (!data.name) throw new Error('Participant name is required');
    if (!data.barcode) throw new Error('Barcode is required');

    // Get layout configuration (use provided, localStorage, or defaults)
    const layout = data.layoutConfig || loadLayoutConfig();
    const paperDims = PAPER_DIMENSIONS[layout.paperSize];

    // Create PDF document with configured paper size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [paperDims.width, paperDims.height]
    });

    // Set background color (white)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, paperDims.width, paperDims.height, 'F');

    // Add border if configured
    if (layout.showBorder) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(5, 5, paperDims.width - 10, paperDims.height - 10);
    }

    // Render text elements
    layout.textElements.forEach(element => {
      const value = getFieldValue(element.fieldName, data);
      if (!value) return;

      pdf.setFontSize(element.fontSize);
      pdf.setFont('helvetica', element.fontWeight);
      pdf.text(value, element.position.x, element.position.y, { align: element.align });
    });

    // Generate and add barcode
    const barcodeImage = generateBarcodeImage(data.barcode);
    pdf.addImage(
      barcodeImage,
      'PNG',
      layout.barcode.position.x,
      layout.barcode.position.y,
      layout.barcode.size.width,
      layout.barcode.size.height
    );

    // Open PDF in new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');


  } catch (error) {
    console.error('[PDF] Error generating badge PDF:', error);
    throw error;
  }
};
