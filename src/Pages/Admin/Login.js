import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import '../../Design_Css/Admin/Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedInRole, setLoggedInRole] = useState(null);
  const navigate = useNavigate();

  const mapMaVaiTroToRole = (maVaiTro) => {
    console.log('MaVaiTro:', maVaiTro);
    switch (maVaiTro) {
      case 1:
        return 'admin';
      case 2:
        return 'staff';
      default:
        return 'unknown';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('auth/login', {
        TenTaiKhoan: username,
        MatKhau: password,
      });
      console.log('Full Response:', response.data);

      if (!response.data.success) {
        setError(response.data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.');
        return;
      }

      if (!response.data.data) {
        setError('Không nhận được dữ liệu từ server. Vui lòng thử lại.');
        return;
      }

      // Trích xuất dữ liệu và thử các tên trường khác nhau
      const data = response.data.data;
      const accessToken = data.accessToken || data.AccessToken || data.token; // Thử các tên trường
      const maVaiTro = data.MaVaiTro || data.maVaiTro || data.role; // Thử các tên trường

      console.log('Extracted - accessToken:', accessToken, 'MaVaiTro:', maVaiTro);

      if (!accessToken || maVaiTro === undefined) {
        setError('Dữ liệu đăng nhập không hợp lệ: Thiếu accessToken hoặc MaVaiTro.');
        return;
      }

      const role = mapMaVaiTroToRole(maVaiTro);
      console.log('Mapped Role:', role);      try {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username); // Lưu username để xác định user hiện tại
        console.log('Stored in localStorage - Token:', localStorage.getItem('token'), 'Role:', localStorage.getItem('role'), 'Username:', localStorage.getItem('username'));
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
        setError('Không thể lưu thông tin đăng nhập. Vui lòng thử lại.');
        return;
      }

      setLoggedInRole(role);
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        setError(error.response.data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra kết nối.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInRole) {
      console.log('useEffect triggered with role:', loggedInRole);
      if (loggedInRole === 'admin') {
        console.log('Attempting to navigate to /Dashboard');
        navigate('/Dashboard', { replace: true });
        console.log('Navigated to /Dashboard');
      } else if (loggedInRole === 'staff') {
        console.log('Attempting to navigate to /Staff/Dashboard');
        navigate('/Staff/Dashboard', { replace: true });
        console.log('Navigated to /Staff/Dashboard');
      } else {
        setError('Vai trò không hợp lệ.');
      }
    }
  }, [loggedInRole, navigate]);

  return (
    <div className="login-container">
      <div className="logologin">
        <img src="/icon_LTW/LogoDeBugTeam.jpg" alt="Logo" />
      </div>
      <div className="login-box">
        <h2>Đăng Nhập</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="icon">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <span className="icon">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ?faEye: faEyeSlash} />
            </span>
          </div>
          <div className="buttonlogin">
            <button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;