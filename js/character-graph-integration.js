/**
 * Module Tích hợp Sơ đồ Nhân vật
 * * Chức năng:
 * 1. Chặn phản hồi từ AI, tự động trích xuất 'relationships' (quan hệ) vào sơ đồ nhân vật.
 * 2. Thay đổi cách xây dựng ngữ cảnh, sử dụng so khớp vector thay vì bao gồm toàn bộ danh sách quan hệ.
 * 3. Truy xuất thông minh các nhân vật liên quan dựa trên nội dung đối thoại hiện tại.
 */

class CharacterGraphIntegration {
    constructor() {
        this.isEnabled = false;
        this.config = {
            autoExtract: true, // Tự động trích xuất nhân vật từ phản hồi AI vào sơ đồ
            autoMatch: true, // Tự động khớp nhân vật liên quan vào ngữ cảnh
            contextMaxCharacters: 3, // Số lượng nhân vật tối đa hiển thị trong ngữ cảnh
            matchThreshold: 0.4, // Ngưỡng khớp (Vector 384 chiều: 40%)
            enableDebug: true // Bật nhật ký gỡ lỗi (debug log)
        };
    }

    /**
     * Khởi tạo tích hợp
     */
    async init() {
        // 🔧 Đợi trình quản lý sơ đồ nhân vật sẵn sàng (đợi tối đa 5 giây)
        let retryCount = 0;
        const maxRetries = 50; // 5 giây, kiểm tra mỗi 100ms
        
        while (!window.characterGraphManager && retryCount < maxRetries) {
            console.log(`[Tích hợp sơ đồ] ⏳ Đang đợi CharacterGraphManager tải... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }

        if (!window.characterGraphManager) {
            console.error('[Tích hợp sơ đồ] ❌ Không tìm thấy CharacterGraphManager, quá thời gian chờ');
            return false;
        }

        // Đảm bảo trình quản lý đã được khởi tạo
        if (!window.characterGraphManager.isInitialized) {
            console.log('[Tích hợp sơ đồ] 🔄 Đang khởi tạo CharacterGraphManager...');
            await window.characterGraphManager.init();
        }
        
        // Tải cấu hình từ localStorage
        const saved = localStorage.getItem('characterGraphIntegrationConfig');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }

        this.isEnabled = true;
        console.log('[Tích hợp sơ đồ] ✅ Khởi tạo hoàn tất');
        return true;
    }

    /**
     * Lưu cấu hình
     */
    saveConfig() {
        localStorage.setItem('characterGraphIntegrationConfig', JSON.stringify(this.config));
        console.log('[Tích hợp sơ đồ] Cấu hình đã được lưu');
    }

    /**
     * Trích xuất nhân vật từ phản hồi AI vào sơ đồ
     * @param {Array} relationships - Mảng các mối quan hệ do AI trả về
     */
    async extractCharactersFromResponse(relationships) {
        if (!this.isEnabled || !this.config.autoExtract) {
            return;
        }

        if (!Array.isArray(relationships) || relationships.length === 0) {
            return;
        }

        console.log(`[Tích hợp sơ đồ] 📥 Đang trích xuất ${relationships.length} nhân vật vào sơ đồ...`);

        const results = [];
        for (const rel of relationships) {
            try {
                const result = await window.characterGraphManager.addOrUpdateCharacter(rel);
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`[Tích hợp sơ đồ] Trích xuất thất bại: ${rel.name}`, error);
            }
        }

        console.log(`[Tích hợp sơ đồ] ✅ Đã trích xuất thành công ${results.length} nhân vật`);
        return results;
    }

    /**
     * Khớp các nhân vật liên quan dựa trên tin nhắn người dùng và ngữ cảnh hiện tại
     * 🆕 Sử dụng trực tiếp so khớp vector, không cần dùng Regex để trích xuất tên
     * @param {string} userMessage - Tin nhắn nhập vào của người dùng
     * @param {Object} currentVariables - Trạng thái biến hiện tại
     * @returns {Array} Danh sách nhân vật khớp (bao gồm dữ liệu quan hệ đầy đủ)
     */
    async matchRelevantCharacters(userMessage, currentVariables) {
        if (!this.isEnabled || !this.config.autoMatch) {
            return [];
        }

        console.log('[Tích hợp sơ đồ] 🔍 Bắt đầu khớp nhân vật liên quan...');

        // 🆕 Nếu 'supply' được cấu hình bao gồm phản hồi AI, tăng cường truy vấn
        let enhancedMessage = userMessage;
        if (window.contextVectorManager && window.contextVectorManager.includeRecentAIRepliesInQuery > 0) {
            const conversationHistory = window.gameState?.conversationHistory || [];
            if (conversationHistory.length > 0) {
                const recentAIReplies = conversationHistory
                    .filter(msg => msg.role === 'assistant')
                    .slice(-window.contextVectorManager.includeRecentAIRepliesInQuery)
                    .map(msg => msg.content);
                
                if (recentAIReplies.length > 0) {
                    enhancedMessage = userMessage + '\n' + recentAIReplies.join('\n') + '\n' + userMessage + '\n' + userMessage;
                    console.log(`[Tích hợp sơ đồ] ✅ Đã bao gồm ${recentAIReplies.length} phản hồi AI gần nhất để so khớp`);
                }
            }
        }

        // 🆕 Sử dụng trực tiếp so khớp vector
        // Hệ thống vector của supply.js sẽ tự động xử lý tách từ tiếng Trung và trích xuất từ khóa
        try {
            const matches = await window.characterGraphManager.searchByText(enhancedMessage, userMessage);

            if (this.config.enableDebug) {
                console.log(`[Tích hợp sơ đồ] ✅ Đã khớp được ${matches.length} nhân vật liên quan:`);
                matches.forEach((char, i) => {
                    const sourceInfo = char.matchSource ? ` [Nguồn: ${char.matchSource}]` : '';
                    console.log(`  ${i + 1}. ${char.name} (Điểm: ${(char.matchScore * 100).toFixed(1)}%)${sourceInfo}`);
                    if (char.history && char.history.length > 0) {
                        console.log(`     Lịch sử: ${char.history.length} bản ghi`);
                    }
                });
            }

            return matches;
        } catch (error) {
            console.error('[Tích hợp sơ đồ] So khớp thất bại:', error);
            return [];
        }
    }

    /**
     * Trích xuất tên người từ tin nhắn (Hàm phụ trợ)
     */
    extractNamesFromMessage(message) {
        const names = [];
        
        // 🔍 So khớp mẫu tên người Trung Quốc đơn giản
        // Khớp các cách gọi phổ biến: XXX, X sư tỷ, X trưởng lão...
        const patterns = [
            /([一-龥]{2,4})(师姐|师兄|师妹|师弟|长老|掌门|宗主|道友)/g,
            /([一-龥]{2,4})/g  // Tên từ 2-4 chữ Hán
        ];

        for (const pattern of patterns) {
            const matches = message.matchAll(pattern);
            for (const match of matches) {
                const name = match[1];
                if (name && name.length >= 2) {
                    names.push(name);
                }
            }
        }

        // Loại bỏ trùng lặp
        return [...new Set(names)];
    }

    /**
     * Trích xuất manh mối từ ngữ cảnh
     */
    extractContextClues(message, variables) {
        const clues = [];

        // Suy luận từ vị trí hiện tại
        const location = variables?.location || '';
        if (location) {
            // Ví dụ: "Luyện Đan Phòng" -> Có thể cần NPC liên quan đến "Luyện Đan Sư"
        }

        // Suy luận từ từ khóa trong tin nhắn
        const keywords = {
            'Luyện Đan': ['Luyện đan', 'Đan dược'],
            'Luyện Khí': ['Luyện khí', 'Pháp bảo'],
            'Tỉ Võ': ['Tỉ võ', 'So tài', 'Chiến đấu'],
            'Song Tu': ['Song tu', 'Âm dương', 'Phòng sự']
        };

        for (const [category, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (message.includes(word)) {
                    clues.push(category);
                    break;
                }
            }
        }

        return clues;
    }

    /**
     * Xây dựng ngữ cảnh nhân vật (Dùng cho AI Prompt)
     * @param {Array} characters - Danh sách nhân vật khớp
     * @returns {string} Thông tin nhân vật đã định dạng
     */
    buildCharacterContext(characters) {
        if (!characters || characters.length === 0) {
            return '';
        }

        let context = '\n\n【Thông tin nhân vật liên quan】(Đã khớp qua sơ đồ vector)\n';
        
        characters.forEach((char, index) => {
            context += `\n${index + 1}. ${char.name}`;
            
            if (char.relation || char.relationship) {
                context += ` (${char.relation || char.relationship})`;
            }
            
            if (char.favor !== undefined) {
                context += ` [Hảo cảm: ${char.favor}]`;
            }

            if (char.realm) {
                context += `\n   Cảnh giới: ${char.realm}`;
            }

            if (char.age) {
                context += ` | Tuổi: ${char.age}`;
            }

            if (char.personality) {
                context += `\n   Tính cách: ${char.personality}`;
            }

            if (char.appearance) {
                context += `\n   Ngoại hình: ${char.appearance}`;
            }

            if (char.opinion) {
                context += `\n   Nhận xét: ${char.opinion}`;
            }

            // Tương tác lịch sử (chỉ hiển thị 3 bản ghi gần nhất)
            if (char.history && Array.isArray(char.history) && char.history.length > 0) {
                const recentHistory = char.history.slice(-3);
                context += `\n   Ghi chép tương tác:`;
                recentHistory.forEach(h => {
                    context += `\n     • ${h}`;
                });
            }

            context += `\n   Độ khớp: ${(char.matchScore * 100).toFixed(1)}%`;
            context += '\n';
        });

        return context;
    }

    /**
     * Hook: Chặn và xử lý phản hồi AI
     * Tự động trích xuất nhân vật vào sơ đồ sau khi AI phản hồi
     */
    async hookAIResponse(aiResponse, gameState) {
        if (!this.isEnabled) {
            return;
        }

        try {
            // Trích xuất quan hệ vào sơ đồ
            if (aiResponse.variables && aiResponse.variables.relationships) {
                await this.extractCharactersFromResponse(aiResponse.variables.relationships);
                
                // 🔧 Tùy chọn: Loại bỏ 'relationships' khỏi biểu mẫu biến, chuyển sang sơ đồ quản lý
                // delete aiResponse.variables.relationships;
            }

            // Xử lý nếu sử dụng định dạng v3.1
            if (aiResponse.variableUpdate) {
                console.log('[Tích hợp sơ đồ] Phát hiện định dạng v3.1, hiện chưa xử lý');
            }

        } catch (error) {
            console.error('[Tích hợp sơ đồ] Lỗi xử lý Hook:', error);
        }
    }

    /**
     * Xây dựng ngữ cảnh tăng cường (thay thế cho danh sách quan hệ cũ)
     */
    async buildEnhancedContext(userMessage, variables, conversationHistory) {
        if (!this.isEnabled) {
            return '';
        }

        try {
            const relevantCharacters = await this.matchRelevantCharacters(userMessage, variables);
            const characterContext = this.buildCharacterContext(relevantCharacters);
            return characterContext;
        } catch (error) {
            console.error('[Tích hợp sơ đồ] Lỗi xây dựng ngữ cảnh:', error);
            return '';
        }
    }

    /**
     * Di chuyển dữ liệu 'relationships' hiện có vào sơ đồ
     * @param {Object} gameState - Trạng thái trò chơi
     */
    async migrateExistingRelationships(gameState) {
        if (!gameState || !gameState.variables || !gameState.variables.relationships) {
            console.log('[Tích hợp sơ đồ] Không có quan hệ nào cần di chuyển');
            return;
        }

        if (!window.characterGraphManager) {
            console.error('[Tích hợp sơ đồ] Trình quản lý sơ đồ chưa được khởi tạo');
            throw new Error('Trình quản lý sơ đồ chưa khởi tạo, vui lòng tải lại trang');
        }

        if (typeof window.characterGraphManager.batchAddCharacters !== 'function') {
            console.error('[Tích hợp sơ đồ] Thiếu phương thức batchAddCharacters');
            throw new Error('Phương thức quản lý sơ đồ bị thiếu, vui lòng tải lại trang');
        }

        const relationships = gameState.variables.relationships;
        console.log(`[Tích hợp sơ đồ] Bắt đầu di chuyển ${relationships.length} nhân vật hiện có...`);

        try {
            await window.characterGraphManager.batchAddCharacters(relationships);
            console.log('[Tích hợp sơ đồ] Di chuyển hoàn tất');
        } catch (error) {
            console.error('[Tích hợp sơ đồ] Lỗi trong quá trình di chuyển:', error);
            throw error;
        }
    }

    /**
     * Lấy cấu hình
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Cập nhật cấu hình
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
        
        // Đồng bộ tới trình quản lý sơ đồ nhân vật
        if (window.characterGraphManager) {
            window.characterGraphManager.updateConfig({
                matchThreshold: this.config.matchThreshold,
                maxResults: this.config.contextMaxCharacters
            });
        }
        
        console.log('[Tích hợp sơ đồ] Cấu hình đã cập nhật:', this.config);
    }

    /**
     * Bật/Tắt tích hợp
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`[Tích hợp sơ đồ] ${enabled ? '✅ Đã bật' : '❌ Đã tắt'}`);
    }
}

// Tạo instance toàn cục
if (typeof window !== 'undefined') {
    window.characterGraphIntegration = new CharacterGraphIntegration();
    console.log('[Tích hợp sơ đồ] Instance toàn cục đã được tạo: window.characterGraphIntegration');
}