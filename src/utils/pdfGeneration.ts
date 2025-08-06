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

    // Generiraj canvas iz HTML-a - koristi stvarne dimenzije elementa
    const canvas = await html2canvas(pdfPreviewElement, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      // Ukloni fiksne dimenzije - neka html2canvas koristi stvarne dimenzije elementa
      // width: 794, // A4 širina u pikselima (210mm)
      // height: 1123, // A4 visina u pikselima (297mm)
    });

    // Kreiraj PDF s odgovarajućim dimenzijama
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Izračunaj omjer za pravilno skaliranje
    const imgWidth = 210; // A4 širina u mm
    const imgHeight = 297; // A4 visina u mm
    
    // Dodaj sliku u PDF s pravilnim dimenzijama
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Spremi PDF s imenom baziranim na poziv na broj
    const fileName = invoiceData.pozivNaBroj 
      ? `Račun_${invoiceData.pozivNaBroj}.pdf`
      : `Račun_${Date.now()}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};