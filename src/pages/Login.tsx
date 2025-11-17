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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-b-3 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Realizando login...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Lado Esquerdo - Instruções e Branding */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 flex flex-col justify-center text-white lg:order-1 order-2">
              {/* Logo e Título */}
              <div className="mb-6">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <img
                    src="/assets/logo.png"
                    alt="GNOSIS Logo"
                    className="h-20 w-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/splash-icon.png"
                    }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold">GNOSIS Instrutores</h1>
                    <p className="text-purple-100 text-sm">Primeira Câmara</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-purple-400 opacity-30 my-5"></div>

              {/* Instruções Passo a Passo */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-3 flex items-center">
                    <ScanLine className="h-5 w-5 mr-2" />
                    Como fazer login:
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm mb-0.5">Abra o aplicativo</p>
                      <p className="text-purple-100 text-xs">Inicie o app GNOSIS Instrutores no seu celular</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm mb-0.5">Faça login no app</p>
                      <p className="text-purple-100 text-xs">Entre com suas credenciais normalmente</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm mb-0.5">Acesse Controle de Turmas</p>
                      <p className="text-purple-100 text-xs">Navegue até a tela de controle de turmas</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm mb-0.5">Toque no Scanner</p>
                      <p className="text-purple-100 text-xs">Clique no ícone de QR Scanner no topo da tela</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-sm">
                      5
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm mb-0.5">Escaneie o QR Code</p>
                      <p className="text-purple-100 text-xs">Aponte a câmera para o código ao lado →</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="mt-5 p-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
                <div className="flex items-start space-x-2">
                  <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-100">
                    O login via QR Code é seguro e criptografado. Seus dados são transmitidos de forma protegida entre o aplicativo e a web.
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Direito - QR Code */}
            <div className="p-8 flex flex-col justify-center items-center bg-gray-50 lg:order-2 order-1">
              <div className="w-full max-w-sm">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                    <QrCode className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Escaneie para entrar</h2>
                  <p className="text-gray-600 text-sm">Use o aplicativo mobile para fazer login</p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
                  {generatingQR ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-purple-600 mb-3"></div>
                      <p className="text-gray-600 text-sm font-medium">Gerando QR Code...</p>
                    </div>
                  ) : qrSessionId ? (
                    <div className="flex flex-col items-center">
                      <QRCodeSVG
                        value={qrSessionId}
                        size={240}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: "/assets/splash-icon.png",
                          height: 36,
                          width: 36,
                          excavate: true,
                        }}
                      />

                      <div className="mt-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="animate-pulse h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">Aguardando escaneamento...</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Código expira em 5 minutos
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-gray-600 text-sm mb-3">Erro ao gerar QR Code</p>
                      <button
                        onClick={handleGenerateQRCode}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>

                {/* Botão Atualizar */}
                <div className="mt-4 text-center">
                  <button
                    onClick={handleGenerateQRCode}
                    disabled={generatingQR}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generatingQR ? 'animate-spin' : ''}`} />
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
