export interface UpsertContactInput {
  email: string;
  name?: string;
  phone?: string;
  tags?: string[];
  customFields?: { id: string; value: string }[];
}

export interface CreateOpportunityInput {
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
}

export interface GHLContact {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface GHLOpportunity {
  id: string;
  [key: string]: unknown;
}

export interface ICRMService {
  createOrUpdateContact(input: UpsertContactInput): Promise<GHLContact>;
  createOpportunity(input: CreateOpportunityInput): Promise<GHLOpportunity>;
  updateOpportunityStage(input: {
    opportunityId: string;
    stageId: string;
  }): Promise<GHLOpportunity>;
}
