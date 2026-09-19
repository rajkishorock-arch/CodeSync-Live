import React from "react"
import VoiceCall from "./VoiceCall"

export default function HeaderNavbar({
  isSidebarOpen,
  setIsSidebarOpen,
  roomId,
  handleCopyLink,
  copiedLink,
  users,
  username,
  getUserColor,
  activeFileName,
  language,
  handleRunCode,
  isRunning,
  showDiffView,
  setShowDiffView,
  setShowSettings
}) {
  return (
    <header className="h-13 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden text-[#8b949e] hover:text-[#c9d1d9] text-lg focus:outline-none cursor-pointer"
        >
          ☰
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1f6feb] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#f0f6fc] tracking-tight leading-none">CodeSync Live</h1>
            <span className="text-[10px] text-[#8b949e]">Cloud IDE</span>
          </div>
        </div>
      </div>

      {/* Center Room Share & Voice Channel */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1 rounded-md border border-[#30363d]">
          <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
          <span className="text-xs text-[#8b949e]">
            Room: <strong className="text-[#c9d1d9] font-mono">{roomId}</strong>
          </span>
          <button
            onClick={handleCopyLink}
            className="ml-1 text-[11px] bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] px-2 py-0.5 rounded border border-[#30363d] transition-colors cursor-pointer"
          >
            {copiedLink ? "Copied! ✓" : "Share 🔗"}
          </button>
        </div>

        {/* WebRTC Live Audio Voice Call Component */}
        <VoiceCall roomId={roomId} username={username} users={users} getUserColor={getUserColor} />
      </div>

      {/* Action Controls & Active User Avatars */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Diff Comparison Button */}
        <button
          onClick={() => setShowDiffView(!showDiffView)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
            showDiffView
              ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40"
              : "bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d]"
          }`}
          title="Toggle Code Version Diff View"
        >
          <span>⇄</span>
          <span className="hidden lg:inline">{showDiffView ? "Close Diff" : "Diff View"}</span>
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded-md transition-colors cursor-pointer text-xs"
          title="Editor Settings"
        >
          ⚙️
        </button>

        <div className="hidden md:flex items-center -space-x-1.5 overflow-hidden">
          {users.slice(0, 4).map((user, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#161b22]"
              style={{ backgroundColor: getUserColor(user.username) }}
              title={user.username}
            >
              {user.username.substring(0, 2).toUpperCase()}
            </div>
          ))}
          {users.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-[#30363d] text-[#c9d1d9] text-[9px] font-bold flex items-center justify-center ring-2 ring-[#161b22]">
              +{users.length - 4}
            </div>
          )}
        </div>

        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-bold rounded-md shadow-sm transition-all cursor-pointer"
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
      </div>
    </header>
  )
}
