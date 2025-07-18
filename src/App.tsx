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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ConfirmProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Rota pública */}
                <Route path="/login" element={<Login />} />
                
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