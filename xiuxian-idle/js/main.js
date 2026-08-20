/**
 * main.js - 游戏入口与主循环模块
 * 包含：游戏初始化(事件绑定/存档加载/UI渲染)、gameTick主循环、
 *       定时保存、奇遇事件检测
 */

// ========== 游戏主循环 ==========
let lastTickTime = Date.now();

// ========== 初始化 ==========
let gameStarted = false;

function init() {
    // 全局错误处理：出错时自动备份存档
    window.addEventListener('error', (e) => {
        console.error('游戏错误:', e.error || e.message);
        try {
            if (gameStarted && gameState) {
                const backupKey = 'xiuxian_idle_backup_' + Date.now();
                localStorage.setItem(backupKey, JSON.stringify(gameState));
                console.log('已自动备份存档到:', backupKey);
            }
        } catch (err) {
            console.error('备份存档失败:', err);
        }
    });

    initAudio();
    // 显示启动界面
    renderSaveSlots();
    // 有存档则直接展开列表
    const slotsEl = document.getElementById('save-slots');
    const hasSave = Array.from({ length: CONFIG.saveSlotCount }, (_, i) => SaveManager.getSlotInfo(i)).some(Boolean);
    if (hasSave) {
        slotsEl.classList.remove('hidden');
        document.getElementById('load-game-btn').textContent = '📂 收起存档';
    }

    // 新建存档按钮
    document.getElementById('new-game-btn').addEventListener('click', () => {
        // 找第一个空槽位
        let emptySlot = -1;
        for (let i = 0; i < CONFIG.saveSlotCount; i++) {
            if (!SaveManager.getSlotInfo(i)) { emptySlot = i; break; }
        }
        if (emptySlot === -1) {
            alert('存档位已满，请先删除一个存档再新建。');
            slotsEl.classList.remove('hidden');
            renderSaveSlots();
        } else {
            startGame(emptySlot);
        }
    });

    // 读取存档按钮（折叠/展开切换）
    document.getElementById('load-game-btn').addEventListener('click', () => {
        const isHidden = slotsEl.classList.toggle('hidden');
        document.getElementById('load-game-btn').textContent = isHidden ? '📂 读取存档' : '📂 收起存档';
        if (!isHidden) renderSaveSlots();
    });

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
    // 打坐冥想功能已移除
    // document.getElementById('meditate-btn').addEventListener('click', meditate);
    document.getElementById('breakthrough-btn').addEventListener('click', breakthrough);
    document.getElementById('recruit-btn').addEventListener('click', recruitDisciple);
    // 弟子分工
    document.querySelectorAll('.assign-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => assignDisciple(btn.dataset.type));
    });
    document.querySelectorAll('.assign-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => unassignDisciple(btn.dataset.type));
    });
    // 可折叠面板
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('collapsed');
        });
    });
    document.getElementById('rebirth-btn').addEventListener('click', rebirth);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('claim-all-ach-btn')?.addEventListener('click', claimAllAchievements);
    document.getElementById('artifact-sort')?.addEventListener('change', () => updateUI());
    document.getElementById('pet-sort')?.addEventListener('change', () => updateUI());
    document.getElementById('artifact-batch-btn')?.addEventListener('click', toggleArtifactBatch);
    document.getElementById('artifact-auto-equip-btn')?.addEventListener('click', autoEquipArtifacts);
    document.getElementById('artifact-decompose-btn')?.addEventListener('click', batchDecomposeArtifacts);
    document.getElementById('artifact-cancel-btn')?.addEventListener('click', toggleArtifactBatch);
    document.getElementById('pet-batch-btn')?.addEventListener('click', togglePetBatch);
    document.getElementById('pet-release-btn')?.addEventListener('click', batchReleasePets);
    document.getElementById('pet-cancel-btn')?.addEventListener('click', togglePetBatch);
    document.getElementById('export-btn').addEventListener('click', exportSave);
    document.getElementById('sound-btn').addEventListener('click', toggleSound);
    document.getElementById('lock-btn').addEventListener('click', lockScreen);
    document.getElementById('unlock-btn').addEventListener('click', unlockScreen);
    document.getElementById('lock-password-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); unlockScreen(); }
    });
    document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('close-settings-btn').addEventListener('click', closeSettingsModal);
    // 玩法说明
    document.getElementById('help-btn')?.addEventListener('click', showHelpModal);
    document.getElementById('close-help-btn')?.addEventListener('click', closeHelpModal);
    document.querySelectorAll('.help-tab').forEach(tab => {
        tab.addEventListener('click', () => switchHelpTab(tab.dataset.help));
    });
    document.getElementById('close-checkin-btn')?.addEventListener('click', () => {
        document.getElementById('checkin-modal').classList.add('hidden');
    });
    document.getElementById('power-display')?.addEventListener('click', showPowerModal);
    document.getElementById('close-power-btn')?.addEventListener('click', () => {
        document.getElementById('power-modal').classList.add('hidden');
    });
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => {
        if (e.target.files[0]) importSave(e.target.files[0]);
        e.target.value = '';
    });
    
    // 标签页切换
    document.querySelectorAll('.center-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 产出详情
    document.getElementById('detail-btn')?.addEventListener('click', showProductionDetails);
    document.getElementById('cultivation-rate')?.addEventListener('click', showProductionDetails);
    document.getElementById('spirit-stone-rate')?.addEventListener('click', showProductionDetails);
    document.getElementById('center-cult-rate')?.addEventListener('click', showProductionDetails);
    document.getElementById('center-stone-rate')?.addEventListener('click', showProductionDetails);

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
        // 打坐冥想已移除，空格键不再触发
    });

    // 用户活动追踪（用于自动锁屏）
    ['click', 'mousemove', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, onUserActivity, { passive: true });
    });

    // 游戏循环（但只在游戏开始后更新UI）
    setInterval(gameTick, 100);
    setInterval(() => { if (gameStarted) saveGame(); }, CONFIG.autoSaveInterval);
    window.addEventListener('beforeunload', () => { if (gameStarted) saveGame(); });

    updateSoundButton();
    initTutorialEvents();
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

    // 血量自动恢复
    const maxHp = getMaxHp();
    if (gameState.hp < maxHp) {
        gameState.hp = Math.min(maxHp, gameState.hp + getHpRegenRate() * delta);
    }

    if (gameState.adventure) {
        const prog = getAdventureProgress();
        if (prog && prog.remaining <= 0) completeAdventure();
    }

    // 自动突破
    if (gameState.autoSettings && gameState.autoSettings.autoBreakthrough) {
        const cost = getBreakthroughCost();
        if (gameState.cultivation >= cost && !document.getElementById('breakthrough-modal')?.classList.contains('hidden') === false) {
            breakthrough();
        }
    }

    // 自动使用丹药（双倍修为丹）
    if (gameState.autoSettings && gameState.autoSettings.autoUsePills) {
        const hasCultBuff = gameState.activeBuffs.some(b => b.type === 'buff_cult');
        if (!hasCultBuff && getPillCount('double_cult') > 0) {
            usePill('double_cult');
        }
    }

    if (Math.floor(gameState.playTime) % 5 === 0) checkAchievements();
    checkRandomEvent();
    checkCooldownNotifications();
    checkFormationExpiry();
    updateStageGoal();
    checkTitles();
    checkNotifications();
    if (!isLocked) updateFastUI();
    updateTabDots();
}

init();
