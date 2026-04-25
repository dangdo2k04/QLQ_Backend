// client/src/pages/CategoryListPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row, Typography, Image as AntImage } from 'antd'; // Import Image từ Ant Design và đổi tên thành AntImage để tránh xung đột

const { Title } = Typography;

// Định nghĩa interface cho Category
interface Category {
  id: string;
  name: string;
  image: string; // Đường dẫn đến hình ảnh
}

// Import images using ES6 import statements
import FordImg from "../assets/images/Ford1.webp";
import McLarenImg from "../assets/images/Mclaren.webp";
import AstonMartinImg from "../assets/images/aston-martin2.webp";
import AudiImg from "../assets/images/Audi.webp";
import BentlyImg from "../assets/images/Bently.webp";
import BMWImg from "../assets/images/BMW.webp";
import BugattiImg from "../assets/images/Bugatti.webp";
import DucatiImg from "../assets/images/Ducati.webp";
import FerrariImg from "../assets/images/Ferrari.webp";
import PorscheImg from "../assets/images/Porsche1.webp";
import MercedesBenzImg from "../assets/images/Mercedes-Benz.webp";

// Danh sách các hãng xe với ID, tên và hình ảnh
const categories: Category[] = [
  { id: "Ford", name: "Ford", image: FordImg },
  { id: "McLaren", name: "McLaren", image: McLarenImg },
  { id: "Aston Martin", name: "Aston Martin", image: AstonMartinImg },
  { id: "Audi", name: "Audi", image: AudiImg },
  { id: "Bently", name: "Bently", image: BentlyImg },
  { id: "BMW", name: "BMW", image: BMWImg },
  { id: "Bugatti", name: "Bugatti", image: BugattiImg },
  { id: "Ducati", name: "Ducati", image: DucatiImg },
  { id: "Ferrari", name: "Ferrari", image: FerrariImg },
  { id: "Porsche", name: "Porsche", image: PorscheImg },
  { id: "Mercedes-Benz", name: "Mercedes-Benz", image: MercedesBenzImg },
];

const CategoryListPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>Chọn Hãng Xe Yêu Thích Của Bạn</Title>
      <Row gutter={[16, 16]} justify="center">
        {categories.map((category) => (
          <Col key={category.id} xs={24} sm={12} md={8} lg={6} xl={4}>
            {/* Sử dụng category.id cho URL, đảm bảo nó khớp với category trong backend */}
            <Link to={`/category/${category.id.toLowerCase()}`}>
              <Card
                hoverable
                style={{ width: '100%', textAlign: 'center' }}
                cover={<AntImage alt={category.name} src={category.image} preview={false} style={{ height: 120, objectFit: 'contain', padding: '10px' }} />}
                bodyStyle={{ padding: '10px 5px' }}
              >
                <Title level={4} style={{ margin: 0 }}>{category.name}</Title>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CategoryListPage;