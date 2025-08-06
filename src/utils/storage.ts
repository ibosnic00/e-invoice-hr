export interface HistoryItem {
  id: string
  type: "barcode" | "invoice"
  data: any
  timestamp: string
}

export interface InvoiceNumberSettings {
  useAutomaticNumbering: boolean
  redniBrojZadnjegRacuna: string
  oznakaPoslovnogProstora: string
  oznakaNaplatnogUredaja: string
}

const STORAGE_KEY = "payment-barcode-history"
const INVOICE_NUMBER_SETTINGS_KEY = "invoice-number-settings"
const MAX_HISTORY_ITEMS = 50

export function saveToHistory(item: HistoryItem): void {
  if (typeof window === "undefined") return

  try {
    const existing = getHistory()
    const updated = [item, ...existing].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving to history:", error)
  }
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading history:", error)
    return []
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing history:", error)
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === "undefined") return

  try {
    const existing = getHistory()
    const updated = existing.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error removing from history:", error)
  }
}

export function getInvoiceNumberSettings(): InvoiceNumberSettings {
  if (typeof window === "undefined") {
    return {
      useAutomaticNumbering: false,
      redniBrojZadnjegRacuna: "00",
      oznakaPoslovnogProstora: "01",
      oznakaNaplatnogUredaja: new Date().getFullYear().toString().slice(-2)
    }
  }

  try {
    const stored = localStorage.getItem(INVOICE_NUMBER_SETTINGS_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      return {
        useAutomaticNumbering: settings.useAutomaticNumbering || false,
        redniBrojZadnjegRacuna: settings.redniBrojZadnjegRacuna || "00",
        oznakaPoslovnogProstora: settings.oznakaPoslovnogProstora || "01",
        oznakaNaplatnogUredaja: settings.oznakaNaplatnogUredaja || new Date().getFullYear().toString().slice(-2)
      }
    }
  } catch (error) {
    console.error("Error loading invoice number settings:", error)
  }

  return {
    useAutomaticNumbering: false,
    redniBrojZadnjegRacuna: "00",
    oznakaPoslovnogProstora: "01",
    oznakaNaplatnogUredaja: new Date().getFullYear().toString().slice(-2)
  }
}

export function saveInvoiceNumberSettings(settings: InvoiceNumberSettings): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(INVOICE_NUMBER_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("Error saving invoice number settings:", error)
  }
}

export function generateAutomaticInvoiceNumber(): string {
  const settings = getInvoiceNumberSettings()
  if (!settings.useAutomaticNumbering) return ""

  const nextNumber = parseInt(settings.redniBrojZadnjegRacuna) + 1
  const formattedNumber = nextNumber.toString().padStart(2, '0')
  
  return `${formattedNumber}-${settings.oznakaPoslovnogProstora}-${settings.oznakaNaplatnogUredaja}`
}

export function incrementInvoiceNumber(currentInvoiceNumber?: string): void {
  const settings = getInvoiceNumberSettings()
  if (!settings.useAutomaticNumbering) return

  // If no current invoice number provided, just increment normally
  if (!currentInvoiceNumber) {
    const nextNumber = parseInt(settings.redniBrojZadnjegRacuna) + 1
    const newSettings = {
      ...settings,
      redniBrojZadnjegRacuna: nextNumber.toString().padStart(2, '0')
    }
    saveInvoiceNumberSettings(newSettings)
    return
  }

  // Extract the sequential number from the current invoice number
  // Format: XX-YY-ZZ where XX is the sequential number
  const parts = currentInvoiceNumber.split('-')
  if (parts.length !== 3) return

  const currentSequentialNumber = parseInt(parts[0])
  const storedSequentialNumber = parseInt(settings.redniBrojZadnjegRacuna)

  // Only increment if the current invoice number is higher than the stored one
  if (currentSequentialNumber > storedSequentialNumber) {
    const newSettings = {
      ...settings,
      redniBrojZadnjegRacuna: currentSequentialNumber.toString().padStart(2, '0')
    }
    saveInvoiceNumberSettings(newSettings)
  }
} 