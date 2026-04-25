
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 40px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderTop: '5px solid #ff5722'
    }}>
      {/* Logo */}
      <div style={{ marginRight: '20px' }}>
        <Link to="/">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Q1qmKhKTNd_S2up7hCB9sH9eExXEKiXFLQ&s" alt="ShopMoHinh Logo" style={{ height: '50px' }} />
        </Link>
      </div>

      {/* Thanh tìm kiếm */}
      <div style={{ flexGrow: 1, maxWidth: '500px' }}>
        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '50px', overflow: 'hidden' }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            style={{
              border: 'none',
              padding: '10px 20px',
              flexGrow: 1,
              outline: 'none'
            }}
          />
          <button style={{
            backgroundColor: '#ff5722',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer'
          }}>
            <i className="fa fa-search"></i>
          </button>
        </div>
      </div>

      {/* Liên kết điều hướng */}
      <nav style={{ marginLeft: '40px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center' }}>
          {/* Các liên kết luôn hiển thị */}
          <li style={{ marginLeft: '20px' }}><Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Trang chủ</Link></li>
          <li style={{ marginLeft: '20px' }}><Link to="/category" style={{ textDecoration: 'none', color: '#333' }}>Hãng xe</Link></li>
          <li style={{ marginLeft: '20px' }}><Link to="/about" style={{ textDecoration: 'none', color: '#333' }}>Giới thiệu</Link></li>
          <li style={{ marginLeft: '20px' }}><Link to="/contact" style={{ textDecoration: 'none', color: '#333' }}>Liên hệ</Link></li>

          {/* Hiển thị khi người dùng CHƯA đăng nhập */}
          {!user && (
            <>
              <li style={{ marginLeft: '20px' }}>
                <Link to="/register" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Đăng ký</Link>
              </li>
              <li style={{ marginLeft: '20px' }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Đăng nhập</Link>
              </li>
            </>
          )}

          {/* Hiển thị khi người dùng ĐÃ đăng nhập */}
          {user && (
            <>
              {/* Hiển thị nếu user là ADMIN */}
              {user.role === 'admin' && (
                <li style={{ marginLeft: '20px' }}>
                  <Link to="/admin" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Trang Admin</Link>
                </li>
              )}
              <li style={{ marginLeft: '20px' }}>
                <Link to="/cart" style={{ textDecoration: 'none', color: '#333' }}>Giỏ hàng</Link>
              </li>
              <li style={{ marginLeft: '20px' }}>
                <Link to="/my-orders" style={{ textDecoration: 'none', color: '#333' }}>Đơn hàng</Link>
              </li>
              <li style={{ marginLeft: '20px' }}>
                <Link to="/profile" style={{ textDecoration: 'none', color: '#333' }}>Tài khoản</Link>
              </li>
              {/* Nút Đăng xuất */}
              <li style={{ marginLeft: '20px' }}>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff5722', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>
                  Đăng xuất
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;