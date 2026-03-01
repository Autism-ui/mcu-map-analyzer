# MCU Map 文件分析网站实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个纯前端的 MCU map 文件分析工具，支持上传 GCC map 文件并通过图形化界面展示内存使用情况

**Architecture:** React + TypeScript + Vite 构建的单页应用，使用 ECharts 进行数据可视化，所有解析逻辑在浏览器端完成，无需后端服务器

**Tech Stack:** React 18, TypeScript, Vite, ECharts, Tailwind CSS

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`

**Step 1: 初始化 npm 项目并安装依赖**

Run: `npm init -y`

然后安装依赖：
```bash
npm install react@18.2.0 react-dom@18.2.0
npm install -D vite@5.0.0 @vitejs/plugin-react@4.2.0 typescript@5.3.0
npm install -D @types/react@18.2.0 @types/react-dom@18.2.0
npm install echarts@5.4.3 echarts-for-react@3.0.2
npm install -D tailwindcss@3.4.0 postcss@8.4.32 autoprefixer@10.4.16
```

**Step 2: 创建 Vite 配置文件**

Create: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
```

**Step 3: 创建 TypeScript 配置文件**

Create: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create: `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 4: 初始化 Tailwind CSS**

Run: `npx tailwindcss init -p`

然后修改 `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 5: 创建 HTML 入口文件**

Create: `index.html`
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MCU Map 文件分析工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: 更新 package.json 脚本**

修改 `package.json` 添加脚本：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Step 7: 提交初始化代码**

```bash
git init
git add .
git commit -m "chore: 初始化项目配置"
```

---

## Task 2: 创建类型定义

**Files:**
- Create: `src/types/index.ts`

**Step 1: 创建数据类型定义**

Create: `src/types/index.ts`
```typescript
export interface MemoryRegion {
  name: string;
  origin: number;
  length: number;
  used: number;
  free: number;
}

export interface Symbol {
  name: string;
  address: number;
  size: number;
  section: string;
  file: string;
}

export interface Module {
  name: string;
  totalSize: number;
  textSize: number;
  dataSize: number;
  bssSize: number;
}

export interface ParsedMapData {
  memoryRegions: MemoryRegion[];
  symbols: Symbol[];
  modules: Module[];
}

export interface AlignmentIssue {
  symbolName: string;
  address: number;
  wastedBytes: number;
}

export interface OptimizationSuggestion {
  alignmentIssues: AlignmentIssue[];
  unusedSymbols: string[];
  duplicateSymbols: string[];
}
```

**Step 2: 提交类型定义**

```bash
git add src/types/
git commit -m "feat: 添加数据类型定义"
```

---

## Task 3: 实现 Map 文件解析器（核心逻辑）

**Files:**
- Create: `src/parser/gccMapParser.ts`
- Create: `src/parser/gccMapParser.test.ts`

**Step 1: 编写解析器测试（TDD）**

Create: `src/parser/gccMapParser.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { parseGccMapFile } from './gccMapParser'

describe('GCC Map Parser', () => {
  it('should parse memory configuration', () => {
    const mapContent = `
Memory Configuration

Name             Origin             Length             Attributes
FLASH            0x08000000         0x00080000         xr
RAM              0x20000000         0x00020000         xrw
*default*        0x00000000         0xffffffff
`
    const result = parseGccMapFile(mapContent)
    expect(result.memoryRegions).toHaveLength(2)
    expect(result.memoryRegions[0].name).toBe('FLASH')
    expect(result.memoryRegions[0].origin).toBe(0x08000000)
  })

  it('should parse symbols from linker map', () => {
    const mapContent = `
.text           0x08000000      0x1000
 *(.text)
 .text          0x08000000       0x100 main.o
                0x08000000                main
 .text          0x08000100       0x50 utils.o
                0x08000100                helper_function
`
    const result = parseGccMapFile(mapContent)
    expect(result.symbols.length).toBeGreaterThan(0)
  })
})
```

**Step 2: 安装测试依赖**

```bash
npm install -D vitest@1.0.0
```

更新 `package.json`:
```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

**Step 3: 运行测试确认失败**

Run: `npm test`
Expected: FAIL - parseGccMapFile is not defined

**Step 4: 实现基础解析器框架**

Create: `src/parser/gccMapParser.ts`
```typescript
import type { ParsedMapData, MemoryRegion, Symbol, Module } from '../types'

export function parseGccMapFile(content: string): ParsedMapData {
  const lines = content.split('\n')

  return {
    memoryRegions: parseMemoryConfiguration(lines),
    symbols: parseSymbols(lines),
    modules: parseModules(lines)
  }
}

function parseMemoryConfiguration(lines: string[]): MemoryRegion[] {
  const regions: MemoryRegion[] = []
  let inMemorySection = false

  for (const line of lines) {
    if (line.includes('Memory Configuration')) {
      inMemorySection = true
      continue
    }

    if (inMemorySection && line.trim() === '') {
      break
    }

    if (inMemorySection) {
      const match = line.match(/^(\w+)\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)/)
      if (match && match[1] !== 'Name' && match[1] !== '*default*') {
        regions.push({
          name: match[1],
          origin: parseInt(match[2], 16),
          length: parseInt(match[3], 16),
          used: 0,
          free: parseInt(match[3], 16)
        })
      }
    }
  }

  return regions
}

function parseSymbols(lines: string[]): Symbol[] {
  const symbols: Symbol[] = []
  let currentSection = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测段开始
    const sectionMatch = line.match(/^\.(\w+)\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)/)
    if (sectionMatch) {
      currentSection = '.' + sectionMatch[1]
      continue
    }

    // 解析符号
    const symbolMatch = line.match(/^\s+0x([0-9a-f]+)\s+(\S+)/)
    if (symbolMatch && currentSection) {
      const address = parseInt(symbolMatch[1], 16)
      const name = symbolMatch[2]

      // 尝试从下一行获取大小信息
      const nextLine = lines[i + 1]
      let size = 0
      if (nextLine) {
        const sizeMatch = nextLine.match(/0x([0-9a-f]+)\s+0x([0-9a-f]+)/)
        if (sizeMatch) {
          size = parseInt(sizeMatch[2], 16)
        }
      }

      // 提取文件名
      const fileMatch = line.match(/(\S+\.o)$/)
      const file = fileMatch ? fileMatch[1] : 'unknown'

      symbols.push({
        name,
        address,
        size,
        section: currentSection,
        file
      })
    }
  }

  return symbols
}

function parseModules(lines: string[]): Module[] {
  const moduleMap = new Map<string, Module>()

  // 从符号中聚合模块信息
  const symbols = parseSymbols(lines)

  for (const symbol of symbols) {
    if (!moduleMap.has(symbol.file)) {
      moduleMap.set(symbol.file, {
        name: symbol.file,
        totalSize: 0,
        textSize: 0,
        dataSize: 0,
        bssSize: 0
      })
    }

    const module = moduleMap.get(symbol.file)!
    module.totalSize += symbol.size

    if (symbol.section === '.text') {
      module.textSize += symbol.size
    } else if (symbol.section === '.data') {
      module.dataSize += symbol.size
    } else if (symbol.section === '.bss') {
      module.bssSize += symbol.size
    }
  }

  return Array.from(moduleMap.values())
}
```

**Step 5: 运行测试确认通过**

Run: `npm test`
Expected: PASS

**Step 6: 提交解析器代码**

```bash
git add src/parser/
git commit -m "feat: 实现 GCC map 文件解析器核心逻辑"
```

---

## Task 4: 创建基础应用结构

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

**Step 1: 创建样式文件**

Create: `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

**Step 2: 创建主入口文件**

Create: `src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 3: 创建 App 组件框架**

Create: `src/App.tsx`
```typescript
import { useState } from 'react'
import type { ParsedMapData } from './types'

function App() {
  const [mapData, setMapData] = useState<ParsedMapData | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            MCU Map 文件分析工具
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            上传 GCC 编译器生成的 map 文件，分析内存使用情况
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {!mapData ? (
          <div className="text-center py-12">
            <p className="text-gray-500">请上传 map 文件开始分析</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">数据已加载</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
```

**Step 4: 测试应用启动**

Run: `npm run dev`
Expected: 浏览器打开 http://localhost:3000，显示基础页面

**Step 5: 提交基础应用结构**

```bash
git add src/
git commit -m "feat: 创建基础应用结构和样式"
```

---

## Task 5: 实现文件上传组件

**Files:**
- Create: `src/components/FileUpload/FileUpload.tsx`
- Create: `src/components/FileUpload/index.ts`

**Step 1: 创建文件上传组件**

Create: `src/components/FileUpload/FileUpload.tsx`
```typescript
import { useCallback } from 'react'

interface FileUploadProps {
  onFileLoad: (content: string, fileName: string) => void
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.map')) {
      alert('请上传 .map 文件')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小超过 50MB，可能导致性能问题')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileLoad(content, file.name)
    }
    reader.readAsText(file)
  }, [onFileLoad])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    if (!file.name.endsWith('.map')) {
      alert('请上传 .map 文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileLoad(content, file.name)
    }
    reader.readAsText(file)
  }, [onFileLoad])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="space-y-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-gray-600">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-500">点击上传</span>
            <span> 或拖拽文件到此处</span>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".map"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-gray-500">支持 GCC 编译器生成的 .map 文件</p>
      </div>
    </div>
  )
}
```

Create: `src/components/FileUpload/index.ts`
```typescript
export { FileUpload } from './FileUpload'
```

**Step 2: 集成文件上传到 App**

Modify: `src/App.tsx`
```typescript
import { useState } from 'react'
import type { ParsedMapData } from './types'
import { FileUpload } from './components/FileUpload'
import { parseGccMapFile } from './parser/gccMapParser'

function App() {
  const [mapData, setMapData] = useState<ParsedMapData | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileLoad = (content: string, name: string) => {
    try {
      setError('')
      const parsed = parseGccMapFile(content)
      setMapData(parsed)
      setFileName(name)
    } catch (err) {
      setError('解析文件失败，请确保这是有效的 GCC map 文件')
      console.error(err)
    }
  }

  const handleReset = () => {
    setMapData(null)
    setFileName('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              MCU Map 文件分析工具
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              上传 GCC 编译器生成的 map 文件，分析内存使用情况
            </p>
          </div>
          {mapData && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              重新上传
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!mapData ? (
          <FileUpload onFileLoad={handleFileLoad} />
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">
                已加载文件: <span className="font-medium">{fileName}</span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
```

**Step 3: 测试文件上传功能**

Run: `npm run dev`
测试：
1. 拖拽一个 .map 文件到上传区域
2. 点击上传按钮选择文件
3. 验证文件名显示正确

**Step 4: 提交文件上传组件**

```bash
git add src/components/FileUpload/ src/App.tsx
git commit -m "feat: 实现文件上传组件和文件读取功能"
```

---

## Task 6: 实现总览卡片组件

**Files:**
- Create: `src/components/Summary/SummaryCard.tsx`
- Create: `src/components/Summary/SummaryCards.tsx`
- Create: `src/components/Summary/index.ts`
- Create: `src/utils/formatters.ts`

**Step 1: 创建格式化工具函数**

Create: `src/utils/formatters.ts`
```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`
}
```

**Step 2: 创建单个卡片组件**

Create: `src/components/Summary/SummaryCard.tsx`
```typescript
interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  percentage?: number
}

export function SummaryCard({ title, value, subtitle, percentage }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      )}
      {percentage !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 3: 创建卡片组容器**

Create: `src/components/Summary/SummaryCards.tsx`
```typescript
import { SummaryCard } from './SummaryCard'
import { formatBytes, formatPercentage } from '../../utils/formatters'
import type { ParsedMapData } from '../../types'

interface SummaryCardsProps {
  data: ParsedMapData
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const flashRegion = data.memoryRegions.find(r => r.name === 'FLASH')
  const ramRegion = data.memoryRegions.find(r => r.name === 'RAM')

  const flashUsed = flashRegion?.used || 0
  const flashTotal = flashRegion?.length || 1
  const ramUsed = ramRegion?.used || 0
  const ramTotal = ramRegion?.length || 1

  const largestFunction = data.symbols
    .filter(s => s.section === '.text')
    .sort((a, b) => b.size - a.size)[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SummaryCard
        title="Flash/ROM 使用率"
        value={formatPercentage(flashUsed, flashTotal)}
        subtitle={`${formatBytes(flashUsed)} / ${formatBytes(flashTotal)}`}
        percentage={(flashUsed / flashTotal) * 100}
      />
      <SummaryCard
        title="RAM 使用率"
        value={formatPercentage(ramUsed, ramTotal)}
        subtitle={`${formatBytes(ramUsed)} / ${formatBytes(ramTotal)}`}
        percentage={(ramUsed / ramTotal) * 100}
      />
      <SummaryCard
        title="总符号数量"
        value={data.symbols.length.toString()}
        subtitle={`${data.modules.length} 个模块`}
      />
      <SummaryCard
        title="最大函数"
        value={formatBytes(largestFunction?.size || 0)}
        subtitle={largestFunction?.name || 'N/A'}
      />
      <SummaryCard
        title="代码段大小"
        value={formatBytes(
          data.symbols
            .filter(s => s.section === '.text')
            .reduce((sum, s) => sum + s.size, 0)
        )}
        subtitle=".text section"
      />
      <SummaryCard
        title="数据段大小"
        value={formatBytes(
          data.symbols
            .filter(s => s.section === '.data' || s.section === '.bss')
            .reduce((sum, s) => sum + s.size, 0)
        )}
        subtitle=".data + .bss sections"
      />
    </div>
  )
}
```

Create: `src/components/Summary/index.ts`
```typescript
export { SummaryCards } from './SummaryCards'
export { SummaryCard } from './SummaryCard'
```

**Step 4: 集成到 App**

Modify: `src/App.tsx` - 在 mapData 存在时添加：
```typescript
import { SummaryCards } from './components/Summary'

// 在 return 的 mapData 分支中：
<div className="space-y-6">
  <div className="bg-white p-4 rounded-lg shadow">
    <p className="text-sm text-gray-600">
      已加载文件: <span className="font-medium">{fileName}</span>
    </p>
  </div>

  <SummaryCards data={mapData} />
</div>
```

**Step 5: 测试总览卡片**

Run: `npm run dev`
上传一个 map 文件，验证卡片显示正确

**Step 6: 提交总览卡片组件**

```bash
git add src/components/Summary/ src/utils/ src/App.tsx
git commit -m "feat: 实现总览卡片组件显示关键指标"
```

---

## Task 7: 实现图表组件（内存分布）

**Files:**
- Create: `src/components/Charts/MemoryPieChart.tsx`
- Create: `src/components/Charts/index.ts`

**Step 1: 创建内存分布饼图组件**

Create: `src/components/Charts/MemoryPieChart.tsx`
```typescript
import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'

interface MemoryPieChartProps {
  data: ParsedMapData
}

export function MemoryPieChart({ data }: MemoryPieChartProps) {
  const flashRegion = data.memoryRegions.find(r => r.name === 'FLASH')
  const ramRegion = data.memoryRegions.find(r => r.name === 'RAM')

  const option = {
    title: {
      text: '内存分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}: ${formatBytes(params.value)} (${params.percent}%)`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '内存使用',
        type: 'pie',
        radius: '50%',
        data: [
          { value: flashRegion?.used || 0, name: 'Flash 已使用' },
          { value: flashRegion?.free || 0, name: 'Flash 剩余' },
          { value: ramRegion?.used || 0, name: 'RAM 已使用' },
          { value: ramRegion?.free || 0, name: 'RAM 剩余' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '400px' }} />
}
```

Create: `src/components/Charts/index.ts`
```typescript
export { MemoryPieChart } from './MemoryPieChart'
```

**Step 2: 创建标签页容器组件**

Create: `src/components/Dashboard/TabPanel.tsx`
```typescript
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabPanelProps {
  tabs: Tab[]
}

export function TabPanel({ tabs }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-6 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
```

Create: `src/components/Dashboard/index.ts`
```typescript
export { TabPanel } from './TabPanel'
```

**Step 3: 集成图表到 App**

Modify: `src/App.tsx`
```typescript
import { TabPanel } from './components/Dashboard'
import { MemoryPieChart } from './components/Charts'

// 在 SummaryCards 后添加：
<TabPanel
  tabs={[
    {
      id: 'memory',
      label: '内存概览',
      content: <MemoryPieChart data={mapData} />
    },
    {
      id: 'modules',
      label: '模块分析',
      content: <div>模块分析（待实现）</div>
    },
    {
      id: 'functions',
      label: '函数分析',
      content: <div>函数分析（待实现）</div>
    },
    {
      id: 'optimization',
      label: '优化建议',
      content: <div>优化建议（待实现）</div>
    }
  ]}
/>
```

**Step 4: 测试图表显示**

Run: `npm run dev`
上传 map 文件，验证饼图正确显示

**Step 5: 提交图表组件**

```bash
git add src/components/Charts/ src/components/Dashboard/ src/App.tsx
git commit -m "feat: 实现内存分布饼图和标签页容器"
```

---

## Task 8: 实现函数排名图表

**Files:**
- Create: `src/components/Charts/TopFunctionsChart.tsx`

**Step 1: 创建函数排名柱状图**

Create: `src/components/Charts/TopFunctionsChart.tsx`
```typescript
import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'

interface TopFunctionsChartProps {
  data: ParsedMapData
  limit?: number
}

export function TopFunctionsChart({ data, limit = 20 }: TopFunctionsChartProps) {
  const topFunctions = data.symbols
    .filter(s => s.section === '.text' && s.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)

  const option = {
    title: {
      text: `Top ${limit} 最大函数`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>大小: ${formatBytes(data.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatBytes(value)
      }
    },
    yAxis: {
      type: 'category',
      data: topFunctions.map(f => f.name).reverse(),
      axisLabel: {
        interval: 0,
        rotate: 0,
        formatter: (value: string) => {
          return value.length > 30 ? value.substring(0, 27) + '...' : value
        }
      }
    },
    series: [
      {
        name: '函数大小',
        type: 'bar',
        data: topFunctions.map(f => f.size).reverse(),
        itemStyle: {
          color: '#3b82f6'
        }
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '600px' }} />
}
```

**Step 2: 更新 Charts index**

Modify: `src/components/Charts/index.ts`
```typescript
export { MemoryPieChart } from './MemoryPieChart'
export { TopFunctionsChart } from './TopFunctionsChart'
```

**Step 3: 集成到 App**

Modify: `src/App.tsx` - 更新标签页：
```typescript
import { TopFunctionsChart } from './components/Charts'

// 更新 functions 标签页：
{
  id: 'functions',
  label: '函数分析',
  content: <TopFunctionsChart data={mapData} />
}
```

**Step 4: 测试函数排名图表**

Run: `npm run dev`
切换到"函数分析"标签，验证柱状图显示

**Step 5: 提交函数排名图表**

```bash
git add src/components/Charts/ src/App.tsx
git commit -m "feat: 实现函数大小排名柱状图"
```

---

## Task 9: 实现模块分析图表

**Files:**
- Create: `src/components/Charts/ModuleTreemap.tsx`
- Create: `src/components/Charts/ModuleBarChart.tsx`

**Step 1: 创建模块树状图**

Create: `src/components/Charts/ModuleTreemap.tsx`
```typescript
import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'

interface ModuleTreemapProps {
  data: ParsedMapData
}

export function ModuleTreemap({ data }: ModuleTreemapProps) {
  const treeData = data.modules
    .filter(m => m.totalSize > 0)
    .map(m => ({
      name: m.name,
      value: m.totalSize
    }))

  const option = {
    title: {
      text: '模块内存占用树状图',
      left: 'center'
    },
    tooltip: {
      formatter: (params: any) => {
        return `${params.name}<br/>大小: ${formatBytes(params.value)}`
      }
    },
    series: [
      {
        type: 'treemap',
        data: treeData,
        leafDepth: 1,
        label: {
          show: true,
          formatter: '{b}'
        },
        upperLabel: {
          show: true,
          height: 30
        },
        itemStyle: {
          borderColor: '#fff'
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5
            }
          },
          {
            itemStyle: {
              gapWidth: 1
            }
          }
        ]
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '500px' }} />
}
```

**Step 2: 创建模块柱状图**

Create: `src/components/Charts/ModuleBarChart.tsx`
```typescript
import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'

interface ModuleBarChartProps {
  data: ParsedMapData
  limit?: number
}

export function ModuleBarChart({ data, limit = 20 }: ModuleBarChartProps) {
  const topModules = data.modules
    .filter(m => m.totalSize > 0)
    .sort((a, b) => b.totalSize - a.totalSize)
    .slice(0, limit)

  const option = {
    title: {
      text: `Top ${limit} 模块大小排名`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>总大小: ${formatBytes(data.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatBytes(value)
      }
    },
    yAxis: {
      type: 'category',
      data: topModules.map(m => m.name).reverse(),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          return value.length > 25 ? value.substring(0, 22) + '...' : value
        }
      }
    },
    series: [
      {
        name: '模块大小',
        type: 'bar',
        data: topModules.map(m => m.totalSize).reverse(),
        itemStyle: {
          color: '#10b981'
        }
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '600px' }} />
}
```

**Step 3: 更新 Charts index**

Modify: `src/components/Charts/index.ts`
```typescript
export { MemoryPieChart } from './MemoryPieChart'
export { TopFunctionsChart } from './TopFunctionsChart'
export { ModuleTreemap } from './ModuleTreemap'
export { ModuleBarChart } from './ModuleBarChart'
```

**Step 4: 集成到 App**

Modify: `src/App.tsx` - 更新 modules 标签页：
```typescript
import { ModuleTreemap, ModuleBarChart } from './components/Charts'

// 更新 modules 标签页：
{
  id: 'modules',
  label: '模块分析',
  content: (
    <div className="space-y-6">
      <ModuleTreemap data={mapData} />
      <ModuleBarChart data={mapData} />
    </div>
  )
}
```

**Step 5: 测试模块分析图表**

Run: `npm run dev`
切换到"模块分析"标签，验证树状图和柱状图显示

**Step 6: 提交模块分析图表**

```bash
git add src/components/Charts/ src/App.tsx
git commit -m "feat: 实现模块分析树状图和柱状图"
```

---

## Task 10: 完善解析器以计算内存使用

**Files:**
- Modify: `src/parser/gccMapParser.ts`

**Step 1: 更新解析器计算实际内存使用**

Modify: `src/parser/gccMapParser.ts` - 更新 `parseGccMapFile` 函数：
```typescript
export function parseGccMapFile(content: string): ParsedMapData {
  const lines = content.split('\n')
  const memoryRegions = parseMemoryConfiguration(lines)
  const symbols = parseSymbols(lines)
  const modules = parseModules(symbols)

  // 计算内存区域的实际使用量
  updateMemoryUsage(memoryRegions, symbols)

  return {
    memoryRegions,
    symbols,
    modules
  }
}

function updateMemoryUsage(regions: MemoryRegion[], symbols: Symbol[]) {
  for (const region of regions) {
    let used = 0

    for (const symbol of symbols) {
      // 检查符号是否在该内存区域内
      if (symbol.address >= region.origin && 
          symbol.address < region.origin + region.length) {
        used += symbol.size
      }
    }

    region.used = used
    region.free = region.length - used
  }
}

// 更新 parseModules 函数接受 symbols 参数
function parseModules(symbols: Symbol[]): Module[] {
  const moduleMap = new Map<string, Module>()

  for (const symbol of symbols) {
    if (!moduleMap.has(symbol.file)) {
      moduleMap.set(symbol.file, {
        name: symbol.file,
        totalSize: 0,
        textSize: 0,
        dataSize: 0,
        bssSize: 0
      })
    }

    const module = moduleMap.get(symbol.file)!
    module.totalSize += symbol.size

    if (symbol.section === '.text') {
      module.textSize += symbol.size
    } else if (symbol.section === '.data') {
      module.dataSize += symbol.size
    } else if (symbol.section === '.bss') {
      module.bssSize += symbol.size
    }
  }

  return Array.from(moduleMap.values())
}
```

**Step 2: 运行测试确认解析正确**

Run: `npm test`
Expected: PASS

**Step 3: 测试完整流程**

Run: `npm run dev`
上传 map 文件，验证所有数据正确显示

**Step 4: 提交解析器改进**

```bash
git add src/parser/
git commit -m "fix: 完善解析器计算内存实际使用量"
```

---

## Task 11: 实现符号详细表格

**Files:**
- Create: `src/components/SymbolTable/SymbolTable.tsx`
- Create: `src/components/SymbolTable/index.ts`

**Step 1: 创建符号表格组件**

Create: `src/components/SymbolTable/SymbolTable.tsx`
```typescript
import { useState, useMemo } from 'react'
import type { Symbol } from '../../types'
import { formatBytes, formatHex } from '../../utils/formatters'

interface SymbolTableProps {
  symbols: Symbol[]
}

type SortField = 'name' | 'size' | 'address' | 'section' | 'file'
type SortOrder = 'asc' | 'desc'

export function SymbolTable({ symbols }: SymbolTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const filteredAndSortedSymbols = useMemo(() => {
    let result = symbols.filter(symbol =>
      symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.file.toLowerCase().includes(searchTerm.toLowerCase())
    )

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'address':
          comparison = a.address - b.address
          break
        case 'section':
          comparison = a.section.localeCompare(b.section)
          break
        case 'file':
          comparison = a.file.localeCompare(b.file)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [symbols, searchTerm, sortField, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedSymbols.length / itemsPerPage)
  const paginatedSymbols = filteredAndSortedSymbols.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="搜索符号或文件名..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">
          共 {filteredAndSortedSymbols.length} 个符号
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                { field: 'name' as SortField, label: '符号名' },
                { field: 'size' as SortField, label: '大小' },
                { field: 'address' as SortField, label: '地址' },
                { field: 'section' as SortField, label: '段' },
                { field: 'file' as SortField, label: '文件' }
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {label}
                  {sortField === field && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedSymbols.map((symbol, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {symbol.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBytes(symbol.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {formatHex(symbol.address)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {symbol.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {symbol.file}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
```

Create: `src/components/SymbolTable/index.ts`
```typescript
export { SymbolTable } from './SymbolTable'
```

**Step 2: 集成到 App**

Modify: `src/App.tsx` - 在标签页后添加：
```typescript
import { SymbolTable } from './components/SymbolTable'

// 在 TabPanel 后添加：
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold mb-4">符号详细列表</h2>
  <SymbolTable symbols={mapData.symbols} />
</div>
```

**Step 3: 测试符号表格**

Run: `npm run dev`
验证表格显示、排序、搜索、分页功能

**Step 4: 提交符号表格组件**

```bash
git add src/components/SymbolTable/ src/App.tsx
git commit -m "feat: 实现符号详细表格，支持排序、搜索和分页"
```

---

## Task 12: 添加导出功能

**Files:**
- Create: `src/utils/export.ts`
- Modify: `src/App.tsx`

**Step 1: 创建导出工具函数**

Create: `src/utils/export.ts`
```typescript
import type { ParsedMapData } from '../types'

export function exportToJSON(data: ParsedMapData, fileName: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${fileName}.analysis.json`)
}

export function exportToCSV(data: ParsedMapData, fileName: string) {
  const headers = ['符号名', '大小(字节)', '地址', '段', '文件']
  const rows = data.symbols.map(s => [
    s.name,
    s.size.toString(),
    `0x${s.address.toString(16)}`,
    s.section,
    s.file
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${fileName}.analysis.csv`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

**Step 2: 添加导出按钮到 App**

Modify: `src/App.tsx` - 在 header 中添加导出按钮：
```typescript
import { exportToJSON, exportToCSV } from './utils/export'

// 在 header 的按钮区域添加：
{mapData && (
  <div className="flex space-x-2">
    <button
      onClick={() => exportToJSON(mapData, fileName)}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      导出 JSON
    </button>
    <button
      onClick={() => exportToCSV(mapData, fileName)}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      导出 CSV
    </button>
    <button
      onClick={handleReset}
      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
    >
      重新上传
    </button>
  </div>
)}
```

**Step 3: 测试导出功能**

Run: `npm run dev`
上传文件后，点击导出按钮，验证文件下载

**Step 4: 提交导出功能**

```bash
git add src/utils/export.ts src/App.tsx
git commit -m "feat: 添加 JSON 和 CSV 导出功能"
```

---

## Task 13: 添加 README 和部署配置

**Files:**
- Create: `README.md`
- Create: `.gitignore`

**Step 1: 创建 README**

Create: `README.md`
```markdown
# MCU Map 文件分析工具

一个基于 Web 的 MCU map 文件分析工具，支持上传 GCC 编译器生成的 map 文件，并通过图形化界面展示内存使用情况。

## 功能特性

- 📊 内存分布可视化（Flash/RAM 使用情况）
- 📈 函数大小排名分析
- 📦 模块级别内存占用统计
- 🔍 符号详细列表（支持搜索、排序、分页）
- 💾 导出分析结果（JSON/CSV 格式）
- 🎨 响应式设计，支持移动端

## 技术栈

- React 18 + TypeScript
- Vite
- ECharts
- Tailwind CSS

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 预览生产版本

\`\`\`bash
npm run preview
\`\`\`

## 使用说明

1. 打开应用
2. 拖拽或点击上传 GCC 生成的 .map 文件
3. 查看各种分析图表和数据
4. 可选：导出分析结果

## 部署

### Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify

\`\`\`bash
npm run build
# 将 dist 目录部署到 Netlify
\`\`\`

## 许可证

MIT
```

**Step 2: 创建 .gitignore**

Create: `.gitignore`
```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
```

**Step 3: 提交文档**

```bash
git add README.md .gitignore
git commit -m "docs: 添加 README 和 .gitignore"
```

---

## Task 14: 最终测试和优化

**Step 1: 运行完整测试**

Run: `npm test`
Expected: 所有测试通过

**Step 2: 构建生产版本**

Run: `npm run build`
Expected: 构建成功，无错误

**Step 3: 预览生产版本**

Run: `npm run preview`
测试所有功能正常工作

**Step 4: 性能检查**

使用浏览器开发者工具检查：
- 页面加载时间
- 大文件解析性能
- 图表渲染性能

**Step 5: 最终提交**

```bash
git add .
git commit -m "chore: 最终测试和优化完成"
```

---

## 完成

所有任务已完成！项目已准备好部署。

**下一步建议：**
1. 部署到 Vercel 或 Netlify
2. 添加示例 map 文件供用户测试
3. 收集用户反馈进行迭代改进
