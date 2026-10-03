const $ = (id) => document.getElementById(id);
const places = [
  {
    name: "Gran Chaco",
    country: "Paraguay · South America",
    lat: -23.22307314,
    lon: -60.0148542,
    height: 2200000,
    kind: "Forest & wilderness",
    desc: "A vast lowland region in the heart of South America, stretching across Paraguay, Bolivia and Argentina. Explore a mosaic of dry forests, savannas and winding rivers.",
    wiki: "Gran_Chaco",
  },
  {
    name: "Mount Everest",
    country: "Nepal / China · Asia",
    lat: 27.9881,
    lon: 86.925,
    height: 48000,
    kind: "Mountain landscape",
    desc: "On the border between Nepal and China, Mount Everest rises along the Himalayan range. Explore its surrounding glaciers and mountain valleys from above.",
    wiki: "Mount_Everest",
  },
  {
    name: "Grand Canyon",
    country: "United States · North America",
    lat: 36.1069,
    lon: -112.1129,
    height: 65000,
    kind: "Canyon & national park",
    desc: "Carved by the Colorado River in northern Arizona, the Grand Canyon exposes layers of rock across a dramatic landscape of cliffs, plateaus and tributary canyons.",
    wiki: "Grand_Canyon",
  },
  {
    name: "Venice",
    country: "Italy · Europe",
    lat: 45.4408,
    lon: 12.3155,
    height: 12000,
    kind: "City & culture",
    desc: "A city spread across islands in the Venetian Lagoon. Follow the Grand Canal and explore the pattern of waterways, bridges and historic neighborhoods from above.",
    wiki: "Venice",
  },
  {
    name: "Bhubaneswar",
    country: "India · Asia",
    lat: 20.2961,
    lon: 85.8245,
    height: 25000,
    kind: "City & heritage",
    desc: "The capital of Odisha, in eastern India. Discover a city known for its historic temples, with planned neighborhoods and green spaces extending around the old town.",
    wiki: "Bhubaneswar",
  },
  {
    name: "Great Barrier Reef",
    country: "Australia · Oceania",
    lat: -18.2871,
    lon: 147.6992,
    height: 370000,
    kind: "Ocean & coral reefs",
    desc: "Off the coast of Queensland, the Great Barrier Reef is an extensive network of coral reefs and islands in the Coral Sea. Zoom in to follow reef patterns and turquoise lagoons.",
    wiki: "Great_Barrier_Reef",
  },
];
let viewer,
  selected = places[0],
  marker,
  mode3D = true,
  searchSeq = 0;
let toastTimer;
let pendingPlace = null;
let locationPending = false;
let layerRequest = 0,
  activeMap = "satellite",
  labelsEnabled = true,
  labelLayer = null,
  tilePending = 0,
  tileFailed = false,
  layerLoading = false;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").style.display = "none"), 5000);
}
function coord(v, lat) {
  return Math.abs(v).toFixed(4) + "° " + (lat ? (v >= 0 ? "N" : "S") : v >= 0 ? "E" : "W");
}
function tab(name) {
  document.querySelectorAll(".tab-content").forEach((el) => (el.hidden = el.id !== name));
  document
    .querySelectorAll("[data-tab]")
    .forEach((el) => el.classList.toggle("active", el.dataset.tab === name));
}
document.querySelectorAll("[data-tab]").forEach((el) => (el.onclick = () => tab(el.dataset.tab)));
function details(p) {
  selected = p;
  $("placeTitle").textContent = p.name;
  $("region").textContent = p.country || "SELECTED LOCATION";
  $("description").textContent =
    p.desc ||
    "Explore this location on the globe. Switch to the street map for roads and local context.";
  $("facts").replaceChildren();
  const facts = [
    ["Latitude", coord(p.lat, true)],
    ["Longitude", coord(p.lon, false)],
    ["Location type", p.kind || "Place"],
    ...(p.timezone ? [["Time zone", p.timezone]] : []),
    ...(Number.isFinite(p.population) ? [["Population", p.population.toLocaleString()]] : []),
  ];
  facts.forEach(([k, v]) => {
    let div = document.createElement("div"),
      dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    div.append(dt, dd);
    $("facts").append(div);
  });
  $("learn").hidden = !p.wiki;
  $("learn").href = p.wiki ? "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.wiki) : "#";
  $("detailSource").textContent = p.source || "Location information · Curated overview";
}
function fly(p) {
  if (
    !Number.isFinite(p.lat) ||
    !Number.isFinite(p.lon) ||
    Math.abs(p.lat) > 90 ||
    Math.abs(p.lon) > 180
  ) {
    toast("This result has invalid coordinates. Please choose another place.");
    return;
  }
  details(p);
  tab("details");
  if (activeMap === "streets" && window.TerraStreet) {
    window.TerraStreet.fly({ ...p, zoom: window.TerraView.zoomForHeight(p.height || 2000) });
    updatePlaceHeader(p);
    if (innerWidth < 700) $("panel").classList.add("collapsed");
    return;
  }
  if (!viewer) {
    pendingPlace = p;
    toast("Your place is selected. The map will move there when the globe is ready.");
    return;
  }
  if (viewer.scene.mode === Cesium.SceneMode.MORPHING) viewer.scene.completeMorph();
  viewer.camera.cancelFlight();
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height || 12000),
    duration: 2,
    orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
  });
  if (marker) viewer.entities.remove(marker);
  marker = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
    point: {
      pixelSize: 16,
      color: Cesium.Color.fromCssColorString("#b2efd2"),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: p.name,
      font: "16px sans-serif",
      fillColor: Cesium.Color.WHITE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#10252ee6"),
      pixelOffset: new Cesium.Cartesian2(0, -32),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  viewer.scene.requestRender();
  $("viewName").textContent = p.name;
  $("viewSub").textContent = coord(p.lat, true) + " · " + coord(p.lon, false);
  $("coords").textContent = coord(p.lat, true) + "  " + coord(p.lon, false);
  if (innerWidth < 700) $("panel").classList.add("collapsed");
}
places.forEach((p, i) => {
  let b = document.createElement("button");
  b.className = "place";
  let num = document.createElement("span");
  num.className = "place-num";
  num.textContent = String(i + 1).padStart(2, "0");
  let copy = document.createElement("span");
  copy.className = "place-copy";
  let title = document.createElement("b");
  title.textContent = p.name;
  let small = document.createElement("small");
  small.textContent = p.kind + " · " + p.country.split(" · ")[0];
  copy.append(title, small);
  let pin = document.createElement("span");
  pin.textContent = "⌖";
  b.append(num, copy, pin);
  b.onclick = () => fly(p);
  $("places").append(b);
});
details(selected);
$("fly").onclick = () => fly(selected);
$("surprise").onclick = () => fly(places[Math.floor(Math.random() * places.length)]);
$("panelToggle").onclick = () => $("panel").classList.toggle("collapsed");
$("help").onclick = () => $("helpDialog").showModal();
$("closeHelp").onclick = () => $("helpDialog").close();
$("helpDialog").addEventListener("click", (e) => {
  if (e.target === $("helpDialog")) $("helpDialog").close();
});
function searchStatus(message) {
  let p = document.createElement("p");
  p.textContent = message;
  $("searchResults").append(p);
}
async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Search service unavailable");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
function uniquePlaces(items) {
  return items.filter(
    (p, i, all) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lon) &&
      Math.abs(p.lat) <= 90 &&
      Math.abs(p.lon) <= 180 &&
      !all
        .slice(0, i)
        .some(
          (x) =>
            x.name.toLowerCase() === p.name.toLowerCase() &&
            Math.abs(x.lat - p.lat) < 0.02 &&
            Math.abs(x.lon - p.lon) < 0.02,
        ),
  );
}
async function search(q) {
  q = q.trim();
  const seq = ++searchSeq;
  $("searchResults").replaceChildren();
  if (!q) return;
  if (/^(my location|current location|near me)$/i.test(q)) {
    locate();
    return;
  }
  const c = q.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
  if (c) {
    let lat = +c[1],
      lon = +c[2];
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      searchStatus("Latitude must be −90 to 90; longitude −180 to 180.");
      return;
    }
    fly({
      name: "Pinned location",
      lat,
      lon,
      height: 3000,
      country: "COORDINATES",
      kind: "Map point",
    });
    return;
  }
  let local = places.filter((p) =>
    (p.name + " " + p.country).toLowerCase().includes(q.toLowerCase()),
  );
  renderResults(local);
  searchStatus("Finding your place…");
  let remote = [],
    failed = false;
  try {
    const data = await fetchJSON(
      (window.TERRA_CONFIG?.geocodingPrimary || "https://photon.komoot.io/api/") +
        "?q=" +
        encodeURIComponent(q) +
        "&limit=8",
    );
    remote = (data.features || []).map((f) => {
      const p = f.properties || {},
        c = f.geometry?.coordinates || [];
      return {
        name: p.name || p.street || p.city || q,
        lat: c[1],
        lon: c[0],
        country: [p.street, p.district, p.city, p.state, p.postcode, p.country]
          .filter(Boolean)
          .filter((x, i, a) => a.indexOf(x) === i)
          .join(" · "),
        kind: p.type || p.osm_value || "Place",
        height: ["house", "street", "locality", "district"].includes(p.type) ? 3500 : 12000,
        source: "Location data · Photon / © OpenStreetMap contributors",
      };
    });
  } catch (e) {
    failed = true;
  }
  if (seq !== searchSeq) return;
  remote = uniquePlaces(remote);
  if (!remote.length) {
    try {
      const data = await fetchJSON(
        (window.TERRA_CONFIG?.geocodingFallback ||
          "https://geocoding-api.open-meteo.com/v1/search") +
          "?name=" +
          encodeURIComponent(q) +
          "&count=8&language=" +
          encodeURIComponent((navigator.language || "en").split("-")[0]) +
          "&format=json",
      );
      remote = (data.results || []).map((p) => ({
        name: p.name,
        lat: p.latitude,
        lon: p.longitude,
        country: [p.admin2, p.admin1, p.country].filter(Boolean).join(" · "),
        timezone: p.timezone,
        population: p.population,
        source: "Location data · Open-Meteo / GeoNames",
      }));
      failed = false;
    } catch (e) {
      failed = true;
    }
  }
  if (seq !== searchSeq) return;
  const exact = local.filter((p) => p.name.toLowerCase() === q.toLowerCase());
  const results = uniquePlaces([...exact, ...remote, ...local]);
  renderResults(results);
  if (results.length) {
    fly(results[0]);
    searchStatus(
      results.length > 1
        ? "Showing the top match. Choose another result if this is not your place."
        : "Showing this location on the map.",
    );
    if (failed) searchStatus("Online search is unavailable; showing a featured destination.");
  } else
    searchStatus(
      failed
        ? "Search services are unavailable. Try again, use My location, or enter latitude, longitude."
        : "No matching place found. Add your district, state or country, or use My location.",
    );
}
function renderResults(results) {
  $("searchResults").replaceChildren();
  results.forEach((p) => {
    let b = document.createElement("button");
    b.type = "button";
    b.textContent = "⌖ " + p.name;
    let s = document.createElement("small");
    s.textContent = p.country;
    let action = document.createElement("small");
    action.textContent = "Show on map";
    b.append(s, action);
    b.onclick = () => {
      searchSeq++;
      fly(p);
      $("search").value = p.name;
      renderResults([]);
      searchStatus("Showing " + p.name + " on the map.");
    };
    $("searchResults").append(b);
  });
}
function locate() {
  if (locationPending) return;
  searchSeq++;
  if (!navigator.geolocation) {
    toast("Location is not supported in this browser. Search for your place instead.");
    return;
  }
  locationPending = true;
  [$("locate"), $("useLocation")].forEach((b) => (b.disabled = true));
  $("useLocation").textContent = "Finding your location…";
  const finish = () => {
    locationPending = false;
    [$("locate"), $("useLocation")].forEach((b) => (b.disabled = false));
    $("useLocation").textContent = "⌖ Use my current location";
  };
  navigator.geolocation.getCurrentPosition(
    (p) => {
      finish();
      $("searchResults").replaceChildren();
      fly({
        name: "Your location",
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        height: Math.max(1200, p.coords.accuracy * 5),
        country: "DEVICE LOCATION",
        kind: "Approximate location",
        source: "Location from your browser",
        desc:
          "Your device reports an accuracy of approximately " +
          Math.round(p.coords.accuracy).toLocaleString() +
          " metres. The pin marks that reported position.",
      });
      searchStatus("Your location is marked on the map.");
    },
    (e) => {
      finish();
      const message =
        e.code === 1
          ? "Location permission was denied. Allow location access in your browser’s site settings, then try again."
          : e.code === 3
            ? "Finding your location timed out. Try again outdoors or search your place by name."
            : "Your device could not determine its location. Search your place or enter coordinates.";
      $("searchResults").replaceChildren();
      searchStatus(message);
      toast(message);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
  );
}
$("searchForm").onsubmit = (e) => {
  e.preventDefault();
  search($("search").value);
};
$("search").oninput = () => {
  searchSeq++;
  $("searchResults").replaceChildren();
};
$("useLocation").onclick = locate;
function init() {
  if (!window.Cesium) {
    $("loadText").textContent = "The globe could not load. Check your connection and reload.";
    return;
  }
  try {
    Cesium.Ion.defaultAccessToken = "";
    viewer = new Cesium.Viewer("globe", {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: true,
      useBrowserRecommendedResolution: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });
    configureMapDetail();
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#050a0e");
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#183b4b");
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 120;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 35000000;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-60.0148542, -23.22307314, 12000000),
    });
    setLayer("satellite");
    $("loading").style.display = "none";
    if (pendingPlace) {
      const p = pendingPlace;
      pendingPlace = null;
      fly(p);
    }
    viewer.camera.changed.addEventListener(() => {
      let c = viewer.camera.positionCartographic;
      if (activeMap !== "streets")
        $("altitude").textContent =
          c.height < 1000
            ? "Camera " + Math.round(c.height) + " m"
            : "Camera " + Math.round(c.height / 1000).toLocaleString() + " km";
    });
    viewer.camera.percentageChanged = 0.02;
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((e) => {
      let ray = viewer.camera.getPickRay(e.position),
        point = viewer.scene.globe.pick(ray, viewer.scene);
      if (!point) return;
      let c = Cesium.Cartographic.fromCartesian(point),
        lat = Cesium.Math.toDegrees(c.latitude),
        lon = Cesium.Math.toDegrees(c.longitude);
      details({
        name: "Pinned location",
        lat,
        lon,
        kind: "Map point",
        country: "COORDINATES",
        desc: "A point on our planet. Zoom in to explore its surroundings, or switch to the street map for geographic labels.",
      });
      tab("details");
      $("panel").classList.remove("collapsed");
      $("coords").textContent = coord(lat, true) + "  " + coord(lon, false);
      if (marker) viewer.entities.remove(marker);
      marker = viewer.entities.add({
        position: point,
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString("#b2efd2"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  } catch (e) {
    $("loadText").textContent =
      "Unable to start the 3D globe. Please use a browser with WebGL enabled and reload.";
    console.error(e);
  }
}
let clarityTimer,
  clarityController,
  claritySequence = 0,
  clarityLimited = false,
  clearerDestination = null;
function cancelClarityCheck() {
  clearTimeout(clarityTimer);
  clarityController?.abort();
  claritySequence++;
  clarityLimited = false;
  clearerDestination = null;
  $("clarityNotice").hidden = true;
}
function scheduleClarityCheck() {
  clearTimeout(clarityTimer);
  if (activeMap !== "satellite" || !viewer) return;
  clarityTimer = setTimeout(checkClarity, 500);
}
async function checkClarity() {
  if (activeMap !== "satellite" || !viewer || !window.TerraClarity) return;
  const canvas = viewer.scene.canvas;
  if (!canvas) return;
  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const point = viewer.camera.pickEllipsoid(center, viewer.scene.globe.ellipsoid);
  const next = viewer.camera.pickEllipsoid(
    new Cesium.Cartesian2(center.x + 1, center.y),
    viewer.scene.globe.ellipsoid,
  );
  if (!point || !next) return;
  const c = Cesium.Cartographic.fromCartesian(point),
    lat = Cesium.Math.toDegrees(c.latitude),
    lon = Cesium.Math.toDegrees(c.longitude);
  const metres = Cesium.Cartesian3.distance(point, next);
  if (!Number.isFinite(metres) || metres <= 0) return;
  const desired = window.TerraClarity.desiredLevel(lat, metres);
  if (desired < 16) return;
  const seq = ++claritySequence;
  clarityController?.abort();
  clarityController = new AbortController();
  const controller = clarityController;
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const result = await window.TerraClarity.inspect(lat, lon, desired, controller.signal);
    if (seq !== claritySequence || activeMap !== "satellite") return;
    clarityLimited = result.limited;
    if (result.limited) {
      const usable = result.level !== null;
      const pixelSize = usable ? (156543.03392 * Math.cos(c.latitude)) / 2 ** result.level : null;
      clearerDestination = usable
        ? {
            lat,
            lon,
            height: Math.max(
              500,
              ((pixelSize * canvas.clientHeight) / (2 * Math.tan(Math.PI / 6))) * 1.25,
            ),
          }
        : null;
      $("clarityMessage").textContent =
        "The imagery provider has no tile at this detail level for the centre of this view. Enlarging the available image cannot reveal additional building details.";
      $("clearerView").hidden = !usable;
      $("clarityNotice").hidden = false;
    }
    updateMapStatus();
  } catch (e) {
    if (seq === claritySequence && activeMap === "satellite")
      $("mapStatus").textContent = "Detail availability could not be checked";
  } finally {
    clearTimeout(timeout);
  }
}
$("clearerView").onclick = () => {
  if (!viewer || !clearerDestination) return;
  const p = clearerDestination;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height),
    orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
    duration: 1.2,
  });
};
$("clarityStreets").onclick = () => setLayer("streets");
function updatePlaceHeader(p) {
  $("viewName").textContent = p.name;
  $("viewSub").textContent = coord(p.lat, true) + " · " + coord(p.lon, false);
  $("coords").textContent = coord(p.lat, true) + "  " + coord(p.lon, false);
}
function currentView() {
  if (activeMap === "streets" && window.TerraStreet) {
    const v = window.TerraStreet.current();
    if (v) return { ...v, layer: "streets", name: selected.name };
  }
  if (!viewer)
    return {
      lat: selected.lat,
      lon: selected.lon,
      zoom: 14,
      layer: "streets",
      name: selected.name,
    };
  const canvas = viewer.scene.canvas;
  const point = viewer.camera.pickEllipsoid(
    new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2),
    viewer.scene.globe.ellipsoid,
  );
  const c = point ? Cesium.Cartographic.fromCartesian(point) : viewer.camera.positionCartographic;
  return {
    lat: Cesium.Math.toDegrees(c.latitude),
    lon: Cesium.Math.toDegrees(c.longitude),
    zoom: window.TerraView.zoomForHeight(viewer.camera.positionCartographic.height),
    layer: "satellite",
    name: selected.name,
  };
}
function showMapSurface(street) {
  $("streetMap").hidden = !street;
  $("globe").hidden = street;
  $("loading").style.display = "none";
  document.body.classList.toggle("road-view", street);
  $("mode").disabled = street;
  $("labels").disabled = street;
  ["satellite", "streets"].forEach((id) =>
    $(id).classList.toggle("active", street ? id === "streets" : id === "satellite"),
  );
  if (!street) viewer?.resize();
}
function openStreetMap(view) {
  const v = view || currentView();
  cancelClarityCheck();
  ++layerRequest;
  try {
    $("streetMap").hidden = false;
    window.TerraStreet.open(v, {
      status: (message) => {
        if (activeMap === "streets") $("mapStatus").textContent = message;
      },
      move: (p) => {
        if (activeMap === "streets") {
          $("coords").textContent = coord(p.lat, true) + " " + coord(p.lon, false);
          $("altitude").textContent = "Road zoom " + p.zoom.toFixed(1);
        }
      },
      pick: (p) => {
        details({
          ...p,
          kind: "Mapped location",
          country: "ROAD DETAIL",
          source: "© OpenStreetMap contributors",
          desc: "Roads, labels and building outlines are drawn from community mapping. Coverage varies by location.",
        });
        updatePlaceHeader(p);
        tab("details");
        window.TerraStreet.pin(p);
        $("panel").classList.remove("collapsed");
      },
    });
    activeMap = "streets";
    layerLoading = false;
    showMapSurface(true);
    window.TerraStreet.resize();
    $("mapStatus").textContent = "Vector roads · zoom for names and mapped buildings";
    $("altitude").textContent = "Road zoom " + v.zoom.toFixed(1);
  } catch (e) {
    $("streetMap").hidden = true;
    toast(e.message || "Road detail could not load. Please retry.");
  }
}
$("shareView").onclick = () => {
  try {
    const url = new URL(location.href);
    url.hash = window.TerraView.encode(currentView());
    $("shareUrl").value = url.toString();
    $("shareStatus").textContent = "";
    $("shareDialog").showModal();
  } catch (e) {
    toast("Move the map to a location before sharing.");
  }
};
$("copyShare").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("shareUrl").value);
    $("shareStatus").textContent = "Link copied. Anyone with the link can open this view.";
  } catch (e) {
    $("shareUrl").select();
    $("shareStatus").textContent = "Select and copy the link above.";
  }
};
$("closeShare").onclick = () => $("shareDialog").close();
$("privacyButton").onclick = () => $("privacyDialog").showModal();
$("closePrivacy").onclick = () => $("privacyDialog").close();
function restoreSharedView() {
  const v = window.TerraView?.parse(location.hash);
  if (!v) return;
  const p = {
    ...v,
    height: window.TerraView.heightForZoom(v.zoom),
    country: "SHARED VIEW",
    kind: "Shared location",
  };
  details(p);
  updatePlaceHeader(p);
  tab("details");
  if (v.layer === "streets") openStreetMap(v);
  else fly(p);
}
window.addEventListener("hashchange", restoreSharedView);
function configureMapDetail() {
  // Honor Retina / high-density displays without allocating an unbounded canvas.
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  viewer.resolutionScale = Math.min(ratio, 2) / ratio;
  viewer.scene.globe.maximumScreenSpaceError = 1;
  viewer.scene.globe.tileCacheSize = 350;
  viewer.scene.globe.preloadAncestors = true;
  viewer.scene.globe.preloadSiblings = false;
  viewer.scene.globe.tileLoadProgressEvent.addEventListener((count) => {
    tilePending = count;
    updateMapStatus();
  });
  viewer.camera.moveStart.addEventListener(() => {
    if (activeMap === "streets") return;
    cancelClarityCheck();
    $("mapStatus").textContent = "Moving · detail updates as you zoom";
  });
  viewer.camera.moveEnd.addEventListener(() => {
    viewer.scene.requestRender();
    updateMapStatus();
    scheduleClarityCheck();
  });
}
function updateMapStatus() {
  if (activeMap === "streets") return;
  if (clarityLimited && activeMap === "satellite") {
    $("mapStatus").textContent = "Higher-detail imagery unavailable here";
    return;
  }
  if (layerLoading) {
    $("mapStatus").textContent = "Loading map layer…";
    return;
  }
  if (tilePending > 0) {
    $("mapStatus").textContent = "Loading map detail…";
    return;
  }
  if (tileFailed) {
    $("mapStatus").textContent = "Some tiles unavailable · try Street map";
    return;
  }
  const close = viewer && viewer.camera.positionCartographic.height < 2500;
  $("mapStatus").textContent =
    activeMap === "satellite" && close
      ? "Imagery loaded · sharpness varies by area"
      : "Map detail loaded";
}
async function arcgisProvider(url) {
  let timer;
  try {
    return await Promise.race([
      Cesium.ArcGisMapServerImageryProvider.fromUrl(url, { enablePickFeatures: false }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Map service timed out")), 12000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function watchTiles(provider, request) {
  provider.errorEvent.addEventListener(() => {
    if (request !== layerRequest) return;
    tileFailed = true;
    updateMapStatus();
  });
}
async function setLayer(type) {
  if (type === "streets") {
    openStreetMap();
    return;
  }
  if (!viewer) {
    toast("Satellite globe is unavailable. Road detail can still be used.");
    return;
  }
  if (activeMap === "streets") {
    const v = window.TerraStreet.current();
    if (v)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          v.lon,
          v.lat,
          window.TerraView.heightForZoom(v.zoom),
        ),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      });
  }
  cancelClarityCheck();
  const request = ++layerRequest;
  layerLoading = true;
  tileFailed = false;
  updateMapStatus();
  try {
    const provider = await arcgisProvider(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
    );
    if (request !== layerRequest) return;
    watchTiles(provider, request);
    viewer.imageryLayers.removeAll();
    labelLayer = null;
    viewer.imageryLayers.addImageryProvider(provider);
    activeMap = type;
    layerLoading = false;
    showMapSurface(false);
    ["satellite", "streets"].forEach((id) => $(id).classList.toggle("active", id === type));
    $("labels").disabled = type !== "satellite";
    viewer.scene.requestRender();
    updateMapStatus();
    scheduleClarityCheck();
    if (type === "satellite") {
      try {
        const labels = await arcgisProvider(
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
        );
        if (request !== layerRequest) return;
        labelLayer = viewer.imageryLayers.addImageryProvider(labels);
        labelLayer.show = labelsEnabled;
        viewer.scene.requestRender();
      } catch (e) {
        if (request === layerRequest)
          toast("Place labels are unavailable. Street map includes road and place names.");
      }
    }
  } catch (e) {
    if (request !== layerRequest) return;
    layerLoading = false;
    tileFailed = true;
    updateMapStatus();
    toast("This map layer could not load. Try Street map or select Satellite again.");
  }
}
function toggleLabels() {
  labelsEnabled = !labelsEnabled;
  $("labels").setAttribute("aria-pressed", String(labelsEnabled));
  $("labels").classList.toggle("active", labelsEnabled);
  if (labelLayer) {
    labelLayer.show = labelsEnabled;
    viewer.scene.requestRender();
  }
}
$("labels").onclick = toggleLabels;
$("satellite").onclick = () => setLayer("satellite");
$("streets").onclick = () => setLayer("streets");
$("plus").onclick = () => {
  if (activeMap === "streets") {
    window.TerraStreet.zoom(1);
    return;
  }
  if (viewer) {
    viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.4);
    viewer.scene.requestRender();
  }
};
$("minus").onclick = () => {
  if (activeMap === "streets") {
    window.TerraStreet.zoom(-1);
    return;
  }
  if (viewer) {
    viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.6);
    viewer.scene.requestRender();
  }
};
$("home").onclick = () => {
  if (activeMap === "streets") {
    window.TerraStreet.home();
    return;
  }
  if (viewer) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-60, -23, 18000000),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      duration: 2,
    });
    $("viewName").textContent = "Our planet";
    $("viewSub").textContent = "A world of possibilities";
  }
};
$("north").onclick = () => {
  if (activeMap === "streets") {
    window.TerraStreet.north();
    return;
  }
  if (viewer)
    viewer.camera.flyTo({
      destination: viewer.camera.positionWC,
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      duration: 1,
    });
};
$("mode").onclick = () => {
  if (activeMap === "streets" || !viewer) return;
  mode3D = !mode3D;
  mode3D ? viewer.scene.morphTo3D(1) : viewer.scene.morphTo2D(1);
  $("mode").textContent = mode3D ? "2D" : "3D";
};
$("locate").onclick = locate;
init();
restoreSharedView();
