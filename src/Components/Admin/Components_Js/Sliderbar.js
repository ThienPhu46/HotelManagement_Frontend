import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../Components_Css/Sliderbar.css';
import { Link } from "react-router-dom";

const Sidebar = ({ isSidebarOpen, toggleSidebar, onLogoutClick }) => {
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState('/icon_LTW/Admin.jpg');
  const API_BASE_URL = 'https://localhost:7087/api';
  // Hàm lấy thông tin người dùng hiện tại
  const fetchCurrentUser = useCallback(async () => {
    try {
      const username = localStorage.getItem('username');
      if (username) {
        const response = await axios.get(`${API_BASE_URL}/accounts/username/${username}`);
        if (response.data && response.data.tenHienThi) {
          setCurrentUserName(response.data.tenHienThi);
        } else {
          setCurrentUserName(username); // Fallback to username if tenHienThi is not available
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      const username = localStorage.getItem('username');
      setCurrentUserName(username || 'Administrator'); // Fallback
    }
  }, [API_BASE_URL]);
  // Hàm tải avatar từ localStorage cho người dùng cụ thể
  const loadAvatar = useCallback(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const savedAvatar = localStorage.getItem(`userAvatar_${username}`);
      if (savedAvatar) {
        setCurrentAvatar(savedAvatar);
      }
    }
  }, []);
  // Hàm xử lý khi chọn file avatar từ máy tính
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatar = e.target.result;
        const username = localStorage.getItem('username');
        setCurrentAvatar(newAvatar);
        if (username) {
          localStorage.setItem(`userAvatar_${username}`, newAvatar);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Vui lòng chọn file hình ảnh hợp lệ!');
    }
  };

  // Hàm mở dialog chọn file
  const handleAvatarClick = () => {
    document.getElementById('avatar-file-input').click();
  };

  useEffect(() => {
    fetchCurrentUser();
    loadAvatar();
  }, [fetchCurrentUser, loadAvatar]);
  return (    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>      
      <input 
        type="file" 
        id="avatar-file-input" 
        accept="image/*" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className="sidebar-header">
        <div className="sb-close-icon"><img onClick={toggleSidebar} src="/icon_LTW/dongslidebar.png" alt="Đóng Sidebar"></img></div>        <div className="avatar-placeholder" onClick={handleAvatarClick}>
          <img 
            src={currentAvatar} 
            alt="Avatar Admin" 
            style={{ 
              objectFit: 'cover',
              border: '3px solid #fff'
            }}
          />
        </div>
        <p>{currentUserName || 'Administrator'}</p>
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