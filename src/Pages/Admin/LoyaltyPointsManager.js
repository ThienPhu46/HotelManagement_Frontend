import React, { useState, useEffect, useCallback } from 'react';
import '../../Design_Css/Admin/LoyaltyPointsManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const PointProgramManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [newProgram, setNewProgram] = useState({
    tenCT: '',
    diemToiThieu: '',
    mucGiamGia: '',
    tyLeTichDiem: ''
  });
  const [pointPrograms, setPointPrograms] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDuplicateError, setShowDuplicateError] = useState(false);

  const API_BASE_URL = 'https://localhost:7087';

  const fetchPointPrograms = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/point-programs?searchTerm=${searchTerm}&sortBy=MaCT&sortOrder=ASC`
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
        const programData = result.data || [];
        console.log('Point Program Data:', programData);
        if (!Array.isArray(programData)) {
          throw new Error('Dữ liệu chương trình điểm không phải là mảng');
        }
        const validatedData = programData.map((program, index) => ({
          maCT: program.maCT || `TEMP_${index}`,
          tenCT: program.tenCT || 'N/A',
          diemToiThieu: program.diemToiThieu !== undefined ? program.diemToiThieu : 0,
          mucGiamGia: program.mucGiamGia !== undefined ? `${program.mucGiamGia}%` : '0%',
          tyLeTichDiem: program.tyLeTichDiem !== undefined ? `${program.tyLeTichDiem}%` : '0%'
        }));
        setPointPrograms(validatedData);
        setErrorMessage('');
      } else {
        throw new Error(result.message || 'Không thể tải danh sách chương trình điểm');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message);
      setPointPrograms([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPointPrograms();
  }, [fetchPointPrograms]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (program) => {
    // Lấy giá trị từ table (đã có %) và loại bỏ % để đưa vào input
    setSelectedProgram({
      maCT: program.maCT,
      tenCT: program.tenCT,
      diemToiThieu: program.diemToiThieu,
      mucGiamGia: program.mucGiamGia.replace('%', ''),
      tyLeTichDiem: program.tyLeTichDiem.replace('%', '') // Đảm bảo giữ nguyên giá trị thập phân
    });
    setShowDetailsModal(true);
  };

  const handleDelete = (program) => {
    setProgramToDelete(program);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/point-programs/${programToDelete.maCT}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        setShowDeleteConfirm(false);
        setShowDeleteError(true);
        throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        fetchPointPrograms();
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

  const validateProgramData = (programData) => {
    if (!programData.tenCT.trim()) return 'Vui lòng nhập tên chương trình.';
    if (!programData.diemToiThieu) return 'Vui lòng nhập điểm tối thiểu.';
    if (!programData.mucGiamGia) return 'Vui lòng nhập mức giảm giá.';
    if (!programData.tyLeTichDiem) return 'Vui lòng nhập tỷ lệ tích điểm.';
    return null;
  };

  const handleSave = async () => {
    const programData = selectedProgram || newProgram;
    const validationError = validateProgramData(programData);
    if (validationError) {
      setShowInputError(true);
      return;
    }

    try {
      if (!selectedProgram) {
        const isDuplicate = pointPrograms.some(
          (program) => program.tenCT.toLowerCase() === newProgram.tenCT.toLowerCase()
        );
        if (isDuplicate) {
          setShowDuplicateError(true);
          return;
        }
      }

      if (selectedProgram) {
        const response = await fetch(`${API_BASE_URL}/api/point-programs/${selectedProgram.maCT}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maCT: selectedProgram.maCT,
            tenCT: selectedProgram.tenCT,
            diemToiThieu: parseInt(selectedProgram.diemToiThieu),
            mucGiamGia: parseFloat(selectedProgram.mucGiamGia),
            tyLeTichDiem: parseFloat(selectedProgram.tyLeTichDiem) // Đảm bảo gửi đúng giá trị nhập
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText}`);
        }
        const result = await response.json();
        console.log('PUT Response:', result); // Log để kiểm tra dữ liệu trả về
        if (result.success) {
          setShowDetailsModal(false);
          setShowSaveConfirm(true);
          fetchPointPrograms(); // Lấy lại dữ liệu để cập nhật bảng
        } else {
          throw new Error(result.message || 'Cập nhật chương trình điểm thất bại');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/point-programs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenCT: newProgram.tenCT,
            diemToiThieu: parseInt(newProgram.diemToiThieu),
            mucGiamGia: parseFloat(newProgram.mucGiamGia),
            tyLeTichDiem: parseFloat(newProgram.tyLeTichDiem)
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}. Chi tiết: ${errorText}`);
        }
        const result = await response.json();
        console.log('POST Response:', result);
        if (result.success) {
          setShowDetailsModal(false);
          setShowSaveConfirm(true);
          setShowAddSuccess(true);
          fetchPointPrograms();
        } else {
          throw new Error(result.message || 'Thêm chương trình điểm thất bại');
        }
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErrorMessage(error.message || 'Đã xảy ra lỗi khi lưu chương trình điểm');
    }
  };

  const handleCancel = () => {
    setShowDetailsModal(false);
    setSelectedProgram(null);
    setNewProgram({
      tenCT: '',
      diemToiThieu: '',
      mucGiamGia: '',
      tyLeTichDiem: ''
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
    <div className="pp-main-container">
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
          <div className="top-title">Quản Lý Chương Trình Tích Điểm</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="pp-content-wrapper">
        {errorMessage && (
          <div className="pp-error-message">
            {errorMessage}
          </div>
        )}
        <div className="pp-search-add-section">
          <div className="pp-search-box">
            <span className="pp-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo tên chương trình"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="pp-add-action">
            <button
              className="pp-add-program-btn"
              onClick={() => {
                setNewProgram({
                  tenCT: '',
                  diemToiThieu: '',
                  mucGiamGia: '',
                  tyLeTichDiem: ''
                });
                setSelectedProgram(null);
                setShowDetailsModal(true);
                setErrorMessage('');
              }}
            >
              Thêm chương trình
            </button>
          </div>
        </div>

        <div className="pp-table-container">
          <table className="pp-program-table">
            <thead>
              <tr>
                <th>Mã chương trình</th>
                <th>Tên chương trình</th>
                <th>Điểm tối thiểu</th>
                <th>Mức giảm giá</th>
                <th>Tỷ lệ tích điểm</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {pointPrograms.length > 0 ? (
                pointPrograms.map((program) => (
                  <tr key={program.maCT}>
                    <td>{program.maCT}</td>
                    <td>{program.tenCT}</td>
                    <td>{program.diemToiThieu}</td>
                    <td>{program.mucGiamGia}</td>
                    <td>{program.tyLeTichDiem}</td>
                    <td>
                      <div className="pp-edit-action">
                        <button className="pp-edit-btn" onClick={() => handleEdit(program)}>
                          <span className="pp-edit-icon"><img src="/icon_LTW/Edit.png" alt="#" /></span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="pp-delete-action">
                        <button className="pp-delete-btn" onClick={() => handleDelete(program)}>
                          <span className="pp-delete-icon"><img src="/icon_LTW/Xoa.png" alt="#" /></span>
                        </button>
                      </div>
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

      {showDetailsModal && (
        <div className="pp-modal-overlay">
          <div className="pp-modal-wrapper">
            <h2 className="pp-modal-title">
              {selectedProgram ? `Sửa chương trình ${selectedProgram.maCT}` : 'Thêm chương trình'}
            </h2>
            <div className="pp-modal-content">
              <div className="pp-form-container">
                <div className="pp-form-field">
                  <span className="pp-field-icon"><img src="/icon_LTW/RiDiscountPercentFill.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Tên chương trình"
                    value={selectedProgram ? selectedProgram.tenCT : newProgram.tenCT}
                    onChange={(e) => {
                      if (selectedProgram) {
                        setSelectedProgram({ ...selectedProgram, tenCT: e.target.value });
                      } else {
                        setNewProgram({ ...newProgram, tenCT: e.target.value });
                      }
                    }}
                    className="pp-input-field"
                  />
                </div>
                <div className="pp-form-field">
                  <span className="pp-field-icon"><img src="/icon_LTW/QLTĐ_Them2.png" alt="#" /></span>
                  <input
                    type="number"
                    placeholder="Điểm tối thiểu"
                    value={selectedProgram ? selectedProgram.diemToiThieu : newProgram.diemToiThieu}
                    onChange={(e) => {
                      if (selectedProgram) {
                        setSelectedProgram({ ...selectedProgram, diemToiThieu: e.target.value });
                      } else {
                        setNewProgram({ ...newProgram, diemToiThieu: e.target.value });
                      }
                    }}
                    className="pp-input-field"
                  />
                </div>
                <div className="pp-form-field">
                  <span className="pp-field-icon"><img src="/icon_LTW/QLTĐ_Them3.png" alt="#" /></span>
                  <input
                    type="number"
                    placeholder="Mức giảm giá (ví dụ: 60)"
                    value={selectedProgram ? parseFloat(selectedProgram.mucGiamGia) : parseFloat(newProgram.mucGiamGia)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (selectedProgram) {
                        setSelectedProgram({ ...selectedProgram, mucGiamGia: value });
                      } else {
                        setNewProgram({ ...newProgram, mucGiamGia: value });
                      }
                    }}
                    className="pp-input-field"
                  />
                </div>
                <div className="pp-form-field">
                  <span className="pp-field-icon"><img src="/icon_LTW/QLTĐ_Them3.png" alt="#" /></span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Tỷ lệ tích điểm (ví dụ: 0.03)"
                    value={selectedProgram ? parseFloat(selectedProgram.tyLeTichDiem) || '' : parseFloat(newProgram.tyLeTichDiem) || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (selectedProgram) {
                        setSelectedProgram({ ...selectedProgram, tyLeTichDiem: value });
                      } else {
                        setNewProgram({ ...newProgram, tyLeTichDiem: value });
                      }
                    }}
                    className="pp-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="pp-modal-actions">
              <button className="pp-save-btn" onClick={handleSave}>Lưu</button>
              <button className="pp-cancel-btn" onClick={handleCancel}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowSaveConfirm(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            {showAddSuccess ? (
              <p className="logout-message">Thêm chương trình thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin chương trình thành công!</p>
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

      {showDeleteConfirm && programToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa {programToDelete.tenCT}?</p>
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
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
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
            <span className="close-icon" onClick={() => setShowDeleteError(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Chương trình này đang được sử dụng.</p>
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
            <span className="close-icon" onClick={() => setShowInputError(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
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
            <span className="close-icon" onClick={() => setShowDuplicateError(false)}>
              <img src="/icon_LTW/FontistoClose.png" alt="#" />
            </span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Tên chương trình đã tồn tại. Vui lòng chọn tên khác!</p>
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

export default PointProgramManagement;