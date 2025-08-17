document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SECURE_HELPER_URL = "https://script.google.com/macros/s/AKfycbyk-_PZNQpsYkAbOcg6_JjsYCiZ25L8PDiJ-EbH_RdijxIpS42KBns0pZtF652AE0BW/exec";
    const API_SECRET_KEY = "YourSuperSecretPassword123!";
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
    const secondaryApp = firebase.initializeApp({ ...firebaseConfig, name: "secondary" }, "secondary");
    const secondaryAuth = secondaryApp.auth();

    const DOMElements = {
        logoutBtn: document.getElementById('logout-btn'),
        userForm: document.getElementById('user-form'),
        userListBody: document.getElementById('user-list-body'),
        feedbackMessage: document.getElementById('feedback-message'),
        formTitle: document.getElementById('form-title'),
        submitBtn: document.getElementById('submit-btn'),
        cancelEditBtn: document.getElementById('cancel-edit-btn'),
        editDocId: document.getElementById('edit-doc-id'),
        editUid: document.getElementById('edit-uid'),
        phoneNumberInput: document.getElementById('phone-number'),
        passwordInput: document.getElementById('password'),
        togglePasswordBtn: document.getElementById('toggle-password-btn'),
    };

    primaryAuth.onAuthStateChanged(user => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            loadUsers();
        } else {
            window.location.href = 'login.html';
        }
    });

    DOMElements.logoutBtn.addEventListener('click', () => primaryAuth.signOut());
    DOMElements.userForm.addEventListener('submit', handleFormSubmit);
    DOMElements.cancelEditBtn.addEventListener('click', resetForm);
    DOMElements.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = DOMElements.passwordInput.type === 'password';
        DOMElements.passwordInput.type = isPassword ? 'text' : 'password';
        DOMElements.togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    function loadUsers() {
        db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            DOMElements.userListBody.innerHTML = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                if (!user.uid) return;
                DOMElements.userListBody.innerHTML += `
                    <tr>
                        <td>${user.phoneNumber}</td>
                        <td>${user.password}</td>
                        <td class="actions-cell">
                            <button class="edit-btn" title="Edit" onclick="app.editUser('${doc.id}', '${user.uid}', '${user.phoneNumber}', '${user.password}')">✏️ Edit</button>
                            <button class="delete-btn" title="Delete" onclick="app.deleteUser('${doc.id}', '${user.uid}', '${user.phoneNumber}')">🗑️ Delete</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const phoneNumber = DOMElements.phoneNumberInput.value.trim();
        const password = DOMElements.passwordInput.value.trim();
        const docId = DOMElements.editDocId.value;
        const uid = DOMElements.editUid.value;

        if (password.length < 6) {
            return showFeedback('Password must be at least 6 characters long.', 'error');
        }

        if (docId) { // EDIT mode
            const payload = { action: 'updateUser', uid: uid, docId: docId, newPassword: password };
            showFeedback('Updating user... Please wait.', 'success');
            callSecureHelper(payload);
        } else { // CREATE mode
            if (phoneNumber.length < 10 || isNaN(phoneNumber)) {
                return showFeedback('Please enter a valid phone number.', 'error');
            }
            await createNewUser(phoneNumber, password);
        }
    }
    
    async function createNewUser(phoneNumber, password) {
        showFeedback('Creating user... Please wait.', 'success');
        const email = `${phoneNumber}@korus.local`;
        try {
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').add({
                uid: userCredential.user.uid,
                phoneNumber: phoneNumber,
                password: password,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showFeedback(`User ${phoneNumber} created successfully!`, 'success');
            resetForm();
        } catch (error) {
            showFeedback('This phone number is already registered.', 'error');
        } finally {
            secondaryAuth.signOut();
        }
    }

    function editUser(docId, uid, phone, pass) {
        DOMElements.formTitle.textContent = 'Edit User';
        DOMElements.submitBtn.textContent = 'Update Password';
        DOMElements.cancelEditBtn.style.display = 'block';
        DOMElements.phoneNumberInput.value = phone;
        DOMElements.phoneNumberInput.disabled = true;
        DOMElements.passwordInput.value = pass;
        DOMElements.editDocId.value = docId;
        DOMElements.editUid.value = uid;
        window.scrollTo(0, 0);
    }
    
    function deleteUser(docId, uid, phone) {
        if (confirm(`Are you sure you want to PERMANENTLY delete user ${phone}? This cannot be undone.`)) {
            const payload = { action: 'deleteUser', uid: uid, docId: docId };
            showFeedback(`Deleting user ${phone}... Please wait.`, 'success');
            callSecureHelper(payload);
        }
    }

    function callSecureHelper(payload) {
        const form = document.createElement('form');
        form.method = 'post';
        form.action = SECURE_HELPER_URL;
        form.target = 'hidden_iframe';

        const data = { ...payload, secretKey: API_SECRET_KEY };
        for (const key in data) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        setTimeout(() => {
            if (payload.action === 'updateUser') {
                showFeedback('User password updated!', 'success');
                resetForm();
            } else {
                 showFeedback('User permanently deleted!', 'success');
            }
        }, 2500);
    }
    
    function resetForm() {
        DOMElements.formTitle.textContent = 'Create New User';
        DOMElements.submitBtn.textContent = 'Create User';
        DOMElements.cancelEditBtn.style.display = 'none';
        DOMElements.phoneNumberInput.disabled = false;
        DOMElements.userForm.reset();
        DOMElements.editDocId.value = '';
        DOMElements.editUid.value = '';
    }

    function showFeedback(message, type) {
        DOMElements.feedbackMessage.textContent = message;
        DOMElements.feedbackMessage.className = `message ${type}`;
        setTimeout(() => {
            if (DOMElements.feedbackMessage.textContent === message) {
                DOMElements.feedbackMessage.textContent = '';
                DOMElements.feedbackMessage.className = 'message';
            }
        }, 5000);
    }

    window.app = { deleteUser, editUser };
});
