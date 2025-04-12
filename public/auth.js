// Auth state
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authModeToggle = document.getElementById('authModeToggle');
const authButton = document.getElementById('authButton');
const userMenu = document.getElementById('userMenu');
const userMenuButton = document.getElementById('userMenuButton');
const logoutButton = document.getElementById('logoutButton');
const googleLoginButton = document.getElementById('googleLoginButton');
const facebookLoginButton = document.getElementById('facebookLoginButton');

// Initialize Facebook SDK
window.fbAsyncInit = function() {
    FB.init({
        appId: 'YOUR_FACEBOOK_APP_ID',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
    });
};

// Show auth modal
function showAuthModal() {
    console.log('Showing auth modal');
    authModal.style.display = 'flex';
    authModal.style.opacity = '1';
    authModal.classList.add('active');
}

// Hide auth modal
function hideAuthModal() {
    console.log('Hiding auth modal');
    authModal.style.opacity = '0';
    setTimeout(() => {
        authModal.style.display = 'none';
        authModal.classList.remove('active');
    }, 300);
}

// Toggle between login and signup
function toggleAuthMode() {
    const isLogin = authForm.dataset.mode === 'login';
    authForm.dataset.mode = isLogin ? 'signup' : 'login';
    authForm.querySelector('h2').textContent = isLogin ? 'Create Account' : 'Welcome Back';
    authForm.querySelector('button[type="submit"]').textContent = isLogin ? 'Sign Up' : 'Login';
    authModeToggle.textContent = isLogin ? 'Already have an account? Login' : 'Need an account? Sign up';
    const nameField = authForm.querySelector('#nameField');
    if (nameField) {
        nameField.style.display = isLogin ? 'block' : 'none';
    }
}

// Handle Google Login
async function handleGoogleLogin() {
    try {
        console.log('Initiating Google login');
        const auth2 = await gapi.auth2.getAuthInstance();
        const googleUser = await auth2.signIn();
        const profile = googleUser.getBasicProfile();
        
        const userData = {
            name: profile.getName(),
            email: profile.getEmail(),
            avatar: profile.getImageUrl(),
            provider: 'google',
            token: googleUser.getAuthResponse().id_token
        };

        // Send to backend
        const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to authenticate with backend');
        }

        const data = await response.json();
        handleSuccessfulLogin(data);
    } catch (error) {
        console.error('Google login error:', error);
        alert('Failed to login with Google. Please try again.');
    }
}

// Handle Facebook Login
async function handleFacebookLogin() {
    try {
        console.log('Initiating Facebook login');
        const response = await new Promise((resolve, reject) => {
            FB.login((response) => {
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject(new Error('User cancelled login or did not fully authorize.'));
                }
            }, { scope: 'email,public_profile' });
        });

        const userData = await new Promise((resolve, reject) => {
            FB.api('/me', { fields: 'name,email,picture' }, (response) => {
                if (response && !response.error) {
                    resolve({
                        name: response.name,
                        email: response.email,
                        avatar: response.picture.data.url,
                        provider: 'facebook',
                        token: response.authResponse.accessToken
                    });
                } else {
                    reject(new Error('Failed to get user data from Facebook'));
                }
            });
        });

        // Send to backend
        const backendResponse = await fetch('/api/auth/facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!backendResponse.ok) {
            throw new Error('Failed to authenticate with backend');
        }

        const data = await backendResponse.json();
        handleSuccessfulLogin(data);
    } catch (error) {
        console.error('Facebook login error:', error);
        alert('Failed to login with Facebook. Please try again.');
    }
}

// Handle successful login
function handleSuccessfulLogin(data) {
    isAuthenticated = true;
    currentUser = data.user;
    localStorage.setItem('token', data.token);
    updateUI();
    hideAuthModal();
}

// Handle logout
function handleLogout() {
    isAuthenticated = false;
    currentUser = null;
    localStorage.removeItem('token');
    updateUI();
    
    // Sign out from Google
    if (gapi.auth2) {
        gapi.auth2.getAuthInstance().signOut();
    }
    
    // Sign out from Facebook
    if (FB) {
        FB.logout();
    }
}

// Update UI based on auth state
function updateUI() {
    if (isAuthenticated && currentUser) {
        authButton.style.display = 'none';
        userMenu.style.display = 'block';
        userMenuButton.innerHTML = `
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-8 h-8 rounded-full">
            <span class="ml-2">${currentUser.name}</span>
        `;
    } else {
        authButton.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');
    
    // Initialize Google Sign-In
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
        });
    });

    // Check for existing session
    checkSession();

    // Add click handlers
    authButton.addEventListener('click', showAuthModal);
    authModal.querySelector('.close-button').addEventListener('click', hideAuthModal);
    authModeToggle.addEventListener('click', toggleAuthMode);
    logoutButton.addEventListener('click', handleLogout);
    googleLoginButton.addEventListener('click', handleGoogleLogin);
    facebookLoginButton.addEventListener('click', handleFacebookLogin);

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideAuthModal();
        }
    });
});

// Check for existing session
async function checkSession() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                handleSuccessfulLogin(data);
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Session verification error:', error);
            localStorage.removeItem('token');
        }
    }
} 