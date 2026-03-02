import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'
import { darkTechTheme } from '../../utils/chartTheme'

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
    ...darkTechTheme,
    title: {
      ...darkTechTheme.title,
      text: `TOP_${limit}_MODULES`,
      left: 'center'
    },
    legend: { show: false },
    tooltip: {
      ...darkTechTheme.tooltip,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 245, 255, 0.1)'
        }
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>SIZE: ${formatBytes(data.value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: 50,
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatBytes(value),
        color: '#6b7280',
        fontFamily: 'JetBrains Mono, monospace'
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 245, 255, 0.2)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 245, 255, 0.05)'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: topModules.map(m => m.name).reverse(),
      axisLabel: {
        interval: 0,
        color: '#9ca3af',
        fontFamily: 'JetBrains Mono, monospace',
        formatter: (value: string) => {
          return value.length > 25 ? value.substring(0, 22) + '...' : value
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 245, 255, 0.2)'
        }
      }
    },
    series: [
      {
        name: 'Module Size',
        type: 'bar',
        data: topModules.map(m => m.totalSize).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#00f5ff' },
              { offset: 1, color: '#b794f6' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 245, 255, 0.5)'
          }
        }
      }
    ]
  }

  return (
    <div className="bg-dark-900/30 rounded-lg p-4 border border-tech-border">
      <ReactECharts option={option} style={{ height: '600px' }} />
    </div>
  )
}
