import countriesRaw        from '~/utils/generated/countries.json'
import categoriesRaw       from '~/utils/generated/categories.json'
import yearsRaw            from '~/utils/generated/years.json'
import tradeConnectionsRaw from '~/utils/generated/tradeconnections.json'

// ─── Types ────────────────────────────────────────────────────────────────

export interface CategoryTrade {
  imports: { usd: number; weight: number }
  exports: { usd: number; weight: number }
}

export interface YearlyPoint {
  year: number
  imports: { usd: number; weight: number }
  exports: { usd: number; weight: number }
}

export interface CountryTrade {
  iso3: string
  name: string
  lat: number
  lng: number
  imports: { usd: number; weight: number }
  exports: { usd: number; weight: number }
  byCategory: Partial<Record<string, CategoryTrade>>
  series: YearlyPoint[]
}

export interface TradeConnectionYear {
  top3exportCountries: Record<string, number>
  top3importers: Record<string, number>
}

export interface SearchItem {
  type: 'country' | 'category' | 'year'
  label: string
  path: string
}

// ─── Data from generated JSON ─────────────────────────────────────────────

export const TRADE_DATA: CountryTrade[] = countriesRaw as unknown as CountryTrade[]

export const TRADE_CONNECTIONS: Record<string, Record<string, TradeConnectionYear>> =
  tradeConnectionsRaw as unknown as Record<string, Record<string, TradeConnectionYear>>

// Display names for ISO3 codes not present in TRADE_DATA
const SPECIAL_ISO3_NAMES: Record<string, string> = {
  EUU: 'European Union',
}

export function iso3ToName(iso3: string): string {
  return SPECIAL_ISO3_NAMES[iso3]
    ?? TRADE_DATA.find(c => c.iso3.toUpperCase() === iso3.toUpperCase())?.name
    ?? iso3
}

export const CATEGORIES: string[] = [
  ...new Set((categoriesRaw as Array<{ name: string }>).map(c => c.name))
]

export const YEARS: number[] = (yearsRaw as Array<{ year: number }>).map(y => y.year)

// ─── Helper functions ──────────────────────────────────────────────────────

export function getTradeConnections(iso3: string, year: string): TradeConnectionYear | null {
  return TRADE_CONNECTIONS[iso3.toUpperCase()]?.[year] ?? null
}

export function getCountry(iso3: string): CountryTrade | undefined {
  return TRADE_DATA.find(c => c.iso3.toUpperCase() === iso3.toUpperCase())
}

export function getTradeValue(
  country: CountryTrade,
  type: 'imports' | 'exports',
  metric: 'usd' | 'weight',
  category: string | null,
): number {
  if (category) return country.byCategory[category]?.[type]?.[metric] ?? 0
  return country[type][metric]
}

export function valueToColor(value: number, max: number, type: 'imports' | 'exports' | 'both'): string {
  if (max === 0 || value === 0) return 'rgba(0,0,0,0)' // Transparent if no data

  // A power scale (0.35) compresses the massive gap between China/US
  // and the rest of the world, which makes for a smoother gradient.
  const t = Math.pow(value / max, 0.35)

  if (type === 'imports') {
    // Light Blue to Deep Blue
    const r = Math.round(219 + (29  - 219) * t)
    const g = Math.round(234 + (78  - 234) * t)
    const b = Math.round(254 + (216 - 254) * t)
    return `rgb(${r},${g},${b})`
  } else if (type === 'exports') {
    // Light Orange to Deep Orange
    const r = Math.round(255 + (194 - 255) * t)
    const g = Math.round(237 + (65  - 237) * t)
    const b = Math.round(213 + (12  - 213) * t)
    return `rgb(${r},${g},${b})`
  } else {
    // Light Purple to Deep Purple (for total volume)
    const r = Math.round(243 + (126 - 243) * t)
    const g = Math.round(232 + (34  - 232) * t)
    const b = Math.round(255 + (206 - 255) * t)
    return `rgb(${r},${g},${b})`
  }
}

// ─── Search index ──────────────────────────────────────────────────────────

export const SEARCH_ITEMS: SearchItem[] = [
  ...TRADE_DATA.map(c => ({
    type: 'country' as const,
    label: c.name,
    path: `/countries/${c.iso3.toLowerCase()}`,
  })),
  ...CATEGORIES.map(cat => ({
    type: 'category' as const,
    label: cat,
    path: `/categories/${cat.toLowerCase().replace(/[\s&/,()]+/g, '-').replace(/-+/g, '-')}`,
  })),
  ...YEARS.map(y => ({
    type: 'year' as const,
    label: String(y),
    path: `/years/${y}`,
  })),
]
