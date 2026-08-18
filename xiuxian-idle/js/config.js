/**
 * config.js - 游戏配置数据模块
 * 包含：境界、功法、弟子、丹药、炼丹、炼器、法宝、灵宠、阵法、
 *       历练、秘境、奇遇事件、成就、签到奖励、日常任务、称号、阶段目标等所有配置
 */

/* ============================================================
 * 修仙挂机录 - 核心游戏逻辑 v2
 * 包含：挂机产出、境界、功法、弟子、丹药、法宝、历练、成就、转世
 * ============================================================ */

// ========== 配置数据 ==========
const CONFIG = {
    realms: [
        { name: '练气期', baseCost: 5000, multiplier: 1.85, cultBonus: 0, stoneBonus: 0 },
        { name: '筑基期', baseCost: 50000, multiplier: 1.9, cultBonus: 0.3, stoneBonus: 0.2 },
        { name: '金丹期', baseCost: 500000, multiplier: 2.0, cultBonus: 0.8, stoneBonus: 0.5 },
        { name: '元婴期', baseCost: 5000000, multiplier: 2.1, cultBonus: 2.0, stoneBonus: 1.5 },
        { name: '化神期', baseCost: 50000000, multiplier: 2.2, cultBonus: 5.0, stoneBonus: 4.0 },
        { name: '炼虚期', baseCost: 500000000, multiplier: 2.3, cultBonus: 12.0, stoneBonus: 10.0 },
        { name: '合体期', baseCost: 5000000000, multiplier: 2.4, cultBonus: 30.0, stoneBonus: 25.0 },
        { name: '大乘期', baseCost: 50000000000, multiplier: 2.5, cultBonus: 75.0, stoneBonus: 60.0 },
        { name: '渡劫期', baseCost: 500000000000, multiplier: 2.6, cultBonus: 200.0, stoneBonus: 150.0 },
    ],

    upgrades: [
        { id: 'basic_art', name: '基础吐纳术', desc: '最基础的修炼之法，吸纳天地灵气', baseCost: 15, costMult: 1.18, effect: 'cultivation', baseEffect: 0.4, effectMult: 1.02, unlockRealm: 0, maxLevel: 200 },
        { id: 'spirit_vein', name: '聚灵阵', desc: '布下聚灵阵法，汇聚灵石矿脉', baseCost: 25, costMult: 1.2, effect: 'stone', baseEffect: 0.25, effectMult: 1.02, unlockRealm: 0, maxLevel: 200 },
        { id: 'breathing_art', name: '龟息吐纳法', desc: '上古吐纳法门，大幅提升修为速度', baseCost: 200, costMult: 1.22, effect: 'cultivation', baseEffect: 2, effectMult: 1.025, unlockRealm: 1, maxLevel: 150 },
        { id: 'spirit_field', name: '灵田开垦', desc: '开辟灵田种植灵药，换取灵石', baseCost: 300, costMult: 1.22, effect: 'stone', baseEffect: 1.5, effectMult: 1.025, unlockRealm: 1, maxLevel: 150 },
        { id: 'heart_method', name: '心法要诀', desc: '修炼心法，神识与灵力双修', baseCost: 1000, costMult: 1.24, effect: 'both', baseEffect: 2.5, effectMult: 1.03, unlockRealm: 1, maxLevel: 120 },
        { id: 'alchemy', name: '炼丹之术', desc: '炼制丹药辅助修炼，修为灵石双增', baseCost: 2500, costMult: 1.25, effect: 'both', baseEffect: 5, effectMult: 1.03, unlockRealm: 2, maxLevel: 100 },
        { id: 'artifact_craft', name: '炼器之术', desc: '锻造法宝护身，产出更上一层楼', baseCost: 5000, costMult: 1.28, effect: 'both', baseEffect: 12, effectMult: 1.035, unlockRealm: 2, maxLevel: 100 },
        { id: 'formation', name: '周天星斗阵', desc: '引星辰之力入体，修为暴涨', baseCost: 50000, costMult: 1.3, effect: 'cultivation', baseEffect: 60, effectMult: 1.035, unlockRealm: 3, maxLevel: 80 },
        { id: 'spirit_sword', name: '御剑之术', desc: '剑修法门，凌厉剑意增加灵石获取', baseCost: 60000, costMult: 1.3, effect: 'stone', baseEffect: 40, effectMult: 1.035, unlockRealm: 3, maxLevel: 80 },
        { id: 'dao_insight', name: '悟道心得', desc: '参悟天地法则，全方位提升', baseCost: 200000, costMult: 1.32, effect: 'both', baseEffect: 175, effectMult: 1.04, unlockRealm: 4, maxLevel: 60 },
    ],

    disciple: { baseCost: 80, costMult: 1.35, cultBonus: 0.015, stoneBonus: 0.01, maxCount: 50 },

    // 丹药配置
    pills: [
        { id: 'qi_gathering', name: '聚气丹', desc: '凝聚灵气，修为产出+100%，持续5分钟', icon: '🔴', cost: 300, effect: 'buff_cult', value: 1.0, duration: 300, dailyLimit: 3 },
        { id: 'spirit_talisman', name: '聚灵符', desc: '灵石产出+100%，持续5分钟', icon: '🟡', cost: 300, effect: 'buff_stone', value: 1.0, duration: 300, dailyLimit: 3 },
        { id: 'enlightenment', name: '悟道丹', desc: '立即获得30秒修为产出', icon: '🟣', cost: 250, effect: 'instant_cult', value: 30, dailyLimit: 5 },
        { id: 'wealth', name: '点石成金符', desc: '立即获得60秒灵石产出', icon: '🟢', cost: 250, effect: 'instant_stone', value: 60, dailyLimit: 5 },
        { id: 'double_cult', name: '双倍修为丹', desc: '修为产出+200%，持续3分钟', icon: '🟠', cost: 800, effect: 'buff_cult', value: 2.0, duration: 180, dailyLimit: 2 },
        { id: 'double_stone', name: '聚财符', desc: '灵石产出+200%，持续3分钟', icon: '💎', cost: 800, effect: 'buff_stone', value: 2.0, duration: 180, dailyLimit: 2 },
        { id: 'universal', name: '混元丹', desc: '修为和灵石产出各+80%，持续10分钟', icon: '🔵', cost: 2500, effect: 'buff_both', value: 0.8, duration: 600, dailyLimit: 1 },
        { id: 'healing', name: '回春丹', desc: '立即恢复50%最大生命值', icon: '💚', cost: 300, effect: 'heal', value: 0.5, dailyLimit: 5 },
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
        { id: 'forest', name: '迷雾森林', desc: '低级修士历练之地，偶有灵药', duration: 60, unlockRealm: 0, cultReward: 120, stoneReward: 75, artifactChance: 0.15, pillChance: 0.1 },
        { id: 'cave', name: '幽暗洞窟', desc: '洞窟深处藏有秘宝，但也有危险', duration: 180, unlockRealm: 1, cultReward: 600, stoneReward: 420, artifactChance: 0.25, pillChance: 0.15 },
        { id: 'mountain', name: '灵脉山脉', desc: '灵脉汇聚之地，收获颇丰', duration: 300, unlockRealm: 2, cultReward: 3000, stoneReward: 2100, artifactChance: 0.35, pillChance: 0.2 },
        { id: 'ruins', name: '上古遗迹', desc: '上古修士留下的遗迹，机缘与危机并存', duration: 600, unlockRealm: 3, cultReward: 15000, stoneReward: 10500, artifactChance: 0.45, pillChance: 0.25 },
        { id: 'void', name: '虚空裂隙', desc: '通往异界的裂隙，传说中有仙器', duration: 1200, unlockRealm: 4, cultReward: 90000, stoneReward: 60000, artifactChance: 0.55, pillChance: 0.35 },
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
        { id: 'alchemy_10', name: '初入丹道', desc: '炼丹成功10次', icon: '⚗️', condition: s => (s.alchemySuccessCount || 0) >= 10, reward: { dao: 3, points: 5 } },
        { id: 'alchemy_50', name: '炼丹大师', desc: '炼丹成功50次', icon: '🧪', condition: s => (s.alchemySuccessCount || 0) >= 50, reward: { dao: 10, points: 20 } },
        { id: 'forge_10', name: '初入器道', desc: '炼器成功10次', icon: '🔨', condition: s => (s.forgeSuccessCount || 0) >= 10, reward: { dao: 3, points: 5 } },
        { id: 'forge_50', name: '炼器大师', desc: '炼器成功50次', icon: '⚒️', condition: s => (s.forgeSuccessCount || 0) >= 50, reward: { dao: 10, points: 20 } },
        { id: 'pet_first', name: '初得灵宠', desc: '获得第一只灵宠', icon: '🐾', condition: s => s.activePet || s.petInventory.length > 0, reward: { dao: 2, points: 3 } },
        { id: 'pet_5', name: '灵宠爱好者', desc: '收集5种不同灵宠', icon: '🐾', condition: s => (s.petCollection ? Object.keys(s.petCollection).length : 0) >= 5, reward: { dao: 5, points: 10 } },
        { id: 'formation_1', name: '初窥阵道', desc: '布置第一个阵法', icon: '🔮', condition: s => (s.totalFormations || 0) >= 1, reward: { dao: 2, points: 3 } },
        { id: 'formation_10', name: '阵法大师', desc: '累计布置10个阵法', icon: '🌟', condition: s => (s.totalFormations || 0) >= 10, reward: { dao: 8, points: 15 } },
        { id: 'stone_10k', name: '小富即安', desc: '累计获得10K灵石', icon: '💰', condition: s => (s.totalStoneEarned || 0) >= 10000, reward: { dao: 3, points: 5 } },
        { id: 'stone_1m', name: '富甲一方', desc: '累计获得1M灵石', icon: '💎', condition: s => (s.totalStoneEarned || 0) >= 1000000, reward: { dao: 15, points: 30 } },
        { id: 'realm_huashen', name: '化神大能', desc: '达到化神期', icon: '🌩️', condition: s => s.realmIndex >= 4, reward: { dao: 50, points: 50 } },
        { id: 'realm_dujie', name: '渡劫飞升', desc: '达到渡劫期', icon: '⚡', condition: s => s.realmIndex >= 8, reward: { dao: 200, points: 100 } },
        { id: 'rebirth_3', name: '三世轮回', desc: '转世3次', icon: '🔄', condition: s => s.rebirthCount >= 3, reward: { dao: 30, points: 25 } },
        { id: 'play_10h', name: '潜心苦修', desc: '累计修炼10小时', icon: '⏰', condition: s => s.playTime >= 36000, reward: { dao: 10, points: 15 } },
        { id: 'enhance_5', name: '法宝强化', desc: '将任意法宝强化到+5', icon: '⬆️', condition: s => { let max = 0; (s.artifactInventory || []).forEach(a => { if ((a.level || 0) > max) max = a.level; }); (s.equippedArtifacts || []).forEach(a => { if (a && (a.level || 0) > max) max = a.level; }); return max >= 5; }, reward: { dao: 5, points: 10 } },
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
        { id: 'forge_1', name: '锻造法宝', desc: '炼器1次', icon: '🔨', target: 1, type: 'forge', reward: { stone: 150 } },
        { id: 'breakthrough_1', name: '突破境界', desc: '突破1次', icon: '⇧', target: 1, type: 'breakthrough', reward: { stone: 200 } },
        { id: 'upgrade_5', name: '修炼功法', desc: '升级功法5次', icon: '📖', target: 5, type: 'upgrade', reward: { stone: 150 } },
        { id: 'adventure_1', name: '外出历练', desc: '完成1次历练', icon: '🗺️', target: 1, type: 'adventure', reward: { stone: 200 } },
        { id: 'pill_use_3', name: '服食丹药', desc: '使用3颗丹药', icon: '💊', target: 3, type: 'pill', reward: { stone: 150 } },
        { id: 'recruit_1', name: '招募弟子', desc: '招募1名弟子', icon: '👥', target: 1, type: 'recruit', reward: { stone: 100 } },
    ],

    saveSlotCount: 3,

    // 灵宠配置
    petTypes: [
        { id: 'firefox', name: '火狐', icon: '🦊', effect: 'cultivation', base: 2, desc: '火系灵宠，提升修为产出' },
        { id: 'turtle', name: '玄龟', icon: '🐢', effect: 'stone', base: 1.5, desc: '水系灵宠，提升灵石产出' },
        { id: 'crane', name: '仙鹤', icon: '🦢', effect: 'both', base: 1, desc: '风系灵宠，全方位提升' },
        { id: 'tiger', name: '白虎', icon: '🐯', effect: 'cultivation', base: 4, desc: '金系灵宠，大幅提升修为' },
        { id: 'dragon', name: '青龙', icon: '🐉', effect: 'both', base: 3, desc: '神兽后裔，全方位大幅提升' },
    ],
    petQualities: [
        { name: '凡品', mult: 1.0, color: 'common', maxLevel: 20 },
        { name: '良品', mult: 1.5, color: 'uncommon', maxLevel: 30 },
        { name: '上品', mult: 2.5, color: 'rare', maxLevel: 50 },
        { name: '极品', mult: 4.0, color: 'epic', maxLevel: 80 },
        { name: '仙品', mult: 7.0, color: 'legendary', maxLevel: 100 },
    ],
    petUpgradeCostBase: 50,
    petUpgradeCostMult: 1.2,

    // 炼丹配置
    alchemyRecipes: [
        { pillId: 'qi_gathering', name: '聚气丹', cost: 150, successRate: 0.85, cooldown: 10 },
        { pillId: 'spirit_talisman', name: '聚灵符', cost: 150, successRate: 0.85, cooldown: 10 },
        { pillId: 'enlightenment', name: '悟道丹', cost: 100, successRate: 0.80, cooldown: 10 },
        { pillId: 'wealth', name: '点石成金符', cost: 100, successRate: 0.80, cooldown: 10 },
        { pillId: 'double_cult', name: '双倍修为丹', cost: 400, successRate: 0.65, cooldown: 20 },
        { pillId: 'double_stone', name: '聚财符', cost: 400, successRate: 0.65, cooldown: 20 },
        { pillId: 'universal', name: '混元丹', cost: 1200, successRate: 0.45, cooldown: 30 },
        { pillId: 'healing', name: '回春丹', cost: 150, successRate: 0.90, cooldown: 8 },
    ],

    // 炼器配置
    forgeRecipes: [
        { qualityIndex: 0, name: '凡品法宝', cost: 100, successRate: 0.90, cooldown: 12 },
        { qualityIndex: 1, name: '良品法宝', cost: 300, successRate: 0.70, cooldown: 18 },
        { qualityIndex: 2, name: '上品法宝', cost: 800, successRate: 0.50, cooldown: 25 },
        { qualityIndex: 3, name: '极品法宝', cost: 2500, successRate: 0.30, cooldown: 35 },
        { qualityIndex: 4, name: '仙品法宝', cost: 8000, successRate: 0.10, cooldown: 50 },
    ],

    // 阵法配置
    formations: [
        { id: 'gathering', name: '聚灵阵', icon: '🔮', desc: '汇聚天地灵气，修为产出+15%', cost: 1000, duration: 1800, effect: 'cultivation', value: 0.15 },
        { id: 'wealth', name: '聚财阵', icon: '💰', desc: '引动财气入体，灵石产出+15%', cost: 1000, duration: 1800, effect: 'stone', value: 0.15 },
        { id: 'protection', name: '护山大阵', icon: '🛡️', desc: '全方位守护，修为灵石各+10%', cost: 2000, duration: 1800, effect: 'both', value: 0.10 },
        { id: 'star', name: '周天星斗阵', icon: '⭐', desc: '引星辰之力入体，修为产出+35%', cost: 6000, duration: 1800, effect: 'cultivation', value: 0.35 },
        { id: 'primordial', name: '混元无极阵', icon: '☯️', desc: '混沌之力环绕，全产出+30%', cost: 10000, duration: 1800, effect: 'both', value: 0.30 },
    ],

    // 永久丹药（天材地宝）
    heavenlyItems: [
        { id: 'ginseng', name: '千年人参', icon: '🌿', desc: '永久+0.5修为/秒', cost: 2000, effect: 'cultivation', value: 0.5, maxUse: 10 },
        { id: 'ganoderma', name: '万年灵芝', icon: '🍄', desc: '永久+0.3灵石/秒', cost: 2000, effect: 'stone', value: 0.3, maxUse: 10 },
        { id: 'peach', name: '蟠桃', icon: '🍑', desc: '永久+1%全产出', cost: 5000, effect: 'both_mult', value: 0.01, maxUse: 20 },
        { id: 'lotus', name: '九转金莲', icon: '🪷', desc: '永久+2修为/秒', cost: 8000, effect: 'cultivation', value: 2, maxUse: 5 },
        { id: 'tear', name: '凤凰泪', icon: '💧', desc: '永久+1灵石/秒', cost: 8000, effect: 'stone', value: 1, maxUse: 5 },
    ],

    // 法宝强化
    artifactEnhance: {
        costBase: 200,
        costMult: 1.5,
        bonusPerLevel: 0.10,
        maxLevel: 9,
        successRate: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
    },

    // 灵宠羁绊
    petBonds: [
        { id: 'fire', name: '火系共鸣', pets: ['firefox', 'tiger'], bonus: { type: 'cultivation', value: 0.05 }, desc: '收集火狐+白虎，修为+5%' },
        { id: 'water', name: '水系共鸣', pets: ['turtle', 'crane'], bonus: { type: 'stone', value: 0.05 }, desc: '收集玄龟+仙鹤，灵石+5%' },
        { id: 'beast', name: '四灵齐聚', pets: ['firefox', 'turtle', 'tiger', 'dragon'], bonus: { type: 'both', value: 0.10 }, desc: '收集四灵，全产出+10%' },
    ],

    // 阶段目标
    stageGoals: [
        { id: 'g1', desc: '突破到筑基期', check: s => s.realmIndex >= 1 },
        { id: 'g2', desc: '招募5名弟子', check: s => s.discipleCount >= 5 },
        { id: 'g3', desc: '获得第一件法宝', check: s => s.artifactFoundCount >= 1 },
        { id: 'g4', desc: '突破到金丹期', check: s => s.realmIndex >= 2 },
        { id: 'g5', desc: '炼丹成功10次', check: s => (s.alchemySuccessCount || 0) >= 10 },
        { id: 'g6', desc: '获得第一只灵宠', check: s => s.activePet || s.petInventory.length > 0 },
        { id: 'g7', desc: '布置第一个阵法', check: s => (s.totalFormations || 0) >= 1 },
        { id: 'g8', desc: '突破到元婴期', check: s => s.realmIndex >= 3 },
        { id: 'g9', desc: '炼器成功10次', check: s => (s.forgeSuccessCount || 0) >= 10 },
        { id: 'g10', desc: '首次转世重修', check: s => s.rebirthCount >= 1 },
        { id: 'g11', desc: '突破到化神期', check: s => s.realmIndex >= 4 },
        { id: 'g12', desc: '累计修炼10小时', check: s => s.playTime >= 36000 },
    ],

    // 称号系统
    titles: [
        { id: 'beginner', name: '初入修仙', desc: '开始修仙之旅', condition: s => s.playTime >= 60, bonus: { cultivation: 0, stone: 0 } },
        { id: 'alchemist', name: '炼丹学徒', desc: '炼丹成功10次', condition: s => (s.alchemySuccessCount || 0) >= 10, bonus: { cultivation: 0.02 } },
        { id: 'master_alchemist', name: '炼丹大师', desc: '炼丹成功50次', condition: s => (s.alchemySuccessCount || 0) >= 50, bonus: { cultivation: 0.05 } },
        { id: 'blacksmith', name: '炼器学徒', desc: '炼器成功10次', condition: s => (s.forgeSuccessCount || 0) >= 10, bonus: { stone: 0.02 } },
        { id: 'master_blacksmith', name: '炼器大师', desc: '炼器成功50次', condition: s => (s.forgeSuccessCount || 0) >= 50, bonus: { stone: 0.05 } },
        { id: 'rich', name: '灵石富翁', desc: '累计拥有10000灵石', condition: s => s.totalStoneEarned >= 10000, bonus: { stone: 0.03 } },
        { id: 'cultivator', name: '修炼狂人', desc: '累计修为达100K', condition: s => s.totalCultivation >= 100000, bonus: { cultivation: 0.03 } },
        { id: 'reborn', name: '转世仙人', desc: '转世3次', condition: s => s.rebirthCount >= 3, bonus: { cultivation: 0.05, stone: 0.05 } },
        { id: 'collector', name: '灵宠收藏家', desc: '收集5种不同灵宠', condition: s => (s.petCollection ? Object.keys(s.petCollection).length : 0) >= 5, bonus: { cultivation: 0.02, stone: 0.02 } },
    ],

    // 限时活动
    events: {
        doubleCultDay: 1, // 周一双倍修为
        doubleStoneDay: 4, // 周四双倍灵石
        weekendBonus: 0.2, // 周末全产出+20%
    },

    // 设置默认值
    defaultSettings: {
        soundEnabled: true,
        autoSaveInterval: 30, // 秒
        numberFormat: 'short', // short/full
        showFloatingText: true,
    },

    // 秘境配置
    dungeons: [
        { id: 'forest', name: '妖兽森林', desc: '低级妖兽出没，适合练气期修士', realmReq: 0, powerReq: 50, cost: 100, cooldown: 120, cultReward: 200, stoneReward: 150, artifactChance: 0.2, petChance: 0.15, talentPointChance: 0 },
        { id: 'cave', name: '骸骨洞窟', desc: '阴邪之气浓重，藏有古修遗宝', realmReq: 1, powerReq: 300, cost: 300, cooldown: 180, cultReward: 800, stoneReward: 600, artifactChance: 0.3, petChance: 0.2, talentPointChance: 0 },
        { id: 'battlefield', name: '天魔战场', desc: '上古战场遗迹，危险与机缘并存', realmReq: 2, powerReq: 2000, cost: 800, cooldown: 300, cultReward: 4000, stoneReward: 3000, artifactChance: 0.4, petChance: 0.25, talentPointChance: 0 },
        { id: 'mansion', name: '仙府遗迹', desc: '上古仙人洞府，传说中有仙器', realmReq: 3, powerReq: 15000, cost: 2000, cooldown: 600, cultReward: 20000, stoneReward: 15000, artifactChance: 0.5, petChance: 0.3, talentPointChance: 0 },
        { id: 'void', name: '虚空战场', desc: '异界生物入侵之地，唯有大能可入', realmReq: 4, powerReq: 100000, cost: 5000, cooldown: 900, cultReward: 100000, stoneReward: 80000, artifactChance: 0.6, petChance: 0.4, talentPointChance: 0 },
    ],

    // 随机事件配置
    randomEvents: [
        {
            id: 'old_man', title: '路遇老者', desc: '一位白发老者拦住了你，说要传你一段机缘，但需要你付出一些灵石。',
            choices: [
                { text: '付出100灵石求教', result: () => { if (gameState.spiritStone >= 100) { gameState.spiritStone -= 100; const g = 500; gameState.cultivation += g; gameState.totalCultivation += g; return `老者传授心得，获得${formatNumber(g)}修为！`; } return '灵石不足，老者摇头离去。'; } },
                { text: '婉拒离开', result: () => '你礼貌地拒绝了老者，继续修炼。' },
            ]
        },
        {
            id: 'treasure', title: '发现宝箱', desc: '你在修炼时发现一个古旧宝箱，似乎需要强行打开。',
            choices: [
                { text: '强行打开（可能受伤）', result: () => { if (Math.random() > 0.3) { const s = 300 + Math.floor(Math.random() * 500); gameState.spiritStone += s; return `宝箱中有${s}灵石！`; } const loss = Math.floor(gameState.cultivation * 0.1); gameState.cultivation = Math.max(0, gameState.cultivation - loss); return `宝箱是陷阱！损失${formatNumber(loss)}修为。`; } },
                { text: '谨慎离开', result: () => '你决定不冒险，安全离开。' },
            ]
        },
        {
            id: 'merchant', title: '云游商人', desc: '一位神秘商人向你兜售商品，价格优惠但数量有限。',
            choices: [
                { text: '花200灵石买神秘丹药', result: () => { if (gameState.spiritStone >= 200) { gameState.spiritStone -= 200; const pill = CONFIG.pills[Math.floor(Math.random() * CONFIG.pills.length)]; gameState.pills[pill.id] = (gameState.pills[pill.id] || 0) + 2; return `获得${pill.name} x2！`; } return '灵石不足。'; } },
                { text: '花500灵石买灵宠蛋', result: () => { if (gameState.spiritStone >= 500) { if (!canAddPet()) return '灵宠背包已满，请先放生。'; gameState.spiritStone -= 500; const pet = generatePet(); gameState.petInventory.push(pet); return `孵化出【${pet.name}】！`; } return '灵石不足。'; } },
                { text: '不买', result: () => '商人耸耸肩离开了。' },
            ]
        },
        {
            id: 'enlightenment', title: '顿悟天机', desc: '你突然心有所感，似乎触摸到了大道的边缘。',
            choices: [
                { text: '闭关参悟', result: () => { const g = getCultivationPerSecond() * 60; gameState.cultivation += g; gameState.totalCultivation += g; return `顿悟成功！获得${formatNumber(g)}修为（相当于60秒产出）！`; } },
                { text: '顺其自然', result: () => '你将这份感悟记在心中，继续日常修炼。' },
            ]
        },
        {
            id: 'disciple_offer', title: '拜师者', desc: '一位年轻人慕名而来，希望拜你为师，但他资质平平。',
            choices: [
                { text: '收为弟子（获得1名弟子）', result: () => { if (gameState.discipleCount < CONFIG.disciple.maxCount) { gameState.discipleCount++; return '你收下了这名弟子，虽然资质平平但胜在勤恳。'; } return '弟子已达上限，无法再收。'; } },
                { text: '赠予灵石打发', result: () => { if (gameState.spiritStone >= 50) { gameState.spiritStone -= 50; return '你给了他50灵石作为盘缠，他感激离去。'; } return '灵石不足，年轻人失望离去。'; } },
            ]
        },
        {
            id: 'spirit_spring', title: '灵泉涌现', desc: '地面突然涌出一股灵泉，灵气充沛！',
            choices: [
                { text: '尽情吸收', result: () => { const g = getCultivationPerSecond() * 120; const s = getStonePerSecond() * 120; gameState.cultivation += g; gameState.totalCultivation += g; gameState.spiritStone += s; return `吸收灵泉！获得${formatNumber(g)}修为和${formatNumber(s)}灵石！`; } },
            ]
        },
        {
            id: 'rogue', title: '遇到劫匪', desc: '几个劫匪拦住了你，索要买路财。',
            choices: [
                { text: '交出100灵石', result: () => { if (gameState.spiritStone >= 100) { gameState.spiritStone -= 100; return '你交出灵石，劫匪放你离开。'; } return '你灵石不够，被劫匪搜走了全部灵石！'; } },
                { text: '奋起反抗', result: () => { if (Math.random() > 0.4) { const s = 200; gameState.spiritStone += s; return `你击退了劫匪，还缴获了${s}灵石！`; } const loss = Math.floor(gameState.cultivation * 0.15); gameState.cultivation = Math.max(0, gameState.cultivation - loss); return `你寡不敌众，被打伤损失${formatNumber(loss)}修为。`; } },
            ]
        },
        {
            id: 'fate', title: '算命先生', desc: '一位算命先生说能为你测算机缘，需要一些灵石。',
            choices: [
                { text: '花50灵石测算', result: () => { if (gameState.spiritStone >= 50) { gameState.spiritStone -= 50; if (Math.random() > 0.5) { gameState.dao += 1; return '先生说你气运加身，你感到道韵增长了1点！'; } return '先生说你近期平淡，并无特别机缘。'; } return '灵石不足。'; } },
                { text: '不信这些', result: () => '你摆摆手离开了。' },
            ]
        },
    ],
    eventMinInterval: 1800, // 事件最小间隔（秒）= 30分钟
    eventMaxInterval: 3600, // 事件最大间隔（秒）= 60分钟
    eventMaxPerDay: 5, // 每天最多奇遇次数

    baseCultivation: 1.5,
    baseStone: 0.8,
    meditateMultiplier: 0.8,
    meditateBase: 1,
    comboTimeout: 1500, // 连击超时（毫秒）
    comboMaxMultiplier: 2.0, // 最大连击倍率
    saveKey: 'xiuxian_idle_save_v3',
    autoSaveInterval: 30000,
    maxOfflineHours: 48,
    offlineEfficiency: 0.5, // 离线收益效率
    petInventoryMax: 20, // 灵宠背包上限
};

