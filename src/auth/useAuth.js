import { useContext } from 'react'
import { SessionContext } from './sessionContext'
export const useAuth = () => useContext(SessionContext)
