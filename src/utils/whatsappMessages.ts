// utils/whatsappMessages.ts
import { doc, getDoc } from '../lib/firebase'
import { db } from '../lib/firebase'

// Cache para evitar múltiplas requisições
const messageCache = new Map<string, any>()

// Mapeamento de títulos para IDs de palestras
const getPalestraIdByTitle = (titulo: string): string | null => {
  // Limpar título removendo "Lição X:" e fragmentos se existirem
  let tituloLimpo = titulo

  // Remove "Lição X: " se existir
  const licaoMatch = titulo.match(/^Lição \d+:\s*(.+)$/)
  if (licaoMatch) {
    tituloLimpo = licaoMatch[1]
  }

  // Remove fragmentos "- Parte Y" se existirem
  tituloLimpo = tituloLimpo.replace(/\s*-\s*Parte\s+\d+.*$/i, '').trim()

  const titleMap: { [key: string]: string } = {
    "O que é Gnosis": "01",
    "Personalidade, Essência e Ego": "02",
    "Despertar da Consciência": "03",
    "O Eu Psicológico": "04",
    "Luz, Calor e Som": "05",
    "A Máquina Humana": "06",
    "O Mundo das Relações": "07",
    "O Caminho e a Vida": "08",
    "O Nível de Ser": "09",
    "O Decálogo": "10",
    "Educação Fundamental": "11",
    "A Árvore Genealógica das Religiões": "12",
    "Evolução, Involução e Revolução": "13",
    "O Raio da Morte": "14",
    "Reencarnação, Retorno e Recorrência": "15",
    "A Balança da Justiça": "16",
    "Os 4 Caminhos": "17",
    "Diagrama Interno do Homem": "18",
    "A Transformação da Energia": "19",
    "Os Elementais": "20",
    "Os 4 Estados de Consciência": "21",
    "A Iniciação": "22",
    "A Santa Igreja Gnóstica": "23"
  }

  return titleMap[tituloLimpo] || null
}

// Função para retornar a saudação com base no horário
export const getGreeting = async (alunoNome: string): Promise<string> => {
  try {
    // Buscar template do Firebase
    if (!messageCache.has('saudacao')) {
      const saudacaoDoc = await getDoc(doc(db, "whatsapp_messages", "saudacao"))
      if (saudacaoDoc.exists()) {
        messageCache.set('saudacao', saudacaoDoc.data())
      }
    }

    const saudacaoData = messageCache.get('saudacao')
    if (!saudacaoData) {
      const hora = new Date().getHours()
      let saudacao = "Bom dia"
      if (hora >= 12 && hora < 18) {
        saudacao = "Boa tarde"
      } else if (hora >= 18) {
        saudacao = "Boa noite"
      }
      return `${saudacao}, ${alunoNome}! Tudo bem?`
    }

    // Lógica da saudação baseada no horário
    const hora = new Date().getHours()
    let saudacao = "Bom dia"
    if (hora >= 12 && hora < 18) {
      saudacao = "Boa tarde"
    } else if (hora >= 18) {
      saudacao = "Boa noite"
    }

    // Substituir variáveis no template
    return saudacaoData.template
      .replace("{saudacao}", saudacao)
      .replace("{alunoNome}", alunoNome)

  } catch (error) {
    console.error("Erro ao buscar saudação:", error)
    const hora = new Date().getHours()
    let saudacao = "Bom dia"
    if (hora >= 12 && hora < 18) {
      saudacao = "Boa tarde"
    } else if (hora >= 18) {
      saudacao = "Boa noite"
    }
    return `${saudacao}, ${alunoNome}! Tudo bem?`
  }
}

// Função para obter o link ou mensagem de resumo da palestra
export const getResumo = async (palestraTitulo: string): Promise<string> => {
  try {
    // Mapear título para ID da palestra
    const palestraId = getPalestraIdByTitle(palestraTitulo)
    if (!palestraId) {
      return "O resumo ainda não está disponível."
    }

    const resumoKey = `palestra_${palestraId}_resumo`

    // Buscar do cache ou Firebase
    if (!messageCache.has(resumoKey)) {
      const resumoDoc = await getDoc(doc(db, "whatsapp_messages", resumoKey))
      if (resumoDoc.exists()) {
        messageCache.set(resumoKey, resumoDoc.data())
      }
    }

    const resumoData = messageCache.get(resumoKey)
    return resumoData?.url || "O resumo ainda não está disponível."

  } catch (error) {
    console.error("Erro ao buscar resumo:", error)
    return "O resumo ainda não está disponível."
  }
}

// Função para obter a mensagem de motivação da palestra
export const getMotivacao = async (palestraTitulo: string): Promise<string> => {
  try {
    // Mapear título para ID da palestra
    const palestraId = getPalestraIdByTitle(palestraTitulo)
    if (!palestraId) {
      return ""
    }

    const motivacaoKey = `palestra_${palestraId}_motivacao`

    // Buscar do cache ou Firebase
    if (!messageCache.has(motivacaoKey)) {
      const motivacaoDoc = await getDoc(doc(db, "whatsapp_messages", motivacaoKey))
      if (motivacaoDoc.exists()) {
        messageCache.set(motivacaoKey, motivacaoDoc.data())
      }
    }

    const motivacaoData = messageCache.get(motivacaoKey)
    return motivacaoData?.conteudo || ""

  } catch (error) {
    console.error("Erro ao buscar motivação:", error)
    return ""
  }
}

// Função para abrir WhatsApp no navegador
export const abrirWhatsApp = (
  codigoPais: string,
  whatsapp: string,
  mensagem: string
): void => {
  const numeroFormatado = whatsapp.replace(/\D/g, "")
  const codigoPaisFormatado = codigoPais.replace(/\D/g, "") || "55"
  const numeroCompleto = `+${codigoPaisFormatado}${numeroFormatado}`
  
  const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}