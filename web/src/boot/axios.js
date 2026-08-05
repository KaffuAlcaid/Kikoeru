import axios from 'axios'
import { defineBoot } from '#q-app/wrappers'

axios.defaults.headers.common['Content-Type'] = 'application/json'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
})
