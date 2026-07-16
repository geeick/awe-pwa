import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, CircleUserRound, LogIn, LogOut, Menu, Sun, X } from 'lucide-react';

function getNotificationState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export default function Hero({
  authLoading,
  session,
  userName,
  installPrompt,
  onInstall,
  onOpenAuth,
  onSignOut
}) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationState, setNotificationState] = useState(getNotificationState);
  const notificationAreaRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!notificationAreaRef.current?.contains(event.target)) {
        setIsNotificationPanelOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsNotificationPanelOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  async function requestNotifications() {
    if (!('Notification' in window)) {
      setNotificationState('unsupported');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationState(permission);

    if (permission === 'granted') {
      new Notification('Grounded notifications are on', {
        body: 'You can now receive practice and reflection reminders.'
      });
    }
  }

  const notificationMessage = {
    granted: 'Notifications are enabled on this device.',
    denied: 'Notifications are blocked. Change the permission in your browser settings.',
    default: 'Enable reminders for practices and reflections.',
    unsupported: 'This browser does not support notifications.'
  }[notificationState];

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

          <div className="notification-area" ref={notificationAreaRef}>
            <button
              className={`icon-button notification-button ${isNotificationPanelOpen ? 'active' : ''}`}
              type="button"
              aria-label="Notifications"
              aria-expanded={isNotificationPanelOpen}
              onClick={() => setIsNotificationPanelOpen((open) => !open)}
            >
              <Bell size={29} strokeWidth={1.7} />
            </button>

            {isNotificationPanelOpen && (
              <section className="notification-panel" aria-label="Notification settings">
                <div className="notification-panel-heading">
                  <div>
                    <p className="eyebrow">NOTIFICATIONS</p>
                    <h2>Stay connected</h2>
                  </div>
                  <button
                    className="notification-close"
                    type="button"
                    aria-label="Close notification settings"
                    onClick={() => setIsNotificationPanelOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p>{notificationMessage}</p>

                {notificationState === 'granted' ? (
                  <div className="notification-enabled">
                    <CheckCircle2 size={19} />
                    <span>Receiving notifications</span>
                  </div>
                ) : (
                  <button
                    className="notification-permission-button"
                    type="button"
                    onClick={requestNotifications}
                    disabled={notificationState === 'unsupported' || notificationState === 'denied'}
                  >
                    <Bell size={18} />
                    Receive notifications
                  </button>
                )}
              </section>
            )}
          </div>
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
