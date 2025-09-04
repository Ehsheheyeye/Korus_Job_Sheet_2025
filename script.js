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
        let allInOutCurrentPage = 1;
        const itemsPerPage = 10;
        let currentJobRangeFilter = 'all'; 
        let tempDeviceProblems = {}; // Holds problems for devices before saving

        // --- Pre-populated Data ---
        const initialBrandOptions = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Intex", "I-Ball", "Artist", "Lapcare", "EVM", "Crucial", "Logitech", "Apple (MacBook)", "MSI", "Samsung", "Avita", "Fujitsu", "LG", "Toshiba", "HCL", "Redmi", "Sony", "OnePlus", "TCL", "Panasonic", "Sansui", "BenQ", "Zebronics", "ViewSonic", "AOC", "Philips", "Gigabyte", "Cooler Master", "Foxin", "Western Digital (WD)", "Seagate", "Kingston", "XPG", "ADATA", "SanDisk", "Intel", "Ant Esports", "Antec", "Deepcool", "Circle", "Frontech", "Enter", "Canon", "Epson", "Brother", "TVS", "Zebra", "Xerox", "Kyocera", "Ricoh", "Pantum", "Delta", "Vertiv", "12A", "88A", "78A", "925A", "337A", "ProDot"];
        const initialPartyOptions = ["Rahul Sir", "Shree Enterprises", "San infotech", "Audio video care", "Rx service centre", "Nate", "DSK", "Crucial service centre", "Rashi Peripheral", "SR enterprises", "Cache technology", "perfect computers", "EVM service centre", "navkar enterprises"];
        const initialPartNames = ["SSD", "RAM", "Keyboard", "Battery", "Screen", "Toner", "Motherboard", "Adapter", "CPU Fan"];
        
        let brandSuggestions = [...initialBrandOptions];
        let partySuggestions = [...initialPartyOptions];
        let partNameSuggestions = [...initialPartNames];

        const problemOptionsConfig = {
            "General": {
                problems: ["Dead / No Power", "No Display", "Moulding / ABH", "HDD / SSD Issue", "Data Backup", "Password Crack / Reset", "OS Recovery", "Hang / Stuck Issue", "Overheating", "RAM Issue", "Keyboard / Touchpad", "Battery Issue", "Screen Issue", "Booting Issue", "Dump Error", "Beep Sound", "Other"]
            },
            "Formatting": {
                subOptions: ["Windows 7", "Windows 8", "Windows 10", "Windows 11", "Windows XP", "Ubantu", "Mac OS", "Other"],
                subOptionType: "checkbox", subOptionLabel: "Select OS"
            },
            "Software Installation": {
                subOptions: ["AutoCAD", "CATIA", "SolidWorks", "PowerMill", "CoralDraw", "SolidEdge", "Premiere Pro", "After Effect", "MasterCam", "SketchUp", "Photoshop", "MS Office", "Tally Prime", "Tally ERP9", "Siemens NX", "PTC Creo", "Revit", "Illustrator", "3ds Max", "Maya", "ISM", "Other"],
                subOptionType: "checkbox", subOptionLabel: "Select Software"
            },
            "Toner Refill": {
                subOptions: ["12A", "88A", "337A", "285A", "78A", "925A", "TN-1020", "Samsung", "Ricoh", "Pantum", "Xerox", "Other"],
                subOptionType: "checkbox", subOptionLabel: "Select Toner Model"
            },
            "Antivirus": {
                subOptions: ["Quick Heal", "NPAV", "Bitdefender", "Other"],
                subOptionType: "select", subOptionLabel: "Select Antivirus"
            },
            "Printer Problem": {
                subOptions: ["Paper Jam", "Head Cleaning", "Servicing", "Head Block", "Low Ink/Toner", "Slow Printing", "Faded Printouts", "Strange Noises", "Blank Pages Printing", "Paper Misfeed", "Scanner Not Working", "Other"],
                subOptionType: "select", subOptionLabel: "Select Printer Issue"
            },
            "Hardware Issue": {
                subOptions: [ "Mic Not Working", "Camera Not Working", "USB Port Issue", "DC Jack Issue", "Speaker Issue", "SMPS Issue", "CPU Fan Issue", "WiFi Not Working", "LAN Port Issue", "HDMI / VGA Port Issue", "BIOS Current", "CMOS Issue", "Auto Shutdown", "Auto Restart", "Bluetooth Issue", "Power Button Issue", "Other"],
                subOptionType: "select", subOptionLabel: "Select Hardware Issue"
            },
        };

        const deviceTypeOptions = ["CPU", "Laptop", "Printer", "All-in-One", "Toner", "UPS", "Speaker", "Monitor", "TV", "Charger", "CCTV", "DVR", "NVR", "Projector", "Attendence Device", "Keyboard", "Mouse", "Combo", "Motherboard", "RAM", "HDD", "SSD", "Battery", "Switch", "Cables", "SMPS", "Router", "Wifi Adaptor", "Converter", "Enternal HDD", "Adaptor", "UPS Battery"];
        const currentStatusOptions = ["Pending Diagnosis", "Working", "Repaired", "Water Damaged", "Awaiting Approval", "Software Issue", "Data issue", "Hardware Issue", "Given for Replacement", "Ready", "Dead"];
        const finalStatusOptions = ["Not Delivered", "Delivered", "Returned"];
        const customerStatusOptions = ["Not Called", "Called", "Called - No Response", "Called - Will Visit", "Called - Not pickup yet"];
        const materialStatusOptions = ["Installed", "Ordered", "Pending", "Customer Provided", "Not Available"];

        // --- Element Selectors ---
        const DOMElements = {
            // Layout
            menuBtn: document.getElementById('menu-btn'), sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebar-overlay'), sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
            mobilePageTitle: document.getElementById('mobile-page-title'),
            desktopPageTitle: document.getElementById('desktop-page-title'), themeToggle: document.getElementById('theme-toggle'),
            logoutBtn: document.getElementById('logout-btn'),

            // Job Sheet Form
            jobSheetPage: document.getElementById('job-sheet-page'),
            jobSheetNo: document.getElementById('job-sheet-no'), oldJobSheetNo: document.getElementById('old-job-sheet-no'),
            date: document.getElementById('date'), customerName: document.getElementById('customer-name'),
            customerMobile: document.getElementById('customer-mobile'), altMobile: document.getElementById('alt-mobile'),
            devicesTableBody: document.getElementById('devices-table-body'), addDeviceBtn: document.getElementById('add-device-btn'),
            serviceNote: document.getElementById('service-note'),
            materialsTableBody: document.getElementById('materials-table-body'), addMaterialBtn: document.getElementById('add-material-btn'),
            currentStatus: document.getElementById('current-status'), finalStatus: document.getElementById('final-status'),
            customerStatus: document.getElementById('customer-status'),
            estimateAmount: document.getElementById('estimate-amount'),
            engineerKundan: document.getElementById('engineer-kundan'), engineerRushi: document.getElementById('engineer-rushi'),
            engineerSachin: document.getElementById('engineer-sachin'),
            saveRecordBtn: document.getElementById('save-record-btn'), sendWhatsAppBtn: document.getElementById('send-whatsapp-btn'),
            newJobBtn: document.getElementById('new-job-btn'),

            // Dashboard
            totalJobsStat: document.getElementById('total-jobs-stat'), pendingJobsStat: document.getElementById('pending-jobs-stat'),
            workingJobsStat: document.getElementById('working-jobs-stat'), deliveredJobsStat: document.getElementById('delivered-jobs-stat'),
            notDeliveredJobsStat: document.getElementById('not-delivered-jobs-stat'),
            pendingInwardStat: document.getElementById('pending-inward-stat'),
            rahulSirPendingStat: document.getElementById('rahul-sir-pending-stat'),
            recentJobsTableBody: document.getElementById('recent-jobs-table-body'),

            // All Jobs Page
            jobSheetHeaderActions: document.getElementById('job-sheet-header-actions'), allJobsHeaderActions: document.getElementById('all-jobs-header-actions'),
            jobNoSearchBox: document.getElementById('job-no-search-box'), mobileNoSearchBox: document.getElementById('mobile-no-search-box'),
            downloadExcelBtn: document.getElementById('download-excel-btn'), allJobsTableBody: document.getElementById('all-jobs-table-body'),
            allJobsPagination: document.getElementById('all-jobs-pagination'),
            filterToggleBtn: document.getElementById('filter-toggle-btn'), filterPopup: document.getElementById('job-range-filters'),
            filterBtnLabel: document.getElementById('filter-btn-label'),
            
            // Inward/Outward
            outwardFormTitle: document.getElementById('outward-form-title'), partyName: document.getElementById('party-name'),
            addPartyBtn: document.getElementById('add-party-btn'), materialDesc: document.getElementById('material-desc'),
            outwardDate: document.getElementById('outward-date'), inwardDate: document.getElementById('inward-date'),
            saveOutwardBtn: document.getElementById('save-outward-btn'), cancelOutwardEditBtn: document.getElementById('cancel-outward-edit-btn'),
            jobNoOutward: document.getElementById('job-no-outward'), outwardCustomerName: document.getElementById('outward-customer-name'),
            newOutwardBtn: document.getElementById('new-outward-btn'), inwardOutwardHeaderActions: document.getElementById('inward-outward-header-actions'),
            allInOutHeaderActions: document.getElementById('all-in-out-header-actions'), allInOutSearchBox: document.getElementById('all-in-out-search-box'),
            downloadAllInOutExcelBtn: document.getElementById('download-all-in-out-excel-btn'), allInOutTableBody: document.getElementById('all-in-out-table-body'),
            allInOutPagination: document.getElementById('all-in-out-pagination'),

            // Problem Modal
            problemModal: document.getElementById('problem-modal'), problemModalBody: document.getElementById('problem-modal-body'),
            modalDeviceName: document.getElementById('modal-device-name'), modalSaveBtn: document.getElementById('modal-save-btn'),
            modalCancelBtn: document.getElementById('modal-cancel-btn'),
        };
        
        // --- Helper Functions ---
        function toTitleCase(str) {
            if (!str) return '';
            return str.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
        }

        function init() {
            setupNavigation();
            setupClock();
            setupTheme();
            setupEventListeners();
            populateSelects();
            buildProblemModal();
            setInitialDate();
            loadInitialData();
            addDeviceRow(); // Add one device row by default
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
                    DOMElements.allInOutHeaderActions.style.display = 'none';
                    
                    handleAllJobsSearch(null);

                    if (page === 'job-sheet') DOMElements.jobSheetHeaderActions.style.display = 'flex';
                    else if (page === 'all-jobs') {
                        DOMElements.jobNoSearchBox.value = '';
                        DOMElements.mobileNoSearchBox.value = '';
                        handleAllJobsSearch(null); 
                        DOMElements.allJobsHeaderActions.style.display = 'flex';
                    } else if (page === 'inward-outward') {
                        clearOutwardForm();
                        DOMElements.inwardOutwardHeaderActions.style.display = 'flex';
                    } else if (page === 'all-in-out') {
                        DOMElements.allInOutSearchBox.value = '';
                        handleAllInOutSearch(null);
                        DOMElements.allInOutHeaderActions.style.display = 'flex';
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
            DOMElements.logoutBtn.addEventListener('click', () => auth.signOut());
            DOMElements.newJobBtn.addEventListener('click', clearJobSheetForm);
            DOMElements.saveRecordBtn.addEventListener('click', saveJobSheet);
            DOMElements.sendWhatsAppBtn.addEventListener('click', sendWhatsAppMessage);

            // Devices and Materials
            DOMElements.addDeviceBtn.addEventListener('click', () => addDeviceRow());
            DOMElements.devicesTableBody.addEventListener('click', handleDevicesTableClick);
            DOMElements.addMaterialBtn.addEventListener('click', () => addMaterialRow());
            DOMElements.materialsTableBody.addEventListener('click', (e) => { if (e.target.classList.contains('remove-material-btn')) e.target.closest('tr').remove(); });
            
            // Problem Modal
            DOMElements.modalSaveBtn.addEventListener('click', handleSaveProblems);
            DOMElements.modalCancelBtn.addEventListener('click', () => DOMElements.problemModal.classList.remove('visible'));
            
            // Search and Filter
            DOMElements.jobNoSearchBox.addEventListener('input', () => handleAllJobsSearch(null));
            DOMElements.mobileNoSearchBox.addEventListener('input', () => handleAllJobsSearch(null));
            DOMElements.filterToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); DOMElements.filterPopup.classList.toggle('visible'); });
            document.addEventListener('click', (e) => { if (!DOMElements.filterPopup.contains(e.target) && !DOMElements.filterToggleBtn.contains(e.target)) DOMElements.filterPopup.classList.remove('visible'); });

            // Inward/Outward
            DOMElements.saveOutwardBtn.addEventListener('click', saveOutwardRecord);
            DOMElements.cancelOutwardEditBtn.addEventListener('click', clearOutwardForm);
            DOMElements.newOutwardBtn.addEventListener('click', () => document.querySelector('.nav-link[data-page="inward-outward"]').click());
            DOMElements.addPartyBtn.addEventListener('click', async () => {
                const newParty = prompt("Enter the new party name:");
                if (newParty && newParty.trim() !== '') {
                    const trimmedParty = toTitleCase(newParty.trim());
                    await addSuggestion(trimmedParty, 'parties');
                    DOMElements.partyName.value = trimmedParty;
                    alert(`Party "${trimmedParty}" added successfully!`);
                }
            });
            DOMElements.jobNoOutward.addEventListener('input', autofillOutwardFromJob);
            DOMElements.allInOutSearchBox.addEventListener('input', () => handleAllInOutSearch(null));
            
            // Excel Downloads
            DOMElements.downloadExcelBtn.addEventListener('click', downloadJobsAsExcel);
            DOMElements.downloadAllInOutExcelBtn.addEventListener('click', downloadAllInOutAsExcel);
        }
        
        function populateSelects() {
            populateOptions(DOMElements.currentStatus, currentStatusOptions, "Select Current Status");
            populateOptions(DOMElements.finalStatus, finalStatusOptions, "Select Final Status");
            populateOptions(DOMElements.customerStatus, customerStatusOptions, "Select Customer Status");
        }

        function populateOptions(select, options, defaultText) {
            select.innerHTML = `<option disabled selected value="">${defaultText}</option>`;
            options.forEach(o => select.innerHTML += `<option value="${o}">${o}</option>`);
        }

        function setInitialDate() {
            DOMElements.date.value = new Date().toISOString().split('T')[0];
            DOMElements.outwardDate.value = new Date().toISOString().split('T')[0];
        }

        function listenForSuggestions(collectionName, initialArray, targetArray) {
            db.collection(collectionName).onSnapshot(snapshot => {
                const dbSuggestions = snapshot.docs.map(doc => doc.data().name);
                const combined = [...new Set([...initialArray, ...dbSuggestions])].sort();
                targetArray.length = 0;
                Array.prototype.push.apply(targetArray, combined);
            }, error => console.error(`Error listening for ${collectionName} suggestions:`, error));
        }

        function loadInitialData() {
            db.collection("jobSheets").orderBy("jobSheetNo", "desc").onSnapshot(snap => {
                allJobSheets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                allJobSheets.sort((a, b) => (b.jobSheetNo || 0) - (a.jobSheetNo || 0));
                renderJobRangeFilters();
                updateDashboardStats();
                handleAllJobsSearch(null);
            });
            db.collection("jobSheets").orderBy("updatedAt", "desc").limit(5).onSnapshot(snap => {
                renderRecentJobsTable(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            db.collection("outwardJobs").orderBy("outwardDate", "desc").onSnapshot(snap => {
                allOutwardRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                updateDashboardStats();
                handleAllInOutSearch(null);
            });
            listenForSuggestions('brands', initialBrandOptions, brandSuggestions);
            listenForSuggestions('parties', initialPartyOptions, partySuggestions);
            listenForSuggestions('partNames', initialPartNames, partNameSuggestions);
        }

        function handleDevicesTableClick(e) {
            if (e.target.classList.contains('remove-material-btn')) {
                const row = e.target.closest('tr');
                const rowIndex = Array.from(DOMElements.devicesTableBody.children).indexOf(row);
                delete tempDeviceProblems[rowIndex];
                row.remove();
            } else if (e.target.id === 'add-problem-btn') {
                const deviceRow = e.target.closest('tr');
                const rowIndex = Array.from(DOMElements.devicesTableBody.children).indexOf(deviceRow);
                const deviceType = deviceRow.querySelector('.device-type').value || 'Device';
                const deviceBrand = deviceRow.querySelector('.device-brand').value || '';
                openProblemModal(rowIndex, `${deviceBrand} ${deviceType}`);
            }
        }

        function openProblemModal(rowIndex, deviceName) {
            DOMElements.modalDeviceName.textContent = deviceName;
            DOMElements.problemModal.dataset.rowIndex = rowIndex;

            // Reset modal form
            DOMElements.problemModalBody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            DOMElements.problemModalBody.querySelectorAll('select').forEach(sel => sel.selectedIndex = 0);
            DOMElements.problemModalBody.querySelectorAll('.problem-sub-options').forEach(el => el.style.display = 'none');

            // Populate modal with existing problems
            const existingProblems = tempDeviceProblems[rowIndex] || [];
            existingProblems.forEach(problemStr => {
                const [mainProblem, subOptionsStr] = problemStr.split(': ');
                const problemId = `problem-${mainProblem.replace(/[\s/]+/g, '-')}`;
                const checkbox = DOMElements.problemModalBody.querySelector(`#${problemId}`);

                if (checkbox) {
                    checkbox.checked = true;
                    const subOptionsDiv = DOMElements.problemModalBody.querySelector(`#sub-options-${checkbox.dataset.key}`);
                    if (subOptionsDiv) {
                        subOptionsDiv.style.display = 'block';
                        if (subOptionsStr) {
                            subOptionsStr.split(', ').forEach(subOpt => {
                                const subInput = subOptionsDiv.querySelector(`input[value="${subOpt}"], select`);
                                if (subInput) {
                                    if (subInput.type === 'checkbox') subInput.checked = true;
                                    else subInput.value = subOpt;
                                }
                            });
                        }
                    }
                }
            });
            DOMElements.problemModal.classList.add('visible');
        }
        
        function handleSaveProblems() {
            const rowIndex = DOMElements.problemModal.dataset.rowIndex;
            const problems = getProblemsFromModal();
            tempDeviceProblems[rowIndex] = problems;
            renderProblemTags(rowIndex, problems);
            DOMElements.problemModal.classList.remove('visible');
        }

        function renderProblemTags(rowIndex, problems) {
            const deviceRow = DOMElements.devicesTableBody.rows[rowIndex];
            if (deviceRow) {
                const container = deviceRow.querySelector('.device-problems-list');
                container.innerHTML = problems.map(p => `<span class="problem-tag">${p}</span>`).join('') +
                                      `<button id="add-problem-btn" class="action-btn secondary-btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">+ Problems</button>`;
            }
        }
        
        function getProblemsFromModal() {
            const problems = [];
            DOMElements.problemModalBody.querySelectorAll('.problem-main-checkbox:checked').forEach(cb => {
                const mainProblem = cb.value;
                const configKey = Object.keys(problemOptionsConfig).find(k => k.replace(/[\s/]+/g, '-') === cb.dataset.key);
                const config = problemOptionsConfig[configKey];
                
                if (config && config.subOptions) {
                    const subOptionsDiv = document.getElementById(`sub-options-${cb.dataset.key}`);
                    const selectedSubOptions = [];
                    if (config.subOptionType === 'checkbox') {
                        subOptionsDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(subCb => selectedSubOptions.push(subCb.value));
                        if(selectedSubOptions.length > 0) problems.push(`${mainProblem}: ${selectedSubOptions.join(', ')}`);
                        else problems.push(mainProblem);
                    } else { // select
                        const select = subOptionsDiv.querySelector('select');
                        if (select.value) problems.push(`${mainProblem}: ${select.value}`);
                        else problems.push(mainProblem);
                    }
                } else {
                    problems.push(mainProblem);
                }
            });
            return problems;
        }

        async function saveJobSheet() {
            const jobSheetNo = Number(DOMElements.jobSheetNo.value.trim());
            if (!currentEditingJobId && allJobSheets.some(j => j.jobSheetNo === jobSheetNo)) {
                return alert("Error: Job Sheet Number " + jobSheetNo + " already exists.");
            }
            const engineers = [];
            if (DOMElements.engineerKundan.checked) engineers.push("Kundan Sir");
            if (DOMElements.engineerSachin.checked) engineers.push("Sachin Sir");
            if (DOMElements.engineerRushi.checked) engineers.push("Rushi");

            const devices = getDevicesWithProblems();
            if (devices.length === 0) return alert("Please add at least one device with its type and brand.");

            const jobData = {
                jobSheetNo,
                oldJobSheetNo: DOMElements.oldJobSheetNo.value.trim(),
                date: DOMElements.date.value,
                customerName: toTitleCase(DOMElements.customerName.value.trim()),
                customerMobile: DOMElements.customerMobile.value.trim(),
                altMobile: DOMElements.altMobile.value.trim(),
                devices,
                serviceNote: DOMElements.serviceNote.value.trim(),
                materials: getMaterials(),
                currentStatus: DOMElements.currentStatus.value,
                finalStatus: DOMElements.finalStatus.value,
                customerStatus: DOMElements.customerStatus.value,
                estimateAmount: parseFloat(DOMElements.estimateAmount.value) || 0,
                engineers,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!jobData.jobSheetNo || !jobData.customerName || !jobData.customerMobile) { return alert("Job Sheet No, Customer Name, and Mobile are required."); }

            try {
                if (currentEditingJobId) {
                    await db.collection("jobSheets").doc(currentEditingJobId).update(jobData);
                    showSuccessModal("Record Updated!");
                } else {
                    jobData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection("jobSheets").add(jobData);
                    showSuccessModal("Record Saved!");
                }
                clearJobSheetForm();
                document.querySelector('.nav-link[data-page="dashboard"]').click();
            } catch (error) { console.error("Error saving job sheet:", error); alert("Error saving record."); }
        }

        function editJob(id) {
            const job = allJobSheets.find(j => j.id === id);
            if (!job) return;
            clearJobSheetForm();
            currentEditingJobId = id;
            
            DOMElements.jobSheetNo.value = job.jobSheetNo || '';
            DOMElements.oldJobSheetNo.value = job.oldJobSheetNo || '';
            DOMElements.date.value = job.date || '';
            DOMElements.customerName.value = job.customerName || '';
            DOMElements.customerMobile.value = job.customerMobile || '';
            DOMElements.altMobile.value = job.altMobile || '';
            DOMElements.serviceNote.value = job.serviceNote || '';
            DOMElements.estimateAmount.value = job.estimateAmount || '';
            DOMElements.currentStatus.value = job.currentStatus || '';
            DOMElements.finalStatus.value = job.finalStatus || '';
            DOMElements.customerStatus.value = job.customerStatus || '';
            
            (job.engineers || []).forEach(eng => {
                if(eng.includes("Kundan")) DOMElements.engineerKundan.checked = true;
                if(eng.includes("Sachin")) DOMElements.engineerSachin.checked = true;
                if(eng.includes("Rushi")) DOMElements.engineerRushi.checked = true;
            });
            
            DOMElements.devicesTableBody.innerHTML = '';
            tempDeviceProblems = {};
            (job.devices || []).forEach((device, index) => {
                addDeviceRow(device);
                tempDeviceProblems[index] = device.problems || [];
                renderProblemTags(index, device.problems || []);
            });

            DOMElements.materialsTableBody.innerHTML = '';
            (job.materials || []).forEach(mat => addMaterialRow(mat));
            
            DOMElements.saveRecordBtn.textContent = 'Update Record';
            DOMElements.saveRecordBtn.classList.add('update-btn');
            document.querySelector('.nav-link[data-page="job-sheet"]').click();
        }
        
        async function deleteJob(id) {
            if (prompt("To delete this job, please enter the password:") === "KC21") {
                await db.collection("jobSheets").doc(id).delete();
                showSuccessModal("Job Sheet Deleted!");
            } else { alert("Incorrect password. Deletion cancelled."); }
        }

        function getDevicesWithProblems() {
            const devices = [];
            Array.from(DOMElements.devicesTableBody.rows).forEach((row, index) => {
                const type = row.querySelector('.device-type').value;
                const brand = row.querySelector('.device-brand').value.trim();
                if (type && brand) {
                    devices.push({
                        type: type, brand: toTitleCase(brand),
                        problems: tempDeviceProblems[index] || []
                    });
                }
            });
            return devices;
        }

        function clearJobSheetForm() {
            currentEditingJobId = null;
            tempDeviceProblems = {};
            // More robust reset
            const formPage = DOMElements.jobSheetPage;
            formPage.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], textarea').forEach(el => el.value = '');
            formPage.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
            formPage.querySelectorAll('select').forEach(el => el.selectedIndex = 0);

            DOMElements.devicesTableBody.innerHTML = '';
            DOMElements.materialsTableBody.innerHTML = '';
            addDeviceRow();
            DOMElements.saveRecordBtn.textContent = 'Save Record';
            DOMElements.saveRecordBtn.classList.remove('update-btn');
            setInitialDate();
        }

        function buildProblemModal() {
            let html = '';
            for (const category in problemOptionsConfig) {
                const config = problemOptionsConfig[category];
                const categoryKey = category.replace(/[\s/]+/g, '-');
                html += `<div class="problem-category"><h3>${category}</h3>`;
                if (config.problems) { // Simple checkbox list for General
                    html += `<div class="problem-checkbox-grid">`;
                    config.problems.forEach(problem => {
                        const problemKey = problem.replace(/[\s/]+/g, '-');
                        html += `<div class="problem-item"><input type="checkbox" class="problem-main-checkbox" id="problem-${problemKey}" data-key="${problemKey}" value="${problem}"><label for="problem-${problemKey}">${problem}</label></div>`;
                    });
                    html += `</div>`;
                } else { // Main problem with sub-options
                     html += `<div class="problem-item"><input type="checkbox" class="problem-main-checkbox" id="problem-${categoryKey}" data-key="${categoryKey}" value="${category}"><label for="problem-${categoryKey}">${category}</label></div>`;
                     let subOptionsHTML = '';
                     if (config.subOptionType === 'checkbox') {
                         subOptionsHTML = config.subOptions.map(opt => `<div class="problem-item"><input type="checkbox" value="${opt}"><label>${opt}</label></div>`).join('');
                         html += `<div class="problem-sub-options" id="sub-options-${categoryKey}"><label>${config.subOptionLabel}</label><div class="sub-checkbox-grid">${subOptionsHTML}</div></div>`;
                     } else { // select
                         subOptionsHTML = config.subOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                         html += `<div class="problem-sub-options" id="sub-options-${categoryKey}"><label>${config.subOptionLabel}</label><select class="select-field"><option value="">Select...</option>${subOptionsHTML}</select></div>`;
                     }
                }
                html += `</div>`;
            }
            DOMElements.problemModalBody.innerHTML = html;

            // Add event listeners for showing sub-options
            DOMElements.problemModalBody.querySelectorAll('.problem-main-checkbox').forEach(checkbox => {
                const subOptionsDiv = DOMElements.problemModalBody.querySelector(`#sub-options-${checkbox.dataset.key}`);
                if (subOptionsDiv) {
                    checkbox.addEventListener('change', () => { subOptionsDiv.style.display = checkbox.checked ? 'block' : 'none'; });
                }
            });
        }
        
        function addDeviceRow(device = {}) {
            const rowIndex = DOMElements.devicesTableBody.rows.length;
            const row = DOMElements.devicesTableBody.insertRow();
            row.innerHTML = `
                <td><select class="select-field device-type"><option value="">Select Device</option>${deviceTypeOptions.map(opt => `<option value="${opt}" ${device.type === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></td>
                <td><div class="autocomplete"><input type="text" class="input-field device-brand" placeholder="e.g., Dell, HP" value="${device.brand || ''}"></div></td>
                <td><div class="device-problems-list"><button id="add-problem-btn" class="action-btn secondary-btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">+ Problems</button></div></td>
                <td><button class="remove-material-btn">&times;</button></td>
            `;
            setupAutocomplete(row.querySelector('.device-brand'), brandSuggestions);
            if (!device.problems) {
                tempDeviceProblems[rowIndex] = [];
            }
        }
        
        function addMaterialRow(material = {}) {
            const row = document.createElement('tr');
            const statusOptionsHTML = materialStatusOptions.map(opt => `<option value="${opt}" ${material.status === opt ? 'selected' : ''}>${opt}</option>`).join('');
            row.innerHTML = `
                <td><div class="autocomplete"><input type="text" class="input-field part-name" placeholder="e.g., SSD" value="${material.name || ''}"></div></td>
                <td><input type="text" class="input-field part-details" placeholder="e.g., Samsung 256GB" value="${material.details || ''}"></td>
                <td><input type="number" class="input-field part-qty" placeholder="1" value="${material.qty || '1'}"></td>
                <td><select class="select-field part-status">${statusOptionsHTML}</select></td>
                <td><button class="remove-material-btn">&times;</button></td>
            `;
            DOMElements.materialsTableBody.appendChild(row);
            setupAutocomplete(row.querySelector('.part-name'), partNameSuggestions);
        }

        function getMaterials() {
            const materials = [];
            DOMElements.materialsTableBody.querySelectorAll('tr').forEach(row => {
                const name = row.querySelector('.part-name').value.trim();
                if (name) {
                    materials.push({
                        name: toTitleCase(name),
                        details: row.querySelector('.part-details').value.trim(),
                        qty: parseInt(row.querySelector('.part-qty').value) || 1,
                        status: row.querySelector('.part-status').value
                    });
                }
            });
            return materials;
        }

        // --- All the other functions from your original file are included below ---
        // This is the crucial part that was missing.
        
        function updateDashboardStats() {
            DOMElements.totalJobsStat.textContent = allJobSheets.length;
            DOMElements.pendingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Pending Diagnosis').length;
            DOMElements.workingJobsStat.textContent = allJobSheets.filter(j => j.currentStatus === 'Working').length;
            DOMElements.deliveredJobsStat.textContent = allJobSheets.filter(j => j.finalStatus === 'Delivered').length;
            DOMElements.notDeliveredJobsStat.textContent = allJobSheets.filter(j => j.finalStatus === 'Not Delivered').length;

            const pendingInwards = allOutwardRecords.filter(r => !r.inwardDate);
            DOMElements.pendingInwardStat.textContent = pendingInwards.length;
            DOMElements.rahulSirPendingStat.textContent = pendingInwards.filter(r => r.partyName === 'Rahul Sir').length;
        }

        function renderJobRangeFilters() {
            const container = DOMElements.filterPopup;
            if (!container) return;

            const ranges = [...new Set(allJobSheets
                .map(j => Math.floor(j.jobSheetNo / 100) * 100)
                .filter(r => r > 0)
            )].sort((a, b) => b - a);

            let buttonsHTML = '<button class="job-range-filter-btn active" data-range="all">All</button>';
            
            ranges.forEach(rangeStart => {
                const rangeEnd = rangeStart + 99;
                buttonsHTML += `<button class="job-range-filter-btn" data-range="${rangeStart}">${rangeStart}-${rangeEnd}</button>`;
            });

            container.innerHTML = buttonsHTML;

            container.querySelectorAll('.job-range-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelector('.active')?.classList.remove('active');
                    btn.classList.add('active');
                    
                    const selectedRange = btn.dataset.range;
                    currentJobRangeFilter = selectedRange === 'all' ? 'all' : parseInt(selectedRange);

                    if (currentJobRangeFilter === 'all') {
                        DOMElements.filterToggleBtn.classList.remove('active');
                        DOMElements.filterBtnLabel.textContent = 'Filter';
                    } else {
                        DOMElements.filterToggleBtn.classList.add('active');
                        DOMElements.filterBtnLabel.textContent = btn.textContent;
                    }
                    
                    DOMElements.filterPopup.classList.remove('visible');
                    handleAllJobsSearch(null);
                });
            });
        }

        function renderRecentJobsTable(jobs) {
            DOMElements.recentJobsTableBody.innerHTML = jobs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 1rem;">No recent activity.</td></tr>` :
            jobs.map(job => `
                <tr>
                    <td>${job.jobSheetNo}</td>
                    <td title="${job.customerName}">${job.customerName}</td>
                    <td title="${(job.devices || []).map(d => d.type).join(', ')}">${(job.devices || []).map(d => d.type).join(', ')}</td>
                    <td>${job.currentStatus || 'N/A'}</td>
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

            DOMElements.allJobsTableBody.innerHTML = pageItems.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding: 1rem;">No matching jobs found.</td></tr>` :
            pageItems.map(job => `
                <tr>
                    <td>${job.jobSheetNo}</td>
                    <td>${formatDate(job.date)}</td>
                    <td title="${job.customerName}">${job.customerName}</td>
                    <td title="${job.customerMobile}">${job.customerMobile}</td>
                    <td title="${(job.devices || []).map(d=>d.type).join(', ')}">${(job.devices || []).map(d=>d.type).join(', ')}</td>
                    <td>${job.currentStatus}</td>
                    <td class="table-actions">
                        <button title="Edit" onclick="window.app.editJob('${job.id}')">✏️</button>
                        <button title="Delete" class="delete-btn" onclick="window.app.deleteJob('${job.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
            renderPagination(DOMElements.allJobsPagination, filteredJobs.length, allJobsCurrentPage, 'changeAllJobsPage');
        }

        let activeDashboardFilter = null;
        
        function handleAllJobsSearch(dashboardFilter = null) {
            if (dashboardFilter) {
                if (dashboardFilter.value === null) activeDashboardFilter = null;
                else activeDashboardFilter = dashboardFilter;
            }
        
            const jobNoTerm = DOMElements.jobNoSearchBox.value.trim();
            const mobileTerm = DOMElements.mobileNoSearchBox.value.trim();
            
            let tempFilteredJobs = allJobSheets;
        
            if (activeDashboardFilter) {
                if (activeDashboardFilter.type === 'currentStatus') {
                    tempFilteredJobs = tempFilteredJobs.filter(job => job.currentStatus === activeDashboardFilter.value);
                } else if (activeDashboardFilter.type === 'finalStatus') {
                    tempFilteredJobs = tempFilteredJobs.filter(job => job.finalStatus === activeDashboardFilter.value);
                }
            }
        
            if (currentJobRangeFilter !== 'all') {
                const lowerBound = currentJobRangeFilter;
                const upperBound = lowerBound + 99;
                tempFilteredJobs = tempFilteredJobs.filter(job => job.jobSheetNo >= lowerBound && job.jobSheetNo <= upperBound);
            }
        
            if (jobNoTerm) {
                tempFilteredJobs = tempFilteredJobs.filter(job => String(job.jobSheetNo).includes(jobNoTerm));
            }
            if (mobileTerm) {
                tempFilteredJobs = tempFilteredJobs.filter(job => 
                    (job.customerMobile && String(job.customerMobile).includes(mobileTerm)) ||
                    (job.altMobile && String(job.altMobile).includes(mobileTerm))
                );
            }
            
            filteredJobs = tempFilteredJobs;
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

        function renderAllInOutTable() {
            const startIndex = (allInOutCurrentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = filteredOutwards.slice(startIndex, endIndex);

            DOMElements.allInOutTableBody.innerHTML = pageItems.map(r => `
                <tr>
                    <td>${r.jobNo || '-'}</td>
                    <td title="${r.partyName}">${r.partyName}</td>
                    <td title="${r.material}">${r.material}</td>
                    <td>${formatDate(r.outwardDate)}</td>
                    <td>${r.inwardDate ? formatDate(r.inwardDate) : `<button class="action-btn primary-btn pending-btn" onclick="window.app.editOutward('${r.id}')">Pending</button>`}</td>
                    <td class="table-actions">
                        <button title="Edit" onclick="window.app.editOutward('${r.id}')">✏️</button>
                        <button class="delete-btn" title="Delete" onclick="window.app.deleteOutward('${r.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
            renderPagination(DOMElements.allInOutPagination, filteredOutwards.length, allInOutCurrentPage, 'changeAllInOutPage');
        }

        function handleAllInOutSearch(dashboardFilter = null) {
            const term = DOMElements.allInOutSearchBox.value.toLowerCase();
            let tempFilteredOutwards = allOutwardRecords;

            if (dashboardFilter) {
                 DOMElements.allInOutSearchBox.value = '';
                if (dashboardFilter.value === 'pending-inward') {
                    tempFilteredOutwards = tempFilteredOutwards.filter(r => !r.inwardDate);
                } else if (dashboardFilter.value === 'rahul-sir-pending') {
                    tempFilteredOutwards = tempFilteredOutwards.filter(r => r.partyName === 'Rahul Sir' && !r.inwardDate);
                }
            } else if (term) {
                tempFilteredOutwards = tempFilteredOutwards.filter(r =>
                    (r.partyName && r.partyName.toLowerCase().includes(term)) ||
                    (r.material && r.material.toLowerCase().includes(term))
                );
            }

            filteredOutwards = tempFilteredOutwards;
            allInOutCurrentPage = 1;
            renderAllInOutTable();
        }

        function changeAllInOutPage(direction) {
            const totalPages = Math.ceil(filteredOutwards.length / itemsPerPage);
            allInOutCurrentPage += direction;
            if (allInOutCurrentPage < 1) allInOutCurrentPage = 1;
            if (allInOutCurrentPage > totalPages) allInOutCurrentPage = totalPages;
            renderAllInOutTable();
        }

        function clearOutwardForm() {
            currentEditingOutwardId = null;
            DOMElements.outwardFormTitle.textContent = 'New Outward Entry';
            DOMElements.saveOutwardBtn.textContent = 'Save Record';
            DOMElements.saveOutwardBtn.classList.remove('update-btn');
            DOMElements.cancelOutwardEditBtn.style.display = 'none';
            [DOMElements.partyName, DOMElements.materialDesc, DOMElements.inwardDate, DOMElements.jobNoOutward, DOMElements.outwardCustomerName].forEach(el => el.value = '');
            setInitialDate();
        }

        async function saveOutwardRecord() {
            const recordData = {
                jobNo: DOMElements.jobNoOutward.value.trim(),
                partyName: toTitleCase(DOMElements.partyName.value.trim()), 
                material: DOMElements.materialDesc.value.trim(),
                customerName: toTitleCase(DOMElements.outwardCustomerName.value.trim()),
                outwardDate: DOMElements.outwardDate.value, 
                inwardDate: DOMElements.inwardDate.value || null,
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
                await addSuggestion(recordData.partyName, 'parties');
                clearOutwardForm();
                document.querySelector('.nav-link[data-page="all-in-out"]').click();
            } catch (error) { console.error("Error saving outward record: ", error); }
        }

        function editOutward(id) {
            const record = allOutwardRecords.find(r => r.id === id);
            if (!record) return;
            document.querySelector('.nav-link[data-page="inward-outward"]').click();
            currentEditingOutwardId = id;
            DOMElements.outwardFormTitle.textContent = 'Edit Outward Entry';
            DOMElements.jobNoOutward.value = record.jobNo || '';
            DOMElements.partyName.value = record.partyName; 
            DOMElements.materialDesc.value = record.material;
            DOMElements.outwardCustomerName.value = record.customerName || '';
            DOMElements.outwardDate.value = record.outwardDate; DOMElements.inwardDate.value = record.inwardDate || '';
            DOMElements.saveOutwardBtn.textContent = 'Update Record';
            DOMElements.saveOutwardBtn.classList.add('update-btn');
            DOMElements.cancelOutwardEditBtn.style.display = 'block';
        }

        async function deleteOutward(id) {
            const password = prompt("To delete this record, please enter the password:");
            if (password === "KC21") {
                await db.collection("outwardJobs").doc(id).delete();
                showSuccessModal("Outward Record Deleted!");
            } else if (password !== null) {
                alert("Incorrect password. Deletion cancelled.");
            }
        }
        
        function autofillOutwardFromJob() {
            const jobNo = DOMElements.jobNoOutward.value;
            if (jobNo) {
                const job = allJobSheets.find(j => j.jobSheetNo == jobNo);
                if (job) {
                    const deviceText = (job.devices || []).map(d => `${d.brand} ${d.type}`).join(', ');
                    DOMElements.materialDesc.value = deviceText;
                    DOMElements.outwardCustomerName.value = job.customerName;
                }
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
            return correctedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        }

        async function addSuggestion(value, collectionName) {
            const trimmedValue = value.trim();
            if (trimmedValue) {
                try {
                    const docRef = db.collection(collectionName).doc(trimmedValue.toLowerCase());
                    const doc = await docRef.get();
                    if (!doc.exists) {
                        await docRef.set({ name: trimmedValue });
                    }
                } catch (e) { console.error("Error adding suggestion:", e); }
            }
        }

        function setupAutocomplete(input, suggestionsArray) {
            let container = input.closest('.autocomplete').querySelector('.autocomplete-items');
            if (!container) {
                container = document.createElement('div');
                container.className = 'autocomplete-items';
                input.parentNode.appendChild(container);
            }
            
            const showSuggestions = () => {
                 container.innerHTML = !input.value ? '' : suggestionsArray
                    .filter(item => item.toLowerCase().includes(input.value.toLowerCase()))
                    .map(item => `<div data-value="${item}">${item}</div>`).join('');
            };

            input.addEventListener('input', showSuggestions);
            input.addEventListener('focus', showSuggestions);

            container.addEventListener('click', e => { 
                if (e.target.dataset.value) { 
                    input.value = e.target.dataset.value; 
                    container.innerHTML = ''; 
                } 
            });
            document.addEventListener('click', e => { if (e.target !== input) container.innerHTML = ''; });
        }

        function showSuccessModal(message) {
            const modal = document.getElementById('success-modal');
            if (!modal) { // Fallback for the success modal
                alert(message);
                return;
            }
            const messageEl = document.getElementById('success-message');
            if(messageEl) messageEl.textContent = message;
            modal.classList.add('visible');
            setTimeout(() => modal.classList.remove('visible'), 2000);
        }

        function sendWhatsAppMessage() {
            const customerName = DOMElements.customerName.value.trim();
            const jobSheetNo = DOMElements.jobSheetNo.value.trim();
            const devices = getDevicesWithProblems();
            const estimateAmount = DOMElements.estimateAmount.value.trim();
            const customerMobile = DOMElements.customerMobile.value.trim();

            if (!customerMobile || !customerName || !jobSheetNo || devices.length === 0 || !estimateAmount) {
                return alert('Please fill all required fields to send a WhatsApp message.');
            }
            let phoneNumber = customerMobile;
            if (phoneNumber.length === 10 && !phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber;

            const deviceText = devices.map(d => `${d.brand} ${d.type}`).join(', ');
            const encodedDeviceText = encodeURIComponent(deviceText);

            const textParts = [
                `Hello, ${encodeURIComponent(customerName)} %F0%9F%91%8B`, ``, `Your Job No: ${encodeURIComponent(jobSheetNo)}`,
                `Your ${encodedDeviceText} is now ready %E2%9C%85`, ``, `%F0%9F%92%B0 Amount: ${encodeURIComponent(`₹${estimateAmount}`)}`, ``,
                `%F0%9F%93%8D Please collect your device between`, `10:30 AM – 07:30 PM`, ``, `Thank you,`, `Korus Computers`
            ];
            const finalMessage = textParts.join('%0A');
            window.open(`https://wa.me/${phoneNumber}?text=${finalMessage}`, '_blank');
        }

        function downloadJobsAsExcel() {
            const dataToExport = allJobSheets.map(job => {
                const deviceData = job.devices ? job.devices.map(d => `${d.brand} ${d.type} (${(d.problems || []).join(', ')})`).join('; ') : '';
                return {
                    "Job No": job.jobSheetNo, "Old Job No": job.oldJobSheetNo, "Date": formatDate(job.date),
                    "Customer Name": job.customerName, "Mobile": job.customerMobile, "Alt Mobile": job.altMobile,
                    "Devices & Problems": deviceData,
                    "Service Note": job.serviceNote,
                    "Materials Used": (job.materials || []).map(m => `${m.qty}x ${m.name} (${m.details || 'N/A'}) - ${m.status}`).join('; '),
                    "Current Status": job.currentStatus, "Final Status": job.finalStatus, "Customer Status": job.customerStatus,
                    "Engineer(s)": (job.engineers || []).join(', '), "Estimate Amount": job.estimateAmount,
                };
            });
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobSheets");
            XLSX.writeFile(workbook, "Korus_Job_Sheets_Export.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        function downloadAllInOutAsExcel() {
            const dataToExport = allOutwardRecords.map(r => ({
                 "Job No": r.jobNo, "Party Name": r.partyName, "Customer Name": r.customerName,
                "Material": r.material, "Outward Date": formatDate(r.outwardDate),
                "Inward Date": r.inwardDate ? formatDate(r.inwardDate) : 'Pending',
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "AllInwardOutward");
            XLSX.writeFile(workbook, "Korus_All_Inward_Outward_Export.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        // --- Make functions globally accessible for inline HTML onclicks ---
        window.app = { editJob, deleteJob, editOutward, deleteOutward, changeAllJobsPage, changeAllInOutPage };
        
        init(); // Start the app
    }
});
