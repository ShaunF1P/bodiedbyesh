/**
 * GoHighLevel (GHL) CRM API Client
 *
 * Uses Private Integration Token (PIT) auth against the LC services API.
 * Singleton exported at bottom — import `ghl` from "@/lib/ghl".
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Client Class ─────────────────────────────────────────────────────────────

class GHLClient {
  private apiKey: string;
  private locationId: string;

  constructor() {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    if (!apiKey || !locationId) {
      // Allow construction but methods will throw at call-time so the app
      // can still boot when GHL is not yet configured.
      console.warn(
        "[GHL] GHL_API_KEY or GHL_LOCATION_ID not set — API calls will fail."
      );
    }

    this.apiKey = apiKey ?? "";
    this.locationId = locationId ?? "";
  }

  // ── Private fetch wrapper with 429 retry ─────────────────────────────────

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("GHL_API_KEY is not configured");
    }

    const url = `${GHL_BASE}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Version: GHL_API_VERSION,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(url, { ...options, headers });

      // Rate-limited → back off and retry
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter =
          Number(res.headers.get("Retry-After")) || RETRY_DELAY_MS / 1000;
        console.warn(
          `[GHL] 429 rate-limited on ${path} — retrying in ${retryAfter}s (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `GHL API error ${res.status} on ${options.method ?? "GET"} ${path}: ${body}`
        );
      }

      return (await res.json()) as T;
    }

    // Should not reach here, but TypeScript needs a return
    throw new Error(`GHL API: exhausted retries on ${path}`);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Create or update a contact by email.
   * POST /contacts/upsert
   */
  async createOrUpdateContact(
    input: UpsertContactInput
  ): Promise<GHLContact> {
    const [firstName, ...rest] = (input.name ?? "").split(" ");
    const lastName = rest.join(" ");

    const payload: Record<string, unknown> = {
      locationId: this.locationId,
      email: input.email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: input.phone || undefined,
      tags: input.tags || [],
    };

    if (input.customFields && input.customFields.length > 0) {
      payload.customFields = input.customFields;
    }

    const data = await this.request<{ contact: GHLContact }>(
      "/contacts/upsert",
      { method: "POST", body: JSON.stringify(payload) }
    );

    return data.contact;
  }

  /**
   * Create a new opportunity (deal) in a pipeline.
   * POST /opportunities/
   */
  async createOpportunity(
    input: CreateOpportunityInput
  ): Promise<GHLOpportunity> {
    const payload = {
      pipelineId: input.pipelineId,
      pipelineStageId: input.stageId,
      contactId: input.contactId,
      name: input.name,
      status: "open",
    };

    const data = await this.request<{ opportunity: GHLOpportunity }>(
      "/opportunities/",
      { method: "POST", body: JSON.stringify(payload) }
    );

    return data.opportunity;
  }

  /**
   * Move an opportunity to a different stage.
   * PUT /opportunities/{id}
   */
  async updateOpportunityStage(input: {
    opportunityId: string;
    stageId: string;
  }): Promise<GHLOpportunity> {
    const data = await this.request<{ opportunity: GHLOpportunity }>(
      `/opportunities/${input.opportunityId}`,
      {
        method: "PUT",
        body: JSON.stringify({ pipelineStageId: input.stageId }),
      }
    );

    return data.opportunity;
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

export const ghl = new GHLClient();
