// Map3DView.tsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import geojsonData from "../data/data.geojson"; // 👈 import đúng đường dẫn của bạn
import { createMap } from "../core/actions/map";
import { loadFromLocalStorage } from "../core/utils";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { LoadData } from "../core/actions/loadData";
import * as turf from "@turf/turf";
import booths from "../data/boothsjson.json";

// const booths = require("../data/booths.geojson");

const MapLibre3D = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const storedData = loadFromLocalStorage();

  const polygonFeatures = storedData.features.filter(
    (f) => f.geometry?.type === "Polygon"
  );

  const imageFeatures = storedData.features.filter(
    (f) => f.geometry?.type === "Image"
  );

  const labelFeatures = polygonFeatures.map((poly) => {
    const center = turf.centroid(poly);
    const height = poly.properties?.height ?? 0;
    return {
      type: "Feature",
      geometry: center.geometry,
      properties: {
        label: poly.properties.label,
        height, // nếu bạn muốn xử lý text-offset theo height
        labelOffset: -height,
      },
    };
  });

  useEffect(() => {
    const map = createMap({
      mapContainer: mapContainer.current,
      pitchWithRotate: true,
      dragRotate: true,
      pitch: 45,
      bearing: -33.5,
    });
    mapRef.current = map;

    map.on("load", () => {
      if (polygonFeatures.length) {
        // map.addSource("polygons", {
        //   type: "geojson",
        //   data: {
        //     type: "FeatureCollection",
        //     features: booths.features,
        //   },
        // });
        map.addSource("polygons", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: polygonFeatures,
          },
        });

        map.addLayer({
          id: "polygons-3d",
          type: "fill-extrusion",
          source: "polygons",
          paint: {
            "fill-extrusion-color": ["get", "color"], // ✅ Lấy từ properties.color
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 1,
          },
        });

        if (!map.getSource("polygon-labels-src")) {
          map.addSource("polygon-labels-src", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: labelFeatures,
            },
          });
        }

        // Add symbol layer
        if (!map.getLayer("polygons-labels")) {
          // map.addLayer({
          //   id: "polygons-labels",
          //   type: "symbol",
          //   source: "polygon-labels-src",
          //   layout: {
          //     "text-field": ["get", "label"],
          //     "text-size": [
          //       "interpolate",
          //       ["linear"],
          //       ["zoom"],
          //       15,
          //       10,
          //       18,
          //       16,
          //     ],
          //     // "text-offset": [
          //     //   "interpolate",
          //     //   ["linear"],
          //     //   ["get", "height"],
          //     //   0,
          //     //   ["literal", [0, 0]],
          //     //   20,
          //     //   ["literal", [0, -10]],
          //     //   40,
          //     //   ["literal", [0, -20]],
          //     //   60,
          //     //   ["literal", [0, -30]],
          //     // ],
          //     // "text-offset": ["literal", [0, ["*", ["get", "height"], -1]]],
          //     "text-offset": [
          //       "interpolate",
          //       ["linear"],
          //       ["get", "height"],
          //       0,
          //       ["literal", [0, 0]],
          //       100,
          //       ["literal", [0, -10]],
          //     ],

          //     "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          //     "text-allow-overlap": true,
          //   },
          //   paint: {
          //     "text-color": "#ffffff",
          //     "text-halo-color": "#000000",
          //     "text-halo-width": 1,
          //   },
          // });
          // map.addLayer({
          //   id: "polygons-labels",
          //   type: "symbol",
          //   source: "polygon-labels-src",
          //   // layout: {
          //   //   "text-field": ["get", "label"],
          //   //   "text-size": 12,
          //   //   // "text-offset": ["literal", [0, -40]], // dịch lên nhẹ
          //   //   // "text-offset": ["get", "labelOffset"],
          //   //   "text-font": ["Open Sans Bold"],
          //   //   "text-allow-overlap": true,
          //   // },
          //   // paint: {
          //   //   "text-color": "#ffffff",
          //   //   "text-halo-color": "#000000",
          //   //   "text-halo-width": 1,
          //   //   // "text-translate": [
          //   //   //   "interpolate",
          //   //   //   ["linear"],
          //   //   //   ["zoom"],
          //   //   //   15,
          //   //   //   ["literal", [0, ["*", ["get", "height"], -0.5]]], // hoặc -1
          //   //   //   18,
          //   //   //   ["literal", [0, ["*", ["get", "height"], -1]]],
          //   //   // ],

          //   //   // "text-translate": [
          //   //   //   "literal",
          //   //   //   [0, ["*", ["get", "labelOffset"], -0.5]],
          //   //   // ],
          //   //   // "text-translate": [0, -500],
          //   //   "text-translate": [
          //   //     "interpolate",
          //   //     ["linear"],
          //   //     ["zoom"],
          //   //     8,
          //   //     ["literal", [0, 0]],
          //   //     17,
          //   //     ["literal", [-20, -20]],
          //   //   ],
          //   //   "text-translate-anchor": "viewport",
          //   // },
          //   layout: {
          //     "text-field": ["format", ["get", "label"], { "font-scale": 1 }],
          //     "text-size": [
          //       "interpolate",
          //       ["linear"],
          //       ["zoom"],
          //       15,
          //       0,
          //       15.5,
          //       4,
          //       16,
          //       6,
          //       16.5,
          //       8,
          //       17,
          //       10,
          //       17.5,
          //       12,
          //       18,
          //       14,
          //       18.5,
          //       16,
          //       19,
          //       18,
          //     ],
          //     // 'text-anchor': 'bottom', // Đặt text-anchor là 'bottom' để đẩy văn bản lên đỉnh các tòa nhà
          //     "text-offset": [
          //       "interpolate",
          //       ["linear"],
          //       ["zoom"],
          //       15,
          //       ["literal", [0, 0]],
          //       16,
          //       ["literal", [0, -2]],
          //       17,
          //       ["literal", [0, -2.5]],
          //       18,
          //       ["literal", [0, -3.5]],
          //       20,
          //       ["literal", [0, -8.5]],
          //       25,
          //       ["literal", [0, -10.5]],
          //     ],
          //     // 'text-offset': ['literal', [0, -3]],
          //     // "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"], // Đặt kiểu chữ đậm
          //   },
          // });

          // map.addLayer({
          //   id: "off-leash-areas",
          //   type: "symbol",
          //   source: "polygon-labels-src",
          //   layout: {
          //     "icon-image": "dog_park",
          //     "text-field": [
          //       "format",
          //       ["upcase", ["get", "label"]],
          //       // { "font-scale": 0.8 },
          //       // "\n",
          //       // {},
          //       // ["downcase", ["get", "label"]],
          //       // { "font-scale": 0.6 },
          //     ],
          //     "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          //     "text-offset": [0, 0.6],
          //     "text-anchor": "top",
          //     "text-size": 12,
          //   },
          // });

          map.addLayer({
            id: "polygon-labels",
            type: "symbol",
            source: "polygon-labels-src",
            layout: {
              "text-field": ["get", "label"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-size": 12, // 👈 Luôn giữ cố định kích thước
              "text-anchor": "top",
              // "text-allow-overlap": true,
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 1,
              // 👇 dịch label lên phía trên (gần giống chiều cao khối)
              "text-translate": ["literal", [0, -20]], // dịch lên theo pixel (tạm)
            },
          });
        }
      }

      if (imageFeatures.length) {
        imageFeatures.forEach((f) => {
          LoadData.AddFeature(f, map);
        });
      }
    });

    return () => map.remove();
  }, []);

  const handleGoTo2D = () => {
    navigate("/");
  };

  const logdata = () => {
    // const draw = drawRef.current;
    // const geojson = draw.getFeatures();
    // console.log("geojson", geojson);
    console.log(mapRef.current.getStyle());
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapContainer} style={{ height: "100%" }} />

      <FormProperty>
        <SubmitButton onClick={handleGoTo2D}>2D</SubmitButton>
        <button type="button" onClick={logdata}>
          Save
        </button>
      </FormProperty>
    </div>
  );
};

export default MapLibre3D;

const FormProperty = styled.div`
  position: absolute;
  top: 40px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px;
  width: 300px;
  text-align: center;
`;

const SubmitButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }

  a {
    text-decoration: none;
    color: white;
  }
`;
