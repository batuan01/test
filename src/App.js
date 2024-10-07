import { useState } from "react";
import { QrReader } from "react-qr-reader";

function App() {
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const handleScan = (data) => {
    if (data) {
      setScannedData(data);
      setIsScanning(false); // Tắt chế độ quét sau khi quét thành công
    }
  };
  const handleError = (err) => {
    console.error(err); // Xử lý lỗi
  };
  const handleScanClick = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Nếu có quyền truy cập camera, bật chế độ quét
        setIsScanning(!isScanning);
      })
      .catch((err) => {
        alert("Bạn cần cho phép truy cập camera để quét QR!");
        console.error("Lỗi truy cập camera:", err);
      });
  };
  return (
    <div>
      <button onClick={handleScanClick}>
        {isScanning ? "Dừng quét" : "Quét QR"}
      </button>
      {isScanning && (
        <QrReader
          delay={300} // Độ trễ giữa các lần quét
          onError={handleError} // Xử lý lỗi
          onScan={handleScan} // Xử lý khi quét thành công
          facingMode="environment" // Camera sau
          style={{ width: "100%" }}
        />
      )}
      {scannedData && <p>Dữ liệu quét: {scannedData}</p>}
    </div>
  );
}

export default App;
