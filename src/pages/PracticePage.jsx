import { Leaf, Sparkles, Sprout, Timer } from 'lucide-react';

export default function PracticePage({ practices, loading, error, onStartPractice }) {
  return (
    <section className="app-page">
      <header className="page-heading">
        <p className="eyebrow">PRACTICE LIBRARY</p>
        <h2>Ways to practice attention and meaning</h2>
        <p>Choose something that fits the time and energy you have today.</p>
      </header>
      {loading ? <p className="page-status">Loading practices…</p> : error ? <p className="intention-alert">{error}</p> : (
        <div className="practice-library-grid">
          {practices.map((item) => (
            <article className="library-card" key={item.id}>
              <div className="library-icon"><Sprout size={28} /></div>
              <div>
                <span className="category-chip">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="library-meta">
                  <span><Timer size={17} /> {item.duration_minutes} min</span>
                  {item.benefit && <span><Leaf size={17} /> {item.benefit}</span>}
                </div>
                <button className="library-start-button" type="button" onClick={() => onStartPractice(item)}>
                  <Sparkles size={17} /> Start practice
                </button>
                <details><summary>How to practice</summary><p>{item.instructions}</p></details>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
