/**
 * Calculate distance between two points on Earth using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

/**
 * Check if a location is within a certain distance from a reference point
 * @param {Object} point - The point to check { latitude, longitude }
 * @param {Object} reference - The reference point { latitude, longitude }
 * @param {number} maxDistance - Maximum allowed distance in meters
 * @returns {Object} { isWithinRange: boolean, distance: number }
 */
const isWithinRange = (point, reference, maxDistance) => {
  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    reference.latitude,
    reference.longitude
  );
  
  return {
    isWithinRange: distance <= maxDistance,
    distance: distance
  };
};

module.exports = {
  calculateDistance,
  isWithinRange
};
