<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { daysBetween, todayStr, sortEvents, countdownText, ANNIV_TYPES } from '../core/anniv'
import { copyText, inviteLink } from '../core/clip'
import { showToast } from 'vant'
import TabBar from '../components/TabBar.vue'
import Avatar from '../components/Avatar.vue'
import IconHeart from '~icons/lucide/heart'
import IconChat from '~icons/lucide/message-circle'
import IconGift from '~icons/lucide/gift'
import IconHelp from '~icons/lucide/help-circle'
import IconCal from '~icons/lucide/calendar'
import IconClock from '~icons/lucide/clock'
import IconImage from '~icons/lucide/image'
import IconGame from '~icons/lucide/gamepad-2'
import IconTrophy from '~icons/lucide/trophy'
import IconStar from '~icons/lucide/star'
import IconLink from '~icons/lucide/link'

const router = useRouter()
const auth = useAuth()
const startDate = ref('')
const mood = ref(null)
const events = ref([])
let un1, un2, un3

onMounted(async () => {
  un1 = store.onValue('anniversary', (v) => { startDate.value = (v && v.startDate) || '' })
  un2 = store.onValue('mood/' + todayStr(), (v) => { mood.value = v })
  un3 = store.onList('anniversary/events', (v) => { events.value = sortEvents(v) })
  await auth.refresh()
  const peer = auth.peer
  if (peer) auth.peerOnline = !!peer.online
})
onUnmounted(() => { un1 && un1(); un2 && un2(); un3 && un3() })

const days = computed(() => daysBetween(startDate.value))
const sinceText = computed(() => startDate.value ? `从 ${startDate.value.replaceAll('-', '.')} 起，每一天都有你` : '先去「纪念日」设置你们在一起的日子吧')
const myMood = computed(() => (mood.value && mood.value[auth.user.role]) || null)
const peerMood = computed(() => (mood.value && mood.value[auth.peerRole]) || null)
const hasPeer = computed(() => !!auth.peer)
const topEvents = computed(() => events.value.slice(0, 5))
const typeName = Object.fromEntries(ANNIV_TYPES.map((t) => [t.key, t.name]))
const typeIcon = { anniversary: IconHeart, birthday: IconGift, first: IconStar, festival: IconCal, countdown: IconClock }

const tiles = [
  { icon: IconChat, label: '悄悄对话', to: '/chat' },
  { icon: IconGift, label: '心愿清单', to: '/wishlist' },
  { icon: IconHelp, label: '真心话', to: '/truthbox' },
  { icon: IconCal, label: '纪念日', to: '/days' },
  { icon: IconClock, label: '历史心情', to: '/mood-history' },
  { icon: IconImage, label: '聊天背景', act: () => showToast('聊天背景在 M2 交付') },
  { icon: IconGame, label: '游戏大厅', to: '/games' },
  { icon: IconTrophy, label: '成绩榜', to: '/leaderboard' }
]
function go(t) { t.to ? router.push(t.to) : t.act() }
</script>

<template>
  <div class="page">
    <header class="nav">
      <span style="flex: 1; font-size: 17px; font-weight: 700">我们的小窝</span>
      <span v-if="hasPeer" class="pres">
        <span class="dot" v-if="auth.peerOnline" /><span v-else style="width: 8px; height: 8px; border-radius: 999px; background: var(--bg-3); flex: none" />
        <Avatar :size="20" :name="auth.peerName" :avatar="auth.peer && auth.peer.avatar" />
        {{ auth.peerName }}{{ auth.peerOnline ? '在线' : '不在线' }}
      </span>
    </header>

    <div class="body has-tab">
      <!-- 邀请提示：对方还没加入 -->
      <div v-if="!hasPeer && auth.couple" class="card invite-tip" @click="copyText(inviteLink(auth.couple.inviteCode || ''))">
        <IconLink style="width: 18px; height: 18px; flex: none" />
        <span>ta 还没加入，点这里复制邀请链接发给 ta</span>
      </div>

      <!-- 在一起天数 -->
      <div class="hero-days" @click="router.push('/days')">
        <span class="deco"><IconHeart style="width: 34px; height: 34px" /></span>
        <div class="lab">在 一 起</div>
        <div class="num"><b>{{ days }}</b><span>天</span></div>
        <div class="since">{{ sinceText }}</div>
      </div>

      <!-- 今日心情双卡（实时） -->
      <div class="sec">今日心情 <span style="font-size: 11px; font-weight: 400">记录功能 M2 交付</span></div>
      <div class="duo">
        <div class="mcard me" v-if="myMood" :style="myMood.bg ? { background: `linear-gradient(160deg, rgba(0,0,0,.15), rgba(0,0,0,.35)), url(${myMood.bg}) center/cover` } : {}" :class="{ plainbg: !myMood.bg }">
          <div class="who"><Avatar :size="18" :name="auth.displayName" :avatar="auth.user.avatar" />我 · {{ auth.displayName }}</div>
          <div class="emo">{{ myMood.emoji }}</div>
          <div class="tag">{{ myMood.label || '' }}</div>
          <div class="whi" v-if="myMood.whisper">{{ myMood.whisper }}</div>
        </div>
        <div class="mcard empty" v-else>
          <IconHeart style="width: 26px; height: 26px" />
          <span>还没记今日心情<br>（M2 支持记录）</span>
        </div>
        <div class="mcard empty" v-if="!peerMood">
          <IconHeart style="width: 26px; height: 26px" />
          <span>{{ auth.peerName }} 还没记<br>今日心情</span>
        </div>
        <div class="mcard peer" v-else :style="peerMood.bg ? { background: `linear-gradient(160deg, rgba(0,0,0,.15), rgba(0,0,0,.35)), url(${peerMood.bg}) center/cover` } : {}">
          <div class="who"><Avatar :size="18" :name="auth.peerName" :avatar="auth.peer && auth.peer.avatar" />{{ auth.peerName }}</div>
          <div class="emo">{{ peerMood.emoji }}</div>
          <div class="tag">{{ peerMood.label || '' }}</div>
          <div class="whi" v-if="peerMood.whisper">{{ peerMood.whisper }}</div>
        </div>
      </div>

      <!-- 纪念日横滑 -->
      <div class="sec">重要的日子 <router-link v-if="events.length" to="/days" style="font-size: 11px; font-weight: 400; color: var(--primary-deep); text-decoration: none">全部 →</router-link></div>
      <div class="hstrip" v-if="topEvents.length">
        <div class="achip" v-for="ev in topEvents" :key="ev.id">
          <span class="iconwrap"><component :is="typeIcon[ev.type] || IconCal" /></span>
          <div class="achip-t">
            <small>{{ ev.title }}</small>
            <b>{{ countdownText(ev.date, ev.recurrence) }}</b>
          </div>
        </div>
      </div>
      <div v-else class="hint" @click="router.push('/days')">还没有纪念日，点这里添加第一个重要日子 →</div>

      <!-- 功能宫格 -->
      <div class="sec">功能</div>
      <div class="gn">
        <button v-for="t in tiles" :key="t.label" class="gnav" @click="go(t)">
          <span class="iconwrap tile"><component :is="t.icon" /></span>
          <span class="glabel">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<style scoped>
.invite-tip { display: flex; gap: 10px; align-items: center; font-size: 12.5px; color: var(--primary-deep); background: var(--chip); box-shadow: none; margin-bottom: 14px; padding: 12px 14px; }
.hero-days { position: relative; background: var(--card); border-radius: 24px; box-shadow: var(--shadow-soft); padding: 20px 22px; overflow: hidden; }
.hero-days .lab { font-size: 12px; color: var(--text-soft); letter-spacing: 2px; }
.hero-days .num { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
.hero-days .num b {
  font-size: 58px; line-height: 1.05; font-weight: 800; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-days .num span { font-size: 15px; font-weight: 600; }
.hero-days .since { font-size: 11px; color: var(--text-soft); margin-top: 6px; }
.hero-days .deco { position: absolute; right: 18px; top: 18px; color: var(--accent); opacity: .9; }

.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mcard { border-radius: var(--r-card); padding: 13px; min-height: 150px; background: var(--card); box-shadow: var(--shadow-soft); display: flex; flex-direction: column; color: #fff; background: linear-gradient(160deg, var(--primary), var(--primary-deep)); box-shadow: var(--shadow-pop); }
.mcard.peer { background: var(--card); color: var(--text); box-shadow: var(--shadow-soft); }
.mcard.empty { background: var(--card); border: 1.5px dashed var(--border); box-shadow: none; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--text-soft); font-size: 11px; }
.mcard.empty svg { color: var(--accent); }
.mcard .who { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; }
.mcard .emo { font-size: 34px; margin: auto 0 2px; }
.mcard .tag { font-size: 13px; font-weight: 700; }
.mcard .whi { font-size: 11px; opacity: .85; margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.hstrip { display: flex; gap: 8px; overflow-x: auto; padding: 2px; scrollbar-width: none; }
.achip { display: flex; gap: 10px; align-items: center; background: var(--card); border-radius: 14px; padding: 9px 13px; box-shadow: var(--shadow-soft); flex: none; }
.achip .iconwrap { width: 30px; height: 30px; }
.achip .iconwrap svg { width: 15px; height: 15px; }
.achip-t small { display: block; font-size: 10px; color: var(--text-soft); }
.achip-t b { font-size: 13px; color: var(--primary-deep); }
.hint { font-size: 12px; color: var(--text-soft); background: var(--chip); border-radius: 12px; padding: 12px 14px; }

.gn { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.gnav { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 13px 2px 10px; background: var(--card); border-radius: 16px; box-shadow: var(--shadow-soft); position: relative; }
.gnav:active { transform: scale(.95); }
.iconwrap.tile { width: 40px; height: 40px; border-radius: 13px; }
.iconwrap.tile svg { width: 20px; height: 20px; }
.glabel { font-size: 10.5px; }
</style>
