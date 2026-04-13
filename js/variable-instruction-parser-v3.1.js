/**
 * Trình phân tích cú pháp lệnh biến v3.1 - Phiên bản tối giản
 * Cực kỳ đơn giản, AI nhìn là hiểu ngay!
 */
class VariableInstructionParserV31 {
    constructor(gameState, options = {}) {
        this.gameState = gameState;
        this.options = {
            debug: options.debug || false,
            enableRollback: options.enableRollback !== false,
            ...options
        };
        this.executionLog = [];
        this.rollbackBackup = null;
    }

    /**
     * Thực thi lệnh
     */
    execute(response) {
        this.executionLog = [];

        if (this.options.enableRollback) {
            this.rollbackBackup = JSON.parse(JSON.stringify(this.gameState.variables));
            this.log('Đã tạo bản sao lưu để rollback');
        }

        try {
            const content = this.extractContent(response);
            if (!content) {
                this.log('Không tìm thấy thẻ cập nhật biến');
                return { success: true, executed: 0, errors: [] };
            }

            const count = this.parseAndExecute(content);
            this.log(`✅ Thực thi hoàn tất: ${count} thao tác`);
            return { success: true, executed: count, errors: [] };

        } catch (error) {
            this.log(`❌ Thực thi thất bại: ${error.message}`);

            if (this.options.enableRollback && this.rollbackBackup) {
                this.gameState.variables = this.rollbackBackup;
                this.log('Đã rollback về trạng thái trước đó');
            }

            return { success: false, executed: 0, errors: [error.message] };
        }
    }

    /**
     * Trích xuất nội dung cập nhật biến
     * Hỗ trợ nhiều biến thể thẻ: variable_update, variableUpdate, VARIABLE_UPDATE v.v.
     */
    extractContent(response) {
        // 🔧 Sử dụng regex không phân biệt chữ hoa chữ thường, hỗ trợ nhiều định dạng thẻ
        const patterns = [
            // Định dạng tiêu chuẩn (Không phân biệt chữ hoa chữ thường)
            /<variable_update>([\s\S]*?)<\/variable_update>/i,
            // Định dạng CamelCase (Không phân biệt chữ hoa chữ thường)
            /<variableUpdate>([\s\S]*?)<\/variableUpdate>/i,
            // Định dạng hỗn hợp: Thẻ mở và thẻ đóng có thể không đồng nhất
            /<variable_update>([\s\S]*?)<\/variableUpdate>/i,
            /<variableUpdate>([\s\S]*?)<\/variable_update>/i,
            // Định dạng tiếng Trung
            /<变量更新>([\s\S]*?)<\/变量更新>/
        ];

        for (const pattern of patterns) {
            const match = response.match(pattern);
            if (match && match[1]) {
                console.log(`[v3.1] ✅ Khớp thẻ cập nhật biến thành công, sử dụng pattern: ${pattern.source.substring(0, 30)}...`);
                return match[1].trim();
            }
        }

        // 🔧 Phương án dự phòng cuối cùng: Cố gắng khớp bất kỳ thẻ nào bắt đầu bằng variable
        const fallbackPattern = /<variable[_]?update>([\s\S]*?)<\/variable[_]?update>/i;
        const fallbackMatch = response.match(fallbackPattern);
        if (fallbackMatch && fallbackMatch[1]) {
            console.log(`[v3.1] ✅ Khớp thành công bằng phương án dự phòng`);
            return fallbackMatch[1].trim();
        }

        return null;
    }

    /**
     * Phân tích cú pháp và thực thi nội dung
     */
    parseAndExecute(content) {
        // 🔧 Sửa lỗi: Chuyển đổi ký tự xuống dòng dạng chuỗi thô (2 ký tự backslash + n) thành ký tự xuống dòng thực sự
        // Khi phản hồi của AI có định dạng JSON, dấu xuống dòng trong nội dung là chuỗi \n
        const literalBackslashN = String.fromCharCode(92) + 'n'; // Tạo chuỗi thô \n
        if (content.includes(literalBackslashN)) {
            console.log('[v3.1] 🔧 Phát hiện ký tự backslash+n thô, chuyển đổi thành dấu xuống dòng thực sự');
            // Thay thế tất cả chuỗi thô \n thành dấu xuống dòng thực sự, đồng thời xử lý \r \t v.v.
            content = content.split(literalBackslashN).join('\n');
            const literalBackslashR = String.fromCharCode(92) + 'r';
            content = content.split(literalBackslashR).join('\r');
            const literalBackslashT = String.fromCharCode(92) + 't';
            content = content.split(literalBackslashT).join('\t');
        }
        const lines = content.split('\n');
        let count = 0;
        let currentSection = null;
        let currentSectionKey = null;

        // Các chương/mục cần bỏ qua (Những phần này không nên được thêm vào dạng nối thêm)
        const ignoredSections = ['items', 'relationships', 'equipment', 'bodyParts', 'attributes'];

        for (const line of lines) {
            const trimmed = line.trim();

            // Bỏ qua dòng trống và chú thích
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            // Phát hiện chương/mục (ví dụ: history:, thoughts:, diary:)
            if (trimmed.endsWith(':') && !trimmed.startsWith('- ')) {
                currentSectionKey = trimmed.slice(0, -1).trim();
                // Nếu là chương/mục cần bỏ qua thì không xử lý
                if (ignoredSections.includes(currentSectionKey)) {
                    currentSection = null;
                    currentSectionKey = null;
                    continue;
                }
                currentSection = true;
                continue;
            }

            // Các mục danh sách trong chương/mục
            if (currentSection && trimmed.startsWith('- ')) {
                const text = trimmed.substring(2).trim();
                this.appendToArray(currentSectionKey, text);
                count++;
                continue;
            }

            // Kết thúc chương/mục nếu không phải là mục danh sách
            if (currentSection && !trimmed.startsWith('- ')) {
                currentSection = false;
                currentSectionKey = null;
            }

            // 🆕 Thao tác đổi tên nhân vật: >>rename: Tên cũ -> Tên mới
            if (trimmed.startsWith('>>rename:') || trimmed.startsWith('>> rename:')) {
                const renameContent = trimmed.replace(/^>>\s*rename:\s*/, '').trim();
                console.log(`[v3.1] Phát hiện thao tác đổi tên nhân vật: ${renameContent}`);
                if (renameContent.includes('->')) {
                    const [oldName, newName] = renameContent.split('->').map(s => s.trim());
                    if (oldName && newName) {
                        this.processRename(oldName, newName);
                        count++;
                        continue;
                    }
                }
                console.log(`[v3.1] Định dạng đổi tên không hợp lệ, phải là: >>rename: Tên cũ -> Tên mới`);
            }

            // Thao tác nối thêm: >>history: Văn bản
            if (trimmed.startsWith('>>')) {
                const content = trimmed.substring(2).trim();
                console.log(`[v3.1] Phát hiện thao tác nối thêm: ${content}`);
                if (content.includes(':')) {
                    const [key, value] = this.splitKeyValue(content);
                    console.log(`[v3.1] Phân tích cú pháp nối thêm: key="${key}", value="${value}"`);
                    this.appendToArray(key, value);
                    count++;
                    continue;
                } else {
                    console.log(`[v3.1] Thao tác nối thêm không đúng định dạng, thiếu dấu hai chấm: ${content}`);
                }
            }

            // Thao tác với vật phẩm: +Liệu thương đan x3 hoặc -Liệu thương đan x1
            if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
                this.processItem(trimmed);
                count++;
                continue;
            }

            // Cặp key-value: hp: -15 hoặc Lý Sư Tỷ.favor: +10
            if (trimmed.includes(':')) {
                this.processKeyValue(trimmed);
                count++;
                continue;
            }
        }

        return count;
    }

    /**
     * Xử lý thao tác vật phẩm
     * Định dạng: +Liệu thương đan x3 hoặc -Liệu thương đan x1
     */
    processItem(line) {
        const isAdd = line.startsWith('+');
        const content = line.substring(1).trim();

        // Phân tích cú pháp: Liệu thương đan x3 [type:Đan dược]
        let name = content;
        let count = 1;
        let attrs = {};

        // Trích xuất số lượng x3
        const countMatch = content.match(/\s+x(\d+)/);
        if (countMatch) {
            count = parseInt(countMatch[1]);
            name = content.substring(0, countMatch.index).trim();
        }

        // Trích xuất thuộc tính [type:Đan dược, atk:50]
        const attrMatch = content.match(/\[([^\]]+)\]/);
        if (attrMatch) {
            const attrStr = attrMatch[1];
            attrStr.split(',').forEach(pair => {
                const [key, value] = pair.split(':').map(s => s.trim());
                attrs[key] = isNaN(value) ? value : parseFloat(value);
            });
            name = name.replace(/\s*\[.*?\]/, '').trim();
        }

        if (isAdd) {
            this.addItem(name, count, attrs);
        } else {
            this.removeItem(name, count);
        }
    }

    /**
     * Xử lý cặp key-value
     * Hỗ trợ: hp: -15, Lý Sư Tỷ.favor: +10, relationships.Lý Sư Tỷ.favor: +10
     */
    processKeyValue(line) {
        const colonIndex = line.indexOf(':');
        let key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        // 🔧 Sửa lỗi: Nếu key bắt đầu bằng "relationships.", loại bỏ tiền tố này
        // Đôi khi AI trả về "relationships.Thẩm Manh Manh.favor" thay vì "Thẩm Manh Manh.favor"
        if (key.startsWith('relationships.')) {
            const originalKey = key;
            key = key.substring('relationships.'.length);
            console.log(`[v3.1] 🔧 Sửa tiền tố biến quan hệ: "${originalKey}" -> "${key}"`);
        }

        // Kiểm tra xem có phải là thao tác quan hệ không (có chứa dấu chấm)
        // Loại trừ các biến hệ thống: attributes, items, history, bodyParts, faction v.v.
        const systemPrefixes = ['items.', 'history.', 'attributes.', 'bodyParts.', 'faction.', 'equipment.', 'specialStatus.'];
        const isSystemVariable = systemPrefixes.some(prefix => key.startsWith(prefix));

        // Xử lý đặc biệt protagonist (Thông tin chi tiết của nhân vật chính, lưu trong gameState.variables.protagonist)
        if (key.startsWith('protagonist.')) {
            this.processProtagonist(key, value);
            return;
        }

        // Xử lý đặc biệt specialStatus (Trạng thái đặc biệt, lưu trong gameState.variables.specialStatus)
        if (key.startsWith('specialStatus.')) {
            this.processSpecialStatus(key, value);
            return;
        }

        if (key.includes('.') && !isSystemVariable) {
            this.processRelationship(key, value);
            return;
        }

        // Thao tác với số liệu
        if (/^[+\-=]/.test(value)) {
            this.processNumber(key, value);
            return;
        }

        // Xử lý đặc biệt cho cấp độ luyện đan/luyện khí (Định dạng mới: chuỗi)
        if (key === 'alchemyLevel' || key === 'craftingLevel') {
            this.setValue(key, value);
            this.log(`[Cấp độ] ${key}: ${value}`);
            return;
        }

        // Cố gắng phân tích đối tượng hoặc mảng JSON
        let parsedValue = value;
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
            // 🔧 Dọn dẹp dấu ngoặc kép được escape do AI trả về: Thay \" thành "
            let cleanedValue = value;
            if (cleanedValue.includes('\\"')) {
                cleanedValue = cleanedValue.replace(/\\"/g, '"');
                console.log(`[v3.1] 🔧 Sau khi dọn dẹp dấu ngoặc kép escape:`, cleanedValue);
            }
            try {
                parsedValue = JSON.parse(cleanedValue);
                this.log(`[Phân tích] ${key}: Phân tích JSON thành công`);
            } catch (e) {
                this.log(`[Phân tích] ${key}: Phân tích JSON thất bại, giữ nguyên dạng chuỗi - ${e.message}`);
            }
        } else {
            // Sử dụng phương thức phân tích giá trị thống nhất
            parsedValue = this.parseValue(value);
        }

        // Cài đặt trực tiếp
        this.setValue(key, parsedValue);
    }

    /**
     * Xử lý thao tác quan hệ
     * Định dạng: Lý Sư Tỷ.favor: +10 hoặc Lý Sư Tỷ.bodyParts.vagina.useCount: +1
     */
    processRelationship(key, value) {
        const parts = key.split('.');
        const name = parts[0];
        const attrPath = parts.slice(1); // Lấy đường dẫn thuộc tính còn lại

        const relationships = this.getValue('relationships') || [];
        let relationship = relationships.find(r => r.name === name);

        if (!relationship) {
            relationship = { name };
            relationships.push(relationship);
            this.setValue('relationships', relationships);
        }

        // Xử lý thuộc tính lồng nhau (ví dụ: bodyParts.vagina.useCount)
        if (attrPath.length > 1) {
            this.setNestedValue(relationship, attrPath, value);
            this.log(`[Quan hệ] ${name}.${attrPath.join('.')} = ${value}`);
            return;
        }

        const attr = attrPath[0] || 'favor';

        // Xử lý thao tác với số
        if (/^[+\-=]/.test(value)) {
            let operator = value[0];
            let restValue = value.substring(1);

            // 🔧 [Sửa lỗi v3.1] Tự động sửa "= +1" thành thao tác tăng dần (increment)
            if (operator === '=' && restValue.trim().startsWith('+')) {
                operator = '+';
                console.log(`[v3.1] Tự động sửa lỗi: Xem "${value}" như thao tác tăng tương đối`);
            }

            const num = parseFloat(restValue);
            const current = relationship[attr] || 0;

            // Kiểm tra xem có phải gán giá trị boolean không (ví dụ =true hoặc =false)
            if (operator === '=' && isNaN(num)) {
                // Không phải số, dùng parseValue để phân tích (xử lý true/false v.v.)
                const parsedValue = this.parseValue(restValue);
                relationship[attr] = parsedValue;
                console.log(`[v3.1 DEBUG] ${name}.${attr} = ${parsedValue} (type: ${typeof parsedValue})`, { restValue, parsedValue });
                this.log(`[Quan hệ] ${name}.${attr} = ${parsedValue} (Boolean/Chuỗi)`);
            } else {
                switch (operator) {
                    case '+':
                        relationship[attr] = current + num;
                        break;
                    case '-':
                        relationship[attr] = current - num;
                        break;
                    case '=':
                        relationship[attr] = num;
                        break;
                }
                this.log(`[Quan hệ] ${name}.${attr}: ${current} → ${relationship[attr]}`);
            }
        } else {
            // Phân tích giá trị (loại bỏ ngoặc kép, phân tích giá trị boolean v.v.)
            let parsedValue = this.parseValue(value);
            relationship[attr] = parsedValue;
            this.log(`[Quan hệ] ${name}.${attr} = ${parsedValue}`);
        }
    }

    /**
     * Thiết lập giá trị cho thuộc tính lồng nhau
     */
    setNestedValue(obj, path, value) {
        let current = obj;

        // Duyệt qua đường dẫn, tạo object lồng nhau
        for (let i = 0; i < path.length - 1; i++) {
            const part = path[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        // Thiết lập giá trị cuối cùng
        const finalKey = path[path.length - 1];

        // Xử lý thao tác số
        if (/^[+\-=]/.test(value)) {
            let operator = value[0];
            let restValue = value.substring(1);

            // 🔧 [Sửa lỗi v3.1] Tự động sửa "= +1" thành thao tác tăng dần (increment)
            if (operator === '=' && restValue.trim().startsWith('+')) {
                operator = '+';
                console.log(`[v3.1] Tự động sửa lỗi: Xem "${value}" như thao tác tăng tương đối`);
            }

            const num = parseFloat(restValue);
            const currentValue = current[finalKey] || 0;

            // Kiểm tra xem có phải gán giá trị boolean không (ví dụ =true hoặc =false)
            if (operator === '=' && isNaN(num)) {
                // Không phải số, dùng parseValue để phân tích (xử lý true/false v.v.)
                current[finalKey] = this.parseValue(restValue);
            } else {
                switch (operator) {
                    case '+':
                        current[finalKey] = currentValue + num;
                        break;
                    case '-':
                        current[finalKey] = currentValue - num;
                        break;
                    case '=':
                        current[finalKey] = num;
                        break;
                }
            }
        } else {
            // Phân tích giá trị (loại bỏ ngoặc kép, phân tích giá trị boolean v.v.)
            current[finalKey] = this.parseValue(value);
        }
    }

    /**
     * Xử lý thông tin chi tiết của nhân vật chính
     * Định dạng: protagonist.appearance: Miêu tả hoặc protagonist.bodyParts.penis.useCount: +1
     */
    processProtagonist(key, value) {
        // Bỏ tiền tố protagonist., lấy đường dẫn thuộc tính
        const attrPath = key.substring('protagonist.'.length).split('.');

        // Đảm bảo đối tượng protagonist tồn tại
        if (!this.gameState.variables.protagonist) {
            this.gameState.variables.protagonist = {};
        }

        const protagonist = this.gameState.variables.protagonist;

        // Xử lý thuộc tính lồng nhau (ví dụ bodyParts.penis.useCount)
        if (attrPath.length > 1) {
            this.setNestedValue(protagonist, attrPath, value);
            this.log(`[Nhân vật chính] protagonist.${attrPath.join('.')} = ${value}`);
            return;
        }

        // Thuộc tính cấp 1 (ví dụ appearance, isVirgin)
        const attr = attrPath[0];

        // Xử lý thao tác số
        if (/^[+\-=]/.test(value)) {
            let operator = value[0];
            let restValue = value.substring(1);

            // 🔧 [Sửa lỗi v3.1] Tự động sửa "= +1" thành thao tác tăng dần (increment)
            if (operator === '=' && restValue.trim().startsWith('+')) {
                operator = '+';
                console.log(`[v3.1] Tự động sửa lỗi: Xem "${value}" như thao tác tăng tương đối`);
            }

            const num = parseFloat(restValue);
            const current = protagonist[attr] || 0;

            // Kiểm tra xem có phải gán giá trị boolean không (ví dụ =true hoặc =false)
            if (operator === '=' && isNaN(num)) {
                protagonist[attr] = this.parseValue(restValue);
                this.log(`[Nhân vật chính] protagonist.${attr} = ${protagonist[attr]} (Boolean/Chuỗi)`);
            } else {
                switch (operator) {
                    case '+':
                        protagonist[attr] = current + num;
                        break;
                    case '-':
                        protagonist[attr] = current - num;
                        break;
                    case '=':
                        protagonist[attr] = num;
                        break;
                }
                this.log(`[Nhân vật chính] protagonist.${attr}: ${current} → ${protagonist[attr]}`);
            }
        } else {
            // Đặt giá trị chuỗi trực tiếp
            protagonist[attr] = this.parseValue(value);
            this.log(`[Nhân vật chính] protagonist.${attr} = ${protagonist[attr]}`);
        }
    }

    /**
     * Xử lý trạng thái đặc biệt
     * Định dạng: specialStatus.Xuân Dược.active: =true hoặc specialStatus.Xuân Dược.effect: Tấn công-3
     */
    processSpecialStatus(key, value) {
        // Bỏ tiền tố specialStatus., lấy đường dẫn thuộc tính
        const attrPath = key.substring('specialStatus.'.length).split('.');

        // Đảm bảo đối tượng specialStatus tồn tại
        if (!this.gameState.variables.specialStatus) {
            this.gameState.variables.specialStatus = {};
        }

        const specialStatus = this.gameState.variables.specialStatus;

        // attrPath[0] là tên trạng thái (ví dụ "Xuân Dược"), attrPath[1] là thuộc tính (ví dụ "active", "effect")
        const statusName = attrPath[0];
        const attr = attrPath[1] || 'active';

        // Đảm bảo đối tượng trạng thái đó tồn tại
        if (!specialStatus[statusName]) {
            specialStatus[statusName] = {};
        }

        // Xử lý giá trị
        if (/^[+\-=]/.test(value)) {
            let operator = value[0];
            let restValue = value.substring(1);

            // 🔧 [Sửa lỗi v3.1] Tự động sửa "= +1" thành thao tác tăng dần (increment)
            if (operator === '=' && restValue.trim().startsWith('+')) {
                operator = '+';
                console.log(`[v3.1] Tự động sửa lỗi: Xem "${value}" như thao tác tăng tương đối`);
            }

            const num = parseFloat(restValue);

            // Kiểm tra xem có phải gán giá trị boolean hoặc chuỗi không (ví dụ =true hoặc =false)
            if (operator === '=' && isNaN(num)) {
                specialStatus[statusName][attr] = this.parseValue(restValue);
                this.log(`[Trạng thái đặc biệt] ${statusName}.${attr} = ${specialStatus[statusName][attr]}`);
            } else {
                const current = specialStatus[statusName][attr] || 0;
                switch (operator) {
                    case '+':
                        specialStatus[statusName][attr] = current + num;
                        break;
                    case '-':
                        specialStatus[statusName][attr] = current - num;
                        break;
                    case '=':
                        specialStatus[statusName][attr] = num;
                        break;
                }
                this.log(`[Trạng thái đặc biệt] ${statusName}.${attr}: ${current} → ${specialStatus[statusName][attr]}`);
            }
        } else {
            // Đặt giá trị chuỗi trực tiếp
            specialStatus[statusName][attr] = this.parseValue(value);
            this.log(`[Trạng thái đặc biệt] ${statusName}.${attr} = ${specialStatus[statusName][attr]}`);
        }
    }

    /**
     * Xử lý thao tác với số
     */
    processNumber(key, value) {
        let operator = value[0];
        let restString = value.substring(1);

        // 🔧 [Sửa lỗi v3.1] Tự động sửa "= +1" thành thao tác tăng dần (increment)
        if (operator === '=' && restString.trim().startsWith('+')) {
            operator = '+';
            console.log(`[v3.1] Tự động sửa lỗi: Xem "${value}" như thao tác tăng tương đối`);
        }

        const num = parseFloat(restString);
        const current = this.getValue(key) || 0;
        let newValue;

        switch (operator) {
            case '+':
                newValue = current + num;
                break;
            case '-':
                newValue = current - num;
                break;
            case '=':
                newValue = num;
                break;
        }

        this.setValue(key, newValue);
        this.log(`[Số liệu] ${key}: ${current} → ${newValue}`);
    }

    /**
     * Thêm vật phẩm (Tự động gộp)
     */
    addItem(name, count, attrs = {}) {
        const items = this.getValue('items') || [];

        // Tìm vật phẩm giống nhau
        const existingItem = items.find(item => item.name === name);

        if (existingItem) {
            // Gộp số lượng
            existingItem.count = (existingItem.count || 1) + count;
            this.log(`[Vật phẩm] ${name}: Số lượng tăng ${count} → Tổng cộng ${existingItem.count}`);
        } else {
            // Thêm vật phẩm mới
            items.push({ name, count, ...attrs });
            this.log(`[Vật phẩm] Mới thêm ${name} x${count}`);
        }

        this.setValue('items', items);
    }

    /**
     * Xóa vật phẩm
     */
    removeItem(name, count) {
        const items = this.getValue('items') || [];
        const item = items.find(i => i.name === name);

        if (item) {
            item.count = (item.count || 1) - count;

            if (item.count <= 0) {
                // Xóa vật phẩm
                const index = items.indexOf(item);
                items.splice(index, 1);
                this.log(`[Vật phẩm] ${name} đã dùng hết, xóa`);
            } else {
                this.log(`[Vật phẩm] ${name}: Số lượng giảm ${count} → Còn lại ${item.count}`);
            }

            this.setValue('items', items);
        } else {
            this.log(`[Cảnh báo] Vật phẩm ${name} không tồn tại`);
        }
    }

    /**
     * Hàm dùng chung để nối thêm vào mảng
     * @param {string} key - Tên biến
     * @param {*} value - Giá trị
     */
    appendToArray(key, value) {
        console.log(`[v3.1] appendToArray được gọi: key="${key}", value="${value}"`);

        // Kiểm tra xem có phải là trường lịch sử của quan hệ (ví dụ: Liễu Như Yên.history)
        if (key.includes('.') && key.endsWith('.history')) {
            console.log(`[v3.1] Phát hiện trường lịch sử quan hệ, gọi processRelationshipHistory`);
            this.processRelationshipHistory(key, value);
            return;
        }

        const arr = this.getValue(key) || [];

        // Đảm bảo là mảng
        if (!Array.isArray(arr)) {
            this.log(`[Cảnh báo] ${key} không phải là mảng, không thể nối thêm`);
            return;
        }

        // Cố gắng phân tích đối tượng JSON (Dùng cho techniques/spells v.v.)
        let parsedValue = value;
        if (typeof value === 'string' && value.trim().startsWith('{')) {
            // 🔧 Dọn dẹp ngoặc kép escape do AI trả về: Thay \" thành "
            let cleanedValue = value.trim();
            if (cleanedValue.includes('\\"')) {
                cleanedValue = cleanedValue.replace(/\\"/g, '"');
                console.log(`[v3.1] 🔧 Sau khi dọn dẹp ngoặc kép escape:`, cleanedValue);
            }
            try {
                parsedValue = JSON.parse(cleanedValue);
                console.log(`[v3.1] ✅ Phân tích JSON thành công, object:`, parsedValue);
                console.log(`[v3.1] Thuộc tính của object:`, Object.keys(parsedValue));
            } catch (e) {
                console.log(`[v3.1] ❌ Phân tích JSON thất bại, giữ nguyên giá trị gốc: ${e.message}`);
                console.log(`[v3.1] Giá trị gốc:`, value);
            }
        }

        // Đẩy vào mảng (Object thì đẩy trực tiếp, Chuỗi thì kiểm tra trùng lặp)
        if (typeof parsedValue === 'object' && parsedValue !== null) {
            arr.push(parsedValue);
            this.setValue(key, arr);
            console.log(`[v3.1] ✅ Object JSON đã được thêm vào ${key}, độ dài mảng hiện tại: ${arr.length}`);
            this.log(`[Nối thêm] ${key}: Đã thêm Object JSON (name: ${parsedValue.name || 'N/A'})`);
        } else {
            // Nếu là kiểu chuỗi mới kiểm tra trùng lặp (history v.v.)
            if (!arr.includes(parsedValue)) {
                arr.push(parsedValue);
                this.setValue(key, arr);
                this.log(`[Nối thêm] ${key}: ${parsedValue.substring(0, 30)}${parsedValue.length > 30 ? '...' : ''}`);
            }
        }
    }

    /**
     * Xử lý nối thêm lịch sử quan hệ
     * Định dạng: Liễu Như Yên.history: Đoạn văn bản tương tác
     */
    processRelationshipHistory(key, value) {
        console.log(`[v3.1] Xử lý lịch sử quan hệ: ${key} = ${value}`);

        const parts = key.split('.');
        const name = parts[0];

        const relationships = this.getValue('relationships') || [];
        console.log(`[v3.1] Danh sách quan hệ hiện tại:`, relationships);

        let relationship = relationships.find(r => r.name === name);

        if (!relationship) {
            relationship = { name };
            relationships.push(relationship);
            this.setValue('relationships', relationships);
            this.log(`[Quan hệ] Tạo mối quan hệ mới: ${name}`);
            console.log(`[v3.1] Đã tạo mối quan hệ mới: ${name}`);
        }

        console.log(`[v3.1] Tìm thấy quan hệ: ${name}, lịch sử hiện tại:`, relationship.history);

        // Khởi tạo mảng lịch sử
        if (!relationship.history) {
            relationship.history = [];
            console.log(`[v3.1] Khởi tạo mảng lịch sử của ${name}`);
        }

        // Tránh trùng lặp
        if (!relationship.history.includes(value)) {
            relationship.history.push(value);
            this.log(`[Quan hệ] ${name}.history: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
            console.log(`[v3.1] Đã thêm ghi chép lịch sử: ${name}.history =`, relationship.history);
        } else {
            console.log(`[v3.1] Ghi chép lịch sử đã tồn tại, bỏ qua: ${value}`);
        }
    }

    /**
     * 🆕 Xử lý thao tác đổi tên nhân vật
     * Định dạng: >>rename: Tên cũ -> Tên mới
     * Dùng cho việc gộp bảng biến khi nhân vật để lộ tên thật (ví dụ "Trương Tam") từ bí danh (ví dụ "Huyền Y Thiếu Niên")
     */
    processRename(oldName, newName) {
        console.log(`[v3.1] 🔄 Xử lý đổi tên nhân vật: "${oldName}" -> "${newName}"`);

        const relationships = this.getValue('relationships') || [];

        // Tìm bản ghi của tên cũ
        const oldIndex = relationships.findIndex(r => r.name === oldName);

        if (oldIndex === -1) {
            console.log(`[v3.1] ⚠️ Không tìm thấy nhân vật "${oldName}", sẽ tạo nhân vật mới "${newName}"`);
            // Nếu tên cũ không tồn tại, tạo một nhân vật mới
            relationships.push({ name: newName });
            this.setValue('relationships', relationships);
            this.log(`[Đổi tên] Tạo nhân vật mới: ${newName}`);
            return;
        }

        // Kiểm tra xem tên mới đã tồn tại chưa
        const newIndex = relationships.findIndex(r => r.name === newName);

        if (newIndex !== -1 && newIndex !== oldIndex) {
            // Nếu tên mới đã tồn tại, gộp 2 bản ghi (Ưu tiên dữ liệu của tên cũ, vì là cùng một người)
            console.log(`[v3.1] ⚠️ Nhân vật "${newName}" đã tồn tại, tiến hành gộp dữ liệu`);
            const oldRecord = relationships[oldIndex];
            const newRecord = relationships[newIndex];

            // Gộp: Ghi đè dữ liệu của bản ghi cũ lên bản ghi mới (Giữ lại dữ liệu của bản ghi cũ)
            for (const key of Object.keys(oldRecord)) {
                if (key === 'name') continue; // Bỏ qua trường name
                if (key === 'history' && Array.isArray(oldRecord.history) && Array.isArray(newRecord.history)) {
                    // Gộp lịch sử (Loại bỏ trùng lặp)
                    newRecord.history = [...new Set([...newRecord.history, ...oldRecord.history])];
                } else if (oldRecord[key] !== undefined) {
                    // Các trường khác: Dùng giá trị của bản ghi cũ (Vì là dữ liệu gốc của cùng một người)
                    newRecord[key] = oldRecord[key];
                }
            }

            // Xóa bản ghi cũ
            relationships.splice(oldIndex, 1);
            this.setValue('relationships', relationships);
            this.log(`[Đổi tên] Gộp "${oldName}" vào "${newName}", xóa bản ghi cũ`);
        } else {
            // Đổi tên trực tiếp
            relationships[oldIndex].name = newName;
            this.setValue('relationships', relationships);
            this.log(`[Đổi tên] "${oldName}" -> "${newName}"`);
        }

        console.log(`[v3.1] ✅ Đổi tên nhân vật hoàn tất: "${oldName}" -> "${newName}"`);
    }

    /**
     * Thêm lịch sử
     */
    addHistory(text) {
        this.appendToArray('history', text);
    }

    /**
     * Phân tích giá trị (Loại bỏ dấu ngoặc kép, phân tích giá trị đặc biệt)
     */
    parseValue(value) {
        const trimmed = value.trim();

        // Loại bỏ dấu ngoặc kép ở đầu và cuối
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
        }

        // Phân tích giá trị đặc biệt - Giá trị boolean (Hỗ trợ viết hoa/thường)
        const lowerTrimmed = trimmed.toLowerCase();
        if (trimmed === 'null' || lowerTrimmed === 'null') return null;
        if (trimmed === 'true' || lowerTrimmed === 'true') {
            console.log('[parseValue] Phân tích giá trị boolean true:', value);
            return true;
        }
        if (trimmed === 'false' || lowerTrimmed === 'false') {
            console.log('[parseValue] Phân tích giá trị boolean false:', value);
            return false;
        }

        // Hỗ trợ định dạng =true / =false
        if (lowerTrimmed.startsWith('=true') || lowerTrimmed === '=true') {
            console.log('[parseValue] Phân tích =true:', value);
            return true;
        }
        if (lowerTrimmed.startsWith('=false') || lowerTrimmed === '=false') {
            console.log('[parseValue] Phân tích =false:', value);
            return false;
        }

        // Thử phân tích số
        if (!isNaN(trimmed) && trimmed !== '') {
            return parseFloat(trimmed);
        }

        // Trả về giá trị đã cắt bỏ khoảng trắng (thay vì giá trị gốc)
        return trimmed;
    }

    /**
     * Tách key-value
     */
    splitKeyValue(line) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        return [key, value];
    }

    /**
     * Lấy giá trị
     */
    getValue(path) {
        const parts = path.split('.');
        let current = this.gameState.variables;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Thiết lập giá trị
     */
    setValue(path, value) {
        const parts = path.split('.');
        let current = this.gameState.variables;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Ghi log
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[Lệnh biến v3.1] ${message}`);
            this.executionLog.push(message);
        }
    }

    /**
     * Lấy log thực thi
     */
    getExecutionLog() {
        return [...this.executionLog];
    }

    /**
     * Xóa log
     */
    clearLog() {
        this.executionLog = [];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariableInstructionParserV31;
}