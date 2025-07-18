import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, db as firestore } from '@/lib/firebase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import FormField from '../components/FormField'
import Navigation from '../components/Navigation'

let novoId = "T001"

const weekDays = [
  { key: "dom", label: "Domingo" },
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
]

const InserirTurma = () => {
  const navigate = useNavigate()
  const { turmaId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const isEditing = !!turmaId

  // Estados do formulário - exatamente como no app móvel
  const [responsavel, setResponsavel] = useState("")
  const [local, setLocal] = useState("")
  const [tema, setTema] = useState("")
  const [obs, setObs] = useState("")
  const [selectedDias, setSelectedDias] = useState<string[]>([])
  const [dias, setDias] = useState("")
  const [horario, setHorario] = useState("")
  const [dataAbertura, setDataAbertura] = useState("")

  // Estados dos modais
  const [showDiasModal, setShowDiasModal] = useState(false)

  // Função para obter o caminho base do Firestore
  const getBasePath = () => {
    if (!user) return ""
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
  }

  // Carregar dados da turma se estiver editando
  const carregarDadosTurma = async () => {
    if (!turmaId || !user) return
    
    try {
      setLoading(true)
      const basePath = getBasePath()
      
      const turmaRef = doc(firestore, `${basePath}/turmas/${turmaId}`)
      const turmaSnapshot = await getDoc(turmaRef)

      if (turmaSnapshot.exists()) {
        const turmaData = turmaSnapshot.data()
        setResponsavel(turmaData.responsavel || "")
        setLocal(turmaData.local || "")
        setTema(turmaData.tema || "")
        setObs(turmaData.obs || "")
        setHorario(turmaData.horario || "")
        
        // Converter data ISO para formato DD-MM-YYYY
        if (turmaData.dataAbertura) {
          const [ano, mes, dia] = turmaData.dataAbertura.split("-")
          setDataAbertura(`${dia}-${mes}-${ano}`)
        }
        
        // Processar dias
        if (turmaData.dias) {
          const diasArray = turmaData.dias.split(" e ")
          setSelectedDias(diasArray)
          setDias(turmaData.dias)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da turma:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (turmaId) {
      carregarDadosTurma()
    }
  }, [turmaId, user])

  // Inicializar responsável com nome do usuário logado
  useEffect(() => {
    if (user && !responsavel && !isEditing) {
      setResponsavel(user.nome)
    }
  }, [user, responsavel, isEditing])

  // Inicializar data com data atual quando adicionando nova turma (formato DD-MM-YYYY)
  useEffect(() => {
    if (!dataAbertura && !isEditing) {
      const hoje = new Date()
      const dia = String(hoje.getDate()).padStart(2, '0')
      const mes = String(hoje.getMonth() + 1).padStart(2, '0')
      const ano = hoje.getFullYear()
      setDataAbertura(`${dia}-${mes}-${ano}`)
    }
  }, [dataAbertura, isEditing])

  // Inicializar horário padrão quando adicionando nova turma
  useEffect(() => {
    if (!horario && !isEditing) {
      setHorario("19:00")
    }
  }, [horario, isEditing])

  // Funções auxiliares
  const parseDateBR = (dateBR: string) => {
    const [d, m, y] = dateBR.split("-")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  const formatarDataParaISO = (dataBR: string) => {
    const [dia, mes, ano] = dataBR.split("-")
    return `${ano}-${mes}-${dia}`
  }

  const toggleDay = (day: string) => {
    setSelectedDias(prev =>
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  // Função principal para salvar turma - EXATAMENTE como no app móvel
  const salvarTurma = async () => {
    if (!responsavel.trim() || !dataAbertura.trim() || !local.trim() || !dias.trim() || !horario.trim()) {
      alert("Preencha todos os campos obrigatórios!")
      return
    }

    try {
      setLoading(true)
      const basePath = getBasePath()
      const caminhoFirestore = `${basePath}/turmas`

      if (isEditing) {
        // Atualizar turma
        const turmaDoc = doc(firestore, caminhoFirestore, turmaId!)
        await updateDoc(turmaDoc, {
        responsavel,
          dataAbertura: formatarDataParaISO(dataAbertura),
        local,
          dias,
        horario,
        tema,
        obs,
        })
      } else {
        // Verificar última turma e calcular próximo ID - EXATAMENTE como no app
        const turmasCollection = collection(firestore, caminhoFirestore)
        const querySnapshot = await getDocs(turmasCollection)

        if (!querySnapshot.empty) {
          // Obter IDs existentes e calcular próximo
          const ids = querySnapshot.docs.map((doc) => doc.id)
          const ultimoId = ids.sort().pop() // Obter o último ID
          if (ultimoId) {
            const numero = parseInt(ultimoId.replace("T", ""), 10) + 1
            novoId = `T${String(numero).padStart(3, "0")}` // Formatar com 3 dígitos
          }
        }

        // Inserir nova turma com ID calculado
        const novaTurmaRef = doc(turmasCollection, novoId)
        await setDoc(novaTurmaRef, {
          responsavel,
          dataAbertura: formatarDataParaISO(dataAbertura),
          local,
          dias,
          horario,
          tema,
          obs,
        })

        // Adicionar palestras - EXATAMENTE como no app móvel
        await addPalestras()
      }
      
      navigate('/consultar-turmas')
    } catch (error) {
      console.error("Erro ao salvar turma:", error)
      alert("Não foi possível salvar a turma.")
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar palestras - EXATAMENTE como no app móvel
  const addPalestras = async () => {
    const palestras = [
      "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
      "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
      "21", "22", "23"
    ]

    try {
      setLoading(true)
      const basePath = getBasePath()

      // Lista de IDs das palestras
      for (const palestraId of palestras) {
        // Recuperar os dados da palestra selecionada
        const palestraRef = doc(firestore, `palestras`, palestraId)
        const palestraSnap = await getDoc(palestraRef)

        if (!palestraSnap.exists()) {
          continue // Pula para a próxima palestra
        }

        const palestraData = palestraSnap.data()

        // Criar palestra dentro da turma
        await setDoc(
          doc(firestore, `${basePath}/turmas/${novoId}/palestras`, palestraId),
          {
            ...palestraData, // Reutiliza os dados da palestra
            instrutor: "", // Campo para instrutor será preenchido posteriormente
            data: "", // Campo para data será preenchido posteriormente
          }
        )
      }
    } catch (error) {
      console.error("Erro ao criar palestras dentro da turma:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Editar Turma' : 'Adicionar Turma'}
            </h1>
              <p className="mt-2 text-gray-600">
                {isEditing ? 'Atualize os dados da turma' : 'Adicione uma nova turma'}
              </p>
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

          <div className="space-y-6">
          {/* Card Informações Básicas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">ℹ️</span>
                </div>
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
              </div>

              <div className="space-y-4">
                <FormField
                label="Responsável pela Turma"
                name="responsavel"
                value={responsavel}
                onChange={setResponsavel}
                placeholder="Nome do Responsável"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Abertura *
                </label>
                <input
                  type="text"
                  value={dataAbertura}
                  onChange={(e) => {
                    // Máscara DD-MM-YYYY
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '-' + value.slice(2)
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + '-' + value.slice(5, 9)
                    }
                    setDataAbertura(value)
                  }}
                  className="input-field"
                  placeholder="DD-MM-YYYY"
                  maxLength={10}
                  required
                />
              </div>
            </div>
                </div>

          {/* Card Horários */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">🕐</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Horários</h2>
              </div>

              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da semana *
                </label>
                <button
                  type="button"
                  onClick={() => setShowDiasModal(true)}
                  className="w-full input-field text-left"
                >
                  {dias || 'Selecione os dias'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário *
                </label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="input-field"
                  required
                        />
              </div>
                  </div>
                </div>

          {/* Card Local e Tema */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">📍</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Local e Tema</h2>
            </div>

            <div className="space-y-4">
              <FormField
                label="Local da turma"
                name="local"
                value={local}
                onChange={setLocal}
                placeholder="Local"
                required
              />

              <FormField
                label="Tema de Abertura"
                name="tema"
                value={tema}
                onChange={setTema}
                placeholder="Tema de abertura"
              />
            </div>
                </div>

          {/* Card Observações */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">📝</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Observações</h2>
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="input-field"
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex space-x-4 pt-6">
              <button
                onClick={() => navigate('/consultar-turmas')}
              className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            <button
              onClick={salvarTurma}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Turma')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dias da Semana */}
      {showDiasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Selecione os Dias</h2>
              
              <div className="space-y-3">
                {weekDays.map(day => (
                  <label key={day.key} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedDias.includes(day.label)}
                      onChange={() => toggleDay(day.label)}
                      className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDiasModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              <button
                  onClick={() => {
                    setDias(selectedDias.join(' e '))
                    setShowDiasModal(false)
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                  Confirmar
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InserirTurma 