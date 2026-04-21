import { formatDistanceKm } from "../lib/distance";

function formatDuration(durationMin) {
  if (durationMin == null || Number.isNaN(durationMin)) {
    return "--";
  }

  if (durationMin >= 60) {
    const hours = Math.floor(durationMin / 60);
    const minutes = Math.round(durationMin % 60);
    return `${hours} hr ${minutes} min`;
  }

  return `${Math.round(durationMin)} min`;
}

export default function DirectionsPanel({
  origin,
  destination,
  routeState,
  straightLineKm
}) {
  const hasRoute = Boolean(routeState.data);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Road Route</p>
          <h2>
            {origin.name} to {destination.name}
          </h2>
        </div>
        {routeState.loading ? <p className="map-caption">Calculating route...</p> : null}
      </div>

      {routeState.error ? <p className="inline-error">{routeState.error}</p> : null}

      <div className="route-summary-grid">
        <article className="summary-card">
          <p className="eyebrow">Road Distance</p>
          <strong>{hasRoute ? formatDistanceKm(routeState.data.distanceKm) : "--"}</strong>
          <span>Turn-by-turn route distance along roads.</span>
        </article>
        <article className="summary-card">
          <p className="eyebrow">Drive Time</p>
          <strong>{hasRoute ? formatDuration(routeState.data.durationMin) : "--"}</strong>
          <span>Estimated drive time from the routing engine.</span>
        </article>
        <article className="summary-card">
          <p className="eyebrow">Straight Line</p>
          <strong>
            {straightLineKm != null && !Number.isNaN(straightLineKm)
              ? formatDistanceKm(straightLineKm)
              : "--"}
          </strong>
          <span>Direct haversine distance between A and B.</span>
        </article>
      </div>

      <div className="directions-shell">
        <div className="directions-header">
          <p className="eyebrow">Directions</p>
          <span>{hasRoute ? `${routeState.data.steps.length} steps` : "Waiting for route"}</span>
        </div>

        {hasRoute ? (
          <ol className="directions-list">
            {routeState.data.steps.map((step, index) => (
              <li key={step.id} className="direction-item">
                <span className="direction-index">{index + 1}</span>
                <div>
                  <p>{step.instruction}</p>
                  <small>{step.distanceLabel}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="section-note">
            Enter point B at sub-locality or street level to get exact road directions and km.
          </p>
        )}
      </div>
    </section>
  );
}
