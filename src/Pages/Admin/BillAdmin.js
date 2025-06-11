import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
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

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  // Hàm format thời gian chính xác cho múi giờ Việt Nam
  const formatVietnameseDateTime = (dateString) => {
    if (!dateString) return 'Chưa có thời gian';
    
    try {
      // DEBUG: Log thời gian gốc từ backend
      console.log('🕐 Thời gian gốc từ backend:', dateString);
      
      // Tạo đối tượng Date từ chuỗi thời gian
      const date = new Date(dateString);
      
      // DEBUG: Log đối tượng Date sau khi tạo
      console.log('📅 Date object:', date);
      console.log('⏰ UTC time:', date.toUTCString());
      console.log('🌍 Local time:', date.toString());
      
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        console.error('❌ Thời gian không hợp lệ:', dateString);
        return 'Thời gian không hợp lệ';
      }

      // Chuyển đổi sang múi giờ Việt Nam và format
      const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);

      // DEBUG: Log kết quả format
      console.log('🇻🇳 Thời gian sau khi format (VN):', vietnamTime);
      console.log('---');

      return vietnamTime;
    } catch (error) {
      console.error('❌ Lỗi khi format thời gian:', error);
      return 'Lỗi hiển thị thời gian';
    }
  };

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

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const paginatedInvoices = invoices;

  // Hàm lấy dữ liệu hóa đơn, thanh toán và dịch vụ
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceResponse, paymentResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/invoices`, { 
          params: { 
            pageNumber: currentPage, 
            pageSize, 
            sortBy: 'MaHoaDon', 
            sortOrder: 'DESC' 
          } 
        }),
        axios.get(`${API_BASE_URL}/payments`, { 
          params: { 
            pageNumber: currentPage, 
            pageSize, 
            sortBy: 'MaThanhToan', 
            sortOrder: 'DESC' 
          } 
        })
      ]);

      if (!invoiceResponse.data.success) {
        throw new Error(invoiceResponse.data.message || 'Lỗi khi lấy danh sách hóa đơn');
      }
      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Lỗi khi lấy danh sách thanh toán');
      }

      const invoiceData = invoiceResponse.data.data;
      const paymentData = paymentResponse.data.data;

      // Lấy tổng số trang từ backend
      if (typeof invoiceResponse.data.totalPages === 'number' && invoiceResponse.data.totalPages > 0) {
        setTotalPages(invoiceResponse.data.totalPages);
      } else if (typeof invoiceResponse.data.totalCount === 'number') {
        setTotalPages(Math.ceil(invoiceResponse.data.totalCount / pageSize));
      } else {
        setTotalPages(1);
      }

      if (!Array.isArray(invoiceData)) {
        throw new Error('Dữ liệu hóa đơn không đúng định dạng');
      }

      const mappedInvoices = await Promise.all(invoiceData.map(async (invoice) => {
        const payment = paymentData.find(p => p.maHoaDon === invoice.maHoaDon);
        
        // DEBUG: Log thông tin payment để kiểm tra
        console.log('💳 Payment data cho hóa đơn', invoice.maHoaDon, ':', payment);
        if (payment && payment.ngayThanhToan) {
          console.log('📅 Ngày thanh toán gốc:', payment.ngayThanhToan);
          console.log('🔍 Kiểu dữ liệu:', typeof payment.ngayThanhToan);
        }
        
        // Sử dụng hàm format mới để hiển thị thời gian thanh toán
        const invoicePaymentDate = payment && payment.ngayThanhToan
          ? formatVietnameseDateTime(payment.ngayThanhToan)
          : 'Chưa có ngày thanh toán';

        console.log('✅ Kết quả hiển thị cuối cùng:', invoicePaymentDate);
        console.log('==========================================');

        const paymentStatus = payment ? 'Đã thanh toán' : 'Chưa thanh toán';
        let customerDays = '1 ngày';
        
        try {
          const bookingResponse = await axios.get(`${API_BASE_URL}/bookings/${invoice.maDatPhong}`);
          if (bookingResponse.data.success) {
            const booking = bookingResponse.data.data;
            customerDays = calculateRoomDays(booking.gioCheckIn, booking.gioCheckOut);
          }
        } catch (bookingError) {
          console.error(`Lỗi khi lấy thông tin booking ${invoice.maDatPhong}:`, bookingError);
        }

        let services = [
          {
            name: 'Thuê phòng',
            price: invoice.tongTienPhong.toLocaleString('vi-VN'),
            quantity: 1,
            total: invoice.tongTienPhong.toLocaleString('vi-VN')
          }
        ];
        
        // Thêm các dịch vụ bổ sung
        try {
          const servicesResponse = await axios.get(`${API_BASE_URL}/bookingservice`, { 
            params: { searchTerm: invoice.maDatPhong } 
          });
          if (servicesResponse.data.success && servicesResponse.data.data) {
            const serviceTotal = servicesResponse.data.data.reduce((sum, service) => sum + service.thanhTien, 0);
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

        // Thêm giảm giá điểm nếu có
        let finalTotal = invoice.tongThanhTien;
        if (payment && payment.soDiemSuDung > 0 && payment.soTienGiam > 0) {
          services.push({
            name: 'Sử dụng điểm',
            price: -payment.soTienGiam,
            quantity: 1,
            total: -payment.soTienGiam
          });
          finalTotal = invoice.tongThanhTien - payment.soTienGiam;
        }

        // Format thời gian tạo hóa đơn
        const invoiceCreationDate = invoice.ngayTaoHoaDon
          ? (() => {
              console.log('📝 Ngày tạo hóa đơn gốc:', invoice.ngayTaoHoaDon);
              const result = formatVietnameseDateTime(invoice.ngayTaoHoaDon);
              console.log('📝 Ngày tạo hóa đơn sau format:', result);
              return result;
            })()
          : 'Chưa có ngày lập';

        return {
          id: invoice.maHoaDon,
          paymentDate: invoicePaymentDate,
          invoiceCreationDate,
          rawDate: payment && payment.ngayThanhToan ? new Date(payment.ngayThanhToan) : new Date(invoice.ngayTaoHoaDon),
          status: paymentStatus,
          total: finalTotal.toLocaleString('vi-VN') + ' VND',
          bookingId: invoice.maDatPhong,
          customerName: invoice.hoTenKhachHang || 'Khách hàng',
          customerRoom: invoice.soPhong || 'Không xác định',
          customerDays,
          services,
          grandTotal: finalTotal.toLocaleString('vi-VN') + ' VND'
        };
      }));

      setInvoices(mappedInvoices);
    } catch (err) {
      setError(`Lỗi khi lấy dữ liệu: ${err.message}`);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, currentPage]);

  // Debounce search
  const debouncedFetch = useMemo(() => debounce(fetchInvoices, 500), [fetchInvoices]);
  
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

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-');
      setSelectedDate(`${day}/${month}/${year}`);
    } else {
      setSelectedDate('');
    }
  };

  // Reset về trang 1 khi search hoặc filter
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, selectedDate]);

  // Gọi fetchInvoices khi có thay đổi
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, currentPage, searchTerm, selectedDate]);

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

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="invoice-list-container">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
        <div className="loading-container">
          <p>Đang tải dữ liệu hóa đơn...</p>
        </div>
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
        <div className="header-actions">
          <div className="more-icon" onClick={handleMoreOptions}>⋮</div>
        </div>
      </div>

      <div className="content-wrapperr">
        <div className="search-barr-container">
          <div className="search-bar">
            <span className="search-icon">
              <img src="/icon_LTW/TimKiem.png" alt="Tìm kiếm" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="date-picker">
            <span className="calendar-icon">
              <img src="/icon_LTW/Lich.png" alt="Lịch" />
            </span>
            <input
              type="date"
              onChange={handleDateChange}
              placeholder="Chọn ngày"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Tình Trạng</th>
                <th>Tổng tiền</th>
                <th>Mã chi tiết phiếu thuê</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>
                    <div className="payment-status-cell">
                      <div className={`payment-status ${invoice.status === 'Đã thanh toán' ? 'paid' : 'unpaid'}`}>
                        {invoice.status}
                      </div>
                    </div>
                  </td>
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

        {/* Phân trang */}
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Trang trước
          </button>
          <span className="pagination-info">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Trang sau
          </button>
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
              <div className="invoice-logo">
                <img src="/icon_LTW/LogoDeBugTeam2.jpg" alt="Logo" />
              </div>
              <div className="invoice-title">HÓA ĐƠN</div>
              <div className="invoice-print">
                <img src="/icon_LTW/HĐ_Print.png" alt="In" />
              </div>
            </div>
            <span className="info-name">{selectedInvoice.customerName}</span>            
            <div className="invoice-info">              
              <div className="info-row">
                <div className="info-rod">
                  <span className="info-label">Ngày lập hóa đơn:</span>
                  <span className="info-value">{selectedInvoice.invoiceCreationDate}</span>
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
                    <td style={service.name === 'Sử dụng điểm' ? { color: 'red' } : {}}>
                      {typeof service.price === 'number' && service.price < 0 
                        ? `-${Math.abs(service.price).toLocaleString('vi-VN')} VND` 
                        : `${service.price} VND`}
                    </td>
                    <td>{service.quantity}</td>
                    <td style={service.name === 'Sử dụng điểm' ? { color: 'red' } : {}}>
                      {typeof service.total === 'number' && service.total < 0 
                        ? `-${Math.abs(service.total).toLocaleString('vi-VN')} VND` 
                        : `${service.total} VND`}
                    </td>
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