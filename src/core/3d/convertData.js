import * as turf from "@turf/turf";
import { ZOOM_OVERVIEW } from "../utils";

export class ConvertData {
  static filerZoomLayers(map, data) {
    if (!data.length) return [];
    const zoom = map.getZoom();

    const features =
      zoom < ZOOM_OVERVIEW
        ? data.filter((f) => f.properties.layer === "overview")
        : data.filter((f) => f.properties.layer !== "overview");

    return features;
  }

  static dataOverview(data){
    if (!data.length) return [];
    return data.filter((f) => f.properties.layer === "overview");
  }

  static dataDetail(data){
    if (!data.length) return [];
    return data.filter((f) => f.properties.layer !== "overview");
  }

  static filterPolygonElements(data) {
    if (!data.length) return [];

    return data.filter((f) => f.geometry?.type === "Polygon");
  }

  static filterImageElements(data) {
    if (!data.length) return [];
    return data.filter((f) => f.geometry?.type === "Image");
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
}
