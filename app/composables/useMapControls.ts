// app/composables/useMapControls.ts
// Shared reactive state for the globe controls panel.
// useState keeps it alive across layout/page component boundaries.

export type Metric = 'usd' | 'weight'

export const useMapControls = () => {
  const showImports      = useState<boolean>('map-show-imports',   () => false)
  const showExports      = useState<boolean>('map-show-exports',   () => false)
  const metric           = useState<Metric> ('map-metric',         () => 'usd')
  const selectedCategory = useState<string | null>('map-category', () => null)
  const showArrows       = useState<boolean>('map-show-arrows',    () => false)
  const categoryExpanded = useState<boolean>('map-cat-expanded',   () => false)

  return {
    showImports,
    showExports,
    metric,
    selectedCategory,
    showArrows,
    categoryExpanded,
  }
}