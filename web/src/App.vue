<template>
  <router-view />
</template>

<script>
import { applyAccentColor, readAccentColor } from './themeColor'

export default {
  name: 'App',

  created () {
    applyAccentColor(readAccentColor(), { persist: false })
  }
}
</script>
