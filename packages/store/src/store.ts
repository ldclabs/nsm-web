import localForage from 'localforage'

localForage.config({
  name: 'ns',
})

export const authStore = localForage.createInstance({ name: 'ns:auth' })
