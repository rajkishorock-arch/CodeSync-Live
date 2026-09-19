import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import WebTerminal from "../components/WebTerminal"
import DiagnosticsPanel from "../components/DiagnosticsPanel"
import GitPanel from "../components/GitPanel"
import AiAssistant from "../components/AiAssistant"
import FileExplorer from "../components/FileExplorer"
import RoomChat from "../components/RoomChat"
import ActiveUsers from "../components/ActiveUsers"
import TerminalDrawer from "../components/TerminalDrawer"
import DiffViewer from "../components/DiffViewer"
import SidebarContainer from "../components/SidebarContainer"
import EditorToolbar from "../components/EditorToolbar"
import CommandPalette from "../components/CommandPalette"
import Breadcrumbs from "../components/Breadcrumbs"
import { formatCode } from "../utils/formatUtils"

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
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".jsx")) return "cpp"
  if (lower.endsWith(".c")) return "c"
  if (lower.endsWith(".java")) return "java"
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript"
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
  const colors = ["#238636", "#1f6feb", "#8957e5", "#d29922", "#da3633", "#3fb950", "#0969da", "#bf3989"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function App() {
  const editorRef = useRef(null)
  const bindingRef = useRef(null)
  const providerRef = useRef(null)
  const chatEndRef = useRef(null)

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const roomId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("room") || "default"
  }, [])
  const [users, setUsers] = useState([])
  const [theme, setTheme] = useState("vs-dark")
  const [fontSize, setFontSize] = useState(14)
  const [tabSize, setTabSize] = useState(2)
  const [wordWrap, setWordWrap] = useState("on")
  const [minimap, setMinimap] = useState(false)

  const [showDiffView, setShowDiffView] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [commits, setCommits] = useState([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  
  // Resizable Sidebar & Terminal Drawer State
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [terminalHeight, setTerminalHeight] = useState(240)

  // Mobile responsive sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState("files")

  // Drag handlers for Sidebar Resizing
  const handleSidebarMouseDown = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newWidth = Math.min(Math.max(startWidth + deltaX, 180), 550)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Drag handlers for Terminal Height Resizing
  const handleTerminalMouseDown = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = terminalHeight

    const handleMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY
      const newHeight = Math.min(Math.max(startHeight + deltaY, 100), 600)
      setTerminalHeight(newHeight)
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Directory & Multi-file state
  const [filesList, setFilesList] = useState(["main.js", "src/index.js", "src/style.css"])
  const [activeFileName, setActiveFileName] = useState("main.js")
  const [newPathName, setNewPathName] = useState("")
  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState({ src: true })

  // Manual language override state per file
  const [fileLanguages, setFileLanguages] = useState({})

  // Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")

  // Program Input (stdin) state
  const [stdinInput, setStdinInput] = useState("")

  // Execution & Console State
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState(null)
  const [showConsole, setShowConsole] = useState(true)
  const [htmlPreview, setHtmlPreview] = useState("")

  // Terminal Tab State: 'output', 'terminal', 'stdin', 'problems'
  const [terminalTab, setTerminalTab] = useState("output")
  const [markers, setMarkers] = useState([])

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yFilesMap = useMemo(() => ydoc.getMap("files_meta"), [ydoc])
  const yChatArray = useMemo(() => ydoc.getArray("chat_messages"), [ydoc])

  const docRef = useRef(ydoc)
  const yFilesMapRef = useRef(yFilesMap)
  useEffect(() => { docRef.current = ydoc }, [ydoc])
  useEffect(() => { yFilesMapRef.current = yFilesMap }, [yFilesMap])

  useEffect(() => {
    const yGitArray = ydoc.getArray("yGitCommits")
    const updateCommits = () => {
      setCommits(yGitArray.toArray())
    }
    yGitArray.observe(updateCommits)
    updateCommits()
    return () => {
      yGitArray.unobserve(updateCommits)
    }
  }, [ydoc])

  // Current file language
  const language = useMemo(() => {
    if (fileLanguages[activeFileName]) return fileLanguages[activeFileName]
    return getLanguageFromFileName(activeFileName)
  }, [activeFileName, fileLanguages])

  // Code Formatting Handler
  const handleFormatActiveDocument = () => {
    const activeFileYText = ydoc.getText(`file_${activeFileName}`)
    const code = activeFileYText.toString()
    if (!code) return
    const formatted = formatCode(code, language)
    if (formatted !== code) {
      activeFileYText.delete(0, activeFileYText.length)
      activeFileYText.insert(0, formatted)
    }
  }

  // Global Keyboard Shortcuts (Ctrl+Shift+P, Ctrl+Shift+F, Shift+Alt+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") || e.key === "F1") {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault()
        setActiveSidebarTab("search")
      } else if (e.shiftKey && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault()
        handleFormatActiveDocument()
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [activeFileName, language, ydoc])

  // Build Folder Tree Hierarchy from flat file paths
  const fileTree = useMemo(() => {
    const tree = { folders: {}, files: [] }

    filesList.forEach((filePath) => {
      const parts = filePath.split("/")
      if (parts.length === 1) {
        tree.files.push(filePath)
      } else {
        let current = tree
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i]
          if (!current.folders[folderName]) {
            current.folders[folderName] = { folders: {}, files: [], path: parts.slice(0, i + 1).join("/") }
          }
          current = current.folders[folderName]
        }
        current.files.push(filePath)
      }
    })

    return tree
  }, [filesList])

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }))
  }

  // Bind Editor to Active File
  const bindEditorToFile = (fileName, editor = editorRef.current, provider = providerRef.current) => {
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
      provider ? provider.awareness : undefined
    )
  }

  const handleMount = (editor, monaco) => {
    editorRef.current = editor
    bindEditorToFile(activeFileName, editor, providerRef.current)

    // Listen to Monaco diagnostic markers (errors/warnings)
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (model && monaco) {
        const currentMarkers = monaco.editor.getModelMarkers({ resource: model.uri })
        setMarkers(currentMarkers)
      }
    })
  }

  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
    bindEditorToFile(fileName, editorRef.current, providerRef.current)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleManualLanguageChange = (newLang) => {
    setFileLanguages((prev) => ({ ...prev, [activeFileName]: newLang }))
  }

  const handleCreateItem = (e) => {
    e.preventDefault()
    let name = newPathName.trim()
    if (!name) return

    // If file with extension
    if (!name.includes("/") && !name.includes(".")) {
      name += ".js"
    }

    if (!filesList.includes(name)) {
      yFilesMap.set(name, { createdBy: username, createdAt: Date.now() })
      handleSelectFile(name)
    }

    setNewPathName("")
    setIsCreatingItem(false)
  }

  const handleDeleteFile = (fileName, e) => {
    e.stopPropagation()
    if (filesList.length <= 1) {
      alert("Cannot delete the last remaining file.")
      return
    }

    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      yFilesMap.delete(fileName)
      const remainingFiles = filesList.filter((f) => f !== fileName)
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
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
        yFilesMap.set("src/index.js", { createdBy: "System" })
        yFilesMap.set("src/style.css", { createdBy: "System" })
        setFilesList(["main.js", "src/index.js", "src/style.css"])
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
      const websocketUrl =
        import.meta.env.VITE_WEBSOCKET_URL ||
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:1234`
      const provider = new WebsocketProvider(websocketUrl, "monaco", ydoc)
      providerRef.current = provider

      const userColor = getUserColor(username)

      provider.awareness.setLocalStateField("user", {
        username,
        color: userColor
      })

      if (editorRef.current) {
        bindEditorToFile(activeFileName, editorRef.current, provider)
      }

      const handleAwarenessChange = () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter((state) => state.user && state.user.username).map((state) => state.user))
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

  // Multi-Engine Execution
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

    if (language === "html" || language === "css") {
      let combinedHTML = codeToRun
      if (language === "css") {
        const htmlCode = ydoc.getText("file_src/index.js").toString() || "<h1>Live Preview</h1>"
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

    if (language === "javascript" || language === "typescript") {
      const logs = []
      const customConsole = {
        log: (...args) =>
          logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
        error: (...args) =>
          logs.push("[Error] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
        warn: (...args) =>
          logs.push("[Warn] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "))
      }

      const startTime = performance.now()
      try {
        let executableCode = codeToRun
        if (language === "typescript") {
          executableCode = codeToRun.replace(/:\s*\w+/g, "")
        }

        const runFn = new Function("console", executableCode)
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

    const langObj = LANGUAGE_CONFIG.find((l) => l.id === language)
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

      if (isErr && data.status && data.status.id !== 3) {
        if (!stdinInput.trim() && (codeToRun.includes("scanf") || codeToRun.includes("cin") || codeToRun.includes("input("))) {
          outputMessage =
            stdout +
            "\n\n💡 TIP: Your program requires user input (scanf / cin / input).\nPlease enter your input values in the 'Program Input (stdin)' box below and click 'Run Code' again!"
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

  // Command Palette Actions
  const commandPaletteActions = useMemo(
    () => [
      { id: "run", label: "Run Code", category: "Execution", icon: "▶", shortcut: "Ctrl+Enter", perform: handleRunCode },
      {
        id: "format",
        label: "Format Document",
        category: "Editor",
        icon: "✨",
        shortcut: "Shift+Alt+F",
        perform: handleFormatActiveDocument
      },
      {
        id: "search",
        label: "Search & Replace in Workspace",
        category: "Navigation",
        icon: "🔍",
        shortcut: "Ctrl+Shift+F",
        perform: () => setActiveSidebarTab("search")
      },
      {
        id: "diff",
        label: "Toggle Version Diff View",
        category: "Git",
        icon: "⇄",
        shortcut: "",
        perform: () => setShowDiffView((prev) => !prev)
      },
      {
        id: "terminal",
        label: "Toggle Terminal Drawer",
        category: "View",
        icon: "🔽",
        shortcut: "",
        perform: () => setShowConsole((prev) => !prev)
      },
      {
        id: "explorer",
        label: "Open File Explorer",
        category: "View",
        icon: "📁",
        shortcut: "",
        perform: () => setActiveSidebarTab("files")
      },
      {
        id: "git",
        label: "Open Git Source Control",
        category: "Git",
        icon: "🌿",
        shortcut: "",
        perform: () => setActiveSidebarTab("git")
      },
      {
        id: "ai",
        label: "Open AI Pair Programmer",
        category: "AI",
        icon: "✨",
        shortcut: "",
        perform: () => setActiveSidebarTab("ai")
      },
      {
        id: "chat",
        label: "Open Room Chat",
        category: "Collaboration",
        icon: "💬",
        shortcut: "",
        perform: () => setActiveSidebarTab("chat")
      },
      {
        id: "users",
        label: "Open Active Collaborators",
        category: "Collaboration",
        icon: "👥",
        shortcut: "",
        perform: () => setActiveSidebarTab("users")
      },
      {
        id: "settings",
        label: "Open Workspace Settings",
        category: "Preferences",
        icon: "⚙️",
        shortcut: "",
        perform: () => setActiveSidebarTab("settings")
      }
    ],
    [handleRunCode, language, activeFileName, ydoc]
  )

  // Helper Component to Render Recursive Folder Tree
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
    <div className="h-screen w-full bg-[#0d1117] flex font-sans text-[#c9d1d9] overflow-hidden selection:bg-[#1f6feb]/30 relative">
      {/* Main Workspace Layout (Full Height from Top Edge) */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/60 z-30" />
        )}

        {/* Modular Resizable Sidebar Container */}
        <SidebarContainer
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          sidebarWidth={sidebarWidth}
          handleSidebarMouseDown={handleSidebarMouseDown}
          messages={messages}
          users={users}
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
          username={username}
          docRef={docRef}
          yFilesMapRef={yFilesMapRef}
          setActiveFileName={setActiveFileName}
          language={language}
          editorRef={editorRef}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendChatMessage={handleSendChatMessage}
          chatEndRef={chatEndRef}
          getUserColor={getUserColor}
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
          handleCopyLink={handleCopyInviteLink}
          copiedLink={copiedLink}
        />

        {/* Main Editor Section (Expands Automatically when Sidebar Shrinks) */}
        <section className="flex-1 h-full flex flex-col bg-[#0d1117] overflow-hidden w-full min-w-0">
          {/* Modular Editor Toolbar & File Tabs */}
          <EditorToolbar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            filesList={filesList}
            activeFileName={activeFileName}
            fileLanguages={fileLanguages}
            getLanguageFromFileName={getLanguageFromFileName}
            handleSelectFile={handleSelectFile}
            showDiffView={showDiffView}
            setShowDiffView={setShowDiffView}
            handleRunCode={handleRunCode}
            isRunning={isRunning}
            showConsole={showConsole}
            setShowConsole={setShowConsole}
            onFormatCode={handleFormatActiveDocument}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          {/* Breadcrumb Path Bar */}
          <Breadcrumbs
            activeFileName={activeFileName}
            fileLanguages={fileLanguages}
            getLanguageFromFileName={getLanguageFromFileName}
          />

          {/* Main Monaco Editor Container or Diff Viewer */}
          <div className="flex-1 relative overflow-hidden">
            {showDiffView ? (
              <DiffViewer
                activeFileName={activeFileName}
                currentCode={editorRef.current ? editorRef.current.getValue() : ""}
                commits={commits}
                language={language}
                theme={theme}
                onClose={() => setShowDiffView(false)}
              />
            ) : (
              <Editor
                height="100%"
                language={language}
                theme={theme}
                options={{
                  fontSize: fontSize,
                  tabSize: tabSize,
                  wordWrap: wordWrap,
                  minimap: { enabled: minimap },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 8, bottom: 8 }
                }}
                onMount={handleMount}
              />
            )}
          </div>

          {/* Terminal Console Output, Web Shell, Stdin & Problems Drawer */}
          <TerminalDrawer
            showConsole={showConsole}
            terminalTab={terminalTab}
            setTerminalTab={setTerminalTab}
            markers={markers}
            consoleOutput={consoleOutput}
            setConsoleOutput={setConsoleOutput}
            isRunning={isRunning}
            language={language}
            htmlPreview={htmlPreview}
            activeFileName={activeFileName}
            filesList={filesList}
            fileLanguages={fileLanguages}
            handleRunCode={handleRunCode}
            username={username}
            roomId={roomId}
            users={users}
            yFilesMapRef={yFilesMapRef}
            stdinInput={stdinInput}
            setStdinInput={setStdinInput}
            editorRef={editorRef}
            terminalHeight={terminalHeight}
            onMouseDownResize={handleTerminalMouseDown}
          />
        </section>
      </div>

      {/* Global IDE Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandPaletteActions}
      />
    </div>
  )
}

export default App
