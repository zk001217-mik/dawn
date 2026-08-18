/* ============================================================
 * 修仙挂机录 - 核心游戏逻辑 v2
 * 包含：挂机产出、境界、功法、弟子、丹药、法宝、历练、成就、转世
 * ============================================================ */

// ========== 配置数据 ==========
const CONFIG = {
    realms: [
        { name: '练气期', baseCost: 100, multiplier: 1.5, cultBonus: 0, stoneBonus: 0 },
        { name: '筑基期', baseCost: 1000, multiplier: 1.6, cultBonus: 0.5, stoneBonus: 0.3 },
        { name: '金丹期', baseCost: 10000, multiplier: 1.7, cultBonus: 1.5, stoneBonus: 1.0 },
        { name: '元婴期', baseCost: 100000, multiplier: 1.8, cultBonus: 4.0, stoneBonus: 3.0 },
        { name: '化神期', baseCost: 1000000, multiplier: 1.9, cultBonus: 10.0, stoneBonus: 8.0 },
        { name: '炼虚期', baseCost: 10000000, multiplier: 2.0, cultBonus: 25.0, stoneBonus: 20.0 },
        { name: '合体期', baseCost: 100000000, multiplier: 2.1, cultBonus: 60.0, stoneBonus: 50.0 },
        { name: '大乘期', baseCost: 1000000000, multiplier: 2.2, cultBonus: 150.0, stoneBonus: 120.0 },
        { name: '渡劫期', baseCost: 10000000000, multiplier: 2.3, cultBonus: 400.0, stoneBonus: 300.0 },
    ],

    upgrades: [
        { id: 'basic_art', name: '基础吐纳术', desc: '最基础的修炼之法，吸纳天地灵气', baseCost: 10, costMult: 1.15, effect: 'cultivation', baseEffect: 0.8, effectMult: 1.1, unlockRealm: 0, maxLevel: 200 },
        { id: 'spirit_vein', name: '聚灵阵', desc: '布下聚灵阵法，汇聚灵石矿脉', baseCost: 20, costMult: 1.18, effect: 'stone', baseEffect: 0.5, effectMult: 1.12, unlockRealm: 0, maxLevel: 200 },
        { id: 'breathing_art', name: '龟息吐纳法', desc: '上古吐纳法门，大幅提升修为速度', baseCost: 150, costMult: 1.2, effect: 'cultivation', baseEffect: 4, effectMult: 1.15, unlockRealm: 1, maxLevel: 150 },
        { id: 'spirit_field', name: '灵田开垦', desc: '开辟灵田种植灵药，换取灵石', baseCost: 200, costMult: 1.2, effect: 'stone', baseEffect: 3, effectMult: 1.15, unlockRealm: 1, maxLevel: 150 },
        { id: 'heart_method', name: '心法要诀', desc: '修炼心法，神识与灵力双修', baseCost: 800, costMult: 1.21, effect: 'both', baseEffect: 5, effectMult: 1.16, unlockRealm: 1, maxLevel: 120 },
        { id: 'alchemy', name: '炼丹之术', desc: '炼制丹药辅助修炼，修为灵石双增', baseCost: 1500, costMult: 1.22, effect: 'both', baseEffect: 10, effectMult: 1.18, unlockRealm: 2, maxLevel: 100 },
        { id: 'artifact_craft', name: '炼器之术', desc: '锻造法宝护身，产出更上一层楼', baseCost: 3000, costMult: 1.25, effect: 'both', baseEffect: 25, effectMult: 1.2, unlockRealm: 2, maxLevel: 100 },
        { id: 'formation', name: '周天星斗阵', desc: '引星辰之力入体，修为暴涨', baseCost: 30000, costMult: 1.28, effect: 'cultivation', baseEffect: 120, effectMult: 1.22, unlockRealm: 3, maxLevel: 80 },
        { id: 'spirit_sword', name: '御剑之术', desc: '剑修法门，凌厉剑意增加灵石获取', baseCost: 40000, costMult: 1.28, effect: 'stone', baseEffect: 80, effectMult: 1.22, unlockRealm: 3, maxLevel: 80 },
        { id: 'dao_insight', name: '悟道心得', desc: '参悟天地法则，全方位提升', baseCost: 150000, costMult: 1.3, effect: 'both', baseEffect: 350, effectMult: 1.25, unlockRealm: 4, maxLevel: 60 },
    ],

    disciple: { baseCost: 50, costMult: 1.3, cultBonus: 0.05, stoneBonus: 0.03, maxCount: 100 },

    // 丹药配置
    pills: [
        { id: 'qi_gathering', name: '聚气丹', desc: '凝聚灵气，修为产出+100%，持续5分钟', icon: '🔴', cost: 100, effect: 'buff_cult', value: 1.0, duration: 300 },
        { id: 'spirit_talisman', name: '聚灵符', desc: '灵石产出+100%，持续5分钟', icon: '🟡', cost: 100, effect: 'buff_stone', value: 1.0, duration: 300 },
        { id: 'enlightenment', name: '悟道丹', desc: '立即获得30秒修为产出', icon: '🟣', cost: 80, effect: 'instant_cult', value: 30 },
        { id: 'wealth', name: '点石成金符', desc: '立即获得60秒灵石产出', icon: '🟢', cost: 80, effect: 'instant_stone', value: 60 },
        { id: 'double_cult', name: '双倍修为丹', desc: '修为产出+200%，持续3分钟', icon: '🟠', cost: 300, effect: 'buff_cult', value: 2.0, duration: 180 },
        { id: 'double_stone', name: '聚财符', desc: '灵石产出+200%，持续3分钟', icon: '💎', cost: 300, effect: 'buff_stone', value: 2.0, duration: 180 },
        { id: 'universal', name: '混元丹', desc: '修为和灵石产出各+80%，持续10分钟', icon: '🔵', cost: 800, effect: 'buff_both', value: 0.8, duration: 600 },
    ],

    // 法宝品质
    artifactQualities: [
        { name: '凡品', mult: 1.0, color: 'common', weight: 50 },
        { name: '良品', mult: 1.5, color: 'uncommon', weight: 30 },
        { name: '上品', mult: 2.5, color: 'rare', weight: 14 },
        { name: '极品', mult: 4.0, color: 'epic', weight: 5 },
        { name: '仙品', mult: 7.0, color: 'legendary', weight: 1 },
    ],

    // 法宝类型
    artifactTypes: [
        { id: 'sword', name: '飞剑', icon: '⚔️', effect: 'cultivation', base: 5 },
        { id: 'shield', name: '护盾', icon: '🛡️', effect: 'stone', base: 3 },
        { id: 'mirror', name: '宝镜', icon: '🪞', effect: 'both', base: 2 },
        { id: 'seal', name: '法印', icon: '📜', effect: 'cultivation', base: 8 },
        { id: 'bell', name: '铜钟', icon: '🔔', effect: 'stone', base: 5 },
        { id: 'pagoda', name: '宝塔', icon: '🗼', effect: 'both', base: 4 },
    ],

    artifactSlots: 3,

    // 历练地点
    adventures: [
        { id: 'forest', name: '迷雾森林', desc: '低级修士历练之地，偶有灵药', duration: 60, unlockRealm: 0, cultReward: 80, stoneReward: 50, artifactChance: 0.15, pillChance: 0.1 },
        { id: 'cave', name: '幽暗洞窟', desc: '洞窟深处藏有秘宝，但也有危险', duration: 180, unlockRealm: 1, cultReward: 400, stoneReward: 280, artifactChance: 0.25, pillChance: 0.15 },
        { id: 'mountain', name: '灵脉山脉', desc: '灵脉汇聚之地，收获颇丰', duration: 300, unlockRealm: 2, cultReward: 2000, stoneReward: 1400, artifactChance: 0.35, pillChance: 0.2 },
        { id: 'ruins', name: '上古遗迹', desc: '上古修士留下的遗迹，机缘与危机并存', duration: 600, unlockRealm: 3, cultReward: 10000, stoneReward: 7000, artifactChance: 0.45, pillChance: 0.25 },
        { id: 'void', name: '虚空裂隙', desc: '通往异界的裂隙，传说中有仙器', duration: 1200, unlockRealm: 4, cultReward: 60000, stoneReward: 40000, artifactChance: 0.55, pillChance: 0.35 },
    ],

    // 历练奇遇事件
    adventureEvents: [
        { name: '发现灵泉', desc: '意外发现一处灵泉，修为大增！', cultMult: 2.0, stoneMult: 1.0, chance: 0.08 },
        { name: '遇到散修', desc: '与路过散修交流悟道，获得灵石馈赠', cultMult: 1.0, stoneMult: 2.5, chance: 0.08 },
        { name: '上古洞府', desc: '发现一处上古洞府，收获翻倍！', cultMult: 2.0, stoneMult: 2.0, chance: 0.04 },
        { name: '妖兽袭击', desc: '遭遇妖兽袭击，勉强逃脱损失部分收益', cultMult: 0.6, stoneMult: 0.6, chance: 0.1 },
        { name: '仙人指路', desc: '偶遇高人指点，修为灵石均有斩获', cultMult: 1.5, stoneMult: 1.5, chance: 0.05 },
    ],

    // 成就配置
    achievements: [
        { id: 'first_break', name: '初窥门径', desc: '首次突破境界', icon: '🌟', condition: s => s.breakthroughCount >= 1, reward: { dao: 1 } },
        { id: 'break_10', name: '小有所成', desc: '累计突破10次', icon: '⭐', condition: s => s.breakthroughCount >= 10, reward: { dao: 3 } },
        { id: 'break_50', name: '修炼狂人', desc: '累计突破50次', icon: '💫', condition: s => s.breakthroughCount >= 50, reward: { dao: 10 } },
        { id: 'cult_10k', name: '修为深厚', desc: '累计修为达到10K', icon: '📈', condition: s => s.totalCultivation >= 10000, reward: { dao: 2 } },
        { id: 'cult_1m', name: '道行高深', desc: '累计修为达到1M', icon: '🏔️', condition: s => s.totalCultivation >= 1000000, reward: { dao: 10 } },
        { id: 'realm_zhuji', name: '筑基成功', desc: '达到筑基期', icon: '🏯', condition: s => s.realmIndex >= 1, reward: { dao: 5 } },
        { id: 'realm_jindan', name: '金丹大道', desc: '达到金丹期', icon: '🔮', condition: s => s.realmIndex >= 2, reward: { dao: 15 } },
        { id: 'realm_yuanying', name: '元婴出窍', desc: '达到元婴期', icon: '👶', condition: s => s.realmIndex >= 3, reward: { dao: 30 } },
        { id: 'disciple_10', name: '开山收徒', desc: '招募10名弟子', icon: '👥', condition: s => s.discipleCount >= 10, reward: { dao: 5 } },
        { id: 'artifact_first', name: '初得法宝', desc: '获得第一件法宝', icon: '⚔️', condition: s => s.artifactFoundCount >= 1, reward: { dao: 2 } },
        { id: 'adventure_10', name: '历练老手', desc: '完成10次历练', icon: '🗺️', condition: s => s.adventureCompleteCount >= 10, reward: { dao: 5 } },
        { id: 'pill_50', name: '丹道入门', desc: '使用50颗丹药', icon: '💊', condition: s => s.pillsUsedCount >= 50, reward: { dao: 5 } },
        { id: 'play_1h', name: '潜心修炼', desc: '累计修炼1小时', icon: '⏰', condition: s => s.playTime >= 3600, reward: { dao: 3 } },
        { id: 'rebirth_first', name: '转世重生', desc: '首次转世重修', icon: '🔄', condition: s => s.rebirthCount >= 1, reward: { dao: 10 } },
        { id: 'combo_10', name: '连击大师', desc: '打坐达成10连击', icon: '🔥', condition: s => s.maxCombo >= 10, reward: { dao: 3 } },
        { id: 'artifact_5', name: '法宝收藏家', desc: '累计获得5件法宝', icon: '💎', condition: s => s.artifactFoundCount >= 5, reward: { dao: 5 } },
        { id: 'event_3', name: '奇遇不断', desc: '历练中触发3次奇遇事件', icon: '✨', condition: s => (s.adventureEventCount || 0) >= 3, reward: { dao: 8 } },
    ],

    // 每日签到奖励（7天循环）
    checkinRewards: [
        { day: 1, type: 'stone', amount: 200, desc: '200灵石' },
        { day: 2, type: 'cult', amount: 500, desc: '500修为' },
        { day: 3, type: 'stone', amount: 500, desc: '500灵石' },
        { day: 4, type: 'pill', amount: 1, desc: '随机丹药x1' },
        { day: 5, type: 'stone', amount: 1000, desc: '1000灵石' },
        { day: 6, type: 'dao', amount: 2, desc: '2道韵' },
        { day: 7, type: 'artifact', amount: 1, desc: '随机法宝x1' },
    ],

    // 日常任务
    dailyTasks: [
        { id: 'meditate_20', name: '打坐修炼', desc: '打坐20次', icon: '☯', target: 20, type: 'meditate', reward: { stone: 100 } },
        { id: 'breakthrough_1', name: '突破境界', desc: '突破1次', icon: '⇧', target: 1, type: 'breakthrough', reward: { stone: 200 } },
        { id: 'upgrade_5', name: '修炼功法', desc: '升级功法5次', icon: '📖', target: 5, type: 'upgrade', reward: { stone: 150 } },
        { id: 'adventure_1', name: '外出历练', desc: '完成1次历练', icon: '🗺️', target: 1, type: 'adventure', reward: { stone: 200 } },
        { id: 'pill_use_3', name: '服食丹药', desc: '使用3颗丹药', icon: '💊', target: 3, type: 'pill', reward: { stone: 150 } },
        { id: 'recruit_1', name: '招募弟子', desc: '招募1名弟子', icon: '👥', target: 1, type: 'recruit', reward: { stone: 100 } },
    ],

    saveSlotCount: 3,

    baseCultivation: 1.5,
    baseStone: 0.8,
    meditateMultiplier: 2.0,
    meditateBase: 2,
    comboTimeout: 1500, // 连击超时（毫秒）
    comboMaxMultiplier: 3.0, // 最大连击倍率
    saveKey: 'xiuxian_idle_save_v3',
    autoSaveInterval: 30000,
    maxOfflineHours: 8,
};

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
    upgrades: {},
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

// ========== 核心计算函数 ==========
function getCurrentRealm() { return CONFIG.realms[gameState.realmIndex]; }

function getRealmName() {
    const realm = getCurrentRealm();
    const layers = ['', '一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层'];
    return realm.name + layers[gameState.realmLayer];
}

function getBreakthroughCost() {
    const realm = getCurrentRealm();
    return Math.floor(realm.baseCost * Math.pow(realm.multiplier, gameState.realmLayer - 1));
}

function getUpgradeCost(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    return Math.floor(u.baseCost * Math.pow(u.costMult, gameState.upgrades[id]));
}

function getUpgradeEffect(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    const lv = gameState.upgrades[id];
    if (lv === 0) return 0;
    return u.baseEffect * Math.pow(u.effectMult, lv - 1) * lv;
}

function getDiscipleCost() {
    return Math.floor(CONFIG.disciple.baseCost * Math.pow(CONFIG.disciple.costMult, gameState.discipleCount));
}

// 获取当前活跃buff的总加成倍率
function getBuffMultiplier(type) {
    let mult = 1;
    const now = Date.now();
    gameState.activeBuffs = gameState.activeBuffs.filter(b => b.endTime > now);
    gameState.activeBuffs.forEach(b => {
        if (b.type === type || b.type === 'both') mult += b.value;
    });
    return mult;
}

// 获取装备法宝的总加成（含套装效果）
function getArtifactBonus(type) {
    let bonus = 0;
    const typeCounts = {};
    gameState.equippedArtifacts.forEach(art => {
        if (!art) return;
        typeCounts[art.typeId] = (typeCounts[art.typeId] || 0) + 1;
        if (art.effect === type || art.effect === 'both') {
            bonus += art.bonus;
        }
    });
    // 套装效果：同类型2件+10%，3件+25%
    let setBonus = 1;
    Object.values(typeCounts).forEach(count => {
        if (count >= 3) setBonus += 0.25;
        else if (count >= 2) setBonus += 0.10;
    });
    return bonus * setBonus;
}

function getCultivationPerSecond() {
    let base = CONFIG.baseCultivation;
    let bonus = 0;
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'cultivation' || u.effect === 'both') bonus += getUpgradeEffect(u.id);
    });
    bonus += getArtifactBonus('cultivation');
    const realmMult = 1 + getCurrentRealm().cultBonus;
    const discipleMult = 1 + gameState.discipleCount * CONFIG.disciple.cultBonus;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('cultivation');
    return (base + bonus) * realmMult * discipleMult * daoMult * buffMult;
}

function getStonePerSecond() {
    let base = CONFIG.baseStone;
    let bonus = 0;
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'stone' || u.effect === 'both') bonus += getUpgradeEffect(u.id);
    });
    bonus += getArtifactBonus('stone');
    const realmMult = 1 + getCurrentRealm().stoneBonus;
    const discipleMult = 1 + gameState.discipleCount * CONFIG.disciple.stoneBonus;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('stone');
    return (base + bonus) * realmMult * discipleMult * daoMult * buffMult;
}

function getRebirthDaoGain() {
    if (gameState.totalCultivation < 10000) return 0;
    return Math.floor(Math.sqrt(gameState.totalCultivation / 10000));
}

// ========== 游戏操作 ==========
function meditate() {
    initAudio();
    const now = Date.now();
    // 连击判定
    if (now - gameState.lastMeditateTime < CONFIG.comboTimeout) {
        gameState.comboCount++;
    } else {
        gameState.comboCount = 1;
    }
    gameState.lastMeditateTime = now;
    const comboMult = Math.min(1 + gameState.comboCount * 0.1, CONFIG.comboMaxMultiplier);
    if (gameState.comboCount > gameState.maxCombo) gameState.maxCombo = gameState.comboCount;
    gameState.meditateCount = (gameState.meditateCount || 0) + 1;
    const gain = (CONFIG.meditateBase + getCultivationPerSecond() * CONFIG.meditateMultiplier * (1 + Math.random() * 0.5)) * comboMult;
    gameState.cultivation += gain;
    gameState.totalCultivation += gain;
    showFloatingText(`+${formatNumber(gain)}${gameState.comboCount > 2 ? ` x${gameState.comboCount}连击` : ''}`);
    SFX.meditate();
    if (gameState.comboCount > 1 && gameState.comboCount % 5 === 0) {
        addLog(`连击 x${gameState.comboCount}！修为涌现`, 'success');
    }
}

function breakthrough() {
    const cost = getBreakthroughCost();
    if (gameState.cultivation < cost) { addLog('修为不足，无法突破！', ''); SFX.error(); return false; }
    gameState.cultivation -= cost;
    gameState.breakthroughCount++;
    SFX.breakthrough();
    showScreenFlash();
    if (gameState.realmLayer < 9) {
        gameState.realmLayer++;
        addLog(`突破成功！晋升至 ${getRealmName()}`, 'breakthrough');
    } else if (gameState.realmIndex < CONFIG.realms.length - 1) {
        gameState.realmIndex++;
        gameState.realmLayer = 1;
        showBreakthroughModal();
        addLog(`天降异象！突破至 ${getRealmName()}！`, 'breakthrough');
    } else {
        addLog('已达渡劫期九层，飞升在即！', 'breakthrough');
    }
    checkAchievements();
    updateUI();
    return true;
}

function buyUpgrade(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    if (!u || gameState.upgrades[id] >= u.maxLevel) return false;
    const cost = getUpgradeCost(id);
    if (gameState.spiritStone < cost) { addLog(`灵石不足，无法修炼 ${u.name}`, ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    gameState.upgrades[id]++;
    gameState.upgradeCount = (gameState.upgradeCount || 0) + 1;
    SFX.upgrade();
    addLog(`修炼 ${u.name} 至 ${gameState.upgrades[id]} 层`, 'success');
    updateUI();
    return true;
}

function recruitDisciple() {
    if (gameState.discipleCount >= CONFIG.disciple.maxCount) return false;
    const cost = getDiscipleCost();
    if (gameState.spiritStone < cost) { SFX.error(); return false; }
    gameState.spiritStone -= cost;
    gameState.discipleCount++;
    SFX.buy();
    addLog(`招募新弟子，当前 ${gameState.discipleCount} 人`, 'success');
    checkAchievements();
    updateUI();
    return true;
}

function rebirth() {
    const daoGain = getRebirthDaoGain();
    if (daoGain <= 0) { addLog('修为尚浅，转世无法获得道韵', ''); return false; }
    if (!confirm(`确定转世重修？\n重置修为、灵石、功法、弟子、丹药、法宝，获得 ${daoGain} 点道韵`)) return false;
    gameState.dao += daoGain;
    gameState.cultivation = 0;
    gameState.spiritStone = 0;
    gameState.realmIndex = 0;
    gameState.realmLayer = 1;
    gameState.discipleCount = 0;
    gameState.totalCultivation = 0;
    gameState.breakthroughCount = 0;
    gameState.pills = {};
    CONFIG.pills.forEach(p => { gameState.pills[p.id] = 0; });
    gameState.activeBuffs = [];
    gameState.artifactInventory = [];
    gameState.equippedArtifacts = [null, null, null];
    gameState.artifactFoundCount = 0;
    gameState.adventure = null;
    gameState.adventureCompleteCount = 0;
    gameState.pillsUsedCount = 0;
    gameState.rebirthCount++;
    CONFIG.upgrades.forEach(u => { gameState.upgrades[u.id] = 0; });
    addLog(`转世重修！获得 ${daoGain} 点道韵，当前共 ${gameState.dao} 点`, 'breakthrough');
    checkAchievements();
    updateUI();
    return true;
}

// ========== 丹药系统 ==========
function buyPill(id) {
    const pill = CONFIG.pills.find(p => p.id === id);
    if (!pill) return false;
    if (gameState.spiritStone < pill.cost) { addLog(`灵石不足，无法购买 ${pill.name}`, ''); SFX.error(); return false; }
    gameState.spiritStone -= pill.cost;
    gameState.pills[id] = (gameState.pills[id] || 0) + 1;
    SFX.buy();
    addLog(`购买了 ${pill.name}`, 'success');
    updateUI();
    return true;
}

function usePill(id) {
    const pill = CONFIG.pills.find(p => p.id === id);
    if (!pill || !gameState.pills[id] || gameState.pills[id] <= 0) { SFX.error(); return false; }
    gameState.pills[id]--;
    gameState.pillsUsedCount++;
    SFX.pill();

    if (pill.effect === 'buff_cult' || pill.effect === 'buff_stone' || pill.effect === 'buff_both') {
        const type = pill.effect === 'buff_cult' ? 'cultivation' : pill.effect === 'buff_stone' ? 'stone' : 'both';
        gameState.activeBuffs.push({ type, name: pill.name, value: pill.value, endTime: Date.now() + pill.duration * 1000 });
        addLog(`服用 ${pill.name}，效果激活！`, 'success');
    } else if (pill.effect === 'instant_cult') {
        const gain = getCultivationPerSecond() * pill.value;
        gameState.cultivation += gain;
        gameState.totalCultivation += gain;
        addLog(`服用 ${pill.name}，获得 ${formatNumber(gain)} 修为`, 'success');
        showFloatingText(`+${formatNumber(gain)} 修为`);
    } else if (pill.effect === 'instant_stone') {
        const gain = getStonePerSecond() * pill.value;
        gameState.spiritStone += gain;
        addLog(`使用 ${pill.name}，获得 ${formatNumber(gain)} 灵石`, 'success');
    }
    checkAchievements();
    updateUI();
    return true;
}

// ========== 法宝系统 ==========
function generateArtifact() {
    const type = CONFIG.artifactTypes[Math.floor(Math.random() * CONFIG.artifactTypes.length)];
    const qualityIndex = randomQuality();
    const quality = CONFIG.artifactQualities[qualityIndex];
    const artifact = {
        uid: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        typeId: type.id,
        name: quality.name + type.name,
        icon: type.icon,
        effect: type.effect,
        qualityIndex: qualityIndex,
        qualityName: quality.name,
        qualityColor: quality.color,
        bonus: Math.floor(type.base * quality.mult * (1 + Math.random() * 0.5)),
    };
    return artifact;
}

function equipArtifact(uid, slotIndex) {
    const idx = gameState.artifactInventory.findIndex(a => a.uid === uid);
    if (idx === -1) return false;
    const artifact = gameState.artifactInventory[idx];
    // 如果槽位已有装备，交换到背包
    if (gameState.equippedArtifacts[slotIndex]) {
        gameState.artifactInventory.push(gameState.equippedArtifacts[slotIndex]);
    }
    gameState.equippedArtifacts[slotIndex] = artifact;
    gameState.artifactInventory.splice(idx, 1);
    SFX.upgrade();
    addLog(`装备了 ${artifact.name}`, 'success');
    updateUI();
    return true;
}

function unequipArtifact(slotIndex) {
    if (!gameState.equippedArtifacts[slotIndex]) return false;
    gameState.artifactInventory.push(gameState.equippedArtifacts[slotIndex]);
    gameState.equippedArtifacts[slotIndex] = null;
    addLog('卸下了法宝', '');
    updateUI();
    return true;
}

function sellArtifact(uid) {
    const idx = gameState.artifactInventory.findIndex(a => a.uid === uid);
    if (idx === -1) return false;
    const art = gameState.artifactInventory[idx];
    const sellPrice = Math.floor(art.bonus * 10 * (art.qualityIndex + 1));
    gameState.spiritStone += sellPrice;
    gameState.artifactInventory.splice(idx, 1);
    addLog(`分解 ${art.name}，获得 ${formatNumber(sellPrice)} 灵石`, 'success');
    updateUI();
    return true;
}

// ========== 历练系统 ==========
function startAdventure(locationId) {
    if (gameState.adventure) { addLog('正在历练中，无法再次出发', ''); SFX.error(); return false; }
    const loc = CONFIG.adventures.find(a => a.id === locationId);
    if (!loc || gameState.realmIndex < loc.unlockRealm) return false;
    gameState.adventure = { locationId, startTime: Date.now(), duration: loc.duration * 1000 };
    SFX.adventure();
    addLog(`出发前往 ${loc.name} 历练`, 'success');
    updateUI();
    return true;
}

function completeAdventure() {
    if (!gameState.adventure) return;
    const loc = CONFIG.adventures.find(a => a.id === gameState.adventure.locationId);
    const elapsed = (Date.now() - gameState.adventure.startTime) / 1000;
    if (elapsed < loc.duration) return;

    // 奇遇事件判定
    let eventMult = { cult: 1, stone: 1 };
    let eventName = '';
    for (const evt of CONFIG.adventureEvents) {
        if (Math.random() < evt.chance) {
            eventMult.cult = evt.cultMult;
            eventMult.stone = evt.stoneMult;
            eventName = evt.name;
            break;
        }
    }

    const cultGain = loc.cultReward * (1 + gameState.realmIndex * 0.5) * eventMult.cult;
    const stoneGain = loc.stoneReward * (1 + gameState.realmIndex * 0.5) * eventMult.stone;
    gameState.cultivation += cultGain;
    gameState.totalCultivation += cultGain;
    gameState.spiritStone += stoneGain;

    let rewardMsg = `历练归来！获得 ${formatNumber(cultGain)} 修为，${formatNumber(stoneGain)} 灵石`;
    if (eventName) {
        const evt = CONFIG.adventureEvents.find(e => e.name === eventName);
        rewardMsg = `【奇遇·${eventName}】${evt.desc} ` + rewardMsg;
        gameState.adventureEventCount = (gameState.adventureEventCount || 0) + 1;
    }

    if (Math.random() < loc.artifactChance) {
        const art = generateArtifact();
        gameState.artifactInventory.push(art);
        gameState.artifactFoundCount++;
        rewardMsg += `，获得法宝【${art.name}】`;
        SFX.reward();
    }

    if (Math.random() < loc.pillChance) {
        const pill = CONFIG.pills[Math.floor(Math.random() * CONFIG.pills.length)];
        gameState.pills[pill.id] = (gameState.pills[pill.id] || 0) + 1;
        rewardMsg += `，获得 ${pill.name} x1`;
    }

    gameState.adventureCompleteCount++;
    gameState.adventure = null;
    SFX.adventure();
    addLog(rewardMsg, eventName ? 'breakthrough' : 'success');
    checkAchievements();
    updateUI();
}

function getAdventureProgress() {
    if (!gameState.adventure) return null;
    const loc = CONFIG.adventures.find(a => a.id === gameState.adventure.locationId);
    const elapsed = (Date.now() - gameState.adventure.startTime) / 1000;
    return {
        location: loc,
        elapsed,
        remaining: Math.max(0, loc.duration - elapsed),
        progress: Math.min(1, elapsed / loc.duration),
    };
}

// ========== 成就系统 ==========
function checkAchievements() {
    CONFIG.achievements.forEach(ach => {
        const state = gameState.achievements[ach.id];
        if (!state.completed && ach.condition(gameState)) {
            state.completed = true;
            SFX.achievement();
            addLog(`🏆 成就解锁：${ach.name}！`, 'breakthrough');
        }
    });
}

function claimAchievement(id) {
    const ach = CONFIG.achievements.find(a => a.id === id);
    const state = gameState.achievements[id];
    if (!state || !state.completed || state.claimed) return false;
    state.claimed = true;
    SFX.achievement();
    if (ach.reward.dao) {
        gameState.dao += ach.reward.dao;
        addLog(`领取成就【${ach.name}】奖励：${ach.reward.dao} 道韵`, 'success');
    }
    updateUI();
    return true;
}

// ========== 存档系统 ==========
function saveGame() {
    SaveManager.saveToSlot(gameState.currentSlot || 0);
    updateSaveStatus('已存档 ' + new Date().toLocaleTimeString());
}

function loadGame() {
    const data = localStorage.getItem(CONFIG.saveKey);
    if (!data) return false;
    try {
        const loaded = JSON.parse(data);
        gameState = { ...gameState, ...loaded };
        CONFIG.upgrades.forEach(u => { if (gameState.upgrades[u.id] === undefined) gameState.upgrades[u.id] = 0; });
        CONFIG.pills.forEach(p => { if (gameState.pills[p.id] === undefined) gameState.pills[p.id] = 0; });
        CONFIG.achievements.forEach(a => { if (!gameState.achievements[a.id]) gameState.achievements[a.id] = { completed: false, claimed: false }; });
        if (!gameState.equippedArtifacts || gameState.equippedArtifacts.length !== 3) gameState.equippedArtifacts = [null, null, null];
        if (!gameState.artifactInventory) gameState.artifactInventory = [];
        if (!gameState.activeBuffs) gameState.activeBuffs = [];
        if (gameState.maxCombo === undefined) gameState.maxCombo = 0;
        if (gameState.adventureEventCount === undefined) gameState.adventureEventCount = 0;
        if (gameState.soundEnabled === undefined) gameState.soundEnabled = true;
        return true;
    } catch (e) { console.error('存档读取失败:', e); return false; }
}

function resetGame() {
    if (!confirm('确定重置游戏？所有进度将丢失！')) return;
    localStorage.removeItem(CONFIG.saveKey);
    location.reload();
}

function calculateOfflineEarnings() {
    const offlineSeconds = Math.min((Date.now() - gameState.lastSaveTime) / 1000, CONFIG.maxOfflineHours * 3600);
    if (offlineSeconds < 10) return null;
    return {
        seconds: offlineSeconds,
        cultivation: getCultivationPerSecond() * offlineSeconds,
        stones: getStonePerSecond() * offlineSeconds,
    };
}

function applyOfflineEarnings(e) {
    gameState.cultivation += e.cultivation;
    gameState.spiritStone += e.stones;
    gameState.totalCultivation += e.cultivation;
    addLog(`闭关 ${formatDuration(e.seconds)}，获得 ${formatNumber(e.cultivation)} 修为，${formatNumber(e.stones)} 灵石`, 'success');
}

// ========== UI 渲染 ==========
let currentTab = 'cultivation';

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabName));
}

function updateUI() {
    // 资源
    document.getElementById('cultivation-amount').textContent = formatNumber(gameState.cultivation);
    document.getElementById('spirit-stone-amount').textContent = formatNumber(gameState.spiritStone);
    document.getElementById('dao-amount').textContent = gameState.dao;
    document.getElementById('cultivation-rate').textContent = `+${formatNumber(getCultivationPerSecond())}/秒`;
    document.getElementById('spirit-stone-rate').textContent = `+${formatNumber(getStonePerSecond())}/秒`;

    // 境界
    document.getElementById('realm-name').textContent = getRealmName();
    const cost = getBreakthroughCost();
    document.getElementById('cultivation-fill').style.width = Math.min(gameState.cultivation / cost, 1) * 100 + '%';
    document.getElementById('cultivation-text').textContent = `${formatNumber(gameState.cultivation)} / ${formatNumber(cost)}`;

    const btBtn = document.getElementById('breakthrough-btn');
    const btCost = document.getElementById('breakthrough-cost');
    if (gameState.cultivation >= cost) { btBtn.disabled = false; btCost.textContent = `消耗 ${formatNumber(cost)} 修为`; }
    else { btBtn.disabled = true; btCost.textContent = `需要 ${formatNumber(cost)} 修为`; }

    // 统计
    document.getElementById('play-time').textContent = formatTime(gameState.playTime);
    document.getElementById('total-cultivation').textContent = formatNumber(gameState.totalCultivation);
    document.getElementById('breakthrough-count').textContent = gameState.breakthroughCount;
    document.getElementById('disciple-count').textContent = gameState.discipleCount;

    // Buff
    renderActiveBuffs();
    // 功法
    renderUpgrades();
    // 弟子
    const dCost = getDiscipleCost();
    document.getElementById('recruit-cost').textContent = `花费：${formatNumber(dCost)} 灵石`;
    document.getElementById('recruit-btn').disabled = gameState.spiritStone < dCost || gameState.discipleCount >= CONFIG.disciple.maxCount;
    // 丹药
    renderPills();
    // 法宝
    renderArtifacts();
    // 历练
    renderAdventures();
    // 成就
    renderAchievements();
    // 签到
    renderCheckin();
    // 任务
    renderTasks();
    // 丹药合成
    renderSynthesis();
    // 转世
    const daoGain = getRebirthDaoGain();
    document.getElementById('rebirth-info').textContent = `获得道韵：${daoGain}`;
    document.getElementById('rebirth-btn').disabled = daoGain <= 0;
}

function renderActiveBuffs() {
    const container = document.getElementById('active-buffs');
    const now = Date.now();
    gameState.activeBuffs = gameState.activeBuffs.filter(b => b.endTime > now);
    if (gameState.activeBuffs.length === 0) {
        container.innerHTML = '<p class="no-buff">暂无增益效果</p>';
        return;
    }
    container.innerHTML = gameState.activeBuffs.map(b => {
        const remain = Math.ceil((b.endTime - now) / 1000);
        return `<div class="buff-item"><span class="buff-name">${b.name}</span><span class="buff-time">${formatCountdown(remain)}</span></div>`;
    }).join('');
}

function renderUpgrades() {
    const container = document.getElementById('upgrade-list');
    container.innerHTML = '';
    CONFIG.upgrades.forEach(u => {
        const lv = gameState.upgrades[u.id];
        const cost = getUpgradeCost(u.id);
        const effect = getUpgradeEffect(u.id);
        const unlocked = gameState.realmIndex >= u.unlockRealm;
        const canAfford = gameState.spiritStone >= cost;
        const maxed = lv >= u.maxLevel;
        const item = document.createElement('div');
        item.className = 'upgrade-item' + (!unlocked ? ' locked' : (!canAfford && !maxed ? ' cant-afford' : ''));
        let effectText = u.effect === 'cultivation' ? `修为 +${formatNumber(effect)}/秒` : u.effect === 'stone' ? `灵石 +${formatNumber(effect)}/秒` : `修为+${formatNumber(effect)}/秒 灵石+${formatNumber(effect)}/秒`;
        item.innerHTML = `
            <div class="upgrade-header"><span class="upgrade-name">${u.name}</span><span class="upgrade-level">Lv.${lv}${maxed ? ' (满)' : ''}</span></div>
            <div class="upgrade-desc">${u.desc}</div>
            <div class="upgrade-effect">${effectText}</div>
            ${maxed ? '' : `<div class="upgrade-cost">花费：${formatNumber(cost)} 灵石</div>`}
            ${!unlocked ? `<div class="upgrade-desc" style="color:var(--accent-red)">需 ${CONFIG.realms[u.unlockRealm].name} 解锁</div>` : ''}`;
        if (unlocked && !maxed) item.addEventListener('click', () => buyUpgrade(u.id));
        container.appendChild(item);
    });
}

function renderPills() {
    const container = document.getElementById('pill-list');
    container.innerHTML = '';
    CONFIG.pills.forEach(p => {
        const count = gameState.pills[p.id] || 0;
        const canAfford = gameState.spiritStone >= p.cost;
        const item = document.createElement('div');
        item.className = 'pill-item' + (!canAfford ? ' cant-afford' : '');
        item.innerHTML = `
            <div class="pill-header"><span class="pill-name">${p.icon} ${p.name}</span><span class="pill-count">x${count}</span></div>
            <div class="pill-desc">${p.desc}</div>
            <div class="pill-actions">
                <button class="pill-btn" ${!canAfford ? 'disabled' : ''} data-action="buy" data-id="${p.id}">购买 ${formatNumber(p.cost)}灵石</button>
                <button class="pill-btn use-btn" ${count <= 0 ? 'disabled' : ''} data-action="use" data-id="${p.id}">使用</button>
            </div>`;
        container.appendChild(item);
    });
    container.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (btn.dataset.action === 'buy') buyPill(id);
            else usePill(id);
        });
    });
}

function renderArtifacts() {
    // 装备槽
    const slotsContainer = document.getElementById('artifact-slots');
    slotsContainer.innerHTML = '';
    for (let i = 0; i < CONFIG.artifactSlots; i++) {
        const art = gameState.equippedArtifacts[i];
        const slot = document.createElement('div');
        slot.className = 'artifact-slot' + (art ? ` equipped quality-${art.qualityColor}` : '');
        if (art) {
            slot.innerHTML = `<span class="slot-quality">${art.qualityName}</span><span class="slot-icon">${art.icon}</span><span class="slot-name">${art.name}<br>+${formatNumber(art.bonus)}</span>`;
            slot.addEventListener('click', () => unequipArtifact(i));
        } else {
            slot.innerHTML = `<span class="slot-icon">➕</span><span class="slot-name">空槽位</span>`;
        }
        slotsContainer.appendChild(slot);
    }

    // 背包
    const invContainer = document.getElementById('artifact-inventory');
    invContainer.innerHTML = '';
    if (gameState.artifactInventory.length === 0) {
        invContainer.innerHTML = '<p class="no-buff" style="grid-column:1/-1">背包空空如也，去历练获取法宝吧</p>';
    }
    gameState.artifactInventory.forEach(art => {
        const item = document.createElement('div');
        item.className = `artifact-inv-item quality-${art.qualityColor}`;
        item.title = `${art.name}\n效果: +${formatNumber(art.bonus)} ${art.effect === 'cultivation' ? '修为' : art.effect === 'stone' ? '灵石' : '全属性'}/秒\n点击装备到第一个空槽`;
        item.innerHTML = `<span class="inv-icon">${art.icon}</span><span class="inv-name">${art.name}</span>`;
        item.addEventListener('click', () => {
            // 找到第一个空槽位装备
            const emptySlot = gameState.equippedArtifacts.findIndex(s => s === null);
            if (emptySlot !== -1) equipArtifact(art.uid, emptySlot);
            else addLog('法宝槽位已满，请先卸下一个', '');
        });
        item.addEventListener('contextmenu', (e) => { e.preventDefault(); sellArtifact(art.uid); });
        invContainer.appendChild(item);
    });
}

function renderAdventures() {
    const statusContainer = document.getElementById('adventure-status');
    const progress = getAdventureProgress();

    if (progress) {
        statusContainer.className = 'adventure-status active';
        statusContainer.innerHTML = `
            <div class="adv-name">${progress.location.name}</div>
            <div class="adv-timer">${formatCountdown(progress.remaining)}</div>
            <div class="adv-progress-bar"><div class="adv-progress-fill" style="width:${progress.progress * 100}%"></div></div>`;
        if (progress.remaining <= 0) completeAdventure();
    } else {
        statusContainer.className = 'adventure-status idle';
        statusContainer.textContent = '当前空闲，选择下方地点开始历练';
    }

    const listContainer = document.getElementById('adventure-list');
    listContainer.innerHTML = '';
    CONFIG.adventures.forEach(loc => {
        const unlocked = gameState.realmIndex >= loc.unlockRealm;
        const busy = gameState.adventure !== null;
        const item = document.createElement('div');
        item.className = 'adventure-item' + (!unlocked ? ' locked' : (busy ? ' cant-go' : ''));
        item.innerHTML = `
            <div class="adv-header"><span class="adv-title">${loc.name}</span><span class="adv-duration">${formatDuration(loc.duration)}</span></div>
            <div class="adv-desc">${loc.desc}</div>
            <div class="adv-reward">奖励: ${formatNumber(loc.cultReward)}修为 ${formatNumber(loc.stoneReward)}灵石 | 法宝几率${Math.floor(loc.artifactChance * 100)}%</div>
            ${!unlocked ? `<div class="adv-desc" style="color:var(--accent-red)">需 ${CONFIG.realms[loc.unlockRealm].name} 解锁</div>` : ''}`;
        if (unlocked && !busy) item.addEventListener('click', () => startAdventure(loc.id));
        listContainer.appendChild(item);
    });
}

function renderAchievements() {
    const container = document.getElementById('achievement-list');
    container.innerHTML = '';
    CONFIG.achievements.forEach(ach => {
        const state = gameState.achievements[ach.id];
        const claimable = state.completed && !state.claimed;
        const item = document.createElement('div');
        item.className = 'achievement-item' + (state.claimed ? ' completed' : (claimable ? ' claimable' : ''));
        item.innerHTML = `
            <span class="ach-icon">${ach.icon}</span>
            <div class="ach-info">
                <div class="ach-name">${ach.name}</div>
                <div class="ach-desc">${ach.desc}</div>
                <div class="ach-progress">奖励: ${ach.reward.dao} 道韵 ${state.claimed ? '✓ 已领取' : (state.completed ? '可领取!' : '未完成')}</div>
            </div>
            ${claimable ? `<button class="ach-claim-btn" data-id="${ach.id}">领取</button>` : ''}`;
        container.appendChild(item);
    });
    container.querySelectorAll('.ach-claim-btn').forEach(btn => {
        btn.addEventListener('click', () => claimAchievement(btn.dataset.id));
    });
}

// ========== 存档槽位渲染 ==========
function renderSaveSlots() {
    const container = document.getElementById('save-slots');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < CONFIG.saveSlotCount; i++) {
        const info = SaveManager.getSlotInfo(i);
        const slot = document.createElement('div');
        slot.className = 'save-slot' + (info ? '' : ' empty');
        if (info) {
            slot.innerHTML = `
                <div class="slot-number">存档 ${i + 1}</div>
                <div class="slot-realm">${info.realm}</div>
                <div class="slot-info">
                    修为: ${formatNumber(info.cultivation)}<br>
                    灵石: ${formatNumber(info.spiritStone)}<br>
                    道韵: ${info.dao}<br>
                    时长: ${formatTime(info.playTime)}<br>
                    ${new Date(info.lastSave).toLocaleString()}
                </div>
                <div class="slot-actions">
                    <button class="slot-action-btn" data-action="load" data-slot="${i}">加载</button>
                    <button class="slot-action-btn delete" data-action="delete" data-slot="${i}">删除</button>
                </div>`;
        } else {
            slot.innerHTML = `
                <div class="slot-number">存档 ${i + 1}</div>
                <div class="slot-empty-text">➕ 新建存档</div>`;
        }
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('slot-action-btn')) return;
            startGame(i);
        });
        container.appendChild(slot);
    }
    container.querySelectorAll('.slot-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slot = parseInt(btn.dataset.slot);
            if (btn.dataset.action === 'load') startGame(slot);
            else if (btn.dataset.action === 'delete') {
                if (confirm(`确定删除存档 ${slot + 1}？`)) {
                    SaveManager.deleteSlot(slot);
                    renderSaveSlots();
                }
            }
        });
    });
}

function startGame(slotIndex) {
    const info = SaveManager.getSlotInfo(slotIndex);
    if (info) {
        SaveManager.loadSlot(slotIndex);
        // 离线收益
        const e = calculateOfflineEarnings();
        if (e) showOfflineModal(e);
        // 离线历练完成
        if (gameState.adventure) {
            const prog = getAdventureProgress();
            if (prog && prog.remaining <= 0) completeAdventure();
        }
    } else {
        gameState.currentSlot = slotIndex;
        SaveManager.currentSlot = slotIndex;
    }
    gameStarted = true;
    lastTickTime = Date.now();
    resetDailyTasks();
    document.getElementById('start-screen').classList.add('hidden');
    addLog(info ? `读取存档 ${slotIndex + 1} 成功，当前境界：${getRealmName()}` : '开始新的修仙之旅！', 'success');
    checkAchievements();
    updateUI();
}

// ========== 签到渲染 ==========
function renderCheckin() {
    const container = document.getElementById('checkin-area');
    if (!container) return;
    let html = '';
    CONFIG.checkinRewards.forEach((r, i) => {
        const day = i + 1;
        const claimed = gameState.checkinStreak > day || (gameState.checkinStreak === day && !canCheckin());
        const isToday = canCheckin() && gameState.checkinStreak + 1 === day;
        html += `<div class="checkin-day ${claimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
            <span class="day-num">${day}</span>
            <span class="day-reward">${r.desc}</span>
        </div>`;
    });
    html += `<button class="checkin-btn" ${canCheckin() ? '' : 'disabled'}>${canCheckin() ? '每日签到' : '今日已签到'}</button>`;
    container.innerHTML = html;
    const btn = container.querySelector('.checkin-btn');
    if (btn) btn.addEventListener('click', doCheckin);
}

// ========== 任务渲染 ==========
function renderTasks() {
    const container = document.getElementById('task-list');
    if (!container) return;
    resetDailyTasks();
    container.innerHTML = '';
    CONFIG.dailyTasks.forEach(task => {
        const progress = Math.min(getTaskProgress(task.id), task.target);
        const completed = progress >= task.target;
        const claimed = gameState.taskClaimed[task.id];
        const item = document.createElement('div');
        item.className = 'task-item' + (claimed ? ' completed' : (completed ? ' claimable' : ''));
        item.innerHTML = `
            <span class="task-icon">${task.icon}</span>
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div class="task-progress">${task.desc} (${progress}/${task.target})</div>
                <div class="task-reward">奖励: ${task.reward.stone || task.reward.dao}${task.reward.stone ? '灵石' : '道韵'}</div>
            </div>
            ${completed && !claimed ? '<button class="task-claim-btn">领取</button>' : (claimed ? '<span style="color:var(--success);font-size:11px">已完成</span>' : '')}`;
        if (completed && !claimed) {
            item.querySelector('.task-claim-btn').addEventListener('click', () => claimTask(task.id));
        }
        container.appendChild(item);
    });
}

// ========== 丹药合成渲染 ==========
function renderSynthesis() {
    const container = document.getElementById('synthesis-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.pills.forEach(pill => {
        const count = gameState.pills[pill.id] || 0;
        const canSynth = count >= 3;
        const item = document.createElement('div');
        item.className = 'synthesis-item';
        item.innerHTML = `
            <span class="synthesis-name">${pill.icon} ${pill.name} (${count}/3)</span>
            <button class="synthesis-btn" ${canSynth ? '' : 'disabled'}>合成</button>`;
        if (canSynth) {
            item.querySelector('.synthesis-btn').addEventListener('click', () => synthesizePill(pill.id));
        }
        container.appendChild(item);
    });
}

// ========== 浮动文字 & 日志 ==========
function showFloatingText(text) {
    const container = document.getElementById('floating-texts');
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = (35 + Math.random() * 30) + '%';
    el.style.top = '35%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

function addLog(message, type = '') {
    const log = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}]</span>${message}`;
    log.insertBefore(entry, log.firstChild);
    while (log.children.length > 50) log.removeChild(log.lastChild);
}

// ========== 弹窗 ==========
function showOfflineModal(e) {
    document.getElementById('offline-duration').textContent = formatDuration(e.seconds);
    document.getElementById('offline-cultivation').textContent = '+' + formatNumber(e.cultivation);
    document.getElementById('offline-stones').textContent = '+' + formatNumber(e.stones);
    document.getElementById('offline-modal').classList.remove('hidden');
}

function showBreakthroughModal() {
    document.getElementById('new-realm').textContent = getRealmName();
    document.getElementById('breakthrough-modal').classList.remove('hidden');
}

function updateSaveStatus(text) { document.getElementById('save-status').textContent = text; }

// ========== 视觉特效 ==========
function showScreenFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle,rgba(212,175,55,0.4) 0%,rgba(196,30,58,0.2) 50%,transparent 70%);pointer-events:none;z-index:9999;animation:flashFade 0.8s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
}

// ========== 存档导入导出 ==========
function exportSave() {
    saveGame();
    const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xiuxian_save_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('存档已导出为文件', 'success');
}

function importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object' || !('cultivation' in data)) {
                alert('存档文件格式错误！');
                return;
            }
            if (!confirm('确定导入存档？当前进度将被覆盖！')) return;
            gameState = { ...gameState, ...data };
            CONFIG.upgrades.forEach(u => { if (gameState.upgrades[u.id] === undefined) gameState.upgrades[u.id] = 0; });
            CONFIG.pills.forEach(p => { if (gameState.pills[p.id] === undefined) gameState.pills[p.id] = 0; });
            CONFIG.achievements.forEach(a => { if (!gameState.achievements[a.id]) gameState.achievements[a.id] = { completed: false, claimed: false }; });
            if (!gameState.equippedArtifacts || gameState.equippedArtifacts.length !== 3) gameState.equippedArtifacts = [null, null, null];
            if (!gameState.artifactInventory) gameState.artifactInventory = [];
            if (!gameState.activeBuffs) gameState.activeBuffs = [];
            saveGame();
            addLog('存档导入成功！', 'success');
            updateUI();
        } catch (err) {
            alert('存档读取失败：' + err.message);
        }
    };
    reader.readAsText(file);
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    initAudio();
    if (gameState.soundEnabled) SFX.click();
    updateSoundButton();
    addLog(gameState.soundEnabled ? '音效已开启' : '音效已关闭', '');
}

function updateSoundButton() {
    const btn = document.getElementById('sound-btn');
    if (btn) btn.textContent = gameState.soundEnabled ? '🔊 音效开' : '🔇 音效关';
}

// ========== 多存档槽位系统 ==========
const SaveManager = {
    slotKeyPrefix: 'xiuxian_save_v3_slot',
    currentSlot: 0,
    dirHandle: null,

    getSlotKey(index) {
        return this.slotKeyPrefix + index;
    },

    getSlotInfo(index) {
        const data = localStorage.getItem(this.getSlotKey(index));
        if (!data) return null;
        try {
            const s = JSON.parse(data);
            return {
                realm: (CONFIG.realms[s.realmIndex]?.name || '未知') + ' ' + (s.realmLayer || 1) + '层',
                cultivation: s.totalCultivation || 0,
                spiritStone: s.spiritStone || 0,
                playTime: s.playTime || 0,
                lastSave: s.lastSaveTime || 0,
                dao: s.dao || 0,
            };
        } catch (e) { return null; }
    },

    loadSlot(index) {
        const data = localStorage.getItem(this.getSlotKey(index));
        if (!data) return false;
        try {
            const loaded = JSON.parse(data);
            gameState = { ...gameState, ...loaded };
            gameState.currentSlot = index;
            this.currentSlot = index;
            this.migrateState();
            return true;
        } catch (e) { console.error('存档读取失败:', e); return false; }
    },

    saveToSlot(index) {
        gameState.currentSlot = index;
        gameState.lastSaveTime = Date.now();
        const data = JSON.stringify(gameState);
        localStorage.setItem(this.getSlotKey(index), data);
        // 同时写入本地文件夹（如果已授权）
        this.saveToFolder(index, data);
    },

    deleteSlot(index) {
        localStorage.removeItem(this.getSlotKey(index));
        this.deleteFromFolder(index);
    },

    migrateState() {
        CONFIG.upgrades.forEach(u => { if (gameState.upgrades[u.id] === undefined) gameState.upgrades[u.id] = 0; });
        CONFIG.pills.forEach(p => { if (gameState.pills[p.id] === undefined) gameState.pills[p.id] = 0; });
        CONFIG.achievements.forEach(a => { if (!gameState.achievements[a.id]) gameState.achievements[a.id] = { completed: false, claimed: false }; });
        if (!gameState.equippedArtifacts || gameState.equippedArtifacts.length !== 3) gameState.equippedArtifacts = [null, null, null];
        if (!gameState.artifactInventory) gameState.artifactInventory = [];
        if (!gameState.activeBuffs) gameState.activeBuffs = [];
        if (gameState.maxCombo === undefined) gameState.maxCombo = 0;
        if (gameState.adventureEventCount === undefined) gameState.adventureEventCount = 0;
        if (gameState.soundEnabled === undefined) gameState.soundEnabled = true;
        if (!gameState.taskProgress) gameState.taskProgress = {};
        if (!gameState.taskClaimed) gameState.taskClaimed = {};
        if (!gameState.checkinClaimedDays) gameState.checkinClaimedDays = [];
        if (gameState.meditateCount === undefined) gameState.meditateCount = 0;
        if (gameState.upgradeCount === undefined) gameState.upgradeCount = 0;
    },

    // 本地文件夹存储（File System Access API）
    async requestDirectory() {
        if (!window.showDirectoryPicker) {
            alert('当前浏览器不支持本地文件夹存储，请使用 Chrome 或 Edge 浏览器。');
            return false;
        }
        try {
            this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            localStorage.setItem('xiuxian_dir_handle', 'authorized');
            document.getElementById('dir-status').textContent = '已设置：' + this.dirHandle.name;
            addLog('已授权本地存档目录，存档将自动保存到该文件夹', 'success');
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') console.error('目录选择失败:', e);
            return false;
        }
    },

    async saveToFolder(index, data) {
        if (!this.dirHandle) return;
        try {
            const fileHandle = await this.dirHandle.getFileHandle(`存档${index + 1}.json`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
        } catch (e) {
            console.error('写入本地文件失败:', e);
        }
    },

    async deleteFromFolder(index) {
        if (!this.dirHandle) return;
        try {
            await this.dirHandle.removeEntry(`存档${index + 1}.json`);
        } catch (e) { }
    },
};

// ========== 每日签到 ==========
function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function canCheckin() {
    return gameState.lastCheckinDate !== getTodayStr();
}

function doCheckin() {
    if (!canCheckin()) { addLog('今日已签到', ''); SFX.error(); return false; }
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // 连续签到判定
    if (gameState.lastCheckinDate === yesterday.toISOString().slice(0, 10)) {
        gameState.checkinStreak++;
    } else {
        gameState.checkinStreak = 1;
    }
    gameState.lastCheckinDate = getTodayStr();
    const dayIndex = (gameState.checkinStreak - 1) % 7;
    const reward = CONFIG.checkinRewards[dayIndex];

    // 发放奖励
    if (reward.type === 'stone') { gameState.spiritStone += reward.amount; }
    else if (reward.type === 'cult') { gameState.cultivation += reward.amount; gameState.totalCultivation += reward.amount; }
    else if (reward.type === 'dao') { gameState.dao += reward.amount; }
    else if (reward.type === 'pill') {
        const pill = CONFIG.pills[Math.floor(Math.random() * CONFIG.pills.length)];
        gameState.pills[pill.id] = (gameState.pills[pill.id] || 0) + 1;
        addLog(`签到获得 ${pill.name} x1`, 'success');
    }
    else if (reward.type === 'artifact') {
        const art = generateArtifact();
        gameState.artifactInventory.push(art);
        gameState.artifactFoundCount++;
        addLog(`签到获得法宝【${art.name}】`, 'breakthrough');
    }

    SFX.achievement();
    addLog(`签到成功！第${gameState.checkinStreak}天，获得${reward.desc}`, 'success');
    checkAchievements();
    updateUI();
    return true;
}

// ========== 日常任务 ==========
function resetDailyTasks() {
    const today = getTodayStr();
    if (gameState.lastTaskReset !== today) {
        gameState.taskProgress = {};
        gameState.taskClaimed = {};
        gameState.lastTaskReset = today;
        gameState.meditateCount = 0;
        gameState.upgradeCount = 0;
    }
}

function getTaskProgress(taskId) {
    const task = CONFIG.dailyTasks.find(t => t.id === taskId);
    if (!task) return 0;
    if (task.type === 'meditate') return gameState.meditateCount || 0;
    if (task.type === 'breakthrough') return gameState.breakthroughCount > 0 ? 1 : 0;
    if (task.type === 'upgrade') return gameState.upgradeCount || 0;
    if (task.type === 'adventure') return gameState.adventureCompleteCount || 0;
    if (task.type === 'pill') return gameState.pillsUsedCount || 0;
    if (task.type === 'recruit') return gameState.discipleCount > 0 ? 1 : 0;
    return 0;
}

function claimTask(taskId) {
    const task = CONFIG.dailyTasks.find(t => t.id === taskId);
    if (!task || gameState.taskClaimed[taskId]) return false;
    if (getTaskProgress(taskId) < task.target) { SFX.error(); return false; }
    gameState.taskClaimed[taskId] = true;
    if (task.reward.stone) gameState.spiritStone += task.reward.stone;
    if (task.reward.dao) gameState.dao += task.reward.dao;
    SFX.reward();
    addLog(`完成任务【${task.name}】，获得${task.reward.stone || task.reward.dao}${task.reward.stone ? '灵石' : '道韵'}`, 'success');
    updateUI();
    return true;
}

// ========== 丹药合成 ==========
function synthesizePill(pillId) {
    const pill = CONFIG.pills.find(p => p.id === pillId);
    if (!pill) return false;
    if ((gameState.pills[pillId] || 0) < 3) { addLog('丹药不足，需要3颗', ''); SFX.error(); return false; }
    gameState.pills[pillId] -= 3;
    // 合成强化版：效果翻倍，持续时间不变（对buff类）或数值翻倍（对即时类）
    if (pill.effect === 'buff_cult' || pill.effect === 'buff_stone' || pill.effect === 'buff_both') {
        const type = pill.effect === 'buff_cult' ? 'cultivation' : pill.effect === 'buff_stone' ? 'stone' : 'both';
        gameState.activeBuffs.push({ type, name: '强化·' + pill.name, value: pill.value * 2, endTime: Date.now() + pill.duration * 1000 });
    } else if (pill.effect === 'instant_cult') {
        const gain = getCultivationPerSecond() * pill.value * 2;
        gameState.cultivation += gain;
        gameState.totalCultivation += gain;
        addLog(`合成强化${pill.name}，获得${formatNumber(gain)}修为`, 'success');
    } else if (pill.effect === 'instant_stone') {
        const gain = getStonePerSecond() * pill.value * 2;
        gameState.spiritStone += gain;
        addLog(`合成强化${pill.name}，获得${formatNumber(gain)}灵石`, 'success');
    }
    gameState.pillsUsedCount++;
    SFX.pill();
    addLog(`丹炉合成：3颗${pill.name} → 强化${pill.name}`, 'success');
    updateUI();
    return true;
}

// ========== 游戏主循环 ==========
let lastTickTime = Date.now();

function gameTick() {
    const now = Date.now();
    const delta = (now - lastTickTime) / 1000;
    lastTickTime = now;

    const cultGain = getCultivationPerSecond() * delta;
    const stoneGain = getStonePerSecond() * delta;
    gameState.cultivation += cultGain;
    gameState.spiritStone += stoneGain;
    gameState.totalCultivation += cultGain;
    gameState.playTime += delta;

    // 检查历练完成
    if (gameState.adventure) {
        const prog = getAdventureProgress();
        if (prog && prog.remaining <= 0) completeAdventure();
    }

    // 定期检查成就
    if (Math.floor(gameState.playTime) % 5 === 0) checkAchievements();

    updateUI();
}

// ========== 初始化 ==========
let gameStarted = false;

function init() {
    initAudio();
    // 显示启动界面
    renderSaveSlots();

    // 启动界面按钮
    document.getElementById('start-import-btn').addEventListener('click', () => document.getElementById('start-import-file').click());
    document.getElementById('start-import-file').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    // 导入到第一个空槽位或覆盖当前
                    let targetSlot = 0;
                    for (let i = 0; i < CONFIG.saveSlotCount; i++) {
                        if (!SaveManager.getSlotInfo(i)) { targetSlot = i; break; }
                    }
                    if (confirm(`导入存档到槽位 ${targetSlot + 1}？`)) {
                        data.currentSlot = targetSlot;
                        localStorage.setItem(SaveManager.getSlotKey(targetSlot), JSON.stringify(data));
                        renderSaveSlots();
                        alert('导入成功！');
                    }
                } catch (err) { alert('存档文件格式错误！'); }
            };
            reader.readAsText(e.target.files[0]);
        }
        e.target.value = '';
    });
    document.getElementById('start-dir-btn').addEventListener('click', () => SaveManager.requestDirectory());

    // 游戏内按钮
    document.getElementById('meditate-btn').addEventListener('click', meditate);
    document.getElementById('breakthrough-btn').addEventListener('click', breakthrough);
    document.getElementById('recruit-btn').addEventListener('click', recruitDisciple);
    document.getElementById('rebirth-btn').addEventListener('click', rebirth);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('export-btn').addEventListener('click', exportSave);
    document.getElementById('sound-btn').addEventListener('click', toggleSound);
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => {
        if (e.target.files[0]) importSave(e.target.files[0]);
        e.target.value = '';
    });

    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('claim-offline-btn').addEventListener('click', () => {
        const e = calculateOfflineEarnings();
        if (e) applyOfflineEarnings(e);
        document.getElementById('offline-modal').classList.add('hidden');
        gameState.lastSaveTime = Date.now();
        updateUI();
    });
    document.getElementById('close-breakthrough-btn').addEventListener('click', () => {
        document.getElementById('breakthrough-modal').classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat && gameStarted) { e.preventDefault(); meditate(); }
    });

    // 游戏循环（但只在游戏开始后更新UI）
    setInterval(gameTick, 100);
    setInterval(() => { if (gameStarted) saveGame(); }, CONFIG.autoSaveInterval);
    window.addEventListener('beforeunload', () => { if (gameStarted) saveGame(); });

    updateSoundButton();
}

function gameTick() {
    if (!gameStarted) return;
    const now = Date.now();
    const delta = (now - lastTickTime) / 1000;
    lastTickTime = now;

    const cultGain = getCultivationPerSecond() * delta;
    const stoneGain = getStonePerSecond() * delta;
    gameState.cultivation += cultGain;
    gameState.spiritStone += stoneGain;
    gameState.totalCultivation += cultGain;
    gameState.playTime += delta;

    if (gameState.adventure) {
        const prog = getAdventureProgress();
        if (prog && prog.remaining <= 0) completeAdventure();
    }

    if (Math.floor(gameState.playTime) % 5 === 0) checkAchievements();
    updateUI();
}

init();
