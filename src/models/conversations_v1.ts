/**
 * Twilio Conversations v1 (conversations.twilio.com/v1) resource models.
 *
 * Same `/v1/` conventions as Voice v1: HTTP Basic auth resolves the account,
 * dates are ISO-8601, and list responses carry the {@link VoiceV1Meta} envelope
 * (re-exported here to keep call sites readable).
 */

import type { VoiceV1Meta } from './voice_v1.js';

// ---------------------------------------------------------------------------
// Conversation — /v1/Conversations
// ---------------------------------------------------------------------------

export type ConversationState = 'initializing' | 'inactive' | 'active' | 'closed';

/** A stateful messaging thread (`CH…`). */
export interface ConversationsV1Conversation {
  account_sid: string;
  chat_service_sid: string | null;
  messaging_service_sid: string | null;
  sid: string;
  friendly_name: string | null;
  unique_name: string | null;
  attributes: string | null;
  state: ConversationState;
  date_created: string | null;
  date_updated: string | null;
  timers: Record<string, unknown> | null;
  url: string | null;
  links: Record<string, string> | null;
  bindings: Record<string, unknown> | null;
}

export interface ConversationsV1ConversationList {
  conversations: ConversationsV1Conversation[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ConversationRequest {
  FriendlyName?: string;
  UniqueName?: string;
  MessagingServiceSid?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
  'Bindings.Email.Address'?: string;
  'Bindings.Email.Name'?: string;
}

export interface UpdateConversationsV1ConversationRequest {
  FriendlyName?: string;
  UniqueName?: string;
  MessagingServiceSid?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
}

// ---------------------------------------------------------------------------
// ConversationMessage — /v1/Conversations/{ConversationSid}/Messages
// ---------------------------------------------------------------------------

/** A message inside a conversation (`IM…`). */
export interface ConversationsV1ConversationMessage {
  account_sid: string;
  conversation_sid: string;
  sid: string;
  index: number;
  author: string | null;
  body: string | null;
  media: Array<Record<string, unknown>> | null;
  attributes: string | null;
  participant_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  delivery: Record<string, unknown> | null;
  links: Record<string, string> | null;
  content_sid: string | null;
}

export interface ConversationsV1ConversationMessageList {
  messages: ConversationsV1ConversationMessage[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ConversationMessageRequest {
  Author?: string;
  Body?: string;
  Attributes?: string;
  ContentSid?: string;
}

export interface UpdateConversationsV1ConversationMessageRequest {
  Author?: string;
  Body?: string;
  Attributes?: string;
}

// ---------------------------------------------------------------------------
// ConversationMessageReceipt — read-only, per-channel delivery
// ---------------------------------------------------------------------------

export type DeliveryReceiptStatus = 'read' | 'failed' | 'delivered' | 'undelivered' | 'sent';

export interface ConversationsV1ConversationMessageReceipt {
  account_sid: string;
  conversation_sid: string;
  sid: string;
  message_sid: string;
  channel_message_sid: string | null;
  participant_sid: string | null;
  status: DeliveryReceiptStatus;
  error_code: number;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface ConversationsV1ConversationMessageReceiptList {
  delivery_receipts: ConversationsV1ConversationMessageReceipt[];
  meta: VoiceV1Meta;
}

// ---------------------------------------------------------------------------
// ConversationParticipant — /v1/Conversations/{ConversationSid}/Participants
// ---------------------------------------------------------------------------

/** A participant in a conversation (`MB…`). */
export interface ConversationsV1ConversationParticipant {
  account_sid: string;
  conversation_sid: string;
  sid: string;
  identity: string | null;
  attributes: string | null;
  messaging_binding: Record<string, unknown> | null;
  role_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  last_read_message_index: number | null;
  last_read_timestamp: string | null;
}

export interface ConversationsV1ConversationParticipantList {
  participants: ConversationsV1ConversationParticipant[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ConversationParticipantRequest {
  Identity?: string;
  Attributes?: string;
  RoleSid?: string;
  'MessagingBinding.Address'?: string;
  'MessagingBinding.ProxyAddress'?: string;
  'MessagingBinding.ProjectedAddress'?: string;
}

export interface UpdateConversationsV1ConversationParticipantRequest {
  Identity?: string;
  Attributes?: string;
  RoleSid?: string;
  LastReadMessageIndex?: number;
  LastReadTimestamp?: string;
}

// ---------------------------------------------------------------------------
// ConversationScopedWebhook — /v1/Conversations/{ConversationSid}/Webhooks
// ---------------------------------------------------------------------------

export type ScopedWebhookTarget = 'webhook' | 'trigger' | 'studio';

export interface ConversationsV1ConversationScopedWebhook {
  sid: string;
  account_sid: string;
  conversation_sid: string;
  target: string | null;
  url: string | null;
  configuration: Record<string, unknown> | null;
  date_created: string | null;
  date_updated: string | null;
}

export interface ConversationsV1ConversationScopedWebhookList {
  webhooks: ConversationsV1ConversationScopedWebhook[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ConversationScopedWebhookRequest {
  Target: ScopedWebhookTarget;
  'Configuration.Url'?: string;
  'Configuration.Method'?: 'GET' | 'POST';
  'Configuration.FlowSid'?: string;
  'Configuration.ReplayAfter'?: number;
}

export interface UpdateConversationsV1ConversationScopedWebhookRequest {
  'Configuration.Url'?: string;
  'Configuration.Method'?: 'GET' | 'POST';
  'Configuration.FlowSid'?: string;
}

// ---------------------------------------------------------------------------
// Role — /v1/Roles
// ---------------------------------------------------------------------------

export type ConversationsRoleType = 'conversation' | 'service';

export interface ConversationsV1Role {
  sid: string;
  account_sid: string;
  chat_service_sid: string | null;
  friendly_name: string | null;
  type: ConversationsRoleType;
  permissions: string[] | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface ConversationsV1RoleList {
  roles: ConversationsV1Role[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1RoleRequest {
  FriendlyName: string;
  Type: ConversationsRoleType;
  Permission: string[];
}

export interface UpdateConversationsV1RoleRequest {
  Permission: string[];
}

// ---------------------------------------------------------------------------
// User — /v1/Users
// ---------------------------------------------------------------------------

export interface ConversationsV1User {
  sid: string;
  account_sid: string;
  chat_service_sid: string | null;
  role_sid: string | null;
  identity: string | null;
  friendly_name: string | null;
  attributes: string | null;
  is_online: boolean | null;
  is_notifiable: boolean | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1UserList {
  users: ConversationsV1User[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1UserRequest {
  Identity: string;
  FriendlyName?: string;
  Attributes?: string;
  RoleSid?: string;
}

export interface UpdateConversationsV1UserRequest {
  FriendlyName?: string;
  Attributes?: string;
  RoleSid?: string;
}

// ---------------------------------------------------------------------------
// UserConversation — /v1/Users/{Sid}/Conversations
// ---------------------------------------------------------------------------

export type UserConversationNotificationLevel = 'default' | 'muted';

export interface ConversationsV1UserConversation {
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string | null;
  unread_messages_count: number | null;
  last_read_message_index: number | null;
  participant_sid: string | null;
  user_sid: string | null;
  friendly_name: string | null;
  conversation_state: 'inactive' | 'active' | 'closed';
  timers: Record<string, unknown> | null;
  attributes: string | null;
  date_created: string | null;
  date_updated: string | null;
  created_by: string | null;
  notification_level: UserConversationNotificationLevel;
  unique_name: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1UserConversationList {
  conversations: ConversationsV1UserConversation[];
  meta: VoiceV1Meta;
}

export interface UpdateConversationsV1UserConversationRequest {
  NotificationLevel?: UserConversationNotificationLevel;
  LastReadMessageIndex?: number;
  LastReadTimestamp?: string;
}

// ---------------------------------------------------------------------------
// Credential — /v1/Credentials
// ---------------------------------------------------------------------------

export type ConversationsCredentialType = 'apn' | 'gcm' | 'fcm';

export interface ConversationsV1Credential {
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  type: ConversationsCredentialType;
  sandbox: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface ConversationsV1CredentialList {
  credentials: ConversationsV1Credential[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1CredentialRequest {
  Type: ConversationsCredentialType;
  FriendlyName?: string;
  Certificate?: string;
  PrivateKey?: string;
  Sandbox?: boolean;
  ApiKey?: string;
  Secret?: string;
}

export interface UpdateConversationsV1CredentialRequest {
  Type?: ConversationsCredentialType;
  FriendlyName?: string;
  Certificate?: string;
  PrivateKey?: string;
  Sandbox?: boolean;
  ApiKey?: string;
  Secret?: string;
}

// ---------------------------------------------------------------------------
// Configuration — /v1/Configuration
// ---------------------------------------------------------------------------

export interface ConversationsV1Configuration {
  account_sid: string;
  default_chat_service_sid: string | null;
  default_messaging_service_sid: string | null;
  default_inactive_timer: string | null;
  default_closed_timer: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface UpdateConversationsV1ConfigurationRequest {
  DefaultChatServiceSid?: string;
  DefaultMessagingServiceSid?: string;
  DefaultInactiveTimer?: string;
  DefaultClosedTimer?: string;
}

// ---------------------------------------------------------------------------
// ConfigurationWebhook — /v1/Configuration/Webhooks
// ---------------------------------------------------------------------------

export type ConfigurationWebhookTarget = 'webhook' | 'flex';

export interface ConversationsV1ConfigurationWebhook {
  account_sid: string;
  method: 'GET' | 'POST';
  filters: string[] | null;
  pre_webhook_url: string | null;
  post_webhook_url: string | null;
  target: ConfigurationWebhookTarget;
  url: string | null;
}

export interface UpdateConversationsV1ConfigurationWebhookRequest {
  Method?: 'GET' | 'POST';
  Filters?: string[];
  PreWebhookUrl?: string;
  PostWebhookUrl?: string;
  Target?: ConfigurationWebhookTarget;
}

// ---------------------------------------------------------------------------
// ConfigAddress — /v1/Configuration/Addresses
// ---------------------------------------------------------------------------

export type ConfigAddressType =
  | 'sms'
  | 'whatsapp'
  | 'messenger'
  | 'gbm'
  | 'email'
  | 'rcs'
  | 'apple'
  | 'chat';

export type ConfigAddressAutoCreationType = 'webhook' | 'studio' | 'default';

export interface ConversationsV1ConfigAddress {
  sid: string;
  account_sid: string;
  type: string | null;
  address: string | null;
  friendly_name: string | null;
  auto_creation: Record<string, unknown> | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  address_country: string | null;
}

export interface ConversationsV1ConfigAddressList {
  addresses: ConversationsV1ConfigAddress[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ConfigAddressRequest {
  Type: ConfigAddressType;
  Address: string;
  FriendlyName?: string;
  'AutoCreation.Enabled'?: boolean;
  'AutoCreation.Type'?: ConfigAddressAutoCreationType;
  'AutoCreation.WebhookUrl'?: string;
  AddressCountry?: string;
}

export interface UpdateConversationsV1ConfigAddressRequest {
  FriendlyName?: string;
  'AutoCreation.Enabled'?: boolean;
  'AutoCreation.Type'?: ConfigAddressAutoCreationType;
  'AutoCreation.WebhookUrl'?: string;
}

// ---------------------------------------------------------------------------
// ParticipantConversation — /v1/ParticipantConversations
// ---------------------------------------------------------------------------

export interface ConversationsV1ParticipantConversation {
  account_sid: string;
  chat_service_sid: string | null;
  participant_sid: string | null;
  participant_user_sid: string | null;
  participant_identity: string | null;
  participant_messaging_binding: Record<string, unknown> | null;
  conversation_sid: string | null;
  conversation_unique_name: string | null;
  conversation_friendly_name: string | null;
  conversation_attributes: string | null;
  conversation_date_created: string | null;
  conversation_date_updated: string | null;
  conversation_created_by: string | null;
  conversation_state: 'inactive' | 'active' | 'closed';
  conversation_timers: Record<string, unknown> | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1ParticipantConversationList {
  conversations: ConversationsV1ParticipantConversation[];
  meta: VoiceV1Meta;
}

export interface ListConversationsV1ParticipantConversationParams {
  Identity?: string;
  Address?: string;
  PageSize?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ConversationWithParticipants — /v1/ConversationWithParticipants (create)
// ---------------------------------------------------------------------------

export interface ConversationsV1ConversationWithParticipants {
  account_sid: string;
  chat_service_sid: string | null;
  messaging_service_sid: string | null;
  sid: string;
  friendly_name: string | null;
  unique_name: string | null;
  attributes: string | null;
  state: ConversationState;
  date_created: string | null;
  date_updated: string | null;
  timers: Record<string, unknown> | null;
  links: Record<string, string> | null;
  bindings: Record<string, unknown> | null;
  url: string | null;
}

export interface CreateConversationsV1ConversationWithParticipantsRequest {
  FriendlyName?: string;
  UniqueName?: string;
  MessagingServiceSid?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
  /** Repeated form field; each value a JSON participant spec. */
  Participant?: string[];
}

// ---------------------------------------------------------------------------
// Service — /v1/Services
// ---------------------------------------------------------------------------

export interface ConversationsV1Service {
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1ServiceList {
  services: ConversationsV1Service[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceRequest {
  FriendlyName: string;
}

// ---------------------------------------------------------------------------
// List page params shared by every paginated Conversations v1 GET.
// ---------------------------------------------------------------------------

export interface ListConversationsV1PageParams {
  PageSize?: number;
  // Index signature so the interface satisfies the transport's
  // `params: Record<string, unknown>` constraint without a cast.
  [key: string]: unknown;
}

// ===========================================================================
// Phase 4: service-scoped Conversations v1 surface
// (`/v1/Services/{ChatServiceSid}/…`)
//
// The response schemas mirror the account-level shapes with the addition of
// a `chat_service_sid` field; the request bodies are identical except where
// the spec differs (notably: service-scoped Participant update has no
// `Identity`/`LastReadMessageIndex`/`LastReadTimestamp`; service-scoped
// scoped-webhook create has no `Configuration.ReplayAfter`; service-scoped
// Configuration has its own field set).
// ===========================================================================

// ---------------------------------------------------------------------------
// ServiceConversation — /v1/Services/{ChatServiceSid}/Conversations
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversation {
  account_sid: string;
  chat_service_sid: string | null;
  messaging_service_sid: string | null;
  sid: string;
  friendly_name: string | null;
  unique_name: string | null;
  attributes: string | null;
  state: ConversationState;
  date_created: string | null;
  date_updated: string | null;
  timers: Record<string, unknown> | null;
  url: string | null;
  links: Record<string, string> | null;
  bindings: Record<string, unknown> | null;
}

export interface ConversationsV1ServiceConversationList {
  conversations: ConversationsV1ServiceConversation[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceConversationRequest {
  FriendlyName?: string;
  UniqueName?: string;
  MessagingServiceSid?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
}

export interface UpdateConversationsV1ServiceConversationRequest {
  FriendlyName?: string;
  UniqueName?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
}

// ---------------------------------------------------------------------------
// ServiceConversationMessage —
//   /v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Messages
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversationMessage {
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string;
  sid: string;
  index: number;
  author: string | null;
  body: string | null;
  media: Array<Record<string, unknown>> | null;
  attributes: string | null;
  participant_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  delivery: Record<string, unknown> | null;
  links: Record<string, string> | null;
  content_sid: string | null;
}

export interface ConversationsV1ServiceConversationMessageList {
  messages: ConversationsV1ServiceConversationMessage[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceConversationMessageRequest {
  Author?: string;
  Body?: string;
  Attributes?: string;
  ContentSid?: string;
}

export interface UpdateConversationsV1ServiceConversationMessageRequest {
  Author?: string;
  Body?: string;
  Attributes?: string;
}

// ---------------------------------------------------------------------------
// ServiceConversationMessageReceipt — read-only
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversationMessageReceipt {
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string;
  sid: string;
  message_sid: string;
  channel_message_sid: string | null;
  participant_sid: string | null;
  status: DeliveryReceiptStatus;
  error_code: number;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface ConversationsV1ServiceConversationMessageReceiptList {
  delivery_receipts: ConversationsV1ServiceConversationMessageReceipt[];
  meta: VoiceV1Meta;
}

// ---------------------------------------------------------------------------
// ServiceConversationParticipant —
//   /v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Participants
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversationParticipant {
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string;
  sid: string;
  identity: string | null;
  attributes: string | null;
  messaging_binding: Record<string, unknown> | null;
  role_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  last_read_message_index: number | null;
  last_read_timestamp: string | null;
}

export interface ConversationsV1ServiceConversationParticipantList {
  participants: ConversationsV1ServiceConversationParticipant[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceConversationParticipantRequest {
  Identity?: string;
  Attributes?: string;
  RoleSid?: string;
  'MessagingBinding.Address'?: string;
  'MessagingBinding.ProxyAddress'?: string;
  'MessagingBinding.ProjectedAddress'?: string;
}

/**
 * Update body for `/v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Participants/{Sid}`.
 *
 * Spec only allows `Attributes` and `RoleSid` (no identity/last-read fields).
 */
export interface UpdateConversationsV1ServiceConversationParticipantRequest {
  Attributes?: string;
  RoleSid?: string;
}

// ---------------------------------------------------------------------------
// ServiceConversationScopedWebhook —
//   /v1/Services/{ChatServiceSid}/Conversations/{ConversationSid}/Webhooks
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversationScopedWebhook {
  sid: string;
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string;
  target: string | null;
  url: string | null;
  configuration: Record<string, unknown> | null;
  date_created: string | null;
  date_updated: string | null;
}

export interface ConversationsV1ServiceConversationScopedWebhookList {
  webhooks: ConversationsV1ServiceConversationScopedWebhook[];
  meta: VoiceV1Meta;
}

/**
 * Service-scoped scoped-webhook create body. Note: the service-scoped variant
 * omits `Configuration.ReplayAfter` (present on the account-level surface).
 */
export interface CreateConversationsV1ServiceConversationScopedWebhookRequest {
  Target: ScopedWebhookTarget;
  'Configuration.Url'?: string;
  'Configuration.Method'?: 'GET' | 'POST';
  'Configuration.FlowSid'?: string;
}

export interface UpdateConversationsV1ServiceConversationScopedWebhookRequest {
  'Configuration.Url'?: string;
  'Configuration.Method'?: 'GET' | 'POST';
  'Configuration.FlowSid'?: string;
}

// ---------------------------------------------------------------------------
// ServiceConversationWithParticipants —
//   /v1/Services/{ChatServiceSid}/ConversationWithParticipants (create-only)
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConversationWithParticipants {
  account_sid: string;
  chat_service_sid: string | null;
  messaging_service_sid: string | null;
  sid: string;
  friendly_name: string | null;
  unique_name: string | null;
  attributes: string | null;
  state: ConversationState;
  date_created: string | null;
  date_updated: string | null;
  timers: Record<string, unknown> | null;
  links: Record<string, string> | null;
  bindings: Record<string, unknown> | null;
  url: string | null;
}

export interface CreateConversationsV1ServiceConversationWithParticipantsRequest {
  FriendlyName?: string;
  UniqueName?: string;
  MessagingServiceSid?: string;
  Attributes?: string;
  State?: ConversationState;
  'Timers.Inactive'?: string;
  'Timers.Closed'?: string;
  /** Repeated form field; each value a JSON participant spec. */
  Participant?: string[];
}

// ---------------------------------------------------------------------------
// ServiceParticipantConversation —
//   /v1/Services/{ChatServiceSid}/ParticipantConversations (list-only)
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceParticipantConversation {
  account_sid: string;
  chat_service_sid: string | null;
  participant_sid: string | null;
  participant_user_sid: string | null;
  participant_identity: string | null;
  participant_messaging_binding: Record<string, unknown> | null;
  conversation_sid: string | null;
  conversation_unique_name: string | null;
  conversation_friendly_name: string | null;
  conversation_attributes: string | null;
  conversation_date_created: string | null;
  conversation_date_updated: string | null;
  conversation_created_by: string | null;
  conversation_state: 'inactive' | 'active' | 'closed';
  conversation_timers: Record<string, unknown> | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1ServiceParticipantConversationList {
  conversations: ConversationsV1ServiceParticipantConversation[];
  meta: VoiceV1Meta;
}

export interface ListConversationsV1ServiceParticipantConversationParams {
  Identity?: string;
  Address?: string;
  PageSize?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ServiceUserConversation —
//   /v1/Services/{ChatServiceSid}/Users/{UserSid}/Conversations (list-only)
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceUserConversation {
  account_sid: string;
  chat_service_sid: string | null;
  conversation_sid: string | null;
  unread_messages_count: number | null;
  last_read_message_index: number | null;
  participant_sid: string | null;
  user_sid: string | null;
  friendly_name: string | null;
  conversation_state: 'inactive' | 'active' | 'closed';
  timers: Record<string, unknown> | null;
  attributes: string | null;
  date_created: string | null;
  date_updated: string | null;
  created_by: string | null;
  notification_level: UserConversationNotificationLevel;
  unique_name: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1ServiceUserConversationList {
  conversations: ConversationsV1ServiceUserConversation[];
  meta: VoiceV1Meta;
}

// ---------------------------------------------------------------------------
// ServiceRole — /v1/Services/{ChatServiceSid}/Roles
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceRole {
  sid: string;
  account_sid: string;
  chat_service_sid: string | null;
  friendly_name: string | null;
  type: ConversationsRoleType;
  permissions: string[] | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
}

export interface ConversationsV1ServiceRoleList {
  roles: ConversationsV1ServiceRole[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceRoleRequest {
  FriendlyName: string;
  Type: ConversationsRoleType;
  Permission: string[];
}

export interface UpdateConversationsV1ServiceRoleRequest {
  Permission: string[];
}

// ---------------------------------------------------------------------------
// ServiceUser — /v1/Services/{ChatServiceSid}/Users
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceUser {
  sid: string;
  account_sid: string;
  chat_service_sid: string | null;
  role_sid: string | null;
  identity: string | null;
  friendly_name: string | null;
  attributes: string | null;
  is_online: boolean | null;
  is_notifiable: boolean | null;
  date_created: string | null;
  date_updated: string | null;
  url: string | null;
  links: Record<string, string> | null;
}

export interface ConversationsV1ServiceUserList {
  users: ConversationsV1ServiceUser[];
  meta: VoiceV1Meta;
}

export interface CreateConversationsV1ServiceUserRequest {
  Identity: string;
  FriendlyName?: string;
  Attributes?: string;
  RoleSid?: string;
}

export interface UpdateConversationsV1ServiceUserRequest {
  FriendlyName?: string;
  Attributes?: string;
  RoleSid?: string;
}

// ---------------------------------------------------------------------------
// ServiceBinding — /v1/Services/{ChatServiceSid}/Bindings (list/fetch/delete)
// ---------------------------------------------------------------------------

export type ServiceBindingType = 'apn' | 'gcm' | 'fcm' | 'twilsock';

export interface ConversationsV1ServiceBinding {
  sid: string;
  account_sid: string | null;
  chat_service_sid: string | null;
  credential_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  endpoint: string | null;
  identity: string | null;
  binding_type: ServiceBindingType;
  message_types: string[] | null;
  url: string | null;
}

export interface ConversationsV1ServiceBindingList {
  bindings: ConversationsV1ServiceBinding[];
  meta: VoiceV1Meta;
}

export interface ListConversationsV1ServiceBindingParams {
  BindingType?: ServiceBindingType;
  Identity?: string;
  PageSize?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ServiceConfiguration — /v1/Services/{ChatServiceSid}/Configuration
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceConfiguration {
  chat_service_sid: string | null;
  default_conversation_creator_role_sid: string | null;
  default_conversation_role_sid: string | null;
  default_chat_service_role_sid: string | null;
  url: string | null;
  links: Record<string, string> | null;
  reachability_enabled: boolean | null;
}

export interface UpdateConversationsV1ServiceConfigurationRequest {
  DefaultChatServiceRoleSid?: string;
  DefaultConversationCreatorRoleSid?: string;
  DefaultConversationRoleSid?: string;
  ReachabilityEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// ServiceNotification —
//   /v1/Services/{ChatServiceSid}/Configuration/Notifications
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceNotification {
  account_sid: string | null;
  chat_service_sid: string | null;
  new_message: Record<string, unknown> | null;
  added_to_conversation: Record<string, unknown> | null;
  removed_from_conversation: Record<string, unknown> | null;
  log_enabled: boolean | null;
  url: string | null;
}

export interface UpdateConversationsV1ServiceNotificationRequest {
  LogEnabled?: boolean;
  'NewMessage.Enabled'?: boolean;
  'NewMessage.Template'?: string;
  'NewMessage.Sound'?: string;
  'NewMessage.BadgeCountEnabled'?: boolean;
  'NewMessage.WithMedia.Enabled'?: boolean;
  'NewMessage.WithMedia.Template'?: string;
  'AddedToConversation.Enabled'?: boolean;
  'AddedToConversation.Template'?: string;
  'AddedToConversation.Sound'?: string;
  'RemovedFromConversation.Enabled'?: boolean;
  'RemovedFromConversation.Template'?: string;
  'RemovedFromConversation.Sound'?: string;
}

// ---------------------------------------------------------------------------
// ServiceWebhookConfiguration —
//   /v1/Services/{ChatServiceSid}/Configuration/Webhooks
// ---------------------------------------------------------------------------

export interface ConversationsV1ServiceWebhookConfiguration {
  account_sid: string | null;
  chat_service_sid: string | null;
  pre_webhook_url: string | null;
  post_webhook_url: string | null;
  filters: string[] | null;
  method: 'GET' | 'POST';
  url: string | null;
}

export interface UpdateConversationsV1ServiceWebhookConfigurationRequest {
  PreWebhookUrl?: string;
  PostWebhookUrl?: string;
  Method?: 'GET' | 'POST';
  Filters?: string[];
}
