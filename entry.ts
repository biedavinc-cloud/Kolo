// Taux de change temps réel (base USD) pour l'affichage multi-devises.
// Source publique open.er-api.com — aucune clé requise.
export default async function (req: Request): Promise<Response> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return Response.json({ error: 'Service de taux indisponible' }, { status: 502 });
    }
    const data: any = await res.json();
    if (!data || !data.rates || data.result !== 'success') {
      return Response.json({ error: 'Réponse de taux invalide' }, { status: 502 });
    }
    return Response.json({
      base: 'USD',
      rates: data.rates,
      updated_at: data.time_last_update_utc || null,
    });
  } catch (error) {
    console.error('exchangeRates error:', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}