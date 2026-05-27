<template>
  <PageWindow :title="c.name">
    <div class="relative flex flex-col gap-2 h-full">

      <!-- Full-screen sunburst overlay -->
      <Transition name="overlay-in">
        <div
          v-if="pieFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide shrink-0">
                Trade Categories — {{ c.name }}
              </h3>
              <!-- Import / Export toggle -->
              <div class="flex gap-0.5 shrink-0">
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="pieMode = opt.key"
                  :class="pieMode === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#071828] text-[#93c5fd]/60 hover:bg-[#1a3a5c] border border-[#2d6bb5]/30'"
                  class="text-[10px] px-2 py-0.5 rounded transition-colors font-medium"
                >{{ opt.label }}</button>
              </div>
              <!-- Year slider -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-[10px] text-[#93c5fd]/50 shrink-0">Year</span>
                <input
                  type="range"
                  :min="YEARS[0]"
                  :max="YEARS.at(-1)"
                  step="1"
                  v-model.number="selectedYear"
                  class="flex-1 min-w-0 accent-[#3b82f6] h-1"
                />
                <span class="text-[10px] font-bold text-[#93c5fd] w-8 text-right shrink-0">{{ selectedYear }}</span>
              </div>
            </div>
            <button
              @click="pieFullScreen = false"
              class="shrink-0 ml-2 p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0">
            <D3SunburstPie
              :categories="sunburstCategories"
              :format-value="formatUsd"
              @navigate-category="onNavCategory"
              @navigate-commodity="onNavCommodity"
            />
          </div>
        </div>
      </Transition>

      <!-- Full-screen evolution overlay -->
      <Transition name="overlay-in">
        <div
          v-if="evoFullScreen"
          class="absolute inset-0 z-20 bg-[#0d2545] border border-[#2d6bb5]/30 rounded-xl flex flex-col"
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-[#2d6bb5]/25 shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/70 uppercase tracking-wide">
              Evolution Over Time — {{ c.name }}
            </h3>
            <button
              @click="evoFullScreen = false"
              class="p-1.5 rounded-full hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Collapse"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="size-4" />
            </button>
          </div>
          <div class="flex-1 min-h-0 p-3">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" />
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
          <div class="flex items-center gap-1 mt-0.5 text-blue-300 text-xs font-medium">
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
          <div class="flex items-center gap-1 mt-0.5 text-orange-300 text-xs font-medium">
            View breakdown <UIcon name="i-heroicons-arrow-right" class="size-3.5" />
          </div>
        </StatCard>

        <!-- Top 3 import sources -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Top Import Sources</h3>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3importers"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-white/75 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-blue-300 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-[#93c5fd]/40">No data</p>
        </div>

      </div>

      <!-- Row 2: pie preview + top exporters + evolution chart -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Pie preview — click to open full-screen sunburst -->
        <div
          class="bg-[#071828] rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:bg-[#0f2540] transition-colors border border-[#2d6bb5]/20"
          @click="pieFullScreen = true"
        >
          <div class="flex items-center justify-between shrink-0">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Categories</h3>
            <div class="flex items-center gap-1.5">
              <!-- Mode toggle (stops propagation so it doesn't open the overlay) -->
              <div class="flex gap-0.5" @click.stop>
                <button
                  v-for="opt in PIE_MODE_OPTS"
                  :key="opt.key"
                  @click="pieMode = opt.key"
                  :class="pieMode === opt.key
                    ? 'bg-[#2d6bb5] text-white'
                    : 'bg-[#0d2545] text-[#93c5fd]/55 hover:bg-[#1a3a5c] border border-[#2d6bb5]/25'"
                  class="text-[9px] px-1.5 py-0.5 rounded transition-colors font-medium leading-none"
                >{{ opt.label }}</button>
              </div>
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5 text-[#93c5fd]/55" />
            </div>
          </div>
          <!-- Year badge -->
          <div class="text-[9px] text-[#93c5fd]/45 -mt-1 shrink-0">Year {{ selectedYear }}</div>
          <div class="flex-1 min-h-0">
            <D3PieChart :slices="pieSlices" />
          </div>
          <p class="text-xs text-[#93c5fd]/40 text-center shrink-0">Click to explore</p>
        </div>

        <!-- Top 3 export destinations -->
        <div class="bg-[#071828] rounded-xl p-3 flex flex-col gap-1.5 border border-[#2d6bb5]/20">
          <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide leading-none">Top Export Destinations</h3>
          <div v-if="tradeConnections" class="flex flex-col gap-1 mt-0.5">
            <div
              v-for="(pct, country) in tradeConnections.top3exportCountries"
              :key="country"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-white/75 truncate">{{ iso3ToName(country) }}</span>
              <span class="text-xs font-semibold text-orange-300 shrink-0 ml-1">{{ pct.toFixed(1) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-[#93c5fd]/40">No data</p>
        </div>

        <!-- Evolution over time (2 columns) — preview + expand -->
        <div class="col-span-2 bg-[#071828] rounded-xl p-3 flex flex-col border border-[#2d6bb5]/20">
          <div class="flex items-center justify-between shrink-0 mb-2">
            <h3 class="text-xs font-semibold text-[#93c5fd]/55 uppercase tracking-wide">Evolution Over Time</h3>
            <button
              @click="evoFullScreen = true"
              class="p-1 rounded hover:bg-[#1a3a5c] transition-colors text-[#93c5fd]/70 hover:text-[#93c5fd]"
              title="Expand"
            >
              <UIcon name="i-heroicons-arrows-pointing-out" class="size-3.5" />
            </button>
          </div>
          <!-- Auto-looping preview -->
          <div class="flex-1 min-h-0">
            <D3BarChartRace :series="evolutionSeries" :format-value="formatUsd" :preview="true" />
          </div>
        </div>

      </div>
    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { getCountry, getTradeConnections, iso3ToName, YEARS } from '~/utils/dummyData'
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

// ── Shared year state (synced with map left panel slider) ──────────────────
const { selectedYear } = useTradeState()

const CATEGORY_COLORS = [
  '#3b82f6','#f97316','#22c55e','#a855f7','#eab308',
  '#06b6d4','#ec4899','#f43f5e','#10b981','#8b5cf6',
  '#f59e0b','#6366f1',
]

// ── Pie mode (imports / exports / both) ───────────────────────────────────

type PieMode = 'imports' | 'exports' | 'both'
const pieMode = ref<PieMode>('both')

const PIE_MODE_OPTS: { key: PieMode; label: string }[] = [
  { key: 'both',    label: 'Both'  },
  { key: 'imports', label: 'Imp.'  },
  { key: 'exports', label: 'Exp.'  },
]

// ── Year ratio: scales category values to the selected year's total ────────
// byCategory holds total-period sums. We scale proportionally using the
// year-specific series total so absolute values reflect the selected year.
const yearRatio = computed(() => {
  const yr = c.value.series?.find((s: any) => s.year === selectedYear.value)
  if (!yr) return 1

  const modeYearVal = pieMode.value === 'imports' ? yr.imports.usd
                    : pieMode.value === 'exports'  ? yr.exports.usd
                    : yr.imports.usd + yr.exports.usd

  const allYearsTotal = Object.values(c.value.byCategory).reduce((sum, d: any) => {
    if (!d) return sum
    if (pieMode.value === 'imports') return sum + (d.imports?.usd ?? 0)
    if (pieMode.value === 'exports') return sum + (d.exports?.usd ?? 0)
    return sum + (d.imports?.usd ?? 0) + (d.exports?.usd ?? 0)
  }, 0)

  return allYearsTotal > 0 ? modeYearVal / allYearsTotal : 1
})

// ── Pie / sunburst data ────────────────────────────────────────────────────

const pieSlices = computed<PieSlice[]>(() => {
  const ratio = yearRatio.value

  const all = Object.entries(c.value.byCategory)
    .map(([cat, data]: [string, any]) => {
      const rawVal = pieMode.value === 'imports' ? (data?.imports.usd ?? 0)
                   : pieMode.value === 'exports' ? (data?.exports.usd ?? 0)
                   : (data?.imports.usd ?? 0) + (data?.exports.usd ?? 0)
      return { id: cat, label: cat, value: rawVal * ratio }
    })
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  const top = all.slice(0, 11).map((s, i) => ({ ...s, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))

  if (all.length <= 11) return top

  const otherValue = all.slice(11).reduce((sum, s) => sum + s.value, 0)
  return [...top, { id: '__other__', label: 'Other', value: otherValue, color: '#9ca3af' }]
})

// sunburstCategories: passes value: s.value so SunburstPie scales commodities
// to match the preview pie inner-ring proportions exactly.
const sunburstCategories = computed<SunburstCategory[]>(() =>
  pieSlices.value
    .filter(s => s.id !== '__other__')
    .map(s => ({
      id:    s.id,
      label: s.label,
      slug:  categoryToSlug(s.id),
      color: s.color ?? '#9ca3af',
      value: s.value,   // ← country + year + mode specific value → inner ring matches preview
      commodities: getCommoditiesByCategory(s.id).map((com: any) => ({
        id:    com.id,
        label: com.name,
        // raw commodity value (SunburstPie will scale these so sum = s.value)
        value: pieMode.value === 'imports' ? com.imports.usd
             : pieMode.value === 'exports' ? com.exports.usd
             : com.imports.usd + com.exports.usd,
      })),
    }))
)

// ── Overlay state ──────────────────────────────────────────────────────────

const pieFullScreen = ref(false)
const evoFullScreen = ref(false)

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
  { id: 'imports', label: 'Imports', color: '#3b82f6', data: yearlySeries.value.map((p: any) => ({ year: p.year, value: p.imports.usd })) },
  { id: 'exports', label: 'Exports', color: '#f97316', data: yearlySeries.value.map((p: any) => ({ year: p.year, value: p.exports.usd })) },
])
</script>

<style scoped>
.overlay-in-enter-active,
.overlay-in-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.overlay-in-enter-from,
.overlay-in-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
