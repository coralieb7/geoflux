<template>
  <div ref="container" class="w-full h-full min-h-[180px]" />
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface BarDatum { label: string; value: number; color?: string }

const props = defineProps<{
  data: BarDatum[]
  formatValue?: (v: number) => string
  onBarClick?: (d: BarDatum) => void
}>()

const container = ref<HTMLDivElement | null>(null)

const margin = { top: 8, right: 80, bottom: 8, left: 120 }

function draw() {
  if (!container.value || !props.data.length) return
  d3.select(container.value).selectAll('*').remove()

  const width  = container.value.clientWidth  - margin.left - margin.right
  const height = Math.max(props.data.length * 28, 100) - margin.top - margin.bottom

  const svg = d3.select(container.value)
    .append('svg')
    .attr('width',  '100%')
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear().domain([0, d3.max(props.data, d => d.value) ?? 1]).range([0, width]).nice()
  const y = d3.scaleBand().domain(props.data.map(d => d.label)).range([0, height]).padding(0.25)

  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))

  // Bars
  svg.selectAll('rect')
    .data(props.data)
    .join('rect')
    .attr('y', d => y(d.label)!)
    .attr('height', y.bandwidth())
    .attr('x', 0)
    .attr('width', d => x(d.value))
    .attr('rx', 4)
    .attr('fill', (d, i) => d.color ?? (i % 2 === 0 ? '#3b82f6' : '#f97316'))
    .attr('opacity', 0.85)
    .style('cursor', props.onBarClick ? 'pointer' : 'default')
    .on('click', (_, d) => props.onBarClick?.(d))

  // Labels (left)
  svg.selectAll('.label')
    .data(props.data)
    .join('text')
    .attr('class', 'label')
    .attr('x', -6)
    .attr('y', d => y(d.label)! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('fill', '#71717a')
    .attr('font-size', 12)
    .text(d => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label)

  // Value labels (right)
  svg.selectAll('.val')
    .data(props.data)
    .join('text')
    .attr('class', 'val')
    .attr('x', d => x(d.value) + 6)
    .attr('y', d => y(d.label)! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#71717a')
    .attr('font-size', 11)
    .text(d => fmt(d.value))
}

onMounted(() => {
  draw()
  const ro = new ResizeObserver(draw)
  if (container.value) ro.observe(container.value)
  onUnmounted(() => ro.disconnect())
})

watch(() => props.data, draw, { deep: true })
</script>
