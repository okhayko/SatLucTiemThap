/**
 * 人物图谱钩子函数
 * 拦截并修改AI消息构建过程，集成人物图谱
 */

/**
 * 增强变量状态，使用图谱匹配替代完整relationships
 * @param {Object} variables - 原始变量状态
 * @param {string} userMessage - 用户输入消息
 * @returns {Object} 增强后的变量状态
 */
async function enhanceVariablesWithCharacterGraph(variables, userMessage) {
    // 检查是否启用人物图谱
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        console.log('[人物图谱钩子] 未启用，返回原始变量');
        return variables;
    }

    try {
        console.log('[人物图谱钩子] 开始处理变量增强...');
        
        // 复制变量
        const enhancedVariables = { ...variables };
        
        // 🔍 从relationships提取人物到图谱（如果有的话）
        if (variables.relationships && Array.isArray(variables.relationships)) {
            console.log(`[人物图谱钩子] 发现 ${variables.relationships.length} 个人物，提取到图谱...`);
            await window.characterGraphIntegration.extractCharactersFromResponse(variables.relationships);
        }
        
        // 🔍 匹配相关人物
        const relevantCharacters = await window.characterGraphIntegration.matchRelevantCharacters(
            userMessage,
            variables
        );
        
        if (relevantCharacters.length > 0) {
            console.log(`[人物图谱钩子] ✅ 匹配到 ${relevantCharacters.length} 个相关人物`);
            
            // 替换relationships为匹配的人物（移除matchScore字段）
            enhancedVariables.relationships = relevantCharacters.map(char => {
                const { matchScore, ...cleanChar } = char;
                return cleanChar;
            });
            
            console.log('[人物图谱钩子] 已替换relationships为匹配结果');
        } else {
            console.log('[人物图谱钩子] 未匹配到相关人物，清空relationships');
            enhancedVariables.relationships = [];
        }
        
        return enhancedVariables;
        
    } catch (error) {
        console.error('[人物图谱钩子] 处理失败:', error);
        return variables; // 失败时返回原始变量
    }
}

/**
 * 构建人物上下文提示（用于系统消息）
 * @param {string} userMessage - 用户输入
 * @param {Object} variables - 变量状态
 * @returns {string} 人物上下文文本
 */
async function buildCharacterContextPrompt(userMessage, variables) {
    // 检查是否启用人物图谱
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return '';
    }

    try {
        // 匹配相关人物
        const relevantCharacters = await window.characterGraphIntegration.matchRelevantCharacters(
            userMessage,
            variables
        );
        
        if (relevantCharacters.length === 0) {
            return '';
        }
        
        // 构建上下文
        let context = window.characterGraphIntegration.buildCharacterContext(relevantCharacters);
        
        // 📱 检查是否启用私聊记录关联
        const mobileSettings = window.mobilePhoneSettings || {};
        if (mobileSettings.integrateToMain && typeof getMobileChatHistoryForCharacter === 'function') {
            const chatHistoryLimit = mobileSettings.chatHistoryLimit || 50;
            let privateChatContext = '';
            
            for (const char of relevantCharacters) {
                const charName = char.name;
                const chatHistory = getMobileChatHistoryForCharacter(charName, chatHistoryLimit);
                
                if (chatHistory.length > 0) {
                    console.log(`[人物图谱钩子] 📱 找到 ${charName} 的私聊记录: ${chatHistory.length} 条`);
                    
                    privateChatContext += `\n\n【与 ${charName} 的私聊记录】\n`;
                    chatHistory.forEach(msg => {
                        const dir = msg.direction === 'outgoing' ? '我' : msg.sender;
                        privateChatContext += `${dir}: ${msg.content}\n`;
                    });
                }
            }
            
            if (privateChatContext) {
                context += '\n' + privateChatContext;
                console.log('[人物图谱钩子] 📱 已添加私聊记录到上下文');
            }
        }
        
        return context;
        
    } catch (error) {
        console.error('[人物图谱钩子] 构建上下文失败:', error);
        return '';
    }
}

/**
 * 钩子：拦截AI响应处理
 * 在handleAIResponse之后调用，提取人物到图谱
 * @param {Object} parsedResponse - 解析后的AI响应
 * @param {Object} gameState - 游戏状态
 */
async function hookHandleAIResponse(parsedResponse, gameState) {
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return;
    }

    try {
        // 提取relationships到图谱
        if (parsedResponse.variables && parsedResponse.variables.relationships) {
            console.log('[人物图谱钩子] 从AI响应提取人物到图谱...');
            await window.characterGraphIntegration.extractCharactersFromResponse(
                parsedResponse.variables.relationships
            );
        }

        // 如果使用v3.1格式，需要等待变量更新完成后再提取
        if (parsedResponse.variableUpdate && gameState.variables.relationships) {
            console.log('[人物图谱钩子] 从v3.1更新后的变量提取人物到图谱...');
            await window.characterGraphIntegration.extractCharactersFromResponse(
                gameState.variables.relationships
            );
        }

    } catch (error) {
        console.error('[人物图谱钩子] AI响应处理失败:', error);
    }
}

/**
 * 修改原有的buildAIMessages，集成人物图谱
 * 这个函数包装原有的buildAIMessages
 */
async function buildAIMessagesWithCharacterGraph(originalBuildFunction, userMessage, originalUserInput = null) {
    // 如果人物图谱未启用，使用原函数
    if (!window.characterGraphIntegration || !window.characterGraphIntegration.isEnabled) {
        return await originalBuildFunction(userMessage, originalUserInput);
    }

    console.log('[人物图谱钩子] 🔧 拦截buildAIMessages，集成人物图谱');

    // 调用原函数获取消息
    const messages = await originalBuildFunction(userMessage, originalUserInput);

    try {
        // 🔍 查找变量状态消息并增强
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            // 找到包含"当前角色变量状态"的系统消息
            if (msg.role === 'system' && msg.content.includes('当前角色变量状态')) {
                console.log('[人物图谱钩子] 找到变量状态消息，准备增强...');
                
                // 提取原始JSON
                const jsonMatch = msg.content.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    const originalVariables = JSON.parse(jsonMatch[1]);
                    
                    // 增强变量（使用图谱匹配）
                    const enhancedVariables = await enhanceVariablesWithCharacterGraph(
                        originalVariables,
                        originalUserInput || userMessage
                    );
                    
                    // 替换消息内容
                    messages[i].content = '当前角色变量状态：\n```json\n' + 
                        JSON.stringify(enhancedVariables, null, 2) + '\n```';
                    
                    console.log('[人物图谱钩子] ✅ 变量状态已增强');
                }
                break;
            }
        }

        // 🔍 可选：添加人物上下文提示
        const characterContext = await buildCharacterContextPrompt(
            originalUserInput || userMessage,
            window.gameState?.variables
        );
        
        if (characterContext) {
            // 在变量状态之后插入人物上下文
            const insertIndex = messages.findIndex(
                m => m.role === 'system' && m.content.includes('当前角色变量状态')
            );
            
            if (insertIndex >= 0) {
                messages.splice(insertIndex + 1, 0, {
                    role: 'system',
                    content: characterContext
                });
                console.log('[人物图谱钩子] ✅ 已添加人物上下文提示');
            }
        }

    } catch (error) {
        console.error('[人物图谱钩子] 消息增强失败:', error);
        // 失败时返回原始消息
    }

    return messages;
}

/**
 * 初始化钩子系统
 * 包装原有的buildAIMessages和handleAIResponse
 */
function initializeCharacterGraphHooks() {
    // 保存原始函数
    if (typeof window.buildAIMessages === 'function' && !window._originalBuildAIMessages) {
        console.log('[人物图谱钩子] 💉 注入buildAIMessages钩子');
        
        window._originalBuildAIMessages = window.buildAIMessages;
        
        window.buildAIMessages = async function(userMessage, originalUserInput = null) {
            return await buildAIMessagesWithCharacterGraph(
                window._originalBuildAIMessages,
                userMessage,
                originalUserInput
            );
        };
        
        console.log('[人物图谱钩子] ✅ buildAIMessages钩子已注入');
    }

    // 监听AI响应处理事件
    if (window.gameState) {
        console.log('[人物图谱钩子] 准备监听AI响应事件');
    }
}

// 自动初始化（延迟执行，确保页面加载完成）
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('[人物图谱钩子] 开始自动初始化...');
            initializeCharacterGraphHooks();
        }, 1000); // 延迟1秒，确保其他脚本加载完成
    });
}

/**
 * 全局删除人际关系函数（同时删除人物图谱）
 * 供 game.html, game-bhz.html, game-xiandai.html 等页面调用
 * @param {number} relIndex - 人际关系在数组中的索引
 */
function deleteRelationshipWithGraph(relIndex) {
    // 检查gameState是否存在
    if (!window.gameState || !window.gameState.variables || !window.gameState.variables.relationships) {
        console.warn('[人物图谱钩子] 游戏状态不存在，无法删除人际关系');
        alert('游戏状态不存在，无法删除');
        return;
    }

    const relationship = window.gameState.variables.relationships[relIndex];
    if (!relationship) {
        alert('该人际关系不存在');
        return;
    }

    // 确认删除
    if (!confirm(`确定要删除与"${relationship.name}"的关系吗？\n\n关系：${relationship.relation}\n好感度：${relationship.favor}`)) {
        return;
    }

    // 保存人物名称（用于删除人物图谱）
    const characterName = relationship.name;

    // 从数组中删除
    window.gameState.variables.relationships.splice(relIndex, 1);

    // 同时删除对应的人物图谱
    if (window.characterGraphManager && characterName) {
        window.characterGraphManager.deleteCharacter(characterName)
            .then(() => {
                console.log(`[人物图谱钩子] 已同步删除人物图谱: ${characterName}`);
            })
            .catch(err => {
                console.warn(`[人物图谱钩子] 删除人物图谱失败: ${characterName}`, err);
            });
    }

    // 更新UI
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // 保存游戏状态
    if (typeof saveGameHistory === 'function') {
        saveGameHistory().catch(err => console.error('保存失败:', err));
    }

    // 显示提示
    alert(`已删除与"${characterName}"的关系！`);
}

// 导出函数供手动调用
if (typeof window !== 'undefined') {
    window.initializeCharacterGraphHooks = initializeCharacterGraphHooks;
    window.hookHandleAIResponse = hookHandleAIResponse;
    window.deleteRelationship = deleteRelationshipWithGraph; // 全局删除函数
    console.log('[人物图谱钩子] 模块已加载');
}
