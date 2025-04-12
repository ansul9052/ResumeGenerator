// Auth state
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authModeToggle = document.getElementById('auth-switch');
const authButton = document.getElementById('authButton');
const closeAuthModalButton = document.getElementById('close-auth-modal');
const userMenu = document.getElementById('userMenu');
const userMenuButton = document.getElementById('userMenuButton');
const logoutButton = document.getElementById('logoutButton');
const googleLoginButton = document.getElementById('google-login');
const facebookLoginButton = document.getElementById('facebook-login');

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
    const modal = document.getElementById('auth-modal');
    if (modal) {
        console.log('Modal found, showing it');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.add('active');
    } else {
        console.error('Auth modal element not found');
    }
}

// Hide auth modal
function hideAuthModal() {
    console.log('Hiding auth modal');
    if (authModal) {
        console.log('Modal found, hiding it');
        authModal.style.opacity = '0';
        authModal.classList.remove('active');
        setTimeout(() => {
            authModal.style.display = 'none';
        }, 300);
    }
}

// Toggle between login and signup
function toggleAuthMode() {
    console.log('Toggling auth mode');
    const authTitle = document.getElementById('auth-title');
    const submitText = document.getElementById('submit-text');
    const nameField = document.getElementById('name-field');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitch = document.getElementById('auth-switch');

    const isCurrentlyLogin = authTitle.textContent === 'Login';
    
    // Update UI elements
    authTitle.textContent = isCurrentlyLogin ? 'Sign Up' : 'Login';
    submitText.textContent = isCurrentlyLogin ? 'Sign Up' : 'Login';
    nameField.style.display = isCurrentlyLogin ? 'block' : 'none';
    authSwitchText.textContent = isCurrentlyLogin ? 'Already have an account? ' : 'Don\'t have an account? ';
    authSwitch.textContent = isCurrentlyLogin ? 'Login' : 'Sign Up';
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
    console.log('DOM Content Loaded');
    
    // Add click handler for auth button
    if (authButton) {
        console.log('Auth button found, adding click listener');
        authButton.addEventListener('click', function(e) {
            console.log('Auth button clicked');
            e.preventDefault();
            e.stopPropagation();
            showAuthModal();
        });
    } else {
        console.error('Auth button not found');
    }

    // Add click handler for close button
    if (closeAuthModalButton) {
        console.log('Close button found, adding click listener');
        closeAuthModalButton.addEventListener('click', function(e) {
            console.log('Close button clicked');
            e.preventDefault();
            e.stopPropagation();
            hideAuthModal();
        });
    }

    // Close modal when clicking outside
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                hideAuthModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.style.display === 'flex') {
            hideAuthModal();
        }
    });

    // Initialize Google Sign-In
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
        });
    });

    // Check for existing session
    checkSession();

    // Add click handlers
    if (authModeToggle) {
        authModeToggle.addEventListener('click', toggleAuthMode);
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', handleGoogleLogin);
    }
    if (facebookLoginButton) {
        facebookLoginButton.addEventListener('click', handleFacebookLogin);
    }

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const isLogin = document.getElementById('auth-title').textContent === 'Login';
        
        if (!isLogin) {
            // Handle Sign Up
            const name = document.getElementById('name').value;
            if (!name) {
                alert('Please enter your name');
                return;
            }
            
            try {
                // This is a mock signup - replace with your actual backend endpoint
                const userData = {
                    name: name,
                    email: email,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                    provider: 'email'
                };
                
                // Simulate successful signup
                handleSuccessfulLogin({
                    user: userData,
                    token: 'mock-token-' + Date.now()
                });
                
                alert('Successfully signed up!');
            } catch (error) {
                console.error('Signup error:', error);
                alert('Failed to sign up. Please try again.');
            }
        } else {
            // Handle Login
            try {
                // This is a mock login - replace with your actual backend endpoint
                const userData = {
                    email: email,
                    name: 'User', // This would come from your backend
                    avatar: `https://ui-avatars.com/api/?name=U&background=random`,
                    provider: 'email'
                };
                
                // Simulate successful login
                handleSuccessfulLogin({
                    user: userData,
                    token: 'mock-token-' + Date.now()
                });
            } catch (error) {
                console.error('Login error:', error);
                alert('Failed to login. Please try again.');
            }
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