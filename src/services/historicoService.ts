import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch,
  db as firestore 
} from '../lib/firebase'
import { HistoricoAluno, RegistroPresenca, EstatisticasPresenca, TurmaDisponivel } from '../types'

export class HistoricoService {
  /**
   * Mapeamento de IDs para títulos das palestras (fallback)
   */
  private static palestraTitulos: { [key: string]: string } = {
    '01': 'Lição 1: O que é Gnosis',
    '02': 'Lição 2: Personalidade, Essência e Ego',
    '03': 'Lição 3: Despertar da Consciência',
    '04': 'Lição 4: O Eu Psicológico',
    '05': 'Lição 5: Luz, Calor e Som',
    '06': 'Lição 6: A Máquina Humana',
    '07': 'Lição 7: O Mundo das Relações',
    '08': 'Lição 8: O Caminho e a Vida',
    '09': 'Lição 9: O Nível de Ser',
    '10': 'Lição 10: O Decálogo',
    '11': 'Lição 11: Educação Fundamental',
    '12': 'Lição 12: A Árvore Genealógica das Religiões',
    '13': 'Lição 13: Evolução, Involução e Revolução',
    '14': 'Lição 14: O Raio da Morte',
    '15': 'Lição 15: Reencarnação, Retorno e Recorrência',
    '16': 'Lição 16: A Balança da Justiça',
    '17': 'Lição 17: Os 4 Caminhos',
    '18': 'Lição 18: Diagrama Interno do Homem',
    '19': 'Lição 19: A Transformação da Energia',
    '20': 'Lição 20: Os Elementais',
    '21': 'Lição 21: Os 4 Estados de Consciência',
    '22': 'Lição 22: A Iniciação',
    '23': 'Lição 23: A Santa Igreja Gnóstica'
  }

  /**
   * Busca o histórico completo de um aluno
   */
  static async buscarHistorico(
    basePath: string,
    turmaId: string,
    alunoId: string
  ): Promise<HistoricoAluno | null> {
    try {
      // Buscar dados do aluno
      const alunoDoc = await getDoc(doc(firestore, `${basePath}/alunos/${alunoId}`))
      if (!alunoDoc.exists()) {
        throw new Error('Aluno não encontrado')
      }

      const alunoData = alunoDoc.data()
      const nome = alunoData.nome

      // Buscar todas as palestras da turma
      const palestrasCollection = collection(firestore, `${basePath}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)
      
      const registros: RegistroPresenca[] = []
      let totalPalestras = 0
      let totalPresencas = 0
      let totalFaltas = 0
      let totalReposicoes = 0
      let totalAtrasos = 0

      // Para cada palestra, buscar registros de presença
      for (const palestraDoc of palestrasSnapshot.docs) {
        const palestraId = palestraDoc.id
        const palestraData = palestraDoc.data()
        const palestraTitulo = palestraData.nome?.pt || this.palestraTitulos[palestraId] || `Palestra ${palestraId}`
        
        totalPalestras++

        // Buscar presença do aluno nesta palestra
        const presencaDoc = await getDoc(doc(firestore, `${basePath}/palestras/${palestraId}/presenca/${alunoId}`))
        
        if (presencaDoc.exists()) {
          const presencaData = presencaDoc.data()
          const status = presencaData.status || 'ausente'
          
          const registro: RegistroPresenca = {
            alunoId,
            palestraId,
            palestraTitulo,
            status,
            data: presencaData.data || '',
            instrutor: presencaData.instrutor || '',
            reposicao: presencaData.reposicao || false,
            atraso: presencaData.atraso || false,
            dataRegistro: presencaData.dataRegistro || ''
          }

          registros.push(registro)

          // Contar estatísticas
          if (status === 'presente') {
            totalPresencas++
            if (presencaData.reposicao) totalReposicoes++
            if (presencaData.atraso) totalAtrasos++
          } else {
            totalFaltas++
          }
        } else {
          // Aluno não tem registro nesta palestra (ausente)
          const registro: RegistroPresenca = {
            alunoId,
            palestraId,
            palestraTitulo,
            status: 'ausente',
            data: '',
            instrutor: '',
            reposicao: false,
            atraso: false,
            dataRegistro: ''
          }
          registros.push(registro)
          totalFaltas++
        }
      }

      // Calcular percentual de presença
      const percentualPresenca = totalPalestras > 0 ? Math.round((totalPresencas / totalPalestras) * 100) : 0

      const estatisticas: EstatisticasPresenca = {
        totalPalestras,
        totalPresencas,
        totalFaltas,
        totalReposicoes,
        totalAtrasos,
        percentualPresenca
      }

      // Buscar dados da turma para obter o responsável
      const turmaDoc = await getDoc(doc(firestore, `${basePath}`))
      const turmaData = turmaDoc.data()
      const turmaResponsavel = turmaData?.responsavel || 'Instrutor não identificado'

      const historico: HistoricoAluno = {
        nome,
        estatisticas,
        registros,
        turmaResponsavel,
        dataUltimaAtualizacao: new Date().toISOString()
      }

      return historico
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      throw error
    }
  }

  /**
   * Busca turmas disponíveis para transferência
   */
  static async buscarTurmasDisponiveis(
    basePath: string,
    turmaAtualId: string
  ): Promise<TurmaDisponivel[]> {
    try {
      const turmasCollection = collection(firestore, `${basePath}/turmas`)
      const turmasSnapshot = await getDocs(turmasCollection)
      
      const turmas: TurmaDisponivel[] = []
      
      for (const turmaDoc of turmasSnapshot.docs) {
        if (turmaDoc.id === turmaAtualId) continue // Pular turma atual
        
        const turmaData = turmaDoc.data()
        
        // Contar alunos da turma
        const alunosCollection = collection(firestore, `${basePath}/turmas/${turmaDoc.id}/alunos`)
        const alunosSnapshot = await getDocs(alunosCollection)
        
        const turma: TurmaDisponivel = {
          id: turmaDoc.id,
          responsavel: turmaData.responsavel || '',
          dataAbertura: turmaData.dataAbertura || '',
          local: turmaData.local || '',
          dias: turmaData.dias || '',
          horario: turmaData.horario || '',
          tema: turmaData.tema || '',
          obs: turmaData.obs || '',
          totalAlunos: alunosSnapshot.size
        }
        
        turmas.push(turma)
      }
      
      return turmas.sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura))
    } catch (error) {
      console.error('Erro ao buscar turmas disponíveis:', error)
      throw error
    }
  }

  /**
   * Transfere um aluno para outra turma mantendo todo o histórico de presença
   */
  static async transferirAluno(
    basePath: string,
    alunoId: string,
    turmaOrigemId: string,
    turmaDestinoId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(firestore)

      // 1. Buscar dados do aluno na turma origem
      const alunoOrigemDoc = await getDoc(doc(firestore, `${basePath}/turmas/${turmaOrigemId}/alunos/${alunoId}`))
      if (!alunoOrigemDoc.exists()) {
        throw new Error(`Aluno ${alunoId} não encontrado na turma ${turmaOrigemId}`)
      }

      const dadosAluno = alunoOrigemDoc.data()

      // 2. Criar aluno na turma destino
      const alunoDestinoRef = doc(firestore, `${basePath}/turmas/${turmaDestinoId}/alunos/${alunoId}`)
      batch.set(alunoDestinoRef, dadosAluno)

      // 3. Buscar todas as palestras da turma origem
      const palestrasCollection = collection(firestore, `${basePath}/turmas/${turmaOrigemId}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)

      // 4. Para cada palestra, copiar registros de presença
      for (const palestraDoc of palestrasSnapshot.docs) {
        const palestraId = palestraDoc.id
        
        // Buscar presença na origem
        const presencaOrigemDoc = await getDoc(doc(firestore, `${basePath}/turmas/${turmaOrigemId}/palestras/${palestraId}/presenca/${alunoId}`))
        
        if (presencaOrigemDoc.exists()) {
          const presencaData = presencaOrigemDoc.data()
          
          // Criar presença na turma destino
          const presencaDestinoRef = doc(firestore, `${basePath}/turmas/${turmaDestinoId}/palestras/${palestraId}/presenca/${alunoId}`)
          batch.set(presencaDestinoRef, presencaData)
        }
      }

      // 5. Remover aluno da turma origem
      batch.delete(doc(firestore, `${basePath}/turmas/${turmaOrigemId}/alunos/${alunoId}`))
      
      // Remover registros de presença da origem
      for (const palestraDoc of palestrasSnapshot.docs) {
        const presencaRef = doc(firestore, `${basePath}/turmas/${turmaOrigemId}/palestras/${palestraDoc.id}/presenca/${alunoId}`)
        batch.delete(presencaRef)
      }

      // Executar todas as operações
      await batch.commit()
    } catch (error) {
      console.error('Erro ao transferir aluno:', error)
      throw error
    }
  }

  /**
   * Formata histórico para compartilhamento via WhatsApp
   */
  static formatarHistoricoParaWhatsApp(historico: HistoricoAluno): string {
    const { nome, estatisticas, registros, turmaResponsavel } = historico
    
    let mensagem = `📚 *HISTÓRICO 1ª CÂMARA*\n\n`
    mensagem += `👤 *Aluno:* ${nome}\n`
    mensagem += `👨‍🏫 *Instrutor:* ${turmaResponsavel}\n`
    mensagem += `📅 *Data do Relatório:* ${new Date().toLocaleDateString('pt-BR')}\n\n`
    
    mensagem += `📊 *ESTATÍSTICAS GERAIS*\n`
    mensagem += `• Total de Palestras: ${estatisticas.totalPalestras}\n`
    mensagem += `• Presenças: ${estatisticas.totalPresencas}\n`
    mensagem += `• Faltas: ${estatisticas.totalFaltas}\n`
    mensagem += `• Reposições: ${estatisticas.totalReposicoes}\n`
    mensagem += `• Atrasos: ${estatisticas.totalAtrasos}\n`
    mensagem += `• Percentual de Presença: ${estatisticas.percentualPresenca}%\n\n`

    // Agrupar registros por palestra
    const registrosPorPalestra = registros.reduce((acc, registro) => {
      if (!acc[registro.palestraId]) {
        acc[registro.palestraId] = {
          titulo: registro.palestraTitulo,
          registros: []
        }
      }
      acc[registro.palestraId].registros.push(registro)
      return acc
    }, {} as Record<string, { titulo: string; registros: RegistroPresenca[] }>)

    mensagem += `📋 *DETALHAMENTO POR LIÇÃO*\n\n`

    Object.entries(registrosPorPalestra)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([palestraId, { titulo, registros }]) => {
        mensagem += `*Lição ${palestraId}: ${titulo}*\n`
        registros.forEach(registro => {
          const status = registro.status === 'presente' ? '✅' : '❌'
          const extras = []
          if (registro.reposicao) extras.push('📅 Reposição')
          if (registro.atraso) extras.push('⏰ Atraso')
          
          mensagem += `${status} ${registro.status === 'presente' ? 'Presente' : 'Ausente'}`
          if (extras.length > 0) {
            mensagem += ` (${extras.join(', ')})`
          }
          if (registro.data) {
            mensagem += ` - ${new Date(registro.data).toLocaleDateString('pt-BR')}`
          }
          mensagem += '\n'
        })
        mensagem += '\n'
      })

    return mensagem
  }
}
