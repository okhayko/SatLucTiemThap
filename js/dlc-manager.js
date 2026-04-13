/**
 * Trình quản lý DLC - Module chức năng cốt lõi
 * Chịu trách nhiệm tạo, quản lý, lưu trữ và kích hoạt các gói kiến thức DLC
 */

class DLCManager {
    constructor() {
        this.dlcPackages = [];
        this.activatedDLCs = new Set();
        // Sử dụng tên cơ sở dữ liệu khác nhau dựa trên cấu hình trò chơi
        // game-bhz.html sử dụng BHZ_CONFIG, game.html sử dụng GAME_CONFIG
        const config = window.BHZ_CONFIG || window.GAME_CONFIG || {};
        this.dbName = config.DB_NAME || 'xiuxian_dlc_db';
        this.dbVersion = 1;
        this.storeName = 'dlc_packages';
        this.db = null;
        console.log('[DLCManager] Sử dụng cơ sở dữ liệu:', this.dbName);
    }

    /**
     * Khởi tạo cơ sở dữ liệu IndexedDB
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Mở cơ sở dữ liệu DLC thất bại:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Mở cơ sở dữ liệu DLC thành công');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('activated', 'activated', { unique: false });
                    console.log('Tạo object store cho cơ sở dữ liệu DLC thành công');
                }
            };
        });
    }

    /**
     * Tải tất cả các gói DLC từ IndexedDB
     */
    async loadAllDLCs() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.dlcPackages = request.result || [];
                this.activatedDLCs.clear();
                this.dlcPackages.forEach(dlc => {
                    if (dlc.activated) {
                        this.activatedDLCs.add(dlc.id);
                    }
                });
                console.log(`[DLCManager] Đã tải ${this.dlcPackages.length} gói DLC`);
                resolve(this.dlcPackages);
            };
            
            request.onerror = () => {
                console.error('Tải gói DLC thất bại:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Tạo gói DLC mới
     */
    createDLC(name, description, knowledgeItems) {
        const dlc = {
            id: 'dlc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            description: description,
            knowledgeItems: knowledgeItems || [],
            activated: false,
            createdAt: new Date().toISOString(),
            version: '1.0',
            source: 'user_created'
        };
        
        this.dlcPackages.push(dlc);
        console.log(`[DLCManager] Tạo gói DLC: ${name} (${dlc.id})`);
        return dlc;
    }

    /**
     * Lấy danh sách DLC
     */
    getDLCList() {
        return [...this.dlcPackages];
    }

    /**
     * Lấy danh sách các DLC đã kích hoạt
     */
    getActivatedDLCs() {
        return this.dlcPackages.filter(dlc => dlc.activated);
    }

    /**
     * Kích hoạt gói DLC
     */
    async activateDLC(dlcId) {
        const dlc = this.dlcPackages.find(d => d.id === dlcId);
        if (!dlc) {
            throw new Error('Gói DLC không tồn tại');
        }
        
        if (dlc.activated) {
            console.log(`[DLCManager] DLC ${dlc.name} đã được kích hoạt`);
            return;
        }
        
        dlc.activated = true;
        this.activatedDLCs.add(dlcId);
        
        // Thêm kiến thức DLC vào kho kiến thức (Knowledge Base)
        if (window.contextVectorManager) {
            console.log(`[DLCManager] Bắt đầu thêm kiến thức DLC vào kho lưu trữ vector, DLC chứa ${dlc.knowledgeItems.length} mục kiến thức`);
            for (const item of dlc.knowledgeItems) {
                console.log(`[DLCManager] Thêm mục kiến thức: ${item.title} (ID: ${item.id})`);
                
                // Tạo đối tượng mục kiến thức
                const knowledgeItem = {
                    id: item.id,
                    title: item.title,
                    content: item.content,
                    category: item.category || 'dlc',
                    tags: item.tags || [],
                    alwaysInclude: item.alwaysInclude || false, // Giữ nguyên thiết lập kiến thức thường trực
                    priority: item.priority || 'medium', // Giữ nguyên thiết lập ưu tiên
                    vector: null, // Vector sẽ xử lý sau
                    vectorType: item.vectorType || 'sparse', // Giữ nguyên loại vector
                    source: 'dlc',
                    dlcId: dlcId,
                    createdAt: new Date().toISOString()
                };
                
                // Nếu mục kiến thức đã có vector, sử dụng trực tiếp
                if (item.vector) {
                    knowledgeItem.vector = item.vector;
                    knowledgeItem.vectorType = item.vectorType;
                    knowledgeItem.vectorizedAt = item.vectorizedAt;
                    knowledgeItem.vectorMethod = item.vectorMethod;
                    console.log(`[DLCManager] ${item.title}: Sử dụng vector có sẵn (${knowledgeItem.vectorType})`);
                } else {
                    // Tạo vector dựa trên phương pháp hiện tại
                    try {
                        if (window.contextVectorManager.embeddingMethod === 'transformers') {
                            // Sử dụng mô hình trình duyệt để tạo vector dày đặc (dense)
                            knowledgeItem.vector = await window.contextVectorManager.getEmbeddingFromTransformers(item.content);
                            knowledgeItem.vectorType = 'dense';
                            console.log(`[DLCManager] ${item.title}: Sử dụng mô hình trình duyệt để tạo vector dày đặc`);
                        } else if (window.contextVectorManager.embeddingMethod === 'api') {
                            // Sử dụng API để tạo vector dày đặc
                            knowledgeItem.vector = await window.contextVectorManager.getEmbeddingFromAPI(item.content);
                            knowledgeItem.vectorType = 'dense';
                            console.log(`[DLCManager] ${item.title}: Sử dụng API để tạo vector dày đặc`);
                        } else {
                            // Sử dụng phương pháp từ khóa để tạo vector thưa thớt (sparse)
                            knowledgeItem.vector = window.contextVectorManager.createKeywordVector(item.content);
                            knowledgeItem.vectorType = 'sparse';
                            console.log(`[DLCManager] ${item.title}: Sử dụng phương pháp từ khóa để tạo vector thưa thớt`);
                        }
                    } catch (error) {
                        console.warn(`[DLCManager] ${item.title} tạo vector thất bại, quay lại phương pháp từ khóa:`, error.message);
                        // Khi thất bại, quay lại phương pháp từ khóa
                        knowledgeItem.vector = window.contextVectorManager.createKeywordVector(item.content);
                        knowledgeItem.vectorType = 'sparse';
                    }
                }
                
                // Kiểm tra xem mục có cùng ID đã tồn tại chưa để tránh thêm trùng lặp
                const existingIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(kb => kb.id === knowledgeItem.id);
                if (existingIndex !== -1) {
                    console.log(`[DLCManager] ${item.title}: Mục kiến thức đã tồn tại, bỏ qua việc thêm`);
                    continue;
                }
                
                // Thêm vào kho kiến thức
                window.contextVectorManager.staticKnowledgeBase.push(knowledgeItem);
            }
            
            // Lưu vào IndexedDB
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            console.log(`[DLCManager] Đã thêm ${dlc.knowledgeItems.length} mục kiến thức vào kho lưu trữ vector`);
            
            // Xác thực kết quả thêm
            const currentKB = window.contextVectorManager.staticKnowledgeBase;
            const dlcItems = currentKB.filter(item => item.category === 'dlc');
            console.log(`[DLCManager] Xác thực: Kho kiến thức hiện có ${dlcItems.length} mục DLC`);
        } else {
            console.warn('[DLCManager] Cảnh báo: contextVectorManager chưa khởi tạo, không thể thêm kiến thức DLC vào kho vector');
        }
        
        console.log(`[DLCManager] Đã kích hoạt DLC: ${dlc.name}`);
        
        // Lưu trạng thái vào cơ sở dữ liệu
        await this.saveDLCToIndexedDB();
        
        // Hiển thị thông báo kích hoạt thành công
        setTimeout(() => {
            alert(`✅ Kích hoạt DLC thành công!\n\n📦 Tên DLC: ${dlc.name}\n📚 Mục kiến thức: ${dlc.knowledgeItems.length}\n\n💡 Bạn có thể nhấp vào "📚 Xem kho kiến thức" để kiểm tra nội dung DLC đã kích hoạt\nCác mục DLC sẽ hiển thị với ký hiệu 📦`);
        }, 100);
    }

    /**
     * Ngừng kích hoạt gói DLC
     */
    async deactivateDLC(dlcId) {
        const dlc = this.dlcPackages.find(d => d.id === dlcId);
        if (!dlc) {
            throw new Error('Gói DLC không tồn tại');
        }
        
        if (!dlc.activated) {
            console.log(`[DLCManager] DLC ${dlc.name} chưa được kích hoạt`);
            return;
        }
        
        dlc.activated = false;
        this.activatedDLCs.delete(dlcId);
        
        // Xóa kiến thức DLC khỏi kho kiến thức
        if (window.contextVectorManager) {
            // Tìm tất cả các mục kiến thức thuộc về DLC này
            const dlcKnowledgeItems = window.contextVectorManager.staticKnowledgeBase.filter(item => item.dlcId === dlcId);
            
            for (const item of dlcKnowledgeItems) {
                // Xóa khỏi mảng
                const index = window.contextVectorManager.staticKnowledgeBase.findIndex(kb => kb.id === item.id);
                if (index !== -1) {
                    window.contextVectorManager.staticKnowledgeBase.splice(index, 1);
                }
            }
            
            // Lưu vào IndexedDB
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            console.log(`[DLCManager] Đã xóa ${dlcKnowledgeItems.length} mục kiến thức khỏi kho lưu trữ vector`);
        }
        
        console.log(`[DLCManager] Đã ngừng kích hoạt DLC: ${dlc.name}`);
        
        // Lưu trạng thái vào cơ sở dữ liệu
        await this.saveDLCToIndexedDB();
        
        // Hiển thị thông báo ngừng kích hoạt thành công
        setTimeout(() => {
            alert(`✅ Ngừng kích hoạt DLC thành công!\n\n📦 Tên DLC: ${dlc.name}\n📚 Mục kiến thức: ${dlc.knowledgeItems.length}\n\n💡 Các mục kiến thức liên quan đã bị xóa khỏi kho kiến thức\nBạn có thể xác nhận việc xóa trong "📚 Xem kho kiến thức"`);
        }, 100);
    }

    /**
     * Xóa gói DLC
     */
    async deleteDLC(dlcId) {
        const index = this.dlcPackages.findIndex(d => d.id === dlcId);
        if (index === -1) {
            throw new Error('Gói DLC không tồn tại');
        }
        
        const dlc = this.dlcPackages[index];
        
        // Nếu DLC đang kích hoạt, phải ngừng kích hoạt trước
        if (dlc.activated) {
            await this.deactivateDLC(dlcId);
        }
        
        // Xóa khỏi mảng
        this.dlcPackages.splice(index, 1);
        
        // Xóa khỏi cơ sở dữ liệu
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(dlcId);
                
                request.onsuccess = () => {
                    console.log(`[DLCManager] Đã xóa DLC: ${dlc.name}`);
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('Xóa DLC thất bại:', request.error);
                    reject(request.error);
                };
            });
        }
    }

    /**
     * Lưu tất cả các gói DLC vào IndexedDB
     */
    async saveDLCToIndexedDB() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Xóa dữ liệu hiện có
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                // Thêm lại tất cả các gói DLC
                let saveCount = 0;
                const totalDLCs = this.dlcPackages.length;
                
                if (totalDLCs === 0) {
                    console.log('[DLCManager] Tất cả các gói DLC đã được lưu vào cơ sở dữ liệu');
                    resolve();
                    return;
                }
                
                this.dlcPackages.forEach(dlc => {
                    const addRequest = store.add(dlc);
                    
                    addRequest.onsuccess = () => {
                        saveCount++;
                        if (saveCount === totalDLCs) {
                            console.log(`[DLCManager] Đã lưu ${totalDLCs} gói DLC vào cơ sở dữ liệu`);
                            resolve();
                        }
                    };
                    
                    addRequest.onerror = () => {
                        console.error('Lưu gói DLC thất bại:', addRequest.error);
                        reject(addRequest.error);
                    };
                });
            };
            
            clearRequest.onerror = () => {
                console.error('Xóa cơ sở dữ liệu DLC thất bại:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * Nhập gói DLC (Import)
     */
    async importDLC(dlcData) {
        if (!dlcData || !dlcData.id) {
            throw new Error('Dữ liệu DLC không hợp lệ');
        }
        
        // Kiểm tra xem đã tồn tại chưa
        const existingIndex = this.dlcPackages.findIndex(d => d.id === dlcData.id);
        if (existingIndex !== -1) {
            // Cập nhật DLC hiện có
            this.dlcPackages[existingIndex] = { ...dlcData, activated: false };
            console.log(`[DLCManager] Cập nhật gói DLC: ${dlcData.name}`);
        } else {
            // Thêm DLC mới
            this.dlcPackages.push({ ...dlcData, activated: false });
            console.log(`[DLCManager] Nhập gói DLC: ${dlcData.name}`);
        }
        
        await this.saveDLCToIndexedDB();
    }

    /**
     * Lấy thông tin thống kê DLC
     */
    getStats() {
        const total = this.dlcPackages.length;
        const activated = this.activatedDLCs.size;
        const totalKnowledgeItems = this.dlcPackages.reduce((sum, dlc) => sum + (dlc.knowledgeItems?.length || 0), 0);
        
        return {
            total,
            activated,
            inactive: total - activated,
            totalKnowledgeItems
        };
    }

    /**
     * Xóa sạch tất cả dữ liệu DLC
     */
    async clearAllDLCs() {
        console.log('[DLCManager] Bắt đầu xóa sạch tất cả dữ liệu DLC');
        
        // Ngừng kích hoạt tất cả DLC đang chạy
        const activatedDLCs = this.getActivatedDLCs();
        for (const dlc of activatedDLCs) {
            try {
                await this.deactivateDLC(dlc.id);
            } catch (error) {
                console.warn(`[DLCManager] Ngừng kích hoạt DLC ${dlc.name} thất bại:`, error.message);
            }
        }
        
        // Xóa dữ liệu DLC trong bộ nhớ
        this.dlcPackages = [];
        this.activatedDLCs.clear();
        
        // Xóa sạch cơ sở dữ liệu
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const clearRequest = store.clear();
                
                clearRequest.onsuccess = () => {
                    console.log('[DLCManager] Đã xóa sạch tất cả dữ liệu DLC');
                    resolve();
                };
                
                clearRequest.onerror = () => {
                    console.error('[DLCManager] Xóa cơ sở dữ liệu DLC thất bại:', clearRequest.error);
                    reject(clearRequest.error);
                };
            });
        }
    }
}

// Tạo thực thể (instance) DLCManager toàn cục
window.dlcManager = new DLCManager();

// Khởi tạo DLCManager
window.dlcManager.loadAllDLCs().catch(error => {
    console.error('Khởi tạo DLCManager thất bại:', error);
});

console.log('[DLCManager] Đã tải và khởi tạo');
