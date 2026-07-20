var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-xkAhis/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/partyserver/dist/index.js
import { DurableObject, env } from "cloudflare:workers";

// node_modules/partyserver/node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// node_modules/partyserver/node_modules/nanoid/index.browser.js
var nanoid = /* @__PURE__ */ __name((size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
}, "nanoid");

// node_modules/partyserver/dist/index.js
if (!("OPEN" in WebSocket)) {
  const WebSocketStatus = {
    CONNECTING: WebSocket.READY_STATE_CONNECTING,
    OPEN: WebSocket.READY_STATE_OPEN,
    CLOSING: WebSocket.READY_STATE_CLOSING,
    CLOSED: WebSocket.READY_STATE_CLOSED
  };
  Object.assign(WebSocket, WebSocketStatus);
  Object.assign(WebSocket.prototype, WebSocketStatus);
}
function tryGetPartyServerMeta(ws) {
  try {
    const attachment = WebSocket.prototype.deserializeAttachment.call(ws);
    if (!attachment || typeof attachment !== "object") return null;
    if (!("__pk" in attachment)) return null;
    const pk = attachment.__pk;
    if (!pk || typeof pk !== "object") return null;
    const { id, tags } = pk;
    if (typeof id !== "string") return null;
    const { uri } = pk;
    return {
      id,
      tags: Array.isArray(tags) ? tags : [],
      uri: typeof uri === "string" ? uri : void 0
    };
  } catch {
    return null;
  }
}
__name(tryGetPartyServerMeta, "tryGetPartyServerMeta");
function isPartyServerWebSocket(ws) {
  return tryGetPartyServerMeta(ws) !== null;
}
__name(isPartyServerWebSocket, "isPartyServerWebSocket");
var AttachmentCache = class {
  static {
    __name(this, "AttachmentCache");
  }
  #cache = /* @__PURE__ */ new WeakMap();
  get(ws) {
    let attachment = this.#cache.get(ws);
    if (!attachment) {
      attachment = WebSocket.prototype.deserializeAttachment.call(ws);
      if (attachment !== void 0) this.#cache.set(ws, attachment);
      else throw new Error("Missing websocket attachment. This is most likely an issue in PartyServer, please open an issue at https://github.com/cloudflare/partykit/issues");
    }
    return attachment;
  }
  set(ws, attachment) {
    this.#cache.set(ws, attachment);
    WebSocket.prototype.serializeAttachment.call(ws, attachment);
  }
};
var attachments = new AttachmentCache();
var connections = /* @__PURE__ */ new WeakSet();
var isWrapped = /* @__PURE__ */ __name((ws) => {
  return connections.has(ws);
}, "isWrapped");
var createLazyConnection = /* @__PURE__ */ __name((ws) => {
  if (isWrapped(ws)) return ws;
  let initialState;
  if ("state" in ws) {
    initialState = ws.state;
    delete ws.state;
  }
  const connection = Object.defineProperties(ws, {
    id: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.id;
      }
    },
    uri: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.uri ?? null;
      }
    },
    tags: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.tags ?? [];
      }
    },
    socket: {
      configurable: true,
      get() {
        return ws;
      }
    },
    state: {
      configurable: true,
      get() {
        return ws.deserializeAttachment();
      }
    },
    setState: {
      configurable: true,
      value: /* @__PURE__ */ __name(function setState(setState) {
        let state;
        if (setState instanceof Function) state = setState(this.state);
        else state = setState;
        ws.serializeAttachment(state);
        return state;
      }, "setState")
    },
    deserializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function deserializeAttachment() {
        return attachments.get(ws).__user ?? null;
      }, "deserializeAttachment")
    },
    serializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function serializeAttachment(attachment) {
        const setting = {
          ...attachments.get(ws),
          __user: attachment ?? null
        };
        attachments.set(ws, setting);
      }, "serializeAttachment")
    }
  });
  if (initialState) connection.setState(initialState);
  connections.add(connection);
  return connection;
}, "createLazyConnection");
var HibernatingConnectionIterator = class {
  static {
    __name(this, "HibernatingConnectionIterator");
  }
  index = 0;
  sockets;
  constructor(state, tag) {
    this.state = state;
    this.tag = tag;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    const sockets = this.sockets ?? (this.sockets = this.state.getWebSockets(this.tag));
    let socket;
    while (socket = sockets[this.index++]) if (socket.readyState === WebSocket.READY_STATE_OPEN) {
      if (!isPartyServerWebSocket(socket)) continue;
      return {
        done: false,
        value: createLazyConnection(socket)
      };
    }
    return {
      done: true,
      value: void 0
    };
  }
};
function prepareTags(connectionId, userTags) {
  const tags = [connectionId, ...userTags.filter((t) => t !== connectionId)];
  if (tags.length > 10) throw new Error("A connection can only have 10 tags, including the default id tag.");
  for (const tag of tags) {
    if (typeof tag !== "string") throw new Error(`A connection tag must be a string. Received: ${tag}`);
    if (tag === "") throw new Error("A connection tag must not be an empty string.");
    if (tag.length > 256) throw new Error("A connection tag must not exceed 256 characters");
  }
  return tags;
}
__name(prepareTags, "prepareTags");
var InMemoryConnectionManager = class {
  static {
    __name(this, "InMemoryConnectionManager");
  }
  #connections = /* @__PURE__ */ new Map();
  tags = /* @__PURE__ */ new WeakMap();
  getCount() {
    return this.#connections.size;
  }
  getConnection(id) {
    return this.#connections.get(id);
  }
  *getConnections(tag) {
    if (!tag) {
      yield* this.#connections.values().filter((c) => c.readyState === WebSocket.READY_STATE_OPEN);
      return;
    }
    for (const connection of this.#connections.values()) if ((this.tags.get(connection) ?? []).includes(tag)) yield connection;
  }
  accept(connection, options) {
    try {
      connection.accept({ allowHalfOpen: true });
    } catch {
      connection.accept();
    }
    try {
      connection.binaryType = "arraybuffer";
    } catch {
    }
    const tags = prepareTags(connection.id, options.tags);
    this.#connections.set(connection.id, connection);
    this.tags.set(connection, tags);
    Object.defineProperty(connection, "tags", {
      get: /* @__PURE__ */ __name(() => tags, "get"),
      configurable: true
    });
    const removeConnection = /* @__PURE__ */ __name(() => {
      this.#connections.delete(connection.id);
      connection.removeEventListener("close", removeConnection);
      connection.removeEventListener("error", removeConnection);
    }, "removeConnection");
    connection.addEventListener("close", removeConnection);
    connection.addEventListener("error", removeConnection);
    return connection;
  }
};
var HibernatingConnectionManager = class {
  static {
    __name(this, "HibernatingConnectionManager");
  }
  constructor(controller) {
    this.controller = controller;
  }
  getCount() {
    let count = 0;
    for (const ws of this.controller.getWebSockets()) if (isPartyServerWebSocket(ws)) count++;
    return count;
  }
  getConnection(id) {
    const matching = this.controller.getWebSockets(id).filter((ws) => {
      return tryGetPartyServerMeta(ws)?.id === id;
    });
    if (matching.length === 0) return void 0;
    if (matching.length === 1) return createLazyConnection(matching[0]);
    throw new Error(`More than one connection found for id ${id}. Did you mean to use getConnections(tag) instead?`);
  }
  getConnections(tag) {
    return new HibernatingConnectionIterator(this.controller, tag);
  }
  accept(connection, options) {
    const tags = prepareTags(connection.id, options.tags);
    this.controller.acceptWebSocket(connection, tags);
    connection.serializeAttachment({
      __pk: {
        id: connection.id,
        tags,
        uri: connection.uri ?? void 0
      },
      __user: null
    });
    return createLazyConnection(connection);
  }
};
var CLOSING = 2;
var CLOSED = 3;
function isBenignTeardownError(ws, error) {
  const state = ws.readyState;
  if (state !== CLOSING && state !== CLOSED) return false;
  if (typeof error !== "object" || error === null) return false;
  const typed = error;
  if (typed.retryable === true) return true;
  const message = typeof typed.message === "string" ? typed.message : "";
  return /Network connection lost|WebSocket peer disconnected/i.test(message);
}
__name(isBenignTeardownError, "isBenignTeardownError");
var NAME_STORAGE_KEY = "__ps_name";
function isReservedCloseCode(code) {
  return code === 1005 || code === 1006 || code === 1015;
}
__name(isReservedCloseCode, "isReservedCloseCode");
function closeQuietly(ws, code, reason) {
  if (isReservedCloseCode(code)) return;
  try {
    ws.close(code, reason);
  } catch {
  }
}
__name(closeQuietly, "closeQuietly");
var serverMapCache = /* @__PURE__ */ new WeakMap();
var bindingNameCache = /* @__PURE__ */ new WeakMap();
var DEFAULT_ROUTING_RETRY_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 800
};
function durableObjectGetOptions(options) {
  return options?.locationHint ? { locationHint: options.locationHint } : void 0;
}
__name(durableObjectGetOptions, "durableObjectGetOptions");
function validatePositiveInteger(value, name) {
  if (!Number.isFinite(value) || value < 1) throw new Error(`${name} must be >= 1`);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
}
__name(validatePositiveInteger, "validatePositiveInteger");
function validatePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be > 0`);
}
__name(validatePositiveNumber, "validatePositiveNumber");
function resolveRoutingRetryOptions(options) {
  if (options === false) return null;
  const resolved = {
    maxAttempts: options?.maxAttempts ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxAttempts,
    baseDelayMs: options?.baseDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs: options?.maxDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxDelayMs,
    onRetry: options?.onRetry
  };
  validatePositiveInteger(resolved.maxAttempts, "routingRetry.maxAttempts");
  validatePositiveNumber(resolved.baseDelayMs, "routingRetry.baseDelayMs");
  validatePositiveNumber(resolved.maxDelayMs, "routingRetry.maxDelayMs");
  if (resolved.baseDelayMs > resolved.maxDelayMs) throw new Error("routingRetry.baseDelayMs must be <= maxDelayMs");
  return resolved;
}
__name(resolveRoutingRetryOptions, "resolveRoutingRetryOptions");
function isRetryableDurableObjectError(error) {
  if (typeof error !== "object" || error === null) return false;
  const typed = error;
  return typed.retryable === true && typed.overloaded !== true;
}
__name(isRetryableDurableObjectError, "isRetryableDurableObjectError");
function routingRetryDelayMs(attempt, options) {
  const upperBoundMs = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(Math.random() * upperBoundMs);
}
__name(routingRetryDelayMs, "routingRetryDelayMs");
async function retryDurableObjectOperation(operation, context, retryOptions) {
  const resolved = resolveRoutingRetryOptions(retryOptions);
  if (!resolved) return await operation();
  let attempt = 1;
  while (true) try {
    return await operation();
  } catch (error) {
    const nextAttempt = attempt + 1;
    if (nextAttempt > resolved.maxAttempts || !isRetryableDurableObjectError(error)) throw error;
    const delayMs = routingRetryDelayMs(attempt, resolved);
    try {
      await resolved.onRetry?.({
        error,
        attempt,
        maxAttempts: resolved.maxAttempts,
        delayMs,
        name: context.name,
        className: context.className
      });
    } catch (callbackError) {
      console.warn("PartyServer routingRetry onRetry callback failed:", callbackError);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt = nextAttempt;
  }
}
__name(retryDurableObjectOperation, "retryDurableObjectOperation");
function encodeProps(props) {
  const bytes = new TextEncoder().encode(JSON.stringify(props));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
__name(encodeProps, "encodeProps");
function decodeProps(header) {
  const trimmed = header.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  const binary = atob(header);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}
__name(decodeProps, "decodeProps");
function camelCaseToKebabCase(str) {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) return str.toLowerCase().replace(/_/g, "-");
  let kebabified = str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabified = kebabified.startsWith("-") ? kebabified.slice(1) : kebabified;
  return kebabified.replace(/_/g, "-").replace(/-$/, "");
}
__name(camelCaseToKebabCase, "camelCaseToKebabCase");
function resolveCorsHeaders(cors) {
  if (cors === true) return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400"
  };
  if (cors && typeof cors === "object") {
    const h = new Headers(cors);
    const record = {};
    h.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  return null;
}
__name(resolveCorsHeaders, "resolveCorsHeaders");
async function routePartykitRequest(req, env$1 = env, options) {
  if (!serverMapCache.has(env$1)) {
    const namespaceMap = {};
    const bindingNames2 = {};
    for (const [k, v] of Object.entries(env$1)) if (v && typeof v === "object" && "idFromName" in v && typeof v.idFromName === "function") {
      const kebab = camelCaseToKebabCase(k);
      namespaceMap[kebab] = v;
      bindingNames2[kebab] = k;
    }
    serverMapCache.set(env$1, namespaceMap);
    bindingNameCache.set(env$1, bindingNames2);
  }
  const map = serverMapCache.get(env$1);
  const bindingNames = bindingNameCache.get(env$1);
  const prefixParts = (options?.prefix || "parties").split("/");
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  if (!prefixParts.every((part, index) => parts[index] === part) || parts.length < prefixParts.length + 2) return null;
  const namespace = parts[prefixParts.length];
  const name = parts[prefixParts.length + 1];
  if (name && namespace) {
    let withCorsHeaders = function(response2) {
      if (!corsHeaders || isWebSocket) return response2;
      const newResponse = new Response(response2.body, response2);
      for (const [key, value] of Object.entries(corsHeaders)) newResponse.headers.set(key, value);
      return newResponse;
    };
    __name(withCorsHeaders, "withCorsHeaders");
    if (!map[namespace]) {
      if (namespace === "main") {
        console.warn("You appear to be migrating a PartyKit project to PartyServer.");
        console.warn(`PartyServer doesn't have a "main" party by default. Try adding this to your PartySocket client:
 
party: "${camelCaseToKebabCase(Object.keys(map)[0])}"`);
      } else console.error(`The url ${req.url}  with namespace "${namespace}" and name "${name}" does not match any server namespace. 
Did you forget to add a durable object binding to the class ${namespace[0].toUpperCase() + namespace.slice(1)} in your wrangler.jsonc?`);
      return new Response("Invalid request", { status: 400 });
    }
    const corsHeaders = resolveCorsHeaders(options?.cors);
    const isWebSocket = req.headers.get("Upgrade")?.toLowerCase() === "websocket";
    if (req.method === "OPTIONS" && corsHeaders) return new Response(null, { headers: corsHeaders });
    let doNamespace = map[namespace];
    if (options?.jurisdiction) doNamespace = doNamespace.jurisdiction(options.jurisdiction);
    const id = doNamespace.idFromName(name);
    const getOptions = durableObjectGetOptions(options);
    req = new Request(req);
    req.headers.set("x-partykit-namespace", namespace);
    if (options?.jurisdiction) req.headers.set("x-partykit-jurisdiction", options.jurisdiction);
    const className = bindingNames[namespace];
    let partyDeprecationWarned = false;
    const lobby = {
      get party() {
        if (!partyDeprecationWarned) {
          partyDeprecationWarned = true;
          console.warn('lobby.party is deprecated and currently returns the kebab-case namespace (e.g. "my-agent"). Use lobby.className instead to get the Durable Object class name (e.g. "MyAgent"). In the next major version, lobby.party will return the class name.');
        }
        return namespace;
      },
      className,
      name
    };
    if (isWebSocket) {
      if (options?.onBeforeConnect) {
        const reqOrRes = await options.onBeforeConnect(req, lobby);
        if (reqOrRes instanceof Request) req = reqOrRes;
        else if (reqOrRes instanceof Response) return reqOrRes;
      }
    } else if (options?.onBeforeRequest) {
      const reqOrRes = await options.onBeforeRequest(req, lobby);
      if (reqOrRes instanceof Request) req = reqOrRes;
      else if (reqOrRes instanceof Response) return withCorsHeaders(reqOrRes);
    }
    if (options?.props !== void 0) req.headers.set("x-partykit-props", encodeProps(options.props));
    const response = await retryDurableObjectOperation(() => doNamespace.get(id, getOptions).fetch(req.clone()), {
      name,
      className
    }, options?.routingRetry);
    return isWebSocket ? response : withCorsHeaders(response);
  } else return null;
}
__name(routePartykitRequest, "routePartykitRequest");
var Server = class extends DurableObject {
  static {
    __name(this, "Server");
  }
  static options = { hibernate: false };
  #status = "zero";
  #ParentClass = Object.getPrototypeOf(this).constructor;
  #connectionManager = this.#ParentClass.options.hibernate ? new HibernatingConnectionManager(this.ctx) : new InMemoryConnectionManager();
  /**
  * Execute SQL queries against the Server's database
  * @template T Type of the returned rows
  * @param strings SQL query template strings
  * @param values Values to be inserted into the query
  * @returns Array of query results
  */
  sql(strings, ...values) {
    let query = "";
    try {
      query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? "?" : ""), "");
      return [...this.ctx.storage.sql.exec(query, ...values)];
    } catch (e) {
      console.error(`failed to execute sql query: ${query}`, e);
      throw this.onException(e);
    }
  }
  constructor(ctx, env2) {
    super(ctx, env2);
  }
  /**
  * Handle incoming requests to the server.
  */
  async fetch(request) {
    try {
      const props = request.headers.get("x-partykit-props");
      if (props) this.#_props = decodeProps(props);
      if (!this.ctx.id.name && !this.#_name) {
        const room = request.headers.get("x-partykit-room");
        if (room) this.#_name = room;
      }
      await this.#ensureInitialized();
      if (!this.ctx.id.name && !this.#_name) throw new Error(`Cannot determine the name for ${this.#ParentClass.name}: this.ctx.id.name is undefined, no legacy __ps_name storage record is present, and no x-partykit-room header was supplied. Likely causes:
  1. The stub was built via idFromString()/newUniqueId(). PartyServer requires name-based addressing (idFromName/getByName).
  2. The workerd/wrangler runtime is too old to expose ctx.id.name \u2014 update to a recent wrangler release.
  3. You called stub.fetch() directly without going through routePartykitRequest()/getServerByName(). Prefer those, or set the x-partykit-room header.`);
      const url = new URL(request.url);
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return await this.onRequest(request);
      else {
        const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();
        let connectionId = url.searchParams.get("_pk");
        if (!connectionId) connectionId = nanoid();
        let connection = Object.assign(serverWebSocket, {
          id: connectionId,
          uri: request.url,
          server: this.name,
          tags: [],
          state: null,
          setState(setState) {
            let state;
            if (setState instanceof Function) state = setState(this.state);
            else state = setState;
            this.state = state;
            return this.state;
          }
        });
        const ctx = { request };
        const tags = await this.getConnectionTags(connection, ctx);
        connection = this.#connectionManager.accept(connection, { tags });
        if (!this.#ParentClass.options.hibernate) this.#attachSocketEventHandlers(connection);
        await this.onConnect(connection, ctx);
        return new Response(null, {
          status: 101,
          webSocket: clientWebSocket
        });
      }
    } catch (err) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} fetch:`, err);
      if (!(err instanceof Error)) throw err;
      if (request.headers.get("Upgrade") === "websocket") {
        const pair = new WebSocketPair();
        pair[1].accept();
        pair[1].send(JSON.stringify({ error: err.stack }));
        pair[1].close(1011, "Uncaught exception during session setup");
        return new Response(null, {
          status: 101,
          webSocket: pair[0]
        });
      } else return new Response(err.stack, { status: 500 });
    }
  }
  async webSocketMessage(ws, message) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onMessage(connection, message);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketMessage:`, e);
    }
  }
  async webSocketClose(ws, code, reason, wasClean) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      await this.onClose(connection, code, reason, wasClean);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketClose:`, e);
    } finally {
      closeQuietly(ws, code, reason);
    }
  }
  async webSocketError(ws, error) {
    if (!isPartyServerWebSocket(ws)) return;
    if (isBenignTeardownError(ws, error)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onError(connection, error);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketError:`, e);
    }
  }
  /**
  * Read the legacy `__ps_name` storage record as a fallback source of
  * `this.name` when `ctx.id.name` is unavailable. Covers:
  *
  *   1. Alarm handlers firing on alarm records that were scheduled by
  *      a workerd version that did not yet persist `name` into the
  *      alarm record (see the Durable Objects ID docs:
  *      https://developers.cloudflare.com/durable-objects/api/id/#name).
  *      The runtime contract for current workerd populates `ctx.id.name`
  *      in alarm handlers — see the "Raw runtime contract" tests — so
  *      this fallback exists primarily for stale on-disk alarm records
  *      and for defense-in-depth against future runtime changes.
  *   2. Legacy framework-level bootstrap patterns that write
  *      `__ps_name` directly (or call `setName()`) before triggering
  *      `__unsafe_ensureInitialized()` — typically DOs addressed via
  *      `idFromString()` / `newUniqueId()` plus a name override.
  */
  async #hydrateNameFromLegacyStorage() {
    if (this.#_name) return;
    const stored = await this.ctx.storage.get(NAME_STORAGE_KEY);
    if (stored) this.#_name = stored;
  }
  async #persistNameFallbackFromCtxId() {
    const ctxName = this.ctx.id.name;
    if (ctxName === void 0 || this.#_name) return;
    if (await this.ctx.storage.get(NAME_STORAGE_KEY) !== ctxName) await this.ctx.storage.put(NAME_STORAGE_KEY, ctxName);
    this.#_name = ctxName;
  }
  /**
  * @internal — Do not use directly. This is an escape hatch for frameworks
  * (like Agents) that receive calls via native DO RPC, bypassing the
  * standard fetch/alarm/webSocket entry points where initialization
  * normally happens. Calling this from application code is unsupported
  * and may break without notice.
  */
  async __unsafe_ensureInitialized() {
    await this.#ensureInitialized();
  }
  async #ensureInitialized() {
    if (this.#status === "started") return;
    if (this.ctx.id.name !== void 0) await this.#persistNameFallbackFromCtxId();
    else if (!this.#_name) await this.#hydrateNameFromLegacyStorage();
    let error;
    await this.ctx.blockConcurrencyWhile(async () => {
      this.#status = "starting";
      try {
        await this.onStart(this.#_props);
        this.#status = "started";
      } catch (e) {
        this.#status = "zero";
        error = e;
      }
    });
    if (error) throw error;
  }
  #attachSocketEventHandlers(connection) {
    const handleMessageFromClient = /* @__PURE__ */ __name((event) => {
      this.onMessage(connection, event.data)?.catch((e) => {
        console.error("onMessage error:", e);
      });
    }, "handleMessageFromClient");
    const reciprocateClose = /* @__PURE__ */ __name((event) => {
      closeQuietly(connection, event.code, event.reason);
    }, "reciprocateClose");
    const handleCloseFromClient = /* @__PURE__ */ __name((event) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("close", handleCloseFromClient);
      let result;
      try {
        result = this.onClose(connection, event.code, event.reason, event.wasClean);
      } catch (e) {
        console.error("onClose error:", e);
        reciprocateClose(event);
        return;
      }
      if (result && typeof result.then === "function") result.catch((e) => {
        console.error("onClose error:", e);
      }).finally(() => reciprocateClose(event));
      else reciprocateClose(event);
    }, "handleCloseFromClient");
    const handleErrorFromClient = /* @__PURE__ */ __name((e) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("error", handleErrorFromClient);
      if (isBenignTeardownError(connection, e.error)) return;
      this.onError(connection, e.error)?.catch((err) => {
        console.error("onError error:", err);
      });
    }, "handleErrorFromClient");
    connection.addEventListener("close", handleCloseFromClient);
    connection.addEventListener("error", handleErrorFromClient);
    connection.addEventListener("message", handleMessageFromClient);
  }
  #_name;
  /**
  * The name for this server.
  *
  * Resolves from `this.ctx.id.name` — the native DO id name, populated
  * whenever the stub was created via `idFromName()` or `getByName()`.
  * This is available inside every entry point (including the constructor,
  * alarms, and hibernating websocket handlers).
  *
  * For alarm handlers firing on stale on-disk alarm records from
  * older workerd versions that didn't persist `name` into the alarm
  * record, the name is recovered from a storage fallback record.
  *
  * Throws if neither source is available — typically this means the DO
  * was addressed via `idFromString()` or `newUniqueId()`, which is not
  * supported by PartyServer.
  */
  get name() {
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0) return ctxName;
    if (this.#_name) return this.#_name;
    throw new Error(`Attempting to read .name on ${this.#ParentClass.name}, but this.ctx.id.name is not set and no ${NAME_STORAGE_KEY} fallback record is available. PartyServer requires DOs to be addressed via idFromName()/getByName(), or explicitly bootstrapped with setName() when using idFromString()/newUniqueId(). If this happens in an alarm handler firing on a stale alarm record, initialize the DO from a fetch/RPC entry point first so PartyServer can persist the fallback name.`);
  }
  /**
  * Establish this server's name and trigger `onStart()`.
  *
  * Use cases:
  *
  *   1. **Framework-level bootstrap of DOs where `ctx.id.name` is
  *      undefined** — e.g. DOs addressed via `idFromString()` /
  *      `newUniqueId()`. `setName()` stashes the name in memory and
  *      persists it under `__ps_name` so cold-wake invocations
  *      recover it via `#ensureInitialized()`'s legacy fallback.
  *   2. **Delivering initial `props` to `onStart()`** via the
  *      optional second argument.
  *
  * For DOs addressed via `idFromName()` / `getByName()`, calling
  * `setName()` is redundant — `this.name` is available automatically
  * from `ctx.id.name`. The normal initialization path also persists
  * a fallback record so old-compat alarm handlers can recover the name.
  * Throws if `name` does not match `ctx.id.name`.
  *
  * **Not appropriate for facets.** Cloudflare Agents and any other
  * framework using `ctx.facets.get(...)` should pass an explicit
  * `id` in `FacetStartupOptions` so the facet has its own
  * `ctx.id.name`:
  *
  * ```ts
  * const stub = ctx.facets.get(facetKey, () => ({
  *   class: ChildClass,
  *   id: ctx.exports.SomeBoundDOClass.idFromName(facetName),
  * }));
  * ```
  *
  * Without an explicit `id`, the facet inherits the parent DO's
  * `ctx.id` (including `ctx.id.name`), and `setName()` will throw
  * the ctx.id.name-mismatch error because the facet's intended
  * name differs from the parent's. See
  * https://developers.cloudflare.com/dynamic-workers/usage/durable-object-facets/
  * for the `FacetStartupOptions.id` semantics.
  *
  * @deprecated for callers that address DOs via `idFromName()` /
  * `getByName()`. Still the supported API for framework-level
  * bootstrap of header/`newUniqueId`-addressed DOs and for
  * delivering initial `props` to `onStart()`.
  */
  async setName(name, props) {
    if (!name) throw new Error("A name is required.");
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0 && ctxName !== name) throw new Error(`This server's Durable Object id was created for name "${ctxName}", cannot setName to "${name}".`);
    if (this.#_name && this.#_name !== name) throw new Error(`This server already has a name: ${this.#_name}, attempting to set to: ${name}`);
    if (props !== void 0) this.#_props = props;
    if (!this.#_name && ctxName === void 0) {
      await this.ctx.storage.put(NAME_STORAGE_KEY, name);
      this.#_name = name;
    }
    await this.#ensureInitialized();
  }
  /**
  * @internal
  * @deprecated Retained for backward compatibility with older callers.
  * `routePartykitRequest` no longer uses this method; it sends props via
  * the `x-partykit-props` header on the underlying `fetch()` request.
  */
  async _initAndFetch(name, props, request) {
    await this.setName(name, props);
    return this.fetch(request);
  }
  #sendMessageToConnection(connection, message) {
    try {
      connection.send(message);
    } catch (_e) {
      connection.close(1011, "Unexpected error");
    }
  }
  /** Send a message to all connected clients, except connection ids listed in `without` */
  broadcast(msg, without) {
    for (const connection of this.#connectionManager.getConnections()) if (!without || !without.includes(connection.id)) this.#sendMessageToConnection(connection, msg);
  }
  /** Get a connection by connection id */
  getConnection(id) {
    return this.#connectionManager.getConnection(id);
  }
  /**
  * Get all connections. Optionally, you can provide a tag to filter returned connections.
  * Use `Server#getConnectionTags` to tag the connection on connect.
  */
  getConnections(tag) {
    return this.#connectionManager.getConnections(tag);
  }
  /**
  * You can tag a connection to filter them in Server#getConnections.
  * Each connection supports up to 9 tags, each tag max length is 256 characters.
  */
  getConnectionTags(connection, context) {
    return [];
  }
  #_props;
  /**
  * Called when the server is started for the first time.
  */
  onStart(props) {
  }
  /**
  * Called when a new connection is made to the server.
  */
  onConnect(connection, ctx) {
  }
  /**
  * Called when a message is received from a connection.
  */
  onMessage(connection, message) {
  }
  /**
  * Called when a connection is closed.
  */
  onClose(connection, code, reason, wasClean) {
  }
  /**
  * Called when an error occurs on a connection.
  */
  onError(connection, error) {
    console.error(`Error on connection ${connection.id} in ${this.#ParentClass.name}:${this.name}:`, error);
    console.info(`Implement onError on ${this.#ParentClass.name} to handle this error.`);
  }
  /**
  * Called when a request is made to the server.
  */
  onRequest(request) {
    console.warn(`onRequest hasn't been implemented on ${this.#ParentClass.name}:${this.name} responding to ${request.url}`);
    return new Response("Not implemented", { status: 404 });
  }
  /**
  * Called when an exception occurs.
  * @param error - The error that occurred.
  */
  onException(error) {
    console.error(`Exception in ${this.#ParentClass.name}:${this.name}:`, error);
    console.info(`Implement onException on ${this.#ParentClass.name} to handle this error.`);
  }
  onAlarm() {
    console.log(`Implement onAlarm on ${this.#ParentClass.name} to handle alarms.`);
  }
  async alarm() {
    await this.#ensureInitialized();
    await this.onAlarm();
  }
};

// party/words.js
var WORDS = [
  "N\xFAi l\u1EEDa",
  "Th\xE1c n\u01B0\u1EDBc",
  "S\xF4ng ng\xF2i",
  "Bi\u1EC3n c\u1EA3",
  "Sa m\u1EA1c",
  "R\u1EEBng r\u1EADm",
  "\u0110\u1ED3ng c\u1ECF",
  "H\u1ED3 n\u01B0\u1EDBc",
  "\u0110\u1EA7m l\u1EA7y",
  "Hang \u0111\u1ED9ng",
  "V\xE1ch \u0111\xE1",
  "B\xE3i bi\u1EC3n",
  "\u0110\u1EA3o san h\xF4",
  "Su\u1ED1i n\u01B0\u1EDBc",
  "C\xE1nh \u0111\u1ED3ng",
  "Thung l\u0169ng",
  "Cao nguy\xEAn",
  "\u0110\u1ED3i c\xE1t",
  "S\xF4ng b\u0103ng",
  "R\u1EA1n san h\xF4",
  "M\u1ECF v\xE0ng",
  "H\u1EBBm n\xFAi",
  "\u0110\u1ED3ng b\u1EB1ng",
  "B\xE1n \u0111\u1EA3o",
  "V\u1ECBnh bi\u1EC3n",
  "\u1ED0c \u0111\u1EA3o",
  "M\u0169i \u0111\u1EA5t",
  "B\u1EDD bi\u1EC3n",
  "D\xE3y n\xFAi",
  "Khe su\u1ED1i",
  "C\u1EEDa s\xF4ng",
  "H\xF2n \u0111\u1EA3o",
  "Th\u1EA3o nguy\xEAn",
  "R\u1EEBng th\xF4ng",
  "R\u1EEBng ng\u1EADp m\u1EB7n",
  "\u0110\xE8o cao",
  "Gh\u1EC1nh \u0111\xE1",
  "H\u1ED1 s\xE2u",
  "\u0110\u1EC9nh n\xFAi",
  "Ch\xE2n tr\u1EDDi",
  "Con h\u1ED5",
  "Con s\u01B0 t\u1EED",
  "Con voi",
  "Con r\u1ED3ng",
  "Con c\xE1 voi",
  "Con \u0111\u1EA1i b\xE0ng",
  "Chim c\xE1nh c\u1EE5t",
  "Con b\u1EA1ch tu\u1ED9c",
  "Con r\u1EAFn h\u1ED5",
  "Con c\xE1 s\u1EA5u",
  "Con g\u1EA5u tr\xFAc",
  "Con kh\u1EC9",
  "Con ng\u1EF1a",
  "Con m\xE8o",
  "Con ch\xF3",
  "Con th\u1ECF",
  "Con h\u01B0\u01A1u",
  "Con nai",
  "Con s\xF3c",
  "Con ong",
  "Con b\u01B0\u1EDBm",
  "Con ki\u1EBFn",
  "Con nh\u1EC7n",
  "Con \u1EBFch",
  "Con r\xF9a",
  "Con cua",
  "Con t\xF4m",
  "Con s\u1EE9a",
  "C\xE1 heo",
  "C\xE1 m\u1EADp",
  "Con c\xF4ng",
  "Con g\xE0",
  "Con v\u1ECBt",
  "Con ng\u1ED7ng",
  "Con b\u1ED3 c\xE2u",
  "Con qu\u1EA1",
  "Con k\xE9t",
  "Con c\xFA",
  "Con di\u1EC1u h\xE2u",
  "Con h\u1EA3i c\u1EA9u",
  "Con l\u1EA1c \u0111\xE0",
  "Con t\xEA gi\xE1c",
  "Con h\xE0 m\xE3",
  "Con b\xE1o",
  "Con s\xF3i",
  "Con c\xE1o",
  "Con g\u1EA5u",
  "C\xE1 ng\u1EF1a",
  "Con d\u01A1i",
  "Con b\u1ECD c\u1EA1p",
  "Ph\u1EDF b\xF2",
  "B\xE1nh m\xEC",
  "B\xFAn ch\u1EA3",
  "G\u1ECFi cu\u1ED1n",
  "Ch\u1EA3 gi\xF2",
  "B\xE1nh x\xE8o",
  "C\u01A1m t\u1EA5m",
  "B\xFAn b\xF2 Hu\u1EBF",
  "M\xEC Qu\u1EA3ng",
  "B\xE1nh cu\u1ED1n",
  "X\xF4i g\u1EA5c",
  "Ch\xE8 \u0111\u1EADu",
  "Kem d\u1EEBa",
  "N\u01B0\u1EDBc m\xEDa",
  "Tr\xE0 \u0111\xE1",
  "C\xE0 ph\xEA s\u1EEFa",
  "Sinh t\u1ED1",
  "N\u01B0\u1EDBc d\u1EEBa",
  "Bia h\u01A1i",
  "R\u01B0\u1EE3u vang",
  "S\u1EA7u ri\xEAng",
  "Xo\xE0i ch\xEDn",
  "Thanh long",
  "Ch\xF4m ch\xF4m",
  "M\u0103ng c\u1EE5t",
  "D\u01B0a h\u1EA5u",
  "Chu\u1ED1i ti\xEAu",
  "B\u01B0\u1EDFi da xanh",
  "M\xEDt t\u1ED1 n\u1EEF",
  "V\u1EA3i thi\u1EC1u",
  "Nh\xE3n l\u1ED3ng",
  "\u1ED4i x\xE1 l\u1ECB",
  "Cam s\xE0nh",
  "Qu\xFDt \u0111\u01B0\u1EDDng",
  "D\xE2u t\xE2y",
  "B\xE1nh ch\u01B0ng",
  "Nem chua",
  "Gi\xF2 l\u1EE5a",
  "Th\u1ECBt kho",
  "Canh chua",
  "L\u1EA9u n\u1EA5m",
  "G\xE0 n\u01B0\u1EDBng",
  "T\xF4m h\xF9m",
  "C\xE1 thu",
  "M\u1EF1c n\u01B0\u1EDBng",
  "Sushi",
  "Pizza",
  "Hamburger",
  "Chocolate",
  "K\u1EB9o cao su",
  "C\xE1i b\xFAa",
  "C\xE1i k\xE9o",
  "C\xE1i dao",
  "C\xE1i th\xECa",
  "C\xE1i \u0111\u0169a",
  "C\xE1i n\u1ED3i",
  "C\xE1i ch\u1EA3o",
  "C\xE1i ly",
  "C\xE1i b\xE1t",
  "C\xE1i \u0111\u0129a",
  "C\xE2y n\u1EBFn",
  "C\xE1i g\u01B0\u01A1ng",
  "C\xE1i \xF4",
  "Ch\xECa kh\xF3a",
  "\u1ED4 kh\xF3a",
  "C\xE1i qu\u1EA1t",
  "C\xE1i gh\u1EBF",
  "C\xE1i b\xE0n",
  "C\xE1i gi\u01B0\u1EDDng",
  "C\xE1i t\u1EE7",
  "C\xE1i chu\xF4ng",
  "C\xE1i c\xF2i",
  "S\u1EE3i d\xE2y",
  "C\xE1i thang",
  "C\xE1i x\xF4",
  "C\xE1i x\u1EBBng",
  "C\xE1i cu\u1ED1c",
  "C\xE1i r\xECu",
  "C\xE1i c\u01B0a",
  "\u0110inh v\xEDt",
  "C\xE1i b\u1EABy",
  "C\xE1i l\u1ED3ng",
  "C\xE1i r\u1ED5",
  "C\xE1i th\xFAng",
  "C\xE1i ch\u1ED5i",
  "C\xE1i m\u1ECF l\u1EBFt",
  "C\xE1i k\xECm",
  "C\xE1i \u0111\xE8n pin",
  "La b\xE0n",
  "\u1ED0ng nh\xF2m",
  "B\xE1c s\u0129",
  "Y t\xE1",
  "Gi\xE1o vi\xEAn",
  "K\u1EF9 s\u01B0",
  "Ki\u1EBFn tr\xFAc s\u01B0",
  "Lu\u1EADt s\u01B0",
  "Phi c\xF4ng",
  "Th\u1EE7y th\u1EE7",
  "\u0110\u1EA7u b\u1EBFp",
  "Th\u1EE3 m\u1ED9c",
  "Th\u1EE3 \u0111i\u1EC7n",
  "Th\u1EE3 may",
  "N\xF4ng d\xE2n",
  "Ng\u01B0 d\xE2n",
  "Th\u1EE3 s\u0103n",
  "Nh\xE0 b\xE1o",
  "Ph\xF3ng vi\xEAn",
  "Di\u1EC5n vi\xEAn",
  "Ca s\u0129",
  "H\u1ECDa s\u0129",
  "Nh\u1EA1c s\u0129",
  "Nh\xE0 th\u01A1",
  "Nh\xE0 v\u0103n",
  "Nh\xE0 khoa h\u1ECDc",
  "Th\xE1m t\u1EED",
  "C\u1EA3nh s\xE1t",
  "L\xEDnh c\u1EE9u h\u1ECFa",
  "Phi h\xE0nh gia",
  "Th\u1EE3 l\u1EB7n",
  "Th\u1EE3 r\xE8n",
  "Th\u1EE3 h\xE0n",
  "D\u01B0\u1EE3c s\u0129",
  "Nha s\u0129",
  "Th\xFA y",
  "Hu\u1EA5n luy\u1EC7n vi\xEAn",
  "Tr\u1ECDng t\xE0i",
  "Th\u1EE3 c\u1EAFt t\xF3c",
  "Nhi\u1EBFp \u1EA3nh gia",
  "Nh\xE0 ngo\u1EA1i giao",
  "Th\u1EE3 kim ho\xE0n",
  "B\xF3ng \u0111\xE1",
  "B\xF3ng r\u1ED5",
  "B\xF3ng chuy\u1EC1n",
  "B\xF3ng b\xE0n",
  "C\u1EA7u l\xF4ng",
  "Qu\u1EA7n v\u1EE3t",
  "B\u01A1i l\u1ED9i",
  "\u0110i\u1EC1n kinh",
  "\u0110ua xe",
  "Leo n\xFAi",
  "Tr\u01B0\u1EE3t tuy\u1EBFt",
  "L\u01B0\u1EDBt s\xF3ng",
  "\u0110\u1EA5u ki\u1EBFm",
  "B\u1EAFn cung",
  "C\u1EED t\u1EA1",
  "\u0110\u1EA5u v\u1EADt",
  "Boxing",
  "Judo",
  "Karate",
  "Taekwondo",
  "C\u1EDD vua",
  "Bi-a",
  "Bowling",
  "Golf",
  "Kh\xFAc c\xF4n c\u1EA7u",
  "B\xF3ng n\xE9m",
  "Ch\u1EA1y marathon",
  "Nh\u1EA3y xa",
  "Nh\u1EA3y cao",
  "N\xE9m \u0111\u0129a",
  "\u0110ua thuy\u1EC1n",
  "Ch\xE8o thuy\u1EC1n",
  "\u0110ua ng\u1EF1a",
  "Polo",
  "B\xF3ng b\u1EA7u d\u1EE5c",
  "Xe \u0111\u1EA1p \u0111ua",
  "L\u1EB7n bi\u1EC3n",
  "Tr\u01B0\u1EE3t b\u0103ng",
  "Th\u1EC3 d\u1EE5c d\u1EE5ng c\u1EE5",
  "V\xF5 thu\u1EADt",
  "\u0110\xE0n guitar",
  "\u0110\xE0n piano",
  "Tr\u1ED1ng tr\u1EADn",
  "S\xE1o tr\xFAc",
  "\u0110\xE0n tranh",
  "\u0110\xE0n b\u1EA7u",
  "\u0110\xE0n nh\u1ECB",
  "K\xE8n trumpet",
  "Violin",
  "\u0110\xE0n harp",
  "Tr\u1ED1ng \u0111\u1ED3ng",
  "\u0110\xE0n t\u1EF3 b\xE0",
  "C\u1ED3ng chi\xEAng",
  "K\xE8n harmonica",
  "Accordion",
  "\u0110\xE0n ukulele",
  "B\u1EA3n nh\u1EA1c",
  "Giai \u0111i\u1EC7u",
  "D\xE0n nh\u1EA1c",
  "Ban nh\u1EA1c",
  "Micro",
  "Loa th\xF9ng",
  "\u0110\u0129a nh\u1EA1c",
  "S\xE2n kh\u1EA5u",
  "Ph\xF2ng thu",
  "Thanh ki\u1EBFm",
  "T\u1EA5m khi\xEAn",
  "M\u0169i gi\xE1o",
  "Cung t\xEAn",
  "\xC1o gi\xE1p",
  "Ph\xE1o \u0111\xE0i",
  "Th\xE0nh tr\xEC",
  "L\xE2u \u0111\xE0i",
  "Kim t\u1EF1 th\xE1p",
  "V\u1EA1n L\xFD",
  "Ho\xE0ng \u0111\u1EBF",
  "N\u1EEF ho\xE0ng",
  "Hi\u1EC7p s\u0129",
  "Chi\u1EBFn binh",
  "T\u01B0\u1EDBng qu\xE2n",
  "Samurai",
  "Viking",
  "Pharaoh",
  "Gladiator",
  "Chi\u1EBFn xa",
  "\u0110\u1EA1i b\xE1c",
  "Xe t\u0103ng",
  "Chi\u1EBFn h\u1EA1m",
  "T\xE0u ng\u1EA7m",
  "M\xECn b\u1EABy",
  "L\xE1 c\u1EDD",
  "V\u01B0\u01A1ng mi\u1EC7n",
  "Ngai v\xE0ng",
  "Con d\u1EA5u",
  "B\u1EA3n \u0111\u1ED3 c\u1ED5",
  "K\xEDnh hi\u1EC3n vi",
  "\u1ED0ng nghi\u1EC7m",
  "T\u1EBF b\xE0o",
  "Ph\xE2n t\u1EED",
  "Nguy\xEAn t\u1EED",
  "Proton",
  "Electron",
  "Nam ch\xE2m",
  "Pin \u0111i\u1EC7n",
  "M\u1EA1ch \u0111i\u1EC7n",
  "Robot",
  "M\xE1y t\xEDnh",
  "\u0110i\u1EC7n tho\u1EA1i",
  "Internet",
  "V\u1EC7 tinh",
  "T\xEAn l\u1EEDa",
  "K\xEDnh thi\xEAn v\u0103n",
  "Th\u1EA5u k\xEDnh",
  "Nhi\u1EC7t k\u1EBF",
  "C\xE2n \u0111i\u1EC7n t\u1EED",
  "Laser",
  "Radar",
  "Sonar",
  "Tia X",
  "DNA",
  "Vaccine",
  "Virus",
  "Vi khu\u1EA9n",
  "Gen di truy\u1EC1n",
  "H\xF3a th\u1EA1ch",
  "M\xE1y in 3D",
  "Chip b\xE1n d\u1EABn",
  "M\xE1y ph\xE1t \u0111i\u1EC7n",
  "T\u1EA5m pin m\u1EB7t tr\u1EDDi",
  "C\xE1p quang",
  "\u1ED4 c\u1EE9ng",
  "USB",
  "M\xE0n h\xECnh",
  "B\xE0n ph\xEDm",
  "Con chu\u1ED9t",
  "Xe m\xE1y",
  "Xe \u0111\u1EA1p",
  "\xD4 t\xF4",
  "Xe bu\xFDt",
  "Xe l\u1EEDa",
  "T\xE0u h\u1ECFa",
  "M\xE1y bay",
  "Tr\u1EF1c th\u0103ng",
  "T\xE0u th\u1EE7y",
  "Thuy\u1EC1n bu\u1ED3m",
  "Ca n\xF4",
  "Xe c\u1EE9u th\u01B0\u01A1ng",
  "Xe c\u1EA3nh s\xE1t",
  "Xe c\u1EE9u h\u1ECFa",
  "Xe t\u1EA3i",
  "Xe b\u1ED3n",
  "Xe r\xE1c",
  "Xe c\u1EA7n c\u1EA9u",
  "Xe \u1EE7i",
  "Xe lu",
  "Khinh kh\xED c\u1EA7u",
  "T\xE0u \u0111i\u1EC7n",
  "C\xE1p treo",
  "Thang m\xE1y",
  "Thang cu\u1ED1n",
  "X\xEDch l\xF4",
  "Xe k\xE9o",
  "Xu\u1ED3ng m\xE1y",
  "Ph\xE0 bi\u1EC3n",
  "T\xE0u cao t\u1ED1c",
  "\xC1o d\xE0i",
  "\xC1o s\u01A1 mi",
  "Qu\u1EA7n jeans",
  "V\xE1y \u0111\u1EA7m",
  "\xC1o kho\xE1c",
  "\xC1o len",
  "\xC1o vest",
  "\xC1o m\u01B0a",
  "Kh\u0103n qu\xE0ng",
  "M\u0169 b\u1EA3o hi\u1EC3m",
  "M\u0169 n\xF3n",
  "Gi\xE0y th\u1EC3 thao",
  "D\xE9p t\xF4ng",
  "\u1EE6ng cao su",
  "G\u0103ng tay",
  "K\xEDnh r\xE2m",
  "\u0110\u1ED3ng h\u1ED3 \u0111eo tay",
  "D\xE2y chuy\u1EC1n",
  "Nh\u1EABn c\u01B0\u1EDBi",
  "B\xF4ng tai",
  "V\xF2ng tay",
  "Th\u1EAFt l\u01B0ng",
  "V\xED da",
  "Ba l\xF4",
  "T\xFAi x\xE1ch",
  "C\xE0 v\u1EA1t",
  "N\u01A1 b\u01B0\u1EDBm",
  "M\u0169 ph\u1EDBt",
  "Kh\u0103n tay",
  "Tr\xE1i tim",
  "B\u1ED9 n\xE3o",
  "L\xE1 ph\u1ED5i",
  "D\u1EA1 d\xE0y",
  "X\u01B0\u01A1ng s\u1ED1ng",
  "B\xE0n tay",
  "B\xE0n ch\xE2n",
  "Ng\xF3n tay",
  "Khu\u1EF7u tay",
  "\u0110\u1EA7u g\u1ED1i",
  "L\xF4ng m\xE0y",
  "L\u01B0\u1EE1i",
  "R\u0103ng nanh",
  "Tai",
  "M\u0169i",
  "C\u1ED5 tay",
  "M\u1EAFt c\xE1 ch\xE2n",
  "G\xF3t ch\xE2n",
  "Vai",
  "C\u1EB1m",
  "Tr\xE1n",
  "M\xE1",
  "C\u01A1 b\u1EAFp",
  "G\xE2n",
  "M\u1EA1ch m\xE1u",
  "N\u1EE5 c\u01B0\u1EDDi",
  "Gi\u1ECDt n\u01B0\u1EDBc m\u1EAFt",
  "Ti\u1EBFng c\u01B0\u1EDDi",
  "Ti\u1EBFng kh\xF3c",
  "C\xE1i \xF4m",
  "N\u1EE5 h\xF4n",
  "Gi\u1EA5c m\u01A1",
  "C\u01A1n \xE1c m\u1ED9ng",
  "N\u1ED7i nh\u1EDB",
  "L\u1EDDi h\u1EE9a",
  "B\xED m\u1EADt",
  "K\u1EF7 ni\u1EC7m",
  "Hy v\u1ECDng",
  "Ni\u1EC1m tin",
  "S\u1EF1 d\u0169ng c\u1EA3m",
  "B\u1EA3ng \u0111en",
  "Ph\u1EA5n tr\u1EAFng",
  "C\u1EE5c t\u1EA9y",
  "B\xFAt ch\xEC",
  "B\xFAt m\u1EF1c",
  "Th\u01B0\u1EDBc k\u1EBB",
  "Compa",
  "C\u1EB7p s\xE1ch",
  "S\xE1ch gi\xE1o khoa",
  "V\u1EDF b\xE0i t\u1EADp",
  "B\u1EA3n \u0111\u1ED3",
  "Qu\u1EA3 \u0111\u1ECBa c\u1EA7u",
  "K\xEDnh l\xFAp",
  "M\xE1y chi\u1EBFu",
  "B\u1EA3ng tr\u1EAFng",
  "Ph\xF2ng th\xED nghi\u1EC7m",
  "Th\u01B0 vi\u1EC7n",
  "S\xE2n tr\u01B0\u1EDDng",
  "C\u1ED5ng tr\u01B0\u1EDDng",
  "L\u1EDBp h\u1ECDc",
  "\u1ED0ng ti\xEAm",
  "Vi\xEAn thu\u1ED1c",
  "B\u0103ng g\u1EA1c",
  "Xe l\u0103n",
  "N\u1EA1ng g\u1ED7",
  "Kh\u1EA9u trang",
  "\u1ED0ng nghe",
  "M\xE1y si\xEAu \xE2m",
  "Gi\u01B0\u1EDDng b\u1EC7nh",
  "Ph\xF2ng m\u1ED5",
  "\xC1o blouse",
  "B\xECnh oxy",
  "T\xFAi m\xE1u",
  "\xD4ng n\u1ED9i",
  "B\xE0 ngo\u1EA1i",
  "B\u1ED1 m\u1EB9",
  "Anh trai",
  "Ch\u1ECB g\xE1i",
  "Em b\xE9",
  "Ch\xE1u n\u1ED9i",
  "C\xF4 d\xE2u",
  "Ch\xFA r\u1EC3",
  "Ph\xF9 d\xE2u",
  "\u0110\xE1m c\u01B0\u1EDBi",
  "L\u1EC5 \u0103n h\u1ECFi",
  "B\u1EEFa c\u01A1m",
  "Album \u1EA3nh",
  "Gia ph\u1EA3",
  "C\u01A1n b\xE3o",
  "S\u1EA5m s\xE9t",
  "C\u1EA7u v\u1ED3ng",
  "B\xF4ng tuy\u1EBFt",
  "M\u01B0a \u0111\xE1",
  "S\u01B0\u01A1ng m\xF9",
  "L\u1ED1c xo\xE1y",
  "S\xF3ng th\u1EA7n",
  "\u0110\u1ED9ng \u0111\u1EA5t",
  "H\u1EA1n h\xE1n",
  "L\u0169 l\u1EE5t",
  "Gi\xF4ng t\u1ED1",
  "M\u01B0a r\xE0o",
  "N\u1EAFng g\u1EAFt",
  "Gi\xF3 m\xF9a",
  "S\u01B0\u01A1ng gi\xE1",
  "M\xE2y t\xEDch",
  "B\xE3o c\xE1t",
  "Tuy\u1EBFt l\u1EDF",
  "D\xF2ng nham th\u1EA1ch",
  "M\u1EB7t tr\u1EDDi",
  "M\u1EB7t tr\u0103ng",
  "Ng\xF4i sao",
  "Sao H\u1ECFa",
  "Sao Kim",
  "Sao Th\u1ED5",
  "Sao M\u1ED9c",
  "D\u1EA3i Ng\xE2n H\xE0",
  "H\u1ED1 \u0111en",
  "Sao ch\u1ED5i",
  "Thi\xEAn th\u1EA1ch",
  "Tinh v\xE2n",
  "Tr\u1EA1m v\u0169 tr\u1EE5",
  "T\xE0u v\u0169 tr\u1EE5",
  "Phi thuy\u1EC1n",
  "Nh\u1EADt th\u1EF1c",
  "Nguy\u1EC7t th\u1EF1c",
  "Ch\xF2m sao",
  "M\xE1i nh\xE0",
  "C\u1EEDa s\u1ED5",
  "C\u1EEDa ch\xEDnh",
  "Ban c\xF4ng",
  "S\xE2n th\u01B0\u1EE3ng",
  "T\u1EA7ng h\u1EA7m",
  "G\xE1c x\xE9p",
  "C\u1EA7u thang",
  "H\xE0ng r\xE0o",
  "C\u1ED5ng s\u1EAFt",
  "B\u1ED3n t\u1EAFm",
  "V\xF2i sen",
  "B\u1ED3n c\u1EA7u",
  "B\u1ED3n r\u1EEDa",
  "T\u1EE7 l\u1EA1nh",
  "M\xE1y gi\u1EB7t",
  "L\xF2 vi s\xF3ng",
  "B\u1EBFp ga",
  "N\u1ED3i c\u01A1m \u0111i\u1EC7n",
  "M\xE1y h\xFAt b\u1EE5i",
  "\u0110\xE8n ch\xF9m",
  "R\xE8m c\u1EEDa",
  "Th\u1EA3m tr\u1EA3i",
  "G\u1ED1i \xF4m",
  "Ch\u0103n b\xF4ng",
  "T\u1EE7 s\xE1ch",
  "K\u1EC7 gi\xE0y",
  "B\xE0n \u0103n",
  "Sofa",
  "T\u1EE7 qu\u1EA7n \xE1o",
  "Con x\xFAc x\u1EAFc",
  "Qu\xE2n b\xE0i",
  "B\xE0n c\u1EDD",
  "Con r\u1ED1i",
  "Bong b\xF3ng",
  "Di\u1EC1u gi\u1EA5y",
  "\u0110u quay",
  "T\xE0u l\u01B0\u1EE3n",
  "\u0110u d\xE2y",
  "V\xF2ng xoay",
  "R\u1EA1p chi\u1EBFu phim",
  "R\u1EA1p xi\u1EBFc",
  "C\xF4ng vi\xEAn n\u01B0\u1EDBc",
  "S\u1EDF th\xFA",
  "B\u1EA3o t\xE0ng",
  "R\u1EA1p h\xE1t",
  "S\xE2n v\u1EADn \u0111\u1ED9ng",
  "Phim kinh d\u1ECB",
  "Phim h\xE0i",
  "Phim h\xE0nh \u0111\u1ED9ng",
  "Tr\xF2 ch\u01A1i \u0111i\u1EC7n t\u1EED",
  "M\xE1y game",
  "Tay c\u1EA7m",
  "B\u1ED9 x\u1EBFp h\xECnh",
  "Rubik",
  "B\u1EE9c tranh",
  "B\u1EE9c t\u01B0\u1EE3ng",
  "B\u1EA3ng m\xE0u",
  "C\u1ECD v\u1EBD",
  "Gi\xE1 v\u1EBD",
  "Khung tranh",
  "Tranh s\u01A1n d\u1EA7u",
  "Tranh th\u1EE7y m\u1EB7c",
  "Tranh l\u1EE5a",
  "G\u1ED1m s\u1EE9",
  "Th\u01B0 ph\xE1p",
  "\u0110i\xEAu kh\u1EAFc",
  "Mosaic",
  "Graffiti",
  "M\xFAa r\u1ED1i n\u01B0\u1EDBc",
  "K\u1ECBch n\xF3i",
  "Tu\u1ED3ng ch\xE8o",
  "Opera",
  "Ballet",
  "Th\u1EA7n Zeus",
  "Th\u1EA7n Thor",
  "Ph\u01B0\u1EE3ng ho\xE0ng",
  "K\u1EF3 l\xE2n",
  "Nh\xE2n m\xE3",
  "Ng\u01B0\u1EDDi s\xF3i",
  "Ma c\xE0 r\u1ED3ng",
  "Ti\xEAn n\u1EEF",
  "Y\xEAu tinh",
  "Qu\u1EF7 d\u1EEF",
  "Th\u1EA7n \u0111\xE8n",
  "Th\u1EA3m bay",
  "G\u1EADy th\u1EA7n",
  "B\xF9a h\u1ED9 m\u1EC7nh",
  "N\xE0ng ti\xEAn c\xE1",
  "Minotaur",
  "Medusa",
  "Ng\u01B0\u1EDDi kh\u1ED5ng l\u1ED3",
  "Th\u1EA7n bi\u1EC3n",
  "R\u1ED3ng l\u1EEDa",
  "Nh\xE0 th\u1EDD",
  "Ch\xF9a chi\u1EC1n",
  "\u0110\u1EC1n th\u1EDD",
  "Th\xE1p Eiffel",
  "Th\xE1p \u0111\u1ED3ng h\u1ED3",
  "C\u1EA7u treo",
  "\u0110\u1EADp th\u1EE7y \u0111i\u1EC7n",
  "Ng\u1ECDn h\u1EA3i \u0111\u0103ng",
  "T\xF2a nh\xE0 ch\u1ECDc tr\u1EDDi",
  "Cung \u0111i\u1EC7n",
  "V\xF2m \u0111\xE1",
  "C\u1ED9t tr\u1EE5",
  "M\xE1i v\xF2m",
  "T\u01B0\u1EDDng th\xE0nh",
  "C\u1ED5ng th\xE0nh",
  "Th\xE1p chu\xF4ng",
  "Gi\u1EBFng n\u01B0\u1EDBc",
  "B\u1EBFn t\xE0u",
  "S\xE2n bay",
  "Nh\xE0 ga",
  "Hoa sen",
  "Hoa mai",
  "Hoa \u0111\xE0o",
  "Hoa h\u1ED3ng",
  "Hoa c\xFAc",
  "Hoa lan",
  "Hoa tulip",
  "Hoa h\u01B0\u1EDBng d\u01B0\u01A1ng",
  "Hoa ph\u01B0\u1EE3ng",
  "Hoa s\u1EE9",
  "C\xE2y tre",
  "C\xE2y th\xF4ng",
  "C\xE2y s\u1ED3i",
  "C\xE2y d\u1EEBa",
  "C\xE2y b\xE0ng",
  "C\xE2y x\u01B0\u01A1ng r\u1ED3ng",
  "C\xE2y n\u1EA5m",
  "C\u1ECF b\u1ED1n l\xE1",
  "Rong bi\u1EC3n",
  "T\u1EA7m g\u1EEDi",
  "C\xE2y bonsai",
  "C\xE2y li\u1EC5u",
  "C\xE2y phong",
  "D\xE2y leo",
  "R\u1EC5 c\xE2y",
  "Kim c\u01B0\u01A1ng",
  "V\xE0ng r\xF2ng",
  "B\u1EA1c nguy\xEAn ch\u1EA5t",
  "Ng\u1ECDc trai",
  "H\u1ED5 ph\xE1ch",
  "Ng\u1ECDc b\xEDch",
  "Ruby",
  "Sapphire",
  "Th\u1EA1ch anh",
  "\u0110\xE1 c\u1EA9m th\u1EA1ch",
  "Than \u0111\xE1",
  "Qu\u1EB7ng s\u1EAFt",
  "\u0110\xE1 granite",
  "\u0110\xE1 v\xF4i",
  "Pha l\xEA",
  "B\xE1nh tr\xE1ng",
  "B\u1EAFp rang b\u01A1",
  "K\u1EB9o d\u1EBBo",
  "B\xE1nh quy",
  "Kem \u1ED1c qu\u1EBF",
  "B\xE1nh flan",
  "Ch\xE8 ba m\xE0u",
  "Tr\xE0 s\u1EEFa",
  "B\xE1nh bao",
  "B\xE1nh d\xE0y",
  "K\u1EB9o b\xF4ng",
  "M\u1EE9t g\u1EEBng",
  "H\u1EA1t d\u01B0a",
  "H\u1EA1t \u0111i\u1EC1u",
  "\u0110\u1EADu ph\u1ED9ng",
  "Kh\u1EA9u s\xFAng",
  "Qu\u1EA3 bom",
  "L\u1EF1u \u0111\u1EA1n",
  "Dao g\u0103m",
  "M\u0169i t\xEAn",
  "N\u1ECF th\u1EA7n",
  "Phi ti\xEAu",
  "G\u1EADy b\xF3ng ch\xE0y",
  "Boomerang",
  "\xC1o ch\u1ED1ng \u0111\u1EA1n",
  "L\xE1 ch\u1EAFn",
  "M\u0169 s\u1EAFt",
  "D\xE2y th\xE9p gai",
  "H\xE0o chi\u1EBFn \u0111\u1EA5u",
  "L\xF4 c\u1ED1t",
  "Dao th\xE1i",
  "Th\u1EDBt g\u1ED7",
  "M\xE1y xay sinh t\u1ED1",
  "L\xF2 n\u01B0\u1EDBng",
  "N\u1ED3i \xE1p su\u1EA5t",
  "M\xE1y pha c\xE0 ph\xEA",
  "\u1EA4m \u0111un n\u01B0\u1EDBc",
  "H\u1ED9p \u0111\u1EF1ng c\u01A1m",
  "Khay \u0111\xE1",
  "Khu\xF4n b\xE1nh",
  "\u0110\u0169a n\u1EA5u",
  "Mu\xF4i canh",
  "V\u1EC9 n\u01B0\u1EDBng",
  "N\u1ED3i l\u1EA9u",
  "B\xECnh gi\u1EEF nhi\u1EC7t",
  "B\xFAp b\xEA",
  "G\u1EA5u b\xF4ng",
  "\xD4 t\xF4 \u0111\u1ED3 ch\u01A1i",
  "\u0110\u1EA5t n\u1EB7n",
  "B\xF3ng bay",
  "M\xE1y bay gi\u1EA5y",
  "Lego",
  "B\u1ED9 domino",
  "Con quay",
  "S\xFAng n\u01B0\u1EDBc",
  "K\xEDnh v\u1EA1n hoa",
  "\u0110\xE8n l\u1ED3ng",
  "M\u1EB7t n\u1EA1",
  "M\xE1y in",
  "M\xE1y photo",
  "M\xE1y scan",
  "Gh\u1EBF xoay",
  "B\xE0n l\xE0m vi\u1EC7c",
  "K\u1EB9p gi\u1EA5y",
  "Kim b\u1EA5m",
  "B\xECa h\u1ED3 s\u01A1",
  "Phong b\xEC",
  "Con d\u1EA5u m\u1EF1c",
  "B\u1EA3ng t\xEAn",
  "L\u1ECBch b\xE0n",
  "\u0110\u1ED3ng h\u1ED3 treo t\u01B0\u1EDDng",
  "M\xE1y h\u1EE7y gi\u1EA5y",
  "B\xFAt \u0111\xE1nh d\u1EA5u",
  "Tivi",
  "Radio",
  "B\xE1o gi\u1EA5y",
  "T\u1EA1p ch\xED",
  "M\xE1y \u1EA3nh",
  "M\xE1y quay phim",
  "Loa ph\xF3ng thanh",
  "\u0102ng ten",
  "\u0110\u0129a CD",
  "B\u0103ng cassette",
  "T\u01B0\u1EE3ng Ph\u1EADt",
  "C\xE2y th\xE1nh gi\xE1",
  "Chu\u1ED7i tr\xE0ng h\u1EA1t",
  "B\xE1t h\u01B0\u01A1ng",
  "N\xE9n nhang",
  "Chu\xF4ng ch\xF9a",
  "L\u01B0 h\u01B0\u01A1ng",
  "Kinh th\xE1nh",
  "B\xE0n th\u1EDD",
  "L\xE1 b\xF9a",
  "Con s\xF2",
  "V\u1ECF \u1ED1c",
  "T\u1EA3ng b\u0103ng tr\xF4i",
  "\u0110\xE1y bi\u1EC3n",
  "C\xE1 ch\xE9p",
  "C\xE1 ki\u1EBFm",
  "Sao bi\u1EC3n",
  "C\u1EA7u gai",
  "\u0110\xE0n \u0111\xE1",
  "\u0110\xE0n nguy\u1EC7t",
  "Kh\xE8n m\xF4ng",
  "Tr\u1ED1ng c\u01A1m",
  "Ph\xE1ch tre",
  "M\xF5 g\u1ED7",
  "S\xE1o b\u1EA7u",
  "K\xE8n b\u1EA7u",
  "\u0110\xE0n tam",
  "M\u1EAFm t\xF4m",
  "N\u01B0\u1EDBc m\u1EAFm",
  "T\u01B0\u01A1ng \u1EDBt",
  "M\xF9 t\u1EA1t",
  "Ti\xEAu \u0111en",
  "Qu\u1EBF h\u1ED3i",
  "G\u1EEBng t\u01B0\u01A1i",
  "T\u1ECFi t\xE2y",
  "H\xE0nh t\xEDm",
  "\u1EDAt hi\u1EC3m",
  "\u0110\u01B0\u1EDDng ph\xE8n",
  "Mu\u1ED1i h\u1ED9t",
  "D\u1EA5m g\u1EA1o",
  "B\u01A1 th\u1EF1c v\u1EADt",
  "M\u1EADt ong",
  "L\u1ECD hoa",
  "Khung \u1EA3nh",
  "\u0110\u1ED3ng h\u1ED3 c\xE1t",
  "Qu\u1EA3 c\u1EA7u tuy\u1EBFt",
  "Chu\xF4ng gi\xF3",
  "\u0110\xE8n lava",
  "B\xECnh g\u1ED1m",
  "Tranh treo t\u01B0\u1EDDng",
  "Si\xEAu nh\xE2n",
  "Ng\u01B0\u1EDDi nh\u1EC7n",
  "Ng\u01B0\u1EDDi d\u01A1i",
  "Ninja",
  "C\u01B0\u1EDBp bi\u1EC3n",
  "Cao b\u1ED3i",
  "Th\xE1m t\u1EED t\u01B0",
  "Ph\xF9 th\u1EE7y",
  "Ph\xE1p s\u01B0",
  "Thi\xEAn th\u1EA7n",
  "H\u1ED3 G\u01B0\u01A1m",
  "Ph\u1ED1 c\u1ED5 H\u1ED9i An",
  "V\u1ECBnh H\u1EA1 Long",
  "Sapa",
  "\u0110\xE0 L\u1EA1t",
  "Ph\xFA Qu\u1ED1c",
  "C\xF4n \u0110\u1EA3o",
  "Fansipan",
  "Th\xE1p Pisa",
  "Angkor Wat",
  "Taj Mahal",
  "Colosseum",
  "Stonehenge",
  "Machu Picchu",
  "T\u1EED C\u1EA5m Th\xE0nh",
  "T\u1EBFt Nguy\xEAn \u0110\xE1n",
  "Trung Thu",
  "L\u1EC5 Gi\xE1ng Sinh",
  "Halloween",
  "L\u1EC5 h\u1ED9i hoa",
  "\u0110ua thuy\u1EC1n r\u1ED3ng",
  "Carnival",
  "Ph\xE1o hoa",
  "Di\u1EC5u h\xE0nh",
  "\u0110\u1ED3ng ti\u1EC1n",
  "Th\u1ECFi v\xE0ng",
  "K\xE9t s\u1EAFt",
  "Ng\xE2n h\xE0ng",
  "M\xE1y ATM",
  "Th\u1EBB t\xEDn d\u1EE5ng",
  "Heo \u0111\u1EA5t",
  "T\xFAi ti\u1EC1n",
  "X\xE2u ti\u1EC1n xu",
  "Truy\u1EC7n tranh",
  "S\xE1ch c\u1ED5",
  "B\u1EA3n th\u1EA3o",
  "Cu\u1ED9n gi\u1EA5y",
  "B\xFAt l\xF4ng",
  "M\u1EF1c t\xE0u",
  "Gi\u1EA5y da",
  "H\xECnh tr\xF2n",
  "Tam gi\xE1c",
  "H\xECnh vu\xF4ng",
  "H\xECnh l\u1EE5c gi\xE1c",
  "H\xECnh c\u1EA7u",
  "H\xECnh tr\u1EE5",
  "H\xECnh n\xF3n",
  "Xo\u1EAFn \u1ED1c",
  "\u0110\u01B0\u1EDDng th\u1EB3ng",
  "B\xFAn \u0111\u1EADu",
  "X\xFAc x\xEDch",
  "B\xE1nh tr\xE1ng tr\u1ED9n",
  "Ng\xF4 n\u01B0\u1EDBng",
  "Khoai lang n\u01B0\u1EDBng",
  "\u1ED0c lu\u1ED9c",
  "H\u1ED9t v\u1ECBt l\u1ED9n",
  "Ch\xE1o l\xF2ng",
  "H\u1EE7 ti\u1EBFu",
  "B\xE1nh canh",
  "Con chu\u1ED3n chu\u1ED3n",
  "Con b\u1ECD r\xF9a",
  "Con \u0111om \u0111\xF3m",
  "Con giun \u0111\u1EA5t",
  "Con \u1ED1c s\xEAn",
  "Con ch\xE2u ch\u1EA5u",
  "Con d\u1EBF m\xE8n",
  "Con b\u1ECD ng\u1EF1a",
  "Con ve s\u1EA7u",
  "Con mu\u1ED7i",
  "B\xE0n DJ",
  "Ampli",
  "Tai nghe",
  "M\xE1y \u0111\xE1nh nh\u1ECBp",
  "Pedal guitar",
  "M\xE1y t\xEDnh b\u1EA3ng",
  "\u0110\u1ED3ng h\u1ED3 th\xF4ng minh",
  "M\xE1y ch\u01A1i game",
  "Drone",
  "Loa bluetooth",
  "S\u1EA1c d\u1EF1 ph\xF2ng",
  "K\xEDnh th\u1EF1c t\u1EBF \u1EA3o",
  "Camera an ninh",
  "B\u1ED9 ph\xE1t wifi",
  "B\u1ED9t m\xEC",
  "G\u1EA1o n\u1EBFp",
  "\u0110\u1EADu xanh",
  "\u0110\u1EADu \u0111\u1ECF",
  "\u0110\u1EADu n\xE0nh",
  "B\u1EAFp ng\xF4",
  "Khoai t\xE2y",
  "C\xE0 r\u1ED1t",
  "B\xED \u0111\u1ECF",
  "Rau mu\u1ED1ng",
  "C\u1EA3i th\u1EA3o",
  "H\xE0nh l\xE1",
  "Rau m\xF9i",
  "S\u1EA3 c\xE2y",
  "L\xE1 chanh",
  "M\u1ECF neo",
  "C\xE1nh bu\u1ED3m",
  "B\xE1nh l\xE1i",
  "Phao c\u1EE9u sinh",
  "H\u1EA3i \u0111\u1ED3",
  "C\u1ED9t bu\u1ED3m",
  "Boong t\xE0u",
  "Khoang h\xE0ng",
  "Th\u1EE7y tri\u1EC1u",
  "H\u1EA3i l\u01B0u",
  "C\xE1i c\xE0y",
  "M\xE1y g\u1EB7t",
  "M\xE1y c\xE0y",
  "B\xF3 l\xFAa",
  "C\u1ED1i xay",
  "Kho th\xF3c",
  "Ru\u1ED9ng b\u1EADc thang",
  "Nh\xE0 k\xEDnh",
  "\xC1o da",
  "M\u0169 cao b\u1ED3i",
  "Gu\u1ED1c m\u1ED9c",
  "Y\u1EBFm \u0111\xE0o",
  "N\xF3n l\xE1",
  "Kh\u0103n r\u1EB1n",
  "\xC1o b\xE0 ba",
  "\u0110ai l\u01B0ng",
  "Kh\u0103n cho\xE0ng c\u1ED5",
  "Ph\xF4 mai",
  "Gi\u0103m b\xF4ng",
  "\u0110\u1ED3 h\u1ED9p",
  "M\xEC g\xF3i",
  "Ng\u0169 c\u1ED1c",
  "S\u1EEFa chua",
  "\u0110\u1EADu h\u0169",
  "Ch\u1EA3 c\xE1",
  "Vi\xEAn g\u1EA1ch",
  "T\u1EA5m k\xEDnh",
  "Thanh s\u1EAFt",
  "Bao xi m\u0103ng",
  "T\u1EA5m g\u1ED7",
  "Vi\xEAn ng\xF3i",
  "S\u1EE3i th\xE9p",
  "\u1ED0ng n\u01B0\u1EDBc",
  "D\xE2y \u0111i\u1EC7n",
  "T\u1EA5m t\xF4n",
  "To\xE1n h\u1ECDc",
  "V\u1EADt l\xFD",
  "H\xF3a h\u1ECDc",
  "Sinh h\u1ECDc",
  "L\u1ECBch s\u1EED",
  "\u0110\u1ECBa l\xFD",
  "V\u0103n h\u1ECDc",
  "Tri\u1EBFt h\u1ECDc",
  "Thi\xEAn v\u0103n h\u1ECDc",
  "T\xE2m l\xFD h\u1ECDc",
  "Tr\xE0 xanh",
  "N\u01B0\u1EDBc \xE9p cam",
  "S\u1EEFa \u0111\u1EADu n\xE0nh",
  "N\u01B0\u1EDBc kho\xE1ng",
  "Cacao n\xF3ng",
  "B\u1EAFc C\u1EF1c",
  "Nam C\u1EF1c",
  "X\xEDch \u0111\u1EA1o",
  "Kinh tuy\u1EBFn",
  "V\u0129 tuy\u1EBFn",
  "C\xE1 c\u1EA3nh",
  "Chim c\u1EA3nh",
  "Hamster",
  "R\xF9a c\u1EA3nh",
  "M\xE2m ng\u0169 qu\u1EA3",
  "B\xE1nh trung thu",
  "C\xE2y n\xEAu",
  "C\xE2u \u0111\u1ED1i",
  "L\xEC x\xEC",
  "T\u1EA7ng ozone",
  "Kh\xED quy\u1EC3n"
];

// party/server.js
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
__name(shuffle, "shuffle");
function getAllPermutations() {
  const perms = [];
  for (let a = 1; a <= 4; a++)
    for (let b = 1; b <= 4; b++)
      for (let c = 1; c <= 4; c++)
        if (a !== b && a !== c && b !== c) perms.push([a, b, c]);
  return perms;
}
__name(getAllPermutations, "getAllPermutations");
var ALL_CODES = getAllPermutations();
function pickCode(usedCodes) {
  const available = ALL_CODES.filter(
    (c) => !usedCodes.some((u) => u[0] === c[0] && u[1] === c[1] && u[2] === c[2])
  );
  return available[Math.floor(Math.random() * available.length)];
}
__name(pickCode, "pickCode");
function pickKeywords(count, exclude = []) {
  const available = WORDS.filter((w) => !exclude.includes(w));
  return shuffle(available).slice(0, count);
}
__name(pickKeywords, "pickKeywords");
function arraysEqual(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}
__name(arraysEqual, "arraysEqual");
var DecryptoServer = class extends Server {
  static {
    __name(this, "DecryptoServer");
  }
  constructor(ctx, env2) {
    super(ctx, env2);
    this.players = [];
    this.game = null;
  }
  onConnect(connection, ctx) {
  }
  onMessage(connection, message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    const sender = connection;
    switch (data.type) {
      case "join":
        this.handleJoin(sender, data);
        break;
      case "switch-team":
        this.handleSwitchTeam(sender, data);
        break;
      case "start":
        this.handleStart(sender);
        break;
      case "submit-clues":
        this.handleSubmitClues(sender, data);
        break;
      case "submit-guess":
        this.handleSubmitGuess(sender, data);
        break;
      case "continue":
        this.handleContinue(sender);
        break;
      case "play-again":
        this.handlePlayAgain(sender);
        break;
      default:
        break;
    }
  }
  onClose(connection) {
    const idx = this.players.findIndex((p) => p.id === connection.id);
    if (idx === -1) return;
    const wasHost = this.players[idx].isHost;
    this.players.splice(idx, 1);
    if (this.players.length > 0 && wasHost) {
      this.players[0].isHost = true;
    }
    if (this.players.length === 0) {
      this.game = null;
      return;
    }
    this.broadcastState();
  }
  // ── Join / Start ─────────────────────────────────────────
  handleJoin(sender, data) {
    if (this.game && this.game.phase !== "LOBBY") {
      this.sendError(sender, "Game \u0111ang di\u1EC5n ra, kh\xF4ng th\u1EC3 tham gia.");
      return;
    }
    if (this.players.find((p) => p.id === sender.id)) return;
    const name = (data.name || "Ng\u01B0\u1EDDi ch\u01A1i").trim().slice(0, 20);
    const countA = this.players.filter((p) => p.team === "A").length;
    const countB = this.players.filter((p) => p.team === "B").length;
    this.players.push({
      id: sender.id,
      name,
      team: countA <= countB ? "A" : "B",
      isHost: this.players.length === 0
    });
    this.broadcastState();
  }
  handleSwitchTeam(sender, data) {
    if (this.game) return;
    const player = this.players.find((p) => p.id === sender.id);
    if (!player) return;
    const targetTeam = data.target || (player.team === "A" ? "B" : "A");
    if (targetTeam !== "A" && targetTeam !== "B") return;
    player.team = targetTeam;
    this.broadcastState();
  }
  handleStart(sender) {
    const player = this.players.find((p) => p.id === sender.id);
    if (!player || !player.isHost) return;
    const count = this.players.length;
    if (count < 3) {
      this.sendError(sender, "C\u1EA7n \xEDt nh\u1EA5t 3 ng\u01B0\u1EDDi ch\u01A1i.");
      return;
    }
    const countA = this.players.filter((p) => p.team === "A").length;
    const countB = this.players.filter((p) => p.team === "B").length;
    if (count === 3) {
      if (countA !== 2 || countB !== 1) {
        this.broadcastError("\u0110\u1EC3 b\u1EAFt \u0111\u1EA7u ch\u1EBF \u0111\u1ED9 3 ng\u01B0\u1EDDi, \u0110\u1ED9i M\xE3 H\xF3a ph\u1EA3i c\xF3 \u0111\xFAng 2 ng\u01B0\u1EDDi v\xE0 K\u1EBB Ch\u1EB7n M\xE3 ph\u1EA3i c\xF3 1 ng\u01B0\u1EDDi.");
        return;
      }
    } else {
      if (Math.abs(countA - countB) > 1) {
        this.broadcastError("\u0110\u1ED9i h\xECnh ch\u01B0a c\xE2n b\u1EB1ng! Vui l\xF2ng chia l\u1EA1i sao cho s\u1ED1 l\u01B0\u1EE3ng 2 \u0111\u1ED9i ch\xEAnh l\u1EC7ch kh\xF4ng qu\xE1 1 ng\u01B0\u1EDDi.");
        return;
      }
    }
    const mode = count === 3 ? "3p" : "team";
    if (mode === "3p") {
      this.initGame3P();
    } else {
      this.initGameTeam();
    }
    this.broadcastState();
  }
  // ── Initialize 3-player game ─────────────────────────────
  initGame3P() {
    const teamA = this.players.filter((p) => p.team === "A").map((p) => p.id);
    const teamB = this.players.filter((p) => p.team === "B").map((p) => p.id);
    const encryptors = teamA.length >= 2 ? teamA : teamB;
    const interceptor = teamA.length >= 2 ? teamB[0] : teamA[0];
    const keywords = pickKeywords(4);
    this.game = {
      phase: "ENCRYPT",
      mode: "3p",
      round: 1,
      maxRounds: 5,
      encryptors: [encryptors[0], encryptors[1]],
      interceptorId: interceptor,
      keywords,
      encryptorIndex: 0,
      code: null,
      clues: [null, null, null],
      cluesSubmitted: false,
      decryptGuess: null,
      interceptGuess: null,
      interceptorTokens: 0,
      usedCodes: [],
      history: []
    };
    this.startRound3P();
  }
  startRound3P() {
    const g = this.game;
    g.phase = "ENCRYPT";
    g.code = pickCode(g.usedCodes);
    g.usedCodes.push(g.code);
    g.clues = [null, null, null];
    g.cluesSubmitted = false;
    g.decryptGuess = null;
    g.interceptGuess = null;
    g.timerEnd = null;
  }
  // ── Initialize team game ─────────────────────────────────
  initGameTeam() {
    const teamAIds = this.players.filter((p) => p.team === "A").map((p) => p.id);
    const teamBIds = this.players.filter((p) => p.team === "B").map((p) => p.id);
    const keywordsA = pickKeywords(4);
    const keywordsB = pickKeywords(4, keywordsA);
    this.game = {
      phase: "ENCRYPT",
      mode: "team",
      round: 1,
      maxRounds: 8,
      teams: {
        A: {
          playerIds: teamAIds,
          keywords: keywordsA,
          interceptions: 0,
          miscommunications: 0,
          encryptorIndex: 0,
          code: null,
          clues: [null, null, null],
          cluesSubmitted: false,
          decryptGuess: null,
          interceptGuess: null
        },
        B: {
          playerIds: teamBIds,
          keywords: keywordsB,
          interceptions: 0,
          miscommunications: 0,
          encryptorIndex: 0,
          code: null,
          clues: [null, null, null],
          cluesSubmitted: false,
          decryptGuess: null,
          interceptGuess: null
        }
      },
      currentTeamTurn: null,
      usedCodes: { A: [], B: [] },
      history: { A: [], B: [] }
    };
    this.startRoundTeam();
  }
  startRoundTeam() {
    const g = this.game;
    g.phase = "ENCRYPT";
    g.currentTeamTurn = null;
    g.timerEnd = null;
    for (const key of ["A", "B"]) {
      const team = g.teams[key];
      team.code = pickCode(g.usedCodes[key]);
      g.usedCodes[key].push(team.code);
      team.clues = [null, null, null];
      team.cluesSubmitted = false;
      team.decryptGuess = null;
      team.interceptGuess = null;
    }
  }
  // ── Submit Clues ─────────────────────────────────────────
  handleSubmitClues(sender, data) {
    const g = this.game;
    if (!g || g.phase !== "ENCRYPT") return;
    const clues = data.clues;
    if (!Array.isArray(clues) || clues.length !== 3) return;
    if (clues.some((c) => typeof c !== "string" || c.trim().length === 0)) return;
    const trimmed = clues.map((c) => c.trim());
    if (g.mode === "3p") {
      const currentEncryptor = g.encryptors[g.encryptorIndex];
      if (sender.id !== currentEncryptor) return;
      g.clues = trimmed;
      g.cluesSubmitted = true;
      g.phase = "GUESS";
    } else {
      const team = this.getPlayerTeam(sender.id);
      if (!team) return;
      const t = g.teams[team];
      const encryptorId = t.playerIds[t.encryptorIndex % t.playerIds.length];
      if (sender.id !== encryptorId) return;
      t.clues = trimmed;
      t.cluesSubmitted = true;
      if (g.teams.A.cluesSubmitted && g.teams.B.cluesSubmitted) {
        g.phase = "GUESS_A";
        g.currentTeamTurn = "A";
        g.timerEnd = null;
      } else {
        if (!g.timerEnd) {
          g.timerEnd = Date.now() + 3e4;
        }
      }
    }
    this.broadcastState();
  }
  // ── Submit Guess ─────────────────────────────────────────
  handleSubmitGuess(sender, data) {
    const g = this.game;
    if (!g) return;
    const guess = data.guess;
    if (!Array.isArray(guess) || guess.length !== 3) return;
    if (guess.some((n) => typeof n !== "number" || n < 1 || n > 4)) return;
    const guessType = data.guessType;
    if (g.mode === "3p") {
      if (g.phase !== "GUESS") return;
      if (guessType === "decrypt") {
        const otherEncryptor = g.encryptors.find((id) => id !== g.encryptors[g.encryptorIndex]);
        if (sender.id !== otherEncryptor) return;
        g.decryptGuess = guess;
      } else if (guessType === "intercept") {
        if (g.round < 2) return;
        if (sender.id !== g.interceptorId) return;
        g.interceptGuess = guess;
      }
      const needIntercept = g.round >= 2;
      const decryptDone = g.decryptGuess !== null;
      const interceptDone = !needIntercept || g.interceptGuess !== null;
      if (decryptDone && interceptDone) {
        g.phase = "REVEAL";
        this.resolveRound3P();
      }
    } else {
      const turnTeam = g.currentTeamTurn;
      if (!turnTeam) return;
      if (g.phase !== `GUESS_${turnTeam}`) return;
      const opponentTeam = turnTeam === "A" ? "B" : "A";
      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[opponentTeam];
      const playerTeam = this.getPlayerTeam(sender.id);
      if (guessType === "decrypt") {
        if (playerTeam !== turnTeam) return;
        const encId = ownTeam.playerIds[ownTeam.encryptorIndex % ownTeam.playerIds.length];
        if (sender.id === encId) return;
        if (ownTeam.decryptGuess) return;
        ownTeam.decryptGuess = guess;
      } else if (guessType === "intercept") {
        if (g.round < 2) return;
        if (playerTeam !== opponentTeam) return;
        if (oppTeam.interceptGuess) return;
        oppTeam.interceptGuess = guess;
      }
      const decryptDone = ownTeam.decryptGuess !== null;
      const needIntercept = g.round >= 2;
      const interceptDone = !needIntercept || oppTeam.interceptGuess !== null;
      if (decryptDone && interceptDone) {
        g.phase = `REVEAL_${turnTeam}`;
        this.resolveTeamTurn(turnTeam);
      }
    }
    this.broadcastState();
  }
  // ── Resolve rounds ───────────────────────────────────────
  resolveRound3P() {
    const g = this.game;
    const interceptCorrect = g.interceptGuess && arraysEqual(g.interceptGuess, g.code);
    const decryptCorrect = arraysEqual(g.decryptGuess, g.code);
    if (interceptCorrect) {
      g.interceptorTokens++;
    }
    if (!decryptCorrect) {
      g.interceptorTokens++;
    }
    g.history.push({
      round: g.round,
      clues: [...g.clues],
      code: [...g.code],
      decryptGuess: g.decryptGuess ? [...g.decryptGuess] : null,
      interceptGuess: g.interceptGuess ? [...g.interceptGuess] : null,
      decryptCorrect,
      interceptCorrect: interceptCorrect || false
    });
  }
  resolveTeamTurn(turnTeam) {
    const g = this.game;
    const opponentTeam = turnTeam === "A" ? "B" : "A";
    const ownTeam = g.teams[turnTeam];
    const oppTeam = g.teams[opponentTeam];
    const interceptCorrect = oppTeam.interceptGuess && arraysEqual(oppTeam.interceptGuess, ownTeam.code);
    const decryptCorrect = arraysEqual(ownTeam.decryptGuess, ownTeam.code);
    if (interceptCorrect) {
      oppTeam.interceptions++;
    }
    if (!decryptCorrect) {
      ownTeam.miscommunications++;
    }
    g.history[turnTeam].push({
      round: g.round,
      clues: [...ownTeam.clues],
      code: [...ownTeam.code],
      decryptGuess: ownTeam.decryptGuess ? [...ownTeam.decryptGuess] : null,
      interceptGuess: oppTeam.interceptGuess ? [...oppTeam.interceptGuess] : null,
      decryptCorrect,
      interceptCorrect: interceptCorrect || false
    });
  }
  // ── Continue (next phase) ────────────────────────────────
  handleContinue(sender) {
    const g = this.game;
    if (!g) return;
    const player = this.players.find((p) => p.id === sender.id);
    if (!player || !player.isHost) return;
    if (g.mode === "3p") {
      if (g.phase === "REVEAL") {
        if (g.interceptorTokens >= 2 || g.round >= g.maxRounds) {
          g.phase = "GAME_OVER";
        } else {
          g.round++;
          g.encryptorIndex = (g.encryptorIndex + 1) % 2;
          this.startRound3P();
        }
      }
    } else {
      if (g.phase === "REVEAL_A") {
        g.phase = "GUESS_B";
        g.currentTeamTurn = "B";
        g.teams.B.decryptGuess = null;
        g.teams.A.interceptGuess = null;
      } else if (g.phase === "REVEAL_B") {
        const endResult = this.checkTeamEndConditions();
        if (endResult) {
          g.phase = "GAME_OVER";
          g.winner = endResult;
        } else if (g.round >= g.maxRounds) {
          g.phase = "GAME_OVER";
          g.winner = this.calculateTiebreaker();
        } else {
          g.round++;
          g.teams.A.encryptorIndex = (g.teams.A.encryptorIndex + 1) % g.teams.A.playerIds.length;
          g.teams.B.encryptorIndex = (g.teams.B.encryptorIndex + 1) % g.teams.B.playerIds.length;
          this.startRoundTeam();
        }
      }
    }
    this.broadcastState();
  }
  // ── Win/Loss checks ──────────────────────────────────────
  checkTeamEndConditions() {
    const g = this.game;
    const a = g.teams.A;
    const b = g.teams.B;
    const aWin = a.interceptions >= 2;
    const aLose = a.miscommunications >= 2;
    const bWin = b.interceptions >= 2;
    const bLose = b.miscommunications >= 2;
    if (aWin && bWin || aLose && bLose || aWin && aLose || bWin && bLose) {
      return this.calculateTiebreaker();
    }
    if (aWin) return "A";
    if (bWin) return "B";
    if (aLose) return "B";
    if (bLose) return "A";
    return null;
  }
  calculateTiebreaker() {
    const g = this.game;
    const scoreA = g.teams.A.interceptions - g.teams.A.miscommunications;
    const scoreB = g.teams.B.interceptions - g.teams.B.miscommunications;
    if (scoreA > scoreB) return "A";
    if (scoreB > scoreA) return "B";
    return "TIE";
  }
  // ── Play Again ───────────────────────────────────────────
  handlePlayAgain(sender) {
    const player = this.players.find((p) => p.id === sender.id);
    if (!player || !player.isHost) return;
    this.game = null;
    this.broadcastState();
  }
  // ── Helpers ──────────────────────────────────────────────
  getPlayerTeam(playerId) {
    const g = this.game;
    if (!g || g.mode !== "team") return null;
    if (g.teams.A.playerIds.includes(playerId)) return "A";
    if (g.teams.B.playerIds.includes(playerId)) return "B";
    return null;
  }
  getPlayerName(playerId) {
    const p = this.players.find((p2) => p2.id === playerId);
    return p ? p.name : "???";
  }
  sendError(connection, message) {
    connection.send(JSON.stringify({ type: "error", message }));
  }
  broadcastError(message) {
    for (const conn of this.getConnections()) {
      conn.send(JSON.stringify({ type: "error", message }));
    }
  }
  broadcastState() {
    this.players.forEach((p) => {
      const conn = this.getConnection(p.id);
      if (conn) {
        conn.send(JSON.stringify({
          type: "state",
          state: this.getSanitizedState(p.id)
        }));
      }
    });
  }
  getSanitizedState(viewerId) {
    if (!this.game) {
      return {
        phase: "LOBBY",
        roomCode: this.name,
        myId: viewerId,
        players: this.players
      };
    }
    const base = {
      roomCode: this.name,
      players: this.players.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost, team: p.team })),
      myId: viewerId
    };
    return this.game.mode === "3p" ? this.sanitize3P(viewerId, base) : this.sanitizeTeam(viewerId, base);
  }
  sanitize3P(viewerId, base) {
    const g = this.game;
    const isEncryptor = g.encryptors.includes(viewerId);
    const isInterceptor = viewerId === g.interceptorId;
    const currentEncryptorId = g.encryptors[g.encryptorIndex];
    const isCurrentEncryptor = viewerId === currentEncryptorId;
    const otherEncryptorId = g.encryptors.find((id) => id !== currentEncryptorId);
    const state = {
      ...base,
      phase: g.phase,
      mode: "3p",
      round: g.round,
      maxRounds: g.maxRounds,
      encryptors: g.encryptors.map((id) => ({ id, name: this.getPlayerName(id) })),
      interceptor: { id: g.interceptorId, name: this.getPlayerName(g.interceptorId) },
      currentEncryptorId,
      myRole: isInterceptor ? "interceptor" : isCurrentEncryptor ? "encryptor" : "guesser",
      keywords: isEncryptor ? g.keywords : null,
      interceptorTokens: g.interceptorTokens,
      cluesSubmitted: g.cluesSubmitted,
      timerEnd: g.timerEnd,
      history: g.history
    };
    if (g.phase === "ENCRYPT" && isCurrentEncryptor) {
      state.code = g.code;
    }
    if (g.phase === "GUESS" || g.phase === "REVEAL") {
      state.clues = g.clues;
    }
    if (g.phase === "GUESS") {
      state.decryptSubmitted = g.decryptGuess !== null;
      state.interceptSubmitted = g.interceptGuess !== null;
      state.needIntercept = g.round >= 2;
    }
    if (g.phase === "REVEAL" || g.phase === "GAME_OVER") {
      state.revealCode = g.code;
      state.decryptGuess = g.decryptGuess;
      state.interceptGuess = g.interceptGuess;
      const lastHistory = g.history[g.history.length - 1];
      if (lastHistory) {
        state.decryptCorrect = lastHistory.decryptCorrect;
        state.interceptCorrect = lastHistory.interceptCorrect;
      }
    }
    if (g.phase === "GAME_OVER") {
      state.winner = g.interceptorTokens >= 2 ? "interceptor" : "encryptors";
      state.allKeywords = g.keywords;
    }
    return state;
  }
  sanitizeTeam(viewerId, base) {
    const g = this.game;
    const myTeam = this.getPlayerTeam(viewerId);
    const oppTeamKey = myTeam === "A" ? "B" : "A";
    const encryptorA = g.teams.A.playerIds[g.teams.A.encryptorIndex % g.teams.A.playerIds.length];
    const encryptorB = g.teams.B.playerIds[g.teams.B.encryptorIndex % g.teams.B.playerIds.length];
    let myRole = "guesser";
    if (myTeam === "A" && viewerId === encryptorA) myRole = "encryptor";
    if (myTeam === "B" && viewerId === encryptorB) myRole = "encryptor";
    const state = {
      ...base,
      phase: g.phase,
      mode: "team",
      round: g.round,
      maxRounds: g.maxRounds,
      currentTeamTurn: g.currentTeamTurn,
      myTeam,
      myRole,
      timerEnd: g.timerEnd,
      teamA: {
        playerIds: g.teams.A.playerIds,
        players: g.teams.A.playerIds.map((id) => ({ id, name: this.getPlayerName(id) })),
        interceptions: g.teams.A.interceptions,
        miscommunications: g.teams.A.miscommunications,
        encryptorId: encryptorA,
        cluesSubmitted: g.teams.A.cluesSubmitted
      },
      teamB: {
        playerIds: g.teams.B.playerIds,
        players: g.teams.B.playerIds.map((id) => ({ id, name: this.getPlayerName(id) })),
        interceptions: g.teams.B.interceptions,
        miscommunications: g.teams.B.miscommunications,
        encryptorId: encryptorB,
        cluesSubmitted: g.teams.B.cluesSubmitted
      },
      keywords: myTeam ? g.teams[myTeam].keywords : null,
      myHistory: myTeam ? g.history[myTeam] : [],
      opponentHistory: myTeam ? g.history[oppTeamKey] : []
    };
    if (g.phase === "ENCRYPT" && myRole === "encryptor") {
      state.code = g.teams[myTeam].code;
    }
    const turnTeam = g.currentTeamTurn;
    if (turnTeam && (g.phase === `GUESS_${turnTeam}` || g.phase === `REVEAL_${turnTeam}`)) {
      state.currentClues = g.teams[turnTeam].clues;
      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[turnTeam === "A" ? "B" : "A"];
      state.decryptSubmitted = ownTeam.decryptGuess !== null;
      state.interceptSubmitted = oppTeam.interceptGuess !== null;
      state.needIntercept = g.round >= 2;
    }
    if (turnTeam && g.phase === `REVEAL_${turnTeam}`) {
      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[turnTeam === "A" ? "B" : "A"];
      const histArr = g.history[turnTeam];
      const last = histArr[histArr.length - 1];
      state.revealCode = ownTeam.code;
      state.decryptGuess = ownTeam.decryptGuess;
      state.interceptGuess = oppTeam.interceptGuess;
      if (last) {
        state.decryptCorrect = last.decryptCorrect;
        state.interceptCorrect = last.interceptCorrect;
      }
    }
    if (g.phase === "GAME_OVER") {
      state.winner = g.winner;
      state.allKeywords = {
        A: g.teams.A.keywords,
        B: g.teams.B.keywords
      };
    }
    return state;
  }
};
var server_default = {
  async fetch(request, env2, ctx) {
    return await routePartykitRequest(request, env2) || new Response("Not Found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-xkAhis/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = server_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-xkAhis/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  DecryptoServer,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=server.js.map
