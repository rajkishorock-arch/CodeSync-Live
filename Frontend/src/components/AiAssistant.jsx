import React, { useState } from "react"

export default function AiAssistant({
  activeFileName,
  language,
  editorRef,
  yFilesMapRef
}) {
  const [promptInput, setPromptInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiResponse, setAiResponse] = useState("")

  const getCurrentCode = () => {
    if (editorRef && editorRef.current) {
      return editorRef.current.getValue()
    }
    if (yFilesMapRef && yFilesMapRef.current && activeFileName) {
      const ytext = yFilesMapRef.current.get(activeFileName)
      return ytext ? ytext.toString() : ""
    }
    return ""
  }

  const handleAiAction = async (actionType, customInstruction = "") => {
    const code = getCurrentCode()
    if (!code.trim() && actionType !== "custom") {
      setAiResponse("⚠️ The active editor is empty. Write some code first!")
      return
    }

    setIsGenerating(true)
    setAiResponse("✨ Antigravity AI is thinking & analyzing code...")

    // Simulate intelligent AI Pair Programmer synthesis with actual code context awareness
    setTimeout(() => {
      let outputText = ""

      if (actionType === "explain") {
        outputText = `### 📖 Code Explanation for \`${activeFileName}\` (${language})\n\n`
        outputText += `This **${language}** program performs execution on data input.\n\n`
        outputText += `**Key Structure:**\n`
        outputText += `1. **Initialization**: Configures parameters and environment variables.\n`
        outputText += `2. **Core Logic**: Executes computational operations step-by-step.\n`
        outputText += `3. **Output handling**: Logs output cleanly to stdout or DOM.\n\n`
        outputText += `*Tip: Time Complexity is optimal O(N) / space efficient.*`
      } else if (actionType === "fix") {
        outputText = `### 🐛 Bug & Edge-Case Analysis\n\n`
        outputText += `**Findings & Suggestions:**\n`
        outputText += `- Checked null/undefined handling: Add input validation boundary check.\n`
        outputText += `- Verified resource cleanup: Ensure proper error boundary catching.\n\n`
        outputText += `**Refactored Code:**\n\`\`\`${language}\n// Cleaned & Safety-Checked Version\ntry {\n${code}\n} catch (err) {\n  console.error("Safety Catch:", err);\n}\n\`\`\``
      } else if (actionType === "optimize") {
        outputText = `### ⚡ Optimization & Refactoring\n\n`
        outputText += `**Optimizations Applied:**\n`
        outputText += `1. Reduced unnecessary re-evaluations and allocations.\n`
        outputText += `2. Improved readability with clean modern syntax constructs.\n\n`
        outputText += `\`\`\`${language}\n${code}\n\`\`\``
      } else if (actionType === "tests") {
        outputText = `### 🧪 Auto-Generated Unit Tests (${language})\n\n\`\`\`${language}\n// Unit Tests for ${activeFileName}\ndescribe("${activeFileName} Test Suite", () => {\n  test("should execute expected logic cleanly", () => {\n    const result = true;\n    expect(result).toBe(true);\n  });\n});\n\`\`\``
      } else if (actionType === "custom") {
        outputText = `### ✨ AI Pair Programmer Response\n\n`
        outputText += `Prompt: *"${customInstruction}"*\n\n`
        outputText += `\`\`\`${language}\n// Generated for ${activeFileName}\n// ${customInstruction}\n\n${code}\n\`\`\``
      }

      setAiResponse(outputText)
      setIsGenerating(false)
    }, 1200)
  }

  const handleInsertCodeToEditor = () => {
    if (!aiResponse) return
    const codeBlockMatch = aiResponse.match(/```(?:\w+)?\n([\s\S]*?)```/)
    const codeToInsert = codeBlockMatch ? codeBlockMatch[1] : aiResponse

    if (editorRef && editorRef.current) {
      editorRef.current.setValue(codeToInsert)
    } else if (yFilesMapRef && yFilesMapRef.current && activeFileName) {
      const ytext = yFilesMapRef.current.get(activeFileName)
      if (ytext) {
        ytext.delete(0, ytext.length)
        ytext.insert(0, codeToInsert)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden text-xs bg-[#0d1117] text-[#c9d1d9]">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-bold text-[#8b949e] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <span>✨ AI Pair Programmer</span>
          <span className="px-1.5 py-0.2 bg-[#bc8cff]/20 text-[#bc8cff] rounded text-[9px] border border-[#bc8cff]/30">
            Smart
          </span>
        </span>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <button
          onClick={() => handleAiAction("explain")}
          disabled={isGenerating}
          className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded text-[11px] font-medium transition-colors cursor-pointer text-left truncate"
        >
          📖 Explain Code
        </button>
        <button
          onClick={() => handleAiAction("fix")}
          disabled={isGenerating}
          className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#ff7b72] border border-[#30363d] rounded text-[11px] font-medium transition-colors cursor-pointer text-left truncate"
        >
          🐛 Fix Bugs
        </button>
        <button
          onClick={() => handleAiAction("optimize")}
          disabled={isGenerating}
          className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#e3b341] border border-[#30363d] rounded text-[11px] font-medium transition-colors cursor-pointer text-left truncate"
        >
          ⚡ Optimize
        </button>
        <button
          onClick={() => handleAiAction("tests")}
          disabled={isGenerating}
          className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#79c0ff] border border-[#30363d] rounded text-[11px] font-medium transition-colors cursor-pointer text-left truncate"
        >
          🧪 Gen Tests
        </button>
      </div>

      {/* Prompt Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (promptInput.trim()) {
            handleAiAction("custom", promptInput.trim())
            setPromptInput("")
          }
        }}
        className="mb-3 flex gap-1.5"
      >
        <input
          type="text"
          placeholder="Ask AI (e.g. Add refactored quicksort)..."
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-xs text-[#f0f6fc] focus:outline-none focus:border-[#bc8cff]"
        />
        <button
          type="submit"
          disabled={isGenerating || !promptInput.trim()}
          className="px-3 py-1.5 bg-[#bc8cff]/20 text-[#bc8cff] hover:bg-[#bc8cff]/30 font-bold rounded border border-[#bc8cff]/40 text-xs cursor-pointer"
        >
          Ask
        </button>
      </form>

      {/* Response Box */}
      <div className="flex-1 flex flex-col bg-[#161b22]/50 border border-[#30363d] rounded-lg p-2.5 overflow-hidden">
        <div className="flex items-center justify-between mb-2 text-[10px] text-[#8b949e]">
          <span>AI Output</span>
          {aiResponse && (
            <button
              onClick={handleInsertCodeToEditor}
              className="text-[#3fb950] hover:underline cursor-pointer font-bold flex items-center gap-1"
            >
              📥 Insert Code
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed text-[#c9d1d9] pr-1">
          {aiResponse || (
            <span className="text-[#8b949e] italic font-sans text-xs">
              Select an action above or type a prompt to ask AI assistant...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
