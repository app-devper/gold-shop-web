import axios from 'axios'
import { useAuthStore } from '../store/auth'

// Base instance for UM API
export const umApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_UM_API_URL,
})

// Interceptor to add auth token
umApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Dynamic Gold Shop API instance
export const goldApi = axios.create()

// Interceptor to add auth token and dynamic baseURL
goldApi.interceptors.request.use((config) => {
  const state = useAuthStore.getState()
  const token = state.accessToken
  const host = state.host

  if (!host) {
    throw new Error('No host configured. Please login again.')
  }

  config.baseURL = host
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor to unwrap { success, data } envelope
goldApi.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
    response.data = response.data.data
  }
  return response
})
