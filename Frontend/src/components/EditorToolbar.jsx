import React from "react"

export default function EditorToolbar({
  isSidebarOpen,
  setIsSidebarOpen,
  filesList,
  activeFileName,
  fileLanguages,
  getLanguageFromFileName,
  handleSelectFile,
  showDiffView,
  setShowDiffView,
  handleRunCode,
  isRunning,
  showConsole,
  setShowConsole
}) {
  return (
    <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] px-2 pt-1 pb-1 gap-2 shrink-0 select-none">
      {/* Left: Mobile Toggle & Scrollable File Tabs */}
      <div className="flex items-center overflow-x-auto gap-1 scrollbar-none min-w-0 flex-1">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] cursor-pointer mr-1 shrink-0"
        >
          ☰
        </button>

        {filesList.map((fileName) => {
          const isActive = fileName === activeFileName
          const fileLang = fileLanguages[fileName] || getLanguageFromFileName(fileName)
          return (
            <button
              key={fileName}
              onClick={() => handleSelectFile(fileName)}
              className={`px-3 py-1 text-xs font-medium rounded-t-md flex items-center gap-1.5 border-t border-x transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-[#0d1117] text-[#58a6ff] border-[#30363d] border-b-[#0d1117] font-semibold"
                  : "bg-[#161b22] text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:bg-[#21262d]"
              }`}
            >
              <span className="text-xs">
                {fileLang === "javascript" && "📜"}
                {fileLang === "python" && "🐍"}
                {fileLang === "cpp" && "⚙️"}
                {fileLang === "c" && "⚙️"}
                {fileLang === "java" && "☕"}
                {fileLang === "typescript" && "📘"}
                {fileLang === "html" && "🌐"}
                {fileLang === "css" && "🎨"}
                {fileLang === "go" && "🐹"}
                {fileLang === "rust" && "🦀"}
                {fileLang === "php" && "🐘"}
                {fileLang === "sql" && "🗄️"}
                {fileLang === "json" && "📋"}
              </span>
              <span>{fileName}</span>
            </button>
          )
        })}
      </div>

      {/* Right: Actions (Diff View, Run Code, Hide Terminal) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Version Diff View Button */}
        <button
          onClick={() => setShowDiffView(!showDiffView)}
          className={`px-2 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
            showDiffView
              ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40"
              : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]"
          }`}
          title="Toggle Code Version Diff View"
        >
          <span>⇄</span>
          <span className="hidden sm:inline">{showDiffView ? "Close Diff" : "Diff View"}</span>
        </button>

        {/* Run Code Button */}
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-bold rounded shadow-sm transition-all cursor-pointer"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Running...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Run Code</span>
            </>
          )}
        </button>

        {/* Hide Terminal Toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded transition-colors cursor-pointer text-xs font-semibold"
        >
          {showConsole ? "Hide Terminal 🔽" : "Show Terminal 🔼"}
        </button>
      </div>
    </div>
  )
}
