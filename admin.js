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
    // Make sure this matches the email you set in login.js and created in Firebase Auth
    const SUPER_ADMIN_EMAIL = "rushikeshkhode2626@gmail.com"; 

    // --- Initialize Primary Firebase App ---
    const primaryApp = firebase.initializeApp(firebaseConfig);
    const primaryAuth = primaryApp.auth();
    const db = primaryApp.firestore(); // Initialize Firestore

    // --- Initialize a Secondary Firebase App for user creation ---
    const secondaryAppConfig = { ...firebaseConfig, name: "secondary" };
    const secondaryApp = firebase.initializeApp(secondaryAppConfig, "secondary");
    const secondaryAuth = secondaryApp.auth();

    // --- Element Selectors ---
    const logoutBtn = document.getElementById('logout-btn');
    const createUserForm = document.getElementById('create-user-form');
    const phoneNumberInput = document.getElementById('phone-number');
    const passwordInput = document.getElementById('password');
    const feedbackMessage = document.getElementById('feedback-message');
    const userListBody = document.getElementById('user-list-body');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editUserIdInput = document.getElementById('edit-user-id');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');

    // --- Authentication Gate for Admin Page ---
    primaryAuth.onAuthStateChanged(user => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            // User is the admin, load the user list
            loadUsers();
        } else {
            // If not the admin or not logged in, redirect to login page
            window.location.href = 'login.html';
        }
    });

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => primaryAuth.signOut());

    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    createUserForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', resetForm);

    // --- Functions ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        const phoneNumber = phoneNumberInput.value.trim();
        const password = passwordInput.value.trim();
        const editingId = editUserIdInput.value;

        if (!validateInput(phoneNumber, password)) return;

        // If we are editing, we delete the old user first, then create a new one.
        if (editingId) {
            try {
                // For simplicity, we just delete the record from our list (Firestore).
                // The actual auth user will be orphaned, but this is the trade-off for the free plan.
                await db.collection('users').doc(editingId).delete();
            } catch (error) {
                console.error("Error deleting old user during edit:", error);
                showFeedback('Error updating user. Please try again.', 'error');
                return;
            }
        }
        
        // Create the new user in Firebase Auth and our Firestore list
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

            // Now, save the user info (including password) to Firestore
            await db.collection('users').add({
                uid: uid,
                phoneNumber: phoneNumber,
                password: password, // Storing password for admin to see
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showFeedback(`User ${phoneNumber} created/updated successfully!`, 'success');
            resetForm();
            secondaryAuth.signOut(); // Sign out from the secondary instance
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
                usersHTML = '<tr><td colspan="3">No users found. Create one to get started!</td></tr>';
            } else {
                snapshot.forEach(doc => {
                    const user = doc.data();
                    usersHTML += `
                        <tr>
                            <td>${user.phoneNumber}</td>
                            <td>${user.password}</td>
                            <td class="actions-cell">
                                <button class="edit-btn" title="Edit" onclick="app.editUser('${doc.id}', '${user.phoneNumber}', '${user.password}')">✏️</button>
                                <button class="delete-btn" title="Delete" onclick="app.deleteUser('${doc.id}', '${user.phoneNumber}')">🗑️</button>
                            </td>
                        </tr>
                    `;
                });
            }
            userListBody.innerHTML = usersHTML;
        });
    }

    function editUser(docId, phone, pass) {
        formTitle.textContent = 'Edit User';
        submitBtn.textContent = 'Update User';
        cancelEditBtn.style.display = 'inline-block';
        
        editUserIdInput.value = docId;
        phoneNumberInput.value = phone;
        passwordInput.value = pass;
        
        window.scrollTo(0, 0); // Scroll to top to see the form
    }

    async function deleteUser(docId, phone) {
        if (confirm(`Are you sure you want to delete user ${phone}? This cannot be undone.`)) {
            try {
                await db.collection('users').doc(docId).delete();
                showFeedback(`User ${phone} has been deleted.`, 'success');
                // Note: This only removes them from the list. The user still exists in Firebase Auth.
            } catch (error) {
                console.error("Error deleting user: ", error);
                showFeedback('Could not delete user. Please try again.', 'error');
            }
        }
    }

    function resetForm() {
        formTitle.textContent = 'Create New User';
        submitBtn.textContent = 'Create User';
        cancelEditBtn.style.display = 'none';
        createUserForm.reset();
        editUserIdInput.value = '';
    }

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `message ${type}`;
        setTimeout(() => {
            feedbackMessage.textContent = '';
            feedbackMessage.className = 'message';
        }, 4000);
    }

    // Expose functions to be called from HTML
    window.app = {
        editUser,
        deleteUser
    };
});

