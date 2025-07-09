import * as turf from "@turf/turf";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils";
import {
  clearBoundingBox,
  drawBoundingBox,
  removeBBoxSelected,
} from "./boundingBox";
import { ImageElement } from "./image";
import { dragElement, handleMoveElement } from "./dragElement";
import {
  enableHandleDragging,
  getCornerHandles,
  HandleDragging,
} from "./handlesPoint";
import { RotateController } from "./rotateElement";
import { Selection } from "./selection";

export class SelectedSelection {
  static findFeatureAtPoint(point, features) {
    const clickedPoint = turf.point(point);

    return [...features].reverse().find((feature) => {
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
        const dist = turf.distance(clickedPoint, feature, { units: "meters" });
        return dist < 5; // Cho phép khoảng cách < 5m là "trúng"
      }

      return false;
    });
  }

  // static getSelectedElement({ map, setSelectedElement }) {
  //   map.on("click", (e) => {
  //     const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
  //     const storedData = loadFromLocalStorage();
  //     if (!storedData?.features?.length) return;

  //     const feature = this.findFeatureAtPoint(
  //       clickedLngLat,
  //       storedData.features
  //     );
  //     if (feature) {
  //       setSelectedElement(feature);
  //       drawBoundingBox(feature, map, "selected");
  //       map.dragPan.disable();
  //     } else {
  //       setSelectedElement(null);
  //       clearBoundingBox(map, "selected");
  //       HandleDragging.removeHandlesPoint(map);
  //       map.dragPan.enable();
  //     }
  //   });
  // }

  static getSelectedElement({ map, setSelectedElement }) {
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point); // lấy tất cả features dưới chuột

      if (!features || features.length === 0) {
        setSelectedElement(null);
        clearBoundingBox(map, "selected");
        HandleDragging.removeHandlesPoint(map);
        map.dragPan.enable();
        return;
      }

      // Ưu tiên chọn feature Polygon hoặc Image
      const targetFeature = features.find((f) =>
        ["Polygon", "Image"].includes(f.geometry?.type)
      );

      console.log("targetFeature", targetFeature);

      if (targetFeature) {
        setSelectedElement(targetFeature); // cập nhật feature được chọn
        drawBoundingBox(targetFeature, map, "selected");
        map.dragPan.disable();
      } else {
        setSelectedElement(null);
        clearBoundingBox(map, "selected");
        HandleDragging.removeHandlesPoint(map);
        map.dragPan.enable();
      }
    });
  }

  // static getDoubleClickSelection({ map, setSelectedElement }) {
  //   map.on("dblclick", (e) => {
  //     e.preventDefault();
  //     map.dragPan.disable();

  //     const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
  //     const storedData = loadFromLocalStorage();
  //     if (!storedData?.features?.length) return;

  //     const feature = this.findFeatureAtPoint(
  //       clickedLngLat,
  //       storedData.features
  //     );
  //     if (!feature) return;

  //     setSelectedElement(feature); // set state app

  //     let targetPolygon = null;
  //     switch (feature.geometry.type) {
  //       case "Polygon":
  //       case "MultiPolygon":
  //       case "LineString":
  //         targetPolygon = feature;
  //         break;
  //       case "Image":
  //         if (feature.properties?.type === "image") {
  //           targetPolygon = ImageElement.convertPoligon(feature);
  //         }
  //         break;
  //       case "Point":
  //         const buffer = turf.buffer(feature, 0.0001, { units: "degrees" });
  //         if (buffer.geometry.type === "Polygon") {
  //           targetPolygon = buffer;
  //         }
  //         break;
  //       default:
  //         console.warn("Không hỗ trợ type:", feature.geometry.type);
  //     }

  //     if (targetPolygon) {
  //       HandleDragging.newHandlesPoint(map, targetPolygon);
  //       requestAnimationFrame(() => {
  //         handleMoveElement(map, targetPolygon);
  //       });

  //       HandleDragging.dragHandlesPoint(map);

  //       // Khởi tạo xoay cho khối
  //       const controller = new RotateController(
  //         map,
  //         targetPolygon,
  //         (rotatedFeature) => {
  //           Selection.setSelectedData(map, rotatedFeature);
  //         }
  //       );
  //     }
  //   });
  // }

  static getDoubleClickSelection({ map, setSelectedElement }) {
    map.on("dblclick", (e) => {
      e.preventDefault();
      map.dragPan.disable();

      // Lấy tất cả features tại điểm double click
      const features = map.queryRenderedFeatures(e.point);
      if (!features || features.length === 0) return;

      // Ưu tiên chọn feature phù hợp (Polygon, Image,...)
      const feature = features.find((f) =>
        ["Polygon", "Image", "MultiPolygon", "LineString", "Point"].includes(
          f.geometry?.type
        )
      );
      if (!feature) return;

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
        HandleDragging.newHandlesPoint(map, targetPolygon);

        requestAnimationFrame(() => {
          handleMoveElement(map, targetPolygon);
        });

        HandleDragging.dragHandlesPoint(map);

        // Khởi tạo xoay
        const controller = new RotateController(
          map,
          targetPolygon,
          (rotatedFeature) => {
            Selection.setSelectedData(map, rotatedFeature); // cập nhật lại vào source
          }
        );
      }
    });
  }
}
