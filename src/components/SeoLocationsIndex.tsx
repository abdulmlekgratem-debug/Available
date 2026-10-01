/**
 * فهرس المواقع والمناطق لمحركات البحث
 * يعرض جميع المدن/البلديات/المناطق/أقرب نقاط دالة كنص قابل للزحف
 * يحسّن ظهور الموقع في نتائج البحث للاستعلامات الجغرافية الدقيقة
 */
import seo from "@/data/seoKeywords.json"

type Tree = Record<string, Record<string, Record<string, string[]>>>

export default function SeoLocationsIndex() {
  const tree = seo.tree as Tree
  const cities = Object.keys(tree).sort()

  return (
    <section
      aria-label="فهرس المواقع التي نخدمها"
      className="border-t border-border/40 bg-background/60 py-10 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-2 text-center">
          المناطق التي نخدمها في ليبيا
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-3">
          استكشف المدن والمناطق في فهرس المواقع. راجع القائمة والخريطة لمعرفة التوفر الحالي.
        </p>
        <p className="text-xs text-muted-foreground/90 text-center mb-6 leading-relaxed max-w-3xl mx-auto">
          <span className="font-semibold text-foreground/80">المدن المسجلة في فهرس المواقع: </span>
          {seo.cities.map((c, i) => (
            <span key={c}>
              {c}{i < seo.cities.length - 1 ? "، " : "."}
            </span>
          ))}
        </p>


        <div className="grid gap-3 md:grid-cols-2">
          {cities.map((city) => {
            const muns = tree[city] || {}
            const munList = Object.keys(muns).filter(Boolean).sort()
            return (
              <details
                key={city}
                className="group rounded-lg border border-border/40 bg-card/40 p-3"
              >
                <summary className="cursor-pointer text-base font-bold text-foreground hover:text-primary transition-colors">
                  لوحات إعلانية في {city}
                  <span className="text-xs text-muted-foreground mr-2">
                    ({munList.length} بلدية)
                  </span>
                </summary>
                <div className="mt-3 space-y-3">
                  {munList.map((mun) => {
                    const areas = muns[mun] || {}
                    const areaList = Object.keys(areas).filter(Boolean).sort()
                    return (
                      <details key={mun} className="rounded border border-border/30 bg-background/40 p-2">
                        <summary className="cursor-pointer text-sm font-semibold text-primary/90">
                          لوحات إعلانية في بلدية {mun}
                        </summary>
                        <div className="mt-2 space-y-2 pr-3">
                          {areaList.map((area) => {
                            const landmarks = areas[area] || []
                            return (
                              <div key={area} className="text-xs">
                                <span className="font-semibold text-foreground">
                                  منطقة {area}:
                                </span>{" "}
                                <span className="text-muted-foreground leading-relaxed">
                                  {landmarks.map((l, i) => (
                                    <span key={i}>
                                      لوحة إعلانية {l}
                                      {i < landmarks.length - 1 ? "، " : ""}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>



      </div>
    </section>
  )
}
