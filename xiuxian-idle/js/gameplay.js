/**
 * gameplay.js - 游戏玩法系统模块
 * 包含：丹药购买/使用、法宝生成/装备/出售、历练开始/完成、成就检查、
 *       每日签到、日常任务、丹药合成、灵宠生成/升级/装备、炼丹/炼器、
 *       阵法激活、秘境挑战、随机奇遇事件
 */

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

    // 每日服用限制
    resetPillDailyUsage();
    const used = gameState.pillDailyUsage[id] || 0;
    if (used >= pill.dailyLimit) { addLog(`${pill.name}今日已达服用上限(${pill.dailyLimit}次)`, ''); SFX.error(); return false; }

    // 同类Buff冲突：效果结束才能服用第二个
    if (pill.effect === 'buff_cult' || pill.effect === 'buff_stone' || pill.effect === 'buff_both') {
        if (hasActiveBuffOfType(pill.effect)) {
            addLog('同类丹药效果尚未结束，请等待效果结束后再服用', ''); SFX.error(); return false;
        }
    }

    gameState.pills[id]--;
    gameState.pillsUsedCount++;
    gameState.pillDailyUsage[id] = used + 1;
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
    } else if (pill.effect === 'heal') {
        const healAmount = Math.floor(getMaxHp() * pill.value);
        gameState.hp = Math.min(getMaxHp(), gameState.hp + healAmount);
        addLog(`服用 ${pill.name}，恢复 ${healAmount} 生命值`, 'success');
        showFloatingText(`+${healAmount} HP`);
    }
    checkAchievements();
    updateUI();
    return true;
}

function useAllPills() {
    let usedCount = 0;
    let usedNames = [];
    CONFIG.pills.forEach(p => {
        const count = gameState.pills[p.id] || 0;
        if (count <= 0) return;
        const used = gameState.pillDailyUsage[p.id] || 0;
        if (used >= p.dailyLimit) return;
        // 跳过buff类丹药（避免冲突），只使用即时类和治疗类
        if (p.effect === 'buff_cult' || p.effect === 'buff_stone' || p.effect === 'buff_both') return;
        // 使用一颗
        gameState.pills[p.id]--;
        gameState.pillsUsedCount++;
        gameState.pillDailyUsage[p.id] = used + 1;
        usedCount++;
        usedNames.push(p.name);
        if (p.effect === 'instant_cult') {
            const gain = getCultivationPerSecond() * p.value;
            gameState.cultivation += gain;
            gameState.totalCultivation += gain;
        } else if (p.effect === 'instant_stone') {
            const gain = getStonePerSecond() * p.value;
            gameState.spiritStone += gain;
        } else if (p.effect === 'heal') {
            const healAmount = Math.floor(getMaxHp() * p.value);
            gameState.hp = Math.min(getMaxHp(), gameState.hp + healAmount);
        }
    });
    if (usedCount > 0) {
        SFX.pill();
        addLog(`一键使用${usedCount}颗丹药：${usedNames.join('、')}`, 'success');
        checkAchievements();
        updateUI();
    } else {
        addLog('没有可使用的丹药（Buff类丹药需手动服用）', '');
    }
}

// 重置每日丹药服用记录
function resetPillDailyUsage() {
    const today = getTodayStr();
    if (gameState.lastPillResetDate !== today) {
        gameState.pillDailyUsage = {};
        gameState.enhancedDailyUsage = {};
        gameState.lastPillResetDate = today;
    }
}

// 检查是否有同类Buff在生效中
function hasActiveBuffOfType(effect) {
    const now = Date.now();
    return gameState.activeBuffs.some(b => {
        if (b.endTime <= now) return false;
        if (effect === 'buff_both') return true; // 混元丹与所有buff冲突
        if (b.type === 'both') return true; // 已有混元丹buff，所有buff冲突
        const targetType = effect === 'buff_cult' ? 'cultivation' : 'stone';
        return b.type === targetType;
    });
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
        affixes: [],
    };
    // 随机词条
    const affixCount = CONFIG.artifactAffixCount[qualityIndex] || 0;
    const availableAffixes = [...CONFIG.artifactAffixes];
    for (let i = 0; i < affixCount && availableAffixes.length > 0; i++) {
        const idx = Math.floor(Math.random() * availableAffixes.length);
        artifact.affixes.push(availableAffixes.splice(idx, 1)[0]);
    }
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
    // 灵宠技能：仙鹤疾风 - 历练时间减少
    const speedBonus = getPetSkillBonus('adventureSpeed');
    const duration = Math.max(1, loc.duration * (1 - speedBonus));
    gameState.adventure = { locationId, startTime: Date.now(), duration: duration * 1000 };
    SFX.adventure();
    let msg = `出发前往 ${loc.name} 历练`;
    if (speedBonus > 0) msg += `（灵宠技能：历练时间-${Math.floor(speedBonus*100)}%）`;
    addLog(msg, 'success');
    updateUI();
    return true;
}

function completeAdventure() {
    if (!gameState.adventure) return;
    const loc = CONFIG.adventures.find(a => a.id === gameState.adventure.locationId);
    const elapsed = (Date.now() - gameState.adventure.startTime) / 1000;
    const totalDuration = gameState.adventure.duration / 1000;
    if (elapsed < totalDuration) return;

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

    const cultBonus = getFormationOutingBonus('adventureCult') + getFormationOutingBonus('all') + getPetSkillBonus('adventureCult') + getPetSkillBonus('all') + getDiscipleAssignBonus('patrol');
    const stoneBonus = getFormationOutingBonus('adventureStone') + getFormationOutingBonus('all') + getPetSkillBonus('adventureStone') + getPetSkillBonus('all');
    // Buff丹药影响历练一次性奖励
    const cultBuffMult = getBuffMultiplier('cultivation');
    const stoneBuffMult = getBuffMultiplier('stone');
    const cultGain = loc.cultReward * (1 + gameState.realmIndex * 0.5) * eventMult.cult * (1 + cultBonus) * cultBuffMult;
    const stoneGain = loc.stoneReward * (1 + gameState.realmIndex * 0.5) * eventMult.stone * (1 + stoneBonus) * stoneBuffMult;
    gameState.cultivation += cultGain;
    gameState.totalCultivation += cultGain;
    gameState.spiritStone += stoneGain;

    let rewardMsg = `历练归来！获得 ${formatNumber(cultGain)} 修为，${formatNumber(stoneGain)} 灵石`;
    if (eventName) {
        const evt = CONFIG.adventureEvents.find(e => e.name === eventName);
        rewardMsg = `【奇遇·${eventName}】${evt.desc} ` + rewardMsg;
        gameState.adventureEventCount = (gameState.adventureEventCount || 0) + 1;
    }

    const artChanceBonus = getFormationOutingBonus('artifactChance') + getFormationOutingBonus('all') + getPetSkillBonus('artifactChance') + getPetSkillBonus('all');
    if (Math.random() < Math.min(1, loc.artifactChance * (1 + artChanceBonus))) {
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
    const totalDuration = gameState.adventure.duration / 1000; // 使用实际存储的时长（可能被灵宠技能缩短）
    return {
        location: loc,
        elapsed,
        remaining: Math.max(0, totalDuration - elapsed),
        progress: Math.min(1, elapsed / totalDuration),
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

function claimAllAchievements() {
    let count = 0;
    let totalDao = 0;
    let totalPoints = 0;
    CONFIG.achievements.forEach(ach => {
        const state = gameState.achievements[ach.id];
        if (state && state.completed && !state.claimed) {
            state.claimed = true;
            count++;
            if (ach.reward.dao) { gameState.dao += ach.reward.dao; totalDao += ach.reward.dao; }
            if (ach.reward.points) { gameState.achievementPoints = (gameState.achievementPoints || 0) + ach.reward.points; totalPoints += ach.reward.points; }
        }
    });
    if (count > 0) {
        SFX.achievement();
        let msg = `一键领取${count}个成就`;
        if (totalDao > 0) msg += `，获得${totalDao}道韵`;
        if (totalPoints > 0) msg += `，${totalPoints}成就点`;
        addLog(msg, 'success');
        updateUI();
    } else {
        addLog('暂无可领取的成就', '');
    }
}

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
    const realmScale = 1 + gameState.realmIndex * 3;
    let rewardAmount = 0;
    let rewardExtraName = '';

    // 发放奖励
    if (reward.type === 'stone') { rewardAmount = Math.floor(reward.amount * realmScale); gameState.spiritStone += rewardAmount; addLog(`签到获得${formatNumber(rewardAmount)}灵石`, 'success'); }
    else if (reward.type === 'cult') { rewardAmount = Math.floor(reward.amount * realmScale); gameState.cultivation += rewardAmount; gameState.totalCultivation += rewardAmount; addLog(`签到获得${formatNumber(rewardAmount)}修为`, 'success'); }
    else if (reward.type === 'dao') { rewardAmount = reward.amount; gameState.dao += reward.amount; addLog(`签到获得${reward.amount}道韵`, 'success'); }
    else if (reward.type === 'pill') {
        const pill = CONFIG.pills[Math.floor(Math.random() * CONFIG.pills.length)];
        gameState.pills[pill.id] = (gameState.pills[pill.id] || 0) + 1;
        rewardExtraName = pill.name;
        addLog(`签到获得 ${pill.name} x1`, 'success');
    }
    else if (reward.type === 'artifact') {
        const art = generateArtifact();
        gameState.artifactInventory.push(art);
        gameState.artifactFoundCount++;
        rewardExtraName = art.name;
        addLog(`签到获得法宝【${art.name}】`, 'breakthrough');
    }

    SFX.achievement();
    addLog(`签到成功！第${gameState.checkinStreak}天，获得${reward.desc}`, 'success');
    checkAchievements();
    updateUI();
    // 弹出奖励弹窗
    showCheckinReward(reward, rewardAmount, rewardExtraName);
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
    if (task.type === 'forge') return gameState.forgeSuccessCount || 0;
    return 0;
}

function claimTask(taskId) {
    const task = CONFIG.dailyTasks.find(t => t.id === taskId);
    if (!task || gameState.taskClaimed[taskId]) return false;
    if (getTaskProgress(taskId) < task.target) { SFX.error(); return false; }
    gameState.taskClaimed[taskId] = true;
    const realmScale = 1 + gameState.realmIndex * 3;
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

    // 强化版每日限制（普通丹药dailyLimit的一半，至少1次）
    resetPillDailyUsage();
    const enhancedLimit = Math.max(1, Math.floor(pill.dailyLimit / 2));
    const enhancedUsed = gameState.enhancedDailyUsage[pillId] || 0;
    if (enhancedUsed >= enhancedLimit) { addLog(`强化${pill.name}今日已达上限(${enhancedLimit}次)`, ''); SFX.error(); return false; }

    // 同类Buff冲突
    if (pill.effect === 'buff_cult' || pill.effect === 'buff_stone' || pill.effect === 'buff_both') {
        if (hasActiveBuffOfType(pill.effect)) {
            addLog('同类丹药效果尚未结束，请等待效果结束后再合成', ''); SFX.error(); return false;
        }
    }

    gameState.pills[pillId] -= 3;
    gameState.enhancedDailyUsage[pillId] = enhancedUsed + 1;
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
    } else if (pill.effect === 'heal') {
        const healAmount = Math.floor(getMaxHp() * pill.value * 2);
        gameState.hp = Math.min(getMaxHp(), gameState.hp + healAmount);
        addLog(`合成强化${pill.name}，恢复${healAmount}生命值`, 'success');
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

function equipSecondaryPet(uid) {
    if (getPetSlots() < 2) { addLog('需突破至化神期解锁副灵宠槽', ''); SFX.error(); return false; }
    const idx = gameState.petInventory.findIndex(p => p.uid === uid);
    if (idx === -1) return false;
    const pet = gameState.petInventory[idx];
    if (gameState.secondaryPet) gameState.petInventory.push(gameState.secondaryPet);
    gameState.secondaryPet = pet;
    gameState.petInventory.splice(idx, 1);
    SFX.buy();
    addLog(`副灵宠：${pet.name}（提供50%加成）`, 'success');
    updateUI();
    return true;
}

function unequipSecondaryPet() {
    if (!gameState.secondaryPet) return false;
    gameState.petInventory.push(gameState.secondaryPet);
    gameState.secondaryPet = null;
    addLog('收回副灵宠', '');
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
    // 全局冷却：同时只能炼一种丹药
    if (Date.now() < gameState.alchemyCooldownEnd) { addLog('丹炉冷却中', ''); SFX.error(); return false; }
    const batchSize = gameState.alchemyBatchSize || 1;
    const totalCost = recipe.cost * batchSize;
    if (gameState.spiritStone < totalCost) { addLog(`灵石不足，批量炼丹需要${formatNumber(totalCost)}灵石`, ''); SFX.error(); return false; }
    gameState.spiritStone -= totalCost;
    // 批量炼制
    let successCount = 0;
    let failCount = 0;
    const pill = CONFIG.pills.find(p => p.id === pillId);
    const alchemyBonus = getRealmPrivilege('alchemy') + getDiscipleAssignBonus('alchemy');
    for (let i = 0; i < batchSize; i++) {
        if (Math.random() < Math.min(1, recipe.successRate + alchemyBonus)) {
            gameState.pills[pillId] = (gameState.pills[pillId] || 0) + 1;
            gameState.alchemySuccessCount = (gameState.alchemySuccessCount || 0) + 1;
            successCount++;
        } else {
            gameState.alchemyFailCount = (gameState.alchemyFailCount || 0) + 1;
            failCount++;
        }
    }
    // 设置全局冷却（批量不增加冷却时间，鼓励批量）
    gameState.alchemyCooldownEnd = Date.now() + recipe.cooldown * 1000;
    if (successCount > 0) {
        SFX.reward();
        addLog(`炼丹完成！成功${successCount}次，失败${failCount}次，获得【${pill.name}】x${successCount}`, 'success');
    } else {
        SFX.error();
        addLog(`炼丹全部失败！${batchSize}颗丹药全部炸炉，损失${formatNumber(totalCost)}灵石`, '');
    }
    updateUI();
    return true;
}

// ========== 炼器系统 ==========
function forgeArtifact(qualityIndex) {
    const recipe = CONFIG.forgeRecipes.find(r => r.qualityIndex === qualityIndex);
    if (!recipe) return false;
    // 全局冷却：同时只能炼一种法宝
    if (Date.now() < gameState.forgeCooldownEnd) { addLog('炼器炉冷却中', ''); SFX.error(); return false; }
    const batchSize = gameState.forgeBatchSize || 1;
    const totalCost = recipe.cost * batchSize;
    if (gameState.spiritStone < totalCost) { addLog(`灵石不足，批量炼器需要${formatNumber(totalCost)}灵石`, ''); SFX.error(); return false; }
    gameState.spiritStone -= totalCost;
    let successCount = 0;
    let failCount = 0;
    const quality = CONFIG.artifactQualities[qualityIndex];
    const forgeBonus = getRealmPrivilege('forge') + getDiscipleAssignBonus('forge');
    for (let i = 0; i < batchSize; i++) {
        if (Math.random() < Math.min(1, recipe.successRate + forgeBonus)) {
            const art = generateArtifact(qualityIndex);
            gameState.artifactInventory.push(art);
            gameState.artifactFoundCount++;
            gameState.forgeSuccessCount = (gameState.forgeSuccessCount || 0) + 1;
            successCount++;
        } else {
            gameState.forgeFailCount = (gameState.forgeFailCount || 0) + 1;
            failCount++;
        }
    }
    gameState.forgeCooldownEnd = Date.now() + recipe.cooldown * 1000;
    if (successCount > 0) {
        SFX.achievement();
        addLog(`炼器完成！成功${successCount}件${quality.name}法宝，失败${failCount}件`, 'breakthrough');
    } else {
        SFX.error();
        addLog(`炼器全部失败！${batchSize}件法宝全部损毁，损失${formatNumber(totalCost)}灵石`, '');
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
        if (formation.effect === type || formation.effect === 'both') {
            bonus += formation.value * getFormationLevelMult(f.id);
        }
    });
    return bonus;
}

function activateFormation(formationId) {
    const formation = CONFIG.formations.find(f => f.id === formationId);
    if (!formation) return false;
    if (gameState.spiritStone < formation.cost) { addLog('灵石不足，无法布置阵法', ''); SFX.error(); return false; }
    // 每次只能生效一个阵法：激活新阵法时替换掉旧的
    const now = Date.now();
    gameState.activeFormations = gameState.activeFormations.filter(f => f.endTime > now);
    if (gameState.activeFormations.length > 0) {
        const old = CONFIG.formations.find(x => x.id === gameState.activeFormations[0].id);
        if (old) addLog(`【${old.name}】已被【${formation.name}】替换`, '');
        gameState.activeFormations = [];
    }
    gameState.spiritStone -= formation.cost;
    gameState.activeFormations.push({ id: formationId, endTime: Date.now() + formation.duration * 1000 });
    gameState.totalFormations = (gameState.totalFormations || 0) + 1;
    SFX.achievement();
    addLog(`布置【${formation.name}】成功，持续${Math.floor(formation.duration/60)}分钟`, 'breakthrough');
    updateUI();
    return true;
}

// 检测阵法过期并提醒
function checkFormationExpiry() {
    if (!gameState.activeFormations || gameState.activeFormations.length === 0) return;
    const now = Date.now();
    const expired = gameState.activeFormations.filter(f => f.endTime <= now);
    if (expired.length > 0) {
        expired.forEach(f => {
            const config = CONFIG.formations.find(cf => cf.id === f.id);
            if (config) addLog(`【${config.name}】已过期，效果失效`, '');
        });
        gameState.activeFormations = gameState.activeFormations.filter(f => f.endTime > now);
    }
}

// ========== 秘境系统 ==========
function getPlayerPower() {
    let power = 0;
    power += gameState.realmIndex * 100 + gameState.realmLayer * 10;
    CONFIG.upgrades.forEach(u => { power += gameState.upgrades[u.id] * (u.effect === 'both' ? 3 : 2); });
    power += gameState.discipleCount * 5;
    power += getArtifactBonus('cultivation') + getArtifactBonus('stone');
    const totalPet = getTotalPetBonus();
    power += (totalPet.cultivation + totalPet.stone) * 2;
    power += gameState.dao * 10;
    return Math.floor(power);
}

// 最大生命值：基础100 + 境界加成 + 战力加成
function getMaxHp() {
    const base = 100;
    const realmBonus = gameState.realmIndex * 50 + gameState.realmLayer * 10;
    const powerBonus = Math.floor(getPlayerPower() / 10);
    return base + realmBonus + powerBonus;
}

// 生命恢复速率：基础1/秒 + 境界加成
function getHpRegenRate() {
    return 1 + gameState.realmIndex * 0.5;
}

// 战力详情拆解
function getPowerBreakdown() {
    const items = [];
    items.push({ name: '境界', value: gameState.realmIndex * 100 + gameState.realmLayer * 10 });
    let upgradePower = 0;
    CONFIG.upgrades.forEach(u => { upgradePower += gameState.upgrades[u.id] * (u.effect === 'both' ? 3 : 2); });
    items.push({ name: '功法升级', value: upgradePower });
    items.push({ name: '弟子', value: gameState.discipleCount * 5 });
    const artPower = getArtifactBonus('cultivation') + getArtifactBonus('stone');
    items.push({ name: '法宝', value: artPower });
    let petPower = 0;
    if (gameState.activePet) {
        const b = getPetBonus(gameState.activePet);
        petPower = (b.cultivation + b.stone) * 2;
    }
    items.push({ name: '灵宠', value: petPower });
    items.push({ name: '道韵', value: gameState.dao * 10 });
    return items;
}

function showPowerModal() {
    const modal = document.getElementById('power-modal');
    if (!modal) return;
    document.getElementById('power-total-value').textContent = formatNumber(getPlayerPower());
    const list = document.getElementById('power-breakdown-list');
    const items = getPowerBreakdown();
    list.innerHTML = items.map(it => `
        <div class="power-breakdown-item">
            <span>${it.name}</span>
            <span class="power-breakdown-value">+${formatNumber(it.value)}</span>
        </div>
    `).join('');
    modal.classList.remove('hidden');
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
    // 血量不足20%无法挑战
    if (gameState.hp < getMaxHp() * 0.2) { addLog('生命值不足20%，无法挑战秘境，请先恢复', ''); SFX.error(); return false; }
    gameState.spiritStone -= d.cost;
    gameState.dungeonCooldowns[dungeonId] = Date.now() + d.cooldown * 1000;

    const power = getPlayerPower();
    // 灵宠技能：火狐 - 秘境成功率+10%
    const successBonus = getPetSkillBonus('dungeonSuccess');
    const successRate = Math.min(0.95, power / d.powerReq * (1 + successBonus));
    const success = Math.random() < successRate;
    // 战斗伤害：秘境越强、玩家越弱，伤害越高
    const damageRatio = Math.max(0.05, Math.min(0.4, d.powerReq / Math.max(power, 1) * 0.15));
    // 阵法/灵宠：秘境耗血减少（护山大阵、玄龟、青龙）
    const dungeonHpReduction = getFormationOutingBonus('dungeonHp') + getPetSkillBonus('dungeonHp');
    const damageMult = Math.max(0.3, 1 + dungeonHpReduction); // 最低30%伤害
    const damage = Math.floor(getMaxHp() * damageRatio * (success ? 0.5 : 1.2) * damageMult);
    gameState.hp = Math.max(1, gameState.hp - damage);

    if (success) {
        // 阵法/灵宠加成：秘境奖励享受历练类加成
        const cultBonus = getFormationOutingBonus('adventureCult') + getFormationOutingBonus('all') + getPetSkillBonus('adventureCult') + getPetSkillBonus('all');
        const stoneBonus = getFormationOutingBonus('adventureStone') + getFormationOutingBonus('all') + getPetSkillBonus('adventureStone') + getPetSkillBonus('all');
        // Buff丹药影响秘境奖励
        const cultBuffMult = getBuffMultiplier('cultivation');
        const stoneBuffMult = getBuffMultiplier('stone');
        const cultGain = d.cultReward * (1 + gameState.realmIndex * 0.3) * (1 + cultBonus) * cultBuffMult;
        const stoneGain = d.stoneReward * (1 + gameState.realmIndex * 0.3) * (1 + stoneBonus) * stoneBuffMult;
        gameState.cultivation += cultGain;
        gameState.totalCultivation += cultGain;
        gameState.spiritStone += stoneGain;
        let msg = `挑战【${d.name}】成功！获得${formatNumber(cultGain)}修为，${formatNumber(stoneGain)}灵石`;

        // 阵法/灵宠加成：法宝掉落率
        const artChanceBonus = getFormationOutingBonus('artifactChance') + getFormationOutingBonus('all') + getPetSkillBonus('artifactChance') + getPetSkillBonus('all');
        if (Math.random() < Math.min(1, d.artifactChance * (1 + artChanceBonus))) {
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
        addLog(msg + `，受到${damage}点伤害`, 'breakthrough');
    } else {
        const loss = Math.floor(gameState.cultivation * 0.05);
        gameState.cultivation = Math.max(0, gameState.cultivation - loss);
        SFX.error();
        addLog(`挑战【${d.name}】失败，损失${formatNumber(loss)}修为，受到${damage}点伤害（成功率${Math.floor(successRate * 100)}%）`, '');
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

// 重置每日奇遇计数
function resetEventDailyCount() {
    const today = getTodayStr();
    if (gameState.lastEventDate !== today) {
        gameState.eventCountToday = 0;
        gameState.lastEventDate = today;
    }
}

function triggerRandomEvent() {
    resetEventDailyCount();
    if (gameState.eventCountToday >= CONFIG.eventMaxPerDay) return;
    // 如果事件弹窗已打开或游戏锁屏，加入队列
    const modal = document.getElementById('event-modal');
    if ((modal && !modal.classList.contains('hidden')) || isLocked) {
        const evt = CONFIG.randomEvents[Math.floor(Math.random() * CONFIG.randomEvents.length)];
        gameState.eventQueue.push(evt);
        return;
    }
    showEventModal();
}

function showEventModal() {
    resetEventDailyCount();
    if (gameState.eventCountToday >= CONFIG.eventMaxPerDay) return;
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
            choicesContainer.innerHTML = `<div class="event-result">${result}</div><button class="claim-btn" id="event-continue-btn">继续</button>`;
            document.getElementById('event-continue-btn').addEventListener('click', () => {
                document.getElementById('event-modal').classList.add('hidden');
                // 处理队列中的下一个奇遇
                if (gameState.eventQueue.length > 0) {
                    gameState.eventQueue.shift();
                    setTimeout(() => showEventModal(), 500);
                }
            });
            SFX.reward();
            updateUI();
        });
        choicesContainer.appendChild(btn);
    });
    document.getElementById('event-modal').classList.remove('hidden');
    gameState.eventCountToday++;
    scheduleNextEvent();
}

function checkRandomEvent() {
    if (!gameState.nextEventTime || gameState.nextEventTime === 0) {
        scheduleNextEvent();
        return;
    }
    resetEventDailyCount();
    if (gameState.eventCountToday >= CONFIG.eventMaxPerDay) return;
    if (Date.now() >= gameState.nextEventTime && gameStarted) {
        triggerRandomEvent();
    }
}

