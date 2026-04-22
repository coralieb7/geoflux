// composables/useTradeState.ts
export const useTradeState = () => {
  const showImports = useState<boolean>('trade-imports', () => false)
  const showExports = useState<boolean>('trade-exports', () => false)
  const metric = useState<'usd' | 'weight'>('trade-metric', () => 'usd')
  const selectedCategory = useState<string | null>('trade-category', () => null)
  const showFlows = useState<boolean>('trade-flows', () => false)

  return { showImports, showExports, metric, selectedCategory, showFlows }
}