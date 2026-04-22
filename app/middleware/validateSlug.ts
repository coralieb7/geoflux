import { TRADE_DATA, CATEGORIES, YEARS } from '~/utils/dummyData'
import { COMMODITIES } from '~/utils/tradeExtended'
import { slugToCategory } from '~/utils/formatters'

export default defineNuxtRouteMiddleware((to) => {
  const { name, params } = to
  const slug = (params.slug as string) ?? ''

  if (name === 'countries-slug' || name === 'imports-slug' || name === 'exports-slug') {
    const iso3 = slug.toUpperCase()
    if (!TRADE_DATA.find(c => c.iso3 === iso3)) return navigateTo('/')
  }

  if (name === 'categories-slug') {
    if (!slugToCategory(slug, CATEGORIES)) return navigateTo('/')
  }

  if (name === 'commodities-slug') {
    if (!COMMODITIES.find(c => c.id === slug)) return navigateTo('/')
  }

  if (name === 'years-slug') {
    if (!YEARS.includes(parseInt(slug))) return navigateTo('/')
  }
})
