const mutations = {
  INIT (state, user) {
    state.name = user && user.name ? user.name : ''
    state.group = user && user.group ? user.group : ''
  },
  
  SET_AUTH (state, flag) {
    state.auth = flag
  },

  SET_CAN_MANAGE (state, flag) {
    state.canManage = flag === true
  },

  CLEAR (state) {
    state.name = ''
    state.group = ''
    state.auth = false
    state.canManage = false
  }
}

export default mutations
