/**
 * Module Hàm Hook Sơ đồ nhân vật
 * Chặn và sửa đổi quá trình xây dựng tin nhắn AI để tích hợp sơ đồ nhân vật.
 */

/**
 * Tăng cường trạng thái biến, sử dụng so khớp đồ thị thay thế cho toàn bộ danh sách relationships
 * @param {Object} variables - Trạng thái biến gốc
 * @param {string} userMessage - Tin nhắn nhập từ người dùng
 * @returns {Object} Trạng thái biến đã được tăng cường
 */
async function enhanceVariablesWithCharacterGraph(variables, userMessage) {
    // Kiểm tra xem sơ đồ nhân vật có được bật không
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        console.log('[Hook Sơ đồ] Chưa bật, trả về biến gốc');
        return variables;
    }

    try {
        console.log('[Hook Sơ đồ] Bắt đầu xử lý tăng cường biến...');
        
        // Sao chép biến
        const enhancedVariables = { ...variables };
        
        // 🔍 Trích xuất nhân vật từ relationships vào sơ đồ (nếu có)
        if (variables.relationships && Array.isArray(variables.relationships)) {
            console.log(`[Hook Sơ đồ] Tìm thấy ${variables.relationships.length} nhân vật, đang trích xuất vào sơ đồ...`);
            await window.characterGraphIntegration.extractCharactersFromResponse(variables.relationships);
        }
        
        // 🔍 Tìm kiếm các nhân vật liên quan
        const relevantCharacters = await window.characterGraphIntegration.matchRelevantCharacters(
            userMessage,
            variables
        );
        
        if (relevantCharacters.length > 0) {
            console.log(`[Hook Sơ đồ] ✅ Khớp được ${relevantCharacters.length} nhân vật liên quan`);
            
            // Thay thế relationships bằng các nhân vật đã khớp (loại bỏ trường matchScore)
            enhancedVariables.relationships = relevantCharacters.map(char => {
                const { matchScore, ...cleanChar } = char;
                return cleanChar;
            });
            
            console.log('[Hook Sơ đồ] Đã thay thế relationships bằng kết quả khớp');
        } else {
            console.log('[Hook Sơ đồ] Không khớp nhân vật nào liên quan, làm trống relationships');
            enhancedVariables.relationships = [];
        }
        
        return enhancedVariables;
        
    } catch (error) {
        console.error('[Hook Sơ đồ] Xử lý thất bại:', error);
        return variables; // Trả về biến gốc nếu lỗi
    }
}

/**
 * Xây dựng Prompt ngữ cảnh nhân vật (dùng cho tin nhắn hệ thống)
 * @param {string} userMessage - Tin nhắn người dùng
 * @param {Object} variables - Trạng thái biến
 * @returns {string} Văn bản ngữ cảnh nhân vật
 */
async function buildCharacterContextPrompt(userMessage, variables) {
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return '';
    }

    try {
        // Khớp nhân vật liên quan
        const relevantCharacters = await window.characterGraphIntegration.matchRelevantCharacters(
            userMessage,
            variables
        );
        
        if (relevantCharacters.length === 0) {
            return '';
        }
        
        // Xây dựng ngữ cảnh
        let context = window.characterGraphIntegration.buildCharacterContext(relevantCharacters);
        
        // 📱 Kiểm tra xem có bật liên kết bản ghi chat riêng tư không
        const mobileSettings = window.mobilePhoneSettings || {};
        if (mobileSettings.integrateToMain && typeof getMobileChatHistoryForCharacter === 'function') {
            const chatHistoryLimit = mobileSettings.chatHistoryLimit || 50;
            let privateChatContext = '';
            
            for (const char of relevantCharacters) {
                const charName = char.name;
                const chatHistory = getMobileChatHistoryForCharacter(charName, chatHistoryLimit);
                
                if (chatHistory.length > 0) {
                    console.log(`[Hook Sơ đồ] 📱 Tìm thấy bản ghi chat riêng của ${charName}: ${chatHistory.length} câu`);
                    
                    privateChatContext += `\n\n【Bản ghi chat riêng với ${charName}】\n`;
                    chatHistory.forEach(msg => {
                        const dir = msg.direction === 'outgoing' ? 'Tôi' : msg.sender;
                        privateChatContext += `${dir}: ${msg.content}\n`;
                    });
                }
            }
            
            if (privateChatContext) {
                context += '\n' + privateChatContext;
                console.log('[Hook Sơ đồ] 📱 Đã thêm bản ghi chat riêng vào ngữ cảnh');
            }
        }
        
        return context;
        
    } catch (error) {
        console.error('[Hook Sơ đồ] Xây dựng ngữ cảnh thất bại:', error);
        return '';
    }
}

/**
 * Hook: Chặn xử lý phản hồi AI
 * Gọi sau handleAIResponse để trích xuất nhân vật vào sơ đồ
 */
async function hookHandleAIResponse(parsedResponse, gameState) {
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return;
    }

    try {
        // Trích xuất relationships vào sơ đồ
        if (parsedResponse.variables && parsedResponse.variables.relationships) {
            console.log('[Hook Sơ đồ] Trích xuất nhân vật từ phản hồi AI vào sơ đồ...');
            await window.characterGraphIntegration.extractCharactersFromResponse(
                parsedResponse.variables.relationships
            );
        }

        // Nếu sử dụng định dạng v3.1, cần đợi biến cập nhật xong mới trích xuất
        if (parsedResponse.variableUpdate && gameState.variables.relationships) {
            console.log('[Hook Sơ đồ] Trích xuất nhân vật từ biến sau khi cập nhật v3.1...');
            await window.characterGraphIntegration.extractCharactersFromResponse(
                gameState.variables.relationships
            );
        }

    } catch (error) {
        console.error('[Hook Sơ đồ] Xử lý phản hồi AI thất bại:', error);
    }
}

/**
 * Sửa đổi hàm buildAIMessages gốc để tích hợp sơ đồ nhân vật
 */
async function buildAIMessagesWithCharacterGraph(originalBuildFunction, userMessage, originalUserInput = null) {
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return await originalBuildFunction(userMessage, originalUserInput);
    }

    console.log('[Hook Sơ đồ] 🔧 Chặn buildAIMessages để tích hợp sơ đồ nhân vật');

    const messages = await originalBuildFunction(userMessage, originalUserInput);

    try {
        // 🔍 Tìm tin nhắn trạng thái biến và tăng cường nó
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            // Tìm tin nhắn hệ thống chứa "当前角色变量状态" (Trạng thái biến nhân vật hiện tại)
            if (msg.role === 'system' && msg.content.includes('当前角色变量状态')) {
                console.log('[Hook Sơ đồ] Tìm thấy tin nhắn trạng thái biến, chuẩn bị tăng cường...');
                
                const jsonMatch = msg.content.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    const originalVariables = JSON.parse(jsonMatch[1]);
                    
                    const enhancedVariables = await enhanceVariablesWithCharacterGraph(
                        originalVariables,
                        originalUserInput || userMessage
                    );
                    
                    // Thay thế nội dung tin nhắn
                    messages[i].content = 'Trạng thái biến nhân vật hiện tại:\n```json\n' + 
                        JSON.stringify(enhancedVariables, null, 2) + '\n```';
                    
                    console.log('[Hook Sơ đồ] ✅ Trạng thái biến đã được tăng cường');
                }
                break;
            }
        }

        // 🔍 Tùy chọn: Thêm Prompt ngữ cảnh nhân vật
        const characterContext = await buildCharacterContextPrompt(
            originalUserInput || userMessage,
            window.gameState?.variables
        );
        
        if (characterContext) {
            const insertIndex = messages.findIndex(
                m => m.role === 'system' && m.content.includes('Trạng thái biến nhân vật hiện tại')
            );
            
            if (insertIndex >= 0) {
                messages.splice(insertIndex + 1, 0, {
                    role: 'system',
                    content: characterContext
                });
                console.log('[Hook Sơ đồ] ✅ Đã thêm prompt ngữ cảnh nhân vật');
            }
        }

    } catch (error) {
        console.error('[Hook Sơ đồ] Tăng cường tin nhắn thất bại:', error);
    }

    return messages;
}

/**
 * Khởi tạo hệ thống Hook
 * Bao bọc các hàm buildAIMessages và handleAIResponse gốc
 */
function initializeCharacterGraphHooks() {
    if (typeof window.buildAIMessages === 'function' && !window._originalBuildAIMessages) {
        console.log('[Hook Sơ đồ] 💉 Đang tiêm hook vào buildAIMessages');
        
        window._originalBuildAIMessages = window.buildAIMessages;
        
        window.buildAIMessages = async function(userMessage, originalUserInput = null) {
            return await buildAIMessagesWithCharacterGraph(
                window._originalBuildAIMessages,
                userMessage,
                originalUserInput
            );
        };
        
        console.log('[Hook Sơ đồ] ✅ Hook buildAIMessages đã được tiêm');
    }
}

// Tự động khởi tạo (trễ 1 giây để đảm bảo các script khác đã tải xong)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('[Hook Sơ đồ] Bắt đầu tự động khởi tạo...');
            initializeCharacterGraphHooks();
        }, 1000);
    });
}

/**
 * Hàm xóa quan hệ nhân sự (đồng thời xóa trong sơ đồ nhân vật)
 * @param {number} relIndex - Chỉ số của quan hệ trong mảng
 */
function deleteRelationshipWithGraph(relIndex) {
    if (!window.gameState || !window.gameState.variables || !window.gameState.variables.relationships) {
        console.warn('[Hook Sơ đồ] Trạng thái game không tồn tại, không thể xóa quan hệ');
        alert('Trạng thái game không tồn tại, không thể xóa');
        return;
    }

    const relationship = window.gameState.variables.relationships[relIndex];
    if (!relationship) {
        alert('Quan hệ này không tồn tại');
        return;
    }

    // Xác nhận xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa quan hệ với "${relationship.name}" không?\n\nQuan hệ: ${relationship.relation}\nHảo cảm: ${relationship.favor}`)) {
        return;
    }

    const characterName = relationship.name;

    // Xóa khỏi mảng
    window.gameState.variables.relationships.splice(relIndex, 1);

    // Đồng thời xóa sơ đồ nhân vật tương ứng
    if (window.characterGraphManager && characterName) {
        window.characterGraphManager.deleteCharacter(characterName)
            .then(() => {
                console.log(`[Hook Sơ đồ] Đã đồng bộ xóa sơ đồ nhân vật: ${characterName}`);
            })
            .catch(err => {
                console.warn(`[Hook Sơ đồ] Xóa sơ đồ nhân vật thất bại: ${characterName}`, err);
            });
    }

    // Cập nhật giao diện
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // Lưu trạng thái game
    if (typeof saveGameHistory === 'function') {
        saveGameHistory().catch(err => console.error('Lưu thất bại:', err));
    }

    alert(` Đã xóa quan hệ với "${characterName}"!`);
}

// Xuất các hàm để gọi thủ công
if (typeof window !== 'undefined') {
    window.initializeCharacterGraphHooks = initializeCharacterGraphHooks;
    window.hookHandleAIResponse = hookHandleAIResponse;
    window.deleteRelationship = deleteRelationshipWithGraph; 
    console.log('[Hook Sơ đồ] Module đã được tải');
}