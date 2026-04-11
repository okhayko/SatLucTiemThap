/**
 * API调用函数模块
 * 包含：AI调用、额外API调用、OpenAI格式调用、Gemini格式调用等
 * 从 game.html 中提取的API调用功能模块
 */

// ==================== API调用函数 ====================

// 调用额外API
function getConfiguredMaxTokens() {
    const savedConfig = localStorage.getItem('gameConfig');
    return savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;
}

function getStreamContentFromOpenAIEvent(payload) {
    return extractTextFromOpenAICompatiblePayload(payload, true);
}

function getStreamContentFromGeminiEvent(payload) {
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    let text = '';

    candidates.forEach(candidate => {
        const parts = candidate?.content?.parts;
        if (!Array.isArray(parts)) {
            return;
        }

        parts.forEach(part => {
            if (typeof part?.text === 'string') {
                text += part.text;
            }
        });
    });

    return text;
}

function extractTextFromParts(parts) {
    if (!Array.isArray(parts)) {
        return '';
    }

    let text = '';
    parts.forEach(part => {
        if (typeof part === 'string') {
            text += part;
        } else if (typeof part?.text === 'string') {
            text += part.text;
        }
    });
    return text;
}

function extractTextFromOpenAICompatiblePayload(payload, isStream = false) {
    const choices = Array.isArray(payload?.choices) ? payload.choices : [];
    let text = '';

    choices.forEach(choice => {
        if (isStream) {
            const deltaContent = choice?.delta?.content;
            if (typeof deltaContent === 'string') {
                text += deltaContent;
            } else {
                text += extractTextFromParts(deltaContent);
            }

            if (!text && typeof choice?.message?.content === 'string') {
                text += choice.message.content;
            }
            if (!text && typeof choice?.text === 'string') {
                text += choice.text;
            }
            return;
        }

        if (typeof choice?.message?.content === 'string') {
            text += choice.message.content;
            return;
        }

        if (Array.isArray(choice?.message?.content)) {
            text += extractTextFromParts(choice.message.content);
            return;
        }

        if (typeof choice?.text === 'string') {
            text += choice.text;
            return;
        }

        if (typeof choice?.delta?.content === 'string') {
            text += choice.delta.content;
            return;
        }

        text += extractTextFromParts(choice?.delta?.content);
    });

    if (text) {
        return text;
    }

    if (typeof payload?.output_text === 'string') {
        return payload.output_text;
    }

    if (typeof payload?.response === 'string') {
        return payload.response;
    }

    if (typeof payload?.content === 'string') {
        return payload.content;
    }

    if (typeof payload?.text === 'string') {
        return payload.text;
    }

    if (Array.isArray(payload?.output)) {
        payload.output.forEach(item => {
            if (typeof item?.content === 'string') {
                text += item.content;
            } else if (Array.isArray(item?.content)) {
                text += extractTextFromParts(item.content);
            }
        });
        if (text) {
            return text;
        }
    }

    if (payload?.candidates) {
        return getStreamContentFromGeminiEvent(payload);
    }

    return '';
}

function normalizeMessagesForMoonshot(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return messages;
    }

    const assistantMessages = messages.filter(message => message?.role === 'assistant' && typeof message?.content === 'string' && message.content.trim());
    if (assistantMessages.length <= 1) {
        return messages;
    }

    const systemMessages = messages.filter(message => message?.role === 'system' && typeof message?.content === 'string' && message.content.trim());
    const otherMessages = messages.filter(message => message?.role !== 'assistant' && message?.role !== 'system');

    const mergedSections = [];
    const mergedSystemText = systemMessages.map(message => message.content.trim()).join('\n\n');
    if (mergedSystemText) {
        mergedSections.push(mergedSystemText);
    }

    mergedSections.push('【Moonshot兼容处理】以下内容原本以多条assistant上下文传入。请将它们视为背景设定、记忆包和写作约束，不要把它们当成你已经输出给用户的正式回复。');
    mergedSections.push(
        assistantMessages
            .map((message, index) => `【assistant上下文${index + 1}】\n${message.content.trim()}`)
            .join('\n\n')
    );

    const normalizedMessages = [
        { role: 'system', content: mergedSections.join('\n\n') },
        ...otherMessages
    ];

    console.log('[Moonshot] Merged assistant messages into system message:', {
        originalCount: messages.length,
        assistantCount: assistantMessages.length,
        normalizedCount: normalizedMessages.length
    });

    return normalizedMessages;
}

function updateStreamPreview(text, label = 'AI streaming...') {
    const loadingEl = document.getElementById('loading-message');
    if (!loadingEl) {
        return;
    }

    let contentEl = loadingEl.querySelector('.message-content');
    if (!contentEl) {
        contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        loadingEl.innerHTML = '';
        loadingEl.appendChild(contentEl);
    }

    contentEl.innerHTML = '';

    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'loading';
    contentEl.appendChild(loadingSpan);

    const previewSpan = document.createElement('span');
    previewSpan.style.whiteSpace = 'pre-wrap';
    previewSpan.style.wordBreak = 'break-word';
    previewSpan.style.display = 'inline';
    previewSpan.textContent = ` ${label}\n\n${text || ''}`;
    contentEl.appendChild(previewSpan);
}

async function readSSETextResponse(response, extractText, doneMarker = '[DONE]', onProgress = null) {
    if (!response.body) {
        throw new Error('Stream response body is not available.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';

        for (const eventText of events) {
            const lines = eventText
                .split(/\r?\n/)
                .filter(line => line.trim().startsWith('data:'))
                .map(line => line.replace(/^data:\s?/, '').trim())
                .filter(Boolean);

            for (const line of lines) {
                if (line === doneMarker) {
                    return fullText;
                }

                try {
                    fullText += extractText(JSON.parse(line));
                    if (onProgress) {
                        onProgress(fullText);
                    }
                } catch (error) {
                    console.warn('[stream] Failed to parse SSE chunk:', line, error);
                }
            }
        }
    }

    const tailLines = buffer
        .split(/\r?\n/)
        .filter(line => line.trim().startsWith('data:'))
        .map(line => line.replace(/^data:\s?/, '').trim())
        .filter(Boolean);

    for (const line of tailLines) {
        if (line === doneMarker) {
            break;
        }

        try {
            fullText += extractText(JSON.parse(line));
            if (onProgress) {
                onProgress(fullText);
            }
        } catch (error) {
            console.warn('[stream] Failed to parse SSE tail chunk:', line, error);
        }
    }

    return fullText;
}

async function requestOpenAICompatibleCompletion(config, messages, options = {}) {
    const fullEndpoint = getFullEndpoint(config.endpoint, config.type);
    const temperature = config.type === 'moonshot' ? 1 : (options.temperature ?? 0.8);
    const maxTokens = options.maxTokens ?? getConfiguredMaxTokens();
    const autoStreamThreshold = options.autoStreamThreshold ?? 4096;
    const shouldStream = !!config.stream || maxTokens > autoStreamThreshold;
    const normalizedMessages = config.type === 'moonshot'
        ? normalizeMessagesForMoonshot(messages)
        : messages;

    if (!config.stream && maxTokens > autoStreamThreshold) {
        console.warn('[requestOpenAICompatibleCompletion] Auto-enabled stream because max_tokens exceeds limit:', maxTokens);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
    };

    if (config.type === 'moonshot') {
        headers['User-Agent'] = 'KimiCLI/1.3';
        headers['Host'] = 'api.kimi.com';
    }

    const requestBody = {
        model: config.model,
        messages: normalizedMessages,
        temperature: temperature,
        max_tokens: maxTokens
    };

    if (shouldStream) {
        requestBody.stream = true;
    }

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`${options.errorPrefix || 'API error'}: ${response.status} - ${error}`);
    }

    if (shouldStream) {
        const streamedText = await readSSETextResponse(
            response,
            getStreamContentFromOpenAIEvent,
            '[DONE]',
            options.onProgress || null
        );
        return streamedText || (options.emptyMessage || 'API response format is invalid.');
    }

    const data = await response.json();
    if (options.logPrefix) {
        console.log(options.logPrefix, data);
    }

    const extractedText = extractTextFromOpenAICompatiblePayload(data, false);
    if (extractedText) {
        return extractedText;
    }

    console.warn(options.warnPrefix || '[requestOpenAICompatibleCompletion] Missing choices:', data);
    return `${options.emptyMessage || 'API response format is invalid.'}\n\nRaw response:\n${JSON.stringify(data).slice(0, 1200)}`;
}

async function requestGeminiCompletion(config, messages, options = {}) {
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));
    const baseEndpoint = config.endpoint.trim().replace(/\/+$/, '');
    const endpoint = config.stream
        ? `${baseEndpoint}/models/${config.model}:streamGenerateContent?alt=sse&key=${config.key}`
        : `${baseEndpoint}/models/${config.model}:generateContent?key=${config.key}`;
    const requestBody = {
        contents: contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: {
            temperature: options.temperature ?? 0.8,
            maxOutputTokens: options.maxTokens ?? 8192
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`${options.errorPrefix || 'Gemini API error'}: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`${options.errorPrefix || 'Gemini API error'}: ${response.status} - ${errorBody}`);
        }
    }

    if (config.stream) {
        const streamedText = await readSSETextResponse(
            response,
            getStreamContentFromGeminiEvent,
            '[DONE]',
            options.onProgress || null
        );
        return streamedText || (options.blockedMessage || 'Gemini returned no content.');
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        return options.blockedMessage || 'Gemini returned no candidates.';
    }

    return data.candidates[0].content.parts[0].text;
}

async function callExtraAPI(messages) {
    const endpoint = extraApiConfig.type === 'gemini'
        ? `${extraApiConfig.endpoint}/models/${extraApiConfig.model}:generateContent?key=${extraApiConfig.key}`
        : `${extraApiConfig.endpoint}/chat/completions`;

    let requestBody;
    let headers = { 'Content-Type': 'application/json' };

    if (extraApiConfig.type === 'gemini') {
        // Gemini格式
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

        requestBody = {
            contents: contents,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192
            }
        };
    } else {
        // OpenAI格式（包括 Claude API 和第三方 API）
        headers['Authorization'] = `Bearer ${extraApiConfig.key}`;

        // 🔧 获取用户配置的 max_tokens（优先）或使用默认值
        const savedConfig = localStorage.getItem('gameConfig');
        const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

        requestBody = {
            model: extraApiConfig.model,
            messages: messages,
            temperature: 0.9,
            max_tokens: userMaxTokens  // 使用用户配置的值
        };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 提取内容
    if (extraApiConfig.type === 'gemini') {
        if (!data.candidates || data.candidates.length === 0) {
            console.warn('[callExtraAPI] Gemini响应缺少candidates:', data);
            return "请求被模型阻止或响应格式异常，请重试。";
        }
        return data.candidates[0].content.parts[0].text;
    } else {
        if (!data.choices || data.choices.length === 0) {
            console.warn('[callExtraAPI] OpenAI响应缺少choices:', data);
            return "API响应格式异常，请重试。";
        }
        return data.choices[0].message.content;
    }
}

// 调用AI
async function callAI(userMessage, isTest = false, originalUserInput = null) {
    // 确保配置已加载
    if (!apiConfig.endpoint || !apiConfig.key || !apiConfig.model) {
        throw new Error('请先配置并保存API连接');
    }

    let messages = [];

    if (!isTest) {
        // 🔧 传入原始用户输入（用于向量检索）
        messages = await buildAIMessages(userMessage, originalUserInput);
    } else {
        messages = [
            { role: 'user', content: '你好' }
        ];
    }

    try {
        if (apiConfig.type === 'gemini') {
            return await callGemini(messages);
        } else {
            return await callOpenAI(messages);
        }
    } catch (error) {
        console.error('AI调用错误:', error);
        throw error;
    }
}

// 调用额外API（供其他用途使用）
async function callExtraAI(messages, systemPrompt = null) {
    // 确保额外API已启用并配置
    if (!extraApiConfig.enabled) {
        throw new Error('额外API未启用');
    }

    if (!extraApiConfig.endpoint || !extraApiConfig.key || !extraApiConfig.model) {
        throw new Error('请先配置并保存额外API连接');
    }

    // 如果提供了系统提示词，添加到消息开头
    if (systemPrompt) {
        messages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];
    }

    try {
        if (extraApiConfig.type === 'gemini') {
            return await callExtraGemini(messages);
        } else {
            return await callExtraOpenAI(messages);
        }
    } catch (error) {
        console.error('额外API调用错误:', error);
        throw error;
    }
}

// 使用额外API的OpenAI格式调用
async function callExtraOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(extraApiConfig.endpoint, extraApiConfig.type);

    // 🔧 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 根据API类型设置温度：moonshot使用1，其他使用0.8
    const temperature = extraApiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 构建请求头，moonshot需要特殊的User-Agent和Host
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extraApiConfig.key}`
    };
    if (extraApiConfig.type === 'moonshot') {
        headers['User-Agent'] = 'KimiCLI/1.3';
        headers['Host'] = 'api.kimi.com';
    }

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: extraApiConfig.model,
            messages: messages,
            temperature: temperature,
            max_tokens: userMaxTokens  // 使用用户配置的值
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`额外API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callExtraOpenAI] 响应缺少choices:', data);
        return "额外API响应格式异常，请重试。";
    }
    return data.choices[0].message.content;
}

// 使用额外API的Gemini格式调用
async function callExtraGemini(messages) {
    // 1. 分离系统提示和对话历史
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. 构建 Gemini 端点
    let baseEndpoint = extraApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + extraApiConfig.model + ':generateContent?key=' + extraApiConfig.key;

    // 4. 构建请求体
    const requestBody = {
        contents: contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`额外Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`额外Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(额外API)请求被模型阻止，可能触发了安全设置。";
    }

    return data.candidates[0].content.parts[0].text;
}

// OpenAI格式调用
async function callOpenAI(messages) {
    // 获取完整的聊天端点
    const fullEndpoint = getFullEndpoint(apiConfig.endpoint, apiConfig.type);

    // 🔧 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 根据API类型设置温度：moonshot使用1，其他使用0.8
    const temperature = apiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 构建请求头，moonshot需要特殊的User-Agent和Host
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.key}`
    };
    if (apiConfig.type === 'moonshot') {
        headers['User-Agent'] = 'KimiCLI/1.3';
        headers['Host'] = 'api.kimi.com';
    }

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: apiConfig.model,
            messages: messages,
            temperature: temperature,
            max_tokens: userMaxTokens  // 使用用户配置的值
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('API原始响应:', data);

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callOpenAI] 响应缺少choices:', data);
        return "API响应格式异常，请重试。";
    }
    return data.choices[0].message.content;
}

// Gemini格式调用
async function callGemini(messages) {
    // 1. 分离系统提示和对话历史
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. 构建 Gemini 端点
    let baseEndpoint = apiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + apiConfig.model + ':generateContent?key=' + apiConfig.key;

    // 4. 构建请求体
    const requestBody = {
        contents: contents,
        // 仅在有系统提示时才添加
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192 // 根据需要调整
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            // 尝试解析为JSON以获取更详细的错误信息
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            // 如果解析失败，则返回原始文本
            throw new Error(`Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    // 检查是否有候选内容返回
    if (!data.candidates || data.candidates.length === 0) {
        // 如果因为安全设置等原因被阻止，通常 candidates 数组为空
        return "请求被模型阻止，可能触发了安全设置。请尝试修改输入内容。";
    }

    return data.candidates[0].content.parts[0].text;
}

// ==================== 📱 手机API调用函数 ====================

/**
 * 调用手机API（第三个API）
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} - AI回复内容
 */
async function callMobileAPI(messages) {
    // 确保手机API已配置
    if (!window.mobileApiConfig || !window.mobileApiConfig.enabled) {
        throw new Error('手机API未启用');
    }

    if (!window.mobileApiConfig.endpoint || !window.mobileApiConfig.key || !window.mobileApiConfig.model) {
        throw new Error('请先配置并保存手机API连接');
    }

    try {
        if (window.mobileApiConfig.type === 'gemini') {
            return await callMobileGemini(messages);
        } else {
            return await callMobileOpenAI(messages);
        }
    } catch (error) {
        console.error('[手机API] 调用错误:', error);
        throw error;
    }
}

/**
 * 使用手机API的OpenAI格式调用
 */
async function callMobileOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(window.mobileApiConfig.endpoint, window.mobileApiConfig.type);

    // 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 根据API类型设置温度：moonshot使用1，其他使用0.8
    const temperature = window.mobileApiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 构建请求头，moonshot需要特殊的User-Agent和Host
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.mobileApiConfig.key}`
    };
    if (window.mobileApiConfig.type === 'moonshot') {
        headers['User-Agent'] = 'KimiCLI/1.3';
        headers['Host'] = 'api.kimi.com';
    }

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: window.mobileApiConfig.model,
            messages: messages,
            temperature: temperature,
            max_tokens: userMaxTokens
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`手机API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callMobileOpenAI] 响应缺少choices:', data);
        return "手机API响应格式异常，请重试。";
    }
    return data.choices[0].message.content;
}

/**
 * 使用手机API的Gemini格式调用
 */
async function callMobileGemini(messages) {
    // 分离系统提示和对话历史
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 构建 Gemini 端点
    let baseEndpoint = window.mobileApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + window.mobileApiConfig.model + ':generateContent?key=' + window.mobileApiConfig.key;

    // 构建请求体
    const requestBody = {
        contents: contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`手机Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`手机Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(手机API)请求被模型阻止，可能触发了安全设置。";
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * 为手机构建完整的AI消息上下文
 * 支持知识库、向量检索、人物图谱、History矩阵等功能
 * 🆕 支持酒馆预设模式（useTavernPresetMode）
 * @param {string} userMessage - 用户消息
 * @param {string} chatContext - 聊天对象上下文（如聊天对象名称）
 * @param {string} mobileSystemPrompt - 可选，手机模块专用系统提示词（用于酒馆预设模式）
 * @param {Object} options - 可选配置（enableNSFW等）
 * @returns {Promise<Array>} - 构建好的messages数组
 */
async function buildMobileAIMessages(userMessage, chatContext = '', mobileSystemPrompt = '', options = {}) {
    const settings = window.mobilePhoneSettings || {};
    const showDetails = settings.showBuildDetails !== false;

    // 🆕 检查是否启用酒馆预设模式（默认开启）
    // 注意：全局变量名是 contextVectorManager，不是 contextManager
    if (settings.useTavernPresetMode !== false && window.contextVectorManager && window.contextVectorManager.buildMobileOptimizedMessages) {
        if (showDetails) {
            console.log('[📱手机上下文构建] 🎭 使用酒馆预设模式');
        }
        try {
            return await window.contextVectorManager.buildMobileOptimizedMessages(userMessage, chatContext, mobileSystemPrompt, options);
        } catch (e) {
            console.error('[📱手机上下文构建] 酒馆预设模式构建失败，回退到传统模式:', e);
            // 失败时回退到传统模式
        }
    }

    // ==================== 传统模式 ====================
    if (showDetails) {
        console.log('[📱手机上下文构建] ==== 开始构建（传统模式） ====');
        console.log('[📱手机上下文构建] 用户消息:', userMessage);
        console.log('[📱手机上下文构建] 聊天上下文:', chatContext);
    }

    let contextParts = [];

    // 1. 知识库检索
    if (settings.useKnowledgeBase && window.contextVectorManager && window.contextVectorManager.staticKnowledgeBase) {
        try {
            const kbResults = await window.contextVectorManager.retrieveFromStaticKB(userMessage);
            if (kbResults && kbResults.length > 0) {
                const kbContent = kbResults.map(r => `【${r.title}】\n${r.content}`).join('\n\n');
                contextParts.push(`【知识库参考】\n${kbContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 知识库检索结果:', kbResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 知识库检索失败:', e);
        }
    }

    // 2. 向量检索历史
    if (settings.useVectorRetrieval && window.contextVectorManager) {
        try {
            const vectorResults = await window.contextVectorManager.retrieveRelevantHistory(userMessage);
            if (vectorResults && vectorResults.length > 0) {
                const vectorContent = vectorResults.map(r => r.summary || `用户:${r.userMessage}\nAI:${r.aiResponse?.substring(0, 200)}...`).join('\n---\n');
                contextParts.push(`【相关历史记忆】\n${vectorContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 向量检索结果:', vectorResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 向量检索失败:', e);
        }
    }

    // 3. 人物图谱检索
    if (settings.useCharacterGraph && window.characterGraphManager) {
        try {
            const charResults = await window.characterGraphManager.searchByText(userMessage + ' ' + chatContext);
            if (charResults && charResults.length > 0) {
                const charContent = charResults.map(c => {
                    let info = `【${c.name}】`;
                    if (c.relation) info += ` 关系:${c.relation}`;
                    if (c.personality) info += ` 性格:${c.personality}`;
                    if (c.appearance) info += ` 外貌:${c.appearance}`;
                    if (c.history && c.history.length > 0) {
                        info += `\n  历史互动: ${c.history.slice(-3).join('; ')}`;
                    }
                    return info;
                }).join('\n');
                contextParts.push(`【相关人物信息】\n${charContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 人物图谱检索结果:', charResults.length, '人');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 人物图谱检索失败:', e);
        }
    }

    // 4. History矩阵检索
    if (settings.useHistoryMatrix && window.matrixManager && window.matrixManager.historyMatrix) {
        try {
            const matrixResults = window.matrixManager.historyMatrix.searchByMatrix(userMessage, 10);
            if (matrixResults && matrixResults.length > 0) {
                const matrixContent = matrixResults.map(h => h.aiResponse || h.content || h.text || h).join('\n---\n');
                contextParts.push(`【历史事件矩阵】\n${matrixContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] History矩阵检索结果:', matrixResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] History矩阵检索失败:', e);
        }
    }

    // 5. 📖 读取主API最近正文层数
    const mainApiHistoryDepth = settings.mainApiHistoryDepth ?? 5;
    // 兼容两种历史记录字段名：gameHistory（主要）和 conversationHistory（备用）
    const mainHistory = window.gameState?.gameHistory || window.gameState?.conversationHistory;
    if (mainApiHistoryDepth > 0 && mainHistory && mainHistory.length > 0) {
        try {
            const history = mainHistory;
            // conversationHistory 格式: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}, ...]
            // 需要配对提取，每2条为1层
            const totalPairs = Math.floor(history.length / 2);
            const startPair = Math.max(0, totalPairs - mainApiHistoryDepth);

            if (totalPairs > 0) {
                let recentContent = '';
                let floorNum = startPair + 1;

                for (let i = startPair * 2; i < history.length - 1; i += 2) {
                    const userEntry = history[i];
                    const aiEntry = history[i + 1];

                    // 确保是 user-assistant 配对
                    if (userEntry?.role === 'user' && aiEntry?.role === 'assistant') {
                        const userMsg = userEntry.content || '';
                        const aiMsg = aiEntry.content || '';

                        // 发送完整内容，不截取
                        recentContent += `[第${floorNum}层]\n玩家: ${userMsg}\nAI: ${aiMsg}\n\n`;
                        floorNum++;
                    }
                }

                if (recentContent) {
                    const mainApiContext = `【主线剧情（最近${floorNum - startPair - 1}层）】\n${recentContent.trim()}`;
                    contextParts.push(mainApiContext);
                    if (showDetails) {
                        console.log('[📱手机上下文构建] 📖 读取主API正文:', floorNum - startPair - 1, '层');
                        console.log('[📱手机上下文构建] 📖 内容预览:', mainApiContext.substring(0, 200) + '...');
                    }
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 读取主API正文失败:', e);
        }
    }

    // 6. 🔍 向量检索远处正文（匹配主对话的相关内容）
    if (settings.useMainVectorSearch && window.contextVectorManager) {
        try {
            const vectorSearchCount = settings.vectorSearchCount || 3;
            const farResults = await window.contextVectorManager.retrieveRelevant(userMessage, vectorSearchCount, 'conversation');

            if (farResults && farResults.length > 0) {
                let farContent = '';
                farResults.forEach((item, index) => {
                    const userMsg = item.userMessage || '';
                    const aiMsg = item.aiResponse || '';

                    // 截取合理长度
                    const userPreview = userMsg.substring(0, 80) + (userMsg.length > 80 ? '...' : '');
                    const aiPreview = aiMsg.substring(0, 250) + (aiMsg.length > 250 ? '...' : '');

                    farContent += `[匹配${index + 1}] 相似度:${(item.similarity * 100).toFixed(1)}%\n玩家: ${userPreview}\nAI: ${aiPreview}\n\n`;
                });

                contextParts.push(`【相关远处剧情（向量匹配）】\n${farContent.trim()}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 🔍 向量检索远处正文:', farResults.length, '条');
                    farResults.forEach((item, i) => {
                        console.log(`   [${i + 1}] 相似度: ${(item.similarity * 100).toFixed(1)}%`);
                    });
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 向量检索远处正文失败:', e);
        }
    }

    // 7. 获取当前游戏状态摘要
    let gameStateSummary = '';
    if (window.gameState && window.gameState.variables) {
        const v = window.gameState.variables;
        gameStateSummary = `【当前状态】
角色: ${v.name || '未知'} | ${v.gender || ''} | ${v.age || ''}岁
身份: ${v.identity || '无'}
位置: ${v.location || '未知'}
时间: ${v.currentDateTime || '未知'}`;
        if (showDetails) {
            console.log('[📱手机上下文构建] 游戏状态已添加');
        }
    }

    // 构建最终上下文
    const fullContext = [gameStateSummary, ...contextParts].filter(Boolean).join('\n\n');

    if (showDetails) {
        console.log('[📱手机上下文构建] ==== 构建完成 ====');
        console.log('[📱手机上下文构建] 上下文总长度:', fullContext.length, '字符');
    }

    // 构建messages数组（不包含系统提示词，后续由调用方添加）
    const messages = [];

    // 添加上下文作为系统消息的一部分
    if (fullContext) {
        messages.push({
            role: 'system',
            content: `你是一个游戏中的虚拟手机助手。以下是相关的上下文信息：\n\n${fullContext}\n\n请根据这些信息回答用户的问题。`
        });
    }

    // 添加用户消息
    messages.push({
        role: 'user',
        content: userMessage
    });

    return messages;
}

// Stream-capable overrides. Declared at the end so they replace older implementations safely.
async function callExtraOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(extraApiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'Extra API error',
        logPrefix: '[Extra API] Raw response:',
        warnPrefix: '[callExtraOpenAI] Missing choices:',
        emptyMessage: 'Extra API response format is invalid.'
    });
}

async function callExtraGemini(messages) {
    return await requestGeminiCompletion(extraApiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Extra Gemini API error',
        blockedMessage: '(Extra API) request was blocked or returned no content.'
    });
}

async function callOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(apiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'API error',
        logPrefix: 'API raw response:',
        warnPrefix: '[callOpenAI] Missing choices:',
        emptyMessage: 'API response format is invalid.',
        onProgress: (text) => updateStreamPreview(text, 'AI生成中...')
    });
}

async function callGemini(messages) {
    return await requestGeminiCompletion(apiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Gemini API error',
        blockedMessage: 'Gemini request was blocked or returned no content.',
        onProgress: (text) => updateStreamPreview(text, 'AI生成中...')
    });
}

async function callMobileOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(window.mobileApiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'Mobile API error',
        logPrefix: '[Mobile API] Raw response:',
        warnPrefix: '[callMobileOpenAI] Missing choices:',
        emptyMessage: 'Mobile API response format is invalid.'
    });
}

async function callMobileGemini(messages) {
    return await requestGeminiCompletion(window.mobileApiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Mobile Gemini API error',
        blockedMessage: '(Mobile API) request was blocked or returned no content.'
    });
}
