import { TRADE_DATA, TRADE_CONNECTIONS } from '~/utils/dummyData'

// Hardcoded centroids for countries with bad/missing lat-lng in TRADE_DATA
export const CENTROIDS: Record<string, [number, number]> = {
  FRA: [2.35, 46.23],
  USA: [-97.0, 38.9],
}

const SPECIAL_PARTNER_COORDS: Record<string, [number, number]> = {
  WLD: [-30, 0],  // mid-Atlantic Ocean
  EUU: [10, 50],  // center of Europe
}

export function getCountryLngLat(iso3: string): [number, number] | null {
  const key = iso3.toUpperCase()
  if (CENTROIDS[key]) return CENTROIDS[key]
  const c = TRADE_DATA.find(c => c.iso3.toUpperCase() === key)
  if (!c || (c.lat === 0 && c.lng === 0)) return null
  return [c.lng, c.lat]
}

export function getPartnerLngLat(iso3: string): [number, number] | null {
  return SPECIAL_PARTNER_COORDS[iso3] ?? getCountryLngLat(iso3)
}

export function resolveConnectionKey(geoName: string, iso3: string): string | null {
  if (TRADE_CONNECTIONS[iso3])    return iso3
  if (TRADE_CONNECTIONS[geoName]) return geoName
  return null
}

// Spherical interpolation → great-circle arc as [lng, lat] array.
// Unwraps longitude at the antimeridian so Mapbox draws the short path.
export function greatCircleArc(
  from: [number, number],
  to: [number, number],
  steps = 48,
): [number, number][] {
  const r = Math.PI / 180
  const lat1 = from[1] * r, lng1 = from[0] * r
  const lat2 = to[1] * r,   lng2 = to[0] * r
  const d = Math.acos(
    Math.max(-1, Math.min(1,
      Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1),
    )),
  )
  if (d < 0.001) return [from, to]

  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const A = Math.sin((1 - t) * d) / Math.sin(d)
    const B = Math.sin(t * d)       / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1)                  + B * Math.sin(lat2)
    pts.push([
      Math.atan2(y, x) * 180 / Math.PI,
      Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI,
    ])
  }

  for (let i = 1; i < pts.length; i++) {
    const cur  = pts[i]!
    const prev = pts[i - 1]!
    while (cur[0] - prev[0] >  180) cur[0] -= 360
    while (cur[0] - prev[0] < -180) cur[0] += 360
  }
  return pts
}

export interface ConnectionFeatures {
  lines: GeoJSON.Feature[]
  dots:  GeoJSON.Feature[]
}

// Builds GeoJSON features for import/export arcs and partner dots.
// Pure — does not touch the map.
export function buildConnectionFeatures(
  hLngLat:   [number, number],
  importers:  Set<string>,
  exporters:  Set<string>,
): ConnectionFeatures {
  const lines: GeoJSON.Feature[] = []
  const dots:  GeoJSON.Feature[] = []

  for (const partner of new Set([...importers, ...exporters])) {
    const partnerLngLat = getPartnerLngLat(partner)
    if (!partnerLngLat) continue

    const isImport = importers.has(partner)
    const isExport = exporters.has(partner)
    const flowType = isImport && isExport ? 'both' : isImport ? 'import' : 'export'

    dots.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: partnerLngLat },
      properties: { flowType },
    })
    if (isImport) lines.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: greatCircleArc(partnerLngLat, hLngLat) },
      properties: { flowType },
    })
    if (isExport) lines.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: greatCircleArc(hLngLat, partnerLngLat) },
      properties: { flowType },
    })
  }

  return { lines, dots }
}
