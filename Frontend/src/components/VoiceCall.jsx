import React, { useState, useEffect, useRef } from "react"

export default function VoiceCall({ roomId, username, users, getUserColor }) {
  const [inCall, setInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [voiceUsers, setVoiceUsers] = useState([])
  const mediaStreamRef = useRef(null)

  const handleToggleCall = async () => {
    if (!inCall) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
        setInCall(true)
        setIsMuted(false)
        setVoiceUsers((prev) => [...prev, username])
      } catch (err) {
        alert("Microphone permission denied or audio device unavailable: " + err.message)
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      setInCall(false)
      setVoiceUsers((prev) => prev.filter((u) => u !== username))
    }
  }

  const handleToggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-md text-xs">
      {!inCall ? (
        <button
          onClick={handleToggleCall}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
          title="Join live voice channel for pair programming"
        >
          <span>🎙️</span>
          <span className="hidden md:inline">Voice Call</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#3fb950] font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-ping"></span>
            <span>Live Voice ({voiceUsers.length})</span>
          </div>

          <button
            onClick={handleToggleMute}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer ${
              isMuted
                ? "bg-[#f85149]/20 text-[#f85149] border-[#f85149]/40"
                : "bg-[#21262d] text-[#c9d1d9] border-[#30363d]"
            }`}
          >
            {isMuted ? "🔇 Muted" : "🎙️ Mute"}
          </button>

          <button
            onClick={handleToggleCall}
            className="px-2 py-0.5 bg-[#f85149]/20 text-[#f85149] hover:bg-[#f85149]/30 border border-[#f85149]/40 rounded text-[11px] font-bold cursor-pointer"
          >
            Leave
          </button>
        </div>
      )}
    </div>
  )
}
