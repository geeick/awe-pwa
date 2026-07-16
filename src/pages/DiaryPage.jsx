import { BookHeart, Image, Timer } from 'lucide-react';

export default function DiaryPage({
  session,
  loading,
  error,
  entries,
  photoUrls,
  onOpenAuth,
  onBrowsePractices
}) {
  return (
    <section className="app-page diary-page">
      <header className="page-heading"><p className="eyebrow">PRACTICE DIARY</p><h2>Your record of attention</h2><p>Notes and photographs from the practices you have begun.</p></header>
      {!session ? (
        <div className="page-empty card"><BookHeart size={38}/><h3>Sign in to keep a practice diary</h3><button className="save-button" onClick={() => onOpenAuth('signin')}>Sign in</button></div>
      ) : loading ? (
        <p className="page-status">Loading diary…</p>
      ) : error ? (
        <p className="intention-alert">{error}</p>
      ) : entries.length === 0 ? (
        <div className="page-empty card"><BookHeart size={38}/><h3>Your diary is ready</h3><p>Start a practice and save notes or photos to create your first entry.</p><button className="save-button" onClick={onBrowsePractices}>Browse practices</button></div>
      ) : (
        <div className="diary-grid">
          {entries.map((entry) => (
            <article className="diary-card card" key={entry.id}>
              <div className="diary-card-heading"><div><span className={`diary-status ${entry.status}`}>{entry.status === 'completed' ? 'Completed' : 'Saved for later'}</span><h3>{entry.practice_title}</h3></div><small>{new Date(entry.created_at).toLocaleString()}</small></div>
              {entry.notes && <p className="diary-notes">{entry.notes}</p>}
              {entry.photo_paths?.length > 0 && <div className="diary-photo-grid">{entry.photo_paths.map((path) => photoUrls[path] ? <img src={photoUrls[path]} alt={`Practice note for ${entry.practice_title}`} key={path} /> : <div className="diary-photo-placeholder" key={path}><Image size={22}/></div>)}</div>}
              <div className="diary-meta"><Timer size={16}/><span>{entry.duration_minutes || '—'} min</span></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
