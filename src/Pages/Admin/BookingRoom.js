import React, { useState, useEffect } from 'react';
import '../../Design_Css/Admin/BookingRoom.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';
import axios from 'axios';

const BookingList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCustomerNotFound, setShowCustomerNotFound] = useState(false);
  const [showNoRoomSelected, setShowNoRoomSelected] = useState(false);
  const [showMissingTimeInfo, setShowMissingTimeInfo] = useState(false);
  const [showInvalidCheckOutTime, setShowInvalidCheckOutTime] = useState(false);
  const [showMissingCustomerInfo, setShowMissingCustomerInfo] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState({});
  const [employeeName, setEmployeeName] = useState('Unknown');

  const [customerInfo, setCustomerInfo] = useState({
    hoTen: '',
    sdt: ''
  });
  const [bookingInfo, setBookingInfo] = useState({
    ngayBatDau: '',
    gioBatDau: '',
    ngayKetThuc: '',
    gioKetThuc: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  // Hàm định dạng thời gian theo UTC+7
  const formatDateToISOWithOffset = (date) => {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
  };

  useEffect(() => {
    const fetchEmployeeName = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          console.warn('Không tìm thấy tên tài khoản trong localStorage');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/accounts/username/${username}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success && response.data.data.tenHienThi) {
          setEmployeeName(response.data.data.tenHienThi);
        } else {
          console.warn('Không tìm thấy tên hiển thị từ API');
        }
      } catch (error) {
        console.error('Lỗi khi lấy tên hiển thị nhân viên:', error);
      }
    };
    fetchEmployeeName();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings`, {
          params: {
            pageNumber: 1,
            pageSize: 100,
            searchTerm: null,
            sortBy: 'MaDatPhong',
            sortOrder: 'DESC' // Sắp xếp mới nhất lên đầu
          }
        });
        if (response.data.success) {
          const bookingData = response.data.data;
          setBookings(bookingData);
          await fetchCustomerData(bookingData);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đặt phòng:', error);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/room-types`, {
          params: {
            pageNumber: 1,
            pageSize: 100,
            sortBy: 'MaLoaiPhong',
            sortOrder: 'DESC'
          }
        });
        if (response.data.success) {
          const typesMap = {};
          response.data.data.forEach(type => {
            typesMap[type.maLoaiPhong] = type.tenLoaiPhong;
          });
          setRoomTypes(typesMap);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách loại phòng:', error);
      }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/rooms`, {
          params: {
            pageNumber: 1,
            pageSize: 100,
            trangThai: 'Trống',
            tinhtrang: 'Đã dọn dẹp',
            sortBy: 'MaPhong',
            sortOrder: 'ASC'
          }
        });
        if (response.data.success) {
          const rooms = response.data.data.map(room => ({
            id: room.soPhong,
            maPhong: room.maPhong,
            maLoaiPhong: room.loaiPhong,
            type: roomTypes[room.loaiPhong] || 'Chưa xác định'
          }));
          setAvailableRooms(rooms);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng trống:', error);
      }
    };

    if (Object.keys(roomTypes).length > 0) {
      fetchAvailableRooms();
    }
  }, [roomTypes]);

  const fetchCustomerData = async (bookingData) => {
    try {
      const customerPromises = bookingData.map(async (booking) => {
        try {
          const customerResponse = await axios.get(`${API_BASE_URL}/customers/${booking.maKhachHang}`);
          if (customerResponse.data.success) {
            return { [booking.maKhachHang]: customerResponse.data.data.hoTenKhachHang };
          }
          return { [booking.maKhachHang]: 'Unknown' };
        } catch (error) {
          return { [booking.maKhachHang]: 'Unknown' };
        }
      });
      const customersData = await Promise.all(customerPromises);
      const customersMap = Object.assign({}, ...customersData);
      setCustomers(customersMap);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
    }
  };

  // Phân trang cho danh sách booking
  const filteredBookings = bookings.filter((booking) =>
    customers[booking.maKhachHang]?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDetails = async (maDatPhong) => {
    try {
      const bookingResponse = await axios.get(`${API_BASE_URL}/bookings/${maDatPhong}`);
      if (bookingResponse.data.success) {
        const booking = bookingResponse.data.data;
        const roomResponse = await axios.get(`${API_BASE_URL}/rooms/${booking.maPhong}`);
        let roomNumber = 'Chưa xác định';
        if (roomResponse.data.success) {
          roomNumber = roomResponse.data.data.soPhong;
        }
        const checkInDate = new Date(booking.gioCheckIn);
        const checkOutDate = new Date(booking.gioCheckOut);
        const formattedStartDate = checkInDate.toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        const formattedEndDate = checkOutDate.toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setSelectedBooking({
          id: booking.maDatPhong,
          customerName: customers[booking.maKhachHang] || 'Unknown',
          bookingDate: new Date(booking.ngayDat).toLocaleDateString('vi-VN'),
          employeeName: employeeName,
          roomNumber: roomNumber,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          loaiTinhTien: booking.loaiTinhTien || 'Chưa xác định'
        });
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đặt phòng:', error);
    }
  };

  const handleSaveBooking = async () => {
    if (selectedRooms.length === 0) {
      setShowNoRoomSelected(true);
      return;
    }
    if (selectedRooms.length > 1) {
      alert('Chỉ được chọn một phòng duy nhất cho mỗi lần đặt.');
      return;
    }

    if (!customerInfo.hoTen || !customerInfo.sdt) {
      setShowMissingCustomerInfo(true);
      return;
    }
    if (!bookingInfo.ngayBatDau || !bookingInfo.gioBatDau || !bookingInfo.ngayKetThuc || !bookingInfo.gioKetThuc) {
      setShowMissingTimeInfo(true);
      return;
    }

    try {
      console.log(`Kiểm tra số điện thoại: ${customerInfo.sdt} và họ tên: ${customerInfo.hoTen}`);
      const customersResponse = await axios.get(`${API_BASE_URL}/customers`, {
        params: {
          pageNumber: 1,
          pageSize: 100,
          searchTerm: customerInfo.sdt,
          sortBy: 'MaKhachHang',
          sortOrder: 'ASC'
        }
      });

      if (!customersResponse.data.success || customersResponse.data.data.length === 0) {
        setShowCustomerNotFound(true);
        return;
      }

      const existingCustomer = customersResponse.data.data.find(
        customer => customer.dienThoai === customerInfo.sdt && customer.hoTenKhachHang.toLowerCase() === customerInfo.hoTen.toLowerCase()
      );

      if (!existingCustomer) {
        setShowCustomerNotFound(true);
        return;
      }

      const maKhachHang = existingCustomer.maKhachHang;
      console.log(`Sử dụng khách hàng hiện có với maKhachHang: ${maKhachHang}`);

      // Tạo thời gian check-in và check-out theo giờ địa phương (UTC+7)
      const checkIn = new Date(`${bookingInfo.ngayBatDau}T${bookingInfo.gioBatDau}:00`);
      const checkOut = new Date(`${bookingInfo.ngayKetThuc}T${bookingInfo.gioKetThuc}:00`);

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        alert('Thời gian check-in hoặc check-out không hợp lệ.');
        return;
      }
      
      if (checkIn >= checkOut) {
        setShowInvalidCheckOutTime(true);
        return;
      }

      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      const loaiTinhTien = hours > 12 ? 'Nightly' : 'Hourly';

      const parsedMaKhachHang = parseInt(maKhachHang);
      const parsedMaPhong = parseInt(selectedRooms[0].maPhong);
      if (isNaN(parsedMaKhachHang) || isNaN(parsedMaPhong)) {
        console.error('Lỗi parseInt:', { maKhachHang, maPhong: selectedRooms[0].maPhong });
        alert('Dữ liệu khách hàng hoặc phòng không hợp lệ. Vui lòng kiểm tra lại.');
        return;
      }

      const bookingData = {
        maKhachHang: parsedMaKhachHang,
        maPhong: parsedMaPhong,
        gioCheckIn: formatDateToISOWithOffset(checkIn),
        gioCheckOut: formatDateToISOWithOffset(checkOut),
        ngayDat: formatDateToISOWithOffset(new Date()),
        loaiTinhTien: loaiTinhTien
      };

      console.log('Dữ liệu gửi đi:', bookingData);

      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData);
      console.log('Phản hồi từ API:', bookingResponse.data);

      if (!bookingResponse.data.success) {
        throw new Error(`Tạo đặt phòng thất bại: ${bookingResponse.data.message || 'Lỗi không xác định'}`);
      }

      const maDatPhong = bookingResponse.data.data;
      console.log(`Tạo đặt phòng thành công với maDatPhong: ${maDatPhong}`);
      const confirmResponse = await axios.put(`${API_BASE_URL}/bookings/${maDatPhong}/confirm`);
      if (!confirmResponse.data.success) {
        throw new Error('Xác nhận đặt phòng thất bại: ' + (confirmResponse.data.message || 'Lỗi không xác định'));
      }
      console.log(`Xác nhận đặt phòng thành công`);

      setShowSaveConfirm(true);
      setIsFormOpen(false);
      setSelectedRooms([]);
      setCustomerInfo({ hoTen: '', sdt: '' });
      setBookingInfo({ ngayBatDau: '', gioBatDau: '', ngayKetThuc: '', gioKetThuc: '' });

      const updatedBookingsResponse = await axios.get(`${API_BASE_URL}/bookings`, {
        params: { pageNumber: 1, pageSize: 100, sortBy: 'MaDatPhong', sortOrder: 'ASC' }
      });
      if (updatedBookingsResponse.data.success) {
        setBookings(updatedBookingsResponse.data.data);
        await fetchCustomerData(updatedBookingsResponse.data.data);
      }

      const roomResponse = await axios.get(`${API_BASE_URL}/rooms`, {
        params: {
          pageNumber: 1,
          pageSize: 100,
          trangThai: 'Trống',
          tinhtrang: 'Đã dọn dẹp',
          sortBy: 'MaPhong',
          sortOrder: 'ASC'
        }
      });
      if (roomResponse.data.success) {
        const rooms = roomResponse.data.data.map(room => ({
          id: room.soPhong,
          maPhong: room.maPhong,
          maLoaiPhong: room.loaiPhong,
          type: roomTypes[room.loaiPhong] || 'Chưa xác định'
        }));
        setAvailableRooms(rooms);
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi tạo đặt phòng:', error.response?.data || error.message);
      alert('Đã xảy ra lỗi khi tạo đặt phòng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCloseCustomerNotFound = () => {
    setShowCustomerNotFound(false);
  };

  const handleCloseNoRoomSelected = () => {
    setShowNoRoomSelected(false);
  };

  const handleCloseMissingTimeInfo = () => {
    setShowMissingTimeInfo(false);
  };

  const handleCloseInvalidCheckOutTime = () => {
    setShowInvalidCheckOutTime(false);
  };

  const handleCloseMissingCustomerInfo = () => {
    setShowMissingCustomerInfo(false);
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingInfoChange = (e) => {
    const { name, value } = e.target;
    setBookingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSaveConfirm = () => {
    setShowSaveConfirm(false);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddBooking = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setAvailableRooms(prev => [...prev, ...selectedRooms.map(room => ({
      id: room.id,
      maPhong: room.maPhong,
      maLoaiPhong: room.maLoaiPhong,
      type: room.type
    }))]);
    setSelectedRooms([]);
    setCustomerInfo({ hoTen: '', sdt: '' });
    setBookingInfo({ ngayBatDau: '', gioBatDau: '', ngayKetThuc: '', gioKetThuc: '' });
    setIsFormOpen(false);
  };

  const handleAddRoom = (room) => {
    if (selectedRooms.length >= 1) {
      alert('Chỉ được chọn một phòng duy nhất cho mỗi lần đặt.');
      return;
    }
    setSelectedRooms([...selectedRooms, { ...room, guests: 1 }]);
    setAvailableRooms(availableRooms.filter((r) => r.id !== room.id));
  };

  const handleRemoveRoom = (roomId) => {
    const removedRoom = selectedRooms.find((r) => r.id === roomId);
    setSelectedRooms(selectedRooms.filter((room) => room.id !== roomId));
    setAvailableRooms([...availableRooms, removedRoom]);
  };

  const handleMoreOptions = () => {
    console.log('Mở tùy chọn bổ sung');
  };

  return (
    <div className="booking-list-container">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogoutClick={handleLogoutClick}
      />
      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      <div className="top-header">
        <div className="top-title-container">
          <div className="menu-icon" onClick={toggleSidebar}>☰</div>
          <div className="top-title">Đặt Phòng</div>
        </div>
        <div className="more-icon" onClick={handleMoreOptions}>⋮</div>
      </div>

      <div className="content-wrapperr">
        <div className="search-bar-container">
          <div className="search-barr">
            <span className="search-icon"><img src="/icon_LTW/TimKiem.png" alt="Tìm kiếm"></img></span>
            <input
              type="text"
              placeholder="Tìm theo tên khách hàng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="add-booking-button" onClick={handleAddBooking}>
            Đặt phòng
          </button>
        </div>

        <div className="table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Số phiếu thuê</th>
                <th>Tên khách hàng</th>
                <th>Ngày lập phiếu</th>
                <th>Tên nhân viên</th>
                <th>Chi tiết</th>
                {/* Đã xóa cột Xóa */}
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => (
                <tr key={booking.maDatPhong}>
                  <td>{booking.maDatPhong}</td>
                  <td>{customers[booking.maKhachHang] || 'Unknown'}</td>
                  <td>{new Date(booking.ngayDat).toLocaleDateString('vi-VN')}</td>
                  <td>{employeeName}</td>
                  <td>
                    <button
                      className="details-buttonn"
                      onClick={() => handleDetails(booking.maDatPhong)}
                    >
                      <img src="/icon_LTW/ChiTiet.png" alt="Chi tiết"></img>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Trang trước
          </button>
          <span className="pagination-info">Trang {currentPage} / {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Trang sau
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="booking-form-overlay">
          <div className="booking-form-container">
            <h2 className="booking-form-title">Đặt Phòng</h2>

            <div className="form-sections">
              <div className="form-section">
                <h3>Thông tin khách hàng</h3>
                <div className="form-group">
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/ĐP_Hoten.png" alt="Họ tên"></img></span>
                    <input
                      type="text"
                      name="hoTen"
                      placeholder="Họ và tên"
                      value={customerInfo.hoTen}
                      onChange={handleCustomerInfoChange}
                    />
                  </div>
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/ĐP_SĐT.png" alt="SĐT"></img></span>
                    <input
                      type="text"
                      name="sdt"
                      placeholder="Nhập SĐT"
                      value={customerInfo.sdt}
                      onChange={handleCustomerInfoChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Thông tin phòng</h3>
                <div className="form-group">
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/Lich.png" alt="Ngày bắt đầu"></img></span>
                    <input
                      type="date"
                      name="ngayBatDau"
                      placeholder="Ngày bắt đầu"
                      value={bookingInfo.ngayBatDau}
                      onChange={handleBookingInfoChange}
                    />
                  </div>
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/DongHo.png" alt="Giờ bắt đầu"></img></span>
                    <input
                      type="time"
                      name="gioBatDau"
                      placeholder="Giờ bắt đầu"
                      value={bookingInfo.gioBatDau}
                      onChange={handleBookingInfoChange}
                    />
                  </div>
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/Lich.png" alt="Ngày kết thúc"></img></span>
                    <input
                      type="date"
                      name="ngayKetThuc"
                      placeholder="Ngày kết thúc"
                      value={bookingInfo.ngayKetThuc}
                      onChange={handleBookingInfoChange}
                    />
                  </div>
                  <div className="form-row">
                    <span className="form-icon"><img src="/icon_LTW/DongHo.png" alt="Giờ kết thúc"></img></span>
                    <input
                      type="time"
                      name="gioKetThuc"
                      placeholder="Giờ kết thúc"
                      value={bookingInfo.gioKetThuc}
                      onChange={handleBookingInfoChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rooms-scrollable-container">
              <div className="rooms-container">
                <div className="rooms-section">
                  <h4>Danh sách phòng trống</h4>
                  <table className="room-table">
                    <thead>
                      <tr>
                        <th>Số phòng</th>
                        <th>Loại phòng</th>
                        <th>Thêm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableRooms.length > 0 ? (
                        availableRooms.map((room) => (
                          <tr key={room.id}>
                            <td>{room.id}</td>
                            <td>{room.type}</td>
                            <td>
                              <button
                                className="action-button add-room-button"
                                onClick={() => handleAddRoom(room)}
                                disabled={selectedRooms.length >= 1}
                              >
                                <img src="/icon_LTW/MdiPlusCircle.png" alt="Thêm phòng"></img>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">Không có phòng trống</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rooms-section">
                  <h4>Phòng đã chọn</h4>
                  <table className="room-table">
                    <thead>
                      <tr>
                        <th>Số phòng</th>
                        <th>Loại phòng</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRooms.length > 0 ? (
                        selectedRooms.map((room) => (
                          <tr key={room.id}>
                            <td>{room.id}</td>
                            <td>{room.type}</td>
                            <td>
                              <button
                                className="action-button remove-room-button"
                                onClick={() => handleRemoveRoom(room.id)}
                              >
                                <img src="/icon_LTW/MdiMinusCircle.png" alt="Xóa phòng"></img>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">Chưa có phòng nào được chọn</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="form-buttons">
              <button className="cancel-buttonn" onClick={handleSaveBooking} style={{ backgroundColor: '#1D3E92' }}>LƯU</button>
              <button className="cancel-buttonn" onClick={handleCloseForm}>THOÁT</button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleSaveConfirm}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn đã đặt phòng thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleSaveConfirm}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerNotFound && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseCustomerNotFound}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Không tìm thấy khách hàng với thông tin này!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseCustomerNotFound}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoRoomSelected && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseNoRoomSelected}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Vui lòng chọn một phòng trước khi lưu!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseNoRoomSelected}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showMissingTimeInfo && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseMissingTimeInfo}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">
              Vui lòng điền đầy đủ thông tin thời gian đặt phòng (Ngày và Giờ bắt đầu/kết thúc)!
            </p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseMissingTimeInfo}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvalidCheckOutTime && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseInvalidCheckOutTime}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Thời gian check-out phải sau thời gian check-in!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseInvalidCheckOutTime}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showMissingCustomerInfo && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseMissingCustomerInfo}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Vui lòng điền đầy đủ thông tin khách hàng (Họ tên và Số điện thoại)!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseMissingCustomerInfo}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedBooking && (
        <div className="details-modal">
          <div className="details-modal-contentt">
            <h2 className="details-modal-title">Chi Tiết Phiếu Thuê {selectedBooking.id}</h2>
            <div className="details-modal-header">
              <div className="header-item">
                <span role="img" aria-label="user"><img src="/icon_LTW/ĐP_ChiTietphieuthue.png" alt="Khách hàng"></img></span>
                {selectedBooking.customerName}
              </div>
              <div className="header-item">
                <span role="img" aria-label="calendar"><img src="/icon_LTW/Lich.png" alt="Ngày lập"></img></span>
                {selectedBooking.bookingDate}
              </div>
              <div className="header-item">
                <span role="img" aria-label="employee"><img src="/icon_LTW/ĐPChiTietphieuthue2.png" alt="Nhân viên"></img></span>
                {selectedBooking.employeeName}
              </div>
            </div>
            <table className="bk-details-table">
              <thead>
                <tr>
                  <th>Số phòng</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Loại tính tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedBooking.roomNumber || 'Không xác định'}</td>
                  <td>{selectedBooking.startDate || 'Không xác định'}</td>
                  <td>{selectedBooking.endDate || 'Không xác định'}</td>
                  <td>{selectedBooking.loaiTinhTien === 'Nightly' ? 'Theo đêm' : selectedBooking.loaiTinhTien === 'Hourly' ? 'Theo giờ' : 'Không xác định'}</td>
                </tr>
              </tbody>
            </table>
            <div className="details-modal-buttons">
              <button className="close-details-buttonn" onClick={handleCloseDetails}>
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;