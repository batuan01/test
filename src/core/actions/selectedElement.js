import * as turf from "@turf/turf";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils";
import { clearBoundingBox, drawBoundingBox } from "./boundingBox";
import { ImageElement } from "./image";
import { dragElement, handleMoveElement } from "./dragElement";
import {
  enableHandleDragging,
  getCornerHandles,
  HandleDragging,
} from "./handlesPoint";

export class SelectedSelection {
  static findFeatureAtPoint(point, features) {
    return [...features].reverse().find((feature) => {
      if (feature.geometry.type === "Polygon") {
        return turf.booleanPointInPolygon(point, feature);
      }

      if (
        feature.geometry.type === "Image" &&
        feature.properties?.type === "image"
      ) {
        const polygon = {
          type: "Polygon",
          coordinates: [
            [...feature.geometry.coordinates, feature.geometry.coordinates[0]],
          ],
        };
        return turf.booleanPointInPolygon(point, polygon);
      }

      return false;
    });
  }

  static getSelectedElement({ map, setSelectedElement }) {
    map.on("click", (e) => {
      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = loadFromLocalStorage();
      if (!storedData?.features?.length) return;

      const feature = this.findFeatureAtPoint(
        clickedLngLat,
        storedData.features
      );
      if (feature) {
        setSelectedElement(feature);
        map.dragPan.disable();
      } else {
        clearBoundingBox(map, "selected");
        HandleDragging.clearHandlesPoint(map);
        map.dragPan.enable();
      }
    });
  }

  static getDoubleClickSelection({ map, setSelectedElement }) {
    map.on("dblclick", (e) => {
      e.preventDefault(); // Ngăn zoom mặc định
      map.dragPan.disable();
      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = loadFromLocalStorage();
      if (!storedData?.features?.length) return;

      const feature = this.findFeatureAtPoint(
        clickedLngLat,
        storedData.features
      );

      if (feature) {
        setSelectedElement(feature);

        // ✅ Sau khi set selected thì vẽ Bounding Box
        let targetPolygon = null;

        if (feature.geometry.type === "Polygon") {
          targetPolygon = feature;
        } else if (
          feature.geometry.type === "Image" &&
          feature.properties?.type === "image"
        ) {
          targetPolygon = ImageElement.convertPoligon(feature);
        }

        if (targetPolygon) {
          drawBoundingBox(targetPolygon, map, "selected");

          handleMoveElement(map, targetPolygon);

          // Sau khi select feature

          // 2. Kích hoạt kéo
        //   HandleDragging.dragHandlesPoint(map, targetPolygon);
        }
      }
    });
  }
}
