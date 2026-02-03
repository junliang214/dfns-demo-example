import { DfnsApiClient, DfnsDelegatedApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'
import crypto from 'crypto'

function loadPrivateKey(): string {
  let key = process.env.DFNS_PRIVATE_KEY

  if (!key) {
    throw new Error('DFNS_PRIVATE_KEY is missing')
  }

  // Trim quotes and whitespace
  key = key.trim()

  // Case 1: key stored with literal \n
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n')
  }

  // Case 2: key flattened into a single line with spaces
  if (
    key.startsWith('-----BEGIN') &&
    !key.includes('\n')
  ) {
    // Reinsert newlines after header and before footer
    key = key
      .replace(
        /-----BEGIN ([A-Z ]+)-----\s+/,
        '-----BEGIN $1-----\n'
      )
      .replace(
        /\s+-----END ([A-Z ]+)-----/,
        '\n-----END $1-----'
      )

    // Rewrap base64 body at 64 chars
    const lines = key.split('\n')
    const header = lines[0]
    const footer = lines[lines.length - 1]
    const body = lines.slice(1, -1).join('').replace(/\s+/g, '')

    const wrappedBody = body.match(/.{1,64}/g)?.join('\n')

    if (!wrappedBody) {
      throw new Error('Failed to rewrap DFNS private key')
    }

    key = `${header}\n${wrappedBody}\n${footer}`
  }

  // Validate with OpenSSL via Node
  try {
    crypto.createPrivateKey({
      key,
      format: 'pem',
    })
  } catch (err) {
    console.error('❌ DFNS private key is invalid / unsupported')
    throw err
  }

  return key
}

export const apiClient = (authToken?: string) => {
  const privateKey = loadPrivateKey()

  const signer = new AsymmetricKeySigner({
    credId: process.env.DFNS_CRED_ID!,
    privateKey,
  })

  return new DfnsApiClient({
    orgId: process.env.DFNS_ORG_ID!,
    authToken: authToken ?? process.env.DFNS_AUTH_TOKEN!,
    baseUrl: process.env.DFNS_API_URL!,
    signer,
  })
}

export const delegatedClient = (authToken: string) => {
  return new DfnsDelegatedApiClient({
    orgId: process.env.DFNS_ORG_ID!,
    authToken,
    baseUrl: process.env.DFNS_API_URL!,
  })
}
