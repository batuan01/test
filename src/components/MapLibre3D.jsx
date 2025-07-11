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
  const markersRef = useRef(new Map());

  // const storedData = loadFromLocalStorage();
  const storedData = booths;

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
          map.addLayer({
            id: "polygon-labels",
            type: "symbol",
            source: "polygon-labels-src",
            layout: {
              "text-field": ["get", "label"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              // "text-size": 12, // 👈 Luôn giữ cố định kích thước
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                10,
                15.5,
                11,
                16,
                12,
                16.5,
                13,
                17,
                14,
                17.5,
                15,
                18,
                16,
              ],
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
          const data = {
            type: "FeatureCollection",
            sourceType: "Image",
            features: [f],
          };
          LoadData.AddFeature(data, map);
        });
      }

      labelFeatures.slice(0, 100).forEach((f) => {
        const img = document.createElement("img");
        img.src =
          "https://d1hjkbq40fs2x4.cloudfront.net/2017-08-21/files/landscape-photography_1645-t.jpg";
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.borderRadius = "5px"; // nếu muốn bo tròn
        img.style.border = "1px solid white"; // tuỳ chọn

        // Thêm marker vào map
        new maplibregl.Marker({ element: img })
          .setLngLat(f.geometry.coordinates)
          .addTo(map);
      });
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
