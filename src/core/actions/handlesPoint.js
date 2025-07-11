import { AppGlobals } from "../globals";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  updateFeatureInLocalStorage,
} from "../utils";
import { BoundingBox } from "./boundingBox";
import { ImageElement } from "./image";
import { Selection } from "./selection";

export class HandleDragging {
  static getCornerHandles(feature) {
    if (!feature?.geometry) return [];

    const { type, coordinates } = feature.geometry;
    let points = [];

    switch (type) {
      case "Polygon":
        points = coordinates[0]; // outer ring
        break;

      case "Image":
        points = [...coordinates];
        if (
          points.length &&
          (points[0][0] !== points.at(-1)[0] ||
            points[0][1] !== points.at(-1)[1])
        ) {
          points.push(points[0]);
        }
        break;

      case "LineString":
        points = [...coordinates, coordinates[0]];
        break;

      case "MultiPolygon":
        // Lấy tất cả các đỉnh của tất cả polygon con
        points = coordinates.flatMap((poly) => poly[0]);
        break;

      case "MultiLineString":
        points = coordinates.flat();
        break;

      case "Point":
        points = [coordinates];
        break;

      default:
        return [];
    }

    return points.slice(0, -1).map((coord, idx) => ({
      type: "Feature",
      id: `${feature.id}-handle-${idx}`,
      geometry: {
        type: "Point",
        coordinates: coord,
      },
      properties: {
        type: "handle",
        parentId: feature.id,
        index: idx,
      },
    }));
  }

  static enableHandleDragging(map, onUpdateFeature) {
    let selectedHandle = null;
    let isDragging = false;
    let animationFrameId = null;
    let latestCoord = null;
    let currentFeature = null;

    map.on("mousedown", (e) => {
      if (!map.getLayer("handles-layer")) return;
      map.dragPan.disable();

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["handles-layer"],
      });

      if (features.length && features[0].properties?.type === "handle") {
        selectedHandle = features[0];
        isDragging = true;
        map.getCanvas().style.cursor = "grabbing";

        BoundingBox.clearBoundingBox(map, "selected");
      }
    });

    const update = () => {
      if (!isDragging || !selectedHandle || !latestCoord) return;

      const { parentId, index } = selectedHandle.properties;
      const allFeatures = AppGlobals.getElements();
      const targetFeature = allFeatures.find((f) => f.id === parentId);
      if (!targetFeature) return;

      let coords = [];

      switch (targetFeature.geometry.type) {
        case "Polygon":
          coords = [...targetFeature.geometry.coordinates[0]];
          coords[index] = latestCoord;
          coords[coords.length - 1] = coords[0]; // đóng vòng
          targetFeature.geometry.coordinates = [coords];
          break;

        case "Image":
          coords = [...targetFeature.geometry.coordinates];
          coords[index] = latestCoord;
          targetFeature.geometry.coordinates = coords;
          break;

        case "LineString":
          coords = [...targetFeature.geometry.coordinates];
          coords[index] = latestCoord;
          targetFeature.geometry.coordinates = coords;
          break;
      }

      onUpdateFeature(targetFeature);
      animationFrameId = null;
      currentFeature = targetFeature;
    };

    map.on("mousemove", (e) => {
      if (!isDragging || !selectedHandle) return;

      latestCoord = [e.lngLat.lng, e.lngLat.lat];

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(update);
      }
    });

    map.on("mouseup", () => {
      if (!isDragging) return;

      isDragging = false;
      selectedHandle = null;
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();

      // Cancel frame nếu còn
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Cập nhật lần cuối và lưu
      const feature =
        currentFeature.geometry.type === "Image"
          ? ImageElement.convertPoligon(currentFeature)
          : currentFeature;

      update();
      AppGlobals.setDataToStore(currentFeature); // ✅ lưu polygon mới nhất()
      BoundingBox.drawBoundingBox(feature, map, "selected");
    });
  }

  static addHandlesPoint = (map, handles) => {
    if (!map.getSource("handles-source")) {
      map.addSource("handles-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: handles,
        },
      });
    }

    if (!map.getLayer("handles-layer")) {
      map.addLayer({
        id: "handles-layer",
        type: "circle",
        source: "handles-source",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffffff", // Nền trắng
          "circle-stroke-color": "#007aff", // Viền xanh (blue iOS)
          "circle-stroke-width": 2,
        },
      });
    }
  };

  static newHandlesPoint = (map, feature) => {
    if (!feature || !feature.id) return;

    const handles = this.getCornerHandles(feature);
    this.removeHandlesPoint(map);
    this.addHandlesPoint(map, handles);
  };

  static removeHandlesPoint = (map) => {
    const sourceId = "handles-source";
    const layerId = "handles-layer";
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  };

  static dragHandlesPoint = (map, sourceId) => {
    this.enableHandleDragging(map, (updatedFeature) => {
      // Cập nhật lại feature trong localStorage
      Selection.setSelectedData(map, updatedFeature, sourceId);

      // Cập nhật lại handles
      Selection.setHandlesData(map, updatedFeature);
    });
  };
}
