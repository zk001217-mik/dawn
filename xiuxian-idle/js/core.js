/**
 * core.js - 核心计算与游戏操作模块
 * 包含：境界/修为/灵石计算、突破成本、功法效果、弟子成本、Buff倍率、
 *       法宝/灵宠/阵法/道韵加成、突破境界、升级功法、招募弟子、转世重修
 */

// ========== 核心计算函数 ==========
function getCurrentRealm() { return CONFIG.realms[gameState.realmIndex]; }

// ========== 丹药品质系统 ==========
function getPillCount(pillId) {
    const data = gameState.pills[pillId];
    if (!data) return 0;
    if (typeof data === 'number') return data; // 兼容旧存档
    return (data[0] || 0) + (data[1] || 0) + (data[2] || 0);
}

function getPillQualityCount(pillId, quality) {
    const data = gameState.pills[pillId];
    if (!data) return 0;
    if (typeof data === 'number') return quality === 0 ? data : 0; // 兼容旧存档
    return data[quality] || 0;
}

function addPill(pillId, count, quality) {
    if (quality === undefined) quality = 0;
    if (!gameState.pills[pillId] || typeof gameState.pills[pillId] === 'number') {
        const oldCount = typeof gameState.pills[pillId] === 'number' ? gameState.pills[pillId] : 0;
        gameState.pills[pillId] = { 0: oldCount, 1: 0, 2: 0 };
    }
    gameState.pills[pillId][quality] = (gameState.pills[pillId][quality] || 0) + count;
}

function removePill(pillId, count) {
    // 优先使用低品质丹药
    let remaining = count;
    for (let q = 0; q <= 2 && remaining > 0; q++) {
        const available = getPillQualityCount(pillId, q);
        const toRemove = Math.min(available, remaining);
        if (toRemove > 0) {
            gameState.pills[pillId][q] -= toRemove;
            remaining -= toRemove;
        }
    }
    return count - remaining; // 实际移除数量
}

function getPillEffectMult(quality) {
    const q = CONFIG.pillQualities[quality] || CONFIG.pillQualities[0];
    return q.effectMult;
}

function rollPillQuality(successRate) {
    // 成功率越高，出高品质概率越大
    const rand = Math.random();
    const qualityBonus = successRate * 0.2; // 成功率贡献品质加成
    if (rand < 0.1 + qualityBonus * 0.5) return 2; // 极品
    if (rand < 0.4 + qualityBonus) return 1; // 精良
    return 0; // 普通
}

// 获取当前境界特权值
function getRealmPrivilege(type) {
    // 累积所有已达到境界的同类型特权（突破后低境界特权保留）
    let total = 0;
    for (let i = 0; i <= gameState.realmIndex; i++) {
        const realm = CONFIG.realms[i];
        if (realm && realm.privilegeType === type) total += realm.privilegeValue || 0;
    }
    return total;
}

// ========== 天赋树系统 ==========
function getTalentLevel(talentId) {
    return (gameState.talents && gameState.talents[talentId]) || 0;
}

function getTalentBonus(type) {
    if (!CONFIG.talentTree || !CONFIG.talentTree.talents) return 0;
    let total = 0;
    CONFIG.talentTree.talents.forEach(t => {
        if (t.effect === type) {
            const lv = getTalentLevel(t.id);
            total += t.value * lv;
        }
    });
    return total;
}

function canLearnTalent(talentId) {
    const talent = CONFIG.talentTree.talents.find(t => t.id === talentId);
    if (!talent) return false;
    const lv = getTalentLevel(talentId);
    if (lv >= talent.maxLevel) return false;
    if (gameState.talentPoints < talent.cost) return false;
    if (talent.prerequisite) {
        const preLv = getTalentLevel(talent.prerequisite);
        const preTalent = CONFIG.talentTree.talents.find(t => t.id === talent.prerequisite);
        if (preLv < (preTalent ? preTalent.maxLevel : 1)) return false;
    }
    return true;
}

function learnTalent(talentId) {
    if (!canLearnTalent(talentId)) return false;
    const talent = CONFIG.talentTree.talents.find(t => t.id === talentId);
    gameState.talentPoints -= talent.cost;
    gameState.talents[talentId] = getTalentLevel(talentId) + 1;
    addLog(`学习天赋【${talent.name}】Lv.${gameState.talents[talentId]}`, 'success');
    SFX.upgrade();
    updateUI();
    return true;
}

function getTalentPointsEarned() {
    // 每次转世获得天赋点 = max(1, floor(道韵收益 / 2))
    return Math.max(1, Math.floor(getRebirthDaoGain() / 2));
}

// 获取法宝槽位数（基础3 + 境界特权加成）
function getArtifactSlots() {
    return CONFIG.artifactSlots + getRealmPrivilege('artifactSlot');
}

// 获取灵宠槽位数（基础1 + 境界特权加成）
function getPetSlots() {
    return 1 + getRealmPrivilege('petSlot');
}

// 获取所有出战灵宠（主灵宠100%，副灵宠50%）
function getActivePets() {
    const pets = [];
    if (gameState.activePet) pets.push({ pet: gameState.activePet, mult: 1.0 });
    if (gameState.secondaryPet && getPetSlots() >= 2) pets.push({ pet: gameState.secondaryPet, mult: 0.5 });
    return pets;
}

// 获取所有出战灵宠的总加成
function getTotalPetBonus() {
    let cult = 0, stone = 0;
    getActivePets().forEach(({ pet, mult }) => {
        const b = getPetBonus(pet);
        cult += b.cultivation * mult;
        stone += b.stone * mult;
    });
    return { cultivation: cult, stone: stone };
}

// 获取所有出战灵宠的总技能加成
function getTotalPetSkillBonus(bonusType) {
    let total = 0;
    getActivePets().forEach(({ pet, mult }) => {
        const petType = CONFIG.petTypes.find(t => t.id === pet.typeId);
        if (!petType || !petType.skill) return;
        const skill = petType.skill;
        if (skill.effects) {
            skill.effects.forEach(e => {
                if (e.type === bonusType || e.type === 'all') total += e.value * mult;
            });
        } else if (skill.type === bonusType || skill.type === 'all') {
            total += skill.value * mult;
        }
    });
    return total;
}

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
    const btMult = getUpgradeBreakthroughMult(id);
    return u.baseEffect * lv * Math.pow(u.effectMult, lv) * btMult;
}

// ========== 功法突破系统 ==========
function getUpgradeBreakthrough(id) {
    return gameState.upgradeBreakthroughs?.[id] || 0;
}

function getUpgradeBreakthroughMult(id) {
    const count = getUpgradeBreakthrough(id);
    return 1 + count * 0.2; // 每次突破+20%效果
}

function canBreakthroughUpgrade(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    if (!u) return false;
    const lv = gameState.upgrades[id] || 0;
    const btCount = getUpgradeBreakthrough(id);
    const requiredLv = (btCount + 1) * 10; // 第1次突破需10级，第2次需20级...
    return lv >= requiredLv && lv < u.maxLevel && btCount < 5; // 最多突破5次
}

function getUpgradeBreakthroughCost(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    const btCount = getUpgradeBreakthrough(id);
    return Math.floor(u.baseCost * 50 * Math.pow(2, btCount));
}

function breakthroughUpgrade(id) {
    if (!canBreakthroughUpgrade(id)) { addLog('功法等级不足，无法突破', ''); SFX.error(); return false; }
    const cost = getUpgradeBreakthroughCost(id);
    if (gameState.spiritStone < cost) { addLog('灵石不足，无法突破', ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    if (!gameState.upgradeBreakthroughs) gameState.upgradeBreakthroughs = {};
    gameState.upgradeBreakthroughs[id] = getUpgradeBreakthrough(id) + 1;
    const u = CONFIG.upgrades.find(x => x.id === id);
    SFX.breakthrough();
    addLog(`【${u.name}】突破成功！效果+20%`, 'breakthrough');
    updateUI();
    return true;
}

// ========== 功法精通系统 ==========
function isUpgradeMastered(id) {
    return gameState.upgradeMastery?.[id] === true;
}

function canMasterUpgrade(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    if (!u) return false;
    const lv = gameState.upgrades[id] || 0;
    return lv >= u.maxLevel && !isUpgradeMastered(id);
}

function getMasteryCost(id) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    return Math.floor(u.baseCost * 200);
}

function masterUpgrade(id) {
    if (!canMasterUpgrade(id)) { addLog('功法未满级，无法精通', ''); SFX.error(); return false; }
    const cost = getMasteryCost(id);
    if (gameState.spiritStone < cost) { addLog('灵石不足，无法精通', ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    if (!gameState.upgradeMastery) gameState.upgradeMastery = {};
    gameState.upgradeMastery[id] = true;
    const u = CONFIG.upgrades.find(x => x.id === id);
    SFX.achievement();
    addLog(`【${u.name}】已精通！获得永久加成`, 'breakthrough');
    updateUI();
    return true;
}

function getMasteryBonus() {
    let cult = 0, stone = 0;
    if (!gameState.upgradeMastery) return { cult, stone };
    CONFIG.upgrades.forEach(u => {
        if (gameState.upgradeMastery[u.id]) {
            if (u.effect === 'cultivation') cult += 0.03;
            else if (u.effect === 'stone') stone += 0.03;
            else { cult += 0.02; stone += 0.02; }
        }
    });
    return { cult, stone };
}

// ========== 功法组合效果 ==========
function getActiveUpgradeSynergies() {
    const active = [];
    CONFIG.upgradeSynergies.forEach(syn => {
        const allMet = syn.req.every(r => (gameState.upgrades[r.id] || 0) >= r.lv);
        if (allMet) active.push(syn);
    });
    return active;
}

function getUpgradeSynergyBonus(type) {
    let bonus = 0;
    getActiveUpgradeSynergies().forEach(syn => {
        if (syn.bonus.type === type || syn.bonus.type === 'both') bonus += syn.bonus.value;
    });
    return bonus;
}

// ========== 法宝秘境专精 ==========
function getArtifactDungeonBonus() {
    const result = { successBonus: 0, hpReduction: 0, rewardBonus: 0, types: [] };
    gameState.equippedArtifacts.forEach(art => {
        if (!art) return;
        const bonus = CONFIG.artifactDungeonBonus[art.typeId];
        if (bonus) {
            if (bonus.successBonus) result.successBonus += bonus.successBonus;
            if (bonus.hpReduction) result.hpReduction += bonus.hpReduction;
            if (bonus.rewardBonus) result.rewardBonus += bonus.rewardBonus;
            if (!result.types.includes(bonus.name)) result.types.push(bonus.name);
        }
    });
    return result;
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
    const totalPetBonus = getTotalPetBonus();
    bonus += totalPetBonus.cultivation;
    const realmMult = 1 + getCurrentRealm().cultBonus;
    const unassigned = getUnassignedCount();
    const patrolBonus = getDiscipleAssignBonus('patrol');
    const discipleMult = 1 + patrolBonus + unassigned * 0.005;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('cultivation');
    const formationMult = 1 + getFormationBonus('cultivation');
    const bondMult = 1 + getPetBondBonus('cultivation');
    const titleMult = 1 + getTitleBonus('cultivation');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('cultivation');
    const privilegeMult = 1 + getRealmPrivilege('allOutput');
    const talentMult = 1 + getTalentBonus('cultivation') + getTalentBonus('allOutput');
    const synergyMult = 1 + getSynergyBonus('cultivation');
    const affixBonus = getArtifactAffixBonus('cultivation');
    const affixMult = 1 + affixBonus.pct;
    const masteryBonus = getMasteryBonus();
    const masteryMult = 1 + masteryBonus.cult;
    const upgradeSynMult = 1 + getUpgradeSynergyBonus('cultivation') + getUpgradeSynergyBonus('both');
    return (base + bonus + affixBonus.flat) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult * privilegeMult * talentMult * synergyMult * affixMult * masteryMult * upgradeSynMult;
}

function getStonePerSecond() {
    let base = CONFIG.baseStone + (gameState.heavenlyBonus ? gameState.heavenlyBonus.stone : 0);
    let bonus = 0;
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'stone' || u.effect === 'both') bonus += getUpgradeEffect(u.id);
    });
    bonus += getArtifactBonus('stone');
    const totalPetBonus = getTotalPetBonus();
    bonus += totalPetBonus.stone;
    const realmMult = 1 + getCurrentRealm().stoneBonus;
    const unassigned = getUnassignedCount();
    const farmBonus = getDiscipleAssignBonus('farm');
    const discipleMult = 1 + farmBonus + unassigned * 0.003;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('stone');
    const formationMult = 1 + getFormationBonus('stone');
    const bondMult = 1 + getPetBondBonus('stone');
    const titleMult = 1 + getTitleBonus('stone');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('stone');
    const privilegeMult = 1 + getRealmPrivilege('allOutput');
    const talentMult = 1 + getTalentBonus('stone') + getTalentBonus('allOutput');
    const synergyMult = 1 + getSynergyBonus('stone');
    const affixBonus = getArtifactAffixBonus('stone');
    const affixMult = 1 + affixBonus.pct;
    const masteryBonus = getMasteryBonus();
    const masteryMult = 1 + masteryBonus.stone;
    const upgradeSynMult = 1 + getUpgradeSynergyBonus('stone') + getUpgradeSynergyBonus('both');
    return (base + bonus + affixBonus.flat) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult * privilegeMult * talentMult * synergyMult * affixMult * masteryMult * upgradeSynMult;
}

// ========== 产出详情 ==========
function getCultivationBreakdown() {
    let base = CONFIG.baseCultivation + (gameState.heavenlyBonus ? gameState.heavenlyBonus.cultivation : 0);
    let upgradeBonus = 0;
    let upgradeDetails = [];
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'cultivation' || u.effect === 'both') {
            const eff = getUpgradeEffect(u.id);
            if (eff > 0) { upgradeBonus += eff; upgradeDetails.push({ name: u.name, value: eff }); }
        }
    });
    const artBonus = getArtifactBonus('cultivation');
    const totalPet = getTotalPetBonus();
    const petBonus = totalPet.cultivation;
    const realmMult = 1 + getCurrentRealm().cultBonus;
    const unassigned = getUnassignedCount();
    const patrolBonus = getDiscipleAssignBonus('patrol');
    const discipleMult = 1 + patrolBonus + unassigned * 0.005;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('cultivation');
    const formationMult = 1 + getFormationBonus('cultivation');
    const bondMult = 1 + getPetBondBonus('cultivation');
    const titleMult = 1 + getTitleBonus('cultivation');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('cultivation');
    const privilegeMult = 1 + getRealmPrivilege('allOutput');
    const synergyMult = 1 + getSynergyBonus('cultivation');
    const affixBonus = getArtifactAffixBonus('cultivation');
    const affixMult = 1 + affixBonus.pct;
    const masteryBonus = getMasteryBonus();
    const masteryMult = 1 + masteryBonus.cult;
    const upgradeSynMult = 1 + getUpgradeSynergyBonus('cultivation') + getUpgradeSynergyBonus('both');
    const total = (base + upgradeBonus + artBonus + petBonus + affixBonus.flat) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult * privilegeMult * synergyMult * affixMult * masteryMult * upgradeSynMult;
    return {
        base, upgradeBonus, upgradeDetails, artBonus, petBonus,
        realmMult, discipleMult, daoMult, buffMult, formationMult, bondMult, titleMult, heavenlyMult, eventMult, privilegeMult, synergyMult, affixMult, masteryMult, upgradeSynMult,
        total
    };
}

function getStoneBreakdown() {
    let base = CONFIG.baseStone + (gameState.heavenlyBonus ? gameState.heavenlyBonus.stone : 0);
    let upgradeBonus = 0;
    let upgradeDetails = [];
    CONFIG.upgrades.forEach(u => {
        if (u.effect === 'stone' || u.effect === 'both') {
            const eff = getUpgradeEffect(u.id);
            if (eff > 0) { upgradeBonus += eff; upgradeDetails.push({ name: u.name, value: eff }); }
        }
    });
    const artBonus = getArtifactBonus('stone');
    const totalPet = getTotalPetBonus();
    const petBonus = totalPet.stone;
    const realmMult = 1 + getCurrentRealm().stoneBonus;
    const unassigned = getUnassignedCount();
    const farmBonus = getDiscipleAssignBonus('farm');
    const discipleMult = 1 + farmBonus + unassigned * 0.003;
    const daoMult = 1 + gameState.dao * 0.01;
    const buffMult = getBuffMultiplier('stone');
    const formationMult = 1 + getFormationBonus('stone');
    const bondMult = 1 + getPetBondBonus('stone');
    const titleMult = 1 + getTitleBonus('stone');
    const heavenlyMult = 1 + (gameState.heavenlyBonus ? gameState.heavenlyBonus.bothMult : 0);
    const eventMult = 1 + getEventBonus('stone');
    const privilegeMult = 1 + getRealmPrivilege('allOutput');
    const synergyMult = 1 + getSynergyBonus('stone');
    const affixBonus = getArtifactAffixBonus('stone');
    const affixMult = 1 + affixBonus.pct;
    const masteryBonus = getMasteryBonus();
    const masteryMult = 1 + masteryBonus.stone;
    const upgradeSynMult = 1 + getUpgradeSynergyBonus('stone') + getUpgradeSynergyBonus('both');
    const total = (base + upgradeBonus + artBonus + petBonus + affixBonus.flat) * realmMult * discipleMult * daoMult * buffMult * formationMult * bondMult * titleMult * heavenlyMult * eventMult * privilegeMult * synergyMult * affixMult * masteryMult * upgradeSynMult;
    return {
        base, upgradeBonus, upgradeDetails, artBonus, petBonus,
        realmMult, discipleMult, daoMult, buffMult, formationMult, bondMult, titleMult, heavenlyMult, eventMult, privilegeMult, synergyMult, affixMult, masteryMult, upgradeSynMult,
        total
    };
}

function getRebirthDaoGain() {
    if (gameState.totalCultivation < 5000) return 0;
    const base = Math.max(3, Math.floor(Math.sqrt(gameState.totalCultivation / 5000)));
    // 渡劫期特权：转世道韵+50%
    const rebirthBonus = 1 + getRealmPrivilege('rebirthDao');
    return Math.floor(base * rebirthBonus);
}

// 获取当前境界下功法的实际最大等级
function getUpgradeMaxLevel(upgradeId) {
    const u = CONFIG.upgrades.find(x => x.id === upgradeId);
    if (!u) return 0;
    // 境界每阶+10级上限
    const realmCap = (gameState.realmIndex + 1) * 10;
    return Math.min(u.maxLevel, realmCap);
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
    let r = rates[gameState.realmIndex];
    if (r === undefined) r = 0.20;
    // 合体期特权：突破成功率+10%（失败率-10%）
    const bonus = getRealmPrivilege('breakthrough');
    const talentBonus = getTalentBonus('breakthrough');
    r = Math.max(0, r - bonus - talentBonus);
    return r;
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
        // 突破失败震动效果
        document.body.style.animation = 'none';
        document.body.offsetHeight; // 触发重排
        document.body.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => { document.body.style.animation = ''; }, 400);
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
    const maxLv = getUpgradeMaxLevel(id);
    if (!u || gameState.upgrades[id] >= maxLv) {
        if (u && gameState.upgrades[id] >= u.maxLevel) addLog(`${u.name}已达最高境界`, '');
        else if (u) addLog(`${u.name}需更高境界才能继续修炼`, '');
        return false;
    }
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

// ========== 弟子分工 ==========
function getAssignedCount() {
    const a = gameState.discipleAssign || { alchemy: 0, forge: 0, farm: 0, patrol: 0, scout: 0, guard: 0 };
    return (a.alchemy || 0) + (a.forge || 0) + (a.farm || 0) + (a.patrol || 0) + (a.scout || 0) + (a.guard || 0);
}

function getUnassignedCount() {
    return Math.max(0, gameState.discipleCount - getAssignedCount());
}

function assignDisciple(type) {
    if (getUnassignedCount() <= 0) { addLog('没有可分配的弟子', ''); SFX.error(); return false; }
    if (!gameState.discipleAssign) gameState.discipleAssign = { alchemy: 0, forge: 0, farm: 0, patrol: 0, scout: 0, guard: 0 };
    gameState.discipleAssign[type] = (gameState.discipleAssign[type] || 0) + 1;
    SFX.buy();
    updateUI();
    return true;
}

function unassignDisciple(type) {
    if (!gameState.discipleAssign || (gameState.discipleAssign[type] || 0) <= 0) return false;
    gameState.discipleAssign[type]--;
    SFX.buy();
    updateUI();
    return true;
}

// 获取弟子分工带来的加成
function getDiscipleAssignBonus(type) {
    if (!gameState.discipleAssign) return 0;
    const count = gameState.discipleAssign[type] || 0;
    if (type === 'alchemy' || type === 'forge') return count * 0.01; // 每人+1%成功率
    if (type === 'farm') return count * 0.008; // 每人+0.8%灵石
    if (type === 'patrol') return count * 0.008; // 每人+0.8%修为
    if (type === 'scout') return count * 0.008; // 斥候：每人+0.8%外出奖励
    if (type === 'guard') return Math.min(0.3, count * 0.01); // 护卫：每人-1%秘境耗血，最多-30%
    return 0;
}

// ========== 法宝灵宠羁绊 ==========
function getActiveSynergies() {
    const active = [];
    getActivePets().forEach(({ pet, mult }) => {
        const petType = pet.typeId;
        gameState.equippedArtifacts.forEach(art => {
            if (!art) return;
            const synergy = CONFIG.artifactPetSynergies.find(s => s.artifactType === art.typeId && s.petType === petType);
            if (synergy) active.push({ ...synergy, mult });
        });
    });
    return active;
}

function getSynergyBonus(type) {
    const synergies = getActiveSynergies();
    let bonus = 0;
    synergies.forEach(s => {
        if (s.bonus.type === type || s.bonus.type === 'both') bonus += s.bonus.value * (s.mult || 1);
    });
    return bonus;
}

// ========== 阵法外出加成 ==========
function getFormationOutingBonus(bonusType) {
    if (!gameState.activeFormations) return 0;
    let bonus = 0;
    const now = Date.now();
    gameState.activeFormations.forEach(f => {
        if (f.endTime <= now) return;
        const config = CONFIG.formations.find(cf => cf.id === f.id);
        if (!config || !config.outingBonus) return;
        if (config.outingBonus.type === bonusType || config.outingBonus.type === 'all') {
            // 阵法等级影响外出加成
            const lvMult = getFormationLevelMult(f.id);
            bonus += config.outingBonus.value * lvMult;
        }
    });
    return bonus;
}

// ========== 法宝词条加成 ==========
function getArtifactAffixBonus(effectType) {
    let bonus = 0;
    let flatBonus = 0;
    gameState.equippedArtifacts.forEach(art => {
        if (!art || !art.affixes) return;
        art.affixes.forEach(aff => {
            if (aff.effect === effectType + 'Pct') bonus += aff.value;
            if (aff.effect === effectType + 'Flat') flatBonus += aff.value;
        });
    });
    return { pct: bonus, flat: flatBonus };
}

// ========== 灵宠技能加成 ==========
function getActivePetSkill() {
    if (!gameState.activePet) return null;
    const petType = CONFIG.petTypes.find(t => t.id === gameState.activePet.typeId);
    return petType?.skill || null;
}

function getPetSkillBonus(bonusType) {
    // 使用所有出战灵宠的总技能加成（主100%+副50%）
    return getTotalPetSkillBonus(bonusType);
}

// ========== 阵法升级 ==========
function getFormationLevel(id) {
    return gameState.formationLevels?.[id] || 0;
}

function getFormationLevelMult(id) {
    const lv = getFormationLevel(id);
    return 1 + lv * 0.2; // 每级+20%效果
}

function getFormationUpgradeCost(id) {
    const lv = getFormationLevel(id);
    const config = CONFIG.formations.find(f => f.id === id);
    return Math.floor(config.cost * (1 + lv * 0.5));
}

function upgradeFormation(id) {
    const config = CONFIG.formations.find(f => f.id === id);
    if (!config) return false;
    const lv = getFormationLevel(id);
    if (lv >= 5) { addLog('阵法已达最高等级', ''); SFX.error(); return false; }
    const cost = getFormationUpgradeCost(id);
    if (gameState.spiritStone < cost) { addLog('灵石不足，无法升级阵法', ''); SFX.error(); return false; }
    gameState.spiritStone -= cost;
    if (!gameState.formationLevels) gameState.formationLevels = {};
    gameState.formationLevels[id] = lv + 1;
    SFX.upgrade();
    addLog(`${config.name}升级至${lv + 1}级，效果+20%`, 'success');
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
    if (!confirm(`确定转世重修？\n重置修为、灵石、功法等级、丹药，保留道韵、成就、称号、功法突破/精通，以及最高品质法宝/灵宠和半数弟子`)) return false;
    gameState.dao += daoGain;
    // 转世获得天赋点
    const talentGain = getTalentPointsEarned();
    gameState.talentPoints += talentGain;

    // 保留最高品质法宝
    const allArtifacts = [...gameState.equippedArtifacts.filter(a => a !== null), ...gameState.artifactInventory];
    let bestArtifact = null;
    allArtifacts.forEach(a => { if (!bestArtifact || (a.qualityIndex || 0) > (bestArtifact.qualityIndex || 0)) bestArtifact = a; });

    // 保留最高品质灵宠
    const allPets = gameState.activePet ? [gameState.activePet, ...gameState.petInventory] : [...gameState.petInventory];
    let bestPet = null;
    allPets.forEach(p => { if (!bestPet || (p.qualityIndex || 0) > (bestPet.qualityIndex || 0)) bestPet = p; });

    // 保留半数弟子
    const keepDisciples = Math.floor(gameState.discipleCount / 2);

    gameState.cultivation = 0;
    gameState.spiritStone = 0;
    gameState.realmIndex = 0;
    gameState.realmLayer = 1;
    gameState.discipleCount = keepDisciples;
    gameState.discipleAssign = { alchemy: 0, forge: 0, farm: 0, patrol: 0, scout: 0, guard: 0 };
    gameState.totalCultivation = 0;
    gameState.breakthroughCount = 0;
    gameState.pills = {};
    CONFIG.pills.forEach(p => { gameState.pills[p.id] = { 0: 0, 1: 0, 2: 0 }; });
    gameState.activeBuffs = [];
    gameState.artifactInventory = bestArtifact ? [bestArtifact] : [];
    gameState.equippedArtifacts = [null, null, null];
    gameState.artifactFoundCount = bestArtifact ? 1 : 0;
    gameState.activePet = bestPet || null;
    gameState.secondaryPet = null;
    gameState.petInventory = bestPet ? [] : [];
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
    addLog(`转世重修！获得 ${daoGain} 点道韵，${talentGain} 点天赋点，当前共 ${gameState.dao} 点道韵，${gameState.talentPoints} 点天赋点`, 'breakthrough');
    checkAchievements();
    updateUI();
    return true;
}

