<template>
  <PageWindow :title="String(year)">
    <div class="flex flex-col gap-2 h-full">

      <!-- Row 1: top-level stats + compare year -->
      <div class="grid grid-cols-4 gap-2 shrink-0">

        <StatCard
          title="Total Imports"
          :value="formatUsd(snapshot.totalImports.usd)"
          color="blue"
          :subtitle="formatWeight(snapshot.totalImports.weight)"
        />

        <StatCard
          title="Total Exports"
          :value="formatUsd(snapshot.totalExports.usd)"
          color="orange"
          :subtitle="formatWeight(snapshot.totalExports.weight)"
        />

        <!-- Comparison year (expandable to pick year) -->
        <StatCard
          title="vs. Another Year"
          :value="formatGrowth(diffPercent)"
          :color="diffPercent >= 0 ? 'green' : 'red'"
          :subtitle="`Compared to ${compareYear}`"
          expandable
          clickable
        >
          <div class="mt-1">
            <YearSlider v-model="compareYear" />
          </div>
        </StatCard>

        <!-- Balance -->
        <StatCard
          title="Trade Balance"
          :value="formatUsd(snapshot.totalExports.usd - snapshot.totalImports.usd)"
          :color="(snapshot.totalExports.usd - snapshot.totalImports.usd) >= 0 ? 'orange' : 'blue'"
          subtitle="Exports − Imports"
        />

      </div>

      <!-- Row 2: top categories + top countries (fills remaining height) -->
      <div class="grid grid-cols-4 gap-2 flex-1 min-h-0">

        <!-- Top import categories -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Import Categories</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="cat in snapshot.topImportCategories"
              :key="cat.name"
              @click="nav.push(`/categories/${categoryToSlug(cat.name)}`, String(year))"
              class="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-100 cursor-pointer transition-colors"
            >
              <span class="text-xs font-medium text-zinc-700 truncate">{{ cat.name }}</span>
              <span class="text-xs font-semibold text-blue-500 shrink-0 ml-1">{{ formatUsd(cat.usd) }}</span>
            </div>
          </div>
        </div>

        <!-- Top export categories -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Export Categories</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="cat in snapshot.topExportCategories"
              :key="cat.name"
              @click="nav.push(`/categories/${categoryToSlug(cat.name)}`, String(year))"
              class="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-100 cursor-pointer transition-colors"
            >
              <span class="text-xs font-medium text-zinc-700 truncate">{{ cat.name }}</span>
              <span class="text-xs font-semibold text-orange-500 shrink-0 ml-1">{{ formatUsd(cat.usd) }}</span>
            </div>
          </div>
        </div>

        <!-- Top importing countries -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Importing Countries</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="c in snapshot.topImportCountries"
              :key="c.iso3"
              @click="nav.push(`/countries/${c.iso3.toLowerCase()}`, String(year))"
              class="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-100 cursor-pointer transition-colors"
            >
              <span class="text-xs font-medium text-zinc-700 truncate">{{ c.name }}</span>
              <span class="text-xs font-semibold text-blue-500 shrink-0 ml-1">{{ formatUsd(c.usd) }}</span>
            </div>
          </div>
        </div>

        <!-- Top exporting countries -->
        <div class="bg-zinc-50 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 shrink-0">Top Exporting Countries</h3>
          <div class="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            <div
              v-for="c in snapshot.topExportCountries"
              :key="c.iso3"
              @click="nav.push(`/countries/${c.iso3.toLowerCase()}`, String(year))"
              class="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-100 cursor-pointer transition-colors"
            >
              <span class="text-xs font-medium text-zinc-700 truncate">{{ c.name }}</span>
              <span class="text-xs font-semibold text-orange-500 shrink-0 ml-1">{{ formatUsd(c.usd) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Row 3: historical context (compact strip) -->
      <div class="shrink-0 bg-zinc-50 rounded-xl px-3 py-2">
        <p class="text-xs text-zinc-500 leading-relaxed">
          <span class="font-semibold text-zinc-600">Historical context: </span>{{ snapshot.historicalNote }}
        </p>
      </div>

    </div>
  </PageWindow>
</template>

<script setup lang="ts">
import { YEARS } from '~/utils/dummyData'
import { getYearSnapshot } from '~/utils/tradeExtended'
import { formatUsd, formatWeight, formatGrowth, categoryToSlug } from '~/utils/formatters'
import { useNavHistory } from '~/composables/useNavHistory'

definePageMeta({ layout: 'canvas' })

const route = useRoute()
const nav   = useNavHistory()

const year = computed(() => parseInt(route.params.slug as string))

if (!YEARS.includes(year.value)) await navigateTo('/')

const snapshot = computed(() => getYearSnapshot(year.value))

const compareYear     = ref(year.value > (YEARS[0] ?? 1988) ? year.value - 1 : (YEARS[1] ?? 1989))
const compareSnapshot = computed(() => getYearSnapshot(compareYear.value))

const diffPercent = computed(() => {
  const current = snapshot.value.totalImports.usd + snapshot.value.totalExports.usd
  const compare = compareSnapshot.value.totalImports.usd + compareSnapshot.value.totalExports.usd
  return compare === 0 ? 0 : ((current - compare) / compare) * 100
})
</script>