export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendSMSInput {
  to: string;
  body: string;
}

export interface ICommunicationService {
  sendEmail(input: SendEmailInput): Promise<boolean>;
  sendSMS(input: SendSMSInput): Promise<boolean>;
}
