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

    // Spremi originalni transform
    const originalTransform = pdfPreviewElement.style.transform;

    // Privremeno povećaj scale za bolju kvalitetu PDF-a
    const zoomFactor = 2; // 200% zoom
    pdfPreviewElement.style.transform = `scale(${zoomFactor})`;
    pdfPreviewElement.style.transformOrigin = 'top left';

    // Pričekaj malo da se DOM ažurira
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generiraj canvas iz HTML-a s povećanim scale-om
    const canvas = await html2canvas(pdfPreviewElement, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
    });

    // Vrati originalni transform
    pdfPreviewElement.style.transform = originalTransform;

    // Kreiraj PDF s optimiziranim postavkama
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Kompresiraj canvas u JPEG format s nižom kvalitetom
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% kvaliteta umjesto PNG
    
    // Izračunaj omjer za pravilno skaliranje
    const imgWidth = 210; // A4 širina u mm
    const imgHeight = 297; // A4 visina u mm
    
    // Dodaj sliku u PDF s pravilnim dimenzijama
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    
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