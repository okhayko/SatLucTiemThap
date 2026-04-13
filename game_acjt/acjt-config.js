/**
 * Cấu hình trò chơi hiện đại - Modern Game Configuration
 * Bao gồm các nội dung đặc thù của thế giới game hiện đại: tạo nhân vật, trường trạng thái, logic hiển thị, v.v.
 */

// Nội dung gợi ý hệ thống trò chơi đầy đủ (Cơ bản)
const fullSystemPrompt = `

 【QUAN TRỌNG】 Quy tắc tạo tùy chọn (phải tuân thủ nghiêm ngặt):
Mỗi lần phải cung cấp chính xác 4 tùy chọn, tương ứng với các loại sau:

Tùy chọn 1 - Đối thoại/Tương tác:
   Nói chuyện với các nhân vật trong cảnh hiện tại
   Hỏi thông tin, nghe ngóng tin tức
   Tương tác xã hội, thiết lập quan hệ
   Ví dụ: "Trò chuyện với chủ tiệm, nghe ngóng tin tức gần đây"

Tùy chọn 2 - Bỏ qua/Rời đi:
   Đẩy nhanh cốt truyện, bỏ qua cảnh hiện tại
   Rời khỏi địa điểm hiện tại
   Không tham gia vào sự kiện hiện tại
   Ví dụ: "Cáo từ rời đi, tiến đến địa điểm tiếp theo"

Tùy chọn 3 - Bước ngoặt/Hành động:
   Đưa ra quyết định quan trọng
   Tham gia chiến đấu hoặc mạo hiểm
   Huấn luyện, khám phá, tìm kiếm manh mối
   Hành động có thể mang lại bước ngoặt cho cốt truyện
   Ví dụ: "Tiến sâu vào nhà máy bỏ hoang để khám phá", "Bắt đầu huấn luyện cường độ cao"

Tùy chọn 4 - Tùy chọn R18 (Nội dung người lớn):
   Nội dung cực kỳ khiêu dâm
   Bắt buộc phải đánh dấu 【R18】
   Ví dụ: "【R18】Ôm lấy cô ấy từ phía sau, mạnh mẽ thao túng tiểu huyệt của cô ấy"

Định dạng tùy chọn mẫu:
   "Khống chế tên cướp cầm dao bằng tay không"
   "Nhẹ nhàng nắm lấy tay cô ấy"
   "Quan sát kỹ đoạn băng giám sát"
   "Giải mã ổ khóa mật mã phức tạp"

Mỗi tùy chọn phải:
   Ngắn gọn rõ ràng (10-20 chữ)
   Phù hợp với cốt truyện hiện tại
   Cung cấp lựa chọn có ý nghĩa
   Sắp xếp theo thứ tự nêu trên

`;

// ===== Chức năng biến số bất đồng bộ: Tách biệt gợi ý =====
// baseSystemPrompt: Gợi ý cơ bản (gửi cho API chính, không chứa quy tắc biến số)
// asyncVariablePrompt: Gợi ý quy tắc biến số (gửi cho API bổ sung khi bật biến số bất đồng bộ)
// defaultSystemPrompt: Gợi ý đầy đủ (tương thích ngược, bằng base + async)

// Gợi ý cơ bản (không bao gồm danh sách kiểm tra biến số) - Sử dụng cho API chính
const baseSystemPrompt = `

Mỗi lần phản hồi phải tuân thủ nghiêm ngặt định dạng JSON sau:

{
  "reasoning": { ... },
  "story": "Văn bản mô tả cốt truyện...",
  "variableUpdate": "<variable_update>...</variable_update>",
  "options": ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"]
}

【QUAN TRỌNG】 Giải thích định dạng trường variableUpdate:
- Phải được bao bọc bởi "<variable_update>nội dung</variable_update>"
- Thao tác vật phẩm: +Tên vật phẩm xSố lượng hoặc -Tên vật phẩm xSố lượng
- Trường nhân vật: Tên_nhân_vật.Trường: Giá trị
- Nhật ký lịch sử: >>history: Văn bản hoặc history:\\n  - Văn bản

`;

// Gợi ý quy tắc biến số - Sử dụng cho API bổ sung (Chế độ biến số bất đồng bộ)
let asyncVariablePrompt = null;

// Lấy gợi ý biến số bất đồng bộ (khởi tạo trễ)
function getAsyncVariablePrompt() {
    if (asyncVariablePrompt === null) {
        // Trích xuất phần quy tắc biến số từ defaultSystemPrompt
        const startMarker = '【CỰC KỲ QUAN TRỌNG】 Mỗi lần phản hồi phải bao gồm hai phần cốt lõi sau';
        const endMarker = '6. Duy trì tính liên tục và sự đắm chìm của cốt truyện';

        const startIndex = defaultSystemPrompt.indexOf(startMarker);
        const endIndex = defaultSystemPrompt.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            asyncVariablePrompt = defaultSystemPrompt.substring(startIndex, endIndex + endMarker.length);
            console.log('[Biến bất đồng bộ] Trích xuất quy tắc biến số từ defaultSystemPrompt, độ dài:', asyncVariablePrompt.length);
        } else {
            // Nếu không tìm thấy dấu hiệu, sử dụng toàn bộ defaultSystemPrompt
            asyncVariablePrompt = defaultSystemPrompt;
            console.warn('[Biến bất đồng bộ] Không tìm thấy dấu hiệu, sử dụng toàn bộ defaultSystemPrompt');
        }
    }
    return asyncVariablePrompt;
}

// Quy tắc trò chơi Tòa tháp AC (Danh sách kiểm tra biến số) - Bản đầy đủ, tương thích ngược
const defaultSystemPrompt = `Bạn là người dẫn trò (Host) của một trò chơi mạo hiểm ngục tối thế giới khác.
Cho phép cái chết: Nếu {{User}} hết thể lực và tử vong, hãy thản nhiên thông báo sự thật về cái chết, nghiêm cấm sắp đặt bất kỳ "cứu tinh" nào hoặc cưỡng ép bóp méo thế giới quan. Sau khi chết, hãy xuất ra 【Nhân vật đã tử vong, lượt chơi này đã kết thúc, vui lòng bắt đầu lượt chơi mới】, không xuất thêm nội dung khác.

Mỗi lần phản hồi phải bao gồm hai trường cốt lõi: reasoning và variableUpdate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Phần 1: Định dạng phản hồi】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phản hồi phải là JSON thuần (không chứa khối mã markdown), định dạng như sau:
{
  "variableUpdate": "<variable_update>\\nNội dung lệnh\\n</variable_update>"
}

Ví dụ variableUpdate:
"variableUpdate": "<variable_update>\\nhp: -25\\nMị ma.favor: +10\\n+Thuốc trị thương x2\\n>>history: Gặp gỡ Mị ma tại tầng 3 ngục tối, chế ngự cô ta sau trận chiến khốc liệt\\n</variable_update>"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Phần 2: Tham khảo cú pháp variableUpdate】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variableUpdate phải được bao bọc bởi "<variable_update>nội dung</variable_update>" (định dạng chuỗi JSON).

【Cú pháp cơ bản (5 loại toán tử)】
+Số lượng  → Tăng      hp: +30, mp: +60, spiritStones: +100
-Số lượng  → Giảm      hp: -25, mp: -40, spiritStones: -50
=Giá trị   → Cưỡng ép thiết lập  hp: =100, isVirgin: =false
Văn bản    → Thay thế    mood: Căng thẳng, location: Lối vào ngục tối
>>Trường  → Thêm vào mảng  >>history: Đánh bại người gác cổng

【Thao tác vật phẩm】
+Tên vật phẩm xSố lượng  → Nhận vật phẩm    +Thuốc trị thương x3, +Xuân dược mạnh
-Tên vật phẩm xSố lượng  → Mất vật phẩm    -Chìa khóa x1, -Vàng x50

【Danh sách các trường thường dùng】
Loại số trị (cộng trừ): hp, mp, spiritStones, exp
Loại văn bản (thay thế): thought, mood, status, location, currentDateTime, currentGoal

【Giải thích định dạng currentGoal - Mục tiêu hiện tại】
currentGoal dùng để ghi lại mục tiêu chính và mục tiêu phụ hiện tại của nhân vật, định dạng là chuỗi ngăn cách bởi dấu gạch đứng:
currentGoal: Mục tiêu chính|Mục tiêu phụ 1|Mục tiêu phụ 2|Mục tiêu phụ 3
Ví dụ: currentGoal: Khám phá tầng 3 ngục tối|Đánh bại BOSS canh cổng|Thu thập nguyên liệu hiếm|Tìm kiếm phòng ẩn
Lưu ý: Mục đầu tiên là mục tiêu chính (quan trọng nhất), các mục sau là mục tiêu phụ (tùy chọn, 0-5 cái). Cập nhật theo sự phát triển cốt truyện mỗi lượt.
Loại mảng (>>thêm vào): history, diary, achievements

【Thao tác quan hệ nhân vật (định dạng dấu chấm)】
Định dạng: Tên_nhân_vật.Trường: Giá trị
Ví dụ: Mị ma.favor: +15, >>Mị ma.history: Bị nhân vật chính chinh phục

Khi tạo nhân vật mới bắt buộc phải bao gồm tất cả các trường sau:
Tên_nhân_vật.favor: Con số (Độ hảo cảm ban đầu, thường 0-20)
Tên_nhân_vật.relation: Loại quan hệ
Tên_nhân_vật.age: Tuổi
Tên_nhân_vật.job: Nghề nghiệp/Chủng tộc
Tên_nhân_vật.personality: Mô tả tính cách
Tên_nhân_vật.opinion: Cách nhìn về nhân vật chính
Tên_nhân_vật.appearance: Mô tả ngoại hình
Tên_nhân_vật.isVirgin: =true hoặc =false
# Nhân vật bản ACJT cần bao gồm 6 bộ phận (bao gồm anus):
Tên_nhân_vật.bodyParts.vagina.description: Mô tả
Tên_nhân_vật.bodyParts.vagina.useCount: Số lần
Tên_nhân_vật.bodyParts.anus.description: Mô tả
Tên_nhân_vật.bodyParts.anus.useCount: Số lần
Tên_nhân_vật.bodyParts.breasts/mouth/hands/feet tương tự như trên
>>Tên_nhân_vật.history: Tình huống gặp gỡ lần đầu

【Quy tắc tính hợp lý của bodyParts useCount】
Nghiêm cấm tất cả nhân vật đều ghi useCount bằng 0, phải suy luận hợp lý dựa trên tuổi tác/nghề nghiệp/trải nghiệm:
- Trinh nữ (isVirgin:true) → vagina.useCount bắt buộc = 0, nhưng mouth/hands/anus có thể có số lần
- Không còn trinh → vagina.useCount bắt buộc > 0
- Tham khảo độ tuổi: Thiếu nữ thuần khiết 19 tuổi: 0-5 lần; Phụ nữ trưởng thành 25-30 tuổi: 10-50 lần; Phụ nữ chín chắn 30+: 50-200 lần

【Trạng thái đặc biệt (Chỉ có ở ACJT)】
# Chỉ có thể xóa một mục thông qua nghỉ ngơi tại suối nước nóng
specialStatus.Tên trạng thái.active: =true
specialStatus.Tên trạng thái.effect: Mô tả hiệu quả
specialStatus.Tên trạng thái.description: Mô tả trạng thái
# Trạng thái thường gặp: Trứng rung (Năng lượng -1), Dâm văn (Nghỉ ngơi đọa lạc +5), Khuyên ngực (Phòng thủ -2), Vòng cổ (HP tối đa -10), Đai trinh tiết (Hạn chế hồi máu), Thuốc kích dục (Tấn công -3), Trang phục nhục nhã (Đọa lạc +3), Ấn ký (Bị quái cụ thể gây sát thương +50%)

【Thao tác Thế lực/Tổ chức (Thêm JSON)】
>>factions: {"name": "Tên thế lực", "leader": "Lãnh đạo", "location": "Trụ sở", "members": ["Thành viên 1", "Thành viên 2"], "description": "Giới thiệu"}

【Thông tin chi tiết nhân vật chính】
protagonist.appearance: Mô tả ngoại hình
protagonist.mood: Tâm trạng hiện tại
protagonist.status: Trạng thái hiện tại
protagonist.isVirgin: =false (Nếu mất trinh)
protagonist.firstSex: Mô tả chi tiết (Bắt buộc ghi lại lần đầu)
protagonist.lastSex: Mô tả chi tiết (Cập nhật sau mỗi hành vi tình dục)
protagonist.sexualPreference: Mô tả sở thích tình dục

# Các bộ phận khả dụng của bodyParts (Bản ACJT có tổng cộng 6 bộ phận, bao gồm anus):
# Mỗi bộ phận cần thiết lập đồng thời .description (Mô tả trạng thái) và .useCount: +1 (Số lần sử dụng)
protagonist.bodyParts.vagina.description: Mô tả trạng thái tiểu huyệt
protagonist.bodyParts.vagina.useCount: +1
protagonist.bodyParts.anus.description: Mô tả trạng thái hậu môn
protagonist.bodyParts.anus.useCount: +1
protagonist.bodyParts.breasts.description: Mô tả trạng thái ngực
protagonist.bodyParts.breasts.useCount: +1
protagonist.bodyParts.mouth.description: Mô tả trạng thái miệng
protagonist.bodyParts.mouth.useCount: +1
protagonist.bodyParts.hands.description: Mô tả trạng thái tay
protagonist.bodyParts.hands.useCount: +1
protagonist.bodyParts.feet.description: Mô tả trạng thái chân
protagonist.bodyParts.feet.useCount: +1


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Phần 3: Quy phạm cốt lõi】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- variableUpdate quan trọng tương đương với story, thà thừa còn hơn thiếu
- Mỗi mục "Có" trong variableCheck bắt buộc phải được thể hiện trong variableUpdate
- history bắt buộc phải tồn tại trong mỗi lượt, nếu thiếu sẽ làm đứt đoạn ghi chép trò chơi
- Phong cách tự sự: Khách quan, súc tích, hàm súc, quan sát từ xa`;

// Gợi ý thế giới động mặc định của trò chơi hiện đại
const defaultDynamicWorldPrompt = `Bạn là trình tạo thế giới động cho một thế giới hiện đại. Dựa trên trạng thái và vị trí hiện tại của nhân vật chính, hãy tạo ra các sự kiện thế giới xảy ra ở nơi xa.

【YÊU CẦU QUAN TRỌNG】 Mỗi khi tạo sự kiện thế giới động, bắt buộc phải bao gồm cập nhật biến quan hệ nhân vật! Đây là điều bắt buộc, không được bỏ qua!

Mỗi lần phản hồi phải tuân thủ nghiêm ngặt định dạng JSON sau:
{
  "reasoning": {
    "worldState": "Phân tích trạng thái thế giới hiện tại (Thế lực, tài nguyên, xung đột)",
    "timeframe": "Phạm vi thời gian xảy ra sự kiện lần này",
    "keyEvents": ["Sự kiện chính 1", "Sự kiện chính 2"],
    "npcActions": "Hành động và kế hoạch của các NPC quan trọng",
    "impact": "Ảnh hưởng tiềm tàng của các sự kiện này đối với nhân vật chính"
  },
  "story": "Mô tả sự kiện thế giới động (300-500 chữ)",
  
  // 【LƯU Ý】 Mỗi lần đều phải cập nhật ít nhất một biến quan hệ của nhân vật!
  "variableUpdate": "<variable_update>\\n# Nhân vật mới xuất hiện hoặc quan hệ nhân vật hiện có thay đổi (Yêu cầu bắt buộc)\\nLâm Tiểu Vũ.favor: 10\\nLâm Tiểu Vũ.relation: Cô gái mới quen\\nLâm Tiểu Vũ.age: 26\\nLâm Tiểu Vũ.job: Phóng viên\\nLâm Tiểu Vũ.personality: Nhạy bén tinh quái, đi mây về gió\\nLâm Tiểu Vũ.opinion: Người này có chút bí ẩn\\nLâm Tiểu Vũ.appearance: Mặc trang phục công sở màu đen, dáng người mảnh khảnh\\nLâm Tiểu Vũ.sexualPreference: Dị tính luyến ái\\nLâm Tiểu Vũ.isVirgin: true\\nLâm Tiểu Vũ.firstSex: Chưa rõ\\nLâm Tiểu Vũ.lastSex: Chưa rõ\\n>>Lâm Tiểu Vũ.history: Lần đầu nghe danh, có tin đồn cô ta đã đi trước một bước lẻn vào căn cứ bí mật\\n\\n# Nhật ký lịch sử\\n>>player.worldEvents: Nghe tin Lâm Tiểu Vũ đã lẻn vào căn cứ bí mật trước\\n</variable_update>"
}

【NGUYÊN TẮC CỐT LÕI - TRÁNH XUNG ĐỘT CỐT TRUYỆN】:

1. 【CẤM】 Ảnh hưởng trực tiếp đến NPC và sự kiện mà nhân vật chính đang tương tác:
    Cấm: Đừng để NPC mà nhân vật chính đang trò chuyện/chiến đấu/đồng hành đột ngột rời đi, bị bắt, chết hoặc biến mất.
    Cấm: Đừng thay đổi trạng thái của vị trí hiện tại của nhân vật chính (ví dụ: "Công ty bạn đang ở đột nhiên bị niêm phong").
    Cấm: Đừng trực tiếp thay đổi kết quả của sự kiện mà nhân vật chính đang thực hiện.
    Đúng: Mô tả các sự kiện ở nơi khác, nhân vật khác, hoặc khoảng thời gian khác.

2. 【KIỂM SOÁT TỐC ĐỘ THỜI GIAN - CỰC KỲ QUAN TRỌNG】:
   - 【CẤM ĐẨY NHANH THỜI GIAN CỦA NHÂN VẬT CHÍNH】: Thế giới động mô tả những gì xảy ra ở nơi khác trong "cùng một khoảng thời gian".
   - 【CẤM】 Xuất hiện bất kỳ từ ngữ đẩy nhanh thời gian nào như "Một tháng sau", "Vài ngày sau", "Nửa năm trôi qua", v.v.
   - 【CẤM】 Mô tả nhân vật chính đang làm gì (ví dụ: "Bạn và cô ấy ẩn náu một tháng", "Các bạn đang ở trong ngôi miếu đổ nát", v.v.)
   - Đúng: Mô tả những gì đang xảy ra ở nơi khác "ngay lúc này".
   - Sử dụng các cách diễn đạt thời gian đồng bộ như "Lúc này", "Cùng lúc đó", "Chính ngay lúc này", v.v.
   - Tham chiếu thời gian: Sử dụng currentDateTime hiện tại của nhân vật chính làm chuẩn, mô tả các sự kiện ở xa trong cùng ngày hoặc trước sau 1-2 ngày.

3. Phạm vi mô tả (Các sự kiện cách xa nhân vật chính):
   - Sự kiện ở các thành phố/khu vực khác.
   - Tin đồn ở nơi xa mà nhân vật chính tạm thời chưa biết.
   - Hoạt động của những người khác.
   - Các dòng chảy ngầm của thế lực, thay đổi chính trị.
   - Các cuộc chiến đấu, xung đột ở phương xa.

4. Nguyên tắc xử lý NPC:
   - 【ƯU TIÊN】 Liên quan đến các NPC trong relationships hiện tại của nhân vật chính nhưng không ở cạnh nhân vật chính.
   - 【CHO PHÉP】 Tạo NPC phương xa mới (người nhân vật chính không quen, nhân vật thuộc các thế lực).
   - 【CẤM】 Mô tả những người ở cạnh nhân vật chính, người cùng đi, người đang trò chuyện.
   - 【CẤM】 Thay đổi trạng thái của NPC mà nhân vật chính đã quen biết (vị trí, sống chết, biến cố lớn).
   - Có thể sáng tác NPC phương xa hoàn toàn mới làm bối cảnh tin đồn.

5. Hạn chế cập nhật biến số (Quan trọng):
   - 【YÊU CẦU BẮT BUỘC】 Phải trả về trường variableUpdate, bao gồm cập nhật biến quan hệ.
   - 【CHO PHÉP】 Thay đổi các NPC mà nhân vật chính đã quen biết (sử dụng định dạng Tên_nhân_vật.Trường).
   - 【CHO PHÉP】 Thêm nhân vật mới trong tin đồn phương xa (nhân vật chính chưa gặp, chưa tương tác).
   - 【CẤM】 Thay đổi bất kỳ thuộc tính, vật phẩm, vị trí nào của nhân vật chính.
   - 【CẤM】 Thêm NPC có tương tác trực tiếp với nhân vật chính.

6. Ví dụ về loại nội dung (Đúng):
    "Có tin đồn từ một công ty công nghệ ở quận phía Đông rằng họ sẽ tổ chức một buổi tuyển dụng nhỏ sau ba ngày nữa..."
    "Ở vùng ngoại ô phía Bắc có người nhìn thấy nhân vật khả nghi xuất hiện, khiến cư dân gần đó cảnh giác..."
    "Trên mạng lan truyền tin đồn rằng một nhà máy bỏ hoang nào đó nghi ngờ có hoạt động bí ẩn, đã có vài nhà thám hiểm đến điều tra..."
    "Anh chàng lập trình viên cao thủ mà bạn từng nghe danh, nghe nói gần đây đang tập trung phát triển dự án mới..."

7. Ví dụ sai (Cấm):
    "Bạn đồng hành của bạn đột nhiên bị bắt cóc" ← Đừng ảnh hưởng đến người bên cạnh nhân vật chính.
    "Nửa năm trôi qua, công ty đã phá sản" ← Tốc độ thời gian quá nhanh.
    "Khách sạn bạn đang ở bị cảnh sát đột kích đêm nay" ← Đừng trực tiếp ảnh hưởng đến vị trí hiện tại của nhân vật chính.
    "Sếp của bạn bị bắt" ← Đừng thay đổi trạng thái sống chết của NPC then chốt.

8. Phong cách tự sự:
   - Góc nhìn khách quan, giống như tin tức, tin đồn truyền về từ nơi xa.
   - Sử dụng các cách diễn đạt như "Nghe nói", "Có tin đồn rằng", "Lan truyền trên mạng", v.v.
   - Để lại sự tò mò và manh mối, đừng trực tiếp tiết lộ đáp án.
   - Tạo cảm giác thế giới đang vận hành, nhưng không làm phiền đến mạch truyện chính.

9. 【QUAN TRỌNG】 Phối hợp với mạch truyện chính:
   - Đọc kỹ location hiện tại của nhân vật chính và sự kiện đang diễn ra.
   - Tránh xa tất cả NPC mà nhân vật chính đang tương tác hiện tại.
   - Các sự kiện được mô tả nên là "âm thanh nền từ nơi xa", không phải là "sự kiện trọng đại hiện tại".
   - Gieo manh mối cho các cuộc phiêu lưu tương lai của nhân vật chính, thay vì cưỡng ép thay đổi hiện trạng.

【Giải thích các trường biến số variableUpdate】 (Giống như gợi ý hệ thống)

I. Tạo nhân vật mới (Trọng tâm của thế giới động)
Khi nhân vật mới xuất hiện trong sự kiện thế giới động, bắt buộc phải thiết lập đầy đủ:
- Tên_nhân_vật.favor: Độ hảo cảm ban đầu (thường 0-20)
- Tên_nhân_vật.relation: Loại quan hệ
- Tên_nhân_vật.age: Tuổi
- Tên_nhân_vật.job: Nghề nghiệp
- Tên_nhân_vật.personality: Mô tả tính cách
- Tên_nhân_vật.opinion: Cách nhìn về nhân vật chính
- Tên_nhân_vật.appearance: Mô tả ngoại hình
- Tên_nhân_vật.sexualPreference: Xu hướng tính dục
- Tên_nhân_vật.isVirgin: Có còn trinh không
- Tên_nhân_vật.firstSex: Trải nghiệm tình dục lần đầu
- Tên_nhân_vật.lastSex: Trải nghiệm tình dục gần nhất
- Tên_nhân_vật.bodyParts.vagina.description: Miêu tả chi tiết tiểu huyệt
- Tên_nhân_vật.bodyParts.vagina.useCount: 0
- Tên_nhân_vật.bodyParts.breasts.description: Miêu tả chi tiết ngực
- Tên_nhân_vật.bodyParts.breasts.useCount: 0
- Tên_nhân_vật.bodyParts.mouth.description: Miêu tả chi tiết miệng
- Tên_nhân_vật.bodyParts.mouth.useCount: 0
- Tên_nhân_vật.bodyParts.hands.description: Miêu tả chi tiết tay
- Tên_nhân_vật.bodyParts.hands.useCount: 0
- Tên_nhân_vật.bodyParts.feet.description: Miêu tả chi tiết chân
- Tên_nhân_vật.bodyParts.feet.useCount: 0
- >>Tên_nhân_vật.history: Tình huống gặp gỡ lần đầu

II. Ghi chép sự kiện thế giới
Ghi vào danh sách sự kiện thế giới của người chơi:
- >>player.worldEvents: Nghe tin Lâm Tiểu Vũ lẻn vào căn cứ bí mật (Thêm vào)
- >>player.worldEvents: Nhân vật khả nghi xuất hiện ở ngoại ô phía Bắc (Thêm vào)

III. Cập nhật cảnh tình dục
Nếu tình dục xảy ra trong sự kiện thế giới động:
- Tên_nhân_vật.isVirgin: =false (Thay thế)
- Tên_nhân_vật.firstSex: Mô tả chi tiết (Thay thế)
- Tên_nhân_vật.lastSex: Mô tả chi tiết (Thay thế)
- Tên_nhân_vật.bodyParts.vagina.useCount: +1 (Nếu có thâm nhập)
- Tên_nhân_vật.bodyParts.mouth.useCount: +1 (Nếu có khẩu giao)
- Tên_nhân_vật.bodyParts.breasts.useCount: +1 (Nếu có nhũ giao)
- Tên_nhân_vật.bodyParts.hands.useCount: +1 (Nếu có thủ giao)
- Tên_nhân_vật.bodyParts.feet.useCount: +1 (Nếu có túc giao)
- >>Tên_nhân_vật.history: Ghi chép trải nghiệm tình dục (Thêm vào)

IV. Giải thích toán tử (Giống gợi ý hệ thống)
- +Số lượng = Tăng
- -Số lượng = Giảm
- =Giá trị = Thay thế
- Văn bản = Thay thế
- >>Trường = Thêm vào
Cuối cùng, tuyệt đối đừng lười biếng! Đối chiếu biểu mẫu, cập nhật tất cả các trường liên quan!
【Quy phạm chống tuyệt vọng】: Áp dụng cho tất cả nội dung
【Phong cách tự sự】: Khách quan, súc tích, hàm súc, quan sát từ xa`;

// Lấy gợi ý hệ thống (Ưu tiên dùng textarea trong HTML, nếu trống dùng giá trị mặc định)
function getSystemPrompt() {
    const el = document.getElementById('systemPrompt');
    if (el && el.value && el.value.trim()) {
        return el.value;
    }
    return fullSystemPrompt;
}

// Lấy gợi ý thế giới động (Ưu tiên dùng textarea trong HTML, nếu trống dùng giá trị mặc định)
function getDynamicWorldPrompt() {
    const el = document.getElementById('dynamicWorldPrompt');
    if (el && el.value && el.value.trim()) {
        return el.value;
    }
    return defaultDynamicWorldPrompt;
}

// Tạo HTML bảng trạng thái đặc thù của game hiện đại
function generateStatusPanelHTML() {
    return `
        <style>
            .status-icon-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                padding: 10px;
            }
            @media (max-width: 600px) {
                .status-icon-grid {
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    padding: 8px;
                }
            }
            .status-icon-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 5px 5px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid #333;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 70px;
            }
                .status-icon-btn img{transform: translateY(0px)}
            .status-icon-btn img:hover {
                transform: translateY(-6px);transition: all 0.3s ease;
            }
            .status-icon-btn:active {
                transform: scale(0.95);
            }
            .status-icon-btn .icon {
                font-size: 24px;
                margin-bottom: 4px;
            }
            .status-icon-btn .label {
                font-size: 10px;
                color: #aaa;
                text-align: center;
                white-space: nowrap;
            }
            .status-icon-btn .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                border-radius: 10px;
                min-width: 16px;
                text-align: center;
            }
            .status-icon-btn-wrapper {
                position: relative;
            }
            /* Kiểu dáng cửa sổ Pop-up - Phong cách Cthulhu */
            .status-modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.85);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }
            .status-modal-overlay.active {
                display: flex;
            }
            .status-modal {
                background: linear-gradient(180deg, rgba(25, 18, 15, 0.98) 0%, rgba(15, 10, 8, 0.99) 50%, rgba(20, 14, 12, 0.98) 100%);
                border: 3px solid #3d2f24;
                border-radius: 4px;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: modalSlideIn 0.3s ease;
                box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.8), 0 0 15px rgba(139,0,0,0.3);
                position: relative;
            }
            .status-modal::before {
                content: '';
                position: absolute;
                top: -5px; left: -5px; right: -5px; bottom: -5px;
                border: 2px solid #1a1310;
                pointer-events: none;
            }
            .status-modal::after {
                content: '';
                position: absolute;
                top: 3px; left: 3px; right: 3px; bottom: 3px;
                border: 1px solid rgba(107, 82, 65, 0.3);
                pointer-events: none;
            }
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .status-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 2px solid rgba(139, 0, 0, 0.4);
                background: linear-gradient(180deg, rgba(139,0,0,0.15) 0%, transparent 100%);
            }
            .status-modal-header h3 {
                margin: 0;
                color: #c9b896;
                font-size: 16px;
                font-family: 'Cinzel', serif;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
            }
            .status-modal-close {
                background: none;
                border: none;
                color: #6b5d4d;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: all 0.2s;
            }
            .status-modal-close:hover {
                color: #8b0000;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
            }
            .status-modal-body {
                padding: 15px 20px;
                overflow-y: auto;
                flex: 1;
                color: #c9b896;
            }
            @media (max-width: 600px) {
                .status-modal {
                    max-width: 95%;
                    max-height: 85vh;
                }
                .status-modal-header {
                    padding: 12px 15px;
                }
                .status-modal-body {
                    padding: 12px 15px;
                }
            }
        </style>

        <div class="panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 16px;">Trạng Thái Nhân Vật</h2>
                <button onclick="openVariableEditor()" style="margin-right:10px;padding: 5px 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;display:none;">Chỉnh Sửa</button>
            </div>


            <div class="tab-container">
                <button class="tab-button active" onclick="switchTab('status')">Thanh Trạng Thái</button>
                <button class="tab-button" onclick="switchTab('dynamicWorld')">Thế Giới Động</button>
            </div>


            <div id="statusTab" class="tab-content active">
                <div class="inline-status-section" style="margin-bottom: 10px; padding: 12px; background: url(img/background/tit_bg_2.png); border-radius: 4px; border-top: 1px solid rgba(139,0,0,0.4);border-bottom: 1px solid rgba(139,0,0,0.4); box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(139,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="color: #c9b896; font-size: 16px; font-weight: bold; text-shadow: 0 0 8px rgba(139,0,0,0.5);" id="inlinePlayerName">Chưa đặt tên</div>
                        <div style="display: flex; gap: 12px;">
                            <span style="color: #8b4513; font-size: 13px;">🏰 Tầng <span id="inlinePlayerFloor" style="color: #c9b896;">1</span></span>
                            <span style="color: #8b4513; font-size: 13px;">💰 <span id="inlinePlayerGold" style="color: #c9b896;">100</span></span>
                        </div>
                    </div>
                </div>
                
                <div class="inline-status-section" style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_1.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ff6b81; font-size: 16px; font-weight: bold;" id="inlinePlayerHp">70/70</div>
                        <div style="color: #888; font-size: 14px;">❤️ Máu</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_2.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;" id="inlinePlayerEnergy">3</div>
                        <div style="color: #888; font-size: 14px;">⚡ Năng Lượng</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_3.png); border-radius: 6px; text-align: center;">
                        <div style="color: #9c88ff; font-size: 16px; font-weight: bold;" id="inlinePlayerCorruption">0</div>
                        <div style="color: #888; font-size: 14px;">💜 Suy Đồi</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_4.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ff4757; font-size: 16px; font-weight: bold;" id="inlinePlayerAttack">0</div>
                        <div style="color: #888; font-size: 14px;">⚔️ Tấn Công</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_1.png); border-radius: 6px; text-align: center;">
                        <div style="color: #70a1ff; font-size: 16px; font-weight: bold;" id="inlinePlayerDefense">0</div>
                        <div style="color: #888; font-size: 14px;">🛡️ Phòng Ngự</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_2.png); border-radius: 6px; text-align: center;">
                        <div style="color: #70a1ff; font-size: 16px; font-weight: bold;" id="inlinePlayerArmor">0</div>
                        <div style="color: #888; font-size: 14px;">🔰 Giáp</div>
                    </div>
                </div>
                
                <div class="status-icon-grid">
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('protagonist')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_001.png"></span>
                            <span class="label">Chi Tiết</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('specialStatus')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_002.png"></span>
                            <span class="label">Trạng Thái</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('items')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_003.png"></span>
                            <span class="label">Vật Phẩm</span>
                        </div>
                        <span class="badge" id="itemsBadge" style="display:none;">0</span>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('relationships')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_004.png"></span>
                            <span class="label">Quan Hệ</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('faction')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_005.png"></span>
                            <span class="label">Lực Lượng</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('history')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_006.png"></span>
                            <span class="label">Lịch Sử</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('cards')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_007.png"></span>
                            <span class="label" id="cardDeckCount">Bộ Bài</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('relics')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_008.png"></span>
                            <span class="label" id="relicCount">Cổ Vật</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="hotelBtn" onclick="TownSystem.openHotel()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_009.png"></span>
                            <span class="label">Khách Sạn</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="brothelBtn" onclick="TownSystem.openBrothel()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_010.png"></span>
                            <span class="label">Lầu Huyệt</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="blackMarketBtn" onclick="BlackMarketSystem.open()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_011.png"></span>
                            <span class="label">Chợ Đen</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="churchBtn" onclick="TownSystem.openChurch()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_012.png"></span>
                            <span class="label">Nhà Thờ</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="cultivationBtn" onclick="CultivationSystem.open()">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_013.png"></span>
                            <span class="label">Tu Luyện</span>
                        </div>
                    </div>
                </div>
            </div>
            <div id="dynamicWorldTab" class="tab-content">
                <div class="dynamic-world-container" id="dynamicWorldContainer">
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                        <div style="font-size: 16px; margin-bottom: 10px;">Thế Giới Động Chưa Kích Hoạt</div>
                        <div style="font-size: 12px;">Vui lòng kích hoạt tính năng Thế Giới Động trong phần cài đặt.</div>
                    </div>
                </div>
            </div>


            <div style="display:none;">
                <span id="playerName">Chưa đặt tên</span>
                <span id="playerFloor">1</span>
                <span id="playerGold">100</span>
                <span id="playerHp">70/70</span>
                <span id="playerEnergy">3</span>
                <span id="playerAttack">0</span>
                <span id="playerDefense">0</span>
                <span id="playerArmor">0</span>
                <span id="playerCorruption">0</span>
                <span id="protagonistAppearance">Chưa xác định</span>
                <span id="protagonistSexPref">Chưa xác định</span>
                <span id="protagonistVirgin">Chưa xác định</span>
                <span id="protagonistFirstSex">Chưa xác định</span>
                <span id="protagonistLastSex">Chưa xác định</span>
                <div id="protagonistBodyParts"></div>
                <div id="specialStatusList"></div>
                <div id="itemsList"></div>
                <div id="relationshipsList"></div>
                <div id="factionInfo"></div>
                <div id="historyList"></div>
                <div id="cardDeckList"></div>
                <div id="relicsList"></div>
            </div>
        </div>


        <div class="status-modal-overlay" id="statusModalOverlay" onclick="closeStatusModal(event)">
            <div class="status-modal" onclick="event.stopPropagation()">
                <div class="status-modal-header">
                    <h3 id="statusModalTitle">Tiêu Đề</h3>
                    <button class="status-modal-close" onclick="closeStatusModal()">&times;</button>
                </div>
                <div class="status-modal-body" id="statusModalBody">
                    Nội dung
                </div>
            </div>
        </div>

    `;
}

// Mở cửa sổ Pop-up trạng thái
function openStatusModal(type) {
    const overlay = document.getElementById('statusModalOverlay');
    const title = document.getElementById('statusModalTitle');
    const body = document.getElementById('statusModalBody');

    if (!overlay || !title || !body) return;

    let titleText = '';
    let content = '';

    switch (type) {
        case 'character':
            titleText = '👤 Thông tin nhân vật';
            content = `
                <div class="status-item" style="margin-bottom: 12px; padding: 10px; background: rgba(255,107,157,0.1); border-radius: 8px;">
                    <div style="color: #888; font-size: 12px;">Tên</div>
                    <div style="color: #ff6b9d; font-size: 18px; font-weight: bold;">${document.getElementById('playerName')?.textContent || 'Chưa đặt tên'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                        <div style="color: #888; font-size: 11px;">Tầng hiện tại</div>
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;">${document.getElementById('playerFloor')?.textContent || '1'}</div>
                    </div>
                    <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                        <div style="color: #888; font-size: 11px;">Vàng</div>
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;">💰 ${document.getElementById('playerGold')?.textContent || '0'}</div>
                    </div>
                </div>
            `;
            break;

        case 'attributes':
            titleText = '❤️ Thuộc tính nhân vật';
            content = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="padding: 12px; background: rgba(255,107,129,0.15); border-radius: 8px; border: 1px solid rgba(255,107,129,0.3);">
                        <div style="color: #888; font-size: 11px;">Sinh mệnh</div>
                        <div style="color: #ff6b81; font-size: 18px; font-weight: bold;">${document.getElementById('playerHp')?.textContent || '70/70'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(255,215,0,0.15); border-radius: 8px; border: 1px solid rgba(255,215,0,0.3);">
                        <div style="color: #888; font-size: 11px;">Điểm năng lượng</div>
                        <div style="color: #ffd700; font-size: 18px; font-weight: bold;">⚡ ${document.getElementById('playerEnergy')?.textContent || '3'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(255,71,87,0.15); border-radius: 8px; border: 1px solid rgba(255,71,87,0.3);">
                        <div style="color: #888; font-size: 11px;">Sức tấn công</div>
                        <div style="color: #ff4757; font-size: 18px; font-weight: bold;">⚔️ ${document.getElementById('playerAttack')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(112,161,255,0.15); border-radius: 8px; border: 1px solid rgba(112,161,255,0.3);">
                        <div style="color: #888; font-size: 11px;">Khả năng phòng ngự</div>
                        <div style="color: #70a1ff; font-size: 18px; font-weight: bold;">🛡️ ${document.getElementById('playerDefense')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(112,161,255,0.1); border-radius: 8px; border: 1px solid rgba(112,161,255,0.2);">
                        <div style="color: #888; font-size: 11px;">Giáp khởi đầu</div>
                        <div style="color: #70a1ff; font-size: 18px; font-weight: bold;">🔰 ${document.getElementById('playerArmor')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(156,136,255,0.15); border-radius: 8px; border: 1px solid rgba(156,136,255,0.3);">
                        <div style="color: #888; font-size: 11px;">Chỉ số đọa lạc</div>
                        <div style="color: #9c88ff; font-size: 18px; font-weight: bold;">💜 ${document.getElementById('playerCorruption')?.textContent || '0'}</div>
                    </div>
                </div>
            `;
            break;

        case 'protagonist':
            titleText = '🌸 Chi tiết nhân vật chính';
            let goalHTML = '';
            const goalVars = window.gameState?.variables || {};
            if (goalVars.currentGoal) {
                const goals = goalVars.currentGoal.split('|').map(g => g.trim()).filter(g => g);
                const mainGoal = goals[0] || '';
                const subGoals = goals.slice(1);
                const subGoalsHTML = subGoals.length > 0 ? subGoals.map(g => `<div style="font-size: 12px; color: #c9b896; padding: 3px 0 3px 12px; border-left: 2px solid rgba(139,0,0,0.4);">▸ ${g}</div>`).join('') : '';
                goalHTML = `
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(139,0,0,0.15); border-radius: 8px; border: 1px solid rgba(139,0,0,0.3);">
                    <div style="color: #ff6347; font-weight: bold; margin-bottom: 8px;">🎯 Mục tiêu hiện tại</div>
                    <div style="font-size: 14px; color: #ffd700; font-weight: bold; margin-bottom: 6px;">★ ${mainGoal}</div>
                    ${subGoalsHTML}
                </div>`;
            }
            content = `
                ${goalHTML}
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,105,180,0.1); border-radius: 8px; border: 1px solid rgba(255,105,180,0.2);">
                    <div style="color: #ff69b4; font-weight: bold; margin-bottom: 8px;">📋 Trạng thái cơ bản</div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">Ngoại hình:</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistAppearance')?.textContent || 'Chưa rõ'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">Sở thích tình dục:</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistSexPref')?.textContent || 'Chưa rõ'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">Còn trinh:</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistVirgin')?.textContent || 'Chưa rõ'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">Lần đầu:</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistFirstSex')?.textContent || 'Chưa rõ'}</span>
                    </div>
                    <div style="font-size: 12px;">
                        <span style="color: #888;">Gần nhất:</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistLastSex')?.textContent || 'Chưa rõ'}</span>
                    </div>
                </div>
                <div style="padding: 10px; background: rgba(255,105,180,0.15); border-radius: 8px; border: 1px solid rgba(255,105,180,0.3);">
                    <div style="color: #ff69b4; font-weight: bold; margin-bottom: 8px;">💕 Chi tiết cơ thể</div>
                    <div style="font-size: 12px; color: #aaa;">${document.getElementById('protagonistBodyParts')?.innerHTML || 'Chưa có dữ liệu'}</div>
                </div>
            `;
            break;

        case 'specialStatus':
            titleText = '⚠️ Trạng thái đặc biệt';
            if (typeof SpecialStatusManager !== 'undefined') {
                SpecialStatusManager.updateDisplay();
            }
            const statusContent = document.getElementById('specialStatusList')?.innerHTML || '<div style="text-align: center; color: #666;">Tạm thời không có trạng thái bất thường</div>';
            content = `<div style="font-size: 13px;">${statusContent}</div>`;
            break;

        case 'items':
            titleText = '🎒 Đạo cụ';
            const itemsContent = document.getElementById('itemsList')?.innerHTML || '<div style="text-align: center; color: #666;">Chưa có đạo cụ</div>';
            content = `<div>${itemsContent}</div>`;
            break;

        case 'relationships':
            titleText = '👥 Quan hệ nhân sự';
            let relContent = document.getElementById('relationshipsList')?.innerHTML || '<div style="text-align: center; color: #666;">Chưa có quan hệ</div>';
            relContent = relContent.replace(/relationship-details-/g, 'modal-relationship-details-');
            relContent = relContent.replace(/toggleRelationshipDetails\(/g, 'toggleModalRelationshipDetails(');
            content = `<div>${relContent}</div>`;
            break;

        case 'faction':
            titleText = '🏛️ Thông tin thế lực';
            const factionContent = document.getElementById('factionInfo')?.innerHTML || '<div style="text-align: center; color: #666;">Chưa có thế lực</div>';
            content = `<div>${factionContent}</div>`;
            break;

        case 'history':
            titleText = '📜 Lịch sử quan trọng';
            const historyContent = document.getElementById('historyList')?.innerHTML || '<div style="text-align: center; color: #666;">Chưa có lịch sử</div>';
            content = `<div>${historyContent}</div>`;
            break;

        case 'cards':
            titleText = '🃏 Bộ bài';
            const cardsContent = document.getElementById('cardDeckList')?.innerHTML || '<div style="text-align: center; color: #666;">Chưa có thẻ bài</div>';
            content = `<div>${cardsContent}</div>`;
            break;

        case 'relics':
            titleText = '🏆 Cổ vật';
            content = generateRelicsModalContent();
            break;

        default:
            titleText = 'Thông tin';
            content = '<div style="text-align: center; color: #666;">Chưa có nội dung</div>';
    }

    title.textContent = titleText;
    body.innerHTML = content;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Đóng cửa sổ Pop-up trạng thái
function closeStatusModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('statusModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Tạo nội dung Pop-up cổ vật
function generateRelicsModalContent() {
    if (typeof PlayerState === 'undefined' || typeof RelicConfig === 'undefined') {
        return '<div style="text-align: center; color: #666;">Hệ thống cổ vật chưa được tải</div>';
    }

    const relics = PlayerState.relics || [];

    if (relics.length === 0) {
        return `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;">🏆</div>
                <div style="color: #666; font-size: 14px;">Chưa có cổ vật</div>
                <div style="color: #888; font-size: 12px; margin-top: 10px;">Mua cổ vật tại cửa hàng để nhận các hiệu ứng tăng cường vĩnh viễn</div>
            </div>
        `;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    relics.forEach((relicId, index) => {
        const relic = RelicConfig[relicId];
        if (!relic) {
            html += `
                <div style="background: rgba(100,100,100,0.2); border: 1px solid #444; border-radius: 8px; padding: 12px;">
                    <div style="color: #888;">Cổ vật chưa xác định: ${relicId}</div>
                </div>
            `;
            return;
        }

        let effectsHtml = '';
        if (relic.effect) {
            const effectNames = {
                maxHp: 'HP tối đa',
                attack: 'Sức tấn công',
                defense: 'Phòng ngự',
                baseArmor: 'Giáp khởi đầu',
                energy: 'Năng lượng',
                corruption: 'Đọa lạc',
                goldBonus: 'Thưởng vàng',
                healBonus: 'Hiệu quả trị liệu',
                lifesteal: 'Hút máu',
                drawBonus: 'Số lá rút',
                reflect: 'Phản đòn',
                shopDiscount: 'Giảm giá cửa hàng'
            };

            const effects = Object.entries(relic.effect).map(([key, value]) => {
                const name = effectNames[key] || key;
                const color = value > 0 ? '#2ed573' : '#ff4757';
                const sign = value > 0 ? '+' : '';
                return `<span style="color: ${color}; font-size: 11px; margin-right: 8px;">${name}${sign}${value}</span>`;
            });

            effectsHtml = `<div style="margin-top: 8px;">${effects.join('')}</div>`;
        }

        html += `
            <div style="background: linear-gradient(135deg, rgba(50,40,60,0.9) 0%, rgba(30,25,40,0.95) 100%);
                       border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; padding: 15px;
                       display: flex; align-items: flex-start; gap: 15px;">
                <div style="font-size: 36px; min-width: 50px; text-align: center;">${relic.icon}</div>
                <div style="flex: 1;">
                    <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 5px;">${relic.name}</div>
                    <div style="color: #aaa; font-size: 12px; line-height: 1.5;">${relic.desc}</div>
                    ${effectsHtml}
                </div>
            </div>
        `;
    });

    html += '</div>';

    html += `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333; text-align: center;">
            <span style="color: #888; font-size: 12px;">Đang sở hữu tổng cộng </span>
            <span style="color: #ffd700; font-size: 14px; font-weight: bold;">${relics.length}</span>
            <span style="color: #888; font-size: 12px;"> cổ vật</span>
        </div>
    `;

    return html;
}

// Mở rộng/Thu gọn quan hệ trong cửa sổ Pop-up (Dùng ID có tiền tố modal-)
function toggleModalRelationshipDetails(index) {
    const detailsDiv = document.getElementById(`modal-relationship-details-${index}`);
    if (detailsDiv) {
        const isHidden = detailsDiv.style.display === 'none' || !detailsDiv.style.display;
        detailsDiv.style.display = isHidden ? 'block' : 'none';
    }
}


// Thông tin gỡ lỗi: Xác nhận dữ liệu quan trọng đã được tải
console.log('[xiuxian-config] ✅ Tệp cấu hình đã tải xong');
console.log('[xiuxian-config] - Số lượng origins:', window.origins ? window.origins.length : 'undefined');
console.log('[xiuxian-config] - Số lượng talents:', window.talents ? window.talents.length : 'undefined');
console.log('[xiuxian-config] - characterCreation:', typeof window.characterCreation !== 'undefined' ? 'Đã định nghĩa' : 'undefined');

// Hàm render bảng trạng thái
function renderStatusPanel(vars) {
    // Xử lý tương thích: Nếu truyền vào là gameState đầy đủ, trích xuất phần variables
    const variables = vars.variables || vars;

    console.log('[Cấu hình hiện đại] renderStatusPanel được gọi');
    console.log('[Cấu hình hiện đại] variables:', variables);

    // Kiểm tra các phần tử quan trọng có tồn tại không (bảng trạng thái đã tải chưa)
    // Tương thích chế độ ACJT: kiểm tra nhiều phần tử khả thi
    const hasStatusPanel = document.getElementById('currentDateTime') ||
        document.getElementById('playerFloor') ||
        document.getElementById('relationshipsList');
    if (!hasStatusPanel) {
        console.warn('[Cấu hình hiện đại] ⚠️ Phần tử bảng trạng thái không tồn tại, bỏ qua render');
        console.warn('[Cấu hình hiện đại] Vui lòng đảm bảo mẫu HTML đã được tải chính xác');
        return;
    }

    console.log('[Cấu hình hiện đại] ✅ Phần tử bảng trạng thái tồn tại, bắt đầu render');

    // Hàm bổ trợ thiết lập văn bản phần tử an toàn
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // Tên
    setElementText('playerName', variables.name || 'Chưa đặt tên');

    // Thời gian
    setElementText('currentDateTime', variables.currentDateTime || '-');

    // Thông tin cơ bản
    setElementText('charName', variables.name || 'Chưa rõ');
    setElementText('charAge', variables.age || '-');
    setElementText('charGender', variables.gender || '-');
    setElementText('charIdentity', variables.identity || '-');
    setElementText('charJob', variables.job || '-');
    setElementText('charLocation', variables.location || '-');
    setElementText('charTalents', variables.talents && variables.talents.length > 0 ? variables.talents.join('、') : '-');

    // Thuộc tính đặc biệt (Thế giới quan hiện đại)
    setElementText('reputation', variables.reputation || 0);
    setElementText('stress', variables.stress || 0);

    // Thông tin thế lực
    renderFactionInfo(variables);

    // Chi tiết nhân vật chính
    renderProtagonistDetails(variables);

    // Danh sách đạo cụ
    renderItems(variables);

    // Quan hệ nhân sự
    renderRelationships(variables);

    // Lịch sử quan trọng
    renderHistory(variables);

    // Trạng thái đặc biệt
    renderSpecialStatus(variables);

    console.log('[Cấu hình hiện đại] ✅ renderStatusPanel hoàn tất');
}

// Render chi tiết nhân vật chính
function renderProtagonistDetails(vars) {
    const protagonist = vars.protagonist;

    // Trạng thái cơ bản
    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || 'Chưa rõ';
    };

    if (protagonist) {
        setEl('protagonistAppearance', protagonist.appearance);
        setEl('protagonistSexPref', protagonist.sexualPreference);
        setEl('protagonistVirgin', protagonist.isVirgin === true ? 'Có' : protagonist.isVirgin === false ? 'Không' : 'Chưa rõ');
        setEl('protagonistFirstSex', protagonist.firstSex);
        setEl('protagonistLastSex', protagonist.lastSex);

        // Chi tiết cơ thể
        const bodyPartsDiv = document.getElementById('protagonistBodyParts');
        if (bodyPartsDiv && protagonist.bodyParts) {
            const parts = [
                { key: 'penis', name: 'Dương vật', icon: '🍆' },
                { key: 'vagina', name: 'Âm đạo', icon: '🌸' },
                { key: 'breasts', name: 'Ngực', icon: '🍒' },
                { key: 'mouth', name: 'Miệng', icon: '👄' },
                { key: 'anus', name: 'Hậu môn', icon: '🔘' },
                { key: 'hands', name: 'Tay', icon: '🤲' },
                { key: 'feet', name: 'Chân', icon: '🦶' }
            ];

            let html = '';
            parts.forEach(part => {
                const data = protagonist.bodyParts[part.key];
                if (data) {
                    html += `<div style="margin-bottom: 4px;">
                        <span style="color: #ff69b4;">${part.icon} ${part.name}：</span>
                        <span style="color: #999;">${data.description || 'Chưa rõ'}</span>
                        <span style="color: #2ed573; margin-left: 5px;">(${data.useCount || 0} lần)</span>
                    </div>`;
                }
            });

            bodyPartsDiv.innerHTML = html || 'Chưa có dữ liệu';
        }
    } else {
        // Hiển thị thông báo khi protagonist trống
        const bodyPartsDiv = document.getElementById('protagonistBodyParts');
        if (bodyPartsDiv) {
            bodyPartsDiv.innerHTML = '<div style="color: #666;">Đang đợi AI tạo dữ liệu...</div>';
        }
    }
}

// Render thông tin thế lực
function renderFactionInfo(vars) {
    const factionInfo = document.getElementById('factionInfo');
    if (!factionInfo) return;

    if (vars.faction && vars.faction.name) {
        const faction = vars.faction;
        const membersText = Array.isArray(faction.members) && faction.members.length > 0
            ? faction.members.join('、')
            : 'Không có';

        factionInfo.innerHTML = `
            <div class="relationship-detail-row">
                <span class="relationship-detail-label">Tên thế lực：</span>
                <span class="relationship-detail-value">${faction.name}</span>
            </div>
            ${faction.leader ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">Lãnh đạo：</span>
                <span class="relationship-detail-value">${faction.leader}</span>
            </div>` : ''}
            ${faction.location ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">Trụ sở：</span>
                <span class="relationship-detail-value">${faction.location}</span>
            </div>` : ''}
            ${faction.members && faction.members.length > 0 ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">Thành viên chính：</span>
                <span class="relationship-detail-value">${membersText}</span>
            </div>` : ''}
            ${faction.description ? `<div class="relationship-detail-row" style="flex-direction: column; align-items: flex-start;">
                <span class="relationship-detail-label">Giới thiệu：</span>
                <span class="relationship-detail-value" style="margin-top: 5px; line-height: 1.6;">${faction.description}</span>
            </div>` : ''}
        `;
    } else {
        factionInfo.innerHTML = '<div style="text-align: center; color: #999;">Chưa có thế lực</div>';
    }
}

// Lấy tên tiếng Việt của thuộc tính
function getAttributeName(attr) {
    const names = {
        'physique': 'Thể chất',
        'fortune': 'Vận khí',
        'comprehension': 'Căn cơ',
        'spirit': 'Tinh thần',
        'potential': 'Tiềm năng',
        'charisma': '魅力'
    };
    return names[attr] || attr;
}

// Render danh sách đạo cụ
function renderItems(vars) {
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) return;

    if (Array.isArray(vars.items) && vars.items.length > 0) {
        itemsList.innerHTML = vars.items.map((item, index) => {
            const isEquipment = item.type && item.type.startsWith('Trang bị-');
            const isPill = item.type && (item.type.includes('Dược phẩm') || item.type.includes('Thuốc'));

            const equipBtn = isEquipment ? `<button class="equip-btn" onclick="equipItem('${item.name}')">Trang bị</button>` : '';
            const usePillBtn = isPill ? `<button class="equip-btn" onclick="usePill(${index})" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">Sử dụng</button>` : '';

            const effectsText = item.effects ? Object.entries(item.effects).map(([attr, value]) => {
                if (attr === 'skillProgress') {
                    return `Tiến độ kỹ năng+${value}`;
                } else if (attr === 'hp') {
                    return `Thể lực${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'mp') {
                    return `Tinh lực${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'hpMax') {
                    return `Giới hạn thể lực${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'mpMax') {
                    return `Giới hạn tinh lực${value > 0 ? '+' : ''}${value}`;
                }
                return `${getAttributeName(attr)}${value > 0 ? '+' : ''}${value}`;
            }).join(' ') : '';

            return `<div class="item-entry">
                <div>
                    <div>${item.name} x${item.count}</div>
                    <div style="font-size: 11px; color: #666;">${item.type || ''} ${effectsText}</div>
                </div>
                <div class="item-actions">
                    ${equipBtn}
                    ${usePillBtn}
                </div>
            </div>`;
        }).join('');
    } else {
        itemsList.innerHTML = '<div style="text-align: center; color: #999;">Chưa có đạo cụ</div>';
    }
}

// Render quan hệ nhân sự
function renderRelationships(vars) {
    const relationshipsList = document.getElementById('relationshipsList');
    if (!relationshipsList) return;

    console.log('[Cấu hình hiện đại] renderRelationships được gọi');
    console.log('[Cấu hình hiện đại] relationships:', vars.relationships);

    if (vars.relationships && vars.relationships.length > 0) {
        relationshipsList.innerHTML = vars.relationships.map((rel, index) => {
            console.log(`[Cấu hình hiện đại] Render quan hệ ${index}:`, rel);

            // Thiết lập lớp màu sắc dựa trên hảo cảm
            let favorClass = '';
            if (rel.favor >= 60) {
                favorClass = 'high';
            } else if (rel.favor <= -30) {
                favorClass = 'low';
            }

            // Xây dựng nhật ký tương tác
            let historyHtml = '';
            if (Array.isArray(rel.history) && rel.history.length > 0) {
                historyHtml = `
                    <div class="relationship-history">
                        <div class="relationship-history-title">📜 Nhật ký tương tác</div>
                        ${rel.history.map(h => `<div class="relationship-history-item">• ${h}</div>`).join('')}
                    </div>
                `;
            }

            return `
                <div class="relationship-card" onclick="toggleRelationshipDetails(${index})">
                    <div class="relationship-header">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <button class="equip-btn" onclick="event.stopPropagation(); deleteRelationship(${index})"
                                style="background: linear-gradient(135deg, #c85a54 0%, #a84842 100%); padding: 3px 8px;">
                                🗑️
                            </button>
                            <span class="relationship-name">${rel.name} (${rel.relation})</span>
                        </div>
                        <span class="relationship-favor ${favorClass}">Hảo cảm: ${rel.favor}</span>
                    </div>
                    <div class="relationship-details" id="relationship-details-${index}">
                        ${rel.age ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Tuổi：</span>
                            <span class="relationship-detail-value">${rel.age} tuổi</span>
                        </div>` : ''}
                        ${rel.job ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Nghề nghiệp：</span>
                            <span class="relationship-detail-value">${rel.job}</span>
                        </div>` : ''}
                        ${rel.personality ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Tính cách：</span>
                            <span class="relationship-detail-value">${rel.personality}</span>
                        </div>` : ''}
                        ${rel.opinion ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Cách nhìn：</span>
                            <span class="relationship-detail-value">${rel.opinion}</span>
                        </div>` : ''}
                        ${rel.appearance ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Ngoại hình：</span>
                            <span class="relationship-detail-value">${rel.appearance}</span>
                        </div>` : ''}
                        ${rel.sexualPreference ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Sở thích TD：</span>
                            <span class="relationship-detail-value">${rel.sexualPreference}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">Sở thích TD：</span><span class="relationship-detail-value">Chưa rõ</span></div>'}
                        ${rel.isVirgin !== null && rel.isVirgin !== undefined ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Còn trinh：</span>
                            <span class="relationship-detail-value">${rel.isVirgin ? 'Trong trắng' : 'Không'}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">Còn trinh：</span><span class="relationship-detail-value">Chưa rõ</span></div>'}
                        ${rel.firstSex && rel.firstSex !== '未知' ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Lần đầu：</span>
                            <span class="relationship-detail-value">${rel.firstSex}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">Lần đầu：</span><span class="relationship-detail-value">Chưa rõ</span></div>'}
                        ${rel.lastSex && rel.lastSex !== '未知' ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">Gần nhất：</span>
                            <span class="relationship-detail-value">${rel.lastSex}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">Gần nhất：</span><span class="relationship-detail-value">Chưa rõ</span></div>'}
                        <div class="body-details-section" style="margin-top: 10px; padding: 10px; background: linear-gradient(135deg, rgba(255, 105, 180, 0.1) 0%, rgba(255, 192, 203, 0.15) 100%); border-radius: 8px; border: 1px solid rgba(255, 105, 180, 0.3);">
                            <div class="body-details-title" style="color: #ff69b4; font-weight: bold; margin-bottom: 8px; text-align: center;">🌸 Chi tiết cơ thể 🌸</div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">Tiểu huyệt：</span>
                                <span style="color: #666;">${rel.bodyParts?.vagina?.description || 'Chưa rõ'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(Sử dụng ${rel.bodyParts?.vagina?.useCount || 0} lần)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">Ngực：</span>
                                <span style="color: #666;">${rel.bodyParts?.breasts?.description || 'Chưa rõ'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(Sử dụng ${rel.bodyParts?.breasts?.useCount || 0} lần)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">Miệng：</span>
                                <span style="color: #666;">${rel.bodyParts?.mouth?.description || 'Chưa rõ'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(Sử dụng ${rel.bodyParts?.mouth?.useCount || 0} lần)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">Bàn tay：</span>
                                <span style="color: #666;">${rel.bodyParts?.hands?.description || 'Chưa rõ'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(Sử dụng ${rel.bodyParts?.hands?.useCount || 0} lần)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">Bàn chân：</span>
                                <span style="color: #666;">${rel.bodyParts?.feet?.description || 'Chưa rõ'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(Sử dụng ${rel.bodyParts?.feet?.useCount || 0} lần)</span>
                            </div>
                        </div>
                        ${historyHtml}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        relationshipsList.innerHTML = '<div style="text-align: center; color: #999;">Chưa có quan hệ</div>';
    }
}

// Render lịch sử quan trọng
function renderHistory(vars) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (Array.isArray(vars.history) && vars.history.length > 0) {
        historyList.innerHTML = vars.history.map((h, index) => {
            return `<div class="history-item">
                <span class="history-index">${index + 1}</span>
                <div class="history-content">${h}</div>
            </div>`;
        }).join('');
    } else {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có nhật ký lịch sử</div>';
    }
}

// Render trạng thái đặc biệt
function renderSpecialStatus(vars) {
    const container = document.getElementById('specialStatusList');
    if (!container) return;

    let html = '';
    let hasStatus = false;

    // 1. Render trạng thái hiện tại của nhân vật chính
    const protagonistStatus = vars.protagonist?.status || vars.status;
    if (protagonistStatus && protagonistStatus !== 'Bình thường') {
        hasStatus = true;
        html += `
            <div style="background: rgba(255,200,100,0.15); border: 1px solid rgba(255,200,100,0.4); 
                 border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ffa502; font-weight: bold;">📍 Trạng thái hiện tại</span>
                </div>
                <div style="color: #ffeaa7; margin-top: 4px; font-size: 12px;">${protagonistStatus}</div>
            </div>
        `;
    }

    // 2. Render tâm trạng và suy nghĩ của nhân vật chính
    const mood = vars.protagonist?.mood || vars.mood;
    const thought = vars.protagonist?.thought || vars.thought;
    if (mood || thought) {
        hasStatus = true;
        html += `
            <div style="background: rgba(155,89,182,0.15); border: 1px solid rgba(155,89,182,0.4); 
                 border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                ${mood ? `<div style="color: #a29bfe; margin-bottom: 4px;">💭 Tâm trạng：<span style="color: #dfe6e9;">${mood}</span></div>` : ''}
                ${thought ? `<div style="color: #a29bfe; font-style: italic; font-size: 11px;">"${thought}"</div>` : ''}
            </div>
        `;
    }

    // 3. Render các trạng thái đặc biệt trong đối tượng specialStatus
    const specialStatus = vars.specialStatus;
    if (specialStatus && typeof specialStatus === 'object') {
        const statusKeys = Object.keys(specialStatus);
        if (statusKeys.length > 0) {
            hasStatus = true;
            statusKeys.forEach(statusName => {
                const status = specialStatus[statusName];
                if (status && (status.active === true || status.active === null || status.active === undefined)) {
                    const effect = status.effect || '';
                    const description = status.description || '';
                    html += `
                        <div class="special-status-item" style="background: rgba(255,100,100,0.15); 
                             border: 1px solid rgba(255,100,100,0.4); border-radius: 6px; 
                             padding: 8px; margin-bottom: 6px; cursor: pointer;"
                             title="${description}">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #ff6b81; font-weight: bold;">⚠️ ${statusName}</span>
                            </div>
                            ${effect ? `<div style="color: #fab1a0; font-size: 11px; margin-top: 3px;">Hiệu quả：${effect}</div>` : ''}
                            ${description ? `<div style="color: #888; font-size: 10px; margin-top: 3px;">${description}</div>` : ''}
                        </div>
                    `;
                }
            });
        }
    }

    // 4. Kiểm tra SpecialStatusManager (Trạng thái đặc biệt của hệ thống thẻ bài)
    if (typeof SpecialStatusManager !== 'undefined') {
        const cardStatuses = SpecialStatusManager.getActive();
        if (cardStatuses && cardStatuses.length > 0) {
            hasStatus = true;
            cardStatuses.forEach(status => {
                html += `
                    <div class="special-status-item" style="background: rgba(255,100,100,0.1); 
                         border: 1px solid rgba(255,100,100,0.3); border-radius: 6px; 
                         padding: 8px; margin-bottom: 6px; cursor: pointer;"
                         onclick="SpecialStatusManager.showDetail('${status.id}')"
                         title="${status.fullDesc}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #ff6b81;">${status.icon} ${status.id}</span>
                            <span style="color: #888; font-size: 10px;">${status.desc}</span>
                        </div>
                    </div>
                `;
            });
        }
    }

    if (hasStatus) {
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">Chưa có trạng thái bất thường</div>';
    }
}

// Tạo HTML giao diện khởi tạo nhân vật
function generateCharacterCreationHTML() {
    return `
        <div class="character-creation">
            <div class="creation-title">⚡ Khởi tạo Nhân vật ⚡</div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">⚠️</span> Giao ước độ khó / DIFFICULTY</h3>
                <div class="difficulty-options">
                    <div class="difficulty-card" data-difficulty="easy" onclick="selectDifficulty('easy')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">Chế độ Dễ</div>
                            <div class="difficulty-card-badge">EASY</div>
                        </div>
                        <div class="difficulty-card-description">Bắt đầu nhẹ nhàng cho người mới, tài nguyên dồi dào.</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">200 điểm</span>
                            <span class="difficulty-card-feature">Tỷ lệ sai số cao</span>
                        </div>
                    </div>
                    <div class="difficulty-card selected" data-difficulty="normal" onclick="selectDifficulty('normal')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">Chế độ Thường</div>
                            <div class="difficulty-card-badge">NORMAL</div>
                        </div>
                        <div class="difficulty-card-description">Trải nghiệm đô thị hiện đại tiêu chuẩn, rủi ro và cơ hội song hành.</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">100 điểm</span>
                            <span class="difficulty-card-feature">Trải nghiệm cân bằng</span>
                        </div>
                    </div>
                    <div class="difficulty-card hard" data-difficulty="hard" onclick="selectDifficulty('hard')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">Chế độ Khó</div>
                            <div class="difficulty-card-badge">HARD</div>
                        </div>
                        <div class="difficulty-card-description">Tài nguyên khan hiếm, môi trường khắc nghiệt, chỉ kẻ mạnh mới sống sót.</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">50 điểm</span>
                            <span class="difficulty-card-feature">Thử thách cực hạn</span>
                        </div>
                    </div>
                    <div class="difficulty-card" data-difficulty="dragon" onclick="selectDifficulty('dragon')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">Bá chủ (Long Ngạo Thiên)</div>
                            <div class="difficulty-card-badge">GOD MODE</div>
                        </div>
                        <div class="difficulty-card-description">Sự tồn tại phớt lờ mọi quy tắc, bạn là chủ nhân của thế giới này.</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">9999 điểm</span>
                            <span class="difficulty-card-feature">Quét sạch tất cả</span>
                        </div>
                    </div>
                </div>
                <div class="points-display">
                    <span class="points-label">REMAINING POINTS / Điểm còn lại</span>
                    <div class="points-remaining" id="remainingPoints">100</div>
                </div>
            </div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">👤</span> Hồ sơ danh tính / BASIC INFO</h3>
                <div class="form-row">
                    <div class="config-group">
                        <label>Mật danh / NAME</label>
                        <input type="text" id="charNameInput" class="input-full" placeholder="Nhập mật danh của bạn..." value="Vân Tiêu Diêu">
                    </div>
                    <div class="config-group">
                        <label>Tuổi / AGE</label>
                        <input type="number" id="charAgeInput" class="input-full" placeholder="Nhập tuổi" value="18" min="1" max="999">
                    </div>
                </div>
                <div class="form-row">
                    <div class="config-group">
                        <label>Đặc điểm nhân cách / PERSONALITY</label>
                        <input type="text" id="charPersonality" class="input-full" placeholder="Ví dụ: Lạnh lùng, lý trí..." value="Phóng khoáng tự tại">
                    </div>
                </div>
                <div class="config-group">
                    <label>Giới tính sinh học / GENDER</label>
                    <div class="gender-options">
                        <div class="gender-card selected" data-gender="male" onclick="selectGender('male')">
                            <span style="font-size: 24px; display: block; margin-bottom: 5px;">👨</span> Nam giới MALE
                        </div>
                        <div class="gender-card" data-gender="female" onclick="selectGender('female')">
                            <span style="font-size: 24px; display: block; margin-bottom: 5px;">👩</span> Nữ giới FEMALE
                        </div>
                    </div>
                </div>
            </div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">🏙️</span> Tầng lớp xã hội / ORIGIN</h3>
                <div class="creation-subtitle" style="text-align: left; margin-bottom: 15px;">Chọn bối cảnh xuất thân, điều này quyết định thuộc tính khởi đầu và tài nguyên khả dụng của bạn.</div>
                <div id="originGrid" class="origin-options">
                    </div>
            </div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">💾</span> Dữ liệu bổ sung / CUSTOM DATA</h3>
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 10px;">Ghi thêm bối cảnh hoặc thiết lập đặc biệt (tùy chọn)</p>
                <textarea id="customSettings" placeholder="Ví dụ: Mang trong mình mã nguồn ẩn, sở hữu cơ thể máy của hacker, bị tập đoàn khổng lồ truy nã..."
                          style="width: 100%; min-height: 100px;"></textarea>
            </div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">🧬</span> Thiên phú di truyền / TALENTS</h3>
                <div class="talent-grid" id="talentGrid">
                    </div>
            </div>

            <div class="creation-section">
                <h3><span style="margin-right: 10px;">📊</span> Phân bổ thuộc tính / ATTRIBUTES</h3>
                <div class="creation-subtitle" style="text-align: left; margin-bottom: 15px;">Phân bổ các điểm thuộc tính cốt lõi (mỗi điểm tiêu tốn 1 điểm khởi tạo)</div>
                <div id="attributesPanel">
                    <div class="attribute-row">
                        <span class="attr-name">💪 Thể chất<br><span style="font-size: 10px; opacity: 0.7;">PHYSIQUE</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('physique', -1)">-</button>
                            <span class="attr-value" id="physique-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('physique', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">🍀 Vận khí<br><span style="font-size: 10px; opacity: 0.7;">FORTUNE</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('fortune', -1)">-</button>
                            <span class="attr-value" id="fortune-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('fortune', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">🧠 Căn cơ (Trí tuệ)<br><span style="font-size: 10px; opacity: 0.7;">INTELLECT</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('comprehension', -1)">-</button>
                            <span class="attr-value" id="comprehension-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('comprehension', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">👁️ Tinh thần<br><span style="font-size: 10px; opacity: 0.7;">SPIRIT</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('spirit', -1)">-</button>
                            <span class="attr-value" id="spirit-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('spirit', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">⚡ Tiềm năng<br><span style="font-size: 10px; opacity: 0.7;">POTENTIAL</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('potential', -1)">-</button>
                            <span class="attr-value" id="potential-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('potential', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">✨ Mị lực<br><span style="font-size: 10px; opacity: 0.7;">CHARISMA</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('charisma', -1)">-</button>
                            <span class="attr-value" id="charisma-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('charisma', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary glow-effect" onclick="confirmCharacterCreation()" style="font-size: 18px; padding: 18px 60px;">
                    ✅ Kích hoạt liên kết thần kinh / START GAME
                </button>
            </div>
        </div>
    `;
}

// Xuất cấu hình XiuxianGame
const XiuxianGameConfig = {
    gameName: 'Tòa tháp AC',
    fullSystemPrompt: fullSystemPrompt,
    defaultSystemPrompt: defaultSystemPrompt,
    baseSystemPrompt: baseSystemPrompt,
    getAsyncVariablePrompt: getAsyncVariablePrompt,
    defaultDynamicWorldPrompt: defaultDynamicWorldPrompt,
    systemPrompt: getSystemPrompt,
    dynamicWorldPrompt: getDynamicWorldPrompt,
    characterCreation: window.characterCreation,
    origins: window.origins,
    renderStatus: renderStatusPanel,
    generateStatusPanel: generateStatusPanelHTML,
    generateCharacterCreation: generateCharacterCreationHTML,

    // Hàm gọi ngược khởi tạo
    onInit: function (framework) {
        console.log('[acjtConfig] Cấu hình trò chơi Tòa tháp AC đã tải');
        console.log('[acjtConfig] 🆕 Chức năng biến số bất đồng bộ đã sẵn sàng');

        window.xiuxianConfig = this;

        window.ACJTConfig = {
            baseSystemPrompt: baseSystemPrompt,
            getAsyncVariablePrompt: getAsyncVariablePrompt,
            defaultSystemPrompt: defaultSystemPrompt
        };

        // Cưỡng ép điền nội dung gợi ý trò chơi hiện đại
        const systemPromptEl = document.getElementById('systemPrompt');
        const dynamicWorldPromptEl = document.getElementById('dynamicWorldPrompt');

        if (systemPromptEl) {
            systemPromptEl.value = fullSystemPrompt;
            console.log('[XiuxianConfig] 🎮 Đã thiết lập gợi ý hệ thống (Quy tắc cơ bản)');
        }

        if (dynamicWorldPromptEl) {
            dynamicWorldPromptEl.value = defaultDynamicWorldPrompt;
            console.log('[XiuxianConfig] 🌍 Đã thiết lập gợi ý thế giới động (Thế giới quan hiện đại)');
        }

        // Chèn động HTML bảng trạng thái
        const statusPanelContainer = document.getElementById('statusPanelContainer');
        if (statusPanelContainer) {
            const hasRealContent = statusPanelContainer.children.length > 0;
            if (!hasRealContent) {
                statusPanelContainer.innerHTML = generateStatusPanelHTML();
                console.log('[XiuxianConfig] ✅ HTML bảng trạng thái đã được chèn');
            }
        } else {
            console.error('[XiuxianConfig] ❌ Không tìm thấy phần tử statusPanelContainer!');
        }
    }
};

// Xuất ra toàn cục
window.XiuxianGameConfig = XiuxianGameConfig;
