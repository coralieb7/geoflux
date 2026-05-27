<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    <div ref="mapContainer" class="absolute inset-0 z-0 w-full h-full" style="height: 100vh; width: 100vw;" />

    <div class="absolute inset-0 z-10 pointer-events-none">
      <slot />
    </div>

    <MapLegend :visible="isHovering || showFlows" />
  </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TRADE_DATA, getTradeValue, valueToColor } from '~/utils/dummyData'

const config    = useRuntimeConfig()
const router    = useRouter()
const route     = useRoute()
const colorMode = useColorMode()
const isDark    = computed(() => colorMode.value === 'dark')

const { showImports, showExports, metric, selectedCategory, showFlows } = useTradeState()

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null

const isHovering = ref(false)

const { clearTradeConnections, showAllTradeConnections, updateTradeConnections } =
  useTradeConnections(() => map)

// Flag: set true when click handler already triggered flyTo so the route watcher skips it
let mapClickDidFlyTo = false

// ─── ISO3 resolution ──────────────────────────────────────────────────────────
// Some countries (France, Norway) have "-99" as their ISO3166-1-Alpha-3 code in
// the GeoJSON. Fall back to matching by feature name against TRADE_DATA.
function resolveIso3(props: Record<string, any>): string | null {
  const raw = props['ISO3166-1-Alpha-3']
  if (raw && raw !== '-99') return (raw as string).toUpperCase()

  // Fallback: match by country name
  const name: string | undefined = props.name || props.NAME || props.ADMIN
  if (!name) return null
  return TRADE_DATA.find(c => c.name === name)?.iso3.toUpperCase() ?? null
}

// ─── Map visuals ──────────────────────────────────────────────────────────────

function updateMapVisuals() {
  const m = map
  if (!m) return

  const colorExpression: any[] = ['match', ['get', 'ISO3166-1-Alpha-3']]
  let maxValue = 0

  TRADE_DATA.forEach(country => {
    let val = 0
    if (showImports.value) val += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
    if (showExports.value) val += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
    if (val > maxValue) maxValue = val
  })

  if (maxValue === 0 || (!showImports.value && !showExports.value)) {
    m.setPaintProperty('country-fills', 'fill-color', isDark.value ? '#3f3f46' : '#e4e4e7')
    return
  }

  let gradientType: 'imports' | 'exports' | 'both' = 'imports'
  if (showImports.value && showExports.value) gradientType = 'both'
  else if (showExports.value) gradientType = 'exports'

  TRADE_DATA.forEach(country => {
    let val = 0
    if (showImports.value) val += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
    if (showExports.value) val += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
    if (val > 0) {
      colorExpression.push(country.iso3.toUpperCase())
      colorExpression.push(valueToColor(val, maxValue, gradientType))
    }
  })

  colorExpression.push(isDark.value ? '#27272a' : '#f4f4f5')
  m.setPaintProperty('country-fills', 'fill-color', colorExpression as any)
}

// ─── Map interactions ─────────────────────────────────────────────────────────

function setupInteractions(m: mapboxgl.Map) {
  let hoveredId: number | string | null = null
  let isNavigating = false

  m.on('mousemove', 'country-fills', (e) => {
    if (route.path !== '/') return
    if (!e.features?.length) return

    const props = e.features[0]?.properties
    if (!props) return
    const iso3 = resolveIso3(props)
    const hasData = iso3 ? TRADE_DATA.some(c => c.iso3.toUpperCase() === iso3) : false

    if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })

    if (hasData) {
      hoveredId = e.features[0]?.id ?? null
      if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true })
      m.getCanvas().style.cursor = 'pointer'

      if (!showFlows.value) {
        isHovering.value = true
        // Pass the resolved iso3 so trade connections work for France/Norway too
        updateTradeConnections(props.name ?? '', iso3 ?? '')
      }
    } else {
      hoveredId = null
      m.getCanvas().style.cursor = ''
      if (!showFlows.value) {
        isHovering.value = false
        clearTradeConnections()
      }
    }
  })

  m.on('mouseleave', 'country-fills', () => {
    if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })
    hoveredId = null
    m.getCanvas().style.cursor = ''
    if (!showFlows.value) {
      isHovering.value = false
      clearTradeConnections()
    }
  })

  m.on('click', 'country-fills', (e) => {
    if (route.path !== '/' || isNavigating) return
    if (!e.features?.length) return
    const props = e.features[0]?.properties
    if (!props) return

    const iso3 = resolveIso3(props)
    if (!iso3) return

    const country = TRADE_DATA.find(c => c.iso3.toUpperCase() === iso3)
    if (!country) return

    isNavigating = true
    mapClickDidFlyTo = true  // tell the route watcher not to duplicate the flyTo

    // Zoom into the country, then navigate after a short delay
    m.flyTo({ center: [country.lng, country.lat], zoom: 3.5, duration: 1800, essential: true })
    setTimeout(() => {
      router.push(`/countries/${iso3.toLowerCase()}`)
      isNavigating = false
    }, 650)
  })
}

// ─── Reactive watchers (top-level so they fire correctly across layout/page) ──

watch([showImports, showExports, metric, selectedCategory], () => {
  if (map?.isStyleLoaded()) updateMapVisuals()
})

watch(showFlows, (val) => {
  if (!map?.isStyleLoaded()) return
  val ? showAllTradeConnections() : clearTradeConnections()
})

// ─── Map initialisation ───────────────────────────────────────────────────────

onMounted(async () => {
  if (!import.meta.client) return

  mapboxgl.accessToken = config.public.mapboxAccessToken || ''

  const m = new mapboxgl.Map({
    container: mapContainer.value as HTMLElement,
    style: isDark.value ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
    projection: 'globe',
    center: [0, 20],
    zoom: 1.5,
    pitch: 10,
  })
  map = m

  m.on('load', () => {
    m.addSource('countries', { type: 'geojson', data: '/geojson/countries.geojson', generateId: true })
    m.addLayer({
      id: 'country-fills',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#333333',
        'fill-opacity': 0.8,
        'fill-outline-color': isDark.value ? '#111' : '#fff',
      },
    }, 'waterway-label')
    m.addLayer({
      id: 'country-fills-hover',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.18, 0],
      },
    }, 'waterway-label')

    const emptyFC = { type: 'FeatureCollection' as const, features: [] }
    m.addSource('trade-connection-lines', { type: 'geojson', data: emptyFC })
    m.addSource('trade-connection-dots',  { type: 'geojson', data: emptyFC })

    const flowColor: any = ['match', ['get', 'flowType'],
      'import', '#3b82f6',
      'export', '#f97316',
      'both',   '#a855f7',
      '#888888',
    ]
    m.addLayer({
      id: 'trade-connection-lines',
      type: 'line',
      source: 'trade-connection-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': flowColor, 'line-width': 2, 'line-opacity': 0.85 },
    })
    m.addLayer({
      id: 'trade-connection-dots',
      type: 'circle',
      source: 'trade-connection-dots',
      paint: {
        'circle-radius': 6,
        'circle-color': flowColor,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95,
      },
    })

    setupInteractions(m)
    updateMapVisuals()
  })

  // Enable/disable map interaction based on whether we're on the home page
  watch(() => route.path, (path) => {
    const enable = path === '/'
    m.dragPan   [enable ? 'enable' : 'disable']()
    m.scrollZoom[enable ? 'enable' : 'disable']()
    m.dragRotate[enable ? 'enable' : 'disable']()
  }, { immediate: true })

  // FlyTo whenever navigating to any country/imports/exports page.
  // Skips if the map click handler already triggered the flyTo.
  watch(() => route.path, (newPath, oldPath) => {
    // If the click handler already kicked off a flyTo, consume the flag and skip
    if (mapClickDidFlyTo) {
      mapClickDidFlyTo = false
      return
    }

    const newMatch = newPath.match(/^\/(countries|imports|exports)\/([^/]+)$/)
    const oldMatch = oldPath?.match(/^\/(countries|imports|exports)\/([^/]+)$/)
    if (!newMatch) return

    const newIso3 = newMatch[2]!.toUpperCase()
    const oldIso3 = oldMatch?.[2]?.toUpperCase()
    if (newIso3 === oldIso3) return  // same country, no need to move

    const country = TRADE_DATA.find(c => c.iso3.toUpperCase() === newIso3)
    if (country && m.isStyleLoaded()) {
      m.flyTo({ center: [country.lng, country.lat], zoom: 3, duration: 1500 })
    }
  })

  watch(colorMode, (mode) => {
    m.setStyle(mode.value === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11')
  })
})

onUnmounted(() => map?.remove())
</script>