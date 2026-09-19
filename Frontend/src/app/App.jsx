import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

const LANGUAGE_CONFIG = [
  { id: "javascript", label: "JavaScript", judge0Id: 63, ext: ".js" },
  { id: "python", label: "Python 3", judge0Id: 71, ext: ".py" },
  { id: "cpp", label: "C++ (GCC)", judge0Id: 54, ext: ".cpp" },
  { id: "c", label: "C (GCC)", judge0Id: 50, ext: ".c" },
  { id: "java", label: "Java", judge0Id: 62, ext: ".java" },
  { id: "typescript", label: "TypeScript", judge0Id: 74, ext: ".ts" },
  { id: "html", label: "HTML5", judge0Id: null, ext: ".html" },
  { id: "css", label: "CSS3", judge0Id: null, ext: ".css" },
  { id: "go", label: "Go", judge0Id: 60, ext: ".go" },
  { id: "rust", label: "Rust", judge0Id: 73, ext: ".rs" },
  { id: "php", label: "PHP", judge0Id: 68, ext: ".php" },
  { id: "sql", label: "SQL", judge0Id: 82, ext: ".sql" },
  { id: "json", label: "JSON", judge0Id: null, ext: ".json" }
]

const STARTER_SNIPPETS = {
  javascript: `// JavaScript Live Demo\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("CodeSync Developer");\n`,
  python: `# Python 3 Live Demo\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("CodeSync Developer")\n`,
  cpp: `// C++ Live Demo\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeSync Developer!" << endl;\n    return 0;\n}\n`,
  c: `// C Live Demo\n#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeSync Developer!\\n");\n    return 0;\n}\n`,
  java: `// Java Live Demo\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeSync Developer!");\n    }\n}\n`,
  typescript: `// TypeScript Live Demo\nconst greeting: string = "Hello, CodeSync Developer!";\nconsole.log(greeting);\n`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; text-align: center; }\n    h1 { color: #58a6ff; font-weight: 600; }\n  </style>\n</head>\n<body>\n  <h1>Hello from CodeSync Live!</h1>\n  <p>Edit HTML and click Run Code to update live preview.</p>\n</body>\n</html>\n`,
  css: `/* CSS Live Demo */\nbody {\n  background-color: #0d1117;\n  color: #58a6ff;\n}\n`,
  go: `// Go Live Demo\npackage main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeSync Developer!")\n}\n`,
  rust: `// Rust Live Demo\nfn main() {\n    println!("Hello, CodeSync Developer!");\n}\n`,
  php: `<?php\n// PHP Live Demo\necho "Hello, CodeSync Developer!\\n";\n?>\n`,
  sql: `-- SQL Demo\nCREATE TABLE users (id INT, name VARCHAR(50));\nINSERT INTO users VALUES (1, 'Raj');\nSELECT * FROM users;\n`,
  json: `{\n  "appName": "CodeSync Live",\n  "version": "1.0.0",\n  "status": "Active"\n}\n`
}

function getLanguageFromFileName(filename) {
  if (!filename) return "javascript"
  const lower = filename.toLowerCase()
  if (lower.endsWith(".py")) return "python"
  if (lower.endsWith(".cpp") || lower.endsWith(".cc")) return "cpp"
  if (lower.endsWith(".c")) return "c"
  if (lower.endsWith(".java")) return "java"
  if (lower.endsWith(".ts")) return "typescript"
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html"
  if (lower.endsWith(".css")) return "css"
  if (lower.endsWith(".go")) return "go"
  if (lower.endsWith(".rs")) return "rust"
  if (lower.endsWith(".php")) return "php"
  if (lower.endsWith(".sql")) return "sql"
  if (lower.endsWith(".json")) return "json"
  return "javascript"
}

function getUserColor(name) {
  const colors = ["#238636", "#1f6feb", "#8957e5", "#d29922", "#da3633", "#3fb950"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
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
  const [copiedLink, setCopiedLink] = useState(false)
  
  // Mobile responsive sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState("files")

  // Multi-file state
  const [filesList, setFilesList] = useState(["main.js"])
  const [activeFileName, setActiveFileName] = useState("main.js")
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Manual language override state per file
  const [fileLanguages, setFileLanguages] = useState({})

  // Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")

  // Program Input (stdin) state for interactive programs (scanf, cin, input)
  const [stdinInput, setStdinInput] = useState("")

  // Execution & Console State
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState(null)
  const [showConsole, setShowConsole] = useState(true)
  const [htmlPreview, setHtmlPreview] = useState("")

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yFilesMap = useMemo(() => ydoc.getMap("files_meta"), [ydoc])
  const yChatArray = useMemo(() => ydoc.getArray("chat_messages"), [ydoc])

  // Current file language
  const language = useMemo(() => {
    if (fileLanguages[activeFileName]) return fileLanguages[activeFileName]
    return getLanguageFromFileName(activeFileName)
  }, [activeFileName, fileLanguages])

  const bindEditorToFile = (fileName, editor = editorRef.current) => {
    if (!editor) return

    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    const fileYText = ydoc.getText(`file_${fileName}`)

    if (fileYText.toString().trim() === "") {
      const fileLang = fileLanguages[fileName] || getLanguageFromFileName(fileName)
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

  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
    bindEditorToFile(fileName)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleManualLanguageChange = (newLang) => {
    setFileLanguages(prev => ({ ...prev, [activeFileName]: newLang }))
  }

  const handleCreateFile = (e) => {
    e.preventDefault()
    let name = newFileName.trim()
    if (!name) return

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

  const handleJoin = (e) => {
    e.preventDefault()
    const nameInput = e.target.username.value.trim()
    if (nameInput) {
      setUsername(nameInput)
      window.history.pushState({}, "", "?username=" + encodeURIComponent(nameInput))
    }
  }

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

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  useEffect(() => {
    const handleFilesChange = () => {
      const currentKeys = Array.from(yFilesMap.keys())
      if (currentKeys.length === 0) {
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

  useEffect(() => {
    const handleChatChange = () => {
      setMessages(yChatArray.toArray())
    }

    yChatArray.observe(handleChatChange)
    setMessages(yChatArray.toArray())

    return () => yChatArray.unobserve(handleChatChange)
  }, [yChatArray])

  useEffect(() => {
    if (activeSidebarTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeSidebarTab])

  useEffect(() => {
    if (username) {
      const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:1234`
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

  // Multi-Engine Execution with Stdin Support
  const handleRunCode = async () => {
    const activeFileYText = ydoc.getText(`file_${activeFileName}`)
    const codeToRun = activeFileYText.toString()

    if (!codeToRun.trim()) {
      setConsoleOutput({ stdout: "", stderr: "No code to run.", time: "0s", status: "Empty", isError: true })
      setShowConsole(true)
      return
    }

    setShowConsole(true)
    setIsRunning(true)

    // Mode 1: HTML / CSS
    if (language === "html" || language === "css") {
      let combinedHTML = codeToRun
      if (language === "css") {
        const htmlCode = ydoc.getText("file_index.html").toString() || "<h1>Live Preview</h1>"
        combinedHTML = `<style>${codeToRun}</style>${htmlCode}`
      }

      setHtmlPreview(combinedHTML)
      setConsoleOutput({
        stdout: `HTML/CSS Live Preview updated.`,
        stderr: "",
        time: "0.00s",
        status: "Rendered",
        isError: false
      })
      setIsRunning(false)
      return
    }

    // Mode 2: In-Browser JS Engine
    if (language === "javascript" || language === "typescript") {
      const logs = []
      const customConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
        error: (...args) => logs.push("[Error] " + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
        warn: (...args) => logs.push("[Warn] " + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(" "))
      }

      const startTime = performance.now()
      try {
        let executableCode = codeToRun
        if (language === "typescript") {
          executableCode = codeToRun.replace(/:\s*\w+/g, "")
        }

        const runFn = new Function('console', executableCode)
        runFn(customConsole)
        const duration = ((performance.now() - startTime) / 1000).toFixed(3)

        setConsoleOutput({
          stdout: logs.join("\n") || "(Code executed cleanly - 0 output logs)",
          stderr: "",
          status: "Success",
          time: `${duration}s`,
          isError: false
        })
      } catch (err) {
        setConsoleOutput({
          stdout: logs.join("\n"),
          stderr: err.toString(),
          status: "Runtime Error",
          time: "0.00s",
          isError: true
        })
      } finally {
        setIsRunning(false)
      }
      return
    }

    // Mode 3: Judge0 API for C, C++, Python, Java, Go, Rust, etc.
    const langObj = LANGUAGE_CONFIG.find(l => l.id === language)
    try {
      const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: codeToRun,
          language_id: langObj?.judge0Id || 50,
          stdin: stdinInput || ""
        })
      })

      const data = await response.json()

      const stdout = data.stdout || ""
      const stderr = data.stderr || (data.compile_output || "")
      const isErr = !!stderr || (data.status && data.status.id !== 3)

      let outputMessage = stdout
      let statusText = data.status ? data.status.description : "Completed"

      // Helpful tip if interactive program failed due to missing stdin input
      if (isErr && data.status && data.status.id !== 3) {
        if (!stdinInput.trim() && (codeToRun.includes("scanf") || codeToRun.includes("cin") || codeToRun.includes("input("))) {
          outputMessage = stdout + "\n\n💡 TIP: Your program requires user input (scanf / cin / input).\nPlease enter your input values in the 'Program Input (stdin)' box below and click 'Run Code' again!"
        }
      }

      setConsoleOutput({
        stdout: outputMessage,
        stderr: stderr,
        status: statusText,
        time: data.time ? `${data.time}s` : "Finished",
        isError: isErr
      })
    } catch (err) {
      setConsoleOutput({
        stdout: "",
        stderr: `Execution server error: ${err.message}`,
        status: "Network Error",
        time: "0.00s",
        isError: true
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Welcome Screen
  if (!username) {
    return (
      <main className="min-h-screen w-full bg-[#0d1117] flex items-center justify-center p-4 font-sans text-[#c9d1d9]">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
          <div className="flex items-center gap-2.5 mb-6 justify-center">
            <span className="text-3xl">⚡</span>
            <h1 className="text-xl font-bold text-[#f0f6fc]">CodeSync Live</h1>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[#c9d1d9] text-xs font-semibold mb-2">Username</label>
              <input
                type="text"
                placeholder="e.g. Raj"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1117] text-[#f0f6fc] border border-[#30363d] focus:outline-none focus:border-[#58a6ff] text-sm"
                name="username"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-sm transition-all cursor-pointer"
            >
              Join Collaboration Workspace
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0d1117] flex flex-col font-sans text-[#c9d1d9] overflow-hidden selection:bg-[#1f6feb]/30 relative">
      {/* Header Bar */}
      <header className="h-12 bg-[#161b22] border-b border-[#30363d] px-3 sm:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] cursor-pointer"
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? "✕" : "☰ Sidebar"}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg">⚡</span>
            <span className="font-bold text-xs sm:text-sm text-[#f0f6fc] truncate">CodeSync Live</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-0.5 bg-[#0d1117] rounded-md border border-[#30363d] text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
            <span>Room: Default</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
            {users.map((u, i) => (
              <div
                key={i}
                title={u.username}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center border-2 border-[#161b22]"
                style={{ backgroundColor: getUserColor(u.username) }}
              >
                {u.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          <button
            onClick={handleCopyInviteLink}
            className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold rounded-md border border-[#30363d] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`px-3 sm:px-4 py-1.5 rounded-md font-bold text-xs text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isRunning ? "bg-[#d29922] opacity-80 cursor-not-allowed" : "bg-[#238636] hover:bg-[#2ea043]"
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="hidden sm:inline">Running...</span>
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

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 z-30"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-200 ease-in-out fixed md:relative z-40 inset-y-12 left-0 w-72 md:w-64 bg-[#161b22] border-r border-[#30363d] flex shrink-0 shadow-2xl md:shadow-none`}
        >
          {/* Activity Bar Icons */}
          <div className="w-12 bg-[#161b22] border-r border-[#30363d] flex flex-col items-center py-2 gap-3 shrink-0">
            <button
              onClick={() => setActiveSidebarTab("files")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
                activeSidebarTab === "files" ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40" : "text-[#8b949e] hover:text-[#c9d1d9]"
              }`}
              title="Files Explorer"
            >
              📁
            </button>
            <button
              onClick={() => setActiveSidebarTab("chat")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer relative ${
                activeSidebarTab === "chat" ? "bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40" : "text-[#8b949e] hover:text-[#c9d1d9]"
              }`}
              title="Room Chat"
            >
              💬
              {messages.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 bg-[#1f6feb] text-white text-[9px] font-bold rounded-full">
                  {messages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSidebarTab("users")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer relative ${
                activeSidebarTab === "users" ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40" : "text-[#8b949e] hover:text-[#c9d1d9]"
              }`}
              title="Active Users"
            >
              👥
              <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 bg-[#238636] text-white text-[9px] font-bold rounded-full">
                {users.length}
              </span>
            </button>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#161b22]">
            {activeSidebarTab === "files" && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Explorer</span>
                  <button
                    onClick={() => setIsCreatingFile(!isCreatingFile)}
                    className="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold rounded border border-[#30363d] cursor-pointer"
                  >
                    + New File
                  </button>
                </div>

                {isCreatingFile && (
                  <form onSubmit={handleCreateFile} className="mb-3 flex gap-1">
                    <input
                      type="text"
                      placeholder="filename.js, app.py, code.c..."
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
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

                <ul className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {filesList.map((fileName) => {
                    const isSelected = fileName === activeFileName
                    const fileLang = fileLanguages[fileName] || getLanguageFromFileName(fileName)
                    return (
                      <li
                        key={fileName}
                        onClick={() => handleSelectFile(fileName)}
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
                          <span className="truncate">{fileName}</span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteFile(fileName, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] text-[#8b949e] text-xs px-1 cursor-pointer"
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

            {activeSidebarTab === "chat" && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Room Chat</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {messages.length === 0 ? (
                    <div className="text-center text-[#8b949e] text-xs mt-6 italic">
                      No messages. Start typing below...
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex flex-col text-xs bg-[#0d1117] p-2 rounded border border-[#30363d]">
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1">
                          <span className="font-bold text-[#58a6ff]">{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className="text-[#c9d1d9] break-words">{msg.text}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChatMessage} className="mt-2.5 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] text-xs rounded-md focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#d29922] hover:bg-[#b08018] text-white font-bold text-xs rounded-md cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {activeSidebarTab === "users" && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Active Users ({users.length})</span>
                </div>
                <ul className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {users.map((user, index) => (
                    <li
                      key={index}
                      className="p-2 bg-[#0d1117] border border-[#30363d] rounded-md flex items-center gap-2 text-xs text-[#c9d1d9]"
                    >
                      <span
                        className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: getUserColor(user.username) }}
                      >
                        {user.username.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate font-medium">{user.username}</span>
                      {user.username === username && (
                        <span className="ml-auto text-[9px] bg-[#1f6feb]/20 text-[#58a6ff] px-1 py-0.2 rounded border border-[#1f6feb]/40">
                          YOU
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-2 border-t border-[#30363d] bg-[#0d1117] text-[11px] text-[#8b949e] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#3fb950]">
                <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span> Connected
              </span>
              <span>Yjs Live</span>
            </div>
          </div>
        </aside>

        {/* Main Editor Section */}
        <section className="flex-1 h-full flex flex-col bg-[#0d1117] overflow-hidden w-full min-w-0">
          {/* File Tabs Bar */}
          <div className="flex items-center bg-[#161b22] border-b border-[#30363d] overflow-x-auto px-1 pt-1 gap-1 scrollbar-none">
            {filesList.map((fileName) => {
              const isActive = fileName === activeFileName
              const fileLang = fileLanguages[fileName] || getLanguageFromFileName(fileName)
              return (
                <button
                  key={fileName}
                  onClick={() => handleSelectFile(fileName)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-md flex items-center gap-2 border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#0d1117] text-[#58a6ff] border-[#30363d] border-b-[#0d1117] font-semibold"
                      : "bg-[#161b22] text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:bg-[#21262d]"
                  }`}
                >
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
                  <span>{fileName}</span>
                </button>
              )
            })}
          </div>

          {/* Sub-Header Toolbar */}
          <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[#8b949e] font-semibold text-[11px] uppercase">Language:</span>
                <select
                  value={language}
                  onChange={(e) => handleManualLanguageChange(e.target.value)}
                  className="bg-[#161b22] border border-[#30363d] text-[#58a6ff] font-bold rounded px-2.5 py-1 focus:outline-none cursor-pointer text-xs"
                >
                  {LANGUAGE_CONFIG.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[#8b949e] font-semibold text-[11px] uppercase">Theme:</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="vs-dark">VS Dark</option>
                  <option value="light">VS Light</option>
                  <option value="hc-black">High Contrast</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded transition-colors cursor-pointer text-xs font-semibold"
            >
              {showConsole ? "Hide Terminal 🔽" : "Show Terminal 🔼"}
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              options={{
                fontSize: fontSize,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 8, bottom: 8 }
              }}
              onMount={handleMount}
            />
          </div>

          {/* Terminal Console Output & Program Stdin Drawer */}
          {showConsole && (
            <div className="h-52 sm:h-56 bg-[#0d1117] border-t border-[#30363d] flex flex-col font-mono text-xs">
              {/* Terminal Header */}
              <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex justify-between items-center text-[#8b949e]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                    <span className="text-[#3fb950]">❯_</span> Terminal ({activeFileName})
                  </span>
                  {consoleOutput && (
                    <span
                      className={`px-2 py-0.2 text-[10px] font-bold rounded-full ${
                        consoleOutput.isError
                          ? "bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/30"
                          : "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30"
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
                      className="hover:text-[#f0f6fc] text-[#8b949e] cursor-pointer px-2 py-0.5 rounded bg-[#21262d] text-[11px]"
                    >
                      Clear Output
                    </button>
                  )}
                </div>
              </div>

              {/* Terminal Split: Stdin Input Box + Output Box */}
              <div className="flex-1 flex flex-col sm:flex-row overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#30363d]">
                {/* Program Input (stdin) Box for scanf / cin / input */}
                {(language === "c" || language === "cpp" || language === "python" || language === "java" || language === "go") && (
                  <div className="w-full sm:w-1/3 bg-[#161b22]/50 p-2 flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
                      <span>Program Input (stdin)</span>
                      <span className="text-[9px] text-[#58a6ff] font-normal">For scanf / cin / input</span>
                    </label>
                    <textarea
                      value={stdinInput}
                      onChange={(e) => setStdinInput(e.target.value)}
                      placeholder="Enter inputs here (e.g. 1&#10;10 20)..."
                      className="flex-1 w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff] resize-none"
                    />
                  </div>
                )}

                {/* Execution Output Box */}
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
                        <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[#f0f6fc]">{consoleOutput.stdout}</pre>
                      )}
                      {consoleOutput.stderr && (
                        <div className="p-2 rounded bg-[#f85149]/15 border border-[#f85149]/30 text-[#ff7b72] whitespace-pre-wrap font-mono">
                          <span className="font-bold text-[#f85149] block mb-1">Execution Error:</span>
                          {consoleOutput.stderr}
                        </div>
                      )}
                    </>
                  )}

                  {!isRunning && !consoleOutput && (language !== "html" && language !== "css") && (
                    <div className="text-[#8b949e] italic font-sans text-xs">
                      Click green <strong className="text-[#3fb950] font-semibold">"▶ Run Code"</strong> button to execute code...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
