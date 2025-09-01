import React from "react";
import { InvoiceData } from "../types/types";
import { generateBarcodeString } from "../utils/barcodePayment";
import * as PDF417 from "pdf417-generator";
import Image from "next/image";

interface PDFPreviewProps {
  invoiceData: InvoiceData;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ invoiceData }) => {
  // Get company data from localStorage
  const companyName =
    localStorage.getItem("companyName") ||
    invoiceData.imeFirme ||
    "Moja tvrtka";
  const companyFullName =
    localStorage.getItem("companyFullName") ||
    invoiceData.imeFirme ||
    "Moja tvrtka";
  const invoiceIssuer =
    localStorage.getItem("invoiceIssuer") ||
    invoiceData.imeFirme ||
    "Moja tvrtka";
  const companyLogo = localStorage.getItem("companyLogo");
  const companyPhone =
    localStorage.getItem("companyPhone") ||
    invoiceData.brojMobitelaVlasnika ||
    "";
  const vatNote =
    localStorage.getItem("vatNote") ||
    "PDV nije obračunat sukladno članku 90. stavku 1. i stavku 2. Zakona o PDV-u - mali porezni obveznik.";

  // Calculate total amount
  const totalAmount = invoiceData.items
    ? invoiceData.items.reduce(
        (sum, item) => sum + item.cijenaPoJedinici * item.kolicina,
        0
      ) / 100
    : 0;

  // Generate barcode data for display
  const generateBarcodeData = () => {
    try {
      // Create description for barcode from items
      function normalizeCroatianChars(text: string): string {
        return text
          .replace(/č/g, "c")
          .replace(/ć/g, "c")
          .replace(/š/g, "s")
          .replace(/đ/g, "d")
          .replace(/ž/g, "z")
          .replace(/Č/g, "C")
          .replace(/Ć/g, "C")
          .replace(/Š/g, "S")
          .replace(/Đ/g, "D")
          .replace(/Ž/g, "Z");
      }
      const barcodeString = generateBarcodeString({
        IBAN: invoiceData.brojRacunaObrta,
        Primatelj: normalizeCroatianChars(invoiceData.imeFirme),
        Iznos: invoiceData.items
          ? invoiceData.items.reduce(
              (sum, item) => sum + item.cijenaPoJedinici * item.kolicina,
              0
            )
          : 0,
        ModelPlacanja: invoiceData.model || "00",
        PozivNaBroj: invoiceData.pozivNaBroj || invoiceData.brojRacuna,
        OpisPlacanja: normalizeCroatianChars(invoiceData.opisPlacanja),
        ImePlatitelja: normalizeCroatianChars(invoiceData.imeKupca),
        AdresaPlatitelja: normalizeCroatianChars(invoiceData.adresaKupca),
        SjedistePlatitelja: normalizeCroatianChars(invoiceData.postanskiBrojIGradKupca),
        AdresaPrimatelja: normalizeCroatianChars(invoiceData.adresaVlasnika),
        SjedistePrimatelja: normalizeCroatianChars(invoiceData.postanskiBrojIGradVlasnika)
      });

      // Create a temporary canvas to generate barcode image
      const canvas = document.createElement("canvas");
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
    <div
      className="pdf-preview"
      style={{
        width: "210mm",
        height: "297mm",
        padding: "20px",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        lineHeight: "1.4",
        position: "relative",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
        }}
      >
        {/* Company Details (Left) */}
        <div style={{ flex: 1 }}>
          {companyLogo && (
            <Image
              src={companyLogo}
              alt="Company Logo"
              width={100}
              height={60}
              style={{ marginBottom: "10px" }}
            />
          )}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {companyName}
          </div>
          <div style={{ fontSize: "10px" }}>
            <div>{companyFullName}</div>
            <div>{invoiceData.adresaVlasnika}</div>
            <div>{invoiceData.postanskiBrojIGradVlasnika}</div>
            <div>OIB: {invoiceData.oibVlasnika}</div>
            <div>Mob: {companyPhone}</div>
          </div>
        </div>

        {/* Customer Details (Right) */}
        <div
          style={{
            flex: 1,
            color: "black",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {invoiceData.imeKupca}
          </div>
          <div style={{ fontSize: "10px" }}>
            <div>{invoiceData.adresaKupca}</div>
            <div>{invoiceData.postanskiBrojIGradKupca}</div>
            <div>OIB: {invoiceData.oibKupca}</div>
          </div>
        </div>
      </div>

      {/* Invoice Number */}
      <div
        style={{
          textAlign: "center",
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "25px",
          borderBottom: "2px solid #000",
          paddingBottom: "10px",
        }}
      >
        RAČUN BROJ {invoiceData.brojRacuna}
      </div>

      {/* Invoice Details */}
      <div style={{ marginBottom: "20px", fontSize: "10px" }}>
        <div>Mjesto i datum izdavanja: {invoiceData.mjestoIDatumIzdavanja}</div>
        <div>Vrijeme izdavanja: {invoiceData.vrijemeIzdavanja}</div>
        <div>Mjesto i datum isporuke: {invoiceData.mjestoIDatumIsporuke}</div>
        <div>Datum plaćanja: {invoiceData.datumPlacanja}</div>
        <div>Račun izradio: {invoiceIssuer}</div>
      </div>

      {/* Table */}
      <div style={{ marginBottom: "20px" }}>
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "50px 1fr 80px 100px 100px",
            backgroundColor: "#f0f0f0",
            padding: "8px 0",
            fontWeight: "bold",
            fontSize: "10px",
          }}
        >
          <div style={{ padding: "0 5px" }}>R.br.</div>
          <div style={{ padding: "0 5px" }}>Naziv robe/usluge</div>
          <div style={{ padding: "0 5px" }}>Količina</div>
          <div style={{ padding: "0 5px" }}>Cijena po jedinici</div>
          <div style={{ padding: "0 5px" }}>Ukupno cijena</div>
        </div>

        {/* Table Content */}
        {invoiceData.items && invoiceData.items.length > 0 ? (
          invoiceData.items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 1fr 80px 100px 100px",
                padding: "8px 0",
                fontSize: "9px",
                borderBottom:
                  index === invoiceData.items.length - 1
                    ? "1px solid #ddd"
                    : "none",
              }}
            >
              <div style={{ padding: "0 5px" }}>{index + 1}.</div>
              <div style={{ padding: "0 5px" }}>{item.nazivRobeUsluge}</div>
              <div style={{ padding: "0 5px" }}>{item.kolicina}</div>
              <div style={{ padding: "0 5px" }}>
                {(item.cijenaPoJedinici / 100).toFixed(2)} EUR
              </div>
              <div style={{ padding: "0 5px" }}>
                {((item.cijenaPoJedinici * item.kolicina) / 100).toFixed(2)} EUR
              </div>
            </div>
          ))
        ) : (
          // Fallback for backward compatibility with single item
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50px 1fr 80px 100px 100px",
              padding: "8px 0",
              fontSize: "9px",
              borderBottom: "1px solid #ddd",
            }}
          >
            <div style={{ padding: "0 5px" }}>1.</div>
            <div style={{ padding: "0 5px" }}>{"N/A"}</div>
            <div style={{ padding: "0 5px" }}>{0}</div>
            <div style={{ padding: "0 5px" }}>{0} EUR</div>
            <div style={{ padding: "0 5px" }}>{totalAmount.toFixed(2)} EUR</div>
          </div>
        )}
      </div>

      {/* Total Amount */}
      <div
        style={{
          textAlign: "right",
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        Ukupno iznos računa*: {totalAmount.toFixed(2)} EUR
      </div>

      {/* VAT Note */}
      <div
        style={{
          fontSize: "8px",
          marginBottom: "20px",
          fontStyle: "italic",
        }}
      >
        *{vatNote}
      </div>

      {/* Payment Information */}
      <div style={{ marginBottom: "25px", fontSize: "10px" }}>
        <div>Način plaćanja: Uplata na transakcijski račun</div>
        <div>Platiti na račun broj: {invoiceData.brojRacunaObrta}</div>
        <div>
          Kod uplate pozovite se na broj: {invoiceData.model || "00"}{" "}
          {invoiceData.pozivNaBroj || invoiceData.brojRacuna}
        </div>
      </div>

      {/* Barcode */}
      {barcodeDataUrl && (
        <>
          <div style={{ marginBottom: "5px", fontSize: "10px" }}>
            Ili skenirajte QR kod
          </div>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Image
              src={barcodeDataUrl}
              alt="Barcode"
              width={250}
              height={60}
              style={{ maxWidth: "100%" }}
            />
          </div>
        </>
      )}

      {/* Electronic invoice note */}
      <div
        style={{
          textAlign: "left",
          fontSize: "8px",
          marginBottom: "20px",
        }}
      >
        <div>
          Račun je izdan u elektroničkom obliku te je valjan bez pečata i
          potpisa.
        </div>
        <div style={{ marginTop: "5px" }}>U ime obrta, {companyFullName}</div>
      </div>

      {/* Bottom Info */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          right: "20px",
          fontSize: "8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div>
          {companyFullName}, {invoiceData.adresaVlasnika},{" "}
          {invoiceData.postanskiBrojIGradVlasnika}; OIB:{" "}
          {invoiceData.oibVlasnika}; MBO: {localStorage.getItem("mbo") || ""}
        </div>
        <div>
          | Žiro račun IBAN {invoiceData.brojRacunaObrta} otvoren kod{" "}
          {localStorage.getItem("bankName") || "banke"}
        </div>
      </div>
    </div>
  );
};
