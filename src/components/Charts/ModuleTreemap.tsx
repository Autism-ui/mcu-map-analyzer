import ReactECharts from 'echarts-for-react'
import type { ParsedMapData } from '../../types'
import { formatBytes } from '../../utils/formatters'

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
    title: {
      text: '模块内存占用树状图',
      left: 'center'
    },
    tooltip: {
      formatter: (params: any) => {
        return `${params.name}<br/>大小: ${formatBytes(params.value)}`
      }
    },
    series: [
      {
        type: 'treemap',
        data: treeData,
        leafDepth: 1,
        label: {
          show: true,
          formatter: '{b}'
        },
        upperLabel: {
          show: true,
          height: 30
        },
        itemStyle: {
          borderColor: '#fff'
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

  return <ReactECharts option={option} style={{ height: '500px' }} />
}
