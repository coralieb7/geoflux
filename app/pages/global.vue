<template>
  <div class="absolute inset-0 z-40 p-4 md:p-12 pointer-events-none flex justify-center items-center">
    
    <div class="w-full h-full max-w-[1400px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl pointer-events-auto flex flex-col border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      
      <div class="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
            <UIcon name="i-heroicons-arrow-left" class="size-6" />
          </button>
          <h1 class="text-3xl font-bold text-zinc-800 dark:text-zinc-100 capitalize">Global Statistics</h1>
        </div>
        <button @click="router.push('/')" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
          <UIcon name="i-heroicons-x-mark" class="size-7" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div class="col-span-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <h2 class="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Global Commercial Balance</h2>
          <div class="mt-4">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Total World Trade (USD)</p>
            <p class="text-4xl font-bold text-zinc-800 dark:text-zinc-100">{{ formatCurrency(totalImportsUsd + totalExportsUsd) }}</p>
          </div>
          <div class="flex gap-4 mt-6">
            <div class="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
              <span class="text-xs text-blue-500 font-bold uppercase">Imports</span>
              <p class="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{{ formatCurrency(totalImportsUsd) }}</p>
            </div>
            <div class="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
              <span class="text-xs text-orange-500 font-bold uppercase">Exports</span>
              <p class="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{{ formatCurrency(totalExportsUsd) }}</p>
            </div>
          </div>
        </div>

        <div class="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Top Importing Countries</h2>
            <div class="flex flex-col gap-2">
              <div v-for="(country, idx) in topImporters" :key="country.iso3" 
                   @click="router.push(`/country/${country.iso3.toLowerCase()}`)"
                   class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-zinc-400 font-bold">{{ idx + 1 }}</span>
                  <span class="font-medium text-zinc-800 dark:text-zinc-200">{{ country.name }}</span>
                </div>
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">{{ formatCurrency(country.imports.usd) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Top Exporting Countries</h2>
            <div class="flex flex-col gap-2">
              <div v-for="(country, idx) in topExporters" :key="country.iso3" 
                   @click="router.push(`/country/${country.iso3.toLowerCase()}`)"
                   class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-zinc-400 font-bold">{{ idx + 1 }}</span>
                  <span class="font-medium text-zinc-800 dark:text-zinc-200">{{ country.name }}</span>
                </div>
                <span class="text-sm font-semibold text-orange-600 dark:text-orange-400">{{ formatCurrency(country.exports.usd) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 md:col-span-2 lg:col-span-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Top Commodity Categories (Global)</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="cat in topCategories" :key="cat.name" 
                 @click="router.push(`/category/${cat.name.toLowerCase().replace(/[\\s&]+/g, '-').replace(/-+/g, '-')}`)"
                 class="p-4 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors">
              <h3 class="font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ cat.name }}</h3>
              <p class="text-xs text-zinc-500 mt-1">Total Trade Volume</p>
              <p class="text-lg font-bold text-zinc-700 dark:text-zinc-300 mt-1">{{ formatCurrency(cat.total) }}</p>
            </div>
          </div>
        </div>

        <div class="col-span-1 md:col-span-2 lg:col-span-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6 min-h-[350px] flex flex-col">
          <h2 class="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Evolution Over Time (1988 - 2023)</h2>
          
          <div class="flex-1 w-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300 dark:border-zinc-700 m-4 rounded-lg">
              [ D3 Evolution Chart Placeholder ]
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TRADE_DATA, CATEGORIES } from '~/utils/dummyData'

definePageMeta({ layout: 'canvas' })

const router = useRouter()

// Utility to format numbers into currency visually (e.g., "$3.20M")
const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T` // Assuming base data is in millions
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}B`
  return `$${value.toLocaleString()}M`
}

// 1. Calculate Global Totals
const totalImportsUsd = computed(() => TRADE_DATA.reduce((sum, c) => sum + c.imports.usd, 0))
const totalExportsUsd = computed(() => TRADE_DATA.reduce((sum, c) => sum + c.exports.usd, 0))

// 2. Calculate Top Countries
const topImporters = computed(() => {
  return [...TRADE_DATA]
    .sort((a, b) => b.imports.usd - a.imports.usd)
    .slice(0, 4) // Show top 4
})

const topExporters = computed(() => {
  return [...TRADE_DATA]
    .sort((a, b) => b.exports.usd - a.exports.usd)
    .slice(0, 4) // Show top 4
})

// 3. Calculate Top Categories
const topCategories = computed(() => {
  const stats: Record<string, { imports: number, exports: number }> = {}
  
  // Initialize
  CATEGORIES.forEach(cat => stats[cat] = { imports: 0, exports: 0 })
  
  // Aggregate
  TRADE_DATA.forEach(country => {
    Object.entries(country.byCategory).forEach(([cat, data]) => {
      if (stats[cat] && data) {
        stats[cat].imports += data.imports.usd
        stats[cat].exports += data.exports.usd
      }
    })
  })
  
  // Sort and return top 8
  return Object.entries(stats)
    .map(([name, data]) => ({ name, ...data, total: data.imports + data.exports }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
})
</script>