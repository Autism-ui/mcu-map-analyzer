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
