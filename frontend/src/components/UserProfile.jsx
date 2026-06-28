import React, { useState, useRef, useEffect } from 'react';
import { User, Key, LogOut } from 'lucide-react';
import { ROLE_LABEL } from '../utils/constants';
import './UserProfile.css';

const API = "http://localhost:8080/api";

function UserProfile({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="user-profile-container" ref={menuRef}>
      <div className="google-avatar" onClick={() => setIsOpen(!isOpen)}>
        <div className="avatar-letter">{getInitial(user?.fullName || user?.username)}</div>
      </div>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <strong>{user?.fullName}</strong>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
          <button className="dropdown-item" onClick={() => { setShowProfileModal(true); setIsOpen(false); }}>
            <User size={16} /> Hồ sơ cá nhân
          </button>
          <button className="dropdown-item" onClick={() => { setShowPasswordModal(true); setIsOpen(false); }}>
            <Key size={16} /> Đổi mật khẩu
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item text-danger" onClick={handleLogout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
      )}
      {showPasswordModal && (
        <PasswordModal user={user} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function ProfileModal({ user, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <h3>Hồ sơ cá nhân</h3>
        <div className="profile-info">
          <div className="info-row"><label>Họ tên:</label> <span>{user?.fullName}</span></div>
          <div className="info-row"><label>Tên đăng nhập:</label> <span>{user?.username}</span></div>
          <div className="info-row"><label>Email:</label> <span>{user?.email || "Chưa cập nhật"}</span></div>
          <div className="info-row"><label>Vai trò:</label> <span>{ROLE_LABEL[user?.role] || user?.role}</span></div>
        </div>
        <div className="modal-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ user, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id.toString(), oldPassword, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }
      
      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <h3>Đổi mật khẩu</h3>
        {error && <div className="alert alert-danger" style={{ marginBottom: 16, color: '#dc3545', background: '#f8d7da', padding: 12, borderRadius: 4 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16, color: '#0f5132', background: '#d1e7dd', padding: 12, borderRadius: 4 }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Mật khẩu cũ</label>
            <input type="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Mật khẩu mới</label>
            <input type="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Xác nhận mật khẩu mới</label>
            <input type="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;
