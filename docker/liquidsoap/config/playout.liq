#!/usr/bin/liquidsoap
# PLAYOUT.LIQ - Stability Version

# 1. SETTINGS
settings.log.stdout := true
settings.server.telnet := true
settings.server.telnet.port := 1234
settings.server.telnet.bind_addr := "0.0.0.0"
settings.frame.duration := 0.04 

icecast_pass = environment.get("ICECAST_PASS")
sidecar_url = environment.get("SIDECAR_URL")

# ---------------------------------------------------------
# 2. DEFINITIONS (Raw Sources)
# ---------------------------------------------------------
# Raw queues for commands
q_schedule_raw = request.queue(id="schedule_queue") 
q_music_raw = request.queue(id="queue")             

def get_next_song() = 
  log("Fetching next song from API...")
  default_json = [("filename","")]
  try
    response_body = http.get("#{sidecar_url}/api/webhook/next-song")
    data = json.parse(default=default_json, response_body)
    fname = list.assoc(default="", "filename", data)
    
    if fname != "" then
      log("Next song received: #{fname}")
      request.create("file:///#{fname}")
    else
      log("API returned empty filename.")
      null
    end
  catch _ do
    log("API Request Failed (Server offline or 404).")
    null
  end
end

# ---------------------------------------------------------
# 3. AUDIO PROCESSING
# ---------------------------------------------------------

# Wrap sources to normalize audio channels
s_schedule = audio_to_stereo(q_schedule_raw)
s_music = audio_to_stereo(q_music_raw)
s_dynamic = audio_to_stereo(request.dynamic(id="dynamic_next", get_next_song))
s_failsafe = audio_to_stereo(playlist(id="failsafe", "/music", mode="random"))

# LAYER 1: ROTATION (The Music Mix)
# We pick the source here without transitions (simple switch)
rotation_raw = fallback(
  track_sensitive=true, 
  [
    s_music,       
    s_dynamic,      
    s_failsafe
  ]
)

# LAYER 2: SMOOTHING
# We apply the crossfade to the RESULT of the rotation.
# This ensures all music transitions are smooth (3s overlap)
rotation_safe = crossfade(duration=3.0, rotation_raw)

# LAYER 3: PRIORITY INTERRUPT
# The Schedule cuts in immediately over the rotation.
# We REMOVE transitions here to prevent the "Error 5" Type Mismatch.
music_source = fallback(
  track_sensitive=false,
  [
    s_schedule,    # Priority (Hard cut in)
    rotation_safe  # Background Rotation (Smooth faded)
  ]
)

# Volume Control
vol_music = ref(1.0)
server.register("music.vol", fun (v) -> begin vol_music := float_of_string(v) "Done" end)
music_final = amplify({ vol_music() }, music_source)

# ---------------------------------------------------------
# 4. LIVE INGEST & FINAL MIX
# ---------------------------------------------------------
live_raw = input.http("http://icecast:8000/live_feed", max_buffer=5.0)
live_safe = blank.strip(max_blank=3.0, threshold=-40.0, live_raw)

# Final Fallback (Live interrupts Music)
radio = mksafe(fallback(track_sensitive=false, [live_safe, music_final]))

# ---------------------------------------------------------
# 5. METADATA HANDLING
# ---------------------------------------------------------
current_title = ref("Station Idle")
current_artist = ref("Station Offline")
current_is_live = ref("false")

def update_metadata(m) =
  current_title := m["title"]
  current_artist := m["artist"]
  current_is_live := if m["is_live"] == "true" then "true" else "false" end
  
  fn_raw = if m["filename"] != "" then m["filename"] else m["initial_uri"] end
  fn = string.replace(pattern="^file://", (fun (_) -> ""), fn_raw)

  print(">>> METADATA: Title=#{current_title()}, Filename=#{fn}")

  payload = [
    ("title", current_title()),
    ("artist", current_artist()),
    ("is_live", current_is_live()),
    ("filename", fn)
  ]

  j = json.stringify(payload)

  thread.run(fun () -> begin
      try 
        ignore(http.post("#{sidecar_url}/api/webhook/metadata", 
               headers=[("Content-Type","application/json")], 
               data=j))
      catch _ do
         log("Failed to send metadata webhook")
      end
  end)
end

radio.on_metadata(synchronous=false, update_metadata)
server.register("get_status", fun (_) -> "#{current_title()}|#{current_artist()}|#{current_is_live()}")

# ---------------------------------------------------------
# 6. COMMANDS
# ---------------------------------------------------------
server.register("play_scheduled", fun (path) -> begin
  clean_path = string.trim(path)
  uri = "file:///music/#{clean_path}"
  log("🚨 SCHEDULER: Pushing Priority Track: #{uri}")
  q_schedule_raw.push.uri(uri)
  "Scheduled #{clean_path}"
end)

server.register("play_song", fun (name) -> begin 
  q_music_raw.push.uri("file:///music/#{name}") 
  "Queued #{name}" 
end)

server.register("next_song", fun (_) -> begin 
  q_music_raw.skip() 
  "Skipped" 
end)

# ---------------------------------------------------------
# 7. OUTPUT
# ---------------------------------------------------------
output.icecast(
  %mp3(bitrate=192), 
  host="icecast", 
  port=8000, 
  password=icecast_pass, 
  mount="/radio.mp3", 
  radio
)