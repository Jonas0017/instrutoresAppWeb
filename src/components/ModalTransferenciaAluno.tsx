import React, { useState, useEffect } from 'react'
import { TurmaDisponivel } from '../types'

interface TransferenciaAlunoModalProps {
  visible: boolean
  aluno: {
    id: string
    nome: string
  } | null
  turmaAtual: string
  turmasDisponiveis: TurmaDisponivel[]
  onFechar: () => void
  onConfirmar: (alunoId: string, turmaDestinoId: string) => void
  loading?: boolean
}

export const ModalTransferenciaAluno: React.FC<TransferenciaAlunoModalProps> = ({
  visible,
  aluno,
  turmaAtual,
  turmasDisponiveis,
  onFechar,
  onConfirmar,
  loading = false
}) => {
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('')
  const [filtroInstrutor, setFiltroInstrutor] = useState<string>('')
  const [filtroAno, setFiltroAno] = useState<string>('')

  useEffect(() => {
    if (visible) {
      setTurmaSelecionada('')
      setFiltroInstrutor('')
      setFiltroAno('')
    }
  }, [visible])

  const turmasFiltradas = turmasDisponiveis.filter(turma => {
    const matchInstrutor = !filtroInstrutor || 
      turma.responsavel.toLowerCase().includes(filtroInstrutor.toLowerCase())
    
    const anoTurma = turma.dataAbertura?.split('-')[0]
    const matchAno = !filtroAno || anoTurma === filtroAno
    
    return matchInstrutor && matchAno
  })

  const handleConfirmarTransferencia = () => {
    if (!turmaSelecionada || !aluno) {
      alert('Selecione uma turma de destino e verifique se o aluno está selecionado.')
      return
    }

    if (!aluno.id) {
      alert('ID do aluno não encontrado. Tente novamente.')
      return
    }

    const turmaDestino = turmasFiltradas.find(t => t.id === turmaSelecionada)
    if (!turmaDestino) return

    if (confirm(
      `Confirmar Transferência\n\n` +
      `Aluno: ${aluno.nome}\n` +
      `Turma de Destino: ${turmaDestino.tema}\n` +
      `Instrutor: ${turmaDestino.responsavel}\n\n` +
      `Esta ação transferirá o aluno mantendo todo o histórico de presença.`
    )) {
      onConfirmar(aluno.id, turmaSelecionada)
    }
  }

  if (!visible || !aluno) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Transferir Aluno</h2>
              <p className="text-gray-600 mt-1">{aluno.nome}</p>
            </div>
            <button
              onClick={onFechar}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrutor
                </label>
                <input
                  type="text"
                  value={filtroInstrutor}
                  onChange={(e) => setFiltroInstrutor(e.target.value)}
                  placeholder="Digite o nome do instrutor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <input
                  type="text"
                  value={filtroAno}
                  onChange={(e) => setFiltroAno(e.target.value)}
                  placeholder="Ex: 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de Turmas */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-700">Turmas Disponíveis</h3>
            {turmasFiltradas.length > 0 ? (
              turmasFiltradas.map((turma) => (
                <div
                  key={turma.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    turmaSelecionada === turma.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setTurmaSelecionada(turma.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{turma.tema}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <p><strong>Instrutor:</strong> {turma.responsavel}</p>
                        <p><strong>Local:</strong> {turma.local}</p>
                        <p><strong>Horário:</strong> {turma.horario} - {turma.dias}</p>
                        <p><strong>Data de Abertura:</strong> {new Date(turma.dataAbertura).toLocaleDateString('pt-BR')}</p>
                        {turma.totalAlunos !== undefined && (
                          <p><strong>Alunos:</strong> {turma.totalAlunos}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="radio"
                        checked={turmaSelecionada === turma.id}
                        onChange={() => setTurmaSelecionada(turma.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma turma encontrada com os filtros aplicados</p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onFechar}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarTransferencia}
              disabled={!turmaSelecionada || loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Transferindo...' : 'Confirmar Transferência'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
