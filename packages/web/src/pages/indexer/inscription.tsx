import ErrorPlaceholder from '#/components/ErrorPlaceholder'
import InscriptionDetail from '#/components/InscriptionDetail'
import Loading from '#/components/Loading'
import MediumDialog from '#/components/MediumDialog'
import { useInscription } from '@nsm-web/store'
import { useCallback, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function InscriptionPage() {
  const intl = useIntl()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    item: inscription,
    isLoading,
    error,
  } = useInscription({
    height: searchParams.get('height') || '',
    name: searchParams.get('name') || '',
    sequence: searchParams.get('sequence') || '',
    best: searchParams.get('best') == 'true',
  })

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        navigate('/indexer')
      }, 5000)
    }
  }, [intl, navigate, error])

  const handleInscriptionClose = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return isLoading ? (
    <Loading />
  ) : error ? (
    <ErrorPlaceholder error={error} />
  ) : (
    inscription && (
      <MediumDialog
        open={true}
        onClose={handleInscriptionClose}
        title={intl.formatMessage({ defaultMessage: 'Inscription' })}
      >
        <InscriptionDetail inscription={inscription} />
      </MediumDialog>
    )
  )
}
