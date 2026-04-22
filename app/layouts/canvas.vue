<template>
  <div class="relative w-screen h-screen overflow-hidden bg-black">
    
    <div ref="mapContainer" class="absolute inset-0 z-0 w-full h-full" style="height: 100vh; width: 100vw;"></div>
    
    <div class="absolute inset-0 z-10 pointer-events-none">
      <slot />
    </div>

  </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TRADE_DATA, TRADE_FLOWS, getTradeValue, valueToColor } from '~/utils/dummyData'

const config = useRuntimeConfig()
const router = useRouter()
const route = useRoute()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// State for reactivity
const { showImports, showExports, metric, selectedCategory, showFlows } = useTradeState()

const mapContainer = ref<HTMLElement | null>(null)
let canvas: mapboxgl.Map

onMounted(async () => {
  if (!import.meta.client) return

  mapboxgl.accessToken = config.public.mapboxAccessToken || ''

  // Initialize Globe
  canvas = new mapboxgl.Map({
    container: mapContainer.value as HTMLElement,
    style: isDark.value ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
    projection: 'globe', // This creates the 3D globe effect
    center: [0, 20],
    zoom: 1.5,
    pitch: 10,
  })

  // Atmosphere and stars styling for globe
//   canvas.on('style.load', () => {
//     canvas.setFog({
//       color: 'rgb(186, 210, 235)', // Lower atmosphere
//       'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
//       'horizon-blend': 0.02,
//       'space-color': 'rgb(11, 11, 25)', // Background space
//        'star-intensity': 0.6 
//     })
//   })

  canvas.on('load', async () => {
    // 1. ADD COUNTRIES LAYER
    // Ensure you have a standard geojson file at this location in your public folder
    canvas.addSource('countries', {
      type: 'geojson',
      data: '/geojson/countries.geojson' 
    })

    canvas.addLayer({
      id: 'country-fills',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#333333', // Default color
        'fill-opacity': 0.,
        'fill-outline-color': isDark.value ? '#111' : '#fff'
      }
    }, 'waterway-label') // Insert before labels so text stays on top

    // 2. ADD FLOWS LAYER (Straight lines for simplicity to start)
    const flowFeatures = TRADE_FLOWS.map((flow, idx) => ({
      type: 'Feature',
      id: idx,
      geometry: {
        type: 'LineString',
        coordinates: [
          [flow.fromLng, flow.fromLat],
          [flow.toLng, flow.toLat]
        ]
      },
      properties: { weight: flow.weight, usd: flow.usd }
    }))

    canvas.addSource('flows', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: flowFeatures as any }
    })

    canvas.addLayer({
      id: 'flow-lines',
      type: 'line',
      source: 'flows',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#a855f7', // Purple-500
        'line-width': ['interpolate', ['linear'], ['get', 'usd'], 0, 1, 1000000, 4],
        'line-opacity': 0, // Hidden by default
      }
    })

    // Setup map interactions
    setupInteractions()
    
    // Initial color calculation
    updateMapVisuals()
  })

  // 3. REACTIVITY: Watch state and update map
  watch([showImports, showExports, metric, selectedCategory, showFlows], () => {
    if (canvas && canvas.isStyleLoaded()) {
      updateMapVisuals()
    }
  })

  // 4. READ-ONLY ON POPUPS: Watch Route
  watch(() => route.path, (newPath) => {
    if (newPath === '/') {
      canvas.dragPan.enable()
      canvas.scrollZoom.enable()
      canvas.dragRotate.enable()
    } else {
      canvas.dragPan.disable()
      canvas.scrollZoom.disable()
      canvas.dragRotate.disable()
    }
  }, { immediate: true })

  // Theme watch
  watch(colorMode, (newVal) => {
    if (canvas) {
      canvas.setStyle(newVal.value === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11')
      // Wait for style to load to re-add sources (omitted here for brevity, usually requires a style.load listener loop)
    }
  })
})

// --- HELPER FUNCTIONS --- //

const updateMapVisuals = () => {
  // Update Flow lines visibility
  canvas.setPaintProperty('flow-lines', 'line-opacity', showFlows.value ? 0.6 : 0)

  // Calculate Country Colors based on dummy data
  // We construct a Mapbox expression: ['match', ['get', 'iso3'], 'USA', 'rgb(x,y,z)', 'CHN', 'rgb(a,b,c)', ... , '#333']
  const colorExpression: any[] = ['match', ['get', 'iso3']] // Note: adjust 'iso3' if your geojson uses 'ISO_A3'

  let maxValue = 0
  
  // First, find max value for relative coloring
  TRADE_DATA.forEach(country => {
    let val = 0
    if (showImports.value) val += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
    if (showExports.value) val += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
    if (val > maxValue) maxValue = val
  })

  if (maxValue === 0 || (!showImports.value && !showExports.value)) {
    // Reset to default
    canvas.setPaintProperty('country-fills', 'fill-color', isDark.value ? '#3f3f46' : '#e4e4e7')
    return
  }

  // Generate color expression array
  TRADE_DATA.forEach(country => {
    let val = 0
    if (showImports.value) val += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
    if (showExports.value) val += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
    
    // Determine gradient type: if both are clicked, fallback to 'imports' logic for now (you can blend this later)
    const gradientType = showExports.value && !showImports.value ? 'exports' : 'imports'
    
    if (val > 0) {
      colorExpression.push(country.iso3.toUpperCase())
      colorExpression.push(valueToColor(val, maxValue, gradientType))
    }
  })

  colorExpression.push(isDark.value ? '#27272a' : '#f4f4f5') // Fallback color

  // Apply to layer
  canvas.setPaintProperty('country-fills', 'fill-color', colorExpression as any)
}

const setupInteractions = () => {
  // Click on a country
  canvas.on('click', 'country-fills', (e) => {
    if (route.path !== '/') return // Don't allow clicks if a popup is already open
    if (!e.features || e.features.length === 0) return

    // Safely extract properties
    const properties = e.features[0]?.properties
    if (!properties) return

    // Safely look for iso3 or ISO_A3
    const iso3 = properties.iso3 || properties.ISO_A3
    if (iso3) {
      router.push(`/country/${iso3.toLowerCase()}`)
    }
  })

  // Cursor change on hover
  canvas.on('mouseenter', 'country-fills', () => {
    if (route.path === '/') canvas.getCanvas().style.cursor = 'pointer'
  })
  canvas.on('mouseleave', 'country-fills', () => {
    canvas.getCanvas().style.cursor = ''
  })
}

onUnmounted(() => {
  if (canvas) canvas.remove()
})
</script>