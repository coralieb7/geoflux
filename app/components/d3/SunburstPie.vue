<!--
  SunburstPie.vue
  ──────────────────────────────────────────────────────────────────────────────
  Two-ring interactive sunburst:
    Inner ring  = categories (sized by category.value — country-specific)
    Outer ring  = commodities of the active category (proportionally scaled to
                  sum to category.value, so relative inner/outer sizes match)

  Props:
    categories   — SunburstCategory[]  (each must carry a `value` field)
    formatValue  — optional formatter for tooltip value display

  Interaction:
    • Hover category/commodity  → floating tooltip with name, %, formatted value
    • Hover category            → outer ring expands with its commodities
    • Mouse leave               → outer ring collapses (if nothing locked)
    • First click category      → lock; center shows "click → open"
    • Second click category     → emit navigate-category
    • Click commodity           → emit navigate-commodity
    • Click background          → unlock, collapse outer ring
-->
<template>
  <div ref="el" class="relative w-full h-full select-none">

    <!-- Hover tooltip -->
    <Transition name="tip-fade">
      <div
        v-if="tooltip.visible"
        class="absolute z-50 pointer-events-none bg-[#020c1f]/95 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-xl"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: 'translate(-50%, -100%)' }"
      >
        <div class="text-xs font-semibold text-white/90 max-w-45 leading-tight">{{ tooltip.name }}</div>
        <div class="flex gap-2 items-center mt-1">
          <span class="text-[11px] font-medium" :style="{ color: tooltip.color }">{{ tooltip.totalPct }}% of total</span>
          <span v-if="tooltip.parentPct" class="text-[11px] text-[#93c5fd]/50">· {{ tooltip.parentPct }}% in cat.</span>
        </div>
        <div v-if="tooltip.formattedValue" class="text-xs font-bold text-white/75 mt-0.5">{{ tooltip.formattedValue }}</div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'

export interface SunburstCommodity {
  id: string
  label: string
  value: number
}

export interface SunburstCategory {
  id: string
  label: string
  slug: string
  color: string
  /** Country-specific category value — used to size the inner ring and scale commodities. */
  value: number
  commodities: SunburstCommodity[]
}

const props = defineProps<{
  categories: SunburstCategory[]
  formatValue?: (v: number) => string
}>()

const emit = defineEmits<{
  (e: 'navigate-category', slug: string): void
  (e: 'navigate-commodity', id: string): void
}>()

const el = ref<HTMLDivElement | null>(null)

// ── Tooltip reactive state (updated from D3 event handlers) ──────────────────
const tooltip = reactive({
  visible:        false,
  x:              0,
  y:              0,
  name:           '',
  color:          '#93c5fd',
  totalPct:       '',
  parentPct:      '',
  formattedValue: '',
})

// ── ResizeObserver cleanup ────────────────────────────────────────────────────
let cleanupRO: (() => void) | null = null

function render() {
  if (!el.value) return
  const container = el.value

  // Clear previous SVG (but keep the container so the tooltip Transition still works)
  d3.select(container).selectAll('svg').remove()

  const W = container.clientWidth
  const H = container.clientHeight
  const size = Math.min(W, H)
  if (size < 20) return

  // ── Layout geometry ────────────────────────────────────────────────────────
  const radius = size / 6

  const arc = d3.arc<any>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

  // ── Build D3 hierarchy ────────────────────────────────────────────────────
  // CRITICAL: commodities are scaled so their sum equals category.value.
  // This ensures the inner ring (categories) is sized by country-specific data,
  // matching the preview pie chart exactly.
  const rootData = {
    id: '__root__',
    children: props.categories
      .filter(c => c.value > 0 && c.commodities.some(cm => cm.value > 0))
      .map(c => {
        const commTotal = c.commodities.reduce((s, cm) => s + (cm.value > 0 ? cm.value : 0), 0)
        // scale factor: make sum(scaled commodities) = category.value
        const scale = commTotal > 0 ? c.value / commTotal : 0
        return {
          id: c.id, label: c.label, slug: c.slug, color: c.color,
          // No direct value on the category node — it's derived by D3 from children
          children: c.commodities
            .filter(cm => cm.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 15)
            .map(cm => ({ id: cm.id, label: cm.label, value: cm.value * scale }))
        }
      })
  }

  const root = d3.partition<any>().size([2 * Math.PI, 3])(
    d3.hierarchy(rootData).sum((d: any) => d.value ?? 0)
  )

  // Total value = root.value = sum of all category values (for % calculation)
  const totalValue = root.value ?? 1

  // Initialise current positions
  root.each((d: any) => {
    if (d.depth === 0) return
    if (d.depth === 1) {
      d.current = { x0: d.x0, x1: d.x1, y0: 1, y1: 2 }
    } else {
      const catX0: number = d.ancestors()[1]?.x0 ?? 0
      d.current = { x0: catX0, x1: catX0, y0: 2, y1: 3 }
    }
  })

  // ── SVG ───────────────────────────────────────────────────────────────────
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%').attr('height', '100%')
    .attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
    .style('font', '10px sans-serif')

  // ── Arc paths ─────────────────────────────────────────────────────────────
  const paths = svg.append('g')
    .selectAll<SVGPathElement, any>('path')
    .data(root.descendants().slice(1))
    .join('path')
    .attr('fill', (d: any) =>
      d.depth === 1
        ? d.data.color
        : d3.rgb(d.parent.data.color).brighter(0.35).formatHex())
    .attr('fill-opacity', (d: any) => d.depth === 1 ? 0.75 : 0)
    .attr('d', (d: any) => arc(d.current))
    .style('cursor', 'pointer')

  // ── Labels ────────────────────────────────────────────────────────────────
  const labels = svg.append('g')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .style('user-select', 'none')
    .selectAll<SVGTextElement, any>('text')
    .data(root.descendants().slice(1))
    .join('text')
    .attr('dy', '0.35em')
    .attr('fill', 'white')
    .attr('fill-opacity', (d: any) => d.depth === 1 && labelVisible(d.current) ? 0.9 : 0)
    .attr('transform', (d: any) => labelTransform(d.current))
    .style('font-size', (d: any) => d.depth === 1 ? '10px' : '8px')
    .style('font-weight', (d: any) => d.depth === 1 ? '600' : '400')
    .text((d: any) => {
      const n: string = d.data.label ?? ''
      return n.length > 14 ? n.slice(0, 13) + '…' : n
    })

  // ── Centre lock hint ──────────────────────────────────────────────────────
  const cLabel = svg.append('text')
    .attr('text-anchor', 'middle').attr('dy', '-0.5em')
    .attr('fill', 'rgba(255,255,255,0.9)').attr('fill-opacity', 0)
    .style('font-size', '9px').style('font-weight', '600')
    .style('pointer-events', 'none')
  const cHint = svg.append('text')
    .attr('text-anchor', 'middle').attr('dy', '0.8em')
    .attr('fill', 'rgba(147,197,253,0.65)').attr('fill-opacity', 0)
    .style('font-size', '8px')
    .style('pointer-events', 'none')

  // ── State ─────────────────────────────────────────────────────────────────
  let locked: any = null

  // ── Helpers ───────────────────────────────────────────────────────────────
  function labelVisible(d: any): boolean {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05
  }

  function labelTransform(d: any): string {
    const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
    const y = ((d.y0 + d.y1) / 2) * radius
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
  }

  const fmt = props.formatValue ?? ((v: number) => d3.format(',.0f')(v))

  // ── Tooltip update (called from mousemove on every path) ──────────────────
  function updateTooltip(event: MouseEvent, d: any) {
    const [x, y] = d3.pointer(event, container)
    tooltip.visible        = true
    tooltip.x              = x
    tooltip.y              = Math.max(y - 12, 10)
    tooltip.name           = d.data.label ?? ''
    tooltip.color          = d.depth === 1 ? d.data.color : d3.rgb(d.parent.data.color).brighter(0.35).formatHex()
    tooltip.totalPct       = ((d.value / totalValue) * 100).toFixed(1)
    tooltip.parentPct      = d.depth === 2 && d.parent?.value
      ? ((d.value / d.parent.value) * 100).toFixed(1)
      : ''
    tooltip.formattedValue = fmt(d.value)
  }

  // ── Animate outer ring for a given category node ──────────────────────────
  function showFor(catNode: any, dur: number) {
    const isLocked = locked === catNode

    root.each((d: any) => {
      if (d.depth === 1) {
        d.target = { x0: d.x0, x1: d.x1, y0: 1, y1: 2 }
      } else if (d.depth === 2) {
        if (d.parent === catNode && catNode.children?.length) {
          const n: number = catNode.children.length
          const idx: number = catNode.children.indexOf(d)
          const s = (2 * Math.PI) / n
          d.target = { x0: idx * s, x1: (idx + 1) * s, y0: 2, y1: 3 }
        } else {
          const px0: number = d.ancestors()[1]?.x0 ?? 0
          d.target = { x0: px0, x1: px0, y0: 2, y1: 3 }
        }
      }
    })

    paths.transition().duration(dur)
      .attr('fill-opacity', (d: any) => {
        if (d === catNode) return isLocked ? 0.95 : 0.88
        if (d.depth === 1) return 0.22
        if (d.parent === catNode) return 0.68
        return 0
      })
      .attr('pointer-events', (d: any) =>
        d.depth === 1 || d.parent === catNode ? 'auto' : 'none')
      .attrTween('d', (d: any) => {
        const i = d3.interpolate(d.current, d.target)
        return (t: number) => { d.current = i(t); return arc(d.current) }
      })

    labels.transition().duration(dur)
      .attr('fill-opacity', (d: any) => {
        if (d === catNode) return 1
        if (d.depth === 1) return 0.12
        if (d.parent === catNode) return labelVisible(d.target ?? d.current) ? 0.85 : 0
        return 0
      })
      .attrTween('transform', (d: any) => {
        const i = d3.interpolate(d.current, d.target ?? d.current)
        return (t: number) => labelTransform(i(t))
      })

    cLabel.text(catNode.data.label).attr('fill-opacity', 0.8)
    cHint.text(isLocked ? 'click → open page' : 'click to lock').attr('fill-opacity', 0.6)
  }

  // ── Collapse outer ring back ───────────────────────────────────────────────
  function hideAll(dur: number) {
    root.each((d: any) => {
      if (d.depth === 1) {
        d.target = { x0: d.x0, x1: d.x1, y0: 1, y1: 2 }
      } else if (d.depth === 2) {
        const px0: number = d.ancestors()[1]?.x0 ?? 0
        d.target = { x0: px0, x1: px0, y0: 2, y1: 3 }
      }
    })

    paths.transition().duration(dur)
      .attr('fill-opacity', (d: any) => d.depth === 1 ? 0.75 : 0)
      .attr('pointer-events', 'auto')
      .attrTween('d', (d: any) => {
        const i = d3.interpolate(d.current, d.target)
        return (t: number) => { d.current = i(t); return arc(d.current) }
      })

    labels.transition().duration(dur)
      .attr('fill-opacity', (d: any) =>
        d.depth === 1 && labelVisible(d.target ?? d.current) ? 0.9 : 0)
      .attrTween('transform', (d: any) => {
        const i = d3.interpolate(d.current, d.target ?? d.current)
        return (t: number) => labelTransform(i(t))
      })

    cLabel.attr('fill-opacity', 0)
    cHint.attr('fill-opacity', 0)
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  paths
    // Interaction events (show/hide outer ring, lock)
    .on('mouseenter', (_: any, d: any) => {
      if (locked) return
      if (d.depth === 1) showFor(d, 200)
    })
    .on('mouseleave.ring', (_: any, d: any) => {
      if (locked) return
      if (d.depth === 1) hideAll(200)
    })
    .on('click', (event: Event, d: any) => {
      event.stopPropagation()
      if (d.depth === 1) {
        if (locked === d) {
          emit('navigate-category', d.data.slug)
        } else {
          locked = d
          showFor(d, 250)
        }
      } else if (d.depth === 2) {
        emit('navigate-commodity', d.data.id)
      }
    })
    // Tooltip events (independent, always fire)
    .on('mousemove.tip', (event: MouseEvent, d: any) => {
      updateTooltip(event, d)
    })
    .on('mouseleave.tip', () => {
      tooltip.visible = false
    })

  // Click on background → unlock and collapse
  svg.on('click', () => {
    if (locked) {
      locked = null
      hideAll(250)
    }
  })
}

onMounted(() => {
  render()
  if (el.value) {
    const ro = new ResizeObserver(render)
    ro.observe(el.value)
    cleanupRO = () => ro.disconnect()
  }
})

onUnmounted(() => {
  cleanupRO?.()
  tooltip.visible = false
})

watch(() => props.categories, render, { deep: true })
</script>

<style scoped>
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.1s ease;
}
.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
}
</style>
