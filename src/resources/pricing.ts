import type {
  ListPricingPageParams,
  PricingCountriesList,
  PricingMessagingCountry,
  PricingPhoneNumberCountry,
  PricingTrunkingCountry,
  PricingTrunkingNumber,
  PricingVoiceCountry,
  PricingVoiceCountryV2,
  PricingVoiceNumber,
  PricingVoiceNumberV2,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.pricing.*` — Twilio `pricing.twilio.com` REST surface.
 *
 * Read-only. Served on the default host (VoiceML has no pricing subdomain).
 * Layout:
 *
 *   client.pricing.v1.voice.countries.list / fetch
 *   client.pricing.v1.voice.numbers.fetch
 *   client.pricing.v1.messaging.countries.list / fetch
 *   client.pricing.v1.phoneNumbers.countries.list / fetch
 *   client.pricing.v2.voice.countries.list / fetch
 *   client.pricing.v2.voice.numbers.fetch
 *   client.pricing.v2.trunking.countries.list / fetch
 *   client.pricing.v2.trunking.numbers.fetch
 *
 * Every `countries.list` returns the shared {@link PricingCountriesList}
 * envelope; `fetch` returns the product-specific country/number body. Number
 * path segments are URL-encoded (E.164 `+` → `%2B`) like Routes V2.
 */
export class PricingResource {
  readonly v1: PricingV1Resource;
  readonly v2: PricingV2Resource;

  constructor(transport: Transport) {
    this.v1 = new PricingV1Resource(transport);
    this.v2 = new PricingV2Resource(transport);
  }
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

/** `.../Countries` list + per-country fetch. `T` is the fetch body shape. */
export class PricingCountriesResource<T> {
  private readonly t: Transport;
  private readonly base: string;

  constructor(transport: Transport, basePath: string) {
    this.t = transport;
    this.base = basePath;
  }

  list(params: ListPricingPageParams = {}): Promise<PricingCountriesList> {
    return this.t.request<PricingCountriesList>({
      method: 'GET',
      path: this.base,
      params,
    });
  }

  fetch(isoCountry: string): Promise<T> {
    return this.t.request<T>({
      method: 'GET',
      path: `${this.base}/${isoCountry}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Pricing v1
// ---------------------------------------------------------------------------

export class PricingV1VoiceNumbersResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  fetch(number: string): Promise<PricingVoiceNumber> {
    return this.t.request<PricingVoiceNumber>({
      method: 'GET',
      path: `/v1/Voice/Numbers/${encodeURIComponent(number)}`,
    });
  }
}

export class PricingV1VoiceResource {
  readonly countries: PricingCountriesResource<PricingVoiceCountry>;
  readonly numbers: PricingV1VoiceNumbersResource;

  constructor(transport: Transport) {
    this.countries = new PricingCountriesResource(transport, '/v1/Voice/Countries');
    this.numbers = new PricingV1VoiceNumbersResource(transport);
  }
}

export class PricingV1MessagingResource {
  readonly countries: PricingCountriesResource<PricingMessagingCountry>;

  constructor(transport: Transport) {
    this.countries = new PricingCountriesResource(transport, '/v1/Messaging/Countries');
  }
}

export class PricingV1PhoneNumbersResource {
  readonly countries: PricingCountriesResource<PricingPhoneNumberCountry>;

  constructor(transport: Transport) {
    this.countries = new PricingCountriesResource(
      transport,
      '/v1/PhoneNumbers/Countries',
    );
  }
}

export class PricingV1Resource {
  readonly voice: PricingV1VoiceResource;
  readonly messaging: PricingV1MessagingResource;
  readonly phoneNumbers: PricingV1PhoneNumbersResource;

  constructor(transport: Transport) {
    this.voice = new PricingV1VoiceResource(transport);
    this.messaging = new PricingV1MessagingResource(transport);
    this.phoneNumbers = new PricingV1PhoneNumbersResource(transport);
  }
}

// ---------------------------------------------------------------------------
// Pricing v2
// ---------------------------------------------------------------------------

export class PricingV2VoiceNumbersResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  fetch(
    destinationNumber: string,
    opts: { originationNumber?: string } = {},
  ): Promise<PricingVoiceNumberV2> {
    return this.t.request<PricingVoiceNumberV2>({
      method: 'GET',
      path: `/v2/Voice/Numbers/${encodeURIComponent(destinationNumber)}`,
      params: { OriginationNumber: opts.originationNumber },
    });
  }
}

export class PricingV2TrunkingNumbersResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  fetch(
    destinationNumber: string,
    opts: { originationNumber?: string } = {},
  ): Promise<PricingTrunkingNumber> {
    return this.t.request<PricingTrunkingNumber>({
      method: 'GET',
      path: `/v2/Trunking/Numbers/${encodeURIComponent(destinationNumber)}`,
      params: { OriginationNumber: opts.originationNumber },
    });
  }
}

export class PricingV2VoiceResource {
  readonly countries: PricingCountriesResource<PricingVoiceCountryV2>;
  readonly numbers: PricingV2VoiceNumbersResource;

  constructor(transport: Transport) {
    this.countries = new PricingCountriesResource(transport, '/v2/Voice/Countries');
    this.numbers = new PricingV2VoiceNumbersResource(transport);
  }
}

export class PricingV2TrunkingResource {
  readonly countries: PricingCountriesResource<PricingTrunkingCountry>;
  readonly numbers: PricingV2TrunkingNumbersResource;

  constructor(transport: Transport) {
    this.countries = new PricingCountriesResource(transport, '/v2/Trunking/Countries');
    this.numbers = new PricingV2TrunkingNumbersResource(transport);
  }
}

export class PricingV2Resource {
  readonly voice: PricingV2VoiceResource;
  readonly trunking: PricingV2TrunkingResource;

  constructor(transport: Transport) {
    this.voice = new PricingV2VoiceResource(transport);
    this.trunking = new PricingV2TrunkingResource(transport);
  }
}
