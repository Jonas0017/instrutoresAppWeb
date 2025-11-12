import { useState, useCallback } from 'react'
import { HistoricoService } from '../services/historicoService'
import { HistoricoAluno, TurmaDisponivel } from '../types'

export const useHistoricoAluno = () => {
  const [historico, setHistorico] = useState<HistoricoAluno | null>(null)
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<TurmaDisponivel[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTransferencia, setLoadingTransferencia] = useState(false)

  /**
   * Busca histórico de um aluno
   */
  const buscarHistorico = useCallback(async (
    basePath: string,
    turmaId: string,
    alunoId: string
  ) => {
    try {
      setLoading(true)
      const historicoData = await HistoricoService.buscarHistorico(basePath, turmaId, alunoId)
      setHistorico(historicoData)
      return historicoData
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca turmas disponíveis para transferência
   */
  const buscarTurmasDisponiveis = useCallback(async (
    basePath: string,
    turmaAtualId: string
  ) => {
    try {
      setLoading(true)
      const turmas = await HistoricoService.buscarTurmasDisponiveis(basePath, turmaAtualId)
      setTurmasDisponiveis(turmas)
      return turmas
    } catch (error) {
      console.error('Erro ao buscar turmas disponíveis:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Transfere um aluno para outra turma
   */
  const transferirAluno = useCallback(async (
    basePath: string,
    alunoId: string,
    turmaOrigemId: string,
    turmaDestinoId: string
  ) => {
    try {
      setLoadingTransferencia(true)
      await HistoricoService.transferirAluno(basePath, alunoId, turmaOrigemId, turmaDestinoId)
      return true
    } catch (error) {
      console.error('Erro ao transferir aluno:', error)
      throw error
    } finally {
      setLoadingTransferencia(false)
    }
  }, [])

  /**
   * Compartilha histórico via WhatsApp
   */
  const compartilharHistoricoWhatsApp = useCallback(async (
    historico: HistoricoAluno,
    whatsapp?: string,
    codigoPais?: string
  ) => {
    try {
      if (!whatsapp) {
        alert('Número de WhatsApp não disponível.')
        return false
      }

      const mensagemHistorico = HistoricoService.formatarHistoricoParaWhatsApp(historico)
      const saudacao = `Olá, ${historico.nome}! Tudo bem?`
      
      const mensagemCompleta = `${saudacao}\n\n${mensagemHistorico}`
      
      const numeroFormatado = whatsapp.replace(/\D/g, '')
      const codigoPaisFormatado = codigoPais?.replace(/\D/g, '') || '55'
      const numeroCompleto = `+${codigoPaisFormatado}${numeroFormatado}`
      
      const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagemCompleta)}`
      window.open(url, '_blank')
      return true
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error)
      alert('Não foi possível abrir o WhatsApp.')
      return false
    }
  }, [])

  /**
   * Limpa os dados do hook
   */
  const limparDados = useCallback(() => {
    setHistorico(null)
    setTurmasDisponiveis([])
  }, [])

  return {
    // Estados
    historico,
    turmasDisponiveis,
    loading,
    loadingTransferencia,
    
    // Funções
    buscarHistorico,
    buscarTurmasDisponiveis,
    transferirAluno,
    compartilharHistoricoWhatsApp,
    limparDados,
    
    // Setters (para uso direto se necessário)
    setHistorico,
    setTurmasDisponiveis
  }
}
