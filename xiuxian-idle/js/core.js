/**
 * core.js - 核心计算与游戏操作模块
 * 包含：境界/修为/灵石计算、突破成本、功法效果、弟子成本、Buff倍率、
 *       法宝/灵宠/阵法/道韵加成、突破境界、升级功法、招募弟子、转世重修
 */

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
    return u.baseEffect * lv * Math.pow(u.effectMult, lv);
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
    if (gameState.totalCultivation < 5000) return 0;
    return Math.max(3, Math.floor(Math.sqrt(gameState.totalCultivation / 5000)));
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
    // 转世最低境界：筑基期
    const minRebirthRealm = 1;
    if (gameState.realmIndex < minRebirthRealm) {
        addLog(`需达到${CONFIG.realms[minRebirthRealm].name}才能转世重修`, '');
        SFX.error();
        return false;
    }
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

