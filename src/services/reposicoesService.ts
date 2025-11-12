import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    db as firestore
} from '../lib/firebase'
import { AlunoComFaltas, ReposicaoAgendada, RegistroPresenca } from '../types'

interface PalestraRealizada {
    titulo: string
    data: string
}

export class ReposicoesService {
    /**
     * Busca alunos com faltas de uma turma
     */
    static async buscarAlunosComFaltas(
        basePath: string,
        turmaId: string
    ): Promise<AlunoComFaltas[]> {
        try {
            // Buscar todos os alunos da turma
            const alunosCollection = collection(firestore, `${basePath}/turmas/${turmaId}/alunos`)
            const alunosSnapshot = await getDocs(alunosCollection)

            const alunosComFaltas: AlunoComFaltas[] = []

            // Buscar todas as palestras da turma
            const palestrasCollection = collection(firestore, `${basePath}/turmas/${turmaId}/palestras`)
            const palestrasSnapshot = await getDocs(palestrasCollection)

            // Primeiro, identificar quais palestras já foram dadas
            const palestrasRealizadas: Record<string, PalestraRealizada> = {}

            for (const palestraDoc of palestrasSnapshot.docs) {
                const palestraId = palestraDoc.id
                const palestraData = palestraDoc.data()
                const palestraTitulo = palestraData.nome?.pt || `Palestra ${palestraId}`

                // Buscar registros de presença desta palestra
                const presencaCollection = collection(
                    firestore,
                    `${basePath}/turmas/${turmaId}/palestras/${palestraId}/presenca`
                )
                const presencaSnapshot = await getDocs(presencaCollection)

                if (presencaSnapshot.empty) {
                    // Não há registros de presença, aula não foi dada
                    continue
                }

                // Verificar se pelo menos um registro tem o campo 'data' preenchido
                let aulaRealizada = false
                let dataAula = palestraData.data || ''

                for (const presencaDoc of presencaSnapshot.docs) {
                    const presencaData = presencaDoc.data()
                    if (presencaData.data && presencaData.data.trim() !== '') {
                        aulaRealizada = true
                        dataAula = presencaData.data
                        break
                    }
                }

                // Se a aula foi realizada, adicionar ao objeto
                if (aulaRealizada) {
                    palestrasRealizadas[palestraId] = {
                        titulo: palestraTitulo,
                        data: dataAula
                    }
                }
            }

            // Agora processar cada aluno
            for (const alunoDoc of alunosSnapshot.docs) {
                const alunoData = alunoDoc.data()
                const alunoId = alunoDoc.id

                const faltas: RegistroPresenca[] = []

                // Para cada palestra realizada, verificar se o aluno tem falta
                // Para cada palestra realizada, verificar se o aluno tem falta
                const palestraIds = Object.keys(palestrasRealizadas)

                for (const palestraId of palestraIds) {
                    const palestraInfo = palestrasRealizadas[palestraId]

                    // Verificação de segurança
                    if (!palestraInfo) {
                        continue
                    }

                    // Buscar presença do aluno nesta palestra
                    const presencaDoc = await getDoc(
                        doc(firestore, `${basePath}/turmas/${turmaId}/palestras/${palestraId}/presenca/${alunoId}`)
                    )

                    let temFalta = false
                    let presencaData: any = {}

                    if (presencaDoc.exists()) {
                        presencaData = presencaDoc.data()
                        // Se o status é 'ausente', é falta
                        if (presencaData.status === 'ausente') {
                            temFalta = true
                        }
                    } else {
                        // Aluno não tem registro = ausente (falta)
                        temFalta = true
                    }

                    if (temFalta) {
                        const falta: RegistroPresenca = {
                            alunoId,
                            palestraId,
                            palestraTitulo: palestraInfo.titulo,
                            status: 'ausente',
                            data: presencaData.data || palestraInfo.data,
                            instrutor: presencaData.instrutor || '',
                            reposicao: false,
                            atraso: false,
                            dataRegistro: presencaData.dataRegistro || ''
                        }
                        faltas.push(falta)
                    }
                }

                // Se o aluno tem faltas, adicionar à lista
                if (faltas.length > 0) {
                    const alunoComFaltas: AlunoComFaltas = {
                        id: alunoId,
                        nome: alunoData.nome,
                        whatsapp: alunoData.whatsapp,
                        codigoPais: alunoData.codigoPais,
                        faltas,
                        totalFaltas: faltas.length
                    }
                    alunosComFaltas.push(alunoComFaltas)
                }
            }

            // Ordenar por total de faltas (maior para menor)
            return alunosComFaltas.sort((a, b) => b.totalFaltas - a.totalFaltas)
        } catch (error) {
            console.error('Erro ao buscar alunos com faltas:', error)
            throw error
        }
    }

    /**
     * Busca reposições agendadas de uma turma
     */
    static async buscarReposicoesAgendadas(
        basePath: string,
        turmaId: string
    ): Promise<ReposicaoAgendada[]> {
        try {
            const reposicoesCollection = collection(firestore, `${basePath}/turmas/${turmaId}/reposicoes`)
            const reposicoesSnapshot = await getDocs(reposicoesCollection)

            const reposicoes: ReposicaoAgendada[] = []

            for (const reposicaoDoc of reposicoesSnapshot.docs) {
                const reposicaoData = reposicaoDoc.data()
                const reposicao: ReposicaoAgendada = {
                    id: reposicaoDoc.id,
                    alunoId: reposicaoData.alunoId,
                    alunoNome: reposicaoData.alunoNome,
                    palestraOriginalId: reposicaoData.palestraOriginalId,
                    palestraOriginalTitulo: reposicaoData.palestraOriginalTitulo,
                    fragmentoNumero: reposicaoData.fragmentoNumero || 1,
                    dataAgendada: reposicaoData.dataAgendada,
                    instrutor: reposicaoData.instrutor,
                    whatsappEnviado: reposicaoData.whatsappEnviado || false,
                    dataEnvioWhatsApp: reposicaoData.dataEnvioWhatsApp,
                    observacoes: reposicaoData.observacoes,
                    status: reposicaoData.status || 'pendente',
                    dataCriacao: reposicaoData.dataCriacao,
                    dataAtualizacao: reposicaoData.dataAtualizacao
                }
                reposicoes.push(reposicao)
            }

            return reposicoes.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
        } catch (error) {
            console.error('Erro ao buscar reposições agendadas:', error)
            throw error
        }
    }

    /**
     * Agenda uma reposição
     */
    static async agendarReposicao(
        basePath: string,
        turmaId: string,
        reposicao: Omit<ReposicaoAgendada, 'id' | 'dataCriacao' | 'dataAtualizacao'>
    ): Promise<string> {
        try {
            const reposicoesCollection = collection(firestore, `${basePath}/turmas/${turmaId}/reposicoes`)

            const novaReposicao = {
                ...reposicao,
                dataCriacao: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
            }

            const docRef = await addDoc(reposicoesCollection, novaReposicao)
            return docRef.id
        } catch (error) {
            console.error('Erro ao agendar reposição:', error)
            throw error
        }
    }

    /**
     * Atualiza uma reposição
     */
    static async atualizarReposicao(
        basePath: string,
        turmaId: string,
        reposicaoId: string,
        dados: Partial<ReposicaoAgendada>
    ): Promise<void> {
        try {
            const reposicaoRef = doc(firestore, `${basePath}/turmas/${turmaId}/reposicoes/${reposicaoId}`)
            await updateDoc(reposicaoRef, {
                ...dados,
                dataAtualizacao: new Date().toISOString()
            })
        } catch (error) {
            console.error('Erro ao atualizar reposição:', error)
            throw error
        }
    }

    /**
     * Remove uma reposição
     */
    static async removerReposicao(
        basePath: string,
        turmaId: string,
        reposicaoId: string
    ): Promise<void> {
        try {
            const reposicaoRef = doc(firestore, `${basePath}/turmas/${turmaId}/reposicoes/${reposicaoId}`)
            await deleteDoc(reposicaoRef)
        } catch (error) {
            console.error('Erro ao remover reposição:', error)
            throw error
        }
    }

    /**
     * Envia notificação de reposição via WhatsApp
     */
    static async enviarNotificacaoWhatsApp(
        reposicao: ReposicaoAgendada,
        whatsapp: string,
        codigoPais?: string
    ): Promise<void> {
        try {
            const numeroFormatado = whatsapp.replace(/\D/g, '')
            const codigoPaisFormatado = codigoPais?.replace(/\D/g, '') || '55'
            const numeroCompleto = `+${codigoPaisFormatado}${numeroFormatado}`

            const mensagem = `📅 *REPOSIÇÃO AGENDADA*\n\n` +
                `Olá ${reposicao.alunoNome}!\n\n` +
                `Sua reposição foi agendada para:\n` +
                `📚 *Aula:* ${reposicao.palestraOriginalTitulo}\n` +
                `📅 *Data:* ${new Date(reposicao.dataAgendada).toLocaleDateString('pt-BR')}\n` +
                `👨‍🏫 *Instrutor:* ${reposicao.instrutor}\n\n` +
                `${reposicao.observacoes ? `📝 *Observações:* ${reposicao.observacoes}\n\n` : ''}` +
                `Aguardamos você na reposição! 🙏`

            const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`
            window.open(url, '_blank')
        } catch (error) {
            console.error('Erro ao enviar notificação WhatsApp:', error)
            throw error
        }
    }
}