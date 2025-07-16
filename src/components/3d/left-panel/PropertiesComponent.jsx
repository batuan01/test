import { useContext, useState } from "react";
import styled from "styled-components";
import { MapContext } from "../../../contexts/mapContext";
import { DistanceElement } from "../../../core/actions/element/distanceElement";
import { isPathElement } from "../../../core/actions/element/typeChecks";
import { AppGlobals } from "../../../core/globals";
import { DirectionPanel } from "./DirectionPanel";

export const PropertiesComponent = ({ mapRef }) => {
  const { selectedElement, setSelectedElement } = useContext(MapContext);
  const storedData = AppGlobals.getElements();
  const [mode, setMode] = useState("properties");
  const [startFeature, setStartFeature] = useState();

  const pathElement = storedData.find((f) => isPathElement(f));

  const handleDirections = () => {
    if (!pathElement || !selectedElement) return;
    setMode("directions");
    const point = DistanceElement.getFirstPointInPolygon(
      selectedElement,
      pathElement
    );

    setStartFeature({
      point,
      startElement: selectedElement,
    });
  };

  return (
    <PanelContainer>
      {mode === "properties" && (
        <>
          <Title>DAIWA CO., LTD</Title>
          <Subtitle>Food Container / Package</Subtitle>

          <ButtonPrimary onClick={handleDirections}>
            📍 Directions
          </ButtonPrimary>

          <SectionTitle>Categories</SectionTitle>
          <Tag>Food Container</Tag>
          <Tag>Package</Tag>

          <ButtonSecondary>🏪 Visit Store Page</ButtonSecondary>
        </>
      )}

      {mode === "directions" && (
        <DirectionPanel
          mapRef={mapRef}
          setMode={setMode}
          startFeature={startFeature}
          pathElement={pathElement}
        />
      )}
    </PanelContainer>
  );
};

const PanelContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
  width: 320px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  z-index: 10;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 8px;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 14px;
  margin: 0 0 16px;
  color: #777;
`;

const SectionTitle = styled.p`
  margin: 20px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
`;

const Tag = styled.div`
  display: inline-block;
  background-color: #f0f0f0;
  color: #444;
  font-size: 12px;
  padding: 6px 10px;
  margin: 4px 4px 0 0;
  border-radius: 20px;
`;

const ButtonPrimary = styled.button`
  background-color: #6f2c91;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #5a2474;
  }
`;

const ButtonSecondary = styled(ButtonPrimary)`
  background-color: #f4f4f4;
  color: #6f2c91;
  margin-top: 16px;
  border: 1px solid #6f2c91;

  &:hover {
    background-color: #e9e9e9;
  }
`;
