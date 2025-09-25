module.exports = {
  // Default institution location (New Delhi coordinates as example)
  location: {
    type: 'Point',
    coordinates: [77.2090, 28.6139], // [longitude, latitude]
    address: 'Institution Main Campus',
    maxDistance: 500, // in meters
    name: 'Your Institution Name',
    timezone: 'Asia/Kolkata'
  },
  
  // Academic settings
  academic: {
    defaultDepartment: 'Computer Science',
    // Add more academic settings as needed
  },
  
  // Feature toggles
  features: {
    locationVerification: true,
    // Add more feature toggles as needed
  }
};
