/**
 * state.js - 游戏状态与工具函数模块
 * 包含：gameState初始化、数字/时间格式化函数、Web Audio音效系统
 */

// ========== 游戏状态 ==========
let gameState = {
    cultivation: 0,
    spiritStone: 0,
    dao: 0,
    realmIndex: 0,
    realmLayer: 1,
    totalCultivation: 0,
    breakthroughCount: 0,
    playTime: 0,
    discipleCount: 0,
    // 弟子分工
    discipleAssign: { alchemy: 0, forge: 0, farm: 0, patrol: 0 },
    upgrades: {},
    upgradeBreakthroughs: {}, // { upgradeId: count } 功法突破次数
    upgradeMastery: {}, // { upgradeId: true } 功法精通
    upgradeTiers: {}, // { upgradeId: tierIndex } 功法品阶
    upgradeProficiency: {}, // { upgradeId: amount } 功法熟练度
    cultivationAllocation: 0, // 0=全修炼, 50=半修炼半领悟, 100=全领悟
    selectedInsightUpgrade: null, // 当前领悟的功法ID
    evolveCooldowns: {}, // { upgradeId: timestamp } 推演冷却
    formationPresets: [null, null], // 阵法预设方案 [formationId, formationId]
    pills: {},
    activeBuffs: [],
    artifactInventory: [],
    equippedArtifacts: [null, null, null],
    artifactFoundCount: 0,
    adventure: null, // { locationId, startTime, duration }
    adventureCompleteCount: 0,
    pillsUsedCount: 0,
    rebirthCount: 0,
    achievements: {}, // { id: { completed, claimed } }
    comboCount: 0,
    maxCombo: 0,
    lastMeditateTime: 0,
    adventureEventCount: 0,
    soundEnabled: true,
    // 签到
    lastCheckinDate: '',
    checkinStreak: 0,
    checkinClaimedDays: [],
    // 日常任务
    taskProgress: {},
    taskClaimed: {},
    lastTaskReset: '',
    // 统计
    meditateCount: 0,
    upgradeCount: 0,
    currentSlot: 0,
    // 灵宠
    activePet: null,
    secondaryPet: null, // 副灵宠（化神期解锁，提供50%加成）
    petInventory: [],
    // 秘境
    dungeonCooldowns: {}, // { dungeonId: timestamp }
    talentPoints: 0,
    // 炼丹炼器
    alchemyCooldowns: {}, // { pillId: timestamp }
    alchemyBatchSize: 1, // 批量炼丹数量
    alchemyCooldownEnd: 0, // 全局炼丹冷却结束时间
    forgeBatchSize: 1, // 批量炼器数量
    forgeCooldownEnd: 0, // 全局炼器冷却结束时间
    forgeCooldowns: {}, // { qualityIndex: timestamp }
    // 阵法
    activeFormations: [], // [{ id, endTime }]
    formationLevels: {}, // { formationId: level } 阵法等级
    enlightenmentCooldown: 0, // 功法顿悟冷却结束时间
    // 永久丹药
    heavenlyUsed: {}, // { itemId: count }
    heavenlyBonus: { cultivation: 0, stone: 0, bothMult: 0 },
    // 灵宠图鉴
    petCollection: {}, // { typeId: true }
    // 统计
    alchemySuccessCount: 0,
    alchemyFailCount: 0,
    forgeSuccessCount: 0,
    forgeFailCount: 0,
    totalStoneEarned: 0,
    totalFormations: 0,
    // 阶段目标
    currentGoalIndex: 0,
    completedGoals: [],
    // 称号
    unlockedTitles: [],
    currentTitle: '',
    // 成就点数
    achievementPoints: 0,
    // 设置
    settings: { soundEnabled: true, autoSaveInterval: 30, numberFormat: 'short', showFloatingText: true, lockPassword: '', autoLockMinutes: 0, theme: 'gold' },
    // 冷却提醒
    lastCooldownState: {}, // { key: bool wasCooling }
    // 随机事件
    nextEventTime: 0,
    lastSaveTime: Date.now(),
};

CONFIG.upgrades.forEach(u => { gameState.upgrades[u.id] = 0; });
CONFIG.pills.forEach(p => { gameState.pills[p.id] = 0; });
CONFIG.achievements.forEach(a => { gameState.achievements[a.id] = { completed: false, claimed: false }; });

// ========== 工具函数 ==========
function formatNumber(num) {
    if (num < 10) return num.toFixed(1);
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1e6) return (num / 1e3).toFixed(2) + 'K';
    if (num < 1e9) return (num / 1e6).toFixed(2) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(2) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
    return num.toExponential(2);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时${m}分钟`;
}

function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function randomQuality() {
    const total = CONFIG.artifactQualities.reduce((s, q) => s + q.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < CONFIG.artifactQualities.length; i++) {
        r -= CONFIG.artifactQualities[i].weight;
        if (r <= 0) return i;
    }
    return 0;
}

// ========== 音效系统（Web Audio API） ==========
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    }
}
function playTone(freq, duration, type = 'sine', volume = 0.15) {
    if (!gameState.soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { }
}
function playChord(notes, duration = 0.3, type = 'sine', volume = 0.12) {
    notes.forEach((f, i) => setTimeout(() => playTone(f, duration, type, volume), i * 60));
}
const SFX = {
    meditate: () => playTone(880, 0.08, 'sine', 0.08),
    click: () => playTone(600, 0.05, 'square', 0.05),
    buy: () => { playTone(523, 0.08, 'sine', 0.1); setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 60); },
    upgrade: () => { playTone(523, 0.1, 'triangle', 0.1); setTimeout(() => playTone(784, 0.15, 'triangle', 0.1), 80); },
    breakthrough: () => playChord([262, 330, 392, 523], 0.4, 'sine', 0.15),
    achievement: () => playChord([523, 659, 784, 1047], 0.25, 'triangle', 0.12),
    pill: () => { playTone(440, 0.1, 'sine', 0.1); setTimeout(() => playTone(554, 0.15, 'sine', 0.1), 70); },
    adventure: () => playTone(330, 0.15, 'sawtooth', 0.08),
    reward: () => playChord([659, 784, 988], 0.2, 'sine', 0.1),
    error: () => playTone(200, 0.15, 'sawtooth', 0.1),
};

