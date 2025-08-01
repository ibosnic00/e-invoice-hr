"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, User, Users, Save, ChevronDown } from "lucide-react"
import { getCustomers, removeCustomer, saveCustomer, type Customer } from "@/utils/customerStorage"

interface CustomerInputWithSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSaveCustomer?: () => void;
  placeholder?: string;
  label?: string;
  saveButtonText?: string;
  saveButtonVariant?: "default" | "outline" | "ghost";
  saveButtonSize?: "default" | "sm" | "lg";
}

export default function CustomerInputWithSelector({ 
  value,
  onChange,
  onSelectCustomer, 
  onSaveCustomer,
  placeholder = "Ime i prezime ili naziv",
  label,
  saveButtonText = "Spremi kupca",
  saveButtonVariant = "outline",
  saveButtonSize = "sm"
}: CustomerInputWithSelectorProps) {
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

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Odaberi kupca</DialogTitle>
              </DialogHeader>
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nema spremljenih kupaca</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Kupci će se automatski spremiti kada generirate račun
                  </p>
                </div>
              ) : (
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
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Button 
          variant={saveButtonVariant} 
          size={saveButtonSize}
          onClick={handleSaveCustomer}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveButtonText}
        </Button>
      </div>
    </div>
  )
} 