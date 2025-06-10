import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/ServiceTypeManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const ServiceTypeManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [newServiceType, setNewServiceType] = useState({
    serviceTypeCode: '',
    serviceTypeName: ''
  });
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false); // New state for duplicate error modal
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState(null);
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
        setErrorMessage('');
      } else {
        throw new Error(result.message || 'Không thể tải danh sách loại dịch vụ');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setServiceTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchServiceTypes();
  }, [fetchServiceTypes]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredServiceTypes = serviceTypes.filter((serviceType) =>
    serviceType.tenLoaiDV.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmLogout = () => {
    console.log('Người dùng đã đăng xuất');
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleAddServiceType = () => {
    setNewServiceType({
      serviceTypeCode: '',
      serviceTypeName: ''
    });
    setSelectedServiceType(null);
    setShowDetailsModal(true);
  };

  const validateServiceTypeData = (serviceTypeData) => {
    if (!serviceTypeData.serviceTypeName.trim()) return 'Vui lòng nhập tên loại dịch vụ.';
    if (!selectedServiceType) {
      const isDuplicate = serviceTypes.some(
        (type) => type.tenLoaiDV.toLowerCase() === serviceTypeData.serviceTypeName.trim().toLowerCase()
      );
      if (isDuplicate) return 'Loại dịch vụ với tên này đã tồn tại.';
    }
    return null;
  };

  const handleSave = async () => {
    const serviceTypeData = selectedServiceType || newServiceType;
    const validationError = validateServiceTypeData(serviceTypeData);
    if (validationError) {
      if (validationError === 'Loại dịch vụ với tên này đã tồn tại.') {
        setShowDuplicateError(true); // Show duplicate error modal
      } else {
        setShowInputError(true); // Hiển thị modal lỗi nhập liệu
      }
      return;
    }

    try {
      const url = selectedServiceType
        ? `${API_BASE_URL}/api/service-types/${selectedServiceType.maLoaiDV}`
        : `${API_BASE_URL}/api/service-types`;
      const method = selectedServiceType ? 'PUT' : 'POST';

      const body = {
        tenLoaiDV: serviceTypeData.serviceTypeName
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
        setShowAddSuccess(!selectedServiceType);
        fetchServiceTypes();
      } else {
        throw new Error(result.message || (selectedServiceType ? 'Cập nhật loại dịch vụ thất bại' : 'Thêm loại dịch vụ thất bại'));
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message || 'Đã xảy ra lỗi khi lưu loại dịch vụ');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-types/${serviceTypeToDelete.maLoaiDV}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setShowDeleteConfirm(false);
        setShowDeleteError(true);
        throw new Error('Lỗi khi xóa loại dịch vụ');
      }

      const result = await response.json();
      if (result.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        fetchServiceTypes();
      } else {
        setShowDeleteConfirm(false);
        setShowDeleteError(true);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API xóa:', error);
      setShowDeleteConfirm(false);
      setShowDeleteError(true);
    }
  };

  return (
    <div className="svtype-main-container">
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
          <div className="top-title">Quản Lý Loại Dịch Vụ</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="svtype-content-wrapper">
        {errorMessage && <div className="sm-error-message">{errorMessage}</div>}
        <div className="svtype-search-add-section">
          <div className="svtype-search-box">
            <span className="svtype-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#"></img></span>
            <input
              type="text"
              placeholder="Tìm theo tên loại dịch vụ"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="svtype-add-action">
            <button className="svtype-add-service-type-btn" onClick={handleAddServiceType}>
              Thêm loại dịch vụ
            </button>
          </div>
        </div>

        <div className="svtype-table-container">
          <table className="svtype-service-type-table">
            <thead>
              <tr>
                <th>Mã loại dịch vụ</th>
                <th>Tên loại dịch vụ</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {filteredServiceTypes.length > 0 ? (
                filteredServiceTypes.map((serviceType) => (
                  <tr key={serviceType.maLoaiDV}>
                    <td>{serviceType.maLoaiDV}</td>
                    <td>{serviceType.tenLoaiDV}</td>
                    <td>
                      <div className="svtype-edit-action">
                        <button
                          className="svtype-edit-btn"
                          onClick={() => {
                            setSelectedServiceType({
                              maLoaiDV: serviceType.maLoaiDV,
                              serviceTypeName: serviceType.tenLoaiDV
                            });
                            setShowDetailsModal(true);
                          }}
                        >
                          <span className="svtype-edit-icon"><img src="/icon_LTW/Edit.png" alt="#"></img></span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="svtype-delete-action">
                        <button
                          className="svtype-delete-btn"
                          onClick={() => {
                            setServiceTypeToDelete(serviceType);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <span className="svtype-delete-icon"><img src="/icon_LTW/Xoa.png" alt="#"></img></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Không có dữ liệu để hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && (
        <div className="svtype-modal-overlay">
          <div className="svtype-modal-wrapper">
            <h2 className="svtype-modal-title">{selectedServiceType ? `Sửa loại dịch vụ ${selectedServiceType.maLoaiDV}` : 'Thêm loại dịch vụ'}</h2>
            <div className="svtype-modal-content">
              <div className="svtype-form-container">
                <div className="svtype-form-field">
                  <span className="svtype-field-icon"><img src="/icon_LTW/SB_QLLoaiDichVu.png" alt="#"></img></span>
                  <input
                    type="text"
                    placeholder="Tên loại dịch vụ"
                    value={selectedServiceType ? selectedServiceType.serviceTypeName : newServiceType.serviceTypeName}
                    onChange={(e) => {
                      if (selectedServiceType) {
                        setSelectedServiceType({ ...selectedServiceType, serviceTypeName: e.target.value });
                      } else {
                        setNewServiceType({ ...newServiceType, serviceTypeName: e.target.value });
                      }
                    }}
                    className="svtype-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="svtype-modal-actions">
              <button className="svtype-save-btn" onClick={handleSave}>Lưu</button>
              <button
                className="svtype-cancel-btn"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedServiceType(null);
                  setNewServiceType({
                    serviceTypeCode: '',
                    serviceTypeName: ''
                  });
                  setErrorMessage('');
                }}
              >
                Hủy bỏ
              </button>
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
              <p className="logout-message">Thêm loại dịch vụ thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin loại dịch vụ thành công!</p>
            )}
            <div className="logout-modal-buttons">
              <button
                className="confirm-button"
                onClick={() => {
                  setShowSaveConfirm(false);
                  setShowAddSuccess(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && serviceTypeToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#"></img></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa {serviceTypeToDelete.tenLoaiDV}?</p>
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
            <p className="logout-message">Loại dịch vụ này đang được sử dụng.</p>
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
            <p className="logout-message">Loại dịch vụ với tên này đã tồn tại.</p>
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

export default ServiceTypeManagement;