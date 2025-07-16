import * as turf from "@turf/turf";
import { BoundingBox } from "./boundingBox";
import { HandleDragging } from "./handlesPoint";
import { AppGlobals } from "../globals";
import { ImageElement } from "./image";

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
    const type = polygonFeature.geometry.type;
    if (type === "Image") {
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

    const type = this.polygonFeature.geometry.type;
    if (type === "Image") {
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

    const feature =
      this.polygonFeature.geometry.type === "Image"
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
    if (map.getLayer("rotate-handle-layer")) {
      map.removeLayer("rotate-handle-layer");
    }
    if (map.getSource("rotate-handle")) {
      map.removeSource("rotate-handle");
    }
  }

  static angleTo(point) {
    const dx = point[0] - this.center[0];
    const dy = point[1] - this.center[1];
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }
}

// import * as turf from "@turf/turf";
// import { BoundingBox } from "./boundingBox";
// import { HandleDragging } from "./handlesPoint";
// import { AppGlobals } from "../globals";
// import { ImageElement } from "./image";

// export class RotateController {
//   static handle = null;
//   static startAngle = null;
//   static center = null;
//   static polygonFeature = null;
//   static map = null;
//   static onUpdate = null;

//   static setup(map, polygonFeature, onUpdate) {
//     this.map = map;
//     this.polygonFeature = polygonFeature;
//     this.onUpdate = onUpdate;

//     const type = polygonFeature.geometry.type;
//     if (type === "Image") {
//       const convertedFeature = ImageElement.convertPoligon(polygonFeature);
//       this.center = turf.centroid(convertedFeature).geometry.coordinates;
//     } else {
//       this.center = turf.centroid(polygonFeature).geometry.coordinates;
//     }

//     this.bindEvents();
//   }

//   static addHandle(map, polygonFeature) {
//     if (!polygonFeature || !map) return;

//     const coords =
//       polygonFeature.geometry.type === "Image"
//         ? polygonFeature.geometry.coordinates
//         : BoundingBox.getMinimumRotatedBBox(polygonFeature).geometry
//             .coordinates;

//     const points = coords[0];
//     const firstPoint = points[0];
//     const secondPoint = points[1];

//     const midX = (firstPoint[0] + secondPoint[0]) / 2;
//     const midY = (firstPoint[1] + secondPoint[1]) / 2;

//     const dx = secondPoint[0] - firstPoint[0];
//     const dy = secondPoint[1] - firstPoint[1];
//     const length = Math.sqrt(dx * dx + dy * dy);
//     const normal = [dy / length, -dx / length];

//     const distance = turf.distance(firstPoint, secondPoint, {
//       units: "meters",
//     });
//     const offsetMeters = distance / 6;
//     const offsetLng = normal[0] * (offsetMeters / 111320);
//     const offsetLat = normal[1] * (offsetMeters / 111320);
//     const handleCoord = [midX + offsetLng, midY + offsetLat];

//     this.handle = turf.point(handleCoord, { type: "rotate-handle" });

//     const data = {
//       type: "FeatureCollection",
//       features: [this.handle],
//     };

//     const source = map.getSource("rotate-handle");

//     if (source) {
//       source.setData(data);
//     } else {
//       map.addSource("rotate-handle", {
//         type: "geojson",
//         data,
//       });

//       map.addLayer({
//         id: "rotate-handle-layer",
//         type: "circle",
//         source: "rotate-handle",
//         paint: {
//           "circle-radius": 6,
//           "circle-color": "#00f",
//           "circle-stroke-width": 2,
//           "circle-stroke-color": "#fff",
//         },
//       });
//     }
//   }

//   static bindEvents() {
//     this.map.on("mousedown", this.onMouseDown);
//   }

//   static onMouseDown = (e) => {
//     const point = [e.lngLat.lng, e.lngLat.lat];
//     const pt = turf.point(point);

//     const isOnHandle = turf.booleanPointInPolygon(
//       pt,
//       turf.buffer(this.handle, 0.0002, { units: "degrees" })
//     );
//     if (!isOnHandle) return;

//     this.map.getCanvas().style.cursor = "grabbing";
//     this.map.dragPan.disable();

//     this.startAngle = this.angleTo(point);

//     this.map.on("mousemove", this.onMouseMove);
//     this.map.once("mouseup", this.onMouseUp);
//     BoundingBox.clearBoundingBox(this.map, "selected");
//     HandleDragging.removeHandlesPoint(this.map);
//   };

//   static onMouseMove = (e) => {
//     const currentPoint = [e.lngLat.lng, e.lngLat.lat];
//     const currentAngle = this.angleTo(currentPoint);
//     const angleDelta = currentAngle - this.startAngle;

//     const type = this.polygonFeature.geometry.type;

//     if (type === "Image") {
//       const convertedFeature = ImageElement.convertPoligon(this.polygonFeature);
//       const rotatedCoords = turf.transformRotate(
//         convertedFeature,
//         -angleDelta,
//         { pivot: this.center }
//       ).geometry.coordinates[0];

//       const imageUrl = this.polygonFeature.properties?.imageUrl;
//       const sourceId =
//         this.polygonFeature.source || `source-${this.polygonFeature.id}`;
//       const source = this.map.getSource(sourceId);

//       if (source && imageUrl) {
//         source.setCoordinates(rotatedCoords);
//       }

//       this.polygonFeature.geometry.coordinates = rotatedCoords;
//     } else {
//       const rotated = turf.transformRotate(this.polygonFeature, -angleDelta, {
//         pivot: this.center,
//         mutate: false,
//       });
//       this.polygonFeature = rotated;
//     }

//     this.startAngle = currentAngle;

//     // Xoay handle
//     const rotatedHandle = turf.transformRotate(this.handle, -angleDelta, {
//       pivot: this.center,
//       mutate: false,
//     });
//     this.handle = rotatedHandle;

//     this.updateHandle(rotatedHandle);
//     this.onUpdate?.(this.polygonFeature);
//   };

//   static onMouseUp = () => {
//     this.map.getCanvas().style.cursor = "";
//     this.map.dragPan.enable();
//     this.map.off("mousemove", this.onMouseMove);

//     BoundingBox.drawBoundingBox(this.polygonFeature, this.map, "selected");
//     HandleDragging.newHandlesPoint(this.map, this.polygonFeature);

//     AppGlobals.setDataToStore(this.polygonFeature);
//   };

//   static updateHandle(rotatedPoint = this.handle) {
//     const source = this.map.getSource("rotate-handle");
//     if (source) {
//       source.setData({
//         type: "FeatureCollection",
//         features: [rotatedPoint],
//       });
//     }
//   }

//   static destroy(map) {
//     if (map.getLayer("rotate-handle-layer")) {
//       map.removeLayer("rotate-handle-layer");
//     }
//     if (map.getSource("rotate-handle")) {
//       map.removeSource("rotate-handle");
//     }
//   }

//   static angleTo(point) {
//     const dx = point[0] - this.center[0];
//     const dy = point[1] - this.center[1];
//     return (Math.atan2(dy, dx) * 180) / Math.PI;
//   }
// }
