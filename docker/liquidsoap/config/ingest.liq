#!/usr/bin/liquidsoap
# INGEST.LIQ - Handles Inputs, Mixing, and Volume Control

# 1. SETTINGS
settings.log.stdout := true
settings.server.telnet := true
settings.server.telnet.port := 1235
settings.server.telnet.bind_addr := "0.0.0.0"
settings.frame.duration := 0.04 

icecast_pass = environment.get("ICECAST_PASS")

# 2. INPUT SETUP HELPER
def setup_safe_source(key, url) =
  raw = input.ffmpeg(url)
  clock.assign_new(id="clk_#{key}", [raw])
  bridged = buffer(max=1.0, fallible=true, raw)
  safe = fallback(track_sensitive=false, [bridged, blank()])
  
  vol_ref = ref(1.0)
  server.register("#{key}.vol", fun (v) -> begin vol_ref := float_of_string(v) "Set #{key} vol" end)
  
  (amplify({ vol_ref() }, safe), vol_ref)
end

# 3. CONFIGURE INPUTS
guest_count = 5
guests_active = ref(false)

server.register("guests.on", fun (_) -> begin guests_active := true "Guests Enabled" end)
server.register("guests.off", fun (_) -> begin guests_active := false "Guests Muted" end)

guest_sources = list.init(guest_count, fun (i) -> begin
  idx = i + 1
  key = "guest#{idx}"
  let (src, vol) = setup_safe_source(key, "rtmp://srs/live/#{key}")
  
  # 🟢 FIX: Added 'end' to the if statement
  amplify({ if guests_active() then 1.0 else 0.0 end }, src)
end)

# --- Admin ---
let (main_src, main_vol) = setup_safe_source("main", "rtmp://srs/live/admin")

mute_main = ref(true)
server.register("main.mute", fun (v) -> begin mute_main := (v == "true") "Done" end)

# 🟢 FIX: Added 'end' here too
main_final = amplify({ if mute_main() then 0.0 else 1.0 end }, main_src)

# 4. MIXING
all_sources = list.append([main_final], guest_sources)
mixed_live = add(normalize=false, all_sources)

# 5. METADATA
def add_live_meta(_) =
  [("title", "Live Broadcast"), ("artist", "On Air"), ("is_live", "true")]
end
mixed_live_tagged = metadata.map(add_live_meta, mixed_live)

# 6. OUTPUT
output.icecast(
  %mp3(bitrate=192), 
  host="icecast", 
  port=8000, 
  password=icecast_pass, 
  mount="/live_feed", 
  mixed_live_tagged
)