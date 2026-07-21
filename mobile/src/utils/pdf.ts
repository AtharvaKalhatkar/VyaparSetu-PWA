import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { formatCurrency, formatDate, numberToWords } from './formatting';
import { Colors } from '../constants/theme';
import { Config } from '../constants/config';
import type { Invoice, InvoiceItem } from '../types';

function generateInvoiceHtml(invoice: Invoice, business: { name: string; address?: string; gstin?: string; phone?: string; email?: string }): string {
  const itemsRows = invoice.items.map((item: InvoiceItem, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.itemName}</td>
      <td>${item.hsnCode || '-'}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${formatCurrency(item.rate)}</td>
      <td>${item.discountPercent > 0 ? item.discountPercent + '%' : '-'}</td>
      <td>${formatCurrency(item.taxableAmount)}</td>
      <td>${item.gstRate}%</td>
      <td>${formatCurrency(item.cgst)}</td>
      <td>${formatCurrency(item.sgst)}</td>
      <td>${formatCurrency(item.igst)}</td>
      <td>${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #1B5E20; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #1B5E20; margin: 0 0 5px; font-size: 24px; }
    .header p { margin: 2px 0; color: #555; font-size: 11px; }
    .invoice-title { text-align: center; font-size: 18px; font-weight: bold; color: #1B5E20; margin: 15px 0; }
    .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .details > div { width: 48%; }
    .details h3 { color: #1B5E20; font-size: 13px; margin: 0 0 5px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
    .details p { margin: 2px 0; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    th { background: #1B5E20; color: white; padding: 8px 4px; text-align: center; font-size: 10px; }
    td { padding: 6px 4px; border-bottom: 1px solid #eee; text-align: center; }
    td:nth-child(2) { text-align: left; }
    tr:nth-child(even) { background: #f9f9f9; }
    .totals { width: 350px; margin-left: auto; }
    .totals table { margin: 0; }
    .totals td { padding: 4px 8px; border: none; text-align: right; }
    .totals td:first-child { text-align: left; }
    .grand-total { font-size: 14px; font-weight: bold; color: #1B5E20; }
    .amount-words { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #1B5E20; font-size: 12px; }
    .amount-words strong { color: #1B5E20; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; background: ${invoice.status === 'PAID' ? '#388E3C' : invoice.status === 'CANCELLED' ? '#D32F2F' : '#F57C00'}; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${business.name}</h1>
    <p>${business.address || ''}</p>
    <p>${business.gstin ? 'GSTIN: ' + business.gstin : ''} | ${business.phone ? 'Phone: ' + business.phone : ''} ${business.email ? '| Email: ' + business.email : ''}</p>
  </div>

  <div class="invoice-title">
    ${invoice.type === 'PURCHASE' ? 'PURCHASE' : 'TAX'} INVOICE
    <br><span style="font-size:14px;color:#555;">Invoice No: ${invoice.invoiceNo}</span>
  </div>

  <div class="details">
    <div>
      <h3>Bill To:</h3>
      <p><strong>${invoice.party?.name || 'N/A'}</strong></p>
      <p>${invoice.party?.address?.line1 || ''} ${invoice.party?.address?.line2 || ''}</p>
      <p>${invoice.party?.address?.city || ''} - ${invoice.party?.address?.pincode || ''}</p>
      <p>${invoice.party?.address?.state || ''}</p>
      <p>GSTIN: ${invoice.party?.gstin || 'N/A'}</p>
      <p>Phone: ${invoice.party?.phone || ''}</p>
    </div>
    <div style="text-align:right;">
      <h3>Invoice Details:</h3>
      <p>Invoice Date: ${formatDate(invoice.date)}</p>
      <p>Due Date: ${invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</p>
      <p>Status: <span class="status-badge">${invoice.status}</span></p>
      ${invoice.irn ? `<p>IRN: ${invoice.irn}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left;">Item</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Disc%</th>
        <th>Taxable</th>
        <th>GST%</th>
        <th>CGST</th>
        <th>SGST</th>
        <th>IGST</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal:</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
      ${invoice.discountAmount > 0 ? `<tr><td>Discount (${invoice.discountType === 'PERCENTAGE' ? invoice.discountValue + '%' : formatCurrency(invoice.discountValue)}):</td><td>-${formatCurrency(invoice.discountAmount)}</td></tr>` : ''}
      <tr><td>Taxable Amount:</td><td>${formatCurrency(invoice.taxableAmount)}</td></tr>
      ${invoice.cgstTotal > 0 ? `<tr><td>CGST:</td><td>${formatCurrency(invoice.cgstTotal)}</td></tr>` : ''}
      ${invoice.sgstTotal > 0 ? `<tr><td>SGST:</td><td>${formatCurrency(invoice.sgstTotal)}</td></tr>` : ''}
      ${invoice.igstTotal > 0 ? `<tr><td>IGST:</td><td>${formatCurrency(invoice.igstTotal)}</td></tr>` : ''}
      <tr><td>Total Tax:</td><td>${formatCurrency(invoice.taxAmount)}</td></tr>
      ${invoice.roundOff !== 0 ? `<tr><td>Round Off:</td><td>${formatCurrency(invoice.roundOff)}</td></tr>` : ''}
      <tr class="grand-total"><td><strong>Grand Total:</strong></td><td><strong>${formatCurrency(invoice.grandTotal)}</strong></td></tr>
    </table>
  </div>

  <div class="amount-words">
    <strong>Amount in Words:</strong> ${numberToWords(invoice.grandTotal)}
  </div>

  ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
  ${invoice.terms ? `<p><strong>Terms:</strong> ${invoice.terms}</p>` : ''}

  ${invoice.irn && invoice.qrCode ? `
  <div style="text-align:center;margin-top:20px;">
    <p><strong>IRN:</strong> ${invoice.irn}</p>
    <p><em>QR Code available</em></p>
  </div>` : ''}

  <div class="footer">
    <p>This is a computer-generated invoice. No signature required.</p>
    <p>Generated by ${Config.APP_NAME} v${Config.APP_VERSION}</p>
  </div>
</body>
</html>`;
}

export async function generateInvoicePdf(
  invoice: Invoice,
  business: { name: string; address?: string; gstin?: string; phone?: string; email?: string }
): Promise<string> {
  const html = generateInvoiceHtml(invoice, business);
  const { uri } = await Print.printToFileAsync({ html, width: 595.28, height: 841.89 });
  const fileName = `Invoice_${invoice.invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const newPath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
}

export async function sharePdf(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Invoice',
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function shareInvoiceOnWhatsApp(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Invoice via WhatsApp',
    });
  }
}
