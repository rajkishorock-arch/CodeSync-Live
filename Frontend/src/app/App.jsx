import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

const LANGUAGE_CONFIG = [
  { id: "javascript", label: "JavaScript", judge0Id: 63, ext: ".js" },
  { id: "python", label: "Python 3", judge0Id: 71, ext: ".py" },
  { id: "cpp", label: "C++", judge0Id: 54, ext: ".cpp" },
  { id: "java", label: "Java", judge0Id: 62, ext: ".java" },
  { id: "typescript", label: "TypeScript", judge0Id: 74, ext: ".ts" },
  { id: "html", label: "HTML5", judge0Id: null, ext: ".html" },
  { id: "css", label: "CSS3", judge0Id: null, ext: ".css" }
]

const STARTER_SNIPPETS = {
  javascript: `// JavaScript Live Demo\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("CodeSync Developer");\n`,
  python: `# Python 3 Live Demo\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("CodeSync Developer")\n`,
  cpp: `// C++ Live Demo\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeSync Developer!" << endl;\n    return 0;\n}\n`,
  java: `// Java Live Demo\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeSync Developer!");\n    }\n}\n`,
  typescript: `// TypeScript Live Demo\nconst greeting: string = "Hello, CodeSync Developer!";\nconsole.log(greeting);\n`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; background: #1e1e1e; color: #cccccc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }\n    h1 { color: #569cd6; font-weight: 500; }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>CodeSync Live HTML Preview</h1>\n    <p>Edit HTML and click Run Code to update.</p>\n  </div>\n</body>\n</html>\n`,
  css: `/* CSS Live Demo */\nbody {\n  background-color: #1e1e1e;\n  color: #569cd6;\n  font-family: monospace;\n}\n`
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
  
  // Sidebar Tab: "files" | "chat" | "users"
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

  const language = useMemo(() => getLanguageFromFileName(activeFileName), [activeFileName])

  const bindEditorToFile = (fileName, editor = editorRef.current) => {
    if (!editor) return

    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    const fileYText = ydoc.getText(`file_${fileName}`)

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

  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
    bindEditorToFile(fileName)
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
      alert("Cannot delete the last file.")
      return
    }

    if (confirm(`Delete file "${fileName}"?`)) {
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

  // Clean Execution Runner
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

    // Mode 1: HTML / CSS
    if (language === "html" || language === "css") {
      let combinedHTML = codeToRun
      if (language === "css") {
        const htmlCode = ydoc.getText("file_index.html").toString() || "<h1>Live Preview</h1>"
        combinedHTML = `<style>${codeToRun}</style>${htmlCode}`
      }

      setHtmlPreview(combinedHTML)
      setConsoleOutput({
        stdout: `Preview updated.`,
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
          stdout: logs.join("\n") || "(Done - 0 output logs)",
          stderr: "",
          status: "Completed",
          time: `${duration}s`,
          isError: false
        })
      } catch (err) {
        setConsoleOutput({
          stdout: logs.join("\n"),
          stderr: err.toString(),
          status: "Error",
          time: "0.00s",
          isError: true
        })
      } finally {
        setIsRunning(false)
      }
      return
    }

    // Mode 3: Judge0 API for Python, C++, Java
    const langObj = LANGUAGE_CONFIG.find(l => l.id === language)
    try {
      const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: codeToRun,
          language_id: langObj?.judge0Id || 71
        })
      })

      const data = await response.json()

      const stdout = data.stdout || ""
      const stderr = data.stderr || (data.compile_output || "")
      const isErr = !!stderr || (data.status && data.status.id !== 3)

      setConsoleOutput({
        stdout: stdout,
        stderr: stderr,
        status: data.status ? data.status.description : "Completed",
        time: data.time ? `${data.time}s` : "Finished",
        isError: isErr
      })
    } catch (err) {
      setConsoleOutput({
        stdout: "",
        stderr: `Server error: ${err.message}`,
        status: "Error",
        time: "0.00s",
        isError: true
      })
    } finally {
      setIsRunning(false)
    }
  }

  if (!username) {
    return (
      <main className="h-screen w-full bg-[#181818] flex items-center justify-center p-4 font-sans text-neutral-200">
        <div className="bg-[#252526] border border-[#333333] rounded-lg p-6 max-w-sm w-full shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h1 className="text-lg font-semibold text-white tracking-tight">CodeSync IDE</h1>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <label className="block text-neutral-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                className="w-full px-3 py-2 text-sm rounded bg-[#1e1e1e] text-neutral-100 border border-[#3c3c3c] focus:outline-none focus:border-blue-500 transition-colors"
                name="username"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Join Session
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-[#181818] flex text-neutral-300 font-sans text-xs overflow-hidden selection:bg-[#264f78]">
      {/* VS Code Minimal Sidebar */}
      <aside className="h-full w-64 bg-[#252526] border-r border-[#333333] flex flex-col shrink-0">
        {/* Navigation Header Tabs */}
        <div className="flex border-b border-[#333333] bg-[#2d2d2d] text-neutral-400">
          <button
            onClick={() => setActiveSidebarTab("files")}
            className={`flex-1 py-2 font-medium text-center transition-colors cursor-pointer border-b-2 ${
              activeSidebarTab === "files"
                ? "text-white border-blue-500 bg-[#252526]"
                : "border-transparent hover:text-neutral-200"
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setActiveSidebarTab("chat")}
            className={`flex-1 py-2 font-medium text-center transition-colors cursor-pointer border-b-2 ${
              activeSidebarTab === "chat"
                ? "text-white border-blue-500 bg-[#252526]"
                : "border-transparent hover:text-neutral-200"
            }`}
          >
            Chat ({messages.length})
          </button>
          <button
            onClick={() => setActiveSidebarTab("users")}
            className={`flex-1 py-2 font-medium text-center transition-colors cursor-pointer border-b-2 ${
              activeSidebarTab === "users"
                ? "text-white border-blue-500 bg-[#252526]"
                : "border-transparent hover:text-neutral-200"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* Tab 1: File Explorer */}
        {activeSidebarTab === "files" && (
          <div className="flex-1 flex flex-col p-2 overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <span>Files</span>
              <button
                onClick={() => setIsCreatingFile(!isCreatingFile)}
                className="hover:text-white px-1 py-0.5 rounded cursor-pointer transition-colors"
                title="New File"
              >
                + New
              </button>
            </div>

            {isCreatingFile && (
              <form onSubmit={handleCreateFile} className="mb-2 px-1 flex gap-1">
                <input
                  type="text"
                  placeholder="name.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-2 py-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </form>
            )}

            <ul className="flex-1 overflow-y-auto space-y-0.5">
              {filesList.map((fileName) => {
                const isSelected = fileName === activeFileName
                return (
                  <li
                    key={fileName}
                    onClick={() => handleSelectFile(fileName)}
                    className={`group px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#37373d] text-white font-medium"
                        : "hover:bg-[#2a2d2e] text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <span className="truncate">{fileName}</span>
                    <button
                      onClick={(e) => handleDeleteFile(fileName, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-neutral-500 px-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Tab 2: Chat */}
        {activeSidebarTab === "chat" && (
          <div className="flex-1 flex flex-col p-2 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-2 p-1">
              {messages.length === 0 ? (
                <div className="text-center text-neutral-500 italic mt-4">No messages</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="bg-[#1e1e1e] p-2 rounded border border-[#333333]">
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                      <span className="font-semibold text-blue-400">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="text-neutral-200 break-words">{msg.text}</div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChatMessage} className="mt-2 flex gap-1">
              <input
                type="text"
                placeholder="Message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-[#1e1e1e] border border-[#3c3c3c] text-white rounded focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded font-medium cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Users */}
        {activeSidebarTab === "users" && (
          <div className="flex-1 flex flex-col p-2 overflow-hidden">
            <ul className="flex-1 overflow-y-auto space-y-1">
              {users.map((user, index) => (
                <li
                  key={index}
                  className="px-2.5 py-1.5 bg-[#1e1e1e] rounded flex items-center gap-2 text-neutral-300"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="truncate">{user.username}</span>
                  {user.username === username && (
                    <span className="ml-auto text-[10px] text-neutral-500 uppercase">You</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Bar */}
        <div className="px-3 py-1.5 border-t border-[#333333] bg-[#007acc] text-white text-[11px] flex justify-between items-center">
          <span>CodeSync Session</span>
          <span className="opacity-80">Connected</span>
        </div>
      </aside>

      {/* Main Workspace */}
      <section className="flex-1 h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
        {/* VS Code Editor Tabs */}
        <div className="flex items-center bg-[#252526] border-b border-[#333333] overflow-x-auto">
          {filesList.map((fileName) => {
            const isActive = fileName === activeFileName
            return (
              <button
                key={fileName}
                onClick={() => handleSelectFile(fileName)}
                className={`px-3 py-2 text-xs border-r border-[#333333] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500"
                    : "bg-[#2d2d2d] text-neutral-400 hover:bg-[#2a2d2e] hover:text-neutral-200"
                }`}
              >
                <span>{fileName}</span>
              </button>
            )
          })}
        </div>

        {/* Action Toolbar */}
        <div className="px-3 py-1.5 bg-[#1e1e1e] border-b border-[#333333] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 uppercase text-[10px]">Lang:</span>
              <span className="text-neutral-200 font-medium uppercase">{language}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 uppercase text-[10px]">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-[#252526] border border-[#3c3c3c] text-neutral-300 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 uppercase text-[10px]">Font:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-[#252526] border border-[#3c3c3c] text-neutral-300 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-2.5 py-1 bg-[#252526] hover:bg-[#2e2e2e] text-neutral-300 border border-[#3c3c3c] rounded cursor-pointer transition-colors"
            >
              {showConsole ? "Hide Terminal" : "Show Terminal"}
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`px-4 py-1 rounded font-medium text-white transition-colors cursor-pointer ${
                isRunning ? "bg-amber-600 opacity-70" : "bg-[#0e639c] hover:bg-[#1177bb]"
              }`}
            >
              {isRunning ? "Executing..." : "▶ Run Code"}
            </button>
          </div>
        </div>

        {/* Editor Area */}
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
              padding: { top: 8, bottom: 8 }
            }}
            onMount={handleMount}
          />
        </div>

        {/* Terminal Console Output */}
        {showConsole && (
          <div className="h-44 bg-[#181818] border-t border-[#333333] flex flex-col font-mono text-xs">
            <div className="px-3 py-1.5 bg-[#252526] border-b border-[#333333] flex justify-between items-center text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-200">Terminal Output</span>
                {consoleOutput && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${consoleOutput.isError ? "bg-red-900/40 text-red-400" : "bg-emerald-900/40 text-emerald-400"}`}>
                    {consoleOutput.status}
                  </span>
                )}
              </div>
              {consoleOutput && (
                <button
                  onClick={() => setConsoleOutput(null)}
                  className="hover:text-white text-neutral-500 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="p-3 flex-1 overflow-y-auto text-neutral-200 selection:bg-[#264f78]">
              {isRunning && <div className="text-amber-400">Executing code...</div>}

              {(language === "html" || language === "css") && htmlPreview && !isRunning && (
                <div className="w-full h-full border border-[#333333] bg-white rounded overflow-hidden">
                  <iframe title="HTML Preview" srcDoc={htmlPreview} className="w-full h-full border-0" />
                </div>
              )}

              {!isRunning && consoleOutput && (
                <>
                  {consoleOutput.stdout && <pre className="whitespace-pre-wrap leading-relaxed">{consoleOutput.stdout}</pre>}
                  {consoleOutput.stderr && <div className="text-red-400 whitespace-pre-wrap">{consoleOutput.stderr}</div>}
                </>
              )}

              {!isRunning && !consoleOutput && (language !== "html" && language !== "css") && (
                <div className="text-neutral-600">Click "▶ Run Code" to see execution output here...</div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
