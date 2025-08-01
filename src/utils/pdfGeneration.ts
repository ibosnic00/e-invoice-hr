import { InvoiceData } from "../types/types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (invoiceData: InvoiceData) => {
  try {
    // Pronađi PDF preview element u DOM-u
    const pdfPreviewElement = document.querySelector('.pdf-preview') as HTMLElement;
    
    if (!pdfPreviewElement) {
      throw new Error('PDF preview element not found');
    }

    // Generiraj canvas iz HTML-a
    const canvas = await html2canvas(pdfPreviewElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 širina u pikselima (210mm)
      height: 1123, // A4 visina u pikselima (297mm)
    });

    // Kreiraj PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Dodaj sliku u PDF
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    // Spremi PDF
    pdf.save('racun.pdf');

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};