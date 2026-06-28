import type {
  AssistantsV1Assistant,
  AssistantsV1AssistantList,
  AssistantsV1AssistantWithToolsAndKnowledge,
  AssistantsV1Feedback,
  AssistantsV1FeedbackList,
  AssistantsV1Knowledge,
  AssistantsV1KnowledgeChunkList,
  AssistantsV1KnowledgeList,
  AssistantsV1KnowledgeStatus,
  AssistantsV1MessageList,
  AssistantsV1PolicyList,
  AssistantsV1SendMessageResponse,
  AssistantsV1Session,
  AssistantsV1SessionList,
  AssistantsV1Tool,
  AssistantsV1ToolList,
  AssistantsV1ToolWithPolicies,
  CreateAssistantsV1AssistantRequest,
  CreateAssistantsV1FeedbackRequest,
  CreateAssistantsV1KnowledgeRequest,
  CreateAssistantsV1SendMessageRequest,
  CreateAssistantsV1ToolRequest,
  ListAssistantsV1KnowledgeParams,
  ListAssistantsV1PageParams,
  ListAssistantsV1PolicyParams,
  ListAssistantsV1ToolParams,
  UpdateAssistantsV1AssistantRequest,
  UpdateAssistantsV1KnowledgeRequest,
  UpdateAssistantsV1ToolRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.assistantsV1.*` — Twilio Assistants v1 surface (Phase 5).
 *
 * Like the other `/v1/` namespaces this sits **outside** the
 * `/2010-04-01/Accounts/{Sid}/…` prefix; the account is resolved from HTTP
 * Basic auth. Unlike Voice v1 / Conversations v1, Assistants v1 uses
 * **JSON request bodies** (snake_case fields) and **PUT** for updates.
 */
export class AssistantsV1Resource {
  readonly assistants: AssistantsV1AssistantsCallable;
  readonly tools: AssistantsV1ToolsResource;
  readonly knowledge: AssistantsV1KnowledgeCallable;
  readonly sessions: AssistantsV1SessionsCallable;
  readonly policies: AssistantsV1PoliciesResource;

  constructor(transport: Transport) {
    this.assistants = makeAssistantsCallable(transport);
    this.tools = new AssistantsV1ToolsResource(transport);
    this.knowledge = makeKnowledgeCallable(transport);
    this.sessions = makeSessionsCallable(transport);
    this.policies = new AssistantsV1PoliciesResource(transport);
  }
}

// ===========================================================================
// Assistant-scoped nested sub-resources
// ===========================================================================

/** Sub-resource for `/v1/Assistants/{id}/Tools[/{toolId}]` (attach/detach + list). */
export class AssistantsV1AssistantToolsResource {
  private readonly t: Transport;
  private readonly assistantId: string;

  constructor(transport: Transport, assistantId: string) {
    this.t = transport;
    this.assistantId = assistantId;
  }

  private root(tail?: string): string {
    const base = `/v1/Assistants/${this.assistantId}/Tools`;
    return tail ? `${base}/${tail}` : base;
  }

  list(params: ListAssistantsV1PageParams = {}): Promise<AssistantsV1ToolList> {
    return this.t.request<AssistantsV1ToolList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async attach(toolId: string): Promise<void> {
    await this.t.request<void>({
      method: 'POST',
      path: this.root(toolId),
    });
  }

  async detach(toolId: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(toolId),
    });
  }
}

/** Sub-resource for `/v1/Assistants/{id}/Knowledge[/{knowledgeId}]` (attach/detach + list). */
export class AssistantsV1AssistantKnowledgeResource {
  private readonly t: Transport;
  private readonly assistantId: string;

  constructor(transport: Transport, assistantId: string) {
    this.t = transport;
    this.assistantId = assistantId;
  }

  private root(tail?: string): string {
    const base = `/v1/Assistants/${this.assistantId}/Knowledge`;
    return tail ? `${base}/${tail}` : base;
  }

  list(params: ListAssistantsV1PageParams = {}): Promise<AssistantsV1KnowledgeList> {
    return this.t.request<AssistantsV1KnowledgeList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async attach(knowledgeId: string): Promise<void> {
    await this.t.request<void>({
      method: 'POST',
      path: this.root(knowledgeId),
    });
  }

  async detach(knowledgeId: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(knowledgeId),
    });
  }
}

/** Sub-resource for `/v1/Assistants/{id}/Feedbacks`. */
export class AssistantsV1AssistantFeedbacksResource {
  private readonly t: Transport;
  private readonly assistantId: string;

  constructor(transport: Transport, assistantId: string) {
    this.t = transport;
    this.assistantId = assistantId;
  }

  private root(): string {
    return `/v1/Assistants/${this.assistantId}/Feedbacks`;
  }

  list(params: ListAssistantsV1PageParams = {}): Promise<AssistantsV1FeedbackList> {
    return this.t.request<AssistantsV1FeedbackList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(body: CreateAssistantsV1FeedbackRequest): Promise<AssistantsV1Feedback> {
    return this.t.request<AssistantsV1Feedback>({
      method: 'POST',
      path: this.root(),
      json: body,
    });
  }
}

/** Sub-resource for `/v1/Assistants/{id}/Messages` (send-message only). */
export class AssistantsV1AssistantMessagesResource {
  private readonly t: Transport;
  private readonly assistantId: string;

  constructor(transport: Transport, assistantId: string) {
    this.t = transport;
    this.assistantId = assistantId;
  }

  create(
    body: CreateAssistantsV1SendMessageRequest,
  ): Promise<AssistantsV1SendMessageResponse> {
    return this.t.request<AssistantsV1SendMessageResponse>({
      method: 'POST',
      path: `/v1/Assistants/${this.assistantId}/Messages`,
      json: body,
    });
  }
}

/** Per-assistant facade returned by `assistants(id)`. */
export class AssistantsV1AssistantScope {
  readonly tools: AssistantsV1AssistantToolsResource;
  readonly knowledge: AssistantsV1AssistantKnowledgeResource;
  readonly feedbacks: AssistantsV1AssistantFeedbacksResource;
  readonly messages: AssistantsV1AssistantMessagesResource;

  constructor(transport: Transport, assistantId: string) {
    this.tools = new AssistantsV1AssistantToolsResource(transport, assistantId);
    this.knowledge = new AssistantsV1AssistantKnowledgeResource(transport, assistantId);
    this.feedbacks = new AssistantsV1AssistantFeedbacksResource(transport, assistantId);
    this.messages = new AssistantsV1AssistantMessagesResource(transport, assistantId);
  }
}

/**
 * Shape of `client.assistantsV1.assistants`:
 *
 * - **Callable**: `assistants(assistantId)` returns an {@link AssistantsV1AssistantScope}
 *   carrying `.tools`, `.knowledge`, `.feedbacks`, `.messages`.
 * - **Methods**: top-level CRUD on `/v1/Assistants`.
 */
export type AssistantsV1AssistantsCallable = ((
  assistantId: string,
) => AssistantsV1AssistantScope) & {
  list(params?: ListAssistantsV1PageParams): Promise<AssistantsV1AssistantList>;
  create(body: CreateAssistantsV1AssistantRequest): Promise<AssistantsV1Assistant>;
  fetch(assistantId: string): Promise<AssistantsV1AssistantWithToolsAndKnowledge>;
  update(
    assistantId: string,
    body: UpdateAssistantsV1AssistantRequest,
  ): Promise<AssistantsV1Assistant>;
  delete(assistantId: string): Promise<void>;
};

function makeAssistantsCallable(transport: Transport): AssistantsV1AssistantsCallable {
  const fn = ((assistantId: string) =>
    new AssistantsV1AssistantScope(
      transport,
      assistantId,
    )) as AssistantsV1AssistantsCallable;

  fn.list = (params: ListAssistantsV1PageParams = {}) =>
    transport.request<AssistantsV1AssistantList>({
      method: 'GET',
      path: '/v1/Assistants',
      params,
    });

  fn.create = (body: CreateAssistantsV1AssistantRequest) =>
    transport.request<AssistantsV1Assistant>({
      method: 'POST',
      path: '/v1/Assistants',
      json: body,
    });

  fn.fetch = (assistantId: string) =>
    transport.request<AssistantsV1AssistantWithToolsAndKnowledge>({
      method: 'GET',
      path: `/v1/Assistants/${assistantId}`,
    });

  fn.update = (assistantId: string, body: UpdateAssistantsV1AssistantRequest) =>
    transport.request<AssistantsV1Assistant>({
      method: 'PUT',
      path: `/v1/Assistants/${assistantId}`,
      json: body,
    });

  fn.delete = async (assistantId: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `/v1/Assistants/${assistantId}`,
    });
  };

  return fn;
}

// ===========================================================================
// /v1/Tools — top-level CRUD
// ===========================================================================

export class AssistantsV1ToolsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListAssistantsV1ToolParams = {}): Promise<AssistantsV1ToolList> {
    return this.t.request<AssistantsV1ToolList>({
      method: 'GET',
      path: '/v1/Tools',
      params,
    });
  }

  create(body: CreateAssistantsV1ToolRequest): Promise<AssistantsV1Tool> {
    return this.t.request<AssistantsV1Tool>({
      method: 'POST',
      path: '/v1/Tools',
      json: body,
    });
  }

  fetch(id: string): Promise<AssistantsV1ToolWithPolicies> {
    return this.t.request<AssistantsV1ToolWithPolicies>({
      method: 'GET',
      path: `/v1/Tools/${id}`,
    });
  }

  update(
    id: string,
    body: UpdateAssistantsV1ToolRequest,
  ): Promise<AssistantsV1Tool> {
    return this.t.request<AssistantsV1Tool>({
      method: 'PUT',
      path: `/v1/Tools/${id}`,
      json: body,
    });
  }

  async delete(id: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Tools/${id}`,
    });
  }
}

// ===========================================================================
// /v1/Knowledge — top-level CRUD + Status + Chunks
// ===========================================================================

/** Sub-resource for `/v1/Knowledge/{id}/Status` (read-only). */
export class AssistantsV1KnowledgeStatusResource {
  private readonly t: Transport;
  private readonly knowledgeId: string;

  constructor(transport: Transport, knowledgeId: string) {
    this.t = transport;
    this.knowledgeId = knowledgeId;
  }

  fetch(): Promise<AssistantsV1KnowledgeStatus> {
    return this.t.request<AssistantsV1KnowledgeStatus>({
      method: 'GET',
      path: `/v1/Knowledge/${this.knowledgeId}/Status`,
    });
  }
}

/** Sub-resource for `/v1/Knowledge/{id}/Chunks` (list-only). */
export class AssistantsV1KnowledgeChunksResource {
  private readonly t: Transport;
  private readonly knowledgeId: string;

  constructor(transport: Transport, knowledgeId: string) {
    this.t = transport;
    this.knowledgeId = knowledgeId;
  }

  list(
    params: ListAssistantsV1PageParams = {},
  ): Promise<AssistantsV1KnowledgeChunkList> {
    return this.t.request<AssistantsV1KnowledgeChunkList>({
      method: 'GET',
      path: `/v1/Knowledge/${this.knowledgeId}/Chunks`,
      params,
    });
  }
}

/** Per-knowledge facade returned by `knowledge(id)`. */
export class AssistantsV1KnowledgeScope {
  readonly status: AssistantsV1KnowledgeStatusResource;
  readonly chunks: AssistantsV1KnowledgeChunksResource;

  constructor(transport: Transport, knowledgeId: string) {
    this.status = new AssistantsV1KnowledgeStatusResource(transport, knowledgeId);
    this.chunks = new AssistantsV1KnowledgeChunksResource(transport, knowledgeId);
  }
}

/**
 * Shape of `client.assistantsV1.knowledge`:
 *
 * - **Callable**: `knowledge(id)` returns an {@link AssistantsV1KnowledgeScope}
 *   carrying `.status.fetch()` and `.chunks.list()`.
 * - **Methods**: top-level CRUD on `/v1/Knowledge`.
 */
export type AssistantsV1KnowledgeCallable = ((
  knowledgeId: string,
) => AssistantsV1KnowledgeScope) & {
  list(
    params?: ListAssistantsV1KnowledgeParams,
  ): Promise<AssistantsV1KnowledgeList>;
  create(body: CreateAssistantsV1KnowledgeRequest): Promise<AssistantsV1Knowledge>;
  fetch(id: string): Promise<AssistantsV1Knowledge>;
  update(
    id: string,
    body: UpdateAssistantsV1KnowledgeRequest,
  ): Promise<AssistantsV1Knowledge>;
  delete(id: string): Promise<void>;
};

function makeKnowledgeCallable(transport: Transport): AssistantsV1KnowledgeCallable {
  const fn = ((knowledgeId: string) =>
    new AssistantsV1KnowledgeScope(
      transport,
      knowledgeId,
    )) as AssistantsV1KnowledgeCallable;

  fn.list = (params: ListAssistantsV1KnowledgeParams = {}) =>
    transport.request<AssistantsV1KnowledgeList>({
      method: 'GET',
      path: '/v1/Knowledge',
      params,
    });

  fn.create = (body: CreateAssistantsV1KnowledgeRequest) =>
    transport.request<AssistantsV1Knowledge>({
      method: 'POST',
      path: '/v1/Knowledge',
      json: body,
    });

  fn.fetch = (id: string) =>
    transport.request<AssistantsV1Knowledge>({
      method: 'GET',
      path: `/v1/Knowledge/${id}`,
    });

  fn.update = (id: string, body: UpdateAssistantsV1KnowledgeRequest) =>
    transport.request<AssistantsV1Knowledge>({
      method: 'PUT',
      path: `/v1/Knowledge/${id}`,
      json: body,
    });

  fn.delete = async (id: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `/v1/Knowledge/${id}`,
    });
  };

  return fn;
}

// ===========================================================================
// /v1/Sessions — list/fetch + nested Messages
// ===========================================================================

/** Sub-resource for `/v1/Sessions/{id}/Messages` (list-only). */
export class AssistantsV1SessionMessagesResource {
  private readonly t: Transport;
  private readonly sessionId: string;

  constructor(transport: Transport, sessionId: string) {
    this.t = transport;
    this.sessionId = sessionId;
  }

  list(params: ListAssistantsV1PageParams = {}): Promise<AssistantsV1MessageList> {
    return this.t.request<AssistantsV1MessageList>({
      method: 'GET',
      path: `/v1/Sessions/${this.sessionId}/Messages`,
      params,
    });
  }
}

/** Per-session facade returned by `sessions(id)`. */
export class AssistantsV1SessionScope {
  readonly messages: AssistantsV1SessionMessagesResource;

  constructor(transport: Transport, sessionId: string) {
    this.messages = new AssistantsV1SessionMessagesResource(transport, sessionId);
  }
}

/**
 * Shape of `client.assistantsV1.sessions`:
 *
 * - **Callable**: `sessions(sessionId)` returns an {@link AssistantsV1SessionScope}
 *   carrying `.messages.list()`.
 * - **Methods**: `.list()` and `.fetch(id)` on `/v1/Sessions`.
 *
 * Sessions cannot be created/updated/deleted via the REST surface.
 */
export type AssistantsV1SessionsCallable = ((
  sessionId: string,
) => AssistantsV1SessionScope) & {
  list(params?: ListAssistantsV1PageParams): Promise<AssistantsV1SessionList>;
  fetch(sessionId: string): Promise<AssistantsV1Session>;
};

function makeSessionsCallable(transport: Transport): AssistantsV1SessionsCallable {
  const fn = ((sessionId: string) =>
    new AssistantsV1SessionScope(
      transport,
      sessionId,
    )) as AssistantsV1SessionsCallable;

  fn.list = (params: ListAssistantsV1PageParams = {}) =>
    transport.request<AssistantsV1SessionList>({
      method: 'GET',
      path: '/v1/Sessions',
      params,
    });

  fn.fetch = (sessionId: string) =>
    transport.request<AssistantsV1Session>({
      method: 'GET',
      path: `/v1/Sessions/${sessionId}`,
    });

  return fn;
}

// ===========================================================================
// /v1/Policies — list-only
// ===========================================================================

export class AssistantsV1PoliciesResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListAssistantsV1PolicyParams = {}): Promise<AssistantsV1PolicyList> {
    return this.t.request<AssistantsV1PolicyList>({
      method: 'GET',
      path: '/v1/Policies',
      params,
    });
  }
}
