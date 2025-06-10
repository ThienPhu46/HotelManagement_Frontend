import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/ServiceManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const ServiceManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newService, setNewService] = useState({
    tenDichVu: '',
    maLoaiDV: '',
    gia: ''
  });
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false); // New state for duplicate error modal
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

const API_BASE_URL = process.env.REACT_APP_API_URL;
  const fetchServiceTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-types?pageNumber=1&pageSize=100`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setServiceTypes(result.data || []);
      } else {
        throw new Error(result.message || 'Không thể tải danh sách loại dịch vụ');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API loại dịch vụ:', error);
      setErrorMessage(error.message);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/services?searchTerm=${searchTerm}&sortBy=MaDichVu&sortOrder=ASC`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setServices(result.data || []);
        setErrorMessage('');
      } else {
        throw new Error(result.message || 'Không thể tải danh sách dịch vụ');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setServices([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchServiceTypes();
    fetchServices();
  }, [fetchServiceTypes, fetchServices]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (service) => {
    setSelectedService({
      maDichVu: service.maDichVu,
      tenDichVu: service.tenDichVu,
      maLoaiDV: serviceTypes.find(type => type.tenLoaiDV === service.tenLoaiDV)?.maLoaiDV || '',
      tenLoaiDV: service.tenLoaiDV,
      gia: service.gia.toString()
    });
    setShowDetailsModal(true);
  };

  const handleDelete = (service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${serviceToDelete.maDichVu}`, {
        method: 'DELETE',
      });
      setShowDeleteConfirm(false);

      if (!response.ok) {
        setShowDeleteError(true);
        throw new Error('Lỗi khi xóa dịch vụ');
      }

      const result = await response.json();
      if (result.success) {
        setShowDeleteSuccess(true);
        fetchServices();
      } else {
        setShowDeleteError(true);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API xóa:', error);
      setShowDeleteError(true);
    }
  };

  const handleAddService = () => {
    setNewService({
      tenDichVu: '',
      maLoaiDV: '',
      gia: ''
    });
    setSelectedService(null);
    setShowDetailsModal(true);
  };

  const validateServiceData = (serviceData) => {
    if (!serviceData.tenDichVu.trim()) return 'Vui lòng nhập tên dịch vụ.';
    if (!serviceData.maLoaiDV) return 'Vui lòng chọn loại dịch vụ.';
    if (!serviceData.gia || parseFloat(serviceData.gia) <= 0) return 'Vui lòng nhập đơn giá hợp lệ.';
    if (!selectedService) {
      const isDuplicate = services.some(
        (service) => service.tenDichVu.toLowerCase() === serviceData.tenDichVu.trim().toLowerCase()
      );
      if (isDuplicate) return 'Dịch vụ với tên này đã tồn tại.';
    }
    return null;
  };

  const handleSave = async () => {
    const serviceData = selectedService || newService;
    const validationError = validateServiceData(serviceData);
    if (validationError) {
      if (validationError === 'Dịch vụ với tên này đã tồn tại.') {
        setShowDuplicateError(true); // Show duplicate error modal
      } else {
        setShowInputError(true);
      }
      return;
    }

    try {
      const url = selectedService
        ? `${API_BASE_URL}/api/services/${selectedService.maDichVu}`
        : `${API_BASE_URL}/api/services`;
      const method = selectedService ? 'PUT' : 'POST';

      const body = {
        tenDichVu: serviceData.tenDichVu,
        maLoaiDV: parseInt(serviceData.maLoaiDV),
        gia: parseFloat(serviceData.gia)
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setShowDetailsModal(false);
        setShowSaveConfirm(true);
        setShowAddSuccess(!selectedService);
        fetchServices();
      } else {
        throw new Error(result.message || (selectedService ? 'Cập nhật dịch vụ thất bại' : 'Thêm dịch vụ thất bại'));
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message || 'Đã xảy ra lỗi khi lưu dịch vụ');
    }
  };

  const handleCancel = () => {
    setShowDetailsModal(false);
    setSelectedService(null);
    setNewService({
      tenDichVu: '',
      maLoaiDV: '',
      gia: ''
    });
    setErrorMessage('');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = () => {
    console.log('Người dùng đã đăng xuất');
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  return (
    <div className="sm-main-container">
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
          <div className="top-title">Quản Lý Dịch Vụ</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="sm-content-wrapper">
        {errorMessage && <div className="sm-error-message">{errorMessage}</div>}
        <div className="sm-search-add-section">
          <div className="sm-search-box">
            <span className="sm-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#"></img></span>
            <input
              type="text"
              placeholder="Tìm theo tên dịch vụ"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="sv-add-action">
            <button className="sm-add-service-btn" onClick={handleAddService}>
              Thêm dịch vụ
            </button>
          </div>
        </div>

        <div className="sm-table-container">
          <table className="sm-service-table">
            <thead>
              <tr>
                <th>Mã dịch vụ</th>
                <th>Tên dịch vụ</th>
                <th>Loại</th>
                <th>Đơn giá</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.maDichVu}>
                    <td>{service.maDichVu}</td>
                    <td>{service.tenDichVu}</td>
                    <td>{service.tenLoaiDV || 'N/A'}</td>
                    <td>{service.gia.toLocaleString('vi-VN') + ' VNĐ'}</td>
                    <td>
                      <div className="sv-edit-action">
                        <button className="sm-edit-btn" onClick={() => handleEdit(service)}>
                          <span className="sm-edit-icon"><img src="/icon_LTW/Edit.png" alt="#"></img></span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="sv-delete-action">
                        <button
                          className="sm-delete-btn"
                          onClick={() => handleDelete(service)}
                        >
                          <span className="sm-delete-icon"><img src="/icon_LTW/Xoa.png" alt="#"></img></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Không có dữ liệu để hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && (
        <div className="sv-modal-overlay">
          <div className="sv-modal-wrapper">
            <h2 className="sv-modal-title">{selectedService ? `Sửa dịch vụ ${selectedService.maDichVu}` : 'Thêm dịch vụ'}</h2>
            <div className="sv-modal-content">
              <div className="sv-form-container">
                <div className="sv-form-field">
                  <span className="sv-field-icon"><img src="/icon_LTW/SB_QLDichVu.png" alt="#"></img></span>
                  <input
                    type="text"
                    placeholder="Tên dịch vụ"
                    value={selectedService ? selectedService.tenDichVu : newService.tenDichVu}
                    onChange={(e) => {
                      if (selectedService) {
                        setSelectedService({ ...selectedService, tenDichVu: e.target.value });
                      } else {
                        setNewService({ ...newService, tenDichVu: e.target.value });
                      }
                    }}
                    className="sv-input-field"
                  />
                </div>
                <div className="sv-form-field">
                  <span className="sv-field-icon"><img src="/icon_LTW/SB_QLLoaiDichVu.png" alt="#"></img></span>
                  <select
                    value={selectedService ? selectedService.maLoaiDV : newService.maLoaiDV}
                    onChange={(e) => {
                      if (selectedService) {
                        setSelectedService({ ...selectedService, maLoaiDV: e.target.value });
                      } else {
                        setNewService({ ...newService, maLoaiDV: e.target.value });
                      }
                    }}
                    className="sv-select-field"
                  >
                    <option value="" disabled>Chọn loại dịch vụ</option>
                    {serviceTypes.map((type) => (
                      <option key={type.maLoaiDV} value={type.maLoaiDV}>
                        {type.tenLoaiDV}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sv-form-field">
                  <span className="sv-field-icon"><img src="/icon_LTW/QLLP_DatPhong3.png" alt="#"></img></span>
                  <input
                    type="number"
                    placeholder="Đơn giá"
                    value={selectedService ? selectedService.gia : newService.gia}
                    onChange={(e) => {
                      if (selectedService) {
                        setSelectedService({ ...selectedService, gia: e.target.value });
                      } else {
                        setNewService({ ...newService, gia: e.target.value });
                      }
                    }}
                    className="sv-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="sv-modal-actions">
              <button className="sv-save-btn" onClick={handleSave}>Lưu</button>
              <button className="sv-cancel-btn" onClick={handleCancel}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowSaveConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            {showAddSuccess ? (
              <p className="logout-message">Thêm dịch vụ thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin dịch vụ thành công!</p>
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

      {showDeleteConfirm && serviceToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa {serviceToDelete.tenDichVu}?</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleConfirmDelete}>
                YES
              </button>
              <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteSuccess(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Xóa thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDeleteSuccess(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Dịch vụ này đang được sử dụng.</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDeleteError(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowInputError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn chưa nhập đầy đủ thông tin. Vui lòng nhập đầy đủ thông tin!</p>
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
            <span className="close-icon" onClick={() => setShowDuplicateError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Dịch vụ với tên này đã tồn tại.</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDuplicateError(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;