// 헤더의 로그인/로그아웃 버튼
// - 로그인 상태는 사람마다 다르므로 프리렌더(빌드 시 HTML)에는 넣지 않고,
//   브라우저에서 /api/auth/me 를 호출해서 채운다.
//   → 크롤러가 보는 HTML 은 항상 같음 (SEO 영향 없음) + hydration 불일치도 없음
import { useEffect, useState } from 'react'

type User = { sub: string; email: string; name: string; picture?: string }

// 콜백에서 실패하면 /?login_error=코드 로 돌아오므로 사람이 읽을 수 있는 문구로 변환
const errorText: Record<string, string> = {
  access_denied: '로그인을 취소했어요.',
  invalid_state: '로그인 요청이 만료됐거나 올바르지 않아요. 다시 시도해 주세요.',
  token_exchange_failed: '구글 토큰 교환에 실패했어요. (client secret 설정 확인)',
  missing_secret: '서버에 GOOGLE_CLIENT_SECRET 이 설정돼 있지 않아요.',
  userinfo_failed: '사용자 정보를 가져오지 못했어요.',
}

export default function AuthButton() {
  // undefined: 확인 중 / null: 비로그인 / User: 로그인됨
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // URL 의 login_error 읽고 나서 주소창에서 지워주기 (새로고침 시 같은 에러 반복 방지)
    const url = new URL(window.location.href)
    const err = url.searchParams.get('login_error')
    // reason: 구글이 돌려준 에러 코드 (예: invalid_client = 비밀번호 불일치, invalid_grant = 코드 만료/재사용)
    const reason = url.searchParams.get('reason')
    if (err) {
      setError((errorText[err] ?? `로그인 실패 (${err})`) + (reason ? ` [${reason}]` : ''))
      url.searchParams.delete('login_error')
      url.searchParams.delete('reason')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }

    fetch('/api/auth/me')
      .then((r) => (r.ok ? (r.json() as Promise<{ user: User | null }>) : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null)) // npm run dev (Hono 없음) 환경에서도 깨지지 않게
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  // 확인 중일 때는 자리만 잡아둬서 레이아웃이 흔들리지 않게 (CLS 방지)
  if (user === undefined) return <div className="h-9 w-28" aria-hidden />

  return (
    <div className="relative flex items-center gap-2">
      {user ? (
        <>
          {user.picture && (
            // 구글 프로필 이미지는 Referer 가 붙으면 가끔 403 → no-referrer
            <img
              src={user.picture}
              alt={`${user.name} 프로필 사진`}
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              className="rounded-full"
            />
          )}
          <span className="hidden text-sm text-slate-700 sm:inline">{user.name}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            로그아웃
          </button>
        </>
      ) : (
        // fetch 가 아니라 <a> 로 "페이지 이동"해야 구글 로그인 화면으로 리다이렉트가 됨
        // rel="nofollow": 크롤러가 로그인 링크를 따라가지 않게
        <a
          href="/api/auth/google/login"
          rel="nofollow"
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Google로 로그인
        </a>
      )}
      {error && (
        <p role="alert" className="absolute right-0 top-11 z-10 w-64 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 shadow">
          {error}
        </p>
      )}
    </div>
  )
}
