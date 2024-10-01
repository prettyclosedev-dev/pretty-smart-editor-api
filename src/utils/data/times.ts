import { GeoLocation, Zmanim, HDate, Sedra } from '@hebcal/core';
import axios from 'axios';

require('dotenv').config();

// Fetch geolocation (latitude, longitude) and timezone using Google Geocoding and Timezone APIs
async function fetchGeolocation(location) {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Geocode to get latitude and longitude from city name or ZIP code
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`;
  const geoResponse = await axios.get(geoUrl);

  if (!geoResponse.data.results || !geoResponse.data.results.length) {
    throw new Error('Location not found');
  }

  const { lat, lng } = geoResponse.data.results[0].geometry.location;

  // Fetch timezone information using the Time Zone API
  const timestamp = Math.floor(Date.now() / 1000); // Current time as UNIX timestamp
  const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${googleApiKey}`;
  const timezoneResponse = await axios.get(timezoneUrl);

  if (timezoneResponse.data.status !== 'OK') {
    throw new Error('Timezone not found');
  }

  const tzid = timezoneResponse.data.timeZoneId; // Get timezone ID (e.g., "America/New_York")

  // Check if the location is in Israel
  const isIsrael = geoResponse.data.results.some(result => result.formatted_address.includes('Israel'));

  return { latitude: lat, longitude: lng, timezone: tzid, isIsrael };
}

// Function to get the next Friday date from today
function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ..., Friday = 5, Saturday = 6
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Calculate how many days until the next Friday

  // If today is Friday, we want the next one
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  return nextFriday;
}

// Function to dynamically fetch times based on type (e.g., candlelighting, tzeis, parsha) for the coming Friday
export async function getTimeByType(location, timeType) {
  const { latitude, longitude, timezone, isIsrael } = await fetchGeolocation(location);
  const gloc = new GeoLocation(null, latitude, longitude, 0, timezone);
  const nextFriday = getNextFriday(); // Get the date of the coming Friday
  const zmanim = new Zmanim(gloc, nextFriday, false); // Use the upcoming Friday for all calculations

  let time;

  switch (timeType) {
    case 'candlelighting':
      time = zmanim.sunsetOffset(location === 'Jerusalem' ? -40 : -18, true); // 18 minutes before sunset
      break;
    case 'tzeit':
      time = zmanim.tzeit(); // Nightfall
      break;
    case 'sunset':
      time = zmanim.sunset(); // Sunset
      break;
    case 'parsha': {
      const hDate = new HDate(nextFriday); // Create a Hebrew date from the upcoming Friday
      const sedra = new Sedra(hDate.getFullYear(), isIsrael); // Pass true if location is in Israel
      const parshaResult = sedra.lookup(hDate); // Lookup the Parsha for this Hebrew date
      return parshaResult.parsha.join(', '); // Return Parsha names (may be multiple portions)
    }
    // Add other time types as needed
    default:
      throw new Error(`Unsupported timeType: ${timeType}`);
  }

  // Convert the time to a 12-hour format
  const formattedTime = new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timezone
  });

  return formattedTime;
}
