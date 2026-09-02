import type {
  ICRMService,
  UpsertContactInput,
  CreateOpportunityInput,
  GHLContact,
  GHLOpportunity,
} from "@/lib/ports/ICRMService";

export class MockCRMService implements ICRMService {
  public contacts: Map<string, GHLContact> = new Map();
  public opportunities: Map<string, GHLOpportunity> = new Map();

  async createOrUpdateContact(input: UpsertContactInput): Promise<GHLContact> {
    const id = `mock_contact_${Date.now()}`;
    const contact: GHLContact = {
      id,
      email: input.email,
      name: input.name,
      phone: input.phone,
      tags: input.tags,
    };
    this.contacts.set(input.email, contact);
    return contact;
  }

  async createOpportunity(input: CreateOpportunityInput): Promise<GHLOpportunity> {
    const id = `mock_opp_${Date.now()}`;
    const opportunity: GHLOpportunity = {
      id,
      contactId: input.contactId,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      name: input.name,
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunityStage(input: {
    opportunityId: string;
    stageId: string;
  }): Promise<GHLOpportunity> {
    const existing = this.opportunities.get(input.opportunityId);
    const updated: GHLOpportunity = {
      id: input.opportunityId,
      stageId: input.stageId,
      ...(existing || {}),
    };
    this.opportunities.set(input.opportunityId, updated);
    return updated;
  }
}
