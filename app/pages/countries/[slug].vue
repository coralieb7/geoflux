<template>
  <PageWindow :title="c.name">
    <div class="flex flex-col gap-2 h-full">

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

        <!-- Top 3 import sources (no expandable — just always shown) -->
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

      <!-- Row 2: category breakdown + top exporters + evolution chart (fills remaining height) -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Pie chart -->
        <div
          class="bg-zinc-50 rounded-xl p-3 flex flex-col gap-2 cursor-pointer"
          @click="pieExpanded = !pieExpanded"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Categories</h3>
            <UIcon :name="pieExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="size-3.5 text-zinc-400" />
          </div>
          <div class="flex-1 min-h-0">
            <D3PieChart
              :slices="pieSlices"
              :on-slice-click="pieExpanded ? onCategoryClick : undefined"
            />
          </div>
          <p v-if="pieExpanded" class="text-xs text-zinc-400 text-center shrink-0">Click slice to open</p>
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
import { getCountryYearlySeries } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'
import type { PieSlice } from '~/components/d3/PieChart.vue'

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

const pieExpanded = ref(false)

function onCategoryClick(slice: PieSlice) {
  if (slice.id === '__other__') return
  nav.push(`/categories/${categoryToSlug(slice.id)}`, c.value.name)
}

const tradeConnections = computed(() => getTradeConnections(c.value.iso3, '2016'))

const yearlySeries = computed(() => getCountryYearlySeries(c.value))

const evolutionSeries = computed(() => [
  { id: 'imports', label: 'Imports', color: '#3b82f6', data: yearlySeries.value.map(p => ({ year: p.year, value: p.imports.usd })) },
  { id: 'exports', label: 'Exports', color: '#f97316', data: yearlySeries.value.map(p => ({ year: p.year, value: p.exports.usd })) },
])
</script>