// 실시간 SEO 점검 컴포넌트
// - 브라우저에서 document 를 직접 읽어 기본 SEO 항목을 검사한다.
// - 서버(프리렌더) 단계에는 document 가 없으므로 useEffect(=브라우저에서만 실행) 안에서 검사.
//   → SSR 결과와 첫 렌더 결과가 같아야 hydration 오류가 안 나기 때문에 처음엔 "검사 중" 상태로 둔다.
import { useEffect, useState } from 'react'

type Check = {
  label: string
  ok: boolean
  detail: string
}

// head 안의 메타태그 content 를 읽는 헬퍼
const meta = (selector: string) =>
  document.head.querySelector<HTMLMetaElement>(selector)?.content ?? ''

// Hono 가 제공하는 경로가 살아있는지 확인 (npm run dev 에선 Hono 가 안 떠 있으니 실패로 나옴)
async function probe(path: string, expectType: string) {
  try {
    const res = await fetch(path)
    const type = res.headers.get('content-type') ?? ''
    return res.ok && type.includes(expectType)
  } catch {
    return false
  }
}

export default function SeoInspector() {
  const [checks, setChecks] = useState<Check[] | null>(null)

  useEffect(() => {
    const run = async () => {
      const title = document.title
      const desc = meta('meta[name="description"]')
      const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? ''
      const h1Count = document.querySelectorAll('h1').length
      const imgsNoAlt = [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).length
      const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length
      const [robotsOk, sitemapOk] = await Promise.all([
        probe('/robots.txt', 'text/plain'),
        probe('/sitemap.xml', 'xml'),
      ])

      setChecks([
        { label: 'html lang', ok: !!document.documentElement.lang, detail: document.documentElement.lang || '없음' },
        { label: 'title 길이 (10~60자)', ok: title.length >= 10 && title.length <= 60, detail: `${title.length}자 · ${title}` },
        { label: 'meta description 길이 (50~160자)', ok: desc.length >= 50 && desc.length <= 160, detail: `${desc.length}자` },
        { label: 'canonical', ok: canonical.startsWith('http'), detail: canonical || '없음' },
        { label: 'og:title / og:image', ok: !!meta('meta[property="og:title"]') && !!meta('meta[property="og:image"]'), detail: meta('meta[property="og:image"]') || '없음' },
        { label: 'h1 은 1개', ok: h1Count === 1, detail: `${h1Count}개` },
        { label: '모든 img 에 alt', ok: imgsNoAlt === 0, detail: imgsNoAlt === 0 ? '통과' : `alt 없는 이미지 ${imgsNoAlt}개` },
        { label: '구조화 데이터 (JSON-LD)', ok: jsonLd > 0, detail: `${jsonLd}개` },
        { label: '/robots.txt (Hono)', ok: robotsOk, detail: robotsOk ? '응답 OK' : '응답 없음 — wrangler pages dev 또는 배포 환경에서 확인' },
        { label: '/sitemap.xml (Hono)', ok: sitemapOk, detail: sitemapOk ? '응답 OK' : '응답 없음 — wrangler pages dev 또는 배포 환경에서 확인' },
      ])
    }
    run()
  }, [])

  if (!checks) {
    return <p className="mt-6 text-slate-500">검사 중…</p>
  }

  const passed = checks.filter((c) => c.ok).length

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium">
        {checks.length}개 중 <span className="text-indigo-600">{passed}개</span> 통과
      </p>
      <ul className="divide-y divide-slate-100">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-3 px-5 py-3 text-sm">
            <span aria-hidden className={c.ok ? 'text-emerald-600' : 'text-rose-500'}>
              {c.ok ? '✔' : '✖'}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{c.label}</p>
              <p className="break-all text-slate-500">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
