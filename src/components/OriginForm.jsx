const numberFields = [
  { key: "latitude", label: "Latitude", step: "0.0001" },
  { key: "longitude", label: "Longitude", step: "0.0001" }
];

export default function OriginForm({
  title,
  point,
  resetLabel,
  helperText,
  status,
  onChange,
  onReset,
  onResolve
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Origin Control</p>
          <h2>{title}</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onReset}>
          {resetLabel}
        </button>
      </div>

      <div className="origin-grid">
        <label className="field">
          <span>Place / sub-locality / street</span>
          <input
            type="text"
            value={point.name}
            onChange={(event) => onChange("name", event.target.value)}
            onBlur={onResolve}
            placeholder={helperText}
          />
        </label>

        <button
          type="button"
          className="ghost-button secondary-button"
          onClick={onResolve}
          disabled={status.loading}
        >
          {status.loading ? "Identifying..." : "Auto identify coordinates"}
        </button>

        {status.displayName ? (
          <p className="resolved-text">Matched: {status.displayName}</p>
        ) : null}

        {status.error ? <p className="inline-error">{status.error}</p> : null}

        {numberFields.map((field) => (
          <label className="field" key={field.key}>
            <span>{field.label}</span>
            <input
              type="number"
              step={field.step}
              value={point[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
