import React from 'react';
import '../Components_Css/Sliderbar.css';
import { Link } from "react-router-dom";

const Sidebar = ({ isSidebarOpen, toggleSidebar, onLogoutClick }) => {
  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sb-close-icon"><img onClick={toggleSidebar} src="/icon_LTW/dongslidebar.png" alt="Đóng Sidebar"></img></div>
        <div className="avatar-placeholder"><img src="/icon_LTW/Admin.jpg" alt="Avatar Admin"></img></div>
        <p>Administrator</p>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/Dashboard">
            <span className="menu-icon"><img src="/icon_LTW/SB_TrangChu.png" alt="Trang Chủ"></img></span> Trang Chủ
          </Link>
        </li>
        <li>
          <Link to="/RoomAdmin">
            <span className="menu-icon"><img src="/icon_LTW/SB_Phong.png" alt="Phòng"></img></span> Phòng
          </Link>
        </li>
        <li>
          <Link to="/BookingRoom">
            <span className="menu-icon"><img src="/icon_LTW/SB_DatPhong.png" alt="Đặt Phòng"></img></span> Đặt Phòng
          </Link>
        </li>
        <li>
          <Link to="/BillAdmin">
            <span className="menu-icon"><img src="/icon_LTW/SB_HoaDon.png" alt="Hóa Đơn"></img></span> Hóa Đơn
          </Link>
        </li>
        <li>
          <Link to="/CustomerManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLKH.png" alt="QL Khách Hàng"></img></span> QL Khách Hàng
          </Link>
        </li>
        <li>
          <Link to="/RoomManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLPhong.png" alt="QL Phòng"></img></span> QL Phòng
          </Link>
        </li>
        <li>
          <Link to="/RoomTypeManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLLoaiPhong.png" alt="QL Loại Phòng"></img></span> QL Loại Phòng
          </Link>
        </li>
        <li>
          <Link to="/ServiceManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLDichVu.png" alt="QL Dịch Vụ"></img></span> QL Dịch Vụ
          </Link>
        </li>
        <li>
          <Link to="/ServiceTypeManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLLoaiDichVu.png" alt="QL Loại Dịch Vụ"></img></span> QL Loại Dịch Vụ
          </Link>
        </li>
        <li>
          <Link to="/LoyaltyPointsManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLTichDiem.png" alt="QLCT Tích Điểm"></img></span> QLCT Tích Điểm
          </Link>
        </li>
        <li>
          <Link to="/PointHistoryManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLLSTichDiem.png" alt="QL Lịch Sử Tích Điểm"></img></span> QL Lịch Sử Tích Điểm
          </Link>
        </li>
        <li>
          <Link to="/AccountManager">
            <span className="menu-icon"><img src="/icon_LTW/SB_QLTaiKhoan.png" alt="QL Tài Khoản"></img></span> QL Tài Khoản
          </Link>
        </li>
        <li>
          <button onClick={onLogoutClick} className="sidebar-menu-button">
            <span className="menu-icon"><img src="/icon_LTW/SB_DangXuat.png" alt="Đăng Xuất"></img></span> Đăng Xuất
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;