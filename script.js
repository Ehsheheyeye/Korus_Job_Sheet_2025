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

    // --- Initialize Firebase ---
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- NEW function to load user profile ---
    async function loadUserProfile(user) {
        const welcomeMessageEl = document.getElementById('welcome-message');
        if (!welcomeMessageEl) return;
        try {
            const querySnapshot = await db.collection('users').where('uid', '==', user.uid).limit(1).get();
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const userName = userData.displayName || 'User';
                const firstName = userName.split(' ')[0];
                welcomeMessageEl.textContent = `Welcome, ${firstName}`;
            } else {
                welcomeMessageEl.textContent = 'Welcome, User';
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            welcomeMessageEl.textContent = 'Welcome, User';
        }
    }

    // --- AUTHENTICATION GATE ---
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('loader').style.display = 'none';
            document.querySelector('.app-layout').style.display = 'flex';
            loadUserProfile(user);
            initializeApp();
        } else {
            window.location.href = 'login.html';
        }
    });

    function initializeApp() {
        // --- Global State ---
        let currentEditingJobId = null;
        let currentEditingOutwardId = null;
        let allJobSheets = [];
        let allOutwardRecords = [];
        let filteredJobs = [];
        let filteredOutwards = [];
        let allJobsCurrentPage = 1;
        let outwardCurrentPage = 1;
        const itemsPerPage = 10;

        // --- Pre-populated Data ---
        const initialBrandOptions = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Intex", "I-Ball", "Artist", "Lapcare", "EVM", "Crucial", "Logitech", "Apple (MacBook)", "MSI", "Samsung", "Avita", "Fujitsu", "LG", "Toshiba", "HCL", "Redmi", "Sony", "OnePlus", "TCL", "Panasonic", "Sansui", "BenQ", "Zebronics", "ViewSonic", "AOC", "Philips", "Gigabyte", "Cooler Master", "Foxin", "Western Digital (WD)", "Seagate", "Kingston", "XPG", "ADATA", "SanDisk", "Intel", "Ant Esports", "Antec", "Deepcool", "Circle", "Frontech", "Enter", "Canon", "Epson", "Brother", "TVS", "Zebra", "Xerox", "Kyocera", "Ricoh", "Pantum", "Delta", "Vertiv", "12A", "88A", "78A", "925A", "337A", "ProDot"];
        const initialPartyOptions = ["Rahul Sir", "Shree Enterprises", "San infotech", "Audio video care", "Rx service centre", "Nate", "DSK", "Crucial service centre", "Rashi Peripheral", "SR enterprises", "Cache technology", "perfect computers", "EVM service centre", "navkar enterprises"];
        let brandSuggestions = [...initialBrandOptions];
        let partySuggestions = [...initialPartyOptions];
        const problemOptions = ["Formatting", "Dead / No Power", "No Display", "Software Installation", "Dump error", "Beep Sound", "Refiling", "Battery issue", "HDD / SSD issue", "Screen Issue", "Booting issue", "Head block", "Paper Jam", "Repairing", "Moulding / ABH", "Keyboard / Touchpad", "Repairing", "Replacement"];
        const deviceTypeOptions = ["CPU", "Laptop", "Printer", "All-in-One", "Toner", "UPS", "Speaker", "Monitor", "TV", "Charger", "CCTV", "DVR", "NVR", "Projector", "Attendence Device", "Keyboard", "Mouse", "Combo", "Motherboard", "RAM", "HDD", "SSD", "Battery", "Switch", "Cables", "SMPS", "Router", "Wifi Adaptor", "Converter", "Enternal HDD", "Adaptor", "UPS Battery"];
        const currentStatusOptions = ["Pending Diagnosis", "Working", "Repaired", "Water Damaged", "Awaiting Approval", "Software Issue", "Data issue", "Hardware Issue", "Given for Replacement"];
        const finalStatusOptions = ["Not Delivered", "Delivered"];
        const customerStatusOptions = ["Not Called", "Called", "Called - No Response", "Called - Will Visit", "Called - Not pickup yet"];

        // --- Element Selectors ---
        const DOMElements = {
            menuBtn: document.getElementById('menu-btn'), sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebar-overlay'), sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
            mobilePageTitle: document.getElementById('mobile-page-title'),
            desktopPageTitle: document.getElementById('desktop-page-title'), themeToggle: document.getElementById('theme-toggle'),
            logoutBtn: document.getElementById('logout-btn'),
            jobSheetNo: document.getElementById('job-sheet-no'), oldJobSheetNo: document.getElementById('old-job-sheet-no'),
            date: document.getElementById('date'), customerName: document.getElementById('customer-name'),
            customerMobile: document.getElementById('customer-mobile'), altMobile: document.getElementById('alt-mobile'),
            deviceType: document.getElementById('device-type'), brandName: document.getElementById('brand-name'),
            reportedProblems: document.getElementById('reported-problems'), accessories: document.getElementById('accessories'),
            currentStatus: document.getElementById('current-status'), finalStatus: document.getElementById('final-status'),
            customerStatus: document.getElementById('customer-status'), estimateAmount: document.getElementById('estimate-amount'),
            engineerKundan: document.getElementById('engineer-kundan'), engineerRushi: document.getElementById('engineer-rushi'),
            saveRecordBtn: document.getElementById('save-record-btn'), newJobBtn: document.getElementById('new-job-btn'),
            totalJobsStat: document.getElementById('total-jobs-stat'), pendingJobsStat: document.getElementById('pending-jobs-stat'),
            workingJobsStat: document.getElementById('working-jobs-stat'), deliveredJobsStat: document.getElementById('delivered-jobs-stat'),
            pendingInwardStat: document.getElementById('pending-inward-stat'),
            rahulSirPendingStat: document.getElementById('rahul-sir-pending-stat'),
            recentJobsTableBody: document.getElementById('recent-jobs-table-body'),
            jobSheetHeaderActions: document.getElementById('job-sheet-header-actions'),
            allJobsHeaderActions: document.getElementById('all-jobs-header-actions'),
            allJobsSearchBox: document.getElementById('all-jobs-search-box'), downloadExcelBtn: document.getElementById('download-excel-btn'),
            allJobsTableBody: document.getElementById('all-jobs-table-body'),
            allJobsPagination: document.getElementById('all-jobs-pagination'),
            outwardFormTitle: document.getElementById('outward-form-title'), partyName: document.getElementById('party-name'),
            materialDesc: document.getElementById('material-desc'), outwardDate: document.getElementById('outward-date'),
            inwardDate: document.getElementById('inward-date'), saveOutwardBtn: document.getElementById('save-outward-btn'),
            cancelOutwardEditBtn: document.getElementById('cancel-outward-edit-btn'),
            outwardRecordsTableBody: document.getElementById('outward-records-table-body'),
            inwardOutwardHeaderActions: document.getElementById('inward-outward-header-actions'),
            inwardOutwardSearchBox: document.getElementById('inward-outward-search-box'),
            downloadInwardOutwardExcelBtn: document.getElementById('download-inward-outward-excel-btn'),
            inwardOutwardPagination: document.getElementById('inward-outward-pagination'),
        };

        function init() {
            setupNavigation();
            setupClock();
            setupTheme();
            setupEventListeners();
            populateSelects();
            populateCheckboxes();
            setInitialDate();
            loadInitialData();
        }

        function setupNavigation() {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = link.dataset.page;
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                    document.getElementById(`${page}-page`).classList.add('active');

                    const pageTitle = link.querySelector('span').textContent;
                    DOMElements.mobilePageTitle.textContent = pageTitle;
                    DOMElements.desktopPageTitle.textContent = pageTitle;
                    
                    DOMElements.jobSheetHeaderActions.style.display = 'none';
                    DOMElements.allJobsHeaderActions.style.display = 'none';
                    DOMElements.inwardOutwardHeaderActions.style.display = 'none';
                    if (page === 'job-sheet') {
                        DOMElements.jobSheetHeaderActions.style.display = 'flex';
                    } else if (page === 'all-jobs') {
                        DOMElements.allJobsHeaderActions.style.display = 'flex';
                    } else if (page === 'inward-outward') {
                        DOMElements.inwardOutwardHeaderActions.style.display = 'flex';
                    }

                    document.body.classList.remove('sidebar-open');
                });
            });
            DOMElements.menuBtn.addEventListener('click', () => document.body.classList.add('sidebar-open'));
            DOMElements.sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
            DOMElements.sidebarCloseBtn.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
        }

        function setupClock() {
            const timeEl = document.getElementById('clock-time');
            const dateEl = document.getElementById('clock-date');
            function update() {
                const now = new Date();
                timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
            }
            update();
            setInterval(update, 60000);
        }

        function setupTheme() {
            if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
            DOMElements.themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark');
                localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            });
        }

        function setupEventListeners() {
            DOMElements.saveRecordBtn.addEventListener('click', saveJobSheet);
            DOMElements.newJobBtn.addEventListener('click', clearJobSheetForm);
            DOMElements.saveOutwardBtn.addEventListener('click', saveOutwardRecord);
            DOMElements.cancelOutwardEditBtn.addEventListener('click', clearOutwardForm);
            DOMElements.logoutBtn.addEventListener('click', () => auth.signOut());
            DOMElements.allJobsSearchBox.addEventListener('input', handleAllJobsSearch);
            DOMElements.inwardOutwardSearchBox.addEventListener('input', handleOutwardSearch);
            DOMElements.downloadExcelBtn.addEventListener('click', downloadJobsAsExcel);
            DOMElements.downloadInwardOutwardExcelBtn.addEventListener('click', downloadInwardOutwardAsExcel);
            setupAutocomplete(DOMElements.brandName, brandSuggestions);
            setupAutocomplete(DOMElements.partyName, partySuggestions);
        }

        function populateSelects() {
            populateOptions(DOMElements.deviceType, deviceTypeOptions, "Select Device Type");
            populateOptions(DOMElements.currentStatus, currentStatusOptions, "Select Current Status");
            populateOptions(DOMElements.finalStatus, finalStatusOptions, "Select Final Status");
            populateOptions(DOMElements.customerStatus, customerStatusOptions, "Select Customer Status");
        }

        function populateOptions(select, options, defaultText) {
            select.innerHTML = `<option disabled selected value="">${defaultText}</option>`;
            options.forEach(o => select.innerHTML += `<option value="${o}">${o}</option>`);
        }

        function populateCheckboxes() {
            DOMElements.reportedProblems.innerHTML = problemOptions.map(p => `<div><input type="checkbox" id="problem-${p.replace(/\s+/g, '-')}" value="${p}"><label for="problem-${p.replace(/\s+/g, '-')}">${p}</label></div>`).join('');
        }

        function setInitialDate() {
            const today = new Date().toISOString().split('T')[0];
            DOMElements.date.value = today;
            DOMElements.outwardDate.value = today;
        }

        async function loadInitialData() {
            db.collection("jobSheets").orderBy("jobSheetNo", "desc").onSnapshot(snap => {
                allJobSheets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                updateDashboardStats();
                handleAllJobsSearch();
            });

            db.collection("jobSheets").orderBy("updatedAt", "desc").limit(5).onSnapshot(snap => {
                const recentJobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderRecentJobsTable(recentJobs);
            });

            db.collection("outwardJobs").orderBy("outwardDate", "desc").onSnapshot(snap => {
                allOutwardRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                updateDashboardStats();
                handleOutwardSearch();
            });

            brandSuggestions = await loadSuggestions('brands', initialBrandOptions);
            partySuggestions = await loadSuggestions('parties', initialPartyOptions);
        }
        
        async function loadSuggestions(collectionName, initialArray) {
            const snapshot = await db.collection(collectionName).get();
            const dbSuggestions = snapshot.docs.map(doc => doc.data().name);
            return [...new Set([...initialArray, ...dbSuggestions])];
        }

        function updateDashboardStats() {
            DOMElements.totalJobsStat.textContent = allJobSheets.length;
            DOMElements.pendingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Pending Diagnosis').length;
            DOMElements.workingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Working').length;
            DOMElements.deliveredJobsStat.textContent = allJobSheets.filter(j => j.finalStatus === 'Delivered').length;
            
            const pendingInwards = allOutwardRecords.filter(r => !r.inwardDate);
            DOMElements.pendingInwardStat.textContent = pendingInwards.length;
            DOMElements.rahulSirPendingStat.textContent = pendingInwards.filter(r => r.partyName === 'Rahul Sir').length;
        }

        function renderRecentJobsTable(jobs) {
            DOMElements.recentJobsTableBody.innerHTML = jobs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 1rem;">No recent activity.</td></tr>` :
            jobs.map(job => `
                <tr>
                    <td>${job.jobSheetNo}</td>
                    <td title="${job.customerName}">${job.customerName}</td>
                    <td title="${job.deviceType}">${job.deviceType}</td>
                    <td>${job.currentStatus}</td>
                    <td>${formatTimestamp(job.updatedAt)}</td>
                    <td class="table-actions">
                        <button title="Edit" onclick="window.app.editJob('${job.id}')">✏️</button>
                        <button title="Delete" class="delete-btn" onclick="window.app.deleteJob('${job.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
        }

        function renderAllJobsTable() {
            const startIndex = (allJobsCurrentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = filteredJobs.slice(startIndex, endIndex);

            DOMElements.allJobsTableBody.innerHTML = pageItems.map(job => `
                <tr>
                    <td>${job.jobSheetNo}</td>
                    <td>${formatDate(job.date)}</td>
                    <td title="${job.customerName}">${job.customerName}</td>
                    <td title="${job.customerMobile}">${job.customerMobile}</td>
                    <td title="${job.deviceType}">${job.deviceType}</td>
                    <td>${job.currentStatus}</td>
                    <td class="table-actions">
                        <button title="Edit" onclick="window.app.editJob('${job.id}')">✏️</button>
                        <button title="Delete" class="delete-btn" onclick="window.app.deleteJob('${job.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
            renderPagination(DOMElements.allJobsPagination, filteredJobs.length, allJobsCurrentPage, 'changeAllJobsPage');
        }

        function handleAllJobsSearch() {
            const term = DOMElements.allJobsSearchBox.value.toLowerCase();
            filteredJobs = !term ? allJobSheets : allJobSheets.filter(job =>
                Object.values(job).some(val => String(val).toLowerCase().includes(term))
            );
            allJobsCurrentPage = 1;
            renderAllJobsTable();
        }

        function changeAllJobsPage(direction) {
            const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
            allJobsCurrentPage += direction;
            if (allJobsCurrentPage < 1) allJobsCurrentPage = 1;
            if (allJobsCurrentPage > totalPages) allJobsCurrentPage = totalPages;
            renderAllJobsTable();
        }

        function clearJobSheetForm() {
            currentEditingJobId = null;
            const fieldsToClear = [DOMElements.jobSheetNo, DOMElements.oldJobSheetNo, DOMElements.customerName, DOMElements.customerMobile, DOMElements.altMobile, DOMElements.brandName, DOMElements.accessories, DOMElements.estimateAmount];
            fieldsToClear.forEach(el => el.value = '');
            [DOMElements.deviceType, DOMElements.currentStatus, DOMElements.finalStatus, DOMElements.customerStatus].forEach(el => el.selectedIndex = 0);
            document.querySelectorAll('#reported-problems input').forEach(cb => cb.checked = false);
            DOMElements.engineerKundan.checked = false; DOMElements.engineerRushi.checked = false;
            setInitialDate();
            DOMElements.saveRecordBtn.textContent = 'Save Record';
            DOMElements.saveRecordBtn.classList.remove('update-btn');
        }

        async function saveJobSheet() {
            const engineers = [];
            if (DOMElements.engineerKundan.checked) engineers.push("Kundan Sir");
            if (DOMElements.engineerRushi.checked) engineers.push("Rushi");

            const jobData = {
                jobSheetNo: Number(DOMElements.jobSheetNo.value.trim() || 0),
                oldJobSheetNo: DOMElements.oldJobSheetNo.value.trim(),
                date: DOMElements.date.value, customerName: DOMElements.customerName.value.trim(),
                customerMobile: DOMElements.customerMobile.value.trim(), altMobile: DOMElements.altMobile.value.trim(),
                deviceType: DOMElements.deviceType.value, brandName: DOMElements.brandName.value.trim(),
                reportedProblems: Array.from(document.querySelectorAll('#reported-problems input:checked')).map(cb => cb.value),
                accessories: DOMElements.accessories.value.trim(), currentStatus: DOMElements.currentStatus.value,
                finalStatus: DOMElements.finalStatus.value, customerStatus: DOMElements.customerStatus.value,
                estimateAmount: parseFloat(DOMElements.estimateAmount.value) || 0,
                engineers: engineers,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!jobData.jobSheetNo || !jobData.customerName || !jobData.customerMobile) { alert("Job Sheet No, Customer Name, and Mobile are required."); return; }

            try {
                if (currentEditingJobId) {
                    await db.collection("jobSheets").doc(currentEditingJobId).update(jobData);
                    showSuccessModal("Record Updated!");
                } else {
                    jobData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection("jobSheets").add(jobData);
                    showSuccessModal("Record Saved!");
                }
                await addSuggestion(jobData.brandName, 'brands', brandSuggestions);
                clearJobSheetForm();
                document.querySelector('.nav-link[data-page="dashboard"]').click();
            } catch (error) { console.error("Error saving job sheet: ", error); alert("Error saving record."); }
        }

        function editJob(id) {
            const job = allJobSheets.find(j => j.id === id);
            if (!job) return;
            currentEditingJobId = id;
            Object.keys(job).forEach(key => {
                if(DOMElements[key] && DOMElements[key].tagName !== 'DIV') {
                    DOMElements[key].value = job[key];
                }
            });
            document.querySelectorAll('#reported-problems input').forEach(cb => { cb.checked = job.reportedProblems?.includes(cb.value); });
            DOMElements.engineerKundan.checked = job.engineers?.includes("Kundan Sir") || false;
            DOMElements.engineerRushi.checked = job.engineers?.includes("Rushi") || false;
            DOMElements.saveRecordBtn.textContent = 'Update Record';
            DOMElements.saveRecordBtn.classList.add('update-btn');
            document.querySelector('.nav-link[data-page="job-sheet"]').click();
        }

        async function deleteJob(id) {
            if (confirm("Delete this job sheet?")) {
                await db.collection("jobSheets").doc(id).delete();
                showSuccessModal("Job Sheet Deleted!");
            }
        }
        
        function renderOutwardTable() {
            const startIndex = (outwardCurrentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = filteredOutwards.slice(startIndex, endIndex);

            DOMElements.outwardRecordsTableBody.innerHTML = pageItems.map(r => `
                <tr>
                    <td title="${r.partyName}">${r.partyName}</td>
                    <td title="${r.material}">${r.material}</td>
                    <td>${formatDate(r.outwardDate)}</td>
                    <td>${r.inwardDate ? formatDate(r.inwardDate) : 'Pending'}</td>
                    <td class="table-actions">
                        <button title="Edit" onclick="window.app.editOutward('${r.id}')">✏️</button>
                        <button class="delete-btn" title="Delete" onclick="window.app.deleteOutward('${r.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
            renderPagination(DOMElements.inwardOutwardPagination, filteredOutwards.length, outwardCurrentPage, 'changeOutwardPage');
        }

        function handleOutwardSearch() {
            const term = DOMElements.inwardOutwardSearchBox.value.toLowerCase();
            filteredOutwards = !term ? allOutwardRecords : allOutwardRecords.filter(r =>
                (r.partyName && r.partyName.toLowerCase().includes(term)) ||
                (r.material && r.material.toLowerCase().includes(term))
            );
            outwardCurrentPage = 1;
            renderOutwardTable();
        }

        function changeOutwardPage(direction) {
            const totalPages = Math.ceil(filteredOutwards.length / itemsPerPage);
            outwardCurrentPage += direction;
            if (outwardCurrentPage < 1) outwardCurrentPage = 1;
            if (outwardCurrentPage > totalPages) outwardCurrentPage = totalPages;
            renderOutwardTable();
        }

        function clearOutwardForm() {
            currentEditingOutwardId = null;
            DOMElements.outwardFormTitle.textContent = 'New Outward Entry';
            DOMElements.saveOutwardBtn.textContent = 'Save Record';
            DOMElements.saveOutwardBtn.classList.remove('update-btn');
            DOMElements.cancelOutwardEditBtn.style.display = 'none';
            [DOMElements.partyName, DOMElements.materialDesc, DOMElements.inwardDate].forEach(el => el.value = '');
            setInitialDate();
        }

        async function saveOutwardRecord() {
            const recordData = {
                partyName: DOMElements.partyName.value.trim(), material: DOMElements.materialDesc.value.trim(),
                outwardDate: DOMElements.outwardDate.value, inwardDate: DOMElements.inwardDate.value || null,
            };
            if (!recordData.partyName || !recordData.material) { alert("Party Name and Material are required."); return; }
            try {
                if (currentEditingOutwardId) {
                    await db.collection("outwardJobs").doc(currentEditingOutwardId).update(recordData);
                    showSuccessModal("Outward Record Updated!");
                } else {
                    await db.collection("outwardJobs").add(recordData);
                    showSuccessModal("Outward Record Saved!");
                }
                await addSuggestion(recordData.partyName, 'parties', partySuggestions);
                clearOutwardForm();
            } catch (error) { console.error("Error saving outward record: ", error); }
        }

        function editOutward(id) {
            const record = allOutwardRecords.find(r => r.id === id);
            if (!record) return;
            currentEditingOutwardId = id;
            DOMElements.outwardFormTitle.textContent = 'Edit Outward Entry';
            DOMElements.partyName.value = record.partyName; DOMElements.materialDesc.value = record.material;
            DOMElements.outwardDate.value = record.outwardDate; DOMElements.inwardDate.value = record.inwardDate || '';
            DOMElements.saveOutwardBtn.textContent = 'Update Record';
            DOMElements.saveOutwardBtn.classList.add('update-btn');
            DOMElements.cancelOutwardEditBtn.style.display = 'block';
        }

        async function deleteOutward(id) {
            if (confirm("Delete this outward record?")) {
                await db.collection("outwardJobs").doc(id).delete();
                showSuccessModal("Outward Record Deleted!");
            }
        }

        function renderPagination(container, totalItems, currentPage, handlerName) {
            if (totalItems <= itemsPerPage) { container.innerHTML = ''; return; }
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, totalItems);
            
            container.innerHTML = `
                <span class="pagination-info">${startItem}-${endItem} of ${totalItems}</span>
                <button class="action-btn secondary-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.app.${handlerName}(-1)">Previous</button>
                <button class="action-btn secondary-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.app.${handlerName}(1)">Next</button>
            `;
        }

        function formatTimestamp(timestamp) {
            if (!timestamp || !timestamp.toDate) return 'N/A';
            const date = timestamp.toDate();
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const correctedDate = new Date(date.getTime() + userTimezoneOffset);
            const day = String(correctedDate.getDate()).padStart(2, '0');
            const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
            const year = correctedDate.getFullYear();
            return `${day}-${month}-${year}`;
        }

        async function addSuggestion(value, collectionName, suggestionsArray) {
            const trimmedValue = value.trim();
            if (trimmedValue && !suggestionsArray.some(s => s.toLowerCase() === trimmedValue.toLowerCase())) {
                try {
                    await db.collection(collectionName).doc(trimmedValue.toLowerCase()).set({ name: trimmedValue });
                    suggestionsArray.push(trimmedValue);
                } catch (e) { console.error("Error adding suggestion:", e); }
            }
        }

        function setupAutocomplete(input, suggestionsArray) {
            let container = document.createElement('div');
            container.className = 'autocomplete-items';
            input.parentNode.appendChild(container);
            input.addEventListener('input', () => {
                container.innerHTML = !input.value ? '' : suggestionsArray
                    .filter(item => item.toLowerCase().includes(input.value.toLowerCase()))
                    .map(item => `<div data-value="${item}">${item}</div>`).join('');
            });
            container.addEventListener('click', e => { if (e.target.dataset.value) { input.value = e.target.dataset.value; container.innerHTML = ''; } });
            document.addEventListener('click', e => { if (e.target !== input) container.innerHTML = ''; });
        }

        function showSuccessModal(message) {
            const modal = document.getElementById('success-modal');
            document.getElementById('success-message').textContent = message;
            modal.classList.add('visible');
            setTimeout(() => modal.classList.remove('visible'), 2000);
        }

        function downloadJobsAsExcel() {
            const dataToExport = allJobSheets.map(job => ({
                "Job No": job.jobSheetNo, "Old Job No": job.oldJobSheetNo, "Date": formatDate(job.date),
                "Customer Name": job.customerName, "Mobile": job.customerMobile, "Alt Mobile": job.altMobile,
                "Device Type": job.deviceType, "Brand": job.brandName, "Problems": job.reportedProblems.join(', '),
                "Accessories": job.accessories, "Current Status": job.currentStatus, "Final Status": job.finalStatus,
                "Customer Status": job.customerStatus, "Engineer(s)": job.engineers ? job.engineers.join(', ') : '',
                "Estimate Amount": job.estimateAmount,
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobSheets");
            XLSX.writeFile(workbook, "Korus_Job_Sheets.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        function downloadInwardOutwardAsExcel() {
            const dataToExport = allOutwardRecords.map(r => ({
                "Party Name": r.partyName, "Material": r.material, "Outward Date": formatDate(r.outwardDate),
                "Inward Date": r.inwardDate ? formatDate(r.inwardDate) : 'Pending',
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "InwardOutward");
            XLSX.writeFile(workbook, "Korus_Inward_Outward.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        window.app = { editJob, deleteJob, editOutward, deleteOutward, changeAllJobsPage, changeOutwardPage };
        init();
    }
});
