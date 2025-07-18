import { useState, useCallback } from 'react'
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db as firestore } from '@/lib/firebase'
import { useAuth } from '../context/AuthContext'

export const useFirebase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Função para obter o caminho base do Firestore
  // Corrigido: usando 'lumisial' (singular) conforme a estrutura real
  const getBasePath = useCallback(() => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    return `paises/${user.pais}/estados/${user.estado}/lumisial/${user.lumisial}`
  }, [user])

  // Buscar documentos de uma coleção
  const fetchCollection = useCallback(async (collectionPath: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const basePath = getBasePath()
      const fullPath = `${basePath}/${collectionPath}`
      const querySnapshot = await getDocs(collection(firestore, fullPath))
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getBasePath])

  // Adicionar documento
  const addDocument = useCallback(async (collectionPath: string, data: any, id?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const basePath = getBasePath()
      const fullPath = `${basePath}/${collectionPath}`
      const collectionRef = collection(firestore, fullPath)
      
      if (id) {
        await setDoc(doc(collectionRef, id), data)
        return id
      } else {
        const docRef = doc(collectionRef)
        await setDoc(docRef, data)
        return docRef.id
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getBasePath])

  // Atualizar documento
  const updateDocument = useCallback(async (collectionPath: string, id: string, data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const basePath = getBasePath()
      const fullPath = `${basePath}/${collectionPath}`
      await updateDoc(doc(firestore, fullPath, id), data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getBasePath])

  // Deletar documento
  const deleteDocument = useCallback(async (collectionPath: string, id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const basePath = getBasePath()
      const fullPath = `${basePath}/${collectionPath}`
      await deleteDoc(doc(firestore, fullPath, id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getBasePath])

  return {
    loading,
    error,
    fetchCollection,
    addDocument,
    updateDocument,
    deleteDocument
  }
} 