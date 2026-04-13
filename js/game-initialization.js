/**
 * Mô-đun khởi tạo trò chơi và logic cốt lõi
 * Bao gồm các chức năng như khởi động trò chơi, tải cấu hình, kết nối API, phân tích phản hồi, v.v.
 */

// ========== Logic chính của trò chơi ==========

// Khởi tạo
document.addEventListener('DOMContentLoaded', async function () {
    // 🎮 Khởi tạo cấu hình trò chơi (phải thực hiện đầu tiên)
    console.log('[Khởi tạo trò chơi] Kiểm tra đối tượng cấu hình:', {
        hasConfig: !!window.XiuxianGameConfig,
        hasOnInit: !!(window.XiuxianGameConfig && window.XiuxianGameConfig.onInit)
    });

    // 🔧 Bắt buộc tải cấu hình để đảm bảo extraApiConfig khả dụng
    if (typeof loadConfig === 'function') {
        console.log('[Khởi tạo trò chơi] Đang bắt buộc tải cấu hình...');
        loadConfig();

        // Xác nhận kết quả tải cấu hình
        setTimeout(() => {
            console.log('[Khởi tạo trò chơi] Kiểm tra sau khi tải cấu hình:', {
                extraApiConfig: window.extraApiConfig,
                enabled: window.extraApiConfig?.enabled,
                hasKey: !!window.extraApiConfig?.key
            });
        }, 100);
    }

    if (window.XiuxianGameConfig && window.XiuxianGameConfig.onInit) {
        console.log('[Khởi tạo trò chơi] Chuẩn bị gọi onInit()');
        window.XiuxianGameConfig.onInit();
        console.log('[Khởi tạo trò chơi] ✅ Tệp cấu hình đã được khởi tạo');
    } else {
        console.error('[Khởi tạo trò chơi] ❌ Đối tượng cấu hình hoặc phương thức onInit không tồn tại!');
    }

    // Khởi tạo IndexedDB
    try {
        await initDB();
        // Thử tải dữ liệu lịch sử
        const savedHistory = await loadGameHistory();
        if (savedHistory && savedHistory.isGameStarted && savedHistory.variables && savedHistory.variables.name) {
            // Khôi phục trạng thái trò chơi (chỉ khôi phục khi có tên nhân vật)
            console.log('[Khôi phục lưu trữ] variables khôi phục từ IndexedDB:', savedHistory.variables);
            console.log('[Khôi phục lưu trữ] Dữ liệu quan hệ Liễu Như Yên:', savedHistory.variables.relationships?.find(r => r.name === 'Liễu Như Yên'));

            gameState.variables = savedHistory.variables;
            gameState.conversationHistory = savedHistory.conversationHistory;
            gameState.variableSnapshots = savedHistory.variableSnapshots || [];
            gameState.isGameStarted = savedHistory.isGameStarted;

            // 🆕 Tương thích ngược: Đảm bảo mảng công pháp pháp thuật tồn tại (lưu trữ cũ có thể không có)
            if (!gameState.variables.techniques) {
                gameState.variables.techniques = [];
                console.log('[Tính tương thích] Đã khởi tạo mảng techniques');
            }
            if (!gameState.variables.spells) {
                gameState.variables.spells = [];
                console.log('[Tính tương thích] Đã khởi tạo mảng spells');
            }

            // 🌍 Khôi phục dữ liệu thế giới động
            if (savedHistory.dynamicWorld) {
                gameState.dynamicWorld = savedHistory.dynamicWorld;
                // 🆕 Bắt buộc đặt lại trạng thái xử lý (tránh bị kẹt trong quá trình xử lý)
                gameState.dynamicWorld.isProcessing = false;
                // 🆕 Tương thích lưu trữ cũ, thêm các trường mới
                if (!gameState.dynamicWorld.messageInterval) {
                    gameState.dynamicWorld.messageInterval = 1;
                }
                if (!gameState.dynamicWorld.messageCounter) {
                    gameState.dynamicWorld.messageCounter = 0;
                }
                console.log(`[Thế giới động] ✅ Đã khôi phục ${savedHistory.dynamicWorld.history?.length || 0} bản ghi từ lưu trữ tự động`);
                console.log('[Thế giới động] Dữ liệu đã khôi phục:', {
                    enabled: gameState.dynamicWorld.enabled,
                    floor: gameState.dynamicWorld.floor,
                    historyLength: gameState.dynamicWorld.history?.length
                });
            } else {
                // Lưu trữ phiên bản cũ, khởi tạo thế giới động
                gameState.dynamicWorld = {
                    enabled: false,
                    history: [],
                    floor: 0,
                    isProcessing: false,
                    messageInterval: 1,
                    messageCounter: 0
                };
                console.warn('[Thế giới động] Lưu trữ tự động phiên bản cũ, dữ liệu thế giới động đã được khởi tạo');
            }

            // Cập nhật giao diện (UI)
            updateStatusPanel();

            // Khôi phục hiển thị lịch sử đối thoại
            restoreConversationHistory();

            // Ẩn nút bắt đầu
            document.getElementById('startGame').classList.add('hidden');

            console.log('Đã khôi phục lịch sử trò chơi');
        } else {
            // Không có dữ liệu trò chơi hoàn chỉnh, hiển thị menu chính
            console.log('Không tìm thấy dữ liệu trò chơi, hiển thị menu chính');
            showMainMenu();
        }
    } catch (error) {
        console.error('Tải dữ liệu lịch sử thất bại:', error);
        showMainMenu();
    }

    // loadConfig() hiện tại tự động thực thi sau khi hoàn tất tải cửa sổ cấu hình
    updateConnectionStatus(false);
    updateExtraConnectionStatus(false);

    // 【Thêm mới】Tải thư viện vector
    if (window.contextVectorManager) {
        window.contextVectorManager.loadFromIndexedDB().catch(err => {
            console.error('Tải thư viện vector thất bại:', err);
        });

        // 🆕 Tự động tải kho kiến thức tĩnh (ưu tiên từ IndexedDB, nếu trống sẽ tải từ đường dẫn tệp trong cấu hình)
        window.contextVectorManager.loadStaticKBFromIndexedDB().then(async () => {
            const kbSize = window.contextVectorManager.staticKnowledgeBase.length;

            if (kbSize > 0) {
                // Có dữ liệu trong IndexedDB, sử dụng trực tiếp
                console.log(`[Khởi tạo] ✅ Đã tải ${kbSize} mục kiến thức tĩnh từ IndexedDB`);

                // 🆕 Đảm bảo từ khóa gợi ý hệ thống tồn tại ngay lập tức
                if (typeof ensureSystemPromptInKB === 'function') {
                    await ensureSystemPromptInKB();
                } else {
                    console.warn('[Khởi tạo] ⚠️ Không tìm thấy hàm ensureSystemPromptInKB, bỏ qua kiểm tra từ khóa gợi ý hệ thống');
                }

                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 9999;
                    font-size: 14px;
                `;
                notification.innerHTML = `✅ Đã tải ${window.contextVectorManager.staticKnowledgeBase.length} mục kiến thức tĩnh (IndexedDB)`;
                document.body.appendChild(notification);

                setTimeout(() => notification.remove(), 3000);
            } else {
                // IndexedDB trống, thử tải từ tệp
                console.log(`[Khởi tạo] IndexedDB không có dữ liệu kho kiến thức, đang thử tải từ tệp...`);

                // Tạo từ khóa gợi ý hệ thống trước
                if (typeof ensureSystemPromptInKB === 'function') {
                    await ensureSystemPromptInKB();
                } else {
                    console.warn('[Khởi tạo] ⚠️ Không tìm thấy hàm ensureSystemPromptInKB, bỏ qua tạo từ khóa gợi ý hệ thống');
                }

                // Sau đó thử tải các kiến thức khác từ tệp
                if (typeof window.contextVectorManager.autoLoadStaticKB === 'function') {
                    const result = await window.contextVectorManager.autoLoadStaticKB();
                    if (result && result.totalLoaded > 0) {
                        console.log(`[Khởi tạo] ✅ Đã tải ${result.totalLoaded} mục kiến thức tĩnh từ tệp`);

                        const notification = document.createElement('div');
                        notification.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #28a745;
                            color: white;
                            padding: 15px 20px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            z-index: 9999;
                            font-size: 14px;
                        `;
                        notification.innerHTML = `✅ Đã tải ${result.totalLoaded} mục kiến thức tĩnh (Tệp)`;
                        document.body.appendChild(notification);

                        setTimeout(() => notification.remove(), 3000);
                    } else {
                        console.log('[Khởi tạo] Không có cấu hình đường dẫn tệp kho kiến thức, chỉ tạo từ khóa gợi ý hệ thống');
                    }
                } else {
                    console.warn('[Khởi tạo] Hàm autoLoadStaticKB không tồn tại (có thể là supply.js phiên bản cũ)');
                }
            }

        }).catch(err => {
            console.error('Tải kho kiến thức tĩnh thất bại:', err);
            // Ngay cả khi tải thất bại, vẫn thử tạo từ khóa gợi ý hệ thống
            if (typeof ensureSystemPromptInKB === 'function') {
                ensureSystemPromptInKB().catch(e => console.error('Tạo từ khóa gợi ý hệ thống thất bại:', e));
            } else {
                console.warn('[Khởi tạo] ⚠️ Không tìm thấy hàm ensureSystemPromptInKB, không thể tạo từ khóa gợi ý hệ thống');
            }
        });
    }

    // Thêm chức năng nhấn phím Enter để gửi trong ô nhập liệu
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserInput();
            }
        });
    }

    // Cập nhật điểm cuối mặc định khi thay đổi loại API
    document.getElementById('apiType').addEventListener('change', function (e) {
        const type = e.target.value;
        const endpointInput = document.getElementById('apiEndpoint');

        // Đặt lại lựa chọn mô hình
        document.getElementById('modelSelectGroup').style.display = 'none';
        document.getElementById('saveConnectionBtn').style.display = 'none';

        if (type === 'openai') {
            endpointInput.value = 'https://api.openai.com/v1';
            endpointInput.placeholder = 'https://api.openai.com/v1';
        } else if (type === 'gemini') {
            endpointInput.value = 'https://generativelanguage.googleapis.com/v1beta';
            endpointInput.placeholder = 'https://generativelanguage.googleapis.com/v1beta';
        } else if (type === 'moonshot') {
            endpointInput.value = 'https://api.moonshot.cn/v1';
            endpointInput.placeholder = 'https://api.moonshot.cn/v1';
        } else if (type === 'custom') {
            endpointInput.value = '';
            endpointInput.placeholder = 'https://your-api.com/v1';
        }
    });

    // Cập nhật điểm cuối mặc định khi thay đổi loại API bổ sung
    document.getElementById('extraApiType').addEventListener('change', function (e) {
        const type = e.target.value;
        const endpointInput = document.getElementById('extraApiEndpoint');
        const manualFields = document.getElementById('extraApiManualFields');
        const builtinInfo = document.getElementById('extraApiBuiltinInfo');

        // Đặt lại lựa chọn mô hình
        document.getElementById('extraModelSelectGroup').style.display = 'none';
        document.getElementById('saveExtraConnectionBtn').style.display = 'none';

        if (type === 'builtin') {
            // API tích hợp: Ẩn nhập thủ công, hiển thị thông tin tích hợp
            if (manualFields) manualFields.style.display = 'none';
            if (builtinInfo) builtinInfo.style.display = 'block';
        } else {
            // Loại khác: Hiển thị nhập thủ công, ẩn thông tin tích hợp
            if (manualFields) manualFields.style.display = 'block';
            if (builtinInfo) builtinInfo.style.display = 'none';

            if (type === 'openai') {
                endpointInput.value = 'https://api.openai.com/v1';
                endpointInput.placeholder = 'https://api.openai.com/v1';
            } else if (type === 'gemini') {
                endpointInput.value = 'https://generativelanguage.googleapis.com/v1beta';
                endpointInput.placeholder = 'https://generativelanguage.googleapis.com/v1beta';
            } else if (type === 'moonshot') {
                endpointInput.value = 'https://api.moonshot.cn/v1';
                endpointInput.placeholder = 'https://api.moonshot.cn/v1';
            } else if (type === 'custom') {
                endpointInput.value = '';
                endpointInput.placeholder = 'https://your-api.com/v1';
            }
        }
    });
});

// Vẽ lại biểu đồ radar khi kích thước cửa sổ thay đổi (thiết kế đáp ứng)
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        if (gameState.isGameStarted) {
            drawRadarChart();
        }
    }, 200); // Xử lý chống rung, tránh vẽ lại quá thường xuyên
});

// Tải cấu hình
function loadConfig() {
    const saved = localStorage.getItem('gameConfig');
    if (saved) {
        const config = JSON.parse(saved);

        // Kiểm tra phần tử cửa sổ cấu hình có tồn tại không
        const apiTypeElement = document.getElementById('apiType');
        if (apiTypeElement) {
            apiTypeElement.value = config.type || 'openai';
            document.getElementById('apiEndpoint').value = config.endpoint || '';
            document.getElementById('apiKey').value = config.key || '';

            apiConfig.type = config.type;
            apiConfig.endpoint = config.endpoint;
            apiConfig.key = config.key;
            apiConfig.model = config.model;
            apiConfig.availableModels = config.availableModels || [];
            apiConfig.stream = config.stream || false;

            if (document.getElementById('apiEnableStream')) {
                document.getElementById('apiEnableStream').checked = apiConfig.stream;
            }

            // Tải cài đặt độ sâu lịch sử và số từ tối thiểu
            if (config.historyDepth !== undefined) {
                document.getElementById('historyDepth').value = config.historyDepth;
            }
            if (config.minWordCount !== undefined) {
                document.getElementById('minWordCount').value = config.minWordCount;
            }
            if (config.maxTokens !== undefined) {
                document.getElementById('maxTokens').value = config.maxTokens;
            }

            // Tải cài đặt truy xuất vector
            if (config.enableVectorRetrieval !== undefined) {
                document.getElementById('enableVectorRetrieval').checked = config.enableVectorRetrieval;
                if (config.enableVectorRetrieval) {
                    document.getElementById('vectorRetrievalSettings').style.display = 'block';
                }
            }
            if (config.vectorMethod !== undefined) {
                document.getElementById('vectorMethod').value = config.vectorMethod;
                if (window.contextVectorManager) {
                    window.contextVectorManager.setEmbeddingMethod(config.vectorMethod);
                }
            }
            if (config.maxRetrieveCount !== undefined) {
                document.getElementById('maxRetrieveCount').value = config.maxRetrieveCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.maxRetrieveCount = config.maxRetrieveCount;
                }
            }
            if (config.similarityThreshold !== undefined) {
                document.getElementById('similarityThreshold').value = config.similarityThreshold;
                if (window.contextVectorManager) {
                    window.contextVectorManager.minSimilarityThreshold = config.similarityThreshold;
                }
            }
            if (config.minTurnGap !== undefined) {
                document.getElementById('minTurnGap').value = config.minTurnGap;
                if (window.contextVectorManager) {
                    window.contextVectorManager.minTurnGap = config.minTurnGap;
                }
            }
            if (config.includeRecentAIReplies !== undefined) {
                document.getElementById('includeRecentAIReplies').value = config.includeRecentAIReplies;
                if (window.contextVectorManager) {
                    window.contextVectorManager.includeRecentAIRepliesInQuery = config.includeRecentAIReplies;
                }
            }
            // 🆕 Tải cài đặt ma trận History
            if (config.recentHistoryCount !== undefined && document.getElementById('recentHistoryCount')) {
                document.getElementById('recentHistoryCount').value = config.recentHistoryCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.recentHistoryCount = config.recentHistoryCount;
                }
            }
            if (config.matrixHistoryCount !== undefined && document.getElementById('matrixHistoryCount')) {
                document.getElementById('matrixHistoryCount').value = config.matrixHistoryCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.matrixHistoryCount = config.matrixHistoryCount;
                }
            }
        }

        // Tải cài đặt góc nhìn kể chuyện
        if (config.narrativePerspective !== undefined && document.getElementById('narrativePerspective')) {
            document.getElementById('narrativePerspective').value = config.narrativePerspective;
        }

        // 🔧 Từ khóa gợi ý hệ thống: Không khôi phục từ localStorage, được thiết lập bởi onInit của mỗi cấu hình trò chơi
        // Bằng cách này, trò chơi xiuxian và trò chơi bhz có thể tự thiết lập gợi ý riêng của mình
        if (config.systemPrompt !== undefined && document.getElementById('systemPrompt')) {
            console.log('[System Prompt] Bỏ qua khôi phục, chờ game config onInit thiết lập gợi ý mặc định');
        }

        // Tải cấu hình API bổ sung
        if (config.extraApi && document.getElementById('enableExtraApi')) {
            extraApiConfig.enabled = config.extraApi.enabled || false;
            extraApiConfig.type = config.extraApi.type || 'openai';
            extraApiConfig.endpoint = config.extraApi.endpoint || '';
            extraApiConfig.key = config.extraApi.key || '';
            extraApiConfig.model = config.extraApi.model || 'gpt-4o-mini';
            extraApiConfig.availableModels = config.extraApi.availableModels || [];
            extraApiConfig.stream = config.extraApi.stream || false;

            document.getElementById('enableExtraApi').checked = extraApiConfig.enabled;
            document.getElementById('extraApiType').value = extraApiConfig.type;
            document.getElementById('extraApiEndpoint').value = extraApiConfig.endpoint;
            document.getElementById('extraApiKey').value = extraApiConfig.key;
            if (document.getElementById('extraApiEnableStream')) {
                document.getElementById('extraApiEnableStream').checked = extraApiConfig.stream;
            }

            if (extraApiConfig.enabled && document.getElementById('extraApiFields')) {
                document.getElementById('extraApiFields').style.display = 'block';

                if (extraApiConfig.model && extraApiConfig.endpoint && extraApiConfig.key) {
                    updateExtraConnectionStatus(true);
                    if (document.getElementById('extraModelSelectGroup')) {
                        document.getElementById('extraModelSelectGroup').style.display = 'flex';
                    }
                    if (document.getElementById('saveExtraConnectionBtn')) {
                        document.getElementById('saveExtraConnectionBtn').style.display = 'block';
                    }

                    // Hiển thị mô hình đã lưu (chọn trong danh sách mô hình)
                    const extraModelSelect = document.getElementById('extraModelSelect');
                    if (extraModelSelect) {
                        const option = document.createElement('option');
                        option.value = extraApiConfig.model;
                        option.textContent = extraApiConfig.model;
                        option.selected = true;
                        extraModelSelect.innerHTML = '';
                        extraModelSelect.appendChild(option);
                    }

                    const fetchExtraModelsBtn = document.getElementById('fetchExtraModelsBtn');
                    if (fetchExtraModelsBtn) {
                        fetchExtraModelsBtn.innerHTML = '<span class="status-indicator status-connected"></span> Đã kết nối - ' + extraApiConfig.model.substring(0, 20);
                    }
                }
            }
        }

        // Tải cấu hình thế giới động
        if (config.dynamicWorld) {
            const dwConfig = config.dynamicWorld;

            // 🆕 Chỉ cập nhật trạng thái enabled, không ghi đè toàn bộ đối tượng dynamicWorld (tránh mất dữ liệu history)
            if (gameState.dynamicWorld) {
                gameState.dynamicWorld.enabled = dwConfig.enabled || false;
                gameState.dynamicWorld.messageInterval = dwConfig.messageInterval || 1;
                console.log('[Thế giới động] loadConfig - Cập nhật trạng thái enabled:', dwConfig.enabled);
                console.log('[Thế giới động] loadConfig - Giữ lại số lượng lịch sử ghi lại:', gameState.dynamicWorld.history?.length || 0);
            } else {
                // Nếu dynamicWorld chưa được khởi tạo (trò chơi mới), mới khởi tạo đầy đủ
                gameState.dynamicWorld = {
                    enabled: dwConfig.enabled || false,
                    history: [],
                    floor: 0,
                    isProcessing: false,
                    messageInterval: dwConfig.messageInterval || 1,
                    messageCounter: 0
                };
                console.log('[Thế giới động] loadConfig - Khởi tạo thế giới động lần đầu');
            }

            // Kiểm tra phần tử cấu hình thế giới động có tồn tại không
            if (document.getElementById('enableDynamicWorld')) {
                document.getElementById('enableDynamicWorld').checked = dwConfig.enabled || false;
                document.getElementById('dynamicWorldHistoryDepth').value = dwConfig.historyDepth || 5;
                document.getElementById('dynamicWorldMinWords').value = dwConfig.minWords || 300;
                document.getElementById('dynamicWorldInterval').value = dwConfig.messageInterval || 1;
                document.getElementById('dynamicWorldShowReasoning').checked = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;
                document.getElementById('dynamicWorldEnableKnowledge').checked = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;

                // 🔧 Từ khóa gợi ý thế giới động: Không khôi phục từ localStorage, được thiết lập bởi onInit của mỗi cấu hình trò chơi
                if (dwConfig.prompt && document.getElementById('dynamicWorldPrompt')) {
                    console.log('[Gợi ý thế giới động] Bỏ qua khôi phục, chờ game config onInit thiết lập gợi ý mặc định');
                }

                if (dwConfig.enabled && document.getElementById('dynamicWorldFields')) {
                    document.getElementById('dynamicWorldFields').style.display = 'block';
                }
            }
        }

        // Nếu đã có cấu hình, hiển thị trạng thái đã kết nối
        if (config.model && config.endpoint && config.key && document.getElementById('modelSelectGroup')) {
            updateConnectionStatus(true);
            document.getElementById('modelSelectGroup').style.display = 'flex';
            if (document.getElementById('saveConnectionBtn')) {
                document.getElementById('saveConnectionBtn').style.display = 'block';
            }

            // Hiển thị mô hình đã lưu (chọn trong danh sách mô hình)
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                const option = document.createElement('option');
                option.value = config.model;
                option.textContent = config.model;
                option.selected = true;
                modelSelect.innerHTML = '';
                modelSelect.appendChild(option);

                const fetchModelsBtn = document.getElementById('fetchModelsBtn');
                if (fetchModelsBtn) {
                    fetchModelsBtn.innerHTML = '<span class="status-indicator status-connected"></span> Đã kết nối - ' + config.model.substring(0, 20);
                }
            }
        }
    }

    // 🎭 Tải cài đặt chân dung người dùng
    if (window.userProfileAnalyzer && typeof window.userProfileAnalyzer.loadSettingsToUI === 'function') {
        window.userProfileAnalyzer.loadSettingsToUI();
        console.log('[Chân dung người dùng] ✅ Đã tải cài đặt chân dung người dùng lên UI');
    }
}

// Lấy điểm cuối đầy đủ
function getFullEndpoint(baseEndpoint, apiType) {
    let endpoint = baseEndpoint.trim();

    // Loại bỏ dấu gạch chéo ở cuối
    endpoint = endpoint.replace(/\/+$/, '');

    if (apiType === 'openai' || apiType === 'custom' || apiType === 'moonshot') {
        // Nếu điểm cuối không chứa /chat/completions, tự động thêm vào
        if (!endpoint.includes('/chat/completions')) {
            endpoint = endpoint + '/chat/completions';
        }
    }

    return endpoint;
}

// Lấy điểm cuối danh sách mô hình
function getModelsEndpoint(baseEndpoint, apiType) {
    let endpoint = baseEndpoint.trim();
    endpoint = endpoint.replace(/\/+$/, '');

    if (apiType === 'gemini') {
        return endpoint + '/models?key=';
    } else {
        // OpenAI và bên thứ ba sử dụng /models
        if (endpoint.endsWith('/chat/completions')) {
            endpoint = endpoint.replace('/chat/completions', '');
        }
        return endpoint + '/models';
    }
}

// Lấy danh sách mô hình
async function fetchModels() {
    const apiType = document.getElementById('apiType').value;
    const baseEndpoint = document.getElementById('apiEndpoint').value;
    const apiKey = document.getElementById('apiKey').value;

    if (!baseEndpoint || !apiKey) {
        alert('Vui lòng điền điểm cuối API và mã khóa trước');
        return;
    }

    const btn = document.getElementById('fetchModelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Đang kết nối...';

    try {
        let models = [];

        const fetchPromise = apiType === 'gemini'
            ? fetchGeminiModels(baseEndpoint, apiKey)
            : fetchOpenAIModels(baseEndpoint, apiKey);

        models = await fetchPromise;

        if (models.length > 0) {
            apiConfig.availableModels = models;
            displayModels(models);
            updateConnectionStatus(true);

            // Hiển thị lựa chọn mô hình và nút lưu
            document.getElementById('modelSelectGroup').style.display = 'flex';
            document.getElementById('saveConnectionBtn').style.display = 'block';

            btn.innerHTML = '<span class="status-indicator status-connected"></span> Kết nối thành công';
        } else {
            throw new Error('Không lấy được danh sách mô hình');
        }
    } catch (error) {
        updateConnectionStatus(false);

        // Hiển thị thông tin lỗi chi tiết
        let errorMsg = 'Lấy danh sách mô hình thất bại';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMsg = '⚠️ Yêu cầu mạng bị chặn\n\nNguyên nhân khả thi:\n1. Hạn chế chính sách bảo mật trình duyệt di động\n2. Vấn đề tên miền chéo CORS\n3. Chặn nội dung hỗn hợp HTTP/HTTPS\n4. Vấn đề kết nối mạng\n5. Địa chỉ điểm cuối API không chính xác';
        } else {
            errorMsg = error.message || errorMsg;
        }

        console.error('Chi tiết lỗi lấy mô hình:', error);
        alert(errorMsg + '\n\nVui lòng kiểm tra:\n1. Điểm cuối API và mã khóa có chính xác không\n2. Kết nối mạng có bình thường không\n3. Dịch vụ API có hỗ trợ truy vấn danh sách mô hình không');

        btn.innerHTML = '<span class="status-indicator status-disconnected"></span> Kết nối thất bại, vui lòng thử lại';
    }

    btn.disabled = false;
}

// Lấy danh sách mô hình định dạng OpenAI
async function fetchOpenAIModels(baseEndpoint, apiKey) {
    const modelsEndpoint = getModelsEndpoint(baseEndpoint, document.getElementById('apiType').value);

    console.log('Đang yêu cầu danh sách mô hình OpenAI:', modelsEndpoint);

    const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    console.log('Trạng thái phản hồi OpenAI:', response.status);

    if (!response.ok) {
        const error = await response.text();
        console.error('Phản hồi lỗi OpenAI:', error);
        throw new Error(`Lấy mô hình thất bại: ${response.status} - ${error.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('Dữ liệu OpenAI trả về:', data);

    // Định dạng trả về của OpenAI: { data: [{id: "model-name"}, ...] }
    if (data.data && Array.isArray(data.data)) {
        return data.data.map(model => model.id).sort();
    }

    return [];
}

// Lấy danh sách mô hình Gemini
async function fetchGeminiModels(baseEndpoint, apiKey) {
    const modelsEndpoint = getModelsEndpoint(baseEndpoint, 'gemini') + apiKey;

    console.log('Đang yêu cầu danh sách mô hình Gemini:', modelsEndpoint);

    const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log('Trạng thái phản hồi Gemini:', response.status);

    if (!response.ok) {
        const error = await response.text();
        console.error('Phản hồi lỗi Gemini:', error);
        throw new Error(`Lấy mô hình Gemini thất bại: ${response.status} - ${error.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('Dữ liệu Gemini trả về:', data);

    // Định dạng trả về của Gemini: { models: [{name: "models/gemini-pro"}, ...] }
    if (data.models && Array.isArray(data.models)) {
        return data.models.map(model => {
            // Trích xuất tên mô hình, loại bỏ tiền tố "models/"
            return model.name.replace('models/', '');
        }).sort();
    }

    return [];
}

// Hiển thị danh sách mô hình
function displayModels(models) {
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });

    // Mặc định chọn cái đầu tiên
    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

// ==================== Hệ thống cấu hình API ====================
// saveConnection, updateConnectionStatus, updateExtraConnectionStatus,
// toggleExtraApiFields, saveExtraApiEnabled đã được chuyển sang game-core-systems.js

// Lấy danh sách mô hình API bổ sung
async function fetchExtraModels() {
    const apiType = document.getElementById('extraApiType').value;
    const baseEndpoint = document.getElementById('extraApiEndpoint').value;
    const apiKey = document.getElementById('extraApiKey').value;

    if (!baseEndpoint || !apiKey) {
        alert('Vui lòng điền điểm cuối API bổ sung và mã khóa trước');
        return;
    }

    const btn = document.getElementById('fetchExtraModelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Đang kết nối...';

    try {
        let models = [];

        const fetchPromise = apiType === 'gemini'
            ? fetchGeminiModels(baseEndpoint, apiKey)
            : fetchOpenAIModels(baseEndpoint, apiKey);

        models = await fetchPromise;

        if (models.length > 0) {
            extraApiConfig.availableModels = models;
            displayExtraModels(models);
            updateExtraConnectionStatus(true);

            document.getElementById('extraModelSelectGroup').style.display = 'flex';
            document.getElementById('saveExtraConnectionBtn').style.display = 'block';

            btn.innerHTML = '<span class="status-indicator status-connected"></span> Kết nối thành công';
        } else {
            throw new Error('Không lấy được danh sách mô hình');
        }
    } catch (error) {
        updateExtraConnectionStatus(false);

        let errorMsg = 'Lấy danh sách mô hình thất bại';

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMsg = '⚠️ Yêu cầu mạng bị chặn\n\nNguyên nhân khả thi:\n1. Hạn chế chính sách bảo mật trình duyệt di động\n2. Vấn đề tên miền chéo CORS\n3. Chặn nội dung hỗn hợp HTTP/HTTPS\n4. Vấn đề kết nối mạng\n5. Địa chỉ điểm cuối API không chính xác';
        } else {
            errorMsg = error.message || errorMsg;
        }

        console.error('Chi tiết lỗi lấy mô hình API bổ sung:', error);
        alert(errorMsg + '\n\nVui lòng kiểm tra:\n1. Điểm cuối API và mã khóa có chính xác không\n2. Kết nối mạng có bình thường không\n3. Dịch vụ API có hỗ trợ truy vấn danh sách mô hình không');

        btn.innerHTML = '<span class="status-indicator status-disconnected"></span> Kết nối thất bại, vui lòng thử lại';
    }

    btn.disabled = false;
}

// Hiển thị danh sách mô hình API bổ sung
function displayExtraModels(models) {
    const modelSelect = document.getElementById('extraModelSelect');
    modelSelect.innerHTML = '';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });

    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

// Lưu cấu hình kết nối API bổ sung
function saveExtraConnection() {
    const modelSelect = document.getElementById('extraModelSelect');
    const selectedModel = modelSelect.value;

    if (!selectedModel) {
        alert('Vui lòng chọn một mô hình từ danh sách');
        return;
    }

    extraApiConfig.type = document.getElementById('extraApiType').value;
    extraApiConfig.endpoint = document.getElementById('extraApiEndpoint').value;
    extraApiConfig.key = document.getElementById('extraApiKey').value;
    extraApiConfig.model = selectedModel;
    extraApiConfig.stream = document.getElementById('extraApiEnableStream')?.checked || false;

    // Lấy cấu hình hiện có
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};

    // Cập nhật cấu hình API bổ sung
    config.extraApi = {
        enabled: extraApiConfig.enabled,
        type: extraApiConfig.type,
        endpoint: extraApiConfig.endpoint,
        key: extraApiConfig.key,
        model: extraApiConfig.model,
        availableModels: extraApiConfig.availableModels,
        stream: extraApiConfig.stream
    };

    localStorage.setItem('gameConfig', JSON.stringify(config));

    alert('Cấu hình API bổ sung đã được lưu!\nMô hình: ' + selectedModel);
    updateExtraConnectionStatus(true);

    document.getElementById('fetchExtraModelsBtn').innerHTML = '<span class="status-indicator status-connected"></span> Đã kết nối - ' + selectedModel.substring(0, 20);
}

// ==================== Cấu hình API tích hợp ====================
// Cấu hình API tích hợp (endpoint và key được ẩn trong mã nguồn, không hiển thị ở giao diện người dùng)
const BUILTIN_EXTRA_API_CONFIG = {
    endpoint: 'https://api.cdxxpt.me/v1',
    key: 'sk-4hRELT0375qclFCTq5mwRmLy3UpFBf8wPsuvOI2932ZAW8YO',
    model: 'gemini-3-flash',
    type: 'custom'
};

// Callback khi chuyển đổi loại API bổ sung (dùng cho onchange trong HTML)
function onExtraApiTypeChange() {
    const type = document.getElementById('extraApiType').value;
    const manualFields = document.getElementById('extraApiManualFields');
    const builtinInfo = document.getElementById('extraApiBuiltinInfo');

    // Đặt lại lựa chọn mô hình và nút lưu
    document.getElementById('extraModelSelectGroup').style.display = 'none';
    document.getElementById('saveExtraConnectionBtn').style.display = 'none';

    if (type === 'builtin') {
        // API tích hợp: Ẩn nhập liệu thủ công, hiển thị thông tin tích hợp
        if (manualFields) manualFields.style.display = 'none';
        if (builtinInfo) builtinInfo.style.display = 'block';
    } else {
        // Các loại khác: Hiển thị nhập liệu thủ công, ẩn thông tin tích hợp
        if (manualFields) manualFields.style.display = 'block';
        if (builtinInfo) builtinInfo.style.display = 'none';
    }
}

// Kích hoạt API bổ sung tích hợp
function activateBuiltinExtraApi() {
    console.log('[API tích hợp] Đang kích hoạt API bổ sung tích hợp...');

    // Thiết lập cấu hình API bổ sung
    extraApiConfig.enabled = true;
    extraApiConfig.type = BUILTIN_EXTRA_API_CONFIG.type;
    extraApiConfig.endpoint = BUILTIN_EXTRA_API_CONFIG.endpoint;
    extraApiConfig.key = BUILTIN_EXTRA_API_CONFIG.key;
    extraApiConfig.model = BUILTIN_EXTRA_API_CONFIG.model;
    extraApiConfig.availableModels = [BUILTIN_EXTRA_API_CONFIG.model];

    // Đồng bộ vào đối tượng window để đảm bảo các mô-đun khác có thể truy cập
    window.extraApiConfig = extraApiConfig;

    // Lưu vào localStorage
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};

    config.extraApi = {
        enabled: true,
        type: BUILTIN_EXTRA_API_CONFIG.type,
        endpoint: BUILTIN_EXTRA_API_CONFIG.endpoint,
        key: BUILTIN_EXTRA_API_CONFIG.key,
        model: BUILTIN_EXTRA_API_CONFIG.model,
        availableModels: [BUILTIN_EXTRA_API_CONFIG.model],
        stream: extraApiConfig.stream || document.getElementById('extraApiEnableStream')?.checked || false,
        isBuiltin: true  // Đánh dấu là API tích hợp
    };

    localStorage.setItem('gameConfig', JSON.stringify(config));

    // Cập nhật trạng thái giao diện người dùng
    updateExtraConnectionStatus(true);

    // Hiển thị thông báo thành công
    const builtinInfo = document.getElementById('extraApiBuiltinInfo');
    if (builtinInfo) {
        builtinInfo.innerHTML = `
            <div style="color: white; font-weight: bold; margin-bottom: 8px;">✅ API tích hợp đã được bật thành công!</div>
            <div style="color: rgba(255,255,255,0.9); font-size: 12px;">Mô hình: ${BUILTIN_EXTRA_API_CONFIG.model}</div>
            <div style="color: #90EE90; font-size: 12px; margin-top: 8px;">🎉 Cấu hình đã lưu, có thể bắt đầu sử dụng</div>
        `;
    }

    console.log('[API tích hợp] ✅ API bổ sung tích hợp đã kích hoạt, mô hình:', BUILTIN_EXTRA_API_CONFIG.model);

    // Hiển thị thông báo
    alert('✅ API tích hợp đã được bật thành công!\nMô hình: ' + BUILTIN_EXTRA_API_CONFIG.model + '\n\nBây giờ có thể sử dụng các chức năng như biến bất đồng bộ.');
}

// ==================== Hệ thống cài đặt trò chơi ====================
// saveGameSettings, toggleVectorRetrieval, changeVectorMethod, toggleSection
// Đã di chuyển sang game-core-systems.js

// openConfigModal, closeConfigModal Đã di chuyển sang game-core-systems.js

// Phân tích phản hồi từ AI
function parseAIResponse(response) {
    console.log('🔍 Bắt đầu phân tích phản hồi AI, độ dài gốc:', response.length);
    console.log('📝 500 ký tự đầu của phản hồi gốc:', response.substring(0, 500));

    // 🔧 Tự động sửa các lỗi định dạng JSON thường gặp
    function autoFixJSON(jsonStr) {
        console.log('🔧 Bắt đầu tự động sửa JSON, độ dài đầu vào:', jsonStr.length);
        console.log('📝 100 ký tự đầu trước khi sửa:', jsonStr.substring(0, 100));
        let fixed = jsonStr.trim();

        // Sửa 0: Xử lý thông minh dấu ngoặc kép tiếng Trung
        // 🔧 Chiến lược: Sử dụng mã Unicode để chỉ định rõ ràng dấu ngoặc kép tiếng Trung, tránh nhầm lẫn mã hóa
        // U+201C: “ (LEFT DOUBLE QUOTATION MARK)
        // U+201D: ” (RIGHT DOUBLE QUOTATION MARK)  
        // U+2018: ‘ (LEFT SINGLE QUOTATION MARK)
        // U+2019: ’ (RIGHT SINGLE QUOTATION MARK)
        // U+300C-U+300F: 「」『』 (Ngoặc CJK)
        // U+301D-U+301E: 〝〞 (Biến thể dấu ngoặc kép)
        // U+FF02: ＂ (Dấu ngoặc kép toàn chiều rộng)
        // Lưu ý: Không thể thay thế bằng dấu ngoặc đơn vì sửa lỗi 8 sẽ chuyển dấu ngoặc đơn thành dấu ngoặc kép
        const chineseDoubleQuotesRegex = /[\u201C\u201D\u301D\u301E\uFF02\u300C\u300D\u300E\u300F]/g;
        const chineseSingleQuotesRegex = /[\u2018\u2019]/g;
        let chineseDoubleQuoteCount = (fixed.match(chineseDoubleQuotesRegex) || []).length;
        let chineseSingleQuoteCount = (fixed.match(chineseSingleQuotesRegex) || []).length;
        if (chineseDoubleQuoteCount > 0 || chineseSingleQuoteCount > 0) {
            console.log('🔧 Phát hiện số lượng dấu ngoặc kép tiếng Trung: Dấu đôi=' + chineseDoubleQuoteCount + ', Dấu đơn=' + chineseSingleQuoteCount);
            // Thay thế dấu ngoặc kép tiếng Trung bằng dấu huyền/backtick (không bị ảnh hưởng bởi sửa lỗi 8)
            fixed = fixed.replace(chineseDoubleQuotesRegex, '`');
            // Thay thế dấu ngoặc đơn tiếng Trung bằng dấu huyền/backtick
            fixed = fixed.replace(chineseSingleQuotesRegex, '`');
        }
        console.log('🔧 Đã xử lý dấu ngoặc kép tiếng Trung bên trong chuỗi');

        // Sửa 1: Loại bỏ đánh dấu "json ở đầu (bao gồm cả dấu ngoặc kép)
        if (fixed.startsWith('"json')) {
            console.log('🔧 Loại bỏ đánh dấu "json ở đầu');
            fixed = fixed.replace(/^"json\s*/, '');
        } else if (fixed.startsWith('json')) {
            console.log('🔧 Loại bỏ đánh dấu json ở đầu');
            fixed = fixed.replace(/^json\s*/, '');
        }

        // Sửa 1.5: Xử lý dấu ngoặc kép thừa ở đầu
        if (fixed.startsWith('"') && !fixed.startsWith('"{')) {
            console.log('🔧 Loại bỏ dấu ngoặc kép thừa ở đầu');
            fixed = fixed.substring(1);
        }

        // Sửa 2: Xử lý ký tự xuống dòng chưa được thoát trong chuỗi
        const originalNewlines = fixed.match(/\n/g) || [];
        console.log('🔧 Phát hiện số lượng ký tự xuống dòng chưa thoát:', originalNewlines.length);

        // 🔧 Quan trọng: Bảo vệ nội dung văn bản trước để tránh làm hỏng khi sửa lỗi
        const textBlocks = [];
        let tempFixed = fixed;

        // Trích xuất và bảo vệ tất cả các giá trị chuỗi JSON (sử dụng regex chính xác hơn)
        // 🔧 Cải tiến: Xử lý các trường hợp chứa dấu ngoặc kép đã được thoát
        tempFixed = tempFixed.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
            const placeholder = `__TEXT_BLOCK_${textBlocks.length}__`;
            textBlocks.push(content);
            return '"' + placeholder + '"';
        });

        // Phương pháp sửa ký tự xuống dòng an toàn hơn - chỉ sửa trong phần giữ chỗ
        tempFixed = tempFixed.replace(/"([^"]*)"/g, (match, placeholder) => {
            if (placeholder.includes('__TEXT_BLOCK_')) {
                const index = parseInt(placeholder.match(/__TEXT_BLOCK_(\d+)__/)[1]);
                const originalContent = textBlocks[index];
                const escapedContent = originalContent.replace(/\n/g, '\\n');
                return '"' + escapedContent + '"';
            }
            return match;
        });

        fixed = tempFixed;

        // Sửa 3: Sửa JSON bị cắt đoạn - Thử bổ sung các dấu ngoặc bị thiếu
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        if (missingBraces > 0) {
            console.warn(`🔧 Phát hiện JSON thiếu ${missingBraces} dấu ngoặc đóng, đang thử tự động bổ sung`);
            fixed += '}'.repeat(missingBraces);
        }

        // Sửa 4: Xử lý mảng bị cắt đoạn
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const missingBrackets = openBrackets - closeBrackets;

        if (missingBrackets > 0) {
            console.warn(`🔧 Phát hiện JSON thiếu ${missingBrackets} dấu ngoặc vuông đóng, đang thử tự động bổ sung`);
            fixed += ']'.repeat(missingBrackets);
        }

        // Sửa 5: Xử lý dấu phẩy thừa ở cuối
        const hasTrailingComma = fixed.match(/,\s*([}\]])/);
        if (hasTrailingComma) {
            console.log('🔧 Loại bỏ dấu phẩy thừa ở cuối');
            fixed = fixed.replace(/,\s*([}\]])/g, '$1');
        }

        // Sửa 6: Xử lý trường hợp dấu ngoặc kép không khớp đôi
        const quotes = (fixed.match(/"/g) || []).length;
        if (quotes % 2 !== 0) {
            console.warn('🔧 Phát hiện dấu ngoặc kép không khớp đôi, đang thử sửa');
            fixed += '"';
        }

        // Sửa 7: Xử lý tên thuộc tính thiếu dấu ngoặc kép - Khớp chính xác hơn
        // Chỉ sửa các tên thuộc tính JSON thực sự, tránh làm hỏng nội dung văn bản
        // Sử dụng chế độ nghiêm ngặt hơn: Phía trước phải là xuống dòng + khoảng trắng/tab, và không nằm trong chuỗi
        fixed = fixed.replace(/(\n[\t ]*)(\w+)([\t ]*):/g, (match, indent, word, space) => {
            // Chỉ khớp các tên thuộc tính có thụt đầu dòng định dạng JSON
            return indent + '"' + word + '"' + space + ':';
        });

        // Sửa 8: Xử lý chuỗi được bao quanh bởi dấu ngoặc đơn
        fixed = fixed.replace(/'([^']*)'/g, '"$1"');

        console.log('🔧 Sửa lỗi hoàn tất, độ dài đầu ra:', fixed.length);
        console.log('📝 100 ký tự đầu sau khi sửa:', fixed.substring(0, 100));

        // 🔧 Kiểm tra xem JSON sau khi sửa có hợp lệ không
        try {
            JSON.parse(fixed);
            console.log('✅ Cú pháp JSON sau khi sửa đã chính xác');
        } catch (testError) {
            console.log('❌ JSON sau khi sửa vẫn còn vấn đề:', testError.message);
            console.log('📄 Gần vị trí lỗi:', fixed.substring(Math.max(0, testError.message.match(/position (\d+)/)?.[1] - 50), parseInt(testError.message.match(/position (\d+)/)?.[1] || 0) + 50));
        }

        return fixed;
    }

    try {
        // Thử phân tích JSON trực tiếp
        console.log('🔍 Thử phân tích JSON trực tiếp...');
        const parsed = JSON.parse(response);
        console.log('✅ Phân tích trực tiếp thành công!');
        return parsed;
    } catch (e) {
        console.log('❌ Phân tích trực tiếp thất bại:', e.message);

        // 🔧 Xử lý đặc biệt: Kiểm tra xem có phải vấn đề bắt đầu bằng "json không
        if (response.trim().startsWith('"json')) {
            console.log('🔧 Phát hiện vấn đề đặc biệt bắt đầu bằng "json, áp dụng sửa lỗi chuyên biệt...');
            let specialFixed = response.trim();

            // Loại bỏ "json ở đầu
            specialFixed = specialFixed.replace(/^"json\s*/, '');

            // Nếu ở đầu vẫn còn dấu ngoặc kép, cũng loại bỏ
            if (specialFixed.startsWith('"') && !specialFixed.startsWith('"{')) {
                specialFixed = specialFixed.substring(1);
            }

            console.log('🔧 200 ký tự đầu sau khi sửa chuyên biệt:', specialFixed.substring(0, 200));

            try {
                const parsed = JSON.parse(specialFixed);
                console.log('✅ Sửa lỗi chuyên biệt thành công!');
                return parsed;
            } catch (specialError) {
                console.log('❌ Sửa lỗi chuyên biệt thất bại:', specialError.message);
            }
        }

        console.log('🔧 Bắt đầu quy trình tự động sửa lỗi thông thường...');

        // Thử trích xuất khối mã JSON và sửa lỗi
        const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
if (jsonMatch) {
            let jsonStr = jsonMatch[1].trim();
            console.log('📝 Đã trích xuất khối mã JSON, độ dài:', jsonStr.length);
            console.log('📝 200 ký tự đầu của khối mã JSON:', jsonStr.substring(0, 200));

            // Áp dụng tự động sửa lỗi
            const fixedJson = autoFixJSON(jsonStr);

            try {
                const parsed = JSON.parse(fixedJson);
                console.log('✅ Sửa lỗi khối mã JSON thành công!');
                return parsed;
            } catch (e2) {
                console.error('❌ Phân tích vẫn thất bại sau khi sửa lỗi:', e2.message);
                console.error('📄 Xem trước JSON sau khi sửa:', fixedJson.substring(0, 500));
                console.error('📄 Phần cuối JSON sau khi sửa:', fixedJson.substring(Math.max(0, fixedJson.length - 200)));
            }
        } else {
            console.log('📝 Không tìm thấy đánh dấu khối mã JSON');
        }

        // Nếu sửa lỗi khối mã thất bại, thử sửa toàn bộ phản hồi
        console.log('🔧 Thử sửa lỗi toàn bộ phản hồi...');
        const fixedResponse = autoFixJSON(response);

        try {
            const parsed = JSON.parse(fixedResponse);
            console.log('✅ Sửa lỗi toàn bộ phản hồi thành công!');
            return parsed;
        } catch (e3) {
            console.error('❌ Sửa lỗi toàn bộ phản hồi thất bại:', e3.message);
        }

        // Nếu tất cả đều thất bại, thử tìm nội dung bao quanh bởi dấu ngoặc nhọn và sửa lỗi
        const braceMatch = response.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            console.log('🔧 Thử sửa lỗi nội dung trong dấu ngoặc nhọn...');
            console.log('📝 Độ dài nội dung trong dấu ngoặc nhọn:', braceMatch[0].length);
            const fixedBraceContent = autoFixJSON(braceMatch[0]);

            try {
                const parsed = JSON.parse(fixedBraceContent);
                console.log('✅ Sửa lỗi nội dung dấu ngoặc nhọn thành công!');
                return parsed;
            } catch (e4) {
                console.error('❌ Sửa lỗi nội dung dấu ngoặc nhọn thất bại:', e4.message);
                console.error('📄 Độ dài nội dung trích xuất được:', braceMatch[0].length);

                // 🔍 Kiểm tra xem có phải do bị cắt đoạn không
                const jsonStr = braceMatch[0].trim();
                if (!jsonStr.endsWith('}')) {
                    console.error('⚠️ JSON bị cắt đoạn! Thiếu dấu ngoặc đóng ở cuối');
                    console.error('💡 Gợi ý: Giảm cài đặt "Số chữ tối thiểu thế giới động" xuống 150-200 chữ');
                }
            }
        }

        // Thử nghiệm cuối cùng: Trích xuất cưỡng chế tất cả nội dung JSON khả thi
        console.log('🔧 Thử trích xuất cưỡng chế nội dung JSON...');
        const allBraces = response.match(/\{[\s\S]*?\}/g);
        if (allBraces && allBraces.length > 0) {
            console.log(`📝 Tìm thấy ${allBraces.length} khối JSON`);
            // Thử khối JSON có độ dài lớn nhất
            const largestJson = allBraces.reduce((a, b) => a.length > b.length ? a : b);
            console.log('📝 Độ dài khối JSON lớn nhất:', largestJson.length);
            const fixedLargest = autoFixJSON(largestJson);

            try {
                const parsed = JSON.parse(fixedLargest);
                console.log('✅ Sửa lỗi trích xuất cưỡng chế thành công!');

                // 🔧 Kiểm tra xem có chứa các trường cần thiết không
                if (!parsed.story) {
                    console.warn('⚠️ JSON trích xuất được thiếu trường story, đang thử trích xuất từ phản hồi gốc');
                    // Thử trích xuất văn bản thuần làm story từ phản hồi gốc
                    const textMatch = response.match(/"story"\s*:\s*"([^"]*)"/);
                    if (textMatch) {
                        parsed.story = textMatch[1].replace(/\\n/g, '\n');
                        console.log('✅ Đã trích xuất được trường story từ phản hồi gốc');
                    } else {
                        // Nếu vẫn không có, sử dụng một phần phản hồi gốc
                        parsed.story = response.substring(0, 500) + '\n\n[Phân tích phản hồi không hoàn chỉnh, một số nội dung có thể bị thiếu]';
                        console.warn('⚠️ Sử dụng đoạn phản hồi gốc làm story');
                    }
                }

                return parsed;
            } catch (e5) {
                console.error('❌ Sửa lỗi trích xuất cưỡng chế thất bại:', e5.message);
            }
        }

        // Nếu tất cả đều thất bại, trả về một cấu trúc cơ bản
        console.warn('⚠️ Tất cả các nỗ lực sửa lỗi đều thất bại, sử dụng văn bản gốc làm story');
        console.warn('📊 Độ dài phản hồi gốc:', response.length);
        console.error('🔍 Nguyên nhân khả thi: 1) API bên thứ ba cắt đoạn đầu ra 2) max_tokens được đặt quá thấp 3) AI không xuất ra đúng định dạng');
        return {
            story: response,
            reasoning: {
                situation: 'Phân tích thất bại - Định dạng phản hồi AI bị lỗi, đã thử tự động sửa nhưng không thành công',
                playerChoice: 'Không rõ',
                logicChain: ['Phân tích JSON thất bại', 'Thử tự động sửa lỗi thất bại', 'Sử dụng văn bản gốc làm nội dung câu chuyện'],
                outcome: 'Đề nghị kiểm tra cấu hình mô hình AI hoặc giảm yêu cầu đầu ra',
                variableCheck: {
                    hp_mp_changed: 'Không',
                    items_changed: 'Không',
                    relationships_changed: 'Không',
                    sexual_content_occurred: 'Không',
                    attributes_changed: 'Không',
                    other_changes: 'Không',
                    history_content: 'Phân tích thất bại, không có hồ sơ lịch sử',
                    npc_reaction_appropriate: 'Không'
                }
            },
            variableChanges: {
                analysis: 'Phân tích thất bại, không có thay đổi biến',
                changes: {},
                arrayChanges: {}
            },
            options: [
                "Tạo lại phản hồi",
                "Bỏ qua lượt này",
                "Xem phản hồi gốc"
            ]
        };
    }
}

// 🆕 Xây dựng lại hồ sơ lịch sử: Tự động tạo các lịch sử quan trọng còn thiếu dựa trên lịch sử đối thoại
async function rebuildHistoryRecords() {
    if (!gameState.isGameStarted) {
        alert('Vui lòng tải bản lưu trước!');
        return;
    }

    const confirm = window.confirm('Chức năng này sẽ sử dụng AI dựa trên lịch sử đối thoại của bạn để tự động xây dựng lại các bản ghi "lịch sử quan trọng" còn thiếu.\n\nViệc này có thể tiêu tốn một ít hạn ngạch API. Tiếp tục chứ?');
    if (!confirm) return;

    try {
        // Xây dựng gợi ý
        const conversationSummary = gameState.conversationHistory
            .filter(msg => msg.role === 'user')
            .map((msg, i) => `Lượt thứ ${i + 1}: ${msg.content}`)
            .join('\n');

        const prompt = `Dựa trên lịch sử đối thoại dưới đây, hãy tạo các bản ghi lịch sử quan trọng cho nhân vật tu tiên "${gameState.variables.name}".

Yêu cầu:
1. Mỗi lượt đối thoại tạo ra 1 bản ghi lịch sử
2. Mỗi bản ghi ít nhất 40 chữ, không quá 100 chữ
3. Bao gồm thời gian, địa điểm, nhân vật, sự kiện
4. Sắp xếp theo thứ tự thời gian
5. Trả về định dạng mảng JSON, ví dụ: ["Lịch sử 1", "Lịch sử 2"]

Lịch sử hiện có:
${gameState.variables.history ? gameState.variables.history.join('\n') : '(Không có)'}

Lịch sử đối thoại:
${conversationSummary}

Vui lòng trả về mảng hồ sơ lịch sử đầy đủ (bao gồm cả cái đã có + cái mới tạo):`;

        const response = await callAI(prompt);

        // Phân tích phản hồi
        let historyArray;
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                historyArray = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Không tìm thấy mảng JSON');
            }
        } catch (error) {
            alert('Phân tích thất bại: ' + error.message);
            return;
        }

        // Cập nhật hồ sơ lịch sử
        gameState.variables.history = historyArray;
        updateStatusPanel();

        alert(`✅ Xây dựng lại thành công!\nĐã tạo ${historyArray.length} bản ghi lịch sử quan trọng.`);
        console.log('[Xây dựng lại lịch sử] Hồ sơ lịch sử mới:', historyArray);

    } catch (error) {
        alert('Xây dựng lại thất bại: ' + error.message);
        console.error('[Xây dựng lại lịch sử] Lỗi:', error);
    }
}

// Xem ngữ cảnh (context)
async function viewContext() {
    if (!gameState.isGameStarted) {
        alert('Vui lòng bắt đầu trò chơi trước!');
        return;
    }

    // Xây dựng tin nhắn chuẩn bị gửi (sử dụng chuỗi trống làm chỗ giữ tin nhắn người dùng)
    const messages = await buildAIMessages('[Dữ liệu nhập hoặc tùy chọn của người dùng chuẩn bị gửi]');

    // Lưu messages gốc để xuất bản thuần túy
    window._lastContextMessages = messages;
    const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;

    // Định dạng tin nhắn
    let contextText = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    contextText += '📋 Nội dung ngữ cảnh chuẩn bị gửi cho AI\n';
    contextText += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    let systemFormatCount = 0;
    let formatOpen = false;
    let pendingBuffer = '';
    messages.forEach((msg, index) => {
        const roleLabel = msg.role === 'system' ? '🔧 Hệ thống' :
            msg.role === 'user' ? '👤 Người dùng' :
                '🤖 AI';

        let prefix = '';
        if (enableVectorRetrieval && msg.role === 'system' && msg.content.includes('【Hồi ức lịch sử liên quan】')) {
            prefix = '🧬 [Truy xuất Vector] ';
        }

        if (msg.role === 'system' && msg.content.includes('【Cực kỳ quan trọng】Yêu cầu bắt buộc về góc nhìn kể chuyện')) {
            prefix = '📖 [Góc nhìn kể chuyện] ';
        }

        let blockText = `【Tin nhắn ${index + 1}】 ${prefix}${roleLabel}\n` +
            '─'.repeat(40) + '\n' +
            msg.content + '\n\n';

        const isVariableStatus = (msg.role === 'system' && msg.content.startsWith('Trạng thái biến nhân vật hiện tại'));
        const qualifies = (msg.role === 'system' && !isVariableStatus && systemFormatCount < 3);

        if (msg.role === 'assistant') {
            blockText = `<context>\n` + blockText + `</context>\n`;
        }

        if (formatOpen) {
            if (qualifies) {
                contextText += blockText;
                systemFormatCount++;
                if (systemFormatCount >= 3) {
                    contextText += `</format>\n`;
                    formatOpen = false;
                    if (pendingBuffer) {
                        contextText += pendingBuffer;
                        pendingBuffer = '';
                    }
                }
            } else {
                pendingBuffer += blockText;
            }
        } else {
            if (qualifies) {
                contextText += `<format>\n`;
                contextText += blockText;
                systemFormatCount++;
                formatOpen = true;
            } else {
                contextText += blockText;
            }
        }
    });
    // Nếu chưa đủ 3 tin nhắn mà đã mở thẻ, thì đóng thẻ ở cuối và thêm phần đệm
    if (formatOpen) {
        contextText += `</format>\n`;
        if (pendingBuffer) {
            contextText += pendingBuffer;
        }
    }

    // Lấy thông tin thống kê (hiển thị bên ngoài contextPreviewPre)
    const narrativePerspectiveInput = document.getElementById('narrativePerspective');
    const narrativePerspective = narrativePerspectiveInput ? narrativePerspectiveInput.value : 'first';
    const perspectiveText = {
        'first': 'Ngôi thứ nhất (Tôi)',
        'second': 'Ngôi thứ hai (Bạn)',
        'third': 'Ngôi thứ ba (Anh ấy/Cô ấy)'
    };
    // Tính toán số lượng ký tự thực tế gửi cho AI (tổng số ký tự của tất cả nội dung tin nhắn)
    let totalCharCount = 0;
    messages.forEach(msg => {
        totalCharCount += msg.content.length;
    });

    // Xây dựng HTML thông tin thống kê (hiển thị riêng biệt)
    const statsHtml = `
        <div style="
            background: linear-gradient(to right, #f0f4ff, #e8f0fe);
            border: 1px solid #d0e1ff;
            padding: 18px 24px;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        ">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px; color: #2c3e50;">
                <div>📊 <strong style="color: #4a5568;">Tổng số tin nhắn:</strong> <span style="color: #2563eb; font-weight: 600;">${messages.length}</span></div>
                <div>🔍 <strong style="color: #4a5568;">Truy xuất Vector:</strong> <span style="font-weight: 600;">${enableVectorRetrieval ? '✅ Đã bật' : '❌ Chưa bật'}</span></div>
                <div>📜 <strong style="color: #4a5568;">Cài đặt số tầng lịch sử:</strong> <span style="color: #2563eb; font-weight: 600;">${document.getElementById('historyDepth').value}</span></div>
                <div>📝 <strong style="color: #4a5568;">Yêu cầu số chữ tối thiểu:</strong> <span style="color: #2563eb; font-weight: 600;">${document.getElementById('minWordCount').value}</span></div>
                <div>👁️ <strong style="color: #4a5568;">Góc nhìn kể chuyện:</strong> <span style="color: #2563eb; font-weight: 600;">${perspectiveText[narrativePerspective]}</span></div>
                <div>🔤 <strong style="color: #4a5568;">Tổng số ký tự:</strong> <span style="color: #2563eb; font-weight: 600;">${totalCharCount}</span></div>
            </div>
        </div>
    `;

    // Tạo modal hiển thị
    const modal = document.createElement('div');
    modal.id = 'contextViewModal';
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
        padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">👁️ Xem trước ngữ cảnh</h2>
            <button onclick="document.getElementById('contextViewModal').remove()" style="
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">Đóng</button>
        </div>
        ${statsHtml}
        <pre id="contextPreviewPre" style="
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.6;
            max-height: 60vh;
            overflow-y: auto;
        "></pre>
        <div style="margin-top: 15px; text-align: center; display: flex; gap: 10px; justify-content: center;">
            <button onclick="
                const text = document.getElementById('contextPreviewPre').textContent;
                navigator.clipboard.writeText(text).then(() => alert('Đã sao chép vào bộ nhớ tạm!'));
            " style="
                padding: 10px 20px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">📋 Sao chép vào bộ nhớ tạm</button>
            <button onclick="exportContextToTxt()" style="
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">💾 Xuất dưới dạng TXT</button>
        </div>
    `;
    // Sử dụng textContent để tránh các thẻ bị trình duyệt phân giải HTML, đảm bảo nhìn thấy được <format> và <context>
    const preEl = content.querySelector('#contextPreviewPre');
    if (preEl) preEl.textContent = contextText;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Click vào hình nền để đóng
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Xuất ngữ cảnh dưới dạng tệp TXT (Bản thuần túy, chỉ chứa nội dung thực tế gửi đi)
function exportContextToTxt() {
    const messages = window._lastContextMessages;
    if (!messages || messages.length === 0) {
        alert('Không tìm thấy nội dung ngữ cảnh');
        return;
    }

    // Tạo nội dung thuần túy: chỉ bao gồm role và content
    let text = '';
    messages.forEach((msg, index) => {
        const roleLabel = msg.role === 'system' ? '[SYSTEM]' :
            msg.role === 'user' ? '[USER]' : '[ASSISTANT]';
        text += `=== Tin nhắn ${index + 1} ${roleLabel} ===\n`;
        text += msg.content + '\n\n';
    });

    const filename = 'ai_context_' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.txt';

    try {
        // Cách 1: Sử dụng data URI
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error('Xuất tệp thất bại:', e);
        // Phương án dự phòng: Sao chép vào bộ nhớ tạm
        navigator.clipboard.writeText(text).then(() => {
            alert('Xuất tệp thất bại, nội dung đã được sao chép vào bộ nhớ tạm, vui lòng dán thủ công để lưu trữ');
        }).catch(() => {
            alert('Xuất tệp thất bại: ' + e.message);
        });
    }
}

// Khôi phục hiển thị lịch sử đối thoại
function restoreConversationHistory() {
    const historyDiv = document.getElementById('gameHistory');
    historyDiv.innerHTML = '';

    console.log('[Khôi phục đối thoại] Bắt đầu kết xuất, tổng số mục:', gameState.conversationHistory.length);
    let userCount = 0;
    let aiCount = 0;

    // Duyệt qua hồ sơ lịch sử để hiển thị lại
    for (let i = 0; i < gameState.conversationHistory.length; i++) {
        const msg = gameState.conversationHistory[i];
        if (msg.role === 'assistant') {
            // Tin nhắn AI, cần lấy tùy chọn từ các tin nhắn sau đó (nếu có)
            // Vì chúng ta chỉ lưu cốt truyện, tùy chọn không thể khôi phục nên chỉ hiển thị cốt truyện
            // 🎨 Truyền vào imgPrompt và isRestore=true, khi khôi phục chỉ hiển thị nút "Nhấp để tạo ảnh"
            displayAIMessage(msg.content, [], null, msg.imgPrompt || null, true);
            aiCount++;
            console.log(`[Khôi phục đối thoại] ✅ Tin nhắn AI ${i + 1}: ${msg.content.substring(0, 30)}...`, msg.imgPrompt ? '(Có từ khóa gợi ý hình ảnh)' : '');
        } else if (msg.role === 'user') {
            // Tin nhắn người dùng - 🔧 Cưỡng chế kết xuất, bỏ qua kiểm tra chế độ gỡ lỗi
            displayUserMessage(msg.content, true);
            userCount++;
            console.log(`[Khôi phục đối thoại] ✅ Tin nhắn người dùng ${i + 1}: ${msg.content.substring(0, 30)}...`);
        }
    }

    console.log(`[Khôi phục đối thoại] Kết xuất hoàn tất: Người dùng ${userCount} mục, AI ${aiCount} mục, phần tử con gameHistory: ${historyDiv.children.length}`);

    // 🌍 Cập nhật hiển thị thẻ nội dung thế giới động (không chèn vào lịch sử trò chơi)
    console.log('[Thế giới động] restoreConversationHistory - Hồ sơ thế giới động:', {
        hasDynamicWorld: !!gameState.dynamicWorld,
        historyLength: gameState.dynamicWorld?.history?.length || 0
    });

    // Chỉ cập nhật trang Tab thế giới động, không chèn vào lịch sử trò chơi
    displayDynamicWorldHistory();

    // Tự động cuộn xuống dưới cùng
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Chế độ gỡ lỗi: Chuyển đổi khu vực hiển thị
function toggleDebugMode() {
    const debug = document.getElementById('debugMode')?.checked;
    const hist = document.getElementById('gameHistory');
    const dbg = document.getElementById('debugOutput');
    if (!hist || !dbg) return;
    if (debug) {
        hist.style.display = 'none';
        dbg.style.display = 'block';
        // Gợi ý một thông tin đã bật để người dùng dễ dàng xác nhận trạng thái
        const ts = new Date().toLocaleTimeString();
        dbg.textContent = `[${ts}] ⚙️ Chế độ gỡ lỗi đã bật` + "\n\n";
        // Lập tức in lịch sử hiện có ra khu vực gỡ lỗi (ưu tiên JSON/phản hồi gốc)
        try {
            if (Array.isArray(gameState?.conversationHistory)) {
                gameState.conversationHistory.forEach(msg => {
                    if (!msg || !msg.role) return;
                    const from = msg.role === 'user' ? 'USER' : 'AI';
                    const payload = msg.rawJson || msg.rawResponse || msg.content || '';
                    appendDebug(from, payload);
                });
            }
        } catch (e) {
            console.warn('Đã xảy ra lỗi khi xuất lịch sử ra khu vực gỡ lỗi:', e);
        }
    } else {
        hist.style.display = 'block';
        dbg.style.display = 'none';
        // Xóa sạch nhật ký gỡ lỗi khi thoát để tránh chiếm bộ nhớ
        dbg.textContent = '';
    }
}

// Chế độ gỡ lỗi: Thêm một dòng nhật ký gốc
function appendDebug(from, text) {
    const dbg = document.getElementById('debugOutput');
    if (!dbg) return;
    const ts = new Date().toLocaleTimeString();
    const header = from === 'USER' ? '👤 USER' : '🤖 AI';
    dbg.textContent += `[${ts}] ${header}\n` + String(text ?? '') + "\n\n";
    dbg.scrollTop = dbg.scrollHeight;
}