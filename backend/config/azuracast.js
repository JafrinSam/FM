import axios from 'axios';

// REPLACE THESE WITH YOUR REAL CREDENTIALS
const AZURA_BASE_URL = process.env.AZURA_API_URL || "https://radio.your-domain.com/api"; 
const API_KEY = process.env.AZURA_API_KEY || "your-api-key"; 
const STATION_ID = process.env.AZURA_STATION_ID || 1; 

export const azuraClient = axios.create({
  baseURL: AZURA_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  },
  // Increase body size limit for large file uploads
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

export { STATION_ID };