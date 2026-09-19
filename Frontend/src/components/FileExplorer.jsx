import React from "react"

export default function FileExplorer({
  fileTree,
  filesList,
  activeFileName,
  fileLanguages,
  getLanguageFromFileName,
  handleSelectFile,
  handleDeleteFile,
  isCreatingItem,
  setIsCreatingItem,
  newPathName,
  setNewPathName,
  handleCreateItem,
  expandedFolders,
  toggleFolder
}) {
  const renderFolderNode = (folderName, folderData, depth = 0) => {
    const isExpanded = expandedFolders[folderData.path]
    return (
      <div key={folderData.path} className="select-none">
        <div
          onClick={() => toggleFolder(folderData.path)}
          className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#21262d] text-xs font-semibold text-[#8b949e] cursor-pointer rounded"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-[10px]">{isExpanded ? "▼" : "▶"}</span>
          <span>📁 {folderName}</span>
        </div>

        {isExpanded && (
          <div>
            {Object.keys(folderData.folders).map((subFolderName) =>
              renderFolderNode(subFolderName, folderData.folders[subFolderName], depth + 1)
            )}

            {folderData.files.map((filePath) => {
              const isSelected = filePath === activeFileName
              const fileNameOnly = filePath.split("/").pop()
              const fileLang = fileLanguages[filePath] || getLanguageFromFileName(filePath)
              return (
                <div
                  key={filePath}
                  onClick={() => handleSelectFile(filePath)}
                  className={`group flex items-center justify-between py-1 px-2 text-xs cursor-pointer rounded transition-colors border ${
                    isSelected
                      ? "bg-[#1f6feb]/15 border-[#1f6feb]/40 text-[#58a6ff] font-semibold"
                      : "bg-transparent border-transparent text-[#c9d1d9] hover:bg-[#21262d]"
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
                >
                  <div className="flex items-center gap-1.5 truncate">
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
                    <span className="truncate">{fileNameOnly}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteFile(filePath, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] text-[#8b949e] text-xs px-1 cursor-pointer"
                    title="Delete file"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Explorer</span>
        <button
          onClick={() => setIsCreatingItem(!isCreatingItem)}
          className="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold rounded border border-[#30363d] cursor-pointer"
        >
          + New
        </button>
      </div>

      {isCreatingItem && (
        <form onSubmit={handleCreateItem} className="mb-3 flex gap-1">
          <input
            type="text"
            placeholder="src/App.jsx, utils/api.js..."
            value={newPathName}
            onChange={(e) => setNewPathName(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#f0f6fc] focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#238636] text-white text-xs font-semibold rounded cursor-pointer"
          >
            Add
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {/* Root Level Files */}
        {fileTree.files.map((filePath) => {
          const isSelected = filePath === activeFileName
          const fileLang = fileLanguages[filePath] || getLanguageFromFileName(filePath)
          return (
            <div
              key={filePath}
              onClick={() => handleSelectFile(filePath)}
              className={`group px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs font-medium cursor-pointer transition-colors border ${
                isSelected
                  ? "bg-[#1f6feb]/15 border-[#1f6feb]/40 text-[#58a6ff] font-semibold"
                  : "bg-transparent border-transparent text-[#c9d1d9] hover:bg-[#21262d]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
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
                <span className="truncate">{filePath}</span>
              </div>

              <button
                onClick={(e) => handleDeleteFile(filePath, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] text-[#8b949e] text-xs px-1 cursor-pointer"
                title="Delete file"
              >
                ✕
              </button>
            </div>
          )
        })}

        {/* Folders & Subdirectories */}
        {Object.keys(fileTree.folders).map((folderName) =>
          renderFolderNode(folderName, fileTree.folders[folderName])
        )}
      </div>
    </div>
  )
}
