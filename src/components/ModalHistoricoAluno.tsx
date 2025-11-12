import React, { useState, useEffect } from 'react'
import { HistoricoAluno, TurmaDisponivel } from '../types'
import { HistoricoService } from '../services/historicoService'
import { getGreeting } from '../utils/whatsappMessages'

interface HistoricoAlunoModalProps {
  visible: boolean
  aluno: {
    id: string
    nome: string
    whatsapp?: string
    codigoPais?: string
  } | null
  turmaId: string
  basePath: string
  onFechar: () => void
  onTransferirAluno?: (aluno: any) => void
  onCompartilharHistorico?: (historico: HistoricoAluno) => void
}

export const ModalHistoricoAluno: React.FC<HistoricoAlunoModalProps> = ({
  visible,
  aluno,
  turmaId,
  basePath,
  onFechar,
  onTransferirAluno,
  onCompartilharHistorico
}) => {
  const [historico, setHistorico] = useState<HistoricoAluno | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedPalestras, setExpandedPalestras] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (visible && aluno) {
      carregarHistorico()
    }
  }, [visible, aluno])

  const carregarHistorico = async () => {
    if (!aluno) return

    try {
      setLoading(true)
      // Usar o basePath recebido como prop
      const historicoData = await HistoricoService.buscarHistorico(basePath, turmaId, aluno.id)
      setHistorico(historicoData)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePalestraExpansion = (palestraId: string) => {
    const newExpanded = new Set(expandedPalestras)
    if (newExpanded.has(palestraId)) {
      newExpanded.delete(palestraId)
    } else {
      newExpanded.add(palestraId)
    }
    setExpandedPalestras(newExpanded)
  }

  const handleCompartilharWhatsApp = async () => {
    if (!historico || !aluno?.whatsapp) {
      alert('Dados insuficientes para compartilhar.')
      return
    }

    try {
      const mensagemHistorico = HistoricoService.formatarHistoricoParaWhatsApp(historico)
      const saudacao = getGreeting(aluno.nome)
      
      const mensagemCompleta = `${saudacao}\n\n${mensagemHistorico}`
      
      const numeroFormatado = aluno.whatsapp.replace(/\D/g, '')
      const codigoPaisFormatado = aluno.codigoPais?.replace(/\D/g, '') || '55'
      const numeroCompleto = `${codigoPaisFormatado}${numeroFormatado}`

      const url = `https://web.whatsapp.com/send?phone=${numeroCompleto}&text=${encodeURIComponent(mensagemCompleta)}`
      window.open(url, '_blank')
      
      if (onCompartilharHistorico) {
        onCompartilharHistorico(historico)
      }
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error)
      alert('Não foi possível abrir o WhatsApp.')
    }
  }

  const handleTransferirAluno = () => {
    if (!aluno || !onTransferirAluno) return
    
    if (confirm(`Deseja transferir ${aluno.nome} para outra turma?`)) {
      onTransferirAluno(aluno)
    }
  }

  const renderEstatisticas = () => {
    if (!historico) return null

    const { estatisticas = historico.estatisticas } = historico

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estatísticas Gerais</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.totalPalestras}</div>
            <div className="text-sm text-gray-600">Total de Palestras</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.totalPresencas}</div>
            <div className="text-sm text-gray-600">Presenças</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.totalFaltas}</div>
            <div className="text-sm text-gray-600">Faltas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{estatisticas.totalReposicoes}</div>
            <div className="text-sm text-gray-600">Reposições</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{estatisticas.totalAtrasos}</div>
            <div className="text-sm text-gray-600">Atrasos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{estatisticas.percentualPresenca}%</div>
            <div className="text-sm text-gray-600">Presença</div>
          </div>
        </div>
      </div>
    )
  }

  const renderRegistros = () => {
    if (!historico) return null

    // Agrupar registros por palestra
    const registrosPorPalestra = historico.registros.reduce((acc, registro) => {
      if (!acc[registro.palestraId]) {
        acc[registro.palestraId] = {
          titulo: registro.palestraTitulo,
          registros: []
        }
      }
      acc[registro.palestraId].registros.push(registro)
      return acc
    }, {} as Record<string, { titulo: string; registros: any[] }>)

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Detalhamento por Lição</h3>
        {Object.entries(registrosPorPalestra)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([palestraId, { titulo, registros }]) => (
            <div key={palestraId} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => togglePalestraExpansion(palestraId)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Lição {palestraId}: {titulo}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {registros.length} registro(s)
                    </p>
                  </div>
                  <div className="text-gray-400">
                    {expandedPalestras.has(palestraId) ? '▼' : '▶'}
                  </div>
                </div>
              </button>
              
              {expandedPalestras.has(palestraId) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {registros.map((registro, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {registro.status === 'presente' ? '✅' : '❌'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {registro.status === 'presente' ? 'Presente' : 'Ausente'}
                          </span>
                          {registro.data && (
                            <span className="text-sm text-gray-600 ml-2">
                              - {new Date(registro.data).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {registro.reposicao && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            📅 Reposição
                          </span>
                        )}
                        {registro.atraso && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            ⏰ Atraso
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    )
  }

  if (!visible || !aluno) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Histórico do Aluno</h2>
              <p className="text-gray-600 mt-1">{aluno.nome}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCompartilharWhatsApp}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📱 Compartilhar
              </button>
              <button
                onClick={onFechar}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : historico ? (
            <div>
              {renderEstatisticas()}
              {renderRegistros()}
              
              {/* Botões de Ação */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleTransferirAluno}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  🔄 Transferir Aluno
                </button>
                <button
                  onClick={onFechar}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Erro ao carregar histórico</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
