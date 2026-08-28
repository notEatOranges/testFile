<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { get } from '../core/request'
import { showToast, showConfirmDialog } from 'vant'
import NavBar from '../components/NavBar.vue'
import Sheet from '../components/Sheet.vue'
import IconMove from '~icons/lucide/move-horizontal'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash'
import IconChev from '~icons/lucide/chevron-right'
import IconHeart from '~icons/lucide/heart'

const auth = useAuth()
const questions = ref([])
let un

onMounted(() => {
  un = store.onList('truthbox/questions', (v) => { questions.value = v })
})
onUnmounted(() => { un && un() })

const CATS = [
  { key: 'icebreak', name: '破冰' },
  { key: 'sweet', name: '甜蜜' },
  { key: 'deep', name: '深度' },
  { key: 'adventure', name: '冒险' },
  { key: 'wilder', name: '脑洞' }
]
const catName = Object.fromEntries(CATS.map((c) => [c.key, c.name]))

// 等我回答的题（新→旧），rotateOffset 实现「换一张」
const rotate = ref(0)
const deck = computed(() => {
  const mine = questions.value.filter((q) => !(q.answers && q.answers[auth.user.role]))
  if (!mine.length) return []
  const off = rotate.value % mine.length
  return [...mine.slice(off), ...mine.slice(0, off)].slice(0, 3)
})
function swap() { rotate.value++ }

const busy = ref(false)
async function draw(catKey) {
  busy.value = true
  try {
    const res = await get(`/api/truth/draw?category=${catKey}`)
    const q = res.questions[0]
    await store.push('truthbox/questions', { text: q, category: catKey, createdBy: auth.user.role, createdTs: Date.now(), answers: {} })
    rotate.value = 0
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}

// ── 作答 ──
const showAnswer = ref(false)
const current = ref(null)
const myText = ref('')
const locked = computed(() => !!(current.value && current.value.answers && current.value.answers[auth.peerRole]))
const peerAnswer = computed(() => {
  const q = current.value
  if (!q || !q.answers || !q.answers[auth.user.role]) return null // 自己答了才能看 ta 的
  return q.answers[auth.peerRole] || null
})
function openAnswer(q) {
  current.value = q
  myText.value = (q.answers && q.answers[auth.user.role]?.text) || ''
  showAnswer.value = true
}
async function submitAnswer() {
  if (!myText.value.trim()) return showToast('写点什么吧')
  const q = current.value
  await store.transaction('truthbox/questions', (v) => {
    v = v || {}
    if (v[q.id]) {
      v[q.id].answers = v[q.id].answers || {}
      v[q.id].answers[auth.user.role] = { text: myText.value.trim(), ts: Date.now() }
    }
    return v
  })
  showToast(locked.value ? '已提交（双方都已回答，答案锁定）' : '已提交，等 ta 回答后互相可见')
  showAnswer.value = false
}

// ── 出题 ──
const showNew = ref(false)
const newText = ref('')
const newCat = ref('sweet')
async function createQuestion() {
  const t = newText.value.trim()
  if (!t) return showToast('写下你的问题')
  await store.push('truthbox/questions', { text: t, category: newCat.value, createdBy: auth.user.role, createdTs: Date.now(), answers: {} })
  showToast('已放进题堆')
  newText.value = ''
  showNew.value = false
}

// ── 全部题目 ──
const showAll = ref(false)
function statusText(q) {
  const mine = q.answers && q.answers[auth.user.role]
  const peers = q.answers && q.answers[auth.peerRole]
  if (mine && peers) return '你们都回答了'
  if (mine) return '等 ta 回答'
  if (peers) return '等你回答'
  return '都还没回答'
}
async function delQuestion(q) {
  try {
    await showConfirmDialog({ title: '删除问题', message: '确定删除这道题吗？双方的回答会一起删掉。' })
  } catch { return }
  await store.transaction('truthbox/questions', (v) => { if (v && v[q.id]) delete v[q.id]; return v })
}
</script>

<template>
  <div class="page">
    <NavBar title="真心话" back />
    <div class="body">
      <div class="sec" style="margin-top: 4px">来一题</div>
      <div class="chiprow">
        <button v-for="c in CATS" :key="c.key" class="chip" :class="{ dis: busy }" @click="draw(c.key)">{{ c.name }}</button>
      </div>

      <!-- 堆叠卡组 -->
      <div v-if="deck.length" class="deck">
        <div v-for="(q, i) in [...deck].reverse()" :key="q.id" class="tcard" :class="{ top: i === deck.length - 1, mid2: i === deck.length - 2, back: i === deck.length - 3 }"
             @click="i === deck.length - 1 && openAnswer(q)">
          <template v-if="i === deck.length - 1">
            <div class="trow">
              <span class="rbd">{{ catName[q.category] || '甜蜜' }}</span>
              <span class="by">{{ q.createdBy === auth.user.role ? '我' : auth.peerName }} 出的题</span>
            </div>
            <div class="q">{{ q.text }}</div>
            <div class="thint"><IconMove style="width: 14px; height: 14px" />点击作答<template v-if="deck.length > 1"> · <button class="swap" @click.stop="swap">换一张 →</button></template></div>
          </template>
        </div>
      </div>
      <div v-else class="emptybox" style="padding: 26px 0">
        <IconHeart />
        <span>题堆空了，点上面的分类抽一题</span>
      </div>

      <button class="btn ghost" @click="showNew = true"><IconPlus style="width: 16px; height: 16px" />我自己出一题</button>

      <div class="sec">等你回答 <span style="font-size: 11px; font-weight: 400">还剩 {{ questions.filter((q) => !(q.answers && q.answers[auth.user.role])).length }} 题</span></div>
      <div class="grp">
        <button v-for="q in questions.filter((x) => !(x.answers && x.answers[auth.user.role])).slice(0, 6)" :key="q.id" class="cellrow" @click="openAnswer(q)">
          <span class="ttl small">{{ q.text }}</span>
          <span class="val">{{ catName[q.category] }}</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
      </div>

      <button class="allbtn" @click="showAll = true">全部题目（{{ questions.length }}）→</button>
    </div>

    <!-- 作答 -->
    <Sheet :show="showAnswer" @close="showAnswer = false">
      <template v-if="current">
        <div class="trow">
          <span class="rbd">{{ catName[current.category] || '甜蜜' }}</span>
          <span class="by">{{ current.createdBy === auth.user.role ? '我' : auth.peerName }} 出的题</span>
        </div>
        <div class="qtext">{{ current.text }}</div>
        <div class="lab2">我的回答</div>
        <div class="ta">
          <textarea v-model="myText" maxlength="200" rows="3" :disabled="locked" style="width: 100%; border: none; outline: none; background: transparent; resize: none; font-size: 14px; color: var(--text)" placeholder="写下来…" />
          <span v-if="locked" class="locked">已锁定</span>
        </div>
        <div class="lab2">ta 的回答</div>
        <div class="peerbox">
          <template v-if="peerAnswer">{{ peerAnswer.text }}</template>
          <span v-else-if="!myText.trim()" class="hint2">先回答才能看到 ta 的答案；ta 回答后你的答案会锁定</span>
          <span v-else class="hint2">ta 还没回答，答完互相可见</span>
        </div>
        <button v-if="!locked" class="btn" @click="submitAnswer">提交</button>
      </template>
    </Sheet>

    <!-- 出题 -->
    <Sheet :show="showNew" @close="showNew = false">
      <h3>我自己出一题</h3>
      <div class="form" style="margin-top: 14px">
        <div class="ta"><textarea v-model="newText" maxlength="60" rows="2" style="width: 100%; border: none; outline: none; background: transparent; resize: none; font-size: 14px; color: var(--text)" placeholder="想问 ta 什么？" /><span class="cnt">{{ newText.length }} / 60</span></div>
        <div class="chiprow">
          <button v-for="c in CATS" :key="c.key" class="chip" :class="{ on: newCat === c.key }" @click="newCat = c.key">{{ c.name }}</button>
        </div>
        <button class="btn" @click="createQuestion">放进题堆</button>
      </div>
    </Sheet>

    <!-- 全部题目 -->
    <Sheet :show="showAll" @close="showAll = false">
      <h3>全部题目</h3>
      <div class="sub">{{ questions.length }} 题 · 点卡可作答</div>
      <div class="alllist">
        <div v-for="q in [...questions].reverse()" :key="q.id" class="qcard" @click="openAnswer(q)">
          <div class="trow">
            <span class="rbd">{{ catName[q.category] || '甜蜜' }}</span>
            <span class="status" :class="{ both: q.answers?.[auth.user.role] && q.answers?.[auth.peerRole] }">{{ statusText(q) }}</span>
            <button class="qdel" @click.stop="delQuestion(q)"><IconTrash style="width: 13px; height: 13px" /></button>
          </div>
          <div class="qline">{{ q.text }}</div>
          <div class="by">{{ q.createdBy === auth.user.role ? '我' : auth.peerName }} 出的题</div>
        </div>
      </div>
    </Sheet>
  </div>
</template>

<style scoped>
.deck { position: relative; height: 210px; margin: 16px 0 14px; }
.tcard { position: absolute; inset: 0; background: var(--card); border-radius: 20px; padding: 16px; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; }
.tcard.top { z-index: 3; cursor: pointer; }
.tcard.mid2 { transform: translate(7px, 6px) scale(.978); opacity: .85; z-index: 2; }
.tcard.back { transform: translate(14px, 12px) scale(.955); opacity: .65; z-index: 1; }
.trow { display: flex; align-items: center; gap: 8px; }
.rbd { font-size: 10.5px; padding: 4px 10px; border-radius: 999px; background: var(--chip); color: var(--primary-deep); font-weight: 500; }
.by { font-size: 10px; color: var(--text-soft); margin-left: auto; }
.q { flex: 1; font-size: 17px; font-weight: 600; line-height: 1.6; display: flex; align-items: center; }
.thint { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--text-soft); }
.swap { color: var(--primary-deep); font-size: 10.5px; font-weight: 600; }

.qtext { font-size: 16px; font-weight: 600; line-height: 1.6; margin: 12px 0 4px; }
.lab2 { font-size: 11px; color: var(--text-soft); margin: 12px 0 6px; }
.ta { background: var(--bg-1); border-radius: 14px; padding: 12px; position: relative; }
.ta .cnt { position: absolute; right: 10px; bottom: 6px; font-size: 10px; color: var(--text-soft); }
.locked { position: absolute; right: 10px; top: 10px; font-size: 10px; color: var(--text-soft); background: var(--chip); border-radius: 999px; padding: 2px 8px; }
.peerbox { background: var(--bg-1); border-radius: 14px; padding: 12px; font-size: 14px; min-height: 60px; color: var(--text); }
.hint2 { font-size: 12px; color: var(--text-soft); }

.allbtn { display: block; width: 100%; text-align: center; font-size: 13px; color: var(--primary-deep); background: var(--chip); border-radius: 14px; padding: 13px; margin-top: 16px; font-weight: 600; }
.alllist { max-height: 50vh; overflow-y: auto; margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.qcard { background: var(--bg-1); border-radius: 14px; padding: 12px; }
.status { font-size: 10px; color: var(--text-soft); }
.status.both { color: var(--success); font-weight: 600; }
.qdel { margin-left: auto; color: var(--text-soft); opacity: .6; display: flex; padding: 2px; }
.qline { font-size: 14px; margin: 8px 0 4px; }
</style>
