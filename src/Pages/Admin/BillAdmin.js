import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../Design_Css/Admin/BillAdmin.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const InvoiceList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'https://localhost:7087/api';

  // Hàm tính số ngày từ check-in/check-out
  const calculateRoomDays = (checkInDate, checkOutDate) => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      checkIn.setMinutes(0, 0, 0);
      checkOut.setMinutes(0, 0, 0);
      const diffTime = Math.abs(checkOut - checkIn);
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

      if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24);
        return `${days} ngày`;
      }
      return `${diffHours} giờ`;
    }
    return '1 ngày';
  };

  // Hàm lấy dữ liệu hóa đơn, thanh toán và dịch vụ
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API để lấy danh sách hóa đơn
      const invoiceResponse = await axios.get(`${API_BASE_URL}/invoices`, {
        params: { pageNumber: 1, pageSize: 100, sortBy: 'MaHoaDon', sortOrder: 'DESC' }
      });

      if (!invoiceResponse.data.success) {
        throw new Error(invoiceResponse.data.message || 'Lỗi khi lấy danh sách hóa đơn');
      }

      const invoiceData = invoiceResponse.data.data;
      if (!Array.isArray(invoiceData)) {
        throw new Error('Dữ liệu hóa đơn không đúng định dạng');
      }

      // Gọi API để lấy danh sách thanh toán
      const paymentResponse = await axios.get(`${API_BASE_URL}/payments`, {
        params: { pageNumber: 1, pageSize: 100, sortBy: 'MaThanhToan', sortOrder: 'DESC' }
      });

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Lỗi khi lấy danh sách thanh toán');
      }

      const paymentData = paymentResponse.data.data;

      // Map dữ liệu hóa đơn
      const mappedInvoices = await Promise.all(invoiceData.map(async (invoice) => {
        // Tìm thanh toán tương ứng với mã hóa đơn
        const payment = paymentData.find(p => p.maHoaDon === invoice.maHoaDon);
        const paymentDate = payment 
          ? new Date(payment.ngayThanhToan).toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            }) 
          : 'Chưa thanh toán';

        // Lấy thông tin booking để tính số ngày và số người
        let customerDays = '1 ngày';
        let customerPeople = 1;
        try {
          const bookingResponse = await axios.get(`${API_BASE_URL}/bookings/${invoice.maDatPhong}`);
          if (bookingResponse.data.success) {
            const booking = bookingResponse.data.data;
            customerDays = calculateRoomDays(booking.gioCheckIn, booking.gioCheckOut);
            customerPeople = booking.soKhach || 1;
          }
        } catch (bookingError) {
          console.error(`Lỗi khi lấy thông tin booking ${invoice.maDatPhong}:`, bookingError);
        }

        // Lấy danh sách dịch vụ từ BookingService đã thanh toán
        let services = [
          {
            name: 'Thuê phòng',
            price: invoice.tongTienPhong.toLocaleString('vi-VN'),
            quantity: 1,
            total: invoice.tongTienPhong.toLocaleString('vi-VN')
          }
        ];
        try {
          const servicesResponse = await axios.get(`${API_BASE_URL}/bookingservice`, {
            params: { searchTerm: invoice.maDatPhong }
          });
          if (servicesResponse.data.success && servicesResponse.data.data) {
            // Tính tổng tiền dịch vụ từ BookingService
            const serviceTotal = servicesResponse.data.data.reduce((sum, service) => sum + service.thanhTien, 0);
            // Kiểm tra tổng tiền dịch vụ có khớp với TongTienDichVu từ Invoice
            if (serviceTotal === invoice.tongTienDichVu) {
              const additionalServices = servicesResponse.data.data.map(service => ({
                name: service.tenDichVu,
                price: service.gia.toLocaleString('vi-VN'),
                quantity: service.soLuong,
                total: service.thanhTien.toLocaleString('vi-VN')
              }));
              services = [...services, ...additionalServices];
            } else {
              console.warn(`Tổng tiền dịch vụ (${serviceTotal}) không khớp với TongTienDichVu (${invoice.tongTienDichVu}) cho hóa đơn ${invoice.maHoaDon}`);
            }
          }
        } catch (serviceError) {
          console.error(`Lỗi khi lấy dịch vụ cho hóa đơn ${invoice.maHoaDon}:`, serviceError);
        }

        return {
          id: invoice.maHoaDon,
          date: paymentDate,
          employeeName: 'Chu Ngọc Sơn',
          total: invoice.tongThanhTien.toLocaleString('vi-VN') + ' VND',
          bookingId: invoice.maDatPhong,
          customerName: invoice.hoTenKhachHang || 'Khách hàng',
          customerRoom: invoice.soPhong || 'Không xác định',
          customerDays,
          customerPeople,
          services,
          grandTotal: invoice.tongThanhTien.toLocaleString('vi-VN') + ' VND'
        };
      }));

      setInvoices(mappedInvoices);
      setError(null);
    } catch (err) {
      setError(`Lỗi khi lấy dữ liệu: ${err.message}`);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-');
      setSelectedDate(`${day}/${month}/${year}`);
    } else {
      setSelectedDate('');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = invoice.date.split(' ')[0];
    const invoiceIdStr = invoice.id.toString();
    return (
      (!selectedDate || invoiceDate === selectedDate) &&
      (!searchTerm || invoiceIdStr.includes(searchTerm))
    );
  });

  const handleDetails = (id) => {
    const invoice = invoices.find((inv) => inv.id === id);
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
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

  const handleMoreOptions = () => {
    console.log('Mở tùy chọn bổ sung');
  };

  if (loading) {
    return (
      <div className="invoice-list-container">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
        <div className="loading-container"><p>Đang tải dữ liệu hóa đơn...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-list-container">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
        <div className="error-container">
          <p>Lỗi: {error}</p>
          <button onClick={fetchInvoices}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-list-container">
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
          <div className="top-title">Hóa Đơn</div>
        </div>
        <div className="more-icon" onClick={handleMoreOptions}>⋮</div>
      </div>

      <div className="content-wrapperr">
        <div className="search-barr-container">
          <div className="date-picker">
            <span className="calendar-icon"><img src="/icon_LTW/Lich.png" alt="Lịch" /></span>
            <input
              type="date"
              onChange={handleDateChange}
              placeholder="Chọn ngày"
            />
          </div>
          <div className="search-bar">
            <span className="search-icon"><img src="/icon_LTW/TimKiem.png" alt="Tìm kiếm" /></span>
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Ngày lập</th>
                <th>Tên nhân viên lập</th>
                <th>Tổng tiền</th>
                <th>Mã chi tiết phiếu thuê</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.employeeName}</td>
                  <td>{invoice.total}</td>
                  <td>{invoice.bookingId}</td>
                  <td>
                    <button
                      className="details-button"
                      onClick={() => handleDetails(invoice.id)}
                    >
                      <img src="/icon_LTW/ChiTiet.png" alt="Chi tiết" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && selectedInvoice && (
        <div className="details-modal">
          <div className="details-modal-content">
            <div className="button_red">
              <p>Hóa Đơn</p>
              <img onClick={handleCloseDetails} src="/icon_LTW/thoat2.png" alt="Thoát" />
            </div>
            <div className="invoice-header">
              <div className="invoice-logo"><img src="/icon_LTW/LogoDeBugTeam2.jpg" alt="Logo" /></div>
              <div className="invoice-title">HÓA ĐƠN</div>
              <div className="invoice-print"><img src="/icon_LTW/HĐ_Print.png" alt="In" /></div>
            </div>
            <span className="info-name">{selectedInvoice.customerName}</span>
            <div className="invoice-info">
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Ngày lập hóa đơn:</span>
                  <span className="info-value">{selectedInvoice.date}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số phòng:</span>
                  <span className="info-value">{selectedInvoice.customerRoom}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Số hóa đơn:</span>
                  <span className="info-value">{selectedInvoice.id}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số người:</span>
                  <span className="info-value">{selectedInvoice.customerPeople}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Nhân viên lập:</span>
                  <span className="info-value">{selectedInvoice.employeeName}</span>
                </div>
                <div className="info-rod">
                  <span className="info-label">Số ngày:</span>
                  <span className="info-value">{selectedInvoice.customerDays}</span>
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
                {selectedInvoice.services.map((service, index) => (
                  <tr key={index}>
                    <td>{service.name}</td>
                    <td>{service.price} VND</td>
                    <td>{service.quantity}</td>
                    <td>{service.total} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-total">
              <span className="total-label">Tổng tiền:</span>
              <span className="total-value">{selectedInvoice.grandTotal}</span>
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

export default InvoiceList;