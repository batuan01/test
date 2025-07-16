import { LoadData } from "../actions/loadData";
import { AppGlobals } from "../globals";
import { ZOOM_OVERVIEW } from "../utils";
import { ConvertData } from "./convertData";
import { LabelElements } from "./label";

export class LoadData3D {
  static updateElementsByZoom(map, data) {
    const zoom = map.getZoom();
    const zoomFeatures = ConvertData.filerZoomLayers(map, data.features);

    const dataOverview = ConvertData.dataOverview(data.features);
    const dataDetail = ConvertData.dataDetail(data.features);

    const splitOverview = LoadData.splitFeatureGroups(dataOverview);
    const splitDetail = LoadData.splitFeatureGroups(dataDetail);
    const splitZoom = LoadData.splitFeatureGroups(zoomFeatures);

    const beforeLayerId = map.getLayer("layer-labels-text")
      ? "layer-labels-text"
      : "";

    // Thêm các khối chính (polygon hoặc image)
    splitZoom.forEach((group) => {
      this.AddFeature3D(group, map, group.features[0].id, beforeLayerId);
    });

    // cap nhật data hien tai
    AppGlobals.setElements(zoomFeatures);

    // Cập nhật label
    LabelElements.textLabels(map);
    LabelElements.imageLabels(map);

    // Cập nhật source label (text/image)
    const labelFeatures = ConvertData.convertLabel(
      ConvertData.filterPolygonElements(zoomFeatures)
    );
    this.updateLabelSource(map, "source-labels-text", labelFeatures);
    this.updateLabelSource(map, "source-labels-image", labelFeatures);

    if (splitOverview.length == 0) return;

    // Ẩn hoặc xoá layer/source dựa theo zoom
    const groupsToRemove = zoom > ZOOM_OVERVIEW ? splitOverview : splitDetail;
    console.log("groupsToRemove", groupsToRemove);
    groupsToRemove.forEach((group) => {
      const id = group.features[0].id;
      this.removeSourceAndLayer(map, `source-${id}`, `layer-${id}`);
    });
  }

  static AddFeature3D(group, map, id, beforeLayerId = "") {
    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;

    // Tránh tạo trùng
    if (map.getLayer(layerId) || map.getSource(sourceId)) return;

    const geometryType = group.sourceType;

    if (geometryType === "Polygon") {
      map.addSource(sourceId, {
        type: "geojson",
        data: group,
      });

      map.addLayer(
        {
          id: layerId,
          type: "fill-extrusion",
          source: sourceId,
          paint: {
            "fill-extrusion-color": ["get", "color"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 1,
          },
        },
        beforeLayerId
      );
    } else if (geometryType === "Image") {
      LoadData.AddFeature(group, map, id, beforeLayerId);
    }
  }

  static updateLabelSource(map, sourceId, features) {
    const source = map.getSource(sourceId);
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features,
      });
    }
  }

  static removeSourceAndLayer(map, sourceId, layerId) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }
}
