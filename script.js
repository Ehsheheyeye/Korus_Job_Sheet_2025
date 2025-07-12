document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyCGVEkMAIcK1u2vrA20GPXKDvCZl6an_XM",
        authDomain: "korus-computer-jobs-eb87a.firebaseapp.com",
        projectId: "korus-computer-jobs-eb87a",
        storageBucket: "korus-computer-jobs-eb87a.firebasestorage.app",
        messagingSenderId: "298166399936",
        appId: "1:298166399936:web:842d18f13383597d290e25",
        measurementId: "G-1CPWT857ES"
    };

    // --- Initialize Firebase ---
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- Global State ---
    let currentEditingJobId = null;
    let currentEditingOutwardId = null;
    let allJobSheets = [];
    let allOutwardRecords = [];
    
    // --- Pre-populated Data ---
    const initialBrandOptions = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Intex", "I-Ball", "Artist", "Lapcare", "EVM", "Crucial", "Logitech", "Apple (MacBook)", "MSI", "Samsung", "Avita", "Fujitsu", "LG", "Toshiba", "HCL", "Redmi", "Sony", "OnePlus", "TCL", "Panasonic", "Sansui", "BenQ", "Zebronics", "ViewSonic", "AOC", "Philips", "Gigabyte", "Cooler Master", "Foxin", "Western Digital (WD)", "Seagate", "Kingston", "XPG", "ADATA", "SanDisk", "Intel", "Ant Esports", "Antec", "Deepcool", "Circle", "Frontech", "Enter", "Canon", "Epson", "Brother", "TVS", "Zebra", "Xerox", "Kyocera", "Ricoh", "Pantum", "Delta", "Vertiv", "12A", "88A", "78A", "925A", "337A", "ProDot"];
    const initialPartyOptions = ["Rahul Sir", "Shree Enterprises", "San infotech", "Audio video care", "Rx service centre", "Nate", "DSK", "Crucial service centre", "Rashi Peripheral", "SR enterprises", "Cache technology", "perfect computers", "EVM service centre", "navkar enterprises"];
    let brandSuggestions = [...initialBrandOptions];
    let partySuggestions = [...initialPartyOptions];

    const problemOptions = ["Formatting", "Dead / No Power", "No Display", "Software Installation", "Dump error", "Beep Sound", "Refiling", "Battery issue", "HDD / SSD issue", "Screen Issue", "Booting issue", "Head block", "Paper Jam", "Repairing", "Replacement"];
    const deviceTypeOptions = ["CPU", "Laptop", "Printer", "All-in-One", "Toner", "UPS", "Speaker", "Monitor", "TV", "Charger", "CCTV", "DVR", "NVR", "Projector", "Attendence Device", "Keyboard", "Mouse", "Combo", "Motherboard", "RAM", "HDD", "SSD", "Battery", "Switch", "Cables", "SMPS", "Router", "Wifi Adaptor", "Converter", "Enternal HDD", "Adaptor", "UPS Battery"];
    const currentStatusOptions = ["Pending Diagnosis", "Working", "Repaired", "Water Damaged", "Awaiting Approval", "Software Issue", "Data issue", "Hardware Issue", "Given for Replacement"];
    const finalStatusOptions = ["Not Delivered", "Delivered"];
    const customerStatusOptions = ["Not Called", "Called", "Called - No Response", "Called - Will Visit", "Called - Not pickup yet"];

    // --- Element Selectors ---
    const DOMElements = {
        menuBtn: document.getElementById('menu-btn'), sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'), sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
        mobilePageTitle: document.getElementById('mobile-page-title'),
        themeToggle: document.getElementById('theme-toggle'),
        // Job Sheet Form
        jobSheetNo: document.getElementById('job-sheet-no'), oldJobSheetNo: document.getElementById('old-job-sheet-no'),
        date: document.getElementById('date'), customerName: document.getElementById('customer-name'),
        customerMobile: document.getElementById('customer-mobile'), altMobile: document.getElementById('alt-mobile'),
        deviceType: document.getElementById('device-type'), brandName: document.getElementById('brand-name'),
        reportedProblems: document.getElementById('reported-problems'), accessories: document.getElementById('accessories'),
        currentStatus: document.getElementById('current-status'), finalStatus: document.getElementById('final-status'),
        customerStatus: document.getElementById('customer-status'), estimateAmount: document.getElementById('estimate-amount'),
        saveRecordBtn: document.getElementById('save-record-btn'), newJobBtn: document.getElementById('new-job-btn'),
        // Dashboard
        totalJobsStat: document.getElementById('total-jobs-stat'), pendingJobsStat: document.getElementById('pending-jobs-stat'),
        workingJobsStat: document.getElementById('working-jobs-stat'), deliveredJobsStat: document.getElementById('delivered-jobs-stat'),
        pendingInwardStat: document.getElementById('pending-inward-stat'),
        recentJobsTableBody: document.getElementById('recent-jobs-table-body'),
        // All Jobs Page
        allJobsSearchBox: document.getElementById('all-jobs-search-box'), downloadExcelBtn: document.getElementById('download-excel-btn'),
        allJobsTableBody: document.getElementById('all-jobs-table-body'),
        // Inward/Outward
        outwardFormTitle: document.getElementById('outward-form-title'), partyName: document.getElementById('party-name'),
        materialDesc: document.getElementById('material-desc'), outwardDate: document.getElementById('outward-date'),
        inwardDate: document.getElementById('inward-date'), saveOutwardBtn: document.getElementById('save-outward-btn'),
        cancelOutwardEditBtn: document.getElementById('cancel-outward-edit-btn'),
        outwardRecordsTableBody: document.getElementById('outward-records-table-body'),
        inwardOutwardSearchBox: document.getElementById('inward-outward-search-box'),
        downloadInwardOutwardExcelBtn: document.getElementById('download-inward-outward-excel-btn'),
    };
    
    // --- Application Initialization ---
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

    // --- Setup Functions ---
    function setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`${page}-page`).classList.add('active');
                
                // Update mobile header title and close sidebar
                DOMElements.mobilePageTitle.textContent = link.querySelector('span').textContent;
                document.body.classList.remove('sidebar-open');
            });
        });
        
        // Mobile sidebar toggle
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
        setInterval(update, 60000); // Update every minute
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
        DOMElements.date.value = new Date().toISOString().split('T')[0];
        DOMElements.outwardDate.value = new Date().toISOString().split('T')[0];
    }

    // --- Data Loading & Handling ---
    async function loadInitialData() {
        db.collection("jobSheets").orderBy("date", "desc").onSnapshot(snap => {
            allJobSheets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateDashboard();
            renderAllJobsTable(allJobSheets);
        });

        db.collection("outwardJobs").orderBy("outwardDate", "desc").onSnapshot(snap => {
            allOutwardRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateDashboard();
            renderOutwardTable(allOutwardRecords);
        });

        brandSuggestions = await loadSuggestions('brands', initialBrandOptions);
        partySuggestions = await loadSuggestions('parties', initialPartyOptions);
    }
    
    async function loadSuggestions(collectionName, initialArray) {
        const snapshot = await db.collection(collectionName).get();
        const dbSuggestions = snapshot.docs.map(doc => doc.data().name);
        return [...new Set([...initialArray, ...dbSuggestions])];
    }

    // --- Dashboard & All Jobs Logic ---
    function updateDashboard() {
        DOMElements.totalJobsStat.textContent = allJobSheets.length;
        DOMElements.pendingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Pending Diagnosis').length;
        DOMElements.workingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Working').length;
        DOMElements.deliveredJobsStat.textContent = allJobSheets.filter(j => j.finalStatus === 'Delivered').length;
        DOMElements.pendingInwardStat.textContent = allOutwardRecords.filter(r => !r.inwardDate).length;
        
        renderRecentJobsTable(allJobSheets.slice(0, 5));
    }
    
    function renderRecentJobsTable(jobs) {
        DOMElements.recentJobsTableBody.innerHTML = jobs.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding: 1rem;">No jobs found.</td></tr>` : 
        jobs.map(job => `<tr><td>${job.jobSheetNo}</td><td>${job.customerName}</td><td>${job.deviceType}</td><td>${job.currentStatus}</td><td class="table-actions"><button title="Edit" onclick="window.app.editJob('${job.id}')">✏️</button><button title="Delete" class="delete-btn" onclick="window.app.deleteJob('${job.id}')">🗑️</button></td></tr>`).join('');
    }

    function renderAllJobsTable(jobs) {
        DOMElements.allJobsTableBody.innerHTML = jobs.map(job => `
            <tr>
                <td>${job.jobSheetNo}</td>
                <td>${formatDate(job.date)}</td>
                <td>${job.customerName}</td>
                <td>${job.customerMobile}</td>
                <td>${job.deviceType}</td>
                <td>${job.currentStatus}</td>
                <td class="table-actions">
                    <button title="Edit" onclick="window.app.editJob('${job.id}')">✏️</button>
                    <button title="Delete" class="delete-btn" onclick="window.app.deleteJob('${job.id}')">🗑️</button>
                </td>
            </tr>`).join('');
    }
    
    function handleAllJobsSearch() {
        const term = DOMElements.allJobsSearchBox.value.toLowerCase();
        const filtered = !term ? allJobSheets : allJobSheets.filter(job => 
            Object.values(job).some(val => String(val).toLowerCase().includes(term))
        );
        renderAllJobsTable(filtered);
    }

    // --- Job Sheet Form Logic ---
    function clearJobSheetForm() {
        currentEditingJobId = null;
        const fieldsToClear = [DOMElements.jobSheetNo, DOMElements.oldJobSheetNo, DOMElements.customerName, DOMElements.customerMobile, DOMElements.altMobile, DOMElements.brandName, DOMElements.accessories, DOMElements.estimateAmount];
        fieldsToClear.forEach(el => el.value = '');
        [DOMElements.deviceType, DOMElements.currentStatus, DOMElements.finalStatus, DOMElements.customerStatus].forEach(el => el.selectedIndex = 0);
        document.querySelectorAll('#reported-problems input').forEach(cb => cb.checked = false);
        setInitialDate();
        DOMElements.saveRecordBtn.textContent = 'Save Record';
        DOMElements.saveRecordBtn.classList.remove('update-btn');
    }

    async function saveJobSheet() {
        const jobData = {
            jobSheetNo: DOMElements.jobSheetNo.value.trim(), oldJobSheetNo: DOMElements.oldJobSheetNo.value.trim(),
            date: DOMElements.date.value, customerName: DOMElements.customerName.value.trim(),
            customerMobile: DOMElements.customerMobile.value.trim(), altMobile: DOMElements.altMobile.value.trim(),
            deviceType: DOMElements.deviceType.value, brandName: DOMElements.brandName.value.trim(),
            reportedProblems: Array.from(document.querySelectorAll('#reported-problems input:checked')).map(cb => cb.value),
            accessories: DOMElements.accessories.value.trim(), currentStatus: DOMElements.currentStatus.value,
            finalStatus: DOMElements.finalStatus.value, customerStatus: DOMElements.customerStatus.value,
            estimateAmount: parseFloat(DOMElements.estimateAmount.value) || 0
        };

        if (!jobData.jobSheetNo || !jobData.customerName || !jobData.customerMobile) { alert("Job Sheet No, Customer Name, and Mobile are required."); return; }

        try {
            if (currentEditingJobId) {
                await db.collection("jobSheets").doc(currentEditingJobId).update(jobData);
                showSuccessModal("Record Updated!");
            } else {
                jobData.createdAt = new Date();
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
        Object.keys(DOMElements).forEach(key => { if(job[key] !== undefined && DOMElements[key]?.tagName !== 'DIV') DOMElements[key].value = job[key] });
        document.querySelectorAll('#reported-problems input').forEach(cb => { cb.checked = job.reportedProblems?.includes(cb.value); });
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
    
    // --- Inward/Outward Logic ---
    function clearOutwardForm() {
        currentEditingOutwardId = null;
        DOMElements.outwardFormTitle.textContent = 'New Outward Entry';
        DOMElements.saveOutwardBtn.textContent = 'Save Record';
        DOMElements.saveOutwardBtn.classList.remove('update-btn');
        DOMElements.cancelOutwardEditBtn.style.display = 'none';
        [DOMElements.partyName, DOMElements.materialDesc, DOMElements.inwardDate].forEach(el => el.value = '');
        DOMElements.outwardDate.value = new Date().toISOString().split('T')[0];
    }
    
    function renderOutwardTable(records) {
        DOMElements.outwardRecordsTableBody.innerHTML = records.map(r => `
            <tr>
                <td>${r.partyName}</td>
                <td>${r.material}</td>
                <td>${formatDate(r.outwardDate)}</td>
                <td>${r.inwardDate ? formatDate(r.inwardDate) : 'Pending'}</td>
                <td class="table-actions">
                    <button title="Edit" onclick="window.app.editOutward('${r.id}')">✏️</button>
                    <button class="delete-btn" title="Delete" onclick="window.app.deleteOutward('${r.id}')">🗑️</button>
                </td>
            </tr>`).join('');
    }

    function handleOutwardSearch() {
        const term = DOMElements.inwardOutwardSearchBox.value.toLowerCase();
        const filtered = !term ? allOutwardRecords : allOutwardRecords.filter(r => r.partyName.toLowerCase().includes(term) || r.material.toLowerCase().includes(term));
        renderOutwardTable(filtered);
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
        DOMElements.partyName.value = record.partyName;
        DOMElements.materialDesc.value = record.material;
        DOMElements.outwardDate.value = record.outwardDate;
        DOMElements.inwardDate.value = record.inwardDate || '';
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

    // --- Utility & Helper Functions ---
    function formatDate(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
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
            "Customer Status": job.customerStatus, "Estimate Amount": job.estimateAmount,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "JobSheets");
        XLSX.writeFile(workbook, "Korus_Job_Sheets.xlsx");
        showSuccessModal("Downloading Excel file...");
    }

    function downloadInwardOutwardAsExcel() {
        const dataToExport = allOutwardRecords.map(r => ({
            "Party Name": r.partyName,
            "Material": r.material,
            "Outward Date": formatDate(r.outwardDate),
            "Inward Date": r.inwardDate ? formatDate(r.inwardDate) : 'Pending',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "InwardOutward");
        XLSX.writeFile(workbook, "Korus_Inward_Outward.xlsx");
        showSuccessModal("Downloading Excel file...");
    }


    // --- Expose functions to global scope ---
    window.app = { editJob, deleteJob, editOutward, deleteOutward };

    // --- Start the App ---
    init();
});
