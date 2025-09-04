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

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

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

    async function loadUserProfile(user) {
        try {
            const query = await db.collection('users').where('uid', '==', user.uid).limit(1).get();
            const welcomeEl = document.getElementById('welcome-message');
            if (!query.empty) {
                const userData = query.docs[0].data();
                welcomeEl.textContent = `Welcome, ${userData.displayName.split(' ')[0]}`;
            } else {
                welcomeEl.textContent = 'Welcome, User';
            }
        } catch (error) { console.error("Error fetching user profile:", error); }
    }

    function initializeApp() {
        let allJobSheets = [], allOutwardRecords = [], filteredJobs = [], filteredOutwards = [];
        let allJobsCurrentPage = 1, allInOutCurrentPage = 1;
        const itemsPerPage = 10;
        let currentEditingJobId = null, currentEditingOutwardId = null;
        let currentJobRangeFilter = 'all';
        let tempDeviceProblems = {}; // To hold problems for devices before saving

        const initialBrandOptions = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Intex", "I-Ball", "Apple (MacBook)", "MSI", "Samsung", "Canon", "Epson", "Brother", "TVS"];
        const initialPartyOptions = ["Rahul Sir", "Shree Enterprises", "San infotech", "Audio video care", "Rx service centre", "Nate", "DSK"];
        const initialPartNames = ["SSD", "RAM", "Keyboard", "Battery", "Screen", "Toner", "Motherboard", "Adapter", "CPU Fan"];
        let brandSuggestions = [...initialBrandOptions], partySuggestions = [...initialPartyOptions], partNameSuggestions = [...initialPartNames];

        const problemOptionsConfig = {
            "General": {
                problems: ["Dead / No Power", "No Display", "Moulding / ABH", "HDD / SSD Issue", "Data Backup", "Password Crack / Reset", "OS Recovery", "Hang / Stuck Issue", "Overheating", "RAM Issue", "Keyboard / Touchpad", "Battery Issue", "Screen Issue", "Booting Issue", "Dump Error", "Beep Sound", "Other"]
            },
            "Formatting": {
                subOptions: ["Windows 7", "Windows 8", "Windows 10", "Windows 11", "Windows XP", "Ubantu", "Mac OS", "Other"],
                subOptionType: "checkbox", subOptionLabel: "Select OS"
            },
            "Software Installation": {
                subOptions: ["AutoCAD", "CATIA", "SolidWorks", "PowerMill", "CoralDraw", "SolidEdge", "Premiere Pro", "After Effect", "MasterCam", "SketchUp", "Photoshop", "MS Office", "Tally Prime", "Tally ERP9", "Other"],
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
            "Printer Issues": {
                subOptions: ["Paper Jam", "Head Cleaning", "Servicing", "Head Block", "Low Ink/Toner", "Slow Printing", "Faded Printouts", "Strange Noises", "Blank Pages Printing", "Paper Misfeed", "Scanner Not Working", "Other"],
                subOptionType: "select", subOptionLabel: "Select Printer Issue"
            },
            "Hardware Issues": {
                subOptions: ["Mic Not Working", "Camera Not Working", "USB Port Issue", "DC Jack Issue", "Speaker Issue", "SMPS Issue", "CPU Fan Issue", "WiFi Not Working", "LAN Port Issue", "HDMI / VGA Port Issue", "BIOS Current", "CMOS Issue", "Auto Shutdown", "Auto Restart", "Bluetooth Issue", "Power Button Issue", "Other"],
                subOptionType: "select", subOptionLabel: "Select Hardware Issue"
            },
        };
        const deviceTypeOptions = ["CPU", "Laptop", "Printer", "All-in-One", "Toner", "UPS", "Monitor", "TV", "Charger", "CCTV", "DVR", "Motherboard", "RAM", "HDD", "SSD", "Battery", "SMPS", "Router", "Other"];
        const currentStatusOptions = ["Pending Diagnosis", "Working", "Repaired", "Water Damaged", "Awaiting Approval", "Ready", "Dead"];
        const finalStatusOptions = ["Not Delivered", "Delivered", "Returned"];
        const customerStatusOptions = ["Not Called", "Called", "Called - No Response", "Called - Will Visit"];
        const materialStatusOptions = ["Installed", "Ordered", "Pending", "Customer Provided", "Not Available"];

        // DOM Elements cache
        const DOMElements = {
            jobSheetPage: document.getElementById('job-sheet-page'),
            devicesTableBody: document.getElementById('devices-table-body'),
            addDeviceBtn: document.getElementById('add-device-btn'),
            jobSheetNo: document.getElementById('job-sheet-no'),
            oldJobSheetNo: document.getElementById('old-job-sheet-no'),
            date: document.getElementById('date'),
            customerName: document.getElementById('customer-name'),
            customerMobile: document.getElementById('customer-mobile'),
            altMobile: document.getElementById('alt-mobile'),
            serviceNote: document.getElementById('service-note'),
            materialsTableBody: document.getElementById('materials-table-body'),
            addMaterialBtn: document.getElementById('add-material-btn'),
            currentStatus: document.getElementById('current-status'),
            finalStatus: document.getElementById('final-status'),
            customerStatus: document.getElementById('customer-status'),
            estimateAmount: document.getElementById('estimate-amount'),
            engineerKundan: document.getElementById('engineer-kundan'),
            engineerSachin: document.getElementById('engineer-sachin'),
            engineerRushi: document.getElementById('engineer-rushi'),
            saveRecordBtn: document.getElementById('save-record-btn'),
            sendWhatsAppBtn: document.getElementById('send-whatsapp-btn'),
            problemModal: document.getElementById('problem-modal'),
            problemModalBody: document.getElementById('problem-modal-body'),
            modalDeviceName: document.getElementById('modal-device-name'),
            modalSaveBtn: document.getElementById('modal-save-btn'),
            modalCancelBtn: document.getElementById('modal-cancel-btn'),
        };

        function toTitleCase(str) { return str ? str.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase()) : ''; }

        function init() {
            setupNavigation();
            setupClock();
            setupTheme();
            setupEventListeners();
            populateSelects();
            buildProblemModal();
            setInitialDate();
            loadInitialData();
            addDeviceRow();
        }

        function setupEventListeners() {
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
            document.getElementById('new-job-btn').addEventListener('click', clearJobSheetForm);
            DOMElements.addDeviceBtn.addEventListener('click', () => addDeviceRow());
            DOMElements.devicesTableBody.addEventListener('click', handleDevicesTableClick);
            DOMElements.addMaterialBtn.addEventListener('click', () => addMaterialRow());
            DOMElements.materialsTableBody.addEventListener('click', e => { if (e.target.classList.contains('remove-material-btn')) e.target.closest('tr').remove(); });
            DOMElements.saveRecordBtn.addEventListener('click', saveJobSheet);
            DOMElements.sendWhatsAppBtn.addEventListener('click', sendWhatsAppMessage);
            DOMElements.modalSaveBtn.addEventListener('click', handleSaveProblems);
            DOMElements.modalCancelBtn.addEventListener('click', () => DOMElements.problemModal.classList.remove('visible'));
        }

        function handleDevicesTableClick(e) {
            if (e.target.classList.contains('remove-material-btn')) {
                e.target.closest('tr').remove();
            } else if (e.target.id === 'add-problem-btn') {
                const deviceRow = e.target.closest('tr');
                const rowIndex = deviceRow.rowIndex - 1;
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

            // Populate modal with existing problems for this device
            const existingProblems = tempDeviceProblems[rowIndex] || [];
            existingProblems.forEach(problemStr => {
                const [mainProblem, subOptionsStr] = problemStr.split(': ');
                const problemId = mainProblem.replace(/[\s/]+/g, '-');
                const checkbox = DOMElements.problemModalBody.querySelector(`#problem-${problemId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const subOptionsDiv = DOMElements.problemModalBody.querySelector(`#sub-options-${problemId}`);
                    if (subOptionsDiv) {
                        subOptionsDiv.style.display = 'block';
                        if (subOptionsStr) {
                            subOptionsStr.split(', ').forEach(subOpt => {
                                const subInput = subOptionsDiv.querySelector(`input[value="${subOpt}"], select`);
                                if (subInput.type === 'checkbox') subInput.checked = true;
                                else subInput.value = subOpt;
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
                const config = problemOptionsConfig[Object.keys(problemOptionsConfig).find(k => k.replace(/[\s/]+/g, '-') === cb.dataset.key)];
                
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
                jobSheetNo: jobSheetNo, oldJobSheetNo: DOMElements.oldJobSheetNo.value.trim(), date: DOMElements.date.value,
                customerName: toTitleCase(DOMElements.customerName.value.trim()), customerMobile: DOMElements.customerMobile.value.trim(),
                altMobile: DOMElements.altMobile.value.trim(), devices: devices, serviceNote: DOMElements.serviceNote.value.trim(),
                materials: getMaterials(), currentStatus: DOMElements.currentStatus.value, finalStatus: DOMElements.finalStatus.value,
                customerStatus: DOMElements.customerStatus.value, estimateAmount: parseFloat(DOMElements.estimateAmount.value) || 0,
                engineers: engineers, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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

            addMaterialRow(); // Clear and add one empty row
            (job.materials || []).forEach(mat => addMaterialRow(mat));
            
            DOMElements.saveRecordBtn.textContent = 'Update Record';
            DOMElements.saveRecordBtn.classList.add('update-btn');
            document.querySelector('.nav-link[data-page="job-sheet"]').click();
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
            DOMElements.jobSheetPage.querySelector('form') ? DOMElements.jobSheetPage.querySelector('form').reset() : DOMElements.jobSheetPage.querySelectorAll('input, select, textarea').forEach(el => el.value = '');
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
                
                if (config.problems) { // Simple checkbox list
                    html += `<div class="problem-checkbox-grid">`;
                    config.problems.forEach(problem => {
                        const problemId = problem.replace(/[\s/]+/g, '-');
                        html += `<div class="problem-item"><input type="checkbox" class="problem-main-checkbox" id="problem-${problemId}" data-key="${problemId}" value="${problem}"><label for="problem-${problemId}">${problem}</label></div>`;
                    });
                    html += `</div>`;
                } else { // Main problem with sub-options
                     html += `<div class="problem-item"><input type="checkbox" class="problem-main-checkbox" id="problem-${categoryKey}" data-key="${categoryKey}" value="${category}"><label for="problem-${categoryKey}">${category}</label></div>`;
                     let subOptionsHTML = '';
                     if(config.subOptionType === 'checkbox') {
                         subOptionsHTML = config.subOptions.map(opt => `<div class="problem-item"><input type="checkbox" value="${opt}"><label>${opt}</label></div>`).join('');
                         html += `<div class="problem-sub-options" id="sub-options-${categoryKey}"><label>${config.subOptionLabel}</label><div class="sub-checkbox-grid">${subOptionsHTML}</div></div>`;
                     } else {
                         subOptionsHTML = config.subOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                         html += `<div class="problem-sub-options" id="sub-options-${categoryKey}"><label>${config.subOptionLabel}</label><select class="select-field">${subOptionsHTML}</select></div>`;
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
                <td><select class="select-field device-type">${deviceTypeOptions.map(opt => `<option value="${opt}" ${device.type === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select></td>
                <td><div class="autocomplete"><input type="text" class="input-field device-brand" placeholder="e.g., Dell, HP" value="${device.brand || ''}"></div></td>
                <td><div class="device-problems-list"><button id="add-problem-btn" class="action-btn secondary-btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">+ Problems</button></div></td>
                <td><button class="remove-material-btn">&times;</button></td>
            `;
            setupAutocomplete(row.querySelector('.device-brand'), brandSuggestions);
            if (!device.problems) {
                tempDeviceProblems[rowIndex] = [];
            }
        }
        
        // --- Other functions (unchanged for brevity, but they exist in a full implementation)
        // setupNavigation, setupClock, setupTheme, populateSelects, setInitialDate, loadInitialData, etc.
        // All search, pagination, outward/inward, and excel download functions are also assumed to exist.

        // Placeholder for functions not shown but needed for the app to run
        function setupNavigation() { /* ... */ }
        function setupClock() { /* ... */ }
        function setupTheme() { /* ... */ }
        function populateSelects() { /* ... */ }
        function setInitialDate() { DOMElements.date.value = new Date().toISOString().split('T')[0]; }
        function loadInitialData() { /* ... */ }
        function addMaterialRow(material = {}){ /* ... */ }
        function getMaterials(){ return []; }
        function showSuccessModal(msg) { alert(msg); }
        function sendWhatsAppMessage() { /* ... */ }
        function setupAutocomplete(input, suggestions) { /* ... */ }

        init(); // Start the app
    }
});
