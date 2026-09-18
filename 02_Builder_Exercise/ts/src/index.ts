// 02_Builder_Exercise Pattern - TypeScript Implementation

// Const to union pattern
export const Method = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const satisfies Record<string, string>;

export type Method = (typeof Method)[keyof typeof Method];

/**
 * In real HTTP requests, headers can have a single string value or multiple values
 * (e.g. repeated 'Set-Cookie', multiple 'Accept' / 'Via' headers).
 */
export type HeaderValue = string | readonly string[];
export type HeadersRecord = Record<string, HeaderValue>;
export type HeadersEntries = [string, HeaderValue][];
export type HeadersInput = HeadersRecord | HeadersEntries;

export interface HttpRequestOptions {
  method: Method;
  url: string;
  headers?: Record<string, HeaderValue>;
  body?: string;
  timeoutMs?: number;
  followRedirects?: boolean;
}

/**
 * Product — HttpRequest
 * Immutable representation of an HTTP request with case-insensitive multi-header support.
 */
export class HttpRequest {
  readonly method: Method;
  readonly url: string;
  readonly headers: Readonly<Record<string, HeaderValue>>;
  readonly body?: string;
  readonly timeoutMs: number;
  readonly followRedirects: boolean;

  constructor(options: HttpRequestOptions) {
    this.method = options.method;
    this.url = options.url;

    // Deep freeze headers and any multi-value arrays for true immutability
    const frozenHeaders: Record<string, HeaderValue> = {};
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        frozenHeaders[k] = Array.isArray(v) ? Object.freeze([...v]) : v;
      }
    }
    this.headers = Object.freeze(frozenHeaders);

    this.body = options.body;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.followRedirects = options.followRedirects ?? true;
    Object.freeze(this);
  }

  /**
   * Look up header value case-insensitively (e.g. 'content-type' matches 'Content-Type').
   */
  getHeader(name: string): HeaderValue | undefined {
    const target = name.toLowerCase();
    const matchKey = Object.keys(this.headers).find(
      (k) => k.toLowerCase() === target,
    );
    return matchKey ? this.headers[matchKey] : undefined;
  }

  /**
   * Case-insensitive check if a header is present.
   */
  hasHeader(name: string): boolean {
    return this.getHeader(name) !== undefined;
  }
}

// Helpers for header normalization & multi-value handling
function findHeaderKey(
  headers: Record<string, HeaderValue>,
  key: string,
): string | undefined {
  const lower = key.toLowerCase();
  return Object.keys(headers).find((k) => k.toLowerCase() === lower);
}

function setHeader(
  headers: Record<string, HeaderValue>,
  key: string,
  value: HeaderValue,
): void {
  const existing = findHeaderKey(headers, key);
  if (existing && existing !== key) {
    delete headers[existing];
  }
  headers[key] = Array.isArray(value) ? [...value] : value;
}

function appendHeader(
  headers: Record<string, HeaderValue>,
  key: string,
  value: HeaderValue,
): void {
  const existing = findHeaderKey(headers, key);
  const toAppend = Array.isArray(value) ? value : [value];
  if (existing) {
    const current = headers[existing];
    const currentList = Array.isArray(current) ? current : [current];
    headers[existing] = [...currentList, ...toAppend];
  } else {
    headers[key] = Array.isArray(value) ? [...value] : value;
  }
}

function applyHeaders(
  headers: Record<string, HeaderValue>,
  input: HeadersInput,
): void {
  if (Array.isArray(input)) {
    for (const [k, v] of input) {
      appendHeader(headers, k, v);
    }
  } else {
    for (const [k, v] of Object.entries(input)) {
      appendHeader(headers, k, v);
    }
  }
}

export interface Builder<T> {
  build(): T;
}

export interface HttpRequestBuilder extends Builder<HttpRequest> {
  method(action: Method): this;
  url(url: string): this;
  header(key: string, value: HeaderValue): this;
  appendHeader(key: string, value: HeaderValue): this;
  headers(headers: HeadersInput): this;
  body(body: string): this;
  timeoutMs(timeoutMs: number): this;
  followRedirects(follow: boolean): this;
}

export class DefaultHttpRequestBuilder implements HttpRequestBuilder {
  private _method?: Method;
  private _url?: string;
  private _headers: Record<string, HeaderValue> = {};
  private _body?: string;
  private _timeoutMs = 30_000;
  private _followRedirects = true;

  method(action: Method): this {
    this._method = action;
    return this;
  }

  url(url: string): this {
    this._url = url;
    return this;
  }

  header(key: string, value: HeaderValue): this {
    setHeader(this._headers, key, value);
    return this;
  }

  appendHeader(key: string, value: HeaderValue): this {
    appendHeader(this._headers, key, value);
    return this;
  }

  headers(headers: HeadersInput): this {
    applyHeaders(this._headers, headers);
    return this;
  }

  body(body: string): this {
    this._body = body;
    return this;
  }

  timeoutMs(timeoutMs: number): this {
    this._timeoutMs = timeoutMs;
    return this;
  }

  followRedirects(follow: boolean): this {
    this._followRedirects = follow;
    return this;
  }

  build(): HttpRequest {
    if (!this._method) {
      throw new Error("Validation Error: 'method' is required.");
    }
    if (!this._url) {
      throw new Error("Validation Error: 'url' is required.");
    }
    return new HttpRequest({
      method: this._method,
      url: this._url,
      headers: this._headers,
      body: this._body,
      timeoutMs: this._timeoutMs,
      followRedirects: this._followRedirects,
    });
  }
}

export interface ClosureHttpRequestBuilder {
  method(action: Method): ClosureHttpRequestBuilder;
  url(url: string): ClosureHttpRequestBuilder;
  header(key: string, value: HeaderValue): ClosureHttpRequestBuilder;
  appendHeader(key: string, value: HeaderValue): ClosureHttpRequestBuilder;
  headers(headers: HeadersInput): ClosureHttpRequestBuilder;
  body(body: string): ClosureHttpRequestBuilder;
  timeoutMs(timeoutMs: number): ClosureHttpRequestBuilder;
  followRedirects(follow: boolean): ClosureHttpRequestBuilder;
  build(): HttpRequest;
}

export const createHttpRequestBuilder = (): ClosureHttpRequestBuilder => {
  let method: Method | undefined;
  let url: string | undefined;
  const headers: Record<string, HeaderValue> = {};
  let body: string | undefined;
  let timeoutMs = 30_000;
  let followRedirects = true;

  return {
    method(m) {
      method = m;
      return this;
    },
    url(u) {
      url = u;
      return this;
    },
    header(k, v) {
      setHeader(headers, k, v);
      return this;
    },
    appendHeader(k, v) {
      appendHeader(headers, k, v);
      return this;
    },
    headers(h) {
      applyHeaders(headers, h);
      return this;
    },
    body(b) {
      body = b;
      return this;
    },
    timeoutMs(t) {
      timeoutMs = t;
      return this;
    },
    followRedirects(f) {
      followRedirects = f;
      return this;
    },
    build() {
      if (!method) throw new Error("Validation Error: 'method' is required.");
      if (!url) throw new Error("Validation Error: 'url' is required.");
      return new HttpRequest({
        method,
        url,
        headers,
        body,
        timeoutMs,
        followRedirects,
      });
    },
  } satisfies ClosureHttpRequestBuilder;
};

export class SafeHttpRequestBuilder<Has extends string = never> {
  // Phantom function type marker to prevent TypeScript from collapsing structural types
  declare protected readonly _has: (has: Has) => void;

  private _method?: Method;
  private _url?: string;
  private _headers: Record<string, HeaderValue> = {};
  private _body?: string;
  private _timeoutMs = 30_000;
  private _followRedirects = true;

  method(action: Method): SafeHttpRequestBuilder<Has | "method"> {
    this._method = action;
    return this as unknown as SafeHttpRequestBuilder<Has | "method">;
  }

  url(url: string): SafeHttpRequestBuilder<Has | "url"> {
    this._url = url;
    return this as unknown as SafeHttpRequestBuilder<Has | "url">;
  }

  header(key: string, value: HeaderValue): SafeHttpRequestBuilder<Has> {
    setHeader(this._headers, key, value);
    return this;
  }

  appendHeader(key: string, value: HeaderValue): SafeHttpRequestBuilder<Has> {
    appendHeader(this._headers, key, value);
    return this;
  }

  headers(headers: HeadersInput): SafeHttpRequestBuilder<Has> {
    applyHeaders(this._headers, headers);
    return this;
  }

  body(body: string): SafeHttpRequestBuilder<Has> {
    this._body = body;
    return this;
  }

  timeoutMs(timeoutMs: number): SafeHttpRequestBuilder<Has> {
    this._timeoutMs = timeoutMs;
    return this;
  }

  followRedirects(follow: boolean): SafeHttpRequestBuilder<Has> {
    this._followRedirects = follow;
    return this;
  }

  /**
   * `build()` is only callable once both "method" and "url" are in `Has`.
   * Enforced at compile time via the `this` parameter trick.
   */
  build(
    this: "method" extends Has
      ? "url" extends Has
        ? SafeHttpRequestBuilder<Has>
        : never
      : never,
  ): HttpRequest {
    const builder = this as unknown as SafeHttpRequestBuilder<any>;
    return new HttpRequest({
      method: builder._method!,
      url: builder._url!,
      headers: builder._headers,
      body: builder._body,
      timeoutMs: builder._timeoutMs,
      followRedirects: builder._followRedirects,
    });
  }
}

function main(): void {
  console.log("=== [TypeScript] 02_Builder_Exercise ===");

  console.log(
    "\n--- 1. Interface-based Fluent Builder (Multiple & Multi-value Headers) ---",
  );
  const req1 = new DefaultHttpRequestBuilder()
    .method(Method.POST)
    .url("https://api.example.com/items")
    .headers({
      "Content-Type": "application/json",
      "User-Agent": "ApiClient/2.0",
    })
    .header("Accept", ["application/json", "text/html"])
    .appendHeader("Accept", "text/plain") // appends to 'Accept' -> ['application/json', 'text/html', 'text/plain']
    .appendHeader("Set-Cookie", "session=abc123")
    .appendHeader("Set-Cookie", "theme=dark") // multiple cookie headers
    .body(JSON.stringify({ item: "book", quantity: 2 }))
    .timeoutMs(5_000)
    .followRedirects(false)
    .build();

  console.log("Built Request 1:", req1);
  console.log(
    "Case-insensitive lookup 'content-type':",
    req1.getHeader("content-type"),
  );
  console.log("Multi-value lookup 'accept':", req1.getHeader("accept"));
  console.log("Multi-value lookup 'set-cookie':", req1.getHeader("set-cookie"));

  // Runtime validation error test
  try {
    new DefaultHttpRequestBuilder().url("https://api.example.com").build();
  } catch (err: unknown) {
    console.log(
      "Caught expected error (missing method):",
      (err as Error).message,
    );
  }

  console.log("\n--- 2. Closure-based Builder (satisfies) ---");
  const req2 = createHttpRequestBuilder()
    .method(Method.GET)
    .url("https://api.example.com/users")
    .headers([
      ["Authorization", "Bearer token_xyz"],
      ["Accept", "application/json"],
    ])
    .build();
  console.log("Built Request 2:", req2);

  try {
    createHttpRequestBuilder().method(Method.GET).build();
  } catch (err: unknown) {
    console.log("Caught expected error (missing url):", (err as Error).message);
  }

  console.log(
    "\n--- 3. Compile-time Safe Builder (Typestate / this trick) ---",
  );
  const req3 = new SafeHttpRequestBuilder()
    .method(Method.PUT)
    .url("https://api.example.com/users/42")
    .header("X-Custom-Header", "value1")
    .appendHeader("X-Custom-Header", "value2")
    .body(JSON.stringify({ active: true }))
    .build();
  console.log("Built Request 3:", req3);
}

main();
