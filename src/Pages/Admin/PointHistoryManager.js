import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
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
  const [isLoading, setIsLoading] = useState(false);
const API_BASE_URL = process.env.REACT_APP_API_URL;
  const fetchAllPointHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/point-history?searchTerm=${searchTerm}&sortBy=MaLSTD&sortOrder=DESC&pageNumber=1&pageSize=1000`
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
      if (result.success) {
        const historyData = result.data || [];
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
          rawDate: new Date(record.ngayGiaoDich),
          transactionType: record.loaiGiaoDich || 'Tích điểm'
        }));
        setPointHistory(validatedData);
      } else {
        throw new Error(result.message || 'Không thể tải danh sách lịch sử điểm');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setPointHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, API_BASE_URL]);

  // Debounce search
  const debouncedFetch = useMemo(() => debounce(fetchAllPointHistory, 500), [fetchAllPointHistory]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  const filteredHistory = useMemo(() => pointHistory.filter((record) => {
    const matchesSearch = record.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!dateFilter) return matchesSearch;

    const filterDate = new Date(dateFilter);
    const recordDate = record.rawDate;
    return matchesSearch &&
           recordDate.getFullYear() === filterDate.getFullYear() &&
           recordDate.getMonth() === filterDate.getMonth() &&
           recordDate.getDate() === filterDate.getDate();
  }), [pointHistory, searchTerm, dateFilter]);

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="invoice-list-container">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />
        <div className="loading-container"><p>Đang tải dữ liệu...</p></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="invoice-list-container">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />
        <div className="error-container">
          <p>Lỗi: {errorMessage}</p>
          <button onClick={fetchAllPointHistory}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-list-container">
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
        <div className="header-actions">
          <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
        </div>
      </div>

      <div className="content-wrapperr">
        <div className="search-barr-container">
          <div className="search-bar">
            <span className="search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo tên khách hàng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="date-picker">
            <span className="calendar-icon"><img src="/icon_LTW/Lich.png" alt="Lịch" /></span>
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateFilter}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="invoice-table">
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