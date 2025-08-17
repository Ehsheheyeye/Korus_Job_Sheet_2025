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
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // If user is already logged in, redirect them to the dashboard
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.textContent = ''; // Clear previous errors

        // This makes the login persistent (remembers the user)
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                // Now, sign in the user
                return auth.signInWithEmailAndPassword(email, password);
            })
            .then((userCredential) => {
                // Signed in successfully
                // The onAuthStateChanged listener will handle the redirect
            })
            .catch((error) => {
                // Handle Errors here.
                console.error("Login Error:", error);
                errorMessage.textContent = 'Invalid email or password.';
            });
    });
});