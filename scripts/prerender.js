// 프리렌더 스크립트 (npm run build 마지막 단계)
// 1) vite build 로 만든 dist/index.html (빈 껍데기 + 메타태그)을 읽고
// 2) vite build --ssr 로 만든 dist-ssr/entry-server.js 의 render() 로 본문 HTML을 만든 뒤
// 3) <!--app-html--> 자리에 끼워 넣어 다시 저장한다.
// → 결과: JS 없이도 본문이 다 보이는 "검색엔진 친화적인" index.html
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const templatePath = path.join(root, 'dist', 'index.html')
const serverEntry = pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href

const template = fs.readFileSync(templatePath, 'utf-8')
const { render } = await import(serverEntry)

const placeholder = '<!--app-html-->'
if (!template.includes(placeholder)) {
  throw new Error(`index.html 에 ${placeholder} 자리표시자가 없음`)
}

fs.writeFileSync(templatePath, template.replace(placeholder, render()))
// SSR 번들은 배포할 필요 없으니 정리
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log('✅ 프리렌더 완료: dist/index.html')
