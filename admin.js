document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyAlaRNwoERMLqCGvcSrAB9IHRK7GncKD4s",
        authDomain: "korus-job-dashboard.firebaseapp.com",
        projectId: "korus-job-dashboard",
        storageBucket: "korus-job-dashboard.firebasestorage.app",
        messagingSenderId: "433518743960",
        appId: "1:433518743960:web:f33bf1af978b14e9f85bed"
    };

    // --- SUPER ADMIN CONFIGURATION ---
    const SUPER_ADMIN_EMAIL = "admin@korus.com"; // Must be the same as in login.js

    // --- Initialize Primary Firebase App ---
    const primaryApp = firebase.initializeApp(firebaseConfig);
    const primaryAuth = primaryApp.auth();

    // --- Initialize a Secondary Firebase App ---
    // This is a trick to let the admin create users without having to log out and log back in.
    const secondaryAppConfig = { ...firebaseConfig, name: "secondary" };
    const secondaryApp = firebase.initializeApp(secondaryAppConfig, "secondary");
    const secondaryAuth = secondaryApp.auth();

    // --- Element Selectors ---
    const logoutBtn = document.getElementById('logout-btn');
    const createUserForm = document.getElementById('create-user-form');
    const phoneNumberInput = document.getElementById('phone-number');
    const passwordInput = document.getElementById('password');
    const feedbackMessage = document.getElementById('feedback-message');

    // --- Authentication Gate for Admin Page ---
    primaryAuth.onAuthStateChanged(user => {
        if (user) {
            // Check if the logged-in user is the Super Admin
            if (user.email !== SUPER_ADMIN_EMAIL) {
                // If not, they don't belong here. Send them away.
                primaryAuth.signOut(); // Log them out for security
                window.location.href = 'login.html';
            }
            // If it is the admin, they can stay.
        } else {
            // If no user is logged in, send to the login page.
            window.location.href = 'login.html';
        }
    });

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => {
        primaryAuth.signOut().then(() => {
            // The onAuthStateChanged listener will handle the redirect.
        });
    });

    createUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phoneNumber = phoneNumberInput.value.trim();
        const password = passwordInput.value.trim();

        // Clear previous messages
        feedbackMessage.textContent = '';
        feedbackMessage.className = 'message';

        // Basic validation
        if (isNaN(phoneNumber) || phoneNumber.length < 10) {
            showFeedback('Please enter a valid 10-digit phone number.', 'error');
            return;
        }
        if (password.length < 6) {
            showFeedback('Password must be at least 6 characters long.', 'error');
            return;
        }

        // Convert phone number to an email format for Firebase
        const email = `${phoneNumber}@korus.local`;

        // Use the secondary auth instance to create the user
        secondaryAuth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                showFeedback(`User ${phoneNumber} created successfully!`, 'success');
                createUserForm.reset(); // Clear the form
                // IMPORTANT: Sign out the newly created user from the secondary instance
                // so it doesn't interfere with the admin's session.
                secondaryAuth.signOut();
            })
            .catch((error) => {
                if (error.code == 'auth/email-already-in-use') {
                    showFeedback('This phone number is already registered.', 'error');
                } else {
                    showFeedback('An error occurred. Please try again.', 'error');
                    console.error("Create User Error:", error);
                }
                secondaryAuth.signOut(); // Also sign out on error
            });
    });

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `message ${type}`;
    }
});