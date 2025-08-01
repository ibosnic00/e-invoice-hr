"use client"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { BarcodePaymentData } from "@/types/types"
import { validateInputAndGenerateBarcode } from "@/utils/paymentParamsValidation"
import { PaymentModels } from "@/utils/barcodePayment"
import { saveToHistory } from "@/utils/storage"
import { formatAmountForDisplay, parseAmountFromDisplay } from "@/utils/barcodePayment"
import { saveCustomer } from "@/utils/customerStorage"
import CustomerInputWithSelector from "./customer-input-with-selector"
import RecentItems from "./recent-items"

const BarcodeGenerator = forwardRef<any, {}>((props, ref) => {
  const barcodeRef = useRef<HTMLCanvasElement>(null)

  // Helper function to safely get localStorage value
  const getLocalStorageValue = (key: string, defaultValue = "") => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key) || defaultValue
    }
    return defaultValue
  }

  const [formData, setFormData] = useState<BarcodePaymentData>({
    IBAN: "",
    Primatelj: getLocalStorageValue("companyName"),
    Iznos: 0,
    OpisPlacanja: "",
    ModelPlacanja: "00",
    PozivNaBroj: "",
    ImePlatitelja: "",
    AdresaPlatitelja: "",
    SjedistePlatitelja: "",
    AdresaPrimatelja: "",
    SjedistePrimatelja: "",
    SifraNamjene: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [amountDisplay, setAmountDisplay] = useState<string>("")
  const [isOptionalFieldsExpanded, setIsOptionalFieldsExpanded] = useState(false)
  const [isDataLoadedFromHistory, setIsDataLoadedFromHistory] = useState(false)
  const [hasBarcode, setHasBarcode] = useState(false)

  // Expose loadData method to parent component
  useImperativeHandle(ref, () => ({
    loadData: (data: any) => {
      setFormData(data)
      // Convert amount from cents to display format
      if (data.Iznos) {
        setAmountDisplay(formatAmountForDisplay(data.Iznos))
      }
      // Mark that data was loaded from history to prevent localStorage override
      setIsDataLoadedFromHistory(true)
    },
  }), [])

  // Load saved data on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && !isDataLoadedFromHistory) {
      const savedData = localStorage.getItem("barcodeGeneratorData")

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          setFormData(parsedData.formData)
          setAmountDisplay(parsedData.amountDisplay || "")
        } catch (error) {
          console.error("Error loading saved barcode data:", error)
        }
      }
    }
  }, [isDataLoadedFromHistory])

  // Save data to localStorage whenever formData or amountDisplay changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const dataToSave = {
        formData,
        amountDisplay,
      }
      localStorage.setItem("barcodeGeneratorData", JSON.stringify(dataToSave))
    }
  }, [formData, amountDisplay])

  // Listen for company name changes in settings
  useEffect(() => {
    if (typeof window !== "undefined" && !isDataLoadedFromHistory) {
      const handleStorageChange = () => {
        const newCompanyName = localStorage.getItem("companyName") || ""
        if (newCompanyName && newCompanyName !== formData.Primatelj) {
          setFormData((prev) => ({
            ...prev,
            Primatelj: newCompanyName,
          }))
        }
      }
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [formData.Primatelj, isDataLoadedFromHistory])

  // Auto-fill recipient address and location from settings
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && !isDataLoadedFromHistory) {
      const companyStreet = localStorage.getItem("companyStreet") || ""
      const companyHouseNumber = localStorage.getItem("companyHouseNumber") || ""
      const companyPostalCode = localStorage.getItem("companyPostalCode") || ""
      const companyCity = localStorage.getItem("companyCity") || ""
      const companyAccountNumber = localStorage.getItem("companyAccountNumber") || ""

      // Combine street and house number for address
      const fullAddress =
        companyStreet && companyHouseNumber
          ? `${companyStreet} ${companyHouseNumber}`.trim()
          : companyStreet || companyHouseNumber

      // Combine postal code and city for location
      const fullLocation =
        companyPostalCode && companyCity
          ? `${companyPostalCode} ${companyCity}`.trim()
          : companyPostalCode || companyCity

      setFormData((prev) => ({
        ...prev,
        IBAN: companyAccountNumber,
        AdresaPrimatelja: fullAddress,
        SjedistePrimatelja: fullLocation,
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

        // Combine street and house number for address
        const fullAddress =
          companyStreet && companyHouseNumber
            ? `${companyStreet} ${companyHouseNumber}`.trim()
            : companyStreet || companyHouseNumber

        // Combine postal code and city for location
        const fullLocation =
          companyPostalCode && companyCity
            ? `${companyPostalCode} ${companyCity}`.trim()
            : companyPostalCode || companyCity

        setFormData((prev) => ({
          ...prev,
          IBAN: companyAccountNumber,
          AdresaPrimatelja: fullAddress,
          SjedistePrimatelja: fullLocation,
        }))
      }
      window.addEventListener("storage", handleAddressStorageChange)
      return () => window.removeEventListener("storage", handleAddressStorageChange)
    }
  }, [isDataLoadedFromHistory])

  const handleInputChange = (field: keyof BarcodePaymentData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setErrors([])
    // Reset the flag when user manually changes data
    setIsDataLoadedFromHistory(false)
  }

  // Validate Poziv na broj to only allow numeric characters (0-9)
  const handlePozivNaBrojChange = (value: string) => {
    // Only allow numeric characters (0-9)
    const numericOnly = value.replace(/[^0-9]/g, "")
    handleInputChange("PozivNaBroj", numericOnly)
  }

  const handleAmountChange = (displayValue: string) => {
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

    setAmountDisplay(formattedValue)

    // Convert display value to numeric amount
    const numericAmount = parseAmountFromDisplay(formattedValue)

    setFormData((prev) => ({
      ...prev,
      Iznos: numericAmount,
    }))
    setErrors([])
  }

  // Add ",00" when input loses focus if user entered only digits
  const handleAmountBlur = () => {
    const currentValue = amountDisplay
    const cleaned = currentValue.replace(/[^\d,.]/g, "")

    // If user entered only digits (no decimal separator), add ",00"
    if (cleaned && !cleaned.includes(",") && !cleaned.includes(".")) {
      const formattedValue = cleaned + ",00"
      setAmountDisplay(formattedValue)

      // Update the numeric amount
      const numericAmount = parseAmountFromDisplay(formattedValue)
      setFormData((prev) => ({
        ...prev,
        Iznos: numericAmount,
      }))
    }
  }

  const handleGenerateBarcode = () => {
    try {
      // Clear previous barcode
      if (barcodeRef.current) {
        const ctx = barcodeRef.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height)
        }
      }

      validateInputAndGenerateBarcode(formData, barcodeRef)

      // Scale the generated barcode to be larger
      if (barcodeRef.current) {
        const originalWidth = barcodeRef.current.width
        const originalHeight = barcodeRef.current.height
        const scale = Math.max(2, Math.min(4, Math.floor(800 / originalWidth)))

        // Create a temporary canvas to scale the barcode
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCanvas.width = originalWidth * scale
          tempCanvas.height = originalHeight * scale
          tempCtx.drawImage(barcodeRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

          // Copy the scaled barcode back to the original canvas
          barcodeRef.current.width = tempCanvas.width
          barcodeRef.current.height = tempCanvas.height
          const ctx = barcodeRef.current.getContext("2d")
          if (ctx) {
            ctx.drawImage(tempCanvas, 0, 0)
          }
        }
      }

      // Save to history
      const historyItem = {
        type: "barcode" as const,
        data: formData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      }
      saveToHistory(historyItem)

      // Save customer data if available
      if (formData.ImePlatitelja) {
        saveCustomer({
          name: formData.ImePlatitelja,
          address: formData.AdresaPlatitelja || "",
          postalCode: formData.SjedistePlatitelja?.split(" ")[0] || "",
          city: formData.SjedistePlatitelja?.split(" ").slice(1).join(" ") || "",
          oib: "", // Add empty string as default since OIBPrimatelja doesn't exist
        })
      }

      setHasBarcode(true)
      setErrors([])
    } catch (error) {
      console.error("Error generating barcode:", error)
      setErrors(["Došlo je do greške tijekom generiranja barkoda"])
    }
  }

  const handleDownloadBarcode = () => {
    if (barcodeRef.current) {
      const link = document.createElement("a")
      link.download = `barcode-${Date.now()}.png`
      link.href = barcodeRef.current.toDataURL()
      link.click()
    }
  }

  const handleSelectCustomer = (customer: any) => {
    setFormData((prev) => ({
      ...prev,
      ImePlatitelja: customer.name,
      AdresaPlatitelja: customer.address,
      SjedistePlatitelja: `${customer.postalCode} ${customer.city}`.trim(),
    }))
  }

  const handleSaveCustomer = () => {
    if (formData.ImePlatitelja) {
      saveCustomer({
        name: formData.ImePlatitelja,
        address: formData.AdresaPlatitelja || "",
        postalCode: formData.SjedistePlatitelja?.split(" ")[0] || "",
        city: formData.SjedistePlatitelja?.split(" ").slice(1).join(" ") || "",
        oib: "", // Add empty string as default since OIBPrimatelja doesn't exist
      })
    }
  }

  const handleResetForm = () => {
    // Get company data from settings to preserve auto-filled fields
    const companyName = localStorage.getItem("companyName") || ""
    const companyStreet = localStorage.getItem("companyStreet") || ""
    const companyHouseNumber = localStorage.getItem("companyHouseNumber") || ""
    const companyPostalCode = localStorage.getItem("companyPostalCode") || ""
    const companyCity = localStorage.getItem("companyCity") || ""
    const companyAccountNumber = localStorage.getItem("companyAccountNumber") || ""

    // Combine street and house number for address
    const fullAddress =
      companyStreet && companyHouseNumber
        ? `${companyStreet} ${companyHouseNumber}`.trim()
        : companyStreet || companyHouseNumber

    // Combine postal code and city for location
    const fullLocation =
      companyPostalCode && companyCity ? `${companyPostalCode} ${companyCity}`.trim() : companyPostalCode || companyCity

    setFormData({
      IBAN: companyAccountNumber,
      Primatelj: companyName,
      Iznos: 0,
      OpisPlacanja: "",
      ModelPlacanja: "00",
      PozivNaBroj: "",
      ImePlatitelja: "",
      AdresaPlatitelja: "",
      SjedistePlatitelja: "",
      AdresaPrimatelja: fullAddress,
      SjedistePrimatelja: fullLocation,
      SifraNamjene: "",
    })
    setAmountDisplay("")
    setErrors([])
    setIsDataLoadedFromHistory(false)

    // Clear canvas
    if (barcodeRef.current) {
      const ctx = barcodeRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height)
      }
    }

    setHasBarcode(false)
    // Clear localStorage
    localStorage.removeItem("barcodeGeneratorData")
  } // ✅ Proper closing brace for handleResetForm

  // ✅ Main component return statement
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Required Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obavezni podatci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="iban">IBAN *</Label>
                <Input
                  id="iban"
                  value={formData.IBAN}
                  onChange={(e) => handleInputChange("IBAN", e.target.value)}
                  placeholder="HR1234567890123456789"
                />
              </div>
              <div>
                <Label htmlFor="primatelj">Naziv primatelja *</Label>
                <Input
                  id="primatelj"
                  value={formData.Primatelj}
                  onChange={(e) => handleInputChange("Primatelj", e.target.value)}
                  placeholder="Naziv obrta ili osobe"
                />
              </div>
              <div>
                <Label htmlFor="iznos">Iznos (EUR) *</Label>
                <Input
                  id="iznos"
                  type="text"
                  value={amountDisplay}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="0,00"
                  className="font-mono"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500">Unesite iznos u EUR. Npr.: 9,50 EUR</p>
                  {formData.Iznos > 0 && (
                    <p className="text-sm text-blue-600 font-medium">{formatAmountForDisplay(formData.Iznos)} EUR</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-[25%]">
                  <Label htmlFor="modelPlacanja">Model *</Label>
                  <Select
                    value={formData.ModelPlacanja}
                    onValueChange={(value) => handleInputChange("ModelPlacanja", value)}
                  >
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
                <div className="w-[75%]">
                  <Label htmlFor="pozivNaBroj">Poziv na broj plaćanja*</Label>
                  <Input
                    id="pozivNaBroj"
                    type="text"
                    value={formData.PozivNaBroj.toString()}
                    onChange={(e) => handlePozivNaBrojChange(e.target.value)}
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="opisPlacanja">Opis plaćanja *</Label>
              <Textarea
                id="opisPlacanja"
                value={formData.OpisPlacanja}
                onChange={(e) => handleInputChange("OpisPlacanja", e.target.value)}
                placeholder="Opis svrhe plaćanja"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsOptionalFieldsExpanded(!isOptionalFieldsExpanded)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Dodatni podatci (opcionalno)</CardTitle>
              {isOptionalFieldsExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {isOptionalFieldsExpanded && (
            <CardContent className="space-y-4">
              <CustomerInputWithSelector
                value={formData.ImePlatitelja || ""}
                onChange={(value) => handleInputChange("ImePlatitelja", value)}
                onSelectCustomer={handleSelectCustomer}
                onSaveCustomer={handleSaveCustomer}
                label="Ime platitelja"
                placeholder="Ime i prezime ili naziv"
                saveButtonText="Spremi kupca"
                saveButtonVariant="outline"
                saveButtonSize="sm"
              />
              <div>
                <Label htmlFor="adresaPlatitelja">Adresa platitelja</Label>
                <Input
                  id="adresaPlatitelja"
                  value={formData.AdresaPlatitelja}
                  onChange={(e) => handleInputChange("AdresaPlatitelja", e.target.value)}
                  placeholder="Ulica i broj"
                />
              </div>
              <div>
                <Label htmlFor="sjedistePlatitelja">Sjedište platitelja</Label>
                <Input
                  id="sjedistePlatitelja"
                  value={formData.SjedistePlatitelja}
                  onChange={(e) => handleInputChange("SjedistePlatitelja", e.target.value)}
                  placeholder="Poštanski broj i grad"
                />
              </div>
              <div>
                <Label htmlFor="adresaPrimatelja">Adresa primatelja</Label>
                <Input
                  id="adresaPrimatelja"
                  value={formData.AdresaPrimatelja}
                  onChange={(e) => handleInputChange("AdresaPrimatelja", e.target.value)}
                  placeholder="Ulica i broj"
                />
              </div>
              <div>
                <Label htmlFor="sjedistePrimatelja">Sjedište primatelja</Label>
                <Input
                  id="sjedistePrimatelja"
                  value={formData.SjedistePrimatelja}
                  onChange={(e) => handleInputChange("SjedistePrimatelja", e.target.value)}
                  placeholder="Poštanski broj i grad"
                />
              </div>
              <div>
                <Label htmlFor="sifraNamjene">Šifra namjene</Label>
                <Select
                  value={formData.SifraNamjene}
                  onValueChange={(value) => handleInputChange("SifraNamjene", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite šifru namjene" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO">Bez šifre namjene</SelectItem>
                    <SelectItem value="ADMG">ADMG - Administracija</SelectItem>
                    <SelectItem value="GVEA">GVEA - Austrijski državni zaposlenici, Kategorija A</SelectItem>
                    <SelectItem value="GVEB">GVEB - Austrijski državni zaposlenici, Kategorija B</SelectItem>
                    <SelectItem value="BUSB">BUSB - Autobusni</SelectItem>
                    <SelectItem value="CPYR">CPYR - Autorsko pravo</SelectItem>
                    <SelectItem value="HSPC">HSPC - Bolnička njega</SelectItem>
                    <SelectItem value="RDTX">RDTX - Cestarina</SelectItem>
                    <SelectItem value="DEPT">DEPT - Depozit</SelectItem>
                    <SelectItem value="DERI">DERI - Derivati (izvedenice)</SelectItem>
                    <SelectItem value="FREX">FREX - Devizno tržište</SelectItem>
                    <SelectItem value="CGDD">
                      CGDD - Direktno terećenje nastalo kao rezultat kartične transakcije
                    </SelectItem>
                    <SelectItem value="DIVD">DIVD - Dividenda</SelectItem>
                    <SelectItem value="BECH">BECH - Dječji doplatak</SelectItem>
                    <SelectItem value="CHAR">CHAR - Dobrotvorno plaćanje</SelectItem>
                    <SelectItem value="ETUP">ETUP - Doplata e-novca</SelectItem>
                    <SelectItem value="MTUP">MTUP - Doplata mobilnog uređaja (bon)</SelectItem>
                    <SelectItem value="GOVI">GOVI - Državno osiguranje</SelectItem>
                    <SelectItem value="ENRG">ENRG - Energenti</SelectItem>
                    <SelectItem value="CDCD">CDCD - Gotovinska isplata</SelectItem>
                    <SelectItem value="CSDB">CSDB - Gotovinska isplata</SelectItem>
                    <SelectItem value="TCSC">TCSC - Gradske naknade</SelectItem>
                    <SelectItem value="CDCS">CDCS - Isplata gotovine s naknadom</SelectItem>
                    <SelectItem value="FAND">FAND - Isplata naknade za elementarne nepogode</SelectItem>
                    <SelectItem value="CSLP">CSLP - Isplata socijalnih zajmova društava banci</SelectItem>
                    <SelectItem value="RHBS">RHBS - Isplata za vrijeme profesionalne rehabilitacije</SelectItem>
                    <SelectItem value="GWLT">GWLT - Isplata žrtvama rata i invalidima</SelectItem>
                    <SelectItem value="ADCS">
                      ADCS - Isplate za donacije, sponzorstva, savjetodavne, intelektualne i druge usluge
                    </SelectItem>
                    <SelectItem value="PADD">PADD - Izravno terećenje</SelectItem>
                    <SelectItem value="INTE">INTE - Kamata</SelectItem>
                    <SelectItem value="CDDP">CDDP - Kartično plaćanje s odgodom</SelectItem>
                    <SelectItem value="CDCB">CDCB - Kartično plaćanje uz gotovinski povrat (Cashback)</SelectItem>
                    <SelectItem value="BOCE">BOCE - Knjiženje konverzije u Back Office-u</SelectItem>
                    <SelectItem value="POPE">POPE - Knjiženje mjesta kupnje</SelectItem>
                    <SelectItem value="RCKE">RCKE - Knjiženje ponovne prezentacije čeka</SelectItem>
                    <SelectItem value="AREN">AREN - Knjiženje računa potraživanja</SelectItem>
                    <SelectItem value="COMC">COMC - Komercijalno plaćanje</SelectItem>
                    <SelectItem value="UBIL">UBIL - Komunalne usluge</SelectItem>
                    <SelectItem value="COMT">COMT - Konsolidirano plaćanje treće strane za račun potrošača</SelectItem>
                    <SelectItem value="SEPI">SEPI - Kupnja vrijednosnica (interna)</SelectItem>
                    <SelectItem value="GDDS">GDDS - Kupovina-prodaja roba</SelectItem>
                    <SelectItem value="GSCB">GSCB - Kupovina-prodaja roba i usluga uz gotovinski povrat</SelectItem>
                    <SelectItem value="GDSV">GDSV - Kupovina/prodaja roba i usluga</SelectItem>
                    <SelectItem value="SCVE">SCVE - Kupovina/prodaja usluga</SelectItem>
                    <SelectItem value="HLTC">HLTC - Kućna njega bolesnika</SelectItem>
                    <SelectItem value="CBLK">CBLK - Masovni kliring kartica</SelectItem>
                    <SelectItem value="MDCS">MDCS - Medicinske usluge</SelectItem>
                    <SelectItem value="NWCM">NWCM - Mrežna komunikacija</SelectItem>
                    <SelectItem value="RENT">RENT - Najam</SelectItem>
                    <SelectItem value="ALLW">ALLW - Naknada</SelectItem>
                    <SelectItem value="SSBE">SSBE - Naknada socijalnog osiguranja</SelectItem>
                    <SelectItem value="LICF">LICF - Naknada za licencu</SelectItem>
                    <SelectItem value="GFRP">GFRP - Naknada za nezaposlene u toku stečaja</SelectItem>
                    <SelectItem value="BENE">BENE - Naknada za nezaposlenost/invalidnost</SelectItem>
                    <SelectItem value="CFEE">CFEE - Naknada za poništenje</SelectItem>
                    <SelectItem value="AEMP">AEMP - Naknada za zapošljavanje</SelectItem>
                    <SelectItem value="COLL">COLL - Naplata</SelectItem>
                    <SelectItem value="FCOL">FCOL - Naplata naknade po kartičnoj transakciji</SelectItem>
                    <SelectItem value="DBTC">DBTC - Naplata putem terećenja</SelectItem>
                    <SelectItem value="NOWS">NOWS - Nenavedeno</SelectItem>
                    <SelectItem value="IDCP">IDCP - Neopozivo plaćanje sa računa debitne kartice</SelectItem>
                    <SelectItem value="ICCP">ICCP - Neopozivo plaćanje sa računa kreditne kartice</SelectItem>
                    <SelectItem value="BONU">BONU - Novčana nagrada (bonus)</SelectItem>
                    <SelectItem value="PAYR">PAYR - Obračun plaća</SelectItem>
                    <SelectItem value="BLDM">BLDM - Održavanje zgrada</SelectItem>
                    <SelectItem value="HEDG">HEDG - Omeđivanje rizika (Hedging)</SelectItem>
                    <SelectItem value="CDOC">CDOC - Originalno odobrenje</SelectItem>
                    <SelectItem value="PPTI">PPTI - Osiguranje imovine</SelectItem>
                    <SelectItem value="LBRI">LBRI - Osiguranje iz rada</SelectItem>
                    <SelectItem value="OTHR">OTHR - Ostalo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

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
        <Button onClick={handleGenerateBarcode} className="flex-1">
          Generiraj barkod
        </Button>
        <Button onClick={handleDownloadBarcode} variant="outline" disabled={!hasBarcode}>
          Preuzmi barkod
        </Button>
        <Button onClick={handleResetForm} variant="outline">
          Resetiraj unos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generirani barkod</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <canvas
            ref={barcodeRef}
            className="max-w-full"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </CardContent>
      </Card>

      <RecentItems 
        type="barcode" 
        onLoadData={(data) => {
          setFormData(data)
          if (data.Iznos) {
            setAmountDisplay(formatAmountForDisplay(data.Iznos))
          }
          setIsDataLoadedFromHistory(true)
        }}
        onScrollToTop={() => {
          // Scroll to top of the page
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    </div>
  )
})

BarcodeGenerator.displayName = "BarcodeGenerator"

export default BarcodeGenerator
