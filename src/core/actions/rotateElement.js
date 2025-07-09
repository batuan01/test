import * as turf from "@turf/turf";
import { updateBoundingBoxes } from "./boundingBox";

export class RotateController {
  constructor(map, polygonFeature, onUpdate) {
    this.map = map;
    this.feature = polygonFeature;
    this.onUpdate = onUpdate;
    this.center = turf.centroid(this.feature).geometry.coordinates;
    this.handle = null;
    this.startAngle = null;
    this.init();
  }

  init() {
    this.addHandle();
    this.bindEvents();
  }

  addHandle() {
    if (!this.feature || !this.map) return;

    const bbox = turf.bbox(this.feature); // [minX, minY, maxX, maxY]
    const bboxPolygon = turf.bboxPolygon(bbox);

    // Lấy trung điểm của cạnh trên
    const [minX, minY, maxX, maxY] = bbox;
    const midX = (minX + maxX) / 2;
    const midY = maxY; // Cạnh trên (có giá trị lat lớn nhất)

    // Offset nhẹ lên trên bbox để handle nằm ngoài một chút
    const offset = 0.0002; // có thể điều chỉnh
    const handleCoord = [midX, midY + offset];

    // Tạo handle point
    this.handle = turf.point(handleCoord, { type: "rotate-handle" });

    // Tạo dữ liệu geojson
    const data = {
      type: "FeatureCollection",
      features: [this.handle],
    };

    const source = this.map.getSource("rotate-handle");

    if (source) {
      source.setData(data);
    } else {
      this.map.addSource("rotate-handle", {
        type: "geojson",
        data,
      });

      this.map.addLayer({
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

  bindEvents() {
    this.map.on("mousedown", this.onMouseDown);
  }

  onMouseDown = (e) => {
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
  };

  onMouseMove = (e) => {
    const currentPoint = [e.lngLat.lng, e.lngLat.lat];
    const currentAngle = this.angleTo(currentPoint);
    const angleDelta = currentAngle - this.startAngle;

    const rotated = turf.transformRotate(this.feature, -angleDelta, {
      pivot: this.center,
      mutate: false,
    });

    this.startAngle = currentAngle;
    this.feature = rotated;

    this.onUpdate(rotated);
    this.updateHandle();

    // updateBoundingBoxes(this.map, rotated);
  };

  onMouseUp = () => {
    this.map.getCanvas().style.cursor = "";
    this.map.dragPan.enable();
    this.map.off("mousemove", this.onMouseMove);
  };

  updateHandle() {
    if (!this.feature || !this.map) return;

    const bbox = turf.bbox(this.feature); // [minX, minY, maxX, maxY]
    const [minX, minY, maxX, maxY] = bbox;
    const midX = (minX + maxX) / 2;
    const midY = maxY;

    const offset = 0.0005; // đẩy ra ngoài một chút
    const handleCoord = [midX, midY + offset];

    const newHandle = turf.point(handleCoord, { type: "rotate-handle" });
    this.handle = newHandle;

    const source = this.map.getSource("rotate-handle");
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [newHandle],
      });
    }
  }

  destroy() {
    this.map.off("mousedown", this.onMouseDown);
    this.map.off("mousemove", this.onMouseMove);
    this.map.off("mouseup", this.onMouseUp);

    if (this.map.getLayer("rotate-handle-layer")) {
      this.map.removeLayer("rotate-handle-layer");
    }
    if (this.map.getSource("rotate-handle")) {
      this.map.removeSource("rotate-handle");
    }
  }

  angleTo(point) {
    const dx = point[0] - this.center[0];
    const dy = point[1] - this.center[1];
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }
}
