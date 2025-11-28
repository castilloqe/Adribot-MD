const fetch = require('node-fetch');
const fs = require('fs');

const colores = {
  rojo: ['#F44336', '#FFCDD2'],
  azul: ['#00B4DB', '#0083B0'],
  verde: ['#4CAF50', '#C8E6C9'],
  rosa: ['#E91E63', '#F8BBD0'],
  morado: ['#9C27B0', '#E1BEE7'],
  negro: ['#212121', '#9E9E9E'],
  naranja: ['#FF9800', '#FFE0B2'],
  gris: ['#607D8B', '#CFD8DC'],
  celeste: ['#00FFFF', '#E0FFFF']
};

const flagMap = [
  ['598','🇺🇾'],['595','🇵🇾'],['593','🇪🇨'],['591','🇧🇴'],
  ['590','🇧🇶'],['509','🇭🇹'],['507','🇵🇦'],['506','🇨🇷'],
  ['505','🇳🇮'],['504','🇭🇳'],['503','🇸🇻'],['502','🇬🇹'],
  ['501','🇧🇿'],['599','🇨🇼'],['597','🇸🇷'],['596','🇬🇫'],
  ['594','🇬🇾'],['592','🇬🇾'],['549','🇦🇷'],['58','🇻🇪'],
  ['57','🇨🇴'],['56','🇨🇱'],['55','🇧🇷'],['54','🇦🇷'],
  ['53','🇨🇺'],['52','🇲🇽'],['51','🇵🇪'],['34','🇪🇸'],
  ['1','🇺🇸']
];

function numberWithFlag(num){
  const clean = num.replace(/[^0-9]/g, '');
  for (const [code, flag] of flagMap) {
    if (clean.startsWith(code)) return `${num} ${flag}`;
  }
  return num;
}

const quotedPush = q => (q?.pushName || q?.sender?.pushName || '');

async function niceName(jid, conn, chatId, qPush, fallback = '') {
  if (qPush && qPush.trim() && !/^\d+$/.test(qPush)) return qPush;

  if (chatId.endsWith('@g.us')) {
    try {
      const meta = await conn.groupMetadata(chatId);
      const p = meta.participants.find(p => p.id === jid);
      const n = p?.notify || p?.name;
      if (n && n.trim() && !/^\d+$/.test(n)) return n;
    } catch {}
  }

  try {
    const g = await conn.getName(jid);
    if (g && g.trim() && !/^\d+$/.test(g) && !g.includes('@')) return g;
  } catch {}

  const c = conn.contacts?.[jid];
  if (c?.notify && !/^\d+$/.test(c.notify)) return c.notify;
  if (c?.name && !/^\d+$/.test(c.name)) return c.name;

  if (fallback && fallback.trim() && !/^\d+$/.test(fallback)) return fallback;

  return numberWithFlag(jid.split('@')[0]);
}

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = context?.quotedMessage;

  let targetJid = msg.key.participant || msg.key.remoteJid;
  let quotedText = '';
  let quotedName = '';
  let fallbackPN = msg.pushName || '';

  if (quotedMsg && context?.participant) {
    targetJid = context.participant;
    quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
    quotedName = quotedPush(quotedMsg);
    fallbackPN = '';
  }

  const full = args.join(' ').trim();
  const firstWord = full.split(' ')[0].toLowerCase();
  const grad = colores[firstWord] || colores['azul'];

  let content = '';
  if (colores[firstWord]) {
    content = full.split(' ').slice(1).join(' ').trim() || quotedText;
  } else {
    content = full || quotedText;
  }

  if (!content)
    return conn.sendMessage(chatId, {
      text: `✏️ Usa el comando así:\n\n*.texto [color opcional] tu mensaje*\n\nColores:\nazul, rojo, verde, rosa, morado, negro, naranja, gris, celeste`
    }, { quoted: msg });

  const displayName = await niceName(targetJid, conn, chatId, quotedName, fallbackPN);

  let avatar = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
  try { avatar = await conn.profilePictureUrl(targetJid, "image"); } catch {}

  await conn.sendMessage(chatId, { react: { text: "🖼️", key: msg.key } });

  const api = `https://russell-api.onrender.com/api/canvas/texto?name=${encodeURIComponent(displayName)}&text=${encodeURIComponent(content)}&c1=${grad[0]}&c2=${grad[1]}&avatar=${encodeURIComponent(avatar)}`;

  const img = await fetch(api).then(r => r.buffer());

  await conn.sendMessage(chatId, {
    image: img,
    caption: "🖼 Generado por Azura Ultra"
  }, { quoted: msg });
};

handler.command = ['texto'];

module.exports = handler;
