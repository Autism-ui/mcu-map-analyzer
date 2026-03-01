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
