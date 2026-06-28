import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle } from "lucide-react";
import "./NotificationBell.css";

const API = "http://localhost:8080/api";

export default function NotificationBell({ userId }) {
  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    
    let raw = createdAt;
    if (typeof raw === 'string' && raw.startsWith('[')) {
      try { raw = JSON.parse(raw); } catch(e) {}
    }

    let d;
    if (Array.isArray(raw)) {
      const [y, m, dNum, hr = 0, min = 0, sec = 0] = raw;
      d = new Date(y, m - 1, dNum, hr, min, sec);
    } else if (typeof raw === 'string') {
      if (raw.includes('/')) {
        const parts = raw.split(/[ /:]/);
        const day = parts[0], month = parts[1], year = parts[2];
        const hr = parts[3] || "00", min = parts[4] || "00", sec = parts[5] || "00";
        d = new Date(`${year}-${month}-${day}T${hr}:${min}:${sec}`);
      } else {
        d = new Date(raw.replace(' ', 'T'));
      }
    } else {
      d = new Date(raw);
    }

    if (isNaN(d)) {
      return String(raw);
    }
    return d.toLocaleString("vi-VN");
  };
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Lỗi lấy thông báo", err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all/${userId}`, { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notification-bell-container" ref={ref}>
      <button className="notification-bell-btn" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                <CheckCircle size={14} /> Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Không có thông báo nào</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notification-item ${n.read ? "read" : "unread"}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div className={`notification-icon ${n.type?.toLowerCase()}`}>
                    <Bell size={16} />
                  </div>
                  <div className="notification-content">
                    <p>{n.message}</p>
                    <span className="notification-time">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  {!n.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
