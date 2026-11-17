// 구글 로그인 (OAuth 2.0 Authorization Code 방식) - Hono 라우터
// ------------------------------------------------------------
// 전체 흐름
//   1) [로그인 버튼] → GET /api/auth/google/login
//        state(위조 방지용 랜덤값)를 쿠키에 저장하고 구글 로그인 화면으로 리다이렉트
//   2) 사용자가 구글에서 계정 선택/동의
//   3) 구글 → GET /api/auth/google/callback?code=...&state=...
//        - state 가 쿠키 값과 같은지 확인 (CSRF 방지)
//        - code 를 구글 토큰 서버에 보내 access_token 으로 교환 (이때 client_secret 사용 → 반드시 서버에서!)
//        - access_token 으로 사용자 정보(이메일, 이름, 프로필 사진) 조회
//        - 사용자 정보를 "서명된 쿠키"에 담아 세션 생성 후 홈으로 리다이렉트
//   4) 프론트는 GET /api/auth/me 로 로그인 상태 확인, POST /api/auth/logout 으로 로그아웃
//
// 왜 서버(Hono)에서 처리하나?
//   - client_secret 은 브라우저 코드에 들어가면 누구나 볼 수 있음 → 서버 환경변수로만 다뤄야 함
//   - 세션 쿠키를 httpOnly 로 만들면 자바스크립트(XSS)로 훔쳐갈 수 없음
import { Hono } from 'hono'
import type { Context } from 'hono'
import { deleteCookie, getCookie, getSignedCookie, setCookie, setSignedCookie } from 'hono/cookie'

// Cloudflare 환경변수 타입
// - GOOGLE_CLIENT_ID: wrangler.toml [vars] (공개돼도 되는 값)
// - GOOGLE_CLIENT_SECRET, SESSION_SECRET: 로컬은 .dev.vars, 배포는 Cloudflare 대시보드 "비밀"로 설정
export type Bindings = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  SESSION_SECRET?: string
}

// 세션 쿠키에 저장할 사용자 정보
export type SessionUser = {
  sub: string // 구글 계정 고유 ID (이메일은 바뀔 수 있으니 DB 키로는 이걸 쓰는 게 정석)
  email: string
  name: string
  picture?: string
  exp: number // 세션 만료 시각 (unix 초)
}

const STATE_COOKIE = 'oauth_state'
const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7일

// 쿠키 서명 키
// - SESSION_SECRET 이 있으면 그걸 쓰고, 없으면 client_secret 으로 대체 (학습용 편의)
// - 실서비스라면 SESSION_SECRET 을 따로 두는 게 좋음 (구글 비밀번호를 바꾸면 세션도 다 풀려버리니까)
const signingKey = (c: Context<{ Bindings: Bindings }>) =>
  c.env.SESSION_SECRET || c.env.GOOGLE_CLIENT_SECRET

// 리디렉션 URI 는 "지금 접속한 주소" 기준으로 만든다
// → 로컬(http://localhost:8788)과 배포(https://seo-test-9ia.pages.dev)를 같은 코드로 처리
// ⚠️ 구글 콘솔 "승인된 리디렉션 URI"에 등록된 주소만 동작함 (미리보기 배포 주소는 등록 안 돼 있어서 실패)
const redirectUri = (c: Context) => `${new URL(c.req.url).origin}/api/auth/google/callback`

// https 에서만 Secure 쿠키 (localhost http 개발 환경 고려)
const isSecure = (c: Context) => new URL(c.req.url).protocol === 'https:'

export const auth = new Hono<{ Bindings: Bindings }>()

/** 1) 로그인 시작: 구글 로그인 페이지로 보내기 */
auth.get('/google/login', (c) => {
  // state: 예측 불가능한 랜덤값. 콜백에서 돌아온 값과 비교해서 "내가 시작한 로그인"인지 확인
  const state = crypto.randomUUID()
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: isSecure(c),
    sameSite: 'Lax', // 구글 → 우리 사이트로 돌아오는 "최상위 이동"에는 Lax 쿠키가 같이 전송됨
    path: '/api/auth',
    maxAge: 60 * 10, // 10분 안에 로그인 안 끝내면 만료
  })

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(c),
    response_type: 'code',
    scope: 'openid email profile', // 심사 필요 없는 기본 범위만 요청
    state,
    prompt: 'select_account', // 매번 계정 선택 화면 보여주기 (여러 계정 테스트할 때 편함)
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

/** 2) 구글에서 돌아오는 곳: code → 토큰 → 사용자 정보 → 세션 쿠키 */
auth.get('/google/callback', async (c) => {
  const { code, state, error } = c.req.query()
  const savedState = getCookie(c, STATE_COOKIE)
  deleteCookie(c, STATE_COOKIE, { path: '/api/auth' }) // 한 번 쓰면 버림

  // 사용자가 동의 화면에서 "취소"한 경우 등
  if (error) return c.redirect(`/?login_error=${encodeURIComponent(error)}`)
  // state 불일치 = 위조 요청이거나 쿠키 만료
  if (!code || !state || state !== savedState) return c.redirect('/?login_error=invalid_state')

  // code 를 토큰으로 교환 (서버 ↔ 구글 직접 통신, 여기서 client_secret 사용)
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(c), // 로그인 시작 때와 정확히 같은 값이어야 함
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    console.error('토큰 교환 실패', tokenRes.status, await tokenRes.text())
    return c.redirect('/?login_error=token_exchange_failed')
  }
  const { access_token } = await tokenRes.json<{ access_token: string }>()

  // 사용자 정보 조회 (OpenID Connect userinfo 엔드포인트)
  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!userRes.ok) return c.redirect('/?login_error=userinfo_failed')
  const info = await userRes.json<{ sub: string; email: string; name?: string; picture?: string }>()

  const user: SessionUser = {
    sub: info.sub,
    email: info.email,
    name: info.name ?? info.email,
    picture: info.picture,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }

  // 서명된 쿠키: 값 뒤에 HMAC 서명이 붙어서, 사용자가 쿠키 내용을 조작하면 검증에서 걸림
  // (암호화는 아님 → 비밀번호 같은 민감정보는 넣지 말 것)
  await setSignedCookie(c, SESSION_COOKIE, JSON.stringify(user), signingKey(c), {
    httpOnly: true, // JS 에서 document.cookie 로 못 읽음 → XSS 로 세션 탈취 방지
    secure: isSecure(c),
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return c.redirect('/')
})

/** 3) 현재 로그인 사용자 조회 */
auth.get('/me', async (c) => {
  // 로그인 정보는 사람마다 다르므로 CDN/브라우저 캐시 금지
  c.header('Cache-Control', 'private, no-store')

  const raw = await getSignedCookie(c, signingKey(c), SESSION_COOKIE)
  if (!raw) return c.json({ user: null }) // 쿠키 없음 or 서명 위조(false)

  try {
    const user = JSON.parse(raw) as SessionUser
    if (user.exp < Date.now() / 1000) return c.json({ user: null })
    const { exp: _exp, ...publicUser } = user
    return c.json({ user: publicUser })
  } catch {
    return c.json({ user: null })
  }
})

/** 4) 로그아웃 (GET 이 아니라 POST: 이미지 태그 등으로 몰래 로그아웃시키는 장난 방지) */
auth.post('/logout', (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: isSecure(c) })
  return c.json({ ok: true })
})
