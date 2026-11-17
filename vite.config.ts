// Vite 설정 파일
// - react(): JSX 변환 + 개발 중 Fast Refresh
// - tailwindcss(): Tailwind v4 공식 Vite 플러그인 (별도 tailwind.config 불필요)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
