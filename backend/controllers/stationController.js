import axios from 'axios';


export const skipSong = async (req, res) => {
  try {
    // Call AzuraCast API
    // Endpoint: /api/station/{station_id}/backend/skip
    await axios.post(
      `${process.env.AZURACAST_API_URL}/api/station/1/backend/skip`, 
      {}, 
      {
        headers: {
          'X-API-Key': process.env.AZURACAST_API_KEY // Your AzuraCast Admin API Key
        }
      }
    );
    
    res.status(200).json({ success: true, message: "Song skipped successfully" });
  } catch (err) {
    console.error("Skip failed:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to skip song" });
  }
};