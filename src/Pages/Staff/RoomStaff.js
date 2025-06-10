import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RoomCard from '../../Components/Staff/Components_Js/RoomCard';
import '../../Design_Css/Staff/RoomStaff.css';
import Sidebar from '../../Components/Staff/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Staff/Components_Js/LogoutModal';

const Room = () => {
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterCondition, setFilterCondition] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [cleaningStatus, setCleaningStatus] = useState('Đã dọn dẹp');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceCategory, setServiceCategory] = useState('Tất cả');
  const [searchService, setSearchService] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [invoice, setInvoice] = useState(null); const [dataInitialized, setDataInitialized] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [showPointForm, setShowPointForm] = useState(false);
  const [customerPoint, setCustomerPoint] = useState(0);
  const [usePoint, setUsePoint] = useState(0);
  const [pointCustomerName, setPointCustomerName] = useState('');
  const [pointError, setPointError] = useState('');
  const [finalPoint, setFinalPoint] = useState(0);

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;  // Helper function để tạo timestamp cho múi giờ Việt Nam
  const getVietnamTimestamp = () => {
    const now = new Date();
    // Tạo timestamp với offset UTC+7 cho múi giờ Việt Nam
    const vietnamOffset = 7 * 60; // 7 giờ = 420 phút
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // Chuyển về UTC
    const vietnamTime = new Date(utc + (vietnamOffset * 60000)); // Cộng thêm 7 giờ

    // Format theo ISO string với múi giờ +07:00
    const year = vietnamTime.getFullYear();
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
  };

  // Helper functions để quản lý trạng thái hóa đơn đã tạo
  const getInvoiceCreatedKey = (maDatPhong) => `invoice_created_${maDatPhong}`;

  const setInvoiceCreatedForBooking = (maDatPhong, invoiceId) => {
    const key = getInvoiceCreatedKey(maDatPhong);
    localStorage.setItem(key, JSON.stringify({ invoiceId, timestamp: Date.now() }));
  };

  const getInvoiceCreatedForBooking = (maDatPhong) => {
    const key = getInvoiceCreatedKey(maDatPhong);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  };

  const clearInvoiceCreatedForBooking = (maDatPhong) => {
    const key = getInvoiceCreatedKey(maDatPhong);
    localStorage.removeItem(key);
  };
  // Kiểm tra xem booking đã có hóa đơn chưa bằng cách gọi API
  const checkIfInvoiceExists = async (maDatPhong) => {
    try {
      console.log(`Checking if invoice exists for booking: ${maDatPhong}`);

      // Thử gọi API với nhiều cách khác nhau để tìm hóa đơn
      // Cách 1: Lấy tất cả hóa đơn và filter theo maDatPhong
      const response = await axios.get(`${API_BASE_URL}/invoices`, {
        params: {
          pageNumber: 1,
          pageSize: 100,  // Tăng pageSize để lấy nhiều hóa đơn hơn
          sortBy: 'MaHoaDon',
          sortOrder: 'DESC'
        }
      });

      console.log('API response for invoices:', response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        const existingInvoice = response.data.data.find(invoice =>
          String(invoice.maDatPhong) === String(maDatPhong)
        );

        console.log(`Found invoice for booking ${maDatPhong}:`, existingInvoice);
        return existingInvoice || null;
      }

      console.log(`No invoice found for booking ${maDatPhong}`);
      return null;
    } catch (error) {
      console.error('Lỗi khi kiểm tra hóa đơn:', error);
      return null;
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: { pageNumber: 1, pageSize: 100, sortBy: 'MaDatPhong', sortOrder: 'DESC' }
      });
      if (response.data.success) {
        const bookingData = response.data.data;
        if (!Array.isArray(bookingData)) {
          console.error('Dữ liệu bookings không phải là mảng:', bookingData);
          setError('Dữ liệu đặt phòng không đúng định dạng.');
          return;
        }
        bookingData.forEach(booking => {
          if (!booking.maPhong || !booking.maDatPhong) console.warn('Booking thiếu dữ liệu cần thiết:', booking);
        });
        console.log('Bookings fetched:', bookingData);
        setBookings(bookingData);

        const customerIds = bookingData.map(booking => booking.maKhachHang).filter(customerId => customerId);
        console.log('Customer IDs to fetch:', customerIds);

        if (customerIds.length > 0) {
          const customerPromises = customerIds.map(async (customerId) => {
            try {
              console.log(`Fetching customer data for ID: ${customerId}`);
              const customerResponse = await axios.get(`${API_BASE_URL}/customers/${customerId}`);
              if (customerResponse.data.success) {
                console.log(`Customer ${customerId}:`, customerResponse.data.data.hoTenKhachHang);
                return { [customerId]: customerResponse.data.data.hoTenKhachHang };
              }
              console.warn(`Customer ${customerId} not found or failed`);
              return { [customerId]: `Khách hàng ${customerId}` };
            } catch (error) {
              console.error(`Lỗi khi lấy thông tin khách hàng ${customerId}:`, error);
              return { [customerId]: `Khách hàng ${customerId}` };
            }
          });

          const customersData = await Promise.all(customerPromises);
          const newCustomersMap = Object.assign({}, ...customersData);
          console.log('New customers data loaded:', newCustomersMap);
          setCustomers(newCustomersMap);
          console.log('Customer data loading completed');
        } else {
          setCustomers({});
          console.log('No bookings found, customers set to empty object');
        }

        setDataInitialized(true);
      } else {
        setError('Lỗi khi lấy danh sách đặt phòng từ API: ' + (response.data.message || 'Không xác định'));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách booking:', error);
      setError('Lỗi khi lấy danh sách đặt phòng: ' + error.message);
    }
  }, []);

  const consolidateServices = (services) => {
    if (!Array.isArray(services)) return [];

    const serviceMap = new Map();

    services.forEach(service => {
      const key = String(service.maDichVu);
      serviceMap.set(key, {
        ...service,
        quantity: service.quantity || 1
      });
      console.log(`Service ${service.name} (ID: ${service.maDichVu}) updated with quantity: ${service.quantity || 1}`);
    });

    const result = Array.from(serviceMap.values());
    console.log('Consolidated services (latest values only):', result);
    return result;
  };
  const fetchServicesForBooking = useCallback(async (maDatPhong) => {
    try {
      console.log(`Fetching services for booking ${maDatPhong}`);

      const servicesResponse = await axios.get(`${API_BASE_URL}/bookingservice`, {
        params: {
          maDatPhong: maDatPhong,
          pageNumber: 1,
          pageSize: 100  // Tăng pageSize để lấy hết tất cả services
        }
      });

      if (servicesResponse.data.success && Array.isArray(servicesResponse.data.data)) {
        const services = servicesResponse.data.data
          .filter(bs => bs.maDatPhong === maDatPhong)
          .map(service => ({
            name: service.tenDichVu || `Dịch vụ ${service.maDichVu}`,
            maDichVu: service.maDichVu,
            gia: service.gia || 0,
            quantity: service.soLuong || 1,
            category: service.category || 'Khác',
            maBSD: service.maBSD // Lưu thêm maBSD để hỗ trợ update
          }));

        console.log(`Raw services from API (${services.length} items):`, services);

        const consolidatedServices = consolidateServices(services);
        console.log(`Consolidated services (${consolidatedServices.length} items):`, consolidatedServices);

        return consolidatedServices;
      }

      console.log('Trying fallback API for services...');
      const fallbackResponse = await axios.get(`${API_BASE_URL}/bookingservice/${maDatPhong}`);
      if (fallbackResponse.data.success) {
        const fallbackServices = fallbackResponse.data.data.map(service => ({
          name: service.tenDichVu,
          maDichVu: service.maDichVu,
          gia: service.gia,
          quantity: service.soLuong,
          category: service.category || 'Khác',
          maBSD: service.maBSD // Lưu thêm maBSD nếu có
        }));

        return consolidateServices(fallbackServices);
      }

      return [];
    } catch (error) {
      console.error(`Lỗi khi lấy services cho booking ${maDatPhong}:`, error);
      return [];
    }
  }, []);
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/rooms`, {
        params: {
          searchTerm: '',
          sortBy: 'MaPhong',
          sortOrder: 'ASC',
          pageNumber: 1,
          pageSize: 100  // Tăng pageSize từ mặc định 10 lên 100 để lấy tất cả phòng
        },
      });
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          const mappedRooms = await Promise.all(response.data.data.map(async (room) => {
            const getRoomTypeNameLocal = (loaiPhong) => {
              const roomType = roomTypes.find((type) => String(type.MaLoaiPhong) === String(loaiPhong));
              return roomType ? roomType.TenLoaiPhong : 'Không xác định';
            };
            if (!room.maPhong || !room.trangThai) {
              console.warn('Room thiếu dữ liệu cần thiết:', room);
              return null;
            }
            const roomMaPhong = String(room.maPhong);
            let activeBooking = null;
            let roomServices = [];
            if (room.trangThai !== 'Trống') {
              // Lấy booking mới nhất dựa trên maDatPhong hoặc gioCheckIn
              activeBooking = bookings
                .filter(booking => String(booking.maPhong) === roomMaPhong && booking.trangThai !== 'Completed')
                .sort((a, b) => new Date(b.gioCheckIn) - new Date(a.gioCheckIn))[0];
            }
            let guestName = '';
            if (activeBooking) {
              guestName = customers[activeBooking.maKhachHang] || `Khách ${activeBooking.maKhachHang}`;
              console.log(`Room ${room.soPhong}: Customer ID ${activeBooking.maKhachHang}, Guest Name: ${guestName}, MaDatPhong: ${activeBooking.maDatPhong}`);
              console.log('Current customers state:', customers);
              if (!customers[activeBooking.maKhachHang]) {
                console.warn(`Customer ${activeBooking.maKhachHang} not found in customers state`);
              }
              if (mapStatusFromAPI(room.trangThai) === 'Phòng đang thuê') {
                roomServices = await fetchServicesForBooking(activeBooking.maDatPhong);
              }
            }

            const bookingInfo = activeBooking ? {
              guestName: guestName,
              checkInDate: activeBooking.gioCheckIn,
              checkOutDate: activeBooking.gioCheckOut,
              numberOfGuests: activeBooking.soKhach || 1,
              maDatPhong: activeBooking.maDatPhong,
              tongTien: activeBooking.tongTien || 0
            } : { guestName: '', checkInDate: null, checkOutDate: null, numberOfGuests: 1, maDatPhong: null, tongTien: 0 };

            return {
              number: room.soPhong || '',
              status: mapStatusFromAPI(room.trangThai),
              date: calculateRoomDays(room.trangThai, bookingInfo.checkInDate, bookingInfo.checkOutDate),
              roomType: getRoomTypeNameLocal(room.loaiPhong),
              condition: room.tinhTrang || 'Đã dọn dẹp',
              guestName: bookingInfo.guestName,
              checkInDate: bookingInfo.checkInDate,
              checkOutDate: bookingInfo.checkOutDate,
              numberOfGuests: bookingInfo.numberOfGuests,
              maPhong: room.maPhong,
              maDatPhong: bookingInfo.maDatPhong,
              tongTien: bookingInfo.tongTien,
              apiData: room,
              services: roomServices.length > 0 ? roomServices : []
            };
          }));
          setRooms(mappedRooms.filter(room => room !== null));
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
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [roomTypes, bookings, customers, fetchServicesForBooking]);

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

  const fetchServices = useCallback(async () => {
    try {
      console.log('Fetching services from:', `${API_BASE_URL}/services`);
      const response = await axios.get(`${API_BASE_URL}/services`, {
        params: { pageNumber: 1, pageSize: 100, sortBy: 'maDichVu', sortOrder: 'ASC' }
      });
      console.log('Services response:', response.data);
      if (response.data.success) {
        const serviceData = response.data.data;
        if (Array.isArray(serviceData)) {
          const mappedServices = serviceData.map(service => ({
            category: service.tenLoaiDV || 'Không xác định',
            name: service.tenDichVu || '',
            maDichVu: service.maDichVu,
            gia: service.gia || 0
          }));
          console.log('Mapped services:', mappedServices);
          setServices(mappedServices);
        } else {
          setError('Dữ liệu dịch vụ không đúng định dạng.');
          console.error('Service data is not an array:', serviceData);
        }
      } else {
        setError(response.data.message || 'Lỗi khi lấy danh sách dịch vụ từ API.');
        console.error('API error:', response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dịch vụ:', error);
      setError(`Lỗi khi lấy danh sách dịch vụ: ${error.message}`);
    }
  }, []);

  const mapStatusFromAPI = (apiStatus) => {
    switch (apiStatus) {
      case 'Trống': return 'Phòng trống';
      case 'Đã đặt': return 'Phòng đã đặt';
      case 'Đang thuê': return 'Phòng đang thuê';
      default: return 'Phòng trống';
    }
  };

  const calculateRoomDays = (status, checkInDate, checkOutDate) => {
    if (status === 'Trống' || !checkInDate || !checkOutDate) return '0 ngày';
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} ngày`;
    }
    return `${diffHours} giờ`;
  };

  const calculateStayDuration = (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return '0 ngày';
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} ngày`;
    }
    return `${diffHours} giờ`;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchRoomTypes(), fetchServices()]);
        await fetchBookings();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Lỗi khi khởi tạo dữ liệu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchRoomTypes, fetchServices, fetchBookings]);

  useEffect(() => {
    if (roomTypes.length > 0 && dataInitialized) {
      console.log('All data ready, triggering fetchRooms with customers:', Object.keys(customers).length, 'customers loaded');
      console.log('Customer data:', customers);
      fetchRooms();
    }
  }, [roomTypes, dataInitialized, customers, fetchRooms]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  const handleRoomClick = async (room) => {
    if (['Phòng trống', 'Phòng đang thuê', 'Phòng đã đặt'].includes(room.status)) {
      console.log('Selected room:', room);
      setSelectedRoom(room);
      setCleaningStatus(room.condition || 'Đã dọn dẹp');

      // Kiểm tra trạng thái hóa đơn
      if (room.maDatPhong && room.status === 'Phòng đang thuê') {
        // Kiểm tra từ localStorage trước
        const storedInvoice = getInvoiceCreatedForBooking(room.maDatPhong);
        if (storedInvoice) {
          setInvoiceCreated(true);
          console.log('Found stored invoice for booking:', room.maDatPhong, 'storedData:', storedInvoice);

          // Khôi phục thông tin hóa đơn từ API
          try {
            console.log('Attempting to reconstruct invoice from API for booking:', room.maDatPhong);
            const existingInvoice = await checkIfInvoiceExists(room.maDatPhong);
            console.log('API response for existing invoice:', existingInvoice);

            if (existingInvoice) {
              // Tạo lại object invoice với thông tin cần thiết
              const reconstructedInvoice = {
                id: existingInvoice.maHoaDon,
                date: new Date(existingInvoice.ngayTao).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }),
                total: existingInvoice.tongThanhTien,
                grandTotal: existingInvoice.tongThanhTien.toLocaleString('vi-VN') + ' VND',
                bookingId: room.maDatPhong,
                customerName: room.guestName || 'Khách hàng',
                customerRoom: room.number,
                customerDays: calculateStayDuration(room.checkInDate, room.checkOutDate) || '0 ngày',
                employeeName: 'Chu Ngọc Sơn'
              };
              setInvoice(reconstructedInvoice);
              console.log('Invoice data reconstructed from API:', reconstructedInvoice);
            } else {
              console.log('No existing invoice found in API, but localStorage says there should be one');
            }
          } catch (error) {
            console.error('Error reconstructing invoice data:', error);
          }
        } else {
          // Kiểm tra từ API
          const existingInvoice = await checkIfInvoiceExists(room.maDatPhong);
          if (existingInvoice) {
            setInvoiceCreated(true);
            // Lưu vào localStorage để không phải kiểm tra lại
            setInvoiceCreatedForBooking(room.maDatPhong, existingInvoice.maHoaDon);
            console.log('Found existing invoice via API for booking:', room.maDatPhong);

            // Tạo lại object invoice với thông tin cần thiết
            const reconstructedInvoice = {
              id: existingInvoice.maHoaDon,
              date: new Date(existingInvoice.ngayTao).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              total: existingInvoice.tongThanhTien,
              grandTotal: existingInvoice.tongThanhTien.toLocaleString('vi-VN') + ' VND',
              bookingId: room.maDatPhong,
              customerName: room.guestName || 'Khách hàng',
              customerRoom: room.number,
              customerDays: calculateStayDuration(room.checkInDate, room.checkOutDate) || '0 ngày',
              employeeName: 'Chu Ngọc Sơn'
            };
            setInvoice(reconstructedInvoice);
            console.log('Invoice data reconstructed from API:', reconstructedInvoice);
          } else {
            setInvoiceCreated(false);
          }
        }

        // Load services cho phòng đang thuê
        fetchServicesForBooking(room.maDatPhong).then(services => {
          console.log('Fresh services loaded for room:', services);
          setSelectedServices(services);
          setSelectedRoom(prev => prev ? { ...prev, services: services } : prev);
        });
      } else {
        setSelectedServices([]);
        setInvoiceCreated(false);
      }
    }
  };

  const closeForm = () => {
    setSelectedRoom(null);
    setShowAddServiceForm(false);
    setShowInvoiceModal(false);
  };

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSave = async () => {
    if (selectedRoom) {
      try {
        const roomResponse = await axios.put(`${API_BASE_URL}/rooms/${selectedRoom.maPhong}/status`, {
          TrangThai: mapStatusToAPI(selectedRoom.status),
          TinhTrang: cleaningStatus
        });

        if (!roomResponse.data.success) {
          throw new Error(roomResponse.data.message || 'Lỗi khi cập nhật trạng thái phòng.');
        }

        if (selectedRoom.maDatPhong && selectedRoom.status === 'Phòng đang thuê' && selectedServices.length > 0) {
          const updateServicePromises = selectedServices.map(async (service) => {
            const bookingService = {
              MaBSD: service.maBSD,
              MaDatPhong: selectedRoom.maDatPhong,
              MaDichVu: service.maDichVu,
              SoLuong: service.quantity,
              Gia: service.gia,
              ThanhTien: service.gia * service.quantity,
              NgaySuDung: new Date().toISOString(),
              TenDichVu: service.name
            };

            if (service.maBSD) {
              const response = await axios.put(`${API_BASE_URL}/bookingservice/${service.maBSD}`, bookingService);
              if (!response.data.success) {
                throw new Error(response.data.message || 'Lỗi khi cập nhật dịch vụ');
              }
            } else {
              const response = await axios.post(`${API_BASE_URL}/bookingservice`, bookingService);
              if (!response.data.success) {
                throw new Error(response.data.message || 'Lỗi khi tạo dịch vụ mới');
              }
              service.maBSD = response.data.data;
            }
          });

          await Promise.all(updateServicePromises);
        }

        const updatedRooms = rooms.map(room =>
          room.number === selectedRoom.number ? { ...room, condition: cleaningStatus, services: selectedServices } : room
        );
        setRooms(updatedRooms);
        setSelectedRoom(prev => ({ ...prev, condition: cleaningStatus, services: selectedServices }));
        setSuccessMessage('Lưu trạng thái phòng và dịch vụ thành công!');
        setShowSaveSuccess(true);
      } catch (error) {
        console.error('Lỗi khi lưu:', error);
        setError(`Lỗi khi lưu: ${error.message}`);
      }
    }
  };

  const mapStatusToAPI = (uiStatus) => {
    switch (uiStatus) {
      case 'Phòng trống': return 'Trống';
      case 'Phòng đã đặt': return 'Đã đặt';
      case 'Phòng đang thuê': return 'Đang thuê';
      default: return 'Trống';
    }
  };

  const handleCheckIn = async () => {
    if (selectedRoom) {
      if (!selectedRoom.maDatPhong) {
        setError('Không tìm thấy mã đặt phòng cho phòng này. Đang thử tải lại dữ liệu...');
        console.log('Reloading rooms and bookings to find maDatPhong...');
        await fetchBookings();
        await fetchRooms();
        const updatedRoom = rooms.find(room => room.maPhong === selectedRoom.maPhong);
        if (updatedRoom && updatedRoom.maDatPhong) {
          setSelectedRoom(updatedRoom);
          setError(null);
          console.log('Found maDatPhong after reload:', updatedRoom.maDatPhong);
        } else {
          setError('Vẫn không tìm thấy mã đặt phòng. Vui lòng kiểm tra dữ liệu đặt phòng trong hệ thống.');
          return;
        }
      }

      try {
        console.log(`Nhận phòng cho maDatPhong=${selectedRoom.maDatPhong}`);

        const roomUpdateResponse = await axios.put(`${API_BASE_URL}/rooms/${selectedRoom.maPhong}/status`, {
          TrangThai: 'Đang thuê',
          TinhTrang: selectedRoom.condition || 'Đã dọn dẹp'
        });

        if (roomUpdateResponse.data.success) {
          const roomResponse = await axios.get(`${API_BASE_URL}/rooms/${selectedRoom.maPhong}`);
          if (roomResponse.data.success) {
            const updatedRoomData = roomResponse.data.data;
            const updatedRoom = {
              ...selectedRoom,
              status: mapStatusFromAPI(updatedRoomData.trangThai),
              condition: updatedRoomData.tinhTrang || 'Đã dọn dẹp',
              apiData: updatedRoomData,
              date: calculateRoomDays(updatedRoomData.trangThai, selectedRoom.checkInDate, selectedRoom.checkOutDate)
            };
            const updatedRooms = rooms.map(room =>
              room.number === selectedRoom.number ? updatedRoom : room
            );
            setRooms(updatedRooms);
            setSelectedRoom(updatedRoom);
          }
          setSuccessMessage('Nhận phòng thành công!');
          setShowSaveSuccess(true);
        } else {
          setError(roomUpdateResponse.data.message || 'Lỗi khi cập nhật trạng thái phòng.');
        }
      } catch (error) {
        console.error('Lỗi API:', error);
        setError(`Lỗi khi nhận phòng: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleAddService = () => {
    if (selectedRoom && selectedRoom.status !== 'Phòng đang thuê') {
      setError('Chỉ có thể thêm dịch vụ khi phòng đã được nhận!');
      return;
    }
    console.log('=== Opening Add Service Form ===');
    console.log('Selected room:', selectedRoom);
    console.log('Selected room services:', selectedRoom?.services);

    if (selectedRoom && selectedRoom.services && Array.isArray(selectedRoom.services)) {
      console.log('Initializing service form with existing services:', selectedRoom.services);
      const consolidatedServices = consolidateServices(selectedRoom.services);
      setSelectedServices(consolidatedServices);
      console.log('Consolidated selectedServices (no duplicates):', consolidatedServices);
    } else {
      console.log('No existing services, starting with empty array');
      setSelectedServices([]);
    }

    setShowAddServiceForm(true);
    console.log('=== Add Service Form Opened ===\n');
  };

  // Add utility to fetch point program for a customer
  const fetchCustomerPointProgram = async (customerName, tongDiem) => {
    try {
      // First, get customer info to find their maCT
      const customerRes = await axios.get(`${API_BASE_URL}/customers`, {
        params: { pageNumber: 1, pageSize: 100 }
      });

      let customerMaCT = null;
      if (customerRes.data.success && Array.isArray(customerRes.data.data)) {
        const customer = customerRes.data.data.find(c => c.hoTenKhachHang === customerName);
        if (customer) {
          customerMaCT = customer.maCT;
          console.log(`=== DEBUG: Customer ${customerName} has maCT: ${customerMaCT} ===`);
        }
      }

      // Fetch all point programs
      const response = await axios.get('https://localhost:7087/api/point-programs?pageNumber=1&pageSize=100');
      if (response.data.success && Array.isArray(response.data.data)) {
        const pointPrograms = response.data.data;
        console.log('=== DEBUG: All Point Programs ===');
        pointPrograms.forEach(program => {
          console.log(`Program: ${program.tenCT}, maCT: ${program.maCT}, DiemToiThieu: ${program.diemToiThieu}, MucGiamGia: ${program.mucGiamGia}`);
        });
        console.log(`Customer: ${customerName}, TongDiem: ${tongDiem}, maCT: ${customerMaCT}`);
        // Find the program based on customer's maCT (if available)
        let program = null;
        if (customerMaCT) {
          // Convert both to string for comparison to handle type differences
          program = pointPrograms.find(p => String(p.maCT) === String(customerMaCT));
          console.log(`Found program by maCT ${customerMaCT}:`, program);
        }

        // Fallback: Find the best program based on tongDiem if no maCT match
        if (!program) {
          console.log('No program found by maCT, using tongDiem fallback...');
          program = pointPrograms.find(p => tongDiem >= p.diemToiThieu);
          if (!program) {
            // fallback to the first program if not found
            program = pointPrograms[0];
          }
        }

        console.log(`Selected Program for ${customerName}:`, program);
        return program;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy chương trình điểm khách hàng:', error);
      return null;
    }
  };

  // Lấy số điểm khả dụng của khách hàng qua API /customers/:maKhachHang/points
  const fetchCustomerAvailablePoint = async (maKhachHang) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers/${maKhachHang}/points`);
      if (response.data.success && typeof response.data.data?.diemCoTheSuDung === 'number') {
        return response.data.data.diemCoTheSuDung;
      }
      return 0;
    } catch (error) {
      console.error('Lỗi khi lấy số điểm khả dụng:', error);
      return 0;
    }
  };

  const handleCreateInvoice = async () => {
    setPointCustomerName(selectedRoom?.guestName || '');
    let availablePoint = 0;
    if (selectedRoom?.guestName && selectedRoom?.maDatPhong) {
      // Lấy maKhachHang từ booking
      const booking = bookings.find(b => b.maDatPhong === selectedRoom.maDatPhong);
      if (booking && booking.maKhachHang) {
        availablePoint = await fetchCustomerAvailablePoint(booking.maKhachHang);
      }
    }
    setCustomerPoint(availablePoint);
    setUsePoint(0);
    setFinalPoint(availablePoint);
    setPointError('');
    setShowPointForm(true);
  };
  const handlePointFormConfirm = async () => {
    // Validate points before proceeding
    if (pointError) {
      return; // Don't proceed if there's a validation error
    }

    setShowPointForm(false);
    try {
      const totalRoomCost = selectedRoom.tongTien || 0;
      const totalServiceCost = selectedServices.reduce((sum, service) => sum + service.gia * service.quantity, 0);
      const tongTienGoc = totalRoomCost + totalServiceCost;      // Fetch customer point program for discount calculation
      let mucGiamGia = 0;
      let soTienGiam = 0;
      if (selectedRoom?.guestName) {
        // Get customer info from API to get MaCT and tongDiem
        const customerRes = await axios.get('https://localhost:7087/api/customers', { params: { pageNumber: 1, pageSize: 100 } });
        if (customerRes.data.success && Array.isArray(customerRes.data.data)) {
          const customer = customerRes.data.data.find(c => c.hoTenKhachHang === selectedRoom.guestName);
          console.log('=== DEBUG: Customer Info ===');
          console.log('Guest Name:', selectedRoom.guestName);
          console.log('Found Customer:', customer);

          if (customer) {
            const program = await fetchCustomerPointProgram(customer.hoTenKhachHang, customer.tongDiem);
            console.log('=== DEBUG: Selected Program ===');
            console.log('Program:', program);

            if (program) {
              console.log('Raw mucGiamGia from API:', program.mucGiamGia, typeof program.mucGiamGia);

              // Xử lý mucGiamGia nếu nó có dạng "150%" thì lấy số 150
              let processedMucGiamGia = program.mucGiamGia;
              if (typeof processedMucGiamGia === 'string' && processedMucGiamGia.includes('%')) {
                processedMucGiamGia = processedMucGiamGia.replace('%', '');
              }
              mucGiamGia = parseFloat(processedMucGiamGia);

              console.log('Processed mucGiamGia:', mucGiamGia);
            }
          }
        }
      }
      if (!mucGiamGia || isNaN(mucGiamGia)) mucGiamGia = 0;
      soTienGiam = usePoint * mucGiamGia;

      console.log('=== DEBUG: Final Calculation ===');
      console.log('usePoint:', usePoint);
      console.log('mucGiamGia:', mucGiamGia);
      console.log('soTienGiam:', soTienGiam);
      // Tổng thành tiền gửi lên API phải là tổng gốc (không trừ điểm)
      const invoiceData = {
        MaDatPhong: selectedRoom.maDatPhong,
        MaKhachHang: bookings.find(b => b.maDatPhong === selectedRoom.maDatPhong)?.maKhachHang || 0,
        TongTienPhong: totalRoomCost,
        TongTienDichVu: totalServiceCost,
        TongThanhTien: tongTienGoc,
        TrangThai: 'Pending'
      }; const invoiceResponse = await axios.post(`${API_BASE_URL}/invoices`, invoiceData);
      if (invoiceResponse.data.success) {
        const maHoaDon = invoiceResponse.data.data;
        setInvoiceCreated(true);
        setInvoiceCreatedForBooking(selectedRoom.maDatPhong, maHoaDon);
        // Không tạo payment record ở đây, sẽ tạo khi nhấn nút "Thanh toán"
        const totalAmount = Math.max(0, tongTienGoc - soTienGiam); // Ensure total is never negative

        console.log('=== Invoice Calculation Summary ===');
        console.log('tongTienGoc:', tongTienGoc);
        console.log('soTienGiam:', soTienGiam);
        // Tạo đối tượng invoice với thông tin cần thiết
        const invoiceDataToSet = {
          id: maHoaDon,
          date: (() => {
            const now = new Date();
            const vietnamOffset = 7 * 60;
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const vietnamTime = new Date(utc + (vietnamOffset * 60000));
            return vietnamTime.toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
          })(),
          employeeName: 'Chu Ngọc Sơn',
          total: totalAmount,
          bookingId: selectedRoom.maDatPhong,
          customerName: selectedRoom.guestName || 'Khách hàng',
          customerRoom: selectedRoom.number,
          customerDays: calculateStayDuration(selectedRoom.checkInDate, selectedRoom.checkOutDate),
          services: [
            { name: 'Thuê phòng', price: totalRoomCost, quantity: 1, total: totalRoomCost },
            ...selectedServices.map(service => ({
              name: service.name,
              price: service.gia,
              quantity: service.quantity,
              total: service.gia * service.quantity
            })),
            usePoint > 0 ? {
              name: 'Sử dụng điểm',
              price: -soTienGiam,
              quantity: 1,
              total: -soTienGiam
            } : null
          ].filter(Boolean),
          grandTotal: totalAmount.toLocaleString('vi-VN') + ' VND',
          usePoint: usePoint,
          soTienGiam: soTienGiam
        };
        setInvoice(invoiceDataToSet);
        setShowInvoiceModal(true);
      } else {
        setError(invoiceResponse.data.message || 'Lỗi khi tạo hóa đơn.');
      }
    } catch (error) {
      console.error('Lỗi khi tạo hóa đơn:', error);
      setError(`Lỗi khi tạo hóa đơn: ${error.response?.data?.message || error.message}`);
    }
  };
  const handlePayment = async () => {
    console.log('Starting payment process - invoiceCreated:', invoiceCreated, 'invoice:', invoice, 'selectedRoom:', selectedRoom);

    // Kiểm tra trước nếu nút bị disabled
    if (!invoiceCreated) {
      console.log('Payment blocked: Invoice not created yet');
      setError('Vui lòng tạo hóa đơn trước khi thanh toán!');
      setSuccessMessage('Vui lòng tạo hóa đơn trước khi thanh toán!');
      setShowSaveSuccess(true);
      return;
    }

    if (!selectedRoom || !selectedRoom.maDatPhong || !invoice || !invoice.id) {
      console.log('Payment validation failed:');
      console.log('- selectedRoom:', !!selectedRoom);
      console.log('- selectedRoom.maDatPhong:', selectedRoom?.maDatPhong);
      console.log('- invoiceCreated:', invoiceCreated);
      console.log('- invoice:', !!invoice);
      console.log('- invoice.id:', invoice?.id);

      setError('Thông tin thanh toán không đầy đủ. Vui lòng kiểm tra lại!');
      setSuccessMessage('Thông tin thanh toán không đầy đủ. Vui lòng kiểm tra lại!');
      setShowSaveSuccess(true);
      console.log('Payment failed: Missing required data - selectedRoom:', selectedRoom, 'invoice:', invoice, 'invoiceCreated:', invoiceCreated);
      return;
    } try {
      // Tạo payment record khi nhấn thanh toán
      console.log('Processing payment for invoice:', invoice.id);

      const totalAmount = parseInt(invoice.grandTotal.replace(' VND', '').replace(/,/g, ''), 10);
      if (isNaN(totalAmount)) {
        throw new Error('Không thể parse tổng tiền từ hóa đơn.');
      }
      // LUÔN giữ nguyên thanhTien, không ép về 0 kể cả khi số tiền giảm vượt tổng tiền
      let paymentData = {
        maHoaDon: invoice.id,
        phuongThucThanhToan: 'Tiền mặt',
        soDiemSuDung: invoice.usePoint || 0,
        soTienGiam: invoice.soTienGiam || 0,
        thanhTien: totalAmount, // giữ nguyên, có thể âm
        ngayThanhToan: getVietnamTimestamp()
      };
      let paymentResponse;
      try {
        paymentResponse = await axios.post(`${API_BASE_URL}/payments`, paymentData);
      } catch (err) {
        throw err;
      }

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Lỗi khi tạo thanh toán');
      }

      console.log('Payment record created successfully:', paymentResponse.data);

      // Cập nhật trạng thái booking thành Completed
      try {
        console.log(`Completing booking ${selectedRoom.maDatPhong}...`);
        const completeBookingResponse = await axios.put(`${API_BASE_URL}/bookings/${selectedRoom.maDatPhong}/complete`);
        if (completeBookingResponse.data.success) {
          console.log('Booking completed successfully:', completeBookingResponse.data);
        } else {
          console.warn('Failed to complete booking:', completeBookingResponse.data.message);
        }
      } catch (completeError) {
        console.error('Error completing booking:', completeError);
        // Không throw error ở đây vì payment đã thành công
      }

      const roomUpdateResponse = await axios.put(`${API_BASE_URL}/rooms/${selectedRoom.maPhong}/status`, {
        TrangThai: 'Trống',
        TinhTrang: 'Chưa dọn dẹp'
      });

      if (roomUpdateResponse.data.success) {
        console.log('Room status updated successfully, response:', roomUpdateResponse.data);

        // Làm mới dữ liệu sau khi thanh toán
        await fetchBookings();
        await fetchRooms();

        // Cập nhật selectedRoom trực tiếp với trạng thái mới
        const updatedRoom = {
          ...selectedRoom,
          status: 'Phòng trống',
          condition: 'Chưa dọn dẹp',
          services: [],
          maDatPhong: null,
          guestName: '',
          checkInDate: null,
          checkOutDate: null,
          tongTien: 0,
          date: '0 ngày'
        };

        console.log('=== PAYMENT SUCCESS: Updating selectedRoom status ===');
        console.log('Before update - selectedRoom.status:', selectedRoom.status);
        console.log('After update - updatedRoom.status:', updatedRoom.status);
        setSelectedRoom(updatedRoom);
        console.log('=== selectedRoom updated, should hide buttons ===');

        setSelectedServices([]);
        setInvoiceCreated(false);
        setInvoice(null);
        setShowInvoiceModal(false);

        // Clear localStorage data for this booking
        clearInvoiceCreatedForBooking(selectedRoom.maDatPhong);

        setSuccessMessage('Thanh toán thành công!');
        setShowSaveSuccess(true);

      } else {
        setError(roomUpdateResponse.data.message || 'Lỗi khi cập nhật trạng thái phòng.');
        console.error('Room update failed:', roomUpdateResponse.data);
      }
    } catch (error) {
      console.error('Lỗi khi thanh toán:', error);
      setError(`Lỗi khi thanh toán: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    console.log('Invoice modal closed, invoiceCreated remains:', invoiceCreated);
  };

  const handleCloseSaveSuccess = () => {
    setShowSaveSuccess(false);
    setSuccessMessage('');
    setError(null);
  };

  const handleCloseAddServiceForm = async () => {
    if (selectedRoom && selectedRoom.status === 'Phòng đang thuê' && selectedServices.length > 0 && selectedRoom.maPhong) {
      try {
        let latestMaDatPhong = selectedRoom.maDatPhong;
        if (!latestMaDatPhong) {
          const latestBooking = bookings
            .filter(booking => String(booking.maPhong) === String(selectedRoom.maPhong) && booking.trangThai !== 'Completed')
            .sort((a, b) => new Date(b.gioCheckIn) - new Date(a.gioCheckIn))[0];
          latestMaDatPhong = latestBooking ? latestBooking.maDatPhong : null;
        }
        if (!latestMaDatPhong) {
          setError('Không tìm thấy mã đặt phòng mới nhất cho phòng này.');
          return;
        }

        const createServicePromises = selectedServices.map(async (service) => {
          const bookingService = {
            MaDatPhong: latestMaDatPhong,
            MaDichVu: service.maDichVu,
            SoLuong: service.quantity,
            Gia: service.gia,
            ThanhTien: service.gia * service.quantity,
            NgaySuDung: new Date().toISOString(),
            TenDichVu: service.name
          };
          const response = await axios.post(`${API_BASE_URL}/bookingservice`, bookingService);
          if (!response.data.success) {
            throw new Error(response.data.message || 'Lỗi khi lưu dịch vụ');
          }
          service.maBSD = response.data.data;
          return response.data;
        });
        await Promise.all(createServicePromises);

        console.log('Services saved successfully, reloading room data...');
        await fetchRooms();

        setSelectedRoom(prev => {
          if (prev) {
            return { ...prev, services: selectedServices };
          }
          return prev;
        });

        setSuccessMessage('Thêm dịch vụ thành công!');
        setShowSaveSuccess(true);
      } catch (error) {
        console.error('Lỗi khi lưu dịch vụ:', error);
        setError(`Lỗi khi lưu dịch vụ: ${error.message}`);
      }
    }
    setShowAddServiceForm(false);
    setServiceCategory('Tất cả');
    setSearchService('');
  };

  const handleAddSelectedService = (service) => {
    if (selectedRoom && selectedRoom.status !== 'Phòng đang thuê') {
      setError('Chỉ có thể thêm dịch vụ khi phòng đã được nhận!');
      return;
    }
    console.log('=== Adding service ===');
    console.log('Service to add:', service);
    console.log('Current selectedServices before add:', selectedServices);

    const existingIndex = selectedServices.findIndex(s => String(s.maDichVu) === String(service.maDichVu));

    if (existingIndex !== -1) {
      console.log(`Service ${service.name} already exists at index ${existingIndex}, incrementing quantity`);
      const newSelectedServices = selectedServices.map((s, i) =>
        i === existingIndex ? { ...s, quantity: s.quantity + 1 } : s
      );
      setSelectedServices(newSelectedServices);
      console.log(`✅ Service ${service.name} quantity incremented. Updated list:`, newSelectedServices);
    } else {
      console.log(`Adding new service ${service.name}`);
      const newService = {
        ...service,
        quantity: 1,
        maDichVu: service.maDichVu,
        name: service.name,
        gia: service.gia || 0,
        category: service.category || 'Khác'
      };

      const newSelectedServices = [...selectedServices, newService];
      setSelectedServices(newSelectedServices);
      console.log(`✅ New service ${service.name} added. Updated list:`, newSelectedServices);
    }

    console.log('=== End adding service ===\n');
  };

  const handleRemoveService = (index) => {
    if (selectedRoom && selectedRoom.status !== 'Phòng đang thuê') {
      setError('Chỉ có thể xóa dịch vụ khi phòng đã được nhận!');
      return;
    }
    const newSelectedServices = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(newSelectedServices);
  };

  const handleQuantityChange = (index, quantity) => {
    if (selectedRoom && selectedRoom.status !== 'Phòng đang thuê') {
      setError('Chỉ có thể sửa số lượng dịch vụ khi phòng đã được nhận!');
      return;
    }
    console.log('=== Quantity Change Debug ===');
    console.log('Index:', index);
    console.log('New quantity input:', quantity);
    console.log('Current selectedServices length:', selectedServices.length);
    console.log('Service being changed:', selectedServices[index]);

    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    console.log('Parsed new quantity:', newQuantity);

    if (selectedServices[index] && selectedServices[index].quantity === newQuantity) {
      console.log('Quantity unchanged, skipping update');
      console.log('=== End Quantity Change (no change) ===\n');
      return;
    }

    const newSelectedServices = [...selectedServices];
    if (newSelectedServices[index]) {
      newSelectedServices[index] = { ...newSelectedServices[index], quantity: newQuantity };
      console.log('Updated selectedServices:', newSelectedServices);
      setSelectedServices(newSelectedServices);
      console.log('=== End Quantity Change (updated) ===\n');
    } else {
      console.error('Invalid index:', index);
      console.log('=== End Quantity Change (error) ===\n');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filterStatus === 'Tất cả' || room.status === filterStatus;
    const matchesType = filterType === 'Tất cả' || room.roomType === filterType;
    const matchesCondition = filterCondition === 'Tất cả' || room.condition === filterCondition;
    const matchesSearch = !searchTerm || (room.number && room.number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesType && matchesCondition && matchesSearch;
  });

  const getUniqueRoomTypes = () => {
    const types = [...new Set(rooms.map(room => room.roomType))].filter(type => type && type !== 'Không xác định');
    return types;
  };

  const uniqueRoomTypes = getUniqueRoomTypes();

  if (loading) {
    return (
      <div className="r-room-container">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
        <div className="loading-container"><p>Đang tải dữ liệu phòng...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="r-room-container">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
        <div className="error-container">
          <p>Lỗi: {error}</p>
          <button onClick={() => { fetchRooms(); fetchRoomTypes(); fetchBookings(); fetchServices(); setError(null); }}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="r-room-container">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogoutClick={handleLogoutClick} />
      <LogoutModal isOpen={showLogoutConfirm} onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
      <div className="r-page-header">
        <div className="r-menu-icon" onClick={toggleSidebar}>☰</div>
        <div className="r-header-content"><div className="top-title">Phòng</div></div>
        <div className="r-search-bar">
          <input type="text" placeholder="Tìm phòng" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="r-search-icon">▶</span>
        </div>
      </div>
      <div className="r-filter-sidebar">
        <div className="r-filter-section">
          <h3>Trạng thái</h3>
          <div className="r-filter-options">
            <label><input type="radio" name="status" value="Tất cả" checked={filterStatus === 'Tất cả'} onChange={() => setFilterStatus('Tất cả')} />Tất cả</label>
            <label><input type="radio" name="status" value="Phòng trống" checked={filterStatus === 'Phòng trống'} onChange={() => setFilterStatus('Phòng trống')} />Phòng trống</label>
            <label><input type="radio" name="status" value="Phòng đã đặt" checked={filterStatus === 'Phòng đã đặt'} onChange={() => setFilterStatus('Phòng đã đặt')} />Phòng đã đặt</label>
            <label><input type="radio" name="status" value="Phòng đang thuê" checked={filterStatus === 'Phòng đang thuê'} onChange={() => setFilterStatus('Phòng đang thuê')} />Phòng đang thuê</label>
          </div>
        </div>
        <div className="r-filter-section">
          <h3>Loại phòng</h3>
          <div className="r-filter-options">
            <label><input type="radio" name="type" value="Tất cả" checked={filterType === 'Tất cả'} onChange={() => setFilterType('Tất cả')} />Tất cả</label>
            {uniqueRoomTypes.map((roomType) => (
              <label key={roomType}>
                <input type="radio" name="type" value={roomType} checked={filterType === roomType} onChange={() => setFilterType(roomType)} />
                {roomType}
              </label>
            ))}
          </div>
        </div>
        <div className="r-filter-section">
          <h3>Tình trạng</h3>
          <div className="r-filter-options">
            <label><input type="radio" name="condition" value="Tất cả" checked={filterCondition === 'Tất cả'} onChange={() => setFilterCondition('Tất cả')} />Tất cả</label>
            <label><input type="radio" name="condition" value="Đã dọn dẹp" checked={filterCondition === 'Đã dọn dẹp'} onChange={() => setFilterCondition('Đã dọn dẹp')} />Đã dọn dẹp</label>
            <label><input type="radio" name="condition" value="Chưa dọn dẹp" checked={filterCondition === 'Chưa dọn dẹp'} onChange={() => setFilterCondition('Chưa dọn dẹp')} />Chưa dọn dẹp</label>
            <label><input type="radio" name="condition" value="Sửa chữa" checked={filterCondition === 'Sửa chữa'} onChange={() => setFilterCondition('Sửa chữa')} />Sửa chữa</label>
          </div>
        </div>
      </div>
      <div className="r-main-content">
        {uniqueRoomTypes.map((roomType) => (
          <div key={roomType}>
            <div className="r-room-header"><span>{roomType}</span></div>
            <div className="r-room-list">
              {filteredRooms.filter(room => room.roomType === roomType).map((room) => (
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
        ))}
      </div>
      {selectedRoom && (
        <div className="r-modal-overlay">
          <div className="r-modal-content">
            <h2>{selectedRoom.number}</h2>
            <div className="r-modal-body">
              <div className="r-service-section">
                <h3>Danh sách dịch vụ</h3>
                <table className="r-service-table">
                  <thead>
                    <tr>
                      <th>Dịch vụ</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                      <th>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServices.length > 0 ? (
                      selectedServices.map((service, index) => (
                        <tr key={`service-${index}-${service.maDichVu}`}>
                          <td>{service.name}</td>
                          <td>{service.gia.toLocaleString('vi-VN')} VNĐ</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={service.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                            />
                          </td>
                          <td>{(service.gia * service.quantity).toLocaleString('vi-VN')} VNĐ</td>
                          <td>
                            <button className="r-actionn-button">
                              <img
                                onClick={() => handleRemoveService(index)}
                                src="/icon_LTW/MdiMinusCircle.png"
                                alt="Remove Icon"
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5">Chưa có dịch vụ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="r-status-section">
                <div className="r-filter-section">
                  <h3>Trạng thái phòng</h3>
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
            </div>            <div className="nuttatdong">
              <button className="r-action-button" onClick={handleSave}>Lưu</button>
              {selectedRoom.status === 'Phòng đang thuê' && (
                <>
                  <button className="r-action-button" onClick={handleAddService}>Thêm dịch vụ</button>
                  <button
                    className="r-action-button"
                    onClick={invoiceCreated ? null : handleCreateInvoice}
                    disabled={invoiceCreated}
                    style={{ backgroundColor: invoiceCreated ? '#666666' : '#1D3E92', cursor: invoiceCreated ? 'not-allowed' : 'pointer' }}
                  >
                    Tạo hóa đơn
                  </button>
                  <button
                    className={`r-action-button ${invoiceCreated ? '' : 'r-action-closebutton'}`}
                    onClick={invoiceCreated ? handlePayment : null}
                    disabled={!invoiceCreated}
                    style={{
                      backgroundColor: invoiceCreated ? '#1D3E92' : '#666666',
                      cursor: invoiceCreated ? 'pointer' : 'not-allowed',
                      opacity: invoiceCreated ? 1 : 0.8
                    }}
                  >
                    Thanh toán
                  </button>
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
                  <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}>
                    <option value="Tất cả">Tất cả</option>
                    {[...new Set(services.map(service => service.category))].map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <input type="text" placeholder="Tìm dịch vụ" value={searchService} onChange={(e) => setSearchService(e.target.value)} />
                </div>
                <table>
                  <thead>
                    <tr><th>Loại dịch vụ</th><th>Dịch vụ</th><th>Giá</th><th>Thêm</th></tr>
                  </thead>
                  <tbody>
                    {services.length > 0 ? (
                      services
                        .filter(service => serviceCategory === 'Tất cả' || service.category === serviceCategory)
                        .filter(service => !searchService || service.name.toLowerCase().includes(searchService.toLowerCase()))
                        .map((service, index) => (
                          <tr key={index}>
                            <td>{service.category}</td>
                            <td>{service.name}</td>
                            <td>{service.gia.toLocaleString('vi-VN')} VNĐ</td>
                            <td>
                              <button className="r-actionn-button r-add-button">
                                <img onClick={() => handleAddSelectedService(service)} src="/icon_LTW/MdiPlusCircle.png" alt="Add Icon" />
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr><td colSpan="4">Không có dữ liệu dịch vụ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="r-service-selection">
                <h3>Dịch vụ đã chọn</h3>
                <table>
                  <thead><tr><th>Dịch vụ</th><th>Giá</th><th>Số lượng</th><th>Thành tiền</th><th>Xóa</th></tr></thead>
                  <tbody>
                    {selectedServices.length > 0 ? (
                      selectedServices.map((service, index) => {
                        console.log(`Rendering service ${index}:`, service);
                        return (
                          <tr key={`service-${index}-${service.maDichVu}`}>
                            <td>{service.name}</td>
                            <td>{service.gia.toLocaleString('vi-VN')} VNĐ</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={service.quantity}
                                onChange={(e) => {
                                  console.log(`Input change: index=${index}, value=${e.target.value}`);
                                  handleQuantityChange(index, e.target.value);
                                }}
                              />
                            </td>
                            <td>{(service.gia * service.quantity).toLocaleString('vi-VN')} VNĐ</td>
                            <td>
                              <button className="r-actionn-button">
                                <img onClick={() => handleRemoveService(index)} src="/icon_LTW/MdiMinusCircle.png" alt="Remove Icon" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="5">Chưa chọn dịch vụ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="r-save-exit-container">
              <button className="r-action-button r-save-exit-button" onClick={handleCloseAddServiceForm}>Lưu</button>
              <button className="r-action-button r-save-exit-button" style={{ backgroundColor: '#666666' }} onClick={() => {
                console.log('=== Canceling Add Service Form ===');
                console.log('Resetting selectedServices to original room services');

                if (selectedRoom && selectedRoom.services && Array.isArray(selectedRoom.services)) {
                  setSelectedServices([...selectedRoom.services]);
                  console.log('Reset to original services:', selectedRoom.services);
                } else {
                  setSelectedServices([]);
                  console.log('Reset to empty services');
                }

                setShowAddServiceForm(false);
                setServiceCategory('Tất cả');
                setSearchService('');
                console.log('=== Add Service Form Canceled ===\n');
              }}>Thoát</button>
            </div>
          </div>
        </div>
      )}
      {showSaveSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={handleCloseSaveSuccess}><img src="/icon_LTW/FontistoClose.png" alt="Close Icon" /></span>
            <div className="logout-modal-header"><span className="header-text">Thông Báo</span></div>
            <p className="logout-message">{successMessage}</p>
            <div className="logout-modal-buttons"><button className="confirm-button" onClick={handleCloseSaveSuccess}>OK</button></div>
          </div>
        </div>
      )}
      {showInvoiceModal && invoice && (
        <div className="details-modal">
          <div className="details-modal-content">
            <div className="button_red"><p>Hóa Đơn</p><img onClick={handleCloseInvoiceModal} src="/icon_LTW/thoat2.png" alt="Close Icon" /></div>
            <div className="invoice-header">
              <div className="invoice-logo"><img src="/icon_LTW/LogoDeBugTeam2.jpg" alt="Logo" /></div>
              <div className="invoice-title">HÓA ĐƠN</div>
              <div className="invoice-print"><img src="/icon_LTW/HĐ_Print.png" alt="Print Icon" /></div>
            </div>
            <span className="info-name">{invoice.customerName}</span>
            <div className="invoice-info">
              <div className="info-row">
                <div className="info-rod"><span className="info-label">Ngày lập hóa đơn:</span><span className="info-value">{invoice.date}</span></div>
                <div className="info-rod"><span className="info-label">Số phòng:</span><span className="info-value">{invoice.customerRoom}</span></div>
              </div>              <div className="info-row">
                <div className="info-rod"><span className="info-label">Số hóa đơn:</span><span className="info-value">{invoice.id}</span></div>
                <div className="info-rod"><span className="info-label">Số ngày:</span><span className="info-value">{invoice.customerDays}</span></div>
              </div>
            </div>
            <table className="details-table">
              <thead><tr><th>Dịch vụ</th><th>Giá tiền</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {invoice.services.map((service, index) => (
                  <tr key={index}>
                    <td>{service.name}</td>
                    <td style={service.name === 'Sử dụng điểm' ? { color: 'red' } : {}}>
                      {service.price < 0 ? `-${Math.abs(service.price).toLocaleString('vi-VN')} VNĐ` : `${service.price.toLocaleString('vi-VN')} VNĐ`}
                    </td>
                    <td>{service.quantity}</td>
                    <td style={service.name === 'Sử dụng điểm' ? { color: 'red' } : {}}>
                      {service.total < 0 ? `-${Math.abs(service.total).toLocaleString('vi-VN')} VNĐ` : `${service.total.toLocaleString('vi-VN')} VNĐ`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-total"><span className="total-label">Tổng tiền:</span><span className="total-value">{invoice.grandTotal}</span></div>
            <div className="invoice-footer">
              <div className="footer-text">Cảm ơn quý khách!💙</div>
              <div className="footer-contact">debugteam@gmail.com - +84 123 456 789</div>
            </div>
          </div>
        </div>
      )}
      {showPointForm && (
        <div className="cm-modal-overlay">
          <div className="rm-add-modal-wrapper">
            <h2 className="cm-modal-title">Tích điểm khách hàng</h2>
            <div className="cm-modal-content">
              <div className="cm-form-container">
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/BxsUser (1).png" alt="Tên khách hàng" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tên khách hàng"
                    value={pointCustomerName}
                    disabled
                    className="cm-input-field"
                  />
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLTĐ_Them2.png" alt="Số điểm khả dụng" />
                  </span>
                  <input
                    type="number"
                    placeholder="Số điểm khả dụng"
                    value={customerPoint}
                    disabled
                    className="cm-input-field"
                  />
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLLSTĐ_Them2.png" alt="Sử dụng điểm" />
                  </span>
                  <input
                    type="number"
                    placeholder="Sử dụng điểm"
                    value={usePoint}
                    min={0}
                    max={customerPoint} onChange={e => {
                      const value = Number(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setUsePoint(0);
                        setFinalPoint(customerPoint);
                        setPointError('');
                        return;
                      }
                      if (value > customerPoint) {
                        setUsePoint(value);
                        setFinalPoint(customerPoint);
                        setPointError('Số điểm sử dụng không được vượt quá tổng điểm!');
                      } else {
                        // Calculate potential discount amount to validate against invoice total
                        const totalRoomCost = selectedRoom.tongTien || 0;
                        const totalServiceCost = selectedServices.reduce((sum, service) => sum + service.gia * service.quantity, 0);
                        const tongTienGoc = totalRoomCost + totalServiceCost;

                        // Get point program discount rate for validation
                        (async () => {
                          try {
                            let mucGiamGia = 0;
                            if (selectedRoom?.guestName) {
                              const customerRes = await axios.get('https://localhost:7087/api/customers', {
                                params: { pageNumber: 1, pageSize: 100 }
                              });
                              if (customerRes.data.success && Array.isArray(customerRes.data.data)) {
                                const customer = customerRes.data.data.find(c => c.hoTenKhachHang === selectedRoom.guestName);
                                if (customer) {
                                  const program = await fetchCustomerPointProgram(customer.hoTenKhachHang, customer.tongDiem);
                                  if (program) {
                                    let processedMucGiamGia = program.mucGiamGia;
                                    if (typeof processedMucGiamGia === 'string' && processedMucGiamGia.includes('%')) {
                                      processedMucGiamGia = processedMucGiamGia.replace('%', '');
                                    }
                                    mucGiamGia = parseFloat(processedMucGiamGia) || 0;
                                  }
                                }
                              }
                            }

                            const potentialDiscount = value * mucGiamGia;
                            const finalAmount = tongTienGoc - potentialDiscount;

                            if (finalAmount < 0) {
                              setPointError(`Số điểm quá nhiều! Tối đa có thể sử dụng ${Math.floor(tongTienGoc / mucGiamGia)} điểm để giảm tối đa ${tongTienGoc.toLocaleString('vi-VN')} VNĐ`);
                              setUsePoint(value);
                              setFinalPoint(customerPoint - value);
                            } else {
                              setUsePoint(value);
                              setFinalPoint(customerPoint - value);
                              setPointError('');
                            }
                          } catch (error) {
                            console.error('Error validating point discount:', error);
                            setUsePoint(value);
                            setFinalPoint(customerPoint - value);
                            setPointError('');
                          }
                        })();
                      }
                    }}
                    className="cm-input-field"
                  />
                </div>
                {pointError && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '8px' }}>{pointError}</div>
                )}
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLTĐ_Them.png" alt="Số điểm khả dụng sau khi dùng" />
                  </span>
                  <input
                    type="number"
                    placeholder="Số điểm khả dụng sau khi dùng"
                    value={finalPoint}
                    disabled
                    className="cm-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="rm-save-add-btn" onClick={handlePointFormConfirm} disabled={!!pointError}>Xác nhận</button>
              <button className="cm-cancel-btn" onClick={() => setShowPointForm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;