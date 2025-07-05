const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin, isOwner }) => {
  if (!m.isGroup) {
    global.dfail('group', m, conn)
    throw false
  }
  if (!isAdmin && !isOwner) {
    global.dfail('admin', m, conn)
    throw false
  }
  if (!isBotAdmin) {
    global.dfail('botAdmin', m, conn)
    throw false
  }

  const users = participants.map(p => p.id)
  const commandUsed = m.text?.split(' ')[0] || ''
  const mensaje = text?.replace(new RegExp(`^${commandUsed}`, 'i'), '').trim()
  const options = { mentions: users, quoted: m }

  if (m.quoted) {
    const quoted = m.quoted
    const mime = (quoted.msg || quoted).mimetype || ''
    const media = /image|video|sticker|audio/.test(mime) ? await quoted.download() : null

    if (/image/.test(mime)) {
      return conn.sendMessage(m.chat, { image: media, caption: mensaje, ...options })
    } else if (/video/.test(mime)) {
      return conn.sendMessage(m.chat, { video: media, caption: mensaje, mimetype: 'video/mp4', ...options })
    } else if (/audio/.test(mime)) {
      return conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/mpeg', ptt: true, ...options })
    } else if (/sticker/.test(mime)) {
      return conn.sendMessage(m.chat, { sticker: media, ...options })
    } else {
      const citado = quoted.text || quoted.body || mensaje
      return conn.sendMessage(m.chat, { text: citado, ...options })
    }
  }

  if (mensaje) {
    return conn.sendMessage(m.chat, { text: mensaje, ...options })
  }
}

handler.help = ['hidetag']
handler.tags = ['group']
handler.command = /^(hidetag|notify|noti|notificar|n)$/i
handler.group = true

export default handler