document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Main Page Navigation ---
    const navTriggers = document.querySelectorAll('[data-page]');
    const pageContents = document.querySelectorAll('.page-content');
    
    function switchPage(pageId) {
        pageContents.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            document.getElementById('homePage').classList.add('active');
        }
    }

    navTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = trigger.dataset.page;
            if (pageId) switchPage(pageId);
        });
    });
    
    // --- 2. Create Post Functionality ---
    const postInput = document.querySelector('.create-input');
    const postButton = document.getElementById('postBtn');
    const postsContainer = document.getElementById('postsContainer');

    if (postInput && postButton) {
        postInput.addEventListener('input', () => {
            postButton.disabled = postInput.value.trim() === '';
        });

        postButton.addEventListener('click', () => {
            const postContent = postInput.value.trim();
            if (postContent) {
                const newPost = createPostElement(postContent);
                postsContainer.prepend(newPost);
                postInput.value = '';
                postButton.disabled = true;
            }
        });
    }

    function createPostElement(content) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        // CORRECTED IMAGE PATHS FOR DYNAMIC POSTS
        postCard.innerHTML = `
            <div class="post-header">
                <img src="images/profilem.png" alt="User Avatar" class="post-avatar">
                <div class="post-user-info">
                    <h5>StreetKing_NYC</h5>
                    <p>@streetking_nyc</p>
                </div>
            </div>
            <p class="post-content">${content.replace(/\n/g, '<br>')}</p>
            <div class="post-actions">
                <button class="post-action-btn"><img src="images/like.png" alt="Like"> Like</button>
                <button class="post-action-btn"><img src="images/comment.png" alt="Comment"> Comment</button>
                <button class="post-action-btn"><img src="images/share.png" alt="Share"> Share</button>
            </div>
        `;
        return postCard;
    }

    // --- 3. Profile Dropdown Functionality ---
    const profileMenuBtn = document.getElementById('profileMenuBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileMenuBtn && profileDropdown) {
        profileMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            profileDropdown.classList.toggle('active');
        });

        window.addEventListener('click', () => {
            if (profileDropdown.classList.contains('active')) {
                profileDropdown.classList.remove('active');
            }
        });
        
        profileDropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    // --- Initial setup ---
    switchPage('home');
});
