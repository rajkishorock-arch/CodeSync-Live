import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

const LANGUAGE_CONFIG = [
  { id: "javascript", label: "JavaScript (Node.js)", pistonLang: "javascript", version: "*", ext: ".js" },
  { id: "python", label: "Python 3", pistonLang: "python3", version: "*", ext: ".py" },
  { id: "cpp", label: "C++ (GCC)", pistonLang: "c++", version: "*", ext: ".cpp" },
  { id: "java", label: "Java", pistonLang: "java", version: "*", ext: ".java" },
  { id: "typescript", label: "TypeScript", pistonLang: "typescript", version: "*", ext: ".ts" },
  { id: "html", label: "HTML5", pistonLang: null, version: null, ext: ".html" },
  { id: "css", label: "CSS3", pistonLang: null, version: null, ext: ".css" }
]

const STARTER_SNIPPETS = {
  javascript: `// JavaScript Live CodeSync Demo\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("CodeSync Live Developer");\n`,
  python: `# Python 3 Live CodeSync Demo\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("CodeSync Live Developer")\n`,
  cpp: `// C++ Live CodeSync Demo\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeSync Live Developer!" << endl;\n    return 0;\n}\n`,
  java: `// Java Live CodeSync Demo\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeSync Live Developer!");\n    }\n}\n`,
  typescript: `// TypeScript Live CodeSync Demo\nconst greeting: string = "Hello, CodeSync Live Developer!";\nconsole.log(greeting);\n`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }\n    h1 { color: #38bdf8; }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>Hello from CodeSync Live HTML Preview!</h1>\n    <p>Edit HTML and click Run Code to refresh preview.</p>\n  </div>\n</body>\n</html>\n`,
  css: `/* CSS Live CodeSync Demo */\nbody {\n  background-color: #0f172a;\n  color: #38bdf8;\n  font-family: monospace;\n}\n`
}

function getLanguageFromFileName(filename) {
  if (filename.endsWith(".py")) return "python"
  if (filename.endsWith(".cpp") || filename.endsWith(".cc")) return "cpp"
  if (filename.endsWith(".java")) return "java"
  if (filename.endsWith(".ts")) return "typescript"
  if (filename.endsWith(".html") || filename.endsWith(".htm")) return "html"
  if (filename.endsWith(".css")) return "css"
  return "javascript"
}

function App() {
  const editorRef = useRef(null)
  const bindingRef = useRef(null)
  const chatEndRef = useRef(null)

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const [users, setUsers] = useState([])
  const [theme, setTheme] = useState("vs-dark")
  const [fontSize, setFontSize] = useState(14)
  
  // Sidebar Tab: "users" | "files" | "chat"
  const [activeSidebarTab, setActiveSidebarTab] = useState("files")

  // Multi-file state
  const [filesList, setFilesList] = useState(["main.js"])
  const [activeFileName, setActiveFileName] = useState("main.js")
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")

  // Execution & Console State
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState(null)
  const [showConsole, setShowConsole] = useState(true)
  const [htmlPreview, setHtmlPreview] = useState("")

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yFilesMap = useMemo(() => ydoc.getMap("files_meta"), [ydoc])
  const yChatArray = useMemo(() => ydoc.getArray("chat_messages"), [ydoc])
  const yConfig = useMemo(() => ydoc.getMap("config"), [ydoc])

  // Current file language
  const language = useMemo(() => getLanguageFromFileName(activeFileName), [activeFileName])

  // Initialize & Bind Monaco Editor for the active file
  const bindEditorToFile = (fileName, editor = editorRef.current) => {
    if (!editor) return

    // Clean up previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    const fileYText = ydoc.getText(`file_${fileName}`)

    // Set starter snippet if file is completely new & empty
    if (fileYText.toString().trim() === "") {
      const fileLang = getLanguageFromFileName(fileName)
      fileYText.insert(0, STARTER_SNIPPETS[fileLang] || `// ${fileName}\n`)
    }

    bindingRef.current = new MonacoBinding(
      fileYText,
      editor.getModel(),
      new Set([editor]),
    )
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    bindEditorToFile(activeFileName, editor)
  }

  // Switch Active File
  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
    bindEditorToFile(fileName)
  }

  // Create New File
  const handleCreateFile = (e) => {
    e.preventDefault()
    let name = newFileName.trim()
    if (!name) return

    // Add default extension if missing
    if (!name.includes(".")) {
      name += ".js"
    }

    if (!filesList.includes(name)) {
      yFilesMap.set(name, { createdBy: username, createdAt: Date.now() })
      handleSelectFile(name)
    }

    setNewFileName("")
    setIsCreatingFile(false)
  }

  // Delete File
  const handleDeleteFile = (fileName, e) => {
    e.stopPropagation()
    if (filesList.length <= 1) {
      alert("Cannot delete the last remaining file.")
      return
    }

    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      yFilesMap.delete(fileName)
      const remainingFiles = filesList.filter(f => f !== fileName)
      if (activeFileName === fileName) {
        handleSelectFile(remainingFiles[0])
      }
    }
  }

  // Handle Room Joining
  const handleJoin = (e) => {
    e.preventDefault()
    const nameInput = e.target.username.value.trim()
    if (nameInput) {
      setUsername(nameInput)
      window.history.pushState({}, "", "?username=" + encodeURIComponent(nameInput))
    }
  }

  // Send Chat Message
  const handleSendChatMessage = (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return

    const msgObj = {
      id: Date.now(),
      sender: username,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    yChatArray.push([msgObj])
    setChatInput("")
  }

  // Sync Yjs Files Map
  useEffect(() => {
    const handleFilesChange = () => {
      const currentKeys = Array.from(yFilesMap.keys())
      if (currentKeys.length === 0) {
        // Init default files if empty
        yFilesMap.set("main.js", { createdBy: "System" })
        yFilesMap.set("index.html", { createdBy: "System" })
        yFilesMap.set("style.css", { createdBy: "System" })
        setFilesList(["main.js", "index.html", "style.css"])
      } else {
        setFilesList(currentKeys)
      }
    }

    yFilesMap.observe(handleFilesChange)
    handleFilesChange()

    return () => yFilesMap.unobserve(handleFilesChange)
  }, [yFilesMap])

  // Sync Yjs Chat Array
  useEffect(() => {
    const handleChatChange = () => {
      setMessages(yChatArray.toArray())
    }

    yChatArray.observe(handleChatChange)
    setMessages(yChatArray.toArray())

    return () => yChatArray.unobserve(handleChatChange)
  }, [yChatArray])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeSidebarTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeSidebarTab])

  // Sync Provider & Awareness
  useEffect(() => {
    if (username) {
      const websocketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:1234`
      const provider = new WebsocketProvider(websocketUrl, "monaco", ydoc)

      provider.awareness.setLocalStateField("user", { username })

      const handleAwarenessChange = () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))
      }

      provider.awareness.on("change", handleAwarenessChange)

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null)
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        provider.awareness.off("change", handleAwarenessChange)
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [username, ydoc])

  // Code Execution Engine using Piston API
  const handleRunCode = async () => {
    const activeFileYText = ydoc.getText(`file_${activeFileName}`)
    const codeToRun = activeFileYText.toString()

    if (!codeToRun.trim()) {
      setConsoleOutput({ stdout: "", stderr: "No code to execute.", time: 0, status: "Empty", isError: true })
      setShowConsole(true)
      return
    }

    setShowConsole(true)
    setIsRunning(true)

    const selectedLangObj = LANGUAGE_CONFIG.find(l => l.id === language)

    // Handle HTML/CSS Live Preview
    if (language === "html" || language === "css") {
      let combinedHTML = codeToRun
      if (language === "css") {
        const htmlCode = ydoc.getText("file_index.html").toString() || "<h1>Live CSS Preview</h1>"
        combinedHTML = `<style>${codeToRun}</style>${htmlCode}`
      }

      setHtmlPreview(combinedHTML)
      setConsoleOutput({
        stdout: `Live ${language.toUpperCase()} Preview updated.`,
        stderr: "",
        time: 0,
        status: "Rendered",
        isError: false
      })
      setIsRunning(false)
      return
    }

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language: selectedLangObj?.pistonLang || language,
          version: selectedLangObj?.version || "*",
          files: [
            {
              name: activeFileName,
              content: codeToRun
            }
          ]
        })
      })

      const data = await response.json()

      if (data.run) {
        const stdout = data.run.stdout || ""
        const stderr = data.run.stderr || (data.compile?.stderr || "")
        const isErr = data.run.code !== 0 || !!stderr

        setConsoleOutput({
          stdout: stdout,
          stderr: stderr,
          status: data.run.code === 0 ? "Success" : `Exit Code ${data.run.code}`,
          time: data.run.signal ? data.run.signal : "Completed",
          isError: isErr
        })
      } else if (data.message) {
        setConsoleOutput({
          stdout: "",
          stderr: data.message,
          status: "API Error",
          time: 0,
          isError: true
        })
      }
    } catch (err) {
      setConsoleOutput({
        stdout: "",
        stderr: `Failed to execute code: ${err.message}. Please check network connection.`,
        status: "Network Failure",
        time: 0,
        isError: true
      })
    } finally {
      setIsRunning(false)
    }
  }

  if (!username) {
    return (
      <main className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <span className="text-3xl">⚡</span>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300">
              CodeSync Live
            </h1>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">Your Name / Username</label>
              <input
                type="text"
                placeholder="e.g. Raj"
                className="w-full p-3 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                name="username"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
            >
              Join Collaborative Room
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-slate-950 flex gap-4 p-4 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Multi-Tab (Files Explorer, Chat, Users) */}
      <aside className="h-full w-1/4 max-w-xs bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
        {/* Sidebar Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 p-1 gap-1">
          <button
            onClick={() => setActiveSidebarTab("files")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSidebarTab === "files"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📁</span> Files ({filesList.length})
          </button>
          <button
            onClick={() => setActiveSidebarTab("chat")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSidebarTab === "chat"
                ? "bg-slate-800 text-amber-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>💬</span> Chat ({messages.length})
          </button>
          <button
            onClick={() => setActiveSidebarTab("users")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSidebarTab === "users"
                ? "bg-slate-800 text-emerald-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>👥</span> Users ({users.length})
          </button>
        </div>

        {/* Tab 1: File Explorer */}
        {activeSidebarTab === "files" && (
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Explorer</span>
              <button
                onClick={() => setIsCreatingFile(!isCreatingFile)}
                className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>+</span> New File
              </button>
            </div>

            {/* Create File Form */}
            {isCreatingFile && (
              <form onSubmit={handleCreateFile} className="mb-3 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. script.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-500 cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            {/* Files List */}
            <ul className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filesList.map((fileName) => {
                const isSelected = fileName === activeFileName
                const fileLang = getLanguageFromFileName(fileName)
                return (
                  <li
                    key={fileName}
                    onClick={() => handleSelectFile(fileName)}
                    className={`group p-2 rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition-colors border ${
                      isSelected
                        ? "bg-sky-950/60 border-sky-800/80 text-sky-200"
                        : "bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">
                        {fileLang === "javascript" && "📜"}
                        {fileLang === "python" && "🐍"}
                        {fileLang === "cpp" && "⚙️"}
                        {fileLang === "java" && "☕"}
                        {fileLang === "typescript" && "📘"}
                        {fileLang === "html" && "🌐"}
                        {fileLang === "css" && "🎨"}
                      </span>
                      <span className="truncate">{fileName}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteFile(fileName, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 text-xs px-1.5 py-0.5 rounded transition-opacity cursor-pointer"
                      title="Delete file"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Tab 2: Integrated Room Chat */}
        {activeSidebarTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 text-xs mt-6 italic">
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-sky-400">{msg.sender}</span>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 break-words">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Active Users List */}
        {activeSidebarTab === "users" && (
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
              {users.map((user, index) => (
                <li
                  key={index}
                  className="p-2.5 bg-slate-950/60 border border-slate-800/80 text-slate-200 rounded-lg flex items-center gap-3 text-sm font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate">{user.username}</span>
                  {user.username === username && (
                    <span className="ml-auto text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">
                      You
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex flex-col gap-1">
          <span className="font-semibold text-slate-300">Room Status:</span>
          <span className="truncate text-emerald-400">● Connected to Yjs Server</span>
        </div>
      </aside>

      {/* Main Section - File Tabs, Editor & Console */}
      <section className="w-3/4 flex-1 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Top File Tabs Bar */}
        <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto px-2 pt-2 gap-1 scrollbar-none">
          {filesList.map((fileName) => {
            const isActive = fileName === activeFileName
            const fileLang = getLanguageFromFileName(fileName)
            return (
              <button
                key={fileName}
                onClick={() => handleSelectFile(fileName)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg flex items-center gap-2 border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-sky-400 border-slate-700 border-b-transparent"
                    : "bg-slate-950 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <span>
                  {fileLang === "javascript" && "📜"}
                  {fileLang === "python" && "🐍"}
                  {fileLang === "cpp" && "⚙️"}
                  {fileLang === "java" && "☕"}
                  {fileLang === "typescript" && "📘"}
                  {fileLang === "html" && "🌐"}
                  {fileLang === "css" && "🎨"}
                </span>
                <span>{fileName}</span>
              </button>
            )
          })}
        </div>

        {/* Action Header Bar */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Detected Language Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Mode:</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-sky-400 text-xs font-bold rounded-lg uppercase">
                {language}
              </span>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">VS Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Font:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>
            </div>
          </div>

          {/* Execution Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {showConsole ? "Hide Terminal 🔽" : "Show Terminal 🔼"}
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`px-5 py-1.5 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isRunning
                  ? "bg-amber-600 opacity-80 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
              }`}
            >
              {isRunning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span> Run Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Editor Container */}
        <div className="flex-1 relative overflow-hidden">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            options={{
              fontSize: fontSize,
              minimap: { enabled: true },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 }
            }}
            onMount={handleMount}
          />
        </div>

        {/* Execution Output Console Drawer */}
        {showConsole && (
          <div className="h-1/3 min-h-[160px] bg-slate-950 border-t border-slate-800 flex flex-col font-mono text-sm">
            {/* Terminal Header Bar */}
            <div className="p-2 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="text-emerald-400">❯_</span> Terminal Output ({activeFileName})
                </span>
                {consoleOutput && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      consoleOutput.isError
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {consoleOutput.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {consoleOutput && (
                  <button
                    onClick={() => setConsoleOutput(null)}
                    className="hover:text-slate-200 text-slate-500 text-xs transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-slate-800"
                  >
                    Clear Console
                  </button>
                )}
              </div>
            </div>

            {/* Output Display Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2 bg-slate-950 text-slate-200 selection:bg-sky-500/30">
              {isRunning && (
                <div className="flex items-center gap-2 text-amber-400 italic">
                  <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                  Executing code via Piston runner API...
                </div>
              )}

              {/* HTML/CSS Live Preview Tab */}
              {(language === "html" || language === "css") && htmlPreview && !isRunning && (
                <div className="w-full h-full border border-slate-800 rounded bg-white overflow-hidden">
                  <iframe
                    title="HTML Preview"
                    srcDoc={htmlPreview}
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Standard Output (stdout & stderr) */}
              {!isRunning && consoleOutput && (
                <>
                  {consoleOutput.stdout && (
                    <pre className="text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">
                      {consoleOutput.stdout}
                    </pre>
                  )}
                  {consoleOutput.stderr && (
                    <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 whitespace-pre-wrap font-mono">
                      <span className="font-bold text-rose-400 block mb-1">Execution Error:</span>
                      {consoleOutput.stderr}
                    </div>
                  )}
                </>
              )}

              {!isRunning && !consoleOutput && (language !== "html" && language !== "css") && (
                <div className="text-slate-600 italic">
                  Click <strong className="text-emerald-500 font-semibold">"▶ Run Code"</strong> above to execute code and view output here...
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
