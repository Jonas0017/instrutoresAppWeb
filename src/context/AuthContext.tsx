import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { doc, getDoc, db } from '@/lib/firebase'

interface User {
  nome: string
  cpf: string
  codigoPais: string
  whatsapp: string
  pais: string
  estado: string
  lumisial: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (cpf: string, senha: string, pais: string, estado: string, lumisial: string, manterLogado?: boolean) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há dados salvos no localStorage
    const savedUser = localStorage.getItem('gnosis_user')
    const loginExpiry = localStorage.getItem('gnosis_login_expiry')
    
    if (savedUser && loginExpiry) {
      try {
        const userData = JSON.parse(savedUser)
        const expiryDate = new Date(loginExpiry)
        const now = new Date()
        
        // Verificar se o login ainda é válido (não expirou)
        if (now < expiryDate) {
          setUser(userData)
        } else {
          // Login expirado, limpar dados
          localStorage.removeItem('gnosis_user')
          localStorage.removeItem('gnosis_login_expiry')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        localStorage.removeItem('gnosis_user')
        localStorage.removeItem('gnosis_login_expiry')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (cpf: string, senha: string, pais: string, estado: string, lumisial: string, manterLogado: boolean = false): Promise<boolean> => {
    try {
      setLoading(true)

      // Buscar o usuário verificando os diferentes tipos de instrutor
      let usuarioDoc: any = null
      let caminhoUsuario = ''

      // 1. Tenta buscar como instrutor DIOCESANO (no nível do estado)
      caminhoUsuario = `paises/${pais}/estados/${estado}/instrutores_diocesanos/${cpf}`
      console.log('🔍 Tentando como diocesano:', caminhoUsuario)
      usuarioDoc = await getDoc(doc(db, caminhoUsuario))

      // 2. Se não encontrou, tenta como instrutor LOCAL (dentro do lumisial)
      if (!usuarioDoc.exists()) {
        caminhoUsuario = `paises/${pais}/estados/${estado}/lumisial/${lumisial}/instrutor/${cpf}`
        console.log('🔍 Tentando como local:', caminhoUsuario)
        usuarioDoc = await getDoc(doc(db, caminhoUsuario))
      }

      if (!usuarioDoc.exists()) {
        throw new Error('Usuário não encontrado nesta localização')
      }

      console.log('✅ Usuário encontrado em:', caminhoUsuario)
      const usuario = usuarioDoc.data()
      
      if (usuario.senha !== senha) {
        throw new Error('CPF ou senha inválidos')
      }

      const userData = {
        nome: usuario.nome,
        cpf: usuario.cpf,
        codigoPais: usuario.codigoPais,
        whatsapp: usuario.whatsapp,
        pais,
        estado,
        lumisial
      }
      
      setUser(userData)
      localStorage.setItem('gnosis_user', JSON.stringify(userData))
      
      // Se "manter logado" foi selecionado, definir data de expiração para 7 dias
      if (manterLogado) {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('gnosis_login_expiry', expiryDate.toISOString())
      } else {
        // Se não manter logado, remover qualquer expiração existente
        localStorage.removeItem('gnosis_login_expiry')
      }
      
      return true
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gnosis_user')
    localStorage.removeItem('gnosis_login_expiry')
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider 