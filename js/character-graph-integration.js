/**
 * 人物图谱集成模块
 * 
 * 功能：
 * 1. 拦截AI响应，自动提取relationships到人物图谱
 * 2. 修改上下文构建，使用向量匹配而不是直接包含全部relationships
 * 3. 根据当前对话内容智能检索相关人物
 */

class CharacterGraphIntegration {
    constructor() {
        this.isEnabled = false;
        this.config = {
            autoExtract: true, // 自动从AI响应提取人物到图谱
            autoMatch: true, // 自动匹配相关人物到上下文
            contextMaxCharacters: 3, // 上下文中最多包含多少个人物
            matchThreshold: 0.4, // 匹配阈值（384维向量：40%）
            enableDebug: true // 启用调试日志
        };
    }

    /**
     * 初始化集成
     */
    async init() {
        // 🔧 等待人物图谱管理器可用（最多等待5秒）
        let retryCount = 0;
        const maxRetries = 50; // 5秒，每100ms检查一次
        
        while (!window.characterGraphManager && retryCount < maxRetries) {
            console.log(`[人物图谱集成] ⏳ 等待CharacterGraphManager加载... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }

        if (!window.characterGraphManager) {
            console.error('[人物图谱集成] ❌ CharacterGraphManager 未找到，等待超时');
            return false;
        }

        // 确保管理器已初始化
        if (!window.characterGraphManager.isInitialized) {
            console.log('[人物图谱集成] 🔄 初始化CharacterGraphManager...');
            await window.characterGraphManager.init();
        }
        
        // 从localStorage加载配置
        const saved = localStorage.getItem('characterGraphIntegrationConfig');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }

        this.isEnabled = true;
        console.log('[人物图谱集成] ✅ 初始化完成');
        return true;
    }

    /**
     * 保存配置
     */
    saveConfig() {
        localStorage.setItem('characterGraphIntegrationConfig', JSON.stringify(this.config));
        console.log('[人物图谱集成] 配置已保存');
    }

    /**
     * 从AI响应中提取人物到图谱
     * @param {Array} relationships - AI返回的relationships数组
     */
    async extractCharactersFromResponse(relationships) {
        if (!this.isEnabled || !this.config.autoExtract) {
            return;
        }

        if (!Array.isArray(relationships) || relationships.length === 0) {
            return;
        }

        console.log(`[人物图谱集成] 📥 提取 ${relationships.length} 个人物到图谱...`);

        const results = [];
        for (const rel of relationships) {
            try {
                const result = await window.characterGraphManager.addOrUpdateCharacter(rel);
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`[人物图谱集成] 提取失败: ${rel.name}`, error);
            }
        }

        console.log(`[人物图谱集成] ✅ 成功提取 ${results.length} 个人物`);
        return results;
    }

    /**
     * 根据用户消息和当前上下文，匹配相关人物
     * 🆕 直接用向量匹配，不需要正则提取人名
     * @param {string} userMessage - 用户输入的消息
     * @param {Object} currentVariables - 当前变量状态
     * @returns {Array} 匹配的人物列表（包含完整的relationship数据）
     */
    async matchRelevantCharacters(userMessage, currentVariables) {
        if (!this.isEnabled || !this.config.autoMatch) {
            return [];
        }

        console.log('[人物图谱集成] 🔍 开始匹配相关人物...');

        // 🆕 如果supply配置了包含AI回复，则增强查询
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
                    console.log(`[人物图谱集成] ✅ 已包含最近${recentAIReplies.length}轮AI回复用于匹配`);
                }
            }
        }

        // 🆕 直接用向量匹配，不需要提取人名
        // supply.js的向量系统会自动处理中文分词和关键词提取
        try {
            // 传递原始用户输入，用于区分精确名字匹配的来源（用户输入/AI回复）
            const matches = await window.characterGraphManager.searchByText(enhancedMessage, userMessage);

            if (this.config.enableDebug) {
                console.log(`[人物图谱集成] ✅ 匹配到 ${matches.length} 个相关人物:`);
                matches.forEach((char, i) => {
                    const sourceInfo = char.matchSource ? ` [${char.matchSource}]` : '';
                    console.log(`  ${i + 1}. ${char.name} (分数: ${(char.matchScore * 100).toFixed(1)}%)${sourceInfo}`);
                    if (char.history && char.history.length > 0) {
                        console.log(`     历史: ${char.history.length} 条记录`);
                    }
                });
            }

            return matches;
        } catch (error) {
            console.error('[人物图谱集成] 匹配失败:', error);
            return [];
        }
    }

    /**
     * 从消息中提取人名
     */
    extractNamesFromMessage(message) {
        const names = [];
        
        // 🔍 简单的中文人名模式匹配
        // 匹配常见的称呼：XXX、X师姐、X长老等
        const patterns = [
            /([一-龥]{2,4})(师姐|师兄|师妹|师弟|长老|掌门|宗主|道友)/g,
            /([一-龥]{2,4})/g  // 2-4个汉字的名字
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

        // 去重
        return [...new Set(names)];
    }

    /**
     * 从上下文中提取线索
     */
    extractContextClues(message, variables) {
        const clues = [];

        // 从当前位置推断
        const location = variables?.location || '';
        if (location) {
            // 如果在某个特定位置，可能需要该位置相关的NPC
            // 这里可以根据位置名称做映射
            // 例如："炼丹房" -> 可能需要"炼丹师"相关的人物
        }

        // 从消息关键词推断
        const keywords = {
            '炼丹': ['炼丹', '丹药'],
            '炼器': ['炼器', '法宝'],
            '比武': ['比武', '切磋', '战斗'],
            '双修': ['双修', '阴阳', '房事']
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
     * 构建人物上下文（用于AI提示词）
     * @param {Array} characters - 匹配的人物列表
     * @returns {string} 格式化的人物信息
     */
    buildCharacterContext(characters) {
        if (!characters || characters.length === 0) {
            return '';
        }

        let context = '\n\n【相关人物信息】（已通过向量图谱匹配）\n';
        
        characters.forEach((char, index) => {
            context += `\n${index + 1}. ${char.name}`;
            
            if (char.relation || char.relationship) {
                context += ` (${char.relation || char.relationship})`;
            }
            
            if (char.favor !== undefined) {
                context += ` [好感: ${char.favor}]`;
            }

            if (char.realm) {
                context += `\n   境界：${char.realm}`;
            }

            if (char.age) {
                context += ` | 年龄：${char.age}`;
            }

            if (char.personality) {
                context += `\n   性格：${char.personality}`;
            }

            if (char.appearance) {
                context += `\n   外貌：${char.appearance}`;
            }

            if (char.opinion) {
                context += `\n   看法：${char.opinion}`;
            }

            // 历史互动（只显示最近3条）
            if (char.history && Array.isArray(char.history) && char.history.length > 0) {
                const recentHistory = char.history.slice(-3);
                context += `\n   互动记录：`;
                recentHistory.forEach(h => {
                    context += `\n     • ${h}`;
                });
            }

            context += `\n   匹配度：${(char.matchScore * 100).toFixed(1)}%`;
            context += '\n';
        });

        return context;
    }

    /**
     * 钩子：拦截AI响应处理
     * 在AI响应被处理后自动提取人物到图谱
     */
    async hookAIResponse(aiResponse, gameState) {
        if (!this.isEnabled) {
            return;
        }

        try {
            // 提取relationships到图谱
            if (aiResponse.variables && aiResponse.variables.relationships) {
                await this.extractCharactersFromResponse(aiResponse.variables.relationships);
                
                // 🔧 可选：从变量表单中移除relationships，改为由图谱管理
                // 如果需要完全移除，取消下面的注释
                // delete aiResponse.variables.relationships;
                // console.log('[人物图谱集成] ✂️ 已从变量表单移除relationships');
            }

            // 如果使用了v3.1格式，也需要处理
            if (aiResponse.variableUpdate) {
                // 解析v3.1格式中的relationships更新
                // 这里需要根据实际格式调整
                console.log('[人物图谱集成] 检测到v3.1格式，暂不处理');
            }

        } catch (error) {
            console.error('[人物图谱集成] 钩子处理失败:', error);
        }
    }

    /**
     * 构建增强的上下文消息（替代原有的relationships）
     * @param {string} userMessage - 用户消息
     * @param {Object} variables - 当前变量
     * @param {Array} conversationHistory - 对话历史
     * @returns {string} 增强后的上下文
     */
    async buildEnhancedContext(userMessage, variables, conversationHistory) {
        if (!this.isEnabled) {
            return '';
        }

        try {
            // 匹配相关人物
            const relevantCharacters = await this.matchRelevantCharacters(userMessage, variables);
            
            // 构建人物上下文
            const characterContext = this.buildCharacterContext(relevantCharacters);
            
            return characterContext;

        } catch (error) {
            console.error('[人物图谱集成] 构建上下文失败:', error);
            return '';
        }
    }

    /**
     * 迁移现有的relationships到图谱
     * @param {Object} gameState - 游戏状态
     */
    async migrateExistingRelationships(gameState) {
        if (!gameState || !gameState.variables || !gameState.variables.relationships) {
            console.log('[人物图谱集成] 没有需要迁移的relationships');
            return;
        }

        // 检查人物图谱管理器是否已初始化
        if (!window.characterGraphManager) {
            console.error('[人物图谱集成] 人物图谱管理器未初始化');
            throw new Error('人物图谱管理器未初始化，请刷新页面重试');
        }

        // 检查batchAddCharacters方法是否存在
        if (typeof window.characterGraphManager.batchAddCharacters !== 'function') {
            console.error('[人物图谱集成] batchAddCharacters方法不存在');
            throw new Error('人物图谱管理器方法缺失，请刷新页面重试');
        }

        const relationships = gameState.variables.relationships;
        console.log(`[人物图谱集成] 开始迁移 ${relationships.length} 个现有人物...`);

        try {
            await window.characterGraphManager.batchAddCharacters(relationships);
            
            // 可选：迁移后清空变量表单中的relationships
            // gameState.variables.relationships = [];
            // console.log('[人物图谱集成] 已清空变量表单中的relationships');

            console.log('[人物图谱集成] 迁移完成');
        } catch (error) {
            console.error('[人物图谱集成] 迁移过程中出错:', error);
            throw error;
        }
    }

    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
        
        // 同步到人物图谱管理器
        if (window.characterGraphManager) {
            window.characterGraphManager.updateConfig({
                matchThreshold: this.config.matchThreshold,
                maxResults: this.config.contextMaxCharacters
            });
        }
        
        console.log('[人物图谱集成] 配置已更新:', this.config);
    }

    /**
     * 启用/禁用集成
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`[人物图谱集成] ${enabled ? '✅ 已启用' : '❌ 已禁用'}`);
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.characterGraphIntegration = new CharacterGraphIntegration();
    console.log('[人物图谱集成] 全局实例已创建: window.characterGraphIntegration');
}
