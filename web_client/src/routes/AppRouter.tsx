import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import CartPage from '../pages/CartPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import AdminPage from '../pages/AdminPage';
import Header from '../components/layout/Header';
import MyOrdersPage from '../pages/MyOrdersPage';
import OrderDetailsPage from '../pages/OrderDetailsPage';
import ProfilePage from '../pages/ProfilePage';
import Category from '../pages/Category';

//const NewsPage = () => <h1>Tin tức</h1>;
const AboutPage = () => <h1>Giới thiệu</h1>;
const ContactPage = () => <h1>Liên hệ</h1>;

const AppRouter = () => {
  return (
    <Router>
      <Header />
      <main style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/category" element={<Category />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/*" element={<AdminPage />} /> {/* Thay đổi từ /admin thành /admin/* */}
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/order/:id" element={<OrderDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </Router>
  );
};

export default AppRouter;