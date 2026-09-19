import React from "react"

export default function EditorSettings({
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  wordWrap,
  setWordWrap,
  minimap,
  setMinimap,
  onClose
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 text-xs text-[#c9d1d9] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
          <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
            <span>⚙️</span> Editor Preferences & Settings
          </span>
          <button
            onClick={onClose}
            className="hover:text-[#f85149] text-[#8b949e] font-bold text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#f0f6fc]">Font Size</div>
              <div className="text-[10px] text-[#8b949e]">Editor text size in pixels</div>
            </div>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-[#0d1117] border border-[#30363d] text-[#58a6ff] rounded px-3 py-1 font-bold focus:outline-none cursor-pointer"
            >
              <option value={12}>12 px</option>
              <option value={13}>13 px</option>
              <option value={14}>14 px (Default)</option>
              <option value={16}>16 px</option>
              <option value={18}>18 px</option>
              <option value={20}>20 px</option>
            </select>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#f0f6fc]">Tab Spacing</div>
              <div className="text-[10px] text-[#8b949e]">Indentation width</div>
            </div>
            <select
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
              className="bg-[#0d1117] border border-[#30363d] text-[#58a6ff] rounded px-3 py-1 font-bold focus:outline-none cursor-pointer"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#f0f6fc]">Word Wrap</div>
              <div className="text-[10px] text-[#8b949e]">Wrap long lines automatically</div>
            </div>
            <button
              onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
              className={`px-3 py-1 rounded font-bold border transition-colors cursor-pointer ${
                wordWrap === "on"
                  ? "bg-[#238636]/20 text-[#3fb950] border-[#238636]/40"
                  : "bg-[#21262d] text-[#8b949e] border-[#30363d]"
              }`}
            >
              {wordWrap === "on" ? "Enabled ✓" : "Disabled ✕"}
            </button>
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#f0f6fc]">Code Minimap</div>
              <div className="text-[10px] text-[#8b949e]">Show thumbnail code overview on right</div>
            </div>
            <button
              onClick={() => setMinimap(!minimap)}
              className={`px-3 py-1 rounded font-bold border transition-colors cursor-pointer ${
                minimap
                  ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40"
                  : "bg-[#21262d] text-[#8b949e] border-[#30363d]"
              }`}
            >
              {minimap ? "Visible ✓" : "Hidden ✕"}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#30363d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded text-xs transition-colors cursor-pointer"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  )
}
