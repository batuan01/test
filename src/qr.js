import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { QrReader } from "react-qr-reader";

const QR = () => {
  const [code, setCode] = useState(null);
  const [count, setCount] = useState(0);
  const [isQR, setIsQR] = useState(false);
  const [showDialog, setDiaglog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleScan = async (scanData) => {
    if (scanData) {
      alert(JSON.stringify(scanData));
      //if (code === scanData) return;
      setCode(scanData);
      setCount(count + 1);
      console.log(JSON.stringify(scanData));
    }
  };
  const handleError = (err) => {
    console.error(err);
  };

  const toggleReader = () => {
    setIsQR(!isQR);
  };
  return (
    <div className="App">
      <button onClick={toggleReader}>Qr/Barra</button>
      {isQR ? (
        <div>
          <h1>Reading QR</h1>
          <QrReader
            //facingMode={selected}
            delay={500}
            onError={handleError}
            onScan={handleScan}
            // chooseDeviceId={()=>selected}
            style={{ width: "200px", heigth: "100px" }}
          />
        </div>
      ) : (
        <div>
          <h1>Reading QR</h1>
          <BarcodeScannerComponent
            width={500}
            height={500}
            onUpdate={(err, result) => {
              if (result) setCode(result.text);
              else setCode("Not Found");
            }}
          />
        </div>
      )}

      <p>QR contados: {count}</p>
      {code && (
        <p>
          <b>data:</b> {JSON.stringify(code)}
        </p>
      )}
    </div>
  );
};

export default QR;
