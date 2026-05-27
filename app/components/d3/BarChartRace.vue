<!--
  BarChartRace.vue  (progressive line-race chart)
  ─────────────────────────────────────────────────────────────────────────────
  • Lines build up from left as the year advances (race effect)
  • Ghost lines (faint full-range preview) shown when ≤ 6 series
  • Play / Pause / Reset + scrubber controls (hidden in preview mode)
  • Dot + label at the right edge of each active line, de-collided
  • preview prop: auto-loops the animation with no controls shown
-->
<template>
  <div class="flex flex-col w-full h-full min-h-0 select-none">
    <!-- Chart SVG -->
    <div ref="container" class="flex-1 min-h-0 overflow-hidden" />

    <!-- Controls — hidden in preview mode -->
    <div v-if="!preview" class="flex items-center gap-2 mt-2 px-1 shrink-0">
      <button
        @click="resetAnim"
        title="Reset"
        class="p-1 rounded-md bg-[#071828] hover:bg-[#1a3a5c] text-[#93c5fd]/70 hover:text-[#93c5fd] transition-colors shrink-0"
      >
        <UIcon name="i-heroicons-arrow-uturn-left" class="size-3.5" />
      </button>
      <button
        @click="togglePlay"
        :title="isPlaying ? 'Pause' : 'Play'"
        class="p-1 rounded-md bg-[#071828] hover:bg-[#1a3a5c] text-[#93c5fd]/70 hover:text-[#93c5fd] transition-colors shrink-0"
      >
        <UIcon :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'" class="size-3.5" />
      </button>
      <input
        type="range"
        :min="0" :max="100" step="0.1"
        v-model.number="progressPct"
        @pointerdown="pauseAnim"
        class="flex-1 accent-[#3b82f6] h-1"
      />
      <span class="text-xs font-bold text-[#93c5fd] w-9 text-right shrink-0">
        {{ currentYear }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface RaceSeriesPoint { year: number; value: number }
export interface RaceSeries      { id: string; label: string; color: string; data: RaceSeriesPoint[] }

const props = defineProps<{
  series:      RaceSeries[]
  formatValue?: (v: number) => string
  maxLines?:   number   // max highlighted/labelled lines (default: all ≤6, else 10)
  preview?:    boolean  // auto-loops the animation; no controls shown
}>()

// ── Year helpers ──────────────────────────────────────────────────────────

const allYears = computed(() => {
  const s = new Set<number>()
  props.series.forEach(sr => sr.data.forEach(d => s.add(d.year)))
  return [...s].sort((a, b) => a - b)
})

// Start fully drawn (last year), users press Play to race from the beginning
const progressPct = ref(100)

const currentYear = computed(() => {
  const yrs = allYears.value
  if (!yrs.length) return 1988
  const idx = Math.min(
    Math.round((progressPct.value / 100) * (yrs.length - 1)),
    yrs.length - 1
  )
  return yrs[idx]!
})

// ── Animation controls ────────────────────────────────────────────────────

const isPlaying = ref(false)
const TICK_MS   = 700
let timer: ReturnType<typeof setInterval> | null = null

function togglePlay() {
  if (isPlaying.value) {
    pauseAnim()
  } else {
    if (progressPct.value >= 100) progressPct.value = 0
    isPlaying.value = true
    timer = setInterval(() => {
      const step = 100 / Math.max(1, allYears.value.length - 1)
      if (progressPct.value < 100) {
        progressPct.value = Math.min(100, progressPct.value + step)
      } else {
        pauseAnim()
      }
    }, TICK_MS)
  }
}

function pauseAnim() {
  isPlaying.value = false
  if (timer) { clearInterval(timer); timer = null }
}

function resetAnim() {
  pauseAnim()
  progressPct.value = 0
}

// ── Preview auto-loop ─────────────────────────────────────────────────────

function startPreviewLoop() {
  pauseAnim()
  progressPct.value = 0
  isPlaying.value = true
  timer = setInterval(() => {
    const step = 100 / Math.max(1, allYears.value.length - 1)
    if (progressPct.value < 100) {
      progressPct.value = Math.min(100, progressPct.value + step)
    } else {
      // End of animation — pause, then restart after a brief hold
      pauseAnim()
      setTimeout(() => {
        if (props.preview) startPreviewLoop()
      }, 1200)
    }
  }, TICK_MS)
}

onUnmounted(pauseAnim)

// ── D3 state ──────────────────────────────────────────────────────────────

const container = ref<HTMLDivElement | null>(null)

const MARGIN   = { top: 20, right: 122, bottom: 32, left: 56 }
const MIN_GAP  = 14  // minimum px gap between labels
const FEW_MAX  = 6   // series count below which ghost lines + full opacity apply

// Dark-theme D3 colours
const GRID_COLOR   = 'rgba(45,107,181,0.18)'
const AXIS_COLOR   = 'rgba(147,197,253,0.5)'
const DOMAIN_COLOR = 'rgba(45,107,181,0.3)'
const IND_COLOR    = 'rgba(147,197,253,0.45)'

interface CS {
  svgEl:   d3.Selection<SVGSVGElement, unknown, null, undefined>
  g:       d3.Selection<SVGGElement, unknown, null, undefined>
  xS:      d3.ScaleLinear<number, number>
  yS:      d3.ScaleLinear<number, number>
  lineGen: d3.Line<RaceSeriesPoint>
  iW:      number
  iH:      number
}
let cs: CS | null = null
let cleanupRO: (() => void) | null = null

onMounted(() => {
  init()
  if (container.value) {
    const ro = new ResizeObserver(init)
    ro.observe(container.value)
    cleanupRO = () => ro.disconnect()
  }
  // Auto-start looping animation in preview mode
  if (props.preview) {
    // Small delay so init() has had time to set up the SVG
    setTimeout(startPreviewLoop, 300)
  }
})

onUnmounted(() => { pauseAnim(); cleanupRO?.() })

watch(() => props.series, init, { deep: true })
watch(currentYear, (_, prev) => update(prev !== currentYear.value))

// ── Sanitise series IDs for use as CSS class names ────────────────────────

function sid(id: string) { return id.replace(/[^a-zA-Z0-9_-]/g, '_') }

// ── init: build static SVG structure ─────────────────────────────────────

function init() {
  if (!container.value) return
  const W = container.value.clientWidth
  const H = container.value.clientHeight
  if (W < 30 || H < 30) return

  const yrs = allYears.value
  if (!yrs.length || !props.series.length) return

  cs?.svgEl.remove()

  const iW = W - MARGIN.left - MARGIN.right
  const iH = H - MARGIN.top  - MARGIN.bottom

  const svgEl = d3.select(container.value)
    .append('svg').attr('width', W).attr('height', H)

  const g = svgEl.append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const xS = d3.scaleLinear()
    .domain([yrs[0]!, yrs[yrs.length - 1]!])
    .range([0, iW])

  const maxVal = d3.max(props.series, s => d3.max(s.data, d => d.value)) ?? 1
  const yS = d3.scaleLinear()
    .domain([0, maxVal]).range([iH, 0]).nice()

  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))

  // Y grid + axis
  g.append('g')
    .call(
      d3.axisLeft(yS).ticks(5)
        .tickFormat(v => fmt(+v))
        .tickSize(-iW)
    )
    .call(gg => gg.select('.domain').remove())
    .call(gg => gg.selectAll('.tick line')
      .attr('stroke', GRID_COLOR).attr('stroke-dasharray', '3,3'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', AXIS_COLOR).attr('font-size', 10))

  // X axis — show ≤ 9 evenly spaced year ticks
  const nTicks = Math.min(yrs.length, 9)
  const step   = Math.max(1, Math.ceil((yrs.length - 1) / (nTicks - 1)))
  const xTicks = [...new Set(
    yrs.filter((_, i) => i % step === 0).concat(yrs[yrs.length - 1]!)
  )]

  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(
      d3.axisBottom(xS)
        .tickValues(xTicks)
        .tickFormat(d => String(d))
        .tickSize(3)
    )
    .call(gg => gg.select('.domain').attr('stroke', DOMAIN_COLOR))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', AXIS_COLOR).attr('font-size', 10))

  const lineGen = d3.line<RaceSeriesPoint>()
    .x(d => xS(d.year))
    .y(d => yS(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5))

  const few = props.series.length <= FEW_MAX

  // Ghost lines (faint full-range preview) — only for small series count
  if (few) {
    props.series.forEach(s => {
      g.append('path')
        .datum(s.data)
        .attr('class', `ghost-${sid(s.id)}`)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.1)
    })
  }

  // Active line placeholders (filled by update())
  props.series.forEach(s => {
    g.append('path')
      .attr('class', `active-${sid(s.id)}`)
      .attr('fill', 'none')
      .attr('stroke', s.color)
      .attr('stroke-width', few ? 2.5 : 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
  })

  // Year indicator (vertical dashed line)
  g.append('line')
    .attr('class', 'ind')
    .attr('y1', 0).attr('y2', iH)
    .attr('stroke', IND_COLOR)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4,3')
    .attr('opacity', 0.6)

  // Dots + labels groups
  g.append('g').attr('class', 'dotsG')
  g.append('g').attr('class', 'labsG')

  cs = { svgEl, g, xS, yS, lineGen, iW, iH }
  update(false)
}

// ── update: animate to currentYear ────────────────────────────────────────

function update(transition: boolean) {
  if (!cs) return
  const { g, xS, yS, lineGen, iW, iH } = cs
  const cy  = currentYear.value
  const cx  = xS(cy)
  const dur = transition ? TICK_MS * 0.75 : 0
  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))
  const few = props.series.length <= FEW_MAX
  const maxN = props.maxLines ?? (few ? props.series.length : 10)

  // Sort series by descending value at current year
  const byVal = [...props.series]
    .map(s => ({ s, val: s.data.find(d => d.year === cy)?.value ?? 0 }))
    .sort((a, b) => b.val - a.val)

  const topIds = new Set(byVal.slice(0, maxN).map(v => v.s.id))

  // ─ Active lines ──────────────────────────────────────────────────────────
  props.series.forEach(s => {
    const pts   = s.data.filter(d => d.year <= cy)
    const isTop = topIds.has(s.id)
    g.select(`.active-${sid(s.id)}`)
      .attr('d', pts.length ? lineGen(pts) : null)
      .attr('opacity', isTop ? (few ? 0.88 : 0.82) : 0.1)
      .attr('stroke-width', isTop ? (few ? 2.5 : 2) : 1)
  })

  // ─ Indicator ─────────────────────────────────────────────────────────────
  g.select('.ind').attr('x1', cx).attr('x2', cx)

  // ─ Dots ──────────────────────────────────────────────────────────────────
  type DD = { id: string; color: string; px: number; py: number }
  const dotData: DD[] = byVal.slice(0, maxN).map(({ s, val }) => ({
    id: s.id, color: s.color, px: cx, py: yS(val),
  }))

  const dots = g.select('.dotsG')
    .selectAll<SVGCircleElement, DD>('circle')
    .data(dotData, d => d.id)

  const dE = dots.enter().append('circle').attr('r', 4)
  const dM = dE.merge(dots)

  if (dur > 0) {
    dM.transition().duration(dur)
      .attr('cx', d => d.px).attr('cy', d => d.py)
      .attr('fill', d => d.color).attr('opacity', 0.9)
  } else {
    dM.attr('cx', d => d.px).attr('cy', d => d.py)
      .attr('fill', d => d.color).attr('opacity', 0.9)
  }
  dots.exit().remove()

  // ─ Labels (fixed right margin, de-collided) ───────────────────────────────
  type LD = { id: string; color: string; rawY: number; val: number; label: string; labelY: number }

  const raw = byVal.slice(0, maxN)
    .map(({ s, val }) => ({
      id: s.id, color: s.color, rawY: yS(val), val, label: s.label, labelY: 0,
    }))
    .sort((a, b) => a.rawY - b.rawY)

  // Push-down de-collision
  raw.forEach((item, i) => {
    item.labelY = i === 0 ? item.rawY : Math.max(item.rawY, raw[i - 1]!.labelY + MIN_GAP)
  })

  // Clamp to chart height from the bottom up
  for (let i = raw.length - 1; i >= 0; i--) {
    raw[i]!.labelY = Math.min(raw[i]!.labelY, iH - 2)
    if (i < raw.length - 1) {
      raw[i]!.labelY = Math.min(raw[i]!.labelY, raw[i + 1]!.labelY - MIN_GAP)
    }
  }

  const lx = iW + 10  // labels always at right of chart area (inside right margin)

  const labs = g.select('.labsG')
    .selectAll<SVGTextElement, LD>('text')
    .data(raw as LD[], d => d.id)

  const lE = labs.enter().append('text')
    .attr('font-size', 10).attr('font-weight', '500')

  const lM = lE.merge(labs)
  const labelText = (d: LD) => {
    const n = d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label
    return few ? `${n}  ${fmt(d.val)}` : n
  }

  if (dur > 0) {
    lM.transition().duration(dur)
      .attr('x', lx).attr('y', d => d.labelY + 4)
      .attr('fill', d => d.color)
      .text(labelText)
  } else {
    lM.attr('x', lx).attr('y', d => d.labelY + 4)
      .attr('fill', d => d.color)
      .text(labelText)
  }

  labs.exit().remove()
}
</script>
