import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationProvider from './components/NotificationProvider';
import ConfirmProvider from './components/ConfirmProvider';

// Páginas
import Login from './pages/Login';
import ConsultarTurmas from './pages/ConsultarTurmas';
import ControlePresenca from './pages/ControlePresenca';
import InserirTurma from './pages/InserirTurma';
import InserirAluno from './pages/InserirAluno';
import PerfilUsuario from './pages/PerfilUsuario';
import Reposicoes from './pages/Reposicoes';
import MarcarPresenca from './pages/MarcarPresenca';
import VisaoGeralTurma from './pages/VisaoGeralTurma';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ConfirmProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/marcar-presenca" element={<MarcarPresenca />} />

                {/* Rotas protegidas */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <ConsultarTurmas />
                  </ProtectedRoute>
                } />
                
                <Route path="/consultar-turmas" element={
                  <ProtectedRoute>
                    <ConsultarTurmas />
                  </ProtectedRoute>
                } />
                
                <Route path="/controle-presenca/:turmaId" element={
                  <ProtectedRoute>
                    <ControlePresenca />
                  </ProtectedRoute>
                } />
                
                <Route path="/inserir-turma" element={
                  <ProtectedRoute>
                    <InserirTurma />
                  </ProtectedRoute>
                } />
                
                <Route path="/inserir-turma/:turmaId" element={
                  <ProtectedRoute>
                    <InserirTurma />
                  </ProtectedRoute>
                } />
                
                <Route path="/inserir-aluno/:turmaId/:palestraId" element={
                  <ProtectedRoute>
                    <InserirAluno />
                  </ProtectedRoute>
                } />
                
                <Route path="/inserir-aluno/:turmaId/:palestraId/:alunoId" element={
                  <ProtectedRoute>
                    <InserirAluno />
                  </ProtectedRoute>
                } />
                
                <Route path="/perfil-usuario" element={
                  <ProtectedRoute>
                    <PerfilUsuario />
                  </ProtectedRoute>
                } />
                
                <Route path="/reposicoes/:turmaId" element={
                  <ProtectedRoute>
                    <Reposicoes />
                  </ProtectedRoute>
                } />

                <Route path="/visao-geral/:turmaId" element={
                  <ProtectedRoute>
                    <VisaoGeralTurma />
                  </ProtectedRoute>
                } />

                {/* Rota padrão - redireciona para login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </ConfirmProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 