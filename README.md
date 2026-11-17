# SEO 학습 랩

React + Vite + Hono + Tailwind CSS v4 + Cloudflare Pages 로 만든 **SEO 기본 설정 학습용 페이지**.
소스 곳곳의 `[SEO n]` 주석 번호와 페이지의 체크리스트 번호가 같으니 같이 보면서 공부하면 됨.

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` | title, description, robots, canonical, OG/Twitter, JSON-LD 등 head 메타 전부 |
| `src/App.tsx` | 시맨틱 HTML 본문 (h1 1개, section/h2 계층, alt 등) |
| `src/components/SeoInspector.tsx` | 브라우저에서 현재 페이지 SEO 상태를 실시간 점검 |
| `src/entry-server.tsx` + `scripts/prerender.js` | 빌드 시 React → HTML 프리렌더 (JS 없이도 본문 노출) |
| `functions/[[path]].ts` | Hono: `/robots.txt`, `/sitemap.xml`, `/api/*` (Cloudflare Pages Functions) |
| `public/_routes.json` | 위 경로만 함수로 보내고 나머지는 정적 파일로 응답 |
| `public/404.html` | 없는 주소에 진짜 404 응답 (없으면 SPA로 간주돼 200 + index.html → soft 404) |
| `.env` | `VITE_SITE_URL` — canonical/og:url 등에 들어갈 정식 주소 |

## 명령어

```bash
npm run dev       # 프론트만 빠르게 개발 (Hono 경로는 동작 안 함)
npm run preview   # 빌드 + wrangler 로 Cloudflare 환경 그대로 로컬 실행 (http://localhost:8788)
npm run deploy    # wrangler 로 직접 배포
```

## GitHub + Cloudflare Pages 연결

1. GitHub에 빈 저장소 만들고 push
   ```bash
   git add . && git commit -m "init"
   git remote add origin https://github.com/<계정>/<저장소>.git
   git push -u origin main
   ```
2. Cloudflare 대시보드 → Workers & Pages → Create → Pages → **Connect to Git** → 저장소 선택
3. 빌드 설정
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 환경변수: `VITE_SITE_URL` = 실제 배포 주소 (예: `https://<프로젝트명>.pages.dev`)
4. 이후 `main` 에 push 할 때마다 자동 배포, PR/브랜치는 미리보기 URL 생성

## 배포 후 할 일

- [Google Search Console](https://search.google.com/search-console) / [네이버 서치어드바이저](https://searchadvisor.naver.com/) 에 사이트 등록 → `sitemap.xml` 제출
- [리치 결과 테스트](https://search.google.com/test/rich-results) 로 JSON-LD 검증
- [PageSpeed Insights](https://pagespeed.web.dev/) 로 Core Web Vitals 확인
- `public/og-image.png` 는 임시 그라디언트 이미지 → 1200x630 실제 이미지로 교체
