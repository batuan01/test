// // MapDraw.tsx
// import React, { useContext, useEffect, useRef, useState } from "react";

// // @ts-ignore: TerraDraw is a UMD global so we import it this way
// import { createMap } from "../core/actions/map";
// import { Terradraw } from "../core/actions/draw";
// import { Link, useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import { BasicComponent } from "./right-panel/BasicComponent";
// import {
//   clearAllFeatures,
//   Keyboard,
//   selectAllFeatures,
// } from "../core/actions/key";
// import {
//   drawBoundingBox,
//   hoverBBoxSelected,
// } from "../core/actions/boundingBox";
// import { calculateImageBounds, loadFromLocalStorage } from "../core/utils";
// import { LoadData } from "../core/actions/loadData";
// import * as turf from "@turf/turf";
// import {
//   getSelectedElement,
//   SelectedSelection,
// } from "../core/actions/selectedElement";
// import { MapContext } from "../contexts/mapContext";
// import { dragElement, handleMoveElement } from "../core/actions/dragElement";
// import { HandleDragging } from "../core/actions/handlesPoint";
// import { TerradrawAction } from "../core/actions/terradraw";

// const DeckMap = () => {
//   const navigate = useNavigate();
//   const mapRef = useRef(null);
//   const mapContainer = useRef(null);
//   const drawRef = useRef(null);
//   const [hide, setHide] = useState(true);

//   const { selectedElement, setSelectedElement } = useContext(MapContext);

//   useEffect(() => {
//     const map = createMap({
//       mapContainer: mapContainer.current,
//       bearing: -33.5,
//     });

//     mapRef.current = map;
//     map.doubleClickZoom.disable();
//     // map.dragPan.disable();

//     TerradrawAction(map, drawRef);

//     map.on("click", (e) => {
//       // const selected = drawRef.current.getFeatures(true).features;
//       // if (selected.length) {
//       //   const feature = selected[0];
//       //   const height = feature.properties?.height ?? "";
//       //   setHeight(Number(height));
//       // } else {
//       //   setHeight("");
//       // }
//     });

//     // SelectedSelection.getSelectedElement({ map, setSelectedElement });
//     // SelectedSelection.getDoubleClickSelection({ map, setSelectedElement });

//     // map.on("load", () => {
//     //   LoadData.loadDefaultData(map);
//     //   hoverBBoxSelected(selectedElement, mapRef.current);
//     //   // handleMoveElement(map, selectedElement);
//     // });

//     return () => {
//       map.remove();
//     };
//   }, []);

//   useEffect(() => {
//     Keyboard.keyDown(mapContainer, drawRef, mapRef, selectedElement);
//   }, [selectedElement]);

//   return (
//     <div style={{ position: "relative", height: "100vh" }}>
//       <div ref={mapContainer} style={{ height: "100%" }} />

//       <ButtonShow onClick={() => setHide(!hide)}>Show</ButtonShow>
//       {!hide && (
//         <FormProperty>
//           <SubmitButton onClick={() => navigate("/3d")}>3D</SubmitButton>
//           <BasicComponent drawRef={drawRef} mapRef={mapRef} />
//         </FormProperty>
//       )}
//     </div>
//   );
// };

// export default DeckMap;

// const FormProperty = styled.div`
//   position: absolute;
//   top: 40px;
//   right: 10px;
//   background-color: rgba(255, 255, 255, 0.9);
//   padding: 15px;
//   width: 300px;
//   text-align: center;
// `;

// const SubmitButton = styled.button`
//   padding: 0.6rem 1.2rem;
//   background: #007bff;
//   color: white;
//   border: none;
//   border-radius: 6px;
//   font-size: 1rem;
//   cursor: pointer;

//   &:hover {
//     background: #0056b3;
//   }

//   a {
//     text-decoration: none;
//     color: white;
//   }
// `;

// const ButtonShow = styled.button`
//   padding: 0.6rem 1.2rem;
//   background: #007bff;
//   color: white;
//   border: none;
//   border-radius: 6px;
//   font-size: 1rem;
//   cursor: pointer;
//   position: absolute;
//   top: 2px;
//   right: 10px;
//   z-index: 2;

//   &:hover {
//     background: #0056b3;
//   }
// `;

import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";

import boothsGeoJSON from "../data/boothsjson.json";
import { createMap } from "../core/actions/map";

export default function DeckMap() {
  const mapContainer = useRef(null);
  const drawControl = useRef();

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap({
      mapContainer: mapContainer.current,
      bearing: -33.5,
    });

    map.on("load", () => {
      // 1) Khởi TerraDraw với styleMaps bind vào properties.color
      const draw = new MaplibreTerradrawControl({
        styleMaps: {
          polygon: {
            fillColor: ["get", "color"],
            fillOpacity: 0.6,
            strokeColor: "#000",
            strokeWidth: 2,
          },
          line: {
            lineColor: ["get", "color"],
            lineWidth: 3,
          },
          point: {
            circleColor: ["get", "color"],
            circleRadius: 6,
          },
        },
      });
      map.addControl(draw, "top-left");
      drawControl.current = draw;

      // 2) Lấy TerraDraw instance và add features
      const terraDraw = draw.getTerraDrawInstance();
      terraDraw.addFeatures(boothsGeoJSON.features); // <-- đúng hàm để import GeoJSON vào TerraDraw

      // 3) (tuỳ chọn) Bắt sự kiện để gán color nếu feature thiếu
    //   draw.on("draw.create", ({ features }) => {
    //     features.forEach((f) => {
    //       if (!f.properties.color) {
    //         f.properties.color =
    //           "#" +
    //           Math.floor(Math.random() * 0xffffff)
    //             .toString(16)
    //             .padStart(6, "0");
    //         terraDraw.updateFeatures({ type: "FeatureCollection", features: [f] });
    //       }
    //     });
    //   });
    });

    return () => {
      if (drawControl.current) map.removeControl(drawControl.current);
      map.remove();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}
