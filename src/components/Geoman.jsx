// import { Geoman } from "@geoman-io/maplibre-geoman-free";
// import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";
// import "maplibre-gl/dist/maplibre-gl.css";
// import ml from "maplibre-gl";
// import React, { useEffect, useRef } from "react";

// const GeomanComponent = ({ handleEvent }) => {
//   const mapRef = useRef(null);
//   const mapInstance = useRef(null);
//   const geomanInstance = useRef(null);
//   const gmOptions = {
//     controls: {
//       helper: {
//         snapping: {
//           uiEnabled: true,
//           active: true,
//         },
//       },
//     },
//   };

//   useEffect(() => {
//     if (mapRef.current) {
//       const map = new ml.Map({
//         container: mapRef.current,
//         style:
//           "https://api.maptiler.com/maps/fefc1891-4e0d-4102-a51f-09768f839b85/style.json?key=S1qTEATai9KydkenOF6W",
//         center: [0, 51],
//         zoom: 5,
//         fadeDuration: 50,
//       });

//       mapInstance.current = map;
//       const geoman = new Geoman(map, gmOptions);
//       geomanInstance.current = geoman;

//       // Define loadDevShapes inside useEffect to handle dependencies correctly

//       map.on("gm:loaded", () => {
//         // console.log("Geoman loaded", geoman);
//         // Enable drawing tools
//         geoman.enableDraw("polygon");
//       });

//       // Mode events
//       map.on("gm:globaldrawmodetoggled", handleEvent);
//       map.on("gm:globaleditmodetoggled", handleEvent);
//       map.on("gm:globalremovemodetoggled", handleEvent);
//       map.on("gm:globalrotatemodetoggled", handleEvent);
//       map.on("gm:globaldragmodetoggled", handleEvent);
//       map.on("gm:globalcutmodetoggled", handleEvent);
//       map.on("gm:globalsnappingmodetoggled", handleEvent);

//       // Drawing events
//       // map.on('gm:draw', handleEvent); // Enable to listen to all draw events
//       map.on("gm:create", handleEvent);

//       // Edit events
//       // map.on('gm:edit', handleEvent); // Enable to listen to all edit events
//       map.on("gm:editstart", handleEvent);
//       map.on("gm:editend", handleEvent);

//       // Remove events
//       map.on("gm:remove", handleEvent);

//       // Rotate events
//       // map.on('gm:rotate', handleEvent); // Enable to listen to all rotate events
//       map.on("gm:rotatestart", handleEvent);
//       map.on("gm:rotateend", handleEvent);

//       // Drag events
//       // map.on('gm:drag', handleEvent); // Enable to listen to all drag events
//       map.on("gm:dragstart", handleEvent);
//       map.on("gm:dragend", handleEvent);

//       // Cut events
//       map.on("gm:cut", handleEvent);

//       // Helper and control events
//       map.on("gm:helper", handleEvent);
//       map.on("gm:control", handleEvent);

//       map.on("click", (e) => {
//         console.log("object", map.getStyle());
//       });
//     }

//     return () => {
//       if (mapInstance.current) {
//         mapInstance.current.remove();
//       }
//     };
//   }, [handleEvent]);

//   return (
//     <div style={{ position: "relative", height: "100vh" }}>
//       <div ref={mapRef} style={{ height: "100%" }} />
//     </div>
//   );
// };

// export default GeomanComponent;

// import { Geoman } from "@geoman-io/maplibre-geoman-free";
// import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";
// import "maplibre-gl/dist/maplibre-gl.css";
// import ml from "maplibre-gl";
// import React, { useEffect, useRef } from "react";

// const GeomanComponent = ({ handleEvent }) => {
//   const mapRef = useRef(null);
//   const mapInstance = useRef(null);
//   const geomanInstance = useRef(null);
//   const gmOptions = {
//     controls: {
//       helper: {
//         snapping: {
//           uiEnabled: true,
//           active: true,
//         },
//       },
//     },
//   };

//   useEffect(() => {
//     if (mapRef.current) {
//       const map = new ml.Map({
//         container: mapRef.current,
//         style:
//           "https://api.maptiler.com/maps/fefc1891-4e0d-4102-a51f-09768f839b85/style.json?key=S1qTEATai9KydkenOF6W",
//         center: [0, 51],
//         zoom: 5,
//         fadeDuration: 50,
//       });

//       mapInstance.current = map;
//       const geoman = new Geoman(map, gmOptions);
//       geomanInstance.current = geoman;

//       map.on("click", (e) => {
//         console.log("object", map.getStyle());
//       });

//       map.on("gm:loaded", () => {
//         geoman.enableDraw("polygon");
//       });

//       // Tạo input để tải lên hình ảnh
//       const imageUpload = document.createElement("input");
//       imageUpload.type = "file";
//       imageUpload.accept = "image/*";
//       imageUpload.style.position = "absolute";
//       imageUpload.style.top = "10px";
//       imageUpload.style.right = "10px";
//       imageUpload.style.zIndex = "1";
//       mapRef.current.appendChild(imageUpload);

//       imageUpload.onchange = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//           const reader = new FileReader();
//           reader.onload = (loadEvent) => {
//             const imgSrc = loadEvent.target.result;
//             const img = new Image();
//             img.src = imgSrc;

//             // Đợi người dùng nhấp chuột để xác định vị trí
//             map.once("click", (e) => {
//               const bounds = [
//                 [e.lngLat.lng - 0.01, e.lngLat.lat - 0.01], // Góc dưới bên trái
//                 [e.lngLat.lng + 0.01, e.lngLat.lat - 0.01], // Góc dưới bên phải
//                 [e.lngLat.lng + 0.01, e.lngLat.lat + 0.01], // Góc trên bên phải
//                 [e.lngLat.lng - 0.01, e.lngLat.lat + 0.01], // Góc trên bên trái
//               ];

//               // Thêm nguồn hình ảnh vào bản đồ
//               map.addSource("uploaded-image", {
//                 type: "image",
//                 url: imgSrc,
//                 coordinates: bounds,
//               });

//               // Thêm layer hình ảnh
//               map.addLayer({
//                 id: "uploaded-image-layer",
//                 type: "raster",
//                 source: "uploaded-image",
//                 minzoom: 5,
//                 maxzoom: 22,
//               });
//             });
//           };
//           reader.readAsDataURL(file);
//         }
//       };
//     }

//     return () => {
//       if (mapInstance.current) {
//         mapInstance.current.remove();
//       }
//     };
//   }, [handleEvent]);

//   return (
//     <div style={{ position: "relative", height: "100vh" }}>
//       <div ref={mapRef} style={{ height: "100%" }} />
//     </div>
//   );
// };

// export default GeomanComponent;

import { Geoman } from "@geoman-io/maplibre-geoman-free";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";
import "maplibre-gl/dist/maplibre-gl.css";
import ml from "maplibre-gl";
import React, { useEffect, useRef } from "react";

const GeomanComponent = ({ handleEvent }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const geomanInstance = useRef(null);
  const gmOptions = {
    controls: {
      helper: {
        snapping: {
          uiEnabled: true,
          active: true,
        },
      },
    },
  };

  useEffect(() => {
    if (mapRef.current) {
      const map = new ml.Map({
        container: mapRef.current,
        style:
          "https://api.maptiler.com/maps/fefc1891-4e0d-4102-a51f-09768f839b85/style.json?key=S1qTEATai9KydkenOF6W",
        center: [0, 51],
        zoom: 5,
        fadeDuration: 50,
      });

      mapInstance.current = map;
      const geoman = new Geoman(map, gmOptions);
      geomanInstance.current = geoman;

      map.on("click", (e) => {
        console.log("object", map.getStyle());
      });

      map.on("gm:loaded", () => {
        geoman.enableDraw("polygon");
      });

      // Tạo input để tải lên hình ảnh
      const imageUpload = document.createElement("input");
      imageUpload.type = "file";
      imageUpload.accept = "image/*";
      imageUpload.style.position = "absolute";
      imageUpload.style.top = "10px";
      imageUpload.style.right = "10px";
      imageUpload.style.zIndex = "1";
      mapRef.current.appendChild(imageUpload);

      imageUpload.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const imgSrc = loadEvent.target.result;

            // Đợi người dùng nhấp chuột để xác định vị trí
            map.once("click", (e) => {
              const bounds = [
                [e.lngLat.lng - 0.01, e.lngLat.lat - 0.01], // Góc dưới bên trái
                [e.lngLat.lng + 0.01, e.lngLat.lat - 0.01], // Góc dưới bên phải
                [e.lngLat.lng + 0.01, e.lngLat.lat + 0.01], // Góc trên bên phải
                [e.lngLat.lng - 0.01, e.lngLat.lat + 0.01], // Góc trên bên trái
              ];

              // Thêm nguồn hình ảnh vào bản đồ
              map.addSource("uploaded-image", {
                type: "image",
                url: imgSrc,
                coordinates: bounds,
              });

              // Thêm layer hình ảnh
              map.addLayer({
                id: "uploaded-image-layer",
                type: "raster",
                source: "uploaded-image",
                minzoom: 5,
                maxzoom: 22,
              });

              // Đặt layer hình ảnh trên cùng hoặc dưới các layer khác nếu cần
              // Ví dụ: map.moveLayer("uploaded-image-layer", "some-other-layer-id");
            });
          };
          reader.readAsDataURL(file);
        }
      };
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [handleEvent]);

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapRef} style={{ height: "100%" }} />
    </div>
  );
};

export default GeomanComponent;
