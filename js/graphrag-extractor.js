/**
 * GraphRAG提取器 - 使用Flash API提取语义信息
 * 与记忆调度器并发调用
 */

/**
 * 获取GraphRAG提取提示词
 */
function getGraphRAGPrompt() {
    return `你是【语义网络分析师】，负责从剧情中动态识别和提取实体、关系及其语义维度。

【核心任务】
从当前剧情内容中识别：
1. **实体（Entity）**：人物、地点、物品、事件、势力、概念等
2. **关系（Relation）**：实体之间的关联
3. **维度（Dimension）**：实体共享的语义特征（由你自主分析生成）

【什么是维度？】
维度是你从实体中提炼出的**抽象语义标签**，用于发现隐含关联。
- 地理相关：如"上海"、"江南"、"深海"
- 势力相关：如"正道"、"魔教"、"拉莱耶信仰"
- 概念相关：如"禁忌"、"传承"、"温暖"
- 情感相关：如"执念"、"羁绊"、"恐惧"

【维度的作用】
如果"张三"和"生煎"都有维度"上海"：
- 提到张三时，系统联想到上海的其他事物
- 提到生煎时，系统联想到来自上海的人物

【输出格式（JSON）】
{
  "semanticUpsert": {
    "analysisReason": "简述为什么提取这些实体和维度（1句话）",
    "newEntities": [
      {
        "name": "实体名称",
        "type": "person|place|item|event|faction|concept",
        "dimensions": ["维度1", "维度2"],
        "attributes": { "key": "value" },
        "description": "可选的简短描述"
      }
    ],
    "newRelations": [
      {
        "subject": "主语实体名",
        "predicate": "关系类型",
        "object": "宾语实体名",
        "certainty": 0.0-1.0,
        "context": "可选，关系的上下文说明"
      }
    ],
    "dimensionLinks": [
      {
        "dimension": "维度名称",
        "entities": ["共享此维度的实体名"],
        "semanticMeaning": "这个维度代表的含义"
      }
    ]
  }
}

【实体类型】
- person: 人物
- place: 地点
- item: 物品
- event: 事件
- faction: 势力
- concept: 抽象概念

【关系类型参考（不限于此）】
- 归属类：hometown、origin、belongs_to、member_of
- 社会类：friend、enemy、master、disciple
- 情感类：loves、fears、hates、respects
- 功能类：owns、uses、creates
- 空间类：located_in、near
- 因果类：caused_by、leads_to、related_to

【certainty可信度】
- 1.0：明确陈述
- 0.7-0.9：强烈暗示
- 0.5-0.7：合理推测

【特别注意】
1. 只提取**新出现或有新信息**的实体和关系
2. 维度是关键：设计有意义的维度，这是语义涌现的核心
3. 如果没有值得提取的新信息，返回空数组
4. 对于主角（玩家）的互动事件，一定要提取对方人物和相关地点`;
}

/**
 * 构建语义提取的上下文
 */
function buildExtractionContext(userInput, lastAIReply, existingEntities = []) {
    let context = `【用户当前输入】
"${userInput}"

【最近剧情发展】
${lastAIReply || '（首次对话，无历史）'}`;

    // 添加已有实体列表（避免重复）
    if (existingEntities.length > 0) {
        context += `\n\n【已有实体（避免重复）】\n${existingEntities.slice(0, 30).join('、')}`;
    }

    context += `\n\n请从上述内容中提取新出现的实体、关系和维度。如果没有值得提取的新信息，返回空的semanticUpsert对象。`;

    return context;
}

/**
 * 独立的GraphRAG提取函数（与记忆调度器并发调用）
 */
async function extractGraphRAG(userInput, gameContext) {
    // 检查是否启用
    if (!window.graphRAGLite?.config?.enabled) {
        console.log('[GraphRAG-Extractor] 未启用，跳过提取');
        return null;
    }

    // 检查是否在记忆调度器模式
    const isMemoryDispatcherMode = window.userProfileConfig?.memoryDispatcherEnabled ||
        window.memoryDispatcherEnabled;
    if (!isMemoryDispatcherMode) {
        console.log('[GraphRAG-Extractor] 非记忆调度器模式，跳过提取');
        return null;
    }

    // 不再重复检查额外API配置，callExtraAI函数会自己处理
    // （额外API配置是HTML中的全局变量extraApiConfig，不一定挂载到window上）

    console.log('[GraphRAG-Extractor] 开始提取...');
    console.time('[GraphRAG-Extractor] 提取耗时');

    try {
        // 获取提示词
        const systemPrompt = getGraphRAGPrompt();

        // 获取最近AI回复
        let lastAIReply = '';
        if (window.gameState?.conversationHistory) {
            const history = window.gameState.conversationHistory;
            const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
            lastAIReply = lastAI?.content?.substring(0, 2000) || '';
        }

        // 获取现有实体列表
        const existingEntities = window.graphRAGLite?.getAllEntities()?.map(e => e.name) || [];

        // 构建上下文
        const context = buildExtractionContext(userInput, lastAIReply, existingEntities);

        // 构建消息
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context }
        ];

        // 调用额外API
        const response = await callExtraAI(messages);

        console.timeEnd('[GraphRAG-Extractor] 提取耗时');

        // 解析响应
        const result = parseGraphRAGResponse(response);

        if (result?.semanticUpsert) {
            console.log('[GraphRAG-Extractor] 提取结果:',
                '实体:', result.semanticUpsert.newEntities?.length || 0,
                '关系:', result.semanticUpsert.newRelations?.length || 0);
        }

        return result;
    } catch (error) {
        console.error('[GraphRAG-Extractor] 提取失败:', error);
        console.timeEnd('[GraphRAG-Extractor] 提取耗时');
        return null;
    }
}

/**
 * 解析GraphRAG响应
 */
function parseGraphRAGResponse(response) {
    if (!response) return null;

    try {
        let jsonStr = response;

        // 移除markdown代码块
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // 提取JSON对象
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }

        const result = JSON.parse(jsonStr);
        return result;
    } catch (e) {
        console.warn('[GraphRAG-Extractor] 解析响应失败:', e);
        console.log('[GraphRAG-Extractor] 原始响应:', response?.substring(0, 500));
        return null;
    }
}

/**
 * 并发处理用户输入（同时调用记忆调度器和GraphRAG提取）
 */
async function processUserInputWithGraphRAG(userInput, gameContext) {
    const graphRAGEnabled = window.graphRAGLite?.config?.enabled;
    const memoryDispatcherMode = window.userProfileConfig?.memoryDispatcherEnabled ||
        window.memoryDispatcherEnabled;

    if (!memoryDispatcherMode) {
        // 非记忆调度器模式，不执行
        return null;
    }

    console.log('[GraphRAG-Extractor] 开始并发处理...');
    console.time('[GraphRAG-Extractor] 总耗时');

    let memoryResult = null;
    let graphResult = null;

    if (graphRAGEnabled) {
        // 并发执行
        [memoryResult, graphResult] = await Promise.all([
            // 任务1：记忆调度器（现有）
            window.analyzeUserInput ? window.analyzeUserInput(userInput, gameContext) : null,

            // 任务2：GraphRAG提取（新增）
            extractGraphRAG(userInput, gameContext)
        ]);
    } else {
        // 仅执行记忆调度器
        memoryResult = window.analyzeUserInput ?
            await window.analyzeUserInput(userInput, gameContext) : null;
    }

    console.timeEnd('[GraphRAG-Extractor] 总耗时');

    // 处理GraphRAG结果
    if (graphResult?.semanticUpsert) {
        await window.graphRAGLite?.processUpdate(graphResult.semanticUpsert);
    }

    // 合并结果
    return {
        ...memoryResult,
        graphUpdate: graphResult?.semanticUpsert
    };
}

/**
 * 获取GraphRAG上下文（供记忆调度器使用）
 */
async function getGraphRAGContext(userInput) {
    if (!window.graphRAGLite?.config?.enabled) {
        return '';
    }

    // 获取最近AI回复
    let lastAIReply = '';
    if (window.gameState?.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
        lastAIReply = lastAI?.content?.substring(0, 500) || '';
    }

    const context = await window.graphRAGLite.buildContext(userInput, lastAIReply);
    return context || '';
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.getGraphRAGPrompt = getGraphRAGPrompt;
    window.extractGraphRAG = extractGraphRAG;
    window.parseGraphRAGResponse = parseGraphRAGResponse;
    window.processUserInputWithGraphRAG = processUserInputWithGraphRAG;
    window.getGraphRAGContext = getGraphRAGContext;

    console.log('[GraphRAG-Extractor] 提取器模块已加载');
}
