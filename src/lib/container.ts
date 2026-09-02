import { IAIService } from "@/lib/ports/IAIService";
import { ICommunicationService } from "@/lib/ports/ICommunicationService";
import { ICRMService } from "@/lib/ports/ICRMService";
import { IPaymentService } from "@/lib/ports/IPaymentService";
import { GeminiAIService } from "@/lib/adapters/GeminiAIService";
import { CommunicationService } from "@/lib/adapters/CommunicationService";
import { GoHighLevelCRMService } from "@/lib/adapters/GoHighLevelCRMService";
import { StripePaymentService } from "@/lib/adapters/StripePaymentService";

export class ServiceContainer {
  private _aiService: IAIService | null = null;
  private _communicationService: ICommunicationService | null = null;
  private _crmService: ICRMService | null = null;
  private _paymentService: IPaymentService | null = null;

  get aiService(): IAIService {
    if (!this._aiService) {
      this._aiService = new GeminiAIService();
    }
    return this._aiService;
  }

  set aiService(service: IAIService) {
    this._aiService = service;
  }

  get communicationService(): ICommunicationService {
    if (!this._communicationService) {
      this._communicationService = new CommunicationService();
    }
    return this._communicationService;
  }

  set communicationService(service: ICommunicationService) {
    this._communicationService = service;
  }

  get crmService(): ICRMService {
    if (!this._crmService) {
      this._crmService = new GoHighLevelCRMService();
    }
    return this._crmService;
  }

  set crmService(service: ICRMService) {
    this._crmService = service;
  }

  get paymentService(): IPaymentService {
    if (!this._paymentService) {
      this._paymentService = new StripePaymentService();
    }
    return this._paymentService;
  }

  set paymentService(service: IPaymentService) {
    this._paymentService = service;
  }

  reset() {
    this._aiService = null;
    this._communicationService = null;
    this._crmService = null;
    this._paymentService = null;
  }
}

export const container = new ServiceContainer();
