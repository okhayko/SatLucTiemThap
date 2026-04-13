/**
 * Khung trò chơi chung - Game Framework
 * Cung cấp các chức năng chung như quản lý trạng thái trò chơi, hệ thống render, gọi API, v.v.
 * Có thể được sử dụng bởi các tệp cấu hình trò chơi khác nhau
 */

class GameFramework {
    constructor(config) {
        this.config = config; // Cấu hình đặc định của trò chơi
        this.gameState = {
            variables: {},
            conversationHistory: [],
            isGameStarted: false,
            lastVariables: {}
        };
        this.apiConfig = {
            endpoint: '',
            apiKey: '',
            model: '',
            type: 'openai'
        };
        this.extraApiConfig = null;
        this.isProcessing = false;
    }

    /**
     * Khởi tạo khung trò chơi
     */
    init() {
        console.log('[GameFramework] Khởi tạo khung trò chơi:', this.config.gameName);

        // Tải cấu hình
        this.loadConfig();

        // Khởi tạo UI
        this.initUI();

        // Ràng buộc sự kiện
        this.bindEvents();

        // Nếu cấu hình cung cấp callback khởi tạo, hãy thực thi nó
        if (this.config.onInit) {
            this.config.onInit(this);
        }
    }

    /**
     * Tải cấu hình đã lưu
     */
    loadConfig() {
        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.apiConfig = config.apiConfig || this.apiConfig;
            this.extraApiConfig = config.extraApiConfig || null;
        }
    }

    /**
     * Lưu cấu hình
     */
    saveConfig() {
        const config = {
            apiConfig: this.apiConfig,
            extraApiConfig: this.extraApiConfig
        };
        localStorage.setItem('gameConfig', JSON.stringify(config));
    }

    /**
     * Khởi tạo UI
     */
    initUI() {
        // Thiết lập tiêu đề
        if (this.config.gameName) {
            document.title = this.config.gameName;
        }

        // Khởi tạo gợi ý hệ thống (system prompt)
        if (this.config.systemPrompt) {
            const systemPromptEl = document.getElementById('systemPrompt');
            if (systemPromptEl) {
                systemPromptEl.value = this.config.systemPrompt;
            }
        }

        // Khởi tạo gợi ý thế giới động (dynamic world prompt)
        if (this.config.dynamicWorldPrompt) {
            const dynamicWorldPromptEl = document.getElementById('dynamicWorldPrompt');
            if (dynamicWorldPromptEl) {
                dynamicWorldPromptEl.value = this.config.dynamicWorldPrompt;
            }
        }
    }

    /**
     * Ràng buộc sự kiện
     */
    bindEvents() {
        // Tại đây có thể ràng buộc các sự kiện chung
        // Các sự kiện cụ thể của trò chơi do tệp cấu hình xử lý
    }

    /**
     * Cập nhật bảng trạng thái - Phương pháp chung
     * Gọi hàm render đặc định của trò chơi
     */
    updateStatusPanel() {
        if (this.config.renderStatus) {
            this.config.renderStatus(this.gameState.variables);
        }
    }

    /**
     * Lấy cấu hình tạo nhân vật
     */
    getCharacterCreationConfig() {
        return this.config.characterCreation || null;
    }

    /**
     * Lấy cấu hình các trường trạng thái
     */
    getStatusFieldsConfig() {
        return this.config.statusFields || [];
    }

    /**
     * Thiết lập trạng thái trò chơi
     */
    setGameState(state) {
        this.gameState = { ...this.gameState, ...state };
    }

    /**
     * Lấy trạng thái trò chơi
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * Cập nhật biến
     */
    updateVariables(newVars) {
        this.gameState.lastVariables = { ...this.gameState.variables };
        this.gameState.variables = { ...this.gameState.variables, ...newVars };
        this.updateStatusPanel();
    }
}

// Xuất lớp khung trò chơi (Framework class)
window.GameFramework = GameFramework;