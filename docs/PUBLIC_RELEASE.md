# Public release foundation — 0.2

## What changes for visitors

Road detail uses MapLibre GL JS and OpenFreeMap vector data. Road lines, names and mapped building outlines remain sharp when enlarged. Available features depend on OpenStreetMap coverage. This does not improve satellite photography or add unmapped buildings.

Satellite remains a separate Cesium view. Its existing tile-availability notice and lower-zoom recovery remain available. Switching views preserves the approximate location and scale; satellite height and street zoom use an approximate conversion.

Share view creates a link containing the map centre, zoom, layer and location name. The user sees the link before copying it. Shared coordinates are public to recipients. Search and device location work in both views. The mobile information panel is shorter and collapsible. The site provides privacy and map-data information and a public contributor link.

## Reliability and international search

Search retains selectable alternatives with regional context. Photon uses the browser's preferred language by omitting a forced English parameter; the fallback uses the browser language code. This is not a translation of the interface. Timeout, fallback and stale-response handling remain in place.

Provider URLs are configured in `dist/config.js`. They are public client configuration, not a place for secret API keys. The current services are public endpoints without a production uptime contract. Before substantial commercial traffic, review provider usage terms and arrange a dedicated service or self-hosting. Include actual usage and cost monitoring at that point.

## Contributor checks

`npm ci` installs pinned development tools. `npm run format` formats the code. `npm run check` checks formatting, runs ESLint and executes the Node regression tests. GitHub Actions runs the same checks on pull requests. Fork workflows use read-only repository permissions and no secrets.

## Release boundaries

This release does not add accounts, routing, live traffic, Street View, a translation system, or higher-resolution satellite photography. The automated tests verify coordinate handling, search behaviour, layer-switch races and map-view sharing; they do not prove the visual quality or coverage of external map services.

## Public contribution and main protection

Anyone can fork the public repository, work on a branch and submit a pull request. This does not give visitors direct write access. Repository protection must require a PR for `main`, prevent force pushes and branch deletion, and apply without administrator bypass. Require one independent approval and resolve review conversations. The `quality` status check should be required once the workflow has run and is selectable in GitHub.

A maintainer cannot approve their own pull request. An additional eligible reviewer is needed for maintainer-authored changes when approval is required. Never weaken branch protection to merge a release. The initial release PR stays open until it satisfies the configured requirements.

## Hosting

The public GitHub repository and Sites source repository are separate. GitHub PR checks do not automatically deploy the Site. Publish only a reviewed commit after merge and record its commit in release notes. The current Site remains live until the approved replacement is published.
