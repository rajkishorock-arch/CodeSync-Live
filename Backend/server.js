import fs from "fs"
import path from "path"
import { createRequire } from "module"
import { pathToFileURL } from "url"
import * as Y from "yjs"
import { setPersistence } from "y-websocket/bin/utils"

process.env.HOST ??= "0.0.0.0"
process.env.PORT ??= process.env.PORT || "1234"

const persistenceDir = path.resolve("storage")
const saveTimers = new Map()

fs.mkdirSync(persistenceDir, { recursive: true })

function getDocPath(docName) {
  return path.join(persistenceDir, `${Buffer.from(docName).toString("base64url")}.bin`)
}

function saveDoc(docName, doc) {
  const filePath = getDocPath(docName)
  const tempPath = `${filePath}.tmp`
  const update = Y.encodeStateAsUpdate(doc)

  fs.writeFileSync(tempPath, update)
  fs.renameSync(tempPath, filePath)
}

setPersistence({
  provider: null,
  bindState(docName, doc) {
    const filePath = getDocPath(docName)

    if (fs.existsSync(filePath)) {
      Y.applyUpdate(doc, fs.readFileSync(filePath))
    }

    doc.on("update", () => {
      clearTimeout(saveTimers.get(docName))
      saveTimers.set(docName, setTimeout(() => saveDoc(docName, doc), 250))
    })
  },
  async writeState(docName, doc) {
    saveDoc(docName, doc)
  },
})

const require = createRequire(import.meta.url)
const yWebsocketDir = path.dirname(require.resolve("y-websocket/package.json"))
const serverScript = path.join(yWebsocketDir, "bin", "server.cjs")

await import(pathToFileURL(serverScript).href)
