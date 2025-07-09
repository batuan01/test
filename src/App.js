import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import MapLibreDrawCircle from "./components/MapLibreDrawCircle";
import DrawGeometries from "./components/DrawGeometries";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MapLibre3D from "./components/MapLibre3D";
import { MapProvider } from "./contexts/mapContext";
import GeomanComponent from "./components/Geoman";
import { useCallback, useState } from "react";
import DeckMap from "./components/DeckGL";

function App() {
  const [gmEvents, setGmEvents] = useState([]);

  const getGeoJson = (featureData) => {
    try {
      return JSON.stringify(featureData.getGeoJson(), null, 2);
    } catch (error) {
      return `Can't retrieve GeoJSON: ${error}`;
    }
  };

  const handleEvent = useCallback((event) => {
    // console.log("Event", event);

    setGmEvents((prevEvents) => [
      ...prevEvents,
      {
        id: event?.feature?.id ?? undefined,
        enabled: event?.enabled ?? undefined,
        timestamp: new Date().toLocaleTimeString(),
        type: event?.type,
        shape: event?.shape ?? undefined,
        geojson: event?.feature ? getGeoJson(event.feature) : undefined,
      },
    ]);
  }, []);

  return (
    <MapProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<DrawGeometries />} />
            <Route path="/mapbox" element={<MapLibreDrawCircle />} />
            <Route path="/3d" element={<MapLibre3D />} />
            <Route
              path="/geoman"
              element={<GeomanComponent handleEvent={handleEvent} />}
            />
            <Route path="/deck" element={<DeckMap />} />
          </Routes>
        </Router>
      </div>
    </MapProvider>
  );
}

export default App;
