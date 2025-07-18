// Função para retornar a saudação com base no horário
export const getGreeting = (alunoNome: string): string => {
  const hora = new Date().getHours();
  let saudacao = "Bom dia";
  if (hora >= 12 && hora < 18) {
    saudacao = "Boa tarde";
  } else if (hora >= 18) {
    saudacao = "Boa noite";
  }
  return `${saudacao}, ${alunoNome}! Tudo bem?`;
};

// Função para obter o link ou mensagem de resumo da palestra
export const getResumo = (palestraTitulo: string): string => {
  const resumos: { [key: string]: string } = {
    "O que é Gnosis": "https://drive.google.com/file/d/0ByuJiBLnCPXgX3R0SW15bGJUS1E/view?usp=drive_link&resourcekey=0-G43iiHrkTm22Lox8mPh49g",
    "Personalidade, Essência e Ego": "https://drive.google.com/file/d/12jpkWf6m2ST069drWA86rpSrSO8f5Yuc/view?usp=drive_link",
    "Despertar da Consciência": "https://drive.google.com/file/d/0ByuJiBLnCPXgWWVlT3VNQm5kcVk/view?usp=drive_link&resourcekey=0-QjgW41nYsWeecFXhIAGCvA",
    "O Eu Psicológico": "https://drive.google.com/file/d/0ByuJiBLnCPXgUlMtcmtCZHdmNTg/view?usp=drive_link&resourcekey=0-8yYpe218jPZhG-buH6lFDA",
    "Luz, Calor e Som": "https://drive.google.com/file/d/0ByuJiBLnCPXgSm9OZlZMSlMzYTA/view?usp=drive_link&resourcekey=0-pXLDZW9_tRWPrlsBiWD-rQ",
    "A Máquina Humana": "https://drive.google.com/file/d/0ByuJiBLnCPXgeVdTblJKUFZkNW8/view?usp=drive_link&resourcekey=0-Sgq7TQ5NEqI1k4J0vDfrrA",
    "O Mundo das Relações": "https://drive.google.com/file/d/12VR3p1VxgX-5szLdhSY5nDK9u-Uh03SO/view?usp=drive_link",
    "O Caminho e a Vida": "https://drive.google.com/file/d/0ByuJiBLnCPXgR0xpa0FqQmdhRHM/view?usp=drive_link&resourcekey=0-kypyl1Q6gy9eHA6th14oOQ",
    "O Nível de Ser": "https://drive.google.com/file/d/0ByuJiBLnCPXga3ZZRkxBUDJXdXc/view?usp=drive_link&resourcekey=0-gKG35-riXKyXjJhUcb-LUg",
    "O Decálogo": "https://drive.google.com/file/d/0ByuJiBLnCPXgc2FUTk1uTzNFMjg/view?usp=drive_link&resourcekey=0-trTrVjwS0DweKpRaTc4-0Q",
    "Educação Fundamental": "https://drive.google.com/file/d/0ByuJiBLnCPXgdkhBcHk4M1JMclU/view?usp=drive_link&resourcekey=0-eQhKjBHstCLDUOuU65yj5w",
    "A Árvore Genealógica das Religiões": "https://drive.google.com/file/d/0ByuJiBLnCPXgTDlRY0ZwRlp4QXM/view?usp=drive_link&resourcekey=0-iH_xNuiVemFplCA8qFw2KQ",
    "Evolução, Involução e Revolução": "https://drive.google.com/file/d/0ByuJiBLnCPXgS1JJWFY0cDBHdEE/view?usp=drive_link&resourcekey=0-9aNc3kOptmpJPmGdqFsN8Q",
    "O Raio da Morte": "https://drive.google.com/file/d/0ByuJiBLnCPXgVVNTdDFlNF9Nc0U/view?usp=drive_link&resourcekey=0-zZ7O10pmxChe6X-l4wgYAA",
    "Reencarnação, Retorno e Recorrência": "https://drive.google.com/file/d/0ByuJiBLnCPXgZVliUjBVUjkxMlU/view?usp=drive_link&resourcekey=0-StxeibqRwyhrucOkORhwug",
    "A Balança da Justiça": "https://drive.google.com/file/d/0ByuJiBLnCPXgTDd1S2s4aDNiaEU/view?usp=drive_link&resourcekey=0-IhRyZn4I1G2ElLG2An_dFw",
    "Os 4 Caminhos": "https://drive.google.com/file/d/0ByuJiBLnCPXgLUNhVkZFdEVxYUk/view?usp=drive_link&resourcekey=0-ZXlj0x4u0SkfLTE7p20Lfw",
    "Diagrama Interno do Homem": "https://drive.google.com/file/d/0ByuJiBLnCPXgSGRoV1FNcnlibXc/view?usp=drive_link&resourcekey=0-pb_KEwQAT0oJgweIW2tcoQ",
    "A Transformação da Energia": "https://drive.google.com/file/d/0ByuJiBLnCPXgZWo3eDhIY2VXRzQ/view?usp=drive_link&resourcekey=0-YvEuePHm8cZlJftnDtdLFw",
    "Os Elementais": "https://drive.google.com/file/d/0ByuJiBLnCPXgTWNlZFlLeUZPSzA/view?usp=drive_link&resourcekey=0-U-89ee79GB9tO_LvdHnOCQ",
    "Os 4 Estados de Consciência": "https://drive.google.com/file/d/0ByuJiBLnCPXgOHpsckh5SXcyOTA/view?usp=drive_link&resourcekey=0-m19_tp-QD2gbpzHtiV7pEA",
    "A Iniciação": "https://drive.google.com/file/d/0ByuJiBLnCPXgc2RJSi1EeGJaelU/view?usp=drive_link&resourcekey=0-_Lpmpn-CeIiwvDKbFvkpJA",
    "A Santa Igreja Gnóstica": "https://drive.google.com/file/d/0ByuJiBLnCPXgS000dGstQ1k2WkU/view?usp=drive_link&resourcekey=0-ph09MMPD82XjnbZQPIKNIg"
  };
  return resumos[palestraTitulo] || "Resumo não disponível.";
};

// Função para obter a mensagem de motivação da palestra
export const getMotivacao = (palestraTitulo: string): string => {
  const motivacoes: { [key: string]: string } = {
    "O que é Gnosis": `Boa tarde!
Sua inscrição para o *Curso de Gnosis* com início amanhã (XX/XX), às XXhXX, está
confirmada. Endereço: XXXXX. Aguardamos você!
Atenciosamente
_Fulano(a)_
_Instrutor(a)_
_Gnosis Cidade Tal_`,

    "Personalidade, Essência e Ego": `*LIÇÃO 2 – CÂMARA BÁSICA*
Espero que estejam bem.

Amanhã entramos em um tema lindo sobre psicologia, vamos falar sobre a personalidade humana, aquilo que nos define como pessoa frente aos demais e frente a nós mesmos.`,

    "Despertar da Consciência": `*LIÇÃO 3 – CÂMARA BÁSICA*
*Gostaríamos de recodar da nossa aula amanhã às 18:30.*

*O Despertar da Consciência.*

Vamos refletir sobre a essência, sobre a consciência, sobre os mistérios luz, sobre os aspectos que nos fazem dormir estando acordado.`,

    "O Eu Psicológico": `*LIÇÃO 4 – CÂMARA BÁSICA*
*Espero que se encontrem nesse momento na mais perfeita paz e harmonia.*

Gostaríamos de recordar que *hoje às 19h vamos estudar o eu psicológico.*

Todos os nossos *defeitos, problemas e situações da vida que nos causam dano* precisam ser estudados, analisados, compreendidos e por final eliminados de nossa natureza interior.`,

    "Luz, Calor e Som": `*LIÇÃO 5 – CÂMARA BÁSICA*
Boa tarde pessoal.
*Recordando da nossa aula hoje às 18:30, Luz Calor e Som.*

Vamos estudar os *princípios da criação,* desde a criação do universo até a criação do microcosmos homem.`,

    "A Máquina Humana": `*LIÇÃO 6 – CÂMARA BÁSICA*
Boa noite queridos alunos.
_Espero que essa mensagem vos encontre na mais perfeita paz e harmonia._
*Amanhã às 18:30* vamos estudar *A Máquina Humana.*

Por que Máquina? E por que Máquina Humana?`,

    "O Mundo das Relações": `*LIÇÃO 7 – CÂMARA BÁSICA*
*Boa tarde meus queridos alunos.*
Recordando da nossa aula hoje às 19h
*O mundo das relações*

_Como são as nossas relações com o mundo exterior?_
_Como são as nossas relações com o mundo interior?_`
  };
  
  return motivacoes[palestraTitulo] || "Mensagem de motivação não disponível.";
};

// Função para abrir WhatsApp no navegador
export const abrirWhatsApp = (
  codigoPais: string,
  whatsapp: string,
  mensagem: string
): void => {
  const numeroFormatado = whatsapp.replace(/\D/g, "");
  const codigoPaisFormatado = codigoPais.replace(/\D/g, "") || "55";
  const numeroCompleto = `+${codigoPaisFormatado}${numeroFormatado}`;
  
  const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}; 