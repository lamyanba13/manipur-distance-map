# Manipur Distance-from-Origin Map

A React + Leaflet app for visualizing origin-centered radius bands across Manipur, with point-to-point road routing.

## Features

- Map centered on point A
- Point A name input with automatic coordinate identification
- Point B name input for sub-locality and street-level routing
- Selectable radius rings up to 50 km
- Full-screen radius map
- Road route distance in km plus estimated duration
- Turn-by-turn road directions between A and B
- Black and white premium UI
- Modular geocoding and routing services for future provider swaps

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Data providers

- Geocoding uses Nominatim search
- Road routing uses OSRM driving directions

Both are wrapped in separate utility files so they can be replaced later without reworking the UI.
