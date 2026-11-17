// 빌드 시(Node 환경)에서만 쓰는 서버 렌더링 진입점
// - scripts/prerender.js 가 이 render() 를 호출해서 HTML 문자열을 얻고
//   dist/index.html 의 root 안에 꽂아 넣는다. (= SSG / 프리렌더)
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
