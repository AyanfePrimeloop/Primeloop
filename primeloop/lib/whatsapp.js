// Thin wrapper around Meta's WhatsApp Cloud API.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// IMPORTANT: WhatsApp does not allow free-form messages to be sent by a
// business unless the user messaged first within the last 24 hours. To send
// a proactive "new task available" alert, the message MUST use a
// pre-approved message template — this is a WhatsApp platform rule, not a
// limitation of this code. See GETTING_STARTED.md for how to create and
// submit one for approval before this will actually work.

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

export async function sendWhatsAppTemplate({ toNumber, templateName, params = [] }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp is not configured (missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN)');
  }

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber.replace(/\D/g, ''), // strip anything that isn't a digit
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: params.length
          ? [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: String(p) })) }]
          : [],
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error?.message || 'Unknown WhatsApp API error' };
  }
  return { ok: true, messageId: data.messages?.[0]?.id };
}
