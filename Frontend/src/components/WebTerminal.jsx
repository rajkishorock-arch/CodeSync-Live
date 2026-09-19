import React, { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

export default function WebTerminal({
  activeFileName,
  filesList,
  fileLanguages,
  handleRunCode,
  username,
  roomId,
  users,
  yFilesMapRef
}) {
  const terminalRef = useRef(null)
  const termInstance = useRef(null)
  const fitAddonRef = useRef(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        selectionBackground: "rgba(56, 139, 253, 0.3)",
        black: "#484f58",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc"
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.2
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    termInstance.current = term
    fitAddonRef.current = fitAddon

    // Welcome Header
    term.writeln("\x1b[1;36mCodeSync Live Interactive Web Shell v1.0.0\x1b[0m")
    term.writeln("Type \x1b[32m'help'\x1b[0m to list available interactive shell commands.\r\n")

    let currentInput = ""
    let history = []
    let historyIndex = -1
    let mode = "shell" // 'shell', 'js-repl', 'py-repl'

    const prompt = () => {
      if (mode === "js-repl") {
        term.write("\x1b[33mjs>\x1b[0m ")
      } else if (mode === "py-repl") {
        term.write("\x1b[32m>>>\x1b[0m ")
      } else {
        term.write(`\x1b[36m${username || "user"}@codesync\x1b[0m:\x1b[34m~/workspace\x1b[0m$ `)
      }
    }

    prompt()

    const handleCommand = (cmdStr) => {
      const trimmed = cmdStr.trim()
      if (!trimmed) {
        prompt()
        return
      }

      history.push(trimmed)
      historyIndex = history.length

      if (mode === "js-repl") {
        if (trimmed === "exit" || trimmed === ".exit") {
          mode = "shell"
          term.writeln("\x1b[33mExited JS REPL.\x1b[0m")
        } else {
          try {
            const result = eval(trimmed)
            term.writeln(`\x1b[32m${typeof result === "object" ? JSON.stringify(result) : result}\x1b[0m`)
          } catch (err) {
            term.writeln(`\x1b[31mEvalError: ${err.message}\x1b[0m`)
          }
        }
        prompt()
        return
      }

      if (mode === "py-repl") {
        if (trimmed === "exit" || trimmed === "exit()") {
          mode = "shell"
          term.writeln("\x1b[32mExited Python REPL.\x1b[0m")
        } else {
          try {
            // Simple arithmetic or JS math evaluation for Python REPL simulation
            const safeEval = new Function(`return (${trimmed.replace(/print\((.*)\)/, "$1")})`)
            const res = safeEval()
            term.writeln(`\x1b[32m${res}\x1b[0m`)
          } catch (err) {
            term.writeln(`\x1b[31mSyntaxError: invalid syntax in '${trimmed}'\x1b[0m`)
          }
        }
        prompt()
        return
      }

      // Standard Shell Commands
      const parts = trimmed.split(" ")
      const cmd = parts[0].toLowerCase()
      const args = parts.slice(1)

      switch (cmd) {
        case "help":
          term.writeln("\x1b[1;33mAvailable Commands:\x1b[0m")
          term.writeln("  \x1b[32mrun\x1b[0m           Execute currently active file")
          term.writeln("  \x1b[32mls\x1b[0m            List files and directories in current room workspace")
          term.writeln("  \x1b[32mcat <file>\x1b[0m    Display contents of a specified file")
          term.writeln("  \x1b[32mnode\x1b[0m          Launch interactive JavaScript REPL")
          term.writeln("  \x1b[32mpython\x1b[0m        Launch interactive Python REPL")
          term.writeln("  \x1b[32mwhoami\x1b[0m        Print current user identity")
          term.writeln("  \x1b[32mstatus\x1b[0m        Show room ID, user count, and connection health")
          term.writeln("  \x1b[32mdate\x1b[0m          Show current system date and timestamp")
          term.writeln("  \x1b[32mclear\x1b[0m         Clear the terminal screen")
          break

        case "run":
        case "execute":
          term.writeln(`\x1b[33m[Running ${activeFileName} ...]\x1b[0m`)
          if (handleRunCode) {
            handleRunCode()
            term.writeln("\x1b[32m✔ Execution triggered. Check output tab or console.\x1b[0m")
          }
          break

        case "ls":
          term.writeln("\x1b[1;34mWorkspace Directory Listing:\x1b[0m")
          filesList.forEach((f) => {
            const lang = fileLanguages[f] || "txt"
            term.writeln(`  📄 \x1b[36m${f}\x1b[0m \x1b[90m(${lang})\x1b[0m`)
          })
          break

        case "cat":
          if (!args[0]) {
            term.writeln("\x1b[31mUsage: cat <filename>\x1b[0m")
          } else {
            const fileName = args[0]
            if (yFilesMapRef && yFilesMapRef.current) {
              const ytext = yFilesMapRef.current.get(fileName)
              if (ytext) {
                term.writeln(`\x1b[90m--- ${fileName} ---\x1b[0m`)
                term.writeln(ytext.toString())
                term.writeln(`\x1b[90m--- end of file ---\x1b[0m`)
              } else {
                term.writeln(`\x1b[31mcat: ${fileName}: No such file\x1b[0m`)
              }
            } else {
              term.writeln(`\x1b[31mcat: Workspace storage unreachable\x1b[0m`)
            }
          }
          break

        case "node":
        case "js":
          mode = "js-repl"
          term.writeln("\x1b[33mWelcome to Node.js v20.11.0 REPL. Type 'exit' to quit.\x1b[0m")
          break

        case "python":
        case "py":
          mode = "py-repl"
          term.writeln("\x1b[32mPython 3.11.4 (CodeSync Live Shell). Type 'exit' to quit.\x1b[0m")
          break

        case "whoami":
          term.writeln(`\x1b[35m${username || "developer"}\x1b[0m`)
          break

        case "status":
          term.writeln(`\x1b[36mRoom ID:\x1b[0m ${roomId}`)
          term.writeln(`\x1b[36mActive Users:\x1b[0m ${users ? users.length : 1}`)
          term.writeln(`\x1b[36mActive File:\x1b[0m ${activeFileName}`)
          term.writeln(`\x1b[32mConnection:\x1b[0m WebSocket Yjs Synced`)
          break

        case "date":
          term.writeln(new Date().toString())
          break

        case "clear":
          term.clear()
          break

        default:
          term.writeln(`\x1b[31mcommand not found: ${cmd}\x1b[0m. Type \x1b[32m'help'\x1b[0m for commands.`)
      }

      prompt()
    }

    const disposable = term.onData((e) => {
      switch (e) {
        case "\r": // Enter
          term.write("\r\n")
          handleCommand(currentInput)
          currentInput = ""
          break
        case "\x7F": // Backspace
          if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1)
            term.write("\b \b")
          }
          break
        case "\u0003": // Ctrl+C
          term.write("^C\r\n")
          currentInput = ""
          prompt()
          break
        case "\u001b[A": // Up Arrow
          if (history.length > 0 && historyIndex > 0) {
            historyIndex--
            while (currentInput.length > 0) {
              term.write("\b \b")
              currentInput = currentInput.slice(0, -1)
            }
            currentInput = history[historyIndex]
            term.write(currentInput)
          }
          break
        case "\u001b[B": // Down Arrow
          if (history.length > 0 && historyIndex < history.length - 1) {
            historyIndex++
            while (currentInput.length > 0) {
              term.write("\b \b")
              currentInput = currentInput.slice(0, -1)
            }
            currentInput = history[historyIndex]
            term.write(currentInput)
          } else if (historyIndex === history.length - 1) {
            historyIndex = history.length
            while (currentInput.length > 0) {
              term.write("\b \b")
              currentInput = currentInput.slice(0, -1)
            }
          }
          break
        default:
          if (e >= " " || e === "\t") {
            currentInput += e
            term.write(e)
          }
      }
    })

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      disposable.dispose()
      window.removeEventListener("resize", handleResize)
      term.dispose()
    }
  }, [activeFileName, filesList, fileLanguages, username, roomId, users, yFilesMapRef, handleRunCode])

  return (
    <div className="w-full h-full bg-[#0d1117] p-2 overflow-hidden flex flex-col">
      <div ref={terminalRef} className="flex-1 w-full h-full" />
    </div>
  )
}
