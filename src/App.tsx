import { useState } from 'react'
import type { ParsedMapData } from './types'
import { FileUpload } from './components/FileUpload'
import { SummaryCards } from './components/Summary'
import { TabPanel } from './components/Dashboard'
import { MemoryPieChart, TopFunctionsChart, ModuleTreemap, ModuleBarChart } from './components/Charts'
import { SymbolTable } from './components/SymbolTable'
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

            <SummaryCards data={mapData} />

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
                  content: (
                    <div className="space-y-6">
                      <ModuleTreemap data={mapData} />
                      <ModuleBarChart data={mapData} />
                    </div>
                  )
                },
                {
                  id: 'functions',
                  label: '函数分析',
                  content: <TopFunctionsChart data={mapData} />
                },
                {
                  id: 'optimization',
                  label: '优化建议',
                  content: <div>优化建议（待实现）</div>
                }
              ]}
            />

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">符号详细列表</h2>
              <SymbolTable symbols={mapData.symbols} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
