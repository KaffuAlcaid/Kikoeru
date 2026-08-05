<template>
  <q-page class="playlist-page q-pa-md">
    <div class="row items-center q-mb-md"><div><div class="text-h5">播放列表</div><div class="text-caption text-grey-7">当前会话的播放队列</div></div><q-space /><q-btn v-if="queue.length" flat color="negative" icon="delete_sweep" label="清空" @click="EMPTY_QUEUE" /></div>
    <q-card flat bordered class="playlist-card">
      <q-list separator v-if="queue.length"><q-item v-for="(track, index) in queue" :key="`${track.hash}-${index}`" clickable v-ripple :active="queueIndex === index" active-class="bg-primary text-white" @click="SET_TRACK(index)"><q-item-section avatar><q-img :src="coverUrl(track.hash)" ratio="1" class="rounded-borders" /></q-item-section><q-item-section><q-item-label lines="1">{{ track.title }}</q-item-label><q-item-label caption lines="1" :class="{ 'text-white': queueIndex === index }">{{ track.workTitle }}</q-item-label></q-item-section><q-item-section side><q-btn flat round dense icon="close" :color="queueIndex === index ? 'white' : 'negative'" @click.stop="REMOVE_FROM_QUEUE(index)" aria-label="从播放列表移除" /></q-item-section></q-item></q-list>
      <q-card-section v-else class="text-center text-grey q-pa-xl"><q-icon name="queue_music" size="42px" class="q-mb-sm" /><div>播放列表为空</div><div class="text-caption">从作品详情播放曲目后会显示在这里。</div></q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
export default { name: 'Playlist', computed: mapState('AudioPlayer', ['queue', 'queueIndex']), methods: { ...mapMutations('AudioPlayer', ['SET_TRACK', 'REMOVE_FROM_QUEUE', 'EMPTY_QUEUE']), coverUrl (hash) { return hash ? `/api/cover/${hash.split('/')[0]}?type=sam` : '' } } }
</script>

<style lang="scss" scoped>
.playlist-page { max-width: 880px; margin: 0 auto; }
.playlist-card { border-radius: 8px; overflow: hidden; }
</style>
