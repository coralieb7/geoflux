import { TRADE_DATA, TRADE_CONNECTIONS } from '~/utils/dummyData'
import {
  CENTROIDS,
  getCountryLngLat,
  resolveConnectionKey,
  buildConnectionFeatures,
} from '~/utils/tradeConnectionUtils'

export function useTradeConnections(getMap: () => any) {
  function setSource(id: string, features: GeoJSON.Feature[]) {
    getMap()?.getSource(id)?.setData({ type: 'FeatureCollection', features })
  }

  function clearTradeConnections() {
    setSource('trade-connection-lines', [])
    setSource('trade-connection-dots',  [])
  }

  function showAllTradeConnections() {
    const allLines: GeoJSON.Feature[] = []
    const allDots:  GeoJSON.Feature[] = []

    for (const iso3 of Object.keys(TRADE_CONNECTIONS)) {
      const hLngLat  = getCountryLngLat(iso3)
      const yearData = TRADE_CONNECTIONS[iso3]?.['2016']
      if (!hLngLat || !yearData) continue

      const importers = new Set(Object.keys(yearData.top3importers       ?? {}))
      const exporters = new Set(Object.keys(yearData.top3exportCountries ?? {}))
      const { lines, dots } = buildConnectionFeatures(hLngLat, importers, exporters)
      allLines.push(...lines)
      allDots.push(...dots)
    }

    setSource('trade-connection-lines', allLines)
    setSource('trade-connection-dots',  allDots)
  }

  function updateTradeConnections(geoName: string, iso3: string) {
    const key = resolveConnectionKey(geoName, iso3)
    if (!key) { clearTradeConnections(); return }

    const validIso3 = iso3 && iso3 !== '-99' ? iso3 : null
    let hLngLat: [number, number] | null = validIso3 ? getCountryLngLat(validIso3) : null

    if (!hLngLat) {
      const byName = TRADE_DATA.find(c => c.name === geoName)
      if (byName) {
        const k = byName.iso3.toUpperCase()
        hLngLat = CENTROIDS[k] ?? ((byName.lat !== 0 || byName.lng !== 0) ? [byName.lng, byName.lat] : null)
      }
    }
    if (!hLngLat) { clearTradeConnections(); return }

    const yearData = TRADE_CONNECTIONS[key]?.['2016']
    if (!yearData) { clearTradeConnections(); return }

    const importers = new Set(Object.keys(yearData.top3importers))
    const exporters = new Set(Object.keys(yearData.top3exportCountries))
    const { lines, dots } = buildConnectionFeatures(hLngLat, importers, exporters)

    setSource('trade-connection-lines', lines)
    setSource('trade-connection-dots',  dots)
  }

  return { clearTradeConnections, showAllTradeConnections, updateTradeConnections }
}
