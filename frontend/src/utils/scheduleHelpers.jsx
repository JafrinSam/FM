// --- CONSTANTS ---
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- HELPERS ---

export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const checkIsOnAir = (targetDay, startTime, endTime) => {
  if (!startTime || !endTime || !targetDay) return false;
  const now = new Date();
  const currentDayIndex = now.getDay();
  const adjustedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const todayName = DAYS_OF_WEEK[adjustedIndex];

  if (targetDay !== todayName) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (endMinutes < startMinutes) return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Transform Mongoose/Backend data to UI format
export const transformScheduleData = (item) => {
  const show = item.show || {};

  // Logic: Use the specific RJ for this slot if available (item.rj).
  // Otherwise, use the first RJ assigned to the show (show.rjs[0]).
  const primaryRj = item.rj || (show.rjs && show.rjs.length > 0 ? show.rjs[0] : null);

  return {
    id: item._id,
    title: show.title || "Music Selection",
    subtitle: show.tagline || "Non-stop hits",
    description: show.description || "",
    isLiveFormat: show.isLive || false,
    isHit: show.isHit || false,
    guest: show.guestName || null,
    startTime: item.startTime,
    endTime: item.endTime,
    day: item.day,
    image: show.coverImage || "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?auto=format&fit=crop&q=80",

    // ✅ NEW: RJ Details extracted safely
    rjName: primaryRj ? primaryRj.name : "ByteCast Bot",
    rjImage: (primaryRj && primaryRj.photo && primaryRj.photo.length > 0) ? primaryRj.photo[0] : null,
    rjBio: primaryRj ? primaryRj.bio : null,
    rjInstagram: primaryRj ? primaryRj.instagram : null
  };
};