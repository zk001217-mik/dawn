/**
 * ui.js - 界面渲染模块
 * 包含：标签切换、UI更新(快速/完整/实时)、功法/丹药/法宝/灵宠/阵法渲染、
 *       历练/秘境/炼丹/炼器渲染、签到/任务/成就/商店渲染、
 *       浮动文字、游戏日志、弹窗、产出详情、战力详情
 */

// ========== UI 渲染 ==========
let currentTab = 'cultivation';

// ========== 法宝对比弹窗 ==========
function showArtifactCompare(newUid) {
    const newArt = gameState.artifactInventory.find(a => a.uid === newUid);
    if (!newArt) return;
    const list = document.getElementById('artifact-compare-list');
    list.innerHTML = '';
    gameState.equippedArtifacts.forEach((oldArt, i) => {
        if (!oldArt) return;
        const newCult = newArt.effect === 'cultivation' || newArt.effect === 'both' ? newArt.bonus : 0;
        const newStone = newArt.effect === 'stone' || newArt.effect === 'both' ? newArt.bonus : 0;
        const oldCult = oldArt.effect === 'cultivation' || oldArt.effect === 'both' ? oldArt.bonus : 0;
        const oldStone = oldArt.effect === 'stone' || oldArt.effect === 'both' ? oldArt.bonus : 0;
        const cultDiff = newCult - oldCult;
        const stoneDiff = newStone - oldStone;
        const cultColor = cultDiff > 0 ? 'var(--success)' : cultDiff < 0 ? 'var(--accent-red)' : 'var(--text-muted)';
        const stoneColor = stoneDiff > 0 ? 'var(--success)' : stoneDiff < 0 ? 'var(--accent-red)' : 'var(--text-muted)';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-gold);border-radius:6px;margin-bottom:8px;cursor:pointer';
        row.innerHTML = `
            <div style="flex:1">
                <div style="font-weight:bold">槽位${i + 1}: ${oldArt.icon} ${oldArt.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">修为+${formatNumber(oldCult)}/秒 灵石+${formatNumber(oldStone)}/秒</div>
            </div>
            <div style="text-align:right;font-size:12px">
                <div style="color:${cultColor}">修为 ${cultDiff >= 0 ? '+' : ''}${formatNumber(cultDiff)}</div>
                <div style="color:${stoneColor}">灵石 ${stoneDiff >= 0 ? '+' : ''}${formatNumber(stoneDiff)}</div>
            </div>`;
        row.addEventListener('click', () => {
            equipArtifact(newUid, i);
            document.getElementById('artifact-compare-modal').classList.add('hidden');
        });
        list.appendChild(row);
    });
    document.getElementById('artifact-compare-modal').classList.remove('hidden');
}

// ========== 标签页红点提醒 ==========
function updateTabDots() {
    const now = Date.now();
    // 丹药：炼丹冷却结束且有灵石
    const alchemyReady = now >= (gameState.alchemyCooldownEnd || 0) && gameState.spiritStone >= 50;
    document.getElementById('dot-pills')?.classList.toggle('hidden', !alchemyReady || currentTab === 'pills');
    // 法宝：炼器冷却结束且有灵石
    const forgeReady = now >= (gameState.forgeCooldownEnd || 0) && gameState.spiritStone >= 100;
    document.getElementById('dot-artifacts')?.classList.toggle('hidden', !forgeReady || currentTab === 'artifacts');
    // 外出：历练完成或秘境冷却结束
    const adventureDone = gameState.adventure && gameState.adventure.endTime <= now;
    let dungeonReady = false;
    if (gameState.dungeonCooldowns) {
        for (const id in gameState.dungeonCooldowns) {
            if (now >= gameState.dungeonCooldowns[id]) { dungeonReady = true; break; }
        }
    }
    const outingReady = adventureDone || dungeonReady;
    document.getElementById('dot-outing')?.classList.toggle('hidden', !outingReady || currentTab === 'outing');
}

// ========== 批量选择模式 ==========
let artifactBatchMode = false;
let selectedArtifactUids = [];
let petBatchMode = false;
let selectedPetUids = [];

function toggleArtifactBatch() {
    artifactBatchMode = !artifactBatchMode;
    selectedArtifactUids = [];
    document.getElementById('artifact-batch-actions')?.classList.toggle('hidden', !artifactBatchMode);
    document.getElementById('artifact-batch-btn').textContent = artifactBatchMode ? '退出多选' : '多选';
    updateUI();
}

function togglePetBatch() {
    petBatchMode = !petBatchMode;
    selectedPetUids = [];
    document.getElementById('pet-batch-actions')?.classList.toggle('hidden', !petBatchMode);
    document.getElementById('pet-batch-btn').textContent = petBatchMode ? '退出多选' : '多选';
    updateUI();
}

function toggleArtifactSelect(uid) {
    const idx = selectedArtifactUids.indexOf(uid);
    if (idx > -1) selectedArtifactUids.splice(idx, 1);
    else selectedArtifactUids.push(uid);
    document.getElementById('artifact-selected-count').textContent = `已选${selectedArtifactUids.length}件`;
    updateUI();
}

function togglePetSelect(uid) {
    const idx = selectedPetUids.indexOf(uid);
    if (idx > -1) selectedPetUids.splice(idx, 1);
    else selectedPetUids.push(uid);
    document.getElementById('pet-selected-count').textContent = `已选${selectedPetUids.length}只`;
    updateUI();
}

function batchDecomposeArtifacts() {
    if (selectedArtifactUids.length === 0) { addLog('请先选择要分解的法宝', ''); return; }
    if (!confirm(`确定分解选中的${selectedArtifactUids.length}件法宝？`)) return;
    let totalStone = 0;
    selectedArtifactUids.forEach(uid => {
        const art = gameState.artifactInventory.find(a => a.uid === uid);
        if (art) {
            const sellPrice = Math.floor(art.bonus * 5 * (art.qualityIndex + 1));
            gameState.spiritStone += sellPrice;
            totalStone += sellPrice;
            gameState.artifactInventory = gameState.artifactInventory.filter(a => a.uid !== uid);
        }
    });
    addLog(`批量分解${selectedArtifactUids.length}件法宝，获得${formatNumber(totalStone)}灵石`, 'success');
    SFX.reward();
    selectedArtifactUids = [];
    artifactBatchMode = false;
    document.getElementById('artifact-batch-actions')?.classList.add('hidden');
    document.getElementById('artifact-batch-btn').textContent = '多选';
    updateUI();
}

function batchReleasePets() {
    if (selectedPetUids.length === 0) { addLog('请先选择要放生的灵宠', ''); return; }
    if (!confirm(`确定放生选中的${selectedPetUids.length}只灵宠？`)) return;
    let totalStone = 0;
    selectedPetUids.forEach(uid => {
        const pet = gameState.petInventory.find(p => p.uid === uid);
        if (pet) {
            const reward = Math.floor((pet.qualityIndex + 1) * 50 * pet.level);
            gameState.spiritStone += reward;
            totalStone += reward;
            gameState.petInventory = gameState.petInventory.filter(p => p.uid !== uid);
        }
    });
    addLog(`批量放生${selectedPetUids.length}只灵宠，获得${formatNumber(totalStone)}灵石`, 'success');
    SFX.reward();
    selectedPetUids = [];
    petBatchMode = false;
    document.getElementById('pet-batch-actions')?.classList.add('hidden');
    document.getElementById('pet-batch-btn').textContent = '多选';
    updateUI();
}

// ========== 标签页滚动位置记忆 ==========
const tabScrollPositions = {};

function switchTab(tabName) {
    // 保存当前标签页滚动位置
    const currentActive = document.querySelector('.tab-content.active');
    if (currentActive && currentTab) {
        tabScrollPositions[currentTab] = currentActive.scrollTop;
    }

    currentTab = tabName;
    document.querySelectorAll('.center-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.center-tab-content .tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabName));
    if (SFX && SFX.click) SFX.click();
    renderActiveTabContent();

    // 恢复目标标签页滚动位置
    const newActive = document.getElementById('tab-' + tabName);
    if (newActive && tabScrollPositions[tabName] !== undefined) {
        newActive.scrollTop = tabScrollPositions[tabName];
    }
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
            // 弟子分工显示
            const da = gameState.discipleAssign || { alchemy: 0, forge: 0, farm: 0, patrol: 0, scout: 0, guard: 0 };
            document.getElementById('disciple-total').textContent = gameState.discipleCount;
            document.getElementById('disciple-unassigned').textContent = getUnassignedCount();
            document.getElementById('assign-alchemy').textContent = da.alchemy || 0;
            document.getElementById('assign-forge').textContent = da.forge || 0;
            document.getElementById('assign-farm').textContent = da.farm || 0;
            document.getElementById('assign-patrol').textContent = da.patrol || 0;
            document.getElementById('assign-scout').textContent = da.scout || 0;
            document.getElementById('assign-guard').textContent = da.guard || 0;
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
            renderTalentTree();
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

    // 境界特权
    const realm = CONFIG.realms[gameState.realmIndex];
    const privIcon = document.getElementById('privilege-icon');
    const privText = document.getElementById('privilege-text');
    if (privIcon) privIcon.textContent = realm.privilegeIcon || '🌱';
    if (privText) privText.textContent = realm.privilege || '初入修仙，无特殊能力';

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
    // 下次突破预估
    const nextBtCost = getBreakthroughCost();
    const cultPerSec = getCultivationPerSecond();
    const remaining = Math.max(0, nextBtCost - gameState.cultivation);
    const nextBtEl = document.getElementById('next-breakthrough-info');
    if (nextBtEl) {
        if (remaining <= 0) {
            nextBtEl.textContent = '可突破!';
            nextBtEl.style.color = 'var(--success)';
        } else if (cultPerSec > 0) {
            const seconds = Math.ceil(remaining / cultPerSec);
            nextBtEl.textContent = formatNumber(remaining) + ' (' + formatTime(seconds) + ')';
            nextBtEl.style.color = '';
        } else {
            nextBtEl.textContent = formatNumber(remaining);
            nextBtEl.style.color = '';
        }
    }

    // Buff
    renderActiveBuffs();

    // 阶段目标
    const goal = getCurrentGoal();
    const goalEl = document.getElementById('current-goal');
    if (goalEl) {
        let progressText = '';
        if (goal) {
            if (goal.id.startsWith('g') && goal.desc.includes('突破到')) {
                const targetRealm = goal.desc.replace('突破到', '').replace('期', '');
                const realmNames = ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
                const targetIdx = realmNames.findIndex(n => targetRealm.includes(n));
                if (targetIdx > -1) {
                    const need = targetIdx - gameState.realmIndex;
                    progressText = ` (当前${getRealmName()}，还需突破${need}次)`;
                }
            } else if (goal.desc.includes('招募')) {
                progressText = ` (当前${gameState.discipleCount}人)`;
            } else if (goal.desc.includes('炼丹成功')) {
                progressText = ` (当前${gameState.alchemySuccessCount || 0}次)`;
            } else if (goal.desc.includes('炼器成功')) {
                progressText = ` (当前${gameState.forgeSuccessCount || 0}次)`;
            } else if (goal.desc.includes('累计修炼')) {
                const hours = Math.floor(gameState.playTime / 3600);
                progressText = ` (当前${hours}小时)`;
            }
        }
        goalEl.textContent = goal ? `🎯 ${goal.desc}${progressText}` : '🎉 所有目标已完成！';
    }
    // 转世
    const daoGain = getRebirthDaoGain();
    const minRebirthRealm = 1;
    const canRebirth = gameState.realmIndex >= minRebirthRealm && daoGain > 0;
    const rebirthInfo = document.getElementById('rebirth-info');
    if (rebirthInfo) {
        if (gameState.realmIndex < minRebirthRealm) {
            rebirthInfo.textContent = `需达到${CONFIG.realms[minRebirthRealm].name}才能转世`;
        } else {
            const rebirthPriv = getRealmPrivilege('rebirthDao');
            const privText = rebirthPriv > 0 ? `（渡劫特权+${Math.floor(rebirthPriv*100)}%）` : '';
            rebirthInfo.innerHTML = `预计获得：<span style="color:var(--text-gold)">${daoGain}</span> 道韵${privText}<br><span style="font-size:10px;color:var(--text-muted)">累计修为${formatNumber(gameState.totalCultivation)}，转世后保留1法宝+1灵宠+半数弟子</span>`;
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
    gameState.activeFormations = (gameState.activeFormations || []).filter(f => f.endTime > now);
    let items = [];
    // 丹药Buff
    gameState.activeBuffs.forEach(b => {
        const remain = Math.ceil((b.endTime - now) / 1000);
        items.push(`<div class="buff-item"><span class="buff-name">${b.name}</span><span class="buff-time">${formatCountdown(remain)}</span></div>`);
    });
    // 阵法Buff
    gameState.activeFormations.forEach(f => {
        const formation = CONFIG.formations.find(x => x.id === f.id);
        if (formation) {
            const remain = Math.ceil((f.endTime - now) / 1000);
            items.push(`<div class="buff-item"><span class="buff-name" style="color:var(--accent-cyan)">◈${formation.name}</span><span class="buff-time">${formatCountdown(remain)}</span></div>`);
        }
    });
    if (items.length === 0) {
        container.innerHTML = '<p class="no-buff">暂无增益效果</p>';
        return;
    }
    container.innerHTML = items.join('');
}

function getUpgradeEffectAtLevel(id, level) {
    const u = CONFIG.upgrades.find(x => x.id === id);
    if (!u || level === 0) return 0;
    const btMult = getUpgradeBreakthroughMult(id);
    return u.baseEffect * level * Math.pow(u.effectMult, level) * btMult;
}

function renderUpgrades() {
    const container = document.getElementById('upgrade-list');
    container.innerHTML = '';

    // 功法卡片
    CONFIG.upgrades.forEach(function(u) {
        var lv = gameState.upgrades[u.id] || 0;
        var cost = getUpgradeCost(u.id);
        var effect = getUpgradeEffect(u.id) || 0;
        var nextEffect = getUpgradeEffectAtLevel(u.id, lv + 1) || 0;
        var unlocked = gameState.realmIndex >= u.unlockRealm;
        var canAfford = gameState.spiritStone >= cost;
        var trueMaxed = lv >= u.maxLevel;
        var realmMax = getUpgradeMaxLevel(u.id);
        var realmCapped = !trueMaxed && lv >= realmMax;
        var maxed = trueMaxed || realmCapped;
        var btCount = getUpgradeBreakthrough(u.id);
        var mastered = isUpgradeMastered(u.id);

        // 效果文本
        var effectText = '';
        if (u.effect === 'cultivation') effectText = '修为+' + formatNumber(effect) + '/s';
        else if (u.effect === 'stone') effectText = '灵石+' + formatNumber(effect) + '/s';
        else effectText = '修为+' + formatNumber(effect) + '/s 灵石+' + formatNumber(effect) + '/s';

        // 构建卡片HTML
        var html = '';
        // 头部：名称+等级
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
        html += '<span style="font-size:13px;font-weight:bold;color:var(--text-gold-light)">' + u.name;
        if (btCount > 0) html += ' <span style="color:#a855f7;font-size:9px">突' + btCount + '</span>';
        if (mastered) html += ' <span style="color:#f59e0b;font-size:9px">精</span>';
        html += '</span>';
        html += '<span style="font-size:11px;color:var(--accent-cyan);background:rgba(74,158,255,0.15);padding:1px 6px;border-radius:8px">Lv' + lv + (trueMaxed ? '满' : (realmCapped ? '/' + realmMax : '')) + '</span>';
        html += '</div>';
        // 描述
        html += '<div style="font-size:10px;color:var(--text-secondary);margin-bottom:3px;line-height:1.3">' + u.desc + '</div>';
        // 效果+花费同一行
        html += '<div style="font-size:10px;display:flex;justify-content:space-between;margin-bottom:2px">';
        html += '<span style="color:var(--success)">' + effectText + '</span>';
        if (!maxed) html += '<span style="color:var(--text-primary)">' + formatNumber(cost) + '灵石</span>';
        html += '</div>';
        // 升级预览
        if (!maxed && unlocked) {
            var delta = nextEffect - effect;
            html += '<div style="font-size:9px;color:var(--success);opacity:0.7">升级+' + formatNumber(delta) + '/s</div>';
        }
        // 境界上限提示
        if (realmCapped) {
            var nextRealm = CONFIG.realms[gameState.realmIndex + 1] ? CONFIG.realms[gameState.realmIndex + 1].name : '更高';
            html += '<div style="font-size:9px;color:var(--text-gold)">需突破' + nextRealm + '</div>';
        }
        // 解锁提示
        if (!unlocked) {
            html += '<div style="font-size:10px;color:var(--accent-red);margin-top:2px">需' + CONFIG.realms[u.unlockRealm].name + '</div>';
        }
        // 按钮区 - 2列
        var btns = [];
        if (canBreakthroughUpgrade(u.id)) {
            var btCost = getUpgradeBreakthroughCost(u.id);
            btns.push({cls:'upgrade-bt-btn', text:'突破' + formatNumber(btCost), disabled:false, bg:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff'});
        }
        if (canMasterUpgrade(u.id)) {
            var masterCost = getMasteryCost(u.id);
            btns.push({cls:'upgrade-master-btn', text:'精通' + formatNumber(masterCost), disabled:false, bg:'linear-gradient(135deg,#d97706,#f59e0b)', color:'#fff'});
        }
        if (btns.length > 0) {
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:4px">';
            btns.forEach(function(b) {
                var bg = b.bg || 'var(--bg-panel-light)';
                var color = b.color || 'var(--text-gold)';
                html += '<button class="' + (b.cls||'') + '" data-id="' + u.id + '" ' + (b.disabled?'disabled':'') + ' style="padding:3px;font-size:9px;background:' + bg + ';color:' + color + ';border:1px solid var(--border-gold);border-radius:3px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + b.text + '</button>';
            });
            html += '</div>';
        }

        var div = document.createElement('div');
        div.style.cssText = 'padding:8px;background:var(--bg-panel-light);border:1px solid rgba(139,105,20,0.3);border-radius:6px;cursor:pointer' + (!unlocked ? ';opacity:0.3;cursor:not-allowed' : (!canAfford && !maxed ? ';opacity:0.5' : ''));
        div.innerHTML = html;
        if (unlocked && !maxed) {
            div.addEventListener('click', function(){ buyUpgrade(u.id); });
        }
        div.querySelectorAll('.upgrade-bt-btn').forEach(function(btn){
            btn.addEventListener('click', function(e){ e.stopPropagation(); breakthroughUpgrade(u.id); });
        });
        div.querySelectorAll('.upgrade-master-btn').forEach(function(btn){
            btn.addEventListener('click', function(e){ e.stopPropagation(); masterUpgrade(u.id); });
        });
        container.appendChild(div);
    });

    // 激活的功法组合
    var activeSyn = getActiveUpgradeSynergies();
    if (activeSyn.length > 0) {
        var synDiv = document.createElement('div');
        synDiv.style.cssText = 'padding:6px 10px;background:var(--bg-panel-light);border:1px solid var(--border-gold);border-radius:6px;margin-top:6px';
        var synHtml = '<div style="color:var(--text-gold);font-size:11px;margin-bottom:2px">◈ 功法组合 ◈</div>';
        activeSyn.forEach(function(s){ synHtml += '<div style="font-size:10px;color:var(--text-secondary)">✨ ' + s.desc + '</div>'; });
        synDiv.innerHTML = synHtml;
        container.appendChild(synDiv);
    }
}

function renderPills() {
    const container = document.getElementById('pill-list');
    container.innerHTML = '';
    // 一键使用按钮
    const useAllBtn = document.createElement('button');
    useAllBtn.className = 'pill-btn use-all-btn';
    useAllBtn.textContent = '一键使用所有丹药';
    useAllBtn.style.cssText = 'width:100%;margin-bottom:10px;padding:8px;background:var(--bg-panel-light);border:1px solid var(--border-gold);border-radius:6px;color:var(--text-gold);cursor:pointer';
    useAllBtn.addEventListener('click', useAllPills);
    container.appendChild(useAllBtn);
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
    for (let i = 0; i < getArtifactSlots(); i++) {
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
    // 排序
    const sortBy = document.getElementById('artifact-sort')?.value || 'quality';
    let sortedArtifacts = [...gameState.artifactInventory];
    if (sortBy === 'quality') {
        sortedArtifacts.sort((a, b) => (b.qualityIndex || 0) - (a.qualityIndex || 0));
    } else if (sortBy === 'bonus') {
        sortedArtifacts.sort((a, b) => (b.bonus || 0) - (a.bonus || 0));
    } else if (sortBy === 'type') {
        sortedArtifacts.sort((a, b) => (a.typeId || '').localeCompare(b.typeId || ''));
    } else if (sortBy === 'level') {
        sortedArtifacts.sort((a, b) => (b.level || 0) - (a.level || 0));
    }
    sortedArtifacts.forEach(art => {
        const item = document.createElement('div');
        const isSelected = selectedArtifactUids.includes(art.uid);
        item.className = `artifact-inv-item quality-${art.qualityColor}` + (isSelected ? ' batch-selected' : '');
        const lvl = art.level || 0;
        const enhanceCost = Math.floor(CONFIG.artifactEnhance.costBase * Math.pow(CONFIG.artifactEnhance.costMult, lvl));
        const enhanceRate = CONFIG.artifactEnhance.successRate[lvl] || 0.2;
        let affixText = '';
        if (art.affixes && art.affixes.length > 0) {
            affixText = art.affixes.map(a => `<span class="affix-tag" style="color:${a.color}">${a.name}</span>`).join(' ');
        }
        item.title = `${art.name}${lvl > 0 ? ' +' + lvl : ''}\n效果: +${formatNumber(art.bonus)} ${art.effect === 'cultivation' ? '修为' : art.effect === 'stone' ? '灵石' : '全属性'}/秒${art.affixes && art.affixes.length > 0 ? '\n词条: ' + art.affixes.map(a => a.name).join(', ') : ''}\n左键装备 | 右键分解 | 双击强化(${enhanceRate*100}%)`;
        item.innerHTML = `<span class="inv-icon">${art.icon}</span><span class="inv-name">${art.name}${lvl > 0 ? ' +' + lvl : ''}</span>${affixText ? `<div class="inv-affixes">${affixText}</div>` : ''}${isSelected ? '<span class="batch-check">✓</span>' : ''}`;
        if (artifactBatchMode) {
            item.addEventListener('click', () => toggleArtifactSelect(art.uid));
        } else {
            item.addEventListener('click', () => {
                // 查找空槽位（null或undefined都算空）
                const slots = getArtifactSlots();
                let emptySlot = -1;
                for (let i = 0; i < slots; i++) {
                    if (!gameState.equippedArtifacts[i]) { emptySlot = i; break; }
                }
                if (emptySlot !== -1) {
                    equipArtifact(art.uid, emptySlot);
                } else {
                    showArtifactCompare(art.uid);
                }
            });
            item.addEventListener('contextmenu', (e) => { e.preventDefault(); sellArtifact(art.uid); });
            item.addEventListener('dblclick', () => { if (lvl < CONFIG.artifactEnhance.maxLevel) enhanceArtifact(art.uid); else addLog('已达最高强化等级', ''); });
        }
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
    // 成就完成率统计
    const total = CONFIG.achievements.length;
    const completed = CONFIG.achievements.filter(a => gameState.achievements[a.id]?.completed).length;
    const claimed = CONFIG.achievements.filter(a => gameState.achievements[a.id]?.claimed).length;
    const progressHtml = `
        <div class="achievement-progress-bar">
            <div class="achievement-progress-info">
                <span>成就完成率</span>
                <span>${completed}/${total}（已领取${claimed}）</span>
            </div>
            <div class="achievement-progress-track">
                <div class="achievement-progress-fill" style="width:${(completed/total*100).toFixed(0)}%"></div>
            </div>
        </div>
    `;
    container.innerHTML = progressHtml;
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
    let hasAny = false;
    for (let i = 0; i < CONFIG.saveSlotCount; i++) {
        const info = SaveManager.getSlotInfo(i);
        if (!info) continue;
        hasAny = true;
        const slot = document.createElement('div');
        slot.className = 'save-slot';
        slot.innerHTML = `
                <div class="slot-left">
                    <div class="slot-number">存档 ${i + 1}</div>
                    <div class="slot-realm">${info.realm}</div>
                    <div class="slot-info">
                        修为: ${formatNumber(info.cultivation)} · 灵石: ${formatNumber(info.spiritStone)} · 道韵: ${info.dao} · 时长: ${formatTime(info.playTime)}<br>
                        ${new Date(info.lastSave).toLocaleString()}
                    </div>
                </div>
                <div class="slot-actions">
                    <button class="slot-action-btn" data-action="load" data-slot="${i}">读取</button>
                    <button class="slot-action-btn delete" data-action="delete" data-slot="${i}">删除</button>
                </div>`;
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('slot-action-btn')) return;
            startGame(i);
        });
        container.appendChild(slot);
    }
    if (!hasAny) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px">暂无存档，请点击「新建存档」开始游戏</div>';
        // 无存档时隐藏列表，重置按钮文字
        container.classList.add('hidden');
        const loadBtn = document.getElementById('load-game-btn');
        if (loadBtn) loadBtn.textContent = '📂 读取存档';
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
    // 新游戏启动新手引导
    if (!info && !gameState.tutorialCompleted) {
        setTimeout(() => startTutorial(), 1000);
    }
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
            </div>
            ${getActiveSynergies().length > 0 ? `<div class="pet-synergy">✨ 羁绊：${getActiveSynergies().map(s => s.name).join('、')}</div>` : ''}
            ${(() => { const skill = getActivePetSkill(); return skill ? `<div class="pet-skill">⚡ 技能：${skill.name} - ${skill.desc}</div>` : ''; })()}`;
        document.getElementById('pet-upgrade-btn')?.addEventListener('click', () => upgradePet(pet.uid));
        document.getElementById('pet-feed-btn')?.addEventListener('click', feedPet);
        document.getElementById('pet-unequip-btn')?.addEventListener('click', unequipPet);
        document.getElementById('pet-release-btn')?.addEventListener('click', () => { if (confirm(`确定放生${pet.name}？将获得灵石奖励`)) releasePet(pet.uid); });
    } else {
        activeContainer.className = 'pet-active empty';
        activeContainer.innerHTML = `<div class="pet-active-icon">❓</div><div class="pet-active-name">未出战灵宠</div><div class="pet-active-info">从下方选择一只灵宠出战</div>`;
    }

    // 副灵宠槽（化神期解锁）
    const secContainer = document.getElementById('pet-secondary');
    if (secContainer) {
        const petSlots = getPetSlots();
        if (petSlots >= 2) {
            if (gameState.secondaryPet) {
                const pet = gameState.secondaryPet;
                const bonus = getPetBonus(pet);
                const quality = CONFIG.petQualities[pet.qualityIndex];
                secContainer.className = 'pet-active quality-' + pet.qualityColor;
                secContainer.style.opacity = '0.8';
                secContainer.innerHTML = `
                    <div class="pet-active-icon">${pet.icon}</div>
                    <div class="pet-active-name">副宠：${pet.name}</div>
                    <div class="pet-active-info">
                        Lv.${pet.level} | 提供50%加成<br>
                        修为+${formatNumber(bonus.cultivation * 0.5)}/秒 灵石+${formatNumber(bonus.stone * 0.5)}/秒
                    </div>
                    <div class="pet-actions">
                        <button class="pet-btn" id="pet-sec-unequip-btn">收回副宠</button>
                    </div>`;
                document.getElementById('pet-sec-unequip-btn')?.addEventListener('click', unequipSecondaryPet);
            } else {
                secContainer.className = 'pet-active empty';
                secContainer.style.opacity = '0.6';
                secContainer.innerHTML = `<div class="pet-active-icon">➕</div><div class="pet-active-name">副灵宠槽（已解锁）</div><div class="pet-active-info">从背包选择灵宠设为副宠，提供50%加成</div>`;
            }
        } else {
            secContainer.className = 'pet-active empty';
            secContainer.style.opacity = '0.4';
            secContainer.innerHTML = `<div class="pet-active-icon">🔒</div><div class="pet-active-name">副灵宠槽（未解锁）</div><div class="pet-active-info">突破至化神期解锁副灵宠槽</div>`;
        }
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
    // 排序
    const sortBy = document.getElementById('pet-sort')?.value || 'quality';
    let sortedPets = [...gameState.petInventory];
    if (sortBy === 'quality') {
        sortedPets.sort((a, b) => (b.qualityIndex || 0) - (a.qualityIndex || 0));
    } else if (sortBy === 'bonus') {
        sortedPets.sort((a, b) => {
            const ba = getPetBonus(a), bb = getPetBonus(b);
            return (bb.cultivation + bb.stone) - (ba.cultivation + ba.stone);
        });
    } else if (sortBy === 'type') {
        sortedPets.sort((a, b) => (a.typeId || '').localeCompare(b.typeId || ''));
    } else if (sortBy === 'level') {
        sortedPets.sort((a, b) => (b.level || 0) - (a.level || 0));
    }
    sortedPets.forEach(pet => {
        const item = document.createElement('div');
        const isSelected = selectedPetUids.includes(pet.uid);
        const canSecondary = getPetSlots() >= 2;
        item.className = `pet-inv-item quality-${pet.qualityColor}` + (isSelected ? ' batch-selected' : '');
        item.title = `${pet.name}\nLv.${pet.level} 好感度${pet.affection}\n点击出战，右键放生`;
        item.innerHTML = `<span class="pet-icon">${pet.icon}</span><span class="pet-name">${pet.name}</span><span class="pet-level">Lv.${pet.level}</span>${isSelected ? '<span class="batch-check">✓</span>' : ''}${canSecondary ? '<button class="pet-sec-equip-btn" style="font-size:10px;padding:1px 4px;margin-left:4px;background:var(--bg-panel-light);border:1px solid var(--border-gold);border-radius:3px;color:var(--text-gold);cursor:pointer">副宠</button>' : ''}`;
        if (petBatchMode) {
            item.addEventListener('click', () => togglePetSelect(pet.uid));
        } else {
            item.addEventListener('click', () => equipPet(pet.uid));
            item.addEventListener('contextmenu', (e) => { e.preventDefault(); if (confirm(`放生${pet.name}？获得灵石奖励`)) releasePet(pet.uid); });
        }
        item.querySelector('.pet-sec-equip-btn')?.addEventListener('click', (e) => { e.stopPropagation(); equipSecondaryPet(pet.uid); });
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
        // 与challengeDungeon一致的成功率计算（含灵宠+法宝专精加成）
        const artDungeonBonus = getArtifactDungeonBonus();
        const successBonus = getPetSkillBonus('dungeonSuccess') + artDungeonBonus.successBonus;
        const successRate = Math.min(95, Math.floor(power / d.powerReq * (1 + successBonus) * 100));
        // 预计伤害预览
        const damageRatio = Math.max(0.05, Math.min(0.4, d.powerReq / Math.max(power, 1) * 0.15));
        const dungeonHpReduction = getFormationOutingBonus('dungeonHp') + getPetSkillBonus('dungeonHp') + artDungeonBonus.hpReduction;
        const damageMult = Math.max(0.3, 1 + dungeonHpReduction);
        const estDamageSuccess = Math.floor(getMaxHp() * damageRatio * 0.5 * damageMult);
        const estDamageFail = Math.floor(getMaxHp() * damageRatio * 1.2 * damageMult);
        // 预计奖励预览（含阵法/灵宠/Buff/法宝专精加成）
        const cultBonus = getFormationOutingBonus('adventureCult') + getFormationOutingBonus('all') + getPetSkillBonus('adventureCult') + getPetSkillBonus('all');
        const stoneBonus = getFormationOutingBonus('adventureStone') + getFormationOutingBonus('all') + getPetSkillBonus('adventureStone') + getPetSkillBonus('all');
        const estCult = Math.floor(d.cultReward * (1 + gameState.realmIndex * 0.3) * (1 + cultBonus) * getBuffMultiplier('cultivation') * (1 + artDungeonBonus.rewardBonus));
        const estStone = Math.floor(d.stoneReward * (1 + gameState.realmIndex * 0.3) * (1 + stoneBonus) * getBuffMultiplier('stone') * (1 + artDungeonBonus.rewardBonus));
        const artChanceBonus = getFormationOutingBonus('artifactChance') + getFormationOutingBonus('all') + getPetSkillBonus('artifactChance') + getPetSkillBonus('all');
        const estArtChance = Math.min(100, Math.floor(d.artifactChance * (1 + artChanceBonus) * 100));

        const item = document.createElement('div');
        item.className = 'dungeon-item' + (!unlocked ? ' locked' : (cooling ? ' cooling' : ''));
        item.innerHTML = `
            <div class="dungeon-header">
                <span class="dungeon-name">${d.name}</span>
                <span class="dungeon-realm">需${CONFIG.realms[d.realmReq].name}</span>
            </div>
            <div class="dungeon-desc">${d.desc}</div>
            <div class="dungeon-info">
                <span class="dungeon-power-req">推荐战力:${formatNumber(d.powerReq)} | 成功率:${successRate}%</span>
                <span class="dungeon-reward">消耗:${formatNumber(d.cost)}灵石</span>
            </div>
            <div class="dungeon-info" style="font-size:11px;color:var(--text-muted)">
                <span>预计奖励:${formatNumber(estCult)}修为 ${formatNumber(estStone)}灵石</span>
                <span>法宝掉率:${estArtChance}%</span>
            </div>
            <div class="dungeon-info" style="font-size:11px;color:var(--text-muted)">
                <span>预计伤害:成功-${estDamageSuccess} / 失败-${estDamageFail}</span>
                <span>当前生命:${Math.floor(gameState.hp)}/${getMaxHp()}</span>
            </div>
            ${artDungeonBonus.types.length > 0 ? `<div class="dungeon-info" style="font-size:11px;color:var(--text-gold)">法宝专精:${artDungeonBonus.types.join('、')}</div>` : ''}
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
    // 预设快捷栏
    if (!gameState.formationPresets) gameState.formationPresets = [null, null];
    const presetBar = document.createElement('div');
    presetBar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;padding:8px;background:var(--bg-panel);border-radius:6px';
    for (let i = 0; i < 2; i++) {
        const presetId = gameState.formationPresets[i];
        const presetF = presetId ? CONFIG.formations.find(x => x.id === presetId) : null;
        const btn = document.createElement('button');
        btn.style.cssText = `flex:1;padding:6px;font-size:12px;background:${presetF ? 'var(--bg-panel-light)' : 'var(--bg-panel)'};color:${presetF ? 'var(--text-gold)' : 'var(--text-muted)'};border:1px solid var(--border-gold);border-radius:4px;cursor:${presetF ? 'pointer' : 'default'}`;
        btn.textContent = presetF ? `预设${i + 1}: ${presetF.icon}${presetF.name}` : `预设${i + 1}: (空)`;
        if (presetF) btn.addEventListener('click', () => loadFormationPreset(i));
        presetBar.appendChild(btn);
    }
    listContainer.appendChild(presetBar);
    CONFIG.formations.forEach(formation => {
        const canAfford = gameState.spiritStone >= formation.cost;
        const lv = getFormationLevel(formation.id);
        const lvMult = getFormationLevelMult(formation.id);
        const upCost = getFormationUpgradeCost(formation.id);
        const canUpgrade = lv < 5 && gameState.spiritStone >= upCost;
        const item = document.createElement('div');
        item.className = 'craft-item' + (!canAfford ? ' disabled' : '');
        item.innerHTML = `
            <div class="craft-header"><span class="craft-name">${formation.icon} ${formation.name} ${lv > 0 ? `<span style="color:var(--text-gold)">Lv.${lv}</span>` : ''}</span><span class="craft-rate">+${Math.floor(formation.value*lvMult*100)}%</span></div>
            <div class="craft-desc">${formation.desc}</div>
            <div class="craft-info">消耗:${formation.cost}灵石 | 持续:${Math.floor(formation.duration/60)}分钟</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="craft-btn" ${!canAfford ? 'disabled' : ''} style="flex:1;min-width:60px">布置</button>
                <button class="craft-btn formation-upgrade-btn" ${!canUpgrade ? 'disabled' : ''} style="flex:1;min-width:60px;font-size:11px">${lv >= 5 ? '已满级' : `升级`}</button>
                <button class="craft-btn preset-save-btn" data-fid="${formation.id}" style="flex:1;min-width:50px;font-size:10px;padding:4px;background:var(--bg-panel-light);color:var(--text-gold)">存预设</button>
            </div>`;
        if (canAfford) {
            item.querySelector('.craft-btn').addEventListener('click', (e) => { e.stopPropagation(); activateFormation(formation.id); });
        }
        item.querySelector('.formation-upgrade-btn')?.addEventListener('click', (e) => { e.stopPropagation(); upgradeFormation(formation.id); });
        item.querySelector('.preset-save-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const slot = confirm('保存到预设1？\n点击取消保存到预设2。') ? 0 : 1;
            saveFormationPreset(slot, formation.id);
        });
        listContainer.appendChild(item);
    });
}

// ========== 产出详情 ==========
function getProductionBreakdown() {
    const cult = getCultivationBreakdown();
    const stone = getStoneBreakdown();
    return {
        cultPerSec: cult.total,
        stonePerSec: stone.total,
        base: cult.base,
        upgrades: cult.upgradeBonus,
        artifacts: cult.artBonus,
        pets: cult.petBonus,
        realmMult: cult.realmMult,
        discipleMult: cult.discipleMult,
        daoMult: cult.daoMult,
        buffMult: cult.buffMult,
        formationMult: cult.formationMult,
        bondMult: cult.bondMult,
        titleMult: cult.titleMult,
        eventMult: cult.eventMult,
        privilegeMult: cult.privilegeMult,
        synergyMult: cult.synergyMult,
        affixMult: cult.affixMult,
        heavenlyMult: cult.heavenlyMult,
        masteryMult: cult.masteryMult,
        upgradeSynMult: cult.upgradeSynMult,
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
            <div style="display:flex;justify-content:space-between"><span>丹药Buff</span><span>×${b.buffMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>阵法倍率</span><span>×${b.formationMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>灵宠图鉴</span><span>×${b.bondMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>法宝羁绊</span><span>×${b.synergyMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>法宝词条</span><span>×${b.affixMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>功法精通</span><span>×${b.masteryMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>功法组合</span><span>×${b.upgradeSynMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>称号倍率</span><span>×${b.titleMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>天赐加成</span><span>×${b.heavenlyMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>活动倍率</span><span>×${b.eventMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>境界特权</span><span>×${b.privilegeMult.toFixed(2)}</span></div>
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
        <div style="margin-bottom:12px;padding:8px;background:var(--bg-card);border-radius:4px">
            <div style="font-size:13px;font-weight:bold;color:var(--text-gold);margin-bottom:8px">⚙️ 自动修炼</div>
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:6px">
                <span>自动突破</span>
                <button class="craft-btn" style="width:80px" id="set-autobreak">${(gameState.autoSettings && gameState.autoSettings.autoBreakthrough) ? '开启' : '关闭'}</button>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
                <span>自动用丹（双倍修为）</span>
                <button class="craft-btn" style="width:80px" id="set-autopill">${(gameState.autoSettings && gameState.autoSettings.autoUsePills) ? '开启' : '关闭'}</button>
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
    document.getElementById('set-autobreak').addEventListener('click', () => { if (!gameState.autoSettings) gameState.autoSettings = { autoBreakthrough: false, autoUsePills: false }; gameState.autoSettings.autoBreakthrough = !gameState.autoSettings.autoBreakthrough; renderSettings(); addLog('自动突破已' + (gameState.autoSettings.autoBreakthrough ? '开启' : '关闭'), 'success'); });
    document.getElementById('set-autopill').addEventListener('click', () => { if (!gameState.autoSettings) gameState.autoSettings = { autoBreakthrough: false, autoUsePills: false }; gameState.autoSettings.autoUsePills = !gameState.autoSettings.autoUsePills; renderSettings(); addLog('自动用丹已' + (gameState.autoSettings.autoUsePills ? '开启' : '关闭'), 'success'); });
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
            <div style="display:flex;justify-content:space-between"><span>秘境挑战</span><span>${gameState.dungeonCompleteCount || 0}次（成功${gameState.dungeonSuccessCount || 0}次）</span></div>
            <div style="display:flex;justify-content:space-between"><span>历练完成</span><span>${gameState.adventureCompleteCount || 0}次</span></div>
            <div style="display:flex;justify-content:space-between"><span>丹药使用</span><span>${gameState.pillsUsedCount || 0}颗</span></div>
            <div style="display:flex;justify-content:space-between"><span>法宝获得</span><span>${gameState.artifactFoundCount || 0}件</span></div>
            <div style="display:flex;justify-content:space-between"><span>天赋点</span><span>${gameState.talentPoints || 0}点可用</span></div>
            <div style="display:flex;justify-content:space-between"><span>成就完成</span><span>${gameState.claimedAchievements ? Object.keys(gameState.claimedAchievements).length : 0}/${CONFIG.achievements.length}</span></div>
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
    // 离线收益明细
    const bd = document.getElementById('offline-breakdown');
    if (bd && e.cultBreakdown) {
        bd.style.display = 'block';
        const cb = e.cultBreakdown;
        const sb = e.stoneBreakdown;
        bd.innerHTML = `
            <div style="color:var(--text-gold);margin-bottom:6px">产出明细（每秒）</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>基础+功法+法宝+灵宠</span><span>修为${formatNumber(cb.base)} / 灵石${formatNumber(sb.base)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>境界倍率</span><span>×${cb.realmMult.toFixed(2)} / ×${sb.realmMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>弟子倍率</span><span>×${cb.discipleMult.toFixed(2)} / ×${sb.discipleMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>道韵倍率</span><span>×${cb.daoMult.toFixed(2)} / ×${sb.daoMult.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>阵法倍率</span><span>×${cb.formationMult.toFixed(2)} / ×${sb.formationMult.toFixed(2)}</span></div>
            ${cb.buffMult > 1 || sb.buffMult > 1 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>丹药Buff</span><span>×${cb.buffMult.toFixed(2)} / ×${sb.buffMult.toFixed(2)}</span></div>` : ''}
            ${cb.synergyMult > 1 || sb.synergyMult > 1 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>法宝羁绊</span><span>×${cb.synergyMult.toFixed(2)} / ×${sb.synergyMult.toFixed(2)}</span></div>` : ''}
            ${cb.masteryMult > 1 || sb.masteryMult > 1 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>功法精通</span><span>×${cb.masteryMult.toFixed(2)} / ×${sb.masteryMult.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid var(--border-gold)"><span>离线效率×${e.efficiency}${e.privilege > 1 ? ' 筑基特权×' + e.privilege.toFixed(2) : ''}</span><span>修为${formatNumber(e.cultPerSec)}/秒 灵石${formatNumber(e.stonePerSec)}/秒</span></div>
        `;
    }
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

// ========== 新手引导系统 ==========
function startTutorial() {
    if (gameState.tutorialCompleted) return;
    gameState.tutorialStep = 0;
    showTutorialStep();
}

function showTutorialStep() {
    const steps = CONFIG.tutorialSteps;
    if (gameState.tutorialStep >= steps.length) {
        completeTutorial();
        return;
    }
    const step = steps[gameState.tutorialStep];
    const overlay = document.getElementById('tutorial-overlay');
    const highlight = document.getElementById('tutorial-highlight');
    const tooltip = document.getElementById('tutorial-tooltip');
    const title = document.getElementById('tutorial-title');
    const desc = document.getElementById('tutorial-desc');

    overlay.classList.remove('hidden');
    title.textContent = '第' + (gameState.tutorialStep + 1) + '/' + steps.length + '步：' + step.title;
    desc.textContent = step.desc;

    const target = document.querySelector(step.target);
    if (target) {
        const rect = target.getBoundingClientRect();
        highlight.style.display = 'block';
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        if (step.position === 'bottom') {
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 10) + 'px';
        } else {
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        }
    } else {
        highlight.style.display = 'none';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }

    const nextBtn = document.getElementById('tutorial-next');
    nextBtn.textContent = gameState.tutorialStep >= steps.length - 1 ? '完成引导' : '下一步';
}

function nextTutorialStep() {
    gameState.tutorialStep++;
    if (gameState.tutorialStep >= CONFIG.tutorialSteps.length) {
        completeTutorial();
    } else {
        showTutorialStep();
    }
}

function completeTutorial() {
    gameState.tutorialCompleted = true;
    document.getElementById('tutorial-overlay').classList.add('hidden');
    addLog('新手引导完成！', 'success');
    saveGame();
}

function skipTutorial() {
    if (confirm('确定跳过新手引导吗？可在设置中重新开启。')) {
        completeTutorial();
    }
}

function initTutorialEvents() {
    document.getElementById('tutorial-next')?.addEventListener('click', nextTutorialStep);
    document.getElementById('tutorial-skip')?.addEventListener('click', skipTutorial);
}

// ========== 天赋树渲染 ==========
function renderTalentTree() {
    const panel = document.getElementById('talent-tree-panel');
    if (!panel || !CONFIG.talentTree) return;
    const pointsEl = document.getElementById('talent-points-display');
    if (pointsEl) pointsEl.textContent = gameState.talentPoints || 0;

    let html = '';
    CONFIG.talentTree.branches.forEach(branch => {
        const talents = CONFIG.talentTree.talents.filter(t => t.branch === branch.id);
        html += `<div class="talent-branch" style="border-left:3px solid ${branch.color}">
            <div class="talent-branch-header" style="color:${branch.color}">${branch.icon} ${branch.name}</div>
            <div class="talent-list">`;
        talents.forEach(t => {
            const lv = getTalentLevel(t.id);
            const maxed = lv >= t.maxLevel;
            const canLearn = canLearnTalent(t.id);
            const preMet = !t.prerequisite || getTalentLevel(t.prerequisite) > 0;
            const effectText = typeof t.value === 'number' ? `+${(t.value * 100).toFixed(0)}%` : t.value;
            html += `<div class="talent-card ${maxed ? 'maxed' : ''} ${!preMet ? 'locked' : ''}">
                <div class="talent-card-header">
                    <span class="talent-icon">${t.icon}</span>
                    <span class="talent-name">${t.name}</span>
                    <span class="talent-level">${lv}/${t.maxLevel}</span>
                </div>
                <div class="talent-desc">${t.desc}（每级${effectText}）</div>
                <div class="talent-footer">
                    <span class="talent-cost">消耗${t.cost}点</span>
                    ${maxed ? '<span class="talent-maxed">已满级</span>' :
                      `<button class="talent-learn-btn" data-talent="${t.id}" ${!canLearn ? 'disabled' : ''}>学习</button>`}
                </div>
            </div>`;
        });
        html += `</div></div>`;
    });
    panel.innerHTML = html;

    // 绑定学习按钮
    panel.querySelectorAll('.talent-learn-btn').forEach(btn => {
        btn.addEventListener('click', () => learnTalent(btn.dataset.talent));
    });
}

function switchHelpTab(tab) {
    document.querySelectorAll('.help-tab').forEach(b => b.classList.toggle('active', b.dataset.help === tab));
    document.getElementById('help-content').innerHTML = HELP_CONTENTS[tab] || '<p>暂无说明</p>';
}

// ========== 通知系统 ==========
let notificationTimer = null;

function showNotification(text, icon = '🔔', duration = 5000) {
    const bar = document.getElementById('notification-bar');
    const textEl = document.getElementById('notification-text');
    const iconEl = document.getElementById('notification-icon');
    if (!bar || !textEl) return;
    textEl.textContent = text;
    iconEl.textContent = icon;
    bar.classList.remove('hidden');
    bar.classList.add('notification-show');
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
        bar.classList.add('hidden');
        bar.classList.remove('notification-show');
    }, duration);
}

function checkNotifications() {
    if (!gameState.notificationSettings) return;
    const now = Date.now();
    const cooldown = 30000; // 同类通知最小间隔30秒

    // 可以突破通知
    if (gameState.notificationSettings.breakthroughReady) {
        const cost = getBreakthroughCost();
        if (gameState.cultivation >= cost) {
            const key = 'breakthroughReady';
            if (!gameState.lastNotificationTime[key] || now - gameState.lastNotificationTime[key] > cooldown) {
                showNotification('修为已满，可以突破境界！', '⬆️');
                gameState.lastNotificationTime[key] = now;
            }
        }
    }

    // 历练完成通知
    if (gameState.notificationSettings.adventureComplete && gameState.adventure) {
        const prog = getAdventureProgress();
        if (prog && prog.remaining <= 0) {
            const key = 'adventureComplete';
            if (!gameState.lastNotificationTime[key] || now - gameState.lastNotificationTime[key] > cooldown) {
                showNotification('历练已完成，快去领取奖励！', '🗺️');
                gameState.lastNotificationTime[key] = now;
            }
        }
    }

    // 生命值过低通知
    if (gameState.notificationSettings.lowHp) {
        const maxHp = getMaxHp();
        if (gameState.hp < maxHp * 0.2) {
            const key = 'lowHp';
            if (!gameState.lastNotificationTime[key] || now - gameState.lastNotificationTime[key] > cooldown) {
                showNotification('生命值过低，建议使用回春丹或等待恢复！', '❤️');
                gameState.lastNotificationTime[key] = now;
            }
        }
    }
}

// 通知栏关闭按钮
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('notification-bar').classList.add('hidden');
            if (notificationTimer) clearTimeout(notificationTimer);
        });
    }
});
