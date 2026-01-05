import { MusicAsset } from '../../models/MusicAsset.js';
import { Schedule } from '../../models/Schedule.js';

const BUFFER_MINUTES = 2; 

export const getNextSong = async (req, res) => {
  try {
    const now = new Date();
    const bufferTime = new Date(now.getTime() + BUFFER_MINUTES * 60000);

    // 1. Check Schedules
    const upcomingSchedule = await Schedule.findOne({
      scheduledTime: { $gt: now, $lte: bufferTime },
      isPlayed: false      
    });

    // 2. Determine Type
    let queryType = "Music"; 
    if (upcomingSchedule) {
      console.log(`⚠️ Upcoming Event detected. Switching to Filler.`);
      queryType = "Filler";
    }

    // 3. Fetch Track
    let nextTrack = await MusicAsset.aggregate([
      { $match: { type: queryType } }, 
      { $sample: { size: 1 } }
    ]);

    // 4. Fallback
    if (nextTrack.length === 0 && queryType === "Filler") {
      nextTrack = await MusicAsset.aggregate([
        { $match: { type: "Music" } }, 
        { $sample: { size: 1 } }
      ]);
    }

    if (nextTrack.length === 0) {
      return res.status(404).json({ error: "No assets available" });
    }

    // ---------------------------------------------------------
    // 5. PATH CLEANUP (FIXED)
    // ---------------------------------------------------------
    const song = nextTrack[0];
    
    // Get the full path from DB (e.g., "radio/music/song.mp3")
    const fullPath = song.filePath || song.filename;

    // Remove "radio/" or "radio\" from the start of the string
    // ^ checks start of line
    // [\\/] checks for forward slash OR backslash (windows/linux safe)
    const cleanFilename = fullPath

    console.log(`✅ Queuing: ${cleanFilename}`); // Output: music/song.mp3

    return res.status(200).json({
      filename: cleanFilename, 
      title: song.title,
      artist: song.artist
    });

  } catch (error) {
    console.error("❌ Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};