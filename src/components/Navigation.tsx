import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, LogOut, Menu, X, BookOpen, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { getGreeting, getResumo, getMotivacao } from '../utils/whatsappMessages'

const Navigation = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showMensagensModal, setShowMensagensModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/', label: 'Turmas', icon: BookOpen },
    { path: '/inserir-turma', label: 'Adicionar Turma', icon: Users },
    { path: '/perfil-usuario', label: 'Perfil', icon: Home },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">GNOSIS</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user?.nome}
              </span>
              <button
                onClick={() => setShowMensagensModal(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Mensagens</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">GNOSIS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.nome}
              </span>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-primary-50"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setShowMensagensModal(true)
                  setIsMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5" />
                  <span>Mensagens</span>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal de Mensagens */}
      {showMensagensModal && (
        <ModalMensagens
          onFechar={() => setShowMensagensModal(false)}
        />
      )}
    </>
  )
}

// Palestras fixas do sistema Gnosis (1-23) - IGUAL AO APP MÓVEL
const PALESTRAS_GNOSIS = [
  { id: "01", titulo: "Lição 1: O que é Gnosis" },
  { id: "02", titulo: "Lição 2: Personalidade, Essência e Ego" },
  { id: "03", titulo: "Lição 3: Despertar da Consciência" },
  { id: "04", titulo: "Lição 4: O Eu Psicológico" },
  { id: "05", titulo: "Lição 5: Luz, Calor e Som" },
  { id: "06", titulo: "Lição 6: A Máquina Humana" },
  { id: "07", titulo: "Lição 7: O Mundo das Relações" },
  { id: "08", titulo: "Lição 8: O Caminho e a Vida" },
  { id: "09", titulo: "Lição 9: O Nível de Ser" },
  { id: "10", titulo: "Lição 10: O Decálogo" },
  { id: "11", titulo: "Lição 11: Educação Fundamental" },
  { id: "12", titulo: "Lição 12: A Árvore Genealógica das Religiões" },
  { id: "13", titulo: "Lição 13: Evolução, Involução e Revolução" },
  { id: "14", titulo: "Lição 14: O Raio da Morte" },
  { id: "15", titulo: "Lição 15: Reencarnação, Retorno e Recorrência" },
  { id: "16", titulo: "Lição 16: A Balança da Justiça" },
  { id: "17", titulo: "Lição 17: Os 4 Caminhos" },
  { id: "18", titulo: "Lição 18: Diagrama Interno do Homem" },
  { id: "19", titulo: "Lição 19: A Transformação da Energia" },
  { id: "20", titulo: "Lição 20: Os Elementais" },
    { id: "21", titulo: "Lição 21: Os 4 Estados de Consciência" },
    { id: "22", titulo: "Lição 22: A Iniciação" },
  { id: "23", titulo: "Lição 23: A Santa Igreja Gnóstica" },
]

// Modal de Mensagens (Resumos e Motivações) - IGUAL AO APP MÓVEL
const ModalMensagens = ({ onFechar }: { onFechar: () => void }) => {
  // Função para enviar resumo/motivação via WhatsApp
  const enviarWhatsAppPalestra = async (palestra: any, tipo: "resumo" | "motivacao") => {
    try {
      const saudacao = await getGreeting("Grupo da Turma")
      let mensagem = saudacao

      if (tipo === "resumo") {
        const resumoUrl = await getResumo(palestra.titulo)
        if (resumoUrl !== "Resumo não disponível.") {
          mensagem += `\n\n📚 Lição ${palestra.id} - ${palestra.titulo}\n\n${resumoUrl}`
        } else {
          mensagem += `\n\n📚 O resumo da Lição ${palestra.id} - ${palestra.titulo} ainda não está disponível.`
        }
      } else {
        const motivacao = await getMotivacao(palestra.titulo)
        if (motivacao) {
          mensagem += `\n\n💪 Lição ${palestra.id} - ${palestra.titulo}\n\n${motivacao}`
        } else {
          mensagem += `\n\n💪 Lição ${palestra.id} - ${palestra.titulo}\n\nVamos juntos nesta jornada de autoconhecimento! 🙏`
        }
      }

      // Abre o WhatsApp para seleção manual do contato
      const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`
      window.open(url, '_blank')

      onFechar()
    } catch (error) {
      console.error("❌ Erro ao abrir o WhatsApp:", error)
      alert("Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📱 Palestras Gnosis</h2>
              <p className="text-gray-600 mt-1">Envie resumos e motivações via WhatsApp</p>
            </div>
            <button
              onClick={onFechar}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Lista de Palestras Fixas - IGUAL AO APP MÓVEL */}
          <div className="space-y-4">
            {PALESTRAS_GNOSIS.map((palestra) => (
              <div key={palestra.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {palestra.titulo}
                    </h4>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => enviarWhatsAppPalestra(palestra, "resumo")}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-1"
                    >
                      <span>📚</span>
                      <span>Resumo</span>
                    </button>
                    <button
                      onClick={() => enviarWhatsAppPalestra(palestra, "motivacao")}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-1"
                    >
                      <span>💪</span>
                      <span>Motivação</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Fechar */}
          <div className="mt-6">
            <button
              onClick={onFechar}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navigation 