import React from "react"

export default function Breadcrumbs({ activeFileName, fileLanguages, getLanguageFromFileName }) {
  if (!activeFileName) return null

  const parts = activeFileName.split("/")
  const fileLang = fileLanguages[activeFileName] || getLanguageFromFileName(activeFileName)

  return (
    <div className="flex items-center px-3 py-1 bg-[#0d1117] border-b border-[#30363d] text-[11px] font-mono text-[#8b949e] gap-1.5 overflow-x-auto scrollbar-none select-none">
      <span className="text-[#58a6ff] hover:underline cursor-pointer">workspace</span>
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1
        return (
          <React.Fragment key={index}>
            <span>›</span>
            {isLast ? (
              <span className="text-[#c9d1d9] font-medium flex items-center gap-1">
                <span>
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
                <span>{part}</span>
              </span>
            ) : (
              <span className="text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer">📁 {part}</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
