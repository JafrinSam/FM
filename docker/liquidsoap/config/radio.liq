############################################
# 1. GLOBAL SETTINGS
############################################
settings.log.stdout := true
settings.log.file := true
settings.server.telnet := true
settings.server.telnet.port := 1234
settings.server.telnet.bind_addr := "0.0.0.0"
# Increase buffer latency to prevent "catchup" warnings
settings.frame.duration := 0.04 

# Icecast Password
icecast_pass =
  if environment.get("ICECAST_SOURCE_PASSWORD") == "" then
    "hackme"
  else
    environment.get("ICECAST_SOURCE_PASSWORD")
  end

############################################
# 2. GUEST INPUTS (Threaded & Isolated)
############################################
guest_count = 5
guests_active = ref(false)

# --- COMMANDS ---
def guests_on_cmd(_) =
  guests_active := true
  "Guests Enabled (On Air)"
end
server.register("guests.on", guests_on_cmd)

def guests_off_cmd(_) =
  guests_active := false
  "Guests Disabled (Muted)"
end
server.register("guests.off", guests_off_cmd)

# --- SETUP FUNCTION ---
def setup_guest(i) =
  key = "guest#{i}"
  
  # 1. Define the Input
  # We use 'fallible=true' so it doesn't crash if the stream is missing initially
  raw = input.ffmpeg("rtmp://srs/live/#{key}")

  # 2. 🟢 ISOLATION (The Magic Fix)
  # We call this to move 'raw' to a new dedicated thread (clock).
  # It modifies 'raw' in place, so we don't need to assign it to a variable.
  clock.assign_new(id="guest_clk_#{i}", [raw])

  # 3. BRIDGE BACK TO MAIN
  # Now that 'raw' is on a separate thread, we use a buffer to safely 
  # bring the audio back to the Main Thread.
  bridged_raw = buffer(max=1.0, fallible=true, raw)

  # 4. Safety Fallback
  # If the buffer is empty (guest offline), play silence immediately.
  safe = fallback(track_sensitive=false, [bridged_raw, blank()])
  
  # 5. Controls
  vol_ref  = ref(1.0)
  server.register("#{key}.vol", fun (v) -> begin vol_ref := float_of_string(v) "Set #{key} vol" end)

  amplify({ 
    if guests_active() == true then vol_ref() else 0.0 end 
  }, safe)
end

# Initialize list
guest_sources = list.init(guest_count, fun (i) -> setup_guest(i + 1))

############################################
# 3. QUEUES & PLAYLISTS
############################################
schedule_queue = request.queue(id="schedule_queue")
music_queue = request.queue(id="queue")
auto_playlist = playlist(id="playlist", "/radio/music", reload_mode="watch", mode="random")

radio_music_base = fallback(
  track_sensitive=false, 
  [schedule_queue, music_queue, auto_playlist, blank(duration=0.5)]
)

############################################
# 4. METADATA TRACKING
############################################
current_title = ref("Station Idle")
current_artist = ref("Station Offline")
current_is_live = ref("false")

def update_metadata(m) =
  t = m["title"]
  a = m["artist"]
  
  if m["is_live"] == "true" then
     current_title := "Live Broadcast"
     current_artist := "On Air"
     current_is_live := "true"
  elsif t != "" then
     current_title := t
     current_artist := a
     current_is_live := "false"
  else
     current_title := "Station Idle"
     current_artist := "Station Offline"
     current_is_live := "false"
  end
  
  log(label="metadata", "Now Playing: #{current_title()}")
  m
end

def get_status_cmd(_) =
  "#{current_title()}|#{current_artist()}|#{current_is_live()}"
end
server.register("get_status", get_status_cmd)

radio_music_tracked = metadata.map(update_metadata, radio_music_base)

############################################
# 5. MAIN INPUTS (Admin)
############################################
main_rj_raw = input.ffmpeg("rtmp://srs/live/admin")

# Use (_) to suppress warning
def inject_live_meta(_) =
  [("title", "Live Broadcast"), ("artist", "Studio"), ("is_live", "true")]
end

main_rj_formatted = metadata.map(inject_live_meta, main_rj_raw)
main_rj_tracked = metadata.map(update_metadata, main_rj_formatted)
main_rj_safe = fallback(track_sensitive=false, [main_rj_tracked, blank()])

vol_main  = ref(1.0)
mute_main = ref(true)
server.register("main.vol", fun (v) -> begin vol_main := float_of_string(v) "Done" end)
server.register("main.mute", fun (v) -> begin mute_main := (v == "true") "Done" end)
main_final = amplify({ if mute_main() then 0.0 else vol_main() end }, main_rj_safe)

vol_music  = ref(1.0)
mute_music = ref(false)
server.register("music.vol", fun (v) -> begin vol_music := float_of_string(v) "Done" end)
server.register("music.mute", fun (v) -> begin mute_music := (v == "true") "Done" end)
music_final = amplify({ if mute_music() then 0.0 else vol_music() end }, radio_music_tracked)

############################################
# 6. FINAL MIX & OUTPUT
############################################
all_sources = list.append([music_final, main_final], guest_sources)
final_mix = add(normalize=false, all_sources)

output.icecast(
  %mp3(bitrate=192), 
  host="icecast", 
  port=8000, 
  password=icecast_pass, 
  mount="/radio.mp3", 
  final_mix
)

############################################
# 7. UTILITY COMMANDS
############################################
def play_song_cmd(name) =
  music_queue.push.uri("file:///radio/music/#{name}")
  "Queued #{name}"
end
server.register("play_song", play_song_cmd)

def next_song_cmd(_) =
  music_queue.skip()
  "Skipped"
end
server.register("next_song", next_song_cmd)

# Legacy gain commands
server.register("set_music_gain", fun (v) -> begin vol_music := float_of_string(v) "Done" end)

############################################
# 8. INTERNAL SCHEDULER
############################################
scheduled = ref({ hour = -1, minute = -1, file = "", done = true })

def scheduler_tick() =
  now = time.utc()
  s = scheduled()
  if not s.done and now.hour == s.hour and now.min == s.minute then
    log(label="scheduler", "Executing #{s.file}")
    schedule_queue.push.uri("file:///radio/music/#{s.file}")
    scheduled := { hour = s.hour, minute = s.minute, file = s.file, done = true }
  end
end

thread.run(every={1.}, fun () -> scheduler_tick())

def set_schedule_cmd(args) =
  parts = string.split(separator=" ", args)
  if list.length(parts) != 3 then
    "Usage: set_schedule <HH> <MM> <filename>"
  else
    h = int_of_string(list.nth(parts, 0))
    m = int_of_string(list.nth(parts, 1))
    f = list.nth(parts, 2)
    scheduled := { hour=h, minute=m, file=f, done=false }
    "Scheduled #{f} at #{h}:#{m}"
  end
end
server.register("set_schedule", set_schedule_cmd)

def cancel_schedule_cmd(_) =
  scheduled := { hour=-1, minute=-1, file="", done=true }
  "Cancelled"
end
server.register("cancel_schedule", cancel_schedule_cmd)

def schedule_status_cmd(_) =
  s = scheduled()
  if s.done then "IDLE" else "PENDING" end
end
server.register("schedule_status", schedule_status_cmd)