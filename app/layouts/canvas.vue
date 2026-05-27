<template>
  <div class="relative w-screen h-screen overflow-hidden bg-[#010810]">
    <div ref="mapContainer" class="absolute inset-0 z-0 w-full h-full" style="height: 100vh; width: 100vw;" />

    <!-- Dim overlay — fades in when a page window is open -->
    <Transition name="map-dim">
      <div v-if="isWindowOpen" class="absolute inset-0 z-5 bg-black/50 pointer-events-none" />
    </Transition>

    <!-- Trade line tooltip (highest priority) -->
    <div
      v-if="lineTooltip.visible"
      class="absolute z-30 pointer-events-none select-none"
      :style="{ left: `${lineTooltip.x + 16}px`, top: `${lineTooltip.y - 8}px` }"
    >
      <div class="bg-[#020c1f]/95 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-xl w-max max-w-55">
        <div class="text-[11px] font-bold mb-1"
          :class="lineTooltip.flowType === 'both' ? 'text-purple-300' : lineTooltip.flowType === 'import' ? 'text-blue-300' : 'text-orange-300'">
          {{ lineTooltip.flowType === 'import' ? 'Import' : lineTooltip.flowType === 'export' ? 'Export' : 'Import & Export' }}
        </div>
        <div class="text-xs text-white/85 font-medium">{{ lineTooltip.label }}</div>
        <div class="text-[11px] text-white/50 mt-0.5">Year: {{ lineTooltip.year }}</div>
        <div v-if="lineTooltip.value" class="text-xs font-bold mt-1" :class="lineTooltip.flowType === 'import' ? 'text-blue-300' : 'text-orange-300'">
          {{ lineTooltip.value }}
        </div>
        <div v-if="lineTooltip.importValue" class="text-xs font-bold mt-1 text-blue-300">↓ {{ lineTooltip.importValue }}</div>
        <div v-if="lineTooltip.exportValue" class="text-xs font-bold mt-0.5 text-orange-300">↑ {{ lineTooltip.exportValue }}</div>
        <div v-if="lineTooltip.flowType === 'both' && lineTooltip.homeName" class="text-[10px] text-white/30 mt-1 italic">{{ lineTooltip.homeName }}'s reported data</div>
      </div>
    </div>

    <!-- Country hover tooltip (shown when choropleth active) -->
    <div
      v-else-if="countryTooltip.visible"
      class="absolute z-30 pointer-events-none select-none"
      :style="{ left: `${countryTooltip.x + 16}px`, top: `${countryTooltip.y - 8}px` }"
    >
      <div class="bg-[#020c1f]/95 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-xl w-max max-w-55">
        <div class="text-xs font-bold text-white/90 mb-1">{{ countryTooltip.name }}</div>
        <div v-if="countryTooltip.imports" class="text-[11px] text-blue-300">↓ {{ countryTooltip.imports }}</div>
        <div v-if="countryTooltip.exports" class="text-[11px] text-orange-300">↑ {{ countryTooltip.exports }}</div>
        <div class="text-[11px] text-white/40 mt-0.5">Year: {{ countryTooltip.year }}</div>
      </div>
    </div>

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
import { formatUsd, formatWeight } from '~/utils/formatters'

const config = useRuntimeConfig()
const router = useRouter()
const route  = useRoute()

const { showImports, showExports, metric, selectedCategory, showFlows, selectedYear } = useTradeState()

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
let mapReady = false   // true after 'load' fires; avoids isStyleLoaded() being unreliable

const isHovering   = ref(false)
const isWindowOpen = useState('pageWindowOpen', () => false)

// ─── Tooltip state ────────────────────────────────────────────────────────────
// Two separate tooltips; line tooltip takes visual priority (rendered with v-if/v-else-if)

const lineTooltip = reactive({
  visible:     false,
  x:           0,
  y:           0,
  flowType:    'import',
  label:       '',
  year:        '',
  value:       '',       // single-direction flows
  importValue: '',       // 'both' flow type
  exportValue: '',       // 'both' flow type
  homeName:    '',       // whose data perspective is shown
})

const countryTooltip = reactive({
  visible: false,
  x:       0,
  y:       0,
  name:    '',
  imports: '',
  exports: '',
  year:    '',
})

const { clearTradeConnections, showAllTradeConnections, updateTradeConnections, dispose: disposeConnections } =
  useTradeConnections(() => map)

// Flag: set true when click handler triggered flyTo so the route watcher skips it
let mapClickDidFlyTo = false

// Precomputed list of ISO3 codes that have trade data (used in Mapbox filters)
const DATA_ISO3S = TRADE_DATA.map(c => c.iso3.toUpperCase())

// ─── ISO3 resolution ──────────────────────────────────────────────────────────

function resolveIso3(props: Record<string, any>): string | null {
  const raw = props['ISO3166-1-Alpha-3']
  if (raw && raw !== '-99') return (raw as string).toUpperCase()
  const name: string | undefined = props.name || props.NAME || props.ADMIN
  if (!name) return null
  return TRADE_DATA.find(c => c.name === name)?.iso3.toUpperCase() ?? null
}

// ─── Map visuals (choropleth) ─────────────────────────────────────────────────

const DATA_BASE = '#0d2545'   // dark navy blue — data countries (no metric)
const NO_DATA   = '#070d1a'   // near black    — countries not in dataset

function updateMapVisuals() {
  const m = map
  if (!m) return

  // Builds a Mapbox expression that maps:
  //   data country with choropleth value  → choropleth color
  //   data country without value          → DATA_BASE
  //   non-data country                    → NO_DATA
  function buildColorExpr(valueEntries: any[]): any {
    const dataColor = valueEntries.length
      ? (['match', ['get', 'ISO3166-1-Alpha-3'], ...valueEntries, DATA_BASE] as any)
      : DATA_BASE
    return ['case',
      ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', DATA_ISO3S]],
      dataColor,
      NO_DATA,
    ]
  }

  if (!showImports.value && !showExports.value) {
    m.setPaintProperty('country-fills', 'fill-color', buildColorExpr([]) as any)
    return
  }

  // Use year-specific series data when no category filter, otherwise use totals (category takes priority)
  function countryValue(country: any): number {
    if (selectedCategory.value) {
      let v = 0
      if (showImports.value) v += getTradeValue(country, 'imports', metric.value, selectedCategory.value)
      if (showExports.value) v += getTradeValue(country, 'exports', metric.value, selectedCategory.value)
      return v
    }
    const yr = country.series?.find((s: any) => s.year === selectedYear.value)
    if (!yr) return 0
    let v = 0
    if (showImports.value) v += metric.value === 'usd' ? yr.imports.usd : yr.imports.weight
    if (showExports.value) v += metric.value === 'usd' ? yr.exports.usd : yr.exports.weight
    return v
  }

  let maxValue = 0
  TRADE_DATA.forEach(c => { const v = countryValue(c); if (v > maxValue) maxValue = v })

  if (maxValue === 0) {
    m.setPaintProperty('country-fills', 'fill-color', buildColorExpr([]) as any)
    return
  }

  let gradientType: 'imports' | 'exports' | 'both' = 'imports'
  if (showImports.value && showExports.value) gradientType = 'both'
  else if (showExports.value) gradientType = 'exports'

  const valueEntries: any[] = []
  TRADE_DATA.forEach(country => {
    const val = countryValue(country)
    if (val > 0) {
      valueEntries.push(country.iso3.toUpperCase())
      valueEntries.push(valueToColor(val, maxValue, gradientType))
    }
  })

  m.setPaintProperty('country-fills', 'fill-color', buildColorExpr(valueEntries) as any)
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
    const iso3    = resolveIso3(props)
    const hasData = iso3 ? TRADE_DATA.some(c => c.iso3.toUpperCase() === iso3) : false

    if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false })

    if (hasData) {
      hoveredId = e.features[0]?.id ?? null
      if (hoveredId !== null) m.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true })
      m.getCanvas().style.cursor = 'pointer'

      if (!showFlows.value) {
        isHovering.value = true
        updateTradeConnections(props.name ?? '', iso3 ?? '', selectedYear.value)
      }

      // ── Country tooltip when choropleth is active ─────────────────────────
      // Use identical logic to the choropleth so tooltip matches the highlight.
      if (showImports.value || showExports.value) {
        const country = TRADE_DATA.find(c => c.iso3.toUpperCase() === iso3)
        if (country) {
          let importsVal = 0
          let exportsVal = 0

          if (selectedCategory.value) {
            // Category selected → use total-period category data (same as choropleth)
            if (showImports.value) importsVal = getTradeValue(country, 'imports', metric.value, selectedCategory.value)
            if (showExports.value) exportsVal = getTradeValue(country, 'exports', metric.value, selectedCategory.value)
          } else {
            // No category → use year-specific series data (same as choropleth)
            const yr = country.series?.find((s: any) => s.year === selectedYear.value)
            if (yr) {
              if (showImports.value) importsVal = metric.value === 'usd' ? yr.imports.usd : yr.imports.weight
              if (showExports.value) exportsVal = metric.value === 'usd' ? yr.exports.usd : yr.exports.weight
            }
          }

          // Only show tooltip if country is actually highlighted (non-zero value)
          if (importsVal + exportsVal > 0) {
            countryTooltip.visible = true
            countryTooltip.x       = e.point.x
            countryTooltip.y       = e.point.y
            countryTooltip.name    = country.name
            countryTooltip.year    = String(selectedYear.value)
            countryTooltip.imports = importsVal > 0
              ? (metric.value === 'usd' ? formatUsd(importsVal) : formatWeight(importsVal))
              : ''
            countryTooltip.exports = exportsVal > 0
              ? (metric.value === 'usd' ? formatUsd(exportsVal) : formatWeight(exportsVal))
              : ''
          } else {
            countryTooltip.visible = false
          }
        }
      } else {
        countryTooltip.visible = false
      }
    } else {
      // No data → no hover state, no cursor change, no connections
      hoveredId = null
      m.getCanvas().style.cursor = ''
      countryTooltip.visible = false
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
    countryTooltip.visible = false
    if (!showFlows.value) {
      isHovering.value = false
      clearTradeConnections()
    }
  })

  // ── Trade line tooltip — registered on the wide invisible hit-target layer ──
  // This gives ~18px hover detection width even though the visible line is only 1.5px.
  m.on('mousemove', 'trade-connection-lines-hit', (e) => {
    if (!e.features?.length) return
    const props = e.features[0]?.properties
    if (!props) return

    const flowType = props.flowType ?? 'import'
    const label = flowType === 'both'
      ? `${props.partnerName} ↔ ${props.homeName}`
      : flowType === 'import'
        ? `${props.partnerName} → ${props.homeName}`
        : `${props.homeName} → ${props.partnerName}`

    lineTooltip.visible     = true
    lineTooltip.x           = e.point.x
    lineTooltip.y           = e.point.y
    lineTooltip.flowType    = flowType
    lineTooltip.label       = label
    lineTooltip.year        = props.year ?? String(selectedYear.value)
    lineTooltip.value       = ''
    lineTooltip.importValue = ''
    lineTooltip.exportValue = ''
    lineTooltip.homeName    = props.homeName ?? ''

    if (flowType === 'both') {
      if (props.importValue && Number(props.importValue) > 0) lineTooltip.importValue = formatUsd(Number(props.importValue))
      if (props.exportValue && Number(props.exportValue) > 0) lineTooltip.exportValue = formatUsd(Number(props.exportValue))
    } else if (props.value && Number(props.value) > 0) {
      lineTooltip.value = formatUsd(Number(props.value))
    }

    m.getCanvas().style.cursor = 'crosshair'
  })

  m.on('mouseleave', 'trade-connection-lines-hit', () => {
    lineTooltip.visible = false
    m.getCanvas().style.cursor = ''
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
    mapClickDidFlyTo = true

    m.flyTo({ center: [country.lng, country.lat], zoom: 3.5, duration: 1800, essential: true })
    setTimeout(() => {
      router.push(`/countries/${iso3.toLowerCase()}`)
      isNavigating = false
    }, 650)
  })
}

// ─── Reactive watchers ────────────────────────────────────────────────────────
// Use the `mapReady` flag (set once in 'load') instead of isStyleLoaded() which
// can briefly return false right after setPaintProperty / setData calls.

watch([showImports, showExports, metric, selectedCategory, selectedYear], () => {
  if (mapReady) updateMapVisuals()
})

watch(showFlows, (val) => {
  if (!mapReady) return
  if (val) showAllTradeConnections(selectedYear.value)
  else clearTradeConnections()
})

watch(selectedYear, () => {
  if (!mapReady) return
  if (showFlows.value) showAllTradeConnections(selectedYear.value)
})

// ─── Map initialisation ───────────────────────────────────────────────────────

onMounted(async () => {
  if (!import.meta.client) return

  mapboxgl.accessToken = config.public.mapboxAccessToken || ''

  const m = new mapboxgl.Map({
    container:  mapContainer.value as HTMLElement,
    style:      'mapbox://styles/mapbox/dark-v11',
    projection: 'globe',
    center:     [0, 20],
    zoom:       1.5,
    pitch:      10,
    minZoom:    2,
    maxZoom:    5,   // prevent zooming in too far
  })
  map = m

  m.on('load', () => {
    // ── Country GeoJSON source ──────────────────────────────────────────────
    m.addSource('countries', {
      type: 'geojson',
      data: '/geojson/countries.geojson',
      generateId: true,
    })

    // ── Fog: gradient atmosphere (lighter globe centre → dark edges/space) ─────
    m.setFog({
      'color':          'rgb(10, 25, 60)',
      'high-color':     'rgb(3,  8,  22)',
      'horizon-blend':  0.07,
      'space-color':    'rgb(1, 3, 10)',
      'star-intensity': 0,
    })

    // ── Override water colour to deep navy ────────────────────────────────────
    if (m.getLayer('water')) m.setPaintProperty('water', 'fill-color', '#041729')

    // ── Layer 1: Shadow (offset fill — appears below main fill on hover) ────
    // Added BEFORE country-fills so it renders below it.
    m.addLayer({
      id:     'country-fills-shadow',
      type:   'fill',
      source: 'countries',
      paint: {
        'fill-color': '#000000',                  // pure black drop-shadow
        'fill-translate':        [4, 6],
        'fill-translate-anchor': 'viewport',
        'fill-opacity': ['case',
          ['boolean', ['feature-state', 'hover'], false], 0.65, 0,
        ],
      },
    }, 'waterway-label')

    // ── Layer 2: Main country fill (white, or choropleth when data is on) ───
    m.addLayer({
      id:     'country-fills',
      type:   'fill',
      source: 'countries',
      paint: {
        'fill-color':   DATA_BASE,
        'fill-opacity': 1,
      },
    }, 'waterway-label')

    // ── Layer 3: Hover brightening overlay (data countries only) ──────────────
    m.addLayer({
      id:     'country-fills-hover',
      type:   'fill',
      source: 'countries',
      paint: {
        'fill-color': '#60a5fa',   // blue-400 — brightens the dark navy on hover
        'fill-opacity': ['case',
          ['boolean', ['feature-state', 'hover'], false], 0.18, 0,
        ],
      },
    }, 'waterway-label')

    // ── Layer 4: Country borders ─────────────────────────────────────────────
    // Thin for no-data countries, slightly thicker for data countries.
    m.addLayer({
      id:     'country-borders',
      type:   'line',
      source: 'countries',
      paint: {
        'line-color': ['case',
          ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', DATA_ISO3S]],
          '#2d6bb5',   // data country: soft blue border
          '#0d1a30',   // no-data country: near-invisible dark border
        ],
        'line-width': ['case',
          ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', DATA_ISO3S]],
          1.0,    // data country
          0.3,    // no-data country: hairline
        ],
        'line-opacity': 1,
      },
    }, 'waterway-label')

    // ── Hide ALL built-in symbol layers (country names, city names, roads…) ────
    // We replace country labels with our own custom layer (data countries only).
    const styleData = m.getStyle()
    if (styleData?.layers) {
      styleData.layers
        .filter(l => l.type === 'symbol')
        .forEach(l => {
          if (m.getLayer(l.id)) m.setLayoutProperty(l.id, 'visibility', 'none')
        })
    }

    // ── Layer 5: Custom country labels (data countries only) ─────────────────
    m.addSource('country-label-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: TRADE_DATA.map(c => ({
          type:       'Feature' as const,
          geometry:   { type: 'Point' as const, coordinates: [c.lng, c.lat] },
          properties: { name: c.name },
        })),
      },
    })

    m.addLayer({
      id:      'country-labels-custom',
      type:    'symbol',
      source:  'country-label-points',
      minzoom: 1.5,
      layout: {
        'text-field':         ['get', 'name'],
        'text-font':          ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
        'text-size':          ['interpolate', ['linear'], ['zoom'], 1.5, 8, 3, 11, 5, 12],
        'text-max-width':     7,
        'text-justify':       'center',
        'text-anchor':        'center',
        'text-padding':       3,
        'text-allow-overlap': false,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color':       '#93c5fd',              // blue-300 — visible on dark navy
        'text-halo-color':  'rgba(1,8,22,0.85)',    // dark halo for legibility
        'text-halo-width':  1.5,
      },
    })

    // ── Trade connection sources ───────────────────────────────────────────────
    const emptyFC = { type: 'FeatureCollection' as const, features: [] }
    m.addSource('trade-connection-lines', { type: 'geojson', data: emptyFC })
    m.addSource('trade-connection-dots',  { type: 'geojson', data: emptyFC })
    m.addSource('trade-anim-dots',        { type: 'geojson', data: emptyFC })

    const flowColor: any = ['match', ['get', 'flowType'],
      'import', '#3b82f6',
      'export', '#f97316',
      'both',   '#a855f7',
      '#888888',
    ]
    // Brighter variant for animated moving dots
    const animDotColor: any = ['match', ['get', 'flowType'],
      'import', '#93c5fd',   // blue-300
      'export', '#fdba74',   // orange-300
      'both',   '#d8b4fe',   // purple-300
      '#cccccc',
    ]

    m.addLayer({
      id:     'trade-connection-lines',
      type:   'line',
      source: 'trade-connection-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint:  {
        'line-color':     flowColor,
        'line-width':     1.5,
        'line-opacity':   0.7,
        'line-dasharray': [0.5, 2.5],  // round-cap dots spaced along the arc
      },
    })
    // ── Invisible wide layer for easier mouse hit detection ───────────────────
    m.addLayer({
      id:     'trade-connection-lines-hit',
      type:   'line',
      source: 'trade-connection-lines',
      paint:  { 'line-width': 18, 'line-opacity': 0 },
    })
    m.addLayer({
      id:     'trade-connection-dots',
      type:   'circle',
      source: 'trade-connection-dots',
      paint: {
        'circle-radius':       5,
        'circle-color':        flowColor,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
        'circle-opacity':      0.9,
      },
    })
    // ── Animated dots moving along trade arcs ─────────────────────────────────
    m.addLayer({
      id:     'trade-anim-dots',
      type:   'circle',
      source: 'trade-anim-dots',
      paint: {
        'circle-radius':  3.5,
        'circle-color':   animDotColor,
        'circle-opacity': 1,
      },
    })

    setupInteractions(m)
    updateMapVisuals()
    mapReady = true
  })

  // Enable/disable map interaction based on route
  watch(() => route.path, (path) => {
    const enable = path === '/'
    m.dragPan   [enable ? 'enable' : 'disable']()
    m.scrollZoom[enable ? 'enable' : 'disable']()
    m.dragRotate[enable ? 'enable' : 'disable']()
  }, { immediate: true })

  // FlyTo on route change (skip if click handler already did it)
  watch(() => route.path, (newPath, oldPath) => {
    if (mapClickDidFlyTo) { mapClickDidFlyTo = false; return }

    const newMatch = newPath.match(/^\/(countries|imports|exports)\/([^/]+)$/)
    const oldMatch = oldPath?.match(/^\/(countries|imports|exports)\/([^/]+)$/)
    if (!newMatch) return

    const newIso3 = newMatch[2]!.toUpperCase()
    const oldIso3 = oldMatch?.[2]?.toUpperCase()
    if (newIso3 === oldIso3) return

    const country = TRADE_DATA.find(c => c.iso3.toUpperCase() === newIso3)
    if (country && m.isStyleLoaded()) {
      m.flyTo({ center: [country.lng, country.lat], zoom: 3, duration: 1500 })
    }
  })
})

onUnmounted(() => { disposeConnections(); map?.remove() })
</script>

<style scoped>
.map-dim-enter-active,
.map-dim-leave-active {
  transition: opacity 0.35s ease;
}
.map-dim-enter-from,
.map-dim-leave-to {
  opacity: 0;
}
</style>
