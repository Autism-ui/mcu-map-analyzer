import { describe, it, expect } from 'vitest'
import { parseGccMapFile } from './gccMapParser'

describe('GCC Map Parser', () => {
  it('should parse memory configuration', () => {
    const mapContent = `
Memory Configuration

Name             Origin             Length             Attributes
FLASH            0x08000000         0x00080000         xr
RAM              0x20000000         0x00020000         xrw
*default*        0x00000000         0xffffffff
`
    const result = parseGccMapFile(mapContent)
    expect(result.memoryRegions).toHaveLength(2)
    expect(result.memoryRegions[0].name).toBe('FLASH')
    expect(result.memoryRegions[0].origin).toBe(0x08000000)
  })

  it('should parse symbols from linker map', () => {
    const mapContent = `
.text           0x08000000      0x1000
 *(.text)
 .text          0x08000000       0x100 main.o
                0x08000000                main
 .text          0x08000100       0x50 utils.o
                0x08000100                helper_function
`
    const result = parseGccMapFile(mapContent)
    expect(result.symbols.length).toBeGreaterThan(0)
  })
})
