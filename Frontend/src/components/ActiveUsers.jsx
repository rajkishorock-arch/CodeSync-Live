import React from "react"

export default function ActiveUsers({ users, username, getUserColor }) {
  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden bg-[#161b22]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
          Active Users ({users.length})
        </span>
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
  )
}
