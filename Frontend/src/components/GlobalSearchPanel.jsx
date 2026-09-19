import React, { useState, useMemo } from "react"

export default function GlobalSearchPanel({
  filesList = [],
  docRef,
  onSelectResult
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [isCaseSensitive, setIsCaseSensitive] = useState(false)
  const [isRegex, setIsRegex] = useState(false)
  const [showReplace, setShowReplace] = useState(false)

  // Compute search matches across all Yjs file contents
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return []

    const results = []
    const ydoc = docRef?.current

    filesList.forEach((fileName) => {
      let content = ""
      if (ydoc) {
        content = ydoc.getText(`file_${fileName}`).toString()
      }

      if (!content) return

      const lines = content.split("\n")
      lines.forEach((lineText, lineIdx) => {
        let isMatch = false
        if (isRegex) {
          try {
            const flags = isCaseSensitive ? "g" : "gi"
            const regex = new RegExp(searchTerm, flags)
            isMatch = regex.test(lineText)
          } catch (e) {
            isMatch = false
          }
        } else {
          if (isCaseSensitive) {
            isMatch = lineText.includes(searchTerm)
          } else {
            isMatch = lineText.toLowerCase().includes(searchTerm.toLowerCase())
          }
        }

        if (isMatch) {
          results.push({
            fileName,
            lineNumber: lineIdx + 1,
            lineText: lineText.trim()
          })
        }
      })
    })

    return results
  }, [searchTerm, filesList, docRef, isCaseSensitive, isRegex])

  const handleReplaceAll = () => {
    if (!searchTerm.trim() || !docRef?.current) return
    const ydoc = docRef.current

    let count = 0
    filesList.forEach((fileName) => {
      const fileYText = ydoc.getText(`file_${fileName}`)
      const text = fileYText.toString()

      let newText = text
      if (isRegex) {
        try {
          const flags = isCaseSensitive ? "g" : "gi"
          const regex = new RegExp(searchTerm, flags)
          newText = text.replace(regex, replaceTerm)
        } catch (e) {}
      } else {
        const flags = isCaseSensitive ? "g" : "gi"
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(escaped, flags)
        newText = text.replace(regex, replaceTerm)
      }

      if (newText !== text) {
        fileYText.delete(0, fileYText.length)
        fileYText.insert(0, newText)
        count++
      }
    })

    alert(`Replaced all occurrences in ${count} file(s).`)
  }

  return (
    <div className="flex flex-col h-full bg-[#161b22] text-[#c9d1d9] text-xs select-none">
      {/* Search Header */}
      <div className="p-3 border-b border-[#30363d] space-y-2">
        <div className="flex items-center justify-between font-semibold text-[#f0f6fc] text-xs uppercase tracking-wider mb-1">
          <span>SEARCH & REPLACE</span>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="hover:text-[#58a6ff] cursor-pointer text-[11px] text-[#8b949e]"
          >
            {showReplace ? "▼ Replace" : "▶ Replace"}
          </button>
        </div>

        {/* Search Input Box */}
        <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 focus-within:border-[#58a6ff]">
          <span className="text-[#8b949e]">🔍</span>
          <input
            type="text"
            placeholder="Search across all files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-[#f0f6fc] focus:outline-none text-xs"
          />
          <button
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={`px-1 rounded text-[10px] font-mono cursor-pointer ${
              isCaseSensitive ? "bg-[#1f6feb] text-white" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
            title="Match Case (Aa)"
          >
            Aa
          </button>
          <button
            onClick={() => setIsRegex(!isRegex)}
            className={`px-1 rounded text-[10px] font-mono cursor-pointer ${
              isRegex ? "bg-[#1f6feb] text-white" : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
            title="Use Regular Expression (.*)"
          >
            .*
          </button>
        </div>

        {/* Replace Input Box */}
        {showReplace && (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 focus-within:border-[#58a6ff]">
              <span className="text-[#8b949e]">⇄</span>
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="w-full bg-transparent text-[#f0f6fc] focus:outline-none text-xs"
              />
            </div>
            <button
              onClick={handleReplaceAll}
              className="px-2.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-semibold cursor-pointer shrink-0"
              title="Replace All Occurrences"
            >
              Replace
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] text-[11px] text-[#8b949e] flex justify-between">
        <span>
          {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
        </span>
        {searchTerm && <span>{filesList.length} files searched</span>}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-none">
        {searchResults.length === 0 ? (
          <div className="text-center py-8 text-[#8b949e] text-xs">
            {searchTerm ? "No matches found in workspace" : "Type above to search across all project files"}
          </div>
        ) : (
          searchResults.map((res, index) => (
            <div
              key={index}
              onClick={() => onSelectResult && onSelectResult(res.fileName, res.lineNumber)}
              className="p-2 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-[#58a6ff]">
                <span>📄 {res.fileName}</span>
                <span className="text-[#8b949e]">Line {res.lineNumber}</span>
              </div>
              <div className="font-mono text-[11px] text-[#c9d1d9] truncate bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]/50">
                {res.lineText}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
