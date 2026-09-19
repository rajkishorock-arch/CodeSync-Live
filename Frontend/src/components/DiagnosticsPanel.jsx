import React from "react"

export default function DiagnosticsPanel({ markers, activeFileName, editorRef }) {
  const jumpToLine = (lineNumber, column) => {
    if (editorRef && editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber)
      editorRef.current.setPosition({ lineNumber, column: column || 1 })
      editorRef.current.focus()
    }
  }

  const errors = markers.filter((m) => m.severity === 8) // 8 = Error in Monaco
  const warnings = markers.filter((m) => m.severity === 4) // 4 = Warning in Monaco
  const infos = markers.filter((m) => m.severity === 2 || m.severity === 1)

  return (
    <div className="w-full h-full bg-[#0d1117] p-3 text-xs font-mono overflow-y-auto flex flex-col">
      <div className="flex items-center gap-4 mb-3 pb-2 border-b border-[#30363d] text-[11px]">
        <span className="flex items-center gap-1 text-[#f85149] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#f85149]"></span> {errors.length} Errors
        </span>
        <span className="flex items-center gap-1 text-[#d29922] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#d29922]"></span> {warnings.length} Warnings
        </span>
        <span className="flex items-center gap-1 text-[#58a6ff]">
          <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span> {infos.length} Info
        </span>
      </div>

      {markers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] font-sans">
          <span className="text-2xl mb-1">🎉</span>
          <span>No syntax problems detected in {activeFileName}. Clean code!</span>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1">
          {markers.map((marker, idx) => {
            const isErr = marker.severity === 8
            const isWarn = marker.severity === 4

            return (
              <div
                key={idx}
                onClick={() => jumpToLine(marker.startLineNumber, marker.startColumn)}
                className={`p-2 rounded border cursor-pointer transition-colors flex items-start gap-2.5 ${
                  isErr
                    ? "bg-[#f85149]/10 border-[#f85149]/30 hover:bg-[#f85149]/20 text-[#ff7b72]"
                    : isWarn
                    ? "bg-[#d29922]/10 border-[#d29922]/30 hover:bg-[#d29922]/20 text-[#e3b341]"
                    : "bg-[#1f6feb]/10 border-[#1f6feb]/30 hover:bg-[#1f6feb]/20 text-[#79c0ff]"
                }`}
              >
                <span className="text-sm shrink-0">{isErr ? "🚫" : isWarn ? "⚠️" : "ℹ️"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-0.5">
                    <span className="font-semibold text-[#f0f6fc]">
                      {activeFileName} [{marker.startLineNumber}:{marker.startColumn}]
                    </span>
                    <span>{marker.source || "LSP diagnostics"}</span>
                  </div>
                  <div className="break-words leading-snug">{marker.message}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
