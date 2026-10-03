(function (root) {
  function validate(value) {
    if (
      !value ||
      !Number.isFinite(value.lat) ||
      !Number.isFinite(value.lon) ||
      Math.abs(value.lat) > 85.0511 ||
      Math.abs(value.lon) > 180
    )
      return null;
    return {
      lat: value.lat,
      lon: value.lon,
      zoom: Math.max(1, Math.min(22, Number(value.zoom) || 14)),
      layer: value.layer === "streets" ? "streets" : "satellite",
      name: String(value.name || "Shared location").slice(0, 120),
    };
  }
  function parse(hash) {
    try {
      const p = new URLSearchParams(hash.replace(/^#/, ""));
      if (!p.has("lat") || !p.has("lon") || !p.get("lat") || !p.get("lon")) return null;
      return validate({
        lat: Number(p.get("lat")),
        lon: Number(p.get("lon")),
        zoom: Number(p.get("zoom")),
        layer: p.get("layer"),
        name: p.get("name"),
      });
    } catch {
      return null;
    }
  }
  function encode(view) {
    const v = validate(view);
    if (!v) throw new Error("Invalid map view");
    return new URLSearchParams({
      lat: v.lat.toFixed(6),
      lon: v.lon.toFixed(6),
      zoom: v.zoom.toFixed(2),
      layer: v.layer,
      name: v.name,
    }).toString();
  }
  function zoomForHeight(height) {
    return Math.max(1, Math.min(22, Math.log2(40000000 / Math.max(50, height))));
  }
  function heightForZoom(zoom) {
    return 40000000 / 2 ** Math.max(1, Math.min(22, zoom));
  }
  root.TerraView = { validate, parse, encode, zoomForHeight, heightForZoom };
})(typeof window === "undefined" ? globalThis : window);
