import { GeoLocation, Zmanim } from '@hebcal/core'
import axios from 'axios'

require('dotenv').config()

// Fetch geolocation (latitude, longitude) and timezone using Google Geocoding and Timezone APIs
async function fetchGeolocation(location) {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY

  // Geocode to get latitude and longitude from city name or ZIP code
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    location,
  )}&key=${googleApiKey}`
  const geoResponse = await axios.get(geoUrl)

  if (!geoResponse.data.results || !geoResponse.data.results.length) {
    throw new Error('Location not found')
  }

  const { lat, lng } = geoResponse.data.results[0].geometry.location

  // Fetch timezone information using the Time Zone API
  const timestamp = Math.floor(Date.now() / 1000) // Current time as UNIX timestamp
  const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${googleApiKey}`
  const timezoneResponse = await axios.get(timezoneUrl)

  if (timezoneResponse.data.status !== 'OK') {
    throw new Error('Timezone not found')
  }

  const tzid = timezoneResponse.data.timeZoneId // Get timezone ID (e.g., "America/New_York")

  return { latitude: lat, longitude: lng, timezone: tzid }
}

// Function to dynamically fetch times based on type (e.g., candlelighting, tzeis)
export async function getTimeByType(location, timeType) {
  const { latitude, longitude, timezone } = await fetchGeolocation(location)
  const gloc = new GeoLocation(null, latitude, longitude, 0, timezone)
  const zmanim = new Zmanim(gloc, new Date(), false) // Current date

  let time

  switch (timeType) {
    case 'candlelighting':
      time = zmanim.sunsetOffset(location === 'Jerusalem' ? -40 : -18, true) // 18 minutes before sunset
      break
    case 'tzeit':
      time = zmanim.tzeit() // Nightfall
      break
    // Add other time types as needed (e.g., sunset, alos, etc.)
    default:
      throw new Error(`Unsupported timeType: ${timeType}`)
  }

  // Convert the time to a 12-hour format
  const formattedTime = new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timezone
  })

  return formattedTime
}
