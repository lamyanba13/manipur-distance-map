function formatStepDistance(distanceMeters) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function pickBestRoute(routes) {
  return [...routes].sort((left, right) => {
    if (left.duration !== right.duration) {
      return left.duration - right.duration;
    }

    return left.distance - right.distance;
  })[0];
}

function roadName(name) {
  return name && name.trim() ? name : "the road ahead";
}

function toSentenceCase(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildStepInstruction(step) {
  const maneuverType = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier ? toSentenceCase(step.maneuver.modifier) : "";
  const name = roadName(step.name);

  switch (maneuverType) {
    case "depart":
      return `Start on ${name}.`;
    case "arrive":
      return "Arrive at point B.";
    case "turn":
      return `${modifier || "Turn"} onto ${name}.`;
    case "new name":
      return `Continue onto ${name}.`;
    case "merge":
      return `${modifier || "Merge"} onto ${name}.`;
    case "on ramp":
      return `Take the ramp to ${name}.`;
    case "off ramp":
      return `Take the exit toward ${name}.`;
    case "fork":
      return `Keep ${modifier ? modifier.toLowerCase() : "ahead"} toward ${name}.`;
    case "roundabout":
    case "rotary":
      return `Enter the roundabout and continue toward ${name}.`;
    case "end of road":
      return `${modifier || "Turn"} at the end of the road onto ${name}.`;
    case "notification":
      return `Proceed on ${name}.`;
    default:
      return `Continue on ${name}.`;
  }
}

export async function getRoadRoute(from, to) {
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const searchParams = new URLSearchParams({
    alternatives: "3",
    overview: "full",
    geometries: "geojson",
    steps: "true"
  });

  let response;

  try {
    // Future provider hook:
    // replace OSRM with your preferred routing provider and keep the
    // returned object shape stable for the rest of the app.
    response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?${searchParams.toString()}`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );
  } catch {
    throw new Error("Road routing is temporarily unavailable. Try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("Unable to calculate the road route right now.");
  }

  const payload = await response.json();

  if (payload.code !== "Ok" || !payload.routes?.length) {
    throw new Error("No drivable road route was found between A and B.");
  }

  const route = pickBestRoute(payload.routes);
  const routeSteps = route.legs.flatMap((leg) => leg.steps ?? []);

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    alternativeCount: payload.routes.length,
    geometry: route.geometry.coordinates.map(([longitude, latitude]) => [
      latitude,
      longitude
    ]),
    steps: routeSteps.map((step, index) => ({
      id: `${index}-${step.name}-${step.distance}`,
      instruction: buildStepInstruction(step),
      roadName: roadName(step.name),
      distanceLabel: formatStepDistance(step.distance),
      distanceMeters: step.distance
    }))
  };
}
