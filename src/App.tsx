import { useState } from 'react'
import type { ParsedMapData } from './types'
import { FileUpload } from './components/FileUpload'
import { SummaryCards } from './components/Summary'
import { TabPanel } from './components/Dashboard'
import { MemoryPieChart, TopFunctionsChart, ModuleTreemap, ModuleBarChart } from './components/Charts'
import { SymbolTable } from './components/SymbolTable'
import { parseGccMapFile } from './parser/gccMapParser'
import { exportToJSON, exportToCSV } from './utils/export'

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
    <div className="min-h-screen">
      {/* Header with neon glow effect */}
      <header className="relative border-b border-tech-border bg-dark-900/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-purple/5" />
        <div className="relative max-w-7xl mx-auto py-8 px-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-display font-bold text-neon-cyan tracking-wider animate-glow-pulse">
              MCU MAP ANALYZER
            </h1>
            <p className="mt-2 text-sm font-mono text-gray-400">
              // GCC Memory Map Visualization Tool
            </p>
          </div>
          {mapData && (
            <div className="flex space-x-3">
              <button
                onClick={() => exportToJSON(mapData, fileName)}
                className="px-5 py-2.5 bg-dark-700 text-neon-cyan border border-neon-cyan/50 rounded font-mono text-sm hover:bg-neon-cyan/10 hover:shadow-neon-cyan transition-all duration-300"
              >
                EXPORT_JSON
              </button>
              <button
                onClick={() => exportToCSV(mapData, fileName)}
                className="px-5 py-2.5 bg-dark-700 text-neon-green border border-neon-green/50 rounded font-mono text-sm hover:bg-neon-green/10 hover:shadow-neon-green transition-all duration-300"
              >
                EXPORT_CSV
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-dark-700 text-gray-400 border border-gray-600 rounded font-mono text-sm hover:bg-dark-600 hover:text-white transition-all duration-300"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded backdrop-blur-sm animate-fade-in-up">
            <p className="text-red-400 font-mono text-sm">ERROR: {error}</p>
          </div>
        )}

        {!mapData ? (
          <FileUpload onFileLoad={handleFileLoad} />
        ) : (
          <div className="space-y-8">
            {/* File info banner */}
            <div className="bg-dark-800/50 border border-tech-border rounded p-4 backdrop-blur-sm animate-fade-in-up">
              <p className="text-sm font-mono text-gray-400">
                <span className="text-neon-cyan">LOADED:</span> {fileName}
              </p>
            </div>

            {/* Summary cards with staggered animation */}
            <div style={{ animationDelay: '0.1s' }} className="animate-fade-in-up">
              <SummaryCards data={mapData} />
            </div>

            {/* Tab panel with staggered animation */}
            <div style={{ animationDelay: '0.2s' }} className="animate-fade-in-up">
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
                    content: (
                      <div className="text-center py-12 text-gray-500 font-mono">
                        // OPTIMIZATION_MODULE: UNDER_DEVELOPMENT
                      </div>
                    )
                  }
                ]}
              />
            </div>

            {/* Symbol table with staggered animation */}
            <div style={{ animationDelay: '0.3s' }} className="animate-fade-in-up bg-dark-800/50 border border-tech-border rounded-lg backdrop-blur-sm p-6">
              <h2 className="text-xl font-display font-semibold text-neon-cyan mb-6">SYMBOL_TABLE</h2>
              <SymbolTable symbols={mapData.symbols} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
