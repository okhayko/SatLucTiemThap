/**
 * Module cô lập dữ liệu
 * Cung cấp khả năng cô lập localStorage và IndexedDB cho các chế độ trò chơi khác nhau
 * * @author Tái cấu trúc từ mã lặp lại của game.html và game-bhz.html
 * @version 1.0.0
 */

/**
 * Khởi tạo cô lập dữ liệu
 * @param {Object} config - Đối tượng cấu hình
 * @param {string} config.prefix - Tiền tố khóa localStorage (Ví dụ: 'game_' hoặc 'bhz_')
 * @param {string} config.dbName - Tên cơ sở dữ liệu IndexedDB (Ví dụ: 'game_xiuxian_dlc_db')
 * @param {string} config.vectorDbName - Tên cơ sở dữ liệu Vector (Ví dụ: 'game_VectorDB')
 * @param {string} [config.dlcFile] - Tên tệp cấu hình DLC (tùy chọn)
 * @returns {Object} Trả về đối tượng cấu hình chứa thông tin tên DB, v.v.
 */
window.initDataIsolation = function(config) {
    const { prefix, dbName, vectorDbName, dlcFile } = config;
    
    console.log(`[Cô lập dữ liệu] Khởi tạo - Tiền tố: ${prefix}, DB: ${dbName}`);
    
    // ============================================================
    // Cô lập dữ liệu localStorage
    // ============================================================
    
    // Lưu lại các phương thức localStorage gốc
    const originalLocalStorage = {
        getItem: Storage.prototype.getItem,
        setItem: Storage.prototype.setItem,
        removeItem: Storage.prototype.removeItem,
        clear: Storage.prototype.clear,
        key: Storage.prototype.key
    };
    
    // Ghi đè localStorage.getItem, thêm tiền tố vào khóa
    Storage.prototype.getItem = function(key) {
        // Các khóa đặc biệt không thêm tiền tố (dùng cho cấu hình chia sẻ giữa các game)
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.getItem.call(this, key);
        }
        const prefixedKey = prefix + key;
        const value = originalLocalStorage.getItem.call(this, prefixedKey);
        console.debug(`[localStorage GET] ${key} → ${prefixedKey}`, value ? '✅ Tồn tại' : '❌ Không tồn tại');
        return value;
    };
    
    // Ghi đè localStorage.setItem, thêm tiền tố vào khóa
    Storage.prototype.setItem = function(key, value) {
        // Các khóa đặc biệt không thêm tiền tố
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.setItem.call(this, key, value);
        }
        const prefixedKey = prefix + key;
        console.debug(`[localStorage SET] ${key} → ${prefixedKey}`, typeof value === 'string' ? value.substring(0, 50) : value);
        return originalLocalStorage.setItem.call(this, prefixedKey, value);
    };
    
    // Ghi đè localStorage.removeItem, thêm tiền tố vào khóa
    Storage.prototype.removeItem = function(key) {
        if (key === 'sharedAPIConfig' || key === 'sharedExtraAPIConfig') {
            return originalLocalStorage.removeItem.call(this, key);
        }
        const prefixedKey = prefix + key;
        console.debug(`[localStorage REMOVE] ${key} → ${prefixedKey}`);
        return originalLocalStorage.removeItem.call(this, prefixedKey);
    };
    
    // Ghi đè localStorage.clear (chỉ xóa các khóa có tiền tố tương ứng)
    Storage.prototype.clear = function() {
        console.warn(`[localStorage CLEAR] Xóa tất cả các khóa có tiền tố ${prefix}`);
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = originalLocalStorage.key.call(this, i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => originalLocalStorage.removeItem.call(this, key));
        console.log(`[localStorage CLEAR] Đã xóa ${keysToRemove.length} khóa`);
    };
    
    // Ghi đè localStorage.key (chỉ trả về các khóa có tiền tố tương ứng)
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
    
    // Ghi đè thuộc tính length (chỉ tính các khóa có tiền tố tương ứng)
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
    
    console.log(`✅ [Cô lập dữ liệu] Đã kích hoạt cô lập localStorage - Tiền tố: ${prefix}`);
    
    // ============================================================
    // Trả về đối tượng cấu hình
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
    
    // Lưu vào biến toàn cục để các module khác sử dụng
    window.dataIsolationConfig = isolationConfig;
    
    console.log(`✅ [Cô lập dữ liệu] Khởi tạo hoàn tất`, isolationConfig);
    
    return isolationConfig;
};

/**
 * Khôi phục các phương thức localStorage gốc (dùng để debug hoặc trong cảnh đặc biệt)
 */
window.restoreOriginalLocalStorage = function() {
    if (!window.dataIsolationConfig || !window.dataIsolationConfig.originalLocalStorage) {
        console.warn('[Cô lập dữ liệu] Không thể khôi phục: Không tìm thấy phương thức localStorage gốc');
        return false;
    }
    
    const original = window.dataIsolationConfig.originalLocalStorage;
    Storage.prototype.getItem = original.getItem;
    Storage.prototype.setItem = original.setItem;
    Storage.prototype.removeItem = original.removeItem;
    Storage.prototype.clear = original.clear;
    Storage.prototype.key = original.key;
    
    console.log('✅ [Cô lập dữ liệu] Đã khôi phục các phương thức localStorage gốc');
    return true;
};

/**
 * Lấy tất cả các khóa localStorage hiện tại có tiền tố cô lập
 */
window.getIsolatedKeys = function() {
    if (!window.dataIsolationConfig) {
        console.warn('[Cô lập dữ liệu] Chưa khởi tạo');
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

console.log('📦 [Module Load] data-isolation.js đã được tải');
