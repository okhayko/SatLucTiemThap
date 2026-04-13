/**
 * Trò chơi Tu Tiên - Cấu hình kỹ năng chiến đấu
 * Bao gồm cấu hình đầy đủ của công pháp và pháp thuật, phân loại theo cảnh giới
 */

// Cấu hình cảnh giới: Định nghĩa phạm vi chỉ số cho mỗi cảnh giới
const REALM_CONFIG = {
    0: { // Phàm nhân
        name: "Phàm nhân",
        hp: { min: 50, max: 100 },
        mp: { min: 0, max: 50 },
        physique: { min: 3, max: 8 },      // Căn cốt
        comprehension: { min: 3, max: 8 }, // Ngộ tính
        spirituality: { min: 3, max: 8 },  // Thần thức
        luck: { min: 3, max: 8 },         // Khí vận
        charm: { min: 3, max: 8 },        // Mị lực
        willpower: { min: 3, max: 8 }     // Ý chí
    },
    1: { // Luyện Khí Kỳ
        name: "Luyện Khí Kỳ",
        hp: { min: 100, max: 200 },
        mp: { min: 80, max: 150 },
        physique: { min: 8, max: 15 },
        comprehension: { min: 8, max: 15 },
        spirituality: { min: 8, max: 15 },
        luck: { min: 8, max: 15 },
        charm: { min: 8, max: 15 },
        willpower: { min: 8, max: 15 }
    },
    2: { // Trúc Cơ Kỳ
        name: "Trúc Cơ Kỳ",
        hp: { min: 200, max: 400 },
        mp: { min: 150, max: 300 },
        physique: { min: 15, max: 25 },
        comprehension: { min: 15, max: 25 },
        spirituality: { min: 15, max: 25 },
        luck: { min: 15, max: 25 },
        charm: { min: 15, max: 25 },
        willpower: { min: 15, max: 25 }
    },
    3: { // Kim Đan Kỳ
        name: "Kim Đan Kỳ",
        hp: { min: 400, max: 800 },
        mp: { min: 300, max: 600 },
        physique: { min: 25, max: 40 },
        comprehension: { min: 25, max: 40 },
        spirituality: { min: 25, max: 40 },
        luck: { min: 25, max: 40 },
        charm: { min: 25, max: 40 },
        willpower: { min: 25, max: 40 }
    },
    4: { // Nguyên Anh Kỳ
        name: "Nguyên Anh Kỳ",
        hp: { min: 800, max: 1500 },
        mp: { min: 600, max: 1200 },
        physique: { min: 40, max: 60 },
        comprehension: { min: 40, max: 60 },
        spirituality: { min: 40, max: 60 },
        luck: { min: 40, max: 60 },
        charm: { min: 40, max: 60 },
        willpower: { min: 40, max: 60 }
    },
    5: { // Hóa Thần Kỳ
        name: "Hóa Thần Kỳ",
        hp: { min: 1500, max: 3000 },
        mp: { min: 1200, max: 2400 },
        physique: { min: 60, max: 80 },
        comprehension: { min: 60, max: 80 },
        spirituality: { min: 60, max: 80 },
        luck: { min: 60, max: 80 },
        charm: { min: 60, max: 80 },
        willpower: { min: 60, max: 80 }
    }
};

// Kho Công Pháp - Phân loại theo cảnh giới
const TECHNIQUES = {
    // Phàm nhân & Luyện Khí Kỳ
    0: [
        {
            name: "Cơ Bản Luyện Thể Công",
            power: 20,
            mpCost: 10,
            cooldown: 0,
            effects: [],
            description: "Pháp môn luyện thể cơ bản nhất, cường hóa nhục thân"
        },
        {
            name: "Nạp Khí Quyết",
            power: 25,
            mpCost: 15,
            cooldown: 1,
            effects: [{type: "heal", value: 10, duration: 0}],
            description: "Hấp thụ linh khí thiên địa, hồi phục một lượng nhỏ sinh mệnh"
        },
        {
            name: "Huyền Nguyên Kình",
            power: 30,
            mpCost: 20,
            cooldown: 2,
            effects: [],
            description: "Ngưng tụ sức mạnh Huyền Nguyên, tạo ra đòn tấn công mạnh mẽ"
        }
    ],
    1: [
        {
            name: "Thanh Vân Tâm Pháp",
            power: 45,
            mpCost: 30,
            cooldown: 1,
            effects: [],
            description: "Tâm pháp cơ bản của Thanh Vân Tông, khí tức kéo dài"
        },
        {
            name: "Thái Tố Dưỡng Nguyên Công",
            power: 40,
            mpCost: 25,
            cooldown: 0,
            effects: [{type: "heal", value: 20, duration: 0}],
            description: "Dưỡng nguyên cố bản, hồi phục khí huyết"
        },
        {
            name: "Huyền Minh Chân Kình",
            power: 55,
            mpCost: 40,
            cooldown: 2,
            effects: [{type: "weaken", value: 0.8, duration: 2}],
            description: "Sức mạnh Huyền Minh ăn mòn kẻ địch, giảm sức tấn công của chúng"
        },
        {
            name: "Tử Tiêu Chân Nguyên Quyết",
            power: 60,
            mpCost: 45,
            cooldown: 3,
            effects: [],
            description: "Ngưng luyện Tử Tiêu chân nguyên, bùng nổ sức mạnh cường đại"
        }
    ],
    // Trúc Cơ Kỳ
    2: [
        {
            name: "Thái Thượng Thanh Tĩnh Kinh",
            power: 80,
            mpCost: 50,
            cooldown: 1,
            effects: [{type: "heal", value: 30, duration: 0}],
            description: "Tâm pháp thượng thừa của Đạo gia, thanh tĩnh dưỡng nguyên"
        },
        {
            name: "Cửu Chuyển Huyền Công",
            power: 95,
            mpCost: 65,
            cooldown: 2,
            effects: [{type: "shield", value: 40, duration: 2}],
            description: "Cửu chuyển luyện thể, ngưng tụ hộ thể chân nguyên"
        },
        {
            name: "Thiên Cang Bắc Đẩu Quyết",
            power: 110,
            mpCost: 75,
            cooldown: 3,
            effects: [{type: "stun", value: 1, duration: 1}],
            description: "Dẫn động sức mạnh Thiên Cang, có xác suất làm choáng kẻ địch"
        },
        {
            name: "Ngũ Hành Tạo Hóa Công",
            power: 100,
            mpCost: 70,
            cooldown: 2,
            effects: [],
            description: "Ngũ hành lực tuần hoàn, uy lực to lớn"
        }
    ],
    // Kim Đan Kỳ
    3: [
        {
            name: "Thái Ất Huyền Nguyên Kim Đan Quyết",
            power: 150,
            mpCost: 100,
            cooldown: 2,
            effects: [{type: "shield", value: 60, duration: 2}],
            description: "Chí cao tâm pháp Kim Đan kỳ, hộ thể kim quang"
        },
        {
            name: "Cửu Thiên Ứng Nguyên Lôi Thanh Quyết",
            power: 180,
            mpCost: 120,
            cooldown: 3,
            effects: [{type: "burn", value: 20, duration: 3}],
            description: "Dẫn động Cửu Thiên lôi đình, thiêu đốt kẻ địch"
        },
        {
            name: "Hỗn Nguyên Nhất Khí Công",
            power: 160,
            mpCost: 105,
            cooldown: 2,
            effects: [{type: "heal", value: 50, duration: 0}],
            description: "Hỗn nguyên quy nhất, hồi phục lượng lớn khí huyết"
        },
        {
            name: "Bắc Minh Thần Công Thôn Phệ Quyết",
            power: 170,
            mpCost: 115,
            cooldown: 4,
            effects: [{type: "absorb", value: 0.3, duration: 0}],
            description: "Thôn phệ chân nguyên kẻ địch, chuyển hóa thành của mình"
        }
    ],
    // Nguyên Anh Kỳ
    4: [
        {
            name: "Tử Tiêu Thần Lôi Diệt Thế Kinh",
            power: 240,
            mpCost: 160,
            cooldown: 3,
            effects: [{type: "burn", value: 35, duration: 3}],
            description: "Tử Tiêu thần lôi giáng thế, thiêu rụi vạn vật"
        },
        {
            name: "Thái Thượng Động Huyền Nguyên Anh Quyết",
            power: 220,
            mpCost: 145,
            cooldown: 2,
            effects: [{type: "shield", value: 80, duration: 3}],
            description: "Nguyên anh hộ thể, kiên cố như bàn thạch"
        },
        {
            name: "Cửu Chuyển Hoàn Đan Tạo Hóa Công",
            power: 210,
            mpCost: 140,
            cooldown: 3,
            effects: [{type: "heal", value: 80, duration: 0}],
            description: "Cửu chuyển hoàn đan, sinh sinh bất tức"
        },
        {
            name: "Thiên Địa Đại Diễn Chân Nguyên Quyết",
            power: 260,
            mpCost: 175,
            cooldown: 4,
            effects: [{type: "weaken", value: 0.6, duration: 3}],
            description: "Dùng sức mạnh thiên địa áp chế kẻ địch"
        }
    ],
    // Hóa Thần Kỳ
    5: [
        {
            name: "Thái Cổ Hỗn Độn Thần Ma Quyết",
            power: 350,
            mpCost: 230,
            cooldown: 3,
            effects: [{type: "burn", value: 50, duration: 3}],
            description: "Sức mạnh hỗn độn, thiêu rụi mọi thứ"
        },
        {
            name: "Cửu Thiên Huyền Nữ Nguyên Thần Kinh",
            power: 320,
            mpCost: 210,
            cooldown: 2,
            effects: [{type: "shield", value: 120, duration: 3}],
            description: "Nguyên thần hộ thể, vạn pháp bất xâm"
        },
        {
            name: "Tiên Thiên Tạo Hóa Sinh Tử Luân",
            power: 330,
            mpCost: 220,
            cooldown: 4,
            effects: [{type: "absorb", value: 0.4, duration: 0}],
            description: "Sinh tử luân chuyển, tước đoạt sinh mệnh kẻ địch"
        },
        {
            name: "Tử Vi Tinh Thần Vạn Pháp Quy Tông",
            power: 380,
            mpCost: 250,
            cooldown: 5,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "weaken", value: 0.5, duration: 3}],
            description: "Ánh sao Tử Vi chiếu rọi, trấn áp tất cả"
        }
    ]
};

// Kho Pháp Thuật - Phân loại theo cảnh giới
const SPELLS = {
    // Phàm nhân & Luyện Khí Kỳ
    0: [
        {
            name: "Hỏa Cầu Thuật",
            power: 15,
            mpCost: 8,
            cooldown: 0,
            effects: [],
            description: "Ngưng tụ hỏa diễm, ném về phía kẻ địch"
        },
        {
            name: "Băng Chùy Thuật",
            power: 18,
            mpCost: 10,
            cooldown: 1,
            effects: [{type: "slow", value: 0.8, duration: 1}],
            description: "Băng chùy thấu xương, làm chậm tốc độ kẻ địch"
        },
        {
            name: "Tật Phong Trảm",
            power: 22,
            mpCost: 12,
            cooldown: 1,
            effects: [],
            description: "Lưỡi đao gió cắt ngang, nhanh tựa gió lốc"
        }
    ],
    1: [
        {
            name: "Liệt Diễm Phần Không Chú",
            power: 35,
            mpCost: 22,
            cooldown: 1,
            effects: [{type: "burn", value: 5, duration: 3}],
            description: "Lửa cháy bừng bừng, gây sát thương liên tục"
        },
        {
            name: "Huyền Băng Phong Ấn",
            power: 40,
            mpCost: 28,
            cooldown: 2,
            effects: [{type: "freeze", value: 1, duration: 1}],
            description: "Băng phong kẻ địch, khiến chúng không thể hành động"
        },
        {
            name: "Lôi Đình Vạn Quân",
            power: 50,
            mpCost: 35,
            cooldown: 2,
            effects: [],
            description: "Lôi đình oanh kích, uy lực mạnh mẽ"
        },
        {
            name: "Phong Nhẫn Loạn Vũ",
            power: 45,
            mpCost: 30,
            cooldown: 1,
            effects: [],
            description: "Đao gió múa loạn, tấn công liên tiếp"
        }
    ],
    // Trúc Cơ Kỳ
    2: [
        {
            name: "Bích Lạc Hoàng Tuyền Nhiếp Hồn Thuật",
            power: 70,
            mpCost: 45,
            cooldown: 2,
            effects: [{type: "weaken", value: 0.75, duration: 2}],
            description: "Nhiếp lấy thần hồn, làm suy yếu kẻ địch"
        },
        {
            name: "Cửu Thiên Huyền Hỏa Sát Thần Chú",
            power: 85,
            mpCost: 55,
            cooldown: 2,
            effects: [{type: "burn", value: 12, duration: 3}],
            description: "Sát khí huyền hỏa, thiêu đốt không ngừng"
        },
        {
            name: "Hàn Băng Cực Quang Đông Kết Thuật",
            power: 75,
            mpCost: 50,
            cooldown: 3,
            effects: [{type: "freeze", value: 1, duration: 1}],
            description: "Ánh sáng cực hàn, đóng băng vạn vật"
        },
        {
            name: "Tử Tiêu Thần Lôi Giáng Lâm",
            power: 95,
            mpCost: 65,
            cooldown: 3,
            effects: [{type: "stun", value: 1, duration: 1}],
            description: "Thần lôi giáng thế, uy hiếp kẻ địch"
        }
    ],
    // Kim Đan Kỳ
    3: [
        {
            name: "Thiên Địa Huyền Hoàng Diệt Hồn Chú",
            power: 130,
            mpCost: 85,
            cooldown: 3,
            effects: [{type: "weaken", value: 0.6, duration: 3}],
            description: "Sức mạnh Huyền Hoàng, diệt sát thần hồn"
        },
        {
            name: "Tam Muội Chân Hỏa Phần Thiên Thuật",
            power: 155,
            mpCost: 100,
            cooldown: 3,
            effects: [{type: "burn", value: 25, duration: 3}],
            description: "Tam Muội Chân Hỏa, thiêu cháy chư thiên"
        },
        {
            name: "Cửu U Băng Phách Tuyệt Diệt Trận",
            power: 140,
            mpCost: 90,
            cooldown: 4,
            effects: [{type: "freeze", value: 1, duration: 2}],
            description: "Cửu U băng phách, đóng băng tất cả"
        },
        {
            name: "Ngũ Lôi Chính Pháp Oanh Thiên Quyết",
            power: 165,
            mpCost: 110,
            cooldown: 4,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "burn", value: 15, duration: 2}],
            description: "Ngũ lôi oanh đỉnh, thiên phạt giáng lâm"
        }
    ],
    // Nguyên Anh Kỳ
    4: [
        {
            name: "Thái Ất Thiên Cang Lôi Kiếp Chú",
            power: 210,
            mpCost: 140,
            cooldown: 3,
            effects: [{type: "burn", value: 30, duration: 3}],
            description: "Thiên Cang lôi kiếp, hủy diệt mọi thứ"
        },
        {
            name: "Cửu Thiên Ứng Nguyên Phổ Hóa Lôi Thanh",
            power: 230,
            mpCost: 155,
            cooldown: 4,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "weaken", value: 0.65, duration: 3}],
            description: "Lôi thanh phổ hóa, răn đe quần địch"
        },
        {
            name: "Đại Hoang Thiên Viêm Phần Thế Thuật",
            power: 245,
            mpCost: 165,
            cooldown: 4,
            effects: [{type: "burn", value: 40, duration: 4}],
            description: "Thiên viêm phần thế, không gì không cháy"
        },
        {
            name: "Vạn Pháp Quy Tông Huyền Nguyên Quyết",
            power: 200,
            mpCost: 130,
            cooldown: 3,
            effects: [{type: "absorb", value: 0.25, duration: 0}],
            description: "Vạn pháp quy tông, hấp thụ sức mạnh kẻ địch"
        }
    ],
    // Hóa Thần Kỳ
    5: [
        {
            name: "Hỗn Độn Thần Lôi Khai Thiên Quyết",
            power: 320,
            mpCost: 210,
            cooldown: 4,
            effects: [{type: "burn", value: 45, duration: 4}, {type: "stun", value: 1, duration: 1}],
            description: "Hỗn Độn lôi đình, khai thiên lập địa"
        },
        {
            name: "Thái Cổ Tinh Thần Vân Lạc Thuật",
            power: 340,
            mpCost: 225,
            cooldown: 5,
            effects: [{type: "weaken", value: 0.5, duration: 4}],
            description: "Tinh tú rơi xuống, trấn áp vạn vật"
        },
        {
            name: "Cửu Thiên Huyền Nữ U Minh Chú",
            power: 310,
            mpCost: 205,
            cooldown: 4,
            effects: [{type: "poison", value: 35, duration: 4}],
            description: "Lời nguyền u minh, ăn mòn sinh mệnh"
        },
        {
            name: "Tiên Thiên Ngũ Hành Diệt Thế Trận",
            power: 360,
            mpCost: 240,
            cooldown: 6,
            effects: [{type: "burn", value: 50, duration: 4}, {type: "weaken", value: 0.55, duration: 3}],
            description: "Sức mạnh Ngũ Hành, đại trận diệt thế"
        }
    ]
};

// Mô tả hiệu ứng trạng thái
const EFFECT_DESCRIPTIONS = {
    burn: "🔥 Thiêu đốt",
    poison: "☠️ Trúng độc",
    freeze: "❄️ Đóng băng",
    stun: "💫 Choáng váng",
    slow: "🐌 Giảm tốc",
    weaken: "⬇️ Suy yếu",
    shield: "🛡️ Hộ thuẫn",
    heal: "💚 Trị thương",
    absorb: "🌀 Hấp thụ"
};

// Tạo dữ liệu kẻ địch ngẫu nhiên dựa trên cảnh giới
function generateEnemyByRealm(realmLevel, name = "Kẻ địch") {
    const config = REALM_CONFIG[realmLevel] || REALM_CONFIG[1];
    
    // Gieo xúc xắc tạo thuộc tính cơ bản
    const hp = rollDice(config.hp.min, config.hp.max);
    const mp = rollDice(config.mp.min, config.mp.max);
    
    // Tạo thuộc tính lục vị
    const attributes = {
        physique: rollDice(config.physique.min, config.physique.max),
        comprehension: rollDice(config.comprehension.min, config.comprehension.max),
        spirituality: rollDice(config.spirituality.min, config.spirituality.max),
        luck: rollDice(config.luck.min, config.luck.max),
        charm: rollDice(config.charm.min, config.charm.max),
        willpower: rollDice(config.willpower.min, config.willpower.max)
    };
    
    // Chọn ngẫu nhiên công pháp (2-3 cái)
    const techniqueCount = rollDice(2, 3);
    const availableTechniques = TECHNIQUES[realmLevel] || TECHNIQUES[1];
    const techniques = getRandomItems(availableTechniques, techniqueCount);
    
    // Chọn ngẫu nhiên pháp thuật (2-3 cái)
    const spellCount = rollDice(2, 3);
    const availableSpells = SPELLS[realmLevel] || SPELLS[1];
    const spells = getRandomItems(availableSpells, spellCount);
    
    return {
        name: name,
        realm: config.name,
        realmLevel: realmLevel,
        hp: hp,
        hpMax: hp,
        mp: mp,
        mpMax: mp,
        attributes: attributes,
        techniques: techniques,
        spells: spells,
        effects: [] // Trạng thái đang có hiệu lực
    };
}

// Tạo số ngẫu nhiên
function rollDice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Lấy N phần tử không trùng lặp ngẫu nhiên từ mảng
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

// Xuất cấu hình
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REALM_CONFIG,
        TECHNIQUES,
        SPELLS,
        EFFECT_DESCRIPTIONS,
        generateEnemyByRealm,
        rollDice,
        getRandomItems
    };
}
