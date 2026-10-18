/**
 * Pagination helpers.
 *
 * - `/2010-04-01` lists carry a relative `next_page_uri` (path + query, including the server's
 *   `PageToken`). It is followed verbatim against the scheme and host that served the page;
 *   iteration stops when it is `null`, empty or absent. The SDK never synthesises `Page=N`.
 * - `/v1` and `/v2` lists carry `meta.next_page_url` (absolute). It is only followed when its
 *   scheme and host equal the configured product host; anything else raises `PaginationError`.
 *
 * Iteration is lazy: a page is requested only when the consumer asks for an item beyond the
 * current page, and breaking out of a `for await` loop stops all further requests.
 */

import type { Transport } from './transport.js';

/** Element type of the item array carried by a list envelope (`CallList` → `Call`). */
export type PageItem<L> = {
  [K in keyof L]-?: NonNullable<L[K]> extends ReadonlyArray<infer U> ? U : never;
}[keyof L];

/** The items carried by one list envelope (the envelope's array-valued field). */
export function pageItems<L extends object>(page: L): Array<PageItem<L>> {
  for (const value of Object.values(page)) {
    if (Array.isArray(value)) return value as Array<PageItem<L>>;
  }
  return [];
}

/**
 * The link to the page after `page`: `next_page_uri` (2010 envelopes) or `meta.next_page_url`
 * (v1/v2 envelopes). `null` when the server reports no further page.
 */
export function nextPageLink(page: object): string | null {
  const p = page as { next_page_uri?: unknown; meta?: unknown };
  if (typeof p.next_page_uri === 'string' && p.next_page_uri !== '') return p.next_page_uri;
  const meta = p.meta as { next_page_url?: unknown } | null | undefined;
  if (meta && typeof meta === 'object') {
    const url = meta.next_page_url;
    if (typeof url === 'string' && url !== '') return url;
  }
  return null;
}

/** Fetch the page after `page` on `transport`, or `null` when there is none. */
export async function fetchNextPage<L extends object>(
  transport: Transport,
  page: L,
): Promise<L | null> {
  const link = nextPageLink(page);
  return link === null ? null : transport.getPage<L>(link);
}

/** Lazily yield every item of `first` and of each page linked after it. */
export async function* paginate<L extends object>(
  transport: Transport,
  first: L,
): AsyncGenerator<PageItem<L>, void, void> {
  let page = first;
  let previous: string | null = null;
  for (;;) {
    for (const item of pageItems(page)) yield item;
    const link = nextPageLink(page);
    // A page that links to itself would loop forever; treat it as the last page.
    if (link === null || link === previous) return;
    previous = link;
    page = await transport.getPage<L>(link);
  }
}
