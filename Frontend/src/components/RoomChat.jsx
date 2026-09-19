import React from "react"

export default function RoomChat({
  messages,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  chatEndRef
}) {
  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden bg-[#161b22]">
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
  )
}
