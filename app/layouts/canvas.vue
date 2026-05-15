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
import { TRADE_DATA, TRADE_FLOWS, getTradeValue, valueToColor } from '~/utils/dummyData'

const config    = useRuntimeConfig()
const router    = useRouter()
const route     = useRoute()
const colorMode = useColorMode()
const isDark    = computed(() => colorMode.value === 'dark')

const { showImports, showExports, metric, selectedCategory, showFlows } = useTradeState()

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null

const { isHovering, clearTradeConnections, showAllTradeConnections, setupInteractions } =
  useTradeConnections({ route, router, showFlows })

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

  TRADE_DATA.forEach(country => {
    let val = 0
    if (showImports.value) val += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
    if (showExports.value) val += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
    const gradientType = showExports.value && !showImports.value ? 'exports' : 'imports'
    if (val > 0) {
      colorExpression.push(country.iso3.toUpperCase())
      colorExpression.push(valueToColor(val, maxValue, gradientType))
    }
  })

  colorExpression.push(isDark.value ? '#27272a' : '#f4f4f5')
  m.setPaintProperty('country-fills', 'fill-color', colorExpression as any)
}

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
    // Countries fill layers
    m.addSource('countries', { type: 'geojson', data: '/geojson/countries.geojson', generateId: true })
    m.addLayer({
      id: 'country-fills',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#333333',
        'fill-opacity': 0,
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

    // Static trade-flow lines (decorative, hidden by default)
    m.addSource('flows', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: TRADE_FLOWS.map((flow, idx) => ({
          type: 'Feature',
          id: idx,
          geometry: { type: 'LineString', coordinates: [[flow.fromLng, flow.fromLat], [flow.toLng, flow.toLat]] },
          properties: { weight: flow.weight, usd: flow.usd },
        })) as any,
      },
    })
    m.addLayer({
      id: 'flow-lines',
      type: 'line',
      source: 'flows',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#a855f7',
        'line-width': ['interpolate', ['linear'], ['get', 'usd'], 0, 1, 1_000_000, 4],
        'line-opacity': 0,
      },
    })

    // Dynamic trade-connection layers (populated on hover / showFlows)
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

  // Reactivity
  watch([showImports, showExports, metric, selectedCategory], () => {
    if (m.isStyleLoaded()) updateMapVisuals()
  })

  watch(showFlows, (val) => {
    if (!m.isStyleLoaded()) return
    val ? showAllTradeConnections() : clearTradeConnections()
  })

  watch(() => route.path, (path) => {
    const enable = path === '/'
    m.dragPan   [enable ? 'enable' : 'disable']()
    m.scrollZoom[enable ? 'enable' : 'disable']()
    m.dragRotate[enable ? 'enable' : 'disable']()
  }, { immediate: true })

  watch(colorMode, (mode) => {
    m.setStyle(mode.value === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11')
  })
})

onUnmounted(() => map?.remove())
</script>
