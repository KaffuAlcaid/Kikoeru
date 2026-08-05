<template>
  <q-card style="width: 70vw; max-width: 760px; min-width: 320px">
    <q-card-section class="q-pb-sm">
      <div class="text-h6">修改作品信息</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-input
        v-model="editTitle"
        filled
        label="编辑标题"
        :disable="saving"
      />
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="text-caption text-grey q-mb-xs">社团</div>
      <q-chip size="md" color="primary" text-color="white" class="shadow-4">
        {{ editCircle.name }}
      </q-chip>
      <q-btn
        round
        color="deep-orange"
        icon="swap_horiz"
        size="sm"
        class="q-ml-sm"
        aria-label="替换社团"
        :disable="saving"
        @click="openCandidateDialog('circles')"
      />
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="text-caption text-grey q-mb-xs">标签</div>
      <q-chip
        v-for="(tag, index) in editTags"
        :key="`${tag.id}-${tag.name}`"
        removable
        size="md"
        color="secondary"
        text-color="white"
        class="shadow-4"
        :disable="saving"
        @remove="removeTagAt(index)"
      >
        {{ tag.name }}
      </q-chip>
      <q-btn
        round
        color="deep-orange"
        icon="add"
        size="sm"
        class="q-ml-sm"
        aria-label="添加标签"
        :disable="saving"
        @click="openCandidateDialog('tags')"
      />
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="text-caption text-grey q-mb-xs">声优</div>
      <q-chip
        v-for="(va, index) in editVas"
        :key="`${va.id}-${va.name}`"
        removable
        square
        size="md"
        color="primary"
        text-color="white"
        icon="mic"
        class="shadow-4"
        :disable="saving"
        @remove="removeVaAt(index)"
      >
        {{ va.name }}
      </q-chip>
      <q-btn
        round
        color="deep-orange"
        icon="add"
        size="sm"
        class="q-ml-sm"
        aria-label="添加声优"
        :disable="saving"
        @click="openCandidateDialog('vas')"
      />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="取消" color="grey" :disable="saving" v-close-popup />
      <q-btn label="确定" color="primary" :loading="saving" @click="confirmChange" />
    </q-card-actions>

    <q-dialog v-model="showCandidateDialog">
      <q-card style="width: 70vw; max-width: 680px">
        <q-card-section>
          <div class="text-h6">{{ searchTitle }}</div>
          <q-input v-model="searchCandidate" label="搜索" autofocus clearable>
            <template v-slot:append>
              <q-btn
                v-if="canAddCustomCandidate"
                flat
                dense
                label="增加自定义"
                @click="chooseCandidate({ id: 0, name: normalizedSearchCandidate })"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-scroll-area style="height: 40vh">
            <q-list dense bordered separator class="rounded-borders">
              <q-item
                v-for="candidate in filteredCandidates"
                :key="`${candidate.id}-${candidate.name}`"
                clickable
                v-ripple
                @click="chooseCandidate(candidate)"
              >
                <q-item-section>{{ candidate.name }}</q-item-section>
                <q-item-section side>{{ candidate.count }}</q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script>
import NotifyMixin from '../mixins/Notification.js'
import { ServerApi } from 'src/utils'

const DEFAULT_VA = { id: 0, name: 'N/A' }

function cloneList(list) {
  return Array.isArray(list)
    ? list.filter(item => item && item.name !== null).map(item => ({ id: item.id, name: item.name }))
    : []
}

export default {
  name: 'EditMeta',

  mixins: [NotifyMixin],

  props: {
    workid: {
      type: Number,
      required: true
    },
    metadata: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      saving: false,
      showCandidateDialog: false,
      editTitle: '',
      editTags: [],
      editVas: [],
      editCircle: { id: 0, name: '' },
      candidates: {
        tags: [],
        vas: [],
        circles: []
      },
      showCandidateType: 'tags',
      searchTitle: '',
      searchCandidate: ''
    }
  },

  computed: {
    normalizedSearchCandidate () {
      return String(this.searchCandidate || '').trim()
    },

    filteredCandidates () {
      const keyword = this.normalizedSearchCandidate.toLocaleLowerCase()
      const candidates = this.candidates[this.showCandidateType] || []
      if (!keyword) return candidates
      return candidates.filter(candidate => String(candidate.name).toLocaleLowerCase().includes(keyword))
    },

    canAddCustomCandidate () {
      return this.normalizedSearchCandidate.length > 0 && this.filteredCandidates.length === 0
    }
  },

  created () {
    this.resetForm()
    this.loadCandidates()
  },

  methods: {
    resetForm () {
      this.editTitle = this.metadata.title || ''
      this.editTags = cloneList(this.metadata.tags)
      this.editVas = cloneList(this.metadata.vas)
      if (this.editVas.length === 0) this.editVas = [{ ...DEFAULT_VA }]
      this.editCircle = this.metadata.circle
        ? { id: this.metadata.circle.id, name: this.metadata.circle.name }
        : { id: 0, name: '' }
    },

    async loadCandidates () {
      const types = ['circle', 'va', 'tag']
      const results = await Promise.all(types.map(type => ServerApi.getCandidates(type)
        .then(value => ({ value }))
        .catch(error => ({ error }))))
      results.forEach((result, index) => {
        const key = `${types[index]}s`
        if (!result.error) {
          this.candidates[key] = result.value
        } else {
          this.showErrNotif(`加载${this.candidateLabel(key)}候选项失败`)
        }
      })
    },

    candidateLabel (type) {
      return {
        circles: '社团',
        tags: '标签',
        vas: '声优'
      }[type] || '元数据'
    },

    openCandidateDialog (type) {
      this.showCandidateType = type
      this.searchTitle = type === 'circles' ? '替换社团' : `添加${this.candidateLabel(type)}`
      this.searchCandidate = ''
      this.showCandidateDialog = true
    },

    removeVaAt (index) {
      if (this.editVas.length <= 1) {
        this.showErrNotif('声优至少得有一个')
        return
      }
      this.editVas.splice(index, 1)
    },

    removeTagAt (index) {
      this.editTags.splice(index, 1)
    },

    chooseCandidate (candidate) {
      const item = { id: candidate.id, name: candidate.name }
      if (this.showCandidateType === 'circles') {
        this.editCircle = item
      } else {
        const target = this.showCandidateType === 'vas' ? this.editVas : this.editTags
        if (target.some(existing => existing.name === item.name)) {
          this.showErrNotif('项目已存在，无需重复添加')
          return
        }
        target.push(item)
      }
      this.showCandidateDialog = false
    },

    async confirmChange () {
      const title = this.editTitle.trim()
      if (!title) {
        this.showErrNotif('标题不能为空')
        return
      }
      if (!this.editCircle.name) {
        this.showErrNotif('请选择社团')
        return
      }

      this.saving = true
      try {
        const result = await ServerApi.saveEditMeta(this.workid, {
          title,
          tags: cloneList(this.editTags),
          vas: cloneList(this.editVas),
          circle: { ...this.editCircle }
        })
        if (!result.success) throw new Error(result.message || '服务器未确认修改成功')
        this.showSuccNotif('作品信息修改成功')
        this.$emit('saved')
      } catch (error) {
        const message = error.response && error.response.data
          ? error.response.data.error || error.response.data.message
          : error.message
        this.showErrNotif(`作品信息修改失败: ${message || error}`)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
