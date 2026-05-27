<!--
  GroupedBarChart.vue
  ─────────────────────────────────────────────────────────────────────────────
  Vertical grouped bar chart with two series (imports = blue, exports = orange).
  Bars animate from the baseline upward on first render and on data changes.
  Clicking any bar group calls onBarClick(datum).
-->
<template>
  <div ref="container" class="w-full h-full min-h-0" />
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface GroupedBarDatum {
  id:      string   // slug / iso3 — used for navigation in parent
  label:   string
  imports: number
  exports: number
}

const props = defineProps<{
  data:         GroupedBarDatum[]
  formatValue?: (v: number) => string
  onBarClick?:  (d: GroupedBarDatum) => void
}>()

const container = ref<HTMLDivElement | null>(null)
let cleanupRO: (() => void) | null = null

const MARGIN = { top: 28, right: 16, bottom: 64, left: 56 }
const COLORS  = { imports: '#3b82f6', exports: '#f97316' } as const

// ── Core draw function ────────────────────────────────────────────────────

function draw(animate: boolean) {
  if (!container.value || !props.data.length) return
  d3.select(container.value).selectAll('*').remove()

  const W = container.value.clientWidth
  const H = container.value.clientHeight
  if (W < 20 || H < 20) return

  const width  = W - MARGIN.left - MARGIN.right
  const height = H - MARGIN.top  - MARGIN.bottom

  const svg = d3.select(container.value)
    .append('svg')
    .attr('width', W)
    .attr('height', H)
    .append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))

  // ── Scales ──────────────────────────────────────────────────────────────
  const x0 = d3.scaleBand<string>()
    .domain(props.data.map(d => d.label))
    .range([0, width])
    .paddingInner(0.22)
    .paddingOuter(0.08)

  const x1 = d3.scaleBand<string>()
    .domain(['imports', 'exports'])
    .range([0, x0.bandwidth()])
    .padding(0.05)

  const maxVal = d3.max(props.data, d => Math.max(d.imports, d.exports)) ?? 1
  const y = d3.scaleLinear()
    .domain([0, maxVal])
    .range([height, 0])
    .nice()

  // ── Grid + Y axis ────────────────────────────────────────────────────────
  svg.append('g')
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickFormat(v => fmt(+v))
        .tickSize(-width)
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('stroke', '#e4e4e7')
      .attr('stroke-dasharray', '2,2'))
    .call(g => g.selectAll('.tick text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)
      .attr('dx', '-4'))

  // ── X axis labels (rotated) ──────────────────────────────────────────────
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickSize(0))
    .call(g => g.select('.domain').remove())
    .selectAll<SVGTextElement, string>('.tick text')
    .attr('fill', '#71717a')
    .attr('font-size', 10)
    .attr('text-anchor', 'end')
    .attr('transform', 'rotate(-38) translate(-4,0)')
    .text(d => d.length > 15 ? d.slice(0, 14) + '…' : d)

  // ── Bar groups ────────────────────────────────────────────────────────────
  const groups = svg.selectAll<SVGGElement, GroupedBarDatum>('.bar-group')
    .data(props.data)
    .join('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${x0(d.label)!},0)`)
    .style('cursor', props.onBarClick ? 'pointer' : 'default')
    .on('click', (_, d) => props.onBarClick?.(d))

  // Transparent hover rect covering the whole group for better hit target
  groups.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', x0.bandwidth())
    .attr('height', height)
    .attr('fill', 'transparent')

  // ── Bars for each series ──────────────────────────────────────────────────
  ;(['imports', 'exports'] as const).forEach(key => {
    const rects = groups.append('rect')
      .attr('x', x1(key)!)
      .attr('width', Math.max(0, x1.bandwidth()))
      .attr('rx', 3)
      .attr('fill', COLORS[key])
      .attr('opacity', 0.85)

    if (animate) {
      rects
        .attr('y', height)
        .attr('height', 0)
        .transition()
        .duration(650)
        .delay((_, i) => i * 55)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d[key]))
        .attr('height', d => Math.max(0, height - y(d[key])))
    } else {
      rects
        .attr('y', d => y(d[key]))
        .attr('height', d => Math.max(0, height - y(d[key])))
    }
  })

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendItems = [
    { key: 'imports', label: 'Imports', color: COLORS.imports },
    { key: 'exports', label: 'Exports', color: COLORS.exports },
  ]
  const legend = svg.append('g').attr('transform', `translate(0,-20)`)
  legendItems.forEach((item, i) => {
    const gx = i * 72
    legend.append('rect')
      .attr('x', gx).attr('y', -4).attr('width', 10).attr('height', 10).attr('rx', 2)
      .attr('fill', item.color).attr('opacity', 0.85)
    legend.append('text')
      .attr('x', gx + 14).attr('y', 5)
      .attr('fill', '#71717a').attr('font-size', 10)
      .text(item.label)
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(() => {
  draw(true)
  if (container.value) {
    const ro = new ResizeObserver(() => draw(false))
    ro.observe(container.value)
    cleanupRO = () => ro.disconnect()
  }
})

onUnmounted(() => cleanupRO?.())

watch(() => props.data, () => draw(true), { deep: true })
</script>