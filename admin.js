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
    const SUPER_ADMIN_EMAIL = "koruskiran@gmail.com"; // Your correct admin email

    // --- Initialize Firebase App ---
    const primaryApp = firebase.initializeApp(firebaseConfig);
    const primaryAuth = primaryApp.auth();
    const db = primaryApp.firestore();

    const secondaryAppConfig = { ...firebaseConfig, name: "secondary" };
    const secondaryApp = firebase.initializeApp(secondaryAppConfig, "secondary");
    const secondaryAuth = secondaryApp.auth();

    // --- Element Selectors ---
    const logoutBtn = document.getElementById('logout-btn');
    const createUserForm = document.getElementById('create-user-form');
    const userListBody = document.getElementById('user-list-body');
    const feedbackMessage = document.getElementById('feedback-message');

    // --- Authentication Gate ---
    primaryAuth.onAuthStateChanged(user => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            loadUsers();
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => primaryAuth.signOut());
    createUserForm.addEventListener('submit', handleFormSubmit);
    // ... (other listeners from admin.html if you add them back)

    // --- Functions ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        const phoneNumber = document.getElementById('phone-number').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!validateInput(phoneNumber, password)) return;
        await createNewUser(phoneNumber, password);
    }

    function validateInput(phone, pass) {
        if (isNaN(phone) || phone.length < 10) {
            showFeedback('Please enter a valid 10-digit phone number.', 'error');
            return false;
        }
        if (pass.length < 6) {
            showFeedback('Password must be at least 6 characters long.', 'error');
            return false;
        }
        return true;
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
                status: 'active', // NEW: Set status to active
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showFeedback(`User ${phoneNumber} created successfully!`, 'success');
            createUserForm.reset();
            secondaryAuth.signOut();
        } catch (error) {
            if (error.code == 'auth/email-already-in-use') {
                showFeedback('This phone number is already registered.', 'error');
            } else {
                showFeedback('An error occurred. Please try again.', 'error');
                console.error("Create User Error:", error);
            }
            secondaryAuth.signOut();
        }
    }

    function loadUsers() {
        db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            let usersHTML = '';
            if (snapshot.empty) {
                usersHTML = '<tr><td colspan="4">No users found.</td></tr>';
            } else {
                snapshot.forEach(doc => {
                    const user = doc.data();
                    const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
                    const actionButton = user.status === 'active' 
                        ? `<button class="delete-btn" title="Disable User" onclick="app.toggleUserStatus('${doc.id}', '${user.phoneNumber}', 'inactive')">❌ Disable</button>`
                        : `<button class="edit-btn" title="Enable User" onclick="app.toggleUserStatus('${doc.id}', '${user.phoneNumber}', 'active')">✅ Enable</button>`;

                    usersHTML += `
                        <tr class="${statusClass}">
                            <td>${user.phoneNumber}</td>
                            <td>${user.password}</td>
                            <td><span class="status-pill">${user.status}</span></td>
                            <td class="actions-cell">
                                ${actionButton}
                            </td>
                        </tr>
                    `;
                });
            }
            userListBody.innerHTML = usersHTML;
        });
    }

    async function toggleUserStatus(docId, phone, newStatus) {
        const action = newStatus === 'inactive' ? 'disable' : 'enable';
        if (confirm(`Are you sure you want to ${action} user ${phone}?`)) {
            try {
                await db.collection('users').doc(docId).update({ status: newStatus });
                showFeedback(`User ${phone} has been ${action}d.`, 'success');
            } catch (error) {
                console.error(`Error ${action}ing user:`, error);
                showFeedback(`Could not ${action} user. Please try again.`, 'error');
            }
        }
    }

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `message ${type}`;
        setTimeout(() => {
            feedbackMessage.textContent = '';
            feedbackMessage.className = 'message';
        }, 4000);
    }

    window.app = {
        toggleUserStatus
    };
});
