/**
 * Módulo de Criptografia - AES-256-CBC
 *
 * Este módulo utiliza AES-256-CBC (Advanced Encryption Standard com Cipher Block Chaining)
 * para criptografar dados pessoais sensíveis (CPF, WhatsApp, Senha).
 *
 * ESPECIFICAÇÕES TÉCNICAS:
 * - Algoritmo: AES-256-CBC
 * - Tamanho da chave: 256 bits (32 bytes)
 * - IV (Initialization Vector): 16 bytes aleatórios para cada operação
 * - Padding: PKCS7
 * - Formato de saída: Base64 (iv:ciphertext)
 *
 * IMPORTANTE: A chave de criptografia deve ser armazenada como variável de ambiente
 * e NUNCA deve ser commitada no código.
 */

/**
 * Chave de criptografia (deve vir de variável de ambiente)
 * Esta é a mesma chave que deve ser usada em TODAS as aplicações
 */
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || ''

if (!ENCRYPTION_KEY) {
  console.error('⚠️ AVISO: VITE_ENCRYPTION_KEY não está configurada nas variáveis de ambiente!')
}

/**
 * Converte uma string hexadecimal para Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('String hexadecimal inválida')
  }
  const array = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return array
}

/**
 * Obtém a chave de criptografia como CryptoKey
 */
async function getCryptoKey(): Promise<CryptoKey> {
  // Converte a chave hex para Uint8Array
  const keyData = hexToUint8Array(ENCRYPTION_KEY)

  // Importa a chave para uso com Web Crypto API (AES-CBC)
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Criptografa um texto usando AES-256-CBC
 *
 * @param plaintext - Texto a ser criptografado
 * @returns String no formato "iv:ciphertext" em Base64
 *
 * @example
 * const cpfCriptografado = await encrypt("12345678900")
 * // Retorna algo como: "a1b2c3d4e5f6g7h8i9j0:x1y2z3w4v5..."
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) {
    throw new Error('Texto para criptografar não pode ser vazio')
  }

  try {
    // Gera IV aleatório de 16 bytes
    const iv = crypto.getRandomValues(new Uint8Array(16))

    // Obtém a chave de criptografia
    const key = await getCryptoKey()

    // Converte o texto para Uint8Array
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Criptografa os dados usando AES-CBC
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      key,
      data
    )

    // Converte IV e ciphertext para Base64
    const ivBase64 = btoa(String.fromCharCode(...iv))
    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))

    // Retorna no formato "iv:ciphertext"
    return `${ivBase64}:${ciphertextBase64}`
  } catch (error) {
    console.error('Erro ao criptografar:', error)
    throw new Error('Falha ao criptografar dados')
  }
}

/**
 * Descriptografa um texto criptografado com AES-256-CBC
 *
 * @param encryptedData - String no formato "iv:ciphertext" em Base64
 * @returns Texto original descriptografado
 *
 * @example
 * const cpfOriginal = await decrypt("a1b2c3d4e5f6g7h8i9j0:x1y2z3w4v5...")
 * // Retorna: "12345678900"
 */
export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData || !encryptedData.includes(':')) {
    throw new Error('Dados criptografados inválidos')
  }

  try {
    // Separa IV e ciphertext
    const [ivBase64, ciphertextBase64] = encryptedData.split(':')

    // Converte de Base64 para Uint8Array
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0))

    // Obtém a chave de criptografia
    const key = await getCryptoKey()

    // Descriptografa os dados usando AES-CBC
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      key,
      ciphertext
    )

    // Converte de Uint8Array para string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('Erro ao descriptografar:', error)
    throw new Error('Falha ao descriptografar dados')
  }
}

/**
 * Gera uma chave de criptografia aleatória (256 bits)
 * Use esta função APENAS para gerar a chave inicial que será
 * armazenada como variável de ambiente.
 *
 * @returns Chave em formato hexadecimal (64 caracteres)
 *
 * @example
 * const novaChave = generateEncryptionKey()
 * console.log(novaChave)
 * // Copie esta chave e adicione nas variáveis de ambiente como VITE_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(key, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verifica se um texto está criptografado
 *
 * @param text - Texto a ser verificado
 * @returns true se o texto parece estar criptografado, false caso contrário
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false

  // Verifica se está no formato "iv:ciphertext"
  const parts = text.split(':')
  if (parts.length !== 2) return false

  // Verifica se ambas as partes são Base64 válidas
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
  return base64Regex.test(parts[0]) && base64Regex.test(parts[1])
}

/**
 * Criptografa múltiplos campos de uma vez
 *
 * @param fields - Objeto com os campos a serem criptografados
 * @returns Objeto com os campos criptografados
 *
 * @example
 * const dadosCriptografados = await encryptFields({
 *   cpf: "12345678900",
 *   whatsapp: "21999999999",
 *   senha: "minhasenha123"
 * })
 */
export async function encryptFields(fields: Record<string, string>): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      encrypted[key] = await encrypt(value)
    } else {
      encrypted[key] = value
    }
  }

  return encrypted
}

/**
 * Descriptografa múltiplos campos de uma vez
 *
 * @param fields - Objeto com os campos criptografados
 * @returns Objeto com os campos descriptografados
 */
export async function decryptFields(fields: Record<string, string>): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(fields)) {
    if (value && isEncrypted(value)) {
      try {
        decrypted[key] = await decrypt(value)
      } catch (error) {
        console.error(`Erro ao descriptografar campo ${key}:`, error)
        decrypted[key] = value // Mantém o valor original em caso de erro
      }
    } else {
      decrypted[key] = value
    }
  }

  return decrypted
}
