<template>
  <div ref="container" class="w-full h-full min-h-[220px]" />
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface LineSeriesPoint { year: number; value: number }
export interface LineSeries { id: string; label: string; color: string; data: LineSeriesPoint[] }

const props = defineProps<{
  series: LineSeries[]
  yLabel?: string
  formatY?: (v: number) => string
}>()

const container = ref<HTMLDivElement | null>(null)

const margin = { top: 16, right: 24, bottom: 36, left: 70 }

function draw() {
  if (!container.value || !props.series.length) return
  d3.select(container.value).selectAll('*').remove()

  const width  = container.value.clientWidth  - margin.left - margin.right
  const height = container.value.clientHeight - margin.top  - margin.bottom

  const svg = d3.select(container.value)
    .append('svg')
    .attr('width',  '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const allPoints = props.series.flatMap(s => s.data)
  const xExtent = d3.extent(allPoints, d => d.year) as [number, number]
  const yMax    = d3.max(allPoints, d => d.value) ?? 0

  const x = d3.scaleLinear().domain(xExtent).range([0, width])
  const y = d3.scaleLinear().domain([0, yMax * 1.05]).range([height, 0]).nice()

  const fmt = props.formatY ?? ((v: number) => d3.format(',.0f')(v))

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text').attr('fill', '#71717a').attr('font-size', 11))

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(v => fmt(+v)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', '#e4e4e7').attr('x2', width))
    .call(g => g.selectAll('text').attr('fill', '#71717a').attr('font-size', 11))

  // Y label
  if (props.yLabel) {
    svg.append('text')
      .attr('transform', `rotate(-90)`)
      .attr('y', -margin.left + 12)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)
      .text(props.yLabel)
  }

  // Lines
  const line = d3.line<LineSeriesPoint>()
    .x(d => x(d.year))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX)

  props.series.forEach(s => {
    svg.append('path')
      .datum(s.data)
      .attr('fill', 'none')
      .attr('stroke', s.color)
      .attr('stroke-width', 2.5)
      .attr('d', line)
  })

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${width - props.series.length * 90},${-4})`)
  props.series.forEach((s, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 90},0)`)
    g.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 6).attr('y2', 6)
      .attr('stroke', s.color).attr('stroke-width', 2.5)
    g.append('text').attr('x', 20).attr('y', 10)
      .attr('fill', '#71717a').attr('font-size', 11)
      .text(s.label)
  })
}

onMounted(() => {
  draw()
  const ro = new ResizeObserver(draw)
  if (container.value) ro.observe(container.value)
  onUnmounted(() => ro.disconnect())
})

watch(() => props.series, draw, { deep: true })
</script>
