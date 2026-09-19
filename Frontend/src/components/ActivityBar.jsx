import React from "react"

export default function ActivityBar({
  activeSidebarTab,
  setActiveSidebarTab,
  messagesCount,
  usersCount
}) {
  return (
    <div className="w-12 bg-[#161b22] border-r border-[#30363d] flex flex-col items-center py-3 gap-3 shrink-0 h-full select-none">
      {/* Top Activity Bar Icons */}
      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "files" ? null : "files")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
          activeSidebarTab === "files"
            ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="Files Explorer"
      >
        📁
      </button>

      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "search" ? null : "search")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
          activeSidebarTab === "search"
            ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="Global Search & Replace (Ctrl+Shift+F)"
      >
        🔍
      </button>

      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "git" ? null : "git")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
          activeSidebarTab === "git"
            ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="Source Control (Git)"
      >
        🌿
      </button>

      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "ai" ? null : "ai")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
          activeSidebarTab === "ai"
            ? "bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="AI Pair Programmer"
      >
        ✨
      </button>

      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "chat" ? null : "chat")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer relative ${
          activeSidebarTab === "chat"
            ? "bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="Room Chat"
      >
        💬
        {messagesCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 bg-[#1f6feb] text-white text-[9px] font-bold rounded-full">
            {messagesCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setActiveSidebarTab(activeSidebarTab === "users" ? null : "users")}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer relative ${
          activeSidebarTab === "users"
            ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40"
            : "text-[#8b949e] hover:text-[#c9d1d9]"
        }`}
        title="Active Users"
      >
        👥
        <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 bg-[#238636] text-white text-[9px] font-bold rounded-full">
          {usersCount}
        </span>
      </button>

      {/* Bottom Anchored Activity Bar Icons */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          onClick={() => setActiveSidebarTab(activeSidebarTab === "settings" ? null : "settings")}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
            activeSidebarTab === "settings"
              ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40"
              : "text-[#8b949e] hover:text-[#c9d1d9]"
          }`}
          title="Editor Settings & Language"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
