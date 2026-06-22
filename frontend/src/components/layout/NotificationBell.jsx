import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { formatNotificationMessage } from '../../utils/formatNotificationMessage';
import './NotificationBell.css';

function getNotificationLink(notification, role) {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'patient') {
    if (notification.title === 'Diagnosis reviewed') return '/patient/history';
    if (notification.title === 'More information needed') return '/patient/symptom-checker';
    return '/patient/history';
  }
  return '/dashboard';
}

const NotificationBell = ({ user }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead
  } = useNotifications(user);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) refresh({ silent: true });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markRead(notification._id);
    }
    setOpen(false);
    navigate(getNotificationLink(notification, user?.role));
  };

  return (
    <div className="nb-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="nb-bell-btn"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <BellIcon className="nb-bell-icon" />
        {unreadCount > 0 && (
          <span className="nb-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div ref={panelRef} className="nb-panel" role="dialog" aria-label="Notifications">
          <div className="nb-panel-header">
            <h3 className="nb-panel-title">Notifications</h3>
            {unreadCount > 0 && (
              <button type="button" className="nb-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-panel-body">
            {loading && notifications.length === 0 ? (
              <p className="nb-empty">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="nb-empty">No notifications yet</p>
            ) : (
              <ul className="nb-list" role="list">
                {notifications.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      className={`nb-item${n.read ? '' : ' nb-item--unread'}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="nb-item-header">
                        <span className="nb-item-title">{n.title}</span>
                        {!n.read && <span className="nb-dot" aria-label="Unread" />}
                      </div>
                      <p className="nb-item-message">{formatNotificationMessage(n.message)}</p>
                      <time className="nb-item-time" dateTime={n.createdAt}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
