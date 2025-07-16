export class RouteLayer {
  static add(map, coordinates) {
    const lineFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates,
      },
      properties: {},
    };

    if (!map.getSource("route")) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [lineFeature],
        },
      });

      map.addLayer({
        id: "route-layer",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff5c5c",
          "line-width": 8,
        },
      });
    } else {
      // Nếu source đã tồn tại thì chỉ update lại
      map.getSource("route").setData({
        type: "FeatureCollection",
        features: [lineFeature],
      });
    }
  }

  static remove(map) {
    if (map.getLayer("route-layer")) {
      map.removeLayer("route-layer");
    }
    if (map.getSource("route")) {
      map.removeSource("route");
    }
  }
}
