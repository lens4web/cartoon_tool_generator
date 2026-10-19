import net from 'net';
import dns from 'dns/promises';

/**
 * Known trusted domains for xAI media endpoints.
 */
const TRUSTED_XAI_DOMAINS = ['x.ai', 'vidgen.x.ai', 'files-cdn.x.ai', 'api.x.ai'];

/**
 * Checks whether an IPv4 address string falls into private, loopback, link-local,
 * carrier-grade NAT, or metadata address ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 100.64.0.0/10 (Shared address space / Carrier Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local, AWS/GCP/Azure instance metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 & 192.0.2.0/24 (IETF & TEST-NET-1)
  if (a === 192 && b === 0) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmark testing)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 & 203.0.113.0/24 (TEST-NET-2 / TEST-NET-3)
  if (a === 198 && b === 51) return true;
  if (a === 203 && b === 0) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved) & Broadcast
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address string falls into loopback, unique local,
 * link-local, or IPv4-mapped private ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1) and unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:10.0.0.1, etc.)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }

  // Unique local addresses (fc00::/7 -> fc.. or fd..)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local unicast (fe80::/10 -> fe8, fe9, fea, feb)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Validates whether an IP address is considered private/internal/unsafe.
 */
export function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // Not a valid IP -> unsafe
}

/**
 * Checks whether a hostname matches a list of allowed domain suffixes.
 * Uses exact match or dot-prefixed suffix to prevent 'evil-x.ai' spoofing.
 */
export function isAllowedHostSuffix(hostname: string, allowedHosts: string[]): boolean {
  const normalizedHost = hostname.toLowerCase();
  return allowedHosts.some((allowed) => {
    const normAllowed = allowed.toLowerCase();
    return normalizedHost === normAllowed || normalizedHost.endsWith('.' + normAllowed);
  });
}

/**
 * Checks whether a hostname belongs to trusted xAI media CDNs.
 */
export function isTrustedXAiHost(hostname: string): boolean {
  return isAllowedHostSuffix(hostname, TRUSTED_XAI_DOMAINS);
}

export interface ValidateUrlOptions {
  allowedHosts?: string[];
  requireHttps?: boolean;
}

/**
 * Validates a remote URL against SSRF attacks:
 * 1. Ensures HTTPS protocol (unless explicitly configured).
 * 2. Blocks standard internal hostnames (localhost, internal, metadata).
 * 3. Rejects non-standard ports (only standard 443 / default allowed).
 * 4. Resolves DNS and checks that all resolved IP addresses are public and non-private.
 * 5. Optionally enforces allowed domain whitelist.
 */
export async function validateSafeRemoteUrl(
  rawUrl: string,
  options: ValidateUrlOptions = {}
): Promise<{ valid: boolean; error?: string; parsed?: URL }> {
  const { allowedHosts, requireHttps = true } = options;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'Malformed URL' };
  }

  // Protocol enforcement
  if (requireHttps && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed for external resources' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: 'Unsupported URL protocol' };
  }

  // Port enforcement: standard 443 (or 80 only if non-https permitted)
  if (parsed.port && parsed.port !== '443' && parsed.port !== '') {
    return { valid: false, error: 'Custom ports are not allowed' };
  }

  // Credentials in URL (http://user:pass@host)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'User credentials in URL are prohibited' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Obvious localhost and cloud metadata hostnames
  const forbiddenNames = [
    'localhost',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254',
  ];
  if (
    forbiddenNames.includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return { valid: false, error: 'Access to local or internal hosts is denied' };
  }

  // If host is a direct IP literal, check it immediately
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, error: 'Access to private or link-local IP addresses is denied' };
    }
  }

  // Domain whitelist check (if configured)
  if (allowedHosts && allowedHosts.length > 0) {
    if (!isAllowedHostSuffix(hostname, allowedHosts)) {
      return { valid: false, error: `Domain '${hostname}' is not in the allowed host list` };
    }
  }

  // Resolve DNS to verify the destination does not point to internal IPs (DNS rebinding prevention)
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: 'Could not resolve domain name' };
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return {
          valid: false,
          error: `Domain '${hostname}' resolved to prohibited address ${record.address}`,
        };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DNS lookup failed';
    return { valid: false, error: `Failed to verify host: ${msg}` };
  }

  return { valid: true, parsed };
}

/**
 * Safely fetches a media buffer from a remote URL with SSRF protection,
 * timeout controls, and maximum response size bounds.
 */
export async function safeFetchMedia(
  url: string,
  options: {
    maxSizeBytes?: number;
    timeoutMs?: number;
    allowedHosts?: string[];
    acceptHeader?: string;
  } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const {
    maxSizeBytes = 100 * 1024 * 1024, // 100 MB default
    timeoutMs = 60000, // 60s default
    allowedHosts,
    acceptHeader = '*/*',
  } = options;

  const validation = await validateSafeRemoteUrl(url, { allowedHosts });
  if (!validation.valid || !validation.parsed) {
    throw new Error(validation.error || 'Invalid or prohibited URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(validation.parsed.href, {
      method: 'GET',
      headers: {
        'Accept': acceptHeader,
        'User-Agent': 'GrokCartoonStudio/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Remote server responded with HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Media file exceeds maximum allowed size of ${maxSizeBytes} bytes`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > maxSizeBytes) {
      throw new Error(`Downloaded payload exceeded maximum allowed size of ${maxSizeBytes} bytes`);
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
