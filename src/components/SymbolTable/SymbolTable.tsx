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
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // 收集所有可用的 section 值，用于筛选下拉框
  const availableSections = useMemo(() => {
    const sections = new Set(symbols.map(s => s.section))
    return Array.from(sections).sort()
  }, [symbols])

  const filteredAndSortedSymbols = useMemo(() => {
    let result = symbols.filter(symbol => {
      const matchesSearch =
        symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.file.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSection = sectionFilter === 'all' || symbol.section === sectionFilter
      return matchesSearch && matchesSection
    })

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
  }, [symbols, searchTerm, sectionFilter, sortField, sortOrder])

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
    <div className="space-y-6">
      {/* Search bar & section filter */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="SEARCH: symbol or file name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-3 bg-dark-700 border border-tech-border rounded font-mono text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all duration-300"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-cyan/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Section 筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 uppercase">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-3 bg-dark-700 border border-tech-border rounded font-mono text-sm text-gray-300 focus:outline-none focus:border-neon-cyan transition-all duration-300 cursor-pointer appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300f5ff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center'
            }}
          >
            <option value="all">ALL</option>
            {availableSections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        <span className="text-sm font-mono text-gray-500 whitespace-nowrap">
          TOTAL: <span className="text-neon-cyan">{filteredAndSortedSymbols.length}</span>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-tech-border">
        <table className="min-w-full divide-y divide-tech-border">
          <thead className="bg-dark-900/80">
            <tr>
              {[
                { field: 'name' as SortField, label: 'SYMBOL_NAME' },
                { field: 'size' as SortField, label: 'SIZE' },
                { field: 'address' as SortField, label: 'ADDRESS' },
                { field: 'section' as SortField, label: 'SECTION' },
                { field: 'file' as SortField, label: 'FILE' }
              ].map(({ field, label }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-4 text-left text-xs font-mono font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-neon-cyan transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span>{label}</span>
                    {sortField === field && (
                      <span className="text-neon-cyan">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-dark-800/30 divide-y divide-tech-border">
            {paginatedSymbols.map((symbol, index) => (
              <tr
                key={index}
                className="hover:bg-neon-cyan/5 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300 group-hover:text-neon-cyan transition-colors">
                  {symbol.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-neon-green">
                  {formatBytes(symbol.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {formatHex(symbol.address)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  <span className="px-2 py-1 bg-dark-700 border border-tech-border rounded text-xs">
                    {symbol.section}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 max-w-xs truncate">
                  {symbol.file}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-dark-700 border border-tech-border rounded font-mono text-sm text-gray-400 hover:text-neon-cyan hover:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            PREV
          </button>
          <span className="text-sm font-mono text-gray-500">
            PAGE <span className="text-neon-cyan">{currentPage}</span> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-dark-700 border border-tech-border rounded font-mono text-sm text-gray-400 hover:text-neon-cyan hover:border-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  )
}
