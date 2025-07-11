// MapDraw.tsx
import React, { useContext, useEffect, useRef, useState } from "react";

// @ts-ignore: TerraDraw is a UMD global so we import it this way
import { createMap } from "../core/actions/map";
import { DrawElement } from "../core/actions/draw";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { BasicComponent } from "./right-panel/BasicComponent";
import {
  clearAllFeatures,
  Keyboard,
  selectAllFeatures,
} from "../core/actions/key";
import { calculateImageBounds, loadFromLocalStorage } from "../core/utils";
import { LoadData } from "../core/actions/loadData";
import * as turf from "@turf/turf";
import {
  getSelectedElement,
  SelectedSelection,
} from "../core/actions/selectedElement";
import { MapContext } from "../contexts/mapContext";
import { dragElement, handleMoveElement } from "../core/actions/dragElement";
import { HandleDragging } from "../core/actions/handlesPoint";
import { BoundingBox } from "../core/actions/boundingBox";
import { showContextMenu } from "../core/actions/rightMouse";
import { LayerOrdering } from "../core/actions/layerOrdering";
import { AppGlobals } from "../core/globals";

const DrawGeometries = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const drawRef = useRef(null);
  const [hide, setHide] = useState(true);

  const { selectedElement, setSelectedElement } = useContext(MapContext);

  useEffect(() => {
    const map = createMap({
      mapContainer: mapContainer.current,
      bearing: -33.5,
    });

    mapRef.current = map;
    map.doubleClickZoom.disable();
    // map.dragPan.disable();

    DrawElement.Terradraw(map, drawRef);

    map.on("click", (e) => {
      // const selected = drawRef.current.getFeatures(true).features;
      // if (selected.length) {
      //   const feature = selected[0];
      //   const height = feature.properties?.height ?? "";
      //   setHeight(Number(height));
      // } else {
      //   setHeight("");
      // }
    });

    SelectedSelection.getSelectedElement({ map, setSelectedElement });
    SelectedSelection.getDoubleClickSelection({ map, setSelectedElement });

    map.on("load", () => {
      LoadData.loadDefaultData(map);
      BoundingBox.hoverBBoxSelected(selectedElement, mapRef.current);
    });

    map.on("contextmenu", (e) => {
      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = AppGlobals.getElements();
      if (!storedData?.length) return;

      const feature = SelectedSelection.findFeatureAtPoint(
        clickedLngLat,
        storedData
      );

      showContextMenu(
        e.point,
        () => {
          if (feature) {
            LayerOrdering.bringForward(map, feature);
          }
        },
        () => {
          if (feature) {
            LayerOrdering.sendBackward(map, feature);
          }
        }
      );
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    Keyboard.keyDown(mapContainer, drawRef, mapRef, selectedElement);
  }, [selectedElement]);

  document.addEventListener("click", () => {
    const existing = document.getElementById("map-context-menu");
    if (existing) existing.remove();
  });

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapContainer} style={{ height: "100%" }} />

      <ButtonShow onClick={() => setHide(!hide)}>Show</ButtonShow>
      {!hide && (
        <FormProperty>
          <SubmitButton onClick={() => navigate("/3d")}>3D</SubmitButton>
          <BasicComponent drawRef={drawRef} mapRef={mapRef} />
        </FormProperty>
      )}
    </div>
  );
};

export default DrawGeometries;

const FormProperty = styled.div`
  position: absolute;
  top: 40px;
  right: 10px;
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

const ButtonShow = styled.button`
  padding: 0.6rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  position: absolute;
  top: 2px;
  right: 10px;
  z-index: 2;

  &:hover {
    background: #0056b3;
  }
`;
