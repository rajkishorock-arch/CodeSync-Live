import React, { useState, useEffect, useRef } from "react"

export default function CommandPalette({
  isOpen,
  onClose,
  actions = []
}) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const filteredActions = actions.filter(
    (action) =>
      action.label.toLowerCase().includes(query.toLowerCase()) ||
      (action.category && action.category.toLowerCase().includes(query.toLowerCase()))
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose()
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (filteredActions.length > 0 ? (prev + 1) % filteredActions.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (filteredActions.length > 0 ? (prev - 1 + filteredActions.length) % filteredActions.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform()
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-[15vh] px-4">
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#30363d] bg-[#0d1117] gap-3">
          <span className="text-[#8b949e] text-base">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search action (e.g. Run, Format, Theme, Git)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[#f0f6fc] text-sm focus:outline-none placeholder-[#8b949e]"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-[#8b949e] bg-[#21262d] border border-[#30363d] rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-none space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8b949e]">No matching IDE commands found</div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={action.id || idx}
                  onClick={() => {
                    action.perform()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? "bg-[#1f6feb] text-white" : "text-[#c9d1d9] hover:bg-[#21262d]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{action.icon || "⚙️"}</span>
                    <div>
                      <div className="font-medium leading-tight">{action.label}</div>
                      {action.category && (
                        <div className={`text-[10px] ${isSelected ? "text-blue-100" : "text-[#8b949e]"}`}>
                          {action.category}
                        </div>
                      )}
                    </div>
                  </div>

                  {action.shortcut && (
                    <kbd
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                        isSelected
                          ? "bg-blue-600 border-blue-400 text-white"
                          : "bg-[#0d1117] border-[#30363d] text-[#8b949e]"
                      }`}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-[11px] text-[#8b949e]">
          <span>
            Use <kbd className="px-1 bg-[#21262d] rounded">↑</kbd> <kbd className="px-1 bg-[#21262d] rounded">↓</kbd> to navigate
          </span>
          <span>
            Press <kbd className="px-1 bg-[#21262d] rounded">↵ Enter</kbd> to execute
          </span>
        </div>
      </div>
    </div>
  )
}
