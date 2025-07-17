import * as turf from "@turf/turf";
import { AppGlobals } from "../globals";
import { BoundingBox } from "./boundingBox";
import { HandleDragging } from "./handlesPoint";
import { ImageElement } from "./image";
import { LayerActions } from "./layerActions";
import { isImageElement } from "./element/typeChecks";

export class RotateController {
  static handle = null;
  static startAngle = null;
  static center = null;
  static polygonFeature = null;
  static map = null;
  static onUpdate = null;

  static setup(map, polygonFeature, onUpdate) {
    this.map = map;
    this.polygonFeature = polygonFeature;
    this.onUpdate = onUpdate;
    if (isImageElement(polygonFeature)) {
      const convertedFeature = ImageElement.convertPoligon(polygonFeature);
      this.center = turf.centroid(convertedFeature).geometry.coordinates;
    } else {
      this.center = turf.centroid(polygonFeature).geometry.coordinates;
    }

    this.bindEvents();
  }

  static addHandle(map, polygonFeature) {
    if (!polygonFeature || !map) return;

    const bboxPolygons = BoundingBox.getMinimumRotatedBBox(polygonFeature);
    if (!bboxPolygons) return;
    const coords = bboxPolygons.geometry.coordinates[0];
    const firstPoint = coords[0];
    const secondPoint = coords[1];

    const midX = (firstPoint[0] + secondPoint[0]) / 2;
    const midY = (firstPoint[1] + secondPoint[1]) / 2;

    const dx = secondPoint[0] - firstPoint[0];
    const dy = secondPoint[1] - firstPoint[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    const normal = [dy / length, -dx / length];

    const distance = turf.distance(firstPoint, secondPoint, {
      units: "meters",
    });
    const offsetMeters = distance / 6;
    const offsetLng = normal[0] * (offsetMeters / 111320);
    const offsetLat = normal[1] * (offsetMeters / 111320);
    const handleCoord = [midX + offsetLng, midY + offsetLat];

    this.handle = turf.point(handleCoord, { type: "rotate-handle" });

    const data = {
      type: "FeatureCollection",
      features: [this.handle],
    };

    const source = map.getSource("rotate-handle");

    if (source) {
      source.setData(data);
    } else {
      map.addSource("rotate-handle", {
        type: "geojson",
        data,
      });

      map.addLayer({
        id: "rotate-handle-layer",
        type: "circle",
        source: "rotate-handle",
        paint: {
          "circle-radius": 6,
          "circle-color": "#00f",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }
  }

  static bindEvents() {
    this.map.on("mousedown", this.onMouseDown);
  }

  static onMouseDown = (e) => {
    const point = [e.lngLat.lng, e.lngLat.lat];
    const pt = turf.point(point);

    const isOnHandle = turf.booleanPointInPolygon(
      pt,
      turf.buffer(this.handle, 0.0002, { units: "degrees" })
    );
    if (!isOnHandle) return;

    this.map.getCanvas().style.cursor = "grabbing";
    this.map.dragPan.disable();

    this.startAngle = this.angleTo(point);

    this.map.on("mousemove", this.onMouseMove);
    this.map.once("mouseup", this.onMouseUp);
    BoundingBox.clearBoundingBox(this.map, "selected");
    HandleDragging.removeHandlesPoint(this.map);
  };

  static onMouseMove = (e) => {
    const currentPoint = [e.lngLat.lng, e.lngLat.lat];
    const currentAngle = this.angleTo(currentPoint);
    const angleDelta = currentAngle - this.startAngle;

    if (isImageElement(this.polygonFeature)) {
      const convertedFeature = ImageElement.convertPoligon(this.polygonFeature);
      const rotatedCoords = turf.transformRotate(
        convertedFeature,
        -angleDelta,
        { pivot: this.center }
      );

      const convertedImage = ImageElement.convertImage(rotatedCoords);
      this.polygonFeature.geometry.coordinates =
        convertedImage.geometry.coordinates;
    } else {
      const rotated = turf.transformRotate(this.polygonFeature, -angleDelta, {
        pivot: this.center,
        mutate: false,
      });
      this.polygonFeature = rotated;
    }

    this.startAngle = currentAngle;

    const rotatedHandle = turf.transformRotate(this.handle, -angleDelta, {
      pivot: this.center,
      mutate: false,
    });

    this.handle = rotatedHandle;
    this.updateHandle(rotatedHandle);
    this.onUpdate?.(this.polygonFeature);
  };

  static onMouseUp = () => {
    this.map.getCanvas().style.cursor = "";
    this.map.dragPan.enable();
    this.map.off("mousemove", this.onMouseMove);

    const feature = isImageElement(this.polygonFeature)
      ? ImageElement.convertPoligon(this.polygonFeature)
      : this.polygonFeature;

    BoundingBox.drawBoundingBox(feature, this.map, "selected");
    HandleDragging.newHandlesPoint(this.map, this.polygonFeature);
    AppGlobals.setDataToStore(this.polygonFeature);
  };

  static updateHandle(rotatedPoint = this.handle) {
    const source = this.map.getSource("rotate-handle");
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [rotatedPoint],
      });
    }
  }

  static destroy(map) {
    const sourceId = "rotate-handle";
    const layerId = "rotate-handle-layer";

    LayerActions.remove(map, sourceId, layerId);
  }

  static angleTo(point) {
    const dx = point[0] - this.center[0];
    const dy = point[1] - this.center[1];
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }
}
