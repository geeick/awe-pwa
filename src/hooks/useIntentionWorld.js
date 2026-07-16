import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ITEM_SELECT = `
  id,
  intention_text,
  content_type,
  title,
  body,
  creator,
  external_url,
  image_path,
  practice_id,
  submitted_by,
  created_at,
  intention_world_votes(count)
`;

function normalizeItems(items, votedIds) {
  return (items || [])
    .map((item) => ({
      ...item,
      voteCount: item.intention_world_votes?.[0]?.count || 0,
      hasVoted: votedIds.has(item.id)
    }))
    .sort((a, b) => b.voteCount - a.voteCount || new Date(b.created_at) - new Date(a.created_at));
}

export default function useIntentionWorld({ intention, userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  useEffect(() => {
    let active = true;

    async function loadWorld() {
      if (!intention?.trim()) {
        setItems([]);
        return;
      }

      setLoading(true);
      setError('');

      const exactResult = await supabase
        .from('intention_world_items')
        .select(ITEM_SELECT)
        .eq('is_approved', true)
        .eq('intention_text', intention.trim())
        .limit(100);

      if (!active) return;
      if (exactResult.error) {
        setError(exactResult.error.message);
        setLoading(false);
        return;
      }

      let worldItems = exactResult.data || [];
      if (worldItems.length === 0) {
        const fallbackResult = await supabase
          .from('intention_world_items')
          .select(ITEM_SELECT)
          .eq('is_approved', true)
          .eq('intention_text', '__general__')
          .limit(100);

        if (!active) return;
        if (fallbackResult.error) {
          setError(fallbackResult.error.message);
          setLoading(false);
          return;
        }
        worldItems = fallbackResult.data || [];
      }

      let votedIds = new Set();
      if (userId && worldItems.length) {
        const { data: votes, error: voteError } = await supabase
          .from('intention_world_votes')
          .select('item_id')
          .eq('user_id', userId)
          .in('item_id', worldItems.map((item) => item.id));

        if (!voteError) votedIds = new Set((votes || []).map((vote) => vote.item_id));
      }

      if (active) {
        setItems(normalizeItems(worldItems, votedIds));
        setLoading(false);
      }
    }

    loadWorld();
    return () => { active = false; };
  }, [intention, refreshToken, userId]);

  const vote = useCallback(async (item) => {
    if (!userId) throw new Error('Sign in to love community contributions.');

    if (item.hasVoted) {
      const { error: deleteError } = await supabase
        .from('intention_world_votes')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from('intention_world_votes')
        .insert({ item_id: item.id, user_id: userId });
      if (insertError) throw insertError;
    }

    setItems((current) => current
      .map((currentItem) => currentItem.id === item.id
        ? {
            ...currentItem,
            hasVoted: !currentItem.hasVoted,
            voteCount: Math.max(0, currentItem.voteCount + (currentItem.hasVoted ? -1 : 1))
          }
        : currentItem)
      .sort((a, b) => b.voteCount - a.voteCount)
    );
  }, [userId]);

  const contribute = useCallback(async (contribution) => {
    if (!userId) throw new Error('Sign in to contribute to this intention.');

    let imagePath = null;
    if (contribution.imageFile) {
      const safeName = contribution.imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      imagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('intention-world')
        .upload(imagePath, contribution.imageFile, {
          upsert: false,
          contentType: contribution.imageFile.type
        });
      if (uploadError) throw uploadError;
    }

    const { error: insertError } = await supabase
      .from('intention_world_items')
      .insert({
        intention_text: intention.trim(),
        content_type: contribution.contentType,
        title: contribution.title.trim() || null,
        body: contribution.body.trim() || null,
        creator: contribution.creator.trim() || null,
        external_url: contribution.externalUrl.trim() || null,
        image_path: imagePath,
        submitted_by: userId,
        is_approved: true
      });

    if (insertError) throw insertError;
    refresh();
  }, [intention, refresh, userId]);

  return { items, loading, error, vote, contribute, refresh };
}
