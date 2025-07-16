import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import DrawGeometries from "./components/DrawGeometries";
import MapLibre3D from "./components/MapLibre3D";
import { MapProvider } from "./contexts/mapContext";

function App() {
  return (
    <MapProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<DrawGeometries />} />
            <Route path="/3d" element={<MapLibre3D />} />
          </Routes>
        </Router>
      </div>
    </MapProvider>
  );
}

export default App;
