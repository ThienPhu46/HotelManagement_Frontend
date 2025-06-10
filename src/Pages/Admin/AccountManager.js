import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './../../../src/Design_Css/Admin/AccountManager.css';
import Sidebar from '../../Components/Admin/Components_Js/Sliderbar';
import LogoutModal from '../../Components/Admin/Components_Js/LogoutModal';

const AccountManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    tenTaiKhoan: '',
    matKhau: '',
    tenHienThi: '',
    email: '',
    phone: '',
    maVaiTro: ''
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showInputError, setShowInputError] = useState(false);  const [showDuplicateError, setShowDuplicateError] = useState(false); // New state for duplicate error modal
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  
  // States for password change functionality
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChangeSuccess, setShowPasswordChangeSuccess] = useState(false);  const [showPasswordChangeError, setShowPasswordChangeError] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  
  // States for account activation functionality
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showActivateSuccess, setShowActivateSuccess] = useState(false);
  const [showActivateError, setShowActivateError] = useState(false);
  const [activateErrorMessage, setActivateErrorMessage] = useState('');
// Thêm state tổng số trang cho phân trang backend
  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/accounts`;
  const togglePasswordVisibility = (field) => {
    setShowPasswordFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Sắp xếp theo mã tài khoản giảm dần (lớn nhất đầu tiên)
const fetchAccounts = useCallback(async () => {
  try {
    console.log('Đang gọi API lấy danh sách tài khoản với params:', { currentPage, pageSize, searchTerm });
    const response = await axios.get(API_BASE_URL, {
      params: {
        pageNumber: currentPage,
        pageSize,
        searchTerm: searchTerm || null,
        sortBy: 'MaTaiKhoan',
        sortOrder: 'DESC' // Sắp xếp giảm dần
      }
    });
    console.log('Phản hồi từ API:', response.data);

    if (response.data.success) {
      setAccounts(response.data.data || []);
      setErrorMessage('');
      // Nếu backend trả về tổng số trang, lưu lại để hiển thị
      if (typeof response.data.totalPages === 'number' && response.data.totalPages > 0) {
        setTotalPages(response.data.totalPages);
      } else if (typeof response.data.totalCount === 'number') {
        // Nếu backend chỉ trả về tổng số bản ghi, tự tính số trang
        setTotalPages(Math.ceil(response.data.totalCount / pageSize));
      } else {
        // Fallback: tự tính nếu có thể
        setTotalPages(1);
      }
    } else {
      setErrorMessage(`Lỗi từ backend: ${response.data.message}`);
      setAccounts([]);
    }
  } catch (error) {
    console.error('Lỗi chi tiết khi gọi API:', error);
    if (error.response) {
      setErrorMessage(`Lỗi từ server: ${error.response.status} - ${error.response.data.message || error.message}`);
      if (error.response.status === 400) {
        setErrorMessage('Yêu cầu không hợp lệ. Kiểm tra tham số hoặc cấu hình backend.');
      }
    } else if (error.request) {
      setErrorMessage('Không thể kết nối đến server. Vui lòng kiểm tra backend hoặc CORS.');
    } else {
      setErrorMessage(`Lỗi: ${error.message}`);
    }
    setAccounts([]);
  }
}, [currentPage, pageSize, searchTerm]);

  const checkDuplicateAccount = async (username, email) => {
    try {
      const [usernameResponse, emailResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/validate/username/${encodeURIComponent(username)}`),
        axios.get(`${API_BASE_URL}/validate/email/${encodeURIComponent(email)}`)
      ]);

      const errors = [];
      if (usernameResponse.data.success && usernameResponse.data.data) {
        errors.push('Tên tài khoản đã tồn tại');
      }
      if (emailResponse.data.success && emailResponse.data.data) {
        errors.push('Email đã tồn tại');
      }
      

      if (errors.length > 0) {
        return { isDuplicate: true, message: errors.join(' và ') };
      }
      return { isDuplicate: false, message: '' };
    } catch (error) {
      console.error('Lỗi khi kiểm tra trùng lặp:', error);
      return { isDuplicate: true, message: 'Lỗi khi kiểm tra trùng lặp. Vui lòng thử lại.' };
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleConfirmLogout = () => {
    console.log("Người dùng đã đăng xuất");
    setShowLogoutConfirm(false);
    window.location.href = '/';
  };
  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const validateAccountData = (accountData) => {
    if (!accountData.tenTaiKhoan.trim()) return 'Vui lòng nhập tên tài khoản.';
    if (!accountData.matKhau.trim()) return 'Vui lòng nhập mật khẩu.';
    if (!accountData.tenHienThi.trim()) return 'Vui lòng nhập tên hiển thị.';
    if (!accountData.email.trim()) return 'Vui lòng nhập email.';
    if (!accountData.phone.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!accountData.maVaiTro) return 'Vui lòng chọn vai trò.';
    return null;
  };

  const handleAddAccount = async () => {
    const validationError = validateAccountData(newAccount);
    if (validationError) {
      setShowInputError(true);
      return;
    }

    const { isDuplicate, message } = await checkDuplicateAccount(newAccount.tenTaiKhoan, newAccount.email);
    if (isDuplicate) {
      setErrorMessage(message);
      setShowDuplicateError(true); // Show duplicate error modal
      return;
    }

    try {
      const response = await axios.post(API_BASE_URL, newAccount);
      if (response.data.success) {
        setShowAddSuccess(true);
        setShowSaveConfirm(true);
        setShowDetailsModal(false);
        setNewAccount({
          tenTaiKhoan: '',
          matKhau: '',
          tenHienThi: '',
          email: '',
          phone: '',
          maVaiTro: ''
        });
        fetchAccounts();
      } else {
        setErrorMessage(`Lỗi khi thêm tài khoản: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API thêm tài khoản:', error);
      setErrorMessage('Có lỗi xảy ra khi thêm tài khoản');
    }
  };

  const handleUpdateAccount = async () => {
    const validationError = validateAccountData(selectedAccount);
    if (validationError) {
      setShowInputError(true);
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/${selectedAccount.maTaiKhoan}`, selectedAccount);
      if (response.data.success) {
        setShowSaveConfirm(true);
        setShowDetailsModal(false);
        fetchAccounts();
      } else {
        setErrorMessage(`Lỗi khi sửa tài khoản: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API sửa tài khoản:', error);
      setErrorMessage('Có lỗi xảy ra khi sửa tài khoản');
    }
  };
  const handleDeleteAccount = async () => {
    try {
      console.log('Đang xóa tài khoản với mã:', accountToDelete.maTaiKhoan);
      const response = await axios.delete(`${API_BASE_URL}/${accountToDelete.maTaiKhoan}`);
      console.log('Phản hồi từ API xóa:', response.data);

      if (response.data.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        fetchAccounts();
      } else {
        setShowDeleteConfirm(false);
        setShowDeleteError(true);
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi xóa tài khoản:', error);
      setShowDeleteConfirm(false);
      setShowDeleteError(true);
    }
  };
  const handleChangePassword = async () => {
    // Validate input
    if (!changePasswordData.oldPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      setPasswordChangeError('Vui lòng nhập đầy đủ thông tin');
      setShowPasswordChangeError(true);
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setPasswordChangeError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setShowPasswordChangeError(true);
      return;
    }

    // Validate new password strength
    if (changePasswordData.newPassword.length < 6) {
      setPasswordChangeError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setShowPasswordChangeError(true);
      return;
    }

    if (changePasswordData.oldPassword === changePasswordData.newPassword) {
      setPasswordChangeError('Mật khẩu mới phải khác mật khẩu cũ');
      setShowPasswordChangeError(true);
      return;
    }    // Get current user information from localStorage - moved outside try block for proper scope
    const token = localStorage.getItem('token');
    const currentUsername = localStorage.getItem('username');
    
    if (!token) {
      setPasswordChangeError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setShowPasswordChangeError(true);
      return;
    }

    if (!currentUsername) {
      setPasswordChangeError('Không thể xác định người dùng hiện tại. Vui lòng đăng nhập lại.');
      setShowPasswordChangeError(true);
      return;
    }

    // Find the current user by username
    let currentUser = null;
    
    if (accounts.length > 0) {
      currentUser = accounts.find(acc => acc.tenTaiKhoan === currentUsername);
    }
    
    if (!currentUser) {
      // Fallback: try to get accounts first
      await fetchAccounts();
      if (accounts.length > 0) {
        currentUser = accounts.find(acc => acc.tenTaiKhoan === currentUsername);
      }
    }
    
    if (!currentUser) {
      setPasswordChangeError(`Không tìm thấy thông tin tài khoản "${currentUsername}". Vui lòng đăng nhập lại.`);
      setShowPasswordChangeError(true);
      return;    }
    
    try {
      console.log('🔐 Password change debug info:');
      console.log('- Current user:', currentUser.tenTaiKhoan);
      console.log('- Account ID:', currentUser.maTaiKhoan);
      console.log('- Old password (first 10 chars):', changePasswordData.oldPassword.substring(0, 10) + '...');
      console.log('- New password (first 10 chars):', changePasswordData.newPassword.substring(0, 10) + '...');
      
      // Use the correct API endpoint with plain text passwords
      const passwordChangeData = {
        maTaiKhoan: currentUser.maTaiKhoan,
        CurrentPassword: changePasswordData.oldPassword, // Plain text old password
        NewPassword: changePasswordData.newPassword      // Plain text new password
      };

      console.log('📤 Sending password change request to:', `${API_BASE_URL}/change-password`);
      const response = await axios.post(`${API_BASE_URL}/change-password`, passwordChangeData);

      if (response.data.success) {
        console.log('✅ Password change successful:', response.data.message);
        setShowChangePasswordModal(false);
        setShowPasswordChangeSuccess(true);
        setChangePasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Refresh accounts list to show updated data
        fetchAccounts();
      } else {
        console.log('❌ Backend returned error:', response.data.message);
        setPasswordChangeError(response.data.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        setShowPasswordChangeError(true);
      }
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      
      // Handle specific error messages from the API
      let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Handle validation errors
          const errorKeys = Object.keys(error.response.data.errors);
          if (errorKeys.length > 0) {
            errorMessage = error.response.data.errors[errorKeys[0]][0];
          }
        }
      } else if (error.response && error.response.status === 404) {
        console.log('❌ User not found error');
        errorMessage = 'Không tìm thấy người dùng. Vui lòng đăng nhập lại.';
      } else if (error.message) {
        console.log('❌ Network or other error:', error.message);
        errorMessage = 'Có lỗi kết nối xảy ra. Vui lòng thử lại.';
      }
      
      console.log('❌ Password change failed:', errorMessage);
      setPasswordChangeError(errorMessage);      setShowPasswordChangeError(true);
    }
  };
  const handleActivateAccount = async () => {
    if (!selectedAccount) {
      setActivateErrorMessage('Không có tài khoản được chọn');
      setShowActivateError(true);
      return;
    }

    if (!selectedAccount.email) {
      setActivateErrorMessage('Không tìm thấy email của tài khoản');
      setShowActivateError(true);
      return;
    }

    try {
      console.log('Đang kích hoạt tài khoản với email:', selectedAccount.email);
      const response = await axios.post(`${API_BASE_URL}/activate`, {
        email: selectedAccount.email
      });

      if (response.data.success) {
        setShowActivateConfirm(false);
        setShowActivateSuccess(true);
        setShowDetailsModal(false);
        fetchAccounts(); // Refresh the accounts list
      } else {
        setActivateErrorMessage(response.data.message || 'Có lỗi xảy ra khi kích hoạt tài khoản');
        setShowActivateConfirm(false);
        setShowActivateError(true);
      }
    } catch (error) {
      console.error('Lỗi khi kích hoạt tài khoản:', error);
      let errorMessage = 'Có lỗi xảy ra khi kích hoạt tài khoản';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setActivateErrorMessage(errorMessage);
      setShowActivateConfirm(false);
      setShowActivateError(true);
    }
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="am-main-container">
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
          <div className="top-title">Quản Lý Tài Khoản</div>
        </div>
        <div className="more-icon" onClick={() => console.log('Mở tùy chọn bổ sung')}>⋮</div>
      </div>

      <div className="am-content-wrapper">        <div className="am-search-add-section">
          <div className="am-search-box">
            <span className="am-search-icon"><img src="/icon_LTW/TimKiem.png" alt="#" /></span>
            <input
              type="text"
              placeholder="Tìm theo tên đăng nhập"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="am-add-action">
            <button className="am-change-password-btn" onClick={() => {
              setChangePasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setShowChangePasswordModal(true);
              setPasswordChangeError('');
            }}>
              Đổi mật khẩu
            </button>            <button className="am-add-account-btn" onClick={() => {
              setNewAccount({
                tenTaiKhoan: '',
                matKhau: '',
                tenHienThi: '',
                email: '',
                phone: '',
                maVaiTro: ''
              });
              setSelectedAccount(null);
              setShowDetailsModal(true);
              setErrorMessage('');
            }}>
              Thêm tài khoản
            </button>
          </div>
        </div>

        <div className="am-table-container">
          <table className="am-account-table">
            <thead>
              <tr>
                <th>Mã tài khoản</th>
                <th>Tên đăng nhập</th>
                <th>Tên hiển thị</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Sửa</th>
                <th>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <tr key={account.maTaiKhoan}>
                    <td>{account.maTaiKhoan}</td>
                    <td>{account.tenTaiKhoan}</td>
                    <td>{account.tenHienThi}</td>
                    <td>{account.email}</td>
                    <td>{account.phone}</td>
                    <td>{account.tenVaiTro}</td>
                    <td>
                      <div className="am-edit-action">                        <button className="am-edit-btn" onClick={() => {
                          setSelectedAccount(account);
                          setShowDetailsModal(true);
                          setErrorMessage('');
                        }}>
                          <span className="am-edit-icon"><img src="/icon_LTW/Edit.png" alt="#" /></span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="am-delete-action">
                        <button
                          className="am-delete-btn"
                          onClick={() => {
                            setAccountToDelete(account);
                            setShowDeleteConfirm(true);
                            setErrorMessage('');
                          }}
                        >
                          <span className="am-delete-icon"><img src="/icon_LTW/Xoa.png" alt="#" /></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    {errorMessage || 'Không có dữ liệu tài khoản.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls giống PointHistoryManager */}
        <div className="am-pagination-container pagination-container">
  <button
    className="am-pagination-btn pagination-btn"
    onClick={handlePrevPage}
    disabled={currentPage === 1}
  >
    Trang trước
  </button>
  <span className="am-pagination-info pagination-info">
    Trang {currentPage} / {totalPages || 1}
  </span>
  <button
    className="am-pagination-btn pagination-btn"
    onClick={handleNextPage}
    disabled={currentPage === totalPages || totalPages === 0}
  >
    Trang sau
  </button>
</div>
      </div>

      {showDetailsModal && (
        <div className="am-modal-overlay">
          <div className="am-modal-wrapper">
            <h2 className="am-modal-title">{selectedAccount ? `Sửa tài khoản ${selectedAccount.maTaiKhoan}` : 'Thêm tài khoản'}</h2>
            <div className="am-modal-content">
              <div className="am-form-container">                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/QLTKKH_Ten.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={selectedAccount ? selectedAccount.tenTaiKhoan : newAccount.tenTaiKhoan}
                    onChange={(e) => {
                      if (selectedAccount) {
                        setSelectedAccount({ ...selectedAccount, tenTaiKhoan: e.target.value });
                      } else {
                        setNewAccount({ ...newAccount, tenTaiKhoan: e.target.value });
                      }
                    }}
                    className="am-input-field"
                  />                </div>
                {!selectedAccount && (
                  <div className="am-form-field">
                    <span className="am-field-icon"><img src="/icon_LTW/GridiconsLock (1).png" alt="#" /></span>
                    <div style={{ position: 'relative', width: '250px' }}>
                      <input
                        type={showPasswordFields.newPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        value={newAccount.matKhau}
                        onChange={(e) => setNewAccount({ ...newAccount, matKhau: e.target.value })}
                        className="am-input-field"
                      />
                      <button
                        type="button"
                        className="am-toggle-password"
                        onClick={() => togglePasswordVisibility('newPassword')}
                      >
                        <img
                          src={showPasswordFields.newPassword ? '/icon_LTW/MdiEye (1).png' : '/icon_LTW/MdiEyeOff (1).png'}
                          alt="Toggle Password Visibility"
                          style={{ width: '20px', height: '20px' }}
                        />
                      </button>
                    </div>
                  </div>
                )}
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/ClarityEmployeeSolid.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Tên hiển thị"
                    value={selectedAccount ? selectedAccount.tenHienThi : newAccount.tenHienThi}
                    onChange={(e) => {
                      if (selectedAccount) {
                        setSelectedAccount({ ...selectedAccount, tenHienThi: e.target.value });
                      } else {
                        setNewAccount({ ...newAccount, tenHienThi: e.target.value });
                      }
                    }}
                    className="am-input-field"
                  />
                </div>
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/Email.png" alt="#" /></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={selectedAccount ? selectedAccount.email : newAccount.email}
                    onChange={(e) => {
                      if (selectedAccount) {
                        setSelectedAccount({ ...selectedAccount, email: e.target.value });
                      } else {
                        setNewAccount({ ...newAccount, email: e.target.value });
                      }
                    }}
                    className="am-input-field"
                  />
                </div>
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/ĐP_SĐT.png" alt="#" /></span>
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={selectedAccount ? selectedAccount.phone : newAccount.phone}
                    onChange={(e) => {
                      if (selectedAccount) {
                        setSelectedAccount({ ...selectedAccount, phone: e.target.value });
                      } else {
                        setNewAccount({ ...newAccount, phone: e.target.value });
                      }
                    }}
                    className="am-input-field"
                  />
                </div>
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/EosIconsRoleBinding.png" alt="#" /></span>
                  <select
                    value={selectedAccount ? selectedAccount.maVaiTro : newAccount.maVaiTro}
                    onChange={(e) => {
                      if (selectedAccount) {
                        setSelectedAccount({ ...selectedAccount, maVaiTro: e.target.value });
                      } else {
                        setNewAccount({ ...newAccount, maVaiTro: e.target.value });
                      }
                    }}
                    className="am-input-field"
                  >
                    <option value="">Chọn vai trò</option>
                    <option value="1">Admin</option>
                    <option value="2">Staff</option>
                  </select>
                </div>
              </div>
            </div>            <div className="am-modal-actions">
              <button className="am-save-btn" onClick={() => {
                if (selectedAccount) {
                  handleUpdateAccount();
                } else {
                  handleAddAccount();
                }
              }}>Lưu</button>              {selectedAccount && (
                <button 
                  className="am-activate-btn" 
                  onClick={() => setShowActivateConfirm(true)}
                >
                  Kích hoạt
                </button>
              )}
              <button className="am-cancel-btn" onClick={() => {
                setShowDetailsModal(false);
                setSelectedAccount(null);
                setNewAccount({
                  tenTaiKhoan: '',
                  matKhau: '',
                  tenHienThi: '',
                  email: '',                phone: '',
                  maVaiTro: ''
                });
                setErrorMessage('');
              }}>Hủy bỏ</button>
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
              <p className="logout-message">Thêm tài khoản thành công!</p>
            ) : (
              <p className="logout-message">Sửa thông tin tài khoản thành công!</p>
            )}
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => {
                setShowSaveConfirm(false);
                setShowAddSuccess(false);
                setErrorMessage('');
              }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && accountToDelete && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowDeleteConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có thực sự muốn xóa tài khoản {accountToDelete.tenTaiKhoan}?</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleDeleteAccount}>
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
            <span className="close-icon" onClick={() => setShowDeleteSuccess(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
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
            <span className="close-icon" onClick={() => setShowDeleteError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Tài khoản này đang được sử dụng.</p>
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
            <span className="close-icon" onClick={() => setShowInputError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
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
      )}      {showDuplicateError && (
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
      )}      {showChangePasswordModal && (
        <div className="am-modal-overlay">
          <div className="am-modal-wrapper">
            <h2 className="am-modal-title">Đổi mật khẩu</h2>
            <div className="am-modal-content">
              <div className="am-form-container">
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/GridiconsLock (1).png" alt="#" /></span>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <input
                      type={showPasswordFields.oldPassword ? 'text' : 'password'}
                      placeholder="Mật khẩu cũ"
                      value={changePasswordData.oldPassword}
                      onChange={(e) => setChangePasswordData({ ...changePasswordData, oldPassword: e.target.value })}
                      className="am-input-field"
                    />
                    <button
                      type="button"
                      className="am-toggle-password"
                      onClick={() => togglePasswordVisibility('oldPassword')}
                    >
                      <img
                        src={showPasswordFields.oldPassword ? '/icon_LTW/MdiEye (1).png' : '/icon_LTW/MdiEyeOff (1).png'}
                        alt="Toggle Password Visibility"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </div>
                </div>
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/GridiconsLock (1).png" alt="#" /></span>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <input
                      type={showPasswordFields.newPassword ? 'text' : 'password'}
                      placeholder="Mật khẩu mới"
                      value={changePasswordData.newPassword}
                      onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                      className="am-input-field"
                    />
                    <button
                      type="button"
                      className="am-toggle-password"
                      onClick={() => togglePasswordVisibility('newPassword')}
                    >
                      <img
                        src={showPasswordFields.newPassword ? '/icon_LTW/MdiEye (1).png' : '/icon_LTW/MdiEyeOff (1).png'}
                        alt="Toggle Password Visibility"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </div>
                </div>
                <div className="am-form-field">
                  <span className="am-field-icon"><img src="/icon_LTW/GridiconsLock (1).png" alt="#" /></span>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <input
                      type={showPasswordFields.confirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={changePasswordData.confirmPassword}
                      onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                      className="am-input-field"
                    />
                    <button
                      type="button"
                      className="am-toggle-password"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                    >
                      <img
                        src={showPasswordFields.confirmPassword ? '/icon_LTW/MdiEye (1).png' : '/icon_LTW/MdiEyeOff (1).png'}
                        alt="Toggle Password Visibility"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </button>
                  </div>
                  {changePasswordData.confirmPassword && changePasswordData.newPassword !== changePasswordData.confirmPassword && (
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#dc3545' }}>
                      Mật khẩu không khớp
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="am-modal-actions">
              <button className="am-save-btn" onClick={handleChangePassword}>Đổi mật khẩu</button>
              <button className="am-cancel-btn" onClick={() => {
                setShowChangePasswordModal(false);
                setChangePasswordData({
                  oldPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                setPasswordChangeError('');
                setShowPasswordFields({
                  oldPassword: false,
                  newPassword: false,
                  confirmPassword: false
                });
              }}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordChangeSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowPasswordChangeSuccess(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Đổi mật khẩu thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowPasswordChangeSuccess(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordChangeError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowPasswordChangeError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{passwordChangeError}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => {
                setShowPasswordChangeError(false);
                setPasswordChangeError('');
              }}>
                OK
              </button>
            </div>
          </div>
        </div>      )}

      {showActivateConfirm && selectedAccount && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowActivateConfirm(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Bạn có muốn kích hoạt tài khoản với email {selectedAccount.email}?</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={handleActivateAccount}>
                YES
              </button>
              <button className="cancel-button" onClick={() => setShowActivateConfirm(false)}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivateSuccess && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowActivateSuccess(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">Kích hoạt tài khoản thành công!</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => setShowActivateSuccess(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivateError && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <span className="close-icon" onClick={() => setShowActivateError(false)}><img src="/icon_LTW/FontistoClose.png" alt="#" /></span>
            <div className="logout-modal-header">
              <span className="header-text">Thông Báo</span>
            </div>
            <p className="logout-message">{activateErrorMessage}</p>
            <div className="logout-modal-buttons">
              <button className="confirm-button" onClick={() => {
                setShowActivateError(false);
                setActivateErrorMessage('');
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

export default AccountManagement;