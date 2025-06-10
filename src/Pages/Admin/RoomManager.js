import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../Design_Css/Admin/RoomManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const RoomManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    SoPhong: '',
    TinhTrang: '',
    LoaiPhong: '',
    TrangThai: '',
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDuplicateRoom, setShowDuplicateRoom] = useState(false);
  const [showConstraintError, setShowConstraintError] = useState(false);
  const [showEmptyDataError, setShowEmptyDataError] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [error, setError] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(rooms.length / pageSize);
  const paginatedRooms = React.useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return rooms.slice(startIdx, startIdx + pageSize);
  }, [rooms, currentPage]);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;
  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/rooms`, {
        params: { searchTerm, sortBy: 'MaPhong', sortOrder: 'ASC', pageNumber: 1, pageSize: 100 },
        headers,
      });

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          const mappedRooms = response.data.data.map(room => ({
            MaPhong: room.maPhong || `TEMP_${Math.random().toString(36).substr(2, 9)}`,
            SoPhong: room.soPhong || 'N/A',
            GiaPhong: room.giaPhong || 0,
            TrangThai: room.trangThai || 'N/A',
            LoaiPhong: String(room.loaiPhong) || '',
            TinhTrang: room.tinhTrang || 'N/A',
          }));
          setRooms(mappedRooms);
          setError(null);
        } else {
          setError('Dữ liệu phòng không đúng định dạng, không phải mảng.');
          setRooms([]);
        }
      } else {
        setError(response.data.message || 'Lỗi khi lấy danh sách phòng từ API.');
        setRooms([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định khi lấy danh sách phòng.';
      setError(`Lỗi khi lấy danh sách phòng: ${errorMessage}`);
      setRooms([]);
      console.error('Fetch rooms error:', error);
    }
  }, [searchTerm]);

  const fetchRoomTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/room-types?pageNumber=1&pageSize=100`, {
        headers,
      });

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          const mappedRoomTypes = response.data.data.map(type => ({
            MaLoaiPhong: type.maLoaiPhong || `TEMP_${Math.random().toString(36).substr(2, 9)}`,
            TenLoaiPhong: type.tenLoaiPhong || 'Không xác định',
            GiaPhong: type.giaPhong || 0,
            MoTa: type.moTa || '',
          }));
          setRoomTypes(mappedRoomTypes);
          setError(null);
        } else {
          setError('Dữ liệu loại phòng không đúng định dạng, không phải mảng.');
          setRoomTypes([]);
        }
      } else {
        setError(response.data.message || 'Lỗi khi lấy danh sách loại phòng từ API.');
        setRoomTypes([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định khi lấy danh sách loại phòng.';
      setError(`Lỗi khi lấy danh sách loại phòng: ${errorMessage}`);
      setRoomTypes([]);
      console.error('Fetch room types error:', error);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, [fetchRooms, fetchRoomTypes]);

  const getRoomTypeName = (loaiPhong) => {
    const roomType = roomTypes.find((type) => String(type.MaLoaiPhong) === String(loaiPhong));
    return roomType ? roomType.TenLoaiPhong : 'Không xác định';
  };

  const getRoomTypePrice = (loaiPhong) => {
    const roomType = roomTypes.find((type) => String(type.MaLoaiPhong) === String(loaiPhong));
    return roomType ? roomType.GiaPhong : 0;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = async (maPhong) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/rooms/${maPhong}`, { headers });
      if (response.data.success && response.data.data) {
        const roomData = response.data.data;
        const room = {
          MaPhong: parseInt(roomData.maPhong, 10) || 0,
          SoPhong: roomData.soPhong || '',
          GiaPhong: parseFloat(roomData.giaPhong) || getRoomTypePrice(roomData.loaiPhong),
          TrangThai: roomData.trangThai || '',
          LoaiPhong: String(roomData.loaiPhong) || '',
          TinhTrang: roomData.tinhTrang || '',
        };
        setSelectedRoom(room);
        setShowDetailsModal(true);
        setError(null);
      } else {
        setError(response.data.message || 'Không tìm thấy thông tin phòng.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định khi lấy thông tin phòng.';
      setError(`Lỗi khi lấy thông tin phòng: ${errorMessage}`);
      console.error('Edit fetch error:', error);
    }
  };

  const handleDelete = (maPhong) => {
    const room = rooms.find((r) => r.MaPhong === maPhong);
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.delete(`${API_BASE_URL}/rooms/${roomToDelete.MaPhong}`, { headers });
      if (response.data.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        fetchRooms();
      } else {
        setError(response.data.message || 'Lỗi khi xóa phòng.');
      }
    } catch (error) {
      if (error.response && [400, 409].includes(error.response.status)) {
        setShowConstraintError(true);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định khi xóa phòng.';
        setError(`Không thể xóa phòng: ${errorMessage}`);
      }
      setShowDeleteConfirm(false);
      console.error('Delete error:', error);
    }
  };

  const handleAddRoom = () => {
    setNewRoom({
      SoPhong: '',
      TinhTrang: '',
      LoaiPhong: '',
      TrangThai: '',
    });
    setSelectedRoom(null);
    setShowDetailsModal(true);
  };

  const validateRoomData = (room) => {
    if (!room.SoPhong.trim() && !room.TinhTrang && !room.LoaiPhong && !room.TrangThai) {
      return 'Bạn chưa nhập đầy đủ thông tin, vui lòng nhập đầy đủ thông tin';
    }
    if (!room.SoPhong.trim()) return 'Số phòng không được để trống';
    if (!room.TinhTrang) return 'Tình trạng không được để trống';
    if (!room.LoaiPhong) return 'Loại phòng không được để trống';
    if (!room.TrangThai) return 'Trạng thái không được để trống';
    return null;
  };

  const handleSave = async () => {
    try {
      const roomData = selectedRoom || newRoom;
      const validationError = validateRoomData(roomData);
      if (validationError) {
        if (validationError.includes('chưa nhập đầy đủ')) {
          setShowEmptyDataError(true);
        } else {
          setError(validationError);
        }
        return;
      }

      const loaiPhong = String(roomData.LoaiPhong);
      const selectedRoomType = roomTypes.find(type => String(type.MaLoaiPhong) === loaiPhong);
      if (!selectedRoomType) {
        setError('Loại phòng không tồn tại.');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (!selectedRoom) {
        const isDuplicate = rooms.some(room => room.SoPhong.toLowerCase() === roomData.SoPhong.trim().toLowerCase());
        if (isDuplicate) {
          setShowDuplicateRoom(true);
          return;
        }
      }

      if (selectedRoom) {
        const maPhong = parseInt(selectedRoom.MaPhong, 10);
        if (isNaN(maPhong)) {
          setError('Mã phòng không hợp lệ.');
          return;
        }

        const updatePayload = {
          MaPhong: maPhong,
          SoPhong: roomData.SoPhong.trim(),
          GiaPhong: selectedRoomType.GiaPhong,
          TinhTrang: roomData.TinhTrang,
          LoaiPhong: loaiPhong,
          TrangThai: roomData.TrangThai,
        };

        console.log('Update payload:', updatePayload);

        const response = await axios.put(`${API_BASE_URL}/rooms/${maPhong}`, updatePayload, { headers });
        if (response.data.success) {
          setShowDetailsModal(false);
          setShowSaveConfirm(true);
          setSelectedRoom(null);
          fetchRooms();
          setError(null);
        } else {
          setError(response.data.message || 'Lỗi khi cập nhật phòng.');
          console.error('Update API error:', response.data);
        }
      } else {
        const createPayload = {
          SoPhong: roomData.SoPhong.trim(),
          TinhTrang: roomData.TinhTrang,
          LoaiPhong: parseInt(roomData.LoaiPhong, 10),
          TrangThai: roomData.TrangThai,
        };

        console.log('Create payload:', createPayload);

        const response = await axios.post(`${API_BASE_URL}/rooms`, createPayload, { headers });
        if (response.data.success) {
          setShowDetailsModal(false);
          setShowAddSuccess(true);
          setShowSaveConfirm(true);
          fetchRooms();
          setError(null);
        } else {
          setError(response.data.message || 'Lỗi khi thêm phòng.');
          console.error('Create API error:', response.data);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định khi lưu phòng.';
      setError(`Không thể lưu phòng: ${errorMessage}`);
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    setShowDetailsModal(false);
    setSelectedRoom(null);
    setNewRoom({
      SoPhong: '',
      TinhTrang: '',
      LoaiPhong: '',
      TrangThai: '',
    });
    setError(null);
  };

  const handleInputChange = (field, value) => {
    const updatedValue = value;
    if (selectedRoom) {
      setSelectedRoom(prev => ({
        ...prev,
        [field]: updatedValue,
      }));
    } else {
      setNewRoom(prev => ({
        ...prev,
        [field]: updatedValue,
      }));
    }
  };

  return (
    <div className="rm-main-container">
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
          <div className="top-title">Quản Lý Phòng</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>
          ⋮
        </div>
      </div>

      <div className="rm-content-wrapper">
        <div className="rm-search-add-section">
          <div className="rm-search-box">
            <span className="rm-search-icon">
              <img src="/icon_LTW/TimKiem.png" alt="Search" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo số phòng"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="rm-add-room-btn" onClick={handleAddRoom}>
            Thêm phòng
          </button>
        </div>

        {error && (
          <div style={{ color: 'red', textAlign: 'center', margin: '10px' }}>
            {error}
          </div>
        )}

        <div className="rm-table-container">
          <table className="rm-room-table">
            <thead>
              <tr>
                <th>Số phòng</th>
                <th>Tình trạng</th>
                <th>Loại phòng</th>
                <th>Trạng thái</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.length === 0 && !error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    Không có dữ liệu để hiển thị.
                  </td>
                </tr>
              ) : (
                paginatedRooms.map((room) => (
                  <tr key={room.MaPhong}>
                    <td>{room.SoPhong}</td>
                    <td>{room.TinhTrang}</td>
                    <td>{getRoomTypeName(room.LoaiPhong)}</td>
                    <td>{room.TrangThai}</td>
                    <td>
                      <button className="rm-edit-btn profes" onClick={() => handleEdit(room.MaPhong)}>
                        <span className="rm-edit-icon">
                          <img src="/icon_LTW/Edit.png" alt="Edit" />
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="rm-delete-btn" onClick={() => handleDelete(room.MaPhong)}>
                        <span className="rm-delete-icon">
                          <img src="/icon_LTW/Xoa.png" alt="Delete" />
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
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

      {showDetailsModal && (
        <div className="cm-modal-overlay">
          <div className={selectedRoom ? 'rm-edit-modal-wrapper' : 'rm-add-modal-wrapper'}>
            <h2 className="cm-modal-title">{selectedRoom ? `Sửa phòng ${selectedRoom.SoPhong}` : 'Thêm phòng'}</h2>
            <div className="cm-modal-content">
              <div className="cm-form-container">
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLP_SoPhong.png" alt="Room Number" />
                  </span>
                  <input
                    type="text"
                    placeholder="Số phòng"
                    value={selectedRoom ? selectedRoom.SoPhong : newRoom.SoPhong}
                    onChange={(e) => handleInputChange('SoPhong', e.target.value)}
                    className="cm-input-field"
                  />
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLP_SuaPhong.png" alt="Status" />
                  </span>
                  <select
                    value={selectedRoom ? selectedRoom.TinhTrang : newRoom.TinhTrang}
                    onChange={(e) => handleInputChange('TinhTrang', e.target.value)}
                    className="cm-select-field"
                  >
                    <option value="" disabled>Tình trạng</option>
                    <option value="Đã dọn dẹp">Đã dọn dẹp</option>
                    <option value="Chưa dọn dẹp">Chưa dọn dẹp</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                  </select>
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLP_SuaPhong2.png" alt="Room Type" />
                  </span>
                  <select
                    value={selectedRoom ? selectedRoom.LoaiPhong : newRoom.LoaiPhong}
                    onChange={(e) => handleInputChange('LoaiPhong', e.target.value)}
                    className="cm-select-field"
                  >
                    <option value="" disabled>Loại phòng</option>
                    {roomTypes.map((type) => (
                      <option key={type.MaLoaiPhong} value={String(type.MaLoaiPhong)}>
                        {type.TenLoaiPhong} - {type.GiaPhong.toLocaleString('vi-VN')} VND
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cm-form-field">
                  <span className="cm-field-icon">
                    <img src="/icon_LTW/QLP_SuaPhong.png" alt="State" />
                  </span>
                  <select
                    value={selectedRoom ? selectedRoom.TrangThai : newRoom.TrangThai}
                    onChange={(e) => handleInputChange('TrangThai', e.target.value)}
                    className="cm-select-field"
                  >
                    <option value="" disabled>Trạng thái</option>
                    <option value="Trống">Trống</option>
                    <option value="Đã đặt">Đã đặt</option>
                    <option value="Đang thuê">Đang thuê</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className={selectedRoom ? 'rm-save-edit-btn' : 'rm-save-add-btn'} onClick={handleSave}>
                Lưu
              </button>
              <button className="cm-cancel-btn" onClick={handleCancel}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowSaveConfirm(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            {showAddSuccess ? (
              <p className="logout-message">Thêm phòng thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin phòng thành công!</p>
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

      {showDuplicateRoom && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDuplicateRoom(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Số phòng đã tồn tại!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDuplicateRoom(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showConstraintError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowConstraintError(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Phòng đang được sử dụng, không thể xóa!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowConstraintError(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmptyDataError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowEmptyDataError(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn chưa nhập đầy đủ thông tin, vui lòng nhập đầy đủ thông tin!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowEmptyDataError(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && roomToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa phòng {roomToDelete.SoPhong}?</p>
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
            <span className="close-icon" onClick={() => setShowDeleteSuccess(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="Close" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Xóa phòng thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowDeleteSuccess(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;