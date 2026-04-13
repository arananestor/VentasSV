const shouldRequestPermission = (status) => status === 'undetermined';

const canGetLocation = (status) => status === 'granted';

const buildGeoPayload = (coords) => {
  if (!coords || coords.latitude == null || coords.longitude == null) return null;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
  };
};

module.exports = { shouldRequestPermission, canGetLocation, buildGeoPayload };
