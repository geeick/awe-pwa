import { X } from 'lucide-react';

export default function AuthModal({
  isOpen,
  mode,
  form,
  submitting,
  error,
  message,
  onClose,
  onModeChange,
  onFieldChange,
  onSubmit
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">YOUR JOURNEY</p>
            <h2 id="auth-modal-title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <p>{mode === 'signup' ? 'Save your practices, intentions, and reflections across devices.' : 'Sign in to continue your personal practice.'}</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}><X size={23} /></button>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => onModeChange('signin')}>Sign in</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => onModeChange('signup')}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'signup' && <label>Name<input name="displayName" value={form.displayName} onChange={onFieldChange} autoComplete="name" required /></label>}
          <label>Email<input name="email" type="email" value={form.email} onChange={onFieldChange} autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={onFieldChange} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required /></label>
          {error && <p className="auth-alert error" role="alert">{error}</p>}
          {message && <p className="auth-alert success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        </form>
      </section>
    </div>
  );
}
