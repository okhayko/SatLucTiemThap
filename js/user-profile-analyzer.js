// ==================== HỆ THỐNG PHÂN TÍCH DỮ LIỆU NHẬP CỦA NGƯỜI DÙNG VÀ CHÂN DUNG NGƯỜI DÙNG ====================
// Mô-đun này chịu trách nhiệm phân tích dữ liệu nhập của người dùng, xây dựng chân dung người dùng và cung cấp gợi ý tăng cường cho API chính

// ==================== 📚 TRÌNH QUẢN LÝ LƯU TRỮ CỐT TRUYỆN ====================
/**
 * Trình quản lý lưu trữ cốt truyện - Lưu trữ và quản lý các kế hoạch cốt truyện được tạo ra từ mỗi lần phân tích
 */
const plotArchiveManager = {
    // Dữ liệu lưu trữ cốt truyện
    plots: [],

    // Dữ liệu thống kê
    stats: {
        totalCount: 0,
        lastUpdated: null
    },

    /**
     * Thêm kế hoạch cốt truyện mới
     * @param {object} plotPlanning - Đối tượng plotPlanning từ kết quả phân tích
     */
    addPlot(plotPlanning) {
        if (!plotPlanning || !plotPlanning.storyName) {
            console.warn('[📚Cốt truyện lưu trữ] Thiếu storyName, bỏ qua việc lưu');
            return;
        }

        const plot = {
            id: this.generateId(),
            storyName: plotPlanning.storyName,
            timestamp: Date.now(),
            step1: plotPlanning.step1 || '',
            step2: plotPlanning.step2 || '',
            step3: plotPlanning.step3 || '',
            reasoning: plotPlanning.reasoning || ''
        };

        this.plots.push(plot);
        this.stats.totalCount = this.plots.length;
        this.stats.lastUpdated = new Date().toISOString();

        // Lưu vào localStorage
        this.saveToLocalStorage();

        console.log('[📚Cốt truyện lưu trữ] Đã lưu cốt truyện:', plot.storyName);
        return plot;
    },

    /**
     * Tạo ID duy nhất
     */
    generateId() {
        return 'plot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Lấy danh sách tất cả tên cốt truyện
     * @returns {string[]} Mảng tên cốt truyện
     */
    getAllPlotNames() {
        const names = new Set();
        this.plots.forEach(plot => {
            if (plot.storyName) {
                names.add(plot.storyName);
            }
        });
        return Array.from(names);
    },

    /**
     * Lấy tất cả cốt truyện được nhóm theo tên cốt truyện
     * @returns {object} { name: [plots...], ... }
     */
    getPlotsByName() {
        const grouped = {};
        this.plots.forEach(plot => {
            const name = plot.storyName || 'Chưa đặt tên';
            if (!grouped[name]) {
                grouped[name] = [];
            }
            grouped[name].push(plot);
        });
        return grouped;
    },

    /**
     * Lấy kế hoạch cốt truyện mới nhất dựa trên tên
     * @param {string} storyName - Tên cốt truyện
     * @returns {object|null} Kế hoạch cốt truyện mới nhất
     */
    getLatestPlotByName(storyName) {
        const plots = this.plots.filter(p => p.storyName === storyName);
        if (plots.length === 0) return null;
        return plots[plots.length - 1]; // Trả về cái mới nhất
    },

    /**
     * Lấy kế hoạch ba bước của nhiều cốt truyện dựa trên danh sách tên
     * @param {string[]} storyNames - Mảng tên cốt truyện
     * @returns {object[]} Mảng kế hoạch cốt truyện
     */
    getPlotsForContext(storyNames) {
        if (!storyNames || storyNames.length === 0) return [];

        const result = [];
        storyNames.forEach(name => {
            const plot = this.getLatestPlotByName(name);
            if (plot) {
                result.push({
                    storyName: plot.storyName,
                    step1: plot.step1,
                    step2: plot.step2,
                    step3: plot.step3
                });
            }
        });
        return result;
    },

    /**
     * Xóa cốt truyện theo ID chỉ định
     * @param {string} plotId - ID cốt truyện
     */
    deletePlot(plotId) {
        const index = this.plots.findIndex(p => p.id === plotId);
        if (index !== -1) {
            this.plots.splice(index, 1);
            this.stats.totalCount = this.plots.length;
            this.saveToLocalStorage();
            console.log('[📚Cốt truyện lưu trữ] Đã xóa cốt truyện:', plotId);
        }
    },

    /**
     * Xóa N kế hoạch cốt truyện cuối cùng (dùng để dọn dẹp đồng bộ khi xóa tầng hoặc tạo lại)
     * @param {number} count - Số lượng mục cần xóa
     * @returns {number} Số lượng mục thực tế đã xóa
     */
    deleteLastN(count) {
        if (!count || count <= 0 || this.plots.length === 0) {
            return 0;
        }

        const actualDeleteCount = Math.min(count, this.plots.length);
        const deletedPlots = this.plots.splice(-actualDeleteCount, actualDeleteCount);

        this.stats.totalCount = this.plots.length;
        this.stats.lastUpdated = new Date().toISOString();
        this.saveToLocalStorage();

        console.log(`[📚Cốt truyện lưu trữ] Đã xóa ${actualDeleteCount} kế hoạch cốt truyện cuối cùng`);
        deletedPlots.forEach(plot => {
            console.log(`  - ${plot.storyName}`);
        });

        return actualDeleteCount;
    },

    /**
     * Xóa sạch tất cả cốt truyện
     */
    clearAll() {
        this.plots = [];
        this.stats.totalCount = 0;
        this.stats.lastUpdated = null;
        this.saveToLocalStorage();
        console.log('[📚Cốt truyện lưu trữ] Đã xóa sạch tất cả cốt truyện');
    },

    /**
     * Xuất dữ liệu lưu trữ
     * @returns {object} Dữ liệu lưu trữ
     */
    exportArchive() {
        return {
            plots: JSON.parse(JSON.stringify(this.plots)),
            stats: { ...this.stats }
        };
    },

    /**
     * Nhập dữ liệu lưu trữ
     * @param {object} data - Dữ liệu lưu trữ
     */
    importArchive(data) {
        if (!data) return;

        if (data.plots && Array.isArray(data.plots)) {
            this.plots = data.plots;
        }
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
        this.stats.totalCount = this.plots.length;

        this.saveToLocalStorage();
        console.log('[📚Cốt truyện lưu trữ] Đã nhập', this.plots.length, 'mục cốt truyện');
    },

    /**
     * Lưu vào localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('plotArchiveData', JSON.stringify({
                plots: this.plots,
                stats: this.stats
            }));
        } catch (e) {
            console.warn('[📚Cốt truyện lưu trữ] Lưu vào localStorage thất bại:', e);
        }
    },

    /**
     * Tải từ localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('plotArchiveData');
            if (saved) {
                const data = JSON.parse(saved);
                this.importArchive(data);
                console.log('[📚Cốt truyện lưu trữ] Đã tải từ localStorage', this.plots.length, 'mục cốt truyện');
            }
        } catch (e) {
            console.warn('[📚Cốt truyện lưu trữ] Tải từ localStorage thất bại:', e);
        }
    }
};

// Tải từ localStorage khi khởi tạo
plotArchiveManager.loadFromLocalStorage();

// Phơi bày ra toàn cục
window.plotArchiveManager = plotArchiveManager;

// ==================== 🔄 TRÌNH THEO DÕI TẦN SUẤT VẬT PHẨM ====================
/**
 * Trình theo dõi tần suất vật phẩm - Theo dõi tần suất xuất hiện của vật phẩm/nhân vật/địa điểm trong gói trí nhớ
 * Dùng để ức chế nội dung lặp lại, tránh việc cùng một vật phẩm xuất hiện liên tục trong nhiều lượt
 */
const itemFrequencyTracker = {
    // Dữ liệu theo dõi: { itemName: { count: số lần xuất hiện liên tiếp, lastMentioned: lượt nhắc đến cuối cùng } }
    tracking: {},

    // Lượt hiện tại (tăng thêm 1 sau mỗi lần phân tích)
    currentRound: 0,

    // Cấu hình
    config: {
        maxConsecutive: 1,      // Ức chế sau khi xuất hiện liên tiếp vượt quá số lần này
        cooldownRounds: 2,      // Số lượt cần làm nguội sau khi bị ức chế
        enabled: true           // Có bật tính năng ức chế hay không
    },

    /**
     * Bắt đầu một vòng phân tích mới
     */
    startNewRound() {
        this.currentRound++;
        console.log(`[🔄Theo dõi tần suất] Bắt đầu lượt thứ ${this.currentRound}`);
    },

    /**
     * Ghi lại các vật phẩm xuất hiện trong lượt này
     * @param {string[]} itemNames - Danh sách tên vật phẩm xuất hiện trong lượt này
     */
    recordItems(itemNames) {
        if (!itemNames || !Array.isArray(itemNames)) return;

        itemNames.forEach(name => {
            if (!name) return;

            // 🔄 Khớp mờ: kiểm tra xem có tên tương tự đã được ghi lại hay chưa
            let matchedKey = null;
            for (const existingName in this.tracking) {
                if (this.fuzzyMatch(name, existingName)) {
                    matchedKey = existingName;
                    break;
                }
            }

            if (matchedKey) {
                // Tìm thấy khớp mờ, sử dụng key đã có
                if (this.tracking[matchedKey].lastMentioned === this.currentRound - 1) {
                    this.tracking[matchedKey].count++;
                    console.log(`[🔄Theo dõi tần suất] "${name}" khớp mờ với "${matchedKey}", số lần liên tiếp: ${this.tracking[matchedKey].count}`);
                } else {
                    this.tracking[matchedKey].count = 1;
                }
                this.tracking[matchedKey].lastMentioned = this.currentRound;
            } else if (!this.tracking[name]) {
                // Vật phẩm mới
                this.tracking[name] = { count: 1, lastMentioned: this.currentRound };
            } else {
                // Khớp chính xác bản ghi hiện có
                if (this.tracking[name].lastMentioned === this.currentRound - 1) {
                    this.tracking[name].count++;
                } else {
                    this.tracking[name].count = 1;
                }
                this.tracking[name].lastMentioned = this.currentRound;
            }
        });

        this.saveToLocalStorage();
    },

    /**
     * 🔄 Khớp mờ hai tên gọi
     */
    fuzzyMatch(name1, name2) {
        if (!name1 || !name2) return false;
        if (name1 === name2) return true;

        const n1 = name1.toLowerCase();
        const n2 = name2.toLowerCase();

        // Quan hệ bao hàm
        if (n1.includes(n2) || n2.includes(n1)) return true;

        // Khớp từ khóa (từ tiếng Anh)
        const extractKeywords = (s) => {
            const matches = s.match(/[a-zA-Z]+/gi) || [];
            return matches.filter(m => m.length >= 3);
        };

        const kw1 = extractKeywords(n1);
        const kw2 = extractKeywords(n2);

        for (const k1 of kw1) {
            for (const k2 of kw2) {
                if (k1.toLowerCase() === k2.toLowerCase()) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Kiểm tra vật phẩm có nên bị ức chế hay không
     * @param {string} itemName - Tên vật phẩm
     * @param {string} userInput - Dữ liệu nhập của người dùng (dùng để phát hiện có được nhắc tới rõ ràng hay không)
     * @returns {boolean} true=nên ức chế, false=có thể hiển thị
     */
    shouldSuppress(itemName, userInput = '') {
        if (!this.config.enabled) return false;
        if (!this.tracking[itemName]) return false;

        const item = this.tracking[itemName];

        // Nếu người dùng nhắc tới vật phẩm đó một cách rõ ràng, không ức chế
        if (userInput && userInput.includes(itemName)) {
            console.log(`[🔄Theo dõi tần suất] "${itemName}" được người dùng nhắc tới rõ ràng, không ức chế`);
            return false;
        }

        // Kiểm tra xem có xuất hiện liên tiếp vượt ngưỡng hay không
        if (item.count >= this.config.maxConsecutive &&
            item.lastMentioned === this.currentRound - 1) {
            console.log(`[🔄Theo dõi tần suất] "${itemName}" xuất hiện liên tiếp ${item.count} lần, ức chế đầu ra`);
            return true;
        }

        return false;
    },

    /**
     * Lấy danh sách các vật phẩm cần bị ức chế (dùng cho gợi ý từ khóa)
     * @param {string} userInput - Dữ liệu nhập của người dùng
     * @returns {string[]} Danh sách tên các vật phẩm cần bị ức chế
     */
    getSuppressedItems(userInput = '') {
        const suppressed = [];
        for (const name in this.tracking) {
            if (this.shouldSuppress(name, userInput)) {
                suppressed.push(name);
            }
        }
        return suppressed;
    },

    /**
     * Lấy danh sách các vật phẩm có tần suất cao (xuất hiện liên tiếp từ 2 lần trở lên)
     * @returns {object[]} [{name, count}]
     */
    getHighFrequencyItems() {
        const result = [];
        for (const name in this.tracking) {
            const item = this.tracking[name];
            if (item.count >= 2 && item.lastMentioned >= this.currentRound - 1) {
                result.push({ name, count: item.count });
            }
        }
        return result.sort((a, b) => b.count - a.count);
    },

    /**
     * Đặt lại bộ đếm của một vật phẩm nào đó (khi người dùng chủ động nhắc tới)
     * @param {string} itemName - Tên vật phẩm
     */
    resetItem(itemName) {
        if (this.tracking[itemName]) {
            this.tracking[itemName].count = 1;
            this.tracking[itemName].lastMentioned = this.currentRound;
        }
    },

    /**
     * Xóa sạch tất cả dữ liệu theo dõi
     */
    clearAll() {
        this.tracking = {};
        this.currentRound = 0;
        this.saveToLocalStorage();
        console.log('[🔄Theo dõi tần suất] Đã xóa sạch tất cả dữ liệu theo dõi');
    },

    /**
     * Lưu vào localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('itemFrequencyTracker', JSON.stringify({
                tracking: this.tracking,
                currentRound: this.currentRound,
                config: this.config
            }));
        } catch (e) {
            console.warn('[🔄Theo dõi tần suất] Lưu thất bại:', e);
        }
    },

    /**
     * Tải từ localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('itemFrequencyTracker');
            if (saved) {
                const data = JSON.parse(saved);
                this.tracking = data.tracking || {};
                this.currentRound = data.currentRound || 0;
                if (data.config) {
                    this.config = { ...this.config, ...data.config };
                }
                console.log(`[🔄Theo dõi tần suất] Tải thành công, hiện tại lượt thứ ${this.currentRound}, đang theo dõi ${Object.keys(this.tracking).length} vật phẩm`);
            }
        } catch (e) {
            console.warn('[🔄Theo dõi tần suất] Tải thất bại:', e);
        }
    },

    /**
     * Lấy tóm tắt trạng thái theo dõi (dùng để gỡ lỗi)
     */
    getStatusSummary() {
        const highFreq = this.getHighFrequencyItems();
        return {
            currentRound: this.currentRound,
            totalTracked: Object.keys(this.tracking).length,
            highFrequencyItems: highFreq,
            config: this.config
        };
    }
};

// Tải từ localStorage khi khởi tạo
itemFrequencyTracker.loadFromLocalStorage();

// Phơi bày ra toàn cục
window.itemFrequencyTracker = itemFrequencyTracker;

/**
 * 🔄 Kiểm tra khớp mờ - Phán đoán xem hai tên gọi có cùng chỉ một vật phẩm hay không
 * Ví dụ "Zippo đầu lâu bạc" và "Bật lửa Zippo đầu lâu" nên được nhận diện là cùng một vật phẩm
 */
function fuzzyMatchItemName(name1, name2) {
    if (!name1 || !name2) return false;

    // Khớp chính xác
    if (name1 === name2) return true;

    // Trích xuất các từ khóa cốt lõi để khớp
    const normalize = (s) => s.toLowerCase()
        .replace(/[银色金色黑色红色白色]/g, '')  // Loại bỏ màu sắc
        .replace(/[的了一个]/g, '')  // Loại bỏ hư từ
        .trim();

    const n1 = normalize(name1);
    const n2 = normalize(name2);

    // Quan hệ bao hàm
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Khớp từ cốt lõi (trích xuất tiếng Anh + số)
    const extractCore = (s) => {
        const matches = s.match(/[a-zA-Z0-9\u4e00-\u9fa5]+/g) || [];
        return matches.filter(m => m.length >= 2);
    };

    const cores1 = extractCore(n1);
    const cores2 = extractCore(n2);

    // Nếu có bất kỳ từ cốt lõi nào giống nhau, phán định là cùng một vật phẩm
    for (const c1 of cores1) {
        for (const c2 of cores2) {
            if (c1.includes(c2) || c2.includes(c1)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * 🔄 Lọc các vật phẩm tần suất cao khỏi gói trí nhớ
 * @param {object} memoryPackage - Gói trí nhớ gốc
 * @returns {object} Gói trí nhớ sau khi lọc
 */
function filterHighFrequencyItemsFromPackage(memoryPackage) {
    if (!memoryPackage) return memoryPackage;

    // Sao chép sâu để tránh sửa đổi đối tượng gốc
    const filtered = JSON.parse(JSON.stringify(memoryPackage));

    // Lấy các vật phẩm cần ức chế (xuất hiện liên tiếp >= 3 lần)
    const highFreqItems = itemFrequencyTracker.getHighFrequencyItems();
    const suppressNames = highFreqItems.filter(i => i.count >= 3).map(i => i.name);

    if (suppressNames.length === 0) {
        return filtered;
    }

    console.log('[🔄Theo dõi tần suất] Các vật phẩm cần ức chế:', suppressNames.join(', '));

    // Kiểm tra vật phẩm có nên bị lọc hay không (sử dụng khớp mờ)
    const shouldFilter = (itemName) => {
        for (const suppressName of suppressNames) {
            if (fuzzyMatchItemName(itemName, suppressName)) {
                console.log(`[🔄Theo dõi tần suất] Lọc vật phẩm: "${itemName}" (khớp với từ tần suất cao "${suppressName}")`);
                return true;
            }
        }
        return false;
    };

    // Lọc requiredItems
    if (filtered.requiredItems?.items && Array.isArray(filtered.requiredItems.items)) {
        const originalCount = filtered.requiredItems.items.length;
        filtered.requiredItems.items = filtered.requiredItems.items.filter(item => {
            return !shouldFilter(item.name);
        });
        const removedCount = originalCount - filtered.requiredItems.items.length;
        if (removedCount > 0) {
            console.log(`[🔄Theo dõi tần suất] Đã loại bỏ ${removedCount} vật phẩm tần suất cao khỏi requiredItems`);
        }
    }

    return filtered;
}

// Phơi bày ra toàn cục
window.fuzzyMatchItemName = fuzzyMatchItemName;
window.filterHighFrequencyItemsFromPackage = filterHighFrequencyItemsFromPackage;

// Lưu trữ chân dung người dùng
let userProfileData = {
    // Sở thích người dùng
    preferences: [],
    // Nội dung người dùng không thích
    dislikes: [],
    // Văn phong yêu thích
    writingStyle: 'Chưa xác định',
    // Sở thích nội dung
    contentPreference: 'Chưa xác định',
    // Trình độ văn học
    literacyLevel: 'Chưa xác định',
    // Mô thức tương tác
    interactionPattern: 'Chưa xác định',
    // Các quan sát khác
    notes: [],
    // Lịch sử phân tích (10 lần gần nhất)
    analysisHistory: [],
    // Dữ liệu thống kê
    stats: {
        totalInputs: 0,
        r18Inputs: 0,
        combatInputs: 0,
        socialInputs: 0,
        explorationInputs: 0,
        lastUpdated: null
    }
};

// Cấu hình chân dung người dùng
let userProfileConfig = {
    enabled: false,
    analysisPrompt: '',
    showAnalysis: true,
    analysisHistoryDepth: 3,   // Số tầng văn bản đọc khi phân tích
    matrixHistoryDepth: 5,     // Số tầng ma trận lịch sử đọc khi phân tích
    memoryDispatcherEnabled: false  // 🆕 Chế độ Điều phối trí nhớ: Flash xem lượng lớn lịch sử xuất ra gói trí nhớ, API chính tập trung viết lách
};

/**
 * 🔧 Hàm tương thích: Lấy cấu hình API bổ sung (tương thích biến toàn cục và cục bộ)
 */
function getExtraApiConfigForProfile() {
    // Ưu tiên sử dụng hàm getExtraApiConfig toàn cục (nếu có)
    if (typeof window.getExtraApiConfig === 'function') {
        return window.getExtraApiConfig();
    }
    // Thử biến toàn cục
    if (window.extraApiConfig) {
        return window.extraApiConfig;
    }
    // Thử biến cục bộ (được định nghĩa trong một số tệp HTML)
    if (typeof extraApiConfig !== 'undefined') {
        return extraApiConfig;
    }
    // Nếu đều không tồn tại thì trả về cấu hình trống
    return { enabled: false, key: '', endpoint: '', model: '' };
}

/**
 * Khởi tạo hệ thống chân dung người dùng
 */
async function initUserProfileSystem() {
    // Tải cấu hình từ localStorage
    loadUserProfileConfig();
    // Tải chân dung người dùng từ localStorage (tích lũy tự động)
    loadUserProfile();

    // Tải chân dung bảng hỏi đã xác nhận từ IndexedDB
    try {
        await loadUserProfileFromIndexedDB();
        if (confirmedUserProfile) {
            console.log('[🎭Chân dung người dùng] Đã tải chân dung bảng hỏi:', confirmedUserProfile.result?.summary || 'Đã tồn tại');
        }
    } catch (e) {
        console.warn('[🎭Chân dung người dùng] Tải chân dung bảng hỏi thất bại:', e);
    }

    // Gỡ lỗi: kiểm tra cấu hình API bổ sung
    const extraConfig = getExtraApiConfigForProfile();
    console.log('[🎭Chân dung người dùng] Khởi tạo hệ thống hoàn tất');
    console.log('[🎭Chân dung người dùng] Trạng thái tính năng:', userProfileConfig.enabled ? 'Đã bật' : 'Chưa bật');
    console.log('[🎭Chân dung người dùng] Trạng thái API bổ sung:', extraConfig.enabled ? 'Đã bật' : 'Chưa bật');
    console.log('[🎭Chân dung người dùng] Chân dung bảng hỏi:', confirmedUserProfile ? 'Đã tồn tại' : 'Chưa tạo');
}

/**
 * Tải cấu hình chân dung người dùng
 */
function loadUserProfileConfig() {
    const saved = localStorage.getItem('userProfileConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            userProfileConfig = { ...userProfileConfig, ...config };
        } catch (e) {
            console.warn('[🎭Chân dung người dùng] Tải cấu hình thất bại:', e);
        }
    }
}

/**
 * Lưu cấu hình chân dung người dùng
 */
function saveUserProfileConfig() {
    localStorage.setItem('userProfileConfig', JSON.stringify(userProfileConfig));
}

/**
 * Tải dữ liệu chân dung người dùng
 */
function loadUserProfile() {
    const saved = localStorage.getItem('userProfileData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            userProfileData = { ...userProfileData, ...data };
        } catch (e) {
            console.warn('[🎭Chân dung người dùng] Tải dữ liệu chân dung thất bại:', e);
        }
    }
}

/**
 * Lưu dữ liệu chân dung người dùng
 */
function saveUserProfile() {
    userProfileData.stats.lastUpdated = new Date().toISOString();
    localStorage.setItem('userProfileData', JSON.stringify(userProfileData));
}

/**
 * Phân tích dữ liệu nhập của người dùng
 * @param {string} userInput - Dữ liệu nhập gốc của người dùng
 * @param {object} gameContext - Ngữ cảnh trò chơi (tùy chọn)
 * @returns {Promise<object>} Kết quả phân tích
 */
async function analyzeUserInput(userInput, gameContext = null) {
    if (!userProfileConfig.enabled) {
        return null;
    }

    // Kiểm tra API bổ sung có khả dụng hay không (tương thích biến toàn cục và cục bộ)
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        console.warn('[🎭Chân dung người dùng] API bổ sung chưa bật, bỏ qua phân tích');
        return null;
    }

    if (userProfileConfig.showAnalysis) {
        console.log('[🎭Chân dung người dùng] Bắt đầu phân tích dữ liệu nhập của người dùng:', userInput);
    }

    // 🔄 Bắt đầu vòng theo dõi mới
    itemFrequencyTracker.startNewRound();

    try {
        // 🆕 Lựa chọn hàm xây dựng tin nhắn khác nhau dựa trên công tắc chế độ Điều phối trí nhớ
        let messages;
        const isMemoryDispatcherMode = userProfileConfig.memoryDispatcherEnabled || window.memoryDispatcherEnabled;

        if (isMemoryDispatcherMode) {
            console.log('[🧠Điều phối trí nhớ] Sử dụng chế độ Điều phối trí nhớ');
            messages = await buildMemoryDispatcherMessages(userInput, gameContext);
        } else {
            console.log('[🎭Chân dung người dùng] Sử dụng chế độ phân tích thông thường');
            messages = buildAnalysisMessages(userInput, gameContext);
        }

        // Gọi API bổ sung để phân tích
        console.log('[🎭Chân dung người dùng] Đang gọi API bổ sung...');
        console.log('[🎭Chân dung người dùng] Tin nhắn đã gửi:', JSON.stringify(messages).substring(0, 10000) + '...');

        const response = await callExtraAI(messages);

        console.log('[🎭Chân dung người dùng] API bổ sung phản hồi thành công, độ dài:', response?.length || 0);

        // Phân tích kết quả phản hồi
        const analysisResult = parseAnalysisResponse(response);

        if (analysisResult) {
            // Cập nhật chân dung người dùng (nếu API trả về)
            if (analysisResult.userProfile) {
                updateUserProfile(analysisResult.userProfile);
            }

            // Thêm vào lịch sử phân tích
            addToAnalysisHistory(userInput, analysisResult);

            // Lưu chân dung người dùng
            saveUserProfile();

            // 🆕 Hiển thị chuỗi tư duy phân tích (không đưa vào lưu trữ) - Hiển thị trực tiếp đầu ra gốc
            if (userProfileConfig.showAnalysis) {
                console.log('[🎭Chân dung người dùng] Phân tích hoàn tất:', analysisResult);
                displayAnalysisReasoning(userInput, analysisResult, response);  // Truyền vào phản hồi gốc
            }

            // 🆕 Lưu kết quả phân tích vào biến toàn cục, dùng cho kho kiến thức nhãn trong supply.js
            window.latestAnalysisResult = analysisResult;
            if (analysisResult.knowledgeTags && analysisResult.knowledgeTags.length > 0) {
                console.log('[🎭Chân dung người dùng] Nhãn kiến thức:', analysisResult.knowledgeTags.join(', '));
            }

            // 📚 Lưu kế hoạch cốt truyện vào bản lưu trữ
            // 🔧 Hỗ trợ hai loại cấu trúc: trực tiếp plotPlanning hoặc memoryPackage.plotPlanning
            const plotPlanning = analysisResult.plotPlanning ||
                (analysisResult.memoryPackage && analysisResult.memoryPackage.plotPlanning);
            if (plotPlanning && plotPlanning.storyName) {
                plotArchiveManager.addPlot(plotPlanning);
                console.log('[📚Cốt truyện lưu trữ] Đã lưu kế hoạch cốt truyện:', plotPlanning.storyName);
            }

            // 📚 Ghi lại tên cốt truyện liên quan (nếu có)
            if (analysisResult.relatedStoryNames && analysisResult.relatedStoryNames.length > 0) {
                console.log('[📚Cốt truyện lưu trữ] Cốt truyện liên quan:', analysisResult.relatedStoryNames.join(', '));
            }

            // 🔄 Ghi lại các vật phẩm/nhân vật/địa điểm xuất hiện trong lượt này (dùng cho theo dõi tần suất)
            const extractedItems = extractItemsFromAnalysisResult(analysisResult);
            if (extractedItems.length > 0) {
                itemFrequencyTracker.recordItems(extractedItems);
                console.log('[🔄Theo dõi tần suất] Vật phẩm trích xuất lượt này:', extractedItems.join(', '));
            }

            return analysisResult;
        } else {
            console.warn('[🎭Chân dung người dùng] Kết quả phân tích trống, phản hồi gốc:', response?.substring(0, 200));
        }
    } catch (error) {
        console.error('[🎭Chân dung người dùng] Phân tích thất bại:', error);
        console.error('[🎭Chân dung người dùng] Chi tiết lỗi:', error.message);
    }

    return null;
}

/**
 * 🆕 Xây dựng tin nhắn Điều phối trí nhớ
 * Sử dụng cấu hình Tavern đầy đủ của API chính + sở thích bảng hỏi người dùng + yêu cầu định dạng đầu ra gói trí nhớ
 */
async function buildMemoryDispatcherMessages(userInput, gameContext) {
    console.log('[🧠Điều phối trí nhớ] Bắt đầu xây dựng tin nhắn, sử dụng cấu hình Tavern đầy đủ...');

    // 1. Lấy cấu hình tin nhắn Tavern đầy đủ của API chính
    let baseMessages = [];
    if (window.contextVectorManager && typeof window.contextVectorManager.buildOptimizedMessages === 'function') {
        try {
            // Sử dụng cấu trúc ngữ cảnh đầy đủ của API chính
            const systemPrompt = window.XiuxianGameConfig?.getSystemPrompt?.() || '';
            const variables = window.gameState?.variables || {};
            const historyDepth = 3;  // 🔧 Chế độ Điều phối trí nhớ đổi thành 3 tầng ký ức liên tục
            const fullHistory = window.gameState?.conversationHistory || [];

            baseMessages = await window.contextVectorManager.buildOptimizedMessages(
                systemPrompt,
                variables,
                userInput,
                historyDepth,
                fullHistory,
                userInput,  // retrievalInput
                true  // 🔧 forFlash=true, bỏ qua kiểm tra chế độ viết thuần túy
            );
            console.log('[🧠Điều phối trí nhớ] Lấy được cấu trúc Tavern của API chính, tổng cộng', baseMessages.length, 'tin nhắn');
        } catch (e) {
            console.warn('[🧠Điều phối trí nhớ] Lấy cấu trúc Tavern thất bại, quay về chế độ giản lược:', e);
        }
    }

    // 2. Nếu lấy thất bại, sử dụng chế độ giản lược
    if (baseMessages.length === 0) {
        baseMessages = buildMemoryDispatcherMessagesSimple(userInput, gameContext);
    }

    // 📱 3. Lấy hồ sơ trò chuyện điện thoại hoạt động gần đây
    let mobileChatContext = '';
    if (typeof window.getRecentActiveMobileChats === 'function') {
        try {
            const recentChats = window.getRecentActiveMobileChats(3, 50);  // 3 cuộc trò chuyện, mỗi cuộc 50 tin
            if (recentChats && recentChats.length > 0) {
                mobileChatContext = '\n\n【📱 Hồ sơ trò chuyện điện thoại】\n';
                mobileChatContext += `Dưới đây là hồ sơ tin nhắn của ${recentChats.length} cuộc trò chuyện hoạt động gần đây:\n`;

                recentChats.forEach(chat => {
                    const chatType = chat.type === 'group' ? 'Trò chuyện nhóm' : 'Trò chuyện riêng';
                    mobileChatContext += `\n【${chat.name}】（${chatType}，tổng cộng ${chat.messageCount} tin）\n`;

                    chat.messages.forEach(msg => {
                        const direction = msg.direction === 'outgoing' ? '→' : '←';
                        const sender = msg.sender || (msg.direction === 'outgoing' ? 'Tôi' : chat.name);
                        mobileChatContext += `${direction} ${sender}：${msg.content}\n`;
                    });
                });

                console.log(`[🧠Điều phối trí nhớ] Đã thêm ngữ cảnh tin nhắn điện thoại của ${recentChats.length} cuộc trò chuyện`);
            }
        } catch (e) {
            console.warn('[🧠Điều phối trí nhớ] Lấy hồ sơ trò chuyện điện thoại thất bại:', e);
        }
    }

    // 4. Thêm sở thích bảng hỏi người dùng
    let userProfilePrompt = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        userProfilePrompt = `\n\n【⭐ Chân dung sở thích người dùng】
Sở thích văn phong：${cp.writingStyle || 'Chưa chỉ định'}
Tông điệu câu chuyện：${cp.storyTone || 'Chưa chỉ định'}
Thích：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || 'Chưa chỉ định'}
Không thích：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || 'Chưa chỉ định'}`;
    }

    // 5. Thêm yêu cầu định dạng đầu ra gói trí nhớ
    const memoryPackageInstruction = getMemoryDispatcherPrompt();

    // 6. Xây dựng tin nhắn cuối cùng: chèn chỉ thị chuyên dụng Điều phối trí nhớ sau tin nhắn cơ bản
    const finalMessages = [
        ...baseMessages
    ];

    // 📱 6.1 Chèn hồ sơ trò chuyện điện thoại sau ký ức liên tục gần đây (dưới dạng một khối tin nhắn độc lập)
    if (mobileChatContext) {
        finalMessages.push({
            role: 'assistant',
            content: mobileChatContext
        });
    }

    // 6.2 Thêm tin nhắn chỉ thị người dùng cuối cùng
    finalMessages.push({
        role: 'user',
        content: `${memoryPackageInstruction}${userProfilePrompt}

【Dữ liệu nhập hiện tại của người dùng】
"${userInput}"

【Quan trọng】Vui lòng dựa trên ngữ cảnh đầy đủ nêu trên để tạo gói trí nhớ JSON có cấu trúc. Bạn phải:
1. Phân tích ý định người dùng, phán đoán xem cần gọi những ký ức nào (nhân vật, địa điểm, vật phẩm)
2. Trích xuất chính xác nội dung liên quan từ các thông tin trên để điền vào gói trí nhớ
3. Nếu trong hồ sơ trò chuyện điện thoại có đối thoại liên quan đến cảnh hiện tại, vui lòng đưa nó vào gói trí nhớ
4. Tạo gói trí nhớ JSON có cấu trúc
5. Sử dụng tông giọng kiên định, đây là chỉ thị cưỡng chế cho AI chính!`
    });

    console.log('[🧠Điều phối trí nhớ] Xây dựng tin nhắn hoàn tất, tổng cộng', finalMessages.length, 'tin nhắn');
    return finalMessages;
}

/**
 * Xây dựng tin nhắn Điều phối trí nhớ phiên bản giản lược (phương án dự phòng)
 * 🆕 Đã tích hợp GraphRAG-Lite: dùng truy xuất ngữ nghĩa thay thế cho ma trận History, giữ lại 3 tầng lịch sử
 */
async function buildMemoryDispatcherMessagesSimple(userInput, gameContext) {
    // Sử dụng từ khóa gợi ý chuyên dụng cho Điều phối trí nhớ
    let systemPrompt = getMemoryDispatcherPrompt();

    // Xây dựng thông tin ngữ cảnh
    let contextInfo = '';
    if (gameContext) {
        contextInfo = `\n\n【Trạng thái trò chơi hiện tại】\nVị trí：${gameContext.currentLocation || 'Chưa rõ'}\nNhân vật：${gameContext.characterName || 'Chưa rõ'}\nCảnh giới：${gameContext.realm || 'Phàm nhân'}`;
    }

    // 🆕 Đổi thành chỉ giữ lại 3 tầng nội dung chính lịch sử (GraphRAG chịu trách nhiệm cho các ký ức xa hơn)
    let recentStoryContext = '';
    const memoryDispatcherHistoryDepth = 3;  // Từ 10 tầng đổi thành 3 tầng

    if (window.gameState && window.gameState.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const recentStories = [];

        let layerCount = 0;
        for (let i = history.length - 1; i >= 0 && layerCount < memoryDispatcherHistoryDepth; i--) {
            const msg = history[i];
            if (msg.role === 'assistant' && msg.content) {
                let storyContent = msg.content;
                try {
                    const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.story) {
                            storyContent = parsed.story;
                        }
                    }
                } catch (e) { }
                recentStories.unshift(storyContent);
                layerCount++;
            }
        }

        if (recentStories.length > 0) {
            recentStoryContext = '\n\n【Diễn biến cốt truyện gần đây】（' + recentStories.length + ' tầng nội dung chính AI gần nhất）\n';
            recentStories.forEach((story, idx) => {
                recentStoryContext += `[Tầng ${idx + 1}] ${story}\n\n`;
            });
        }
    }

    // 🆕 Sử dụng truy xuất ngữ nghĩa GraphRAG-Lite thay thế cho ma trận History
    let graphRAGContext = '';
    if (window.graphRAGLite && window.graphRAGLite.config?.enabled && window.graphRAGLite.entities?.size > 0) {
        try {
            // Lấy phản hồi AI gần nhất làm căn cứ truy xuất
            let lastAIReply = '';
            if (window.gameState?.conversationHistory) {
                const history = window.gameState.conversationHistory;
                const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
                lastAIReply = lastAI?.content?.substring(0, 500) || '';
            }

            // Gọi GraphRAG để xây dựng ngữ cảnh ngữ nghĩa
            graphRAGContext = await window.graphRAGLite.buildContext(userInput, lastAIReply);
            if (graphRAGContext) {
                graphRAGContext = '\n\n【🧠 Liên tưởng ngữ nghĩa GraphRAG】\n' + graphRAGContext;
                console.log('[🧠Điều phối trí nhớ] GraphRAG truy xuất hoàn tất, tìm thấy thực thể và quan hệ liên quan');
            }
        } catch (e) {
            console.warn('[🧠Điều phối trí nhớ] GraphRAG truy xuất thất bại:', e);
        }
    }

    // 🔧 Nếu GraphRAG chưa bật hoặc không có dữ liệu, quay về ma trận History
    let matrixHistoryContext = '';
    if (!graphRAGContext && window.matrixManager && window.matrixManager.historyMatrix && window.matrixManager.historyMatrix.layers) {
        const layers = window.matrixManager.historyMatrix.layers;
        if (layers.length > 0) {
            matrixHistoryContext = '\n\n【⭐ Ma trận ký ức lịch sử (Chế độ dự phòng)】\n';
            matrixHistoryContext += `Tổng cộng ${layers.length} tầng chủ đề：\n`;
            // Chỉ lấy 5 tầng gần nhất để tránh quá dài
            const recentLayers = layers.slice(-5);
            recentLayers.forEach((layer) => {
                matrixHistoryContext += `\n📂 Chủ đề ${layer.id}：${layer.topic}（${layer.vectors.length} bản ghi）\n`;
                // Mỗi tầng chỉ lấy 2 bản ghi gần nhất
                layer.vectors.slice(-2).forEach(v => {
                    const content = v.aiResponse || v.content || '';
                    if (content) {
                        matrixHistoryContext += `  └ ${content.substring(0, 200)}...\n`;
                    }
                });
            });
        }
    }

    // Lấy biểu mẫu biến số đầy đủ
    let fullVariablesContext = '';
    if (window.gameState && window.gameState.variables) {
        const variables = window.gameState.variables;
        fullVariablesContext = '\n\n【Biểu mẫu biến số đầy đủ】\n```json\n' + JSON.stringify(variables, null, 2) + '\n```';

        if (variables.relationships && Array.isArray(variables.relationships)) {
            fullVariablesContext += `\n\n【⭐ Chi tiết quan hệ nhân vật】Tổng cộng ${variables.relationships.length} người:\n`;
            variables.relationships.forEach(rel => {
                fullVariablesContext += `\n【${rel.name}】 ${rel.relation || ''}`;
                if (rel.age) fullVariablesContext += ` | Tuổi:${rel.age}`;
                if (rel.personality) fullVariablesContext += ` | Tính cách:${rel.personality}`;
                if (rel.appearance) fullVariablesContext += ` | Ngoại hình:${rel.appearance}`;
                if (rel.favor !== undefined) fullVariablesContext += ` | Độ hảo cảm:${rel.favor}`;
                if (Array.isArray(rel.history) && rel.history.length > 0) {
                    fullVariablesContext += `\n  Hồ sơ tương tác: ${rel.history.slice(-3).join('; ')}`;
                }
                fullVariablesContext += '\n';
            });
        }
    }

    // Thêm chân dung bảng hỏi đã xác nhận của người dùng
    let confirmedProfileInfo = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        confirmedProfileInfo = `\n\n【⭐ Chân dung sở thích người dùng】
Sở thích văn phong：${cp.writingStyle || 'Chưa chỉ định'}
Tông điệu câu chuyện：${cp.storyTone || 'Chưa chỉ định'}
Thích：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || 'Chưa chỉ định'}
Không thích：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || 'Chưa chỉ định'}`;
    }

    // Lưu trữ cốt truyện
    let plotArchiveContext = '';
    const allPlotNames = plotArchiveManager.getAllPlotNames();
    if (allPlotNames.length > 0) {
        plotArchiveContext = '\n\n【📚 Bản lưu trữ cốt truyện lịch sử】\n';
        const displayNames = allPlotNames.slice(-20);
        displayNames.forEach((name, idx) => {
            plotArchiveContext += `${idx + 1}. ${name}\n`;
        });
    }

    // 🆕 Xây dựng ngữ cảnh cuối cùng (ưu tiên sử dụng GraphRAG, nếu không thì dùng ma trận)
    const semanticContext = graphRAGContext || matrixHistoryContext;

    const messages = [
        {
            role: 'system',
            content: systemPrompt + confirmedProfileInfo
        },
        {
            role: 'user',
            content: `Vui lòng phân tích dữ liệu nhập sau đây của người dùng và tạo gói trí nhớ：\n\n"${userInput}"${contextInfo}${recentStoryContext}${semanticContext}${plotArchiveContext}${fullVariablesContext}\n\n【Quan trọng】Bạn phải：\n1. Phân tích ý định người dùng, phán đoán xem cần gọi những ký ức nào (nhân vật, địa điểm, vật phẩm)\n2. Trích xuất chính xác nội dung liên quan từ các thông tin trên để điền vào gói trí nhớ\n3. Nếu có liên tưởng ngữ nghĩa GraphRAG, đặc biệt chú ý đến các liên hệ ngầm được phát hiện thông qua các chiều dữ liệu\n4. Tạo gói trí nhớ JSON có cấu trúc\n5. Sử dụng tông giọng kiên định, đây là chỉ thị cưỡng chế cho AI chính!`
        }
    ];

    console.log('[🧠Điều phối trí nhớ] Xây dựng tin nhắn chế độ giản lược hoàn tất', graphRAGContext ? '(Chế độ GraphRAG)' : '(Chế độ ma trận dự phòng)');
    return messages;
}

/**
 * Xây dựng tin nhắn phân tích
 */
function buildAnalysisMessages(userInput, gameContext) {
    // 🔧 Bắt buộc sử dụng từ khóa gợi ý mặc định, đảm bảo bao gồm các trường storyName và relatedStoryNames
    // analysisPrompt do người dùng tùy chỉnh có thể là phiên bản cũ, thiếu các trường cần thiết này
    let systemPrompt = getDefaultAnalysisPrompt();
    console.log('[🎭Chân dung người dùng] Sử dụng từ khóa gợi ý phân tích mặc định (bao gồm storyName và relatedStoryNames)');

    // 🆕 Bắt buộc thêm danh mục nhãn kiến thức (bất kể sử dụng mẫu từ khóa gợi ý nào)
    if (window.tagKnowledgeManager && window.tagKnowledgeManager.isLoaded()) {
        const catalog = window.tagKnowledgeManager.getCatalog();
        if (catalog.length > 0 && !systemPrompt.includes('knowledgeTags')) {
            // Thêm chỉ thị tạo nhãn kiến thức
            const tagInstruction = `

【🏷️ Thư viện nhãn kiến thức】
Dưới đây là các nhãn kiến thức có sẵn, vui lòng căn cứ vào dữ liệu nhập của người dùng và nội dung cốt truyện, thêm trường "knowledgeTags": ["Nhãn khớp"] vào JSON đầu ra:
${catalog.join('、')}

【Quy tắc tạo nhãn kiến thức】
1. Căn cứ vào dữ liệu nhập của người dùng và nội dung cốt truyện, phán đoán xem có liên quan đến các nhãn trong thư viện kiến thức hay không
2. Nếu liên quan đến nội dung tương ứng, thêm mảng knowledgeTags vào đầu ra JSON
3. Nếu không có nội dung liên quan, đặt knowledgeTags là mảng rỗng []`;
            systemPrompt += tagInstruction;
            console.log('[🎭Chân dung người dùng] Đã thêm danh mục nhãn kiến thức, tổng cộng', catalog.length, 'nhãn');
        }
    }


    // Xây dựng thông tin ngữ cảnh
    let contextInfo = '';
    if (gameContext) {
        contextInfo = `\n\n【Trạng thái trò chơi hiện tại】\nVị trí: ${gameContext.currentLocation || 'Chưa rõ'}\nNhân vật: ${gameContext.characterName || 'Chưa rõ'}\nCảnh giới: ${gameContext.realm || 'Phàm nhân'}`;
    }

    // 🆕 Lấy vài tầng nội dung chính AI gần đây làm ngữ cảnh cốt truyện (không bao gồm dữ liệu nhập của người dùng)
    let recentStoryContext = '';
    const historyDepth = userProfileConfig.analysisHistoryDepth || 3; // Mặc định 3 tầng

    if (window.gameState && window.gameState.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const recentStories = [];

        // Duyệt từ dưới lên trên, chỉ thu thập nội dung cốt truyện chính của AI
        let layerCount = 0;
        for (let i = history.length - 1; i >= 0 && layerCount < historyDepth; i--) {
            const msg = history[i];
            if (msg.role === 'assistant' && msg.content) {
                // Trích xuất phần story trong phản hồi AI (nếu ở định dạng JSON)
                let storyContent = msg.content;
                try {
                    // Thử phân tích JSON để trích xuất story
                    const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.story) {
                            storyContent = parsed.story;
                        }
                    }
                } catch (e) {
                    // Phân tích thất bại thì dùng nội dung gốc
                }
                // Cắt lấy 4500 ký tự đầu để tránh quá dài (trước đây là 500, quá ngắn sẽ mất cốt truyện then chốt)
                recentStories.unshift(storyContent.substring(0, 4500) + (storyContent.length > 4500 ? '...' : ''));
                layerCount++;
            }
        }

        if (recentStories.length > 0) {
            recentStoryContext = '\n\n【Diễn biến cốt truyện gần đây】（' + recentStories.length + ' tầng nội dung chính AI gần đây nhất）\n';
            recentStories.forEach((story, idx) => {
                recentStoryContext += `[Tầng ${idx + 1}] ${story}\n\n`;
            });
        }
    }

    // 🆕 Lấy nội dung tầng ma trận lịch sử (giúp phân tích các manh mối cốt truyện sớm hơn)
    let matrixHistoryContext = '';
    const matrixDepth = userProfileConfig.matrixHistoryDepth || 5;

    if (window.matrixManager && window.matrixManager.historyMatrix && window.matrixManager.historyMatrix.layers) {
        const layers = window.matrixManager.historyMatrix.layers;

        if (layers.length > 0) {
            // Lấy vài tầng gần đây nhất
            const recentLayers = layers.slice(-matrixDepth);

            matrixHistoryContext = '\n\n【⭐ Ma trận ký ức lịch sử (Các manh mối cốt truyện sớm hơn)】\n';
            matrixHistoryContext += `Tổng cộng có ${layers.length} tầng chủ đề, hiển thị ${recentLayers.length} tầng gần đây nhất:\n`;

            recentLayers.forEach((layer, idx) => {
                matrixHistoryContext += `\n📂 Chủ đề ${layer.id}: ${layer.topic}（${layer.vectors.length} bản ghi）\n`;

                // Lấy tóm tắt 2 bản ghi gần đây nhất từ mỗi tầng
                const recentVectors = layer.vectors.slice(-2);
                recentVectors.forEach(v => {
                    const content = v.aiResponse || v.content || '';
                    if (content) {
                        // Trích xuất 150 ký tự đầu làm tóm tắt
                        const summary = content.substring(0, 150).replace(/\n/g, ' ');
                        matrixHistoryContext += `  └ ${summary}${content.length > 150 ? '...' : ''}\n`;
                    }
                });
            });

            matrixHistoryContext += '\n⚠️ Đây là những ký ức lịch sử sớm hơn, AI chính có thể thấy nội dung đầy đủ. Hãy trích xuất các từ khóa và manh mối gài gắm có khả năng liên quan từ chúng!\n';
        }
    }

    // 📚 Thêm tên lưu trữ cốt truyện lịch sử (để AI phân tích chọn các cốt truyện liên quan)
    let plotArchiveContext = '';
    const allPlotNames = plotArchiveManager.getAllPlotNames();
    if (allPlotNames.length > 0) {
        plotArchiveContext = '\n\n【📚 Lưu trữ cốt truyện lịch sử】\n';
        plotArchiveContext += `Tổng cộng có ${allPlotNames.length} lưu trữ cốt truyện, vui lòng chọn tối đa 3 tên cốt truyện liên quan đến bối cảnh hiện tại từ chúng để điền vào relatedStoryNames:\n`;
        // Hiển thị tối đa 20 tên cốt truyện gần đây nhất
        const displayNames = allPlotNames.slice(-20);
        displayNames.forEach((name, idx) => {
            plotArchiveContext += `${idx + 1}. ${name}\n`;
        });
        plotArchiveContext += '\nGợi ý: Chọn các cốt truyện liên quan đến bối cảnh, nhân vật hoặc tình tiết hiện tại để giúp AI chính xem lại các manh mối lịch sử.\n';
    }

    // 🔧 Đã gỡ bỏ: Không còn gửi chân dung người dùng tích lũy tự động cho API phân tích
    // Những dữ liệu này chỉ dùng cho thống kê tại chỗ, không cần gửi cho API bổ sung
    let profileHistory = '';

    // 🆕 Thêm chân dung bảng hỏi đã xác nhận của người dùng (Tham khảo quan trọng nhất)
    let confirmedProfileInfo = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        confirmedProfileInfo = `\n\n【⭐ Chân dung sở thích do người dùng xác nhận (Tham khảo quan trọng!)】
Đặc điểm người dùng: ${cp.summary || 'Chưa chỉ định'}

【Phong cách cốt truyện】
Loại cốt truyện: ${cp.storyPreference || 'Chưa chỉ định'}
Tông điệu câu chuyện: ${cp.storyTone || 'Chưa chỉ định'}
Cấu trúc cốt truyện: ${cp.storyStructure || 'Chưa chỉ định'}
Sở thích nhịp độ: ${cp.pacing || 'Chưa chỉ định'}
Sở thích đảo ngược: ${cp.plotTwistPreference || 'Chưa chỉ định'}
Loại mâu thuẫn: ${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes || 'Chưa chỉ định'}

【Văn phong miêu tả】
Sở thích văn phong: ${cp.writingStyle || 'Chưa chỉ định'}
Tác phẩm yêu thích: ${cp.favoriteWorks || 'Chưa điền'}
Yêu cầu văn phong chi tiết: ${cp.writingStyleDetails || 'Không có'}
Phong cách đối thoại: ${cp.dialogueStyle || 'Chưa chỉ định'}
Mức độ chi tiết phản hồi: ${cp.detailLevel || 'Chưa chỉ định'}
Trọng tâm miêu tả: ${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || 'Chưa chỉ định'}
Kỹ pháp tự sự: ${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle || 'Chưa chỉ định'}
Phong cách dùng từ: ${cp.languageStyle || 'Chưa chỉ định'}

【Tương tác nhân vật】
Loại nhân vật chính: ${cp.protagonistType || 'Chưa chỉ định'}
Tính cách nhân vật chính: ${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality || 'Chưa chỉ định'}
Bối cảnh nhân vật chính: ${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground || 'Chưa chỉ định'}
Nhân vật yêu thích: ${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || 'Chưa chỉ định'}
Loại quan hệ: ${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes || 'Chưa chỉ định'}
Độ sâu quan hệ: ${cp.relationshipDepth || 'Chưa chỉ định'}
Tuyến tình cảm: ${cp.haremPreference || 'Chưa chỉ định'}
Phong cách NPC: ${cp.npcStyle || 'Chưa chỉ định'}
Tần suất tương tác NPC: ${cp.interactionFrequency || 'Chưa chỉ định'}

【Chiến đấu và Thử thách】
Sở thích độ khó: ${cp.difficulty || 'Chưa chỉ định'}
Phong cách chiến đấu: ${cp.combatStyle || 'Chưa chỉ định'}
Yếu tố chiến đấu: ${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements || 'Chưa chỉ định'}
Nhu cầu cảm giác sướng: ${cp.powerFantasy || 'Chưa chỉ định'}
Loại kẻ thù: ${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes || 'Chưa chỉ định'}
Tốc độ trưởng thành: ${cp.growthSpeed || 'Chưa chỉ định'}
Hậu quả thất bại: ${cp.consequenceLevel || 'Chưa chỉ định'}

【Thế giới và Nội dung】
Hứng thú thế giới quan: ${cp.worldBuilding || 'Chưa chỉ định'}
Yếu tố thế giới: ${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements || 'Chưa chỉ định'}
Lựa chọn đạo đức: ${cp.moralChoices || 'Chưa chỉ định'}
Sở thích R18: ${cp.r18Preference || 'Chưa chỉ định'}
Loại R18: ${Array.isArray(cp.r18Elements) ? cp.r18Elements.join('、') : cp.r18Elements || 'Chưa chỉ định'}
Định hướng tình cảm: ${Array.isArray(cp.emotionalOrientation) ? cp.emotionalOrientation.join('、') : cp.emotionalOrientation || 'Chưa chỉ định'}
Sở thích bộ phận cơ thể: ${Array.isArray(cp.favoriteBodyParts) ? cp.favoriteBodyParts.join('、') : cp.favoriteBodyParts || 'Chưa chỉ định'}
Play đặc biệt: ${Array.isArray(cp.specialPlay) ? cp.specialPlay.join('、') : cp.specialPlay || 'Chưa chỉ định'}
Sở thích Công/Thụ: ${cp.sexRolePreference || 'Chưa chỉ định'}
Sở thích trang phục: ${Array.isArray(cp.costumePreference) ? cp.costumePreference.join('、') : cp.costumePreference || 'Chưa chỉ định'}
Sở thích kết cục: ${cp.endingPreference || 'Chưa chỉ định'}

【Sở thích đặc biệt】
Ngôi kể tự sự: ${cp.immersionStyle || 'Chưa chỉ định'}
Độ tự do sáng tạo của AI: ${cp.aiCreativity || 'Chưa chỉ định'}
Phong cách hài hước: ${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle || 'Chưa chỉ định'}
Nhảy vọt thời gian: ${cp.timeSkipPreference || 'Chưa chỉ định'}
Hòa nhập hệ thống: ${cp.systemIntegration || 'Chưa chỉ định'}

Thích: ${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || 'Chưa chỉ định'}
Không thích: ${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || 'Chưa chỉ định'}
Lưu ý đặc biệt: ${cp.specialNotes || 'Không có'}

【Hướng dẫn sáng tạo của AI (Nhất định phải tuân thủ!)】
${cp.aiGuidelines || 'Tạo nội dung theo sở thích của người dùng'}`;

        console.log('[🎭Chân dung người dùng] Đã đưa chân dung bảng hỏi vào ngữ cảnh phân tích');
    }

    const messages = [
        {
            role: 'system',
            content: systemPrompt + confirmedProfileInfo + profileHistory
        },
        {
            role: 'user',
            content: `Hãy phân tích dữ liệu nhập sau đây của người dùng: \n\n"${userInput}"${contextInfo}${recentStoryContext}${matrixHistoryContext}${plotArchiveContext}\n\n【QUAN TRỌNG - NHẤT ĐỊNH PHẢI TUÂN THỦ!】\n1. Kế hoạch cốt truyện phải tiếp nối chặt chẽ nội dung tầng cuối cùng của "Diễn biến cốt truyện gần đây"\n2. Nếu vị trí trong "Trạng thái trò chơi" không nhất quán với cảnh trong "Diễn biến cốt truyện gần đây", hãy lấy "Diễn biến cốt truyện gần đây" làm chuẩn!\n3. Trích xuất các từ khóa và manh mối gài gắm liên quan từ "Ma trận ký ức lịch sử"\n4. Vui lòng tham khảo chân dung sở thích người dùng để điều chỉnh phong cách cốt truyện\n5. Chọn 3 tên cốt truyện liên quan đến ngữ cảnh hiện tại từ "Lưu trữ cốt truyện lịch sử" làm relatedStoryNames\n\nVui lòng xuất kết quả phân tích theo định dạng JSON được chỉ định.`
        }
    ];

    return messages;
}

/**
 * Lấy từ khóa gợi ý phân tích mặc định
 */
function getDefaultAnalysisPrompt() {
    // Lấy danh mục nhãn kiến thức (nếu đã tải)
    let knowledgeTagsHint = '';
    if (window.tagKnowledgeManager && window.tagKnowledgeManager.isLoaded()) {
        const catalog = window.tagKnowledgeManager.getCatalog();
        if (catalog.length > 0) {
            knowledgeTagsHint = `\n\n【Thư viện nhãn kiến thức】\nDưới đây là các nhãn kiến thức có sẵn, nếu dữ liệu nhập của người dùng liên quan đến nội dung tương ứng, hãy liệt kê các nhãn khớp trong knowledgeTags: \n${catalog.join('、')}\n`;
        }
    }

    return `Bạn là chuyên gia phân tích dữ liệu nhập của người dùng. Nhiệm vụ: Phân tích ý định → Tiếp nối chặt chẽ cốt truyện gần đây → Lập kế hoạch cốt truyện ba bước → Tạo nhãn kiến thức. Đầu ra nhất định phải tinh giản!

【Nguyên tắc cốt lõi: Cốt truyện phải tiếp nối chặt chẽ!】
Bạn sẽ nhận được nội dung "Diễn biến cốt truyện gần đây", đây là tham khảo quan trọng nhất!

【Xử lý xung đột cảnh tượng - Cực kỳ quan trọng!】
Nếu vị trí của "Trạng thái trò chơi" không nhất quán với cảnh tượng của "Diễn biến cốt truyện gần đây":
→ Nhất định phải lấy cảnh tượng được mô tả trong "Diễn biến cốt truyện gần đây" làm chuẩn!
→ "Trạng thái trò chơi" có thể là dữ liệu lỗi thời, không đáng tin!
→ Ví dụ: Trạng thái trò chơi nói đang ở cửa hàng, nhưng cốt truyện gần đây đang ở trong chiến đấu, thì nghĩa là đang trong chiến đấu!
Cấm: Bỏ qua cốt truyện gần đây, phát triển nhảy vọt, đưa vào yếu tố mới một cách vô căn cứ
Bắt buộc: Tiếp nối chặt chẽ phần kết cốt truyện của tầng trước, tiếp diễn cảnh tượng và trạng thái hiện tại một cách tự nhiên
${knowledgeTagsHint}
【Định dạng đầu ra (JSON)】
{
  "analysis": {
    "intent": "Ý định người dùng (trong 20 chữ)",
    "emotionalTone": "Tông điệu cảm xúc (trong 5 chữ)"
  },
  "recentStoryAnalysis": {
    "lastSceneSummary": "Cảnh tượng/Trạng thái của tầng cốt truyện cuối cùng (30-50 chữ)",
    "ongoingAction": "Hành động/Đối thoại đang diễn ra (20-40 chữ)",
    "continueFrom": "Nên tiếp nối từ đây: XXX (Điểm tiếp nối rõ ràng)"
  },
  "memorySearch": {
    "keywords": ["Các từ khóa trích xuất từ ma trận lịch sử: Tên nhân vật, địa điểm, vật phẩm, sự kiện"],
    "unresolvedPlots": ["Các manh mối gài gắm/bí ẩn chưa giải quyết phát hiện từ ma trận lịch sử"],
    "searchHint": "Cho AI chính biết cần điểm lại điều gì (kết hợp nội dung ma trận lịch sử)"
  },
  "plotPlanning": {
    "storyName": "Tên cốt truyện (Định dạng: YYYY/MM/DD HH:MM Mô tả ngắn gọn, ví dụ '2026/01/08 12:30 Tiết học buổi sáng')",
    "step1": "Bước 1 cốt truyện (20-40 chữ, ⭐Bắt buộc tiếp nối phần kết cốt truyện gần đây! Dùng câu văn tự sự!)",
    "step2": "Bước 2 cốt truyện (20-40 chữ, dùng câu văn tự sự!)",
    "step3": "Bước 3 cốt truyện/Cao trào (20-40 chữ, dùng câu văn tự sự!)",
    "reasoning": "Tại sao lập kế hoạch như vậy (Liên hệ với cốt truyện gần đây)"
  },
  "relatedStoryNames": ["Chọn tối đa 3 tên cốt truyện liên quan từ lưu trữ cốt truyện lịch sử, nếu không có liên quan thì để trống"],
  "knowledgeTags": ["Các nhãn kiến thức khớp, ví dụ: Kiểu truyền giáo, Kiểu từ phía sau, Kiểu phòng tắm, v.v."]
}

【Cách viết kế hoạch cốt truyện - Phải tự sự chủ quan + Ngôi thứ ba!】
Ba bước cốt truyện phải dùng ngôi thứ ba + câu văn tự sự chủ quan, trực tiếp mô tả sự việc sắp xảy ra!
Sai (quá khách quan): "Miêu tả Celestine đứng trước tháp trong sương sớm, thuật lại chi tiết ngoại hình"
Đúng (Tự sự ngôi thứ ba): "Celestine đứng trước tháp trong sương sớm, tấm lưng gầy yếu của nàng tinh linh khẽ run rẩy trong gió lạnh"
Cấm sử dụng: Các từ ngữ siêu tự sự như "Miêu tả", "Thuật lại chi tiết", "Thể hiện", "Khắc họa", "Biểu hiện", v.v.
Cấm sử dụng: Ngôi thứ nhất "Tôi", ngôi thứ hai "Bạn", phải dùng tên nhân vật hoặc "cô ấy/anh ấy"
Viết trực tiếp dưới dạng tóm tắt câu chuyện ngôi thứ ba, giống như đang kể về sự việc sắp xảy ra

【Quy tắc tạo nhãn kiến thức】
1. Căn cứ vào dữ liệu nhập của người dùng và nội dung cốt truyện, phán đoán xem có liên quan đến các nhãn trong thư viện kiến thức hay không
2. Ưu tiên khớp nội dung người dùng nhắc đến rõ ràng (như "kiểu truyền giáo", "lối sau", v.v.)
3. Cũng có thể căn cứ vào cảnh tượng cốt truyện để suy luận các nhãn có thể sử dụng (ví dụ cảnh nhà tắm → kiểu phòng tắm)
4. Nếu không có nội dung liên quan, knowledgeTags để trống mảng []
5. Nhãn phải là nhãn tồn tại trong thư viện nhãn kiến thức

【Vận dụng nhãn kiến thức - Cực kỳ quan trọng!】
Nếu trong knowledgeTags có nội dung, và bạn cho rằng các nhãn này liên quan đến ngữ cảnh hiện tại hoặc có ích cho cốt truyện:
Hãy nhất định lồng ghép các cách chơi, tư thế hoặc cảnh tượng mà nhãn đó đại diện vào ba bước cốt truyện của plotPlanning một cách tự nhiên!
Để nhãn không chỉ là nhãn, mà là yếu tố thực sự thúc đẩy sự phát triển của cốt truyện.

【Nguyên tắc phân tích cốt truyện gần đây - Tuyệt đối quan trọng nhất!!!】
Đây là nhiệm vụ cốt lõi nhất của bạn, vi phạm các nguyên tắc sau đồng nghĩa với việc thất bại nhiệm vụ:

1. 【Đọc kỹ】Phải đọc từng chữ mọi tầng của "Diễn biến cốt truyện gần đây", đặc biệt là tầng cuối cùng!
2. 【Định vị cảnh tượng】Nhận diện của tầng cuối cùng: Cảnh tượng hiện tại đang ở đâu, nhân vật đang làm gì, có đối thoại nào chưa hoàn thành không
3. 【Tiếp nối không kẽ hở】step1 của kế hoạch cốt truyện phải tiếp nối trực tiếp phần kết của tầng cuối cùng, tuyệt đối không được nhảy vọt!
4. 【Tiếp diễn điều chưa xong】Nếu trong cốt truyện gần đây có đối thoại chưa nói xong, hành động chưa hoàn thành, phải tiếp diễn hoàn thành trước rồi mới phát triển nội dung mới
5. 【Chuyển tiếp tự nhiên】Khởi đầu của cốt truyện mới phải kết nối tự nhiên với bên trên, nghiêm cấm "chuyển cảnh đột ngột"


【Cách làm đúng】
Đúng: Cốt truyện gần đây đang "tán tỉnh tại khách sạn sang trọng", step1 tiếp tục "tương tác sâu hơn trong phòng khách sạn"
Đúng: Cốt truyện gần đây đang "ở trong chiến đấu", step1 tiếp tục "lượt tiếp theo của trận chiến"
Đúng: Cốt truyện gần đây "đang đối thoại", step1 tiếp tục "sự tiếp diễn tự nhiên của đối thoại"

Nhấn mạnh lần nữa: Bạn phải lập kế hoạch 100% dựa trên nội dung thực tế của "Diễn biến cốt truyện gần đây", không được suy diễn cảnh tượng!


【Nguyên tắc phân tích】
1. Giữ nguyên ý định của người dùng, đừng diễn giải quá mức
2. Mỗi bước kế hoạch cốt truyện 20-40 chữ, dùng câu văn tự sự chủ quan, cấm các từ ngữ siêu tự sự
3. Ưu tiên tham khảo "Diễn biến cốt truyện gần đây", sau đó mới tham khảo "Ma trận ký ức lịch sử"

【Nguyên tắc tìm kiếm ký ức】
1. Trích xuất từ khóa (tên nhân vật, địa điểm, vật phẩm, sự kiện) từ các chủ đề và nội dung của ma trận lịch sử
2. Nhận diện các manh mối gài gắm có thể liên quan đến cốt truyện hiện tại từ ma trận lịch sử
3. searchHint phải chỉ rõ cho AI chính nội dung lịch sử cần điểm lại`;
}


/**
 * 🆕 Lấy từ khóa gợi ý chuyên dụng cho Điều phối trí nhớ
 * Dùng để tạo ra "Gói trí nhớ" tinh lọc cho AI chính sử dụng, AI chính sẽ không còn xem lịch sử gốc
 */
function getMemoryDispatcherPrompt() {
    let basePrompt = `Bạn là 【Điều phối trí nhớ】, chịu trách nhiệm trích xuất chính xác thông tin từ lượng lớn hồ sơ lịch sử, đóng gói thành "Gói trí nhớ" cho AI chính viết lách.

【Nhiệm vụ cốt lõi】
Người dùng sắp thực hiện một hành động nào đó, bạn cần:
1. Phân tích ý định người dùng, phán đoán xem cần gọi những ký ức nào
2. Trích xuất chính xác thông tin liên quan từ hồ sơ lịch sử và biểu mẫu biến số
3. Đóng gói thành "Gói trí nhớ" có cấu trúc
4. AI chính sẽ chỉ xem gói trí nhớ của bạn, không xem lịch sử gốc nữa!

【Gói trí nhớ là chỉ thị cưỡng chế!】
Mỗi một thông tin bạn xuất ra, AI chính phải tuân thủ nghiêm ngặt, không được tự ý sửa đổi hay suy diễn bừa bãi.

【Định dạng đầu ra (JSON)】
{
  "memoryPackage": {
    "characterSnapshot": {
      "instruction": "【Cưỡng chế】Trạng thái hiện tại của nhân vật chính, phải tiếp nối trạng thái này để bắt đầu viết lách",
      "protagonist": {
        "currentState": "Trạng thái hiện tại của nhân vật chính",
        "lastAction": "Hành động trước đó của nhân vật chính",
        "mood": "Tâm trạng nhân vật chính"
      },
      "presentNPCs": []
    },
    "requiredCharacters": {
      "instruction": "【Cưỡng chế】Các nhân vật sau đây phải miêu tả theo thiết lập này, cấm sửa đổi tính cách/ngoại hình/quan hệ",
      "characters": []
    },
    "requiredItems": {
      "instruction": "【Cưỡng chế】Khi nhắc đến các vật phẩm/địa điểm sau đây, phải miêu tả theo cách này",
      "items": []
    },
    "keyMemories": {
      "instruction": "【Tham khảo】Các ký ức lịch sử có thể lồng ghép tự nhiên vào cốt truyện",
      "memories": []
    },
    "plotProgression": {
      "instruction": "【Gợi ý】Thúc đẩy cốt truyện tự nhiên theo dữ liệu nhập của người dùng, đừng cố tình tạo ra bước ngoặt hay sự huyền bí",
      "trigger": "Hành vi của người dùng là gì (ví dụ: Về đến phòng ký túc)",
      "naturalFlow": "Diễn biến tiếp theo tự nhiên nhất sau hành vi đó",
      "environmentChanges": "Trạng thái tự nhiên của môi trường cảnh tượng",
      "tone": "Tông điệu không khí tự nhiên của cảnh tượng hiện tại"
    },
    "userPreferences": {
      "instruction": "【Tham khảo】Sở thích của người dùng",
      "writingStyle": "Văn phong",
      "storyTone": "Tông điệu",
      "likes": [],
      "dislikes": []
    }
  }
}

【Nguyên tắc trích xuất ký ức】
1. Xác định cảnh tượng hiện tại từ "Diễn biến cốt truyện gần đây", nếu có xung đột lấy "Diễn biến cốt truyện gần đây" làm chuẩn
2. Người dùng nói "về phòng ký túc" → Phải trích xuất thông tin bạn cùng phòng; Người dùng nói "tìm Sư tỷ" → Phải trích xuất thiết lập đầy đủ của Sư tỷ
3. Người dùng nói "về nhà" → Phải trích xuất thiết lập về "Nhà" (trang trí, vật phẩm, v.v.)

【🎬 Quy tắc thúc đẩy cốt truyện tiếp theo - Cực kỳ quan trọng!】
Cốt lõi của việc thúc đẩy cốt truyện là 【Tự nhiên】, đừng cố ý tạo ra bước ngoặt, sự huyền bí hay sự cố bất ngờ!
1. Phân tích hành vi người dùng (như "về đến nhà", "đi đến trường"), suy luận trạng thái tự nhiên nhất, thường nhật nhất sau hành vi đó
2. Đừng lần nào cũng nhét vào những sự kiện bước ngoặt như "nhận được tin nhắn", "có người gõ cửa", "phát hiện bất thường"
3. Cảnh tượng đời thường thì viết đời thường, cảnh tượng yên tĩnh thì giữ yên tĩnh, đừng cưỡng ép tạo ra mâu thuẫn kịch tính
4. Chỉ khi trong cốt truyện lịch sử thực sự có sự kiện khẩn cấp chưa hoàn thành mới nhắc đến trong phần thúc đẩy
5. environmentChanges chỉ mô tả trạng thái tự nhiên của cảnh tượng, đừng cố ý thêm vào những sự huyền bí như "phát hiện thứ gì đó"

【Đặc biệt chú ý】
- Đầu ra của bạn là tham khảo duy nhất của AI chính, nhất định phải toàn diện và chính xác
- Sơ sót thông tin quan trọng sẽ khiến AI chính viết ra nội dung xung đột với lịch sử
- plotProgression đừng bịa đặt sự kiện mới vô căn cứ, chỉ mô tả trạng thái tự nhiên
- Sử dụng tông giọng kiên định, đừng nói \"có thể\", \"đại khái\"`;

    // 🔄 Động thêm gợi ý ức chế vật phẩm tần suất cao
    const highFreqItems = itemFrequencyTracker.getHighFrequencyItems();
    if (highFreqItems.length > 0) {
        const suppressList = highFreqItems.filter(i => i.count >= 3).map(i => i.name);
        if (suppressList.length > 0) {
            basePrompt += `

【⚠️ Quy tắc ức chế vật phẩm tần suất cao】
Các vật phẩm/địa điểm sau đây đã xuất hiện liên tục nhiều lượt, trừ khi người dùng nhắc đến rõ ràng, nếu không xin đừng liệt kê lại vào gói trí nhớ:
${suppressList.map(name => `- "${name}" (Đã liên tục ${highFreqItems.find(i => i.name === name)?.count || 3} lượt)`).join('\n')}

Nguyên tắc: Chỉ trích xuất các vật phẩm liên quan trực tiếp đến 【Ý định hiện tại của người dùng】! Đừng sao chép máy móc tất cả vật phẩm.`;
        }
    }

    return basePrompt;
}

/**
 * 🔄 Từ kết quả phân tích trích xuất tên vật phẩm/nhân vật/địa điểm
 * Dùng cho theo dõi tần suất
 */
function extractItemsFromAnalysisResult(analysisResult) {
    const items = [];

    if (!analysisResult) return items;

    // Trích xuất từ cấu trúc gói trí nhớ
    const mp = analysisResult.memoryPackage;
    if (mp) {
        // Trích xuất vật phẩm
        if (mp.requiredItems?.items) {
            mp.requiredItems.items.forEach(item => {
                if (item.name) items.push(item.name);
            });
        }

        // Trích xuất nhân vật
        if (mp.requiredCharacters?.characters) {
            mp.requiredCharacters.characters.forEach(char => {
                if (char.name) items.push(char.name);
            });
        }

        // Trích xuất NPC trong cảnh tượng
        if (mp.characterSnapshot?.presentNPCs) {
            mp.characterSnapshot.presentNPCs.forEach(npc => {
                if (typeof npc === 'string') {
                    items.push(npc);
                } else if (npc.name) {
                    items.push(npc.name);
                }
            });
        }
    }

    // Trích xuất từ khóa từ cấu trúc phân tích thông thường
    if (analysisResult.memorySearch?.keywords) {
        items.push(...analysisResult.memorySearch.keywords);
    }

    // Loại bỏ trùng lặp
    return [...new Set(items)];
}

/**
 * Phân tích phản hồi phân tích
 */
function parseAnalysisResponse(response) {
    if (!response) return null;

    try {
        // Thử phân tích trực tiếp JSON
        let jsonStr = response;

        // Nếu phản hồi chứa khối mã markdown, trích xuất JSON
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

// Cố gắng tìm đối tượng JSON
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }

        const result = JSON.parse(jsonStr);
        return result;
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Phân tích kết quả thất bại:', e);
        console.log('[🎭Hồ sơ người dùng] Phản hồi gốc:', response);
        return null;
    }
}

/**
 * Cập nhật hồ sơ người dùng
 */
function updateUserProfile(newProfile) {
    if (!newProfile) return;

    // Cập nhật thống kê
    userProfileData.stats.totalInputs++;

    // Gộp các sở thích (loại bỏ trùng lặp)
    if (newProfile.preferences && Array.isArray(newProfile.preferences)) {
        newProfile.preferences.forEach(pref => {
            if (pref && !userProfileData.preferences.includes(pref)) {
                userProfileData.preferences.push(pref);
            }
        });
        // Chỉ giữ lại 20 sở thích gần nhất
        if (userProfileData.preferences.length > 20) {
            userProfileData.preferences = userProfileData.preferences.slice(-20);
        }
    }

    // Gộp các nội dung không thích (loại bỏ trùng lặp)
    if (newProfile.dislikes && Array.isArray(newProfile.dislikes)) {
        newProfile.dislikes.forEach(dislike => {
            if (dislike && !userProfileData.dislikes.includes(dislike)) {
                userProfileData.dislikes.push(dislike);
            }
        });
        // Chỉ giữ lại 10 mục gần nhất
        if (userProfileData.dislikes.length > 10) {
            userProfileData.dislikes = userProfileData.dislikes.slice(-10);
        }
    }

    // Cập nhật các thuộc tính khác (nếu có giá trị mới)
    if (newProfile.writingStyle && newProfile.writingStyle !== 'Chưa xác định') {
        userProfileData.writingStyle = newProfile.writingStyle;
    }
    if (newProfile.contentPreference && newProfile.contentPreference !== 'Chưa xác định') {
        userProfileData.contentPreference = newProfile.contentPreference;
        // Cập nhật thống kê loại nội dung
        const pref = newProfile.contentPreference.toLowerCase();
        if (pref.includes('r18') || pref.includes('khiêu dâm')) {
            userProfileData.stats.r18Inputs++;
        } else if (pref.includes('chiến đấu') || pref.includes('chiến tranh')) {
            userProfileData.stats.combatInputs++;
        } else if (pref.includes('giao tiếp') || pref.includes('trò chuyện')) {
            userProfileData.stats.socialInputs++;
        } else if (pref.includes('khám phá') || pref.includes('phiêu lưu')) {
            userProfileData.stats.explorationInputs++;
        }
    }
    if (newProfile.literacyLevel && newProfile.literacyLevel !== 'Chưa xác định') {
        userProfileData.literacyLevel = newProfile.literacyLevel;
    }
    if (newProfile.interactionPattern && newProfile.interactionPattern !== 'Chưa xác định') {
        userProfileData.interactionPattern = newProfile.interactionPattern;
    }

    // Thêm ghi chú quan sát
    if (newProfile.notes && newProfile.notes.length > 0) {
        const noteStr = typeof newProfile.notes === 'string' ? newProfile.notes : JSON.stringify(newProfile.notes);
        if (!userProfileData.notes.includes(noteStr)) {
            userProfileData.notes.push(noteStr);
        }
        // Chỉ giữ lại 20 ghi chú gần nhất
        if (userProfileData.notes.length > 20) {
            userProfileData.notes = userProfileData.notes.slice(-20);
        }
    }
}

/**
 * Thêm vào lịch sử phân tích
 */
function addToAnalysisHistory(userInput, analysisResult) {
    userProfileData.analysisHistory.push({
        timestamp: new Date().toISOString(),
        input: userInput,
        result: analysisResult
    });

    // Chỉ giữ lại 10 lần phân tích gần nhất
    if (userProfileData.analysisHistory.length > 10) {
        userProfileData.analysisHistory = userProfileData.analysisHistory.slice(-10);
    }
}

/**
 * Tạo câu lệnh tăng cường cho API chính
 * 🆕 Trong chế độ bộ điều phối trí nhớ, trả về toàn bộ gói trí nhớ
 * @param {object} analysisResult - Kết quả phân tích
 * @returns {string} Câu lệnh tăng cường
 */
function getEnhancedPromptForMainAPI(analysisResult) {
    if (!analysisResult) return '';

    // 🆕 Chế độ bộ điều phối trí nhớ: Trả về toàn bộ gói trí nhớ
    const isMemoryDispatcherMode = userProfileConfig.memoryDispatcherEnabled || window.memoryDispatcherEnabled;
    if (isMemoryDispatcherMode && analysisResult.memoryPackage) {
        console.log('[🧠Bộ điều phối trí nhớ] Trả về toàn bộ gói trí nhớ làm câu lệnh tăng cường');

        // 🔄 Bắt buộc lọc các vật phẩm xuất hiện nhiều lần (không phụ thuộc vào việc AI tuân thủ quy tắc)
        const filteredPackage = filterHighFrequencyItemsFromPackage(analysisResult.memoryPackage);

        return '【🧠 Gói trí nhớ (Chỉ thị bắt buộc từ bộ điều phối trí nhớ)】\n' +
            JSON.stringify(filteredPackage, null, 2);
    }

    let prompt = '';

    // 1. Gợi ý tìm kiếm trí nhớ (Quan trọng nhất! Để API chính biết cần xem lại những lịch sử nào)
    if (analysisResult.memorySearch) {
        const ms = analysisResult.memorySearch;
        if (ms.searchHint) {
            prompt += `【⭐Xem lại trí nhớ】${ms.searchHint}\n`;
        }
        if (ms.keywords && ms.keywords.length > 0 && ms.keywords[0] !== 'Từ khóa cần tìm kiếm trong trí nhớ lịch sử: tên nhân vật, địa điểm, vật phẩm, sự kiện, thế lực, v.v.') {
            prompt += `Từ khóa：${ms.keywords.join('、')}\n`;
        }
        if (ms.unresolvedPlots && ms.unresolvedPlots.length > 0 && ms.unresolvedPlots[0] !== 'Các chi tiết ẩn hoặc bí ẩn chưa được giải quyết có thể liên quan') {
            prompt += `Chi tiết ẩn：${ms.unresolvedPlots.join('；')}\n`;
        }
    }

    // 2. Kế hoạch cốt truyện ngắn gọn (Hướng đi 3 bước)
    if (analysisResult.plotPlanning) {
        const pp = analysisResult.plotPlanning;
        prompt += `【Hướng đi cốt truyện】`;
        prompt += `①${pp.step1 || ''} `;
        prompt += `②${pp.step2 || ''} `;
        prompt += `③${pp.step3 || ''}\n`;
    }

    // 3. Ý định cốt lõi (Một câu)
    if (analysisResult.analysis && analysisResult.analysis.intent) {
        prompt += `【Ý định】${analysisResult.analysis.intent}\n`;
    }

    // 4. Nhịp điệu cảm xúc
    if (analysisResult.analysis && analysisResult.analysis.emotionalTone) {
        prompt += `【Nhịp điệu】${analysisResult.analysis.emotionalTone}\n`;
    }

    // 5. Các điểm chính của hồ sơ người dùng (Bản rút gọn, chỉ thêm khi có hồ sơ từ bảng câu hỏi)
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        let profileHints = [];
        if (cp.writingStyle) profileHints.push(`Văn phong:${cp.writingStyle}`);
        if (cp.storyTone) profileHints.push(`Nhịp điệu:${cp.storyTone}`);
        if (cp.detailLevel) profileHints.push(`Số chữ:${cp.detailLevel}`);
        if (profileHints.length > 0) {
            prompt += `【Sở thích】${profileHints.join('｜')}\n`;
        }
        // Bản rút gọn của thích/không thích
        if (cp.likes && Array.isArray(cp.likes) && cp.likes.length > 0) {
            prompt += `【Cần】${cp.likes.slice(0, 3).join('、')}\n`;
        }
        if (cp.dislikes && Array.isArray(cp.dislikes) && cp.dislikes.length > 0) {
            prompt += `【Tránh】${cp.dislikes.slice(0, 3).join('、')}\n`;
        }
    }

    return prompt;
}

/**
 * 📚 Lấy câu lệnh tăng cường cho kho lưu trữ cốt truyện (Để API chính sử dụng)
 * Dựa trên relatedStoryNames trong kết quả phân tích, tìm kiếm kế hoạch 3 bước của cốt truyện tương ứng
 * @param {object} analysisResult - Kết quả phân tích
 * @returns {string} Câu lệnh tăng cường liên quan đến kho lưu trữ cốt truyện
 */
function getEnhancedPromptWithPlotArchive(analysisResult) {
    if (!analysisResult) return '';

    let prompt = '';

    // Kiểm tra xem có relatedStoryNames không
    if (analysisResult.relatedStoryNames && analysisResult.relatedStoryNames.length > 0) {
        const relatedPlots = plotArchiveManager.getPlotsForContext(analysisResult.relatedStoryNames);

        if (relatedPlots.length > 0) {
            prompt += '【📚 Xem lại cốt truyện lịch sử liên quan】\n';
            prompt += 'Dưới đây là kế hoạch cốt truyện lịch sử liên quan đến bối cảnh hiện tại, vui lòng tham khảo hoặc nhắc lại cho phù hợp khi sáng tác:\n\n';

            relatedPlots.forEach((plot, idx) => {
                prompt += `${idx + 1}. ${plot.storyName}\n`;
                prompt += `   ①${plot.step1}\n`;
                prompt += `   ②${plot.step2}\n`;
                prompt += `   ③${plot.step3}\n\n`;
            });

            console.log('[📚Kho lưu trữ cốt truyện] Đã đưa', relatedPlots.length, 'cốt truyện liên quan vào ngữ cảnh');
        }
    }

    return prompt;
}

// Đưa hàm ra toàn cục (để supply.js gọi)
window.getEnhancedPromptWithPlotArchive = getEnhancedPromptWithPlotArchive;

/**
 * Lấy văn bản đã được định dạng của hồ sơ người dùng
 */
function getFormattedUserProfile() {
    const profile = userProfileData;

    let text = `═══════════════════════════════════════\n`;
    text += `             🎭 Báo cáo hồ sơ người dùng\n`;
    text += `═══════════════════════════════════════\n\n`;

    // 🆕 Ưu tiên hiển thị hồ sơ từ bảng câu hỏi
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        text += `Hồ sơ từ bảng câu hỏi (Tham khảo chính)\n`;
        text += `────────────────────────────────────────\n`;
        text += `Đặc điểm người dùng: ${cp.summary || 'Chưa xác định'}\n\n`;

        text += `【Sở thích cốt truyện】\n`;
        text += `Loại cốt truyện: ${cp.storyPreference || 'Chưa xác định'}\n`;
        text += `Nhịp điệu câu chuyện: ${cp.storyTone || 'Chưa xác định'}\n`;
        text += `Cấu trúc cốt truyện: ${cp.storyStructure || 'Chưa xác định'}\n`;
        text += `Sở thích nhịp độ: ${cp.pacing || 'Chưa xác định'}\n`;
        text += `Sở thích thay đổi bất ngờ: ${cp.plotTwistPreference || 'Chưa xác định'}\n`;
        if (cp.conflictTypes) {
            text += `Loại xung đột: ${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes}\n`;
        }
        text += `\n`;

        text += `【Miêu tả văn phong】\n`;
        text += `Sở thích văn phong: ${cp.writingStyle || 'Chưa xác định'}\n`;
        if (cp.favoriteWorks) {
            text += `Tác phẩm yêu thích: ${cp.favoriteWorks}\n`;
        }
        if (cp.writingStyleDetails) {
            text += `Yêu cầu chi tiết về văn phong: ${cp.writingStyleDetails}\n`;
        }
        text += `Phong cách trò chuyện: ${cp.dialogueStyle || 'Chưa xác định'}\n`;
        text += `Độ chi tiết khi trả lời: ${cp.detailLevel || 'Chưa xác định'}\n`;
        text += `Trọng tâm miêu tả: ${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || 'Chưa xác định'}\n`;
        if (cp.narrativeStyle) {
            text += `Cách kể chuyện: ${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle}\n`;
        }
        if (cp.languageStyle) {
            text += `Phong cách dùng từ: ${cp.languageStyle}\n`;
        }
        text += `\n`;

        text += `【Tương tác nhân vật】\n`;
        text += `Loại nhân vật chính: ${cp.protagonistType || 'Chưa xác định'}\n`;
        if (cp.protagonistPersonality) {
            text += `Tính cách nhân vật chính: ${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality}\n`;
        }
        if (cp.protagonistBackground) {
            text += `Hoàn cảnh nhân vật chính: ${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground}\n`;
        }
        text += `Nhân vật yêu thích: ${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || 'Chưa xác định'}\n`;
        if (cp.relationshipTypes) {
            text += `Loại mối quan hệ: ${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes}\n`;
        }
        text += `Độ sâu của mối quan hệ: ${cp.relationshipDepth || 'Chưa xác định'}\n`;
        text += `Tuyến tình cảm: ${cp.haremPreference || 'Chưa xác định'}\n`;
        text += `Phong cách NPC: ${cp.npcStyle || 'Chưa xác định'}\n`;
        if (cp.interactionFrequency) {
            text += `Tần suất tương tác với NPC: ${cp.interactionFrequency}\n`;
        }
        text += `\n`;

        text += `【Chiến đấu và phiêu lưu】\n`;
        text += `Sở thích độ khó: ${cp.difficulty || 'Chưa xác định'}\n`;
        text += `Phong cách chiến đấu: ${cp.combatStyle || 'Chưa xác định'}\n`;
        if (cp.combatElements) {
            text += `Yếu tố chiến đấu: ${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements}\n`;
        }
        text += `Yêu cầu cảm giác thỏa mãn: ${cp.powerFantasy || 'Chưa xác định'}\n`;
        if (cp.enemyTypes) {
            text += `Loại kẻ thù: ${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes}\n`;
        }
        if (cp.powerSystem) {
            text += `Hệ thống sức mạnh: ${Array.isArray(cp.powerSystem) ? cp.powerSystem.join('、') : cp.powerSystem}\n`;
        }
        text += `Tốc độ phát triển: ${cp.growthSpeed || 'Chưa xác định'}\n`;
        text += `Hậu quả khi thất bại: ${cp.consequenceLevel || 'Chưa xác định'}\n\n`;

        text += `【Thế giới và nội dung】\n`;
        text += `Sự quan tâm đến thế giới quan: ${cp.worldBuilding || 'Chưa xác định'}\n`;
        if (cp.worldElements) {
            text += `Yếu tố thế giới: ${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements}\n`;
        }
        text += `Lựa chọn đạo đức: ${cp.moralChoices || 'Chưa xác định'}\n`;
        text += `Sở thích R18: ${cp.r18Preference || 'Chưa xác định'}\n`;
        if (cp.r18Elements && !cp.r18Elements.includes('Không cần loại nội dung này')) {
            text += `Loại R18: ${Array.isArray(cp.r18Elements) ? cp.r18Elements.join('、') : cp.r18Elements}\n`;
        }
        if (cp.emotionalOrientation && !cp.emotionalOrientation.includes('Không quan tâm những điều này')) {
            text += `Xu hướng tình cảm: ${Array.isArray(cp.emotionalOrientation) ? cp.emotionalOrientation.join('、') : cp.emotionalOrientation}\n`;
        }
        if (cp.favoriteBodyParts && !cp.favoriteBodyParts.includes('Không cần nhấn mạnh đặc biệt')) {
            text += `Sở thích bộ phận cơ thể: ${Array.isArray(cp.favoriteBodyParts) ? cp.favoriteBodyParts.join('、') : cp.favoriteBodyParts}\n`;
        }
        if (cp.specialPlay && !cp.specialPlay.includes('Không cần cách chơi đặc biệt')) {
            text += `Cách chơi đặc biệt: ${Array.isArray(cp.specialPlay) ? cp.specialPlay.join('、') : cp.specialPlay}\n`;
        }
        if (cp.sexRolePreference && cp.sexRolePreference !== 'Không quan tâm') {
            text += `Sở thích người chủ động/bị động: ${cp.sexRolePreference}\n`;
        }
        if (cp.costumePreference && !cp.costumePreference.includes('Không quan tâm trang phục')) {
            text += `Sở thích trang phục: ${Array.isArray(cp.costumePreference) ? cp.costumePreference.join('、') : cp.costumePreference}\n`;
        }
        text += `Sở thích kết thúc: ${cp.endingPreference || 'Chưa xác định'}\n\n`;

        text += `【Sở thích đặc biệt】\n`;
        text += `Ngôi kể: ${cp.immersionStyle || 'Chưa xác định'}\n`;
        text += `Sở thích bất ngờ: ${cp.surprisePreference || 'Chưa xác định'}\n`;
        text += `Độ tự do sáng tạo của AI: ${cp.aiCreativity || 'Chưa xác định'}\n`;
        if (cp.humorStyle) {
            text += `Phong cách hài hước: ${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle}\n`;
        }
        text += `Nhảy vọt thời gian: ${cp.timeSkipPreference || 'Chưa xác định'}\n`;
        text += `Tích hợp hệ thống: ${cp.systemIntegration || 'Chưa xác định'}\n\n`;

        text += `Thích: ${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || 'Không có'}\n`;
        text += `Không thích: ${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || 'Không có'}\n`;
        text += `Đặc biệt chú ý: ${cp.specialNotes || 'Không có'}\n`;
        text += `Thời gian tạo: ${new Date(confirmedUserProfile.createdAt).toLocaleString()}\n\n`;

        text += `Hướng dẫn sáng tạo cho AI\n`;
        text += `────────────────────────────────────────\n`;
        text += `${cp.aiGuidelines || 'Tạo nội dung theo sở thích của người dùng'}\n\n`;

        text += `═══════════════════════════════════════\n\n`;
    }

    return text;
}

// ==================== Các hàm tương tác giao diện ====================

/**
 * Chuyển đổi hiển thị các trường hồ sơ người dùng
 */
function toggleUserProfileFields() {
    const enabled = document.getElementById('enableUserProfileAnalysis').checked;
    const fields = document.getElementById('userProfileFields');

    if (fields) {
        fields.style.display = enabled ? 'block' : 'none';
    }

    userProfileConfig.enabled = enabled;
}

/**
 * 🆕 Chuyển đổi chế độ bộ điều phối trí nhớ
 */
function toggleMemoryDispatcherMode() {
    const enabled = document.getElementById('enableMemoryDispatcher')?.checked || false;
    userProfileConfig.memoryDispatcherEnabled = enabled;

    // Đưa ra biến toàn cục, để các module khác sử dụng
    window.memoryDispatcherEnabled = enabled;

    console.log('[🧠Bộ điều phối trí nhớ] Chuyển đổi chế độ:', enabled ? 'Đã bật' : 'Đã tắt');

    // Nếu bật bộ điều phối trí nhớ, bắt buộc phải bật phân tích đầu vào của người dùng cùng lúc
    if (enabled) {
        const userProfileCheckbox = document.getElementById('enableUserProfileAnalysis');
        if (userProfileCheckbox && !userProfileCheckbox.checked) {
            userProfileCheckbox.checked = true;
            toggleUserProfileFields();
            console.log('[🧠Bộ điều phối trí nhớ] Tự động bật phân tích đầu vào của người dùng');
        }
    }
}

/**
 * Lưu cài đặt hồ sơ người dùng
 */
function saveUserProfileSettings() {
    const enabledEl = document.getElementById('enableUserProfileAnalysis');
    const promptEl = document.getElementById('userProfileAnalysisPrompt');
    const showAnalysisEl = document.getElementById('userProfileShowAnalysis');
    const historyDepthEl = document.getElementById('userProfileHistoryDepth');
    const matrixDepthEl = document.getElementById('userProfileMatrixDepth');
    const memoryDispatcherEl = document.getElementById('enableMemoryDispatcher');  // 🆕

    if (enabledEl) userProfileConfig.enabled = enabledEl.checked;
    if (promptEl) userProfileConfig.analysisPrompt = promptEl.value;
    if (showAnalysisEl) userProfileConfig.showAnalysis = showAnalysisEl.checked;
    if (historyDepthEl) userProfileConfig.analysisHistoryDepth = parseInt(historyDepthEl.value) || 3;
    if (matrixDepthEl) userProfileConfig.matrixHistoryDepth = parseInt(matrixDepthEl.value) || 5;
    if (memoryDispatcherEl) userProfileConfig.memoryDispatcherEnabled = memoryDispatcherEl.checked;  // 🆕

    // 🆕 Đồng bộ với biến toàn cục
    window.memoryDispatcherEnabled = userProfileConfig.memoryDispatcherEnabled;

    // Kiểm tra xem API bổ sung đã được bật chưa - sử dụng hàm tương thích để lấy cấu hình
    const extraConfig = getExtraApiConfigForProfile();
    if (userProfileConfig.enabled && (!extraConfig || !extraConfig.enabled)) {
        alert('⚠️ Cảnh báo: Tính năng phân tích đầu vào của người dùng yêu cầu phải bật và cấu hình API bổ sung!\n\nVui lòng cấu hình API bổ sung trong "Cài đặt API bổ sung" ở tab "API".');
    }

    saveUserProfileConfig();

    // 🆕 Cập nhật thông tin thông báo, bao gồm trạng thái bộ điều phối trí nhớ
    alert('✅ Đã lưu cài đặt hồ sơ người dùng!\n\n' +
        'Trạng thái: ' + (userProfileConfig.enabled ? 'Đã bật' : 'Đã tắt') + '\n' +
        '🧠Bộ điều phối trí nhớ: ' + (userProfileConfig.memoryDispatcherEnabled ? 'Đã bật' : 'Đã tắt') + '\n' +
        'Số lớp văn bản chính: ' + userProfileConfig.analysisHistoryDepth + ' lớp\n' +
        'Số lớp ma trận: ' + userProfileConfig.matrixHistoryDepth + ' lớp\n' +
        'Chuỗi tư duy phân tích: ' + (userProfileConfig.showAnalysis ? 'Hiển thị' : 'Ẩn'));
}

/**
 * Xem hồ sơ người dùng (Cửa sổ bật lên)
 */
function viewUserProfile() {
    const profileText = getFormattedUserProfile();

    // Tạo cửa sổ bật lên
    const modal = document.createElement('div');
    modal.id = 'userProfileViewModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 15px;
        padding: 25px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        color: #fff;
        font-family: 'Courier New', monospace;
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
        border: 2px solid #667eea;
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #667eea;">🎭 Hồ sơ người dùng</h2>
            <button onclick="document.getElementById('userProfileViewModal').remove()" 
                    style="background: #dc3545; border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                ✕ Đóng
            </button>
        </div>
        <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; color: #e0e0e0;">${profileText}</pre>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Nhấp vào nền mờ để đóng
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * Xóa sạch hồ sơ người dùng
 */
function clearUserProfile() {
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa sạch hồ sơ người dùng không?\n\nViệc này sẽ xóa toàn bộ sở thích của người dùng và dữ liệu phân tích đã tích lũy, thao tác này không thể hoàn tác!')) {
        return;
    }

    userProfileData = {
        preferences: [],
        dislikes: [],
        writingStyle: 'Chưa xác định',
        contentPreference: 'Chưa xác định',
        literacyLevel: 'Chưa xác định',
        interactionPattern: 'Chưa xác định',
        notes: [],
        analysisHistory: [],
        stats: {
            totalInputs: 0,
            r18Inputs: 0,
            combatInputs: 0,
            socialInputs: 0,
            explorationInputs: 0,
            lastUpdated: null
        }
    };

    saveUserProfile();

    // Cập nhật hiển thị giao diện
    const profileTextarea = document.getElementById('currentUserProfile');
    if (profileTextarea) {
        profileTextarea.value = 'Đã xóa sạch hồ sơ người dùng. Bắt đầu trò chơi và bật tính năng này sẽ tự động tích lũy.';
    }

    alert('✅ Đã xóa sạch hồ sơ người dùng!');
}

/**
 * Tải cài đặt lên giao diện
 */
function loadUserProfileSettingsToUI() {
    loadUserProfileConfig();
    loadUserProfile();

    const enabledEl = document.getElementById('enableUserProfileAnalysis');
    const promptEl = document.getElementById('userProfileAnalysisPrompt');
    const showAnalysisEl = document.getElementById('userProfileShowAnalysis');
    const historyDepthEl = document.getElementById('userProfileHistoryDepth');
    const matrixDepthEl = document.getElementById('userProfileMatrixDepth');
    const profileTextarea = document.getElementById('currentUserProfile');
    const fieldsEl = document.getElementById('userProfileFields');
    const memoryDispatcherEl = document.getElementById('enableMemoryDispatcher');  // 🆕

    if (enabledEl) enabledEl.checked = userProfileConfig.enabled;
    if (promptEl && userProfileConfig.analysisPrompt) promptEl.value = userProfileConfig.analysisPrompt;
    if (showAnalysisEl) showAnalysisEl.checked = userProfileConfig.showAnalysis;
    if (historyDepthEl) historyDepthEl.value = userProfileConfig.analysisHistoryDepth || 3;
    if (matrixDepthEl) matrixDepthEl.value = userProfileConfig.matrixHistoryDepth || 5;
    if (fieldsEl) fieldsEl.style.display = userProfileConfig.enabled ? 'block' : 'none';

    // 🆕 Tải trạng thái công tắc của bộ điều phối trí nhớ
    if (memoryDispatcherEl) {
        memoryDispatcherEl.checked = userProfileConfig.memoryDispatcherEnabled || false;
        window.memoryDispatcherEnabled = userProfileConfig.memoryDispatcherEnabled || false;
        console.log('[🧠Bộ điều phối trí nhớ] Trạng thái UI đã được tải:', userProfileConfig.memoryDispatcherEnabled ? 'Đã bật' : 'Đã tắt');
    }

    // 🆕 Làm mới công cụ chọn hồ sơ
    refreshProfileSelector();

    // Hiển thị hồ sơ người dùng hiện tại (Bản đầy đủ, thuận tiện cho việc chỉnh sửa)
    if (profileTextarea) {
        if (confirmedUserProfile && confirmedUserProfile.result) {
            // Hiển thị đầy đủ hồ sơ từ bảng câu hỏi (Định dạng có thể chỉnh sửa)
            const p = confirmedUserProfile.result;
            profileTextarea.value = generateEditableProfileText(p, confirmedUserProfile.createdAt);
        } else if (userProfileData.stats.totalInputs > 0) {
            // Hiển thị hồ sơ được tích lũy tự động
            profileTextarea.value = `📋 【Hồ sơ tích lũy tự động】\n` +
                `Tổng số lần phân tích: ${userProfileData.stats.totalInputs}\n` +
                `Sở thích văn phong: ${userProfileData.writingStyle}\n` +
                `Sở thích nội dung: ${userProfileData.contentPreference}\n` +
                `Trình độ văn học: ${userProfileData.literacyLevel}\n` +
                `Mô hình tương tác: ${userProfileData.interactionPattern}\n` +
                `Thích: ${userProfileData.preferences.slice(-5).join('、') || 'Không có'}\n` +
                `Không thích: ${userProfileData.dislikes.slice(-3).join('、') || 'Không có'}\n\n` +
                `💡 Có thể chỉnh sửa trực tiếp ở trên, sau khi sửa xong hãy nhấp vào "Lưu các thay đổi hồ sơ"`;
        } else {
            profileTextarea.value = 'Chưa tạo hồ sơ người dùng.\n\n💡 Có thể nhập trực tiếp sở thích của bạn tại đây, ví dụ:\n\n📌 Đặc điểm người dùng: Thích truyện sảng văn, nhịp độ nhanh\nSở thích cốt truyện: Hướng chiến đấu\nSở thích văn phong: Ngắn gọn rõ ràng\nSở thích nhịp độ: Nhịp độ nhanh\nSở thích độ khó: Vừa phải\nThích: Vả mặt, thăng cấp, hậu cung\nKhông thích: Quá lương thiện, dài dòng rề rà\nHướng dẫn sáng tạo cho AI: Viết nhiều cảnh chiến đấu, ít viết cảnh sinh hoạt hàng ngày';
        }
    }
}

/**
 * Tạo văn bản hồ sơ đầy đủ có thể chỉnh sửa
 */
function generateEditableProfileText(p, createdAt) {
    let text = `📌 Đặc điểm người dùng: ${p.summary || 'Chưa xác định'}\n\n`;

    text += `【Sở thích cốt truyện】\n`;
    text += `Loại cốt truyện: ${p.storyPreference || 'Chưa xác định'}\n`;
    text += `Nhịp điệu câu chuyện: ${p.storyTone || 'Chưa xác định'}\n`;
    text += `Cấu trúc cốt truyện: ${p.storyStructure || 'Chưa xác định'}\n`;
    text += `Sở thích nhịp độ: ${p.pacing || 'Chưa xác định'}\n`;
    text += `Sở thích thay đổi bất ngờ: ${p.plotTwistPreference || 'Chưa xác định'}\n`;
    if (p.conflictTypes) {
        text += `Loại xung đột: ${Array.isArray(p.conflictTypes) ? p.conflictTypes.join('、') : p.conflictTypes}\n`;
    }

    text += `\n【Miêu tả văn phong】\n`;
    text += `Sở thích văn phong: ${p.writingStyle || 'Chưa xác định'}\n`;
    if (p.favoriteWorks) {
        text += `Tác phẩm yêu thích: ${p.favoriteWorks}\n`;
    }
    if (p.writingStyleDetails) {
        text += `Yêu cầu chi tiết về văn phong: ${p.writingStyleDetails}\n`;
    }
    text += `Phong cách trò chuyện: ${p.dialogueStyle || 'Chưa xác định'}\n`;
    text += `Độ chi tiết khi trả lời: ${p.detailLevel || 'Chưa xác định'}\n`;
    if (p.descriptionFocus) {
        text += `Trọng tâm miêu tả: ${Array.isArray(p.descriptionFocus) ? p.descriptionFocus.join('、') : p.descriptionFocus}\n`;
    }
    if (p.narrativeStyle) {
        text += `Cách kể chuyện: ${Array.isArray(p.narrativeStyle) ? p.narrativeStyle.join('、') : p.narrativeStyle}\n`;
    }
    if (p.languageStyle) {
        text += `Phong cách dùng từ: ${p.languageStyle}\n`;
    }

    text += `\n【Tương tác nhân vật】\n`;
    text += `Loại nhân vật chính: ${p.protagonistType || 'Chưa xác định'}\n`;
    if (p.protagonistPersonality) {
        text += `Tính cách nhân vật chính: ${Array.isArray(p.protagonistPersonality) ? p.protagonistPersonality.join('、') : p.protagonistPersonality}\n`;
    }
    if (p.protagonistBackground) {
        text += `Hoàn cảnh nhân vật chính: ${Array.isArray(p.protagonistBackground) ? p.protagonistBackground.join('、') : p.protagonistBackground}\n`;
    }
    if (p.favoriteCharacters) {
        text += `Nhân vật yêu thích: ${Array.isArray(p.favoriteCharacters) ? p.favoriteCharacters.join('、') : p.favoriteCharacters}\n`;
    }
    if (p.relationshipTypes) {
        text += `Loại mối quan hệ: ${Array.isArray(p.relationshipTypes) ? p.relationshipTypes.join('、') : p.relationshipTypes}\n`;
    }
    text += `Độ sâu của mối quan hệ: ${p.relationshipDepth || 'Chưa xác định'}\n`;
    text += `Tuyến tình cảm: ${p.haremPreference || 'Chưa xác định'}\n`;
    text += `Phong cách NPC: ${p.npcStyle || 'Chưa xác định'}\n`;

    text += `\n【Chiến đấu và phiêu lưu】\n`;
    text += `Sở thích độ khó: ${p.difficulty || 'Chưa xác định'}\n`;
    text += `Phong cách chiến đấu: ${p.combatStyle || 'Chưa xác định'}\n`;
    if (p.combatElements) {
        text += `Yếu tố chiến đấu: ${Array.isArray(p.combatElements) ? p.combatElements.join('、') : p.combatElements}\n`;
    }
    text += `Yêu cầu cảm giác thỏa mãn: ${p.powerFantasy || 'Chưa xác định'}\n`;
    if (p.enemyTypes) {
        text += `Loại kẻ thù: ${Array.isArray(p.enemyTypes) ? p.enemyTypes.join('、') : p.enemyTypes}\n`;
    }
    text += `Tốc độ phát triển: ${p.growthSpeed || 'Chưa xác định'}\n`;
    text += `Hậu quả khi thất bại: ${p.consequenceLevel || 'Chưa xác định'}\n`;

    text += `\n【Thế giới và nội dung】\n`;
    text += `Sự quan tâm đến thế giới quan: ${p.worldBuilding || 'Chưa xác định'}\n`;
    if (p.worldElements) {
        text += `Yếu tố thế giới: ${Array.isArray(p.worldElements) ? p.worldElements.join('、') : p.worldElements}\n`;
    }
    text += `Lựa chọn đạo đức: ${p.moralChoices || 'Chưa xác định'}\n`;
    text += `Sở thích R18: ${p.r18Preference || 'Chưa xác định'}\n`;
    if (p.r18Elements && !p.r18Elements.includes('Không cần loại nội dung này')) {
        text += `Loại R18: ${Array.isArray(p.r18Elements) ? p.r18Elements.join('、') : p.r18Elements}\n`;
    }
    text += `Sở thích kết thúc: ${p.endingPreference || 'Chưa xác định'}\n`;

    text += `\n【Sở thích đặc biệt】\n`;
    text += `Ngôi kể: ${p.immersionStyle || 'Chưa xác định'}\n`;
    text += `Độ tự do sáng tạo của AI: ${p.aiCreativity || 'Chưa xác định'}\n`;
    if (p.humorStyle) {
        text += `Phong cách hài hước: ${Array.isArray(p.humorStyle) ? p.humorStyle.join('、') : p.humorStyle}\n`;
    }
    text += `Nhảy vọt thời gian: ${p.timeSkipPreference || 'Chưa xác định'}\n`;
    text += `Tích hợp hệ thống: ${p.systemIntegration || 'Chưa xác định'}\n`;

    text += `\n【Sở thích cốt lõi】\n`;
    text += `Thích: ${Array.isArray(p.likes) ? p.likes.join('、') : p.likes || 'Không có'}\n`;
    text += `Không thích: ${Array.isArray(p.dislikes) ? p.dislikes.join('、') : p.dislikes || 'Không có'}\n`;
    if (p.specialNotes) {
        text += `Đặc biệt chú ý: ${p.specialNotes}\n`;
    }

    text += `\n【Hướng dẫn sáng tạo cho AI】\n`;
    text += `${p.aiGuidelines || 'Tạo nội dung theo sở thích của người dùng'}\n`;

    if (createdAt) {
        text += `\n---\nThời gian tạo: ${new Date(createdAt).toLocaleString()}`;
    }

    return text;
}

// ==================== Hiển thị chuỗi tư duy phân tích ====================

/**
 * Hiển thị chuỗi tư duy phân tích đầu vào của người dùng (không lưu vào bộ nhớ)
 * Bản đơn giản hóa: Hiển thị trực tiếp đầu ra gốc của AI, dùng \n để xuống dòng
 */
function displayAnalysisReasoning(userInput, analysisResult, rawResponse = null) {
    const historyDiv = document.getElementById('gameHistory');
    if (!historyDiv) return;

    // Tạo hộp chứa chuỗi tư duy phân tích
    const container = document.createElement('div');
    container.className = 'user-analysis-reasoning';
    container.style.cssText = `
        background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        border: 2px solid #667eea;
        border-radius: 12px;
        margin: 10px 0;
        padding: 0;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    `;

    // Phần đầu (có thể thu gọn)
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 15px;
        border-radius: 10px 10px 0 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>🎭 Phân tích đầu vào của người dùng</span>
        <span style="font-size: 11px; opacity: 0.8;">Nhấp để mở rộng/thu gọn</span>
    `;

    // Khu vực nội dung (Mặc định thu gọn)
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 15px;
        display: none;
        color: #333;
        white-space: pre-wrap;
        font-family: 'Courier New', Monaco, monospace;
        font-size: 12px;
        line-height: 1.6;
        background: #f8f9fa;
        border-radius: 0 0 10px 10px;
        max-height: 500px;
        overflow-y: auto;
    `;

    // 🆕 Hiển thị trực tiếp đầu ra gốc của AI, dùng \n để xuống dòng
    let displayContent = '';

    if (rawResponse) {
        // Nếu có phản hồi gốc, hiển thị trực tiếp
        displayContent = rawResponse;
    } else if (analysisResult) {
        // Nếu không thì chuyển đổi analysisResult thành chuỗi JSON để hiển thị
        displayContent = JSON.stringify(analysisResult, null, 2);
    }

    // Xử lý xuống dòng: chuyển \n thành xuống dòng thực tế (pre-wrap sẽ tự xử lý)
    content.textContent = displayContent;

    // Nhấp vào phần đầu để thu gọn/mở rộng
    header.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    };

    container.appendChild(header);
    container.appendChild(content);

    // Chèn vào cuối phần lịch sử trò chơi
    historyDiv.appendChild(container);

    // Cuộn xuống dưới cùng
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // Đánh dấu phần tử này không cần lưu (dùng để phân biệt)
    container.dataset.noSave = 'true';
}

// ==================== Hệ thống khảo sát bằng bảng câu hỏi ====================

// Định nghĩa các câu hỏi trong bảng câu hỏi (Hiển thị theo nhóm)
const questionnaireQuestions = [
    // ===== Phần 1: Sở thích cốt truyện =====
    {
        id: 'section1',
        type: 'section',
        title: '📖 Phần 1: Sở thích cốt truyện'
    },
    {
        id: 'storyPreference',
        question: 'Bạn thích thể loại cốt truyện nào hơn?',
        type: 'radio',
        options: ['Hướng cốt truyện (Chú trọng phát triển câu chuyện và xây dựng nhân vật)', 'Hướng chiến đấu (Chú trọng miêu tả chiến đấu và đánh quái thăng cấp)', 'Hướng giao tiếp (Chú trọng các mối quan hệ và tương tác trò chuyện)', 'Hướng R18 (Chú trọng các cảnh thân mật và miêu tả tình cảm)', 'Hướng phiêu lưu khám phá (Khám phá những điều chưa biết, giải đố tìm kho báu)', 'Hướng kinh doanh và nuôi dưỡng (Phát triển thế lực, bồi dưỡng nhân vật)', 'Hướng bí ẩn và suy luận (Giải mã những bí ẩn, phơi bày sự thật)', 'Loại hỗn hợp (Thích tất cả các điều trên, chuyển đổi tùy theo tình huống)']
    },
    {
        id: 'storyTone',
        question: 'Bạn thích nhịp điệu câu chuyện như thế nào?',
        type: 'radio',
        options: ['Nhẹ nhàng và vui vẻ (Hướng vui tươi, thỉnh thoảng có chút trắc trở nhỏ)', 'Nhiệt huyết và truyền cảm hứng (Nhân vật chính liên tục đột phá, lật ngược tình thế trong nghịch cảnh)', 'Sâu sắc và nặng nề (Thế giới quan và động cơ của nhân vật phức tạp)', 'Tăm tối và tàn khốc (Hướng thực tế, có sự hy sinh và đánh đổi)', 'Phi lý và hài hước (Vô lý, phá vỡ những quy tắc thông thường)', 'Chữa lành và ấm áp (Cuộc sống hàng ngày ấm áp tình người)', 'Quy mô sử thi hoành tráng (Cục diện rộng lớn đầy biến động)', 'Bí ẩn và căng thẳng (Đầy rẫy những điều chưa biết và giật gân)', 'Lãng mạn và đẹp đẽ (Chú trọng vào bầu không khí tình cảm)']
    },
    {
        id: 'plotTwist',
        question: 'Mức độ chấp nhận của bạn đối với việc cốt truyện thay đổi bất ngờ?',
        type: 'radio',
        options: ['Thích sự thay đổi bất ngờ (Càng không thể ngờ tới càng tốt)', 'Thay đổi bất ngờ ở mức độ vừa phải (Thỉnh thoảng có một lần)', 'Tốt nhất là cốt truyện ổn định (Đừng có quá nhiều yếu tố bất ngờ)', 'Thay đổi bất ngờ cũng được nhưng phải có sự chuẩn bị hợp lý trước đó', 'Thích sự bất ngờ khi giải quyết các chi tiết ẩn', 'Thích những tình tiết ngầm nghĩ kỹ lại thấy sợ']
    },
    {
        id: 'pacing',
        question: 'Bạn thích nhịp độ cốt truyện như thế nào?',
        type: 'radio',
        options: ['Nhịp độ chậm (Tận hưởng cuộc sống hàng ngày và các chi tiết)', 'Nhịp độ trung bình (Cân bằng giữa cuộc sống hàng ngày và cốt truyện chính)', 'Nhịp độ nhanh (Cốt truyện chặt chẽ, đẩy nhanh tiến độ)', 'Điều chỉnh tùy theo hoàn cảnh (Đánh nhau thì nhanh, sinh hoạt hàng ngày thì chậm)', 'Căng chùng vừa độ (Cao trào và thư giãn đan xen)', 'Nhiều trắc trở (Liên tục thăng trầm đẩy cốt truyện lên)']
    },


// ===== Phần 2: Phong cách viết và Miêu tả =====
    {
        id: 'section2',
        type: 'section',
        title: '✍️ Phần 2: Phong cách viết và Miêu tả'
    },
    {
        id: 'writingStyle',
        question: 'Bạn thích phong cách viết nào hơn?',
        type: 'radio',
        options: ['Tinh tế hoa mỹ (Chú trọng miêu tả môi trường và tâm lý)', 'Ngắn gọn rõ ràng (Nổi bật trọng tâm, nhịp điệu chặt chẽ)', 'Nhẹ nhàng hài hước (Đối thoại thú vị và hay cà khịa)', 'Nghiêm túc sâu sắc (Phong cách kể chuyện trưởng thành)', 'Light novel Nhật Bản (Đời thường nhẹ nhàng + Chiến đấu nhiệt huyết)', 'Cổ phong võ hiệp tiên hiệp (Cổ điển tao nhã)', 'Phong cách sảng văn mạng (Sảng khoái trực tiếp, nhịp độ nhanh)', 'Phong cách văn thanh (Nhiều hình ảnh, đậm chất thơ)', 'Thực tế hardcore (Chú trọng logic và chi tiết chân thực)', 'Phổ thông dễ hiểu (Bình dị trôi chảy dễ đọc)']
    },
    {
        id: 'favoriteWorks',
        question: 'Vui lòng điền tiểu thuyết/tác phẩm bạn thích (Không bắt buộc, dùng để tham khảo phong cách viết)',
        type: 'textarea',
        placeholder: 'Ví dụ：\n• Tu tiên：《Phàm Nhân Tu Tiên》《Già Thiên》《Nhất Niệm Vĩnh Hằng》《Tiên Nghịch》《Ngã Dục Phong Thiên》\n• Huyền huyễn：《Đấu Phá Thương Khung》《Vũ Động Càn Khôn》《Hoàn Mỹ Thế Giới》《Đại Chúa Tể》\n• Kỳ ảo：《Tru Tiên》《Trạch Thiên Ký》《Tuyết Trung Hãn Đao Hành》《Tương Dạ》\n• Đô thị：《Long Vương Truyền Thuyết》《Toàn Chức Cao Thủ》《Đại Vương Tha Mạng》\n• Kinh dị/Bí ẩn：《Đạo Mộ Bút Ký》《Ma Thổi Đèn》《Đạo Quỷ Dị Tiên》\n• Light novel：《Sword Art Online》《Thất Nghiệp Chuyển Sinh》《Re:Zero》《Overlord》\n• Võ hiệp：《Thiên Long Bát Bộ》《Tiếu Ngạo Giang Hồ》《Anh Hùng Xạ Điêu》\n• Khác: Có thể điền bất kỳ tác phẩm nào bạn thích, AI sẽ tham khảo đặc điểm phong cách viết của tác phẩm đó'
    },
    {
        id: 'favoriteAuthors',
        question: 'Bạn thích phong cách của những tác giả nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: [
            // Các đại gia văn học cổ điển Trung Quốc
            'Lỗ Tấn', 'Lão Xá', 'Ba Kim', 'Thẩm Tùng Văn', 'Uông Tằng Kỳ', 'Trương Ái Linh', 'Tiền Chung Thư', 'Lâm Ngữ Đường', 'Tiêu Hồng', 'Úc Đạt Phu',
            // Nhà văn đương đại Trung Quốc
            'Mạc Ngôn', 'Dư Hoa', 'Tô Đồng', 'Vương Tiểu Ba', 'A Thành', 'Lộ Dao', 'Trần Trung Thực', 'Giả Bình Ao', 'Lưu Chấn Vân', 'Nghiêm Ca Linh', 'Vương An Ức', 'Trì Tử Kiến', 'Tất Phi Vũ', 'Cách Phi', 'Diêm Liên Khoa', 'Kim Vũ Trừng',
            // Nhà văn Hồng Kông, Đài Loan
            'Kim Dung', 'Cổ Long', 'Lương Vũ Sinh', 'Nghê Khuông', 'Hoàng Dịch', 'Bạch Tiên Dũng', 'Lý Bích Hoa', 'Diệc Thư', 'Quỳnh Dao', 'Ôn Thụy An',
            // Tác giả tiểu thuyết mạng
            'Thiên Tàm Thổ Đậu', 'Đường Gia Tam Thiểu', 'Ngã Chiểu Tây Hồng Thị', 'Thần Đông', 'Nhĩ Căn', 'Vong Ngữ', 'Miêu Nị', 'Phong Hỏa Hí Chư Hầu', 'Yên Vũ Giang Nam', 'Mộng Nhập Thần Cơ', 'Lão Ưng Chiểu Tiểu Kê', 'Ái Tiềm Thủy Đích Ô Tặc', 'Hội Thuyết Thoại Đích Trửu Tử', 'Phẫn Nộ Đích Hương Tiêu', 'Thiên Hạ Quy Nguyên', 'Đinh Mặc', 'Cố Mạn', 'Mặc Hương Đồng Khứu', 'priest', 'Phi Thiên Dạ Tường', 'Hoài Thượng', 'Nhục Bao Bất Cật Nhục', 'Các đại thần Tấn Giang',
            // Light novel / tác giả Nhật Bản
            'Kawabata Yasunari', 'Mishima Yukio', 'Murakami Haruki', 'Higashino Keigo', 'Dazai Osamu', 'Natsume Soseki', 'Akutagawa Ryunosuke', 'Fushimi Tsukasa', 'Nisio Isin', 'Iruma Hitoma', 'Kinugasa Shougo', 'Jyumonji Ao', 'Kawahara Reki', 'Narita Ryohgo', 'Nasu Kinoko', 'Kamachi Kazuma', 'Natsuki Subaru', 'Wataru Watari', 'Hasekura Isuna', 'Kadono Kouhei', 'Kamiya Yuu', 'Maruyama Kugane',
            // Nhà văn kinh điển Âu Mỹ
            'Hemingway', 'Fitzgerald', 'Marquez', 'Kafka', 'Tolstoy', 'Dostoevsky', 'Hugo', 'Dickens', 'J.K. Rowling', 'J.R.R. Tolkien', 'George R.R. Martin', 'Stephen King', 'Agatha Christie', 'Dan Brown',
            // Khác
            'Tác giả khác (Vui lòng ghi rõ trong phần ghi chú)'
        ]
    },
    {
        id: 'dialogueStyle',
        question: 'Bạn thích phong cách đối thoại như thế nào?',
        type: 'radio',
        options: ['Ngắn gọn súc tích (Đi thẳng vào vấn đề)', 'Nhanh trí hài hước (Cà khịa và bắt trend)', 'Văn nghệ trữ tình (Có chiều sâu và vần điệu)', 'Khẩu ngữ hàng ngày (Tự nhiên chân thực)', 'Cổ điển tao nhã (Bán văn ngôn)', 'Chuunibyou nhiệt huyết (Lời thoại bùng cháy)', 'Bụng đen nham hiểm (Trong lời có ý)', 'Hệ moe đáng yêu (Mềm mại làm nũng)', 'Thay đổi theo tính cách nhân vật']
    },
    {
        id: 'descriptionFocus',
        question: 'Bạn muốn tập trung miêu tả điều gì? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Bầu không khí môi trường', 'Ngoại hình nhân vật', 'Hoạt động tâm lý', 'Chi tiết hành động', 'Giao tranh đối thoại', 'Thay đổi tình cảm', 'Quá trình chiến đấu', 'Trải nghiệm giác quan', 'Trang phục ăn mặc', 'Biểu cảm thần thái', 'Ngôn ngữ cơ thể', 'Độc thoại nội tâm', 'Hồi tưởng chớp nhoáng', 'Tạo điểm nhấn khí thế']
    },
    {
        id: 'detailLevel',
        question: 'Bạn mong muốn mức độ chi tiết trong mỗi lần AI trả lời là bao nhiêu?',
        type: 'radio',
        options: ['Cực kỳ ngắn gọn (200-300 chữ)', 'Ngắn gọn súc tích (300-500 chữ)', 'Độ dài vừa phải (500-800 chữ)', 'Miêu tả chi tiết (800-1200 chữ)', 'Độ dài lớn (1200-1800 chữ)', 'Siêu dài (Trên 1800 chữ)', 'Tự động điều chỉnh theo hoàn cảnh']
    },
    {
        id: 'narrativeStyle',
        question: 'Bạn thích thủ pháp kể chuyện nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Kể xuôi (Theo trình tự thời gian)', 'Kể ngược (Bắt đầu từ kết quả)', 'Kể xen kẽ (Xen kẽ hồi tưởng)', 'Chuyển đổi đa góc nhìn', 'Độc thoại nội tâm', 'Lời dẫn chuyện', 'Tôn lên môi trường', 'Thủ pháp đối lập', 'Gợi ý phục bút', 'Nhảy vọt Montage']
    },
    {
        id: 'languagePreference',
        question: 'Sở thích của bạn về cách dùng từ?',
        type: 'radio',
        options: ['Bạch thoại hiện đại (Phổ thông dễ hiểu)', 'Nửa văn ngôn nửa bạch thoại (Đậm chất cổ phong)', 'Ngôn ngữ thịnh hành trên mạng (Gần gũi thực tế)', 'Nhiều thuật ngữ chuyên môn (Có vẻ chuyên nghiệp)', 'Trích dẫn thơ từ (Văn vẻ lai láng)', 'Tự động điều chỉnh theo hoàn cảnh']
    },

    // ===== Phần 3: Nhân vật và Tương tác =====
    {
        id: 'section3',
        type: 'section',
        title: '👥 Phần 3: Nhân vật và Tương tác'
    },

    {
        id: 'favoriteNpcTypes',
        question: 'Bạn thích mẫu nhân vật nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Tsundere (Ngoài lạnh trong nóng)', 'Dịu dàng', 'Ngự tỷ/Ông chú', 'Loli/Shota', 'Yandere', 'Ngốc nghếch bẩm sinh', 'Lạnh lùng kiêu ngạo', 'Bụng đen (Xảo quyệt)', 'Nhiệt huyết', 'Tiền bối đáng tin cậy', 'Nhân vật bí ẩn', 'Độc mồm hay cà khịa', 'Kiểu trung thành', 'Kiểu nữ vương', 'Tiên tử thanh lãnh', 'Hoạt bát năng động', 'Yêu diễm mị hoặc', 'Trí thức thanh lịch', 'Tương phản đáng yêu', 'Chuunibyou', 'Ngoài lạnh trong nóng (Kiểu kìm nén)']
    },
    {
        id: 'relationshipType',
        question: 'Bạn thích kiểu quan hệ nhân vật nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Thanh mai trúc mã', 'Quan hệ thầy trò', 'Quan hệ chủ tớ', 'Kẻ thù thành bạn', 'Oan gia ngõ hẹp', 'Tiếng sét ái tình', 'Lâu ngày sinh tình', 'Định mệnh an bài', 'Tình yêu cấm kỵ', 'Anh em/Chị em', 'Đồng môn sư huynh muội', 'Hậu cung quần phương', 'Chung tình chân ái', 'Mập mờ không rõ']
    },

    {
        id: 'haremPreference',
        question: 'Thái độ của bạn đối với mối quan hệ hậu cung/nhiều nhân vật?',
        type: 'radio',
        options: ['Tuyến chung tình (Chỉ tán đổ một người)', 'Hậu cung nhỏ (2-3 người)', 'Hậu cung lớn (Càng nhiều càng tốt)', 'Không giới hạn (Tùy duyên)', 'Không cần tuyến tình cảm', 'Hướng Yuri/Đam mỹ']
    },

    // ===== Phần 4: Chiến đấu và Mạo hiểm =====
    {
        id: 'section4',
        type: 'section',
        title: '⚔️ Phần 4: Chiến đấu và Mạo hiểm'
    },
    {
        id: 'difficulty',
        question: 'Bạn muốn trò chơi có mức độ thử thách như thế nào?',
        type: 'radio',
        options: ['Nhẹ nhàng vui vẻ (Nhân vật chính thuận buồm xuôi gió)', 'Thử thách vừa phải (Thỉnh thoảng gặp khó khăn)', 'Độ khó cao (Thường xuyên đối mặt với nguy cơ)', 'Chế độ hardcore (Có thể thất bại bất cứ lúc nào)', 'Kiểu dao động (Lúc thuận lợi lúc khó khăn)', 'Thử thách theo từng giai đoạn (Mỗi giai đoạn đều có boss)']
    },
    {
        id: 'combatStyle',
        question: 'Bạn thích kiểu miêu tả chiến đấu nào?',
        type: 'radio',
        options: ['Đối đầu chiến thuật (Đấu trí đấu dũng)', 'Kịch chiến nhiệt huyết (Chiêu thức oanh tạc)', 'Một đòn hạ gục (Gọn gàng dứt khoát)', 'Mổ xẻ chi tiết (Mỗi chiêu đều có miêu tả)', 'Tôn lên bầu không khí (Trọng khí thế, nhẹ chi tiết)', 'Bạo lực đẫm máu (Chân thực tàn khốc)', 'Phiêu diêu phóng khoáng (Đẹp như tranh vẽ)', 'Đấu nội lực (Áp đảo bằng cảnh giới)', 'Phối hợp nhóm (Nhiều người hợp tác)']
    },
    {
        id: 'powerFantasy',
        question: 'Mức độ nhu cầu về "cảm giác sảng khoái" của bạn?',
        type: 'radio',
        options: ['Rất cần (Nhân vật chính phải mạnh, ra vẻ và vả mặt kẻ khác)', 'Vừa phải là được (Có khoảnh khắc tỏa sáng là ổn)', 'Không cần lắm (Thích cảm giác chân thực hơn)', 'Hướng ngược lại cũng được (Nhân vật chính có thể chịu ấm ức)', 'Trước đè nén sau bùng nổ (Trắc trở trước, sảng khoái sau)', 'Tiến lên vững chắc (Mạnh lên theo tuần tự)']
    },
    {
        id: 'consequenceLevel',
        question: 'Bạn muốn có hậu quả gì sau khi chiến đấu thất bại?',
        type: 'radio',
        options: ['Cơ bản không có hậu quả (Làm lại từ đầu)', 'Hậu quả nhẹ (Mất mát tài sản hoặc thời gian)', 'Hậu quả trung bình (Bị thương cần phục hồi)', 'Hậu quả nghiêm trọng (Có thể bị bắt hoặc chết)', 'Rẽ nhánh cốt truyện (Thất bại cũng là một phần của câu chuyện)', 'Quý nhân cứu giúp (Có người đến giúp đỡ)']
    },
    {
        id: 'growthSpeed',
        question: 'Bạn muốn tốc độ trưởng thành của nhân vật chính như thế nào?',
        type: 'radio',
        options: ['Nâng cấp nhanh (Buff ngập tràn)', 'Tăng trưởng vững chắc (Theo tuần tự)', 'Tích lũy rồi bùng nổ (Dồn nén rồi bộc phát)', 'Đột phá bình cảnh (Có kẹt cấp có đột phá)', 'Thúc đẩy bằng cơ duyên (Dựa vào kỳ ngộ để mạnh lên)', 'Trưởng thành qua thực chiến (Càng đánh càng mạnh)']
    },

    // ===== Phần 5: Sở thích nội dung =====
    {
        id: 'section5',
        type: 'section',
        title: '🎯 Phần 5: Sở thích nội dung'
    },
    {
        id: 'worldBuilding',
        question: 'Mức độ hứng thú của bạn đối với thiết lập thế giới quan?',
        type: 'radio',
        options: ['Rất hứng thú (Thích thiết lập chi tiết)', 'Hiểu biết vừa phải (Đủ dùng là được)', 'Không bận tâm lắm (Trọng tâm ở nhân vật và cốt truyện)', 'Tự mình khám phá (Đừng giải thích trực tiếp)', 'Vừa chơi vừa tìm hiểu (Tiết lộ dần dần)', 'Thích thế giới quan to lớn']
    },
    {
        id: 'r18Preference',
        question: 'Sở thích về nội dung R18?',
        type: 'radio',
        options: ['Không cần nội dung R18', 'Thỉnh thoảng có vài ẩn ý tán tỉnh', 'Miêu tả thân mật vừa phải', 'Cảnh R18 chi tiết', 'Nội dung nặng đô cũng được', 'Hướng thuần ái (Chủ yếu là ngọt ngào)', 'Tùy theo nhu cầu cốt truyện']
    },
    {
        id: 'emotionalOrientation',
        question: 'Sở thích về xu hướng tình cảm? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Thuần ái (Chung tình sâu đậm)', 'NTR (Bị cắm sừng)', 'NTL (Cắm sừng người khác)', 'NTR ngược (Cướp lại)', 'Hậu cung (Nhiều người cùng thích nhân vật chính)', 'Tu la tràng (Tranh phong ăn giấm/Đánh ghen)', 'Mối quan hệ mở', 'Tình yêu cấm kỵ (Thầy trò/Chủ tớ v.v.)', 'Chênh lệch tuổi tác (Lớn tuổi hơn/Nhỏ tuổi hơn)', 'Chênh lệch thân phận (Quý tộc/Bình dân)', 'Không bận tâm những điều này']
    },
    {
        id: 'favoriteBodyParts',
        question: 'Các bộ phận cơ thể thích được miêu tả trọng tâm? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Ngực/Nhũ phòng', 'Mông', 'Chân/Đùi', 'Bàn chân', 'Eo', 'Cổ/Xương quai xanh', 'Môi/Lưỡi', 'Ngón tay', 'Lưng', 'Bụng/Bụng dưới', 'Chi tiết vùng kín', 'Toàn bộ cơ thể', 'Không cần nhấn mạnh đặc biệt']
    },
    {
        id: 'specialPlay',
        question: 'Thích cảnh/cách chơi đặc biệt nào? (Có thể chọn nhiều, không cần thì bỏ qua)',
        type: 'checkbox',
        options: ['SM/Dạy dỗ', 'Trói buộc/Cột chặt', 'Trò chơi nhục nhã', 'Ngoài trời/Nơi công cộng', 'Ngoại tình/Vô luân', 'Say xỉn/Dùng thuốc', 'Làm tình khi ngủ', 'Xúc tu', 'Quái vật/Dị chủng', 'Thôi miên/Tẩy não', 'Trò chơi mang thai', 'Sữa mẹ', 'Dùng chân (Footjob)', 'Tập trung quan hệ bằng miệng', 'Quan hệ đường hậu môn', 'Sử dụng đạo cụ', 'Không cần cách chơi đặc biệt']
    },
    {
        id: 'sexRolePreference',
        question: 'Sở thích Công Thụ / Chủ động Bị động?',
        type: 'radio',
        options: ['Nhân vật chính là công chủ động (Nắm quyền chủ đạo)', 'Nhân vật chính là thụ bị động (Bị nắm quyền chủ đạo)', 'Hỗ công hỗ thụ (Cân bằng)', 'Thay đổi tùy theo đối tượng', 'Không bận tâm']
    },
    {
        id: 'avoidContent',
        question: 'Bạn muốn tránh những nội dung nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Quá bạo lực đẫm máu', 'Nhân vật chính bị hành hạ/NTR', 'Kết cục bi thảm', 'Quá nhiều miêu tả đời thường', 'Mối quan hệ nhân tế phức tạp', 'Cốt truyện ép buộc (Không thể lựa chọn)', 'Kinh dị rùng rợn', 'Cốt truyện ngược tâm', 'Thánh mẫu bạch liên hoa', 'Hậu cung vô não', 'Nhân vật chính bị hạ IQ', 'Mở bàn tay vàng (hack) quá nhiều', 'Cốt truyện rề rà lê thê', 'Không có (Cái gì cũng chấp nhận được)']
    },

    // ===== Phần 6: Sở thích đặc biệt =====
    {
        id: 'section6',
        type: 'section',
        title: '💫 Phần 6: Sở thích đặc biệt'
    },
    {
        id: 'immersionLevel',
        question: 'Bạn muốn AI gọi nhân vật chính như thế nào?',
        type: 'radio',
        options: ['Ngôi thứ hai 【Bạn】', 'Ngôi thứ ba 【Dùng tên nhân vật chính】', 'Ngôi thứ nhất 【Tôi】', 'Chuyển đổi tùy theo ngữ cảnh', 'Ngôi thứ ba + Độc thoại nội tâm dùng ngôi thứ nhất']
    },
    {
        id: 'surpriseEvents',
        question: 'Bạn muốn AI chủ động tạo ra những bất ngờ gì? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Sự kiện ngẫu nhiên (Tình huống đột xuất)', 'Nhân vật mới xuất hiện', 'Kích hoạt cốt truyện ẩn', 'Đạo cụ/Cơ hội bất ngờ', 'Nhân vật chủ động tỏ tình/Làm thân', 'Nguy cơ bất ngờ', 'Cuộc gặp gỡ tình cờ', 'Lật lọng cốt truyện', 'Tiết lộ thân thế', 'Kỳ ngộ buông xuống', 'Không cần bất ngờ (Cứ đi theo lựa chọn của tôi)']
    },
    {
        id: 'aiCreativity',
        question: 'Bạn muốn AI có mức độ tự do sáng tác lớn đến mức nào?',
        type: 'radio',
        options: ['Hoàn toàn theo lựa chọn của tôi (Đừng tự ý quyết định)', 'Phát huy phạm vi nhỏ (Mở rộng theo hướng của tôi)', 'Sáng tác vừa phải (Có thể thêm các chi tiết thú vị)', 'Sáng tác mạnh bạo (Thường xuyên tạo bất ngờ cho tôi)', 'Tự do phát huy (Buông tay để AI sáng tác)']
    },
    {
        id: 'humorStyle',
        question: 'Bạn thích phong cách hài hước nào? (Có thể chọn nhiều)',
        type: 'checkbox',
        options: ['Kiểu cà khịa (Bình luận sắc bén)', 'Truyện cười nhạt', 'Vô lý vô căn cứ', 'Bắt trend (Trend mạng/Anime)', 'Hài hước đen tối', 'Tương phản đáng yêu', 'Chơi chữ đồng âm', 'Kiểu tự trào', 'Nghiêm túc một cách buồn cười', 'Không cần hài hước (Nghiêm túc cẩn thận)']
    },
    {
        id: 'interactionFrequency',
        question: 'Bạn muốn NPC chủ động tương tác với tần suất như thế nào?',
        type: 'radio',
        options: ['Thường xuyên (Cảm thấy thế giới rất sinh động)', 'Vừa phải (Xuất hiện khi có nhu cầu)', 'Rất ít (Khi tôi chủ động thì mới đáp lại)', 'Quyết định dựa trên mức độ thân thiết của mối quan hệ']
    },
    {
        id: 'timeSkip',
        question: 'Sở thích của bạn về việc nhảy vọt thời gian?',
        type: 'radio',
        options: ['Đừng bỏ qua (Ngày nào cũng phải miêu tả)', 'Có thể bỏ qua khoảng thời gian nhàm chán', 'Nhảy vọt vừa phải (Có thể bỏ qua sinh hoạt hàng ngày)', 'Nhảy vọt mạnh bạo (Có thể bỏ qua khoảng thời gian dài)', 'Tùy theo nhu cầu cốt truyện']
    },
    {
        id: 'flashbackStyle',
        question: 'Sở thích của bạn về hồi tưởng/chớp nhoáng?',
        type: 'radio',
        options: ['Thích (Làm phong phú bối cảnh nhân vật)', 'Sử dụng vừa phải', 'Không thích lắm (Cắt ngang cốt truyện)', 'Chỉ sử dụng vào những thời khắc quan trọng']
    },
    {
        id: 'systemIntegration',
        question: 'Bạn muốn hệ thống trò chơi hòa nhập vào cốt truyện như thế nào?',
        type: 'radio',
        options: ['Ẩn đi hoàn toàn (Trải nghiệm cốt truyện thuần túy)', 'Hiển thị vừa phải (Các dữ liệu then chốt)', 'Trưng bày chi tiết (Bảng chỉ số)', 'Trò chơi hóa (Có thông báo hệ thống rõ ràng)']
    },
    {
        id: 'additionalNotes',
        question: 'Còn có sở thích đặc biệt nào khác muốn nói với AI không? (Không bắt buộc)',
        type: 'textarea',
        placeholder: 'Ví dụ：\n• Mẫu nhân vật cụ thể yêu thích (như: Tsundere cột tóc hai chùm, Chị đại dịu dàng, Ngự tỷ lạnh lùng)\n• Sở thích cốt truyện cụ thể (như: Tình thầy trò, Thanh mai trúc mã, Kẻ thù thành người yêu)\n• Yếu tố đặc biệt mong muốn (như: Thú cưng đồng hành, Yếu tố xuyên không, Bàn tay vàng hệ thống)\n• Các đoạn cốt truyện ghét (như: Hiểu lầm chia cách, Cố tình hạ IQ)\n• Ví dụ về lời thoại/phong cách đối thoại yêu thích\n• XP hoặc sở thích kỳ quái đặc biệt (Sẽ được giữ bí mật tuyệt đối)\n• Bất kỳ sở thích nào khác bạn muốn AI biết...'
    }
];

// Hồ sơ đã được người dùng xác nhận (từ bảng câu hỏi)
let confirmedUserProfile = null;

/**
 * Mở cửa sổ popup điều tra bảng câu hỏi hồ sơ người dùng
 */
function openUserProfileQuestionnaire() {
    // Kiểm tra API bổ sung
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        alert('⚠️ Vui lòng bật và cấu hình API bổ sung trong cài đặt API trước!\nKết quả bảng câu hỏi cần được gửi đến API bổ sung để phân tích.');
        return;
    }

    // Tạo cửa sổ popup
    const modal = document.createElement('div');
    modal.id = 'questionnaireModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10001;
        display: flex; justify-content: center; align-items: center;
    `;

    let questionNumber = 0;
    let questionsHTML = questionnaireQuestions.map((q, idx) => {
        // Tiêu đề nhóm
        if (q.type === 'section') {
            return `
                <div style="margin: 25px 0 15px 0; padding: 12px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="font-size: 16px; font-weight: bold; color: white;">${q.title}</div>
                </div>
            `;
        }

        questionNumber++;
        let inputHTML = '';
        if (q.type === 'radio') {
            inputHTML = q.options.map((opt, i) => `
                <label style="display: block; padding: 8px 12px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; transition: background 0.2s;"
                       onmouseover="this.style.background='rgba(102,126,234,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <input type="radio" name="q_${q.id}" value="${opt}" style="margin-right: 10px;"> ${opt}
                </label>
            `).join('');
        } else if (q.type === 'checkbox') {
            inputHTML = `<div style="display: flex; flex-wrap: wrap; gap: 5px;">` + q.options.map((opt, i) => `
                <label style="display: inline-flex; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 20px; cursor: pointer; transition: background 0.2s; font-size: 13px;"
                       onmouseover="this.style.background='rgba(102,126,234,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <input type="checkbox" name="q_${q.id}" value="${opt}" style="margin-right: 6px;"> ${opt}
                </label>
            `).join('') + `</div>`;
        } else if (q.type === 'textarea') {
            inputHTML = `<textarea id="q_${q.id}" placeholder="${q.placeholder || ''}" 
                style="width: 100%; min-height: 100px; padding: 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.9); resize: vertical; font-size: 14px; color: #333;"></textarea>`;
        }

        return `
            <div style="margin-bottom: 18px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                <div style="font-weight: bold; color: #a0c4ff; margin-bottom: 10px; font-size: 14px;">${questionNumber}. ${q.question}</div>
                <div>${inputHTML}</div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; 
                    max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 25px; color: white;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #667eea;">📋 Khảo sát bảng câu hỏi sở thích người dùng</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 25px; font-size: 14px;">
                Vui lòng điền vào bảng câu hỏi dưới đây, giúp AI hiểu được sở thích của bạn, để tạo ra cốt truyện phù hợp với khẩu vị của bạn hơn!
            </p>
            
            <form id="questionnaireForm">
                ${questionsHTML}
            </form>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeQuestionnaireModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ Hủy bỏ
                </button>
                <button onclick="submitQuestionnaire()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    🚀 Gửi và phân tích
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Đóng cửa sổ popup bảng câu hỏi
 */
function closeQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (modal) modal.remove();
}

/**
 * Gửi bảng câu hỏi và gọi API để phân tích
 */
async function submitQuestionnaire() {
    const form = document.getElementById('questionnaireForm');
    if (!form) return;

    // Thu thập câu trả lời (bỏ qua loại section)
    const answers = {};
    questionnaireQuestions.forEach(q => {
        if (q.type === 'section') return; // Bỏ qua tiêu đề nhóm

        if (q.type === 'radio') {
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = selected ? selected.value : 'Chưa chọn';
        } else if (q.type === 'checkbox') {
            const checked = form.querySelectorAll(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = Array.from(checked).map(c => c.value);
        } else if (q.type === 'textarea') {
            const textarea = document.getElementById(`q_${q.id}`);
            answers[q.id] = textarea ? textarea.value : '';
        }
    });

    console.log('[🎭Hồ sơ người dùng] Câu trả lời bảng câu hỏi:', answers);

    // Hiển thị trạng thái đang tải
    const submitBtn = document.querySelector('#questionnaireModal button:last-child');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Đang phân tích...';
    }

    try {
        // Xây dựng yêu cầu phân tích
        const analysisPrompt = `Bạn là một chuyên gia phân tích hồ sơ người dùng. Dựa trên kết quả bảng câu hỏi của người dùng dưới đây, hãy tạo một báo cáo hồ sơ người dùng chi tiết.

【 Quy tắc cực kỳ quan trọng - Bắt buộc phải tuân thủ nghiêm ngặt! 】
1. Bạn chỉ có thể phân tích dựa trên nội dung mà người dùng 【thực tế đã chọn/điền】
2. Đối với những câu hỏi mà người dùng 【không chọn】 hoặc 【chọn "Chưa chọn"】, trường tương ứng phải điền "Chưa chọn" hoặc mảng rỗng []
3. 【Tuyệt đối cấm】 bịa đặt, phỏng đoán, suy luận các sở thích mà người dùng không chọn rõ ràng
4. Nếu người dùng hoàn toàn không trả lời một câu hỏi nào đó, trường tương ứng phải là "Chưa chọn", đừng bịa đặt!
5. summary và aiGuidelines chỉ có thể được tạo dựa trên nội dung người dùng thực tế đã chọn, đừng thêm nội dung mà người dùng không chọn

【Câu trả lời bảng câu hỏi của người dùng】
${Object.entries(answers).map(([key, value]) => {
            const q = questionnaireQuestions.find(q => q.id === key);
            if (!q) return null;
            const answer = Array.isArray(value) ? value.join('、') : value;
            // Bỏ qua câu trả lời trống
            if (!answer || answer === 'Chưa chọn' || (Array.isArray(value) && value.length === 0)) {
                return `${q.question}\nĐáp: 【Người dùng chưa chọn, vui lòng điền "Chưa chọn"】`;
            }
            return `${q.question}\nĐáp: ${answer}`;
        }).filter(Boolean).join('\n\n')}

【Vui lòng xuất ra hồ sơ người dùng theo định dạng JSON】
Lưu ý: Nếu người dùng không trả lời một câu hỏi nào đó, trường tương ứng phải là "Chưa chọn" hoặc mảng rỗng [], đừng bịa đặt!

{
    "summary": "Tóm tắt đặc điểm sở thích của người dùng này trong một câu (chỉ dựa trên nội dung người dùng thực tế đã chọn, không được bịa đặt)",
    
    "storyPreference": "Sở thích về thể loại cốt truyện (người dùng chưa chọn thì điền "Chưa chọn")",
    "storyTone": "Sở thích về nhịp điệu câu chuyện",
    "plotTwistPreference": "Sở thích về sự lật lọng cốt truyện",
    "pacing": "Sở thích về nhịp độ",
    
    "writingStyle": "Miêu tả sở thích về phong cách viết",
    "favoriteWorks": "Danh sách các tác phẩm người dùng thích (ghi lại nguyên bản, chưa điền thì điền "Chưa điền")",
    "favoriteAuthors": ["Các tác giả yêu thích do người dùng chọn, chưa chọn thì điền mảng rỗng []"],
    "writingStyleDetails": "【Quan trọng】 Dựa trên các tác phẩm yêu thích và phong cách tác giả mà người dùng đã chọn, hãy phân tích chi tiết và đưa ra yêu cầu về phong cách viết. Nếu người dùng không điền tác phẩm yêu thích cũng không chọn tác giả, thì chỉ dựa vào sở thích về phong cách viết mà người dùng đã chọn để tạo ra hướng dẫn, không được bịa đặt nội dung người dùng không chọn.",
    "dialogueStyle": "Sở thích về phong cách đối thoại",
    "narrativeStyle": ["Sở thích về thủ pháp kể chuyện"],
    "languageStyle": "Sở thích về cách dùng từ",
    "descriptionFocus": ["Nội dung tập trung miêu tả"],
    "detailLevel": "Sở thích về mức độ chi tiết của câu trả lời (phạm vi số chữ)",
    
    "favoriteCharacters": ["Mẫu nhân vật yêu thích"],
    "relationshipTypes": ["Kiểu quan hệ nhân vật yêu thích"],
    "haremPreference": "Sở thích về hậu cung/tuyến tình cảm",
    
    "difficulty": "Sở thích về độ khó",
    "combatStyle": "Sở thích về phong cách miêu tả chiến đấu",
    "powerFantasy": "Mức độ nhu cầu về cảm giác sảng khoái",
    "growthSpeed": "Sở thích về tốc độ trưởng thành của nhân vật chính",
    "consequenceLevel": "Sở thích về hậu quả thất bại",
    
    "worldBuilding": "Mức độ hứng thú với thế giới quan",
    "r18Preference": "Sở thích về nội dung R18",
    "emotionalOrientation": ["Sở thích về xu hướng tình cảm"],
    "favoriteBodyParts": ["Các bộ phận cơ thể thích được miêu tả"],
    "specialPlay": ["Sở thích về cách chơi đặc biệt"],
    "sexRolePreference": "Sở thích Công Thụ",
    
    "avoidContent": ["Những nội dung mà người dùng chọn rõ ràng muốn tránh"],
    "likes": ["Tất cả các yếu tố yêu thích (chỉ tổng hợp từ những lựa chọn thực tế của người dùng, đừng thêm vào những thứ người dùng không chọn)"],
    "dislikes": ["Tất cả các yếu tố không thích/cần tránh (chỉ tổng hợp từ những lựa chọn thực tế của người dùng)"],
    
    "immersionStyle": "Sở thích về ngôi kể chuyện",
    "surprisePreference": ["Sở thích về các sự kiện bất ngờ"],
    "aiCreativity": "Sở thích về mức độ tự do sáng tác của AI",
    "humorStyle": ["Sở thích về phong cách hài hước"],
    "interactionFrequency": "Sở thích về tần suất tương tác của NPC",
    "timeSkipPreference": "Sở thích về nhảy vọt thời gian",
    "flashbackStyle": "Sở thích về hồi tưởng/chớp nhoáng",
    "systemIntegration": "Sở thích về việc hòa nhập hệ thống",
    
    "specialNotes": "Các lưu ý đặc biệt khác (chỉ tổng hợp các ghi chú thực tế mà người dùng đã điền, không điền thì viết "Không có")",
    "aiGuidelines": "Hướng dẫn sáng tác chi tiết cho AI (400-500 chữ, 【chỉ được tạo dựa trên nội dung người dùng thực tế đã chọn】, tuyệt đối không được thêm các sở thích mà người dùng không chọn. Nếu người dùng chọn ít, thì hướng dẫn hãy làm ngắn gọn lại, đừng tự dưng bịa đặt.)"
}`;

        const messages = [
            { role: 'system', content: 'Bạn là một nhà phân tích hồ sơ người dùng chuyên nghiệp, giỏi việc trích xuất sở thích người dùng từ các câu trả lời bảng câu hỏi. Vui lòng xuất ra kết quả phân tích theo định dạng JSON. Cốt lõi duy trì liên tục là tạo ra hộp cát kể chuyện 【Đắm chìm】 α dành cho những người dùng có tâm trí trưởng thành, khả năng tư duy phức tạp, có trình độ văn học cực cao nên rất kén chọn về câu chữ và cốt truyện' },
            { role: 'user', content: analysisPrompt }
        ];

        // Gọi API bổ sung
        const response = await callExtraAI(messages);
        console.log('[🎭Hồ sơ người dùng] Kết quả phân tích API:', response);

        // Phân tích kết quả
        let profileResult;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                profileResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Không tìm thấy kết quả ở định dạng JSON');
            }
        } catch (e) {
            console.error('[🎭Hồ sơ người dùng] Phân tích thất bại:', e);
            profileResult = {
                summary: 'Đã hoàn tất phân tích bảng câu hỏi',
                rawResponse: response,
                aiGuidelines: response
            };
        }

        // Hiển thị kết quả để người dùng xác nhận
        showProfileConfirmation(profileResult, answers);

    } catch (error) {
        console.error('[🎭Hồ sơ người dùng] Phân tích thất bại:', error);
        alert('Phân tích thất bại: ' + error.message + '\nVui lòng kiểm tra xem cấu hình API bổ sung đã chính xác chưa.');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Gửi và phân tích';
        }
    }
}

/**
 * Hiển thị cửa sổ popup xác nhận hồ sơ
 */
function showProfileConfirmation(profileResult, originalAnswers) {
    closeQuestionnaireModal();

    const modal = document.createElement('div');
    modal.id = 'profileConfirmModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10001;
        display: flex; justify-content: center; align-items: center;
    `;

    const profileDisplay = `
<strong>📌 Tóm tắt hồ sơ người dùng</strong>
${profileResult.summary || 'Tạm thời chưa có'}

<strong>═══ Sở thích cốt truyện ═══</strong>
📖 Loại cốt truyện: ${profileResult.storyPreference || 'Chưa xác định'}
🎭 Nhịp điệu câu chuyện: ${profileResult.storyTone || 'Chưa xác định'}
📐 Cấu trúc cốt truyện: ${profileResult.storyStructure || 'Chưa xác định'}
⏱️ Sở thích nhịp độ: ${profileResult.pacing || 'Chưa xác định'}
🔄 Sở thích lật lọng: ${profileResult.plotTwistPreference || 'Chưa xác định'}

<strong>═══ Phong cách viết và miêu tả ═══</strong>
✍️ Sở thích phong cách viết: ${profileResult.writingStyle || 'Chưa xác định'}
📚 Tác phẩm yêu thích: ${profileResult.favoriteWorks || 'Chưa điền'}
💬 Phong cách đối thoại: ${profileResult.dialogueStyle || 'Chưa xác định'}
📏 Mức độ chi tiết: ${profileResult.detailLevel || 'Chưa xác định'}
🔍 Trọng tâm miêu tả: ${Array.isArray(profileResult.descriptionFocus) ? profileResult.descriptionFocus.join('、') : profileResult.descriptionFocus || 'Chưa xác định'}

<strong>═══ Tương tác nhân vật ═══</strong>
🦸 Loại nhân vật chính: ${profileResult.protagonistType || 'Chưa xác định'}
💕 Nhân vật yêu thích: ${Array.isArray(profileResult.favoriteCharacters) ? profileResult.favoriteCharacters.join('、') : profileResult.favoriteCharacters || 'Chưa xác định'}
💑 Độ sâu của mối quan hệ: ${profileResult.relationshipDepth || 'Chưa xác định'}
💞 Tuyến tình cảm: ${profileResult.haremPreference || 'Chưa xác định'}
👥 Phong cách NPC: ${profileResult.npcStyle || 'Chưa xác định'}

<strong>═══ Chiến đấu và Mạo hiểm ═══</strong>
⚔️ Sở thích độ khó: ${profileResult.difficulty || 'Chưa xác định'}
🗡️ Phong cách chiến đấu: ${profileResult.combatStyle || 'Chưa xác định'}
💪 Nhu cầu sảng khoái: ${profileResult.powerFantasy || 'Chưa xác định'}
📈 Tốc độ trưởng thành: ${profileResult.growthSpeed || 'Chưa xác định'}

<strong>═══ Sở thích nội dung ═══</strong>
🌍 Hứng thú thế giới quan: ${profileResult.worldBuilding || 'Chưa xác định'}
🔞 Sở thích R18: ${profileResult.r18Preference || 'Chưa xác định'}
🎬 Sở thích kết cục: ${profileResult.endingPreference || 'Chưa xác định'}

<strong>═══ Sở thích đặc biệt ═══</strong>
🎯 Ngôi kể chuyện: ${profileResult.immersionStyle || 'Chưa xác định'}
🎲 Tự do sáng tác của AI: ${profileResult.aiCreativity || 'Chưa xác định'}
😄 Phong cách hài hước: ${Array.isArray(profileResult.humorStyle) ? profileResult.humorStyle.join('、') : profileResult.humorStyle || 'Chưa xác định'}

<strong>❤️ Các yếu tố yêu thích</strong>
${Array.isArray(profileResult.likes) ? profileResult.likes.join('、') : profileResult.likes || 'Chưa xác định'}

<strong>🚫 Các yếu tố không thích/Cần tránh</strong>
${Array.isArray(profileResult.dislikes) ? profileResult.dislikes.join('、') : profileResult.dislikes || 'Chưa xác định'}

<strong>📝 Đặc biệt lưu ý</strong>
${profileResult.specialNotes || 'Không có'}

<strong>🤖 Hướng dẫn sáng tác AI</strong>
${profileResult.aiGuidelines || 'Không có'}
    `.trim();

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; 
                    max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 25px; color: white;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #4CAF50;">✅ Đã phân tích xong hồ sơ người dùng</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 20px; font-size: 14px;">
                Vui lòng xác nhận kết quả phân tích dưới đây, sau khi xác nhận sẽ được lưu làm hồ sơ độc quyền của bạn
            </p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; 
                        white-space: pre-wrap; line-height: 1.8; font-size: 14px; max-height: 400px; overflow-y: auto;">
${profileDisplay}
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeProfileConfirmModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ Hủy bỏ
                </button>
                <button onclick="confirmAndSaveProfile()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ✅ Xác nhận và lưu hồ sơ
                </button>
            </div>
        </div>
    `;

    // Lưu trữ tạm thời hồ sơ chờ xác nhận
    window._pendingUserProfile = {
        result: profileResult,
        answers: originalAnswers,
        createdAt: new Date().toISOString()
    };

    document.body.appendChild(modal);
}

/**
 * Đóng cửa sổ popup xác nhận hồ sơ
 */
function closeProfileConfirmModal() {
    const modal = document.getElementById('profileConfirmModal');
    if (modal) modal.remove();
    window._pendingUserProfile = null;
}

/**
 * Xác nhận và lưu hồ sơ người dùng vào IndexedDB
 */
async function confirmAndSaveProfile() {
    if (!window._pendingUserProfile) {
        alert('Không có hồ sơ người dùng nào chờ lưu');
        return;
    }

    const pendingProfile = window._pendingUserProfile;

    // Nếu hiện tại có hồ sơ đang kích hoạt, hỏi người dùng cách lưu
    if (activeProfileId) {
        const currentProfile = await loadProfileById(activeProfileId);
        const currentName = currentProfile?.name || 'Hồ sơ hiện tại';

        // Bật hộp thoại lựa chọn
        const choice = confirm(
            `⚠️ Bạn hiện đang sử dụng hồ sơ 「${currentName}」\n\n` +
            `Bấm 「OK」→ Lưu thành hồ sơ mới (Đề xuất)\n` +
            `Bấm 「Cancel」→ Ghi đè lên hồ sơ hiện tại`
        );

        if (choice) {
            // Lưu thành hồ sơ mới
            const newName = prompt('Vui lòng đặt tên cho hồ sơ mới:', 'Hồ sơ bảng câu hỏi ' + new Date().toLocaleDateString());
            if (!newName) {
                // Người dùng đã hủy đặt tên
                return;
            }

            try {
                const newId = await saveProfileWithName(pendingProfile, newName.trim());
                await switchToProfile(newId);
                await refreshProfileSelector();

                closeProfileConfirmModal();
                alert(`✅ Hồ sơ mới 「${newName.trim()}」 đã được lưu!\n\nHồ sơ gốc 「${currentName}」 vẫn được giữ nguyên.`);
            } catch (error) {
                console.error('[🎭Hồ sơ người dùng] Lưu thất bại:', error);
                alert('Lưu thất bại: ' + error.message);
            }
            return;
        }
        // Nếu chọn Cancel, tiếp tục thực hiện logic ghi đè
    }

    // Ghi đè lên hồ sơ hiện tại hoặc lưu lần đầu
    confirmedUserProfile = pendingProfile;

    // Lưu vào IndexedDB
    try {
        await saveUserProfileToIndexedDB(confirmedUserProfile);

        // Nếu có hồ sơ đang kích hoạt, đồng bộ cập nhật lưu trữ đa hồ sơ
        if (activeProfileId) {
            const name = confirmedUserProfile?.name || 'Hồ sơ bảng câu hỏi';
            await saveProfileWithName(confirmedUserProfile, name, activeProfileId);
        }

        console.log('[🎭Hồ sơ người dùng] Đã lưu vào IndexedDB');

        // Cập nhật hiển thị UI
        updateProfileDisplay();
        await refreshProfileSelector();

        closeProfileConfirmModal();
        alert('✅ Hồ sơ người dùng đã được lưu!\n\nAI sẽ tùy chỉnh hướng đi của cốt truyện dựa trên hồ sơ của bạn.\nHồ sơ sẽ được sao lưu và import/export cùng với tệp save.');

    } catch (error) {
        console.error('[🎭Hồ sơ người dùng] Lưu thất bại:', error);
        alert('Lưu thất bại: ' + error.message);
    }
}

/**
 * Cập nhật hiển thị hồ sơ
 */
function updateProfileDisplay() {
    const textarea = document.getElementById('currentUserProfile');
    if (textarea && confirmedUserProfile && confirmedUserProfile.result) {
        // Sử dụng hiển thị hồ sơ đầy đủ (giống với loadUserProfileSettingsToUI)
        textarea.value = generateEditableProfileText(confirmedUserProfile.result, confirmedUserProfile.createdAt);
    }
}

/**
 * Lưu thủ công các thay đổi hồ sơ người dùng
 * Cho phép người dùng trực tiếp chỉnh sửa nội dung trong textarea và lưu
 */
async function saveManualProfileEdit() {
    const textarea = document.getElementById('currentUserProfile');
    if (!textarea) {
        alert('❌ Không tìm thấy ô nhập hồ sơ!');
        console.error('[🎭Hồ sơ người dùng] Không tìm thấy phần tử có id="currentUserProfile"');
        return;
    }

    const content = textarea.value.trim();
    console.log('[🎭Hồ sơ người dùng] ========== Bắt đầu lưu ==========');
    console.log('[🎭Hồ sơ người dùng] Độ dài nội dung gốc lấy từ textarea:', content.length);
    console.log('[🎭Hồ sơ người dùng] Nội dung gốc lấy từ textarea (500 ký tự đầu):', content.substring(0, 500));

    if (!content) {
        alert('⚠️ Nội dung hồ sơ không được để trống!');
        return;
    }

    try {
        // Phân tích cú pháp nội dung hồ sơ do người dùng nhập
        const parsedProfile = parseManualProfileInput(content);
        console.log('[🎭Hồ sơ người dùng] Kết quả phân tích cú pháp (tất cả các trường):', JSON.stringify(parsedProfile, null, 2));

        // Tạo đối tượng profile mới (không sửa đổi đối tượng gốc)
        const newProfile = {
            createdAt: confirmedUserProfile?.createdAt || new Date().toISOString(),
            answers: confirmedUserProfile?.answers || {},
            result: {},
            updatedAt: new Date().toISOString()
        };

        // Nếu đã có kết quả cũ, sao chép sang trước
        if (confirmedUserProfile && confirmedUserProfile.result) {
            console.log('[🎭Hồ sơ người dùng] summary của hồ sơ cũ:', confirmedUserProfile.result.summary);
            newProfile.result = { ...confirmedUserProfile.result };
        }

        // Dùng giá trị mới vừa phân tích được để ghi đè (chỉ ghi đè những giá trị không rỗng)
        let updatedCount = 0;
        for (const [key, value] of Object.entries(parsedProfile)) {
            if (value !== undefined && value !== null && value !== '' &&
                !(Array.isArray(value) && value.length === 0)) {
                const oldValue = newProfile.result[key];
                newProfile.result[key] = value;
                if (oldValue !== value) {
                    console.log(`[🎭Hồ sơ người dùng] Cập nhật trường ${key}: "${String(oldValue).substring(0, 50)}" -> "${String(value).substring(0, 50)}"`);
                    updatedCount++;
                }
            }
        }
        console.log(`[🎭Hồ sơ người dùng] Tổng cộng đã cập nhật ${updatedCount} trường`);

        // Đánh dấu là đã chỉnh sửa thủ công
        newProfile.result.manuallyEdited = true;
        newProfile.result.lastEditedAt = new Date().toISOString();

        console.log('[🎭Hồ sơ người dùng] summary của hồ sơ được lưu cuối cùng:', newProfile.result.summary);

        // Lưu vào IndexedDB
        await saveUserProfileToIndexedDB(newProfile);
        console.log('[🎭Hồ sơ người dùng] Đã hoàn tất lưu vào IndexedDB');

        // Tải lại từ IndexedDB để xác nhận đã lưu thành công
        const reloadedProfile = await loadUserProfileFromIndexedDB();

        if (reloadedProfile && reloadedProfile.result) {
            confirmedUserProfile = reloadedProfile;
            console.log('[🎭Hồ sơ người dùng] Xác minh lưu thành công, reloaded summary:', reloadedProfile.result.summary);
            alert('✅ Các thay đổi hồ sơ người dùng đã được lưu!\n\nAI sẽ tùy chỉnh hướng đi của cốt truyện dựa trên hồ sơ đã sửa đổi.');
        } else {
            console.error('[🎭Hồ sơ người dùng] Xác minh lưu thất bại, dữ liệu chưa được ghi chính xác');
            alert('⚠️ Có thể chưa lưu thành công, vui lòng tải lại trang để xác nhận!');
        }
    } catch (error) {
        console.error('[🎭Hồ sơ người dùng] Lưu thất bại:', error);
        alert('❌ Lưu thất bại: ' + error.message);
    }
}

/**
 * Phân tích cú pháp nội dung hồ sơ do người dùng nhập thủ công
 * Cố gắng trích xuất thông tin quan trọng từ văn bản (hỗ trợ định dạng hồ sơ đầy đủ)
 */
function parseManualProfileInput(content) {
    const result = {};

    // Phân tích theo từng dòng
    const lines = content.split('\n');

    // Dùng để thu thập nội dung nhiều dòng của Hướng dẫn sáng tác AI
    let inAIGuidelines = false;
    let aiGuidelinesLines = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Bỏ qua dòng phân cách và dòng trống, nhưng xử lý đặc biệt cho 【Hướng dẫn sáng tác AI】
        if (trimmedLine === '---') {
            // Gặp dòng phân cách, kết thúc thu thập Hướng dẫn sáng tác AI
            if (inAIGuidelines) {
                inAIGuidelines = false;
                console.log('[🎭Phân tích cú pháp] Gặp dòng phân cách, kết thúc thu thập Hướng dẫn sáng tác AI, tổng cộng ' + aiGuidelinesLines.length + ' dòng');
            }
            continue;
        }

        if (trimmedLine === '') {
            continue;
        }

        // Xử lý tiêu đề phân loại định dạng 【xxx】
        if (trimmedLine.startsWith('【') && trimmedLine.endsWith('】')) {
            // Nếu là 【Hướng dẫn sáng tác AI】, bắt đầu thu thập nội dung phía sau
            if (trimmedLine === '【Hướng dẫn sáng tác AI】') {
                inAIGuidelines = true;
                aiGuidelinesLines = []; // Dọn sạch nội dung trước đó
                console.log('[🎭Phân tích cú pháp] Bắt đầu thu thập Hướng dẫn sáng tác AI');
            } else {
                // Các tiêu đề phân loại khác, kết thúc thu thập Hướng dẫn sáng tác AI
                if (inAIGuidelines) {
                    inAIGuidelines = false;
                    console.log('[🎭Phân tích cú pháp] Kết thúc thu thập Hướng dẫn sáng tác AI, tổng cộng ' + aiGuidelinesLines.length + ' dòng');
                }
            }
            continue;
        }

        // Nếu đang thu thập Hướng dẫn sáng tác AI
        if (inAIGuidelines) {
            if (trimmedLine.startsWith('Thời gian tạo:')) {
                inAIGuidelines = false;
            } else {
                aiGuidelinesLines.push(trimmedLine);
                continue;
            }
        }

        // Phân tích các trường khác nhau
        if (trimmedLine.startsWith('📌') || trimmedLine.includes('Đặc điểm người dùng:')) {
            result.summary = trimmedLine.replace(/^📌\s*/, '').replace('Đặc điểm người dùng:', '').trim();
        }
        // Sở thích cốt truyện
        else if (trimmedLine.startsWith('Loại cốt truyện:') || trimmedLine.startsWith('Sở thích cốt truyện:')) {
            result.storyPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Nhịp điệu câu chuyện:')) {
            result.storyTone = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Cấu trúc cốt truyện:')) {
            result.storyStructure = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Sở thích nhịp độ:')) {
            result.pacing = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Sở thích bước ngoặt:') || trimmedLine.startsWith('Sở thích lật lọng:') || trimmedLine.startsWith('Sở thích thay đổi bất ngờ:')) {
            result.plotTwistPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Loại xung đột:')) {
            result.conflictTypes = parseArrayValue(trimmedLine);
        }
        // Phong cách viết và miêu tả
        else if (trimmedLine.startsWith('Sở thích phong cách viết:')) {
            result.writingStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Tác phẩm yêu thích:')) {
            result.favoriteWorks = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Yêu cầu chi tiết về phong cách viết:') || trimmedLine.startsWith('Yêu cầu chi tiết văn phong:')) {
            result.writingStyleDetails = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Phong cách đối thoại:')) {
            result.dialogueStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Độ chi tiết khi trả lời:') || trimmedLine.startsWith('Mức độ chi tiết phản hồi:')) {
            result.detailLevel = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Trọng tâm miêu tả:')) {
            result.descriptionFocus = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Cách kể chuyện:') || trimmedLine.startsWith('Thủ pháp tự sự:')) {
            result.narrativeStyle = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Phong cách dùng từ:')) {
            result.languageStyle = getValueAfterColon(trimmedLine);
        }
        // Tương tác nhân vật
        else if (trimmedLine.startsWith('Loại nhân vật chính:')) {
            result.protagonistType = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Tính cách nhân vật chính:')) {
            result.protagonistPersonality = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Hoàn cảnh nhân vật chính:') || trimmedLine.startsWith('Bối cảnh nhân vật chính:')) {
            result.protagonistBackground = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Nhân vật yêu thích:')) {
            result.favoriteCharacters = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Loại mối quan hệ:') || trimmedLine.startsWith('Loại quan hệ:')) {
            result.relationshipTypes = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Độ sâu của mối quan hệ:') || trimmedLine.startsWith('Độ sâu quan hệ:')) {
            result.relationshipDepth = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Tuyến tình cảm:')) {
            result.haremPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Phong cách NPC:')) {
            result.npcStyle = getValueAfterColon(trimmedLine);
        }
        // Chiến đấu và Mạo hiểm
        else if (trimmedLine.startsWith('Sở thích độ khó:')) {
            result.difficulty = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Phong cách chiến đấu:')) {
            result.combatStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Yếu tố chiến đấu:')) {
            result.combatElements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Yêu cầu cảm giác thỏa mãn:') || trimmedLine.startsWith('Nhu cầu sảng khoái:')) {
            result.powerFantasy = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Loại kẻ thù:')) {
            result.enemyTypes = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Tốc độ phát triển:') || trimmedLine.startsWith('Tốc độ trưởng thành:')) {
            result.growthSpeed = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Hậu quả khi thất bại:') || trimmedLine.startsWith('Hậu quả thất bại:')) {
            result.consequenceLevel = getValueAfterColon(trimmedLine);
        }
        // Thế giới và Nội dung
        else if (trimmedLine.startsWith('Sự quan tâm đến thế giới quan:') || trimmedLine.startsWith('Hứng thú thế giới quan:')) {
            result.worldBuilding = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Yếu tố thế giới:')) {
            result.worldElements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Lựa chọn đạo đức:')) {
            result.moralChoices = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Sở thích R18:')) {
            result.r18Preference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Loại R18:')) {
            result.r18Elements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Sở thích kết thúc:') || trimmedLine.startsWith('Sở thích kết cục:')) {
            result.endingPreference = getValueAfterColon(trimmedLine);
        }
        // Sở thích đặc biệt
        else if (trimmedLine.startsWith('Ngôi kể:') || trimmedLine.startsWith('Ngôi kể tự sự:')) {
            result.immersionStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Độ tự do sáng tạo của AI:') || trimmedLine.startsWith('Độ tự do sáng tác của AI:')) {
            result.aiCreativity = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Phong cách hài hước:')) {
            result.humorStyle = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('Nhảy vọt thời gian:')) {
            result.timeSkipPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('Tích hợp hệ thống:') || trimmedLine.startsWith('Hòa nhập hệ thống:')) {
            result.systemIntegration = getValueAfterColon(trimmedLine);
        }
        // Sở thích cốt lõi
        else if (trimmedLine.startsWith('Thích:')) {
            const val = getValueAfterColon(trimmedLine);
            if (val && val !== 'Không có') {
                result.likes = val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
            }
        } else if (trimmedLine.startsWith('Không thích:')) {
            const val = getValueAfterColon(trimmedLine);
            if (val && val !== 'Không có') {
                result.dislikes = val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
            }
        } else if (trimmedLine.startsWith('Đặc biệt chú ý:') || trimmedLine.startsWith('Chú ý đặc biệt:')) {
            result.specialNotes = getValueAfterColon(trimmedLine);
        }
        // Hướng dẫn sáng tác AI (có thể là nhiều dòng)
        else if (trimmedLine.startsWith('【Hướng dẫn sáng tác AI】') || trimmedLine === 'Hướng dẫn sáng tạo cho AI:' || trimmedLine === 'Hướng dẫn sáng tác AI:' || trimmedLine === '【Hướng dẫn sáng tạo cho AI】') {
            inAIGuidelines = true;
            const afterColon = trimmedLine.split(':')[1]?.trim();
            if (afterColon) {
                aiGuidelinesLines.push(afterColon);
            }
        } else if (trimmedLine.startsWith('Hướng dẫn sáng tạo cho AI:') || trimmedLine.startsWith('Hướng dẫn sáng tác:')) {
            result.aiGuidelines = trimmedLine.split(':').slice(1).join(':').trim();
        }
    }

    // Gộp Hướng dẫn sáng tác AI
    if (aiGuidelinesLines.length > 0) {
        result.aiGuidelines = aiGuidelinesLines.join('\n');
        console.log('[🎭Phân tích cú pháp] Hướng dẫn sáng tác AI sau khi gộp (200 ký tự đầu):', result.aiGuidelines.substring(0, 200));
    } else {
        console.log('[🎭Phân tích cú pháp] Không thu thập được nội dung Hướng dẫn sáng tác AI');
    }

    // Nếu không phân tích ra được summary, dùng dòng đầu tiên của toàn bộ nội dung
    if (!result.summary && content.length > 0) {
        const firstLine = lines[0]?.replace(/^📌\s*/, '').replace(/^📋\s*/, '').replace('Đặc điểm người dùng:', '').trim();
        result.summary = firstLine || content.substring(0, 100);
    }

    // Lưu lại cả nội dung gốc để tiện xem xét
    result.rawContent = content;

    return result;
}

/**
 * Trích xuất giá trị đằng sau dấu hai chấm
 */
function getValueAfterColon(line) {
    const parts = line.split(':');
    // Nếu dùng dấu hai chấm toàn giác thì thử cắt thêm
    if (parts.length === 1 && line.includes('：')) {
        const parts2 = line.split('：');
        return parts2.length > 1 ? parts2.slice(1).join('：').trim() : '';
    }
    return parts.length > 1 ? parts.slice(1).join(':').trim() : '';
}

/**
 * Phân tích cú pháp giá trị mảng (phân cách bằng dấu phẩy, dấu chấm than)
 */
function parseArrayValue(line) {
    const val = getValueAfterColon(line);
    if (!val || val === 'Không có' || val === 'Chưa xác định') return null;
    return val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
}

// ==================== Lưu trữ hồ sơ người dùng IndexedDB ====================

const USER_PROFILE_DB_NAME = 'UserProfileDB';
const USER_PROFILE_STORE_NAME = 'userProfile';  // Giữ lại để tương thích với dữ liệu cũ
const USER_PROFILES_STORE_NAME = 'userProfiles'; // Thêm mới: Lưu trữ nhiều hồ sơ
const ACTIVE_PROFILE_STORE_NAME = 'activeProfile'; // Thêm mới: ID hồ sơ đang kích hoạt

// ID hồ sơ đang kích hoạt
let activeProfileId = null;

/**
 * Mở IndexedDB (Nâng cấp lên phiên bản 2 để hỗ trợ nhiều hồ sơ)
 */
function openUserProfileDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(USER_PROFILE_DB_NAME, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            // Phiên bản 1: Lưu trữ hồ sơ đơn (Tương thích với dữ liệu cũ)
            if (!db.objectStoreNames.contains(USER_PROFILE_STORE_NAME)) {
                db.createObjectStore(USER_PROFILE_STORE_NAME, { keyPath: 'id' });
            }

            // Phiên bản 2: Lưu trữ nhiều hồ sơ
            if (oldVersion < 2) {
                // Tạo bộ lưu trữ nhiều hồ sơ
                if (!db.objectStoreNames.contains(USER_PROFILES_STORE_NAME)) {
                    const profilesStore = db.createObjectStore(USER_PROFILES_STORE_NAME, { keyPath: 'id' });
                    profilesStore.createIndex('name', 'name', { unique: false });
                    profilesStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                // Tạo bộ lưu trữ ID hồ sơ đang kích hoạt
                if (!db.objectStoreNames.contains(ACTIVE_PROFILE_STORE_NAME)) {
                    db.createObjectStore(ACTIVE_PROFILE_STORE_NAME, { keyPath: 'key' });
                }
                console.log('[🎭Hồ sơ người dùng] Cơ sở dữ liệu nâng cấp lên phiên bản 2, hỗ trợ lưu trữ nhiều hồ sơ');
            }
        };
    });
}

/**
 * Tạo ID hồ sơ duy nhất
 */
function generateProfileId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Lấy danh sách tất cả hồ sơ đã lưu
 * @returns {Promise<Array>} Danh sách hồ sơ [{id, name, createdAt, ...}, ...]
 */
async function getAllUserProfiles() {
    try {
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readonly');
            const store = tx.objectStore(USER_PROFILES_STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => {
                db.close();
                const profiles = request.result || [];
                // Sắp xếp theo thời gian tạo giảm dần
                profiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                resolve(profiles);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Lấy danh sách hồ sơ thất bại:', e);
        return [];
    }
}

/**
 * Lưu hồ sơ với tên được chỉ định
 * @param {object} profile - Dữ liệu hồ sơ
 * @param {string} name - Tên hồ sơ
 * @param {string|null} existingId - Nếu có cung cấp thì cập nhật hồ sơ hiện tại, nếu không thì tạo hồ sơ mới
 * @returns {Promise<string>} ID hồ sơ đã lưu
 */
async function saveProfileWithName(profile, name, existingId = null) {
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILES_STORE_NAME);

        const profileId = existingId || generateProfileId();
        const profileData = {
            id: profileId,
            name: name || 'Hồ sơ chưa đặt tên',
            ...profile,
            createdAt: existingId ? profile.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        store.put(profileData);
        tx.oncomplete = () => {
            db.close();
            console.log('[🎭Hồ sơ người dùng] Hồ sơ đã được lưu:', name, '(ID:', profileId, ')');
            resolve(profileId);
        };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * Tải hồ sơ theo ID
 * @param {string} profileId - ID hồ sơ
 * @returns {Promise<object|null>} Dữ liệu hồ sơ
 */
async function loadProfileById(profileId) {
    try {
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readonly');
            const store = tx.objectStore(USER_PROFILES_STORE_NAME);
            const request = store.get(profileId);
            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Tải hồ sơ thất bại:', e);
        return null;
    }
}

/**
 * Xóa hồ sơ được chỉ định
 * @param {string} profileId - ID hồ sơ
 */
async function deleteProfileById(profileId) {
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILES_STORE_NAME);
        store.delete(profileId);
        tx.oncomplete = () => {
            db.close();
            console.log('[🎭Hồ sơ người dùng] Hồ sơ đã bị xóa:', profileId);
            // Nếu hồ sơ bị xóa là hồ sơ đang kích hoạt, xóa trạng thái kích hoạt
            if (activeProfileId === profileId) {
                activeProfileId = null;
                confirmedUserProfile = null;
                setActiveProfileId(null);
            }
            resolve();
        };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * Đặt ID hồ sơ đang kích hoạt
 * @param {string|null} profileId - ID hồ sơ
 */
async function setActiveProfileId(profileId) {
    activeProfileId = profileId;
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ACTIVE_PROFILE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ACTIVE_PROFILE_STORE_NAME);
        store.put({ key: 'active', profileId: profileId });
        tx.oncomplete = () => {
            db.close();
            console.log('[🎭Hồ sơ người dùng] ID hồ sơ được kích hoạt:', profileId);
            resolve();
        };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * Lấy ID hồ sơ đang kích hoạt
 * @returns {Promise<string|null>}
 */
async function getActiveProfileId() {
    try {
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(ACTIVE_PROFILE_STORE_NAME, 'readonly');
            const store = tx.objectStore(ACTIVE_PROFILE_STORE_NAME);
            const request = store.get('active');
            request.onsuccess = () => {
                db.close();
                const result = request.result;
                activeProfileId = result?.profileId || null;
                resolve(activeProfileId);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Lấy ID hồ sơ đang kích hoạt thất bại:', e);
        return null;
    }
}

/**
 * Chuyển sang hồ sơ được chỉ định
 * @param {string} profileId - ID hồ sơ
 */
async function switchToProfile(profileId) {
    const profile = await loadProfileById(profileId);
    if (profile) {
        confirmedUserProfile = profile;
        await setActiveProfileId(profileId);
        updateProfileDisplay();
        console.log('[🎭Hồ sơ người dùng] Đã chuyển sang hồ sơ:', profile.name);
        return true;
    }
    return false;
}

/**
 * Làm mới hộp thoại thả xuống chọn hồ sơ
 */
async function refreshProfileSelector() {
    const selector = document.getElementById('profileSelector');
    if (!selector) return;

    const profiles = await getAllUserProfiles();
    const currentActiveId = activeProfileId || await getActiveProfileId();

    // Xóa các tùy chọn
    selector.innerHTML = '<option value="">-- Chưa chọn hồ sơ --</option>';

    // Thêm các tùy chọn hồ sơ
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name || 'Hồ sơ chưa đặt tên';
        if (profile.id === currentActiveId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    // Cập nhật ô nhập tên hồ sơ
    const nameInput = document.getElementById('profileName');
    if (nameInput && currentActiveId) {
        const currentProfile = profiles.find(p => p.id === currentActiveId);
        if (currentProfile) {
            nameInput.value = currentProfile.name || '';
        }
    }

    console.log('[🎭Hồ sơ người dùng] Bộ chọn hồ sơ đã được làm mới, tổng cộng', profiles.length, 'hồ sơ');
}

/**
 * Sự kiện thay đổi của hộp chọn hồ sơ
 */
async function onProfileSelectorChange() {
    const selector = document.getElementById('profileSelector');
    const selectedId = selector?.value;

    if (!selectedId) {
        // Xóa hồ sơ hiện tại
        confirmedUserProfile = null;
        activeProfileId = null;
        await setActiveProfileId(null);
        updateProfileDisplay();

        // Xóa sạch ô nhập tên
        const nameInput = document.getElementById('profileName');
        if (nameInput) nameInput.value = '';

        // Xóa sạch textarea
        const textarea = document.getElementById('currentUserProfile');
        if (textarea) {
            textarea.value = 'Chưa chọn hồ sơ, vui lòng chọn từ danh sách thả xuống hoặc tạo hồ sơ mới.';
        }
        return;
    }

    await switchToProfile(selectedId);

    // Cập nhật ô nhập tên
    const nameInput = document.getElementById('profileName');
    if (nameInput && confirmedUserProfile) {
        nameInput.value = confirmedUserProfile.name || '';
    }
}

/**
 * Lưu thành hồ sơ mới
 */
async function saveProfileAsNew() {
    const nameInput = document.getElementById('profileName');
    const textarea = document.getElementById('currentUserProfile');

    const name = nameInput?.value?.trim();
    if (!name) {
        alert('⚠️ Vui lòng nhập tên hồ sơ trước!');
        nameInput?.focus();
        return;
    }

    const content = textarea?.value?.trim();
    if (!content) {
        alert('⚠️ Nội dung hồ sơ không được để trống!');
        return;
    }

    try {
        // Phân tích nội dung hồ sơ
        const parsedProfile = parseManualProfileInput(content);

        const newProfile = {
            result: parsedProfile,
            answers: {},
            createdAt: new Date().toISOString()
        };

        // Lưu thành hồ sơ mới
        const newId = await saveProfileWithName(newProfile, name);

        // Chuyển sang hồ sơ mới
        await switchToProfile(newId);

        // Làm mới hộp chọn
        await refreshProfileSelector();

        alert('✅ Hồ sơ 「' + name + '」 đã được lưu!');
    } catch (error) {
        console.error('[🎭Hồ sơ người dùng] Lưu hồ sơ mới thất bại:', error);
        alert('❌ Lưu thất bại: ' + error.message);
    }
}

/**
 * Xóa hồ sơ hiện tại
 */
async function deleteCurrentProfile() {
    if (!activeProfileId) {
        alert('⚠️ Hiện không có hồ sơ nào được chọn!');
        return;
    }

    const currentProfile = await loadProfileById(activeProfileId);
    const name = currentProfile?.name || 'Hồ sơ chưa đặt tên';

    if (!confirm(`⚠️ Bạn có chắc chắn muốn xóa hồ sơ 「${name}」 không?\n\nThao tác này không thể hoàn tác!`)) {
        return;
    }

    try {
        await deleteProfileById(activeProfileId);

        // Làm mới hộp chọn
        await refreshProfileSelector();

        // Xóa hiển thị
        const textarea = document.getElementById('currentUserProfile');
        if (textarea) {
            textarea.value = 'Hồ sơ đã bị xóa. Vui lòng chọn từ danh sách thả xuống hoặc tạo hồ sơ mới.';
        }

        const nameInput = document.getElementById('profileName');
        if (nameInput) nameInput.value = '';

        alert('✅ Hồ sơ 「' + name + '」 đã bị xóa!');
    } catch (error) {
        console.error('[🎭Hồ sơ người dùng] Xóa hồ sơ thất bại:', error);
        alert('❌ Xóa thất bại: ' + error.message);
    }
}

/**
 * Chuyển đổi hồ sơ đơn cũ sang lưu trữ nhiều hồ sơ mới
 */
async function migrateOldProfile() {
    try {
        const db = await openUserProfileDB();

        // Kiểm tra xem có hồ sơ phiên bản cũ không
        const checkTx = db.transaction(USER_PROFILE_STORE_NAME, 'readonly');
        const checkStore = checkTx.objectStore(USER_PROFILE_STORE_NAME);
        const oldProfile = await new Promise((resolve) => {
            const request = checkStore.get('main');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });

        if (oldProfile && oldProfile.result) {
            // Kiểm tra xem đã chuyển đổi chưa
            const profiles = await getAllUserProfiles();
            if (profiles.length === 0) {
                // Chuyển đổi hồ sơ cũ
                const name = 'Hồ sơ mặc định (Đã chuyển đổi)';
                const newId = await saveProfileWithName(oldProfile, name);
                await setActiveProfileId(newId);
                confirmedUserProfile = await loadProfileById(newId);
                console.log('[🎭Hồ sơ người dùng] Đã chuyển đổi hồ sơ cũ sang bộ lưu trữ mới');
            }
        }

        db.close();
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Chuyển đổi hồ sơ cũ thất bại:', e);
    }
}

/**
 * Lưu hồ sơ người dùng vào IndexedDB (Tương thích phiên bản cũ + Lưu trữ nhiều hồ sơ)
 */
async function saveUserProfileToIndexedDB(profile) {
    // Đồng thời lưu vào bộ lưu trữ cũ (Để tương thích)
    const db = await openUserProfileDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILE_STORE_NAME);
        store.put({ id: 'main', ...profile });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();

    // Nếu có hồ sơ đang kích hoạt, đồng thời cập nhật bộ lưu trữ nhiều hồ sơ
    if (activeProfileId) {
        const name = confirmedUserProfile?.name || profile?.name || 'Hồ sơ chưa đặt tên';
        await saveProfileWithName(profile, name, activeProfileId);
    }
}

/**
 * Tải hồ sơ người dùng từ IndexedDB (Ưu tiên tải hồ sơ đang kích hoạt)
 */
async function loadUserProfileFromIndexedDB() {
    try {
        // Ưu tiên thử chuyển đổi hồ sơ cũ
        await migrateOldProfile();

        // Lấy ID hồ sơ đang kích hoạt
        const activeId = await getActiveProfileId();

        if (activeId) {
            // Tải hồ sơ đang kích hoạt
            const profile = await loadProfileById(activeId);
            if (profile) {
                confirmedUserProfile = profile;
                console.log('[🎭Hồ sơ người dùng] Đã tải hồ sơ đang kích hoạt từ IndexedDB:', profile.name);
                return confirmedUserProfile;
            }
        }

        // Nếu không có hồ sơ đang kích hoạt, thử tải hồ sơ phiên bản cũ
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readonly');
            const store = tx.objectStore(USER_PROFILE_STORE_NAME);
            const request = store.get('main');
            request.onsuccess = () => {
                db.close();
                if (request.result) {
                    confirmedUserProfile = request.result;
                    console.log('[🎭Hồ sơ người dùng] Đã tải thành công hồ sơ phiên bản cũ từ IndexedDB');
                }
                resolve(request.result);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Tải IndexedDB thất bại:', e);
        return null;
    }
}

/**
 * Xuất hồ sơ người dùng (Dành cho sao lưu) - Hỗ trợ nhiều hồ sơ
 * @returns {string|null} Chuỗi JSON, bao gồm tất cả hồ sơ và ID kích hoạt
 */
async function exportUserProfile() {
    try {
        const allProfiles = await getAllUserProfiles();
        const currentActiveId = activeProfileId || await getActiveProfileId();

        const exportData = {
            version: 2,  // Đánh dấu phiên bản nhiều hồ sơ
            activeProfileId: currentActiveId,
            profiles: allProfiles,
            // Tương thích với phiên bản cũ: Cũng xuất hồ sơ hiện đang kích hoạt
            currentProfile: confirmedUserProfile
        };

        return JSON.stringify(exportData);
    } catch (e) {
        console.warn('[🎭Hồ sơ người dùng] Xuất thất bại, lùi về chế độ hồ sơ đơn:', e);
        // Lùi lại: Chỉ xuất hồ sơ hiện tại
        return confirmedUserProfile ? JSON.stringify(confirmedUserProfile) : null;
    }
}

/**
 * Nhập hồ sơ người dùng (Dành cho khôi phục sao lưu) - Hỗ trợ nhiều hồ sơ
 * @param {string|object} profileJson - Dữ liệu hồ sơ
 */
async function importUserProfile(profileJson) {
    try {
        const data = typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson;

        // Kiểm tra xem có phải là định dạng nhiều hồ sơ không (Phiên bản 2+)
        if (data.version >= 2 && Array.isArray(data.profiles)) {
            console.log('[🎭Hồ sơ người dùng] Phát hiện tệp lưu nhiều hồ sơ, tổng cộng', data.profiles.length, 'hồ sơ');

            // Nhập tất cả hồ sơ
            for (const profile of data.profiles) {
                if (profile.id && profile.name) {
                    await saveProfileWithName(profile, profile.name, profile.id);
                }
            }

            // Đặt hồ sơ kích hoạt
            if (data.activeProfileId) {
                await switchToProfile(data.activeProfileId);
            } else if (data.profiles.length > 0) {
                // Nếu không có ID kích hoạt, sử dụng cái đầu tiên
                await switchToProfile(data.profiles[0].id);
            }

            await refreshProfileSelector();
            console.log('[🎭Hồ sơ người dùng] Nhập nhiều hồ sơ thành công');
            return true;
        }

        // Tương thích với định dạng hồ sơ đơn phiên bản cũ
        let oldProfile = data;
        if (data.currentProfile) {
            oldProfile = data.currentProfile;
        }

        // Tạo một cái tên cho hồ sơ phiên bản cũ
        const name = oldProfile.name || 'Hồ sơ đã nhập';
        const newId = await saveProfileWithName(oldProfile, name);
        await switchToProfile(newId);
        await refreshProfileSelector();

        console.log('[🎭Hồ sơ người dùng] Nhập hồ sơ đơn thành công');
        return true;
    } catch (e) {
        console.error('[🎭Hồ sơ người dùng] Nhập thất bại:', e);
        return false;
    }
}

/**
 * Lấy Hướng dẫn sáng tác AI (Dành cho API phân tích sử dụng)
 */
function getAIGuidelines() {
    if (!confirmedUserProfile || !confirmedUserProfile.result) {
        return null;
    }
    return confirmedUserProfile.result.aiGuidelines || null;
}

/**
 * Lấy hồ sơ xác nhận đầy đủ
 */
function getConfirmedProfile() {
    return confirmedUserProfile;
}

// ==================== Xuất ra toàn cục ====================

// Gắn vào đối tượng window để các module khác gọi
window.userProfileAnalyzer = {
    init: initUserProfileSystem,
    analyze: analyzeUserInput,
    analyzeUserInput: analyzeUserInput,  // Bí danh, tương thích với cả hai cách gọi
    getEnhancedPrompt: getEnhancedPromptForMainAPI,
    getProfile: () => userProfileData,
    getConfig: () => userProfileConfig,
    isEnabled: () => userProfileConfig.enabled,
    loadSettingsToUI: loadUserProfileSettingsToUI,
    // Thêm mới: Liên quan đến bảng câu hỏi
    getConfirmedProfile: getConfirmedProfile,
    getAIGuidelines: getAIGuidelines,
    exportProfile: exportUserProfile,
    importProfile: importUserProfile,
    loadFromDB: loadUserProfileFromIndexedDB
};

// Xuất hàm giao diện ra toàn cục (để onclick gọi)
window.toggleUserProfileFields = toggleUserProfileFields;
window.saveUserProfileSettings = saveUserProfileSettings;
window.toggleMemoryDispatcherMode = toggleMemoryDispatcherMode;  // 🆕 Công tắc chế độ bộ điều phối bộ nhớ
window.viewUserProfile = viewUserProfile;
window.clearUserProfile = clearUserProfile;
window.openUserProfileQuestionnaire = openUserProfileQuestionnaire;
window.closeQuestionnaireModal = closeQuestionnaireModal;
window.submitQuestionnaire = submitQuestionnaire;
window.closeProfileConfirmModal = closeProfileConfirmModal;
window.confirmAndSaveProfile = confirmAndSaveProfile;
window.saveManualProfileEdit = saveManualProfileEdit;

// 🆕 Xuất hàm quản lý nhiều hồ sơ
window.onProfileSelectorChange = onProfileSelectorChange;
window.saveProfileAsNew = saveProfileAsNew;
window.deleteCurrentProfile = deleteCurrentProfile;
window.refreshProfileSelector = refreshProfileSelector;
window.getAllUserProfiles = getAllUserProfiles;
window.switchToProfile = switchToProfile;

// ==================== 📚 Cửa sổ popup lưu trữ kế hoạch cốt truyện ====================

/**
 * Hiển thị cửa sổ popup lưu trữ kế hoạch cốt truyện
 */
function showPlotArchiveModal() {
    // Nếu đã tồn tại cửa sổ popup, xóa trước
    const existingModal = document.getElementById('plotArchiveModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Lấy cốt truyện nhóm theo tên
    const plotsByName = plotArchiveManager.getPlotsByName();
    const plotNames = Object.keys(plotsByName).sort((a, b) => {
        // Sắp xếp theo dấu thời gian mới nhất
        const aTime = plotsByName[a][plotsByName[a].length - 1]?.timestamp || 0;
        const bTime = plotsByName[b][plotsByName[b].length - 1]?.timestamp || 0;
        return bTime - aTime;
    });

    // Tạo HTML của cửa sổ popup
    const modalHtml = `
        <div id="plotArchiveModal" class="modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; width: 90%; max-width: 900px; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid rgba(100,100,255,0.2);">
                <div class="modal-header" style="padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #fff; font-size: 1.4rem;">📚 Lưu trữ kế hoạch cốt truyện <span style="font-size: 0.9rem; color: #888;">(Tổng cộng ${plotArchiveManager.plots.length} bản ghi)</span></h2>
                    <div>
                        <button onclick="clearPlotArchive()" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Xóa sạch tất cả</button>
                        <button onclick="document.getElementById('plotArchiveModal').remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Đóng</button>
                    </div>
                </div>
                <div class="modal-body" style="display: flex; height: calc(85vh - 80px);">
                    <div class="plot-list" style="width: 280px; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; padding: 15px;">
                        ${plotNames.length === 0 ? '<p style="color: #888; text-align: center; padding: 20px;">Tạm thời chưa có lưu trữ kế hoạch cốt truyện</p>' : ''}
                        ${plotNames.map((name, idx) => {
        const plots = plotsByName[name];
        const latestPlot = plots[plots.length - 1];
        const time = new Date(latestPlot.timestamp).toLocaleString('zh-CN');
        return `
                                <div class="plot-item" onclick="showPlotDetail('${name.replace(/'/g, "\\'")}')" 
                                    style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                                    onmouseover="this.style.background='rgba(100,100,255,0.2)'" 
                                    onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                    <div style="color: #fff; font-size: 0.95rem; margin-bottom: 4px; word-break: break-word;">${name}</div>
                                    <div style="color: #888; font-size: 0.8rem;">${time}</div>
                                    <div style="color: #666; font-size: 0.75rem;">${plots.length} bản ghi</div>
                                </div>
                            `;
    }).join('')}
                    </div>
                    <div class="plot-detail" id="plotDetailPane" style="flex: 1; padding: 20px; overflow-y: auto; color: #ddd;">
                        <p style="color: #888; text-align: center; padding: 40px;">← Nhấn vào tên cốt truyện bên trái để xem chi tiết</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('[📚Lưu trữ cốt truyện] Cửa sổ popup đã được mở');
}

/**
 * Hiển thị chi tiết cốt truyện được chỉ định
 * @param {string} storyName - Tên cốt truyện
 */
function showPlotDetail(storyName) {
    const detailPane = document.getElementById('plotDetailPane');
    if (!detailPane) return;

    const plotsByName = plotArchiveManager.getPlotsByName();
    const plots = plotsByName[storyName] || [];

    if (plots.length === 0) {
        detailPane.innerHTML = '<p style="color: #888;">Không tìm thấy cốt truyện này</p>';
        return;
    }

    let html = `
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem;">📖 ${storyName}</h3>
            <p style="color: #888; margin: 0; font-size: 0.9rem;">Tổng cộng ${plots.length} bản ghi kế hoạch</p>
        </div>
    `;

    // Hiển thị từ mới nhất đến cũ nhất
    const reversedPlots = [...plots].reverse();
    reversedPlots.forEach((plot, idx) => {
        const time = new Date(plot.timestamp).toLocaleString('zh-CN');
        html += `
            <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 15px; margin-bottom: 15px; border-left: 3px solid #6c5ce7;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="color: #888; font-size: 0.85rem;">🕐 ${time}</span>
                    <button onclick="deletePlotById('${plot.id}')" style="background: #c0392b; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Xóa</button>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #74b9ff;">① </span>
                    <span style="color: #ddd;">${plot.step1 || '(Không có)'}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #55efc4;">② </span>
                    <span style="color: #ddd;">${plot.step2 || '(Không có)'}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #fd79a8;">③ </span>
                    <span style="color: #ddd;">${plot.step3 || '(Không có)'}</span>
                </div>
                ${plot.reasoning ? `<div style="color: #888; font-size: 0.85rem; font-style: italic; margin-top: 10px;">💭 ${plot.reasoning}</div>` : ''}
            </div>
        `;
    });

    detailPane.innerHTML = html;
}

/**
 * Xóa cốt truyện với ID được chỉ định
 * @param {string} plotId - ID cốt truyện
 */
function deletePlotById(plotId) {
    if (confirm('Chắc chắn muốn xóa bản ghi kế hoạch cốt truyện này không?')) {
        plotArchiveManager.deletePlot(plotId);
        // Làm mới cửa sổ popup
        showPlotArchiveModal();
    }
}

/**
 * Xóa sạch tất cả lưu trữ cốt truyện
 */
function clearPlotArchive() {
    if (confirm('Chắc chắn muốn xóa sạch tất cả lưu trữ kế hoạch cốt truyện không? Thao tác này không thể hoàn tác!')) {
        plotArchiveManager.clearAll();
        // Làm mới cửa sổ popup
        showPlotArchiveModal();
    }
}

// Xuất các hàm ra toàn cục
window.showPlotArchiveModal = showPlotArchiveModal;
window.showPlotDetail = showPlotDetail;
window.deletePlotById = deletePlotById;
window.clearPlotArchive = clearPlotArchive;

// Khởi tạo khi tải trang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserProfileSystem);
} else {
    initUserProfileSystem();
}

console.log('[🎭Hồ sơ người dùng] Đã tải module');
console.log('[📚Lưu trữ cốt truyện] Đã tải module, số lượng lưu trữ hiện tại:', plotArchiveManager.plots.length);
