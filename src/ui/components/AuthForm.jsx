import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import '../styles/auth.css'

function readableError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/weak-password': 'Use a password of at least six characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-not-found': 'No account was found for that email.',
    'auth/missing-email': 'Enter an email address before requesting a reset link.',
    'auth/configuration-not-found': 'Firebase auth is not configured. Copy .env.example to .env.local and add valid VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID values.',
    'auth/operation-not-allowed': 'Firebase Email/Password sign-in is disabled or not configured for this project. Verify Authentication > Sign-in method in Firebase Console.',
    'auth/api-key-not-valid': 'The Firebase web API key is invalid or still the example placeholder. Check the VITE_FIREBASE_API_KEY value in .env.local.',
    'auth/user-disabled': 'This account has been disabled. Contact support if you need access.',
    'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection and Firebase project settings.',
    'auth/too-many-requests': 'Too many attempts were made. Wait a few minutes, then try again.',
  }
  return messages[error.code] || error.message || `Firebase could not complete that request${error.code ? ` (${error.code})` : ''}`
}

export function AuthForm({ onClose, required = false }) {
  const { register, signIn, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess(''); setSubmitting(true)
    try {
      if (mode === 'register') {
        await register({ name: name.trim(), email: email.trim(), password, organization: organization.trim() })
        setMode('signin')
        setPassword('')
        setSuccess('Account created. Please sign in to continue.')
      } else if (mode === 'forgot') {
        await resetPassword({ email: email.trim() })
        setPassword('')
        setSuccess(`If an account exists for ${email.trim()}, a reset link has been sent.`)
      } else {
        await signIn({ email: email.trim(), password })
        onClose?.()
      }
    } catch (authError) { setError(readableError(authError)) } finally { setSubmitting(false) }
  }

  const changeMode = () => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(''); setSuccess('') }
  const showForgotPassword = () => { setMode('forgot'); setError(''); setSuccess('') }
  const returnToSignin = () => { setMode('signin'); setError(''); setSuccess('') }

  return <div className={required ? 'auth-backdrop auth-required' : 'auth-backdrop'} role="presentation" onMouseDown={required ? undefined : onClose}>
    <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
      <p className="eyebrow">MHUB OPPORTUNITY DESK</p>
      <h2 id="auth-title">{mode === 'signin' ? 'Welcome back' : mode === 'forgot' ? 'Reset your password' : 'Create your account'}</h2>
      <p className="auth-intro">{mode === 'signin' ? 'Sign in to access your saved opportunities.' : mode === 'forgot' ? 'Enter your email and we will send you a reset link.' : 'Register to save donor opportunities and keep your workspace in sync.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>}
        {mode === 'register' && <label>Company or organisation<input value={organization} onChange={(event) => setOrganization(event.target.value)} autoComplete="organization" placeholder="Optional" /></label>}
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
        {mode !== 'forgot' && <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {success && <p className="auth-success" role="status">{success}</p>}
        <button className="primary-button auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Create account'}</button>
      </form>
      {mode === 'signin' && <button type="button" className="auth-link" onClick={showForgotPassword}>Forgot password?</button>}
      {mode === 'forgot' && <button type="button" className="auth-link" onClick={returnToSignin}>Back to sign in</button>}
      <p className="auth-switch">{mode === 'signin' ? 'New to mHub?' : mode === 'forgot' ? 'Remembered your password?' : 'Already have an account?'} <button onClick={mode === 'forgot' ? returnToSignin : changeMode}>{mode === 'signin' ? 'Create an account' : mode === 'forgot' ? 'Sign in' : 'Sign in'}</button></p>
    </section>
  </div>
}
