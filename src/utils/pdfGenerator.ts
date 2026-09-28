import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename?: string;
  elementId: string;
}

export async function generatePdfBlob(elementId: string): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  // Render high-resolution PNG with skipFonts: true to prevent CORS stylesheet security errors
  const imgData = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.0,
    backgroundColor: '#ffffff',
    skipFonts: true,
    fontEmbedCSS: '',
    cacheBust: true,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = 215.9; // 8.5 inches in mm
  const pageHeight = 279.4; // 11 inches in mm
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);

  // Measure natural dimensions
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imgData;
  });

  const contentHeight = (img.height * contentWidth) / img.width;

  pdf.addImage(
    imgData,
    'PNG',
    margin,
    margin,
    contentWidth,
    Math.min(contentHeight, pageHeight - (margin * 2))
  );

  return pdf.output('blob');
}

export async function exportPaystubToPdf(options: PdfExportOptions): Promise<boolean> {
  const { elementId, filename = 'paystub.pdf' } = options;
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  try {
    // 1. Capture element with skipFonts to avoid CORS issues with Google Fonts
    const imgData = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2.0,
      backgroundColor: '#ffffff',
      skipFonts: true,
      fontEmbedCSS: '',
      cacheBust: true,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 8;
    const contentWidth = pageWidth - (margin * 2);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgData;
    });

    const contentHeight = (img.height * contentWidth) / img.width;

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin,
      contentWidth,
      Math.min(contentHeight, pageHeight - (margin * 2))
    );

    // Save using Blob URL download to guarantee working in iframe sandboxes
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1500);

    return true;
  } catch (error) {
    console.error('Failed to export PDF, falling back to window.print():', error);
    window.print();
    return false;
  }
}
