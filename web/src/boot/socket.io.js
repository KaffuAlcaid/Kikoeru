import { defineBoot } from '#q-app/wrappers'
import socket from '../socket'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$socket = socket
})
