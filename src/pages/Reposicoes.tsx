import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import Navigation from '../components/Navigation'
import { ReposicoesService } from '../services/reposicoesService'
import { AlunoComFaltas, ReposicaoAgendada, RegistroPresenca } from '../types'

const Reposicoes = () => {
  const navigate = useNavigate()
  const { turmaId } = useParams()
  const { user } = useAuth()
  const [alunosComFaltas, setAlunosComFaltas] = useState<AlunoComFaltas[]>([])
  const [reposicoesAgendadas, setReposicoesAgendadas] = useState<ReposicaoAgendada[]>([])
  const [loading, setLoading] = useState(false)
  const [showModalAgendar, setShowModalAgendar] = useState(false)
  const [faltaSelecionada, setFaltaSelecionada] = useState<RegistroPresenca | null>(null)
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoComFaltas | null>(null)

  // Função para obter o caminho base do Firestore
  const getBasePath = () => {
    if (!user) return ""
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
  }

  // Buscar dados iniciais
  const carregarDados = async () => {
    if (!user || !turmaId) return

    try {
      setLoading(true)
      const basePath = getBasePath()
      
      // Buscar alunos com faltas
      const alunos = await ReposicoesService.buscarAlunosComFaltas(basePath, turmaId)
      setAlunosComFaltas(alunos)
      
      // Buscar reposições agendadas
      const reposicoes = await ReposicoesService.buscarReposicoesAgendadas(basePath, turmaId)
      setReposicoesAgendadas(reposicoes)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user, turmaId])

  // Função para agendar reposição
  const agendarReposicao = async (dataAgendada: string, observacoes: string, enviarWhatsApp: boolean) => {
    if (!faltaSelecionada || !alunoSelecionado || !user) return

    try {
      setLoading(true)
      const basePath = getBasePath()
      
      const novaReposicao: Omit<ReposicaoAgendada, 'id' | 'dataCriacao' | 'dataAtualizacao'> = {
        alunoId: faltaSelecionada.alunoId,
        alunoNome: alunoSelecionado.nome,
        palestraOriginalId: faltaSelecionada.palestraId,
        palestraOriginalTitulo: faltaSelecionada.palestraTitulo,
        fragmentoNumero: 1,
        dataAgendada,
        instrutor: user.nome,
        whatsappEnviado: false,
        observacoes: observacoes || undefined,
        status: 'pendente'
      }

      const reposicaoId = await ReposicoesService.agendarReposicao(basePath, turmaId!, novaReposicao)
      
      // Se deve enviar WhatsApp
      if (enviarWhatsApp && alunoSelecionado.whatsapp) {
        const reposicaoCompleta: ReposicaoAgendada = {
          ...novaReposicao,
          id: reposicaoId,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        }
        
        await ReposicoesService.enviarNotificacaoWhatsApp(
          reposicaoCompleta,
          alunoSelecionado.whatsapp,
          alunoSelecionado.codigoPais
        )
        
        // Marcar como enviado
        await ReposicoesService.atualizarReposicao(basePath, turmaId!, reposicaoId, {
          whatsappEnviado: true,
          dataEnvioWhatsApp: new Date().toISOString()
        })
      }

      alert('Reposição agendada com sucesso!')
      setShowModalAgendar(false)
      setFaltaSelecionada(null)
      setAlunoSelecionado(null)
      
      // Recarregar dados
      await carregarDados()
    } catch (error) {
      console.error('Erro ao agendar reposição:', error)
      alert('Erro ao agendar reposição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir modal de agendamento
  const abrirModalAgendamento = (aluno: AlunoComFaltas, falta: RegistroPresenca) => {
    setAlunoSelecionado(aluno)
    setFaltaSelecionada(falta)
    setShowModalAgendar(true)
  }

  // Função para remover reposição
  const removerReposicao = async (reposicaoId: string) => {
    if (!confirm('Tem certeza que deseja remover esta reposição?')) return

    try {
      setLoading(true)
      const basePath = getBasePath()
      await ReposicoesService.removerReposicao(basePath, turmaId!, reposicaoId)
      alert('Reposição removida com sucesso!')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao remover reposição:', error)
      alert('Erro ao remover reposição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && alunosComFaltas.length === 0) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Reposições</h1>
              <p className="mt-2 text-gray-600">Visualize faltas e agende reposições</p>
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
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alunos com Faltas</p>
                <p className="text-2xl font-semibold text-gray-900">{alunosComFaltas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reposições Pendentes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reposicoesAgendadas.filter(r => r.status === 'pendente').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reposições Realizadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reposicoesAgendadas.filter(r => r.status === 'realizada').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Alunos com Faltas */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Alunos com Faltas</h2>
            <p className="text-gray-600 mt-1">Clique em "Agendar" para marcar uma reposição</p>
          </div>
          
          <div className="p-6">
            {alunosComFaltas.length > 0 ? (
              <div className="space-y-4">
                {alunosComFaltas.map((aluno) => (
                  <div key={aluno.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{aluno.nome}</h3>
                        <p className="text-sm text-gray-600">Total de faltas: {aluno.totalFaltas}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {aluno.totalFaltas} falta{aluno.totalFaltas > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {aluno.faltas.map((falta, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{falta.palestraTitulo}</p>
                            <p className="text-sm text-gray-600">ID: {falta.palestraId}</p>
                          </div>
                          <button
                            onClick={() => abrirModalAgendamento(aluno, falta)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Agendar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Nenhum aluno com faltas encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Reposições Agendadas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Reposições Agendadas</h2>
            <p className="text-gray-600 mt-1">Gerencie as reposições já agendadas</p>
          </div>
          
          <div className="p-6">
            {reposicoesAgendadas.length > 0 ? (
              <div className="space-y-4">
                {reposicoesAgendadas.map((reposicao) => (
                  <div key={reposicao.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reposicao.alunoNome}</h3>
                        <p className="text-sm text-gray-600">{reposicao.palestraOriginalTitulo}</p>
                        <p className="text-sm text-gray-500">
                          Data: {new Date(reposicao.dataAgendada).toLocaleDateString('pt-BR')} | 
                          Instrutor: {reposicao.instrutor}
                        </p>
                        {reposicao.observacoes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Obs: {reposicao.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reposicao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          reposicao.status === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                          reposicao.status === 'realizada' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {reposicao.status === 'pendente' ? '⏰ Pendente' :
                           reposicao.status === 'confirmada' ? '✅ Confirmada' :
                           reposicao.status === 'realizada' ? '🎉 Realizada' :
                           '❌ Cancelada'}
                        </span>
                        {reposicao.whatsappEnviado && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            📱 Enviado
                          </span>
                        )}
                        <button
                          onClick={() => removerReposicao(reposicao.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-lg transition-colors text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Nenhuma reposição agendada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showModalAgendar && faltaSelecionada && alunoSelecionado && (
        <ModalAgendarReposicao
          falta={faltaSelecionada}
          aluno={alunoSelecionado}
          onFechar={() => {
            setShowModalAgendar(false)
            setFaltaSelecionada(null)
            setAlunoSelecionado(null)
          }}
          onAgendar={agendarReposicao}
        />
      )}
    </div>
  )
}

// Modal para agendar reposição
const ModalAgendarReposicao = ({
  falta,
  aluno,
  onFechar,
  onAgendar
}: {
  falta: RegistroPresenca
  aluno: AlunoComFaltas
  onFechar: () => void
  onAgendar: (data: string, observacoes: string, enviarWhatsApp: boolean) => void
}) => {
  const [dataAgendada, setDataAgendada] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [observacoes, setObservacoes] = useState('')
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(true)

  const handleAgendar = () => {
    if (!dataAgendada) {
      alert('Selecione uma data para a reposição')
      return
    }
    onAgendar(dataAgendada, observacoes, enviarWhatsApp)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Agendar Reposição</h2>
            <p className="text-gray-600 mt-1">{aluno.nome}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aula a Repor
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{falta.palestraTitulo}</p>
                <p className="text-sm text-gray-600">ID: {falta.palestraId}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Reposição *
              </label>
              <input
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enviarWhatsApp"
                checked={enviarWhatsApp}
                onChange={(e) => setEnviarWhatsApp(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enviarWhatsApp" className="text-sm font-medium text-gray-700">
                Enviar notificação via WhatsApp
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onFechar}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgendar}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Agendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reposicoes

