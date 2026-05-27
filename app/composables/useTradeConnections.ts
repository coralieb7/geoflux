import { TRADE_DATA, TRADE_CONNECTIONS } from '~/utils/dummyData'
import {
  CENTROIDS,
  getCountryLngLat,
  resolveConnectionKey,
  buildConnectionFeatures,
} from '~/utils/tradeConnectionUtils'

// NOTE: year is passed explicitly as a parameter — no internal useTradeState() —
// so callers in canvas.vue always drive the value and watchers stay reliable.

// ── Animation constants ───────────────────────────────────────────────────────
const ANIM_DURATION_MS = 5000   // ms per full traversal (slow, deliberate)
const DOTS_PER_LINE    = 2
const DOT_PHASES       = Array.from({ length: DOTS_PER_LINE }, (_, i) => i / DOTS_PER_LINE)

/** Linearly interpolate position along a polyline at fraction t ∈ [0, 1]. */
function interpolateAlong(coords: [number, number][], t: number): [number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  const idx  = clamped * (coords.length - 1)
  const i    = Math.min(Math.floor(idx), coords.length - 2)
  const frac = idx - i
  const p0   = coords[i]!
  const p1   = coords[i + 1]!
  return [
    p0[0] + frac * (p1[0] - p0[0]),
    p0[1] + frac * (p1[1] - p0[1]),
  ]
}

// ── Helper: convert TRADE_CONNECTIONS entry to Map<iso3, usdValue> ────────────
function toMap(obj: Record<string, unknown> | undefined): Map<string, number> {
  return new Map(
    Object.entries(obj ?? {}).map(([k, v]) => [k.toUpperCase(), typeof v === 'number' ? v : 0]),
  )
}

export function useTradeConnections(getMap: () => any) {

  // ── Animation state — persists across applyFeatures calls ────────────────────
  let activeLines:  { coords: [number, number][]; flowType: string }[] = []
  let animHandle:   number | null = null
  let animT         = 0                // current phase 0–1, persists across calls
  let animLastTs:   number | null = null

  function setSource(id: string, features: GeoJSON.Feature[]) {
    getMap()?.getSource(id)?.setData({ type: 'FeatureCollection', features })
  }

  // ── Animation loop ──────────────────────────────────────────────────────────
  function stopAnim() {
    if (animHandle !== null) { cancelAnimationFrame(animHandle); animHandle = null }
    // animT intentionally NOT reset — dots continue from same position
    animLastTs = null
  }

  function startAnim() {
    if (animHandle !== null) return  // already running, activeLines update is enough
    if (!activeLines.length) return

    function frame(ts: number) {
      if (animLastTs !== null) {
        animT = (animT + (ts - animLastTs) / ANIM_DURATION_MS) % 1
      }
      animLastTs = ts

      const features: GeoJSON.Feature[] = []
      for (const { coords, flowType } of activeLines) {
        for (const phase of DOT_PHASES) {
          const pos = interpolateAlong(coords, (animT + phase) % 1)
          features.push({
            type:       'Feature',
            geometry:   { type: 'Point', coordinates: pos },
            properties: { flowType },
          })
        }
      }
      getMap()?.getSource('trade-anim-dots')?.setData({ type: 'FeatureCollection', features })
      animHandle = requestAnimationFrame(frame)
    }
    animLastTs = null
    animHandle = requestAnimationFrame(frame)
  }

  // ── Core: apply new features without restarting the clock ───────────────────
  function applyFeatures(lines: GeoJSON.Feature[], dots: GeoJSON.Feature[]) {
    setSource('trade-connection-lines', lines)
    setSource('trade-connection-dots',  dots)

    // Update activeLines in place — the running rAF loop reads this reference each frame
    activeLines = lines.map(f => ({
      coords:   (f.geometry as GeoJSON.LineString).coordinates as [number, number][],
      flowType: (f.properties?.flowType as string) ?? 'import',
    }))

    startAnim()  // no-op if already running; starts fresh only if stopped
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  function clearTradeConnections() {
    activeLines = []
    stopAnim()
    setSource('trade-connection-lines', [])
    setSource('trade-connection-dots',  [])
    setSource('trade-anim-dots',        [])
  }

  function showAllTradeConnections(year: number) {
    const yr = String(year)
    const allLines: GeoJSON.Feature[] = []
    const allDots:  GeoJSON.Feature[] = []

    for (const key of Object.keys(TRADE_CONNECTIONS)) {
      const hLngLat  = getCountryLngLat(key)
      const yearData = TRADE_CONNECTIONS[key]?.[yr]
      if (!hLngLat || !yearData) continue

      const homeCountry = TRADE_DATA.find(c => c.iso3.toUpperCase() === key.toUpperCase())
      const homeName    = homeCountry?.name ?? key

      const importMap = toMap(yearData.top3importers as Record<string, unknown>)
      const exportMap = toMap(yearData.top3exportCountries as Record<string, unknown>)
      const { lines, dots } = buildConnectionFeatures(hLngLat, importMap, exportMap, homeName, year)
      allLines.push(...lines)
      allDots.push(...dots)
    }

    applyFeatures(allLines, allDots)
  }

  function updateTradeConnections(geoName: string, iso3: string, year: number) {
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

    const yr       = String(year)
    const yearData = TRADE_CONNECTIONS[key]?.[yr]
    if (!yearData) { clearTradeConnections(); return }

    const homeCountry = TRADE_DATA.find(c => c.iso3.toUpperCase() === key.toUpperCase() || c.name === key)
    const homeName    = homeCountry?.name ?? geoName

    const importMap = toMap(yearData.top3importers as Record<string, unknown>)
    const exportMap = toMap(yearData.top3exportCountries as Record<string, unknown>)
    const { lines, dots } = buildConnectionFeatures(hLngLat, importMap, exportMap, homeName, year)

    applyFeatures(lines, dots)
  }

  function dispose() { stopAnim() }

  return { clearTradeConnections, showAllTradeConnections, updateTradeConnections, dispose }
}
