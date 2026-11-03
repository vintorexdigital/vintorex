// What happens when WhatsApp tells us something. Edit freely.
// The auto-reply bot is off until WHATSAPP_BOT=on, so a new deployment never answers customers by surprise.
// Free-form replies are only allowed within 24 hours of the customer's last message; after that use a template.
import { BUSINESS } from '../../dist/js/data.js';
import { config } from './config.mjs';
import { WhatsAppClient } from './client.mjs';
import { bus } from './webhook.mjs';

const MENU = {
  body: `Welcome to ${BUSINESS.name} 👋\nHow can we help you today?`,
  buttons: [
    { id: 'svc_web', title: 'Website / App' },
    { id: 'svc_marketing', title: 'Digital Marketing' },
    { id: 'talk_human', title: 'Talk to us' },
  ],
  footer: 'Coimbatore • Tamil Nadu',
};

async function reply(wa, msg) {
  await wa.markAsRead(msg.id, { showTyping: true });
  if (msg.replyId) {
    switch (msg.replyId) {
      case 'svc_web':
        return wa.sendList(msg.from, {
          header: 'Web & App Development', body: 'Pick what you need and we will get back with a quote.', buttonText: 'Choose service',
          sections: [{ title: 'Services', rows: [
            { id: 'web_business', title: 'Business website', description: 'Fast, mobile-first site' },
            { id: 'web_ecom', title: 'E-commerce store', description: 'Catalogue, cart, payments' },
            { id: 'web_app', title: 'Mobile app', description: 'Android and iOS' },
          ] }],
        });
      case 'svc_marketing':
        return wa.sendCtaUrl(msg.from, { body: 'See our digital marketing packages and prices.', displayText: 'View packages', url: 'https://vintorex.com/services/' });
      case 'talk_human':
        return wa.sendText(msg.from, 'Thanks! A team member will reply here shortly. 🙏');
      default:
        return wa.sendText(msg.from, `Got it: "${msg.text}". We will contact you with details soon.`);
    }
  }
  if (msg.type === 'text') {
    if (/^(hi|hello|hey|hai|vanakkam|menu|start)\b/i.test(msg.text.trim())) return wa.sendButtons(msg.from, MENU);
    return wa.sendText(msg.from, 'Thanks for your message! Type *menu* to see options.', { replyTo: msg.id });
  }
  if (msg.mediaId) return wa.sendText(msg.from, `Received your ${msg.type}. 👍`, { replyTo: msg.id });
  if (msg.type === 'location') return wa.sendText(msg.from, '📍 Location received, thank you!');
}

bus.on('message', async msg => {
  console.log(`WhatsApp in: ${msg.from} (${msg.name || '?'}) ${msg.type}: ${msg.text ?? msg.replyId ?? msg.mediaId ?? ''}`);
  // The bot speaks only on our own number, never on a client's.
  if (!config.bot || msg.phoneNumberId !== config.phoneNumberId) return;
  try { await reply(new WhatsAppClient(), msg); }
  catch (err) { console.error('WhatsApp bot reply failed:', err.message, err.code ? `(code ${err.code})` : ''); }
});

// sent → delivered → read, or failed (see errors)
bus.on('status', s => {
  if (s.status === 'failed') console.warn(`WhatsApp ${s.id} to ${s.recipient} FAILED`, JSON.stringify(s.errors));
});

// message_template_status_update, phone_number_quality_update, account_update (a client finished or changed signup), ...
bus.on('other', e => console.log(`WhatsApp webhook ${e.field} (WABA ${e.wabaId}):`, JSON.stringify(e.value)));
