<!--
  SunburstPie.vue
  ──────────────────────────────────────────────────────────────────────────────
  Two-ring interactive sunburst:
    Inner ring  = categories
    Outer ring  = commodities of the active category (shown on hover / lock)

  Interaction model:
    • Hover category    → outer ring expands with its commodities
    • Mouse leave       → outer ring collapses (if nothing is locked)
    • First click cat   → lock: commodities stay; center shows "click → open"
    • Second click cat  → emit navigate-category
    • Click commodity   → emit navigate-commodity
    • Click background  → unlock, collapse outer ring
-->
<template>
  <div ref="el" class="relative w-full h-full select-none" />
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
  commodities: SunburstCommodity[]
}

const props = defineProps<{
  categories: SunburstCategory[]
}>()

const emit = defineEmits<{
  (e: 'navigate-category', slug: string): void
  (e: 'navigate-commodity', id: string): void
}>()

const el = ref<HTMLDivElement | null>(null)

// Keep ResizeObserver cleanup across re-renders
let cleanupRO: (() => void) | null = null

function render() {
  if (!el.value) return
  const container = el.value

  // Remove previous SVG content but keep the container
  d3.select(container).selectAll('*').remove()

  const W = container.clientWidth
  const H = container.clientHeight
  const size = Math.min(W, H)
  if (size < 20) return

  // ── Layout geometry ────────────────────────────────────────────────────────
  // radius = 1 unit in partition space. With size([2π, 3]):
  //   inner ring (categories) : y = 1→2  →  radius to 2*radius px
  //   outer ring (commodities): y = 2→3  →  2*radius to 3*radius (=size/2) px
  const radius = size / 6

  const arc = d3.arc<any>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

  // ── Build D3 hierarchy ────────────────────────────────────────────────────
  const rootData = {
    id: '__root__',
    children: props.categories
      .filter(c => c.commodities.some(cm => cm.value > 0))
      .map(c => ({
        id: c.id, label: c.label, slug: c.slug, color: c.color,
        children: c.commodities
          .filter(cm => cm.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)   // max 15 commodities per category in outer ring
          .map(cm => ({ id: cm.id, label: cm.label, value: cm.value }))
      }))
  }

  const root = d3.partition<any>().size([2 * Math.PI, 3])(
    d3.hierarchy(rootData).sum((d: any) => d.value ?? 0)
  )

  // Initialise current positions:
  // categories → inner ring; commodities → collapsed (zero-width) in outer ring
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

  // ── Centre label (shows active category name + hint) ─────────────────────
  const cLabel = svg.append('text')
    .attr('text-anchor', 'middle').attr('dy', '-0.5em')
    .attr('fill', '#18181b').attr('fill-opacity', 0)
    .style('font-size', '9px').style('font-weight', '600')
    .style('pointer-events', 'none')
  const cHint = svg.append('text')
    .attr('text-anchor', 'middle').attr('dy', '0.8em')
    .attr('fill', '#71717a').attr('fill-opacity', 0)
    .style('font-size', '8px')
    .style('pointer-events', 'none')

  // ── State ─────────────────────────────────────────────────────────────────
  let locked: any = null   // hierarchy node of the locked category

  // ── Helpers ───────────────────────────────────────────────────────────────
  function labelVisible(d: any): boolean {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05
  }

  function labelTransform(d: any): string {
    const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
    const y = ((d.y0 + d.y1) / 2) * radius
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
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
    .on('mouseenter', (_: any, d: any) => {
      if (locked) return   // don't change view while something is locked
      if (d.depth === 1) showFor(d, 200)
    })
    .on('mouseleave', (_: any, d: any) => {
      if (locked) return
      if (d.depth === 1) hideAll(200)
    })
    .on('click', (event: Event, d: any) => {
      event.stopPropagation()
      if (d.depth === 1) {
        if (locked === d) {
          // Second click on locked category → navigate
          emit('navigate-category', d.data.slug)
        } else {
          // First click → lock this category
          locked = d
          showFor(d, 250)
        }
      } else if (d.depth === 2) {
        emit('navigate-commodity', d.data.id)
      }
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

onUnmounted(() => { cleanupRO?.() })

watch(() => props.categories, render, { deep: true })
</script>