import * as turf from "@turf/turf";
import {
  deepEqual,
  loadFromLocalStorage,
  saveToLocalStorage,
  updateFeatureInLocalStorage,
} from "../utils";
import {
  clearBoundingBox,
  drawBoundingBox,
  removeBBoxSelected,
  updateBoundingBoxes,
} from "./boundingBox";
import { Selection } from "./selection";
import { HandleDragging } from "./handlesPoint";
import { SelectedSelection } from "./selectedElement";

/**
 * Kéo polygon theo con trỏ – mượt 60 fps
 * @param {maplibregl.Map}  map
 * @param {GeoJSON.Feature} feature    Polygon cần kéo
 * @param {(feat)=>void}    onUpdate   Callback (gọi setData) mỗi frame
 * @returns {Function}      cleanup()  Huỷ listener khi không cần nữa
 */
export function dragElement(map, feature, onUpdate) {
  /* --------------------------------------------------------------------- */
  // State tạm
  let isDragging = false;
  let isMove = false;
  let startLngLat = null; // vị trí chuột lúc Mousedown
  const stored = loadFromLocalStorage();
  if (!stored || !stored.features) return;

  let currentFeature = feature;

  // Offset (độ) tính từ vị trí bắt đầu
  let dx = 0,
    dy = 0;
  let rafId = null;

  /* --------------------------------------------------------------------- */
  /** Dựng polygon đã di chuyển theo offset hiện tại */
  const buildMoved = () => {
    const original = loadFromLocalStorage().features.find(
      (f) => f.id === feature.id
    );
    let coords = original.geometry.coordinates;
    const geomType = currentFeature.geometry.type;
    if (geomType === "LineString") {
      coords = [coords];
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: coords.map((ring) =>
            ring.map(([lng, lat]) => [lng + dx, lat + dy])
          )[0],
        },
      };
    }

    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: coords.map((ring) =>
          ring.map(([lng, lat]) => [lng + dx, lat + dy])
        ),
      },
    };
  };

  /** Render đúng 1 lần / frame */
  const render = () => {
    const moved = buildMoved();
    currentFeature = moved; // ✅ lưu polygon mới nhất
    onUpdate(moved);

    Selection.setHandlesData(map, moved);
    updateBoundingBoxes(map, moved);

    rafId = null;
  };

  /* --------------------------------------------------------------------- */
  // Handlers
  const onMouseDown = (e) => {
    const point = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const geomType = currentFeature.geometry.type;

    let isInside = false;

    switch (geomType) {
      case "Polygon":
        isInside = turf.booleanPointInPolygon(point, currentFeature);
        break;

      case "LineString": {
        const distance = turf.pointToLineDistance(point, currentFeature, {
          units: "meters",
        });
        isInside = distance < 5;
        break;
      }

      case "Point": {
        const distance = turf.distance(point, currentFeature, {
          units: "meters",
        });
        isInside = distance < 5;
        break;
      }

      case "Image": {
        const coords = [...currentFeature.geometry.coordinates];
        coords.push(coords[0]); // đóng vòng
        const polygon = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        };
        isInside = turf.booleanPointInPolygon(point, polygon);
        break;
      }

      default:
        isInside = false;
        break;
    }

    if (!isInside) return;

    isDragging = true;
    startLngLat = e.lngLat;

    map.getCanvas().style.cursor = "move";
    map.dragPan.disable();
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    // Tính offset so với vị trí mousedown
    dx = e.lngLat.lng - startLngLat.lng;
    dy = e.lngLat.lat - startLngLat.lat;

    // Đảm bảo setData tối đa 1 lần / frame
    if (!rafId) rafId = requestAnimationFrame(render);
    isMove = true;
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;

    // Bắt buộc render frame cuối cùng nếu còn treo
    if (rafId) {
      cancelAnimationFrame(rafId);
      render();
    }

    map.getCanvas().style.cursor = "";
    map.dragPan.enable();

    if (isMove) {
      // ---------------- Lưu kết quả ----------------
      updateFeatureInLocalStorage(currentFeature);
      isMove = false;
    }

    // Reset biến tạm
    startLngLat = null;
    isDragging = false;
    dx = dy = 0;
  };

  /* --------------------------------------------------------------------- */
  // Gắn / gỡ listener
  map.on("mousedown", onMouseDown);
  map.on("mousemove", onMouseMove);
  map.on("mouseup", onMouseUp);

  // return function cleanup() {
  //   map.off("mousedown", onMouseDown);
  //   map.off("mousemove", onMouseMove);
  //   map.off("mouseup", onMouseUp);
  //   if (rafId) cancelAnimationFrame(rafId);
  // };

  return () => {
    map.off("mousedown", onMouseDown);
    map.off("mousemove", onMouseMove);
    map.off("mouseup", onMouseUp);
  };
}

export const handleMoveElement = (map, targetPolygon) => {
  if (!targetPolygon) return;

  try {
    dragElement(map, targetPolygon, (movedFeature) => {
      Selection.setSelectedData(map, movedFeature);
    });
  } catch (error) {
    console.log(error);
  }
};
