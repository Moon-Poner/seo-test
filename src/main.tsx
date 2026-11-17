// 브라우저(클라이언트) 진입점
// - 빌드된 index.html 에는 이미 프리렌더된 HTML이 들어 있으므로
//   createRoot 가 아니라 hydrateRoot 로 "기존 HTML에 이벤트만 연결"한다.
// - 개발 서버(npm run dev)에서는 root 가 비어 있으므로 createRoot 로 그냥 그린다.
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
