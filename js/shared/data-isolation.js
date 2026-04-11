/**
 * 数据隔离模块
 * 为不同游戏模式提供localStorage和IndexedDB隔离
 * 
 * @author 重构自game.html和game-bhz.html的重复代码
 * @version 1.0.0
 */

/**
 * 初始化数据隔离
 * @param {Object} config - 配置对象
 * @param {string} config.prefix - localStorage键前缀 (例如: 'game_' 或 'bhz_')
 * @param {string} config.dbName - IndexedDB数据库名 (例如: 'game_xiuxian_dlc_db')
 * @param {string} config.vectorDbName - 向量数据库名 (例如: 'game_VectorDB')
 * @param {string} [config.dlcFile] - DLC配置文件名 (可选)
 * @returns {Object} 返回配置对象,包含数据库名称等信息
 */
window.initDataIsolation = function(config) {
    const { prefix, dbName, vectorDbName, dlcFile } = config;
    
    console.log(`[数据隔离] 初始化 - 前缀: ${prefix}, DB: ${dbName}`);
    
    // ============================================================
    // localStorage 数据隔离
    // ============================================================
    
    // 保存原始localStorage方法
    const originalLocalStorage = {
        getItem: Storage.prototype.getItem,
        setItem: Storage.prototype.setItem,
        removeItem: Storage.prototype.removeItem,
        clear: Storage.prototype.clear,
        key: Storage.prototype.key
    };
    
    // 重写localStorage.getItem，添加前缀
    Storage.prototype.getItem = function(key) {
        // 特殊键不添加前缀（用于跨游戏共享的配置）
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.getItem.call(this, key);
        }
        const prefixedKey = prefix + key;
        const value = originalLocalStorage.getItem.call(this, prefixedKey);
        console.debug(`[localStorage GET] ${key} → ${prefixedKey}`, value ? '✅ 存在' : '❌ 不存在');
        return value;
    };
    
    // 重写localStorage.setItem，添加前缀
    Storage.prototype.setItem = function(key, value) {
        // 特殊键不添加前缀
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.setItem.call(this, key, value);
        }
        const prefixedKey = prefix + key;
        console.debug(`[localStorage SET] ${key} → ${prefixedKey}`, typeof value === 'string' ? value.substring(0, 50) : value);
        return originalLocalStorage.setItem.call(this, prefixedKey, value);
    };
    
    // 重写localStorage.removeItem，添加前缀
    Storage.prototype.removeItem = function(key) {
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.removeItem.call(this, key);
        }
        const prefixedKey = prefix + key;
        console.debug(`[localStorage REMOVE] ${key} → ${prefixedKey}`);
        return originalLocalStorage.removeItem.call(this, prefixedKey);
    };
    
    // 重写localStorage.clear（只清除带前缀的键）
    Storage.prototype.clear = function() {
        console.warn(`[localStorage CLEAR] 清除所有 ${prefix} 前缀的键`);
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = originalLocalStorage.key.call(this, i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => originalLocalStorage.removeItem.call(this, key));
        console.log(`[localStorage CLEAR] 已清除 ${keysToRemove.length} 个键`);
    };
    
    // 重写localStorage.key（只返回带前缀的键）
    Storage.prototype.key = function(index) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = originalLocalStorage.key.call(this, i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys[index] || null;
    };
    
    // 重写length属性（只计算带前缀的键）
    Object.defineProperty(Storage.prototype, 'length', {
        get: function() {
            let count = 0;
            for (let i = 0; i < originalLocalStorage.length; i++) {
                const key = originalLocalStorage.key.call(this, i);
                if (key && key.startsWith(prefix)) {
                    count++;
                }
            }
            return count;
        }
    });
    
    console.log(`✅ [数据隔离] localStorage隔离已启用 - 前缀: ${prefix}`);
    
    // ============================================================
    // 返回配置对象
    // ============================================================
    
    const isolationConfig = {
        prefix: prefix,
        DB_NAME: dbName,
        VECTOR_DB_NAME: vectorDbName,
        originalLocalStorage: originalLocalStorage
    };
    
    if (dlcFile) {
        isolationConfig.dlcFile = dlcFile;
    }
    
    // 存储到全局变量，供其他模块使用
    window.dataIsolationConfig = isolationConfig;
    
    console.log(`✅ [数据隔离] 初始化完成`, isolationConfig);
    
    return isolationConfig;
};

/**
 * 恢复原始localStorage方法（用于调试或特殊场景）
 */
window.restoreOriginalLocalStorage = function() {
    if (!window.dataIsolationConfig || !window.dataIsolationConfig.originalLocalStorage) {
        console.warn('[数据隔离] 无法恢复：未找到原始localStorage方法');
        return false;
    }
    
    const original = window.dataIsolationConfig.originalLocalStorage;
    Storage.prototype.getItem = original.getItem;
    Storage.prototype.setItem = original.setItem;
    Storage.prototype.removeItem = original.removeItem;
    Storage.prototype.clear = original.clear;
    Storage.prototype.key = original.key;
    
    console.log('✅ [数据隔离] 已恢复原始localStorage方法');
    return true;
};

/**
 * 获取当前所有带前缀的localStorage键
 */
window.getIsolatedKeys = function() {
    if (!window.dataIsolationConfig) {
        console.warn('[数据隔离] 未初始化');
        return [];
    }
    
    const prefix = window.dataIsolationConfig.prefix;
    const original = window.dataIsolationConfig.originalLocalStorage;
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = original.key.call(localStorage, i);
        if (key && key.startsWith(prefix)) {
            keys.push(key);
        }
    }
    
    return keys;
};

console.log('📦 [模块加载] data-isolation.js 已加载');
