import React from "react";
import { validatePaymentParams, ValidationResult } from "../utils/barcodePayment"
import { BarcodePaymentData, InvoiceData } from "../types/types";
import { generateBarcode } from "../utils/generateBarcode";
import { validateBarcodeData, validateInvoiceData } from "./dataConversion";

export const validateInputAndGenerateBarcode = (paymentParams: BarcodePaymentData, barcodeRef: React.RefObject<HTMLCanvasElement>) => {
    try {
        const validationResult = validatePaymentParams(paymentParams);
        if (validationResult === ValidationResult.OK) {
            generateBarcode(paymentParams, barcodeRef);
        } else {
            let errorMessage = "Validacija nije uspjela. Molimo provjerite unesene podatke:\n";
            if (validationResult & ValidationResult.PricePatternInvalid) {
                errorMessage += "- Neispravan format cijene.\n";
            }
            if (validationResult & ValidationResult.PriceMaxLengthExceeded) {
                errorMessage += "- Cijena prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.PayerNameInvalid) {
                errorMessage += "- Neispravno ime platitelja.\n";
            }
            if (validationResult & ValidationResult.PayerNameMaxLengthExceeded) {
                errorMessage += "- Ime platitelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.PayerAddressInvalid) {
                errorMessage += "- Neispravna adresa platitelja.\n";
            }
            if (validationResult & ValidationResult.PayerAddressMaxLengthExceeded) {
                errorMessage += "- Adresa platitelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.PayerHQInvalid) {
                errorMessage += "- Neispravno sjedište platitelja.\n";
            }
            if (validationResult & ValidationResult.PayerHQMaxLengthExceeded) {
                errorMessage += "- Sjedište platitelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.ReceiverNameInvalid) {
                errorMessage += "- Neispravno ime primatelja.\n";
            }
            if (validationResult & ValidationResult.ReceiverNameMaxLengthExceeded) {
                errorMessage += "- Ime primatelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.ReceiverAddressInvalid) {
                errorMessage += "- Neispravna adresa primatelja.\n";
            }
            if (validationResult & ValidationResult.ReceiverAddressMaxLengthExceeded) {
                errorMessage += "- Adresa primatelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.ReceiverHQInvalid) {
                errorMessage += "- Neispravno sjedište primatelja.\n";
            }
            if (validationResult & ValidationResult.ReceiverHQMaxLengthExceeded) {
                errorMessage += "- Sjedište primatelja prelazi maksimalnu duljinu.\n";
            }
            if (validationResult & ValidationResult.IBANInvalid) {
                errorMessage += "- Neispravan IBAN.\n";
            }
            if (validationResult & ValidationResult.PaymentModelInvalid) {
                errorMessage += "- Neispravan model plaćanja.\n";
            }
            if (validationResult & ValidationResult.CalloutNumberInvalid) {
                errorMessage += "- Neispravan poziv na broj.\n";
            }
            if (validationResult & ValidationResult.IntentCodeInvalid) {
                errorMessage += "- Neispravna šifra namjene.\n";
            }
            if (validationResult & ValidationResult.PaymentDescriptionInvalid) {
                errorMessage += "- Neispravan opis plaćanja.\n";
            }
            if (validationResult & ValidationResult.PaymentDescriptionMaxLengthExceeded) {
                errorMessage += "- Opis plaćanja prelazi maksimalnu duljinu.\n";
            }

            alert(errorMessage);
        }
    } catch (error) {
        console.error("Greška pri generiranju barkoda:", error);
        alert("Došlo je do greške tijekom generiranja barkoda.");
    }
};

export const validateInvoiceAndGenerateBarcode = (
    invoiceData: InvoiceData, 
    barcodeRef: React.RefObject<HTMLCanvasElement>,
    modelPlacanja: string = "00",
    sifraNamjene: string = ""
) => {
    try {
        // First validate invoice data
        const invoiceValidation = validateInvoiceData(invoiceData);
        if (!invoiceValidation.isValid) {
            const errorMessage = `Validacija podataka računa nije uspjela. Nedostaju polja:\n${invoiceValidation.missingFields.join('\n')}`;
            alert(errorMessage);
            return;
        }

        // Calculate total amount from items or fallback to single item
        const totalAmount = invoiceData.items && invoiceData.items.length > 0
            ? invoiceData.items.reduce((sum, item) => sum + (item.cijenaPoJedinici * item.kolicina), 0)
            : 0;

        // Get description from first item or fallback to single item
        const opisPlacanja = invoiceData.items && invoiceData.items.length > 0
            ? invoiceData.items[0].nazivRobeUsluge
            : "N/A";

        // Convert invoice data to barcode data
        const barcodeData = {
            Iznos: totalAmount,
            ImePlatitelja: invoiceData.imeKupca,
            AdresaPlatitelja: invoiceData.adresaKupca,
            SjedistePlatitelja: invoiceData.postanskiBrojIGradKupca,
            Primatelj: invoiceData.imeFirme,
            AdresaPrimatelja: invoiceData.adresaVlasnika,
            SjedistePrimatelja: invoiceData.postanskiBrojIGradVlasnika,
            IBAN: invoiceData.brojRacunaObrta,
            ModelPlacanja: modelPlacanja,
            PozivNaBroj: invoiceData.brojRacuna || invoiceData.pozivNaBroj,
            SifraNamjene: sifraNamjene,
            OpisPlacanja: opisPlacanja,
        };

        // Validate barcode data
        const barcodeValidation = validateBarcodeData(barcodeData);
        if (!barcodeValidation.isValid) {
            const errorMessage = `Validacija podataka barkoda nije uspjela. Nedostaju polja:\n${barcodeValidation.missingFields.join('\n')}`;
            alert(errorMessage);
            return;
        }

        // Generate barcode
        validateInputAndGenerateBarcode(barcodeData, barcodeRef);
    } catch (error) {
        console.error("Greška pri generiranju barkoda iz podataka računa:", error);
        alert("Došlo je do greške tijekom generiranja barkoda.");
    }
};