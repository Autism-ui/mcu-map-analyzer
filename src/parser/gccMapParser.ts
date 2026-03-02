import type { ParsedMapData, MemoryRegion, Symbol, Module } from '../types'

/**
 * 解析 GCC 链接器生成的 .map 文件
 *
 * GCC map 文件主要包含以下几个部分：
 * 1. Archive member included（归档成员引用关系）
 * 2. Memory Configuration（内存配置）
 * 3. Linker script and memory map（链接脚本与内存映射，核心部分）
 * 4. Cross Reference Table（交叉引用表）
 *
 * 在 "Linker script and memory map" 中：
 * - 输出段（output section）行首无空格：  .text  0x00000000080001b0  0x45724
 * - 输入段（input section）行首有空格：   .text.main  0x000000000800142c  0xa0 build/main.o
 * - 符号行缩进更深：                                  0x000000000800142c  main
 * - 段名过长时会换行，地址/大小/文件信息在下一行
 */
export function parseGccMapFile(content: string): ParsedMapData {
  const lines = content.split('\n')
  const memoryRegions = parseMemoryConfiguration(lines)
  const { symbols, outputSections } = parseLinkerMap(lines)
  const modules = parseModules(symbols)

  // 使用输出段大小计算内存区域的实际使用量
  updateMemoryUsage(memoryRegions, outputSections)

  return {
    memoryRegions,
    symbols,
    modules
  }
}

/** 内存配置段的解析 */
function parseMemoryConfiguration(lines: string[]): MemoryRegion[] {
  const regions: MemoryRegion[] = []
  let inMemorySection = false
  let foundDataLine = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''

    if (line.includes('Memory Configuration')) {
      inMemorySection = true
      continue
    }

    if (!inMemorySection) continue

    const trimmed = line.trim()

    // 跳过空行
    if (trimmed === '') {
      // 如果已经解析到了数据行，遇到空行表示结束
      if (foundDataLine) break
      continue
    }

    // 跳过表头行（包含 "Name" 和 "Origin" 等）
    if (trimmed.startsWith('Name') && trimmed.includes('Origin')) {
      continue
    }

    // 匹配数据行格式：
    // RAM              0x0000000020000000 0x0000000000030000 xrw
    const match = line.match(/^\s*(\S+)\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)/)
    if (match) {
      const name = match[1] ?? ''
      const originStr = match[2] ?? '0'
      const lengthStr = match[3] ?? '0'

      if (name.includes('*default*')) continue

      foundDataLine = true
      regions.push({
        name,
        origin: parseInt(originStr, 16),
        length: parseInt(lengthStr, 16),
        used: 0,
        free: parseInt(lengthStr, 16)
      })
    }
  }

  return regions
}

/** 输出段信息，用于计算内存使用量 */
interface OutputSection {
  name: string
  address: number
  size: number
}

/**
 * 解析 "Linker script and memory map" 部分
 *
 * 核心解析逻辑，识别三种行格式：
 *
 * 1. 输出段头（无前导空格）：
 *    .text           0x00000000080001b0    0x45724
 *
 * 2. 输入段（有前导空格），有两种子格式：
 *    a. 单行格式：
 *       .text.main     0x000000000800142c       0xa0 build/main.o
 *    b. 跨行格式（段名太长导致换行）：
 *       .text.HAL_TIM_PeriodElapsedCallback
 *                       0x0000000008001354       0x1c build/main.o
 *
 * 3. 符号行（深缩进）：
 *                       0x000000000800142c                main
 */
function parseLinkerMap(lines: string[]): { symbols: Symbol[], outputSections: OutputSection[] } {
  const symbols: Symbol[] = []
  const outputSections: OutputSection[] = []
  let inLinkerMap = false
  let currentOutputSection = ''

  // 用于跟踪已添加的符号，避免重复（按地址+段去重）
  const seenEntries = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''

    // 检测 "Linker script and memory map" 部分的开始
    if (line.includes('Linker script and memory map')) {
      inLinkerMap = true
      continue
    }

    // 检测结束（Cross Reference Table 部分）
    if (inLinkerMap && line.includes('Cross Reference Table')) {
      break
    }

    if (!inLinkerMap) continue

    // 跳过空行、LOAD 行、注释行、*fill* 行
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('LOAD') || trimmed.startsWith('*')) continue

    // === 1. 检测输出段头（行首无空格） ===
    // 格式: .text           0x00000000080001b0    0x45724
    // 输出段的特征：行首是段名（以 . 开头），无前导空格，后跟地址和大小
    // 注意：行尾没有 .o 文件名（输入段才有）
    const outputSectionMatch = line.match(
      /^(\.[a-zA-Z_]\S*)\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)/
    )
    if (outputSectionMatch && !(/\.o[)]*\s*$/.test(line))) {
      const name = outputSectionMatch[1] ?? ''
      const address = parseInt(outputSectionMatch[2] ?? '0', 16)
      const size = parseInt(outputSectionMatch[3] ?? '0', 16)

      currentOutputSection = name

      // 只记录有意义的段（有���际大小且在有效内存地址范围内）
      // 排除调试段（.debug_*, .comment, .ARM.*, .stab* 等）
      const isRelevantSection = /^\.(text|rodata|data|bss|isr_vector|ccmram|_user_heap_stack)/.test(name)
      if (size > 0 && isRelevantSection) {
        outputSections.push({ name, address, size })
      }
      continue
    }

    // === 2. 检测输入段（行首有空格） ===

    // 2a. 单行格式：
    //  .text.main     0x000000000800142c       0xa0 build/main.o
    //  .text          0x00000000080001b0       0x40 /path/to/crtbegin.o
    const inputSingleLine = line.match(
      /^ (\.\S+)\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)\s+(\S+\.o[)]*)\s*$/
    )
    if (inputSingleLine) {
      const sectionName = inputSingleLine[1] ?? ''
      const address = parseInt(inputSingleLine[2] ?? '0', 16)
      const size = parseInt(inputSingleLine[3] ?? '0', 16)
      const file = inputSingleLine[4] ?? 'unknown'

      // 跳过调试段和无关段
      if (isDebugSection(sectionName)) continue

      if (size > 0 && address > 0) {
        const sym = buildSymbol(sectionName, address, size, file, currentOutputSection, lines, i)
        const key = `${address}:${sym.section}`
        if (!seenEntries.has(key)) {
          seenEntries.add(key)
          symbols.push(sym)
        }
      }
      continue
    }

    // 2b. 跨行格式（段名在当前行，地址/大小/文件在下一行）：
    //  .text.HAL_TIM_PeriodElapsedCallback
    //                  0x0000000008001354       0x1c build/main.o
    const inputNameOnly = line.match(/^ (\.[a-zA-Z_]\S*)\s*$/)
    if (inputNameOnly && i + 1 < lines.length) {
      const sectionName = inputNameOnly[1] ?? ''

      // 跳过调试段和无关段
      if (isDebugSection(sectionName)) continue

      const nextLine = lines[i + 1] ?? ''
      const detailMatch = nextLine.match(
        /^\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)\s+(\S+\.o[)]*)\s*$/
      )
      if (detailMatch) {
        const address = parseInt(detailMatch[1] ?? '0', 16)
        const size = parseInt(detailMatch[2] ?? '0', 16)
        const file = detailMatch[3] ?? 'unknown'

        if (size > 0 && address > 0) {
          const sym = buildSymbol(sectionName, address, size, file, currentOutputSection, lines, i + 1)
          const key = `${address}:${sym.section}`
          if (!seenEntries.has(key)) {
            seenEntries.add(key)
            symbols.push(sym)
          }
        }
        i++ // 跳过已处理的下一行
        continue
      }
    }
  }

  return { symbols, outputSections }
}

/**
 * 从输入段信息构建 Symbol 对象
 *
 * @param sectionName - 输入段名，如 ".text.main" 或 ".data.SystemCoreClock"
 * @param address - 段地址
 * @param size - 段大小
 * @param rawFile - 原始文件路径
 * @param currentOutputSection - 当前所在的输出段
 * @param lines - 所有行（用于查找符号名）
 * @param lineIndex - 当前行索引
 */
function buildSymbol(
  sectionName: string,
  address: number,
  size: number,
  rawFile: string,
  currentOutputSection: string,
  lines: string[],
  lineIndex: number
): Symbol {
  // 确定所属的输出段（父段）
  const section = resolveOutputSection(sectionName, currentOutputSection)

  // 从子段名中提取符号名
  // .text.main → main
  // .data.SystemCoreClock → SystemCoreClock
  // .bss.call_stack_info → call_stack_info
  // .rodata.str1.4 → str1.4
  // .text → (无子名，需从符号行获取)
  let name = extractSymbolName(sectionName)

  // 如果从段名提取不到有意义的名字，尝试从后续的符号行中获取
  if (!name || name === sectionName) {
    const exportedName = findExportedSymbolName(lines, lineIndex, address)
    if (exportedName) {
      name = exportedName
    }
  }

  // 如果仍然没有名字，使用段名本身
  if (!name) {
    name = sectionName
  }

  // 提取文件名（只保留文件名部分，去掉路径）
  const file = extractFileName(rawFile)

  return { name, address, size, section, file }
}

/**
 * 判断段名是否为调试段或其他不需要分析的段
 * 调试段（.debug_*, .comment, .ARM.*, .stab* 等）不影响最终固件大小
 */
function isDebugSection(sectionName: string): boolean {
  return /^\.(debug_|comment|ARM\.|stab|fini_array|init_array|group|note)/.test(sectionName)
}

/**
 * 确定输入段所属的输出段
 * 例如 .text.main → .text, .rodata.str1.4 → .rodata
 */
function resolveOutputSection(sectionName: string, currentOutputSection: string): string {
  if (sectionName.startsWith('.text')) return '.text'
  if (sectionName.startsWith('.rodata')) return '.rodata'
  if (sectionName.startsWith('.data')) return '.data'
  if (sectionName.startsWith('.bss')) return '.bss'
  if (sectionName.startsWith('.isr_vector')) return '.isr_vector'
  if (sectionName.startsWith('.ccmram')) return '.ccmram'
  // 回退到当前输出段
  return currentOutputSection || sectionName
}

/**
 * 从输入段名中提取有意义的符号名
 * .text.main → main
 * .data.SystemCoreClock → SystemCoreClock
 * .bss.mem.11588 → mem.11588
 * .rodata.defaultTask_attributes → defaultTask_attributes
 * .text → null (纯段名，无法提取)
 */
function extractSymbolName(sectionName: string): string | null {
  // 去掉���段前缀
  // .text.main → main
  // .rodata.main.str1.4 → main.str1.4
  const prefixes = ['.text.', '.rodata.', '.data.', '.bss.', '.isr_vector.', '.ccmram.']

  for (const prefix of prefixes) {
    if (sectionName.startsWith(prefix) && sectionName.length > prefix.length) {
      return sectionName.substring(prefix.length)
    }
  }

  // 如果段名就是 .text / .data / .bss / .rodata 本身，返回 null
  if (['.text', '.data', '.bss', '.rodata', '.isr_vector', '.ccmram'].includes(sectionName)) {
    return null
  }

  return sectionName
}

/**
 * 从输入段后面的符号行中查找导出符号名
 * 符号行格式：
 *                  0x000000000800142c                main
 */
function findExportedSymbolName(lines: string[], startIndex: number, targetAddress: number): string | null {
  // 检查后面几行（通常符号行紧跟在输入段行后面）
  for (let j = startIndex + 1; j < Math.min(startIndex + 10, lines.length); j++) {
    const symLine = lines[j] ?? ''

    // 如果遇到新的输入段或输出段，停止搜索
    if (/^ \.\S/.test(symLine) || /^\.\S/.test(symLine)) break
    // 如果遇到空行，停止
    if (symLine.trim() === '') break
    // 跳过 *fill* 行
    if (symLine.trim().startsWith('*')) break

    // 匹配符号行：深缩进 + 地址 + 符号名
    const symMatch = symLine.match(/^\s+0x([0-9a-fA-F]+)\s+(\S+)/)
    if (symMatch) {
      const symAddress = parseInt(symMatch[1] ?? '0', 16)
      const symName = symMatch[2] ?? ''

      // 符号地址应与段地址匹配，且名字不应是 .o 文件
      if (symAddress === targetAddress && !symName.endsWith('.o') && !symName.startsWith('.')) {
        return symName
      }
    }
  }

  return null
}

/**
 * 从完整路径中提取文件名
 * build/main.o → main.o
 * /long/path/to/libc_nano.a(lib_a-memchr.o) → lib_a-memchr.o
 */
function extractFileName(rawFile: string): string {
  // 处理归档文件格式：libc_nano.a(lib_a-memchr.o) → lib_a-memchr.o
  const archiveMatch = rawFile.match(/\(([^)]+\.o)\)/)
  if (archiveMatch?.[1]) {
    return archiveMatch[1]
  }

  // 取路径最后一部分
  const parts = rawFile.split('/')
  return parts[parts.length - 1] ?? rawFile
}

/**
 * 使用输出段大小直接计算内存区域的实际使用量
 * 这比逐个累加符号更准确，因为包含了对齐填充等开销
 */
function updateMemoryUsage(regions: MemoryRegion[], outputSections: OutputSection[]) {
  for (const region of regions) {
    let used = 0

    for (const section of outputSections) {
      // 检查该输出段是否在当前内存区域内
      if (section.address >= region.origin &&
          section.address < region.origin + region.length) {
        used += section.size
      }
    }

    region.used = used
    region.free = Math.max(0, region.length - used)
  }
}

/** 从符号中聚合模块信息（按来源 .o 文件分组） */
function parseModules(symbols: Symbol[]): Module[] {
  const moduleMap = new Map<string, Module>()

  for (const symbol of symbols) {
    if (!moduleMap.has(symbol.file)) {
      moduleMap.set(symbol.file, {
        name: symbol.file,
        totalSize: 0,
        textSize: 0,
        dataSize: 0,
        bssSize: 0,
        rodataSize: 0
      })
    }

    const module = moduleMap.get(symbol.file)!
    module.totalSize += symbol.size

    switch (symbol.section) {
      case '.text':
        module.textSize += symbol.size
        break
      case '.data':
        module.dataSize += symbol.size
        break
      case '.bss':
        module.bssSize += symbol.size
        break
      case '.rodata':
        module.rodataSize += symbol.size
        break
      default:
        // 其他段（如 .isr_vector, .ccmram）计入 totalSize 但不分细类
        break
    }
  }

  return Array.from(moduleMap.values())
}
