# Gnosis Instrutores - Versão Web

Sistema web para controle de frequências e gestão de turmas para instrutores Gnosis.

## 🚀 Funcionalidades

- **Autenticação Geográfica**: Login com seleção de país, estado e lumisial
- **Cache Inteligente**: Sistema de cache para dados geográficos (economia de tokens)
- **Controle de Presença**: Marcar presença/ausência de alunos em palestras
- **Gestão de Turmas**: Criar e editar turmas
- **Gestão de Alunos**: Adicionar e editar alunos
- **Navegação Responsiva**: Interface adaptada para web

## 📁 Estrutura do Projeto

```
web/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── context/          # Contextos React (Auth)
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Configurações (Firebase)
│   ├── styles/           # Estilos CSS
│   └── utils/            # Utilitários
├── public/               # Arquivos públicos
└── dist/                 # Build de produção
```

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 16+
- npm 8+
- Projeto Firebase configurado

### Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd gnosisInstrutores/web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Firestore Database
   - Copie as credenciais para `src/lib/firebase.ts`

4. **Configure variáveis de ambiente**
```bash
# Crie .env.local
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=seu-app-id
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Análise do código
npm run lint
npm run lint:fix
```

## 🔐 Sistema de Autenticação

### Login com Localização Geográfica

O sistema agora utiliza uma abordagem de seleção geográfica para login:

1. **Seleção de País**: Lista de países disponíveis
2. **Seleção de Estado**: Estados do país selecionado
3. **Seleção de Lumisial**: Lumisiais do estado selecionado
4. **CPF e Senha**: Credenciais do instrutor

### Sistema de Cache

Para economizar tokens do Firestore, implementamos um sistema de cache:

- **Cache Duration**: 24 horas
- **Storage**: localStorage do navegador
- **Auto-refresh**: Atualização automática quando cache expira
- **Fallback**: Busca na estrutura antiga do Firebase se nova não existir

### Estrutura do Firebase

```
paises/
├── Brasil/
│   └── estados/
│       ├── RJ/
│       │   └── lumisiais/
│       │       ├── Niteroi/
│       │       │   └── instrutores/
│       │       │       └── {cpf}/
│       │       └── RioDeJaneiro/
│       └── SP/
└── Portugal/
```

## 💾 Gerenciamento de Cache

### Limpar Cache

Se necessário, você pode limpar o cache manualmente:

```javascript
// No console do navegador
localStorage.removeItem('gnosis_geographic_data')
localStorage.removeItem('gnosis_geographic_data_expiry')
```

### Forçar Atualização

O cache é automaticamente atualizado quando:
- Expira (24 horas)
- Detecta erro nos dados
- Primeira execução

## 🌐 Tecnologias Utilizadas

- **React 18**: Biblioteca para interface
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework CSS
- **Firebase**: Backend e autenticação
- **React Router**: Navegação
- **Lucide React**: Ícones
- **React Hot Toast**: Notificações

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🔒 Segurança

- **Validação de entrada**: Todos os campos são validados
- **Proteção de rotas**: Rotas protegidas por autenticação
- **Cache seguro**: Dados sensíveis não são armazenados em cache
- **Limpeza automática**: Logout limpa dados do localStorage

## 🚧 Status de Desenvolvimento

- ✅ Sistema de autenticação com cache
- ✅ Controle de presença
- ✅ Gestão de alunos
- ✅ Gestão de turmas
- ✅ Navegação responsiva
- 🔄 Relatórios (em desenvolvimento)
- 🔄 Perfil do usuário (em desenvolvimento)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Limpe o cache do navegador
3. Verifique as configurações do Firebase
4. Contate o suporte técnico

---

© 2024 Gnosis Instrutores - Todos os direitos reservados 