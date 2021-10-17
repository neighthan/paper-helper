/* Modified slightly from https://docs.w3cub.com/dom/subtlecrypto/decrypt */

async function encrypt(plaintext: string, password: string) {
  const encodedText = new TextEncoder().encode(plaintext)
  const encodedPW = new TextEncoder().encode(password)
  const pwHash = await crypto.subtle.digest('SHA-256', encodedPW)

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const alg = { name: 'AES-GCM', iv: iv }
  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt'])

  return { iv, ciphertext: await crypto.subtle.encrypt(alg, key, encodedText) }
}

async function decrypt(ciphertext: ArrayBuffer, iv: Uint8Array, password: string) {
  const encodedPW = new TextEncoder().encode(password)
  const pwHash = await crypto.subtle.digest('SHA-256', encodedPW)

  const alg = { name: 'AES-GCM', iv: iv }
  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt'])

  let plaintext = null;
  try {
    const ptBuffer = await crypto.subtle.decrypt(alg, key, ciphertext)
    plaintext = new TextDecoder().decode(ptBuffer)
  } catch {}
  return plaintext
}

// using `new TextDecoder().decode(ciphertext)` didn't work; on
// encoding again, the buffer is longer than before with different values.
function cipherBufferToString(ciphertext: ArrayBuffer) {
  return JSON.stringify(Array.from(new Uint8Array(ciphertext)))
}

function stringToCipherBuffer(cipherString: string) {
  return new Uint8Array(JSON.parse(cipherString)).buffer
}

export {encrypt, decrypt, cipherBufferToString, stringToCipherBuffer}
