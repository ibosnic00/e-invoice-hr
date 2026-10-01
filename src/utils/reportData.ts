import type { HistoryItem } from "@/utils/storage"

export interface RevenueInvoice {
  id: string
  customer: string
  cents: number
  date: Date
  invoiceNumber: string
}

export interface ClientShare {
  name: string
  cents: number
  percent: number
}

export interface SeriesPoint {
  date: Date
  cumulativeCents: number
}

export type ReportRange = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL" | "CUSTOM"

const MAX_SLICES = 6

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("hr-HR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function formatAxisAmount(cents: number): string {
  return new Intl.NumberFormat("hr-HR", {
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function toInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function invoicesFromHistory(items: HistoryItem[]): RevenueInvoice[] {
  const byKey = new Map<string, RevenueInvoice>()

  for (const item of items) {
    if (item.type !== "invoice" || !item.data) continue

    const data = item.data as Record<string, unknown>
    const cents = invoiceCents(data)
    if (cents <= 0) continue

    const invoiceNumber = String(data.brojRacuna || "").trim()
    const key = invoiceNumber || item.id
    const invoice: RevenueInvoice = {
      id: item.id,
      customer: String(data.imeKupca || "").trim() || "Bez naziva",
      cents,
      date: invoiceDate(data, item.timestamp),
      invoiceNumber,
    }

    const existing = byKey.get(key)
    if (!existing || invoice.date.getTime() >= existing.date.getTime()) {
      byKey.set(key, invoice)
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}

export function rangeBounds(
  range: ReportRange,
  invoices: RevenueInvoice[],
  customFrom: string,
  customTo: string,
  now: Date
): { from: Date; to: Date } {
  const to = endOfDay(now)

  switch (range) {
    case "1M":
      return { from: startOfDay(addMonths(now, -1)), to }
    case "3M":
      return { from: startOfDay(addMonths(now, -3)), to }
    case "6M":
      return { from: startOfDay(addMonths(now, -6)), to }
    case "YTD":
      return { from: new Date(now.getFullYear(), 0, 1), to }
    case "1Y":
      return { from: startOfDay(addMonths(now, -12)), to }
    case "CUSTOM": {
      const parsedFrom = parseInputDate(customFrom)
      const parsedTo = parseInputDate(customTo)
      const from = startOfDay(parsedFrom ?? addMonths(now, -12))
      const customEnd = endOfDay(parsedTo ?? now)
      if (customEnd.getTime() < from.getTime()) {
        return { from: startOfDay(customEnd), to: endOfDay(from) }
      }
      return { from, to: customEnd }
    }
    case "ALL":
    default: {
      if (invoices.length === 0) {
        return { from: startOfDay(addMonths(now, -12)), to }
      }
      const earliest = invoices[0].date
      return {
        from: new Date(earliest.getFullYear(), earliest.getMonth(), 1),
        to,
      }
    }
  }
}

export function filterInvoices(
  invoices: RevenueInvoice[],
  from: Date,
  to: Date
): RevenueInvoice[] {
  return invoices.filter(
    (invoice) =>
      invoice.date.getTime() >= from.getTime() &&
      invoice.date.getTime() <= to.getTime()
  )
}

export function clientShares(invoices: RevenueInvoice[]): ClientShare[] {
  const totals = new Map<string, number>()
  for (const invoice of invoices) {
    totals.set(invoice.customer, (totals.get(invoice.customer) || 0) + invoice.cents)
  }

  const sorted = Array.from(totals.entries())
    .map(([name, cents]) => ({ name, cents }))
    .sort((a, b) => b.cents - a.cents)

  const total = sorted.reduce((sum, item) => sum + item.cents, 0)
  if (total <= 0) return []

  const visible =
    sorted.length > MAX_SLICES
      ? [
          ...sorted.slice(0, MAX_SLICES - 1),
          {
            name: "Ostali",
            cents: sorted
              .slice(MAX_SLICES - 1)
              .reduce((sum, item) => sum + item.cents, 0),
          },
        ]
      : sorted

  const rounded = visible.map((item) =>
    Math.round((item.cents / total) * 1000) / 10
  )
  const drift =
    Math.round((100 - rounded.reduce((sum, value) => sum + value, 0)) * 10) / 10
  rounded[rounded.length - 1] =
    Math.round((rounded[rounded.length - 1] + drift) * 10) / 10

  return visible.map((item, index) => ({
    name: item.name,
    cents: item.cents,
    percent: rounded[index],
  }))
}

export function growthSeries(
  invoices: RevenueInvoice[],
  from: Date,
  to: Date
): SeriesPoint[] {
  const sorted = [...invoices].sort((a, b) => a.date.getTime() - b.date.getTime())
  const points: SeriesPoint[] = [{ date: from, cumulativeCents: 0 }]
  let index = 0
  let cumulative = 0

  for (const end of bucketEnds(from, to)) {
    while (index < sorted.length && sorted[index].date.getTime() <= end.getTime()) {
      cumulative += sorted[index].cents
      index += 1
    }
    points.push({ date: end, cumulativeCents: cumulative })
  }

  return points
}

export function sumCents(invoices: RevenueInvoice[]): number {
  return invoices.reduce((sum, invoice) => sum + invoice.cents, 0)
}

function invoiceCents(data: Record<string, unknown>): number {
  const items = data.items
  if (Array.isArray(items) && items.length > 0) {
    return items.reduce((sum, item) => {
      const row = item as { cijenaPoJedinici?: number; kolicina?: number }
      return sum + (Number(row.cijenaPoJedinici) || 0) * (Number(row.kolicina) || 0)
    }, 0)
  }

  return (Number(data.kolicina) || 0) * (Number(data.cijenaPoJedinici) || 0)
}

function invoiceDate(data: Record<string, unknown>, timestamp: string): Date {
  const raw = String(data.mjestoIDatumIzdavanja || "")
  const match = raw.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const parsed = new Date(year, month - 1, day)
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed
    }
  }

  const fallback = new Date(timestamp)
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback
}

function bucketEnds(from: Date, to: Date): Date[] {
  const days = (to.getTime() - from.getTime()) / 86_400_000
  const ends: Date[] = []
  let guard = 0

  if (days <= 45) {
    let cursor = endOfDay(from)
    while (cursor.getTime() < to.getTime() && guard < 500) {
      ends.push(cursor)
      const next = new Date(cursor)
      next.setDate(next.getDate() + 1)
      cursor = endOfDay(next)
      guard += 1
    }
  } else if (days <= 150) {
    let cursor = endOfDay(from)
    while (cursor.getTime() < to.getTime() && guard < 500) {
      ends.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 7)
      cursor = endOfDay(cursor)
      guard += 1
    }
  } else {
    let cursor = endOfDay(new Date(from.getFullYear(), from.getMonth() + 1, 0))
    while (cursor.getTime() < to.getTime() && guard < 500) {
      if (cursor.getTime() > from.getTime()) ends.push(new Date(cursor))
      cursor = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0))
      guard += 1
    }
  }

  const last = ends[ends.length - 1]
  if (!last || last.getTime() !== to.getTime()) ends.push(to)
  return ends
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function parseInputDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }
  return parsed
}
