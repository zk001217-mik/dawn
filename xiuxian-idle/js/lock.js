/**
 * lock.js - 锁屏与设置模块
 * 包含：锁屏/解锁、密码设置、自动锁屏计时、用户活动检测、设置弹窗
 */

// ========== 锁屏功能 ==========
let isLocked = false;
let autoLockTimer = null;
let lastActivityTime = Date.now();
const LOCK_STORAGE_KEY = 'xiuxian_screen_locked';

function lockScreen() {
    if (!gameState.settings.lockPassword) {
        alert('请先在底部『设置』中设置锁屏密码');
        return;
    }
    isLocked = true;
    sessionStorage.setItem(LOCK_STORAGE_KEY, '1');
    document.getElementById('lock-screen').classList.remove('hidden');
    document.getElementById('lock-password-input').value = '';
    document.getElementById('lock-error').classList.add('hidden');
    // 延迟聚焦，避免动画期间输入
    setTimeout(() => document.getElementById('lock-password-input').focus(), 300);
    addLog('已锁屏，游戏继续后台挂机', '');
}

function unlockScreen() {
    const input = document.getElementById('lock-password-input');
    const errorEl = document.getElementById('lock-error');
    if (input.value === gameState.settings.lockPassword) {
        isLocked = false;
        sessionStorage.removeItem(LOCK_STORAGE_KEY);
        document.getElementById('lock-screen').classList.add('hidden');
        input.value = '';
        errorEl.classList.add('hidden');
        lastActivityTime = Date.now();
        resetAutoLockTimer();
        addLog('已解锁', 'success');
        updateFullUI();
    } else {
        errorEl.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

/**
 * 页面加载时检查是否需要恢复锁屏状态
 * 刷新页面后如果之前处于锁屏状态，则自动重新锁屏
 */
function checkLockOnLoad() {
    if (sessionStorage.getItem(LOCK_STORAGE_KEY) === '1' && gameState.settings.lockPassword) {
        isLocked = true;
        document.getElementById('lock-screen').classList.remove('hidden');
        document.getElementById('lock-password-input').value = '';
        setTimeout(() => document.getElementById('lock-password-input').focus(), 300);
        addLog('检测到刷新，已恢复锁屏状态', '');
    }
}

function setLockPassword(newPwd) {
    gameState.settings.lockPassword = newPwd || '';
    saveGame();
}

function resetAutoLockTimer() {
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }
    const minutes = gameState.settings.autoLockMinutes || 0;
    if (minutes > 0 && gameStarted && !isLocked) {
        autoLockTimer = setTimeout(() => {
            if (!isLocked && gameState.settings.lockPassword) {
                lockScreen();
            }
        }, minutes * 60 * 1000);
    }
}

// 用户活动时重置自动锁屏计时
function onUserActivity() {
    lastActivityTime = Date.now();
    if (!isLocked) resetAutoLockTimer();
}

// ========== 设置弹窗 ==========
function openSettingsModal() {
    renderSettings();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

