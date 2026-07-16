import { useMemo, useState } from 'react';
import { BookHeart, ChevronDown, Image, Leaf, MessageCircle, Smile, Timer } from 'lucide-react';

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayDate(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

export default function DiaryPage({
  session,
  loading,
  error,
  entries,
  intentions,
  checkIns,
  photoUrls,
  onOpenAuth,
  onBrowsePractices
}) {
  const [openDates, setOpenDates] = useState({});

  const days = useMemo(() => {
    const grouped = new Map();

    function ensureDay(date) {
      if (!date) return null;
      if (!grouped.has(date)) {
        grouped.set(date, { date, intention: null, checkIn: null, practices: [] });
      }
      return grouped.get(date);
    }

    intentions.forEach((item) => {
      const day = ensureDay(item.intention_date);
      if (day) day.intention = item;
    });

    checkIns.forEach((item) => {
      const day = ensureDay(item.check_in_date);
      if (day) day.checkIn = item;
    });

    entries.forEach((entry) => {
      const day = ensureDay(localDateKey(entry.completed_at || entry.started_at || entry.created_at));
      if (day) day.practices.push(entry);
    });

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [checkIns, entries, intentions]);

  function toggleDay(date) {
    setOpenDates((current) => ({ ...current, [date]: !current[date] }));
  }

  return (
    <section className="app-page diary-page">
      <header className="page-heading">
        <p className="eyebrow">DAILY DIARY</p>
        <h2>Your days, gathered together</h2>
        <p>Each day combines your intention, reflection, mood, and every practice you recorded.</p>
      </header>

      {!session ? (
        <div className="page-empty card"><BookHeart size={38}/><h3>Sign in to keep a daily diary</h3><button className="save-button" onClick={() => onOpenAuth('signin')}>Sign in</button></div>
      ) : loading ? (
        <p className="page-status">Loading diary…</p>
      ) : error ? (
        <p className="intention-alert">{error}</p>
      ) : days.length === 0 ? (
        <div className="page-empty card"><BookHeart size={38}/><h3>Your diary is ready</h3><p>Choose an intention, reflect on your day, or complete a practice to create your first daily entry.</p><button className="save-button" onClick={onBrowsePractices}>Browse practices</button></div>
      ) : (
        <div className="daily-diary-grid">
          {days.map((day) => {
            const isOpen = Boolean(openDates[day.date]);
            const practiceCount = day.practices.length;

            return (
              <article className={`daily-diary-card card ${isOpen ? 'open' : ''}`} key={day.date}>
                <button className="daily-diary-summary" type="button" onClick={() => toggleDay(day.date)} aria-expanded={isOpen}>
                  <div>
                    <span className="daily-diary-date">{displayDate(day.date)}</span>
                    <p>
                      {practiceCount} {practiceCount === 1 ? 'practice' : 'practices'}
                      {day.checkIn?.mood_label ? ` · ${day.checkIn.mood_label}` : ''}
                    </p>
                  </div>
                  <ChevronDown size={23} />
                </button>

                {isOpen && (
                  <div className="daily-diary-details">
                    <section className="daily-diary-section intention">
                      <div className="daily-diary-label"><Leaf size={18} /> Intention</div>
                      <blockquote>{day.intention?.intention_text ? `“${day.intention.intention_text}”` : 'No intention recorded.'}</blockquote>
                    </section>

                    <section className="daily-diary-section">
                      <div className="daily-diary-label"><Smile size={18} /> Mood</div>
                      <p>{day.checkIn?.mood_label || 'No mood recorded.'}</p>
                    </section>

                    <section className="daily-diary-section">
                      <div className="daily-diary-label"><MessageCircle size={18} /> Reflection</div>
                      <p>{day.checkIn?.reflection_text || 'No reflection recorded.'}</p>
                    </section>

                    <section className="daily-diary-section">
                      <div className="daily-diary-label"><BookHeart size={18} /> Practices</div>
                      {day.practices.length === 0 ? (
                        <p>No practices recorded.</p>
                      ) : (
                        <div className="daily-practice-list">
                          {day.practices.map((entry) => (
                            <article className="daily-practice-entry" key={entry.id}>
                              <div className="daily-practice-heading">
                                <div>
                                  <span className={`diary-status ${entry.status}`}>{entry.status === 'completed' ? 'Completed' : 'Saved for later'}</span>
                                  <h3>{entry.practice_title}</h3>
                                </div>
                                <span className="diary-meta"><Timer size={15}/>{entry.duration_minutes || '—'} min</span>
                              </div>

                              {entry.notes && <p className="diary-notes">{entry.notes}</p>}
                              {entry.photo_paths?.length > 0 && (
                                <div className="diary-photo-grid">
                                  {entry.photo_paths.map((path) => photoUrls[path]
                                    ? <img src={photoUrls[path]} alt={`Practice note for ${entry.practice_title}`} key={path} />
                                    : <div className="diary-photo-placeholder" key={path}><Image size={22}/></div>
                                  )}
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
