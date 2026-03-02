import { SummaryCard } from './SummaryCard'
import { formatBytes, formatPercentage } from '../../utils/formatters'
import type { ParsedMapData } from '../../types'

interface SummaryCardsProps {
  data: ParsedMapData
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const flashRegion = data.memoryRegions.find(r => r.name === 'FLASH')
  const ramRegion = data.memoryRegions.find(r => r.name === 'RAM')

  const flashUsed = flashRegion?.used || 0
  const flashTotal = flashRegion?.length || 1
  const ramUsed = ramRegion?.used || 0
  const ramTotal = ramRegion?.length || 1

  const largestFunction = data.symbols
    .filter(s => s.section === '.text')
    .sort((a, b) => b.size - a.size)[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SummaryCard
        title="Flash/ROM 使用率"
        value={formatPercentage(flashUsed, flashTotal)}
        subtitle={`${formatBytes(flashUsed)} / ${formatBytes(flashTotal)}`}
        percentage={(flashUsed / flashTotal) * 100}
      />
      <SummaryCard
        title="RAM 使用率"
        value={formatPercentage(ramUsed, ramTotal)}
        subtitle={`${formatBytes(ramUsed)} / ${formatBytes(ramTotal)}`}
        percentage={(ramUsed / ramTotal) * 100}
      />
      <SummaryCard
        title="总符号数量"
        value={data.symbols.length.toString()}
        subtitle={`${data.modules.length} 个模块`}
      />
      <SummaryCard
        title="最大函数"
        value={formatBytes(largestFunction?.size || 0)}
        subtitle={largestFunction?.name || 'N/A'}
      />
      <SummaryCard
        title="代码段大小"
        value={formatBytes(
          data.symbols
            .filter(s => s.section === '.text')
            .reduce((sum, s) => sum + s.size, 0)
        )}
        subtitle=".text section"
      />
      <SummaryCard
        title="只读数据段大小"
        value={formatBytes(
          data.symbols
            .filter(s => s.section === '.rodata')
            .reduce((sum, s) => sum + s.size, 0)
        )}
        subtitle=".rodata section"
      />
      <SummaryCard
        title="数据段大小"
        value={formatBytes(
          data.symbols
            .filter(s => s.section === '.data' || s.section === '.bss')
            .reduce((sum, s) => sum + s.size, 0)
        )}
        subtitle=".data + .bss sections"
      />
    </div>
  )
}
