/**
 * Module hệ thống cốt lõi của trò chơi
 * Bao gồm: Lưu trữ dữ liệu lâu dài, quản lý lưu trữ (save), tương tác AI, cài đặt trò chơi, v.v.
 * Trích xuất từ các module chức năng cốt lõi trong game.html
 */

// ==================== Khai báo biến toàn cục ====================
// Những biến này đã được định nghĩa trong game.html, ở đây chỉ khai báo
// window.gameState
// window.apiConfig
// window.extraApiConfig
// window.contextVectorManager

// ==================== Cấu hình cơ sở dữ liệu IndexedDB ====================
// Sử dụng tên cơ sở dữ liệu khác nhau dựa trên cấu hình trò chơi
// game-bhz.html sử dụng BHZ_CONFIG, game.html sử dụng GAME_CONFIG
const gameConfig = window.BHZ_CONFIG || window.GAME_CONFIG || {};
const DB_NAME = gameConfig.DB_NAME ? gameConfig.DB_NAME.replace('_dlc_db', '_game_db') : 'xiuxian_game_db';
const DB_VERSION = 2;
const STORE_NAME = 'game_saves';
const AUTO_SAVE_NAME = 'game_history';
let db = null;
console.log('[GameCore] Sử dụng cơ sở dữ liệu:', DB_NAME);

// ==================== Hệ thống lưu trữ dữ liệu lâu dài ====================

/**
 * 📱 Lấy dữ liệu trò chuyện điện thoại (dùng để lưu trữ)
 */
function getMobileChatDataForSave() {
    // Thử lấy từ iframe (cần try-catch riêng vì kiểm tra chéo tên miền sẽ quăng ngoại lệ)
    try {
        const mobileFrame = document.getElementById('mobileFrame');
        if (mobileFrame && mobileFrame.contentWindow) {
            // try-catch riêng cho truy cập chéo tên miền (cross-origin)
            try {
                const getMobileSaveData = mobileFrame.contentWindow.getMobileSaveData;
                if (typeof getMobileSaveData === 'function') {
                    return getMobileSaveData();
                }
            } catch (crossOriginError) {
                // Lỗi chéo tên miền, lặng lẽ bỏ qua, thử dùng localStorage
            }
        }
    } catch (e) {
        // iframe không tồn tại hoặc lỗi khác
    }

    // Thử lấy từ localStorage
    try {
        const saved = localStorage.getItem('mobileChatData');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('[Lưu trữ] Lấy dữ liệu trò chuyện điện thoại từ localStorage thất bại:', e);
    }
    return null;
}

/**
 * 📱 Phục hồi dữ liệu trò chuyện điện thoại (tải từ bản lưu)
 * @param {Object|null} data - Dữ liệu trò chuyện điện thoại, nếu trống thì xóa dữ liệu hiện có
 */
function restoreMobileChatData(data) {
    try {
        if (!data) {
            // Nếu bản lưu không có dữ liệu điện thoại, xóa trò chuyện điện thoại hiện có
            clearMobileChatData();
            return;
        }

        // Lưu vào localStorage (để iframe tải)
        localStorage.setItem('mobileChatData', JSON.stringify(data));

        // Thử thông báo trực tiếp cho iframe (try-catch riêng xử lý chéo tên miền)
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                const loadMobileSaveData = mobileFrame.contentWindow.loadMobileSaveData;
                if (typeof loadMobileSaveData === 'function') {
                    loadMobileSaveData(data);
                }
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua, dữ liệu đã được lưu vào localStorage
        }
        console.log('[Lưu trữ] Dữ liệu trò chuyện điện thoại đã được phục hồi');
    } catch (e) {
        console.warn('[Lưu trữ] Phục hồi dữ liệu trò chuyện điện thoại thất bại:', e);
    }
}

/**
 * 📱 Lấy nhật ký trò chuyện riêng của nhân vật chỉ định (dùng cho liên kết Sơ đồ nhân vật của API chính)
 * @param {string} characterName - Tên nhân vật
 * @param {number} limit - Giới hạn số lượng tin nhắn tối đa
 * @returns {Array} - Mảng nhật ký trò chuyện riêng
 */
function getMobileChatHistoryForCharacter(characterName, limit = 50) {
    try {
        // Lấy dữ liệu trò chuyện điện thoại
        let mobileChatData = null;

        // Thử lấy từ iframe (try-catch riêng xử lý chéo tên miền)
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                const getMobileSaveData = mobileFrame.contentWindow.getMobileSaveData;
                if (typeof getMobileSaveData === 'function') {
                    mobileChatData = getMobileSaveData();
                }
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua
        }

        // Nếu lấy từ iframe thất bại, thử localStorage
        if (!mobileChatData) {
            const saved = localStorage.getItem('mobileChatData');
            if (saved) mobileChatData = JSON.parse(saved);
        }

        if (!mobileChatData || !mobileChatData.chatStorage) {
            return [];
        }

        // Tìm kiếm nhật ký trò chuyện khớp
        const chatStorage = mobileChatData.chatStorage;
        for (const chatId of Object.keys(chatStorage)) {
            const chat = chatStorage[chatId];
            // Kiểm tra tên trò chuyện có chứa tên nhân vật không (khớp mờ)
            if (chat.info && chat.info.name && chat.info.type === 'private') {
                const chatName = chat.info.name;
                // Khớp mờ: tên trò chuyện chứa tên nhân vật, hoặc tên nhân vật chứa tên trò chuyện
                if (chatName.includes(characterName) || characterName.includes(chatName)) {
                    const messages = chat.messages || [];
                    // Lấy limit tin nhắn gần nhất
                    const recentMsgs = messages.slice(-limit);
                    console.log(`[📱Liên kết chat riêng] Tìm thấy nhật ký chat riêng của ${chatName}: ${recentMsgs.length} tin`);
                    return recentMsgs.map(msg => ({
                        direction: msg.direction,
                        content: msg.content,
                        sender: msg.sender?.name || (msg.direction === 'outgoing' ? 'Tôi' : chatName),
                        timestamp: msg.timestamp
                    }));
                }
            }
        }

        return [];
    } catch (e) {
        console.warn('[📱Liên kết chat riêng] Lấy nhật ký chat riêng thất bại:', e);
        return [];
    }
}

/**
 * 📱 Lấy các nhật ký trò chuyện điện thoại hoạt động gần đây (dùng cho chế độ Điều phối ký ức)
 * @param {number} chatCount - Số lượng cuộc trò chuyện cần lấy (mặc định 3)
 * @param {number} messageLimit - Mỗi cuộc trò chuyện lấy bao nhiêu tin nhắn (mặc định 50)
 * @returns {Array} - Mảng các cuộc trò chuyện hoạt động gần đây, sắp xếp theo thời gian tin nhắn cuối
 */
function getRecentActiveMobileChats(chatCount = 3, messageLimit = 50) {
    try {
        // Lấy dữ liệu trò chuyện điện thoại
        let mobileChatData = null;

        // Thử lấy từ iframe
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                const getMobileSaveData = mobileFrame.contentWindow.getMobileSaveData;
                if (typeof getMobileSaveData === 'function') {
                    mobileChatData = getMobileSaveData();
                }
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua
        }

        // Nếu lấy từ iframe thất bại, thử localStorage
        if (!mobileChatData) {
            const saved = localStorage.getItem('mobileChatData');
            if (saved) mobileChatData = JSON.parse(saved);
        }

        if (!mobileChatData || !mobileChatData.chatStorage) {
            console.log('[📱Chat gần đây] Không có dữ liệu trò chuyện điện thoại');
            return [];
        }

        const chatStorage = mobileChatData.chatStorage;
        const chatList = [];

        // Duyệt qua tất cả cuộc trò chuyện, trích xuất thông tin và thời gian tin nhắn cuối
        for (const chatId of Object.keys(chatStorage)) {
            const chat = chatStorage[chatId];
            const messages = chat.messages || [];

            if (messages.length === 0) continue;

            // Lấy dấu thời gian của tin nhắn cuối cùng
            const lastMessage = messages[messages.length - 1];
            const lastTimestamp = lastMessage.timestamp || 0;

            chatList.push({
                chatId: chatId,
                name: chat.info?.name || 'Trò chuyện không tên',
                type: chat.info?.type || 'private',
                lastTimestamp: lastTimestamp,
                messageCount: messages.length,
                messages: messages
            });
        }

        // Sắp xếp theo thời gian tin nhắn cuối (gần nhất ở trên đầu)
        chatList.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

        // Lấy chatCount cuộc trò chuyện đầu tiên
        const recentChats = chatList.slice(0, chatCount);

        // Xây dựng kết quả trả về
        const result = recentChats.map(chat => {
            // Lấy messageLimit tin nhắn gần nhất
            const recentMessages = chat.messages.slice(-messageLimit);

            return {
                chatId: chat.chatId,
                name: chat.name,
                type: chat.type,  // 'private' hoặc 'group'
                messageCount: recentMessages.length,
                totalMessages: chat.messageCount,
                messages: recentMessages.map(msg => ({
                    direction: msg.direction,
                    content: msg.content,
                    sender: msg.sender?.name || (msg.direction === 'outgoing' ? 'Tôi' : chat.name),
                    timestamp: msg.timestamp
                }))
            };
        });

        console.log(`[📱Chat gần đây] Đã lấy được ${result.length} cuộc trò chuyện hoạt động gần đây: ${result.map(c => c.name).join(', ')}`);
        return result;

    } catch (e) {
        console.warn('[📱Chat gần đây] Lấy nhật ký trò chuyện gần đây thất bại:', e);
        return [];
    }
}

// Công khai ra toàn cục
window.getRecentActiveMobileChats = getRecentActiveMobileChats;

/**
 * 🃏 Lấy dữ liệu hệ thống thẻ bài ACJT (dùng để lưu trữ)
 */
function getACJTDataForSave() {
    try {
        const data = {};

        // Lưu bộ bài (lưu dữ liệu thẻ bài đầy đủ, bao gồm trạng thái nâng cấp)
        if (typeof CardDeckManager !== 'undefined' && CardDeckManager.deck) {
            data.deck = CardDeckManager.getDeckData ? CardDeckManager.getDeckData() : CardDeckManager.deck.map(card => ({
                id: card.id,
                name: card.name,
                type: card.type,
                value: card.value,
                cost: card.cost,
                description: card.description,
                upgraded: card.upgraded || false
            }));
        }

        // Lưu trạng thái người chơi
        if (typeof PlayerState !== 'undefined') {
            data.playerState = {
                professionId: PlayerState.profession?.id,
                name: PlayerState.name,
                hp: PlayerState.hp,
                maxHp: PlayerState.maxHp,
                gold: PlayerState.gold,
                energy: PlayerState.energy,
                baseArmor: PlayerState.baseArmor,
                attack: PlayerState.attack,
                defense: PlayerState.defense,
                corruption: PlayerState.corruption,
                relics: PlayerState.relics ? [...PlayerState.relics] : [],
                floor: PlayerState.floor || 0
            };
        }

        // Lưu trạng thái đặc biệt
        if (typeof SpecialStatusManager !== 'undefined') {
            data.specialStatuses = { ...SpecialStatusManager.statuses };
        }

        // Lưu tầng hiện tại
        if (typeof ACJTGame !== 'undefined') {
            data.currentFloor = ACJTGame.currentFloor;
            data.isGameStarted = ACJTGame.isGameStarted;

            // 🔧 Lưu dữ liệu tạo nhân vật (bao gồm trạng thái đặc biệt ban đầu, thuộc tính cơ thể, v.v.)
            if (ACJTGame.charData) {
                data.charData = JSON.parse(JSON.stringify(ACJTGame.charData));
            }
        }

        console.log('[Lưu trữ] Dữ liệu ACJT đã được thu thập:', Object.keys(data));
        return data;
    } catch (e) {
        console.warn('[Lưu trữ] Lấy dữ liệu ACJT thất bại:', e);
        return null;
    }
}

/**
 * 🃏 Phục hồi dữ liệu hệ thống thẻ bài ACJT (tải từ bản lưu)
 */
function restoreACJTData(data) {
    if (!data) return;

    try {
        // Phục hồi bộ bài
        if (data.deck && typeof CardDeckManager !== 'undefined') {
            // Hỗ trợ định dạng mới (đối tượng thẻ bài đầy đủ) và định dạng cũ (chỉ có ID)
            if (data.deck.length > 0 && typeof data.deck[0] === 'object') {
                // Định dạng mới: đối tượng thẻ bài đầy đủ
                CardDeckManager.deck = data.deck.filter(c => c && c.id);
            } else if (typeof CardLibrary !== 'undefined') {
                // Định dạng cũ: chỉ có ID, tìm kiếm từ CardLibrary
                CardDeckManager.deck = data.deck.map(cardId => {
                    const card = CardLibrary.find(c => c.id === cardId);
                    return card ? { ...card } : null;
                }).filter(c => c);
            }

            // Cập nhật hiển thị
            if (CardDeckManager.renderDeck) {
                CardDeckManager.renderDeck();
            }
            console.log('[Lưu trữ] Bộ bài đã được phục hồi:', CardDeckManager.deck.length, 'thẻ');
        }

        // Phục hồi trạng thái người chơi
        if (data.playerState && typeof PlayerState !== 'undefined') {
            const ps = data.playerState;
            if (ps.professionId && typeof ProfessionConfig !== 'undefined') {
                PlayerState.profession = ProfessionConfig[ps.professionId];
            }
            // 🔧 Ưu tiên sử dụng gameState.variables.name của trò chơi chính (đảm bảo tên hai hệ thống đồng bộ)
            const mainGameName = (typeof gameState !== 'undefined' && gameState.variables?.name) ? gameState.variables.name : null;
            PlayerState.name = mainGameName || ps.name || 'Người lữ hành';

            // 🔧 Đồng bộ cấu hình nghề nghiệp dựa trên gameState.variables.job (tên nghề nghiệp) của trò chơi chính
            if (typeof gameState !== 'undefined' && gameState.variables?.job && typeof ProfessionConfig !== 'undefined') {
                const jobName = gameState.variables.job;
                for (const key in ProfessionConfig) {
                    if (ProfessionConfig[key].name === jobName) {
                        PlayerState.profession = ProfessionConfig[key];
                        console.log('[Lưu trữ] Nghề nghiệp đã đồng bộ từ trò chơi chính:', jobName, '→', key);
                        break;
                    }
                }
            }

            PlayerState.hp = ps.hp || 70;
            PlayerState.maxHp = ps.maxHp || 70;
            PlayerState.gold = ps.gold || 100;
            PlayerState.energy = ps.energy || 3;
            PlayerState.baseArmor = ps.baseArmor || 0;
            PlayerState.attack = ps.attack || 0;
            PlayerState.defense = ps.defense || 0;
            PlayerState.corruption = ps.corruption || 0;
            PlayerState.floor = ps.floor || 0;

            // Phục hồi thánh di vật (relics là mảng chuỗi ID)
            if (ps.relics) {
                PlayerState.relics = [...ps.relics];
            }

            PlayerState.updateDisplay();
            console.log('[Lưu trữ] Trạng thái người chơi đã được phục hồi, tên:', PlayerState.name, 'nghề nghiệp:', PlayerState.profession?.name);
        }

        // Phục hồi trạng thái đặc biệt
        if (data.specialStatuses && typeof SpecialStatusManager !== 'undefined') {
            SpecialStatusManager.statuses = { ...data.specialStatuses };
            SpecialStatusManager.updateDisplay();
            console.log('[Lưu trữ] Trạng thái đặc biệt đã được phục hồi');
        }

        // Phục hồi số tầng và dữ liệu tạo nhân vật
        if (typeof ACJTGame !== 'undefined') {
            if (data.currentFloor !== undefined) {
                ACJTGame.currentFloor = data.currentFloor;
            }
            if (data.isGameStarted !== undefined) {
                ACJTGame.isGameStarted = data.isGameStarted;
            }

            // 🔧 Phục hồi dữ liệu tạo nhân vật (bao gồm trạng thái đặc biệt ban đầu, thuộc tính cơ thể, v.v.)
            if (data.charData) {
                ACJTGame.charData = JSON.parse(JSON.stringify(data.charData));
                console.log('[Lưu trữ] Dữ liệu tạo nhân vật đã được phục hồi:', Object.keys(ACJTGame.charData));
            }
        }

        console.log('[Lưu trữ] Phục hồi dữ liệu ACJT hoàn tất');
    } catch (e) {
        console.warn('[Lưu trữ] Phục hồi dữ liệu ACJT thất bại:', e);
    }
}

/**
 * Khởi tạo IndexedDB
 */
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            console.error('Mở IndexedDB thất bại:', request.error);
            reject(request.error);
        };
        request.onsuccess = () => {
            db = request.result;
            console.log('Mở IndexedDB thành công');
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (db.objectStoreNames.contains('game_history')) {
                db.deleteObjectStore('game_history');
            }
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('saveName', 'saveName', { unique: false });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('Tạo IndexedDB object store thành công');
            }
        };
    });
}

async function saveGameHistory() {
    return await saveGameToSlot(AUTO_SAVE_NAME);
}

async function saveGameToSlot(saveName, saveData = null) {
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            console.error('Không thể khởi tạo cơ sở dữ liệu:', error);
            return;
        }
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 🔧 Hỗ trợ truyền trực tiếp dữ liệu bản lưu (dùng cho nhập bản sao lưu)
        const gameData = saveData ? {
            ...saveData,
            saveName: saveName,
            timestamp: saveData.timestamp || Date.now()
        } : {
            saveName: saveName,
            timestamp: Date.now(),
            variables: JSON.parse(JSON.stringify(gameState.variables)),
            conversationHistory: JSON.parse(JSON.stringify(gameState.conversationHistory)),
            variableSnapshots: JSON.parse(JSON.stringify(gameState.variableSnapshots)),
            isGameStarted: gameState.isGameStarted,
            characterInfo: gameState.characterInfo,
            vectorEmbeddings: window.contextVectorManager ?
                JSON.parse(JSON.stringify(window.contextVectorManager.conversationEmbeddings)) : [],
            // 🆕 Lưu kho vector history
            historyEmbeddings: window.contextVectorManager ?
                JSON.parse(JSON.stringify(window.contextVectorManager.historyEmbeddings)) : [],
            // 🆕 Lưu dữ liệu ma trận
            matrixData: window.matrixManager ? window.matrixManager.export() : null,
            // 🆕 Lưu dữ liệu Sơ đồ nhân vật
            characterGraphData: window.characterGraphManager ? {
                characters: Array.from(window.characterGraphManager.characters.entries()),
                stats: window.characterGraphManager.stats
            } : null,
            // 📱 Lưu dữ liệu trò chuyện điện thoại
            mobileChatData: getMobileChatDataForSave(),
            // 📰 Lưu dữ liệu diễn đàn điện thoại
            mobileForumData: getMobileForumDataForSave(),
            dynamicWorld: JSON.parse(JSON.stringify(gameState.dynamicWorld)),
            // 🃏 Lưu dữ liệu hệ thống thẻ bài ACJT
            acjtData: getACJTDataForSave(),
            // 🆕 Lưu trạng thái công tắc biến không đồng bộ
            asyncVariableEnabled: window.asyncVariableEnabled || false,
            // 📚 Lưu dữ liệu bản lưu quy hoạch cốt truyện
            plotArchiveData: window.plotArchiveManager ? window.plotArchiveManager.exportArchive() : null,
            // 🧠 Lưu dữ liệu mạng ngữ nghĩa GraphRAG
            graphRAGData: window.graphRAGLite ? window.graphRAGLite.exportData() : null
        };
        const index = store.index('saveName');
        const getRequest = index.get(saveName);
        getRequest.onsuccess = () => {
            const existingSave = getRequest.result;
            if (existingSave) {
                gameData.id = existingSave.id;
                const updateRequest = store.put(gameData);
                updateRequest.onsuccess = () => {
                    console.log('Bản lưu đã được cập nhật:', saveName);
                    resolve();
                };
                updateRequest.onerror = () => {
                    console.error('Cập nhật bản lưu thất bại:', updateRequest.error);
                    reject(updateRequest.error);
                };
            } else {
                const addRequest = store.add(gameData);
                addRequest.onsuccess = () => {
                    console.log('Bản lưu mới đã được lưu:', saveName);
                    resolve();
                };
                addRequest.onerror = () => {
                    console.error('Lưu bản lưu thất bại:', addRequest.error);
                    reject(addRequest.error);
                };
            }
        };
        getRequest.onerror = () => {
            console.error('Truy vấn bản lưu thất bại:', getRequest.error);
            reject(getRequest.error);
        };
    });
}

async function loadGameHistory() {
    return await loadGameFromSlot(AUTO_SAVE_NAME);
}

async function loadGameFromSlot(saveName) {
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            console.error('Không thể khởi tạo cơ sở dữ liệu:', error);
            return null;
        }
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('saveName');
        const request = index.get(saveName);
        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                console.log('Tải bản lưu từ IndexedDB:', saveName);
                resolve(data);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => {
            console.error('Tải bản lưu thất bại:', request.error);
            reject(request.error);
        };
    });
}

async function getAllSaves() {
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            console.error('Không thể khởi tạo cơ sở dữ liệu:', error);
            return [];
        }
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const saves = request.result.filter(save => save.saveName !== AUTO_SAVE_NAME);
            resolve(saves);
        };
        request.onerror = () => {
            console.error('Lấy danh sách bản lưu thất bại:', request.error);
            reject(request.error);
        };
    });
}

async function deleteSave(saveId) {
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            console.error('Không thể khởi tạo cơ sở dữ liệu:', error);
            return;
        }
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(saveId);
        request.onsuccess = () => {
            console.log('Bản lưu đã được xóa');
            resolve();
        };
        request.onerror = () => {
            console.error('Xóa bản lưu thất bại:', request.error);
            reject(request.error);
        };
    });
}

async function clearGameHistory() {
    if (!db) {
        try {
            await initDB();
        } catch (error) {
            console.error('Không thể khởi tạo cơ sở dữ liệu:', error);
            return;
        }
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => {
            console.log('Lịch sử trò chơi đã được xóa');
            // 📱 Đồng thời xóa dữ liệu trò chuyện điện thoại
            clearMobileChatData();
            // 📰 Đồng thời xóa dữ liệu diễn đàn điện thoại
            clearMobileForumData();
            // 🧠 Đồng thời xóa mạng ngữ nghĩa GraphRAG
            if (window.graphRAGLite && typeof window.graphRAGLite.clearAll === 'function') {
                window.graphRAGLite.clearAll().catch(e => console.warn('Xóa GraphRAG thất bại:', e));
            }
            resolve();
        };
        request.onerror = () => {
            console.error('Xóa lịch sử trò chơi thất bại:', request.error);
            reject(request.error);
        };
    });
}

/**
 * 📱 Xóa dữ liệu trò chuyện điện thoại
 */
function clearMobileChatData() {
    try {
        // Xóa dữ liệu trò chuyện điện thoại trong localStorage
        localStorage.removeItem('mobileChatData');

        // 🔧 Đồng thời xóa khóa không có tiền tố (vì iframe có thể không có cô lập dữ liệu)
        // Lấy phương thức removeItem gốc của localStorage (vượt qua cô lập dữ liệu)
        const originalRemoveItem = Storage.prototype.removeItem.bind(localStorage);
        try {
            // Trực tiếp xóa khóa không có tiền tố
            originalRemoveItem('mobileChatData');
        } catch (e) {
            // Nếu không có cô lập dữ liệu, chỉ cần gọi trực tiếp là được
        }

        // Thử thông báo cho iframe xóa dữ liệu (Cách 1: gọi trực tiếp)
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                const clearMobileData = mobileFrame.contentWindow.clearMobileData;
                if (typeof clearMobileData === 'function') {
                    clearMobileData();
                }
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua
        }

        // 🔧 Cách 2: Thông qua postMessage để thông báo iframe xóa dữ liệu
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                mobileFrame.contentWindow.postMessage({
                    type: 'MOBILE_CLEAR_DATA'
                }, '*');
                console.log('[Lưu trữ] Đã thông báo iframe xóa dữ liệu qua postMessage');
            }
        } catch (e) {
            // Lặng lẽ bỏ qua
        }

        console.log('[Lưu trữ] Dữ liệu trò chuyện điện thoại đã được xóa');
    } catch (e) {
        console.warn('[Lưu trữ] Xóa dữ liệu trò chuyện điện thoại thất bại:', e);
    }
}

/**
 * 📰 Lấy dữ liệu diễn đàn điện thoại (dùng để lưu trữ)
 */
function getMobileForumDataForSave() {
    // Thử lấy từ iframe
    try {
        const mobileFrame = document.getElementById('mobileFrame');
        if (mobileFrame && mobileFrame.contentWindow) {
            try {
                const forumApi = mobileFrame.contentWindow.forumApi;
                if (forumApi && typeof forumApi.exportSaveData === 'function') {
                    return forumApi.exportSaveData();
                }
            } catch (crossOriginError) {
                // Lỗi chéo tên miền, lặng lẽ bỏ qua
            }
        }
    } catch (e) {
        // iframe không tồn tại hoặc lỗi khác
    }

    // Thử lấy từ localStorage
    try {
        const saved = localStorage.getItem('mobileForumData');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('[Lưu trữ] Lấy dữ liệu diễn đàn điện thoại từ localStorage thất bại:', e);
    }
    return null;
}

/**
 * 📰 Phục hồi dữ liệu diễn đàn điện thoại (tải từ bản lưu)
 */
function restoreMobileForumData(data) {
    try {
        if (!data) {
            // Nếu bản lưu không có dữ liệu diễn đàn, xóa dữ liệu diễn đàn hiện có
            clearMobileForumData();
            return;
        }

        // Lưu vào localStorage (để iframe tải)
        localStorage.setItem('mobileForumData', JSON.stringify(data));

        // Thử thông báo trực tiếp cho iframe
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                const forumApi = mobileFrame.contentWindow.forumApi;
                if (forumApi && typeof forumApi.importSaveData === 'function') {
                    forumApi.importSaveData(data);
                }
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua
        }
        console.log('[Lưu trữ] Dữ liệu diễn đàn điện thoại đã được phục hồi');
    } catch (e) {
        console.warn('[Lưu trữ] Phục hồi dữ liệu diễn đàn điện thoại thất bại:', e);
    }
}

/**
 * 📰 Xóa dữ liệu diễn đàn điện thoại
 */
function clearMobileForumData() {
    try {
        localStorage.removeItem('mobileForumData');

        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                // Cách 1: Gửi tin nhắn thông báo diễn đàn xóa dữ liệu
                mobileFrame.contentWindow.postMessage({
                    type: 'MOBILE_FORUM_CLEAR'
                }, '*');

                // Cách 2: Trực tiếp gọi hàm xóa của diễn đàn
                const forumApi = mobileFrame.contentWindow.forumApi;
                if (forumApi && forumApi.clearAll) {
                    forumApi.clearAll();
                } else if (forumApi) {
                    // Dự phòng: Trực tiếp làm trống các thuộc tính
                    forumApi.forumStorage = {
                        myPosts: [],
                        myComments: [],
                        favorites: [],
                        history: [],
                        postsCache: {},
                        commentsCache: {}
                    };
                    forumApi.postsCache = {};
                    forumApi.commentsCache = {};
                    forumApi.currentPost = null;
                    forumApi.currentTag = null;
                }
                console.log('[Lưu trữ] Đã xóa sạch cache bộ nhớ của diễn đàn');
            }
        } catch (crossOriginError) {
            // Lỗi chéo tên miền, lặng lẽ bỏ qua
        }
        console.log('[Lưu trữ] Dữ liệu diễn đàn điện thoại đã được xóa');
    } catch (e) {
        console.warn('[Lưu trữ] Xóa dữ liệu diễn đàn điện thoại thất bại:', e);
    }
}

// ==================== Hệ thống quản lý bản lưu ====================

function exportSaveToFile(saveData, fileName) {
    const dataStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `Save_TuTien_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportCurrentGame() {
    const saveName = prompt('Vui lòng đặt tên cho bản lưu xuất ra:', gameState.variables.name || 'Bản lưu của tôi');
    if (!saveName) return;

    // 🎭 Lấy trước dữ liệu chân dung người dùng (hàm bất đồng bộ)
    const userProfileData = window.userProfileAnalyzer ? await window.userProfileAnalyzer.exportProfile() : null;

    const saveData = {
        saveName: saveName,
        timestamp: Date.now(),
        variables: JSON.parse(JSON.stringify(gameState.variables)),
        conversationHistory: JSON.parse(JSON.stringify(gameState.conversationHistory)),
        variableSnapshots: JSON.parse(JSON.stringify(gameState.variableSnapshots)),
        isGameStarted: gameState.isGameStarted,
        characterInfo: gameState.characterInfo,
        vectorEmbeddings: window.contextVectorManager ?
            JSON.parse(JSON.stringify(window.contextVectorManager.conversationEmbeddings)) : [],
        // 🆕 Xuất kho vector history
        historyEmbeddings: window.contextVectorManager ?
            JSON.parse(JSON.stringify(window.contextVectorManager.historyEmbeddings)) : [],
        // 🆕 Xuất dữ liệu ma trận
        matrixData: window.matrixManager ? window.matrixManager.export() : null,
        // 🆕 Xuất dữ liệu Sơ đồ nhân vật
        characterGraphData: window.characterGraphManager ? {
            characters: Array.from(window.characterGraphManager.characters.entries()),
            stats: window.characterGraphManager.stats
        } : null,
        dynamicWorld: JSON.parse(JSON.stringify(gameState.dynamicWorld)),
        // 📱 Xuất dữ liệu trò chuyện điện thoại
        mobileChatData: getMobileChatDataForSave(),
        // 📰 Xuất dữ liệu diễn đàn điện thoại
        mobileForumData: getMobileForumDataForSave(),
        // 🎭 Xuất dữ liệu chân dung người dùng (đã lấy trước)
        userProfileData: userProfileData,
        // 🃏 Xuất dữ liệu hệ thống thẻ bài ACJT (bộ bài, thánh di vật, v.v.)
        acjtData: getACJTDataForSave(),
        // 🆕 Xuất trạng thái công tắc biến không đồng bộ
        asyncVariableEnabled: window.asyncVariableEnabled || false,
        // 📖 Xuất dữ liệu bản lưu quy hoạch cốt truyện
        plotArchiveData: window.plotArchiveManager ? window.plotArchiveManager.exportArchive() : null,
        // 🧠 Xuất dữ liệu mạng ngữ nghĩa GraphRAG
        graphRAGData: window.graphRAGLite ? window.graphRAGLite.exportData() : null
    };
    exportSaveToFile(saveData, `${saveName}.json`);

    // Thống kê nội dung xuất ra
    const vectorCount = saveData.vectorEmbeddings.length;
    const historyCount = saveData.historyEmbeddings.length;
    const matrixLayers = saveData.matrixData ?
        (saveData.matrixData.conversationMatrix?.layers?.length || 0) + (saveData.matrixData.historyMatrix?.layers?.length || 0) : 0;
    const characterCount = saveData.characterGraphData ? saveData.characterGraphData.characters.length : 0;
    // 📱 Thống kê dữ liệu điện thoại
    const chatCount = saveData.mobileChatData?.chatStorage ? Object.keys(saveData.mobileChatData.chatStorage).length : 0;
    const forumPostCount = saveData.mobileForumData?.postsCache ? Object.keys(saveData.mobileForumData.postsCache).length : 0;
    // 🎭 Chân dung người dùng (hỗ trợ đa chân dung)
    let profileInfo = 'Không có';
    if (saveData.userProfileData) {
        try {
            const profileData = typeof saveData.userProfileData === 'string' ?
                JSON.parse(saveData.userProfileData) : saveData.userProfileData;
            if (profileData.profiles && profileData.profiles.length > 0) {
                profileInfo = `${profileData.profiles.length} chân dung`;
            } else if (profileData.result || profileData.currentProfile) {
                profileInfo = '1 chân dung';
            }
        } catch (e) {
            profileInfo = 'Đã bao gồm';
        }
    }
    // 🃏 Dữ liệu ACJT
    const deckCount = saveData.acjtData?.deck?.length || 0;
    const relicCount = saveData.acjtData?.playerState?.relics?.length || 0;
    // 📖 Bản lưu quy hoạch cốt truyện
    const plotArchiveCount = saveData.plotArchiveData?.plots?.length || 0;

    alert(`✅ Bản lưu đã được xuất!\n\nNội dung bao gồm:\n` +
        `• Vector đối thoại: ${vectorCount} mục\n` +
        `• Vector History: ${historyCount} mục\n` +
        `• Số tầng ma trận: ${matrixLayers} tầng\n` +
        `• Sơ đồ nhân vật: ${characterCount} người\n` +
        `• 📱 Trò chuyện điện thoại: ${chatCount} cuộc hội thoại\n` +
        `• 📰 Bài viết diễn đàn: ${forumPostCount} bài\n` +
        `• 🎭 Chân dung người dùng: ${profileInfo}\n` +
        `• 🃏 Bộ bài: ${deckCount} lá\n` +
        `• ✨ Thánh di vật: ${relicCount} cái\n` +
        `• 📖 Quy hoạch cốt truyện: ${plotArchiveCount} mục`);
}

function importSaveFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const saveData = JSON.parse(event.target.result);
                if (!saveData.variables || !saveData.conversationHistory) {
                    throw new Error('Định dạng bản lưu không chính xác');
                }

                // 🔧 Thống kê nội dung bản lưu
                const vectorCount = saveData.vectorEmbeddings?.length || 0;
                const historyCount = saveData.historyEmbeddings?.length || 0;
                const matrixLayers = saveData.matrixData ?
                    (saveData.matrixData.conversationMatrix?.layers?.length || 0) + (saveData.matrixData.historyMatrix?.layers?.length || 0) : 0;
                const characterCount = saveData.characterGraphData?.characters?.length || 0;
                // 📱 Thống kê dữ liệu điện thoại
                const chatCount = saveData.mobileChatData?.chatStorage ? Object.keys(saveData.mobileChatData.chatStorage).length : 0;
                const forumPostCount = saveData.mobileForumData?.postsCache ? Object.keys(saveData.mobileForumData.postsCache).length : 0;
                // 🎭 Chân dung người dùng (hỗ trợ đa chân dung)
                let profileInfo = 'Không có';
                if (saveData.userProfileData) {
                    try {
                        const profileData = typeof saveData.userProfileData === 'string' ?
                            JSON.parse(saveData.userProfileData) : saveData.userProfileData;
                        if (profileData.profiles && profileData.profiles.length > 0) {
                            profileInfo = `${profileData.profiles.length} chân dung`;
                        } else if (profileData.result || profileData.currentProfile) {
                            profileInfo = '1 chân dung';
                        }
                    } catch (e) {
                        profileInfo = 'Đã bao gồm';
                    }
                }
                // 🃏 Dữ liệu ACJT
                const deckCount = saveData.acjtData?.deck?.length || 0;
                const relicCount = saveData.acjtData?.playerState?.relics?.length || 0;

                let confirmMessage = `Bạn có chắc chắn muốn nhập bản lưu "${saveData.saveName || file.name}" không?\n\nNội dung bao gồm:\n`;
                confirmMessage += `• Vector đối thoại: ${vectorCount} mục\n`;
                confirmMessage += `• Vector History: ${historyCount} mục\n`;
                confirmMessage += `• Số tầng ma trận: ${matrixLayers} tầng\n`;
                confirmMessage += `• Sơ đồ nhân vật: ${characterCount} người\n`;
                confirmMessage += `• 📱 Trò chuyện điện thoại: ${chatCount} cuộc hội thoại\n`;
                confirmMessage += `• 📰 Bài viết diễn đàn: ${forumPostCount} bài\n`;
                confirmMessage += `• 🎭 Chân dung người dùng: ${profileInfo}\n`;
                confirmMessage += `• 🃏 Bộ bài: ${deckCount} lá\n`;
                confirmMessage += `• ✨ Thánh di vật: ${relicCount} cái\n`;
                confirmMessage += `\n⚠️ Tiến trình trò chơi hiện tại sẽ bị ghi đè!`;

                if (!confirm(confirmMessage)) {
                    return;
                }

                // Tải dữ liệu bản lưu vào trạng thái trò chơi
                await loadSaveData(saveData);

                // 🔧 Tự động lưu vào IndexedDB (lưu vào slot chỉ định và cả bản tự động lưu)
                const saveName = saveData.saveName || 'Bản lưu đã nhập';
                await saveGameToSlot(saveName); // Lưu vào bản lưu có tên
                await saveGameHistory(); // Đồng thời cập nhật bản tự động lưu
                console.log(`[Nhập bản lưu] Đã lưu vào IndexedDB: ${saveName} (bao gồm tự động lưu)`);

                alert(`✅ Nhập bản lưu thành công!\n\nĐã phục hồi:\n` +
                    `• Vector đối thoại: ${vectorCount} mục\n` +
                    `• Vector History: ${historyCount} mục\n` +
                    `• Số tầng ma trận: ${matrixLayers} tầng\n` +
                    `• Sơ đồ nhân vật: ${characterCount} người\n` +
                    `• 📱 Trò chuyện điện thoại: ${chatCount} cuộc hội thoại\n` +
                    `• 📰 Bài viết diễn đàn: ${forumPostCount} bài\n` +
                    `• 🎭 Chân dung người dùng: ${profileInfo}\n` +
                    `• 🃏 Bộ bài: ${deckCount} lá\n` +
                    `• ✨ Thánh di vật: ${relicCount} cái\n\n` +
                    `Đã tự động lưu vào cơ sở dữ liệu cục bộ`);
            } catch (error) {
                alert('Nhập thất bại: ' + error.message);
                console.error('Nhập bản lưu thất bại:', error);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function saveCurrentGame() {
    const saveName = prompt('Vui lòng đặt tên cho bản lưu:', gameState.variables.name || 'Bản lưu của tôi');
    if (!saveName) return;
    try {
        await saveGameToSlot(saveName);
        alert('Lưu bản lưu thành công!');
    } catch (error) {
        alert('Lưu bản lưu thất bại: ' + error.message);
    }
}

async function showLoadSaveMenu() {
    const saves = await getAllSaves();
    if (saves.length === 0) {
        alert('Chưa có bản lưu');
        return;
    }
    const historyDiv = document.getElementById('gameHistory');
    let html = `<div style="padding: 20px;"><h2 style="color: #8b4513; margin-bottom: 20px;">📂 Tải bản lưu</h2><div style="display: flex; flex-direction: column; gap: 10px;">`;
    saves.forEach(save => {
        const date = new Date(save.timestamp).toLocaleString('zh-CN');
        const charName = save.variables?.name || 'Chưa đặt tên';
        const realm = save.variables?.realm || 'Phàm nhân';

        // 🆕 Thống kê nội dung bản lưu
        const vectorCount = save.vectorEmbeddings?.length || 0;
        const historyCount = save.historyEmbeddings?.length || 0;
        const matrixLayers = save.matrixData ?
            (save.matrixData.conversationMatrix?.layers?.length || 0) + (save.matrixData.historyMatrix?.layers?.length || 0) : 0;
        const characterCount = save.characterGraphData?.characters?.length || 0;

        html += `<div style="background: #fdfcf8; border: 2px solid #c19a6b; border-radius: 6px; padding: 15px; cursor: pointer;" onclick="loadSelectedSave(${save.id})">
            <div style="font-weight: bold; font-size: 16px; color: #8b4513; margin-bottom: 5px;">${save.saveName}</div>
            <div style="font-size: 13px; color: #666;">Nhân vật: ${charName} | Cảnh giới: ${realm}</div>
            <div style="font-size: 11px; color: #888; margin-top: 5px;">
                📊 Vector: ${vectorCount} | History: ${historyCount} | Ma trận: ${matrixLayers} tầng | Nhân vật: ${characterCount} người
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 5px;">${date}</div>
            <button class="btn btn-danger" style="margin-top: 10px; padding: 5px 15px; font-size: 12px;" onclick="event.stopPropagation(); deleteSelectedSave(${save.id});">Xóa</button>
        </div>`;
    });
    html += `</div><button class="btn btn-secondary" onclick="closeLoadSaveMenu()" style="margin-top: 20px; width: 100%;">Quay lại</button></div>`;
    historyDiv.innerHTML = html;
}

async function loadSelectedSave(saveId) {
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(saveId);
        request.onsuccess = async () => {
            const saveData = request.result;
            if (saveData) {
                await loadSaveData(saveData);

                // 🆕 Thống kê nội dung tải lên
                const vectorCount = saveData.vectorEmbeddings?.length || 0;
                const historyCount = saveData.historyEmbeddings?.length || 0;
                const matrixLayers = saveData.matrixData ?
                    (saveData.matrixData.conversationMatrix?.layers?.length || 0) + (saveData.matrixData.historyMatrix?.layers?.length || 0) : 0;
                const characterCount = saveData.characterGraphData?.characters?.length || 0;

                alert(`✅ Tải bản lưu thành công!\n\nĐã phục hồi:\n` +
                    `• Vector đối thoại: ${vectorCount} mục\n` +
                    `• Vector History: ${historyCount} mục\n` +
                    `• Số tầng ma trận: ${matrixLayers} tầng\n` +
                    `• Sơ đồ nhân vật: ${characterCount} người`);
            }
        };
    } catch (error) {
        alert('Tải thất bại: ' + error.message);
    }
}

async function deleteSelectedSave(saveId) {
    if (!confirm('Bạn có chắc muốn xóa bản lưu này không?')) return;
    try {
        await deleteSave(saveId);
        showLoadSaveMenu();
    } catch (error) {
        alert('Xóa thất bại: ' + error.message);
    }
}

function closeLoadSaveMenu() {
    showMainMenu();
}

// ==================== Hệ thống tương tác AI / Cấu hình API ====================

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionStatus');
    if (indicator) {
        indicator.className = 'status-indicator ' + (connected ? 'status-connected' : 'status-disconnected');
    }
}

function updateExtraConnectionStatus(connected) {
    const indicator = document.getElementById('extraConnectionStatus');
    if (indicator) {
        indicator.className = 'status-indicator ' + (connected ? 'status-connected' : 'status-disconnected');
    }
}

function displayModels(models) {
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });
    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

function saveConnection() {
    // Kiểm tra xem có sử dụng nhập tên mô hình thủ công hay không
    const useManual = document.getElementById('useManualModelInput');
    const manualInput = document.getElementById('manualModelName');
    const modelSelect = document.getElementById('modelSelect');

    let selectedModel;

    // Ưu tiên sử dụng tên mô hình nhập thủ công
    if (useManual && useManual.checked && manualInput && manualInput.value.trim()) {
        selectedModel = manualInput.value.trim();
    } else {
        selectedModel = modelSelect ? modelSelect.value : '';
    }

    if (!selectedModel) {
        alert('Vui lòng chọn một mô hình hoặc nhập tên mô hình thủ công');
        return;
    }
    apiConfig.type = document.getElementById('apiType').value;
    apiConfig.endpoint = document.getElementById('apiEndpoint').value;
    apiConfig.key = document.getElementById('apiKey').value;
    apiConfig.model = selectedModel;
    apiConfig.stream = document.getElementById('apiEnableStream')?.checked || false;
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    config.type = apiConfig.type;
    config.endpoint = apiConfig.endpoint;
    config.key = apiConfig.key;
    config.model = apiConfig.model;
    config.availableModels = apiConfig.availableModels;
    config.stream = apiConfig.stream;
    // Lưu thiết lập nhập thủ công
    config.useManualModel = useManual ? useManual.checked : false;
    config.manualModelName = manualInput ? manualInput.value : '';
    localStorage.setItem('gameConfig', JSON.stringify(config));
    alert('Cấu hình API đã được lưu!\nMô hình: ' + selectedModel);
    updateConnectionStatus(true);
    document.getElementById('fetchModelsBtn').innerHTML = '<span class="status-indicator status-connected"></span> Đã kết nối - ' + selectedModel.substring(0, 20);
}

function toggleExtraApiFields() {
    const enabled = document.getElementById('enableExtraApi').checked;
    const fieldsDiv = document.getElementById('extraApiFields');
    extraApiConfig.enabled = enabled;
    if (enabled) {
        fieldsDiv.style.display = 'block';
    } else {
        fieldsDiv.style.display = 'none';
    }
    saveExtraApiEnabled();
}

// 🆕 Chuyển đổi công tắc biến không đồng bộ
function toggleAsyncVariable() {
    const checkbox = document.getElementById('enableAsyncVariable');
    if (!checkbox) return;

    const enabled = checkbox.checked;

    // Kiểm tra API bổ sung đã cấu hình chưa (tương thích các cách đặt tên biến khác nhau)
    const extraConfig = window.extraApiConfig || (typeof extraApiConfig !== 'undefined' ? extraApiConfig : null);
    if (enabled && (!extraConfig || !extraConfig.enabled)) {
        alert('⚠️ Vui lòng bật và cấu hình "API bổ sung" trước khi mở chức năng biến không đồng bộ');
        checkbox.checked = false;
        return;
    }

    // Thiết lập biến toàn cục
    window.asyncVariableEnabled = enabled;

    // Lưu vào localStorage
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    if (!config.asyncVariable) config.asyncVariable = {};
    config.asyncVariable.enabled = enabled;
    localStorage.setItem('gameConfig', JSON.stringify(config));

    console.log('[Biến không đồng bộ]', enabled ? '✅ Đã bật' : '❌ Đã tắt');

    if (enabled) {
        console.log('[Biến không đồng bộ] API chính sẽ sử dụng baseSystemPrompt, các quy tắc biến sẽ được gửi cho API bổ sung xử lý');
    }
}

// 🆕 Khởi tạo trạng thái công tắc biến không đồng bộ (gọi khi tải trang)
function initAsyncVariable() {
    try {
        const saved = localStorage.getItem('gameConfig');
        if (saved) {
            const config = JSON.parse(saved);
            if (config.asyncVariable && config.asyncVariable.enabled) {
                window.asyncVariableEnabled = true;
                const checkbox = document.getElementById('enableAsyncVariable');
                if (checkbox) {
                    checkbox.checked = true;
                    console.log('[Biến không đồng bộ] ✅ Khôi phục từ cấu hình: Đã bật');
                }
            }
        }
    } catch (e) {
        console.warn('[Biến không đồng bộ] Khôi phục cấu hình thất bại:', e);
    }
}

// Tự động khởi tạo khi tải trang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAsyncVariable);
} else {
    // DOM đã tải, trì hoãn thực thi để đảm bảo phần tử checkbox tồn tại
    setTimeout(initAsyncVariable, 100);
}

function saveExtraApiEnabled() {
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    if (!config.extraApi) {
        config.extraApi = {};
    }
    config.extraApi.enabled = extraApiConfig.enabled;
    localStorage.setItem('gameConfig', JSON.stringify(config));
}

function displayExtraModels(models) {
    const modelSelect = document.getElementById('extraModelSelect');
    modelSelect.innerHTML = '';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });
    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

function saveExtraConnection() {
    const modelSelect = document.getElementById('extraModelSelect');
    const selectedModel = modelSelect.value;
    if (!selectedModel) {
        alert('Vui lòng chọn một mô hình từ danh sách');
        return;
    }
    extraApiConfig.type = document.getElementById('extraApiType').value;
    extraApiConfig.endpoint = document.getElementById('extraApiEndpoint').value;
    extraApiConfig.key = document.getElementById('extraApiKey').value;
    extraApiConfig.model = selectedModel;
    extraApiConfig.stream = document.getElementById('extraApiEnableStream')?.checked || false;
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    config.extraApi = {
        enabled: extraApiConfig.enabled,
        type: extraApiConfig.type,
        endpoint: extraApiConfig.endpoint,
        key: extraApiConfig.key,
        model: extraApiConfig.model,
        availableModels: extraApiConfig.availableModels,
        stream: extraApiConfig.stream
    };
    localStorage.setItem('gameConfig', JSON.stringify(config));
    alert('Cấu hình API bổ sung đã được lưu!\nMô hình: ' + selectedModel);
    updateExtraConnectionStatus(true);
    document.getElementById('fetchExtraModelsBtn').innerHTML = '<span class="status-indicator status-connected"></span> Đã kết nối - ' + selectedModel.substring(0, 20);
}

// ==================== Cài đặt trò chơi ====================

function saveGameSettings() {
    const historyDepth = document.getElementById('historyDepth').value;
    const minWordCount = document.getElementById('minWordCount').value;
    const maxTokens = document.getElementById('maxTokens').value;
    const enableVectorRetrieval = document.getElementById('enableVectorRetrieval').checked;
    const vectorMethod = document.getElementById('vectorMethod').value;
    const maxRetrieveCount = document.getElementById('maxRetrieveCount').value;
    const similarityThreshold = document.getElementById('similarityThreshold').value;
    const minTurnGap = document.getElementById('minTurnGap').value;
    const includeRecentAIReplies = document.getElementById('includeRecentAIReplies').value;
    // 🆕 Cài đặt ma trận History
    const recentHistoryCount = document.getElementById('recentHistoryCount').value;
    const matrixHistoryCount = document.getElementById('matrixHistoryCount').value;
    const narrativePerspective = document.getElementById('narrativePerspective').value;
    const systemPromptContent = document.getElementById('systemPrompt').value;

    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    config.historyDepth = parseInt(historyDepth);
    config.minWordCount = parseInt(minWordCount);
    config.maxTokens = parseInt(maxTokens);
    config.enableVectorRetrieval = enableVectorRetrieval;
    config.vectorMethod = vectorMethod;
    config.maxRetrieveCount = parseInt(maxRetrieveCount);
    config.similarityThreshold = parseFloat(similarityThreshold);
    config.minTurnGap = parseInt(minTurnGap);
    config.includeRecentAIReplies = parseInt(includeRecentAIReplies);
    // 🆕 Lưu cài đặt ma trận History
    config.recentHistoryCount = parseInt(recentHistoryCount);
    config.matrixHistoryCount = parseInt(matrixHistoryCount);
    config.narrativePerspective = narrativePerspective;
    config.systemPrompt = systemPromptContent;

    localStorage.setItem('gameConfig', JSON.stringify(config));

    if (window.contextVectorManager) {
        const systemPromptItem = window.contextVectorManager.staticKnowledgeBase.find(item => item.id === 'system_prompt_main');
        if (systemPromptItem) {
            systemPromptItem.content = systemPromptContent;
            console.log('[Prompt hệ thống] Đã cập nhật mục Prompt hệ thống trong kho kiến thức');
            window.contextVectorManager.saveStaticKBToIndexedDB().then(() => {
                console.log('[Prompt hệ thống] Đã lưu vào IndexedDB');
            }).catch(error => {
                console.warn('[Prompt hệ thống] Lưu vào IndexedDB thất bại:', error);
            });
        }
        window.contextVectorManager.maxRetrieveCount = parseInt(maxRetrieveCount);
        window.contextVectorManager.minSimilarityThreshold = parseFloat(similarityThreshold);
        window.contextVectorManager.minTurnGap = parseInt(minTurnGap);
        window.contextVectorManager.includeRecentAIRepliesInQuery = parseInt(includeRecentAIReplies);
        // 🆕 Cập nhật cài đặt ma trận History
        window.contextVectorManager.recentHistoryCount = parseInt(recentHistoryCount);
        window.contextVectorManager.matrixHistoryCount = parseInt(matrixHistoryCount);
        console.log(`[Truy xuất vector] Đã cập nhật cấu hình - Số lượt AI phản hồi trong truy vấn: ${includeRecentAIReplies}`);
        console.log(`[Ma trận History] Đã cập nhật cấu hình - Số mục gần đây: ${recentHistoryCount}, Số mục truy xuất ma trận: ${matrixHistoryCount}`);
    }

    const perspectiveText = {
        'first': 'Ngôi thứ nhất',
        'second': 'Ngôi thứ hai',
        'third': 'Ngôi thứ ba'
    };
    alert('Cài đặt trò chơi đã được lưu!\nĐộ sâu lịch sử: ' + historyDepth + '\nSố chữ tối thiểu: ' + minWordCount + '\nTruy xuất vector: ' + (enableVectorRetrieval ? 'Đã bật' : 'Đã tắt') + '\nGóc nhìn tự sự: ' + perspectiveText[narrativePerspective] + '\nPrompt hệ thống: Đã cập nhật kho kiến thức');
}

function toggleVectorRetrieval() {
    const enabled = document.getElementById('enableVectorRetrieval').checked;
    const settingsDiv = document.getElementById('vectorRetrievalSettings');
    if (enabled) {
        settingsDiv.style.display = 'block';
    } else {
        settingsDiv.style.display = 'none';
    }
}

async function changeVectorMethod() {
    const method = document.getElementById('vectorMethod').value;
    const downloadSection = document.getElementById('downloadModelSection');
    const apiVectorSettings = document.getElementById('apiVectorSettings');

    // Hiển thị/ẩn khu vực cấu hình vector API
    if (apiVectorSettings) {
        if (method === 'api') {
            apiVectorSettings.style.display = 'block';
            loadVectorApiSettings(); // Tải cấu hình đã lưu
        } else {
            apiVectorSettings.style.display = 'none';
        }
    }

    // Hiển thị/ẩn khu vực nút tải xuống
    if (downloadSection) {
        if (method === 'transformers') {
            downloadSection.style.display = 'block';
            checkModelStatus(); // Kiểm tra trạng thái bộ nhớ đệm mô hình
        } else {
            downloadSection.style.display = 'none';
        }
    }

    if (window.contextVectorManager) {
        window.contextVectorManager.setEmbeddingMethod(method);
    }
}

/**
 * 🆕 Lưu cấu hình vector API
 */
function saveVectorApiSettings() {
    const endpoint = document.getElementById('vectorApiEndpoint')?.value?.trim() || '';
    const key = document.getElementById('vectorApiKey')?.value?.trim() || '';
    const model = document.getElementById('vectorApiModel')?.value?.trim() || 'text-embedding-ada-002';

    if (!endpoint) {
        alert('⚠️ Vui lòng nhập Endpoint API');
        return;
    }
    if (!key) {
        alert('⚠️ Vui lòng nhập API Key');
        return;
    }

    // Lưu vào localStorage
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    config.vectorApi = {
        endpoint: endpoint,
        key: key,
        model: model
    };
    localStorage.setItem('gameConfig', JSON.stringify(config));

    // Cập nhật cấu hình toàn cục
    window.vectorApiConfig = {
        endpoint: endpoint,
        key: key,
        model: model
    };

    alert('✅ Cấu hình vector API đã được lưu!\n\nEndpoint: ' + endpoint + '\nMô hình: ' + model);
    console.log('[Vector API] Cấu hình đã được lưu:', { endpoint, model });
}

/**
 * 🆕 Tải cấu hình vector API
 */
function loadVectorApiSettings() {
    try {
        const saved = localStorage.getItem('gameConfig');
        if (saved) {
            const config = JSON.parse(saved);
            if (config.vectorApi) {
                const endpointInput = document.getElementById('vectorApiEndpoint');
                const keyInput = document.getElementById('vectorApiKey');
                const modelInput = document.getElementById('vectorApiModel');

                if (endpointInput) endpointInput.value = config.vectorApi.endpoint || '';
                if (keyInput) keyInput.value = config.vectorApi.key || '';
                if (modelInput) modelInput.value = config.vectorApi.model || 'text-embedding-ada-002';

                // Đồng thời cập nhật cấu hình toàn cục
                window.vectorApiConfig = {
                    endpoint: config.vectorApi.endpoint || '',
                    key: config.vectorApi.key || '',
                    model: config.vectorApi.model || 'text-embedding-ada-002'
                };

                console.log('[Vector API] Cấu hình đã được tải');
            }
        }
    } catch (e) {
        console.warn('[Vector API] Tải cấu hình thất bại:', e);
    }
}

/**
 * 🆕 Khởi tạo cấu hình vector API (gọi khi tải trang)
 */
function initVectorApiConfig() {
    try {
        const saved = localStorage.getItem('gameConfig');
        if (saved) {
            const config = JSON.parse(saved);
            if (config.vectorApi) {
                window.vectorApiConfig = {
                    endpoint: config.vectorApi.endpoint || '',
                    key: config.vectorApi.key || '',
                    model: config.vectorApi.model || 'text-embedding-ada-002'
                };
                console.log('[Vector API] ✅ Cấu hình toàn cục đã được khởi tạo');
            }
        }
    } catch (e) {
        console.warn('[Vector API] Khởi tạo cấu hình thất bại:', e);
    }
}

// Tự động khởi tạo cấu hình vector API khi tải trang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVectorApiConfig);
} else {
    setTimeout(initVectorApiConfig, 100);
}

/**
 * 🆕 Lấy danh sách mô hình vector
 */
async function fetchVectorModels() {
    const endpoint = document.getElementById('vectorApiEndpoint')?.value?.trim() || '';
    const apiKey = document.getElementById('vectorApiKey')?.value?.trim() || '';
    const btn = document.getElementById('fetchVectorModelsBtn');
    const select = document.getElementById('vectorModelSelect');

    if (!endpoint) {
        alert('⚠️ Vui lòng nhập Endpoint API trước');
        return;
    }
    if (!apiKey) {
        alert('⚠️ Vui lòng nhập API Key trước');
        return;
    }

    // Cập nhật trạng thái nút
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Đang lấy...';
    btn.disabled = true;

    try {
        const cleanEndpoint = endpoint.replace(/\/+$/, '');
        const response = await fetch(`${cleanEndpoint}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API trả về ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        let models = [];

        // Phân tích danh sách mô hình (tương thích định dạng OpenAI)
        if (data.data && Array.isArray(data.data)) {
            models = data.data.map(m => m.id || m.name).filter(Boolean);
        } else if (Array.isArray(data)) {
            models = data.map(m => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
        } else if (data.models && Array.isArray(data.models)) {
            models = data.models.map(m => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
        }

        if (models.length === 0) {
            throw new Error('Không tìm thấy mô hình khả dụng');
        }

        // Lọc ra các mô hình liên quan đến embedding (tùy chọn, ưu tiên hiển thị các mô hình embedding)
        const embeddingModels = models.filter(m =>
            m.toLowerCase().includes('embed') ||
            m.toLowerCase().includes('embedding')
        );
        const otherModels = models.filter(m =>
            !m.toLowerCase().includes('embed') &&
            !m.toLowerCase().includes('embedding')
        );

        // Làm trống và lấp đầy hộp thả xuống
        select.innerHTML = '<option value="">-- Chọn một mô hình --</option>';

        if (embeddingModels.length > 0) {
            const group1 = document.createElement('optgroup');
            group1.label = '🎯 Mô hình Embedding';
            embeddingModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                group1.appendChild(option);
            });
            select.appendChild(group1);
        }

        if (otherModels.length > 0) {
            const group2 = document.createElement('optgroup');
            group2.label = '📦 Các mô hình khác';
            otherModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                group2.appendChild(option);
            });
            select.appendChild(group2);
        }

        // Hiển thị hộp thả xuống
        select.style.display = 'block';

        // Cập nhật trạng thái nút
        btn.innerHTML = `✅ Đã lấy ${models.length} mô hình`;
        btn.style.background = '#28a745';

        console.log(`[Vector API] Đã lấy ${models.length} mô hình, trong đó ${embeddingModels.length} mô hình là embedding`);

    } catch (error) {
        console.error('[Vector API] Lấy danh sách mô hình thất bại:', error);
        alert('❌ Lấy danh sách mô hình thất bại\n\n' + error.message);
        btn.innerHTML = originalText;
    } finally {
        btn.disabled = false;
        // Khôi phục văn bản nút sau 3 giây
        setTimeout(() => {
            if (btn.innerHTML.includes('✅')) {
                btn.innerHTML = '🔍 Lấy danh sách mô hình vector';
                btn.style.background = '';
            }
        }, 3000);
    }
}

/**
 * 🆕 Xử lý khi chọn mô hình vector
 */
function onVectorModelSelect() {
    const select = document.getElementById('vectorModelSelect');
    const input = document.getElementById('vectorApiModel');

    if (select && input && select.value) {
        input.value = select.value;
        console.log('[Vector API] Đã chọn mô hình:', select.value);
    }
}

/**
 * Kiểm tra trạng thái bộ nhớ đệm của mô hình AI trình duyệt
 */
function checkModelStatus() {
    const statusEl = document.getElementById('modelStatus');
    const btnEl = document.getElementById('downloadModelBtn');

    if (!statusEl || !btnEl) return;

    // Kiểm tra cờ trong localStorage
    const modelReady = localStorage.getItem('transformers_model_ready') === '1';

    if (modelReady) {
        statusEl.textContent = '✅ Đã lưu đệm';
        statusEl.style.color = '#28a745';
        btnEl.textContent = '🔄 Tải lại mô hình';
        btnEl.style.background = '#6c757d';
    } else {
        statusEl.textContent = '❌ Chưa lưu đệm';
        statusEl.style.color = '#dc3545';
        btnEl.textContent = '📥 Tải trước mô hình (khoảng 13MB)';
        btnEl.style.background = '#667eea';
    }
}

/**
 * Tải trước mô hình AI trình duyệt
 */
async function predownloadModel() {
    const btnEl = document.getElementById('downloadModelBtn');
    const statusEl = document.getElementById('modelStatus');

    if (!btnEl || !statusEl) return;

    // Vô hiệu hóa nút
    btnEl.disabled = true;
    const originalText = btnEl.textContent;
    btnEl.textContent = '⏳ Đang chuẩn bị tải...';
    statusEl.textContent = 'Đang chuẩn bị...';
    statusEl.style.color = '#ffc107';

    try {
        console.log('[Tải trước mô hình] Bắt đầu tải thư viện Transformers.js...');

        // 1. Tải thư viện Transformers.js trước
        if (typeof window.loadTransformersJS === 'function') {
            await window.loadTransformersJS();
        } else {
            throw new Error('Hàm loadTransformersJS chưa được định nghĩa');
        }

        console.log('[Tải trước mô hình] Thư viện đã tải xong, bắt đầu tải mô hình...');
        btnEl.textContent = '📥 Đang tải...';
        statusEl.textContent = 'Đang tải...';

        // 2. Kích hoạt tải mô hình (thông qua việc gọi tạo vector một lần)
        if (window.contextVectorManager) {
            await window.contextVectorManager.getEmbeddingFromTransformers('Kiểm tra tải trước');
            console.log('[Tải trước mô hình] ✅ Mô hình đã tải và lưu đệm thành công!');

            // Cập nhật trạng thái
            statusEl.textContent = '✅ Đã lưu đệm';
            statusEl.style.color = '#28a745';
            btnEl.textContent = '✅ Tải xong!';
            btnEl.style.background = '#28a745';

            // Khôi phục nút sau 3 giây
            setTimeout(() => {
                btnEl.textContent = '🔄 Tải lại mô hình';
                btnEl.style.background = '#6c757d';
                btnEl.disabled = false;
            }, 3000);

            alert('✅ Mô hình đã tải thành công!\n\nMô hình đã được lưu đệm vào trình duyệt, lần sau sử dụng sẽ không cần chờ tải.\n\n💡 Gợi ý: Giờ đây bạn có thể sử dụng mô hình AI trình duyệt ngoại tuyến!');

        } else {
            throw new Error('contextVectorManager chưa được khởi tạo');
        }

    } catch (error) {
        console.error('[Tải trước mô hình] ❌ Tải thất bại:', error);

        // Cập nhật trạng thái thất bại
        statusEl.textContent = '❌ Tải thất bại';
        statusEl.style.color = '#dc3545';
        btnEl.textContent = '❌ Tải thất bại, nhấp để thử lại';
        btnEl.style.background = '#dc3545';
        btnEl.disabled = false;

        // Hiển thị thông tin lỗi chi tiết
        let errorMsg = 'Tải mô hình thất bại!\n\n';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg += '❌ Lỗi mạng\n\nNguyên nhân có thể:\n1. Kết nối mạng không ổn định\n2. Truy cập CDN HuggingFace bị hạn chế\n3. Cần sử dụng Proxy/VPN\n\nGợi ý:\n- Kiểm tra kết nối mạng\n- Thử lại sau\n- Hoặc sử dụng Proxy để truy cập';
        } else {
            errorMsg += 'Chi tiết lỗi:\n' + error.message;
        }

        alert(errorMsg);
    }
}

function toggleDynamicWorldFields() {
    const enabled = document.getElementById('enableDynamicWorld').checked;
    const fieldsDiv = document.getElementById('dynamicWorldFields');
    if (enabled) {
        fieldsDiv.style.display = 'block';
    } else {
        fieldsDiv.style.display = 'none';
    }
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    if (!config.dynamicWorld) config.dynamicWorld = {};
    config.dynamicWorld.enabled = enabled;
    localStorage.setItem('gameConfig', JSON.stringify(config));
    if (gameState.dynamicWorld) {
        gameState.dynamicWorld.enabled = enabled;
    }
}

function saveDynamicWorldSettings() {
    const historyDepth = document.getElementById('dynamicWorldHistoryDepth').value;
    const minWords = document.getElementById('dynamicWorldMinWords').value;
    const interval = document.getElementById('dynamicWorldInterval').value;
    const showReasoning = document.getElementById('dynamicWorldShowReasoning').checked;
    const enableKnowledge = document.getElementById('dynamicWorldEnableKnowledge').checked;
    const prompt = document.getElementById('dynamicWorldPrompt').value;

    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};
    if (!config.dynamicWorld) config.dynamicWorld = {};
    config.dynamicWorld.historyDepth = parseInt(historyDepth);
    config.dynamicWorld.minWords = parseInt(minWords);
    config.dynamicWorld.messageInterval = parseInt(interval);
    config.dynamicWorld.showReasoning = showReasoning;
    config.dynamicWorld.enableKnowledge = enableKnowledge;
    config.dynamicWorld.prompt = prompt;

    localStorage.setItem('gameConfig', JSON.stringify(config));
    alert('Cài đặt Thế giới động đã được lưu!');
}

// ==================== Quản lý tin nhắn ====================

let deleteMode = false;
let selectedMessages = new Set();

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    // Đồng bộ vào gameState
    if (window.gameState) {
        window.gameState.deleteMode = deleteMode;
    }
    const btn = document.getElementById('deleteToggleBtn');
    const deleteControls = document.getElementById('deleteControls');
    const historyDiv = document.getElementById('gameHistory');

    if (deleteMode) {
        btn.classList.add('active');
        btn.textContent = '❌ Hủy xóa';
        deleteControls.style.display = 'flex';
        historyDiv.classList.add('delete-mode-active');
        const messages = historyDiv.querySelectorAll('.message');
        messages.forEach((msg, index) => {
            let checkbox = msg.querySelector('.message-checkbox');
            if (!checkbox) {
                // Tạo checkbox mới
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'message-checkbox';
                checkbox.style.display = 'inline-block';
                msg.insertBefore(checkbox, msg.firstChild);
            } else {
                // Nếu checkbox đã tồn tại, đảm bảo nó hiển thị
                checkbox.style.display = 'inline-block';
            }

            // Dù checkbox mới hay cũ, đều gắn lại sự kiện và chỉ số (index)
            checkbox.dataset.index = index;
            // Loại bỏ trình lắng nghe sự kiện cũ (bằng cách sao chép nút)
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);

            // Gắn trình xử lý sự kiện mới
            newCheckbox.onchange = (e) => {
                if (e.target.checked) {
                    selectedMessages.add(index);
                    msg.classList.add('selected-for-delete');
                } else {
                    selectedMessages.delete(index);
                    msg.classList.remove('selected-for-delete');
                }
            };
        });
    } else {
        btn.classList.remove('active');
        btn.textContent = '🗑️';
        deleteControls.style.display = 'none';
        historyDiv.classList.remove('delete-mode-active');
        const checkboxes = historyDiv.querySelectorAll('.message-checkbox');
        checkboxes.forEach(cb => cb.remove());
        selectedMessages.clear();
        const messages = historyDiv.querySelectorAll('.message');
        messages.forEach(msg => msg.classList.remove('selected-for-delete'));

        // Sau khi thoát chế độ xóa, cập nhật lại chỉ số tầng (floor indicators)
        setTimeout(() => {
            if (typeof window.MessageFloorIndicator === 'object' && window.MessageFloorIndicator.updateAllFloorIndicators) {
                window.MessageFloorIndicator.updateAllFloorIndicators();
            }
        }, 100);
    }
}

function confirmDelete() {
    if (selectedMessages.size === 0) {
        alert('Vui lòng chọn các tin nhắn cần xóa');
        return;
    }

    const historyDiv = document.getElementById('gameHistory');

    // 🔧 Sửa lỗi: Chỉ lấy các tin nhắn đối thoại thực sự (tin nhắn người dùng và AI), loại bỏ thế giới động, v.v.
    const allConversationMessages = Array.from(historyDiv.querySelectorAll('.message')).filter(msg => {
        // Loại bỏ tin nhắn thế giới động
        const header = msg.querySelector('.message-header');
        if (header && header.textContent.includes('Thế giới động')) {
            return false;
        }
        // Loại bỏ thông báo đang tải
        if (msg.id === 'loading-message' || msg.id === 'dynamic-world-loading') {
            return false;
        }
        // Loại bỏ tin nhắn lỗi
        if (msg.id === 'error-message-with-retry') {
            return false;
        }
        // Chỉ giữ lại tin nhắn người dùng và tin nhắn AI
        return msg.classList.contains('user-message') || msg.classList.contains('ai-message');
    });

    // 🔧 Lấy tất cả tin nhắn UI để khớp chỉ số của selectedMessages
    const allUIMessages = Array.from(historyDiv.querySelectorAll('.message'));

    // 🔧 Ánh xạ selectedMessages (chỉ số UI) sang chỉ số tin nhắn đối thoại
    const selectedConversationIndices = new Set();
    const allSelectedUIMessages = [];

    allUIMessages.forEach((msg, uiIndex) => {
        if (selectedMessages.has(uiIndex)) {
            const convIndex = allConversationMessages.indexOf(msg);
            if (convIndex !== -1) {
                selectedConversationIndices.add(convIndex);
                allSelectedUIMessages.push(msg);
            }
        }
    });

    if (selectedConversationIndices.size === 0) {
        alert('Vui lòng chọn các tin nhắn cần xóa');
        return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedConversationIndices.size} tin nhắn đã chọn không?\nThao tác này đồng thời sẽ xóa nhật ký đối thoại tương ứng và hồi quy các biến.`)) {
        return;
    }

    // 🔧 Sửa lỗi: Sử dụng chỉ số của tin nhắn đối thoại để tính toán phạm vi xóa
    const sortedIndices = Array.from(selectedConversationIndices).sort((a, b) => a - b);
    const firstSelectedIndex = sortedIndices[0];
    const deleteCount = sortedIndices.length;

    console.log(`[Xóa tin nhắn] Chuẩn bị xóa: Chỉ số bắt đầu=${firstSelectedIndex}, Số lượng=${deleteCount}`);
    console.log(`[Xóa tin nhắn] Trước khi xóa: conversationHistory dài=${gameState.conversationHistory.length}, variableSnapshots dài=${gameState.variableSnapshots.length}`);

    // Sao lưu dữ liệu độc lập của Thế giới động (trước khi hồi quy)
    const dynamicWorldBackup = {
        history: JSON.parse(JSON.stringify(gameState.dynamicWorld?.history || [])),
        floor: gameState.dynamicWorld?.floor || 0
    };

    // Xóa các bản ghi tương ứng trong conversationHistory
    gameState.conversationHistory.splice(firstSelectedIndex, deleteCount);
    gameState.variableSnapshots.splice(firstSelectedIndex, deleteCount);

    // 🔧 Sửa lỗi: Sau khi xóa, đặt biến hiện tại thành trạng thái cuối cùng của các bản sao chụp còn lại
    if (gameState.variableSnapshots.length > 0) {
        gameState.variables = JSON.parse(JSON.stringify(
            gameState.variableSnapshots[gameState.variableSnapshots.length - 1]
        ));
        console.log(`[Xóa tin nhắn] Các biến đã hồi quy về trạng thái cuối cùng của bản sao chụp còn lại (chỉ số ${gameState.variableSnapshots.length - 1})`);
    } else {
        console.log('[Xóa tin nhắn] Không còn bản sao chụp nào, các biến giữ nguyên trạng thái hiện tại');
    }

    console.log(`[Xóa tin nhắn] Sau khi xóa: conversationHistory dài=${gameState.conversationHistory.length}, variableSnapshots dài=${gameState.variableSnapshots.length}`);

    // Phục hồi dữ liệu độc lập của Thế giới động (sau khi hồi quy)
    if (gameState.dynamicWorld) {
        gameState.dynamicWorld.history = dynamicWorldBackup.history;
        gameState.dynamicWorld.floor = dynamicWorldBackup.floor;
        console.log('[Xóa tin nhắn] Đã bảo vệ dữ liệu Thế giới động không bị hồi quy');
    }

    // 🆕 Xóa các mục tương ứng trong kho vector
    if (window.contextVectorManager) {
        const turnIndexStart = Math.floor(firstSelectedIndex / 2) + 1; // Tính toán lượt bắt đầu
        const turnIndexEnd = Math.floor((firstSelectedIndex + deleteCount) / 2); // Tính toán lượt kết thúc

        let deletedVectorCount = 0;
        for (let turnIndex = turnIndexStart; turnIndex <= turnIndexEnd; turnIndex++) {
            const vectorIndex = window.contextVectorManager.conversationEmbeddings.findIndex(
                conv => conv.turnIndex === turnIndex
            );
            if (vectorIndex !== -1) {
                window.contextVectorManager.conversationEmbeddings.splice(vectorIndex, 1);
                deletedVectorCount++;
            }
        }

        // Điều chỉnh lại chỉ số của các lượt hội thoại sau đó
        window.contextVectorManager.conversationEmbeddings.forEach(conv => {
            if (conv.turnIndex > turnIndexEnd) {
                conv.turnIndex -= (turnIndexEnd - turnIndexStart + 1);
            }
        });

        if (deletedVectorCount > 0) {
            console.log(`[Kho vector] Đã xóa ${deletedVectorCount} bản ghi vector`);
        }

        // 🆕 Đồng thời dọn dẹp historyEmbeddings và historyMatrix
        if (window.contextVectorManager.historyEmbeddings) {
            const historyIndicesToRemove = [];
            window.contextVectorManager.historyEmbeddings.forEach((entry, index) => {
                if (entry.turnIndex >= turnIndexStart && entry.turnIndex <= turnIndexEnd) {
                    historyIndicesToRemove.push(index);
                }
            });

            // Xóa từ dưới lên trên để tránh vấn đề lệch chỉ số
            for (let i = historyIndicesToRemove.length - 1; i >= 0; i--) {
                window.contextVectorManager.historyEmbeddings.splice(historyIndicesToRemove[i], 1);
            }

            // Điều chỉnh lại chỉ số của các lượt hội thoại sau đó
            window.contextVectorManager.historyEmbeddings.forEach(entry => {
                if (entry.turnIndex > turnIndexEnd) {
                    entry.turnIndex -= (turnIndexEnd - turnIndexStart + 1);
                }
            });

            if (historyIndicesToRemove.length > 0) {
                console.log(`[Kho vector History] Đã xóa ${historyIndicesToRemove.length} bản ghi history của lượt ${turnIndexStart}-${turnIndexEnd}`);

                // 🔧 Xây dựng lại historyMatrix
                if (window.matrixManager && window.matrixManager.historyMatrix) {
                    window.matrixManager.historyMatrix.clear();
                    for (const entry of window.contextVectorManager.historyEmbeddings) {
                        try {
                            window.matrixManager.historyMatrix.ingestVector({
                                vector: entry.vector,
                                aiResponse: entry.content,
                                turnIndex: entry.turnIndex,
                                timestamp: entry.timestamp
                            });
                        } catch (error) {
                            console.warn('[Ma trận History] Đưa vào thất bại khi xây dựng lại:', error);
                        }
                    }
                    console.log(`[Ma trận History] Đã xây dựng lại (sau khi xóa tầng), còn lại ${window.matrixManager.historyMatrix.layers?.length || 0} tầng`);
                }
            }
        }

        // Lưu vào IndexedDB
        window.contextVectorManager.saveToIndexedDB().catch(err =>
            console.warn('[Kho vector] Lưu thất bại:', err)
        );
    }

    // 🆕 Xóa các nhân vật được thêm vào trong lượt tương ứng khỏi sơ đồ nhân vật
    if (window.characterGraphManager && typeof window.characterGraphManager.deleteCharactersByTurnRange === 'function') {
        const turnIndexStart = Math.floor(firstSelectedIndex / 2) + 1;
        const turnIndexEnd = Math.floor((firstSelectedIndex + deleteCount) / 2);

        window.characterGraphManager.deleteCharactersByTurnRange(turnIndexStart, turnIndexEnd)
            .then(deletedNames => {
                if (deletedNames.length > 0) {
                    console.log(`[Sơ đồ nhân vật] ✅ Đã xóa hồi quy ${deletedNames.length} nhân vật`);
                }
            })
            .catch(err => console.warn('[Sơ đồ nhân vật] Xóa hồi quy thất bại:', err));
    }

    // 🧠 Xóa các thực thể và quan hệ trong lượt tương ứng khỏi mạng ngữ nghĩa GraphRAG
    if (window.graphRAGLite && typeof window.graphRAGLite.deleteByTurnIndex === 'function') {
        const turnIndexStart = Math.floor(firstSelectedIndex / 2) + 1;
        window.graphRAGLite.deleteByTurnIndex(turnIndexStart)
            .then(result => {
                if (result.deletedEntities > 0 || result.deletedRelations > 0) {
                    console.log(`[GraphRAG] ✅ Đã xóa hồi quy ${result.deletedEntities} thực thể, ${result.deletedRelations} quan hệ`);
                }
            })
            .catch(err => console.warn('[GraphRAG] Xóa hồi quy thất bại:', err));
    }

    // 📚 Xóa số lượng bản lưu quy hoạch cốt truyện tương ứng (dựa trên số lượng tin nhắn AI bị xóa)
    if (window.plotArchiveManager && typeof window.plotArchiveManager.deleteLastN === 'function') {
        // Thống kê xem có bao nhiêu tin nhắn AI trong số tin nhắn bị xóa
        let aiMessageCount = 0;
        allSelectedUIMessages.forEach(msg => {
            if (msg.classList.contains('ai-message')) {
                aiMessageCount++;
            }
        });

        if (aiMessageCount > 0) {
            const actualDeleted = window.plotArchiveManager.deleteLastN(aiMessageCount);
            console.log(`[📚Lưu trữ cốt truyện] Đã xóa ${aiMessageCount} tin nhắn AI, tương ứng xóa ${actualDeleted} bản lưu quy hoạch cốt truyện`);
        }
    }

    // Xóa tin nhắn khỏi UI
    allSelectedUIMessages.forEach(msg => msg.remove());

    // Cập nhật hiển thị bảng trạng thái
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    saveGameHistory().catch(err => console.error('Lưu thất bại:', err));
    cancelDelete();
    alert(`Đã xóa ${deleteCount} tin nhắn!\nCác biến đã hồi quy về trạng thái bản sao chụp cuối cùng còn lại.\n\n💡 Gợi ý: Dữ liệu Thế giới động đã được bảo vệ, sẽ không bị xóa.`);
}

function cancelDelete() {
    toggleDeleteMode();
}

// ==================== Chức năng gỡ lỗi ====================

let debugMode = false;

function toggleDebugMode() {
    debugMode = document.getElementById('debugMode').checked;
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
        debugOutput.style.display = debugMode ? 'block' : 'none';
    }
    console.log('[Chế độ gỡ lỗi]', debugMode ? 'Đã bật' : 'Đã tắt');
}

function showDebugOutput(content) {
    if (!debugMode) return;
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
        debugOutput.textContent = content;
        debugOutput.scrollTop = debugOutput.scrollHeight;
    }
}

// ==================== Quản lý cửa sổ bật lên (Modal) ====================

function openConfigModal() {
    const modal = document.getElementById('configModal');
    const overlay = document.getElementById('configModalOverlay');

    if (!modal || !overlay) {
        console.error('[GameCore] Modal cấu hình không tồn tại, đang thử tạo lại');
        try {
            if (typeof generateConfigModal === 'function') {
                generateConfigModal();
                // Lấy lại phần tử
                setTimeout(() => {
                    const newModal = document.getElementById('configModal');
                    const newOverlay = document.getElementById('configModalOverlay');
                    if (newModal && newOverlay) {
                        newModal.classList.add('show');
                        newOverlay.classList.add('show');
                    }
                }, 100);
            } else {
                console.error('[GameCore] Hàm generateConfigModal không tồn tại');
            }
        } catch (error) {
            console.error('[GameCore] Tạo modal cấu hình thất bại:', error);
        }
        return;
    }

    modal.classList.add('show');
    overlay.classList.add('show');
}

function closeConfigModal() {
    const modal = document.getElementById('configModal');
    const overlay = document.getElementById('configModalOverlay');

    if (modal) {
        modal.classList.remove('show');
    }
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const header = content.previousElementSibling;
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        header.classList.add('collapsed');
    } else {
        content.classList.add('show');
        header.classList.remove('collapsed');
    }
}

// ==================== Định dạng trò chơi (Format Game) ====================

async function formatGame() {
    if (!confirm('⚠️ Cảnh báo: Thao tác này sẽ xóa sạch mọi dữ liệu!\n\nBao gồm:\n- Tất cả bản lưu\n- Lịch sử trò chơi\n- Ký ức vector\n- Gói kiến thức DLC\n\n✅ Sẽ giữ lại:\n- Cấu hình API\n- Cài đặt trò chơi\n- Cài đặt Thế giới động\n\nThao tác này không thể hoàn tác! Bạn có chắc chắn muốn tiếp tục không?')) {
        return;
    }
    if (!confirm('⚠️ Xác nhận cuối cùng: Bạn thực sự muốn định dạng lại toàn bộ dữ liệu?')) {
        return;
    }
    try {
        // Lưu các cấu hình cần giữ lại
        const gameConfig = localStorage.getItem('gameConfig');
        const extraApiConfig = localStorage.getItem('extraApiConfig');
        const staticKBFiles = localStorage.getItem('staticKBFiles');
        const transformersReady = localStorage.getItem('transformers_model_ready');

        console.log('[Định dạng] Đang giữ lại dữ liệu cấu hình...');

        // Xóa lịch sử trò chơi
        await clearGameHistory();

        // Xóa sạch localStorage
        localStorage.clear();

        // Khôi phục các cấu hình đã giữ lại
        if (gameConfig) {
            localStorage.setItem('gameConfig', gameConfig);
            console.log('[Định dạng] ✓ Đã khôi phục cấu hình API và cài đặt trò chơi');
        }
        if (extraApiConfig) {
            localStorage.setItem('extraApiConfig', extraApiConfig);
            console.log('[Định dạng] ✓ Đã khôi phục cấu hình API bổ sung');
        }
        if (staticKBFiles) {
            localStorage.setItem('staticKBFiles', staticKBFiles);
            console.log('[Định dạng] ✓ Đã khôi phục cấu hình tệp kho kiến thức tĩnh');
        }
        if (transformersReady) {
            localStorage.setItem('transformers_model_ready', transformersReady);
            console.log('[Định dạng] ✓ Đã khôi phục trạng thái mô hình Transformers');
        }

        // Xóa sạch kho lưu trữ vector
        if (window.contextVectorManager) {
            window.contextVectorManager.clear();
            await window.contextVectorManager.clearIndexedDB();
        }

        // Xóa dữ liệu DLC
        if (window.dlcManager) {
            await window.dlcManager.clearAllDLCs();
        }

        alert('✅ Định dạng hoàn tất!\n\nĐã giữ lại:\n- Cấu hình API\n- Cài đặt trò chơi\n- Cài đặt Thế giới động\n\nTrang web sẽ tự động làm mới...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        alert('Định dạng thất bại: ' + error.message);
        console.error('Định dạng thất bại:', error);
    }
}

// ==================== Hệ thống tải và đồng bộ dữ liệu ====================

/**
 * 🆕 Loại bỏ trùng lặp trong mảng history
 */
function deduplicateHistory(historyArray) {
    if (!Array.isArray(historyArray)) return [];

    const seen = new Set();
    return historyArray.filter(item => {
        const trimmed = item.trim();
        if (!trimmed || seen.has(trimmed)) {
            return false;
        }
        seen.add(trimmed);
        return true;
    });
}

/**
 * 🆕 Hàm toàn cục: Sửa lỗi history bị trùng lặp trong trò chơi hiện tại ngay lập tức
 */
window.fixDuplicateHistory = function () {
    if (!gameState.variables.history || !Array.isArray(gameState.variables.history)) {
        console.log('[Sửa lỗi History] Không có dữ liệu history');
        return;
    }

    const originalLength = gameState.variables.history.length;
    gameState.variables.history = deduplicateHistory(gameState.variables.history);
    const newLength = gameState.variables.history.length;
    const removed = originalLength - newLength;

    console.log(`[Sửa lỗi History] Hoàn tất!`);
    console.log(`  Gốc: ${originalLength} mục`);
    console.log(`  Hiện tại: ${newLength} mục`);
    console.log(`  Đã xóa: ${removed} mục trùng lặp`);

    if (removed > 0) {
        // Tự động lưu dữ liệu sau khi sửa
        saveGameToSlot('Tự động lưu');
        alert(`✅ Sửa lỗi History hoàn tất!\n\nĐã xóa ${removed} bản ghi trùng lặp\nĐã tự động lưu vào "Tự động lưu"`);
    } else {
        alert('✅ History không có bản ghi trùng lặp!');
    }
};

/**
 * Tải dữ liệu lưu trữ vào trò chơi
 */
async function loadSaveData(saveData) {
    gameState.variables = saveData.variables;

    // 🔧 Loại bỏ trùng lặp history ngay sau khi tải
    if (gameState.variables.history && Array.isArray(gameState.variables.history)) {
        const originalLength = gameState.variables.history.length;
        gameState.variables.history = deduplicateHistory(gameState.variables.history);
        const newLength = gameState.variables.history.length;
        if (originalLength !== newLength) {
            console.log(`[Tải bản lưu] 🧹 Loại bỏ trùng lặp history: ${originalLength} → ${newLength} mục`);
        }
    }

    gameState.conversationHistory = saveData.conversationHistory;
    gameState.variableSnapshots = saveData.variableSnapshots;
   gameState.isGameStarted = saveData.isGameStarted;
    gameState.characterInfo = saveData.characterInfo;

    // 🆕 Khôi phục dữ liệu kho lưu trữ vector
    if (saveData.vectorEmbeddings && window.contextVectorManager) {
        window.contextVectorManager.conversationEmbeddings = saveData.vectorEmbeddings;
        console.log(`[Kho vector] Đã khôi phục ${saveData.vectorEmbeddings.length} ký ức đối thoại từ bản lưu`);
    } else if (!saveData.vectorEmbeddings) {
        // Nếu là bản lưu phiên bản cũ (không có kho vector), nhắc người dùng đồng bộ
        console.warn('[Kho vector] Bản lưu phiên bản cũ, kiến nghị đồng bộ thủ công kho vector');
    }

    // 🆕 Khôi phục kho lưu trữ vector history
    if (saveData.historyEmbeddings && window.contextVectorManager) {
        window.contextVectorManager.historyEmbeddings = saveData.historyEmbeddings;
        console.log(`[Kho vector History] Đã khôi phục ${saveData.historyEmbeddings.length} ký ức history từ bản lưu`);
    }

    // 🔧 Sửa lỗi: Đồng bộ lưu kho vector vào IndexedDB (bao gồm cả history)
    if (window.contextVectorManager) {
        await window.contextVectorManager.saveToIndexedDB();
        console.log(`[Kho vector] ✅ Đã đồng bộ vào IndexedDB (Đối thoại:${window.contextVectorManager.conversationEmbeddings.length} mục, History:${window.contextVectorManager.historyEmbeddings.length} mục)`);
    }

    // 🆕 Khôi phục dữ liệu ma trận
    if (saveData.matrixData && window.matrixManager) {
        window.matrixManager.import(saveData.matrixData);
        console.log(`[Trình quản lý ma trận] Đã khôi phục dữ liệu ma trận từ bản lưu`);
    } else if (window.matrixManager) {
        // Nếu trong bản lưu không có dữ liệu ma trận nhưng có kho vector, có thể xây dựng lại ma trận
        if (window.contextVectorManager && window.contextVectorManager.conversationEmbeddings.length > 0) {
            console.log('[Trình quản lý ma trận] Bản lưu không có dữ liệu ma trận, thử xây dựng lại từ kho vector...');
            await window.matrixManager.initializeFromHistory();
        }
        if (window.contextVectorManager && window.contextVectorManager.historyEmbeddings.length > 0) {
            console.log('[Trình quản lý ma trận] Thử xây dựng lại ma trận từ kho vector history...');
            await window.matrixManager.initializeHistoryMatrix();
        }
    }

    // 🆕 Khôi phục dữ liệu sơ đồ nhân vật
    if (saveData.characterGraphData && window.characterGraphManager) {
        console.log(`[Sơ đồ nhân vật] Bắt đầu khôi phục dữ liệu từ bản lưu...`);

        // Xóa dữ liệu hiện có
        window.characterGraphManager.characters.clear();
        window.characterGraphManager.vectors.clear();

        // Khôi phục dữ liệu nhân vật
        const characters = saveData.characterGraphData.characters || [];
        let restoredCount = 0;

        for (const [name, character] of characters) {
            try {
                // Tạo lại vector
                const vector = await window.characterGraphManager.generateVector(
                    character.name,
                    character.personality,
                    character.appearance
                );

                // Lưu vào bộ nhớ (không bao gồm vector)
                window.characterGraphManager.characters.set(name, character);
                window.characterGraphManager.vectors.set(name, vector);

                // Lưu vào IndexedDB
                await window.characterGraphManager.saveCharacter(character);

                restoredCount++;
            } catch (error) {
                console.error(`[Sơ đồ nhân vật] ⚠️ Khôi phục nhân vật thất bại: ${name}`, error);
            }
        }

        // Khôi phục thông tin thống kê
        if (saveData.characterGraphData.stats) {
            window.characterGraphManager.stats = saveData.characterGraphData.stats;
        }

        console.log(`[Sơ đồ nhân vật] ✅ Đã khôi phục ${restoredCount} nhân vật từ bản lưu`);
    } else if (!saveData.characterGraphData && window.characterGraphManager) {
        // Bản lưu phiên bản cũ, xóa sạch sơ đồ nhân vật
        console.warn('[Sơ đồ nhân vật] Bản lưu phiên bản cũ, xóa sạch dữ liệu sơ đồ nhân vật');
        window.characterGraphManager.characters.clear();
        window.characterGraphManager.vectors.clear();
    }

    // 🌍 Khôi phục dữ liệu Thế giới động
    if (saveData.dynamicWorld) {
        gameState.dynamicWorld = saveData.dynamicWorld;
        // 🆕 Cường chế đặt lại trạng thái xử lý (tránh bị kẹt trong quá trình xử lý)
        gameState.dynamicWorld.isProcessing = false;
        // 🆕 Tương thích với bản lưu cũ, thêm các trường mới
        if (!gameState.dynamicWorld.messageInterval) {
            gameState.dynamicWorld.messageInterval = 1;
        }
        if (!gameState.dynamicWorld.messageCounter) {
            gameState.dynamicWorld.messageCounter = 0;
        }
        console.log(`[Thế giới động] Đã khôi phục ${saveData.dynamicWorld.history?.length || 0} bản ghi từ bản lưu`);
        // Cập nhật hiển thị Thế giới động
        if (typeof displayDynamicWorldHistory === 'function') {
            displayDynamicWorldHistory();
        }
    } else {
        // Bản lưu phiên bản cũ, khởi tạo Thế giới động
        gameState.dynamicWorld = {
            enabled: false,
            history: [],
            floor: 0,
            isProcessing: false,
            messageInterval: 1,
            messageCounter: 0
        };
        console.warn('[Thế giới động] Bản lưu phiên bản cũ, dữ liệu Thế giới động đã được khởi tạo');
    }

    // 📱 Khôi phục dữ liệu trò chuyện điện thoại (nếu bản lưu không có thì xóa dữ liệu hiện có)
    restoreMobileChatData(saveData.mobileChatData);

    // 📰 Khôi phục dữ liệu diễn đàn điện thoại
    restoreMobileForumData(saveData.mobileForumData);

    // 🎭 Khôi phục dữ liệu chân dung người dùng
    if (saveData.userProfileData && window.userProfileAnalyzer) {
        try {
            await window.userProfileAnalyzer.importProfile(saveData.userProfileData);
            console.log('[Chân dung người dùng] ✅ Đã khôi phục chân dung người dùng từ bản lưu');
        } catch (e) {
            console.warn('[Chân dung người dùng] ⚠️ Khôi phục chân dung người dùng thất bại:', e);
        }
    }

    // 🃏 Khôi phục dữ liệu hệ thống thẻ bài ACJT
    if (saveData.acjtData) {
        restoreACJTData(saveData.acjtData);
    }

    // 📚 Khôi phục dữ liệu bản lưu quy hoạch cốt truyện
    if (saveData.plotArchiveData && window.plotArchiveManager) {
        window.plotArchiveManager.importArchive(saveData.plotArchiveData);
        console.log('[Bản lưu cốt truyện] ✅ Đã khôi phục', saveData.plotArchiveData.plots?.length || 0, 'quy hoạch cốt truyện từ bản lưu');
    }

    // Render lại lịch sử trò chơi
    const historyDiv = document.getElementById('gameHistory');
    historyDiv.innerHTML = '';

    console.log('[Tải bản lưu] Bắt đầu render lịch sử đối thoại, tổng số mục:', gameState.conversationHistory.length);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < gameState.conversationHistory.length; i++) {
        const entry = gameState.conversationHistory[i];

        try {
            if (entry.role === 'user') {
                if (typeof displayUserMessage === 'function') {
                    // 🔧 Cường chế render, bỏ qua kiểm tra chế độ gỡ lỗi
                    displayUserMessage(entry.content, true);
                }
                successCount++;
                console.log(`[Tải bản lưu] ✅ Đã render tin nhắn người dùng ${i + 1}/${gameState.conversationHistory.length}`);
            } else if (entry.role === 'assistant') {
                // Phân tích phản hồi AI
                try {
                    let jsonMatch = entry.content.match(/```json\s*([\s\S]*?)\s*```/);
                    if (!jsonMatch) {
                        jsonMatch = entry.content.match(/```\s*([\s\S]*?)\s*```/);
                    }

                    let jsonStr = jsonMatch ? jsonMatch[1] : entry.content;
                    const data = JSON.parse(jsonStr);

                    if (typeof displayAIMessage === 'function') {
                        displayAIMessage(data.story, data.options, data.reasoning);
                    }
                } catch (error) {
                    console.warn('Phân tích tin nhắn lịch sử thất bại (có thể là bản lưu định dạng cũ), hiển thị văn bản thuần trực tiếp:', error.message);
                    // Nếu phân tích thất bại, nghĩa là định dạng văn bản thuần (bản lưu cũ), hiển thị trực tiếp
                    if (typeof displayAIMessage === 'function') {
                        displayAIMessage(entry.content, [], null);
                    }
                }
                successCount++;
                console.log(`[Tải bản lưu] ✅ Đã render tin nhắn AI ${i + 1}/${gameState.conversationHistory.length}`);
            }
        } catch (error) {
            errorCount++;
            console.error(`[Tải bản lưu] ❌ Render tin nhắn ${i + 1} thất bại:`, error);
        }
    }

    console.log(`[Tải bản lưu] Render hoàn tất: Thành công ${successCount} mục, Thất bại ${errorCount} mục, Tổng cộng ${gameState.conversationHistory.length} mục`);
    console.log(`[Tải bản lưu] Số lượng phần tử con của gameHistory: ${historyDiv.children.length}`);

    // 🆕 Kiểm tra trễ: Đảm bảo sau khi render hoàn tất DOM đã được cập nhật
    setTimeout(() => {
        const finalCount = document.getElementById('gameHistory').children.length;
        console.log(`[Tải bản lưu] 🔍 Kiểm tra trễ - Số lượng phần tử con cuối cùng của gameHistory: ${finalCount}`);
        if (finalCount !== gameState.conversationHistory.length) {
            console.error(`[Tải bản lưu] ❌ Cảnh báo: Số lượng phần tử DOM (${finalCount}) không khớp với số lượng lịch sử đối thoại (${gameState.conversationHistory.length})!`);
            // Tự động chạy chẩn đoán
            if (typeof diagnoseMessageDisplay === 'function') {
                diagnoseMessageDisplay();
            }
        } else {
            console.log(`[Tải bản lưu] ✅ Số lượng phần tử DOM khớp với số lượng lịch sử đối thoại`);
        }
    }, 500);

    // Cập nhật bảng trạng thái
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // 🌍 Cập nhật hiển thị trang Tab Thế giới động
    if (typeof displayDynamicWorldHistory === 'function') {
        displayDynamicWorldHistory();
    }

    // Cuộn xuống dưới cùng
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // 【Thêm mới】Đồng bộ kho vector - Nếu đã bật truy xuất vector nhưng kho vector trống, tự động xây dựng lại
    const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;
    if (enableVectorRetrieval && window.contextVectorManager) {
        syncVectorLibraryFromHistory();
    }

    // 🔧 Trì hoãn cập nhật lại hiển thị PlayerState (đảm bảo các phần tử DOM của ACJT đã được render)
    setTimeout(() => {
        if (typeof PlayerState !== 'undefined' && PlayerState.updateDisplay) {
            PlayerState.updateDisplay();
            console.log('[Bản lưu] Đã làm mới hiển thị trạng thái người chơi sau khi trì hoãn');
        }
    }, 300);
}

/**
 * Đồng bộ kho vector từ lịch sử đối thoại
 */
async function syncVectorLibraryFromHistory(isManual = false) {
    if (!window.contextVectorManager) {
        if (isManual) alert('Trình quản lý vector chưa khởi tạo!');
        return;
    }

    const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;
    if (!enableVectorRetrieval && isManual) {
        alert('Truy xuất vector chưa bật!\n\nVui lòng bật "🧬 Kích hoạt truy xuất vector (Bộ nhớ thông minh)" trong cài đặt trò chơi trước');
        return;
    }

    const vectorLibSize = window.contextVectorManager.conversationEmbeddings.length;
    const historySize = Math.floor(gameState.conversationHistory.length / 2);

    if (historySize === 0) {
        if (isManual) alert('Lịch sử đối thoại trống! Vui lòng tiến hành trò chơi trước.');
        return;
    }

    // Nếu kho vector trống hoặc nhỏ hơn rõ rệt so với lịch sử đối thoại, tiến hành đồng bộ
    if (vectorLibSize < historySize || isManual) {
        if (isManual && vectorLibSize >= historySize) {
            if (!confirm(`Kho vector hiện tại đã có ${vectorLibSize} lượt đối thoại, lịch sử đối thoại có ${historySize} lượt.\n\nBạn có chắc chắn muốn đồng bộ lại không? Thao tác này sẽ xóa sạch kho vector hiện có và xây dựng lại.`)) {
                return;
            }
        }

        console.log(`[Đồng bộ kho vector] Phát hiện kho vector (${vectorLibSize} lượt) < lịch sử đối thoại (${historySize} lượt), bắt đầu đồng bộ...`);

        // Hiển thị thông báo tiến độ
        const progressMsg = document.createElement('div');
        progressMsg.id = 'syncProgress';
        progressMsg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10001;
            text-align: center;
        `;
        progressMsg.innerHTML = `
            <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                🔄 Đang đồng bộ kho vector...
            </div>
            <div style="color: #666; font-size: 14px;">
                Vui lòng đợi, đang xử lý lượt <span id="syncCurrentTurn">0</span>/${historySize}
            </div>
        `;
        document.body.appendChild(progressMsg);

        // Xóa sạch kho vector hiện có
        window.contextVectorManager.clear();

        // Duyệt qua lịch sử đối thoại, xây dựng lại kho vector
        for (let i = 0; i < gameState.conversationHistory.length - 1; i += 2) {
            const userMsg = gameState.conversationHistory[i];
            const aiMsg = gameState.conversationHistory[i + 1];

            if (userMsg && aiMsg && userMsg.role === 'user' && aiMsg.role === 'assistant') {
                const turnIndex = Math.floor(i / 2) + 1;
                const variables = gameState.variableSnapshots[i + 1] || gameState.variables;

                // Cập nhật tiến độ
                const progressSpan = document.getElementById('syncCurrentTurn');
                if (progressSpan) progressSpan.textContent = turnIndex;

                await window.contextVectorManager.addConversation(
                    userMsg.content,
                    aiMsg.content,
                    turnIndex,
                    variables
                );
            }
        }

        // Lưu vào IndexedDB
        await window.contextVectorManager.saveToIndexedDB();

        // Gỡ bỏ thông báo tiến độ
        progressMsg.remove();

        console.log(`[Đồng bộ kho vector] ✅ Hoàn tất! Đã đồng bộ ${window.contextVectorManager.conversationEmbeddings.length} lượt đối thoại`);

        // Thông báo cho người dùng
        const syncMsg = document.createElement('div');
        syncMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            font-size: 14px;
        `;
        syncMsg.innerHTML = `✅ Kho vector đã đồng bộ ${window.contextVectorManager.conversationEmbeddings.length} lượt đối thoại`;
        document.body.appendChild(syncMsg);

        setTimeout(() => syncMsg.remove(), 3000);

        if (isManual) {
            alert(`✅ Đồng bộ hoàn tất!\n\nĐã đồng bộ ${historySize} lượt đối thoại vào kho vector\n\nBạn có thể nhấp vào "🧬 Xem kho vector" để xem chi tiết`);
        }
    } else if (isManual) {
        alert(`ℹ️ Kho vector đã ở trạng thái mới nhất\n\nKho vector: ${vectorLibSize} lượt\nLịch sử đối thoại: ${historySize} lượt\n\nKhông cần đồng bộ.`);
    }
}

// ==================== Hàm công cụ hệ thống thuộc tính ====================

/**
 * Hiển thị thay đổi thuộc tính
 */
function showAttributeChanges() {
    if (!gameState.previousVariables) return;

    const prev = gameState.previousVariables;
    const curr = gameState.variables;

    // Thay đổi tiền tệ
    showChange('spiritStonesChange', prev.spiritStones, curr.spiritStones);

    // Thay đổi Thể lực và Pháp lực
    showChange('hpChange', prev.hp, curr.hp);
    showChange('mpChange', prev.mp, curr.mp);

    // Thay đổi thuộc tính đặc biệt
    showChange('karmaFortuneChange', prev.karmaFortune, curr.karmaFortune);
    showChange('karmaPunishmentChange', prev.karmaPunishment, curr.karmaPunishment);

    // Thay đổi thuộc tính lục vị (Đã chuyển sang hiển thị bằng biểu đồ radar, không hiển thị gợi ý thay đổi văn bản nữa)
    // const prevActual = calculateActualAttributesFor(prev);
    // const currActual = calculateActualAttributes();
    // showChange('attrPhysiqueChange', prevActual.physique, currActual.physique);
    // showChange('attrFortuneChange', prevActual.fortune, currActual.fortune);
    // showChange('attrComprehensionChange', prevActual.comprehension, currActual.comprehension);
    // showChange('attrSpiritChange', prevActual.spirit, currActual.spirit);
    // showChange('attrPotentialChange', prevActual.potential, currActual.potential);
    // showChange('attrCharismaChange', prevActual.charisma, currActual.charisma);
}

/**
 * Tính toán thuộc tính thực tế của trạng thái chỉ định
 */
function calculateActualAttributesFor(variables) {
    const base = variables.attributes;
    const equipment = variables.equipment;
    const actual = { ...base };

    if (equipment) {
        Object.values(equipment).forEach(item => {
            if (item && item.effects) {
                Object.entries(item.effects).forEach(([attr, value]) => {
                    if (actual[attr] !== undefined) {
                        actual[attr] += value;
                    }
                });
            }
        });
    }

    return actual;
}

/**
 * Hiển thị thay đổi của một thuộc tính đơn lẻ
 */
function showChange(elementId, oldValue, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (oldValue !== newValue) {
        const change = newValue - oldValue;
        const changeText = change > 0 ? `+${change}` : `${change}`;
        const changeColor = change > 0 ? '#28a745' : '#dc3545';

        element.innerHTML = `<span style="color: ${changeColor}; font-weight: bold;">${changeText}</span>`;
        element.style.display = 'inline';

        // Ẩn sau 3 giây
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

/**
 * Phân tích yêu cầu thuộc tính
 */
function parseAttributeRequirement(optionText) {
    // Đảm bảo optionText là chuỗi
    if (typeof optionText !== 'string') {
        optionText = String(optionText);
    }

    // Khớp tên thuộc tính tiếng Trung HOẶC tên thuộc tính tiếng Anh
    const chinesePattern = /（(根骨|气运|悟性|神识|潜力|魅力)([><=≥≤])(\d+)）/;
    const englishPattern = /\((physique|fortune|comprehension|spirit|potential|charisma)([><=])(\d+)\)/i;

    let match = optionText.match(chinesePattern);
    let isChinese = true;

    if (!match) {
        match = optionText.match(englishPattern);
        isChinese = false;
    }

    if (match) {
        let attrName = match[1].toLowerCase();
        const operator = match[2];
        const value = parseInt(match[3]);

        // Chuyển đổi tên thuộc tính tiếng Trung sang tiếng Anh
        if (isChinese) {
            const attrMap = {
                '根骨': 'physique',
                '气运': 'fortune',
                '悟性': 'comprehension',
                '神识': 'spirit',
                '潜力': 'potential',
                '魅力': 'charisma'
            };
            attrName = attrMap[match[1]];
        }

        // Loại bỏ phần yêu cầu, thu được văn bản tùy chọn thuần khiết
        const cleanText = optionText.replace(match[0], '').trim();

        return {
            hasRequirement: true,
            attribute: attrName,
            operator: operator === '≥' ? '>=' : operator === '≤' ? '<=' : operator,
            value: value,
            cleanText: cleanText,
            requirementText: match[0]
        };
    }

    return {
        hasRequirement: false,
        cleanText: optionText
    };
}

/**
 * Kiểm tra xem yêu cầu thuộc tính có được thỏa mãn hay không
 */
function checkAttributeRequirement(requirement) {
    if (!requirement.hasRequirement) {
        return { met: true };
    }

    // Lấy giá trị thuộc tính thực tế (bao gồm cả cộng thêm từ trang bị)
    const actualAttributes = calculateActualAttributes();
    const currentValue = actualAttributes[requirement.attribute] || 0;

    let met = false;
    switch (requirement.operator) {
        case '>':
            met = currentValue > requirement.value;
            break;
        case '>=':
        case '≥':
            met = currentValue >= requirement.value;
            break;
        case '<':
            met = currentValue < requirement.value;
            break;
        case '<=':
        case '≤':
            met = currentValue <= requirement.value;
            break;
        case '==':
        case '=':
            met = currentValue === requirement.value;
            break;
        default:
            met = false;
    }

    // Lấy tên hiển thị tiếng Trung của thuộc tính
    const attributeNames = {
        'physique': 'Căn cốt',
        'fortune': 'Khí vận',
        'comprehension': 'Ngộ tính',
        'spirit': 'Thần thức',
        'potential': 'Tiềm lực',
        'charisma': 'Mị lực'
    };

    return {
        met: met,
        current: currentValue,
        currentValue: currentValue, // Thêm trường này để user-input-handler.js sử dụng
        required: requirement.value,
        operator: requirement.operator,
        attributeName: attributeNames[requirement.attribute] || requirement.attribute // Thêm tên tiếng Trung của thuộc tính
    };
}

/**
 * Tính toán thuộc tính thực tế hiện tại (bao gồm cả cộng thêm từ trang bị)
 */
function calculateActualAttributes() {
    return calculateActualAttributesFor(gameState.variables);
}

// Chú ý: Các hàm sau được định nghĩa trong game.html vì chúng phụ thuộc vào lượng lớn logic trò chơi:
// - showMainMenu
// - fetchModels / fetchExtraModels
// - loadConfig
// - Các hàm hệ thống quản lý DLC
// - Các hàm tạo thế giới động
// Những hàm này được giữ lại trong game.html để tránh phụ thuộc vòng (circular dependency)
