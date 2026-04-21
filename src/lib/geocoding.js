const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

function buildGeocodingQuery(query) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new Error("Enter a place name, sub-locality, or street first.");
  }

  return `${normalizedQuery}, Manipur, India`;
}

export async function geocodePlace(query) {
  const searchParams = new URLSearchParams({
    q: buildGeocodingQuery(query),
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "in"
  });

  let response;

  try {
    // Future provider hook:
    // swap this fetch with Google, Mapbox, HERE, or another geocoder
    // without changing the UI contract returned from this function.
    response = await fetch(`${NOMINATIM_BASE_URL}?${searchParams.toString()}`, {
      headers: {
        Accept: "application/json"
      }
    });
  } catch {
    throw new Error("Location lookup is unavailable right now. Try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("Unable to identify that place right now.");
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("No matching place was found in Manipur.");
  }

  const bestMatch = results[0];

  return {
    latitude: Number(bestMatch.lat),
    longitude: Number(bestMatch.lon),
    displayName: bestMatch.display_name,
    raw: bestMatch
  };
}

export async function reverseGeocodePlace(latitude, longitude) {
  const searchParams = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    addressdetails: "1"
  });

  let response;

  try {
    response = await fetch(`${NOMINATIM_REVERSE_URL}?${searchParams.toString()}`, {
      headers: {
        Accept: "application/json"
      }
    });
  } catch {
    throw new Error("Reverse lookup is unavailable right now. Try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("Unable to identify the clicked point right now.");
  }

  const result = await response.json();

  if (!result?.lat || !result?.lon) {
    throw new Error("No named place was found for the clicked point.");
  }

  const shortName =
    result.address?.road ||
    result.address?.suburb ||
    result.address?.village ||
    result.address?.town ||
    result.address?.city ||
    result.name ||
    "Picked point B";

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    name: shortName,
    displayName: result.display_name,
    raw: result
  };
}
