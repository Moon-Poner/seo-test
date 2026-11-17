// Cloudflare Pages Functions + Hono
// ------------------------------------------------------------
// - functions/[[path]].ts 는 "모든 경로"를 받는 catch-all 함수 파일.
// - 하지만 public/_routes.json 에서 아래 경로들만 함수로 보내도록 제한했기 때문에
//   나머지(index.html, js, css, 이미지)는 Cloudflare CDN 이 정적 파일로 바로 응답한다. (빠르고 무료 호출 수 절약)
// - 로컬 확인: npm run preview (wrangler pages dev)
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { auth, type Bindings } from '../server/auth'

// Bindings: Cloudflare 환경변수 타입 (c.env.GOOGLE_CLIENT_ID 등에 자동완성/타입체크)
const app = new Hono<{ Bindings: Bindings }>()

// 사이트맵에 넣을 페이지 목록
// 페이지가 늘어나면 여기에 추가 (또는 DB/CMS 에서 불러오도록 확장 가능 — 이게 Hono 로 동적 생성하는 이유)
const pages = [
  { path: '/', changefreq: 'weekly', priority: '1.0', lastmod: '2026-11-17' },
]

/**
 * [SEO 12] robots.txt
 * - 크롤러가 사이트에 오면 제일 먼저 읽는 파일
 * - Disallow: 크롤링 금지 경로 (API 같은 건 검색에 나올 필요 없음)
 * - Sitemap: 사이트맵 위치를 알려줌 (반드시 절대 URL)
 */
app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n')
  return c.text(body)
})

/**
 * [SEO 13] sitemap.xml
 * - 검색엔진에 "우리 사이트에 이런 URL들이 있어"라고 알려주는 목록
 * - 구글 서치콘솔 / 네이버 서치어드바이저에 이 주소를 제출하면 됨
 */
app.get('/sitemap.xml', (c) => {
  const origin = new URL(c.req.url).origin
  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${origin}${p.path}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

/**
 * API 예시
 * - X-Robots-Tag 헤더: HTML 이 아닌 응답(JSON, PDF 등)에 noindex 를 거는 방법
 *   (meta robots 태그는 HTML 에만 넣을 수 있으니까)
 */
app.use('/api/*', async (c, next) => {
  await next()
  c.header('X-Robots-Tag', 'noindex')
})

// 구글 로그인 라우트 묶음 (server/auth.ts) → /api/auth/google/login, /api/auth/me ...
app.route('/api/auth', auth)

app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

export const onRequest = handle(app)
