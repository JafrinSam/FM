############################################
# Logging
############################################
settings.log.stdout := true
settings.log.file := false

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
# REQUEST QUEUE (CONTROLLED BY NODE.JS)
############################################
music_queue = request.queue(id="queue")

############################################
# AUTO MUSIC FALLBACK
############################################
auto_playlist = playlist(
  id="playlist",
  "/radio/music"
)

############################################
# SOURCE SELECTION
############################################
radio_music = fallback(
  track_sensitive=false,
  [
    music_queue,
    auto_playlist,
    blank(duration=0.5)
  ]
)

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
# TELNET COMMANDS (QUEUE + GAIN)
############################################

def play_song_cmd(name) =
  music_queue.push.uri("file:///radio/music/#{name}")
  "Queued #{name}"
end
server.register("play_song", play_song_cmd)

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
    music_queue.push.uri("file:///radio/music/#{s.file}")

    # mark as executed (explicit rebuild)
    scheduled := {
      hour   = s.hour,
      minute = s.minute,
      file   = s.file,
      done   = true
    }
  end
end

############################################
# BACKGROUND SCHEDULER (UTC, EVERY 1 SECOND)
############################################
thread.run(
  every={1.},
  fun () -> scheduler_tick()
)


############################################
# SCHEDULER TELNET COMMANDS
############################################

# Set ONE schedule (Node.js uses this)
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

# Check if executed or pending
def schedule_status_cmd(_) =
  s = scheduled()
  if s.done then
    "IDLE"
  else
    "PENDING #{s.file} at #{s.hour}:#{s.minute}"
  end
end
server.register("schedule_status", schedule_status_cmd)

# Cancel pending schedule
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
# PRINT STARTUP UTC TIME (ONCE)
############################################
def log_startup_time() =
  t = time.utc()
  log("Liquidsoap started (UTC) at #{t.hour}:#{t.min}:#{t.sec}")
end

thread.run(fun () -> log_startup_time())
