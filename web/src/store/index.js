import { createStore } from 'vuex'

import AudioPlayer from './module-AudioPlayer'
import User from './module-User'

const store = createStore({
  modules: {
    AudioPlayer,
    User
  },
  strict: import.meta.env.DEV
})

export default store
