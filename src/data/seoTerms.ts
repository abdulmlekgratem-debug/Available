/**
 * مصطلحات SEO قابلة للضرب التركيبي (Cartesian) مع المدن/البلديات/المناطق/الطرق
 * تُستخدم لتوليد عبارات بحث مركبة بالعربية والإنجليزية
 */

export const adTermsAr = [
  "لافتات طرقية",
  "لافتة طرقية",
  "لوحات طرقية",
  "لوحة طرقية",
  "دعاية طرقية",
  "إعلانات طرقية",
  "لافتات محلات",
  "حملة دعائية",
  "حملة إعلانية",
  "شركة دعاية وإعلان",
  "شركة إعلانات",
  "تأجير لوحات طرقية",
  "تأجير لافتات طرقية",
  "لوحات إعلانية",
  "بنر إعلاني",
] as const

export const adTermsEn = [
  "roadside billboards",
  "roadside signs",
  "road billboards",
  "outdoor advertising",
  "billboard rental",
  "billboards",
  "shop signage",
  "advertising campaign",
  "advertising agency",
  "OOH advertising",
  "ad campaign",
] as const

export const roadsAr = [
  "الطريق الساحلي",
  "الطريق السريع",
  "طريق المطار",
  "بوابة المدينة",
  "مدخل المدينة",
] as const

export const roadsEn = [
  "coastal road",
  "highway",
  "airport road",
  "city gateway",
  "city entrance",
] as const

/** خريطة عربي → إنجليزي للمدن والبلديات الشهيرة */
export const arToEn: Record<string, string> = {
  "طرابلس": "Tripoli",
  "بنغازي": "Benghazi",
  "مصراتة": "Misrata",
  "سبها": "Sabha",
  "زليتن": "Zliten",
  "الخمس": "Khoms",
  "الزاوية": "Zawiya",
  "صبراتة": "Sabratha",
  "صرمان": "Sarman",
  "ترهونة": "Tarhuna",
  "امسلاتة": "Msallata",
  "غريان": "Gharyan",
  "زوارة": "Zuwara",
  "سرت": "Sirte",
  "بني وليد": "Bani Walid",
  "أجدابيا": "Ajdabiya",
  "البيضاء": "Bayda",
  "درنة": "Derna",
  "طبرق": "Tobruk",
  "جنزور": "Janzour",
  "تاجوراء": "Tajoura",
  "عين زارة": "Ain Zara",
  "بوسليم": "Abu Salim",
  "سوق الجمعة": "Souk Al Juma",
  "سوق الخميس": "Souk Al Khamis",
  "قصر بن غشير": "Qasr Bin Ghashir",
  "السواني": "Al Sawani",
  "حي الأندلس": "Hay Al Andalus",
  "طرابلس المركز": "Tripoli Center",
  "القره بوللي": "Garabulli",
  "الطريق الساحلي": "Coastal Road",
  "النقازة": "Al Naqaza",
  "غنيمة": "Ghnima",
  "كعام": "Kaam",
  "علوص": "Alouss",
  "قصر خيار": "Qasr Khiar",
}
