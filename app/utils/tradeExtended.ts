import { TRADE_DATA, CATEGORIES, type CountryTrade } from './dummyData'

// ─── Commodity types ──────────────────────────────────────────────────────────

export interface Commodity {
  id: string
  name: string
  category: string
  imports: { usd: number; weight: number }
  exports: { usd: number; weight: number }
}

export interface YearlyPoint {
  year: number
  imports: { usd: number; weight: number }
  exports: { usd: number; weight: number }
}

export interface YearSnapshot {
  year: number
  totalImports: { usd: number; weight: number }
  totalExports: { usd: number; weight: number }
  topImportCategories: Array<{ name: string; usd: number }>
  topExportCategories: Array<{ name: string; usd: number }>
  topImportCountries: Array<{ iso3: string; name: string; usd: number }>
  topExportCountries: Array<{ iso3: string; name: string; usd: number }>
  historicalNote: string
}

// ─── Commodities per category ─────────────────────────────────────────────────

const RAW_COMMODITIES: Array<{ name: string; category: string; importFraction: number; exportFraction: number }> = [
  { name: 'Live cattle',        category: 'Live Animals',        importFraction: 0.45, exportFraction: 0.40 },
  { name: 'Live swine',         category: 'Live Animals',        importFraction: 0.30, exportFraction: 0.35 },
  { name: 'Live sheep',         category: 'Live Animals',        importFraction: 0.15, exportFraction: 0.15 },
  { name: 'Live poultry',       category: 'Live Animals',        importFraction: 0.10, exportFraction: 0.10 },

  { name: 'Cereals',            category: 'Vegetable Products',  importFraction: 0.40, exportFraction: 0.45 },
  { name: 'Oilseeds',           category: 'Vegetable Products',  importFraction: 0.30, exportFraction: 0.30 },
  { name: 'Fruits & nuts',      category: 'Vegetable Products',  importFraction: 0.20, exportFraction: 0.15 },
  { name: 'Coffee & tea',       category: 'Vegetable Products',  importFraction: 0.10, exportFraction: 0.10 },

  { name: 'Palm oil',           category: 'Fats & Oils',         importFraction: 0.40, exportFraction: 0.50 },
  { name: 'Soybean oil',        category: 'Fats & Oils',         importFraction: 0.35, exportFraction: 0.30 },
  { name: 'Sunflower oil',      category: 'Fats & Oils',         importFraction: 0.15, exportFraction: 0.12 },
  { name: 'Animal fats',        category: 'Fats & Oils',         importFraction: 0.10, exportFraction: 0.08 },

  { name: 'Sugar',              category: 'Foodstuffs',          importFraction: 0.25, exportFraction: 0.30 },
  { name: 'Beverages',          category: 'Foodstuffs',          importFraction: 0.30, exportFraction: 0.25 },
  { name: 'Prepared food',      category: 'Foodstuffs',          importFraction: 0.30, exportFraction: 0.30 },
  { name: 'Tobacco',            category: 'Foodstuffs',          importFraction: 0.15, exportFraction: 0.15 },

  { name: 'Crude petroleum',    category: 'Mineral Products',    importFraction: 0.55, exportFraction: 0.60 },
  { name: 'Natural gas',        category: 'Mineral Products',    importFraction: 0.25, exportFraction: 0.25 },
  { name: 'Coal',               category: 'Mineral Products',    importFraction: 0.12, exportFraction: 0.10 },
  { name: 'Iron ore',           category: 'Mineral Products',    importFraction: 0.08, exportFraction: 0.05 },

  { name: 'Pharmaceuticals',    category: 'Chemical Products',   importFraction: 0.40, exportFraction: 0.35 },
  { name: 'Fertilizers',        category: 'Chemical Products',   importFraction: 0.20, exportFraction: 0.22 },
  { name: 'Organic chemicals',  category: 'Chemical Products',   importFraction: 0.25, exportFraction: 0.28 },
  { name: 'Dyes & pigments',    category: 'Chemical Products',   importFraction: 0.15, exportFraction: 0.15 },

  { name: 'Plastic articles',   category: 'Plastics & Rubber',   importFraction: 0.50, exportFraction: 0.50 },
  { name: 'Rubber products',    category: 'Plastics & Rubber',   importFraction: 0.30, exportFraction: 0.30 },
  { name: 'Synthetic polymers', category: 'Plastics & Rubber',   importFraction: 0.20, exportFraction: 0.20 },

  { name: 'Lumber',             category: 'Wood Products',       importFraction: 0.45, exportFraction: 0.40 },
  { name: 'Paper & cardboard',  category: 'Wood Products',       importFraction: 0.40, exportFraction: 0.45 },
  { name: 'Cork & articles',    category: 'Wood Products',       importFraction: 0.15, exportFraction: 0.15 },

  { name: 'Cotton fabrics',     category: 'Textiles',            importFraction: 0.25, exportFraction: 0.20 },
  { name: 'Synthetic fabrics',  category: 'Textiles',            importFraction: 0.25, exportFraction: 0.25 },
  { name: 'Apparel',            category: 'Textiles',            importFraction: 0.35, exportFraction: 0.40 },
  { name: 'Footwear',           category: 'Textiles',            importFraction: 0.15, exportFraction: 0.15 },

  { name: 'Steel',              category: 'Metals',              importFraction: 0.40, exportFraction: 0.38 },
  { name: 'Aluminum',           category: 'Metals',              importFraction: 0.25, exportFraction: 0.28 },
  { name: 'Copper',             category: 'Metals',              importFraction: 0.20, exportFraction: 0.20 },
  { name: 'Precious metals',    category: 'Metals',              importFraction: 0.15, exportFraction: 0.14 },

  { name: 'Electrical machinery', category: 'Machinery',         importFraction: 0.35, exportFraction: 0.35 },
  { name: 'Industrial machinery', category: 'Machinery',         importFraction: 0.30, exportFraction: 0.30 },
  { name: 'Computers',            category: 'Machinery',         importFraction: 0.20, exportFraction: 0.22 },
  { name: 'Semiconductors',       category: 'Machinery',         importFraction: 0.15, exportFraction: 0.13 },

  { name: 'Automobiles',          category: 'Transport Equipment', importFraction: 0.55, exportFraction: 0.55 },
  { name: 'Aircraft',             category: 'Transport Equipment', importFraction: 0.20, exportFraction: 0.22 },
  { name: 'Ships',                category: 'Transport Equipment', importFraction: 0.15, exportFraction: 0.13 },
  { name: 'Rail equipment',       category: 'Transport Equipment', importFraction: 0.10, exportFraction: 0.10 },
]

// Aggregate category totals across all countries
function getCategoryTotals(): Record<string, { imports: { usd: number; weight: number }; exports: { usd: number; weight: number } }> {
  const totals: Record<string, { imports: { usd: number; weight: number }; exports: { usd: number; weight: number } }> = {}
  CATEGORIES.forEach(cat => {
    totals[cat] = { imports: { usd: 0, weight: 0 }, exports: { usd: 0, weight: 0 } }
  })
  TRADE_DATA.forEach(country => {
    Object.entries(country.byCategory).forEach(([cat, data]) => {
      if (totals[cat] && data) {
        totals[cat].imports.usd += data.imports.usd
        totals[cat].imports.weight += data.imports.weight
        totals[cat].exports.usd += data.exports.usd
        totals[cat].exports.weight += data.exports.weight
      }
    })
  })
  return totals
}

const CATEGORY_TOTALS = getCategoryTotals()

export const COMMODITIES: Commodity[] = RAW_COMMODITIES.map(raw => {
  const catTotal = CATEGORY_TOTALS[raw.category]
  return {
    id: raw.name.toLowerCase().replace(/[\s&/,]+/g, '-').replace(/-+/g, '-'),
    name: raw.name,
    category: raw.category,
    imports: {
      usd:    Math.round((catTotal?.imports.usd    ?? 0) * raw.importFraction),
      weight: Math.round((catTotal?.imports.weight ?? 0) * raw.importFraction),
    },
    exports: {
      usd:    Math.round((catTotal?.exports.usd    ?? 0) * raw.exportFraction),
      weight: Math.round((catTotal?.exports.weight ?? 0) * raw.exportFraction),
    },
  }
})

export function getCommoditiesByCategory(category: string): Commodity[] {
  return COMMODITIES.filter(c => c.category === category)
}

export function getCommodityById(id: string): Commodity | undefined {
  return COMMODITIES.find(c => c.id === id)
}

// ─── Yearly time-series generation ───────────────────────────────────────────

// Dips applied to growth multiplier for specific years
const YEAR_DIPS: Record<number, number> = {
  1997: 0.85, // Asian financial crisis
  2001: 0.90, // 9/11 & dot-com bust
  2002: 0.92,
  2009: 0.78, // Global financial crisis
  2015: 0.93, // Commodity price crash
  2016: 0.94,
  2020: 0.82, // COVID-19
  2021: 1.15, // Rebound
}

function growthMultiplier(year: number): number {
  // Logistic-like growth: ~10% of 2023 value in 1988, ~100% in 2023
  const t = (year - 1988) / (2023 - 1988) // 0 → 1
  const base = 0.10 + 0.90 * (t ** 1.6)
  return base * (YEAR_DIPS[year] ?? 1)
}

export function getCountryYearlySeries(country: CountryTrade): YearlyPoint[] {
  return Array.from({ length: 36 }, (_, i) => {
    const year = 1988 + i
    const m = growthMultiplier(year)
    // Add small noise ±3%
    const noise = () => 1 + (Math.sin(year * 17 + country.lat) * 0.03)
    return {
      year,
      imports: {
        usd:    Math.round(country.imports.usd    * m * noise()),
        weight: Math.round(country.imports.weight * m * noise()),
      },
      exports: {
        usd:    Math.round(country.exports.usd    * m * noise()),
        weight: Math.round(country.exports.weight * m * noise()),
      },
    }
  })
}

export function getCategoryYearlySeries(category: string): YearlyPoint[] {
  const totals = CATEGORY_TOTALS[category]
  if (!totals) return []
  return Array.from({ length: 36 }, (_, i) => {
    const year = 1988 + i
    const m = growthMultiplier(year)
    return {
      year,
      imports: {
        usd:    Math.round(totals.imports.usd    * m),
        weight: Math.round(totals.imports.weight * m),
      },
      exports: {
        usd:    Math.round(totals.exports.usd    * m),
        weight: Math.round(totals.exports.weight * m),
      },
    }
  })
}

export function getCommodityYearlySeries(commodity: Commodity): YearlyPoint[] {
  return Array.from({ length: 36 }, (_, i) => {
    const year = 1988 + i
    const m = growthMultiplier(year)
    return {
      year,
      imports: {
        usd:    Math.round(commodity.imports.usd    * m),
        weight: Math.round(commodity.imports.weight * m),
      },
      exports: {
        usd:    Math.round(commodity.exports.usd    * m),
        weight: Math.round(commodity.exports.weight * m),
      },
    }
  })
}

// ─── Year snapshots ───────────────────────────────────────────────────────────

const HISTORICAL_NOTES: Record<number, string> = {
  1988: 'Year of reference — Cold War nearing its end. Trade volumes dominated by OECD nations.',
  1990: 'German reunification reshapes European trade flows. Gulf War begins, spiking oil prices.',
  1991: 'Soviet Union dissolves, opening new Eastern European markets.',
  1994: 'NAFTA enters into force, reshaping North American supply chains.',
  1995: 'WTO replaces GATT, establishing binding global trade rules.',
  1997: 'Asian financial crisis causes sharp contraction in regional trade.',
  2001: 'China joins the WTO. September 11 temporarily disrupts global shipping.',
  2003: 'Iraq War raises energy market uncertainty; SARS dents Asian trade.',
  2007: 'Global commodities supercycle peaks. Subprime mortgage crisis begins.',
  2008: 'Lehman Brothers collapse triggers global credit freeze and trade finance crunch.',
  2009: 'Worst year for world trade since WWII — global exports fell ~23%.',
  2011: 'Japanese earthquake & tsunami disrupts global electronics supply chains. Arab Spring reshapes MENA trade.',
  2015: 'Commodity price crash weighs on resource-exporting economies.',
  2018: 'US–China trade war begins. First wave of tariff escalations.',
  2019: 'Phase-one trade deal reduces US–China tariff tensions slightly.',
  2020: 'COVID-19 pandemic causes the second-largest trade collapse on record.',
  2021: 'Historic rebound (+12%) driven by restocking and stimulus spending.',
  2022: 'Russia–Ukraine war disrupts energy and grain markets; record inflation.',
  2023: 'Trade growth slows amid tight monetary policy and geopolitical fragmentation.',
}

export function getYearSnapshot(year: number): YearSnapshot {
  const m = growthMultiplier(year)

  const totalImports = {
    usd:    Math.round(TRADE_DATA.reduce((s, c) => s + c.imports.usd, 0)    * m),
    weight: Math.round(TRADE_DATA.reduce((s, c) => s + c.imports.weight, 0) * m),
  }
  const totalExports = {
    usd:    Math.round(TRADE_DATA.reduce((s, c) => s + c.exports.usd, 0)    * m),
    weight: Math.round(TRADE_DATA.reduce((s, c) => s + c.exports.weight, 0) * m),
  }

  const topImportCategories = CATEGORIES
    .map(cat => ({ name: cat, usd: Math.round((CATEGORY_TOTALS[cat]?.imports.usd ?? 0) * m) }))
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)

  const topExportCategories = CATEGORIES
    .map(cat => ({ name: cat, usd: Math.round((CATEGORY_TOTALS[cat]?.exports.usd ?? 0) * m) }))
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)

  const topImportCountries = [...TRADE_DATA]
    .map(c => ({ iso3: c.iso3, name: c.name, usd: Math.round(c.imports.usd * m) }))
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)

  const topExportCountries = [...TRADE_DATA]
    .map(c => ({ iso3: c.iso3, name: c.name, usd: Math.round(c.exports.usd * m) }))
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 5)

  // Find closest note at or before this year
  const noteYear = [...Object.keys(HISTORICAL_NOTES).map(Number)]
    .filter(y => y <= year)
    .sort((a, b) => b - a)[0]

  return {
    year,
    totalImports,
    totalExports,
    topImportCategories,
    topExportCategories,
    topImportCountries,
    topExportCountries,
    historicalNote: HISTORICAL_NOTES[noteYear] ?? `Global trade data for ${year}.`,
  }
}

// ─── Growth calculations ──────────────────────────────────────────────────────

export function calcGrowth(currentUsd: number, baseYear: number, currentYear: number, baseUsd?: number): number {
  const base = baseUsd ?? currentUsd * (growthMultiplier(baseYear) / growthMultiplier(currentYear))
  if (base === 0) return 0
  return ((currentUsd - base) / base) * 100
}

export function calcWorldShare(countryUsd: number, type: 'imports' | 'exports'): number {
  const worldTotal = TRADE_DATA.reduce((s, c) => s + c[type].usd, 0)
  if (worldTotal === 0) return 0
  return (countryUsd / worldTotal) * 100
}
