/**
 * Tháp Cao ACJT - Hệ thống Bài
 * Card System for ACJT Game
 */
// ==================== Enum Loại Bài ====================
const CardType = {
    ATTACK: 'attack',           // Tấn công
    H_ATTACK: 'h_attack',       // Tấn công Đặc biệt (H-Attack)
    HEAL: 'heal',               // Hồi máu
    BUFF: 'buff',               // Tăng sức mạnh cho Ta
    DEBUFF: 'debuff',           // Giảm sức mạnh kẻ địch
    ARMOR: 'armor',             // Giáp
    CURSE: 'curse'              // Lời nguyền (Kỹ năng H của địch, không thể tung ra)
};
// ==================== Loại Bài Tuyến Đường ====================
const RouteType = {
    UNKNOWN: 'unknown',         // Bài dấu hỏi (Sự kiện ngẫu nhiên)
    MONSTER: 'monster',         // Bài Quái thường
    ELITE: 'elite',             // Bài Quái tinh anh
    BOSS: 'boss',               // Bài Trùm
    SHOP: 'shop',               // Bài Cửa hàng
    REST: 'rest'                // Bài Suối nước nóng (Nghỉ ngơi/Nâng cấp)
};
const RouteTypeConfig = {
    [RouteType.UNKNOWN]: { name: '???', icon: '❓', color: '#9c88ff', desc: 'Sự kiện ngẫu nhiên' },
    [RouteType.MONSTER]: { name: 'Quái Thường', icon: '👹', color: '#ff4757', desc: 'Gặp gỡ chiến đấu' },
    [RouteType.ELITE]: { name: 'Tinh Anh', icon: '💀', color: '#ffa502', desc: 'Chiến đấu Tinh anh' },
    [RouteType.BOSS]: { name: 'Trùm', icon: '👿', color: '#ff0000', desc: 'Chiến đấu Boss' },
    [RouteType.SHOP]: { name: 'Cửa Hàng', icon: '🏪', color: '#2ed573', desc: 'Mua bài và Thánh di vật' },
    [RouteType.REST]: { name: 'Suối Nước Nóng', icon: '♨️', color: '#70a1ff', desc: 'Nghỉ ngơi hoặc nâng cấp bài' }
};
// ==================== Hệ thống Ý định của Kẻ địch ====================
const EnemyIntentType = {
    ATTACK: 'attack',           // Tấn công
    DEFEND: 'defend',           // Phòng thủ (Nhận Giáp)
    BUFF: 'buff',               // Tăng cường bản thân
    DEBUFF: 'debuff',           // Làm suy yếu người chơi
    CHARGE: 'charge',           // Nạp năng lượng (Chiêu cuối lượt sau)
    HEAL: 'heal',               // Hồi máu cho bản thân
    SPECIAL: 'special'          // Kỹ năng đặc trưng của Boss
};
const EnemyIntentConfig = {
    [EnemyIntentType.ATTACK]: { name: 'Tấn Công', icon: '⚔️', color: '#ff4757', desc: 'Gây sát thương' },
    [EnemyIntentType.DEFEND]: { name: 'Phòng Thủ', icon: '🛡️', color: '#74b9ff', desc: 'Nhận Giáp' },
    [EnemyIntentType.BUFF]: { name: 'Tăng Cường', icon: '💪', color: '#ffa502', desc: 'Tăng thuộc tính bản thân' },
    [EnemyIntentType.DEBUFF]: { name: 'Suy Yếu', icon: '💫', color: '#a55eea', desc: 'Giảm thuộc tính người chơi' },
    [EnemyIntentType.CHARGE]: { name: 'Nạp Năng Lượng', icon: '🔥', color: '#ff6348', desc: 'Chuẩn bị chiêu cuối' },
    [EnemyIntentType.HEAL]: { name: 'Hồi Máu', icon: '❤️', color: '#2ed573', desc: 'Phục hồi sinh mệnh' },
    [EnemyIntentType.SPECIAL]: { name: 'Đặc Thu', icon: '⭐', color: '#ffd700', desc: 'Kỹ năng Boss' }
};
// ==================== Hệ thống Hậu tố Bài (Affix) ====================
const CardAffixConfig = {
    burning: {
        id: 'burning', name: 'Cháy Bỏng', icon: '🔥', rarity: 'common',
        description: 'Gây thêm 3 điểm Cháy Bỏng (2 lượt)',
        effect: { type: 'dot', damage: 3, duration: 2 }
    },
    frozen: {
        id: 'frozen', name: 'Băng Đông', icon: '❄️', rarity: 'rare',
        description: 'Có 15% cơ hội đóng băng kẻ địch 1 lượt',
        effect: { type: 'freeze', chance: 0.15, duration: 1 }
    },
    vampiric: {
        id: 'vampiric', name: 'Hút Máu', icon: '🦷', rarity: 'rare',
        description: 'Phục hồi 20% sát thương gây ra bằng HP',
        effect: { type: 'lifesteal', percent: 0.2 }
    },
    poison: {
        id: 'poison', name: 'Kịch Độc', icon: '🧪', rarity: 'common',
        description: 'Gây thêm 2 điểm độc sát (3 lượt)',
        effect: { type: 'dot', damage: 2, duration: 3 }
    },
    echo: {
        id: 'echo', name: 'Tiếng Vọng', icon: '🔊', rarity: 'epic',
        description: 'Có 30% cơ hội kích hoạt hiệu ứng lần nữa',
        effect: { type: 'echo', chance: 0.3 }
    },
    swift: {
        id: 'swift', name: 'Nhanh Nhẹn', icon: '⚡', rarity: 'common',
        description: 'Sau khi sử dụng, rút thêm 1 lá bài',
        effect: { type: 'draw', count: 1 }
    },
    fortify: {
        id: 'fortify', name: 'Kiên Cố', icon: '🛡️', rarity: 'common',
        description: 'Nhận thêm 3 điểm Giáp',
        effect: { type: 'armor', value: 3 }
    },
    blessed: {
        id: 'blessed', name: 'Phúc Lành', icon: '✨', rarity: 'rare',
        description: 'Sau khi sử dụng, hồi phục 3 HP',
        effect: { type: 'heal', value: 3 }
    },
    cursed: {
        id: 'cursed', name: 'Lời Nguyền', icon: '💀', rarity: 'epic',
        description: 'Hiệu ứng tăng +50%, nhưng tăng thêm 3 điểm Suy thoái',
        effect: { type: 'empower', bonus: 0.5, corruption: 3 }
    },
    chaos: {
        id: 'chaos', name: 'Hỗn Độn', icon: '🌀', rarity: 'legendary',
        description: 'Ngẫu nhiên kích hoạt hiệu ứng của một Hậu tố khác',
        effect: { type: 'random' }
    }
};
const AffixRarityWeights = {
    common: 60,
    rare: 25,
    epic: 12,
    legendary: 3
};
// ==================== Hệ thống Nghề nghiệp (Profession) ====================
const ProfessionConfig = {
    nun: {
        id: 'nun',
        name: 'Tu Nữ',
        icon: 'img/user/nun.gif',  // Icon nghề Tu Nữ
        description: 'Vị tu nữ mộ đạo, giỏi hồi máu và tấn công thánh thần, sau khi Suy thoái sẽ mở khóa kỹ năng H cực mạnh.',
        baseStats: {
            hp: 70, maxHp: 70, energy: 3, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_006', 'attack_007',
            'heal_001', 'heal_001', 'heal_002', 'heal_003', 'heal_004', 'heal_005', 'heal_006', 'heal_007',
            'buff_001', 'buff_002', 'buff_003', 'buff_008', 'buff_009',
            'debuff_001', 'debuff_002', 'debuff_006',
            'armor_001', 'armor_001', 'armor_002', 'armor_003'
        ],
        professionCardPool: [
            'nun_001', 'nun_002', 'nun_003', 'nun_004', 'nun_005', 'nun_006',
            'nun_007', 'nun_008', 'nun_009', 'nun_010', 'nun_011', 'nun_012',
            'nun_013', 'nun_014', 'nun_015', 'nun_016', 'nun_017', 'nun_018',
            'nun_019', 'nun_020', 'nun_021', 'nun_022', 'nun_023', 'nun_024',
            'nun_025', 'nun_026', 'nun_027', 'nun_028', 'nun_029', 'nun_030'
        ],
        guaranteedCards: ['nun_001', 'nun_007', 'heal_001', 'armor_001', 'h_attack_001']
    },
    courtesan: {
        id: 'courtesan',
        name: 'Kỹ Nữ',
        icon: 'img/user/user_006.png',
        description: 'Thành thạo trong giới hoa lệ, giỏi làm suy yếu Tấn công và Phòng thủ của kẻ địch, một số kỹ năng có thể khống chế đối phương.',
        baseStats: {
            hp: 55, maxHp: 55, energy: 3, attack: 2, defense: 0, baseArmor: 0, corruption: 20
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_008',
            'heal_001', 'heal_002', 'heal_009',
            'buff_001', 'buff_003', 'buff_004', 'buff_005', 'buff_010',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_006', 'debuff_007', 'debuff_008',
            'armor_001', 'armor_002'
        ],
        professionCardPool: [
            'courtesan_001', 'courtesan_002', 'courtesan_003', 'courtesan_004', 'courtesan_005',
            'courtesan_006', 'courtesan_007', 'courtesan_008', 'courtesan_009', 'courtesan_010',
            'courtesan_011', 'courtesan_012', 'courtesan_013', 'courtesan_014', 'courtesan_015',
            'courtesan_016', 'courtesan_017', 'courtesan_018', 'courtesan_019', 'courtesan_020',
            'courtesan_021', 'courtesan_022', 'courtesan_023', 'courtesan_024', 'courtesan_025'
        ],
        guaranteedCards: ['courtesan_001', 'courtesan_006', 'courtesan_019', 'h_attack_001', 'h_attack_002']
    },
    commoner: {
        id: 'commoner',
        name: 'Bình Dân',
        icon: 'img/user/user_004.png',
        description: 'Trí tuệ và sự kiên cường của người bình thường, tiêu phí thấp hiệu suất cao, giỏi rút bài và kiếm vàng.',
        baseStats: {
            hp: 65, maxHp: 65, energy: 3, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        startingGold: 150,
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_006',
            'heal_001', 'heal_002', 'heal_003', 'heal_004',
            'buff_001', 'buff_002', 'buff_003', 'buff_004', 'buff_005', 'buff_006',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004',
            'armor_001', 'armor_001', 'armor_002', 'armor_003', 'armor_004'
        ],
        professionCardPool: [
            'commoner_001', 'commoner_002', 'commoner_003', 'commoner_004', 'commoner_005',
            'commoner_006', 'commoner_007', 'commoner_008', 'commoner_009', 'commoner_010',
            'commoner_011', 'commoner_012', 'commoner_013', 'commoner_014', 'commoner_015',
            'commoner_016', 'commoner_017', 'commoner_018', 'commoner_019', 'commoner_020'
        ],
        guaranteedCards: ['commoner_001', 'commoner_004', 'commoner_011', 'heal_001', 'armor_001']
    },
    thief: {
        id: 'thief',
        name: 'Trộm Cướp',
        icon: 'img/user/user_002.png',
        description: 'Kẻ trộm lanh lợi, giỏi gây sát thương theo thời gian và rút bài, dùng độc và chảy máu từ từ làm hao mòn kẻ địch.',
        baseStats: {
            hp: 50, maxHp: 50, energy: 4, attack: 3, defense: 0, baseArmor: 0, corruption: 5
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_008',
            'heal_001', 'heal_009',
            'buff_001', 'buff_002', 'buff_004', 'buff_010',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_006', 'debuff_007',
            'armor_001', 'armor_006'
        ],
        professionCardPool: [
            'thief_001', 'thief_002', 'thief_003', 'thief_004', 'thief_005',
            'thief_006', 'thief_007', 'thief_008', 'thief_009', 'thief_010',
            'thief_011', 'thief_012', 'thief_013', 'thief_014', 'thief_015',
            'thief_016', 'thief_017', 'thief_018', 'thief_019', 'thief_020',
            'thief_021', 'thief_022', 'thief_023', 'thief_024', 'thief_025'
        ],
        guaranteedCards: ['thief_001', 'thief_002', 'thief_006', 'thief_007', 'armor_001']
    },
    warrior: {
        id: 'warrior',
        name: 'Chiến Sĩ',
        icon: 'img/user/user_005.png',
        description: 'Nữ chiến binh dũng mãnh, HP cao Giáp cao, khả năng giao chiến trực diện mạnh mẽ.',
        baseStats: {
            hp: 85, maxHp: 85, energy: 3, attack: 2, defense: 2, baseArmor: 5, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_006', 'attack_007',
            'heal_001', 'heal_002', 'heal_010', 'heal_011',
            'buff_001', 'buff_002', 'buff_006', 'buff_008',
            'debuff_001', 'debuff_002',
            'armor_001', 'armor_001', 'armor_002', 'armor_003', 'armor_004'
        ],
        professionCardPool: [
            'warrior_001', 'warrior_002', 'warrior_003', 'warrior_004', 'warrior_005',
            'warrior_006', 'warrior_007', 'warrior_008', 'warrior_009', 'warrior_010',
            'warrior_011', 'warrior_012', 'warrior_013', 'warrior_014', 'warrior_015'
        ],
        guaranteedCards: ['warrior_001', 'warrior_002', 'warrior_003', 'warrior_004', 'armor_001']
    },
    mage: {
        id: 'mage',
        name: 'Nữ Pháp Sư',
        icon: 'img/user/user_009.png',
        description: 'Pháp sư tinh thông phép thuật, pháp thuật gây sát thương cao, giỏi rút bài và tích lũy năng lượng.',
        baseStats: {
            hp: 45, maxHp: 45, energy: 4, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_006', 'attack_007',
            'heal_001', 'heal_005', 'heal_009',
            'buff_001', 'buff_002', 'buff_005', 'buff_008', 'buff_015',
            'debuff_001', 'debuff_002', 'debuff_006',
            'armor_001', 'armor_002'
        ],
        professionCardPool: [
            'mage_001', 'mage_002', 'mage_003', 'mage_004', 'mage_005',
            'mage_006', 'mage_007', 'mage_008', 'mage_009', 'mage_010',
            'mage_011', 'mage_012', 'mage_013', 'mage_014', 'mage_015',
            'mage_016', 'mage_017', 'mage_018', 'mage_019', 'mage_020',
            'mage_021', 'mage_022', 'mage_023', 'mage_024', 'mage_025'
        ],
        guaranteedCards: ['mage_001', 'mage_005', 'mage_015', 'mage_019', 'attack_001']
    },
    succubus_player: {
        id: 'succubus_player',
        name: 'Mị Ma',
        icon: 'img/user/user_013.png',
        description: 'Mị ma đến từ vực sâu, giỏi Hút Máu, hồi phục sinh mệnh đồng thời gây sát thương.',
        baseStats: {
            hp: 55, maxHp: 55, energy: 3, attack: 3, defense: 0, baseArmor: 0, corruption: 30
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_008',
            'heal_001', 'heal_009',
            'buff_001', 'buff_002', 'buff_004', 'buff_005',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_007',
            'armor_001'
        ],
        professionCardPool: [
            'succubus_p_001', 'succubus_p_002', 'succubus_p_003', 'succubus_p_004', 'succubus_p_005',
            'succubus_p_006', 'succubus_p_007', 'succubus_p_008', 'succubus_p_009', 'succubus_p_010',
            'succubus_p_011', 'succubus_p_012', 'succubus_p_013', 'succubus_p_014', 'succubus_p_015',
            'succubus_p_016', 'succubus_p_017', 'succubus_p_018', 'succubus_p_019', 'succubus_p_020'
        ],
        guaranteedCards: ['succubus_p_001', 'succubus_p_004', 'succubus_p_005', 'h_attack_001', 'h_attack_002']
    },
    // 🆕 Nghề nghiệp Pháp Sư Tí Hon (Magical Girl)
    magicalGirl: {
        id: 'magicalGirl',
        name: 'Pháp Sư Tí Hon',
        icon: 'img/user/user_012.png',
        description: 'Pháp sư có sức mạnh to lớn khi biến hình! Phải đánh bại kẻ địch trong thời gian biến hình, nếu không sẽ kiệt sức ngã gục! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
        baseStats: {
            hp: 50, maxHp: 50, energy: 3, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_006',
            'heal_001', 'heal_002',
            'buff_001', 'buff_002',
            'debuff_001', 'debuff_002',
            'armor_001', 'armor_002'
        ],
        professionCardPool: [
            'mg_001', 'mg_002', 'mg_003', 'mg_004', 'mg_005',
            'mg_006', 'mg_007', 'mg_008', 'mg_009', 'mg_010',
            'mg_011', 'mg_012', 'mg_013', 'mg_014', 'mg_015',
            'mg_016', 'mg_017', 'mg_018', 'mg_019', 'mg_020',
            'mg_021', 'mg_022', 'mg_023', 'mg_024', 'mg_025',
            'mg_026', 'mg_027', 'mg_028', 'mg_029', 'mg_030'
        ],
        guaranteedCards: ['mg_transform', 'mg_001', 'mg_002', 'mg_003', 'attack_001']
    }
};
// ==================== Hệ thống Chủng tộc (Race) ====================
const RaceConfig = {
    human: {
        id: 'human', name: 'Con Người', icon: '👩',
        description: 'Nữ nhân loại bình thường, thuộc tính cân bằng, không có ưu nhược điểm đặc biệt.',
        statMods: { hp: 0, attack: 0, defense: 0, energy: 0, corruption: 0 }
    },
    elf: {
        id: 'elf', name: 'Tinh Linh', icon: '‍♀️',
        description: 'Tộc tinh linh tao nhã, ma lực dồi dào nhưng thể chất tương đối yếu.',
        statMods: { hp: -10, attack: 0, defense: -1, energy: 1, corruption: 0 }
    },
    succubus: {
        id: 'succubus', name: 'Mị Ma', icon: '😈',
        description: 'Mị ma quyến rũ, bẩm sinh giỏi kỹ năng H, nhưng Phòng thủ thấp.',
        statMods: { hp: -5, attack: 3, defense: -2, energy: 0, corruption: 15 }
    },
    incubus: {
        id: 'incubus', name: 'Dâm Ma', icon: '👿',
        description: 'Dâm ma hóa thân dục vọng, Tấn công cực cao nhưng rất dễ bị Suy thoái.',
        statMods: { hp: -15, attack: 5, defense: -1, energy: 0, corruption: 30 }
    },
    catgirl: {
        id: 'catgirl', name: 'Mèo Nữ', icon: '🐱',
        description: 'Mèo nữ linh hoạt, khả năng Né tránh mạnh, giỏi tấn công liên hoàn.',
        statMods: { hp: -5, attack: 2, defense: 1, energy: 0, corruption: 5 }
    },
    foxgirl: {
        id: 'foxgirl', name: 'Cáo Nữ', icon: '🦊',
        description: 'Cáo nữ xảo quyệt, khả năng mê hoặc mạnh, sức chiến đấu tổng hợp cân bằng.',
        statMods: { hp: 0, attack: 1, defense: 0, energy: 0, corruption: 10 }
    }
};
// ==================== Cấu hình Thuộc tính Cơ thể ====================
const BodyConfig = {
    height: [
        { id: 'petite', name: 'Mảnh Khảnh (145-155cm)', desc: 'Vóc dáng nhỏ nhắn, tinh xảo' },
        { id: 'short', name: 'Hơi Thấp (155-160cm)', desc: 'Chiều cao nhỏ xinh đáng yêu' },
        { id: 'average', name: 'Trung Bình (160-165cm)', desc: 'Chiều cao thông thường' },
        { id: 'tall', name: 'Hơi Cao (165-170cm)', desc: 'Vóc dáng thon dài' },
        { id: 'model', name: 'Cao Ráo (170-175cm)', desc: 'Vóc dáng cao như người mẫu' },
        { id: 'amazon', name: 'Khổng Lồ (175cm+)', desc: 'Vóc dáng cao lớn mạnh mẽ' }
    ],
    weight: [
        { id: 'slim', name: 'Mảnh Dẻo', desc: 'Thon thả, mảnh mai' },
        { id: 'slender', name: 'Dáng Thon', desc: 'Thon gọn cân đối' },
        { id: 'average', name: 'Tiêu Chuẩn', desc: 'Vóc dáng chuẩn mực' },
        { id: 'curvy', name: 'Cong Cửa', desc: 'Đường cong đầy đặn' },
        { id: 'plump', name: 'Mũm Mĩm', desc: 'Tràn đầy cảm giác thịt' },
        { id: 'voluptuous', name: 'Mọng Nước', desc: 'Sung túc quyến rũ' }
    ],
    chest: [
        { id: 'A', name: 'Cúp A', desc: 'Ngực phẳng phiu' },
        { id: 'B', name: 'Cúp B', desc: 'Hai bầu nhỏ xinh' },
        { id: 'C', name: 'Cúp C', desc: 'Vòng ngực vừa phải' },
        { id: 'D', name: 'Cúp D', desc: 'Ngực đầy đặn' },
        { id: 'E', name: 'Cúp E', desc: 'Hai bầu lớn' },
        { id: 'F', name: 'Cúp F', desc: 'Ngực siêu to khổng lồ' }
    ],
    hips: [
        { id: 'slim', name: 'Mảnh Dẻo', desc: 'Hông thon gọn' },
        { id: 'petite', name: 'Nhỏ Xinh', desc: 'Vòng hông nhỏ nhắn, cong xinh' },
        { id: 'average', name: 'Trung Bình', desc: 'Vòng hông cân đối' },
        { id: 'round', name: 'Tròn Trĩnh', desc: 'Vòng hông tròn trịa đầy đặn' },
        { id: 'plump', name: 'Mập Mạp', desc: 'Hông mọng nước, béo tốt' },
        { id: 'huge', name: 'Siêu Hông', desc: 'Vòng hông khổng lồ quyến rũ' }
    ],
    vagina: [
        // ===== Phân loại ngoại hình =====
        { id: 'steamed_bun', name: 'Kiểu Bánh Bao', desc: '【Bánh Bao】Môi lớn đầy đặn, thịt cảm giác mạnh, tròn trịa đáng yêu' },
        { id: 'pink_butterfly', name: 'Bướm Hồng', desc: '【Bướm Hồng】Cánh hoa màu hồng nhạt mở ra như cánh bướm, mọng nước tươi tắn' },
        { id: 'black_butterfly', name: 'Bướm Đen', desc: '【Bướm Đen】Cánh bướm bung rộng, sắc màu sâu thẳm, trưởng thành quyến rũ' },
        { id: 'abalone', name: 'Kiểu Hàu', desc: '【Hàu】Lỗ nhỏ gọn khép kín bên ngoài, nhiều nếp gấp như hàu' },
        { id: 'conch', name: 'Kiểu Ốc Xà Cừ', desc: '【Ốc Xà Cừ】Nếp gấp xoắn ốc sâu thẳm, khúc quanh bí ẩn' },
        { id: 'cherry', name: 'Kiểu Cherry', desc: '【Cherry】Nhỏ nhắn xinh xắn màu hồng nhạt, đáng yêu bé bỏng' },
        { id: 'white_tiger', name: 'Bạch Hổ', desc: '【Bạch Hổ】Mịn màng không lông, trời sinh mỹ lệ như ngọc' },
        { id: 'peach', name: 'Kiểu Mật Đào', desc: '【Mật Đào】Đầy đặn tròn trịa như quả đào, nước dồi dào' },
        { id: 'virgin_tight', name: 'Một Đường Trời', desc: '【Một Đường Trời】Khép kín như đường chỉ rất nhỏ, là tuyệt phẩm trinh nguyên' },
        { id: 'lotus', name: 'Kiểu Sen', desc: '【Sen】Cánh hoa xếp lớp như sen nở, thanh nhã thoát tục' },
        // ===== Phân loại đặc điểm bên trong =====
        { id: 'octopus_pot', name: 'Bình Bạch Tuộc', desc: '【Bạch Tuộc】Lối vào nhỏ gọn nhưng bên trong rộng rãi, lực hút mạnh mẽ' },
        { id: 'thousand_worm', name: 'Ngàn Giun', desc: '【Ngàn Giun】Thành trong có nhiều nếp gấp bò trườn, quyến luyến mê hồn' },
        { id: 'bead_string', name: 'Kiểu Chuỗi Hạt', desc: '【Chuỗi Hạt】Bên trong các hạt như chuỗi ngọc trai, kích thích phi thường' },
        { id: 'spiral', name: 'Kiểu Xoắn Ốc', desc: '【Xoắn Ốc】Hoa văn xoay tròn bên trong, khít khao quyến luyến' },
        { id: 'velvet', name: 'Nhung', desc: '【Nhung】Bên trong mềm mại như nhung lụa, bao bọc dịu dàng' },
        { id: 'suction', name: 'Kiểu Hút', desc: '【Hút】Lực hút mạnh mẽ ghì chặt, không muốn buông' },
        { id: 'hot_spring', name: 'Kiểu Suối Nóng', desc: '【Suối Nóng】Bên trong ấm áp ẩm ướt, lượng nước dồi dào' },
        { id: 'honey_pot', name: 'Kiểu Mật Tương', desc: '【Mật Tương】Nước mật ngọt ngào phong phú, trơn tru mượt mà' },
        { id: 'deep_throat', name: 'Kiểu Vực Sâu', desc: '【Vực Sâu】Hõm sâu thẳng tới nhụy hoa, thăm thẳm không lường được' },
        { id: 'sensitive', name: 'Kiểu Nhạy Cảm', desc: '【Nhạy Cảm】Chỉ chạm nhẹ cũng phản ứng, cực kỳ dễ đạt cao trào' }
    ]
};
// ==================== Trạng thái Khởi đầu Đặc biệt (Tiêu hao điểm, liên kết với Chợ Đen) ====================
const StartingStatusConfig = {
    // ========== Trạng thái Tiêu cực (Nhận điểm) ==========
    slave_collar: {
        id: 'slave_collar', name: 'Vòng Cổ Nô Lệ', icon: '⭕', points: 15,
        description: 'Đeo vòng cổ sỉ nhục trên cổ',
        effect: 'Giảm Max HP -10',
        statusEffect: { maxHp: -10 },
        linkedBodyMod: null
    },
    chastity_belt: {
        id: 'chastity_belt', name: 'Vòng Của Sự Trinh Tiết', icon: '🔒', points: 20,
        description: 'Bị khóa bằng vòng trinh tiết',
        effect: 'HP không thể vượt quá 50%',
        statusEffect: { hpCap: 0.5 },
        linkedBodyMod: null
    },
    curse_mark: {
        id: 'curse_mark', name: 'Ấn Tỳ Nguyền Rủa', icon: '🔮', points: 25,
        description: 'Trên người khắc có phù văn dâm mỹ',
        effect: 'Mỗi lần nghỉ ngơi Suy thoái +5',
        statusEffect: { corruptionPerRest: 5 },
        linkedBodyMod: null
    },
    aphrodisiac: {
        id: 'aphrodisiac', name: 'Dư Lượng Dược Liệu', icon: '💊', points: 10,
        description: 'Trong cơ thể còn sót lại dược liệu mê tình',
        effect: 'Tấn công -2',
        statusEffect: { attack: -2 },
        linkedBodyMod: null
    },
    branded: {
        id: 'branded', name: 'Dấu Ấn Nô Lệ', icon: '🔥', points: 15,
        description: 'Trên người có dấu ấn nô lệ',
        effect: 'Phòng thủ -2',
        statusEffect: { defense: -2 },
        linkedBodyMod: null
    },
    debt_slave: {
        id: 'debt_slave', name: 'Nô Lệ Nợ Nần', icon: '📜', points: 20,
        description: 'Mang trên mình món nợ khổng lồ',
        effect: 'Vàng khởi điểm -50',
        statusEffect: { gold: -50 },
        linkedBodyMod: null
    },
    // ========== Trạng thái đồng bộ Chợ Đen (Tiêu hao điểm) ==========
    // Hệ Ma Tộc
    start_succubus: {
        id: 'start_succubus', name: 'Mị Ma Hóa', icon: '😈', points: -40,
        description: 'Thể chất Mị Ma bẩm sinh',
        effect: 'Suy thoái +50, Tấn công +3, Phòng thủ +3',
        statusEffect: { corruption: 50, attack: 3, defense: 3 },
        linkedBodyMod: 'succubus'
    },
    start_demon_blood: {
        id: 'start_demon_blood', name: 'Huyết Mạch Dâm Ma', icon: '🩸', points: -50,
        description: 'Trong cơ thể chảy dòng máu Dâm Ma',
        effect: 'Suy thoái +60, Tấn công +5, Phòng thủ +5',
        statusEffect: { corruption: 60, attack: 5, defense: 5 },
        linkedBodyMod: null // Giữ nguyên vì không có mod cơ thể tương ứng rõ ràng (chỉ là buff)
    },
    start_demon_tail: {
        id: 'start_demon_tail', name: 'Đuôi Ma Tộc', icon: '🦯', points: -25,
        description: 'Bẩm sinh sở hữu đuôi ma tộc',
        effect: 'Suy thoái +25, Tấn công +2, Phòng thủ +2',
        statusEffect: { corruption: 25, attack: 2, defense: 2 },
        linkedBodyMod: null
    },
    start_demon_horns: {
        id: 'start_demon_horns', name: 'Sừng Ma Tộc', icon: '🦌', points: -25,
        description: 'Bẩm sinh có sừng trên đầu',
        effect: 'Suy thoái +30, Tấn công +4',
        statusEffect: { corruption: 30, attack: 4 },
        linkedBodyMod: null
    },
    start_demon_wings: {
        id: 'start_demon_wings', name: 'Cánh Ma Tộc', icon: '🦇', points: -35,
        description: 'Bẩm sinh sở hữu đôi cánh',
        effect: 'Suy thoái +35, Tấn công +3, Phòng thủ +3',
        statusEffect: { corruption: 35, attack: 3, defense: 3 },
        linkedBodyMod: null
    },
    // Hệ Ngực
    start_nipple_ring: {
        id: 'start_nipple_ring', name: 'Vòng Núm', icon: '💎', points: -20,
        description: 'Chiếc vòng bạc trên đầu ngực',
        effect: 'Suy thoái +20, Sát thương H +6',
        statusEffect: { corruption: 20, hDamageBonus: 6 },
        linkedBodyMod: 'nipple_ring'
    },
    start_lactation: {
        id: 'start_lactation', name: 'Thể Chất Dưỡng Lậu', icon: '🍼', points: -25,
        description: 'Bẩm sinh tiết sữa',
        effect: 'Suy thoái +30, Mỗi lượt +1HP, Phòng thủ +2',
        statusEffect: { corruption: 30, hpPerTurn: 1, defense: 2 },
        linkedBodyMod: null
    },
    start_mega_breast: {
        id: 'start_mega_breast', name: 'Ngực Khổng Lồ Thiên Nhiên', icon: '🎈', points: -35,
        description: 'Ngực to khổng lồ bẩm sinh',
        effect: 'Suy thoái +40, Phòng thủ +5, Tấn công -1',
        statusEffect: { corruption: 40, defense: 5, attack: -1 },
        linkedBodyMod: null
    },
    // Hệ Hạ Thân
    start_pussy_enhance: {
        id: 'start_pussy_enhance', name: 'Tâm Phách Danh Khí', icon: '🌸', points: -35,
        description: 'Danh khí bẩm sinh',
        effect: 'Suy thoái +40, Sát thương H +15',
        statusEffect: { corruption: 40, hDamageBonus: 15 },
        linkedBodyMod: null
    },
    start_anal_develop: {
        id: 'start_anal_develop', name: 'Hậu Huyệt Phát Triển', icon: '🍑', points: -30,
        description: 'Hậu huyệt bẩm sinh nhạy cảm',
        effect: 'Suy thoái +35, Phòng thủ +3',
        statusEffect: { corruption: 35, defense: 3 },
        linkedBodyMod: 'anal_develop'
    },

    start_anal_develop: {
        id: 'start_anal_develop', name: 'Hậu Huyệt Nhạy Cảm', icon: '🍑', points: -30,
        description: 'Hậu huyệt bẩm sinh nhạy cảm',
        effect: 'Suy thoái +35, Phòng thủ +3',
        statusEffect: { corruption: 35, defense: 3 },
        linkedBodyMod: 'anal_develop'
    },
    // Hệ Thể Chất
    start_sensitive_body: {
        id: 'start_sensitive_body', name: 'Thể Chất Nhạy Cảm', icon: '💗', points: -25,
        description: 'Thể chất nhạy cảm bẩm sinh',
        effect: 'Suy thoái +25, Mỗi lượt +2HP',
        statusEffect: { corruption: 25, hpPerTurn: 2 },
        linkedBodyMod: 'sensitive_body'
    },
    start_heat_body: {
        id: 'start_heat_body', name: 'Thể Chất Phát Tình', icon: '🔥', points: -30,
        description: 'Bẩm sinh dễ phát tình',
        effect: 'Suy thoái +35, Tấn công +4',
        statusEffect: { corruption: 35, attack: 4 },
        linkedBodyMod: 'heat_body'
    },
    start_body_enhance: {
        id: 'start_body_enhance', name: 'Thể Chất Cường Tráng', icon: '💪', points: -25,
        description: 'Bẩm sinh cường tráng',
        effect: 'Suy thoái +20, HP +15',
        statusEffect: { corruption: 20, maxHp: 15 },
        linkedBodyMod: 'body_enhance'
    },
    start_elastic_body: {
        id: 'start_elastic_body', name: 'Cơ Thể Dẻo Dai', icon: '🤸', points: -25,
        description: 'Bẩm sinh mềm mại linh hoạt',
        effect: 'Suy thoái +25, Phòng thủ +4',
        statusEffect: { corruption: 25, defense: 4 },
        linkedBodyMod: 'elastic_body'
    },
    start_regeneration: {
        id: 'start_regeneration', name: 'Năng Lực Tái Sinh', icon: '♻️', points: -40,
        description: 'Khả năng tái sinh bẩm sinh',
        effect: 'Suy thoái +35, Mỗi lượt +3HP',
        statusEffect: { corruption: 35, hpPerTurn: 3 },
        linkedBodyMod: 'regeneration'
    },
    start_pain_pleasure: {
        id: 'start_pain_pleasure', name: 'Thể Chất Thích Đau', icon: '😵', points: -30,
        description: 'Đau đớn chuyển hóa thành khoái cảm',
        effect: 'Suy thoái +40, Nhận sát thương +4HP, Phòng thủ -2',
        statusEffect: { corruption: 40, hpOnHit: 4, defense: -2 },
        linkedBodyMod: 'pain_pleasure'
    },
    // Hệ Đặc Biệt
    start_pheromone_gland: {
        id: 'start_pheromone_gland', name: 'Thể Chất Hương Lệ', icon: '🌺', points: -25,
        description: 'Tỏa ra hương thơm quyến rũ',
        effect: 'Suy thoái +30, Tấn công địch -2',
        statusEffect: { corruption: 30, enemyAttackReduce: 2 },
        linkedBodyMod: 'pheromone_gland'
    },
    start_pleasure_nerve: {
        id: 'start_pleasure_nerve', name: 'Dây Thần Kinh Khoái Cảm', icon: '⚡', points: -35,
        description: 'Đau đớn chuyển hóa thành khoái cảm',
        effect: 'Suy thoái +45, Nhận sát thương +3HP',
        statusEffect: { corruption: 45, hpOnHit: 3 },
        linkedBodyMod: 'pleasure_nerve'
    },
    start_tentacle_implant: {
        id: 'start_tentacle_implant', name: 'Cấy Ghép Xúc Thủ', icon: '🐙', points: -40,
        description: 'Trong cơ thể có cơ quan xúc thủ',
        effect: 'Suy thoái +45, Tấn công +6',
        statusEffect: { corruption: 45, attack: 6 },
        linkedBodyMod: 'tentacle_implant'
    },
    start_charm_voice: {
        id: 'start_charm_voice', name: 'Âm Thanh Quyến Rũ', icon: '🎤', points: -30,
        description: 'Giọng nói quyến rũ bẩm sinh',
        effect: 'Suy thoái +30, Tấn công địch -3, Tấn công +2',
        statusEffect: { corruption: 30, enemyAttackReduce: 3, attack: 2 },
        linkedBodyMod: 'charm_voice'
    },
    start_lewd_tattoo: {
        id: 'start_lewd_tattoo', name: 'Hắc Văn Dâm Mỹ', icon: '🔯', points: -25,
        description: 'Bẩm sinh mang hình xăm dâm mỹ',
        effect: 'Suy thoái +30, Sát thương H +10',
        statusEffect: { corruption: 30, hDamageBonus: 10 },
        linkedBodyMod: 'lewd_tattoo'
    },
    start_charm_body: {
        id: 'start_charm_body', name: 'Thể Chất Mị Hoặc', icon: '💃', points: -35,
        description: 'Cơ thể bẩm sinh đầy sức hút',
        effect: 'Suy thoái +40, Tấn công +5',
        statusEffect: { corruption: 40, attack: 5 },
        linkedBodyMod: 'charm_body'
    }
};

// ==================== Cấu Hình Gốc (Origin) ====================
// Điểm Dương = Bối cảnh khó khăn (Cấp điểm), Điểm Âm = Bối cảnh lợi thế (Tiêu điểm)
const OriginConfig = {
    slum: {
        id: 'slum', name: 'Trẻ Mồ Côi Khu Phố', icon: '🏚️', points: 10,
        description: 'Mồ côi lớn lên trong khu ổ chuột, chứng kiến vô vàn thăng trầm thế sự.',
        effect: 'Tiền vàng ban đầu -30, HP ban đầu +5',
        statMods: { gold: -30, hp: 5, maxHp: 5 }
    },
    debt: {
        id: 'debt', name: 'Mang Nợ Nần', icon: '💰', points: 20,
        description: 'Gánh trên vai khoản nợ khổng lồ, buộc phải đến đây phiêu lưu trả nợ.',
        effect: 'Tiền vàng ban đầu -50, Tấn công +1',
        statMods: { gold: -50, attack: 1 }
    },
    slave: {
        id: 'slave', name: 'Nô Lệ Đào Thoát', icon: '⛓️', points: 25,
        description: 'Tên nô lệ trốn chạy khỏi chủ nhân, đang bị truy sát.',
        effect: 'Tiền vàng ban đầu -60, Phòng thủ +2, Suy thoái +10',
        statMods: { gold: -60, defense: 2, corruption: 10 }
    },
    fallen_noble: {
        id: 'fallen_noble', name: 'Quý Tộc Sa Ngã', icon: '👑', points: -10,
        description: 'Tiểu thư quý tộc trước đây, gia cảnh đã suy tàn.',
        effect: 'Tiền vàng ban đầu +20, Không có kinh nghiệm chiến đấu',
        statMods: { gold: 20 }
    },
    brothel: {
        id: 'brothel', name: 'Xuất Thân Từ Lầu Các', icon: '🏮', points: -15,
        description: 'Trốn thoát khỏi lầu các, quen thuộc với chuyện phong lưu.',
        effect: 'Suy thoái +20, Sát thương H +5',
        statMods: { corruption: 20, hDamageBonus: 5 }
    },
    cursed: {
        id: 'cursed', name: 'Bị Lời Nguyền Ám Ảnh', icon: '☠️', points: 30,
        description: 'Mang trên người một lời nguyền bí ẩn.',
        effect: 'HP tối đa -15, Suy thoái +2 mỗi trận chiến',
        statMods: { maxHp: -15, hp: -15, corruptionPerBattle: 2 }
    },
    adventurer: {
        id: 'adventurer', name: 'Mạo Hiểm Giả Tân Thủ', icon: '🎒', points: 0,
        description: 'Người mạo hiểm giả mang trong mình ước mơ.',
        effect: 'Không có hiệu ứng đặc biệt',
        statMods: {}
    },
    witch: {
        id: 'witch', name: 'Phù Thủy Bị Trục Xuất', icon: '🧙‍♀️', points: -20,
        description: 'Phù thủy bị làng bản trục xuất vì một lý do nào đó.',
        effect: 'Chi phí +1, HP -10',
        statMods: { energy: 1, hp: -10, maxHp: -10 }
    },
    experiment: {
        id: 'experiment', name: 'Đối Tượng Thí Nghiệm', icon: '🧪', points: -25,
        description: 'Đối tượng thí nghiệm trốn thoát từ phòng thí nghiệm của nhà giả kim.',
        effect: 'Tấn công +2, Phòng thủ -1, Suy thoái +15',
        statMods: { attack: 2, defense: -1, corruption: 15 }
    },
    temple_maiden: {
        id: 'temple_maiden', name: 'Thánh Nữ Sa Ngã', icon: '⛪', points: -30,
        description: 'Từng là thánh nữ của đền thờ, vì một lý do nào đó đã bị trục xuất.',
        effect: 'HP tối đa +10, Suy thoái +25, Tiền vàng ban đầu +30',
        statMods: { maxHp: 10, hp: 10, corruption: 25, gold: 30 }
    },
    assassin: {
        id: 'assassin', name: 'Sát Thủ Đào Thoát', icon: '🗡️', points: 15,
        description: 'Từng là thành viên của công hội sát thủ, bị truy sát sau thất bại nhiệm vụ.',
        effect: 'Tấn công +3, Tiền vàng ban đầu -40, Trạng thái Bị Truy Sát',
        statMods: { attack: 3, gold: -40 }
    },
    merchant_daughter: {
        id: 'merchant_daughter', name: 'Con Gái Thương Nhân', icon: '🏪', points: -5,
        description: 'Con gái của thương nhân giàu có, vì gia tộc phá sản mà lưu lạc giang hồ.',
        effect: 'Tiền vàng ban đầu +50, Không có kinh nghiệm chiến đấu, Tấn công -1',
        statMods: { gold: 50, attack: -1 }
    },
    forest_raised: {
        id: 'forest_raised', name: 'Lớn Lên Trong Rừng', icon: '🌲', points: 5,
        description: 'Bị bỏ rơi từ nhỏ trong rừng, được dã thú nuôi lớn.',
        effect: 'Tấn công +2, Phòng thủ +1, Tiền vàng ban đầu -30',
        statMods: { attack: 2, defense: 1, gold: -30 }
    },
    demon_contract: {
        id: 'demon_contract', name: 'Khế Ước Ma Tộc', icon: '📜', points: -35,
        description: 'Ký khế ước với ma tộc, nhận được sức mạnh nhưng đánh mất tự do.',
        effect: 'Tấn công +4, Suy thoái +30, Suy thoái +3 mỗi trận chiến',
        statMods: { attack: 4, corruption: 30, corruptionPerBattle: 3 }
    },
    war_refugee: {
        id: 'war_refugee', name: 'Người Tị Nạn Chiến Tranh', icon: '🏃', points: 20,
        description: 'Quê hương bị chiến hỏa tàn phá, trở thành người tị nạn không nơi nương tựa.',
        effect: 'Tiền vàng ban đầu -50, Phòng thủ +2, HP +10',
        statMods: { gold: -50, defense: 2, hp: 10, maxHp: 10 }
    },
    circus_performer: {
        id: 'circus_performer', name: 'Diễn Viên Rạp Xiếc', icon: '🎪', points: 10,
        description: 'Người biểu diễn trốn thoát khỏi rạp xiếc tàn khốc.',
        effect: 'Nhanh nhẹn +1, Tiền vàng ban đầu -20, Suy thoái +10',
        statMods: { gold: -20, corruption: 10, defense: 1 }
    },
    cult_survivor: {
        id: 'cult_survivor', name: 'Người Sống Sót Của Giáo Phái', icon: '🔮', points: 25,
        description: 'May mắn thoát khỏi lễ hiến tế của giáo phái.',
        effect: 'Suy thoái +35, HP -10, Kháng Thần Bí',
        statMods: { corruption: 35, hp: -10, maxHp: -10 }
    },
    royal_spy: {
        id: 'royal_spy', name: 'Gián Điệp Hoàng Gia', icon: '🎭', points: -15,
        description: 'Từng là gián điệp hoàng gia, bị ám sát vì biết quá nhiều bí mật.',
        effect: 'Tấn công +2, Tiền vàng ban đầu +25, Trạng thái Bị Truy Sát',
        statMods: { attack: 2, gold: 25 }
    },
    gladiator: {
        id: 'gladiator', name: 'Nô Lệ Đấu Trường', icon: '⚔️', points: 15,
        description: 'Từng là đấu sĩ tại đấu trường, sống sót bằng những trận chiến đẫm máu.',
        effect: 'Tấn công +3, Phòng thủ +1, Tiền vàng ban đầu -40, Suy thoái +10',
        statMods: { attack: 3, defense: 1, gold: -40, corruption: 10 }
    },
    shrine_servant: {
        id: 'shrine_servant', name: 'Người Phục Vụ Đền Thờ', icon: '⛩️', points: -10,
        description: 'Thần nữ của đền thờ, nay lưu lạc sau khi đền bị hủy diệt.',
        effect: 'HP tối đa +5, Tiền vàng ban đầu +15, Suy thoái -5',
        statMods: { maxHp: 5, hp: 5, gold: 15, corruption: -5 }
    },
    pirate_captive: {
        id: 'pirate_captive', name: 'Tù Binh Hải Tặc', icon: '🏴‍☠️', points: 15,
        description: 'Tù binh bị hải tặc bắt giữ rồi trốn thoát.',
        effect: 'Tiền vàng ban đầu -30, Phòng thủ +2, Suy thoái +15',
        statMods: { gold: -30, defense: 2, corruption: 15 }
    },
    noble_maid: {
        id: 'noble_maid', name: 'Cô Thị Nữ Quý Tộc', icon: '🎀', points: 5,
        description: 'Từng phục vụ trong gia đình quý tộc, thất nghiệp sau khi chủ nhân sụp đổ.',
        effect: 'Tiền vàng ban đầu -10, Suy thoái +5, Am hiểu giao tế giới quý tộc',
        statMods: { gold: -10, corruption: 5 }
    },
    monster_child: {
        id: 'monster_child', name: 'Hỗn Huyết Ma Vật', icon: '👹', points: -40,
        description: 'Con lai giữa người và ma vật.',
        effect: 'Tấn công +5, Suy thoái +40, Trạng thái Bị Kỳ Thị',
        statMods: { attack: 5, corruption: 40 }
    },
    alchemist_apprentice: {
        id: 'alchemist_apprentice', name: 'Học Viên Giả Kim', icon: '🧪', points: -10,
        description: 'Học viên của nhà giả kim, lưu lạc một mình sau khi sư phụ qua đời.',
        effect: 'Tiền vàng ban đầu +20, HP tối đa -5',
        statMods: { gold: 20, maxHp: -5, hp: -5 }
    },
    arena_champion: {
        id: 'arena_champion', name: 'Quán Quân Đấu Trường', icon: '🏆', points: -25,
        description: 'Quán quân của đấu trường ngầm, bị truy sát vì từ chối đánh giả.',
        effect: 'Tấn công +4, Phòng thủ +2, Tiền vàng ban đầu -20',
        statMods: { attack: 4, defense: 2, gold: -20 }
    },
    dream_wanderer: {
        id: 'dream_wanderer', name: 'Lữ Khách Mộng Cảnh', icon: '💫', points: 10,
        description: 'Người lữ khách tỉnh dậy từ giấc mơ dị giới không rõ lý do.',
        effect: 'Tiền vàng ban đầu -20, Giác Quan Thần Bí',
        statMods: { gold: -20 }
    },
    sacrifice_survivor: {
        id: 'sacrifice_survivor', name: 'Người Sống Sót Lễ Vật', icon: '🩸', points: 30,
        description: 'Lẽ ra là vật hiến tế, nhưng lại kỳ tích thoát thân.',
        effect: 'Suy thoái +40, HP tối đa -15, Dấu Ấn Thần Bí',
        statMods: { corruption: 40, maxHp: -15, hp: -15 }
    },
    ruined_princess: {
        id: 'ruined_princess', name: 'Công Chúa Hoang Phế', icon: '👸', points: -20,
        description: 'Vương quốc từng hưng thịnh sụp đổ trong một đêm, công chúa ẩn danh lưu lạc dân gian.',
        effect: 'Tiền vàng ban đầu +40, Phòng thủ +2, Suy thoái +15',
        statMods: { gold: 40, defense: 2, corruption: 15 }
    }
};

// ==================== Quản lý Trạng thái Người chơi ====================
const PlayerState = {
    profession: null,           // Nghề nghiệp
    race: null,                 // Chủng tộc
    name: 'Lữ Hành Giả',
    age: 18,                    // Tuổi
    hp: 70,                     // Máu hiện tại
    maxHp: 70,                  // Máu tối đa
    energy: 3,                  // Điểm năng lượng (mỗi lượt)
    attack: 0,                  // Tăng sức tấn công
    defense: 0,                 // Tăng phòng thủ
    baseArmor: 0,               // Giáp ban đầu khi vào trận chiến
    corruption: 0,              // Giá trị Suy thoái
    gold: 100,                  // Tiền vàng
    floor: 1,                   // Tầng hiện tại
    relics: [],                 // Danh sách Thánh di vật
    floorSnapshots: {},         // Ảnh chụp nhanh tầng (dùng để hoàn tác)
    // Thuộc tính cơ thể
    bodyAttributes: {
        height: null,             // Chiều cao
        weight: null,             // Cân nặng
        chest: null,              // Ngực
        hips: null,               // Hông
        vagina: null              // Âm đạo
    },
    // Kinh nghiệm khởi đầu
    origin: null,
    // Trạng thái đặc biệt khi bắt đầu (liên kết với Chợ Đen)
    startingStatuses: [],
    // Khởi tạo người chơi (hỗ trợ dữ liệu tạo nhân vật hoàn chỉnh)
    init: function (professionId, name, options = {}) {
        const prof = ProfessionConfig[professionId];
        if (!prof) {
            console.error('[Người Chơi] Nghề nghiệp không tồn tại:', professionId);
            return;
        }
        this.profession = prof;
        this.name = name || 'Lữ Hành Giả';
        this.age = options.age || 18;
        // Thuộc tính cơ bản từ nghề nghiệp
        this.hp = prof.baseStats.hp;
        this.maxHp = prof.baseStats.maxHp;
        this.energy = prof.baseStats.energy;
        this.attack = prof.baseStats.attack;
        this.defense = prof.baseStats.defense;
        this.baseArmor = prof.baseStats.baseArmor;
        this.corruption = prof.baseStats.corruption;
        this.gold = prof.startingGold || 100;
        this.floor = 1;
        this.relics = [];
        this.floorSnapshots = {};
        // Áp dụng sửa đổi của chủng tộc
        if (options.raceId && RaceConfig[options.raceId]) {
            this.race = RaceConfig[options.raceId];
            const mods = this.race.statMods;
            this.hp += mods.hp || 0;
            this.maxHp += mods.hp || 0;
            this.attack += mods.attack || 0;
            this.defense += mods.defense || 0;
            this.energy += mods.energy || 0;
            this.corruption += mods.corruption || 0;
        }
        // Lưu thuộc tính cơ thể
        if (options.bodyAttributes) {
            this.bodyAttributes = { ...options.bodyAttributes };
        }
        // Áp dụng kinh nghiệm khởi đầu
        if (options.originId && OriginConfig[options.originId]) {
            this.origin = OriginConfig[options.originId];
            const mods = this.origin.statMods;
            if (mods.gold) this.gold += mods.gold;
            if (mods.hp) this.hp += mods.hp;
            if (mods.maxHp) this.maxHp += mods.maxHp;
            if (mods.attack) this.attack += mods.attack;
            if (mods.defense) this.defense += mods.defense;
            if (mods.energy) this.energy += mods.energy;
            if (mods.corruption) this.corruption += mods.corruption;
        }
        // Áp dụng các trạng thái đặc biệt khi bắt đầu
        this.startingStatuses = options.startingStatuses || [];
        this.startingStatuses.forEach(statusId => {
            const status = StartingStatusConfig[statusId];
            if (status && status.statusEffect) {
                const eff = status.statusEffect;
                if (eff.maxHp) this.maxHp += eff.maxHp;
                if (eff.hp) this.hp += eff.hp;
                if (eff.attack) this.attack += eff.attack;
                if (eff.defense) this.defense += eff.defense;
                if (eff.corruption) this.corruption += eff.corruption;
            }
        });
        // Đảm bảo HP không vượt quá MaxHp
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        // Đảm bảo HP không dưới 1
        if (this.hp < 1) this.hp = 1;
        // Đảm bảo Tiền vàng không âm
        if (this.gold < 0) this.gold = 0;
        console.log('[Người Chơi] Khởi tạo hoàn tất:', this.name, 'Nghề nghiệp:', prof.name);
    },
    // 🔧 Tạo ảnh chụp nhanh tầng (gọi khi vào tầng mới)
    createFloorSnapshot: function () {
        const snapshot = {
            hp: this.hp,
            maxHp: this.maxHp,
            gold: this.gold,
            corruption: this.corruption,
            relics: [...this.relics],
            deck: CardDeckManager.getDeckData(),
            timestamp: Date.now()
        };
        this.floorSnapshots[this.floor] = snapshot;
        this.save();
        console.log('[Người Chơi] Tạo ảnh chụp nhanh tầng: Tầng', this.floor, ', Trạng thái:', snapshot);
    },
    // 🔧 Hoàn tác về ảnh chụp nhanh tầng đích
    rollbackToFloor: function (targetFloor) {
        const snapshot = this.floorSnapshots[targetFloor];
        if (!snapshot) {
            console.error('[Người Chơi] Không tìm thấy ảnh chụp nhanh của Tầng', targetFloor);
            return false;
        }
        this.hp = snapshot.hp;
        this.maxHp = snapshot.maxHp;
        this.gold = snapshot.gold;
        this.corruption = snapshot.corruption;
        this.relics = [...snapshot.relics];
        this.floor = targetFloor;
        // Hoàn tác bộ bài
        if (snapshot.deck) {
            CardDeckManager.init(snapshot.deck);
            saveCardDeck();
        }
        // Xóa tất cả các ảnh chụp nhanh sau tầng đích
        Object.keys(this.floorSnapshots).forEach(floor => {
            if (parseInt(floor) > targetFloor) {
                delete this.floorSnapshots[floor];
            }
        });
        this.save();
        this.updateDisplay();
        console.log('[Người Chơi] Hoàn tác về Tầng', targetFloor, ', Suy thoái:', this.corruption);
        return true;
    },
    // Lưu trạng thái
    save: function () {
        const data = {
            professionId: this.profession?.id,
            name: this.name,
            hp: this.hp,
            maxHp: this.maxHp,
            energy: this.energy,
            attack: this.attack,
            defense: this.defense,
            baseArmor: this.baseArmor,
            corruption: this.corruption,
            gold: this.gold,
            floor: this.floor,
            relics: this.relics,
            floorSnapshots: this.floorSnapshots || {}
        };
        localStorage.setItem('acjt_player_state', JSON.stringify(data));
    },
    // Tải trạng thái
    load: function () {
        const saved = localStorage.getItem('acjt_player_state');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.professionId) {
                    this.profession = ProfessionConfig[data.professionId];
                }
                this.name = data.name || 'Lữ Hành Giả';
                this.hp = data.hp || 70;
                this.maxHp = data.maxHp || 70;
                this.energy = data.energy || 3;
                this.attack = data.attack || 0;
                this.defense = data.defense || 0;
                this.baseArmor = data.baseArmor || 0;
                this.corruption = data.corruption || 0;
                this.gold = data.gold || 100;
                this.floor = typeof data.floor === 'number' ? data.floor : 1; // 🔧 Xử lý floor=0 đúng cách
                this.relics = data.relics || [];
                this.floorSnapshots = data.floorSnapshots || {};
                // 🔧 Đồng bộ tên với Game State chính
                if (typeof gameState !== 'undefined' && gameState.variables?.name) {
                    this.name = gameState.variables.name;
                    console.log('[Người Chơi] Đồng bộ Tên từ Game Chính:', this.name);
                }
                // 🔧 Đồng bộ nghề nghiệp với Game State chính
                if (typeof gameState !== 'undefined' && gameState.variables?.job) {
                    const jobName = gameState.variables.job;
                    // Tìm kiếm trong ProfessionConfig theo tên
                    for (const key in ProfessionConfig) {
                        if (ProfessionConfig[key].name === jobName) {
                            this.profession = ProfessionConfig[key];
                            console.log('[Người Chơi] Đồng bộ Nghề nghiệp từ Game Chính:', jobName, '→', key);
                            break;
                        }
                    }
                }
                return true;
            } catch (e) {
                console.error('[Người Chơi] Tải trạng thái thất bại:', e);
            }
        }
        return false;
    },
    // Cập nhật hiển thị thanh trạng thái
    updateDisplay: function () {
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        const setElHtml = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };
        // 🔧 Lấy sửa đổi từ trạng thái hiệu ứng
        const mods = this.statusEffects || { energyMod: 0, attackMod: 0, defenseMod: 0, maxHpMod: 0, damageTakenMod: 0 };
        // Tính giá trị thực tế
        const actualMaxHp = Math.max(1, this.maxHp + mods.maxHpMod);
        const actualHp = Math.min(this.hp, actualMaxHp);
        const actualEnergy = Math.max(0, this.energy + mods.energyMod);
        const actualAttack = Math.max(0, this.attack + mods.attackMod);
        const actualDefense = Math.max(0, this.defense + mods.defenseMod);
        // Định dạng hiển thị có sửa đổi
        const formatWithMod = (base, mod) => {
            if (mod === 0) return base.toString();
            const modStr = mod > 0 ? `<span style="color:#2ed573">+${mod}</span>` : `<span style="color:#ff4757">${mod}</span>`;
            return `${base + mod}(${modStr})`;
        };
        // Cập nhật container dữ liệu ẩn (tương thích logic cũ)
        setEl('playerHp', `${actualHp}/${actualMaxHp}`);
        setEl('playerEnergy', actualEnergy);
        setEl('playerAttack', actualAttack);
        setEl('playerDefense', actualDefense);
        setEl('playerArmor', this.baseArmor);
        setEl('playerCorruption', this.corruption);
        setEl('playerGold', this.gold);
        setEl('playerFloor', this.floor);
        setEl('playerName', this.name);
        // Cập nhật hiển thị thanh trạng thái nội tuyến (có sửa đổi)
        setEl('inlinePlayerName', this.name);
        setEl('inlinePlayerFloor', this.floor);
        setEl('inlinePlayerGold', this.gold);
        // Hiển thị HP có sửa đổi
        if (mods.maxHpMod !== 0) {
            setElHtml('inlinePlayerHp', `${actualHp}/${actualMaxHp}<span style="color:#ff4757;font-size:10px">(${mods.maxHpMod})</span>`);
        } else {
            setEl('inlinePlayerHp', `${this.hp}/${this.maxHp}`);
        }
        // Hiển thị Năng lượng có sửa đổi
        if (mods.energyMod !== 0) {
            setElHtml('inlinePlayerEnergy', formatWithMod(this.energy, mods.energyMod));
        } else {
            setEl('inlinePlayerEnergy', this.energy);
        }
        setEl('inlinePlayerCorruption', this.corruption);
        // Hiển thị Tấn công có sửa đổi
        if (mods.attackMod !== 0) {
            setElHtml('inlinePlayerAttack', formatWithMod(this.attack, mods.attackMod));
        } else {
            setEl('inlinePlayerAttack', this.attack);
        }
        // Hiển thị Phòng thủ có sửa đổi
        if (mods.defenseMod !== 0) {
            setElHtml('inlinePlayerDefense', formatWithMod(this.defense, mods.defenseMod));
        } else {
            setEl('inlinePlayerDefense', this.defense);
        }
        setEl('inlinePlayerArmor', this.baseArmor);
        // 🔧 Hiển thị thêm Sát thương nhận vào (nếu có)
        const damageTakenEl = document.getElementById('inlinePlayerDamageTaken');
        if (damageTakenEl) {
            if (mods.damageTakenMod > 0) {
                damageTakenEl.innerHTML = `<span style="color:#ff4757">Nhận Sát Thương +${mods.damageTakenMod}%</span>`;
                damageTakenEl.style.display = 'inline';
            } else {
                damageTakenEl.style.display = 'none';
            }
        }
        // Cập nhật số lượng Thánh di vật
        const relicCountEl = document.getElementById('relicCount');
        if (relicCountEl) {
            const count = this.relics?.length || 0;
            relicCountEl.textContent = count > 0 ? `Thánh Di Vật(${count})` : 'Thánh Di Vật';
        }
        // Cập nhật trạng thái nút Thành phố (Tầng 0 khả dụng)
        if (typeof TownSystem !== 'undefined') {
            TownSystem.updateButtons();
        }
    }
};


// ==================== Cấu hình Quái vật ====================
const MonsterConfig = {
    // ========== Quái thường (12 loại) - Mô hình hành vi đơn giản ==========
    slime: {
        id: 'slime', name: 'Slime', icon: 'img/monster/monster_020.png',
        hp: 30, attack: 6, defense: 1, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 }, // Tấn công
            { type: 'defend', weight: 30 }  // Phòng thủ
        ]
    },
    goblin: {
        id: 'goblin', name: 'Goblin', icon: 'img/monster/monster_017.png',
        hp: 35, attack: 9, defense: 4, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 60 },
            { type: 'buff', weight: 25 },   // Tăng ích
            { type: 'defend', weight: 15 }
        ]
    },
    skeleton: {
        id: 'skeleton', name: 'Binh xương', icon: 'img/monster/monster_013.png',
        hp: 33, attack: 10, defense: 3, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 75 },
            { type: 'defend', weight: 25 }
        ]
    },
    imp: {
        id: 'imp', name: 'Tiểu ác quỷ', icon: 'img/monster/monster_019.png',
        hp: 27, attack: 11, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 65 },
            { type: 'debuff', weight: 25 }, // Giảm ích (gây hiệu ứng xấu)
            { type: 'buff', weight: 10 }
        ]
    },
    bat: {
        id: 'bat', name: 'Đàn dơi', icon: 'img/monster/monster_024.png',
        hp: 23, attack: 8, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 80 },
            { type: 'buff', weight: 20 }
        ]
    },
    spider: {
        id: 'spider', name: 'Nhện khổng lồ', icon: 'img/monster/monster_021.png',
        hp: 37, attack: 9, defense: 3, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 35 },
            { type: 'defend', weight: 15 }
        ]
    },
    zombie: {
        id: 'zombie', name: 'Zombie', icon: 'img/monster/monster_022.png',
        hp: 40, attack: 8, defense: 4, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 },
            { type: 'heal', weight: 20 },   // Hồi máu
            { type: 'defend', weight: 10 }
        ]
    },
    rat: {
        id: 'rat', name: 'Người chuột', icon: 'img/monster/monster_023.png',
        hp: 25, attack: 10, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 85 },
            { type: 'buff', weight: 15 }
        ]
    },
    mushroom: {
        id: 'mushroom', name: 'Nấm độc', icon: 'img/monster/monster_025.png',
        hp: 29, attack: 7, defense: 5, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'defend', weight: 20 }
        ]
    },
    ghost: {
        id: 'ghost', name: 'U linh', icon: 'img/monster/monster_026.png',
        hp: 27, attack: 12, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 60 },
            { type: 'debuff', weight: 30 },
            { type: 'buff', weight: 10 }
        ]
    },
    wolf: {
        id: 'wolf', name: 'Sói đói', icon: 'img/monster/monster_027.png',
        hp: 33, attack: 11, defense: 3, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 },
            { type: 'charge', weight: 20 }, // Tích lực/Vận công
            { type: 'buff', weight: 10 }
        ]
    },
    tentacle: {
        id: 'tentacle', name: 'Quái xúc tu', icon: 'img/monster/monster_028.png',
        hp: 35, attack: 9, defense: 4, type: 'monster', special: 'grab',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 35 },
            { type: 'defend', weight: 15 }
        ]
    },
    minghuiMage: {
        id: 'minghuiMage', name: 'Pháp sư Minh Huệ (Hoan Hỷ Thiền/Nam)', icon: 'img/monster/monster_046.png',
        hp: 109, attack: 99, defense: 20, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 55 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 15 },
            { type: 'defend', weight: 5 }
        ]
    },

    // ========== Quái tinh anh (15 loại) - Mô hình hành vi phức tạp hơn ==========
    orc: {
        id: 'orc', name: 'Chiến binh Orc', icon: 'img/monster/monster_029.png',
        hp: 55, attack: 14, defense: 7, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 15 },
            { type: 'defend', weight: 10 }
        ]
    },
    darkMage: {
        id: 'darkMage', name: 'Pháp sư bóng tối', icon: 'img/monster/monster_030.png',
        hp: 45, attack: 17, defense: 5, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 30 },
            { type: 'buff', weight: 20 },
            { type: 'defend', weight: 10 }
        ]
    },
    succubus: {
        id: 'succubus', name: 'Succubus (Mị ma)', icon: 'img/monster/monster_001.png',
        hp: 50, attack: 12, defense: 6, type: 'elite', special: 'seduce',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 35 },
            { type: 'heal', weight: 20 },
            { type: 'buff', weight: 10 }
        ]
    },
    minotaur: {
        id: 'minotaur', name: 'Minotaur (Ngưu đầu nhân)', icon: 'img/monster/monster_031.png',
        hp: 65, attack: 16, defense: 8, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'charge', weight: 30 },
            { type: 'buff', weight: 15 },
            { type: 'defend', weight: 10 }
        ]
    },
    vampire: {
        id: 'vampire', name: 'Ma cà rồng', icon: 'img/monster/monster_032.png',
        hp: 53, attack: 13, defense: 6, type: 'elite', special: 'lifesteal',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'heal', weight: 25 },
            { type: 'debuff', weight: 15 },
            { type: 'buff', weight: 10 }
        ]
    },
    harpy: {
        id: 'harpy', name: 'Harpy (Yêu nữ chim ưng)', icon: 'img/monster/monster_002.png',
        hp: 43, attack: 15, defense: 4, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 55 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 20 }
        ]
    },
    golem: {
        id: 'golem', name: 'Gargoyle (Ác quỷ đá)', icon: 'img/monster/monster_003.png',
        hp: 75, attack: 12, defense: 10, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'defend', weight: 40 },
            { type: 'charge', weight: 20 }
        ]
    },
    slimeQueen: {
        id: 'slimeQueen', name: 'Nữ hoàng Slime', icon: 'img/monster/monster_004.png',
        hp: 60, attack: 11, defense: 7, type: 'elite', special: 'split',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'heal', weight: 25 },
            { type: 'defend', weight: 20 },
            { type: 'buff', weight: 15 }
        ]
    },
    darkKnight: {
        id: 'darkKnight', name: 'Kỵ sĩ bóng đêm', icon: 'img/monster/monster_005.png',
        hp: 63, attack: 15, defense: 9, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'defend', weight: 30 },
            { type: 'charge', weight: 15 },
            { type: 'buff', weight: 10 }
        ]
    },
    lamia: {
        id: 'lamia', name: 'Lamia (Xà nữ)', icon: 'img/monster/monster_006.png',
        hp: 57, attack: 13, defense: 6, type: 'elite', special: 'poison',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'buff', weight: 20 }
        ]
    },
    werewolf: {
        id: 'werewolf', name: 'Người sói', icon: 'img/monster/monster_007.png',
        hp: 60, attack: 16, defense: 6, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 25 }
        ]
    },
    dullahan: {
        id: 'dullahan', name: 'Kỵ sĩ không đầu', icon: 'img/monster/monster_008.png',
        hp: 67, attack: 14, defense: 8, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'charge', weight: 30 },
            { type: 'defend', weight: 25 }
        ]
    },
    banshee: {
        id: 'banshee', name: 'Banshee (Yêu nữ báo tử)', icon: 'img/monster/monster_009.png',
        hp: 47, attack: 18, defense: 4, type: 'elite', special: 'fear',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'buff', weight: 20 }
        ]
    },
    darkElf: {
        id: 'darkElf', name: 'Hắc Tinh Linh', icon: 'img/monster/monster_010.png',
        hp: 50, attack: 15, defense: 5, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 25 }
        ]
    },
    demonGuard: {
        id: 'demonGuard', name: 'Vệ binh ác quỷ', icon: 'img/monster/monster_011.png',
        hp: 70, attack: 13, defense: 9, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'defend', weight: 35 },
            { type: 'buff', weight: 15 },
            { type: 'charge', weight: 10 }
        ]
    },
    rotRootFiend: {
        id: 'rotRootFiend', name: 'Ma chân đốt rễ thối', icon: 'img/monster/monster_049.png',
        hp: 62, attack: 14, defense: 8, type: 'elite', special: 'poison',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 35 },
            { type: 'defend', weight: 15 },
            { type: 'buff', weight: 10 }
        ]
    },

    // ========== Boss (12 loại) - Hành vi phức tạp + Cơ chế đặc biệt ==========
    // Hệ Ma tộc
    demonLord: {
        id: 'demonLord', name: 'Ma Vương', icon: 'img/monster/monster_033.png',
        hp: 105, attack: 20, defense: 10, type: 'boss',
        desc: 'Kẻ thống trị địa ngục, thao túng sức mạnh bóng tối',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 20 },
            { type: 'special', weight: 15 } // Kỹ năng đặc biệt
        ],
        specialMechanic: {
            id: 'enrage',
            name: 'Địa Ngục Cuồng Nộ',
            description: 'Khi HP dưới 50% sẽ vào trạng thái cuồng bạo, tấn công +50%',
            trigger: 'hpBelow50',
            effect: { attackBonus: 0.5 }
        }
    },
    lilith: {
        id: 'lilith', name: 'Succubus Cao Cấp (Lilith)', icon: 'img/monster/monster_034.png',
        hp: 115, attack: 24, defense: 10, type: 'boss', special: 'charm',
        desc: 'Mị ma nguyên thủy, mẹ của mọi sự cám dỗ',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'heal', weight: 15 }
        ],
        specialMechanic: {
            id: 'charm',
            name: 'Mê Hoặc',
            description: 'Mỗi 3 lượt giải phóng mê hoặc, buộc người chơi đánh ra 1 lá bài ngẫu nhiên',
            trigger: 'turnCooldown',
            cooldown: 3,
            effect: { type: 'forcePlayCard' }
        }
    },
    succubusQueen: {
        id: 'succubusQueen', name: 'Nữ Hoàng Mị Ma', icon: 'img/monster/monster_035.png',
        hp: 100, attack: 22, defense: 8, type: 'boss', special: 'drain',
        desc: 'Thống lĩnh tộc Mị ma, chuyên hấp thụ tinh hoa sinh mệnh',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 25 },
            { type: 'heal', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'lifeSteal',
            name: 'Hút Sinh Mệnh',
            description: 'Mỗi đòn tấn công hồi máu bằng 30% sát thương gây ra',
            trigger: 'onAttack',
            effect: { healPercent: 0.3 }
        }
    },

    // Hệ Long tộc
    dragonQueen: {
        id: 'dragonQueen', name: 'Long Hậu', icon: 'img/monster/monster_036.png',
        hp: 155, attack: 22, defense: 14, type: 'boss',
        desc: 'Nữ hoàng của tộc rồng cổ xưa, uy nghiêm vô song',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'charge', weight: 30 },
            { type: 'defend', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'dragonBreath',
            name: 'Hơi Thở Của Rồng',
            description: 'Khi HP dưới 50% sẽ phun lửa, gây 200% sát thương tấn công cơ bản',
            trigger: 'hpBelow50',
            effect: { damageMultiplier: 2.0 }
        }
    },
    ancientDragon: {
        id: 'ancientDragon', name: 'Viễn Cổ Cự Long', icon: 'img/monster/monster_037.png',
        hp: 185, attack: 27, defense: 17, type: 'boss',
        desc: 'Thực thể cổ xưa đã ngủ say vạn năm',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'charge', weight: 35 },
            { type: 'defend', weight: 25 },
            { type: 'special', weight: 10 }
        ],
        specialMechanic: {
            id: 'ancientRoar',
            name: 'Viễn Cổ Tiếng Gầm',
            description: 'Mỗi 5 lượt gầm lên khiến người chơi không thể sử dụng thẻ bài ở lượt sau',
            trigger: 'turnCooldown',
            cooldown: 5,
            effect: { type: 'silence', duration: 1 }
        }
    },

    // Hệ Thiên giới/Đọa lạc
    fallenAngel: {
        id: 'fallenAngel', name: 'Thiên Thần Đọa Lạc', icon: 'img/monster/monster_038.png',
        hp: 125, attack: 17, defense: 12, type: 'boss', special: 'corrupt',
        desc: 'Thiên thần sa ngã từ thiên đường, khao khát sự đồi bại',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 35 },
            { type: 'heal', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'corruptionAura',
            name: 'Hào Quang Đọa Lạc',
            description: 'Mỗi khi bị tấn công sẽ tăng 5 điểm đọa lạc cho người chơi',
            trigger: 'onHit',
            effect: { corruptionGain: 5 }
        }
    },
    darkSeraph: {
        id: 'darkSeraph', name: 'Hỏa Thần Seraph Bóng Tối', icon: 'img/monster/monster_039.png',
        hp: 140, attack: 20, defense: 14, type: 'boss', special: 'holy',
        desc: 'Thiên thần cấp cao nhất bị bóng tối ăn mòn',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'buff', weight: 25 },
            { type: 'heal', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'divineJudgment',
            name: 'Thần Thánh Phán Quyết',
            description: 'Khi HP dưới 30% sẽ tung phán quyết, gây 50 điểm sát thương cố định',
            trigger: 'hpBelow30',
            effect: { fixedDamage: 50 }
        }
    },

    // Hệ Thâm uyên (Vực thẳm)
    abyssMother: {
        id: 'abyssMother', name: 'Mẫu Thân Thâm Uyên', icon: 'img/monster/monster_040.png',
        hp: 135, attack: 18, defense: 17, type: 'boss', special: 'spawn',
        desc: 'Kẻ sinh sản của vực thẳm với đàn con vô tận',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'defend', weight: 25 },
            { type: 'heal', weight: 20 },
            { type: 'special', weight: 25 }
        ],
        specialMechanic: {
            id: 'spawn',
            name: 'Thai Nghén',
            description: 'Mỗi 4 lượt triệu hồi 1 ấu thể xúc tu (15 HP, 5 Tấn công)',
            trigger: 'turnCooldown',
            cooldown: 4,
            effect: { type: 'summon', minionHp: 15, minionAttack: 5 }
        }
    },
    voidEmpress: {
        id: 'voidEmpress', name: 'Hư Không Nữ Hoàng', icon: 'img/monster/monster_041.png',
        hp: 145, attack: 21, defense: 13, type: 'boss', special: 'void',
        desc: 'Thực thể đến từ hư không, bẻ cong thực tại',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'voidRift',
            name: 'Vết Nứt Hư Không',
            description: 'Mỗi đòn tấn công có 20% cơ hội xóa 1 lá bài trong chồng bài bỏ của người chơi',
            trigger: 'onAttack',
            effect: { type: 'removeCard', chance: 0.2 }
        }
    },
    tentacleHorror: {
        id: 'tentacleHorror', name: 'Kinh Hoàng Xúc Tu', icon: 'img/monster/monster_042.png',
        hp: 130, attack: 16, defense: 10, type: 'boss', special: 'bind',
        desc: 'Sứ giả của vực thẳm với vô số xúc tu',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'bind',
            name: 'Xúc Tu Trói Buộc',
            description: 'Mỗi lượt khóa 1 lá bài ngẫu nhiên trên tay người chơi trong 2 lượt',
            trigger: 'everyTurn',
            effect: { type: 'lockCard', duration: 2 }
        }
    },

    // Hệ Tự nhiên/Tinh linh
    darkDryad: {
        id: 'darkDryad', name: 'Khô Diệp Tinh Đọa Lạc', icon: 'img/monster/monster_043.png',
        hp: 110, attack: 18, defense: 12, type: 'boss', special: 'regen',
        desc: 'Linh hồn rừng xanh bị tà ác ăn mòn',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'heal', weight: 30 },
            { type: 'debuff', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'regeneration',
            name: 'Tự Nhiên Tái Sinh',
            description: 'Mỗi lượt hồi 5% HP tối đa',
            trigger: 'everyTurn',
            effect: { healPercent: 0.05 }
        }
    },
    spiderQueen: {
        id: 'spiderQueen', name: 'Nhện Chúa', icon: 'img/monster/monster_044.png',
        hp: 120, attack: 19, defense: 11, type: 'boss', special: 'web',
        desc: 'Kẻ thống trị rừng đen, dệt lưới làm hang',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 35 },
            { type: 'special', weight: 20 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'webTrap',
            name: 'Bẫy Tơ Nhện',
            description: 'Mỗi 3 lượt tung lưới khiến lượt sau người chơi rút bài -2',
            trigger: 'turnCooldown',
            cooldown: 3,
            effect: { type: 'reduceDraw', value: 2, duration: 1 }
        }
    },

    // Hệ Huyết sắc/Oán niệm
    crimsonGrudge: {
        id: 'crimsonGrudge', name: 'Thực Thể Xác Gộp - Huyết Sắc Oán Chủ', icon: 'img/monster/monster_047.png',
        hp: 160, attack: 24, defense: 12, type: 'boss', special: 'aggregate',
        desc: 'Khối thân xác đỏ thẫm tụ hợp từ vô số oán niệm và hài cốt không nguyên vẹn, mỗi tảng thịt đều đang gào thét',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 15 },
            { type: 'special', weight: 20 }
        ],
        specialMechanic: {
            id: 'crimsonAggregate',
            name: 'Huyết Sắc Tụ Hợp',
            description: 'Mỗi khi chịu sát thương, có 30% cơ hội hấp thụ tàn cốt để hồi 10 HP và tăng vĩnh viễn 2 điểm Tấn công',
            trigger: 'onHit',
            effect: { chance: 0.3, healAmount: 10, attackBonus: 2 }
        }
    },

    // Hệ Ánh ảnh/Nguyền rủa
    shadowWraith: {
        id: 'shadowWraith', name: 'U Ảnh Xúc Mục - Phù Thủy Liệm Xác', icon: 'img/monster/monster_048.png',
        hp: 140, attack: 20, defense: 14, type: 'boss', special: 'curse',
        desc: 'Thực thể kinh hoàng lang thang sâu trong nghĩa địa, đôi mắt là vực thẳm vô tận, mặc vải liệm người chết làm áo, ai nhìn vào sẽ bị nguyền rủa',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 35 },
            { type: 'special', weight: 25 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'shroudCurse',
            name: 'Lời Nguyền Vải Liệm',
            description: 'Mỗi lượt gây 1 tầng nguyền rủa lên người chơi, mỗi tầng tăng 5% sát thương người chơi phải nhận, cộng dồn tối đa 10 tầng',
            trigger: 'everyTurn',
            effect: { type: 'stackingDebuff', damageIncreasePerStack: 5, maxStacks: 10 }
        }
    },

    // Hệ Tự nhiên/Dực tộc
    jadeWitch: {
        id: 'jadeWitch', name: 'Phù Thủy Ám Dực Râu Xanh', icon: 'img/monster/monster_051.png',
        hp: 130, attack: 22, defense: 10, type: 'boss', special: 'toxin',
        desc: 'Nữ phù thủy bí ẩn mang đôi cánh xanh biếc, các xúc tu tỏa sương độc chết người, khi vỗ cánh sẽ giải phóng bào tử gây ảo giác',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 30 },
            { type: 'buff', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'jadeCorrosion',
            name: 'Thanh Dực Ám Thực',
            description: 'Mỗi đòn tấn công gây 2 tầng trúng độc (3 sát thương/tầng/lượt), và có 25% cơ hội khiến người chơi không thể dùng thẻ kỹ năng ở lượt sau',
            trigger: 'onAttack',
            effect: { poisonStacks: 2, poisonDamage: 3, silenceChance: 0.25, silenceDuration: 1 }
        }
    },

    // Hệ Huyết sắc/Thâm uyên
    crimsonVortex: {
        id: 'crimsonVortex', name: 'Quái Răng Xoáy Huyết Sắc', icon: 'img/monster/monster_050.png',
        hp: 150, attack: 25, defense: 8, type: 'boss', special: 'rend',
        desc: 'Sinh vật kinh dị bò ra từ vực thẳm đỏ thẫm, miệng nó như một tuabin xoay tròn với vô số răng nanh sắc nhọn như bánh răng',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 15 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'vortexRend',
            name: 'Xoáy Nuốt Xé Xác',
            description: 'Mỗi đòn tấn công có 40% cơ hội xé rách giáp người chơi (-5 giáp) và gây hiệu ứng chảy máu (mất 8% HP hiện tại mỗi lượt)',
            trigger: 'onAttack',
            effect: { armorRendChance: 0.4, armorRendAmount: 5, bleedPercent: 8 }
        }
    },

    // Hệ Tà thần/Tế tự
    darkRitualLord: {
        id: 'darkRitualLord', name: 'Hắc Văn Yểm Tế Chủ - Giác Dực Tòng Thần (Nữ)', icon: 'img/monster/monster_052.png',
        hp: 170, attack: 23, defense: 13, type: 'boss', special: 'ritual',
        desc: 'Tế tư cao cấp phụng sự tà thần, đầu đội vương miện cánh sừng, thân khắc văn tự đen, lấy việc hiến tế làm vui để triệu hồi sức mạnh hư không',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 20 },
            { type: 'special', weight: 25 }
        ],
        specialMechanic: {
            id: 'nightmareRitual',
            name: 'Nghi Lễ Yểm Tế',
            description: 'Mỗi 4 lượt triệu hồi sức mạnh tà thần, gây 30 sát thương cố định và tăng 15 điểm đọa lạc cho người chơi, đồng thời bản thân tăng 20% Tấn công trong 2 lượt',
            trigger: 'turnCooldown',
            cooldown: 4,
            effect: { fixedDamage: 30, corruptionGain: 15, selfAttackBonus: 0.2, buffDuration: 2 }
        }
    },

    // Hệ Long tộc/Tự nhiên
    dragonRootWitch: {
        id: 'dragonRootWitch', name: 'Long Quán Oa Căn Vu Cơ', icon: 'img/monster/monster_053.png',
        hp: 145, attack: 21, defense: 11, type: 'boss', special: 'entangle',
        desc: 'Vu cơ bí ẩn đội vương miện gạc rồng, phía dưới quấn quanh vô số rễ cây xoắn ốc như sinh vật sống, luôn muốn kéo con mồi xuống vực sâu',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 30 },
            { type: 'heal', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'vortexEntangle',
            name: 'Rễ Xoáy Quấn Thân',
            description: 'Mỗi lượt có 35% cơ hội dùng rễ cây trói buộc người chơi làm giảm 1 năng lượng lượt sau; đồng thời mỗi lượt hồi 3% HP tối đa của bản thân',
            trigger: 'everyTurn',
            effect: { entangleChance: 0.35, energyReduction: 1, healPercent: 0.03 }
        }
    },

    // Hệ Quỷ tộc
    crimsonDemonHorns: {
        id: 'crimsonDemonHorns', name: 'Xích Điều Quỷ Giác Võ Cơ', icon: 'img/monster/monster_054.png',
        hp: 155, attack: 24, defense: 12, type: 'boss', special: 'demonRage',
        desc: 'Võ cơ tộc Quỷ mặc giáp đỏ rực, đôi sừng như lửa, tay cầm quỷ nhận với chiến ý ngút trời, truyền thuyết nói cô từng một mình tàn sát cả tòa thành',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'buff', weight: 20 },
            { type: 'charge', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'demonRage',
            name: 'Quỷ Giác Cuồng Nộ',
            description: 'Khi HP dưới 50% vào trạng thái cuồng nộ, Tấn công +8, mỗi đòn đánh kèm 2 tầng Dễ Thương Tổn; mỗi 3 lượt tung "Xích Diễm Trảm" gây 1.5 lần sát thương và giảm 1 năng lượng người chơi lượt sau',
            trigger: 'hpBelow50',
            effect: { attackBonus: 8, vulnerableStacks: 2, specialDamageMultiplier: 1.5, energyReduction: 1 }
        }
    },

    // Hệ Chú thuật
    darkCurseMatriarch: {
        id: 'darkCurseMatriarch', name: 'Huyền Triền Chú Giác Chủ Mẫu', icon: 'img/monster/monster_055.png',
        hp: 140, attack: 19, defense: 14, type: 'boss', special: 'curseWeave',
        desc: 'Chủ mẫu tà ác quấn quanh bởi chú văn đen, đôi sừng khắc đầy bùa chú cấm kỵ, bà ta ăn lời nguyền và mặc oán niệm, kẻ bị bà nhìn thấu sẽ sa vào ác mộng vĩnh hằng',
        intentPattern: [
            { type: 'debuff', weight: 35 },
            { type: 'attack', weight: 25 },
            { type: 'special', weight: 25 },
            { type: 'heal', weight: 15 }
        ],
        specialMechanic: {
            id: 'curseWeave',
            name: 'Huyền Triền Chú Dệt',
            description: 'Mỗi lượt gây 1 tầng lời nguyền lên người chơi (tăng 5% sát thương nhận vào); mỗi 4 lượt tung "Chú Giác Phệ Hồn" gây thêm sát thương dựa trên số tầng nguyền rủa và hồi HP cho bản thân',
            trigger: 'everyTurn',
            effect: { curseStacks: 1, curseDamageBonus: 0.05, soulDevourHealPercent: 0.1 }
        }
    },

    // Hệ Ninja
    uzumakiNaruto: {
        id: 'uzumakiNaruto', name: 'Uzumaki Naruto', icon: 'img/monster/monster_056.png',
        hp: 180, attack: 22, defense: 10, type: 'boss', special: 'kyuubi',
        desc: 'Ninja tóc vàng làng Lá, trong người phong ấn Cửu Vĩ Yêu Hồ, sở hữu Chakra vô tận và ý chí bất khuất, câu cửa miệng là "Tôi sẽ trở thành Hokage!"',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 20 },
            { type: 'special', weight: 20 }
        ],
        specialMechanic: {
            id: 'kyuubi',
            name: 'Chakra Cửu Vĩ',
            description: 'Mỗi 3 lượt triệu hồi 1 Ảnh phân thân (30 HP, 8 Tấn công); khi HP dưới 30% thức tỉnh chế độ Cửu Vĩ, Tấn công gấp đôi, mỗi lượt hồi 5% HP tối đa; sau khi tích lực sẽ tung "Rasengan" gây x2 sát thương',
            trigger: 'hpBelow30',
            effect: { attackMultiplier: 2, healPercent: 0.05, rasenganDamage: 2, shadowCloneHp: 30, shadowCloneAttack: 8 }
        }
    }
};


// ==================== Cấu hình Thánh Di Vật (72 loại) ====================
const RelicConfig = {
    // Nhóm Sinh mệnh
    holyRing: { id: 'holyRing', name: 'Nhẫn Thánh Quang', icon: '💍', price: 150, effect: { maxHp: 10 }, desc: 'HP tối đa +10' },
    bloodPendant: { id: 'bloodPendant', name: 'Dây Chuyền Tươi Máu', icon: '🩸', price: 180, effect: { maxHp: 15 }, desc: 'HP tối đa +15' },
    heartOfGiant: { id: 'heartOfGiant', name: 'Trái Tim Người Khổng Lồ', icon: '❤️', price: 250, effect: { maxHp: 25 }, desc: 'HP tối đa +25' },
    lifeStone: { id: 'lifeStone', name: 'Đá Sinh Mệnh', icon: '💚', price: 200, effect: { maxHp: 20, defense: -1 }, desc: 'HP tối đa +20, Phòng thủ -1' },
    phoenixFeather: { id: 'phoenixFeather', name: 'Lông Vũ Phượng Hoàng', icon: '🪶', price: 350, effect: { maxHp: 30 }, desc: 'HP tối đa +30' },
    vitalityOrb: { id: 'vitalityOrb', name: 'Bảo Châu Sinh Lực', icon: '🟢', price: 120, effect: { maxHp: 8 }, desc: 'HP tối đa +8' },

    // Nhóm Tấn công
    powerGem: { id: 'powerGem', name: 'Đá Sức Mạnh', icon: '💎', price: 200, effect: { attack: 3 }, desc: 'Tấn công +3' },
    demonClaw: { id: 'demonClaw', name: 'Móng Vuốt Ác Quỷ', icon: '🦷', price: 280, effect: { attack: 5 }, desc: 'Tấn công +5' },
    thunderBlade: { id: 'thunderBlade', name: 'Lôi Đình Nhận', icon: '⚡', price: 320, effect: { attack: 6 }, desc: 'Tấn công +6' },
    berserkerMask: { id: 'berserkerMask', name: 'Mặt Nạ Cuồng Chiến', icon: '🎭', price: 180, effect: { attack: 4, defense: -2 }, desc: 'Tấn công +4, Phòng thủ -2' },
    dragonFang: { id: 'dragonFang', name: 'Răng Rồng', icon: '🐉', price: 400, effect: { attack: 8 }, desc: 'Tấn công +8' },
    wrathEmblem: { id: 'wrathEmblem', name: 'Huy Hiệu Phẫn Nộ', icon: '😡', price: 150, effect: { attack: 2 }, desc: 'Tấn công +2' },

    // Nhóm Phòng thủ
    shieldAmulet: { id: 'shieldAmulet', name: 'Hộ Phù Khiên', icon: '🛡️', price: 180, effect: { baseArmor: 5 }, desc: 'Giáp khởi đầu +5' },
    defenseCloak: { id: 'defenseCloak', name: 'Áo Choàng Phòng Ngự', icon: '🧥', price: 150, effect: { defense: 3 }, desc: 'Phòng thủ +3' },
    ironSkin: { id: 'ironSkin', name: 'Hộ Phù Da Sắt', icon: '🔩', price: 220, effect: { defense: 5 }, desc: 'Phòng thủ +5' },
    turtleShell: { id: 'turtleShell', name: 'Mai Rùa', icon: '🐢', price: 200, effect: { baseArmor: 8, attack: -1 }, desc: 'Giáp khởi đầu +8, Tấn công -1' },
    guardianRing: { id: 'guardianRing', name: 'Nhẫn Hộ Vệ', icon: '⭕', price: 180, effect: { defense: 4 }, desc: 'Phòng thủ +4' },
    steelPlate: { id: 'steelPlate', name: 'Giáp Ngực Thép', icon: '🪖', price: 250, effect: { baseArmor: 10 }, desc: 'Giáp khởi đầu +10' },

    // Nhóm Năng lượng
    energyCrystal: { id: 'energyCrystal', name: 'Pha Lê Năng Lượng', icon: '🔮', price: 300, effect: { energy: 1 }, desc: 'Năng lượng mỗi lượt +1' },
    manaGem: { id: 'manaGem', name: 'Đá Pháp Lực', icon: '💠', price: 350, effect: { energy: 1 }, desc: 'Năng lượng mỗi lượt +1' },
    spiritBead: { id: 'spiritBead', name: 'Linh Lực Châu', icon: '🔵', price: 280, effect: { energy: 1, maxHp: -5 }, desc: 'Năng lượng +1, HP tối đa -5' },

    // Nhóm Đọa lạc / Nguyền rủa
    corruptedHeart: { id: 'corruptedHeart', name: 'Trái Tim Đọa Lạc', icon: '🖤', price: 100, effect: { attack: 5, corruption: 10 }, desc: 'Tấn công +5, Đọa lạc +10' },
    darkPact: { id: 'darkPact', name: 'Khế Ước Bóng Tối', icon: '📜', price: 80, effect: { attack: 7, corruption: 15 }, desc: 'Tấn công +7, Đọa lạc +15' },
    sinfulGem: { id: 'sinfulGem', name: 'Đá Tội Lỗi', icon: '💜', price: 120, effect: { energy: 1, corruption: 20 }, desc: 'Năng lượng +1, Đọa lạc +20' },
    lustRing: { id: 'lustRing', name: 'Nhẫn Dục Vọng', icon: '💋', price: 90, effect: { maxHp: 15, corruption: 8 }, desc: 'HP +15, Đọa lạc +8' },
    demonSeal: { id: 'demonSeal', name: 'Ấn Chú Ác Quỷ', icon: '🔴', price: 150, effect: { attack: 4, defense: 2, corruption: 12 }, desc: 'Công/Thủ +4/+2, Đọa lạc +12' },
    abyssTear: { id: 'abyssTear', name: 'Nước Mắt Vực Thẳm', icon: '💧', price: 100, effect: { defense: 5, corruption: 10 }, desc: 'Phòng thủ +5, Đọa lạc +10' },

    // Nhóm Hiệu ứng đặc biệt
    luckyCharm: { id: 'luckyCharm', name: 'Bùa May Mắn', icon: '🍀', price: 200, effect: { goldBonus: 20 }, desc: 'Vàng nhận từ trận chiến +20%' },
    healingTotem: { id: 'healingTotem', name: 'Vật Tổ Trị Liệu', icon: '🗿', price: 220, effect: { healBonus: 3 }, desc: 'Tất cả hiệu ứng trị liệu +3' },
    vampireFang: { id: 'vampireFang', name: 'Răng Nanh Ma Cà Rồng', icon: '🦷', price: 280, effect: { lifesteal: 2 }, desc: 'Hồi 2 HP khi tấn công' },
    windBoots: { id: 'windBoots', name: 'Giày Tật Phong', icon: '👢', price: 180, effect: { drawBonus: 1 }, desc: 'Mỗi lượt rút thêm 1 lá bài' },
    mirrorShard: { id: 'mirrorShard', name: 'Mảnh Gương', icon: '🪞', price: 250, effect: { reflect: 2 }, desc: 'Phản lại 2 sát thương khi bị đánh' },
    ancientCoin: { id: 'ancientCoin', name: 'Đồng Tiền Cổ', icon: '🪙', price: 150, effect: { shopDiscount: 15 }, desc: 'Giá cửa hàng giảm 15%' },

    // Thánh di vật Sắc dục (20 loại)
    succubusKiss: { id: 'succubusKiss', name: 'Nụ Hôn Mị Ma', icon: '💋', price: 80, effect: { attack: 4, hDamageBonus: 3, corruption: 5 }, desc: 'Tấn công +4, Sát thương H +3, Đọa lạc +5' },
    lustChains: { id: 'lustChains', name: 'Xiềng Xích Dục Vọng', icon: '⛓️', price: 100, effect: { defense: 3, hDamageBonus: 2, corruption: 8 }, desc: 'Phòng thủ +3, Sát thương H +2, Đọa lạc +8' },
    pinkCrystal: { id: 'pinkCrystal', name: 'Thạch Anh Hồng', icon: '💎', price: 120, effect: { hDamageBonus: 5, corruption: 10 }, desc: 'Sát thương H +5, Đọa lạc +10' },
    aphrodisiac: { id: 'aphrodisiac', name: 'Mị Dược Vĩnh Cửu', icon: '🧪', price: 60, effect: { attack: 6, defense: -2, corruption: 12 }, desc: 'Tấn công +6, Phòng thủ -2, Đọa lạc +12' },
    slutCollar: { id: 'slutCollar', name: 'Vòng Cổ Dâm Văn', icon: '⭕', price: 90, effect: { energy: 1, corruption: 15 }, desc: 'Năng lượng +1, Đọa lạc +15' },
    breedingMark: { id: 'breedingMark', name: 'Ấn Ký Sinh Sản', icon: '🔥', price: 70, effect: { maxHp: 20, corruption: 10 }, desc: 'HP +20, Đọa lạc +10' },
    milkingCup: { id: 'milkingCup', name: 'Cốc Vắt Sữa', icon: '🥛', price: 85, effect: { healBonus: 5, corruption: 8 }, desc: 'Trị liệu +5, Đọa lạc +8' },
    vibrator: { id: 'vibrator', name: 'Gậy Rung Ma Pháp', icon: '🔔', price: 95, effect: { hDamageBonus: 4, drawBonus: 1, corruption: 6 }, desc: 'Sát thương H +4, Rút bài +1, Đọa lạc +6' },
    lewdTattoo: { id: 'lewdTattoo', name: 'Hình Xăm Dâm Văn', icon: '🌸', price: 110, effect: { attack: 3, hDamageBonus: 3, corruption: 12 }, desc: 'Tấn công +3, Sát thương H +3, Đọa lạc +12' },
    tentacleSeed: { id: 'tentacleSeed', name: 'Hạt Giống Xúc Tu', icon: '🐙', price: 130, effect: { attack: 5, reflect: 2, corruption: 15 }, desc: 'Tấn công +5, Phản sát thương 2, Đọa lạc +15' },
    demonWomb: { id: 'demonWomb', name: 'Tử Cung Ác Quỷ', icon: '💜', price: 150, effect: { maxHp: 30, hDamageBonus: 6, corruption: 20 }, desc: 'HP +30, Sát thương H +6, Đọa lạc +20' },
    slaveRing: { id: 'slaveRing', name: 'Nhẫn Nô Lệ', icon: '💍', price: 75, effect: { defense: 4, corruption: 10 }, desc: 'Phòng thủ +4, Đọa lạc +10' },
    chastityKey: { id: 'chastityKey', name: 'Chìa Khóa Đai Trinh Tiết', icon: '🔑', price: 140, effect: { energy: 1, healBonus: 3, corruption: 8 }, desc: 'Năng lượng +1, Trị liệu +3, Đọa lạc +8' },
    brokenHeart: { id: 'brokenHeart', name: 'Trái Tim Tan Vỡ', icon: '💔', price: 65, effect: { attack: 5, maxHp: -10, corruption: 5 }, desc: 'Tấn công +5, HP -10, Đọa lạc +5' },
    sinfulMirror: { id: 'sinfulMirror', name: 'Gương Dâm Dục', icon: '🪞', price: 100, effect: { hDamageBonus: 7, reflect: 1, corruption: 10 }, desc: 'Sát thương H +7, Phản sát thương 1, Đọa lạc +10' },
    pleasureBell: { id: 'pleasureBell', name: 'Chuông Khoái Cảm', icon: '🔔', price: 88, effect: { drawBonus: 1, hDamageBonus: 2, corruption: 6 }, desc: 'Rút bài +1, Sát thương H +2, Đọa lạc +6' },
    corruptedHalo: { id: 'corruptedHalo', name: 'Vòng Thánh Đọa Lạc', icon: '😇', price: 160, effect: { attack: 4, defense: 4, corruption: 18 }, desc: 'Công/Thủ +4, Đọa lạc +18' },
    wombMark: { id: 'wombMark', name: 'Ấn Ký Tử Cung', icon: '❤️', price: 115, effect: { hDamageBonus: 8, corruption: 15 }, desc: 'Sát thương H +8, Đọa lạc +15' },
    petEars: { id: 'petEars', name: 'Tai Thú Cưng', icon: '🐱', price: 70, effect: { defense: 2, goldBonus: 15, corruption: 5 }, desc: 'Phòng thủ +2, Vàng +15%, Đọa lạc +5' },
    tailPlug: { id: 'tailPlug', name: 'Nút Đuôi', icon: '🐕', price: 95, effect: { attack: 3, hDamageBonus: 4, corruption: 10 }, desc: 'Tấn công +3, Sát thương H +4, Đọa lạc +10' },

    // Thánh di vật thường bổ sung
    angelTear: { id: 'angelTear', name: 'Nước Mắt Thiên Thần', icon: '💧', price: 280, effect: { maxHp: 20, healBonus: 2 }, desc: 'HP +20, Trị liệu +2' },
    soulGem: { id: 'soulGem', name: 'Ngọc Linh Hồn', icon: '🔷', price: 320, effect: { maxHp: 35 }, desc: 'HP tối đa +35' },
    lifebloodAmulet: { id: 'lifebloodAmulet', name: 'Hộ Phù Huyết Mạch', icon: '❣️', price: 180, effect: { maxHp: 12, defense: 1 }, desc: 'HP +12, Phòng thủ +1' },

    shadowDagger: { id: 'shadowDagger', name: 'Dao Găm Ám Ảnh', icon: '🗡️', price: 220, effect: { attack: 4, drawBonus: 1 }, desc: 'Tấn công +4, Rút bài +1' },
    flameSword: { id: 'flameSword', name: 'Kiếm Rực Lửa', icon: '🔥', price: 350, effect: { attack: 7 }, desc: 'Tấn công +7' },
    venomFang: { id: 'venomFang', name: 'Răng Độc', icon: '🐍', price: 200, effect: { attack: 3, lifesteal: 1 }, desc: 'Tấn công +3, Hút máu 1' },
    warBanner: { id: 'warBanner', name: 'Cờ Chiến', icon: '🚩', price: 160, effect: { attack: 2, defense: 2 }, desc: 'Công/Thủ +2' },

    diamondShield: { id: 'diamondShield', name: 'Khiên Kim Cương', icon: '💎', price: 300, effect: { baseArmor: 12 }, desc: 'Giáp khởi đầu +12' },
    frostArmor: { id: 'frostArmor', name: 'Giáp Băng Giá', icon: '❄️', price: 240, effect: { defense: 6, attack: -1 }, desc: 'Phòng thủ +6, Tấn công -1' },
    holyShield: { id: 'holyShield', name: 'Thánh Thuẫn', icon: '✝️', price: 280, effect: { defense: 5, maxHp: 10 }, desc: 'Phòng thủ +5, HP +10' },

    arcaneOrb: { id: 'arcaneOrb', name: 'Cầu Pháp Thuật', icon: '🟣', price: 380, effect: { energy: 1, attack: 2 }, desc: 'Năng lượng +1, Tấn công +2' },
    wisdomCrown: { id: 'wisdomCrown', name: 'Vương Miện Trí Tuệ', icon: '👑', price: 400, effect: { energy: 1, drawBonus: 1 }, desc: 'Năng lượng +1, Rút bài +1' },

    treasureMap: { id: 'treasureMap', name: 'Bản Đồ Kho Báu', icon: '🗺️', price: 180, effect: { goldBonus: 30 }, desc: 'Vàng thưởng +30%' },
    healingSpring: { id: 'healingSpring', name: 'Suối Trị Liệu', icon: '⛲', price: 250, effect: { healBonus: 5 }, desc: 'Hiệu quả trị liệu +5' },
    thornyVine: { id: 'thornyVine', name: 'Dây Leo Gai Góc', icon: '🌿', price: 220, effect: { reflect: 3 }, desc: 'Phản sát thương 3 điểm' },
    swiftBoots: { id: 'swiftBoots', name: 'Ủng Tốc Độ', icon: '🥾', price: 200, effect: { drawBonus: 1, defense: 1 }, desc: 'Rút bài +1, Phòng thủ +1' },
    merchantBadge: { id: 'merchantBadge', name: 'Huy Hiệu Thương Nhân', icon: '🏷️', price: 120, effect: { shopDiscount: 20 }, desc: 'Giảm giá cửa hàng 20%' },
    vampireCape: { id: 'vampireCape', name: 'Áo Choàng Ma Cà Rồng', icon: 'BAT', price: 320, effect: { lifesteal: 3, maxHp: -10 }, desc: 'Hút máu 3, HP -10' },

    // Thánh di vật Sắc dục bổ sung
    darkFeather: { id: 'darkFeather', name: 'Lông Vũ Bóng Đêm', icon: '🦋', price: 180, effect: { attack: 6, hDamageBonus: 5, corruption: 15 }, desc: 'Tấn công +6, Sát thương H +5, Đọa lạc +15' },
    seductiveGaze: { id: 'seductiveGaze', name: 'Ánh Nhìn Quyến Rũ', icon: '👁️', price: 90, effect: { hDamageBonus: 6, corruption: 8 }, desc: 'Sát thương H +6, Đọa lạc +8' },
    sinfulTongue: { id: 'sinfulTongue', name: 'Lưỡi Dâm Dục', icon: '👅', price: 100, effect: { hDamageBonus: 4, healBonus: 2, corruption: 10 }, desc: 'Sát thương H +4, Trị liệu +2, Đọa lạc +10' },
    pleasureNeedle: { id: 'pleasureNeedle', name: 'Kim Khoái Cảm', icon: '💉', price: 75, effect: { attack: 3, hDamageBonus: 3, corruption: 6 }, desc: 'Tấn công +3, Sát thương H +3, Đọa lạc +6' },
    lewdBracelet: { id: 'lewdBracelet', name: 'Vòng Tay Dâm Dục', icon: '📿', price: 85, effect: { defense: 3, hDamageBonus: 2, corruption: 7 }, desc: 'Phòng thủ +3, Sát thương H +2, Đọa lạc +7' },
    corruptedCrown: { id: 'corruptedCrown', name: 'Vương Miện Đọa Lạc', icon: '👸', price: 200, effect: { energy: 1, hDamageBonus: 4, corruption: 18 }, desc: 'Năng lượng +1, Sát thương H +4, Đọa lạc +18' },
    infernalCrown: { id: 'infernalCrown', name: 'Vương Miện Luyện Ngục', icon: '😈', price: 150, effect: { attack: 5, hDamageBonus: 5, corruption: 12 }, desc: 'Tấn công +5, Sát thương H +5, Đọa lạc +12' },
    sinChains: { id: 'sinChains', name: 'Xiềng Xích Tội Lỗi', icon: '🔗', price: 110, effect: { defense: 4, hDamageBonus: 3, corruption: 9 }, desc: 'Phòng thủ +4, Sát thương H +3, Đọa lạc +9' },
    fleshRose: { id: 'fleshRose', name: 'Hoa Hồng Nhục Dục', icon: '🌹', price: 95, effect: { maxHp: 15, hDamageBonus: 4, corruption: 8 }, desc: 'HP +15, Sát thương H +4, Đọa lạc +8' },
    hellfire: { id: 'hellfire', name: 'Hỏa Ngục', icon: '🔥', price: 170, effect: { attack: 7, corruption: 20 }, desc: 'Tấn công +7, Đọa lạc +20' },
    abyssMark: { id: 'abyssMark', name: 'Ấn Ký Vực Thẳm', icon: '🌀', price: 130, effect: { hDamageBonus: 8, maxHp: -5, corruption: 12 }, desc: 'Sát thương H +8, HP -5, Đọa lạc +12' },
    serpentTail: { id: 'serpentTail', name: 'Đuôi Xà Yêu', icon: '🦎', price: 120, effect: { attack: 4, hDamageBonus: 4, corruption: 10 }, desc: 'Tấn công +4, Sát thương H +4, Đọa lạc +10' },
    lustPotion: { id: 'lustPotion', name: 'Mị Dược Vĩnh Hằng', icon: '🍷', price: 80, effect: { hDamageBonus: 5, defense: -1, corruption: 8 }, desc: 'Sát thương H +5, Phòng thủ -1, Đọa lạc +8' },
    pleasureOrb: { id: 'pleasureOrb', name: 'Bảo Châu Khoái Cảm', icon: '🔮', price: 140, effect: { hDamageBonus: 6, drawBonus: 1, corruption: 10 }, desc: 'Sát thương H +6, Rút bài +1, Đọa lạc +10' },
    sinfulNecklace: { id: 'sinfulNecklace', name: 'Vòng Cổ Tội Lỗi', icon: '📿', price: 105, effect: { maxHp: 10, hDamageBonus: 5, corruption: 9 }, desc: 'HP +10, Sát thương H +5, Đọa lạc +9' },
    corruptedWomb: { id: 'corruptedWomb', name: 'Bào Thai Đọa Lạc', icon: '🖤', price: 160, effect: { hDamageBonus: 10, corruption: 25 }, desc: 'Sát thương H +10, Đọa lạc +25' },
    succubusHeart: { id: 'succubusHeart', name: 'Trái Tim Mị Ma', icon: '💗', price: 190, effect: { attack: 5, hDamageBonus: 7, lifesteal: 2, corruption: 15 }, desc: 'Tấn công +5, Sát thương H +7, Hút máu 2, Đọa lạc +15' },
    lustGem: { id: 'lustGem', name: 'Tinh Thạch Dục Vọng', icon: '💠', price: 145, effect: { hDamageBonus: 9, reflect: 1, corruption: 12 }, desc: 'Sát thương H +9, Phản sát thương 1, Đọa lạc +12' }
};

// ==================== Cấu hình Trạng thái Đặc biệt (24 loại) ====================
const SpecialStatusConfig = {
    // Ảnh hưởng Năng lượng / Chi phí
    跳蛋: { id: 'Trứng rung', icon: '🔔', effect: 'energy', value: -1, desc: 'Giảm 1 năng lượng khi bắt đầu trận chiến', fullDesc: 'Một quả trứng rung đã được cấy vào cơ thể, khiến bạn không thể tập trung tinh thần.' },
    束缚锁链: { id: 'Xiềng xích trói buộc', icon: '⛓️', effect: 'energy', value: -1, desc: 'Giảm 1 năng lượng', fullDesc: 'Xiềng xích trên cổ tay hạn chế hành động, khiến bạn khó lòng dốc toàn lực.' },
    精神污染: { id: 'Ô nhiễm tinh thần', icon: '🌀', effect: 'energy', value: -2, desc: 'Giảm 2 năng lượng', fullDesc: 'Những tiếng thì thầm từ vực thẳm liên tục ăn mòn ý thức, khiến bạn khó lòng tập trung.' },

    // Tăng giá trị Đọa lạc
    淫纹: { id: 'Dâm văn', icon: '🔮', effect: 'corruptionPerRest', value: 5, desc: 'Tăng 5 đọa lạc mỗi khi nghỉ ngơi', fullDesc: 'Một ma văn dâm mị đã được khắc lên người, khiến cơ thể trở nên nhạy cảm hơn.' },
    羞耻衣: { id: 'Y phục nhục nhã', icon: '👙', effect: 'corruptionPerBattle', value: 3, desc: 'Tăng 3 đọa lạc khi bắt đầu trận chiến', fullDesc: 'Bị ép buộc phải mặc những bộ trang phục thiếu vải đầy nhục nhã.' },
    魅魔契约: { id: 'Khế ước Mị Ma', icon: '💋', effect: 'corruptionPerRest', value: 8, desc: 'Tăng 8 đọa lạc khi nghỉ ngơi', fullDesc: 'Đã ký khế ước với Mị Ma, mỗi khi nghỉ ngơi sẽ bị xâm chiếm vào trong giấc mơ.' },
    淫欲诅咒: { id: 'Lời nguyền dâm dục', icon: '💜', effect: 'corruptionPerBattle', value: 5, desc: 'Tăng 5 đọa lạc khi bắt đầu trận chiến', fullDesc: 'Bị trúng lời nguyền dâm dục, khiến cơ thể hưng phấn bất thường khi chiến đấu.' },
    堕落种子: { id: 'Hạt giống đọa lạc', icon: '🌱', effect: 'corruptionPerRest', value: 10, desc: 'Tăng 10 đọa lạc khi nghỉ ngơi', fullDesc: 'Một hạt giống đọa lạc đã được cấy vào trong người, đang âm thầm ăn mòn tâm trí.' },

    // Ảnh hưởng Phòng thủ
    乳环: { id: 'Khuyên ngực', icon: '⭕', effect: 'defense', value: -2, desc: 'Phòng thủ -2', fullDesc: 'Đầu ngực bị xuyên qua bởi những chiếc vòng bạc, gây ra những cơn đau âm ỉ.' },
    肚脐钉: { id: 'Khuyên rốn', icon: '📍', effect: 'defense', value: -1, desc: 'Phòng thủ -1', fullDesc: 'Trang sức xuyên qua rốn gây khó chịu mỗi khi cử động.' },
    脚铐: { id: 'Xiềng chân', icon: '🔗', effect: 'defense', value: -3, desc: 'Phòng thủ -3', fullDesc: 'Xiềng xích sắt trên cổ chân khiến việc di chuyển trở nên khó khăn.' },

    // Ảnh hưởng HP
    项圈: { id: 'Vòng cổ', icon: '⚫', effect: 'maxHp', value: -10, desc: 'HP tối đa -10', fullDesc: 'Bị đeo vòng cổ nô lệ, biểu tượng của sự khuất phục.' },
    虚弱诅咒: { id: 'Lời nguyền suy nhược', icon: '💀', effect: 'maxHp', value: -15, desc: 'HP tối đa -15', fullDesc: 'Bị trúng lời nguyền suy nhược, khiến sinh lực liên tục bị rút cạn.' },
    生命吸取: { id: 'Hút sinh mệnh', icon: '🩸', effect: 'maxHp', value: -20, desc: 'HP tối đa -20', fullDesc: 'Có thứ gì đó đang liên tục hút lấy sinh mạng của bạn.' },

    // Giới hạn Trị liệu
    贞操带: { id: 'Đai trinh tiết', icon: '🔒', effect: 'healLimit', value: 50, desc: 'Không thể hồi phục HP vượt quá 50%', fullDesc: 'Bị khóa bởi đai trinh tiết, không thể tự do chạm vào cơ thể mình.' },
    诅咒伤口: { id: 'Vết thương nguyền rủa', icon: '🩹', effect: 'healLimit', value: 30, desc: 'Không thể hồi phục HP vượt quá 30%', fullDesc: 'Vết thương trên người bị nguyền rủa, không thể chữa lành bình thường.' },

    // Ảnh hưởng Tấn công
    催情药: { id: 'Thuốc kích dục', icon: '💊', effect: 'attack', value: -3, desc: 'Tấn công -3', fullDesc: 'Dược lực của thuốc kích dục còn sót lại khiến cơ thể bủn rủn, vô lực.' },
    媚药中毒: { id: 'Trúng độc mị dược', icon: '🧪', effect: 'attack', value: -5, desc: 'Tấn công -5', fullDesc: 'Hiệu ứng mị dược duy trì khiến cơ thể không thể phát lực.' },
    肌肉萎缩: { id: 'Teo cơ', icon: '💪', effect: 'attack', value: -4, desc: 'Tấn công -4', fullDesc: 'Bị giam cầm lâu ngày dẫn đến teo cơ, sức mạnh giảm sút nghiêm trọng.' },

    // Tăng sát thương nhận vào
    烙印: { id: 'Nung dấu', icon: '🔥', effect: 'damageTaken', value: 50, desc: 'Sát thương nhận vào +50%', fullDesc: 'Trên người bị nung dấu ấn ký của chủ nhân.' },
    脆弱印记: { id: 'Ấn ký mong manh', icon: '❌', effect: 'damageTaken', value: 30, desc: 'Sát thương nhận vào +30%', fullDesc: 'Bị khắc lên ấn ký mong manh, khiến khả năng chịu đựng giảm sút.' },
    诅咒标记: { id: 'Dấu ấn nguyền rủa', icon: '☠️', effect: 'damageTaken', value: 100, desc: 'Sát thương nhận vào +100%', fullDesc: 'Bị đánh dấu bởi lời nguyền vực thẳm, sát thương nhận vào gấp đôi.' },

    // Hiệu ứng hỗn hợp
    完全支配: { id: 'Chi phối hoàn toàn', icon: '👑', effect: 'multiple', value: 0, desc: 'Công -2, Thủ -2, Đọa lạc +5/trận chiến', fullDesc: 'Đã bị chi phối hoàn toàn, cả thân xác và linh hồn đều không còn thuộc về mình.', effects: { attack: -2, defense: -2, corruptionPerBattle: 5 } },
    奴隶烙印: { id: 'Dấu ấn nô lệ', icon: '🔥', effect: 'multiple', value: 0, desc: 'HP -10, Sát thương nhận vào +25%', fullDesc: 'Bị nung dấu nô lệ, đánh dấu danh tính thấp kém của bạn.', effects: { maxHp: -10, damageTaken: 25 } },

    // Biến đổi cơ thể
    小便失禁: { id: 'Tiểu tiện không tự chủ', icon: '💦', effect: 'multiple', value: 0, desc: 'Phòng thủ -2, Đọa lạc +3/trận chiến', fullDesc: 'Không thể kiểm soát việc đi tiểu, thường xuyên bị són khi chiến đấu, vô cùng nhục nhã.', effects: { defense: -2, corruptionPerBattle: 3 } },
    大便失禁: { id: 'Đại tiện không tự chủ', icon: '💩', effect: 'multiple', value: 0, desc: 'Phòng thủ -3, Đọa lạc +5/trận chiến', fullDesc: 'Cơ thắt đã bị huấn luyện đến mức không thể co bóp, có thể mất kiểm soát bất cứ lúc nào.', effects: { defense: -3, corruptionPerBattle: 5 } },
    巨乳化: { id: 'Ngực khổng lồ hóa', icon: '🍈', effect: 'multiple', value: 0, desc: 'Năng lượng -1, Phòng thủ -2', fullDesc: 'Bộ ngực bị cải tạo thành cỡ I cup khổng lồ, to đến mức hạn chế hành động, rung lắc dữ dội khi chiến đấu.', effects: { energy: -1, defense: -2 } },
    子宫纹身: { id: 'Xăm hình tử cung', icon: '❤️', effect: 'corruptionPerRest', value: 8, desc: 'Đọa lạc nghỉ ngơi +8', fullDesc: 'Phần bụng dưới bị khắc hình xăm tử cung hình trái tim, tượng trưng cho thân phận nô lệ tình dục.' },
    敏感体质: { id: 'Thể chất nhạy cảm', icon: '💗', effect: 'damageTaken', value: 40, desc: 'Sát thương nhận vào +40%', fullDesc: 'Toàn thân trở nên cực kỳ nhạy cảm, chỉ cần chạm nhẹ cũng đủ khiến bạn run rẩy.' },
    发情期: { id: 'Thời kỳ phát tình', icon: '🔥', effect: 'multiple', value: 0, desc: 'Tấn công -2, Đọa lạc +4/trận chiến', fullDesc: 'Bị đưa vào trạng thái phát tình vĩnh viễn, cơ thể luôn trong tình trạng nóng rực.', effects: { attack: -2, corruptionPerBattle: 4 } },
    乳头肥大: { id: 'Đầu ngực phì đại', icon: '⭕', effect: 'defense', value: -2, desc: 'Phòng thủ -2', fullDesc: 'Đầu ngực bị cải tạo trở nên to bất thường, quần áo không thể che giấu nổi.' },
    阴蒂肥大: { id: 'Âm vật phì đại', icon: '💎', effect: 'corruptionPerBattle', value: 5, desc: 'Đọa lạc chiến đấu +5', fullDesc: 'Âm vật bị cải tạo to như ngón tay cái, chỉ cần cử động nhẹ cũng thấy hưng phấn.' },
    精神支配: { id: 'Chi phối tinh thần', icon: '🧠', effect: 'energy', value: -2, desc: 'Năng lượng -2', fullDesc: 'Tinh thần bị chi phối hoàn toàn, không thể tự suy nghĩ độc lập.' },
    性奴调教: { id: 'Huấn luyện nô lệ tình dục', icon: '👑', effect: 'multiple', value: 0, desc: 'Tấn công -3, Phòng thủ -3', fullDesc: 'Đã bị huấn luyện thành một nô lệ tình dục phục tùng, mất đi ý chí phản kháng.', effects: { attack: -3, defense: -3 } },
    子宫下垂: { id: 'Sa tử cung', icon: '⬇️', effect: 'maxHp', value: -20, desc: 'HP -20', fullDesc: 'Tử cung bị sử dụng quá mức dẫn đến bị sa, cơ thể trở nên suy yếu.' },
    乳汁分泌: { id: 'Tiết sữa', icon: '🍼', effect: 'corruptionPerRest', value: 6, desc: 'Đọa lạc nghỉ ngơi +6', fullDesc: 'Bộ ngực liên tục tiết ra sữa, không cách nào dừng lại được.' },
    永久发情: { id: 'Phát tình vĩnh viễn', icon: '💯', effect: 'multiple', value: 0, desc: 'Tấn công -3, Đọa lạc +8/nghỉ ngơi', fullDesc: 'Bị dính lời nguyền phát tình vĩnh viễn, khao khát không lúc nào nguôi.', effects: { attack: -3, corruptionPerRest: 8 } },

    // Thú hóa
    触手寄生: { id: 'Ký sinh xúc tu', icon: '🐙', effect: 'multiple', value: 0, desc: 'Năng lượng -2, Đọa lạc +6/trận chiến', fullDesc: 'Bên trong cơ thể bị cấy sinh vật xúc tu, có thể thò ra ngoài bất cứ lúc nào.', effects: { energy: -2, corruptionPerBattle: 6 } },
    史莱姆化: { id: 'Slime hóa', icon: '🧫', effect: 'multiple', value: 0, desc: 'Phòng thủ -4, Sát thương nhận vào +30%', fullDesc: 'Cơ thể trở nên mềm mại như Slime, có thể bị nhào nặn tùy ý.', effects: { defense: -4, damageTaken: 30 } },

    // Biến đổi đặc biệt
    扶她化: { id: 'Futanari hóa', icon: '🍆', effect: 'multiple', value: 0, desc: 'Tấn công +3, Đọa lạc +6/trận chiến', fullDesc: 'Phần bụng dưới mọc thêm nhục bổng, sẽ trở nên hưng phấn bất thường khi chiến đấu.', effects: { attack: 3, corruptionPerBattle: 6 } },
    小穴脱出: { id: 'Sa âm đạo', icon: '🌸', effect: 'multiple', value: 0, desc: 'Phòng thủ -3, Đọa lạc nghỉ ngơi +8', fullDesc: 'Thành âm đạo bị lộn ra ngoài, lộ ra lớp niêm mạc hồng hào nhạy cảm.', effects: { defense: -3, corruptionPerRest: 8 } },
    肛门脱出: { id: 'Sa trực tràng', icon: '🔴', effect: 'multiple', value: 0, desc: 'Phòng thủ -4, Đọa lạc nghỉ ngơi +10', fullDesc: 'Hậu môn bị lộn ra ngoài, lộ ra khối thịt đỏ hực khiến việc đi lại cũng khó khăn.', effects: { defense: -4, corruptionPerRest: 10 } },
    子宫脱出: { id: 'Sa tử cung hoàn toàn', icon: '❤️', effect: 'multiple', value: 0, desc: 'HP -25, Đọa lạc nghỉ ngơi +12', fullDesc: 'Tử cung đã hoàn toàn bị lộn ra ngoài, treo lủng lẳng giữa hai chân, cơ thể cực kỳ suy nhược.', effects: { maxHp: -25, corruptionPerRest: 12 } },

    // Hypnosis / Cải tạo nhận thức (12 loại)
    裸体常识: { id: 'Nhận thức khỏa thân', icon: '👗', effect: 'multiple', value: 0, desc: 'Phòng thủ -3, Đọa lạc +4/trận chiến', fullDesc: 'Bị thôi miên cài đặt nhận thức "khỏa thân mới là bình thường", luôn vô thức cởi bỏ quần áo và cảm thấy mặc đồ mới là nhục nhã.', effects: { defense: -3, corruptionPerBattle: 4 } },
    交配义务: { id: 'Nghĩa vụ giao phối', icon: '💕', effect: 'multiple', value: 0, desc: 'Đọa lạc nghỉ ngơi +10, Năng lượng -1', fullDesc: 'Bị thôi miên cài đặt nhận thức "mỗi ngày bắt buộc phải giao phối", nếu không hoàn thành sẽ lo âu bồn chồn, không thể tập trung.', effects: { corruptionPerRest: 10, energy: -1 } },
    精液渴望: { id: 'Khao khát tinh dịch', icon: '💦', effect: 'multiple', value: 0, desc: 'HP -10, Đọa lạc +5/trận chiến', fullDesc: 'Bị thôi miên tin rằng "tinh dịch là chất dinh dưỡng tốt nhất", cơ thể khao khát có được nó, nếu không uống sẽ suy nhược.', effects: { maxHp: -10, corruptionPerBattle: 5 } },
    快感忠诚: { id: 'Trung thành với khoái cảm', icon: '🎀', effect: 'multiple', value: 0, desc: 'Tấn công -3, Đọa lạc nghỉ ngơi +6', fullDesc: 'Bị thôi miên rằng "kẻ ban cho khoái cảm chính là chủ nhân", không thể nảy sinh ác ý với kẻ vừa khiến mình đạt cực khoái.', effects: { attack: -3, corruptionPerRest: 6 } },
    露出本能: { id: 'Bản năng phô bày', icon: '👀', effect: 'corruptionPerBattle', value: 6, desc: 'Đọa lạc chiến đấu +6', fullDesc: 'Bị thôi miên rằng "phô bày cơ thể trước mặt người khác sẽ rất hưng phấn", vô thức phô bày vùng kín khi chiến đấu.' },
    肉便器自觉: { id: 'Tự giác làm bồn chứa tinh', icon: '🚽', effect: 'multiple', value: 0, desc: 'Tấn công -4, Phòng thủ -4', fullDesc: 'Bị thôi miên rằng "mình chỉ là một cái bồn chứa tinh", đánh mất lòng tự trọng và ý chí phản kháng của con người.', effects: { attack: -4, defense: -4 } },
    绝对服从: { id: 'Phục tùng tuyệt đối', icon: '🐕', effect: 'multiple', value: 0, desc: 'Năng lượng -2, Phòng thủ -2', fullDesc: 'Bị thôi miên cài đặt ám thị phục tùng tuyệt đối, không thể làm trái bất kỳ mệnh lệnh nào, chỉ biết vâng lời.', effects: { energy: -2, defense: -2 } },
    性奴本能: { id: 'Bản năng nô lệ tình dục', icon: '📿', effect: 'multiple', value: 0, desc: 'Đọa lạc nghỉ ngơi +8, Tấn công -2', fullDesc: 'Bị thôi miên rằng "làm vui lòng người khác là hạnh phúc lớn nhất", chủ động tìm kiếm cơ hội để hầu hạ kẻ khác.', effects: { corruptionPerRest: 8, attack: -2 } },
    羞耻消除: { id: 'Loại bỏ xấu hổ', icon: '😳', effect: 'corruptionPerRest', value: 10, desc: 'Đọa lạc nghỉ ngơi +10', fullDesc: 'Sự xấu hổ đã bị thôi miên loại bỏ hoàn toàn, dù làm bất kỳ việc dâm loạn nào cũng không thấy hổ thẹn.' },
    发情触发: { id: 'Kích hoạt phát tình', icon: '🔔', effect: 'multiple', value: 0, desc: 'Đọa lạc chiến đấu +6, Phòng thủ -2', fullDesc: 'Bị cài đặt ám thị thôi miên "nghe thấy tiếng chuông là sẽ phát tình", hoàn toàn không thể kiểm soát khi chiến đấu.', effects: { corruptionPerBattle: 6, defense: -2 } },
    母性觉醒: { id: 'Thức tỉnh mẫu tính', icon: '🤰', effect: 'multiple', value: 0, desc: 'Đọa lạc nghỉ ngơi +8, HP -15', fullDesc: 'Bị thôi miên rằng "được xuất tinh vào trong và mang thai là hạnh phúc tột cùng", luôn khao khát tử cung được lấp đầy.', effects: { corruptionPerRest: 8, maxHp: -15 } },
    口交中毒: { id: 'Nghiện khẩu giao', icon: '👄', effect: 'multiple', value: 0, desc: 'Năng lượng -1, Đọa lạc +4/trận chiến', fullDesc: 'Bị thôi miên rằng "ngậm nhục bổng mới thấy an tâm", miệng không ngậm thứ gì đó sẽ thấy bồn chồn lo âu.', effects: { energy: -1, corruptionPerBattle: 4 } }
};

// Trình quản lý trạng thái đặc biệt
const SpecialStatusManager = {
    // Các trạng thái đặc biệt hiện đang kích hoạt
    statuses: {},

    // Khởi tạo
    init: function (savedStatuses = null) {
        if (savedStatuses) {
            this.statuses = { ...savedStatuses };
        } else {
            this.statuses = {};
        }
        this.updateDisplay();
    },

    // Thêm trạng thái đặc biệt
    // source: 'curse' (thẻ nguyền rủa), 'starting' (chọn lúc bắt đầu), 'blackmarket' (chợ đen)
    add: function (statusId, source = 'curse') {
        const config = SpecialStatusConfig[statusId];
        if (!config) return false;

        this.statuses[statusId] = {
            id: statusId,
            icon: config.icon,
            effect: config.effect,
            value: config.value,
            desc: config.desc,
            fullDesc: config.fullDesc,
            effects: config.effects || null, // 🔧 Lưu trữ các hiệu ứng phức hợp
            source: source, // 🔧 Ghi lại nguồn gốc
            addedAt: Date.now()
        };

        this.save();
        this.updateDisplay();
        this.applyEffects();

        // 🔧 Cập nhật hiển thị trên thanh trạng thái
        if (typeof PlayerState !== 'undefined') {
            PlayerState.updateDisplay();
        }

        // 🔧 Nếu trạng thái được thêm thuộc loại thôi miên, áp dụng ghi đè để ẩn khung nhập liệu
        if (window.HypnosisOptionOverride && window.HypnosisOptionOverride.hypnosisStatusIds.includes(statusId)) {
            window.HypnosisOptionOverride.applyOverride();
            window.HypnosisOptionOverride.modifyOptionButtons();
            console.log('[Trạng thái đặc biệt] Đã thêm trạng thái thôi miên, ẩn khung nhập liệu:', statusId);
        }

        console.log('[Trạng thái đặc biệt] Đã thêm:', statusId, 'Nguồn:', source);
        return true;
    },

    // Loại bỏ trạng thái đặc biệt
    remove: function (statusId) {
        if (this.statuses[statusId]) {
            delete this.statuses[statusId];
            this.save();
            this.updateDisplay();
            this.applyEffects();

            // 🔧 Đồng thời loại bỏ khỏi gameState.variables.specialStatus (tránh việc bị đồng bộ ngược lại khi tải game)
            if (typeof gameState !== 'undefined' && gameState.variables && gameState.variables.specialStatus && gameState.variables.specialStatus[statusId]) {
                delete gameState.variables.specialStatus[statusId];
                console.log('[Trạng thái đặc biệt] Đồng bộ xóa trong gameState:', statusId);
            }

            // 🔧 Cập nhật hiển thị thanh trạng thái
            if (typeof PlayerState !== 'undefined') {
                PlayerState.updateDisplay();
            }

            // 🔧 Kiểm tra xem còn trạng thái thôi miên nào không, nếu không còn thì khôi phục khung nhập liệu
            if (window.HypnosisOptionOverride && !window.HypnosisOptionOverride.shouldOverride()) {
                window.HypnosisOptionOverride.removeOverride();
                console.log('[Trạng thái đặc biệt] Trạng thái thôi miên đã được xóa, khôi phục khung nhập liệu');
            }

            console.log('[Trạng thái đặc biệt] Đã loại bỏ:', statusId);
            return true;
        }
        return false;
    },

    // Lấy tất cả các trạng thái đang kích hoạt
    getActive: function () {
        return Object.values(this.statuses);
    },

    // Kiểm tra xem có trạng thái cụ thể nào không
    has: function (statusId) {
        return !!this.statuses[statusId];
    },

    // Áp dụng hiệu ứng trạng thái lên thuộc tính người chơi
    applyEffects: function () {
        // Đặt lại các chỉ số hiệu chỉnh bị ảnh hưởng bởi trạng thái
        let energyMod = 0;
        let attackMod = 0;
        let defenseMod = 0;
        let maxHpMod = 0;
        let damageTakenMod = 0;

        Object.values(this.statuses).forEach(status => {
            // Xử lý hiệu ứng đơn lẻ
            switch (status.effect) {
                case 'energy': energyMod += status.value; break;
                case 'attack': attackMod += status.value; break;
                case 'defense': defenseMod += status.value; break;
                case 'maxHp': maxHpMod += status.value; break;
                case 'damageTaken': damageTakenMod += status.value; break;
            }

            // 🔧 Xử lý hiệu ứng phức hợp (loại 'multiple')
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.energy) energyMod += status.effects.energy;
                if (status.effects.attack) attackMod += status.effects.attack;
                if (status.effects.defense) defenseMod += status.effects.defense;
                if (status.effects.maxHp) maxHpMod += status.effects.maxHp;
                if (status.effects.damageTaken) damageTakenMod += status.effects.damageTaken;
            }
        });

        // Cập nhật thuộc tính người chơi (nếu PlayerState đã tải)
        if (typeof PlayerState !== 'undefined' && PlayerState.profession) {
            PlayerState.statusEffects = {
                energyMod, attackMod, defenseMod, maxHpMod, damageTakenMod
            };
            console.log('[Trạng thái đặc biệt] Áp dụng hiệu ứng:', PlayerState.statusEffects);
        }
    },

    // Áp dụng hiệu ứng khi bắt đầu trận chiến
    onBattleStart: function () {
        let corruptionGain = 0;
        let energyLoss = 0;

        Object.values(this.statuses).forEach(status => {
            // Hiệu ứng đơn lẻ
            if (status.effect === 'corruptionPerBattle') {
                corruptionGain += status.value;
            }
            if (status.effect === 'energy') {
                energyLoss += Math.abs(status.value);
            }

            // 🔧 Hiệu ứng phức hợp
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.corruptionPerBattle) {
                    corruptionGain += status.effects.corruptionPerBattle;
                }
                if (status.effects.energy) {
                    energyLoss += Math.abs(status.effects.energy);
                }
            }
        });

        if (corruptionGain > 0) {
            PlayerState.corruption += corruptionGain;
            PlayerState.save();
            console.log('[Trạng thái đặc biệt] Bắt đầu trận chiến, đọa lạc +' + corruptionGain);
        }

        return { energyLoss };
    },

    // Áp dụng hiệu ứng khi nghỉ ngơi
    onRest: function () {
        let corruptionGain = 0;

        Object.values(this.statuses).forEach(status => {
            // Hiệu ứng đơn lẻ
            if (status.effect === 'corruptionPerRest') {
                corruptionGain += status.value;
            }

            // 🔧 Hiệu ứng phức hợp
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.corruptionPerRest) {
                    corruptionGain += status.effects.corruptionPerRest;
                }
            }
        });

        if (corruptionGain > 0) {
            PlayerState.corruption += corruptionGain;
            PlayerState.save();
            console.log('[Trạng thái đặc biệt] Khi nghỉ ngơi, đọa lạc +' + corruptionGain);
        }
    },

    // Cập nhật hiển thị trên thanh trạng thái
    updateDisplay: function () {
        const container = document.getElementById('specialStatusList');
        if (!container) return;

        const statuses = this.getActive();
        if (statuses.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">Tạm thời không có trạng thái bất thường</div>';
            return;
        }

        let html = '';
        statuses.forEach(status => {
            // 🔧 Tương thích cả hai định dạng: trạng thái thường dùng 'desc', cải tạo cơ thể dùng 'description'
            const displayName = status.name || status.id;
            const displayDesc = status.desc || status.description || '';
            const displayFullDesc = status.fullDesc || status.description || '';

            html += `
                <div class="special-status-item" style="background: rgba(255,100,100,0.1); 
                     border: 1px solid rgba(255,100,100,0.3); border-radius: 6px; 
                     padding: 8px; margin-bottom: 6px; cursor: pointer;"
                     onclick="SpecialStatusManager.showDetail('${status.id}')"
                     title="${displayFullDesc}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #ff6b81;">${status.icon} ${displayName}</span>
                        <span style="color: #888; font-size: 10px;">${displayDesc}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Hiển thị chi tiết trạng thái
    showDetail: function (statusId) {
        const status = this.statuses[statusId];
        if (!status) return;

        const displayName = status.name || status.id;
        const displayDesc = status.desc || status.description || '';
        const displayFullDesc = status.fullDesc || status.description || '';
        const isPermanent = status.permanent ? '\n\n（Cải tạo vĩnh viễn, không thể xóa bỏ）' : '\n\n（Có thể chọn xóa trạng thái này khi nghỉ ngơi tại suối nước nóng）';

        alert(`${status.icon} ${displayName}\n\nHiệu quả: ${displayDesc}\n\n${displayFullDesc}${isPermanent}`);
    },

    // Lưu dữ liệu
    save: function () {
        localStorage.setItem('acjt_special_status', JSON.stringify(this.statuses));
    },

    // Tải dữ liệu
    load: function () {
        const saved = localStorage.getItem('acjt_special_status');
        if (saved) {
            try {
                this.statuses = JSON.parse(saved);
            } catch (e) {
                this.statuses = {};
            }
        }

        // 🔧 Đồng bộ dữ liệu từ gameState.variables.specialStatus
        if (typeof gameState !== 'undefined' && gameState.variables && gameState.variables.specialStatus) {
            const gameStateStatuses = gameState.variables.specialStatus;
            Object.keys(gameStateStatuses).forEach(key => {
                if (gameStateStatuses[key].active && !this.statuses[key]) {
                    // Nếu gameState có mà SpecialStatusManager chưa có, hãy bổ sung vào
                    const config = SpecialStatusConfig[key];
                    if (config) {
                        this.statuses[key] = {
                            id: key,
                            icon: config.icon,
                            effect: config.effect,
                            value: config.value,
                            desc: config.desc,
                            fullDesc: config.fullDesc,
                            addedAt: Date.now()
                        };
                    }
                }
            });
            this.save(); // Lưu dữ liệu sau khi đồng bộ
        }

        this.updateDisplay();
        this.applyEffects();
    },

    // 🔧 Cưỡng ép xóa sạch tất cả trạng thái đặc biệt (Dùng để gỡ lỗi)
    clearAll: function () {
        this.statuses = {};
        this.save();

        // Đồng thời xóa dữ liệu trong gameState
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.specialStatus = {};
        }

        this.updateDisplay();
        this.applyEffects();
        console.log('[Trạng thái đặc biệt] Đã xóa sạch tất cả trạng thái đặc biệt');
    }
};

// ==================== Cấu hình ghi đè tùy chọn trạng thái thôi miên ====================
// Khi người chơi có trạng thái đặc biệt thuộc loại thôi miên, ghi đè tất cả tùy chọn thành nội dung cố định
const HypnosisOptionOverride = {
    // Danh sách ID trạng thái thôi miên
    hypnosisStatusIds: [
        'Nhận thức khỏa thân', 'Nghĩa vụ giao phối', 'Khao khát tinh dịch', 'Trung thành với khoái cảm',
        'Bản năng phô bày', 'Tự giác làm bồn chứa tinh', 'Phục tùng tuyệt đối', 'Bản năng nô lệ tình dục',
        'Loại bỏ xấu hổ', 'Kích hoạt phát tình', 'Thức tỉnh mẫu tính', 'Nghiện khẩu giao'
    ],

    // Văn bản tùy chọn cố định tương ứng với mỗi loại trạng thái thôi miên
    statusOptions: {
        'Nhận thức khỏa thân': '【Lời nguyền Nhận thức khỏa thân】 Thoát y và đi dạo quanh đây',
        'Nghĩa vụ giao phối': '【Lời nguyền Nghĩa vụ giao phối】 Tìm người giao phối để hoàn thành nghĩa vụ hôm nay',
        'Khao khát tinh dịch': '【Lời nguyền Khao khát tinh dịch】 Tìm kiếm đối tượng để có được tinh dịch',
        'Trung thành với khoái cảm': '【Lời nguyền Trung thành với khoái cảm】 Chủ động hiến thân cho kẻ có thể ban phát khoái cảm',
        'Bản năng phô bày': '【Lời nguyền Bản năng phô bày】 Tìm nơi đông người để phô bày thân thể',
        'Tự giác làm bồn chứa tinh': '【Lời nguyền Tự giác làm bồn chứa tinh】 Tìm một nơi và chờ đợi được sử dụng',
        'Phục tùng tuyệt đối': '【Lời nguyền Phục tùng tuyệt đối】 Tìm kiếm một người chủ để phục tùng',
        'Bản năng nô lệ tình dục': '【Lời nguyền Bản năng nô lệ tình dục】 Tìm kiếm đối tượng để hầu hạ',
        'Loại bỏ xấu hổ': '【Lời nguyền Loại bỏ xấu hổ】 Làm những việc mà bình thường sẽ thấy hổ thẹn',
        'Kích hoạt phát tình': '【Lời nguyền Kích hoạt phát tình】 Tìm kiếm đối tượng có thể thỏa mãn nhu cầu phát tình',
        'Thức tỉnh mẫu tính': '【Lời nguyền Thức tỉnh mẫu tính】 Tìm kiếm đối tượng có thể khiến bản thân thụ thai',
        'Nghiện khẩu giao': '【Lời nguyền Nghiện khẩu giao】 Tìm kiếm nhục bổng để ngậm lấy'
    },

    // 检查是否有催眠状态并返回随机一个
    getActiveHypnosisStatus: function () {
        if (!SpecialStatusManager || !SpecialStatusManager.statuses) {
            return null;
        }

        const activeHypnosis = [];
        for (const statusId of this.hypnosisStatusIds) {
            if (SpecialStatusManager.statuses[statusId]) {
                activeHypnosis.push(statusId);
            }
        }

        if (activeHypnosis.length === 0) {
            return null;
        }

        // 随机返回一个
        return activeHypnosis[Math.floor(Math.random() * activeHypnosis.length)];
    },

    // 获取催眠状态的覆盖选项（四个相同的选项）
    getOverrideOptions: function (statusId) {
        const optionText = this.statusOptions[statusId];
        if (!optionText) return null;

        return [optionText, optionText, optionText, optionText];
    },

    // 检查是否应该隐藏用户输入框并覆盖选项
    shouldOverride: function () {
        return this.getActiveHypnosisStatus() !== null;
    },

    // 应用覆盖效果（隐藏userInput，修改选项）
    applyOverride: function () {
        const activeStatus = this.getActiveHypnosisStatus();
        if (!activeStatus) {
            this.removeOverride();
            return null;
        }

        // 隐藏userInput输入框
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.style.display = 'none';
        }
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.style.display = 'none';
        }

        console.log('[催眠覆盖] 激活催眠状态:', activeStatus, '- 已隐藏输入框');
        return this.getOverrideOptions(activeStatus);
    },

    // 移除覆盖效果
    removeOverride: function () {
        const userInputContainer = document.querySelector('.mobile-input-container');
        if (userInputContainer) {
            userInputContainer.style.display = ''; // 🔧 恢复为CSS默认值（通常是flex）
        }
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.style.display = ''; // 🔧 恢复默认
        }
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.style.display = ''; // 🔧 恢复默认
        }
        console.log('[催眠覆盖] 已移除覆盖，恢复输入框显示');
    },

    // 修改选项按钮内容（在选项渲染后调用）
    modifyOptionButtons: function () {
        const activeStatus = this.getActiveHypnosisStatus();
        if (!activeStatus) return false;

        const optionText = this.statusOptions[activeStatus];
        if (!optionText) return false;

        // 查找所有选项按钮
        const optionBtns = document.querySelectorAll('.option-btn');
        if (optionBtns.length === 0) return false;

        // 选项图标
        const icons = ['💬', '🚪', '⚡', '💕'];
        const statusIcon = SpecialStatusConfig[activeStatus]?.icon || '🌀';

        optionBtns.forEach((btn, index) => {
            const icon = icons[index] || '📌';
            btn.innerHTML = `${icon} ${statusIcon} ${optionText}`;
            btn.setAttribute('data-option', optionText);
            btn.setAttribute('data-hypnosis-override', 'true');

            // 🔧 替换onclick事件，确保发送催眠选项文本
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // 使用全局 selectOption 或 sendUserInput
                if (typeof window.selectOption === 'function') {
                    await window.selectOption(optionText);
                } else {
                    // 备用方案：直接发送到输入框并提交
                    const inputBox = document.getElementById('userInput');
                    if (inputBox) {
                        inputBox.value = optionText;
                        if (typeof sendUserInput === 'function') {
                            sendUserInput();
                        }
                    }
                }
            };
        });

        console.log('[催眠覆盖] 已覆盖', optionBtns.length, '个选项按钮为:', optionText);
        return true;
    }
};

// 全局暴露
window.HypnosisOptionOverride = HypnosisOptionOverride;

// ==================== Từ khóa nhắc lệnh sự kiện ngẫu nhiên ====================
const RandomEventPrompts = {
    erotic: [
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Trong lúc thám hiểm, tôi phát hiện một hang động bí mật, bên trong truyền ra những âm thanh khiến người ta đỏ mặt...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Một nữ tử bí ẩn ăn mặc hở hang chặn đường tôi, ánh mắt cô ấy tràn đầy sự quyến rũ...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Tôi vô tình lạc vào lãnh địa của Mị ma, trong không khí tràn ngập mùi hương mê hoặc...'
    ],
    adventure: [
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Tôi tìm thấy một rương báu bị bỏ quên, bên trong dường như có thứ gì đó đang phát sáng...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Một lữ khách bị thương cầu cứu tôi, anh ta nói gần đây có một địa điểm giấu kho báu...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Tôi gặp một thương nhân bí ẩn, ông ta sẵn lòng giao dịch bằng một phương thức đặc biệt...'
    ],
    misfortune: [
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Tôi vô ý kích hoạt một cái bẫy, mặt đất bắt đầu sụp đổ...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Một nhóm cướp từ trong bóng tối xông ra, bao vây lấy tôi...',
        'Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: Nước suối tôi vừa uống dường như có vấn đề, cảm thấy cơ thể bắt đầu bủn rủn...'
    ]
};

// Tên hiển thị của các loại thẻ bài
const CardTypeNames = {
    [CardType.ATTACK]: 'Tấn công',
    [CardType.H_ATTACK]: 'Tấn công H',
    [CardType.HEAL]: 'Trị liệu',
    [CardType.BUFF]: 'Tăng ích',
    [CardType.DEBUFF]: 'Giảm ích',
    [CardType.ARMOR]: 'Giáp',
    [CardType.CURSE]: 'Nguyền rủa'
};

// 卡牌类型颜色
const CardTypeColors = {
    [CardType.ATTACK]: '#ff4757',       // 红色
    [CardType.H_ATTACK]: '#ff6b9d',     // 粉红色
    [CardType.HEAL]: '#2ed573',         // 绿色
    [CardType.BUFF]: '#ffa502',         // 橙色
    [CardType.DEBUFF]: '#9c88ff',       // 紫色
    [CardType.ARMOR]: '#70a1ff',        // 蓝色
    [CardType.CURSE]: '#8b0000'         // 暗红色
};

// ==================== Thư viện thẻ bài Nguyền rủa (Kỹ năng H của kẻ địch) ====================
const CurseCardLibrary = [
    { id: 'curse_跳蛋', name: 'Trứng rung', type: CardType.CURSE, damage: 3, statusId: 'Trứng rung', icon: '🔔', description: 'Năng lượng -1. Bị cấy trứng rung, không thể tập trung tinh thần.' },
    { id: 'curse_束缚锁链', name: 'Xiềng xích trói buộc', type: CardType.CURSE, damage: 4, statusId: 'Xiềng xích trói buộc', icon: '⛓️', description: 'Năng lượng -1. Xiềng xích trên cổ tay hạn chế hành động.' },
    { id: 'curse_精神污染', name: 'Ô nhiễm tinh thần', type: CardType.CURSE, damage: 6, statusId: 'Ô nhiễm tinh thần', icon: '🌀', description: 'Năng lượng -2. Tiếng thì thầm của vực thẳm ăn mòn ý thức.' },
    { id: 'curse_淫纹', name: 'Dâm văn', type: CardType.CURSE, damage: 5, statusId: 'Dâm văn', icon: '🔮', description: 'Tăng 5 đọa lạc mỗi khi nghỉ ngơi. Trên người bị khắc ma văn dâm mị.' },
    { id: 'curse_羞耻衣', name: 'Y phục nhục nhã', type: CardType.CURSE, damage: 3, statusId: 'Y phục nhục nhã', icon: '👙', description: 'Tăng 3 đọa lạc mỗi trận chiến. Bị ép mặc trang phục hở hang.' },
    { id: 'curse_魅魔契约', name: 'Khế ước Mị Ma', type: CardType.CURSE, damage: 7, statusId: 'Khế ước Mị Ma', icon: '💋', description: 'Tăng 8 đọa lạc khi nghỉ ngơi. Đã ký khế ước với Mị Ma.' },
    { id: 'curse_淫欲诅咒', name: 'Lời nguyền dâm dục', type: CardType.CURSE, damage: 5, statusId: 'Lời nguyền dâm dục', icon: '💜', description: 'Tăng 5 đọa lạc khi bắt đầu trận đấu. Cơ thể hưng phấn bất thường.' },
    { id: 'curse_堕落种子', name: 'Hạt giống đọa lạc', type: CardType.CURSE, damage: 8, statusId: 'Hạt giống đọa lạc', icon: '🌱', description: 'Tăng 10 đọa lạc khi nghỉ ngơi. Hạt giống đang ăn mòn tâm trí.' },
    { id: 'curse_乳环', name: 'Khuyên ngực', type: CardType.CURSE, damage: 4, statusId: 'Khuyên ngực', icon: '⭕', description: 'Phòng thủ -2. Đầu ngực bị xuyên vòng bạc.' },
    { id: 'curse_肚脐钉', name: 'Khuyên rốn', type: CardType.CURSE, damage: 3, statusId: 'Khuyên rốn', icon: '📍', description: 'Phòng thủ -1. Trang sức xuyên qua lỗ rốn.' },
    { id: 'curse_脚铐', name: 'Xiềng chân', type: CardType.CURSE, damage: 5, statusId: 'Xiềng chân', icon: '🔗', description: 'Phòng thủ -3. Xiềng xích sắt ở cổ chân hạn chế di chuyển.' },
    { id: 'curse_项圈', name: 'Vòng cổ', type: CardType.CURSE, damage: 6, statusId: 'Vòng cổ', icon: '⚫', description: 'HP tối đa -10. Bị đeo vòng cổ nô lệ.' },
    { id: 'curse_虚弱诅咒', name: 'Lời nguyền suy nhược', type: CardType.CURSE, damage: 7, statusId: 'Lời nguyền suy nhược', icon: '💀', description: 'HP tối đa -15. Sinh lực bị rút cạn.' },
    { id: 'curse_生命吸取', name: 'Hút sinh mệnh', type: CardType.CURSE, damage: 9, statusId: 'Hút sinh mệnh', icon: '🩸', description: 'HP tối đa -20. Sinh lực liên tục bị thất thoát.' },
    { id: 'curse_贞操带', name: 'Đai trinh tiết', type: CardType.CURSE, damage: 4, statusId: 'Đai trinh tiết', icon: '🔒', description: 'HP không thể vượt quá 50%. Bị khóa bởi đai trinh tiết.' },
    { id: 'curse_诅咒伤口', name: 'Vết thương nguyền rủa', type: CardType.CURSE, damage: 6, statusId: 'Vết thương nguyền rủa', icon: '🩹', description: 'HP không thể vượt quá 30%. Vết thương không thể chữa lành.' },
    { id: 'curse_催情药', name: 'Thuốc kích dục', type: CardType.CURSE, damage: 4, statusId: 'Thuốc kích dục', icon: '💊', description: 'Tấn công -3. Cơ thể bủn rủn vô lực.' },
    { id: 'curse_媚药中毒', name: 'Trúng độc mị dược', type: CardType.CURSE, damage: 6, statusId: 'Trúng độc mị dược', icon: '🧪', description: 'Tấn công -5. Cơ thể không thể phát lực.' },
    { id: 'curse_肌肉萎缩', name: 'Teo cơ', type: CardType.CURSE, damage: 5, statusId: 'Teo cơ', icon: '💪', description: 'Tấn công -4. Sức mạnh giảm mạnh.' },
    { id: 'curse_烙印', name: 'Nung dấu', type: CardType.CURSE, damage: 8, statusId: 'Nung dấu', icon: '🔥', description: 'Sát thương nhận vào +50%. Bị nung dấu ấn ký của chủ nhân.' },
    { id: 'curse_脆弱印记', name: 'Ấn ký mong manh', type: CardType.CURSE, damage: 5, statusId: 'Ấn ký mong manh', icon: '❌', description: 'Sát thương nhận vào +30%. Bị khắc lên ấn ký mong manh.' },
    { id: 'curse_诅咒标记', name: 'Dấu ấn nguyền rủa', type: CardType.CURSE, damage: 10, statusId: 'Dấu ấn nguyền rủa', icon: '☠️', description: 'Sát thương nhận vào +100%. Dấu ấn nguyền rủa vực thẳm.' },
    { id: 'curse_完全支配', name: 'Chi phối hoàn toàn', type: CardType.CURSE, damage: 9, statusId: 'Chi phối hoàn toàn', icon: '👑', description: 'Công -2, Thủ -2, Đọa lạc +5/trận chiến. Thân tâm không còn thuộc về mình.' },
    { id: 'curse_奴隶烙印', name: 'Dấu ấn nô lệ', type: CardType.CURSE, damage: 7, statusId: 'Dấu ấn nô lệ', icon: '🔥', description: 'HP -10, Sát thương nhận vào +25%. Thân phận nô lệ.' },
    
    // Nhóm biến đổi cơ thể bổ sung
    { id: 'curse_小便失禁', name: 'Tiểu tiện không tự chủ', type: CardType.CURSE, damage: 4, statusId: 'Tiểu tiện không tự chủ', icon: '💦', description: 'Phòng thủ -2, Đọa lạc chiến đấu +3. Không thể kiểm soát việc đi tiểu.' },
    { id: 'curse_大便失禁', name: 'Đại tiện không tự chủ', type: CardType.CURSE, damage: 5, statusId: 'Đại tiện không tự chủ', icon: '💩', description: 'Phòng thủ -3, Đọa lạc chiến đấu +5. Cơ thắt không thể co bóp.' },
    { id: 'curse_巨乳化', name: 'Ngực khổng lồ hóa', type: CardType.CURSE, damage: 6, statusId: 'Ngực khổng lồ hóa', icon: '🍈', description: 'Năng lượng -1, Phòng thủ -2. Ngực I-cup khổng lồ, hạn chế hành động.' },
    { id: 'curse_子宫纹身', name: 'Xăm hình tử cung', type: CardType.CURSE, damage: 5, statusId: 'Xăm hình tử cung', icon: '❤️', description: 'Đọa lạc nghỉ ngơi +8. Hình xăm nô lệ tình dục.' },
    { id: 'curse_敏感体质', name: 'Thể chất nhạy cảm', type: CardType.CURSE, damage: 6, statusId: 'Thể chất nhạy cảm', icon: '💗', description: 'Sát thương nhận vào +40%. Toàn thân cực kỳ nhạy cảm.' },
    { id: 'curse_发情期', name: 'Thời kỳ phát tình', type: CardType.CURSE, damage: 5, statusId: 'Thời kỳ phát tình', icon: '🔥', description: 'Tấn công -2, Đọa lạc chiến đấu +4. Phát tình vĩnh viễn.' },
    { id: 'curse_乳头肥大', name: 'Đầu ngực phì đại', type: CardType.CURSE, damage: 4, statusId: 'Đầu ngực phì đại', icon: '⭕', description: 'Phòng thủ -2. Đầu ngực to như quả nho.' },
    { id: 'curse_阴蒂肥大', name: 'Âm vật phì đại', type: CardType.CURSE, damage: 5, statusId: 'Âm vật phì đại', icon: '💎', description: 'Đọa lạc chiến đấu +5. Âm vật to như ngón tay cái.' },
    { id: 'curse_精神支配', name: 'Chi phối tinh thần', type: CardType.CURSE, damage: 8, statusId: 'Chi phối tinh thần', icon: '🧠', description: 'Năng lượng -2. Không thể tự suy nghĩ độc lập.' },
    { id: 'curse_性奴调教', name: 'Huấn luyện nô lệ tình dục', type: CardType.CURSE, damage: 7, statusId: 'Huấn luyện nô lệ tình dục', icon: '👑', description: 'Tấn công -3, Phòng thủ -3. Mất đi ý chí phản kháng.' },
    { id: 'curse_子宫下垂', name: 'Sa tử cung', type: CardType.CURSE, damage: 8, statusId: 'Sa tử cung', icon: '⬇️', description: 'HP -20. Sử dụng quá mức khiến cơ thể suy nhược.' },
    { id: 'curse_乳汁分泌', name: 'Tiết sữa', type: CardType.CURSE, damage: 4, statusId: 'Tiết sữa', icon: '🍼', description: 'Đọa lạc nghỉ ngơi +6. Ngực liên tục tiết sữa.' },
    { id: 'curse_永久发情', name: 'Phát tình vĩnh viễn', type: CardType.CURSE, damage: 9, statusId: 'Phát tình vĩnh viễn', icon: '💯', description: 'Tấn công -3, Đọa lạc +8/nghỉ ngơi. Khao khát không lúc nào nguôi.' },
    
    // Nhóm thú hóa
    { id: 'curse_触手寄生', name: 'Ký sinh xúc tu', type: CardType.CURSE, damage: 7, statusId: 'Ký sinh xúc tu', icon: '🐙', description: 'Năng lượng -2, Đọa lạc chiến đấu +6. Có sinh vật xúc tu trong người.' },
    { id: 'curse_史莱姆化', name: 'Slime hóa', type: CardType.CURSE, damage: 7, statusId: 'Slime hóa', icon: '🧫', description: 'Phòng thủ -4, Sát thương nhận vào +30%. Cơ thể trở nên mềm nhũn.' },
    
    // Nhóm biến đổi đặc biệt
    { id: 'curse_扶她化', name: 'Futanari hóa', type: CardType.CURSE, damage: 6, statusId: 'Futanari hóa', icon: '🍆', description: 'Tấn công +3, Đọa lạc chiến đấu +6. Mọc thêm nhục bổng ở bụng dưới.' },
    { id: 'curse_小穴脱出', name: 'Sa âm đạo', type: CardType.CURSE, damage: 7, statusId: 'Sa âm đạo', icon: '🌸', description: 'Phòng thủ -3, Đọa lạc nghỉ ngơi +8. Thành âm đạo bị lộn ra ngoài.' },
    { id: 'curse_肛门脱出', name: 'Sa trực tràng', type: CardType.CURSE, damage: 8, statusId: 'Sa trực tràng', icon: '🔴', description: 'Phòng thủ -4, Đọa lạc nghỉ ngơi +10. Hậu môn bị sa ra ngoài.' },
    { id: 'curse_子宫脱出', name: 'Sa tử cung hoàn toàn', type: CardType.CURSE, damage: 10, statusId: 'Sa tử cung hoàn toàn', icon: '❤️', description: 'HP -25, Đọa lạc nghỉ ngơi +12. Tử cung hoàn toàn sa ra ngoài.' },
    
    // Nhóm thôi miên / Cải tạo nhận thức
    { id: 'curse_裸体常识', name: 'Nhận thức khỏa thân', type: CardType.CURSE, damage: 5, statusId: 'Nhận thức khỏa thân', icon: '👗', description: 'Phòng thủ -3, Đọa lạc chiến đấu +4. Bị thôi miên cho rằng khỏa thân mới là bình thường.' },
    { id: 'curse_交配义务', name: 'Nghĩa vụ giao phối', type: CardType.CURSE, damage: 7, statusId: 'Nghĩa vụ giao phối', icon: '💕', description: 'Đọa lạc nghỉ ngơi +10, Năng lượng -1. Bị thôi miên bắt buộc phải giao phối mỗi ngày.' },
    { id: 'curse_精液渴望', name: 'Khao khát tinh dịch', type: CardType.CURSE, damage: 6, statusId: 'Khao khát tinh dịch', icon: '💦', description: 'HP -10, Đọa lạc chiến đấu +5. Bị thôi miên khao khát tinh dịch.' },
    { id: 'curse_快感忠诚', name: 'Trung thành với khoái cảm', type: CardType.CURSE, damage: 6, statusId: 'Trung thành với khoái cảm', icon: '🎀', description: 'Tấn công -3, Đọa lạc nghỉ ngơi +6. Trung thành với kẻ ban phát khoái cảm.' },
    { id: 'curse_露出本能', name: 'Bản năng phô bày', type: CardType.CURSE, damage: 5, statusId: 'Bản năng phô bày', icon: '👀', description: 'Đọa lạc chiến đấu +6. Bị thôi miên yêu thích việc phô bày cơ thể.' },
    { id: 'curse_肉便器自觉', name: 'Tự giác làm bồn chứa tinh', type: CardType.CURSE, damage: 8, statusId: 'Tự giác làm bồn chứa tinh', icon: '🚽', description: 'Tấn công -4, Phòng thủ -4. Bị thôi miên tự coi mình là bồn chứa tinh.' },
    { id: 'curse_绝对服从', name: 'Phục tùng tuyệt đối', type: CardType.CURSE, damage: 7, statusId: 'Phục tùng tuyệt đối', icon: '🐕', description: 'Năng lượng -2, Phòng thủ -2. Bị thôi miên phục tùng mệnh lệnh tuyệt đối.' },
    { id: 'curse_性奴本能', name: 'Bản năng nô lệ tình dục', type: CardType.CURSE, damage: 6, statusId: 'Bản năng nô lệ tình dục', icon: '📿', description: 'Đọa lạc nghỉ ngơi +8, Tấn công -2. Bị thôi miên trở thành nô lệ tình dục.' },
    { id: 'curse_羞耻消除', name: 'Loại bỏ xấu hổ', type: CardType.CURSE, damage: 6, statusId: 'Loại bỏ xấu hổ', icon: '😳', description: 'Đọa lạc nghỉ ngơi +10. Sự xấu hổ đã bị thôi miên loại bỏ.' },
    { id: 'curse_发情触发', name: 'Kích hoạt phát tình', type: CardType.CURSE, damage: 6, statusId: 'Kích hoạt phát tình', icon: '🔔', description: 'Đọa lạc chiến đấu +6, Phòng thủ -2. Nghe thấy tiếng chuông là phát tình.' },
    { id: 'curse_母性觉醒', name: 'Thức tỉnh mẫu tính', type: CardType.CURSE, damage: 7, statusId: 'Thức tỉnh mẫu tính', icon: '🤰', description: 'Đọa lạc nghỉ ngơi +8, HP -15. Khao khát được thụ thai.' },
    { id: 'curse_口交中毒', name: 'Nghiện khẩu giao', type: CardType.CURSE, damage: 5, statusId: 'Nghiện khẩu giao', icon: '👄', description: 'Năng lượng -1, Đọa lạc chiến đấu +4. Bị thôi miên nghiện khẩu giao.' }
];

// 预设卡牌库 (75张)
const CardLibrary = [
    // ========== Thẻ Tấn công (15 lá) ==========
    { id: 'attack_001', name: 'Tấn Công Thường', type: CardType.ATTACK, value: 5, cost: 1, description: 'Gây 5 điểm sát thương lên kẻ địch.' },
    { id: 'attack_002', name: 'Trọng Kích', type: CardType.ATTACK, value: 10, cost: 2, description: 'Tụ lực nhất kích, gây 10 điểm sát thương lên kẻ địch.' },
    { id: 'attack_003', name: 'Chí Mạng Nhất Kích', type: CardType.ATTACK, value: 18, cost: 3, description: 'Đòn đánh chính xác vào yếu huyệt, gây 18 điểm sát thương.' },
    { id: 'attack_004', name: 'Liên Kích', type: CardType.ATTACK, value: 3, hitCount: 3, cost: 2, description: 'Tấn công liên tiếp 3 lần, mỗi lần gây 3 điểm sát thương.' },
    { id: 'attack_005', name: 'Xuyên Thấu', type: CardType.ATTACK, value: 8, ignoreArmor: true, cost: 2, description: 'Xuyên giáp, trực tiếp gây 8 điểm sát thương.' },
    { id: 'attack_006', name: 'Toàn Phong Trảm', type: CardType.ATTACK, value: 7, cost: 1, description: 'Tấn công xoay vòng, gây 7 điểm sát thương.' },
    { id: 'attack_007', name: 'Lôi Đình Nhất Kích', type: CardType.ATTACK, value: 14, cost: 2, description: 'Sấm sét hộ thân, gây 14 điểm sát thương.' },
    { id: 'attack_008', name: 'Bạo Phong Liên Trảm', type: CardType.ATTACK, value: 4, hitCount: 4, cost: 3, description: 'Tấn công liên tục như cuồng phong, đánh 4 lần mỗi lần 4 điểm.' },
    { id: 'attack_009', name: 'Phá Giáp Trảm', type: CardType.ATTACK, value: 6, ignoreArmor: true, cost: 1, description: 'Xuyên giáp gây 6 điểm sát thương.' },
    { id: 'attack_010', name: 'Trảm Thiết', type: CardType.ATTACK, value: 25, cost: 4, description: 'Đòn đánh dốc toàn lực, gây 25 điểm sát thương.' },
    { id: 'attack_011', name: 'Đột Kích Nhanh', type: CardType.ATTACK, value: 4, cost: 0, description: 'Một cú đâm chớp nhoáng, gây 4 điểm sát thương.' },
    { id: 'attack_012', name: 'Đòn Đánh Kép', type: CardType.ATTACK, value: 5, hitCount: 2, cost: 1, description: 'Hai đòn tấn công liên tiếp, mỗi lần 5 điểm sát thương.' },
    { id: 'attack_013', name: 'Xử Hình', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 3, description: 'Nhát chém hành quyết, xuyên giáp gây 12 điểm sát thương.' },
    { id: 'attack_014', name: 'Cuồng Bạo Nhất Kích', type: CardType.ATTACK, value: 20, cost: 3, description: 'Tấn công điên cuồng, gây 20 điểm sát thương.' },
    { id: 'attack_015', name: 'Đòn Đánh Chính Xác', type: CardType.ATTACK, value: 9, cost: 1, description: 'Tấn công chuẩn xác, gây 9 điểm sát thương.' },

    // ========== Thẻ Tấn công H (54 lá) - Kèm điều kiện mở khóa theo giá trị đọa lạc ==========
    // corruptionRequired: Yêu cầu giá trị đọa lạc để mở khóa
    // --- Hệ Dẫn Dụ Cơ Bản (Đọa lạc 0-15) ---
    { id: 'h_attack_001', name: 'Nháy Mắt', type: CardType.H_ATTACK, value: 5, cost: 0, debuffType: 'attack', debuffValue: 1, debuffDuration: 1, description: 'Nháy mắt đưa tình, gây 5 sát thương, công địch -1 (1 lượt).', corruptionRequired: 0 },
    { id: 'h_attack_002', name: 'Tư Thế Gợi Cảm', type: CardType.H_ATTACK, value: 4, cost: 0, debuffType: 'defense', debuffValue: 2, debuffDuration: 1, description: 'Tạo dáng khiêu gợi, gây 4 sát thương, thủ địch -2 (1 lượt).', corruptionRequired: 3 },
    { id: 'h_attack_003', name: 'Thở Dốc', type: CardType.H_ATTACK, value: 6, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 1, description: 'Phát ra tiếng thở dốc mời gọi, gây 6 sát thương, công địch -2 (1 lượt).', corruptionRequired: 5 },
    { id: 'h_attack_004', name: 'Đưa Tình', type: CardType.H_ATTACK, value: 7, cost: 1, description: 'Liên tục nháy mắt đưa tình, gây 7 điểm sát thương.', corruptionRequired: 8 },
    { id: 'h_attack_005', name: 'Điệu Nhảy Quyến Rũ', type: CardType.H_ATTACK, value: 8, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: 'Điệu nhảy khêu gợi lắc hông, gây 8 sát thương, công địch -2 (2 lượt).', corruptionRequired: 10 },
    { id: 'h_attack_006', name: 'Ngọc Túc Chà Đạp', type: CardType.H_ATTACK, value: 9, cost: 1, description: 'Dùng bàn chân trắng nõn dẫm lên kẻ địch, gây 9 điểm sát thương.', corruptionRequired: 12 },
    { id: 'h_attack_007', name: 'Vuốt Ve Trêu Chọc', type: CardType.H_ATTACK, value: 6, cost: 1, description: 'Dùng những ngón tay thon dài vuốt ve nhẹ nhàng, gây 6 điểm sát thương.', corruptionRequired: 15 },
    { id: 'h_attack_seduce_armor', name: 'Kiến Long Giải Giáp', type: CardType.H_ATTACK, value: 8, cost: 2, debuffType: 'defenseZero', debuffDuration: 2, description: 'Khêu gợi cởi bỏ xiêm y từng lớp cho đến khi khỏa thân, khiến kẻ địch thần hồn điên đảo, gây 8 sát thương, phòng thủ địch về 0 (2 lượt).', corruptionRequired: 12 },

    // --- Hệ Hôn (Đọa lạc 15-25) ---
    { id: 'h_attack_008', name: 'Nụ Hôn Mê Hoặc', type: CardType.H_ATTACK, value: 8, cost: 1, dotDamage: 2, duration: 2, description: 'Áp đôi môi ướt át lên, gây 8 sát thương + duy trì 2/lượt.', corruptionRequired: 16 },
    { id: 'h_attack_009', name: 'Nụ Hôn Đọa Lạc', type: CardType.H_ATTACK, value: 9, cost: 1, dotDamage: 2, duration: 2, description: 'Nụ hôn sâu quấn quýt đầu lưỡi, gây 9 sát thương + duy trì 2/lượt.', corruptionRequired: 18 },
    { id: 'h_attack_010', name: 'Thiệt Hôn Quấn Quýt', type: CardType.H_ATTACK, value: 10, cost: 1, dotDamage: 3, duration: 2, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: 'Dùng lưỡi mềm mại quấn lấy sâu bên trong, gây 10 sát thương + duy trì 3/lượt, công địch -2 (2 lượt).', corruptionRequired: 20 },
    { id: 'h_attack_011', name: 'Nụ Hôn Mút Mát', type: CardType.H_ATTACK, value: 11, cost: 1, dotDamage: 3, duration: 2, debuffType: 'defense', debuffValue: 2, debuffDuration: 2, description: 'Mút mạnh môi đối phương, gây 11 sát thương + duy trì 3/lượt, thủ địch -2 (2 lượt).', corruptionRequired: 22 },
    { id: 'h_attack_012', name: 'Lời Thì Thầm Dâm Mị', type: CardType.H_ATTACK, value: 10, duration: 2, dotDamage: 2, cost: 2, description: 'Thì thầm những lời lăng loàn bên tai, gây 10 sát thương + duy trì 2/lượt.', corruptionRequired: 25 },

    // --- Hệ Ngực (Đọa lạc 20-45) ---
    { id: 'h_attack_013', name: 'Trêu Chọc Đầu Vú', type: CardType.H_ATTACK, value: 8, cost: 1, debuffType: 'defense', debuffValue: 2, debuffDuration: 2, description: 'Dùng đầu vú cương cứng ma sát nhẹ nhàng, gây 8 sát thương, thủ địch -2 (2 lượt).', corruptionRequired: 20 },
    { id: 'h_attack_014', name: 'Rung Vú Dẫn Dụ', type: CardType.H_ATTACK, value: 10, cost: 1, description: 'Rung lắc đôi gò bồng đảo căng tròn, gây 10 điểm sát thương.', corruptionRequired: 24 },
    { id: 'h_attack_015', name: 'Cự Nhũ Áp Chế', type: CardType.H_ATTACK, value: 12, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: 'Dùng bộ ngực đầy đặn đè ép kẻ địch, gây 12 sát thương, công địch -3 (2 lượt).', corruptionRequired: 28 },
    { id: 'h_attack_016', name: 'Nhũ Thủ Kẹp Kích', type: CardType.H_ATTACK, value: 6, hitCount: 2, cost: 2, description: 'Tấn công bằng đầu vú cương cứng, đánh 2 lần mỗi lần 6 điểm.', corruptionRequired: 32 },
    { id: 'h_attack_017', name: 'Công Thế Nhũ Giao', type: CardType.H_ATTACK, value: 14, cost: 2, dotDamage: 3, duration: 2, description: 'Kẹp và ma sát bằng đôi ngực đầy đặn, gây 14 sát thương + duy trì 3/lượt.', corruptionRequired: 38 },
    { id: 'h_attack_018', name: 'Phun Sữa', type: CardType.H_ATTACK, value: 8, hitCount: 2, cost: 2, description: 'Phun sữa tươi tấn công, đánh 2 lần mỗi lần 8 điểm.', corruptionRequired: 42 },
    { id: 'h_attack_019', name: 'Nhũ Nhục Giết Chóc', type: CardType.H_ATTACK, value: 16, cost: 2, description: 'Dùng lớp thịt ngực mềm mại bao bọc và siết chặt, gây 16 điểm sát thương.', corruptionRequired: 45 },

    // --- Hệ Miệng Lưỡi (Đọa lạc 25-50) ---
    { id: 'h_attack_020', name: 'Khẩu Thiệt Thị Phụng', type: CardType.H_ATTACK, value: 10, cost: 1, description: 'Dùng lưỡi linh hoạt liếm láp, gây 10 điểm sát thương.', corruptionRequired: 26 },
    { id: 'h_attack_021', name: 'Liếm Láp Tấn Công', type: CardType.H_ATTACK, value: 11, cost: 2, description: 'Dùng lưỡi liên tục liếm vào điểm nhạy cảm, gây 11 điểm sát thương.', corruptionRequired: 30 },
    { id: 'h_attack_022', name: 'Ngậm Mút Hấp Thụ', type: CardType.H_ATTACK, value: 12, cost: 2, description: 'Ngậm kẻ địch vào miệng mút mạnh, gây 12 điểm sát thương.', corruptionRequired: 34 },
    { id: 'h_attack_023', name: 'Thâm Hầu Xâm Nhập', type: CardType.H_ATTACK, value: 15, cost: 2, description: 'Để kẻ địch xâm nhập sâu vào cổ họng, gây 15 điểm sát thương.', corruptionRequired: 40 },
    { id: 'h_attack_024', name: 'Khẩu Nội Giết Chóc', type: CardType.H_ATTACK, value: 18, cost: 3, description: 'Dùng khoang miệng siết chặt, gây 18 điểm sát thương.', corruptionRequired: 48 },

    // --- Hệ Mông (Đọa lạc 30-55) ---
    { id: 'h_attack_025', name: 'Ma Sát Mông', type: CardType.H_ATTACK, value: 10, cost: 1, debuffType: 'defense', debuffValue: 2, debuffDuration: 1, description: 'Dùng vòng ba đầy đặn cọ vào kẻ địch, gây 10 sát thương, thủ địch -2 (1 lượt).', corruptionRequired: 28 },
    { id: 'h_attack_026', name: 'Mật Đào Dẫn Dụ', type: CardType.H_ATTACK, value: 11, cost: 2, description: 'Lắc lư cặp mông hình quả đào, gây 11 điểm sát thương.', corruptionRequired: 32 },
    { id: 'h_attack_027', name: 'Mông Kích', type: CardType.H_ATTACK, value: 13, cost: 2, description: 'Dùng mông đầy đặn va đập mạnh vào kẻ địch, gây 13 điểm sát thương.', corruptionRequired: 36 },
    { id: 'h_attack_028', name: 'Mông Giao Kẹp Kích', type: CardType.H_ATTACK, value: 14, cost: 2, description: 'Dùng thịt mông kẹp chặt ma sát, gây 14 điểm sát thương.', corruptionRequired: 42 },
    { id: 'h_attack_029', name: 'Cưỡi Mặt Nghẹt Thở', type: CardType.H_ATTACK, value: 16, cost: 2, debuffType: 'attack', debuffValue: 4, debuffDuration: 2, description: 'Cưỡi lên mặt kẻ địch khiến chúng ngạt thở, gây 16 sát thương, công địch -4 (2 lượt).', corruptionRequired: 50 },

    // --- Hệ Chân (Đọa lạc 15-40) ---
    { id: 'h_attack_030', name: 'Đùi Kẹp Kích', type: CardType.H_ATTACK, value: 10, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 1, description: 'Dùng đôi chân trắng ngần kẹp chặt, gây 10 sát thương, công địch -2 (1 lượt).', corruptionRequired: 18 },
    { id: 'h_attack_031', name: 'Túc Giao Sỉ Nhục', type: CardType.H_ATTACK, value: 12, cost: 2, description: 'Dùng đôi bàn chân kẹp lấy yếu điểm kẻ địch và xoa nắn, gây 12 điểm sát thương.', corruptionRequired: 28 },
    { id: 'h_attack_032', name: 'Thủ Giao Quấn Quýt', type: CardType.H_ATTACK, value: 14, cost: 2, description: 'Dùng hai chân quấn chặt ma sát, gây 14 điểm sát thương.', corruptionRequired: 35 },
    { id: 'h_attack_033', name: 'Ma Sát Tất Chân', type: CardType.H_ATTACK, value: 11, cost: 2, description: 'Ma sát bằng đôi chân dài bọc trong tất lụa, gây 11 điểm sát thương.', corruptionRequired: 30 },

    // --- Hệ Hạ Thân (Đọa lạc 40-70) ---
    { id: 'h_attack_034', name: 'Tấn Công Nhục Nhã', type: CardType.H_ATTACK, value: 12, cost: 2, description: 'Dùng bộ phận nhạy cảm cọ vào kẻ địch, gây 12 điểm sát thương.', corruptionRequired: 35 },
    { id: 'h_attack_035', name: 'Kích Thích Âm Vật', type: CardType.H_ATTACK, value: 10, duration: 2, dotDamage: 3, cost: 2, description: 'Kích thích âm vật nhạy cảm, gây 10 điểm + duy trì 3/lượt.', corruptionRequired: 40 },
    { id: 'h_attack_036', name: 'Mật Huyệt Co Thắt', type: CardType.H_ATTACK, value: 14, cost: 2, dotDamage: 3, duration: 2, description: 'Dùng tiểu huyệt co thắt có nhịp điệu, gây 14 sát thương + duy trì 3/lượt.', corruptionRequired: 45 },
    { id: 'h_attack_037', name: 'Dâm Thủy Phun Trào', type: CardType.H_ATTACK, value: 8, hitCount: 2, cost: 2, description: 'Phun lượng lớn dâm thủy tấn công, đánh 2 lần mỗi lần 8 điểm.', corruptionRequired: 48 },
    { id: 'h_attack_038', name: 'Thủy Triều Tấn Công', type: CardType.H_ATTACK, value: 10, hitCount: 3, cost: 3, description: 'Phun trào kịch liệt bắn vào kẻ địch, đánh 3 lần mỗi lần 10 điểm.', corruptionRequired: 55 },
    { id: 'h_attack_039', name: 'Mật Huyệt Giết Chóc', type: CardType.H_ATTACK, value: 18, cost: 3, dotDamage: 4, duration: 2, description: 'Dùng tiểu huyệt ướt át kẹp chặt, gây 18 sát thương + duy trì 4/lượt.', corruptionRequired: 60 },
    { id: 'h_attack_040', name: 'Cổ Tử Cung Hấp Phụ', type: CardType.H_ATTACK, value: 20, cost: 3, description: 'Dùng cổ tử cung mút chặt, gây 20 điểm sát thương.', corruptionRequired: 68 },

    // --- Hệ Hậu Môn (Đọa lạc 50-75) ---
    { id: 'h_attack_041', name: 'Cúc Huyệt Trêu Chọc', type: CardType.H_ATTACK, value: 12, cost: 2, description: 'Dùng cúc huyệt khít khao nhẹ nhàng trêu chọc, gây 12 điểm sát thương.', corruptionRequired: 48 },
    { id: 'h_attack_042', name: 'Cúc Huyệt Thôn Phệ', type: CardType.H_ATTACK, value: 15, cost: 2, description: 'Dùng cúc huyệt khít khao nuốt trọn, gây 15 điểm sát thương.', corruptionRequired: 55 },
    { id: 'h_attack_043', name: 'Hậu Đình Điều Giáo', type: CardType.H_ATTACK, value: 14, duration: 2, dotDamage: 4, cost: 3, description: 'Để kẻ địch xâm phạm hậu đình của tôi, gây 14 điểm + duy trì 4/lượt.', corruptionRequired: 60 },
    { id: 'h_attack_044', name: 'Cúc Huyệt Giết Chóc', type: CardType.H_ATTACK, value: 18, cost: 3, description: 'Dùng cúc huyệt siết chặt, gây 18 điểm sát thương.', corruptionRequired: 70 },

    // --- Kỹ Năng Cao Cấp (Đọa lạc 60-90) ---
    { id: 'h_attack_045', name: 'Nhục Bổng Cắm Vào', type: CardType.H_ATTACK, value: 20, cost: 3, description: 'Để nhục bổng của địch cắm vào cơ thể, kẹp nát nó, gây 20 điểm.', corruptionRequired: 65 },
    { id: 'h_attack_046', name: 'Thế Cưỡi Ngựa', type: CardType.H_ATTACK, value: 6, hitCount: 4, cost: 3, description: 'Cưỡi lên người kẻ địch và vặn vẹo kịch liệt, đánh 4 lần mỗi lần 6 điểm.', corruptionRequired: 62 },
    { id: 'h_attack_047', name: 'Lắc Mông Cuồng Vũ', type: CardType.H_ATTACK, value: 5, hitCount: 5, cost: 3, description: 'Lắc mông điên cuồng, đánh 5 lần mỗi lần 5 điểm.', corruptionRequired: 58 },
    { id: 'h_attack_048', name: 'Toàn Thân Quấn Quýt', type: CardType.H_ATTACK, value: 22, cost: 3, debuffType: 'attack', debuffValue: 5, debuffDuration: 2, description: 'Dùng toàn thân quấn chặt kẻ địch, gây 22 sát thương, công địch -5 (2 lượt).', corruptionRequired: 70 },
    { id: 'h_attack_049', name: 'Dẫn Dụ Chí Mạng', type: CardType.H_ATTACK, value: 20, cost: 3, description: 'Sự dẫn dụ tột cùng khi phô bày thân thể, gây 20 điểm sát thương.', corruptionRequired: 55 },
    { id: 'h_attack_050', name: 'Cái Chạm Cấm Kỵ', type: CardType.H_ATTACK, value: 16, duration: 2, dotDamage: 4, cost: 3, description: 'Ngón tay thăm dò nơi cấm kỵ, gây 16 điểm + duy trì 4/lượt.', corruptionRequired: 50 },

    // --- Kỹ Năng Cuối (Đọa lạc 75-100) ---
    { id: 'h_attack_051', name: 'Song Huyệt Tề Khai', type: CardType.H_ATTACK, value: 28, cost: 4, dotDamage: 5, duration: 2, debuffType: 'attack', debuffValue: 4, debuffDuration: 2, description: 'Đồng thời dùng tiểu huyệt và cúc huyệt thôn phệ, gây 28 sát thương + duy trì 5/lượt, công địch -4 (2 lượt).', corruptionRequired: 80 },
    { id: 'h_attack_052', name: 'Dẫn Dụ Tột Cùng', type: CardType.H_ATTACK, value: 25, cost: 4, description: 'Khỏa thân hoàn toàn khoe dáng vẻ hoàn hảo, gây 25 điểm sát thương.', corruptionRequired: 75 },
    { id: 'h_attack_053', name: 'Hiến Tế Thân Xác', type: CardType.H_ATTACK, value: 30, cost: 4, description: 'Dùng toàn bộ cơ thể để tấn công, gây 30 điểm sát thương.', corruptionRequired: 88 },
    { id: 'h_attack_054', name: 'Dâm Đọa Tột Đỉnh', type: CardType.H_ATTACK, value: 35, cost: 5, dotDamage: 6, duration: 3, debuffType: 'attack', debuffValue: 6, debuffDuration: 3, description: 'Đòn tấn công tối thượng của sự đọa lạc, gây 35 sát thương + duy trì 6/lượt, công địch -6 (3 lượt).', corruptionRequired: 100 },

// ========== Thẻ bài đặc quyền Tu nữ (30 lá) - Đặc tính: Mỗi lá bài đều kèm hồi máu hoặc buff phòng thủ ==========
    // --- Hệ Tấn công cơ bản (Kèm hồi máu/giáp) ---
    { id: 'nun_001', name: 'Thánh Quang Phán Quyết', type: CardType.ATTACK, value: 10, cost: 1, healSelf: 5, description: 'Ánh sáng thần thánh phán xét cái ác, gây 10 sát thương, hồi 5 HP.', professionRequired: 'nun' },
    { id: 'nun_002', name: 'Ngọn Lửa Thanh Tẩy', type: CardType.ATTACK, value: 8, ignoreArmor: true, cost: 2, armorGain: 6, description: 'Thánh hỏa thiêu rụi uế tạp, xuyên giáp gây 8 sát thương, nhận 6 giáp.', professionRequired: 'nun' },
    { id: 'nun_003', name: 'Thần Phạt', type: CardType.ATTACK, value: 16, cost: 2, healSelf: 8, description: 'Triệu hồi hình phạt thần thánh, gây 16 sát thương, hồi 8 HP.', professionRequired: 'nun' },
    { id: 'nun_004', name: 'Thánh Quang Tẩy Lễ', type: CardType.ATTACK, value: 12, cost: 2, healSelf: 10, description: 'Ánh sáng thần thánh thanh tẩy kẻ thù, gây 12 sát thương, hồi 10 HP.', professionRequired: 'nun' },
    { id: 'nun_005', name: 'Thiên Đường Chế Tài', type: CardType.ATTACK, value: 20, cost: 3, armorGain: 10, description: 'Thiên đường chế tài giáng xuống, gây 20 sát thương, nhận 10 giáp.', professionRequired: 'nun' },
    { id: 'nun_006', name: 'Khắc Ấn Thánh Ấn', type: CardType.ATTACK, value: 6, hitCount: 2, cost: 2, healSelf: 6, description: 'Khắc xuống thánh ấn, tấn công 2 lần mỗi lần 6 điểm, hồi 6 HP.', professionRequired: 'nun' },

    // --- Hệ Trị thương (Kèm giáp) ---
    { id: 'nun_007', name: 'Thập Tự Giá Chúc Phúc', type: CardType.HEAL, value: 15, cost: 1, armorGain: 5, description: 'Thập tự giá tỏa ánh sáng thần thánh, hồi 15 HP, nhận 5 giáp.', professionRequired: 'nun' },
    { id: 'nun_008', name: 'Thánh Thủy Tẩy Lễ', type: CardType.HEAL, value: 8, duration: 3, cost: 2, armorGain: 8, description: 'Thánh thủy duy trì trị liệu, mỗi lượt hồi 8 HP trong 3 lượt, nhận 8 giáp.', professionRequired: 'nun' },
    { id: 'nun_009', name: 'Ánh Sáng Cứu Rỗi', type: CardType.HEAL, value: 25, cost: 2, armorGain: 10, description: 'Hào quang cứu rỗi thần thánh, hồi 25 HP, nhận 10 giáp.', professionRequired: 'nun' },
    { id: 'nun_010', name: 'Nước Mắt Sám Hối', type: CardType.HEAL, value: 12, removeDebuff: true, cost: 2, armorGain: 6, description: 'Rơi lệ sám hối, hồi 12 HP, giải trừ trạng thái xấu, nhận 6 giáp.', professionRequired: 'nun' },
    { id: 'nun_011', name: 'Thần Ân Giáng Lâm', type: CardType.HEAL, value: 30, cost: 3, armorGain: 15, description: 'Ân điển của Thần giáng xuống, hồi 30 HP, nhận 15 giáp.', professionRequired: 'nun' },
    { id: 'nun_012', name: 'Lời Nguyện Trị Thương', type: CardType.HEAL, value: 10, cost: 0, armorGain: 3, description: 'Thì thầm cầu nguyện, hồi 10 HP, nhận 3 giáp.', professionRequired: 'nun' },

    // --- Hệ Giáp (Kèm hồi máu) ---
    { id: 'nun_013', name: 'Khiên Thần Thánh', type: CardType.ARMOR, value: 12, cost: 1, healValue: 5, description: 'Sức mạnh thần thánh tạo thành khiên, nhận 12 giáp, hồi 5 HP.', professionRequired: 'nun' },
    { id: 'nun_014', name: 'Thánh Vực', type: CardType.ARMOR, value: 18, cost: 2, healValue: 10, description: 'Triển khai thánh vực, nhận 18 giáp, hồi 10 HP.', professionRequired: 'nun' },
    { id: 'nun_015', name: 'Đôi Cánh Thiên Thần', type: CardType.ARMOR, value: 15, cost: 2, healValue: 8, description: 'Đôi cánh thiên thần bao bọc hộ thể, nhận 15 giáp, hồi 8 HP.', professionRequired: 'nun' },
    { id: 'nun_016', name: 'Băng Thành Thánh Quang', type: CardType.ARMOR, value: 25, cost: 3, healValue: 12, description: 'Triệu hồi băng thành thánh quang, nhận 25 giáp, hồi 12 HP.', professionRequired: 'nun' },
    { id: 'nun_017', name: 'Khiên Niềm Tin', type: CardType.ARMOR, value: 10, cost: 1, healValue: 6, description: 'Đức tin ngưng tụ thành khiên, nhận 10 giáp, hồi 6 HP.', professionRequired: 'nun' },

    // --- Hệ Buff (Kèm hồi máu/giáp) ---
    { id: 'nun_018', name: 'Cầu Nguyện Sám Hối', type: CardType.BUFF, value: 3, duration: 3, buffType: 'defense', cost: 1, healSelf: 5, description: 'Thành tâm cầu nguyện, phòng thủ +3 trong 3 lượt, hồi 5 HP.', professionRequired: 'nun' },
    { id: 'nun_019', name: 'Thánh Ca Vịnh Xướng', type: CardType.BUFF, value: 3, duration: 3, buffType: 'attack', cost: 1, armorGain: 6, description: 'Ngâm nga thánh ca, tấn công +3 trong 3 lượt, nhận 6 giáp.', professionRequired: 'nun' },
    { id: 'nun_020', name: 'Thiên Thần Giáng Lâm', type: CardType.BUFF, value: 4, duration: 3, buffType: 'attack', cost: 2, armorGain: 10, healSelf: 8, description: 'Triệu hồi thiên thần che chở, tấn công +4 trong 3 lượt, nhận 10 giáp, hồi 8 HP.', professionRequired: 'nun' },
    { id: 'nun_021', name: 'Thần Thánh Chúc Phúc', type: CardType.BUFF, value: 2, duration: 4, buffType: 'defense', cost: 1, healSelf: 8, description: 'Thần thánh chúc phúc hộ thân, phòng thủ +2 trong 4 lượt, hồi 8 HP.', professionRequired: 'nun' },
    { id: 'nun_022', name: 'Thánh Quang Che Chở', type: CardType.BUFF, value: 5, duration: 2, buffType: 'defense', cost: 2, armorGain: 12, description: 'Ánh sáng thần thánh che chở, phòng thủ +5 trong 2 lượt, nhận 12 giáp.', professionRequired: 'nun' },

    // --- Hệ Debuff (Kèm hồi máu/giáp) ---
    { id: 'nun_023', name: 'Thuật Trừ Tà', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'attack', cost: 1, armorGain: 5, description: 'Xua tan thế lực tà ác, tấn công kẻ thù -3 trong 3 lượt, nhận 5 giáp.', professionRequired: 'nun' },
    { id: 'nun_024', name: 'Thần Thánh Phong Ấn', type: CardType.DEBUFF, value: 4, duration: 2, debuffType: 'attack', cost: 2, healSelf: 8, description: 'Phong ấn sức mạnh kẻ thù, tấn công kẻ thù -4 trong 2 lượt, hồi 8 HP.', professionRequired: 'nun' },
    { id: 'nun_025', name: 'Thanh Tẩy Lời Nguyền', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'defense', cost: 2, armorGain: 8, healSelf: 5, description: 'Thanh tẩy lời nguyền, phòng thủ kẻ thù -3 trong 3 lượt, nhận 8 giáp, hồi 5 HP.', professionRequired: 'nun' },

    // --- Hệ Kỹ năng H đọa lạc (Kèm hồi máu/giáp) ---
    { id: 'nun_026', name: 'Cứu Rỗi Đọa Lạc', type: CardType.H_ATTACK, value: 14, cost: 2, healSelf: 12, corruptionRequired: 30, description: 'Dùng thân thể đọa lạc cứu rỗi kẻ thù, gây 14 sát thương, hồi 12 HP.', professionRequired: 'nun' },
    { id: 'nun_027', name: 'Cấm Kỵ Kỳ Nguyện', type: CardType.H_ATTACK, value: 18, cost: 2, armorGain: 10, corruptionRequired: 40, description: 'Dùng nhục thể cầu nguyện với Thần, gây 18 sát thương, nhận 10 giáp.', professionRequired: 'nun' },
    { id: 'nun_028', name: 'Thánh Nữ Đọa Lạc', type: CardType.H_ATTACK, value: 22, cost: 3, healSelf: 15, armorGain: 8, corruptionRequired: 50, description: 'Dáng vẻ đọa lạc của Thánh nữ, gây 22 sát thương, hồi 15 HP, nhận 8 giáp.', professionRequired: 'nun' },
    { id: 'nun_029', name: 'Bội Đức Cáo Giải', type: CardType.H_ATTACK, value: 16, cost: 2, healSelf: 10, armorGain: 6, corruptionRequired: 35, description: 'Dùng thân thể để xưng tội, gây 16 sát thương, hồi 10 HP, nhận 6 giáp.', professionRequired: 'nun' },
    { id: 'nun_030', name: 'Thần Phạt và Cứu Rỗi', type: CardType.H_ATTACK, value: 28, cost: 4, healSelf: 20, armorGain: 15, corruptionRequired: 60, description: 'Thần phạt và cứu rỗi hợp nhất, gây 28 sát thương, hồi 20 HP, nhận 15 giáp.', professionRequired: 'nun' },

    // ========== Thẻ bài đặc quyền Kỹ nữ (25 lá) - Đặc tính: Làm yếu công thủ kẻ địch, ít kỹ năng khống chế ==========
    // --- Hệ Làm yếu Tấn công ---
    { id: 'courtesan_001', name: 'Nụ Hôn Mê Hoặc', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'attack', cost: 1, description: 'Trao một nụ hôn mê hoặc, tấn công kẻ thù -4, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_002', name: 'Thoa Thuốc Kích Dục', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'attack', cost: 1, description: 'Thoa thuốc kích dục đặc chế, tấn công kẻ thù -5, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_003', name: 'Đoạt Hồn Nhiếp Phách', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'attack', cost: 2, description: 'Dùng thuật nhiếp hồn làm mê muội kẻ thù, tấn công -6, kéo dài 2 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_004', name: 'Tiêu Hồn Thực Cốt', type: CardType.DEBUFF, value: 8, duration: 2, debuffType: 'attack', cost: 2, description: 'Dùng thủ đoạn tiêu hồn ăn mòn kẻ thù, tấn công -8, kéo dài 2 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_005', name: 'Túy Sinh Mộng Tử', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'attack', cost: 2, description: 'Khiến kẻ thù chìm đắm trong say mê, tấn công -4, kéo dài 4 lượt.', professionRequired: 'courtesan' },

    // --- Hệ Làm yếu Phòng thủ ---
    { id: 'courtesan_006', name: 'Ánh Mắt Đưa Tình', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'defense', cost: 1, description: 'Ánh mắt lả lơi trêu chọc kẻ thù, phòng thủ -4, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_007', name: 'Câu Hồn Đoạt Phách', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'defense', cost: 1, description: 'Ánh mắt câu hồn làm tan rã phòng tuyến, phòng thủ -5, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_008', name: 'Túy Cốt Tán', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'defense', cost: 2, description: 'Khiến kẻ thù xương mềm gân rũ, phòng thủ -6, kéo dài 2 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_009', name: 'Thực Tâm Hương', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'defense', cost: 2, description: 'Hương thơm thực tâm lan tỏa, phòng thủ -4, kéo dài 4 lượt.', professionRequired: 'courtesan' },

    // --- Hệ Song Suy (Giảm cả công và thủ) ---
    { id: 'courtesan_010', name: 'Mê Tình Hương', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'both', cost: 2, description: 'Giải phóng mê tình hương, công thủ kẻ thù mỗi thứ -3, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_011', name: 'Cạm Bẫy Dịu Dàng', type: CardType.DEBUFF, value: 4, duration: 2, debuffType: 'both', cost: 2, description: 'Cạm bẫy dịu dàng, công thủ kẻ thù mỗi thứ -4, kéo dài 2 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_012', name: 'Mê Mộng Trong Hoa', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'both', cost: 3, description: 'Khiến kẻ thù rơi vào mộng đẹp trong hoa, công thủ mỗi thứ -5, kéo dài 2 lượt.', professionRequired: 'courtesan' },

    // --- Hệ Khống chế (Kẻ thù không thể hành động) ---
    { id: 'courtesan_013', name: 'Thuật Mê Hoặc', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 3, description: 'Mê hoặc mạnh mẽ, kẻ thù không thể hành động lượt sau.', professionRequired: 'courtesan' },
    { id: 'courtesan_014', name: 'Cực Lạc Tiêu Hồn', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 4, description: 'Để kẻ thù chìm đắm trong cực lạc, không thể hành động lượt sau.', professionRequired: 'courtesan' },
    { id: 'courtesan_015', name: 'Cấm Thuật Hoa Khôi', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 4, corruptionRequired: 40, description: 'Cấm thuật bí truyền của Hoa khôi, kẻ thù không thể hành động lượt sau.', professionRequired: 'courtesan' },

    // --- Hệ Buff bản thân ---
    { id: 'courtesan_016', name: 'Phong Nguyệt Vô Biên', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', cost: 2, description: 'Thể hiện thủ đoạn phong nguyệt, tấn công +5, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_017', name: 'Hồng Tụ Thiêm Hương', type: CardType.BUFF, value: 4, duration: 3, buffType: 'defense', cost: 1, description: 'Dáng vẻ tao nhã tăng phòng thủ, phòng thủ +4, kéo dài 3 lượt.', professionRequired: 'courtesan' },
    { id: 'courtesan_018', name: 'Thiên Kiều Bách Mị', type: CardType.BUFF, value: 6, duration: 2, buffType: 'attack', cost: 2, description: 'Thể hiện sự kiều diễm mê hồn, tấn công +6, kéo dài 2 lượt.', professionRequired: 'courtesan' },

    // --- Hệ Trị thương ---
    { id: 'courtesan_019', name: 'Ôn Nhu Hương', type: CardType.HEAL, value: 12, cost: 1, description: 'Dùng cách dịu dàng để khôi phục tinh lực, hồi 12 HP.', professionRequired: 'courtesan' },
    { id: 'courtesan_020', name: 'Diễm Phúc Tề Thiên', type: CardType.HEAL, value: 18, cost: 2, armorGain: 5, description: 'Diễm phúc vô tận, hồi 18 HP, nhận 5 giáp.', professionRequired: 'courtesan' },

    // --- Hệ Tấn công H ---
    { id: 'courtesan_021', name: 'Tiêu Hồn Nhất Kích', type: CardType.H_ATTACK, value: 14, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: 'Kỹ thuật tiêu hồn, gây 14 sát thương, tấn công kẻ thù -3 (2 lượt).', professionRequired: 'courtesan' },
    { id: 'courtesan_022', name: 'Tuyệt Kỹ Thanh Lâu', type: CardType.H_ATTACK, value: 18, cost: 2, debuffType: 'defense', debuffValue: 4, debuffDuration: 2, description: 'Tuyệt kỹ bí truyền thanh lâu, gây 18 sát thương, phòng thủ kẻ thù -4 (2 lượt).', professionRequired: 'courtesan' },
    { id: 'courtesan_023', name: 'Thuật Trên Giường', type: CardType.H_ATTACK, value: 10, hitCount: 2, cost: 2, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: 'Kỹ thuật chốn phòng khuê, tấn công 2 lần mỗi lần 10 điểm, tấn công kẻ thù -2 (2 lượt).', professionRequired: 'courtesan' },
    { id: 'courtesan_024', name: 'Một Đêm Trong Hoa', type: CardType.H_ATTACK, value: 22, cost: 3, debuffType: 'both', debuffValue: 3, debuffDuration: 2, corruptionRequired: 35, description: 'Một đêm xuân tiêu, gây 22 sát thương, công thủ kẻ thù mỗi thứ -3 (2 lượt).', professionRequired: 'courtesan' },
    { id: 'courtesan_025', name: 'Bí Thuật Hoa Khôi', type: CardType.H_ATTACK, value: 30, cost: 4, debuffType: 'stun', debuffDuration: 1, corruptionRequired: 50, description: 'Bí thuật tối thượng của Hoa khôi, gây 30 sát thương, kẻ thù không thể hành động lượt sau.', professionRequired: 'courtesan' },

    // ========== Thẻ bài đặc quyền Dân thường (20 lá) - Đặc tính: Chi phí thấp hiệu quả cao, rút bài, nhận vàng, đa năng ==========
    // --- Kỹ năng 0 mana (Tiết kiệm hiệu quả) ---
    { id: 'commoner_001', name: 'Khôn Vặt', type: CardType.ATTACK, value: 5, drawCards: 1, cost: 0, description: 'Nảy ra ý hay, gây 5 sát thương và rút 1 lá bài.', professionRequired: 'commoner' },
    { id: 'commoner_002', name: 'Thở Dốc', type: CardType.HEAL, value: 6, cost: 0, description: 'Tranh thủ thở dốc, hồi 6 HP.', professionRequired: 'commoner' },
    { id: 'commoner_003', name: 'Né Tránh', type: CardType.ARMOR, value: 6, cost: 0, description: 'Né tránh theo bản năng, nhận 6 giáp.', professionRequired: 'commoner' },

    // --- Hệ Rút bài chi phí thấp ---
    { id: 'commoner_004', name: 'Cái Khó Ló Cái Khôn', type: CardType.ATTACK, value: 8, drawCards: 1, cost: 1, description: 'Đòn đánh thông minh trong lúc nguy cấp, gây 8 sát thương và rút 1 lá bài.', professionRequired: 'commoner' },
    { id: 'commoner_005', name: 'Tùy Cơ Ứng Biến', type: CardType.BUFF, value: 2, duration: 2, buffType: 'attack', drawCards: 2, cost: 1, description: 'Tùy cơ ứng biến, tấn công +2 trong 2 lượt, rút 2 lá bài.', professionRequired: 'commoner' },
    { id: 'commoner_006', name: 'Xem Thời Thế', type: CardType.ARMOR, value: 8, drawCards: 1, cost: 1, description: 'Xem thời thế mà hành động, nhận 8 giáp và rút 1 lá bài.', professionRequired: 'commoner' },
    { id: 'commoner_007', name: 'Linh Tính Chợt Đến', type: CardType.BUFF, drawCards: 3, cost: 1, description: 'Linh tính chợt đến, rút 3 lá bài.', professionRequired: 'commoner' },

    // --- Hệ Nhận vàng ---
    { id: 'commoner_008', name: 'Nhặt Lẻ', type: CardType.ATTACK, value: 6, goldGain: 15, cost: 1, description: 'Thừa cơ nhặt lẻ, gây 6 sát thương và nhận 15 vàng.', professionRequired: 'commoner' },
    { id: 'commoner_009', name: 'Mặc Cả', type: CardType.DEBUFF, value: 3, duration: 2, debuffType: 'attack', goldGain: 20, cost: 1, description: 'Mặc cả làm phân tâm, tấn công kẻ thù -3 (2 lượt), nhận 20 vàng.', professionRequired: 'commoner' },
    { id: 'commoner_010', name: 'Sinh Tồn Phố Chợ', type: CardType.HEAL, value: 10, goldGain: 25, cost: 2, description: 'Trí tuệ sinh tồn chốn thị thành, hồi 10 HP, nhận 25 vàng.', professionRequired: 'commoner' },

    // --- Hệ Sinh tồn dẻo dai ---
    { id: 'commoner_011', name: 'Ý Chí Kiên Cường', type: CardType.ARMOR, value: 12, cost: 1, description: 'Ý chí kiên cường của người bình thường, nhận 12 giáp.', professionRequired: 'commoner' },
    { id: 'commoner_012', name: 'Bản Năng Sinh Tồn', type: CardType.HEAL, value: 10, armorGain: 6, cost: 1, description: 'Bản năng sinh tồn thức tỉnh, hồi 10 HP và nhận 6 giáp.', professionRequired: 'commoner' },
    { id: 'commoner_013', name: 'Nghịch Cảnh Cầu Sinh', type: CardType.BUFF, value: 4, duration: 3, buffType: 'defense', cost: 1, description: 'Bản năng sinh tồn trong nghịch cảnh, phòng thủ +4, kéo dài 3 lượt.', professionRequired: 'commoner' },
    { id: 'commoner_014', name: 'Tuyệt Xứ Phùng Sinh', type: CardType.HEAL, value: 20, armorGain: 10, cost: 2, description: 'Tìm thấy đường sống trong cõi chết, hồi 20 HP và nhận 10 giáp.', professionRequired: 'commoner' },

    // --- Hệ Tấn công đa năng ---
    { id: 'commoner_015', name: 'Dốc Lực Nhất Kích', type: CardType.ATTACK, value: 12, cost: 1, description: 'Đòn đánh dốc hết sức bình sinh, gây 12 sát thương.', professionRequired: 'commoner' },
    { id: 'commoner_016', name: 'Được Ăn Cả Ngã Về Không', type: CardType.ATTACK, value: 18, armorGain: 5, cost: 2, description: 'Đánh cược tất cả, gây 18 sát thương và nhận 5 giáp.', professionRequired: 'commoner' },
    { id: 'commoner_017', name: 'Trận Chiến Cuối Cùng', type: CardType.ATTACK, value: 10, hitCount: 2, cost: 2, description: 'Đường cùng phản kháng, tấn công 2 lần mỗi lần 10 điểm sát thương.', professionRequired: 'commoner' },

    // --- Hệ Kỹ năng H đọa lạc ---
    { id: 'commoner_018', name: 'Phó Mặc Thân Xác', type: CardType.H_ATTACK, value: 12, healSelf: 8, goldGain: 20, cost: 1, corruptionRequired: 25, description: 'Phó mặc thân xác để cầu sinh, gây 12 sát thương, hồi 8 HP, nhận 20 vàng.', professionRequired: 'commoner' },
    { id: 'commoner_019', name: 'Bán Rẻ Nhục Thể', type: CardType.H_ATTACK, value: 16, goldGain: 40, cost: 2, corruptionRequired: 40, description: 'Bán rẻ nhục thể đổi lấy sự sinh tồn, gây 16 sát thương, nhận 40 vàng.', professionRequired: 'commoner' },
    { id: 'commoner_020', name: 'Đọa Lạc Cầu Sinh', type: CardType.H_ATTACK, value: 22, healSelf: 15, armorGain: 8, goldGain: 30, cost: 3, corruptionRequired: 50, description: 'Hoàn toàn đọa lạc để sống sót, gây 22 sát thương, hồi 15 HP, nhận 8 giáp và 30 vàng.', professionRequired: 'commoner' },

    // ========== Thẻ bài đặc quyền Đạo tặc (25 lá) - Đặc tính: Sát thương duy trì DOT, rút bài chi phí thấp ==========
    // --- Hệ Rút bài 0 mana/chi phí thấp ---
    { id: 'thief_001', name: 'Quan Sát Trong Bóng Tối', type: CardType.BUFF, drawCards: 2, cost: 0, description: 'Âm thầm quan sát kẻ thù, rút 2 lá bài.', professionRequired: 'thief' },
    { id: 'thief_002', name: 'Đánh Lén', type: CardType.ATTACK, value: 8, drawCards: 1, cost: 1, description: 'Đánh lén nhanh chóng, gây 8 sát thương và rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_003', name: 'Biến Mất', type: CardType.ARMOR, value: 10, drawCards: 1, cost: 1, description: 'Biến mất trong màn đêm, nhận 10 giáp và rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_004', name: 'Ẩn Nấp', type: CardType.BUFF, value: 3, duration: 2, buffType: 'attack', drawCards: 1, cost: 1, description: 'Lẻn vào bóng tối, tấn công +3 trong 2 lượt, rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_005', name: 'Tật Phong Bộ', type: CardType.ARMOR, value: 6, drawCards: 2, cost: 1, description: 'Di chuyển như gió, nhận 6 giáp và rút 2 lá bài.', professionRequired: 'thief' },

    // --- DOT hệ Độc ---
    { id: 'thief_006', name: 'Tẩm Độc', type: CardType.DEBUFF, dotDamage: 3, duration: 3, debuffType: 'dot', cost: 1, description: 'Thoa thuốc độc, kẻ thù chịu 3 điểm độc thương mỗi lượt, kéo dài 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_007', name: 'Độc Nhận', type: CardType.ATTACK, value: 6, dotDamage: 4, duration: 3, cost: 1, description: 'Dao găm tẩm độc, gây 6 sát thương, kẻ thù chịu 4 điểm độc thương mỗi lượt trong 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_008', name: 'Dao Găm Kịch Độc', type: CardType.ATTACK, value: 4, dotDamage: 5, duration: 4, cost: 2, description: 'Dao găm kịch độc, gây 4 sát thương, kẻ thù chịu 5 điểm kịch độc mỗi lượt trong 4 lượt.', professionRequired: 'thief' },
    { id: 'thief_009', name: 'Thoa Xà Độc', type: CardType.DEBUFF, dotDamage: 6, duration: 3, debuffType: 'dot', cost: 2, description: 'Thoa nọc rắn, kẻ thù chịu 6 điểm độc thương mỗi lượt trong 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_010', name: 'Kịch Độc Chí Mạng', type: CardType.DEBUFF, dotDamage: 8, duration: 3, debuffType: 'dot', cost: 3, description: 'Kịch độc chí mạng ăn mòn, kẻ thù chịu 8 điểm độc thương mỗi lượt trong 3 lượt.', professionRequired: 'thief' },

    // --- DOT hệ Xuất huyết ---
    { id: 'thief_011', name: 'Xé Rách', type: CardType.ATTACK, value: 5, dotDamage: 3, duration: 3, cost: 1, description: 'Xé rách vết thương, gây 5 sát thương, kẻ thù chảy máu 3 điểm mỗi lượt trong 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_012', name: 'Phóng Huyết', type: CardType.DEBUFF, dotDamage: 4, duration: 4, debuffType: 'dot', cost: 1, description: 'Gây ra vết thương sâu, kẻ thù chảy máu 4 điểm mỗi lượt trong 4 lượt.', professionRequired: 'thief' },
    { id: 'thief_013', name: 'Liên Hoàn Cát', type: CardType.ATTACK, value: 3, hitCount: 2, dotDamage: 3, duration: 3, cost: 2, description: 'Cắt liên tiếp, tấn công 2 lần mỗi lần 3 điểm, kẻ thù chảy máu 3 điểm mỗi lượt trong 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_014', name: 'Cắt Động Mạch', type: CardType.ATTACK, value: 8, dotDamage: 6, duration: 3, cost: 2, description: 'Cắt đứt động mạch, gây 8 sát thương, kẻ thù chảy máu 6 điểm mỗi lượt trong 3 lượt.', professionRequired: 'thief' },

    // --- DOT Phức hợp (Độc + Chảy máu) ---
    { id: 'thief_015', name: 'Độc Huyết Song Nhận', type: CardType.ATTACK, value: 6, dotDamage: 4, duration: 4, cost: 2, drawCards: 1, description: 'Song đao độc huyết, gây 6 sát thương, kẻ thù chịu 4 điểm sát thương mỗi lượt trong 4 lượt, rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_016', name: 'Lưỡi Dao Ăn Mòn', type: CardType.ATTACK, value: 10, dotDamage: 5, duration: 3, cost: 2, description: 'Lưỡi dao ăn mòn, gây 10 sát thương, kẻ thù chịu 5 điểm ăn mòn mỗi lượt trong 3 lượt.', professionRequired: 'thief' },

    // --- Hệ Tấn công Bộc phát ---
    { id: 'thief_017', name: 'Đâm Lén', type: CardType.ATTACK, value: 15, ignoreArmor: true, cost: 2, description: 'Đánh lén từ phía sau, xuyên giáp gây 15 điểm sát thương.', professionRequired: 'thief' },
    { id: 'thief_018', name: 'Chí Mạng Nhất Kích', type: CardType.ATTACK, value: 20, cost: 2, description: 'Nhắm vào yếu huyệt gây đòn chí mạng, gây 20 điểm sát thương.', professionRequired: 'thief' },
    { id: 'thief_019', name: 'Liên Hoàn Thích', type: CardType.ATTACK, value: 5, hitCount: 4, cost: 2, description: 'Tấn công liên tiếp nhanh chóng, tấn công 4 lần mỗi lần 5 điểm sát thương.', professionRequired: 'thief' },

    // --- Hệ Sinh tồn/Phòng thủ ---
    { id: 'thief_020', name: 'Bom Khói', type: CardType.ARMOR, value: 12, drawCards: 1, cost: 1, description: 'Ném bom khói, nhận 12 giáp và rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_021', name: 'Ảnh Độn', type: CardType.ARMOR, value: 15, cost: 1, description: 'Ẩn mình trong bóng tối, nhận 15 giáp.', professionRequired: 'thief' },

    // --- Hệ Kỹ năng H đọa lạc ---
    { id: 'thief_022', name: 'Sắc Dụ Ám Sát', type: CardType.H_ATTACK, value: 14, dotDamage: 4, duration: 3, cost: 2, corruptionRequired: 30, description: 'Dùng thân thể dẫn dụ rồi ám sát, gây 14 sát thương, kẻ thù chịu 4 điểm sát thương mỗi lượt trong 3 lượt.', professionRequired: 'thief' },
    { id: 'thief_023', name: 'Sự Quyến Rũ Chí Mạng', type: CardType.H_ATTACK, value: 12, dotDamage: 5, duration: 3, drawCards: 1, cost: 2, corruptionRequired: 35, description: 'Sự quyến rũ chết người, gây 12 sát thương, kẻ thù chịu 5 điểm sát thương mỗi lượt trong 3 lượt, rút 1 lá bài.', professionRequired: 'thief' },
    { id: 'thief_024', name: 'Góa Phụ Đen', type: CardType.H_ATTACK, value: 18, dotDamage: 6, duration: 4, cost: 3, corruptionRequired: 45, description: 'Nụ hôn độc của mỹ nhân rắn rết, gây 18 sát thương, kẻ thù chịu 6 điểm kịch độc mỗi lượt trong 4 lượt.', professionRequired: 'thief' },
    { id: 'thief_025', name: 'Đoạt Mệnh Tiêu Hồn', type: CardType.H_ATTACK, value: 25, dotDamage: 8, duration: 3, cost: 4, corruptionRequired: 55, description: 'Tiêu hồn đoạt mệnh, gây 25 sát thương, kẻ thù chịu 8 điểm sát thương mỗi lượt trong 3 lượt.', professionRequired: 'thief' },

    // ========== Thẻ bài đặc quyền Chiến binh (15 lá) ==========
    { id: 'warrior_001', name: 'Trọng Kích', type: CardType.ATTACK, value: 16, cost: 2, description: 'Cú đánh nặng nề đầy uy lực, gây 16 điểm sát thương.', professionRequired: 'warrior' },
    { id: 'warrior_002', name: 'Khiên Kích', type: CardType.ATTACK, value: 10, armorGain: 10, cost: 2, description: 'Tấn công bằng khiên, gây 10 sát thương và nhận 10 giáp.', professionRequired: 'warrior' },
    { id: 'warrior_003', name: 'Thiết Bích', type: CardType.ARMOR, value: 20, cost: 2, description: 'Phòng thủ kiên cố như vách sắt, nhận 20 điểm giáp.', professionRequired: 'warrior' },
    { id: 'warrior_004', name: 'Chiến Hống', type: CardType.BUFF, value: 6, duration: 3, buffType: 'attack', cost: 2, description: 'Hống vang cổ vũ bản thân, tấn công +6 trong 3 lượt.', professionRequired: 'warrior' },
    { id: 'warrior_005', name: 'Phá Giáp Trảm', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 2, description: 'Cú chém phá giáp, xuyên giáp gây 12 điểm sát thương.', professionRequired: 'warrior' },
    { id: 'warrior_006', name: 'Kiên Thủ', type: CardType.ARMOR, value: 25, cost: 3, description: 'Kiên trì giữ vững vị trí, nhận 25 điểm giáp.', professionRequired: 'warrior' },
    { id: 'warrior_007', name: 'Cuồng Chiến Sĩ Chi Nộ', type: CardType.BUFF, value: 10, duration: 2, buffType: 'attack', cost: 2, description: 'Vào trạng thái cuồng chiến, tấn công +10 trong 2 lượt.', professionRequired: 'warrior' },
    { id: 'warrior_008', name: 'Thế Phản Công', type: CardType.ARMOR, value: 12, counterDamage: 6, cost: 2, description: 'Vào tư thế phản công, nhận 12 giáp, phản lại 6 sát thương khi bị tấn công.', professionRequired: 'warrior' },
    { id: 'warrior_009', name: 'Xung Phong', type: CardType.ATTACK, value: 14, armorGain: 5, cost: 2, description: 'Dũng mãnh xung phong, gây 14 sát thương và nhận 5 giáp.', professionRequired: 'warrior' },
    { id: 'warrior_010', name: 'Thân Thể Thép', type: CardType.BUFF, value: 8, duration: 3, buffType: 'defense', armorGain: 15, cost: 3, description: 'Thân thể bằng thép, phòng thủ +8 trong 3 lượt, nhận 15 giáp.', professionRequired: 'warrior' },
    { id: 'warrior_011', name: 'Hoành Tảo Thiên Quân', type: CardType.ATTACK, value: 20, cost: 3, description: 'Đòn đánh mạnh mẽ quét sạch tất cả, gây 20 điểm sát thương.', professionRequired: 'warrior' },
    { id: 'warrior_012', name: 'Bất Động Như Sơn', type: CardType.ARMOR, value: 30, cost: 3, description: 'Tư thế phòng thủ vững như núi, nhận 30 điểm giáp.', professionRequired: 'warrior' },
    { id: 'warrior_013', name: 'Chiến Thần Nhập Thể', type: CardType.BUFF, value: 8, duration: 3, buffType: 'attack', armorGain: 20, cost: 4, description: 'Chiến thần nhập thể, tấn công +8 trong 3 lượt, nhận 20 giáp.', professionRequired: 'warrior' },
    { id: 'warrior_014', name: 'Kỹ Năng Kết Liễu', type: CardType.ATTACK, value: 30, cost: 4, description: 'Chiêu kết liễu của chiến binh, gây 30 điểm sát thương.', professionRequired: 'warrior' },
    { id: 'warrior_015', name: 'Anh Dũng Không Sợ', type: CardType.BUFF, value: 5, duration: 4, buffType: 'attack', healSelf: 20, cost: 3, description: 'Anh dũng không sợ, tấn công +5 trong 4 lượt, hồi 20 HP.', professionRequired: 'warrior' },

    // ========== Thẻ bài đặc quyền Nữ Pháp sư (25 lá) - Đặc tính: Phép thuật sát thương cao, rút bài, nhận năng lượng ==========
    // --- Phép thuật hệ Hỏa ---
    { id: 'mage_001', name: 'Hỏa Cầu Thuật', type: CardType.ATTACK, value: 10, cost: 1, description: 'Phóng một quả cầu lửa, gây 10 điểm sát thương.', professionRequired: 'mage' },
    { id: 'mage_002', name: 'Liệt Diễm Xung Kích', type: CardType.ATTACK, value: 14, cost: 1, description: 'Sóng lửa kích mạnh kẻ thù, gây 14 điểm sát thương.', professionRequired: 'mage' },
    { id: 'mage_003', name: 'Viêm Bạo Thuật', type: CardType.ATTACK, value: 22, cost: 2, description: 'Kích nổ năng lượng lửa, gây 22 điểm sát thương.', professionRequired: 'mage' },
    { id: 'mage_004', name: 'Thiên Thạch Giáng Lâm', type: CardType.ATTACK, value: 30, cost: 3, description: 'Triệu hồi thiên thạch từ trời cao, gây 30 điểm sát thương.', professionRequired: 'mage' },

    // --- Phép thuật hệ Băng ---
    { id: 'mage_005', name: 'Băng Chùy Thuật', type: CardType.ATTACK, value: 8, cost: 1, drawCards: 1, description: 'Triệu hồi băng chùy tấn công, gây 8 sát thương và rút 1 lá bài.', professionRequired: 'mage' },
    { id: 'mage_006', name: 'Hàn Băng Tiễn', type: CardType.ATTACK, value: 12, cost: 1, drawCards: 1, description: 'Bắn ra tiễn băng, gây 12 sát thương và rút 1 lá bài.', professionRequired: 'mage' },
    { id: 'mage_007', name: 'Bão Tuyết', type: CardType.ATTACK, value: 7, hitCount: 3, cost: 2, drawCards: 1, description: 'Triệu hồi bão tuyết, tấn công 3 lần mỗi lần 7 điểm, rút 1 lá bài.', professionRequired: 'mage' },
    { id: 'mage_008', name: 'Băng Phong', type: CardType.ATTACK, value: 16, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: 'Đóng băng kẻ thù, gây 16 sát thương, tấn công kẻ thù -3 (2 lượt).', professionRequired: 'mage' },

    // --- Phép thuật hệ Lôi ---
    { id: 'mage_009', name: 'Lôi Kích Thuật', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 1, description: 'Triệu hồi sấm sét đánh xuống, xuyên giáp gây 12 điểm sát thương.', professionRequired: 'mage' },
    { id: 'mage_010', name: 'Tia Chớp Liên Hoàn', type: CardType.ATTACK, value: 6, hitCount: 3, ignoreArmor: true, cost: 2, description: 'Tia chớp liên hoàn, xuyên giáp tấn công 3 lần mỗi lần 6 điểm.', professionRequired: 'mage' },
    { id: 'mage_011', name: 'Lôi Đình Vạn Quân', type: CardType.ATTACK, value: 20, ignoreArmor: true, cost: 3, description: 'Sấm sét kinh thiên, xuyên giáp gây 20 điểm sát thương.', professionRequired: 'mage' },

    // --- Hệ Bí thuật ---
    { id: 'mage_012', name: 'Bí Thuật Phi Đạn', type: CardType.ATTACK, value: 4, hitCount: 3, cost: 1, description: 'Phóng ra 3 viên phi đạn bí thuật, mỗi viên gây 4 sát thương.', professionRequired: 'mage' },
    { id: 'mage_013', name: 'Bí Thuật Xung Kích', type: CardType.ATTACK, value: 8, cost: 0, description: 'Sóng năng lượng bí thuật xung kích, gây 8 điểm sát thương.', professionRequired: 'mage' },
    { id: 'mage_014', name: 'Nguyên Tố Bộc Phát', type: CardType.ATTACK, value: 12, hitCount: 3, cost: 4, description: 'Sức mạnh nguyên tố bùng nổ, tấn công 3 lần mỗi lần 12 sát thương.', professionRequired: 'mage' },

    // --- Hệ Năng lượng/Rút bài ---
    { id: 'mage_015', name: 'Ma Lực Trào Dâng', type: CardType.BUFF, gainEnergy: 2, drawCards: 1, cost: 1, description: 'Ma lực trào dâng, nhận 2 năng lượng và rút 1 lá bài.', professionRequired: 'mage' },
    { id: 'mage_016', name: 'Hút Pháp Lực', type: CardType.ATTACK, value: 8, cost: 1, gainEnergy: 1, description: 'Hút ma lực kẻ thù, gây 8 sát thương và nhận 1 năng lượng.', professionRequired: 'mage' },
    { id: 'mage_017', name: 'Thời Gian Sai Lệch', type: CardType.BUFF, drawCards: 3, cost: 1, description: 'Bóp méo thời gian, rút 3 lá bài.', professionRequired: 'mage' },
    { id: 'mage_018', name: 'Trí Tuệ Bí Thuật', type: CardType.BUFF, drawCards: 2, gainEnergy: 1, cost: 1, description: 'Trí tuệ bí thuật, rút 2 lá bài và nhận 1 năng lượng.', professionRequired: 'mage' },

    // --- Hệ Khiên ---
    { id: 'mage_019', name: 'Khiên Ma Lực', type: CardType.ARMOR, value: 10, cost: 1, description: 'Triệu hồi khiên ma lực, nhận 10 điểm giáp.', professionRequired: 'mage' },
    { id: 'mage_020', name: 'Hàn Băng Bình Chướng', type: CardType.ARMOR, value: 16, cost: 2, description: 'Triệu hồi bình chướng băng giá, nhận 16 điểm giáp.', professionRequired: 'mage' },
    { id: 'mage_021', name: 'Khiên Nguyên Tố', type: CardType.ARMOR, value: 12, drawCards: 1, cost: 1, description: 'Khiên nguyên tố, nhận 12 giáp và rút 1 lá bài.', professionRequired: 'mage' },

    // --- Hệ Buff/Debuff ---
    { id: 'mage_022', name: 'Tinh Thông Nguyên Tố', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', cost: 1, description: 'Tinh thông sức mạnh nguyên tố, tấn công +5 trong 3 lượt.', professionRequired: 'mage' },
    { id: 'mage_023', name: 'Phản Phế Phép Thuật', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'attack', armorGain: 8, cost: 2, description: 'Phản phệ phép thuật, tấn công kẻ thù -5 trong 2 lượt, nhận 8 giáp.', professionRequired: 'mage' },

    // --- Hệ Kỹ năng H đọa lạc ---
    { id: 'mage_024', name: 'Ma Pháp Cấm Kỵ', type: CardType.H_ATTACK, value: 20, cost: 2, drawCards: 1, corruptionRequired: 35, description: 'Ma pháp cấm kỵ, gây 20 sát thương và rút 1 lá bài.', professionRequired: 'mage' },
    { id: 'mage_025', name: 'Đọa Lạc Áo Nghĩa', type: CardType.H_ATTACK, value: 28, cost: 3, gainEnergy: 2, corruptionRequired: 50, description: 'Áo nghĩa đọa lạc, gây 28 sát thương và nhận 2 năng lượng.', professionRequired: 'mage' },

    // ========== Thẻ bài đặc quyền Succubus (Mị Ma) (20 lá) - Đặc tính: Gây sát thương đồng thời hồi máu (Hút máu) ==========
    // --- Tấn công hút máu cơ bản ---
    { id: 'succubus_p_001', name: 'Hút Sinh Mệnh', type: CardType.H_ATTACK, value: 10, cost: 1, healSelf: 6, description: 'Hút sinh mệnh kẻ thù, gây 10 sát thương và hồi 6 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_002', name: 'Hấp Thụ Tinh Hoa', type: CardType.H_ATTACK, value: 8, cost: 1, healSelf: 8, description: 'Hấp thụ tinh hoa kẻ thù, gây 8 sát thương và hồi 8 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_003', name: 'Nụ Hôn Dẫn Dụ', type: CardType.H_ATTACK, value: 12, cost: 1, healSelf: 6, description: 'Tấn công bằng nụ hôn chết người, gây 12 sát thương và hồi 6 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_004', name: 'Cái Chạm Của Succubus', type: CardType.H_ATTACK, value: 6, cost: 0, healSelf: 4, description: 'Cái chạm nhẹ của Mị ma, gây 6 sát thương và hồi 4 HP.', professionRequired: 'succubus_player' },

    // --- Tấn công hút máu trung cấp ---
    { id: 'succubus_p_005', name: 'Thôn Phệ Tinh Hoa', type: CardType.H_ATTACK, value: 16, cost: 2, healSelf: 10, description: 'Thôn phệ tinh hoa kẻ thù, gây 16 sát thương và hồi 10 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_006', name: 'Siphon Sinh Mệnh', type: CardType.H_ATTACK, value: 14, cost: 2, healSelf: 14, description: 'Hút sinh mệnh mạnh mẽ, gây 14 sát thương và hồi 14 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_007', name: 'Điệu Nhảy Succubus', type: CardType.H_ATTACK, value: 6, hitCount: 3, cost: 2, healSelf: 9, description: 'Điệu nhảy yêu kiều, tấn công 3 lần mỗi lần 6 điểm, hồi 9 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_008', name: 'Dục Vọng Ăn Mòn', type: CardType.H_ATTACK, value: 18, cost: 2, healSelf: 8, description: 'Dùng dục vọng ăn mòn kẻ thù, gây 18 sát thương và hồi 8 HP.', professionRequired: 'succubus_player' },

    // --- Tấn công hút máu cao cấp ---
    { id: 'succubus_p_009', name: 'Ánh Nhìn Vực Thẳm', type: CardType.H_ATTACK, value: 22, cost: 3, healSelf: 12, description: 'Ánh nhìn từ vực thẳm, gây 22 sát thương và hồi 12 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_010', name: 'Hút Linh Hồn', type: CardType.H_ATTACK, value: 20, cost: 3, healSelf: 20, description: 'Hút lấy linh hồn kẻ thù, gây 20 sát thương và hồi 20 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_011', name: 'Vực Thẳm Nở Rộ', type: CardType.H_ATTACK, value: 30, cost: 4, healSelf: 18, description: 'Sức mạnh vực thẳm bùng nở, gây 30 sát thương và hồi 18 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_012', name: 'Chân Thân Succubus', type: CardType.H_ATTACK, value: 25, cost: 4, healSelf: 25, description: 'Hiện nguyên hình Mị ma, gây 25 sát thương và hồi 25 HP.', professionRequired: 'succubus_player' },

    // --- Hút máu + Giáp ---
    { id: 'succubus_p_013', name: 'Cái Ôm Bóng Tối', type: CardType.ARMOR, value: 10, healValue: 6, cost: 1, description: 'Bóng tối bao phủ hộ thể, nhận 10 giáp và hồi 6 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_014', name: 'Đôi Cánh Đọa Lạc', type: CardType.ARMOR, value: 14, healValue: 8, cost: 2, description: 'Triển khai đôi cánh đọa lạc, nhận 14 giáp và hồi 8 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_015', name: 'Ma Dực Hộ Thể', type: CardType.ARMOR, value: 18, healValue: 10, cost: 2, description: 'Cánh ma bao bọc hộ thể, nhận 18 giáp và hồi 10 HP.', professionRequired: 'succubus_player' },

    // --- Hút máu + Buff ---
    { id: 'succubus_p_016', name: 'Dục Vọng Thức Tỉnh', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', healSelf: 8, cost: 2, description: 'Thức tỉnh dục vọng nội tâm, tấn công +5 trong 3 lượt, hồi 8 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_017', name: 'Đọa Thiên Sứ Giáng Lâm', type: CardType.BUFF, value: 6, duration: 3, buffType: 'attack', healSelf: 12, armorGain: 10, cost: 3, description: 'Hóa thân thành thiên sứ đọa lạc, tấn công +6 trong 3 lượt, hồi 12 HP, nhận 10 giáp.', professionRequired: 'succubus_player' },

    // --- Hút máu + Debuff ---
    { id: 'succubus_p_018', name: 'Mắt Mê Hoặc', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'attack', healSelf: 6, cost: 1, description: 'Ánh mắt mê hoặc, tấn công kẻ thù -4 trong 3 lượt, hồi 6 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_019', name: 'Chi phối Tâm Trí', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'attack', healSelf: 10, cost: 2, description: 'Chi phối tâm trí kẻ thù, tấn công -5 trong 2 lượt, hồi 10 HP.', professionRequired: 'succubus_player' },
    { id: 'succubus_p_020', name: 'Sự Quyến Rũ Ma Tính', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'defense', healSelf: 8, cost: 2, description: 'Sự quyến rũ đầy ma tính, phòng thủ kẻ thù -4 trong 3 lượt, hồi 8 HP.', professionRequired: 'succubus_player' },

    // ========== Thẻ bài Trị liệu chung (12 lá) ==========
    { id: 'heal_001', name: 'Túi Cấp Cứu', type: CardType.HEAL, value: 8, cost: 1, description: 'Trị thương nhanh, hồi 8 điểm sinh mệnh.' },
    { id: 'heal_002', name: 'Hộp Y Tế', type: CardType.HEAL, value: 15, cost: 2, description: 'Sử dụng hộp y tế, hồi 15 điểm sinh mệnh.' },
    { id: 'heal_003', name: 'Dược Phẩm Sinh Mệnh', type: CardType.HEAL, value: 25, cost: 3, description: 'Uống dược phẩm sinh mệnh quý giá, hồi 25 điểm sinh mệnh.' },
    { id: 'heal_004', name: 'Khôi Phục Duy Trì', type: CardType.HEAL, value: 3, duration: 4, cost: 2, description: 'Mỗi lượt hồi 3 điểm sinh mệnh trong vòng 4 lượt.' },
    { id: 'heal_005', name: 'Băng Gạc', type: CardType.HEAL, value: 5, cost: 0, description: 'Băng bó đơn giản, hồi 5 điểm sinh mệnh.' },
    { id: 'heal_006', name: 'Thánh Quang Trị Liệu', type: CardType.HEAL, value: 12, cost: 1, description: 'Ánh sáng thần thánh, hồi 12 điểm sinh mệnh.' },
    { id: 'heal_007', name: 'Thuật Tái Sinh', type: CardType.HEAL, value: 5, duration: 3, cost: 2, description: 'Mỗi lượt hồi 5 điểm sinh mệnh trong vòng 3 lượt.' },
    { id: 'heal_008', name: 'Suối Thánh', type: CardType.HEAL, value: 35, cost: 4, description: 'Nước suối thần thánh, hồi 35 điểm sinh mệnh.' },
    { id: 'heal_009', name: 'Khôi Phục Cấp Tốc', type: CardType.HEAL, value: 10, cost: 1, description: 'Khôi phục nhanh 10 điểm sinh mệnh.' },
    { id: 'heal_010', name: 'Hút Sự Sống', type: CardType.HEAL, value: 8, cost: 1, description: 'Hút sinh mệnh từ đại địa, hồi 8 điểm HP.' },
    { id: 'heal_011', name: 'Gió Trị Liệu', type: CardType.HEAL, value: 18, cost: 2, description: 'Làn gió trị liệu thổi qua, hồi 18 điểm HP.' },
    { id: 'heal_012', name: 'Khôi Phục Hoàn Toàn', type: CardType.HEAL, value: 50, cost: 5, description: 'Trị liệu cực mạnh, hồi 50 điểm sinh mệnh.' },

    // ========== Thẻ bài Tăng ích (Buff) chung (15 lá) ==========
    { id: 'buff_001', name: 'Tăng Cường Sức Mạnh', type: CardType.BUFF, value: 3, duration: 3, buffType: 'attack', cost: 1, description: 'Tăng 3 điểm tấn công, kéo dài 3 lượt.' },
    { id: 'buff_002', name: 'Chiến Ý Sục Sôi', type: CardType.BUFF, value: 5, duration: 2, buffType: 'attack', cost: 2, description: 'Tăng mạnh tấn công +5, kéo dài 2 lượt.' },
    { id: 'buff_003', name: 'Thiết Bích', type: CardType.BUFF, value: 5, duration: 3, buffType: 'defense', cost: 2, description: 'Tăng 5 điểm phòng thủ, kéo dài 3 lượt.' },
    { id: 'buff_004', name: 'Tăng Tốc', type: CardType.BUFF, value: 1, duration: 2, buffType: 'extraAction', cost: 3, description: 'Nhận thêm cơ hội hành động, kéo dài 2 lượt.' },
    { id: 'buff_005', name: 'Chuyên Chú', type: CardType.BUFF, value: 2, duration: 3, buffType: 'draw', cost: 1, description: 'Mỗi lượt rút thêm 2 lá bài, kéo dài 3 lượt.' },
    { id: 'buff_006', name: 'Cuồng Bạo', type: CardType.BUFF, value: 8, duration: 2, buffType: 'attack', cost: 3, description: 'Vào trạng thái cuồng bạo, tấn công +8, kéo dài 2 lượt.' },
    { id: 'buff_007', name: 'Ý Chí Thép', type: CardType.BUFF, value: 8, duration: 2, buffType: 'defense', cost: 3, description: 'Ý chí sắt đá, phòng thủ +8, kéo dài 2 lượt.' },
    { id: 'buff_008', name: 'Khinh Doanh', type: CardType.BUFF, value: 1, duration: 3, buffType: 'draw', cost: 1, description: 'Mỗi lượt rút thêm 1 lá bài, kéo dài 3 lượt.' },
    { id: 'buff_009', name: 'Tích Lực', type: CardType.BUFF, value: 2, duration: 4, buffType: 'attack', cost: 1, description: 'Tấn công +2, kéo dài 4 lượt.' },
    { id: 'buff_010', name: 'Kiên Nhẫn', type: CardType.BUFF, value: 3, duration: 4, buffType: 'defense', cost: 1, description: 'Phòng thủ +3, kéo dài 4 lượt.' },
    { id: 'buff_011', name: 'Khát Máu', type: CardType.BUFF, value: 10, duration: 1, buffType: 'attack', cost: 2, description: 'Bùng nổ tấn công +10, chỉ trong 1 lượt.' },
    { id: 'buff_012', name: 'Thần Thánh Che Chở', type: CardType.BUFF, value: 6, duration: 3, buffType: 'defense', cost: 2, description: 'Thần thánh che chở, phòng thủ +6, kéo dài 3 lượt.' },
    { id: 'buff_013', name: 'Dốc Toàn Lực', type: CardType.BUFF, value: 4, duration: 5, buffType: 'attack', cost: 2, description: 'Dốc toàn lực, tấn công +4, kéo dài 5 lượt.' },
    { id: 'buff_014', name: 'Thế Né Tránh', type: CardType.BUFF, value: 4, duration: 2, buffType: 'defense', cost: 1, description: 'Vào tư thế né tránh, phòng thủ +4, kéo dài 2 lượt.' },
    { id: 'buff_015', name: 'Thiên Tài Chiến Thuật', type: CardType.BUFF, value: 2, duration: 2, buffType: 'draw', cost: 3, description: 'Mỗi lượt rút thêm 2 lá bài, kéo dài 2 lượt.' },

    // ========== Thẻ bài Suy giảm (Debuff) chung (12 lá) ==========
    { id: 'debuff_001', name: 'Suy Nhược', type: CardType.DEBUFF, value: 3, duration: 2, debuffType: 'attack', cost: 1, description: 'Làm tấn công kẻ thù giảm 3 điểm, kéo dài 2 lượt.' },
    { id: 'debuff_002', name: 'Ăn Mòn', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'dot', cost: 2, description: 'Gây ăn mòn lên kẻ thù, mỗi lượt gây 3 sát thương, kéo dài 3 lượt.' },
    { id: 'debuff_003', name: 'Trói Buộc', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'defense', cost: 2, description: 'Trói buộc kẻ thù, giảm 5 điểm phòng thủ, kéo dài 2 lượt.' },
    { id: 'debuff_004', name: 'Mù Lòa', type: CardType.DEBUFF, value: 50, duration: 2, debuffType: 'accuracy', cost: 2, description: 'Làm tỉ lệ chính xác của kẻ thù giảm 50%, kéo dài 2 lượt.' },
    { id: 'debuff_005', name: 'Sợ Hãi', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'skip', cost: 3, description: 'Khiến kẻ thù rơi vào sợ hãi, bỏ qua lượt hành động tiếp theo.' },
    { id: 'debuff_006', name: 'Kịch Độc', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'dot', cost: 3, description: 'Hiệu ứng kịch độc, mỗi lượt gây 5 sát thương, kéo dài 3 lượt.' },
    { id: 'debuff_007', name: 'Suy Yếu', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'attack', cost: 2, description: 'Làm tấn công kẻ thù giảm 5 điểm, kéo dài 3 lượt.' },
    { id: 'debuff_008', name: 'Phá Giáp', type: CardType.DEBUFF, value: 8, duration: 2, debuffType: 'defense', cost: 2, description: 'Phá hủy giáp, giảm 8 điểm phòng thủ, kéo dài 2 lượt.' },
    { id: 'debuff_009', name: 'Mê Muội', type: CardType.DEBUFF, value: 80, duration: 1, debuffType: 'accuracy', cost: 2, description: 'Làm tỉ lệ chính xác của kẻ thù giảm 80%, kéo dài 1 lượt.' },
    { id: 'debuff_010', name: 'Tê Liệt', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'skip', cost: 3, description: 'Làm kẻ thù tê liệt, bỏ qua 1 lượt hành động.' },
    { id: 'debuff_011', name: 'Thiêu Đốt', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'dot', cost: 2, description: 'Hiệu ứng thiêu đốt, mỗi lượt gây 4 sát thương, kéo dài 4 lượt.' },
    { id: 'debuff_012', name: 'Lời Nguyền', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'attack', cost: 2, description: 'Nguyền rủa kẻ thù, tấn công giảm 6 điểm, kéo dài 2 lượt.' },

    // ========== Thẻ bài Giáp chung (9 lá) ==========
    { id: 'armor_001', name: 'Đỡ Đòn', type: CardType.ARMOR, value: 5, cost: 1, description: 'Nhận 5 điểm giáp, có thể chặn 5 điểm sát thương.' },
    { id: 'armor_002', name: 'Tường Thép', type: CardType.ARMOR, value: 12, cost: 2, description: 'Nhận 12 điểm giáp, tăng mạnh khả năng phòng thủ.' },
    { id: 'armor_003', name: 'Khiên Phản Đòn', type: CardType.ARMOR, value: 8, reflect: 3, cost: 2, description: 'Nhận 8 điểm giáp, phản lại 3 sát thương khi bị tấn công.' },
    { id: 'armor_004', name: 'Khiên Năng Lượng', type: CardType.ARMOR, value: 6, duration: 3, cost: 2, description: 'Mỗi lượt nhận 6 điểm giáp, kéo dài 3 lượt.' },
    { id: 'armor_005', name: 'Phòng Thủ Tuyệt Đối', type: CardType.ARMOR, value: 20, cost: 3, description: 'Nhận 20 điểm giáp cực mạnh.' },
    { id: 'armor_006', name: 'Khiên Nhẹ', type: CardType.ARMOR, value: 3, cost: 0, description: 'Nhận 3 điểm giáp.' },
    { id: 'armor_007', name: 'Khiên Thánh Quang', type: CardType.ARMOR, value: 10, cost: 2, description: 'Khiên thần thánh, nhận 10 điểm giáp.' },
    { id: 'armor_008', name: 'Giáp Gai', type: CardType.ARMOR, value: 6, reflect: 5, cost: 2, description: 'Nhận 6 điểm giáp, phản lại 5 sát thương.' },
    { id: 'armor_009', name: 'Bình Chướng Bất Diệt', type: CardType.ARMOR, value: 30, cost: 4, description: 'Phòng thủ tối thượng, nhận 30 điểm giáp.' },

    // ========== Thẻ bài đặc quyền Ma Pháp Thiếu Nữ (30 lá) - Đặc tính: Cơ chế biến thân ==========
    // --- Thẻ biến thân ---
    { id: 'mg_transform', name: 'Được rồi, bắt đầu làm việc nào! (ﾉ◕ヮ◕)ﾉ', type: CardType.BUFF, cost: 0, isTransformCard: true, isConsume: true, description: '✨ Biến thân thành Ma Pháp Thiếu Nữ! Biến thân kéo dài 2 lượt. Thẻ này sẽ bị tiêu hao sau khi dùng.', professionRequired: 'magicalGirl' },

    // --- Thẻ dùng trước khi biến thân (Thẻ cơ bản) ---
    { id: 'mg_001', name: 'Tinh Quang Đạn ☆彡', type: CardType.ATTACK, value: 6, cost: 1, description: 'Bắn đạn ánh sao, gây 6 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_002', name: 'Nguyệt Quang Chúc Phúc ☽', type: CardType.HEAL, value: 8, cost: 1, description: 'Lời chúc của ánh trăng, hồi 8 HP.', professionRequired: 'magicalGirl' },
    { id: 'mg_003', name: 'Khiên Cầu Vồng ⌒°', type: CardType.ARMOR, value: 8, cost: 1, description: 'Hào quang cầu vồng tạo thành khiên, nhận 8 giáp.', professionRequired: 'magicalGirl' },
    { id: 'mg_004', name: 'Trái Tim Tỏa Sáng ♡', type: CardType.BUFF, value: 2, duration: 3, buffType: 'attack', cost: 1, description: 'Ánh sáng trong tim, tấn công +2 trong 3 lượt.', professionRequired: 'magicalGirl' },
    { id: 'mg_005', name: 'Ánh Sáng Hy Vọng ✧', type: CardType.BUFF, value: 2, duration: 3, buffType: 'defense', cost: 1, description: 'Ánh sáng của hy vọng, phòng thủ +2 trong 3 lượt.', professionRequired: 'magicalGirl' },

    // --- Thẻ bài mạnh sau khi biến thân (Yêu cầu trạng thái biến thân) ---
    { id: 'mg_006', name: '✨Xung Kích Tỏa Sáng (๑•̀ㅂ•́)u✧', type: CardType.ATTACK, value: 25, cost: 1, requiresTransform: true, description: '【Cần biến thân】Sóng xung kích tỏa sáng, gây 25 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_007', name: '✨Tinh Bạo Liên Kích ☆ﾐ(o*･ω･)ﾉ', type: CardType.ATTACK, value: 12, hitCount: 2, cost: 2, requiresTransform: true, description: '【Cần biến thân】Sao bùng nổ, tấn công 2 lần mỗi lần 12 điểm.', professionRequired: 'magicalGirl' },
    { id: 'mg_008', name: '✨Nguyệt Thần Chi Nộ (╬ Ò﹏Ó)', type: CardType.ATTACK, value: 40, cost: 2, requiresTransform: true, description: '【Cần biến thân】Cơn thịnh nộ của Nguyệt Thần giáng xuống, gây 40 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_009', name: '✨Tuế Tinh Đọa Lạc ☄(ﾟ∀ﾟ)', type: CardType.ATTACK, value: 30, ignoreArmor: true, cost: 1, requiresTransform: true, description: '【Cần biến thân】Triệu hồi sao chổi, xuyên giáp gây 30 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_010', name: '✨Mũi Tên Cực Quang ⇝⇝(ノ´ヮ`)ノ', type: CardType.ATTACK, value: 18, hitCount: 2, cost: 1, requiresTransform: true, description: '【Cần biến thân】Bắn mũi tên cực quang, tấn công 2 lần mỗi lần 18 điểm.', professionRequired: 'magicalGirl' },
    { id: 'mg_011', name: '✨Ngân Hà Phong Bạo ٩(๑`^´๑)۶', type: CardType.ATTACK, value: 15, hitCount: 4, cost: 2, requiresTransform: true, description: '【Cần biến thân】Cơn bão dải ngân hà, tấn công 4 lần mỗi lần 15 điểm.', professionRequired: 'magicalGirl' },
    { id: 'mg_012', name: '✨Tia Sáng Trái Tim (ノ◕ヮ◕)ノ*:･ﾟ✧', type: CardType.ATTACK, value: 60, cost: 3, requiresTransform: true, description: '【Cần biến thân】Tia sáng từ con tim, gây 60 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_013', name: '✨Mưa Sao Băng ☆彡☆彡☆彡', type: CardType.ATTACK, value: 10, hitCount: 5, cost: 3, requiresTransform: true, description: '【Cần biến thân】Triệu hồi mưa sao băng, tấn công 5 lần mỗi lần 10 điểm.', professionRequired: 'magicalGirl' },

    // --- Thẻ Trị liệu/Phòng thủ sau khi biến thân ---
    { id: 'mg_014', name: '✨Thánh Quang Trị Dũ (´,,•ω•,,)♡', type: CardType.HEAL, value: 30, cost: 1, requiresTransform: true, description: '【Cần biến thân】Thánh quang chữa lành thân tâm, hồi 30 HP.', professionRequired: 'magicalGirl' },
    { id: 'mg_015', name: '✨Khiên Kim Cương ◇◆◇', type: CardType.ARMOR, value: 30, cost: 1, requiresTransform: true, description: '【Cần biến thân】Lớp khiên cứng như kim cương, nhận 30 giáp.', professionRequired: 'magicalGirl' },
    { id: 'mg_016', name: '✨Bình Chướng Tinh Quang ☆(ゝω・)v', type: CardType.ARMOR, value: 20, healValue: 12, cost: 1, requiresTransform: true, description: '【Cần biến thân】Bình chướng ánh sao, nhận 20 giáp, hồi 12 HP.', professionRequired: 'magicalGirl' },

    // --- Thẻ Buff/Debuff sau khi biến thân ---
    { id: 'mg_017', name: '✨Ma Lực Thức Tỉnh (๑˃̵ᴗ˂̵)u', type: CardType.BUFF, value: 10, duration: 2, buffType: 'attack', cost: 1, requiresTransform: true, description: '【Cần biến thân】Ma lực thức tỉnh, tấn công +10 trong 2 lượt.', professionRequired: 'magicalGirl' },
    { id: 'mg_018', name: '✨Tinh Thần Chúc Phúc ☆(´ε｀ )☆', type: CardType.BUFF, value: 8, duration: 2, buffType: 'defense', armorGain: 20, cost: 2, requiresTransform: true, description: '【Cần biến thân】Tinh tú chúc phúc, phòng thủ +8 (2 lượt), nhận 20 giáp.', professionRequired: 'magicalGirl' },
    { id: 'mg_019', name: '✨Hào Quang Phong Ấn (｀・ω・´)', type: CardType.DEBUFF, value: 10, duration: 2, debuffType: 'attack', cost: 1, requiresTransform: true, description: '【Cần biến thân】Hào quang phong ấn kẻ thù, tấn công kẻ thù -10 (2 lượt).', professionRequired: 'magicalGirl' },
    { id: 'mg_020', name: '✨Hồng Quang Suy Nhược ヾ(≧へ≦)〃', type: CardType.DEBUFF, value: 8, duration: 2, debuffType: 'defense', cost: 1, requiresTransform: true, description: '【Cần biến thân】Ánh cầu vồng làm yếu kẻ thù, phòng thủ kẻ thù -8 (2 lượt).', professionRequired: 'magicalGirl' },

    // --- Thẻ kéo dài biến thân (Quan trọng!) ---
    { id: 'mg_021', name: '✨Trái Tim Vĩnh Hằng ♡( ◡‿◡ )', type: CardType.BUFF, cost: 2, extendTransform: 1, requiresTransform: true, description: '【Cần biến thân】Niềm tin vĩnh cửu, kéo dài biến thân thêm 1 lượt.', professionRequired: 'magicalGirl' },
    { id: 'mg_022', name: '✨Hy Vọng Tiếp Diễn (ง˃̀ᴗ˂́)ง', type: CardType.BUFF, cost: 2, extendTransform: 1, requiresTransform: true, drawCards: 1, description: '【Cần biến thân】Hy vọng tiếp diễn, kéo dài biến thân thêm 1 lượt, rút 1 lá bài.', professionRequired: 'magicalGirl' },
    { id: 'mg_023', name: '✨Ma Pháp Vĩnh Hằng ٩(♡ε♡ )۶', type: CardType.BUFF, cost: 3, extendTransform: 2, requiresTransform: true, description: '【Cần biến thân】Ma pháp không bao giờ biến mất, kéo dài biến thân thêm 2 lượt.', professionRequired: 'magicalGirl' },

    // --- Thẻ biến thân cao cấp ---
    { id: 'mg_024', name: '✨Xung Kích Cuối Cùng (๑•̀ω•́๑)', type: CardType.ATTACK, value: 40, cost: 2, requiresTransform: true, healSelf: 20, description: '【Cần biến thân】Xung kích cuối cùng, gây 40 sát thương, hồi 20 HP.', professionRequired: 'magicalGirl' },
    { id: 'mg_025', name: '✨Tia Sáng Thanh Tẩy ☆ﾟ.*･｡', type: CardType.ATTACK, value: 35, cost: 2, requiresTransform: true, armorGain: 15, description: '【Cần biến thân】Tia sáng thanh tẩy, gây 35 sát thương, nhận 15 giáp.', professionRequired: 'magicalGirl' },
    { id: 'mg_026', name: '✨Tia Lửa Kỳ Tích (ノ≧∀≦)ノ', type: CardType.ATTACK, value: 15, hitCount: 3, cost: 2, requiresTransform: true, healSelf: 10, description: '【Cần biến thân】Tia lửa kỳ tích, tấn công 3 lần mỗi lần 15 điểm, hồi 10 HP.', professionRequired: 'magicalGirl' },
    { id: 'mg_027', name: '✨Ma Pháp Bùng Nổ ٩(๑`ȏ´๑)۶', type: CardType.ATTACK, value: 40, cost: 3, requiresTransform: true, description: '【Cần biến thân】Dốc toàn lực ma pháp bùng nổ, gây 40 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_028', name: '✨Tinh Thần Phán Quyết ☆(メ｀ロ´)', type: CardType.ATTACK, value: 35, ignoreArmor: true, cost: 2, requiresTransform: true, description: '【Cần biến thân】Sự phán xét của các vì sao, xuyên giáp gây 35 điểm sát thương.', professionRequired: 'magicalGirl' },
    { id: 'mg_029', name: '✨Nguyệt Quang Luân Hồi ☽(´,,•ω•,,)', type: CardType.HEAL, value: 40, armorGain: 20, cost: 2, requiresTransform: true, description: '【Cần biến thân】Nguyệt quang luân hồi, hồi 40 HP, nhận 20 giáp.', professionRequired: 'magicalGirl' },
    { id: 'mg_030', name: '✨Tỏa Sáng Cuối Cùng ☆ﾟ.+:｡ヽ(◎´∀`)ﾉﾟ.+:｡', type: CardType.ATTACK, value: 60, cost: 4, requiresTransform: true, description: '【Cần biến thân】Ánh sáng cuối cùng dốc hết tất cả! Gây 60 điểm sát thương.', professionRequired: 'magicalGirl' }
];


// 玩家卡组管理器
const CardDeckManager = {
    // 玩家当前卡组
    deck: [],

    // 当前手牌
    hand: [],

    // 弃牌堆
    discard: [],

    // 初始化卡组（从保存数据或默认卡组）
    init: function (savedDeck = null) {
        if (savedDeck && savedDeck.length > 0) {
            // 检查保存的数据格式（兼容旧版只保存ID的格式）
            if (typeof savedDeck[0] === 'string') {
                // 旧格式：只有ID
                this.deck = savedDeck.map(cardId => {
                    const original = CardLibrary.find(c => c.id === cardId);
                    return original ? { ...original } : null;
                }).filter(c => c !== null);
            } else {
                // 新格式：完整卡牌对象（包含升级后的属性）
                // 🔧 合并原始卡牌属性，确保新增属性不丢失
                this.deck = savedDeck.map(cardData => {
                    const original = CardLibrary.find(c => c.id === cardData.id);
                    if (original) {
                        // 先复制原始卡牌，再覆盖保存的数据（保留升级等修改）
                        return { ...original, ...cardData };
                    }
                    return { ...cardData };
                }).filter(c => c !== null && c.id);
            }
        } else {
            // 默认初始卡组
            this.deck = [
                CardLibrary.find(c => c.id === 'attack_001'),
                CardLibrary.find(c => c.id === 'attack_001'),
                CardLibrary.find(c => c.id === 'attack_002'),
                CardLibrary.find(c => c.id === 'heal_001'),
                CardLibrary.find(c => c.id === 'heal_001'),
                CardLibrary.find(c => c.id === 'armor_001'),
                CardLibrary.find(c => c.id === 'armor_001'),
                CardLibrary.find(c => c.id === 'buff_001'),
                CardLibrary.find(c => c.id === 'debuff_001')
            ].filter(c => c !== null);
        }

        this.hand = [];
        this.discard = [];

        console.log('[卡牌系统] 卡组初始化完成，卡组数量:', this.deck.length);
    },

    // 添加卡牌到卡组
    addCard: function (cardId) {
        const card = CardLibrary.find(c => c.id === cardId);
        if (card) {
            this.deck.push({ ...card });
            console.log('[卡牌系统] 添加卡牌:', card.name);
            this.renderDeck();
            saveCardDeck(); // 🔧 添加卡牌后自动保存
            return true;
        }
        return false;
    },

    // 从卡组移除卡牌
    removeCard: function (cardId) {
        const index = this.deck.findIndex(c => c.id === cardId);
        if (index > -1) {
            const removed = this.deck.splice(index, 1)[0];
            console.log('[卡牌系统] 移除卡牌:', removed.name);
            this.renderDeck();
            saveCardDeck(); // 🔧 移除卡牌后自动保存
            return true;
        }
        return false;
    },

    // 获取卡组数据用于保存（保存完整卡牌对象，包括升级后的属性）
    getDeckData: function () {
        return this.deck.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            value: c.value,
            cost: c.cost,
            description: c.description,
            duration: c.duration,
            upgraded: c.upgraded || false,
            // 攻击相关
            hitCount: c.hitCount,
            hits: c.hits,
            ignoreArmor: c.ignoreArmor,
            // 特殊效果
            drawCards: c.drawCards,
            armorGain: c.armorGain,
            reflect: c.reflect,
            // 毒伤效果
            poisonDamage: c.poisonDamage,
            poisonDuration: c.poisonDuration,
            // Buff/Debuff
            healType: c.healType,
            buffType: c.buffType,
            debuffType: c.debuffType,
            // 职业限定
            professionRequired: c.professionRequired,
            // 🔧 修复：添加缺失的字段，确保刷新后效果不丢失
            // 治疗相关
            healSelf: c.healSelf,
            healValue: c.healValue,
            // Debuff数值相关
            debuffValue: c.debuffValue,
            debuffDuration: c.debuffDuration,
            // 持续伤害
            dotDamage: c.dotDamage,
            // H技能堕落值需求
            corruptionRequired: c.corruptionRequired,
            // 金币获取
            goldGain: c.goldGain,
            // 状态移除
            removeDebuff: c.removeDebuff,
            // 魔法少女相关
            isTransformCard: c.isTransformCard,
            requiresTransform: c.requiresTransform,
            extendTransform: c.extendTransform,
            // 消耗卡牌
            isConsume: c.isConsume,
            // 词缀系统
            affix: c.affix,
            // 诅咒卡相关
            damage: c.damage,
            statusId: c.statusId,
            icon: c.icon
        }));
    },

    // 渲染卡组到UI
    renderDeck: function () {
        const container = document.getElementById('cardDeckList');
        if (!container) return;

        // 更新卡组数量显示
        const countEl = document.getElementById('cardDeckCount');
        if (countEl) {
            countEl.textContent = this.deck.length + ' Bộ';
        }

        if (this.deck.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #999; padding: 20px;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🃏</div>
                    <div>Chưa có thẻ bài</div>
                    <div style="font-size: 11px; margin-top: 5px; color: #666;">Thẻ bài sẽ được thu thập trong quá trình chơi</div>
                </div>`;
            return;
        }

        // 按类型分组统计
        const typeCount = {};
        this.deck.forEach(card => {
            if (!typeCount[card.type]) {
                typeCount[card.type] = [];
            }
            typeCount[card.type].push(card);
        });

        let html = `<div class="card-deck-summary" style="margin-bottom: 10px; font-size: 12px; color: #888;">Tổng số thẻ bài: ${this.deck.length} lá</div>`;

        // 渲染每张卡（用grid布局，一行3个）
        html += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">`;
        this.deck.forEach((card, index) => {
            html += this.renderCard(card, index);
        });
        html += `</div>`;

        container.innerHTML = html;
    },

    // 渲染单张卡牌
    renderCard: function (card, index = 0) {
        const typeColor = CardTypeColors[card.type] || '#666';
        const typeName = CardTypeNames[card.type] || 'Chưa biết';

        // Tạo văn bản hiệu ứng dựa trên loại thẻ bài
        let effectText = '';
        if (card.type === CardType.ATTACK || card.type === CardType.H_ATTACK) {
            effectText = `Sát thương: ${card.value}`;
            if (card.hitCount) effectText += ` x${card.hitCount} lần`;
            if (card.ignoreArmor) effectText += ' (Xuyên giáp)';
        } else if (card.type === CardType.HEAL) {
            effectText = `Hồi phục: +${card.value}HP`;
            if (card.duration) effectText += ` (${card.duration} lượt)`;
        } else if (card.type === CardType.BUFF) {
            // Loại BUFF cần hiển thị dựa trên hiệu ứng cụ thể
            if (card.drawCards) {
                effectText = `📜 Rút ${card.drawCards} lá bài`;
            } else if (card.gainEnergy) {
                effectText = `⚡ +${card.gainEnergy} năng lượng`;
            } else if (card.value) {
                effectText = `Hiệu quả: +${card.value}`;
            } else {
                effectText = `✨ Hiệu ứng tăng ích`;
            }
            if (card.duration) effectText += ` (${card.duration} lượt)`;
        } else if (card.type === CardType.DEBUFF) {
            effectText = `Hiệu quả: -${card.value}`;
            if (card.duration) effectText += ` (${card.duration} lượt)`;
        } else if (card.type === CardType.ARMOR) {
            effectText = `Giáp: +${card.value}`;
            if (card.reflect) effectText += ` (Phản sát thương ${card.reflect})`;
            if (card.duration) effectText += ` (${card.duration} lượt)`;
        }

        return `
            <div class="card-item" data-card-id="${card.id}" data-card-index="${index}" 
                 style="background: linear-gradient(135deg, rgba(30,30,50,0.9) 0%, rgba(20,20,35,0.95) 100%);
                        border: 1px solid ${typeColor}40;
                        border-left: 3px solid ${typeColor};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;"
                 onmouseover="this.style.transform='translateX(3px)';this.style.boxShadow='0 2px 8px ${typeColor}30';"
                 onmouseout="this.style.transform='translateX(0)';this.style.boxShadow='none';"
                 onclick="CardDeckManager.showCardDetail(${index})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: bold; color: #fff; font-size: 13px;"><span style="color:#ffd700;font-size:11px;">${card.cost}⚡</span> ${card.name}</span>
                    <span style="background: ${typeColor}; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${typeName}</span>
                </div>
                <div style="font-size: 11px; color: #aaa; margin-bottom: 4px;">${effectText}</div>
                <div style="font-size: 12px; color: #999; line-height: 1.4;">${card.description}</div>
            </div>
        `;
    },

    // 显示卡牌详情弹窗（通过索引获取，支持升级后的卡牌）
    showCardDetail: function (index) {
        const card = this.deck[index];
        if (!card) return;

        const typeColor = CardTypeColors[card.type] || '#666';
        const typeName = CardTypeNames[card.type] || 'Chưa biết';

        // 创建弹窗
        const modal = document.createElement('div');
        modal.id = 'cardDetailModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        border: 2px solid ${typeColor}; border-radius: 12px;
                        padding: 25px; max-width: 350px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #fff; font-size: 18px;">${card.name}</h3>
                    <span style="background: ${typeColor}; color: #fff; padding: 4px 12px; border-radius: 15px; font-size: 12px;">${typeName}</span>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                        <div><span style="color: #888;">Chỉ số: </span><span style="color: ${typeColor}; font-weight: bold;">${card.value}</span></div>
                        <div><span style="color: #888;">Tiêu hao: </span><span style="color: #ffd700;">${card.cost || 1} điểm</span></div>
                        ${card.duration ? `<div style="grid-column: span 2;"><span style="color: #888;">Duy trì: </span><span style="color: #2ed573;">${card.duration} lượt</span></div>` : ''}
                    </div>
                </div>
                
                <div style="color: #ccc; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                    ${card.description}
                </div>
                
                <button onclick="document.getElementById('cardDetailModal').remove()"
                        style="width: 100%; padding: 10px; background: ${typeColor}; color: #fff;
                               border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    Đóng
                </button>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }
};

// AI生成卡牌的解析器
const AICardParser = {
    /**
     * Phân tích văn bản thẻ bài do AI tạo ra
     * Định dạng kỳ vọng:
     * 【Tên thẻ】xxx
     * 【Loại】Tấn công/Tấn công H/Trị liệu/Tăng ích/Giảm ích/Giáp
     * 【Chỉ số】+5
     * 【Duy trì】2 lượt (tùy chọn)
     * 【Mô tả】xxx
     */
    parse: function (text) {
        const cards = [];

        // Khớp khối thẻ bài
        const cardPattern = /【Tên thẻ】([^\n【]+)[\s\S]*?【Loại】([^\n【]+)[\s\S]*?【Chỉ số】([^\n【]+)(?:[\s\S]*?【Duy trì】([^\n【]+))?[\s\S]*?【Mô tả】([^\n【]+)/g;

        let match;
        while ((match = cardPattern.exec(text)) !== null) {
            const card = {
                id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: match[1].trim(),
                type: this.parseType(match[2].trim()),
                value: this.parseValue(match[3].trim()),
                duration: match[4] ? this.parseDuration(match[4].trim()) : null,
                description: match[5].trim(),
                cost: 1, // 默认消耗
                isAIGenerated: true
            };

            // 根据数值调整消耗
            if (card.value >= 15) card.cost = 3;
            else if (card.value >= 8) card.cost = 2;

            cards.push(card);
        }

        return cards;
    },

    // 解析类型
    parseType: function (typeText) {
        const typeMap = {
            'Tấn công': CardType.ATTACK,
            'h tấn công': CardType.H_ATTACK,
            'H tấn công': CardType.H_ATTACK,
            'Trị liệu': CardType.HEAL,
            'Tăng ích': CardType.BUFF,
            'Tăng ích ta': CardType.BUFF,
            'Giảm ích': CardType.DEBUFF,
            'debuff': CardType.DEBUFF,
            'Debuff đối phương': CardType.DEBUFF,
            'Giáp': CardType.ARMOR
        };
        return typeMap[typeText] || CardType.ATTACK;
    },

    // 解析数值
    parseValue: function (valueText) {
        const num = parseInt(valueText.replace(/[^0-9-]/g, ''));
        return isNaN(num) ? 5 : Math.abs(num);
    },

    // 解析持续回合
    parseDuration: function (durationText) {
        const num = parseInt(durationText.replace(/[^0-9]/g, ''));
        return isNaN(num) ? null : num;
    }
};

// ==================== 路线系统 ====================
const RouteSystem = {
    currentRoutes: [],

    // 生成3张路线卡
    generateRoutes: function (floor = 1) {
        const routes = [];
        const types = [RouteType.UNKNOWN, RouteType.MONSTER, RouteType.ELITE, RouteType.BOSS, RouteType.SHOP, RouteType.REST];

        // 🔧 修复：floor 为 0 或未定义时，使用默认值 1
        const actualFloor = floor || 1;

        // 根据层数调整权重
        let weights;
        if (actualFloor > 0 && actualFloor % 10 === 0) {
            // 每10层必出BOSS（但不是第0层）
            weights = { [RouteType.BOSS]: 100 };
        } else if (actualFloor % 5 === 0) {
            // 每5层出精英
            weights = {
                [RouteType.ELITE]: 40,
                [RouteType.MONSTER]: 20,
                [RouteType.SHOP]: 20,
                [RouteType.REST]: 20
            };
        } else {
            weights = {
                [RouteType.UNKNOWN]: 20,
                [RouteType.MONSTER]: 35,
                [RouteType.ELITE]: 10,
                [RouteType.SHOP]: 15,
                [RouteType.REST]: 20
            };
        }

        // 生成3张不同的路线卡
        const usedTypes = new Set();
        for (let i = 0; i < 3; i++) {
            let type = this.weightedRandom(weights);
            // 避免重复（除非只有一种选择）
            let attempts = 0;
            while (usedTypes.has(type) && attempts < 10) {
                type = this.weightedRandom(weights);
                attempts++;
            }
            usedTypes.add(type);
            routes.push({ type, id: 'route_' + Date.now() + '_' + i });
        }

        this.currentRoutes = routes;
        return routes;
    },

    // 权重随机
    weightedRandom: function (weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return type;
        }
        return Object.keys(weights)[0];
    },

    // 显示路线选择弹窗
    showRouteSelection: function () {
        // 🔧 预览下一层，但不增加层数（关闭弹窗不会增加层数）
        const nextFloor = (PlayerState.floor || 0) + 1;

        // 🔧 同步堕落值到变量表单
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        console.log('[路线系统] 预览第', nextFloor, '层，堕落值:', PlayerState.corruption);

        const routes = this.generateRoutes(nextFloor);

        const modal = document.createElement('div');
        modal.id = 'routeSelectionModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
        `;

        // 路线卡片图片映射
        const RouteImageConfig = {
            'unknown': 'img/icon/route_1.png',
            'monster': 'img/icon/route_2.png',
            'elite': 'img/icon/route_3.png',
            'boss': 'img/icon/route_6.png',
            'shop': 'img/icon/route_4.png',
            'rest': 'img/icon/route_5.png'
        };

        let cardsHtml = '';
        routes.forEach((route, index) => {
            const imgSrc = RouteImageConfig[route.type] || 'img/icon/route_1.png';
            cardsHtml += `
                <div class="route-card route-${route.type}" onclick="RouteSystem.selectRoute('${route.type}', ${index})">
                    <img src="${imgSrc}" alt="${route.type}" class="route-img">
                </div>
            `;
        });

        modal.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px;">
                <button onclick="document.getElementById('routeSelectionModal')?.remove()"
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3);
                               color: #fff; width: 40px; height: 40px; border-radius: 50%;
                               cursor: pointer; font-size: 20px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,100,100,0.3)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
            </div>
            <div style="color: #fff; font-size: 24px; margin-bottom: 30px; text-align: center;">
                <div>Tầng ${nextFloor}</div>
                <div style="font-size: 14px; color: #888; margin-top: 5px;">Chọn con đường của bạn</div>
            </div>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                ${cardsHtml}
            </div>
            <div style="margin-top: 30px;">
                <button onclick="RouteSystem.leaveDungeon()"
                        style="background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
                               border: 2px solid #b2bec3; border-radius: 12px; padding: 15px 30px;
                               color: #fff; cursor: pointer; font-size: 16px; transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 5px 20px rgba(0,0,0,0.4)';"
                        onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none';">
                    🚪 Rời khỏi tòa tháp
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // 选择路线
    selectRoute: function (routeType, index) {
        document.getElementById('routeSelectionModal')?.remove();

        // 🔧 选择路线时才增加层数（关闭弹窗不增加）
        PlayerState.floor += 1;
        PlayerState.createFloorSnapshot();
        PlayerState.save();
        PlayerState.updateDisplay();

        switch (routeType) {
            case RouteType.MONSTER:
                BattleSystem.startBattle('monster');
                break;
            case RouteType.ELITE:
                BattleSystem.startBattle('elite');
                break;
            case RouteType.BOSS:
                BattleSystem.startBattle('boss');
                break;
            case RouteType.SHOP:
                ShopSystem.openShop();
                break;
            case RouteType.REST:
                RestSystem.openRest();
                break;
            case RouteType.UNKNOWN:
                this.handleRandomEvent();
                break;
        }
    },

    // 离开尖塔
    leaveDungeon: function () {
        document.getElementById('routeSelectionModal')?.remove();

        // 显示选择弹窗
        const modal = document.createElement('div');
        modal.id = 'leaveDungeonModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10001;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        border: 2px solid #667eea; border-radius: 16px; padding: 30px;
                        max-width: 400px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
                <div style="color: #fff; font-size: 20px; font-weight: bold; margin-bottom: 10px;">Rời khỏi tòa tháp</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 25px;">
                    Tầng hiện tại: Tầng ${PlayerState.floor}<br>
                    Vàng: ${PlayerState.gold} 💰
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="RouteSystem.confirmLeaveDungeon(true)"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                   border: none; border-radius: 8px; padding: 12px 25px;
                                   color: #fff; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ✨ Tạo cốt truyện
                    </button>
                    <button onclick="RouteSystem.confirmLeaveDungeon(false)"
                            style="background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
                                   border: none; border-radius: 8px; padding: 12px 25px;
                                   color: #fff; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ⏭️ Bỏ qua cốt truyện
                    </button>
                </div>
                <button onclick="document.getElementById('leaveDungeonModal')?.remove()"
                        style="margin-top: 20px; background: transparent; border: 1px solid #666;
                               border-radius: 6px; padding: 8px 20px; color: #888; cursor: pointer;">
                    Hủy bỏ
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // 确认离开尖塔
    confirmLeaveDungeon: function (generateStory) {
        document.getElementById('leaveDungeonModal')?.remove();

        if (generateStory) {
            // Tạo cốt truyện: Gửi cho AI
            const prompt = `【Rời khỏi tòa tháp】
Tôi mang theo những chiến lợi phẩm thu được trong tòa tháp, quyết định tạm thời rời khỏi nơi nguy hiểm này.
Trạng thái hiện tại:
- Tầng thám hiểm: Tầng ${PlayerState.floor}
- Vàng: ${PlayerState.gold}
- Sinh mệnh: ${PlayerState.hp}/${PlayerState.maxHp}
- Chỉ số đọa lạc: ${PlayerState.corruption}

Hãy miêu tả cảnh tượng tôi rời khỏi tòa tháp, cũng như cảm giác sau khi trở về khu vực an toàn.`;

            // 重置到第0层
            PlayerState.floor = 0;
            PlayerState.save();

            // 🔧 更新内联状态栏显示
            PlayerState.updateDisplay();
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }

            // 发送给AI
            if (typeof ACJTGame !== 'undefined' && ACJTGame.sendToAI) {
                ACJTGame.sendToAI(prompt);
            }
        } else {
            // 跳过剧情：直接重置到第0层
            PlayerState.floor = 0;
            PlayerState.save();

            // 🔧 更新内联状态栏显示（inlinePlayerFloor等）
            PlayerState.updateDisplay();

            // Hiển thị thông báo đơn giản
            if (typeof showNotification === 'function') {
                showNotification('Bạn đã rời khỏi tòa tháp và quay trở về tầng 0', 'info');
            } else {
                alert('Bạn đã rời khỏi tòa tháp và quay trở về tầng 0');
            }

            // 更新状态面板
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }
        }
    },

    // 处理随机事件（问号牌）- 移除了trap事件，特殊状态现在通过敌人H技能获得
    handleRandomEvent: function () {
        const eventTypes = ['erotic', 'adventure', 'misfortune'];
        const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        const prompts = RandomEventPrompts[selectedType];
        const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // 发送给AI
        ACJTGame.sendToAI(selectedPrompt);
    },

    // 处理陷阱事件
    handleTrapEvent: function () {
        // 从 SpecialStatusConfig 中随机选一个
        const statusKeys = Object.keys(SpecialStatusConfig);
        const randomKey = statusKeys[Math.floor(Math.random() * statusKeys.length)];
        const status = SpecialStatusConfig[randomKey];

        // 添加到 SpecialStatusManager
        SpecialStatusManager.add(randomKey);

        // 同时添加到 gameState.variables.specialStatus
        if (typeof gameState !== 'undefined') {
            if (!gameState.variables.specialStatus) {
                gameState.variables.specialStatus = {};
            }
            gameState.variables.specialStatus[randomKey] = {
                active: true,
                effect: status.desc,
                description: status.fullDesc
            };
            console.log('[陷阱] 添加特殊状态到变量表单:', randomKey);
        }

        // 更新状态面板
        if (typeof updateStatusPanel === 'function') {
            updateStatusPanel();
        }

        // Gửi từ khóa gợi ý cho AI
        const floor = PlayerState.floor || 1;
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Tầng ${floor} của tòa tháp】 Tôi đã dính bẫy và bị gắn ${randomKey} không thể tháo rời. ${status.fullDesc}`;
        ACJTGame.recordToHistory(`Cạm bẫy: Bị gắn ${randomKey}`);
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== 战斗系统 ====================
const BattleSystem = {
    currentEnemy: null,
    playerArmor: 0,
    enemyArmor: 0,
    currentEnergy: 3,
    hand: [],
    drawPile: [],
    discardPile: [],
    turn: 1,
    playerBuffs: [],
    playerDebuffs: [],    // 🆕 玩家debuff列表
    enemyBuffs: [],       // 🆕 敌人buff列表
    enemyDebuffs: [],
    isPlayerTurn: true,
    battleLog: [],

    // 🆕 意图系统
    currentIntent: null,      // 当前意图
    chargeLevel: 0,           // 蓄力层数
    mechanicCooldowns: {},    // Boss机制冷却计数
    minions: [],              // 召唤物列表
    isSilenced: false,        // 是否被沉默
    drawReduction: 0,         // 抽牌减少

    // 🆕 弃牌选择系统
    pendingDiscardCount: 0,   // 待弃牌数量
    selectedDiscards: [],     // 已选择的弃牌索引

    // 🆕 魔法少女变身系统
    isTransformed: false,        // 是否处于变身状态
    transformTurnsLeft: 0,       // 变身剩余回合数

    // 📝 添加战斗日志
    addLog: function (text) {
        // 如果text已经包含 [回合X] 则不再添加
        const hasPrefix = text.startsWith('[Lượt');
        const logText = hasPrefix ? text : `[Lượt ${this.turn}] ${text}`;
        this.battleLog.push(logText);
        console.log('[战斗日志]', text);
    },

    lastBossId: null, // 记录上次遇到的Boss，避免重复

    // 开始战斗
    startBattle: function (enemyType) {
        // 根据类型随机选择怪物
        let monsters = Object.values(MonsterConfig).filter(m => m.type === enemyType);
        if (monsters.length === 0) {
            console.error('[战斗] 没有找到对应类型的怪物:', enemyType);
            return;
        }

        // 🔧 Boss战避免连续遇到同一个Boss
        if (enemyType === 'boss' && monsters.length > 1 && this.lastBossId) {
            monsters = monsters.filter(m => m.id !== this.lastBossId);
        }

        this.currentEnemy = { ...monsters[Math.floor(Math.random() * monsters.length)] };

        // 记录本次Boss
        if (enemyType === 'boss') {
            this.lastBossId = this.currentEnemy.id;
        }

        // 🔧 根据层数缩放怪物属性：每5层增加1.3倍
        const floor = PlayerState.floor || 1;
        const scaleTier = Math.floor((floor - 1) / 5); // 0-4层=0, 5-9层=1, 10-14层=2...
        const scaleMultiplier = Math.pow(1.3, scaleTier);

        this.currentEnemy.hp = Math.round(this.currentEnemy.hp * scaleMultiplier);
        this.currentEnemy.attack = Math.round(this.currentEnemy.attack * scaleMultiplier);
        this.currentEnemy.defense = Math.round(this.currentEnemy.defense * scaleMultiplier);
        this.currentEnemy.currentHp = this.currentEnemy.hp;

        if (scaleTier > 0) {
            console.log(`[战斗] 层数${floor}，怪物属性缩放 x${scaleMultiplier.toFixed(2)}`);
        }

        this.playerArmor = PlayerState.baseArmor;
        this.enemyArmor = 0;
        this.turn = 1;
        this.playerBuffs = [];
        this.playerDebuffs = [];    // 🆕 重置玩家debuff
        this.enemyBuffs = [];       // 🆕 重置敌人buff
        this.enemyDebuffs = [];
        this.isPlayerTurn = true;
        this.battleLog = [];

        // 🆕 重置意图系统
        this.currentIntent = null;
        this.chargeLevel = 0;
        this.mechanicCooldowns = {};
        this.minions = [];
        this.isSilenced = false;
        this.drawReduction = 0;

        // 🆕 重置魔法少女变身状态
        this.isTransformed = false;
        this.transformTurnsLeft = 0;


        // 📝 Ghi lại bắt đầu trận đấu
        this.battleLog.push(`━━━ Bắt đầu trận đấu ━━━`);
        this.battleLog.push(`Kẻ địch: ${this.currentEnemy.name} (HP:${this.currentEnemy.hp} Công:${this.currentEnemy.attack} Thủ:${this.currentEnemy.defense})`);
        this.battleLog.push(`Người chơi: ${PlayerState.name} (HP:${PlayerState.hp}/${PlayerState.maxHp} Công:${PlayerState.attack} Thủ:${PlayerState.defense})`);

        // 🆕 Nếu là Boss, hiển thị thông tin cơ chế đặc biệt
        if (this.currentEnemy.specialMechanic) {
            const mech = this.currentEnemy.specialMechanic;
            this.battleLog.push(`⭐ Cơ chế Boss: ${mech.name} - ${mech.description}`);
        }

        // 🔧 Áp dụng hiệu ứng trạng thái đặc biệt
        const statusEffects = SpecialStatusManager.onBattleStart();
        this.currentEnergy = Math.max(0, PlayerState.energy - (statusEffects.energyLoss || 0));

        // 🔧 Áp dụng điều chỉnh thuộc tính từ trạng thái đặc biệt
        this.applySpecialStatusEffects();

        // Khởi tạo bộ bài
        this.drawPile = [...CardDeckManager.deck].sort(() => Math.random() - 0.5);
        this.discardPile = [];
        this.hand = [];

        // Rút bài khởi đầu (Cơ bản 5 lá + Thưởng rút bài từ Thánh di vật)
        let initialDraw = 5;
        if (this.relicMods?.drawBonus > 0) {
            initialDraw += this.relicMods.drawBonus;
            console.log('[Trận đấu] Thưởng rút bài từ Thánh di vật:', this.relicMods.drawBonus);
        }
        this.drawCards(initialDraw);

        // 🆕 Tạo ý định lượt đầu tiên của kẻ địch
        this.generateNextIntent();

        // Hiển thị giao diện chiến đấu (Battle UI)
        this.showBattleUI();

        console.log('[Trận đấu] Bắt đầu trận đấu với:', this.currentEnemy.name);
    },

    // 🔧 应用特殊状态效果到战斗属性
    applySpecialStatusEffects: function () {
        // 初始化所有可能的状态修正
        this.statusMods = {
            attack: 0, defense: 0, maxHp: 0, damageTaken: 0,
            hDamageBonus: 0, hpPerTurn: 0, hpOnHit: 0, enemyAttackReduce: 0
        };

        // 从 SpecialStatusManager 获取激活的状态（诅咒卡牌的）
        Object.values(SpecialStatusManager.statuses || {}).forEach(status => {
            // 处理单一效果
            switch (status.effect) {
                case 'attack': this.statusMods.attack += status.value; break;
                case 'defense': this.statusMods.defense += status.value; break;
                case 'maxHp': this.statusMods.maxHp += status.value; break;
                case 'damageTaken': this.statusMods.damageTaken += status.value; break;
            }

            // 🔧 处理复合效果（multiple类型）
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.attack) this.statusMods.attack += status.effects.attack;
                if (status.effects.defense) this.statusMods.defense += status.effects.defense;
                if (status.effects.maxHp) this.statusMods.maxHp += status.effects.maxHp;
                if (status.effects.damageTaken) this.statusMods.damageTaken += status.effects.damageTaken;
            }
        });

        console.log('[战斗] 特殊状态修正:', this.statusMods);

        // 🔧 从角色创建时选择的开局状态获取效果
        const charStatuses = ACJTGame.charData?.startingStatuses || [];
        charStatuses.forEach(statusId => {
            const config = StartingStatusConfig[statusId];
            if (config && config.statusEffect) {
                const eff = config.statusEffect;
                if (eff.attack) this.statusMods.attack += eff.attack;
                if (eff.defense) this.statusMods.defense += eff.defense;
                if (eff.maxHp) this.statusMods.maxHp += eff.maxHp;
                if (eff.hDamageBonus) this.statusMods.hDamageBonus += eff.hDamageBonus;
                if (eff.hpPerTurn) this.statusMods.hpPerTurn += eff.hpPerTurn;
                if (eff.hpOnHit) this.statusMods.hpOnHit += eff.hpOnHit;
                if (eff.enemyAttackReduce) this.statusMods.enemyAttackReduce += eff.enemyAttackReduce;
            }
        });

        // 🔧 从遗物获取战斗效果（修复：使用 PlayerState.relics 和 RelicConfig）
        this.relicMods = { lifesteal: 0, healBonus: 0, drawBonus: 0, reflect: 0, hDamageBonus: 0, goldBonus: 0, shopDiscount: 0 };
        (PlayerState.relics || []).forEach(relicId => {
            const relic = RelicConfig[relicId];
            if (relic && relic.effect) {
                if (relic.effect.lifesteal) this.relicMods.lifesteal += relic.effect.lifesteal;
                if (relic.effect.healBonus) this.relicMods.healBonus += relic.effect.healBonus;
                if (relic.effect.drawBonus) this.relicMods.drawBonus += relic.effect.drawBonus;
                if (relic.effect.reflect) this.relicMods.reflect += relic.effect.reflect;
                if (relic.effect.hDamageBonus) this.relicMods.hDamageBonus += relic.effect.hDamageBonus;
                if (relic.effect.goldBonus) this.relicMods.goldBonus += relic.effect.goldBonus;
                if (relic.effect.shopDiscount) this.relicMods.shopDiscount += relic.effect.shopDiscount;
            }
        });

        console.log('[战斗] 特殊状态修正:', this.statusMods);
        console.log('[战斗] 遗物修正:', this.relicMods);
    },

    // 🆕 生成下一回合意图
    generateNextIntent: function () {
        const enemy = this.currentEnemy;
        if (!enemy) return;

        const pattern = enemy.intentPattern || [{ type: 'attack', weight: 100 }];

        // 如果正在蓄力，第二回合释放
        if (this.chargeLevel > 0) {
            this.currentIntent = {
                type: EnemyIntentType.CHARGE,
                value: Math.floor(enemy.attack * (1.5 + this.chargeLevel * 0.5)),
                isRelease: true
            };
            return;
        }

        // 根据权重随机选择意图
        const totalWeight = pattern.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;

        for (const p of pattern) {
            random -= p.weight;
            if (random <= 0) {
                this.currentIntent = this.createIntent(p.type, enemy);
                return;
            }
        }

        // 默认攻击
        this.currentIntent = { type: EnemyIntentType.ATTACK, value: enemy.attack };
    },

    // 🆕 创建具体意图
    createIntent: function (type, enemy) {
        const baseAttack = enemy.attack;
        const baseHp = enemy.hp;

        switch (type) {
            case 'attack':
                return { type: EnemyIntentType.ATTACK, value: baseAttack };
            case 'defend':
                return { type: EnemyIntentType.DEFEND, value: Math.floor(baseAttack * 0.8) };
            case 'buff':
                return {
                    type: EnemyIntentType.BUFF,
                    value: Math.max(2, Math.floor(baseAttack * 0.2)),
                    buffType: 'attack',
                    duration: 2
                };
            case 'debuff':
                return {
                    type: EnemyIntentType.DEBUFF,
                    value: Math.max(2, Math.floor(baseAttack * 0.15)),
                    debuffType: 'attack',
                    duration: 2
                };
            case 'charge':
                this.chargeLevel = 1;
                return {
                    type: EnemyIntentType.CHARGE,
                    value: Math.floor(baseAttack * 2),
                    isRelease: false
                };
            case 'heal':
                return {
                    type: EnemyIntentType.HEAL,
                    value: Math.max(5, Math.floor(baseHp * 0.1))
                };
            case 'special':
                return {
                    type: EnemyIntentType.SPECIAL,
                    mechanic: enemy.specialMechanic
                };
            default:
                return { type: EnemyIntentType.ATTACK, value: baseAttack };
        }
    },

// 🆕 Lấy HTML hiển thị ý định
    getIntentDisplay: function () {
        const intent = this.currentIntent;
        if (!intent) return '';

        const config = EnemyIntentConfig[intent.type];
        if (!config) return '';

        let valueText = '';
        let extraInfo = '';

        if (intent.type === EnemyIntentType.ATTACK) {
            valueText = ` ${intent.value}`;
        } else if (intent.type === EnemyIntentType.CHARGE) {
            valueText = intent.isRelease ? ` ${intent.value}` : '';
            extraInfo = intent.isRelease ? ' (Giải phóng!)' : ' (Đang tích lực...)';
        } else if (intent.type === EnemyIntentType.DEFEND) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.HEAL) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.BUFF) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.DEBUFF) {
            valueText = ` -${intent.value}`;
        } else if (intent.type === EnemyIntentType.SPECIAL && intent.mechanic) {
            extraInfo = ` (${intent.mechanic.name})`;
        }

        return `
            <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0,0,0,0.5); 
                        border-radius: 6px; border: 1px solid ${config.color}60;
                        display: inline-block;">
                <div style="color: ${config.color}; font-size: 13px; font-weight: bold;">
                    Ý định: ${config.icon} ${config.name}${valueText}${extraInfo}
                </div>
            </div>
        `;
    },

    // Rút bài
    drawCards: function (count) {
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                // Xáo bài
                this.drawPile = [...this.discardPile].sort(() => Math.random() - 0.5);
                this.discardPile = [];
            }
            if (this.drawPile.length > 0) {
                this.hand.push(this.drawPile.pop());
            }
        }
    },

    // 显示战斗UI
    showBattleUI: function () {
        const modal = document.createElement('div');
        modal.id = 'battleModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(25, 18, 15, 0.99) 0%, rgba(15, 10, 8, 1) 50%, rgba(20, 14, 12, 0.99) 100%);
            display: flex; flex-direction: column; z-index: 10000;
            padding: 20px; box-sizing: border-box;
            border: 3px solid #3d2f24;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(139,0,0,0.15);
            font-family: 'Cinzel', 'Microsoft YaHei', serif;overflow-y: auto;
        `;

        modal.innerHTML = this.generateBattleHTML();
        document.body.appendChild(modal);
    },

    // 生成战斗HTML
    generateBattleHTML: function () {
        const enemy = this.currentEnemy;
        const enemyHpPercent = (enemy.currentHp / enemy.hp) * 100;
        const playerHpPercent = (PlayerState.hp / PlayerState.maxHp) * 100;

        // 生成手牌HTML - 克苏鲁风格
        let handHtml = '';
        this.hand.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const isCurse = card.type === CardType.CURSE;
            // 🆕 检查变身需求
            const needsTransform = card.requiresTransform && !this.isTransformed;
            const canPlay = !isCurse && !needsTransform && card.cost <= this.currentEnergy;
            // 🆕 变身卡特殊样式
            const isTransformCard = card.isTransformCard;

            // 🔧 根据卡牌类型显示不同的主要数值
            let mainValue = '';
            if (isCurse) {
                mainValue = card.icon || '💀';
            } else if (card.type === CardType.ATTACK) {
                mainValue = card.value || 0;
            } else if (card.type === CardType.ARMOR) {
                mainValue = '🛡️' + (card.value || 0);
            } else if (card.type === CardType.HEAL) {
                mainValue = '❤️' + (card.value || 0);
            } else if (card.type === CardType.BUFF) {
                // BUFF卡显示效果图标
                if (card.drawCards) mainValue = '📜' + card.drawCards;
                else if (card.gainEnergy) mainValue = '⚡+' + card.gainEnergy;
                else mainValue = '✨';
            } else if (card.type === CardType.DEBUFF) {
                mainValue = '💀-' + (card.value || 0);
            } else {
                mainValue = card.value || '?';
            }

            // 🆕 计算卡牌边框颜色
            let borderColor = canPlay ? '#6b5241' : '#2a1f18';
            let glowColor = canPlay ? '0 0 10px rgba(139,0,0,0.3)' : 'none';
            if (isTransformCard) {
                borderColor = '#ff69b4';
                glowColor = '0 0 15px rgba(255,105,180,0.6)';
            } else if (needsTransform) {
                borderColor = '#ff69b4';
                glowColor = '0 0 10px rgba(255,105,180,0.3)';
            }

            handHtml += `
                <div class="battle-card ${canPlay ? 'playable' : 'disabled'}" 
                     onclick="${canPlay ? `BattleSystem.playCard(${index})` : ''}"
                     style="background: ${isTransformCard ? 'linear-gradient(180deg, rgba(45,25,35,0.95) 0%, rgba(25,15,20,0.98) 100%)' : 'linear-gradient(180deg, rgba(25,18,15,0.95) 0%, rgba(15,10,8,0.98) 100%)'};
                            border: 2px solid ${borderColor}; border-radius: 4px;
                            padding: 12px; width: 100px; cursor: ${canPlay ? 'pointer' : 'not-allowed'};
                            transition: all 0.2s; opacity: ${canPlay ? 1 : (needsTransform ? 0.7 : 0.5)};
                            flex-shrink: 0; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), ${glowColor};"
                     ${canPlay ? `onmouseover="this.style.transform='translateY(-15px)';this.style.boxShadow='inset 0 0 15px rgba(0,0,0,0.5), 0 0 20px ${isTransformCard ? 'rgba(255,105,180,0.8)' : 'rgba(139,0,0,0.5)'}';this.style.borderColor='${isTransformCard ? '#ff1493' : '#8b5a2b'}'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='inset 0 0 15px rgba(0,0,0,0.5), ${glowColor}';this.style.borderColor='${borderColor}'"` : ''}>
                    <div style="color: ${isCurse ? '#8b0000' : (isTransformCard ? '#ff69b4' : '#c9b896')}; font-size: 11px; text-align: right; margin-bottom: 5px;">${isCurse ? '诅咒' : (needsTransform ? '🔒' + card.cost + '⚡' : card.cost + '⚡')}</div>
                    <div style="color: ${isTransformCard || needsTransform ? '#ff69b4' : '#c9b896'}; font-size: 12px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${isCurse ? '#8b0000' : (isTransformCard ? '#ff69b4' : typeColor)}; font-size: 18px; font-weight: bold; margin-bottom: 5px;">${mainValue}</div>
                    <div style="color: ${needsTransform ? '#ff69b4' : '#6b5d4d'}; font-size: 9px; line-height: 1.3; word-break: break-all;">${card.description}</div>
                </div>
            `;
        });


        return `
            <!-- 🔥 打击感动画样式 -->
            <style>
                @keyframes damageFloat {
                    0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -30px) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -60px) scale(0.8); }
                }
                @keyframes battleShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-1 * var(--shake-intensity, 5px))); }
                    20%, 40%, 60%, 80% { transform: translateX(var(--shake-intensity, 5px)); }
                }
                @keyframes hitFlash {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(2) saturate(0.5); background: rgba(255,71,87,0.3); }
                }
                .battle-area-player, .battle-area-enemy {
                    transition: filter 0.1s, background 0.1s;
                }
            </style>
            
            <!-- 顶部信息栏 - 克苏鲁风格 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px 15px; background: linear-gradient(180deg, rgba(139,0,0,0.15) 0%, transparent 100%); border-bottom: 2px solid rgba(139,0,0,0.3); border-radius: 4px;">
                <div style="color: #c9b896; font-size: 18px; font-family: 'Cinzel', serif; text-shadow: 0 0 10px rgba(139,0,0,0.4);">҉ Lượt ${this.turn}</div>
                ${this.isTransformed ? `<div style="color: #ff69b4; font-size: 16px; font-weight: bold; text-shadow: 0 0 15px rgba(255,105,180,0.8); animation: pulse 1s infinite;">✨ Đang biến thân (${this.transformTurnsLeft} lượt) (ﾉ◕ヮ◕)ﾉ</div>` : (PlayerState.profession?.id === 'magicalGirl' ? '<div style="color: #888; font-size: 14px;">Chưa biến thân - Hãy dùng thẻ biến thân!</div>' : '')}
                <div style="color: #c9b896; font-size: 16px; text-shadow: 0 0 10px rgba(139,0,0,0.4);">⚡ ${this.currentEnergy}/${PlayerState.energy}</div>
            </div>

            
            <!-- 战斗区域 -->
            <div style="flex: 1; display: flex; justify-content: space-around; align-items: center;background: url(img/background/bg_001.png); margin-bottom: 20px; padding-top: 10px;">
                <!-- 玩家 -->
                <div id="playerArea" class="battle-area-player" style="text-align: center; min-width: 150px;">
                    ${PlayerState.profession?.icon?.startsWith('img/') ? `<img src="${PlayerState.profession.icon}" style="width: 220px; height: 220px; margin-bottom: 8px; object-fit: contain;" onerror="this.outerHTML='<div style=font-size:50px;margin-bottom:8px;>🧙‍♀️</div>'">` : `<div style="font-size: 50px; margin-bottom: 8px;">${PlayerState.profession?.icon || '🧙‍♀️'}</div>`}
                    <div style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${PlayerState.name}</div>
                    
                    <!-- 玩家血条 -->
                    <div style="width: 140px; height: 14px; background: #333; border-radius: 7px; overflow: hidden; margin: 0 auto 8px;">
                        <div style="width: ${playerHpPercent}%; height: 100%; background: linear-gradient(90deg, #ff4757, #ff6b81); transition: width 0.3s;"></div>
                    </div>
                    <div style="color: #ff6b81; font-size: 13px; font-weight: bold; margin-bottom: 10px;">❤️ ${PlayerState.hp}/${PlayerState.maxHp}</div>
                    
                    <!-- 玩家属性面板 - 克苏鲁风格 -->
                    <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 10px; text-align: left; font-size: 12px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="color: #6b5d4d;">🛡️ Giáp: <span style="color: #c9b896; font-weight: bold;">${this.playerArmor}</span></div>
                            <div style="color: #6b5d4d;">⚔️ Tấn công: <span style="color: #c9b896;">${this.getPlayerEffectiveAttack()}</span></div>
                            <div style="color: #6b5d4d;">🔰 Phòng thủ: <span style="color: #c9b896;">${this.getPlayerEffectiveDefense()}</span></div>
                            <div style="color: #6b5d4d;">💜 Đọa lạc: <span style="color: #8b0000; font-weight: bold;">${PlayerState.corruption}</span></div>
                        </div>
                        ${this.getPlayerBuffDisplay()}
                    </div>
                </div>
                
                <!-- VS -->
                <div style="color: #ff4757; font-size: 28px; font-weight: bold; align-self: center;">⚔️</div>
                
                <!-- 敌人 -->
                <div id="enemyArea" class="battle-area-enemy" style="text-align: center; min-width: 150px;">
                    ${enemy.icon && enemy.icon.startsWith('img/') ? `<img src="${enemy.icon}" style="width: ${enemy.id === 'minghuiMage' ? '580px' : '180px'}; margin-bottom: 8px; object-fit: contain;" onerror="this.outerHTML='<div style=font-size:50px;margin-bottom:8px;>👹</div>'">` : `<div style="font-size: 50px; margin-bottom: 8px;">${enemy.icon}</div>`}
                    <div style="color: ${enemy.type === 'boss' ? '#ff4757' : '#ffa502'}; font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                        ${enemy.type === 'boss' ? '👑 ' : ''}${enemy.name}
                    </div>
                    ${enemy.desc ? `<div style="color: #888; font-size: 10px; margin-bottom: 8px; font-style: italic;">${enemy.desc}</div>` : ''}
                    
                    <!-- 敌人血条 -->
                    <div style="width: 140px; height: 14px; background: #333; border-radius: 7px; overflow: hidden; margin: 0 auto 8px;">
                        <div style="width: ${enemyHpPercent}%; height: 100%; background: linear-gradient(90deg, #ffa502, #ff6348); transition: width 0.3s;"></div>
                    </div>
                    <div style="color: #ffa502; font-size: 13px; font-weight: bold; margin-bottom: 10px;">❤️ ${enemy.currentHp}/${enemy.hp}</div>
                    
                    <!-- 敌人属性面板 - 克苏鲁风格 -->
                    <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 10px; text-align: left; font-size: 12px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="color: #6b5d4d;">🛡️ Giáp: <span style="color: #c9b896; font-weight: bold;">${this.enemyArmor}</span></div>
                            <div style="color: #6b5d4d;">⚔️ Tấn công: <span style="color: #c9b896; font-weight: bold;">${this.getEnemyEffectiveAttack()}</span></div>
                            <div style="color: #6b5d4d;">🔰 Phòng thủ: <span style="color: #c9b896; font-weight: bold;">${this.getEnemyEffectiveDefense()}</span></div>
                        </div>
                        ${this.getEnemyDebuffDisplay()}
                        ${this.getIntentDisplay()}
                    </div>
                </div>
            </div>
            
            <!-- 🔧 玩家特殊状态显示 -->
            ${this.getPlayerStatusDisplay()}
            
            <!-- 手牌区域 - 克苏鲁风格 -->
            <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 15px; margin-bottom: 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
                <div style="color: #6b5d4d; font-size: 12px; margin-bottom: 10px;">҉ Bài trên tay (${this.hand.length}) | Bộ bài còn lại (${this.drawPile.length}) | Chồng bài bỏ (${this.discardPile.length})</div>
                <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
                    ${handHtml || '<div style="color: #6b5d4d; text-align: center; width: 100%;">Không có bài trên tay</div>'}
                </div>
            </div>
            
            <!-- 操作按钮 - 克苏鲁风格 -->
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="BattleSystem.endTurn()" 
                        style="padding: 12px 30px; background: linear-gradient(180deg, #3d2f24 0%, #2a1f18 50%, #1a1310 100%);
                               color: #c9b896; border: 2px solid #6b5241; border-radius: 4px; cursor: pointer; font-size: 14px;
                               font-family: 'Cinzel', serif; box-shadow: inset 0 1px 0 rgba(107,82,65,0.4), 0 0 15px rgba(139,0,0,0.4);
                               text-shadow: 0 1px 2px rgba(0,0,0,0.8); transition: all 0.2s;"
                        onmouseover="this.style.boxShadow='inset 0 1px 0 rgba(139,107,74,0.5), 0 0 25px rgba(139,0,0,0.6)'; this.style.borderColor='#8b5a2b'"
                        onmouseout="this.style.boxShadow='inset 0 1px 0 rgba(107,82,65,0.4), 0 0 15px rgba(139,0,0,0.4)'; this.style.borderColor='#6b5241'">
                    ҉ Kết thúc lượt
                </button>
            </div>
        `;
    },

// Đánh bài
    playCard: function (handIndex) {
        const card = this.hand[handIndex];
        if (!card || card.cost > this.currentEnergy) return;

        // 🔧 Thẻ bài Nguyền rủa không thể đánh ra
        if (card.type === CardType.CURSE) {
            this.addLog(`[Lượt ${this.turn}] ❌ Thẻ Nguyền rủa 【${card.name}】 không thể sử dụng!`);
            return;
        }

        // 🆕 Kiểm tra yêu cầu biến thân của Thiếu nữ Ma pháp
        if (card.requiresTransform && !this.isTransformed) {
            this.addLog(`[Lượt ${this.turn}] ❌ 【${card.name}】 yêu cầu biến thân mới có thể sử dụng! (ﾉ◕ヮ◕)ﾉ`);
            return;
        }

        this.currentEnergy -= card.cost;
        this.hand.splice(handIndex, 1);

        // 🆕 Xử lý thẻ Tiêu tốn (sử dụng xong sẽ không vào chồng bài bỏ)
        if (card.isConsume) {
            this.addLog(`[Lượt ${this.turn}] 🔥 【${card.name}】 đã tiêu tốn, loại bỏ khỏi trận đấu này`);
        } else {
            this.discardPile.push(card);
        }

        // 📝 Ghi log đơn giản: Kỹ năng H ghi chi tiết, kỹ năng thường ghi vắn tắt
        if (card.type === CardType.H_ATTACK) {
            this.addLog(`[Lượt ${this.turn}] 💋 Sử dụng kỹ năng H 【${card.name}】: ${card.description}`);
        } else {
            // Kỹ năng thường không ghi log riêng lẻ, chỉ thống kê
            if (!this.turnActions) this.turnActions = [];
            this.turnActions.push(card.name);
        }

        // Thực thi hiệu ứng thẻ bài
        this.executeCard(card);

        // Kiểm tra trận đấu kết thúc chưa
        if (this.checkBattleEnd()) return;

        // Làm mới giao diện
        this.updateBattleUI();
    },

    // Thực thi hiệu ứng thẻ bài
    executeCard: function (card) {
        // 🆕 Xử lý thẻ Biến thân Thiếu nữ Ma pháp
        if (card.isTransformCard) {
            this.isTransformed = true;
            this.transformTurnsLeft = 2; // Biến thân duy trì 2 lượt
            this.addLog(`[Lượt ${this.turn}] ✨ 【Biến thân!】 Được rồi, bắt đầu làm việc nào! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Biến thân duy trì ${this.transformTurnsLeft} lượt!`);

            // 🆕 Buff Biến thân: Công thủ +5, rút bài +1, năng lượng +1 (duy trì 2 lượt)
            const buffs = [
                { name: 'Sức mạnh Thiếu nữ Ma pháp', buffType: 'attack', value: 5, duration: 2 },
                { name: 'Khiên Thiếu nữ Ma pháp', buffType: 'defense', value: 5, duration: 2 },
                { name: 'Ma lực tràn trề', buffType: 'draw', value: 1, duration: 2 },
                { name: 'Nguồn ma lực', buffType: 'energy', value: 1, duration: 2 }
            ];
            buffs.forEach(b => {
                this.playerBuffs.push({
                    name: b.name,
                    buffType: b.buffType,
                    value: b.value,
                    remainingTurns: b.duration
                });
            });
            this.addLog(`[Biến thân] ✨ Nhận Công thủ +5, Rút bài +1, Năng lượng +1 (duy trì 2 lượt)`);

            this.updateBattleUI();
            return; // Thẻ biến thân chỉ có hiệu ứng biến thân, không thực hiện việc khác
        }

        // 🆕 Xử lý hiệu ứng kéo dài thời gian biến thân
        if (card.extendTransform && this.isTransformed) {
            this.transformTurnsLeft += card.extendTransform;
            this.addLog(`[Lượt ${this.turn}] ✨ Thời gian biến thân kéo dài thêm ${card.extendTransform} lượt! Còn lại ${this.transformTurnsLeft} lượt ♡( ◡‿◡ )`);
        }

        // 🔧 Áp dụng điều chỉnh tấn công từ trạng thái đặc biệt
        let attackMod = this.statusMods?.attack || 0;

        // 🆕 Thưởng sát thương từ thuộc tính nguyền rủa (affix)
        let affixDamageBonus = 1.0;
        if (card.affix && card.affix.effect?.type === 'empower') {
            affixDamageBonus = 1.0 + (card.affix.effect.bonus || 0.5);
        }

        // 🔧 Cộng thêm thưởng tấn công từ playerBuffs (ví dụ: Chiến ý sục sôi)
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'attack') {
                attackMod += b.value;
            }
        });

        const totalAttack = Math.max(0, card.value + PlayerState.attack + attackMod);
        let totalDamageDealt = 0; // Dùng để tính toán Hút sinh mệnh

        switch (card.type) {
            case CardType.ATTACK:
            case CardType.H_ATTACK:
                // 🆕 Áp dụng thưởng sát thương từ thuộc tính
                let damage = Math.floor(totalAttack * affixDamageBonus);

                // 🔧 Thưởng sát thương kỹ năng H (Trạng thái ban đầu + Hiệu ứng cải tạo cơ thể + Thánh di vật) + Đọa lạc +1
                if (card.type === CardType.H_ATTACK) {
                    let hBonus = this.statusMods?.hDamageBonus || 0;
                    const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
                    if (bodyMods.hDamageBonus > 0) hBonus += bodyMods.hDamageBonus;
                    // 🔧 Thưởng sát thương H từ Thánh di vật
                    if (this.relicMods?.hDamageBonus > 0) hBonus += this.relicMods.hDamageBonus;
                    if (hBonus > 0) {
                        damage += hBonus; // Cộng trực tiếp vào chỉ số
                        this.addLog(`[Lượt ${this.turn}] 💗 Sát thương H +${hBonus}`);
                    }
                    // Khi dùng kỹ năng H, điểm đọa lạc +1
                    PlayerState.corruption += 1;
                    PlayerState.save();
                    PlayerState.updateDisplay();
                    this.addLog(`[Lượt ${this.turn}] 💜 Đọa lạc +1 (${PlayerState.corruption})`);
                }

                // 🔧 Áp dụng Debuff phòng thủ của kẻ địch (Trói buộc)
                let enemyDefense = this.currentEnemy.defense || 0;
                this.enemyDebuffs.forEach(d => {
                    if (d.debuffType === 'defense') {
                        enemyDefense = Math.max(0, enemyDefense - d.value);
                    }
                    // 🔧 Hiệu ứng Phòng thủ về 0 (Kiến Long Tạ Giáp)
                    if (d.debuffType === 'defenseZero') {
                        enemyDefense = 0;
                    }
                });
                damage = Math.max(0, damage - enemyDefense);

                let armorAbsorbed = 0;
                if (!card.ignoreArmor && this.enemyArmor > 0) {
                    armorAbsorbed = Math.min(this.enemyArmor, damage);
                    this.enemyArmor -= armorAbsorbed;
                    damage -= armorAbsorbed;
                }
                this.currentEnemy.currentHp -= damage;
                totalDamageDealt += damage;

                // 🔥 Hiển thị hiệu ứng đánh trúng
                if (damage > 0) {
                    this.showHitEffect(damage, damage >= 15);
                }

                // 🔧 Xử lý tấn công nhiều lần (hỗ trợ cả hitCount và hits)
                const hitCount = card.hitCount || card.hits || 1;
                if (hitCount > 1) {
                    for (let i = 1; i < hitCount; i++) {
                        let extraDmg = Math.max(0, totalAttack - enemyDefense);
                        this.currentEnemy.currentHp -= extraDmg;
                        totalDamageDealt += extraDmg;
                    }
                }

                // 🔧 Hiệu ứng sát thương độc/theo thời gian (Hỗ trợ cả hai cách viết poisonDamage/poisonDuration và dotDamage/duration)
                const dotDmg = card.poisonDamage || card.dotDamage;
                const dotDur = card.poisonDuration || card.duration;
                if (dotDmg && dotDur) {
                    this.enemyDebuffs.push({
                        name: 'Sát thương duy trì',
                        debuffType: 'poison',
                        value: dotDmg,
                        remainingTurns: dotDur
                    });
                    this.addLog(`[Lượt ${this.turn}] 🧪 Kẻ địch trúng độc ${dotDmg} sát thương / ${dotDur} lượt`);
                }

                // 🔧 Hiệu ứng Debuff đi kèm thẻ Tấn công/Tấn công H (như giảm công, giảm thủ)
                if (card.debuffType && card.debuffValue && card.debuffDuration) {
                    this.enemyDebuffs.push({
                        name: card.debuffType === 'attack' ? 'Suy yếu tấn công' : (card.debuffType === 'defense' ? 'Suy yếu phòng thủ' : 'Suy yếu'),
                        debuffType: card.debuffType,
                        value: card.debuffValue,
                        remainingTurns: card.debuffDuration
                    });
                    const debuffName = card.debuffType === 'attack' ? 'Tấn công' : (card.debuffType === 'defense' ? 'Phòng thủ' : card.debuffType);
                    this.addLog(`[Lượt ${this.turn}] 💫 Kẻ địch ${debuffName} -${card.debuffValue} (${card.debuffDuration} lượt)`);
                }

                // 🔧 Hiệu ứng Phòng thủ về 0 (Kiến Long Tạ Giáp)
                if (card.debuffType === 'defenseZero' && card.debuffDuration) {
                    this.enemyDebuffs.push({
                        name: 'Phòng thủ về 0',
                        debuffType: 'defenseZero',
                        value: 999, // Dùng để đánh dấu phòng thủ về 0
                        remainingTurns: card.debuffDuration
                    });
                    this.addLog(`[Lượt ${this.turn}] 💋 Phòng thủ kẻ địch về 0! (${card.debuffDuration} lượt)`);
                }

                // 🔧 Hút sinh mệnh (Hiệu ứng Thánh di vật)
                if (this.relicMods?.lifesteal > 0 && totalDamageDealt > 0) {
                    const heal = this.relicMods.lifesteal;
                    PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + heal);
                    this.addLog(`[Lượt ${this.turn}] 🦷 Hút sinh mệnh +${heal} HP`);
                }
                // 🔧 Thẻ Tấn công/Tấn công H cũng có thể đi kèm giáp (ví dụ: Lời cầu nguyện cấm kỵ)
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                    this.addLog(`[Lượt ${this.turn}] 🛡️ Nhận Giáp +${card.armorGain}`);
                }
                break;

            case CardType.HEAL:
                let healAmount = card.value;
                // 🔧 Thưởng trị liệu (Hiệu ứng Thánh di vật)
                if (this.relicMods?.healBonus > 0) {
                    healAmount += this.relicMods.healBonus;
                }
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + healAmount);
                // 🔧 Thẻ Trị liệu cũng có thể đi kèm giáp
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                    this.addLog(`[Lượt ${this.turn}] 🛡️ Giáp cộng thêm +${card.armorGain}`);
                }
                break;

            case CardType.ARMOR:
                this.playerArmor += card.value;
                // 🔧 Giáp phản sát thương
                if (card.reflect) {
                    this.playerBuffs.push({
                        name: 'Phản sát thương',
                        buffType: 'reflect',
                        value: card.reflect,
                        remainingTurns: 1
                    });
                    this.addLog(`[Lượt ${this.turn}] 🪞 Phản sát thương ${card.reflect} đã kích hoạt`);
                }
                break;

            case CardType.BUFF:
                this.playerBuffs.push({ ...card, remainingTurns: card.duration || 1 });
                // 🔧 Thẻ Buff cũng có thể đi kèm giáp
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                }
                // 🔧 Buff loại draw sẽ rút bài ngay lập tức
                if (card.buffType === 'draw' && card.value > 0) {
                    this.drawCards(card.value);
                    this.addLog(`[Lượt ${this.turn}] 🃏 Rút thêm ${card.value} lá bài`);
                }
                break;

            case CardType.DEBUFF:
                this.enemyDebuffs.push({ ...card, remainingTurns: card.duration || 1 });
                // 🔧 Thẻ Debuff cũng có thể đi kèm giáp
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                }
                break;
        }

        // 🔧 Chung: Rút bài sau khi gây sát thương
        if (card.drawCards && card.drawCards > 0) {
            this.drawCards(card.drawCards);
            this.addLog(`[Lượt ${this.turn}] 🃏 Rút ${card.drawCards} lá bài`);
        }

        // 🔧 Chung: Nhận năng lượng (ví dụ: Trí tuệ Bí thuật)
        if (card.gainEnergy && card.gainEnergy > 0) {
            this.currentEnergy += card.gainEnergy;
            console.log('[Trận đấu] Thay đổi năng lượng:', this.currentEnergy - card.gainEnergy, '+', card.gainEnergy, '=', this.currentEnergy);
            this.addLog(`[Lượt ${this.turn}] ⚡ Năng lượng +${card.gainEnergy} (Hiện tại: ${this.currentEnergy})`);
        }

        // 🔧 Chung: Nhận vàng (ví dụ: Nhặt nhạnh)
        if (card.goldGain && card.goldGain > 0) {
            PlayerState.gold += card.goldGain;
            PlayerState.save();
            PlayerState.updateDisplay();
            this.addLog(`[Lượt ${this.turn}] 💰 Vàng +${card.goldGain} (Hiện tại: ${PlayerState.gold})`);
        }

        // 🔧 Chung: Tự hồi phục (ví dụ: Phán quyết Thánh quang, kỹ năng Mị ma, v.v.)
        if (card.healSelf && card.healSelf > 0) {
            const healAmount = card.healSelf;
            PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + healAmount);
            PlayerState.save();
            this.addLog(`[Lượt ${this.turn}] 💚 Khôi phục ${healAmount} HP (Hiện tại: ${PlayerState.hp}/${PlayerState.maxHp})`);
            this.showHealEffect(healAmount, true);
        }

        // 🆕 Áp dụng hiệu ứng thuộc tính (affix) của thẻ bài
        if (card.affix) {
            this.applyCardAffix(card, totalDamageDealt);
        }
    },

    // Kết thúc lượt
    endTurn: function () {
        // 🔧 Xử lý sát thương độc (trước khi kẻ địch hành động)
        let poisonDamage = 0;
        this.enemyDebuffs.forEach(d => {
            if (d.debuffType === 'poison') {
                poisonDamage += d.value;
            }
        });
        if (poisonDamage > 0) {
            this.currentEnemy.currentHp -= poisonDamage;
            this.addLog(`[Lượt ${this.turn}] 🧪 Độc tính gây ra ${poisonDamage} điểm sát thương`);
        }

        // Kiểm tra kẻ địch đã chết chưa
        if (this.checkBattleEnd()) return;

        // Lượt của kẻ địch
        this.enemyTurn();

        // Kiểm tra trận đấu kết thúc chưa
        if (this.checkBattleEnd()) return;

        // 🔧 Tổng hợp các kỹ năng thường đã sử dụng trong lượt này
        if (this.turnActions && this.turnActions.length > 0) {
            const actionSummary = this.turnActions.join('、');
            this.addLog(`[Lượt ${this.turn}] ⚔️ Đã sử dụng: ${actionSummary}`);
            this.turnActions = []; // Xóa trắng
        }

        // Lượt mới
        this.turn++;
        this.currentEnergy = PlayerState.energy;
        // 🆕 Thưởng năng lượng từ Buff
        this.playerBuffs.forEach(b => {
            if (b.buffType === 'energy' && b.value > 0) {
                this.currentEnergy += b.value;
                // this.addLog(`[Lượt ${this.turn}] ⚡ Năng lượng cộng thêm +${b.value}`); // Log tùy chọn
            }
        });
        this.playerArmor = 0; // Giáp người chơi reset mỗi lượt
        this.enemyArmor = 0;  // 🔧 Giáp kẻ địch cũng reset mỗi lượt

        // 🆕 Xử lý lượt biến thân của Thiếu nữ Ma pháp
        if (this.isTransformed) {
            this.transformTurnsLeft--;
            if (this.transformTurnsLeft <= 0) {
                // Hết thời gian biến thân, xử thua
                this.isTransformed = false;
                this.addLog(`[Lượt ${this.turn}] 💔 Biến thân kết thúc, kiệt sức ngã xuống... (´;ω;｀)`);
                this.battleLog.push(`--- Kết quả trận đấu: Thất bại ---`);
                this.battleLog.push(`Thời gian biến thân đã hết, Thiếu nữ Ma pháp kiệt sức ngã xuống`);
                this.transformDefeat();
                return;
            } else {
                this.addLog(`[Lượt ${this.turn}] ✨ Biến thân còn lại ${this.transformTurnsLeft} lượt (ﾉ◕ヮ◕)ﾉ`);
            }
        }

        // 🔧 Hồi HP mỗi lượt (Hiệu ứng trạng thái ban đầu)
        let hpRegen = this.statusMods?.hpPerTurn || 0;
        // Cộng thêm hiệu ứng cải tạo cơ thể
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.hpPerTurn > 0) hpRegen += bodyMods.hpPerTurn;

        if (hpRegen > 0) {
            PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + hpRegen);
            this.addLog(`[Lượt ${this.turn}] ♻️ Khôi phục mỗi lượt +${hpRegen} HP`);
            this.showHealEffect(hpRegen, true); // 🔥 Hiển thị hiệu ứng hồi máu
        }

        // 🔧 Rút bài (Cơ bản 2 lá + Thưởng Thánh di vật + Thưởng draw buff)
        let drawCount = 2;
        // Thưởng từ draw buff
        this.playerBuffs.forEach(b => {
            if (b.buffType === 'draw' && b.value > 0) {
                drawCount += b.value;
            }
        });
        if (this.relicMods?.drawBonus > 0) {
            drawCount += this.relicMods.drawBonus;
        }
        this.drawCards(drawCount);

        // 🔧 Kiểm tra giới hạn bài trên tay: Quá 8 lá cần phải bỏ bớt
        const MAX_HAND_SIZE = 8;
        if (this.hand.length > MAX_HAND_SIZE) {
            const discardCount = this.hand.length - MAX_HAND_SIZE;
            // Không ghi vào battle log, giao diện bỏ bài sẽ thông báo trực tiếp cho người chơi
            this.showDiscardSelection(discardCount);
            return; // Chờ người chơi chọn bài bỏ rồi mới tiếp tục
        }

        // Cập nhật Buff/Debuff
        this.updateBuffs();

        // Làm mới giao diện
        this.updateBattleUI();
    },

    // 🆕 Hiển thị giao diện chọn bài bỏ
    showDiscardSelection: function (discardCount) {
        this.pendingDiscardCount = discardCount;
        this.selectedDiscards = [];

        // Tạo giao diện chọn bài bỏ
        const modal = document.createElement('div');
        modal.id = 'discardSelectionModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 10100; padding: 20px; box-sizing: border-box;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(180deg, rgba(50, 35, 25, 0.98) 0%, rgba(30, 20, 15, 0.99) 100%);
                        border: 2px solid #8b4513; border-radius: 12px; padding: 20px; max-width: 90%; max-height: 80vh;
                        box-shadow: 0 0 30px rgba(139, 69, 19, 0.5);">
                <h3 style="color: #ffd700; text-align: center; margin-bottom: 15px; font-size: 18px;">
                    ⚠️ Bài trên tay vượt quá giới hạn! Vui lòng chọn <span style="color: #ff4757;">${discardCount}</span> lá để bỏ
                </h3>
                <div style="color: #aaa; text-align: center; margin-bottom: 15px; font-size: 12px;">
                    Đã chọn: <span id="discardSelectedCount" style="color: #ff4757;">0</span> / ${discardCount}
                </div>
                <div id="discardCardContainer" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; 
                            max-height: 50vh; overflow-y: auto; padding: 10px;">
                    ${this.generateDiscardCardHTML()}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                    <button id="confirmDiscardBtn" onclick="BattleSystem.confirmDiscard()" 
                            style="padding: 10px 30px; background: #444; color: #666; border: 2px solid #666;
                                   border-radius: 8px; cursor: not-allowed; font-size: 14px; font-weight: bold;"
                            disabled>
                        Xác nhận bỏ bài
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

// Tạo HTML hiển thị thẻ bài chọn bỏ
    generateDiscardCardHTML: function () {
        let html = '';
        this.hand.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            html += `
                <div class="discard-card-option" data-index="${index}"
                     onclick="BattleSystem.toggleDiscardCard(${index})"
                     style="width: 100px; padding: 10px; background: linear-gradient(180deg, rgba(40, 30, 25, 0.95) 0%, rgba(25, 18, 15, 0.98) 100%);
                            border: 2px solid ${typeColor}; border-radius: 8px; cursor: pointer; text-align: center;
                            transition: all 0.2s ease;">
                    <div style="color: #c9b896; font-size: 11px; margin-bottom: 5px;">[${card.cost || 0} phí]</div>
                    <div style="color: #ddd; font-weight: bold; font-size: 13px; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 20px; margin-bottom: 5px;">
                        ${card.type === CardType.ATTACK || card.type === CardType.H_ATTACK ? card.value || 0 :
                    card.type === CardType.ARMOR ? '🛡️' + (card.value || 0) :
                        card.type === CardType.HEAL ? '❤️' + (card.value || 0) : '✨'}
                    </div>
                    <div style="color: #999; font-size: 10px; line-height: 1.3; max-height: 40px; overflow: hidden;">
                        ${card.description || ''}
                    </div>
                </div>
            `;
        });
        return html;
    },

    // Chuyển đổi trạng thái chọn thẻ bài bỏ
    toggleDiscardCard: function (index) {
        const cardEl = document.querySelector(`.discard-card-option[data-index="${index}"]`);
        if (!cardEl) return;

        const isSelected = this.selectedDiscards.includes(index);

        if (isSelected) {
            // Hủy chọn
            this.selectedDiscards = this.selectedDiscards.filter(i => i !== index);
            cardEl.style.border = `2px solid ${CardTypeColors[this.hand[index].type] || '#666'}`;
            cardEl.style.background = 'linear-gradient(180deg, rgba(40, 30, 25, 0.95) 0%, rgba(25, 18, 15, 0.98) 100%)';
            cardEl.style.transform = 'scale(1)';
        } else {
            // Thêm vào danh sách chọn (nếu chưa đạt giới hạn)
            if (this.selectedDiscards.length < this.pendingDiscardCount) {
                this.selectedDiscards.push(index);
                cardEl.style.border = '3px solid #ff4757';
                cardEl.style.background = 'linear-gradient(180deg, rgba(100, 30, 30, 0.95) 0%, rgba(60, 20, 20, 0.98) 100%)';
                cardEl.style.transform = 'scale(1.05)';
            }
        }

        // Cập nhật số lượng chọn và trạng thái nút bấm
        const countEl = document.getElementById('discardSelectedCount');
        const confirmBtn = document.getElementById('confirmDiscardBtn');
        if (countEl) countEl.textContent = this.selectedDiscards.length;

        if (confirmBtn) {
            if (this.selectedDiscards.length === this.pendingDiscardCount) {
                confirmBtn.disabled = false;
                confirmBtn.style.background = 'linear-gradient(180deg, #8b4513 0%, #654321 100%)';
                confirmBtn.style.color = '#ffd700';
                confirmBtn.style.borderColor = '#ffd700';
                confirmBtn.style.cursor = 'pointer';
            } else {
                confirmBtn.disabled = true;
                confirmBtn.style.background = '#444';
                confirmBtn.style.color = '#666';
                confirmBtn.style.borderColor = '#666';
                confirmBtn.style.cursor = 'not-allowed';
            }
        }
    },

    // Xác nhận bỏ bài
    confirmDiscard: function () {
        if (this.selectedDiscards.length !== this.pendingDiscardCount) return;

        // Sắp xếp chỉ số từ lớn đến nhỏ để tránh bị sai lệch chỉ số khi xóa
        const sortedIndices = [...this.selectedDiscards].sort((a, b) => b - a);

        // Chuyển các lá bài đã chọn vào chồng bài bỏ
        sortedIndices.forEach(index => {
            const discardedCard = this.hand.splice(index, 1)[0];
            this.discardPile.push(discardedCard);
            this.addLog(`[Lượt ${this.turn}] 🗑️ Đã bỏ lá ${discardedCard.name}`);
        });

        // Đóng giao diện chọn bài bỏ
        const modal = document.getElementById('discardSelectionModal');
        if (modal) modal.remove();

        // Dọn dẹp trạng thái
        this.pendingDiscardCount = 0;
        this.selectedDiscards = [];

        // Tiếp tục tiến trình lượt đấu
        this.updateBuffs();
        this.updateBattleUI();
    },

    // Lượt của kẻ địch (dựa trên hệ thống ý định)
    enemyTurn: function () {
        // 🔧 Kiểm tra xem có bị đóng băng/nhảy lượt không
        const skipDebuff = this.enemyDebuffs.find(d => d.debuffType === 'skip' || d.debuffType === 'freeze');
        if (skipDebuff) {
            this.addLog(`[Lượt ${this.turn}] ❄️ ${this.currentEnemy.name} bị đóng băng, nhảy qua lượt`);
            this.generateNextIntent();
            return;
        }

        // 🆕 Xử lý các cơ chế đặc biệt của Boss kích hoạt mỗi lượt
        this.processBossMechanics();

        // 🆕 Vật triệu hồi tấn công
        this.processMinionsAttack();

        const intent = this.currentIntent;
        if (!intent) {
            // Nếu không có ý định, mặc định là tấn công
            this.executeEnemyAttack(this.currentEnemy.attack);
            this.generateNextIntent();
            return;
        }

        // 🆕 Thực hiện hành động theo loại ý định
        switch (intent.type) {
            case EnemyIntentType.ATTACK:
                this.executeEnemyAttack(intent.value);
                break;

            case EnemyIntentType.DEFEND:
                this.enemyArmor += intent.value;
                this.addLog(`[Lượt ${this.turn}] 🛡️ ${this.currentEnemy.name} vào thế phòng ngự, giáp +${intent.value}`);
                break;

            case EnemyIntentType.BUFF:
                this.enemyBuffs.push({
                    name: 'Cuồng bạo',
                    buffType: intent.buffType || 'attack',
                    value: intent.value,
                    remainingTurns: intent.duration || 2
                });
                this.addLog(`[Lượt ${this.turn}] 💪 ${this.currentEnemy.name} cường hóa bản thân, tấn công +${intent.value} (${intent.duration} lượt)`);
                break;

            case EnemyIntentType.DEBUFF:
                this.playerDebuffs.push({
                    name: 'Suy yếu',
                    debuffType: intent.debuffType || 'attack',
                    value: intent.value,
                    remainingTurns: intent.duration || 2
                });
                this.addLog(`[Lượt ${this.turn}] 💫 Bạn bị suy yếu, ${intent.debuffType === 'defense' ? 'phòng thủ' : 'tấn công'} -${intent.value} (${intent.duration} lượt)`);
                break;

            case EnemyIntentType.CHARGE:
                if (intent.isRelease) {
                    // Giải phóng tích lực - gây sát thương lớn
                    this.addLog(`[Lượt ${this.turn}] 🔥 ${this.currentEnemy.name} giải phóng đòn tích lực!`);
                    this.executeEnemyAttack(intent.value);
                    this.chargeLevel = 0;
                } else {
                    // Bắt đầu tích lực
                    this.addLog(`[Lượt ${this.turn}] 🔥 ${this.currentEnemy.name} bắt đầu tích lực, lượt sau sẽ tung tuyệt chiêu!`);
                }
                break;

            case EnemyIntentType.HEAL:
                const healAmount = Math.min(intent.value, this.currentEnemy.hp - this.currentEnemy.currentHp);
                this.currentEnemy.currentHp += healAmount;
                this.addLog(`[Lượt ${this.turn}] ❤️ ${this.currentEnemy.name} hồi phục ${healAmount} điểm sinh mệnh`);
                break;

            case EnemyIntentType.SPECIAL:
                this.executeSpecialMechanic(intent.mechanic);
                break;

            default:
                this.executeEnemyAttack(this.currentEnemy.attack);
        }

        // 🔧 Kẻ địch giải phóng kỹ năng H (Thẻ Nguyền rủa)
        this.enemyHSkill();

        // 🆕 Tạo ý định cho lượt sau
        this.generateNextIntent();
    },

    // 🆕 Thực thi tấn công của kẻ địch (tách ra để tái sử dụng)
    executeEnemyAttack: function (baseDamage) {
        let damage = baseDamage;

        // Áp dụng thưởng từ buff của kẻ địch
        (this.enemyBuffs || []).forEach(buff => {
            if (buff.buffType === 'attack') {
                damage += buff.value;
            }
        });

        // 🔧 Kiểm tra tỷ lệ chính xác (Mù)
        const accuracyDebuff = this.enemyDebuffs.find(d => d.debuffType === 'accuracy');
        if (accuracyDebuff) {
            const hitChance = 100 - accuracyDebuff.value;
            if (Math.random() * 100 > hitChance) {
                this.addLog(`[Lượt ${this.turn}] 💨 Đòn tấn công của kẻ địch bị hụt`);
                return;
            }
        }

        // Áp dụng debuff giảm công
        this.enemyDebuffs.forEach(debuff => {
            if (debuff.debuffType === 'attack') {
                damage = Math.max(0, damage - debuff.value);
            }
        });

        // 🔧 Áp dụng hiệu ứng trạng thái ban đầu: Giảm tấn công kẻ địch
        if (this.statusMods?.enemyAttackReduce > 0) {
            damage = Math.max(0, damage - this.statusMods.enemyAttackReduce);
        }

        // 🔧 Áp dụng hiệu ứng cải tạo cơ thể: Giảm tấn công kẻ địch
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.enemyAttackReduce > 0) {
            damage = Math.max(0, damage - bodyMods.enemyAttackReduce);
        }

        // Tính toán hấp thụ của giáp
        if (this.playerArmor > 0) {
            const absorbed = Math.min(this.playerArmor, damage);
            this.playerArmor -= absorbed;
            damage -= absorbed;
        }

        // 🔧 Áp dụng phòng thủ của người chơi
        let defenseMod = this.statusMods?.defense || 0;
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') {
                defenseMod += b.value;
            }
        });
        // Áp dụng debuff giảm thủ của người chơi
        (this.playerDebuffs || []).forEach(d => {
            if (d.debuffType === 'defense') {
                defenseMod -= d.value;
            }
        });
        const defenseWithMod = Math.max(0, PlayerState.defense + defenseMod);
        damage = Math.max(0, damage - defenseWithMod);

        // 🔧 Áp dụng tăng sát thương nhận vào từ trạng thái đặc biệt
        if (this.statusMods?.damageTaken > 0) {
            damage = Math.floor(damage * (1 + this.statusMods.damageTaken / 100));
        }

        // 🔧 Áp dụng tăng sát thương nhận vào từ cải tạo cơ thể
        if (bodyMods.damageTaken > 0) {
            damage = Math.floor(damage * (1 + bodyMods.damageTaken / 100));
        }

        // 🔧 Xử lý phản sát thương
        let reflectDamage = this.relicMods?.reflect || 0;
        const reflectBuff = this.playerBuffs.find(b => b.buffType === 'reflect');
        if (reflectBuff) {
            reflectDamage += reflectBuff.value;
        }
        if (reflectDamage > 0 && damage > 0) {
            this.currentEnemy.currentHp -= reflectDamage;
            this.addLog(`[Lượt ${this.turn}] 🪞 Phản sát thương ${reflectDamage} điểm`);
        }

        PlayerState.hp -= damage;

        // 🔥 Hiển thị hiệu ứng người chơi bị trúng đòn
        if (damage > 0) {
            this.showPlayerHitEffect(damage);
        }

        // 🔧 Cơ chế hút máu của Boss
        const mech = this.currentEnemy.specialMechanic;
        if (mech && mech.trigger === 'onAttack' && mech.effect?.healPercent > 0) {
            const healAmount = Math.floor(damage * mech.effect.healPercent);
            if (healAmount > 0) {
                this.currentEnemy.currentHp = Math.min(this.currentEnemy.hp, this.currentEnemy.currentHp + healAmount);
                this.addLog(`[Lượt ${this.turn}] 🩸 ${mech.name} hồi phục ${healAmount} HP`);
            }
        }

        // 🔧 Hồi HP khi bị trúng đòn (Trạng thái ban đầu + Cải tạo cơ thể)
        if (damage > 0) {
            let hpOnHit = this.statusMods?.hpOnHit || 0;
            if (bodyMods.hpOnHit > 0) hpOnHit += bodyMods.hpOnHit;
            if (hpOnHit > 0) {
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + hpOnHit);
                this.addLog(`[Lượt ${this.turn}] 😵 Khôi phục do bị hành hạ +${hpOnHit} HP`);
            }
        }
    },

    // 🆕 Xử lý cơ chế đặc biệt của Boss
    processBossMechanics: function () {
        const mech = this.currentEnemy.specialMechanic;
        if (!mech) return;

        // Khởi tạo thời gian hồi (cooldown)
        if (this.mechanicCooldowns[mech.id] === undefined) {
            this.mechanicCooldowns[mech.id] = 0;
        }

        // Kích hoạt theo lượt hồi
        if (mech.trigger === 'turnCooldown') {
            this.mechanicCooldowns[mech.id]++;
            if (this.mechanicCooldowns[mech.id] >= mech.cooldown) {
                this.executeSpecialMechanic(mech);
                this.mechanicCooldowns[mech.id] = 0;
            }
        }
        // Kích hoạt mỗi lượt
        else if (mech.trigger === 'everyTurn') {
            this.executeSpecialMechanic(mech);
        }
        // Kích hoạt theo lượng máu
        else if (mech.trigger === 'hpBelow50' && !this.currentEnemy.mechanicTriggered50) {
            if (this.currentEnemy.currentHp <= this.currentEnemy.hp * 0.5) {
                this.currentEnemy.mechanicTriggered50 = true;
                this.executeSpecialMechanic(mech);
            }
        }
        else if (mech.trigger === 'hpBelow30' && !this.currentEnemy.mechanicTriggered30) {
            if (this.currentEnemy.currentHp <= this.currentEnemy.hp * 0.3) {
                this.currentEnemy.mechanicTriggered30 = true;
                this.executeSpecialMechanic(mech);
            }
        }
    },

    // 🆕 Thực thi cơ chế đặc biệt của Boss
    executeSpecialMechanic: function (mech) {
        if (!mech || !mech.effect) return;

        const effect = mech.effect;

        switch (mech.id) {
            case 'charm': // Mê hoặc: Ngẫu nhiên đánh ra thẻ trên tay người chơi
                if (this.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.hand.length);
                    const card = this.hand[randomIndex];
                    this.addLog(`[Lượt ${this.turn}] 💋 ${mech.name} kích hoạt! Bạn không tự chủ được mà sử dụng lá 【${card.name}】`);
                    // Ép buộc sử dụng (không tiêu tốn năng lượng)
                    this.currentEnergy += card.cost; // Bù lại năng lượng tiêu hao
                    this.playCard(randomIndex);
                }
                break;

            case 'bind': // Trói buộc: Khóa thẻ bài trên tay
                if (this.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.hand.length);
                    const card = this.hand[randomIndex];
                    if (!card.locked) {
                        card.locked = true;
                        card.lockedTurns = effect.duration || 2;
                        this.addLog(`[Lượt ${this.turn}] 🐙 ${mech.name} kích hoạt! Lá 【${card.name}】 bị khóa trong ${card.lockedTurns} lượt`);
                    }
                }
                break;

            case 'spawn': // Triệu hồi
                this.minions.push({
                    name: 'Xúc tu non',
                    hp: effect.minionHp || 15,
                    attack: effect.minionAttack || 5,
                    icon: '🐙'
                });
                this.addLog(`[Lượt ${this.turn}] 🌱 ${mech.name} kích hoạt! Triệu hồi một Xúc tu non`);
                break;

            case 'enrage': // Cuồng bạo
                if (effect.attackBonus > 0) {
                    const bonus = Math.floor(this.currentEnemy.attack * effect.attackBonus);
                    this.currentEnemy.attack += bonus;
                    this.addLog(`[Lượt ${this.turn}] 🔥 ${mech.name} kích hoạt! ${this.currentEnemy.name} vào trạng thái cuồng bạo, tấn công +${bonus}!`);
                }
                break;

            case 'dragonBreath': // Long tức
                if (effect.damageMultiplier > 0) {
                    const breathDamage = Math.floor(this.currentEnemy.attack * effect.damageMultiplier);
                    this.addLog(`[Lượt ${this.turn}] 🔥 ${mech.name} kích hoạt! Gây ra ${breathDamage} điểm sát thương!`);
                    this.executeEnemyAttack(breathDamage);
                }
                break;

            case 'corruptionAura': // Hào quang đọa lạc (Xử lý khi trúng đòn - onHit)
                break;

            case 'divineJudgment': // Thánh phán
                if (effect.fixedDamage > 0) {
                    PlayerState.hp -= effect.fixedDamage;
                    this.addLog(`[Lượt ${this.turn}] ✝️ ${mech.name} kích hoạt! Gây ra ${effect.fixedDamage} điểm sát thương cố định!`);
                    this.showPlayerHitEffect(effect.fixedDamage);
                }
                break;

            case 'ancientRoar': // Tiếng gầm cổ đại
                this.isSilenced = true;
                this.addLog(`[Lượt ${this.turn}] 📢 ${mech.name} kích hoạt! Bạn bị kinh động, lượt sau không thể sử dụng thẻ bài!`);
                break;

            case 'regeneration': // Tái sinh tự nhiên
                const healAmount = Math.floor(this.currentEnemy.hp * (effect.healPercent || 0.05));
                this.currentEnemy.currentHp = Math.min(this.currentEnemy.hp, this.currentEnemy.currentHp + healAmount);
                this.addLog(`[Lượt ${this.turn}] 🌿 ${mech.name} kích hoạt! Hồi phục ${healAmount} HP`);
                break;

            case 'webTrap': // Bẫy tơ nhện
                this.drawReduction = effect.value || 2;
                this.addLog(`[Lượt ${this.turn}] 🕸️ ${mech.name} kích hoạt! Lượt sau rút bài -${this.drawReduction}`);
                break;

            case 'voidRift': // Khe nứt hư không
                if (Math.random() < (effect.chance || 0.2) && this.discardPile.length > 0) {
                    const removedCard = this.discardPile.splice(Math.floor(Math.random() * this.discardPile.length), 1)[0];
                    this.addLog(`[Lượt ${this.turn}] 🌀 ${mech.name} kích hoạt! Lá 【${removedCard.name}】 bị hư không nuốt chửng!`);
                }
                break;

            case 'lifeSteal': // Hút sinh mệnh (Xử lý khi tấn công)
                break;
        }
    },

    // 🆕 Xử lý vật triệu hồi tấn công
    processMinionsAttack: function () {
        if (!this.minions || this.minions.length === 0) return;

        this.minions.forEach((minion, index) => {
            if (minion.hp > 0) {
                const damage = Math.max(0, minion.attack - PlayerState.defense);
                PlayerState.hp -= damage;
                this.addLog(`[Lượt ${this.turn}] ${minion.icon} ${minion.name} tấn công, gây ra ${damage} điểm sát thương`);
            }
        });

        // Loại bỏ vật triệu hồi đã chết
        this.minions = this.minions.filter(m => m.hp > 0);
    },

    // Kẻ địch giải phóng kỹ năng H
    enemyHSkill: function () {
        // 🔧 Mỗi lượt có 15% tỷ lệ giải phóng kỹ năng H
        if (Math.random() > 0.15) return;

        // Ngẫu nhiên chọn một thẻ nguyền rủa
        const curseCard = CurseCardLibrary[Math.floor(Math.random() * CurseCardLibrary.length)];
        if (!curseCard) return;

        // Tính toán sát thương nguyền rủa (Nguyền rủa là tấn công ma pháp, giáp chỉ chặn được một nửa)
        let curseDamage = curseCard.damage;

        // Giáp chỉ hấp thụ được một nửa sát thương nguyền rủa
        if (this.playerArmor > 0) {
            const maxAbsorb = Math.floor(curseDamage / 2);
            const absorbed = Math.min(this.playerArmor, maxAbsorb);
            this.playerArmor -= absorbed;
            curseDamage -= absorbed;
        }

        // Giảm sát thương từ phòng thủ (Nguyền rủa xuyên 50% phòng thủ)
        let defenseMod = this.statusMods?.defense || 0;
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') defenseMod += b.value;
        });
        const defenseWithMod = Math.floor((PlayerState.defense + defenseMod) / 2);
        curseDamage = Math.max(0, curseDamage - defenseWithMod);

        // Gây sát thương
        PlayerState.hp -= curseDamage;

        // 🔥 Hiệu ứng sát thương nguyền rủa (Kỹ xảo màu tím)
        if (curseDamage > 0) {
            this.showDamageNumber(curseDamage, true, false, false);
            this.shakeScreen(5);
        }

        // Lấy mô tả chi tiết
        const statusConfig = SpecialStatusConfig[curseCard.statusId];
        const fullDesc = statusConfig?.fullDesc || curseCard.description;

        // Ghi log trận đấu - Hiển thị chi tiết hiệu ứng nguyền rủa
        this.addLog(`[Lượt ${this.turn}] ${curseCard.icon} Kẻ địch giải phóng nguyền rủa 【${curseCard.name}】`);

        // 🔧 Cho dù sát thương bằng 0, vẫn có 50% tỷ lệ có hiệu lực (Nguyền rủa là hiệu ứng ma pháp)
        const curseSucceeds = curseDamage > 0 || Math.random() < 0.5;
        if (curseSucceeds) {
            const newCurseCard = { ...curseCard, cost: 999 }; // Đặt phí cực cao để ngăn người chơi đánh ra

            // Thêm vào bài trên tay hiện tại
            this.hand.push(newCurseCard);

            // Thêm vào bộ bài
            CardDeckManager.deck.push({ ...newCurseCard });
            saveCardDeck();
            CardDeckManager.renderDeck(); // 🔧 Làm mới hiển thị bộ bài

            // Thêm hiệu ứng trạng thái đặc biệt
            SpecialStatusManager.add(curseCard.statusId);

            // 🔧 Hiển thị chi tiết hiệu ứng nguyền rủa
            this.addLog(`[Lượt ${this.turn}] 💀 Đã trúng nguyền rủa! ${fullDesc}`);
        } else {
            this.addLog(`[Lượt ${this.turn}] 🛡️ Đã đỡ hoàn toàn! Lời nguyền không có hiệu lực`);
        }
    },

    // Cập nhật Buff/Debuff
    updateBuffs: function () {
        this.playerBuffs = this.playerBuffs.filter(b => {
            b.remainingTurns--;
            return b.remainingTurns > 0;
        });

        // 🔧 Cập nhật buff kẻ địch (như Cuồng bạo)
        this.enemyBuffs = (this.enemyBuffs || []).filter(b => {
            b.remainingTurns--;
            return b.remainingTurns > 0;
        });

        // 🔧 Cập nhật debuff người chơi (như Suy yếu)
        this.playerDebuffs = (this.playerDebuffs || []).filter(d => {
            d.remainingTurns--;
            return d.remainingTurns > 0;
        });

        this.enemyDebuffs = this.enemyDebuffs.filter(d => {
            d.remainingTurns--;
            // Sát thương duy trì (DOT - không ghi log)
            if (d.debuffType === 'dot' && d.remainingTurns >= 0) {
                // 🔧 Sửa lỗi: Loại DOT dùng trường dotDamage thay vì value
                const dotDmg = d.dotDamage || d.value || 0;
                this.currentEnemy.currentHp -= dotDmg;
            }
            return d.remainingTurns > 0;
        });
    },

    // Kiểm tra trận đấu kết thúc chưa
    checkBattleEnd: function () {
        if (this.currentEnemy.currentHp <= 0) {
            this.victory();
            return true;
        }
        if (PlayerState.hp <= 0) {
            this.defeat();
            return true;
        }
        return false;
    },

    // Chiến thắng
    victory: function () {
        // 🔧 Sửa lỗi: Trước khi kết thúc, tổng hợp các kỹ năng chưa ghi log trong lượt này (Giải quyết vấn đề kết liễu trong 1 lượt không ghi log)
        if (this.turnActions && this.turnActions.length > 0) {
            this.turnActions.forEach(actionName => {
                this.addLog(`Sử dụng [${actionName}]`);
            });
            this.turnActions = []; // Xóa trắng
        }

        // 🔧 Tính toán phần thưởng vàng cơ bản và áp dụng thưởng từ Thánh di vật
        let baseReward = this.currentEnemy.type === 'boss' ? 100 : (this.currentEnemy.type === 'elite' ? 50 : 25);
        // Áp dụng thưởng vàng từ Thánh di vật
        const goldBonusPercent = this.relicMods?.goldBonus || 0;
        if (goldBonusPercent > 0) {
            const bonusGold = Math.floor(baseReward * goldBonusPercent / 100);
            baseReward += bonusGold;
            console.log('[Trận đấu] Thưởng vàng:', goldBonusPercent + '%', 'Vàng thêm:', bonusGold);
        }
        PlayerState.gold += baseReward;
        // Chú ý: floor++ đã được chuyển sang showRouteSelection, không tăng tại đây nữa
        PlayerState.save();
        saveCardDeck(); // 🔧 Lưu bộ bài sau khi chiến thắng
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        // 🔧 Tính toán độ khó trận đấu
        const hpLostPercent = Math.round((1 - PlayerState.hp / PlayerState.maxHp) * 100);
        let difficultyText = 'Thắng lợi dễ dàng';
        if (hpLostPercent >= 70) difficultyText = 'Thắng suýt sao, suýt chút mất mạng';
        else if (hpLostPercent >= 50) difficultyText = 'Thắng lợi sau trận khổ chiến';
        else if (hpLostPercent >= 30) difficultyText = 'Thắng lợi gian nan';
        else if (hpLostPercent >= 10) difficultyText = 'Có chút sóng gió';

        // 📝 Ghi log trận đấu rút gọn: Chỉ ghi kết quả
        this.battleLog.push(`--- Kết quả trận đấu: Chiến thắng ---`);
        this.battleLog.push(`Đánh bại ${this.currentEnemy.name}, tổng cộng ${this.turn} lượt, ${difficultyText}`);

        // 🆕 Thưởng thẻ bài thuộc tính (Thường 10%, Tinh anh 50%, Boss 100% bảo đảm)
        let affixCardReward = null;
        const affixChance = this.currentEnemy.type === 'boss' ? 1.0 : (this.currentEnemy.type === 'elite' ? 0.5 : 0.1);
        console.log('[Thuộc tính] Loại kẻ địch:', this.currentEnemy.type, 'Tỷ lệ thuộc tính:', affixChance);

        if (Math.random() < affixChance) {
            // 🔧 Sửa lỗi: Lấy thẻ bài khả dụng từ ProfessionConfig hoặc CardLibrary
            let professionCards = [];

            // Thử lấy từ PlayerState.profession trước
            if (PlayerState.profession?.availableCards?.length > 0) {
                professionCards = PlayerState.profession.availableCards;
            }
            // Nếu không có, thử lấy từ ProfessionConfig
            else if (PlayerState.profession?.id && ProfessionConfig[PlayerState.profession.id]?.availableCards) {
                professionCards = ProfessionConfig[PlayerState.profession.id].availableCards;
            }
            // Cuối cùng thử dùng thư viện thẻ bài chung
            else {
                // Lấy tất cả thẻ tấn công và kỹ năng từ CardLibrary (loại trừ nguyền rủa và thẻ quái vật)
                professionCards = Object.keys(CardLibrary).filter(id => {
                    const card = CardLibrary[id];
                    return card && card.type !== CardType.CURSE &&
                        card.type !== CardType.MONSTER &&
                        card.type !== CardType.ELITE &&
                        card.type !== CardType.BOSS;
                });
            }

            console.log('[Thuộc tính] Số thẻ nghề nghiệp khả dụng:', professionCards.length);

            if (professionCards.length > 0) {
                const randomCardId = professionCards[Math.floor(Math.random() * professionCards.length)];
                const cardTemplate = CardLibrary[randomCardId];
                console.log('[Thuộc tính] Đã chọn ID thẻ:', randomCardId, 'Mẫu:', cardTemplate?.name);

                if (cardTemplate) {
                    affixCardReward = { ...cardTemplate };
                    this.addRandomAffixToCard(affixCardReward);
                    console.log('[Thuộc tính] Tạo thẻ thuộc tính:', affixCardReward.name, 'Thuộc tính:', affixCardReward.affix);

                    // 🔧 Không tự động thêm nữa mà đợi người chơi chọn
                    this.pendingAffixCard = affixCardReward;
                    this.battleLog.push(`🌟 Phát hiện thẻ bài thuộc tính 【${affixCardReward.name}】!`);
                } else {
                    console.warn('[Thuộc tính] Mẫu thẻ bài không tồn tại:', randomCardId);
                }
            } else {
                console.warn('[Thuộc tính] Không tìm thấy thẻ bài khả dụng');
            }
        } else {
            console.log('[Thuộc tính] Ngẫu nhiên không kích hoạt thưởng thuộc tính');
        }

        // Lưu thông tin kết quả trận đấu
        this.lastBattleResult = {
            enemyName: this.currentEnemy.name,
            reward: baseReward,
            difficulty: difficultyText,
            hpLostPercent: hpLostPercent,
            totalTurns: this.turn,
            affixCard: affixCardReward
        };

        // 🆕 Giao diện chọn thẻ bài thuộc tính
        const affixCardHtml = affixCardReward ? `
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(251, 191, 36, 0.2)); 
                        border: 2px solid #a855f7; border-radius: 12px; padding: 20px; margin: 15px 0; text-align: center;">
                <div style="color: #fbbf24; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                    🌟 Phát hiện thẻ bài thuộc tính!
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <div style="color: #fff; font-size: 18px; font-weight: bold;">${affixCardReward.name}</div>
                    <div style="color: #a855f7; font-size: 12px; margin-top: 5px;">Thuộc tính: ${affixCardReward.affix?.icon || ''} ${affixCardReward.affix?.name || ''}</div>
                    <div style="color: #888; font-size: 11px; margin-top: 5px;">${affixCardReward.affix?.description || ''}</div>
                    <div style="color: #aaa; font-size: 11px; margin-top: 8px; border-top: 1px solid #444; padding-top: 8px;">
                        Phí: ${affixCardReward.cost}⚡ | ${affixCardReward.description || ''}
                    </div>
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="BattleSystem.learnAffixCard()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        ✓ Học
                    </button>
                    <button onclick="BattleSystem.skipAffixCard()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #666, #444);
                                   color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        ✗ Bỏ qua
                    </button>
                </div>
            </div>
        ` : '';

        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
                <div style="color: #2ed573; font-size: 32px; font-weight: bold; margin-bottom: 15px;">Chiến thắng!</div>
                <div style="color: #ffd700; font-size: 18px; margin-bottom: 10px;">Đã chiến thắng ${this.currentEnemy.name}</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">${difficultyText}, nhận được ${baseReward} Vàng</div>
                ${affixCardHtml}
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="BattleSystem.skipBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="BattleSystem.generateBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // 🆕 Học thẻ bài thuộc tính
    learnAffixCard: function () {
        if (this.pendingAffixCard) {
            CardDeckManager.deck.push(this.pendingAffixCard);
            saveCardDeck();
            CardDeckManager.renderDeck();

            // Cập nhật hiển thị giao diện
            const cardName = this.pendingAffixCard.name;
            this.pendingAffixCard = null;

            // Hiển thị thông báo thành công
            if (typeof showNotification === 'function') {
                showNotification(`Đã học thành công ${cardName}!`, 'success');
            }

            // Làm mới giao diện chiến thắng, loại bỏ khu vực chọn thẻ thuộc tính
            this.refreshVictoryUI();
        }
    },

    // 🆕 Bỏ qua thẻ bài thuộc tính
    skipAffixCard: function () {
        if (this.pendingAffixCard) {
            const cardName = this.pendingAffixCard.name;
            this.pendingAffixCard = null;

            if (typeof showNotification === 'function') {
                showNotification(`Đã từ bỏ ${cardName}`, 'info');
            }

            // Làm mới giao diện chiến thắng
            this.refreshVictoryUI();
        }
    },

    // 🆕 Làm mới giao diện chiến thắng (Loại bỏ phần chọn thuộc tính)
    refreshVictoryUI: function () {
        const result = this.lastBattleResult;
        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
                <div style="color: #2ed573; font-size: 32px; font-weight: bold; margin-bottom: 15px;">Chiến thắng!</div>
                <div style="color: #ffd700; font-size: 18px; margin-bottom: 10px;">Đã chiến thắng ${result.enemyName}</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">${result.difficulty}, nhận được ${result.reward} Vàng</div>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="BattleSystem.skipBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="BattleSystem.generateBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // 🔧 Bỏ qua cốt truyện trận đấu, ghi lại vào lịch sử
    skipBattleStory: function () {
        const result = this.lastBattleResult;
        const historyText = `Đã chiến thắng ${result.enemyName}, ${result.difficulty}, nhận được ${result.reward} vàng`;
        ACJTGame.recordToHistory(historyText);
        this.closeBattle(true);
    },

    // 🔧 Tạo cốt truyện trận đấu (bao gồm log trận đấu)
    generateBattleStory: function () {
        const result = this.lastBattleResult;

        // 📝 Xây dựng từ khóa nhắc lệnh bao gồm log trận đấu
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, dựa trên nhật ký trận đấu sau để tạo cốt truyện chiến đấu:

【Tầng ${floor} của tòa tháp】
【Nhật ký trận đấu】
${battleLogText}

Dựa trên quá trình chiến đấu trên, hãy tạo ra một đoạn miêu tả cốt truyện chiến đấu sinh động, đừng miêu tả trực tiếp các con số chỉ số, hãy dùng cốt truyện để diễn đạt.`;

        // 🔧 Khi tạo cốt truyện sẽ không ghi vào lịch sử quan trọng và ma trận
        this.closeBattle(false);
        ACJTGame.sendToAI(prompt);
    },

    // Thất bại
    defeat: function () {
        // 🔧 Sửa lỗi: Trước khi kết thúc, tổng hợp các kỹ năng chưa ghi log
        if (this.turnActions && this.turnActions.length > 0) {
            this.turnActions.forEach(actionName => {
                this.addLog(`Sử dụng [${actionName}]`);
            });
            this.turnActions = []; // Xóa trắng
        }

        // 📝 Ghi log trận đấu rút gọn: Chỉ ghi kết quả
        this.battleLog.push(`--- Kết quả trận đấu: Thất bại ---`);
        this.battleLog.push(`Bị ${this.currentEnemy.name} đánh bại, tổng cộng ${this.turn} lượt`);

        // Lưu thông tin thất bại
        this.lastBattleResult = {
            enemyName: this.currentEnemy.name,
            victory: false,
            totalTurns: this.turn,
            enemyRemainingHp: this.currentEnemy.currentHp
        };

        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">💀</div>
                <div style="color: #ff4757; font-size: 32px; font-weight: bold; margin-bottom: 20px;">Bại trận...</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 30px;">Bạn đã gục ngã trước ${this.currentEnemy.name}</div>
                <div style="display: flex; gap: 20px;">
                    <button onclick="BattleSystem.triggerAiChao()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Bị xâm hại
                    </button>
                    <button onclick="BattleSystem.triggerBeg()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ffd700, #ff9500);
                                   color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Cầu xin
                    </button>
                </div>
        `;
    },

    // 🆕 Thất bại do hết thời gian biến thân của Thiếu nữ Ma pháp
    transformDefeat: function () {
        this.lastBattleResult = {
            enemyName: this.currentEnemy.name,
            victory: false,
            totalTurns: this.turn,
            enemyRemainingHp: this.currentEnemy.currentHp,
            transformTimeout: true
        };

        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">💔</div>
                <div style="color: #ff69b4; font-size: 32px; font-weight: bold; margin-bottom: 15px;">Biến thân kết thúc... (´;ω;｀)</div>
                <div style="color: #ff4757; font-size: 24px; margin-bottom: 15px;">Kiệt sức gục ngã</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 30px;">Thời gian biến thân của Thiếu nữ Ma pháp đã hết, bạn gục ngã trước ${this.currentEnemy.name}</div>
                <div style="display: flex; gap: 20px;">
                    <button onclick="BattleSystem.triggerAiChao()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Bị xâm hại
                    </button>
                    <button onclick="BattleSystem.triggerBeg()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ffd700, #ff9500);
                                   color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Cầu xin
                    </button>
                </div>
            </div>
        `;
    },

    // Kích hoạt bị xâm hại (Gửi cho AI, bao gồm log trận đấu)
    triggerAiChao: function () {
        const enemyName = this.currentEnemy?.name || 'Kẻ địch chưa rõ';

        // 📝 Xây dựng từ khóa nhắc lệnh bao gồm log trận đấu
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, dựa trên nhật ký trận đấu sau để tạo cốt truyện bại trận:

【Tầng ${floor} của tòa tháp】
【Nhật ký trận đấu】
${battleLogText}

Tôi đã bị ${enemyName} đánh bại. Dựa trên quá trình trận đấu trên, hãy tạo ra một đoạn miêu tả cốt truyện sau khi bại trận (cảnh bị xâm hại).`;

        // 📝 Ghi vào lịch sử quan trọng
        ACJTGame.recordToHistory(`Bại trận: Bị ${enemyName} đánh bại và bị xâm hại`);

        document.getElementById('battleModal')?.remove();
        ACJTGame.sendToAI(prompt);
    },

    // Kích hoạt cầu xin (Gửi cho AI, bao gồm log trận đấu)
    triggerBeg: function () {
        const enemyName = this.currentEnemy?.name || 'Kẻ địch chưa rõ';

        // 📝 Xây dựng từ khóa nhắc lệnh bao gồm log trận đấu
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, dựa trên nhật ký trận đấu sau để tạo cốt truyện bại trận:

【Tầng ${floor} của tòa tháp】
【Nhật ký trận đấu】
${battleLogText}

Tôi đã bị ${enemyName} đánh bại. Dựa trên quá trình trận đấu trên, hãy tạo ra một đoạn miêu tả cốt truyện sau khi bại trận (cảnh cầu xin).`;

        // 📝 Ghi vào lịch sử quan trọng
        ACJTGame.recordToHistory(`Bại trận: Bị ${enemyName} đánh bại và đã cầu xin tha thứ`);

        document.getElementById('battleModal')?.remove();
        ACJTGame.sendToAI(prompt);
    },

    // Đóng giao diện chiến đấu
    closeBattle: function (showRoutes = false) {
        document.getElementById('battleModal')?.remove();
        if (showRoutes) {
            RouteSystem.showRouteSelection();
        }
    },

    // Cập nhật UI trận đấu
    updateBattleUI: function () {
        const modal = document.getElementById('battleModal');
        if (modal) {
            modal.innerHTML = this.generateBattleHTML();
        }
    },

    // ==================== 🔥 Hệ thống hiệu ứng cảm giác tấn công ====================

    // Hiển thị số sát thương bay lên
    showDamageNumber: function (damage, isPlayer = false, isCrit = false, isHeal = false) {
        const container = document.getElementById('battleModal');
        if (!container) return;

        const floatNum = document.createElement('div');
        floatNum.className = 'damage-float-number';

        // Thiết lập màu sắc và văn bản dựa trên loại
        let color = '#ff4757'; // Mặc định màu đỏ (sát thương)
        let text = `-${damage}`;
        let size = isCrit ? '36px' : '28px';

        if (isHeal) {
            color = '#2ed573';
            text = `+${damage}`;
        } else if (isCrit) {
            color = '#ffd700';
            text = `💥${damage}`;
        }

        // Điều chỉnh vị trí dựa trên mục tiêu
        const xPos = isPlayer ? '25%' : '75%';
        const yOffset = Math.random() * 40 - 20;

        floatNum.style.cssText = `
            position: absolute;
            left: ${xPos};
            top: 30%;
            transform: translate(-50%, ${yOffset}px);
            font-size: ${size};
            font-weight: bold;
            color: ${color};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px ${color};
            z-index: 10001;
            pointer-events: none;
            animation: damageFloat 1s ease-out forwards;
        `;
        floatNum.textContent = text;
        container.appendChild(floatNum);

        // Xóa sau khi kết thúc hoạt ảnh
        setTimeout(() => floatNum.remove(), 1000);
    },

    // Hiệu ứng rung màn hình
    shakeScreen: function (intensity = 5, duration = 200) {
        const container = document.getElementById('battleModal');
        if (!container) return;

        container.style.animation = `battleShake ${duration}ms ease-in-out`;
        container.style.setProperty('--shake-intensity', `${intensity}px`);

        setTimeout(() => {
            container.style.animation = '';
        }, duration);
    },

    // Hiệu ứng nhấp nháy mục tiêu
    flashTarget: function (isPlayer = false) {
        const targetId = isPlayer ? 'playerArea' : 'enemyArea';
        const target = document.getElementById(targetId);
        if (!target) return;

        target.style.animation = 'hitFlash 0.3s ease-in-out';
        setTimeout(() => {
            target.style.animation = '';
        }, 300);
    },

    // Hiệu ứng đánh trúng tổng hợp (Tấn công kẻ địch)
    showHitEffect: function (damage, isCrit = false) {
        this.showDamageNumber(damage, false, isCrit);
        this.shakeScreen(isCrit ? 8 : 4);
        this.flashTarget(false);
    },

    // Hiệu ứng trúng đòn tổng hợp (Người chơi bị thương)
    showPlayerHitEffect: function (damage) {
        this.showDamageNumber(damage, true);
        this.shakeScreen(6);
        this.flashTarget(true);
    },

    // Hiệu ứng trị liệu
    showHealEffect: function (amount, isPlayer = true) {
        this.showDamageNumber(amount, isPlayer, false, true);
    },

    // 🔧 Lấy hiển thị Debuff của kẻ địch
    getEnemyDebuffDisplay: function () {
        if (!this.enemyDebuffs || this.enemyDebuffs.length === 0) return '';

        const debuffIcons = {
            'attack': '⚔️↓',
            'defense': '🛡️↓',
            'dot': '🩸',
            'poison': '🧪',
            'accuracy': '👁️↓',
            'skip': '😱'
        };

        const debuffColors = {
            'attack': '#ffa502',
            'defense': '#70a1ff',
            'dot': '#ff4757',
            'poison': '#2ed573',
            'accuracy': '#f7b731',
            'skip': '#9c88ff'
        };

        let html = '<div style="display: flex; gap: 4px; justify-content: center; margin-top: 8px; flex-wrap: wrap;">';
        this.enemyDebuffs.forEach(d => {
            const icon = debuffIcons[d.debuffType] || '❌';
            const color = debuffColors[d.debuffType] || '#ff4757';
            const valueText = d.debuffType === 'poison' ? `${d.value} sát thương` : '';
            html += `<div style="background: rgba(0,0,0,0.4); border: 1px solid ${color}; 
                     border-radius: 6px; padding: 3px 8px; font-size: 10px; color: ${color};"
                     title="${d.name || d.debuffType}: ${d.value}">
                ${icon}${valueText} ${d.remainingTurns} lượt
            </div>`;
        });
        html += '</div>';
        return html;
    },

// 🔧 Lấy hiển thị trạng thái đặc biệt của người chơi
    getPlayerStatusDisplay: function () {
        const mods = this.statusMods || {};
        const relicMods = this.relicMods || {};

        const effects = [];
        // Điều chỉnh thuộc tính cơ bản
        if (mods.attack !== 0) {
            effects.push(`<span style="color: ${mods.attack > 0 ? '#2ed573' : '#ff4757'};">⚔️${mods.attack > 0 ? '+' : ''}${mods.attack}</span>`);
        }
        if (mods.defense !== 0) {
            effects.push(`<span style="color: ${mods.defense > 0 ? '#2ed573' : '#ff4757'};">🛡️${mods.defense > 0 ? '+' : ''}${mods.defense}</span>`);
        }
        if (mods.damageTaken !== 0) {
            effects.push(`<span style="color: #ff4757;">Sát thương nhận +${mods.damageTaken}%</span>`);
        }
        // Thưởng sát thương H
        if (mods.hDamageBonus > 0) {
            effects.push(`<span style="color: #ff6b9d;">💗Sát thương H +${mods.hDamageBonus}%</span>`);
        }
        // Hồi máu mỗi lượt
        if (mods.hpPerTurn > 0) {
            effects.push(`<span style="color: #2ed573;">♻️Lượt +${mods.hpPerTurn}HP</span>`);
        }
        // Hồi máu khi bị trúng đòn
        if (mods.hpOnHit > 0) {
            effects.push(`<span style="color: #ffa502;">😵Trúng đòn +${mods.hpOnHit}HP</span>`);
        }
        // Giảm tấn công kẻ địch
        if (mods.enemyAttackReduce > 0) {
            effects.push(`<span style="color: #70a1ff;">🌺Công địch -${mods.enemyAttackReduce}</span>`);
        }
        // Hiệu ứng Thánh di vật
        if (relicMods.lifesteal > 0) {
            effects.push(`<span style="color: #ff6b81;">🦷Hút máu +${relicMods.lifesteal}</span>`);
        }
        if (relicMods.healBonus > 0) {
            effects.push(`<span style="color: #2ed573;">💚Trị liệu +${relicMods.healBonus}</span>`);
        }
        if (relicMods.drawBonus > 0) {
            effects.push(`<span style="color: #ffd700;">🃏Rút bài +${relicMods.drawBonus}</span>`);
        }
        if (relicMods.reflect > 0) {
            effects.push(`<span style="color: #70a1ff;">🪞Phản đòn ${relicMods.reflect}</span>`);
        }

        if (effects.length === 0) return '';

        return `
            <div style="background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(255,107,157,0.1)); 
                 border: 1px solid rgba(102,126,234,0.3); border-radius: 10px; padding: 10px; margin-bottom: 12px; text-align: center;">
                <div style="color: #888; font-size: 11px; margin-bottom: 6px;">✨ Hiệu ứng đặc biệt</div>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; font-size: 11px;">
                    ${effects.join(' ')}
                </div>
            </div>
        `;
    },

    // 🔧 Lấy sức tấn công thực tế (Cơ bản + Điều chỉnh trạng thái + Buff - Debuff)
    getPlayerEffectiveAttack: function () {
        let base = PlayerState.attack || 0;
        let bonus = this.statusMods?.attack || 0;

        // Cộng thưởng tấn công từ buff
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'attack') {
                bonus += b.value;
            }
        });

        // 🔧 Trừ suy giảm tấn công từ debuff
        (this.playerDebuffs || []).forEach(d => {
            if (d.debuffType === 'attack') {
                bonus -= d.value;
            }
        });

        const total = Math.max(0, base + bonus);
        if (bonus !== 0) {
            const color = bonus > 0 ? '#2ed573' : '#ff4757';
            return `<span style="color: #fff; font-weight: bold;">${total}</span><span style="color: ${color}; font-size: 10px;">(${base}${bonus > 0 ? '+' : ''}${bonus})</span>`;
        }
        return `<span style="color: #fff; font-weight: bold;">${total}</span>`;
    },

    // 🔧 Lấy sức phòng thủ thực tế (Cơ bản + Điều chỉnh trạng thái + Buff - Debuff)
    getPlayerEffectiveDefense: function () {
        let base = PlayerState.defense || 0;
        let bonus = this.statusMods?.defense || 0;

        // Cộng thưởng phòng thủ từ buff
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') {
                bonus += b.value;
            }
        });

        // 🔧 Trừ suy giảm phòng thủ từ debuff
        (this.playerDebuffs || []).forEach(d => {
            if (d.debuffType === 'defense') {
                bonus -= d.value;
            }
        });

        const total = Math.max(0, base + bonus);
        if (bonus !== 0) {
            const color = bonus > 0 ? '#2ed573' : '#ff4757';
            return `<span style="color: #fff; font-weight: bold;">${total}</span><span style="color: ${color}; font-size: 10px;">(${base}${bonus > 0 ? '+' : ''}${bonus})</span>`;
        }
        return `<span style="color: #fff; font-weight: bold;">${total}</span>`;
    },

    // 🔧 Hiển thị Tăng ích/Giảm ích của người chơi (trong bảng thuộc tính chiến đấu)
    getPlayerBuffDisplay: function () {
        const buffs = this.playerBuffs || [];
        const debuffs = this.playerDebuffs || [];

        if (buffs.length === 0 && debuffs.length === 0) return '';

        let html = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">';

        // Hiển thị Buff
        if (buffs.length > 0) {
            html += '<div style="color: #2ed573; font-size: 10px; margin-bottom: 4px;">✨ Hiệu ứng Tăng ích</div>';
            buffs.forEach(b => {
                html += `<div style="color: #2ed573; font-size: 10px;">• ${b.name} (${b.remainingTurns} lượt)</div>`;
            });
        }

        // 🔧 Hiển thị Debuff
        if (debuffs.length > 0) {
            html += '<div style="color: #ff4757; font-size: 10px; margin-bottom: 4px; margin-top: 4px;">💀 Hiệu ứng Giảm ích</div>';
            debuffs.forEach(d => {
                const typeText = d.debuffType === 'defense' ? 'Phòng thủ' : 'Tấn công';
                html += `<div style="color: #ff4757; font-size: 10px;">• ${d.name || 'Suy yếu'} ${typeText} -${d.value} (${d.remainingTurns} lượt)</div>`;
            });
        }

        html += '</div>';
        return html;
    },

    // 🔧 Lấy sức tấn công thực tế của kẻ địch (xét cả debuff và buff)
    getEnemyEffectiveAttack: function () {
        let attack = this.currentEnemy?.attack || 0;
        const originalAttack = attack;

        // 🔧 Áp dụng buff tấn công của kẻ địch (như Cuồng bạo)
        (this.enemyBuffs || []).forEach(b => {
            if (b.buffType === 'attack') {
                attack += b.value;
            }
        });

        // Áp dụng debuff tấn công
        (this.enemyDebuffs || []).forEach(d => {
            if (d.debuffType === 'attack') {
                attack = Math.max(0, attack - d.value);
            }
        });

        // Áp dụng cải tạo cơ thể: Giảm tấn công kẻ địch
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.enemyAttackReduce > 0) {
            attack = Math.max(0, attack - bodyMods.enemyAttackReduce);
        }

        // Nếu có thay đổi, hiển thị định dạng kèm tăng/giảm
        if (attack > originalAttack) {
            return `${attack}<span style="color: #ff4757; font-size: 10px;">(↑${attack - originalAttack})</span>`;
        } else if (attack < originalAttack) {
            return `${attack}<span style="color: #2ed573; font-size: 10px;">(↓${originalAttack - attack})</span>`;
        }
        return attack;
    },

    // 🔧 Lấy sức phòng thủ thực tế của kẻ địch (xét debuff)
    getEnemyEffectiveDefense: function () {
        let defense = this.currentEnemy?.defense || 0;
        const originalDefense = defense;
        let isDefenseZero = false;

        // Áp dụng debuff phòng thủ
        (this.enemyDebuffs || []).forEach(d => {
            if (d.debuffType === 'defense') {
                defense = Math.max(0, defense - d.value);
            }
            // 🔧 Hiệu ứng phòng thủ về 0 (Kiến Long Tạ Giáp)
            if (d.debuffType === 'defenseZero') {
                defense = 0;
                isDefenseZero = true;
            }
        });

        // Nếu phòng thủ về 0, hiển thị đặc biệt
        if (isDefenseZero) {
            return `0<span style="color: #ff6b9d; font-size: 10px;">(Về 0)</span>`;
        }
        // Nếu có thay đổi, hiển thị định dạng kèm giảm ích
        if (defense !== originalDefense) {
            return `${defense}<span style="color: #2ed573; font-size: 10px;">(↓${originalDefense - defense})</span>`;
        }
        return defense;
    },

    // 🔧 Hiển thị Debuff của kẻ địch (trong bảng thuộc tính chiến đấu)
    getEnemyDebuffDisplay: function () {
        if (!this.enemyDebuffs || this.enemyDebuffs.length === 0) return '';

        const debuffIcons = {
            'attack': '⚔️↓',
            'defense': '🛡️↓',
            'defenseZero': '💋',  // Kiến Long Tạ Giáp
            'dot': '🩸',
            'accuracy': '👁️↓',
            'skip': '😱'
        };

        let html = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">';
        html += '<div style="color: #ff4757; font-size: 10px; margin-bottom: 4px;">💀 Hiệu ứng tiêu cực</div>';
        this.enemyDebuffs.forEach(d => {
            const icon = debuffIcons[d.debuffType] || '❌';
            // Hiển thị đặc biệt cho loại defenseZero
            if (d.debuffType === 'defenseZero') {
                html += `<div style="color: #ff6b9d; font-size: 10px;" title="Phòng thủ về 0">• ${icon} ${d.name} (${d.remainingTurns} lượt)</div>`;
            } else {
                // 🔧 Sửa lỗi: Loại DOT hiển thị dotDamage, các loại khác hiển thị value
                const displayValue = d.debuffType === 'dot' ? (d.dotDamage || d.value || 0) : (d.value || 0);
                html += `<div style="color: #ffa502; font-size: 10px;" title="${d.description}">• ${icon} ${d.name} -${displayValue} (${d.remainingTurns} lượt)</div>`;
            }
        });
        html += '</div>';
        return html;
    },

    // ==================== 🆕 Hệ thống Thuộc tính Thẻ bài (Affix) ====================

    // Áp dụng hiệu ứng thuộc tính
    applyCardAffix: function (card, damageDealt = 0) {
        if (!card.affix) return;

        const affix = card.affix;
        const effect = affix.effect;

        switch (effect.type) {
            case 'dot': // Sát thương duy trì
                this.enemyDebuffs.push({
                    name: affix.name,
                    debuffType: 'dot',
                    value: effect.damage,
                    dotDamage: effect.damage,
                    remainingTurns: effect.duration,
                    description: affix.description
                });
                this.addLog(`[Thuộc tính] ${affix.icon} ${affix.name} kích hoạt, gây ra ${effect.damage} điểm sát thương duy trì / ${effect.duration} lượt`);
                break;

            case 'freeze': // Đóng băng
                if (Math.random() < effect.chance) {
                    this.enemyDebuffs.push({
                        name: 'Đóng băng',
                        debuffType: 'freeze',
                        value: 1,
                        remainingTurns: effect.duration || 1,
                        description: 'Không thể hành động'
                    });
                    this.addLog(`[Thuộc tính] ${affix.icon} Đóng băng kích hoạt! Kẻ địch bị đóng băng trong ${effect.duration} lượt!`);
                }
                break;

            case 'lifesteal': // Hút máu
                if (damageDealt > 0) {
                    const heal = Math.floor(damageDealt * effect.percent);
                    if (heal > 0) {
                        PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + heal);
                        this.addLog(`[Thuộc tính] ${affix.icon} Hút máu +${heal} HP`);
                        this.showHealEffect(heal, true);
                    }
                }
                break;

            case 'draw': // Rút bài
                this.drawCards(effect.count);
                this.addLog(`[Thuộc tính] ${affix.icon} Tấn tốc kích hoạt, rút thêm ${effect.count} lá bài`);
                break;

            case 'armor': // Giáp
                this.playerArmor += effect.value;
                this.addLog(`[Thuộc tính] ${affix.icon} Kiên cố kích hoạt, giáp +${effect.value}`);
                break;

            case 'heal': // Trị liệu
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + effect.value);
                this.addLog(`[Thuộc tính] ${affix.icon} Chúc phúc kích hoạt, khôi phục ${effect.value} HP`);
                this.showHealEffect(effect.value, true);
                break;

            case 'empower': // Cường hóa (tăng hiệu quả nhưng tăng đọa lạc)
                PlayerState.corruption += effect.corruption;
                PlayerState.save();
                PlayerState.updateDisplay();
                this.addLog(`[Thuộc tính] ${affix.icon} Lời nguyền kích hoạt, hiệu quả +50%, đọa lạc +${effect.corruption}`);
                break;

            case 'echo': // Vang vọng
                if (Math.random() < effect.chance) {
                    this.addLog(`[Thuộc tính] ${affix.icon} Vang vọng kích hoạt! Hiệu ứng được phát động thêm lần nữa!`);
                    // Tạo bản sao thẻ bài và gỡ thuộc tính để tránh vòng lặp vô hạn
                    const cardCopy = { ...card, affix: null };
                    this.executeCard(cardCopy);
                }
                break;

            case 'random': // Hỗn độn
                const otherAffixes = Object.values(CardAffixConfig).filter(a => a.id !== 'chaos');
                if (otherAffixes.length > 0) {
                    const randomAffix = otherAffixes[Math.floor(Math.random() * otherAffixes.length)];
                    this.addLog(`[Thuộc tính] 🌀 Hỗn độn kích hoạt hiệu ứng ${randomAffix.icon}${randomAffix.name}!`);
                    // Sử dụng hiệu ứng thuộc tính ngẫu nhiên
                    const tempCard = { affix: randomAffix };
                    this.applyCardAffix(tempCard, damageDealt);
                }
                break;
        }
    },

    // Thêm thuộc tính ngẫu nhiên cho thẻ bài (gọi khi nhận phần thưởng trận đấu)
    addRandomAffixToCard: function (card) {
        console.log('[Thuộc tính] addRandomAffixToCard được gọi, thẻ bài:', card?.name);

        // Thẻ đã có thuộc tính sẽ không thêm nữa
        if (card.affix) {
            console.log('[Thuộc tính] Thẻ bài đã có thuộc tính, bỏ qua');
            return card;
        }

        // Thẻ nguyền rủa không thể nhận thuộc tính
        if (card.type === CardType.CURSE) {
            console.log('[Thuộc tính] Thẻ Nguyền rủa không thể nhận thuộc tính');
            return card;
        }

        // Chọn thuộc tính ngẫu nhiên theo trọng số độ hiếm
        const affix = this.rollRandomAffix();
        console.log('[Thuộc tính] rollRandomAffix trả về:', affix);

        if (affix) {
            card.affix = affix;
            // Thêm biểu tượng thuộc tính vào trước tên
            card.originalName = card.name;
            card.name = `${affix.icon}${card.name}`;
            console.log('[Thuộc tính] Đã thêm thành công thuộc tính! Tên mới:', card.name);
        } else {
            console.warn('[Thuộc tính] rollRandomAffix trả về null!');
        }
        return card;
    },

    // Ngẫu nhiên thuộc tính theo trọng số
    rollRandomAffix: function () {
        const affixes = Object.values(CardAffixConfig);
        const totalWeight = Object.values(AffixRarityWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        // Xác định độ hiếm trước
        let selectedRarity = 'common';
        for (const [rarity, weight] of Object.entries(AffixRarityWeights)) {
            random -= weight;
            if (random <= 0) {
                selectedRarity = rarity;
                break;
            }
        }

        // Chọn ngẫu nhiên một thuộc tính trong độ hiếm đó
        const rarityAffixes = affixes.filter(a => a.rarity === selectedRarity);
        if (rarityAffixes.length === 0) return null;

        return rarityAffixes[Math.floor(Math.random() * rarityAffixes.length)];
    },

    // Lấy văn bản hiển thị của thuộc tính
    getAffixDisplayText: function (affix) {
        if (!affix) return '';
        const rarityColors = {
            common: '#aaa',
            rare: '#4a9eff',
            epic: '#a855f7',
            legendary: '#fbbf24'
        };
        const color = rarityColors[affix.rarity] || '#aaa';
        return `<span style="color: ${color}; font-size: 9px;">${affix.icon} ${affix.name}</span>`;
    }
};

// ==================== Hệ thống Cửa hàng ====================
const ShopSystem = {
    currentCards: [],
    currentRelics: [],
    purchasedItems: [], // 🔧 Ghi lại các vật phẩm đã mua lần này

    // Mở cửa hàng
    openShop: function () {
        // Tạo hàng ngẫu nhiên (chỉ bán Thánh di vật, không bán thẻ bài)
        this.currentCards = [];
        this.currentRelics = this.generateShopRelics(5);
        this.purchasedItems = []; // 🔧 Xóa lịch sử mua

        const modal = document.createElement('div');
        modal.id = 'shopModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
            align-items: center; justify-content: flex-start; z-index: 10000;
            padding: 30px; box-sizing: border-box; overflow-y: auto;
        `;

        modal.innerHTML = this.generateShopHTML();
        document.body.appendChild(modal);
    },

    // Tạo thẻ bài trong cửa hàng (lọc theo nghề nghiệp và đọa lạc)
    generateShopCards: function (count) {
        const cards = [];
        const playerCorruption = PlayerState.corruption || 0;
        const playerProfession = PlayerState.profession?.id;

        // Lọc thẻ khả dụng
        const available = CardLibrary.filter(card => {
            // Kiểm tra giới hạn nghề nghiệp
            if (card.professionRequired && card.professionRequired !== playerProfession) {
                return false;
            }
            // Kiểm tra điều kiện đọa lạc (đối với thẻ kỹ năng H)
            if (card.corruptionRequired !== undefined && card.corruptionRequired > playerCorruption) {
                return false;
            }
            return true;
        });

        // Nếu là nghề Tu nữ, thêm các thẻ đặc thù Tu nữ vào danh sách
        if (playerProfession === 'nun') {
            const prof = ProfessionConfig.nun;
            if (prof.professionCardPool) {
                prof.professionCardPool.forEach(cardId => {
                    const card = CardLibrary.find(c => c.id === cardId);
                    if (card && !available.find(c => c.id === cardId)) {
                        available.push(card);
                    }
                });
            }
        }

        // Chọn thẻ ngẫu nhiên
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && shuffled.length > 0; i++) {
            const card = { ...shuffled.splice(0, 1)[0] };
            card.shopPrice = (card.cost || 1) * 30 + Math.floor(Math.random() * 20);
            cards.push(card);
        }
        return cards;
    },

    // Tạo Thánh di vật trong cửa hàng
    generateShopRelics: function (count) {
        const relics = [];
        const available = Object.values(RelicConfig).filter(r => !PlayerState.relics.includes(r.id));
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            relics.push(available.splice(index, 1)[0]);
        }
        return relics;
    },

    // Tạo HTML Cửa hàng
    generateShopHTML: function () {
        let cardsHtml = '';
        this.currentCards.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const canBuy = PlayerState.gold >= card.shopPrice;
            cardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                            border: 2px solid ${canBuy ? typeColor : '#333'}; border-radius: 8px;
                            padding: 15px; width: 120px; text-align: center; opacity: ${canBuy ? 1 : 0.5};">
                    <div style="color: #ffd700; font-size: 11px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 20px; font-weight: bold; margin-bottom: 8px;">${card.value}</div>
                    <div style="color: #888; font-size: 11px; margin-bottom: 10px;">${card.description.substring(0, 25)}...</div>
                    <button onclick="ShopSystem.buyCard(${index})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 6px 15px; background: ${canBuy ? '#ffd700' : '#333'}; color: ${canBuy ? '#000' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${card.shopPrice}
                    </button>
                </div>
            `;
        });

        let relicsHtml = '';
        // 🔧 Tính toán giảm giá cửa hàng
        const shopDiscount = this.getShopDiscount();

        this.currentRelics.forEach((relic, index) => {
            // 🔧 Áp dụng giảm giá
            const discountedPrice = shopDiscount > 0
                ? Math.floor(relic.price * (100 - shopDiscount) / 100)
                : relic.price;
            const canBuy = PlayerState.gold >= discountedPrice;
            const priceDisplay = shopDiscount > 0
                ? `<span style="text-decoration: line-through; color: #888; font-size: 10px;">${relic.price}</span> ${discountedPrice}`
                : `${relic.price}`;

            relicsHtml += `
                <div style="background: linear-gradient(135deg, rgba(50,30,50,0.95) 0%, rgba(35,20,35,0.98) 100%);
                            border: 2px solid ${canBuy ? '#ffd700' : '#333'}; border-radius: 8px;
                            padding: 15px; width: 140px; text-align: center; opacity: ${canBuy ? 1 : 0.5};">
                    <div style="font-size: 36px; margin-bottom: 10px;">${relic.icon}</div>
                    <div style="color: #ffd700; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${relic.name}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px;">${relic.desc}</div>
                    <button onclick="ShopSystem.buyRelic(${index})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 6px 15px; background: ${canBuy ? '#ffd700' : '#333'}; color: ${canBuy ? '#000' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${priceDisplay}
                    </button>
                </div>
            `;
        });

        // 🔧 Hiển thị thông tin giảm giá
        const discountText = shopDiscount > 0
            ? `<div style="color: #2ed573; font-size: 14px; margin-bottom: 20px;">🏷️ Giảm giá cửa hàng: ${shopDiscount}%</div>`
            : '';

        return `
            <div style="color: #2ed573; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🏪 Cửa Hàng</div>
            <div style="color: #ffd700; font-size: 16px; margin-bottom: 10px;">💰 Vàng: ${PlayerState.gold}</div>
            ${discountText}
            
            <div style="color: #fff; font-size: 18px; margin-bottom: 15px;">🏆 Cổ Vật</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px; max-width: 800px;">
                ${relicsHtml || '<div style="color: #666;">Không có Cổ Vật nào để bán</div>'}
            </div>
            
            <button onclick="ShopSystem.closeShop()"
                    style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2);
                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                Rời khỏi cửa hàng
            </button>
        `;
    },

    // Mua thẻ bài
    buyCard: function (index) {
        const card = this.currentCards[index];
        if (!card || PlayerState.gold < card.shopPrice) return;

        PlayerState.gold -= card.shopPrice;
        CardDeckManager.deck.push({ ...card });
        this.currentCards.splice(index, 1);
        this.purchasedItems.push(card.name); // 🔧 Ghi lại lịch sử mua

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshShopUI();
    },

    // Mua Thánh di vật
    buyRelic: function (index) {
        const relic = this.currentRelics[index];
        if (!relic) return;

        // 🔧 Tính giá sau khi giảm
        const shopDiscount = this.getShopDiscount();
        const discountedPrice = shopDiscount > 0
            ? Math.floor(relic.price * (100 - shopDiscount) / 100)
            : relic.price;

        if (PlayerState.gold < discountedPrice) return;

        PlayerState.gold -= discountedPrice;
        PlayerState.relics.push(relic.id);
        this.purchasedItems.push(relic.name); // 🔧 Ghi lại lịch sử mua

        // Áp dụng hiệu quả
        if (relic.effect.maxHp) PlayerState.maxHp += relic.effect.maxHp;
        if (relic.effect.attack) PlayerState.attack += relic.effect.attack;
        if (relic.effect.defense) PlayerState.defense += relic.effect.defense;
        if (relic.effect.baseArmor) PlayerState.baseArmor += relic.effect.baseArmor;
        if (relic.effect.energy) PlayerState.energy += relic.effect.energy;
        if (relic.effect.corruption) PlayerState.corruption += relic.effect.corruption;

        this.currentRelics.splice(index, 1);

        PlayerState.save();
        PlayerState.updateDisplay();

        this.refreshShopUI();
    },

    // 🔧 Lấy phần trăm giảm giá cửa hàng (từ hiệu ứng Thánh di vật)
    getShopDiscount: function () {
        let totalDiscount = 0;
        (PlayerState.relics || []).forEach(relicId => {
            const relic = RelicConfig[relicId];
            if (relic && relic.effect && relic.effect.shopDiscount) {
                totalDiscount += relic.effect.shopDiscount;
            }
        });
        return totalDiscount;
    },

    // Làm mới UI Cửa hàng
    refreshShopUI: function () {
        const modal = document.getElementById('shopModal');
        if (modal) modal.innerHTML = this.generateShopHTML();
    },

    // Đóng cửa hàng
    closeShop: function () {
        // 🔧 Nếu có mua vật phẩm, hiển thị hai lựa chọn
        if (this.purchasedItems.length > 0) {
            const modal = document.getElementById('shopModal');
            if (modal) {
                const itemsText = this.purchasedItems.join('、');
                modal.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                        <div style="font-size: 72px; margin-bottom: 20px;">🛒</div>
                        <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Mua sắm hoàn tất!</div>
                        <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">Đã mua: ${itemsText}</div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button onclick="ShopSystem.skipShopStory()"
                                    style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                Bỏ qua cốt truyện
                            </button>
                            <button onclick="ShopSystem.generateShopStory()"
                                    style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                Tạo cốt truyện
                            </button>
                        </div>
                    </div>
                `;
                return;
            }
        }
        document.getElementById('shopModal')?.remove();
        RouteSystem.showRouteSelection();
    },

    // 🔧 Bỏ qua cốt truyện cửa hàng
    skipShopStory: function () {
        const itemsText = this.purchasedItems.join('、');
        const historyText = `Đã mua ${itemsText} tại cửa hàng trong tòa tháp`;
        ACJTGame.recordToHistory(historyText);
        document.getElementById('shopModal')?.remove();
        RouteSystem.showRouteSelection();
    },

    // 🔧 Tạo cốt truyện cửa hàng
    generateShopStory: function () {
        const itemsText = this.purchasedItems.join('、');
        const floor = PlayerState.floor || 1;
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Tầng ${floor} của tòa tháp】 Tôi đã mua ${itemsText} tại cửa hàng bí ẩn`;
        // Khi tạo cốt truyện sẽ không ghi vào lịch sử quan trọng
        document.getElementById('shopModal')?.remove();
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== Hệ thống Suối nước nóng / Nghỉ ngơi ====================
const RestSystem = {
    // Mở suối nước nóng
    openRest: function () {
        // Kiểm tra modal đã tồn tại chưa, nếu có thì cập nhật, nếu không thì tạo mới
        let modal = document.getElementById('restModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'restModal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
                align-items: center; justify-content: center; z-index: 10000;
            `;
            document.body.appendChild(modal);
        }

        // Kiểm tra xem có thẻ Nguyền rủa nào để xóa không
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const hasCurseCards = curseCards.length > 0;
        const canAfford = PlayerState.gold >= 50;
        const canPurify = hasCurseCards && canAfford;

        modal.innerHTML = `
            <div style="font-size: 72px; margin-bottom: 20px;">♨️</div>
            <div style="color: #70a1ff; font-size: 28px; font-weight: bold; margin-bottom: 10px;">Suối nước nóng</div>
            <div style="color: #888; font-size: 14px; margin-bottom: 40px;">Hãy chọn điều bạn muốn làm</div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                <div class="route-card" onclick="RestSystem.rest()">
                    <div class="route-icon">😴</div>
                    <div class="route-name">Nghỉ ngơi</div>
                    <div class="route-desc">Hồi phục 30% HP tối đa</div>
                </div>
                
                <div class="route-card" onclick="RestSystem.showUpgradeCards()">
                    <div class="route-icon">⬆️</div>
                    <div class="route-name">Nâng cấp thẻ</div>
                    <div class="route-desc">Cường hóa một lá bài</div>
                </div>
                
                <div class="route-card" onclick="${canPurify ? 'RestSystem.showPurifyCards()' : ''}" 
                     style="${canPurify ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <div class="route-icon">🧹</div>
                    <div class="route-name">Thanh tẩy (50💰)</div>
                    <div class="route-desc">${!hasCurseCards ? 'Không có thẻ Nguyền rủa' : (!canAfford ? 'Không đủ vàng' : 'Xóa một thẻ Nguyền rủa')}</div>
                </div>
            </div>
            
            <button onclick="RestSystem.closeRest()" 
                    style="margin-top: 30px; padding: 10px 40px; background: #333; color: #888; border: 1px solid #444; border-radius: 6px; cursor: pointer; font-size: 14px;">
                Đóng
            </button>
        `;
    },

    // Hiển thị giao diện thanh tẩy thẻ Nguyền rủa
    showPurifyCards: function () {
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        if (curseCards.length === 0 || PlayerState.gold < 50) return;

        let cardsHtml = '';
        curseCards.forEach((card, idx) => {
            // Tìm chỉ số thực tế trong bộ bài deck
            const deckIndex = CardDeckManager.deck.findIndex(c => c.id === card.id && c.type === CardType.CURSE);
            cardsHtml += `
                <div onclick="RestSystem.purifyCard(${deckIndex})" 
                     style="background: linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(100,0,0,0.3) 100%);
                            border: 2px solid #8b0000; border-radius: 8px; padding: 15px; width: 140px;
                            text-align: center; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 5px 20px rgba(139,0,0,0.3)'" 
                     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'">
                    <div style="font-size: 32px; margin-bottom: 8px;">${card.icon || '💀'}</div>
                    <div style="color: #ff6b81; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: #888; font-size: 10px;">${card.description || ''}</div>
                </div>
            `;
        });

        document.getElementById('restModal').innerHTML = `
            <div style="color: #ff6b81; font-size: 24px; font-weight: bold; margin-bottom: 10px;">🧹 Nghi thức Thanh tẩy</div>
            <div style="color: #ffd700; font-size: 14px; margin-bottom: 10px;">💰 Chi tiêu 50 vàng để xóa một lá bài Nguyền rủa</div>
            <div style="color: #888; font-size: 12px; margin-bottom: 30px;">Vàng hiện có: ${PlayerState.gold}</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; max-width: 600px; margin-bottom: 30px;">
                ${cardsHtml}
            </div>
            <button onclick="RestSystem.openRest()"
                    style="padding: 10px 30px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                Quay lại
            </button>
        `;
    },

    // Thanh tẩy (Xóa) thẻ Nguyền rủa
    purifyCard: function (deckIndex) {
        if (PlayerState.gold < 50) return;

        const card = CardDeckManager.deck[deckIndex];
        if (!card || card.type !== CardType.CURSE) return;

        // Trừ vàng
        PlayerState.gold -= 50;
        PlayerState.save();

        // Xóa thẻ bài
        CardDeckManager.deck.splice(deckIndex, 1);
        saveCardDeck();

        // 🔧 Kiểm tra trong bộ bài còn thẻ nguyền rủa cùng loại không
        const hasSameCurse = CardDeckManager.deck.some(c => c.statusId === card.statusId && c.type === CardType.CURSE);

        console.log(`[Thanh tẩy suối nước nóng] Thanh tẩy thẻ bài: ${card.name}, statusId: ${card.statusId}, Còn nguyền rủa cùng loại: ${hasSameCurse}`);

        // 🔧 Chỉ khi bộ bài không còn lá nguyền rủa cùng loại mới xóa trạng thái đặc biệt
        if (card.statusId && !hasSameCurse) {
            if (SpecialStatusManager.statuses[card.statusId]) {
                SpecialStatusManager.remove(card.statusId);
                console.log('[Thanh tẩy suối nước nóng] Xóa trạng thái đặc biệt:', card.statusId);
                // Cập nhật hiển thị ngay lập tức
                SpecialStatusManager.updateDisplay();
            } else {
                console.warn('[Thanh tẩy suối nước nóng] Không tìm thấy trạng thái đặc biệt tương ứng:', card.statusId);
            }
        } else if (hasSameCurse) {
            console.log('[Thanh tẩy suối nước nóng] Bộ bài vẫn còn thẻ cùng loại, giữ nguyên trạng thái đặc biệt:', card.statusId);
        } else {
            console.log('[Thanh tẩy suối nước nóng] Thẻ không có statusId, không thể xóa trạng thái tương ứng');
        }

        // Lưu thông tin thanh tẩy
        this.lastPurifyCard = card;

        // Ghi vào lịch sử quan trọng
        const historyText = `Đã thanh tẩy thẻ bài Nguyền rủa 【${card.name}】 tại suối nước nóng`;
        ACJTGame.recordToHistory(historyText);

        // 🔧 Hiển thị lựa chọn Bỏ qua / Tạo cốt truyện
        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">✨</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Thanh tẩy thành công!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 10px;">${card.icon || '💀'} ${card.name} đã được xóa bỏ</div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">-50💰 Còn lại: ${PlayerState.gold} vàng</div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="RestSystem.skipPurifyStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="RestSystem.generatePurifyStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

// Bỏ qua cốt truyện thanh tẩy
    skipPurifyStory: function () {
        const card = this.lastPurifyCard;
        this.closeRest();
        // 🔧 Làm mới tất cả hiển thị
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        // 🔧 Kiểm tra và cập nhật giao diện ghi đè trạng thái thôi miên
        if (window.HypnosisOptionOverride) {
            if (window.HypnosisOptionOverride.shouldOverride()) {
                window.HypnosisOptionOverride.applyOverride();
                window.HypnosisOptionOverride.modifyOptionButtons();
            } else {
                window.HypnosisOptionOverride.removeOverride();
            }
        }
        if (typeof showNotification === 'function') {
            showNotification(`✨ Đã thanh tẩy nguyền rủa 【${card?.name || 'Chưa rõ'}】`, 'success');
        }
    },

    // Tạo cốt truyện thanh tẩy
    generatePurifyStory: function () {
        const card = this.lastPurifyCard;
        const statusConfig = card?.statusId ? SpecialStatusConfig[card.statusId] : null;
        const fullDesc = statusConfig?.fullDesc || card?.description || '';
        this.closeRest();
        // 🔧 Làm mới tất cả hiển thị
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        // 🔧 Kiểm tra và cập nhật giao diện ghi đè trạng thái thôi miên
        if (window.HypnosisOptionOverride) {
            if (window.HypnosisOptionOverride.shouldOverride()) {
                window.HypnosisOptionOverride.applyOverride();
                window.HypnosisOptionOverride.modifyOptionButtons();
            } else {
                window.HypnosisOptionOverride.removeOverride();
            }
        }
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Thanh tẩy suối nước nóng】 Tôi đã thực hiện nghi thức thanh tẩy tại suối nước nóng, tiêu tốn 50 vàng để xóa bỏ nguyền rủa 【${card?.name || 'Chưa rõ'}】 trên người. Hiệu ứng của nguyền rủa đó là: ${fullDesc}. Hãy tạo một đoạn cốt truyện về quá trình thanh tẩy, miêu tả cảm giác khi nguyền rủa bị loại bỏ.`;
        ACJTGame.sendToAI(prompt);
    },

    // Nghỉ ngơi hồi phục
    rest: function () {
        // Áp dụng hiệu ứng nghỉ ngơi của trạng thái đặc biệt (ví dụ: Dâm văn làm tăng đọa lạc)
        SpecialStatusManager.onRest();

        const healAmount = Math.floor(PlayerState.maxHp * 0.3);
        PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + healAmount);
        PlayerState.save();
        PlayerState.updateDisplay();

        // Kiểm tra xem có tăng đọa lạc hay không
        let extraInfo = '';
        const corruptionStatuses = SpecialStatusManager.getActive().filter(s => s.effect === 'corruptionPerRest');
        if (corruptionStatuses.length > 0) {
            const totalCorruption = corruptionStatuses.reduce((sum, s) => sum + s.value, 0);
            extraInfo = `<div style="color: #9c88ff; font-size: 12px; margin-top: 10px;">⚠️ Ảnh hưởng trạng thái đặc biệt: Đọa lạc +${totalCorruption}</div>`;
        }

        // 🔧 Lưu kết quả nghỉ ngơi
        this.lastRestResult = { healAmount };

        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">💚</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Đã hồi phục ${healAmount} điểm sinh mệnh</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">Sinh mệnh hiện tại: ${PlayerState.hp}/${PlayerState.maxHp}</div>
                ${extraInfo}
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="RestSystem.skipRestStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="RestSystem.generateRestStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // 🔧 Bỏ qua cốt truyện suối nước nóng
    skipRestStory: function () {
        const result = this.lastRestResult;
        const historyText = `Nghỉ ngơi tại suối nước nóng, hồi phục ${result.healAmount} điểm sinh mệnh`;
        ACJTGame.recordToHistory(historyText);
        this.closeRest();
    },

    // 🔧 Tạo cốt truyện suối nước nóng
    generateRestStory: function () {
        const result = this.lastRestResult;
        const floor = PlayerState.floor || 1;
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Tầng ${floor} của tòa tháp】 Tôi đang ngâm mình nghỉ ngơi trong suối nước nóng, hồi phục ${result.healAmount} điểm thể lực, cảm thấy tinh thần sảng khoái`;
        // 🔧 Khi tạo cốt truyện sẽ không ghi vào lịch sử quan trọng
        this.closeRest();
        ACJTGame.sendToAI(prompt);
    },

    // Hiển thị nâng cấp thẻ bài
    showUpgradeCards: function () {
        let cardsHtml = '';
        CardDeckManager.deck.forEach((card, index) => {
            if (card.upgraded) return; // Bỏ qua thẻ đã nâng cấp
            const typeColor = CardTypeColors[card.type] || '#666';
            cardsHtml += `
                <div onclick="RestSystem.upgradeCard(${index})" 
                     style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                            border: 2px solid ${typeColor}; border-radius: 8px; padding: 12px; width: 100px;
                            text-align: center; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="color: #ffd700; font-size: 10px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 12px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold;">${card.value} → ${card.value + 3}</div>
                </div>
            `;
        });

        document.getElementById('restModal').innerHTML = `
            <div style="color: #ffa502; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Chọn thẻ bài muốn nâng cấp</div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 500px; margin-bottom: 30px;">
                ${cardsHtml || '<div style="color: #666;">Không có thẻ bài nào có thể nâng cấp</div>'}
            </div>
            <button onclick="RestSystem.closeRest()"
                    style="padding: 10px 30px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                Hủy bỏ
            </button>
        `;
    },

    // Nâng cấp thẻ bài
    upgradeCard: function (index) {
        const card = CardDeckManager.deck[index];
        if (!card || card.upgraded) return;

        // Tiến hành nâng cấp khác nhau dựa trên loại thẻ
        let upgradeMsg = '';
        if (card.type === CardType.BUFF) {
            // Loại BUFF: Tăng số lá rút hoặc tăng năng lượng nhận được
            if (card.drawCards) {
                card.drawCards += 1;
                upgradeMsg = `Số lá rút tăng lên ${card.drawCards} lá`;
            } else if (card.gainEnergy) {
                card.gainEnergy += 1;
                upgradeMsg = `Năng lượng nhận được tăng lên +${card.gainEnergy}`;
            } else if (card.value) {
                card.value += 3;
                upgradeMsg = `Chỉ số tăng lên ${card.value}`;
            } else {
                upgradeMsg = `Hiệu quả được tăng cường`;
            }
        } else if (card.value !== undefined) {
            // Các thẻ khác có trường value: tăng 3 điểm chỉ số
            card.value += 3;
            upgradeMsg = `Chỉ số tăng lên ${card.value}`;
        } else {
            upgradeMsg = `Hiệu quả được tăng cường`;
        }

        card.upgraded = true;
        card.name = card.name + '+';

        saveCardDeck();
        CardDeckManager.renderDeck();

        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">⬆️</div>
                <div style="color: #ffa502; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Nâng cấp thành công!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 30px;">${card.name} ${upgradeMsg}</div>
                <button onclick="RestSystem.closeRest()"
                        style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2);
                               color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    Tiếp tục tiến bước
                </button>
            </div>
        `;
    },

    // Đóng suối nước nóng
    closeRest: function () {
        document.getElementById('restModal')?.remove();
        RouteSystem.showRouteSelection();
    }
};

// ==================== Hệ thống Thị trấn (Nhà nghỉ / Nhà thổ) ====================
const TownSystem = {
    // Mở nhà nghỉ
    openHotel: function () {
        if (PlayerState.floor > 1) {
            alert('Chỉ có thể sử dụng nhà nghỉ khi ở thị trấn (Tầng 0-1)!');
            return;
        }
        if (PlayerState.gold < 25) {
            alert('Không đủ vàng! Cần 25 vàng.');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'hotelModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 16px; padding: 30px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">🏨</div>
                <div style="color: #fff; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Nghỉ ngơi tại nhà nghỉ</div>
                <div style="color: #ffd700; font-size: 16px; margin-bottom: 20px;">Trả 25 vàng để hồi phục hoàn toàn thể lực</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 25px;">
                    HP hiện tại: ${PlayerState.hp}/${PlayerState.maxHp}<br>
                    Vàng hiện tại: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.confirmHotel()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Xác nhận ở lại
                    </button>
                    <button onclick="TownSystem.closeModal('hotelModal')"
                            style="padding: 12px 30px; background: #555; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Hủy bỏ
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // Xác nhận ở nhà nghỉ
    confirmHotel: function () {
        PlayerState.gold -= 25;
        const healedAmount = PlayerState.maxHp - PlayerState.hp;
        PlayerState.hp = PlayerState.maxHp;
        PlayerState.save();
        PlayerState.updateDisplay();

        document.getElementById('hotelModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 16px; padding: 30px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">😴</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Đã nghỉ ngơi xong!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 25px;">
                    Đã hồi phục ${healedAmount} điểm thể lực<br>
                    HP hiện tại: ${PlayerState.hp}/${PlayerState.maxHp}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipHotelStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="TownSystem.generateHotelStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // Bỏ qua cốt truyện nhà nghỉ
    skipHotelStory: function () {
        ACJTGame.recordToHistory('Đã nghỉ ngơi một đêm tại nhà nghỉ, hồi phục toàn bộ thể lực');
        this.closeModal('hotelModal');
    },

    // Tạo cốt truyện nhà nghỉ
    generateHotelStory: function () {
        this.closeModal('hotelModal');
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Thị trấn tòa tháp】 Tôi đã nghỉ ngơi một đêm tại nhà nghỉ, hồi phục toàn bộ thể lực. Hãy tạo một đoạn cốt truyện về việc nghỉ ngơi tại nhà nghỉ, có thể miêu tả môi trường nhà nghỉ, quá trình nghỉ ngơi hoặc một vài sự việc nhỏ xảy ra.`;
        ACJTGame.sendToAI(prompt);
    },

    // Cấu hình dữ liệu nhà thổ
    brothelConfig: {
        genders: ['Nam', 'Nữ', 'Futanari'],
        races: [
            // Hệ người
            'Người', 'Người lai', 'Quý tộc', 'Dân thường', 'Kẻ lang thang',
            // Hệ Tinh linh
            'Tinh linh', 'Hắc tinh linh', 'Cao cấp tinh linh', 'Mộc tinh linh', 'Huyết tinh linh', 'Nguyệt tinh linh', 'Tinh tú tinh linh',
            // Hệ Thú nhân
            'Thú nhân', 'Trư nhân', 'Ngưu đầu nhân', 'Cẩu đầu nhân', 'Lang nhân', 'Hổ nhân', 'Sư nhân', 'Báo nhân', 'Hùng nhân', 'Hồ nhân',
            // Hệ bò sát
            'Thằn lằn nhân', 'Long nhân', 'Xà nhân', 'Sấu nhân', 'Tắc kè nhân',
            // Hệ dưới nước
            'Ngư nhân', 'Sáp nhân', 'Chương ngư nhân', 'Hải yêu', 'Nhân ngư',
            // Hệ Ma vật
            'Goblin', 'Bán thân nhân', 'Người lùn', 'Khổng lồ nhân', 'Thực nhân ma', 'Địa tinh',
            // Hệ Ác ma
            'Mị ma', 'Mộng ma', 'Ác ma', 'Đọa thiên sứ', 'Địa ngục khuyển nhân',
            // Hệ Bất tử
            'Hút máu quỷ', 'U linh', 'Khô lâu nhân', 'Cương thi',
            // Khác
            'Slime nhân', 'Nguyên tố nhân', 'Cơ giới nhân', 'Bán cơ giới nhân', 'Xúc tu quái', 'Côn trùng nhân', 'Nhện nhân', 'Bọ cạp nhân'
        ],
        fetishes: [
            // Quan hệ cơ bản
            'Liếm tiểu huyệt', 'Túc giao', 'Hậu đình giao', 'Chèn vào tiểu huyệt', 'Khẩu giao', 'Nhũ giao', 'Thủ giao', 'Dịch giao', 'Cổ giao', 'Phúc giao',
            'Thâm hầu', 'Nhan xạ', 'Nội xạ', 'Liếm chân', 'Liếm hậu môn', 'Liếm nách', 'Liếm đầu ngực', 'Mút đầu ngực', 'Cắn đầu ngực',

            // Tư thế
            '69', 'Cưỡi ngựa', 'Hậu nhập', 'Truyền giáo sĩ', 'Nằm nghiêng', 'Đứng', 'Trồng cây chuối', 'Áp chế', 'Bối đức',

            // BDSM
            'Trói buộc play', 'Nhỏ nến', 'Quất roi', 'Ngạt thở play', 'Thừng phược', 'Còng tay', 'Xiềng chân', 'Bịt miệng', 'Bịt mắt', 'Vòng cổ',
            'Điều giáo', 'Sỉ nhục', 'Trừng phạt', 'Nô lệ play', 'Chủ tớ play', 'Thú cưng play', 'Dẫm đạp', 'Chà đạp', 'Làm ngạt',

            // Nhập vai
            'Nhập vai', 'Đồng phục quyến rũ', 'Y tá', 'Hầu gái', 'Học sinh', 'Giáo viên', 'Cảnh sát', 'Tù nhân',
            'Tu nữ', 'Kimono', 'Sườn xám', 'Thỏ ngọc', 'Mèo nữ', 'Chó nữ',

            // Play đặc biệt
            'Quan hệ nhiều người', '3P', '4P', 'Quần giao', 'Luân gian', 'Xem thủ dâm', 'Bị xem', 'Quay lén', 'Phô bày',
            'Dã ngoại play', 'Nơi công cộng', 'Xê chấn', 'Phòng tắm play', 'Phòng bếp play',

            // Thể dịch
            'Nuốt tinh', 'Uống nước tiểu', 'Thủy triều (squirt)', 'Phun sữa', 'Chảy nước miếng', 'Lè lưỡi', 'Liếm mồ hôi',

            // Cường độ
            'Cao trào liên tục', 'Ép buộc cao trào', 'Nhịn cao trào', 'Đối xử thô bạo', 'Vuốt ve dịu dàng', 'Giày vò chậm rãi', 'Đâm rút nhanh',
            'Đâm sâu', 'Ma sát nông', 'Kiểm soát cực hạn (edge)',

            // Sở thích đặc biệt
            'Luyến túc', 'Luyến nhũ', 'Luyến đồn', 'Luyến dịch', 'Luyến phát', 'Luyến tất (vớ)', 'Luyến hài (giày)', 'Luyến nội y',
            'Ngửi mùi cơ thể', 'Liếm mùi cơ thể', 'Mùi mồ hôi', 'Mùi chân', 'Mùi nách',

            // Đạo cụ
            'Gậy rung', 'Trứng rung', 'Dương vật giả', 'Nút hậu môn', 'Kẹp ngực', 'Kẹp âm hộ', 'Dụng cụ mở rộng', 'Đai trinh tiết',

            // Cực hạn
            'Làm ngạt', 'Điện giật', 'Châm kim', 'Thụt rửa', 'Mở rộng', 'Quyền giao (fisting)', 'Song huyệt', 'Tam huyệt tề khai',
            'Ảo tưởng thú giao', 'Xúc tu play', 'Sản noãn play', 'Bụng to', 'Thôi miên', 'Thuốc',

            // Tâm lý
            'Nhục nhã play', 'Sỉ nhục bằng lời nói', 'Ép buộc biểu diễn', 'Chụp ảnh', 'Quay phim', 'Livestream', 'Trưng bày',
            'Huấn luyện phục tùng', 'Phá trinh', 'Đoạt nụ hôn đầu', 'Giải tỏa sau khi cấm dục'
        ]
    },

    // Tạo khách hàng ngẫu nhiên
    generateRandomClient: function () {
        const config = this.brothelConfig;
        const gender = config.genders[Math.floor(Math.random() * config.genders.length)];
        const race = config.races[Math.floor(Math.random() * config.races.length)];

        // Chọn ngẫu nhiên 3 sở thích không trùng lặp
        const shuffled = [...config.fetishes].sort(() => 0.5 - Math.random());
        const selectedFetishes = shuffled.slice(0, 3);

        // Giá ngẫu nhiên từ 50-200
        const price = Math.floor(Math.random() * 151) + 50;

        return {
            gender,
            race,
            fetishes: selectedFetishes,
            price
        };
    },

    // Mở nhà thổ
    openBrothel: function () {
        if (PlayerState.floor > 1) {
            alert('Chỉ có thể sử dụng nhà thổ khi ở thị trấn (Tầng 0-1)!');
            return;
        }

        // Tạo 3 khách hàng ngẫu nhiên
        const clients = [
            this.generateRandomClient(),
            this.generateRandomClient(),
            this.generateRandomClient()
        ];

        // Lưu thông tin khách hàng
        this.currentClients = clients;

        const modal = document.createElement('div');
        modal.id = 'brothelModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
            overflow-y: auto; padding: 20px; box-sizing: border-box;
            backdrop-filter: blur(5px);
        `;

        const cardsHTML = clients.map((client, index) => `
            <div style="background: linear-gradient(135deg, rgba(80, 40, 60, 0.95), rgba(100, 50, 70, 0.95)); 
                        border-radius: 16px; padding: 20px; 
                        border: 3px solid rgba(255, 215, 0, 0.6);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1);
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 40px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.2)'; this.style.borderColor='rgba(255, 215, 0, 0.9)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1)'; this.style.borderColor='rgba(255, 215, 0, 0.6)'">
                
                <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; 
                            background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
                            pointer-events: none;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="color: #ffd700; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">Khách hàng ${index + 1}</div>
                        <div style="color: #ffd700; font-size: 20px; font-weight: bold; 
                                    background: rgba(0, 0, 0, 0.4); padding: 4px 12px; border-radius: 20px;
                                    border: 2px solid rgba(255, 215, 0, 0.5);
                                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);">💰 ${client.price}</div>
                    </div>
                    
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-bottom: 10px;
                                border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: #fff; margin-bottom: 6px; font-size: 14px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);">
                            <span style="color: #ffd700; font-weight: bold;">Giới tính:</span><span style="color: #ffe4b5;">${client.gender}</span>
                            <span style="color: #ffd700; font-weight: bold; margin-left: 15px;">Chủng tộc:</span><span style="color: #ffe4b5;">${client.race}</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <div style="color: #ffd700; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);">Sở thích (Fetish):</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${client.fetishes.map(f => `
                                <span style="background: linear-gradient(135deg, rgba(255, 107, 157, 0.4), rgba(255, 71, 87, 0.4)); 
                                             padding: 6px 12px; border-radius: 20px; font-size: 12px;
                                             color: #fff; font-weight: bold;
                                             border: 1px solid rgba(255, 107, 157, 0.6);
                                             box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
                                             text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);">${f}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button onclick="TownSystem.selectClient(${index})"
                            style="width: 100%; padding: 12px; 
                                   background: linear-gradient(135deg, #ff4757, #ff6b81);
                                   color: #fff; border: none; border-radius: 12px; cursor: pointer; 
                                   font-size: 15px; font-weight: bold;
                                   box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
                                   border: 2px solid rgba(255, 255, 255, 0.3);
                                   text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                                   transition: all 0.3s ease;"
                            onmouseover="this.style.background='linear-gradient(135deg, #ff6b81, #ff4757)'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 71, 87, 0.6)'"
                            onmouseout="this.style.background='linear-gradient(135deg, #ff4757, #ff6b81)'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 71, 87, 0.4)'">
                        Chọn vị khách này
                    </button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="background: url(img/background/jy_bg.png) center center / cover no-repeat;
                        border-radius: 20px;
                        padding: 80px 40px 40px 40px;
                        max-width: 1200px;
                        width: 95%;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                        border: 3px solid rgba(255, 215, 0, 0.4);
                        position: relative;
                        overflow-y: auto;">
                
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 150px;
                            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
                            pointer-events: none; z-index: 0;"></div>
                
                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
                            background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
                            pointer-events: none; z-index: 0;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="text-align: center; margin-bottom: 30px; 
                                background: rgba(0, 0, 0, 0.6); padding: 20px; border-radius: 16px;
                                border: 2px solid rgba(255, 215, 0, 0.4);
                                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
                        <div style="font-size: 72px; margin-bottom: 10px; filter: drop-shadow(0 0 20px rgba(255, 107, 157, 0.8));">🏮</div>
                        <div style="color: #ffd700; font-size: 32px; font-weight: bold; margin-bottom: 10px;
                                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.8);
                                    font-family: 'STKaiti', 'KaiTi', serif;">Tiếp khách tại nhà thổ</div>
                        <div style="color: #ffe4b5; font-size: 16px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);">Vui lòng chọn một vị khách để phục vụ</div>
                    </div>
                    
                    <style>
                        .brothel-cards-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                            margin-bottom: 25px;
                        }
                        @media (max-width: 900px) {
                            .brothel-cards-grid {
                                grid-template-columns: repeat(2, 1fr);
                            }
                        }
                        @media (max-width: 600px) {
                            .brothel-cards-grid {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>
                    
                    <div class="brothel-cards-grid">
                        ${cardsHTML}
                    </div>
                    
                    <button onclick="TownSystem.closeModal('brothelModal')"
                            style="width: 100%; padding: 15px; 
                                   background: rgba(0, 0, 0, 0.7); 
                                   color: #ffd700; border: 2px solid rgba(255, 215, 0, 0.5); 
                                   border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: bold;
                                   text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                                   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                                   transition: all 0.3s ease;"
                            onmouseover="this.style.background='rgba(0, 0, 0, 0.85)'; this.style.borderColor='rgba(255, 215, 0, 0.8)'; this.style.boxShadow='0 6px 20px rgba(255, 215, 0, 0.3)'"
                            onmouseout="this.style.background='rgba(0, 0, 0, 0.7)'; this.style.borderColor='rgba(255, 215, 0, 0.5)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.5)'">
                        Rời khỏi nhà thổ
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // Chọn khách hàng
    selectClient: function (index) {
        const client = this.currentClients[index];
        this.selectedClient = client;

        const modal = document.getElementById('brothelModal');
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #c44569, #ff6b9d); border-radius: 16px; padding: 25px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">💰</div>
                <div style="color: #ffd700; font-size: 22px; font-weight: bold; margin-bottom: 12px;">Phục vụ hoàn tất!</div>
                <div style="color: #fff; font-size: 14px; margin-bottom: 8px;">
                    Thông tin khách: ${client.gender} · ${client.race}
                </div>
                <div style="color: #fff; font-size: 13px; margin-bottom: 8px;">
                    Sở thích: ${client.fetishes.join('、')}
                </div>
                <div style="color: #fff; font-size: 15px; margin-bottom: 20px;">
                    Nhận được ${client.price} vàng<br>
                    Đọa lạc +5 | Vàng hiện tại: ${PlayerState.gold + client.price}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="TownSystem.generateBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;

        // Cập nhật trạng thái người chơi
        PlayerState.gold += client.price;
        PlayerState.corruption += 5;
        PlayerState.save();
        PlayerState.updateDisplay();

        // Đồng bộ điểm đọa lạc vào biến trạng thái (nếu có)
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }
    },

    // Cập nhật xem trước bán trinh/bán xuân (nếu cần)
    updateBrothelPreview: function () {
        const vaginal = parseInt(document.getElementById('brothelVaginal')?.value) || 0;
        const anal = parseInt(document.getElementById('brothelAnal')?.value) || 0;
        const breast = parseInt(document.getElementById('brothelBreast')?.value) || 0;
        const oral = parseInt(document.getElementById('brothelOral')?.value) || 0;
        const foot = parseInt(document.getElementById('brothelFoot')?.value) || 0;
        const hand = parseInt(document.getElementById('brothelHand')?.value) || 0;
        const total = vaginal + anal + breast + oral + foot + hand;
        const preview = document.getElementById('brothelPreview');
        if (preview) {
            preview.innerHTML = `Tổng cộng: ${total} lần | Dự kiến nhận: ${40 * total} vàng | Đọa lạc +${5 * total}`;
        }
    },

    // Lấy chi tiết phục vụ
    getBrothelDetails: function () {
        return {
            vaginal: parseInt(document.getElementById('brothelVaginal')?.value) || 0,
            anal: parseInt(document.getElementById('brothelAnal')?.value) || 0,
            breast: parseInt(document.getElementById('brothelBreast')?.value) || 0,
            oral: parseInt(document.getElementById('brothelOral')?.value) || 0,
            foot: parseInt(document.getElementById('brothelFoot')?.value) || 0,
            hand: parseInt(document.getElementById('brothelHand')?.value) || 0
        };
    },

    // Tạo văn bản mô tả phục vụ
    getBrothelDescription: function (details) {
        const parts = [];
        if (details.vaginal > 0) parts.push(`Âm đạo ${details.vaginal} lần`);
        if (details.anal > 0) parts.push(`Hậu môn ${details.anal} lần`);
        if (details.breast > 0) parts.push(`Nhũ giao ${details.breast} lần`);
        if (details.oral > 0) parts.push(`Khẩu giao ${details.oral} lần`);
        if (details.foot > 0) parts.push(`Túc giao ${details.foot} lần`);
        if (details.hand > 0) parts.push(`Thủ giao ${details.hand} lần`);
        return parts.length > 0 ? parts.join('、') : 'Không';
    },

    // Xác nhận phục vụ tại nhà thổ
    confirmBrothel: function () {
        const details = this.getBrothelDetails();
        const times = details.vaginal + details.anal + details.breast + details.oral + details.foot + details.hand;

        if (times <= 0) {
            if (typeof showNotification === 'function') {
                showNotification('❗ Vui lòng chọn ít nhất một loại dịch vụ', 'warning');
            }
            return;
        }

        const goldGain = 40 * times;
        const corruptionGain = 5 * times;

        PlayerState.gold += goldGain;
        PlayerState.corruption += corruptionGain;
        PlayerState.save();
        PlayerState.updateDisplay();

        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        this.lastBrothelDetails = details;
        this.lastBrothelTimes = times;
        this.lastBrothelGold = goldGain;
        this.lastBrothelCorruption = corruptionGain;

        const descText = this.getBrothelDescription(details);

        document.getElementById('brothelModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #c44569, #ff6b9d); border-radius: 16px; padding: 25px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">💰</div>
                <div style="color: #ffd700; font-size: 22px; font-weight: bold; margin-bottom: 12px;">Giao dịch hoàn tất!</div>
                <div style="color: #fff; font-size: 14px; margin-bottom: 8px;">
                    Nội dung phục vụ: ${descText}
                </div>
                <div style="color: #fff; font-size: 15px; margin-bottom: 20px;">
                    Tổng cộng ${times} lần | Nhận được ${goldGain} vàng<br>
                    Đọa lạc +${corruptionGain} | Vàng hiện tại: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="TownSystem.generateBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // Bỏ qua cốt truyện nhà thổ
    skipBrothelStory: function () {
        const client = this.selectedClient;
        if (!client) {
            this.closeModal('brothelModal');
            return;
        }

        const description = `Đã tiếp đón một vị khách chủng tộc ${client.race}, giới tính ${client.gender} có sở thích ${client.fetishes.join('、')}, kiếm được ${client.price} vàng`;
        ACJTGame.recordToHistory(description);

        if (typeof window.matrixManager !== 'undefined' && window.matrixManager.addEvent) {
            window.matrixManager.addEvent({
                type: 'brothel',
                description: description,
                timestamp: Date.now()
            });
        }

        this.closeModal('brothelModal');
    },

    // Tạo cốt truyện nhà thổ
    generateBrothelStory: function () {
        const client = this.selectedClient;
        if (!client) {
            this.closeModal('brothelModal');
            return;
        }

        this.closeModal('brothelModal');

        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Tiếp khách nhà thổ】 Tôi đã tiếp một vị khách tại nhà thổ. Thông tin khách: Giới tính ${client.gender}, chủng tộc ${client.race}, sở thích ${client.fetishes.join('、')}. Tôi đã phục vụ vị khách này và nhận được ${client.price} vàng. Hãy tạo một đoạn cốt truyện chi tiết về việc tiếp khách, miêu tả chi tiết quá trình phục vụ, phản ứng của khách và sự thay đổi tâm lý của nhân vật chính. Điểm đọa lạc tăng thêm 5 điểm.`;

        ACJTGame.sendToAI(prompt);
    },

    // Đóng cửa sổ pop-up
    closeModal: function (modalId) {
        document.getElementById(modalId)?.remove();
    },

    // Cập nhật trạng thái các nút (chỉ khả dụng tại Tầng 0 và Tầng 1)
    updateButtons: function () {
        const hotelBtn = document.getElementById('hotelBtn');
        const brothelBtn = document.getElementById('brothelBtn');
        const blackMarketBtn = document.getElementById('blackMarketBtn');
        const churchBtn = document.getElementById('churchBtn');
        const isInTown = PlayerState.floor <= 1;

        if (hotelBtn) {
            hotelBtn.style.opacity = isInTown ? '1' : '0.5';
            hotelBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (brothelBtn) {
            brothelBtn.style.opacity = isInTown ? '1' : '0.5';
            brothelBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (blackMarketBtn) {
            blackMarketBtn.style.opacity = isInTown ? '1' : '0.5';
            blackMarketBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (churchBtn) {
            churchBtn.style.opacity = isInTown ? '1' : '0.5';
            churchBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
    },

    // ==================== Hệ thống Giáo đường ====================

    // Lấy số lượng trạng thái nguyền rủa có thể xóa
    getCurseStatusCount: function () {
        let count = 0;
        Object.keys(SpecialStatusManager.statuses).forEach(statusId => {
            const status = SpecialStatusManager.statuses[statusId];
            const isStartingStatus = statusId.startsWith('start_');
            const isBodyMod = statusId.startsWith('mod_');
            const isProtectedSource = status.source === 'starting' || status.source === 'blackmarket';
            const isProtected = isStartingStatus || isBodyMod || isProtectedSource;
            if (!isProtected) count++;
        });
        return count;
    },

    openChurch: function () {
        if (PlayerState.floor > 1) {
            if (typeof showNotification === 'function') {
                showNotification('❗ Chỉ có thể ghé thăm giáo đường khi ở thị trấn (Tầng 0-1)', 'warning');
            }
            return;
        }

        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const curseStatusCount = this.getCurseStatusCount();
        // Điều kiện để làm lễ rửa tội: Có thẻ nguyền rủa hoặc trạng thái nguyền rủa, và có đủ vàng
        const canPurify = (curseCards.length > 0 || curseStatusCount > 0) && PlayerState.gold >= 300;

        const modal = document.createElement('div');
        modal.id = 'churchModal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; max-width: 500px; text-align: center;">
                <div style="font-size: 60px; margin-bottom: 15px;">⛪</div>
                <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Giáo đường - Lễ Rửa Tội</div>
                <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">
                    Tiêu tốn 300 vàng để xóa bỏ toàn bộ thẻ bài nguyền rủa và trạng thái tiêu cực
                </div>
                <div style="color: #ff6b81; font-size: 16px; margin-bottom: 5px;">
                    Thẻ bài nguyền rủa: ${curseCards.length} lá
                </div>
                <div style="color: #ff6b81; font-size: 16px; margin-bottom: 10px;">
                    Trạng thái nguyền rủa: ${curseStatusCount} cái
                </div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 25px;">
                    Vàng hiện có: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.confirmChurch()" ${canPurify ? '' : 'disabled'}
                            style="padding: 12px 30px; background: ${canPurify ? 'linear-gradient(135deg, #ffd700, #ffb347)' : '#555'};
                                   color: ${canPurify ? '#000' : '#888'}; border: none; border-radius: 8px; 
                                   cursor: ${canPurify ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold;">
                        Lễ Rửa Tội (300💰)
                    </button>
                    <button onclick="TownSystem.closeModal('churchModal')"
                            style="padding: 12px 30px; background: #555; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Hủy bỏ
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // Xác nhận làm lễ rửa tội
    confirmChurch: function () {
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const curseStatusCount = this.getCurseStatusCount();
        if ((curseCards.length === 0 && curseStatusCount === 0) || PlayerState.gold < 300) return;

        PlayerState.gold -= 300;

        const curseStatusIds = new Set();
        const removedCurses = [];
        curseCards.forEach(card => {
            removedCurses.push(card.name);
            if (card.statusId) {
                curseStatusIds.add(card.statusId);
            }
        });

        const removedStatuses = [];
        Object.keys(SpecialStatusManager.statuses).forEach(statusId => {
            const status = SpecialStatusManager.statuses[statusId];

            const isStartingStatus = statusId.startsWith('start_');
            const isBodyMod = statusId.startsWith('mod_');
            const isProtectedSource = status.source === 'starting' || status.source === 'blackmarket';
            const isProtected = isStartingStatus || isBodyMod || isProtectedSource;

            const isFromCurseCard = curseStatusIds.has(statusId);
            const isCurseSource = status.source === 'curse';
            const isOldData = status.source === undefined;

            if (!isProtected && (isFromCurseCard || isCurseSource || isOldData)) {
                removedStatuses.push(statusId);
            }
        });

        removedStatuses.forEach(statusId => {
            SpecialStatusManager.remove(statusId);
        });

        console.log('[Giáo đường rửa tội] Đã xóa thẻ nguyền rủa:', removedCurses);
        console.log('[Giáo đường rửa tội] Đã xóa trạng thái đặc biệt:', removedStatuses);

        CardDeckManager.deck = CardDeckManager.deck.filter(c => c.type !== CardType.CURSE);
        saveCardDeck();
        CardDeckManager.renderDeck();

        PlayerState.save();
        PlayerState.updateDisplay();

        this.lastChurchCurses = removedCurses;
        this.lastChurchStatuses = removedStatuses;

        const allRemoved = [...removedCurses, ...removedStatuses.filter(s => !removedCurses.includes(s))];
        const historyText = `Đã làm lễ rửa tội tại giáo đường, xóa bỏ ${removedCurses.length} thẻ nguyền rủa và ${removedStatuses.length} trạng thái nguyền rủa: ${allRemoved.join('、')}`;
        ACJTGame.recordToHistory(historyText);

        const cursesText = removedCurses.length > 0 ? removedCurses.join('、') : 'Không';
        const statusesText = removedStatuses.length > 0 ? removedStatuses.join('、') : 'Không';

        document.getElementById('churchModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; max-width: 500px; text-align: center;">
                <div style="font-size: 72px; margin-bottom: 20px;">✨</div>
                <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Rửa tội hoàn tất!</div>
                <div style="color: #2ed573; font-size: 16px; margin-bottom: 5px;">
                    Xóa thẻ nguyền rủa: ${removedCurses.length} lá
                </div>
                <div style="color: #2ed573; font-size: 16px; margin-bottom: 10px;">
                    Xóa trạng thái nguyền rủa: ${removedStatuses.length} cái
                </div>
                <div style="color: #ff6b81; font-size: 11px; margin-bottom: 5px; max-height: 60px; overflow-y: auto;">
                    ${statusesText}
                </div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">
                    -300💰 Còn lại: ${PlayerState.gold} vàng
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipChurchStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="TownSystem.generateChurchStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ffd700, #ffb347);
                                   color: #000; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // Bỏ qua cốt truyện giáo đường
    skipChurchStory: function () {
        const curseCount = this.lastChurchCurses?.length || 0;
        const statusCount = this.lastChurchStatuses?.length || 0;
        this.closeModal('churchModal');
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        if (typeof showNotification === 'function') {
            showNotification(`✨ Rửa tội hoàn tất, đã xóa ${curseCount} thẻ nguyền rủa và ${statusCount} trạng thái nguyền rủa`, 'success');
        }
    },

    // Tạo cốt truyện giáo đường
    generateChurchStory: function () {
        const curses = this.lastChurchCurses || [];
        const statuses = this.lastChurchStatuses || [];
        const allRemoved = [...curses, ...statuses.filter(s => !curses.includes(s))];
        this.closeModal('churchModal');
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Lễ rửa tội tại giáo đường】 Tôi đã tiêu tốn 300 vàng tại giáo đường để thực hiện nghi thức rửa tội, xóa sạch ${curses.length} lá thẻ nguyền rủa và ${statuses.length} trạng thái nguyền rủa: ${allRemoved.join('、')}. Hãy tạo một đoạn cốt truyện về quá trình rửa tội, miêu tả cách linh mục giúp tôi trục xuất nguyền rủa, cũng như cảm giác khi nguyền rủa biến mất.`;
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== Cấu hình Cải tạo Cơ thể (40 loại) ====================
const BodyModConfig = {
    // ========== Hệ Ma tộc (8 loại) ==========
    succubus: {
        id: 'succubus', name: 'Mị ma hóa', icon: '😈', price: 200,
        description: 'Cải tạo cơ thể thành thể chất Mị ma, tỏa ra hơi thở quyến rũ',
        effects: { corruption: 50, attack: 3, defense: 3 },
        effectText: 'Đọa lạc +50, Tấn công +3, Phòng thủ +3'
    },
    demon_blood: {
        id: 'demon_blood', name: 'Huyết mạch Dâm ma', icon: '🩸', price: 300,
        description: 'Tiêm huyết dịch Dâm ma, nhận được sức mạnh Ma tộc hùng mạnh',
        effects: { corruption: 60, attack: 5, defense: 5 },
        effectText: 'Đọa lạc +60, Tấn công +5, Phòng thủ +5'
    },
    demon_tail: {
        id: 'demon_tail', name: 'Cấy ghép đuôi', icon: '🦯', price: 120,
        description: 'Cấy ghép đuôi Ma tộc, tăng cường khả năng thăng bằng và chiến đấu',
        effects: { corruption: 25, attack: 2, defense: 2 },
        effectText: 'Đọa lạc +25, Tấn công +2, Phòng thủ +2'
    },
    demon_horns: {
        id: 'demon_horns', name: 'Mọc sừng', icon: '🦌', price: 100,
        description: 'Trên đầu mọc ra sừng Ma tộc, tăng sức tấn công',
        effects: { corruption: 30, attack: 4 },
        effectText: 'Đọa lạc +30, Tấn công +4'
    },
    demon_wings: {
        id: 'demon_wings', name: 'Cấy ghép cánh', icon: '🦇', price: 180,
        description: 'Cấy ghép cánh Ma tộc, có thể bay ở khoảng cách ngắn',
        effects: { corruption: 35, attack: 3, defense: 3 },
        effectText: 'Đọa lạc +35, Tấn công +3, Phòng thủ +3'
    },
    demon_eyes: {
        id: 'demon_eyes', name: 'Cấy ghép Ma nhãn', icon: '👁️', price: 150,
        description: 'Sở hữu đôi mắt yêu dị của Ma tộc, có thể mê hoặc kẻ thù',
        effects: { corruption: 35, enemyAttackReduce: 3 },
        effectText: 'Đọa lạc +35, Tấn công kẻ địch -3'
    },
    demon_claws: {
        id: 'demon_claws', name: 'Cải tạo Ma trảo', icon: '🖐️', price: 140,
        description: 'Ngón tay biến thành ma trảo sắc nhọn',
        effects: { corruption: 30, attack: 5 },
        effectText: 'Đọa lạc +30, Tấn công +5'
    },
    full_demon: {
        id: 'full_demon', name: 'Ma hóa hoàn toàn', icon: '👿', price: 500,
        description: 'Hoàn toàn biến thành Ma tộc, nhận sức mạnh cực đại nhưng đọa lạc đến cùng cực',
        effects: { corruption: 100, attack: 10, defense: 5, maxHp: 30 },
        effectText: 'Đọa lạc +100, Tấn công +10, Phòng thủ +5, HP +30'
    },

    // ========== Cải tạo Ngực (6 loại) ==========
    breast_enlarge: {
        id: 'breast_enlarge', name: 'Phẫu thuật nâng ngực', icon: '🍈', price: 80,
        description: 'Sử dụng dược tề ma pháp để làm ngực to lên',
        effects: { corruption: 20, defense: 2 },
        effectText: 'Đọa lạc +20, Phòng thủ +2'
    },
    magic_breast: {
        id: 'magic_breast', name: 'Cải tạo Ma nhũ', icon: '🥛', price: 150,
        description: 'Khiến ngực có thể tiết ra sữa ma lực',
        effects: { corruption: 30, defense: 4 },
        effectText: 'Đọa lạc +30, Phòng thủ +4'
    },
    nipple_ring: {
        id: 'nipple_ring', name: 'Xuyên khuyên ngực', icon: '💎', price: 90,
        description: 'Xuyên vòng bạc trang trí vào đầu ngực',
        effects: { corruption: 20, hDamageBonus: 5 },
        effectText: 'Đọa lạc +20, Sát thương H +5'
    },
    lactation: {
        id: 'lactation', name: 'Tiết sữa vĩnh viễn', icon: '🍼', price: 130,
        description: 'Khiến ngực vĩnh viễn tiết sữa',
        effects: { corruption: 30, hpPerTurn: 1, defense: 2 },
        effectText: 'Đọa lạc +30, Mỗi lượt +1HP, Phòng thủ +2'
    },
    breast_tattoo: {
        id: 'breast_tattoo', name: 'Dâm văn vùng ngực', icon: '🎀', price: 100,
        description: 'Khắc lên vùng ngực những đường văn dâm mị',
        effects: { corruption: 25, hDamageBonus: 5 },
        effectText: 'Đọa lạc +25, Sát thương H +5'
    },
    mega_breast: {
        id: 'mega_breast', name: 'Cực đại hóa ngực', icon: '🎈', price: 200,
        description: 'Khiến ngực to lên đến giới hạn',
        effects: { corruption: 40, defense: 5, attack: -1 },
        effectText: 'Đọa lạc +40, Phòng thủ +5, Tấn công -1'
    },

    // ========== Cải tạo Hạ bộ (8 loại) ==========
    pussy_enhance: {
        id: 'pussy_enhance', name: 'Cường hóa mật huyệt', icon: '🌸', price: 160,
        description: 'Tăng cường cơ âm đạo, nâng cao uy lực kỹ năng H',
        effects: { corruption: 40, hDamageBonus: 15 },
        effectText: 'Đọa lạc +40, Sát thương kỹ năng H +15'
    },
    anal_develop: {
        id: 'anal_develop', name: 'Khai phá cúc huyệt', icon: '🍑', price: 140,
        description: 'Khai phá hậu huyệt, nhận được nguồn khoái cảm mới',
        effects: { corruption: 35, defense: 3 },
        effectText: 'Đọa lạc +35, Phòng thủ +3'
    },
    womb_corrupt: {
        id: 'womb_corrupt', name: 'Tử cung đọa lạc', icon: '💜', price: 200,
        description: 'Khiến tử cung hoàn toàn đọa lạc, nhận được khả năng sinh sản của Ma tộc',
        effects: { corruption: 50, maxHp: 20 },
        effectText: 'Đọa lạc +50, HP tối đa +20'
    },
    clit_enhance: {
        id: 'clit_enhance', name: 'Cường hóa âm vật', icon: '💢', price: 120,
        description: 'Khiến âm vật trở nên cực kỳ nhạy cảm',
        effects: { corruption: 30, hDamageBonus: 10, hpOnHit: 1 },
        effectText: 'Đọa lạc +30, Sát thương H +10, Trúng đòn +1HP'
    },
    double_pussy: {
        id: 'double_pussy', name: 'Cải tạo song huyệt', icon: '🔮', price: 250,
        description: 'Cải tạo ra âm đạo thứ hai',
        effects: { corruption: 55, hDamageBonus: 10 },
        effectText: 'Đọa lạc +55, Sát thương H +10'
    },
    tentacle_womb: {
        id: 'tentacle_womb', name: 'Tử cung xúc tu', icon: '🦑', price: 280,
        description: 'Cấy xúc tu vào trong tử cung, có thể chủ động bắt giữ',
        effects: { corruption: 60, attack: 4, hDamageBonus: 10 },
        effectText: 'Đọa lạc +60, Tấn công +4, Sát thương H +10'
    },
    egg_laying: {
        id: 'egg_laying', name: 'Thể chất đẻ trứng', icon: '🥚', price: 180,
        description: 'Nhận được khả năng đẻ trứng của Ma tộc',
        effects: { corruption: 45, maxHp: 15, hpPerTurn: 1 },
        effectText: 'Đọa lạc +45, HP +15, Mỗi lượt +1HP'
    },
    virgin_restore: {
        id: 'virgin_restore', name: 'Tái tạo màng trinh', icon: '🌹', price: 100,
        description: 'Khiến màng trinh có khả năng tự động tái tạo',
        effects: { corruption: 20, defense: 2 },
        effectText: 'Đọa lạc +20, Phòng thủ +2'
    },

    // ========== Cải tạo Thể chất (10 loại) ==========
    lewd_tattoo: {
        id: 'lewd_tattoo', name: 'Khắc ấn dâm văn', icon: '🔯', price: 120,
        description: 'Khắc dâm văn lên cơ thể, tăng cường kỹ năng H',
        effects: { corruption: 30, hDamageBonus: 10 },
        effectText: 'Đọa lạc +30, Sát thương kỹ năng H +10'
    },
    charm_body: {
        id: 'charm_body', name: 'Cải tạo mị thể', icon: '💃', price: 180,
        description: 'Cải tạo toàn thân thành một cơ thể đầy mê hoặc',
        effects: { corruption: 40, attack: 5 },
        effectText: 'Đọa lạc +40, Tấn công +5'
    },
    sensitive_body: {
        id: 'sensitive_body', name: 'Thể chất nhạy cảm', icon: '💗', price: 100,
        description: 'Tăng độ nhạy cảm của cơ thể, hồi phục thể lực trong chiến đấu',
        effects: { corruption: 25, hpPerTurn: 2 },
        effectText: 'Đọa lạc +25, Mỗi lượt hồi 2HP'
    },
    heat_body: {
        id: 'heat_body', name: 'Thể chất phát tình', icon: '🔥', price: 150,
        description: 'Cơ thể luôn trong trạng thái phát tình nhẹ',
        effects: { corruption: 35, attack: 4 },
        effectText: 'Đọa lạc +35, Tấn công +4'
    },
    body_enhance: {
        id: 'body_enhance', name: 'Cường hóa nhục thân', icon: '💪', price: 100,
        description: 'Tăng cường nhục thân, nâng giới hạn sinh mệnh',
        effects: { corruption: 20, maxHp: 15 },
        effectText: 'Đọa lạc +20, HP tối đa +15'
    },
    elastic_body: {
        id: 'elastic_body', name: 'Cơ thể dẻo dai', icon: '🤸', price: 130,
        description: 'Cơ thể trở nên cực kỳ mềm mại và linh hoạt',
        effects: { corruption: 25, defense: 4 },
        effectText: 'Đọa lạc +25, Phòng thủ +4'
    },
    regeneration: {
        id: 'regeneration', name: 'Khả năng tái sinh', icon: '♻️', price: 200,
        description: 'Nhận được khả năng tái sinh chậm rãi',
        effects: { corruption: 35, hpPerTurn: 3 },
        effectText: 'Đọa lạc +35, Mỗi lượt +3HP'
    },
    pain_pleasure: {
        id: 'pain_pleasure', name: 'Chuyển hóa đau đớn', icon: '😵', price: 170,
        description: 'Chuyển hóa đau đớn thành khoái cảm',
        effects: { corruption: 40, hpOnHit: 4, defense: -2 },
        effectText: 'Đọa lạc +40, Trúng đòn +4HP, Phòng thủ -2'
    },
    immortal_body: {
        id: 'immortal_body', name: 'Thân thể bất tử', icon: '☠️', price: 350,
        description: 'Nhận được một cơ thể gần như bất tử',
        effects: { corruption: 70, maxHp: 40, hpPerTurn: 2 },
        effectText: 'Đọa lạc +70, HP +40, Mỗi lượt +2HP'
    },
    slime_body: {
        id: 'slime_body', name: 'Slime hóa', icon: '🫧', price: 220,
        description: 'Cơ thể trở nên mềm dẻo như Slime',
        effects: { corruption: 45, defense: 6, attack: -2 },
        effectText: 'Đọa lạc +45, Phòng thủ +6, Tấn công -2'
    },

    // ========== Cải tạo Đặc biệt (8 loại) ==========
    tentacle_implant: {
        id: 'tentacle_implant', name: 'Cấy ghép xúc tu', icon: '🐙', price: 220,
        description: 'Cấy cơ quan xúc tu vào cơ thể, có thể tự động tấn công',
        effects: { corruption: 45, attack: 6 },
        effectText: 'Đọa lạc +45, Tấn công +6'
    },
    pheromone_gland: {
        id: 'pheromone_gland', name: 'Tuyến hương quyến rũ', icon: '🌺', price: 130,
        description: 'Cấy tuyến hương quyến rũ, tỏa ra hơi thở làm mê muội kẻ thù',
        effects: { corruption: 30, enemyAttackReduce: 2 },
        effectText: 'Đọa lạc +30, Tấn công kẻ địch -2'
    },
    pleasure_nerve: {
        id: 'pleasure_nerve', name: 'Thần kinh khoái cảm', icon: '⚡', price: 170,
        description: 'Cải tạo hệ thần kinh, chuyển hóa đau đớn thành khoái cảm',
        effects: { corruption: 45, hpOnHit: 3 },
        effectText: 'Đọa lạc +45, Hồi 3HP khi trúng đòn'
    },
    mind_corrupt: {
        id: 'mind_corrupt', name: 'Ô nhiễm tinh thần', icon: '🧠', price: 160,
        description: 'Chấp nhận ô nhiễm tinh thần, tăng tốc đọa lạc',
        effects: { corruption: 40, corruptionPerRest: 5 },
        effectText: 'Đọa lạc +40, Mỗi khi nghỉ ngơi đọa lạc +5'
    },
    eternal_heat: {
        id: 'eternal_heat', name: 'Phát tình vĩnh viễn', icon: '❤️‍🔥', price: 250,
        description: 'Cơ thể vĩnh viễn trong trạng thái phát tình, tăng mạnh tấn công',
        effects: { corruption: 55, attack: 8, damageTaken: 10 },
        effectText: 'Đọa lạc +55, Tấn công +8, Sát thương nhận +10'
    },
    parasite_core: {
        id: 'parasite_core', name: 'Hạt nhân ký sinh', icon: '🦠', price: 280,
        description: 'Cấy hạt nhân ký sinh Ma tộc, nhận thêm sinh mệnh',
        effects: { corruption: 50, maxHp: 30, corruptionPerRest: 3 },
        effectText: 'Đọa lạc +50, HP +30, Nghỉ ngơi đọa lạc +3'
    },
    charm_voice: {
        id: 'charm_voice', name: 'Cải tạo mị âm', icon: '🎤', price: 140,
        description: 'Giọng nói trở nên đầy mê hoặc',
        effects: { corruption: 30, enemyAttackReduce: 3, attack: 2 },
        effectText: 'Đọa lạc +30, Tấn công kẻ địch -3, Tấn công +2'
    },
    symbiote: {
        id: 'symbiote', name: 'Vật cộng sinh', icon: '🖤', price: 400,
        description: 'Dung hợp với vật cộng sinh Ma tộc',
        effects: { corruption: 80, attack: 8, defense: 4, hDamageBonus: 15 },
        effectText: 'Đọa lạc +80, Tấn công +8, Phòng thủ +4, Sát thương H +15'
    }
};

// ==================== Hệ thống Chợ Đen ====================
const BlackMarketSystem = {
    purchasedMods: [], // Các cải tạo đã mua

    // Mở chợ đen
    open: function () {
        if (PlayerState.floor > 1) {
            alert('Chỉ có thể vào chợ đen khi ở thị trấn (Tầng 0-1)!');
            return;
        }

        // Tải các cải tạo đã mua
        this.loadPurchased();

        const modal = document.createElement('div');
        modal.id = 'blackMarketModal';
        modal.className = 'black-market-modal';

        modal.innerHTML = this.generateShopHTML();
        document.body.appendChild(modal);
    },

    // Tạo HTML cửa hàng
    generateShopHTML: function () {
        let itemsHtml = '';

        Object.values(BodyModConfig).forEach(mod => {
            const isPurchased = this.purchasedMods.includes(mod.id);
            const canAfford = PlayerState.gold >= mod.price;

            itemsHtml += `
                <div class="market-item ${isPurchased ? 'purchased' : ''}">
                    <div class="market-item-icon">${mod.icon}</div>
                    <div class="market-item-name">${mod.name}</div>
                    <div class="market-item-desc">${mod.description}</div>
                    <div class="market-item-effect">${mod.effectText}</div>
                    <div class="market-item-price">💰 ${mod.price}</div>
                    ${isPurchased ?
                    `<div style="color: #888; font-size: 12px; margin-top: auto;">Đã mua</div>` :
                    `<button onclick="BlackMarketSystem.purchase('${mod.id}')"
                                 class="market-btn-buy"
                                 ${canAfford ? '' : 'disabled'}>
                            Mua
                        </button>`
                }
                </div>
            `;
        });

        // Khu vực cường hóa thuộc tính
        const canAffordStat = PlayerState.gold >= 200;
        const statUpgradeHtml = `
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <div class="market-item market-stat-card attack" style="width: 220px;">
                    <div class="market-item-icon">⚔️</div>
                    <div class="market-item-name" style="color: #ff6b6b;">Cường hóa Tấn công</div>
                    <div class="market-item-desc" style="color: #ccc;">Tấn công hiện tại: ${PlayerState.attack}</div>
                    <div class="market-item-price">💰 200 → +1 Tấn công</div>
                    <button onclick="BlackMarketSystem.purchaseStat('attack')"
                            class="market-btn-buy"
                            style="background: linear-gradient(135deg, #ff6b6b, #ee5a5a);"
                            ${canAffordStat ? '' : 'disabled'}>
                        Cường hóa
                    </button>
                </div>
                <div class="market-item market-stat-card defense" style="width: 220px;">
                    <div class="market-item-icon">🛡️</div>
                    <div class="market-item-name" style="color: #74b9ff;">Cường hóa Phòng thủ</div>
                    <div class="market-item-desc" style="color: #ccc;">Phòng thủ hiện tại: ${PlayerState.defense}</div>
                    <div class="market-item-price">💰 200 → +1 Phòng thủ</div>
                    <button onclick="BlackMarketSystem.purchaseStat('defense')"
                            class="market-btn-buy"
                            style="background: linear-gradient(135deg, #74b9ff, #5da4e8);"
                            ${canAffordStat ? '' : 'disabled'}>
                        Cường hóa
                    </button>
                </div>
            </div>
        `;

        return `
            <div class="market-header">
                <div class="market-title">🔮 Giao dịch Chợ Đen</div>
                <div class="market-status-bar">
                    <div class="market-status-item">💰 Vàng <span style="color: #ffd700;">${PlayerState.gold}</span></div>
                    <div class="market-status-item">⚔️ Tấn công <span style="color: #ff6b6b;">${PlayerState.attack}</span></div>
                    <div class="market-status-item">🛡️ Phòng thủ <span style="color: #74b9ff;">${PlayerState.defense}</span></div>
                    <div class="market-status-item">💜 Đọa lạc <span style="color: #ff6b9d;">${PlayerState.corruption}</span></div>
                </div>
            </div>
            
            <div class="market-content-scroll">
                <div class="market-section-title">💪 Cường hóa thuộc tính (Mua không giới hạn)</div>
                ${statUpgradeHtml}
                
                <div class="market-section-title">🧬 Cải tạo cơ thể (Mua một lần)</div>
                <div class="market-grid">
                    ${itemsHtml}
                </div>
            </div>
            
            <div class="market-footer">
                <button onclick="BlackMarketSystem.close()" class="market-btn-close">
                    Rời khỏi Chợ Đen
                </button>
            </div>
        `;
    },

    // Mua cải tạo
    purchase: function (modId) {
        const mod = BodyModConfig[modId];
        if (!mod || this.purchasedMods.includes(modId)) return;
        if (PlayerState.gold < mod.price) {
            alert('Không đủ vàng!');
            return;
        }

        // Trừ vàng
        PlayerState.gold -= mod.price;
        this.purchasedMods.push(modId);
        this.savePurchased();

        // Áp dụng hiệu ứng
        this.applyModEffects(mod);

        PlayerState.save();
        PlayerState.updateDisplay();

        // Hiển thị giao diện xác nhận
        const modal = document.getElementById('blackMarketModal');
        modal.innerHTML = `
            <div style="margin: auto; background: linear-gradient(145deg, rgba(30, 20, 40, 0.98), rgba(20, 10, 20, 0.99)); 
                        border: 2px solid #9b59b6; border-radius: 12px; padding: 40px; width: 500px; text-align: center;
                        box-shadow: 0 0 30px rgba(155, 89, 182, 0.3);">
                <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(155, 89, 182, 0.6)); animation: pulse 2s infinite;">${mod.icon}</div>
                <div style="color: #9b59b6; font-size: 28px; font-weight: bold; margin-bottom: 15px; text-shadow: 0 0 10px rgba(155, 89, 182, 0.4);">Cải tạo hoàn tất!</div>
                <div style="color: #fff; font-size: 20px; margin-bottom: 15px;">${mod.name}</div>
                <div style="color: #ff6b9d; font-size: 14px; margin-bottom: 20px; background: rgba(255, 107, 157, 0.1); padding: 8px; border-radius: 4px;">${mod.effectText}</div>
                <div style="color: #aaa; font-size: 13px; margin-bottom: 30px; line-height: 1.6;">${mod.description}</div>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button onclick="BlackMarketSystem.skipStory('${modId}')"
                            class="market-btn-buy" style="width: auto; padding: 10px 30px; background: linear-gradient(135deg, #667eea, #764ba2);">
                        Bỏ qua cốt truyện
                    </button>
                    <button onclick="BlackMarketSystem.generateStory('${modId}')"
                            class="market-btn-buy" style="width: auto; padding: 10px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);">
                        Tạo cốt truyện
                    </button>
                </div>
            </div>
        `;
    },

    // Áp dụng hiệu ứng cải tạo
    applyModEffects: function (mod) {
        const effects = mod.effects;

        // Điểm đọa lạc
        if (effects.corruption) {
            PlayerState.corruption += effects.corruption;
            if (typeof gameState !== 'undefined' && gameState.variables) {
                gameState.variables.corruption = PlayerState.corruption;
            }
        }

        // Tấn công
        if (effects.attack) {
            PlayerState.attack += effects.attack;
        }

        // Phòng thủ
        if (effects.defense) {
            PlayerState.defense += effects.defense;
        }

        // HP tối đa
        if (effects.maxHp) {
            PlayerState.maxHp += effects.maxHp;
            PlayerState.hp += effects.maxHp; // Đồng thời hồi phục
        }

        // Thêm vào danh sách trạng thái đặc biệt để hiển thị
        const statusId = 'mod_' + mod.id;
        SpecialStatusManager.statuses[statusId] = {
            id: statusId,
            name: mod.name,
            icon: mod.icon,
            description: mod.effectText,
            permanent: true,
            effect: 'bodyMod',  // Đánh dấu là cải tạo cơ thể
            // Hiệu ứng chiến đấu
            hDamageBonus: effects.hDamageBonus || 0,
            hpPerTurn: effects.hpPerTurn || 0,
            enemyAttackReduce: effects.enemyAttackReduce || 0,
            hpOnHit: effects.hpOnHit || 0,
            corruptionPerRest: effects.corruptionPerRest || 0,
            damageTaken: effects.damageTaken || 0
        };
        SpecialStatusManager.save();
        SpecialStatusManager.updateDisplay();

        console.log('[Chợ Đen] Áp dụng hiệu ứng cải tạo:', mod.name, effects);
    },

    // Bỏ qua cốt truyện
    skipStory: function (modId) {
        const mod = BodyModConfig[modId];
        ACJTGame.recordToHistory(`Đã hoàn thành cải tạo cơ thể "${mod.name}" tại chợ đen, ${mod.effectText}`);
        this.close();
    },

    // Tạo cốt truyện
    generateStory: function (modId) {
        const mod = BodyModConfig[modId];
        this.close();
        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Chợ đen thị trấn tòa tháp】 Tôi đã chấp nhận cải tạo cơ thể "${mod.name}". Mô tả cải tạo: ${mod.description}. Hiệu quả: ${mod.effectText}. Hãy tạo một đoạn cốt truyện chi tiết về quá trình cải tạo, miêu tả chi tiết về quá trình, cảm nhận của nhân vật chính và sự thay đổi của cơ thể.`;
        ACJTGame.sendToAI(prompt);
    },

    // Mua cường hóa thuộc tính (vô hạn lần)
    purchaseStat: function (statType) {
        if (PlayerState.gold < 200) {
            alert('Không đủ vàng! Cần 200 vàng');
            return;
        }

        // Trừ vàng
        PlayerState.gold -= 200;

        // Tăng thuộc tính
        if (statType === 'attack') {
            PlayerState.attack += 1;
            console.log('[Chợ Đen] Mua cường hóa tấn công, tấn công hiện tại:', PlayerState.attack);
        } else if (statType === 'defense') {
            PlayerState.defense += 1;
            console.log('[Chợ Đen] Mua cường hóa phòng thủ, phòng thủ hiện tại:', PlayerState.defense);
        }

        // Lưu và cập nhật hiển thị
        PlayerState.save();
        PlayerState.updateDisplay();

        // Làm mới giao diện chợ đen
        const modal = document.getElementById('blackMarketModal');
        if (modal) {
            modal.innerHTML = this.generateShopHTML();
        }
    },

    // Đóng chợ đen
    close: function () {
        document.getElementById('blackMarketModal')?.remove();
    },

    // Lưu các cải tạo đã mua
    savePurchased: function () {
        localStorage.setItem('acjt_body_mods', JSON.stringify(this.purchasedMods));
    },

    // Tải các cải tạo đã mua
    loadPurchased: function () {
        const saved = localStorage.getItem('acjt_body_mods');
        if (saved) {
            try {
                this.purchasedMods = JSON.parse(saved);
                // Đồng bộ cải tạo đã mua vào trạng thái đặc biệt
                this.syncModsToStatus();
            } catch (e) {
                this.purchasedMods = [];
            }
        }
    },

    // Đồng bộ cải tạo đã mua vào trạng thái đặc biệt
    syncModsToStatus: function () {
        this.purchasedMods.forEach(modId => {
            const mod = BodyModConfig[modId];
            // Nếu đã có phiên bản start_ của cùng một trạng thái thì không thêm phiên bản mod_
            const hasStartVersion = Object.keys(SpecialStatusManager.statuses).some(key =>
                key.startsWith('start_') && key.includes(modId)
            );
            if (mod && !SpecialStatusManager.statuses['mod_' + modId] && !hasStartVersion) {
                const effects = mod.effects;
                SpecialStatusManager.statuses['mod_' + modId] = {
                    id: 'mod_' + modId,
                    name: mod.name,
                    icon: mod.icon,
                    description: mod.effectText,
                    permanent: true,
                    effect: 'bodyMod',
                    source: 'blackmarket', // Đánh dấu nguồn gốc
                    hDamageBonus: effects.hDamageBonus || 0,
                    hpPerTurn: effects.hpPerTurn || 0,
                    enemyAttackReduce: effects.enemyAttackReduce || 0,
                    hpOnHit: effects.hpOnHit || 0,
                    corruptionPerRest: effects.corruptionPerRest || 0,
                    damageTaken: effects.damageTaken || 0
                };
            }
        });
        if (this.purchasedMods.length > 0) {
            SpecialStatusManager.save();
            SpecialStatusManager.updateDisplay();
        }
    },

    // Lấy giá trị điều chỉnh chiến đấu
    getBattleMods: function () {
        let mods = {
            hDamageBonus: 0,
            hpPerTurn: 0,
            enemyAttackReduce: 0,
            hpOnHit: 0,
            damageTaken: 0
        };

        // Thu thập hiệu ứng cải tạo từ các trạng thái đặc biệt
        Object.values(SpecialStatusManager.statuses).forEach(status => {
            if (status.id?.startsWith('mod_')) {
                mods.hDamageBonus += status.hDamageBonus || 0;
                mods.hpPerTurn += status.hpPerTurn || 0;
                mods.enemyAttackReduce += status.enemyAttackReduce || 0;
                mods.hpOnHit += status.hpOnHit || 0;
                mods.damageTaken += status.damageTaken || 0;
            }
        });

        return mods;
    }
};

// ==================== Hệ thống Tu hành (Mua/Loại bỏ thẻ bài) ====================
const CultivationSystem = {
    // Ghi lại thao tác tu hành lần này
    learnedCards: [],    // Tên các thẻ đã học được
    discardedCards: [],  // Tên các thẻ đã loại bỏ

    // Mở giao diện tu hành
    open: function () {
        // Đặt lại ghi chép
        this.learnedCards = [];
        this.discardedCards = [];

        const modal = document.createElement('div');
        modal.id = 'cultivationModal';
        modal.className = 'cultivation-modal';

        modal.innerHTML = this.generateHTML();
        document.body.appendChild(modal);
    },

    // Tạo HTML giao diện tu hành
    generateHTML: function () {
        const playerCorruption = PlayerState.corruption || 0;
        const playerProfession = PlayerState.profession?.id;

        // Lấy tất cả thẻ bài có thể mua (lọc theo nghề nghiệp và đọa lạc)
        // Quy tắc: Thẻ chung và thẻ kỹ năng H mọi nghề nghiệp đều mua được, thẻ nghề nghiệp chỉ đúng nghề mới mua được
        const availableCards = CardLibrary.filter(card => {
            // Kiểm tra điều kiện đọa lạc (thẻ kỹ năng H)
            if (card.corruptionRequired !== undefined && card.corruptionRequired > playerCorruption) {
                return false;
            }
            // Thẻ kỹ năng H: Mọi nghề nghiệp đều mua được (nếu đủ đọa lạc)
            if (card.type === CardType.H_ATTACK) {
                return true;
            }
            // Thẻ đặc thù nghề nghiệp: Chỉ đúng nghề mới mua được
            if (card.professionRequired) {
                return card.professionRequired === playerProfession;
            }
            // Thẻ chung: Mọi nghề đều mua được
            return true;
        });

        // Tạo danh sách thẻ bài có thể mua
        let buyCardsHtml = '';
        availableCards.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            // Tính giá: tối thiểu 100, dựa trên năng lượng tiêu tốn và chỉ số
            const price = Math.max(100, (card.cost || 1) * 50 + (card.value || 0) * 3);
            const canBuy = PlayerState.gold >= price;

            buyCardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                            border: 2px solid ${canBuy ? typeColor : '#333'}; border-radius: 8px;
                            padding: 12px; width: 140px; text-align: center; opacity: ${canBuy ? 1 : 0.5};
                            flex-shrink: 0;">
                    <div style="color: #ffd700; font-size: 12px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold; margin-bottom: 6px;">${card.value || '-'}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px; line-height: 1.4;">${card.description}</div>
                    <button onclick="CultivationSystem.buyCard('${card.id}', ${price})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 5px 12px; background: ${canBuy ? '#2ed573' : '#333'}; color: ${canBuy ? '#fff' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${price}
                    </button>
                </div>
            `;
        });

        // Tạo danh sách bộ bài hiện tại (các thẻ có thể loại bỏ)
        let deckCardsHtml = '';
        CardDeckManager.deck.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const isCurse = card.type === CardType.CURSE;
            const canDiscard = !isCurse && PlayerState.gold >= 300;

            deckCardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                            border: 2px solid ${isCurse ? '#8b0000' : typeColor}; border-radius: 8px;
                            padding: 12px; width: 140px; text-align: center; opacity: ${canDiscard ? 1 : 0.6};
                            flex-shrink: 0; position: relative;">
                    ${isCurse ? '<div style="position:absolute;top:5px;left:5px;font-size:11px;color:#ff4757;">Nguyền rủa</div>' : ''}
                    <div style="color: #ffd700; font-size: 12px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold; margin-bottom: 6px;">${card.value || '-'}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px; line-height: 1.4;">${card.description}</div>
                    <button onclick="CultivationSystem.discardCard(${index})" ${!canDiscard ? 'disabled' : ''}
                            style="padding: 5px 12px; background: ${canDiscard ? '#ff4757' : '#333'}; color: ${canDiscard ? '#fff' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canDiscard ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        ${isCurse ? 'Không thể loại bỏ' : '💰 300 Loại bỏ'}
                    </button>
                </div>
            `;
        });

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 5px; width: 100%; border-bottom: 1px solid rgba(107, 82, 65, 0.3); padding-bottom: 5px;">
                <div style="color: #9c88ff; font-size: 24px; font-weight: bold;">🧘 Tu hành</div>
                <div style="color: #ffd700; font-size: 16px; font-weight: bold;">💰 Vàng: ${PlayerState.gold}</div>
            </div>
            
            <div style="display: flex; gap: 0; margin-bottom: 10px; border-bottom: 1px solid #6b5241; width: 100%;">
                <div id="tab-buy" onclick="CultivationSystem.switchTab('buy')" 
                     style="padding: 8px 30px; cursor: pointer; background: #8b0000; color: #fff; border: 1px solid #6b5241; border-bottom: none; border-radius: 6px 6px 0 0; font-weight: bold; flex: 1; text-align: center; transition: all 0.3s; font-size: 14px;">
                    📚 Mua thẻ bài
                </div>
                <div id="tab-delete" onclick="CultivationSystem.switchTab('delete')" 
                     style="padding: 8px 30px; cursor: pointer; background: rgba(0,0,0,0.3); color: #888; border: 1px solid #6b5241; border-bottom: none; border-radius: 6px 6px 0 0; border-left: none; flex: 1; text-align: center; transition: all 0.3s; font-size: 14px;">
                    🗑️ Xóa thẻ bài
                </div>
            </div>

            <div id="content-buy" style="display: flex; width: 100%; flex: 1; overflow: hidden; flex-direction: column;">
                <div style="color: #2ed573; font-size: 13px; margin-bottom: 5px; text-align: center;">👇 Nhấn để mua và học kỹ năng mới (Giá thấp nhất 100 vàng)</div>
                <div class="cultivation-scroll-area" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 0 0 5px 5px; border: 1px solid #6b5241; border-top: none;">
                    ${buyCardsHtml || '<div style="color: #666; width: 100%; text-align: center; padding-top: 50px;">Tạm thời không có công pháp nào có thể học</div>'}
                </div>
            </div>

            <div id="content-delete" style="display: none; width: 100%; flex: 1; overflow: hidden; flex-direction: column;">
                 <div style="color: #ff6b9d; font-size: 13px; margin-bottom: 5px; text-align: center;">👇 Nhấn để xóa bỏ tạp niệm (Tiêu tốn 300 vàng)</div>
                <div class="cultivation-scroll-area" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 0 0 5px 5px; border: 1px solid #6b5241; border-top: none;">
                    ${deckCardsHtml || '<div style="color: #666; width: 100%; text-align: center; padding-top: 50px;">Bộ bài trống</div>'}
                </div>
            </div>
            
            <div style="margin-top: 15px; display: flex; justify-content: center;">
                <button onclick="CultivationSystem.leave()"
                        style="padding: 10px 50px; background: linear-gradient(135deg, #667eea, #764ba2);
                               color: #fff; border: 2px solid #a29bfe; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: bold; box-shadow: 0 0 10px rgba(108, 92, 231, 0.4);">
                    🚪 Rời khỏi tu hành
                </button>
            </div>
        `;
    },

    // Mua thẻ bài
    buyCard: function (cardId, price) {
        if (PlayerState.gold < price) return;

        const card = CardLibrary.find(c => c.id === cardId);
        if (!card) return;

        PlayerState.gold -= price;
        CardDeckManager.deck.push({ ...card });
        this.learnedCards.push(card.name);

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshUI();
    },

    // Loại bỏ thẻ bài
    discardCard: function (index) {
        const card = CardDeckManager.deck[index];
        if (!card || card.type === CardType.CURSE) return;
        if (PlayerState.gold < 300) return;

        PlayerState.gold -= 300;
        const removedCard = CardDeckManager.deck.splice(index, 1)[0];
        this.discardedCards.push(removedCard.name);

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshUI();
    },

    // Làm mới giao diện
    refreshUI: function () {
        const activeTab = document.querySelector('#content-buy')?.style.display !== 'none' ? 'buy' : 'delete';

        const modal = document.getElementById('cultivationModal');
        if (modal) {
            modal.innerHTML = this.generateHTML();
            this.switchTab(activeTab);
        }
    },

    // Logic chuyển đổi Tab
    switchTab: function (tabName) {
        const tabBuy = document.getElementById('tab-buy');
        const tabDelete = document.getElementById('tab-delete');
        const contentBuy = document.getElementById('content-buy');
        const contentDelete = document.getElementById('content-delete');

        if (!tabBuy || !tabDelete || !contentBuy || !contentDelete) return;

        if (tabName === 'buy') {
            tabBuy.style.background = '#8b0000';
            tabBuy.style.color = '#fff';
            tabBuy.style.borderBottom = 'none';

            tabDelete.style.background = 'rgba(0,0,0,0.3)';
            tabDelete.style.color = '#888';
            tabDelete.style.borderBottom = '1px solid #6b5241';

            contentBuy.style.display = 'flex';
            contentDelete.style.display = 'none';
        } else {
            tabDelete.style.background = '#8b0000';
            tabDelete.style.color = '#fff';
            tabDelete.style.borderBottom = 'none';

            tabBuy.style.background = 'rgba(0,0,0,0.3)';
            tabBuy.style.color = '#888';
            tabBuy.style.borderBottom = '1px solid #6b5241';

            contentDelete.style.display = 'flex';
            contentBuy.style.display = 'none';
        }
    },

    // Rời khỏi tu hành
    leave: function () {
        if (this.learnedCards.length === 0 && this.discardedCards.length === 0) {
            this.close();
            return;
        }

        const modal = document.getElementById('cultivationModal');
        if (modal) {
            const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : 'Không';
            const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : 'Không';

            modal.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🧘</div>
                    <div style="color: #9c88ff; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Tu hành hoàn tất!</div>
                    <div style="color: #2ed573; font-size: 14px; margin-bottom: 10px;">Đã học: ${learnedText}</div>
                    <div style="color: #ff6b9d; font-size: 14px; margin-bottom: 20px;">Đã loại bỏ: ${discardedText}</div>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="CultivationSystem.skipStory()"
                                style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                       color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            Bỏ qua cốt truyện
                        </button>
                        <button onclick="CultivationSystem.generateStory()"
                                style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                       color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            Tạo cốt truyện
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // Bỏ qua cốt truyện
    skipStory: function () {
        const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : '';
        const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : '';

        let historyText = 'Tu hành: ';
        if (learnedText) historyText += `Đã học được ${learnedText}`;
        if (learnedText && discardedText) historyText += '; ';
        if (discardedText) historyText += `Đã loại bỏ ${discardedText}`;

        ACJTGame.recordToHistory(historyText);
        this.close();

        if (typeof showNotification === 'function') {
            showNotification('🧘 Tu hành hoàn tất', 'success');
        }
    },

    // Tạo cốt truyện
    generateStory: function () {
        const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : '';
        const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : '';
        const floor = PlayerState.floor || 1;

        let promptParts = [];
        if (learnedText) promptParts.push(`tôi đã học được ${learnedText}`);
        if (discardedText) promptParts.push(`tôi đã loại bỏ ${discardedText}`);

        const prompt = `Bỏ qua các cảnh trước đó một cách đơn giản, tạo cốt truyện mới: 【Tu hành tại tầng ${floor} của tòa tháp】 ${promptParts.join('; ')}. Hãy tạo một đoạn cốt truyện về quá trình tu hành, miêu tả việc tôi lĩnh ngộ chiêu thức mới hoặc cảm nhận tâm cảnh khi loại bỏ những kỹ năng cũ.`;

        this.close();
        ACJTGame.sendToAI(prompt);
    },

    // Đóng giao diện tu hành
    close: function () {
        document.getElementById('cultivationModal')?.remove();
    }
};

// ==================== Tiến trình Game Chính ====================
const ACJTGame = {
    isGameStarted: false,
    creationPoints: 100,      // Điểm khởi tạo nhân vật
    currentStep: 1,           // Bước khởi tạo hiện tại (1-5)

    // Dữ liệu khởi tạo nhân vật
    charData: {
        name: 'Celestine',
        age: 16,
        professionId: 'nun',
        raceId: 'human',
        isVirgin: true,
        bodyAttributes: {
            height: 'average',
            weight: 'average',
            chest: 'C',
            hips: 'average',
            vagina: 'pink_bud'
        },
        startingStatuses: [],
        originId: 'adventurer',
        customBackground: ''
    },

    // Hiển thị giao diện khởi tạo nhân vật (quy trình nhiều bước)
    showCharacterCreation: function () {
        const modal = document.createElement('div');
        modal.id = 'acjtCharCreationModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(25, 18, 15, 0.99) 0%, rgba(15, 10, 8, 1) 50%, rgba(20, 14, 12, 0.99) 100%);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
            padding: 15px; box-sizing: border-box; overflow: hidden;
            font-family: 'Cinzel', 'Microsoft YaHei', serif;
            border: 3px solid #3d2f24;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(139,0,0,0.1);
        `;

        // Đặt lại dữ liệu khởi tạo
        this.creationPoints = 100;
        this.currentStep = 1;
        this.charData = {
            name: 'Celestine', age: 16, professionId: 'nun', raceId: 'human', isVirgin: true,
            bodyAttributes: { height: 'average', weight: 'average', chest: 'C', hips: 'average', vagina: 'pink_bud' },
            startingStatuses: [], originId: 'adventurer', customBackground: ''
        };
        CardDeckManager.deck = [];

        modal.innerHTML = this.generateStepHTML();
        document.body.appendChild(modal);
    },

    // Chuyển bước
    goToStep: function (step) {
        if (step < 1 || step > 5) return;
        this.currentStep = step;
        const modal = document.getElementById('acjtCharCreationModal');
        if (modal) modal.innerHTML = this.generateStepHTML();
    },

    // Tính toán số điểm hiện tại
    calculatePoints: function () {
        let points = 100;
        // Điểm trạng thái đặc biệt
        this.charData.startingStatuses.forEach(sid => {
            const status = StartingStatusConfig[sid];
            if (status) points += status.points;
        });
        // Điểm xuất thân
        const origin = OriginConfig[this.charData.originId];
        if (origin) points += origin.points;
        // Điểm tiêu tốn khi Roll
        points -= (this.charData._rollCount || 0) * 10;
        return points;
    },

    // Tạo HTML các bước
    generateStepHTML: function () {
        const points = this.calculatePoints();
        const stepTitles = ['', 'Nghề nghiệp và thông tin cơ bản', 'Thiết lập thuộc tính cơ thể', 'Lựa chọn trạng thái đặc biệt', 'Xuất thân và lai lịch', 'Rút và xác nhận thẻ bài'];
        const stepIcons = ['', '⚔️', '💃', '✨', '📜', '🃏'];

        // Thanh chỉ thị các bước - Phong cách Cthulhu
        let stepsHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;padding:0 10px;">';
        for (let i = 1; i <= 5; i++) {
            const active = i === this.currentStep;
            const done = i < this.currentStep;
            const canClick = done || active;

            if (i > 1) {
                const lineColor = done ? '#6b5241' : 'rgba(107,82,65,0.3)';
                stepsHtml += `<div style="width:30px;height:2px;background:${lineColor};border-radius:1px;"></div>`;
            }

            const bg = active ? 'linear-gradient(135deg, #8b0000, #5a0000)' : done ? 'linear-gradient(135deg, #6b5241, #4a3828)' : 'rgba(26,19,16,0.8)';
            const shadow = active ? '0 0 15px rgba(139,0,0,0.6)' : done ? '0 0 8px rgba(107,82,65,0.4)' : 'none';
            const scale = active ? 'scale(1.1)' : 'scale(1)';

            stepsHtml += `<div onclick="${canClick ? `ACJTGame.goToStep(${i})` : ''}" style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-size:${done ? '14px' : '13px'};font-weight:bold;cursor:${canClick ? 'pointer' : 'default'};transition:all 0.3s;
                background:${bg}; box-shadow:${shadow}; transform:${scale};
                color:#c9b896;border:2px solid ${active ? 'rgba(139,0,0,0.5)' : 'rgba(107,82,65,0.3)'};">${done ? '҉' : i}</div>`;
        }
        stepsHtml += '</div>';

        // Hiển thị điểm số - Phong cách Cthulhu
        const pointsColor = points >= 0 ? '#c9b896' : '#8b0000';
        const pointsGlow = points >= 0 ? 'rgba(139,0,0,0.4)' : 'rgba(139,0,0,0.6)';
        const pointsHtml = `
            <div style="text-align:center;margin-bottom:15px;">
                <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 25px;background:linear-gradient(135deg,rgba(25,18,15,0.8),rgba(15,10,8,0.9));border-radius:4px;border:2px solid #3d2f24;box-shadow:inset 0 0 10px rgba(0,0,0,0.5);">
                    <span style="color:#6b5d4d;font-size:13px;">҉ Số điểm còn lại</span>
                    <span style="color:${pointsColor};font-size:22px;font-weight:bold;text-shadow:0 0 10px ${pointsGlow};">${points}</span>
                </div>
            </div>`;

        // Tạo nội dung dựa trên bước hiện tại
        let contentHtml = '';
        switch (this.currentStep) {
            case 1: contentHtml = this.generateStep1HTML(); break;
            case 2: contentHtml = this.generateStep2HTML(); break;
            case 3: contentHtml = this.generateStep3HTML(); break;
            case 4: contentHtml = this.generateStep4HTML(); break;
            case 5: contentHtml = this.generateStep5HTML(); break;
        }

        return `
            <style>
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                #charCreationContent::-webkit-scrollbar { width: 6px; }
                #charCreationContent::-webkit-scrollbar-track { background: rgba(26,19,16,0.8); border-radius: 3px; }
                #charCreationContent::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #6b5241, #3d2f24); border-radius: 3px; }
                #charCreationContent::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #8b6b4a, #6b5241); }
            </style>
            <div style="max-width:800px;width:100%;max-height:calc(100vh - 30px);display:flex;flex-direction:column;background:linear-gradient(180deg, rgba(25,18,15,0.98) 0%, rgba(15,10,8,0.99) 50%, rgba(20,14,12,0.98) 100%);border-radius:4px;box-shadow:0 15px 50px rgba(0,0,0,0.8),inset 0 0 30px rgba(0,0,0,0.5),0 0 20px rgba(139,0,0,0.2);border:3px solid #3d2f24;overflow:hidden;position:relative;">
                
                <div style="padding:20px 25px 15px;background:linear-gradient(180deg, rgba(139,0,0,0.1) 0%, transparent 100%);border-bottom:2px solid rgba(139,0,0,0.3);flex-shrink:0;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;">
                        <span style="font-size:28px;filter:drop-shadow(0 0 5px rgba(139,0,0,0.5));">${stepIcons[this.currentStep]}</span>
                        <span style="color:#c9b896;font-size:22px;font-weight:bold;text-shadow:0 0 15px rgba(139,0,0,0.4);font-family:'Cinzel',serif;">${stepTitles[this.currentStep]}</span>
                    </div>
                    <div style="height:2px;width:80px;background:linear-gradient(90deg, transparent, #8b0000, transparent);margin:0 auto 15px;"></div>
                    ${stepsHtml}
                    ${pointsHtml}
                </div>
                
                <div id="charCreationContent" style="flex:1;overflow-y:auto;padding:20px 25px 25px;animation:fadeIn 0.4s ease-out;color:#c9b896;">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

// Bước 1: Nghề nghiệp và Thông tin cơ bản
    generateStep1HTML: function () {
        // Lựa chọn nghề nghiệp
        let profHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:25px;">';
        Object.values(ProfessionConfig).forEach(prof => {
            const selected = this.charData.professionId === prof.id;
            const bg = selected ? 'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(196,69,105,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#ff6b9d' : 'rgba(255,255,255,0.1)';
            const shadow = selected ? '0 5px 15px rgba(255,107,157,0.2)' : 'none';

            profHtml += `
                <div onclick="ACJTGame.selectProfession('${prof.id}')" style="cursor:pointer;padding:15px 10px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:12px; transition:all 0.3s;
                    box-shadow:${shadow}; transform:${selected ? 'translateY(-2px)' : 'none'}; position:relative; overflow:hidden;">
                    ${selected ? '<div style="position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 25px 25px 0;border-color:transparent #ff6b9d transparent transparent;"></div><div style="position:absolute;top:2px;right:2px;color:#fff;font-size:10px;font-weight:bold;">✓</div>' : ''}
                    ${prof.icon && prof.icon.startsWith('img/') ? `<img src="${prof.icon}" style="width:120px;height:120px;margin-bottom:8px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,255,255,0.3));">` : `<div style="font-size:32px;margin-bottom:8px;text-shadow:0 0 10px rgba(255,255,255,0.3);">${prof.icon}</div>`}
                    <div style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:5px;">${prof.name}</div>
                    <div style="color:#aaa;font-size:11px;line-height:1.4;">${prof.description}</div>
                </div>`;
        });
        profHtml += '</div>';

        // Lựa chọn chủng tộc
        let raceHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:25px;">';
        Object.values(RaceConfig).forEach(race => {
            const selected = this.charData.raceId === race.id;
            const bg = selected ? 'linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#667eea' : 'rgba(255,255,255,0.1)';
            const mods = race.statMods;
            let modText = [];
            if (mods.hp) modText.push(`HP${mods.hp > 0 ? '+' : ''}${mods.hp}`);
            if (mods.attack) modText.push(`Công${mods.attack > 0 ? '+' : ''}${mods.attack}`);
            if (mods.defense) modText.push(`Thủ${mods.defense > 0 ? '+' : ''}${mods.defense}`);
            if (mods.corruption) modText.push(`Đọa${mods.corruption > 0 ? '+' : ''}${mods.corruption}`);

            raceHtml += `
                <div onclick="ACJTGame.selectRace('${race.id}')" style="cursor:pointer;padding:10px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:10px; transition:all 0.3s;
                    transform:${selected ? 'scale(1.05)' : 'none'};">
                    ${race.icon && race.icon.startsWith('img/') ? `<img src="${race.icon}" style="width:50px;height:50px;margin-bottom:4px;object-fit:contain;">` : `<div style="font-size:26px;margin-bottom:4px;">${race.icon}</div>`}
                    <div style="color:#fff;font-size:13px;font-weight:bold;margin-bottom:2px;">${race.name}</div>
                    <div style="color:#888;font-size:10px;transform:scale(0.9);">${modText.join(' ') || 'Không hiệu chỉnh'}</div>
                </div>`;
        });
        raceHtml += '</div>';

        return `
            <!-- 职业选择 -->
<div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#ff6b9d,#c44569);border-radius:2px;"></div>
                    <span style="color:#ff6b9d;font-size:15px;font-weight:bold;">Chọn nghề nghiệp</span>
                </div>
                ${profHtml}
            </div>
            
            <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#667eea,#764ba2);border-radius:2px;"></div>
                    <span style="color:#667eea;font-size:15px;font-weight:bold;">Chọn chủng tộc</span>
                </div>
                ${raceHtml}
            </div>
            
            <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#ffd700,#f39c12);border-radius:2px;"></div>
                    <span style="color:#ffd700;font-size:15px;font-weight:bold;">Thông tin cơ bản</span>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:18px;border-radius:12px;display:flex;gap:25px;flex-wrap:wrap;justify-content:center;border:1px solid rgba(255,255,255,0.05);">
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Họ tên</div>
                        <input type="text" id="charNameInput" value="${this.charData.name}" placeholder="Vui lòng nhập họ tên"
                            onchange="ACJTGame.charData.name=this.value"
                            style="padding:10px 14px;width:130px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;text-align:center;outline:none;transition:all 0.3s;font-size:14px;"
                            onfocus="this.style.borderColor='#ff6b9d';this.style.boxShadow='0 0 10px rgba(255,107,157,0.2)'"
                            onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
                    </div>
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Tuổi</div>
                        <input type="number" id="charAgeInput" value="${this.charData.age}" min="14" max="35"
                            onchange="ACJTGame.charData.age=parseInt(this.value)||18"
                            style="padding:10px 14px;width:70px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;text-align:center;outline:none;transition:all 0.3s;font-size:14px;"
                            onfocus="this.style.borderColor='#ff6b9d';this.style.boxShadow='0 0 10px rgba(255,107,157,0.2)'"
                            onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
                    </div>
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Trinh tiết</div>
                        <div style="display:flex;gap:0;background:rgba(0,0,0,0.4);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                            <div onclick="ACJTGame.charData.isVirgin=true;ACJTGame.refreshStep();" 
                                 style="padding:10px 18px;cursor:pointer;font-size:13px;transition:all 0.3s;
                                 background:${this.charData.isVirgin ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : 'transparent'};
                                 color:${this.charData.isVirgin ? '#fff' : '#666'};">Xử nữ</div>
                            <div onclick="ACJTGame.charData.isVirgin=false;ACJTGame.refreshStep();" 
                                 style="padding:10px 18px;cursor:pointer;font-size:13px;transition:all 0.3s;
                                 background:${!this.charData.isVirgin ? 'linear-gradient(135deg,#ff4757,#c0392b)' : 'transparent'};
                                 color:${!this.charData.isVirgin ? '#fff' : '#666'};">Không phải</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align:center;padding-top:10px;">
                <button onclick="ACJTGame.goToStep(2)" 
                    style="padding:14px 60px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;letter-spacing:1px;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    Bước tiếp theo →
                </button>
            </div>
        `;
    },

    // 步骤2: 身体属性设定
    generateStep2HTML: function () {
        const genSelect = (type, label, icon) => {
            const items = BodyConfig[type];
            let html = `<div style="margin-bottom:18px;">
                <div style="color:#888;font-size:12px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                    <span>${icon}</span><span>${label}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
            items.forEach(item => {
                const selected = this.charData.bodyAttributes[type] === item.id;
                const bg = selected ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : 'rgba(255,255,255,0.03)';
                const border = selected ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.08)';

                html += `<div onclick="ACJTGame.setBodyAttr('${type}','${item.id}')" 
                    style="cursor:pointer;padding:8px 14px;font-size:12px;border-radius:18px;transition:all 0.2s;
                    background:${bg}; border:1px solid ${border}; color:${selected ? '#fff' : '#999'};
                    box-shadow:${selected ? '0 3px 12px rgba(255,107,157,0.25)' : 'none'};"
                    onmouseover="if(!${selected})this.style.background='rgba(255,255,255,0.06)'"
                    onmouseout="if(!${selected})this.style.background='rgba(255,255,255,0.03)'">
                    ${item.name}
                </div>`;
            });
            html += '</div></div>';
            return html;
        };

        return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <!-- 基础体型 -->
<div style="background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:15px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:18px;">📏</span>
                        <span style="color:#fff;font-size:14px;font-weight:bold;">Thể hình cơ bản</span>
                    </div>
                    ${genSelect('height', 'Chiều cao', '📐')}
                    ${genSelect('weight', 'Cân nặng', '⚖️')}
                </div>
                <div style="background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:15px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:18px;">💃</span>
                        <span style="color:#fff;font-size:14px;font-weight:bold;">Đặc điểm vóc dáng</span>
                    </div>
                    ${genSelect('chest', 'Vòng ngực', '🍒')}
                    ${genSelect('hips', 'Vòng mông', '🍑')}
                    ${genSelect('vagina', 'Âm đạo', '🌸')}
                </div>
            </div>
            
            <!-- 导航按钮 -->
            <div style="display:flex;gap:15px;justify-content:center;margin-top:25px;">
                <button onclick="ACJTGame.goToStep(1)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← Bước trước
                </button>
                <button onclick="ACJTGame.goToStep(3)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    Bước tiếp theo →
                </button>
            </div>
        `;
    },

    // 步骤3: 特殊状态选择
generateStep3HTML: function () {
        let html = '<div style="color:#888;font-size:12px;margin-bottom:18px;text-align:center;background:linear-gradient(135deg,rgba(0,0,0,0.3),rgba(0,0,0,0.2));padding:12px 15px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">💡 <span style="color:#2ed573">Trạng thái tiêu cực</span> cho điểm | <span style="color:#ff6b9d">Trạng thái tích cực</span> tốn điểm (có thể chọn nhiều)</div>';

        // Hiển thị trạng thái theo phân loại
        const categories = {
            negative: { title: '⛓️ Trói buộc tiêu cực', items: [], color: '#ff4757' },
            demon: { title: '😈 Huyết thống ma tộc', items: [], color: '#a55eea' },
            body: { title: '💗 Cải tạo cơ thể', items: [], color: '#ff6b9d' },
            special: { title: '✨ Năng lực đặc biệt', items: [], color: '#f7b731' }
        };

        Object.values(StartingStatusConfig).forEach(status => {
            if (status.points > 0) {
                categories.negative.items.push(status);
            } else if (status.id.includes('demon') || status.id.includes('succubus')) {
                categories.demon.items.push(status);
            } else if (status.id.includes('breast') || status.id.includes('nipple') || status.id.includes('pussy') || status.id.includes('anal') || status.id.includes('womb')) {
                categories.body.items.push(status);
            } else {
                categories.special.items.push(status);
            }
        });

        // Tạo HTML cho từng phân loại
        Object.values(categories).forEach(cat => {
            if (cat.items.length === 0) return;

            html += `<div style="margin-bottom:20px;">
                <div style="color:${cat.color};font-size:15px;font-weight:bold;margin-bottom:10px;border-bottom:1px solid ${cat.color}40;padding-bottom:5px;">${cat.title}</div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">`;

            cat.items.forEach(status => {
                const selected = this.charData.startingStatuses.includes(status.id);
                const isNegative = status.points > 0;
                const pointText = status.points > 0 ? `+${status.points}` : status.points;
                const bg = selected ? (isNegative ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)') : 'rgba(255,255,255,0.03)';
                const border = selected ? (isNegative ? '#ff4757' : '#2ed573') : 'rgba(255,255,255,0.1)';

                html += `
                    <div onclick="ACJTGame.toggleStatus('${status.id}')" style="cursor:pointer;padding:10px;text-align:center;
                        background:${bg}; border:1px solid ${border}; border-radius:8px; transition:all 0.2s; position:relative;
                        transform:${selected ? 'translateY(-2px)' : 'none'};">
                        ${selected ? '<div style="position:absolute;top:2px;right:5px;color:' + (isNegative ? '#ff4757' : '#2ed573') + ';font-size:12px;">✓</div>' : ''}
                        <div style="font-size:24px;margin-bottom:5px;">${status.icon}</div>
                        <div style="color:#fff;font-size:13px;font-weight:bold;margin-bottom:3px;">${status.name}</div>
                        <div style="color:${isNegative ? '#ff6b6b' : '#2ed573'};font-size:12px;font-weight:bold;margin-bottom:3px;">${pointText} điểm</div>
                        <div style="color:#888;font-size:10px;line-height:1.2;">${status.effect}</div>
                    </div>`;
            });
            html += '</div></div>';
        });

        html += `
            <div style="display:flex;gap:15px;justify-content:center;margin-top:20px;">
                <button onclick="ACJTGame.goToStep(2)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← Bước trước
                </button>
                <button onclick="ACJTGame.goToStep(4)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    Bước tiếp theo →
                </button>
            </div>`;
        return html;
    },

    // 步骤4: 开局经历选择
    generateStep4HTML: function () {
        let html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:25px;">';

        Object.values(OriginConfig).forEach(origin => {
            const selected = this.charData.originId === origin.id;
            const pointText = origin.points > 0 ? `+${origin.points}` : (origin.points < 0 ? origin.points : '±0');
            const bg = selected ? 'linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#667eea' : 'rgba(255,255,255,0.1)';
            const shadow = selected ? '0 5px 15px rgba(102,126,234,0.2)' : 'none';

            html += `
                <div onclick="ACJTGame.selectOrigin('${origin.id}')" style="cursor:pointer;padding:15px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:10px; transition:all 0.3s;
                    box-shadow:${shadow}; transform:${selected ? 'translateY(-2px)' : 'none'};">
                    <div style="font-size:32px;margin-bottom:8px;">${origin.icon}</div>
                    <div style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:4px;">${origin.name}</div>
                    <div style="color:#ffd700;font-size:12px;margin-bottom:6px;font-weight:bold;">${pointText} điểm</div>
                    <div style="color:#aaa;font-size:11px;line-height:1.3;">${origin.effect}</div>
                </div>`;
        });
        html += '</div>';

        // 自定义背景
        html += `
<div style="margin-bottom:20px;background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
                <div style="color:#888;font-size:12px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                    <span>📝</span><span>Tùy chỉnh bối cảnh xuất thân (tùy chọn)</span>
                </div>
                <textarea id="customBgInput" placeholder="Ví dụ: Từng là tiểu thư danh gia vọng tộc, vì gia tộc bị hãm hại mà lưu lạc đầu đường xó chợ..." 
                    onchange="ACJTGame.charData.customBackground=this.value"
                    style="padding:12px;width:100%;height:70px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:13px;resize:none;box-sizing:border-box;font-family:'Microsoft YaHei';transition:all 0.3s;outline:none;"
                    onfocus="this.style.borderColor='#667eea';this.style.boxShadow='0 0 15px rgba(102,126,234,0.2)'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">${this.charData.customBackground}</textarea>
            </div>
            <div style="display:flex;gap:15px;justify-content:center;">
                <button onclick="ACJTGame.goToStep(3)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← Bước trước
                </button>
                <button onclick="ACJTGame.goToStep(5)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    Bước tiếp theo →
                </button>
            </div>`;
        return html;
    },

// Bước 5: Roll bộ bài
    generateStep5HTML: function () {
        const points = this.calculatePoints();
        const prof = ProfessionConfig[this.charData.professionId];

        // Khởi tạo mảng thẻ bài nghề nghiệp đã chọn
        if (!this.charData.selectedProfCards) {
            this.charData.selectedProfCards = [];
        }

        // Thẻ bài cơ bản cố định
        let baseCards = [];
        if (this.charData.professionId === 'magicalGirl') {
            // 🆕 Bộ bài đặc biệt của Thiếu nữ Ma pháp: 2 Đỡ đòn + 1 Biến thân
            baseCards = [
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'armor_001', name: 'Đỡ đòn', type: CardType.ARMOR },
                { id: 'armor_001', name: 'Đỡ đòn', type: CardType.ARMOR },
                { id: 'mg_transform', name: 'Được rồi, bắt đầu làm việc nào! (ﾉ◕ヮ◕)ﾉ', type: CardType.BUFF },
                { id: 'h_attack_001', name: 'Nháy mắt quyến rũ', type: CardType.H_ATTACK }
            ];
        } else {
            // Bộ bài mặc định: 3 Đỡ đòn
            baseCards = [
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'attack_001', name: 'Tấn công thường', type: CardType.ATTACK },
                { id: 'armor_001', name: 'Đỡ đòn', type: CardType.ARMOR },
                { id: 'armor_001', name: 'Đỡ đòn', type: CardType.ARMOR },
                { id: 'armor_001', name: 'Đỡ đòn', type: CardType.ARMOR },
                { id: 'h_attack_001', name: 'Nháy mắt quyến rũ', type: CardType.H_ATTACK }
            ];
        }


        // Hiển thị thẻ bài cơ bản
        let baseCardsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:15px;">';
        baseCards.forEach(card => {
            const color = CardTypeColors[card.type] || '#666';
            const fullCard = CardLibrary.find(c => c.id === card.id) || card;
            baseCardsHtml += `<div style="padding:6px 10px;background:rgba(0,0,0,0.4);border:1px solid ${color};border-radius:6px;font-size:11px;color:#aaa;"><span style="color:#ffd700;">${fullCard.cost || 1}⚡</span> ${card.name}</div>`;
        });
        baseCardsHtml += '</div>';

        // Hiển thị thẻ nghề nghiệp đã chọn (có thể nhấn để xóa)
        let selectedCardsHtml = '';
        if (this.charData.selectedProfCards.length > 0) {
            selectedCardsHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.1);"><div style="color:#ff6b9d;font-size:11px;margin-bottom:8px;text-align:center;">✨ Thẻ nghề nghiệp đã chọn (Nhấn để xóa)</div><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">';
            this.charData.selectedProfCards.forEach((card, index) => {
                const color = CardTypeColors[card.type] || '#ff6b9d';
                selectedCardsHtml += `<div onclick="ACJTGame.removeSelectedCard(${index})" style="padding:6px 10px;background:rgba(255,107,157,0.2);border:1px solid ${color};border-radius:6px;font-size:11px;color:#fff;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,0,0,0.3)';this.style.borderColor='#ff4757'" onmouseout="this.style.background='rgba(255,107,157,0.2)';this.style.borderColor='${color}'"><span style="color:#ffd700;">${card.cost}⚡</span> ${card.name} ✕</div>`;
            });
            selectedCardsHtml += '</div></div>';
        }

        const totalCards = 8 + this.charData.selectedProfCards.length;
        const selectedCount = this.charData.selectedProfCards.length;
        const canSelectMore = selectedCount < 2;
        const canStart = selectedCount >= 2 && this.charData.name.trim();

        // Hiển thị thẻ bài vừa Roll ra
        let rolledCardsHtml = '';
        if (this.charData.rolledCards && this.charData.rolledCards.length > 0) {
            rolledCardsHtml = `
                <div style="margin-bottom:20px;padding:15px;background:linear-gradient(135deg,rgba(102,126,234,0.15),rgba(118,75,162,0.15));border-radius:12px;border:1px solid rgba(102,126,234,0.3);">
                    <div style="color:#667eea;font-size:12px;margin-bottom:10px;text-align:center;">🎲 Chọn một lá thêm vào bộ bài ${canSelectMore ? `(Còn có thể chọn ${2 - selectedCount} lá)` : '(Đã chọn đủ)'}</div>
                    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                        ${this.charData.rolledCards.map((card, index) => {
                const color = CardTypeColors[card.type] || '#667eea';
                const canSelect = canSelectMore;
                return `<div onclick="${canSelect ? `ACJTGame.selectRolledCard(${index})` : ''}" 
                                style="padding:12px 15px;background:rgba(0,0,0,0.5);border:2px solid ${color};border-radius:10px;
                                cursor:${canSelect ? 'pointer' : 'not-allowed'};transition:all 0.2s;min-width:100px;text-align:center;
                                opacity:${canSelect ? '1' : '0.5'};"
                                ${canSelect ? `onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 5px 15px ${color}50'"
                                onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'"` : ''}>
                                <div style="color:#ffd700;font-size:11px;text-align:right;margin-bottom:2px;">${card.cost}⚡</div>
                                <div style="color:${color};font-size:13px;font-weight:bold;margin-bottom:4px;">${card.name}</div>
                                <div style="color:#888;font-size:10px;">${card.type}</div>
                                <div style="color:#666;font-size:11px;margin-top:4px;line-height:1.3;">${card.description}</div>
                            </div>`;
            }).join('')}
                    </div>
                </div>`;
        }

        return `
            <div style="background:linear-gradient(135deg,rgba(255,107,157,0.08),rgba(102,126,234,0.08));padding:20px;border-radius:14px;margin-bottom:20px;text-align:center;border:1px solid rgba(255,255,255,0.05);position:relative;overflow:hidden;">
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff6b9d,#667eea,#2ed573);"></div>
                ${prof.icon && prof.icon.startsWith('img/') ? `<img src="${prof.icon}" style="width:80px;height:80px;margin-bottom:10px;object-fit:contain;filter:drop-shadow(0 5px 10px rgba(0,0,0,0.3));">` : `<div style="font-size:50px;margin-bottom:10px;filter:drop-shadow(0 5px 10px rgba(0,0,0,0.3));">${prof.icon}</div>`}
                <div style="color:#fff;font-size:18px;font-weight:bold;margin-bottom:6px;">${prof.name}</div>
                <div style="color:#888;font-size:12px;line-height:1.4;">${prof.description}</div>
            </div>
            
            <div style="margin-bottom:20px;padding:18px;background:linear-gradient(135deg,rgba(0,0,0,0.3),rgba(0,0,0,0.2));border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                <div style="color:#888;font-size:12px;margin-bottom:12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <span>🃏</span>
                    <span>Bộ bài ban đầu</span>
                    <span style="background:rgba(255,107,157,0.2);color:#ff6b9d;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:bold;">${totalCards}/10</span>
                    <span style="color:#666;font-size:10px;">(Cơ bản 8 lá + Bài nghề nghiệp ${selectedCount}/2 lá)</span>
                </div>
                ${baseCardsHtml}
                ${selectedCardsHtml}
            </div>
            
            ${rolledCardsHtml}
            
            <div style="text-align:center;margin-bottom:25px;">
                <button onclick="ACJTGame.rollDeck()"
                    style="padding:14px 45px;background:linear-gradient(135deg,#667eea,#764ba2);
                    color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;
                    box-shadow:0 5px 20px rgba(102,126,234,0.4);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(102,126,234,0.5)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(102,126,234,0.4)'">
                    🎲 Rút bài nghề nghiệp <span style="opacity:0.8;font-size:13px;">(ra 3 chọn 1)</span>
                </button>
            </div>
            
            <div style="display:flex;gap:15px;justify-content:center;">
                <button onclick="ACJTGame.goToStep(4)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← Bước trước
                </button>
                <button onclick="ACJTGame.confirmCreation()" ${!canStart ? 'disabled' : ''}
                    style="padding:14px 55px;background:${canStart ? 'linear-gradient(135deg,#2ed573,#26de81)' : 'rgba(255,255,255,0.05)'};
                    color:${canStart ? '#fff' : '#666'};border:none;border-radius:25px;cursor:${canStart ? 'pointer' : 'not-allowed'};font-size:16px;font-weight:bold;
                    box-shadow:${canStart ? '0 5px 25px rgba(46,213,115,0.4)' : 'none'};opacity:${canStart ? '1' : '0.6'};transition:all 0.3s;"
                    ${canStart ? `onmouseover="this.style.transform='translateY(-2px) scale(1.02)';this.style.boxShadow='0 8px 30px rgba(46,213,115,0.5)'"
                    onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 5px 25px rgba(46,213,115,0.4)'"` : ''}>
                    🎮 Bắt đầu cuộc phiêu lưu
                </button>
            </div>
        `;
    },

    // Hàm bổ trợ
    refreshStep: function () {
        const modal = document.getElementById('acjtCharCreationModal');
        if (modal) modal.innerHTML = this.generateStepHTML();
    },

    selectProfession: function (profId) {
        this.charData.professionId = profId;
        this.refreshStep();
    },

    selectRace: function (raceId) {
        this.charData.raceId = raceId;
        this.refreshStep();
    },

    setBodyAttr: function (type, value) {
        this.charData.bodyAttributes[type] = value;
        this.refreshStep();
    },

    toggleStatus: function (statusId) {
        const idx = this.charData.startingStatuses.indexOf(statusId);
        if (idx >= 0) {
            this.charData.startingStatuses.splice(idx, 1);
        } else {
            // Kiểm tra đủ điểm không (trạng thái tích cực tiêu tốn điểm)
            const status = StartingStatusConfig[statusId];
            if (status.points < 0 && this.calculatePoints() + status.points < 10) {
                alert('Không đủ điểm! Cần giữ lại ít nhất 10 điểm để Roll bộ bài');
                return;
            }
            this.charData.startingStatuses.push(statusId);
        }
        this.refreshStep();
    },

    selectOrigin: function (originId) {
        // Kiểm tra điểm
        const oldOrigin = OriginConfig[this.charData.originId];
        const newOrigin = OriginConfig[originId];
        const pointsDiff = (newOrigin?.points || 0) - (oldOrigin?.points || 0);
        if (this.calculatePoints() + pointsDiff < 10) {
            alert('Không đủ điểm!');
            return;
        }
        this.charData.originId = originId;
        this.refreshStep();
    },

    // Roll bộ bài - Xuất hiện 3 lá nghề nghiệp để chọn
    rollDeck: function () {
        // Kiểm tra đủ điểm không (Mỗi lần Roll tốn 10 điểm)
        const currentPoints = this.calculatePoints();
        if (currentPoints < 10) {
            alert('Không đủ điểm! Mỗi lần Roll tốn 10 điểm, hiện còn ' + currentPoints + ' điểm');
            return;
        }

        const prof = ProfessionConfig[this.charData.professionId];

        // Lấy kho bài riêng của nghề nghiệp
        const profCards = prof.professionCardPool || [];
        if (profCards.length === 0) {
            console.warn('Nghề nghiệp này không có kho bài riêng');
            return;
        }

        // Tăng đếm số lần roll (mỗi lần roll tốn 10 điểm)
        this.charData._rollCount = (this.charData._rollCount || 0) + 1;

        // Rút ngẫu nhiên 3 lá không trùng lặp
        const shuffled = [...profCards].sort(() => Math.random() - 0.5);
        const rolledIds = shuffled.slice(0, 3);

        // Chuyển thành đối tượng thẻ bài
        this.charData.rolledCards = rolledIds.map(cardId => {
            const card = CardLibrary.find(c => c.id === cardId);
            return card ? { ...card } : null;
        }).filter(c => c);

        // Làm mới giao diện
        this.refreshStep();
    },

    // Chọn thẻ bài vừa Roll ra
    selectRolledCard: function (index) {
        if (!this.charData.selectedProfCards) {
            this.charData.selectedProfCards = [];
        }

        // Chọn tối đa 2 lá
        if (this.charData.selectedProfCards.length >= 2) {
            return;
        }

        // Lấy thẻ đã chọn
        const card = this.charData.rolledCards[index];
        if (!card) return;

        // Thêm vào danh sách đã chọn
        this.charData.selectedProfCards.push(card);

        // Xóa danh sách thẻ vừa roll
        this.charData.rolledCards = [];

        // Làm mới giao diện
        this.refreshStep();
    },

    // Xóa thẻ nghề nghiệp đã chọn
    removeSelectedCard: function (index) {
        if (!this.charData.selectedProfCards) return;

        // Xóa thẻ chỉ định
        this.charData.selectedProfCards.splice(index, 1);

        // Làm mới giao diện
        this.refreshStep();
    },

    // Xác nhận khởi tạo
    confirmCreation: function () {
        // Kiểm tra đã chọn đủ 2 lá nghề nghiệp chưa
        const selectedCount = this.charData.selectedProfCards?.length || 0;
        if (selectedCount < 2) {
            alert('Vui lòng Roll và chọn đủ 2 thẻ nghề nghiệp!');
            return;
        }

        // Xác thực tên
        const playerName = this.charData.name.trim();
        if (!playerName) {
            alert('Vui lòng nhập tên nhân vật!');
            this.goToStep(1);
            return;
        }

        // Xây dựng bộ bài cuối cùng: 8 lá cơ bản + 2 lá nghề nghiệp đã chọn
        CardDeckManager.deck = [];

        // 🆕 Kiểm tra xem có phải Thiếu nữ Ma pháp không
        const isMagicalGirl = this.charData.professionId === 'magicalGirl';

        // Thêm 4 lá Tấn công thường
        for (let i = 0; i < 4; i++) {
            const card = CardLibrary.find(c => c.id === 'attack_001');
            if (card) CardDeckManager.deck.push({ ...card });
        }

        // Thêm Đỡ đòn (Thiếu nữ Ma pháp ít hơn 1 lá, thay bằng thẻ biến thân)
        const armorCount = isMagicalGirl ? 2 : 3;
        for (let i = 0; i < armorCount; i++) {
            const card = CardLibrary.find(c => c.id === 'armor_001');
            if (card) CardDeckManager.deck.push({ ...card });
        }

        // 🆕 Thiếu nữ Ma pháp thêm thẻ Biến thân
        if (isMagicalGirl) {
            const card = CardLibrary.find(c => c.id === 'mg_transform');
            if (card) CardDeckManager.deck.push({ ...card });
            console.log('[Khởi tạo] Thiếu nữ Ma pháp thêm thẻ Biến thân');
        }

        // Thêm 1 lá Nháy mắt quyến rũ
        const meimei = CardLibrary.find(c => c.id === 'h_attack_001');
        if (meimei) CardDeckManager.deck.push({ ...meimei });

        // Thêm 2 lá nghề nghiệp đã chọn
        this.charData.selectedProfCards.forEach(card => {
            CardDeckManager.deck.push({ ...card });
        });

        // Khởi tạo người chơi (Sử dụng đầy đủ dữ liệu khởi tạo)
        PlayerState.init(this.charData.professionId, playerName, {
            age: this.charData.age,
            raceId: this.charData.raceId,
            bodyAttributes: this.charData.bodyAttributes,
            originId: this.charData.originId,
            startingStatuses: this.charData.startingStatuses
        });
        PlayerState.save();

        // Lưu bộ bài
        saveCardDeck();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        // Đóng giao diện khởi tạo
        document.getElementById('acjtCharCreationModal')?.remove();

        // 🎮 Xóa khu vực lịch sử game (Gỡ bỏ menu chính)
        const gameHistory = document.getElementById('gameHistory');
        if (gameHistory) {
            gameHistory.innerHTML = '';
            console.log('[ACJT] Đã xóa menu chính');
        }

        // 🎮 Xóa sơ đồ nhân vật (Game mới không nên giữ lại nhân vật của bản lưu cũ)
        if (window.characterGraphManager) {
            window.characterGraphManager.characters.clear();
            window.characterGraphManager.vectors.clear();
            window.characterGraphManager.stats = {
                totalCharacters: 0,
                lastUpdate: null,
                matchCount: 0,
                avgMatchScore: 0
            };
            // Xóa dữ liệu sơ đồ nhân vật trong IndexedDB
            if (window.characterGraphManager.indexedDB) {
                try {
                    const db = window.characterGraphManager.indexedDB;
                    const transaction = db.transaction(['characters'], 'readwrite');
                    const store = transaction.objectStore('characters');
                    store.clear();
                    console.log('[ACJT] Đã xóa sơ đồ nhân vật');
                } catch (e) {
                    console.error('[ACJT] Xóa sơ đồ nhân vật thất bại:', e);
                }
            }
        }

        // 🎮 Thiết lập trạng thái game đã bắt đầu (để sendUserInput hoạt động bình thường)
        if (typeof gameState !== 'undefined') {
            gameState.isGameStarted = true;
            gameState.conversationHistory = []; // Xóa lịch sử đối thoại

            // 🔧 Đặt lại hoàn toàn biểu mẫu biến số (Xóa toàn bộ dữ liệu cũ)
            const race = RaceConfig[this.charData.raceId];
            const origin = OriginConfig[this.charData.originId];
            gameState.variables = {
                name: this.charData.name,
                age: this.charData.age,
                gender: 'Nữ',
                race: race?.name || 'Người',
                raceId: this.charData.raceId,
                job: PlayerState.profession?.name || 'Nhà mạo hiểm',
                profession: PlayerState.profession?.id || null,
                professionName: PlayerState.profession?.name || 'Nhà mạo hiểm',
                origin: origin?.name || 'Nhà mạo hiểm mới vào nghề',
                originId: this.charData.originId,
                identity: 'Nhà mạo hiểm tòa tháp AC',
                location: 'Lối vào tòa tháp AC',
                currentDateTime: 'Chưa rõ',
                corruption: PlayerState.corruption || 0,
                isVirgin: this.charData.isVirgin,
                bodyAttributes: this.charData.bodyAttributes,
                relationships: [],
                history: [],
                items: [],
                protagonist: null,
                specialStatus: {}
            };
            console.log('[ACJT] Trạng thái game đã được đặt lại hoàn toàn');

            // Lưu ngay vào IndexedDB (đảm bảo khôi phục sau khi làm mới trang)
            if (typeof saveGameHistory === 'function') {
                saveGameHistory().then(() => {
                    console.log('[ACJT] Trạng thái game đã được lưu vào IndexedDB');
                }).catch(err => console.error('[ACJT] Lưu thất bại:', err));
            }
        }

        // Xóa trạng thái đặc biệt và thêm các trạng thái ban đầu
        if (typeof SpecialStatusManager !== 'undefined') {
            SpecialStatusManager.statuses = {};

            // Thêm các trạng thái đặc biệt đã chọn lúc bắt đầu
            this.charData.startingStatuses.forEach(statusId => {
                const status = StartingStatusConfig[statusId];
                if (status) {
                    const finalId = statusId.startsWith('start_') ? statusId : 'start_' + statusId;
                    SpecialStatusManager.statuses[finalId] = {
                        id: finalId,
                        name: status.name,
                        icon: status.icon,
                        desc: status.effect,
                        fullDesc: status.description,
                        permanent: true,
                        effect: 'startingStatus',
                        source: 'starting', // 🔧 Đánh dấu chọn lúc bắt đầu, sẽ không bị giáo đường xóa
                        ...status.statusEffect
                    };
                }
            });

            SpecialStatusManager.save();
            SpecialStatusManager.updateDisplay();
            SpecialStatusManager.applyEffects(); // 🔧 Tính toán lại các hiệu chỉnh hiệu ứng
        }

        // 🔧 Xóa các hiệu chỉnh hiệu ứng trạng thái cũ
        if (typeof PlayerState !== 'undefined') {
            PlayerState.statusEffects = { energyMod: 0, attackMod: 0, defenseMod: 0, maxHpMod: 0, damageTakenMod: 0 };
            PlayerState.updateDisplay();
        }

        // 🔧 Xóa lịch sử mua sắm chợ đen, nhưng đánh dấu các món cùng loại đã chọn lúc bắt đầu
        if (typeof BlackMarketSystem !== 'undefined') {
            BlackMarketSystem.purchasedMods = [];

            this.charData.startingStatuses.forEach(statusId => {
                const status = StartingStatusConfig[statusId];
                if (status && status.linkedBodyMod) {
                    BlackMarketSystem.purchasedMods.push(status.linkedBodyMod);
                }
            });

            BlackMarketSystem.savePurchased();
            console.log('[ACJT] Chợ đen đã đánh dấu trạng thái bắt đầu:', BlackMarketSystem.purchasedMods);
        }

        // 🎮 Xóa thư viện vector (contextVectorManager là cái chính được dùng)
        if (window.contextVectorManager) {
            window.contextVectorManager.clear();
            // Đảm bảo IndexedDB cũng được xóa sạch
            window.contextVectorManager.saveToIndexedDB().then(() => {
                console.log('[ACJT] ✅ Đã xóa contextVectorManager (bao gồm IndexedDB)');
            }).catch(err => console.error('[ACJT] Xóa thư viện vector thất bại:', err));
        }
        // Tương thích với vectorLib phiên bản cũ
        if (window.vectorLib) {
            window.vectorLib.conversations = new Map();
            window.vectorLib.historyLayers = [];
            if (window.vectorLib.saveToIndexedDB) {
                window.vectorLib.saveToIndexedDB();
            }
            console.log('[ACJT] Đã xóa ma trận lịch sử (vectorLib)');
        }
        // Xóa trình quản lý ma trận
        if (window.matrixManager) {
            if (window.matrixManager.clear) {
                window.matrixManager.clear();
            } else {
                window.matrixManager.layers = [];
            }
            console.log('[ACJT] ✅ Đã xóa trình quản lý ma trận');
        }

        // 🎮 Làm mới hiển thị thanh trạng thái
        if (typeof renderStatusPanel === 'function') {
            renderStatusPanel(gameState.variables);
            console.log('[ACJT] Thanh trạng thái đã làm mới');
        }

        this.isGameStarted = true;

        // 🎮 Gửi gợi ý bắt đầu cho AI
        this.sendOpeningPrompt();
    },

    // Gửi gợi ý bắt đầu
    sendOpeningPrompt: function () {
        const d = this.charData;
        const prof = ProfessionConfig[d.professionId];
        const race = RaceConfig[d.raceId];
        const origin = OriginConfig[d.originId];
        const body = d.bodyAttributes;

        // Lấy mô tả thuộc tính cơ thể
        const getBodyDesc = (type, id) => {
            const item = BodyConfig[type]?.find(i => i.id === id);
            return item ? item.desc : '';
        };

        // Xây dựng mô tả trạng thái đặc biệt
        let statusDesc = '';
        if (d.startingStatuses.length > 0) {
            statusDesc = '\n- Trạng thái đặc biệt: ';
            d.startingStatuses.forEach(sid => {
                const s = StartingStatusConfig[sid];
                if (s) statusDesc += `【${s.name}】${s.description}; `;
            });
        }

        // Lai lịch tùy chỉnh
        let customBg = d.customBackground ? `\n- Lai lịch bổ sung: ${d.customBackground}` : '';

        const openingPrompt = `Bắt đầu trò chơi. Thông tin đầy đủ về nhân vật của tôi:
- Tên: ${d.name}
- Giới tính: Nữ
- Tuổi: ${d.age} tuổi
- Chủng tộc: ${race?.icon || ''} ${race?.name || 'Người'} (${race?.description || ''})
- Nghề nghiệp: ${prof?.name || 'Nhà mạo hiểm'} (${prof?.description || ''})
- Xuất thân: ${origin?.icon || ''} ${origin?.name || 'Nhà mạo hiểm mới vào nghề'} (${origin?.description || ''})
- Còn trinh: ${d.isVirgin ? 'Có' : 'Không'}
- Chiều cao/Thể hình: ${getBodyDesc('height', body.height)}, ${getBodyDesc('weight', body.weight)}
- Ngực: ${BodyConfig.chest.find(i => i.id === body.chest)?.name || 'Cúp C'}
- Mông: ${getBodyDesc('hips', body.hips)}
- Đặc điểm vùng kín: ${getBodyDesc('vagina', body.vagina)}${statusDesc}${customBg}

【CỰC KỲ QUAN TRỌNG】 Đây là khởi đầu của trò chơi, phải hoàn thành các nhiệm vụ sau:
- (Phần vagina phải thể hiện đặc điểm "${getBodyDesc('vagina', body.vagina)}")
- Tạo cốt truyện khởi đầu hợp lý dựa trên xuất thân "${origin?.name || 'Nhà mạo hiểm mới vào nghề'}"

Vui lòng tạo một đoạn cốt truyện khởi đầu đặc sắc tối thiểu 600 chữ, miêu tả:
- Đặc điểm ngoại hình của nhân vật chính (lồng ghép chủng tộc "${race?.name}" và các thuộc tính cơ thể)
- Lý do đến với tòa tháp AC (tương ứng với xuất thân "${origin?.name}")
- Cảnh tượng và tâm lý khi bước chân vào lối vào tòa tháp.`;

        console.log('[ACJT] Gửi gợi ý bắt đầu:', openingPrompt);
        this.sendToAI(openingPrompt);
    },

    // Hiển thị nút Tiếp tục tiến bước
    showContinueButton: function () {
        const btn = document.getElementById('acjtContinueBtn');
        if (btn) {
            btn.style.display = 'block';
        }
    },

    // Ẩn nút Tiếp tục tiến bước
    hideContinueButton: function () {
        const btn = document.getElementById('acjtContinueBtn');
        if (btn) {
            btn.style.display = 'none';
        }
    },

    // Gửi tin nhắn cho AI
    sendToAI: function (message) {
        console.log('[ACJT] Gửi cho AI:', message);

        // Đảm bảo trạng thái game là đã bắt đầu (tránh gợi ý "Vui lòng tạo nhân vật trước")
        if (typeof gameState !== 'undefined' && !gameState.isGameStarted) {
            gameState.isGameStarted = true;
            console.log('[ACJT] Tự động thiết lập trạng thái game là đã bắt đầu');
        }

        // Xây dựng tin nhắn và gửi
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.value = message;
            // Kích hoạt gửi
            if (typeof sendUserInput === 'function') {
                sendUserInput();
            }
        }

        // Đánh dấu cần thêm tùy chọn "Tiếp tục tiến bước"
        this.needContinueOption = true;
    },

    // 🔧 Ghi vào lịch sử quan trọng (Thư viện vector + Ma trận)
    recordToHistory: function (text) {
        console.log('[ACJT] Ghi vào lịch sử:', text);

        // 1. Thêm vào gameState.variables.history (lưu dưới dạng chuỗi)
        if (typeof gameState !== 'undefined') {
            if (!gameState.variables.history) {
                gameState.variables.history = [];
            }
            // Định dạng: [Tầng N] Nội dung sự kiện
            const historyText = `[Tầng ${PlayerState.floor || 1}] ${text}`;
            gameState.variables.history.push(historyText);

            // Cập nhật hiển thị thanh trạng thái
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }
        }

        // 2. Thêm vào thư viện vector
        if (typeof window.contextVectorManager !== 'undefined' && window.contextVectorManager.addToHistoryLibrary) {
            window.contextVectorManager.addToHistoryLibrary(text);
            console.log('[ACJT] Đã thêm vào thư viện vector');
        }

        // 3. Thêm vào ma trận (nếu có)
        if (typeof window.matrixManager !== 'undefined' && window.matrixManager.addEntry) {
            window.matrixManager.addEntry({
                type: 'history',
                content: text,
                timestamp: Date.now()
            });
            console.log('[ACJT] Đã thêm vào ma trận');
        }

        // 4. Lưu trạng thái trò chơi
        if (typeof saveGameHistory === 'function') {
            saveGameHistory().catch(err => console.error('[ACJT] Lưu thất bại:', err));
        }
    },

    // Thêm tùy chọn "Tiếp tục tiến bước" sau phản hồi của AI
    addContinueOption: function () {
        if (!this.needContinueOption) return;

        // 🔧 Đợi AI hoàn thành việc tạo xong mới thêm nút
        const waitForComplete = (attempts = 0) => {
            if (attempts > 30) { // Đợi tối đa 15 giây
                this.needContinueOption = false;
                return;
            }

            // Kiểm tra xem nút gửi có bị vô hiệu hóa không (biểu thị AI đang tạo nội dung)
            const sendBtn = document.getElementById('sendMessage');
            const isGenerating = sendBtn && sendBtn.disabled;

            if (isGenerating) {
                // AI đang tạo nội dung, tiếp tục đợi
                setTimeout(() => waitForComplete(attempts + 1), 500);
                return;
            }

            // AI đã xong, thử thêm nút
            const optionsContainer = document.querySelector('.options-container');
            // Tránh thêm lặp lại
            if (document.querySelector('.acjt-continue-btn')) {
                this.needContinueOption = false;
                return;
            }

            if (optionsContainer) {
                this.needContinueOption = false;

                const continueBtn = document.createElement('button');
                continueBtn.className = 'option-btn acjt-continue-btn';
                continueBtn.innerHTML = 'Tiếp tục tiến bước (Vào tầng tiếp theo)';
                continueBtn.style.cssText = `
                    background: linear-gradient(135deg, #2ed573, #26de81) !important;
                    border: none !important; padding: 12px 20px !important; border-radius: 8px !important;
                    color: #fff !important; cursor: pointer !important; font-size: 14px !important; 
                    margin-top: 10px !important; width: 100% !important;
                `;
                continueBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    RouteSystem.showRouteSelection();
                };
                optionsContainer.appendChild(continueBtn);
                console.log('[ACJT] Đã thêm nút Tiếp tục tiến bước');
            } else {
                // Thử lại
                setTimeout(() => waitForComplete(attempts + 1), 500);
            }
        };

        // Bắt đầu kiểm tra sau một khoảng trễ để tránh kiểm tra quá sớm
        setTimeout(() => waitForComplete(), 1500);
    }
};

// ==================== Hàm khởi tạo ====================
function initCardSystem() {
    // Thử tải từ localStorage
    const savedDeck = localStorage.getItem('acjt_card_deck');
    if (savedDeck) {
        try {
            CardDeckManager.init(JSON.parse(savedDeck));
        } catch (e) {
            console.error('[Hệ thống thẻ bài] Tải bộ bài thất bại:', e);
            CardDeckManager.deck = [];
        }
    }

    // Tải trạng thái người chơi
    PlayerState.load();

    // Tải trạng thái đặc biệt
    SpecialStatusManager.load();

    // Tải cải tạo cơ thể (đồng bộ vào trạng thái đặc biệt)
    BlackMarketSystem.loadPurchased();

    // Kết xuất (Render)
    CardDeckManager.renderDeck();
    PlayerState.updateDisplay();

    // 🎮 Nếu game đã bắt đầu (có bản lưu trạng thái người chơi), hiển thị nút Tiếp tục tiến bước
    if (PlayerState.floor > 0 || CardDeckManager.deck.length > 0) {
        ACJTGame.showContinueButton();
        ACJTGame.isGameStarted = true;
        // Đồng bộ trạng thái game
        if (typeof gameState !== 'undefined') {
            gameState.isGameStarted = true;
        }
        console.log('[Hệ thống thẻ bài] Phát hiện có bản lưu hiện tại, hiển thị nút Tiếp tục tiến bước');
    }

    console.log('[Hệ thống thẻ bài] Khởi tạo hoàn tất');
}

// Lưu bộ bài
function saveCardDeck() {
    const deckData = CardDeckManager.getDeckData();
    localStorage.setItem('acjt_card_deck', JSON.stringify(deckData));
    console.log('[Hệ thống thẻ bài] Bộ bài đã được lưu');
}

// Ghi đè hàm startGame gốc
window.acjtStartGame = function () {
    console.log('[ACJT] Bắt đầu trò chơi');
    ACJTGame.showCharacterCreation();
};

// Theo dõi AI phản hồi xong để thêm tùy chọn Tiếp tục tiến bước
// Sử dụng MutationObserver để theo dõi việc thêm các container tùy chọn (options-container)
const setupContinueOptionObserver = () => {
    const gameHistory = document.getElementById('gameHistory');
    if (!gameHistory) {
        setTimeout(setupContinueOptionObserver, 500);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        if (ACJTGame.needContinueOption) {
            // Kiểm tra xem có options-container mới nào được thêm không
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const optionsContainer = node.querySelector?.('.options-container') ||
                            (node.classList?.contains('options-container') ? node : null);
                        if (optionsContainer) {
                            ACJTGame.addContinueOption();
                            break;
                        }
                    }
                }
            }
        }
    });

    observer.observe(gameHistory, { childList: true, subtree: true });
    console.log('[ACJT] Trình quan sát container tùy chọn đã khởi động');
};

// Khởi động trình quan sát sau khi trang tải xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContinueOptionObserver);
} else {
    setTimeout(setupContinueOptionObserver, 500);
}

// ==================== Xuất ra toàn cục ====================
window.CardType = CardType;
window.CardTypeNames = CardTypeNames;
window.CardTypeColors = CardTypeColors;
window.CardLibrary = CardLibrary;
window.CardDeckManager = CardDeckManager;
window.AICardParser = AICardParser;
window.RouteType = RouteType;
window.RouteTypeConfig = RouteTypeConfig;
window.RouteSystem = RouteSystem;
window.BattleSystem = BattleSystem;
window.ShopSystem = ShopSystem;
window.RestSystem = RestSystem;
window.TownSystem = TownSystem;
window.BlackMarketSystem = BlackMarketSystem;
window.CultivationSystem = CultivationSystem;
window.BodyModConfig = BodyModConfig;
window.PlayerState = PlayerState;
window.ProfessionConfig = ProfessionConfig;
window.RaceConfig = RaceConfig;
window.BodyConfig = BodyConfig;
window.StartingStatusConfig = StartingStatusConfig;
window.OriginConfig = OriginConfig;
window.MonsterConfig = MonsterConfig;
window.RelicConfig = RelicConfig;
window.SpecialStatusConfig = SpecialStatusConfig;
window.SpecialStatusManager = SpecialStatusManager;
window.RandomEventPrompts = RandomEventPrompts;
window.ACJTGame = ACJTGame;
window.initCardSystem = initCardSystem;
window.saveCardDeck = saveCardDeck;

// Khởi tạo sau khi tải trang hoàn tất
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initCardSystem, 500);
    });
} else {
    setTimeout(initCardSystem, 500);
}

console.log('[Hệ thống thẻ bài] acjt-cards.js đã được tải');

// ==================== Trình chỉnh sửa biến số chuyên dụng cho ACJT ====================
function openACJTVariableEditor() {
    const modal = document.createElement('div');
    modal.id = 'acjtVariableEditorModal';
    modal.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); display: flex;
        justify-content: center; align-items: center; z-index: 10000;
        padding: 20px; box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #667eea; border-radius: 16px;
        padding: 25px; width: 100%; max-width: 600px; max-height: 90vh;
        overflow-y: auto; color: #fff;
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #667eea; font-size: 18px;">🎮 Trình chỉnh sửa biến số ACJT</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="saveACJTVariables()" style="padding: 8px 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Lưu</button>
                <button onclick="document.getElementById('acjtVariableEditorModal')?.remove()" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Đóng</button>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ffd700; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">👤 Thông tin cơ bản</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Tên</label>
                    <input type="text" id="acjt-ve-name" value="${PlayerState.name || ''}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #fff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Nghề nghiệp</label>
                    <input type="text" id="acjt-ve-profession" value="${PlayerState.profession?.name || 'Không'}" disabled style="width: 100%; padding: 8px; background: #1a1a3a; border: 1px solid #333; border-radius: 4px; color: #666; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Tầng hiện tại</label>
                    <input type="number" id="acjt-ve-floor" value="${PlayerState.floor || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #fff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Vàng 💰</label>
                    <input type="number" id="acjt-ve-gold" value="${PlayerState.gold || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ffd700; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ff6b81; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">⚔️ Thuộc tính chiến đấu</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Sinh mệnh ❤️</label>
                    <input type="number" id="acjt-ve-hp" value="${PlayerState.hp || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff6b81; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Sinh mệnh tối đa</label>
                    <input type="number" id="acjt-ve-maxHp" value="${PlayerState.maxHp || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff6b81; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Năng lượng ⚡</label>
                    <input type="number" id="acjt-ve-energy" value="${PlayerState.energy || 3}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ffd700; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Tấn công</label>
                    <input type="number" id="acjt-ve-attack" value="${PlayerState.attack || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff4757; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Phòng thủ</label>
                    <input type="number" id="acjt-ve-defense" value="${PlayerState.defense || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #70a1ff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Giáp cơ bản 🛡️</label>
                    <input type="number" id="acjt-ve-baseArmor" value="${PlayerState.baseArmor || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #70a1ff; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #9c88ff; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">💜 Thuộc tính đặc biệt</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Đọa lạc 💜</label>
                    <input type="number" id="acjt-ve-corruption" value="${PlayerState.corruption || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #9c88ff; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ffa502; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">⏪ Quay lại tầng trước (Rollback)</h3>
            <div style="font-size: 11px; color: #888; margin-bottom: 10px;">Quay lại tầng trước sẽ khôi phục các trạng thái đọa lạc, vàng, bộ bài... tại thời điểm đó</div>
            <div id="acjt-ve-snapshots" style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${generateFloorSnapshotButtons()}
            </div>
        </div>
        
        <div>
            <h3 style="color: #2ed573; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">🏆 Cổ vật (${PlayerState.relics?.length || 0} cái)</h3>
            <div id="acjt-ve-relics" style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${(PlayerState.relics || []).map((r, i) => `
                    <div style="background: #2a2a4a; border: 1px solid #444; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                        <span>${RelicConfig[r]?.icon || '🏆'}</span>
                        <span style="font-size: 12px;">${RelicConfig[r]?.name || r}</span>
                        <button onclick="removeACJTRelic(${i})" style="background: #ff4757; border: none; border-radius: 4px; color: #fff; padding: 2px 6px; cursor: pointer; font-size: 10px;">×</button>
                    </div>
                `).join('') || '<span style="color: #666; font-size: 12px;">Chưa có cổ vật</span>'}
            </div>
        </div>
    `;

    modal.appendChild(content);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// Lưu các biến số ACJT
function saveACJTVariables() {
    PlayerState.name = document.getElementById('acjt-ve-name')?.value || 'Lữ hành giả';
    PlayerState.floor = parseInt(document.getElementById('acjt-ve-floor')?.value) || 0;
    PlayerState.gold = parseInt(document.getElementById('acjt-ve-gold')?.value) || 0;
    PlayerState.hp = parseInt(document.getElementById('acjt-ve-hp')?.value) || 70;
    PlayerState.maxHp = parseInt(document.getElementById('acjt-ve-maxHp')?.value) || 70;
    PlayerState.energy = parseInt(document.getElementById('acjt-ve-energy')?.value) || 3;
    PlayerState.attack = parseInt(document.getElementById('acjt-ve-attack')?.value) || 0;
    PlayerState.defense = parseInt(document.getElementById('acjt-ve-defense')?.value) || 0;
    PlayerState.baseArmor = parseInt(document.getElementById('acjt-ve-baseArmor')?.value) || 0;
    PlayerState.corruption = parseInt(document.getElementById('acjt-ve-corruption')?.value) || 0;

    // Lưu vào localStorage
    PlayerState.save();

    // Cập nhật hiển thị
    PlayerState.updateDisplay();
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // Đóng cửa sổ pop-up
    document.getElementById('acjtVariableEditorModal')?.remove();

    if (typeof showNotification === 'function') {
        showNotification('Biến số đã được lưu', 'success');
    } else {
        alert('Biến số đã được lưu');
    }
}

// Gỡ bỏ Cổ vật
function removeACJTRelic(index) {
    if (PlayerState.relics && PlayerState.relics[index] !== undefined) {
        PlayerState.relics.splice(index, 1);
        PlayerState.save();
        // Làm mới trình chỉnh sửa
        document.getElementById('acjtVariableEditorModal')?.remove();
        openACJTVariableEditor();
    }
}

// 🔧 Tạo HTML nút Snapshot các tầng
function generateFloorSnapshotButtons() {
    const snapshots = PlayerState.floorSnapshots || {};
    const floors = Object.keys(snapshots);

    if (floors.length === 0) {
        return '<span style="color: #666; font-size: 12px;">Chưa có bản ghi nhanh (Tự động tạo khi vào tầng mới)</span>';
    }

    return floors.sort((a, b) => parseInt(b) - parseInt(a)).map(floor => {
        const snapshot = snapshots[floor];
        return '<button onclick="rollbackToFloorConfirm(' + floor + ')" ' +
            'style="background: linear-gradient(135deg, #ffa502 0%, #ff7f50 100%); ' +
            'border: none; border-radius: 6px; padding: 8px 12px; ' +
            'color: #fff; cursor: pointer; font-size: 12px;">' +
            'Tầng ' + floor + ' (Đọa lạc: ' + snapshot.corruption + ')' +
            '</button>';
    }).join('');
}

// 🔧 Xác nhận quay lại tầng trước (Rollback)
function rollbackToFloorConfirm(targetFloor) {
    const snapshot = PlayerState.floorSnapshots[targetFloor];
    if (!snapshot) {
        alert('Không tìm thấy bản ghi nhanh cho tầng này');
        return;
    }

    const confirmMsg = 'Bạn có chắc chắn muốn quay lại Tầng ' + targetFloor + ' không?\n\n' +
        'Trạng thái sau khi quay lại:\n' +
        '- Điểm đọa lạc: ' + snapshot.corruption + '\n' +
        '- Vàng: ' + snapshot.gold + '\n' +
        '- HP: ' + snapshot.hp + '/' + snapshot.maxHp + '\n\n' +
        'Lưu ý: Toàn bộ tiến trình sau tầng này sẽ bị mất!';

    if (confirm(confirmMsg)) {
        PlayerState.rollbackToFloor(targetFloor);

        // Đồng bộ vào biểu mẫu biến số
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        // Làm mới trình chỉnh sửa
        document.getElementById('acjtVariableEditorModal')?.remove();
        openACJTVariableEditor();

        if (typeof showNotification === 'function') {
            showNotification('Đã quay lại Tầng ' + targetFloor, 'success');
        } else {
            alert('Đã quay lại Tầng ' + targetFloor);
        }
    }
}

// Ghi đè hàm openVariableEditor gốc (Sử dụng trình chỉnh sửa chuyên dụng trong chế độ ACJT)
window.openVariableEditor = function () {
    if (typeof PlayerState !== 'undefined' && PlayerState.profession) {
        // Chế độ ACJT: Sử dụng trình chỉnh sửa riêng
        openACJTVariableEditor();
    } else if (typeof window._originalOpenVariableEditor === 'function') {
        // Không phải chế độ ACJT: Sử dụng trình chỉnh sửa gốc
        window._originalOpenVariableEditor();
    }
};

// Lưu tham chiếu đến hàm gốc
if (typeof openVariableEditor === 'function' && !window._originalOpenVariableEditor) {
    window._originalOpenVariableEditor = openVariableEditor;
}

window.openACJTVariableEditor = openACJTVariableEditor;
window.saveACJTVariables = saveACJTVariables;
window.removeACJTRelic = removeACJTRelic;
window.generateFloorSnapshotButtons = generateFloorSnapshotButtons;
window.rollbackToFloorConfirm = rollbackToFloorConfirm;

// ==================== Ghi đè tùy chọn trạng thái Thôi miên - Giám sát DOM ====================
// Sử dụng MutationObserver để giám sát sự thay đổi của các nút tùy chọn, tự động áp dụng ghi đè thôi miên khi tùy chọn mới xuất hiện
(function initHypnosisOptionOverrideObserver() {
    // Đợi DOM sẵn sàng
    function setupObserver() {
        const gameHistory = document.getElementById('gameHistory');
        if (!gameHistory) {
            console.log('[Ghi đè thôi miên] Đang đợi phần tử gameHistory...');
            setTimeout(setupObserver, 500);
            return;
        }

        const observer = new MutationObserver(function (mutations) {
            // Kiểm tra xem có nút tùy chọn mới không
            let hasNewOptions = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Kiểm tra xem nút mới thêm có chứa nút tùy chọn không
                        if (node.classList?.contains('option-btn') ||
                            node.querySelector?.('.option-btn') ||
                            node.querySelector?.('.options-container')) {
                            hasNewOptions = true;
                        }
                    }
                });
            });

            if (hasNewOptions && window.HypnosisOptionOverride) {
                // Thực thi trễ một chút để đảm bảo các nút tùy chọn đã render hoàn toàn
                setTimeout(() => {
                    if (window.HypnosisOptionOverride.shouldOverride()) {
                        window.HypnosisOptionOverride.applyOverride();
                        window.HypnosisOptionOverride.modifyOptionButtons();
                    }
                }, 100);
            }
        });

        observer.observe(gameHistory, {
            childList: true,
            subtree: true
        });

        console.log('[Ghi đè thôi miên] Đã khởi động giám sát DOM');

        // Kiểm tra lần đầu (có thể đã có tùy chọn khi trang tải xong)
        if (window.HypnosisOptionOverride && window.HypnosisOptionOverride.shouldOverride()) {
            setTimeout(() => {
                window.HypnosisOptionOverride.applyOverride();
                window.HypnosisOptionOverride.modifyOptionButtons();
            }, 500);
        }
    }

    // Khởi động giám sát sau khi tải trang hoàn tất
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
        setupObserver();
    }
})();
