const test = require("node:test"),
  assert = require("node:assert/strict");
require("../dist/clarity.js");
const { tile, desiredLevel, inspect } = globalThis.TerraClarity;
test("Gopalpur coordinates select the verified tile", () =>
  assert.deepEqual(tile(19.2592, 84.9054, 19), { x: 385796, y: 233552 }));
test("tile coordinates remain valid at poles and antimeridian", () => {
  for (const [lat, lon] of [
    [90, 180],
    [-90, -180],
  ]) {
    const p = tile(lat, lon, 19);
    assert.ok(p.x >= 0 && p.x < 2 ** 19);
    assert.ok(p.y >= 0 && p.y < 2 ** 19);
  }
});
test("missing detail finds the highest available parent level", async () => {
  const r = await inspect(19, 85, 22, null, async (lat, lon, z) => z <= 18);
  assert.equal(r.limited, true);
  assert.equal(r.level, 18);
});
test("available desired tile requires no lower-level probes", async () => {
  let count = 0;
  const r = await inspect(19, 85, 21, null, async () => {
    count++;
    return true;
  });
  assert.equal(r.limited, false);
  assert.equal(count, 1);
});
test("failed availability request is not treated as missing imagery", async () => {
  await assert.rejects(
    inspect(19, 85, 21, null, async () => {
      throw Error("network");
    }),
    /network/,
  );
});
test("no available tile produces no invented fallback level", async () => {
  const r = await inspect(19, 85, 20, null, async () => false);
  assert.equal(r.level, null);
});
test("closer view asks for greater detail without exceeding supported level", () => {
  assert.ok(desiredLevel(19, 0.3) > desiredLevel(19, 3));
  assert.equal(desiredLevel(19, 0.0001), 23);
});
