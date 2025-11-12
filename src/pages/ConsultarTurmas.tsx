import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, deleteDoc, db as firestore } from '@/lib/firebase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import Card from '../components/Card'
import Navigation from '../components/Navigation'

interface Turma {
  id: string
  responsavel: string
  dataAbertura: string
  local: string
  dias: string
  horario: string
  tema: string
  obs?: string
}

interface Palestra {
  id: string
  titulo: string
  data: string
}

const ConsultarTurmas = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [instrutores, setInstrutores] = useState<string[]>([])
  const [anosPorInstrutor, setAnosPorInstrutor] = useState<{ [k: string]: string[] }>({})
  const [turmasPorAno, setTurmasPorAno] = useState<{ [k: string]: { [y: string]: Turma[] } }>({})
  const [pais, setPais] = useState<string | null>(null)
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<string | null>(null)
  const [anoSelecionado, setAnoSelecionado] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  

  // Função para obter o caminho base do Firestore
  const getBasePath = () => {
    if (!user) return ""
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
  }


  // Busca turmas e organiza dados
  const fetchTurmas = async () => {
    if (!user) return

    try {
      setLoading(true)
      setPais(user.pais)
      
      const path = `${getBasePath()}/turmas`
      const snap = await getDocs(collection(firestore, path))
      const data = snap.docs.map(d => {
        const obj = d.data() as Turma
        return { ...obj, id: d.id }
      })

      setTurmas(data)
      const instrSet = new Set<string>()
      const anosMap: { [k: string]: Set<string> } = {}
      const turmasMap: { [k: string]: { [y: string]: Turma[] } } = {}
      
             data.forEach(t => {
         if (t.responsavel) {
           instrSet.add(t.responsavel)
           const ano = t.dataAbertura?.split('-')[0] ?? 'Desconhecido'
           anosMap[t.responsavel] = anosMap[t.responsavel] ?? new Set()
           anosMap[t.responsavel]!.add(ano)
           turmasMap[t.responsavel] = turmasMap[t.responsavel] ?? {}
           turmasMap[t.responsavel]![ano] = turmasMap[t.responsavel]![ano] ?? []
           turmasMap[t.responsavel]![ano]!.push(t)
         }
       })
      
      setInstrutores(Array.from(instrSet))
      setAnosPorInstrutor(Object.fromEntries(
        Object.entries(anosMap).map(([k, v]) => [k, Array.from(v)])
      ))
      setTurmasPorAno(turmasMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTurmas()
    }
  }, [user])

  // Função para deletar turma COMPLETAMENTE
  const removerTurma = async (id: string) => {
    if (!user) return
    
    if (!confirm("Tem certeza que deseja remover esta turma completamente?\n\nEsta ação é IRREVERSÍVEL e removerá todos os dados da turma!")) {
      return
    }

    try {
      setLoading(true)
      const basePath = getBasePath()
      const turmaPath = `${basePath}/turmas/${id}`

      // 1. Buscar todas as palestras da turma
      const palestrasCollection = collection(firestore, `${turmaPath}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)

      // 2. Para cada palestra, remover todas as presenças
      for (const palestraDoc of palestrasSnapshot.docs) {
        try {
          const presencaCollection = collection(firestore, `${turmaPath}/palestras/${palestraDoc.id}/presenca`)
          const presencaSnapshot = await getDocs(presencaCollection)

          // Remover cada presença individual
          for (const presencaDoc of presencaSnapshot.docs) {
            await deleteDoc(doc(firestore, `${turmaPath}/palestras/${palestraDoc.id}/presenca/${presencaDoc.id}`))
          }
        } catch (error) {
          console.log(`Erro ao remover presenças da palestra ${palestraDoc.id}:`, error)
        }

        // 3. Remover a palestra
        try {
          await deleteDoc(doc(firestore, `${turmaPath}/palestras/${palestraDoc.id}`))
        } catch (error) {
          console.log(`Erro ao remover palestra ${palestraDoc.id}:`, error)
        }
      }

      // 4. Buscar e remover todos os alunos
      try {
        const alunosCollection = collection(firestore, `${turmaPath}/alunos`)
        const alunosSnapshot = await getDocs(alunosCollection)

        for (const alunoDoc of alunosSnapshot.docs) {
          await deleteDoc(doc(firestore, `${turmaPath}/alunos/${alunoDoc.id}`))
        }
      } catch (error) {
        console.log("Erro ao remover alunos:", error)
      }

      // 5. Remover a turma
      await deleteDoc(doc(firestore, `${basePath}/turmas/${id}`))

      alert("Turma removida com sucesso!")
      await fetchTurmas() // Recarregar lista
    } catch (error) {
      console.error("Erro ao remover turma:", error)
      alert("Erro ao remover turma. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Consultar Turmas</h1>
              <p className="mt-2 text-gray-600">Gerencie e visualize todas as turmas</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.lumisial}, {user?.estado}</p>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Botão Adicionar Nova Turma */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/inserir-turma')}
            className="btn-primary"
          >
            Adicionar Turma
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrutor
              </label>
              <select
                value={instrutorSelecionado || ''}
                onChange={(e) => setInstrutorSelecionado(e.target.value || null)}
                className="input-field"
              >
                <option value="">Todos os instrutores</option>
                {instrutores.map(instrutor => (
                  <option key={instrutor} value={instrutor}>
                    {instrutor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={anoSelecionado || ''}
                onChange={(e) => setAnoSelecionado(e.target.value || null)}
                className="input-field"
                disabled={!instrutorSelecionado}
              >
                <option value="">Todos os anos</option>
                {instrutorSelecionado && anosPorInstrutor[instrutorSelecionado]?.map(ano => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Turmas */}
        <div className="grid gap-6">
          {(instrutorSelecionado && anoSelecionado 
            ? turmasPorAno[instrutorSelecionado]?.[anoSelecionado] || []
            : instrutorSelecionado 
              ? Object.values(turmasPorAno[instrutorSelecionado] || {}).flat()
              : turmas
          ).map((turma) => (
            <Card key={turma.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {turma.tema}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Responsável:</span> {turma.responsavel}
                    </div>
                    <div>
                      <span className="font-medium">Local:</span> {turma.local}
                    </div>
                    <div>
                      <span className="font-medium">Horário:</span> {turma.horario}
                    </div>
                    <div>
                      <span className="font-medium">Dias:</span> {turma.dias}
                    </div>
                    <div>
                      <span className="font-medium">Data de Abertura:</span> {
                        new Date(turma.dataAbertura).toLocaleDateString('pt-BR')
                      }
                    </div>
                  </div>

                  {turma.obs && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Observações:</span>
                      <p className="text-gray-600">{turma.obs}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/controle-presenca/${turma.id}`)}
                    className="btn-primary text-sm"
                  >
                    Presença
                  </button>
                  <button
                    onClick={() => navigate(`/visao-geral/${turma.id}`)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Visão Geral
                  </button>
                  <button
                    onClick={() => navigate(`/inserir-turma/${turma.id}`)}
                    className="btn-secondary text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removerTurma(turma.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {turmas.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma turma encontrada</p>
            <button
              onClick={() => navigate('/inserir-turma')}
              className="btn-primary mt-4"
            >
              Adicione uma nova turma
            </button>
          </div>
        )}
      </div>

    </div>
  )
}

export default ConsultarTurmas 