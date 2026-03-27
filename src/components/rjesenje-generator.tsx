"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSearch, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { generateBarcode } from "@/utils/generateBarcode"
import type { PaymentParams } from "@/types/types"

interface PaymentEntry {
  label: string
  iban: string
  iznos: string       // display format e.g. "515,63"
  model: string       // "68"
  pozivNaBroj: string // e.g. "8320-04234341067"
  opisPlacanja: string
}

function parseAmountCents(iznos: string): number {
  // Handle "515,63" (Croatian) and "515.63" formats
  const normalized = iznos.replace(/\s/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : Math.round(num * 100)
}

function parseRjesenjeText(text: string): PaymentEntry[] {
  // Normalize dashes
  const normalized = text.replace(/[–—―]/g, '-')

  // IBANs: match HR + digits/spaces only (avoids false matches like HRVATSKA+MINISTARSTVO)
  // Croatian IBANs are always HR + 19 digits = 21 chars total
  const rawIbanMatches = [...text.matchAll(/HR[\d\s]{10,35}/gi)]
  const ibans = rawIbanMatches
    .map(m => m[0].replace(/\s+/g, '').toUpperCase())
    .filter(iban => /^HR\d{19}$/.test(iban))
    .filter((iban, i, arr) => arr.indexOf(iban) === i) // deduplicate

  // EUR amounts — first match is the annual assessment base (e.g. 6.875,00 EUR), skip it
  const amountMatches = [...text.matchAll(/(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*EUR/gi)]
  const amounts = amountMatches.slice(1).map(m => m[1])

  // Reference pairs: 4-digit code - OIB (9-12 digits)
  const refPattern = /(\d{4})\s*-\s*(\d{9,12})/g
  const refs = [...normalized.matchAll(refPattern)]

  // For each ref, find the description immediately following it (same or next line)
  const refData = refs.slice(0, 3).map(ref => {
    const afterRef = normalized.slice(ref.index! + ref[0].length)
    // Description starts with optional whitespace then a letter
    const descMatch = afterRef.match(/^\s*([a-zA-ZčćšđžČĆŠĐŽ][^\n\r]{2,})/)
    return {
      prefix: ref[1],
      oib: ref[2],
      desc: descMatch ? descMatch[1].trim().slice(0, 35) : "",
    }
  })

  const labels = [
    "Doprinos za mirovinsko osiguranje",
    "Doprinos MIO - kap. štednja",
    "Doprinos za zdravstveno osiguranje",
  ]

  return labels.map((label, i) => {
    const ref = refData[i]
    return {
      label,
      iban: ibans[i] || "",
      iznos: amounts[i] || "",
      model: "68",
      pozivNaBroj: ref ? `${ref.prefix}-${ref.oib}` : "",
      opisPlacanja: ref?.desc || "",
    }
  })
}

export default function RjesenjeGenerator() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState("")
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [barcodesGenerated, setBarcodesGenerated] = useState(false)
  // Incrementing this triggers the useEffect to draw barcodes after React renders the canvases
  const [generateTrigger, setGenerateTrigger] = useState(0)

  const canvasRef0 = useRef<HTMLCanvasElement>(null)
  const canvasRef1 = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)
  const canvasRefs = [canvasRef0, canvasRef1, canvasRef2]

  // Keep a ref to the latest payments so the effect can access them without being in deps
  const paymentsRef = useRef<PaymentEntry[]>([])
  paymentsRef.current = payments

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global paste listener — works regardless of which element is focused
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (item) {
        const file = item.getAsFile()
        if (file) handleFileChange(file)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Draw barcodes after React has rendered the canvases into the DOM
  useEffect(() => {
    if (generateTrigger === 0) return
    paymentsRef.current.forEach((entry, i) => {
      const params: PaymentParams = {
        IBAN: entry.iban,
        Primatelj: "",
        Iznos: parseAmountCents(entry.iznos),
        ModelPlacanja: entry.model,
        PozivNaBroj: entry.pozivNaBroj,
        OpisPlacanja: entry.opisPlacanja.slice(0, 35),
      }
      generateBarcode(params, canvasRefs[i])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateTrigger])

  const handleFileChange = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setPayments([])
    setBarcodesGenerated(false)
    setGenerateTrigger(0)
    setOcrError(null)
    setOcrProgress("")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange(file)
  }

  const runOCR = async () => {
    if (!uploadedFile) return
    setIsProcessing(true)
    setOcrError(null)
    setOcrProgress("Priprema dokumenta...")

    try {
      let imageSource: string = previewUrl!

      // If PDF, render first page to canvas and get data URL
      if (uploadedFile.type === "application/pdf" || uploadedFile.name.toLowerCase().endsWith(".pdf")) {
        setOcrProgress("Učitavanje PDF stranice...")
        const pdfjsLib = await import("pdfjs-dist")
        // Use local worker file served from /public (v3 CJS build, webpack compatible)
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"

        const arrayBuffer = await uploadedFile.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 2.5 })

        const offscreenCanvas = document.createElement("canvas")
        offscreenCanvas.width = viewport.width
        offscreenCanvas.height = viewport.height
        const ctx = offscreenCanvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise
        imageSource = offscreenCanvas.toDataURL("image/png")
      }

      setOcrProgress("Pokretanje OCR analize (može potrajati)...")
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("hrv", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(`Analiziranje: ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      const { data: { text } } = await worker.recognize(imageSource)
      await worker.terminate()

      const parsed = parseRjesenjeText(text)
      setPayments(parsed)
      setBarcodesGenerated(false)
    } catch (err) {
      console.error(err)
      setOcrError("Greška pri analizi dokumenta. Provjerite datoteku i pokušajte ponovo.")
    } finally {
      setIsProcessing(false)
      setOcrProgress("")
    }
  }

  const updatePayment = (index: number, field: keyof PaymentEntry, value: string) => {
    setPayments(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    setBarcodesGenerated(false)
  }

  const handleGenerateBarcodes = () => {
    setBarcodesGenerated(true)
    setGenerateTrigger(t => t + 1)
  }

  const downloadBarcode = (index: number, label: string) => {
    const canvas = canvasRefs[index].current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = `barkod-${label.replace(/\s+/g, "-").toLowerCase()}.png`
    a.click()
  }

  const isPdf = uploadedFile?.type === "application/pdf" || uploadedFile?.name.toLowerCase().endsWith(".pdf")

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
        style={{ minHeight: '25rem' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Example document background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/example-rjesenje.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none select-none"
        />
        <div className="relative z-10 flex flex-col items-center justify-center" style={{ minHeight: '25rem' }}>
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Povucite sliku ili PDF ovdje, ili{" "}
            <span className="text-blue-500 underline">kliknite za odabir</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Podržano: JPG, PNG, PDF • ili zalijepite sliku (Ctrl+V)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
      </div>

      {/* File preview */}
      {previewUrl && !isPdf && (
        <div className="border rounded-lg overflow-hidden max-h-72 flex justify-center bg-gray-50 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Pregled dokumenta" className="max-h-72 object-contain" />
        </div>
      )}
      {uploadedFile && isPdf && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 text-center text-gray-600 dark:text-gray-300">
          PDF datoteka odabrana: <strong>{uploadedFile.name}</strong>
        </div>
      )}

      {/* Analyze button */}
      {uploadedFile && (
        <Button onClick={runOCR} disabled={isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {ocrProgress || "Analiziranje..."}
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4 mr-2" />
              Analiziraj dokument
            </>
          )}
        </Button>
      )}

      {/* OCR error */}
      {ocrError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{ocrError}</AlertDescription>
        </Alert>
      )}

      {/* Payment cards */}
      {payments.length === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pronađene uplate — provjerite podatke i ispravite po potrebi:
          </p>

          {payments.map((payment, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 shadow-sm">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">{payment.label}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">IBAN</Label>
                  <Input
                    value={payment.iban}
                    onChange={e => updatePayment(i, "iban", e.target.value)}
                    className="font-mono text-sm mt-1"
                    placeholder="HR..."
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Iznos (EUR)</Label>
                  <Input
                    value={payment.iznos}
                    onChange={e => updatePayment(i, "iznos", e.target.value)}
                    className="text-sm mt-1"
                    placeholder="515,63"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Model plaćanja</Label>
                  <Input
                    value={payment.model}
                    onChange={e => updatePayment(i, "model", e.target.value)}
                    className="text-sm mt-1"
                    placeholder="68"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Poziv na broj</Label>
                  <Input
                    value={payment.pozivNaBroj}
                    onChange={e => updatePayment(i, "pozivNaBroj", e.target.value)}
                    className="font-mono text-sm mt-1"
                    placeholder="8320-04234341067"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">
                    Opis plaćanja ({payment.opisPlacanja.length}/35)
                  </Label>
                  <Input
                    value={payment.opisPlacanja}
                    maxLength={35}
                    onChange={e => updatePayment(i, "opisPlacanja", e.target.value)}
                    className="text-sm mt-1"
                  />
                </div>
              </div>

              {/* Canvas is always in the DOM so refs are valid when useEffect draws.
                  Hidden until barcodes are generated. */}
              <div className={barcodesGenerated ? "mt-3 flex flex-col items-center gap-2 pt-3 border-t" : "hidden"}>
                <canvas ref={canvasRefs[i]} className="bg-white" style={{ width: '70%', imageRendering: 'pixelated' }} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBarcode(i, payment.label)}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Preuzmi barkod
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={handleGenerateBarcodes} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Generiraj barkodove
          </Button>
        </div>
      )}
    </div>
  )
}
