/**
 * storage.js - 存档与数据持久化模块
 * 包含：保存游戏、加载游戏、重置游戏、离线收益计算、
 *       存档导入/导出、多存档槽位管理
 */

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
        if (!gameState.equippedArtifacts || !Array.isArray(gameState.equippedArtifacts)) gameState.equippedArtifacts = [];
        const targetSlots = getArtifactSlots();
        while (gameState.equippedArtifacts.length < targetSlots) gameState.equippedArtifacts.push(null);
        if (gameState.equippedArtifacts.length > targetSlots) gameState.equippedArtifacts = gameState.equippedArtifacts.slice(0, targetSlots);
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
    // 筑基期特权：离线收益+10%
    const offlinePrivilege = 1 + getRealmPrivilege('offline');
    return {
        seconds: offlineSeconds,
        cultivation: getCultivationPerSecond() * offlineSeconds * eff * offlinePrivilege,
        stones: getStonePerSecond() * offlineSeconds * eff * offlinePrivilege,
    };
}

function applyOfflineEarnings(e) {
    gameState.cultivation += e.cultivation;
    gameState.spiritStone += e.stones;
    gameState.totalCultivation += e.cultivation;
    addLog(`闭关 ${formatDuration(e.seconds)}，获得 ${formatNumber(e.cultivation)} 修为，${formatNumber(e.stones)} 灵石`, 'success');
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
            if (!gameState.equippedArtifacts || !Array.isArray(gameState.equippedArtifacts)) gameState.equippedArtifacts = [];
        const targetSlots = getArtifactSlots();
        while (gameState.equippedArtifacts.length < targetSlots) gameState.equippedArtifacts.push(null);
        if (gameState.equippedArtifacts.length > targetSlots) gameState.equippedArtifacts = gameState.equippedArtifacts.slice(0, targetSlots);
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
        if (!gameState.equippedArtifacts || !Array.isArray(gameState.equippedArtifacts)) gameState.equippedArtifacts = [];
        const targetSlots = getArtifactSlots();
        while (gameState.equippedArtifacts.length < targetSlots) gameState.equippedArtifacts.push(null);
        if (gameState.equippedArtifacts.length > targetSlots) gameState.equippedArtifacts = gameState.equippedArtifacts.slice(0, targetSlots);
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
        if (gameState.alchemyBatchSize === undefined) gameState.alchemyBatchSize = 1;
        if (!gameState.alchemyCooldownEnd) gameState.alchemyCooldownEnd = 0;
        if (gameState.forgeBatchSize === undefined) gameState.forgeBatchSize = 1;
        if (!gameState.forgeCooldownEnd) gameState.forgeCooldownEnd = 0;
        if (!gameState.forgeCooldowns) gameState.forgeCooldowns = {};
        if (!gameState.activeFormations) gameState.activeFormations = [];
        if (!gameState.heavenlyUsed) gameState.heavenlyUsed = {};
        if (!gameState.heavenlyBonus) gameState.heavenlyBonus = { cultivation: 0, stone: 0, bothMult: 0 };
        if (!gameState.petCollection) gameState.petCollection = {};
        if (gameState.alchemySuccessCount === undefined) gameState.alchemySuccessCount = 0;
        if (gameState.alchemyFailCount === undefined) gameState.alchemyFailCount = 0;
        if (gameState.forgeSuccessCount === undefined) gameState.forgeSuccessCount = 0;
        if (gameState.forgeFailCount === undefined) gameState.forgeFailCount = 0;
        if (gameState.discipleAssign === undefined) gameState.discipleAssign = { alchemy: 0, forge: 0, farm: 0, patrol: 0 };
        if (gameState.pillTolerance === undefined) gameState.pillTolerance = {};
        if (gameState.formationLevels === undefined) gameState.formationLevels = {};
        if (gameState.enlightenmentCooldown === undefined) gameState.enlightenmentCooldown = 0;
        if (gameState.secondaryPet === undefined) gameState.secondaryPet = null;
        if (gameState.totalStoneEarned === undefined) gameState.totalStoneEarned = 0;
        if (gameState.totalFormations === undefined) gameState.totalFormations = 0;
        if (gameState.currentGoalIndex === undefined) gameState.currentGoalIndex = 0;
        if (!gameState.completedGoals) gameState.completedGoals = [];
        if (!gameState.unlockedTitles) gameState.unlockedTitles = [];
        if (!gameState.currentTitle) gameState.currentTitle = '';
        if (gameState.achievementPoints === undefined) gameState.achievementPoints = 0;
        if (!gameState.settings) gameState.settings = { soundEnabled: true, autoSaveInterval: 30, numberFormat: 'short', showFloatingText: true, lockPassword: '', autoLockMinutes: 0 };
        if (gameState.settings.lockPassword === undefined) gameState.settings.lockPassword = '';
        if (gameState.settings.autoLockMinutes === undefined) gameState.settings.autoLockMinutes = 0;
        if (!gameState.lastCooldownState) gameState.lastCooldownState = {};
        if (!gameState.nextEventTime) gameState.nextEventTime = 0;
        if (!gameState.eventQueue) gameState.eventQueue = [];
        if (gameState.eventCountToday === undefined) gameState.eventCountToday = 0;
        if (!gameState.lastEventDate) gameState.lastEventDate = getTodayStr();
        if (!gameState.pillDailyUsage) gameState.pillDailyUsage = {};
        if (!gameState.enhancedDailyUsage) gameState.enhancedDailyUsage = {};
        if (!gameState.lastPillResetDate) gameState.lastPillResetDate = getTodayStr();
        if (gameState.hp === undefined) gameState.hp = 100;
        if (gameState.maxHp === undefined) gameState.maxHp = 100;
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

