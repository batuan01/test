import * as turf from "@turf/turf";
import { ZOOM_OVERVIEW } from "../utils";
import {
  isImageElement,
  isPolygonElement,
} from "../actions/element/typeChecks";

export class ConvertData {
  static filerZoomLayers(map, data) {
    if (!data.length) return [];
    const zoom = map.getZoom();

    const overviewFeatures = this.dataOverview(data);
    const detailFeatures = this.dataDetail(data);

    if (overviewFeatures.length === 0) return data;
    const features = zoom < ZOOM_OVERVIEW ? overviewFeatures : detailFeatures;

    return features;
  }

  static dataOverview(data) {
    if (!data.length) return [];
    return data.filter((f) => f.properties.layer === "overview");
  }

  static dataDetail(data) {
    if (!data.length) return [];
    return data.filter((f) => f.properties.layer !== "overview");
  }

  static filterPolygonElements(data) {
    if (!data.length) return [];

    return data.filter((f) => isPolygonElement(f));
  }

  static filterImageElements(data) {
    if (!data.length) return [];
    return data.filter((f) => isImageElement(f));
  }

  static convertLabel(polygonFeatures) {
    if (!polygonFeatures.length) return [];

    return polygonFeatures.map((poly) => {
      const center = turf.centroid(poly);
      return {
        ...poly,
        geometry: center.geometry,
      };
    });
  }

  static convertMultiLineToLine(pathElement) {
    const lineStrings = pathElement.geometry.coordinates.map((line) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: line,
      },
      properties: {},
    }));

    return {
      type: "FeatureCollection",
      features: lineStrings,
    };
  }
}
