import { Bell, CircleUserRound, LogIn, LogOut, Menu, Sun } from 'lucide-react';

export default function Hero({
  authLoading,
  session,
  userName,
  installPrompt,
  onInstall,
  onOpenAuth,
  onSignOut
}) {
  return (
    <section className="hero">
      <div className="sky-glow" />
      <div className="mountain mountain-back" />
      <div className="mountain mountain-mid" />
      <div className="mountain mountain-front" />
      <div className="lake" />

      <header className="topbar">
        <button className="icon-button" aria-label="Open menu"><Menu size={31} strokeWidth={1.7} /></button>
        <div className="topbar-actions">
          {!authLoading && (
            session ? (
              <button className="account-chip" type="button" onClick={onSignOut} title="Sign out">
                <CircleUserRound size={19} />
                <span>{userName}</span>
                <LogOut size={17} />
              </button>
            ) : (
              <button className="account-chip" type="button" onClick={() => onOpenAuth('signin')}>
                <LogIn size={18} />
                <span>Sign in</span>
              </button>
            )
          )}
          <button className="icon-button" aria-label="Notifications"><Bell size={29} strokeWidth={1.7} /></button>
        </div>
      </header>

      <div className="welcome">
        <div className="greeting-row">
          <h1>Good morning, {session ? userName : 'Georgia'}</h1>
          <Sun size={44} className="sun-icon" strokeWidth={1.6} />
        </div>
        <p>Let’s live with intention today.</p>
        <div className="welcome-actions">
          {installPrompt && <button className="install-chip" onClick={onInstall}>Install app</button>}
          {!session && !authLoading && (
            <button className="signup-chip" type="button" onClick={() => onOpenAuth('signup')}>Create account</button>
          )}
        </div>
      </div>
    </section>
  );
}
