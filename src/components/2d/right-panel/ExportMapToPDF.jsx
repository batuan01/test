import jsPDF from "jspdf";
import styled from "styled-components";

export const ExportMapToPDF = ({ mapContainer, mapRef }) => {
  const handleExport = () => {
    if (!mapRef.current || !mapContainer.current) return;

    // Đợi bản đồ render xong
    mapRef.current.once("idle", () => {
      const canvas = mapContainer.current.querySelector("canvas");
      if (!canvas) return;

      // Lấy dữ liệu ảnh từ canvas
      const imgData = canvas.toDataURL("image/png");

      // Tăng chất lượng PDF bằng cách scale ảnh
      const scale = 2; // có thể thử 3 nếu muốn siêu nét
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;

      // Tạo PDF với kích thước tương ứng
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [imgWidth, imgHeight],
      });

      // Thêm ảnh vào PDF với kích thước lớn hơn (nét hơn)
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("map.pdf");
    });
  };

  return <SubmitButton onClick={handleExport}>Xuất bản đồ ra PDF</SubmitButton>;
};

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
`;
