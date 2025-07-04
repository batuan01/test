import * as turf from "@turf/turf";
import { loadFromLocalStorage } from "../utils";
import { ImageElement } from "./image";

// Vẽ BBox cho feature
export const drawBoundingBox = (feature, map, layerType = "hover") => {
  if (!map || !feature || feature.geometry.type !== "Polygon") return;

  const bbox = turf.bbox(feature);
  const bboxPolygon = turf.bboxPolygon(bbox);
  bboxPolygon.properties = { type: `${layerType}-bbox` };

  const sourceId = `bbox-${layerType}`;
  const layerId = `bbox-${layerType}-line`;

  // Add source nếu chưa có
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  // Add layer nếu chưa có
  if (!map.getLayer(layerId)) {
    // console.log(layerId);
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {},
      paint: {
        "line-color": layerType === "hover" ? "#0099FF" : "#0099FF", // màu khác biệt
        "line-width": 3,
        ...(layerType === "hover" ? { "line-dasharray": [4, 2] } : {}),
      },
    });
  }

  // Set data
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
  const layers = ["bbox-selected-line", "bbox-hover-layer"];

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
  const bbox = turf.bbox(movedFeature);
  const bboxPolygon = turf.bboxPolygon(bbox);
  bboxPolygon.properties = { type: "bbox" };

  const featureCollection = {
    type: "FeatureCollection",
    features: [bboxPolygon],
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
