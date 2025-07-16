import * as turf from "@turf/turf";
import { loadFromLocalStorage } from "../utils";
import { ImageElement } from "./image";
import { AppGlobals } from "../globals";
import { SelectedSelection } from "./selectedElement";
import { isPathElement } from "./element/typeChecks";

export class BoundingBox {
  static drawBoundingBox = (feature, map, layerType = "hover") => {
    if (!map || !feature) return;
    if (isPathElement(feature)) return;

    const bboxPolygon = this.getMinimumRotatedBBox(feature);
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
          "line-color": layerType === "hover" ? "#0099FF" : "#7f17f5",
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

  static removeBBoxSelected = (map) => {
    const sources = ["bbox-selected", "bbox-hover"];
    const layers = ["bbox-selected-line", "bbox-hover-line"];

    layers.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    sources.forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
  };

  static hoverBBoxSelected = (selectedElement, map) => {
    if (!map) return;

    map.on("mousemove", (e) => {
      if (selectedElement || AppGlobals.getElements()?.length === 0) {
        this.clearBoundingBox(map, "hover");
        return;
      }

      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = AppGlobals.getElements();
      if (!storedData?.length) return;

      const hoveredPolygon = SelectedSelection.findFeatureAtPoint(
        clickedLngLat,
        storedData
      );

      if (isPathElement(hoveredPolygon)) return;

      if (hoveredPolygon) {
        const polygonFeature =
          hoveredPolygon.geometry.type === "Image"
            ? ImageElement.convertPoligon(hoveredPolygon)
            : hoveredPolygon;
        this.drawBoundingBox(polygonFeature, map, "hover");
      } else {
        this.clearBoundingBox(map, "hover");
      }
    });
  };

  static clearBoundingBox = (map, layerType = "hover") => {
    const sourceId = `bbox-${layerType}`;
    const source = map.getSource(sourceId);

    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  };

  static updateBoundingBoxes(map, movedFeature) {
    const rotatedBBox = this.getMinimumRotatedBBox(movedFeature);
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

  static getMinimumRotatedBBox = (feature) => {
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
}
