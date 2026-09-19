import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

const LANGUAGE_CONFIG = [
  { id: "javascript", label: "JavaScript (Node.js)", pistonLang: "javascript", version: "*" },
  { id: "python", label: "Python 3", pistonLang: "python3", version: "*" },
  { id: "cpp", label: "C++ (GCC)", pistonLang: "c++", version: "*" },
  { id: "java", label: "Java", pistonLang: "java", version: "*" },
  { id: "typescript", label: "TypeScript", pistonLang: "typescript", version: "*" },
  { id: "html", label: "HTML5", pistonLang: null, version: null },
  { id: "css", label: "CSS3", pistonLang: null, version: null }
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

function App() {
  const editorRef = useRef(null)
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const [users, setUsers] = useState([])
  const [language, setLanguage] = useState("javascript")
  const [theme, setTheme] = useState("vs-dark")
  const [fontSize, setFontSize] = useState(14)
  
  // Execution & Console State
  const [isRunning, setIsRunning] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState(null) // { stdout, stderr, time, status, isError }
  const [showConsole, setShowConsole] = useState(true)
  const [htmlPreview, setHtmlPreview] = useState("")

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])
  const yConfig = useMemo(() => ydoc.getMap("config"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    )

    // Set initial text if empty
    if (yText.toString().trim() === "") {
      yText.insert(0, STARTER_SNIPPETS[language] || "")
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

  // Handle language change sync via Yjs
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    yConfig.set("language", newLang)
  }

  useEffect(() => {
    // Observe Yjs room configuration changes (e.g. language)
    const handleConfigChange = () => {
      const roomLang = yConfig.get("language")
      if (roomLang && roomLang !== language) {
        setLanguage(roomLang)
      }
    }
    yConfig.observe(handleConfigChange)
    return () => yConfig.unobserve(handleConfigChange)
  }, [yConfig, language])

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
    const codeToRun = yText.toString()
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
      setHtmlPreview(codeToRun)
      setConsoleOutput({
        stdout: "Live HTML/CSS Preview updated.",
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
      <main className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
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
      {/* Sidebar - Online Users */}
      <aside className="h-full w-1/5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>👥</span> Room Active Users
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
            {users.length} Live
          </span>
        </div>
        <ul className="p-3 flex-1 overflow-y-auto space-y-2">
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex flex-col gap-1">
          <span className="font-semibold text-slate-300">Room Status:</span>
          <span className="truncate text-emerald-400">● Connected to Room server</span>
        </div>
      </aside>

      {/* Editor & Console Section */}
      <section className="w-4/5 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Action Header / Top Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {LANGUAGE_CONFIG.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Theme:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">VS Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Font Size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
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
                  <span className="text-emerald-400">❯_</span> Terminal Output
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
