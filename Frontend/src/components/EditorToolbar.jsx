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
    <>
      {/* File Tabs Bar */}
      <div className="flex items-center bg-[#161b22] border-b border-[#30363d] overflow-x-auto px-1 pt-1 gap-1 scrollbar-none shrink-0">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] cursor-pointer mr-1"
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
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md flex items-center gap-2 border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
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

      {/* Sub-Header Toolbar */}
      <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5 text-xs">
            <span>⚡ CodeSync</span>
            <span className="text-[#8b949e] text-[11px] font-normal">({activeFileName})</span>
          </span>

          {/* Version Diff View Button */}
          <button
            onClick={() => setShowDiffView(!showDiffView)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
              showDiffView
                ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40"
                : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]"
            }`}
            title="Toggle Code Version Diff View"
          >
            <span>⇄</span>
            <span>{showDiffView ? "Close Diff" : "Diff View"}</span>
          </button>
        </div>

        {/* Run Code Button & Terminal Toggle */}
        <div className="flex items-center gap-2">
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

          <button
            onClick={() => setShowConsole(!showConsole)}
            className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded transition-colors cursor-pointer text-xs font-semibold"
          >
            {showConsole ? "Hide Terminal 🔽" : "Show Terminal 🔼"}
          </button>
        </div>
      </div>
    </>
  )
}
