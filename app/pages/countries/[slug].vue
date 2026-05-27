<template>
  <PageWindow :title="c.name">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- Full-screen sunburst overlay (sits on top of the page content) -->
      <Transition name="sunburst-in">
        <div
          v-if="pieFullScreen"
          class="absolute inset-0 z-20 bg-white rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-zinc-100 shrink-0">
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Trade Categories — {{ c.name }}
            </h3>
            <button
              @click="pieFullScreen = false"
              class="p-1.5 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0">
            <D3SunburstPie
              :categories="sunburstCategories"
              @navigate-category="onNavCategory"
              @navigate-commodity="onNavCommodity"
            />
          </div>
        </div>
      </Transition>

      <!-- Row 1: key stats (auto-height) -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Trade Balance"
          :value="formatUsd(balance)"
          :color="balance >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />

        <StatCard
          title="Total Imports"
          :value="formatUsd(c.imports.usd)"
          color="blue"
          :subtitle="formatWeight(c.imports.weight)"
          clickable
          @click="nav.push(`/imports/${slug}`, c.name)"
        >
          <div class="flex items-center gap-1 mt-0.5 text-blue-500 text-xs font-medium">
            View breakdown <UIcon name="i-heroicons-arrow-right" class="size-3.5" />
          </div>
        </StatCard>

        <StatCard
          title="Total Exports"
          :value="formatUsd(c.exports.usd)"
          color="orange"
          :subtitle="formatWeight(c.exports.weight)"
          clickable
          @click="nav.push(`/exports/${slug}`, c.name)"
        >
          <div class="flex items-center gap-1 mt-0.5 text-orange-500 text-xs font-medium">
            View breakdown <UIcon name="i-heroicons-arrow-right" class="size-3.5" />
          </div>
        </StatCard>

        <!-- Top 3 import sources -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col gap-1.5">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide leading-none">Top Import Sources</h3>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3importers"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-zinc-600 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-blue-500 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-400">No data</p>
        </div>

      </div>

      <!-- Row 2: pie preview + top exporters + evolution chart (fills remaining height) -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Pie preview — click to open full-screen sunburst -->
        <div
          class="bg-zinc-50 rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:bg-zinc-100 transition-colors"
          @click="pieFullScreen = true"
        >
          <div class="flex items-center justify-between shrink-0">
            <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Categories</h3>
            <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5 text-zinc-400" />
          </div>
          <div class="flex-1 min-h-0">
            <D3PieChart :slices="pieSlices" />
          </div>
          <p class="text-xs text-zinc-400 text-center shrink-0">Click to explore</p>
        </div>

        <!-- Top 3 export destinations -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col gap-1.5">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide leading-none">Top Export Destinations</h3>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3exportCountries"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-zinc-600 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-orange-500 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-400">No data</p>
        </div>

        <!-- Evolution over time (takes remaining 2 columns) -->
        <div class="col-span-2 bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Evolution Over Time</h3>
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { getCountry, getTradeConnections, iso3ToName } from '~/utils/dummyData'
import { getCountryYearlySeries, getCommoditiesByCategory } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { PieSlice } from '~/components/d3/PieChart.vue'
import type { SunburstCategory } from '~/components/d3/SunburstPie.vue'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const slug = computed(() => (route.params.slug as string).toUpperCase())
const raw  = computed(() => getCountry(slug.value))

if (!raw.value) await navigateTo('/')

const c       = computed(() => raw.value!)
const balance = computed(() => c.value.exports.usd - c.value.imports.usd)

const CATEGORY_COLORS = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1',
]

// ── Pie / sunburst data ────────────────────────────────────────────────────

const pieSlices = computed<PieSlice[]>(() => {
  const all = Object.entries(c.value.byCategory)
    .map(([cat, data]) => ({
      id: cat, label: cat,
      value: (data?.imports.usd ?? 0) + (data?.exports.usd ?? 0),
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  const top = all.slice(0, 11).map((s, i) => ({ ...s, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))

  if (all.length <= 11) return top

  const otherValue = all.slice(11).reduce((sum, s) => sum + s.value, 0)
  return [...top, { id: '__other__', label: 'Other', value: otherValue, color: '#9ca3af' }]
})

const sunburstCategories = computed<SunburstCategory[]>(() =>
  pieSlices.value
    .filter(s => s.id !== '__other__')
    .map(s => ({
      id: s.id,
      label: s.label,
      slug: categoryToSlug(s.id),
      color: s.color ?? '#9ca3af',
      commodities: getCommoditiesByCategory(s.id).map(com => ({
        id: com.id,
        label: com.name,
        value: com.imports.usd + com.exports.usd,
      })),
    }))
)

// ── Full-screen overlay state ──────────────────────────────────────────────

const pieFullScreen = ref(false)

function onNavCategory(catSlug: string) {
  pieFullScreen.value = false
  nav.push(`/categories/${catSlug}`, c.value.name)
}

function onNavCommodity(id: string) {
  pieFullScreen.value = false
  nav.push(`/commodities/${id}`, c.value.name)
}

// ── Trade connections + evolution ──────────────────────────────────────────

const tradeConnections = computed(() => getTradeConnections(c.value.iso3, '2016'))
const yearlySeries     = computed(() => getCountryYearlySeries(c.value))

const evolutionSeries = computed(() => [
  { id: 'imports', label: 'Imports', color: '#3b82f6', data: yearlySeries.value.map(p => ({ year: p.year, value: p.imports.usd })) },
  { id: 'exports', label: 'Exports', color: '#f97316', data: yearlySeries.value.map(p => ({ year: p.year, value: p.exports.usd })) },
])
</script>

<style scoped>
.sunburst-in-enter-active,
.sunburst-in-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.sunburst-in-enter-from,
.sunburst-in-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>