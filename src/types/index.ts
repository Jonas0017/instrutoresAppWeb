// Tipos para o sistema de histórico do aluno

export interface RegistroPresenca {
  alunoId: string
  palestraId: string
  palestraTitulo: string
  status: 'presente' | 'ausente' | 'desativado'
  data: string
  instrutor?: string
  reposicao?: boolean
  atraso?: boolean
  dataRegistro?: string
}

export interface HistoricoAluno {
  nome: string
  estatisticas: EstatisticasPresenca
  registros: RegistroPresenca[]
  turmaResponsavel: string
  dataUltimaAtualizacao: string
}

export interface EstatisticasPresenca {
  totalPalestras: number
  totalPresencas: number
  totalFaltas: number
  totalReposicoes: number
  totalAtrasos: number
  percentualPresenca: number
}

export interface TurmaDisponivel {
  id: string
  responsavel: string
  dataAbertura: string
  local: string
  dias: string
  horario: string
  tema: string
  obs?: string
  totalAlunos?: number
}

export interface AlunoComFaltas {
  id: string
  nome: string
  whatsapp?: string
  codigoPais?: string
  faltas: RegistroPresenca[]
  totalFaltas: number
}

export interface ReposicaoAgendada {
  id: string
  alunoId: string
  alunoNome: string
  palestraOriginalId: string
  palestraOriginalTitulo: string
  fragmentoNumero: number
  dataAgendada: string
  instrutor: string
  whatsappEnviado: boolean
  dataEnvioWhatsApp?: string
  observacoes?: string
  status: 'pendente' | 'confirmada' | 'realizada' | 'cancelada'
  dataCriacao: string
  dataAtualizacao: string
}

