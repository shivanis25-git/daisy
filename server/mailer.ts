import dotenv from 'dotenv';
dotenv.config();

export interface SendMailParams {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailerResult {
  messageId: string;
  response: string;
  accepted: string[];
  rejected: string[];
  isRealSmtp: boolean;
}

export async function sendMail(
  params: SendMailParams
): Promise<MailerResult> {

  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is missing');
  }

  const sender = {
    name: params.fromName,
    email: params.from,
  };

  const recipient = {
    name: params.toName,
    email: params.to,
  };

  const payload = {
    sender,
    to: [recipient],
    subject: params.subject,
    textContent: params.text,
    htmlContent: params.html ||
      `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;">
        ${params.text.replace(/\n/g, '<br/>')}
      </div>`,
  };

  try {
    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[Daisy Mailer] Brevo API Error:', result);

      throw new Error(
        result.message || `Brevo API failed: ${response.status}`
      );
    }

    console.log(
      '[Daisy Mailer] Email accepted by Brevo:',
      result.messageId
    );

    return {
      messageId: result.messageId,
      response: `Accepted by Brevo: ${result.messageId}`,
      accepted: [params.to],
      rejected: [],
      isRealSmtp: true,
    };

  } catch (err: any) {
    console.error('[Daisy Mailer] Send error:', err);

    throw new Error(
      `Brevo email delivery failed: ${err.message || 'Unknown error'}`
    );
  }
}