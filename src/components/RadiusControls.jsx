import { AVAILABLE_RADIUS_KM } from "../lib/zones";

export default function RadiusControls({ selectedRadii, onToggleRadius, onSelectAll }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Radius Rings</p>
          <h2>Origin-centered ranges</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onSelectAll}>
          Use all rings
        </button>
      </div>

      <div className="radius-grid">
        {AVAILABLE_RADIUS_KM.map((radius) => {
          const active = selectedRadii.includes(radius);

          return (
            <button
              key={radius}
              type="button"
              className={`radius-chip ${active ? "is-active" : ""}`}
              onClick={() => onToggleRadius(radius)}
            >
              {radius} km
            </button>
          );
        })}
      </div>

      <p className="section-note">
        The origin point stays at the center and each ring shows a straight-line radius.
      </p>
    </section>
  );
}
