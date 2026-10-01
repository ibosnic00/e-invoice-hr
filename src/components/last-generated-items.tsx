"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, RotateCcw, Pencil } from "lucide-react"
import { getHistory, clearHistory, removeFromHistory, updateHistoryItem, type HistoryItem } from "@/utils/storage"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCustomers, saveCustomer, type Customer } from "@/utils/customerStorage"
import { formatOIB } from "@/utils/validation"
import { useToast } from "@/components/ui/toast"
import ConfirmationDialog from "./confirmation-dialog"

interface LastGeneratedItemsProps {
  onSwitchToTab?: (tabName: string) => void;
}

interface CustomerForm {
  imeKupca: string
  adresaKupca: string
  postanskiBrojIGradKupca: string
  oibKupca: string
}

const emptyCustomerForm: CustomerForm = {
  imeKupca: "",
  adresaKupca: "",
  postanskiBrojIGradKupca: "",
  oibKupca: "",
}

export default function LastGeneratedItems({ 
  onSwitchToTab 
}: LastGeneratedItemsProps) {
  const { showToast } = useToast()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm)
  const [customerError, setCustomerError] = useState("")
  const [savedCustomers, setSavedCustomers] = useState<Customer[]>([])

  useEffect(() => {
    const historyData = getHistory()
    setHistory(historyData)
  }, [])

  const handleClearHistory = () => {
    setShowClearConfirm(true)
  }

  const confirmClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const handleRemoveItem = (item: HistoryItem) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      removeFromHistory(itemToDelete.id)
      setHistory(getHistory())
      setItemToDelete(null)
    }
  }

  const openEditCustomer = (item: HistoryItem) => {
    const data = item.data || {}
    setEditingItem(item)
    setCustomerError("")
    setSavedCustomers(getCustomers())
    setCustomerForm({
      imeKupca: data.imeKupca || "",
      adresaKupca: data.adresaKupca || "",
      postanskiBrojIGradKupca: data.postanskiBrojIGradKupca || "",
      oibKupca: data.oibKupca || "",
    })
  }

  const handleSelectSavedCustomer = (customerId: string) => {
    const customer = savedCustomers.find((entry) => entry.id === customerId)
    if (!customer) return

    setCustomerError("")
    setCustomerForm({
      imeKupca: customer.name || "",
      adresaKupca: customer.address || "",
      postanskiBrojIGradKupca: `${customer.postalCode || ""} ${customer.city || ""}`.trim(),
      oibKupca: customer.oib || "",
    })
  }

  const handleSaveCustomer = () => {
    if (!editingItem) return

    const imeKupca = customerForm.imeKupca.trim()
    if (!imeKupca) {
      setCustomerError("Unesite naziv kupca")
      return
    }

    const nextCustomer = {
      imeKupca,
      adresaKupca: customerForm.adresaKupca.trim(),
      postanskiBrojIGradKupca: customerForm.postanskiBrojIGradKupca.trim(),
      oibKupca: customerForm.oibKupca.trim(),
    }

    updateHistoryItem(editingItem.id, {
      ...editingItem.data,
      ...nextCustomer,
    })

    saveCustomer({
      name: nextCustomer.imeKupca,
      address: nextCustomer.adresaKupca,
      postalCode: nextCustomer.postanskiBrojIGradKupca.split(" ")[0] || "",
      city: nextCustomer.postanskiBrojIGradKupca.split(" ").slice(1).join(" "),
      oib: nextCustomer.oibKupca,
    })

    setHistory(getHistory())
    setEditingItem(null)
    showToast("Kupac je spremljen na račun", "success")
  }

  const handleLoadItem = (item: HistoryItem) => {
    if (item.type === "barcode" && onSwitchToTab) {
      onSwitchToTab("barcode")
    } else if (item.type === "invoice" && onSwitchToTab) {
      onSwitchToTab("invoice")
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("hr-HR")
  }

  const getItemTitle = (item: HistoryItem) => {
    if (item.type === "barcode") {
      const data = item.data as any
      return data.Primatelj || "Barkod za plaćanje"
    } else {
      const data = item.data as any
      const companyName = data.imeFirme || "PDF račun"
      const customerName = data.imeKupca || ""
      
      if (customerName) {
        return `${companyName} -> ${customerName}`
      } else {
        return companyName
      }
    }
  }

  const getItemDescription = (item: HistoryItem) => {
    if (item.type === "barcode") {
      const data = item.data as any
      // Convert amount from cents to EUR format
      const amountInEUR = (data.Iznos / 100).toFixed(2).replace('.', ',')
      return `${amountInEUR} EUR - ${data.OpisPlacanja}`
    } else {
      const data = item.data as any
      // Handle new items structure or fallback to old structure
      let total = 0
      let description = ""
      let itemCount = 0
      
      if (data.items && data.items.length > 0) {
        total = data.items.reduce((sum: number, item: any) => sum + (item.cijenaPoJedinici * item.kolicina), 0)
        description = data.items[0].nazivRobeUsluge
        itemCount = data.items.length
      } else {
        // Fallback for old structure
        total = data.kolicina * data.cijenaPoJedinici
        description = data.nazivRobeUsluge
        itemCount = 1
      }
      
      const baseDescription = `${(total / 100).toFixed(2).replace('.', ',')} EUR - ${description}`
      
      // Add item count if there are multiple items
      if (itemCount > 1) {
        return `${baseDescription} (Broj stavki na računu: ${itemCount})`
      }
      
      return baseDescription
    }
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Nema zadnjih generiranih stavki</p>
        <p className="text-gray-400 dark:text-gray-500">Generirajte barkod ili račun da biste vidjeli povijest</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ukupno stavki: {history.length}</h3>
        <Button onClick={handleClearHistory} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Obriši sve
        </Button>
      </div>

      <div className="grid gap-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{getItemTitle(item)}</CardTitle>
                  {item.type === "invoice" && !String(item.data?.imeKupca || "").trim() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Kupac nije upisan</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{getItemDescription(item)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(item.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.type === "barcode" ? "default" : "secondary"}>
                    {item.type === "barcode" ? "Barkod" : "Račun"}
                  </Badge>
                  {item.type === "invoice" && (
                    <Button
                      onClick={() => openEditCustomer(item)}
                      variant="ghost"
                      size="sm"
                      title="Uredi kupca"
                      aria-label="Uredi kupca"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                                     <Button 
                     onClick={() => handleLoadItem(item)} 
                     variant="ghost" 
                     size="sm"
                     title="Idi na tab"
                   >
                     <RotateCcw className="h-4 w-4" />
                   </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalji stavke</DialogTitle>
                      </DialogHeader>
                                             <div className="space-y-2">
                         <pre className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded overflow-x-auto">
                           {JSON.stringify(item.data, null, 2)}
                         </pre>
                       </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={() => handleRemoveItem(item)} variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Potvrda brisanja povijesti"
        message="Jeste li sigurni da želite obrisati svu povijest? Ova akcija se ne može poništiti."
        confirmText="Da, obriši svu povijest"
        onConfirm={confirmClearHistory}
      />

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Potvrda brisanja stavke"
        message="Jeste li sigurni da želite obrisati ovu stavku? Ova akcija se ne može poništiti."
        confirmText="Da, obriši stavku"
        onConfirm={confirmDeleteItem}
      />

      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Uredi kupca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kupac će se prikazati na ovoj stavci i u izvještajima.
            </p>
            {savedCustomers.length > 0 && (
              <div className="space-y-2">
                <Label>Spremljeni kupci</Label>
                <Select onValueChange={handleSelectSavedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberi spremljenog kupca" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-imeKupca">Naziv kupca</Label>
              <Input
                id="edit-imeKupca"
                value={customerForm.imeKupca}
                onChange={(event) => {
                  setCustomerError("")
                  setCustomerForm((current) => ({ ...current, imeKupca: event.target.value }))
                }}
                placeholder="Naziv kupca"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adresaKupca">Adresa kupca</Label>
              <Input
                id="edit-adresaKupca"
                value={customerForm.adresaKupca}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, adresaKupca: event.target.value }))
                }
                placeholder="Ulica i broj"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-postanskiBrojIGradKupca">Poštanski broj i grad</Label>
              <Input
                id="edit-postanskiBrojIGradKupca"
                value={customerForm.postanskiBrojIGradKupca}
                onChange={(event) =>
                  setCustomerForm((current) => ({
                    ...current,
                    postanskiBrojIGradKupca: event.target.value,
                  }))
                }
                placeholder="31000 Osijek"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-oibKupca">OIB kupca</Label>
              <Input
                id="edit-oibKupca"
                value={customerForm.oibKupca}
                onChange={(event) =>
                  setCustomerForm((current) => ({
                    ...current,
                    oibKupca: formatOIB(event.target.value),
                  }))
                }
                placeholder="12345678901"
              />
            </div>
            {customerError && (
              <p className="text-sm text-red-600 dark:text-red-400">{customerError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Odustani
            </Button>
            <Button onClick={handleSaveCustomer}>Spremi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 