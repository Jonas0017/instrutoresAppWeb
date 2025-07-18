import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, getDocs, doc, setDoc, getDoc, db as firestore } from '@/lib/firebase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import Navigation from '../components/Navigation'

const paisesComCodigo = [
  { nome: "Afeganistão", codigo: "Afeganistão (+93)", bandeira: "🇦🇫" },
  { nome: "África do Sul", codigo: "África do Sul (+27)", bandeira: "🇿🇦" },
  { nome: "Albânia", codigo: "Albânia (+355)", bandeira: "🇦🇱" },
  { nome: "Alemanha", codigo: "Alemanha (+49)", bandeira: "🇩🇪" },
  { nome: "Andorra", codigo: "Andorra (+376)", bandeira: "🇦🇩" },
  { nome: "Angola", codigo: "Angola (+244)", bandeira: "🇦🇴" },
  { nome: "Argentina", codigo: "Argentina (+54)", bandeira: "🇦🇷" },
  { nome: "Austrália", codigo: "Austrália (+61)", bandeira: "🇦🇺" },
  { nome: "Áustria", codigo: "Áustria (+43)", bandeira: "🇦🇹" },
  { nome: "Bélgica", codigo: "Bélgica (+32)", bandeira: "🇧🇪" },
  { nome: "Bolívia", codigo: "Bolívia (+591)", bandeira: "🇧🇴" },
  { nome: "Brasil", codigo: "Brasil (+55)", bandeira: "🇧🇷" },
  { nome: "Canadá", codigo: "Canadá (+1)", bandeira: "🇨🇦" },
  { nome: "Chile", codigo: "Chile (+56)", bandeira: "🇨🇱" },
  { nome: "China", codigo: "China (+86)", bandeira: "🇨🇳" },
  { nome: "Colômbia", codigo: "Colômbia (+57)", bandeira: "🇨🇴" },
  { nome: "Coreia do Sul", codigo: "Coreia do Sul (+82)", bandeira: "🇰🇷" },
  { nome: "Costa Rica", codigo: "Costa Rica (+506)", bandeira: "🇨🇷" },
  { nome: "Dinamarca", codigo: "Dinamarca (+45)", bandeira: "🇩🇰" },
  { nome: "Egito", codigo: "Egito (+20)", bandeira: "🇪🇬" },
  { nome: "Espanha", codigo: "Espanha (+34)", bandeira: "🇪🇸" },
  { nome: "Estados Unidos", codigo: "EUA (+1)", bandeira: "🇺🇸" },
  { nome: "França", codigo: "França (+33)", bandeira: "🇫🇷" },
  { nome: "Grécia", codigo: "Grécia (+30)", bandeira: "🇬🇷" },
  { nome: "Holanda", codigo: "Holanda (+31)", bandeira: "🇳🇱" },
  { nome: "Índia", codigo: "Índia (+91)", bandeira: "🇮🇳" },
  { nome: "Inglaterra", codigo: "Inglaterra (+44)", bandeira: "🇬🇧" },
  { nome: "Irlanda", codigo: "Irlanda (+353)", bandeira: "🇮🇪" },
  { nome: "Itália", codigo: "Itália (+39)", bandeira: "🇮🇹" },
  { nome: "Japão", codigo: "Japão (+81)", bandeira: "🇯🇵" },
  { nome: "México", codigo: "México (+52)", bandeira: "🇲🇽" },
  { nome: "Moçambique", codigo: "Moçambique (+258)", bandeira: "🇲🇿" },
  { nome: "Noruega", codigo: "Noruega (+47)", bandeira: "🇳🇴" },
  { nome: "Nova Zelândia", codigo: "Nova Zelândia (+64)", bandeira: "🇳🇿" },
  { nome: "Paraguai", codigo: "Paraguai (+595)", bandeira: "🇵🇾" },
  { nome: "Peru", codigo: "Peru (+51)", bandeira: "🇵🇪" },
  { nome: "Polônia", codigo: "Polônia (+48)", bandeira: "🇵🇱" },
  { nome: "Portugal", codigo: "Portugal (+351)", bandeira: "🇵🇹" },
  { nome: "Reino Unido", codigo: "Reino Unido (+44)", bandeira: "🇬🇧" },
  { nome: "Rússia", codigo: "Rússia (+7)", bandeira: "🇷🇺" },
  { nome: "Suécia", codigo: "Suécia (+46)", bandeira: "🇸🇪" },
  { nome: "Suíça", codigo: "Suíça (+41)", bandeira: "🇨🇭" },
  { nome: "Turquia", codigo: "Turquia (+90)", bandeira: "🇹🇷" },
  { nome: "Ucrânia", codigo: "Ucrânia (+380)", bandeira: "🇺🇦" },
  { nome: "Uruguai", codigo: "Uruguai (+598)", bandeira: "🇺🇾" },
  { nome: "Venezuela", codigo: "Venezuela (+58)", bandeira: "🇻🇪" },
]

const InserirAluno = () => {
  const navigate = useNavigate()
  const { turmaId, palestraId, alunoId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Estados do formulário - exatamente como no app móvel
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [codigoPais, setCodigoPais] = useState("")

  // Obtém a bandeira correspondente ao código do país selecionado
  const bandeiraSelecionada = paisesComCodigo.find((p) => p.codigo === codigoPais)?.bandeira || "🌍"

  // Função para obter o caminho base do Firestore
  const getBasePath = () => {
    if (!user) return ""
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
  }

  // Função para carregar os dados do aluno do banco de dados - EXATAMENTE como no app móvel
  const carregarDadosAluno = async () => {
    const basePath = getBasePath()
    if (!turmaId || !alunoId) {
      console.error("IDs de turma e aluno são obrigatórios para carregar os dados.")
      return
    }

    try {
      setLoading(true)

      const alunoRef = doc(firestore, `${basePath}/turmas/${turmaId}/alunos/${alunoId}`)
      const alunoSnapshot = await getDoc(alunoRef)

      if (alunoSnapshot.exists()) {
        const alunoData = alunoSnapshot.data()
        setNome(alunoData.nome || "")
        setWhatsapp(alunoData.whatsapp || "")
        setCodigoPais(alunoData.codigoPais || "")
      } else {
        setNome("")
        setWhatsapp("")
      }
    } catch (error) {
      console.error("Erro ao carregar dados do aluno:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função principal para adicionar aluno - EXATAMENTE como no app móvel
  const handleAddAluno = async () => {
    // Validação do código de país
    if (!codigoPais) {
      alert("Selecione o código do país antes de continuar.")
      return
    }
    
    if (!turmaId) {
      console.error("IDs de turma e palestra são obrigatórios. Verifique as informações.")
      return
    }

    if (!nome.trim() || !whatsapp.trim()) {
      alert("Preencha todos os campos antes de continuar.")
      return
    }

    // Remover caracteres não numéricos e garantir que começa com o código do país
    const numeroFormatado = whatsapp.replace(/\D/g, "")
    const whatsappCompleto = `${codigoPais.replace(/\D/g, "")}${numeroFormatado}`

    // Validação do WhatsApp
    const regexTelefone = /^\+\d{1,3}\d{8,15}$/
    if (!regexTelefone.test(`+${whatsappCompleto}`)) {
      alert("Número de WhatsApp inválido. Inclua o código do país (Ex.: +5511999999999).")
      return
    }

    try {
      setLoading(true)
      const basePath = getBasePath()

      const alunosCollection = collection(firestore, `${basePath}/turmas/${turmaId}/alunos`)

      if (alunoId) {
        // Atualizar aluno existente
        const alunoIdStr = String(alunoId)
        const alunoDoc = doc(alunosCollection, alunoIdStr)
        await setDoc(alunoDoc, { nome, codigoPais, whatsapp }, { merge: true })

        alert("Aluno atualizado com sucesso!")
      } else {
        // Verificar último aluno e calcular próximo ID - EXATAMENTE como no app móvel
        const querySnapshot = await getDocs(alunosCollection)
        let novoId = "A001"

        if (!querySnapshot.empty) {
          const ids = querySnapshot.docs.map((doc) => doc.id)
          const ultimoId = ids.sort().pop()
          if (ultimoId) {
            const numero = parseInt(ultimoId.replace("A", ""), 10) + 1
            novoId = `A${String(numero).padStart(3, "0")}`
          }
        }

        // Inserir novo aluno
        const novoAlunoRef = doc(alunosCollection, novoId)
        await setDoc(novoAlunoRef, { nome, codigoPais, whatsapp })

        // Adicionar presença para o novo aluno
        await adicionarPresencaParaAluno(novoId)

        alert(`Aluno ${novoId} inserido com sucesso!`)
      }

      // Redirecionar após salvar
      navigate(`/controle-presenca/${turmaId}`)
    } catch (error) {
      console.error("Erro ao salvar aluno:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar presença em todas as palestras da turma - EXATAMENTE como no app móvel
  const adicionarPresencaParaAluno = async (alunoId: string) => {
    if (!turmaId || !palestraId) {
      return
    }
    try {
      setLoading(true)
      const basePath = getBasePath()

      const palestrasCollection = collection(firestore, `${basePath}/turmas/${turmaId}/palestras`)
      const palestrasSnapshot = await getDocs(palestrasCollection)
      
      if (!palestrasSnapshot.empty) {
        for (const palestraDoc of palestrasSnapshot.docs) {
          const palestraId = palestraDoc.id
          const presencaRef = doc(
            firestore,
            `${basePath}/turmas/${turmaId}/palestras/${palestraId}/presenca/${alunoId}`
          )
          await setDoc(presencaRef, { alunoId, status: "ausente" })
        }
        console.log(`Presenças adicionadas para o aluno '${alunoId}' em todas as palestras.`)
      }
    } catch (error) {
      console.error("Erro ao adicionar presenças:", error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados do aluno ao montar o componente
  useEffect(() => {
    const carregarCodigoPais = async () => {
      if (!codigoPais || codigoPais === "+55") {
        if (user) {
          const paisEncontrado = paisesComCodigo.find((p) => p.nome === user.pais)
          if (paisEncontrado) {
            setCodigoPais(paisEncontrado.codigo)
          }
        }
      }
    }

    carregarDadosAluno()
    carregarCodigoPais()
  }, [turmaId, alunoId])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {alunoId ? 'Editar Aluno' : 'Adicionar Aluno'}
              </h1>
              <p className="mt-2 text-gray-600">
                {alunoId ? 'Atualize os dados do aluno' : 'Cadastre um novo aluno'}
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
          {/* Card Dados do Aluno */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">👤</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Dados do Aluno</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Aluno *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-field"
                placeholder="Digite o nome completo do aluno"
                required
              />
            </div>
          </div>

          {/* Card WhatsApp */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">📱</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp do Aluno *</h2>
            </div>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {/* Seletor de País */}
              <div className="flex items-center bg-gray-50 px-3 py-2 border-r border-gray-300">
                <span className="text-2xl mr-2">{bandeiraSelecionada}</span>
                <select
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
                  required
                >
                  <option value="">Selecione</option>
                  {paisesComCodigo.map((pais) => (
                    <option key={pais.codigo} value={pais.codigo}>
                      {pais.codigo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo de Telefone */}
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="flex-1 px-3 py-2 border-none outline-none focus:ring-0"
                placeholder="(21) 98999-9999"
                required
              />
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-500 text-lg mr-2">ℹ️</span>
              <p className="text-sm text-blue-700 font-medium">
                Todos os campos são obrigatórios.
              </p>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => navigate(`/controle-presenca/${turmaId}`)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddAluno}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Salvando...' : (alunoId ? 'Atualizar Aluno' : 'Inserir Aluno')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InserirAluno 