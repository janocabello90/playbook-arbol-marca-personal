export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, respuestas } = req.body;
  console.log('📥 Lead recibido:', { name, email });

  if (!name || !email) return res.status(400).json({ error: 'Faltan datos' });

  const API_KEY = process.env.RESEND_API_KEY;
  const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  const JANO_EMAIL = process.env.JANO_EMAIL;
  const firstName = name.split(' ')[0];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  console.log('🔑 API_KEY presente:', !!API_KEY);
  console.log('🎯 AUDIENCE_ID:', AUDIENCE_ID);
  console.log('📧 JANO_EMAIL:', JANO_EMAIL);

  // 1. Añadir contacto al Audience
  try {
    const audRes = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: name.split(' ').slice(1).join(' ') || '',
        unsubscribed: false
      })
    });
    const audData = await audRes.json();
    console.log('👥 Audience response:', audRes.status, JSON.stringify(audData));
  } catch(e) { console.error('Audience error:', e); }

  await sleep(600);
  // 2. Email con informe al usuario
  const moduloLabels = {
    ws_1: '🌱 La Semilla — Propósito',
    ws_2: '🌿 Las Raíces — Identidad',
    ws_3: '🪵 El Tronco — Posicionamiento',
    ws_4: '🌲 Las Ramas — Diferenciación',
    ws_5: '☁️ La Copa — Percepción',
    ws_6: '🍎 Los Frutos — Impacto',
    ws_7: '🌍 El Entorno — Contexto',
    ws_8: '⏳ El Tiempo — Paciencia',
    ws_9: '📦 El Producto — Tu oferta',
    foto_final: '📸 Tu Fotografía Final'
  };

  let bloques = '';
  for (const [key, label] of Object.entries(moduloLabels)) {
    if (respuestas && respuestas[key]) {
      bloques += `
        <div style="margin-bottom:24px;padding:20px 24px;background:#f9f4ec;border-left:4px solid #c4522a;">
          <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4522a;margin-bottom:8px;">${label}</div>
          <div style="font-size:15px;line-height:1.7;color:#2a1f0e;">${respuestas[key].replace(/\n/g,'<br>')}</div>
        </div>`;
    }
  }

  const informeHtml = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#1a1208;padding:48px 40px;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c4522a;margin-bottom:12px;">TU INFORME PERSONAL</div>
        <div style="font-family:Arial,sans-serif;font-size:36px;font-weight:900;color:#f5e6c8;letter-spacing:2px;line-height:1;">EL ÁRBOL DE<br>TU MARCA</div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#d4922a;margin-top:12px;">${name}</div>
      </div>
      <div style="padding:40px;">
        <p style="font-size:16px;line-height:1.8;color:#2a1f0e;margin-bottom:32px;">
          Hola ${firstName}, aquí tienes el resumen de tu árbol de marca personal. Guárdalo bien — es la base de todo lo que comuniques de ahora en adelante.
        </p>
        ${bloques || '<p style="color:#8a7355;font-style:italic;">Completa los módulos del playbook para ver tus respuestas aquí.</p>'}
        <div style="margin-top:40px;padding:32px;background:#1a1208;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:13px;color:#f5e6c8;margin-bottom:20px;">El siguiente paso es construirlo rodeado de personas como tú.</div>
          <a href="https://www.skool.com/una-buena-vida-comunidad-2471/about" style="display:inline-block;background:#c4522a;color:#f5e6c8;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;padding:14px 32px;text-decoration:none;">UNIRME A LA COMUNIDAD →</a>
        </div>
        <p style="font-size:13px;color:#8a7355;margin-top:32px;">— Jano Cabello<br>Escuela de Buena Vida</p>
      </div>
    </div>`;

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Jano Cabello <hola@janocabello.com>',
        to: [email],
        subject: `🌳 Tu Árbol de Marca Personal — ${firstName}`,
        html: informeHtml
      })
    });
    const emailData = await emailRes.json();
    console.log('📨 Email informe response:', emailRes.status, JSON.stringify(emailData));
  } catch(e) { console.error('Email error:', e); }

  // 3. Añadir contacto a Loops
  try {
    const loopsRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 9a678a7ee72f3acba3fadcfac468ff8b',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName: name.split(' ').slice(1).join(' ') || '',
        source: 'playbook-arbol'
      })
    });
    const loopsData = await loopsRes.json();
    console.log('🔄 Loops response:', loopsRes.status, JSON.stringify(loopsData));
  } catch(e) { console.error('Loops error:', e); }

  await sleep(600);
  // 4. Notificación a Jano
  try {
    const notifRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Playbook <hola@janocabello.com>',
        to: [JANO_EMAIL],
        subject: `🦍 Nuevo lead: ${name} (${email})`,
        html: `<p><strong>${name}</strong> (${email}) ha completado el playbook.</p><p>Campos rellenados: ${Object.keys(respuestas || {}).length}</p>`
      })
    });
    const notifData = await notifRes.json();
    console.log('🔔 Notif response:', notifRes.status, JSON.stringify(notifData));
  } catch(e) { console.error('Notify error:', e); }

  return res.status(200).json({ ok: true });
}
