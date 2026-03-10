export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, respuestas } = req.body;
  console.log('📥 Lead recibido:', { name, email, campos: Object.keys(respuestas || {}).length });

  if (!name || !email) return res.status(400).json({ error: 'Faltan datos' });

  const API_KEY = process.env.RESEND_API_KEY;
  const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  const JANO_EMAIL = process.env.JANO_EMAIL;
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const firstName = name.split(' ')[0];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Etiquetas legibles para cada campo
  const labels = {
    step_1: 'Pregunta 1', step_2: 'Pregunta 2', step_3: 'Pregunta 3', step_4: 'Pregunta 4',
    ws_1: '🌱 Propósito (síntesis)',
    step_5: 'Pregunta 5', step_6: 'Pregunta 6', step_7: 'Pregunta 7', step_8: 'Pregunta 8',
    ws_2: '🌿 Identidad (síntesis)',
    step_9: 'Pregunta 9', step_10: 'Pregunta 10', step_11: 'Pregunta 11',
    ws_3: '🪵 Posicionamiento (síntesis)',
    step_12: 'Pregunta 12', step_13: 'Pregunta 13', step_14: 'Pregunta 14', step_15: 'Pregunta 15',
    ws_4: '🌲 Diferenciación (síntesis)',
    step_16: 'Pregunta 16', step_17: 'Pregunta 17', step_18: 'Pregunta 18', step_19: 'Pregunta 19',
    ws_5: '☁️ Percepción (síntesis)',
    step_20: 'Pregunta 20', step_21: 'Pregunta 21', step_22: 'Pregunta 22',
    ws_6: '🍎 Impacto (síntesis)',
    step_23: 'Pregunta 23', step_24: 'Pregunta 24', step_25: 'Pregunta 25',
    ws_7: '🌍 Contexto (síntesis)',
    step_26: 'Pregunta 26', step_27: 'Pregunta 27', step_28: 'Pregunta 28', step_29: 'Pregunta 29',
    ws_8: '⏳ Paciencia (síntesis)',
    step_30: 'Pregunta 30', step_31: 'Pregunta 31', step_32: 'Pregunta 32', step_33: 'Pregunta 33',
    ws_9: '📦 Oferta (síntesis)',
    guion_1: 'Guión 1', guion_2: 'Guión 2', guion_3: 'Guión 3', guion_4: 'Guión 4',
    guion_5: 'Guión 5', guion_6: 'Guión 6', guion_7: 'Guión 7', guion_8: 'Guión 8',
    guion_9: 'Guión 9', guion_10: 'Guión 10', guion_11: 'Guión 11', guion_12: 'Guión 12',
    guion_13: 'Guión 13', guion_14: 'Guión 14',
    foto_final: '📸 Fotografía Final'
  };

  // Construir bloques HTML del email con TODAS las respuestas
  let bloques = '';
  for (const [key, label] of Object.entries(labels)) {
    if (respuestas && respuestas[key]) {
      bloques += `
        <div style="margin-bottom:20px;padding:16px 20px;background:#f9f4ec;border-left:4px solid #c4522a;">
          <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4522a;margin-bottom:6px;">${label}</div>
          <div style="font-size:14px;line-height:1.7;color:#2a1f0e;">${respuestas[key].split('\n').join('<br>')}</div>
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
          Hola ${firstName}, aquí tienes el resumen completo de tu árbol de marca personal. Guárdalo bien — es la base de todo lo que comuniques de ahora en adelante.
        </p>
        ${bloques || '<p style="color:#8a7355;font-style:italic;">No se encontraron respuestas.</p>'}
        <div style="margin-top:40px;padding:32px;background:#1a1208;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:13px;color:#f5e6c8;margin-bottom:20px;">El siguiente paso es construirlo rodeado de personas como tú.</div>
          <a href="https://www.skool.com/una-buena-vida-comunidad-2471/about" style="display:inline-block;background:#c4522a;color:#f5e6c8;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;padding:14px 32px;text-decoration:none;">UNIRME A LA COMUNIDAD →</a>
        </div>
        <p style="font-size:13px;color:#8a7355;margin-top:32px;">— Jano Cabello<br>Escuela de Buena Vida</p>
      </div>
    </div>`;

  // 1. Añadir contacto al Audience de Resend
  try {
    const audRes = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, first_name: firstName,
        last_name: name.split(' ').slice(1).join(' ') || '',
        unsubscribed: false
      })
    });
    console.log('👥 Audience:', audRes.status);
  } catch(e) { console.error('Audience error:', e); }

  await sleep(400);

  // 2. Email con informe completo al usuario
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Jano Cabello <hola@janocabello.com>',
        to: [email],
        subject: `🌳 Tu Árbol de Marca Personal — ${firstName}`,
        html: informeHtml
      })
    });
    const emailData = await emailRes.json();
    console.log('📨 Email informe:', emailRes.status, JSON.stringify(emailData));
  } catch(e) { console.error('Email error:', e); }

  // 3. Loops: crear contacto + disparar secuencia
  try {
    await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer 9a678a7ee72f3acba3fadcfac468ff8b', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName: name.split(' ').slice(1).join(' ') || '', source: 'playbook-arbol' })
    });
    const loopsRes = await fetch('https://app.loops.so/api/v1/events/send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer 9a678a7ee72f3acba3fadcfac468ff8b', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, eventName: 'contact.created' })
    });
    console.log('🔄 Loops:', loopsRes.status);
  } catch(e) { console.error('Loops error:', e); }

  await sleep(400);

  // 4. Guardar en Notion — propiedades resumen + TODAS las respuestas en el cuerpo
  try {
    // Propiedades principales (columnas de la base de datos)
    const notionProperties = {
      'Nombre':             { title:     [{ text: { content: name } }] },
      'Email':              { email:     email },
      'Módulos completados':{ number:    Object.keys(respuestas || {}).length },
      '🌱 Propósito':       { rich_text: [{ text: { content: (respuestas?.ws_1 || '').substring(0, 2000) } }] },
      '🌿 Identidad':       { rich_text: [{ text: { content: (respuestas?.ws_2 || '').substring(0, 2000) } }] },
      '🪵 Posicionamiento': { rich_text: [{ text: { content: (respuestas?.ws_3 || '').substring(0, 2000) } }] },
      '🌲 Diferenciación':  { rich_text: [{ text: { content: (respuestas?.ws_4 || '').substring(0, 2000) } }] },
      '☁️ Percepción':      { rich_text: [{ text: { content: (respuestas?.ws_5 || '').substring(0, 2000) } }] },
      '🍎 Impacto':         { rich_text: [{ text: { content: (respuestas?.ws_6 || '').substring(0, 2000) } }] },
      '🌍 Contexto':        { rich_text: [{ text: { content: (respuestas?.ws_7 || '').substring(0, 2000) } }] },
      '⏳ Paciencia':       { rich_text: [{ text: { content: (respuestas?.ws_8 || '').substring(0, 2000) } }] },
      '📦 Oferta':          { rich_text: [{ text: { content: (respuestas?.ws_9 || '').substring(0, 2000) } }] }
    };

    // Cuerpo de la página con TODAS las respuestas
    const notionChildren = [];
    for (const [key, label] of Object.entries(labels)) {
      if (respuestas && respuestas[key]) {
        notionChildren.push({
          object: 'block', type: 'heading_3',
          heading_3: { rich_text: [{ type: 'text', text: { content: label } }] }
        });
        notionChildren.push({
          object: 'block', type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: respuestas[key].substring(0, 2000) } }] }
        });
      }
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: 'e86c957e-a793-4d83-ade3-32754e417acd' },
        properties: notionProperties,
        children: notionChildren
      })
    });
    const notionData = await notionRes.json();
    console.log('📓 Notion:', notionRes.status, JSON.stringify(notionData).substring(0, 200));
  } catch(e) { console.error('Notion error:', e); }

  // 5. Notificación a Jano
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Playbook <hola@janocabello.com>',
        to: [JANO_EMAIL],
        subject: `🦍 Nuevo lead: ${name} (${email})`,
        html: `<p><strong>${name}</strong> (${email}) ha completado el playbook.</p><p>Campos rellenados: ${Object.keys(respuestas || {}).length}</p>`
      })
    });
  } catch(e) { console.error('Notify error:', e); }

  return res.status(200).json({ ok: true });
}
