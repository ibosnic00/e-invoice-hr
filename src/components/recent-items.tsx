"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Eye, Trash2 } from "lucide-react"
import { getHistory, removeFromHistory, type HistoryItem } from "@/utils/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ConfirmationDialog from "./confirmation-dialog"

interface RecentItemsProps {
  type: "barcode" | "invoice"
  onLoadData?: (data: any) => void
  onScrollToTop?: () => void
}

export default function RecentItems({ type, onLoadData, onScrollToTop }: RecentItemsProps) {
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null)

  useEffect(() => {
    const historyData = getHistory()
    // Filter by type and get the 20 most recent items
    const filteredItems = historyData
      .filter(item => item.type === type)
      .slice(0, 20)
    setRecentItems(filteredItems)
  }, [type])

  const handleLoadItem = (item: HistoryItem) => {
    if (onLoadData) {
      onLoadData(item.data)
    }
    
    // Additional actions based on type
    if (type === "barcode" && onScrollToTop) {
      onScrollToTop()
    } else if (type === "invoice" && onScrollToTop) {
      onScrollToTop()
    }
  }

  const handleDeleteItem = (item: HistoryItem) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      removeFromHistory(itemToDelete.id)
      // Refresh the list after deletion
      const historyData = getHistory()
      const filteredItems = historyData
        .filter(item => item.type === type)
        .slice(0, 20)
      setRecentItems(filteredItems)
      setItemToDelete(null)
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

  if (recentItems.length === 0) {
    return null
  }

  return (
    <>
      <Card id={`recent-${type}-items`}>
        <CardHeader>
          <CardTitle className="text-lg">Zadnje generirano</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-3">
          {recentItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={item.type === "barcode" ? "default" : "secondary"} className="text-xs">
                    {item.type === "barcode" ? "Barkod" : "Račun"}
                  </Badge>
                  <p className="text-sm font-medium truncate">{getItemTitle(item)}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{getItemDescription(item)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.timestamp)}</p>
              </div>
                           <div className="flex items-center gap-1 ml-2">
                                    <Button 
                     onClick={() => handleLoadItem(item)} 
                     variant="outline" 
                     size="sm"
                     className="text-xs dark:text-white"
                   >
                     Ponovno učitaj
                   </Button>
                 <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="ghost" size="sm">
                       <Eye className="h-3 w-3" />
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
                 <Button 
                   onClick={() => handleDeleteItem(item)} 
                   variant="ghost" 
                   size="sm"
                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
                 >
                   <Trash2 className="h-3 w-3" />
                 </Button>
               </div>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Potvrda brisanja stavke"
        message="Jeste li sigurni da želite obrisati ovu stavku? Ova akcija se ne može poništiti."
        confirmText="Da, obriši stavku"
        onConfirm={confirmDeleteItem}
      />
    </>
  )
} 