import type {
  ICommunicationService,
  SendEmailInput,
  SendSMSInput,
} from "@/lib/ports/ICommunicationService";

export class MockCommunicationService implements ICommunicationService {
  public sentEmails: SendEmailInput[] = [];
  public sentSMS: SendSMSInput[] = [];

  async sendEmail(input: SendEmailInput): Promise<boolean> {
    this.sentEmails.push(input);
    return true;
  }

  async sendSMS(input: SendSMSInput): Promise<boolean> {
    this.sentSMS.push(input);
    return true;
  }
}
