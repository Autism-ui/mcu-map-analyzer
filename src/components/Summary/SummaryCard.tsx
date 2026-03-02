interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  percentage?: number
}

export function SummaryCard({ title, value, subtitle, percentage }: SummaryCardProps) {
  return (
    <div className="group relative bg-dark-800/50 border border-tech-border rounded-lg p-6 backdrop-blur-sm hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-neon-cyan overflow-hidden">
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        <p className="mt-3 text-4xl font-display font-bold text-neon-cyan">
          {value}
        </p>
        {subtitle && (
          <p className="mt-2 text-sm font-mono text-gray-400">{subtitle}</p>
        )}
        {percentage !== undefined && (
          <div className="mt-5">
            <div className="relative w-full bg-dark-700 rounded-full h-2 overflow-hidden">
              {/* Animated stripes background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 245, 255, 0.3) 10px, rgba(0, 245, 255, 0.3) 20px)',
                  animation: 'stripeMove 1s linear infinite'
                }}
              />
              {/* Progress bar */}
              <div
                className="relative h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  background: percentage > 80
                    ? 'linear-gradient(90deg, #ffb020, #ff6b6b)'
                    : 'linear-gradient(90deg, #00f5ff, #b794f6)',
                  boxShadow: percentage > 80
                    ? '0 0 10px rgba(255, 176, 32, 0.5)'
                    : '0 0 10px rgba(0, 245, 255, 0.5)'
                }}
              />
            </div>
            <p className="mt-2 text-xs font-mono text-right text-gray-500">
              {percentage.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
        <div className="absolute top-2 right-2 w-2 h-2 bg-neon-cyan rounded-full animate-glow-pulse" />
      </div>
    </div>
  )
}
