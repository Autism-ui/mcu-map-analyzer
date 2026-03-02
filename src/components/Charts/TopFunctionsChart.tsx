import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'
import { darkTechTheme } from '../../utils/chartTheme'

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
    ...darkTechTheme,
    title: {
      ...darkTechTheme.title,
      text: `TOP_${limit}_FUNCTIONS`,
      left: 'center'
    },
    legend: { show: false },
    tooltip: {
      ...darkTechTheme.tooltip,
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 255, 136, 0.1)'
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
          color: 'rgba(0, 255, 136, 0.2)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 255, 136, 0.05)'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: topFunctions.map(f => f.name).reverse(),
      axisLabel: {
        interval: 0,
        rotate: 0,
        color: '#9ca3af',
        fontFamily: 'JetBrains Mono, monospace',
        formatter: (value: string) => {
          return value.length > 30 ? value.substring(0, 27) + '...' : value
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 255, 136, 0.2)'
        }
      }
    },
    series: [
      {
        name: 'Function Size',
        type: 'bar',
        data: topFunctions.map(f => f.size).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#00ff88' },
              { offset: 1, color: '#ffb020' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 255, 136, 0.5)'
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
