import { auth, db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebarProfileImage = document.getElementById('sidebar-profile-image');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarZodiac = document.getElementById('sidebar-zodiac');

    const profilePageImage = document.getElementById('profile-page-image');
    const profilePageUsername = document.getElementById('profile-page-username');
    const profilePageEmail = document.getElementById('profile-page-email');
    const profilePageZodiac = document.getElementById('profile-page-zodiac');
    const userPostsContainer = document.getElementById('user-posts-container');
    const logoutBtn = document.getElementById('logout');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in.
            const uid = user.uid;

            // Fetch user data from Firestore
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                // Sidebar profile
                sidebarProfileImage.src = userData.profileImageUrl || 'images/profile.png';
                sidebarUsername.textContent = userData.username;
                sidebarZodiac.textContent = userData.zodiac;

                // Profile page details
                profilePageImage.src = userData.profileImageUrl || 'images/profile.png';
                profilePageUsername.textContent = userData.username;
                profilePageEmail.textContent = user.email;
                profilePageZodiac.textContent = userData.zodiac;

                // Fetch and display user's posts
                fetchUserPosts(uid);
            } else {
                console.log('No such user document!');
                // Handle case where user doc doesn't exist but they are authenticated
                // Maybe redirect to a create profile page or show default info
            }
        } else {
            // User is signed out.
            window.location.href = 'login.html';
        }
    });

    const fetchUserPosts = async (userId) => {
        const postsQuery = query(
            collection(db, 'posts'), 
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(postsQuery);
        userPostsContainer.innerHTML = ''; // Clear existing posts
        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.userProfileImage || 'images/profile.png'}" alt="User Profile">
                    <div class="post-info">
                        <p class="username">${post.username}</p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.caption}</p>
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image">` : ''}
                </div>
                 <div class="post-actions">
                    <button><img src="images/like.png" alt="Like"><span>Like</span></button>
                    <button><img src="images/comment.png" alt="Comment"><span>Comment</span></button>
                    <button><img src="images/share.png" alt="Share"><span>Share</span></button>
                </div>
            `;
            userPostsContainer.appendChild(postElement);
        });
    };

    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error', error);
        });
    });
});
