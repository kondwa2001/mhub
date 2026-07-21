import { useState } from 'react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../../backend/firebase/firebaseConfig'
import '../styles/auth.css'

export function PasswordReset({ onBack }) {
  const [step, setStep] = useState('code') // 'code' | 'newpass'
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const verifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await verifyPasswordResetCode(auth, code.trim())
      setStep('newpass')
    } catch {
      setError('Invalid or expired code. Check your email and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const setPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.')
    setSubmitting(true)
    try {
      await confirmPasswordReset(auth, code.trim(), newPassword)
      onBack('success')
    } catch {
      setError('Failed to reset password. The code may have expired. Please request a new one.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-backdrop auth-required" role="presentation">
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <div className="auth-logo-bubble">
          <img src="/mhub-logo.svg" alt="mHub" className="auth-logo" />
        </div>
        <p className="eyebrow" style={{ textAlign: 'center' }}>MHUB OPPORTUNITY DESK</p>
        <h2 id="reset-title">{step === 'code' ? 'Enter your reset code' : 'Set a new password'}</h2>
        <p className="auth-intro">
          {step === 'code'
            ? 'Paste the code from the reset email we sent you.'
            : 'Choose a strong password for your account.'}
        </p>

        {step === 'code' ? (
          <form className="auth-form" onSubmit={verifyCode}>
            <label>Reset code<input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Paste code from email" autoComplete="one-time-code" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Verify code'}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={setPassword}>
            <label>New password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="8" autoComplete="new-password" placeholder="Min. 8 characters" /></label>
            <label>Confirm password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="8" autoComplete="new-password" placeholder="Repeat new password" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save new password'}</button>
          </form>
        )}

        <button type="button" className="auth-link" onClick={() => onBack(null)}>Back to sign in</button>
      </section>
    </div>
  )
}
