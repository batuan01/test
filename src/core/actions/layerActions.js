export class LayerActions {
  static remove(map, sourceId, layerId) {
    this.removeLayer(map, layerId);
    this.removeSource(map, sourceId);
  }

  static removeLayer(map, layerId) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  static removeSource(map, sourceId) {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  static findFeatureSourceId(map, feature) {
    if (!feature || !map || map.getStyle().sources.length === 0) return null;
    const allSources = Object.keys(map.getStyle().sources).filter((s) =>
      s.startsWith("source-")
    );
    const sourceId = allSources.find((sourceId) => {
      const source = map.getSource(sourceId);
      if (source.type === "image") {
        const id = source.id.replace("source-", "");
        return feature.id === id;
      }
      const data = source?._data || source?._options?.data || source?.data;
      return data?.features?.some((f) => f.id === feature.id);
    });

    return sourceId ?? "";
  }

  static findFeatureLayerId(map, feature) {
    const layers = map
      .getStyle()
      .layers.filter(
        (l) => l.id.startsWith("layer-") || l.id.startsWith("layer-outline-")
      );

    const currentSourceId = this.findFeatureSourceId(map, feature);
    const id = currentSourceId.replace("source-", "");

    let layerIds = [];
    for (const layer of layers) {
      let idLayer = layer.id;
      if (idLayer.startsWith("layer-outline-")) {
        idLayer = idLayer.replace("layer-outline-", "");
      } else if (idLayer.startsWith("layer-")) {
        idLayer = idLayer.replace("layer-", "");
      }

      if (idLayer === id && !layerIds.includes(layer.id)) {
        layerIds.push(layer.id);
      }
    }

    return layerIds;
  }
}
