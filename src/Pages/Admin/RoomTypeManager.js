import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/RoomTypeManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const RoomTypeManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [newType, setNewType] = useState({
    typeName: '',
    bedCount: '',
    dayPrice: '',
    description: ''
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInputErrorModal, setShowInputErrorModal] = useState(false);
  const [showApiErrorModal, setShowApiErrorModal] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const API_BASE_URL = 'https://localhost:7087';

  const fetchRoomTypes = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/room-types?searchTerm=${searchTerm}&sortBy=MaLoaiPhong&sortOrder=ASC`
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
        const typeData = result.data || [];
        console.log('Room Type Data:', typeData);
        if (!Array.isArray(typeData)) {
          throw new Error('Dữ liệu loại phòng không phải là mảng');
        }
        const validatedData = typeData.map((type, index) => {
          const rawDayPrice = parseFloat(type.giaPhong) || 0;
          const rawHourPrice = Math.round(rawDayPrice / 24);

          return {
            id: type.maLoaiPhong || `TEMP_${index}`,
            typeCode: type.maLoaiPhong || `TEMP_${index}`,
            typeName: type.tenLoaiPhong || 'N/A',
            bedCount: type.moTa?.match(/(\\d+)\\s*giường/)?.[1] || 1,
            dayPrice: `${rawDayPrice.toLocaleString('vi-VN')} VND`,
            hourPrice: `${rawHourPrice.toLocaleString('vi-VN')} VND`,
            description: type.moTa || ''
          };
        });

        setRoomTypes(validatedData);
        setErrorMessage('');
      } else {
        throw new Error(result.message || 'Không thể tải danh sách loại phòng');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setRoomTypes([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (id) => {
    const type = roomTypes.find((t) => t.id === id);
    setSelectedType({
      id: type.id,
      typeName: type.typeName,
      bedCount: type.bedCount,
      dayPrice: type.dayPrice.replace(' VND', '').replace(/\./g, ''),
      description: type.description
    });
    setShowEditModal(true);
  };

  const filteredTypes = roomTypes.filter((type) =>
    type.typeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    const type = roomTypes.find((t) => t.id === id);
    const exists = roomTypes.some(t => t.id === id);
    if (!exists) {
      setErrorMessage('Loại phòng không tồn tại hoặc đã bị xóa!');
      return;
    }
    setTypeToDelete(type);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!typeToDelete) {
        setApiErrorMessage('Không có loại phòng nào được chọn để xóa!');
        setShowApiErrorModal(true);
        setShowDeleteConfirm(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/room-types/${typeToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        setApiErrorMessage(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText.substring(0, 200)}`);
        setShowApiErrorModal(true);
        setShowDeleteConfirm(false);
        return;
      }
      const result = await response.json();
      if (result.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        fetchRoomTypes();
      } else {
        setApiErrorMessage(result.message || 'Xóa loại phòng thất bại');
        setShowApiErrorModal(true);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API xóa:', error);
      setApiErrorMessage(error.message || 'Đã xảy ra lỗi khi xóa loại phòng');
      setShowApiErrorModal(true);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddType = () => {
    setNewType({
      typeName: '',
      bedCount: '',
      dayPrice: '',
      description: ''
    });
    setSelectedType(null);
    setShowEditModal(true);
    setErrorMessage('');
  };

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleSave = async () => {
    try {
      // Kiểm tra dữ liệu đầu vào
      const currentType = selectedType || newType;
      if (!currentType.typeName || !currentType.bedCount || !currentType.dayPrice) {
        setShowInputErrorModal(true); // Hiển thị bảng thông báo lỗi nhập liệu
        return;
      }

      if (selectedType) {
        const roomTypeData = {
          maLoaiPhong: selectedType.id,
          tenLoaiPhong: selectedType.typeName,
          giaPhong: parseFloat(selectedType.dayPrice.replace(/[^0-9.-]+/g, '')),
          moTa: `${selectedType.bedCount} giường${selectedType.description ? `, ${selectedType.description}` : ''}`
        };

        const response = await fetch(`${API_BASE_URL}/api/room-types/${selectedType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomTypeData),
        });
        if (!response.ok) {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          setApiErrorMessage(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText.substring(0, 200)}`);
          setShowApiErrorModal(true);
          return;
        }
        const result = await response.json();
        console.log('PUT Response:', result);
        if (result.success) {
          setShowEditModal(false);
          setShowSaveConfirm(true);
          fetchRoomTypes();
        } else {
          setApiErrorMessage(result.message || 'Cập nhật loại phòng thất bại');
          setShowApiErrorModal(true);
        }
      } else {
        const roomTypeData = {
          tenLoaiPhong: newType.typeName,
          giaPhong: parseFloat(newType.dayPrice.replace(/[^0-9.-]+/g, '')),
          moTa: `${newType.bedCount} giường${newType.description ? `, ${newType.description}` : ''}`
        };

        const response = await fetch(`${API_BASE_URL}/api/room-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomTypeData),
        });
        if (!response.ok) {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          setApiErrorMessage(errorData.message || `Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText.substring(0, 200)}`);
          setShowApiErrorModal(true);
          return;
        }
        const result = await response.json();
        console.log('POST Response:', result);
        if (result.success) {
          setShowEditModal(false);
          setShowSaveConfirm(true);
          setShowAddSuccess(true);
          fetchRoomTypes();
        } else {
          setApiErrorMessage(result.message || 'Thêm loại phòng thất bại');
          setShowApiErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setApiErrorMessage(error.message || 'Đã xảy ra lỗi khi lưu loại phòng');
      setShowApiErrorModal(true);
    }
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setSelectedType(null);
    setNewType({
      typeName: '',
      bedCount: '',
      dayPrice: '',
      description: ''
    });
    setErrorMessage('');
  };

  return (
    <div className="rtm-main-container">
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
          <div className="top-title">Quản Lý Loại Phòng</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="rtm-content-wrapper">
        {errorMessage && (
          <div className="rtm-error-message">
            {errorMessage}
          </div>
        )}
        <div className="rtm-search-add-section">
          <div className="rtm-search-box">
            <span className="rtm-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo tên loại phòng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="rtm-add-type-btn" onClick={handleAddType}>
            Thêm loại phòng
          </button>
        </div>

        <div className="rtm-table-container">
          <table className="rtm-type-table">
            <thead>
              <tr>
                <th>Mã loại phòng</th>
                <th>Tên loại phòng</th>
                <th>Số giường</th>
                <th>Giá ngày</th>
                <th>Giá giờ</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length > 0 ? (
                filteredTypes.map((type) => (
                  <tr key={type.id}>
                    <td>{type.typeCode}</td>
                    <td>{type.typeName}</td>
                    <td>{type.bedCount}</td>
                    <td>{type.dayPrice}</td>
                    <td>{type.hourPrice}</td>
                    <td>
                      <button className="rtm-edit-btn" onClick={() => handleEdit(type.id)}>
                        <span className="rtm-edit-icon"><img src="/icon_LTW/Edit.png" alt="#" /></span>
                      </button>
                    </td>
                    <td>
                      <button className="rtm-delete-btn" onClick={() => handleDelete(type.id)}>
                        <span className="rtm-delete-icon"><img src="/icon_LTW/Xoa.png" alt="#" /></span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">Không có dữ liệu để hiển thị</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="rtm-modal-overlay">
          <div className={selectedType ? 'rtm-edit-modal-wrapper' : 'rtm-add-modal-wrapper'}>
            <h2 className="rtm-modal-title">{selectedType ? `Sửa loại phòng ${selectedType.typeName}` : 'Thêm loại phòng'}</h2>
            <div className="rtm-modal-content">
              <div className="rtm-form-container">
                <div className="rtm-form-field">
                  <span className="rtm-field-icon"><img src="/icon_LTW/QLLP_ThemPhong.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Tên loại phòng"
                    value={selectedType ? selectedType.typeName : newType.typeName}
                    onChange={(e) => {
                      if (selectedType) {
                        setSelectedType({ ...selectedType, typeName: e.target.value });
                      } else {
                        setNewType({ ...newType, typeName: e.target.value });
                      }
                    }}
                    className="rtm-input-field"
                  />
                </div>
                <div className="rtm-form-field">
                  <span className="rtm-field-icon"><img src="/icon_LTW/QLLP_DatPhong2.png" alt="#" /></span>
                  <input
                    type="number"
                    placeholder="Số giường"
                    value={selectedType ? selectedType.bedCount : newType.bedCount}
                    onChange={(e) => {
                      if (selectedType) {
                        setSelectedType({ ...selectedType, bedCount: e.target.value });
                      } else {
                        setNewType({ ...newType, bedCount: e.target.value });
                      }
                    }}
                    className="rtm-input-field"
                  />
                </div>
                <div className="rtm-form-field">
                  <span className="rtm-field-icon"><img src="/icon_LTW/QLLP_DatPhong3.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Giá ngày"
                    value={selectedType ? selectedType.dayPrice : newType.dayPrice}
                    onChange={(e) => {
                      if (selectedType) {
                        setSelectedType({ ...selectedType, dayPrice: e.target.value });
                      } else {
                        setNewType({ ...newType, dayPrice: e.target.value });
                      }
                    }}
                    className="rtm-input-field"
                  />
                </div>
                <div className="rtm-form-field">
                  <span className="rtm-field-icon"><img src="/icon_LTW/QLLP_ThemPhong.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Mô tả (nếu có)"
                    value={selectedType ? selectedType.description : newType.description}
                    onChange={(e) => {
                      if (selectedType) {
                        setSelectedType({ ...selectedType, description: e.target.value });
                      } else {
                        setNewType({ ...newType, description: e.target.value });
                      }
                    }}
                    className="rtm-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="rtm-modal-actions">
              <button className={selectedType ? 'rtm-save-edit-btn' : 'rtm-save-add-btn'} onClick={handleSave}>Lưu</button>
              <button className="rtm-cancel-btn" onClick={handleCancel}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && typeToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa loại phòng {typeToDelete.typeName}?</p>
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

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowSaveConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            {showAddSuccess ? (
              <p className="logout-message">Thêm loại phòng thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin loại phòng thành công!</p>
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

      {showDeleteSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteSuccess(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Xóa loại phòng thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDeleteSuccess(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputErrorModal && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowInputErrorModal(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn chưa nhập đầy đủ thông tin. Vui lòng nhập đầy đủ thông tin!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowInputErrorModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showApiErrorModal && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowApiErrorModal(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{apiErrorMessage}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowApiErrorModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypeManagement;