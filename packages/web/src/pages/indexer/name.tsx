import ErrorPlaceholder from '#/components/ErrorPlaceholder'
import Loading from '#/components/Loading'
import MediumDialog from '#/components/MediumDialog'
import NameDetail from '#/components/NameDetail'
import { useNameServicesState, useNameState } from '@ldclabs/store'
import { useCallback, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function NameStatePage() {
  const intl = useIntl()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    item: nameState,
    isLoading,
    error,
  } = useNameState(searchParams.get('name') || '')

  const { items: servicesState } = useNameServicesState(nameState?.name || '')

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        navigate('/indexer')
      }, 5000)
    }
  }, [intl, navigate, error])

  const handleNameStateClose = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return isLoading ? (
    <Loading />
  ) : error ? (
    <ErrorPlaceholder error={error} />
  ) : (
    nameState && (
      <MediumDialog
        open={true}
        onClose={handleNameStateClose}
        title={intl.formatMessage({ defaultMessage: 'Name State' })}
      >
        <NameDetail nameState={nameState} servicesState={servicesState} />
      </MediumDialog>
    )
  )
}
