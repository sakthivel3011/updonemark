/**
 * GPS Location Service for Attendance
 * Handles geolocation, distance calculation, and location-based attendance
 */

// Earth's radius in meters
const EARTH_RADIUS = 6371000;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get current GPS position
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable GPS and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
}

/**
 * Check if user is within event radius
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {number} eventLat - Event latitude
 * @param {number} eventLng - Event longitude
 * @param {number} radius - Radius in meters
 * @returns {{isInside: boolean, distance: number}}
 */
export function checkLocation(userLat, userLng, eventLat, eventLng, radius) {
  const distance = calculateDistance(userLat, userLng, eventLat, eventLng);
  return {
    isInside: distance <= radius,
    distance: Math.round(distance)
  };
}

/**
 * Request GPS permission and get location
 * Shows a nice UI dialog before requesting
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export async function requestLocation() {
  // First check if permission is already granted
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        throw new Error('Location permission is blocked. Please enable GPS in your browser settings and try again.');
      }
    } catch (err) {
      // Some browsers don't support querying geolocation permission
      console.log('Permission query not supported');
    }
  }
  
  return getCurrentPosition();
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export function formatDistance(meters) {
  if (meters < 10) {
    return `${meters}m`;
  } else if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Get location status text
 * @param {number} distance - Distance in meters
 * @param {number} radius - Allowed radius in meters
 * @returns {string} Status message
 */
export function getLocationStatus(distance, radius) {
  if (distance <= radius) {
    return `You are inside the event area (${formatDistance(distance)} from center)`;
  } else {
    const outsideBy = distance - radius;
    return `You are ${formatDistance(outsideBy)} outside the event area`;
  }
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export function isValidCoordinates(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
