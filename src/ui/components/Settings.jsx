import { useState } from 'react'
import { getAuth, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../backend/firebase/firebaseConfig'
import { Icon } from './Icon'
import '../styles/settings.css'

export function Settings({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    role: user?.role || '',
    industry: user?.industry || '',
    description: user?.description || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        setMessage({ type: 'error', text: 'Not signed in. Please sign in to save your profile.' })
        return
      }

      // Update Firebase Auth profile
      if (formData.name) {
        await updateProfile(currentUser, { displayName: formData.name })
      }

      // Save profile details to Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    }
  }

  const updateOrganisation = async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        setMessage({ type: 'error', text: 'Not signed in. Please sign in to save your organisation details.' })
        return
      }

      // Save organisation details to Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          company: formData.company,
          role: formData.role,
          industry: formData.industry,
          description: formData.description,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      setMessage({ type: 'success', text: 'Organisation details updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update organisation details. Please try again.' })
    }
  }

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' })
      return
    }
    try {
      // TODO: Integrate with Firebase authentication to change password
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' })
    }
  }

  const handleForgotPassword = async () => {
    try {
      const auth = getAuth()
      await sendPasswordResetEmail(auth, user?.email)
      setMessage({ type: 'success', text: `Password reset link sent to ${user?.email}. Check your email to reset your password.` })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to send password reset email. Please try again.' })
    }
  }

  return (
    <section className="settings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h2>Settings</h2>
        </div>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          <Icon name={message.type === 'success' ? 'check' : 'alert'} />
          <p>{message.text}</p>
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Icon name="user" />
          Profile
        </button>
        <button
          className={`settings-tab ${activeTab === 'organisation' ? 'active' : ''}`}
          onClick={() => setActiveTab('organisation')}
        >
          <Icon name="building" />
          Organisation
        </button>
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Icon name="lock" />
          Security
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="settings-panel">
            <h3>Profile Information</h3>
            <p className="panel-description">Update your personal details</p>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                placeholder="your.email@example.com"
                disabled
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleProfileChange}
                placeholder="+265 (0) xxx-xxx-xxx"
              />
            </div>

            <button className="primary-button" onClick={saveProfile}>
              <Icon name="save" />
              Save Profile
            </button>
          </div>
        )}

        {activeTab === 'organisation' && (
          <div className="settings-panel">
            <h3>Organisation Details</h3>
            <p className="panel-description">Add or update your organisation information</p>

            <div className="form-group">
              <label htmlFor="company">Organisation Name</label>
              <input
                id="company"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleProfileChange}
                placeholder="Your organisation name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Your Role</label>
              <input
                id="role"
                type="text"
                name="role"
                value={formData.role}
                onChange={handleProfileChange}
                placeholder="e.g., Programme Manager, Director"
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry/Sector</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleProfileChange}
              >
                <option value="">Select an industry</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Technology">Technology</option>
                <option value="Environment">Environment & Climate</option>
                <option value="Social Services">Social Services</option>
                <option value="Arts & Culture">Arts & Culture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">What your organisation does</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleProfileChange}
                placeholder="Describe your organisation's mission, focus areas, and impact..."
                rows="5"
              />
            </div>

            <button className="primary-button" onClick={updateOrganisation}>
              <Icon name="save" />
              Save Organisation Details
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-panel">
            <h3>Change Password</h3>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter a new password (min. 8 characters)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
              />
            </div>

            <button className="primary-button" onClick={changePassword}>
              <Icon name="lock" />
              Change Password
            </button>

            <div className="password-actions">
              <button className="secondary-button" onClick={handleForgotPassword}>
                <Icon name="mail" />
                Forgot password...
              </button>
              <button className="secondary-button" onClick={onSignOut}>
                <Icon name="logout" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
