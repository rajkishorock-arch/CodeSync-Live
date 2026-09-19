import React from "react"
import ActivityBar from "./ActivityBar"
import FileExplorer from "./FileExplorer"
import GitPanel from "./GitPanel"
import AiAssistant from "./AiAssistant"
import RoomChat from "./RoomChat"
import ActiveUsers from "./ActiveUsers"
import SidebarSettings from "./SidebarSettings"
import GlobalSearchPanel from "./GlobalSearchPanel"

export default function SidebarContainer({
  isSidebarOpen,
  setIsSidebarOpen,
  activeSidebarTab,
  setActiveSidebarTab,
  sidebarWidth,
  handleSidebarMouseDown,
  messages,
  users,
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
  toggleFolder,
  username,
  docRef,
  yFilesMapRef,
  setActiveFileName,
  language,
  editorRef,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  chatEndRef,
  getUserColor,
  handleManualLanguageChange,
  LANGUAGE_CONFIG,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  wordWrap,
  setWordWrap,
  minimap,
  setMinimap,
  roomId,
  handleCopyLink,
  copiedLink
}) {
  const isExpanded = !!activeSidebarTab

  return (
    <aside
      style={{
        width: window.innerWidth >= 768 ? (isExpanded ? `${sidebarWidth}px` : "48px") : "280px"
      }}
      className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-[width,transform] duration-150 ease-in-out fixed md:relative z-40 inset-y-0 left-0 bg-[#161b22] border-r border-[#30363d] flex shrink-0 shadow-2xl md:shadow-none select-none`}
    >
      {/* 48px Left Activity Icon Column */}
      <ActivityBar
        activeSidebarTab={activeSidebarTab}
        setActiveSidebarTab={setActiveSidebarTab}
        messagesCount={messages.length}
        usersCount={users.length}
      />

      {/* Expanded Sub-Panel */}
      {isExpanded && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#161b22]">
          {activeSidebarTab === "files" && (
            <FileExplorer
              fileTree={fileTree}
              filesList={filesList}
              activeFileName={activeFileName}
              fileLanguages={fileLanguages}
              getLanguageFromFileName={getLanguageFromFileName}
              handleSelectFile={handleSelectFile}
              handleDeleteFile={handleDeleteFile}
              isCreatingItem={isCreatingItem}
              setIsCreatingItem={setIsCreatingItem}
              newPathName={newPathName}
              setNewPathName={setNewPathName}
              handleCreateItem={handleCreateItem}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          )}

          {activeSidebarTab === "search" && (
            <GlobalSearchPanel
              filesList={filesList}
              docRef={docRef}
              onSelectResult={(fileName, lineNumber) => {
                handleSelectFile(fileName)
                if (editorRef.current) {
                  editorRef.current.revealLineInCenter(lineNumber)
                  editorRef.current.setPosition({ lineNumber, column: 1 })
                  editorRef.current.focus()
                }
              }}
            />
          )}

          {activeSidebarTab === "git" && (
            <GitPanel
              filesList={filesList}
              activeFileName={activeFileName}
              username={username}
              docRef={docRef}
              yFilesMapRef={yFilesMapRef}
              setActiveFileName={setActiveFileName}
            />
          )}

          {activeSidebarTab === "ai" && (
            <AiAssistant
              activeFileName={activeFileName}
              language={language}
              editorRef={editorRef}
              yFilesMapRef={yFilesMapRef}
            />
          )}

          {activeSidebarTab === "chat" && (
            <RoomChat
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChatMessage={handleSendChatMessage}
              chatEndRef={chatEndRef}
            />
          )}

          {activeSidebarTab === "users" && (
            <ActiveUsers users={users} username={username} getUserColor={getUserColor} />
          )}

          {activeSidebarTab === "settings" && (
            <SidebarSettings
              language={language}
              handleManualLanguageChange={handleManualLanguageChange}
              LANGUAGE_CONFIG={LANGUAGE_CONFIG}
              theme={theme}
              setTheme={setTheme}
              fontSize={fontSize}
              setFontSize={setFontSize}
              tabSize={tabSize}
              setTabSize={setTabSize}
              wordWrap={wordWrap}
              setWordWrap={setWordWrap}
              minimap={minimap}
              setMinimap={setMinimap}
              roomId={roomId}
              handleCopyLink={handleCopyLink}
              copiedLink={copiedLink}
              activeFileName={activeFileName}
            />
          )}

          {/* Connection Footer */}
          <div className="p-2 border-t border-[#30363d] bg-[#0d1117] text-[11px] text-[#8b949e] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#3fb950]">
              <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span> Connected
            </span>
            <span>Yjs Live</span>
          </div>
        </div>
      )}

      {/* Draggable Resizer Boundary Handle (Right Edge) */}
      {isExpanded && (
        <div
          onMouseDown={handleSidebarMouseDown}
          className="w-1.5 h-full hover:bg-[#58a6ff] active:bg-[#58a6ff] cursor-col-resize transition-colors z-30 shrink-0 opacity-40 hover:opacity-100"
          title="Drag left/right to resize sidebar width"
        />
      )}
    </aside>
  )
}
