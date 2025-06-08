import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Pages/Admin/Login';
import Dashboard from './Pages/Admin/Dashboard';
import RoomAdmin from './Pages/Admin/RoomAdmin';
import BookingRoom from './Pages/Admin/BookingRoom';
import BillAdmin from './Pages/Admin/BillAdmin';
import CustomerManager from './Pages/Admin/CustomerManager';
import RoomManager from './Pages/Admin/RoomManager';
import RoomTypeManager from './Pages/Admin/RoomTypeManager';
import ServiceManager from './Pages/Admin/ServiceManager';
import ServiceTypeManager from './Pages/Admin/ServiceTypeManager';
import LoyaltyPointsManager from './Pages/Admin/LoyaltyPointsManager';
import PointHistoryManager from './Pages/Admin/PointHistoryManager';
import AccountManager from './Pages/Admin/AccountManager';
import StaffDashboard from './Pages/Staff/Dashboard';
import RoomStaff from './Pages/Staff/RoomStaff';
import BookingRoomStaff from './Pages/Staff/BookingRoom';
import BillStaff from './Pages/Staff/BillStaff';
import CustomerManagerStaff from './Pages/Staff/CustomerManager';

const ProtectedRoute = ({ element, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  console.log('ProtectedRoute - Token:', token, 'Role:', role, 'AllowedRole:', allowedRole);

  if (!token) {
    console.log('No token, redirecting to /');
    return <Navigate to="/" />;
  }

  if (role !== allowedRole) {
    console.log('Role mismatch, redirecting to login');
    return <Navigate to="/" />;
  }

  console.log('Rendering protected route for:', allowedRole);
  return element;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/Dashboard"
          element={<ProtectedRoute element={<Dashboard />} allowedRole="admin" />}
        />
        <Route
          path="/RoomAdmin"
          element={<ProtectedRoute element={<RoomAdmin />} allowedRole="admin" />}
        />
        <Route
          path="/BookingRoom"
          element={<ProtectedRoute element={<BookingRoom />} allowedRole="admin" />}
        />
        <Route
          path="/BillAdmin"
          element={<ProtectedRoute element={<BillAdmin />} allowedRole="admin" />}
        />
        <Route
          path="/CustomerManager"
          element={<ProtectedRoute element={<CustomerManager />} allowedRole="admin" />}
        />
        <Route
          path="/RoomManager"
          element={<ProtectedRoute element={<RoomManager />} allowedRole="admin" />}
        />
        <Route
          path="/RoomTypeManager"
          element={<ProtectedRoute element={<RoomTypeManager />} allowedRole="admin" />}
        />
        <Route
          path="/ServiceManager"
          element={<ProtectedRoute element={<ServiceManager />} allowedRole="admin" />}
        />
        <Route
          path="/ServiceTypeManager"
          element={<ProtectedRoute element={<ServiceTypeManager />} allowedRole="admin" />}
        />
        <Route
          path="/LoyaltyPointsManager"
          element={<ProtectedRoute element={<LoyaltyPointsManager />} allowedRole="admin" />}
        />
        <Route
          path="/PointHistoryManager"
          element={<ProtectedRoute element={<PointHistoryManager />} allowedRole="admin" />}
        />
        <Route
          path="/AccountManager"
          element={<ProtectedRoute element={<AccountManager />} allowedRole="admin" />}
        />
        <Route
          path="/Staff/Dashboard"
          element={<ProtectedRoute element={<StaffDashboard />} allowedRole="staff" />}
        />
        <Route
          path="/Staff/RoomStaff"
          element={<ProtectedRoute element={<RoomStaff />} allowedRole="staff" />}
        />
        <Route
          path="/Staff/BookingRoom"
          element={<ProtectedRoute element={<BookingRoomStaff />} allowedRole="staff" />}
        />
        <Route
          path="/Staff/BillStaff"
          element={<ProtectedRoute element={<BillStaff />} allowedRole="staff" />}
        />
        <Route
          path="/Staff/CustomerManager"
          element={<ProtectedRoute element={<CustomerManagerStaff />} allowedRole="staff" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;