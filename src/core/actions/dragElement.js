import * as turf from "@turf/turf";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils";
import { updateBoundingBoxes } from "./boundingBox";

export function dragElement(features, map, feature, onUpdate) {
  let isDragging = false;
  let dragStartLngLat = null;
  let currentFeature = JSON.parse(JSON.stringify(feature)); // 💡 giữ dữ liệu mới nhất

  const onMouseDown = (e) => {
    const pt = turf.point([e.lngLat.lng, e.lngLat.lat]);
    if (!turf.booleanPointInPolygon(pt, currentFeature)) return;

    isDragging = true;
    dragStartLngLat = e.lngLat;
    map.getCanvas().style.cursor = "move";
    map.dragPan.disable();
  };

  const onMouseMove = (e) => {
    if (!isDragging || !dragStartLngLat) return;

    const dx = e.lngLat.lng - dragStartLngLat.lng;
    const dy = e.lngLat.lat - dragStartLngLat.lat;

    const moved = JSON.parse(JSON.stringify(currentFeature));
    moved.geometry.coordinates = moved.geometry.coordinates.map((ring) =>
      ring.map(([lng, lat]) => [lng + dx, lat + dy])
    );

    currentFeature = moved; // 🔥 gán lại để lần sau tiếp tục từ vị trí mới
    onUpdate(moved);

    dragStartLngLat = e.lngLat;
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    dragStartLngLat = null;
    map.getCanvas().style.cursor = "";
    map.dragPan.enable();
    console.log(23);
    features = currentFeature;
    updateBoundingBoxes(map, currentFeature);

    // const currentData = loadFromLocalStorage();
    // const updatedFeatures = currentData.features.map((f) =>
    //   f.id === currentFeature.id ? currentFeature : f
    // );

    // saveToLocalStorage({
    //   ...currentData,
    //   features: updatedFeatures,
    // });
  };

  map.on("mousedown", onMouseDown);
  map.on("mousemove", onMouseMove);
  map.on("mouseup", onMouseUp);

  return () => {
    map.off("mousedown", onMouseDown);
    map.off("mousemove", onMouseMove);
    map.off("mouseup", onMouseUp);
  };
}

export const handleMoveElement = (map, targetPolygon) => {
  let features;
  try {
    dragElement(features, map, targetPolygon, (movedFeature) => {
      map.getSource(`source-${targetPolygon.id}`).setData({
        type: "FeatureCollection",
        features: [movedFeature],
      });

      //   updateBoundingBoxes(map, movedFeature);

      // const currentData = loadFromLocalStorage();
      // const updatedFeatures = currentData.features.map((f) =>
      //   f.id === movedFeature.id ? movedFeature : f
      // );

      // saveToLocalStorage({
      //   ...currentData,
      //   features: updatedFeatures,
      // });
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("features", features);
  }
};
