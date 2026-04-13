/**
 * Module xử lý phản hồi từ AI
 * Xử lý thống nhất dữ liệu JSON trả về từ AI, bao gồm cập nhật biến, cập nhật mảng lũy tiến, tích hợp thư viện vector, v.v.
 * * @author Tái cấu trúc từ mã lặp lại của game.html và game-bhz.html
 * @version 1.0.0
 */

class AIResponseHandler {
    /**
     * @param {Object} gameState - Đối tượng trạng thái trò chơi
     * @param {Object} config - Cấu hình trò chơi
     * @param {boolean} config.hasCombatSystem - Có hệ thống chiến đấu hay không
     * @param {boolean} config.enableStatsField - Có bật xử lý trường stats hay không
     * @param {Function} config.combatParser - Hàm phân tích thông tin chiến đấu (tùy chọn)
     */
    constructor(gameState, config = {}) {
        this.gameState = gameState;
        this.config = {
            hasCombatSystem: config.hasCombatSystem || false,
            enableStatsField: config.enableStatsField || false,
            combatParser: config.combatParser || null
        };
        
        console.log('[Bộ xử lý phản hồi AI] Khởi tạo', this.config);
    }
    
    /**
     * Hợp nhất sâu các đối tượng - Giữ lại các trường lồng nhau không được cập nhật một cách thông minh
     * @param {Object} target - Đối tượng đích (sẽ bị thay đổi)
     * @param {Object} source - Đối tượng nguồn (cung cấp giá trị mới)
     * @returns {Object} Đối tượng đích sau khi hợp nhất
     */
    deepMerge(target, source) {
        // Nếu source không phải đối tượng, hoặc là null/undefined, trả về target trực tiếp
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            return target;
        }
        
        // Duyệt qua tất cả thuộc tính của source
        for (const key in source) {
            if (!source.hasOwnProperty(key)) continue;
            
            const sourceValue = source[key];
            const targetValue = target[key];
            
            // Nếu giá trị của source là undefined, bỏ qua (giữ giá trị gốc của target)
            if (sourceValue === undefined) {
                continue;
            }
            
            // Nếu giá trị của source là đối tượng và target cũng có đối tượng này, thực hiện hợp nhất đệ quy
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
                targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                this.deepMerge(targetValue, sourceValue);
            } else {
                // Ngược lại thì gán trực tiếp (bao gồm mảng, kiểu dữ liệu cơ bản, v.v.)
                target[key] = sourceValue;
            }
        }
        
        return target;
    }
    
    /**
     * Hàm chính xử lý phản hồi từ AI
     * @param {string} response - Phản hồi thô từ AI
     */
    handleAIResponse(response) {
        // Chế độ debug: Hiển thị trực tiếp phản hồi thô, không thực hiện phân tích hay render
        const debugCheckbox = document.getElementById('debugMode');
        if (debugCheckbox && debugCheckbox.checked) {
            this.appendDebug('AI', response);
            return;
        }

        // ✅ Sử dụng công cụ xử lý JSON phiên bản tăng cường (đảm bảo không thất bại)
        let data;
        try {
            data = processAIResponse(response);
        } catch (error) {
            console.error('❌ Ngoại lệ processAIResponse:', error);
            // Phương án dự phòng: Xây dựng dữ liệu tối thiểu có thể sử dụng
            data = {
                reasoning: { situation: 'Phân tích ngoại lệ', playerChoice: '', logicChain: [], outcome: '' },
                variableChanges: { analysis: 'Lỗi phân tích (Parse error)', changes: {} },
                story: 'Lỗi hệ thống: Phân tích phản hồi AI thất bại\n\n' + response.substring(0, 500),
                options: ['Tạo lại', 'Thử tiếp tục', 'Xem log', 'Về menu', 'Lưu và thoát']
            };
        }
        
        // 🔍 Debug: In các trường có trong đối tượng data sau khi phân tích
        console.log('[Phản hồi AI] 📦 Các trường đã phân tích:', Object.keys(data));
        console.log('[Phản hồi AI] 🖼️ data.img tồn tại?', 'img' in data, 'Giá trị:', data.img ? data.img.substring(0, 80) : 'Không có');

        // Cập nhật biến (hỗ trợ ba định dạng)
        if (data.variableUpdate) {
            try {
                // Định dạng rút gọn v3.1 (khuyên dùng)
                console.log('[ai-response-handler] 🎯 Sử dụng định dạng rút gọn v3.1 để cập nhật biến');
                console.log('[ai-response-handler] Nội dung variableUpdate:', data.variableUpdate);
                
                // Khởi tạo bộ phân tích v3.1
                if (!window.v31Parser) {
                    console.log('[ai-response-handler] Đang khởi tạo bộ phân tích...');
                    window.v31Parser = new VariableInstructionParserV31(this.gameState, {
                        debug: true,
                        enableRollback: false
                    });
                    console.log('[ai-response-handler] Khởi tạo bộ phân tích hoàn tất');
                }
                
                // Phân tích và thực thi cập nhật biến
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[ai-response-handler] ✅ Kết quả cập nhật:', result);
                
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('[ai-response-handler] ❌ Cập nhật biến v3.1 thất bại:', error);
                console.error('[ai-response-handler] Chi tiết lỗi:', error.message);
                console.error('[ai-response-handler] Nội dung variableUpdate:', data.variableUpdate);
            }
        } else if (data.variableChanges) {
            try {
                // Phương án cũ: Cập nhật lũy tiến
                this.applyVariableChanges(data.variableChanges);
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ Cập nhật biến thất bại:', error);
            }
        } else if (data.variables) {
            try {
                // Phương án cũ: Biểu mẫu biến đầy đủ (tương thích ngược)
                this.updateVariables(data.variables);
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ Cập nhật biến thất bại (phương án cũ):', error);
            }
        }

        // Xử lý trường stats (chuyển đổi thành attributes trong variables)
        if (this.config.enableStatsField && data.stats) {
            try {
                if (!this.gameState.variables.attributes) {
                    this.gameState.variables.attributes = {};
                }
                
                // Sử dụng hợp nhất sâu để gộp các giá trị thuộc tính trong stats vào attributes
                this.deepMerge(this.gameState.variables.attributes, data.stats);
                console.log('[Cập nhật thuộc tính] 📊 Cập nhật thuộc tính từ trường stats (hợp nhất sâu):', data.stats);
                
                // Cập nhật UI
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ Xử lý trường stats thất bại:', error);
            }
        }

        // Xử lý các trường liên quan đến trạng thái đặc biệt (specialStatus, status, mood, thought, v.v.)
        try {
            let needsUIUpdate = false;
            
            // 1. Xử lý trường specialStatus (đối tượng trạng thái đặc biệt)
            if (data.specialStatus && typeof data.specialStatus === 'object') {
                if (!this.gameState.variables.specialStatus) {
                    this.gameState.variables.specialStatus = {};
                }
                this.deepMerge(this.gameState.variables.specialStatus, data.specialStatus);
                console.log('[Trạng thái đặc biệt] 📊 Cập nhật từ trường specialStatus:', data.specialStatus);
                needsUIUpdate = true;
            }
            
            // 2. Xử lý trường status (mô tả trạng thái hiện tại)
            if (data.status !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.status = data.status;
                console.log('[Trạng thái đặc biệt] 📍 Cập nhật trạng thái nhân vật chính:', data.status);
                needsUIUpdate = true;
            }
            
            // 3. Xử lý trường mood (tâm trạng)
            if (data.mood !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.mood = data.mood;
                console.log('[Trạng thái đặc biệt] 💭 Cập nhật tâm trạng nhân vật chính:', data.mood);
                needsUIUpdate = true;
            }
            
            // 4. Xử lý trường thought (suy nghĩ nội tâm)
            if (data.thought !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.thought = data.thought;
                console.log('[Trạng thái đặc biệt] 💭 Cập nhật suy nghĩ nhân vật chính:', data.thought);
                needsUIUpdate = true;
            }
            
            // Nếu có cập nhật, làm mới UI
            if (needsUIUpdate) {
                updateStatusPanel();
            }
        } catch (error) {
            console.error('❌ Xử lý các trường trạng thái đặc biệt thất bại:', error);
        }

        // Thêm vào lịch sử (lưu cốt truyện + phản hồi thô/JSON + imgPrompt)
        if (data.story) {
            this.gameState.conversationHistory.push({
                role: 'assistant',
                content: data.story,
                rawResponse: response,
                parsed: data,
                imgPrompt: data.img || null  // 🎨 Lưu gợi ý hình ảnh để phục hồi lưu trữ
            });

            // Lưu bản sao nhanh (snapshot) các biến hiện tại
            this.gameState.variableSnapshots.push(JSON.parse(JSON.stringify(this.gameState.variables)));
            
            // 【Mới】Nếu bật truy xuất vector, thêm vào thư viện vector
            this.addToVectorDatabase();
        }

        // Kiểm tra xem có phải cảnh chiến đấu không (nếu được bật)
        if (this.config.hasCombatSystem && this.config.combatParser) {
            this.handleCombatDetection(data);
        } else {
            // Hiển thị tin nhắn bình thường (truyền trường img để NovelAI tạo ảnh)
            console.log('[Phản hồi AI] 🖼️ Trường img:', data.img ? data.img.substring(0, 50) + '...' : 'Không có');
            displayAIMessage(data.story, data.options, data.reasoning, data.img);
            
            // Lưu lịch sử trò chơi vào IndexedDB
            saveGameHistory().catch(err => console.error('Lưu lịch sử thất bại:', err));
        }

        // Xóa sạch bản ghi thao tác cục bộ
        if (this.gameState && this.gameState.localOps) {
            this.gameState.localOps = { items: [], attrs: [], equip: [] };
        }
    }
    
    /**
     * Xử lý logic phát hiện chiến đấu
     * @param {Object} data - Dữ liệu AI sau khi phân tích
     */
    handleCombatDetection(data) {
        const combatInfo = this.config.combatParser(data.story);
        if (combatInfo) {
            // Lưu trữ thông tin chiến đấu vào biến toàn cục để sử dụng khi người dùng lựa chọn
            window.pendingCombatInfo = combatInfo;
            console.log('⚔️ Phát hiện thông tin chiến đấu, đã lưu trữ:', combatInfo);
        } else {
            // Xóa thông tin chiến đấu đang chờ xử lý
            window.pendingCombatInfo = null;
        }
        
        // Hiển thị tin nhắn bình thường (bao gồm các lựa chọn chiến đấu, truyền trường img để NovelAI tạo ảnh)
        console.log('[Phản hồi AI - Nhánh chiến đấu] 🖼️ Trường img:', data.img ? data.img.substring(0, 50) + '...' : 'Không có');
        displayAIMessage(data.story, data.options, data.reasoning, data.img);
        
        // Lưu lịch sử trò chơi
        saveGameHistory().catch(err => console.error('Lưu lịch sử thất bại:', err));
    }
    
    /**
     * Thêm hội thoại vào cơ sở dữ liệu vector
     */
    async addToVectorDatabase() {
        const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;
        
        if (enableVectorRetrieval && window.contextVectorManager && this.gameState.conversationHistory.length >= 2) {
            const turnIndex = Math.floor(this.gameState.conversationHistory.length / 2);
            const userMessage = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 2].content;
            const aiResponse = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 1].content;
            
            try {
                // Thêm vào thư viện vector bất đồng bộ (không chặn luồng trò chơi)
                await window.contextVectorManager.addConversation(
                    userMessage,
                    aiResponse,
                    turnIndex,
                    this.gameState.variables
                );
                
                // 🆕 Trích xuất và thêm history vào ma trận (matrix)
                const lastMessage = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 1];
                if (lastMessage && lastMessage.parsed && lastMessage.parsed.variableUpdate) {
                    // Trích xuất history từ variableUpdate
                    await this.extractAndAddHistoryToMatrix(lastMessage.parsed.variableUpdate, turnIndex);
                }
                
                // Lưu thư viện vector vào IndexedDB
                await window.contextVectorManager.saveToIndexedDB();
            } catch (err) {
                console.error('❌ Thêm vào thư viện vector thất bại:', err);
                console.error('Chi tiết lỗi:', err.stack);
                
                // Tự động quay lại phương pháp từ khóa
                this.handleVectorError(err);
            }
        }
    }
    
    /**
     * Trích xuất và thêm history vào ma trận
     * @param {string} variableUpdate - Chuỗi variableUpdate
     * @param {number} turnIndex - Chỉ số lượt hội thoại
     */
    async extractAndAddHistoryToMatrix(variableUpdate, turnIndex) {
        if (!window.contextVectorManager || !window.matrixManager) {
            return;
        }
        
        try {
            // Trích xuất history từ variableUpdate
            const historyItems = [];
            
            // Khớp định dạng >>history: văn bản
            const singleHistoryRegex = />>history:\s*(.+)/g;
            let match;
            while ((match = singleHistoryRegex.exec(variableUpdate)) !== null) {
                historyItems.push(match[1].trim());
            }
            
            // Khớp định dạng history:\n  - văn bản
            const multiHistoryRegex = /history:\s*\n\s*-\s*(.+)/g;
            while ((match = multiHistoryRegex.exec(variableUpdate)) !== null) {
                historyItems.push(match[1].trim());
            }
            
            if (historyItems.length === 0) {
                console.log('[Ma trận History] Lượt này không tìm thấy trường history');
                return;
            }
            
            console.log(`[Ma trận History] 📥 Trích xuất được ${historyItems.length} mục history`);
            
            // Thêm vào ma trận
            for (const historyText of historyItems) {
                await window.contextVectorManager.addHistoryEntry(
                    historyText,
                    turnIndex,
                    this.gameState.variables
                );
            }
            
            console.log(`[Ma trận History] ✅ Đã thêm ${historyItems.length} mục history vào ma trận`);
        } catch (error) {
            console.error('[Ma trận History] ❌ Thêm thất bại:', error);
        }
    }
    
    /**
     * Xử lý lỗi vector hóa
     * @param {Error} err - Đối tượng lỗi
     */
    handleVectorError(err) {
        const currentMethod = window.contextVectorManager.embeddingMethod;
        if (currentMethod !== 'keyword') {
            console.warn(`[Thư viện Vector] Phương pháp ${currentMethod} thất bại, tự động chuyển sang phương pháp từ khóa`);
            window.contextVectorManager.setEmbeddingMethod('keyword');
            document.getElementById('vectorMethod').value = 'keyword';
            
            // Thông báo cho người dùng
            setTimeout(() => {
                alert(`⚠️ Vector hóa thất bại\n\nPhương pháp ${currentMethod} xuất hiện lỗi, đã tự động chuyển sang phương pháp "Khớp từ khóa"\n\nLỗi: ${err.message}\n\nTrò chơi sẽ tiếp tục bình thường, không ảnh hưởng đến việc sử dụng.`);
            }, 1000);
        }
    }
    
    /**
     * Xuất log chế độ debug
     * @param {string} role - Vai trò
     * @param {string} content - Nội dung
     */
    appendDebug(role, content) {
        if (typeof appendDebug === 'function') {
            appendDebug(role, content);
        } else {
            console.log(`[Chế độ Debug] ${role}:`, content);
        }
    }
    
    /**
     * Áp dụng cập nhật biến lũy tiến
     * @param {Object} variableChanges - Đối tượng thay đổi biến
     */
    applyVariableChanges(variableChanges) {
        if (!variableChanges) {
            console.warn('[Cập nhật biến] Không có dữ liệu thay đổi biến');
            return this.gameState.variables;
        }

        const { analysis, changes = {}, arrayChanges, newFields = [], removedFields = [] } = variableChanges;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Cập nhật biến] Bắt đầu áp dụng cập nhật lũy tiến');
        if (analysis) {
            console.log('[Cập nhật biến] Phân tích:', analysis);
        }
        if (Object.keys(changes).length > 0) {
            console.log('[Cập nhật biến] Các trường thay đổi:', Object.keys(changes));
        }
        if (arrayChanges) {
            console.log('[Cập nhật biến] Cập nhật mảng lũy tiến:', Object.keys(arrayChanges));
        }
        if (newFields.length > 0) {
            console.log('[Cập nhật biến] Các trường mới thêm:', newFields);
        }
        if (removedFields.length > 0) {
            console.log('[Cập nhật biến] Các trường bị xóa:', removedFields);
        }

        // Lưu trạng thái biến trước đó để tính toán sự thay đổi
        this.gameState.previousVariables = JSON.parse(JSON.stringify(this.gameState.variables));

        // 1. Xử lý thay đổi các trường thông thường
        for (const [key, value] of Object.entries(changes)) {
            this.applyFieldChange(key, value);
        }

        // 2. Xử lý cập nhật lũy tiến cho các trường mảng (tính năng mới)
        if (arrayChanges) {
            this.applyArrayChanges(arrayChanges);
        }

        // 3. Xóa các trường được đánh dấu loại bỏ
        removedFields.forEach(field => {
            if (this.gameState.variables.hasOwnProperty(field)) {
                delete this.gameState.variables[field];
                console.log(`[Cập nhật biến] ❌ Xóa trường: ${field}`);
            }
        });

        console.log('[Cập nhật biến] ✅ Cập nhật lũy tiến hoàn tất');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return this.gameState.variables;
    }
    
    /**
     * Áp dụng cập nhật lũy tiến cho các trường mảng (chế độ add/remove/update)
     * @param {Object} arrayChanges - Đối tượng cập nhật mảng lũy tiến
     */
    applyArrayChanges(arrayChanges) {
        for (const [arrayName, operations] of Object.entries(arrayChanges)) {
            if (!this.gameState.variables[arrayName]) {
                this.gameState.variables[arrayName] = [];
            }

            const array = this.gameState.variables[arrayName];
            const emoji = {
                'items': '🎒',
                'relationships': '👥',
                'techniques': '📖',
                'spells': '✨'
            }[arrayName] || '📝';

            console.log(`[Cập nhật mảng] ${emoji} Đang xử lý ${arrayName}:`);

            // Kiểm tra xem có phải định dạng mảng trực tiếp không (định dạng AI trả về)
            if (Array.isArray(operations)) {
                console.log(`  📋 Phát hiện định dạng mảng trực tiếp, xử lý ${operations.length} mục`);
                operations.forEach(item => {
                    // 【Sửa lỗi quan trọng】Kiểm tra phần tử đã tồn tại chưa
                    const existingIndex = array.findIndex(el => el.name === item.name);
                    
                    if (existingIndex !== -1) {
                        // Đã tồn tại: Sử dụng updateInArray để hợp nhất sâu chính xác (giữ lại các trường lồng nhau không cập nhật như bodyParts.description)
                        console.log(`  🔍 Phát hiện ${item.name} đã tồn tại, sử dụng hợp nhất sâu để cập nhật`);
                        this.updateInArray(array, item, arrayName);
                    } else {
                        // Không tồn tại: Sử dụng addToArray để thêm phần tử mới
                        this.addToArray(array, item, arrayName);
                    }
                });
            } else {
                // Định dạng thao tác tiêu chuẩn { add: [...], remove: [...], update: [...] }
                // 1. Xử lý thao tác xóa
                if (operations.remove && operations.remove.length > 0) {
                    operations.remove.forEach(item => {
                        this.removeFromArray(array, item, arrayName);
                    });
                }

                // 2. Xử lý thao tác thêm mới
                if (operations.add && operations.add.length > 0) {
                    operations.add.forEach(item => {
                        this.addToArray(array, item, arrayName);
                    });
                }

                // 3. Xử lý thao tác cập nhật
                if (operations.update && operations.update.length > 0) {
                    operations.update.forEach(item => {
                        this.updateInArray(array, item, arrayName);
                    });
                }
            }
        }
    }
    
    /**
     * Xóa phần tử khỏi mảng hoặc giảm số lượng
     * @param {Array} array - Mảng đích
     * @param {Object} item - Phần tử cần xóa
     * @param {string} arrayName - Tên mảng
     */
    removeFromArray(array, item, arrayName) {
        const index = array.findIndex(el => el.name === item.name);

        if (index === -1) {
            console.warn(`  ⚠️ Thử xóa ${arrayName} không tồn tại: ${item.name}`);
            return;
        }

        // Nếu là items và có chỉ định số lượng (count), thì giảm số lượng
        if (arrayName === 'items' && item.count !== undefined) {
            const oldCount = array[index].count;
            array[index].count -= item.count;
            console.log(`  ➖ ${item.name}: Số lượng -${item.count} (${oldCount} → ${array[index].count})`);

            // Nếu số lượng <= 0, xóa hoàn toàn
            if (array[index].count <= 0) {
                array.splice(index, 1);
                console.log(`  ❌ ${item.name}: Số lượng về 0, đã xóa khỏi danh sách vật phẩm`);
            }
        } else {
            // Xóa hoàn toàn
            array.splice(index, 1);
            console.log(`  ❌ Xóa ${item.name}`);
        }
    }
    
    /**
     * Thêm phần tử vào mảng hoặc tăng số lượng
     * @param {Array} array - Mảng đích
     * @param {Object} item - Phần tử cần thêm
     * @param {string} arrayName - Tên mảng
     */
    addToArray(array, item, arrayName) {
        const existingIndex = array.findIndex(el => el.name === item.name);

        // Nếu là items và đã tồn tại, thì tăng số lượng
        if (arrayName === 'items' && existingIndex !== -1) {
            const oldCount = array[existingIndex].count;
            array[existingIndex].count += item.count;
            console.log(`  ➕ ${item.name}: Số lượng +${item.count} (${oldCount} → ${array[existingIndex].count})`);

            // Cập nhật các trường khác (sử dụng hợp nhất sâu để giữ dữ liệu lồng nhau)
            this.deepMerge(array[existingIndex], item);
        } else if (existingIndex !== -1) {
            // 【Sửa lỗi quan trọng】Đối với các mảng như relationships, nếu đã tồn tại thì không nên xử lý ở đây
            // Phía gọi hàm nên phán đoán và gọi trực tiếp updateInArray
            console.warn(`  ⚠️ addToArray được dùng để cập nhật ${arrayName} đã tồn tại: ${item.name}, điều này có thể dẫn đến mất dữ liệu!`);
            console.warn(`  ⚠️ Khuyên phía gọi hàm nên kiểm tra xem phần tử tồn tại chưa, nếu đã có thì nên gọi updateInArray`);
            
            // Để tương thích, vẫn thực hiện hợp nhất sâu nhưng sẽ xuất cảnh báo
            const oldItem = array[existingIndex];
            this.deepMerge(oldItem, item);
            console.log(`  🔄 Cập nhật ${item.name} (hợp nhất sâu, nhưng có thể không đầy đủ)`);
        } else {
            // Nếu không tồn tại thì thêm mới
            array.push(item);
            const extra = arrayName === 'items' ? ` (Số lượng: ${item.count})` : '';
            console.log(`  ✅ Thêm mới ${item.name}${extra}`);
        }
    }
    
    /**
     * Cập nhật phần tử đã tồn tại trong mảng
     * @param {Array} array - Mảng đích
     * @param {Object} item - Phần tử cần cập nhật (chứa name và các trường cần cập nhật)
     * @param {string} arrayName - Tên mảng
     */
    updateInArray(array, item, arrayName) {
        const existingIndex = array.findIndex(el => el.name === item.name);

        if (existingIndex === -1) {
            console.warn(`  ⚠️ Thử cập nhật ${arrayName} không tồn tại: ${item.name}`);
            return;
        }

        // Ghi lại giá trị cũ
        const oldValues = {};
        const updatedFields = Object.keys(item).filter(k => k !== 'name');
        updatedFields.forEach(field => {
            oldValues[field] = array[existingIndex][field];
        });

        // Xử lý đặc biệt 1: Trường history của mảng relationships cần nối thêm chứ không phải ghi đè
        if (arrayName === 'relationships' && item.history) {
            const existingHistory = array[existingIndex].history || [];
            const newHistory = item.history || [];
            
            // Hợp nhất loại bỏ trùng lặp: Chỉ thêm các bản ghi lịch sử không bị lặp
            const mergedHistory = [...existingHistory];
            let addedCount = 0;
            
            newHistory.forEach(newItem => {
                // Kiểm tra xem đã tồn tại nội dung giống hệt chưa (so sánh sau khi xóa khoảng trắng đầu cuối)
                const trimmedNew = newItem.trim();
                const isDuplicate = mergedHistory.some(existing => existing.trim() === trimmedNew);
                
                if (!isDuplicate && trimmedNew) {
                    mergedHistory.push(newItem);
                    addedCount++;
                }
            });
            
            // Cập nhật trường history thành mảng đã hợp nhất
            item.history = mergedHistory;
            
            if (addedCount > 0) {
                console.log(`    - history: Đã nối thêm ${addedCount} bản ghi mới (Tổng cộng: ${mergedHistory.length} mục)`);
            }
        }

        // Xử lý đặc biệt 2: Trường bodyParts của mảng relationships cần hợp nhất sâu, giữ lại description
        if (arrayName === 'relationships' && item.bodyParts) {
            const existingBodyParts = array[existingIndex].bodyParts || {};
            const newBodyParts = item.bodyParts;
            
            // Thực hiện hợp nhất sâu cho từng bộ phận cơ thể
            ['vagina', 'breasts', 'mouth', 'hands', 'feet'].forEach(partName => {
                if (newBodyParts[partName]) {
                    if (existingBodyParts[partName]) {
                        // Đã tồn tại bộ phận này: Hợp nhất cập nhật, giữ lại description (nếu dữ liệu mới không cung cấp)
                        if (!newBodyParts[partName].description && existingBodyParts[partName].description) {
                            console.log(`    - bodyParts.${partName}: Giữ description cũ, cập nhật useCount`);
                            newBodyParts[partName].description = existingBodyParts[partName].description;
                        }
                    }
                }
            });
        }

        // Sử dụng hợp nhất sâu để cập nhật các trường (giữ lại các trường chưa được cập nhật trong đối tượng lồng nhau)
        this.deepMerge(array[existingIndex], item);

        // Xuất log chi tiết
        console.log(`  🔧 Cập nhật ${item.name} (hợp nhất sâu):`);
        updatedFields.forEach(field => {
            if (field === 'history' && arrayName === 'relationships') {
                // Trường history đã được xử lý đặc biệt ở trên, bỏ qua log chi tiết
                return;
            }
            console.log(`    - ${field}: ${JSON.stringify(oldValues[field])} → ${JSON.stringify(item[field])}`);
        });
    }
    
    /**
     * Áp dụng thay đổi cho một trường đơn lẻ
     * @param {string} key - Tên trường
     * @param {any} value - Giá trị mới
     */
    applyFieldChange(key, value) {
        // ========== Xử lý đặc biệt 1: Trường history sử dụng chế độ nối thêm (append) ==========
        if (key === 'history') {
            if (!this.gameState.variables.history) {
                this.gameState.variables.history = [];
            }
            if (Array.isArray(value)) {
                let addedCount = 0;
                value.forEach(newRecord => {
                    const trimmed = newRecord.trim();
                    const isDuplicate = this.gameState.variables.history.some(
                        existing => existing.trim() === trimmed
                    );
                    if (!isDuplicate && trimmed) {
                        this.gameState.variables.history.push(newRecord);
                        addedCount++;
                        console.log(`[Cập nhật biến] 📜 Thêm lịch sử mới: ${newRecord.substring(0, 50)}...`);
                    }
                });
                console.log(`[Cập nhật biến] history: Đã nối thêm ${addedCount} bản ghi mới`);
            }
            return;
        }

        // ========== Xử lý đặc biệt 2: Các trường đối tượng sử dụng chế độ cập nhật từng phần ==========
        if (key === 'attributes' || key === 'equipment') {
            if (!this.gameState.variables[key]) {
                this.gameState.variables[key] = {};
            }
            const changedKeys = Object.keys(value);
            // Sử dụng hợp nhất sâu, giữ lại các trường lồng nhau chưa được cập nhật
            this.deepMerge(this.gameState.variables[key], value);
            console.log(`[Cập nhật biến] 🔧 Cập nhật từng phần ${key}: [${changedKeys.join(', ')}] (hợp nhất sâu)`);

            // Ghi lại chi tiết thay đổi của từng trường con
            changedKeys.forEach(subKey => {
                const oldValue = this.gameState.previousVariables?.[key]?.[subKey];
                const newValue = value[subKey];
                if (oldValue !== undefined) {
                    console.log(`  - ${subKey}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
                } else {
                    console.log(`  - ${subKey}: (Mới thêm) ${JSON.stringify(newValue)}`);
                }
            });
            return;
        }

        // ========== Xử lý đặc biệt 3: Các trường mảng sử dụng chế độ thay thế hoàn toàn (kèm kiểm tra an toàn) ==========
        if (key === 'items' || key === 'relationships' || key === 'techniques' || key === 'spells') {
            const oldCount = this.gameState.variables[key] ? this.gameState.variables[key].length : 0;
            const newCount = Array.isArray(value) ? value.length : 0;

            // Kiểm tra an toàn: Ngăn chặn mất dữ liệu
            if (oldCount > 5 && newCount < oldCount / 2 && newCount > 0) {
                console.warn(`⚠️ Số lượng ${key} giảm bất thường: Từ ${oldCount} mục giảm xuống còn ${newCount} mục, có thể bị mất dữ liệu!`);
                console.warn(`⚠️ Khuyên nên kiểm tra xem mảng ${key} mà AI trả về có đầy đủ không`);
            }

            this.gameState.variables[key] = value;

            const emoji = {
                'items': '🎒',
                'relationships': '👥',
                'techniques': '📖',
                'spells': '✨'
            }[key] || '📝';

            console.log(`[Cập nhật biến] ${emoji} Thay thế hoàn toàn ${key}: ${oldCount} -> ${newCount}`);
            return;
        }

        // ========== Xử lý mặc định: Gán trực tiếp ==========
        const oldValue = this.gameState.variables[key];
        this.gameState.variables[key] = value;
        
        if (oldValue !== undefined) {
            console.log(`[Cập nhật biến] ${key}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(value)}`);
        } else {
            console.log(`[Cập nhật biến] Thêm mới ${key}: ${JSON.stringify(value)}`);
        }
    }
    
    /**
     * Cập nhật biến (phương án cũ, giữ lại để tương thích ngược)
     * @param {Object} newVars - Đối tượng biến mới
     */
    updateVariables(newVars) {
        // Lưu trạng thái biến trước đó để tính toán sự thay đổi
        this.gameState.previousVariables = JSON.parse(JSON.stringify(this.gameState.variables));

        console.log('[Cập nhật biến] Sử dụng phương án cũ (cập nhật toàn bộ)');
        
        // Hợp nhất sâu đối tượng
        function mergeDeep(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }

        mergeDeep(this.gameState.variables, newVars);
        console.log('[Cập nhật biến] ✅ Cập nhật theo phương án cũ hoàn tất');
    }
}

// Xuất ra toàn cục (Global)
window.AIResponseHandler = AIResponseHandler;

console.log('📦 [Module Load] ai-response-handler.js đã được tải');
