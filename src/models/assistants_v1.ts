/**
 * VoiceML Assistants v1 (assistants.twilio.com/v1) resource models.
 *
 * Twilio-parity AI-Assistants surface (Phase 5). Unlike the form-encoded
 * `/2010-04-01/Accounts/.../` and `/v1/Conversations` surfaces, the Assistants
 * v1 family uses **snake_case JSON** request bodies and `PUT` (not `POST`) for
 * updates. Query parameters on list ops are PascalCase per Twilio convention.
 *
 * Identifiers are prefixed strings (`aia_asst_…`, `aia_tool_…`, `aia_know_…`,
 * `aia_msg_…`, `aia_fdbk_…`, `aia_plcy_…`), not the legacy 34-char hex Sids
 * used elsewhere.
 *
 * List responses carry the {@link VoiceV1Meta} envelope (re-exported).
 */

import type { VoiceV1Meta } from './voice_v1.js';

// ===========================================================================
// Assistant — /v1/Assistants
// ===========================================================================

/** A Twilio-compatible AI Assistant (`aia_asst_…`). */
export interface AssistantsV1Assistant {
  account_sid: string;
  customer_ai: Record<string, unknown>;
  id: string;
  model: string;
  name: string;
  owner: string;
  url?: string;
  personality_prompt: string;
  date_created: string;
  date_updated: string;
}

export interface AssistantsV1AssistantList {
  assistants: AssistantsV1Assistant[];
  meta: VoiceV1Meta;
}

/** Expanded variant returned by `GET /v1/Assistants/{id}` (carries nested tools and knowledge). */
export interface AssistantsV1AssistantWithToolsAndKnowledge {
  account_sid: string;
  customer_ai: Record<string, unknown>;
  id: string;
  model: string;
  name: string;
  owner: string;
  url?: string;
  personality_prompt: string;
  date_created: string;
  date_updated: string;
  tools: AssistantsV1Tool[];
  knowledge: AssistantsV1Knowledge[];
}

export interface AssistantsV1AssistantCustomerAi {
  perception_engine_enabled?: boolean;
  personalization_engine_enabled?: boolean;
}

export interface CreateAssistantsV1AssistantRequest {
  name: string;
  owner?: string;
  personality_prompt?: string;
  /** VoiceML extension: BYO-LLM model backing the assistant. */
  model?: string;
  customer_ai?: AssistantsV1AssistantCustomerAi;
  segment_credential?: Record<string, unknown>;
}

export interface UpdateAssistantsV1AssistantRequest {
  name?: string;
  owner?: string;
  personality_prompt?: string;
  /** VoiceML extension: BYO-LLM model backing the assistant. */
  model?: string;
  customer_ai?: Record<string, unknown>;
  segment_credential?: Record<string, unknown>;
}

// ===========================================================================
// Tool — /v1/Tools (+ /v1/Assistants/{id}/Tools)
// ===========================================================================

/** A Twilio-compatible Tool definition (`aia_tool_…`). */
export interface AssistantsV1Tool {
  account_sid?: string;
  description: string;
  enabled: boolean;
  id: string;
  meta: Record<string, unknown>;
  name: string;
  requires_auth: boolean;
  type: string;
  url?: string;
  date_created: string;
  date_updated: string;
}

export interface AssistantsV1ToolList {
  tools: AssistantsV1Tool[];
  meta: VoiceV1Meta;
}

/** Expanded variant returned by `GET /v1/Tools/{id}` (carries materialised policies). */
export interface AssistantsV1ToolWithPolicies {
  account_sid?: string;
  description: string;
  enabled: boolean;
  id: string;
  meta: Record<string, unknown>;
  name: string;
  requires_auth: boolean;
  type: string;
  url?: string;
  date_created: string;
  date_updated: string;
  policies?: AssistantsV1Policy[];
}

export interface CreateAssistantsV1ToolRequest {
  name: string;
  type: string;
  enabled: boolean;
  assistant_id?: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface UpdateAssistantsV1ToolRequest {
  name?: string;
  type?: string;
  enabled?: boolean;
  description?: string;
  meta?: Record<string, unknown>;
}

// ===========================================================================
// Knowledge — /v1/Knowledge (+ /Status, /Chunks, /v1/Assistants/{id}/Knowledge)
// ===========================================================================

/** A Twilio-compatible Knowledge resource (`aia_know_…`). */
export interface AssistantsV1Knowledge {
  description?: string;
  id: string;
  account_sid?: string;
  knowledge_source_details?: Record<string, unknown>;
  name: string;
  status?: string;
  type: string;
  url?: string;
  embedding_model?: string;
  date_created: string;
  date_updated: string;
}

export interface AssistantsV1KnowledgeList {
  knowledge: AssistantsV1Knowledge[];
  meta: VoiceV1Meta;
}

/** Read-only ingestion status returned by `GET /v1/Knowledge/{id}/Status`. */
export interface AssistantsV1KnowledgeStatus {
  account_sid?: string;
  status: string;
  last_status?: string;
  date_updated?: string;
}

/** A single retrieval chunk returned by `GET /v1/Knowledge/{id}/Chunks`. */
export interface AssistantsV1KnowledgeChunk {
  account_sid?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  date_created?: string;
  date_updated?: string;
}

export interface AssistantsV1KnowledgeChunkList {
  chunks: AssistantsV1KnowledgeChunk[];
  meta: VoiceV1Meta;
}

export interface CreateAssistantsV1KnowledgeRequest {
  name: string;
  type: string;
  assistant_id?: string;
  description?: string;
  embedding_model?: string;
  knowledge_source_details?: Record<string, unknown>;
}

export interface UpdateAssistantsV1KnowledgeRequest {
  name?: string;
  type?: string;
  description?: string;
  embedding_model?: string;
  knowledge_source_details?: Record<string, unknown>;
}

// ===========================================================================
// Session + Message — /v1/Sessions[, /Messages], /v1/Assistants/{id}/Messages
// ===========================================================================

/** A Twilio-compatible Assistants Session. */
export interface AssistantsV1Session {
  id?: string;
  account_sid?: string;
  assistant_id?: string;
  verified?: boolean;
  identity?: string;
  date_created?: string;
  date_updated?: string;
}

export interface AssistantsV1SessionList {
  sessions: AssistantsV1Session[];
  meta: VoiceV1Meta;
}

/** A Twilio-compatible Assistants Message (`aia_msg_…`). */
export interface AssistantsV1Message {
  id?: string;
  account_sid?: string;
  assistant_id?: string;
  session_id?: string;
  identity?: string;
  role?: string;
  content?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  date_created?: string;
  date_updated?: string;
}

export interface AssistantsV1MessageList {
  messages: AssistantsV1Message[];
  meta: VoiceV1Meta;
}

/** Result of `POST /v1/Assistants/{id}/Messages` — synchronous send result. */
export interface AssistantsV1SendMessageResponse {
  status: string;
  flagged?: boolean;
  aborted?: boolean;
  session_id: string;
  account_sid: string;
  body?: string;
  error?: string;
}

export interface CreateAssistantsV1SendMessageRequest {
  identity: string;
  body: string;
  session_id?: string;
  webhook?: string;
  mode?: string;
}

// ===========================================================================
// Feedback — /v1/Assistants/{id}/Feedbacks
// ===========================================================================

/** A Twilio-compatible Assistants Feedback record (`aia_fdbk_…`). */
export interface AssistantsV1Feedback {
  assistant_id: string;
  id: string;
  account_sid?: string;
  user_sid?: string;
  message_id: string;
  score: number;
  session_id: string;
  text: string;
  date_created: string;
  date_updated: string;
}

export interface AssistantsV1FeedbackList {
  feedbacks: AssistantsV1Feedback[];
  meta: VoiceV1Meta;
}

export interface CreateAssistantsV1FeedbackRequest {
  session_id: string;
  message_id?: string;
  score?: number;
  text?: string;
}

// ===========================================================================
// Policy — /v1/Policies (read-only)
// ===========================================================================

/** A materialised Assistants Policy (`aia_plcy_…`). Read-only. */
export interface AssistantsV1Policy {
  id?: string;
  name?: string;
  description?: string;
  account_sid?: string;
  user_sid?: string;
  type: string;
  policy_details: Record<string, unknown>;
  date_created?: string;
  date_updated?: string;
}

export interface AssistantsV1PolicyList {
  policies: AssistantsV1Policy[];
  meta: VoiceV1Meta;
}

// ===========================================================================
// List page params
// ===========================================================================

/**
 * Standard page params shared by `/v1/Assistants`, `/v1/Sessions`,
 * `/v1/Sessions/{id}/Messages`, `/v1/Assistants/{id}/Tools`,
 * `/v1/Assistants/{id}/Knowledge`, `/v1/Knowledge/{id}/Chunks`, and
 * `/v1/Assistants/{id}/Feedbacks`.
 */
export interface ListAssistantsV1PageParams {
  PageSize?: number;
  Page?: number;
  PageToken?: string;
  // Index signature so the interface satisfies the transport's
  // `params: Record<string, unknown>` constraint without a cast.
  [key: string]: unknown;
}

/** Filterable list params for `/v1/Tools` (optional `AssistantId`). */
export interface ListAssistantsV1ToolParams {
  AssistantId?: string;
  PageSize?: number;
  [key: string]: unknown;
}

/** Filterable list params for `/v1/Knowledge` (optional `AssistantId`). */
export interface ListAssistantsV1KnowledgeParams {
  AssistantId?: string;
  PageSize?: number;
  [key: string]: unknown;
}

/** Filterable list params for `/v1/Policies` (optional `ToolId`/`KnowledgeId`). */
export interface ListAssistantsV1PolicyParams {
  ToolId?: string;
  KnowledgeId?: string;
  PageSize?: number;
  [key: string]: unknown;
}
