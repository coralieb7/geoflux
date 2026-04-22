// app/utils/dummyData.ts

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CategoryTrade {
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
}

export interface TradeFlow {
  fromIso3: string
  fromLat: number
  fromLng: number
  toIso3: string
  toLat: number
  toLng: number
  usd: number
  weight: number
  type: 'export' | 'import'
}

export interface SearchItem {
  type: 'country' | 'category' | 'year'
  label: string
  path: string
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES: string[] = [
  'Live Animals',
  'Vegetable Products',
  'Fats & Oils',
  'Foodstuffs',
  'Mineral Products',
  'Chemical Products',
  'Plastics & Rubber',
  'Wood Products',
  'Textiles',
  'Metals',
  'Machinery',
  'Transport Equipment',
]

// ─── Country trade data ───────────────────────────────────────────────────────

export const TRADE_DATA: CountryTrade[] = [
  {
    iso3: 'USA', name: 'United States', lat: 37.09, lng: -95.71,
    imports: { usd: 3_200_000, weight: 850_000 },
    exports: { usd: 2_100_000, weight: 620_000 },
    byCategory: {
      'Machinery':            { imports: { usd: 800_000, weight: 120_000 }, exports: { usd: 400_000, weight: 80_000 } },
      'Transport Equipment':  { imports: { usd: 500_000, weight: 200_000 }, exports: { usd: 350_000, weight: 150_000 } },
      'Mineral Products':     { imports: { usd: 400_000, weight: 200_000 }, exports: { usd: 300_000, weight: 120_000 } },
      'Chemical Products':    { imports: { usd: 350_000, weight: 90_000  }, exports: { usd: 280_000, weight: 70_000 } },
      'Textiles':             { imports: { usd: 200_000, weight: 60_000  }, exports: { usd: 80_000,  weight: 25_000 } },
    },
  },
  {
    iso3: 'CHN', name: 'China', lat: 35.86, lng: 104.19,
    imports: { usd: 2_700_000, weight: 1_200_000 },
    exports: { usd: 3_500_000, weight: 1_800_000 },
    byCategory: {
      'Machinery':         { imports: { usd: 400_000, weight: 80_000  }, exports: { usd: 1_200_000, weight: 300_000 } },
      'Textiles':          { imports: { usd: 50_000,  weight: 20_000  }, exports: { usd: 700_000,   weight: 200_000 } },
      'Mineral Products':  { imports: { usd: 800_000, weight: 600_000 }, exports: { usd: 100_000,   weight: 50_000 } },
      'Chemical Products': { imports: { usd: 200_000, weight: 100_000 }, exports: { usd: 300_000,   weight: 80_000 } },
    },
  },
  {
    iso3: 'DEU', name: 'Germany', lat: 51.16, lng: 10.45,
    imports: { usd: 1_400_000, weight: 420_000 },
    exports: { usd: 1_600_000, weight: 480_000 },
    byCategory: {
      'Transport Equipment': { imports: { usd: 200_000, weight: 80_000 }, exports: { usd: 450_000, weight: 180_000 } },
      'Machinery':           { imports: { usd: 300_000, weight: 70_000 }, exports: { usd: 500_000, weight: 120_000 } },
      'Chemical Products':   { imports: { usd: 200_000, weight: 60_000 }, exports: { usd: 250_000, weight: 70_000  } },
    },
  },
  {
    iso3: 'JPN', name: 'Japan', lat: 36.20, lng: 138.25,
    imports: { usd: 900_000, weight: 350_000 },
    exports: { usd: 750_000, weight: 280_000 },
    byCategory: {
      'Transport Equipment': { imports: { usd: 50_000,  weight: 20_000  }, exports: { usd: 200_000, weight: 80_000 } },
      'Machinery':           { imports: { usd: 200_000, weight: 40_000  }, exports: { usd: 300_000, weight: 70_000 } },
      'Mineral Products':    { imports: { usd: 250_000, weight: 150_000 }, exports: { usd: 20_000,  weight: 10_000 } },
    },
  },
  {
    iso3: 'GBR', name: 'United Kingdom', lat: 55.37, lng: -3.43,
    imports: { usd: 850_000, weight: 230_000 },
    exports: { usd: 600_000, weight: 180_000 },
    byCategory: {
      'Chemical Products': { imports: { usd: 120_000, weight: 40_000 }, exports: { usd: 150_000, weight: 45_000 } },
      'Machinery':         { imports: { usd: 200_000, weight: 50_000 }, exports: { usd: 150_000, weight: 40_000 } },
    },
  },
  {
    iso3: 'FRA', name: 'France', lat: 46.22, lng: 2.21,
    imports: { usd: 750_000, weight: 210_000 },
    exports: { usd: 700_000, weight: 200_000 },
    byCategory: {
      'Transport Equipment': { imports: { usd: 100_000, weight: 40_000 }, exports: { usd: 120_000, weight: 50_000 } },
      'Foodstuffs':          { imports: { usd: 80_000,  weight: 60_000 }, exports: { usd: 100_000, weight: 70_000 } },
    },
  },
  {
    iso3: 'KOR', name: 'South Korea', lat: 35.90, lng: 127.76,
    imports: { usd: 600_000, weight: 300_000 },
    exports: { usd: 650_000, weight: 350_000 },
    byCategory: {
      'Machinery':           { imports: { usd: 100_000, weight: 30_000  }, exports: { usd: 200_000, weight: 60_000 } },
      'Transport Equipment': { imports: { usd: 80_000,  weight: 30_000  }, exports: { usd: 150_000, weight: 60_000 } },
      'Mineral Products':    { imports: { usd: 150_000, weight: 100_000 }, exports: { usd: 20_000,  weight: 10_000 } },
    },
  },
  {
    iso3: 'CAN', name: 'Canada', lat: 56.13, lng: -106.34,
    imports: { usd: 550_000, weight: 200_000 },
    exports: { usd: 600_000, weight: 350_000 },
    byCategory: {
      'Mineral Products': { imports: { usd: 80_000,  weight: 50_000  }, exports: { usd: 200_000, weight: 180_000 } },
      'Wood Products':    { imports: { usd: 10_000,  weight: 8_000   }, exports: { usd: 80_000,  weight: 100_000 } },
    },
  },
  {
    iso3: 'MEX', name: 'Mexico', lat: 23.63, lng: -102.55,
    imports: { usd: 500_000, weight: 180_000 },
    exports: { usd: 480_000, weight: 200_000 },
    byCategory: {
      'Transport Equipment': { imports: { usd: 100_000, weight: 40_000 }, exports: { usd: 120_000, weight: 50_000 } },
      'Machinery':           { imports: { usd: 150_000, weight: 40_000 }, exports: { usd: 100_000, weight: 30_000 } },
    },
  },
  {
    iso3: 'IND', name: 'India', lat: 20.59, lng: 78.96,
    imports: { usd: 700_000, weight: 450_000 },
    exports: { usd: 450_000, weight: 320_000 },
    byCategory: {
      'Mineral Products': { imports: { usd: 200_000, weight: 250_000 }, exports: { usd: 50_000,  weight: 30_000 } },
      'Textiles':         { imports: { usd: 30_000,  weight: 15_000  }, exports: { usd: 120_000, weight: 80_000 } },
    },
  },
  {
    iso3: 'BRA', name: 'Brazil', lat: -14.23, lng: -51.92,
    imports: { usd: 450_000, weight: 200_000 },
    exports: { usd: 550_000, weight: 400_000 },
    byCategory: {
      'Vegetable Products': { imports: { usd: 20_000,  weight: 30_000  }, exports: { usd: 150_000, weight: 200_000 } },
      'Mineral Products':   { imports: { usd: 100_000, weight: 50_000  }, exports: { usd: 80_000,  weight: 100_000 } },
    },
  },
  {
    iso3: 'AUS', name: 'Australia', lat: -25.27, lng: 133.77,
    imports: { usd: 380_000, weight: 120_000 },
    exports: { usd: 420_000, weight: 600_000 },
    byCategory: {
      'Mineral Products': { imports: { usd: 60_000, weight: 30_000 }, exports: { usd: 200_000, weight: 400_000 } },
      'Live Animals':     { imports: { usd: 5_000,  weight: 3_000  }, exports: { usd: 30_000,  weight: 50_000  } },
    },
  },
  {
    iso3: 'SAU', name: 'Saudi Arabia', lat: 23.88, lng: 45.07,
    imports: { usd: 200_000, weight: 80_000 },
    exports: { usd: 350_000, weight: 500_000 },
    byCategory: {
      'Mineral Products': { imports: { usd: 20_000, weight: 10_000 }, exports: { usd: 280_000, weight: 450_000 } },
    },
  },
  {
    iso3: 'RUS', name: 'Russia', lat: 61.52, lng: 105.31,
    imports: { usd: 280_000, weight: 150_000 },
    exports: { usd: 450_000, weight: 800_000 },
    byCategory: {
      'Mineral Products': { imports: { usd: 30_000, weight: 20_000  }, exports: { usd: 300_000, weight: 600_000 } },
      'Metals':           { imports: { usd: 20_000, weight: 15_000  }, exports: { usd: 80_000,  weight: 100_000 } },
    },
  },
  {
    iso3: 'ZAF', name: 'South Africa', lat: -30.55, lng: 22.93,
    imports: { usd: 120_000, weight: 50_000 },
    exports: { usd: 100_000, weight: 120_000 },
    byCategory: {
      'Metals':           { imports: { usd: 20_000, weight: 10_000 }, exports: { usd: 40_000, weight: 60_000 } },
      'Mineral Products': { imports: { usd: 30_000, weight: 20_000 }, exports: { usd: 30_000, weight: 40_000 } },
    },
  },
]

// ─── Trade flows (arrows on globe) ───────────────────────────────────────────

export const TRADE_FLOWS: TradeFlow[] = [
  { fromIso3: 'CHN', fromLat: 35.86, fromLng: 104.19, toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 600_000, weight: 200_000, type: 'export' },
  { fromIso3: 'USA', fromLat: 37.09, fromLng: -95.71, toIso3: 'CHN', toLat: 35.86, toLng: 104.19, usd: 200_000, weight: 80_000,  type: 'export' },
  { fromIso3: 'DEU', fromLat: 51.16, fromLng: 10.45,  toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 150_000, weight: 50_000,  type: 'export' },
  { fromIso3: 'JPN', fromLat: 36.20, fromLng: 138.25, toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 130_000, weight: 40_000,  type: 'export' },
  { fromIso3: 'CHN', fromLat: 35.86, fromLng: 104.19, toIso3: 'DEU', toLat: 51.16, toLng: 10.45,  usd: 120_000, weight: 60_000,  type: 'export' },
  { fromIso3: 'SAU', fromLat: 23.88, fromLng: 45.07,  toIso3: 'CHN', toLat: 35.86, toLng: 104.19, usd: 100_000, weight: 200_000, type: 'export' },
  { fromIso3: 'SAU', fromLat: 23.88, fromLng: 45.07,  toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 80_000,  weight: 150_000, type: 'export' },
  { fromIso3: 'AUS', fromLat: -25.27, fromLng: 133.77, toIso3: 'CHN', toLat: 35.86, toLng: 104.19, usd: 100_000, weight: 300_000, type: 'export' },
  { fromIso3: 'BRA', fromLat: -14.23, fromLng: -51.92, toIso3: 'CHN', toLat: 35.86, toLng: 104.19, usd: 90_000,  weight: 180_000, type: 'export' },
  { fromIso3: 'RUS', fromLat: 61.52, fromLng: 105.31, toIso3: 'DEU', toLat: 51.16, toLng: 10.45,  usd: 80_000,  weight: 200_000, type: 'export' },
  { fromIso3: 'MEX', fromLat: 23.63, fromLng: -102.55, toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 200_000, weight: 70_000, type: 'export' },
  { fromIso3: 'CAN', fromLat: 56.13, fromLng: -106.34, toIso3: 'USA', toLat: 37.09, toLng: -95.71, usd: 250_000, weight: 120_000, type: 'export' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getCountry(iso3: string): CountryTrade | undefined {
  return TRADE_DATA.find(c => c.iso3.toUpperCase() === iso3.toUpperCase())
}

export function getTradeValue(
  country: CountryTrade,
  type: 'imports' | 'exports',
  metric: 'usd' | 'weight',
  category: string | null,
): number {
  if (category) {
    return country.byCategory[category]?.[type]?.[metric] ?? 0
  }
  return country[type][metric]
}

/**
 * Map a normalised value [0,1] to a hex colour.
 * Imports → blue gradient, Exports → orange gradient.
 */
export function valueToColor(value: number, max: number, type: 'imports' | 'exports'): string {
  if (max === 0) return '#1a1a2e'
  const t = Math.min(value / max, 1)
  if (type === 'imports') {
    const r = Math.round(20  + (10  - 20)  * t)
    const g = Math.round(60  + (100 - 60)  * t)
    const b = Math.round(160 + (255 - 160) * t)
    return `rgb(${r},${g},${b})`
  } else {
    const r = Math.round(180 + (255 - 180) * t)
    const g = Math.round(80  + (120 - 80)  * t)
    const b = Math.round(20  + (0   - 20)  * t)
    return `rgb(${r},${g},${b})`
  }
}

// ─── Search index ─────────────────────────────────────────────────────────────

export const YEARS: number[] = Array.from({ length: 36 }, (_, i) => 1988 + i)

export const SEARCH_ITEMS: SearchItem[] = [
  ...TRADE_DATA.map(c => ({
    type: 'country' as const,
    label: c.name,
    path: `/countries/${c.iso3.toLowerCase()}`,
  })),
  ...CATEGORIES.map(cat => ({
    type: 'category' as const,
    label: cat,
    path: `/categories/${cat.toLowerCase().replace(/[\s&]+/g, '-').replace(/-+/g, '-')}`,
  })),
  ...YEARS.map(y => ({
    type: 'year' as const,
    label: String(y),
    path: `/years/${y}`,
  })),
]