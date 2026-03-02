import { describe, it, expect } from 'vitest'
import { parseGccMapFile } from './gccMapParser'

describe('GCC Map Parser', () => {
  it('should parse memory configuration', () => {
    const mapContent = `
Memory Configuration

Name             Origin             Length             Attributes
RAM              0x0000000020000000 0x0000000000030000 xrw
CCMRAM           0x0000000010000000 0x0000000000010000 xrw
FLASH            0x0000000008000000 0x0000000000200000 xr
*default*        0x0000000000000000 0xffffffffffffffff
`
    const result = parseGccMapFile(mapContent)
    expect(result.memoryRegions).toHaveLength(3)

    const flash = result.memoryRegions.find(r => r.name === 'FLASH')
    expect(flash).toBeDefined()
    expect(flash!.origin).toBe(0x08000000)
    expect(flash!.length).toBe(0x200000)

    const ram = result.memoryRegions.find(r => r.name === 'RAM')
    expect(ram).toBeDefined()
    expect(ram!.origin).toBe(0x20000000)
    expect(ram!.length).toBe(0x30000)

    const ccmram = result.memoryRegions.find(r => r.name === 'CCMRAM')
    expect(ccmram).toBeDefined()
    expect(ccmram!.origin).toBe(0x10000000)
  })

  it('should parse .text input sections (single line format)', () => {
    const mapContent = `
Linker script and memory map

LOAD build/main.o

.text           0x00000000080001b0    0x45724
                0x00000000080001b0                . = ALIGN (0x4)
                0x00000000080001b0                _stext = .
 *(.text)
 .text          0x00000000080001b0       0x40 build/crtbegin.o
 *(.text*)
 .text.main     0x000000000800142c       0xa0 build/main.o
                0x000000000800142c                main
 .text.MX_GPIO_Init
                0x00000000080014cc      0x488 build/gpio.o
                0x00000000080014cc                MX_GPIO_Init
`
    const result = parseGccMapFile(mapContent)

    // 应解析出 3 个符号
    expect(result.symbols.length).toBe(3)

    // 检查 main 函数
    const mainSym = result.symbols.find(s => s.name === 'main')
    expect(mainSym).toBeDefined()
    expect(mainSym!.address).toBe(0x0800142c)
    expect(mainSym!.size).toBe(0xa0)
    expect(mainSym!.section).toBe('.text')
    expect(mainSym!.file).toBe('main.o')

    // 检查跨行格式的 MX_GPIO_Init
    const gpioSym = result.symbols.find(s => s.name === 'MX_GPIO_Init')
    expect(gpioSym).toBeDefined()
    expect(gpioSym!.size).toBe(0x488)
    expect(gpioSym!.section).toBe('.text')
    expect(gpioSym!.file).toBe('gpio.o')
  })

  it('should parse .data and .bss sections', () => {
    const mapContent = `
Linker script and memory map

.data           0x0000000020000000     0x3dbc load address 0x00000000080584b8
                0x0000000020000000                . = ALIGN (0x4)
 *(.data)
 *(.data*)
 .data.SystemCoreClock
                0x0000000020000064        0x4 build/system_stm32f4xx.o
                0x0000000020000064                SystemCoreClock
 .data.busmap   0x00000000200001d0      0x12c build/autotest.o
                0x00000000200001d0                busmap

.bss            0x0000000020003dc0    0x28198
                0x0000000020003dc0                _sbss = .
 *(.bss)
 *(.bss*)
 .bss.call_stack_info
                0x0000000020004000       0x90 build/cm_backtrace.o
 .bss.fw_name   0x0000000020004098       0x20 build/cm_backtrace.o
`
    const result = parseGccMapFile(mapContent)

    // 检查 .data 段符号
    const sysClk = result.symbols.find(s => s.name === 'SystemCoreClock')
    expect(sysClk).toBeDefined()
    expect(sysClk!.section).toBe('.data')
    expect(sysClk!.size).toBe(0x4)
    expect(sysClk!.file).toBe('system_stm32f4xx.o')

    const busmap = result.symbols.find(s => s.name === 'busmap')
    expect(busmap).toBeDefined()
    expect(busmap!.section).toBe('.data')
    expect(busmap!.size).toBe(0x12c)

    // 检查 .bss 段符号
    const callStack = result.symbols.find(s => s.name === 'call_stack_info')
    expect(callStack).toBeDefined()
    expect(callStack!.section).toBe('.bss')
    expect(callStack!.size).toBe(0x90)

    const fwName = result.symbols.find(s => s.name === 'fw_name')
    expect(fwName).toBeDefined()
    expect(fwName!.section).toBe('.bss')
    expect(fwName!.size).toBe(0x20)
  })

  it('should parse .rodata section', () => {
    const mapContent = `
Linker script and memory map

.rodata         0x00000000080458d8    0x12a50
                0x00000000080458d8                . = ALIGN (0x4)
 *(.rodata)
 *(.rodata*)
 .rodata.defaultTask_attributes
                0x00000000080459ec       0x24 build/freertos.o
                0x00000000080459ec                defaultTask_attributes
 .rodata.str1.4
                0x00000000080459d4       0x15 build/freertos.o
`
    const result = parseGccMapFile(mapContent)

    const taskAttr = result.symbols.find(s => s.name === 'defaultTask_attributes')
    expect(taskAttr).toBeDefined()
    expect(taskAttr!.section).toBe('.rodata')
    expect(taskAttr!.size).toBe(0x24)

    const strConst = result.symbols.find(s => s.name === 'str1.4')
    expect(strConst).toBeDefined()
    expect(strConst!.section).toBe('.rodata')
  })

  it('should extract file name from archive paths', () => {
    const mapContent = `
Linker script and memory map

.text           0x00000000080001b0    0x45724
 *(.text)
 .text          0x0000000008000200       0xa0 /home/user/gcc/arm-none-eabi/lib/thumb/v7e-m+fp/hard/libc_nano.a(lib_a-memchr.o)
                0x0000000008000200                memchr
`
    const result = parseGccMapFile(mapContent)

    const memchrSym = result.symbols.find(s => s.name === 'memchr')
    expect(memchrSym).toBeDefined()
    // 应提取出归档文件中的 .o 文件名
    expect(memchrSym!.file).toBe('lib_a-memchr.o')
  })

  it('should calculate memory usage from output sections', () => {
    const mapContent = `
Memory Configuration

Name             Origin             Length             Attributes
FLASH            0x0000000008000000 0x0000000000200000 xr
RAM              0x0000000020000000 0x0000000000030000 xrw
*default*        0x0000000000000000 0xffffffffffffffff

Linker script and memory map

.text           0x0000000008000000    0x10000
 *(.text*)

.rodata         0x0000000008010000     0x5000
 *(.rodata*)

.data           0x0000000020000000     0x1000 load address 0x0000000008015000
 *(.data*)

.bss            0x0000000020001000     0x8000
 *(.bss*)
`
    const result = parseGccMapFile(mapContent)

    const flash = result.memoryRegions.find(r => r.name === 'FLASH')
    expect(flash).toBeDefined()
    // FLASH 应包含 .text (0x10000) + .rodata (0x5000) = 0x15000
    expect(flash!.used).toBe(0x10000 + 0x5000)
    expect(flash!.free).toBe(0x200000 - 0x15000)

    const ram = result.memoryRegions.find(r => r.name === 'RAM')
    expect(ram).toBeDefined()
    // RAM 应包含 .data (0x1000) + .bss (0x8000) = 0x9000
    expect(ram!.used).toBe(0x1000 + 0x8000)
  })

  it('should aggregate modules correctly', () => {
    const mapContent = `
Linker script and memory map

.text           0x0000000008000000    0x10000
 *(.text*)
 .text.funcA    0x0000000008000100      0x100 build/module_a.o
                0x0000000008000100                funcA
 .text.funcB    0x0000000008000200       0x80 build/module_a.o
                0x0000000008000200                funcB
 .text.funcC    0x0000000008000280      0x200 build/module_b.o
                0x0000000008000280                funcC

.data           0x0000000020000000     0x1000
 *(.data*)
 .data.varX     0x0000000020000000       0x40 build/module_a.o
                0x0000000020000000                varX

.rodata         0x0000000008010000     0x5000
 *(.rodata*)
 .rodata.constY
                0x0000000008010000       0x20 build/module_b.o
                0x0000000008010000                constY
`
    const result = parseGccMapFile(mapContent)

    const modA = result.modules.find(m => m.name === 'module_a.o')
    expect(modA).toBeDefined()
    // module_a: funcA(0x100) + funcB(0x80) = 0x180 text, varX(0x40) data
    expect(modA!.textSize).toBe(0x100 + 0x80)
    expect(modA!.dataSize).toBe(0x40)
    expect(modA!.totalSize).toBe(0x100 + 0x80 + 0x40)

    const modB = result.modules.find(m => m.name === 'module_b.o')
    expect(modB).toBeDefined()
    // module_b: funcC(0x200) text, constY(0x20) rodata
    expect(modB!.textSize).toBe(0x200)
    expect(modB!.rodataSize).toBe(0x20)
    expect(modB!.totalSize).toBe(0x200 + 0x20)
  })

  it('should skip *fill* entries and zero-size sections', () => {
    const mapContent = `
Linker script and memory map

.bss            0x0000000020003dc0    0x28198
 *(.bss)
 .bss           0x0000000020003dc0       0x1c build/crtbegin.o
 *(.bss*)
 .bss.mem.11588
                0x0000000020003ddc      0x220 build/usbd_conf.o
 .bss.cfgidx.11519
                0x0000000020003ffc        0x1 build/usbd_ctlreq.o
 *fill*         0x0000000020003ffd        0x3
 .bss.call_stack_info
                0x0000000020004000       0x90 build/cm_backtrace.o
`
    const result = parseGccMapFile(mapContent)

    // *fill* 不应被解析为符号
    const fillSymbol = result.symbols.find(s => s.name?.includes('fill'))
    expect(fillSymbol).toBeUndefined()

    // 正常符号应该被解析
    expect(result.symbols.find(s => s.name === 'mem.11588')).toBeDefined()
    expect(result.symbols.find(s => s.name === 'call_stack_info')).toBeDefined()
  })
})
