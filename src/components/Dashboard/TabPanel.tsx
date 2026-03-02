import { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabPanelProps {
  tabs: Tab[]
}

export function TabPanel({ tabs }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  return (
    <div className="bg-dark-800/50 border border-tech-border rounded-lg backdrop-blur-sm overflow-hidden">
      {/* Tab navigation */}
      <div className="relative border-b border-tech-border bg-dark-900/50">
        <nav className="flex">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative py-4 px-8 font-mono text-sm font-medium transition-all duration-300
                ${activeTab === tab.id
                  ? 'text-neon-cyan'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Active indicator */}
              {activeTab === tab.id && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-glow-pulse" />
                  <div className="absolute inset-0 bg-neon-cyan/5" />
                </>
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech-border to-transparent" />
      </div>

      {/* Tab content */}
      <div className="p-8">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`
              transition-opacity duration-300
              ${activeTab === tab.id ? 'block animate-fade-in-up' : 'hidden'}
            `}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
