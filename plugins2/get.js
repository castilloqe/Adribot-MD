const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const handler = async (msg, { conn }) => {
  const rawID = conn.user?.id || "";
  const subbotID = rawID.split(":")[0] + "@s.whatsapp.net";

  const prefixPath = path.resolve("prefixes.json");
  let prefixes = {};
  if (fs.existsSync(prefixPath)) {
    prefixes = JSON.parse(fs.readFileSync(prefixPath, "utf-8"));
  }
  const usedPrefix = prefixes[subbotID] || ".";

  const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Error: Debes responder a un estado para descargarlo."
    }, { quoted: msg });
  }

  let mediaType, mediaMessage;
  if (quotedMsg.imageMessage) {
    mediaType = "image";
    mediaMessage = quotedMsg.imageMessage;
  } else if (quotedMsg.videoMessage) {
    mediaType = "video";
    mediaMessage = quotedMsg.videoMessage;
  } else if (quotedMsg.audioMessage) {
    mediaType = "audio";
    mediaMessage = quotedMsg.audioMessage;
  } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
    mediaType = "text";
    mediaMessage = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
  } else {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Solo puedes descargar imágenes, videos, audios o texto."
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  // --- TEXTO SIN CANVAS ---
  if (mediaType === "text") {
    return await conn.sendMessage(
      msg.key.remoteJid,
      {
        text: `📝 *Texto del estado:*\n\n${mediaMessage}`
      },
      { quoted: msg }
    );
  }

  // --- DESCARGA MEDIA ---
  const mediaStream = await new Promise(async (resolve, reject) => {
    try {
      const stream = await downloadContentFromMessage(mediaMessage, mediaType);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      resolve(buffer);
    } catch {
      reject(null);
    }
  });

  if (!mediaStream || mediaStream.length === 0) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ No se pudo descargar el estado."
    }, { quoted: msg });
  }

  let messageOptions = { mimetype: mediaMessage.mimetype };
  if (mediaType === "image") messageOptions.image = mediaStream;
  if (mediaType === "video") messageOptions.video = mediaStream;
  if (mediaType === "audio") {
    messageOptions.audio = mediaStream;
    messageOptions.mimetype = "audio/mpeg";
  }

  await conn.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ["get"];
module.exports = handler;
