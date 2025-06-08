import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/PointHistoryManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const PointHistoryManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pointHistory, setPointHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const API_BASE_URL = 'https://localhost:7087'; // URL cố định của backend

  const fetchPointHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/point-history?searchTerm=${searchTerm}&sortBy=MaLSTD&sortOrder=ASC`
      );
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText.substring(0, 200)}`);
      }
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Phản hồi từ server không phải là JSON hợp lệ: ' + text.substring(0, 200));
      }
      const result = await response.json();
      console.log('API Response:', result);
      if (result.success) {
        const historyData = result.data || [];
        console.log('Point History Data:', historyData);
        if (!Array.isArray(historyData)) {
          throw new Error('Dữ liệu lịch sử điểm không phải là mảng');
        }
        const validatedData = historyData.map((record) => ({
          id: record.maLSTD || `TEMP_${record.maLSTD || Date.now()}`,
          customerName: record.hoTenKhachHang || 'Khách hàng không xác định',
          points: record.soDiem !== undefined ? record.soDiem : 0,
          transactionDate: new Date(record.ngayGiaoDich).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', ''),
          transactionType: record.loaiGiaoDich || 'Tích điểm'
        }));
        setPointHistory(validatedData);
        setErrorMessage('');
      } else {
        throw new Error(result.message || 'Không thể tải danh sách lịch sử điểm');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setPointHistory([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPointHistory();
  }, [fetchPointHistory]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  const filteredHistory = pointHistory.filter((record) =>
    record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (dateFilter === '' || record.transactionDate.split(' ')[0] === dateFilter.split('-').reverse().join('/'))
  );

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="phm-main-container">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />
      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      <div className="top-header">
        <div className="top-title-container">
          <div className="menu-icon" onClick={toggleSidebar}>☰</div>
          <div className="top-title">Quản Lý Lịch Sử Tích Điểm</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="phm-content-wrapper">
        {errorMessage && (
          <div className="phm-error-message">
            {errorMessage}
          </div>
        )}
        <div className="phm-filter-section">
          <div className="phm-search-box">
            <span className="phm-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo tên khách hàng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="phm-date-filter">
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateFilter}
            />
          </div>
          {/* Loại bỏ nút Thêm lịch sử */}
        </div>

        <div className="phm-table-container">
          <table className="phm-history-table">
            <thead>
              <tr>
                <th>Mã Lịch Sử Điểm</th>
                <th>Tên Khách Hàng</th>
                <th>Số Điểm</th>
                <th>Ngày Giao Dịch</th>
                <th>Loại Giao Dịch</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.customerName}</td>
                    <td>{record.points.toLocaleString()}</td>
                    <td>{record.transactionDate}</td>
                    <td>{record.transactionType}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Không có dữ liệu để hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PointHistoryManagement;