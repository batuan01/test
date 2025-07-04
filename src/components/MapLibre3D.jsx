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

const MapLibre3D = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = createMap({
      mapContainer: mapContainer.current,
      pitchWithRotate: true,
      dragRotate: true,
      pitch: 45,
    });
    mapRef.current = map;

    map.on("load", () => {
      const storedData = loadFromLocalStorage();

      const polygonFeatures = storedData.features.filter(
        (f) => f.geometry?.type === "Polygon"
      );

      const imageFeatures = storedData.features.filter(
        (f) => f.geometry?.type === "Image"
      );

      if (polygonFeatures.length) {
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
            "fill-extrusion-opacity": 0.85,
          },
        });
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
