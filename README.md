# E-Invoice HR - Croatian Electronic Invoice System

A modern React TypeScript application for generating electronic invoices with Croatian payment barcode functionality. This application supports the HRVHUB30 standard for Croatian payment processing.

## 🚀 Features

### 💳 **Flexible Workflow Options**
- **Barcode Only**: Generate payment barcodes without creating PDF invoices
- **PDF Only**: Create professional invoices without generating barcodes  
- **Both**: Generate barcode and PDF simultaneously

### 📊 **Barcode Generation**
- Supports Croatian payment standards (HRVHUB30)
- **Minimal required information for payment**:
  - Bank account number for payment (IBAN)
  - Payment recipient name
  - Amount
  - Payment description
  - Payment model
  - Reference number
- Optional purpose codes for different payment types
- All other fields (payer information, addresses) are optional
- Automatic validation of basic payment data

### 📄 **PDF Generation**
- Professional invoice appearance
- Company and customer information
- Product/service details with calculations
- Embedded barcode support
- Croatian text character encoding

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF
- **Barcode Generation**: PDF417
- **UI Components**: Custom component library

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── barcode-generator.tsx
│   ├── invoice-generator.tsx
│   ├── settings.tsx
│   └── ...
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── utils/                 # Business logic utilities
    ├── barcodePayment.ts
    ├── pdfGeneration.ts
    ├── customerStorage.ts
    └── ...
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ibosnic00/e-invoice-hr.git
   cd e-invoice-hr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage

### Workflow Selection
Choose your workflow based on your needs:

1. **Barcode Only Card**: 
   - Payment information form
   - Barcode settings (payment model, optional purpose code)
   - Generate barcode button
   - Barcode display

2. **PDF Only Card**: 
   - Complete invoice information form
   - Create PDF button
   - No barcode settings or display

3. **Both Card**: 
   - Complete invoice information form
   - Barcode settings
   - Both generate barcode and create PDF buttons
   - Barcode display

### Data Requirements

#### For Barcode Generation (Minimal)
- **Required**: IBAN, Recipient Name, Amount, Payment Description, Payment Model, Reference Number
- **Optional**: Payer Information, Purpose Code

#### For PDF Generation (Complete)
- **Company Information**: Business name, address, OIB, contact details
- **Customer Information**: Customer name, address, OIB
- **Invoice Details**: Issue date, delivery date, payment date
- **Product/Service Information**: Item name, quantity, unit price
- **Payment Information**: IBAN, reference number

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Key Utilities

- `dataConversion.ts` - Convert between invoice and barcode data formats
- `barcodePayment.ts` - Handle barcode generation and validation
- `pdfGeneration.ts` - Generate PDF invoices
- `customerStorage.ts` - Manage customer data persistence

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for Croatian businesses**
