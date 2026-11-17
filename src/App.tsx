// 메인 페이지 컴포넌트
// [SEO 포인트] 시맨틱 HTML 구조
// - header / nav / main / article / section / footer 같은 의미 있는 태그 사용
// - h1 은 페이지당 딱 1개, 그 아래 h2 → h3 순서로 계층 지키기
// - 이미지는 alt + width/height (alt: 이미지 검색/접근성, 크기 지정: 레이아웃 흔들림(CLS) 방지)
import SeoInspector from './components/SeoInspector'

// 페이지에서 설명할 SEO 항목들 (index.html 의 [SEO n] 주석과 번호를 맞춰둠)
const items = [
  { no: 1, title: 'lang 속성', where: 'index.html', desc: '<html lang="ko"> 로 문서 언어를 명시. 지역/언어별 검색결과에 영향.' },
  { no: 3, title: 'title 태그', where: 'index.html', desc: '검색결과의 제목. 핵심 키워드를 앞에, 30자 안팎으로.' },
  { no: 4, title: 'meta description', where: 'index.html', desc: '검색결과 설명문. 클릭률(CTR)을 좌우. 80~120자 권장.' },
  { no: 5, title: 'meta robots', where: 'index.html', desc: '색인(index)·링크추적(follow) 허용 여부를 페이지 단위로 제어.' },
  { no: 6, title: 'canonical', where: 'index.html', desc: '정식 URL 선언으로 중복 콘텐츠 문제 방지.' },
  { no: 7, title: 'Open Graph / Twitter 카드', where: 'index.html', desc: '카톡·슬랙·SNS 공유 시 미리보기 카드 구성.' },
  { no: 10, title: '구조화 데이터 (JSON-LD)', where: 'index.html', desc: 'schema.org 형식으로 페이지 의미를 기계가 이해하게. 리치 결과 후보.' },
  { no: 11, title: '프리렌더 (SSG)', where: 'scripts/prerender.js', desc: '빌드 때 React를 HTML로 미리 렌더 → JS 없이도 본문이 보임.' },
  { no: 12, title: 'robots.txt', where: 'functions/[[path]].ts', desc: 'Hono가 동적으로 생성. 크롤러 접근 규칙 + 사이트맵 위치 안내.' },
  { no: 13, title: 'sitemap.xml', where: 'functions/[[path]].ts', desc: 'Hono가 동적으로 생성. 크롤링할 URL 목록을 검색엔진에 제출.' },
]

export default function App() {
  return (
    <div className="min-h-screen">
      {/* header: 사이트 공통 상단 영역 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2 font-bold text-indigo-600">
            {/* 장식용이 아닌 의미 있는 이미지라면 alt 를 구체적으로 */}
            <img src="/favicon.svg" alt="SEO 학습 랩 로고" width={28} height={28} />
            SEO 학습 랩
          </a>
          {/* nav: 주요 내비게이션. 내부 링크는 크롤러가 페이지를 발견하는 경로 */}
          <nav aria-label="주요 메뉴">
            <ul className="flex gap-4 text-sm text-slate-600">
              <li><a className="hover:text-indigo-600" href="#checklist">체크리스트</a></li>
              <li><a className="hover:text-indigo-600" href="#inspector">실시간 점검</a></li>
              <li><a className="hover:text-indigo-600" href="#faq">FAQ</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* 페이지의 유일한 h1 */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          검색엔진 최적화(SEO) 기본 설정 학습 페이지
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          React + Vite + Hono + Tailwind 로 만든 페이지를 Cloudflare Pages 에 배포하면서,
          검색엔진이 좋아하는 설정을 하나씩 직접 확인해 보는 예제야.
        </p>

        {/* section 1: 설정 항목 설명 */}
        <section id="checklist" className="mt-12" aria-labelledby="checklist-title">
          <h2 id="checklist-title" className="text-2xl font-bold text-slate-900">SEO 설정 체크리스트</h2>
          <p className="mt-2 text-slate-600">
            번호는 소스코드의 <code className="rounded bg-slate-200 px-1">[SEO n]</code> 주석과 같아. 같이 열어놓고 보면 편해.
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.no} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">
                  <span className="mr-2 text-indigo-600">[SEO {it.no}]</span>
                  {it.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{it.desc}</p>
                <p className="mt-2 font-mono text-xs text-slate-400">{it.where}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* section 2: 브라우저에서 현재 head 를 직접 읽어서 점검 */}
        <section id="inspector" className="mt-14" aria-labelledby="inspector-title">
          <h2 id="inspector-title" className="text-2xl font-bold text-slate-900">실시간 SEO 점검</h2>
          <p className="mt-2 text-slate-600">
            지금 이 페이지의 &lt;head&gt; 와 본문을 읽어서 기본 항목을 자동으로 검사해.
          </p>
          <SeoInspector />
        </section>

        {/* section 3: FAQ - index.html 의 FAQPage JSON-LD 와 내용이 일치해야 함 (구글 가이드라인) */}
        <section id="faq" className="mt-14" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-bold text-slate-900">자주 묻는 질문</h2>
          <div className="mt-6 space-y-3">
            <details className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold">React 같은 SPA도 검색엔진에 잘 노출되나요?</summary>
              <p className="mt-2 text-slate-600">
                구글은 자바스크립트를 실행하지만 느리고 불완전할 수 있습니다. 이 예제처럼 빌드 시 HTML을
                미리 렌더링(프리렌더)해 두면 모든 크롤러가 내용을 바로 읽을 수 있습니다.
              </p>
            </details>
            <details className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold">robots.txt와 meta robots의 차이는?</summary>
              <p className="mt-2 text-slate-600">
                robots.txt는 크롤러의 접근(크롤링) 자체를 제어하고, meta robots는 페이지를 읽은 뒤
                색인할지 여부를 제어합니다.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-slate-500">
          {/* 외부 링크: 새 탭 + rel 지정 (noopener: 보안 / 필요하면 nofollow 로 링크 신뢰도 전달 차단) */}
          검증 도구:{' '}
          <a className="text-indigo-600 hover:underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">
            리치 결과 테스트
          </a>{' · '}
          <a className="text-indigo-600 hover:underline" href="https://pagespeed.web.dev/" target="_blank" rel="noopener">
            PageSpeed Insights
          </a>{' · '}
          <a className="text-indigo-600 hover:underline" href="https://searchadvisor.naver.com/" target="_blank" rel="noopener">
            네이버 서치어드바이저
          </a>
        </div>
      </footer>
    </div>
  )
}
