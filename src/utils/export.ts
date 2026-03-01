import type { ParsedMapData } from '../types'

export function exportToJSON(data: ParsedMapData, fileName: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${fileName}.analysis.json`)
}

export function exportToCSV(data: ParsedMapData, fileName: string) {
  const headers = ['符号名', '大小(字节)', '地址', '段', '文件']
  const rows = data.symbols.map(s => [
    s.name,
    s.size.toString(),
    `0x${s.address.toString(16)}`,
    s.section,
    s.file
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${fileName}.analysis.csv`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
