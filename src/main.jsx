import React from 'react';
import { createRoot } from 'react-dom/client';
import { setIntentionSuggestions } from './constants/intentions';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('The root element is missing.');
}

const root = createRoot(rootElement);

function StatusScreen({ title, detail }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#ece7de', color: '#26332e', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div>
        <h1 style={{ margin: '0 0 10px', fontSize: '24px' }}>{title}</h1>
        {detail && <p style={{ margin: 0, maxWidth: '52ch', lineHeight: 1.5 }}>{detail}</p>}
      </div>
    </main>
  );
}

async function bootstrap() {
  root.render(<StatusScreen title="Loading today’s intention…" />);

  const { supabase } = await import('./lib/supabase');
  const { data, error } = await supabase
    .from('intentions')
    .select('text, is_featured, sort_order, created_at')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const suggestions = [...new Set(
    (data || [])
      .map((row) => row.text?.trim())
      .filter(Boolean)
  )];

  if (!suggestions.length) {
    throw new Error('No active intentions were found in the intentions table.');
  }

  setIntentionSuggestions(suggestions);

  const { default: App } = await import('./App');
  root.render(<App />);
}

bootstrap().catch((error) => {
  console.error('Could not start AWE:', error);
  root.render(
    <StatusScreen
      title="AWE could not load"
      detail={error.message || 'The intention library could not be loaded. Please refresh and try again.'}
    />
  );
});
