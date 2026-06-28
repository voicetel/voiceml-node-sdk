import type {
  ConversationsV1ConfigAddress,
  ConversationsV1ConfigAddressList,
  ConversationsV1Configuration,
  ConversationsV1ConfigurationWebhook,
  ConversationsV1Conversation,
  ConversationsV1ConversationList,
  ConversationsV1ConversationMessage,
  ConversationsV1ConversationMessageList,
  ConversationsV1ConversationMessageReceipt,
  ConversationsV1ConversationMessageReceiptList,
  ConversationsV1ConversationParticipant,
  ConversationsV1ConversationParticipantList,
  ConversationsV1ConversationScopedWebhook,
  ConversationsV1ConversationScopedWebhookList,
  ConversationsV1ConversationWithParticipants,
  ConversationsV1Credential,
  ConversationsV1CredentialList,
  ConversationsV1ParticipantConversationList,
  ConversationsV1Role,
  ConversationsV1RoleList,
  ConversationsV1Service,
  ConversationsV1ServiceBinding,
  ConversationsV1ServiceBindingList,
  ConversationsV1ServiceConfiguration,
  ConversationsV1ServiceConversation,
  ConversationsV1ServiceConversationList,
  ConversationsV1ServiceConversationMessage,
  ConversationsV1ServiceConversationMessageList,
  ConversationsV1ServiceConversationMessageReceipt,
  ConversationsV1ServiceConversationMessageReceiptList,
  ConversationsV1ServiceConversationParticipant,
  ConversationsV1ServiceConversationParticipantList,
  ConversationsV1ServiceConversationScopedWebhook,
  ConversationsV1ServiceConversationScopedWebhookList,
  ConversationsV1ServiceConversationWithParticipants,
  ConversationsV1ServiceList,
  ConversationsV1ServiceNotification,
  ConversationsV1ServiceParticipantConversationList,
  ConversationsV1ServiceRole,
  ConversationsV1ServiceRoleList,
  ConversationsV1ServiceUser,
  ConversationsV1ServiceUserConversationList,
  ConversationsV1ServiceUserList,
  ConversationsV1ServiceWebhookConfiguration,
  ConversationsV1User,
  ConversationsV1UserConversation,
  ConversationsV1UserConversationList,
  ConversationsV1UserList,
  CreateConversationsV1ConfigAddressRequest,
  CreateConversationsV1ConversationMessageRequest,
  CreateConversationsV1ConversationParticipantRequest,
  CreateConversationsV1ConversationRequest,
  CreateConversationsV1ConversationScopedWebhookRequest,
  CreateConversationsV1ConversationWithParticipantsRequest,
  CreateConversationsV1CredentialRequest,
  CreateConversationsV1RoleRequest,
  CreateConversationsV1ServiceConversationMessageRequest,
  CreateConversationsV1ServiceConversationParticipantRequest,
  CreateConversationsV1ServiceConversationRequest,
  CreateConversationsV1ServiceConversationScopedWebhookRequest,
  CreateConversationsV1ServiceConversationWithParticipantsRequest,
  CreateConversationsV1ServiceRequest,
  CreateConversationsV1ServiceRoleRequest,
  CreateConversationsV1ServiceUserRequest,
  CreateConversationsV1UserRequest,
  ListConversationsV1PageParams,
  ListConversationsV1ParticipantConversationParams,
  ListConversationsV1ServiceBindingParams,
  ListConversationsV1ServiceParticipantConversationParams,
  UpdateConversationsV1ConfigAddressRequest,
  UpdateConversationsV1ConfigurationRequest,
  UpdateConversationsV1ConfigurationWebhookRequest,
  UpdateConversationsV1ConversationMessageRequest,
  UpdateConversationsV1ConversationParticipantRequest,
  UpdateConversationsV1ConversationRequest,
  UpdateConversationsV1ConversationScopedWebhookRequest,
  UpdateConversationsV1CredentialRequest,
  UpdateConversationsV1RoleRequest,
  UpdateConversationsV1ServiceConfigurationRequest,
  UpdateConversationsV1ServiceConversationMessageRequest,
  UpdateConversationsV1ServiceConversationParticipantRequest,
  UpdateConversationsV1ServiceConversationRequest,
  UpdateConversationsV1ServiceConversationScopedWebhookRequest,
  UpdateConversationsV1ServiceNotificationRequest,
  UpdateConversationsV1ServiceRoleRequest,
  UpdateConversationsV1ServiceUserRequest,
  UpdateConversationsV1ServiceWebhookConfigurationRequest,
  UpdateConversationsV1UserConversationRequest,
  UpdateConversationsV1UserRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.conversationsV1.*` — Twilio Conversations v1 surface.
 *
 * The `/v1/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix.
 * The account is resolved from HTTP Basic auth.
 */
export class ConversationsV1Resource {
  readonly conversations: ConversationsV1ConversationsResource;
  readonly roles: ConversationsV1RolesResource;
  readonly users: ConversationsV1UsersCallable;
  readonly credentials: ConversationsV1CredentialsResource;
  readonly configuration: ConversationsV1ConfigurationResource;
  readonly participantConversations: ConversationsV1ParticipantConversationsResource;
  readonly conversationWithParticipants: ConversationsV1ConversationWithParticipantsResource;
  readonly services: ConversationsV1ServicesCallable;

  constructor(transport: Transport) {
    this.conversations = new ConversationsV1ConversationsResource(transport);
    this.roles = new ConversationsV1RolesResource(transport);
    this.users = makeUsersCallable(transport);
    this.credentials = new ConversationsV1CredentialsResource(transport);
    this.configuration = new ConversationsV1ConfigurationResource(transport);
    this.participantConversations = new ConversationsV1ParticipantConversationsResource(
      transport,
    );
    this.conversationWithParticipants =
      new ConversationsV1ConversationWithParticipantsResource(transport);
    this.services = makeServicesCallable(transport);
  }
}

// ===========================================================================
// /v1/Conversations + nested Messages / Participants / Webhooks (+ Receipts)
// ===========================================================================

/** Sub-resource for `/v1/Conversations/{ConversationSid}/Messages/{MessageSid}/Receipts`. */
export class ConversationsV1ConversationMessageReceiptsResource {
  private readonly t: Transport;
  private readonly conversationSid: string;
  private readonly messageSid: string;

  constructor(transport: Transport, conversationSid: string, messageSid: string) {
    this.t = transport;
    this.conversationSid = conversationSid;
    this.messageSid = messageSid;
  }

  private root(tail?: string): string {
    const base =
      `/v1/Conversations/${this.conversationSid}/Messages/${this.messageSid}/Receipts`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConversationMessageReceiptList> {
    return this.t.request<ConversationsV1ConversationMessageReceiptList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  fetch(sid: string): Promise<ConversationsV1ConversationMessageReceipt> {
    return this.t.request<ConversationsV1ConversationMessageReceipt>({
      method: 'GET',
      path: this.root(sid),
    });
  }
}

/** Sub-resource for `/v1/Conversations/{ConversationSid}/Messages[/{MessageSid}]`. */
export class ConversationsV1ConversationMessagesResource {
  private readonly t: Transport;
  private readonly conversationSid: string;

  constructor(transport: Transport, conversationSid: string) {
    this.t = transport;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Conversations/${this.conversationSid}/Messages`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConversationMessageList> {
    return this.t.request<ConversationsV1ConversationMessageList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ConversationMessageRequest,
  ): Promise<ConversationsV1ConversationMessage> {
    return this.t.request<ConversationsV1ConversationMessage>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(messageSid: string): Promise<ConversationsV1ConversationMessage> {
    return this.t.request<ConversationsV1ConversationMessage>({
      method: 'GET',
      path: this.root(messageSid),
    });
  }

  update(
    messageSid: string,
    body: UpdateConversationsV1ConversationMessageRequest,
  ): Promise<ConversationsV1ConversationMessage> {
    return this.t.request<ConversationsV1ConversationMessage>({
      method: 'POST',
      path: this.root(messageSid),
      form: body,
    });
  }

  async delete(messageSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(messageSid),
    });
  }

  /** Returns the per-message receipts sub-resource. */
  receipts(messageSid: string): ConversationsV1ConversationMessageReceiptsResource {
    return new ConversationsV1ConversationMessageReceiptsResource(
      this.t,
      this.conversationSid,
      messageSid,
    );
  }
}

/** Sub-resource for `/v1/Conversations/{ConversationSid}/Participants[/{ParticipantSid}]`. */
export class ConversationsV1ConversationParticipantsResource {
  private readonly t: Transport;
  private readonly conversationSid: string;

  constructor(transport: Transport, conversationSid: string) {
    this.t = transport;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Conversations/${this.conversationSid}/Participants`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConversationParticipantList> {
    return this.t.request<ConversationsV1ConversationParticipantList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ConversationParticipantRequest,
  ): Promise<ConversationsV1ConversationParticipant> {
    return this.t.request<ConversationsV1ConversationParticipant>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(participantSid: string): Promise<ConversationsV1ConversationParticipant> {
    return this.t.request<ConversationsV1ConversationParticipant>({
      method: 'GET',
      path: this.root(participantSid),
    });
  }

  update(
    participantSid: string,
    body: UpdateConversationsV1ConversationParticipantRequest,
  ): Promise<ConversationsV1ConversationParticipant> {
    return this.t.request<ConversationsV1ConversationParticipant>({
      method: 'POST',
      path: this.root(participantSid),
      form: body,
    });
  }

  async delete(participantSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(participantSid),
    });
  }
}

/** Sub-resource for `/v1/Conversations/{ConversationSid}/Webhooks[/{WebhookSid}]`. */
export class ConversationsV1ConversationWebhooksResource {
  private readonly t: Transport;
  private readonly conversationSid: string;

  constructor(transport: Transport, conversationSid: string) {
    this.t = transport;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Conversations/${this.conversationSid}/Webhooks`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConversationScopedWebhookList> {
    return this.t.request<ConversationsV1ConversationScopedWebhookList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ConversationScopedWebhookRequest,
  ): Promise<ConversationsV1ConversationScopedWebhook> {
    return this.t.request<ConversationsV1ConversationScopedWebhook>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(webhookSid: string): Promise<ConversationsV1ConversationScopedWebhook> {
    return this.t.request<ConversationsV1ConversationScopedWebhook>({
      method: 'GET',
      path: this.root(webhookSid),
    });
  }

  update(
    webhookSid: string,
    body: UpdateConversationsV1ConversationScopedWebhookRequest,
  ): Promise<ConversationsV1ConversationScopedWebhook> {
    return this.t.request<ConversationsV1ConversationScopedWebhook>({
      method: 'POST',
      path: this.root(webhookSid),
      form: body,
    });
  }

  async delete(webhookSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(webhookSid),
    });
  }
}

export class ConversationsV1ConversationsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConversationList> {
    return this.t.request<ConversationsV1ConversationList>({
      method: 'GET',
      path: '/v1/Conversations',
      params,
    });
  }

  create(
    body: CreateConversationsV1ConversationRequest,
  ): Promise<ConversationsV1Conversation> {
    return this.t.request<ConversationsV1Conversation>({
      method: 'POST',
      path: '/v1/Conversations',
      form: body,
    });
  }

  fetch(conversationSid: string): Promise<ConversationsV1Conversation> {
    return this.t.request<ConversationsV1Conversation>({
      method: 'GET',
      path: `/v1/Conversations/${conversationSid}`,
    });
  }

  update(
    conversationSid: string,
    body: UpdateConversationsV1ConversationRequest,
  ): Promise<ConversationsV1Conversation> {
    return this.t.request<ConversationsV1Conversation>({
      method: 'POST',
      path: `/v1/Conversations/${conversationSid}`,
      form: body,
    });
  }

  async delete(conversationSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Conversations/${conversationSid}`,
    });
  }

  /** Returns the messages sub-resource scoped to this conversation. */
  messages(conversationSid: string): ConversationsV1ConversationMessagesResource {
    return new ConversationsV1ConversationMessagesResource(this.t, conversationSid);
  }

  /** Returns the participants sub-resource scoped to this conversation. */
  participants(
    conversationSid: string,
  ): ConversationsV1ConversationParticipantsResource {
    return new ConversationsV1ConversationParticipantsResource(this.t, conversationSid);
  }

  /** Returns the scoped-webhooks sub-resource for this conversation. */
  webhooks(conversationSid: string): ConversationsV1ConversationWebhooksResource {
    return new ConversationsV1ConversationWebhooksResource(this.t, conversationSid);
  }
}

// ===========================================================================
// /v1/Roles
// ===========================================================================

export class ConversationsV1RolesResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListConversationsV1PageParams = {}): Promise<ConversationsV1RoleList> {
    return this.t.request<ConversationsV1RoleList>({
      method: 'GET',
      path: '/v1/Roles',
      params,
    });
  }

  create(body: CreateConversationsV1RoleRequest): Promise<ConversationsV1Role> {
    return this.t.request<ConversationsV1Role>({
      method: 'POST',
      path: '/v1/Roles',
      form: body,
    });
  }

  fetch(sid: string): Promise<ConversationsV1Role> {
    return this.t.request<ConversationsV1Role>({
      method: 'GET',
      path: `/v1/Roles/${sid}`,
    });
  }

  update(
    sid: string,
    body: UpdateConversationsV1RoleRequest,
  ): Promise<ConversationsV1Role> {
    return this.t.request<ConversationsV1Role>({
      method: 'POST',
      path: `/v1/Roles/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Roles/${sid}`,
    });
  }
}

// ===========================================================================
// /v1/Users + nested /v1/Users/{Sid}/Conversations
// ===========================================================================

/** Sub-resource for `/v1/Users/{Sid}/Conversations[/{ConversationSid}]`. */
export class ConversationsV1UserConversationsResource {
  private readonly t: Transport;
  private readonly userSid: string;

  constructor(transport: Transport, userSid: string) {
    this.t = transport;
    this.userSid = userSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Users/${this.userSid}/Conversations`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1UserConversationList> {
    return this.t.request<ConversationsV1UserConversationList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  fetch(conversationSid: string): Promise<ConversationsV1UserConversation> {
    return this.t.request<ConversationsV1UserConversation>({
      method: 'GET',
      path: this.root(conversationSid),
    });
  }

  update(
    conversationSid: string,
    body: UpdateConversationsV1UserConversationRequest,
  ): Promise<ConversationsV1UserConversation> {
    return this.t.request<ConversationsV1UserConversation>({
      method: 'POST',
      path: this.root(conversationSid),
      form: body,
    });
  }

  async delete(conversationSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(conversationSid),
    });
  }
}

/** Per-user scoped facade returned by `users(sid)`. Carries `.conversations.*`. */
export class ConversationsV1UserScoped {
  readonly conversations: ConversationsV1UserConversationsResource;

  constructor(transport: Transport, userSid: string) {
    this.conversations = new ConversationsV1UserConversationsResource(
      transport,
      userSid,
    );
  }
}

/**
 * Shape of `client.conversationsV1.users`:
 *
 * - **Callable**: `users(userSid)` → {@link ConversationsV1UserScoped} carrying `.conversations.*`.
 * - **Methods**: standard CRUD on the unscoped collection.
 */
export type ConversationsV1UsersCallable = ((sid: string) => ConversationsV1UserScoped) & {
  list(params?: ListConversationsV1PageParams): Promise<ConversationsV1UserList>;
  create(body: CreateConversationsV1UserRequest): Promise<ConversationsV1User>;
  fetch(sid: string): Promise<ConversationsV1User>;
  update(
    sid: string,
    body: UpdateConversationsV1UserRequest,
  ): Promise<ConversationsV1User>;
  delete(sid: string): Promise<void>;
};

function makeUsersCallable(transport: Transport): ConversationsV1UsersCallable {
  const fn = ((sid: string) =>
    new ConversationsV1UserScoped(transport, sid)) as ConversationsV1UsersCallable;

  fn.list = (params: ListConversationsV1PageParams = {}) =>
    transport.request<ConversationsV1UserList>({
      method: 'GET',
      path: '/v1/Users',
      params,
    });

  fn.create = (body: CreateConversationsV1UserRequest) =>
    transport.request<ConversationsV1User>({
      method: 'POST',
      path: '/v1/Users',
      form: body,
    });

  fn.fetch = (sid: string) =>
    transport.request<ConversationsV1User>({
      method: 'GET',
      path: `/v1/Users/${sid}`,
    });

  fn.update = (sid: string, body: UpdateConversationsV1UserRequest) =>
    transport.request<ConversationsV1User>({
      method: 'POST',
      path: `/v1/Users/${sid}`,
      form: body,
    });

  fn.delete = async (sid: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `/v1/Users/${sid}`,
    });
  };

  return fn;
}

// ===========================================================================
// /v1/Credentials
// ===========================================================================

export class ConversationsV1CredentialsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1CredentialList> {
    return this.t.request<ConversationsV1CredentialList>({
      method: 'GET',
      path: '/v1/Credentials',
      params,
    });
  }

  create(
    body: CreateConversationsV1CredentialRequest,
  ): Promise<ConversationsV1Credential> {
    return this.t.request<ConversationsV1Credential>({
      method: 'POST',
      path: '/v1/Credentials',
      form: body,
    });
  }

  fetch(sid: string): Promise<ConversationsV1Credential> {
    return this.t.request<ConversationsV1Credential>({
      method: 'GET',
      path: `/v1/Credentials/${sid}`,
    });
  }

  update(
    sid: string,
    body: UpdateConversationsV1CredentialRequest,
  ): Promise<ConversationsV1Credential> {
    return this.t.request<ConversationsV1Credential>({
      method: 'POST',
      path: `/v1/Credentials/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Credentials/${sid}`,
    });
  }
}

// ===========================================================================
// /v1/Configuration + /Webhooks + /Addresses
// ===========================================================================

export class ConversationsV1ConfigurationWebhooksResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  fetch(): Promise<ConversationsV1ConfigurationWebhook> {
    return this.t.request<ConversationsV1ConfigurationWebhook>({
      method: 'GET',
      path: '/v1/Configuration/Webhooks',
    });
  }

  update(
    body: UpdateConversationsV1ConfigurationWebhookRequest,
  ): Promise<ConversationsV1ConfigurationWebhook> {
    return this.t.request<ConversationsV1ConfigurationWebhook>({
      method: 'POST',
      path: '/v1/Configuration/Webhooks',
      form: body,
    });
  }
}

export class ConversationsV1ConfigurationAddressesResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ConfigAddressList> {
    return this.t.request<ConversationsV1ConfigAddressList>({
      method: 'GET',
      path: '/v1/Configuration/Addresses',
      params,
    });
  }

  create(
    body: CreateConversationsV1ConfigAddressRequest,
  ): Promise<ConversationsV1ConfigAddress> {
    return this.t.request<ConversationsV1ConfigAddress>({
      method: 'POST',
      path: '/v1/Configuration/Addresses',
      form: body,
    });
  }

  fetch(sid: string): Promise<ConversationsV1ConfigAddress> {
    return this.t.request<ConversationsV1ConfigAddress>({
      method: 'GET',
      path: `/v1/Configuration/Addresses/${sid}`,
    });
  }

  update(
    sid: string,
    body: UpdateConversationsV1ConfigAddressRequest,
  ): Promise<ConversationsV1ConfigAddress> {
    return this.t.request<ConversationsV1ConfigAddress>({
      method: 'POST',
      path: `/v1/Configuration/Addresses/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/Configuration/Addresses/${sid}`,
    });
  }
}

export class ConversationsV1ConfigurationResource {
  readonly webhooks: ConversationsV1ConfigurationWebhooksResource;
  readonly addresses: ConversationsV1ConfigurationAddressesResource;
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
    this.webhooks = new ConversationsV1ConfigurationWebhooksResource(transport);
    this.addresses = new ConversationsV1ConfigurationAddressesResource(transport);
  }

  fetch(): Promise<ConversationsV1Configuration> {
    return this.t.request<ConversationsV1Configuration>({
      method: 'GET',
      path: '/v1/Configuration',
    });
  }

  update(
    body: UpdateConversationsV1ConfigurationRequest,
  ): Promise<ConversationsV1Configuration> {
    return this.t.request<ConversationsV1Configuration>({
      method: 'POST',
      path: '/v1/Configuration',
      form: body,
    });
  }
}

// ===========================================================================
// /v1/ParticipantConversations + /v1/ConversationWithParticipants
// ===========================================================================

export class ConversationsV1ParticipantConversationsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(
    params: ListConversationsV1ParticipantConversationParams = {},
  ): Promise<ConversationsV1ParticipantConversationList> {
    return this.t.request<ConversationsV1ParticipantConversationList>({
      method: 'GET',
      path: '/v1/ParticipantConversations',
      params,
    });
  }
}

export class ConversationsV1ConversationWithParticipantsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  create(
    body: CreateConversationsV1ConversationWithParticipantsRequest,
  ): Promise<ConversationsV1ConversationWithParticipants> {
    return this.t.request<ConversationsV1ConversationWithParticipants>({
      method: 'POST',
      path: '/v1/ConversationWithParticipants',
      form: body,
    });
  }
}

// ===========================================================================
// /v1/Services + service-scoped Phase 4 surface
// ===========================================================================

// ---------------------------------------------------------------------------
// Service-scoped Messages + Receipts
// ---------------------------------------------------------------------------

/**
 * Sub-resource for
 * `/v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Messages/{MessageSid}/Receipts`.
 */
export class ConversationsV1ServiceConversationMessageReceiptsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;
  private readonly conversationSid: string;
  private readonly messageSid: string;

  constructor(
    transport: Transport,
    chatServiceSid: string,
    conversationSid: string,
    messageSid: string,
  ) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.conversationSid = conversationSid;
    this.messageSid = messageSid;
  }

  private root(tail?: string): string {
    const base =
      `/v1/Services/${this.chatServiceSid}/Conversations/${this.conversationSid}` +
      `/Messages/${this.messageSid}/Receipts`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceConversationMessageReceiptList> {
    return this.t.request<ConversationsV1ServiceConversationMessageReceiptList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  fetch(sid: string): Promise<ConversationsV1ServiceConversationMessageReceipt> {
    return this.t.request<ConversationsV1ServiceConversationMessageReceipt>({
      method: 'GET',
      path: this.root(sid),
    });
  }
}

/**
 * Sub-resource for
 * `/v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Messages[/{MessageSid}]`.
 */
export class ConversationsV1ServiceConversationMessagesResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;
  private readonly conversationSid: string;

  constructor(transport: Transport, chatServiceSid: string, conversationSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base =
      `/v1/Services/${this.chatServiceSid}/Conversations/${this.conversationSid}/Messages`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceConversationMessageList> {
    return this.t.request<ConversationsV1ServiceConversationMessageList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ServiceConversationMessageRequest,
  ): Promise<ConversationsV1ServiceConversationMessage> {
    return this.t.request<ConversationsV1ServiceConversationMessage>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(messageSid: string): Promise<ConversationsV1ServiceConversationMessage> {
    return this.t.request<ConversationsV1ServiceConversationMessage>({
      method: 'GET',
      path: this.root(messageSid),
    });
  }

  update(
    messageSid: string,
    body: UpdateConversationsV1ServiceConversationMessageRequest,
  ): Promise<ConversationsV1ServiceConversationMessage> {
    return this.t.request<ConversationsV1ServiceConversationMessage>({
      method: 'POST',
      path: this.root(messageSid),
      form: body,
    });
  }

  async delete(messageSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(messageSid),
    });
  }

  /** Returns the per-message receipts sub-resource. */
  receipts(
    messageSid: string,
  ): ConversationsV1ServiceConversationMessageReceiptsResource {
    return new ConversationsV1ServiceConversationMessageReceiptsResource(
      this.t,
      this.chatServiceSid,
      this.conversationSid,
      messageSid,
    );
  }
}

// ---------------------------------------------------------------------------
// Service-scoped Participants
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceConversationParticipantsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;
  private readonly conversationSid: string;

  constructor(transport: Transport, chatServiceSid: string, conversationSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base =
      `/v1/Services/${this.chatServiceSid}/Conversations/${this.conversationSid}/Participants`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceConversationParticipantList> {
    return this.t.request<ConversationsV1ServiceConversationParticipantList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ServiceConversationParticipantRequest,
  ): Promise<ConversationsV1ServiceConversationParticipant> {
    return this.t.request<ConversationsV1ServiceConversationParticipant>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(
    participantSid: string,
  ): Promise<ConversationsV1ServiceConversationParticipant> {
    return this.t.request<ConversationsV1ServiceConversationParticipant>({
      method: 'GET',
      path: this.root(participantSid),
    });
  }

  update(
    participantSid: string,
    body: UpdateConversationsV1ServiceConversationParticipantRequest,
  ): Promise<ConversationsV1ServiceConversationParticipant> {
    return this.t.request<ConversationsV1ServiceConversationParticipant>({
      method: 'POST',
      path: this.root(participantSid),
      form: body,
    });
  }

  async delete(participantSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(participantSid),
    });
  }
}

// ---------------------------------------------------------------------------
// Service-scoped Conversation Webhooks
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceConversationWebhooksResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;
  private readonly conversationSid: string;

  constructor(transport: Transport, chatServiceSid: string, conversationSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.conversationSid = conversationSid;
  }

  private root(tail?: string): string {
    const base =
      `/v1/Services/${this.chatServiceSid}/Conversations/${this.conversationSid}/Webhooks`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceConversationScopedWebhookList> {
    return this.t.request<ConversationsV1ServiceConversationScopedWebhookList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ServiceConversationScopedWebhookRequest,
  ): Promise<ConversationsV1ServiceConversationScopedWebhook> {
    return this.t.request<ConversationsV1ServiceConversationScopedWebhook>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(
    webhookSid: string,
  ): Promise<ConversationsV1ServiceConversationScopedWebhook> {
    return this.t.request<ConversationsV1ServiceConversationScopedWebhook>({
      method: 'GET',
      path: this.root(webhookSid),
    });
  }

  update(
    webhookSid: string,
    body: UpdateConversationsV1ServiceConversationScopedWebhookRequest,
  ): Promise<ConversationsV1ServiceConversationScopedWebhook> {
    return this.t.request<ConversationsV1ServiceConversationScopedWebhook>({
      method: 'POST',
      path: this.root(webhookSid),
      form: body,
    });
  }

  async delete(webhookSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(webhookSid),
    });
  }
}

// ---------------------------------------------------------------------------
// Service-scoped Conversations + factories for nested resources
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceConversationsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Services/${this.chatServiceSid}/Conversations`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceConversationList> {
    return this.t.request<ConversationsV1ServiceConversationList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ServiceConversationRequest,
  ): Promise<ConversationsV1ServiceConversation> {
    return this.t.request<ConversationsV1ServiceConversation>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(conversationSid: string): Promise<ConversationsV1ServiceConversation> {
    return this.t.request<ConversationsV1ServiceConversation>({
      method: 'GET',
      path: this.root(conversationSid),
    });
  }

  update(
    conversationSid: string,
    body: UpdateConversationsV1ServiceConversationRequest,
  ): Promise<ConversationsV1ServiceConversation> {
    return this.t.request<ConversationsV1ServiceConversation>({
      method: 'POST',
      path: this.root(conversationSid),
      form: body,
    });
  }

  async delete(conversationSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(conversationSid),
    });
  }

  /** Returns the messages sub-resource scoped to this service conversation. */
  messages(
    conversationSid: string,
  ): ConversationsV1ServiceConversationMessagesResource {
    return new ConversationsV1ServiceConversationMessagesResource(
      this.t,
      this.chatServiceSid,
      conversationSid,
    );
  }

  /** Returns the participants sub-resource scoped to this service conversation. */
  participants(
    conversationSid: string,
  ): ConversationsV1ServiceConversationParticipantsResource {
    return new ConversationsV1ServiceConversationParticipantsResource(
      this.t,
      this.chatServiceSid,
      conversationSid,
    );
  }

  /** Returns the scoped-webhooks sub-resource for this service conversation. */
  webhooks(
    conversationSid: string,
  ): ConversationsV1ServiceConversationWebhooksResource {
    return new ConversationsV1ServiceConversationWebhooksResource(
      this.t,
      this.chatServiceSid,
      conversationSid,
    );
  }
}

// ---------------------------------------------------------------------------
// Service-scoped Roles + Users (+ Users(sid).conversations)
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceRolesResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Services/${this.chatServiceSid}/Roles`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceRoleList> {
    return this.t.request<ConversationsV1ServiceRoleList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateConversationsV1ServiceRoleRequest,
  ): Promise<ConversationsV1ServiceRole> {
    return this.t.request<ConversationsV1ServiceRole>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(sid: string): Promise<ConversationsV1ServiceRole> {
    return this.t.request<ConversationsV1ServiceRole>({
      method: 'GET',
      path: this.root(sid),
    });
  }

  update(
    sid: string,
    body: UpdateConversationsV1ServiceRoleRequest,
  ): Promise<ConversationsV1ServiceRole> {
    return this.t.request<ConversationsV1ServiceRole>({
      method: 'POST',
      path: this.root(sid),
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(sid),
    });
  }
}

/** Sub-resource for `/v1/Services/{ChatServiceSid}/Users/{UserSid}/Conversations` (list-only). */
export class ConversationsV1ServiceUserConversationsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;
  private readonly userSid: string;

  constructor(transport: Transport, chatServiceSid: string, userSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.userSid = userSid;
  }

  list(
    params: ListConversationsV1PageParams = {},
  ): Promise<ConversationsV1ServiceUserConversationList> {
    return this.t.request<ConversationsV1ServiceUserConversationList>({
      method: 'GET',
      path: `/v1/Services/${this.chatServiceSid}/Users/${this.userSid}/Conversations`,
      params,
    });
  }
}

/** Per-user (service-scoped) facade returned by `users(sid)`. */
export class ConversationsV1ServiceUserScoped {
  readonly conversations: ConversationsV1ServiceUserConversationsResource;

  constructor(transport: Transport, chatServiceSid: string, userSid: string) {
    this.conversations = new ConversationsV1ServiceUserConversationsResource(
      transport,
      chatServiceSid,
      userSid,
    );
  }
}

/**
 * Service-scoped users surface:
 *
 * - **Callable**: `users(userSid)` returns a {@link ConversationsV1ServiceUserScoped}
 *   carrying `.conversations.list()`.
 * - **Methods**: standard CRUD on `/v1/Services/{Sid}/Users[/{Sid}]`.
 */
export type ConversationsV1ServiceUsersCallable = ((
  sid: string,
) => ConversationsV1ServiceUserScoped) & {
  list(params?: ListConversationsV1PageParams): Promise<ConversationsV1ServiceUserList>;
  create(
    body: CreateConversationsV1ServiceUserRequest,
  ): Promise<ConversationsV1ServiceUser>;
  fetch(sid: string): Promise<ConversationsV1ServiceUser>;
  update(
    sid: string,
    body: UpdateConversationsV1ServiceUserRequest,
  ): Promise<ConversationsV1ServiceUser>;
  delete(sid: string): Promise<void>;
};

function makeServiceUsersCallable(
  transport: Transport,
  chatServiceSid: string,
): ConversationsV1ServiceUsersCallable {
  const base = `/v1/Services/${chatServiceSid}/Users`;
  const fn = ((sid: string) =>
    new ConversationsV1ServiceUserScoped(
      transport,
      chatServiceSid,
      sid,
    )) as ConversationsV1ServiceUsersCallable;

  fn.list = (params: ListConversationsV1PageParams = {}) =>
    transport.request<ConversationsV1ServiceUserList>({
      method: 'GET',
      path: base,
      params,
    });

  fn.create = (body: CreateConversationsV1ServiceUserRequest) =>
    transport.request<ConversationsV1ServiceUser>({
      method: 'POST',
      path: base,
      form: body,
    });

  fn.fetch = (sid: string) =>
    transport.request<ConversationsV1ServiceUser>({
      method: 'GET',
      path: `${base}/${sid}`,
    });

  fn.update = (sid: string, body: UpdateConversationsV1ServiceUserRequest) =>
    transport.request<ConversationsV1ServiceUser>({
      method: 'POST',
      path: `${base}/${sid}`,
      form: body,
    });

  fn.delete = async (sid: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `${base}/${sid}`,
    });
  };

  return fn;
}

// ---------------------------------------------------------------------------
// Service-scoped Bindings (list / fetch / delete)
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceBindingsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  private root(tail?: string): string {
    const base = `/v1/Services/${this.chatServiceSid}/Bindings`;
    return tail ? `${base}/${tail}` : base;
  }

  list(
    params: ListConversationsV1ServiceBindingParams = {},
  ): Promise<ConversationsV1ServiceBindingList> {
    return this.t.request<ConversationsV1ServiceBindingList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  fetch(sid: string): Promise<ConversationsV1ServiceBinding> {
    return this.t.request<ConversationsV1ServiceBinding>({
      method: 'GET',
      path: this.root(sid),
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(sid),
    });
  }
}

// ---------------------------------------------------------------------------
// Service-scoped Configuration (+ /Notifications, /Webhooks)
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceNotificationsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  private root(): string {
    return `/v1/Services/${this.chatServiceSid}/Configuration/Notifications`;
  }

  fetch(): Promise<ConversationsV1ServiceNotification> {
    return this.t.request<ConversationsV1ServiceNotification>({
      method: 'GET',
      path: this.root(),
    });
  }

  update(
    body: UpdateConversationsV1ServiceNotificationRequest,
  ): Promise<ConversationsV1ServiceNotification> {
    return this.t.request<ConversationsV1ServiceNotification>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }
}

export class ConversationsV1ServiceWebhookConfigurationResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  private root(): string {
    return `/v1/Services/${this.chatServiceSid}/Configuration/Webhooks`;
  }

  fetch(): Promise<ConversationsV1ServiceWebhookConfiguration> {
    return this.t.request<ConversationsV1ServiceWebhookConfiguration>({
      method: 'GET',
      path: this.root(),
    });
  }

  update(
    body: UpdateConversationsV1ServiceWebhookConfigurationRequest,
  ): Promise<ConversationsV1ServiceWebhookConfiguration> {
    return this.t.request<ConversationsV1ServiceWebhookConfiguration>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }
}

export class ConversationsV1ServiceConfigurationResource {
  readonly notifications: ConversationsV1ServiceNotificationsResource;
  readonly webhooks: ConversationsV1ServiceWebhookConfigurationResource;
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
    this.notifications = new ConversationsV1ServiceNotificationsResource(
      transport,
      chatServiceSid,
    );
    this.webhooks = new ConversationsV1ServiceWebhookConfigurationResource(
      transport,
      chatServiceSid,
    );
  }

  private root(): string {
    return `/v1/Services/${this.chatServiceSid}/Configuration`;
  }

  fetch(): Promise<ConversationsV1ServiceConfiguration> {
    return this.t.request<ConversationsV1ServiceConfiguration>({
      method: 'GET',
      path: this.root(),
    });
  }

  update(
    body: UpdateConversationsV1ServiceConfigurationRequest,
  ): Promise<ConversationsV1ServiceConfiguration> {
    return this.t.request<ConversationsV1ServiceConfiguration>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }
}

// ---------------------------------------------------------------------------
// Service-scoped ParticipantConversations + ConversationWithParticipants
// ---------------------------------------------------------------------------

export class ConversationsV1ServiceParticipantConversationsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  list(
    params: ListConversationsV1ServiceParticipantConversationParams = {},
  ): Promise<ConversationsV1ServiceParticipantConversationList> {
    return this.t.request<ConversationsV1ServiceParticipantConversationList>({
      method: 'GET',
      path: `/v1/Services/${this.chatServiceSid}/ParticipantConversations`,
      params,
    });
  }
}

export class ConversationsV1ServiceConversationWithParticipantsResource {
  private readonly t: Transport;
  private readonly chatServiceSid: string;

  constructor(transport: Transport, chatServiceSid: string) {
    this.t = transport;
    this.chatServiceSid = chatServiceSid;
  }

  create(
    body: CreateConversationsV1ServiceConversationWithParticipantsRequest,
  ): Promise<ConversationsV1ServiceConversationWithParticipants> {
    return this.t.request<ConversationsV1ServiceConversationWithParticipants>({
      method: 'POST',
      path: `/v1/Services/${this.chatServiceSid}/ConversationWithParticipants`,
      form: body,
    });
  }
}

// ---------------------------------------------------------------------------
// Top-level service scope facade returned by `services(chatServiceSid)`.
// ---------------------------------------------------------------------------

/**
 * Per-service scope returned by `client.conversationsV1.services(chatServiceSid)`.
 *
 * Carries the 14 service-scoped sub-resource families of Phase 4.
 */
export class ConversationsV1ServiceScopeResource {
  readonly conversations: ConversationsV1ServiceConversationsResource;
  readonly roles: ConversationsV1ServiceRolesResource;
  readonly users: ConversationsV1ServiceUsersCallable;
  readonly bindings: ConversationsV1ServiceBindingsResource;
  readonly configuration: ConversationsV1ServiceConfigurationResource;
  readonly participantConversations: ConversationsV1ServiceParticipantConversationsResource;
  readonly conversationWithParticipants: ConversationsV1ServiceConversationWithParticipantsResource;

  constructor(transport: Transport, chatServiceSid: string) {
    this.conversations = new ConversationsV1ServiceConversationsResource(
      transport,
      chatServiceSid,
    );
    this.roles = new ConversationsV1ServiceRolesResource(transport, chatServiceSid);
    this.users = makeServiceUsersCallable(transport, chatServiceSid);
    this.bindings = new ConversationsV1ServiceBindingsResource(
      transport,
      chatServiceSid,
    );
    this.configuration = new ConversationsV1ServiceConfigurationResource(
      transport,
      chatServiceSid,
    );
    this.participantConversations =
      new ConversationsV1ServiceParticipantConversationsResource(
        transport,
        chatServiceSid,
      );
    this.conversationWithParticipants =
      new ConversationsV1ServiceConversationWithParticipantsResource(
        transport,
        chatServiceSid,
      );
  }
}

// ---------------------------------------------------------------------------
// Top-level /v1/Services callable
// ---------------------------------------------------------------------------

/**
 * Shape of `client.conversationsV1.services`:
 *
 * - **Callable**: `services(chatServiceSid)` returns a
 *   {@link ConversationsV1ServiceScopeResource} carrying the 14 Phase 4
 *   sub-resource families.
 * - **Methods**: account-level CRUD on `/v1/Services` (`.list/.create/.fetch/.delete`).
 *
 * The Twilio account-level Services collection has no `update` endpoint.
 */
export type ConversationsV1ServicesCallable = ((
  chatServiceSid: string,
) => ConversationsV1ServiceScopeResource) & {
  list(params?: ListConversationsV1PageParams): Promise<ConversationsV1ServiceList>;
  create(body: CreateConversationsV1ServiceRequest): Promise<ConversationsV1Service>;
  fetch(chatServiceSid: string): Promise<ConversationsV1Service>;
  delete(chatServiceSid: string): Promise<void>;
};

function makeServicesCallable(transport: Transport): ConversationsV1ServicesCallable {
  const fn = ((chatServiceSid: string) =>
    new ConversationsV1ServiceScopeResource(
      transport,
      chatServiceSid,
    )) as ConversationsV1ServicesCallable;

  fn.list = (params: ListConversationsV1PageParams = {}) =>
    transport.request<ConversationsV1ServiceList>({
      method: 'GET',
      path: '/v1/Services',
      params,
    });

  fn.create = (body: CreateConversationsV1ServiceRequest) =>
    transport.request<ConversationsV1Service>({
      method: 'POST',
      path: '/v1/Services',
      form: body,
    });

  fn.fetch = (chatServiceSid: string) =>
    transport.request<ConversationsV1Service>({
      method: 'GET',
      path: `/v1/Services/${chatServiceSid}`,
    });

  fn.delete = async (chatServiceSid: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `/v1/Services/${chatServiceSid}`,
    });
  };

  return fn;
}
