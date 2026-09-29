# Terra — Earth Explorer

An open-source, full-screen Earth explorer built with HTML, CSS, JavaScript and CesiumJS. Explore satellite imagery, find cities, inspect coordinates and discover featured destinations.

## Features

- Interactive 3D globe and 2D map
- Satellite imagery and OpenStreetMap layers
- Place and address search with automatic map navigation and selectable alternatives
- Search by `latitude, longitude` and click-to-inspect coordinates
- Featured destinations and place details
- Zoom, reset north, whole-Earth view and optional device location
- Responsive desktop and mobile interface

## Run locally

No package installation or API key is required for the current implementation. You need Python 3, an internet connection and a browser with WebGL enabled.

```sh
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. Serve the site over HTTPS when deploying; browser geolocation requires a secure context (localhost also works).

## Project files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Explorer structure and external Cesium loader |
| `dist/style.css` | Responsive layout and visual styling |
| `dist/app.js` | Globe, imagery, search and place interactions |

`dist` contains the editable source files, not generated build output. There is no build step. Any static host can serve this directory.

## Validation

```sh
node --check dist/app.js
```

Before submitting changes, check globe loading, city search, coordinate validation, both map layers, zoom, 2D/3D switching and the mobile panel. Test failed network requests and denied geolocation when relevant. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Data and dependencies

- CesiumJS 1.121 is loaded from the Cesium CDN.
- Satellite tiles are served by Esri World Imagery.
- Street tiles are served by OpenStreetMap.
- Place and address search uses Photon / OpenStreetMap, with Open-Meteo / GeoNames as a fallback. The public Photon demo service is suitable for moderate usage; high-traffic deployments should use a dedicated geocoder.
- Place descriptions are curated; Wikipedia links provide further reading.
- Fonts are loaded from Google Fonts.

Map imagery, fonts and other third-party materials retain their own licenses and terms. Keep provider attribution visible. Review provider usage policies before running a high-traffic deployment; the code license does not grant rights to third-party services or imagery.

This project uses an ellipsoid globe. It does not include terrain elevation, photorealistic 3D buildings, Google Earth data or Street View. Imagery is not live and its date and resolution vary. External services may be unavailable or rate-limited.

## Privacy

Search queries are sent to Photon when submitted, and to Open-Meteo if Photon returns no results or fails. Map providers receive tile requests as you explore. Device location is requested only when the location button is pressed. The current implementation has no application backend or analytics.

## Contribute

Bug reports, documentation improvements, accessibility fixes and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.
