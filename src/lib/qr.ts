// QR + barcode generation helpers using `qrcode` and `jsbarcode`.

import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export async function generateQRDataUrl(text: string, size = 256): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function generateBarcodeDataUrl(text: string): string {
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      margin: 8,
      background: '#ffffff',
      lineColor: '#000000',
      fontSize: 14,
    });
  } catch {
    return '';
  }
  return canvas.toDataURL('image/png');
}
