import type { Ref } from 'vue'
import { TRADE_DATA, TRADE_CONNECTIONS } from '~/utils/dummyData'
import {
  CENTROIDS,
  getCountryLngLat,
  getPartnerLngLat,
  resolveConnectionKey,
  buildConnectionFeatures,
} from '~/utils/tradeConnectionUtils'

interface Deps {
  route:     ReturnType<typeof useRoute>
  router:    ReturnType<typeof useRouter>
  showFlows: Ref<boolean>
}

export function useTradeConnections(deps: Deps) {
  const isHovering = ref(false)
  let hoveredId: number | string | null = null
  // Stored when setupInteractions is called; avoids a cross-file type conflict
  // with mapboxgl's Map declaration.
  let map: any = null

  function setSource(id: string, features: GeoJSON.Feature[]) {
    map?.getSource(id)?.setData({ type: 'FeatureCollection', features })
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

  // Wires up all map event listeners. Call once inside the map 'load' handler.
  function setupInteractions(mapInstance: any) {
    map = mapInstance

    map.on('mousemove', 'country-fills', (e: any) => {
      if (deps.route.path !== '/') return
      if (!e.features?.length) return

      if (hoveredId !== null) {
        map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })
      }
      hoveredId = e.features[0]?.id ?? null
      if (hoveredId !== null) {
        map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true })
      }
      map.getCanvas().style.cursor = 'pointer'

      if (!deps.showFlows.value) {
        isHovering.value = true
        const props = e.features[0]?.properties
        if (props) updateTradeConnections(props.name ?? '', props['ISO3166-1-Alpha-3'] ?? '')
      }
    })

    map.on('mouseleave', 'country-fills', () => {
      if (hoveredId !== null) {
        map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })
      }
      hoveredId = null
      map.getCanvas().style.cursor = ''

      if (!deps.showFlows.value) {
        isHovering.value = false
        clearTradeConnections()
      }
    })

    map.on('click', 'country-fills', (e: any) => {
      if (deps.route.path !== '/') return
      if (!e.features?.length) return
      const props = e.features[0]?.properties
      if (!props) return
      const iso3 = props['ISO3166-1-Alpha-3'] || props.iso3 || props.ISO_A3
      if (iso3) deps.router.push(`/countries/${iso3.toLowerCase()}`)
    })
  }

  return {
    isHovering,
    clearTradeConnections,
    showAllTradeConnections,
    setupInteractions,
  }
}
