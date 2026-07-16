import { ChevronRight, Flame, Leaf, Mountain, Pencil, Quote, Sprout, Timer, TreePine } from 'lucide-react';
import { moods } from '../constants/intentions';

export default function TodayPage({
  intention,
  selectedMood,
  pageError,
  journeyStats,
  journeyLoading,
  onEditIntention,
  onStartPractice,
  onSaveMood
}) {
  return (
    <section className="content-stack">
      <article className="card intention-card">
        <div className="intention-content">
          <div className="intention-heading">
            <p className="eyebrow">TODAY’S INTENTION</p>
            <button className="intention-edit-button" type="button" aria-label="Choose today’s intention" onClick={onEditIntention}>
              <Pencil size={21} strokeWidth={1.7} />
            </button>
          </div>
          <blockquote>“{intention}”</blockquote>
        </div>
        <div className="botanical"><Leaf size={92} strokeWidth={1.1} /></div>
      </article>

      <article className="card practice-card">
        <p className="eyebrow">TODAY’S PRACTICE</p>
        <div className="practice-row">
          <div className="round-icon"><TreePine size={50} strokeWidth={1.5} /></div>
          <div className="practice-copy">
            <h2>Awe Walk</h2>
            <p>Take a slow walk outside and notice one thing that fills you with awe.</p>
            <div className="meta-row">
              <span><Timer size={21} /> 5–15 min</span><i /><span><Leaf size={21} /> Cultivates wonder</span>
            </div>
          </div>
          <ChevronRight className="chevron" size={35} strokeWidth={1.6} />
        </div>
        <button className="primary-button" type="button" onClick={onStartPractice}>Start Practice</button>
        {pageError && <p className="intention-alert" role="alert">{pageError}</p>}
      </article>

      <article className="card reflection-card">
        <div className="reflection-heading"><div><p className="eyebrow">EVENING REFLECTION</p><h2>How did today change you?</h2></div></div>
        <p className="rate-label">Rate today</p>
        <div className="mood-row">
          {moods.map((mood) => (
            <button className={`mood ${selectedMood === mood.label ? 'selected' : ''}`} key={mood.label} onClick={() => onSaveMood(mood.label)}>
              <span className="mood-face">{mood.face}</span><span>{mood.label}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="card journey-card">
        <p className="eyebrow">YOUR JOURNEY</p>
        <div className="journey-grid">
          <div className="journey-item"><Flame size={35} strokeWidth={1.4} /><strong>{journeyLoading ? '—' : journeyStats.streak}</strong><span>day streak</span></div>
          <div className="journey-item middle"><Sprout size={35} strokeWidth={1.4} /><strong>{journeyLoading ? '—' : journeyStats.completedPractices}</strong><span>practices completed</span></div>
          <div className="journey-item meaning">
            <Mountain size={35} strokeWidth={1.4} />
            <b>Meaning Score</b>
            <div className="score-bars">
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className={!journeyLoading && index < Math.round(journeyStats.meaningScore) ? 'filled' : ''} />
              ))}
            </div>
            <small>{journeyLoading ? 'Calculating…' : `${journeyStats.meaningScore.toFixed(1)} / 10`}</small>
          </div>
        </div>
      </article>
      <article className="quote-card"><Quote size={39} strokeWidth={1.6} /><div><p>We are a way for the cosmos<br />to know itself.</p><span>— Carl Sagan</span></div></article>
    </section>
  );
}
