// RoomCard.js
import React from 'react';
import '../Components_Css/RoomCard.css';

const RoomCard = ({ roomNumber, status, date, roomType, condition, guestName = '', onClick }) => {
  console.log(`RoomCard ${roomNumber}: guestName="${guestName}", status="${status}"`);
  
  const getStatusClass = () => {
    switch (status) {
      case 'Phòng trống':
        return 'room-available';
      case 'Phòng đã đặt':
        return 'room-booked';
      case 'Phòng đang thuê':
        return 'room-occupied';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Phòng trống':
        return <img src="/icon_LTW/thoat.png" alt="#" />;
      case 'Phòng đã đặt':
        return <img src="/icon_LTW/IonCheckmarkCircled.png" alt="#" />;
      case 'Phòng đang thuê':
        return <img src="/icon_LTW/IonPeopleCircle.png" alt="#" />;
      default:
        return '';
    }
  };

  return (
    <div className={`room-card ${getStatusClass()}`} onClick={onClick}>
      <div className="room-header">
        <span>{roomNumber}</span>
        <span className="status-text">{status}</span>
      </div>      <div className="room-content">
        <span className="status-icon">{getStatusIcon()}</span>        {guestName && guestName.trim() !== '' && (
          <span className="guest-name" title={guestName}>
            {guestName}
          </span>
        )}
        {(!guestName || guestName.trim() === '') && <span className="content-status">{status}</span>}
      </div>
     
      <div className="room-footer">
        <div className="footer-calendar">
          <img src="/icon_LTW/PixelCalenderSolid.png" alt="#" />
          <span>{date}</span>
        </div>
        <span>{condition}</span>
      </div>
    </div>
    
  );
};

export default RoomCard;
