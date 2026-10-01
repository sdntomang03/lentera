import { DailyTip, FALLBACK_TIPS } from '../data/dailyTipsData';

export async function fetchDailyTip(
  category: 'all' | 'literasi' | 'numerasi' | 'motivasi' = 'all',
  topic = '',
): Promise<DailyTip> {
  try {
    const res = await fetch('/api/deepseek/tips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, topic }),
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
          isAiGenerated: data.isAiGenerated === true,
          generationError: data.generationError,
        };
      }
      throw new Error('Respons server tidak berisi tips yang valid.');
    }
    throw new Error(`Server tips AI merespons dengan status ${res.status}.`);
  } catch (error) {
    console.warn('API tips request failed, falling back to local tips pool:', error);
    const filtered =
      category === 'all'
        ? FALLBACK_TIPS
        : FALLBACK_TIPS.filter((tip) => tip.category === category);
    const pool = filtered.length > 0 ? filtered : FALLBACK_TIPS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return {
      ...pool[randomIndex],
      isAiGenerated: false,
      generationError: 'Layanan tips AI tidak dapat dihubungi. Periksa server AI, lalu coba lagi.',
    };
  }

}

export async function fetchDailyTipCollection(count = 3): Promise<DailyTip[]> {
  const res = await fetch('/api/deepseek/tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'all', count }),
  });

  if (!res.ok) {
    throw new Error(`Server tips AI merespons dengan status ${res.status}.`);
  }

  const data = await res.json();
  if (!Array.isArray(data.tips)) {
    throw new Error(data.generationError || 'Respons server tidak berisi koleksi tips.');
  }

  return data.tips.map((tip: Partial<DailyTip>, index: number) => ({
    id: `ai-collection-tip-${Date.now()}-${index}`,
    quote: typeof tip.quote === 'string' ? tip.quote : '',
    author: typeof tip.author === 'string' ? tip.author : 'Guru Lentera AI',
    category: tip.category || 'motivasi',
    actionTip: typeof tip.actionTip === 'string' ? tip.actionTip : '',
    icon: typeof tip.icon === 'string' ? tip.icon : '💡',
    isAiGenerated: tip.isAiGenerated === true,
    generationError: tip.generationError,
  }));
}
