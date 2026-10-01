"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PieChart, TrendingUp } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { getHistory } from "@/utils/storage"
import { cn } from "@/lib/utils"
import {
  clientShares,
  filterInvoices,
  formatAxisAmount,
  formatEur,
  formatPercent,
  growthSeries,
  invoicesFromHistory,
  rangeBounds,
  sumCents,
  toInputDate,
  type ReportRange,
  type RevenueInvoice,
  type SeriesPoint,
} from "@/utils/reportData"

const RANGES: { id: ReportRange; label: string }[] = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "YTD", label: "Ova godina" },
  { id: "1Y", label: "1G" },
  { id: "ALL", label: "Sve" },
  { id: "CUSTOM", label: "Prilagođeno" },
]

const SLICE_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#64748b",
]

const CHART_W = 800
const CHART_H = 280
const CHART_PAD = { left: 56, right: 96, top: 18, bottom: 36 }

export default function Reports() {
  const { theme } = useTheme()
  const [invoices, setInvoices] = useState<RevenueInvoice[]>([])
  const [range, setRange] = useState<ReportRange>("ALL")
  const [customFrom, setCustomFrom] = useState(() =>
    toInputDate(new Date(new Date().getFullYear(), new Date().getMonth() - 12, new Date().getDate()))
  )
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()))

  useEffect(() => {
    setInvoices(invoicesFromHistory(getHistory()))
  }, [])

  const bounds = useMemo(
    () => rangeBounds(range, invoices, customFrom, customTo, new Date()),
    [range, invoices, customFrom, customTo]
  )

  const periodInvoices = useMemo(
    () => filterInvoices(invoices, bounds.from, bounds.to),
    [invoices, bounds]
  )

  const shares = useMemo(() => clientShares(periodInvoices), [periodInvoices])
  const series = useMemo(
    () => (periodInvoices.length > 0 ? growthSeries(periodInvoices, bounds.from, bounds.to) : []),
    [periodInvoices, bounds]
  )

  const periodTotal = sumCents(periodInvoices)
  const allTimeTotal = sumCents(invoices)
  const average = periodInvoices.length > 0 ? periodTotal / periodInvoices.length : 0
  const topClient = shares[0]

  const previousTotal = useMemo(() => {
    if (range === "ALL") return null
    const length = bounds.to.getTime() - bounds.from.getTime()
    const previousFrom = new Date(bounds.from.getTime() - length)
    const previousTo = new Date(bounds.from.getTime() - 1)
    return sumCents(filterInvoices(invoices, previousFrom, previousTo))
  }, [range, bounds, invoices])

  const delta = previousTotal === null ? null : periodTotal - previousTotal
  const deltaPercent =
    previousTotal && previousTotal > 0 && delta !== null
      ? (delta / previousTotal) * 100
      : null

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <PieChart className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Nema podataka za izvještaj</p>
        <p className="text-gray-400 dark:text-gray-500">
          Generirajte račun da biste vidjeli prihod i raspodjelu po klijentima
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5" />
                Rast prihoda
              </CardTitle>
              <CardDescription>Kumulativni prihod od generiranih računa</CardDescription>
              <p className="text-3xl font-semibold tracking-tight mt-4">{formatEur(periodTotal)}</p>
              <p className="text-sm text-muted-foreground mt-1">u odabranom razdoblju</p>
              {delta !== null && (
                <p
                  className={cn(
                    "text-sm mt-2 font-medium",
                    delta >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {delta >= 0 ? "+" : ""}
                  {formatEur(delta)}
                  {deltaPercent !== null ? ` (${delta >= 0 ? "+" : ""}${formatPercent(deltaPercent)})` : ""}
                  <span className="font-normal text-muted-foreground"> u odnosu na prethodno razdoblje</span>
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRange(item.id)}
                    className={cn(
                      "px-2.5 py-1 text-xs sm:text-sm rounded-md font-medium transition-colors",
                      range === item.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {range === "CUSTOM" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="w-40"
                    aria-label="Od datuma"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="w-40"
                    aria-label="Do datuma"
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Broj računa" value={String(periodInvoices.length)} />
            <Stat label="Prosječni račun" value={formatEur(average)} />
            <Stat label="Najveći klijent" value={topClient ? topClient.name : "—"} />
            <Stat label="Sveukupni prihod" value={formatEur(allTimeTotal)} />
          </div>
          {series.length > 1 ? (
            <GrowthChart points={series} dark={theme === "dark"} />
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Nema računa u odabranom razdoblju
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <PieChart className="h-5 w-5" />
            Raspodjela po klijentima
          </CardTitle>
          <CardDescription>Udio prihoda u odabranom razdoblju</CardDescription>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Nema računa u odabranom razdoblju
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] lg:items-center">
              <DistributionChart shares={shares} />
              <ul className="divide-y divide-border">
                {shares.map((share, index) => (
                  <li key={share.name} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
                      />
                      <span className="truncate text-sm">{share.name}</span>
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                      {formatEur(share.cents)} · {formatPercent(share.percent)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Izvještaj koristi generirane račune iz povijesti. Isti broj računa broji se jednom.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-3 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm sm:text-base font-semibold mt-1 truncate" title={value}>
        {value}
      </p>
    </div>
  )
}

function GrowthChart({ points, dark }: { points: SeriesPoint[]; dark: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const values = points.map((point) => point.cumulativeCents)
  const maxValue = Math.max(...values, 0)
  const yMax = maxValue === 0 ? 1 : maxValue * 1.12
  const from = points[0].date.getTime()
  const to = points[points.length - 1].date.getTime()
  const span = to - from || 1

  const coords = points.map((point) => ({
    x: CHART_PAD.left + ((point.date.getTime() - from) / span) * (CHART_W - CHART_PAD.left - CHART_PAD.right),
    y: CHART_PAD.top + (1 - point.cumulativeCents / yMax) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom),
  }))

  const baseline = CHART_H - CHART_PAD.bottom
  const line = smoothLine(coords)
  const area = `${line} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`
  const gridColor = dark ? "#334155" : "#e2e8f0"
  const labelColor = dark ? "#94a3b8" : "#64748b"
  const lineColor = dark ? "#60a5fa" : "#2563eb"
  const last = coords[coords.length - 1]
  const lastValue = formatEur(points[points.length - 1].cumulativeCents)
  const badgeWidth = Math.max(88, lastValue.length * 7.1)
  const labelIndexes = axisIndexes(points)

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((step) => yMax * step)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Graf kumulativnog prihoda"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const x = ((event.clientX - rect.left) / rect.width) * CHART_W
          let nearest = 0
          let distance = Infinity
          coords.forEach((point, index) => {
            const next = Math.abs(point.x - x)
            if (next < distance) {
              distance = next
              nearest = index
            }
          })
          setHover(nearest)
        }}
      >
        <defs>
          <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={dark ? 0.45 : 0.28} />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridValues.map((value) => {
          const y = CHART_PAD.top + (1 - value / yMax) * (CHART_H - CHART_PAD.top - CHART_PAD.bottom)
          return (
            <g key={value}>
              <line
                x1={CHART_PAD.left}
                x2={CHART_W - CHART_PAD.right}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeDasharray="4 6"
              />
              <text x={CHART_PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={labelColor}>
                {formatAxisAmount(value)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="url(#revenue-area)" />
        <path d={line} fill="none" stroke={lineColor} strokeWidth="2.5" />
        {labelIndexes.map((index) => {
          const point = points[index]
          const position = labelIndexes.indexOf(index)
          const previous = position > 0 ? points[labelIndexes[position - 1]] : null
          const showYear = !previous || previous.date.getFullYear() !== point.date.getFullYear()
          return (
            <text
              key={`${point.date.toISOString()}-${index}`}
              x={coords[index].x}
              y={CHART_H - 10}
              textAnchor="middle"
              fontSize="11"
              fill={labelColor}
            >
              {axisLabel(point.date, showYear || index === 0, span <= 45 * 86_400_000)}
            </text>
          )
        })}
        {hover !== null && (
          <line
            x1={coords[hover].x}
            x2={coords[hover].x}
            y1={CHART_PAD.top}
            y2={baseline}
            stroke={lineColor}
            strokeOpacity="0.35"
          />
        )}
        <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
        <rect
          x={Math.min(last.x + 8, CHART_W - badgeWidth - 4)}
          y={Math.max(4, last.y - 11)}
          width={badgeWidth}
          height="22"
          rx="6"
          fill="#2563eb"
        />
        <text
          x={Math.min(last.x + 8, CHART_W - badgeWidth - 4) + badgeWidth / 2}
          y={Math.max(4, last.y - 11) + 15}
          textAnchor="middle"
          fontSize="11"
          fill="#ffffff"
          fontWeight="600"
        >
          {lastValue}
        </text>
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${Math.min(Math.max((coords[hover].x / CHART_W) * 100, 8), 70)}%`,
          }}
        >
          <p className="text-muted-foreground">
            {points[hover].date.toLocaleDateString("hr-HR")}
          </p>
          <p className="font-semibold">{formatEur(points[hover].cumulativeCents)}</p>
        </div>
      )}
    </div>
  )
}

function DistributionChart({
  shares,
}: {
  shares: { name: string; cents: number; percent: number }[]
}) {
  const width = 520
  const height = 340
  const centerX = width / 2
  const centerY = height / 2 + 6
  const radius = 102
  let angle = 0
  const showOutsideLabels = shares.length <= 5

  if (shares.length === 1) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg mx-auto" role="img" aria-label="Raspodjela prihoda">
        <circle cx={centerX} cy={centerY} r={radius} fill={SLICE_COLORS[0]} />
        <text x={centerX} y={centerY + 5} textAnchor="middle" fill={percentColor(SLICE_COLORS[0])} fontSize="16" fontWeight="600">
          {formatPercent(shares[0].percent)}
        </text>
        <text x={centerX} y={centerY - radius - 18} textAnchor="middle" className="fill-gray-700 dark:fill-gray-200" fontSize="13">
          {shortName(shares[0].name)}
        </text>
      </svg>
    )
  }

  const slices = shares.map((share, index) => {
    const start = angle
    const sweep = (share.percent / 100) * 360
    const end = start + sweep
    angle = end
    return { share, index, start, end }
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg mx-auto" role="img" aria-label="Raspodjela prihoda po klijentima">
      {slices.map((slice) => {
        const mid = (slice.start + slice.end) / 2
        const percentPos = polar(centerX, centerY, radius * 0.62, mid)
        const labelPos = polar(centerX, centerY, radius + 26, mid)
        const anchor = labelPos.x > centerX + 12 ? "start" : labelPos.x < centerX - 12 ? "end" : "middle"
        const showPercent = slice.end - slice.start >= 28
        const showLabel = showOutsideLabels && slice.end - slice.start >= 12

        return (
          <g key={slice.share.name}>
            <path
              d={slicePath(centerX, centerY, radius, slice.start, slice.end)}
              fill={SLICE_COLORS[slice.index % SLICE_COLORS.length]}
              stroke="hsl(var(--card))"
              strokeWidth="2"
            />
            {showPercent && (
              <text
                x={percentPos.x}
                y={percentPos.y + 4}
                textAnchor="middle"
                fill={percentColor(SLICE_COLORS[slice.index % SLICE_COLORS.length])}
                fontSize="13"
                fontWeight="600"
              >
                {formatPercent(slice.share.percent)}
              </text>
            )}
            {showLabel && (
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor={anchor}
                className="fill-gray-700 dark:fill-gray-200"
                fontSize="13"
              >
                {showPercent
                  ? shortName(slice.share.name)
                  : `${shortName(slice.share.name)} ${formatPercent(slice.share.percent)}`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function slicePath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const startPoint = polar(cx, cy, radius, start)
  const endPoint = polar(cx, cy, radius, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${large} 1 ${endPoint.x} ${endPoint.y} Z`
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function smoothLine(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

function axisIndexes(points: SeriesPoint[]): number[] {
  if (points.length <= 6) return points.map((_, index) => index)
  const count = 6
  const indexes = new Set<number>([0, points.length - 1])
  for (let step = 1; step < count - 1; step += 1) {
    indexes.add(Math.round((step * (points.length - 1)) / (count - 1)))
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

function axisLabel(date: Date, showYear: boolean, shortRange: boolean): string {
  if (shortRange) {
    const day = date.toLocaleDateString("hr-HR", { day: "numeric", month: "short" }).replace(/\./g, "")
    return showYear ? `${day} ${date.getFullYear()}` : day
  }
  const month = date.toLocaleDateString("hr-HR", { month: "short" }).replace(".", "")
  return showYear ? `${month} ${date.getFullYear()}` : month
}

function percentColor(color: string): string {
  return color === "#eab308" ? "#111827" : "#ffffff"
}

function shortName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 16)}…` : name
}
