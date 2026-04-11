/**
 * AI响应处理模块
 * 统一处理AI返回的JSON数据,包括变量更新、数组增量更新、向量库集成等
 * 
 * @author 重构自game.html和game-bhz.html的重复代码
 * @version 1.0.0
 */

class AIResponseHandler {
    /**
     * @param {Object} gameState - 游戏状态对象
     * @param {Object} config - 游戏配置
     * @param {boolean} config.hasCombatSystem - 是否有战斗系统
     * @param {boolean} config.enableStatsField - 是否启用stats字段处理
     * @param {Function} config.combatParser - 战斗信息解析函数(可选)
     */
    constructor(gameState, config = {}) {
        this.gameState = gameState;
        this.config = {
            hasCombatSystem: config.hasCombatSystem || false,
            enableStatsField: config.enableStatsField || false,
            combatParser: config.combatParser || null
        };
        
        console.log('[AI响应处理器] 初始化', this.config);
    }
    
    /**
     * 深度合并对象 - 智能保留未更新的嵌套字段
     * @param {Object} target - 目标对象（将被修改）
     * @param {Object} source - 源对象（提供新值）
     * @returns {Object} 合并后的目标对象
     */
    deepMerge(target, source) {
        // 如果source不是对象，或者是null/undefined，直接返回target
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            return target;
        }
        
        // 遍历source的所有属性
        for (const key in source) {
            if (!source.hasOwnProperty(key)) continue;
            
            const sourceValue = source[key];
            const targetValue = target[key];
            
            // 如果source的值是undefined，跳过（保留target的原值）
            if (sourceValue === undefined) {
                continue;
            }
            
            // 如果source的值是对象且target也有这个对象，递归合并
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
                targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                this.deepMerge(targetValue, sourceValue);
            } else {
                // 否则直接赋值（包括数组、基本类型等）
                target[key] = sourceValue;
            }
        }
        
        return target;
    }
    
    /**
     * 处理AI响应的主函数
     * @param {string} response - AI返回的原始响应
     */
    handleAIResponse(response) {
        // 调试模式：直接显示原始响应，不做任何解析或渲染处理
        const debugCheckbox = document.getElementById('debugMode');
        if (debugCheckbox && debugCheckbox.checked) {
            this.appendDebug('AI', response);
            return;
        }

        // ✅ 使用增强版JSON处理工具（保证不会失败）
        let data;
        try {
            data = processAIResponse(response);
        } catch (error) {
            console.error('❌ processAIResponse异常:', error);
            // 降级方案：构造最小可用数据
            data = {
                reasoning: { situation: '解析异常', playerChoice: '', logicChain: [], outcome: '' },
                variableChanges: { analysis: 'Parse error', changes: {} },
                story: '系统错误：AI响应解析失败\n\n' + response.substring(0, 500),
                options: ['重新生成', '尝试继续', '查看日志', '返回菜单', '保存退出']
            };
        }
        
        // 🔍 调试：打印解析后的 data 对象包含哪些字段
        console.log('[AI响应] 📦 解析后的字段:', Object.keys(data));
        console.log('[AI响应] 🖼️ data.img 存在?', 'img' in data, '值:', data.img ? data.img.substring(0, 80) : '无');

        // 更新变量（支持三种格式）
        if (data.variableUpdate) {
            try {
                // v3.1 简化格式（推荐）
                console.log('[ai-response-handler] 🎯 使用 v3.1 简化格式更新变量');
                console.log('[ai-response-handler] variableUpdate 内容:', data.variableUpdate);
                
                // 初始化 v3.1 解析器
                if (!window.v31Parser) {
                    console.log('[ai-response-handler] 初始化解析器...');
                    window.v31Parser = new VariableInstructionParserV31(this.gameState, {
                        debug: true,
                        enableRollback: false
                    });
                    console.log('[ai-response-handler] 解析器初始化完成');
                }
                
                // 解析并执行变量更新
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[ai-response-handler] ✅ 更新结果:', result);
                
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('[ai-response-handler] ❌ v3.1 变量更新失败:', error);
                console.error('[ai-response-handler] 错误详情:', error.message);
                console.error('[ai-response-handler] variableUpdate内容:', data.variableUpdate);
            }
        } else if (data.variableChanges) {
            try {
                // 旧方案：增量更新
                this.applyVariableChanges(data.variableChanges);
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ 变量更新失败:', error);
            }
        } else if (data.variables) {
            try {
                // 旧方案：完整变量表单（向后兼容）
                this.updateVariables(data.variables);
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ 变量更新失败（旧方案）:', error);
            }
        }

        // 处理stats字段（转换为variables中的attributes）
        if (this.config.enableStatsField && data.stats) {
            try {
                if (!this.gameState.variables.attributes) {
                    this.gameState.variables.attributes = {};
                }
                
                // 使用深度合并将stats中的属性值合并到attributes中
                this.deepMerge(this.gameState.variables.attributes, data.stats);
                console.log('[属性更新] 📊 从stats字段更新属性 (深度合并):', data.stats);
                
                // 更新UI
                updateStatusPanel();
                showAttributeChanges();
            } catch (error) {
                console.error('❌ stats字段处理失败:', error);
            }
        }

        // 处理特殊状态相关字段（specialStatus, status, mood, thought等）
        try {
            let needsUIUpdate = false;
            
            // 1. 处理 specialStatus 字段（特殊状态对象）
            if (data.specialStatus && typeof data.specialStatus === 'object') {
                if (!this.gameState.variables.specialStatus) {
                    this.gameState.variables.specialStatus = {};
                }
                this.deepMerge(this.gameState.variables.specialStatus, data.specialStatus);
                console.log('[特殊状态] 📊 从specialStatus字段更新:', data.specialStatus);
                needsUIUpdate = true;
            }
            
            // 2. 处理 status 字段（当前状态描述）
            if (data.status !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.status = data.status;
                console.log('[特殊状态] 📍 主角状态更新:', data.status);
                needsUIUpdate = true;
            }
            
            // 3. 处理 mood 字段（心情）
            if (data.mood !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.mood = data.mood;
                console.log('[特殊状态] 💭 主角心情更新:', data.mood);
                needsUIUpdate = true;
            }
            
            // 4. 处理 thought 字段（内心想法）
            if (data.thought !== undefined) {
                if (!this.gameState.variables.protagonist) {
                    this.gameState.variables.protagonist = {};
                }
                this.gameState.variables.protagonist.thought = data.thought;
                console.log('[特殊状态] 💭 主角想法更新:', data.thought);
                needsUIUpdate = true;
            }
            
            // 如果有更新，刷新UI
            if (needsUIUpdate) {
                updateStatusPanel();
            }
        } catch (error) {
            console.error('❌ 特殊状态字段处理失败:', error);
        }

        // 添加到历史记录（保存剧情 + 原始响应/JSON + imgPrompt）
        if (data.story) {
            this.gameState.conversationHistory.push({
                role: 'assistant',
                content: data.story,
                rawResponse: response,
                parsed: data,
                imgPrompt: data.img || null  // 🎨 保存图片提示词用于存档恢复
            });

            // 保存当前变量快照
            this.gameState.variableSnapshots.push(JSON.parse(JSON.stringify(this.gameState.variables)));
            
            // 【新增】如果启用向量检索，添加到向量库
            this.addToVectorDatabase();
        }

        // 检测是否是战斗场景（如果启用）
        if (this.config.hasCombatSystem && this.config.combatParser) {
            this.handleCombatDetection(data);
        } else {
            // 正常显示消息（传入 img 字段用于 NovelAI 生图）
            console.log('[AI响应] 🖼️ img 字段:', data.img ? data.img.substring(0, 50) + '...' : '无');
            displayAIMessage(data.story, data.options, data.reasoning, data.img);
            
            // 保存游戏历史到 IndexedDB
            saveGameHistory().catch(err => console.error('保存历史失败:', err));
        }

        // 清空本地操作记录
        if (this.gameState && this.gameState.localOps) {
            this.gameState.localOps = { items: [], attrs: [], equip: [] };
        }
    }
    
    /**
     * 处理战斗检测逻辑
     * @param {Object} data - 解析后的AI数据
     */
    handleCombatDetection(data) {
        const combatInfo = this.config.combatParser(data.story);
        if (combatInfo) {
            // 存储战斗信息到全局变量，供用户选择时使用
            window.pendingCombatInfo = combatInfo;
            console.log('⚔️ 检测到战斗信息，已存储:', combatInfo);
        } else {
            // 清除待处理的战斗信息
            window.pendingCombatInfo = null;
        }
        
        // 正常显示消息（包含战斗选项，传入 img 字段用于 NovelAI 生图）
        console.log('[AI响应-战斗分支] 🖼️ img 字段:', data.img ? data.img.substring(0, 50) + '...' : '无');
        displayAIMessage(data.story, data.options, data.reasoning, data.img);
        
        // 保存游戏历史
        saveGameHistory().catch(err => console.error('保存历史失败:', err));
    }
    
    /**
     * 添加对话到向量数据库
     */
    async addToVectorDatabase() {
        const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;
        
        if (enableVectorRetrieval && window.contextVectorManager && this.gameState.conversationHistory.length >= 2) {
            const turnIndex = Math.floor(this.gameState.conversationHistory.length / 2);
            const userMessage = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 2].content;
            const aiResponse = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 1].content;
            
            try {
                // 异步添加到向量库（不阻塞游戏流程）
                await window.contextVectorManager.addConversation(
                    userMessage,
                    aiResponse,
                    turnIndex,
                    this.gameState.variables
                );
                
                // 🆕 提取并添加history到矩阵
                const lastMessage = this.gameState.conversationHistory[this.gameState.conversationHistory.length - 1];
                if (lastMessage && lastMessage.parsed && lastMessage.parsed.variableUpdate) {
                    // 从variableUpdate中提取history
                    await this.extractAndAddHistoryToMatrix(lastMessage.parsed.variableUpdate, turnIndex);
                }
                
                // 保存向量库到IndexedDB
                await window.contextVectorManager.saveToIndexedDB();
            } catch (err) {
                console.error('❌ 向量库添加失败:', err);
                console.error('错误详情:', err.stack);
                
                // 自动回退到关键词方法
                this.handleVectorError(err);
            }
        }
    }
    
    /**
     * 提取并添加history到矩阵
     * @param {string} variableUpdate - variableUpdate字符串
     * @param {number} turnIndex - 轮次索引
     */
    async extractAndAddHistoryToMatrix(variableUpdate, turnIndex) {
        if (!window.contextVectorManager || !window.matrixManager) {
            return;
        }
        
        try {
            // 从variableUpdate中提取history
            const historyItems = [];
            
            // 匹配 >>history: 文本 格式
            const singleHistoryRegex = />>history:\s*(.+)/g;
            let match;
            while ((match = singleHistoryRegex.exec(variableUpdate)) !== null) {
                historyItems.push(match[1].trim());
            }
            
            // 匹配 history:\n  - 文本 格式
            const multiHistoryRegex = /history:\s*\n\s*-\s*(.+)/g;
            while ((match = multiHistoryRegex.exec(variableUpdate)) !== null) {
                historyItems.push(match[1].trim());
            }
            
            if (historyItems.length === 0) {
                console.log('[History矩阵] 本轮未找到history字段');
                return;
            }
            
            console.log(`[History矩阵] 📥 提取到 ${historyItems.length} 条history`);
            
            // 添加到矩阵
            for (const historyText of historyItems) {
                await window.contextVectorManager.addHistoryEntry(
                    historyText,
                    turnIndex,
                    this.gameState.variables
                );
            }
            
            console.log(`[History矩阵] ✅ 已添加 ${historyItems.length} 条history到矩阵`);
        } catch (error) {
            console.error('[History矩阵] ❌ 添加失败:', error);
        }
    }
    
    /**
     * 处理向量化错误
     * @param {Error} err - 错误对象
     */
    handleVectorError(err) {
        const currentMethod = window.contextVectorManager.embeddingMethod;
        if (currentMethod !== 'keyword') {
            console.warn(`[向量库] ${currentMethod}方法失败，自动切换到关键词方法`);
            window.contextVectorManager.setEmbeddingMethod('keyword');
            document.getElementById('vectorMethod').value = 'keyword';
            
            // 提示用户
            setTimeout(() => {
                alert(`⚠️ 向量化失败\n\n${currentMethod}方法出现错误，已自动切换到"关键词匹配"方法\n\n错误：${err.message}\n\n游戏将正常继续，不影响使用。`);
            }, 1000);
        }
    }
    
    /**
     * 调试模式输出
     * @param {string} role - 角色
     * @param {string} content - 内容
     */
    appendDebug(role, content) {
        if (typeof appendDebug === 'function') {
            appendDebug(role, content);
        } else {
            console.log(`[调试模式] ${role}:`, content);
        }
    }
    
    /**
     * 应用增量变量更新
     * @param {Object} variableChanges - 变量变化对象
     */
    applyVariableChanges(variableChanges) {
        if (!variableChanges) {
            console.warn('[变量更新] 没有变量变化数据');
            return this.gameState.variables;
        }

        const { analysis, changes = {}, arrayChanges, newFields = [], removedFields = [] } = variableChanges;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[变量更新] 开始应用增量更新');
        if (analysis) {
            console.log('[变量更新] 分析:', analysis);
        }
        if (Object.keys(changes).length > 0) {
            console.log('[变量更新] 变化字段:', Object.keys(changes));
        }
        if (arrayChanges) {
            console.log('[变量更新] 数组增量更新:', Object.keys(arrayChanges));
        }
        if (newFields.length > 0) {
            console.log('[变量更新] 新增字段:', newFields);
        }
        if (removedFields.length > 0) {
            console.log('[变量更新] 删除字段:', removedFields);
        }

        // 保存之前的变量状态用于计算变化
        this.gameState.previousVariables = JSON.parse(JSON.stringify(this.gameState.variables));

        // 1. 处理普通字段变化
        for (const [key, value] of Object.entries(changes)) {
            this.applyFieldChange(key, value);
        }

        // 2. 处理数组字段增量更新（新功能）
        if (arrayChanges) {
            this.applyArrayChanges(arrayChanges);
        }

        // 3. 删除标记为移除的字段
        removedFields.forEach(field => {
            if (this.gameState.variables.hasOwnProperty(field)) {
                delete this.gameState.variables[field];
                console.log(`[变量更新] ❌ 删除字段: ${field}`);
            }
        });

        console.log('[变量更新] ✅ 增量更新完成');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return this.gameState.variables;
    }
    
    /**
     * 应用数组字段的增量更新（add/remove/update模式）
     * @param {Object} arrayChanges - 数组增量更新对象
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

            console.log(`[数组更新] ${emoji} 处理 ${arrayName}:`);

            // 检查是否是直接数组格式（AI返回的格式）
            if (Array.isArray(operations)) {
                console.log(`  📋 检测到直接数组格式，处理 ${operations.length} 个项目`);
                operations.forEach(item => {
                    // 【关键修复】检查元素是否已存在
                    const existingIndex = array.findIndex(el => el.name === item.name);
                    
                    if (existingIndex !== -1) {
                        // 已存在：使用updateInArray来正确深度合并（保留未更新的嵌套字段如bodyParts.description）
                        console.log(`  🔍 检测到 ${item.name} 已存在，使用深度合并更新`);
                        this.updateInArray(array, item, arrayName);
                    } else {
                        // 不存在：使用addToArray添加新元素
                        this.addToArray(array, item, arrayName);
                    }
                });
            } else {
                // 标准操作格式 { add: [...], remove: [...], update: [...] }
                // 1. 处理删除操作
                if (operations.remove && operations.remove.length > 0) {
                    operations.remove.forEach(item => {
                        this.removeFromArray(array, item, arrayName);
                    });
                }

                // 2. 处理新增操作
                if (operations.add && operations.add.length > 0) {
                    operations.add.forEach(item => {
                        this.addToArray(array, item, arrayName);
                    });
                }

                // 3. 处理更新操作
                if (operations.update && operations.update.length > 0) {
                    operations.update.forEach(item => {
                        this.updateInArray(array, item, arrayName);
                    });
                }
            }
        }
    }
    
    /**
     * 从数组中删除元素或减少数量
     * @param {Array} array - 目标数组
     * @param {Object} item - 要删除的元素
     * @param {string} arrayName - 数组名称
     */
    removeFromArray(array, item, arrayName) {
        const index = array.findIndex(el => el.name === item.name);

        if (index === -1) {
            console.warn(`  ⚠️ 尝试删除不存在的${arrayName}: ${item.name}`);
            return;
        }

        // 如果是items且指定了count，则减少数量
        if (arrayName === 'items' && item.count !== undefined) {
            const oldCount = array[index].count;
            array[index].count -= item.count;
            console.log(`  ➖ ${item.name}: 数量 -${item.count} (${oldCount} → ${array[index].count})`);

            // 如果数量<=0，则完全删除
            if (array[index].count <= 0) {
                array.splice(index, 1);
                console.log(`  ❌ ${item.name}: 数量归零，已从物品列表删除`);
            }
        } else {
            // 完全删除
            array.splice(index, 1);
            console.log(`  ❌ 删除 ${item.name}`);
        }
    }
    
    /**
     * 向数组中添加元素或增加数量
     * @param {Array} array - 目标数组
     * @param {Object} item - 要添加的元素
     * @param {string} arrayName - 数组名称
     */
    addToArray(array, item, arrayName) {
        const existingIndex = array.findIndex(el => el.name === item.name);

        // 如果是items且已存在，则增加数量
        if (arrayName === 'items' && existingIndex !== -1) {
            const oldCount = array[existingIndex].count;
            array[existingIndex].count += item.count;
            console.log(`  ➕ ${item.name}: 数量 +${item.count} (${oldCount} → ${array[existingIndex].count})`);

            // 更新其他字段（使用深度合并保留嵌套数据）
            this.deepMerge(array[existingIndex], item);
        } else if (existingIndex !== -1) {
            // 【重要修复】对于relationships等数组，如果已存在，不应该在这里处理
            // 应该由调用方判断后直接调用updateInArray
            console.warn(`  ⚠️ addToArray被用于更新已存在的${arrayName}: ${item.name}，这可能导致数据丢失！`);
            console.warn(`  ⚠️ 建议调用方先检查元素是否存在，已存在的应该调用updateInArray`);
            
            // 为了兼容性，仍然执行深度合并，但会输出警告
            const oldItem = array[existingIndex];
            this.deepMerge(oldItem, item);
            console.log(`  🔄 更新 ${item.name} (深度合并，但可能不完整)`);
        } else {
            // 不存在则新增
            array.push(item);
            const extra = arrayName === 'items' ? ` (数量: ${item.count})` : '';
            console.log(`  ✅ 新增 ${item.name}${extra}`);
        }
    }
    
    /**
     * 更新数组中已存在的元素
     * @param {Array} array - 目标数组
     * @param {Object} item - 要更新的元素（包含name和要更新的字段）
     * @param {string} arrayName - 数组名称
     */
    updateInArray(array, item, arrayName) {
        const existingIndex = array.findIndex(el => el.name === item.name);

        if (existingIndex === -1) {
            console.warn(`  ⚠️ 尝试更新不存在的${arrayName}: ${item.name}`);
            return;
        }

        // 记录旧值
        const oldValues = {};
        const updatedFields = Object.keys(item).filter(k => k !== 'name');
        updatedFields.forEach(field => {
            oldValues[field] = array[existingIndex][field];
        });

        // 特殊处理1：relationships数组的history字段需要追加而不是覆盖
        if (arrayName === 'relationships' && item.history) {
            const existingHistory = array[existingIndex].history || [];
            const newHistory = item.history || [];
            
            // 去重合并：只添加不重复的历史记录
            const mergedHistory = [...existingHistory];
            let addedCount = 0;
            
            newHistory.forEach(newItem => {
                // 检查是否已存在相同内容（去除首尾空格后比较）
                const trimmedNew = newItem.trim();
                const isDuplicate = mergedHistory.some(existing => existing.trim() === trimmedNew);
                
                if (!isDuplicate && trimmedNew) {
                    mergedHistory.push(newItem);
                    addedCount++;
                }
            });
            
            // 更新history字段为合并后的数组
            item.history = mergedHistory;
            
            if (addedCount > 0) {
                console.log(`    - history: 追加了 ${addedCount} 条新记录（总计：${mergedHistory.length}条）`);
            }
        }

        // 特殊处理2：relationships数组的bodyParts字段需要深度合并，保留description
        if (arrayName === 'relationships' && item.bodyParts) {
            const existingBodyParts = array[existingIndex].bodyParts || {};
            const newBodyParts = item.bodyParts;
            
            // 对每个身体部位进行深度合并
            ['vagina', 'breasts', 'mouth', 'hands', 'feet'].forEach(partName => {
                if (newBodyParts[partName]) {
                    if (existingBodyParts[partName]) {
                        // 已存在该部位：合并更新，保留description（如果新数据没有提供）
                        if (!newBodyParts[partName].description && existingBodyParts[partName].description) {
                            console.log(`    - bodyParts.${partName}: 保留原有description，更新useCount`);
                            newBodyParts[partName].description = existingBodyParts[partName].description;
                        }
                    }
                }
            });
        }

        // 使用深度合并更新字段（保留嵌套对象中未更新的字段）
        this.deepMerge(array[existingIndex], item);

        // 输出详细日志
        console.log(`  🔧 更新 ${item.name} (深度合并):`);
        updatedFields.forEach(field => {
            if (field === 'history' && arrayName === 'relationships') {
                // history字段已经在上面特殊处理过了，跳过详细日志
                return;
            }
            console.log(`    - ${field}: ${JSON.stringify(oldValues[field])} → ${JSON.stringify(item[field])}`);
        });
    }
    
    /**
     * 应用单个字段的变化
     * @param {string} key - 字段名
     * @param {any} value - 新值
     */
    applyFieldChange(key, value) {
        // ========== 特殊处理1：history字段使用追加模式 ==========
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
                        console.log(`[变量更新] 📜 新增历史: ${newRecord.substring(0, 50)}...`);
                    }
                });
                console.log(`[变量更新] history: 追加了 ${addedCount} 条新记录`);
            }
            return;
        }

        // ========== 特殊处理2：对象字段使用部分更新模式 ==========
        if (key === 'attributes' || key === 'equipment') {
            if (!this.gameState.variables[key]) {
                this.gameState.variables[key] = {};
            }
            const changedKeys = Object.keys(value);
            // 使用深度合并，保留嵌套对象中未更新的字段
            this.deepMerge(this.gameState.variables[key], value);
            console.log(`[变量更新] 🔧 部分更新 ${key}: [${changedKeys.join(', ')}] (深度合并)`);

            // 详细记录每个子字段的变化
            changedKeys.forEach(subKey => {
                const oldValue = this.gameState.previousVariables?.[key]?.[subKey];
                const newValue = value[subKey];
                if (oldValue !== undefined) {
                    console.log(`  - ${subKey}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
                } else {
                    console.log(`  - ${subKey}: (新增) ${JSON.stringify(newValue)}`);
                }
            });
            return;
        }

        // ========== 特殊处理3：数组字段使用完整替换模式（带安全检查）==========
        if (key === 'items' || key === 'relationships' || key === 'techniques' || key === 'spells') {
            const oldCount = this.gameState.variables[key] ? this.gameState.variables[key].length : 0;
            const newCount = Array.isArray(value) ? value.length : 0;

            // 安全检查：防止数据丢失
            if (oldCount > 5 && newCount < oldCount / 2 && newCount > 0) {
                console.warn(`⚠️ ${key}数量异常减少：从${oldCount}个减少到${newCount}个，可能存在数据丢失！`);
                console.warn(`⚠️ 建议检查AI返回的${key}数组是否完整`);
            }

            this.gameState.variables[key] = value;

            const emoji = {
                'items': '🎒',
                'relationships': '👥',
                'techniques': '📖',
                'spells': '✨'
            }[key] || '📝';

            console.log(`[变量更新] ${emoji} 完整替换 ${key}: ${oldCount} -> ${newCount}`);
            return;
        }

        // ========== 默认处理：直接赋值 ==========
        const oldValue = this.gameState.variables[key];
        this.gameState.variables[key] = value;
        
        if (oldValue !== undefined) {
            console.log(`[变量更新] ${key}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(value)}`);
        } else {
            console.log(`[变量更新] 新增 ${key}: ${JSON.stringify(value)}`);
        }
    }
    
    /**
     * 更新变量（旧方案，保留用于向后兼容）
     * @param {Object} newVars - 新变量对象
     */
    updateVariables(newVars) {
        // 保存之前的变量状态用于计算变化
        this.gameState.previousVariables = JSON.parse(JSON.stringify(this.gameState.variables));

        console.log('[变量更新] 使用旧方案（完整更新）');
        
        // 递归合并对象
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
        console.log('[变量更新] ✅ 旧方案更新完成');
    }
}

// 导出到全局
window.AIResponseHandler = AIResponseHandler;

console.log('📦 [模块加载] ai-response-handler.js 已加载');
