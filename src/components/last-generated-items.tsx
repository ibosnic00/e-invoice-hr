"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, RotateCcw } from "lucide-react"
import { getHistory, clearHistory, removeFromHistory, type HistoryItem } from "@/utils/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ConfirmationDialog from "./confirmation-dialog"

interface LastGeneratedItemsProps {
  onSwitchToTab?: (tabName: string) => void;
}

export default function LastGeneratedItems({ 
  onSwitchToTab 
}: LastGeneratedItemsProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null)

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
      return data.imeFirme || "PDF račun"
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
      const total = data.kolicina * data.cijenaPoJedinici
      return `${total.toFixed(2).replace('.', ',')} EUR - ${data.nazivRobeUsluge}`
    }
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Nema zadnjih generiranih stavki</p>
        <p className="text-gray-400">Generirajte barkod ili račun da biste vidjeli povijest</p>
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
                  <p className="text-sm text-gray-600 mt-1">{getItemDescription(item)}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(item.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.type === "barcode" ? "default" : "secondary"}>
                    {item.type === "barcode" ? "Barkod" : "Račun"}
                  </Badge>
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
                        <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
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
    </div>
  )
} 