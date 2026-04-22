// Base unit in dummyData.ts is millions of USD (e.g. 3_200_000 = $3.2T)

export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}B`
  return `$${value.toLocaleString()}M`
}

export function formatWeight(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}Gt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}Mt`
  return `${value.toLocaleString()}kt`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function categoryToSlug(cat: string): string {
  return cat.toLowerCase().replace(/[\s&]+/g, '-').replace(/-+/g, '-')
}

export function slugToCategory(slug: string, categories: string[]): string | undefined {
  return categories.find(c => categoryToSlug(c) === slug)
}

export function commodityToSlug(name: string): string {
  return name.toLowerCase().replace(/[\s&/,]+/g, '-').replace(/-+/g, '-')
}

export function slugToCommodityName(slug: string, allNames: string[]): string | undefined {
  return allNames.find(n => commodityToSlug(n) === slug)
}
