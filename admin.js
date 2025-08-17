document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // PASTE the Web app URL you copied from Google Apps Script here.
    const SECURE_HELPER_URL = "https://script.google.com/macros/s/AKfycbyYWO6SDLx6Pm4r4ULtXaO5RBuXodUM_KeV3Neagm0Z6JSndMfJvjWU3nl7b4kNsndS/exec";

    // Create a secret key. This must EXACTLY match the API_SECRET_KEY in your Google Apps Script.
    const API_SECRET_KEY = "YourSuperSecretPassword123!";

    // Your Super Admin Email.
    const SUPER_ADMIN_EMAIL = "koruskiran@gmail.com"; 

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyAlaRNwoERMLqCGvcSrAB9IHRK7GncKD4s",
        authDomain: "korus-job-dashboard.firebaseapp.com",
        projectId: "korus-job-dashboard",
        storageBucket: "korus-job-dashboard.firebasestorage.app",
        messagingSenderId: "433518743960",
        appId: "1:433518743960:web:f33bf1af978b14e9f85bed"
    };

    // --- DO NOT EDIT BELOW THIS LINE ---

    const primaryApp = firebase.initializeApp(firebaseConfig);
    const primaryAuth = primaryApp.auth();
    const db = primaryApp.firestore();

    const secondaryAppConfig = { ...firebaseConfig, name: "secondary" };
    const secondaryApp = firebase.initializeApp(secondaryAppConfig, "secondary");
    const secondaryAuth = secondaryApp.auth();

    const logoutBtn = document.getElementById('logout-btn');
    const createUserForm = document.getElementById('create-user-form');
    const userListBody = document.getElementById('user-list-body');
    const feedbackMessage = document.getElementById('feedback-message');

    primaryAuth.onAuthStateChanged(user => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            loadUsers();
        } else {
            window.location.href = 'login.html';
        }
    });

    logoutBtn.addEventListener('click', () => primaryAuth.signOut());
    createUserForm.addEventListener('submit', handleFormSubmit);

    async function handleFormSubmit(e) {
        e.preventDefault();
        const phoneNumber = document.getElementById('phone-number').value.trim();
        const password = document.getElementById('password').value.trim();
        if (password.length < 6) {
             showFeedback('Password must be at least 6 characters long.', 'error');
             return;
        }
        await createNewUser(phoneNumber, password);
    }
    
    async function createNewUser(phoneNumber, password) {
        const email = `${phoneNumber}@korus.local`;
        try {
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            
            await db.collection('users').add({
                uid: uid,
                phoneNumber: phoneNumber,
                password: password,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showFeedback(`User ${phoneNumber} created successfully!`, 'success');
            createUserForm.reset();
            secondaryAuth.signOut();
        } catch (error) {
            showFeedback('This phone number is already registered.', 'error');
            secondaryAuth.signOut();
        }
    }

    function loadUsers() {
        db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            let usersHTML = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                usersHTML += `
                    <tr>
                        <td>${user.phoneNumber}</td>
                        <td>${user.password}</td>
                        <td class="actions-cell">
                            <button class="delete-btn" title="Delete" onclick="app.deleteUser('${doc.id}', '${user.uid}', '${user.phoneNumber}')">🗑️ Delete</button>
                        </td>
                    </tr>
                `;
            });
            userListBody.innerHTML = usersHTML;
        });
    }

    async function deleteUser(docId, uid, phone) {
        if (confirm(`Are you sure you want to PERMANENTLY delete user ${phone}? This cannot be undone.`)) {
            showFeedback(`Deleting user ${phone}... Please wait.`, 'success');
            try {
                const response = await fetch(SECURE_HELPER_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Use no-cors for simple requests to Apps Script
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        secretKey: API_SECRET_KEY,
                        action: 'deleteUser',
                        uid: uid,
                        docId: docId
                    })
                });
                
                // Since 'no-cors' prevents reading the response, we just assume success if no network error.
                // Firestore's onSnapshot will automatically update the UI.
                showFeedback(`User ${phone} has been permanently deleted.`, 'success');

            } catch (error) {
                console.error("Error calling secure helper:", error);
                showFeedback('An error occurred. The user may not be fully deleted.', 'error');
            }
        }
    }

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `message ${type}`;
        setTimeout(() => { feedbackMessage.textContent = ''; feedbackMessage.className = 'message';}, 4000);
    }

    window.app = { deleteUser };
});
