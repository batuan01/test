import * as turf from "@turf/turf";
import { loadFromLocalStorage } from "../utils";
import { ImageElement } from "./image";

// Vẽ BBox cho feature
// export const drawBoundingBox = (feature, map, layerType = "hover") => {
//   if (!map || !feature || feature.geometry.type !== "Polygon") return;

//   const bbox = turf.bbox(feature);
//   const bboxPolygon = turf.bboxPolygon(bbox);
//   bboxPolygon.properties = { type: `${layerType}-bbox` };

//   const sourceId = `bbox-${layerType}`;
//   const layerId = `bbox-${layerType}-line`;

//   // Add source nếu chưa có
//   if (!map.getSource(sourceId)) {
//     map.addSource(sourceId, {
//       type: "geojson",
//       data: {
//         type: "FeatureCollection",
//         features: [],
//       },
//     });
//   }

//   // Add layer nếu chưa có
//   if (!map.getLayer(layerId)) {
//     // console.log(layerId);
//     map.addLayer({
//       id: layerId,
//       type: "line",
//       source: sourceId,
//       layout: {},
//       paint: {
//         "line-color": layerType === "hover" ? "#0099FF" : "#0099FF", // màu khác biệt
//         "line-width": 3,
//         ...(layerType === "hover" ? { "line-dasharray": [4, 2] } : {}),
//       },
//     });
//   }

//   // Set data
//   const source = map.getSource(sourceId);
//   if (source) {
//     source.setData({
//       type: "FeatureCollection",
//       features: [bboxPolygon],
//     });
//   }
// };

export const drawBoundingBox = (feature, map, layerType = "hover") => {
  if (!map || !feature || feature.geometry.type !== "Polygon") return;

  const bboxPolygon = getMinimumRotatedBBox(feature);
  if (!bboxPolygon) return;

  bboxPolygon.properties = { type: `${layerType}-bbox` };

  const sourceId = `bbox-${layerType}`;
  const layerId = `bbox-${layerType}-line`;

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {},
      paint: {
        "line-color": layerType === "hover" ? "#0099FF" : "#FF9900",
        "line-width": 3,
        ...(layerType === "hover" ? { "line-dasharray": [4, 2] } : {}),
      },
    });
  }

  const source = map.getSource(sourceId);
  if (source) {
    source.setData({
      type: "FeatureCollection",
      features: [bboxPolygon],
    });
  }
};

export const removeBBoxSelected = (map) => {
  const sources = ["bbox-selected", "bbox-hover"];
  const layers = ["bbox-selected-line", "bbox-hover-line"];

  layers.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });

  sources.forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
};

export const hoverBBoxSelected = (selectedElement, map) => {
  if (!map) return;

  map.on("mousemove", (e) => {
    const allFeatures = loadFromLocalStorage();
    if (!allFeatures || !allFeatures.features.length) return;

    if (selectedElement) {
      clearBoundingBox(map, "hover");
      return;
    }

    const movePoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const hoveredPolygon = allFeatures.features.find((feature) => {
      if (feature.geometry.type === "Polygon") {
        return turf.booleanPointInPolygon(movePoint, feature);
      }
      if (feature.geometry.type === "Image") {
        const polygon = ImageElement.convertPoligon(feature);
        return turf.booleanPointInPolygon(movePoint, polygon.geometry);
      }
      return false;
    });

    if (hoveredPolygon) {
      const polygonFeature =
        hoveredPolygon.geometry.type === "Image"
          ? ImageElement.convertPoligon(hoveredPolygon)
          : hoveredPolygon;
      drawBoundingBox(polygonFeature, map, "hover");
    } else {
      clearBoundingBox(map, "hover");
    }
  });
};

export const clearBoundingBox = (map, layerType = "hover") => {
  const sourceId = `bbox-${layerType}`;
  const source = map.getSource(sourceId);

  if (source) {
    source.setData({
      type: "FeatureCollection",
      features: [],
    });
  }
};

export function updateBoundingBoxes(map, movedFeature) {
  const rotatedBBox = getMinimumRotatedBBox(movedFeature);
  if (!rotatedBBox) return;

  rotatedBBox.properties = { type: "bbox" };

  const featureCollection = {
    type: "FeatureCollection",
    features: [rotatedBBox],
  };

  ["bbox-selected", "bbox-hover"].forEach((sourceId) => {
    const source = map.getSource(sourceId);
    if (source && "setData" in source) {
      source.setData(featureCollection);
    }
  });
}

export const createBBoxHandles = (polygonFeature) => {
  const bbox = turf.bbox(polygonFeature);
  const [minX, minY, maxX, maxY] = bbox;

  const points = [
    turf.point([minX, minY], { handleType: "bottom-left" }),
    turf.point([minX, maxY], { handleType: "top-left" }),
    turf.point([maxX, maxY], { handleType: "top-right" }),
    turf.point([maxX, minY], { handleType: "bottom-right" }),
  ];

  return turf.featureCollection(points);
};

export const renderBBoxHandles = (map, handlesFC) => {
  if (!map.getSource("bbox-handles")) {
    map.addSource("bbox-handles", {
      type: "geojson",
      data: handlesFC,
    });
  } else {
    map.getSource("bbox-handles").setData(handlesFC);
  }

  if (!map.getLayer("bbox-handles-layer")) {
    map.addLayer({
      id: "bbox-handles-layer",
      type: "circle",
      source: "bbox-handles",
      paint: {
        "circle-radius": 6,
        "circle-color": "#ff0000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
};

export const getMinimumRotatedBBox = (feature) => {
  const convexHull = turf.convex(feature);
  if (!convexHull) return null;

  const coords = convexHull.geometry.coordinates[0];
  let minArea = Infinity;
  let bestPolygon = null;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const angle = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);

    const rotated = turf.transformRotate(feature, angle, {
      pivot: turf.centroid(feature),
      mutate: false,
    });

    const bbox = turf.bbox(rotated);
    const rect = turf.bboxPolygon(bbox);
    const area = turf.area(rect);

    if (area < minArea) {
      minArea = area;
      bestPolygon = turf.transformRotate(rect, -angle, {
        pivot: turf.centroid(feature),
        mutate: false,
      });
    }
  }

  return bestPolygon;
};
