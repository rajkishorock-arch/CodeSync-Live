// Simple, clean code auto-formatter utility for IDE supported languages

export function formatCode(code, language) {
  if (!code || typeof code !== "string") return code

  try {
    if (language === "json") {
      const parsed = JSON.parse(code)
      return JSON.stringify(parsed, null, 2)
    }

    if (language === "javascript" || language === "typescript" || language === "css" || language === "html") {
      // Basic indentation formatter for web languages
      let indentLevel = 0
      const indentStr = "  "
      const lines = code.split("\n")
      const formattedLines = lines.map((line) => {
        let trimmed = line.trim()
        if (!trimmed) return ""

        if (trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith("</")) {
          indentLevel = Math.max(0, indentLevel - 1)
        }

        const currentIndent = indentStr.repeat(indentLevel)
        const result = currentIndent + trimmed

        const openBraces = (trimmed.match(/[\{\[\(<]/g) || []).length
        const closeBraces = (trimmed.match(/[\}\]\)>]/g) || []).length
        const diff = openBraces - closeBraces

        if (trimmed.endsWith("{") || trimmed.endsWith("[") || trimmed.endsWith("<") || diff > 0) {
          indentLevel += 1
        }

        return result
      })

      return formattedLines.join("\n")
    }

    if (language === "python" || language === "cpp" || language === "c" || language === "java" || language === "go") {
      // Basic indentation and trailing space cleanup
      let indentLevel = 0
      const indentStr = "    "
      const lines = code.split("\n")
      const formattedLines = lines.map((line) => {
        let trimmed = line.trim()
        if (!trimmed) return ""

        if (trimmed.startsWith("}") || trimmed.startsWith(")") || trimmed.startsWith("else:") || trimmed.startsWith("elif ")) {
          indentLevel = Math.max(0, indentLevel - 1)
        }

        const currentIndent = indentStr.repeat(indentLevel)
        const result = currentIndent + trimmed

        if (trimmed.endsWith("{") || trimmed.endsWith(":") || trimmed.endsWith("(")) {
          indentLevel += 1
        }

        return result
      })

      return formattedLines.join("\n")
    }
  } catch (err) {
    console.warn("Formatting warning:", err)
  }

  return code
}
