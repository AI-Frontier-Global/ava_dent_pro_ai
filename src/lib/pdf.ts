import jsPDF from 'jspdf';
import type { Invoice } from '../types';

const CLINIC_NAME = 'عيادة سمايل';
const CLINIC_NAME_EN = 'Smile Clinic';

export function generateInvoicePDF(inv: Invoice, payments: { amount: number; method: string; createdAt: string }[] = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(CLINIC_NAME_EN, pageW - 15, 13, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Dental Clinic Management System', pageW - 15, 20, { align: 'right' });

  // Invoice title (left side)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`# ${inv.id}`, 15, 24);

  // Info section
  let y = 40;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(inv.patientName, 15, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageW - 15, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(inv.createdAt).toLocaleDateString('en-GB'), pageW - 15, y + 6, { align: 'right' });

  // Line
  y += 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, pageW - 15, y);

  // Table header
  y += 8;
  doc.setFillColor(240, 250, 248);
  doc.rect(15, y - 5, pageW - 30, 9, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('Service', 18, y + 1);
  doc.text('Price (JOD)', pageW - 80, y + 1, { align: 'right' });
  doc.text('Qty', pageW - 50, y + 1, { align: 'right' });
  doc.text('Total (JOD)', pageW - 18, y + 1, { align: 'right' });

  // Items
  y += 10;
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  let subtotal = 0;
  inv.items.forEach((it) => {
    const lineTotal = it.price * it.qty;
    subtotal += lineTotal;
    doc.text(it.serviceName, 18, y);
    doc.text(it.price.toFixed(2), pageW - 80, y, { align: 'right' });
    doc.text(String(it.qty), pageW - 50, y, { align: 'right' });
    doc.text(lineTotal.toFixed(2), pageW - 18, y, { align: 'right' });
    y += 7;
  });

  // Totals
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, pageW - 15, y);
  y += 7;

  const taxRate = inv.taxRate ?? 0.16;
  const tax = subtotal * taxRate;
  const grand = subtotal + tax;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = grand - paid;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageW - 60, y, { align: 'right' });
  doc.text(`${subtotal.toFixed(2)} JOD`, pageW - 18, y, { align: 'right' });
  y += 6;
  doc.text(`Tax (${Math.round(taxRate * 100)}%):`, pageW - 60, y, { align: 'right' });
  doc.text(`${tax.toFixed(2)} JOD`, pageW - 18, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', pageW - 60, y, { align: 'right' });
  doc.text(`${grand.toFixed(2)} JOD`, pageW - 18, y, { align: 'right' });

  if (paid > 0) {
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('Paid:', pageW - 60, y, { align: 'right' });
    doc.text(`${paid.toFixed(2)} JOD`, pageW - 18, y, { align: 'right' });
    y += 6;
    doc.setTextColor(220, 38, 38);
    doc.text('Balance Due:', pageW - 60, y, { align: 'right' });
    doc.text(`${balance.toFixed(2)} JOD`, pageW - 18, y, { align: 'right' });
  }

  // Payments list
  if (payments.length > 0) {
    y += 10;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment History:', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    payments.forEach((p) => {
      doc.text(
        `${new Date(p.createdAt).toLocaleDateString('en-GB')} — ${p.method} — ${p.amount.toFixed(2)} JOD`,
        18,
        y,
      );
      y += 5;
    });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageH - 20, pageW, 20, 'F');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing Smile Clinic', pageW / 2, pageH - 12, { align: 'center' });
  doc.text('This is a computer-generated invoice', pageW / 2, pageH - 7, { align: 'center' });

  doc.save(`invoice-${inv.id}.pdf`);
}
