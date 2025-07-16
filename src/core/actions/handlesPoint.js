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

    switch (type) {
      case "Polygon": {
        const points = coordinates[0].slice(0, -1); // bỏ điểm đóng vòng
        return points.map((coord, idx) => ({
          type: "Feature",
          id: `${feature.id}-handle-${idx}`,
          geometry: { type: "Point", coordinates: coord },
          properties: { type: "handle", parentId: feature.id, index: idx },
        }));
      }

      case "Image": {
        let points = [...coordinates];
        if (
          points.length &&
          (points[0][0] !== points.at(-1)[0] ||
            points[0][1] !== points.at(-1)[1])
        ) {
          points.push(points[0]);
        }
        return points.slice(0, -1).map((coord, idx) => ({
          type: "Feature",
          id: `${feature.id}-handle-${idx}`,
          geometry: { type: "Point", coordinates: coord },
          properties: { type: "handle", parentId: feature.id, index: idx },
        }));
      }

      case "LineString": {
        const points = coordinates;
        return points.map((coord, idx) => ({
          type: "Feature",
          id: `${feature.id}-handle-${idx}`,
          geometry: { type: "Point", coordinates: coord },
          properties: { type: "handle", parentId: feature.id, index: idx },
        }));
      }

      case "MultiLineString": {
        return coordinates.flatMap((line, lineIndex) =>
          line.map((coord, pointIndex) => ({
            type: "Feature",
            id: `${feature.id}-handle-${lineIndex}-${pointIndex}`,
            geometry: { type: "Point", coordinates: coord },
            properties: {
              type: "handle",
              parentId: feature.id,
              index: { lineIndex, pointIndex },
            },
          }))
        );
      }

      case "MultiPolygon": {
        const points = coordinates.flatMap((poly) => poly[0].slice(0, -1));
        return points.map((coord, idx) => ({
          type: "Feature",
          id: `${feature.id}-handle-${idx}`,
          geometry: { type: "Point", coordinates: coord },
          properties: { type: "handle", parentId: feature.id, index: idx },
        }));
      }

      case "Point": {
        return [
          {
            type: "Feature",
            id: `${feature.id}-handle-0`,
            geometry: { type: "Point", coordinates },
            properties: { type: "handle", parentId: feature.id, index: 0 },
          },
        ];
      }

      default:
        return [];
    }
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

      switch (targetFeature.geometry.type) {
        case "Polygon": {
          const coords = [...targetFeature.geometry.coordinates[0]];
          coords[index] = latestCoord;
          coords[coords.length - 1] = coords[0]; // đóng vòng
          targetFeature.geometry.coordinates = [coords];
          break;
        }

        case "Image": {
          const coords = [...targetFeature.geometry.coordinates];
          coords[index] = latestCoord;
          targetFeature.geometry.coordinates = coords;
          break;
        }

        case "LineString": {
          const coords = [...targetFeature.geometry.coordinates];
          coords[index] = latestCoord;
          targetFeature.geometry.coordinates = coords;
          break;
        }

        case "MultiLineString": {
          const indexRaw = selectedHandle.properties.index;
          let index = JSON.parse(indexRaw);

          if (
            !index ||
            typeof index.lineIndex !== "number" ||
            typeof index.pointIndex !== "number"
          )
            return;

          const multiCoords = [...targetFeature.geometry.coordinates];
          const lineCoords = [...multiCoords[index.lineIndex]];
          const coordToUpdate = lineCoords[index.pointIndex];

          // Cập nhật tọa độ cần sửa
          lineCoords[index.pointIndex] = latestCoord;

          // Cập nhật tất cả các tọa độ trùng khớp
          for (let i = 0; i < multiCoords.length; i++) {
            for (let j = 0; j < multiCoords[i].length; j++) {
              if (
                JSON.stringify(multiCoords[i][j]) ===
                JSON.stringify(coordToUpdate)
              ) {
                multiCoords[i][j] = latestCoord;
              }
            }
          }

          // Cập nhật lại tọa độ trong targetFeature
          multiCoords[index.lineIndex] = lineCoords;
          targetFeature.geometry.coordinates = multiCoords;
          break;
        }

        default:
          console.warn(
            "Unsupported geometry type:",
            targetFeature.geometry.type
          );
          return;
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

      if (!currentFeature) return;

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
