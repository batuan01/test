import * as turf from "@turf/turf";
import { createBBoxHandles, renderBBoxHandles } from "./boundingBox"; // hoặc file bạn vừa viết
import { saveToLocalStorage } from "../utils";

export const setupCornerHandlers = (map, draw) => {
  const terraDraw = draw.getTerraDrawInstance();

  // Khi select 1 feature thì tạo handles
  terraDraw.on("select", () => {
    const selected = draw.getFeatures(true).features;
    const polygon = selected.find((f) => f.geometry.type === "Polygon");

    if (!polygon) return;

    const handlesFC = createBBoxHandles(polygon);
    renderBBoxHandles(map, handlesFC);
  });

  // Handle kéo điểm góc
//   map.on("mousedown", (e) => {
//     const features = map.queryRenderedFeatures(e.point, {
//       layers: ["bbox-handles-layer"],
//     });

//     if (!features.length) return;

//     const handle = features[0];
//     const handleCoord = handle.geometry.coordinates;

//     const selected = draw.getFeatures(true).features;
//     const polygon = selected.find((f) => f.geometry.type === "Polygon");
//     if (!polygon) return;

//     const originalCenter = turf.centerOfMass(polygon).geometry.coordinates;

//     const onMouseMove = (moveEvent) => {
//       const newCoord = [moveEvent.lngLat.lng, moveEvent.lngLat.lat];

//       const scaleFactor =
//         turf.distance(turf.point(originalCenter), turf.point(newCoord)) /
//         turf.distance(turf.point(originalCenter), turf.point(handleCoord));

//       const scaled = turf.transformScale(polygon, scaleFactor, {
//         origin: originalCenter,
//       });

//       // ⚠️ Update 1 feature duy nhất thay vì clear all
//       const allFeatures = draw.getFeatures().features;

//       const updatedFeatures = allFeatures.map((f) => {
//         if (f.id === polygon.id) {
//           return {
//             ...scaled,
//             id: f.id,
//             properties: {
//               ...f.properties,
//             },
//           };
//         }
//         return f;
//       });

//       // Clear & re-add (bắt buộc nếu TerraDraw không có update API)
//       terraDraw.clear();
//       terraDraw.addFeatures(updatedFeatures);

//       // 🟢 Re-select lại polygon
//       terraDraw.setSelectedIds([polygon.id]);

//       // Re-render handles
//       const handlesFC = createBBoxHandles(scaled);
//       renderBBoxHandles(map, handlesFC);

//       // Save to localStorage
//       saveToLocalStorage({
//         type: "FeatureCollection",
//         features: updatedFeatures,
//       });
//     };

//     const onMouseUp = () => {
//       map.off("mousemove", onMouseMove);
//       map.off("mouseup", onMouseUp);
//     };

//     map.on("mousemove", onMouseMove);
//     map.on("mouseup", onMouseUp);
//   });

  // Khi deselect thì xóa handles
  terraDraw.on("deselect", () => {
    if (map.getLayer("bbox-handles-layer"))
      map.removeLayer("bbox-handles-layer");
    if (map.getSource("bbox-handles")) map.removeSource("bbox-handles");
  });
};
