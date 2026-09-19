import React from "react"

export default function SidebarSettings({
  language,
  handleManualLanguageChange,
  LANGUAGE_CONFIG,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  wordWrap,
  setWordWrap,
  minimap,
  setMinimap,
  roomId,
  handleCopyLink,
  copiedLink,
  activeFileName
}) {
  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto text-xs bg-[#161b22] text-[#c9d1d9] font-sans">
      <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-[#30363d]">
        <span className="font-bold text-[#8b949e] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <span>⚙️ Settings & Preferences</span>
        </span>
      </div>

      <div className="space-y-4">
        {/* Room Share Link */}
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#8b949e]">Collaboration Room</span>
            <span className="font-mono text-[#58a6ff]">{roomId}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full py-1.5 bg-[#1f6feb]/20 hover:bg-[#1f6feb]/30 text-[#58a6ff] border border-[#1f6feb]/40 rounded font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <span>🔗</span>
            <span>{copiedLink ? "Link Copied to Clipboard! ✓" : "Copy Share Link"}</span>
          </button>
        </div>

        {/* Language Override */}
        <div className="space-y-1">
          <label className="font-semibold text-[#f0f6fc] text-[11px] block">
            File Language ({activeFileName})
          </label>
          <select
            value={language}
            onChange={(e) => handleManualLanguageChange(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] text-[#58a6ff] font-bold rounded px-2.5 py-1.5 focus:outline-none cursor-pointer text-xs"
          >
            {LANGUAGE_CONFIG.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Editor Theme */}
        <div className="space-y-1">
          <label className="font-semibold text-[#f0f6fc] text-[11px] block">Editor Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded px-2.5 py-1.5 focus:outline-none cursor-pointer text-xs"
          >
            <option value="vs-dark">VS Dark (Default)</option>
            <option value="light">VS Light</option>
            <option value="hc-black">High Contrast Black</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-semibold text-[#f0f6fc]">Font Size</div>
            <div className="text-[10px] text-[#8b949e]">Editor text size</div>
          </div>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-[#0d1117] border border-[#30363d] text-[#58a6ff] rounded px-2.5 py-1 font-bold focus:outline-none cursor-pointer"
          >
            <option value={12}>12 px</option>
            <option value={13}>13 px</option>
            <option value={14}>14 px</option>
            <option value={16}>16 px</option>
            <option value={18}>18 px</option>
            <option value={20}>20 px</option>
          </select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-[#f0f6fc]">Tab Spacing</div>
            <div className="text-[10px] text-[#8b949e]">Indent width</div>
          </div>
          <select
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value))}
            className="bg-[#0d1117] border border-[#30363d] text-[#58a6ff] rounded px-2.5 py-1 font-bold focus:outline-none cursor-pointer"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-[#f0f6fc]">Word Wrap</div>
            <div className="text-[10px] text-[#8b949e]">Wrap long code lines</div>
          </div>
          <button
            onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
            className={`px-2.5 py-1 rounded font-bold border text-[11px] transition-colors cursor-pointer ${
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
            <div className="text-[10px] text-[#8b949e]">Overview thumbnail</div>
          </div>
          <button
            onClick={() => setMinimap(!minimap)}
            className={`px-2.5 py-1 rounded font-bold border text-[11px] transition-colors cursor-pointer ${
              minimap
                ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40"
                : "bg-[#21262d] text-[#8b949e] border-[#30363d]"
            }`}
          >
            {minimap ? "Visible ✓" : "Hidden ✕"}
          </button>
        </div>
      </div>
    </div>
  )
}
