import React, { useState, useEffect } from "react"
import { DiffEditor } from "@monaco-editor/react"

export default function DiffViewer({
  activeFileName,
  currentCode,
  commits,
  language,
  theme,
  onClose
}) {
  const [selectedCommitId, setSelectedCommitId] = useState(
    commits && commits.length > 0 ? commits[commits.length - 1].id : "initial"
  )
  const [originalCode, setOriginalCode] = useState("")

  useEffect(() => {
    if (selectedCommitId === "initial") {
      setOriginalCode(`// Initial state of ${activeFileName}\n`)
      return
    }

    const commitObj = commits.find((c) => c.id === selectedCommitId)
    if (commitObj && commitObj.snapshot && commitObj.snapshot[activeFileName] !== undefined) {
      setOriginalCode(commitObj.snapshot[activeFileName])
    } else {
      setOriginalCode(`// File ${activeFileName} was created after commit #${selectedCommitId}`)
    }
  }, [selectedCommitId, commits, activeFileName])

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* Top Diff Control Bar */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#58a6ff] flex items-center gap-1.5">
            <span>⇄</span> Side-by-Side Diff Comparison ({activeFileName})
          </span>

          <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
            <span>Compare against:</span>
            <select
              value={selectedCommitId}
              onChange={(e) => setSelectedCommitId(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] rounded px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="initial">Initial Empty / Starter State</option>
              {commits &&
                commits.map((c) => (
                  <option key={c.id} value={c.id}>
                    Commit #{c.id} - "{c.message}" ({c.author})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded border border-[#30363d] font-semibold text-xs transition-colors cursor-pointer"
        >
          ✕ Close Diff View
        </button>
      </div>

      {/* Monaco Diff Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        <DiffEditor
          height="100%"
          language={language}
          theme={theme || "vs-dark"}
          original={originalCode}
          modified={currentCode}
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 13
          }}
        />
      </div>
    </div>
  )
}
