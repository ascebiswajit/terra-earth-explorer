const test = require("node:test");
const assert = require("node:assert/strict");
require("../dist/view-state.js");
const view = globalThis.TerraView;
test("shared view round-trips coordinates, Unicode name, zoom and layer", () => {
  const v = { lat: 19.2592, lon: 84.9054, zoom: 18.5, layer: "streets", name: "ଗୋପାଳପୁର & coast" };
  assert.deepEqual(view.parse("#" + view.encode(v)), v);
});
test("invalid and absent coordinates cannot create a shared view", () => {
  for (const h of ["", "lat=&lon=1", "lat=NaN&lon=2", "lat=99&lon=0", "lat=1&lon=181"])
    assert.equal(view.parse(h), null);
});
test("shared view clamps zoom and ignores unsupported layers", () => {
  const v = view.parse("lat=20&lon=85&zoom=999&layer=javascript");
  assert.equal(v.zoom, 22);
  assert.equal(v.layer, "satellite");
});
test("satellite height and street zoom conversions round trip", () => {
  for (const z of [2, 10, 18]) assert.equal(view.zoomForHeight(view.heightForZoom(z)), z);
});
