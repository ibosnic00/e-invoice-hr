"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, History, QrCode, Settings } from "lucide-react"
import BarcodeGenerator from "@/components/barcode-generator"
import InvoiceGenerator from "@/components/invoice-generator"
import LastGeneratedItems from "@/components/last-generated-items"
import SettingsComponent from "@/components/settings"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("barcode")
  const barcodeGeneratorRef = useRef<any>(null)
  const invoiceGeneratorRef = useRef<any>(null)

  // Check for pending barcode data when ref is ready
  useEffect(() => {
    if (barcodeGeneratorRef.current && barcodeGeneratorRef.current.loadData) {
      const pendingData = sessionStorage.getItem('pendingBarcodeData')
      if (pendingData) {
        const data = JSON.parse(pendingData)
        barcodeGeneratorRef.current.loadData(data)
        sessionStorage.removeItem('pendingBarcodeData')
      }
    }
  }, [barcodeGeneratorRef.current])

  // Check for pending invoice data when ref is ready
  useEffect(() => {
    if (invoiceGeneratorRef.current && invoiceGeneratorRef.current.loadData) {
      const pendingData = sessionStorage.getItem('pendingInvoiceData')
      if (pendingData) {
        const data = JSON.parse(pendingData)
        invoiceGeneratorRef.current.loadData(data)
        sessionStorage.removeItem('pendingInvoiceData')
      }
    }
  }, [invoiceGeneratorRef.current])

  const handleLoadBarcodeData = (data: any) => {
    if (barcodeGeneratorRef.current && barcodeGeneratorRef.current.loadData) {
      barcodeGeneratorRef.current.loadData(data)
    } else {
      // Store the data in sessionStorage to load when component is ready
      sessionStorage.setItem('pendingBarcodeData', JSON.stringify(data))
    }
  }

  const handleLoadInvoiceData = (data: any) => {
    if (invoiceGeneratorRef.current && invoiceGeneratorRef.current.loadData) {
      invoiceGeneratorRef.current.loadData(data)
    } else {
      // Store the data in sessionStorage to load when component is ready
      sessionStorage.setItem('pendingInvoiceData', JSON.stringify(data))
    }
  }

  const handleSwitchToTab = (tabName: string) => {
    setActiveTab(tabName)
    
    // Scroll to recent items section after a short delay to ensure the tab is rendered
    setTimeout(() => {
      const recentItemsElement = document.getElementById(`recent-${tabName}-items`)
      if (recentItemsElement) {
        recentItemsElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">Generirajte barkodove za plaćanja i PDF račune</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="barcode" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Generiranje barkoda
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generiranje računa
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Zadnje generirano
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Postavke
            </TabsTrigger>
          </TabsList>

          <TabsContent value="barcode">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Generiranje barkoda za plaćanje
                </CardTitle>
                <CardDescription>Unesite podatke za plaćanje i generirajte PDF417 barkod</CardDescription>
              </CardHeader>
              <CardContent>
                <BarcodeGenerator ref={barcodeGeneratorRef} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generiranje PDF računa
                </CardTitle>
                <CardDescription>Unesite podatke računa i generirajte PDF dokument s barkodom</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceGenerator ref={invoiceGeneratorRef} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Zadnje generirane stavke
                </CardTitle>
                <CardDescription>Pregled zadnjih generiranih barkodova i računa</CardDescription>
              </CardHeader>
              <CardContent>
                                 <LastGeneratedItems 
                   onSwitchToTab={handleSwitchToTab}
                 />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Postavke aplikacije
                </CardTitle>
                <CardDescription>Upravljajte postavkama aplikacije i podatcima</CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsComponent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 