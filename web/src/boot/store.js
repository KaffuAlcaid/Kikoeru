import { defineBoot } from '#q-app/wrappers'
import store from '../store'

export default defineBoot(({ app }) => {
  app.use(store)
})
