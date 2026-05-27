<template>
  <div ref="container" class="relative w-full h-full min-h-0 flex flex-col items-center" />
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface PieSlice { id: string; label: string; value: number; color?: string }

const props = defineProps<{
  slices: PieSlice[]
  onSliceClick?: (slice: PieSlice) => void
}>()

const container = ref<HTMLDivElement | null>(null)

const PALETTE = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1',
]

function draw() {
  if (!container.value || !props.slices.length) return
  d3.select(container.value).selectAll('*').remove()

  const size   = Math.min(container.value.clientWidth, container.value.clientHeight)
  const radius = size / 2 - 8

  // Calculate total early so we can use it for percentages
  const total = d3.sum(props.slices, d => d.value)

  const svg = d3.select(container.value)
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .append('g')
    .attr('transform', `translate(${size / 2},${size / 2})`)

  const pie  = d3.pie<PieSlice>().value(d => d.value).sort(null)
  const arc  = d3.arc<d3.PieArcDatum<PieSlice>>().innerRadius(radius * 0.45).outerRadius(radius)
  const hArc = d3.arc<d3.PieArcDatum<PieSlice>>().innerRadius(radius * 0.45).outerRadius(radius + 6)

  // Tooltip
  const tooltip = d3.select(container.value)
    .append('div')
    .attr('class', 'absolute pointer-events-none opacity-0 bg-[#020c1f]/95 border border-white/10 text-white/85 text-xs px-2.5 py-1.5 rounded-lg shadow-xl z-50 transition-opacity duration-150 whitespace-nowrap')

  const pieData = pie(props.slices)

  const arcs = svg.selectAll('path')
    .data(pieData)
    .join('path')
    .attr('fill', (d, i) => d.data.color ?? PALETTE[i % PALETTE.length])
    .attr('stroke', '#071828')
    .attr('stroke-width', 1.5)
    .style('cursor', props.onSliceClick ? 'pointer' : 'default')
    // Start each slice at zero width for the draw-in animation
    .attr('d', d => arc({ ...d, endAngle: d.startAngle }) ?? '')
    .attr('opacity', 0.85)

  // Draw-in animation: each slice sweeps from startAngle → endAngle
  arcs.transition()
    .duration(700)
    .delay((_, i) => i * 55)
    .ease(d3.easeCubicOut)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate(
        { ...d, endAngle: d.startAngle },
        d
      )
      return (t: number) => arc(interpolate(t)) as string
    })

  // Hover + tooltip
  arcs
    .on('mousemove', function(event, d) {
      const pct = ((d.value / total) * 100).toFixed(1)
      const [x, y] = d3.pointer(event, container.value)
      tooltip
        .html(`<span class="font-semibold">${d.data.label}</span> <span class="text-[#93c5fd]">${pct}%</span>`)
        .style('left', `${x + 15}px`)
        .style('top',  `${y + 15}px`)
        .style('opacity', 1)
      d3.select(this).attr('d', hArc as any).attr('opacity', 1)
    })
    .on('mouseleave', function() {
      tooltip.style('opacity', 0)
      d3.select(this).attr('d', arc as any).attr('opacity', 0.85)
    })

  if (props.onSliceClick) {
    arcs.on('click', (_, d) => props.onSliceClick!(d.data))
  }

  // Centre labels: "Total" hint + formatted value
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
    .attr('fill', 'rgba(147,197,253,0.5)').attr('font-size', 11).text('Total')
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.1em')
    .attr('fill', 'rgba(255,255,255,0.85)').attr('font-size', 13).attr('font-weight', '600')
    .text(d3.format(',.0f')(total))
}

onMounted(() => {
  draw()
  const ro = new ResizeObserver(draw)
  if (container.value) ro.observe(container.value)
  onUnmounted(() => ro.disconnect())
})

watch(() => props.slices, draw, { deep: true })
</script>
