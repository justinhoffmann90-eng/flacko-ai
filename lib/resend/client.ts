import { Resend } from "resend";

// Lazy-load Resend to avoid build-time errors
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "alerts@flacko.ai";

// Export for backwards compatibility
export const resend = { 
  emails: { 
    send: async (params: Parameters<Resend["emails"]["send"]>[0]) => getResend().emails.send(params) 
  },
  batch: {
    send: async (params: Parameters<Resend["batch"]["send"]>[0]) => getResend().batch.send(params)
  }
};
