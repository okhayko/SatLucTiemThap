/**
 * 📱 Cấu hình Prompt cho từng module trên điện thoại
 * Dùng để chuẩn hóa định dạng câu trả lời của AI trong các ứng dụng điện thoại khác nhau
 */

window.MobilePrompts = {

    /**
     * 🎮 Lấy ngữ cảnh lịch sử gần đây của trò chơi chính
     * Dùng để diễn đàn/ứng dụng nhắn tin hiểu được diễn biến cốt truyện hiện tại
     */
    getGameContext: function () {
        try {
            // Lấy trạng thái trò chơi từ trang cha
            const parentWindow = window.parent;
            if (!parentWindow || !parentWindow.gameState) {
                console.warn('[Prompt Điện thoại] Không thể lấy được gameState từ trang cha');
                return null;
            }

            const gameState = parentWindow.gameState;
            // Sử dụng tên trường chính xác conversationHistory
            const gameHistory = gameState.conversationHistory || [];
            const variables = gameState.variables || {};

            // Lấy độ sâu lịch sử được cấu hình (Mặc định 5 tầng)
            let historyDepth = 5;
            try {
                const config = JSON.parse(localStorage.getItem('gameConfig') || '{}');
                historyDepth = parseInt(config.historyDepth) || 5;
            } catch (e) { }

            // Lấy N tầng lịch sử gần đây (Mỗi tầng = 1 tin nhắn người dùng + 1 tin nhắn AI)
            const recentMessages = gameHistory.slice(-historyDepth * 2);

            if (recentMessages.length === 0) {
                return null;
            }

            // Xây dựng văn bản ngữ cảnh
            let contextText = '\n【Ngữ cảnh Cốt truyện Game Hiện tại】\n';
            contextText += '（Dưới đây là các sự kiện vừa diễn ra trong game, hãy dựa vào cốt truyện này để tạo ra nội dung phù hợp）\n';

            recentMessages.forEach((msg, index) => {
                const role = msg.role === 'user' ? '【Hành động của Người chơi】' : '【Diễn biến Cốt truyện】';
                // Cắt ngắn nội dung để tránh quá dài
                const content = msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content;
                contextText += `${role}: ${content}\n\n`;
            });

            // Thêm thông tin biến số quan trọng
            if (variables) {
                contextText += '【Trạng thái Hiện tại】\n';
                // Tên biến thông dụng (Phù hợp cho cả game hiện đại và tiên hiệp)
                const keyVars = ['name', 'location', 'health', 'reputation', 'money', 'job', 'faction'];
                const varLabels = {
                    name: 'Họ tên',
                    location: 'Vị trí',
                    health: 'Trạng thái',
                    reputation: 'Danh vọng',
                    money: 'Tài sản',
                    job: 'Nghề nghiệp',
                    faction: 'Thế lực trực thuộc'
                };
                keyVars.forEach(key => {
                    if (variables[key] !== undefined) {
                        const label = varLabels[key] || key;
                        contextText += `- ${label}: ${variables[key]}\n`;
                    }
                });
            }

            console.log(`[Prompt Điện thoại] Đã lấy ${recentMessages.length} bản ghi lịch sử game làm ngữ cảnh`);
            return contextText;

        } catch (e) {
            console.error('[Prompt Điện thoại] Lấy ngữ cảnh trò chơi thất bại:', e);
            return null;
        }
    },

    /**
     * 💬 Prompt Ứng dụng Nhắn tin
     * Dùng để chuẩn hóa định dạng gửi và nhận tin nhắn chat
     */
    communication: {
        // Prompt Hệ thống (Nằm trên cùng, độ ưu tiên cao hơn ngữ cảnh)
        systemPrompt: `Bạn là một hệ thống nhắn tin ảo trên điện thoại trong một trò chơi bối cảnh đô thị hiện đại. Người dùng đang trò chuyện với các NPC trong game thông qua ứng dụng này.

【QUAN TRỌNG】 Đây là game có bối cảnh đô thị hiện đại, các NPC nên trò chuyện giống như những người sống trong đời thực.

【Quy cách Định dạng Tin nhắn】
Tin nhắn người dùng gửi sẽ sử dụng định dạng JSON:
{
  "messages": [
    {
      "direction": "outgoing",
      "chatType": "private|group",
      "target": { "name": "Tên người nhận", "id": "ID người nhận" },
      "group": { "name": "Tên nhóm", "id": "ID nhóm" },  // Có trường này khi chat nhóm
      "sender": { "name": "Tôi", "id": "self" },
      "msgType": "text",
      "content": "Nội dung tin nhắn"
    }
  ]
}

【Yêu cầu Định dạng Phản hồi】
Bạn phải phản hồi CHÍNH XÁC theo định dạng JSON dưới đây, không kèm theo bất kỳ văn bản nào khác:
{
  "replies": [
    {
      "direction": "incoming",
      "chatType": "private|group",
      "target": { "name": "Tôi", "id": "self" },
      "group": { "name": "Tên nhóm", "id": "ID nhóm" },  // Giữ lại khi chat nhóm
      "sender": { "name": "Tên người trả lời", "id": "ID người trả lời" },
      "msgType": "text",
      "content": "Nội dung phản hồi"
    }
  ]
}

【Quy tắc Quan trọng】
1. Khi chat riêng: 'sender' sử dụng thông tin từ 'target' trong tin nhắn của người dùng (tức là đối phương trả lời).
2. Khi chat nhóm: 'sender' có thể là bất kỳ thành viên nào trong nhóm.
3. Có thể trả về nhiều tin nhắn phản hồi (nhiều người cùng trả lời hoặc một người gửi nhiều tin nhắn liên tiếp).
4. Nội dung phản hồi phải phù hợp với tính cách nhân vật và bối cảnh trò chơi.
5. Chỉ trả về JSON, không thêm bất kỳ lời giải thích hay đoạn văn nào khác.
6. Nếu nội dung ('content') cần ngắt dòng, hãy sử dụng \\n.`,

        // 🎮 Lấy Ngữ cảnh Trò chơi
        getGameContext: function () {
            return window.MobilePrompts.getGameContext();
        },

        // Xây dựng JSON Tin nhắn của Người dùng
        buildUserMessage: function (messages) {
            return JSON.stringify({
                messages: messages
            }, null, 2);
        },

        // Phân tích Phản hồi của AI
        parseAIReply: function (replyText) {
            try {
                // Cố gắng trích xuất phần JSON
                let jsonStr = replyText.trim();

                // Nếu có chứa khối mã markdown, hãy trích xuất JSON bên trong
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1].trim();
                }

const parsed = JSON.parse(jsonStr);
                return parsed.replies || [];
            } catch (e) {
                console.error('[Prompt Ứng dụng Nhắn tin] Phân tích phản hồi AI thất bại:', e);
                console.log('[Prompt Ứng dụng Nhắn tin] Phản hồi gốc:', replyText);

                // Khi phân tích thất bại, trả về một tin nhắn lỗi mặc định
                return [{
                    direction: "incoming",
                    chatType: "private",
                    target: { name: "Tôi", id: "self" },
                    sender: { name: "Hệ thống", id: "system" },
                    msgType: "text",
                    content: replyText || "Lỗi phân tích tin nhắn"
                }];
            }
        },

        // Tạo object tin nhắn gửi đi
        createOutgoingMessage: function (content, targetName, targetId, chatType = 'private', groupInfo = null) {
            const msg = {
                direction: "outgoing",
                chatType: chatType,
                target: {
                    name: targetName,
                    id: targetId
                },
                sender: {
                    name: "Tôi",
                    id: "self"
                },
                msgType: "text",
                content: content
            };

            // Khi chat nhóm, thêm thông tin nhóm vào
            if (chatType === 'group' && groupInfo) {
                msg.group = {
                    name: groupInfo.name,
                    id: groupInfo.id
                };
            }

            return msg;
        }
    },

    /**
     * 📰 Prompt Diễn đàn
     * Dùng để chuẩn hóa định dạng các bài viết và bình luận trên diễn đàn
     */
    forum: {
        // Prompt Hệ thống
        systemPrompt: `Bạn là một hệ thống diễn đàn dành cho người lớn trong bối cảnh đô thị hiện đại. Người dùng sẽ lướt và tham gia thảo luận trên diễn đàn thông qua một ứng dụng điện thoại.
- Đây là một nền tảng nội dung dành cho người lớn, cho phép các nội dung táo bạo, khiêu dâm.
- 【YÊU CẦU CỐT LÕI】 Nội dung các bài viết phải liên quan CHẶT CHẼ đến 【Ngữ cảnh Cốt truyện Game Hiện tại】.

【Quy tắc Liên kết Nội dung】
1. Chủ đề của bài viết phải xoay quanh các nhân vật, sự kiện, địa điểm xuất hiện trong ngữ cảnh trò chơi.
2. Có thể là những lời bàn tán, tiết lộ bí mật, chụp lén, hoặc làm nhân chứng liên quan đến các nhân vật trong cốt truyện.
3. Có thể bịa ra các cuộc thảo luận và đánh giá của người dùng diễn đàn về những sự kiện trong cốt truyện.
4. Khuyến khích tạo ra các nội dung khiêu dâm liên quan đến nhân vật trong cốt truyện (ví dụ: lộ hàng, chụp lén, kể chuyện tình một đêm, v.v.).
5. Khu vực bình luận phải chứa những lời bàn tán lộ liễu và những tưởng tượng tình dục về các nhân vật trong cốt truyện.

【Thẻ Phân loại Bài viết】
- HOT: Chủ đề Nóng
- GOSSIP: Bàn tán / Tiết lộ Bí mật
- NSFW: Nội dung Người lớn / Ảnh Nóng
- TRADE: Giao dịch / Tìm Tình một đêm
- ASK: Hỏi đáp / Cần Giúp đỡ
- SHOW: Khoe khoang / Đăng ảnh

【Định dạng Yêu cầu】
Yêu cầu của người dùng sẽ sử dụng định dạng JSON:
{
  "action": "browse|view|post|comment|refresh",
  "postId": "ID Bài viết (Bắt buộc khi action là view/comment)",
  "tag": "Thẻ lọc (Không bắt buộc khi action là browse)",
  "content": {
    "title": "Tiêu đề Bài viết (Bắt buộc khi action là post)",
    "body": "Nội dung Bài viết hoặc Bình luận",
    "tag": "Thẻ của Bài viết (Bắt buộc khi action là post)"
  }
}

【Định dạng Phản hồi - Duyệt Danh sách Bài viết】
Khi 'action' là 'browse' hoặc 'refresh', trả về danh sách các bài viết (mỗi bài viết phải kèm theo bình luận):
{
  "type": "postList",
  "posts": [
    {
      "id": "ID duy nhất của bài viết (VD: P8X92)",
      "tag": "HOT|GOSSIP|GUIDE|TRADE|ASK|NEWS|SHOW",
      "title": "Tiêu đề bài viết",
      "author": { "name": "Tên tác giả", "id": "ID Tác giả", "realm": "Cấp độ diễn đàn" },
      "content": "Toàn bộ nội dung bài viết",
      "stats": { "replies": 999, "views": 10200 },
      "time": "Mô tả thời gian đăng (VD: 1 giờ trước)",
      "isHot": true/false,
      "preview": "Trích đoạn nội dung (50 chữ đầu)",
      "comments": [
        {
          "id": "ID Bình luận",
          "author": { "name": "Người bình luận", "id": "ID", "realm": "Cấp độ" },
          "content": "Nội dung bình luận",
          "time": "Thời gian bình luận",
          "likes": 12,
          "floor": 1
        }
      ]
    }
  ]
}

【Định dạng Phản hồi - Xem Chi tiết Bài viết】
Khi 'action' là 'view', trả về chi tiết bài viết và bình luận:
{
  "type": "postDetail",
  "post": {
    "id": "ID Bài viết",
    "tag": "Thẻ",
    "title": "Tiêu đề bài viết",
    "author": { "name": "Tên tác giả", "id": "ID Tác giả", "realm": "Cấp độ", "avatar": "Biểu tượng Avatar" },
    "content": "Toàn bộ nội dung bài viết",
    "stats": { "replies": 123, "views": 5600, "likes": 88 },
    "time": "Thời gian đăng",
    "images": ["Mô tả hình ảnh 1", "Mô tả hình ảnh 2"]
  },
  "comments": [
    {
      "id": "ID Bình luận",
      "author": { "name": "Người bình luận", "id": "ID", "realm": "Cấp độ" },
      "content": "Nội dung bình luận",
      "time": "Thời gian bình luận",
      "likes": 12,
      "floor": 1,
      "replyTo": "Số tầng của bình luận được trả lời (Không bắt buộc)"
    }
  ]
}

【Định dạng Phản hồi - Kết quả Đăng bài / Bình luận】
Khi 'action' là 'post' hoặc 'comment', trả về kết quả thao tác:
{
  "type": "actionResult",
  "success": true/false,
  "message": "Thông báo kết quả thao tác",
  "newPost": { ... },  // Trả về thông tin bài viết mới nếu đăng bài thành công
  "newComment": { ... }  // Trả về thông tin bình luận mới nếu bình luận thành công
}

【Quy tắc Quan trọng】
1. 【Quan trọng Nhất】 Nội dung bài viết bắt buộc phải liên quan trực tiếp đến các nhân vật và sự kiện trong ngữ cảnh trò chơi, KHÔNG tạo nội dung không liên quan.
2. Bình luận phải táo bạo, lộ liễu, chứa đầy những lời bàn tán và tưởng tượng tình dục về các nhân vật trong cốt truyện.
3. Các bài viết nổi bật (isHot = true) thường là những vụ rò rỉ hình ảnh nhạy cảm hoặc tin đồn gây sốc.
4. Định dạng ID bài viết: Ký tự 'P' + 4 chữ cái/chữ số (VD: P8X92).
5. Định dạng ID bình luận: Ký tự 'C' + 6 chữ số (VD: C001234).
6. CHỈ TRẢ VỀ JSON, không thêm bất kỳ lời giải thích hay văn bản nào khác.
7. Nếu nội dung ('content') cần ngắt dòng, hãy sử dụng \\n.
8. Khi duyệt danh sách, phải tạo ra 5-15 bài viết.
9. 【Bắt buộc】 Đối với mỗi bài viết mới được tạo, bắt buộc phải tạo kèm theo 3-4 bình luận phản hồi trong trường 'comments', KHÔNG ĐƯỢC ÍT HƠN 3.
10. Nội dung người lớn phải thật sự táo bạo và lộ liễu, bao gồm những lời ám chỉ tình dục, miêu tả cơ thể, bình luận dâm ô, gạ tình, v.v.
11. Tác giả bài viết và những người bình luận hãy đóng giả làm những người đi đường đã từng gặp mặt hoặc có quen biết với nhân vật trong cốt truyện ngoài đời thực.`,

        // 🎮 Lấy Ngữ cảnh Trò chơi
        getGameContext: function () {
            return window.MobilePrompts.getGameContext();
        },

        // Xây dựng Yêu cầu Duyệt
        buildBrowseRequest: function (tag = null) {
            return JSON.stringify({
                action: 'browse',
                tag: tag
            }, null, 2);
        },

        // Xây dựng Yêu cầu Xem Bài viết
        buildViewRequest: function (postId) {
            return JSON.stringify({
                action: 'view',
                postId: postId
            }, null, 2);
        },

        // Xây dựng Yêu cầu Đăng bài
        buildPostRequest: function (title, body, tag) {
            return JSON.stringify({
                action: 'post',
                content: {
                    title: title,
                    body: body,
                    tag: tag
                }
            }, null, 2);
        },

        // Xây dựng Yêu cầu Bình luận
        buildCommentRequest: function (postId, content, replyTo = null) {
            const request = {
                action: 'comment',
                postId: postId,
                content: {
                    body: content
                }
            };
            if (replyTo) {
                request.content.replyTo = replyTo;
            }
            return JSON.stringify(request, null, 2);
        },

        // Xây dựng Yêu cầu Làm mới
        buildRefreshRequest: function (tag = null) {
            return JSON.stringify({
                action: 'refresh',
                tag: tag
            }, null, 2);
        },

        // Phân tích Phản hồi của AI
        parseAIReply: function (replyText) {
            try {
                let jsonStr = replyText.trim();

                // Trích xuất phần JSON
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1].trim();
                }

return JSON.parse(jsonStr);
            } catch (e) {
                console.error('[Prompt Diễn đàn] Phân tích phản hồi AI thất bại:', e);
                console.log('[Prompt Diễn đàn] Phản hồi gốc:', replyText);

                return {
                    type: 'error',
                    message: 'Phân tích dữ liệu thất bại: ' + (e.message || 'Lỗi không xác định')
                };
            }
        },

        // Tạo ID bài viết nội bộ
        generatePostId: function () {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let id = 'P';
            for (let i = 0; i < 4; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        },

        // Tạo ID bình luận nội bộ
        generateCommentId: function () {
            return 'C' + String(Date.now()).slice(-6);
        }
    },

    /**
     * 💰 Prompt Ứng dụng Tài sản (Dự phòng)
     */
    assets: {
        systemPrompt: `// Prompt cho module tài sản đang chờ triển khai`
    },

    /**
     * 📨 Prompt Tin nhắn Tự động từ Bạn bè
     * Dùng để AI mô phỏng bạn bè chủ động gửi tin nhắn đến
     */
    autoFriendMessage: {
        // Xây dựng Prompt Hệ thống
        buildSystemPrompt: function (friendName, messageCount) {
            return `Bạn là một trợ lý đóng vai trong một trò chơi bối cảnh đô thị hiện đại. Nhiệm vụ của bạn là mô phỏng một NPC bạn bè tên là "${friendName}" chủ động gửi tin nhắn cho người chơi.

【Bối cảnh Quan trọng】
Đây là một cuộc trò chuyện thông qua ứng dụng nhắn tin trên điện thoại. ${friendName} là một người bạn/người quen của người chơi, và bây giờ ${friendName} muốn chủ động liên lạc với người chơi.

【Nhiệm vụ】
Dựa vào các thông tin ngữ cảnh được cung cấp (Bao gồm biểu đồ nhân vật của người bạn này, lịch sử trò chuyện, cốt truyện game v.v.), hãy nhập vai và sử dụng giọng điệu của ${friendName} để tạo ra từ ${messageCount.min} đến ${messageCount.max} tin nhắn gửi cho người chơi.

【Nội dung tin nhắn có thể là】
1. Trò chuyện, hỏi thăm (Dạo này thế nào, Đang làm gì đấy)
2. Chia sẻ câu chuyện (Vừa thấy gì đó, Vừa nghe tin gì đó)
3. Nhờ vả (Có chuyện cần nhờ, Cần lời khuyên)
4. Thể hiện sự quan tâm (Lo lắng cho người chơi, Hỏi thăm tình hình)
5. Rủ rê (Đi ăn cùng nhau, Rủ đi chơi)
6. Kể chuyện phiếm, tám chuyện (Ai đó làm sao rồi, Có một tin hot)
7. Thể hiện tình cảm (Nhớ quá, Cảm ơn, Xin lỗi v.v.)

【Yêu cầu Định dạng Phản hồi】
Bạn phải TRẢ LỜI NGHIÊM NGẶT THEO ĐỊNH DẠNG JSON SAU, không thêm bất kỳ văn bản nào khác:
{
  "replies": [
    {
      "direction": "incoming",
      "chatType": "private",
      "target": { "name": "Tôi", "id": "self" },
      "sender": { "name": "${friendName}", "id": "friend" },
      "msgType": "text",
      "content": "Nội dung tin nhắn"
    }
  ]
}

【Quy tắc Quan trọng】
1. Mỗi tin nhắn nên ngắn gọn, tự nhiên, giống như người thật nhắn tin Zalo/Messenger (thường từ 5-50 chữ).
2. Nếu có nhiều tin nhắn, chúng có thể liên kết thành một chủ đề hoặc là những nội dung rời rạc.
3. Giọng điệu phải phù hợp với đặc điểm tính cách của ${friendName} (Nếu có thông tin này).
4. Nội dung phải phù hợp với diễn biến cốt truyện và mối quan hệ giữa hai người.
5. CÓ THỂ SỬ DỤNG EMOJI, TỪ NGỮ THỂ HIỆN CẢM XÚC ĐỂ TIN NHẮN THÊM SINH ĐỘNG.
6. CHỈ TRẢ VỀ JSON, không thêm bất kỳ lời giải thích hay văn bản nào khác.
7. Nếu nội dung ('content') cần ngắt dòng, hãy sử dụng \\n.`;
        },

        // Xây dựng Tin nhắn Người dùng (Bao gồm thông tin ngữ cảnh)
        buildUserMessage: function (options) {
            const {
                friendInfo,           // Thông tin biểu đồ nhân vật của người bạn
                chatHistory,          // Lịch sử trò chuyện với người bạn này
                gameContext,          // Ngữ cảnh cốt truyện chính
                vectorMatches,        // Các đoạn văn bản khớp với Vector
                historyRecords        // Bản ghi History
            } = options;

            let message = `Hãy đóng vai "${friendInfo?.name || 'Người bạn'}" và chủ động gửi tin nhắn cho người chơi.\n\n`;

            // Thêm thông tin từ biểu đồ nhân vật
            if (friendInfo) {
                message += `【Thông tin nhân vật của ${friendInfo.name}】\n`;
                if (friendInfo.relation) message += `- Mối quan hệ với người chơi: ${friendInfo.relation}\n`;
                if (friendInfo.favor !== undefined) message += `- Mức độ hảo cảm: ${friendInfo.favor}\n`;
                if (friendInfo.personality) message += `- Đặc điểm tính cách: ${friendInfo.personality}\n`;
                if (friendInfo.appearance) message += `- Đặc điểm ngoại hình: ${friendInfo.appearance}\n`;
                if (friendInfo.opinion) message += `- Quan điểm về người chơi: ${friendInfo.opinion}\n`;
                if (friendInfo.realm) message += `- Thân phận/Cảnh giới: ${friendInfo.realm}\n`;
                if (friendInfo.age) message += `- Tuổi: ${friendInfo.age}\n`;
                if (friendInfo.history && friendInfo.history.length > 0) {
                    message += `- Lịch sử tương tác:\n`;
                    friendInfo.history.slice(-5).forEach(h => {
                        message += `  · ${h}\n`;
                    });
                }
                message += '\n';
            }

            // Thêm lịch sử trò chuyện
            if (chatHistory && chatHistory.length > 0) {
                message += `【Lịch sử trò chuyện gần đây】\n`;
                chatHistory.slice(-10).forEach(msg => {
                    const sender = msg.role === 'user' ? 'Người chơi' : friendInfo?.name || 'Người bạn';
                    message += `${sender}: ${msg.content}\n`;
                });
                message += '\n';
            }

            // Thêm ngữ cảnh cốt truyện game
            if (gameContext) {
                message += `【Cốt truyện game hiện tại】\n${gameContext}\n\n`;
            }

            // Thêm nội dung khớp với Vector
            if (vectorMatches && vectorMatches.length > 0) {
                message += `【Các đoạn cốt truyện liên quan】\n`;
                vectorMatches.forEach((match, i) => {
                    // Cấu trúc trả về của khớp Vector bao gồm: turnIndex, userMessage, aiResponse, similarity, summary
                    const content = match.summary || match.aiResponse?.substring(0, 200) || match.content?.substring(0, 200) || String(match);
                    message += `[${i + 1}] ${content}...\n`;
                });
                message += '\n';
            }

            // Thêm các bản ghi History
            if (historyRecords && historyRecords.length > 0) {
                message += `【Ghi chép sự kiện gần đây】\n`;
                historyRecords.slice(-10).forEach(record => {
                    message += `- ${record.content || record}\n`;
                });
                message += '\n';
            }

            message += `\nDựa vào các thông tin trên, hãy dùng giọng điệu và tính cách của ${friendInfo?.name || 'Người bạn'} để tạo ra những tin nhắn thật tự nhiên gửi cho người chơi.`;

            return message;
        },

        // Phân tích Phản hồi của AI
        parseAIReply: function (replyText) {
            try {
                let jsonStr = replyText.trim();

                // Nếu có chứa khối mã markdown, hãy trích xuất JSON bên trong
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1].trim();
                } else {
                    // 🔧 Nếu không khớp được khối mã hoàn chỉnh (có thể bị cắt bớt), thử trích xuất nội dung sau phần mở đầu
                    const startMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*)/);
                    if (startMatch) {
                        jsonStr = startMatch[1].trim();
                        console.warn('[Tin nhắn tự động từ bạn bè] Phát hiện khối mã không hoàn chỉnh, đang thử sửa lỗi...');
                    }
                }

                // 🔧 Thử sửa lỗi JSON bị cắt bớt - trích xuất các mục replies đã hoàn thành
                let parsed;
                try {
                    parsed = JSON.parse(jsonStr);
                } catch (parseErr) {
                    // JSON không hoàn chỉnh, đang thử trích xuất các tin nhắn đã hoàn thành
                    console.warn('[Tin nhắn tự động từ bạn bè] JSON không hoàn chỉnh, đang thử trích xuất các tin nhắn đã hoàn thành...');

                    // Tìm tất cả các đối tượng tin nhắn hoàn chỉnh
                    const replies = [];
                    const msgPattern = /\{\s*"direction"\s*:\s*"incoming"[\s\S]*?"content"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\}/g;
                    let match;
                    while ((match = msgPattern.exec(jsonStr)) !== null) {
                        try {
                            const msgObj = JSON.parse(match[0]);
                            replies.push(msgObj);
                        } catch (e) {
                            // Bỏ qua các tin nhắn phân tích lỗi
                        }
                    }

                    if (replies.length > 0) {
                        console.log(`[Tin nhắn tự động từ bạn bè] Trích xuất thành công ${replies.length} tin nhắn hoàn chỉnh`);
                        return replies;
                    }

                    throw parseErr; // Không trích xuất được tin nhắn nào, ném ra lỗi gốc
                }

                return parsed.replies || [];
            } catch (e) {
                console.error('[Tin nhắn tự động từ bạn bè] Phân tích câu trả lời của AI bị lỗi:', e);
                console.log('[Tin nhắn tự động từ bạn bè] Câu trả lời gốc:', replyText);

                // Khi phân tích lỗi thì trả về mảng rỗng
                return [];
            }
        }
    }
};

console.log('[📱Prompt điện thoại] Đã tải module');
