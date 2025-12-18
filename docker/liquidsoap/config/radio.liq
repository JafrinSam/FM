############################################
# Logging
############################################
settings.log.stdout := true
settings.log.file := true

############################################
# Telnet
############################################
settings.server.telnet := true
settings.server.telnet.port := 1234
settings.server.telnet.bind_addr := "0.0.0.0"

############################################
# Icecast password
############################################
icecast_pass =
  if environment.get("ICECAST_SOURCE_PASSWORD") == "" then
    "hackme"
  else
    environment.get("ICECAST_SOURCE_PASSWORD")
  end

############################################
# Volume refs
############################################
music_gain  = ref(1.0)
mic_gain    = ref(1.0)
master_gain = ref(1.0)

############################################
# QUEUES (High & Normal Priority)
############################################
# 1. High Priority: For Scheduled Events (Interrupts others)
schedule_queue = request.queue(id="schedule_queue")

# 2. Normal Priority: For User Requests
music_queue = request.queue(id="queue")

############################################
# AUTO MUSIC FALLBACK
############################################
auto_playlist = playlist(
  id="playlist",
  "/radio/music",
  reload_mode="watch",
  mode="random"
)

############################################
# TRANSITIONS (Fade & Skip Logic)
############################################

# Transition: SWITCHING TO SCHEDULE
# This fades out the current song AND skips it so it doesn't resume later.
def to_schedule(old, new) = 
  log("⚠️ Interrupting for Scheduled Event!")
  
  # Force the user queue to skip the current track
  # (Using ignore() because we just want the side effect)
  ignore(music_queue.skip()) 

  # Crossfade: Fade in new (schedule), Fade out old (music)
  add([fade.initial(duration=3., new), fade.final(duration=3., old)])
end

# Transition: STANDARD (Between songs or back to music)
def to_music(old, new) =
  # Standard crossfade
  add([fade.initial(duration=3., new), fade.final(duration=3., old)])
end

############################################
# SOURCE SELECTION
############################################
# The order in the list [] determines priority.
# track_sensitive=false allows us to interrupt the current song immediately.

radio_music = fallback(
  track_sensitive=false, 
  transitions=[to_schedule, to_music, to_music, to_music],
  [
    schedule_queue, # 1. High Priority (Uses to_schedule transition)
    music_queue,    # 2. Medium Priority
    auto_playlist,  # 3. Low Priority
    blank(duration=0.5)
  ]
)

# ==========================================================
#  INSERTED HERE: TRACKING MUST HAPPEN BEFORE MIXING
# ==========================================================

############################################
# TRACKING CURRENT FILENAME
############################################
current_file = ref("No file playing")

def update_filename(m) =
  fname = m["filename"]
  if fname != "" then
    current_file := fname
  else
    current_file := "Unknown File"
  end
  log("Now Playing File: #{current_file()}")
end

def peek_meta(m) =
  update_filename(m)
  m
end

radio_music = metadata.map(peek_meta, radio_music)

def get_filename_cmd(_) =
  current_file()
end
server.register("get_filename", get_filename_cmd)

# ==========================================================
#  END INSERT
# ==========================================================

############################################
# ADMIN MIC (RTMP FROM SRS)
############################################
admin_raw = input.rtmp("rtmp://srs/live/admin")

############################################
# MIXING
############################################
music = amplify(music_gain, radio_music)
mic   = amplify(mic_gain, admin_raw)
final = amplify(master_gain, add([music, mic]))

############################################
# ICECAST OUTPUT
############################################
output.icecast(
  %mp3(bitrate=192),
  host="icecast",
  port=8000,
  password=icecast_pass,
  mount="/radio.mp3",
  final
)

############################################
# TELNET COMMANDS
############################################

def play_song_cmd(name) =
  music_queue.push.uri("file:///radio/music/#{name}")
  "Queued #{name}"
end
server.register("play_song", play_song_cmd)

# NEW: Command for external scheduler to use High Priority Queue
# 2. Scheduled Events -> /radio/scheduled/
def play_scheduled_cmd(name) =
  # 1. Strip leading and trailing quotes using Regex
  #    Pattern ^" means "starts with quote"
  #    Pattern "$ means "ends with quote"
  clean_name = string.replace(pattern="^\"|\"$", (fun (_) -> ""), name)
  
  # 2. Build the full path
  #    Note: Node.js sends "scheduled/filename.mp3", so we just prepend /radio/
  uri = "file:///radio/#{clean_name}"
  
  # 3. Log it for debugging
  print("SCHEDULER: Received '#{name}' -> Cleaned to '#{clean_name}' -> Pushing: #{uri}")
  
  schedule_queue.push.uri(uri)
  "Scheduled #{clean_name} (High Priority)"
end
server.register("play_scheduled", play_scheduled_cmd)


def next_song_cmd(_) =
  music_queue.skip()
  "Skipped current track"
end
server.register("next_song", next_song_cmd)

def show_queue_cmd(_) =
  "#{music_queue.queue()}"
end
server.register("show_queue", show_queue_cmd)

def set_music_gain_cmd(level) =
  music_gain := float_of_string(level)
  "music gain set"
end
server.register("set_music_gain", set_music_gain_cmd)

def show_gains_cmd(_) =
  "music=#{music_gain()} mic=#{mic_gain()} master=#{master_gain()}"
end
server.register("show_gains", show_gains_cmd)

############################################
# SINGLE SCHEDULE STATE (NO LISTS)
############################################
scheduled = ref({
  hour   = -1,
  minute = -1,
  file   = "",
  done   = true
})

############################################
# SCHEDULER ENGINE (UTC TIME)
############################################
def scheduler_tick() =
  now = time.utc()
  s = scheduled()

  if not s.done
     and now.hour == s.hour
     and now.min == s.minute then

    log("Scheduler (UTC): executing #{s.file}")
    
    # !!! CRITICAL CHANGE !!!
    # Push to schedule_queue (High Priority) instead of music_queue
    schedule_queue.push.uri("file:///radio/music/#{s.file}")

    # mark as executed
    scheduled := {
      hour   = s.hour,
      minute = s.minute,
      file   = s.file,
      done   = true
    }
  end
end

############################################
# BACKGROUND SCHEDULER
############################################
thread.run(
  every={1.},
  fun () -> scheduler_tick()
)

############################################
# SCHEDULER TELNET COMMANDS
############################################

def set_schedule_cmd(args) =
  parts = string.split(separator=" ", args)

  if list.length(parts) != 3 then
    "Usage: set_schedule <HH> <MM> <filename>"
  else
    h = int_of_string(list.nth(parts, 0))
    m = int_of_string(list.nth(parts, 1))
    f = list.nth(parts, 2)

    scheduled := {
      hour   = h,
      minute = m,
      file   = f,
      done   = false
    }

    "Scheduled #{f} at #{h}:#{m}"
  end
end
server.register("set_schedule", set_schedule_cmd)

def schedule_status_cmd(_) =
  s = scheduled()
  if s.done then
    "IDLE"
  else
    "PENDING #{s.file} at #{s.hour}:#{s.minute}"
  end
end
server.register("schedule_status", schedule_status_cmd)

def cancel_schedule_cmd(_) =
  scheduled := {
    hour   = -1,
    minute = -1,
    file   = "",
    done   = true
  }
  "Schedule cancelled"
end
server.register("cancel_schedule", cancel_schedule_cmd)

############################################
# PRINT STARTUP UTC TIME
############################################
def log_startup_time() =
  t = time.utc()
  log("Liquidsoap started (UTC) at #{t.hour}:#{t.min}:#{t.sec}")
end

thread.run(fun () -> log_startup_time())