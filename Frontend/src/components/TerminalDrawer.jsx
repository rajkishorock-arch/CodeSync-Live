import React from "react"
import WebTerminal from "./WebTerminal"
import DiagnosticsPanel from "./DiagnosticsPanel"

export default function TerminalDrawer({
  showConsole,
  terminalTab,
  setTerminalTab,
  markers,
  consoleOutput,
  setConsoleOutput,
  isRunning,
  language,
  htmlPreview,
  activeFileName,
  filesList,
  fileLanguages,
  handleRunCode,
  username,
  roomId,
  users,
  yFilesMapRef,
  stdinInput,
  setStdinInput,
  editorRef
}) {
  if (!showConsole) return null

  return (
    <div className="h-60 sm:h-64 bg-[#0d1117] border-t border-[#30363d] flex flex-col font-mono text-xs">
      <div className="px-3 py-1 bg-[#161b22] border-b border-[#30363d] flex justify-between items-center text-[#8b949e] overflow-x-auto gap-2 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTerminalTab("output")}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              terminalTab === "output"
                ? "bg-[#0d1117] text-[#58a6ff] border border-[#30363d]"
                : "hover:text-[#c9d1d9] text-[#8b949e]"
            }`}
          >
            🖥️ Console Output
          </button>

          <button
            onClick={() => setTerminalTab("terminal")}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              terminalTab === "terminal"
                ? "bg-[#0d1117] text-[#3fb950] border border-[#30363d]"
                : "hover:text-[#c9d1d9] text-[#8b949e]"
            }`}
          >
            ❯_ Web Shell
          </button>

          <button
            onClick={() => setTerminalTab("stdin")}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              terminalTab === "stdin"
                ? "bg-[#0d1117] text-[#d29922] border border-[#30363d]"
                : "hover:text-[#c9d1d9] text-[#8b949e]"
            }`}
          >
            📥 Program Input (stdin)
          </button>

          <button
            onClick={() => setTerminalTab("problems")}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              terminalTab === "problems"
                ? "bg-[#0d1117] text-[#ff7b72] border border-[#30363d]"
                : "hover:text-[#c9d1d9] text-[#8b949e]"
            }`}
          >
            <span>⚠️ Problems</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                markers.filter((m) => m.severity === 8).length > 0
                  ? "bg-[#f85149] text-white"
                  : "bg-[#30363d] text-[#8b949e]"
              }`}
            >
              {markers.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {consoleOutput && (
            <button
              onClick={() => setConsoleOutput(null)}
              className="hover:text-[#f0f6fc] text-[#8b949e] cursor-pointer px-2 py-0.5 rounded bg-[#21262d] text-[11px]"
            >
              Clear Output
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {terminalTab === "output" && (
          <div className="flex-1 p-3 overflow-y-auto text-[#c9d1d9] selection:bg-[#1f6feb]/30">
            {isRunning && (
              <div className="flex items-center gap-2 text-[#d29922] italic font-sans">
                <span className="w-3 h-3 border-2 border-[#d29922] border-t-transparent rounded-full animate-spin"></span>
                Executing code...
              </div>
            )}

            {(language === "html" || language === "css") && htmlPreview && !isRunning && (
              <div className="w-full h-full border border-[#30363d] bg-white rounded overflow-hidden">
                <iframe title="HTML Preview" srcDoc={htmlPreview} className="w-full h-full border-0" />
              </div>
            )}

            {!isRunning && consoleOutput && (
              <>
                {consoleOutput.stdout && (
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[#f0f6fc]">
                    {consoleOutput.stdout}
                  </pre>
                )}
                {consoleOutput.stderr && (
                  <div className="p-2 rounded bg-[#f85149]/15 border border-[#f85149]/30 text-[#ff7b72] whitespace-pre-wrap font-mono">
                    <span className="font-bold text-[#f85149] block mb-1">Execution Error:</span>
                    {consoleOutput.stderr}
                  </div>
                )}
              </>
            )}

            {!isRunning && !consoleOutput && language !== "html" && language !== "css" && (
              <div className="text-[#8b949e] italic font-sans text-xs">
                Click green <strong className="text-[#3fb950] font-semibold">"▶ Run Code"</strong> button to execute code...
              </div>
            )}
          </div>
        )}

        {terminalTab === "terminal" && (
          <WebTerminal
            activeFileName={activeFileName}
            filesList={filesList}
            fileLanguages={fileLanguages}
            handleRunCode={handleRunCode}
            username={username}
            roomId={roomId}
            users={users}
            yFilesMapRef={yFilesMapRef}
          />
        )}

        {terminalTab === "stdin" && (
          <div className="flex-1 bg-[#0d1117] p-3 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
              <span>Program Input Stream (stdin)</span>
              <span className="text-[10px] text-[#58a6ff]">Passed to scanf / cin / input()</span>
            </label>
            <textarea
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="Enter inputs here line by line (e.g. 5&#10;10 20 30)..."
              className="flex-1 w-full bg-[#161b22] border border-[#30363d] rounded p-2.5 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff] resize-none"
            />
          </div>
        )}

        {terminalTab === "problems" && (
          <DiagnosticsPanel markers={markers} activeFileName={activeFileName} editorRef={editorRef} />
        )}
      </div>
    </div>
  )
}
