// Data needed for barcode generation (payment information)
export interface BarcodePaymentData {
  // Required fields for barcode generation
  IBAN: string; // broj bankovnog racuna za uplatu
  Primatelj: string; // naziv primatelja placanja
  Iznos: number; // iznos
  OpisPlacanja: string; // opis placanja
  ModelPlacanja: string; // model placanja
  PozivNaBroj: string; // poziv na broj
  
  // Optional fields
  ImePlatitelja?: string;
  AdresaPlatitelja?: string;
  SjedistePlatitelja?: string;
  AdresaPrimatelja?: string;
  SjedistePrimatelja?: string;
  SifraNamjene?: string; // Optional intent code
}

// Individual invoice item
export interface InvoiceItem {
  id: string;
  nazivRobeUsluge: string;
  kolicina: number;
  cijenaPoJedinici: number;
}

// Data needed for PDF generation (invoice information)
export interface InvoiceData {
  // Company information
  imeFirme: string;
  adresaVlasnika: string;
  postanskiBrojIGradVlasnika: string;
  oibVlasnika: string;
  brojMobitelaVlasnika: string;
  
  // Customer information
  imeKupca: string;
  adresaKupca: string;
  postanskiBrojIGradKupca: string;
  oibKupca: string;
  
  // Invoice details
  mjestoIDatumIzdavanja: string;
  vrijemeIzdavanja: string;
  mjestoIDatumIsporuke: string;
  datumPlacanja: string;
  
  // Product/Service information - now supports multiple items
  items: InvoiceItem[];
  
  // Payment information
  brojRacunaObrta: string;
  brojRacuna: string; // Broj računa (npr. 1-1-25)
  pozivNaBroj: string;
  model: string; // Model plaćanja (npr. 00)
}

// Legacy interface for backward compatibility
export interface FormData extends InvoiceData {}

// Legacy interface for backward compatibility
export interface PaymentParams extends BarcodePaymentData {}