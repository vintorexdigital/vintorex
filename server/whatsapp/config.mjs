// WhatsApp settings, read from the environment each time so tests and hosts can change them.
// Keys come from the host's environment or from .env (see ../env.mjs and .env.example).
import '../env.mjs';

const env = (name, fallback = '') => process.env[name] || fallback;

export const config = {
  get graphVersion() { return env('GRAPH_API_VERSION', 'v26.0'); },
  // Permanent System User token with whatsapp_business_messaging and whatsapp_business_management.
  get token() { return env('WHATSAPP_TOKEN'); },
  get phoneNumberId() { return env('WHATSAPP_PHONE_NUMBER_ID'); },
  get wabaId() { return env('WHATSAPP_WABA_ID'); },
  get appId() { return env('META_APP_ID'); },
  get appSecret() { return env('META_APP_SECRET'); },
  get verifyToken() { return env('WEBHOOK_VERIFY_TOKEN'); },
  // Protects /api/whatsapp/send/*, /templates, /phone and /partner/*. Sent as x-api-key.
  get apiKey() { return env('WHATSAPP_API_KEY'); },
  get countryCode() { return env('DEFAULT_COUNTRY_CODE', '91'); },
  get forwardUrl() { return env('FORWARD_WEBHOOK_URL'); },
  get bot() { return /^(on|true|1)$/i.test(env('WHATSAPP_BOT')); },
  // Partner (Tech Provider / Solution Partner) settings, only for onboarding client WABAs.
  // Facebook Login for Business configuration with the WhatsApp Embedded Signup product (App dashboard → Facebook Login for Business).
  get signupConfigId() { return env('WHATSAPP_SIGNUP_CONFIG_ID'); },
  get creditLineId() { return env('WHATSAPP_CREDIT_LINE_ID'); },
};

// What is missing for each job, so the start-up line can say what is switched off.
export function missing() {
  const need = {
    send: ['token', 'phoneNumberId'],
    webhook: ['appSecret', 'verifyToken'],
    api: ['apiKey'],
    partner: ['appId', 'appSecret', 'token'],
    signup: ['appId', 'appSecret', 'token', 'signupConfigId', 'apiKey'],
  };
  return Object.fromEntries(Object.entries(need).map(([job, keys]) => [job, keys.filter(k => !config[k])]));
}
