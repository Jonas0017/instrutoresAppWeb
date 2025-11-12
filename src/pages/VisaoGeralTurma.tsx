import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, db as firestore } from '@/lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Loading from '../components/Loading';

interface Aluno {
  id: string;
  nome: string;
  whatsapp?: string;
  status?: 'ativo' | 'desativado';
}

interface Palestra {
  id: string;
  titulo: string;
  data: string;
  totalFragmentos?: number;
}

interface Fragmento {
  numero: number;
  titulo: string;
}

interface PresencaData {
  status: 'presente' | 'ausente';
  data?: string;
  instrutor?: string;
  reposicao?: boolean;
  atraso?: boolean;
  marcadoViaQR?: boolean;
}

interface CelulaPresenca {
  presenca: PresencaData | null;
  palestraId: string;
  fragmentoNumero: number;
}

const VisaoGeralTurma = () => {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [palestras, setPalestras] = useState<Palestra[]>([]);
  const [presencas, setPresencas] = useState<Map<string, CelulaPresenca[]>>(new Map());
  const [turmaNome, setTurmaNome] = useState('');
  const [fragmentosMap, setFragmentosMap] = useState<Map<string, Fragmento[]>>(new Map());

  useEffect(() => {
    if (!user || !turmaId) {
      navigate('/login');
      return;
    }

    carregarDados();
  }, [user, turmaId, navigate]);

  const carregarDados = async () => {
    if (!user || !turmaId) return;

    try {
      setLoading(true);

      const basePath = `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}/turmas/${turmaId}`;

      // Carregar informações da turma
      const turmaDoc = await getDoc(doc(firestore, basePath));
      if (turmaDoc.exists()) {
        const turmaData = turmaDoc.data();
        setTurmaNome(turmaData.nome || 'Turma sem nome');
      }

      // Carregar alunos
      const alunosSnapshot = await getDocs(collection(firestore, `${basePath}/alunos`));
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || 'Sem nome',
        whatsapp: doc.data().whatsapp,
        status: doc.data().status || 'ativo',
      })).sort((a, b) => a.nome.localeCompare(b.nome));
      setAlunos(alunosData);

      // Carregar palestras
      const palestrasSnapshot = await getDocs(collection(firestore, `${basePath}/palestras`));
      const palestrasData = await Promise.all(
        palestrasSnapshot.docs.map(async (palestraDoc) => {
          const palestraData = palestraDoc.data();
          const palestra: Palestra = {
            id: palestraDoc.id,
            // O campo no Firestore é nome.pt, não titulo
            titulo: palestraData.nome?.pt || palestraData.titulo || `Palestra ${palestraDoc.id}`,
            data: palestraData.data || '',
            totalFragmentos: palestraData.totalFragmentos || 1,
          };

          // Se tem fragmentos, carregar informações dos fragmentos
          if (palestra.totalFragmentos && palestra.totalFragmentos > 1) {
            const fragmentosSnapshot = await getDocs(
              collection(firestore, `${basePath}/palestras/${palestra.id}/fragmentos`)
            );
            const fragmentos: Fragmento[] = fragmentosSnapshot.docs.map(fragDoc => ({
              numero: fragDoc.data().numero || 1,
              titulo: fragDoc.data().titulo || `Parte ${fragDoc.data().numero}`,
            })).sort((a, b) => a.numero - b.numero);

            if (fragmentos.length > 0) {
              setFragmentosMap(prev => new Map(prev).set(palestra.id, fragmentos));
            }
          }

          return palestra;
        })
      );

      // Ordenar palestras por data
      const palestrasOrdenadas = palestrasData.sort((a, b) => {
        if (!a.data) return 1;
        if (!b.data) return -1;
        return a.data.localeCompare(b.data);
      });

      setPalestras(palestrasOrdenadas);
      console.log('✅ Palestras carregadas:', palestrasOrdenadas.length);

      // Carregar presenças para cada aluno
      const presencasMap = new Map<string, CelulaPresenca[]>();

      for (const aluno of alunosData) {
        const celulas: CelulaPresenca[] = [];

        for (const palestra of palestrasData) {
          const totalFragmentos = palestra.totalFragmentos || 1;

          if (totalFragmentos > 1) {
            // Palestra com fragmentos
            for (let fragNum = 1; fragNum <= totalFragmentos; fragNum++) {
              const presencaPath = `${basePath}/palestras/${palestra.id}/fragmentos/fragmento_${fragNum}/presenca/${aluno.id}`;
              try {
                const presencaDoc = await getDoc(doc(firestore, presencaPath));
                if (presencaDoc.exists()) {
                  const presencaData = presencaDoc.data() as PresencaData;
                  celulas.push({
                    presenca: presencaData,
                    palestraId: palestra.id,
                    fragmentoNumero: fragNum,
                  });
                } else {
                  celulas.push({
                    presenca: null,
                    palestraId: palestra.id,
                    fragmentoNumero: fragNum,
                  });
                }
              } catch (error) {
                celulas.push({
                  presenca: null,
                  palestraId: palestra.id,
                  fragmentoNumero: fragNum,
                });
              }
            }
          } else {
            // Palestra sem fragmentos
            const presencaPath = `${basePath}/palestras/${palestra.id}/presenca/${aluno.id}`;
            try {
              const presencaDoc = await getDoc(doc(firestore, presencaPath));
              if (presencaDoc.exists()) {
                const presencaData = presencaDoc.data() as PresencaData;
                celulas.push({
                  presenca: presencaData,
                  palestraId: palestra.id,
                  fragmentoNumero: 1,
                });
              } else {
                celulas.push({
                  presenca: null,
                  palestraId: palestra.id,
                  fragmentoNumero: 1,
                });
              }
            } catch (error) {
              celulas.push({
                presenca: null,
                palestraId: palestra.id,
                fragmentoNumero: 1,
              });
            }
          }
        }

        presencasMap.set(aluno.id, celulas);
      }

      setPresencas(presencasMap);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const gerarColunas = () => {
    const colunas: { palestraId: string; titulo: string; fragmentoNumero: number; temFragmentos: boolean }[] = [];

    palestras.forEach(palestra => {
      const totalFragmentos = palestra.totalFragmentos || 1;

      if (totalFragmentos > 1) {
        const fragmentos = fragmentosMap.get(palestra.id) || [];
        for (let fragNum = 1; fragNum <= totalFragmentos; fragNum++) {
          const fragmento = fragmentos.find(f => f.numero === fragNum);
          colunas.push({
            palestraId: palestra.id,
            titulo: fragmento ? fragmento.titulo : `Parte ${fragNum}`,
            fragmentoNumero: fragNum,
            temFragmentos: true,
          });
        }
      } else {
        colunas.push({
          palestraId: palestra.id,
          titulo: '-', // Não repete o título
          fragmentoNumero: 1,
          temFragmentos: false,
        });
      }
    });

    return colunas;
  };

  const gerarGruposPalestras = () => {
    const grupos: { palestra: Palestra; colspan: number }[] = [];

    palestras.forEach(palestra => {
      const totalFragmentos = palestra.totalFragmentos || 1;
      grupos.push({
        palestra,
        colspan: totalFragmentos,
      });
    });

    return grupos;
  };

  const getCelulaPresenca = (alunoId: string, palestraId: string, fragmentoNumero: number): PresencaData | null => {
    const celulasAluno = presencas.get(alunoId) || [];
    const celula = celulasAluno.find(
      c => c.palestraId === palestraId && c.fragmentoNumero === fragmentoNumero
    );
    return celula?.presenca || null;
  };

  const getStatusIcon = (presenca: PresencaData | null) => {
    if (!presenca || presenca.status === 'ausente') return '❌';
    if (presenca.status === 'presente') {
      if (presenca.reposicao) return '🔄';
      if (presenca.atraso) return '⏰';
      if (presenca.marcadoViaQR) return '📱';
      return '✅';
    }
    return '❌';
  };

  const getStatusColor = (presenca: PresencaData | null) => {
    if (!presenca || presenca.status === 'ausente') return 'bg-red-50 text-red-700';
    if (presenca.status === 'presente') return 'bg-green-50 text-green-700';
    return 'bg-gray-50 text-gray-700';
  };

  const getStatusTooltip = (presenca: PresencaData | null) => {
    if (!presenca || presenca.status === 'ausente') return 'Ausente';
    if (presenca.status === 'presente') {
      const flags = [];
      if (presenca.reposicao) flags.push('Reposição');
      if (presenca.atraso) flags.push('Atraso');
      if (presenca.marcadoViaQR) flags.push('QR Code');
      if (presenca.instrutor) flags.push(`Instrutor: ${presenca.instrutor}`);
      if (presenca.data) flags.push(`Data: ${presenca.data}`);
      return flags.length > 0 ? `Presente (${flags.join(', ')})` : 'Presente';
    }
    return 'Ausente';
  };

  const calcularEstatisticas = () => {
    let totalPresencas = 0;
    let totalPossivel = 0;

    alunos.forEach(aluno => {
      if (aluno.status === 'desativado') return;

      const celulasAluno = presencas.get(aluno.id) || [];
      celulasAluno.forEach(celula => {
        totalPossivel++;
        if (celula.presenca?.status === 'presente') {
          totalPresencas++;
        }
      });
    });

    const percentual = totalPossivel > 0 ? ((totalPresencas / totalPossivel) * 100).toFixed(1) : '0.0';
    return { totalPresencas, totalPossivel, percentual };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loading />
        </div>
      </div>
    );
  }

  const colunas = gerarColunas();
  const grupos = gerarGruposPalestras();
  const estatisticas = calcularEstatisticas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/consultar-turmas')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visão Geral da Turma</h1>
              <p className="text-gray-600 mt-1">{turmaNome}</p>
            </div>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Presença Geral</div>
                <div className="text-2xl font-bold text-indigo-600">{estatisticas.percentual}%</div>
                <div className="text-xs text-gray-500">{estatisticas.totalPresencas} / {estatisticas.totalPossivel}</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Legenda */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <span className="mr-2">✅</span>
              <span className="text-gray-700">Presente</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📱</span>
              <span className="text-gray-700">Via QR Code</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔄</span>
              <span className="text-gray-700">Reposição</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">⏰</span>
              <span className="text-gray-700">Atraso</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">❌</span>
              <span className="text-gray-700">Ausente</span>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card className="overflow-hidden shadow-lg">
          <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="w-full min-w-max" style={{ borderSpacing: 0 }}>
              <thead className="sticky top-0 z-30">
                {/* Primeira linha: Nome das palestras */}
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-40 bg-indigo-600 px-3 py-2 text-left font-semibold relative min-w-[180px] w-[180px]"
                  >
                    Aluno
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white/40"></div>
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[180px] z-40 bg-indigo-600 px-3 py-2 text-left font-semibold relative min-w-[130px] w-[130px]"
                  >
                    WhatsApp
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white/40"></div>
                  </th>
                  {grupos.map((grupo, index) => (
                    <th
                      key={grupo.palestra.id}
                      colSpan={grupo.colspan}
                      rowSpan={grupo.colspan === 1 ? 2 : 1}
                      className="px-3 py-2 text-center font-semibold relative"
                    >
                      {grupo.palestra.titulo}
                      {index < grupos.length - 1 && (
                        <div className="absolute right-0 top-1 bottom-1 w-px bg-white/30"></div>
                      )}
                    </th>
                  ))}
                </tr>
                {/* Segunda linha: Partes/fragmentos (apenas para palestras com fragmentos) */}
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                  {colunas.filter(coluna => coluna.temFragmentos).map((coluna, index) => {
                    const filteredColunas = colunas.filter(c => c.temFragmentos);
                    const isLast = index === filteredColunas.length - 1;
                    return (
                      <th
                        key={`${coluna.palestraId}-${coluna.fragmentoNumero}`}
                        className="px-2 py-2 text-center font-medium min-w-[80px] relative"
                      >
                        {coluna.titulo}
                        {!isLast && (
                          <div className="absolute right-0 top-1 bottom-1 w-px bg-white/20"></div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno, alunoIndex) => {
                  const isLastRow = alunoIndex === alunos.length - 1;
                  const bgColor = alunoIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
                  return (
                    <tr
                      key={aluno.id}
                      className={`${
                        alunoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-indigo-50 transition-all duration-200 ${
                        aluno.status === 'desativado' ? 'opacity-50' : ''
                      } text-xs`}
                      style={{ borderBottom: !isLastRow ? '1px solid #e5e7eb' : 'none' }}
                    >
                      <td
                        className="sticky left-0 z-10 px-3 py-2 font-medium text-gray-900 relative min-w-[180px] w-[180px]"
                        style={{ backgroundColor: bgColor }}
                      >
                        <div className="flex items-center gap-1">
                          {aluno.nome}
                          {aluno.status === 'desativado' && (
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                              Desativado
                            </span>
                          )}
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
                      </td>
                      <td
                        className="sticky left-[180px] z-10 px-3 py-2 text-gray-600 relative min-w-[130px] w-[130px]"
                        style={{ backgroundColor: bgColor }}
                      >
                        {aluno.whatsapp || '-'}
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
                      </td>
                      {colunas.map((coluna, colunaIndex) => {
                        const presenca = getCelulaPresenca(aluno.id, coluna.palestraId, coluna.fragmentoNumero);
                        const isLastColumn = colunaIndex === colunas.length - 1;
                        return (
                          <td
                            key={`${aluno.id}-${coluna.palestraId}-${coluna.fragmentoNumero}`}
                            className={`px-2 py-2 text-center transition-all duration-200 ${getStatusColor(presenca)}`}
                            title={getStatusTooltip(presenca)}
                            style={{ borderRight: !isLastColumn ? '1px solid #f3f4f6' : 'none' }}
                          >
                            <div className="text-base">{getStatusIcon(presenca)}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {alunos.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum aluno encontrado nesta turma
              </div>
            )}
          </div>
        </Card>

        {/* Informações adicionais */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Total de Alunos</div>
            <div className="text-2xl font-bold text-gray-900">
              {alunos.filter(a => a.status !== 'desativado').length}
            </div>
            <div className="text-xs text-gray-500">
              ({alunos.filter(a => a.status === 'desativado').length} desativados)
            </div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Total de Lições</div>
            <div className="text-2xl font-bold text-gray-900">{colunas.length}</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Presenças Registradas</div>
            <div className="text-2xl font-bold text-green-600">{estatisticas.totalPresencas}</div>
            <div className="text-xs text-gray-500">de {estatisticas.totalPossivel} possíveis</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisaoGeralTurma;
