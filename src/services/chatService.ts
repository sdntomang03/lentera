export interface ChatMessage {
  id: string;
  sender: 'user' | 'endzi';
  text: string;
  timestamp: string;
}

export interface SendMessageParams {
  message: string;
  studentName?: string;
  currentNav?: string;
  history: ChatMessage[];
}

export async function sendMessageToEndzi(params: SendMessageParams): Promise<string> {
  const { message, studentName = 'Siswa Lentera', currentNav = 'umum', history } = params;

  try {
    const formattedHistory = history.map((msg) => ({
      sender: msg.sender === 'endzi' ? 'model' : 'user',
      text: msg.text,
    }));

    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        studentName,
        currentNav,
        history: formattedHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (
      data.reply ||
      `Halo ${studentName}! Aku Endzi, maskot sahabat belajarmu di Lentera. Ada soal atau materi yang ingin kita bahas bersama? Tuliskan saja pertanyaannya ya!`
    );
  } catch (error) {
    console.warn('Fallback due to chat network error:', error);
    return `Halo ${studentName}! Aku Endzi, maskot sahabat belajarmu di Lentera. Aku siap membantumu memahami materi literasi, numerasi matematika, maupun pengetahuan umum. Silakan tanyakan hal yang ingin kamu pelajari!`;
  }
}
