import { PaymentParams } from "../types/types";
import { generateBarcodeString } from "./barcodePayment";
import * as PDF417 from 'pdf417-generator';

export const generateBarcode = (paymentParams: PaymentParams, barcodeRef: React.RefObject<HTMLCanvasElement>) => {
    try {
        const barcodeString = generateBarcodeString(paymentParams);

        // Draw the barcode directly on the canvas
        if (barcodeRef.current) {
            const canvas = barcodeRef.current;
            const ctx = canvas.getContext('2d');
            
            // Clear the canvas and set white background
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            PDF417.draw(barcodeString, canvas, 5); // Use PDF417.draw to render the barcode with larger scale
        } else {
            console.error("Failed to get canvas reference.");
        }
    } catch (error) {
        console.error("Error generating barcode:", error);
        alert("An error occurred during barcode generation.");
    }
};