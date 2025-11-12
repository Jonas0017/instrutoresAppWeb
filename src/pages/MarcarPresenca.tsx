import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import { db as firestore } from '@/lib/firebase';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Loading from '../components/Loading';

// Interface para dados do QR Code
interface DadosQRPresenca {
  pais: string;
  estado: string;
  lumisial: string;
  turmaId: string;
  palestraId: string;
  fragmentoNumero: number;
  nomePalestra: string;
  nomeInstrutor: string;
}

const MarcarPresenca = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dadosQR, setDadosQR] = useState<DadosQRPresenca | null>(null);
  const [codigoAluno, setCodigoAluno] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    // Decodificar dados da URL
    const dadosCodificados = searchParams.get('data');

    if (!dadosCodificados) {
      setErro('QR Code inválido - dados não encontrados');
      setLoading(false);
      return;
    }

    try {
      // Decodificar Base64
      const dadosJSON = atob(decodeURIComponent(dadosCodificados));
      const dados = JSON.parse(dadosJSON) as DadosQRPresenca;

      // Validar dados
      if (!dados.pais || !dados.estado || !dados.lumisial || !dados.turmaId || !dados.palestraId) {
        throw new Error('Dados incompletos');
      }

      setDadosQR(dados);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao decodificar QR Code:', error);
      setErro('QR Code inválido ou corrompido');
      setLoading(false);
    }
  }, [searchParams]);

  const determinarCaminhoPresenca = async (
    basePath: string,
    palestraId: string,
    fragmentoNumero: number
  ): Promise<string> => {
    try {
      const palestraDoc = await getDoc(doc(firestore, `${basePath}/palestras/${palestraId}`));
      const palestraData = palestraDoc.exists() ? palestraDoc.data() : {};
      const temFragmentos = palestraData.totalFragmentos > 1;

      if (temFragmentos) {
        return `${basePath}/palestras/${palestraId}/fragmentos/fragmento_${fragmentoNumero}/presenca`;
      } else {
        return `${basePath}/palestras/${palestraId}/presenca`;
      }
    } catch (error) {
      console.error('Erro ao determinar caminho de presença:', error);
      return `${basePath}/palestras/${palestraId}/presenca`;
    }
  };

  // Função para normalizar texto: remove acentos, converte para minúsculas
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove marcas de acento
      .trim();
  };

  const validarAluno = async (codigoAluno: string): Promise<string | null> => {
    if (!dadosQR) return null;

    try {
      // Remover caracteres especiais e espaços do código digitado
      const codigoLimpo = codigoAluno.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '');

      // Extrair nome e últimos 4 dígitos do código
      // Formato: somente letras+4dígitos (ex: jonas5320, joao5320, maria1234)
      // NÃO permite: pontos, traços, vírgulas ou outros caracteres especiais
      const match = codigoLimpo.match(/^([a-zA-ZÀ-ÿ]+)(\d{4})$/i);

      if (!match) {
        setErro('Código inválido. Use apenas letras e números (ex: jonas5320)');
        return null;
      }

      const nomeDigitado = match[1] || '';
      const ultimos4Digitos = match[2] || '';

      // Normalizar o nome digitado (remove acentos, minúsculas)
      const nomeBuscaNormalizado = normalizarTexto(nomeDigitado);

      const basePath = `paises/${dadosQR.pais}/estados/${dadosQR.estado}/lumisial/${dadosQR.lumisial}/turmas/${dadosQR.turmaId}`;

      const debug: string[] = [];
      debug.push(`Caminho: ${basePath}/alunos`);
      debug.push(`Nome buscado: "${nomeBuscaNormalizado}"`);
      debug.push(`4 dígitos: "${ultimos4Digitos}"`);

      // Buscar todos os alunos da turma
      const alunosCollection = collection(firestore, `${basePath}/alunos`);
      const alunosSnapshot = await getDocs(alunosCollection);

      debug.push(`Total alunos: ${alunosSnapshot.docs.length}`);

      // Procurar alunos com nome correspondente
      for (const alunoDoc of alunosSnapshot.docs) {
        const alunoData = alunoDoc.data();
        const nomeAluno = alunoData.nome || '';

        // Extrair e normalizar primeiro nome do aluno
        const primeiroNome = nomeAluno.split(' ')[0];
        const primeiroNomeNormalizado = normalizarTexto(primeiroNome);

        const whatsapp = alunoData.whatsapp || '';
        const digitosWhatsapp = whatsapp.replace(/\D/g, '');
        const ultimos4WhatsApp = digitosWhatsapp.slice(-4);

        debug.push(`\nAluno: ${nomeAluno}`);
        debug.push(`  1º nome norm: "${primeiroNomeNormalizado}"`);
        debug.push(`  WhatsApp: ${whatsapp}`);
        debug.push(`  Últimos 4: "${ultimos4WhatsApp}"`);
        debug.push(`  Status: ${alunoData.status || 'ativo'}`);

        // Verificar se o primeiro nome corresponde (comparação normalizada)
        if (primeiroNomeNormalizado === nomeBuscaNormalizado) {
          debug.push(`  ✅ Nome OK!`);

          // Verificar se aluno está ativo
          if (alunoData.status === 'desativado') {
            setDebugInfo(debug);
            setErro('Aluno desativado. Entre em contato com o instrutor.');
            return null;
          }

          // Verificar os últimos 4 dígitos do WhatsApp
          if (ultimos4WhatsApp === ultimos4Digitos) {
            debug.push(`  ✅ WhatsApp OK!`);
            setDebugInfo(debug);
            // Aluno encontrado e validado!
            return alunoDoc.id;
          } else {
            debug.push(`  ❌ WhatsApp diferente`);
          }
        }
      }

      debug.push(`\n❌ Nenhum aluno encontrado`);
      setDebugInfo(debug);
      // Nenhum aluno encontrado com nome e WhatsApp correspondentes
      return null;
    } catch (error) {
      console.error('Erro ao validar aluno:', error);
      return null;
    }
  };

  const marcarPresenca = async () => {
    if (!dadosQR) return;
    if (!codigoAluno.trim()) {
      setErro('Digite o código do aluno');
      return;
    }

    setProcessando(true);
    setErro('');

    try {
      // Validar se aluno existe e obter ID
      const alunoId = await validarAluno(codigoAluno.trim());

      if (!alunoId) {
        setErro('Nome ou últimos 4 dígitos do WhatsApp incorretos');
        setProcessando(false);
        return;
      }

      // Determinar caminho correto de presença
      const basePath = `paises/${dadosQR.pais}/estados/${dadosQR.estado}/lumisial/${dadosQR.lumisial}/turmas/${dadosQR.turmaId}`;
      const presencaPath = await determinarCaminhoPresenca(
        basePath,
        dadosQR.palestraId,
        dadosQR.fragmentoNumero
      );

      // Verificar se já tem presença registrada
      const presencaDoc = await getDoc(doc(firestore, `${presencaPath}/${alunoId}`));

      if (presencaDoc.exists()) {
        const presencaData = presencaDoc.data();
        if (presencaData.status === 'presente') {
          setErro('Presença já registrada para esta lição');
          setProcessando(false);
          return;
        }
      }

      // Marcar presença
      const dataAtual = new Date().toISOString().split('T')[0];

      await updateDoc(doc(firestore, `${presencaPath}/${alunoId}`), {
        status: 'presente',
        data: dataAtual,
        instrutor: dadosQR.nomeInstrutor,
        reposicao: false,
        atraso: false,
        marcadoViaQR: true, // Flag para identificar presenças via QR
      });

      setSucesso(true);
      setCodigoAluno('');
      setProcessando(false);
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      setErro('Erro ao marcar presença. Tente novamente.');
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Loading />
      </div>
    );
  }

  if (erro && !dadosQR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">{erro}</p>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Presença Confirmada!</h1>
          <p className="text-gray-600 mb-6">
            Sua presença foi registrada com sucesso para {dadosQR?.nomePalestra}
            {dadosQR?.fragmentoNumero && dadosQR.fragmentoNumero > 1 && ` - Parte ${dadosQR.fragmentoNumero}`}
          </p>
          <button
            onClick={() => {
              setSucesso(false);
              setCodigoAluno('');
            }}
            className="btn-primary"
          >
            Marcar Outra Presença
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Marcar Presença</h1>
          <p className="text-lg font-medium text-gray-700 mb-1">
            {dadosQR?.nomePalestra}
          </p>
          {dadosQR?.fragmentoNumero && dadosQR.fragmentoNumero > 1 && (
            <p className="text-sm text-gray-500">Parte {dadosQR.fragmentoNumero}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Instrutor: {dadosQR?.nomeInstrutor}
          </p>
        </div>

        <div className="space-y-6">
          <FormField
            label="Código do Aluno"
            name="codigoAluno"
            type="text"
            value={codigoAluno}
            onChange={(value) => {
              // Permitir apenas letras (com acentos) e números
              const valorLimpo = value.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '');
              setCodigoAluno(valorLimpo);
              setErro('');
            }}
            placeholder="Ex: jonas5320"
            required
            disabled={processando}
          />

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {debugInfo.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs font-bold text-yellow-900 mb-2">🔍 DEBUG:</p>
              <pre className="text-xs text-yellow-900 whitespace-pre-wrap font-mono">
                {debugInfo.join('\n')}
              </pre>
            </div>
          )}

          <button
            onClick={marcarPresenca}
            disabled={processando || !codigoAluno.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? 'Marcando Presença...' : 'Marcar Presença'}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como criar seu código:</p>
                <p>Digite seu <strong>primeiro nome</strong> + <strong>últimos 4 dígitos do WhatsApp</strong></p>
                <p className="mt-1 text-xs">Exemplo: Se seu nome é Jonas e WhatsApp termina em 5320, digite: <strong>jonas5320</strong></p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarcarPresenca;
