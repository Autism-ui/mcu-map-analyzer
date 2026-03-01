import { useState, useMemo } from 'react'
import type { Symbol } from '../../types'
import { formatBytes, formatHex } from '../../utils/formatters'

interface SymbolTableProps {
  symbols: Symbol[]
}

type SortField = 'name' | 'size' | 'address' | 'section' | 'file'
type SortOrder = 'asc' | 'desc'

export function SymbolTable({ symbols }: SymbolTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const filteredAndSortedSymbols = useMemo(() => {
    let result = symbols.filter(symbol =>
      symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.file.toLowerCase().includes(searchTerm.toLowerCase())
    )

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'address':
          comparison = a.address - b.address
          break
        case 'section':
          comparison = a.section.localeCompare(b.section)
          break
        case 'file':
          comparison = a.file.localeCompare(b.file)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [symbols, searchTerm, sortField, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedSymbols.length / itemsPerPage)
  const paginatedSymbols = filteredAndSortedSymbols.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="搜索符号或文件名..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">
          共 {filteredAndSortedSymbols.length} 个符号
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                { field: 'name' as SortField, label: '符号名' },
                { field: 'size' as SortField, label: '大小' },
                { field: 'address' as SortField, label: '地址' },
                { field: 'section' as SortField, label: '段' },
                { field: 'file' as SortField, label: '文件' }
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {label}
                  {sortField === field && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedSymbols.map((symbol, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {symbol.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBytes(symbol.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {formatHex(symbol.address)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {symbol.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {symbol.file}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
