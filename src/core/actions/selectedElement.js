import * as turf from "@turf/turf";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils";
import { BoundingBox } from "./boundingBox";
import { ImageElement } from "./image";
import { dragElement, handleMoveElement } from "./dragElement";
import {
  enableHandleDragging,
  getCornerHandles,
  HandleDragging,
} from "./handlesPoint";
import { RotateController } from "./rotateElement";
import { Selection } from "./selection";
import { AppGlobals } from "../globals";

export class SelectedSelection {
  static findFeatureAtPoint(point, features) {
    const clickedPoint = turf.point(point);

    return [...features]
      .sort((a, b) => Number(b.properties.index) - Number(a.properties.index))
      .find((feature) => {
        const geom = feature.geometry;
        if (!geom) return false;

        // Polygon & MultiPolygon
        if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
          return turf.booleanPointInPolygon(clickedPoint, feature);
        }

        // Custom type "Image" dạng Polygon
        if (geom.type === "Image" && feature.properties?.type === "image") {
          const imagePoly = ImageElement.convertPoligon(feature);
          return turf.booleanPointInPolygon(clickedPoint, imagePoly);
        }

        // LineString
        if (geom.type === "LineString") {
          const distance = turf.pointToLineDistance(clickedPoint, feature, {
            units: "meters",
          });

          return distance < 10;
        }

        // Point
        if (geom.type === "Point") {
          const dist = turf.distance(clickedPoint, feature, {
            units: "meters",
          });
          return dist < 5; // Cho phép khoảng cách < 5m là "trúng"
        }

        return false;
      });
  }

  static findSourceIdOfFeature(map, feature) {
    const allSources = Object.keys(map.getStyle().sources).filter((s) =>
      s.startsWith("source-")
    );

    if (feature.geometry.type === "Image") {
      const sourceId = allSources.find((e) => e == `source-${feature.id}`);
      return sourceId;
    }

    for (const sourceId of allSources) {
      // chỉ xét GeoJSON source
      const source = map.getSource(sourceId);
      if (!source) continue;
      const sourceData =
        source._data?.features || source._options?.data?.features;
      if (!sourceData?.length) continue;

      const matched = sourceData.find((f) => f.id === feature.id);
      if (matched) return sourceId;
    }

    return null;
  }

  static getSelectedElement({ map, setSelectedElement }) {
    map.on("click", (e) => {
      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = AppGlobals.getElements();
      if (!storedData?.length) return;

      const feature = this.findFeatureAtPoint(clickedLngLat, storedData);

      if (feature) {
        setSelectedElement(feature);
        map.dragPan.disable();
      } else {
        setSelectedElement(null);
        BoundingBox.clearBoundingBox(map, "selected");
        HandleDragging.removeHandlesPoint(map);
        RotateController.destroy(map);
        map.dragPan.enable();
      }
    });
  }

  static getDoubleClickSelection({ map, setSelectedElement }) {
    map.on("dblclick", (e) => {
      e.preventDefault();
      map.dragPan.disable();

      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = AppGlobals.getElements();
      if (!storedData?.length) return;

      const feature = this.findFeatureAtPoint(clickedLngLat, storedData);
      if (!feature) return;

      const sourceId = this.findSourceIdOfFeature(map, feature);
      if (!sourceId) return;

      setSelectedElement(feature); // set state app

      // Xử lý chuẩn hóa thành Polygon để vẽ bbox và xoay
      let targetPolygon = null;
      switch (feature.geometry.type) {
        case "Polygon":
        case "MultiPolygon":
        case "LineString":
          targetPolygon = feature;
          break;

        case "Image":
          if (feature.properties?.type === "image") {
            targetPolygon = ImageElement.convertPoligon(feature);
          }
          break;

        case "Point":
          const buffer = turf.buffer(feature, 0.0001, { units: "degrees" });
          if (buffer.geometry.type === "Polygon") {
            targetPolygon = buffer;
          }
          break;

        default:
          console.warn("Không hỗ trợ type:", feature.geometry.type);
      }

      if (targetPolygon) {
        BoundingBox.drawBoundingBox(targetPolygon, map, "selected");
        HandleDragging.newHandlesPoint(map, targetPolygon);
        RotateController.addHandle(map, targetPolygon);

        requestAnimationFrame(() => {
          handleMoveElement(map, feature, sourceId);
        });

        HandleDragging.dragHandlesPoint(map, sourceId);

        RotateController.setup(map, feature, (rotated) => {
          Selection.setSelectedData(map, rotated, sourceId); // cập nhật lại vào source
        });
      }
    });
  }
}
