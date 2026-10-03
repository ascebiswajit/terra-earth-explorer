/* Vector geometry stays sharp; completeness depends on OpenStreetMap coverage. */
(function (root) {
  let map,
    marker,
    lastError = false;
  const library = () => root.maplibregl;
  function open(view, hooks) {
    if (!library()) throw new Error("Street map library could not load. Reload and try again.");
    if (!map) {
      map = new (library().Map)({
        container: "streetMap",
        style: root.TERRA_CONFIG.streetStyle,
        center: [view.lon, view.lat],
        zoom: view.zoom,
        minZoom: 1,
        maxZoom: 22,
        attributionControl: true,
      });
      map.addControl(new (library().ScaleControl)({ unit: "metric" }), "bottom-left");
      map.on("dataloading", () => hooks.status("Loading road detail…"));
      map.on("idle", () => {
        if (!lastError) hooks.status("Vector roads · detail depends on local mapping coverage");
      });
      map.on("error", () => {
        lastError = true;
        hooks.status("Some road data could not load. Switch maps or retry.");
      });
      map.on("moveend", () => {
        const c = map.getCenter();
        hooks.move({ lon: c.lng, lat: c.lat, zoom: map.getZoom() });
      });
      map.on("click", (e) => {
        const feature = map.queryRenderedFeatures(e.point).find((f) => f.properties?.name);
        hooks.pick({
          name: feature?.properties?.name || "Pinned location",
          lon: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
      });
    } else {
      lastError = false;
      map.resize();
      map.jumpTo({ center: [view.lon, view.lat], zoom: view.zoom });
    }
    map.resize();
    return map;
  }
  function pin(p) {
    if (!map) return;
    if (marker) marker.remove();
    marker = new (library().Marker)({ color: "#14664f" }).setLngLat([p.lon, p.lat]).addTo(map);
  }
  function fly(p) {
    if (map) {
      map.flyTo({ center: [p.lon, p.lat], zoom: p.zoom ?? 16, duration: 1300 });
      pin(p);
    }
  }
  function current() {
    if (!map) return null;
    const c = map.getCenter();
    return { lat: c.lat, lon: ((((c.lng + 180) % 360) + 360) % 360) - 180, zoom: map.getZoom() };
  }
  function zoom(delta) {
    if (map) map.easeTo({ zoom: Math.max(1, Math.min(22, map.getZoom() + delta)), duration: 250 });
  }
  function north() {
    if (map) map.easeTo({ bearing: 0, pitch: 0 });
  }
  function home() {
    if (map) map.flyTo({ center: [0, 20], zoom: 2 });
  }
  function resize() {
    map?.resize();
  }
  root.TerraStreet = { open, pin, fly, current, zoom, north, home, resize };
})(window);
