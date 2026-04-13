/**
 * Trình quản lý sơ đồ nhân vật - Hệ thống truy xuất thông tin nhân vật dựa trên so khớp vector
 * * Tính năng:
 * 1. Trích xuất tên, tính cách, ngoại hình trong quan hệ nhân vật và lưu trữ dưới dạng vector hóa
 * 2. Truy xuất nhân vật liên quan thông qua so khớp độ tương đồng vector
 * 3. Hỗ trợ lọc theo ngưỡng, chỉ trả về các nhân vật có độ khớp cao
 * 4. Xây dựng ngữ cảnh động, thay vì tải toàn bộ vào biểu mẫu biến (variables)
 */

class CharacterGraphManager {
    constructor(config = {}) {
        this.characters = new Map(); // Lưu trữ thông tin nhân vật đầy đủ {name: characterData}
        this.vectors = new Map(); // Lưu trữ vector nhân vật {name: vector}
        this.indexedDB = null;
        this.dbName = 'CharacterGraphDB';
        this.storeName = 'characters';
        this.isInitialized = false;

        // Tham số cấu hình
        this.config = {
            nameWeight: config.nameWeight || 3, // Trọng số tên
            matchThreshold: config.matchThreshold || 0.4, // Ngưỡng khớp (Vector 384 chiều: 40%)
            maxResults: config.maxResults || 3, // Số lượng kết quả tối đa trả về
            enableDebug: config.enableDebug !== undefined ? config.enableDebug : true, // Mặc định bật nhật ký gỡ lỗi
            personalityWeight: config.personalityWeight || 1.0, // Trọng số tính cách
            appearanceWeight: config.appearanceWeight || 1.0, // Trọng số ngoại hình
            vectorDim: config.vectorDim || 384 // Số chiều vector (tương ứng với embedding API)
        };

        // Thông tin thống kê
        this.stats = {
            totalCharacters: 0,
            lastUpdate: null,
            matchCount: 0,
            avgMatchScore: 0
        };
    }

    /**
     * Khởi tạo IndexedDB
     */
    async init() {
        if (this.isInitialized) {
            return true;
        }

        try {
            console.log('[Sơ đồ nhân vật] Đang khởi tạo IndexedDB...');

            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Tạo kho lưu trữ đối tượng nhân vật
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'name' });
                        store.createIndex('addedAt', 'addedAt', { unique: false });
                        store.createIndex('lastMatchedAt', 'lastMatchedAt', { unique: false });
                        console.log('[Sơ đồ nhân vật] Đã tạo Object Store:', this.storeName);
                    }
                };
            });

            this.indexedDB = db;

            // Tải dữ liệu hiện có vào bộ nhớ
            await this.loadFromIndexedDB();

            this.isInitialized = true;
            console.log(`[Sơ đồ nhân vật] ✅ Khởi tạo hoàn tất, đã tải ${this.stats.totalCharacters} nhân vật`);
            return true;

        } catch (error) {
            console.error('[Sơ đồ nhân vật] ❌ Khởi tạo thất bại:', error);
            return false;
        }
    }

    /**
     * Tải dữ liệu từ IndexedDB
     */
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = async () => {
                const characters = request.result || [];

                // 🔧 Xử lý dữ liệu tải lên, loại bỏ trường vector cũ, tạo lại cái mới
                for (const char of characters) {
                    // Loại bỏ trường vector cũ (nếu có)
                    const { vector, ...charWithoutVector } = char;

                    // Lưu vào bộ nhớ (không bao gồm vector)
                    this.characters.set(char.name, charWithoutVector);

                    // Tạo lại vector (hoặc sử dụng vector cũ nếu tồn tại)
                    if (vector) {
                        // Dữ liệu cũ có vector, sử dụng trực tiếp
                        this.vectors.set(char.name, vector);
                    } else {
                        // Dữ liệu mới không có vector, cần tạo lại
                        try {
                            const newVector = await this.generateVector(char.name, char.personality, char.appearance);
                            this.vectors.set(char.name, newVector);
                        } catch (error) {
                            console.warn(`[Sơ đồ nhân vật] ⚠️ Không thể tạo vector cho ${char.name}:`, error);
                        }
                    }
                }

                this.stats.totalCharacters = characters.length;
                console.log(`[Sơ đồ nhân vật] Đã tải ${characters.length} nhân vật từ IndexedDB`);
                resolve();
            };

            request.onerror = () => {
                console.error('[Sơ đồ nhân vật] Tải thất bại:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Lưu một nhân vật đơn lẻ vào IndexedDB
     */
    async saveCharacter(character) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(character);

            request.onsuccess = () => {
                console.log(`[Sơ đồ nhân vật] ✅ Đã lưu nhân vật: ${character.name}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[Sơ đồ nhân vật] ❌ Lưu thất bại: ${character.name}`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Thêm hoặc cập nhật thông tin nhân vật
     * @param {Object} relationship - Thông tin nhân vật trích xuất từ relationships trong phản hồi AI
     * @param {number} turnIndex - 🆕 Chỉ số lượt hiện tại (dùng để xóa khi hồi quy/rollback)
     */
    async addOrUpdateCharacter(relationship, turnIndex = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        const { name, personality, appearance, ...otherData } = relationship;

        if (!name) {
            console.warn('[Sơ đồ nhân vật] ⚠️ Nhân vật thiếu tên, bỏ qua');
            return null;
        }

        // 🔧 Phòng vệ: Lọc bỏ các tên nhân vật không hợp lệ (tên biến hệ thống, v.v.)
        const invalidNames = ['relationships', 'items', 'history', 'attributes', 'bodyParts',
            'equipment', 'specialStatus', 'protagonist', 'undefined', 'null'];
        if (invalidNames.includes(name) || name.startsWith('relationships.')) {
            console.warn(`[Sơ đồ nhân vật] ⚠️ Phát hiện tên nhân vật không hợp lệ "${name}", bỏ qua lưu trữ`);
            return null;
        }

        // Kiểm tra xem đã tồn tại chưa
        const existing = this.characters.get(name);

        // 🆕 Tính toán chỉ số lượt hiện tại (nếu không truyền vào)
        if (turnIndex === null && window.gameState) {
            turnIndex = Math.floor((window.gameState.conversationHistory?.length || 0) / 2);
        }

        // Chuẩn bị dữ liệu nhân vật (không bao gồm vector, tránh lãng phí lưu trữ và gửi cho AI)
        const characterData = {
            name,
            personality: personality || existing?.personality || 'Chưa rõ',
            appearance: appearance || existing?.appearance || 'Chưa rõ',
            ...otherData,
            addedAt: existing?.addedAt || Date.now(),
            addedAtTurn: existing?.addedAtTurn ?? turnIndex, // 🆕 Ghi lại lượt khi thêm lần đầu
            updatedAt: Date.now(),
            lastMatchedAt: existing?.lastMatchedAt || null,
            matchCount: existing?.matchCount || 0
        };

        // Tạo vector (dựa trên tên, tính cách, ngoại hình)
        const vector = await this.generateVector(name, personality, appearance);

        // 🔧 Quan trọng: vector chỉ lưu trong this.vectors, không lưu trong characterData
        // Việc này để tránh:
        // 1. Lãng phí không gian lưu trữ IndexedDB (384 số thực dấu phẩy động)
        // 2. Lãng phí token ngữ cảnh của AI (vector vô nghĩa đối với AI)

        // Lưu vào bộ nhớ
        this.characters.set(name, characterData);
        this.vectors.set(name, vector);

        // Lưu vào IndexedDB (không bao gồm vector)
        await this.saveCharacter(characterData);

        // Cập nhật thống kê
        if (!existing) {
            this.stats.totalCharacters++;
        }
        this.stats.lastUpdate = Date.now();

        console.log(`[Sơ đồ nhân vật] ${existing ? 'Cập nhật' : 'Thêm mới'} nhân vật: ${name}`);
        return characterData;
    }

    /**
     * Tạo vector nhân vật (sử dụng embedding 384 chiều của supply.js)
     * @param {string} name - Tên nhân vật
     * @param {string} personality - Tính cách
     * @param {string} appearance - Ngoại hình
     * @returns {Array|Object} Biểu diễn vector (mảng 384 chiều hoặc đối tượng từ khóa)
     */
    async generateVector(name, personality = '', appearance = '') {
        if (!window.contextVectorManager) {
            console.error('[Sơ đồ nhân vật] contextVectorManager chưa tải, sử dụng phương án hạ cấp');
            // Hạ cấp: Trả về đối tượng từ khóa đơn giản
            const vector = {};
            vector[name] = this.config.nameWeight * 10;
            if (personality) vector[personality] = 5;
            if (appearance) vector[appearance] = 5;
            return vector;
        }

        // 🔧 Sử dụng transformer tạo vector 384 chiều, tăng cường trọng số tên
        // Lặp lại tên nhiều lần để tăng trọng số
        const nameRepeated = Array(this.config.nameWeight * 2).fill(name).join(' ');
        const text = `${nameRepeated} ${name} ${personality} ${appearance}`;

        try {
            let vector;
            if (window.contextVectorManager.embeddingMethod === 'transformers') {
                // Sử dụng vector transformer 384 chiều
                vector = await window.contextVectorManager.getEmbeddingFromTransformers(text);
                if (this.config.enableDebug) {
                    console.log(`[Sơ đồ nhân vật] Đã tạo vector: ${name}`);
                    console.log(`  Văn bản: "${text}"`);
                    console.log(`  Loại vector: Dense (384 chiều)`);
                    console.log(`  5 chiều đầu của vector: [${vector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
                }
            } else {
                // Quay lại vector từ khóa
                vector = window.contextVectorManager.createKeywordVector(text);
                if (this.config.enableDebug) {
                    const keywordList = Object.entries(vector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`[Sơ đồ nhân vật] Đã tạo vector: ${name}`);
                    console.log(`  Văn bản: "${text}"`);
                    console.log(`  Loại vector: Sparse (Từ khóa)`);
                    console.log(`  Từ khóa (Top 10): ${keywordList}`);
                }
            }

            return vector;
        } catch (error) {
            console.error(`[Sơ đồ nhân vật] Tạo vector thất bại: ${error.message}`);
            // Hạ cấp xuống phương pháp từ khóa
            return window.contextVectorManager.createKeywordVector(text);
        }
    }

    /**
     * Tính toán độ tương đồng Cosine (nhận diện thông minh loại vector)
     * @param {Array|Object} vecA - Vector A (mảng hoặc đối tượng)
     * @param {Array|Object} vecB - Vector B (mảng hoặc đối tượng)
     * @returns {number} Độ tương đồng (0-1)
     */
    cosineSimilarity(vecA, vecB) {
        if (!window.contextVectorManager) {
            console.error('[Sơ đồ nhân vật] contextVectorManager chưa tải');
            return 0;
        }

        // Nhận diện thông minh loại vector
        const isArrayA = Array.isArray(vecA);
        const isArrayB = Array.isArray(vecB);

        if (isArrayA && isArrayB) {
            // Cả hai đều là mảng, sử dụng độ tương đồng vector mảng
            return window.contextVectorManager.calculateArrayCosineSimilarity(vecA, vecB);
        } else if (!isArrayA && !isArrayB) {
            // Cả hai đều là đối tượng, sử dụng độ tương đồng vector đối tượng
            return window.contextVectorManager.calculateObjectCosineSimilarity(vecA, vecB);
        } else {
            // Loại không khớp
            console.warn('[Sơ đồ nhân vật] Loại vector không khớp, không thể tính độ tương đồng');
            return 0;
        }
    }

    /**
     * 🆕 Tìm kiếm nhân vật trực tiếp bằng vector (Phương pháp khuyên dùng)
     * @param {string} queryText - Văn bản người dùng nhập (có thể bao gồm phản hồi AI)
     * @param {string} userInputOnly - Tùy chọn, chỉ phần người dùng nhập (để phân biệt nguồn khớp)
     * @returns {Array} Danh sách nhân vật khớp, sắp xếp theo độ tương đồng
     */
    async searchByText(queryText, userInputOnly = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        // 🔧 Bước 1: Khớp tên chính xác (ưu tiên cao nhất)
        // Nếu văn bản chứa tên nhân vật rõ ràng, nên khớp trực tiếp, không phụ thuộc độ tương đồng vector
        // Nguồn khớp: Người dùng nhập HOẶC AI phản hồi
        const exactNameMatches = new Map(); // {name: 'user' | 'ai_reply' | 'both'}
        for (const [name, character] of this.characters.entries()) {
            const inUserInput = userInputOnly ? userInputOnly.includes(name) : queryText.includes(name);
            const inFullText = queryText.includes(name);

            if (inFullText) {
                let matchSource = 'unknown';
                if (userInputOnly) {
                    // Có phân biệt người dùng nhập và toàn bộ văn bản
                    if (inUserInput && inFullText) {
                        matchSource = 'both';
                    } else if (inUserInput) {
                        matchSource = 'user';
                    } else {
                        matchSource = 'ai_reply';
                    }
                } else {
                    matchSource = 'text';
                }

                exactNameMatches.set(name, matchSource);
                if (this.config.enableDebug) {
                    const sourceLabel = {
                        'user': 'Người dùng nhập',
                        'ai_reply': 'AI phản hồi',
                        'both': 'Người dùng+AI',
                        'text': 'Văn bản truy vấn',
                        'unknown': 'Văn bản'
                    }[matchSource];
                    console.log(`[Sơ đồ nhân vật] 🎯 Khớp tên chính xác: "${name}" tìm thấy trong ${sourceLabel}`);
                }
            }
        }

        // Sử dụng cùng một phương pháp với vector nhân vật để tạo vector truy vấn
        if (!window.contextVectorManager) {
            console.error('[Sơ đồ nhân vật] contextVectorManager chưa tải');
            // Nếu có khớp tên chính xác, vẫn trả về kết quả
            if (exactNameMatches.size > 0) {
                const exactResults = [];
                for (const [name, matchSource] of exactNameMatches) {
                    const character = this.characters.get(name);
                    if (character) {
                        exactResults.push({
                            ...character,
                            matchScore: 1.0, // Khớp chính xác cho điểm cao nhất
                            matchType: 'exact_name',
                            matchSource
                        });
                    }
                }
                return exactResults.slice(0, this.config.maxResults);
            }
            return [];
        }

        // 🔧 Sử dụng vector transformer 384 chiều
        let queryVector;
        try {
            if (window.contextVectorManager.embeddingMethod === 'transformers') {
                // Sử dụng vector transformer 384 chiều
                queryVector = await window.contextVectorManager.getEmbeddingFromTransformers(queryText);
                if (this.config.enableDebug) {
                    console.log(`[Sơ đồ nhân vật] Loại vector truy vấn: Dense (384 chiều)`);
                    console.log(`[Sơ đồ nhân vật] 5 chiều đầu của vector truy vấn: [${queryVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
                }
            } else {
                // Quay lại vector từ khóa
                queryVector = window.contextVectorManager.createKeywordVector(queryText);
                if (this.config.enableDebug) {
                    const keywordList = Object.entries(queryVector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`[Sơ đồ nhân vật] Loại vector truy vấn: Sparse (Từ khóa)`);
                    console.log(`[Sơ đồ nhân vật] Từ khóa truy vấn (Top 10): ${keywordList}`);
                }
            }
        } catch (error) {
            console.error(`[Sơ đồ nhân vật] Tạo vector truy vấn thất bại: ${error.message}`);
            // Hạ cấp xuống phương pháp từ khóa
            queryVector = window.contextVectorManager.createKeywordVector(queryText);
        }

        // Tính toán độ tương đồng cho tất cả nhân vật
        const matches = [];
        const allMatches = []; // 🔧 Lưu tất cả điểm khớp để gỡ lỗi

        for (const [name, character] of this.characters.entries()) {
            const vector = this.vectors.get(name);

            if (!vector) {
                console.warn(`[Sơ đồ nhân vật] ⚠️ Nhân vật ${name} không có vector, bỏ qua so khớp`);
                continue;
            }

            // 🔧 Gỡ lỗi tính toán vector
            if (this.config.enableDebug && name === 'Tiểu Thúy') {
                console.log(`[Gỡ lỗi sơ đồ nhân vật] 🎯 Kiểm tra tính toán vector cho Tiểu Thúy:`);
                const queryIsArray = Array.isArray(queryVector);
                const vectorIsArray = Array.isArray(vector);
                console.log(`  Loại vector truy vấn:`, queryIsArray ? `Dense (${queryVector.length} chiều)` : `Sparse (${Object.keys(queryVector).length} từ khóa)`);
                console.log(`  Loại vector Tiểu Thúy:`, vectorIsArray ? `Dense (${vector.length} chiều)` : `Sparse (${Object.keys(vector).length} từ khóa)`);
                if (queryIsArray) {
                    console.log(`  5 chiều đầu vector truy vấn:`, queryVector.slice(0, 5).map(v => v.toFixed(3)));
                }
                if (vectorIsArray) {
                    console.log(`  5 chiều đầu vector Tiểu Thúy:`, vector.slice(0, 5).map(v => v.toFixed(3)));
                }
            }

            const similarity = this.cosineSimilarity(queryVector, vector);

            // 🔧 Gỡ lỗi kết quả độ tương đồng
            if (this.config.enableDebug && name === 'Tiểu Thúy') {
                console.log(`[Gỡ lỗi sơ đồ nhân vật] 📊 Kết quả độ tương đồng Tiểu Thúy: ${similarity}`);
                if (similarity === 0) {
                    console.log(`[Gỡ lỗi sơ đồ nhân vật] ❌ Độ tương đồng bằng 0, lý do có thể:`);
                    console.log(`  1. contextVectorManager chưa tải:`, !window.contextVectorManager);
                    console.log(`  2. Vector truy vấn trống:`, Object.keys(queryVector || {}).length === 0);
                    console.log(`  3. Vector Tiểu Thúy trống:`, Object.keys(vector || {}).length === 0);
                }
            }

            // 🔧 Kiểm tra xem có khớp tên chính xác không
            const isExactNameMatch = exactNameMatches.has(name);
            const matchSource = exactNameMatches.get(name); // 'user' | 'ai_reply' | 'both' | undefined

            // Lưu tất cả kết quả khớp (để gỡ lỗi)
            allMatches.push({
                name,
                matchScore: similarity,
                character,
                isExactNameMatch,
                matchSource
            });

            // 🔧 Sửa đổi logic khớp: Khớp tên chính xác HOẶC độ tương đồng vector đạt ngưỡng
            if (isExactNameMatch || similarity >= this.config.matchThreshold) {
                // Khi khớp tên chính xác, ít nhất cho điểm đạt ngưỡng để đảm bảo không bị lọc mất
                const finalScore = isExactNameMatch ? Math.max(similarity, this.config.matchThreshold + 0.1) : similarity;
                matches.push({
                    ...character,  // Bao gồm dữ liệu relationship đầy đủ (kèm history), không bao gồm vector
                    matchScore: finalScore,
                    matchType: isExactNameMatch ? 'exact_name' : 'vector',
                    matchSource: matchSource || null
                });
            }
        }

        // Sắp xếp theo độ tương đồng (giảm dần)
        matches.sort((a, b) => b.matchScore - a.matchScore);
        allMatches.sort((a, b) => b.matchScore - a.matchScore);

        // Giới hạn số lượng trả về
        const results = matches.slice(0, this.config.maxResults);

        // Cập nhật thống kê và thời gian khớp cuối cùng
        results.forEach(char => {
            const original = this.characters.get(char.name);
            if (original) {
                original.lastMatchedAt = Date.now();
                original.matchCount = (original.matchCount || 0) + 1;
                this.saveCharacter(original);
            }
        });

        // Cập nhật thống kê chung
        if (results.length > 0) {
            this.stats.matchCount++;
            const avgScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
            this.stats.avgMatchScore = (this.stats.avgMatchScore * (this.stats.matchCount - 1) + avgScore) / this.stats.matchCount;
        }

        if (this.config.enableDebug) {
            console.log(`[Sơ đồ nhân vật] 🔍 Truy vấn: "${queryText.substring(0, 50)}..."`);
            console.log(`[Sơ đồ nhân vật] Có tổng cộng ${this.characters.size} nhân vật trong sơ đồ`);
            console.log(`[Sơ đồ nhân vật] Ngưỡng khớp: ${(this.config.matchThreshold * 100).toFixed(0)}%`);

            // Hiển thị chi tiết khớp tên chính xác
            if (exactNameMatches.size > 0) {
                const matchDetails = Array.from(exactNameMatches.entries())
                    .map(([name, source]) => {
                        const sourceLabel = {
                            'user': '👤Người dùng nhập',
                            'ai_reply': '🤖AI phản hồi',
                            'both': '👤+🤖',
                            'text': '📝Văn bản'
                        }[source] || source;
                        return `${name}(${sourceLabel})`;
                    }).join(', ');
                console.log(`[Sơ đồ nhân vật] Khớp tên chính xác: ${matchDetails}`);
            } else {
                console.log(`[Sơ đồ nhân vật] Khớp tên chính xác: Không có`);
            }

            console.log(`[Sơ đồ nhân vật] Tìm thấy ${results.length} kết quả khớp:`);
            results.forEach((r, i) => {
                const matchTypeIcon = r.matchType === 'exact_name' ? '🎯' : '📊';
                const sourceInfo = r.matchSource ? ` [Nguồn: ${r.matchSource}]` : '';
                console.log(`  ${i + 1}. ${r.name} ${matchTypeIcon} (Độ tương đồng: ${(r.matchScore * 100).toFixed(1)}%, Loại: ${r.matchType || 'vector'}${sourceInfo})`);
            });

            // 🔧 Hiển thị điểm khớp của tất cả nhân vật (ngay cả khi không đạt ngưỡng)
            if (allMatches.length > 0) {
                console.log(`[Sơ đồ nhân vật] Điểm khớp của tất cả nhân vật:`);
                allMatches.forEach((r, i) => {
                    const isMatched = r.isExactNameMatch || r.matchScore >= this.config.matchThreshold;
                    const status = isMatched ? '✅' : '❌';
                    const sourceLabel = r.matchSource ? {
                        'user': '👤',
                        'ai_reply': '🤖',
                        'both': '👤+🤖',
                        'text': '📝'
                    }[r.matchSource] || '' : '';
                    const matchInfo = r.isExactNameMatch ? `, Khớp chính xác ${sourceLabel}` : '';
                    console.log(`  ${i + 1}. ${r.name} ${status} (Tương đồng vector: ${(r.matchScore * 100).toFixed(1)}%${matchInfo})`);
                });
            } else {
                console.log(`[Sơ đồ nhân vật] ❌ Không có điểm khớp nào (có thể do lỗi tính toán vector)`);
            }
        }

        return results;
    }

    /**
     * Tìm kiếm nhân vật khớp (tương thích phương pháp cũ)
     * @param {string} queryName - Tên truy vấn
     * @param {string} queryPersonality - Tính cách truy vấn
     * @param {string} queryAppearance - Ngoại hình truy vấn
     * @returns {Array} Danh sách nhân vật khớp, sắp xếp theo độ tương đồng
     */
    async searchCharacters(queryName, queryPersonality = '', queryAppearance = '') {
        // Nếu chỉ có queryName, sử dụng phương pháp searchByText mới
        if (queryName && !queryPersonality && !queryAppearance) {
            return await this.searchByText(queryName);
        }

        // Ngược lại sử dụng so khớp 3 tham số ban đầu
        if (!this.isInitialized) {
            await this.init();
        }

        // Tạo vector truy vấn
        const queryVector = await this.generateVector(queryName, queryPersonality, queryAppearance);

        // Tính toán độ tương đồng cho tất cả nhân vật
        const matches = [];

        for (const [name, vector] of this.vectors.entries()) {
            const similarity = this.cosineSimilarity(queryVector, vector);

            // Lọc các kết quả dưới ngưỡng
            if (similarity >= this.config.matchThreshold) {
                const character = this.characters.get(name);
                matches.push({
                    ...character,  // Bao gồm dữ liệu relationship đầy đủ (kèm history), không bao gồm vector
                    matchScore: similarity
                });
            }
        }

        // Sắp xếp theo độ tương đồng (giảm dần)
        matches.sort((a, b) => b.matchScore - a.matchScore);

        // Giới hạn số lượng trả về
        const results = matches.slice(0, this.config.maxResults);

        // Cập nhật thống kê
        if (results.length > 0) {
            this.stats.matchCount++;
            const avgScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
            this.stats.avgMatchScore = (this.stats.avgMatchScore * (this.stats.matchCount - 1) + avgScore) / this.stats.matchCount;
        }

        if (this.config.enableDebug) {
            console.log(`[Sơ đồ nhân vật] 🔍 Truy vấn: ${queryName} | Tìm thấy ${results.length} kết quả khớp`);
            results.forEach((r, i) => {
                console.log(`  ${i + 1}. ${r.name} (Độ tương đồng: ${(r.matchScore * 100).toFixed(1)}%)`);
            });
        }

        return results;
    }

    /**
     * Lấy thông tin đầy đủ của nhân vật
     */
    getCharacter(name) {
        return this.characters.get(name);
    }

    /**
     * Xóa nhân vật
     */
    async deleteCharacter(name) {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(name);

            request.onsuccess = () => {
                this.characters.delete(name);
                this.vectors.delete(name);
                this.stats.totalCharacters--;
                console.log(`[Sơ đồ nhân vật] 🗑️ Đã xóa nhân vật: ${name}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[Sơ đồ nhân vật] ❌ Xóa thất bại: ${name}`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 🆕 Xóa nhân vật theo phạm vi lượt (dùng cho hồi quy tin nhắn)
     * @param {number} turnStart - Lượt bắt đầu (bao gồm)
     * @param {number} turnEnd - Lượt kết thúc (bao gồm)
     * @returns {Array} Danh sách tên các nhân vật bị xóa
     */
    async deleteCharactersByTurnRange(turnStart, turnEnd) {
        if (!this.isInitialized) {
            await this.init();
        }

        const deletedNames = [];

        // Tìm các nhân vật được thêm lần đầu trong phạm vi lượt chỉ định
        for (const [name, char] of this.characters.entries()) {
            const addedAtTurn = char.addedAtTurn;

            // Chỉ xóa nhân vật lần đầu thêm vào trong phạm vi lượt chỉ định
            if (addedAtTurn !== undefined && addedAtTurn >= turnStart && addedAtTurn <= turnEnd) {
                try {
                    await this.deleteCharacter(name);
                    deletedNames.push(name);
                } catch (error) {
                    console.error(`[Sơ đồ nhân vật] Xóa hồi quy thất bại: ${name}`, error);
                }
            }
        }

        if (deletedNames.length > 0) {
            console.log(`[Sơ đồ nhân vật] 🔄 Đã xóa hồi quy ${deletedNames.length} nhân vật (Lượt ${turnStart}-${turnEnd}):`, deletedNames);
        }

        return deletedNames;
    }

    /**
     * Xóa tất cả nhân vật
     */
    async clearAll() {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                this.characters.clear();
                this.vectors.clear();
                this.stats.totalCharacters = 0;
                console.log('[Sơ đồ nhân vật] 🗑️ Đã xóa sạch tất cả nhân vật');
                resolve();
            };

            request.onerror = () => {
                console.error('[Sơ đồ nhân vật] ❌ Xóa sạch thất bại:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Thêm nhân vật hàng loạt (di chuyển từ relationships hiện có)
     */
    async batchAddCharacters(relationships) {
        if (!this.isInitialized) {
            await this.init();
        }

        console.log(`[Sơ đồ nhân vật] 📥 Đang thêm hàng loạt ${relationships.length} nhân vật...`);

        const results = [];
        for (const rel of relationships) {
            try {
                const result = await this.addOrUpdateCharacter(rel);
                results.push(result);
            } catch (error) {
                console.error(`[Sơ đồ nhân vật] Thêm thất bại: ${rel.name}`, error);
            }
        }

        console.log(`[Sơ đồ nhân vật] ✅ Thêm hàng loạt hoàn tất: ${results.length}/${relationships.length}`);
        return results;
    }

    /**
     * 🔧 Gỡ lỗi: Xem vector của tất cả nhân vật
     */
    debugShowAllVectors() {
        console.log('╔════════════════════════════════════════════════╗');
        console.log('║  🎭 Gỡ lỗi Vector Sơ đồ nhân vật               ║');
        console.log('╠════════════════════════════════════════════════╣');

        this.characters.forEach((character, name) => {
            const vector = this.vectors.get(name);
            console.log(`║  👤 ${name}:`);
            console.log(`║     Dữ liệu nhân vật: ${JSON.stringify(character, null, 6).substring(0, 100)}...`);

            if (vector) {
                if (Array.isArray(vector)) {
                    // Vector dày đặc (mảng)
                    console.log(`║     Loại vector: Dense (${vector.length} chiều)`);
                    console.log(`║     8 chiều đầu của vector: [${vector.slice(0, 8).map(v => v.toFixed(3)).join(', ')}]`);
                } else {
                    // Vector thưa thớt (đối tượng)
                    const keywordList = Object.entries(vector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`║     Loại vector: Sparse (Từ khóa)`);
                    console.log(`║     Từ khóa (Top 8): ${keywordList}`);
                    console.log(`║     Tổng số từ khóa: ${Object.keys(vector).length}`);
                }
            } else {
                console.log(`║     ❌ Vector trống!`);
            }
            console.log('║');
        });

        console.log(`╚════════════════════════════════════════════════╝`);
        console.log(`Tổng cộng: ${this.characters.size} nhân vật`);
    }

    /**
     * Lấy thông tin thống kê
     */
    getStats() {
        return {
            ...this.stats,
            config: this.config
        };
    }

    /**
     * Cập nhật cấu hình
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[Sơ đồ nhân vật] Cấu hình đã cập nhật:', this.config);
    }

    /**
     * Xuất toàn bộ dữ liệu nhân vật
     */
    exportData() {
        const characters = Array.from(this.characters.values());
        return {
            characters,
            stats: this.stats,
            config: this.config,
            exportedAt: Date.now()
        };
    }

    /**
     * Nhập dữ liệu nhân vật
     */
    async importData(data) {
        if (!this.isInitialized) {
            await this.init();
        }

        console.log(`[Sơ đồ nhân vật] 📥 Đang nhập ${data.characters.length} nhân vật...`);

        for (const char of data.characters) {
            await this.addOrUpdateCharacter(char);
        }

        if (data.config) {
            this.updateConfig(data.config);
        }

        console.log('[Sơ đồ nhân vật] ✅ Nhập hoàn tất');
    }
}

// Tạo thực thể toàn cục
if (typeof window !== 'undefined') {
    window.characterGraphManager = new CharacterGraphManager();
    console.log('[Sơ đồ nhân vật] Thực thể toàn cục đã được tạo: window.characterGraphManager');
}
