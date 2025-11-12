// utils/whatsappMessages.ts

// Função para retornar a saudação com base no horário
export const getGreeting = async (alunoNome: string): Promise<string> => {
  const hora = new Date().getHours()
  let saudacao = "Bom dia"
  if (hora >= 12 && hora < 18) {
    saudacao = "Boa tarde"
  } else if (hora >= 18) {
    saudacao = "Boa noite"
  }
  return `${saudacao}, ${alunoNome}! Tudo bem?`
}

// Função para obter o link ou mensagem de resumo da palestra
export const getResumo = async (palestraTitulo: string): Promise<string> => {
  return "Resumo não disponível."
}

// Função para obter a mensagem de motivação da palestra
export const getMotivacao = async (palestraTitulo: string): Promise<string> => {
  return "Mensagem de motivação não disponível."
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