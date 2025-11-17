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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Minhas Turmas
              </h1>
              <p className="mt-1 text-sm text-gray-600">Gerencie todas as suas turmas em um só lugar</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.lumisial}, {user?.estado}</p>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  value={instrutorSelecionado || ''}
                  onChange={(e) => setInstrutorSelecionado(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                <select
                  value={anoSelecionado || ''}
                  onChange={(e) => setAnoSelecionado(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        </div>

        {/* Lista de Turmas - Grid Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(instrutorSelecionado && anoSelecionado
            ? turmasPorAno[instrutorSelecionado]?.[anoSelecionado] || []
            : instrutorSelecionado
              ? Object.values(turmasPorAno[instrutorSelecionado] || {}).flat()
              : turmas
          ).map((turma) => (
            <div
              key={turma.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Header do Card */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
                <h3 className="text-lg font-bold text-white line-clamp-1">
                  {turma.tema}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  {turma.responsavel}
                </p>
              </div>

              {/* Conteúdo do Card */}
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{turma.local}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{turma.horario} • {turma.dias}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">
                      Aberta em {new Date(turma.dataAbertura).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {turma.obs && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic line-clamp-2">{turma.obs}</p>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/controle-presenca/${turma.id}`)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2.5 px-3 rounded-lg transition-all text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Presença
                  </button>

                  <button
                    onClick={() => navigate(`/visao-geral/${turma.id}`)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Visão Geral
                  </button>

                  <button
                    onClick={() => navigate(`/inserir-turma/${turma.id}`)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>

                  <button
                    onClick={() => removerTurma(turma.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado Vazio */}
        {turmas.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma turma encontrada</h3>
            <p className="text-gray-500 text-sm mb-6">Comece criando sua primeira turma</p>
            <button
              onClick={() => navigate('/inserir-turma')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar primeira turma
            </button>
          </div>
        )}
      </div>

      {/* FAB - Floating Action Button */}
      {turmas.length > 0 && (
        <button
          onClick={() => navigate('/inserir-turma')}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 group z-50"
          title="Adicionar nova turma"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Adicionar Turma
          </span>
        </button>
      )}
    </div>
  )
}

export default ConsultarTurmas 