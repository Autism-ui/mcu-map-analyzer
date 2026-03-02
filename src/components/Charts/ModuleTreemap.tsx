import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'
import { darkTechTheme, neonColors } from '../../utils/chartTheme'

interface ModuleTreemapProps {
  data: ParsedMapData
}

export function ModuleTreemap({ data }: ModuleTreemapProps) {
  const allModules = data.modules
    .filter(m => m.totalSize > 0)
    .sort((a, b) => b.totalSize - a.totalSize)

  // 只保留前 50 个模块，避免过小的模块变成不可辨识的黑色小方块
  const treeData = allModules
    .slice(0, 50)
    .map(m => ({
      name: m.name,
      value: m.totalSize
    }))

  const option = {
    ...darkTechTheme,
    title: {
      ...darkTechTheme.title,
      text: 'MODULE_MEMORY_TREEMAP',
      left: 'center'
    },
    legend: { show: false },
    tooltip: {
      ...darkTechTheme.tooltip,
      formatter: (params: any) => {
        return `${params.name}<br/>SIZE: ${formatBytes(params.value)}`
      }
    },
    color: neonColors,
    series: [
      {
        type: 'treemap',
        data: treeData,
        leafDepth: 1,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          fontFamily: 'JetBrains Mono, monospace',
          formatter: '{b}',
          color: '#0a0e1a',
          fontSize: 11
        },
        itemStyle: {
          borderColor: '#0a0e1a',
          borderWidth: 2,
          gapWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 245, 255, 0.5)',
            borderColor: '#00f5ff'
          }
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 3
            }
          }
        ]
      }
    ]
  }

  return (
    <div className="bg-dark-900/30 rounded-lg p-4 border border-tech-border">
      <ReactECharts option={option} style={{ height: '500px' }} />
    </div>
  )
}
