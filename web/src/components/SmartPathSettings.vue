<template>
  <q-item tag="label" class="smart-path-row">
    <q-item-section>
      <q-item-label>智能路径</q-item-label>
      <q-item-label caption>打开作品后，自动进入包含音频的文件夹。</q-item-label>
    </q-item-section>
    <q-item-section side class="smart-path-control">
      <q-toggle :model-value="enabled" color="primary" @update:model-value="$emit('update:enabled', $event)" />
    </q-item-section>
  </q-item>

  <q-item tag="label" class="smart-path-row" :disable="!enabled">
    <q-item-section>
      <q-item-label>效果音偏好</q-item-label>
      <q-item-label caption>优先进入效果音目录。</q-item-label>
    </q-item-section>
    <q-item-section side class="smart-path-control">
      <q-toggle :model-value="preferEffect" :disable="!enabled" color="primary" @update:model-value="$emit('update:preferEffect', $event)" />
    </q-item-section>
  </q-item>

  <q-item class="smart-path-row" :disable="!enabled">
    <q-item-section>
      <q-item-label>音频类型优先级</q-item-label>
      <q-item-label caption>优先进入包含靠前格式的音频目录。</q-item-label>
    </q-item-section>
    <q-item-section side class="smart-path-control smart-path-control--order">
      <q-btn flat dense no-caps icon-right="sort" :disable="!enabled" :label="audioTypeLabel" aria-label="调整音频类型优先级" @click="showAudioTypeDialog = true" />
    </q-item-section>
  </q-item>

  <q-dialog v-model="showAudioTypeDialog">
    <q-card class="smart-path-dialog">
      <q-card-section class="row items-center no-wrap">
        <div class="text-subtitle1 text-weight-medium">音频类型优先级</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" aria-label="关闭" />
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item v-for="(type, index) in orderedTypes" :key="type" class="smart-path-type-row">
          <q-item-section avatar><div class="smart-path-rank">{{ index + 1 }}</div></q-item-section>
          <q-item-section><q-item-label class="text-weight-medium">{{ type }}</q-item-label></q-item-section>
          <q-item-section side>
            <div class="row no-wrap">
              <q-btn flat round dense icon="arrow_upward" :disable="index === 0" :aria-label="`${type} 上移`" @click="moveType(index, -1)" />
              <q-btn flat round dense icon="arrow_downward" :disable="index === orderedTypes.length - 1" :aria-label="`${type} 下移`" @click="moveType(index, 1)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator />
      <q-card-actions align="right"><q-btn v-close-popup flat no-caps color="primary" label="完成" /></q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { normalizeSmartPathAudioTypes } from '../store/module-AudioPlayer/state'

export default {
  name: 'SmartPathSettings',

  props: {
    enabled: { type: Boolean, default: true },
    preferEffect: { type: Boolean, default: true },
    audioTypes: { type: String, default: '' },
  },

  emits: ['update:enabled', 'update:preferEffect', 'update:audioTypes'],

  data () {
    return { showAudioTypeDialog: false }
  },

  computed: {
    orderedTypes () {
      return normalizeSmartPathAudioTypes(this.audioTypes).split(',')
    },
    audioTypeLabel () {
      return this.orderedTypes.join(' > ')
    },
  },

  methods: {
    moveType (index, offset) {
      const next = this.orderedTypes.slice()
      const targetIndex = index + offset
      if (targetIndex < 0 || targetIndex >= next.length) return
      const [type] = next.splice(index, 1)
      next.splice(targetIndex, 0, type)
      this.$emit('update:audioTypes', next.join(','))
    },
  },
}
</script>

<style lang="scss" scoped>
.smart-path-row { min-height: 76px; }
.smart-path-control { padding-left: 24px; }
.smart-path-control--order { max-width: min(100%, 390px); }
.smart-path-control--order :deep(.q-btn) { min-height: 36px; padding: 4px 8px 4px 12px; color: var(--q-primary); }
.smart-path-control--order :deep(.q-btn__content) { flex-wrap: nowrap; }
.smart-path-control--order :deep(.block) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.smart-path-dialog { width: 360px; max-width: calc(100vw - 32px); border-radius: 6px; }
.smart-path-type-row { min-height: 52px; }
.smart-path-rank { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 4px; color: var(--q-primary); background: rgba(var(--kikoeru-accent-rgb), .1); font-weight: 600; font-variant-numeric: tabular-nums; }

@media (max-width: 699px) {
  .smart-path-row { min-height: 72px; align-items: flex-start; flex-wrap: wrap; gap: 12px; padding-top: 14px; padding-bottom: 14px; }
  .smart-path-control { width: 100%; min-width: 0; align-items: flex-start; padding-left: 0; }
  .smart-path-control--order { max-width: 100%; }
  .smart-path-control--order :deep(.q-btn) { max-width: 100%; }
}
</style>
