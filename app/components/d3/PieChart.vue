<template>
  <div ref="container" class="relative w-full h-full min-h-[220px] flex flex-col items-center" />
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

  // Create the tooltip div
  const tooltip = d3.select(container.value)
    .append('div')
    .attr('class', 'absolute pointer-events-none opacity-0 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2.5 py-1.5 rounded-md shadow-lg z-50 transition-opacity duration-150')

  const arcs = svg.selectAll('path')
    .data(pie(props.slices))
    .join('path')
    .attr('d', arc)
    .attr('fill', (d, i) => d.data.color ?? PALETTE[i % PALETTE.length])
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', props.onSliceClick ? 'pointer' : 'default')

  // Attach mouse events to ALL slices
  arcs
    .on('mousemove', function(event, d) {
      // Calculate percentage
      const pct = ((d.value / total) * 100).toFixed(1)
      // Get mouse coordinates relative to the container
      const [x, y] = d3.pointer(event, container.value)

      // Update tooltip content and position
      tooltip
        .html(`${d.data.label} ${pct}%`)
        .style('left', `${x + 15}px`)
        .style('top', `${y + 15}px`)
        .style('opacity', 1)

      // Enlarge slice
      d3.select(this).attr('d', hArc as any).attr('opacity', 0.9)
    })
    .on('mouseleave', function() {
      // Hide tooltip and shrink slice back
      tooltip.style('opacity', 0)
      d3.select(this).attr('d', arc as any).attr('opacity', 1)
    })

  // 4. Attach click event if prop is provided
  if (props.onSliceClick) {
    arcs.on('click', (_, d) => props.onSliceClick!(d.data))
  }

  // Centre label: total
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
    .attr('fill', '#71717a').attr('font-size', 11).text('Total')
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.1em')
    .attr('fill', '#3f3f46').attr('font-size', 13).attr('font-weight', '600')
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
