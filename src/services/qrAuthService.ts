import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import CryptoJS from 'crypto-js'

const QR_SESSIONS_COLLECTION = 'qr_auth_sessions'
const ENCRYPTION_KEY = 'gnosis_qr_auth_2025' // Chave para criptografia

export interface QRAuthData {
  cpf: string
  token: string  // Token ou senha
  pais: string
  estado: string
  lumisial: string
  isToken?: boolean  // Flag para indicar se é token
}

// Gera um ID único para a sessão
export const generateSessionId = (): string => {
  return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Cria uma sessão de autenticação QR no Firestore
export const createQRSession = async (sessionId: string): Promise<void> => {
  const sessionRef = doc(db, QR_SESSIONS_COLLECTION, sessionId)
  await setDoc(sessionRef, {
    sessionId,
    status: 'waiting', // waiting, completed, expired
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Expira em 10 minutos
  })
}

// Criptografa os dados de autenticação (Base64 para compatibilidade com React Native)
export const encryptAuthData = (data: QRAuthData): string => {
  const jsonString = JSON.stringify(data)
  return btoa(jsonString) // Base64 encode
}

// Descriptografa os dados de autenticação (Base64 para compatibilidade com React Native)
export const decryptAuthData = (encryptedData: string): QRAuthData => {
  const jsonString = atob(encryptedData) // Base64 decode
  return JSON.parse(jsonString)
}

// App envia os dados de autenticação para a sessão
export const sendAuthData = async (sessionId: string, authData: QRAuthData): Promise<void> => {
  const sessionRef = doc(db, QR_SESSIONS_COLLECTION, sessionId)

  // Verifica se a sessão existe e não expirou
  const sessionDoc = await getDoc(sessionRef)
  if (!sessionDoc.exists()) {
    throw new Error('Sessão QR não encontrada ou expirada')
  }

  const sessionData = sessionDoc.data()
  const expiresAt = new Date(sessionData.expiresAt)

  if (new Date() > expiresAt) {
    throw new Error('Sessão QR expirada')
  }

  // Criptografa os dados
  const encryptedData = encryptAuthData(authData)

  // Atualiza a sessão com os dados criptografados
  await setDoc(sessionRef, {
    ...sessionData,
    status: 'completed',
    encryptedData,
    completedAt: new Date().toISOString()
  })
}

// Web escuta por atualizações na sessão
export const listenToQRSession = (
  sessionId: string,
  onDataReceived: (authData: QRAuthData) => void,
  onError: (error: Error) => void
): (() => void) => {
  console.log('=== INICIANDO LISTENER DE QR SESSION ===')
  console.log('Session ID:', sessionId)

  const sessionRef = doc(db, QR_SESSIONS_COLLECTION, sessionId)

  const unsubscribe = onSnapshot(
    sessionRef,
    (snapshot) => {
      console.log('📡 Snapshot recebido!')

      if (snapshot.exists()) {
        const data = snapshot.data()
        console.log('Status da sessão:', data.status)
        console.log('Dados da sessão:', {
          status: data.status,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          hasEncryptedData: !!data.encryptedData
        })

        // Se os dados foram recebidos
        if (data.status === 'completed' && data.encryptedData) {
          console.log('✅ Dados completados! Descriptografando...')
          console.log('Encrypted data (primeiros 50 chars):', data.encryptedData.substring(0, 50) + '...')

          try {
            const authData = decryptAuthData(data.encryptedData)
            console.log('Dados descriptografados:', {
              cpf: authData.cpf,
              pais: authData.pais,
              estado: authData.estado,
              lumisial: authData.lumisial,
              isToken: authData.isToken,
              tokenLength: authData.token?.length
            })

            console.log('Chamando onDataReceived...')
            onDataReceived(authData)

            // Limpa a sessão após 10 segundos
            setTimeout(() => {
              console.log('Limpando sessão QR...')
              deleteQRSession(sessionId).catch(console.error)
            }, 10000)
          } catch (error) {
            console.error('❌ Erro ao descriptografar:', error)
            onError(new Error('Erro ao descriptografar dados'))
          }
        }

        // Verifica se expirou apenas quando está esperando
        if (data.status === 'waiting') {
          const expiresAt = new Date(data.expiresAt)
          const now = new Date()
          console.log('Verificando expiração...')
          console.log('Expira em:', expiresAt.toISOString())
          console.log('Agora:', now.toISOString())

          if (now > expiresAt) {
            console.error('❌ Sessão EXPIRADA!')
            onError(new Error('Sessão QR expirada'))
            unsubscribe()
          } else {
            console.log('✅ Sessão ainda válida')
          }
        }
      } else {
        console.log('⚠️ Snapshot não existe!')
      }
    },
    (error) => {
      console.error('❌ Erro no listener:', error)
      onError(error as Error)
    }
  )

  console.log('Listener configurado!')
  return unsubscribe
}

// Deleta uma sessão QR
export const deleteQRSession = async (sessionId: string): Promise<void> => {
  const sessionRef = doc(db, QR_SESSIONS_COLLECTION, sessionId)
  await deleteDoc(sessionRef)
}
