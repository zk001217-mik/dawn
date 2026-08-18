/* ============================================================
 * 修仙挂机录 - 核心游戏逻辑 v2
 * 包含：挂机产出、境界、功法、弟子、丹药、法宝、历练、成就、转世
 * ============================================================ */

// ========== 配置数据 ==========
const CONFIG = {
    realms: [
        { name: '练气期', baseCost: 150, multiplier: 1.6, cultBonus: 0, stoneBonus: 0 },
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

    disciple: { baseCost: 50, costMult: 1.3, cultBonus: 0.03, stoneBonus: 0.02, maxCount: 50 },

    // 丹药配置
    pills: [
        { id: 'qi_gathering', name: '聚气丹', desc: '凝聚灵气，修为产出+100%，持续5分钟', icon: '🔴', cost: 150, effect: 'buff_cult', value: 1.0, duration: 300 },
        { id: 'spirit_talisman', name: '聚灵符', desc: '灵石产出+100%，持续5分钟', icon: '🟡', cost: 150, effect: 'buff_stone', value: 1.0, duration: 300 },
        { id: 'enlightenment', name: '悟道丹', desc: '立即获得30秒修为产出', icon: '🟣', cost: 120, effect: 'instant_cult', value: 30 },
        { id: 'wealth', name: '点石成金符', desc: '立即获得60秒灵石产出', icon: '🟢', cost: 120, effect: 'instant_stone', value: 60 },
        { id: 'double_cult', name: '双倍修为丹', desc: '修为产出+200%，持续3分钟', icon: '🟠', cost: 450, effect: 'buff_cult', value: 2.0, duration: 180 },
        { id: 'double_stone', name: '聚财符', desc: '灵石产出+200%，持续3分钟', icon: '💎', cost: 450, effect: 'buff_stone', value: 2.0, duration: 180 },
        { id: 'universal', name: '混元丹', desc: '修为和灵石产出各+80%，持续10分钟', icon: '🔵', cost: 1200, effect: 'buff_both', value: 0.8, duration: 600 },
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
        { id: 'meditate_20', name: '打坐修炼', desc: '打坐20次', icon: '☯', target: 20, type: 'meditate', reward: { stone: 100 } },
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
        { pillId: 'qi_gathering', name: '聚气丹', cost: 80, successRate: 0.85, cooldown: 8 },
        { pillId: 'spirit_talisman', name: '聚灵符', cost: 80, successRate: 0.85, cooldown: 8 },
        { pillId: 'enlightenment', name: '悟道丹', cost: 60, successRate: 0.80, cooldown: 8 },
        { pillId: 'wealth', name: '点石成金符', cost: 60, successRate: 0.80, cooldown: 8 },
        { pillId: 'double_cult', name: '双倍修为丹', cost: 250, successRate: 0.65, cooldown: 15 },
        { pillId: 'double_stone', name: '聚财符', cost: 250, successRate: 0.65, cooldown: 15 },
        { pillId: 'universal', name: '混元丹', cost: 700, successRate: 0.45, cooldown: 25 },
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
        { id: 'gathering', name: '聚灵阵', icon: '🔮', desc: '汇聚天地灵气，修为产出+20%', cost: 500, duration: 1800, effect: 'cultivation', value: 0.20 },
        { id: 'wealth', name: '聚财阵', icon: '💰', desc: '引动财气入体，灵石产出+20%', cost: 500, duration: 1800, effect: 'stone', value: 0.20 },
        { id: 'protection', name: '护山大阵', icon: '🛡️', desc: '全方位守护，修为灵石各+15%', cost: 1000, duration: 1800, effect: 'both', value: 0.15 },
        { id: 'star', name: '周天星斗阵', icon: '⭐', desc: '引星辰之力入体，修为产出+50%', cost: 3000, duration: 1800, effect: 'cultivation', value: 0.50 },
        { id: 'primordial', name: '混元无极阵', icon: '☯️', desc: '混沌之力环绕，全产出+40%', cost: 5000, duration: 1800, effect: 'both', value: 0.40 },
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
    eventMinInterval: 180, // 事件最小间隔（秒）
    eventMaxInterval: 420, // 事件最大间隔（秒）

    baseCultivation: 1.5,
    baseStone: 0.8,
    meditateMultiplier: 0.8,
    meditateBase: 1,
    comboTimeout: 1500, // 连击超时（毫秒）
    comboMaxMultiplier: 2.0, // 最大连击倍率
    saveKey: 'xiuxian_idle_save_v3',
    autoSaveInterval: 30000,
    maxOfflineHours: 8,
    offlineEfficiency: 0.8, // 离线收益效率
    petInventoryMax: 20, // 灵宠背包上限
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
    // 灵宠
    activePet: null,
    petInventory: [],
    // 秘境
    dungeonCooldowns: {}, // { dungeonId: timestamp }
    talentPoints: 0,
    // 炼丹炼器
    alchemyCooldowns: {}, // { pillId: timestamp }
    forgeCooldowns: {}, // { qualityIndex: timestamp }
    // 阵法
    activeFormations: [], // [{ id, endTime }]
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
    settings: { soundEnabled: true, autoSaveInterval: 30, numberFormat: 'short', showFloatingText: true },
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
    return u.baseEffect * lv * Math.pow(1.02, lv);
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

function getPetBondBonus(type) {
    let bonus = 0;
    if (!gameState.petCollection) return 0;
    CONFIG.petBonds.forEach(bond => {
        const allCollected = bond.pets.every(p => gameState.petCollection[p]);
        if (allCollected && (bond.bonus.type === type || bond.bonus.type === 'both')) {
            bonus += bond.bonus.value;
        }
    });
    return bonus;
}

function getTitleBonus(type) {
    if (!gameState.currentTitle) return 0;
    const title = CONFIG.titles.find(t => t.id === gameState.currentTitle);
    if (!title) return 0;
    return title.bonus[type] || 0;
}

function getEventBonus(type) {
    const day = new Date().getDay(); // 0=周日, 1=周一...
    let bonus = 0;
    if (day === CONFIG.events.doubleCultDay && type === 'cultivation') bonus += 1.0;
    if (day === CONFIG.events.doubleStoneDay && type === 'stone') bonus += 1.0;
    if (day === 0 || day === 6) bonus += CONFIG.events.weekendBonus; // 周末
    return bonus;
}

function getCultivationPerSecond() {
    let base = CONFIG.baseCultivation + (gameState.heavenlyBonus ? gameState.heavenlyBonus.cultivation : 0);
    let bonus = 0;
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'cultivation' || u.effect === 'both') bonus += getUpgradeEffect(u.id);
    });
    bonus += getArtifactBonus('cultivation');
    if (gameState.activePet) bonus += getPetBonus(gameState.activePet).cultivation;
    const realmMult = 1 + getCurrentRealm().cultBonus;
    const discipleMult = 1 + gameState.discipleCount * CONFIG.disciple.cultBonus;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('cultivation');
    const formationMult = 1 + getFormationBonus('cultivation');
    const bondMult = 1 + getPetBondBonus('cultivation');
    const titleMult = 1 + getTitleBonus('cultivation');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('cultivation');
    return (base + bonus) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult;
}

function getStonePerSecond() {
    let base = CONFIG.baseStone + (gameState.heavenlyBonus ? gameState.heavenlyBonus.stone : 0);
    let bonus = 0;
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'stone' || u.effect === 'both') bonus += getUpgradeEffect(u.id);
    });
    bonus += getArtifactBonus('stone');
    if (gameState.activePet) bonus += getPetBonus(gameState.activePet).stone;
    const realmMult = 1 + getCurrentRealm().stoneBonus;
    const discipleMult = 1 + gameState.discipleCount * CONFIG.disciple.stoneBonus;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('stone');
    const formationMult = 1 + getFormationBonus('stone');
    const bondMult = 1 + getPetBondBonus('stone');
    const titleMult = 1 + getTitleBonus('stone');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('stone');
    return (base + bonus) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult;
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

function getBreakthroughFailRate() {
    const rates = [0, 0.05, 0.10, 0.15, 0.20, 0.20, 0.20, 0.20, 0.20];
    const r = rates[gameState.realmIndex];
    return r !== undefined ? r : 0.20;
}

function breakthrough() {
    const cost = getBreakthroughCost();
    if (gameState.cultivation < cost) { addLog('修为不足，无法突破！', ''); SFX.error(); return false; }
    gameState.cultivation -= cost;
    gameState.breakthroughCount++;
    const failRate = getBreakthroughFailRate();
    if (Math.random() < failRate) {
        const loss = Math.floor(cost * 0.3);
        gameState.cultivation = Math.max(0, gameState.cultivation - loss);
        SFX.error();
        addLog(`突破失败！走火入魔，损失${formatNumber(loss)}修为（成功率${Math.floor((1-failRate)*100)}%）`, '');
        updateUI();
        return false;
    }
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
    // 重置签到
    gameState.lastCheckinDate = '';
    gameState.checkinStreak = 0;
    gameState.checkinClaimedDays = [];
    // 重置日常任务
    gameState.taskProgress = {};
    gameState.taskClaimed = {};
    gameState.lastTaskReset = '';
    // 重置秘境冷却
    gameState.dungeonCooldowns = {};
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
function generateArtifact(forceQuality = null) {
    const type = CONFIG.artifactTypes[Math.floor(Math.random() * CONFIG.artifactTypes.length)];
    const qualityIndex = forceQuality !== null ? forceQuality : randomQuality();
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
        level: 0,
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
    const realmScale = 1 + gameState.realmIndex * 0.3;
    const sellPrice = Math.floor(art.bonus * 20 * (art.qualityIndex + 1) * realmScale);
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
    if (ach.reward.points) {
        gameState.achievementPoints = (gameState.achievementPoints || 0) + ach.reward.points;
        addLog(`获得成就点数：${ach.reward.points}`, 'success');
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
    const eff = CONFIG.offlineEfficiency || 0.8;
    return {
        seconds: offlineSeconds,
        cultivation: getCultivationPerSecond() * offlineSeconds * eff,
        stones: getStonePerSecond() * offlineSeconds * eff,
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
    const failRate = getBreakthroughFailRate();
    const successPct = Math.floor((1 - failRate) * 100);
    if (gameState.cultivation >= cost) { btBtn.disabled = false; btCost.textContent = `消耗 ${formatNumber(cost)} 修为 (成功率${successPct}%)`; }
    else { btBtn.disabled = true; btCost.textContent = `需要 ${formatNumber(cost)} 修为 (成功率${successPct}%)`; }

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
    // 灵宠
    renderPets();
    // 秘境
    renderDungeons();
    // 炼丹
    renderAlchemy();
    // 炼器
    renderForge();
    // 阵法
    renderFormations();
    // 永久丹药
    renderHeavenlyItems();
    // 灵宠图鉴
    renderPetCollection();
    // 成就商店
    renderAchievementShop();
    // 设置
    renderSettings();
    // 统计
    renderStats();
    // 称号
    renderTitles();
    // 阶段目标
    const goal = getCurrentGoal();
    const goalEl = document.getElementById('current-goal');
    if (goalEl) goalEl.textContent = goal ? `🎯 ${goal.desc}` : '🎉 所有目标已完成！';
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

function getUpgradeEffectAtLevel(id, level) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    if (level === 0) return 0;
    return u.baseEffect * level * Math.pow(1.02, level);
}

function renderUpgrades() {
    const container = document.getElementById('upgrade-list');
    container.innerHTML = '';
    CONFIG.upgrades.forEach(u => {
        const lv = gameState.upgrades[u.id];
        const cost = getUpgradeCost(u.id);
        const effect = getUpgradeEffect(u.id);
        const nextEffect = getUpgradeEffectAtLevel(u.id, lv + 1);
        const unlocked = gameState.realmIndex >= u.unlockRealm;
        const canAfford = gameState.spiritStone >= cost;
        const maxed = lv >= u.maxLevel;
        const item = document.createElement('div');
        item.className = 'upgrade-item' + (!unlocked ? ' locked' : (!canAfford && !maxed ? ' cant-afford' : ''));
        let effectText = u.effect === 'cultivation' ? `修为 +${formatNumber(effect)}/秒` : u.effect === 'stone' ? `灵石 +${formatNumber(effect)}/秒` : `修为+${formatNumber(effect)}/秒 灵石+${formatNumber(effect)}/秒`;
        let previewText = '';
        if (!maxed && unlocked) {
            const delta = nextEffect - effect;
            previewText = `<div class="upgrade-effect" style="color:var(--success);font-size:11px">升级后 +${formatNumber(delta)}/秒</div>`;
        }
        item.innerHTML = `
            <div class="upgrade-header"><span class="upgrade-name">${u.name}</span><span class="upgrade-level">Lv.${lv}${maxed ? ' (满)' : ''}</span></div>
            <div class="upgrade-desc">${u.desc}</div>
            <div class="upgrade-effect">${effectText}</div>
            ${previewText}
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
        const lvl = art.level || 0;
        const enhanceCost = Math.floor(CONFIG.artifactEnhance.costBase * Math.pow(CONFIG.artifactEnhance.costMult, lvl));
        const enhanceRate = CONFIG.artifactEnhance.successRate[lvl] || 0.2;
        item.title = `${art.name}${lvl > 0 ? ' +' + lvl : ''}\n效果: +${formatNumber(art.bonus)} ${art.effect === 'cultivation' ? '修为' : art.effect === 'stone' ? '灵石' : '全属性'}/秒\n左键装备 | 右键分解 | 双击强化(${enhanceRate*100}%)`;
        item.innerHTML = `<span class="inv-icon">${art.icon}</span><span class="inv-name">${art.name}${lvl > 0 ? ' +' + lvl : ''}</span>`;
        item.addEventListener('click', () => {
            const emptySlot = gameState.equippedArtifacts.findIndex(s => s === null);
            if (emptySlot !== -1) equipArtifact(art.uid, emptySlot);
            else addLog('法宝槽位已满，请先卸下一个', '');
        });
        item.addEventListener('contextmenu', (e) => { e.preventDefault(); sellArtifact(art.uid); });
        item.addEventListener('dblclick', () => { if (lvl < CONFIG.artifactEnhance.maxLevel) enhanceArtifact(art.uid); else addLog('已达最高强化等级', ''); });
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
        scheduleNextEvent();
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

// ========== 灵宠渲染 ==========
function renderPets() {
    const activeContainer = document.getElementById('pet-active');
    if (!activeContainer) return;
    if (gameState.activePet) {
        const pet = gameState.activePet;
        const bonus = getPetBonus(pet);
        const quality = CONFIG.petQualities[pet.qualityIndex];
        const upgradeCost = getPetUpgradeCost(pet);
        const maxed = pet.level >= quality.maxLevel;
        activeContainer.className = 'pet-active quality-' + pet.qualityColor;
        activeContainer.innerHTML = `
            <div class="pet-active-icon">${pet.icon}</div>
            <div class="pet-active-name">${pet.name}</div>
            <div class="pet-active-info">
                Lv.${pet.level}/${quality.maxLevel} | 好感度:${pet.affection}/100<br>
                修为+${formatNumber(bonus.cultivation)}/秒 灵石+${formatNumber(bonus.stone)}/秒
            </div>
            <div class="pet-active-bar"><div class="pet-active-fill" style="width:${pet.affection}%"></div></div>
            <div class="pet-actions">
                <button class="pet-btn" ${maxed || gameState.spiritStone < upgradeCost ? 'disabled' : ''} id="pet-upgrade-btn">升级 ${formatNumber(upgradeCost)}灵石</button>
                <button class="pet-btn" ${gameState.spiritStone < 30 ? 'disabled' : ''} id="pet-feed-btn">喂养 30灵石</button>
                <button class="pet-btn" id="pet-unequip-btn">收回</button>
                <button class="pet-btn" id="pet-release-btn" style="color:var(--accent-red)">放生</button>
            </div>`;
        document.getElementById('pet-upgrade-btn')?.addEventListener('click', () => upgradePet(pet.uid));
        document.getElementById('pet-feed-btn')?.addEventListener('click', feedPet);
        document.getElementById('pet-unequip-btn')?.addEventListener('click', unequipPet);
        document.getElementById('pet-release-btn')?.addEventListener('click', () => { if (confirm(`确定放生${pet.name}？将获得灵石奖励`)) releasePet(pet.uid); });
    } else {
        activeContainer.className = 'pet-active empty';
        activeContainer.innerHTML = `<div class="pet-active-icon">❓</div><div class="pet-active-name">未出战灵宠</div><div class="pet-active-info">从下方选择一只灵宠出战</div>`;
    }

    const invContainer = document.getElementById('pet-inventory');
    if (!invContainer) return;
    invContainer.innerHTML = '';
    const maxPets = CONFIG.petInventoryMax || 20;
    const countEl = document.createElement('div');
    countEl.style.cssText = 'grid-column:1/-1;text-align:center;font-size:11px;color:var(--text-muted);margin-bottom:4px';
    countEl.textContent = `灵宠背包：${gameState.petInventory.length}/${maxPets}`;
    invContainer.appendChild(countEl);
    if (gameState.petInventory.length === 0) {
        invContainer.innerHTML += '<p class="no-buff" style="grid-column:1/-1">暂无灵宠，去秘境或奇遇中获取吧</p>';
    }
    gameState.petInventory.forEach(pet => {
        const item = document.createElement('div');
        item.className = `pet-inv-item quality-${pet.qualityColor}`;
        item.title = `${pet.name}\nLv.${pet.level} 好感度${pet.affection}\n点击出战，右键放生`;
        item.innerHTML = `<span class="pet-icon">${pet.icon}</span><span class="pet-name">${pet.name}</span><span class="pet-level">Lv.${pet.level}</span>`;
        item.addEventListener('click', () => equipPet(pet.uid));
        item.addEventListener('contextmenu', (e) => { e.preventDefault(); if (confirm(`放生${pet.name}？获得灵石奖励`)) releasePet(pet.uid); });
        invContainer.appendChild(item);
    });
}

// ========== 秘境渲染 ==========
function renderDungeons() {
    const powerEl = document.getElementById('player-power');
    if (powerEl) powerEl.textContent = formatNumber(getPlayerPower());

    const container = document.getElementById('dungeon-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.dungeons.forEach(d => {
        const unlocked = gameState.realmIndex >= d.realmReq;
        const cd = gameState.dungeonCooldowns[d.id] || 0;
        const cooling = Date.now() < cd;
        const canAfford = gameState.spiritStone >= d.cost;
        const power = getPlayerPower();
        const successRate = Math.min(95, Math.floor(power / d.powerReq * 100));

        const item = document.createElement('div');
        item.className = 'dungeon-item' + (!unlocked ? ' locked' : (cooling ? ' cooling' : ''));
        item.innerHTML = `
            <div class="dungeon-header">
                <span class="dungeon-name">${d.name}</span>
                <span class="dungeon-realm">需${CONFIG.realms[d.realmReq].name}</span>
            </div>
            <div class="dungeon-desc">${d.desc}</div>
            <div class="dungeon-info">
                <span class="dungeon-power-req">推荐战力:${formatNumber(d.powerReq)} (成功率${successRate}%)</span>
                <span class="dungeon-reward">消耗:${formatNumber(d.cost)}灵石</span>
            </div>
            ${cooling ? `<div class="dungeon-cooldown">冷却中: ${formatCountdown((cd - Date.now()) / 1000)}</div>` : ''}
            ${!unlocked ? `<div class="dungeon-desc" style="color:var(--accent-red)">境界不足，无法挑战</div>` : ''}`;
        if (unlocked && !cooling && canAfford) {
            item.addEventListener('click', () => challengeDungeon(d.id));
        }
        container.appendChild(item);
    });
}

// ========== 炼丹渲染 ==========
function renderAlchemy() {
    const container = document.getElementById('alchemy-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.alchemyRecipes.forEach(recipe => {
        const pill = CONFIG.pills.find(p => p.id === recipe.pillId);
        const cd = gameState.alchemyCooldowns[recipe.pillId] || 0;
        const cooling = Date.now() < cd;
        const canAfford = gameState.spiritStone >= recipe.cost;
        const item = document.createElement('div');
        item.className = 'craft-item' + (cooling || !canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">${pill.icon} 炼制${pill.name}</span><span class="craft-rate">成功率${Math.floor(recipe.successRate*100)}%</span></div>
            <div class="craft-desc">比购买便宜${Math.floor((1 - recipe.cost/pill.cost)*100)}%，失败损失灵石</div>
            <div class="craft-info">消耗:${recipe.cost}灵石 | 冷却:${recipe.cooldown}秒</div>
            ${cooling ? `<div class="craft-cooldown">冷却中: ${formatCountdown((cd - Date.now()) / 1000)}</div>` : `<div style="display:flex;gap:4px"><button class="craft-btn" ${!canAfford ? 'disabled' : ''}>炼丹</button><button class="craft-btn" ${!canAfford ? 'disabled' : ''} id="batch-alch-${recipe.pillId}">连续</button></div>`}`;
        if (!cooling && canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); alchemyPill(recipe.pillId); });
            item.querySelector(`#batch-alch-${recipe.pillId}`).addEventListener('click', (e) => { e.stopPropagation(); batchAlchemy(recipe.pillId); });
        }
        container.appendChild(item);
    });
}

// ========== 炼器渲染 ==========
function renderForge() {
    const container = document.getElementById('forge-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.forgeRecipes.forEach(recipe => {
        const cd = gameState.forgeCooldowns[recipe.qualityIndex] || 0;
        const cooling = Date.now() < cd;
        const canAfford = gameState.spiritStone >= recipe.cost;
        const quality = CONFIG.artifactQualities[recipe.qualityIndex];
        const item = document.createElement('div');
        item.className = 'craft-item quality-' + quality.color + (cooling || !canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">炼制${recipe.name}</span><span class="craft-rate">成功率${Math.floor(recipe.successRate*100)}%</span></div>
            <div class="craft-desc">成功获得随机类型的${quality.name}法宝</div>
            <div class="craft-info">消耗:${recipe.cost}灵石 | 冷却:${recipe.cooldown}秒</div>
            ${cooling ? `<div class="craft-cooldown">冷却中: ${formatCountdown((cd - Date.now()) / 1000)}</div>` : `<div style="display:flex;gap:4px"><button class="craft-btn" ${!canAfford ? 'disabled' : ''}>炼器</button><button class="craft-btn" ${!canAfford ? 'disabled' : ''} id="batch-forge-${recipe.qualityIndex}">连续</button></div>`}`;
        if (!cooling && canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); forgeArtifact(recipe.qualityIndex); });
            item.querySelector(`#batch-forge-${recipe.qualityIndex}`).addEventListener('click', (e) => { e.stopPropagation(); batchForge(recipe.qualityIndex); });
        }
        container.appendChild(item);
    });
}

// ========== 阵法渲染 ==========
function renderFormations() {
    // 活跃阵法
    const activeContainer = document.getElementById('active-formations');
    if (activeContainer) {
        activeContainer.innerHTML = '';
        const now = Date.now();
        gameState.activeFormations = gameState.activeFormations.filter(f => f.endTime > now);
        if (gameState.activeFormations.length === 0) {
            activeContainer.innerHTML = '<p class="no-buff">暂无活跃阵法</p>';
        } else {
            gameState.activeFormations.forEach(f => {
                const formation = CONFIG.formations.find(x => x.id === f.id);
                if (!formation) return;
                const remain = Math.floor((f.endTime - now) / 1000);
                const item = document.createElement('div');
                item.className = 'formation-active';
                item.innerHTML = `<span>${formation.icon} ${formation.name}</span><span class="formation-time">${formatCountdown(remain)}</span>`;
                activeContainer.appendChild(item);
            });
        }
    }
    // 阵法列表
    const listContainer = document.getElementById('formation-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    CONFIG.formations.forEach(formation => {
        const canAfford = gameState.spiritStone >= formation.cost;
        const item = document.createElement('div');
        item.className = 'craft-item' + (!canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">${formation.icon} ${formation.name}</span><span class="craft-rate">+${Math.floor(formation.value*100)}%</span></div>
            <div class="craft-desc">${formation.desc}</div>
            <div class="craft-info">消耗:${formation.cost}灵石 | 持续:${Math.floor(formation.duration/60)}分钟</div>
            <button class="craft-btn" ${!canAfford ? 'disabled' : ''}>布置阵法</button>`;
        if (canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); activateFormation(formation.id); });
        }
        listContainer.appendChild(item);
    });
}

// ========== 产出详情 ==========
function getProductionBreakdown() {
    const cultPerSec = getCultivationPerSecond();
    const stonePerSec = getStonePerSecond();
    const upgradeBonus = CONFIG.upgrades.reduce((sum, u) => {
        if (u.effect === 'cultivation' || u.effect === 'both') return sum + getUpgradeEffect(u.id);
        return sum;
    }, 0);
    const artBonus = getArtifactBonus('cultivation');
    const petBonus = gameState.activePet ? getPetBonus(gameState.activePet).cultivation : 0;
    return {
        cultPerSec, stonePerSec,
        base: CONFIG.baseCultivation,
        upgrades: upgradeBonus,
        artifacts: artBonus,
        pets: petBonus,
        realmMult: 1 + getCurrentRealm().cultBonus,
        discipleMult: 1 + gameState.discipleCount * CONFIG.disciple.cultBonus,
        daoMult: 1 + gameState.dao * 0.01,
        formationMult: 1 + getFormationBonus('cultivation'),
        bondMult: 1 + getPetBondBonus('cultivation'),
        titleMult: 1 + getTitleBonus('cultivation'),
        eventMult: 1 + getEventBonus('cultivation'),
    };
}

function showProductionDetails() {
    const b = getProductionBreakdown();
    const html = `
        <h2>◈ 产出详情 ◈</h2>
        <div style="text-align:left;font-size:13px;line-height:2">
            <div style="display:flex;justify-content:space-between"><span>基础产出</span><span>+${b.base.toFixed(1)}/秒</span></div>
            <div style="display:flex;justify-content:space-between"><span>功法加成</span><span>+${formatNumber(b.upgrades)}/秒</span></div>
            <div style="display:flex;justify-content:space-between"><span>法宝加成</span><span>+${formatNumber(b.artifacts)}/秒</span></div>
            <div style="display:flex;justify-content:space-between"><span>灵宠加成</span><span>+${formatNumber(b.pets)}/秒</span></div>
            <hr style="border-color:var(--border-gold);margin:8px 0">
            <div style="display:flex;justify-content:space-between"><span>境界倍率</span><span>×${b.realmMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>弟子倍率</span><span>×${b.discipleMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>道韵倍率</span><span>×${b.daoMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>阵法倍率</span><span>×${b.formationMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>羁绊倍率</span><span>×${b.bondMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>称号倍率</span><span>×${b.titleMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>活动倍率</span><span>×${b.eventMult.toFixed(2)}</span></div>
            <hr style="border-color:var(--border-gold);margin:8px 0">
            <div style="display:flex;justify-content:space-between;font-weight:bold;color:var(--text-gold-light)"><span>最终修为</span><span>${formatNumber(b.cultPerSec)}/秒</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;color:var(--text-gold-light)"><span>最终灵石</span><span>${formatNumber(b.stonePerSec)}/秒</span></div>
        </div>
        <button class="claim-btn" style="margin-top:16px" onclick="document.getElementById('production-modal').classList.add('hidden')">关闭</button>`;
    document.getElementById('production-modal-content').innerHTML = html;
    document.getElementById('production-modal').classList.remove('hidden');
}

// ========== 批量操作 ==========
function batchAlchemy(pillId) {
    let count = 0;
    while (alchemyPill(pillId)) count++;
    if (count > 0) addLog(`连续炼丹${count}次`, 'success');
}

function batchForge(qualityIndex) {
    let count = 0;
    while (forgeArtifact(qualityIndex)) count++;
    if (count > 0) addLog(`连续炼器${count}次`, 'success');
}

function batchUpgrade(id) {
    let count = 0;
    for (let i = 0; i < 10; i++) {
        if (!buyUpgrade(id)) break;
        count++;
    }
    if (count > 0) addLog(`连续升级${count}次`, 'success');
}

// ========== 冷却提醒 ==========
function checkCooldownNotifications() {
    const now = Date.now();
    const checks = [
        ...CONFIG.alchemyRecipes.map(r => ({ key: 'alch_' + r.pillId, cd: gameState.alchemyCooldowns[r.pillId] || 0, name: '炼丹[' + (CONFIG.pills.find(p=>p.id===r.pillId)?.name || '') + ']' })),
        ...CONFIG.forgeRecipes.map(r => ({ key: 'forge_' + r.qualityIndex, cd: gameState.forgeCooldowns[r.qualityIndex] || 0, name: '炼器[' + r.name + ']' })),
        ...CONFIG.dungeons.map(d => ({ key: 'dung_' + d.id, cd: gameState.dungeonCooldowns[d.id] || 0, name: '秘境[' + d.name + ']' })),
    ];
    checks.forEach(c => {
        const wasCooling = gameState.lastCooldownState[c.key];
        const isCooling = now < c.cd;
        if (wasCooling && !isCooling) {
            addLog(`${c.name}冷却完成`, 'success');
        }
        gameState.lastCooldownState[c.key] = isCooling;
    });
}

// ========== 阶段目标 ==========
function updateStageGoal() {
    while (gameState.currentGoalIndex < CONFIG.stageGoals.length) {
        const goal = CONFIG.stageGoals[gameState.currentGoalIndex];
        if (goal.check(gameState)) {
            if (!gameState.completedGoals.includes(goal.id)) {
                gameState.completedGoals.push(goal.id);
                addLog(`目标完成：${goal.desc}`, 'breakthrough');
            }
            gameState.currentGoalIndex++;
        } else break;
    }
}

function getCurrentGoal() {
    if (gameState.currentGoalIndex >= CONFIG.stageGoals.length) return null;
    return CONFIG.stageGoals[gameState.currentGoalIndex];
}

// ========== 永久丹药 ==========
function useHeavenlyItem(id) {
    const item = CONFIG.heavenlyItems.find(i => i.id === id);
    if (!item) return false;
    const used = gameState.heavenlyUsed[id] || 0;
    if (used >= item.maxUse) { addLog('已达服用上限', ''); SFX.error(); return false; }
    if (gameState.spiritStone < item.cost) { addLog('灵石不足', ''); SFX.error(); return false; }
    gameState.spiritStone -= item.cost;
    gameState.heavenlyUsed[id] = used + 1;
    if (item.effect === 'cultivation') gameState.heavenlyBonus.cultivation += item.value;
    else if (item.effect === 'stone') gameState.heavenlyBonus.stone += item.value;
    else if (item.effect === 'both_mult') gameState.heavenlyBonus.bothMult += item.value;
    SFX.reward();
    addLog(`服用【${item.name}】，${item.desc}（已用${used+1}/${item.maxUse}）`, 'breakthrough');
    updateUI();
    return true;
}

// ========== 法宝强化 ==========
function enhanceArtifact(uid) {
    const art = [...(gameState.artifactInventory || []), ...(gameState.equippedArtifacts || [])].find(a => a && a.uid === uid);
    if (!art) return false;
    const cfg = CONFIG.artifactEnhance;
    const level = art.level || 0;
    if (level >= cfg.maxLevel) { addLog('已达最高强化等级', ''); SFX.error(); return false; }
    const cost = Math.floor(cfg.costBase * Math.pow(cfg.costMult, level));
    if (gameState.spiritStone < cost) { addLog('灵石不足，无法强化', ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    const rate = cfg.successRate[level] || 0.2;
    if (Math.random() < rate) {
        art.level = level + 1;
        art.bonus = Math.floor(art.bonus * (1 + cfg.bonusPerLevel));
        SFX.achievement();
        addLog(`强化成功！${art.name} +${art.level}`, 'breakthrough');
    } else {
        SFX.error();
        addLog(`强化失败！${art.name} 保持+${level}（成功率${Math.floor(rate*100)}%）`, '');
    }
    checkAchievements();
    updateUI();
    return true;
}

// ========== 称号系统 ==========
function checkTitles() {
    CONFIG.titles.forEach(title => {
        if (!gameState.unlockedTitles.includes(title.id) && title.condition(gameState)) {
            gameState.unlockedTitles.push(title.id);
            addLog(`解锁称号：${title.name}`, 'breakthrough');
            if (!gameState.currentTitle) gameState.currentTitle = title.id;
        }
    });
}

function getCurrentTitleName() {
    if (!gameState.currentTitle) return '无';
    const t = CONFIG.titles.find(x => x.id === gameState.currentTitle);
    return t ? t.name : '无';
}

// ========== 永久丹药渲染 ==========
function renderHeavenlyItems() {
    const container = document.getElementById('heavenly-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.heavenlyItems.forEach(item => {
        const used = gameState.heavenlyUsed[item.id] || 0;
        const maxed = used >= item.maxUse;
        const canAfford = gameState.spiritStone >= item.cost;
        const el = document.createElement('div');
        el.className = 'craft-item' + (maxed || !canAfford ? ' disabled' : '');
        el.innerHTML = `
            <div class="craft-header"><span class="craft-name">${item.icon} ${item.name}</span><span class="craft-rate">${used}/${item.maxUse}</span></div>
            <div class="craft-desc">${item.desc}</div>
            <div class="craft-info">消耗:${item.cost}灵石</div>
            ${maxed ? '<div class="craft-cooldown">已达上限</div>' : `<button class="craft-btn" ${!canAfford ? 'disabled' : ''}>服用</button>`}`;
        if (!maxed && canAfford) {
            el.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); useHeavenlyItem(item.id); });
        }
        container.appendChild(el);
    });
}

// ========== 灵宠图鉴渲染 ==========
function renderPetCollection() {
    const container = document.getElementById('pet-collection');
    if (!container) return;
    container.innerHTML = '';
    const collected = gameState.petCollection || {};
    const count = Object.keys(collected).length;
    const header = document.createElement('div');
    header.style.cssText = 'text-align:center;font-size:12px;color:var(--text-muted);margin-bottom:8px';
    header.textContent = `已收集 ${count}/${CONFIG.petTypes.length} 种灵宠`;
    container.appendChild(header);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:4px';
    CONFIG.petTypes.forEach(type => {
        const el = document.createElement('div');
        const has = collected[type.id];
        el.style.cssText = `text-align:center;padding:6px;border-radius:4px;${has ? 'background:var(--bg-panel-light);border:1px solid var(--border-gold)' : 'background:var(--bg-panel);border:1px solid rgba(139,105,20,0.2);opacity:0.4'}`;
        el.innerHTML = `<div style="font-size:20px">${has ? type.icon : '❓'}</div><div style="font-size:9px;color:${has ? 'var(--text-gold-light)' : 'var(--text-muted)'}">${has ? type.name : '???'}</div>`;
        el.title = has ? type.desc : '未收集';
        grid.appendChild(el);
    });
    container.appendChild(grid);
    // 羁绊
    const bondContainer = document.getElementById('pet-bonds');
    if (bondContainer) {
        bondContainer.innerHTML = '';
        CONFIG.petBonds.forEach(bond => {
            const active = bond.pets.every(p => collected[p]);
            const el = document.createElement('div');
            el.style.cssText = `padding:6px;margin-top:4px;border-radius:4px;font-size:11px;${active ? 'background:rgba(212,175,55,0.1);border:1px solid var(--border-gold-light);color:var(--text-gold-light)' : 'opacity:0.5'}`;
            el.textContent = `${active ? '✅' : '🔒'} ${bond.name}：${bond.desc}`;
            bondContainer.appendChild(el);
        });
    }
}

// ========== 成就商店渲染 ==========
function renderAchievementShop() {
    const container = document.getElementById('achievement-shop');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;font-size:13px;color:var(--text-gold-light);margin-bottom:8px">成就点数：${gameState.achievementPoints || 0}</div>`;
    const shopItems = [
        { id: 'heal1', name: '千年人参x1', cost: 10, action: () => { gameState.spiritStone += 0; useHeavenlyItem('ginseng'); } },
        { id: 'stone1', name: '1000灵石', cost: 5, action: () => { gameState.spiritStone += 1000; addLog('兑换1000灵石', 'success'); } },
        { id: 'cult1', name: '5000修为', cost: 8, action: () => { gameState.cultivation += 5000; gameState.totalCultivation += 5000; addLog('兑换5000修为', 'success'); } },
        { id: 'dao1', name: '1道韵', cost: 20, action: () => { gameState.dao += 1; addLog('兑换1道韵', 'success'); } },
    ];
    shopItems.forEach(item => {
        const canAfford = (gameState.achievementPoints || 0) >= item.cost;
        const el = document.createElement('div');
        el.className = 'craft-item' + (!canAfford ? ' disabled' : '');
        el.innerHTML = `<div class="craft-header"><span class="craft-name">${item.name}</span><span class="craft-rate">${item.cost}点</span></div><button class="craft-btn" ${!canAfford ? 'disabled' : ''}>兑换</button>`;
        if (canAfford) {
            el.querySelector('.craft-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                gameState.achievementPoints -= item.cost;
                item.action();
                updateUI();
            });
        }
        container.appendChild(el);
    });
}

// ========== 设置渲染 ==========
function renderSettings() {
    const container = document.getElementById('settings-panel');
    if (!container) return;
    const s = gameState.settings;
    container.innerHTML = `
        <div style="margin-bottom:12px">
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
                <span>音效</span>
                <button class="craft-btn" style="width:80px" id="set-sound">${s.soundEnabled ? '开启' : '关闭'}</button>
            </label>
        </div>
        <div style="margin-bottom:12px">
            <label style="display:block;font-size:13px;margin-bottom:4px">自动存档间隔</label>
            <select id="set-autosave" style="width:100%;padding:6px;background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-gold);border-radius:4px">
                <option value="15" ${s.autoSaveInterval===15?'selected':''}>15秒</option>
                <option value="30" ${s.autoSaveInterval===30?'selected':''}>30秒</option>
                <option value="60" ${s.autoSaveInterval===60?'selected':''}>1分钟</option>
                <option value="300" ${s.autoSaveInterval===300?'selected':''}>5分钟</option>
            </select>
        </div>
        <div style="margin-bottom:12px">
            <label style="display:block;font-size:13px;margin-bottom:4px">数值显示</label>
            <select id="set-numfmt" style="width:100%;padding:6px;background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-gold);border-radius:4px">
                <option value="short" ${s.numberFormat==='short'?'selected':''}>缩写（1.5K）</option>
                <option value="full" ${s.numberFormat==='full'?'selected':''}>完整（1500）</option>
            </select>
        </div>
        <div style="margin-bottom:12px">
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
                <span>浮动文字</span>
                <button class="craft-btn" style="width:80px" id="set-float">${s.showFloatingText ? '开启' : '关闭'}</button>
            </label>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">当前称号：${getCurrentTitleName()}</div>`;
    document.getElementById('set-sound').addEventListener('click', () => { gameState.settings.soundEnabled = !gameState.settings.soundEnabled; gameState.soundEnabled = gameState.settings.soundEnabled; renderSettings(); });
    document.getElementById('set-autosave').addEventListener('change', (e) => { gameState.settings.autoSaveInterval = parseInt(e.target.value); });
    document.getElementById('set-numfmt').addEventListener('change', (e) => { gameState.settings.numberFormat = e.target.value; updateUI(); });
    document.getElementById('set-float').addEventListener('click', () => { gameState.settings.showFloatingText = !gameState.settings.showFloatingText; renderSettings(); });
}

// ========== 数据统计渲染 ==========
function renderStats() {
    const container = document.getElementById('stats-panel');
    if (!container) return;
    const alchTotal = (gameState.alchemySuccessCount || 0) + (gameState.alchemyFailCount || 0);
    const forgeTotal = (gameState.forgeSuccessCount || 0) + (gameState.forgeFailCount || 0);
    const alchRate = alchTotal > 0 ? Math.floor((gameState.alchemySuccessCount || 0) / alchTotal * 100) : 0;
    const forgeRate = forgeTotal > 0 ? Math.floor((gameState.forgeSuccessCount || 0) / forgeTotal * 100) : 0;
    container.innerHTML = `
        <div style="font-size:12px;line-height:2">
            <div style="display:flex;justify-content:space-between"><span>修炼时长</span><span>${formatTime(gameState.playTime)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>累计修为</span><span>${formatNumber(gameState.totalCultivation)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>累计灵石</span><span>${formatNumber(gameState.totalStoneEarned || 0)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>突破次数</span><span>${gameState.breakthroughCount}</span></div>
            <div style="display:flex;justify-content:space-between"><span>炼丹次数</span><span>${alchTotal}（成功率${alchRate}%）</span></div>
            <div style="display:flex;justify-content:space-between"><span>炼器次数</span><span>${forgeTotal}（成功率${forgeRate}%）</span></div>
            <div style="display:flex;justify-content:space-between"><span>最高连击</span><span>${gameState.maxCombo || 0}</span></div>
            <div style="display:flex;justify-content:space-between"><span>转世次数</span><span>${gameState.rebirthCount}</span></div>
            <div style="display:flex;justify-content:space-between"><span>灵宠收集</span><span>${Object.keys(gameState.petCollection || {}).length}/${CONFIG.petTypes.length}</span></div>
            <div style="display:flex;justify-content:space-between"><span>当前境界</span><span>${getRealmName()}</span></div>
        </div>`;
}

// ========== 称号渲染 ==========
function renderTitles() {
    const container = document.getElementById('titles-list');
    if (!container) return;
    container.innerHTML = '';
    CONFIG.titles.forEach(title => {
        const unlocked = gameState.unlockedTitles.includes(title.id);
        const active = gameState.currentTitle === title.id;
        const el = document.createElement('div');
        el.className = 'craft-item' + (!unlocked ? ' disabled' : '') + (active ? ' quality-legendary' : '');
        el.style.cursor = unlocked ? 'pointer' : 'not-allowed';
        el.innerHTML = `<div class="craft-header"><span class="craft-name">${unlocked ? '🏆' : '🔒'} ${title.name}</span>${active ? '<span class="craft-rate">使用中</span>' : ''}</div><div class="craft-desc">${title.desc}</div>`;
        if (unlocked) {
            el.addEventListener('click', () => { gameState.currentTitle = title.id; addLog(`切换称号：${title.name}`, 'success'); updateUI(); });
        }
        container.appendChild(el);
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
        if (!gameState.petInventory) gameState.petInventory = [];
        if (!gameState.dungeonCooldowns) gameState.dungeonCooldowns = {};
        if (gameState.talentPoints === undefined) gameState.talentPoints = 0;
        if (!gameState.alchemyCooldowns) gameState.alchemyCooldowns = {};
        if (!gameState.forgeCooldowns) gameState.forgeCooldowns = {};
        if (!gameState.activeFormations) gameState.activeFormations = [];
        if (!gameState.heavenlyUsed) gameState.heavenlyUsed = {};
        if (!gameState.heavenlyBonus) gameState.heavenlyBonus = { cultivation: 0, stone: 0, bothMult: 0 };
        if (!gameState.petCollection) gameState.petCollection = {};
        if (gameState.alchemySuccessCount === undefined) gameState.alchemySuccessCount = 0;
        if (gameState.alchemyFailCount === undefined) gameState.alchemyFailCount = 0;
        if (gameState.forgeSuccessCount === undefined) gameState.forgeSuccessCount = 0;
        if (gameState.forgeFailCount === undefined) gameState.forgeFailCount = 0;
        if (gameState.totalStoneEarned === undefined) gameState.totalStoneEarned = 0;
        if (gameState.totalFormations === undefined) gameState.totalFormations = 0;
        if (gameState.currentGoalIndex === undefined) gameState.currentGoalIndex = 0;
        if (!gameState.completedGoals) gameState.completedGoals = [];
        if (!gameState.unlockedTitles) gameState.unlockedTitles = [];
        if (!gameState.currentTitle) gameState.currentTitle = '';
        if (gameState.achievementPoints === undefined) gameState.achievementPoints = 0;
        if (!gameState.settings) gameState.settings = { soundEnabled: true, autoSaveInterval: 30, numberFormat: 'short', showFloatingText: true };
        if (!gameState.lastCooldownState) gameState.lastCooldownState = {};
        if (!gameState.nextEventTime) gameState.nextEventTime = 0;
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
    const realmScale = 1 + gameState.realmIndex * 0.5;

    // 发放奖励
    if (reward.type === 'stone') { const amt = Math.floor(reward.amount * realmScale); gameState.spiritStone += amt; addLog(`签到获得${formatNumber(amt)}灵石`, 'success'); }
    else if (reward.type === 'cult') { const amt = Math.floor(reward.amount * realmScale); gameState.cultivation += amt; gameState.totalCultivation += amt; addLog(`签到获得${formatNumber(amt)}修为`, 'success'); }
    else if (reward.type === 'dao') { gameState.dao += reward.amount; addLog(`签到获得${reward.amount}道韵`, 'success'); }
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
    const realmScale = 1 + gameState.realmIndex * 0.5;
    if (task.reward.stone) { const amt = Math.floor(task.reward.stone * realmScale); gameState.spiritStone += amt; addLog(`完成任务【${task.name}】，获得${formatNumber(amt)}灵石`, 'success'); }
    if (task.reward.dao) { gameState.dao += task.reward.dao; addLog(`完成任务【${task.name}】，获得${task.reward.dao}道韵`, 'success'); }
    SFX.reward();
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

// ========== 灵宠系统 ==========
function generatePet(forceType = null) {
    const type = forceType || CONFIG.petTypes[Math.floor(Math.random() * 3)]; // 前3种普通宠
    const qualityIndex = randomQuality();
    const quality = CONFIG.petQualities[qualityIndex];
    if (!gameState.petCollection) gameState.petCollection = {};
    gameState.petCollection[type.id] = true;
    return {
        uid: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        typeId: type.id,
        name: quality.name + type.name,
        icon: type.icon,
        effect: type.effect,
        qualityIndex: qualityIndex,
        qualityName: quality.name,
        qualityColor: quality.color,
        level: 1,
        exp: 0,
        affection: 50,
        base: type.base,
    };
}

function getPetBonus(pet) {
    if (!pet) return { cultivation: 0, stone: 0 };
    const quality = CONFIG.petQualities[pet.qualityIndex];
    const levelMult = 1 + (pet.level - 1) * 0.1;
    const affectionMult = 0.5 + pet.affection / 100;
    const bonus = pet.base * quality.mult * levelMult * affectionMult;
    if (pet.effect === 'cultivation') return { cultivation: bonus, stone: 0 };
    if (pet.effect === 'stone') return { cultivation: 0, stone: bonus };
    return { cultivation: bonus, stone: bonus };
}

function getPetUpgradeCost(pet) {
    return Math.floor(CONFIG.petUpgradeCostBase * Math.pow(CONFIG.petUpgradeCostMult, pet.level - 1) * (pet.qualityIndex + 1));
}

function upgradePet(uid) {
    const pet = gameState.petInventory.find(p => p.uid === uid) || gameState.activePet;
    if (!pet || pet.uid !== uid) return false;
    const quality = CONFIG.petQualities[pet.qualityIndex];
    if (pet.level >= quality.maxLevel) { addLog('灵宠已达最高等级', ''); SFX.error(); return false; }
    const cost = getPetUpgradeCost(pet);
    if (gameState.spiritStone < cost) { addLog('灵石不足，无法升级灵宠', ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    pet.level++;
    pet.affection = Math.min(100, pet.affection + 2);
    SFX.upgrade();
    addLog(`${pet.name} 升级到 Lv.${pet.level}`, 'success');
    updateUI();
    return true;
}

function equipPet(uid) {
    const idx = gameState.petInventory.findIndex(p => p.uid === uid);
    if (idx === -1) return false;
    const pet = gameState.petInventory[idx];
    if (gameState.activePet) gameState.petInventory.push(gameState.activePet);
    gameState.activePet = pet;
    gameState.petInventory.splice(idx, 1);
    SFX.buy();
    addLog(`出战灵宠：${pet.name}`, 'success');
    updateUI();
    return true;
}

function unequipPet() {
    if (!gameState.activePet) return false;
    gameState.petInventory.push(gameState.activePet);
    gameState.activePet = null;
    addLog('收回灵宠', '');
    updateUI();
    return true;
}

function feedPet() {
    if (!gameState.activePet) return false;
    if (gameState.spiritStone < 30) { addLog('灵石不足，无法喂养', ''); SFX.error(); return false; }
    gameState.spiritStone -= 30;
    gameState.activePet.affection = Math.min(100, gameState.activePet.affection + 10);
    SFX.pill();
    addLog(`喂养了${gameState.activePet.name}，好感度+10`, 'success');
    updateUI();
    return true;
}

function releasePet(uid) {
    let pet = null;
    let idx = gameState.petInventory.findIndex(p => p.uid === uid);
    if (idx !== -1) {
        pet = gameState.petInventory[idx];
        gameState.petInventory.splice(idx, 1);
    } else if (gameState.activePet && gameState.activePet.uid === uid) {
        pet = gameState.activePet;
        gameState.activePet = null;
    }
    if (!pet) return false;
    const reward = Math.floor((pet.qualityIndex + 1) * pet.level * 15 * (1 + gameState.realmIndex * 0.3));
    gameState.spiritStone += reward;
    SFX.reward();
    addLog(`放生了${pet.name}，获得${formatNumber(reward)}灵石`, 'success');
    updateUI();
    return true;
}

function canAddPet() {
    return gameState.petInventory.length < (CONFIG.petInventoryMax || 20);
}

// ========== 炼丹系统 ==========
function alchemyPill(pillId) {
    const recipe = CONFIG.alchemyRecipes.find(r => r.pillId === pillId);
    if (!recipe) return false;
    const cd = gameState.alchemyCooldowns[pillId] || 0;
    if (Date.now() < cd) { addLog('丹炉冷却中', ''); SFX.error(); return false; }
    if (gameState.spiritStone < recipe.cost) { addLog('灵石不足，无法炼丹', ''); SFX.error(); return false; }
    gameState.spiritStone -= recipe.cost;
    gameState.alchemyCooldowns[pillId] = Date.now() + recipe.cooldown * 1000;
    const pill = CONFIG.pills.find(p => p.id === pillId);
    if (Math.random() < recipe.successRate) {
        gameState.pills[pillId] = (gameState.pills[pillId] || 0) + 1;
        gameState.alchemySuccessCount = (gameState.alchemySuccessCount || 0) + 1;
        SFX.reward();
        addLog(`炼丹成功！获得【${pill.name}】x1（成功率${Math.floor(recipe.successRate*100)}%）`, 'success');
    } else {
        gameState.alchemyFailCount = (gameState.alchemyFailCount || 0) + 1;
        SFX.error();
        addLog(`炼丹失败！丹药炸炉，损失${recipe.cost}灵石（成功率${Math.floor(recipe.successRate*100)}%）`, '');
    }
    updateUI();
    return true;
}

// ========== 炼器系统 ==========
function forgeArtifact(qualityIndex) {
    const recipe = CONFIG.forgeRecipes.find(r => r.qualityIndex === qualityIndex);
    if (!recipe) return false;
    const cd = gameState.forgeCooldowns[qualityIndex] || 0;
    if (Date.now() < cd) { addLog('炼器炉冷却中', ''); SFX.error(); return false; }
    if (gameState.spiritStone < recipe.cost) { addLog('灵石不足，无法炼器', ''); SFX.error(); return false; }
    gameState.spiritStone -= recipe.cost;
    gameState.forgeCooldowns[qualityIndex] = Date.now() + recipe.cooldown * 1000;
    if (Math.random() < recipe.successRate) {
        const art = generateArtifact(qualityIndex);
        gameState.artifactInventory.push(art);
        gameState.artifactFoundCount++;
        gameState.forgeSuccessCount = (gameState.forgeSuccessCount || 0) + 1;
        SFX.achievement();
        addLog(`炼器成功！获得【${art.name}】（成功率${Math.floor(recipe.successRate*100)}%）`, 'breakthrough');
    } else {
        gameState.forgeFailCount = (gameState.forgeFailCount || 0) + 1;
        SFX.error();
        addLog(`炼器失败！法宝损毁，损失${recipe.cost}灵石（成功率${Math.floor(recipe.successRate*100)}%）`, '');
    }
    checkAchievements();
    updateUI();
    return true;
}

// ========== 阵法系统 ==========
function getFormationBonus(type) {
    let bonus = 0;
    const now = Date.now();
    gameState.activeFormations = gameState.activeFormations.filter(f => f.endTime > now);
    gameState.activeFormations.forEach(f => {
        const formation = CONFIG.formations.find(x => x.id === f.id);
        if (!formation) return;
        if (formation.effect === type || formation.effect === 'both') bonus += formation.value;
    });
    return bonus;
}

function activateFormation(formationId) {
    const formation = CONFIG.formations.find(f => f.id === formationId);
    if (!formation) return false;
    if (gameState.spiritStone < formation.cost) { addLog('灵石不足，无法布置阵法', ''); SFX.error(); return false; }
    gameState.spiritStone -= formation.cost;
    gameState.activeFormations.push({ id: formationId, endTime: Date.now() + formation.duration * 1000 });
    gameState.totalFormations = (gameState.totalFormations || 0) + 1;
    SFX.achievement();
    addLog(`布置【${formation.name}】成功，持续${Math.floor(formation.duration/60)}分钟`, 'breakthrough');
    updateUI();
    return true;
}

// ========== 秘境系统 ==========
function getPlayerPower() {
    let power = 0;
    power += gameState.realmIndex * 100 + gameState.realmLayer * 10;
    CONFIG.upgrades.forEach(u => { power += gameState.upgrades[u.id] * (u.effect === 'both' ? 3 : 2); });
    power += gameState.discipleCount * 5;
    power += getArtifactBonus('cultivation') + getArtifactBonus('stone');
    if (gameState.activePet) {
        const b = getPetBonus(gameState.activePet);
        power += (b.cultivation + b.stone) * 2;
    }
    power += gameState.dao * 10;
    return Math.floor(power);
}

function canChallengeDungeon(dungeonId) {
    const d = CONFIG.dungeons.find(x => x.id === dungeonId);
    if (!d) return false;
    if (gameState.realmIndex < d.realmReq) return false;
    const cd = gameState.dungeonCooldowns[dungeonId] || 0;
    if (Date.now() < cd) return false;
    if (gameState.spiritStone < d.cost) return false;
    return true;
}

function challengeDungeon(dungeonId) {
    const d = CONFIG.dungeons.find(x => x.id === dungeonId);
    if (!d || !canChallengeDungeon(dungeonId)) { SFX.error(); return false; }
    gameState.spiritStone -= d.cost;
    gameState.dungeonCooldowns[dungeonId] = Date.now() + d.cooldown * 1000;

    const power = getPlayerPower();
    const successRate = Math.min(0.95, power / d.powerReq);
    const success = Math.random() < successRate;

    if (success) {
        const cultGain = d.cultReward * (1 + gameState.realmIndex * 0.3);
        const stoneGain = d.stoneReward * (1 + gameState.realmIndex * 0.3);
        gameState.cultivation += cultGain;
        gameState.totalCultivation += cultGain;
        gameState.spiritStone += stoneGain;
        let msg = `挑战【${d.name}】成功！获得${formatNumber(cultGain)}修为，${formatNumber(stoneGain)}灵石`;

        if (Math.random() < d.artifactChance) {
            const art = generateArtifact();
            gameState.artifactInventory.push(art);
            gameState.artifactFoundCount++;
            msg += `，获得法宝【${art.name}】`;
        }
        if (Math.random() < d.petChance && canAddPet()) {
            const pet = generatePet();
            gameState.petInventory.push(pet);
            msg += `，获得灵宠【${pet.name}】`;
        }
        if (Math.random() < d.talentPointChance) {
            gameState.talentPoints = (gameState.talentPoints || 0) + 1;
            msg += `，获得1天赋点`;
        }
        SFX.achievement();
        addLog(msg, 'breakthrough');
    } else {
        const loss = Math.floor(gameState.cultivation * 0.05);
        gameState.cultivation = Math.max(0, gameState.cultivation - loss);
        SFX.error();
        addLog(`挑战【${d.name}】失败，损失${formatNumber(loss)}修为（成功率${Math.floor(successRate * 100)}%）`, '');
    }
    checkAchievements();
    updateUI();
    return true;
}

// ========== 随机事件系统 ==========
function scheduleNextEvent() {
    const delay = CONFIG.eventMinInterval + Math.random() * (CONFIG.eventMaxInterval - CONFIG.eventMinInterval);
    gameState.nextEventTime = Date.now() + delay * 1000;
}

function triggerRandomEvent() {
    const evt = CONFIG.randomEvents[Math.floor(Math.random() * CONFIG.randomEvents.length)];
    document.getElementById('event-title').textContent = '◈ ' + evt.title + ' ◈';
    document.getElementById('event-desc').textContent = evt.desc;
    const choicesContainer = document.getElementById('event-choices');
    choicesContainer.innerHTML = '';
    evt.choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'event-choice-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
            const result = choice.result();
            choicesContainer.innerHTML = `<div class="event-result">${result}</div><button class="claim-btn" onclick="document.getElementById('event-modal').classList.add('hidden')">继续</button>`;
            SFX.reward();
            updateUI();
        });
        choicesContainer.appendChild(btn);
    });
    document.getElementById('event-modal').classList.remove('hidden');
    scheduleNextEvent();
}

function checkRandomEvent() {
    if (!gameState.nextEventTime || gameState.nextEventTime === 0) {
        scheduleNextEvent();
        return;
    }
    if (Date.now() >= gameState.nextEventTime && gameStarted) {
        triggerRandomEvent();
    }
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

    // 产出详情
    document.getElementById('detail-btn')?.addEventListener('click', showProductionDetails);

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
    gameState.totalStoneEarned = (gameState.totalStoneEarned || 0) + stoneGain;
    gameState.playTime += delta;

    if (gameState.adventure) {
        const prog = getAdventureProgress();
        if (prog && prog.remaining <= 0) completeAdventure();
    }

    if (Math.floor(gameState.playTime) % 5 === 0) checkAchievements();
    checkRandomEvent();
    checkCooldownNotifications();
    updateStageGoal();
    checkTitles();
    updateUI();
}

init();
