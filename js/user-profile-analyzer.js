// ==================== 用户输入分析及用户画像系统 ====================
// 此模块负责分析用户输入，构建用户画像，并为主API提供增强提示

// ==================== 📚 剧情存档管理器 ====================
/**
 * 剧情存档管理器 - 存储和管理每次分析产生的剧情规划
 */
const plotArchiveManager = {
    // 剧情存档数据
    plots: [],

    // 统计数据
    stats: {
        totalCount: 0,
        lastUpdated: null
    },

    /**
     * 添加新的剧情规划
     * @param {object} plotPlanning - 来自分析结果的plotPlanning对象
     */
    addPlot(plotPlanning) {
        if (!plotPlanning || !plotPlanning.storyName) {
            console.warn('[📚剧情存档] 缺少storyName，跳过保存');
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

        // 保存到localStorage
        this.saveToLocalStorage();

        console.log('[📚剧情存档] 已保存剧情:', plot.storyName);
        return plot;
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'plot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 获取所有剧情名称列表
     * @returns {string[]} 剧情名称数组
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
     * 按剧情名称分组获取所有剧情
     * @returns {object} { name: [plots...], ... }
     */
    getPlotsByName() {
        const grouped = {};
        this.plots.forEach(plot => {
            const name = plot.storyName || '未命名';
            if (!grouped[name]) {
                grouped[name] = [];
            }
            grouped[name].push(plot);
        });
        return grouped;
    },

    /**
     * 根据名称获取最新的剧情规划
     * @param {string} storyName - 剧情名称
     * @returns {object|null} 最新的剧情规划
     */
    getLatestPlotByName(storyName) {
        const plots = this.plots.filter(p => p.storyName === storyName);
        if (plots.length === 0) return null;
        return plots[plots.length - 1]; // 返回最新的
    },

    /**
     * 根据名称列表获取多个剧情的三步规划
     * @param {string[]} storyNames - 剧情名称数组
     * @returns {object[]} 剧情规划数组
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
     * 删除指定ID的剧情
     * @param {string} plotId - 剧情ID
     */
    deletePlot(plotId) {
        const index = this.plots.findIndex(p => p.id === plotId);
        if (index !== -1) {
            this.plots.splice(index, 1);
            this.stats.totalCount = this.plots.length;
            this.saveToLocalStorage();
            console.log('[📚剧情存档] 已删除剧情:', plotId);
        }
    },

    /**
     * 删除最后 N 条剧情规划（用于删除楼层或重新生成时同步清理）
     * @param {number} count - 要删除的条数
     * @returns {number} 实际删除的条数
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

        console.log(`[📚剧情存档] 已删除最后 ${actualDeleteCount} 条剧情规划`);
        deletedPlots.forEach(plot => {
            console.log(`  - ${plot.storyName}`);
        });

        return actualDeleteCount;
    },

    /**
     * 清空所有剧情
     */
    clearAll() {
        this.plots = [];
        this.stats.totalCount = 0;
        this.stats.lastUpdated = null;
        this.saveToLocalStorage();
        console.log('[📚剧情存档] 已清空所有剧情');
    },

    /**
     * 导出存档数据
     * @returns {object} 存档数据
     */
    exportArchive() {
        return {
            plots: JSON.parse(JSON.stringify(this.plots)),
            stats: { ...this.stats }
        };
    },

    /**
     * 导入存档数据
     * @param {object} data - 存档数据
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
        console.log('[📚剧情存档] 已导入', this.plots.length, '条剧情');
    },

    /**
     * 保存到localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('plotArchiveData', JSON.stringify({
                plots: this.plots,
                stats: this.stats
            }));
        } catch (e) {
            console.warn('[📚剧情存档] 保存到localStorage失败:', e);
        }
    },

    /**
     * 从localStorage加载
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('plotArchiveData');
            if (saved) {
                const data = JSON.parse(saved);
                this.importArchive(data);
                console.log('[📚剧情存档] 从localStorage加载了', this.plots.length, '条剧情');
            }
        } catch (e) {
            console.warn('[📚剧情存档] 从localStorage加载失败:', e);
        }
    }
};

// 初始化时从localStorage加载
plotArchiveManager.loadFromLocalStorage();

// 暴露到全局
window.plotArchiveManager = plotArchiveManager;

// ==================== 🔄 物品频率追踪器 ====================
/**
 * 物品频率追踪器 - 追踪记忆包中物品/人物/场所的出现频率
 * 用于抑制重复出现的内容，避免同一物品连续出现多轮
 */
const itemFrequencyTracker = {
    // 追踪数据：{ itemName: { count: 连续出现次数, lastMentioned: 最后提及轮次 } }
    tracking: {},

    // 当前轮次（每次分析+1）
    currentRound: 0,

    // 配置
    config: {
        maxConsecutive: 1,      // 连续出现超过此次数后抑制
        cooldownRounds: 2,      // 抑制后需要冷却的轮数
        enabled: true           // 是否启用抑制
    },

    /**
     * 开始新的一轮分析
     */
    startNewRound() {
        this.currentRound++;
        console.log(`[🔄频率追踪] 开始第 ${this.currentRound} 轮`);
    },

    /**
     * 记录本轮出现的物品
     * @param {string[]} itemNames - 本轮出现的物品名称列表
     */
    recordItems(itemNames) {
        if (!itemNames || !Array.isArray(itemNames)) return;

        itemNames.forEach(name => {
            if (!name) return;

            // 🔄 模糊匹配：检查是否有已记录的相似名称
            let matchedKey = null;
            for (const existingName in this.tracking) {
                if (this.fuzzyMatch(name, existingName)) {
                    matchedKey = existingName;
                    break;
                }
            }

            if (matchedKey) {
                // 找到模糊匹配，使用已有的key
                if (this.tracking[matchedKey].lastMentioned === this.currentRound - 1) {
                    this.tracking[matchedKey].count++;
                    console.log(`[🔄频率追踪] "${name}" 模糊匹配到 "${matchedKey}"，连续次数: ${this.tracking[matchedKey].count}`);
                } else {
                    this.tracking[matchedKey].count = 1;
                }
                this.tracking[matchedKey].lastMentioned = this.currentRound;
            } else if (!this.tracking[name]) {
                // 新物品
                this.tracking[name] = { count: 1, lastMentioned: this.currentRound };
            } else {
                // 精确匹配已有记录
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
     * 🔄 模糊匹配两个名称
     */
    fuzzyMatch(name1, name2) {
        if (!name1 || !name2) return false;
        if (name1 === name2) return true;

        const n1 = name1.toLowerCase();
        const n2 = name2.toLowerCase();

        // 包含关系
        if (n1.includes(n2) || n2.includes(n1)) return true;

        // 关键词匹配（英文词）
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
     * 检查物品是否应该被抑制
     * @param {string} itemName - 物品名称
     * @param {string} userInput - 用户输入（用于检测是否明确提到）
     * @returns {boolean} true=应该抑制, false=可以显示
     */
    shouldSuppress(itemName, userInput = '') {
        if (!this.config.enabled) return false;
        if (!this.tracking[itemName]) return false;

        const item = this.tracking[itemName];

        // 如果用户明确提到该物品，不抑制
        if (userInput && userInput.includes(itemName)) {
            console.log(`[🔄频率追踪] "${itemName}" 被用户明确提到，不抑制`);
            return false;
        }

        // 检查是否连续出现超过阈值
        if (item.count >= this.config.maxConsecutive &&
            item.lastMentioned === this.currentRound - 1) {
            console.log(`[🔄频率追踪] "${itemName}" 连续出现 ${item.count} 次，抑制输出`);
            return true;
        }

        return false;
    },

    /**
     * 获取需要抑制的物品列表（用于提示词）
     * @param {string} userInput - 用户输入
     * @returns {string[]} 需要抑制的物品名称列表
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
     * 获取高频物品列表（连续出现2次以上）
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
     * 重置某个物品的计数（当用户主动提到时）
     * @param {string} itemName - 物品名称
     */
    resetItem(itemName) {
        if (this.tracking[itemName]) {
            this.tracking[itemName].count = 1;
            this.tracking[itemName].lastMentioned = this.currentRound;
        }
    },

    /**
     * 清空所有追踪数据
     */
    clearAll() {
        this.tracking = {};
        this.currentRound = 0;
        this.saveToLocalStorage();
        console.log('[🔄频率追踪] 已清空所有追踪数据');
    },

    /**
     * 保存到localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('itemFrequencyTracker', JSON.stringify({
                tracking: this.tracking,
                currentRound: this.currentRound,
                config: this.config
            }));
        } catch (e) {
            console.warn('[🔄频率追踪] 保存失败:', e);
        }
    },

    /**
     * 从localStorage加载
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
                console.log(`[🔄频率追踪] 加载成功，当前第 ${this.currentRound} 轮，追踪 ${Object.keys(this.tracking).length} 个物品`);
            }
        } catch (e) {
            console.warn('[🔄频率追踪] 加载失败:', e);
        }
    },

    /**
     * 获取追踪状态摘要（用于调试）
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

// 初始化时从localStorage加载
itemFrequencyTracker.loadFromLocalStorage();

// 暴露到全局
window.itemFrequencyTracker = itemFrequencyTracker;

/**
 * 🔄 模糊匹配检查 - 判断两个名称是否指向同一物品
 * 例如 "银色骷髅头Zippo" 和 "骷髅头Zippo打火机" 应该被识别为同一物品
 */
function fuzzyMatchItemName(name1, name2) {
    if (!name1 || !name2) return false;

    // 精确匹配
    if (name1 === name2) return true;

    // 提取核心关键词进行匹配
    const normalize = (s) => s.toLowerCase()
        .replace(/[银色金色黑色红色白色]/g, '')  // 移除颜色
        .replace(/[的了一个]/g, '')  // 移除虚词
        .trim();

    const n1 = normalize(name1);
    const n2 = normalize(name2);

    // 包含关系
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // 核心词匹配（提取英文+数字）
    const extractCore = (s) => {
        const matches = s.match(/[a-zA-Z0-9\u4e00-\u9fa5]+/g) || [];
        return matches.filter(m => m.length >= 2);
    };

    const cores1 = extractCore(n1);
    const cores2 = extractCore(n2);

    // 如果有任意核心词相同，判定为同一物品
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
 * 🔄 从记忆包中过滤高频物品
 * @param {object} memoryPackage - 原始记忆包
 * @returns {object} 过滤后的记忆包
 */
function filterHighFrequencyItemsFromPackage(memoryPackage) {
    if (!memoryPackage) return memoryPackage;

    // 深拷贝避免修改原对象
    const filtered = JSON.parse(JSON.stringify(memoryPackage));

    // 获取需要抑制的物品（连续出现>=3次）
    const highFreqItems = itemFrequencyTracker.getHighFrequencyItems();
    const suppressNames = highFreqItems.filter(i => i.count >= 3).map(i => i.name);

    if (suppressNames.length === 0) {
        return filtered;
    }

    console.log('[🔄频率追踪] 需要抑制的物品:', suppressNames.join(', '));

    // 检查物品是否应该被过滤（使用模糊匹配）
    const shouldFilter = (itemName) => {
        for (const suppressName of suppressNames) {
            if (fuzzyMatchItemName(itemName, suppressName)) {
                console.log(`[🔄频率追踪] 过滤物品: "${itemName}" (匹配高频词 "${suppressName}")`);
                return true;
            }
        }
        return false;
    };

    // 过滤 requiredItems
    if (filtered.requiredItems?.items && Array.isArray(filtered.requiredItems.items)) {
        const originalCount = filtered.requiredItems.items.length;
        filtered.requiredItems.items = filtered.requiredItems.items.filter(item => {
            return !shouldFilter(item.name);
        });
        const removedCount = originalCount - filtered.requiredItems.items.length;
        if (removedCount > 0) {
            console.log(`[🔄频率追踪] 从 requiredItems 中移除了 ${removedCount} 个高频物品`);
        }
    }

    return filtered;
}

// 暴露到全局
window.fuzzyMatchItemName = fuzzyMatchItemName;
window.filterHighFrequencyItemsFromPackage = filterHighFrequencyItemsFromPackage;

// 用户画像存储
let userProfileData = {
    // 用户偏好
    preferences: [],
    // 用户不喜欢的内容
    dislikes: [],
    // 偏好的文风
    writingStyle: '未确定',
    // 内容偏好
    contentPreference: '未确定',
    // 文学素养
    literacyLevel: '未确定',
    // 交互模式
    interactionPattern: '未确定',
    // 其他观察
    notes: [],
    // 分析历史（最近10次）
    analysisHistory: [],
    // 统计数据
    stats: {
        totalInputs: 0,
        r18Inputs: 0,
        combatInputs: 0,
        socialInputs: 0,
        explorationInputs: 0,
        lastUpdated: null
    }
};

// 用户画像配置
let userProfileConfig = {
    enabled: false,
    analysisPrompt: '',
    showAnalysis: true,
    analysisHistoryDepth: 3,   // 分析时读取的正文层数
    matrixHistoryDepth: 5,     // 分析时读取的历史矩阵层数
    memoryDispatcherEnabled: false  // 🆕 记忆调度器模式：Flash看大量历史输出记忆包，主API专注写作
};

/**
 * 🔧 兼容性函数：获取额外API配置（兼容全局和局部变量）
 */
function getExtraApiConfigForProfile() {
    // 优先使用全局的 getExtraApiConfig 函数（如果存在）
    if (typeof window.getExtraApiConfig === 'function') {
        return window.getExtraApiConfig();
    }
    // 尝试全局变量
    if (window.extraApiConfig) {
        return window.extraApiConfig;
    }
    // 尝试局部变量（在某些HTML文件中定义的）
    if (typeof extraApiConfig !== 'undefined') {
        return extraApiConfig;
    }
    // 都不存在则返回空配置
    return { enabled: false, key: '', endpoint: '', model: '' };
}

/**
 * 初始化用户画像系统
 */
async function initUserProfileSystem() {
    // 从localStorage加载配置
    loadUserProfileConfig();
    // 从localStorage加载用户画像（自动积累的）
    loadUserProfile();

    // 从IndexedDB加载确认的问卷画像
    try {
        await loadUserProfileFromIndexedDB();
        if (confirmedUserProfile) {
            console.log('[🎭用户画像] 已加载问卷画像:', confirmedUserProfile.result?.summary || '已存在');
        }
    } catch (e) {
        console.warn('[🎭用户画像] 加载问卷画像失败:', e);
    }

    // 调试：检查额外API配置
    const extraConfig = getExtraApiConfigForProfile();
    console.log('[🎭用户画像] 系统初始化完成');
    console.log('[🎭用户画像] 功能状态:', userProfileConfig.enabled ? '已启用' : '未启用');
    console.log('[🎭用户画像] 额外API状态:', extraConfig.enabled ? '已启用' : '未启用');
    console.log('[🎭用户画像] 问卷画像:', confirmedUserProfile ? '已存在' : '未创建');
}

/**
 * 加载用户画像配置
 */
function loadUserProfileConfig() {
    const saved = localStorage.getItem('userProfileConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            userProfileConfig = { ...userProfileConfig, ...config };
        } catch (e) {
            console.warn('[🎭用户画像] 加载配置失败:', e);
        }
    }
}

/**
 * 保存用户画像配置
 */
function saveUserProfileConfig() {
    localStorage.setItem('userProfileConfig', JSON.stringify(userProfileConfig));
}

/**
 * 加载用户画像数据
 */
function loadUserProfile() {
    const saved = localStorage.getItem('userProfileData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            userProfileData = { ...userProfileData, ...data };
        } catch (e) {
            console.warn('[🎭用户画像] 加载画像数据失败:', e);
        }
    }
}

/**
 * 保存用户画像数据
 */
function saveUserProfile() {
    userProfileData.stats.lastUpdated = new Date().toISOString();
    localStorage.setItem('userProfileData', JSON.stringify(userProfileData));
}

/**
 * 分析用户输入
 * @param {string} userInput - 用户原始输入
 * @param {object} gameContext - 游戏上下文（可选）
 * @returns {Promise<object>} 分析结果
 */
async function analyzeUserInput(userInput, gameContext = null) {
    if (!userProfileConfig.enabled) {
        return null;
    }

    // 检查额外API是否可用（兼容全局和局部变量）
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        console.warn('[🎭用户画像] 额外API未启用，跳过分析');
        return null;
    }

    if (userProfileConfig.showAnalysis) {
        console.log('[🎭用户画像] 开始分析用户输入:', userInput);
    }

    // 🔄 开始新的追踪轮次
    itemFrequencyTracker.startNewRound();

    try {
        // 🆕 根据记忆调度器模式开关选择不同的消息构建函数
        let messages;
        const isMemoryDispatcherMode = userProfileConfig.memoryDispatcherEnabled || window.memoryDispatcherEnabled;

        if (isMemoryDispatcherMode) {
            console.log('[🧠记忆调度器] 使用记忆调度器模式');
            messages = await buildMemoryDispatcherMessages(userInput, gameContext);
        } else {
            console.log('[🎭用户画像] 使用普通分析模式');
            messages = buildAnalysisMessages(userInput, gameContext);
        }

        // 调用额外API进行分析
        console.log('[🎭用户画像] 正在调用额外API...');
        console.log('[🎭用户画像] 发送的消息:', JSON.stringify(messages).substring(0, 10000) + '...');

        const response = await callExtraAI(messages);

        console.log('[🎭用户画像] 额外API响应成功，长度:', response?.length || 0);

        // 解析分析结果
        const analysisResult = parseAnalysisResponse(response);

        if (analysisResult) {
            // 更新用户画像（如果API返回了）
            if (analysisResult.userProfile) {
                updateUserProfile(analysisResult.userProfile);
            }

            // 添加到分析历史
            addToAnalysisHistory(userInput, analysisResult);

            // 保存用户画像
            saveUserProfile();

            // 🆕 显示分析思维链（不进存档）- 直接显示原始输出
            if (userProfileConfig.showAnalysis) {
                console.log('[🎭用户画像] 分析完成:', analysisResult);
                displayAnalysisReasoning(userInput, analysisResult, response);  // 传入原始响应
            }

            // 🆕 保存分析结果到全局变量，供supply.js标签知识库使用
            window.latestAnalysisResult = analysisResult;
            if (analysisResult.knowledgeTags && analysisResult.knowledgeTags.length > 0) {
                console.log('[🎭用户画像] 知识标签:', analysisResult.knowledgeTags.join(', '));
            }

            // 📚 保存剧情规划到存档
            // 🔧 支持两种结构：直接的 plotPlanning 或 memoryPackage.plotPlanning
            const plotPlanning = analysisResult.plotPlanning ||
                (analysisResult.memoryPackage && analysisResult.memoryPackage.plotPlanning);
            if (plotPlanning && plotPlanning.storyName) {
                plotArchiveManager.addPlot(plotPlanning);
                console.log('[📚剧情存档] 已保存剧情规划:', plotPlanning.storyName);
            }

            // 📚 记录相关剧情名称（如果有）
            if (analysisResult.relatedStoryNames && analysisResult.relatedStoryNames.length > 0) {
                console.log('[📚剧情存档] 相关剧情:', analysisResult.relatedStoryNames.join(', '));
            }

            // 🔄 记录本轮出现的物品/人物/场所（用于频率追踪）
            const extractedItems = extractItemsFromAnalysisResult(analysisResult);
            if (extractedItems.length > 0) {
                itemFrequencyTracker.recordItems(extractedItems);
                console.log('[🔄频率追踪] 本轮提取物品:', extractedItems.join(', '));
            }

            return analysisResult;
        } else {
            console.warn('[🎭用户画像] 解析结果为空，原始响应:', response?.substring(0, 200));
        }
    } catch (error) {
        console.error('[🎭用户画像] 分析失败:', error);
        console.error('[🎭用户画像] 错误详情:', error.message);
    }

    return null;
}

/**
 * 🆕 构建记忆调度器消息
 * 使用主API的完整酒馆预设结构 + 用户问卷偏好 + 记忆包输出格式要求
 */
async function buildMemoryDispatcherMessages(userInput, gameContext) {
    console.log('[🧠记忆调度器] 开始构建消息，使用完整酒馆预设结构...');

    // 1. 获取主API的完整酒馆预设消息结构
    let baseMessages = [];
    if (window.contextVectorManager && typeof window.contextVectorManager.buildOptimizedMessages === 'function') {
        try {
            // 使用主API的完整上下文结构
            const systemPrompt = window.XiuxianGameConfig?.getSystemPrompt?.() || '';
            const variables = window.gameState?.variables || {};
            const historyDepth = 3;  // 🔧 记忆调度器模式改为3层连贯记忆
            const fullHistory = window.gameState?.conversationHistory || [];

            baseMessages = await window.contextVectorManager.buildOptimizedMessages(
                systemPrompt,
                variables,
                userInput,
                historyDepth,
                fullHistory,
                userInput,  // retrievalInput
                true  // 🔧 forFlash=true，跳过纯写作模式检测
            );
            console.log('[🧠记忆调度器] 获取到主API酒馆预设结构，共', baseMessages.length, '条消息');
        } catch (e) {
            console.warn('[🧠记忆调度器] 获取酒馆预设结构失败，回退到简化模式:', e);
        }
    }

    // 2. 如果获取失败，使用简化模式
    if (baseMessages.length === 0) {
        baseMessages = buildMemoryDispatcherMessagesSimple(userInput, gameContext);
    }

    // 📱 3. 获取最近活跃的手机聊天记录
    let mobileChatContext = '';
    if (typeof window.getRecentActiveMobileChats === 'function') {
        try {
            const recentChats = window.getRecentActiveMobileChats(3, 50);  // 3个聊天，各50条
            if (recentChats && recentChats.length > 0) {
                mobileChatContext = '\n\n【📱 手机聊天记录】\n';
                mobileChatContext += `以下是最近活跃的${recentChats.length}个聊天的消息记录：\n`;

                recentChats.forEach(chat => {
                    const chatType = chat.type === 'group' ? '群聊' : '私聊';
                    mobileChatContext += `\n【${chat.name}】（${chatType}，共${chat.messageCount}条）\n`;

                    chat.messages.forEach(msg => {
                        const direction = msg.direction === 'outgoing' ? '→' : '←';
                        const sender = msg.sender || (msg.direction === 'outgoing' ? '我' : chat.name);
                        mobileChatContext += `${direction} ${sender}：${msg.content}\n`;
                    });
                });

                console.log(`[🧠记忆调度器] 已添加 ${recentChats.length} 个聊天的手机消息上下文`);
            }
        } catch (e) {
            console.warn('[🧠记忆调度器] 获取手机聊天记录失败:', e);
        }
    }

    // 4. 添加用户问卷偏好
    let userProfilePrompt = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        userProfilePrompt = `\n\n【⭐ 用户偏好画像】
文风偏好：${cp.writingStyle || '未指定'}
故事基调：${cp.storyTone || '未指定'}
喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '未指定'}
不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '未指定'}`;
    }

    // 5. 添加记忆包输出格式要求
    const memoryPackageInstruction = getMemoryDispatcherPrompt();

    // 6. 构建最终消息：在基础消息之后追加记忆调度器专用指令
    const finalMessages = [
        ...baseMessages
    ];

    // 📱 6.1 在最近连贯记忆后插入手机聊天记录（作为独立消息块）
    if (mobileChatContext) {
        finalMessages.push({
            role: 'assistant',
            content: mobileChatContext
        });
    }

    // 6.2 添加最终的用户指令消息
    finalMessages.push({
        role: 'user',
        content: `${memoryPackageInstruction}${userProfilePrompt}

【用户当前输入】
"${userInput}"

【重要】请根据上述完整上下文，生成结构化的JSON记忆包。你必须：
1. 分析用户意图，判断需要调用哪些记忆（人物、场所、物品）
2. 从上述信息中精准提取相关内容填入记忆包
3. 如果手机聊天记录中有与当前场景相关的对话，请将其纳入记忆包
4. 生成结构化的JSON记忆包
5. 使用坚定的语气，这是给主AI的强制性指令！`
    });

    console.log('[🧠记忆调度器] 消息构建完成，共', finalMessages.length, '条消息');
    return finalMessages;
}

/**
 * 简化版记忆调度器消息构建（回退方案）
 * 🆕 已集成GraphRAG-Lite：用语义检索替代History矩阵，保留3层历史
 */
async function buildMemoryDispatcherMessagesSimple(userInput, gameContext) {
    // 使用记忆调度器专用提示词
    let systemPrompt = getMemoryDispatcherPrompt();

    // 构建上下文信息
    let contextInfo = '';
    if (gameContext) {
        contextInfo = `\n\n【当前游戏状态】\n位置：${gameContext.currentLocation || '未知'}\n角色：${gameContext.characterName || '未知'}\n境界：${gameContext.realm || '凡人'}`;
    }

    // 🆕 改为只保留3层历史正文（GraphRAG负责更远的记忆）
    let recentStoryContext = '';
    const memoryDispatcherHistoryDepth = 3;  // 从10层改为3层

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
            recentStoryContext = '\n\n【最近剧情发展】（最近' + recentStories.length + '层AI正文）\n';
            recentStories.forEach((story, idx) => {
                recentStoryContext += `[第${idx + 1}层] ${story}\n\n`;
            });
        }
    }

    // 🆕 使用GraphRAG-Lite语义检索替代History矩阵
    let graphRAGContext = '';
    if (window.graphRAGLite && window.graphRAGLite.config?.enabled && window.graphRAGLite.entities?.size > 0) {
        try {
            // 获取最近AI回复作为检索依据
            let lastAIReply = '';
            if (window.gameState?.conversationHistory) {
                const history = window.gameState.conversationHistory;
                const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
                lastAIReply = lastAI?.content?.substring(0, 500) || '';
            }

            // 调用GraphRAG构建语义上下文
            graphRAGContext = await window.graphRAGLite.buildContext(userInput, lastAIReply);
            if (graphRAGContext) {
                graphRAGContext = '\n\n【🧠 GraphRAG语义关联】\n' + graphRAGContext;
                console.log('[🧠记忆调度器] GraphRAG检索完成，找到相关实体和关系');
            }
        } catch (e) {
            console.warn('[🧠记忆调度器] GraphRAG检索失败:', e);
        }
    }

    // 🔧 如果GraphRAG未启用或无数据，回退到History矩阵
    let matrixHistoryContext = '';
    if (!graphRAGContext && window.matrixManager && window.matrixManager.historyMatrix && window.matrixManager.historyMatrix.layers) {
        const layers = window.matrixManager.historyMatrix.layers;
        if (layers.length > 0) {
            matrixHistoryContext = '\n\n【⭐ 历史记忆矩阵（回退模式）】\n';
            matrixHistoryContext += `共${layers.length}个话题层：\n`;
            // 只取最近5层，避免过长
            const recentLayers = layers.slice(-5);
            recentLayers.forEach((layer) => {
                matrixHistoryContext += `\n📂 话题${layer.id}：${layer.topic}（${layer.vectors.length}条记录）\n`;
                // 每层只取最近2条
                layer.vectors.slice(-2).forEach(v => {
                    const content = v.aiResponse || v.content || '';
                    if (content) {
                        matrixHistoryContext += `  └ ${content.substring(0, 200)}...\n`;
                    }
                });
            });
        }
    }

    // 获取完整变量表单
    let fullVariablesContext = '';
    if (window.gameState && window.gameState.variables) {
        const variables = window.gameState.variables;
        fullVariablesContext = '\n\n【完整变量表单】\n```json\n' + JSON.stringify(variables, null, 2) + '\n```';

        if (variables.relationships && Array.isArray(variables.relationships)) {
            fullVariablesContext += `\n\n【⭐ 人物关系详情】共${variables.relationships.length}人:\n`;
            variables.relationships.forEach(rel => {
                fullVariablesContext += `\n【${rel.name}】 ${rel.relation || ''}`;
                if (rel.age) fullVariablesContext += ` | 年龄:${rel.age}`;
                if (rel.personality) fullVariablesContext += ` | 性格:${rel.personality}`;
                if (rel.appearance) fullVariablesContext += ` | 外貌:${rel.appearance}`;
                if (rel.favor !== undefined) fullVariablesContext += ` | 好感度:${rel.favor}`;
                if (Array.isArray(rel.history) && rel.history.length > 0) {
                    fullVariablesContext += `\n  互动记录: ${rel.history.slice(-3).join('; ')}`;
                }
                fullVariablesContext += '\n';
            });
        }
    }

    // 添加用户确认的问卷画像
    let confirmedProfileInfo = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        confirmedProfileInfo = `\n\n【⭐ 用户偏好画像】
文风偏好：${cp.writingStyle || '未指定'}
故事基调：${cp.storyTone || '未指定'}
喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '未指定'}
不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '未指定'}`;
    }

    // 剧情存档
    let plotArchiveContext = '';
    const allPlotNames = plotArchiveManager.getAllPlotNames();
    if (allPlotNames.length > 0) {
        plotArchiveContext = '\n\n【📚 历史剧情存档】\n';
        const displayNames = allPlotNames.slice(-20);
        displayNames.forEach((name, idx) => {
            plotArchiveContext += `${idx + 1}. ${name}\n`;
        });
    }

    // 🆕 构建最终上下文（优先使用GraphRAG，否则用矩阵）
    const semanticContext = graphRAGContext || matrixHistoryContext;

    const messages = [
        {
            role: 'system',
            content: systemPrompt + confirmedProfileInfo
        },
        {
            role: 'user',
            content: `请分析以下用户输入并生成记忆包：\n\n"${userInput}"${contextInfo}${recentStoryContext}${semanticContext}${plotArchiveContext}${fullVariablesContext}\n\n【重要】你必须：\n1. 分析用户意图，判断需要调用哪些记忆（人物、场所、物品）\n2. 从上述信息中精准提取相关内容填入记忆包\n3. 如果有GraphRAG语义关联，特别注意通过维度发现的隐含联系\n4. 生成结构化的JSON记忆包\n5. 使用坚定的语气，这是给主AI的强制性指令！`
        }
    ];

    console.log('[🧠记忆调度器] 简化模式消息构建完成', graphRAGContext ? '(GraphRAG模式)' : '(矩阵回退模式)');
    return messages;
}

/**
 * 构建分析消息
 */
function buildAnalysisMessages(userInput, gameContext) {
    // 🔧 强制使用默认提示词，确保包含storyName和relatedStoryNames字段
    // 用户自定义的analysisPrompt可能是旧版，缺少这些必要字段
    let systemPrompt = getDefaultAnalysisPrompt();
    console.log('[🎭用户画像] 使用默认分析提示词（包含storyName和relatedStoryNames）');

    // 🆕 强制追加知识标签目录（无论使用什么提示词模板）
    if (window.tagKnowledgeManager && window.tagKnowledgeManager.isLoaded()) {
        const catalog = window.tagKnowledgeManager.getCatalog();
        if (catalog.length > 0 && !systemPrompt.includes('knowledgeTags')) {
            // 追加知识标签生成指令
            const tagInstruction = `

【🏷️ 知识标签库】
以下是可用的知识标签，请根据用户输入和剧情内容，在输出JSON中添加 "knowledgeTags": ["匹配的标签"] 字段：
${catalog.join('、')}

【知识标签生成规则】
1. 根据用户输入和剧情内容，判断是否涉及知识库中的标签
2. 如果涉及相关内容，在JSON输出中添加 knowledgeTags 数组
3. 如果没有相关内容，knowledgeTags 设为空数组 []`;
            systemPrompt += tagInstruction;
            console.log('[🎭用户画像] 已追加知识标签目录，共', catalog.length, '个标签');
        }
    }


    // 构建上下文信息
    let contextInfo = '';
    if (gameContext) {
        contextInfo = `\n\n【当前游戏状态】\n位置：${gameContext.currentLocation || '未知'}\n角色：${gameContext.characterName || '未知'}\n境界：${gameContext.realm || '凡人'}`;
    }

    // 🆕 获取最近几层AI正文作为剧情上下文（不包含用户输入）
    let recentStoryContext = '';
    const historyDepth = userProfileConfig.analysisHistoryDepth || 3; // 默认3层

    if (window.gameState && window.gameState.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const recentStories = [];

        // 从后往前遍历，只收集AI的剧情正文
        let layerCount = 0;
        for (let i = history.length - 1; i >= 0 && layerCount < historyDepth; i--) {
            const msg = history[i];
            if (msg.role === 'assistant' && msg.content) {
                // 提取AI回复中的story部分（如果是JSON格式）
                let storyContent = msg.content;
                try {
                    // 尝试解析JSON提取story
                    const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.story) {
                            storyContent = parsed.story;
                        }
                    }
                } catch (e) {
                    // 解析失败就用原始内容
                }
                // 截取前4500字符避免过长（之前是500，太短会丢失关键剧情）
                recentStories.unshift(storyContent.substring(0, 4500) + (storyContent.length > 4500 ? '...' : ''));
                layerCount++;
            }
        }

        if (recentStories.length > 0) {
            recentStoryContext = '\n\n【最近剧情发展】（最近' + recentStories.length + '层AI正文）\n';
            recentStories.forEach((story, idx) => {
                recentStoryContext += `[第${idx + 1}层] ${story}\n\n`;
            });
        }
    }

    // 🆕 获取历史矩阵层内容（帮助分析更早的剧情线索）
    let matrixHistoryContext = '';
    const matrixDepth = userProfileConfig.matrixHistoryDepth || 5;

    if (window.matrixManager && window.matrixManager.historyMatrix && window.matrixManager.historyMatrix.layers) {
        const layers = window.matrixManager.historyMatrix.layers;

        if (layers.length > 0) {
            // 获取最近的几个层
            const recentLayers = layers.slice(-matrixDepth);

            matrixHistoryContext = '\n\n【⭐ 历史记忆矩阵（更早的剧情线索）】\n';
            matrixHistoryContext += `共${layers.length}个话题层，显示最近${recentLayers.length}层：\n`;

            recentLayers.forEach((layer, idx) => {
                matrixHistoryContext += `\n📂 话题${layer.id}：${layer.topic}（${layer.vectors.length}条记录）\n`;

                // 从每层取最近2条记录的摘要
                const recentVectors = layer.vectors.slice(-2);
                recentVectors.forEach(v => {
                    const content = v.aiResponse || v.content || '';
                    if (content) {
                        // 提取前150字符作为摘要
                        const summary = content.substring(0, 150).replace(/\n/g, ' ');
                        matrixHistoryContext += `  └ ${summary}${content.length > 150 ? '...' : ''}\n`;
                    }
                });
            });

            matrixHistoryContext += '\n⚠️ 这些是更早的历史记忆，主AI能看到完整内容。请从中提取可能相关的关键词和伏笔线索！\n';
        }
    }

    // 📚 添加历史剧情存档名称（供分析AI选择相关剧情）
    let plotArchiveContext = '';
    const allPlotNames = plotArchiveManager.getAllPlotNames();
    if (allPlotNames.length > 0) {
        plotArchiveContext = '\n\n【📚 历史剧情存档】\n';
        plotArchiveContext += `共有${allPlotNames.length}个剧情存档，请从中选择最多3个与当前场景相关的剧情名称填入relatedStoryNames：\n`;
        // 最多显示最近20个剧情名称
        const displayNames = allPlotNames.slice(-20);
        displayNames.forEach((name, idx) => {
            plotArchiveContext += `${idx + 1}. ${name}\n`;
        });
        plotArchiveContext += '\n提示：选择与当前场景、人物或情节相关的剧情，帮助主AI回顾历史线索。\n';
    }

    // 🔧 移除：不再发送自动积累的用户画像给分析API
    // 这些数据仅用于本地统计，不需要发送给额外API
    let profileHistory = '';

    // 🆕 添加用户确认的问卷画像（最重要的参考）
    let confirmedProfileInfo = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        confirmedProfileInfo = `\n\n【⭐ 用户确认的偏好画像（重要参考！）】
用户特点：${cp.summary || '未指定'}

【剧情风格】
剧情类型：${cp.storyPreference || '未指定'}
故事基调：${cp.storyTone || '未指定'}
剧情结构：${cp.storyStructure || '未指定'}
节奏偏好：${cp.pacing || '未指定'}
反转偏好：${cp.plotTwistPreference || '未指定'}
冲突类型：${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes || '未指定'}

【文风描写】
文风偏好：${cp.writingStyle || '未指定'}
喜欢的作品：${cp.favoriteWorks || '未填写'}
文风详细要求：${cp.writingStyleDetails || '无'}
对话风格：${cp.dialogueStyle || '未指定'}
回复详细度：${cp.detailLevel || '未指定'}
描写重点：${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || '未指定'}
叙事手法：${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle || '未指定'}
用词风格：${cp.languageStyle || '未指定'}

【角色互动】
主角类型：${cp.protagonistType || '未指定'}
主角性格：${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality || '未指定'}
主角背景：${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground || '未指定'}
喜欢角色：${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || '未指定'}
关系类型：${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes || '未指定'}
关系深度：${cp.relationshipDepth || '未指定'}
感情线：${cp.haremPreference || '未指定'}
NPC风格：${cp.npcStyle || '未指定'}
NPC互动频率：${cp.interactionFrequency || '未指定'}

【战斗与挑战】
难度偏好：${cp.difficulty || '未指定'}
战斗风格：${cp.combatStyle || '未指定'}
战斗元素：${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements || '未指定'}
爽感需求：${cp.powerFantasy || '未指定'}
敌人类型：${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes || '未指定'}
成长速度：${cp.growthSpeed || '未指定'}
失败后果：${cp.consequenceLevel || '未指定'}

【世界与内容】
世界观兴趣：${cp.worldBuilding || '未指定'}
世界元素：${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements || '未指定'}
道德选择：${cp.moralChoices || '未指定'}
R18偏好：${cp.r18Preference || '未指定'}
R18类型：${Array.isArray(cp.r18Elements) ? cp.r18Elements.join('、') : cp.r18Elements || '未指定'}
情感取向：${Array.isArray(cp.emotionalOrientation) ? cp.emotionalOrientation.join('、') : cp.emotionalOrientation || '未指定'}
身体部位偏好：${Array.isArray(cp.favoriteBodyParts) ? cp.favoriteBodyParts.join('、') : cp.favoriteBodyParts || '未指定'}
特殊play：${Array.isArray(cp.specialPlay) ? cp.specialPlay.join('、') : cp.specialPlay || '未指定'}
攻受偏好：${cp.sexRolePreference || '未指定'}
服装偏好：${Array.isArray(cp.costumePreference) ? cp.costumePreference.join('、') : cp.costumePreference || '未指定'}
结局偏好：${cp.endingPreference || '未指定'}

【特殊偏好】
叙事人称：${cp.immersionStyle || '未指定'}
AI创作自由度：${cp.aiCreativity || '未指定'}
幽默风格：${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle || '未指定'}
时间跳跃：${cp.timeSkipPreference || '未指定'}
系统融入：${cp.systemIntegration || '未指定'}

喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '未指定'}
不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '未指定'}
特别注意：${cp.specialNotes || '无'}

【AI创作指南（务必遵守！）】
${cp.aiGuidelines || '按照用户偏好生成内容'}`;

        console.log('[🎭用户画像] 已将问卷画像加入分析上下文');
    }

    const messages = [
        {
            role: 'system',
            content: systemPrompt + confirmedProfileInfo + profileHistory
        },
        {
            role: 'user',
            content: `请分析以下用户输入：\n\n"${userInput}"${contextInfo}${recentStoryContext}${matrixHistoryContext}${plotArchiveContext}\n\n【重要 - 必须遵守！】\n1. 剧情规划必须紧密承接「最近剧情发展」的最后一层内容\n2. 如果「游戏状态」中的位置与「最近剧情发展」的场景不一致，以「最近剧情发展」为准！\n3. 从「历史记忆矩阵」中提取相关关键词和伏笔\n4. 请参考用户偏好画像来调整剧情风格\n5. 从「历史剧情存档」中选择3个与当前上下文相关的剧情名称作为relatedStoryNames\n\n请按照指定的JSON格式输出分析结果。`
        }
    ];

    return messages;
}

/**
 * 获取默认分析提示词
 */
function getDefaultAnalysisPrompt() {
    // 获取知识标签目录（如果已加载）
    let knowledgeTagsHint = '';
    if (window.tagKnowledgeManager && window.tagKnowledgeManager.isLoaded()) {
        const catalog = window.tagKnowledgeManager.getCatalog();
        if (catalog.length > 0) {
            knowledgeTagsHint = `\n\n【知识标签库】\n以下是可用的知识标签，如果用户输入涉及相关内容，请在knowledgeTags中列出匹配的标签：\n${catalog.join('、')}\n`;
        }
    }

    return `你是用户输入分析师。任务：分析意图→紧密承接最近剧情→规划三步剧情→生成知识标签。输出务必精简！

【核心原则：剧情必须紧密承接！】
你会收到「最近剧情发展」内容，这是最重要的参考！

【场景冲突处理 - 极其重要！】
如果「游戏状态」的位置与「最近剧情发展」的场景不一致：
→ 必须以「最近剧情发展」中描述的场景为准！
→ 「游戏状态」可能是过时的数据，不可信！
→ 例如：游戏状态说在商店，但最近剧情在战斗，那就是在战斗中！
禁止：忽略最近剧情、跳跃式发展、凭空引入新元素
必须：紧密承接上一层剧情的结尾，自然延续当前场景和状态
${knowledgeTagsHint}
【输出格式（JSON）】
{
  "analysis": {
    "intent": "用户意图（20字内）",
    "emotionalTone": "情感基调（5字内）"
  },
  "recentStoryAnalysis": {
    "lastSceneSummary": "最后一层剧情的场景/状态（30-50字）",
    "ongoingAction": "正在进行的动作/对话（20-40字）",
    "continueFrom": "应该从这里接续：XXX（明确承接点）"
  },
  "memorySearch": {
    "keywords": ["从历史矩阵中提取的关键词：角色名、地点、物品、事件"],
    "unresolvedPlots": ["从历史矩阵中发现的伏笔/悬念"],
    "searchHint": "告诉主AI需要回顾什么（结合历史矩阵内容）"
  },
  "plotPlanning": {
    "storyName": "剧情名称（格式：YYYY/MM/DD HH:MM 简短描述，如'2026/01/08 12:30 早上的课程'）",
    "step1": "剧情第一步（20-40字，⭐必须承接最近剧情结尾！用叙事句式！）",
    "step2": "剧情第二步（20-40字，用叙事句式！）",
    "step3": "剧情第三步/高潮（20-40字，用叙事句式！）",
    "reasoning": "为什么这样规划（与最近剧情的关联）"
  },
  "relatedStoryNames": ["从历史剧情存档中选择的3个相关剧情名称，如无相关则留空"],
  "knowledgeTags": ["匹配的知识标签，如：传教式、后入式、浴室式等"]
}

【剧情规划写法 - 必须主观叙事+第三人称！】
剧情三步必须用第三人称+主观叙事句式，直接描述将要发生的事！
错误（太客观）："描写塞莱斯汀在晨雾中立于塔前，细述其外貌"
正确（第三人称叙事）："塞莱斯汀在晨雾中立于塔前，精灵纤弱的脊背在寒风中微颤"
禁止使用："描写"、"细述"、"展现"、"描绘"、"表现"等元叙事词汇
禁止使用：第一人称"我"、第二人称"你"，必须用角色名或"她/他"
直接写成第三人称故事概要的形式，像在讲述即将发生的事

【知识标签生成规则】
1. 根据用户输入和剧情内容，判断是否涉及知识库中的标签
2. 优先匹配用户明确提到的内容（如"传教式"、"后入"等）
3. 也可以根据剧情场景推断可能用到的标签（如浴室场景→浴室式）
4. 如果没有相关内容，knowledgeTags留空数组 []
5. 标签必须是知识标签库中存在的标签

【知识标签运用 - 极其重要！】
如果knowledgeTags中有内容，且你认为这些标签与当前上下文相关或对剧情有用：
请务必将这些标签所代表的玩法、体位或场景，自然地编织进plotPlanning的剧情三步中！
让标签不仅仅是标签，而是真正推动剧情发展的元素。

【最近剧情分析原则 - 绝对最重要！！！】
这是你最核心的任务，违反以下原则等于任务失败：

1. 【仔细阅读】必须逐字阅读「最近剧情发展」的每一层，尤其是最后一层！
2. 【场景定位】识别最后一层的：当前场景在哪里、人物在做什么、有没有未完成的对话
3. 【无缝承接】剧情规划的step1必须直接承接最后一层的结尾，绝对不能跳跃！
4. 【延续未完】如果最近剧情中有对话未说完、动作未完成，必须先延续完成再发展新内容
5. 【自然过渡】新剧情的开头必须与上文自然衔接，严禁"突然转场"


【正确做法】
正确：最近剧情在"豪华酒店调情"，step1继续"酒店房间内的互动深入"
正确：最近剧情在"战斗中"，step1继续"战斗的下一个回合"
正确：最近剧情"正在对话"，step1继续"对话的自然延续"

再次强调：你必须100%基于「最近剧情发展」的实际内容来规划，不能臆想场景！


【分析原则】
1. 保持用户原意，不要过度解读
2. 剧情规划每步20-40字，用主观叙事句式，禁止元叙事词汇
3. 优先参考「最近剧情发展」，再参考「历史记忆矩阵」

【记忆搜索原则】
1. 从历史矩阵的话题和内容中提取关键词（角色名、地点、物品、事件）
2. 识别历史矩阵中可能与当前剧情相关的伏笔
3. searchHint要明确告诉主AI需要回顾的历史内容`;
}


/**
 * 🆕 获取记忆调度器专用提示词
 * 用于生成精炼的"记忆包"供主API使用，主API将不再看原始历史
 */
function getMemoryDispatcherPrompt() {
    let basePrompt = `你是【记忆调度器】，负责从大量历史记录中精准提取信息，打包成"记忆包"供主AI写作。

【核心任务】
用户即将进行某个行动，你需要：
1. 分析用户意图，判断需要调用哪些记忆
2. 从历史记录和变量表单中精准提取相关信息
3. 打包成结构化的"记忆包"
4. 主AI将只看你的记忆包，不再看原始历史！

【记忆包是强制性指令！】
你输出的每一条信息，主AI必须严格遵守，不得擅自修改或臆想。

【输出格式（JSON）】
{
  "memoryPackage": {
    "characterSnapshot": {
      "instruction": "【强制】主角当前状态，必须延续此状态开始写作",
      "protagonist": {
        "currentState": "主角当前状态",
        "lastAction": "主角上一个动作",
        "mood": "主角心情"
      },
      "presentNPCs": []
    },
    "requiredCharacters": {
      "instruction": "【强制】以下人物必须按此设定描写，禁止修改性格/外貌/关系",
      "characters": []
    },
    "requiredItems": {
      "instruction": "【强制】提到以下物品/场所时，必须按此描述",
      "items": []
    },
    "keyMemories": {
      "instruction": "【参考】可自然融入剧情的历史记忆",
      "memories": []
    },
    "plotProgression": {
      "instruction": "【建议】根据用户输入自然推进剧情，不要刻意制造转折或悬念",
      "trigger": "用户行为是什么（如：回到家）",
      "naturalFlow": "该行为之后最自然后续",
      "environmentChanges": "场景环境的自然状态",
      "tone": "当前场景的自然氛围基调"
    },
    "userPreferences": {
      "instruction": "【参考】用户偏好",
      "writingStyle": "文风",
      "storyTone": "基调",
      "likes": [],
      "dislikes": []
    }
  }
}

【记忆提取原则】
1. 从「最近剧情发展」确定当前场景，如有冲突以「最近剧情发展」为准
2. 用户说"回寝室" → 必须提取室友信息；用户说"找师姐" → 必须提取师姐完整设定
3. 用户说"回家" → 必须提取"家"的设定（装修、物品等）

【🎬 后续剧情推进规则 - 极其重要！】
剧情推进的核心原则是【自然】，不要刻意制造转折、悬念或突发事件！
1. 分析用户行为（如"回到家"、"去学校"），推断该行为之后最自然、最日常的状态
2. 不要每次都塞入"收到消息"、"有人敲门"、"发现异常"等转折事件
3. 日常场景就写日常，安静场景就保持安静，不要强行制造戏剧冲突
4. 只有当历史剧情中确实有未完成的紧急事件时，才在推进中提及
5. environmentChanges只描述场景的自然状态，不要刻意加入"发现某某东西"之类的悬念

【特别注意】
- 你的输出是主AI的唯一参考，务必全面、准确
- 遗漏重要信息会导致主AI写出与历史冲突的内容
- plotProgression不要凭空编造新事件，只描述自然状态
- 使用坚定的语气，不要说\"可能\"、\"大概\"`;

    // 🔄 动态添加高频物品抑制提示
    const highFreqItems = itemFrequencyTracker.getHighFrequencyItems();
    if (highFreqItems.length > 0) {
        const suppressList = highFreqItems.filter(i => i.count >= 3).map(i => i.name);
        if (suppressList.length > 0) {
            basePrompt += `

【⚠️ 高频物品抑制规则】
以下物品/场所已连续出现多轮，除非用户明确提到，否则请勿再次列入记忆包：
${suppressList.map(name => `- "${name}" (已连续${highFreqItems.find(i => i.name === name)?.count || 3}轮)`).join('\n')}

原则：只提取与【当前用户意图】直接相关的物品！不要机械性复制所有物品。`;
        }
    }

    return basePrompt;
}

/**
 * 🔄 从分析结果中提取物品/人物/场所名称
 * 用于频率追踪
 */
function extractItemsFromAnalysisResult(analysisResult) {
    const items = [];

    if (!analysisResult) return items;

    // 从记忆包结构中提取
    const mp = analysisResult.memoryPackage;
    if (mp) {
        // 提取物品
        if (mp.requiredItems?.items) {
            mp.requiredItems.items.forEach(item => {
                if (item.name) items.push(item.name);
            });
        }

        // 提取人物
        if (mp.requiredCharacters?.characters) {
            mp.requiredCharacters.characters.forEach(char => {
                if (char.name) items.push(char.name);
            });
        }

        // 提取场景中的NPC
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

    // 从普通分析结构中提取关键词
    if (analysisResult.memorySearch?.keywords) {
        items.push(...analysisResult.memorySearch.keywords);
    }

    // 去重
    return [...new Set(items)];
}

/**
 * 解析分析响应
 */
function parseAnalysisResponse(response) {
    if (!response) return null;

    try {
        // 尝试直接解析JSON
        let jsonStr = response;

        // 如果响应包含markdown代码块，提取JSON
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // 尝试找到JSON对象
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }

        const result = JSON.parse(jsonStr);
        return result;
    } catch (e) {
        console.warn('[🎭用户画像] 解析分析结果失败:', e);
        console.log('[🎭用户画像] 原始响应:', response);
        return null;
    }
}

/**
 * 更新用户画像
 */
function updateUserProfile(newProfile) {
    if (!newProfile) return;

    // 更新统计
    userProfileData.stats.totalInputs++;

    // 合并偏好（去重）
    if (newProfile.preferences && Array.isArray(newProfile.preferences)) {
        newProfile.preferences.forEach(pref => {
            if (pref && !userProfileData.preferences.includes(pref)) {
                userProfileData.preferences.push(pref);
            }
        });
        // 只保留最近20个偏好
        if (userProfileData.preferences.length > 20) {
            userProfileData.preferences = userProfileData.preferences.slice(-20);
        }
    }

    // 合并不喜欢的内容（去重）
    if (newProfile.dislikes && Array.isArray(newProfile.dislikes)) {
        newProfile.dislikes.forEach(dislike => {
            if (dislike && !userProfileData.dislikes.includes(dislike)) {
                userProfileData.dislikes.push(dislike);
            }
        });
        // 只保留最近10个
        if (userProfileData.dislikes.length > 10) {
            userProfileData.dislikes = userProfileData.dislikes.slice(-10);
        }
    }

    // 更新其他属性（如果有新值）
    if (newProfile.writingStyle && newProfile.writingStyle !== '未确定') {
        userProfileData.writingStyle = newProfile.writingStyle;
    }
    if (newProfile.contentPreference && newProfile.contentPreference !== '未确定') {
        userProfileData.contentPreference = newProfile.contentPreference;
        // 更新内容类型统计
        const pref = newProfile.contentPreference.toLowerCase();
        if (pref.includes('r18') || pref.includes('色情')) {
            userProfileData.stats.r18Inputs++;
        } else if (pref.includes('战斗') || pref.includes('战争')) {
            userProfileData.stats.combatInputs++;
        } else if (pref.includes('社交') || pref.includes('对话')) {
            userProfileData.stats.socialInputs++;
        } else if (pref.includes('探索') || pref.includes('冒险')) {
            userProfileData.stats.explorationInputs++;
        }
    }
    if (newProfile.literacyLevel && newProfile.literacyLevel !== '未确定') {
        userProfileData.literacyLevel = newProfile.literacyLevel;
    }
    if (newProfile.interactionPattern && newProfile.interactionPattern !== '未确定') {
        userProfileData.interactionPattern = newProfile.interactionPattern;
    }

    // 添加观察笔记
    if (newProfile.notes && newProfile.notes.length > 0) {
        const noteStr = typeof newProfile.notes === 'string' ? newProfile.notes : JSON.stringify(newProfile.notes);
        if (!userProfileData.notes.includes(noteStr)) {
            userProfileData.notes.push(noteStr);
        }
        // 只保留最近20条笔记
        if (userProfileData.notes.length > 20) {
            userProfileData.notes = userProfileData.notes.slice(-20);
        }
    }
}

/**
 * 添加到分析历史
 */
function addToAnalysisHistory(userInput, analysisResult) {
    userProfileData.analysisHistory.push({
        timestamp: new Date().toISOString(),
        input: userInput,
        result: analysisResult
    });

    // 只保留最近10次分析
    if (userProfileData.analysisHistory.length > 10) {
        userProfileData.analysisHistory = userProfileData.analysisHistory.slice(-10);
    }
}

/**
 * 为主API生成增强提示词
 * 🆕 记忆调度器模式下返回完整的记忆包
 * @param {object} analysisResult - 分析结果
 * @returns {string} 增强提示词
 */
function getEnhancedPromptForMainAPI(analysisResult) {
    if (!analysisResult) return '';

    // 🆕 记忆调度器模式：返回完整记忆包
    const isMemoryDispatcherMode = userProfileConfig.memoryDispatcherEnabled || window.memoryDispatcherEnabled;
    if (isMemoryDispatcherMode && analysisResult.memoryPackage) {
        console.log('[🧠记忆调度器] 返回完整记忆包作为增强提示词');

        // 🔄 强制过滤高频物品（不依赖AI遵守规则）
        const filteredPackage = filterHighFrequencyItemsFromPackage(analysisResult.memoryPackage);

        return '【🧠 记忆包（来自记忆调度器的强制性指令）】\n' +
            JSON.stringify(filteredPackage, null, 2);
    }

    let prompt = '';

    // 1. 记忆搜索提示（最重要！让主API知道需要回顾哪些历史）
    if (analysisResult.memorySearch) {
        const ms = analysisResult.memorySearch;
        if (ms.searchHint) {
            prompt += `【⭐记忆回顾】${ms.searchHint}\n`;
        }
        if (ms.keywords && ms.keywords.length > 0 && ms.keywords[0] !== '需要在历史记忆中搜索的关键词：角色名、地点、物品、事件、势力等') {
            prompt += `关键词：${ms.keywords.join('、')}\n`;
        }
        if (ms.unresolvedPlots && ms.unresolvedPlots.length > 0 && ms.unresolvedPlots[0] !== '可能涉及的未解决伏笔或悬念') {
            prompt += `伏笔：${ms.unresolvedPlots.join('；')}\n`;
        }
    }

    // 2. 简洁的剧情规划（三步走向）
    if (analysisResult.plotPlanning) {
        const pp = analysisResult.plotPlanning;
        prompt += `【剧情走向】`;
        prompt += `①${pp.step1 || ''} `;
        prompt += `②${pp.step2 || ''} `;
        prompt += `③${pp.step3 || ''}\n`;
    }

    // 3. 核心意图（一句话）
    if (analysisResult.analysis && analysisResult.analysis.intent) {
        prompt += `【意图】${analysisResult.analysis.intent}\n`;
    }

    // 4. 情感基调
    if (analysisResult.analysis && analysisResult.analysis.emotionalTone) {
        prompt += `【基调】${analysisResult.analysis.emotionalTone}\n`;
    }

    // 5. 用户画像关键点（精简版，只在有问卷画像时添加）
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        let profileHints = [];
        if (cp.writingStyle) profileHints.push(`文风:${cp.writingStyle}`);
        if (cp.storyTone) profileHints.push(`基调:${cp.storyTone}`);
        if (cp.detailLevel) profileHints.push(`字数:${cp.detailLevel}`);
        if (profileHints.length > 0) {
            prompt += `【偏好】${profileHints.join('｜')}\n`;
        }
        // 喜欢/不喜欢的精简版
        if (cp.likes && Array.isArray(cp.likes) && cp.likes.length > 0) {
            prompt += `【要】${cp.likes.slice(0, 3).join('、')}\n`;
        }
        if (cp.dislikes && Array.isArray(cp.dislikes) && cp.dislikes.length > 0) {
            prompt += `【避】${cp.dislikes.slice(0, 3).join('、')}\n`;
        }
    }

    return prompt;
}

/**
 * 📚 获取剧情存档增强提示词（供主API使用）
 * 根据分析结果中的relatedStoryNames，检索对应剧情的三步规划
 * @param {object} analysisResult - 分析结果
 * @returns {string} 剧情存档相关的增强提示词
 */
function getEnhancedPromptWithPlotArchive(analysisResult) {
    if (!analysisResult) return '';

    let prompt = '';

    // 检查是否有relatedStoryNames
    if (analysisResult.relatedStoryNames && analysisResult.relatedStoryNames.length > 0) {
        const relatedPlots = plotArchiveManager.getPlotsForContext(analysisResult.relatedStoryNames);

        if (relatedPlots.length > 0) {
            prompt += '【📚 相关历史剧情回顾】\n';
            prompt += '以下是与当前场景相关的历史剧情规划，请在创作时适当参考或呼应：\n\n';

            relatedPlots.forEach((plot, idx) => {
                prompt += `${idx + 1}. ${plot.storyName}\n`;
                prompt += `   ①${plot.step1}\n`;
                prompt += `   ②${plot.step2}\n`;
                prompt += `   ③${plot.step3}\n\n`;
            });

            console.log('[📚剧情存档] 已注入', relatedPlots.length, '条相关剧情到上下文');
        }
    }

    return prompt;
}

// 暴露函数到全局（供supply.js调用）
window.getEnhancedPromptWithPlotArchive = getEnhancedPromptWithPlotArchive;

/**
 * 获取用户画像的格式化文本
 */
function getFormattedUserProfile() {
    const profile = userProfileData;

    let text = `═══════════════════════════════════════\n`;
    text += `              🎭 用户画像报告\n`;
    text += `═══════════════════════════════════════\n\n`;

    // 🆕 优先显示问卷画像
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        text += `问卷画像（主要参考）\n`;
        text += `────────────────────────────────────────\n`;
        text += `用户特点：${cp.summary || '未指定'}\n\n`;

        text += `【剧情偏好】\n`;
        text += `剧情类型：${cp.storyPreference || '未指定'}\n`;
        text += `故事基调：${cp.storyTone || '未指定'}\n`;
        text += `剧情结构：${cp.storyStructure || '未指定'}\n`;
        text += `节奏偏好：${cp.pacing || '未指定'}\n`;
        text += `反转偏好：${cp.plotTwistPreference || '未指定'}\n`;
        if (cp.conflictTypes) {
            text += `冲突类型：${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes}\n`;
        }
        text += `\n`;

        text += `【文风描写】\n`;
        text += `文风偏好：${cp.writingStyle || '未指定'}\n`;
        if (cp.favoriteWorks) {
            text += `喜欢的作品：${cp.favoriteWorks}\n`;
        }
        if (cp.writingStyleDetails) {
            text += `文风详细要求：${cp.writingStyleDetails}\n`;
        }
        text += `对话风格：${cp.dialogueStyle || '未指定'}\n`;
        text += `回复详细度：${cp.detailLevel || '未指定'}\n`;
        text += `描写重点：${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || '未指定'}\n`;
        if (cp.narrativeStyle) {
            text += `叙事手法：${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle}\n`;
        }
        if (cp.languageStyle) {
            text += `用词风格：${cp.languageStyle}\n`;
        }
        text += `\n`;

        text += `【角色互动】\n`;
        text += `主角类型：${cp.protagonistType || '未指定'}\n`;
        if (cp.protagonistPersonality) {
            text += `主角性格：${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality}\n`;
        }
        if (cp.protagonistBackground) {
            text += `主角背景：${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground}\n`;
        }
        text += `喜欢角色：${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || '未指定'}\n`;
        if (cp.relationshipTypes) {
            text += `关系类型：${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes}\n`;
        }
        text += `关系深度：${cp.relationshipDepth || '未指定'}\n`;
        text += `感情线：${cp.haremPreference || '未指定'}\n`;
        text += `NPC风格：${cp.npcStyle || '未指定'}\n`;
        if (cp.interactionFrequency) {
            text += `NPC互动频率：${cp.interactionFrequency}\n`;
        }
        text += `\n`;

        text += `【战斗冒险】\n`;
        text += `难度偏好：${cp.difficulty || '未指定'}\n`;
        text += `战斗风格：${cp.combatStyle || '未指定'}\n`;
        if (cp.combatElements) {
            text += `战斗元素：${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements}\n`;
        }
        text += `爽感需求：${cp.powerFantasy || '未指定'}\n`;
        if (cp.enemyTypes) {
            text += `敌人类型：${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes}\n`;
        }
        if (cp.powerSystem) {
            text += `力量体系：${Array.isArray(cp.powerSystem) ? cp.powerSystem.join('、') : cp.powerSystem}\n`;
        }
        text += `成长速度：${cp.growthSpeed || '未指定'}\n`;
        text += `失败后果：${cp.consequenceLevel || '未指定'}\n\n`;

        text += `【世界与内容】\n`;
        text += `世界观兴趣：${cp.worldBuilding || '未指定'}\n`;
        if (cp.worldElements) {
            text += `世界元素：${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements}\n`;
        }
        text += `道德选择：${cp.moralChoices || '未指定'}\n`;
        text += `R18偏好：${cp.r18Preference || '未指定'}\n`;
        if (cp.r18Elements && !cp.r18Elements.includes('不需要此类内容')) {
            text += `R18类型：${Array.isArray(cp.r18Elements) ? cp.r18Elements.join('、') : cp.r18Elements}\n`;
        }
        if (cp.emotionalOrientation && !cp.emotionalOrientation.includes('不在意这些')) {
            text += `情感取向：${Array.isArray(cp.emotionalOrientation) ? cp.emotionalOrientation.join('、') : cp.emotionalOrientation}\n`;
        }
        if (cp.favoriteBodyParts && !cp.favoriteBodyParts.includes('不需要特别强调')) {
            text += `身体部位偏好：${Array.isArray(cp.favoriteBodyParts) ? cp.favoriteBodyParts.join('、') : cp.favoriteBodyParts}\n`;
        }
        if (cp.specialPlay && !cp.specialPlay.includes('不需要特殊play')) {
            text += `特殊play：${Array.isArray(cp.specialPlay) ? cp.specialPlay.join('、') : cp.specialPlay}\n`;
        }
        if (cp.sexRolePreference && cp.sexRolePreference !== '不在意') {
            text += `攻受偏好：${cp.sexRolePreference}\n`;
        }
        if (cp.costumePreference && !cp.costumePreference.includes('不在意服装')) {
            text += `服装偏好：${Array.isArray(cp.costumePreference) ? cp.costumePreference.join('、') : cp.costumePreference}\n`;
        }
        text += `结局偏好：${cp.endingPreference || '未指定'}\n\n`;

        text += `【特殊偏好】\n`;
        text += `叙事人称：${cp.immersionStyle || '未指定'}\n`;
        text += `惊喜偏好：${cp.surprisePreference || '未指定'}\n`;
        text += `AI创作自由度：${cp.aiCreativity || '未指定'}\n`;
        if (cp.humorStyle) {
            text += `幽默风格：${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle}\n`;
        }
        text += `时间跳跃：${cp.timeSkipPreference || '未指定'}\n`;
        text += `系统融入：${cp.systemIntegration || '未指定'}\n\n`;

        text += `喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '无'}\n`;
        text += `不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '无'}\n`;
        text += `特别注意：${cp.specialNotes || '无'}\n`;
        text += `创建时间：${new Date(confirmedUserProfile.createdAt).toLocaleString()}\n\n`;

        text += `AI创作指南\n`;
        text += `────────────────────────────────────────\n`;
        text += `${cp.aiGuidelines || '按照用户偏好生成内容'}\n\n`;

        text += `═══════════════════════════════════════\n\n`;
    }

    return text;
}

// ==================== UI 交互函数 ====================

/**
 * 切换用户画像字段显示
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
 * 🆕 切换记忆调度器模式
 */
function toggleMemoryDispatcherMode() {
    const enabled = document.getElementById('enableMemoryDispatcher')?.checked || false;
    userProfileConfig.memoryDispatcherEnabled = enabled;

    // 暴露到全局变量，供其他模块使用
    window.memoryDispatcherEnabled = enabled;

    console.log('[🧠记忆调度器] 模式切换:', enabled ? '已启用' : '已禁用');

    // 如果启用记忆调度器，必须同时启用用户输入分析
    if (enabled) {
        const userProfileCheckbox = document.getElementById('enableUserProfileAnalysis');
        if (userProfileCheckbox && !userProfileCheckbox.checked) {
            userProfileCheckbox.checked = true;
            toggleUserProfileFields();
            console.log('[🧠记忆调度器] 自动启用用户输入分析');
        }
    }
}

/**
 * 保存用户画像设置
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

    // 🆕 同步到全局变量
    window.memoryDispatcherEnabled = userProfileConfig.memoryDispatcherEnabled;

    // 检查额外API是否启用 - 使用兼容函数获取配置
    const extraConfig = getExtraApiConfigForProfile();
    if (userProfileConfig.enabled && (!extraConfig || !extraConfig.enabled)) {
        alert('⚠️ 警告：用户输入分析功能需要启用并配置额外API！\n\n请在"API"标签页的"额外API设置"中配置额外API。');
    }

    saveUserProfileConfig();

    // 🆕 更新提示信息，包含记忆调度器状态
    alert('✅ 用户画像设置已保存！\n\n' +
        '状态：' + (userProfileConfig.enabled ? '已启用' : '已禁用') + '\n' +
        '🧠记忆调度器：' + (userProfileConfig.memoryDispatcherEnabled ? '已启用' : '已禁用') + '\n' +
        '正文层数：' + userProfileConfig.analysisHistoryDepth + ' 层\n' +
        '矩阵层数：' + userProfileConfig.matrixHistoryDepth + ' 层\n' +
        '分析思维链：' + (userProfileConfig.showAnalysis ? '显示' : '隐藏'));
}

/**
 * 查看用户画像（弹窗）
 */
function viewUserProfile() {
    const profileText = getFormattedUserProfile();

    // 创建弹窗
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
            <h2 style="margin: 0; color: #667eea;">🎭 用户画像</h2>
            <button onclick="document.getElementById('userProfileViewModal').remove()" 
                    style="background: #dc3545; border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                ✕ 关闭
            </button>
        </div>
        <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; color: #e0e0e0;">${profileText}</pre>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * 清空用户画像
 */
function clearUserProfile() {
    if (!confirm('⚠️ 确定要清空用户画像吗？\n\n这将删除所有积累的用户偏好和分析数据，此操作不可撤销！')) {
        return;
    }

    userProfileData = {
        preferences: [],
        dislikes: [],
        writingStyle: '未确定',
        contentPreference: '未确定',
        literacyLevel: '未确定',
        interactionPattern: '未确定',
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

    // 更新UI显示
    const profileTextarea = document.getElementById('currentUserProfile');
    if (profileTextarea) {
        profileTextarea.value = '用户画像已清空。开始游戏并启用此功能后会自动积累。';
    }

    alert('✅ 用户画像已清空！');
}

/**
 * 加载设置到UI
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

    // 🆕 加载记忆调度器开关状态
    if (memoryDispatcherEl) {
        memoryDispatcherEl.checked = userProfileConfig.memoryDispatcherEnabled || false;
        window.memoryDispatcherEnabled = userProfileConfig.memoryDispatcherEnabled || false;
        console.log('[🧠记忆调度器] UI状态已加载:', userProfileConfig.memoryDispatcherEnabled ? '已启用' : '已禁用');
    }

    // 🆕 刷新画像选择器
    refreshProfileSelector();

    // 显示当前用户画像（完整版，方便编辑）
    if (profileTextarea) {
        if (confirmedUserProfile && confirmedUserProfile.result) {
            // 显示完整问卷画像（可编辑格式）
            const p = confirmedUserProfile.result;
            profileTextarea.value = generateEditableProfileText(p, confirmedUserProfile.createdAt);
        } else if (userProfileData.stats.totalInputs > 0) {
            // 显示自动积累的画像
            profileTextarea.value = `📋 【自动积累画像】\n` +
                `总分析次数：${userProfileData.stats.totalInputs}\n` +
                `文风偏好：${userProfileData.writingStyle}\n` +
                `内容偏好：${userProfileData.contentPreference}\n` +
                `文学素养：${userProfileData.literacyLevel}\n` +
                `交互模式：${userProfileData.interactionPattern}\n` +
                `喜欢：${userProfileData.preferences.slice(-5).join('、') || '无'}\n` +
                `不喜欢：${userProfileData.dislikes.slice(-3).join('、') || '无'}\n\n` +
                `💡 可直接在上方编辑，修改后点击"保存画像修改"`;
        } else {
            profileTextarea.value = '尚未生成用户画像。\n\n💡 可直接在此输入你的偏好，例如：\n\n📌 用户特点：喜欢爽文，节奏快\n剧情偏好：战斗向\n文风偏好：简洁明快\n节奏偏好：快节奏\n难度偏好：适中\n喜欢：打脸、升级、后宫\n不喜欢：圣母、拖沓\nAI创作指南：多写战斗场面，少写日常';
        }
    }
}

/**
 * 生成可编辑的完整画像文本
 */
function generateEditableProfileText(p, createdAt) {
    let text = `📌 用户特点：${p.summary || '未指定'}\n\n`;

    text += `【剧情偏好】\n`;
    text += `剧情类型：${p.storyPreference || '未指定'}\n`;
    text += `故事基调：${p.storyTone || '未指定'}\n`;
    text += `剧情结构：${p.storyStructure || '未指定'}\n`;
    text += `节奏偏好：${p.pacing || '未指定'}\n`;
    text += `反转偏好：${p.plotTwistPreference || '未指定'}\n`;
    if (p.conflictTypes) {
        text += `冲突类型：${Array.isArray(p.conflictTypes) ? p.conflictTypes.join('、') : p.conflictTypes}\n`;
    }

    text += `\n【文风描写】\n`;
    text += `文风偏好：${p.writingStyle || '未指定'}\n`;
    if (p.favoriteWorks) {
        text += `喜欢的作品：${p.favoriteWorks}\n`;
    }
    if (p.writingStyleDetails) {
        text += `文风详细要求：${p.writingStyleDetails}\n`;
    }
    text += `对话风格：${p.dialogueStyle || '未指定'}\n`;
    text += `回复详细度：${p.detailLevel || '未指定'}\n`;
    if (p.descriptionFocus) {
        text += `描写重点：${Array.isArray(p.descriptionFocus) ? p.descriptionFocus.join('、') : p.descriptionFocus}\n`;
    }
    if (p.narrativeStyle) {
        text += `叙事手法：${Array.isArray(p.narrativeStyle) ? p.narrativeStyle.join('、') : p.narrativeStyle}\n`;
    }
    if (p.languageStyle) {
        text += `用词风格：${p.languageStyle}\n`;
    }

    text += `\n【角色互动】\n`;
    text += `主角类型：${p.protagonistType || '未指定'}\n`;
    if (p.protagonistPersonality) {
        text += `主角性格：${Array.isArray(p.protagonistPersonality) ? p.protagonistPersonality.join('、') : p.protagonistPersonality}\n`;
    }
    if (p.protagonistBackground) {
        text += `主角背景：${Array.isArray(p.protagonistBackground) ? p.protagonistBackground.join('、') : p.protagonistBackground}\n`;
    }
    if (p.favoriteCharacters) {
        text += `喜欢角色：${Array.isArray(p.favoriteCharacters) ? p.favoriteCharacters.join('、') : p.favoriteCharacters}\n`;
    }
    if (p.relationshipTypes) {
        text += `关系类型：${Array.isArray(p.relationshipTypes) ? p.relationshipTypes.join('、') : p.relationshipTypes}\n`;
    }
    text += `关系深度：${p.relationshipDepth || '未指定'}\n`;
    text += `感情线：${p.haremPreference || '未指定'}\n`;
    text += `NPC风格：${p.npcStyle || '未指定'}\n`;

    text += `\n【战斗冒险】\n`;
    text += `难度偏好：${p.difficulty || '未指定'}\n`;
    text += `战斗风格：${p.combatStyle || '未指定'}\n`;
    if (p.combatElements) {
        text += `战斗元素：${Array.isArray(p.combatElements) ? p.combatElements.join('、') : p.combatElements}\n`;
    }
    text += `爽感需求：${p.powerFantasy || '未指定'}\n`;
    if (p.enemyTypes) {
        text += `敌人类型：${Array.isArray(p.enemyTypes) ? p.enemyTypes.join('、') : p.enemyTypes}\n`;
    }
    text += `成长速度：${p.growthSpeed || '未指定'}\n`;
    text += `失败后果：${p.consequenceLevel || '未指定'}\n`;

    text += `\n【世界与内容】\n`;
    text += `世界观兴趣：${p.worldBuilding || '未指定'}\n`;
    if (p.worldElements) {
        text += `世界元素：${Array.isArray(p.worldElements) ? p.worldElements.join('、') : p.worldElements}\n`;
    }
    text += `道德选择：${p.moralChoices || '未指定'}\n`;
    text += `R18偏好：${p.r18Preference || '未指定'}\n`;
    if (p.r18Elements && !p.r18Elements.includes('不需要此类内容')) {
        text += `R18类型：${Array.isArray(p.r18Elements) ? p.r18Elements.join('、') : p.r18Elements}\n`;
    }
    text += `结局偏好：${p.endingPreference || '未指定'}\n`;

    text += `\n【特殊偏好】\n`;
    text += `叙事人称：${p.immersionStyle || '未指定'}\n`;
    text += `AI创作自由度：${p.aiCreativity || '未指定'}\n`;
    if (p.humorStyle) {
        text += `幽默风格：${Array.isArray(p.humorStyle) ? p.humorStyle.join('、') : p.humorStyle}\n`;
    }
    text += `时间跳跃：${p.timeSkipPreference || '未指定'}\n`;
    text += `系统融入：${p.systemIntegration || '未指定'}\n`;

    text += `\n【核心偏好】\n`;
    text += `喜欢：${Array.isArray(p.likes) ? p.likes.join('、') : p.likes || '无'}\n`;
    text += `不喜欢：${Array.isArray(p.dislikes) ? p.dislikes.join('、') : p.dislikes || '无'}\n`;
    if (p.specialNotes) {
        text += `特别注意：${p.specialNotes}\n`;
    }

    text += `\n【AI创作指南】\n`;
    text += `${p.aiGuidelines || '按照用户偏好生成内容'}\n`;

    if (createdAt) {
        text += `\n---\n创建时间：${new Date(createdAt).toLocaleString()}`;
    }

    return text;
}

// ==================== 分析思维链显示 ====================

/**
 * 显示用户输入分析的思维链（不进存档）
 * 简化版：直接显示AI原始输出，\n换行
 */
function displayAnalysisReasoning(userInput, analysisResult, rawResponse = null) {
    const historyDiv = document.getElementById('gameHistory');
    if (!historyDiv) return;

    // 创建分析思维链容器
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

    // 头部（可折叠）
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
        <span>🎭 用户输入分析</span>
        <span style="font-size: 11px; opacity: 0.8;">点击展开/折叠</span>
    `;

    // 内容区（默认折叠）
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

    // 🆕 直接显示AI原始输出，\n换行
    let displayContent = '';

    if (rawResponse) {
        // 如果有原始响应，直接显示
        displayContent = rawResponse;
    } else if (analysisResult) {
        // 否则把analysisResult转成JSON字符串显示
        displayContent = JSON.stringify(analysisResult, null, 2);
    }

    // 处理换行：\n 转换为实际换行（pre-wrap会处理）
    content.textContent = displayContent;

    // 点击头部折叠/展开
    header.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    };

    container.appendChild(header);
    container.appendChild(content);

    // 插入到游戏历史的末尾
    historyDiv.appendChild(container);

    // 滚动到底部
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // 标记这个元素不需要保存（用于区分）
    container.dataset.noSave = 'true';
}

// ==================== 问卷调查系统 ====================

// 问卷问题定义（分组显示）
const questionnaireQuestions = [
    // ===== 第一部分：剧情偏好 =====
    {
        id: 'section1',
        type: 'section',
        title: '📖 第一部分：剧情偏好'
    },
    {
        id: 'storyPreference',
        question: '你更喜欢什么类型的剧情？',
        type: 'radio',
        options: ['剧情向（注重故事发展和人物塑造）', '战斗向（注重战斗描写和升级打怪）', '社交向（注重人际关系和对话互动）', 'R18向（注重亲密场景和情感描写）', '冒险探索向（探索未知、解谜寻宝）', '经营养成向（发展势力、培养角色）', '悬疑推理向（解开谜团、揭露真相）', '混合型（以上都喜欢，根据情境切换）']
    },
    {
        id: 'storyTone',
        question: '你喜欢什么样的故事基调？',
        type: 'radio',
        options: ['轻松愉快（欢乐向，偶尔有小挫折）', '热血励志（主角不断突破，逆境翻盘）', '深沉厚重（复杂的世界观和人物动机）', '黑暗残酷（现实向，有牺牲和代价）', '荒诞幽默（无厘头，打破常规）', '治愈温馨（温暖人心的日常）', '史诗宏大（波澜壮阔的大格局）', '悬疑紧张（充满未知和惊悚）', '浪漫唯美（注重情感氛围）']
    },
    {
        id: 'plotTwist',
        question: '你对剧情反转的接受程度？',
        type: 'radio',
        options: ['喜欢反转（越意想不到越好）', '适度反转（偶尔来一次）', '最好剧情稳定（不要太多意外）', '反转可以但要合理铺垫', '喜欢伏笔回收的惊喜', '喜欢细思极恐的暗线']
    },
    {
        id: 'pacing',
        question: '你喜欢什么样的剧情节奏？',
        type: 'radio',
        options: ['慢节奏（享受日常和细节）', '中等节奏（平衡日常和主线）', '快节奏（剧情紧凑，快速推进）', '根据场景调整（战斗快、日常慢）', '张弛有度（高潮与舒缓交替）', '一波三折（不断起伏推进）']
    },


    // ===== 第二部分：文风与描写 =====
    {
        id: 'section2',
        type: 'section',
        title: '✍️ 第二部分：文风与描写'
    },
    {
        id: 'writingStyle',
        question: '你偏好什么样的文风？',
        type: 'radio',
        options: ['细腻华丽（注重环境和心理描写）', '简洁明快（重点突出，节奏紧凑）', '轻松幽默（有趣的对话和吐槽）', '严肃深沉（成熟的叙事风格）', '日式轻小说（轻松日常+热血战斗）', '武侠仙侠古风（古典雅致）', '网文爽文风（爽快直接、节奏快）', '文青风（意象丰富、富有诗意）', '硬核写实（注重逻辑和细节真实）', '通俗易懂（平实流畅好读）']
    },
    {
        id: 'favoriteWorks',
        question: '请填写你喜欢的小说/作品（选填，用于参考文风）',
        type: 'textarea',
        placeholder: '例如：\n• 修仙：《凡人修仙传》《遮天》《一念永恒》《仙逆》《我欲封天》\n• 玄幻：《斗破苍穹》《武动乾坤》《完美世界》《大主宰》\n• 奇幻：《诛仙》《择天记》《雪中悍刀行》《将夜》\n• 都市：《龙王传说》《全职高手》《大王饶命》\n• 悬疑：《盗墓笔记》《鬼吹灯》《道诡异仙》\n• 轻小说：《刀剑神域》《无职转生》《Re:从零开始》《overlord》\n• 武侠：《天龙八部》《笑傲江湖》《射雕英雄传》\n• 其他：可以填写任何你喜欢的作品，AI会参考其文风特点'
    },
    {
        id: 'favoriteAuthors',
        question: '你喜欢哪些作家的风格？（可多选）',
        type: 'checkbox',
        options: [
            // 中国古典文学大家
            '鲁迅', '老舍', '巴金', '沈从文', '汪曾祺', '张爱玲', '钱钟书', '林语堂', '萧红', '郁达夫',
            // 中国现当代作家
            '莫言', '余华', '苏童', '王小波', '阿城', '路遥', '陈忠实', '贾平凹', '刘震云', '严歌苓', '王安忆', '迟子建', '毕飞宇', '格非', '阎连科', '金宇澄',
            // 港台作家
            '金庸', '古龙', '梁羽生', '倪匡', '黄易', '白先勇', '李碧华', '亦舒', '琼瑶', '温瑞安',
            // 网络小说作家
            '天蚕土豆', '唐家三少', '我吃西红柿', '辰东', '耳根', '忘语', '猫腻', '烽火戏诸侯', '烟雨江南', '梦入神机', '老鹰吃小鸡', '爱潜水的乌贼', '会说话的肘子', '愤怒的香蕉', '天下归元', '丁墨', '顾漫', '墨香铜臭', 'priest', '非天夜翔', '淮上', '肉包不吃肉', '晋江大神们',
            // 日本轻小说/作家
            '川端康成', '三岛由纪夫', '村上春树', '东野圭吾', '太宰治', '夏目漱石', '芥川龙之介', '伏见司', '西尾维新', '入间人间', '�的木镜平', '十文字青', '川原砾', '成田良悟', '奈须蘑菇', '镰池和马', '�的月良', '渡航', '支仓冻砂', '上远野浩平', '神�的学', '丸山黄金',
            // 欧美经典作家
            '海明威', '菲茨杰拉德', '马尔克斯', '卡夫卡', '托尔斯泰', '陀思妥耶夫斯基', '雨果', '狄更斯', 'J.K.罗琳', 'J.R.R.托尔金', '乔治·马丁', '斯蒂芬·金', '阿加莎·克里斯蒂', '丹·布朗',
            // 其他
            '其他作家（请在备注中说明）'
        ]
    },
    {
        id: 'dialogueStyle',
        question: '你喜欢什么样的对话风格？',
        type: 'radio',
        options: ['简洁有力（直奔主题）', '机智幽默（吐槽和玩梗）', '文艺抒情（有深度和韵味）', '日常口语化（自然真实）', '古风雅致（文言半白）', '中二热血（燃系台词）', '腹黑阴险（话中有话）', '萌系可爱（软萌撒娇）', '根据角色性格变化']
    },
    {
        id: 'descriptionFocus',
        question: '你希望重点描写什么？（可多选）',
        type: 'checkbox',
        options: ['环境氛围', '人物外貌', '心理活动', '动作细节', '对话交锋', '情感变化', '战斗过程', '感官体验', '服饰装扮', '表情神态', '肢体语言', '内心独白', '回忆闪回', '气势渲染']
    },
    {
        id: 'detailLevel',
        question: '你希望每次AI回复的详细程度？',
        type: 'radio',
        options: ['极简（200-300字）', '简短精炼（300-500字）', '适中篇幅（500-800字）', '详细描写（800-1200字）', '长篇大论（1200-1800字）', '超长篇（1800字以上）', '根据场景自动调整']
    },
    {
        id: 'narrativeStyle',
        question: '你喜欢什么样的叙事手法？（可多选）',
        type: 'checkbox',
        options: ['顺叙（按时间顺序）', '倒叙（从结果开始）', '插叙（穿插回忆）', '多视角切换', '内心独白', '旁白解说', '环境烘托', '对比手法', '伏笔暗示', '蒙太奇跳跃']
    },
    {
        id: 'languagePreference',
        question: '你对用词的偏好？',
        type: 'radio',
        options: ['现代白话（通俗易懂）', '半文言半白话（古风韵味）', '网络流行语（接地气）', '专业术语多（显得专业）', '诗词引用（文采飞扬）', '根据场景自动调整']
    },

    // ===== 第三部分：角色与互动 =====
    {
        id: 'section3',
        type: 'section',
        title: '👥 第三部分：角色与互动'
    },

    {
        id: 'favoriteNpcTypes',
        question: '你喜欢什么类型的角色？（可多选）',
        type: 'checkbox',
        options: ['傲娇', '温柔', '御姐/大叔', '萝莉/正太', '病娇', '天然呆', '高冷', '腹黑', '热血', '可靠前辈', '神秘人物', '毒舌吐槽', '忠犬型', '女王型', '清冷仙子', '活泼元气', '妖艳魅惑', '知性优雅', '反差萌', '中二病', '闷骚型']
    },
    {
        id: 'relationshipType',
        question: '你喜欢什么样的角色关系？（可多选）',
        type: 'checkbox',
        options: ['青梅竹马', '师徒关系', '主仆关系', '宿敌化友', '欢喜冤家', '一见钟情', '日久生情', '命中注定', '禁忌之恋', '兄妹/姐弟', '同门师兄妹', '后宫群芳', '专一真爱', '暧昧不明']
    },

    {
        id: 'haremPreference',
        question: '你对后宫/多角色关系的态度？',
        type: 'radio',
        options: ['专一路线（只攻略一个）', '小后宫（2-3个）', '大后宫（多多益善）', '不限定（看缘分）', '不需要感情线', '百合/耽美向']
    },

    // ===== 第四部分：战斗与冒险 =====
    {
        id: 'section4',
        type: 'section',
        title: '⚔️ 第四部分：战斗与冒险'
    },
    {
        id: 'difficulty',
        question: '你希望游戏有多大挑战性？',
        type: 'radio',
        options: ['轻松愉快（主角顺风顺水）', '适度挑战（偶尔遇到困难）', '高难度（经常面临危机）', '硬核模式（随时可能失败）', '波动型（时而顺利时而困难）', '阶段性挑战（每个阶段有boss）']
    },
    {
        id: 'combatStyle',
        question: '你喜欢什么样的战斗描写？',
        type: 'radio',
        options: ['策略对决（斗智斗勇）', '热血激战（招式对轰）', '一招制敌（简洁利落）', '详细拆解（每一招都有描写）', '氛围渲染（重气势轻细节）', '血腥暴力（真实残酷）', '飘逸写意（如诗如画）', '内力对拼（境界碾压）', '团队配合（多人协作）']
    },
    {
        id: 'powerFantasy',
        question: '你对"爽感"的需求程度？',
        type: 'radio',
        options: ['非常需要（主角要强，装逼打脸）', '适度即可（有高光时刻就行）', '不太需要（更喜欢真实感）', '反向也行（主角可以吃瘪）', '先抑后扬（先挫折后爽）', '稳步推进（循序渐进的强大）']
    },
    {
        id: 'consequenceLevel',
        question: '战斗失败后你希望有什么后果？',
        type: 'radio',
        options: ['基本无后果（重新来过）', '轻微后果（损失财物或时间）', '中等后果（受伤需要恢复）', '严重后果（可能被俘或死亡）', '剧情分支（失败也是故事的一部分）', '贵人相救（有人来帮忙）']
    },
    {
        id: 'growthSpeed',
        question: '你希望主角的成长速度如何？',
        type: 'radio',
        options: ['快速升级（一路开挂）', '稳步提升（循序渐进）', '厚积薄发（积累后爆发）', '瓶颈突破（有卡关有突破）', '机遇驱动（靠奇遇变强）', '实战成长（越打越强）']
    },

    // ===== 第五部分：内容偏好 =====
    {
        id: 'section5',
        type: 'section',
        title: '🎯 第五部分：内容偏好'
    },
    {
        id: 'worldBuilding',
        question: '你对世界观设定的兴趣？',
        type: 'radio',
        options: ['非常感兴趣（喜欢详细设定）', '适度了解（够用就行）', '不太在意（重点在人物和剧情）', '自己探索（不要直接说明）', '边玩边了解（逐步揭露）', '喜欢宏大世界观']
    },
    {
        id: 'r18Preference',
        question: '关于R18内容的偏好？',
        type: 'radio',
        options: ['不需要R18内容', '偶尔有一些调情暗示', '适度的亲密描写', '详细的R18场景', '重口味内容也可以', '纯爱向（甜蜜为主）', '根据剧情需要']
    },
    {
        id: 'emotionalOrientation',
        question: '情感取向偏好？（可多选）',
        type: 'checkbox',
        options: ['纯爱（专一深情）', 'NTR（被戴绿帽）', 'NTL（戴别人绿帽）', '逆NTR（抢回来）', '后宫（多人同时喜欢主角）', '修罗场（争风吃醋）', '开放式关系', '禁忌恋（师生/主仆等）', '年龄差（年上/年下）', '身份差（贵族/平民）', '不在意这些']
    },
    {
        id: 'favoriteBodyParts',
        question: '喜欢重点描写的身体部位？（可多选）',
        type: 'checkbox',
        options: ['胸部/乳房', '臀部', '腿部/大腿', '足部', '腰部', '颈部/锁骨', '嘴唇/舌头', '手指', '后背', '腹部/小腹', '私处细节', '全身整体', '不需要特别强调']
    },
    {
        id: 'specialPlay',
        question: '喜欢什么特殊场景/play？（可多选，不需要可跳过）',
        type: 'checkbox',
        options: ['SM/调教', '束缚/捆绑', '羞耻play', '野外/公共场所', '偷情/背德', '醉酒/药物', '睡奸', '触手', '怪物/异种', '催眠/洗脑', '孕play', '母乳', '足交', '口交重点', '肛交', '道具使用', '不需要特殊play']
    },
    {
        id: 'sexRolePreference',
        question: '攻受/主被动偏好？',
        type: 'radio',
        options: ['主角主动攻（主导）', '主角被动受（被主导）', '互攻互受（均衡）', '根据对象变化', '不在意']
    },
    {
        id: 'avoidContent',
        question: '你希望避免哪些内容？（可多选）',
        type: 'checkbox',
        options: ['过于血腥暴力', '主角被虐/NTR', '悲剧结局', '过多日常描写', '复杂的人际关系', '强制剧情（无法选择）', '恐怖惊悚', '虐心剧情', '圣母白莲花', '无脑后宫', '主角降智', '开金手指太多', '剧情拖沓', '无（什么都能接受）']
    },

    // ===== 第六部分：特殊偏好 =====
    {
        id: 'section6',
        type: 'section',
        title: '💫 第六部分：特殊偏好'
    },
    {
        id: 'immersionLevel',
        question: '你希望AI如何称呼主角？',
        type: 'radio',
        options: ['第二人称【你】', '第三人称【用主角名字】', '第一人称【我】', '根据场景切换', '第三人称+内心独白用第一人称']
    },
    {
        id: 'surpriseEvents',
        question: '你希望AI主动制造什么样的惊喜？（可多选）',
        type: 'checkbox',
        options: ['随机事件（突发状况）', '新角色登场', '隐藏剧情触发', '意外的道具/机遇', '角色主动表白/示好', '突然的危机', '意外的相遇', '剧情反转', '身世揭秘', '奇遇降临', '不需要惊喜（按我的选择走）']
    },
    {
        id: 'aiCreativity',
        question: '你希望AI有多大的创作自由度？',
        type: 'radio',
        options: ['完全按我的选择（不要自作主张）', '小范围发挥（在我的方向上扩展）', '适度创作（可以添加有趣的细节）', '大胆创作（经常给我惊喜）', '自由发挥（放手让AI创作）']
    },
    {
        id: 'humorStyle',
        question: '你喜欢什么样的幽默风格？（可多选）',
        type: 'checkbox',
        options: ['吐槽型（犀利点评）', '冷笑话', '无厘头', '玩梗（网络/二次元梗）', '黑色幽默', '反差萌', '谐音梗', '自嘲型', '正经搞笑', '不需要幽默（认真严肃）']
    },
    {
        id: 'interactionFrequency',
        question: '你希望NPC多频繁主动互动？',
        type: 'radio',
        options: ['经常（感觉世界很活跃）', '适度（有需要时出现）', '很少（我主动时才回应）', '根据关系亲密度决定']
    },
    {
        id: 'timeSkip',
        question: '你对时间跳跃的偏好？',
        type: 'radio',
        options: ['不要跳（每天都要描写）', '可以跳过无聊时间', '适度跳跃（日常可略过）', '大胆跳跃（可以跳过较长时间）', '根据剧情需要']
    },
    {
        id: 'flashbackStyle',
        question: '你对回忆/闪回的偏好？',
        type: 'radio',
        options: ['喜欢（丰富角色背景）', '适度使用', '不太喜欢（打断剧情）', '只在重要时刻使用']
    },
    {
        id: 'systemIntegration',
        question: '你希望游戏系统如何融入剧情？',
        type: 'radio',
        options: ['完全隐藏（纯剧情体验）', '适度显示（关键数据）', '详细展示（数值面板）', '游戏化（有明确的系统提示）']
    },
    {
        id: 'additionalNotes',
        question: '还有什么特别的偏好想告诉AI？（选填）',
        type: 'textarea',
        placeholder: '例如：\n• 喜欢的具体角色类型（如：傲娇双马尾、温柔大姐姐、冷艳御姐）\n• 特定的剧情偏好（如：师徒恋、青梅竹马、宿敌变恋人）\n• 想要的特殊元素（如：宠物伙伴、穿越要素、系统金手指）\n• 讨厌的剧情桥段（如：误会分离、强行降智）\n• 喜欢的台词/对话风格示例\n• 特殊的XP或癖好（会严格保密）\n• 任何其他你想让AI知道的偏好...'
    }
];

// 用户确认的画像（来自问卷）
let confirmedUserProfile = null;

/**
 * 打开用户画像问卷调查弹窗
 */
function openUserProfileQuestionnaire() {
    // 检查额外API
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        alert('⚠️ 请先在API设置中启用并配置额外API！\n问卷结果需要发送给额外API进行分析。');
        return;
    }

    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'questionnaireModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10001;
        display: flex; justify-content: center; align-items: center;
    `;

    let questionNumber = 0;
    let questionsHTML = questionnaireQuestions.map((q, idx) => {
        // 分组标题
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
            <h2 style="text-align: center; margin-bottom: 20px; color: #667eea;">📋 用户偏好问卷调查</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 25px; font-size: 14px;">
                填写以下问卷，帮助AI了解你的偏好，生成更符合你口味的剧情！
            </p>
            
            <form id="questionnaireForm">
                ${questionsHTML}
            </form>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeQuestionnaireModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ 取消
                </button>
                <button onclick="submitQuestionnaire()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    🚀 提交并分析
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * 关闭问卷弹窗
 */
function closeQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (modal) modal.remove();
}

/**
 * 提交问卷并调用API分析
 */
async function submitQuestionnaire() {
    const form = document.getElementById('questionnaireForm');
    if (!form) return;

    // 收集答案（跳过section类型）
    const answers = {};
    questionnaireQuestions.forEach(q => {
        if (q.type === 'section') return; // 跳过分组标题

        if (q.type === 'radio') {
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = selected ? selected.value : '未选择';
        } else if (q.type === 'checkbox') {
            const checked = form.querySelectorAll(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = Array.from(checked).map(c => c.value);
        } else if (q.type === 'textarea') {
            const textarea = document.getElementById(`q_${q.id}`);
            answers[q.id] = textarea ? textarea.value : '';
        }
    });

    console.log('[🎭用户画像] 问卷答案:', answers);

    // 显示加载状态
    const submitBtn = document.querySelector('#questionnaireModal button:last-child');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 正在分析中...';
    }

    try {
        // 构建分析请求
        const analysisPrompt = `你是一个用户画像分析专家。根据以下用户问卷结果，生成一份详细的用户画像报告。

【 极其重要的规则 - 必须严格遵守！】
1. 你只能基于用户【实际选择/填写】的内容进行分析
2. 对于用户【没有选择】或【选择了"未选择"】的问题，对应字段必须填写"未选择"或空数组[]
3. 【绝对禁止】编造、猜测、推断用户没有明确选择的偏好
4. 如果某个问题用户根本没有回答，对应字段必须是"未选择"，不要瞎编！
5. summary和aiGuidelines只能基于用户实际选择的内容来生成，不要添加用户没选的内容

【用户问卷答案】
${Object.entries(answers).map(([key, value]) => {
            const q = questionnaireQuestions.find(q => q.id === key);
            if (!q) return null;
            const answer = Array.isArray(value) ? value.join('、') : value;
            // 跳过空答案
            if (!answer || answer === '未选择' || (Array.isArray(value) && value.length === 0)) {
                return `${q.question}\n答：【用户未选择，请填"未选择"】`;
            }
            return `${q.question}\n答：${answer}`;
        }).filter(Boolean).join('\n\n')}

【请输出JSON格式的用户画像】
注意：如果用户没有回答某个问题，对应字段必须是"未选择"或空数组[]，不要编造！

{
    "summary": "一句话概括这位用户的偏好特点（只基于用户实际选择的内容，不要编造）",
    
    "storyPreference": "剧情类型偏好（用户未选择则填"未选择"）",
    "storyTone": "故事基调偏好",
    "plotTwistPreference": "剧情反转偏好",
    "pacing": "节奏偏好",
    
    "writingStyle": "文风偏好描述",
    "favoriteWorks": "用户喜欢的作品列表（原样记录，未填写则填"未填写"）",
    "favoriteAuthors": ["用户选择的喜欢作家，未选择则填空数组[]"],
    "writingStyleDetails": "【重要】根据用户喜欢的作品和选择的作家风格，详细分析并输出文风要求。如果用户没有填写喜欢的作品也没有选择作家，则只根据用户选择的文风偏好生成指南，不要编造用户没选的内容。",
    "dialogueStyle": "对话风格偏好",
    "narrativeStyle": ["叙事手法偏好"],
    "languageStyle": "用词风格偏好",
    "descriptionFocus": ["重点描写的内容"],
    "detailLevel": "回复详细程度偏好（字数范围）",
    
    "favoriteCharacters": ["喜欢的角色类型"],
    "relationshipTypes": ["喜欢的角色关系类型"],
    "haremPreference": "后宫/感情线偏好",
    
    "difficulty": "难度偏好",
    "combatStyle": "战斗描写风格偏好",
    "powerFantasy": "爽感需求程度",
    "growthSpeed": "主角成长速度偏好",
    "consequenceLevel": "失败后果偏好",
    
    "worldBuilding": "世界观兴趣程度",
    "r18Preference": "R18内容偏好",
    "emotionalOrientation": ["情感取向偏好"],
    "favoriteBodyParts": ["喜欢描写的身体部位"],
    "specialPlay": ["特殊play偏好"],
    "sexRolePreference": "攻受偏好",
    
    "avoidContent": ["用户明确选择要避免的内容"],
    "likes": ["喜欢的所有元素（只从用户实际选择中整理，不要添加用户没选的）"],
    "dislikes": ["不喜欢/要避免的所有元素（只从用户实际选择中整理）"],
    
    "immersionStyle": "叙事人称偏好",
    "surprisePreference": ["对惊喜事件的偏好"],
    "aiCreativity": "AI创作自由度偏好",
    "humorStyle": ["幽默风格偏好"],
    "interactionFrequency": "NPC互动频率偏好",
    "timeSkipPreference": "时间跳跃偏好",
    "flashbackStyle": "回忆/闪回偏好",
    "systemIntegration": "系统融入偏好",
    
    "specialNotes": "其他特别注意事项（只综合用户实际填写的备注，没填就写"无"）",
    "aiGuidelines": "给AI的详细创作指南（400-500字，【只能基于用户实际选择的内容】来生成，绝对不要添加用户没有选择的偏好。如果用户选择较少，指南就简短一些，不要凭空编造。）"
}`;

        const messages = [
            { role: 'system', content: '你是一个专业的用户画像分析师，擅长从问卷答案中提取用户偏好。请输出JSON格式的分析结果。持续性核心≡为具备成熟心智、复杂思维能力，拥有极高文学素养因而对文字与剧情十分挑剔的用户，创建【沉浸式】叙事沙盒α' },
            { role: 'user', content: analysisPrompt }
        ];

        // 调用额外API
        const response = await callExtraAI(messages);
        console.log('[🎭用户画像] API分析结果:', response);

        // 解析结果
        let profileResult;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                profileResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('未找到JSON格式的结果');
            }
        } catch (e) {
            console.error('[🎭用户画像] 解析失败:', e);
            profileResult = {
                summary: '问卷分析完成',
                rawResponse: response,
                aiGuidelines: response
            };
        }

        // 显示结果让用户确认
        showProfileConfirmation(profileResult, answers);

    } catch (error) {
        console.error('[🎭用户画像] 分析失败:', error);
        alert('分析失败：' + error.message + '\n请检查额外API配置是否正确。');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 提交并分析';
        }
    }
}

/**
 * 显示画像确认弹窗
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
<strong>📌 用户画像摘要</strong>
${profileResult.summary || '暂无'}

<strong>═══ 剧情偏好 ═══</strong>
📖 剧情类型：${profileResult.storyPreference || '未指定'}
🎭 故事基调：${profileResult.storyTone || '未指定'}
📐 剧情结构：${profileResult.storyStructure || '未指定'}
⏱️ 节奏偏好：${profileResult.pacing || '未指定'}
🔄 反转偏好：${profileResult.plotTwistPreference || '未指定'}

<strong>═══ 文风描写 ═══</strong>
✍️ 文风偏好：${profileResult.writingStyle || '未指定'}
📚 喜欢作品：${profileResult.favoriteWorks || '未填写'}
💬 对话风格：${profileResult.dialogueStyle || '未指定'}
📏 详细程度：${profileResult.detailLevel || '未指定'}
🔍 描写重点：${Array.isArray(profileResult.descriptionFocus) ? profileResult.descriptionFocus.join('、') : profileResult.descriptionFocus || '未指定'}

<strong>═══ 角色互动 ═══</strong>
🦸 主角类型：${profileResult.protagonistType || '未指定'}
💕 喜欢角色：${Array.isArray(profileResult.favoriteCharacters) ? profileResult.favoriteCharacters.join('、') : profileResult.favoriteCharacters || '未指定'}
💑 关系深度：${profileResult.relationshipDepth || '未指定'}
💞 感情线：${profileResult.haremPreference || '未指定'}
👥 NPC风格：${profileResult.npcStyle || '未指定'}

<strong>═══ 战斗冒险 ═══</strong>
⚔️ 难度偏好：${profileResult.difficulty || '未指定'}
🗡️ 战斗风格：${profileResult.combatStyle || '未指定'}
💪 爽感需求：${profileResult.powerFantasy || '未指定'}
📈 成长速度：${profileResult.growthSpeed || '未指定'}

<strong>═══ 内容偏好 ═══</strong>
🌍 世界观兴趣：${profileResult.worldBuilding || '未指定'}
🔞 R18偏好：${profileResult.r18Preference || '未指定'}
🎬 结局偏好：${profileResult.endingPreference || '未指定'}

<strong>═══ 特殊偏好 ═══</strong>
🎯 叙事人称：${profileResult.immersionStyle || '未指定'}
🎲 AI创作自由度：${profileResult.aiCreativity || '未指定'}
😄 幽默风格：${Array.isArray(profileResult.humorStyle) ? profileResult.humorStyle.join('、') : profileResult.humorStyle || '未指定'}

<strong>❤️ 喜欢的元素</strong>
${Array.isArray(profileResult.likes) ? profileResult.likes.join('、') : profileResult.likes || '未指定'}

<strong>� 不喜欢/避免的元素</strong>
${Array.isArray(profileResult.dislikes) ? profileResult.dislikes.join('、') : profileResult.dislikes || '未指定'}

<strong>📝 特别注意</strong>
${profileResult.specialNotes || '无'}

<strong>🤖 AI创作指南</strong>
${profileResult.aiGuidelines || '无'}
    `.trim();

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; 
                    max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 25px; color: white;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #4CAF50;">✅ 用户画像分析完成</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 20px; font-size: 14px;">
                请确认以下分析结果，确认后将保存为你的专属用户画像
            </p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; 
                        white-space: pre-wrap; line-height: 1.8; font-size: 14px; max-height: 400px; overflow-y: auto;">
${profileDisplay}
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeProfileConfirmModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ 取消
                </button>
                <button onclick="confirmAndSaveProfile()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ✅ 确认并保存画像
                </button>
            </div>
        </div>
    `;

    // 临时存储待确认的画像
    window._pendingUserProfile = {
        result: profileResult,
        answers: originalAnswers,
        createdAt: new Date().toISOString()
    };

    document.body.appendChild(modal);
}

/**
 * 关闭画像确认弹窗
 */
function closeProfileConfirmModal() {
    const modal = document.getElementById('profileConfirmModal');
    if (modal) modal.remove();
    window._pendingUserProfile = null;
}

/**
 * 确认并保存用户画像到IndexedDB
 */
async function confirmAndSaveProfile() {
    if (!window._pendingUserProfile) {
        alert('没有待保存的用户画像');
        return;
    }

    const pendingProfile = window._pendingUserProfile;

    // 如果当前有激活画像，询问用户如何保存
    if (activeProfileId) {
        const currentProfile = await loadProfileById(activeProfileId);
        const currentName = currentProfile?.name || '当前画像';

        // 弹出选择对话框
        const choice = confirm(
            `⚠️ 你当前正在使用画像「${currentName}」\n\n` +
            `点击「确定」→ 另存为新画像（推荐）\n` +
            `点击「取消」→ 覆盖当前画像`
        );

        if (choice) {
            // 另存为新画像
            const newName = prompt('请为新画像起个名字：', '问卷画像 ' + new Date().toLocaleDateString());
            if (!newName) {
                // 用户取消了命名
                return;
            }

            try {
                const newId = await saveProfileWithName(pendingProfile, newName.trim());
                await switchToProfile(newId);
                await refreshProfileSelector();

                closeProfileConfirmModal();
                alert(`✅ 新画像「${newName.trim()}」已保存！\n\n原画像「${currentName}」保持不变。`);
            } catch (error) {
                console.error('[🎭用户画像] 保存失败:', error);
                alert('保存失败：' + error.message);
            }
            return;
        }
        // 如果选择取消，继续执行覆盖逻辑
    }

    // 覆盖当前画像或首次保存
    confirmedUserProfile = pendingProfile;

    // 保存到IndexedDB
    try {
        await saveUserProfileToIndexedDB(confirmedUserProfile);

        // 如果有激活画像，同步更新多画像存储
        if (activeProfileId) {
            const name = confirmedUserProfile?.name || '问卷画像';
            await saveProfileWithName(confirmedUserProfile, name, activeProfileId);
        }

        console.log('[🎭用户画像] 已保存到IndexedDB');

        // 更新UI显示
        updateProfileDisplay();
        await refreshProfileSelector();

        closeProfileConfirmModal();
        alert('✅ 用户画像已保存！\n\nAI将根据你的画像定制剧情走向。\n画像会随存档一起备份和导入导出。');

    } catch (error) {
        console.error('[🎭用户画像] 保存失败:', error);
        alert('保存失败：' + error.message);
    }
}

/**
 * 更新画像显示
 */
function updateProfileDisplay() {
    const textarea = document.getElementById('currentUserProfile');
    if (textarea && confirmedUserProfile && confirmedUserProfile.result) {
        // 使用完整的画像显示（与loadUserProfileSettingsToUI一致）
        textarea.value = generateEditableProfileText(confirmedUserProfile.result, confirmedUserProfile.createdAt);
    }
}

/**
 * 手动保存用户画像修改
 * 允许用户直接编辑textarea中的内容并保存
 */
async function saveManualProfileEdit() {
    const textarea = document.getElementById('currentUserProfile');
    if (!textarea) {
        alert('❌ 找不到画像输入框！');
        console.error('[🎭用户画像] 找不到 id="currentUserProfile" 的元素');
        return;
    }

    const content = textarea.value.trim();
    console.log('[🎭用户画像] ========== 开始保存 ==========');
    console.log('[🎭用户画像] textarea获取的原始内容长度:', content.length);
    console.log('[🎭用户画像] textarea获取的原始内容（前500字符）:', content.substring(0, 500));

    if (!content) {
        alert('⚠️ 画像内容不能为空！');
        return;
    }

    try {
        // 解析用户输入的画像内容
        const parsedProfile = parseManualProfileInput(content);
        console.log('[🎭用户画像] 解析结果（所有字段）:', JSON.stringify(parsedProfile, null, 2));

        // 创建新的profile对象（不修改原对象）
        const newProfile = {
            createdAt: confirmedUserProfile?.createdAt || new Date().toISOString(),
            answers: confirmedUserProfile?.answers || {},
            result: {},
            updatedAt: new Date().toISOString()
        };

        // 如果有原有结果，先复制过来
        if (confirmedUserProfile && confirmedUserProfile.result) {
            console.log('[🎭用户画像] 原有画像 summary:', confirmedUserProfile.result.summary);
            newProfile.result = { ...confirmedUserProfile.result };
        }

        // 用解析的新值覆盖（只覆盖非空值）
        let updatedCount = 0;
        for (const [key, value] of Object.entries(parsedProfile)) {
            if (value !== undefined && value !== null && value !== '' &&
                !(Array.isArray(value) && value.length === 0)) {
                const oldValue = newProfile.result[key];
                newProfile.result[key] = value;
                if (oldValue !== value) {
                    console.log(`[🎭用户画像] 更新字段 ${key}: "${String(oldValue).substring(0, 50)}" -> "${String(value).substring(0, 50)}"`);
                    updatedCount++;
                }
            }
        }
        console.log(`[🎭用户画像] 共更新了 ${updatedCount} 个字段`);

        // 标记为手动编辑
        newProfile.result.manuallyEdited = true;
        newProfile.result.lastEditedAt = new Date().toISOString();

        console.log('[🎭用户画像] 最终保存的画像 summary:', newProfile.result.summary);

        // 保存到IndexedDB
        await saveUserProfileToIndexedDB(newProfile);
        console.log('[🎭用户画像] IndexedDB保存完成');

        // 从IndexedDB重新加载以确认保存成功
        const reloadedProfile = await loadUserProfileFromIndexedDB();

        if (reloadedProfile && reloadedProfile.result) {
            confirmedUserProfile = reloadedProfile;
            console.log('[🎭用户画像] 保存验证成功，reloaded summary:', reloadedProfile.result.summary);
            alert('✅ 用户画像修改已保存！\n\nAI将根据修改后的画像定制剧情走向。');
        } else {
            console.error('[🎭用户画像] 保存验证失败，数据未能正确写入');
            alert('⚠️ 保存可能未成功，请刷新页面确认！');
        }
    } catch (error) {
        console.error('[🎭用户画像] 保存失败:', error);
        alert('❌ 保存失败：' + error.message);
    }
}

/**
 * 解析用户手动输入的画像内容
 * 尝试从文本中提取关键信息（支持完整画像格式）
 */
function parseManualProfileInput(content) {
    const result = {};

    // 按行解析
    const lines = content.split('\n');

    // 用于收集AI创作指南的多行内容
    let inAIGuidelines = false;
    let aiGuidelinesLines = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过分隔线和空行，但特殊处理【AI创作指南】
        if (trimmedLine === '---') {
            // 遇到分隔线，结束AI创作指南收集
            if (inAIGuidelines) {
                inAIGuidelines = false;
                console.log('[🎭解析] 遇到分隔线，结束收集AI创作指南，共' + aiGuidelinesLines.length + '行');
            }
            continue;
        }

        if (trimmedLine === '') {
            continue;
        }

        // 处理【xxx】格式的分类标题
        if (trimmedLine.startsWith('【') && trimmedLine.endsWith('】')) {
            // 如果是【AI创作指南】，开始收集后续内容
            if (trimmedLine === '【AI创作指南】') {
                inAIGuidelines = true;
                aiGuidelinesLines = []; // 清空之前的内容
                console.log('[🎭解析] 开始收集AI创作指南');
            } else {
                // 其他分类标题，结束AI创作指南收集
                if (inAIGuidelines) {
                    inAIGuidelines = false;
                    console.log('[🎭解析] 结束收集AI创作指南，共' + aiGuidelinesLines.length + '行');
                }
            }
            continue;
        }

        // 如果正在收集AI创作指南
        if (inAIGuidelines) {
            if (trimmedLine.startsWith('创建时间：')) {
                inAIGuidelines = false;
            } else {
                aiGuidelinesLines.push(trimmedLine);
                continue;
            }
        }

        // 解析各个字段
        if (trimmedLine.startsWith('📌') || trimmedLine.includes('用户特点：')) {
            result.summary = trimmedLine.replace(/^📌\s*/, '').replace('用户特点：', '').trim();
        }
        // 剧情偏好
        else if (trimmedLine.startsWith('剧情类型：') || trimmedLine.startsWith('剧情偏好：')) {
            result.storyPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('故事基调：')) {
            result.storyTone = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('剧情结构：')) {
            result.storyStructure = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('节奏偏好：')) {
            result.pacing = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('反转偏好：')) {
            result.plotTwistPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('冲突类型：')) {
            result.conflictTypes = parseArrayValue(trimmedLine);
        }
        // 文风描写
        else if (trimmedLine.startsWith('文风偏好：')) {
            result.writingStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('喜欢的作品：')) {
            result.favoriteWorks = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('文风详细要求：')) {
            result.writingStyleDetails = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('对话风格：')) {
            result.dialogueStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('回复详细度：')) {
            result.detailLevel = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('描写重点：')) {
            result.descriptionFocus = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('叙事手法：')) {
            result.narrativeStyle = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('用词风格：')) {
            result.languageStyle = getValueAfterColon(trimmedLine);
        }
        // 角色互动
        else if (trimmedLine.startsWith('主角类型：')) {
            result.protagonistType = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('主角性格：')) {
            result.protagonistPersonality = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('主角背景：')) {
            result.protagonistBackground = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('喜欢角色：')) {
            result.favoriteCharacters = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('关系类型：')) {
            result.relationshipTypes = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('关系深度：')) {
            result.relationshipDepth = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('感情线：')) {
            result.haremPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('NPC风格：')) {
            result.npcStyle = getValueAfterColon(trimmedLine);
        }
        // 战斗冒险
        else if (trimmedLine.startsWith('难度偏好：')) {
            result.difficulty = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('战斗风格：')) {
            result.combatStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('战斗元素：')) {
            result.combatElements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('爽感需求：')) {
            result.powerFantasy = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('敌人类型：')) {
            result.enemyTypes = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('成长速度：')) {
            result.growthSpeed = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('失败后果：')) {
            result.consequenceLevel = getValueAfterColon(trimmedLine);
        }
        // 世界与内容
        else if (trimmedLine.startsWith('世界观兴趣：')) {
            result.worldBuilding = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('世界元素：')) {
            result.worldElements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('道德选择：')) {
            result.moralChoices = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('R18偏好：')) {
            result.r18Preference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('R18类型：')) {
            result.r18Elements = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('结局偏好：')) {
            result.endingPreference = getValueAfterColon(trimmedLine);
        }
        // 特殊偏好
        else if (trimmedLine.startsWith('叙事人称：')) {
            result.immersionStyle = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('AI创作自由度：')) {
            result.aiCreativity = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('幽默风格：')) {
            result.humorStyle = parseArrayValue(trimmedLine);
        } else if (trimmedLine.startsWith('时间跳跃：')) {
            result.timeSkipPreference = getValueAfterColon(trimmedLine);
        } else if (trimmedLine.startsWith('系统融入：')) {
            result.systemIntegration = getValueAfterColon(trimmedLine);
        }
        // 核心偏好
        else if (trimmedLine.startsWith('喜欢：')) {
            const val = getValueAfterColon(trimmedLine);
            if (val && val !== '无') {
                result.likes = val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
            }
        } else if (trimmedLine.startsWith('不喜欢：')) {
            const val = getValueAfterColon(trimmedLine);
            if (val && val !== '无') {
                result.dislikes = val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
            }
        } else if (trimmedLine.startsWith('特别注意：')) {
            result.specialNotes = getValueAfterColon(trimmedLine);
        }
        // AI创作指南（可能是多行）
        else if (trimmedLine.startsWith('【AI创作指南】') || trimmedLine === 'AI创作指南：' || trimmedLine === '【AI创作指南】') {
            inAIGuidelines = true;
            const afterColon = trimmedLine.split('：')[1]?.trim();
            if (afterColon) {
                aiGuidelinesLines.push(afterColon);
            }
        } else if (trimmedLine.startsWith('AI创作指南：') || trimmedLine.startsWith('创作指南：')) {
            result.aiGuidelines = trimmedLine.split('：').slice(1).join('：').trim();
        }
    }

    // 合并AI创作指南
    if (aiGuidelinesLines.length > 0) {
        result.aiGuidelines = aiGuidelinesLines.join('\n');
        console.log('[🎭解析] 合并后的AI创作指南（前200字符）:', result.aiGuidelines.substring(0, 200));
    } else {
        console.log('[🎭解析] 未收集到AI创作指南内容');
    }

    // 如果没有解析到summary，使用整个内容的第一行
    if (!result.summary && content.length > 0) {
        const firstLine = lines[0]?.replace(/^📌\s*/, '').replace(/^📋\s*/, '').replace('用户特点：', '').trim();
        result.summary = firstLine || content.substring(0, 100);
    }

    // 将完整内容也保存，方便查看
    result.rawContent = content;

    return result;
}

/**
 * 提取冒号后的值
 */
function getValueAfterColon(line) {
    const parts = line.split('：');
    return parts.length > 1 ? parts.slice(1).join('：').trim() : '';
}

/**
 * 解析数组值（用顿号、逗号分隔）
 */
function parseArrayValue(line) {
    const val = getValueAfterColon(line);
    if (!val || val === '无' || val === '未指定') return null;
    return val.split(/[、,，]/).map(s => s.trim()).filter(s => s);
}

// ==================== IndexedDB 用户画像存储 ====================

const USER_PROFILE_DB_NAME = 'UserProfileDB';
const USER_PROFILE_STORE_NAME = 'userProfile';  // 保留用于兼容旧数据
const USER_PROFILES_STORE_NAME = 'userProfiles'; // 新增：多画像存储
const ACTIVE_PROFILE_STORE_NAME = 'activeProfile'; // 新增：当前激活画像ID

// 当前激活画像ID
let activeProfileId = null;

/**
 * 打开IndexedDB（升级到版本2支持多画像）
 */
function openUserProfileDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(USER_PROFILE_DB_NAME, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            // 版本1：单画像存储（兼容旧数据）
            if (!db.objectStoreNames.contains(USER_PROFILE_STORE_NAME)) {
                db.createObjectStore(USER_PROFILE_STORE_NAME, { keyPath: 'id' });
            }

            // 版本2：多画像存储
            if (oldVersion < 2) {
                // 创建多画像存储
                if (!db.objectStoreNames.contains(USER_PROFILES_STORE_NAME)) {
                    const profilesStore = db.createObjectStore(USER_PROFILES_STORE_NAME, { keyPath: 'id' });
                    profilesStore.createIndex('name', 'name', { unique: false });
                    profilesStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                // 创建激活画像ID存储
                if (!db.objectStoreNames.contains(ACTIVE_PROFILE_STORE_NAME)) {
                    db.createObjectStore(ACTIVE_PROFILE_STORE_NAME, { keyPath: 'key' });
                }
                console.log('[🎭用户画像] 数据库升级到版本2，支持多画像存储');
            }
        };
    });
}

/**
 * 生成唯一画像ID
 */
function generateProfileId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 获取所有已保存的画像列表
 * @returns {Promise<Array>} 画像列表 [{id, name, createdAt, ...}, ...]
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
                // 按创建时间倒序排列
                profiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                resolve(profiles);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭用户画像] 获取画像列表失败:', e);
        return [];
    }
}

/**
 * 以指定名称保存画像
 * @param {object} profile - 画像数据
 * @param {string} name - 画像名称
 * @param {string|null} existingId - 如果提供则更新现有画像，否则创建新画像
 * @returns {Promise<string>} 保存的画像ID
 */
async function saveProfileWithName(profile, name, existingId = null) {
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILES_STORE_NAME);

        const profileId = existingId || generateProfileId();
        const profileData = {
            id: profileId,
            name: name || '未命名画像',
            ...profile,
            createdAt: existingId ? profile.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        store.put(profileData);
        tx.oncomplete = () => {
            db.close();
            console.log('[🎭用户画像] 画像已保存:', name, '(ID:', profileId, ')');
            resolve(profileId);
        };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * 根据ID加载画像
 * @param {string} profileId - 画像ID
 * @returns {Promise<object|null>} 画像数据
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
        console.warn('[🎭用户画像] 加载画像失败:', e);
        return null;
    }
}

/**
 * 删除指定画像
 * @param {string} profileId - 画像ID
 */
async function deleteProfileById(profileId) {
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILES_STORE_NAME);
        store.delete(profileId);
        tx.oncomplete = () => {
            db.close();
            console.log('[🎭用户画像] 画像已删除:', profileId);
            // 如果删除的是当前激活画像，清除激活状态
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
 * 设置当前激活画像ID
 * @param {string|null} profileId - 画像ID
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
            console.log('[🎭用户画像] 激活画像ID:', profileId);
            resolve();
        };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * 获取当前激活画像ID
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
        console.warn('[🎭用户画像] 获取激活画像ID失败:', e);
        return null;
    }
}

/**
 * 切换到指定画像
 * @param {string} profileId - 画像ID
 */
async function switchToProfile(profileId) {
    const profile = await loadProfileById(profileId);
    if (profile) {
        confirmedUserProfile = profile;
        await setActiveProfileId(profileId);
        updateProfileDisplay();
        console.log('[🎭用户画像] 已切换到画像:', profile.name);
        return true;
    }
    return false;
}

/**
 * 刷新画像选择器下拉框
 */
async function refreshProfileSelector() {
    const selector = document.getElementById('profileSelector');
    if (!selector) return;

    const profiles = await getAllUserProfiles();
    const currentActiveId = activeProfileId || await getActiveProfileId();

    // 清空选项
    selector.innerHTML = '<option value="">-- 未选择画像 --</option>';

    // 添加画像选项
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name || '未命名画像';
        if (profile.id === currentActiveId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    // 更新画像名称输入框
    const nameInput = document.getElementById('profileName');
    if (nameInput && currentActiveId) {
        const currentProfile = profiles.find(p => p.id === currentActiveId);
        if (currentProfile) {
            nameInput.value = currentProfile.name || '';
        }
    }

    console.log('[🎭用户画像] 画像选择器已刷新，共', profiles.length, '个画像');
}

/**
 * 画像选择器变更事件
 */
async function onProfileSelectorChange() {
    const selector = document.getElementById('profileSelector');
    const selectedId = selector?.value;

    if (!selectedId) {
        // 清除当前画像
        confirmedUserProfile = null;
        activeProfileId = null;
        await setActiveProfileId(null);
        updateProfileDisplay();

        // 清空名称输入框
        const nameInput = document.getElementById('profileName');
        if (nameInput) nameInput.value = '';

        // 清空textarea
        const textarea = document.getElementById('currentUserProfile');
        if (textarea) {
            textarea.value = '尚未选择画像，请从下拉框选择或创建新画像。';
        }
        return;
    }

    await switchToProfile(selectedId);

    // 更新名称输入框
    const nameInput = document.getElementById('profileName');
    if (nameInput && confirmedUserProfile) {
        nameInput.value = confirmedUserProfile.name || '';
    }
}

/**
 * 另存为新画像
 */
async function saveProfileAsNew() {
    const nameInput = document.getElementById('profileName');
    const textarea = document.getElementById('currentUserProfile');

    const name = nameInput?.value?.trim();
    if (!name) {
        alert('⚠️ 请先输入画像名称！');
        nameInput?.focus();
        return;
    }

    const content = textarea?.value?.trim();
    if (!content) {
        alert('⚠️ 画像内容不能为空！');
        return;
    }

    try {
        // 解析画像内容
        const parsedProfile = parseManualProfileInput(content);

        const newProfile = {
            result: parsedProfile,
            answers: {},
            createdAt: new Date().toISOString()
        };

        // 保存为新画像
        const newId = await saveProfileWithName(newProfile, name);

        // 切换到新画像
        await switchToProfile(newId);

        // 刷新选择器
        await refreshProfileSelector();

        alert('✅ 画像「' + name + '」已保存！');
    } catch (error) {
        console.error('[🎭用户画像] 保存新画像失败:', error);
        alert('❌ 保存失败：' + error.message);
    }
}

/**
 * 删除当前画像
 */
async function deleteCurrentProfile() {
    if (!activeProfileId) {
        alert('⚠️ 当前没有选中的画像！');
        return;
    }

    const currentProfile = await loadProfileById(activeProfileId);
    const name = currentProfile?.name || '未命名画像';

    if (!confirm(`⚠️ 确定要删除画像「${name}」吗？\n\n此操作不可撤销！`)) {
        return;
    }

    try {
        await deleteProfileById(activeProfileId);

        // 刷新选择器
        await refreshProfileSelector();

        // 清空显示
        const textarea = document.getElementById('currentUserProfile');
        if (textarea) {
            textarea.value = '画像已删除。请从下拉框选择或创建新画像。';
        }

        const nameInput = document.getElementById('profileName');
        if (nameInput) nameInput.value = '';

        alert('✅ 画像「' + name + '」已删除！');
    } catch (error) {
        console.error('[🎭用户画像] 删除画像失败:', error);
        alert('❌ 删除失败：' + error.message);
    }
}

/**
 * 迁移旧版单画像到新版多画像存储
 */
async function migrateOldProfile() {
    try {
        const db = await openUserProfileDB();

        // 检查是否有旧版画像
        const checkTx = db.transaction(USER_PROFILE_STORE_NAME, 'readonly');
        const checkStore = checkTx.objectStore(USER_PROFILE_STORE_NAME);
        const oldProfile = await new Promise((resolve) => {
            const request = checkStore.get('main');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });

        if (oldProfile && oldProfile.result) {
            // 检查是否已经迁移过
            const profiles = await getAllUserProfiles();
            if (profiles.length === 0) {
                // 迁移旧画像
                const name = '默认画像（迁移）';
                const newId = await saveProfileWithName(oldProfile, name);
                await setActiveProfileId(newId);
                confirmedUserProfile = await loadProfileById(newId);
                console.log('[🎭用户画像] 已迁移旧版画像到新版存储');
            }
        }

        db.close();
    } catch (e) {
        console.warn('[🎭用户画像] 迁移旧画像失败:', e);
    }
}

/**
 * 保存用户画像到IndexedDB（兼容旧版 + 多画像存储）
 */
async function saveUserProfileToIndexedDB(profile) {
    // 同时保存到旧版存储（兼容）
    const db = await openUserProfileDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILE_STORE_NAME);
        store.put({ id: 'main', ...profile });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();

    // 如果有激活画像，同时更新多画像存储
    if (activeProfileId) {
        const name = confirmedUserProfile?.name || profile?.name || '未命名画像';
        await saveProfileWithName(profile, name, activeProfileId);
    }
}

/**
 * 从IndexedDB加载用户画像（优先加载激活画像）
 */
async function loadUserProfileFromIndexedDB() {
    try {
        // 先尝试迁移旧画像
        await migrateOldProfile();

        // 获取激活画像ID
        const activeId = await getActiveProfileId();

        if (activeId) {
            // 加载激活画像
            const profile = await loadProfileById(activeId);
            if (profile) {
                confirmedUserProfile = profile;
                console.log('[🎭用户画像] 从IndexedDB加载激活画像:', profile.name);
                return confirmedUserProfile;
            }
        }

        // 如果没有激活画像，尝试加载旧版画像
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readonly');
            const store = tx.objectStore(USER_PROFILE_STORE_NAME);
            const request = store.get('main');
            request.onsuccess = () => {
                db.close();
                if (request.result) {
                    confirmedUserProfile = request.result;
                    console.log('[🎭用户画像] 从IndexedDB加载旧版画像成功');
                }
                resolve(request.result);
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭用户画像] IndexedDB加载失败:', e);
        return null;
    }
}

/**
 * 导出用户画像（用于备份）- 支持多画像
 * @returns {string|null} JSON字符串，包含所有画像和激活ID
 */
async function exportUserProfile() {
    try {
        const allProfiles = await getAllUserProfiles();
        const currentActiveId = activeProfileId || await getActiveProfileId();

        const exportData = {
            version: 2,  // 标记多画像版本
            activeProfileId: currentActiveId,
            profiles: allProfiles,
            // 兼容旧版：也导出当前激活画像
            currentProfile: confirmedUserProfile
        };

        return JSON.stringify(exportData);
    } catch (e) {
        console.warn('[🎭用户画像] 导出失败，回退到单画像模式:', e);
        // 回退：只导出当前画像
        return confirmedUserProfile ? JSON.stringify(confirmedUserProfile) : null;
    }
}

/**
 * 导入用户画像（用于恢复备份）- 支持多画像
 * @param {string|object} profileJson - 画像数据
 */
async function importUserProfile(profileJson) {
    try {
        const data = typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson;

        // 检查是否是多画像格式（版本2+）
        if (data.version >= 2 && Array.isArray(data.profiles)) {
            console.log('[🎭用户画像] 检测到多画像存档，共', data.profiles.length, '个画像');

            // 导入所有画像
            for (const profile of data.profiles) {
                if (profile.id && profile.name) {
                    await saveProfileWithName(profile, profile.name, profile.id);
                }
            }

            // 设置激活画像
            if (data.activeProfileId) {
                await switchToProfile(data.activeProfileId);
            } else if (data.profiles.length > 0) {
                // 如果没有激活ID，使用第一个
                await switchToProfile(data.profiles[0].id);
            }

            await refreshProfileSelector();
            console.log('[🎭用户画像] 多画像导入成功');
            return true;
        }

        // 兼容旧版单画像格式
        let oldProfile = data;
        if (data.currentProfile) {
            oldProfile = data.currentProfile;
        }

        // 为旧版画像生成一个名字
        const name = oldProfile.name || '导入的画像';
        const newId = await saveProfileWithName(oldProfile, name);
        await switchToProfile(newId);
        await refreshProfileSelector();

        console.log('[🎭用户画像] 单画像导入成功');
        return true;
    } catch (e) {
        console.error('[🎭用户画像] 导入失败:', e);
        return false;
    }
}

/**
 * 获取AI创作指南（供分析API使用）
 */
function getAIGuidelines() {
    if (!confirmedUserProfile || !confirmedUserProfile.result) {
        return null;
    }
    return confirmedUserProfile.result.aiGuidelines || null;
}

/**
 * 获取完整确认画像
 */
function getConfirmedProfile() {
    return confirmedUserProfile;
}

// ==================== 导出到全局 ====================

// 挂载到window对象供其他模块调用
window.userProfileAnalyzer = {
    init: initUserProfileSystem,
    analyze: analyzeUserInput,
    analyzeUserInput: analyzeUserInput,  // 别名，兼容两种调用方式
    getEnhancedPrompt: getEnhancedPromptForMainAPI,
    getProfile: () => userProfileData,
    getConfig: () => userProfileConfig,
    isEnabled: () => userProfileConfig.enabled,
    loadSettingsToUI: loadUserProfileSettingsToUI,
    // 新增：问卷相关
    getConfirmedProfile: getConfirmedProfile,
    getAIGuidelines: getAIGuidelines,
    exportProfile: exportUserProfile,
    importProfile: importUserProfile,
    loadFromDB: loadUserProfileFromIndexedDB
};

// 导出UI函数到全局（供onclick调用）
window.toggleUserProfileFields = toggleUserProfileFields;
window.saveUserProfileSettings = saveUserProfileSettings;
window.toggleMemoryDispatcherMode = toggleMemoryDispatcherMode;  // 🆕 记忆调度器模式开关
window.viewUserProfile = viewUserProfile;
window.clearUserProfile = clearUserProfile;
window.openUserProfileQuestionnaire = openUserProfileQuestionnaire;
window.closeQuestionnaireModal = closeQuestionnaireModal;
window.submitQuestionnaire = submitQuestionnaire;
window.closeProfileConfirmModal = closeProfileConfirmModal;
window.confirmAndSaveProfile = confirmAndSaveProfile;
window.saveManualProfileEdit = saveManualProfileEdit;

// 🆕 多画像管理函数导出
window.onProfileSelectorChange = onProfileSelectorChange;
window.saveProfileAsNew = saveProfileAsNew;
window.deleteCurrentProfile = deleteCurrentProfile;
window.refreshProfileSelector = refreshProfileSelector;
window.getAllUserProfiles = getAllUserProfiles;
window.switchToProfile = switchToProfile;

// ==================== 📚 剧情规划存档弹窗 ====================

/**
 * 显示剧情规划存档弹窗
 */
function showPlotArchiveModal() {
    // 如果已存在弹窗，先移除
    const existingModal = document.getElementById('plotArchiveModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 获取按名称分组的剧情
    const plotsByName = plotArchiveManager.getPlotsByName();
    const plotNames = Object.keys(plotsByName).sort((a, b) => {
        // 按最新时间戳排序
        const aTime = plotsByName[a][plotsByName[a].length - 1]?.timestamp || 0;
        const bTime = plotsByName[b][plotsByName[b].length - 1]?.timestamp || 0;
        return bTime - aTime;
    });

    // 创建弹窗HTML
    const modalHtml = `
        <div id="plotArchiveModal" class="modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; width: 90%; max-width: 900px; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid rgba(100,100,255,0.2);">
                <div class="modal-header" style="padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #fff; font-size: 1.4rem;">📚 剧情规划存档 <span style="font-size: 0.9rem; color: #888;">(共${plotArchiveManager.plots.length}条)</span></h2>
                    <div>
                        <button onclick="clearPlotArchive()" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">清空全部</button>
                        <button onclick="document.getElementById('plotArchiveModal').remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">关闭</button>
                    </div>
                </div>
                <div class="modal-body" style="display: flex; height: calc(85vh - 80px);">
                    <div class="plot-list" style="width: 280px; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; padding: 15px;">
                        ${plotNames.length === 0 ? '<p style="color: #888; text-align: center; padding: 20px;">暂无剧情规划存档</p>' : ''}
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
                                    <div style="color: #666; font-size: 0.75rem;">${plots.length}条记录</div>
                                </div>
                            `;
    }).join('')}
                    </div>
                    <div class="plot-detail" id="plotDetailPane" style="flex: 1; padding: 20px; overflow-y: auto; color: #ddd;">
                        <p style="color: #888; text-align: center; padding: 40px;">← 点击左侧剧情名称查看详情</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('[📚剧情存档] 弹窗已打开');
}

/**
 * 显示指定剧情的详情
 * @param {string} storyName - 剧情名称
 */
function showPlotDetail(storyName) {
    const detailPane = document.getElementById('plotDetailPane');
    if (!detailPane) return;

    const plotsByName = plotArchiveManager.getPlotsByName();
    const plots = plotsByName[storyName] || [];

    if (plots.length === 0) {
        detailPane.innerHTML = '<p style="color: #888;">未找到该剧情</p>';
        return;
    }

    let html = `
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem;">📖 ${storyName}</h3>
            <p style="color: #888; margin: 0; font-size: 0.9rem;">共${plots.length}条规划记录</p>
        </div>
    `;

    // 从新到旧显示
    const reversedPlots = [...plots].reverse();
    reversedPlots.forEach((plot, idx) => {
        const time = new Date(plot.timestamp).toLocaleString('zh-CN');
        html += `
            <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 15px; margin-bottom: 15px; border-left: 3px solid #6c5ce7;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="color: #888; font-size: 0.85rem;">🕐 ${time}</span>
                    <button onclick="deletePlotById('${plot.id}')" style="background: #c0392b; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">删除</button>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #74b9ff;">① </span>
                    <span style="color: #ddd;">${plot.step1 || '(无)'}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #55efc4;">② </span>
                    <span style="color: #ddd;">${plot.step2 || '(无)'}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="color: #fd79a8;">③ </span>
                    <span style="color: #ddd;">${plot.step3 || '(无)'}</span>
                </div>
                ${plot.reasoning ? `<div style="color: #888; font-size: 0.85rem; font-style: italic; margin-top: 10px;">💭 ${plot.reasoning}</div>` : ''}
            </div>
        `;
    });

    detailPane.innerHTML = html;
}

/**
 * 删除指定ID的剧情
 * @param {string} plotId - 剧情ID
 */
function deletePlotById(plotId) {
    if (confirm('确定要删除这条剧情规划吗？')) {
        plotArchiveManager.deletePlot(plotId);
        // 刷新弹窗
        showPlotArchiveModal();
    }
}

/**
 * 清空所有剧情存档
 */
function clearPlotArchive() {
    if (confirm('确定要清空所有剧情规划存档吗？此操作不可撤销！')) {
        plotArchiveManager.clearAll();
        // 刷新弹窗
        showPlotArchiveModal();
    }
}

// 暴露函数到全局
window.showPlotArchiveModal = showPlotArchiveModal;
window.showPlotDetail = showPlotDetail;
window.deletePlotById = deletePlotById;
window.clearPlotArchive = clearPlotArchive;

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserProfileSystem);
} else {
    initUserProfileSystem();
}

console.log('[🎭用户画像] 模块已加载');
console.log('[📚剧情存档] 模块已加载，当前存档数量:', plotArchiveManager.plots.length);
