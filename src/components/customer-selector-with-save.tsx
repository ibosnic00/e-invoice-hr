"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, User, Users, Save } from "lucide-react"
import { getCustomers, removeCustomer, saveCustomer, type Customer } from "@/utils/customerStorage"

interface CustomerSelectorWithSaveProps {
  onSelectCustomer: (customer: Customer) => void;
  onSaveCustomer?: () => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg";
  saveButtonText?: string;
  saveButtonVariant?: "default" | "outline" | "ghost";
  saveButtonSize?: "default" | "sm" | "lg";
}

export default function CustomerSelectorWithSave({ 
  onSelectCustomer, 
  onSaveCustomer,
  buttonText = "Odaberi kupca",
  buttonVariant = "outline",
  buttonSize = "sm",
  saveButtonText = "Spremi kupca",
  saveButtonVariant = "outline",
  saveButtonSize = "sm"
}: CustomerSelectorWithSaveProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCustomers(getCustomers())
  }, [])

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    setIsOpen(false)
  }

  const handleRemoveCustomer = (id: string) => {
    if (removeCustomer(id)) {
      setCustomers(getCustomers())
    }
  }

  const handleSaveCustomer = () => {
    if (onSaveCustomer) {
      onSaveCustomer()
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("hr-HR")
  }

  if (customers.length === 0) {
    return (
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant={buttonVariant} size={buttonSize}>
              <Users className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Odaberi kupca</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nema spremljenih kupaca</p>
              <p className="text-sm text-gray-400 mt-2">
                Kupci će se automatski spremiti kada generirate račun
              </p>
            </div>
          </DialogContent>
        </Dialog>
        <Button 
          variant={saveButtonVariant} 
          size={saveButtonSize}
          onClick={handleSaveCustomer}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveButtonText}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize}>
            <Users className="h-4 w-4 mr-2" />
            {buttonText} ({customers.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Odaberi kupca</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {customers.map((customer) => (
              <Card key={customer.id} className="cursor-pointer hover:bg-gray-50" 
                    onClick={() => handleSelectCustomer(customer)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {customer.name}
                      </CardTitle>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>{customer.address}</p>
                        <p>{customer.postalCode} {customer.city}</p>
                        <p>OIB: {customer.oib}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Dodano: {formatDate(customer.timestamp)}
                      </p>
                    </div>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveCustomer(customer.id)
                      }} 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Button 
        variant={saveButtonVariant} 
        size={saveButtonSize}
        onClick={handleSaveCustomer}
      >
        <Save className="h-4 w-4 mr-2" />
        {saveButtonText}
      </Button>
    </div>
  )
} 