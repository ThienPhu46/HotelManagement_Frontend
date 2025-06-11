import React, { useState, useEffect } from 'react';
import '../../Design_Css/Admin/Dashboard.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [ngayBatDau, setNgayBatDau] = useState('2025-06-10');
  const [ngayKetThuc, setNgayKetThuc] = useState('2025-06-11');
  const [stats, setStats] = useState({
    tongDoanhThuPhong: 0,
    tongDoanhThuDichVu: 0,
    tongDoanhThu: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Lấy ngày hiện tại chỉ khi lần đầu tiên render (không set lại khi đã có giá trị)
  useEffect(() => {
    if (!ngayBatDau && !ngayKetThuc) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedToday = `${yyyy}-${mm}-${dd}`;
      setNgayBatDau(formattedToday);
      setNgayKetThuc(formattedToday);
    }
  }, []);

  // Gọi API khi ngày thay đổi
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        // Gọi API thống kê doanh thu đúng chuẩn hướng dẫn (nếu backend đã hỗ trợ)
        const url = `https://hotelmanagement-backend-tslx.onrender.com/api/invoices/revenue-statistics?ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Lỗi khi lấy thống kê doanh thu');
        const data = await res.json();
        // Nếu backend trả về data.data, lấy từ data.data, nếu không thì lấy trực tiếp
        // Nếu ngày bắt đầu và ngày kết thúc giống nhau, chỉ lấy đúng ngày đó (so sánh theo yyyy-MM-dd)
        let result = data.data || data;
        // Nếu ngày bắt đầu và ngày kết thúc giống nhau, chỉ lấy đúng ngày đó
        if (
          ngayBatDau === ngayKetThuc &&
          result.danhSachDoanhThuNgay &&
          Array.isArray(result.danhSachDoanhThuNgay)
        ) {
          // So sánh ngày theo chuẩn yyyy-MM-dd, thử cả dạng ISO và dạng dd/MM/yyyy nếu backend trả về
          const ngay = result.danhSachDoanhThuNgay.find(item => {
            // Ưu tiên so sánh với item.ngay đã format yyyy-MM-dd
            if (item.ngay === ngayBatDau) return true;
            // Nếu item.ngay là ISO string, lấy 10 ký tự đầu
            if ((item.ngay || '').slice(0, 10) === ngayBatDau) return true;
            // Nếu item.ngay là dd/MM/yyyy
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(item.ngay)) {
              const [d, m, y] = item.ngay.split('/');
              const converted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              return converted === ngayBatDau;
            }
            return false;
          });
          if (ngay) {
            setStats({
              tongDoanhThuPhong: Number(ngay.doanhThuPhong) || 0,
              tongDoanhThuDichVu: Number(ngay.doanhThuDichVu) || 0,
              tongDoanhThu: Number(ngay.doanhThuNgay) || 0
            });
          } else {
            // Nếu không tìm thấy ngày, fallback về tổng
            setStats({
              tongDoanhThuPhong: Number(result.tongDoanhThuPhong) || 0,
              tongDoanhThuDichVu: Number(result.tongDoanhThuDichVu) || 0,
              tongDoanhThu: Number(result.tongDoanhThu) || 0
            });
          }
        } else {
          setStats({
            tongDoanhThuPhong: Number(result.tongDoanhThuPhong) || 0,
            tongDoanhThuDichVu: Number(result.tongDoanhThuDichVu) || 0,
            tongDoanhThu: Number(result.tongDoanhThu) || 0
          });
        }
      } catch (err) {
        setError(err.message);
        setStats({ tongDoanhThuPhong: 0, tongDoanhThuDichVu: 0, tongDoanhThu: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [ngayBatDau, ngayKetThuc]);

  return (
    <div className="dashboard-container">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogoutClick={handleLogoutClick}
      />
      {/* Top Header (Trang Chủ) */}
      <div className="top-header">
        <div className="top-title-container">
          <div className="menu-icon" onClick={toggleSidebar}>☰</div>
          <div className="top-title">Trang Chủ</div>
        </div>
        <div className="more-icon">⋮</div>
      </div>
      <div className="logo-container">
        <div className="logodebug">
          <img src="/icon_LTW/Logo_Dashboard.png" alt="Logo Dashboard" />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="main-title">Phần mềm<br />quản lý khách sạn</h1>

      {/* Date Range Selector */}
      <div className="month-selector-wrapper">
        <div className="month-selector" style={{ gap: 16 }}>
          <label style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Từ ngày:</label>
          <input type="date" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} min="2020-01-01" max={ngayKetThuc} style={{ fontSize: 18, padding: 8, borderRadius: 5, border: 'none', marginRight: 16 }} />
          <label style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Đến ngày:</label>
          <input type="date" value={ngayKetThuc} onChange={e => setNgayKetThuc(e.target.value)} min={ngayBatDau} max="2100-12-31" style={{ fontSize: 18, padding: 8, borderRadius: 5, border: 'none' }} />
        </div>
      </div>

      {/* Content Wrapper (bao bọc tất cả các ô) */}
      <div className="content-wrapper">
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Doanh Thu Phòng</h3>
            <p>{loading ? '...' : stats.tongDoanhThuPhong.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="stat-card">
            <h3>Doanh Thu Dịch Vụ</h3>
            <p>{loading ? '...' : stats.tongDoanhThuDichVu.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="stat-card">
            <h3>Tổng doanh Thu</h3>
            <p>{loading ? '...' : stats.tongDoanhThu.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</div>}
        {/* Employee Cards */}
        <div className="employee-container">
          <div className="employee-card">
            <div className="avatar" style={{ backgroundColor: '#f4c430' }}></div>
            <p>Nguyễn Văn A</p>
          </div>
          <div className="employee-card employee-card-middle">
            <div className="avatar" style={{ backgroundColor: '#1e6bd0' }}></div>
            <p>Minh Đức</p>
          </div>
          <div className="employee-card">
            <div className="avatar" style={{ backgroundColor: '#1e6bd0' }}></div>
            <p>Minh Đức</p>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  );
};

export default Dashboard;