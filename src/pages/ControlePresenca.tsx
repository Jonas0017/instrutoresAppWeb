import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc, db as firestore } from '@/lib/firebase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import Navigation from '../components/Navigation'
import { ModalHistoricoAluno } from '../components/ModalHistoricoAluno'
import { ModalTransferenciaAluno } from '../components/ModalTransferenciaAluno'
import { useHistoricoAluno } from '../hooks/useHistoricoAluno'
import { HistoricoAluno } from '../types'
import { getGreeting, getResumo, getMotivacao } from '../utils/whatsappMessages'

interface Aluno {
  id: string
  nome: string
  whatsapp?: string
  codigoPais?: string
  status?: 'presente' | 'ausente' | 'desativado'
  data?: string
  instrutor?: string
  reposicao?: boolean
  atraso?: boolean
}

interface Palestra {
  id: string
  titulo: string
  data: string
}

// Modal de Detalhes do Aluno
const ModalDetalhesAluno = ({ 
  aluno, 
  palestraTitulo, 
  turmaId, 
  isVisible, 
  onClose, 
  onEdit 
}: {
  aluno: Aluno | null
  palestraTitulo: string
  turmaId: string
  isVisible: boolean
  onClose: () => void
  onEdit: () => void
}) => {
  if (!isVisible || !aluno) return null

  const getStatusColor = () => {
    switch (aluno.status) {
      case 'presente': return 'bg-green-100 text-green-800 border-green-200'
      case 'ausente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'desativado': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (aluno.status) {
      case 'presente': return '✅'
      case 'ausente': return '⚠️'
      case 'desativado': return '🚫'
      default: return '⚠️'
    }
  }

  const getStatusText = () => {
    switch (aluno.status) {
      case 'presente': return 'Presente'
      case 'ausente': return 'Ausente'
      case 'desativado': return 'Desativado'
      default: return 'Ausente'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h2>
            <p className="text-gray-600 mt-1">{palestraTitulo}</p>
          </div>

          {/* Informações do Aluno */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
                  {getStatusIcon()} {getStatusText()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">ID:</span>
                  <p className="text-lg font-semibold text-gray-900">{aluno.id}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Nome:</span>
                  <p className="text-lg font-semibold text-gray-900">{aluno.nome}</p>
                </div>

                {aluno.whatsapp && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">WhatsApp:</span>
                    <p className="text-lg font-semibold text-gray-900">{aluno.whatsapp}</p>
                  </div>
                )}

                {aluno.data && aluno.status === 'presente' && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Data de Presença:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(aluno.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {aluno.instrutor && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Instrutor:</span>
                    <p className="text-lg font-semibold text-gray-900">{aluno.instrutor}</p>
                  </div>
                )}

                {/* Badges para Reposição e Atraso */}
                <div className="flex gap-2">
                  {aluno.reposicao && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      📅 Reposição
                    </span>
                  )}
                  {aluno.atraso && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      ⏰ Atraso
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onEdit()
                onClose()
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal de Opções do Aluno
const ModalOpcoesAluno = ({ 
  aluno, 
  palestraTitulo, 
  isVisible, 
  onClose, 
  onWhatsApp, 
  onDesativar, 
  onRemover,
  onAbrirHistorico,
  onTransferirAluno
}: {
  aluno: Aluno | null
  palestraTitulo: string
  isVisible: boolean
  onClose: () => void
  onWhatsApp: (tipo: 'conversa' | 'resumo' | 'motivacao') => void
  onDesativar: () => void
  onRemover: () => void
  onAbrirHistorico: (aluno: Aluno) => void
  onTransferirAluno: (aluno: Aluno) => void
}) => {
  if (!isVisible || !aluno) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">⚙️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Opções do Aluno</h2>
            <p className="text-gray-600 mt-1">{aluno.nome}</p>
          </div>

          {/* Opções WhatsApp */}
          {aluno.whatsapp && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">📱 WhatsApp</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onWhatsApp('conversa')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  💬 Conversar
                </button>
                <button
                  onClick={() => onWhatsApp('resumo')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  📋 Enviar Resumo
                </button>
                <button
                  onClick={() => onWhatsApp('motivacao')}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  💪 Enviar Motivação
                </button>
              </div>
            </div>
          )}

          {/* Ações de Histórico e Transferência */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">📊 Histórico</h3>
            <div className="space-y-2">
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (aluno) {
                    await onAbrirHistorico(aluno)
                    onClose()
                  }
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📈 Ver Histórico Completo
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (aluno) {
                    await onTransferirAluno(aluno)
                    onClose()
                  }
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🔄 Transferir para Outra Turma
              </button>
            </div>
          </div>

          {/* Ações de Gerenciamento */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🔧 Gerenciar</h3>
            <div className="space-y-2">
              <button
                onClick={onDesativar}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🚫 Desativar em Todas as Aulas
              </button>
              <button
                onClick={onRemover}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🗑️ Remover Completamente
              </button>
            </div>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

const ControlePresenca = () => {
  const navigate = useNavigate()
  const { turmaId } = useParams()
  const { user } = useAuth()
  const [palestraAtual, setPalestraAtual] = useState<number>(1)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(false)
  const [palestras, setPalestras] = useState<Palestra[]>([])
  const [instrutorLogado, setInstrutorLogado] = useState<string>("")

  // Estados dos modais
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)
  const [isModalDetalhesVisible, setIsModalDetalhesVisible] = useState(false)
  const [isModalOpcoesVisible, setIsModalOpcoesVisible] = useState(false)
  const [isModalEditarStatusVisible, setIsModalEditarStatusVisible] = useState(false)
  
  // Estados para histórico e transferência
  const [isModalHistoricoVisible, setIsModalHistoricoVisible] = useState(false)
  const [isModalTransferenciaVisible, setIsModalTransferenciaVisible] = useState(false)
  const [alunoSelecionadoHistorico, setAlunoSelecionadoHistorico] = useState<Aluno | null>(null)
  
  // Hook para histórico
  const {
    historico,
    turmasDisponiveis,
    loading: loadingHistorico,
    loadingTransferencia,
    buscarHistorico,
    buscarTurmasDisponiveis,
    transferirAluno,
    compartilharHistoricoWhatsApp,
    limparDados
  } = useHistoricoAluno()

  // Estados para WebViews
  const [showReportRelatorio, setShowReportRelatorio] = useState(false)
  const [showInsertAll, setShowInsertAll] = useState(false)

  // Função auxiliar para construir o caminho base no Firestore
  const getBasePath = () => {
    if (!user) return ""
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}/turmas/${turmaId}`
  }

  // Busca de palestras
  const fetchPalestras = async () => {
    if (!user) return
    try {
      setLoading(true)
      const basePath = getBasePath()
      const palestrasCollection = collection(firestore, `${basePath}/palestras`)
      const querySnapshot = await getDocs(palestrasCollection)
      
      const palestrasData = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        titulo: docSnapshot.data()?.nome?.pt || `Palestra ${docSnapshot.id}`,
        data: docSnapshot.data()?.data || "",
      }))

      setPalestras(palestrasData)
    } catch (error) {
      console.error("Erro ao buscar palestras:", error)
    } finally {
      setLoading(false)
    }
  }

  // Busca de alunos e suas presenças
  const fetchPresenca = async (palestraId: string) => {
    if (!user) return
    try {
      setLoading(true)
      const basePath = getBasePath()
      
      // Buscar todos os alunos da turma
      const alunosCollection = collection(firestore, `${basePath}/alunos`)
      const alunosSnapshot = await getDocs(alunosCollection)
      
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aluno[]

      // Buscar presenças da palestra atual
      const presencasCollection = collection(firestore, `${basePath}/palestras/${palestraId}/presenca`)
      const presencasSnapshot = await getDocs(presencasCollection)
      
      const presencasMap = new Map()
      presencasSnapshot.docs.forEach(doc => {
        presencasMap.set(doc.id, doc.data())
      })

      // Combinar dados dos alunos com suas presenças
      const alunosComPresenca = alunosData.map(aluno => ({
        ...aluno,
        ...presencasMap.get(aluno.id),
        status: presencasMap.get(aluno.id)?.status || 'ausente'
      }))

      setAlunos(alunosComPresenca)
    } catch (error) {
      console.error("Erro ao buscar presenças:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setInstrutorLogado(user.nome)
    }
  }, [user])

  useEffect(() => {
    if (turmaId && user) {
      fetchPalestras()
    }
  }, [turmaId, user])

  useEffect(() => {
    const currentPalestra = palestras[palestraAtual - 1]
    if (!turmaId || !currentPalestra?.id) return
    fetchPresenca(currentPalestra.id)
  }, [palestraAtual, turmaId, palestras])

  // Função para obter a data local como string "YYYY-MM-DD"
  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Função para alternar status
  const toggleStatus = async (id: string, currentStatus: "presente" | "ausente" | "desativado") => {
    if (!user || currentStatus === "desativado") return
    try {
      setLoading(true)
      const basePath = getBasePath()
      const currentPalestra = palestras[palestraAtual - 1]
      if (!currentPalestra) return

      const newStatus = currentStatus === "presente" ? "ausente" : "presente"
      const novaData = newStatus === "presente" ? getLocalDateString() : ""
      const novoInstrutor = newStatus === "presente" ? instrutorLogado : ""

      const currentAluno = alunos.find(a => a.id === id)

      const alunoDoc = doc(firestore, `${basePath}/palestras/${currentPalestra.id}/presenca`, id)

      await updateDoc(alunoDoc, {
        status: newStatus,
        data: novaData,
        instrutor: novoInstrutor,
        reposicao: currentAluno?.reposicao || false,
        atraso: currentAluno?.atraso || false
      })

      setAlunos((prev) =>
        prev.map((aluno) =>
          aluno.id === id ? {
            ...aluno,
            status: newStatus,
            data: novaData,
            instrutor: novoInstrutor,
            reposicao: currentAluno?.reposicao || false,
            atraso: currentAluno?.atraso || false
          } : aluno
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir WhatsApp
  const abrirWhatsApp = async (tipo: 'conversa' | 'resumo' | 'motivacao') => {
    if (!alunoSelecionado?.whatsapp) return

    const numeroFormatado = alunoSelecionado.whatsapp.replace(/\D/g, "")
    const codigoPaisFormatado = alunoSelecionado.codigoPais?.replace(/\D/g, "") || "55"
    const numeroCompleto = `${codigoPaisFormatado}${numeroFormatado}`

    const saudacao = await getGreeting(alunoSelecionado.nome)
    let mensagem = saudacao
    const palestraTitulo = palestras[palestraAtual - 1]?.titulo || ""

    switch (tipo) {
      case "conversa":
        mensagem += "\n\nGostaria de conversar com você sobre a aula."
        break
      case "resumo":
        const resumoUrl = await getResumo(palestraTitulo)
        if (resumoUrl !== "📄 O resumo ainda não está disponível.") {
          mensagem += `\n\n📚 ${palestraTitulo}\n\n${resumoUrl}`
        } else {
          mensagem += `\n\n📚 ${palestraTitulo}\n\n${resumoUrl}`
        }
        break
      case "motivacao":
        const motivacao = await getMotivacao(palestraTitulo)
        if (motivacao) {
          mensagem += `\n\n💪 ${palestraTitulo}\n\n${motivacao}`
        } else {
          mensagem += `\n\n💪 ${palestraTitulo}\n\nEsperamos você na próxima aula! Continue firme no trabalho interior. 🙏`
        }
        break
    }

    const url = `https://web.whatsapp.com/send?phone=${numeroCompleto}&text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  // Função para desativar aluno em todas as aulas
  const desativarAlunoEmTodasAulas = async () => {
    if (!alunoSelecionado || !user) return
    
    if (!confirm(`Tem certeza que deseja desativar "${alunoSelecionado.nome}" em todas as aulas?`)) return

    try {
      setLoading(true)
      const basePath = getBasePath()
      
      // Desativar no cadastro principal
      const alunoDoc = doc(firestore, `${basePath}/alunos/${alunoSelecionado.id}`)
      await updateDoc(alunoDoc, { status: "desativado" })
      
      // Desativar em todas as palestras
      const palestrasCollection = collection(firestore, `${basePath}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)
      
      for (const palestra of palestrasSnapshot.docs) {
        const presencaDoc = doc(firestore, `${basePath}/palestras/${palestra.id}/presenca/${alunoSelecionado.id}`)
        await updateDoc(presencaDoc, { status: "desativado" })
      }

      setAlunos((prev) =>
        prev.map((aluno) =>
          aluno.id === alunoSelecionado.id ? { ...aluno, status: "desativado" } : aluno
        )
      )

      alert("Aluno desativado em todas as aulas!")
      setIsModalOpcoesVisible(false)
    } catch (error) {
      console.error("Erro ao desativar aluno:", error)
      alert("Erro ao desativar aluno. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função para remover aluno completamente
  const removerAlunoCompletamente = async () => {
    if (!alunoSelecionado || !user) return
    
    if (!confirm(`Tem certeza que deseja remover "${alunoSelecionado.nome}" completamente?\n\nEsta ação é IRREVERSÍVEL!`)) return

    try {
      setLoading(true)
      const basePath = getBasePath()

      // Remover de todas as palestras
      const palestrasCollection = collection(firestore, `${basePath}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)

      for (const palestra of palestrasSnapshot.docs) {
        try {
          const presencaDoc = doc(firestore, `${basePath}/palestras/${palestra.id}/presenca/${alunoSelecionado.id}`)
          await deleteDoc(presencaDoc)
        } catch (error) {
          console.log(`Presença não encontrada na palestra ${palestra.id}`)
        }
      }

      // Remover do cadastro principal
      const alunoDoc = doc(firestore, `${basePath}/alunos/${alunoSelecionado.id}`)
      await deleteDoc(alunoDoc)

      setAlunos((prev) => prev.filter((aluno) => aluno.id !== alunoSelecionado.id))

      alert("Aluno removido completamente do sistema!")
      setIsModalOpcoesVisible(false)
    } catch (error) {
      console.error("Erro ao remover aluno:", error)
      alert("Erro ao remover aluno. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar status extras (data, instrutor, reposição, atraso)
  const atualizarStatusExtras = async (alunoId: string, novaData: string, novoInstrutor: string, reposicao: boolean, atraso: boolean) => {
    if (!user) return
    try {
      setLoading(true)
      const basePath = getBasePath()
      const currentPalestra = palestras[palestraAtual - 1]
      if (!currentPalestra) return

      const novoStatus = (reposicao || atraso) ? "presente" : "presente"

      const statusDoc = doc(firestore, `${basePath}/palestras/${currentPalestra.id}/presenca`, alunoId)
      await updateDoc(statusDoc, {
        status: novoStatus,
        data: novaData,
        instrutor: novoInstrutor,
        reposicao,
        atraso
      })
      
      setAlunos((prev) =>
        prev.map((aluno) =>
          aluno.id === alunoId ? {
            ...aluno,
            status: novoStatus,
            data: novaData,
            instrutor: novoInstrutor,
            reposicao,
            atraso
          } : aluno
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar status extras:", error)
    } finally {
      setLoading(false)
    }
  }

  const adicionarAluno = () => {
    const currentPalestra = palestras[palestraAtual - 1]
    if (!currentPalestra) return
    navigate(`/inserir-aluno/${turmaId}/${currentPalestra.id}`)
  }

  // Funções para histórico e transferência
  const handleAbrirHistorico = async (aluno: Aluno) => {
    setAlunoSelecionadoHistorico(aluno)
    setIsModalHistoricoVisible(true)
    if (user) {
      const basePath = `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}/turmas/${turmaId}`
      try {
        await buscarHistorico(basePath, turmaId || '', aluno.id)
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error)
      }
    }
  }

  const handleTransferirAluno = async (aluno: Aluno) => {
    setAlunoSelecionadoHistorico(aluno)
    if (user) {
      const basePath = `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
      await buscarTurmasDisponiveis(basePath, turmaId || '')
    }
    setIsModalTransferenciaVisible(true)
  }

  const handleConfirmarTransferencia = async (alunoId: string, turmaDestinoId: string) => {
    if (!user) return

    try {
      const basePath = `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
      await transferirAluno(basePath, alunoId, turmaId || '', turmaDestinoId)
      
      alert('Aluno transferido com sucesso!')
      setIsModalTransferenciaVisible(false)
      setAlunoSelecionadoHistorico(null)
      
      // Recarregar lista de alunos
      const currentPalestra = palestras[palestraAtual - 1]
      if (currentPalestra?.id) {
        fetchPresenca(currentPalestra.id)
      }
    } catch (error) {
      console.error('Erro ao transferir aluno:', error)
      alert('Erro ao transferir aluno. Tente novamente.')
    }
  }

  const handleCompartilharHistorico = async (historico: HistoricoAluno) => {
    if (alunoSelecionadoHistorico) {
      await compartilharHistoricoWhatsApp(
        historico,
        alunoSelecionadoHistorico.whatsapp,
        alunoSelecionadoHistorico.codigoPais
      )
    }
  }

  const handleFecharHistorico = () => {
    setIsModalHistoricoVisible(false)
    setAlunoSelecionadoHistorico(null)
    limparDados()
  }

  const handleFecharTransferencia = () => {
    setIsModalTransferenciaVisible(false)
    setAlunoSelecionadoHistorico(null)
  }

  // Modal para editar status
  const ModalEditarStatus = ({ 
    aluno, 
    isVisible, 
    onClose, 
    onSalvar 
  }: {
    aluno: Aluno | null
    isVisible: boolean
    onClose: () => void
    onSalvar: (data: string, instrutor: string, reposicao: boolean, atraso: boolean) => void
  }) => {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
    const [instrutor, setInstrutor] = useState(instrutorLogado || "")
    const [isReposicao, setIsReposicao] = useState(false)
    const [isAtraso, setIsAtraso] = useState(false)

    useEffect(() => {
      if (aluno && isVisible) {
        setSelectedDate(aluno.data || new Date().toISOString().split('T')[0])
        setInstrutor(aluno.instrutor || instrutorLogado || "")
        setIsReposicao(aluno.reposicao || false)
        setIsAtraso(aluno.atraso || false)
      }
    }, [aluno, isVisible, instrutorLogado])

    if (!isVisible || !aluno) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">✏️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Editar Presença</h2>
              <p className="text-gray-600 mt-1">{aluno.nome}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instrutor</label>
                <input
                  type="text"
                  value={instrutor}
                  onChange={(e) => setInstrutor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome do instrutor"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isReposicao}
                    onChange={(e) => setIsReposicao(e.target.checked)}
                    className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">📅 Reposição</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAtraso}
                    onChange={(e) => setIsAtraso(e.target.checked)}
                    className="mr-2 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">⏰ Atraso</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onSalvar(selectedDate, instrutor || "", isReposicao, isAtraso)
                  onClose()
                }}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderItem = (aluno: Aluno) => {
    const currentPalestra = palestras[palestraAtual - 1]
    const dataExibida =
      aluno.data && aluno.data !== ""
        ? new Date(aluno.data).toLocaleDateString("pt-BR")
        : currentPalestra?.data && currentPalestra.data !== ""
          ? new Date(currentPalestra.data).toLocaleDateString("pt-BR")
          : "Ausente"

    const getStatusColor = () => {
      switch (aluno.status) {
        case "presente": return "border-green-500 bg-green-50"
        case "ausente": return "border-yellow-500 bg-yellow-50"
        case "desativado": return "border-gray-500 bg-gray-50"
        default: return "border-gray-500 bg-gray-50"
      }
    }

    const getStatusIcon = () => {
      switch (aluno.status) {
        case "presente": return "✅"
        case "ausente": return "⚠️"
        case "desativado": return "🚫"
        default: return "⚠️"
      }
    }

    const getStatusText = () => {
      switch (aluno.status) {
        case "presente": return "Presente"
        case "ausente": return "Ausente"
        case "desativado": return "Desativado"
        default: return "Ausente"
      }
    }

    return (
      <div
        key={aluno.id}
        className={`bg-white rounded-xl p-6 mb-4 shadow-lg border-l-4 ${getStatusColor()} ${
          aluno.status === "desativado" ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{aluno.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{aluno.nome}</h3>
              <p className="text-sm text-gray-600">ID: {aluno.id}</p>
            </div>
          </div>

            <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
          </div>
        </div>

        {/* Badges para Reposição e Atraso */}
        <div className="flex gap-2 mb-4">
              {aluno.reposicao && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              📅 Reposição
                </span>
              )}
              {aluno.atraso && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              ⏰ Atraso
                </span>
              )}
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          {aluno.status !== "desativado" && (
            <div>
              <span className="font-medium">Data:</span> {dataExibida}
            </div>
          )}
          {aluno.instrutor && (
            <div>
              <span className="font-medium">Instrutor:</span> {aluno.instrutor}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setAlunoSelecionado(aluno)
              setIsModalDetalhesVisible(true)
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            👁️ Detalhes
          </button>

          <button
            onClick={() => {
              setAlunoSelecionado(aluno)
              setIsModalOpcoesVisible(true)
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ⚙️ Opções
          </button>

          {aluno.status !== "desativado" && (
            <button
              onClick={() => toggleStatus(aluno.id, aluno.status || "ausente")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                aluno.status === "presente"
                  ? "bg-red-100 hover:bg-red-200 text-red-800"
                  : "bg-green-100 hover:bg-green-200 text-green-800"
              }`}
            >
              {aluno.status === "presente" ? "❌ Marcar Ausente" : "✅ Marcar Presente"}
            </button>
          )}

          <button
            onClick={() => {
              setAlunoSelecionado(aluno)
              setIsModalEditarStatusVisible(true)
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ✏️ Editar
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Controle de Presença</h1>
              <p className="mt-2 text-gray-600">Gerencie a presença dos alunos nas palestras</p>
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

          {/* Seletor de Palestra */}
        <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione a Palestra
            </label>
            <select
              value={palestraAtual}
              onChange={(e) => setPalestraAtual(Number(e.target.value))}
            className="input-field"
            >
            {palestras.map((palestra, index) => (
              <option key={palestra.id} value={index + 1}>
                    Lição {index + 1}: {palestra.titulo}
                  </option>
            ))}
            </select>
          </div>

          {/* Lista de Alunos */}
        <div className="mb-8">
            {alunos.length > 0 ? (
            <div>
              {alunos.map(renderItem)}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg mb-4">Nenhum aluno encontrado</p>
              <button
                onClick={adicionarAluno}
                className="btn-primary"
              >
                Adicionar Primeiro Aluno
              </button>
            </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex justify-center gap-4">
                <button
                  onClick={adicionarAluno}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>👤</span>
              <span>Adicionar Aluno</span>
                </button>

                <button
                  onClick={() => navigate(`/reposicoes/${turmaId}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>📅</span>
                  <span>Reposições</span>
                </button>

              {/* <button
              onClick={() => {
                console.log('Abrindo relatórios com dados:', {
                  turmaId: turmaId,
                  pais: user?.pais,
                  estado: user?.estado,
                  lumisial: user?.lumisial,
                  palestraId: palestras[palestraAtual - 1]?.id
                })
                setShowReportRelatorio(true)
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Relatórios</span>
                </button>
                */}
                
                <button
              onClick={() => {
                console.log('Abrindo sincronização com:', {
                  turmaId: turmaId,
                  pais: user?.pais,
                  estado: user?.estado,
                  lumisial: user?.lumisial,
                  palestraId: palestras[palestraAtual - 1]?.id
                })
                setShowInsertAll(true)
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>👥</span>
              <span>Inserir Vários</span>
            </button>
          </div>
        </div>
                  </div>

      {/* Modais */}
      <ModalDetalhesAluno
        aluno={alunoSelecionado}
        palestraTitulo={`Lição ${palestraAtual}: ${palestras[palestraAtual - 1]?.titulo || "Palestra"}`}
        turmaId={turmaId || ""}
        isVisible={isModalDetalhesVisible}
        onClose={() => setIsModalDetalhesVisible(false)}
        onEdit={() => setIsModalEditarStatusVisible(true)}
      />

             <ModalOpcoesAluno
         aluno={alunoSelecionado}
         palestraTitulo={`Lição ${palestraAtual}: ${palestras[palestraAtual - 1]?.titulo || "Palestra"}`}
         isVisible={isModalOpcoesVisible}
         onClose={() => setIsModalOpcoesVisible(false)}
         onWhatsApp={abrirWhatsApp}
         onDesativar={desativarAlunoEmTodasAulas}
         onRemover={removerAlunoCompletamente}
         onAbrirHistorico={handleAbrirHistorico}
         onTransferirAluno={handleTransferirAluno}
       />

       <ModalEditarStatus
         aluno={alunoSelecionado}
         isVisible={isModalEditarStatusVisible}
         onClose={() => setIsModalEditarStatusVisible(false)}
         onSalvar={(novaData, novoInstrutor, reposicao, atraso) => {
           if (alunoSelecionado) {
             atualizarStatusExtras(alunoSelecionado.id, novaData, novoInstrutor, reposicao, atraso)
           }
         }}
       />

       {/* Modal de Histórico */}
       <ModalHistoricoAluno
         visible={isModalHistoricoVisible}
         aluno={alunoSelecionadoHistorico}
         turmaId={turmaId || ''}
         basePath={user ? `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}/turmas/${turmaId}` : ''}
         onFechar={handleFecharHistorico}
         onTransferirAluno={handleTransferirAluno}
         onCompartilharHistorico={handleCompartilharHistorico}
       />

       {/* Modal de Transferência */}
       <ModalTransferenciaAluno
         visible={isModalTransferenciaVisible}
         aluno={alunoSelecionadoHistorico}
         turmaAtual={turmaId || ''}
         turmasDisponiveis={turmasDisponiveis}
         onFechar={handleFecharTransferencia}
         onConfirmar={handleConfirmarTransferencia}
         loading={loadingTransferencia}
       />

            {/* Modal WebView Relatórios - EXATAMENTE como no app móvel */}
      {showReportRelatorio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Relatórios de Presença</h2>
              <button
                onClick={() => setShowReportRelatorio(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
                </button>
              </div>
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                  <Loading />
                </div>
              )}
              <iframe
                src={`https://admin1c.gnosisbrasil.com/secureReport.php?api_key=${encodeURIComponent('uma_chave_super_secreta_aleatoria')}&pais=${user?.pais || 'Brasil'}&estado=${user?.estado || 'RJ'}&lumisial=${user?.lumisial || 'lumisial1'}&turma=${turmaId}&palestra=${palestras[palestraAtual - 1]?.id || ''}`}
                className="w-full h-full border-0"
                title="Relatórios de Presença"
                onLoad={() => setLoading(false)}
                onError={() => {
                  console.error('Erro ao carregar relatórios')
                  setLoading(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal WebView Inserir Vários - EXATAMENTE como no app móvel */}
      {showInsertAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Inserir Vários Alunos</h2>
              <button
                onClick={() => setShowInsertAll(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                  <Loading />
                </div>
              )}
              <iframe
                src={`https://admin1c.gnosisbrasil.com/status/index.php?turmaId=${turmaId}&pais=${user?.pais || 'Brasil'}&estado=${user?.estado || 'RJ'}&lumisial=${user?.lumisial || 'lumisial1'}&palestraId=${palestras[palestraAtual - 1]?.id || ''}`}
                className="w-full h-full border-0"
                title="Inserir Vários Alunos"
                onLoad={() => {
                  setLoading(false)
                  // Listener para mensagens do WebView - EXATAMENTE como no app móvel
                  window.addEventListener('message', (event) => {
                    try {
                      if (event.origin === 'https://admin1c.gnosisbrasil.com') {
                        const data = JSON.parse(event.data)
                        if (data.type === 'SYNC_COMPLETE') {
                          console.log('Sincronização completa, atualizando lista de alunos')
                          setShowInsertAll(false)
                          // Atualizar lista de alunos automaticamente
                          const currentPalestra = palestras[palestraAtual - 1]
                          if (currentPalestra?.id) {
                            fetchPresenca(currentPalestra.id)
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Erro ao processar mensagem do WebView:', error)
                    }
                  })
                }}
                onError={() => {
                  console.error('Erro ao carregar inserção em massa')
                  setLoading(false)
                }}
              />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default ControlePresenca 