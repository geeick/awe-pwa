import { BookHeart, CircleUserRound, Home, Sprout } from 'lucide-react';

const items = [
  ['Today', Home],
  ['Practice', Sprout],
  ['Diary', BookHeart],
  ['Me', CircleUserRound]
];

export default function Navigation({ activeTab, session, onNavigate, onOpenAuth }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(([label, Icon]) => (
        <button
          key={label}
          className={activeTab === label ? 'active' : ''}
          onClick={() => label === 'Me' && !session ? onOpenAuth('signin') : onNavigate(label)}
        >
          <Icon size={28} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
