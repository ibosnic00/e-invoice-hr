"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronUp } from "lucide-react"

// Mock types and utilities for demonstration
interface InvoiceData {
  imeFirme: string
  adresaVlasnika: string
  postanskiBrojIGradVlasnika: string
  oibVlasnika: string
  brojMobitelaVlasnika: string
  imeKupca: string
  adresaKupca: string
  postanskiBrojIGradKupca: string
  oibKupca: string
  mjestoIDatumIzdavanja: string
  vrijemeIzdavanja: string
  mjestoIDatumIsporuke: string
  datumPlacanja: string
  items: Array<{
    id: string
    nazivRobeUsluge: string
    kolicina: number
    cijenaPoJedinici: number
  }>
  brojRacunaObrta: string
  brojRacuna: string
  pozivNaBroj: string
  model: string
}

// Mock utility functions
const formatAmountForDisplay = (amount: number) => (amount / 100).toFixed(2).replace(".", ",")
const parseAmountFromDisplay = (display: string) => Math.round(Number.parseFloat(display.replace(",", ".")) * 100)
const formatOIB = (oib: string) => oib.replace(/\D/g, "").slice(0, 11)
const validateOIB = (oib: string) => oib.length === 11
const PaymentModels = [{ model: "00" }, { model: "01" }, { model: "02" }]

// Import the actual PDFPreview component
import { PDFPreview } from "./pdf-preview"

// Import storage utilities
import { saveToHistory } from "../utils/storage"
import { saveCustomer } from "../utils/customerStorage"

import CustomerInputWithSelector from "./customer-input-with-selector"

// Import the actual PDF generation utility
import { generatePDF } from "../utils/pdfGeneration"
import RecentItems from "./recent-items"
import { useToast } from "@/components/ui/toast"

export interface InvoiceGeneratorRef {
  loadData: (data: InvoiceData) => void
}

const InvoiceGenerator = forwardRef<InvoiceGeneratorRef, {}>((props, ref) => {
  const { showToast } = useToast()
  
  // Helper function to safely get localStorage value
  const getLocalStorageValue = (key: string, defaultValue = "") => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key) || defaultValue
    }
    return defaultValue
  }

  const [formData, setFormData] = useState<InvoiceData>({
    imeFirme: getLocalStorageValue("companyName"),
    adresaVlasnika: "",
    postanskiBrojIGradVlasnika: "",
    oibVlasnika: "",
    brojMobitelaVlasnika: "",
    imeKupca: "",
    adresaKupca: "",
    postanskiBrojIGradKupca: "",
    oibKupca: "",
    mjestoIDatumIzdavanja: new Date().toLocaleDateString("hr-HR"),
    vrijemeIzdavanja: new Date().toLocaleTimeString("hr-HR"),
    mjestoIDatumIsporuke: new Date().toLocaleDateString("hr-HR"),
    datumPlacanja: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("hr-HR"),
    items: [{
      id: "1",
      nazivRobeUsluge: "",
      kolicina: 1,
      cijenaPoJedinici: 0
    }],
    brojRacunaObrta: "",
    brojRacuna: "",
    pozivNaBroj: "",
    model: "00",
  })

  const [errors, setErrors] = useState<string[]>([])
  const [priceDisplay, setPriceDisplay] = useState<string>("")
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false)
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(false)
  const [isDataLoadedFromHistory, setIsDataLoadedFromHistory] = useState(false)
  const [itemPriceDisplays, setItemPriceDisplays] = useState<{ [key: string]: string }>({})

  // Expose loadData method to parent component
  useImperativeHandle(ref, () => ({
    loadData: (data: InvoiceData) => {
      // Handle backward compatibility - convert old single item structure to new items structure
      let processedData = data
      
      if (!data.items && (data as any).nazivRobeUsluge) {
        // Convert old structure to new structure
        processedData = {
          ...data,
          items: [{
            id: "1",
            nazivRobeUsluge: (data as any).nazivRobeUsluge,
            kolicina: (data as any).kolicina || 1,
            cijenaPoJedinici: (data as any).cijenaPoJedinici || 0
          }]
        }
      }
      
      setFormData(processedData)
      
      // Initialize price displays for items
      if (processedData.items) {
        const displays: { [key: string]: string } = {}
        processedData.items.forEach(item => {
          displays[item.id] = formatAmountForDisplay(item.cijenaPoJedinici)
        })
        setItemPriceDisplays(displays)
      }
      
      // Mark that data was loaded from history to prevent localStorage override
      setIsDataLoadedFromHistory(true)
    },
  }), [])

  // Load saved data on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && !isDataLoadedFromHistory) {
      const savedData = localStorage.getItem("invoiceGeneratorData")

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          
          // Handle backward compatibility for localStorage data
          let formDataToSet = parsedData.formData
          if (!formDataToSet.items && (formDataToSet as any).nazivRobeUsluge) {
            // Convert old structure to new structure
            formDataToSet = {
              ...formDataToSet,
              items: [{
                id: "1",
                nazivRobeUsluge: (formDataToSet as any).nazivRobeUsluge,
                kolicina: (formDataToSet as any).kolicina || 1,
                cijenaPoJedinici: (formDataToSet as any).cijenaPoJedinici || 0
              }]
            }
          }
          
          setFormData(formDataToSet)
          
          // Initialize price displays for items
          if (formDataToSet.items) {
            const displays: { [key: string]: string } = {}
            formDataToSet.items.forEach((item: any) => {
              displays[item.id] = formatAmountForDisplay(item.cijenaPoJedinici)
            })
            setItemPriceDisplays(displays)
          }
          
          setPriceDisplay(parsedData.priceDisplay || "")
          setItemPriceDisplays(parsedData.itemPriceDisplays || {})
        } catch (error) {
          console.error("Error loading saved invoice data:", error)
        }
      } else {
        // Generate default invoice number for new forms
        const currentDate = new Date()
        const year = currentDate.getFullYear().toString().slice(-2)
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0")
        const invoiceNumber = `1-${month}-${year}`

        setFormData((prev) => ({
          ...prev,
          brojRacuna: invoiceNumber,
        }))
      }
    }
  }, [isDataLoadedFromHistory])

  // Save data to localStorage whenever formData, priceDisplay, or itemPriceDisplays changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const dataToSave = {
        formData,
        priceDisplay,
        itemPriceDisplays,
      }
      localStorage.setItem("invoiceGeneratorData", JSON.stringify(dataToSave))
    }
  }, [formData, priceDisplay, itemPriceDisplays])

  // Listen for company name changes in settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = () => {
        const newCompanyName = localStorage.getItem("companyName") || ""
        if (newCompanyName !== formData.imeFirme) {
          setFormData((prev) => ({
            ...prev,
            imeFirme: newCompanyName,
          }))
        }
      }

      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [formData.imeFirme])

  // Auto-fill address and postal code from settings
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && !isDataLoadedFromHistory) {
      const companyStreet = localStorage.getItem("companyStreet") || ""
      const companyHouseNumber = localStorage.getItem("companyHouseNumber") || ""
      const companyPostalCode = localStorage.getItem("companyPostalCode") || ""
      const companyCity = localStorage.getItem("companyCity") || ""
      const companyAccountNumber = localStorage.getItem("companyAccountNumber") || ""
      const companyOIB = localStorage.getItem("companyOIB") || ""
      const companyPhone = localStorage.getItem("companyPhone") || ""

      // Combine street and house number for address
      const fullAddress =
        companyStreet && companyHouseNumber
          ? `${companyStreet} ${companyHouseNumber}`.trim()
          : companyStreet || companyHouseNumber

      // Combine postal code and city
      const fullPostalCode =
        companyPostalCode && companyCity
          ? `${companyPostalCode} ${companyCity}`.trim()
          : companyPostalCode || companyCity

      setFormData((prev) => ({
        ...prev,
        adresaVlasnika: fullAddress,
        postanskiBrojIGradVlasnika: fullPostalCode,
        brojRacunaObrta: companyAccountNumber,
        oibVlasnika: companyOIB,
        brojMobitelaVlasnika: companyPhone,
      }))
    }
  }, [isDataLoadedFromHistory])

  // Listen for address changes in settings
  useEffect(() => {
    if (typeof window !== "undefined" && !isDataLoadedFromHistory) {
      const handleAddressStorageChange = () => {
        const companyStreet = localStorage.getItem("companyStreet") || ""
        const companyHouseNumber = localStorage.getItem("companyHouseNumber") || ""
        const companyPostalCode = localStorage.getItem("companyPostalCode") || ""
        const companyCity = localStorage.getItem("companyCity") || ""
        const companyAccountNumber = localStorage.getItem("companyAccountNumber") || ""
        const companyOIB = localStorage.getItem("companyOIB") || ""
        const companyPhone = localStorage.getItem("companyPhone") || ""

        // Combine street and house number for address
        const fullAddress =
          companyStreet && companyHouseNumber
            ? `${companyStreet} ${companyHouseNumber}`.trim()
            : companyStreet || companyHouseNumber

        // Combine postal code and city
        const fullPostalCode =
          companyPostalCode && companyCity
            ? `${companyPostalCode} ${companyCity}`.trim()
            : companyPostalCode || companyCity

        setFormData((prev) => ({
          ...prev,
          adresaVlasnika: fullAddress,
          postanskiBrojIGradVlasnika: fullPostalCode,
          brojRacunaObrta: companyAccountNumber,
          oibVlasnika: companyOIB,
          brojMobitelaVlasnika: companyPhone,
        }))
      }

      window.addEventListener("storage", handleAddressStorageChange)
      return () => window.removeEventListener("storage", handleAddressStorageChange)
    }
  }, [isDataLoadedFromHistory])

  const handleInputChange = (field: keyof InvoiceData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setErrors([])
    // Reset the flag when user manually changes data
    setIsDataLoadedFromHistory(false)
  }

  // Validate poziv na broj to only allow numeric characters (0-9)
  const handlePozivNaBrojChange = (value: string) => {
    // Only allow numeric characters (0-9)
    const numericOnly = value.replace(/[^0-9]/g, "")
    handleInputChange("pozivNaBroj", numericOnly)
  }

  // Automatski popuni poziv na broj kada se unese broj računa
  const handleBrojRacunaChange = (value: string) => {
    // Only allow numeric characters, hyphens, and forward slashes
    const cleaned = value.replace(/[^0-9\-/]/g, "")
    handleInputChange("brojRacuna", cleaned)
    
    // Automatically populate poziv na broj with the broj računa value (numeric only)
    if (cleaned) {
      const numericOnly = cleaned.replace(/[^0-9]/g, "")
      handleInputChange("pozivNaBroj", numericOnly)
    }
  }

  const handleOIBVlasnikaChange = (value: string) => {
    const formattedValue = formatOIB(value)
    handleInputChange("oibVlasnika", formattedValue)
  }

  const handleOIBKupcaChange = (value: string) => {
    const formattedValue = formatOIB(value)
    handleInputChange("oibKupca", formattedValue)
  }

  const handlePriceChange = (displayValue: string) => {
    // Remove all non-digit characters except comma and dot
    const cleaned = displayValue.replace(/[^\d,.]/g, "")

    let formattedValue = displayValue

    // If user entered a decimal separator (comma or dot), keep their format
    if (cleaned.includes(",") || cleaned.includes(".")) {
      // User explicitly entered decimal format, keep as is
      formattedValue = cleaned.replace(".", ",") // Convert dots to commas
    } else {
      // User entered only digits, keep as is without adding ",00"
      formattedValue = cleaned
    }

    setPriceDisplay(formattedValue)

    // Convert display value to numeric amount
    const numericPrice = parseAmountFromDisplay(formattedValue)

    setFormData((prev) => ({
      ...prev,
      cijenaPoJedinici: numericPrice,
    }))
    setErrors([])
  }

  // Add ",00" when input loses focus if user entered only digits
  const handlePriceBlur = () => {
    if (priceDisplay) {
      const parsedAmount = parseAmountFromDisplay(priceDisplay)
      if (!isNaN(parsedAmount)) {
        setFormData(prev => ({
          ...prev,
          cijenaPoJedinici: parsedAmount
        }))
        setPriceDisplay(formatAmountForDisplay(parsedAmount))
      }
    }
  }

  // Functions for handling multiple items
  const addItem = () => {
    const newId = (formData.items.length + 1).toString()
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: newId,
        nazivRobeUsluge: "",
        kolicina: 1,
        cijenaPoJedinici: 0
      }]
    }))
  }

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }))
      // Remove price display for this item
      setItemPriceDisplays(prev => {
        const newDisplays = { ...prev }
        delete newDisplays[itemId]
        return newDisplays
      })
    }
  }

  const updateItem = (itemId: string, field: keyof typeof formData.items[0], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleItemPriceChange = (itemId: string, displayValue: string) => {
    setItemPriceDisplays(prev => ({
      ...prev,
      [itemId]: displayValue
    }))
  }

  const handleItemPriceBlur = (itemId: string) => {
    const displayValue = itemPriceDisplays[itemId]
    if (displayValue) {
      const parsedAmount = parseAmountFromDisplay(displayValue)
      if (!isNaN(parsedAmount)) {
        updateItem(itemId, "cijenaPoJedinici", parsedAmount)
        setItemPriceDisplays(prev => ({
          ...prev,
          [itemId]: formatAmountForDisplay(parsedAmount)
        }))
      }
    }
  }

  const handleGenerateInvoice = async () => {
    try {
      // Validate items
      const validationErrors: string[] = []
      
      if (!formData.items || formData.items.length === 0) {
        validationErrors.push("Dodajte barem jednu stavku računa")
      } else {
        formData.items.forEach((item, index) => {
          if (!item.nazivRobeUsluge.trim()) {
            validationErrors.push(`Stavka ${index + 1}: Naziv robe/usluge je obavezan`)
          }
          if (item.kolicina <= 0) {
            validationErrors.push(`Stavka ${index + 1}: Količina mora biti veća od 0`)
          }
          if (item.cijenaPoJedinici <= 0) {
            validationErrors.push(`Stavka ${index + 1}: Cijena po jedinici mora biti veća od 0`)
          }
        })
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }

      // Generate invoice number if not set
      if (!formData.brojRacuna) {
        const currentDate = new Date()
        const year = currentDate.getFullYear().toString().slice(-2)
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0")
        const invoiceNumber = `1-${month}-${year}`

        setFormData((prev) => ({
          ...prev,
          brojRacuna: invoiceNumber,
        }))
      }

      // Set poziv na broj to broj računa if not already set
      if (!formData.pozivNaBroj && formData.brojRacuna) {
        setFormData((prev) => ({
          ...prev,
          pozivNaBroj: formData.brojRacuna,
        }))
      }

      // Show PDF preview popup
      setShowPdfPreview(true)
      setErrors([])
    } catch (error) {
      console.error("Error generating invoice:", error)
      setErrors(["Došlo je do greške tijekom generiranja računa"])
    }
  }

  const handleSavePdf = async () => {
    try {
      await generatePDF(formData)
      // Save to history
      const historyItem = {
        type: "invoice" as const,
        data: formData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      }
      saveToHistory(historyItem)

      // Save customer data
      if (formData.imeKupca) {
        saveCustomer({
          name: formData.imeKupca,
          address: formData.adresaKupca,
          postalCode: formData.postanskiBrojIGradKupca.split(" ")[0] || "",
          city: formData.postanskiBrojIGradKupca.split(" ").slice(1).join(" ") || "",
          oib: formData.oibKupca || "",
        })
      }

      setShowPdfPreview(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setErrors(["Došlo je do greške tijekom generiranja PDF-a"])
    }
  }

  const handleSelectCustomer = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      imeKupca: customer.name,
      adresaKupca: customer.address,
      postanskiBrojIGradKupca: `${customer.postalCode} ${customer.city}`.trim(),
      oibKupca: customer.oib,
    }))
  }

  const handleSaveCustomer = () => {
    if (formData.imeKupca) {
      saveCustomer({
        name: formData.imeKupca,
        address: formData.adresaKupca || "",
        postalCode: formData.postanskiBrojIGradKupca?.split(" ")[0] || "",
        city: formData.postanskiBrojIGradKupca?.split(" ").slice(1).join(" ") || "",
        oib: formData.oibKupca || "",
      })
    }
  }

  const handleResetForm = () => {
    // Get company data from settings to preserve auto-filled fields
    const companyName = getLocalStorageValue("companyName")
    const companyStreet = getLocalStorageValue("companyStreet")
    const companyHouseNumber = getLocalStorageValue("companyHouseNumber")
    const companyPostalCode = getLocalStorageValue("companyPostalCode")
    const companyCity = getLocalStorageValue("companyCity")
    const companyAccountNumber = getLocalStorageValue("companyAccountNumber")
    const companyOIB = getLocalStorageValue("companyOIB")
    const companyPhone = getLocalStorageValue("companyPhone")

    // Combine street and house number for address
    const fullAddress =
      companyStreet && companyHouseNumber
        ? `${companyStreet} ${companyHouseNumber}`.trim()
        : companyStreet || companyHouseNumber

    // Combine postal code and city
    const fullPostalCode =
      companyPostalCode && companyCity ? `${companyPostalCode} ${companyCity}`.trim() : companyPostalCode || companyCity

    setFormData({
      imeFirme: companyName,
      adresaVlasnika: fullAddress,
      postanskiBrojIGradVlasnika: fullPostalCode,
      oibVlasnika: companyOIB,
      brojMobitelaVlasnika: companyPhone,
      imeKupca: "",
      adresaKupca: "",
      postanskiBrojIGradKupca: "",
      oibKupca: "",
      mjestoIDatumIzdavanja: new Date().toLocaleDateString("hr-HR"),
      vrijemeIzdavanja: new Date().toLocaleTimeString("hr-HR"),
      mjestoIDatumIsporuke: new Date().toLocaleDateString("hr-HR"),
      datumPlacanja: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("hr-HR"),
              items: [{
          id: "1",
          nazivRobeUsluge: "",
          kolicina: 1,
          cijenaPoJedinici: 0
        }],
      brojRacunaObrta: companyAccountNumber,
      brojRacuna: "",
      pozivNaBroj: "",
      model: "00",
    })

    setPriceDisplay("")
    setErrors([])
    setShowPdfPreview(false)
    setIsDataLoadedFromHistory(false)

    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("invoiceGeneratorData")
    }
  }

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.cijenaPoJedinici * item.kolicina), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Podatci obrta</CardTitle>
              {isCompanyInfoExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {isCompanyInfoExpanded && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="imeFirme">Naziv obrta *</Label>
                <Input
                  id="imeFirme"
                  value={formData.imeFirme}
                  onChange={(e) => handleInputChange("imeFirme", e.target.value)}
                  placeholder="Naziv vaše obrta"
                />
              </div>
              <div>
                <Label htmlFor="adresaVlasnika">Adresa</Label>
                <Input
                  id="adresaVlasnika"
                  value={formData.adresaVlasnika}
                  onChange={(e) => handleInputChange("adresaVlasnika", e.target.value)}
                  placeholder="Ulica i broj"
                />
              </div>
              <div>
                <Label htmlFor="postanskiBrojIGradVlasnika">Poštanski broj i grad</Label>
                <Input
                  id="postanskiBrojIGradVlasnika"
                  value={formData.postanskiBrojIGradVlasnika}
                  onChange={(e) => handleInputChange("postanskiBrojIGradVlasnika", e.target.value)}
                  placeholder="31000 Osijek"
                />
              </div>
              <div>
                <Label htmlFor="oibVlasnika">OIB</Label>
                <Input
                  id="oibVlasnika"
                  value={formData.oibVlasnika}
                  onChange={(e) => handleOIBVlasnikaChange(e.target.value)}
                  placeholder="12345678901"
                />
              </div>
              <div>
                <Label htmlFor="brojMobitelaVlasnika">Broj mobitela</Label>
                <Input
                  id="brojMobitelaVlasnika"
                  value={formData.brojMobitelaVlasnika}
                  onChange={(e) => handleInputChange("brojMobitelaVlasnika", e.target.value)}
                  placeholder="+385 91 234 5678"
                />
              </div>
              <div>
                <Label htmlFor="brojRacunaObrta">IBAN računa *</Label>
                <Input
                  id="brojRacunaObrta"
                  value={formData.brojRacunaObrta}
                  onChange={(e) => handleInputChange("brojRacunaObrta", e.target.value)}
                  placeholder="HR1234567890123456789"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsCustomerInfoExpanded(!isCustomerInfoExpanded)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Podatci kupca</CardTitle>
              {isCustomerInfoExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {isCustomerInfoExpanded && (
            <CardContent className="space-y-4">
              <CustomerInputWithSelector
                value={formData.imeKupca}
                onChange={(value) => handleInputChange("imeKupca", value)}
                onSelectCustomer={handleSelectCustomer}
                onSaveCustomer={handleSaveCustomer}
                label="Naziv kupca"
                placeholder="Naziv kupca"
                saveButtonText="Spremi kupca"
                saveButtonVariant="outline"
                saveButtonSize="sm"
              />
              <div>
                <Label htmlFor="adresaKupca">Adresa kupca</Label>
                <Input
                  id="adresaKupca"
                  value={formData.adresaKupca}
                  onChange={(e) => handleInputChange("adresaKupca", e.target.value)}
                  placeholder="Ulica i broj"
                />
              </div>
              <div>
                <Label htmlFor="postanskiBrojIGradKupca">Poštanski broj i grad</Label>
                <Input
                  id="postanskiBrojIGradKupca"
                  value={formData.postanskiBrojIGradKupca}
                  onChange={(e) => handleInputChange("postanskiBrojIGradKupca", e.target.value)}
                  placeholder="31000 Osijek"
                />
              </div>
              <div>
                <Label htmlFor="oibKupca">OIB kupca</Label>
                <Input
                  id="oibKupca"
                  value={formData.oibKupca}
                  onChange={(e) => handleOIBKupcaChange(e.target.value)}
                  placeholder="12345678901"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalji računa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="brojRacuna">Broj računa *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="brojRacuna"
                value={formData.brojRacuna}
                onChange={(e) => handleBrojRacunaChange(e.target.value)}
                placeholder="1-1-25"
              />
              <div className="relative group">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Pomoć za format broja računa"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="text-xs">
                    <p className="font-semibold mb-1">Format broja računa:</p>
                    <p>redni broj - oznaka poslovnog prostora - oznaka naplatnog uređaja</p>
                    <p className="mt-1">Primjeri: 1-1-25, 2-1-25, 3-1-25...</p>
                    <p className="mt-1 text-yellow-300">⚠️ Preporučuje se mijenjati samo prvi broj!</p>
                    <p className="mt-1 text-gray-300">Ako mijenjaš 2 broja može doći do zabuna.</p>
                    <p className="mt-1 text-gray-300">Ako ne posluješ s gotovinom/karticama, možeš sam odlučiti kako ćeš numerirati brojeve prema internom aktu.</p>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>

          

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Stavke računa</Label>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj stavku
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Stavka {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`nazivRobeUsluge-${item.id}`}>Naziv robe/usluge *</Label>
                    <Textarea
                      id={`nazivRobeUsluge-${item.id}`}
                      value={item.nazivRobeUsluge}
                      onChange={(e) => updateItem(item.id, "nazivRobeUsluge", e.target.value)}
                      placeholder="Opis proizvoda ili usluge"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`kolicina-${item.id}`}>Količina *</Label>
                      <Input
                        id={`kolicina-${item.id}`}
                        type="number"
                        min="1"
                        value={item.kolicina}
                        onChange={(e) => updateItem(item.id, "kolicina", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cijenaPoJedinici-${item.id}`}>Cijena po jedinici (EUR) *</Label>
                      <Input
                        id={`cijenaPoJedinici-${item.id}`}
                        type="text"
                        value={itemPriceDisplays[item.id] || formatAmountForDisplay(item.cijenaPoJedinici)}
                        onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                        onBlur={() => handleItemPriceBlur(item.id)}
                        placeholder="0,00"
                        className="font-mono"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-500">Unesite iznos u EUR</p>
                        {item.cijenaPoJedinici > 0 && (
                          <p className="text-sm text-blue-600 font-medium">
                            {formatAmountForDisplay(item.cijenaPoJedinici)} EUR
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Ukupno (EUR)</Label>
                      <Input 
                        value={((item.cijenaPoJedinici * item.kolicina) / 100).toFixed(2).replace(".", ",")} 
                        disabled 
                        className="bg-gray-100 font-mono" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Amount */}
            <div className="flex justify-end">
              <div className="text-right">
                <Label className="text-lg font-semibold">Ukupan iznos računa</Label>
                <div className="text-2xl font-bold text-blue-600">
                  {(totalAmount / 100).toFixed(2).replace(".", ",")} EUR
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="model">Model *</Label>
              <Select value={formData.model} onValueChange={(value) => handleInputChange("model", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite model" />
                </SelectTrigger>
                <SelectContent>
                  {PaymentModels.map((model) => (
                    <SelectItem key={model.model} value={model.model}>
                      {model.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label htmlFor="pozivNaBroj">Poziv na broj plaćanja*</Label>
              <Input
                id="pozivNaBroj"
                type="text"
                value={formData.pozivNaBroj}
                onChange={(e) => handlePozivNaBrojChange(e.target.value)}
                placeholder="Automatski će se koristiti broj računa osim ako unesete ručno"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mjestoIDatumIzdavanja">Mjesto i datum izdavanja</Label>
              <Input
                id="mjestoIDatumIzdavanja"
                value={formData.mjestoIDatumIzdavanja}
                onChange={(e) => handleInputChange("mjestoIDatumIzdavanja", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vrijemeIzdavanja">Vrijeme izdavanja</Label>
              <Input
                id="vrijemeIzdavanja"
                value={formData.vrijemeIzdavanja}
                onChange={(e) => handleInputChange("vrijemeIzdavanja", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mjestoIDatumIsporuke">Mjesto i datum isporuke</Label>
              <Input
                id="mjestoIDatumIsporuke"
                value={formData.mjestoIDatumIsporuke}
                onChange={(e) => handleInputChange("mjestoIDatumIsporuke", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="datumPlacanja">Datum dospijeća</Label>
              <Input
                id="datumPlacanja"
                value={formData.datumPlacanja}
                onChange={(e) => handleInputChange("datumPlacanja", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button onClick={handleGenerateInvoice} className="flex-1" size="lg">
          Generiraj PDF račun s barkodom
        </Button>
        <Button onClick={handleResetForm} variant="outline" size="lg">
          Resetiraj unos
        </Button>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Pregled računa</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="border rounded-lg p-4 bg-gray-50 overflow-auto flex-1" style={{ maxHeight: "60vh" }}>
              <div className="pdf-preview">
                <PDFPreview invoiceData={formData} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowPdfPreview(false)} variant="outline">
                Odustani
              </Button>
              <Button onClick={handleSavePdf}>Spremi kao PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RecentItems 
        type="invoice" 
        onLoadData={(data) => {
          setFormData(data)
          if (data.cijenaPoJedinici) {
            setPriceDisplay(formatAmountForDisplay(data.cijenaPoJedinici))
          }
          setIsDataLoadedFromHistory(true)
          showToast("Prethodno generirani račun je uspješno učitan.", "success")
        }}
        onScrollToTop={() => {
          // Scroll to top of the page
          window.scrollTo({ top: 0, behavior: 'smooth' })
          // Expand both sections
          setIsCompanyInfoExpanded(true)
          setIsCustomerInfoExpanded(true)
        }}
      />
    </div>
  )
})

InvoiceGenerator.displayName = "InvoiceGenerator"

export default InvoiceGenerator
