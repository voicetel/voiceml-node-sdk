/**
 * Pricing v1/v2 resource models — Twilio `pricing.twilio.com` REST surface.
 *
 * VoiceML has no dedicated pricing subdomain, so these live on the default host
 * (`voiceml.voicetel.com`) under `/v1` and `/v2`. All operations are read-only
 * `GET`s. VoiceML is NANP-only: every `Countries` list carries exactly one
 * entry (the tenant's own country), and a `Numbers` fetch 404s for a non-NANP
 * destination. All fields are permissive/nullable — the wire is snake_case.
 */

import type { VoiceV1Meta } from './voice_v1.js';

// ---------------------------------------------------------------------------
// Price leaves
// ---------------------------------------------------------------------------

export interface PricingInboundCallPrice {
  base_price: string | null;
  current_price: string | null;
  /** `local` | `toll free` */
  number_type: string | null;
}

export interface PricingOutboundCallPrice {
  base_price: string | null;
  current_price: string | null;
}

export interface PricingOutboundCallPriceWithOrigin {
  origination_prefixes: string[];
  base_price: string | null;
  current_price: string | null;
}

export interface PricingOutboundPrefixPrice {
  prefixes: string[];
  base_price: string | null;
  current_price: string | null;
  friendly_name: string | null;
}

export interface PricingOutboundPrefixPriceWithOrigin {
  origination_prefixes: string[];
  destination_prefixes: string[];
  base_price: string | null;
  current_price: string | null;
  friendly_name: string | null;
}

export interface PricingOutboundSMSPrice {
  carrier: string | null;
  mcc: string | null;
  mnc: string | null;
  prices: PricingInboundCallPrice[];
}

export interface PricingPhoneNumberPrice {
  number_type: string | null;
  base_price: string | null;
  current_price: string | null;
}

// ---------------------------------------------------------------------------
// Countries list envelope
// ---------------------------------------------------------------------------

export interface PricingCountryRef {
  country: string | null;
  iso_country: string | null;
  url: string | null;
}

export interface PricingCountriesList {
  countries: PricingCountryRef[];
  meta: VoiceV1Meta | null;
}

// ---------------------------------------------------------------------------
// Pricing v1 country / number bodies
// ---------------------------------------------------------------------------

export interface PricingVoiceCountry {
  country: string | null;
  iso_country: string | null;
  outbound_prefix_prices: PricingOutboundPrefixPrice[];
  inbound_call_prices: PricingInboundCallPrice[];
  price_unit: string | null;
  url: string | null;
}

export interface PricingVoiceNumber {
  number: string | null;
  country: string | null;
  iso_country: string | null;
  outbound_call_price: PricingOutboundCallPrice | null;
  inbound_call_price: PricingInboundCallPrice | null;
  price_unit: string | null;
  url: string | null;
}

export interface PricingMessagingCountry {
  country: string | null;
  iso_country: string | null;
  outbound_sms_prices: PricingOutboundSMSPrice[];
  inbound_sms_prices: PricingInboundCallPrice[];
  price_unit: string | null;
  url: string | null;
}

export interface PricingPhoneNumberCountry {
  country: string | null;
  iso_country: string | null;
  phone_number_prices: PricingPhoneNumberPrice[];
  price_unit: string | null;
  url: string | null;
}

// ---------------------------------------------------------------------------
// Pricing v2 country / number bodies
// ---------------------------------------------------------------------------

export interface PricingVoiceCountryV2 {
  country: string | null;
  iso_country: string | null;
  outbound_prefix_prices: PricingOutboundPrefixPriceWithOrigin[];
  inbound_call_prices: PricingInboundCallPrice[];
  price_unit: string | null;
  url: string | null;
}

export interface PricingVoiceNumberV2 {
  destination_number: string | null;
  origination_number: string | null;
  country: string | null;
  iso_country: string | null;
  outbound_call_prices: PricingOutboundCallPriceWithOrigin[];
  inbound_call_price: PricingInboundCallPrice | null;
  price_unit: string | null;
  url: string | null;
}

export interface PricingTrunkingCountry {
  country: string | null;
  iso_country: string | null;
  terminating_prefix_prices: PricingOutboundPrefixPriceWithOrigin[];
  originating_call_prices: PricingInboundCallPrice[];
  price_unit: string | null;
  url: string | null;
}

export interface PricingTrunkingNumber {
  destination_number: string | null;
  origination_number: string | null;
  country: string | null;
  iso_country: string | null;
  terminating_prefix_prices: PricingOutboundPrefixPriceWithOrigin[];
  originating_call_price: PricingInboundCallPrice | null;
  price_unit: string | null;
  url: string | null;
}

/** Query params for pricing `Countries` list endpoints. */
export interface ListPricingPageParams {
  PageSize?: number;
  // Index signature so the interface satisfies the transport's
  // `params: Record<string, unknown>` constraint without a cast.
  [key: string]: unknown;
}
