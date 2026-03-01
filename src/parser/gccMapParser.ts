import type { ParsedMapData, MemoryRegion, Symbol, Module } from '../types'

export function parseGccMapFile(content: string): ParsedMapData {
  const lines = content.split('\n')

  return {
    memoryRegions: parseMemoryConfiguration(lines),
    symbols: parseSymbols(lines),
    modules: parseModules(lines)
  }
}

function parseMemoryConfiguration(lines: string[]): MemoryRegion[] {
  const regions: MemoryRegion[] = []
  let inMemorySection = false
  let foundHeader = false

  for (const line of lines) {
    if (line.includes('Memory Configuration')) {
      inMemorySection = true
      continue
    }

    if (inMemorySection) {
      // 跳过空行，直到找到表头
      if (!foundHeader && line.trim() === '') {
        continue
      }

      // 找到表头后，遇到空行表示结束
      if (foundHeader && line.trim() === '') {
        break
      }

      const match = line.match(/^\s*(\S+)\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)/)

      if (match) {
        if (match[1] === 'Name') {
          foundHeader = true
          continue
        }

        if (!match[1].includes('*default*')) {
          regions.push({
            name: match[1],
            origin: parseInt(match[2], 16),
            length: parseInt(match[3], 16),
            used: 0,
            free: parseInt(match[3], 16)
          })
        }
      }
    }
  }

  return regions
}

function parseSymbols(lines: string[]): Symbol[] {
  const symbols: Symbol[] = []
  let currentSection = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测段开始
    const sectionMatch = line.match(/^\.(\w+)\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)/)
    if (sectionMatch) {
      currentSection = '.' + sectionMatch[1]
      continue
    }

    // 解析符号
    const symbolMatch = line.match(/^\s+0x([0-9a-f]+)\s+(\S+)/)
    if (symbolMatch && currentSection) {
      const address = parseInt(symbolMatch[1], 16)
      const name = symbolMatch[2]

      // 尝试从下一行获取大小信息
      const nextLine = lines[i + 1]
      let size = 0
      if (nextLine) {
        const sizeMatch = nextLine.match(/0x([0-9a-f]+)\s+0x([0-9a-f]+)/)
        if (sizeMatch) {
          size = parseInt(sizeMatch[2], 16)
        }
      }

      // 提取文件名
      const fileMatch = line.match(/(\S+\.o)$/)
      const file = fileMatch ? fileMatch[1] : 'unknown'

      symbols.push({
        name,
        address,
        size,
        section: currentSection,
        file
      })
    }
  }

  return symbols
}

function parseModules(lines: string[]): Module[] {
  const moduleMap = new Map<string, Module>()

  // 从符号中聚合模块信息
  const symbols = parseSymbols(lines)

  for (const symbol of symbols) {
    if (!moduleMap.has(symbol.file)) {
      moduleMap.set(symbol.file, {
        name: symbol.file,
        totalSize: 0,
        textSize: 0,
        dataSize: 0,
        bssSize: 0
      })
    }

    const module = moduleMap.get(symbol.file)!
    module.totalSize += symbol.size

    if (symbol.section === '.text') {
      module.textSize += symbol.size
    } else if (symbol.section === '.data') {
      module.dataSize += symbol.size
    } else if (symbol.section === '.bss') {
      module.bssSize += symbol.size
    }
  }

  return Array.from(moduleMap.values())
}
