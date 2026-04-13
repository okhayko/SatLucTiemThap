/**
 * Module hàm gọi API
 * Bao gồm: Gọi AI, gọi API phụ, gọi theo định dạng OpenAI, gọi theo định dạng Gemini, v.v.
 * Các module chức năng gọi API được trích xuất từ game.html
 */

// ==================== Các hàm gọi API ====================

// Lấy số lượng token tối đa đã cấu hình
function getConfiguredMaxTokens() {
    const savedConfig = localStorage.getItem('gameConfig');
    return savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;
}

// Lấy nội dung stream từ sự kiện OpenAI
function getStreamContentFromOpenAIEvent(payload) {
    return extractTextFromOpenAICompatiblePayload(payload, true);
}

// Lấy nội dung stream từ sự kiện Gemini
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

// Trích xuất văn bản từ các thành phần (parts)
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

// Trích xuất văn bản từ Payload tương thích OpenAI
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

// Chuẩn hóa tin nhắn cho Moonshot (Kimi)
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

    mergedSections.push('【Xử lý tương thích Moonshot】Nội dung dưới đây vốn được truyền vào dưới dạng nhiều ngữ cảnh assistant. Vui lòng xem chúng như thiết lập bối cảnh, gói ký ức và ràng buộc viết lách, đừng coi chúng là câu trả lời chính thức mà bạn đã xuất cho người dùng.');
    mergedSections.push(
        assistantMessages
            .map((message, index) => `【Ngữ cảnh assistant ${index + 1}】\n${message.content.trim()}`)
            .join('\n\n')
    );

    const normalizedMessages = [
        { role: 'system', content: mergedSections.join('\n\n') },
        ...otherMessages
    ];

    console.log('[Moonshot] Đã hợp nhất tin nhắn assistant vào tin nhắn hệ thống:', {
        originalCount: messages.length,
        assistantCount: assistantMessages.length,
        normalizedCount: normalizedMessages.length
    });

    return normalizedMessages;
}

// Cập nhật bản xem trước stream
function updateStreamPreview(text, label = 'AI đang phản hồi...') {
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

// Đọc phản hồi văn bản SSE (Server-Sent Events)
async function readSSETextResponse(response, extractText, doneMarker = '[DONE]', onProgress = null) {
    if (!response.body) {
        throw new Error('Không có thân phản hồi Stream (Stream response body).');
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
                    console.warn('[stream] Phân tích SSE chunk thất bại:', line, error);
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
            console.warn('[stream] Phân tích SSE tail chunk thất bại:', line, error);
        }
    }

    return fullText;
}

// Yêu cầu hoàn thiện tin nhắn tương thích OpenAI
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
        console.warn('[requestOpenAICompatibleCompletion] Tự động bật stream vì max_tokens vượt giới hạn:', maxTokens);
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
        throw new Error(`${options.errorPrefix || 'Lỗi API'}: ${response.status} - ${error}`);
    }

    if (shouldStream) {
        const streamedText = await readSSETextResponse(
            response,
            getStreamContentFromOpenAIEvent,
            '[DONE]',
            options.onProgress || null
        );
        return streamedText || (options.emptyMessage || 'Định dạng phản hồi API không hợp lệ.');
    }

    const data = await response.json();
    if (options.logPrefix) {
        console.log(options.logPrefix, data);
    }

    const extractedText = extractTextFromOpenAICompatiblePayload(data, false);
    if (extractedText) {
        return extractedText;
    }

    console.warn(options.warnPrefix || '[requestOpenAICompatibleCompletion] Thiếu lựa chọn (choices):', data);
    return `${options.emptyMessage || 'Định dạng phản hồi API không hợp lệ.'}\n\nPhản hồi thô:\n${JSON.stringify(data).slice(0, 1200)}`;
}

// Yêu cầu hoàn thiện tin nhắn Gemini
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
            throw new Error(`${options.errorPrefix || 'Lỗi Gemini API'}: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`${options.errorPrefix || 'Lỗi Gemini API'}: ${response.status} - ${errorBody}`);
        }
    }

    if (config.stream) {
        const streamedText = await readSSETextResponse(
            response,
            getStreamContentFromGeminiEvent,
            '[DONE]',
            options.onProgress || null
        );
        return streamedText || (options.blockedMessage || 'Gemini không trả về nội dung.');
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        return options.blockedMessage || 'Gemini không trả về kết quả (candidates).';
    }

    return data.candidates[0].content.parts[0].text;
}

// Gọi API phụ
async function callExtraAPI(messages) {
    const endpoint = extraApiConfig.type === 'gemini'
        ? `${extraApiConfig.endpoint}/models/${extraApiConfig.model}:generateContent?key=${extraApiConfig.key}`
        : `${extraApiConfig.endpoint}/chat/completions`;

    let requestBody;
    let headers = { 'Content-Type': 'application/json' };

    if (extraApiConfig.type === 'gemini') {
        // Định dạng Gemini
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
        // Định dạng OpenAI (bao gồm Claude API và API bên thứ ba)
        headers['Authorization'] = `Bearer ${extraApiConfig.key}`;

        // 🔧 Lấy max_tokens do người dùng cấu hình (ưu tiên) hoặc dùng giá trị mặc định
        const savedConfig = localStorage.getItem('gameConfig');
        const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

        requestBody = {
            model: extraApiConfig.model,
            messages: messages,
            temperature: 0.9,
            max_tokens: userMaxTokens  // Sử dụng giá trị người dùng cấu hình
        };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Yêu cầu API thất bại: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Trích xuất nội dung
    if (extraApiConfig.type === 'gemini') {
        if (!data.candidates || data.candidates.length === 0) {
            console.warn('[callExtraAPI] Phản hồi Gemini thiếu candidates:', data);
            return "Yêu cầu bị mô hình chặn hoặc định dạng phản hồi bất thường, vui lòng thử lại.";
        }
        return data.candidates[0].content.parts[0].text;
    } else {
        if (!data.choices || data.choices.length === 0) {
            console.warn('[callExtraAPI] Phản hồi OpenAI thiếu choices:', data);
            return "Định dạng phản hồi API bất thường, vui lòng thử lại.";
        }
        return data.choices[0].message.content;
    }
}

// Gọi AI
async function callAI(userMessage, isTest = false, originalUserInput = null) {
    // Đảm bảo cấu hình đã được tải
    if (!apiConfig.endpoint || !apiConfig.key || !apiConfig.model) {
        throw new Error('Vui lòng cấu hình và lưu kết nối API trước');
    }

    let messages = [];

    if (!isTest) {
        // 🔧 Truyền vào nội dung người dùng nhập gốc (dùng cho truy xuất vector)
        messages = await buildAIMessages(userMessage, originalUserInput);
    } else {
        messages = [
            { role: 'user', content: 'Chào bạn' }
        ];
    }

    try {
        if (apiConfig.type === 'gemini') {
            return await callGemini(messages);
        } else {
            return await callOpenAI(messages);
        }
    } catch (error) {
        console.error('Lỗi gọi AI:', error);
        throw error;
    }
}

// Gọi API phụ (dùng cho các mục đích khác)
async function callExtraAI(messages, systemPrompt = null) {
    // Đảm bảo API phụ đã được bật và cấu hình
    if (!extraApiConfig.enabled) {
        throw new Error('API phụ chưa được bật');
    }

    if (!extraApiConfig.endpoint || !extraApiConfig.key || !extraApiConfig.model) {
        throw new Error('Vui lòng cấu hình và lưu kết nối API phụ trước');
    }

    // Nếu có cung cấp gợi ý hệ thống (system prompt), thêm vào đầu tin nhắn
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
        console.error('Lỗi gọi API phụ:', error);
        throw error;
    }
}

// Gọi theo định dạng OpenAI bằng API phụ
async function callExtraOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(extraApiConfig.endpoint, extraApiConfig.type);

    // 🔧 Lấy max_tokens do người dùng cấu hình
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 Thiết lập nhiệt độ (temperature) theo loại API: moonshot dùng 1, loại khác dùng 0.8
    const temperature = extraApiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 Xây dựng Header, moonshot cần User-Agent và Host đặc biệt
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
            max_tokens: userMaxTokens  // Sử dụng giá trị người dùng cấu hình
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Lỗi API phụ: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callExtraOpenAI] Phản hồi thiếu choices:', data);
        return "Định dạng phản hồi API phụ bất thường, vui lòng thử lại.";
    }
    return data.choices[0].message.content;
}

// Gọi theo định dạng Gemini bằng API phụ
async function callExtraGemini(messages) {
    // 1. Tách gợi ý hệ thống và lịch sử hội thoại
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. Chuyển đổi lịch sử hội thoại sang định dạng Gemini
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. Xây dựng Endpoint Gemini
    let baseEndpoint = extraApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + extraApiConfig.model + ':generateContent?key=' + extraApiConfig.key;

    // 4. Xây dựng thân yêu cầu (request body)
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
            throw new Error(`Lỗi Gemini API phụ: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`Lỗi Gemini API phụ: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(API phụ) Yêu cầu bị mô hình chặn, có thể đã kích hoạt thiết lập an toàn.";
    }

    return data.candidates[0].content.parts[0].text;
}

// Gọi định dạng OpenAI
async function callOpenAI(messages) {
    // Lấy endpoint chat đầy đủ
    const fullEndpoint = getFullEndpoint(apiConfig.endpoint, apiConfig.type);

    // 🔧 Lấy max_tokens cấu hình bởi người dùng
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 Thiết lập nhiệt độ theo loại API: moonshot dùng 1, loại khác dùng 0.8
    const temperature = apiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 Xây dựng Header, moonshot cần User-Agent và Host đặc biệt
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
            max_tokens: userMaxTokens  // Sử dụng giá trị người dùng cấu hình
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Lỗi API: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('Phản hồi thô API:', data);

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callOpenAI] Phản hồi thiếu choices:', data);
        return "Định dạng phản hồi API bất thường, vui lòng thử lại.";
    }
    return data.choices[0].message.content;
}

// Gọi định dạng Gemini
async function callGemini(messages) {
    // 1. Tách gợi ý hệ thống và lịch sử hội thoại
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. Chuyển đổi lịch sử sang định dạng Gemini
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. Xây dựng Endpoint Gemini
    let baseEndpoint = apiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + apiConfig.model + ':generateContent?key=' + apiConfig.key;

    // 4. Xây dựng thân yêu cầu
    const requestBody = {
        contents: contents,
        // Chỉ thêm khi có gợi ý hệ thống
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192 // Điều chỉnh theo nhu cầu
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
            // Thử phân tích JSON để lấy thông tin lỗi chi tiết hơn
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`Lỗi Gemini API: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            // Nếu phân tích thất bại, trả về văn bản gốc
            throw new Error(`Lỗi Gemini API: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    // Kiểm tra xem có nội dung ứng viên nào được trả về không
    if (!data.candidates || data.candidates.length === 0) {
        // Nếu bị chặn do thiết lập an toàn, thường mảng candidates sẽ trống
        return "Yêu cầu bị mô hình chặn, có thể đã kích hoạt thiết lập an toàn. Vui lòng thử sửa lại nội dung nhập.";
    }

    return data.candidates[0].content.parts[0].text;
}

// ==================== 📱 Hàm gọi API Điện thoại ====================

/**
 * Gọi API Điện thoại (API thứ ba)
 * @param {Array} messages - Mảng tin nhắn
 * @returns {Promise<string>} - Nội dung AI phản hồi
 */
async function callMobileAPI(messages) {
    // Đảm bảo API điện thoại đã được cấu hình
    if (!window.mobileApiConfig || !window.mobileApiConfig.enabled) {
        throw new Error('API điện thoại chưa được bật');
    }

    if (!window.mobileApiConfig.endpoint || !window.mobileApiConfig.key || !window.mobileApiConfig.model) {
        throw new Error('Vui lòng cấu hình và lưu kết nối API điện thoại trước');
    }

    try {
        if (window.mobileApiConfig.type === 'gemini') {
            return await callMobileGemini(messages);
        } else {
            return await callMobileOpenAI(messages);
        }
    } catch (error) {
        console.error('[API Điện thoại] Lỗi gọi API:', error);
        throw error;
    }
}

/**
 * Gọi theo định dạng OpenAI bằng API điện thoại
 */
async function callMobileOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(window.mobileApiConfig.endpoint, window.mobileApiConfig.type);

    // Lấy max_tokens do người dùng cấu hình
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 8192) : 8192;

    // 🌙 Thiết lập nhiệt độ theo loại API: moonshot dùng 1, loại khác dùng 0.8
    const temperature = window.mobileApiConfig.type === 'moonshot' ? 1 : 0.8;

    // 🌙 Xây dựng Header, moonshot cần User-Agent và Host đặc biệt
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
        throw new Error(`Lỗi API điện thoại: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        console.warn('[callMobileOpenAI] Phản hồi thiếu choices:', data);
        return "Định dạng phản hồi API điện thoại bất thường, vui lòng thử lại.";
    }
    return data.choices[0].message.content;
}

/**
 * Gọi theo định dạng Gemini bằng API điện thoại
 */
async function callMobileGemini(messages) {
    // Tách gợi ý hệ thống và lịch sử hội thoại
    const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const historyMessages = messages.filter(m => m.role !== 'system');

    // Chuyển đổi lịch sử sang định dạng Gemini
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // Xây dựng Endpoint Gemini
    let baseEndpoint = window.mobileApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + window.mobileApiConfig.model + ':generateContent?key=' + window.mobileApiConfig.key;

    // Xây dựng thân yêu cầu
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
            throw new Error(`Lỗi Gemini API điện thoại: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`Lỗi Gemini API điện thoại: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(API điện thoại) Yêu cầu bị mô hình chặn, có thể đã kích hoạt thiết lập an toàn.";
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Xây dựng ngữ cảnh tin nhắn AI đầy đủ cho điện thoại
 * Hỗ trợ kho kiến thức, truy xuất vector, sơ đồ nhân vật, ma trận lịch sử, v.v.
 * 🆕 Hỗ trợ chế độ Tavern Preset (useTavernPresetMode)
 * @param {string} userMessage - Tin nhắn người dùng
 * @param {string} chatContext - Ngữ cảnh đối tượng chat (như tên người đang chat)
 * @param {string} mobileSystemPrompt - Tùy chọn, gợi ý hệ thống riêng cho module điện thoại (dùng cho Tavern Preset)
 * @param {Object} options - Cấu hình tùy chọn (enableNSFW, v.v.)
 * @returns {Promise<Array>} - Mảng messages đã xây dựng xong
 */
async function buildMobileAIMessages(userMessage, chatContext = '', mobileSystemPrompt = '', options = {}) {
    const settings = window.mobilePhoneSettings || {};
    const showDetails = settings.showBuildDetails !== false;

    // 🆕 Kiểm tra xem có bật chế độ Tavern Preset không (mặc định bật)
    // Lưu ý: Tên biến toàn cục là contextVectorManager, không phải contextManager
    if (settings.useTavernPresetMode !== false && window.contextVectorManager && window.contextVectorManager.buildMobileOptimizedMessages) {
        if (showDetails) {
            console.log('[📱Xây dựng ngữ cảnh điện thoại] 🎭 Sử dụng chế độ Tavern Preset');
        }
        try {
            return await window.contextVectorManager.buildMobileOptimizedMessages(userMessage, chatContext, mobileSystemPrompt, options);
        } catch (e) {
            console.error('[📱Xây dựng ngữ cảnh điện thoại] Xây dựng chế độ Tavern Preset thất bại, quay lại chế độ truyền thống:', e);
            // Quay lại chế độ truyền thống khi thất bại
        }
    }

    // ==================== Chế độ truyền thống ====================
    if (showDetails) {
        console.log('[📱Xây dựng ngữ cảnh điện thoại] ==== Bắt đầu xây dựng (Chế độ truyền thống) ====');
        console.log('[📱Xây dựng ngữ cảnh điện thoại] Tin nhắn người dùng:', userMessage);
        console.log('[📱Xây dựng ngữ cảnh điện thoại] Ngữ cảnh chat:', chatContext);
    }

    let contextParts = [];

    // 1. Truy xuất kho kiến thức (Knowledge Base)
    if (settings.useKnowledgeBase && window.contextVectorManager && window.contextVectorManager.staticKnowledgeBase) {
        try {
            const kbResults = await window.contextVectorManager.retrieveFromStaticKB(userMessage);
            if (kbResults && kbResults.length > 0) {
                const kbContent = kbResults.map(r => `【${r.title}】\n${r.content}`).join('\n\n');
                contextParts.push(`【Tham khảo kho kiến thức】\n${kbContent}`);
                if (showDetails) {
                    console.log('[📱Xây dựng ngữ cảnh điện thoại] Kết quả truy xuất kho kiến thức:', kbResults.length, 'mục');
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Truy xuất kho kiến thức thất bại:', e);
        }
    }

    // 2. Truy xuất lịch sử theo Vector
    if (settings.useVectorRetrieval && window.contextVectorManager) {
        try {
            const vectorResults = await window.contextVectorManager.retrieveRelevantHistory(userMessage);
            if (vectorResults && vectorResults.length > 0) {
                const vectorContent = vectorResults.map(r => r.summary || `Người dùng:${r.userMessage}\nAI:${r.aiResponse?.substring(0, 200)}...`).join('\n---\n');
                contextParts.push(`【Ký ức lịch sử liên quan】\n${vectorContent}`);
                if (showDetails) {
                    console.log('[📱Xây dựng ngữ cảnh điện thoại] Kết quả truy xuất Vector:', vectorResults.length, 'mục');
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Truy xuất Vector thất bại:', e);
        }
    }

    // 3. Truy xuất sơ đồ nhân vật
    if (settings.useCharacterGraph && window.characterGraphManager) {
        try {
            const charResults = await window.characterGraphManager.searchByText(userMessage + ' ' + chatContext);
            if (charResults && charResults.length > 0) {
                const charContent = charResults.map(c => {
                    let info = `【${c.name}】`;
                    if (c.relation) info += ` Quan hệ:${c.relation}`;
                    if (c.personality) info += ` Tính cách:${c.personality}`;
                    if (c.appearance) info += ` Ngoại hình:${c.appearance}`;
                    if (c.history && c.history.length > 0) {
                        info += `\n  Tương tác lịch sử: ${c.history.slice(-3).join('; ')}`;
                    }
                    return info;
                }).join('\n');
                contextParts.push(`【Thông tin nhân vật liên quan】\n${charContent}`);
                if (showDetails) {
                    console.log('[📱Xây dựng ngữ cảnh điện thoại] Kết quả truy xuất sơ đồ nhân vật:', charResults.length, 'người');
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Truy xuất sơ đồ nhân vật thất bại:', e);
        }
    }

    // 4. Truy xuất ma trận lịch sử (History Matrix)
    if (settings.useHistoryMatrix && window.matrixManager && window.matrixManager.historyMatrix) {
        try {
            const matrixResults = window.matrixManager.historyMatrix.searchByMatrix(userMessage, 10);
            if (matrixResults && matrixResults.length > 0) {
                const matrixContent = matrixResults.map(h => h.aiResponse || h.content || h.text || h).join('\n---\n');
                contextParts.push(`【Ma trận sự kiện lịch sử】\n${matrixContent}`);
                if (showDetails) {
                    console.log('[📱Xây dựng ngữ cảnh điện thoại] Kết quả truy xuất ma trận History:', matrixResults.length, 'mục');
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Truy xuất ma trận History thất bại:', e);
        }
    }

    // 5. 📖 Đọc số tầng nội dung chính gần đây từ API chính
    const mainApiHistoryDepth = settings.mainApiHistoryDepth ?? 5;
    // Tương thích cả hai tên trường lịch sử: gameHistory (chính) và conversationHistory (dự phòng)
    const mainHistory = window.gameState?.gameHistory || window.gameState?.conversationHistory;
    if (mainApiHistoryDepth > 0 && mainHistory && mainHistory.length > 0) {
        try {
            const history = mainHistory;
            // Định dạng conversationHistory: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}, ...]
            // Cần trích xuất theo cặp, cứ 2 mục là 1 tầng
            const totalPairs = Math.floor(history.length / 2);
            const startPair = Math.max(0, totalPairs - mainApiHistoryDepth);

            if (totalPairs > 0) {
                let recentContent = '';
                let floorNum = startPair + 1;

                for (let i = startPair * 2; i < history.length - 1; i += 2) {
                    const userEntry = history[i];
                    const aiEntry = history[i + 1];

                    // Đảm bảo là cặp user-assistant
                    if (userEntry?.role === 'user' && aiEntry?.role === 'assistant') {
                        const userMsg = userEntry.content || '';
                        const aiMsg = aiEntry.content || '';

                        // Gửi nội dung đầy đủ, không cắt xén
                        recentContent += `[Tầng ${floorNum}]\nNgười chơi: ${userMsg}\nAI: ${aiMsg}\n\n`;
                        floorNum++;
                    }
                }

                if (recentContent) {
                    const mainApiContext = `【Cốt truyện chính (Gần đây ${floorNum - startPair - 1} tầng)】\n${recentContent.trim()}`;
                    contextParts.push(mainApiContext);
                    if (showDetails) {
                        console.log('[📱Xây dựng ngữ cảnh điện thoại] 📖 Đọc nội dung chính API:', floorNum - startPair - 1, 'tầng');
                        console.log('[📱Xây dựng ngữ cảnh điện thoại] 📖 Xem trước nội dung:', mainApiContext.substring(0, 200) + '...');
                    }
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Đọc nội dung chính API thất bại:', e);
        }
    }

    // 6. 🔍 Truy xuất Vector nội dung chính ở xa (Khớp nội dung liên quan của hội thoại chính)
    if (settings.useMainVectorSearch && window.contextVectorManager) {
        try {
            const vectorSearchCount = settings.vectorSearchCount || 3;
            const farResults = await window.contextVectorManager.retrieveRelevant(userMessage, vectorSearchCount, 'conversation');

            if (farResults && farResults.length > 0) {
                let farContent = '';
                farResults.forEach((item, index) => {
                    const userMsg = item.userMessage || '';
                    const aiMsg = item.aiResponse || '';

                    // Cắt độ dài hợp lý
                    const userPreview = userMsg.substring(0, 80) + (userMsg.length > 80 ? '...' : '');
                    const aiPreview = aiMsg.substring(0, 250) + (aiMsg.length > 250 ? '...' : '');

                    farContent += `[Khớp ${index + 1}] Độ tương đồng:${(item.similarity * 100).toFixed(1)}%\nNgười chơi: ${userPreview}\nAI: ${aiPreview}\n\n`;
                });

                contextParts.push(`【Cốt truyện ở xa liên quan (Khớp Vector)】\n${farContent.trim()}`);
                if (showDetails) {
                    console.log('[📱Xây dựng ngữ cảnh điện thoại] 🔍 Truy xuất Vector nội dung chính ở xa:', farResults.length, 'mục');
                    farResults.forEach((item, i) => {
                        console.log(`   [${i + 1}] Độ tương đồng: ${(item.similarity * 100).toFixed(1)}%`);
                    });
                }
            }
        } catch (e) {
            console.warn('[📱Xây dựng ngữ cảnh điện thoại] Truy xuất Vector nội dung ở xa thất bại:', e);
        }
    }

    // 7. Lấy tóm tắt trạng thái trò chơi hiện tại
    let gameStateSummary = '';
    if (window.gameState && window.gameState.variables) {
        const v = window.gameState.variables;
        gameStateSummary = `【Trạng thái hiện tại】
Nhân vật: ${v.name || 'Không rõ'} | ${v.gender || ''} | ${v.age || ''} tuổi
Thân phận: ${v.identity || 'Không'}
Vị trí: ${v.location || 'Không rõ'}
Thời gian: ${v.currentDateTime || 'Không rõ'}`;
        if (showDetails) {
            console.log('[📱Xây dựng ngữ cảnh điện thoại] Đã thêm trạng thái trò chơi');
        }
    }

    // Xây dựng ngữ cảnh cuối cùng
    const fullContext = [gameStateSummary, ...contextParts].filter(Boolean).join('\n\n');

    if (showDetails) {
        console.log('[📱Xây dựng ngữ cảnh điện thoại] ==== Xây dựng hoàn tất ====');
        console.log('[📱Xây dựng ngữ cảnh điện thoại] Tổng độ dài ngữ cảnh:', fullContext.length, 'ký tự');
    }

    // Xây dựng mảng messages (không bao gồm gợi ý hệ thống, sẽ được gọi bởi phía gọi hàm sau)
    const messages = [];

    // Thêm ngữ cảnh vào như một phần của tin nhắn hệ thống
    if (fullContext) {
        messages.push({
            role: 'system',
            content: `Bạn là một trợ lý điện thoại ảo trong trò chơi. Dưới đây là các thông tin ngữ cảnh liên quan:\n\n${fullContext}\n\nVui lòng dựa trên các thông tin này để trả lời câu hỏi của người dùng.`
        });
    }

    // Thêm tin nhắn người dùng
    messages.push({
        role: 'user',
        content: userMessage
    });

    return messages;
}

// Các ghi đè (overrides) hỗ trợ Stream. Được khai báo ở cuối để thay thế các triển khai cũ một cách an toàn.
async function callExtraOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(extraApiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'Lỗi API phụ',
        logPrefix: '[API phụ] Phản hồi thô:',
        warnPrefix: '[callExtraOpenAI] Thiếu lựa chọn (choices):',
        emptyMessage: 'Định dạng phản hồi API phụ không hợp lệ.'
    });
}

async function callExtraGemini(messages) {
    return await requestGeminiCompletion(extraApiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Lỗi Gemini API phụ',
        blockedMessage: '(API phụ) yêu cầu bị chặn hoặc không trả về nội dung.'
    });
}

async function callOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(apiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'Lỗi API',
        logPrefix: 'Phản hồi thô API:',
        warnPrefix: '[callOpenAI] Thiếu lựa chọn (choices):',
        emptyMessage: 'Định dạng phản hồi API không hợp lệ.',
        onProgress: (text) => updateStreamPreview(text, 'AI đang tạo...')
    });
}

async function callGemini(messages) {
    return await requestGeminiCompletion(apiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Lỗi Gemini API',
        blockedMessage: 'Yêu cầu Gemini bị chặn hoặc không trả về nội dung.',
        onProgress: (text) => updateStreamPreview(text, 'AI đang tạo...')
    });
}

async function callMobileOpenAI(messages) {
    return await requestOpenAICompatibleCompletion(window.mobileApiConfig, messages, {
        maxTokens: getConfiguredMaxTokens(),
        temperature: 0.8,
        errorPrefix: 'Lỗi API điện thoại',
        logPrefix: '[API điện thoại] Phản hồi thô:',
        warnPrefix: '[callMobileOpenAI] Thiếu lựa chọn (choices):',
        emptyMessage: 'Định dạng phản hồi API điện thoại không hợp lệ.'
    });
}

async function callMobileGemini(messages) {
    return await requestGeminiCompletion(window.mobileApiConfig, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Lỗi Gemini API điện thoại',
        blockedMessage: '(API điện thoại) yêu cầu bị chặn hoặc không trả về nội dung.'
    });
}
