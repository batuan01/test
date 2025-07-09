export const LOCAL_STORAGE_KEY = "draw-data";

export const saveToLocalStorage = (geojson) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(geojson));
};

export const newDataToLocalStorage = (feature) => {
  let geojson = loadFromLocalStorage();
  if (!geojson) {
    geojson = {
      type: "FeatureCollection",
      features: [],
    };
  }

  saveToLocalStorage({
    ...geojson,
    features: [...geojson.features, feature],
  });
};

export const removeFeatureFromLocalStorage = (idToRemove) => {
  const geojson = loadFromLocalStorage();
  if (!geojson || !geojson.features) return;

  const updatedFeatures = geojson.features.filter(
    (feature) => feature.id !== idToRemove
  );

  saveToLocalStorage({
    ...geojson,
    features: updatedFeatures,
  });
};

export const updateFeatureInLocalStorage = (updatedFeature) => {
  if (!updatedFeature?.id) return;

  const geojson = loadFromLocalStorage();
  if (!geojson || !geojson.features) return;

  const updatedFeatures = geojson.features.map((feature) =>
    feature.id === updatedFeature.id ? updatedFeature : feature
  );

  saveToLocalStorage({
    ...geojson,
    features: updatedFeatures,
  });
};

export const loadFromLocalStorage = () => {
  const geojson = localStorage.getItem(LOCAL_STORAGE_KEY);
  return geojson ? JSON.parse(geojson) : null;
};

export const clearLocalStorage = () =>
  localStorage.removeItem(LOCAL_STORAGE_KEY);

export const calculateImageBounds = (lngLat, size = 0.001) => {
  const { lng, lat } = lngLat;
  return [
    [lng - size, lat + size],
    [lng + size, lat + size],
    [lng + size, lat - size],
    [lng - size, lat - size],
  ];
};

export const calculateImageBoundsWithAspect = (lngLat, size, aspectRatio) => {
  const { lng, lat } = lngLat;

  const halfWidth = size;
  const halfHeight = size / aspectRatio;

  return [
    [lng - halfWidth, lat + halfHeight], // top-left
    [lng + halfWidth, lat + halfHeight], // top-right
    [lng + halfWidth, lat - halfHeight], // bottom-right
    [lng - halfWidth, lat - halfHeight], // bottom-left
  ];
};

export function generateUUID() {
  return "xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
