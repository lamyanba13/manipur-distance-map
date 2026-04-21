import { useEffect, useMemo, useRef, useState } from "react";
import DistanceMap from "./components/DistanceMap";
import DirectionsPanel from "./components/DirectionsPanel";
import OriginForm from "./components/OriginForm";
import RadiusControls from "./components/RadiusControls";
import { formatDistanceKm, haversineDistanceKm } from "./lib/distance";
import { geocodePlace, reverseGeocodePlace } from "./lib/geocoding";
import { getRoadRoute } from "./lib/routing";
import { AVAILABLE_RADIUS_KM } from "./lib/zones";

const DEFAULT_POINT_A = {
  name: "Imphal",
  latitude: 24.817,
  longitude: 93.9368,
  lastResolvedQuery: "Imphal"
};

const DEFAULT_POINT_B = {
  name: "Kangla, Imphal",
  latitude: 24.8078,
  longitude: 93.9429,
  lastResolvedQuery: "Kangla, Imphal"
};

function normalizePoint(point) {
  return {
    name: point.name || "Unnamed point",
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    lastResolvedQuery: point.lastResolvedQuery ?? ""
  };
}

function isValidPoint(point) {
  return (
    point.name.trim().length > 0 &&
    point.lastResolvedQuery === point.name.trim() &&
    !Number.isNaN(point.latitude) &&
    !Number.isNaN(point.longitude)
  );
}

export default function App() {
  const [pointAForm, setPointAForm] = useState(DEFAULT_POINT_A);
  const [pointBForm, setPointBForm] = useState(DEFAULT_POINT_B);
  const [selectedRadii, setSelectedRadii] = useState(AVAILABLE_RADIUS_KM);
  const [resolveState, setResolveState] = useState({
    pointA: { loading: false, error: "", displayName: "Imphal, Manipur, India" },
    pointB: { loading: false, error: "", displayName: "Kangla, Imphal, Manipur, India" }
  });
  const [routeState, setRouteState] = useState({
    loading: false,
    error: "",
    data: null
  });
  const [isPickingPointA, setIsPickingPointA] = useState(false);
  const [isPickingPointB, setIsPickingPointB] = useState(false);
  const resolveRequestIds = useRef({
    pointA: 0,
    pointB: 0
  });

  const pointA = useMemo(() => normalizePoint(pointAForm), [pointAForm]);
  const pointB = useMemo(() => normalizePoint(pointBForm), [pointBForm]);
  const isPointAValid = isValidPoint(pointA);
  const isPointBValid = isValidPoint(pointB);
  const safePointA = isPointAValid ? pointA : normalizePoint(DEFAULT_POINT_A);
  const safePointB = isPointBValid ? pointB : null;
  const straightLineKm =
    isPointAValid && isPointBValid ? haversineDistanceKm(pointA, pointB) : null;

  const activeRadiiSummary = useMemo(
    () => selectedRadii.map((radius) => formatDistanceKm(radius)).join(", "),
    [selectedRadii]
  );

  useEffect(() => {
    let ignore = false;

    async function loadRoute() {
      if (!isPointAValid || !isPointBValid) {
        setRouteState({
          loading: false,
          error: "",
          data: null
        });
        return;
      }

      setRouteState((current) => ({
        ...current,
        loading: true,
        error: ""
      }));

      try {
        const routeData = await getRoadRoute(pointA, pointB);

        if (!ignore) {
          setRouteState({
            loading: false,
            error: "",
            data: routeData
          });
        }
      } catch (error) {
        if (!ignore) {
          setRouteState({
            loading: false,
            error: error.message,
            data: null
          });
        }
      }
    }

    loadRoute();

    return () => {
      ignore = true;
    };
  }, [
    isPointAValid,
    isPointBValid,
    pointA.latitude,
    pointA.longitude,
    pointA.name,
    pointB.latitude,
    pointB.longitude,
    pointB.name
  ]);

  function handlePointChange(pointKey, field, value) {
    const setter = pointKey === "pointA" ? setPointAForm : setPointBForm;

    setter((current) => ({
      ...current,
      [field]: field === "name" ? value : value === "" ? "" : Number(value),
      ...(field === "name"
        ? {
            latitude: "",
            longitude: "",
            lastResolvedQuery: ""
          }
        : { lastResolvedQuery: current.name.trim() })
    }));

    if (field === "name") {
      resolveRequestIds.current[pointKey] += 1;
      setResolveState((current) => ({
        ...current,
        [pointKey]: {
          ...current[pointKey],
          error: "",
          displayName: ""
        }
      }));
      setRouteState({
        loading: false,
        error: "",
        data: null
      });
    }
  }

  function handleResetPoint(pointKey) {
    if (pointKey === "pointA") {
      setPointAForm(DEFAULT_POINT_A);
      setResolveState((current) => ({
        ...current,
        pointA: {
          loading: false,
          error: "",
          displayName: "Imphal, Manipur, India"
        }
      }));
      return;
    }

    setPointBForm(DEFAULT_POINT_B);
    setResolveState((current) => ({
      ...current,
      pointB: {
        loading: false,
        error: "",
        displayName: "Kangla, Imphal, Manipur, India"
      }
    }));
  }

  function handleToggleRadius(radius) {
    setSelectedRadii((current) => {
      if (current.includes(radius)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== radius);
      }

      return [...current, radius].sort((left, right) => left - right);
    });
  }

  function handleSelectAllRings() {
    setSelectedRadii(AVAILABLE_RADIUS_KM);
  }

  function handleTogglePickPointB() {
    setIsPickingPointB((current) => {
      const next = !current;

      if (next) {
        setIsPickingPointA(false);
      }

      return next;
    });
  }

  function handleTogglePickPointA() {
    setIsPickingPointA((current) => {
      const next = !current;

      if (next) {
        setIsPickingPointB(false);
      }

      return next;
    });
  }

  async function handleResolvePoint(pointKey) {
    const pointForm = pointKey === "pointA" ? pointAForm : pointBForm;
    const setter = pointKey === "pointA" ? setPointAForm : setPointBForm;
    const query = pointForm.name.trim();

    if (!query) {
      setResolveState((current) => ({
        ...current,
        [pointKey]: {
          ...current[pointKey],
          loading: false,
          error: "Enter a place name first.",
          displayName: ""
        }
      }));
      return;
    }

    if (pointForm.lastResolvedQuery === query) {
      return;
    }

    const requestId = resolveRequestIds.current[pointKey] + 1;
    resolveRequestIds.current[pointKey] = requestId;

    setResolveState((current) => ({
      ...current,
      [pointKey]: {
        ...current[pointKey],
        loading: true,
        error: "",
        displayName: ""
      }
    }));

    try {
      const match = await geocodePlace(query);

      if (resolveRequestIds.current[pointKey] !== requestId) {
        return;
      }

      setter((current) => ({
        ...current,
        latitude: match.latitude,
        longitude: match.longitude,
        lastResolvedQuery: query
      }));

      setResolveState((current) => ({
        ...current,
        [pointKey]: {
          loading: false,
          error: "",
          displayName: match.displayName
        }
      }));
    } catch (error) {
      if (resolveRequestIds.current[pointKey] !== requestId) {
        return;
      }

      setResolveState((current) => ({
        ...current,
        [pointKey]: {
          ...current[pointKey],
          loading: false,
          error: error.message,
          displayName: ""
        }
      }));
    }
  }

  async function handlePickPointB(coordinates) {
    const requestId = resolveRequestIds.current.pointB + 1;
    resolveRequestIds.current.pointB = requestId;
    setIsPickingPointB(false);
    setRouteState({
      loading: false,
      error: "",
      data: null
    });
    setResolveState((current) => ({
      ...current,
      pointB: {
        ...current.pointB,
        loading: true,
        error: "",
        displayName: ""
      }
    }));

    try {
      const match = await reverseGeocodePlace(coordinates.latitude, coordinates.longitude);

      if (resolveRequestIds.current.pointB !== requestId) {
        return;
      }

      setPointBForm({
        name: match.name,
        latitude: match.latitude,
        longitude: match.longitude,
        lastResolvedQuery: match.name
      });
      setResolveState((current) => ({
        ...current,
        pointB: {
          loading: false,
          error: "",
          displayName: match.displayName
        }
      }));
    } catch (error) {
      if (resolveRequestIds.current.pointB !== requestId) {
        return;
      }

      const fallbackName = `Picked point B (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`;
      setPointBForm({
        name: fallbackName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        lastResolvedQuery: fallbackName
      });
      setResolveState((current) => ({
        ...current,
        pointB: {
          loading: false,
          error: error.message,
          displayName: ""
        }
      }));
    }
  }

  async function handlePickPointA(coordinates) {
    const requestId = resolveRequestIds.current.pointA + 1;
    resolveRequestIds.current.pointA = requestId;
    setIsPickingPointA(false);
    setRouteState({
      loading: false,
      error: "",
      data: null
    });
    setResolveState((current) => ({
      ...current,
      pointA: {
        ...current.pointA,
        loading: true,
        error: "",
        displayName: ""
      }
    }));

    try {
      const match = await reverseGeocodePlace(coordinates.latitude, coordinates.longitude);

      if (resolveRequestIds.current.pointA !== requestId) {
        return;
      }

      setPointAForm({
        name: match.name,
        latitude: match.latitude,
        longitude: match.longitude,
        lastResolvedQuery: match.name
      });
      setResolveState((current) => ({
        ...current,
        pointA: {
          loading: false,
          error: "",
          displayName: match.displayName
        }
      }));
    } catch (error) {
      if (resolveRequestIds.current.pointA !== requestId) {
        return;
      }

      const fallbackName = `Picked point A (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`;
      setPointAForm({
        name: fallbackName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        lastResolvedQuery: fallbackName
      });
      setResolveState((current) => ({
        ...current,
        pointA: {
          loading: false,
          error: error.message,
          displayName: ""
        }
      }));
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">React + Leaflet</p>
          <h1>Manipur Distance-from-Origin Map</h1>
        </div>
        <p className="hero-copy">
          Set point A by name and let the app identify coordinates automatically, then
          add point B down to sub-locality or street level for exact road directions
          and route km while keeping the radius rings centered on A.
        </p>
      </header>

      <main className="content-grid">
        <section className="control-stack">
          <OriginForm
            title="Set point A"
            point={pointAForm}
            resetLabel="Reset point A"
            helperText="Imphal, Lamphelpat, street name..."
            status={resolveState.pointA}
            onChange={(field, value) => handlePointChange("pointA", field, value)}
            onReset={() => handleResetPoint("pointA")}
            onResolve={() => handleResolvePoint("pointA")}
          />
          <OriginForm
            title="Set point B"
            point={pointBForm}
            resetLabel="Reset point B"
            helperText="Sub locality or street-level destination"
            status={resolveState.pointB}
            onChange={(field, value) => handlePointChange("pointB", field, value)}
            onReset={() => handleResetPoint("pointB")}
            onResolve={() => handleResolvePoint("pointB")}
          />
          <RadiusControls
            selectedRadii={selectedRadii}
            onToggleRadius={handleToggleRadius}
            onSelectAll={handleSelectAllRings}
          />
          {isPointAValid ? (
            <section className="panel status-panel">
              <p className="eyebrow">Current View</p>
              <h2>{activeRadiiSummary} around {safePointA.name}.</h2>
            </section>
          ) : (
            <section className="panel status-panel">
              <p className="eyebrow">Input Check</p>
              <h2>Enter a valid origin name, latitude, and longitude.</h2>
            </section>
          )}
        </section>

        <section className="visual-stack">
          <DistanceMap
            origin={safePointA}
            destination={safePointB}
            radii={selectedRadii}
            routeGeometry={routeState.data?.geometry ?? []}
            routeDistanceKm={routeState.data?.distanceKm ?? null}
            isPickingPointA={isPickingPointA}
            isPickingPointB={isPickingPointB}
            onTogglePickPointA={handleTogglePickPointA}
            onTogglePickPointB={handleTogglePickPointB}
            onPickPointA={handlePickPointA}
            onPickPointB={handlePickPointB}
          />
          <DirectionsPanel
            origin={safePointA}
            destination={safePointB ?? { name: "Point B" }}
            routeState={routeState}
            straightLineKm={straightLineKm}
          />
        </section>
      </main>
    </div>
  );
}
