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

        // --- Pre-populated Data ---
        const initialBrandOptions = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Intex", "I-Ball", "Artist", "Lapcare", "EVM", "Crucial", "Logitech", "Apple (MacBook)", "MSI", "Samsung", "Avita", "Fujitsu", "LG", "Toshiba", "HCL", "Redmi", "Sony", "OnePlus", "TCL", "Panasonic", "Sansui", "BenQ", "Zebronics", "ViewSonic", "AOC", "Philips", "Gigabyte", "Cooler Master", "Foxin", "Western Digital (WD)", "Seagate", "Kingston", "XPG", "ADATA", "SanDisk", "Intel", "Ant Esports", "Antec", "Deepcool", "Circle", "Frontech", "Enter", "Canon", "Epson", "Brother", "TVS", "Zebra", "Xerox", "Kyocera", "Ricoh", "Pantum", "Delta", "Vertiv", "12A", "88A", "78A", "925A", "337A", "ProDot"];
        const initialPartyOptions = ["Rahul Sir", "Shree Enterprises", "San infotech", "Audio video care", "Rx service centre", "Nate", "DSK", "Crucial service centre", "Rashi Peripheral", "SR enterprises", "Cache technology", "perfect computers", "EVM service centre", "navkar enterprises"];
        const initialPartNames = ["SSD", "RAM", "Keyboard", "Battery", "Screen", "Toner", "Motherboard", "Adapter", "CPU Fan"];
        
        let brandSuggestions = [...initialBrandOptions];
        let partySuggestions = [...initialPartyOptions];
        let partNameSuggestions = [...initialPartNames];

        const problemOptionsConfig = {
    "Formatting": {
        subOptions: ["Windows 7", "Windows 8", "Windows 10", "Windows 11", "Windows XP", "Ubantu", "Mac OS"],
        subOptionType: "select",
        subOptionLabel: "Select OS"
    },

    "Software Installation": {
        subOptions: ["AutoCAD", "CATIA", "SolidWorks", "PowerMill", "CoralDraw", "SolidEdge", "Premiere Pro", "After Effect", "MasterCam", "SketchUp", "Photoshop", "MS Office", "Tally Prime", "Tally ERP9", "Siemens NX", "PTC Creo", "Revit", "Illustrator", "3ds Max", "Maya", "ISM"],
        subOptionType: "select",
        subOptionLabel: "Select Software"
    },

    "Toner Refill": {
        subOptions: ["12A", "88A", "337A", "285A", "78A", "925A", "TN-1020", "Samsung", "Ricoh", "Pantum", "Xerox"],
        subOptionType: "select",
        subOptionLabel: "Select Toner Model"
    },

    "Antivirus": {
        subOptions: ["Quick Heal", "NPAV", "Bitdefender"],
        subOptionType: "select",
        subOptionLabel: "Select Antivirus"
    },

    "Printer Problem": {
        subOptions: ["Paper Jam", "Head Cleaning", "Servicing", "Head Block", "Low Ink/Toner", "Slow Printing", "Faded Printouts", "Strange Noises", "Blank Pages Printing", "Paper Misfeed", "Scanner Not Working"],
        subOptionType: "select",
        subOptionLabel: "Select Printer Issue"
    },

    "Replacement": {
        subOptions: ["Battery", "Keybpard", "Mouse", "SSD", "HDD", "Laptop Scrren", "Desktop Scrren", "SMPS", "Router", "RAM"],
        subOptionType: "select",
        subOptionLabel: "Select Replacement"
    },

    "Dead / No Power": {},
    "No Display": {},
    "Hinge Repair": {},
    "Dump Error": {},
    "Beep Sound": {},
    "Battery Issue": {},
    "HDD / SSD Issue": {},
    "Screen Issue": {},
    "Booting Issue": {},
    "Head Block": {},
    "Paper Jam": {},
    "Moulding / ABH": {},
    "Keyboard / Touchpad": {},
    "Keyboard Replacement": {},
    "Battery Replacement": {}
};

        const deviceTypeOptions = ["CPU", "Laptop", "Printer", "All-in-One", "Toner", "UPS", "Speaker", "Monitor", "TV", "Charger", "CCTV", "DVR", "NVR", "Projector", "Attendence Device", "Keyboard", "Mouse", "Combo", "Motherboard", "RAM", "HDD", "SSD", "Battery", "Switch", "Cables", "SMPS", "Router", "Wifi Adaptor", "Converter", "Enternal HDD", "Adaptor", "UPS Battery"];
        
        const currentStatusOptions = ["Pending Diagnosis", "Working", "Repaired", "Water Damaged", "Awaiting Approval", "Software Issue", "Data issue", "Hardware Issue", "Given for Replacement", "Ready", "Dead"];
        const finalStatusOptions = ["Not Delivered", "Delivered", "Returned"];
        const customerStatusOptions = ["Not Called", "Called", "Called - No Response", "Called - Will Visit", "Called - Not pickup yet"];
        const materialStatusOptions = ["Installed", "Ordered", "Pending", "Customer Provided", "Not Available"];

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
            reportedProblems: document.getElementById('reported-problems'), 
            serviceNote: document.getElementById('service-note'),
            estimateAmount: document.getElementById('estimate-amount'),
            engineerKundan: document.getElementById('engineer-kundan'), engineerRushi: document.getElementById('engineer-rushi'),
            engineerSachin: document.getElementById('engineer-sachin'),
            saveRecordBtn: document.getElementById('save-record-btn'),
            sendWhatsAppBtn: document.getElementById('send-whatsapp-btn'),
            newJobBtn: document.getElementById('new-job-btn'),
            totalJobsStat: document.getElementById('total-jobs-stat'), pendingJobsStat: document.getElementById('pending-jobs-stat'),
            workingJobsStat: document.getElementById('working-jobs-stat'), deliveredJobsStat: document.getElementById('delivered-jobs-stat'),
            notDeliveredJobsStat: document.getElementById('not-delivered-jobs-stat'),
            pendingInwardStat: document.getElementById('pending-inward-stat'),
            rahulSirPendingStat: document.getElementById('rahul-sir-pending-stat'),
            recentJobsTableBody: document.getElementById('recent-jobs-table-body'),
            jobSheetHeaderActions: document.getElementById('job-sheet-header-actions'),
            allJobsHeaderActions: document.getElementById('all-jobs-header-actions'),
            jobNoSearchBox: document.getElementById('job-no-search-box'),
            mobileNoSearchBox: document.getElementById('mobile-no-search-box'),
            downloadExcelBtn: document.getElementById('download-excel-btn'),
            allJobsTableBody: document.getElementById('all-jobs-table-body'),
            allJobsPagination: document.getElementById('all-jobs-pagination'),
            outwardFormTitle: document.getElementById('outward-form-title'), partyName: document.getElementById('party-name'),
            addPartyBtn: document.getElementById('add-party-btn'),
            materialDesc: document.getElementById('material-desc'), outwardDate: document.getElementById('outward-date'),
            inwardDate: document.getElementById('inward-date'), saveOutwardBtn: document.getElementById('save-outward-btn'),
            cancelOutwardEditBtn: document.getElementById('cancel-outward-edit-btn'),
            jobNoOutward: document.getElementById('job-no-outward'),
            outwardCustomerName: document.getElementById('outward-customer-name'),
            newOutwardBtn: document.getElementById('new-outward-btn'),
            inwardOutwardHeaderActions: document.getElementById('inward-outward-header-actions'),
            allInOutHeaderActions: document.getElementById('all-in-out-header-actions'),
            allInOutSearchBox: document.getElementById('all-in-out-search-box'),
            downloadAllInOutExcelBtn: document.getElementById('download-all-in-out-excel-btn'),
            allInOutTableBody: document.getElementById('all-in-out-table-body'),
            allInOutPagination: document.getElementById('all-in-out-pagination'),
            materialsTableBody: document.getElementById('materials-table-body'),
            addMaterialBtn: document.getElementById('add-material-btn'),
            currentStatus: document.getElementById('current-status'),
            finalStatus: document.getElementById('final-status'),
            customerStatus: document.getElementById('customer-status'),
            filterToggleBtn: document.getElementById('filter-toggle-btn'),
            filterPopup: document.getElementById('job-range-filters'),
            filterBtnLabel: document.getElementById('filter-btn-label'),
            deviceFilterBtn: document.getElementById('device-filter-btn'),
            statusFilterBtn: document.getElementById('status-filter-btn'),
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
                    DOMElements.allInOutHeaderActions.style.display = 'none';
                    
                    // Reset filters when changing pages
                    handleAllJobsSearch(null);


                    if (page === 'job-sheet') {
                        DOMElements.jobSheetHeaderActions.style.display = 'flex';
                    } else if (page === 'all-jobs') {
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
            DOMElements.saveRecordBtn.addEventListener('click', saveJobSheet);
            DOMElements.sendWhatsAppBtn.addEventListener('click', sendWhatsAppMessage);
            DOMElements.newJobBtn.addEventListener('click', clearJobSheetForm);
            DOMElements.saveOutwardBtn.addEventListener('click', saveOutwardRecord);
            DOMElements.cancelOutwardEditBtn.addEventListener('click', clearOutwardForm);
            DOMElements.newOutwardBtn.addEventListener('click', () => {
                 document.querySelector('.nav-link[data-page="inward-outward"]').click();
            });
            DOMElements.logoutBtn.addEventListener('click', () => auth.signOut());
            DOMElements.jobNoSearchBox.addEventListener('input', () => handleAllJobsSearch(null));
            DOMElements.mobileNoSearchBox.addEventListener('input', () => handleAllJobsSearch(null));
            DOMElements.allInOutSearchBox.addEventListener('input', () => handleAllInOutSearch(null));
            DOMElements.downloadExcelBtn.addEventListener('click', downloadJobsAsExcel);
            DOMElements.downloadAllInOutExcelBtn.addEventListener('click', downloadAllInOutAsExcel);
            DOMElements.jobNoOutward.addEventListener('input', autofillOutwardFromJob);
            
            DOMElements.filterToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                DOMElements.filterPopup.classList.toggle('visible');
            });
            
            DOMElements.addPartyBtn.addEventListener('click', async () => {
                const newParty = prompt("Enter the new party name:");
                if (newParty && newParty.trim() !== '') {
                    const trimmedParty = toTitleCase(newParty.trim());
                    await addSuggestion(trimmedParty, 'parties');
                    DOMElements.partyName.value = trimmedParty;
                    alert(`Party "${trimmedParty}" added successfully!`);
                }
            });
    
            document.addEventListener('click', (e) => {
                if (!DOMElements.filterPopup.contains(e.target) && !DOMElements.filterToggleBtn.contains(e.target)) {
                    DOMElements.filterPopup.classList.remove('visible');
                }
            });

            setupAutocomplete(DOMElements.brandName, brandSuggestions);
            setupAutocomplete(DOMElements.partyName, partySuggestions);
            setupMaterialsTable();
            setupDashboardCardClickListeners();
            setupSmartFilters();
        }
        
        function setupSmartFilters() {
            DOMElements.deviceFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const options = ["CPU", "Laptop", "Printer", "Toner", "All-in-One"];
                showFilterPopup(e.currentTarget, 'deviceType', options);
            });
        
            DOMElements.statusFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const options = [...new Set(allJobSheets.map(j => j.currentStatus).filter(Boolean))];
                options.sort();
                showFilterPopup(e.currentTarget, 'currentStatus', options);
            });
        }
        
        function showFilterPopup(button, filterKey, options) {
            const existingPopup = document.querySelector('.filter-popup-dynamic');
            if (existingPopup) existingPopup.remove();
        
            const popup = document.createElement('div');
            popup.className = 'filter-popup-dynamic';
            
            const allButton = document.createElement('button');
            allButton.textContent = 'All';
            allButton.onclick = () => {
                handleAllJobsSearch({ type: filterKey, value: null });
                popup.remove();
            };
            popup.appendChild(allButton);
        
            options.forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.textContent = option;
                optionButton.onclick = () => {
                    handleAllJobsSearch({ type: filterKey, value: option });
                    popup.remove();
                };
                popup.appendChild(optionButton);
            });
        
            document.body.appendChild(popup);
            const rect = button.getBoundingClientRect();
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
            popup.style.left = `${rect.left + window.scrollX}px`;
        
            setTimeout(() => {
                document.addEventListener('click', function closePopup(event) {
                    if (!popup.contains(event.target)) {
                        popup.remove();
                        document.removeEventListener('click', closePopup);
                    }
                });
            }, 0);
        }

        function setupDashboardCardClickListeners() {
            document.querySelectorAll('.clickable-card').forEach(card => {
                card.addEventListener('click', () => {
                    const filterType = card.dataset.filterType;
                    const filterValue = card.dataset.filterValue;

                    if (filterType === 'inward-outward') {
                        document.querySelector('.nav-link[data-page="all-in-out"]').click();
                        const outwardFilter = { value: filterValue };
                        handleAllInOutSearch(outwardFilter);
                    } else {
                        const jobFilter = { type: filterType, value: filterValue };
                        document.querySelector('.nav-link[data-page="all-jobs"]').click();
                        DOMElements.jobNoSearchBox.value = '';
                        DOMElements.mobileNoSearchBox.value = '';
                        handleAllJobsSearch(jobFilter);
                    }
                });
            });
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
            const container = DOMElements.reportedProblems;
            container.innerHTML = '';
        
            for (const problem in problemOptionsConfig) {
                const config = problemOptionsConfig[problem];
                const problemId = problem.replace(/[\s/]+/g, '-');
        
                const itemWrapper = document.createElement('div');
                itemWrapper.className = 'problem-item';
        
                let mainCheckboxHTML = `
                    <div class="problem-main">
                        <input type="checkbox" id="problem-${problemId}" value="${problem}">
                        <label for="problem-${problemId}">${problem}</label>
                    </div>`;
        
                let subOptionsHTML = '';
                if (config.subOptions) {
                    const subOptionsId = `sub-options-${problemId}`;
                    const selectOptions = config.subOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                    subOptionsHTML = `
                        <div class="problem-sub-options" id="${subOptionsId}">
                            <label for="select-${problemId}">${config.subOptionLabel}</label>
                            <select id="select-${problemId}" class="select-field">${selectOptions}</select>
                        </div>`;
                }
        
                itemWrapper.innerHTML = mainCheckboxHTML + subOptionsHTML;
                container.appendChild(itemWrapper);
        
                if (config.subOptions) {
                    const checkbox = itemWrapper.querySelector(`#problem-${problemId}`);
                    const subOptionsDiv = itemWrapper.querySelector(`#sub-options-${problemId}`);
                    checkbox.addEventListener('change', () => {
                        subOptionsDiv.style.display = checkbox.checked ? 'block' : 'none';
                    });
                }
            }
        }

        function setInitialDate() {
            const today = new Date().toISOString().split('T')[0];
            DOMElements.date.value = today;
            DOMElements.outwardDate.value = today;
        }

        function listenForSuggestions(collectionName, initialArray, targetArray) {
            db.collection(collectionName).onSnapshot(snapshot => {
                const dbSuggestions = snapshot.docs.map(doc => doc.data().name);
                const combined = [...new Set([...initialArray, ...dbSuggestions])].sort();
                // Clear and repopulate the target array
                targetArray.length = 0;
                Array.prototype.push.apply(targetArray, combined);
            }, error => {
                console.error(`Error listening for ${collectionName} suggestions:`, error);
            });
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
                const recentJobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderRecentJobsTable(recentJobs);
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

        function setupMaterialsTable() {
            DOMElements.addMaterialBtn.addEventListener('click', () => addMaterialRow());
            DOMElements.materialsTableBody.addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-material-btn')) {
                    e.target.closest('tr').remove();
                }
            });
        }

        function addMaterialRow(material = {}) {
            const row = document.createElement('tr');
            const statusOptionsHTML = materialStatusOptions.map(opt => 
                `<option value="${opt}" ${material.status === opt ? 'selected' : ''}>${opt}</option>`
            ).join('');

            row.innerHTML = `
                <td><div class="autocomplete"><input type="text" class="input-field part-name" placeholder="e.g., SSD" value="${material.name || ''}"></div></td>
                <td><input type="text" class="input-field part-details" placeholder="e.g., Samsung 256GB" value="${material.details || ''}"></td>
                <td><input type="number" class="input-field part-qty" placeholder="1" value="${material.qty || '1'}"></td>
                <td><select class="select-field part-status">${statusOptionsHTML}</select></td>
                <td><button class="remove-material-btn">&times;</button></td>
            `;
            DOMElements.materialsTableBody.appendChild(row);
            const partNameInput = row.querySelector('.part-name');
            setupAutocomplete(partNameInput, partNameSuggestions);
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
        
        function getReportedProblems() {
            const problems = [];
            document.querySelectorAll('#reported-problems .problem-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox.checked) {
                    const problemName = checkbox.value;
                    const subOptionsSelect = item.querySelector('select');
                    if (subOptionsSelect) {
                        problems.push(`${problemName}: ${subOptionsSelect.value}`);
                    } else {
                        problems.push(problemName);
                    }
                }
            });
            return problems;
        }

        function renderMaterialsTable(materials = []) {
            DOMElements.materialsTableBody.innerHTML = '';
            if (materials && materials.length > 0) {
                materials.forEach(addMaterialRow);
            }
        }

        function renderRecentJobsTable(jobs) {
            DOMElements.recentJobsTableBody.innerHTML = jobs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 1rem;">No recent activity.</td></tr>` :
            jobs.map(job => `
                <tr>
                    <td>${job.jobSheetNo}</td>
                    <td title="${job.customerName}">${job.customerName}</td>
                    <td title="${job.deviceType}">${job.deviceType}</td>
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
                    <td>${job.deviceType}</td>
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
                } else if (activeDashboardFilter.type === 'deviceType') {
                    tempFilteredJobs = tempFilteredJobs.filter(job => job.deviceType === activeDashboardFilter.value);
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

        function clearJobSheetForm() {
            currentEditingJobId = null;
            const fieldsToClear = [DOMElements.jobSheetNo, DOMElements.oldJobSheetNo, DOMElements.customerName, DOMElements.customerMobile, DOMElements.altMobile, DOMElements.brandName, DOMElements.serviceNote, DOMElements.estimateAmount];
            fieldsToClear.forEach(el => el.value = '');
            
            [DOMElements.deviceType, DOMElements.currentStatus, DOMElements.finalStatus, DOMElements.customerStatus].forEach(el => el.selectedIndex = 0);
            
            document.querySelectorAll('#reported-problems input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                const problemId = cb.value.replace(/[\s/]+/g, '-');
                const subOptionsDiv = document.getElementById(`sub-options-${problemId}`);
                if (subOptionsDiv) {
                    subOptionsDiv.style.display = 'none';
                }
            });

            DOMElements.engineerKundan.checked = false; 
            DOMElements.engineerSachin.checked = false;
            DOMElements.engineerRushi.checked = false;
            
            renderMaterialsTable([]);

            setInitialDate();
            DOMElements.saveRecordBtn.textContent = 'Save Record';
            DOMElements.saveRecordBtn.classList.remove('update-btn');
        }

        async function saveJobSheet() {
            const jobSheetNo = Number(DOMElements.jobSheetNo.value.trim() || 0);

            if (!currentEditingJobId && allJobSheets.some(job => job.jobSheetNo === jobSheetNo)) {
                alert("Error: Job Sheet Number " + jobSheetNo + " already exists. Please use a different number.");
                return;
            }
            
            const engineers = [];
            if (DOMElements.engineerKundan.checked) engineers.push("Kundan Sir");
            if (DOMElements.engineerSachin.checked) engineers.push("Sachin Sir");
            if (DOMElements.engineerRushi.checked) engineers.push("Rushi");

            const jobData = {
                jobSheetNo: jobSheetNo,
                oldJobSheetNo: DOMElements.oldJobSheetNo.value.trim(),
                date: DOMElements.date.value,
                customerName: toTitleCase(DOMElements.customerName.value.trim()),
                customerMobile: DOMElements.customerMobile.value.trim(),
                altMobile: DOMElements.altMobile.value.trim(),
                deviceType: DOMElements.deviceType.value,
                brandName: toTitleCase(DOMElements.brandName.value.trim()),
                reportedProblems: getReportedProblems(),
                serviceNote: DOMElements.serviceNote.value.trim(),
                materials: getMaterials(),
                currentStatus: DOMElements.currentStatus.value,
                finalStatus: DOMElements.finalStatus.value,
                customerStatus: DOMElements.customerStatus.value,
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
                
                await addSuggestion(jobData.brandName, 'brands');
                for (const mat of jobData.materials) { await addSuggestion(mat.name, 'partNames'); }
                
                clearJobSheetForm();
                document.querySelector('.nav-link[data-page="dashboard"]').click();
            } catch (error) { console.error("Error saving job sheet: ", error); alert("Error saving record."); }
        }
        
        function sendWhatsAppMessage() {
            const customerName = DOMElements.customerName.value.trim();
            const jobSheetNo = DOMElements.jobSheetNo.value.trim();
            const brandName = DOMElements.brandName.value.trim();
            const deviceType = DOMElements.deviceType.value;
            const estimateAmount = DOMElements.estimateAmount.value.trim();
            const customerMobile = DOMElements.customerMobile.value.trim();

            if (!customerMobile || !customerName || !jobSheetNo || !brandName || !deviceType || !estimateAmount) {
                alert('Please fill all the required fields to send a WhatsApp message.');
                return;
            }

            let phoneNumber = customerMobile;
            if (phoneNumber.length === 10 && !phoneNumber.startsWith('91')) {
                phoneNumber = '91' + phoneNumber;
            }

            const encodedCustomerName = encodeURIComponent(customerName);
            const encodedJobSheetNo = encodeURIComponent(jobSheetNo);
            const encodedBrandName = encodeURIComponent(brandName);
            const encodedDeviceType = encodeURIComponent(deviceType);
            const encodedEstimateAmount = encodeURIComponent(`₹${estimateAmount}`);

            const textParts = [
                `Hello, ${encodedCustomerName} %F0%9F%91%8B`, ``,
                `Your Job No: ${encodedJobSheetNo}`,
                `Your ${encodedBrandName} ${encodedDeviceType} is now ready %E2%9C%85`, ``,
                `%F0%9F%92%B0 Amount: ${encodedEstimateAmount}`, ``,
                `%F0%9F%93%8D Please collect your device between`,
                `10:30 AM – 07:30 PM`, ``,
                `Thank you,`, `Korus Computers`
            ];

            const finalMessage = textParts.join('%0A');
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${finalMessage}`;
            window.open(whatsappUrl, '_blank');
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
            DOMElements.deviceType.value = job.deviceType || '';
            DOMElements.brandName.value = job.brandName || '';
            DOMElements.serviceNote.value = job.serviceNote || '';
            DOMElements.estimateAmount.value = job.estimateAmount || '';
            DOMElements.currentStatus.value = job.currentStatus || '';
            DOMElements.finalStatus.value = job.finalStatus || '';
            DOMElements.customerStatus.value = job.customerStatus || '';

            (job.reportedProblems || []).forEach(problemStr => {
                const [mainProblem, subOption] = problemStr.split(': ');
                const problemId = mainProblem.replace(/[\s/]+/g, '-');
                const checkbox = document.querySelector(`#problem-${problemId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const subOptionsDiv = document.getElementById(`sub-options-${problemId}`);
                    if (subOptionsDiv) {
                        subOptionsDiv.style.display = 'block';
                        const select = subOptionsDiv.querySelector('select');
                        if (select && subOption) select.value = subOption;
                    }
                }
            });

            DOMElements.engineerKundan.checked = job.engineers?.includes("Kundan Sir") || false;
            DOMElements.engineerSachin.checked = job.engineers?.includes("Sachin Sir") || false;
            DOMElements.engineerRushi.checked = job.engineers?.includes("Rushi") || false;
            
            renderMaterialsTable(job.materials);
            
            DOMElements.saveRecordBtn.textContent = 'Update Record';
            DOMElements.saveRecordBtn.classList.add('update-btn');
            document.querySelector('.nav-link[data-page="job-sheet"]').click();
        }

        async function deleteJob(id) {
            const password = prompt("To delete this job, please enter the password:");
            if (password === "KC21") {
                await db.collection("jobSheets").doc(id).delete();
                showSuccessModal("Job Sheet Deleted!");
            } else if (password !== null) {
                alert("Incorrect password. Deletion cancelled.");
            }
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
                    DOMElements.materialDesc.value = `${job.brandName} ${job.deviceType}`;
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
            document.getElementById('success-message').textContent = message;
            modal.classList.add('visible');
            setTimeout(() => modal.classList.remove('visible'), 2000);
        }

        function downloadJobsAsExcel() {
            const dataToExport = allJobSheets.map(job => ({
                "Job No": job.jobSheetNo, "Old Job No": job.oldJobSheetNo, "Date": formatDate(job.date),
                "Customer Name": job.customerName, "Mobile": job.customerMobile, "Alt Mobile": job.altMobile,
                "Device Type": job.deviceType, "Brand": job.brandName,
                "Problems": (job.reportedProblems || []).join(', '),
                 "Service Note": job.serviceNote,
                "Materials Used": (job.materials || []).map(m => `${m.qty}x ${m.name} (${m.details || 'N/A'}) - ${m.status}`).join('; '),
                "Current Status": job.currentStatus,
                "Final Status": job.finalStatus,
                "Customer Status": job.customerStatus,
                "Engineer(s)": (job.engineers || []).join(', '),
                "Estimate Amount": job.estimateAmount,
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobSheets");
            XLSX.writeFile(workbook, "Korus_Job_Sheets_Export.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        function downloadAllInOutAsExcel() {
            const dataToExport = allOutwardRecords.map(r => ({
                 "Job No": r.jobNo,
                "Party Name": r.partyName, 
                "Customer Name": r.customerName,
                "Material": r.material, "Outward Date": formatDate(r.outwardDate),
                "Inward Date": r.inwardDate ? formatDate(r.inwardDate) : 'Pending',
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "AllInwardOutward");
            XLSX.writeFile(workbook, "Korus_All_Inward_Outward_Export.xlsx");
            showSuccessModal("Downloading Excel file...");
        }

        window.app = { editJob, deleteJob, editOutward, deleteOutward, changeAllJobsPage, changeAllInOutPage };
        init();
    }
});

