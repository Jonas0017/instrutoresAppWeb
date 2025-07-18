import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, db } from '@/lib/firebase'

interface GeographicData {
  paises: string[]
  estados: { [pais: string]: string[] }
  lumisiais: { [paisEstado: string]: string[] }
}

const CACHE_KEY = 'gnosis_geographic_data'
const CACHE_EXPIRY_KEY = 'gnosis_geographic_data_expiry'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export const useGeographicData = () => {
  const [data, setData] = useState<GeographicData>({
    paises: [],
    estados: {},
    lumisiais: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    const cachedData = localStorage.getItem(CACHE_KEY)
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)
    
    if (!cachedData || !cacheExpiry) return false
    
    return Date.now() < parseInt(cacheExpiry)
  }, [])

  // Carregar dados do cache
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        setData(parsedData)
        return true
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error)
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
    }
    return false
  }, [])

  // Salvar dados no cache
  const saveToCache = useCallback((geographicData: GeographicData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(geographicData))
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString())
    } catch (error) {
      console.error('Erro ao salvar cache:', error)
    }
  }, [])

  // Buscar países
  const fetchPaises = useCallback(async () => {
    try {
      // Buscar todos os documentos da coleção 'paises'
      const paisesCollection = collection(db, 'paises')
      const paisesSnapshot = await getDocs(paisesCollection)
      const paises = paisesSnapshot.docs.map(doc => doc.id)
      
      if (paises.length === 0) {
        throw new Error('Nenhum país encontrado')
      }
      
      return paises
    } catch (error) {
      console.error('Erro ao buscar países:', error)
      throw error
    }
  }, [])

  // Buscar estados de um país
  const fetchEstados = useCallback(async (pais: string) => {
    try {
      // Buscar todos os documentos da coleção 'estados' dentro do país
      const estadosCollection = collection(db, `paises/${pais}/estados`)
      const estadosSnapshot = await getDocs(estadosCollection)
      
      const estados = estadosSnapshot.docs.map(doc => doc.id)
      
      if (estados.length === 0) {
        console.warn(`Nenhum estado encontrado para ${pais}`)
        return []
      }
      
      return estados
    } catch (error) {
      console.error('Erro ao buscar estados:', error)
      throw error
    }
  }, [])

  // Buscar lumisiais de um estado (corrigido: 'lumisial' não 'lumisiais')
  const fetchLumisiais = useCallback(async (pais: string, estado: string) => {
    try {
      // Buscar todos os documentos da coleção 'lumisial' dentro do estado
      const lumisiaisCollection = collection(db, `paises/${pais}/estados/${estado}/lumisial`)
      const lumisiaisSnapshot = await getDocs(lumisiaisCollection)
      
      const lumisiais = lumisiaisSnapshot.docs.map(doc => doc.id)
      
      if (lumisiais.length === 0) {
        console.warn(`Nenhum lumisial encontrado para ${pais}/${estado}`)
        return []
      }
      
      return lumisiais
    } catch (error) {
      console.error('Erro ao buscar lumisiais:', error)
      // Retorna array vazio ao invés de lançar erro para não quebrar o fluxo
      return []
    }
  }, [])

  // Carregar todos os dados geográficos
  const loadGeographicData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Verificar cache primeiro
      if (isCacheValid() && loadFromCache()) {
        setLoading(false)
        return
      }

      console.log('Carregando dados geográficos do Firestore...')

      // Buscar países
      const paises = await fetchPaises()
      console.log('Países encontrados:', paises)

      const newData: GeographicData = {
        paises,
        estados: {},
        lumisiais: {}
      }

      // Buscar estados para cada país
      for (const pais of paises) {
        try {
          const estados = await fetchEstados(pais)
          console.log(`Estados de ${pais}:`, estados)
          newData.estados[pais] = estados

          // Buscar lumisiais para cada estado
          for (const estado of estados) {
            try {
              const lumisiais = await fetchLumisiais(pais, estado)
              console.log(`Lumisiais de ${pais}/${estado}:`, lumisiais)
              newData.lumisiais[`${pais}/${estado}`] = lumisiais
            } catch (error) {
              console.warn(`Erro ao buscar lumisiais para ${pais}/${estado}:`, error)
              newData.lumisiais[`${pais}/${estado}`] = []
            }
          }
        } catch (error) {
          console.warn(`Erro ao buscar estados para ${pais}:`, error)
          newData.estados[pais] = []
        }
      }

      console.log('Dados carregados:', newData)
      setData(newData)
      saveToCache(newData)
    } catch (error) {
      console.error('Erro ao carregar dados geográficos:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [isCacheValid, loadFromCache, saveToCache, fetchPaises, fetchEstados, fetchLumisiais])

  // Verificar se um usuário existe em uma localização específica
  const checkUserExists = useCallback(async (cpf: string, pais: string, estado: string, lumisial: string) => {
    try {
      // Corrigido: usando estrutura igual ao app móvel
      const caminhoInstrutores = `paises/${pais}/estados/${estado}/lumisial/${lumisial}/instrutor`
      const usuariosCollection = collection(db, caminhoInstrutores)
      const usuariosSnapshot = await getDocs(usuariosCollection)
      
      // Buscar o usuário específico pelo CPF
      const usuarioDoc = usuariosSnapshot.docs.find(doc => doc.id === cpf)
      
      return usuarioDoc ? usuarioDoc.data() : null
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      return null
    }
  }, [])

  // Limpar cache manualmente
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    setData({
      paises: [],
      estados: {},
      lumisiais: {}
    })
  }, [])

  useEffect(() => {
    loadGeographicData()
  }, [loadGeographicData])

  return {
    data,
    loading,
    error,
    checkUserExists,
    clearCache,
    refreshData: loadGeographicData
  }
} 