import crypto from 'crypto'

export function verifyContentDigest(rawBody: string, header: string): boolean {
  try {
    const match = header?.match(/^(sha-256|sha-512)=:([^:]+):$/i)
    if (!match) return false
    const algo = match[1].toLowerCase().replace('-', '')
    const expected = Buffer.from(match[2], 'base64')
    const actual = crypto.createHash(algo).update(rawBody).digest()
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

// NOTE: Minimal placeholder until full RFC-9421 implementation is needed
export function verifyHttpSignature(params: {
  rawBody: string
  signature: string
  signatureInput: string
  signatureDate: string
}): boolean {
  // In production, parse Signature-Input, assemble covered components, and verify using pawaPay public key.
  return !!(params.signature && params.signatureInput && params.signatureDate)
}


