/**
 * Module hệ thống tạo nhân vật
 * Bao gồm: Chọn xuất thân, hệ thống thiên phú, phân bổ thuộc tính, xác nhận nhân vật, v.v.
 * Trích xuất từ game.html
 */

// ==================== Hệ thống tạo nhân vật ====================

/**
 * Khởi tạo danh sách xuất thân (Origins)
 */
function initializeOrigins() {
    // Kiểm tra dữ liệu origins có tồn tại không
    if (!window.origins || !Array.isArray(window.origins)) {
        console.error('[Tạo nhân vật] ❌ Dữ liệu origins không tồn tại hoặc không phải mảng:', window.origins);
        return;
    }

    console.log('[Tạo nhân vật] 📋 Bắt đầu khởi tạo danh sách xuất thân, số lượng:', window.origins.length);

    const originGrid = document.getElementById('originGrid');
    if (!originGrid) {
        console.error('[Tạo nhân vật] ❌ Phần tử originGrid không tồn tại');
        return;
    }

    originGrid.innerHTML = '';

    window.origins.forEach(origin => {
        const card = document.createElement('div');
        card.className = 'origin-card';
        card.setAttribute('data-origin-id', origin.id);
        if (origin.id === characterCreation.selectedOrigin) {
            card.classList.add('selected');
        }
        card.onclick = () => selectOrigin(origin.id);

        // Xây dựng HTML hiệu ứng thuộc tính
        let effectsHTML = '';
        if (Object.keys(origin.attributeEffects).length > 0) {
            effectsHTML = Object.entries(origin.attributeEffects).map(([attr, value]) => {
                const attrName = getAttributeName(attr);
                return `<span class="origin-card-feature">${attrName}${value > 0 ? '+' : ''}${value}</span>`;
            }).join('');
        }

        // Xây dựng văn bản hiệu chỉnh điểm số
        const pointsText = origin.pointsModifier !== 0
            ? `${origin.pointsModifier > 0 ? '+' : ''}${origin.pointsModifier} Điểm`
            : '0 Điểm';

        card.innerHTML = `
            <div class="origin-card-header">
                <div class="origin-card-title">${origin.name}</div>
                <div class="origin-card-badge">${pointsText}</div>
            </div>
            <div class="origin-card-description">${origin.description}</div>
            <div class="origin-card-features">
                ${effectsHTML}
            </div>
        `;

        originGrid.appendChild(card);
    });
}

/**
 * Chọn xuất thân
 */
function selectOrigin(originId) {
    const oldOrigin = window.origins.find(o => o.id === characterCreation.selectedOrigin);
    const newOrigin = window.origins.find(o => o.id === originId);
    if (!newOrigin) return;

    // Loại bỏ hiệu ứng của xuất thân cũ
    if (oldOrigin) {
        characterCreation.remainingPoints -= oldOrigin.pointsModifier;
        Object.entries(oldOrigin.attributeEffects).forEach(([attr, value]) => {
            characterCreation.baseAttributes[attr] -= value;
        });
    }

    // Áp dụng hiệu ứng của xuất thân mới
    characterCreation.selectedOrigin = originId;
    characterCreation.remainingPoints += newOrigin.pointsModifier;
    Object.entries(newOrigin.attributeEffects).forEach(([attr, value]) => {
        characterCreation.baseAttributes[attr] += value;
    });

    // Cập nhật UI
    document.querySelectorAll('.origin-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-origin-id="${originId}"]`).classList.add('selected');

    updatePointsDisplay();
    updateAttributesDisplay();
}

/**
 * Khởi tạo danh sách thiên phú (Talents)
 */
function initializeTalents() {
    // Thông tin debug: kiểm tra trạng thái window.talents
    console.log('[Tạo nhân vật] 🔍 Thông tin Debug:');
    console.log('  - window.talents có tồn tại không:', typeof window.talents !== 'undefined');
    console.log('  - Kiểu của window.talents:', typeof window.talents);
    console.log('  - Giá trị window.talents:', window.talents);

    // Kiểm tra dữ liệu talents có tồn tại không
    if (!window.talents || !Array.isArray(window.talents)) {
        console.error('[Tạo nhân vật] ❌ Dữ liệu talents không tồn tại hoặc không phải mảng:', window.talents);

        // Sử dụng dữ liệu thiên phú dự phòng nội bộ
        console.log('[Tạo nhân vật] 🔄 Đang sử dụng dữ liệu thiên phú dự phòng...');
        window.talents = [
            // Thiên phú tích cực (Tốn điểm)
            {
                id: 'genius',
                name: 'Thiên Phú Dị Bẩm',
                type: 'positive',
                cost: -15,
                description: 'Linh căn siêu phàm bẩm sinh, tốc độ tu luyện cực nhanh',
                effects: { comprehension: 8, potential: 5 }
            },
            {
                id: 'strong_body',
                name: 'Tiên Thiên Đạo Thể',
                type: 'positive',
                cost: -10,
                description: 'Đạo thể bẩm sinh, căn cốt tuyệt giai',
                effects: { physique: 10, spirit: 5 }
            },
            {
                id: 'lucky_star',
                name: 'Khí Vận Chi Tử',
                type: 'positive',
                cost: -10,
                description: 'May mắn bẩm sinh, dễ dàng đắc được cơ duyên',
                effects: { fortune: 15, charisma: 3 }
            },
            {
                id: 'swift_comprehension',
                name: 'Quá Mục Bất Vong',
                type: 'positive',
                cost: -8,
                description: 'Ngộ tính kinh người, khả năng lĩnh hội siêu quần',
                effects: { comprehension: 12 }
            },
            {
                id: 'charm_master',
                name: 'Khuynh Quốc Khuynh Thành',
                type: 'positive',
                cost: -10,
                description: 'Dung mạo xuất chúng, mị lực siêu quần',
                effects: { charisma: 10, fortune: 3 }
            },
            // Thiên phú tiêu cực (Thêm điểm)
            {
                id: 'weak_body',
                name: 'Thể Nhược Đa Bệnh',
                type: 'negative',
                cost: 15,
                description: 'Thân thể hư nhược, căn cốt kém cỏi',
                effects: { physique: -8, spirit: -4 }
            },
            {
                id: 'bad_luck',
                name: 'Vận Xấu Quấn Thân',
                type: 'negative',
                cost: 15,
                description: 'Vận khí không tốt, dễ gặp rắc rối',
                effects: { fortune: -10 }
            },
            {
                id: 'slow_mind',
                name: 'Ngu Độn Trì Hoãn',
                type: 'negative',
                cost: 10,
                description: 'Tư chất bình thường, ngộ tính kém',
                effects: { comprehension: -8 }
            }
        ];
        console.log('[Tạo nhân vật] ✅ Dữ liệu thiên phú dự phòng đã tải, số lượng:', window.talents.length);
    }

    console.log('[Tạo nhân vật] ✨ Bắt đầu khởi tạo danh sách thiên phú, số lượng:', window.talents.length);

    const talentGrid = document.getElementById('talentGrid');
    if (!talentGrid) {
        console.error('[Tạo nhân vật] ❌ Phần tử talentGrid không tồn tại');
        return;
    }

    talentGrid.innerHTML = '';

    window.talents.forEach(talent => {
        const card = document.createElement('div');
        card.className = `talent-card ${talent.type}`;
        card.setAttribute('data-talent-id', talent.id);
        card.onclick = () => toggleTalent(talent.id);

        const effectsHTML = Object.entries(talent.effects).map(([attr, value]) => {
            const attrName = getAttributeName(attr);
            return `<span class="talent-card-feature">${attrName}${value > 0 ? '+' : ''}${value}</span>`;
        }).join('');

        const costText = `${talent.cost > 0 ? '+' : ''}${talent.cost} Điểm`;

        card.innerHTML = `
            <div class="talent-card-header">
                <div class="talent-card-title">${talent.name}</div>
                <div class="talent-card-badge">${costText}</div>
            </div>
            <div class="talent-card-description">${talent.description}</div>
            <div class="talent-card-features">${effectsHTML}</div>
        `;

        talentGrid.appendChild(card);
    });
}

/**
 * Chuyển đổi lựa chọn thiên phú
 */
function toggleTalent(talentId) {
    const talent = window.talents.find(t => t.id === talentId);
    if (!talent) return;

    const index = characterCreation.selectedTalents.findIndex(t => t === talentId);
    const card = document.querySelector(`[data-talent-id="${talentId}"]`);

    if (index >= 0) {
        // Hủy chọn
        characterCreation.selectedTalents.splice(index, 1);
        characterCreation.remainingPoints -= talent.cost;
        card.classList.remove('selected');
    } else {
        // Kiểm tra điểm số có đủ không
        if (characterCreation.remainingPoints + talent.cost < 0) {
            alert('Không đủ điểm!');
            return;
        }

        // Chọn thiên phú
        characterCreation.selectedTalents.push(talentId);
        characterCreation.remainingPoints += talent.cost;
        card.classList.add('selected');
    }

    updatePointsDisplay();
    updateAttributesDisplay(); // Cập nhật hiển thị thuộc tính thời gian thực
}

/**
 * Chọn độ khó
 */
function selectDifficulty(difficulty) {
    // Loại bỏ trạng thái đang chọn của tất cả
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Chọn độ khó hiện tại
    document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('selected');

    // Thiết lập điểm số tương ứng
    const pointsMap = {
        'easy': 200,
        'normal': 100,
        'hard': 50,
        'hell': 25,
        'dragon': 9999
    };

    const oldMax = characterCreation.maxPoints;
    const newMax = pointsMap[difficulty];
    const diff = newMax - oldMax;

    characterCreation.difficulty = difficulty;
    characterCreation.maxPoints = newMax;
    characterCreation.remainingPoints += diff;

    updatePointsDisplay();
}

/**
 * Chọn giới tính
 */
function selectGender(gender) {
    document.querySelectorAll('.gender-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelector(`[data-gender="${gender}"]`).classList.add('selected');
    characterCreation.selectedGender = gender;
}

/**
 * Điều chỉnh thuộc tính
 */
function adjustAttribute(attr, delta) {
    const current = characterCreation.baseAttributes[attr];
    const newValue = current + delta;

    // Khi giảm điểm: thuộc tính không được thấp hơn 5
    if (delta < 0 && newValue < 5) {
        alert('Thuộc tính không được thấp hơn 5 điểm!');
        return;
    }

    // Khi tăng điểm: kiểm tra điểm dư có đủ không
    if (delta > 0 && characterCreation.remainingPoints < 1) {
        alert('Không đủ điểm! Vui lòng hủy bớt thiên phú hoặc chọn xuất thân/thiên phú tăng thêm điểm.');
        return;
    }

    // Cập nhật thuộc tính
    characterCreation.baseAttributes[attr] = newValue;
    characterCreation.remainingPoints -= delta;

    // Cập nhật hiển thị
    updateAttributesDisplay();
    updatePointsDisplay();
}

/**
 * Cập nhật hiển thị thuộc tính (Thuộc tính cơ bản + Cộng thêm từ thiên phú)
 */
function updateAttributesDisplay() {
    // Tính toán điểm cộng từ thiên phú
    const talentBonus = {
        physique: 0,
        fortune: 0,
        comprehension: 0,
        spirit: 0,
        potential: 0,
        charisma: 0,
        karmaFortune: 0,
        karmaPunishment: 0
    };

    characterCreation.selectedTalents.forEach(talentId => {
        const talent = window.talents.find(t => t.id === talentId);
        if (talent && talent.effects) {
            Object.entries(talent.effects).forEach(([attr, value]) => {
                if (talentBonus[attr] !== undefined) {
                    talentBonus[attr] += value;
                }
            });
        }
    });

    // Cập nhật hiển thị cho từng thuộc tính
    Object.keys(characterCreation.baseAttributes).forEach(attr => {
        const baseValue = characterCreation.baseAttributes[attr];
        const bonus = talentBonus[attr] || 0;
        const finalValue = baseValue + bonus;

        const valueElement = document.getElementById(`${attr}-value`);
        if (valueElement) {
            if (bonus !== 0) {
                // Hiển thị: Giá trị cơ bản + Cộng thêm = Giá trị cuối
                valueElement.innerHTML = `${baseValue} <span style="color: ${bonus > 0 ? '#28a745' : '#dc3545'}; font-size: 12px;">${bonus > 0 ? '+' : ''}${bonus}</span> = <span style="color: #667eea;">${finalValue}</span>`;
            } else {
                valueElement.textContent = baseValue;
            }
        }
    });
}

/**
 * Cập nhật hiển thị điểm dư
 */
function updatePointsDisplay() {
    document.getElementById('remainingPoints').textContent = characterCreation.remainingPoints;

    // Cập nhật trạng thái của tất cả các nút tăng giảm
    const canAdd = characterCreation.remainingPoints > 0;
    document.querySelectorAll('.attr-btn').forEach(btn => {
        if (btn.textContent === '+') {
            btn.disabled = !canAdd;
        }
    });
}

/**
 * Xác nhận tạo nhân vật
 */
function confirmCharacterCreation() {
    // Lấy thông tin nhập vào
    const name = document.getElementById('charNameInput').value.trim();
    const age = parseInt(document.getElementById('charAgeInput').value) || 18;
    const personality = document.getElementById('charPersonality').value.trim();
    const customSettings = document.getElementById('customSettings').value.trim();

    if (!name) {
        alert('Vui lòng nhập tên nhân vật!');
        return;
    }

    if (age < 1 || age > 999) {
        alert('Vui lòng nhập tuổi hợp lệ (1-999)!');
        return;
    }

    // Tính toán thuộc tính cuối cùng (Cơ bản + Hiệu ứng thiên phú)
    const finalAttributes = { ...characterCreation.baseAttributes };
    let karmaFortune = 0;
    let karmaPunishment = 0;
    const selectedTalentNames = [];

    characterCreation.selectedTalents.forEach(talentId => {
        const talent = window.talents.find(t => t.id === talentId);
        if (talent) {
            selectedTalentNames.push(talent.name);
            Object.entries(talent.effects).forEach(([attr, value]) => {
                if (attr === 'karmaFortune') {
                    karmaFortune += value;
                } else if (attr === 'karmaPunishment') {
                    karmaPunishment += value;
                } else if (finalAttributes[attr] !== undefined) {
                    finalAttributes[attr] += value;
                }
            });
        }
    });

    // Lấy xuất thân đã chọn
    const selectedOrigin = origins.find(o => o.id === characterCreation.selectedOrigin);
    const originName = selectedOrigin ? selectedOrigin.name : 'Phàm Nhân';

    // Cập nhật trạng thái game
    gameState.variables.name = name;
    gameState.variables.age = age;
    gameState.variables.gender = characterCreation.selectedGender === 'male' ? 'Nam' : 'Nữ';
    gameState.variables.realm = '';
    gameState.variables.location = '';
    gameState.variables.spiritStones = 0;  // Linh thạch khởi đầu
    gameState.variables.talents = selectedTalentNames;
    gameState.variables.attributes = finalAttributes;
    gameState.variables.karmaFortune = karmaFortune;
    gameState.variables.karmaPunishment = karmaPunishment;

    // Khởi tạo mảng công pháp và pháp thuật
    gameState.variables.techniques = [];
    gameState.variables.spells = [];

    // Thêm lịch sử bản thân
    const talentDesc = selectedTalentNames.length > 0 ? `Sở hữu thiên phú: ${selectedTalentNames.join(', ')}.` : '';
    gameState.variables.history = [
        `${name}, ${age} tuổi, giới tính ${gameState.variables.gender}, tính cách ${personality}. Xuất thân: ${originName}. ${talentDesc}`
    ];

    // Cập nhật UI
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // Xây dựng thông tin nhân vật để truyền cho AI
    const characterInfo = {
        name: name,
        age: age,
        gender: gameState.variables.gender,
        personality: personality,
        difficulty: characterCreation.difficulty,
        origin: originName,
        customSettings: customSettings,
        talents: selectedTalentNames,
        attributes: finalAttributes
    };

    // Lưu thông tin nhân vật dùng cho khởi đầu game
    gameState.characterInfo = characterInfo;

    // Xóa vùng lịch sử game và hiển thị thông báo đang tải
    const historyDiv = document.getElementById('gameHistory');
    historyDiv.innerHTML = `
        <div class="message ai-message loading-message">
            <div class="cyber-loader">
                <div class="cyber-loader-content">
                    <div class="cyber-scanner"></div>
                    <div class="cyber-text glitch-text" data-text="SYSTEM INITIALIZING...">SYSTEM INITIALIZING...</div>
                    <div class="cyber-subtext">Đang xây dựng thế giới quan...</div>
                    <div class="cyber-progress">
                        <div class="cyber-progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Tự động bắt đầu trò chơi
    if (typeof startGame === 'function') {
        startGame();
    }
}

/**
 * Hiển thị giao diện tạo nhân vật trong vùng lịch sử game
 */
function displayCharacterCreationInHistory() {
    const historyDiv = document.getElementById('gameHistory');

    // Sử dụng hàm tạo giao diện tạo nhân vật từ file cấu hình
    if (window.XiuxianGameConfig && window.XiuxianGameConfig.generateCharacterCreation) {
        historyDiv.innerHTML = window.XiuxianGameConfig.generateCharacterCreation();
    } else {
        // Dự phòng: Nếu file cấu hình chưa tải, hiển thị thông báo đơn giản
        historyDiv.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #999;">
                <h2>⚠️ File cấu hình chưa được tải</h2>
                <p>Vui lòng đảm bảo file cấu hình game (như xiuxian-config.js) đã được tải chính xác</p>
            </div>
        `;
        console.error('[Tạo nhân vật] File cấu hình chưa tải hoặc thiếu hàm generateCharacterCreation');
        return;
    }

    // Đặt lại trạng thái tạo nhân vật
    characterCreation.difficulty = 'normal';
    characterCreation.maxPoints = 100;
    characterCreation.remainingPoints = 100;
    characterCreation.selectedOrigin = '';
    characterCreation.selectedTalents = [];
    characterCreation.selectedGender = 'male';
    characterCreation.selectedOrigin = 'commoner';

    // Khởi tạo danh sách ngay lập tức (DOM đã được chèn)
    setTimeout(() => {
        try {
            initializeOrigins();
            initializeTalents();
            updateAttributesDisplay();
            updatePointsDisplay();
            console.log('[Tạo nhân vật] ✅ Khởi tạo tất cả thành phần hoàn tất');
        } catch (error) {
            console.error('[Tạo nhân vật] ❌ Khởi tạo thành phần thất bại:', error);
        }
    }, 50); // Trì hoãn ngắn để đảm bảo DOM được render hoàn toàn
}

/**
 * Hàm phụ trợ: Lấy tên tiếng Việt của thuộc tính
 */
function getAttributeName(attr) {
    const nameMap = {
        physique: 'Căn Cốt',
        fortune: 'Khí Vận',
        comprehension: 'Ngộ Tính',
        spirit: 'Thần Thức',
        potential: 'Tiềm Lực',
        charisma: 'Mị Lực',
        karmaFortune: 'Cơ Duyên',
        karmaPunishment: 'Thiên Khiển'
    };
    return nameMap[attr] || attr;
}

// ==================== Thuyết minh phụ thuộc ====================
// Module này phụ thuộc vào các biến toàn cục sau:
// - gameState (Trạng thái game)
// - characterCreation (Trạng thái tạo nhân vật)
// - origins (Danh sách xuất thân, từ bhz-config.js)
// - talents (Danh sách thiên phú, từ bhz-config.js)
// - updateStatusPanel() (Hàm cập nhật bảng trạng thái, trong game.html)
// - startGame() (Hàm bắt đầu game, trong game.html)