// composables/useTradeState.ts
interface FlyToRequest { center: [number, number]; zoom: number; stamp: number }

export const useTradeState = () => {
  const showImports      = useState<boolean>('trade-imports',   () => false)
  const showExports      = useState<boolean>('trade-exports',   () => false)
  const metric           = useState<'usd' | 'weight'>('trade-metric', () => 'usd')
  const selectedCategory = useState<string | null>('trade-category', () => null)
  const showFlows        = useState<boolean>('trade-flows',     () => false)
  const selectedYear     = useState<number>('trade-year',       () => 2016)
  const flyToRequest     = useState<FlyToRequest | null>('map-flyto', () => null)
  const mapFlat          = useState<boolean>('map-flat', () => false)

  return { showImports, showExports, metric, selectedCategory, showFlows, selectedYear, flyToRequest, mapFlat }
}