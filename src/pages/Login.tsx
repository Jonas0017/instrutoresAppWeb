import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { QrCode, RefreshCw, Smartphone, ScanLine } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { generateSessionId, createQRSession, listenToQRSession, type QRAuthData } from '../services/qrAuthService'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [generatingQR, setGeneratingQR] = useState(false)

  // Gerar QR Code automaticamente ao carregar a página
  useEffect(() => {
    handleGenerateQRCode()
  }, [])

  // Gerenciar sessão QR Code
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    if (qrSessionId) {
      // Escuta por dados enviados pelo app
      unsubscribe = listenToQRSession(
        qrSessionId,
        async (authData: QRAuthData) => {
          console.log('Dados recebidos do app via QR Code')

          try {
            setLoading(true)

            // Busca a senha do usuário no Firestore
            console.log('Buscando senha do usuário no Firestore...')

            const { doc, getDoc } = await import('@/lib/firebase')
            const { db } = await import('@/lib/firebase')

            let usuarioDoc: any = null
            let caminhoFirestore = ''

            // 1. Tenta buscar como instrutor DIOCESANO (no nível do estado)
            caminhoFirestore = `paises/${authData.pais}/estados/${authData.estado}/instrutores_diocesanos/${authData.cpf}`
            console.log('Tentando como diocesano:', caminhoFirestore)
            usuarioDoc = await getDoc(doc(db, caminhoFirestore))

            // 2. Se não encontrou, tenta como instrutor LOCAL (dentro do lumisial)
            if (!usuarioDoc.exists()) {
              caminhoFirestore = `paises/${authData.pais}/estados/${authData.estado}/lumisial/${authData.lumisial}/instrutor/${authData.cpf}`
              console.log('Tentando como local:', caminhoFirestore)
              usuarioDoc = await getDoc(doc(db, caminhoFirestore))
            }

            if (!usuarioDoc.exists()) {
              console.error('❌ Usuário não encontrado no Firestore em nenhum caminho')
              toast.error('Usuário não encontrado')
              handleGenerateQRCode()
              return
            }

            console.log('✅ Usuário encontrado em:', caminhoFirestore)

            const dadosUsuario = usuarioDoc.data()
            console.log('Senha encontrada! Fazendo login...')

            const resultado = await login(
              authData.cpf,
              dadosUsuario.senha, // Usa a senha do Firestore
              authData.pais,
              authData.estado,
              authData.lumisial,
              true // Manter logado por padrão quando usa QR Code
            )

            if (resultado) {
              toast.success(`Bem-vindo!`)
              navigate('/')
            }
          } catch (error) {
            console.error('Erro no login via QR:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
            // Gerar novo QR Code em caso de erro
            handleGenerateQRCode()
          } finally {
            setLoading(false)
          }
        },
        (error: Error) => {
          console.error('Erro na sessão QR:', error)
          toast.error('Sessão QR Code expirada. Gerando novo código...')
          // Gerar novo QR Code automaticamente
          handleGenerateQRCode()
        }
      )
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [qrSessionId, login, navigate])

  // Função para gerar QR Code
  const handleGenerateQRCode = async () => {
    try {
      setGeneratingQR(true)
      const sessionId = generateSessionId()
      await createQRSession(sessionId)
      setQrSessionId(sessionId)
      toast.success('QR Code gerado! Escaneie com o aplicativo.')
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      toast.error('Erro ao gerar QR Code. Tentando novamente...')
      // Tentar novamente após 2 segundos
      setTimeout(() => handleGenerateQRCode(), 2000)
    } finally {
      setGeneratingQR(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">
        {loading ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium text-lg">Realizando login...</p>
            <p className="text-gray-500 text-sm mt-2">Aguarde enquanto autenticamos suas credenciais</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Lado Esquerdo - Instruções e Branding */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-12 flex flex-col justify-center text-white lg:order-1 order-2">
              {/* Logo e Título */}
              <div className="mb-8">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <img
                    src="/assets/splash-icon.png"
                    alt="GNOSIS Logo"
                    className="h-20 w-20 object-contain drop-shadow-lg"
                    onError={(e) => {
                      // Fallback se splash-icon não existir
                      e.currentTarget.src = "/assets/logo.png"
                    }}
                  />
                </div>
                <h1 className="text-4xl font-bold mb-3">GNOSIS Instrutores</h1>
                <p className="text-purple-100 text-lg">Sistema de Gestão Pedagógica</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-purple-400 opacity-30 my-8"></div>

              {/* Instruções Passo a Passo */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-xl mb-4 flex items-center">
                    <ScanLine className="h-6 w-6 mr-3" />
                    Como fazer login:
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-lg mb-1">Abra o aplicativo</p>
                      <p className="text-purple-100 text-sm">Inicie o app GNOSIS Instrutores no seu celular</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-lg mb-1">Faça login no app</p>
                      <p className="text-purple-100 text-sm">Entre com suas credenciais normalmente</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-lg mb-1">Acesse Controle de Turmas</p>
                      <p className="text-purple-100 text-sm">Navegue até a tela de controle de turmas</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                      4
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-lg mb-1">Toque no Scanner</p>
                      <p className="text-purple-100 text-sm">Clique no ícone de QR Scanner no topo da tela</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                      5
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-lg mb-1">Escaneie o QR Code</p>
                      <p className="text-purple-100 text-sm">Aponte a câmera para o código ao lado →</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-100">
                    O login via QR Code é seguro e criptografado. Seus dados são transmitidos de forma protegida entre o aplicativo e a web.
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Direito - QR Code */}
            <div className="p-12 flex flex-col justify-center items-center bg-gray-50 lg:order-2 order-1">
              <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <QrCode className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Escaneie para entrar</h2>
                  <p className="text-gray-600">Use o aplicativo mobile para fazer login</p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
                  {generatingQR ? (
                    <div className="flex flex-col items-center justify-center h-80">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                      <p className="text-gray-600 font-medium">Gerando QR Code...</p>
                    </div>
                  ) : qrSessionId ? (
                    <div className="flex flex-col items-center">
                      <QRCodeSVG
                        value={qrSessionId}
                        size={320}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: "/assets/splash-icon.png",
                          height: 48,
                          width: 48,
                          excavate: true,
                        }}
                      />

                      <div className="mt-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 font-medium">Aguardando escaneamento...</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Código expira em 5 minutos
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-600 mb-4">Erro ao gerar QR Code</p>
                      <button
                        onClick={handleGenerateQRCode}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>

                {/* Botão Atualizar */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleGenerateQRCode}
                    disabled={generatingQR}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${generatingQR ? 'animate-spin' : ''}`} />
                    Gerar novo código
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
