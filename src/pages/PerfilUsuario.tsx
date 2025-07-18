import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Card from '../components/Card'

const PerfilUsuario = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Perfil do Usuário</h1>
              <p className="mt-2 text-gray-600">Suas informações pessoais</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Voltar</span>
              </button>
              <button
                onClick={() => navigate('/consultar-turmas')}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <p className="mt-1 text-lg text-gray-900">{user?.nome}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">CPF</label>
              <p className="mt-1 text-lg text-gray-900">{user?.cpf}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
              <p className="mt-1 text-lg text-gray-900">{user?.whatsapp}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">País</label>
              <p className="mt-1 text-lg text-gray-900">{user?.pais}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <p className="mt-1 text-lg text-gray-900">{user?.estado}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lumisial</label>
              <p className="mt-1 text-lg text-gray-900">{user?.lumisial}</p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PerfilUsuario 