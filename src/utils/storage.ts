export interface HistoryItem {
  id: string
  type: "barcode" | "invoice"
  data: any
  timestamp: string
}

const STORAGE_KEY = "payment-barcode-history"
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