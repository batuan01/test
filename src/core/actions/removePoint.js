import { AppGlobals } from "../globals";
import { BoundingBox } from "./boundingBox";
import {
  isLineElement,
  isPathElement,
  isPolygonElement,
} from "./element/typeChecks";
import { HandleDragging } from "./handlesPoint";
import { LayerActions } from "./layerActions";
import { RotateController } from "./rotateElement";

export class RemovePoint {
  static targetPoint = null;
  static parentFeature = null;

  static setRemovePoint(map, e) {
    const featuresHandles = map.queryRenderedFeatures(e.point, {
      layers: ["handles-layer"],
    });

    if (!featuresHandles.length) return;

    const { parentId } = featuresHandles[0].properties;
    const allFeatures = AppGlobals.getElements();
    const targetFeature = allFeatures.find((f) => f.id === parentId);
    if (!targetFeature) return;

    this.targetPoint = featuresHandles[0];
    this.parentFeature = targetFeature;
  }

  static resetRemovePoint() {
    this.targetPoint = null;
    this.parentFeature = null;
  }

  static removeOnlyPoint(map) {
    if (!this.targetPoint || !this.parentFeature) return;

    if (
      !isPathElement(this.parentFeature) &&
      !isPolygonElement(this.parentFeature) &&
      !isLineElement(this.parentFeature)
    )
      return;

    const geometryType = this.parentFeature.geometry.type;
    const { index } = this.targetPoint.properties;
    const indexNum = Number(index);

    let coordinates = JSON.parse(
      JSON.stringify(this.parentFeature.geometry.coordinates)
    ); // deep clone

    // ==========================
    // ✅ POLYGON
    // ==========================
    if (geometryType === "Polygon") {
      let ring = coordinates[0];

      if (ring.length <= 4) {
        // Xoá toàn bộ polygon nếu không đủ điểm
        coordinates = [];
      } else {
        if (indexNum === 0) {
          // Xoá điểm đầu và cuối
          ring.splice(0, 1);
          ring.pop();
          const newFirst = ring[0];
          ring.push([...newFirst]);
        } else {
          ring.splice(indexNum, 1);
        }

        coordinates = [ring];
      }
    }

    // ==========================
    // ✅ LINESTRING
    // ==========================
    else if (geometryType === "LineString") {
      if (coordinates.length <= 2) {
        // Xoá toàn bộ line nếu không đủ điểm
        coordinates = [];
      } else {
        coordinates.splice(indexNum, 1);
      }
    }

    // ==========================
    // ✅ MULTILINESTRING
    // ==========================
    else if (geometryType === "MultiLineString") {
      const indexRaw = JSON.parse(index);
      const pointIndex = Number(indexRaw.pointIndex);
      const lineIndex = Number(indexRaw.lineIndex);

      const line = coordinates[lineIndex];

      if (!line) return;

      if (line.length <= 2) {
        // Xóa nguyên cả line nếu chỉ còn 2 điểm hoặc ít hơn
        coordinates.splice(lineIndex, 1);
      } else {
        // Chỉ xóa 1 điểm
        line.splice(pointIndex, 1);
        coordinates[lineIndex] = line;
      }
    }

    // ==========================
    // ✅ UPDATE
    // ==========================
    if (coordinates.length === 0) {
      const sourceId = LayerActions.findFeatureSourceId(
        map,
        this.parentFeature
      );
      const layerIds = LayerActions.findFeatureLayerId(map, this.parentFeature);
      for (const layer of layerIds) {
        LayerActions.removeLayer(map, layer);
      }

      LayerActions.removeSource(map, sourceId);

      HandleDragging.removeHandlesPoint(map);
      BoundingBox.clearBoundingBox(map, "selected");
      BoundingBox.clearBoundingBox(map, "hover");
      RotateController.destroy(map);

      AppGlobals.removeDataById(this.parentFeature.id);
    } else {
      const updatedFeature = {
        ...this.parentFeature,
        geometry: {
          ...this.parentFeature.geometry,
          coordinates,
        },
      };

      const sourceId = LayerActions.findFeatureSourceId(
        map,
        this.parentFeature
      );
      const source = map.getSource(sourceId);
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [updatedFeature],
        });
      }

      HandleDragging.newHandlesPoint(map, updatedFeature);
      AppGlobals.setDataToStore(updatedFeature);
    }
  }
}
