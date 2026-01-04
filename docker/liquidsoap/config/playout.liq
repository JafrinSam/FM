#!/usr/bin/liquidsoap
# PLAYOUT.LIQ - Handles Music, Scheduling, and Final Output

# 1. SETTINGS
settings.log.stdout := true
settings.server.telnet := true
settings.server.telnet.port := 1234
settings.server.telnet.bind_addr := "0.0.0.0"
settings.frame.duration := 0.04 

icecast_pass = environment.get("ICECAST_PASS")
sidecar_url = environment.get("SIDECAR_URL")

# 2. MUSIC QUEUES
schedule_queue = request.queue(id="schedule_queue")
music_queue = request.queue(id="queue")
auto_playlist = playlist(id="playlist", "/music", reload_mode="watch", mode="random")

# Music Fallback: If one fails, try the next
music_source = fallback(
  track_sensitive=false, 
  [schedule_queue, music_queue, auto_playlist, blank(duration=0.5)]
)

vol_music = ref(1.0)
server.register("music.vol", fun (v) -> begin vol_music := float_of_string(v) "Done" end)
music_final = amplify({ vol_music() }, music_source)

# ---------------------------------------------------------
# 3. LIVE INGEST (UPDATED)
# ---------------------------------------------------------
# Connect to the local ingest stream
live_raw = input.http("http://icecast:8000/live_feed", max_buffer=5.0)

# 🚨 THE FIX: Detect Silence 🚨
# threshold: Audio level in dB (anything lower is "silence")
# max_blank: How many seconds of silence before we cut the stream?
live_safe = strip_blank(max_blank=3.0, threshold=-40.0, live_raw)

# ---------------------------------------------------------
# 4. MAIN FALLBACK (UPDATED)
# ---------------------------------------------------------
# Now we use 'live_safe' instead of 'live_raw'
# If 'live_safe' detects silence, it fails, and we fall back to 'music_final'
radio = fallback(track_sensitive=false, [live_safe, music_final])

# 5. METADATA
current_title = ref("Station Idle")
current_artist = ref("Station Offline")
current_is_live = ref("false")

def update_metadata(m) =
  current_title := m["title"]
  current_artist := m["artist"]
  current_is_live := if m["is_live"] == "true" then "true" else "false" end

  j = json.stringify(m)
  thread.run(fun () -> begin
      ignore(http.post("#{sidecar_url}/api/webhook/metadata", 
             headers=[("Content-Type","application/json")], 
             data=j))
  end)
end

radio.on_metadata(synchronous=false, update_metadata)

server.register("get_status", fun (_) -> "#{current_title()}|#{current_artist()}|#{current_is_live()}")

# 6. SCHEDULER
scheduled = ref({ hour = -1, minute = -1, file = "", done = true })

def scheduler_tick() =
  now = time.utc()
  s = scheduled()
  if not s.done and now.hour == s.hour and now.min == s.minute then
    log(label="scheduler", "Executing #{s.file}")
    schedule_queue.push.uri("file:///music/#{s.file}")
    scheduled := { hour = s.hour, minute = s.minute, file = s.file, done = true }
  end
end
thread.run(every={1.}, fun () -> scheduler_tick())

# Scheduler Commands
def set_schedule_cmd(args) =
  parts = string.split(separator=" ", args)
  if list.length(parts) != 3 then "Usage: set_schedule <HH> <MM> <filename>" else
    h = int_of_string(list.nth(parts, 0))
    m = int_of_string(list.nth(parts, 1))
    f = list.nth(parts, 2)
    scheduled := { hour=h, minute=m, file=f, done=false }
    "Scheduled #{f} at #{h}:#{m}"
  end
end
server.register("set_schedule", set_schedule_cmd)
server.register("cancel_schedule", fun (_) -> begin scheduled := { hour=-1, minute=-1, file="", done=true } "Cancelled" end)
server.register("schedule_status", fun (_) -> if (scheduled()).done then "IDLE" else "PENDING" end)

# 7. UTILITY COMMANDS
server.register("play_song", fun (name) -> begin music_queue.push.uri("file:///music/#{name}") "Queued #{name}" end)
server.register("next_song", fun (_) -> begin music_queue.skip() "Skipped" end)

# 8. FINAL OUTPUT
output.icecast(
  %mp3(bitrate=192), 
  host="icecast", 
  port=8000, 
  password=icecast_pass, 
  mount="/radio.mp3", 
  radio
)