import { InvoiceData, BarcodePaymentData } from '../types/types';

/**
 * Validates that all required barcode payment data is present
 */
export function validateBarcodeData(data: BarcodePaymentData): { isValid: boolean; missingFields: string[] } {
  const requiredFields: (keyof BarcodePaymentData)[] = [
    'IBAN', 'Primatelj', 'Iznos', 'OpisPlacanja', 'ModelPlacanja', 'PozivNaBroj'
  ]; // Only essential fields are required

  const fieldLabels: { [key: string]: string } = {
    IBAN: 'Broj bankovnog računa (IBAN)',
    Primatelj: 'Naziv primatelja plaćanja',
    Iznos: 'Iznos plaćanja',
    OpisPlacanja: 'Opis plaćanja',
    ModelPlacanja: 'Model plaćanja',
    PozivNaBroj: 'Poziv na broj'
  };

  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(fieldLabels[field] || field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Converts invoice data to barcode payment data
 * This function maps invoice fields to the specific format required for barcode generation
 */
export function convertInvoiceToBarcodeData(
  invoiceData: InvoiceData,
  modelPlacanja: string = "00",
  sifraNamjene: string = ""
): BarcodePaymentData {
  // Calculate total amount from items or fallback to single item
  const totalAmount = invoiceData.items && invoiceData.items.length > 0
    ? invoiceData.items.reduce((sum, item) => sum + (item.cijenaPoJedinici * item.kolicina), 0)
    : 0;

  // Get description from first item or fallback to single item
  const opisPlacanja = invoiceData.items && invoiceData.items.length > 0
    ? invoiceData.items[0].nazivRobeUsluge
    : "N/A";

  return {
    // Required fields for barcode generation
    IBAN: invoiceData.brojRacunaObrta,
    Primatelj: invoiceData.imeFirme,
    Iznos: totalAmount,
    OpisPlacanja: opisPlacanja,
    ModelPlacanja: modelPlacanja,
    PozivNaBroj: invoiceData.brojRacuna || invoiceData.pozivNaBroj,
    
    // Optional fields (only include if they have values)
    ...(invoiceData.imeKupca && { ImePlatitelja: invoiceData.imeKupca }),
    ...(invoiceData.adresaKupca && { AdresaPlatitelja: invoiceData.adresaKupca }),
    ...(invoiceData.postanskiBrojIGradKupca && { SjedistePlatitelja: invoiceData.postanskiBrojIGradKupca }),
    ...(invoiceData.adresaVlasnika && { AdresaPrimatelja: invoiceData.adresaVlasnika }),
    ...(invoiceData.postanskiBrojIGradVlasnika && { SjedistePrimatelja: invoiceData.postanskiBrojIGradVlasnika }),
    ...(sifraNamjene && { SifraNamjene: sifraNamjene }),
  };
}

/**
 * Validates that all required invoice data is present
 * Only essential fields are required for PDF generation
 */
export function validateInvoiceData(data: InvoiceData): { isValid: boolean; missingFields: string[] } {
  // Only essential fields are required for PDF generation
  const requiredFields: (keyof InvoiceData)[] = [
    'imeFirme',           // Naziv obrta - required
    'brojRacunaObrta',    // Broj računa obrta - required
    'brojRacuna'          // Broj računa - required
  ];

  // Check if items are present and valid
  if (!data.items || data.items.length === 0) {
    return {
      isValid: false,
      missingFields: ['Stavke računa']
    };
  }

  // Validate each item
  const itemErrors: string[] = [];
  data.items.forEach((item, index) => {
    if (!item.nazivRobeUsluge || !item.nazivRobeUsluge.trim()) {
      itemErrors.push(`Stavka ${index + 1}: Naziv robe/usluge`);
    }
    if (!item.kolicina || item.kolicina <= 0) {
      itemErrors.push(`Stavka ${index + 1}: Količina`);
    }
    if (!item.cijenaPoJedinici || item.cijenaPoJedinici <= 0) {
      itemErrors.push(`Stavka ${index + 1}: Cijena po jedinici`);
    }
  });

  const fieldLabels: { [key: string]: string } = {
    imeFirme: 'Naziv obrta',
    adresaVlasnika: 'Adresa vlasnika',
    postanskiBrojIGradVlasnika: 'Poštanski broj i grad vlasnika',
    oibVlasnika: 'OIB vlasnika',
    brojMobitelaVlasnika: 'Broj mobitela vlasnika',
    imeKupca: 'Naziv kupca',
    adresaKupca: 'Adresa kupca',
    postanskiBrojIGradKupca: 'Poštanski broj i grad kupca',
    oibKupca: 'OIB kupca',
    mjestoIDatumIzdavanja: 'Mjesto i datum izdavanja',
    vrijemeIzdavanja: 'Vrijeme izdavanja',
    mjestoIDatumIsporuke: 'Mjesto i datum isporuke',
    datumPlacanja: 'Datum plaćanja',
    nazivRobeUsluge: 'Naziv robe/usluge',
    kolicina: 'Količina',
    cijenaPoJedinici: 'Cijena po jedinici',
    brojRacunaObrta: 'Broj računa obrta',
    brojRacuna: 'Broj računa',
    pozivNaBroj: 'Poziv na broj'
  };

  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(fieldLabels[field] || field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
} 