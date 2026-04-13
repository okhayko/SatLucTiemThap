// 📱 Lắng nghe phản hồi AI từ trang cha (Module Diễn đàn)
window.addEventListener('message', function(event) {
    // 🗑️ Lắng nghe lệnh xóa dữ liệu
    if (event.data && event.data.type === 'MOBILE_FORUM_CLEAR') {
        console.log('[📰Diễn đàn] Đã nhận lệnh xóa dữ liệu');
        if (window.forumApi && window.forumApi.clearAll) {
            window.forumApi.clearAll();
        }
        return;
    }
    
    if (event.data && event.data.type === 'MOBILE_FORUM_RESPONSE') {
        console.log('[📰Diễn đàn] Đã nhận phản hồi từ AI');
        
        const { loadingId, success, reply, error } = event.data;
        
        // Gỡ bỏ trạng thái đang tải (Loading)
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.remove();
        }
        
        if (success && reply) {
            // Tiến hành phân tích câu trả lời của AI
            if (window.MobilePrompts && window.MobilePrompts.forum) {
                const data = window.MobilePrompts.forum.parseAIReply(reply);
                window.forumApi.handleAIResponse(data);
            } else {
                console.error('[📰Diễn đàn] Chưa load xong MobilePrompts.forum');
            }
        } else {
            window.forumApi.showError(error || 'Yêu cầu thất bại');
        }
    }
});

// Định nghĩa các tính năng toàn cục của Diễn đàn
window.forumApi = {
    // Thẻ lọc hiện tại (Current filter tag)
    currentTag: null,
    
    // Bài viết đang xem
    currentPost: null,
    
    // Bộ nhớ đệm bài viết (Local Cache)
    postsCache: {},
    
    // Bộ nhớ đệm bình luận (Local Cache)
    commentsCache: {},
    
    // 💾 Dữ liệu được lưu trữ
    forumStorage: {
        myPosts: [],      // Bài viết của tôi
        myComments: [],   // Bình luận của tôi
        favorites: [],    // Bài viết đã lưu
        history: [],       // Lịch sử duyệt bài
        postsCache: {},   // Bộ nhớ đệm bài viết do AI tạo ra
        commentsCache: {} // Bộ nhớ đệm bình luận
    },
    
    // Khởi tạo Diễn đàn
    initApp: function() {
        window.forumApi.loadFromStorage();
        // Hiển thị bộ nhớ đệm cục bộ hoặc bài viết mặc định (Không gọi API)
        setTimeout(() => {
            window.forumApi.showLocalPosts();
        }, 100);
    },
    
    // Hiển thị các bài viết trong bộ nhớ đệm cục bộ (Không gọi API)
    showLocalPosts: function(tag = null) {
        window.forumApi.currentTag = tag;
        
        // Lấy bài viết từ bộ nhớ đệm
        const cachedPosts = Object.values(window.forumApi.postsCache);
        console.log('[📰Diễn đàn] Đang hiển thị bài viết cục bộ, số lượng trong cache:', cachedPosts.length);
        
        // Nếu có bộ nhớ đệm, tiến hành sắp xếp theo thời gian lấy dữ liệu (Mới nhất lên đầu), sau đó lọc theo thẻ (tag) rồi hiển thị
        if (cachedPosts.length > 0) {
            // 🆕 Sắp xếp theo thời gian lấy dữ liệu, bài mới nhất nằm trên cùng
            cachedPosts.sort((a, b) => (b._fetchTime || 0) - (a._fetchTime || 0));
            
            let filtered = cachedPosts;
            if (tag) {
                filtered = cachedPosts.filter(p => p.tag === tag);
            }
            window.forumApi.renderPostList(filtered);
        } else {
            // Không có bộ nhớ đệm, hiển thị bài viết mặc định
            console.log('[📰Diễn đàn] Không có bài viết trong bộ nhớ đệm, sẽ hiển thị nội dung mặc định');
            window.forumApi.showDefaultPosts(tag);
        }
    },
    
    // Hiển thị bài viết mặc định (Không gọi API)
    showDefaultPosts: function(tag = null) {
        const defaultPosts = [
            
        ];
        
        // Đưa bài viết mặc định vào bộ nhớ đệm
        defaultPosts.forEach(post => {
            window.forumApi.postsCache[post.id] = post;
        });
        
        // Lọc bài viết
        let filtered = defaultPosts;
        if (tag) {
            filtered = defaultPosts.filter(p => p.tag === tag);
        }
        
        window.forumApi.renderPostList(filtered);
    },
    
    // Làm mới danh sách bài viết (Có gọi API)
    refreshPosts: function(tag = null) {
        window.forumApi.currentTag = tag;
        window.forumApi.showLoading('forum-list-container', 'Đang tải bài viết...');
        
        // Khởi tạo Request
        const request = window.MobilePrompts?.forum?.buildBrowseRequest(tag) || 
            JSON.stringify({ action: 'browse', tag: tag });
        
        // Gửi Request về trang cha
        window.forumApi.sendRequest(request, 'browse');
    },
    
    // Xem chi tiết bài viết (Không tự động gọi API, hiển thị nội dung trong bộ nhớ đệm)
    viewPost: function(postId) {
        window.forumApi.currentPost = postId;
        window.forumApi.switchToDetail();
        
        // Lưu vào lịch sử duyệt bài
        window.forumApi.addToHistory(postId);
        
        // Thử hiển thị bài viết từ bộ nhớ đệm
        const cachedPost = window.forumApi.postsCache[postId];
        const cachedComments = window.forumApi.commentsCache[postId] || [];
        
        if (cachedPost) {
            // Nếu bài viết không có nội dung đầy đủ, tạo chi tiết mặc định
            if (!cachedPost.content) {
                cachedPost.content = cachedPost.preview || 'Hãy nhấn nút Làm mới bên dưới để tải nội dung đầy đủ...';
                cachedPost.author = cachedPost.author || { name: 'Người dùng ẩn danh', realm: 'Chưa rõ', avatar: '👤' };
            }
            window.forumApi.renderPostDetail(cachedPost, cachedComments);
        } else {
            // Không có trong bộ nhớ đệm, hiển thị thông báo
            const contentEl = document.getElementById('post-detail-content');
            if (contentEl) {
                contentEl.innerHTML = `
                    <div class="forum-empty">
                        <div class="empty-icon">📄</div>
                        <div class="empty-text">Bài viết chưa được lưu trong bộ nhớ đệm</div>
                        <button class="retry-btn" onclick="window.forumApi.loadPostDetail('${postId}')">Tải bài viết</button>
                    </div>
                `;
            }
        }
    },
    
    // Tải chi tiết bài viết (Gọi API thủ công)
    loadPostDetail: function(postId) {
        window.forumApi.showLoading('post-detail-content', 'Đang tải bài viết...');
        
        // Khởi tạo Request
        const request = window.MobilePrompts?.forum?.buildViewRequest(postId) ||
            JSON.stringify({ action: 'view', postId: postId });
        
        // Gửi Request
        window.forumApi.sendRequest(request, 'view');
    },
    
    // Đăng bài viết
    submitPost: function() {
        const title = document.getElementById('new-post-title')?.value?.trim();
        const body = document.getElementById('new-post-body')?.value?.trim();
        const tag = document.getElementById('new-post-tag')?.value;
        
        if (!title) {
            alert('Vui lòng nhập tiêu đề bài viết');
            return;
        }
        if (!body) {
            alert('Vui lòng nhập nội dung bài viết');
            return;
        }
        
        window.forumApi.showLoading('create-post-form', 'Đang đăng bài...');
        
        // Khởi tạo Request
        const request = window.MobilePrompts?.forum?.buildPostRequest(title, body, tag) ||
            JSON.stringify({ action: 'post', content: { title, body, tag } });
        
        // Gửi Request
        window.forumApi.sendRequest(request, 'post');
    },
    
    // Gửi bình luận
    submitComment: function(replyTo = null) {
        const input = document.getElementById('comment-input');
        const content = input?.value?.trim();
        
        if (!content) {
            return;
        }
        
        const postId = window.forumApi.currentPost;
        if (!postId) return;
        
        // Khởi tạo Request
        const request = window.MobilePrompts?.forum?.buildCommentRequest(postId, content, replyTo) ||
            JSON.stringify({ action: 'comment', postId, content: { body: content, replyTo } });
        
        // Làm rỗng khung nhập liệu
        input.value = '';
        
        // Thêm bình luận vào bộ nhớ đệm (Hiển thị ngay lập tức - Optimistic Update)
        window.forumApi.addLocalComment(postId, content, replyTo);
        
        // Gửi Request
        window.forumApi.sendRequest(request, 'comment');
    },
    
    // Gửi Request về trang cha
    sendRequest: function(request, action) {
        const loadingId = 'forum-loading-' + Date.now();
        
        try {
            window.parent.postMessage({
                type: 'MOBILE_FORUM_REQUEST',
                action: action,
                userMessage: request,
                loadingId: loadingId
            }, '*');
        } catch (e) {
            console.error('[📰Diễn đàn] Gửi Request thất bại:', e);
            window.forumApi.showError('Lỗi kết nối: ' + e.message);
        }
    },
    
    // Xử lý phản hồi từ AI
    handleAIResponse: function(data) {
        if (!data) return;
        
        console.log('[📰Diễn đàn] AI trả về toàn bộ dữ liệu:', JSON.stringify(data, null, 2));
        
        switch (data.type) {
            case 'postList':
                // 🆕 Hợp nhất bài viết mới vào bộ nhớ đệm, thay vì ghi đè hoàn toàn
                const newPosts = data.posts || [];
                const existingIds = new Set(Object.keys(window.forumApi.postsCache));
                
                // Cập nhật timestamp cho bài viết mới (Dùng để sắp xếp)
                newPosts.forEach(post => {
                    if (!existingIds.has(post.id)) {
                        post._fetchTime = Date.now(); // Ghi nhận thời gian tải về, bài mới sẽ nằm trên cùng
                    }
                    window.forumApi.postsCache[post.id] = post;
                    // Lưu bình luận vào bộ nhớ đệm
                    if (post.comments && post.comments.length > 0) {
                        window.forumApi.commentsCache[post.id] = post.comments;
                    }
                });
                
                // Lấy toàn bộ bài viết và sắp xếp theo thời gian tải (Bài mới lên đầu)
                const allPosts = Object.values(window.forumApi.postsCache);
                allPosts.sort((a, b) => (b._fetchTime || 0) - (a._fetchTime || 0));
                
                // Lọc theo Thẻ (Tag) hiện tại
                let filteredPosts = allPosts;
                if (window.forumApi.currentTag) {
                    filteredPosts = allPosts.filter(p => p.tag === window.forumApi.currentTag);
                }
                
                window.forumApi.renderPostList(filteredPosts);
                // Lưu dữ liệu bài viết do AI tạo
                window.forumApi.saveToStorage();
                console.log(`[📰Diễn đàn] Làm mới hoàn tất, có thêm ${newPosts.filter(p => !existingIds.has(p.id)).length} bài viết mới, tổng cộng: ${allPosts.length} bài`);
                break;
            case 'postDetail':
                window.forumApi.renderPostDetail(data.post, data.comments || []);
                // Lưu chi tiết bài viết và bình luận
                window.forumApi.saveToStorage();
                break;
            case 'actionResult':
                window.forumApi.handleActionResult(data);
                break;
            case 'error':
                window.forumApi.showError(data.message);
                break;
            default:
                console.warn('[📰Diễn đàn] Loại phản hồi không xác định:', data.type);
        }
    },
    
    // Render Danh sách Bài viết
    renderPostList: function(posts) {
        const container = document.getElementById('forum-list-container');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="forum-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">// Chưa có bài viết nào</div>
                    <div class="empty-hint">Nhấn nút + ở góc phải bên trên để đăng bài đầu tiên, hoặc nhấn 🔄 Làm mới để lấy bài viết mới</div>
                </div>
            `;
            return;
        }
        
        // 🆕 Lưu ý: Logic bộ nhớ đệm đã được di chuyển vào hàm handleAIResponse để xử lý thống nhất
        // Hàm này chỉ đảm nhận việc Render, không tạo lại cache nữa
        
        let html = '';
        posts.forEach(post => {
            const isHot = post.isHot || post.stats?.replies > 500;
            const tagClass = post.tag?.toLowerCase() || 'guide';
            const views = window.forumApi.formatNumber(post.stats?.views || 0);
            const replies = window.forumApi.formatNumber(post.stats?.replies || 0);
            
            html += `
                <div class="post-card ${isHot ? 'hot-topic' : ''}" onclick="window.forumApi.viewPost('${post.id}')">
                    ${isHot ? '<div class="post-scanline"></div>' : ''}
                    <div class="post-header">
                        <span class="tag ${tagClass}">[${post.tag}]</span>
                        <span class="post-id">ID:${post.id}</span>
                    </div>
                    <h3 class="post-title">>> ${post.title}_</h3>
                    ${post.preview ? `<div class="post-preview">${post.preview}</div>` : ''}
                    <div class="post-meta">
                        <span class="author">${post.author?.name || 'Ẩn danh'} · ${post.author?.realm || 'Chưa rõ cảnh giới'}</span>
                    </div>
                    <div class="post-stats">
                        <span class="stat">RE: ${replies}</span>
                        <span class="stat">VIEW: ${views}</span>
                        <span class="stat time">${post.time || 'unknown'}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // Render Chi tiết Bài viết
    renderPostDetail: function(post, comments) {
        if (!post) return;
        
        // Cache
        window.forumApi.postsCache[post.id] = post;
        window.forumApi.commentsCache[post.id] = comments;
        
        // Cập nhật tiêu đề
        const titleEl = document.getElementById('post-detail-title');
        if (titleEl) titleEl.textContent = post.title;
        
        // Render nội dung bài viết
        const contentEl = document.getElementById('post-detail-content');
        if (contentEl) {
            const tagClass = post.tag?.toLowerCase() || 'guide';
            contentEl.innerHTML = `
                <div class="detail-post">
                    <div class="detail-header">
                        <span class="tag ${tagClass}">[${post.tag}]</span>
                        <span class="post-id">ID:${post.id}</span>
                    </div>
                    <h2 class="detail-title">${post.title}</h2>
                    <div class="detail-author">
                        <span class="author-avatar">${post.author?.avatar || '👤'}</span>
                        <div class="author-info">
                            <span class="author-name">${post.author?.name || 'Ẩn danh'}</span>
                            <span class="author-realm">${post.author?.realm || 'Chưa rõ cảnh giới'}</span>
                        </div>
                        <span class="post-time">${post.time || ''}</span>
                    </div>
                    <div class="detail-body">${window.forumApi.formatContent(post.content)}</div>
                    ${post.images?.length ? window.forumApi.renderImages(post.images) : ''}
                    <div class="detail-stats">
                        <span class="stat-item"><span class="stat-icon">👁</span> ${post.stats?.views || 0}</span>
                        <span class="stat-item"><span class="stat-icon">💬</span> ${post.stats?.replies || 0}</span>
                        <span class="stat-item"><span class="stat-icon">❤</span> ${post.stats?.likes || 0}</span>
                    </div>
                    <div class="detail-actions">
                        <button class="action-btn" onclick="window.forumApi.toggleFavorite('${post.id}')">
                            ${window.forumApi.isFavorited(post.id) ? '★ Đã lưu' : '☆ Lưu'}
                        </button>
                        <button class="action-btn" onclick="window.forumApi.sharePost('${post.id}')">↗ Chia sẻ</button>
                    </div>
                </div>
                
                <div class="comments-section">
                    <div class="comments-header">
                        <span class="comments-title">Bình luận (${comments?.length || 0})</span>
                    </div>
                    <div class="comments-list" id="comments-list">
                        ${window.forumApi.renderComments(comments)}
                    </div>
                </div>
            `;
        }
    },
    
    // Render Danh sách Bình luận
    renderComments: function(comments) {
        if (!comments || comments.length === 0) {
            return '<div class="no-comments">// Tạm thời chưa có bình luận, hãy là người đầu tiên bóc tem!</div>';
        }
        
        return comments.map((comment, index) => `
            <div class="comment-item" data-floor="${comment.floor || index + 1}">
                <div class="comment-header">
                    <span class="comment-author">${comment.author?.name || 'Ẩn danh'}</span>
                    <span class="comment-realm">${comment.author?.realm || ''}</span>
                    <span class="comment-floor">#${comment.floor || index + 1} Tầng</span>
                </div>
                ${comment.replyTo ? `<div class="comment-reply-to">Đang trả lời #${comment.replyTo} Tầng</div>` : ''}
                <div class="comment-content">${window.forumApi.formatContent(comment.content)}</div>
                <div class="comment-footer">
                    <span class="comment-time">${comment.time || ''}</span>
                    <span class="comment-likes">❤ ${comment.likes || 0}</span>
                    <button class="reply-btn" onclick="window.forumApi.replyToComment(${comment.floor || index + 1})">Trả lời</button>
                </div>
            </div>
        `).join('');
    },
    
    // Render Mô tả hình ảnh
    renderImages: function(images) {
        if (!images || images.length === 0) return '';
        return `
            <div class="post-images">
                ${images.map(img => `<div class="image-placeholder">[Hình ảnh: ${img}]</div>`).join('')}
            </div>
        `;
    },
    
    // Định dạng nội dung (Xử lý ngắt dòng)
    formatContent: function(content) {
        if (!content) return '';
        return content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
    },
    
    // Định dạng các con số
    formatNumber: function(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'vạn';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return String(num);
    },
    
    // Trả lời bình luận
    replyToComment: function(floor) {
        const input = document.getElementById('comment-input');
        if (input) {
            input.focus();
            input.placeholder = `Trả lời #${floor} Tầng...`;
            input.dataset.replyTo = floor;
        }
    },
    
    // Thêm bình luận cục bộ (Optimistic Update)
    addLocalComment: function(postId, content, replyTo) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        const floor = (window.forumApi.commentsCache[postId]?.length || 0) + 1;
        const newComment = {
            id: window.MobilePrompts?.forum?.generateCommentId() || 'C' + Date.now(),
            author: { name: 'Tôi', id: 'self', realm: 'Chưa rõ' },
            content: content,
            time: 'Vừa xong',
            likes: 0,
            floor: floor,
            replyTo: replyTo
        };
        
        // Thêm vào Cache
        if (!window.forumApi.commentsCache[postId]) {
            window.forumApi.commentsCache[postId] = [];
        }
        window.forumApi.commentsCache[postId].push(newComment);
        
        // Thêm vào Danh sách bình luận của tôi
        window.forumApi.forumStorage.myComments.push({
            ...newComment,
            postId: postId,
            timestamp: Date.now()
        });
        window.forumApi.saveToStorage();
        
        // Render bình luận mới
        const commentHtml = `
            <div class="comment-item new-comment" data-floor="${floor}">
                <div class="comment-header">
                    <span class="comment-author">Tôi</span>
                    <span class="comment-floor">#${floor} Tầng</span>
                </div>
                ${replyTo ? `<div class="comment-reply-to">Đang trả lời #${replyTo} Tầng</div>` : ''}
                <div class="comment-content">${window.forumApi.formatContent(content)}</div>
                <div class="comment-footer">
                    <span class="comment-time">Vừa xong</span>
                    <span class="comment-likes">❤ 0</span>
                </div>
            </div>
        `;
        
        // Xóa dòng "Chưa có bình luận"
        const noComments = commentsList.querySelector('.no-comments');
        if (noComments) noComments.remove();
        
        commentsList.insertAdjacentHTML('beforeend', commentHtml);
        commentsList.scrollTop = commentsList.scrollHeight;
    },
    
    // Xử lý các phản hồi từ Action
    handleActionResult: function(data) {
        if (data.success) {
            if (data.newPost) {
                // Đăng bài thành công
                window.forumApi.forumStorage.myPosts.push({
                    ...data.newPost,
                    timestamp: Date.now()
                });
                window.forumApi.saveToStorage();
                window.forumApi.closeCreateView();
                window.forumApi.refreshPosts();
                alert('Đã đăng bài thành công!');
            } else if (data.newComment) {
                // Bình luận thành công (Đã thực hiện Optimistic Update, có thể sẽ cần thay đổi ID v.v.)
                console.log('[📰Diễn đàn] Bình luận thành công:', data.newComment);
                
                // Xử lý các phản hồi từ cư dân mạng đối với bình luận của người chơi
                if (data.reactions && data.reactions.length > 0) {
                    console.log('[📰Diễn đàn] Đã nhận phản hồi từ cư dân mạng:', data.reactions.length, 'bình luận');
                    window.forumApi.addReactionComments(data.reactions);
                }
            }
        } else {
            window.forumApi.showError(data.message || 'Thao tác không thành công');
        }
    },
    
    // Thêm các bình luận của cư dân mạng đối với bình luận của người chơi
    addReactionComments: function(reactions) {
        const postId = window.forumApi.currentPost;
        if (!postId || !reactions || reactions.length === 0) return;
        
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        // Thêm lần lượt từng phản hồi
        reactions.forEach((reaction, index) => {
            // Đưa vào bộ nhớ Cache
            if (!window.forumApi.commentsCache[postId]) {
                window.forumApi.commentsCache[postId] = [];
            }
            window.forumApi.commentsCache[postId].push(reaction);
            
            // Hiển thị một cách chậm rãi, giả lập hiệu ứng cư dân mạng bình luận
            setTimeout(() => {
                // Gỡ dòng "Chưa có bình luận"
                const noComments = commentsList.querySelector('.no-comments');
                if (noComments) {
                    noComments.remove();
                }
                
                // Cấu trúc DOM của bình luận
                const commentHtml = `
                    <div class="comment-item new-comment reaction-comment" data-floor="${reaction.floor || '?'}">
                        <div class="comment-header">
                            <span class="comment-author">${reaction.author?.name || 'Người dùng ẩn danh'}</span>
                            <span class="comment-realm">${reaction.author?.realm || ''}</span>
                            <span class="comment-floor">#${reaction.floor || '?'} Tầng</span>
                        </div>
                        ${reaction.replyTo ? `<div class="comment-reply-to">Đang trả lời #${reaction.replyTo} Tầng</div>` : ''}
                        <div class="comment-content">${window.forumApi.formatContent(reaction.content)}</div>
                        <div class="comment-footer">
                            <span class="comment-time">${reaction.time || 'Vừa xong'}</span>
                            <span class="comment-likes">❤ ${reaction.likes || 0}</span>
                            <button class="reply-btn" onclick="window.forumApi.replyToComment(${reaction.floor})">Trả lời</button>
                        </div>
                    </div>
                `;
                
                commentsList.insertAdjacentHTML('beforeend', commentHtml);
                
                // Cuộn tới bình luận mới
                const newComment = commentsList.lastElementChild;
                if (newComment) {
                    newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                
                console.log('[📰Diễn đàn] Đang hiển thị phản hồi từ CĐM:', reaction.author?.name, '-', reaction.content);
            }, (index + 1) * 800); // Mỗi phản hồi cách nhau 800ms
        });
        
        // Cập nhật lại số lượng bình luận được hiển thị
        setTimeout(() => {
            const commentsTitle = document.querySelector('.comments-title');
            if (commentsTitle) {
                const count = window.forumApi.commentsCache[postId]?.length || 0;
                commentsTitle.textContent = `Bình luận (${count})`;
            }
            window.forumApi.saveToStorage();
        }, reactions.length * 800 + 100);
    },
    
    // Chuyển qua giao diện chi tiết bài viết
    switchToDetail: function() {
        const listView = document.getElementById('forum-list-view');
        const detailView = document.getElementById('forum-detail-view');
        
        // Ẩn đi phần Header ở giao diện chính
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && detailView) {
            listView.classList.add('hidden');
            detailView.classList.remove('hidden');
        }
    },
    
    // Trở về giao diện danh sách
    backToList: function() {
        const listView = document.getElementById('forum-list-view');
        const detailView = document.getElementById('forum-detail-view');
        
        // Phục hồi lại Header ở giao diện chính
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && detailView) {
            detailView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
        
        window.forumApi.currentPost = null;
    },
    
    // Mở ra giao diện viết bài
    openCreateView: function() {
        const listView = document.getElementById('forum-list-view');
        const createView = document.getElementById('forum-create-view');
        
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && createView) {
            listView.classList.add('hidden');
            createView.classList.remove('hidden');
        }
        
        // Dọn sạch các nội dung trên biểu mẫu
        const titleInput = document.getElementById('new-post-title');
        const bodyInput = document.getElementById('new-post-body');
        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
    },
    
    // Thoát khỏi giao diện viết bài
    closeCreateView: function() {
        const listView = document.getElementById('forum-list-view');
        const createView = document.getElementById('forum-create-view');
        
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && createView) {
            createView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
    },
    
    // Bộ lọc theo các Tag (Chỉ áp dụng với các bộ nhớ Cache nội bộ, không gọi API)
    filterByTag: function(tag) {
        // Cập nhật lại trạng thái hiển thị của thẻ Tag đang dùng
        document.querySelectorAll('.filter-tag').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.tag === tag || (!tag && !el.dataset.tag)) {
                el.classList.add('active');
            }
        });
        
        // Tính năng này chỉ dùng Cache nội bộ nên sẽ không gọi API
        window.forumApi.showLocalPosts(tag);
    },
    
    // Thêm/Xóa khỏi danh sách yêu thích
    toggleFavorite: function(postId) {
        const index = window.forumApi.forumStorage.favorites.indexOf(postId);
        if (index > -1) {
            window.forumApi.forumStorage.favorites.splice(index, 1);
        } else {
            window.forumApi.forumStorage.favorites.push(postId);
        }
        window.forumApi.saveToStorage();
        
        // Thiết lập lại nút giao diện (UI button)
        const btn = document.querySelector('.action-btn');
        if (btn && btn.textContent.includes('Lưu')) {
            btn.textContent = window.forumApi.isFavorited(postId) ? '★ Đã lưu' : '☆ Lưu';
        }
    },
    
    // Xác định xem bài viết đã được yêu thích hay chưa
    isFavorited: function(postId) {
        return window.forumApi.forumStorage.favorites.includes(postId);
    },
    
    // Lưu trữ vào danh sách lịch sử truy cập
    addToHistory: function(postId) {
        const history = window.forumApi.forumStorage.history;
        const index = history.indexOf(postId);
        if (index > -1) history.splice(index, 1);
        history.unshift(postId);
        if (history.length > 50) history.pop();
        window.forumApi.saveToStorage();
    },
    
    // Chức năng share bài viết
    sharePost: function(postId) {
        const post = window.forumApi.postsCache[postId];
        if (post) {
            const text = `【${post.tag}】${post.title}\nTác giả: ${post.author?.name}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                alert('Đã sao chép thông tin vào Clipboard');
            }
        }
    },
    
    // Trạng thái (Loading) hiển thị khi load nội dung 
    showLoading: function(containerId, text = 'Đang Tải...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="forum-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
        }
    },
    
    // Thông báo Lỗi
    showError: function(message) {
        const container = document.getElementById('forum-list-container') || 
                          document.getElementById('post-detail-content');
        if (container) {
            container.innerHTML = `
                <div class="forum-error">
                    <div class="error-icon">⚠</div>
                    <div class="error-text">${message}</div>
                    <button class="retry-btn" onclick="window.forumApi.refreshPosts()">Thử lại</button>
                </div>
            `;
        }
    },
    
    // Tính năng đồng bộ và sao lưu với localStorage
    saveToStorage: function() {
        try {
            // Thực hiện quá trình đồng bộ các đối tượng lưu trữ
            window.forumApi.forumStorage.postsCache = window.forumApi.postsCache;
            window.forumApi.forumStorage.commentsCache = window.forumApi.commentsCache;
            
            localStorage.setItem('mobileForumData', JSON.stringify(window.forumApi.forumStorage));
            // Kích hoạt việc báo tin để đồng bộ với cơ sở dữ liệu IndexedDB của phần game
            window.forumApi.notifyMainGameToSave();
            console.log('[📰Diễn đàn - Bộ Nhớ Đệm] Thông tin về các chủ đề đã được sao lưu, số lượng:', Object.keys(window.forumApi.postsCache).length);
        } catch (e) {
            console.error('[📰Diễn đàn - Bộ Nhớ Đệm] Lỗi Lưu trữ:', e);
        }
    },
    
// Thông báo cho game chính đồng bộ lưu vào IndexedDB
    notifyMainGameToSave: function() {
        try {
            window.parent.postMessage({
                type: 'MOBILE_FORUM_DATA_CHANGED',
                action: 'save',
                data: window.forumApi.exportSaveData()
            }, '*');
            console.log('[📰Diễn đàn] Đã thông báo cho game chính đồng bộ lưu');
        } catch (e) {
            console.warn('[📰Diễn đàn] Thông báo cho game chính thất bại:', e);
        }
    },
    
    // Tải từ localStorage
    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem('mobileForumData');
            if (saved) {
                window.forumApi.forumStorage = JSON.parse(saved);
                
                // Khôi phục dữ liệu bộ nhớ đệm
                window.forumApi.postsCache = window.forumApi.forumStorage.postsCache || {};
                window.forumApi.commentsCache = window.forumApi.forumStorage.commentsCache || {};
                
                console.log('[📰Lưu trữ Diễn đàn] Đã tải dữ liệu, số lượng bài viết:', Object.keys(window.forumApi.postsCache).length);
            } else {
                // Khởi tạo bộ nhớ đệm rỗng
                window.forumApi.postsCache = {};
                window.forumApi.commentsCache = {};
                console.log('[📰Lưu trữ Diễn đàn] Không có dữ liệu lưu trữ, sử dụng trạng thái ban đầu');
            }
        } catch (e) {
            console.error('[📰Lưu trữ Diễn đàn] Tải thất bại:', e);
            // Khi có lỗi cũng cần khởi tạo bộ nhớ đệm
            window.forumApi.postsCache = {};
            window.forumApi.commentsCache = {};
        }
    },
    
    // Xuất dữ liệu lưu trữ
    exportSaveData: function() {
        return window.forumApi.forumStorage;
    },
    
    // Nhập dữ liệu lưu trữ
    importSaveData: function(data) {
        if (data) {
            window.forumApi.forumStorage = data;
            window.forumApi.saveToStorage();
            console.log('[📰Lưu trữ Diễn đàn] Đã khôi phục từ file lưu');
        }
    },
    
    // 🗑️ Xóa tất cả dữ liệu diễn đàn
    clearAll: function() {
        // Xóa dữ liệu lưu trữ
        window.forumApi.forumStorage = {
            myPosts: [],
            myComments: [],
            favorites: [],
            history: [],
            postsCache: {},
            commentsCache: {}
        };
        // Xóa bộ nhớ đệm trên RAM
        window.forumApi.postsCache = {};
        window.forumApi.commentsCache = {};
        window.forumApi.currentPost = null;
        window.forumApi.currentTag = null;
        
        // Xóa localStorage
        try {
            localStorage.removeItem('mobileForumData');
        } catch (e) {}
        
        // Cập nhật giao diện (hiển thị danh sách trống)
        window.forumApi.showLocalPosts();
        
        console.log('[📰Diễn đàn] Đã xóa tất cả dữ liệu');
    }
};

const forumApp = `
<div class="forum-wrapper">
    <div id="forum-list-view" class="forum-view">
        <div class="forum-top-bar">
            <div class="forum-status">FORUM_ONLINE</div>
            <div class="forum-btns">
                <div class="forum-refresh-btn" onclick="window.forumApi.refreshPosts(window.forumApi.currentTag)" title="Làm mới diễn đàn">🔄</div>
                <div class="forum-add-btn" onclick="window.forumApi.openCreateView()" title="Đăng bài">+</div>
            </div>
        </div>
        
        <div class="filter-bar">
            <div class="filter-tag active" data-tag="" onclick="window.forumApi.filterByTag(null)">Tất cả</div>
            <div class="filter-tag" data-tag="HOT" onclick="window.forumApi.filterByTag('HOT')">🔥Đang hot</div>
            <div class="filter-tag" data-tag="GOSSIP" onclick="window.forumApi.filterByTag('GOSSIP')">💬Hóng hớt</div>
            <div class="filter-tag" data-tag="GUIDE" onclick="window.forumApi.filterByTag('GUIDE')">📖Hướng dẫn</div>
            <div class="filter-tag" data-tag="TRADE" onclick="window.forumApi.filterByTag('TRADE')">💰Giao dịch</div>
            <div class="filter-tag" data-tag="ASK" onclick="window.forumApi.filterByTag('ASK')">❓Hỏi đáp</div>
        </div>
        
        <div class="forum-container" id="forum-list-container">
            <div class="forum-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Đang kết nối diễn đàn...</div>
            </div>
        </div>
    </div>
    
    <div id="forum-detail-view" class="forum-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.forumApi.backToList()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name" id="post-detail-title">Chi tiết bài viết</div>
                <div class="detail-status">KÊNH_MÃ_HÓA</div>
            </div>
            <div class="detail-refresh-btn" onclick="window.forumApi.loadPostDetail(window.forumApi.currentPost)" title="Làm mới bài viết">🔄</div>
        </div>
        
        <div class="post-detail-area" id="post-detail-content">
            </div>
        
        <div class="comment-input-area">
            <input type="text" id="comment-input" class="comment-input" placeholder="Viết bình luận..." 
                   onkeypress="if(event.keyCode==13) window.forumApi.submitComment(this.dataset.replyTo)">
            <button class="comment-btn" onclick="window.forumApi.submitComment(document.getElementById('comment-input').dataset.replyTo)">Gửi</button>
        </div>
    </div>
    
    <div id="forum-create-view" class="forum-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.forumApi.closeCreateView()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name">Đăng bài viết</div>
                <div class="detail-status">TẠO_BÀI_MỚI</div>
            </div>
            <button class="submit-post-btn" onclick="window.forumApi.submitPost()">Đăng</button>
        </div>
        
        <div class="create-post-form" id="create-post-form">
            <div class="form-group">
                <label class="form-label">Chọn phân loại</label>
                <select id="new-post-tag" class="form-select">
                    <option value="GOSSIP">💬 Hóng hớt</option>
                    <option value="GUIDE">📖 Hướng dẫn</option>
                    <option value="TRADE">💰 Giao dịch</option>
                    <option value="ASK">❓ Hỏi đáp</option>
                    <option value="NEWS">📰 Tin tức</option>
                    <option value="SHOW">🌟 Khoe khoang</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Tiêu đề bài viết</label>
                <input type="text" id="new-post-title" class="form-input" placeholder="Nhập tiêu đề..." maxlength="50">
            </div>
            <div class="form-group">
                <label class="form-label">Nội dung bài viết</label>
                <textarea id="new-post-body" class="form-textarea" placeholder="Nhập nội dung..." rows="8"></textarea>
            </div>
        </div>
    </div>
</div>

<style>
/* Bao bọc diễn đàn */
.forum-wrapper {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.forum-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.forum-view.hidden {
    display: none;
}

/* Thanh trên cùng */
.forum-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.forum-status {
    font-size: 10px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
    animation: blink 2s infinite;
}

.forum-btns {
    display: flex;
    gap: 8px;
    align-items: center;
}

.forum-refresh-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.05);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.forum-refresh-btn:hover {
    background: rgba(0, 243, 255, 0.15);
    transform: rotate(180deg);
}

.forum-refresh-btn:active {
    transform: rotate(360deg);
}

.forum-add-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--primary);
    color: var(--primary);
    font-size: 18px;
    cursor: pointer;
    clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}

.forum-add-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}

/* Thanh lọc */
.filter-bar {
    display: flex;
    gap: 8px;
    padding: 10px 15px;
    overflow-x: auto;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.filter-bar::-webkit-scrollbar {
    display: none;
}

.filter-tag {
    padding: 4px 10px;
    font-size: 11px;
    color: #666;
    background: rgba(0, 10, 20, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.filter-tag:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.filter-tag.active {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--primary);
    color: var(--primary);
}

/* Container chứa bài viết */
.forum-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 15px;
    padding-bottom: 20px;
    padding-right: 8px; /* Dành không gian cho thanh cuộn */
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
}

/* Thanh cuộn phong cách Cyberpunk cho forum-container */
.forum-container::-webkit-scrollbar {
    width: 6px;
}

.forum-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.1);
}

.forum-container::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #bf00ff 0%, rgba(255, 0, 60, 0.8) 100%);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.3);
    box-shadow: 0 0 6px rgba(191, 0, 255, 0.4);
}

.forum-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #fff 0%, #bf00ff 100%);
    box-shadow: 0 0 10px #bf00ff;
}

.forum-container::-webkit-scrollbar-corner {
    background: rgba(0, 0, 0, 0.3);
}

/* Thẻ bài viết */
.post-card {
    position: relative;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    padding: 12px 15px;
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    transition: all 0.2s;
    overflow: hidden;
    cursor: pointer;
    min-height: 80px;
    flex-shrink: 0;
}

.post-card:hover {
    background: rgba(0, 243, 255, 0.05);
    border-color: var(--primary);
    transform: translateX(3px);
}

.post-scanline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--secondary);
    opacity: 0;
    animation: scan 2s linear infinite;
}

.post-card.hot-topic {
    border-color: var(--secondary);
    box-shadow: 0 0 10px rgba(255, 0, 60, 0.1);
}

.post-card.hot-topic .post-scanline {
    opacity: 0.5;
}

@keyframes scan {
    0% { top: 0; }
    100% { top: 100%; }
}

.post-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-family: 'Courier New', monospace;
}

.tag {
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    background: rgba(0,0,0,0.5);
    border: 1px solid currentColor;
}

.tag.hot { color: var(--secondary); border-color: var(--secondary); box-shadow: 0 0 5px var(--secondary); }
.tag.gossip { color: #bf00ff; border-color: #bf00ff; }
.tag.guide { color: var(--primary); border-color: var(--primary); }
.tag.trade { color: #ffd700; border-color: #ffd700; }
.tag.ask { color: #00ff88; border-color: #00ff88; }
.tag.news { color: #00aaff; border-color: #00aaff; }
.tag.show { color: #ff6600; border-color: #ff6600; }

.post-id {
    font-size: 10px;
    color: #444;
}

.post-title {
    font-size: 14px;
    color: #fff;
    margin-bottom: 6px;
    font-family: 'Courier New', monospace;
    line-height: 1.4;
    text-shadow: 0 0 5px rgba(255,255,255,0.3);
}

.post-preview {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.post-meta {
    font-size: 10px;
    color: #555;
    margin-bottom: 8px;
}

.post-stats {
    display: flex;
    gap: 12px;
    font-size: 10px;
    color: #666;
    font-family: 'Courier New', monospace;
    border-top: 1px dashed rgba(255,255,255,0.1);
    padding-top: 8px;
}

.stat {
    display: flex;
    align-items: center;
}

.stat.time {
    margin-left: auto;
    color: var(--primary);
}

/* Phần đầu chi tiết */
.detail-header {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    background: rgba(0, 10, 20, 0.9);
    border-bottom: 1px solid rgba(0, 243, 255, 0.2);
    gap: 10px;
}

.detail-back {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--primary);
    font-size: 18px;
}

.detail-title-box {
    flex: 1;
    min-width: 0;
}

.detail-name {
    font-size: 14px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.detail-status {
    font-size: 9px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
}

.detail-refresh-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.05);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.detail-refresh-btn:hover {
    background: rgba(0, 243, 255, 0.15);
    transform: rotate(180deg);
}

/* Khu vực chi tiết bài viết */
.post-detail-area {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    padding-right: 8px;
}

/* Thanh cuộn phong cách Cyberpunk cho post-detail-area */
.post-detail-area::-webkit-scrollbar {
    width: 6px;
}

.post-detail-area::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.1);
}

.post-detail-area::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #bf00ff 0%, rgba(255, 0, 60, 0.8) 100%);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.3);
    box-shadow: 0 0 6px rgba(191, 0, 255, 0.4);
}

.post-detail-area::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #fff 0%, #bf00ff 100%);
    box-shadow: 0 0 10px #bf00ff;
}

.detail-post {
    background: rgba(0, 10, 20, 0.6);
    border: 1px solid rgba(0, 243, 255, 0.15);
    padding: 15px;
    margin-bottom: 15px;
}

.detail-post .detail-header {
    padding: 0;
    margin-bottom: 10px;
    background: none;
    border: none;
}

.detail-title {
    font-size: 16px;
    color: #fff;
    margin-bottom: 12px;
    line-height: 1.4;
}

.detail-author {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.1);
    margin-bottom: 12px;
}

.author-avatar {
    font-size: 24px;
}

.author-info {
    flex: 1;
}

.author-name {
    display: block;
    font-size: 13px;
    color: var(--primary);
}

.author-realm {
    font-size: 10px;
    color: #666;
}

.post-time {
    font-size: 10px;
    color: #555;
}

.detail-body {
    font-size: 13px;
    color: #ccc;
    line-height: 1.7;
    margin-bottom: 15px;
}

.post-images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
}

.image-placeholder {
    padding: 20px;
    background: rgba(0, 243, 255, 0.05);
    border: 1px dashed rgba(0, 243, 255, 0.2);
    font-size: 11px;
    color: #666;
    text-align: center;
}

.detail-stats {
    display: flex;
    gap: 15px;
    padding: 10px 0;
    border-top: 1px dashed rgba(255,255,255,0.1);
}

.stat-item {
    font-size: 12px;
    color: #888;
    display: flex;
    align-items: center;
    gap: 4px;
}

.stat-icon {
    font-size: 14px;
}

.detail-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}

.action-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}

/* Khu vực bình luận */
.comments-section {
    background: rgba(0, 10, 20, 0.4);
    border: 1px solid rgba(0, 243, 255, 0.1);
}

.comments-header {
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.comments-title {
    font-size: 13px;
    color: var(--primary);
}

.comments-list {

}

.no-comments {
    padding: 30px;
    text-align: center;
    color: #555;
    font-size: 12px;
}

.comment-item {
    padding: 12px 15px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.comment-item.new-comment {
    background: rgba(0, 243, 255, 0.05);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.comment-author {
    font-size: 12px;
    color: var(--primary);
}

.comment-realm {
    font-size: 10px;
    color: #555;
}

.comment-floor {
    font-size: 10px;
    color: #444;
    margin-left: auto;
}

.comment-reply-to {
    font-size: 10px;
    color: #666;
    padding: 4px 8px;
    background: rgba(255,255,255,0.05);
    margin-bottom: 6px;
    display: inline-block;
}

.comment-content {
    font-size: 12px;
    color: #bbb;
    line-height: 1.5;
    margin-bottom: 8px;
}

.comment-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    color: #555;
}

.comment-likes {
    color: #ff6666;
}

.reply-btn {
    padding: 2px 8px;
    background: none;
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: var(--primary);
    font-size: 10px;
    cursor: pointer;
    margin-left: auto;
}

.reply-btn:hover {
    background: rgba(0, 243, 255, 0.1);
}

/* Khu vực nhập bình luận */
.comment-input-area {
    display: flex;
    gap: 10px;
    padding: 12px 15px;
    background: rgba(0, 10, 20, 0.9);
    border-top: 1px solid rgba(0, 243, 255, 0.2);
}

.comment-input {
    flex: 1;
    padding: 10px 12px;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: #fff;
    font-size: 13px;
    outline: none;
}

.comment-input:focus {
    border-color: var(--primary);
}

.comment-btn {
    padding: 10px 20px;
    background: var(--primary);
    border: none;
    color: #000;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
}

/* Biểu mẫu đăng bài */
.submit-post-btn {
    padding: 6px 15px;
    background: var(--primary);
    border: none;
    color: #000;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
}

.create-post-form {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
}

.form-group {
    margin-bottom: 15px;
}

.form-label {
    display: block;
    font-size: 12px;
    color: var(--primary);
    margin-bottom: 6px;
}

.form-select, .form-input, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: #fff;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
    border-color: var(--primary);
}

.form-textarea {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
}

.form-select option {
    background: #0a0a15;
    color: #fff;
}

/* Trạng thái đang tải */
.forum-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    color: #666;
}

.loading-spinner {
    width: 30px;
    height: 30px;
    border: 2px solid rgba(0, 243, 255, 0.1);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 12px;
    font-family: 'Courier New', monospace;
    animation: blink 1s infinite;
}

@keyframes blink {
    50% { opacity: 0.5; }
}

/* Trạng thái lỗi/trống */
.forum-error, .forum-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    text-align: center;
}

.error-icon, .empty-icon {
    font-size: 40px;
    margin-bottom: 15px;
}

.error-text, .empty-text {
    font-size: 14px;
    color: #888;
    margin-bottom: 10px;
}

.empty-hint {
    font-size: 12px;
    color: #555;
}

.retry-btn {
    padding: 8px 20px;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--primary);
    color: var(--primary);
    cursor: pointer;
    margin-top: 15px;
}

.retry-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}
</style>
`;
