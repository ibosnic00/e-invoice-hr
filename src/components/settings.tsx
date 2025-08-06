"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Download,
  Upload,
  Info,
  Database,
  FileText,
  QrCode,
  Building2,
  Image as ImageIcon,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmationDialog from "./confirmation-dialog";
import { validateOIB, formatOIB } from "@/utils/validation";
import {
  getCustomers,
  clearCustomers,
  type Customer,
} from "@/utils/customerStorage";
import { ThemeToggle } from "./theme-toggle";
import { Switch } from "./ui/switch";
import {
  getInvoiceNumberSettings,
  saveInvoiceNumberSettings,
  type InvoiceNumberSettings,
} from "@/utils/storage";

export default function SettingsComponent() {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState(
    localStorage.getItem("companyName") || ""
  );
  const [companyFullName, setCompanyFullName] = useState(
    localStorage.getItem("companyFullName") || ""
  );
  const [invoiceIssuer, setInvoiceIssuer] = useState(
    localStorage.getItem("invoiceIssuer") || ""
  );
  const [mjesto, setMjesto] = useState(
    localStorage.getItem("mjesto") || ""
  );
  const [companyLogo, setCompanyLogo] = useState<string>(
    localStorage.getItem("companyLogo") || ""
  );
  const [bankName, setBankName] = useState(
    localStorage.getItem("bankName") || ""
  );
  const [companyStreet, setCompanyStreet] = useState(
    localStorage.getItem("companyStreet") || ""
  );
  const [companyHouseNumber, setCompanyHouseNumber] = useState(
    localStorage.getItem("companyHouseNumber") || ""
  );
  const [companyPostalCode, setCompanyPostalCode] = useState(
    localStorage.getItem("companyPostalCode") || ""
  );
  const [companyCity, setCompanyCity] = useState(
    localStorage.getItem("companyCity") || ""
  );
  const [companyAccountNumber, setCompanyAccountNumber] = useState(
    localStorage.getItem("companyAccountNumber") || ""
  );
  const [companyOIB, setCompanyOIB] = useState(
    localStorage.getItem("companyOIB") || ""
  );
  const [companyPhone, setCompanyPhone] = useState(
    localStorage.getItem("companyPhone") || ""
  );
  const [vatNote, setVatNote] = useState(
    localStorage.getItem("vatNote") ||
      "PDV nije obračunat sukladno članku 90. stavku 1. i stavku 2. Zakona o PDV-u - mali porezni obveznik."
  );
  const [mbo, setMbo] = useState(localStorage.getItem("mbo") || "");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isInvoiceSettingsExpanded, setIsInvoiceSettingsExpanded] =
    useState(false);
  const [isOtherSettingsExpanded, setIsOtherSettingsExpanded] = useState(false);
  const [showConfirmDeleteCustomers, setShowConfirmDeleteCustomers] =
    useState(false);
  const [showConfirmDeleteCompany, setShowConfirmDeleteCompany] =
    useState(false);

  // Invoice number settings state
  const [invoiceNumberSettings, setInvoiceNumberSettings] =
    useState<InvoiceNumberSettings>({
      useAutomaticNumbering: false,
      redniBrojZadnjegRacuna: "00",
      oznakaPoslovnogProstora: "01",
      oznakaNaplatnogUredaja: new Date().getFullYear().toString().slice(-2),
    });

  useEffect(() => {
    setCustomers(getCustomers());
    // Load invoice number settings
    setInvoiceNumberSettings(getInvoiceNumberSettings());
  }, []);

  const handleClearAllData = () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      showToast("Svi podatci su uspješno obrisani.", "success");
      setShowConfirmDelete(false);
    } catch (error) {
      showToast("Došlo je do greške prilikom brisanja podataka.", "error");
    }
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        barcodeData: localStorage.getItem("barcodeGeneratorData"),
        invoiceData: localStorage.getItem("invoiceGeneratorData"),
        history: localStorage.getItem("generatedItemsHistory"),
        barcodeCanvas: localStorage.getItem("barcodeCanvas"),
        companyName: localStorage.getItem("companyName"),
        companyFullName: localStorage.getItem("companyFullName"),
        invoiceIssuer: localStorage.getItem("invoiceIssuer"),
        mjesto: localStorage.getItem("mjesto"),
        companyLogo: localStorage.getItem("companyLogo"),
        bankName: localStorage.getItem("bankName"),
        companyStreet: localStorage.getItem("companyStreet"),
        companyHouseNumber: localStorage.getItem("companyHouseNumber"),
        companyPostalCode: localStorage.getItem("companyPostalCode"),
        companyCity: localStorage.getItem("companyCity"),
        companyAccountNumber: localStorage.getItem("companyAccountNumber"),
        companyOIB: localStorage.getItem("companyOIB"),
        companyPhone: localStorage.getItem("companyPhone"),
        vatNote: localStorage.getItem("vatNote"),
        mbo: localStorage.getItem("mbo"),
        customers: localStorage.getItem("savedCustomers"),
        invoiceNumberSettings: localStorage.getItem("invoice-number-settings"),
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `e-invoice-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();
      URL.revokeObjectURL(url);

      showToast("Podatci su uspješno eksportirani.", "success");
    } catch (error) {
      showToast("Došlo je do greške prilikom eksportiranja podataka.", "error");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        // Restore data to localStorage
        if (importedData.barcodeData)
          localStorage.setItem(
            "barcodeGeneratorData",
            importedData.barcodeData
          );
        if (importedData.invoiceData)
          localStorage.setItem(
            "invoiceGeneratorData",
            importedData.invoiceData
          );
        if (importedData.history)
          localStorage.setItem("generatedItemsHistory", importedData.history);
        if (importedData.barcodeCanvas)
          localStorage.setItem("barcodeCanvas", importedData.barcodeCanvas);
        if (importedData.companyName)
          localStorage.setItem("companyName", importedData.companyName);
        if (importedData.companyFullName)
          localStorage.setItem("companyFullName", importedData.companyFullName);
        if (importedData.invoiceIssuer)
          localStorage.setItem("invoiceIssuer", importedData.invoiceIssuer);
        if (importedData.mjesto)
          localStorage.setItem("mjesto", importedData.mjesto);
        if (importedData.companyLogo)
          localStorage.setItem("companyLogo", importedData.companyLogo);
        if (importedData.bankName)
          localStorage.setItem("bankName", importedData.bankName);
        if (importedData.companyStreet)
          localStorage.setItem("companyStreet", importedData.companyStreet);
        if (importedData.companyHouseNumber)
          localStorage.setItem(
            "companyHouseNumber",
            importedData.companyHouseNumber
          );
        if (importedData.companyPostalCode)
          localStorage.setItem(
            "companyPostalCode",
            importedData.companyPostalCode
          );
        if (importedData.companyCity)
          localStorage.setItem("companyCity", importedData.companyCity);
        if (importedData.companyAccountNumber)
          localStorage.setItem(
            "companyAccountNumber",
            importedData.companyAccountNumber
          );
        if (importedData.companyOIB)
          localStorage.setItem("companyOIB", importedData.companyOIB);
        if (importedData.companyPhone)
          localStorage.setItem("companyPhone", importedData.companyPhone);
        if (importedData.vatNote)
          localStorage.setItem("vatNote", importedData.vatNote);
        if (importedData.mbo) localStorage.setItem("mbo", importedData.mbo);
        if (importedData.customers)
          localStorage.setItem("savedCustomers", importedData.customers);
        if (importedData.invoiceNumberSettings)
          localStorage.setItem(
            "invoice-number-settings",
            importedData.invoiceNumberSettings
          );

        showToast("Podatci su uspješno uvezeni.", "success");

        // Update local state if company data was imported
        if (importedData.companyName) {
          setCompanyName(importedData.companyName);
        }
        if (importedData.companyLogo) {
          setCompanyLogo(importedData.companyLogo);
        }
        if (importedData.companyFullName) {
          setCompanyFullName(importedData.companyFullName);
        }
        if (importedData.invoiceIssuer) {
          setInvoiceIssuer(importedData.invoiceIssuer);
        }
        if (importedData.mjesto) {
          setMjesto(importedData.mjesto);
        }
        if (importedData.bankName) {
          setBankName(importedData.bankName);
        }
        if (importedData.companyStreet) {
          setCompanyStreet(importedData.companyStreet);
        }
        if (importedData.companyHouseNumber) {
          setCompanyHouseNumber(importedData.companyHouseNumber);
        }
        if (importedData.companyPostalCode) {
          setCompanyPostalCode(importedData.companyPostalCode);
        }
        if (importedData.companyCity) {
          setCompanyCity(importedData.companyCity);
        }
        if (importedData.companyAccountNumber) {
          setCompanyAccountNumber(importedData.companyAccountNumber);
        }
        if (importedData.companyOIB) {
          setCompanyOIB(importedData.companyOIB);
        }
        if (importedData.companyPhone) {
          setCompanyPhone(importedData.companyPhone);
        }
        if (importedData.vatNote) {
          setVatNote(importedData.vatNote);
        }
        if (importedData.mbo) {
          setMbo(importedData.mbo);
        }
        if (importedData.customers) {
          setCustomers(getCustomers());
        }
        if (importedData.invoiceNumberSettings) {
          setInvoiceNumberSettings(getInvoiceNumberSettings());
        }
      } catch (error) {
        showToast(
          "Došlo je do greške prilikom uvoza podataka. Provjerite je li datoteka ispravna.",
          "error"
        );
      }
    };
    reader.readAsText(file);
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    localStorage.setItem("companyName", value);

    // Update invoice generator data if it exists
    const invoiceData = localStorage.getItem("invoiceGeneratorData");
    if (invoiceData) {
      try {
        const parsedData = JSON.parse(invoiceData);
        parsedData.formData.imeFirme = value;
        localStorage.setItem(
          "invoiceGeneratorData",
          JSON.stringify(parsedData)
        );
      } catch (error) {
        console.error("Error updating invoice data:", error);
      }
    }

    // Update barcode generator data if it exists
    const barcodeData = localStorage.getItem("barcodeGeneratorData");
    if (barcodeData) {
      try {
        const parsedData = JSON.parse(barcodeData);
        parsedData.formData.Primatelj = value;
        localStorage.setItem(
          "barcodeGeneratorData",
          JSON.stringify(parsedData)
        );
      } catch (error) {
        console.error("Error updating barcode data:", error);
      }
    }

    showToast("Naziv obrta je uspješno spremljen.", "success");
  };

  const handleBankNameChange = (value: string) => {
    setBankName(value);
    localStorage.setItem("bankName", value);
    showToast("Naziv banke je uspješno spremljen.", "success");
  };

  const handleCompanyFullNameChange = (value: string) => {
    setCompanyFullName(value);
    localStorage.setItem("companyFullName", value);
    showToast("Dugi naziv obrta je uspješno spremljen.", "success");
  };

  const handleInvoiceIssuerChange = (value: string) => {
    setInvoiceIssuer(value);
    localStorage.setItem("invoiceIssuer", value);
    showToast("Račun izradio je uspješno spremljen.", "success");
  };

  const handleMjestoChange = (value: string) => {
    setMjesto(value);
    localStorage.setItem("mjesto", value);
    showToast("Mjesto je uspješno spremljeno.", "success");
  };

  const handleCompanyStreetChange = (value: string) => {
    setCompanyStreet(value);
    localStorage.setItem("companyStreet", value);
    showToast("Ulica je uspješno spremljena.", "success");
  };

  const handleCompanyHouseNumberChange = (value: string) => {
    setCompanyHouseNumber(value);
    localStorage.setItem("companyHouseNumber", value);
    showToast("Kućni broj je uspješno spremljen.", "success");
  };

  const handleCompanyPostalCodeChange = (value: string) => {
    setCompanyPostalCode(value);
    localStorage.setItem("companyPostalCode", value);
    showToast("Poštanski broj je uspješno spremljen.", "success");
  };

  const handleCompanyCityChange = (value: string) => {
    setCompanyCity(value);
    localStorage.setItem("companyCity", value);
    showToast("Grad je uspješno spremljen.", "success");
  };

  const handleCompanyAccountNumberChange = (value: string) => {
    setCompanyAccountNumber(value);
    localStorage.setItem("companyAccountNumber", value);
    showToast("Broj računa obrta je uspješno spremljen.", "success");
  };

  const handleCompanyOIBChange = (value: string) => {
    const formattedValue = formatOIB(value);
    setCompanyOIB(formattedValue);

    if (formattedValue.length === 11) {
      const validation = validateOIB(formattedValue);
      if (validation.isValid) {
        localStorage.setItem("companyOIB", formattedValue);
        showToast("OIB obrta je uspješno spremljen.", "success");
      } else {
        showToast(validation.error || "OIB nije ispravan", "error");
      }
    } else if (formattedValue.length > 0) {
      showToast("OIB mora sadržavati točno 11 znamenki", "error");
    } else {
      localStorage.setItem("companyOIB", formattedValue);
      // No message needed for empty OIB
    }
  };

  const handleCompanyPhoneChange = (value: string) => {
    setCompanyPhone(value);
    localStorage.setItem("companyPhone", value);
    showToast("Broj telefona obrta je uspješno spremljen.", "success");
  };

  const handleVatNoteChange = (value: string) => {
    setVatNote(value);
    localStorage.setItem("vatNote", value);
    showToast("Napomena je uspješno spremljena.", "success");
  };

  const handleMboChange = (value: string) => {
    setMbo(value);
    localStorage.setItem("mbo", value);
    showToast("MBO je uspješno spremljen.", "success");
  };

  // Invoice number settings handlers
  const handleAutomaticNumberingToggle = (enabled: boolean) => {
    const newSettings = {
      ...invoiceNumberSettings,
      useAutomaticNumbering: enabled,
    };
    setInvoiceNumberSettings(newSettings);
    saveInvoiceNumberSettings(newSettings);
    showToast(
      enabled
        ? "Automatsko numeriranje računa je uključeno."
        : "Automatsko numeriranje računa je isključeno.",
      "success"
    );
  };

  const handleRedniBrojChange = (value: string) => {
    const newSettings = {
      ...invoiceNumberSettings,
      redniBrojZadnjegRacuna: value,
    };
    setInvoiceNumberSettings(newSettings);
    saveInvoiceNumberSettings(newSettings);
    showToast("Redni broj zadnjeg računa je uspješno spremljen.", "success");
  };

  const handleOznakaPoslovnogProstoraChange = (value: string) => {
    const newSettings = {
      ...invoiceNumberSettings,
      oznakaPoslovnogProstora: value,
    };
    setInvoiceNumberSettings(newSettings);
    saveInvoiceNumberSettings(newSettings);
    showToast("Oznaka poslovnog prostora je uspješno spremljena.", "success");
  };

  const handleOznakaNaplatnogUredajaChange = (value: string) => {
    const newSettings = {
      ...invoiceNumberSettings,
      oznakaNaplatnogUredaja: value,
    };
    setInvoiceNumberSettings(newSettings);
    saveInvoiceNumberSettings(newSettings);
    showToast("Oznaka naplatnog uređaja je uspješno spremljena.", "success");
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      showToast("Molimo odaberite sliku (JPG, PNG, GIF).", "error");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Slika je prevelika. Maksimalna veličina je 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoData = e.target?.result as string;
      setCompanyLogo(logoData);
      localStorage.setItem("companyLogo", logoData);
      showToast("Logo je uspješno učitan.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo("");
    localStorage.removeItem("companyLogo");
    showToast("Logo je uklonjen.", "success");
  };

  const handleClearCustomers = () => {
    if (clearCustomers()) {
      setCustomers([]);
      showToast("Svi kupci su obrisani.", "success");
    } else {
      showToast("Došlo je do greške prilikom brisanja kupaca.", "error");
    }
  };

  const handleClearCompanyData = () => {
    setCompanyName("");
    setCompanyFullName("");
    setInvoiceIssuer("");
    setMjesto("");
    setCompanyLogo("");
    setBankName("");
    setCompanyStreet("");
    setCompanyHouseNumber("");
    setCompanyPostalCode("");
    setCompanyCity("");
    setCompanyAccountNumber("");
    setCompanyOIB("");
    setCompanyPhone("");
    setVatNote(
      "PDV nije obračunat sukladno članku 90. stavku 1. i stavku 2. Zakona o PDV-u - mali porezni obveznik."
    );
    setMbo("");
    setCustomers([]);
    setInvoiceNumberSettings({
      useAutomaticNumbering: false,
      redniBrojZadnjegRacuna: "00",
      oznakaPoslovnogProstora: "01",
      oznakaNaplatnogUredaja: new Date().getFullYear().toString().slice(-2),
    });
    localStorage.removeItem("companyName");
    localStorage.removeItem("companyFullName");
    localStorage.removeItem("invoiceIssuer");
    localStorage.removeItem("mjesto");
    localStorage.removeItem("companyLogo");
    localStorage.removeItem("bankName");
    localStorage.removeItem("companyStreet");
    localStorage.removeItem("companyHouseNumber");
    localStorage.removeItem("companyPostalCode");
    localStorage.removeItem("companyCity");
    localStorage.removeItem("companyAccountNumber");
    localStorage.removeItem("companyOIB");
    localStorage.removeItem("companyPhone");
    localStorage.removeItem("vatNote");
    localStorage.removeItem("mbo");
    localStorage.removeItem("savedCustomers");
    localStorage.removeItem("invoice-number-settings");

    // Update invoice generator data if it exists
    const invoiceData = localStorage.getItem("invoiceGeneratorData");
    if (invoiceData) {
      try {
        const parsedData = JSON.parse(invoiceData);
        parsedData.formData.imeFirme = "";
        localStorage.setItem(
          "invoiceGeneratorData",
          JSON.stringify(parsedData)
        );
      } catch (error) {
        console.error("Error updating invoice data:", error);
      }
    }

    // Update barcode generator data if it exists
    const barcodeData = localStorage.getItem("barcodeGeneratorData");
    if (barcodeData) {
      try {
        const parsedData = JSON.parse(barcodeData);
        parsedData.formData.Primatelj = "";
        localStorage.setItem(
          "barcodeGeneratorData",
          JSON.stringify(parsedData)
        );
      } catch (error) {
        console.error("Error updating barcode data:", error);
      }
    }

    showToast("Podatci o obrtu su obrisani.", "success");
  };

  const getStorageInfo = () => {
    const totalSize = new Blob(Object.values(localStorage)).size;
    const itemCount = localStorage.length;
    return { totalSize, itemCount };
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Postavke obrta
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Upravljanje kupcima
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Upravljanje podatcima
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Informacije o aplikaciji
          </TabsTrigger>
        </TabsList>

        {/* Postavke obrta */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Postavke obrta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Osnovne postavke */}
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  onClick={() =>
                    setIsOtherSettingsExpanded(!isOtherSettingsExpanded)
                  }
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Osnovne postavke
                  </h3>
                  {isOtherSettingsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {isOtherSettingsExpanded && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-full-name">
                        Dugi naziv obrta
                      </Label>
                      <Input
                        id="company-full-name"
                        value={companyFullName}
                        onChange={(e) =>
                          handleCompanyFullNameChange(e.target.value)
                        }
                        placeholder="npr. Ime Obrta, vl. Mate Matic"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Pun naziv obrta koji će se koristiti u PDF računima i
                        prilikom generiranja barkoda
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-account-number">
                        Broj računa obrta
                      </Label>
                      <Input
                        id="company-account-number"
                        value={companyAccountNumber}
                        onChange={(e) =>
                          handleCompanyAccountNumberChange(e.target.value)
                        }
                        placeholder="npr. HR1234567890123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-oib">OIB obrta</Label>
                      <Input
                        id="company-oib"
                        value={companyOIB}
                        onChange={(e) => handleCompanyOIBChange(e.target.value)}
                        placeholder="npr. 12345678901"
                      />{" "}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-street">Ulica</Label>
                        <Input
                          id="company-street"
                          value={companyStreet}
                          onChange={(e) =>
                            handleCompanyStreetChange(e.target.value)
                          }
                          placeholder="npr. Ilica"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-house-number">Kućni broj</Label>
                        <Input
                          id="company-house-number"
                          value={companyHouseNumber}
                          onChange={(e) =>
                            handleCompanyHouseNumberChange(e.target.value)
                          }
                          placeholder="npr. 123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-postal-code">
                          Poštanski broj
                        </Label>
                        <Input
                          id="company-postal-code"
                          value={companyPostalCode}
                          onChange={(e) =>
                            handleCompanyPostalCodeChange(e.target.value)
                          }
                          placeholder="npr. 10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-city">Grad</Label>
                        <Input
                          id="company-city"
                          value={companyCity}
                          onChange={(e) =>
                            handleCompanyCityChange(e.target.value)
                          }
                          placeholder="npr. Zagreb"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Postavke generiranog računa */}
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  onClick={() =>
                    setIsInvoiceSettingsExpanded(!isInvoiceSettingsExpanded)
                  }
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Postavke generiranog računa (PDF prikaz)
                  </h3>
                  {isInvoiceSettingsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {isInvoiceSettingsExpanded && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/* Automatic Invoice Number Settings */}
                      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="automatic-numbering">
                              Automatsko numeriranje računa
                            </Label>
                            <Switch
                              id="automatic-numbering"
                              checked={
                                invoiceNumberSettings.useAutomaticNumbering
                              }
                              onCheckedChange={handleAutomaticNumberingToggle}
                            />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Omogućava automatsko generiranje broja računa u
                            formatu: redni broj - oznaka poslovnog prostora -
                            oznaka naplatnog uređaja
                          </p>
                        </div>

                        {invoiceNumberSettings.useAutomaticNumbering && (
                          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="space-y-2">
                              <Label htmlFor="redni-broj">
                                Redni broj zadnjeg računa
                              </Label>
                              <Input
                                id="redni-broj"
                                value={
                                  invoiceNumberSettings.redniBrojZadnjegRacuna
                                }
                                onChange={(e) =>
                                  handleRedniBrojChange(e.target.value)
                                }
                                placeholder="00"
                              />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Broj koji će se koristiti kao osnova za sljedeći
                                račun (automatski se povećava)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="oznaka-poslovnog-prostora">
                                Oznaka poslovnog prostora
                              </Label>
                              <Input
                                id="oznaka-poslovnog-prostora"
                                value={
                                  invoiceNumberSettings.oznakaPoslovnogProstora
                                }
                                onChange={(e) =>
                                  handleOznakaPoslovnogProstoraChange(
                                    e.target.value
                                  )
                                }
                                placeholder="01"
                              />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Oznaka poslovnog prostora (obično 01 ukoliko nemate više poslovnih prostora)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="oznaka-naplatnog-uredaja">
                                Oznaka naplatnog uređaja
                              </Label>
                              <Input
                                id="oznaka-naplatnog-uredaja"
                                value={
                                  invoiceNumberSettings.oznakaNaplatnogUredaja
                                }
                                onChange={(e) =>
                                  handleOznakaNaplatnogUredajaChange(
                                    e.target.value
                                  )
                                }
                                placeholder="25"
                              />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Oznaka naplatnog uređaja (obično zadnje dvije
                                znamenke godine ukoliko nemate naplatni uređaj)
                              </p>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Sljedeći broj računa:</strong>{" "}
                                {(
                                  parseInt(
                                    invoiceNumberSettings.redniBrojZadnjegRacuna
                                  ) + 1
                                )
                                  .toString()
                                  .padStart(2, "0")}
                                -{invoiceNumberSettings.oznakaPoslovnogProstora}
                                -{invoiceNumberSettings.oznakaNaplatnogUredaja}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Label>Logo obrta</Label>
                      {companyLogo ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Image
                              src={companyLogo}
                              alt="Company Logo"
                              width={128}
                              height={64}
                              className="h-16 w-auto max-w-32 object-contain border rounded"
                            />
                            <Button
                              onClick={handleRemoveLogo}
                              variant="outline"
                              size="sm"
                            >
                              Ukloni logo
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Logo je učitan i bit će prikazan u PDF računima
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="logo-upload">Učitaj logo</Label>
                            <div className="mt-2">
                              <Input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="border-0 cursor-pointer file:cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:flex file:items-center file:justify-center file:my-0.5"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Podržani formati: JPG, PNG, GIF. Maksimalna
                            veličina: 2MB
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-name">Naziv obrta</Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) =>
                          handleCompanyNameChange(e.target.value)
                        }
                        placeholder="Unesite naziv vašeg obrta"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kratki naziv koji će se prikazati ispod loga
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice-issuer">Račun izradio</Label>
                      <Input
                        id="invoice-issuer"
                        value={invoiceIssuer}
                        onChange={(e) =>
                          handleInvoiceIssuerChange(e.target.value)
                        }
                        placeholder="npr. Mate Matic"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ime osobe koja je izdala račun
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mjesto">Mjesto</Label>
                      <Input
                        id="mjesto"
                        value={mjesto}
                        onChange={(e) =>
                          handleMjestoChange(e.target.value)
                        }
                        placeholder="npr. Split"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Mjesto u kojem je račun izrađen
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-phone">Broj telefona obrta</Label>
                      <Input
                        id="company-phone"
                        value={companyPhone}
                        onChange={(e) =>
                          handleCompanyPhoneChange(e.target.value)
                        }
                        placeholder="npr. +385 1 2345 678"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Broj telefona koji će se prikazati u računu
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vat-note">Napomena</Label>
                      <Textarea
                        id="vat-note"
                        value={vatNote}
                        onChange={(e) => handleVatNoteChange(e.target.value)}
                        placeholder="Unesite napomenu koja će se prikazati u PDF računima"
                        rows={3}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Napomena koja će se prikazati u računu ispod popisa
                        stavki
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mbo">Matični broj obrta</Label>
                      <Input
                        id="mbo"
                        value={mbo}
                        onChange={(e) => handleMboChange(e.target.value)}
                        placeholder="npr. 12345678"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Matični broj obrta koji će se prikazati u računu
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Naziv banke</Label>
                      <Input
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => handleBankNameChange(e.target.value)}
                        placeholder="npr. Otp Banka d.d."
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Naziv banke koji će se prikazati u zaglavlju računa
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setShowConfirmDeleteCompany(true)}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Obriši podatke o obrtu
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upravljanje kupcima */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Upravljanje kupcima
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Spremljeni kupci</Label>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>Broj kupaca: {customers.length}</p>
                  <p>Kupci se automatski spremaju kada generirate račun</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setShowConfirmDeleteCustomers(true)}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Obriši sve kupce
                </Button>
              </div>

              {customers.length > 0 && (
                <div className="space-y-2">
                  <Label>Lista kupaca</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {customer.address}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {customer.postalCode} {customer.city}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          OIB: {customer.oib}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upravljanje podatcima */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Upravljanje podatcima aplikacije
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Informacije o pohranjenim podatcima</Label>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>Broj stavki: {storageInfo.itemCount}</p>
                  <p>
                    Ukupna veličina: {(storageInfo.totalSize / 1024).toFixed(2)}{" "}
                    KB
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Eksportiraj podatke
                </Button>

                <div>
                  <Label htmlFor="import-data">Uvezi podatke</Label>
                  <Input
                    id="import-data"
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => setShowConfirmDelete(true)}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Obriši sve podatke
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Informacije o aplikaciji */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informacije o aplikaciji
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Verzija aplikacije</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  1.0.0
                </p>
              </div>

              <div className="space-y-2">
                <Label>Funkcionalnosti</Label>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-3 w-3" />
                    <span>Generiranje PDF417 barkodova</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span>Generiranje PDF računa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    <span>Povijest generiranih stavki</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Podržani formati</Label>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>• PDF417 barkodovi</p>
                  <p>• PDF računi</p>
                  <p>• JSON backup datoteke</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Način prikaza</Label>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Promijenite između svijetlog i tamnog načina rada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title="Potvrda brisanja"
        message="Jeste li sigurni da želite obrisati sve podatke? Ova akcija se ne može poništiti."
        confirmText="Da, obriši sve"
        onConfirm={handleClearAllData}
      />

      <ConfirmationDialog
        open={showConfirmDeleteCustomers}
        onOpenChange={setShowConfirmDeleteCustomers}
        title="Potvrda brisanja kupaca"
        message="Jeste li sigurni da želite obrisati sve kupce? Ova akcija se ne može poništiti."
        confirmText="Da, obriši sve kupce"
        onConfirm={handleClearCustomers}
      />

      <ConfirmationDialog
        open={showConfirmDeleteCompany}
        onOpenChange={setShowConfirmDeleteCompany}
        title="Potvrda brisanja podataka obrta"
        message="Jeste li sigurni da želite obrisati sve podatke o obrtu? Ova akcija se ne može poništiti."
        confirmText="Da, obriši podatke obrta"
        onConfirm={handleClearCompanyData}
      />
    </div>
  );
}
