# radio.liq — Liquidsoap configuration for SRS RTMP output

# Logging
set("log.stdout", true)
set("log.file", false)

# Telnet / control interface
set("server.telnet", true)
set("server.telnet.port", 1234)
set("server.telnet.bind_addr", "0.0.0.0")

# === Sources ===

# 1) The music playlist directory or m3u file
music_list = playlist(id="music", "/radio/music")

# 2) rotate expects a LIST of sources — wrap the playlist in [ ... ]
# This ensures the playlist loops and acts as an "unfallible" source.
rotated_music = rotate([music_list])

# 3) Make the main radio source infallible:
# fallback picks the first available child; uses blank() if rotated_music somehow fails.
radio = fallback(track_sensitive=false, [rotated_music, blank(duration=0.5)])

# === Encoder (FFmpeg) ===
ff_enc = %ffmpeg(
  format = "flv",
  %audio(codec="aac", b="128k")
)

# === Outputs ===

# 1) Push to SRS (RTMP)
output.url(
  url = "rtmp://srs:1935/live/radio",
  ff_enc,
  radio
)

# [Local archive output commented out due to parameter error]

