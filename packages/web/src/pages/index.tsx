import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RedirectIndexer() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/indexer')
  }, [navigate])

  return null
}
