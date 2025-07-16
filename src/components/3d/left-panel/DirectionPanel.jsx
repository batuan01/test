import { useContext, useEffect } from "react";
import styled from "styled-components";
import { MapContext } from "../../../contexts/mapContext";
import { DistanceElement } from "../../../core/actions/element/distanceElement";
import PathFinder from "geojson-path-finder";
import * as turf from "@turf/turf";
import { RouteLayer } from "../../../core/3d/routeLayer";
import { ConvertData } from "../../../core/3d/convertData";

export const DirectionPanel = ({
  mapRef,
  setMode,
  startFeature,
  pathElement,
}) => {
  const { selectedElement, setSelectedElement } = useContext(MapContext);

  const handleBack = () => {
    setMode("properties");
    RouteLayer.remove(mapRef.current);
  };

  useEffect(() => {
    if (
      !startFeature ||
      !selectedElement ||
      selectedElement.id === startFeature.startElement.id
    )
      return;

    const endPoint = DistanceElement.getFirstPointInPolygon(
      selectedElement,
      pathElement
    );

    // Bước 1: Chuyển MultiLineString thành LineString collection
    const geojsonData = ConvertData.convertMultiLineToLine(pathElement);

    // Bước 2: Khởi tạo path finder
    const pathFinder = new PathFinder(geojsonData);

    // Bước 3: Xác định điểm bắt đầu và kết thúc
    const start = turf.point(startFeature.point);
    const end = turf.point(endPoint);

    // Bước 4: Tìm đường
    const path = pathFinder.findPath(start, end);

    if (path) {
      RouteLayer.add(mapRef.current, path.path);
    }
  }, [startFeature, selectedElement]);

  return (
    <>
      <Header>
        <BackButton onClick={handleBack}>{"←"}</BackButton>
        <Title>Directions</Title>
        <MoreOptions>⋮</MoreOptions>
      </Header>

      <LocationBlock>
        <IconCircle />
        <LocationInput defaultValue='"IONO" Mizuta Co.,ltd' />
        <SwapButton></SwapButton>
      </LocationBlock>

      <LocationBlock>
        <PinIcon />
        <LocationInput defaultValue="Ace Kouki" />
      </LocationBlock>

      <TimeSection>
        <TimeText>3 minutes</TimeText>
        <StepsButton>Steps →</StepsButton>
      </TimeSection>
    </>
  );
};

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  padding: 0;
`;

const MoreOptions = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 0;
`;

const LocationBlock = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 14px;
`;

const IconCircle = styled.div`
  width: 12px;
  height: 12px;
  background: #6f2c91;
  border-radius: 50%;
  margin-right: 10px;
`;

const PinIcon = styled.div`
  width: 10px;
  height: 10px;
  background: #222;
  border-radius: 2px;
  margin-right: 10px;
`;

const LocationInput = styled.input`
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #6f2c91;
  }
`;

const SwapButton = styled.button`
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  background: #f2f2f2;
  border: 1px solid #ccc;
  border-radius: 50%;
  padding: 4px 6px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const TimeSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
`;

const TimeText = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
`;

const StepsButton = styled.button`
  background: #6f2c91;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #5a2474;
  }
`;
