import { jsPDF } from 'jspdf';
import type { PrescriptionDocument } from './Prescription';

const PAGE = { width: 210, height: 297, margin: 18 };
const LOGO = 22;
const LINE = 5.5;

// Adapter
export class PrescriptionPdfAdapter {
  static render(prescription: PrescriptionDocument): jsPDF {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = PrescriptionPdfAdapter.letterhead(pdf, prescription);

    pdf.setDrawColor(200);
    pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 8;

    pdf.setFont('helvetica', 'bold').setFontSize(12);
    pdf.text(`Patient: ${prescription.patientName}`, PAGE.margin, y);
    pdf.setFont('helvetica', 'normal').setFontSize(10);
    pdf.text(prescription.date, PAGE.width - PAGE.margin, y, { align: 'right' });
    y += LINE;
    pdf.setTextColor(110);
    pdf.text(prescription.patientDetail, PAGE.margin, y);
    pdf.setTextColor(0);
    y += 10;

    pdf.setFont('helvetica', 'bold').setFontSize(14);
    pdf.text('Rp/', PAGE.margin, y);
    y += 8;
    pdf.setFont('helvetica', 'normal').setFontSize(11);
    const lines = pdf.splitTextToSize(
      prescription.content,
      PAGE.width - 2 * PAGE.margin,
    ) as string[];
    for (const line of lines) {
      if (y > PAGE.height - PAGE.margin - 30) {
        pdf.addPage();
        y = PAGE.margin;
      }
      pdf.text(line, PAGE.margin, y);
      y += LINE;
    }

    const signatureY = Math.max(y + 25, PAGE.height - PAGE.margin - 15);
    const x = PAGE.width - PAGE.margin - 70;
    pdf.line(x, signatureY, PAGE.width - PAGE.margin, signatureY);
    pdf.setFontSize(9);
    pdf.text(prescription.letterhead.professionalName, x + 35, signatureY + 5, { align: 'center' });
    pdf.text(prescription.letterhead.license, x + 35, signatureY + 9, { align: 'center' });
    return pdf;
  }

  static download(prescription: PrescriptionDocument): void {
    PrescriptionPdfAdapter.render(prescription).save(prescription.fileName);
  }

  private static letterhead(pdf: jsPDF, { letterhead }: PrescriptionDocument): number {
    const top = PAGE.margin;
    if (letterhead.logoDataUrl) {
      const format = letterhead.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const { width, height } = pdf.getImageProperties(letterhead.logoDataUrl);
      const scale = LOGO / Math.max(width, height);
      pdf.addImage(letterhead.logoDataUrl, format, PAGE.margin, top, width * scale, height * scale);
    } else {
      pdf.setFillColor(38, 38, 38);
      pdf.circle(PAGE.margin + LOGO / 2, top + LOGO / 2, LOGO / 2, 'F');
      pdf.setTextColor(255).setFont('helvetica', 'bold').setFontSize(13);
      pdf.text(letterhead.initials || 'M', PAGE.margin + LOGO / 2, top + LOGO / 2 + 1.8, {
        align: 'center',
      });
      pdf.setTextColor(0);
    }

    const x = PAGE.margin + LOGO + 6;
    let y = top + 5;
    pdf.setFont('helvetica', 'bold').setFontSize(15);
    pdf.text(letterhead.professionalName, x, y);
    y += 6;
    pdf.setFont('helvetica', 'normal').setFontSize(10);
    for (const line of [
      `${letterhead.specialty} · ${letterhead.license}`,
      letterhead.contact,
      ...letterhead.offices,
    ]) {
      pdf.text(line, x, y);
      y += 4.5;
    }
    return Math.max(y, top + LOGO) + 4;
  }
}
