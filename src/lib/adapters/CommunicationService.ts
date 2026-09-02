import {
  ICommunicationService,
  SendEmailInput,
  SendSMSInput,
} from "@/lib/ports/ICommunicationService";
import { sendEmail } from "@/lib/mail";
import { sendSMS } from "@/lib/sms";

export class CommunicationService implements ICommunicationService {
  async sendEmail(input: SendEmailInput): Promise<boolean> {
    return sendEmail(input);
  }

  async sendSMS(input: SendSMSInput): Promise<boolean> {
    return sendSMS(input);
  }
}
