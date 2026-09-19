import fs from "fs"
import path from "path"
import * as Y from "./node_modules/@y/websocket-server/node_modules/yjs/src/index.js"
import { setPersistence } from "@y/websocket-server/utils"

process.env.HOST ??= "localhost"
process.env.PORT ??= "1234"

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

await import("@y/websocket-server/server")
