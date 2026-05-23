<!-- app/components/d3/BarChartRace.vue -->
<template>
  <div class="flex flex-col w-full h-full min-h-65 text-zinc-800 dark:text-zinc-200">
    <div ref="container" class="flex-1 relative overflow-hidden" />
    <div class="flex items-center gap-3 mt-2 px-1">
      <button @click="togglePlay" class="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
        <UIcon :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'" class="size-5" />
      </button>
      <input
        type="range"
        :min="minYear"
        :max="maxYear"
        v-model.number="currentYear"
        @input="stopPlay"
        class="flex-1 accent-blue-500"
      />
      <span class="text-sm font-bold w-10 text-right">{{ currentYear }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface RaceSeriesPoint { year: number; value: number }
export interface RaceSeries { id: string; label: string; color: string; data: RaceSeriesPoint[] }

const props = defineProps<{
  series: RaceSeries[]
  formatValue?: (v: number) => string
  maxItems?: number
}>()

const container = ref<HTMLDivElement | null>(null)
const isPlaying = ref(false)
const currentYear = ref(1988)
const minYear = ref(1988)
const maxYear = ref(2016)

let timer: d3.Timer | null = null
const TICK_DURATION = 750 // Milliseconds per year transition

// Group and sort data frames per year
const frames = computed(() => {
  const map = new Map<number, any[]>()
  props.series.forEach(s => {
    s.data.forEach(d => {
      if (!map.has(d.year)) map.set(d.year, [])
      map.get(d.year)!.push({
        id: s.id,
        label: s.label,
        color: s.color,
        value: d.value
      })
    })
  })

  const limit = props.maxItems || 10

  return Array.from(map.entries()).map(([year, items]) => ({
    year,
    items: items.sort((a,b) => b.value - a.value).slice(0, limit).map((item, i) => ({ ...item, rank: i }))
  })).sort((a,b) => a.year - b.year)
})

watch(() => frames.value, (newFrames) => {
  if (newFrames.length) {
    minYear.value = newFrames[0].year
    maxYear.value = newFrames[newFrames.length - 1].year
    if (currentYear.value < minYear.value || currentYear.value > maxYear.value) {
      currentYear.value = minYear.value
    }
    draw(currentYear.value)
  }
}, { immediate: true })

watch(currentYear, (newYear) => draw(newYear))

function togglePlay() {
  if (isPlaying.value) stopPlay()
  else {
    if (currentYear.value >= maxYear.value) currentYear.value = minYear.value
    isPlaying.value = true
    timer = d3.interval(() => {
      if (currentYear.value < maxYear.value) currentYear.value++
      else stopPlay()
    }, TICK_DURATION)
  }
}

function stopPlay() {
  isPlaying.value = false
  if (timer) timer.stop()
}

onUnmounted(() => stopPlay())

const margin = { top: 20, right: 60, bottom: 10, left: 10 }
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

onMounted(() => {
  if (!container.value) return
  svg = d3.select(container.value).append('svg').attr('width', '100%').attr('height', '100%')
  const ro = new ResizeObserver(() => draw(currentYear.value))
  ro.observe(container.value)
  onUnmounted(() => ro.disconnect())
})

function draw(year: number) {
  if (!container.value || !svg) return
  const frame = frames.value.find(f => f.year === year)
  if (!frame) return

  const width = Math.max(100, container.value.clientWidth)
  const height = Math.max(100, container.value.clientHeight)
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const x = d3.scaleLinear().domain([0, d3.max(frame.items, d => d.value) ?? 1]).range([0, innerWidth])
  const maxRank = Math.max(1, frame.items.length)
  const y = d3.scaleBand<number>().domain(d3.range(maxRank)).range([0, innerHeight]).padding(0.15)
  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))

  let g = svg.select<SVGGElement>('g.chart-group')
  if (g.empty()) g = svg.append('g').attr('class', 'chart-group')
  g.attr('transform', `translate(${margin.left},${margin.top})`)

  let axisG = svg.select<SVGGElement>('g.x-axis')
  if (axisG.empty()) axisG = svg.append('g').attr('class', 'x-axis')
  axisG.attr('transform', `translate(${margin.left},${margin.top})`)
    .transition().duration(TICK_DURATION).ease(d3.easeLinear)
    .call(d3.axisTop(x).ticks(5).tickFormat(v => fmt(+v)).tickSize(-innerHeight))
    .call(sel => sel.select('.domain').remove())
    .call(sel => sel.selectAll('.tick line').attr('stroke', 'currentColor').attr('opacity', 0.1))
    .call(sel => sel.selectAll('text').attr('fill', 'currentColor').attr('opacity', 0.6))

  let yearText = svg.select<SVGTextElement>('text.year-bg')
  if (yearText.empty()) {
    yearText = svg.append('text').attr('class', 'year-bg')
      .attr('text-anchor', 'end').attr('font-weight', 'bold')
      .attr('fill', 'currentColor').style('opacity', 0.1)
  }
  yearText.attr('x', width - margin.right).attr('y', height - margin.bottom)
    .attr('font-size', Math.min(width / 4, 120)).text(year)

  const bars = g.selectAll<SVGGElement, any>('g.bar-group').data(frame.items, d => d.id)

  const barsEnter = bars.enter().append('g').attr('class', 'bar-group')
    .attr('transform', d => `translate(0,${innerHeight})`) // start from bottom

  barsEnter.append('rect').attr('height', y.bandwidth()).attr('x', 0).attr('width', 0)
    .attr('fill', d => d.color).attr('rx', 4).attr('opacity', 0.9)

  barsEnter.append('text').attr('class', 'label').attr('x', 6).attr('dy', '0.35em')
    .attr('font-weight', '600').attr('font-size', 12)

  barsEnter.append('text').attr('class', 'value').attr('dy', '0.35em')
    .attr('fill', 'currentColor').style('opacity', 0.7).attr('font-size', 12)

  const barsMerge = barsEnter.merge(bars)

  barsMerge.transition().duration(TICK_DURATION).ease(d3.easeLinear)
    .attr('transform', d => `translate(0,${y(d.rank)})`)

  barsMerge.select('rect').transition().duration(TICK_DURATION).ease(d3.easeLinear)
    .attr('width', d => Math.max(0, x(d.value))).attr('height', y.bandwidth())

  barsMerge.select('text.label').transition().duration(TICK_DURATION).ease(d3.easeLinear)
    .attr('y', y.bandwidth() / 2)
    .attr('fill', d => x(d.value) < 60 ? 'currentColor' : 'white')
    .text(d => d.label)

  barsMerge.select('text.value').transition().duration(TICK_DURATION).ease(d3.easeLinear)
    .attr('y', y.bandwidth() / 2)
    .attr('x', d => Math.max(0, x(d.value)) + 6)
    .textTween(function(d) {
      const self = this as any
      const start = self._currentValue || 0
      const end = d.value
      self._currentValue = end
      const i = d3.interpolate(start, end)
      return t => fmt(i(t))
    })

  bars.exit().transition().duration(TICK_DURATION)
    .attr('transform', `translate(0,${innerHeight})`)
    .style('opacity', 0).remove()
}
</script>