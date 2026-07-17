import { Order, CustomerDevice } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) return '';
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
      }),
    });
    if (!res.ok) return '';
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  } catch {
    return '';
  }
}

export const useAI = () => {
  /**
   * Gera um resumo breve do histórico de OS de um dispositivo.
   */
  const summarizeDeviceHistory = async (
    orders: Order[],
    device: CustomerDevice,
  ): Promise<string> => {
    if (orders.length === 0) return '';

    const historico = orders
      .slice(0, 5)
      .map((o, i) => {
        const date = new Date(o.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        return `${i + 1}. [${date}] Problema: "${o.problem}". Laudo: "${o.technicalReport || 'não informado'}"`;
      })
      .join('\n');

    const specs = device.specs
      ? Object.entries(device.specs)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'não informado';

    const prompt = `Você é um assistente técnico de informática da assistência técnica brasileira Bytex.
Analise o histórico de manutenção abaixo e gere um resumo curto e direto (máximo 2 frases em português) sobre o histórico de problemas desse equipamento.

Equipamento: ${device.name} (S/N: ${device.serialNumber || 'N/A'})
Hardware: ${specs}

Histórico de OS (mais recente primeiro):
${historico}

Resumo:`;

    return callGemini(prompt);
  };

  /**
   * Sugere diagnóstico e testes com base no problema atual e histórico do PC.
   */
  const suggestDiagnosis = async (
    currentProblem: string,
    orders: Order[],
    device: CustomerDevice | null,
  ): Promise<string> => {
    if (!currentProblem.trim() || currentProblem.trim().length < 10) return '';

    const historico =
      orders.length > 0
        ? orders
            .slice(0, 3)
            .map((o) => {
              const date = new Date(o.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
              return `[${date}] "${o.problem}" → Laudo: "${o.technicalReport || 'não informado'}"`;
            })
            .join('\n')
        : 'Nenhum histórico anterior.';

    const specs = device?.specs
      ? Object.entries(device.specs)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'não informado';

    const prompt = `Você é um técnico especialista de informática da assistência técnica Bytex no Brasil.
Com base no problema atual e no histórico do equipamento, sugira um diagnóstico provável e os passos de teste/reparo a realizar.
Seja objetivo e prático. Máximo de 5 tópicos curtos com ações concretas. Use linguagem técnica mas acessível. Responda em português.

Equipamento: ${device?.name ?? 'não informado'} | Hardware: ${specs}

Histórico anterior:
${historico}

Problema atual relatado: "${currentProblem}"

Sugestão de diagnóstico e testes:`;

    return callGemini(prompt);
  };

  return { summarizeDeviceHistory, suggestDiagnosis };
};
