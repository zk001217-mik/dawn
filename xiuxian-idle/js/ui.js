/**
 * ui.js - 界面渲染模块
 * 包含：标签切换、UI更新(快速/完整/实时)、功法/丹药/法宝/灵宠/阵法渲染、
 *       历练/秘境/炼丹/炼器渲染、签到/任务/成就/商店渲染、
 *       浮动文字、游戏日志、弹窗、产出详情、战力详情
 */

// ========== UI 渲染 ==========
let currentTab = 'cultivation';

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.center-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.center-tab-content .tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabName));
    renderActiveTabContent();
}

function renderActiveTabContent() {
    // 保存当前滚动位置，重建后恢复，避免滚动跳动
    const activeEl = document.querySelector('.tab-content.active');
    const savedScroll = activeEl ? activeEl.scrollTop : 0;

    switch (currentTab) {
        case 'cultivation':
            renderUpgrades();
            const dCost = getDiscipleCost();
            document.getElementById('recruit-cost').textContent = `花费：${formatNumber(dCost)} 灵石`;
            document.getElementById('recruit-btn').disabled = gameState.spiritStone < dCost || gameState.discipleCount >= CONFIG.disciple.maxCount;
            break;
        case 'pills':
            renderPills();
            renderSynthesis();
            renderAlchemy();
            renderHeavenlyItems();
            break;
        case 'artifacts':
            renderArtifacts();
            renderForge();
            break;
        case 'pets':
            renderPets();
            renderPetCollection();
            break;
        case 'formation':
            renderFormations();
            break;
        case 'outing':
            renderAdventures();
            renderDungeons();
            break;
        case 'activity':
            renderCheckin();
            renderTasks();
            renderAchievements();
            renderAchievementShop();
            renderStats();
            renderTitles();
            break;
    }

    // 恢复滚动位置
    if (activeEl) activeEl.scrollTop = savedScroll;
}

// 快速更新：仅更新数字和进度条，不重建标签页DOM（每100ms调用，无闪烁）
function updateFastUI() {
    // 资源
    document.getElementById('cultivation-amount').textContent = formatNumber(gameState.cultivation);
    document.getElementById('spirit-stone-amount').textContent = formatNumber(gameState.spiritStone);
    document.getElementById('dao-amount').textContent = gameState.dao;
    document.getElementById('cultivation-rate').textContent = `+${formatNumber(getCultivationPerSecond())}/秒`;
    document.getElementById('spirit-stone-rate').textContent = `+${formatNumber(getStonePerSecond())}/秒`;

    // 战力
    const powerEl = document.getElementById('power-value');
    if (powerEl) powerEl.textContent = formatNumber(getPlayerPower());

    // 血量
    const maxHp = getMaxHp();
    const hpFill = document.getElementById('hp-fill');
    const hpText = document.getElementById('hp-text');
    const hpRegen = document.getElementById('hp-regen-rate');
    if (hpFill) hpFill.style.width = (gameState.hp / maxHp * 100) + '%';
    if (hpText) hpText.textContent = `${Math.floor(gameState.hp)} / ${maxHp}`;
    if (hpRegen) hpRegen.textContent = getHpRegenRate().toFixed(1);

    // 境界
    document.getElementById('realm-name').textContent = getRealmName();
    const cost = getBreakthroughCost();
    document.getElementById('cultivation-fill').style.width = Math.min(gameState.cultivation / cost, 1) * 100 + '%';
    document.getElementById('cultivation-text').textContent = `${formatNumber(gameState.cultivation)} / ${formatNumber(cost)}`;

    const btBtn = document.getElementById('breakthrough-btn');
    const btCost = document.getElementById('breakthrough-cost');
    const failRate = getBreakthroughFailRate();
    const successPct = Math.floor((1 - failRate) * 100);
    if (gameState.cultivation >= cost) { btBtn.disabled = false; btCost.textContent = `突破 ${successPct}%`; }
    else { btBtn.disabled = true; btCost.textContent = `需${formatNumber(cost)}`; }

    // 境界横幅
    const realmNameEl = document.getElementById('realm-name-banner');
    if (realmNameEl) realmNameEl.textContent = getRealmName();
    const progressFill = document.getElementById('realm-progress-fill');
    if (progressFill) progressFill.style.width = Math.min(gameState.cultivation / cost, 1) * 100 + '%';
    const progressText = document.getElementById('realm-progress-text');
    if (progressText) progressText.textContent = `${formatNumber(gameState.cultivation)} / ${formatNumber(cost)} 修为`;

    // 中间面板数据
    const centerCult = document.getElementById('center-cult-rate');
    if (centerCult) centerCult.textContent = '+' + formatNumber(getCultivationPerSecond()) + '/秒';
    const centerStone = document.getElementById('center-stone-rate');
    if (centerStone) centerStone.textContent = '+' + formatNumber(getStonePerSecond()) + '/秒';
    const centerPower = document.getElementById('center-power');
    if (centerPower) centerPower.textContent = formatNumber(getPlayerPower());
    const centerHp = document.getElementById('center-hp');
    if (centerHp) centerHp.textContent = `${Math.floor(gameState.hp)}/${Math.floor(getMaxHp())}`;
    const centerDisciple = document.getElementById('center-disciple');
    if (centerDisciple) centerDisciple.textContent = gameState.discipleCount;
    const centerDao = document.getElementById('center-dao');
    if (centerDao) centerDao.textContent = gameState.dao;
    const centerPlaytime = document.getElementById('center-playtime');
    if (centerPlaytime) centerPlaytime.textContent = formatTime(gameState.playTime);
    const centerBuff = document.getElementById('center-buff-count');
    if (centerBuff) centerBuff.textContent = gameState.activeBuffs.length;
    const centerTotalCult = document.getElementById('center-total-cult');
    if (centerTotalCult) centerTotalCult.textContent = formatNumber(gameState.totalCultivation);

    // 统计
    document.getElementById('play-time').textContent = formatTime(gameState.playTime);
    document.getElementById('total-cultivation').textContent = formatNumber(gameState.totalCultivation);
    document.getElementById('breakthrough-count').textContent = gameState.breakthroughCount;
    document.getElementById('disciple-count').textContent = gameState.discipleCount;

    // Buff
    renderActiveBuffs();

    // 阶段目标
    const goal = getCurrentGoal();
    const goalEl = document.getElementById('current-goal');
    if (goalEl) goalEl.textContent = goal ? `🎯 ${goal.desc}` : '🎉 所有目标已完成！';
    // 转世
    const daoGain = getRebirthDaoGain();
    const minRebirthRealm = 1;
    const canRebirth = gameState.realmIndex >= minRebirthRealm && daoGain > 0;
    const rebirthInfo = document.getElementById('rebirth-info');
    if (rebirthInfo) {
        if (gameState.realmIndex < minRebirthRealm) {
            rebirthInfo.textContent = `需达到${CONFIG.realms[minRebirthRealm].name}才能转世`;
        } else {
            rebirthInfo.textContent = `获得道韵：${daoGain}`;
        }
    }
    const rebirthBtn = document.getElementById('rebirth-btn');
    if (rebirthBtn) rebirthBtn.disabled = !canRebirth;

    // 轻量实时更新倒计时/进度条（不重建DOM，避免hover闪烁）
    updateLiveElements();
}

// 完整更新：快速更新 + 重建当前标签页内容（每500ms或用户操作后调用）
function updateFullUI() {
    updateFastUI();
    renderActiveTabContent();
}

// 兼容旧调用
function updateUI() { updateFullUI(); }

// 轻量实时更新：只更新倒计时/进度条文本，不重建DOM（避免hover闪烁）
function updateLiveElements() {
    const now = Date.now();
    let needFullRender = false;

    // 更新炼丹/炼器/秘境冷却
    document.querySelectorAll('.craft-cooldown, .dungeon-cooldown').forEach(el => {
        const end = parseInt(el.dataset.cdEnd);
        if (end > now) {
            el.textContent = `冷却中: ${formatCountdown((end - now) / 1000)}`;
        } else {
            needFullRender = true;
        }
    });

    // 更新阵法剩余时间
    document.querySelectorAll('.formation-time').forEach(el => {
        const end = parseInt(el.dataset.endTime);
        if (end > now) {
            el.textContent = formatCountdown((end - now) / 1000);
        } else {
            needFullRender = true;
        }
    });

    // 更新历练进度（外出标签）
    if (currentTab === 'outing') {
        const statusEl = document.getElementById('adventure-status');
        if (statusEl && statusEl.classList.contains('active')) {
            const progress = getAdventureProgress();
            if (progress) {
                const timerEl = statusEl.querySelector('.adv-timer');
                const fillEl = statusEl.querySelector('.adv-progress-fill');
                if (timerEl) timerEl.textContent = formatCountdown(progress.remaining);
                if (fillEl) fillEl.style.width = (progress.progress * 100) + '%';
                if (progress.remaining <= 0) needFullRender = true;
            }
        }
    }

    if (needFullRender) renderActiveTabContent();
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
    resetPillDailyUsage();
    CONFIG.pills.forEach(p => {
        const count = gameState.pills[p.id] || 0;
        const canAfford = gameState.spiritStone >= p.cost;
        const used = gameState.pillDailyUsage[p.id] || 0;
        const dailyLimitReached = used >= p.dailyLimit;
        const buffConflict = (p.effect === 'buff_cult' || p.effect === 'buff_stone' || p.effect === 'buff_both') && hasActiveBuffOfType(p.effect);
        const canUse = count > 0 && !dailyLimitReached && !buffConflict;
        const item = document.createElement('div');
        item.className = 'pill-item' + (!canAfford ? ' cant-afford' : '');
        let statusText = `今日:${used}/${p.dailyLimit}`;
        if (buffConflict) statusText += ' ⚠同类生效中';
        item.innerHTML = `
            <div class="pill-header"><span class="pill-name">${p.icon} ${p.name}</span><span class="pill-count">x${count}</span></div>
            <div class="pill-desc">${p.desc}</div>
            <div class="pill-daily-info">${statusText}</div>
            <div class="pill-actions">
                <button class="pill-btn" ${!canAfford ? 'disabled' : ''} data-action="buy" data-id="${p.id}">购买 ${formatNumber(p.cost)}灵石</button>
                <button class="pill-btn use-btn" ${!canUse ? 'disabled' : ''} data-action="use" data-id="${p.id}">使用</button>
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
    resetAutoLockTimer();
    resetDailyTasks();
    applyTheme(gameState.settings.theme || 'gold');
    checkLockOnLoad();
    document.getElementById('start-screen').classList.add('hidden');
    addLog(info ? `读取存档 ${slotIndex + 1} 成功，当前境界：${getRealmName()}` : '开始新的修仙之旅！', 'success');
    checkAchievements();
    updateUI();
}

// ========== 签到渲染 ==========
function renderCheckin() {
    const container = document.getElementById('checkin-area');
    if (!container) return;
    const checked = !canCheckin();
    const streak = gameState.checkinStreak || 0;
    container.innerHTML = `
        <div style="text-align:center;margin-bottom:10px;font-size:13px;color:var(--text-secondary)">
            连续签到：<span style="color:var(--text-gold);font-weight:bold">${streak}</span> 天
            ${checked ? '<span style="color:var(--success);margin-left:8px">今日已签到</span>' : ''}
        </div>
        <button class="checkin-btn" ${checked ? 'disabled' : ''}>${checked ? '今日已签到' : '每日签到'}</button>
    `;
    const btn = container.querySelector('.checkin-btn');
    if (btn) btn.addEventListener('click', doCheckin);
}

// 显示签到奖励弹窗
function showCheckinReward(reward, amount, extraName) {
    const modal = document.getElementById('checkin-modal');
    if (!modal) return;
    const rewardText = document.getElementById('checkin-reward-text');
    const rewardIcon = document.getElementById('checkin-reward-icon');
    let icon = '🎁';
    let text = '';
    if (reward.type === 'stone') { icon = '💎'; text = `${formatNumber(amount)} 灵石`; }
    else if (reward.type === 'cult') { icon = '✦'; text = `${formatNumber(amount)} 修为`; }
    else if (reward.type === 'dao') { icon = '❖'; text = `${reward.amount} 道韵`; }
    else if (reward.type === 'pill') { icon = '💊'; text = `${extraName} x1`; }
    else if (reward.type === 'artifact') { icon = '⚔'; text = `法宝【${extraName}】`; }
    rewardIcon.textContent = icon;
    rewardText.textContent = text;
    document.getElementById('checkin-streak-text').textContent = `连续签到第 ${gameState.checkinStreak} 天`;
    modal.classList.remove('hidden');
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
            ${cooling ? `<div class="dungeon-cooldown" data-cd-end="${cd}">冷却中: ${formatCountdown((cd - Date.now()) / 1000)}</div>` : ''}
            ${!unlocked ? `<div class="dungeon-desc" style="color:var(--accent-red)">境界不足，无法挑战</div>` : ''}`;
        if (unlocked && !cooling && canAfford) {
            item.addEventListener('click', () => challengeDungeon(d.id));
        }
        container.appendChild(item);
    });
}

// ========== 炼丹渲染 ==========
function renderBatchSelector(containerId, batchKey, sizes) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const current = gameState[batchKey] || 1;
    container.innerHTML = `<label>批量：</label><div class="batch-btns">` +
        sizes.map(s => `<button class="batch-btn${s === current ? ' active' : ''}" data-size="${s}" data-key="${batchKey}">x${s}</button>`).join('') +
        `</div>`;
    container.querySelectorAll('.batch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState[btn.dataset.key] = parseInt(btn.dataset.size);
            renderActiveTabContent();
        });
    });
}

function renderAlchemy() {
    const container = document.getElementById('alchemy-list');
    if (!container) return;
    renderBatchSelector('alchemy-batch-selector', 'alchemyBatchSize', [1, 5, 10, 20, 50]);
    container.innerHTML = '';
    const globalCd = gameState.alchemyCooldownEnd || 0;
    const cooling = Date.now() < globalCd;
    CONFIG.alchemyRecipes.forEach(recipe => {
        const pill = CONFIG.pills.find(p => p.id === recipe.pillId);
        const batchSize = gameState.alchemyBatchSize || 1;
        const totalCost = recipe.cost * batchSize;
        const canAfford = gameState.spiritStone >= totalCost;
        const item = document.createElement('div');
        item.className = 'craft-item' + (cooling || !canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">${pill.icon} 炼制${pill.name}</span><span class="craft-rate">成功率${Math.floor(recipe.successRate*100)}%</span></div>
            <div class="craft-desc">比购买便宜${Math.floor((1 - recipe.cost/pill.cost)*100)}%，失败损失灵石</div>
            <div class="craft-info">消耗:${formatNumber(totalCost)}灵石(x${batchSize}) | 冷却:${recipe.cooldown}秒</div>
            ${cooling ? `<div class="craft-cooldown" data-cd-end="${globalCd}">丹炉冷却中: ${formatCountdown((globalCd - Date.now()) / 1000)}</div>` : `<button class="craft-btn" ${!canAfford ? 'disabled' : ''}>炼丹 x${batchSize}</button>`}`;
        if (!cooling && canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); alchemyPill(recipe.pillId); });
        }
        container.appendChild(item);
    });
}

// ========== 炼器渲染 ==========
function renderForge() {
    const container = document.getElementById('forge-list');
    if (!container) return;
    renderBatchSelector('forge-batch-selector', 'forgeBatchSize', [1, 5, 10, 20, 50]);
    container.innerHTML = '';
    const globalCd = gameState.forgeCooldownEnd || 0;
    const cooling = Date.now() < globalCd;
    CONFIG.forgeRecipes.forEach(recipe => {
        const batchSize = gameState.forgeBatchSize || 1;
        const totalCost = recipe.cost * batchSize;
        const canAfford = gameState.spiritStone >= totalCost;
        const quality = CONFIG.artifactQualities[recipe.qualityIndex];
        const item = document.createElement('div');
        item.className = 'craft-item quality-' + quality.color + (cooling || !canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">炼制${recipe.name}</span><span class="craft-rate">成功率${Math.floor(recipe.successRate*100)}%</span></div>
            <div class="craft-desc">成功获得随机类型的${quality.name}法宝</div>
            <div class="craft-info">消耗:${formatNumber(totalCost)}灵石(x${batchSize}) | 冷却:${recipe.cooldown}秒</div>
            ${cooling ? `<div class="craft-cooldown" data-cd-end="${globalCd}">炼器炉冷却中: ${formatCountdown((globalCd - Date.now()) / 1000)}</div>` : `<button class="craft-btn" ${!canAfford ? 'disabled' : ''}>炼器 x${batchSize}</button>`}`;
        if (!cooling && canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); forgeArtifact(recipe.qualityIndex); });
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
                item.innerHTML = `<span>${formation.icon} ${formation.name}</span><span class="formation-time" data-end-time="${f.endTime}">${formatCountdown(remain)}</span>`;
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
// 旧批量函数已移除，批量功能集成到炼丹/炼器主按钮中

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
        { key: 'alchemy_global', cd: gameState.alchemyCooldownEnd || 0, name: '炼丹炉' },
        { key: 'forge_global', cd: gameState.forgeCooldownEnd || 0, name: '炼器炉' },
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
    const container = document.getElementById('settings-panel-modal');
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
        <div class="lock-setting-row">
            <label>锁屏密码${s.lockPassword ? '（已设置）' : '（未设置）'}</label>
            <input type="password" id="set-lockpwd" placeholder="输入新密码，留空则清除" autocomplete="off">
            <div class="lock-setting-btns">
                <button id="set-lockpwd-save">保存密码</button>
                <button id="set-lockpwd-clear">清除密码</button>
            </div>
        </div>
        <div class="lock-setting-row">
            <label>自动锁屏（无操作后）</label>
            <select id="set-autolock" style="width:100%;padding:6px;background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-gold);border-radius:4px">
                <option value="0" ${s.autoLockMinutes===0?'selected':''}>关闭</option>
                <option value="1" ${s.autoLockMinutes===1?'selected':''}>1分钟</option>
                <option value="3" ${s.autoLockMinutes===3?'selected':''}>3分钟</option>
                <option value="5" ${s.autoLockMinutes===5?'selected':''}>5分钟</option>
                <option value="10" ${s.autoLockMinutes===10?'selected':''}>10分钟</option>
                <option value="30" ${s.autoLockMinutes===30?'selected':''}>30分钟</option>
            </select>
        </div>
        <div style="margin-bottom:12px">
            <label style="display:block;font-size:13px;margin-bottom:4px">界面主题</label>
            <div class="theme-selector" id="theme-selector">
                <div class="theme-option${(gameState.settings.theme||'gold')==='gold'?' active':''}" data-theme="gold"><span class="theme-dot" style="background:#d4af37"></span>金色</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='cyan'?' active':''}" data-theme="cyan"><span class="theme-dot" style="background:#26c6da"></span>青冥</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='purple'?' active':''}" data-theme="purple"><span class="theme-dot" style="background:#c626da"></span>紫霞</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='blue'?' active':''}" data-theme="blue"><span class="theme-dot" style="background:#2676da"></span>碧波</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='green'?' active':''}" data-theme="green"><span class="theme-dot" style="background:#26da5c"></span>翠林</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='red'?' active':''}" data-theme="red"><span class="theme-dot" style="background:#da2626"></span>赤炎</div>
                <div class="theme-option${(gameState.settings.theme||'gold')==='dark'?' active':''}" data-theme="dark"><span class="theme-dot" style="background:#888"></span>暗夜</div>
            </div>
        </div>
        <div style="margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid var(--border-gold)">
            <div style="font-size:13px;color:var(--text-gold);margin-bottom:6px">📁 存档位置</div>
            <div style="font-size:11px;color:var(--text-secondary);line-height:1.6">
                <div>存储方式：浏览器本地存储（localStorage）</div>
                <div>存档标识：${CONFIG.saveKey}_slot_${gameState.currentSlot || 0}</div>
                <div style="color:var(--accent-red-light);margin-top:4px">⚠ 清除浏览器数据会丢失存档，建议定期使用「导出存档」备份</div>
            </div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">当前称号：${getCurrentTitleName()}</div>`;
    document.getElementById('set-sound').addEventListener('click', () => { gameState.settings.soundEnabled = !gameState.settings.soundEnabled; gameState.soundEnabled = gameState.settings.soundEnabled; renderSettings(); });
    document.getElementById('set-autosave').addEventListener('change', (e) => { gameState.settings.autoSaveInterval = parseInt(e.target.value); });
    document.getElementById('set-numfmt').addEventListener('change', (e) => { gameState.settings.numberFormat = e.target.value; updateUI(); });
    document.getElementById('set-float').addEventListener('click', () => { gameState.settings.showFloatingText = !gameState.settings.showFloatingText; renderSettings(); });
    document.getElementById('set-lockpwd-save').addEventListener('click', () => {
        const val = document.getElementById('set-lockpwd').value.trim();
        if (val) {
            setLockPassword(val);
            alert('锁屏密码已设置');
        } else {
            alert('密码不能为空');
        }
        renderSettings();
    });
    document.getElementById('set-lockpwd-clear').addEventListener('click', () => {
        if (confirm('确定清除锁屏密码？清除后将无法使用锁屏功能。')) {
            setLockPassword('');
            alert('锁屏密码已清除');
            renderSettings();
        }
    });
    document.getElementById('set-autolock').addEventListener('change', (e) => {
        gameState.settings.autoLockMinutes = parseInt(e.target.value);
        resetAutoLockTimer();
        saveGame();
    });
    // 主题切换
    document.querySelectorAll('#theme-selector .theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const theme = opt.dataset.theme;
            gameState.settings.theme = theme;
            applyTheme(theme);
            document.querySelectorAll('#theme-selector .theme-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            saveGame();
        });
    });
}

/**
 * 应用界面主题
 * @param {string} theme - 主题名称: gold/cyan/purple/blue/green/red/dark
 */
function applyTheme(theme) {
    document.body.classList.remove('theme-gold', 'theme-cyan', 'theme-purple', 'theme-blue', 'theme-green', 'theme-red', 'theme-dark');
    if (theme && theme !== 'gold') {
        document.body.classList.add('theme-' + theme);
    }
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


// ========== 玩法说明 ==========
const HELP_CONTENTS = {
    basic: `
        <h4>🎯 游戏目标</h4>
        <p>通过挂机修炼积累修为，突破境界，最终飞升成仙。游戏为纯放置类，即使关闭页面也会计算离线收益。</p>
        <h4>⚡ 修为与灵石</h4>
        <ul>
            <li><b>修为</b>：核心资源，用于境界突破，由功法、弟子、丹药、阵法等加成</li>
            <li><b>灵石</b>：通用货币，用于升级功法、招募弟子、购买丹药、炼器炼丹等</li>
            <li>两者均每秒自动产出，产出速度受多种加成影响</li>
        </ul>
        <h4>🏔 境界突破</h4>
        <ul>
            <li>每个境界分9层，修为达到当前层需求后自动升层</li>
            <li>9层圆满后可点击「突破」进入下一境界，有失败概率</li>
            <li>境界顺序：练气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫</li>
        </ul>
        <h4>❤ 生命值与战力</h4>
        <ul>
            <li><b>生命值</b>：秘境挑战时会扣血，每秒自动恢复，回春丹可快速回复</li>
            <li><b>战力</b>：由境界、法宝、灵宠、阵法等综合决定，影响秘境挑战</li>
            <li>点击顶部战力数字可查看战力详情</li>
        </ul>
        <div class="tip">💡 新手建议：先升级基础吐纳术和聚灵阵，招募几个弟子，稳定产出后再探索丹药和法宝系统。</div>
    `,
    cultivation: `
        <h4>📜 功法系统</h4>
        <p>功法是提升修为和灵石产出的核心途径，共10种功法，随境界解锁。</p>
        <ul>
            <li><b>基础吐纳术/聚灵阵</b>：初始可用，分别提升修为和灵石</li>
            <li><b>龟息吐纳法/灵田开垦/心法要诀</b>：筑基期解锁，中等加成</li>
            <li><b>炼丹之术/炼器之术</b>：金丹期解锁，提升炼丹炼器效率</li>
            <li><b>周天星斗阵/御剑之术</b>：元婴期解锁，大幅加成</li>
            <li><b>悟道心得</b>：化神期解锁，终极修为加成</li>
        </ul>
        <h4>⬆ 升级机制</h4>
        <ul>
            <li>消耗灵石升级，等级越高效果越强，升级成本递增</li>
            <li>功法效果 = 基础值 × 等级 × 品阶成长系数</li>
            <li>部分功法同时提升修为和灵石产出</li>
        </ul>
        <h4>👥 弟子堂</h4>
        <ul>
            <li>消耗灵石招募弟子，最多50名</li>
            <li>每名弟子提供 +1.5% 修为和 +1% 灵石产出</li>
            <li>招募成本随数量递增（×1.35）</li>
        </ul>
    `,
    pills: `
        <h4>💊 丹药坊</h4>
        <p>购买即效丹药，提供临时增益或即时收益。</p>
        <ul>
            <li><b>聚气丹/聚灵符</b>：修为或灵石产出+100%，持续5分钟，每日限3次</li>
            <li><b>悟道丹/点石成金符</b>：立即获得30/60秒产出，每日限5次</li>
            <li><b>双倍修为丹/聚财符</b>：产出+200%，持续3分钟，每日限2次</li>
            <li><b>混元丹</b>：修为灵石各+80%，持续10分钟，每日限1次</li>
            <li><b>回春丹</b>：立即恢复50%最大生命，每日限5次</li>
        </ul>
        <h4>⚠ 服用规则</h4>
        <ul>
            <li>每种丹药有每日服用上限，次日重置</li>
            <li>同类型丹药效果互斥，需等当前效果结束才能服用下一个</li>
            <li>强化版丹药（丹炉合成）效果翻倍，限制与普通版独立</li>
        </ul>
        <h4>🔥 炼丹炉</h4>
        <ul>
            <li>消耗灵石和时间自行炼丹，比直接购买更划算</li>
            <li>可设置批量炼制数量（x1/x5/x10/x20/x50）</li>
            <li>同时只能炼制一种丹药，有全局冷却</li>
        </ul>
        <h4>⚗ 丹炉合成</h4>
        <p>消耗3颗同类丹药合成1颗强化版（效果翻倍），适合高阶玩家。</p>
    `,
    artifact: `
        <h4>⚔ 法宝系统</h4>
        <p>法宝提供战力和属性加成，是挑战高难度秘境的关键。</p>
        <h4>🔨 炼器</h4>
        <ul>
            <li>消耗灵石炼制随机法宝，分凡品/良品/上品/极品四档</li>
            <li>品质越高，成功率越低，消耗灵石越多</li>
            <li>可批量炼器，同时只能炼制一种品质</li>
        </ul>
        <h4>📦 装备与强化</h4>
        <ul>
            <li>共3个装备槽位，点击背包中的法宝即可装备</li>
            <li>法宝可消耗灵石强化，提升属性</li>
            <li>不需要的法宝可出售换取灵石</li>
        </ul>
        <h4>💎 法宝属性</h4>
        <ul>
            <li>攻击型：提升战力和秘境伤害</li>
            <li>防御型：提升生命上限和减伤</li>
            <li>辅助型：提升修为或灵石产出</li>
        </ul>
    `,
    pet: `
        <h4>🐾 灵宠系统</h4>
        <p>灵宠提供持续属性加成，是后期提升战力的重要途径。</p>
        <h4>🥚 获取灵宠</h4>
        <ul>
            <li>通过历练或秘境挑战有概率获得灵宠蛋</li>
            <li>灵宠分不同类型，各有侧重（攻击/防御/辅助）</li>
            <li>同时只能装备1只灵宠</li>
        </ul>
        <h4>⬆ 培养灵宠</h4>
        <ul>
            <li>消耗灵石升级灵宠，提升加成效果</li>
            <li>喂食可临时提升灵宠属性</li>
            <li>不需要的灵宠可放生</li>
        </ul>
        <h4>📖 灵宠图鉴</h4>
        <p>收集不同类型的灵宠可解锁图鉴成就，获得额外奖励。</p>
    `,
    formation: `
        <h4>🔮 阵法系统</h4>
        <p>阵法提供限时全局增益，激活后持续30分钟。</p>
        <ul>
            <li><b>聚灵阵</b>：修为产出+15%</li>
            <li><b>聚财阵</b>：灵石产出+15%</li>
            <li><b>护山大阵</b>：修为灵石各+10%</li>
            <li><b>周天星斗阵</b>：修为产出+35%</li>
            <li><b>混元无极阵</b>：修为灵石各+30%</li>
        </ul>
        <div class="tip">💡 每次只能生效一个阵法，激活新阵法会替换掉当前生效的阵法。</div>
    `,
    adventure: `
        <h4>🗺 历练</h4>
        <ul>
            <li>选择历练地点，消耗时间自动完成</li>
            <li>奖励包括灵石、修为、法宝、灵宠蛋等</li>
            <li>更高等级的历练地点需要更高境界解锁</li>
            <li>离线期间历练也会继续进行</li>
        </ul>
        <h4>🏰 秘境挑战</h4>
        <ul>
            <li>消耗生命值挑战秘境，获得丰厚奖励</li>
            <li>秘境难度递增，需要足够的战力和生命值</li>
            <li>挑战失败不会扣血，但无法获得奖励</li>
            <li>生命值不足时可使用回春丹或等待自动恢复</li>
        </ul>
        <h4>🎲 奇遇事件</h4>
        <ul>
            <li>每30-60分钟随机触发一次奇遇</li>
            <li>每天最多5个奇遇，可累计（弹窗打开时新事件入队）</li>
            <li>奇遇可能获得稀有奖励或触发特殊剧情</li>
        </ul>
    `,
    activity: `
        <h4>📅 每日签到</h4>
        <ul>
            <li>每天可签到一次，获得修为和灵石奖励</li>
            <li>奖励随境界提升而增加（每阶×3倍）</li>
            <li>7天为一个循环，连续签到不中断</li>
        </ul>
        <h4>📋 日常任务</h4>
        <ul>
            <li>每天刷新3个日常任务</li>
            <li>完成任务获得奖励，包括升级功法、炼器、招募弟子等</li>
            <li>任务奖励同样随境界缩放</li>
        </ul>
        <h4>🏆 成就系统</h4>
        <ul>
            <li>达成特定条件解锁成就，获得道韵奖励</li>
            <li>成就点数可在成就商店兑换稀有物品</li>
        </ul>
        <h4>🎖 称号系统</h4>
        <p>达成里程碑自动获得称号，称号提供永久属性加成，在设置中可查看当前称号。</p>
    `,
    rebirth: `
        <h4>🔄 转世重修</h4>
        <p>转世是游戏的核心进阶机制，重置进度但获得永久加成。</p>
        <h4>📋 转世条件</h4>
        <ul>
            <li>最低境界要求：<b>筑基期</b>（练气期无法转世）</li>
            <li>境界越高，转世获得的道韵越多</li>
        </ul>
        <h4>✨ 道韵系统</h4>
        <ul>
            <li>转世后获得<b>道韵</b>，永久提升修为和灵石产出</li>
            <li>道韵收益 = max(3, floor(sqrt(累计修为 / 5000)))</li>
            <li>前期保底3点道韵，鼓励尽早转世</li>
            <li>每点道韵提供少量永久加成，可叠加</li>
        </ul>
        <h4>⚠ 注意事项</h4>
        <ul>
            <li>转世会重置：修为、灵石、功法等级、弟子、丹药、法宝、灵宠</li>
            <li>保留：道韵、成就、称号、存档槽位</li>
            <li>转世后从练气期重新开始，但有道韵加成进度更快</li>
        </ul>
        <div class="tip">💡 建议在卡境界或进度明显变慢时转世，利用道韵加成突破瓶颈。</div>
    `
};

function showHelpModal() {
    document.getElementById('help-modal').classList.remove('hidden');
    switchHelpTab('basic');
}

function closeHelpModal() {
    document.getElementById('help-modal').classList.add('hidden');
}

function switchHelpTab(tab) {
    document.querySelectorAll('.help-tab').forEach(b => b.classList.toggle('active', b.dataset.help === tab));
    document.getElementById('help-content').innerHTML = HELP_CONTENTS[tab] || '<p>暂无说明</p>';
}
