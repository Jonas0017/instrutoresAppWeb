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
  login: (cpf: string, senha: string, pais: string, estado: string, lumisial: string) => Promise<boolean>
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
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        localStorage.removeItem('gnosis_user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (cpf: string, senha: string, pais: string, estado: string, lumisial: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Buscar o usuário na localização específica fornecida (igual ao app móvel)
      const caminhoUsuario = `paises/${pais}/estados/${estado}/lumisial/${lumisial}/instrutor/${cpf}`
      const usuarioRef = doc(db, caminhoUsuario)
      const usuarioDoc = await getDoc(usuarioRef)

      if (!usuarioDoc.exists()) {
        throw new Error('Usuário não encontrado nesta localização')
      }

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
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider 