# Terra — Earth Explorer

Explore places, inspect satellite imagery and share a map view. Built with plain JavaScript, CesiumJS and MapLibre GL JS.

[Public website](https://terra-earth-explorer.biswajitnayak2402.chatgpt.site) · [Contributing](CONTRIBUTING.md) · [Release details](docs/PUBLIC_RELEASE.md)

## Features

- Vector Road detail with crisp roads, names and mapped building outlines
- Satellite globe, 2D/3D switching and imagery-availability feedback
- Place, address and coordinate search with alternatives and regional context
- Optional device location and selectable map points
- Share links that restore location, zoom and layer
- Responsive controls, privacy information and source attribution

The live Site and an unmerged release branch can differ. See the release PR and hosting notes before assuming a feature is live.

## Local development

Use Node.js 22 and Python 3:

```sh
npm ci
npm start
```

Open http://localhost:8080. Internet and WebGL are required. HTTPS is required for device location outside localhost.

```sh
npm run format
npm run check
```

For viewing without development tools, run `python3 -m http.server 8080 --directory dist`.

## Source layout

| File                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `dist/index.html`    | App structure and accessible controls             |
| `dist/style.css`     | Desktop and mobile styling                        |
| `dist/app.js`        | Search, map switching and interface coordination  |
| `dist/street.js`     | MapLibre vector map adapter                       |
| `dist/view-state.js` | Shared-view parsing, validation and serialization |
| `dist/clarity.js`    | Satellite tile-availability checks                |
| `dist/config.js`     | Public provider endpoints                         |
| `tests/`             | Regression tests                                  |

`dist` is editable static source, not generated output. Any static host can serve it. Prettier and ESLint are development dependencies only.

## Coverage and services

Road data comes from OpenFreeMap / OpenStreetMap and is rendered by MapLibre. Satellite imagery comes from Esri and is rendered by Cesium. Search uses Photon with Open-Meteo / GeoNames fallback. Libraries and fonts are loaded from third-party CDNs.

Vector maps stay sharp when zooming, but do not create missing roads or buildings. Satellite imagery has region-dependent resolution. Tile availability is checked at the view centre and is not a guarantee of photographic sharpness. No terrain elevation, live traffic, navigation directions, Street View or Google Earth imagery is included.

Provider endpoints have their own policies, usage limits and availability. Before high-volume or commercial operation, review them and configure an appropriate provider. Preserve all attribution. The MIT license applies to this project's code, not third-party imagery or services.

## Privacy

Queries are sent to search providers. Map providers receive requests for viewed areas. Device location is used only after an explicit action and browser permission. Shared URLs include map coordinates. Terra has no application accounts, analytics or server-side location history.

## Contributions

Everyone can fork the repository and propose a pull request. Changes to `main` must follow the configured GitHub protection and review rules. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Map data and dependencies retain their respective licenses.
