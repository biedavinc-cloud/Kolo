import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const message = String(body?.message || '').slice(0, 1000);
    const context = String(body?.context || '').slice(0, 4000);
    if (!message.trim()) return Response.json({ error: 'Message vide' }, { status: 400 });

    const apiKey = secrets.get('GEMINI_API_KEY');
    if (!apiKey) return Response.json({ error: 'Clé Gemini non configurée' }, { status: 500 });

    const history = Array.isArray(body?.history) ? body.history.slice(-6).map((h) => ({
      role: h?.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(h?.content || '').slice(0, 800) }],
    })) : [];

    const prompt =
      'Tu es Kolo AI, l\'assistant financier intégré de l\'application Kolo (gestion financière familiale). ' +
      'Tu réponds en français, de façon concise, pratique et bienveillante. ' +
      'Tu aides sur les budgets, les dépenses, l\'épargne, les dettes et les objectifs financiers, ' +
      'et tu donnes des conseils personnalisés basés sur les données fournies.' +
      (context ? '\n\nContexte financier du foyer (montants arrondis) :\n' + context : '') +
      '\n\nQuestion de l\'utilisateur : ' + message;

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: 'Erreur Gemini : ' + detail.slice(0, 200) }, { status: 502 });
    }

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p?.text || '')
      .join('')
      .trim();
    if (!text) return Response.json({ error: 'Réponse vide du modèle' }, { status: 502 });

    return Response.json({ reply: text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}