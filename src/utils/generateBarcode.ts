import { PaymentParams } from "../types/types";
import { generateBarcodeString } from "./barcodePayment";
import * as PDF417 from 'pdf417-generator';

// Function to normalize Croatian characters
function normalizeCroatianChars(text: string): string {
    return text
        .replace(/č/g, 'c')
        .replace(/ć/g, 'c')
        .replace(/š/g, 's')
        .replace(/đ/g, 'd')
        .replace(/ž/g, 'z')
        .replace(/Č/g, 'C')
        .replace(/Ć/g, 'C')
        .replace(/Š/g, 'S')
        .replace(/Đ/g, 'D')
        .replace(/Ž/g, 'Z');
}

export const generateBarcode = (paymentParams: PaymentParams, barcodeRef: React.RefObject<HTMLCanvasElement>) => {
    try {
        const barcodeString = generateBarcodeString(paymentParams);
        
        // Normalize Croatian characters for barcode generation
        const normalizedString = normalizeCroatianChars(barcodeString);

        if (barcodeRef.current) {
            const canvas = barcodeRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            PDF417.draw(normalizedString, canvas, 5);
        } else {
            console.error("Failed to get canvas reference.");
        }
    } catch (error) {
        console.error("Error generating barcode:", error);
        alert("An error occurred during barcode generation.");
    }
};