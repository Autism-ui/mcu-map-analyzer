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
