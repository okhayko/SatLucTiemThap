/**
 * Bộ trích xuất GraphRAG - Sử dụng Flash API để trích xuất thông tin ngữ nghĩa
 * Được gọi đồng thời với bộ điều phối bộ nhớ (memory dispatcher)
 */

/**
 * Lấy câu lệnh gợi ý (prompt) cho GraphRAG
 */
function getGraphRAGPrompt() {
    return `Bạn là 【Chuyên gia phân tích mạng lưới ngữ nghĩa】, chịu trách nhiệm nhận diện và trích xuất thực thể, quan hệ cùng các chiều hướng ngữ nghĩa từ cốt truyện một cách năng động.

【Nhiệm vụ cốt lõi】
Nhận diện từ nội dung cốt truyện hiện tại:
1. **Thực thể (Entity)**: Nhân vật, địa điểm, vật phẩm, sự kiện, thế lực, khái niệm, v.v.
2. **Quan hệ (Relation)**: Mối liên kết giữa các thực thể.
3. **Chiều hướng (Dimension)**: Các đặc điểm ngữ nghĩa chung mà thực thể chia sẻ (do bạn tự chủ phân tích và tạo ra).

【Chiều hướng là gì?】
Chiều hướng là các **nhãn ngữ nghĩa trừu tượng** mà bạn rút ra từ thực thể để phát hiện các liên kết ngầm.
- Liên quan địa lý: như "Thượng Hải", "Giang Nam", "Biển sâu".
- Liên quan thế lực: như "Chính đạo", "Ma giáo", "Tín ngưỡng R'lyeh".
- Liên quan khái niệm: như "Cấm kỵ", "Truyền thừa", "Ấm áp".
- Liên quan cảm xúc: như "Chấp niệm", "Ràng buộc", "Sợ hãi".

【Tác dụng của chiều hướng】
Nếu "Trương Tam" và "Bánh bao áp chảo" đều có chiều hướng "Thượng Hải":
- Khi nhắc đến Trương Tam, hệ thống sẽ liên tưởng đến các sự vật khác ở Thượng Hải.
- Khi nhắc đến Bánh bao áp chảo, hệ thống sẽ liên tưởng đến các nhân vật đến từ Thượng Hải.

【Định dạng đầu ra (JSON)】
{
  "semanticUpsert": {
    "analysisReason": "Mô tả ngắn gọn lý do trích xuất các thực thể và chiều hướng này (1 câu)",
    "newEntities": [
      {
        "name": "Tên thực thể",
        "type": "person|place|item|event|faction|concept",
        "dimensions": ["Chiều hướng 1", "Chiều hướng 2"],
        "attributes": { "key": "value" },
        "description": "Mô tả ngắn gọn (tùy chọn)"
      }
    ],
    "newRelations": [
      {
        "subject": "Tên thực thể chủ ngữ",
        "predicate": "Loại quan hệ",
        "object": "Tên thực thể tân ngữ",
        "certainty": 0.0-1.0,
        "context": "Giải thích ngữ cảnh của quan hệ (tùy chọn)"
      }
    ],
    "dimensionLinks": [
      {
        "dimension": "Tên chiều hướng",
        "entities": ["Tên các thực thể chia sẻ chiều hướng này"],
        "semanticMeaning": "Ý nghĩa mà chiều hướng này đại diện"
      }
    ]
  }
}

【Loại thực thể】
- person: Nhân vật
- place: Địa điểm
- item: Vật phẩm
- event: Sự kiện
- faction: Thế lực
- concept: Khái niệm trừu tượng

【Tham khảo loại quan hệ (không giới hạn ở đây)】
- Thuộc về: hometown (quê quán), origin (nguồn gốc), belongs_to (thuộc về), member_of (thành viên của)
- Xã hội: friend (bạn bè), enemy (kẻ thù), master (sư phụ), disciple (đệ tử)
- Cảm xúc: loves (yêu), fears (sợ), hates (ghét), respects (tôn trọng)
- Chức năng: owns (sở hữu), uses (sử dụng), creates (tạo ra)
- Không gian: located_in (nằm ở), near (gần)
- Nhân quả: caused_by (gây ra bởi), leads_to (dẫn đến), related_to (liên quan đến)

【Certainty - Độ tin cậy】
- 1.0: Tuyên bố rõ ràng
- 0.7-0.9: Ám chỉ mạnh mẽ
- 0.5-0.7: Suy đoán hợp lý

【Lưu ý đặc biệt】
1. Chỉ trích xuất các thực thể và quan hệ **mới xuất hiện hoặc có thông tin mới**.
2. Chiều hướng là then chốt: Thiết kế các chiều hướng có ý nghĩa, đây là cốt lõi của sự trỗi dậy ngữ nghĩa.
3. Nếu không có thông tin mới đáng trích xuất, trả về mảng rỗng.
4. Đối với các sự kiện tương tác của nhân vật chính (người chơi), nhất định phải trích xuất nhân vật đối phương và địa điểm liên quan.`;
}

/**
 * Xây dựng ngữ cảnh để trích xuất ngữ nghĩa
 */
function buildExtractionContext(userInput, lastAIReply, existingEntities = []) {
    let context = `【Nhập liệu hiện tại của người dùng】
"${userInput}"

【Diễn biến cốt truyện gần đây】
${lastAIReply || '（Cuộc hội thoại đầu tiên, chưa có lịch sử）'}`;

    // Thêm danh sách thực thể đã có (để tránh lặp lại)
    if (existingEntities.length > 0) {
        context += `\n\n【Thực thể đã có (tránh lặp lại)】\n${existingEntities.slice(0, 30).join('、')}`;
    }

    context += `\n\nVui lòng trích xuất các thực thể, quan hệ và chiều hướng mới xuất hiện từ nội dung trên. Nếu không có thông tin mới đáng trích xuất, trả về đối tượng semanticUpsert rỗng.`;

    return context;
}

/**
 * Hàm trích xuất GraphRAG độc lập (được gọi đồng thời với bộ điều phối bộ nhớ)
 */
async function extractGraphRAG(userInput, gameContext) {
    // Kiểm tra xem đã bật chưa
    if (!window.graphRAGLite?.config?.enabled) {
        console.log('[GraphRAG-Extractor] Chưa bật, bỏ qua trích xuất');
        return null;
    }

    // Kiểm tra xem có đang ở chế độ điều phối bộ nhớ không
    const isMemoryDispatcherMode = window.userProfileConfig?.memoryDispatcherEnabled ||
        window.memoryDispatcherEnabled;
    if (!isMemoryDispatcherMode) {
        console.log('[GraphRAG-Extractor] Không phải chế độ điều phối bộ nhớ, bỏ qua trích xuất');
        return null;
    }

    console.log('[GraphRAG-Extractor] Bắt đầu trích xuất...');
    console.time('[GraphRAG-Extractor] Thời gian trích xuất');

    try {
        // Lấy prompt hệ thống
        const systemPrompt = getGraphRAGPrompt();

        // Lấy phản hồi gần nhất của AI
        let lastAIReply = '';
        if (window.gameState?.conversationHistory) {
            const history = window.gameState.conversationHistory;
            const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
            lastAIReply = lastAI?.content?.substring(0, 2000) || '';
        }

        // Lấy danh sách thực thể hiện có
        const existingEntities = window.graphRAGLite?.getAllEntities()?.map(e => e.name) || [];

        // Xây dựng ngữ cảnh
        const context = buildExtractionContext(userInput, lastAIReply, existingEntities);

        // Xây dựng tin nhắn
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context }
        ];

        // Gọi API bổ sung
        const response = await callExtraAI(messages);

        console.timeEnd('[GraphRAG-Extractor] Thời gian trích xuất');

        // Phân giải phản hồi
        const result = parseGraphRAGResponse(response);

        if (result?.semanticUpsert) {
            console.log('[GraphRAG-Extractor] Kết quả trích xuất:',
                'Thực thể:', result.semanticUpsert.newEntities?.length || 0,
                'Quan hệ:', result.semanticUpsert.newRelations?.length || 0);
        }

        return result;
    } catch (error) {
        console.error('[GraphRAG-Extractor] Trích xuất thất bại:', error);
        console.timeEnd('[GraphRAG-Extractor] Thời gian trích xuất');
        return null;
    }
}

/**
 * Phân giải phản hồi GraphRAG
 */
function parseGraphRAGResponse(response) {
    if (!response) return null;

    try {
        let jsonStr = response;

        // Loại bỏ khối mã markdown
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Trích xuất đối tượng JSON
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }

        const result = JSON.parse(jsonStr);
        return result;
    } catch (e) {
        console.warn('[GraphRAG-Extractor] Phân giải phản hồi thất bại:', e);
        console.log('[GraphRAG-Extractor] Phản hồi gốc:', response?.substring(0, 500));
        return null;
    }
}

/**
 * Xử lý đồng thời nhập liệu của người dùng (gọi cả bộ điều phối bộ nhớ và trích xuất GraphRAG)
 */
async function processUserInputWithGraphRAG(userInput, gameContext) {
    const graphRAGEnabled = window.graphRAGLite?.config?.enabled;
    const memoryDispatcherMode = window.userProfileConfig?.memoryDispatcherEnabled ||
        window.memoryDispatcherEnabled;

    if (!memoryDispatcherMode) {
        // Không phải chế độ điều phối bộ nhớ, không thực hiện
        return null;
    }

    console.log('[GraphRAG-Extractor] Bắt đầu xử lý đồng thời...');
    console.time('[GraphRAG-Extractor] Tổng thời gian');

    let memoryResult = null;
    let graphResult = null;

    if (graphRAGEnabled) {
        // Thực thi đồng thời
        [memoryResult, graphResult] = await Promise.all([
            // Nhiệm vụ 1: Bộ điều phối bộ nhớ (đã có)
            window.analyzeUserInput ? window.analyzeUserInput(userInput, gameContext) : null,

            // Nhiệm vụ 2: Trích xuất GraphRAG (mới thêm)
            extractGraphRAG(userInput, gameContext)
        ]);
    } else {
        // Chỉ thực thi bộ điều phối bộ nhớ
        memoryResult = window.analyzeUserInput ?
            await window.analyzeUserInput(userInput, gameContext) : null;
    }

    console.timeEnd('[GraphRAG-Extractor] Tổng thời gian');

    // Xử lý kết quả GraphRAG
    if (graphResult?.semanticUpsert) {
        await window.graphRAGLite?.processUpdate(graphResult.semanticUpsert);
    }

    // Gộp kết quả
    return {
        ...memoryResult,
        graphUpdate: graphResult?.semanticUpsert
    };
}

/**
 * Lấy ngữ cảnh GraphRAG (dành cho bộ điều phối bộ nhớ sử dụng)
 */
async function getGraphRAGContext(userInput) {
    if (!window.graphRAGLite?.config?.enabled) {
        return '';
    }

    // Lấy phản hồi AI gần nhất
    let lastAIReply = '';
    if (window.gameState?.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const lastAI = history.filter(m => m.role === 'assistant').slice(-1)[0];
        lastAIReply = lastAI?.content?.substring(0, 500) || '';
    }

    const context = await window.graphRAGLite.buildContext(userInput, lastAIReply);
    return context || '';
}

// Xuất ra biến toàn cục (Global)
if (typeof window !== 'undefined') {
    window.getGraphRAGPrompt = getGraphRAGPrompt;
    window.extractGraphRAG = extractGraphRAG;
    window.parseGraphRAGResponse = parseGraphRAGResponse;
    window.processUserInputWithGraphRAG = processUserInputWithGraphRAG;
    window.getGraphRAGContext = getGraphRAGContext;

    console.log('[GraphRAG-Extractor] Module trích xuất đã được tải');
}
