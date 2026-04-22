import { Fragment, useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Pane,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents
} from "react-leaflet";
import { formatDistanceKm } from "../lib/distance";
import { AVAILABLE_RADIUS_KM } from "../lib/zones";
import "leaflet/dist/leaflet.css";

function MapPointPicker({ enabled, onPick }) {
  useMapEvents({
    click(event) {
      if (!enabled) {
        return;
      }

      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
      });
    }
  });

  return null;
}

export default function DistanceMap({
  origin,
  originDetail,
  destination,
  destinationDetail,
  radii,
  routeGeometry,
  routeDistanceKm,
  isPickingPointA,
  isPickingPointB,
  onTogglePickPointA,
  onTogglePickPointB,
  onPickPointA,
  onPickPointB
}) {
  const originPosition = [origin.latitude, origin.longitude];
  const zoomLevel = radii.includes(50) ? 9 : 10;
  const visibleRadii = radii.length > 0 ? radii : AVAILABLE_RADIUS_KM;
  const panelRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isViewportFullscreen, setIsViewportFullscreen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    function handleFullscreenChange() {
      const nativeFullscreen = document.fullscreenElement === panelRef.current;
      setIsFullscreen(nativeFullscreen || isViewportFullscreen);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isViewportFullscreen]);

  useEffect(() => {
    setIsFullscreen(Boolean(document.fullscreenElement === panelRef.current || isViewportFullscreen));

    if (isViewportFullscreen) {
      document.body.classList.add("map-viewport-fullscreen-active");
      return () => {
        document.body.classList.remove("map-viewport-fullscreen-active");
      };
    }

    document.body.classList.remove("map-viewport-fullscreen-active");
    return undefined;
  }, [isViewportFullscreen]);

  async function handleFullscreenToggle() {
    if (!panelRef.current) {
      return;
    }

    const nativeRequestFullscreen = panelRef.current.requestFullscreen?.bind(panelRef.current);

    if (document.fullscreenElement === panelRef.current) {
      await document.exitFullscreen();
      return;
    }

    if (isViewportFullscreen) {
      setIsViewportFullscreen(false);
      return;
    }

    if (nativeRequestFullscreen) {
      try {
        await nativeRequestFullscreen();
        return;
      } catch {
        // Fall back to CSS-based full-viewport mode on mobile browsers.
      }
    }

    setIsViewportFullscreen(true);
  }

  function handleRefreshMap() {
    setRefreshTick((current) => current + 1);
  }

  function createRadiusLabelIcon(rangeKm) {
    return L.divIcon({
      className: "radius-label-icon",
      html: `<span class="radius-label-chip">${rangeKm} km</span>`,
      iconSize: [70, 24],
      iconAnchor: [35, 12]
    });
  }

  function getRadiusLabelPosition(rangeKm) {
    const latOffset = rangeKm / 111;
    return [origin.latitude + latOffset, origin.longitude];
  }

  function getRouteLabelPosition() {
    if (!routeGeometry?.length) {
      return null;
    }

    return routeGeometry[Math.floor(routeGeometry.length / 2)];
  }

  function createRouteLabelIcon(distanceKm) {
    return L.divIcon({
      className: "route-label-icon",
      html: `<span class="route-label-chip">${formatDistanceKm(distanceKm)}</span>`,
      iconSize: [92, 28],
      iconAnchor: [46, 14]
    });
  }

  const routeLabelPosition = getRouteLabelPosition();

  function getPickPointALabel() {
    return isPickingPointA ? "Cancel point A pick" : "Pick point A on map";
  }

  function getPickPointBLabel() {
    return isPickingPointB ? "Cancel point B pick" : "Pick point B on map";
  }

  function getFullscreenLabel() {
    return isFullscreen ? "Exit full screen" : "Full screen";
  }

  function getLocalStreetLabel(detail) {
    if (!detail) {
      return "";
    }

    const parts = detail
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.slice(0, 2).join(" • ");
  }

  const originStreetLabel = getLocalStreetLabel(originDetail);
  const destinationStreetLabel = getLocalStreetLabel(destinationDetail);

  return (
    <section
      ref={panelRef}
      className={`panel map-panel ${isFullscreen ? "map-panel-fullscreen" : ""} ${isViewportFullscreen ? "map-panel-viewport-fullscreen" : ""}`}
    >
      <div className={`panel-header ${isFullscreen ? "map-panel-header-compact" : ""}`}>
        <div className="map-heading map-header-box">
          <p className="eyebrow">Distance Map</p>
          <h2>Manipur range view</h2>
        </div>
        <div className="map-controls-box">
          <p className="map-caption map-caption-compact">
            Straight-line distance from <strong>{origin.name}</strong>
          </p>
          <div className="map-actions">
            <button
              type="button"
              className="ghost-button map-icon-button"
              onClick={onTogglePickPointA}
              aria-label={getPickPointALabel()}
              title={getPickPointALabel()}
            >
              <span className="button-icon-label">A</span>
              <span className="button-text">{getPickPointALabel()}</span>
            </button>
            <button
              type="button"
              className="ghost-button map-icon-button"
              onClick={onTogglePickPointB}
              aria-label={getPickPointBLabel()}
              title={getPickPointBLabel()}
            >
              <span className="button-icon-label">B</span>
              <span className="button-text">{getPickPointBLabel()}</span>
            </button>
            <button
              type="button"
              className="ghost-button map-icon-button"
              onClick={handleRefreshMap}
              aria-label="Refresh map"
              title="Refresh map"
            >
              <span className="button-icon-label">R</span>
              <span className="button-text">Refresh map</span>
            </button>
            <button
              type="button"
              className="ghost-button map-icon-button"
              onClick={handleFullscreenToggle}
              aria-label={getFullscreenLabel()}
              title={getFullscreenLabel()}
            >
              <span className="button-icon-label">{isFullscreen ? "X" : "F"}</span>
              <span className="button-text">{getFullscreenLabel()}</span>
            </button>
          </div>
        </div>
      </div>

      <MapContainer
        key={`${origin.latitude}-${origin.longitude}-${visibleRadii.join("-")}-${refreshTick}`}
        center={originPosition}
        zoom={zoomLevel}
        scrollWheelZoom
        doubleClickZoom={!isPickingPointA && !isPickingPointB}
        className="map-shell"
      >
        <MapPointPicker enabled={isPickingPointA} onPick={onPickPointA} />
        <MapPointPicker enabled={isPickingPointB} onPick={onPickPointB} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Pane name="range-circles" style={{ zIndex: 350 }} />
        <Pane name="radius-labels" style={{ zIndex: 425 }} />
        <Pane name="route-line" style={{ zIndex: 430 }} />
        <Pane name="route-label" style={{ zIndex: 440 }} />
        <Pane name="origin-marker" style={{ zIndex: 450 }} />
        <Pane name="destination-marker" style={{ zIndex: 460 }} />

        {visibleRadii.map((rangeKm) => (
          <Fragment key={rangeKm}>
            <Circle
              center={originPosition}
              radius={rangeKm * 1000}
              pathOptions={{
                pane: "range-circles",
                color: "#222222",
                weight: 1,
                fillColor: "#111111",
                fillOpacity: 0.025
              }}
            />
            <Marker
              position={getRadiusLabelPosition(rangeKm)}
              icon={createRadiusLabelIcon(rangeKm)}
              pane="radius-labels"
            />
          </Fragment>
        ))}

        <CircleMarker
          center={originPosition}
          radius={9}
          pathOptions={{
            pane: "origin-marker",
            color: "#ffffff",
            weight: 2,
            fillColor: "#111111",
            fillOpacity: 1
          }}
        >
          <Tooltip direction="top" permanent offset={[0, -10]}>
            <div className="map-tooltip-stack">
              <strong>{origin.name} (Origin A)</strong>
              {originStreetLabel ? <span>{originStreetLabel}</span> : null}
            </div>
          </Tooltip>
        </CircleMarker>

        {routeGeometry?.length ? (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              pane: "route-line",
              color: "#1f6fff",
              weight: 4,
              opacity: 0.72,
              lineCap: "round",
              lineJoin: "round"
            }}
          />
        ) : null}

        {routeLabelPosition && routeDistanceKm ? (
          <Marker
            position={routeLabelPosition}
            icon={createRouteLabelIcon(routeDistanceKm)}
            pane="route-label"
          />
        ) : null}

        {destination ? (
          <CircleMarker
            center={[destination.latitude, destination.longitude]}
            radius={8}
            pathOptions={{
              pane: "destination-marker",
              color: "#111111",
              weight: 2,
              fillColor: "#d9d9d9",
              fillOpacity: 1
            }}
          >
            <Tooltip direction="top" permanent offset={[0, -10]}>
              <div className="map-tooltip-stack">
                <strong>{destination.name} (Point B)</strong>
                {destinationStreetLabel ? <span>{destinationStreetLabel}</span> : null}
              </div>
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </section>
  );
}
