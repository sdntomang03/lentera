import { DailyTip, FALLBACK_TIPS } from '../data/dailyTipsData';

export async function fetchDailyTip(
  category: 'all' | 'literasi' | 'numerasi' | 'motivasi' = 'all'
): Promise<DailyTip> {
  try {
    const res = await fetch('/api/gemini/tips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.quote) {
        return {
          id: `ai-tip-${Date.now()}`,
          quote: data.quote,
          author: data.author || 'Lentera AI Guru',
          category: data.category || (category === 'all' ? 'motivasi' : category),
          actionTip: data.actionTip || 'Semangat belajar hari ini!',
          icon: data.icon || (category === 'numerasi' ? '🧮' : category === 'literasi' ? '📖' : '✨'),
          isAiGenerated: true,
        };
      }
    }
  } catch (error) {
    console.warn('API tips request failed, falling back to local tips pool:', error);
  }

  // Fallback to random tip from local database matching category
  const filtered =
    category === 'all'
      ? FALLBACK_TIPS
      : FALLBACK_TIPS.filter((t) => t.category === category);
  const pool = filtered.length > 0 ? filtered : FALLBACK_TIPS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return { ...pool[randomIndex], isAiGenerated: false };
}
