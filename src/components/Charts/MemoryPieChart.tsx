import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'
import { darkTechTheme, neonColors } from '../../utils/chartTheme'

interface MemoryPieChartProps {
  data: ParsedMapData
}

export function MemoryPieChart({ data }: MemoryPieChartProps) {
  const flashRegion = data.memoryRegions.find(r => r.name === 'FLASH')
  const ramRegion = data.memoryRegions.find(r => r.name === 'RAM')

  const option = {
    ...darkTechTheme,
    title: {
      ...darkTechTheme.title,
      text: 'MEMORY_DISTRIBUTION',
      left: 'center'
    },
    tooltip: {
      ...darkTechTheme.tooltip,
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>SIZE: ${formatBytes(params.value)} (${params.percent}%)`
      }
    },
    legend: {
      ...darkTechTheme.legend,
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    color: neonColors,
    series: [
      {
        name: 'Memory Usage',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0a0e1a',
          borderWidth: 2
        },
        label: {
          show: true,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#9ca3af',
          formatter: '{b}\n{d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#00f5ff'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 245, 255, 0.5)'
          }
        },
        data: [
          { value: flashRegion?.used || 0, name: 'Flash Used' },
          { value: flashRegion?.free || 0, name: 'Flash Free' },
          { value: ramRegion?.used || 0, name: 'RAM Used' },
          { value: ramRegion?.free || 0, name: 'RAM Free' }
        ]
      }
    ]
  }

  return (
    <div className="bg-dark-900/30 rounded-lg p-4 border border-tech-border">
      <ReactECharts option={option} style={{ height: '450px' }} />
    </div>
  )
}
