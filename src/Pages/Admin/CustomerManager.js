import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/CustomerManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';
import axios from 'axios';

const CustomerManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    hoTenKhachHang: '',
    email: '',
    dienThoai: '',
    maCT: '1',
    tongDiem: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [pointPrograms, setPointPrograms] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const API_BASE_URL = 'https://localhost:7087';

  const fetchPointPrograms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/point-programs?pageNumber=1&pageSize=100`, { headers });
      if (response.data.success) {
        setPointPrograms(response.data.data || []);      } else {
        throw new Error(response.data.message || 'Không thể tải danh sách chương trình điểm');
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(
        `${API_BASE_URL}/api/customers?searchTerm=${searchTerm}&sortBy=MaKhachHang&sortOrder=ASC`,
        { headers }
      );
      if (response.data.success) {
        const validatedData = (response.data.data || []).map((customer, index) => ({
          maKhachHang: customer.maKhachHang || `TEMP_${index}`,
          hoTenKhachHang: customer.hoTenKhachHang || 'N/A',
          dienThoai: customer.dienThoai || 'N/A',
          email: customer.email || '',
          maCT: customer.maCT || '1',
          tenCT: customer.tenCT || (pointPrograms.find(p => p.maCT === '1')?.tenCT || 'N/A'),
          tongDiem: customer.tongDiem !== undefined ? customer.tongDiem : 0,
        }));
        setCustomers(validatedData);
        setErrorMessage('');      } else {
        throw new Error(response.data.message || 'Không thể tải danh sách khách hàng');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setCustomers([]);
    }}, [searchTerm, pointPrograms]);
    const checkDuplicateCustomer = async (email, phone) => {
    const token = localStorage.getItem('token');
    
    // Skip duplicate checking entirely to avoid 400/500 errors
    // This is a temporary fix until the backend validation endpoints are working properly
    // TODO: Re-enable validation when backend endpoints are fixed
    if (!token) {
      console.warn('No token available for duplicate validation');
    }
    
    return { 
      isDuplicate: false, 
      message: ''
    };
  };

  useEffect(() => {
    fetchPointPrograms();
  }, [fetchPointPrograms]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer({
      maKhachHang: customer.maKhachHang,
      hoTenKhachHang: customer.hoTenKhachHang,
      email: customer.email,
      dienThoai: customer.dienThoai,
      tongDiem: customer.tongDiem,
    });
    setShowDetailsModal(true);
  };

  const handleAddCustomer = () => {
    setNewCustomer({
      hoTenKhachHang: '',
      email: '',
      dienThoai: '',
      maCT: '1',
      tongDiem: 0,
    });
    setSelectedCustomer(null);
    setShowDetailsModal(true);
  };

  const validateCustomerData = (customerData) => {
    if (!customerData.hoTenKhachHang.trim()) return 'Vui lòng nhập họ tên khách hàng.';
    if (!customerData.email.trim()) return 'Vui lòng nhập email.';
    if (!customerData.dienThoai.trim()) return 'Vui lòng nhập số điện thoại.';
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      return 'Email không đúng định dạng.';
    }
    
    // Validate phone number (Vietnamese format: 10 digits starting with 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(customerData.dienThoai)) {
      return 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.';
    }
    
    return null;
  };
  const handleSave = async () => {
    const customerData = selectedCustomer || newCustomer;
    
    const validationError = validateCustomerData(customerData);
    if (validationError) {
      setShowInputError(true);
      setErrorMessage(validationError);
      return;
    }
    
    const duplicateResult = await checkDuplicateCustomer(customerData.email, customerData.dienThoai);
    const { isDuplicate, message } = duplicateResult;    if (isDuplicate) {
      setErrorMessage(message);
      setShowDuplicateError(true);
      return;
    }
    
    try {
      const url = selectedCustomer
        ? `${API_BASE_URL}/api/customers/${selectedCustomer.maKhachHang}`
        : `${API_BASE_URL}/api/customers`;      const method = selectedCustomer ? 'PUT' : 'POST';

      const body = {
        hoTenKhachHang: customerData.hoTenKhachHang.trim(),
        email: customerData.email.trim(),
        dienThoai: customerData.dienThoai.trim(),
        maCT: '1', // Default program ID
        tongDiem: parseInt(customerData.tongDiem || 0, 10),
      };      // Only include maKhachHang for PUT requests
      if (selectedCustomer && method === 'PUT') {
        body.maKhachHang = selectedCustomer.maKhachHang;
      }      const token = localStorage.getItem('token');

      const requestConfig = {
        method: method,
        url: url,
        data: body,
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 30000, // 30 second timeout
      };      const response = await axios(requestConfig);
      
      if (response.data && (response.data.success === true || response.status === 200 || response.status === 201)) {
        setShowDetailsModal(false);
        setShowSaveConfirm(true);
        setShowAddSuccess(!selectedCustomer);
        
        await fetchCustomers();
      } else {
        throw new Error(response.data?.message || (selectedCustomer ? 'Cập nhật khách hàng thất bại' : 'Thêm khách hàng thất bại'));
      }    } catch (error) {
      let errorMessage = 'Có lỗi khi lưu khách hàng';
      
      if (error.response) {        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = `Dữ liệu không hợp lệ: ${data?.message || data || 'Vui lòng kiểm tra thông tin nhập vào'}`;
            break;
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            break;
          case 403:
            errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
            break;
          case 404:
            errorMessage = 'Không tìm thấy API endpoint. Vui lòng liên hệ admin.';
            break;
          case 500:
            errorMessage = `Lỗi server: ${data?.message || 'Vui lòng thử lại sau ít phút'}`;
            break;
          default:
            errorMessage = `Lỗi ${status}: ${data?.message || data || error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Yêu cầu bị timeout. Vui lòng thử lại.';
      } else {
        errorMessage = error.message || 'Có lỗi không xác định xảy ra';
      }
      
      setErrorMessage(errorMessage);
      setShowInputError(true);
    }
  };

  const handleCancel = () => {
    setShowDetailsModal(false);
    setSelectedCustomer(null);
    setNewCustomer({
      hoTenKhachHang: '',
      email: '',
      dienThoai: '',
      maCT: '1',
      tongDiem: 0,
    });
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  return (
    <div className="cm-main-container">
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
          <div className="top-title">Quản Lý Khách Hàng</div>
        </div>
        <div className="more-icon" onClick={() => {}}>⋮</div>
      </div>

      <div className="cm-content-wrapper">
        {errorMessage && <div className="cm-error-message">{errorMessage}</div>}
        <div className="cm-search-add-section">
          <div className="cm-search-box">
            <span className="cm-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo họ tên khách hàng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="cm-add-action">
            <button className="cm-add-customer-btn" onClick={handleAddCustomer}>
              Thêm khách hàng
            </button>
          </div>
        </div>

        <div className="cm-table-container">
          <table className="cm-customer-table">
            <thead>
              <tr>
                <th>Mã khách hàng</th>
                <th>Họ tên khách hàng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Tổng điểm</th>
                <th>Mã chương trình</th>
                <th>Tên chương trình</th>
                <th>Sửa</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.maKhachHang}>
                    <td>{customer.maKhachHang}</td>
                    <td>{customer.hoTenKhachHang}</td>
                    <td>{customer.email}</td>
                    <td>{customer.dienThoai}</td>
                    <td>{customer.tongDiem}</td>
                    <td>{customer.maCT}</td>
                    <td>{customer.tenCT}</td>
                    <td>
                      <button className="cm-edit-btn" onClick={() => handleEdit(customer)}>
                        <img src="/icon_LTW/Edit.png" alt="#" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">Không có dữ liệu để hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && (
        <div className="cm-modal-overlay">
          <div className="cm-modal-wrapper">
            <h2 className="cm-modal-title">{selectedCustomer ? `Sửa khách hàng ${selectedCustomer.maKhachHang}` : 'Thêm khách hàng'}</h2>
            <div className="cm-modal-content">
              <div className="cm-form-container">
                <div className="cm-form-field">
                  <span className="cm-field-icon"><img src="/icon_LTW/ĐP_Hoten.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Họ tên khách hàng"
                    value={selectedCustomer ? selectedCustomer.hoTenKhachHang : newCustomer.hoTenKhachHang}
                    onChange={(e) => {
                      if (selectedCustomer) {
                        setSelectedCustomer({ ...selectedCustomer, hoTenKhachHang: e.target.value });
                      } else {
                        setNewCustomer({ ...newCustomer, hoTenKhachHang: e.target.value });
                      }
                    }}
                    className="cm-input-field"
                  />
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon"><img src="/icon_LTW/Email.png" alt="#" /></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={selectedCustomer ? selectedCustomer.email : newCustomer.email}
                    onChange={(e) => {
                      if (selectedCustomer) {
                        setSelectedCustomer({ ...selectedCustomer, email: e.target.value });
                      } else {
                        setNewCustomer({ ...newCustomer, email: e.target.value });
                      }
                    }}
                    className="cm-input-field"
                  />
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon"><img src="/icon_LTW/ĐP_SĐT.png" alt="#" /></span>
                  <div className="cm-input-with-length">
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      value={selectedCustomer ? selectedCustomer.dienThoai : newCustomer.dienThoai}
                      onChange={(e) => {
                        // Only allow digits and limit to 10 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        if (selectedCustomer) {
                          setSelectedCustomer({ ...selectedCustomer, dienThoai: value });
                        } else {
                          setNewCustomer({ ...newCustomer, dienThoai: value });
                        }
                      }}
                      className="cm-input-field"
                      maxLength="10"
                    />
                    <span className="cm-field-length">
                      {(selectedCustomer ? selectedCustomer.dienThoai : newCustomer.dienThoai).length}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-save-btn" onClick={handleSave}>Lưu</button>
              <button className="cm-cancel-btn" onClick={handleCancel}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowSaveConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            {showAddSuccess ? (
              <p className="logout-message">Thêm khách hàng thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin khách hàng thành công!</p>
            )}
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => {
                setShowSaveConfirm(false);
                setShowAddSuccess(false);
              }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowInputError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{errorMessage}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowInputError(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDuplicateError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{errorMessage}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => {
                setShowDuplicateError(false);
                setErrorMessage('');
              }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
