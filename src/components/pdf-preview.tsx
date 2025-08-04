import React from 'react';
import { InvoiceData } from '../types/types';
import { generateBarcodeString } from '../utils/barcodePayment';
import * as PDF417 from 'pdf417-generator';

interface PDFPreviewProps {
  invoiceData: InvoiceData;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ invoiceData }) => {
  // Get company data from localStorage
  const companyName = localStorage.getItem('companyName') || invoiceData.imeFirme || "Moja tvrtka";
  const companyFullName = localStorage.getItem('companyFullName') || invoiceData.imeFirme || "Moja tvrtka";
  const invoiceIssuer = localStorage.getItem('invoiceIssuer') || invoiceData.imeFirme || "Moja tvrtka";
  const companyLogo = localStorage.getItem('companyLogo');
  const companyPhone = localStorage.getItem('companyPhone') || invoiceData.brojMobitelaVlasnika || "";
  const vatNote = localStorage.getItem('vatNote') || 'PDV nije obračunat sukladno članku 90. stavku 1. i stavku 2. Zakona o PDV-u - mali porezni obveznik.';

  // Calculate total amount
  const totalAmount = invoiceData.kolicina * (invoiceData.cijenaPoJedinici / 100);

  // Generate barcode data for display
  const generateBarcodeData = () => {
    try {
             const barcodeString = generateBarcodeString({
         IBAN: invoiceData.brojRacunaObrta,
         Primatelj: invoiceData.imeFirme,
         Iznos: invoiceData.kolicina * (invoiceData.cijenaPoJedinici),
         ModelPlacanja: invoiceData.model || "00",
         PozivNaBroj: invoiceData.pozivNaBroj || invoiceData.brojRacuna,
         OpisPlacanja: invoiceData.nazivRobeUsluge.substring(0, 34)
       });

      // Create a temporary canvas to generate barcode image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      
      PDF417.draw(barcodeString, canvas, 3);
      
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating barcode:", error);
      return null;
    }
  };

  const barcodeDataUrl = generateBarcodeData();

  return (
    <div className="pdf-preview" style={{
      width: '210mm',
      height: '297mm',
      padding: '20px',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      position: 'relative'
    }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        {/* Company Details (Left) */}
        <div style={{ flex: 1 }}>
          {companyLogo && (
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              style={{ width: '100px', height: '60px', marginBottom: '10px' }}
            />
          )}
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            {companyName}
          </div>
          <div style={{ fontSize: '10px' }}>
            <div>{companyFullName}</div>
            <div>{invoiceData.adresaVlasnika}</div>
            <div>{invoiceData.postanskiBrojIGradVlasnika}</div>
                         <div>OIB: {invoiceData.oibVlasnika}</div>
             <div>Mob: {companyPhone}</div>
          </div>
        </div>

        {/* Customer Details (Right) */}
        <div style={{ 
          flex: 1, 
          color: 'black', 
          padding: '10px',
          borderRadius: '5px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
            {invoiceData.imeKupca}
          </div>
          <div style={{ fontSize: '10px' }}>
            <div>{invoiceData.adresaKupca}</div>
            <div>{invoiceData.postanskiBrojIGradKupca}</div>
            <div>OIB: {invoiceData.oibKupca}</div>
          </div>
        </div>
      </div>

      {/* Invoice Number */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '25px',
        borderBottom: '2px solid #000',
        paddingBottom: '10px'
      }}>
        RAČUN BROJ {invoiceData.brojRacuna}
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: '20px', fontSize: '10px' }}>
        <div>Mjesto i datum izdavanja: {invoiceData.mjestoIDatumIzdavanja}</div>
        <div>Vrijeme izdavanja: {invoiceData.vrijemeIzdavanja}</div>
        <div>Mjesto i datum isporuke: {invoiceData.mjestoIDatumIsporuke}</div>
        <div>Datum plaćanja: {invoiceData.datumPlacanja}</div>
        <div>Račun izradio: {invoiceIssuer}</div>
      </div>

      {/* Table */}
      <div style={{ marginBottom: '20px' }}>
        {/* Table Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '50px 1fr 80px 100px 100px',
          backgroundColor: '#f0f0f0',
          padding: '8px 0',
          fontWeight: 'bold',
          fontSize: '10px'
        }}>
          <div style={{ padding: '0 5px' }}>R.br.</div>
          <div style={{ padding: '0 5px' }}>Naziv robe/usluge</div>
          <div style={{ padding: '0 5px' }}>Količina</div>
          <div style={{ padding: '0 5px' }}>Cijena po jedinici</div>
          <div style={{ padding: '0 5px' }}>Ukupno cijena</div>
        </div>

        {/* Table Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '50px 1fr 80px 100px 100px',
          padding: '8px 0',
          fontSize: '9px',
          borderBottom: '1px solid #ddd'
        }}>
          <div style={{ padding: '0 5px' }}>1.</div>
          <div style={{ padding: '0 5px' }}>{invoiceData.nazivRobeUsluge}</div>
          <div style={{ padding: '0 5px' }}>{invoiceData.kolicina}</div>
          <div style={{ padding: '0 5px' }}>{(invoiceData.cijenaPoJedinici / 100).toFixed(2)} EUR</div>
          <div style={{ padding: '0 5px' }}>{totalAmount.toFixed(2)} EUR</div>
        </div>
      </div>

      {/* Total Amount */}
      <div style={{ 
        textAlign: 'right', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '8px' 
      }}>
        Ukupno iznos računa*: {totalAmount.toFixed(2)} EUR
      </div>

      {/* VAT Note */}
      <div style={{ 
        fontSize: '8px', 
        marginBottom: '20px',
        fontStyle: 'italic'
      }}>
        *{vatNote}
      </div>

      {/* Payment Information */}
      <div style={{ marginBottom: '25px', fontSize: '10px' }}>
        <div>Način plaćanja: Uplata na transakcijski račun</div>
        <div>Platiti na račun broj: {invoiceData.brojRacunaObrta}</div>
        <div>Kod uplate pozovite se na broj: {invoiceData.model || "00"} {invoiceData.pozivNaBroj || invoiceData.brojRacuna}</div>
      </div>

      {/* Barcode */}
      {barcodeDataUrl && (
        <>
        <div style={{ marginBottom: '5px', fontSize: '10px' }}>Ili skenirajte QR kod</div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src={barcodeDataUrl} 
            alt="Barcode" 
            style={{ maxWidth: '100%', height: '100px' }}
          />
        </div>
        </>
      )}

      {/* Electronic invoice note */}
      <div style={{ 
        textAlign: 'left', 
        fontSize: '8px', 
        marginBottom: '20px'
      }}>
        <div>Račun je izdan u elektroničkom obliku te je valjan bez pečata i potpisa.</div>
                 <div style={{ marginTop: '5px' }}>U ime obrta, {companyFullName}</div>
      </div>



      {/* Bottom Info */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px',
        right: '20px',
        fontSize: '8px',
        display: 'flex',
        justifyContent: 'center'
      }}>
               <div>{companyFullName}, {invoiceData.adresaVlasnika}, {invoiceData.postanskiBrojIGradVlasnika}; OIB: {invoiceData.oibVlasnika}; MBO: {localStorage.getItem('mbo') || ''}</div>
       <div>| Žiro račun IBAN {invoiceData.brojRacunaObrta} otvoren kod {localStorage.getItem('bankName') || 'banke'}</div>
      </div>
    </div>
  );
}; 