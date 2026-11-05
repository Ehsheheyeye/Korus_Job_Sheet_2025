document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration (Same as your other file) ---
    const firebaseConfig = {
        apiKey: "AIzaSyAlaRNwoERMLqCGvcSrAB9IHRK7GncKD4s",
        authDomain: "korus-job-dashboard.firebaseapp.com",
        projectId: "korus-job-dashboard",
        storageBucket: "korus-job-dashboard.firebasestorage.app",
        messagingSenderId: "433518743960",
        appId: "1:433518743960:web:f33bf1af978b14e9f85bed"
    };

    // --- Initialize Firebase ---
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const loginForm = document.getElementById('login-form');
    const userInput = document.getElementById('user-id');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // --- SUPER ADMIN CONFIGURATION ---
    // IMPORTANT: CHANGE THIS LINE TO MATCH YOUR EMAIL IN FIREBASE
    const SUPER_ADMIN_EMAIL = "koruskiran@gmail.com"; 

    // If a user is already logged in, redirect them.
    auth.onAuthStateChanged(user => {
        if (user) {
            if (user.email === SUPER_ADMIN_EMAIL) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userIdValue = userInput.value.trim();
        const password = passwordInput.value;
        errorMessage.textContent = '';

        let emailToLogin;
        // Check if the input is the Super Admin's email
        if (userIdValue.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) { // Made it case-insensitive to be safer
            emailToLogin = userIdValue;
        } else if (!isNaN(userIdValue) && userIdValue.length > 5) {
            // If it's a number (phone number), convert it to the email format we use
            emailToLogin = `${userIdValue}@korus.local`;
        } else {
            errorMessage.textContent = 'Please enter a valid Phone No. or Admin Email.';
            return;
        }

        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                return auth.signInWithEmailAndPassword(emailToLogin, password);
            })
            .then((userCredential) => {
                // Success! The onAuthStateChanged listener above will handle the redirect.
            })
            .catch((error) => {
                console.error("Login Error:", error);
                errorMessage.textContent = 'Invalid credentials. Please try again.';
            });
    });
});


