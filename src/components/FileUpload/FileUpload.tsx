import { useCallback, useState } from 'react'

interface FileUploadProps {
  onFileLoad: (content: string, fileName: string) => void
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.map')) {
      alert('请上传 .map 文件')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小超过 50MB，可能导致性能问题')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileLoad(content, file.name)
    }
    reader.readAsText(file)
  }, [onFileLoad])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (!file) return

    if (!file.name.endsWith('.map')) {
      alert('请上传 .map 文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileLoad(content, file.name)
    }
    reader.readAsText(file)
  }, [onFileLoad])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-16 text-center
          transition-all duration-300 backdrop-blur-sm
          ${isDragging
            ? 'border-neon-cyan bg-neon-cyan/10 shadow-neon-cyan scale-105'
            : 'border-tech-border bg-dark-800/30 hover:border-neon-cyan/50 hover:bg-dark-800/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan" />

        <div className="space-y-6">
          {/* Upload icon */}
          <div className="flex justify-center">
            <svg
              className={`h-20 w-20 transition-colors duration-300 ${
                isDragging ? 'text-neon-cyan' : 'text-gray-600'
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M24 8v24m0-24l-8 8m8-8l8 8M8 36h32M12 40h24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Upload text */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-neon-cyan hover:text-neon-green font-mono text-lg transition-colors">
                [ CLICK_TO_UPLOAD ]
              </span>
              <span className="block mt-2 text-gray-500 font-mono text-sm">
                or drag & drop .map file here
              </span>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".map"
              onChange={handleFileChange}
            />
          </div>

          {/* File info */}
          <div className="pt-4 border-t border-tech-border">
            <p className="text-xs font-mono text-gray-600">
              SUPPORTED: GCC Compiler .map files
            </p>
            <p className="text-xs font-mono text-gray-700 mt-1">
              MAX_SIZE: 50MB
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
