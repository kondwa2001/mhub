import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { markNotificationRead } from '../../backend/firebase/firestoreService'

function relativeTime(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  if (!date || Number.isNaN(date.getTime())) return 'New'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function Notifications({ user, notifications }) {
  const [open, setOpen] = useState(false)
  const [alert, setAlert] = useState(null)
  const panelRef = useRef(null)
  const unread = notifications.filter((notification) => !notification.read).length
  useEffect(() => {
    const closeOnOutsideClick = (event) => { if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])
  const showAlert = async (notification) => {
    setAlert(notification)
    if (!notification.read) {
      try { await markNotificationRead(user.uid, notification.id) } catch { /* The notification remains available if sync fails. */ }
    }
  }
  return <div className="notifications" ref={panelRef}>
    <button className="icon-button notification-toggle" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} aria-expanded={open}><Icon name="bell" />{unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <section className="notification-panel" aria-label="Notifications"><div className="notification-heading"><strong>Notifications</strong><span>{unread ? `${unread} unread` : 'All caught up'}</span></div>
      {notifications.length === 0 ? <p className="notification-empty">New donors and sponsorships will appear here.</p> : <div className="notification-list">{notifications.map((notification) => <button key={notification.id} className={notification.read ? 'notification-item' : 'notification-item unread'} onClick={() => showAlert(notification)}><span className={`notification-kind ${notification.type === 'sponsorship' ? 'sponsorship' : 'donor'}`}><Icon name={notification.type === 'sponsorship' ? 'spark' : 'target'} /></span><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{relativeTime(notification.createdAt)}</time></span></button>)}</div>}
      {alert && <div className="notification-alert" role="alert"><div><strong>{alert.title}</strong><p>{alert.message}</p></div><button onClick={() => setAlert(null)} aria-label="Dismiss notification alert">×</button></div>}
    </section>}
  </div>
}
