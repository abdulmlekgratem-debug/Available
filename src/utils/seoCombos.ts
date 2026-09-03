/**
 * توليد تركيبات عبارات SEO من المصطلحات + المواقع
 */
import seo from "@/data/seoKeywords.json"
import {
  adTermsAr,
  adTermsEn,
  roadsAr,
  roadsEn,
  arToEn,
} from "@/data/seoTerms"

const uniq = (arr: string[]) => Array.from(new Set(arr))

/** عبارات عربية: {مصطلح} في {مدينة}، {مصطلح} {طريق} {مدينة}، {مصطلح} بلدية {بلدية}، إلخ */
export function buildArabicCombos(): string[] {
  const cities = seo.cities as string[]
  const municipalities = seo.municipalities as string[]
  const out: string[] = []

  for (const term of adTermsAr) {
    for (const c of cities) {
      out.push(`${term} في ${c}`)
      out.push(`${term} ${c}`)
      for (const r of roadsAr) {
        out.push(`${term} على ${r} ${c}`)
      }
    }
    for (const m of municipalities) {
      out.push(`${term} بلدية ${m}`)
      out.push(`${term} في بلدية ${m}`)
    }
  }
  return uniq(out)
}

/** عبارات إنجليزية: {term} in {city}، {term} on {road} {city}، إلخ */
export function buildEnglishCombos(): string[] {
  const cities = seo.cities as string[]
  const municipalities = seo.municipalities as string[]
  const out: string[] = []

  const cityNames = uniq(cities.map((c) => arToEn[c]).filter(Boolean))
  const munNames = uniq(municipalities.map((m) => arToEn[m]).filter(Boolean))

  for (const term of adTermsEn) {
    for (const c of cityNames) {
      out.push(`${term} ${c}`)
      out.push(`${term} in ${c}`)
      for (const r of roadsEn) {
        out.push(`${term} on ${r} ${c}`)
      }
    }
    for (const m of munNames) {
      out.push(`${term} ${m} municipality`)
    }
  }
  return uniq(out)
}

/** أعلى أولوية: للحقن في <meta keywords> — نأخذ {مصطلح × مدينة} فقط لتفادي التضخم */
export function topPriorityCombos(): { ar: string[]; en: string[] } {
  const cities = seo.cities as string[]
  const ar: string[] = []
  const en: string[] = []
  for (const term of adTermsAr) {
    for (const c of cities) {
      ar.push(`${term} في ${c}`)
      ar.push(`${term} ${c}`)
    }
  }
  for (const term of adTermsEn) {
    for (const c of cities.map((x) => arToEn[x]).filter(Boolean)) {
      en.push(`${term} ${c}`)
      en.push(`${term} in ${c}`)
    }
  }
  // أضف طريق ساحلي/سريع + مدينة
  for (const term of adTermsAr) {
    for (const c of cities) {
      ar.push(`${term} على الطريق الساحلي ${c}`)
      ar.push(`${term} على الطريق السريع ${c}`)
    }
  }
  for (const term of ["roadside billboards", "billboard rental", "outdoor advertising"]) {
    for (const c of cities.map((x) => arToEn[x]).filter(Boolean)) {
      en.push(`${term} on coastal road ${c}`)
      en.push(`${term} on highway ${c}`)
    }
  }
  return { ar: uniq(ar), en: uniq(en) }
}
