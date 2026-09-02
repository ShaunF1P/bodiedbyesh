import {
  ICRMService,
  UpsertContactInput,
  CreateOpportunityInput,
  GHLContact,
  GHLOpportunity,
} from "@/lib/ports/ICRMService";
import { ghl } from "@/lib/ghl";

export class GoHighLevelCRMService implements ICRMService {
  async createOrUpdateContact(input: UpsertContactInput): Promise<GHLContact> {
    return ghl.createOrUpdateContact(input);
  }

  async createOpportunity(input: CreateOpportunityInput): Promise<GHLOpportunity> {
    return ghl.createOpportunity(input);
  }

  async updateOpportunityStage(input: {
    opportunityId: string;
    stageId: string;
  }): Promise<GHLOpportunity> {
    return ghl.updateOpportunityStage(input);
  }
}
