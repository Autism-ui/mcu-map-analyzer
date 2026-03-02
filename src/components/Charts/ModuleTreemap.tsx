import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'
import { darkTechTheme, neonColors } from '../../utils/chartTheme'

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
    ...darkTechTheme,
    title: {
      ...darkTechTheme.title,
      text: 'MODULE_MEMORY_TREEMAP',
      left: 'center'
    },
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
        label: {
          show: true,
          fontFamily: 'JetBrains Mono, monospace',
          formatter: '{b}',
          color: '#0a0e1a',
          fontSize: 12
        },
        upperLabel: {
          show: true,
          height: 30,
          color: '#00f5ff',
          fontFamily: 'Orbitron, sans-serif'
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

  return (
    <div className="bg-dark-900/30 rounded-lg p-4 border border-tech-border">
      <ReactECharts option={option} style={{ height: '500px' }} />
    </div>
  )
}
