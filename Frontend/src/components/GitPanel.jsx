import React, { useState, useEffect } from "react"

export default function GitPanel({
  filesList,
  activeFileName,
  username,
  docRef,
  yFilesMapRef,
  setActiveFileName
}) {
  const [commitMessage, setCommitMessage] = useState("")
  const [commits, setCommits] = useState([])
  const [stagedFiles, setStagedFiles] = useState([])

  useEffect(() => {
    if (!docRef || !docRef.current) return
    const yGitArray = docRef.current.getArray("yGitCommits")

    const updateCommits = () => {
      setCommits(yGitArray.toArray())
    }

    yGitArray.observe(updateCommits)
    updateCommits()

    return () => {
      yGitArray.unobserve(updateCommits)
    }
  }, [docRef])

  const handleCommit = (e) => {
    e.preventDefault()
    if (!commitMessage.trim() || !docRef.current) return

    const yGitArray = docRef.current.getArray("yGitCommits")
    const commitId = Math.random().toString(36).substring(2, 9)

    // Snapshot current workspace file contents
    const snapshot = {}
    if (yFilesMapRef && yFilesMapRef.current) {
      yFilesMapRef.current.forEach((ytext, key) => {
        snapshot[key] = ytext.toString()
      })
    }

    const newCommit = {
      id: commitId,
      message: commitMessage.trim(),
      author: username || "Developer",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString(),
      filesCount: filesList.length,
      snapshot
    }

    yGitArray.push([newCommit])
    setCommitMessage("")
  }

  const handleRestoreCommit = (commit) => {
    if (
      window.confirm(
        `Are you sure you want to restore workspace snapshot from commit "${commit.message}" (#${commit.id})?`
      )
    ) {
      if (yFilesMapRef && yFilesMapRef.current && commit.snapshot) {
        Object.keys(commit.snapshot).forEach((fileName) => {
          let ytext = yFilesMapRef.current.get(fileName)
          if (ytext) {
            ytext.delete(0, ytext.length)
            ytext.insert(0, commit.snapshot[fileName])
          }
        })
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden text-xs bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 font-bold text-[#8b949e] uppercase tracking-wider text-[11px]">
          <span>🌿 Source Control</span>
          <span className="px-1.5 py-0.2 bg-[#1f6feb]/20 text-[#58a6ff] rounded text-[10px] font-mono border border-[#1f6feb]/30">
            main
          </span>
        </div>
      </div>

      {/* Commit Form */}
      <form onSubmit={handleCommit} className="mb-4 flex flex-col gap-2 bg-[#161b22] p-2.5 rounded-lg border border-[#30363d]">
        <input
          type="text"
          placeholder="Commit message (e.g. fix: update algorithm)..."
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
        />
        <button
          type="submit"
          disabled={!commitMessage.trim()}
          className="w-full py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-bold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <span>✓ Commit & Checkpoint</span>
        </button>
      </form>

      {/* Changes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b949e] mb-1 px-1">
          <span>Changes ({filesList.length})</span>
          <span className="text-[10px] text-[#3fb950]">Tracked</span>
        </div>
        <div className="space-y-1 bg-[#161b22]/50 p-1.5 rounded border border-[#30363d] max-h-32 overflow-y-auto">
          {filesList.map((file) => (
            <div
              key={file}
              onClick={() => setActiveFileName(file)}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#21262d] cursor-pointer text-xs"
            >
              <span className="truncate text-[#58a6ff] font-mono">{file}</span>
              <span className="text-[10px] font-bold text-[#d29922] bg-[#d29922]/15 px-1 rounded border border-[#d29922]/30">
                M
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Commit History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-[11px] font-semibold text-[#8b949e] mb-1 px-1 flex items-center justify-between">
          <span>Commit History ({commits.length})</span>
          <span className="text-[10px] text-[#8b949e]">Live Yjs</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {commits.length === 0 ? (
            <div className="text-center text-[#8b949e] italic mt-4 text-xs">
              No commit checkpoints yet. Make your first commit above!
            </div>
          ) : (
            commits
              .slice()
              .reverse()
              .map((c) => (
                <div
                  key={c.id}
                  className="bg-[#161b22] p-2.5 rounded-md border border-[#30363d] flex flex-col gap-1 hover:border-[#58a6ff]/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#58a6ff]">#{c.id}</span>
                    <span className="text-[#8b949e]">{c.time}</span>
                  </div>
                  <div className="font-semibold text-[#f0f6fc] break-words text-xs">{c.message}</div>
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-1 border-t border-[#30363d]/60 mt-1">
                    <span>by {c.author}</span>
                    <button
                      onClick={() => handleRestoreCommit(c)}
                      className="text-[#3fb950] hover:underline cursor-pointer font-bold"
                      title="Restore workspace state to this commit"
                    >
                      ↺ Restore
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
