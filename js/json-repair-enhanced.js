/**
 * Công cụ sửa lỗi và phân tích JSON phiên bản tăng cường
 * Giải quyết vấn đề lỗi định dạng phản hồi từ AI
 */

/**
 * Tự động sửa lỗi JSON phiên bản tăng cường
 * @param {string} jsonStr - Chuỗi JSON cần sửa
 * @returns {string} Chuỗi JSON đã sửa
 */
function enhancedAutoFixJSON(jsonStr) {
    console.log('🔧 [Sửa lỗi tăng cường] Bắt đầu sửa JSON, độ dài đầu vào:', jsonStr.length);
    let fixed = jsonStr.trim();

    // ========== Bước 1: Dọn dẹp tiền tố và hậu tố ==========
    // Loại bỏ dấu đánh dấu khối mã (code block)
    fixed = fixed.replace(/^```(?:json)?\s*/i, '');
    fixed = fixed.replace(/\s*```$/, '');

    // Loại bỏ tiền tố "json hoặc json
    fixed = fixed.replace(/^["']?json["']?\s*/i, '');

    // Loại bỏ dấu ngoặc kép dư thừa ở đầu
    if (fixed.startsWith('"') && !fixed.startsWith('"{')) {
        fixed = fixed.substring(1);
    }

    // Loại bỏ dấu ngoặc kép dư thừa ở cuối
    if (fixed.endsWith('"') && !fixed.endsWith('}"')) {
        fixed = fixed.substring(0, fixed.length - 1);
    }

    // ========== Bước 2: Xử lý chú thích ==========
    // Loại bỏ chú thích trên một dòng //
    fixed = fixed.replace(/\/\/[^\n]*/g, '');

    // Loại bỏ chú thích trên nhiều dòng /* */
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    // ========== Bước 3: Sửa lỗi ký tự xuống dòng ==========
    // Thoát các ký tự xuống dòng trong giá trị chuỗi
    fixed = fixed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });

    // ========== Bước 4: Sửa lỗi dấu phẩy ==========
    // 4.0 Loại bỏ các ký tự không hợp lệ sau dấu phẩy (ví dụ ,_ nên trở thành ,)
    // Trường hợp này thường là lỗi đánh máy khi AI tạo ra, ví dụ "step": 3,_ nên sửa thành "step": 3,
    fixed = fixed.replace(/,\s*[_]+\s*(?=["{\[])/g, ', ');
    fixed = fixed.replace(/,\s*[_]+\s*(?=\n)/g, ',');

    // 4.1 Loại bỏ dấu phẩy dư thừa ở cuối đối tượng (object) và mảng (array)
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // 4.2 Sửa lỗi thiếu dấu phẩy giữa các phần tử mảng
    // Khớp: "xxx" "yyy" hoặc "xxx"\n"yyy" (hai chuỗi không có dấu phẩy ở giữa)
    fixed = fixed.replace(/("[^"]*")\s+(")/g, '$1, $2');

    // 4.3 Sửa lỗi thiếu dấu phẩy giữa các đối tượng: } { hoặc }\n{
    fixed = fixed.replace(/(\})\s+(\{)/g, '$1, $2');

    // 4.4 Sửa lỗi thiếu dấu phẩy giữa các mảng: ] [ hoặc ]\n[
    fixed = fixed.replace(/(\])\s+(\[)/g, '$1, $2');

    // 4.5 Sửa lỗi thiếu dấu phẩy sau đối tượng theo sau là một chuỗi: } "xxx"
    fixed = fixed.replace(/(\})\s+(")/g, '$1, $2');

    // 4.6 Sửa lỗi thiếu dấu phẩy sau chuỗi theo sau là một đối tượng: "xxx" {
    fixed = fixed.replace(/("[^"]*")\s+(\{)/g, '$1, $2');

    // 4.7 Sửa lỗi thiếu dấu phẩy sau số theo sau là các phần tử khác
    fixed = fixed.replace(/(\d)\s+(")/g, '$1, $2');
    fixed = fixed.replace(/(\d)\s+(\{)/g, '$1, $2');
    fixed = fixed.replace(/(\d)\s+(\[)/g, '$1, $2');

    // 4.8 Sửa lỗi thiếu dấu phẩy sau giá trị boolean/null
    fixed = fixed.replace(/(true|false|null)\s+(")/gi, '$1, $2');
    fixed = fixed.replace(/(true|false|null)\s+(\{)/gi, '$1, $2');
    fixed = fixed.replace(/(true|false|null)\s+(\[)/gi, '$1, $2');

// ========== Bước 5: Bổ sung các dấu ngoặc còn thiếu ==========
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
        console.warn(`🔧 Bổ sung ${openBraces - closeBraces} dấu ngoặc nhọn đóng`);
        fixed += '}'.repeat(openBraces - closeBraces);
    }

    if (openBrackets > closeBrackets) {
        console.warn(`🔧 Bổ sung ${openBrackets - closeBrackets} dấu ngoặc vuông đóng`);
        fixed += ']'.repeat(openBrackets - closeBrackets);
    }

    // ========== Bước 6: Sửa dấu ngoặc kép ==========
    // Thống nhất sử dụng dấu ngoặc kép
    // Lưu ý: Chỉ thay thế các dấu ngoặc đơn đóng vai trò cú pháp JSON, không ảnh hưởng đến dấu ngoặc đơn bên trong chuỗi
    let inString = false;
    let result = '';
    let i = 0;

    while (i < fixed.length) {
        const char = fixed[i];
        const nextChar = fixed[i + 1];

        // Xử lý ký tự thoát (escape)
        if (char === '\\' && inString) {
            result += char + (nextChar || '');
            i += 2;
            continue;
        }

        // Chuyển đổi trạng thái chuỗi
        if (char === '"') {
            inString = !inString;
            result += char;
            i++;
            continue;
        }

        // Nếu ở ngoài chuỗi, thay thế dấu ngoặc đơn thành dấu ngoặc kép
        if (char === "'" && !inString) {
            result += '"';
            i++;
            continue;
        }

        result += char;
        i++;
    }

    fixed = result;

    // ========== Bước 7: Sửa tên thuộc tính ==========
    // Thêm dấu ngoặc kép cho các tên thuộc tính chưa có
    // Pattern khớp: Xuống dòng + khoảng trắng + từ + khoảng trắng + dấu hai chấm
    fixed = fixed.replace(/(\n\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, (match, indent, propName, space) => {
        // Kiểm tra xem đã có dấu ngoặc kép chưa
        if (fixed[fixed.indexOf(match) - 1] === '"') {
            return match;
        }
        return indent + '"' + propName + '"' + space + ':';
    });

    // Đồng thời xử lý thuộc tính đầu tiên (sau dấu {)
    fixed = fixed.replace(/(\{\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, (match, brace, propName, space) => {
        return brace + '"' + propName + '"' + space + ':';
    });

    // ========== Bước 8: Sửa các chuỗi thoát (escape sequence) không hợp lệ ==========
    // JSON chỉ hỗ trợ: \" \\ \/ \b \f \n \r \t \uXXXX
    // Các tổ hợp dấu gạch chéo ngược + ký tự khác là không hợp lệ và cần được sửa
    fixed = fixed.replace(/\\([^"\\\/bfnrtu])/g, (match, char) => {
        // Nếu là chuỗi thoát bất hợp pháp, loại bỏ dấu gạch chéo ngược
        console.log('🔧 [Sửa lỗi tăng cường] Sửa chuỗi thoát không hợp lệ: \\' + char + ' -> ' + char);
        return char;
    });

    // Sửa trường hợp định dạng \uXXXX không đầy đủ
    fixed = fixed.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');

    // ========== Bước 9: Sửa các ký tự đặc biệt ==========
    // Loại bỏ các ký tự điều khiển (ngoại trừ xuống dòng, về đầu dòng, tab)
    fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    console.log('✅ [Sửa lỗi tăng cường] Hoàn tất sửa lỗi');
    return fixed;
}

/**
 * Phân tích thông minh phản hồi từ AI (thử nhiều chiến lược)
 * @param {string} response - Phản hồi gốc từ AI
 * @returns {Object|null} Đối tượng dữ liệu sau khi phân tích, trả về null nếu thất bại
 */
function smartParseAIResponse(response) {
    const strategies = [
        {
            name: 'Phân tích trực tiếp',
            fn: (r) => JSON.parse(r)
        },
        {
            // Ưu tiên trích xuất JSON trong khối mã (AI thường dùng ```json bao bọc phản hồi)
            name: 'Trích xuất khối mã',
            fn: (r) => {
                const match = r.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (!match) throw new Error('Không tim thấy khối mã');
                return JSON.parse(match[1]);
            }
        },
        {
name: 'Sửa lỗi tăng cường - Toàn văn',
            fn: (r) => {
                const fixed = enhancedAutoFixJSON(r);
                return JSON.parse(fixed);
            }
        },
        {
            // 🆕 Xử lý trường hợp chỉ có thẻ <variable_update> (AI không trả về định dạng JSON)
            // Đặt sau phần phân tích khối mã để tránh khớp nhầm thẻ variable_update lồng trong JSON
            name: 'Trích xuất thẻ variable_update',
            fn: (r) => {
                // Khớp thẻ <variable_update>...</variable_update>
                const patterns = [
                    /<variable_update>([\s\S]*?)<\/variable_update>/i,
                    /<variableUpdate>([\s\S]*?)<\/variableUpdate>/i,
                    /<变量更新>([\s\S]*?)<\/变量更新>/
                ];

                let variableUpdateContent = null;
                for (const pattern of patterns) {
                    const match = r.match(pattern);
                    if (match && match[1]) {
                        variableUpdateContent = match[0]; // Giữ nguyên thẻ hoàn chỉnh
                        break;
                    }
                }

                if (!variableUpdateContent) {
                    throw new Error('Không tìm thấy thẻ variable_update');
                }

                console.log('✅ [Trích xuất variable_update] Trích xuất thẻ thành công, độ dài:', variableUpdateContent.length);

                // Cấu trúc đối tượng phản hồi theo định dạng chuẩn
                return {
                    story: '（Chế độ cập nhật biến, không có cốt truyện đầu ra）',
                    variableUpdate: variableUpdateContent,
                    options: [
                        'Tiếp tục trò chơi',
                        'Xem trạng thái hiện tại',
                        'Tạo lại',
                        'Quay lại bước trước'
                    ]
                };
            }
        },
        {
            name: 'Trích xuất nội dung trong ngoặc nhọn',
            fn: (r) => {
                const match = r.match(/\{[\s\S]*\}/);
                if (!match) throw new Error('Không tìm thấy đối tượng JSON');
                const fixed = enhancedAutoFixJSON(match[0]);
                return JSON.parse(fixed);
            }
        },
        {
            name: 'Dùng Regex trích xuất các trường chính',
            fn: (r) => {
                console.log('🔧 [Trích xuất Regex] Đang thử trích xuất trực tiếp các trường chính từ phản hồi...');

                const result = {};
                let extractedCount = 0;

                // 1. Trích xuất đối tượng reasoning
                const reasoningMatch = r.match(/"reasoning"\s*:\s*(\{[\s\S]*?\n\s*\})\s*(?=,\s*"|\}$)/);
                if (reasoningMatch) {
                    try {
                        result.reasoning = JSON.parse(reasoningMatch[1]);
                        extractedCount++;
                        console.log('✅ [Trích xuất Regex] Trích xuất reasoning thành công');
                    } catch (e) {
                        console.log('⚠️ [Trích xuất Regex] Phân tích reasoning thất bại:', e.message);
                    }
                }

                // 2. Trích xuất trường story (trường chuỗi dài nhất)
                const storyMatch = r.match(/"story"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (storyMatch) {
                    // Xử lý các ký tự thoát
                    result.story = storyMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                    extractedCount++;
                    console.log('✅ [Trích xuất Regex] Trích xuất story thành công, độ dài:', result.story.length);
                }

                // 3. Trích xuất trường variableUpdate hoặc variableChanges
                const varUpdateMatch = r.match(/"variableUpdate"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (varUpdateMatch) {
                    result.variableUpdate = varUpdateMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                    extractedCount++;
                    console.log('✅ [Trích xuất Regex] Trích xuất variableUpdate thành công');
                }

                // Cũng thử trích xuất định dạng đối tượng variableChanges
                const varChangesMatch = r.match(/"variableChanges"\s*:\s*(\{[\s\S]*?\n\s*\})\s*(?=,\s*"|\}$)/);
                if (varChangesMatch && !result.variableUpdate) {
                    try {
                        result.variableChanges = JSON.parse(varChangesMatch[1]);
                        extractedCount++;
                        console.log('✅ [Trích xuất Regex] Trích xuất variableChanges thành công');
                    } catch (e) {
                        console.log('⚠️ [Trích xuất Regex] Phân tích variableChanges thất bại:', e.message);
                    }
                }

                // 4. Trích xuất mảng options
                const optionsMatch = r.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
                if (optionsMatch) {
                    try {
                        // Thử phân tích mảng tùy chọn
                        const optionsStr = '[' + optionsMatch[1] + ']';
                        result.options = JSON.parse(optionsStr);
                        extractedCount++;
                        console.log('✅ [Trích xuất Regex] Trích xuất options thành công, số lượng:', result.options.length);
                    } catch (e) {
                        // Nếu phân tích thất bại, thử trích xuất từng chuỗi một
                        const optionStrings = optionsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
                        if (optionStrings && optionStrings.length > 0) {
                            result.options = optionStrings.map(s =>
                                s.slice(1, -1)
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\')
                            );
                            extractedCount++;
                            console.log('✅ [Trích xuất Regex] Trích xuất options bằng phương pháp dự phòng thành công, số lượng:', result.options.length);
                        }
                    }
                }

                // Kiểm tra xem đã trích xuất đủ các trường quan trọng chưa
                if (extractedCount < 2) {
                    throw new Error(`Số lượng trường trích xuất không đủ (${extractedCount}/2)`);
                }

                // Ít nhất phải có trường story
                if (!result.story) {
                    throw new Error('Không thể trích xuất trường story');
                }

                console.log(`✅ [Trích xuất Regex] Trích xuất thành công ${extractedCount} trường quan trọng`);
                return result;
            }
        },
        {
            name: 'Phân tích JSON lỏng lẻo',
            fn: (r) => {
                // Sử dụng eval (có rủi ro, là biện pháp cuối cùng)
                const fixed = enhancedAutoFixJSON(r);
                // Thử JSON.parse trước
                try {
                    return JSON.parse(fixed);
                } catch (e) {
                    // Nếu thất bại, thử sửa lỗi quyết liệt hơn
                    console.warn('⚠️ Sử dụng chế độ sửa lỗi quyết liệt');
                    return tryAggressiveRepair(fixed);
                }
            }
        }
    ];

    for (const strategy of strategies) {
        try {
            console.log(`🔍 Đang thử chiến lược: ${strategy.name}`);
            const result = strategy.fn(response);
            console.log(`✅ Chiến lược thành công: ${strategy.name}`);
            return result;
        } catch (error) {
            console.log(`❌ Chiến lược thất bại: ${strategy.name} - ${error.message}`);
        }
    }

    console.error('❌ Tất cả các chiến lược phân tích đều thất bại');
    return null;
}

/**
 * Chế độ sửa lỗi quyết liệt (Biện pháp cuối cùng)
 * @param {string} jsonStr - Chuỗi JSON
 * @returns {Object} Kết quả phân tích
 */
function tryAggressiveRepair(jsonStr) {
    let fixed = jsonStr;

    console.log('🔧 [Sửa lỗi quyết liệt] Bắt đầu sửa lỗi quyết liệt, độ dài:', fixed.length);

    // ========== Chiến lược 1: Sửa lỗi bằng máy trạng thái (state machine) từng ký tự ==========
    try {
        const stateMachineFixed = fixJsonWithStateMachine(fixed);
        const parsed = JSON.parse(stateMachineFixed);
        console.log('✅ [Sửa lỗi quyết liệt] Sửa lỗi bằng máy trạng thái thành công');
        return parsed;
    } catch (e) {
        console.log('⚠️ [Sửa lỗi quyết liệt] Sửa lỗi bằng máy trạng thái thất bại:', e.message);
    }

    // ========== Chiến lược 2: Tìm JSON hoàn chỉnh cuối cùng ==========
    let lastValidJson = null;
    let maxLength = 0;

    // Thử tìm JSON hợp lệ bằng cách duyệt ngược từ dưới lên
    for (let i = fixed.length; i > fixed.length / 2; i--) {
        const substr = fixed.substring(0, i);

        // Bổ sung các ký tự kết thúc có thể bị thiếu
        let attempt = substr;
        const missingBraces = (attempt.match(/\{/g) || []).length - (attempt.match(/\}/g) || []).length;
        const missingBrackets = (attempt.match(/\[/g) || []).length - (attempt.match(/\]/g) || []).length;

        if (missingBraces > 0) attempt += '}'.repeat(missingBraces);
        if (missingBrackets > 0) attempt += ']'.repeat(missingBrackets);

        // Loại bỏ dấu phẩy thừa ở cuối
        attempt = attempt.replace(/,(\s*[}\]])/g, '$1');

        try {
            const parsed = JSON.parse(attempt);
            if (i > maxLength) {
                maxLength = i;
                lastValidJson = parsed;
            }
        } catch (e) {
            // Tiếp tục thử
        }
    }

    if (lastValidJson) {
        console.log('✅ [Sửa lỗi quyết liệt] Sửa lỗi bằng cách cắt đoạn thành công, độ dài:', maxLength);
        return lastValidJson;
    }

    throw new Error('Sửa lỗi quyết liệt cũng thất bại');
}

/**
 * Sử dụng máy trạng thái để sửa JSON (xử lý các vấn đề như thiếu dấu phẩy)
 * @param {string} jsonStr - Chuỗi JSON
 * @returns {string} Chuỗi JSON đã sửa
 */
function fixJsonWithStateMachine(jsonStr) {
    let result = '';
    let i = 0;
    let inString = false;
    let escapeNext = false;
    let lastNonWhitespaceChar = '';
    let stack = []; // Ghi lại sự lồng nhau của { hoặc [

    while (i < jsonStr.length) {
        const char = jsonStr[i];

        // Xử lý ký tự thoát
        if (escapeNext) {
            // Kiểm tra xem có phải là ký tự thoát JSON hợp lệ không
            const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
            if (validEscapes.includes(char)) {
                result += char;
            } else {
                // Chuỗi thoát không hợp lệ, loại bỏ dấu gạch chéo ngược phía trước, chỉ giữ lại ký tự
                // Cần loại bỏ dấu gạch chéo ngược ở cuối result
                result = result.slice(0, -1) + char;
                console.log('🔧 [Máy trạng thái] Sửa chuỗi thoát không hợp lệ: \\' + char + ' -> ' + char);
            }
            escapeNext = false;
            i++;
            continue;
        }

        if (char === '\\' && inString) {
            result += char;
            escapeNext = true;
            i++;
            continue;
        }

        // Xử lý biên của chuỗi
        if (char === '"') {
            // Kiểm tra xem có cần thêm dấu phẩy trước dấu ngoặc kép không
            if (!inString && (lastNonWhitespaceChar === '"' || lastNonWhitespaceChar === '}' || lastNonWhitespaceChar === ']' || /\d/.test(lastNonWhitespaceChar))) {
                // Kiểm tra xem có phải sau dấu hai chấm của cặp key-value không (không cần thêm dấu phẩy)
                const trimmedResult = result.trimEnd();
                if (!trimmedResult.endsWith(':') && !trimmedResult.endsWith(',') && !trimmedResult.endsWith('[') && !trimmedResult.endsWith('{')) {
                    result += ',';
                    console.log('🔧 [Máy trạng thái] Bổ sung dấu phẩy tại vị trí', i);
                }
            }
            inString = !inString;
            result += char;
            if (!inString) {
                lastNonWhitespaceChar = char;
            }
            i++;
            continue;
        }

        if (inString) {
            // Bên trong chuỗi, xử lý các dấu xuống dòng chưa được thoát
            if (char === '\n') {
                result += '\\n';
            } else if (char === '\r') {
                result += '\\r';
            } else if (char === '\t') {
                result += '\\t';
            } else {
                result += char;
            }
            i++;
            continue;
        }

        // Ngoài chuỗi
        if (char === '{' || char === '[') {
            // Kiểm tra xem có cần thêm dấu phẩy không
            if (lastNonWhitespaceChar === '"' || lastNonWhitespaceChar === '}' || lastNonWhitespaceChar === ']' || /\d/.test(lastNonWhitespaceChar)) {
                const trimmedResult = result.trimEnd();
                if (!trimmedResult.endsWith(':') && !trimmedResult.endsWith(',') && !trimmedResult.endsWith('[') && !trimmedResult.endsWith('{')) {
                    result += ',';
                    console.log('🔧 [Máy trạng thái] Bổ sung dấu phẩy tại vị trí', i, '(trước dấu mở ngoặc)');
                }
            }
            stack.push(char);
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }

        if (char === '}' || char === ']') {
            // Loại bỏ dấu phẩy thừa ở cuối
            const trimmedResult = result.trimEnd();
            if (trimmedResult.endsWith(',')) {
                result = trimmedResult.slice(0, -1);
                console.log('🔧 [Máy trạng thái] Loại bỏ dấu phẩy thừa');
            }
            stack.pop();
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }

        if (char === ':' || char === ',') {
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }

        // Ký tự khoảng trắng
        if (/\s/.test(char)) {
            result += char;
            i++;
            continue;
        }

        // Các ký tự khác (số, true, false, null, v.v.)
        // Lọc bỏ các ký tự không nên xuất hiện trong JSON (như dấu _ đứng lẻ loi)
        // Ký tự hợp lệ: chữ cái, chữ số, - (cho số âm), . (cho số thập phân), một phần của true/false/null
        if (/[a-zA-Z0-9.\-]/.test(char)) {
            result += char;
            lastNonWhitespaceChar = char;
        } else {
            // Bỏ qua ký tự không hợp lệ (như _ ) và ghi log
            console.log('🔧 [Máy trạng thái] Bỏ qua ký tự không hợp lệ:', char, 'tại vị trí', i);
        }
        i++;
    }

    // Bổ sung các dấu ngoặc đóng còn thiếu
    while (stack.length > 0) {
        const open = stack.pop();
        result += (open === '{') ? '}' : ']';
        console.log('🔧 [Máy trạng thái] Bổ sung dấu ngoặc đóng:', (open === '{') ? '}' : ']');
    }

    return result;
}

/**
 * Xác thực và bổ sung các trường bắt buộc
 * @param {Object} data - Dữ liệu sau khi phân tích
 * @returns {Object} Dữ liệu đã xác thực và bổ sung
 */
function validateAndCompleteData(data) {
    console.log('🔍 Đang xác thực tính toàn vẹn của dữ liệu...');

    // Định nghĩa các trường bắt buộc
    const requiredFields = {
        reasoning: {
            default: {
                situation: 'Đang phân tích dữ liệu',
                playerChoice: 'Tiếp tục trò chơi',
                logicChain: ['Phân tích thành công'],
                outcome: 'Tiếp tục luồng trò chơi'
            },
            type: 'object'
        },
        variableChanges: {
            default: {
                analysis: 'Không có thay đổi',
                changes: {}
            },
            type: 'object'
        },
        story: {
            default: '（AI đang tạo cốt truyện...）',
            type: 'string'
        },
        options: {
            default: [
                'Trò chuyện với những người xung quanh',
                'Rời khỏi nơi này',
                'Tiếp tục khám phá',
                '【R18】Nghỉ ngơi chốc lát'
            ],
            type: 'array',
            minLength: 4
        }
    };

    // Kiểm tra và bổ sung các trường thiếu
    for (const [field, config] of Object.entries(requiredFields)) {
        if (!data[field]) {
            console.warn(`⚠️ Thiếu trường ${field}, sử dụng giá trị mặc định`);
            data[field] = config.default;
        } else if (config.type === 'array' && config.minLength) {
            // Bổ sung các phần tử mảng còn thiếu
            while (data[field].length < config.minLength) {
                const index = data[field].length;
                data[field].push(config.default[index] || `Tùy chọn ${index + 1}`);
            }
        }
    }

    // Xác thực số lượng options
    if (data.options && data.options.length < 4) {
        console.warn(`⚠️ Số lượng tùy chọn không đủ（${data.options.length}/4）, tự động bổ sung`);
        const defaultOptions = [
            'Trò chuyện với những người xung quanh',
            'Rời khỏi nơi này',
            'Tiếp tục khám phá',
            '【R18】Nghỉ ngơi chốc lát'
        ];
        while (data.options.length < 4) {
            data.options.push(defaultOptions[data.options.length] || `Tùy chọn ${data.options.length + 1}`);
        }
    }

    // Xác thực độ dài story
    if (data.story && data.story.length < 20) {
        console.warn('⚠️ Mô tả cốt truyện quá ngắn');
        data.story += '\n\n（Câu chuyện tiếp tục...）';
    }

    console.log('✅ Xác thực dữ liệu hoàn tất');
    return data;
}

/**
 * Chế độ hiển thị dự phòng (Khi JSON hoàn toàn không thể phân tích được)
 * @param {string} response - Phản hồi gốc từ AI
 * @returns {Object} Đối tượng dữ liệu dự phòng
 */
function fallbackParse(response) {
    console.log('⚠️ Khởi động chế độ hiển thị dự phòng');

    // Thử trích xuất nội dung văn bản
    let story = response;

    // Loại bỏ các ký hiệu khối mã
    story = story.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');

// Nếu văn bản quá ngắn, thêm thông báo nhắc nhở
    if (story.length < 50) {
        story = `Định dạng phản hồi AI bất thường, nội dung gốc:\n\n${story}\n\nKhuyên bạn nên chọn "Tạo lại".`;
    }

    return {
        reasoning: {
            situation: 'Phân tích phản hồi AI thất bại',
            playerChoice: 'Đang chờ người chơi lựa chọn',
            logicChain: ['Lỗi định dạng phản hồi', 'Kích hoạt chế độ dự phòng', 'Hiển thị nội dung gốc'],
            outcome: 'Chờ người chơi tạo lại hoặc tiếp tục'
        },
        variableChanges: {
            analysis: 'Không có thay đổi do lỗi phân tích',
            changes: {}
        },
        story: story,
        options: [
            'Tạo lại phản hồi',
            'Thử tiếp tục',
            'Xem phản hồi gốc',
            'Quay lại bước trước',
            'Lưu và thoát'
        ]
    };
}

/**
 * Quy trình xử lý phản hồi AI hoàn chỉnh
 * @param {string} response - Phản hồi gốc từ AI
 * @returns {Object} Đối tượng dữ liệu sau xử lý (đảm bảo không phải null)
 */
function processAIResponse(response) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 [Xử lý phản hồi AI] Bắt đầu xử lý');
    console.log('📝 Độ dài phản hồi:', response.length);

    try {
        // Bước 1: Phân tích thông minh
        let data = smartParseAIResponse(response);

        // Bước 2: Nếu phân tích thất bại, sử dụng chế độ dự phòng
        if (!data) {
            console.warn('⚠️ Phân tích thông minh thất bại, sử dụng chế độ dự phòng');
            data = fallbackParse(response);
        }

        // Bước 3: Xác thực và bổ sung dữ liệu
        data = validateAndCompleteData(data);

        console.log('✅ [Xử lý phản hồi AI] Xử lý thành công');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return data;
    } catch (error) {
        console.error('❌ [Xử lý phản hồi AI] Xử lý thất bại:', error);
        console.error('Sử dụng phương án dự phòng cuối cùng');

        return fallbackParse(response);
    }
}
