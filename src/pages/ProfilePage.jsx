import { CircleUserRound, LogOut } from 'lucide-react';

export default function ProfilePage({
  session,
  userName,
  starredIntentions,
  diaryCount,
  onOpenAuth,
  onSignOut,
  onUpdateVisibility
}) {
  return (
    <section className="app-page profile-page">
      <header className="page-heading"><p className="eyebrow">YOUR PROFILE</p><h2>{session ? userName : 'Your journey'}</h2><p>Manage your saved intentions and account.</p></header>
      {!session ? (
        <div className="page-empty card"><CircleUserRound size={38}/><h3>Sign in to see your profile</h3><button className="save-button" onClick={() => onOpenAuth('signin')}>Sign in</button></div>
      ) : (
        <>
          <article className="profile-card card"><CircleUserRound size={46}/><div><h3>{userName}</h3><p>{session.user.email}</p></div><button className="secondary-button" onClick={onSignOut}><LogOut size={17}/> Sign out</button></article>
          <div className="profile-stats"><article className="card"><strong>{starredIntentions.length}</strong><span>starred intentions</span></article><article className="card"><strong>{starredIntentions.filter((item) => item.is_public).length}</strong><span>shared publicly</span></article><article className="card"><strong>{diaryCount}</strong><span>diary entries</span></article></div>
          <section className="profile-section"><h3>Your intentions</h3>{starredIntentions.length === 0 ? <p className="page-status">No starred intentions yet.</p> : starredIntentions.map((item) => <div className="profile-intention" key={item.id}><span>“{item.text}”</span><button className={`visibility-button ${item.is_public ? 'public' : ''}`} onClick={() => onUpdateVisibility(item, !item.is_public)}>{item.is_public ? 'Public' : 'Private'}</button></div>)}</section>
        </>
      )}
    </section>
  );
}
