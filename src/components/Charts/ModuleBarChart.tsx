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
