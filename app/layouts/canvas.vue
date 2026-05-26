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

// ─── Map interactions ─────────────────────────────────────────────────────────

function setupInteractions(m: mapboxgl.Map) {
  let hoveredId: number | string | null = null

  m.on('mousemove', 'country-fills', (e) => {
    if (route.path !== '/') return
    if (!e.features?.length) return

    if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })
    hoveredId = e.features[0]?.id ?? null
    if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true })
    m.getCanvas().style.cursor = 'pointer'

    if (!showFlows.value) {
      isHovering.value = true
      const props = e.features[0]?.properties
      if (props) updateTradeConnections(props.name ?? '', props['ISO3166-1-Alpha-3'] ?? '')
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
    if (route.path !== '/') return
    if (!e.features?.length) return
    const props = e.features[0]?.properties
    if (!props) return
    const iso3 = props['ISO3166-1-Alpha-3'] || props.iso3 || props.ISO_A3
    if (iso3) router.push(`/countries/${iso3.toLowerCase()}`)
  })
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
