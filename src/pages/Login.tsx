import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGeographicData } from '../hooks/useGeographicData'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, User, Lock, MapPin, Globe, Building } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { data: geoData, loading: geoLoading, checkUserExists } = useGeographicData()
  
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [pais, setPais] = useState('')
  const [estado, setEstado] = useState('')
  const [lumisial, setLumisial] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  // Debug dos dados geográficos
  useEffect(() => {
    console.log('Dados geográficos atualizados:', {
      geoLoading,
      paises: geoData.paises,
      estadosTotal: Object.keys(geoData.estados).length,
      lumisiaisTotal: Object.keys(geoData.lumisiais).length
    })
  }, [geoData, geoLoading])

  // Resetar estado quando país muda
  useEffect(() => {
    setEstado('')
    setLumisial('')
  }, [pais])

  // Resetar lumisial quando estado muda
  useEffect(() => {
    setLumisial('')
  }, [estado])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== INICIANDO LOGIN ===')
    console.log('CPF:', cpf)
    console.log('País:', pais)
    console.log('Estado:', estado)
    console.log('Lumisial:', lumisial)
    console.log('Senha preenchida:', !!senha)
    
    // Verificar campos obrigatórios
    const camposValidos = {
      cpf: !!cpf && cpf.length >= 11,
      senha: !!senha && senha.length >= 1,
      pais: !!pais,
      estado: !!estado,
      lumisial: !!lumisial
    }
    
    console.log('Validação dos campos:', camposValidos)
    
    if (!camposValidos.cpf || !camposValidos.senha || !camposValidos.pais || !camposValidos.estado || !camposValidos.lumisial) {
      const mensagem = 'Por favor, preencha todos os campos corretamente.'
      console.log(mensagem)
      toast.error(mensagem)
      return
    }

    try {
      setLoading(true)
      console.log('Chamando função de login...')
      
      // Remover formatação do CPF para o login
      const cpfLimpo = cpf.replace(/\D/g, '')
      console.log('CPF limpo:', cpfLimpo)
      
      const resultado = await login(cpfLimpo, senha, pais, estado, lumisial)
      console.log('Resultado do login:', resultado)
      
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error) {
      console.error('Erro durante o login:', error)
      const mensagem = error instanceof Error ? error.message : 'Erro ao fazer login'
      toast.error(mensagem)
    } finally {
      setLoading(false)
    }
  }



  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const getEstadosDisponiveis = () => {
    return pais ? geoData.estados[pais] || [] : []
  }

  const getLumisiaisDisponiveis = () => {
    return (pais && estado) ? geoData.lumisiais[`${pais}/${estado}`] || [] : []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">GNOSIS Instrutores</h1>
          <p className="text-gray-600 mt-2">Faça login para continuar</p>
        </div>

        <form 
          onSubmit={(e) => {
            console.log('Formulário submetido!')
            handleLogin(e)
          }} 
          className="space-y-6"
        >
          {/* Seleção de Localização */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Localização
            </h3>

            {/* País */}
            <div>
              <label htmlFor="pais" className="block text-sm font-medium text-gray-700">
                País
              </label>
              <div className="mt-1 relative">
                <select
                  id="pais"
                  value={pais}
                  onChange={(e) => {
                    console.log('País selecionado:', e.target.value)
                    setPais(e.target.value)
                  }}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={geoLoading}
                >
                  <option value="">Selecione o país</option>
                  {geoData.paises.map((paisOption) => (
                    <option key={paisOption} value={paisOption}>
                      {paisOption}
                    </option>
                  ))}
                </select>
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <div className="mt-1 relative">
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => {
                    console.log('Estado selecionado:', e.target.value)
                    setEstado(e.target.value)
                  }}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!pais || geoLoading}
                >
                  <option value="">Selecione o estado</option>
                  {getEstadosDisponiveis().map((estadoOption) => (
                    <option key={estadoOption} value={estadoOption}>
                      {estadoOption}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Lumisial */}
            <div>
              <label htmlFor="lumisial" className="block text-sm font-medium text-gray-700">
                Lumisial
              </label>
              <div className="mt-1 relative">
                <select
                  id="lumisial"
                  value={lumisial}
                  onChange={(e) => {
                    console.log('Lumisial selecionado:', e.target.value)
                    setLumisial(e.target.value)
                  }}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!estado || geoLoading}
                >
                  <option value="">Selecione o lumisial</option>
                  {getLumisiaisDisponiveis().map((lumisialOption) => (
                    <option key={lumisialOption} value={lumisialOption}>
                      {lumisialOption}
                    </option>
                  ))}
                </select>
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="mt-1 relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || geoLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                console.log('Botão clicado!')
                handleLogin(e)
              }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Entrar'
              )}
            </button>


          </div>
        </form>

        {geoLoading && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-500">
              Carregando dados geográficos...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login 