import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomCard from '../../Components/Staff/Components_Js/RoomCard';
import '../../Design_Css/Staff/RoomStaff.css';
import Sidebar from '../../Components/Staff/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Staff/Components_Js/LogoutModal';

const Room = () => {
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterCondition, setFilterCondition] = useState('Tất cả');  const [searchTerm, setSearchTerm] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [cleaningStatus, setCleaningStatus] = useState('Đã dọn dẹp');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceCategory, setServiceCategory] = useState('Tất cả');
  const [searchService, setSearchService] = useState('');  const [showInvoiceModal, setShowInvoiceModal] = useState(false);  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = 'http://localhost:5282/api';

  // Hàm lấy dữ liệu booking từ server
  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: {
          pageNumber: 1,
          pageSize: 1000,
          sortBy: 'MaDatPhong',
          sortOrder: 'ASC'
        }
      });
      
      if (response.data.success) {
        const bookingData = response.data.data;
        setBookings(bookingData);
        await fetchCustomerData(bookingData);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách booking:', error);
    }
  }, []);

  // Hàm lấy thông tin khách hàng
  const fetchCustomerData = async (bookingData) => {
    try {
      const customerPromises = bookingData.map(async (booking) => {
        try {
          const customerResponse = await axios.get(`${API_BASE_URL}/customers/${booking.maKhachHang}`);
          if (customerResponse.data.success) {
            return { [booking.maKhachHang]: customerResponse.data.data.hoTenKhachHang };
          }
          return { [booking.maKhachHang]: 'Khách hàng không xác định' };
        } catch (error) {
          return { [booking.maKhachHang]: 'Khách hàng không xác định' };
        }
      });
      const customersData = await Promise.all(customerPromises);
      const customersMap = Object.assign({}, ...customersData);
      setCustomers(customersMap);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
    }
  };

  // Hàm lấy dữ liệu phòng từ server
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/rooms`, {
        params: { searchTerm: '', sortBy: 'MaPhong', sortOrder: 'ASC' },
      });
      
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {        const mappedRooms = response.data.data.map(room => {
          // Hàm lấy tên loại phòng (moved inside callback)
          const getRoomTypeNameLocal = (loaiPhong) => {
            const roomType = roomTypes.find((type) => String(type.MaLoaiPhong) === String(loaiPhong));
            return roomType ? roomType.TenLoaiPhong : 'Không xác định';
          };

          // Lấy thông tin booking thực tế cho phòng này
          const activeBooking = bookings.find(booking => 
            booking.maPhong === room.maPhong && 
            (room.trangThai === 'Đã đặt' || room.trangThai === 'Đang thuê')
          );

          const bookingInfo = activeBooking ? {
            guestName: customers[activeBooking.maKhachHang] || 'Đang tải...',
            checkInDate: activeBooking.gioCheckIn,
            numberOfGuests: activeBooking.soKhach || 1
          } : {
            guestName: '',
            checkInDate: null,
            numberOfGuests: 1
          };

          return {
            number: room.soPhong || '',
            status: mapStatusFromAPI(room.trangThai),
            date: calculateRoomDays(room.trangThai, bookingInfo.checkInDate),
            roomType: getRoomTypeNameLocal(room.loaiPhong),
            condition: room.tinhTrang || 'Đã dọn dẹp',
            guestName: bookingInfo.guestName, // Sử dụng tên khách thực tế
            checkInDate: bookingInfo.checkInDate, // Sử dụng ngày check-in thực tế
            numberOfGuests: bookingInfo.numberOfGuests,
            apiData: room // Lưu dữ liệu gốc từ API
          };
        });
          setRooms(mappedRooms);
          setError(null);
        } else {
          setError('Dữ liệu phòng không đúng định dạng.');
          setRooms([]);
        }
      } else {
        setError(response.data.message || 'Lỗi khi lấy danh sách phòng từ API.');
        setRooms([]);
      }
    } catch (error) {
      setError(`Lỗi khi lấy danh sách phòng: ${error.message}`);
      setRooms([]);    } finally {
      setLoading(false);
    }
  }, [roomTypes, bookings, customers]);

  // Hàm lấy dữ liệu loại phòng từ server
  const fetchRoomTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/room-types`);
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          const mappedRoomTypes = response.data.data.map(type => ({
            MaLoaiPhong: type.maLoaiPhong,
            TenLoaiPhong: type.tenLoaiPhong || 'Không xác định',
            GiaPhong: type.giaPhong || 0,
            MoTa: type.moTa || '',
          }));
          setRoomTypes(mappedRoomTypes);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi lấy danh sách loại phòng: ${error.message}`);
    }
  }, []);

  // Hàm map trạng thái từ API sang UI
  const mapStatusFromAPI = (apiStatus) => {
    switch (apiStatus) {
      case 'Trống':
        return 'Phòng trống';
      case 'Đã đặt':
        return 'Phòng đã đặt';
      case 'Đang thuê':
        return 'Phòng đang thuê';
      default:
        return 'Phòng trống';
    }
  };  // Hàm tính số ngày dựa trên trạng thái và ngày check-in thực tế
  const calculateRoomDays = (status, checkInDate) => {
    if (status === 'Trống') return '0 ngày';
    
    if (checkInDate) {
      const today = new Date();
      const checkIn = new Date(checkInDate);
      const diffTime = Math.abs(today - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + ' ngày';
    }
    
    return '1 ngày'; // Fallback cho trường hợp không có dữ liệu
  };  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (roomTypes.length > 0 && bookings.length >= 0) {
      fetchRooms();
    }
  }, [roomTypes, bookings, fetchRooms]);

  const services = [
    { category: 'Đồ ăn', name: 'Cơm chiên', price: 30000 },
    { category: 'Đồ ăn', name: 'Mỳ xào', price: 25000 },
    { category: 'Nước uống', name: 'Pepsi', price: 12000 },
    { category: 'Nước uống', name: 'Sting', price: 12000 },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleRoomClick = (room) => {
    if (['Phòng trống', 'Phòng đang thuê', 'Phòng đã đặt'].includes(room.status)) {
      setSelectedRoom(room);
      setCleaningStatus(room.condition || 'Đã dọn dẹp');
      setSelectedServices([]);
    }
  };

  const closeForm = () => {
    setSelectedRoom(null);
    setShowAddServiceForm(false);
    setShowInvoiceModal(false);
    setSelectedServices([]);
  };

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSave = () => {
    if (selectedRoom) {
      console.log('Thông tin đã lưu:', { room: selectedRoom.number, cleaningStatus, services: selectedServices });
      const updatedRooms = rooms.map(room =>
        room.number === selectedRoom.number
          ? { ...room, condition: cleaningStatus }
          : room
      );
      setRooms(updatedRooms);
      setSelectedRoom(null);
      setSuccessMessage('Lưu thành công!');
      setShowSaveSuccess(true);
    }
  };

  const handleCheckIn = () => {
    if (selectedRoom) {
      console.log(`Nhận phòng thành công cho phòng ${selectedRoom.number}`);
      const updatedRooms = rooms.map(room =>
        room.number === selectedRoom.number
          ? { ...room, status: 'Phòng đang thuê' }
          : room
      );
      setRooms(updatedRooms);
      setSelectedRoom({ ...selectedRoom, status: 'Phòng đang thuê' });
    }
  };

  const handleAddService = () => {
    setShowAddServiceForm(true);
  };

  const handlePayment = () => {
    if (selectedRoom) {
      console.log('Thanh toán cho phòng:', selectedRoom.number);
      setShowInvoiceModal(true);
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
  };

  const handleCloseSaveSuccess = () => {
    setShowSaveSuccess(false);
    setSuccessMessage('');
  };

  const handleCloseAddServiceForm = () => {
    setShowAddServiceForm(false);
    setServiceCategory('Tất cả');
    setSearchService('');
    if (selectedServices.length > 0) {
      setSuccessMessage('Bạn đã thêm dịch vụ thành công');
      setShowSaveSuccess(true);
    }
  };

  const handleAddSelectedService = (service) => {
    const existingService = selectedServices.find(s => s.name === service.name);
    if (existingService) {
      const updatedServices = selectedServices.map(s =>
        s.name === service.name ? { ...s, quantity: s.quantity + 1 } : s
      );
      setSelectedServices(updatedServices);
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
  };

  const handleRemoveService = (index) => {
    const newSelectedServices = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(newSelectedServices);
  };

  const handleQuantityChange = (index, quantity) => {
    const newSelectedServices = selectedServices.map((service, i) =>
      i === index ? { ...service, quantity: Math.max(1, parseInt(quantity) || 1) } : service
    );
    setSelectedServices(newSelectedServices);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filterStatus === 'Tất cả' || room.status === filterStatus;
    const matchesType = filterType === 'Tất cả' || room.roomType === filterType;
    const matchesCondition = filterCondition === 'Tất cả' || room.condition === filterCondition;
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesCondition && matchesSearch;
  });

  const filteredServices = services.filter(service => {
    const matchesCategory = serviceCategory === 'Tất cả' || service.category === serviceCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchService.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const calculateInvoice = () => {
    if (!selectedRoom) return null;
    const roomPricePerDay = 300000;
    const days = parseInt(selectedRoom.date) || 1;
    const roomService = {
      name: 'Thuê phòng',
      price: roomPricePerDay,
      quantity: days,
      total: roomPricePerDay * days
    };
    const serviceItems = selectedServices.map(service => ({
      name: service.name,
      price: service.price,
      quantity: service.quantity,
      total: service.price * service.quantity
    }));
    const allServices = [roomService, ...serviceItems];
    const grandTotal = allServices.reduce((sum, item) => sum + item.total, 0);
    return {
      id: Math.floor(Math.random() * 1000),
      date: new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      employeeName: 'Chu Ngọc Sơn',
      total: grandTotal,
      bookingId: Math.floor(Math.random() * 100),
      customerName: selectedRoom.guestName || 'Khách hàng',
      customerRoom: selectedRoom.number,
      customerDays: days,
      customerPeople: selectedRoom.numberOfGuests || 1,
      services: allServices,
      grandTotal: grandTotal.toLocaleString('vi-VN') + ' VND'
    };
  };

  const invoice = calculateInvoice();

  return (
    <div className="r-room-container">
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
      <div className="r-page-header">
        <div className="r-menu-icon" onClick={toggleSidebar}>☰</div>
        <div className="r-header-content">
          <h1>Phòng</h1>
        </div>
        <div className="r-search-bar">
          <input
            type="text"
            placeholder="Tìm phòng"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="r-search-icon">▶</span>
        </div>
      </div>

      <div className="r-filter-sidebar">
        <div className="r-filter-section">
          <h3>Trạng thái</h3>
          <div className="r-filter-options">
            <label>
              <input type="radio" name="status" value="Tất cả" checked={filterStatus === 'Tất cả'} onChange={() => setFilterStatus('Tất cả')} />
              Tất cả
            </label>
            <label>
              <input type="radio" name="status" value="Phòng trống" checked={filterStatus === 'Phòng trống'} onChange={() => setFilterStatus('Phòng trống')} />
              Phòng trống
            </label>
            <label>
              <input type="radio" name="status" value="Phòng đã đặt" checked={filterStatus === 'Phòng đã đặt'} onChange={() => setFilterStatus('Phòng đã đặt')} />
              Phòng đã đặt
            </label>
            <label>
              <input type="radio" name="status" value="Phòng đang thuê" checked={filterStatus === 'Phòng đang thuê'} onChange={() => setFilterStatus('Phòng đang thuê')} />
              Phòng đang thuê
            </label>
          </div>
        </div>        <div className="r-filter-section">
          <h3>Loại phòng</h3>
          <div className="r-filter-options">
            <label>
              <input type="radio" name="type" value="Tất cả" checked={filterType === 'Tất cả'} onChange={() => setFilterType('Tất cả')} />
              Tất cả
            </label>
            {roomTypes.map((roomType) => (
              <label key={roomType.MaLoaiPhong}>
                <input 
                  type="radio" 
                  name="type" 
                  value={roomType.TenLoaiPhong} 
                  checked={filterType === roomType.TenLoaiPhong} 
                  onChange={() => setFilterType(roomType.TenLoaiPhong)} 
                />
                {roomType.TenLoaiPhong}
              </label>
            ))}
          </div>
        </div>
        <div className="r-filter-section">
          <h3>Tình trạng</h3>
          <div className="r-filter-options">
            <label>
              <input type="radio" name="condition" value="Tất cả" checked={filterCondition === 'Tất cả'} onChange={() => setFilterCondition('Tất cả')} />
              Tất cả
            </label>
            <label>
              <input type="radio" name="condition" value="Đã dọn dẹp" checked={filterCondition === 'Đã dọn dẹp'} onChange={() => setFilterCondition('Đã dọn dẹp')} />
              Đã dọn dẹp
            </label>
            <label>
              <input type="radio" name="condition" value="Chưa dọn dẹp" checked={filterCondition === 'Chưa dọn dẹp'} onChange={() => setFilterCondition('Chưa dọn dẹp')} />
              Chưa dọn dẹp
            </label>
            <label>
              <input type="radio" name="condition" value="Sửa chữa" checked={filterCondition === 'Sửa chữa'} onChange={() => setFilterCondition('Sửa chữa')} />
              Sửa chữa
            </label>
          </div>
        </div>
      </div>      <div className="r-main-content">
        {loading ? (
          <div className="loading-container">
            <p>Đang tải dữ liệu phòng...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Lỗi: {error}</p>
            <button onClick={fetchRooms}>Thử lại</button>
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="no-data-container">
            <p>Không có dữ liệu loại phòng</p>
          </div>
        ) : (
          roomTypes.map((roomType) => {
            const roomsOfType = filteredRooms.filter(room => room.roomType === roomType.TenLoaiPhong);
            if (roomsOfType.length === 0) return null;
            
            return (
              <div key={roomType.MaLoaiPhong}>
                <div className="r-room-header">
                  <span>{roomType.TenLoaiPhong}</span>
                </div>
                <div className="r-room-list">
                  {roomsOfType.map((room) => (
                    <RoomCard
                      key={room.number}
                      roomNumber={room.number}
                      status={room.status}
                      date={room.date}
                      roomType={room.roomType}
                      condition={room.condition}
                      guestName={room.guestName}
                      onClick={() => handleRoomClick(room)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedRoom && (
        <div className="r-modal-overlay">
          <div className="r-modal-content">
            <h2>{selectedRoom.number}</h2>
            <div className="r-modal-header">
              <span className="r-user-icon">
                <img src="/icon_LTW/ĐP_Chitietphieuthue.png" alt="User Icon" />
                {selectedRoom.guestName || 'N/A'}
              </span>
              <span className="r-calendar-icon">
                <img src="/icon_LTW/Lich.png" alt="Calendar Icon" />
                {formatDateTime(selectedRoom.checkInDate)}
              </span>
              <span className="r-calendarday-icon">
                <img src="/icon_LTW/PixelCalenderSolid.png" alt="Days Icon" />
                {selectedRoom.date || 'N/A'}
              </span>
              <span className="r-people-icon">
                <img src="/icon_LTW/MdiAccountMultiplePlus.png" alt="People Icon" />
                {selectedRoom.numberOfGuests || 'N/A'}
              </span>
            </div>
            <div className="r-modal-body">
              <div className="r-service-section">
                <div className="r-service-table">
                  <div className="r-service-header">
                    <span>Dịch vụ</span>
                    <span>SL</span>
                    <span>Thành tiền</span>
                  </div>
                  {selectedServices.length > 0 ? (
                    selectedServices.map((service, index) => (
                      <div className="r-service-row" key={index}>
                        <span>{service.name}</span>
                        <span>{service.quantity}</span>
                        <span>{(service.price * service.quantity).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    ))
                  ) : (
                    <div className="r-service-row">
                      <span>Chưa có dịch vụ</span>
                      <span>-</span>
                      <span>-</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="r-status-section">
                <div className="r-filter-section">
                  <h3>Tình trạng phòng</h3>
                  <input type="text" value={selectedRoom.status} disabled />
                </div>
                <div className="r-filter-section">
                  <h3>Tình trạng dọn dẹp</h3>
                  <select name="cleaningStatus" value={cleaningStatus} onChange={(e) => setCleaningStatus(e.target.value)}>
                    <option value="Đã dọn dẹp">Đã dọn dẹp</option>
                    <option value="Chưa dọn dẹp">Chưa dọn dẹp</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="nuttatdong">
              <button className="r-action-button" onClick={handleSave}>Lưu</button>
              {selectedRoom.status === 'Phòng đang thuê' && (
                <>
                  <button className="r-action-button" onClick={handleAddService}>Thêm dịch vụ</button>
                  <button className="r-action-button" onClick={handlePayment}>Thanh toán</button>
                </>
              )}
              {selectedRoom.status === 'Phòng đã đặt' && (
                <button className="r-action-button r-checkin-button" onClick={handleCheckIn}>Nhận phòng</button>
              )}
              <button className="r-action-closebutton" onClick={closeForm}>Thoát</button>
            </div>
          </div>
        </div>
      )}

      {showAddServiceForm && selectedRoom && (
        <div className="r-modal-overlay">
          <div className="r-modal-content r-add-service-modal">
            <h2>Thêm dịch vụ</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="r-service-catalog">
                <h3>Danh sách dịch vụ</h3>
                <div className="r-service-catalog-filter">
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                  >
                    <option value="Tất cả">Tất cả</option>
                    <option value="Đồ ăn">Đồ ăn</option>
                    <option value="Nước uống">Nước uống</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Tìm dịch vụ"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                  />
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Loại dịch vụ</th>
                      <th>Dịch vụ</th>
                      <th>Giá</th>
                      <th>Thêm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service, index) => (
                      <tr key={index}>
                        <td>{service.category}</td>
                        <td>{service.name}</td>
                        <td>{service.price.toLocaleString('vi-VN')} VNĐ</td>
                        <td>
                          <button className="r-actionn-button r-add-button">
                            <img onClick={() => handleAddSelectedService(service)} src="/icon_LTW/MdiPlusCircle.png" alt="Add Icon" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="r-service-selection">
                <h3>Dịch vụ đã chọn</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Dịch vụ</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                      <th>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServices.length > 0 ? (
                      selectedServices.map((service, index) => (
                        <tr key={index}>
                          <td>{service.name}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={service.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                            />
                          </td>
                          <td>{(service.price * service.quantity).toLocaleString('vi-VN')} VNĐ</td>
                          <td>
                            <button className="r-actionn-button">
                              <img onClick={() => handleRemoveService(index)} src="/icon_LTW/MdiMinusCircle.png" alt="Remove Icon" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">Chưa chọn dịch vụ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="r-save-exit-container">
              <button className="r-action-button r-save-exit-button" onClick={handleCloseAddServiceForm}>Lưu</button>
              <button
                className="r-action-button r-save-exit-button"
                style={{ backgroundColor: '#6c757d' }}
                onClick={() => {
                  setShowAddServiceForm(false);
                  setSelectedServices([]);
                  setServiceCategory('Tất cả');
                  setSearchService('');
                }}
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseSaveSuccess}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close Icon" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{successMessage}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleCloseSaveSuccess}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoice && (
        <div className="details-modal">
          <div className="details-modal-content">
            <div className="button_red">
              <p>Hóa Đơn</p>
              <img onClick={handleCloseInvoiceModal} src="/icon_LTW/thoat2.png" alt="Close Icon" />
            </div>
            <div className="invoice-header">
              <div className="invoice-logo">
                <img src="/icon_LTW/LogoDeBugTeam2.jpg" alt="Logo" />
              </div>
              <div className="invoice-title">HÓA ĐƠN</div>
              <div className="invoice-print">
                <img src="/icon_LTW/HĐ_Print.png" alt="Print Icon" />
              </div>
            </div>
            <span className="info-name">{invoice.customerName}</span>
            <div className="invoice-info">
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Ngày lập hóa đơn:</span>
                  <span className="info-value">{invoice.date}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số phòng:</span>
                  <span className="info-value">{invoice.customerRoom}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Số hóa đơn:</span>
                  <span className="info-value">{invoice.bookingId}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số người:</span>
                  <span className="info-value">{invoice.customerPeople}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Nhân viên lập:</span>
                  <span className="info-value">{invoice.employeeName}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số ngày:</span>
                  <span className="info-value">{invoice.customerDays}</span>
                </div>
              </div>
            </div>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Dịch vụ</th>
                  <th>Giá tiền</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoice.services.map((service, index) => (
                  <tr key={index}>
                    <td>{service.name}</td>
                    <td>{service.price.toLocaleString('vi-VN')} VNĐ</td>
                    <td>{service.quantity}</td>
                    <td>{service.total.toLocaleString('vi-VN')} VNĐ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-total">
              <span className="total-label">Tổng tiền:</span>
              <span className="total-value">{invoice.grandTotal}</span>
            </div>
            <div className="invoice-footer">
              <div className="footer-text">Cảm ơn quý khách!💙</div>
              <div className="footer-contact">debugteam@gmail.com - +84 123 456 789</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;