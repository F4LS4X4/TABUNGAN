let transactionData = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentFilter = 'all';
let searchQuery = '';

const calendarGrid = document.getElementById('calendarGrid');
const monthYearDisplay = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const modal = document.getElementById('transactionModal');
const closeBtn = document.querySelector('.close');
const saveBtn = document.getElementById('saveBtn');
const transactionAmount = document.getElementById('transactionAmount');
const modalDateTitle = document.getElementById('modalDateTitle');
const convertDirectionGroup = document.getElementById('convertDirectionGroup');
let currentEditDate = null;

const hamburger = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebarBtn');

function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('show'); }
function closeSidebarFn() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
hamburger.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFn);
overlay.addEventListener('click', closeSidebarFn);

const calcModal = document.getElementById('calculatorModal');
const menuCalc = document.getElementById('menuCalculator');
const closeCalc = document.querySelector('.close-calc');
let calcDisplay = document.getElementById('calcDisplay');
let currentCalc = '0';

function evaluateSafe(expression) {
    try {
        const fn = new Function('return (' + expression + ')');
        let result = fn();
        if (isNaN(result) || !isFinite(result)) throw new Error();
        result = Math.round(result * 100) / 100;
        return result.toString();
    } catch {
        return 'Error';
    }
}
function validateCalcExpression(expr, newOp) {
    const trimmed = expr.trim();
    if (trimmed === '' || trimmed === '0') return false;
    const lastChar = trimmed.slice(-1);
    if ('+-*/'.includes(lastChar) && '+-*/'.includes(newOp)) return false;
    return true;
}
menuCalc.addEventListener('click', () => {
    calcModal.style.display = 'flex';
    currentCalc = '0';
    calcDisplay.value = '0';
});
closeCalc.addEventListener('click', () => calcModal.style.display = 'none');
document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (btn.classList.contains('operator')) {
            let op = btn.getAttribute('data-op');
            let ops = { '/': '/', '*': '*', '-': '-', '+': '+' };
            op = ops[op];
            if (currentCalc === '0') currentCalc = '0';
            if (validateCalcExpression(currentCalc, op)) {
                currentCalc += ` ${op} `;
                calcDisplay.value = currentCalc;
            } else {
                showToast('Operator tidak valid', 'error');
            }
        } else if (btn.id === 'calcClear') {
            currentCalc = '0';
            calcDisplay.value = '0';
        } else if (btn.id === 'calcEqual') {
            let expr = currentCalc.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            let result = evaluateSafe(expr);
            if (result === 'Error') {
                calcDisplay.value = 'Error';
                currentCalc = '0';
            } else {
                currentCalc = result;
                calcDisplay.value = result;
            }
        } else {
            let val = btn.getAttribute('data-val');
            if (currentCalc === '0' && val !== '.') currentCalc = val;
            else currentCalc += val;
            if (currentCalc.length > 20) {
                showToast('Angka terlalu panjang', 'error');
                currentCalc = currentCalc.slice(0, 20);
            }
            calcDisplay.value = currentCalc;
        }
    });
});

const notesModal = document.getElementById('notesModal');
const menuNotes = document.getElementById('menuNotes');
const closeNotes = document.querySelector('.close-notes');
let notes = [];
try {
    const savedNotes = localStorage.getItem('userNotes');
    notes = savedNotes ? JSON.parse(savedNotes) : [];
} catch { notes = []; }

function renderNotes() {
    const list = document.getElementById('notesList');
    if (!list) return;
    list.innerHTML = '';
    notes.forEach((note, idx) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = note;
        span.className = 'note-text';
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.className = 'edit-note';
        editBtn.onclick = () => {
            const newText = prompt('Edit catatan:', note);
            if (newText && newText.trim()) {
                notes[idx] = newText.trim();
                localStorage.setItem('userNotes', JSON.stringify(notes));
                renderNotes();
                showToast('Catatan diperbarui', 'success');
            }
        };
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '🗑️';
        delBtn.className = 'delete-note';
        delBtn.onclick = () => {
            notes.splice(idx, 1);
            localStorage.setItem('userNotes', JSON.stringify(notes));
            renderNotes();
            showToast('Catatan dihapus', 'success');
        };
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}
menuNotes.addEventListener('click', () => {
    notesModal.style.display = 'flex';
    renderNotes();
    closeSidebarFn();
});
closeNotes.addEventListener('click', () => notesModal.style.display = 'none');
document.getElementById('addNoteBtn').addEventListener('click', () => {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    if (text) {
        notes.push(text);
        localStorage.setItem('userNotes', JSON.stringify(notes));
        renderNotes();
        input.value = '';
        showToast('Catatan ditambahkan', 'success');
    } else showToast('Isi catatan terlebih dahulu', 'error');
});

const menuSavings = document.getElementById('menuSavings');
menuSavings.addEventListener('click', () => {
    const cashEl = document.getElementById('cashTotal').innerText;
    const saldoEl = document.getElementById('saldoTotal').innerText;
    const totalEl = document.getElementById('totalSavingAmount').innerText;
    showToast(`💵 Cash: ${cashEl} | 🏦 Saldo: ${saldoEl} | 💰 Total: ${totalEl}`, 'success');
    closeSidebarFn();
});

function formatRupiah(amount) {
    if (isNaN(amount) || amount === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function getValidNumber(value) {
    const num = parseInt(value);
    return isNaN(num) || num < 0 ? 0 : num;
}
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 2200);
}
function getCurrentSaldo() {
    let cashTotal = 0, saldoTotal = 0;
    for (let date in transactionData) {
        if (Array.isArray(transactionData[date])) {
            for (let t of transactionData[date]) {
                let amount = getValidNumber(t.amount);
                if (t.moneyType === 'cash') {
                    if (t.type === 'income') cashTotal += amount;
                    else if (t.type === 'expense') cashTotal -= amount;
                    else if (t.type === 'convert') {
                        if (t.direction === 'cashToSaldo') cashTotal -= amount;
                        else if (t.direction === 'saldoToCash') cashTotal += amount;
                    }
                } else if (t.moneyType === 'saldo') {
                    if (t.type === 'income') saldoTotal += amount;
                    else if (t.type === 'expense') saldoTotal -= amount;
                    else if (t.type === 'convert') {
                        if (t.direction === 'cashToSaldo') saldoTotal += amount;
                        else if (t.direction === 'saldoToCash') saldoTotal -= amount;
                    }
                }
            }
        }
    }
    return { cashTotal, saldoTotal };
}
function loadData() {
    try {
        const saved = localStorage.getItem('financialCalendar');
        transactionData = saved ? JSON.parse(saved) : {};
    } catch (e) {
        transactionData = {};
        showToast('Data rusak, menggunakan data baru', 'error');
    }
    limitHistorySize();
    updateSummaryAndTotal();
    renderHistory();
    updateTodayInfo();
}
function limitHistorySize(maxEntries = 1000) {
    let allTrans = [];
    for (let date in transactionData) {
        if (Array.isArray(transactionData[date])) {
            allTrans.push(...transactionData[date].map(t => ({ date, ...t })));
        }
    }
    if (allTrans.length > maxEntries) {
        allTrans.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        const keep = allTrans.slice(0, maxEntries);
        const newData = {};
        for (let t of keep) {
            if (!newData[t.date]) newData[t.date] = [];
            newData[t.date].push({ id: t.id, moneyType: t.moneyType, type: t.type, direction: t.direction, amount: t.amount, timestamp: t.timestamp });
        }
        transactionData = newData;
        saveDataImmediate();
    }
}
function saveDataImmediate() {
    localStorage.setItem('financialCalendar', JSON.stringify(transactionData));
}
function saveData() {
    limitHistorySize();
    saveDataImmediate();
    updateSummaryAndTotal();
    renderCalendar();
    renderHistory();
}
function updateSummaryAndTotal() {
    let { cashTotal, saldoTotal } = getCurrentSaldo();
    document.getElementById('cashTotal').textContent = formatRupiah(cashTotal);
    document.getElementById('saldoTotal').textContent = formatRupiah(saldoTotal);
    document.getElementById('totalSavingAmount').textContent = formatRupiah(cashTotal + saldoTotal);
}
function updateTodayInfo() {
    const t = new Date();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const todayText = document.getElementById('todayDateText');
    if (todayText) todayText.innerHTML = `${dayNames[t.getDay()]}, ${t.getDate()} ${monthNames[t.getMonth()]} ${t.getFullYear()}`;
}
function renderHistory() {
    let all = [];
    for (let date in transactionData) {
        if (Array.isArray(transactionData[date])) {
            for (let t of transactionData[date]) {
                const parts = date.split('-');
                const localDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
                const formattedDate = localDate.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
                all.push({ date, formattedDate, ...t });
            }
        }
    }
    all.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (currentFilter !== 'all') {
        if (currentFilter === 'cash') all = all.filter(t => t.moneyType === 'cash');
        else if (currentFilter === 'saldo') all = all.filter(t => t.moneyType === 'saldo');
        else if (currentFilter === 'income') all = all.filter(t => t.type === 'income');
        else if (currentFilter === 'expense') all = all.filter(t => t.type === 'expense');
        else if (currentFilter === 'convert') all = all.filter(t => t.type === 'convert');
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        all = all.filter(t => {
            const jenis = t.moneyType === 'cash' ? 'cash' : (t.type === 'convert' ? 'konversi' : 'saldo');
            const tipe = t.type === 'income' ? 'pemasukan' : (t.type === 'expense' ? 'pengeluaran' : (t.direction === 'cashToSaldo' ? 'cash ke saldo' : 'saldo ke cash'));
            return t.formattedDate.toLowerCase().includes(q) ||
                   formatRupiah(t.amount).toLowerCase().includes(q) ||
                   jenis.includes(q) ||
                   tipe.includes(q);
        });
    }
    document.getElementById('historyStats').textContent = `Total: ${all.length} transaksi`;
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;
    if (all.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada transaksi</td></tr>'; return; }
    tbody.innerHTML = '';
    all.forEach(t => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = t.formattedDate;
        let jenisBadge = t.moneyType === 'cash' ? 'cash-badge' : (t.type === 'convert' ? 'convert-badge' : 'saldo-badge');
        let jenisText = t.moneyType === 'cash' ? '💵 Cash' : (t.type === 'convert' ? '🔄 Konversi' : '🏦 Saldo');
        row.insertCell(1).innerHTML = `<span class="${jenisBadge}">${jenisText}</span>`;
        let tipeText = t.type === 'income' ? '📈 Pemasukan' : (t.type === 'expense' ? '📉 Pengeluaran' : (t.direction === 'cashToSaldo' ? '🔄 Cash → Saldo' : '🔄 Saldo → Cash'));
        let tipeClass = t.type === 'income' ? 'transaction-income-badge' : (t.type === 'expense' ? 'transaction-expense-badge' : 'transaction-convert-badge');
        row.insertCell(2).innerHTML = `<span class="${tipeClass}">${tipeText}</span>`;
        row.insertCell(3).innerHTML = formatRupiah(t.amount);
        row.insertCell(4).innerHTML = new Date(t.timestamp).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    });
}
function renderCalendar() {
    const year = currentYear, month = currentMonth;
    const firstDay = new Date(year, month, 1);
    let startOffset = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = '';
    const weekdays = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
    weekdays.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-weekday';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    const todayDate = today.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const transactions = transactionData[dateKey] || [];
        const isToday = (isCurrentMonth && d === todayDate);
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${transactions.length ? 'has-transaction' : ''} ${isToday ? 'today' : ''}`;
        const numDiv = document.createElement('div');
        numDiv.className = 'day-number';
        numDiv.textContent = d;
        dayDiv.appendChild(numDiv);
        if (transactions.length) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'transaction-info';
            for (let i = 0; i < Math.min(transactions.length, 2); i++) {
                const t = transactions[i];
                const line = document.createElement('div');
                let colorClass = t.type === 'income' ? 'transaction-income' : (t.type === 'expense' ? 'transaction-expense' : 'transaction-convert');
                line.className = `transaction-item ${colorClass}`;
                let symbol = t.type === 'income' ? '↑' : (t.type === 'expense' ? '↓' : (t.direction === 'cashToSaldo' ? '💵→🏦' : '🏦→💵'));
                line.innerHTML = `${t.moneyType === 'cash' ? '💵' : '🏦'} ${symbol} ${formatRupiah(t.amount)}`;
                infoDiv.appendChild(line);
            }
            if (transactions.length > 2) {
                const more = document.createElement('div');
                more.textContent = `+${transactions.length - 2}`;
                more.style.fontSize = '0.55em';
                infoDiv.appendChild(more);
            }
            dayDiv.appendChild(infoDiv);
        }
        dayDiv.addEventListener('click', () => openModal(dateKey, d));
        calendarGrid.appendChild(dayDiv);
    }
}
function openModal(dateKey, day) {
    currentEditDate = dateKey;
    const parts = dateKey.split('-');
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    modalDateTitle.textContent = `${day} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
    transactionAmount.value = '';
    document.querySelectorAll('input[name="moneyType"]')[0].checked = true;
    document.querySelectorAll('input[name="transactionType"]')[0].checked = true;
    convertDirectionGroup.style.display = 'none';
    modal.style.display = 'flex';
}
function closeModalFn() { modal.style.display = 'none'; }
function validateBalance(moneyType, transType, amount, direction = null) {
    const { cashTotal, saldoTotal } = getCurrentSaldo();
    if (transType === 'expense') {
        if (moneyType === 'cash' && cashTotal < amount) return false;
        if (moneyType === 'saldo' && saldoTotal < amount) return false;
    } else if (transType === 'convert') {
        if (direction === 'cashToSaldo' && cashTotal < amount) return false;
        if (direction === 'saldoToCash' && saldoTotal < amount) return false;
    }
    return true;
}
let isSaving = false;
async function saveTransaction() {
    if (isSaving) return;
    isSaving = true;
    saveBtn.disabled = true;
    try {
        const moneyType = document.querySelector('input[name="moneyType"]:checked')?.value;
        const transType = document.querySelector('input[name="transactionType"]:checked')?.value;
        let rawAmount = transactionAmount.value.replace(/\./g, '');
        const amount = parseInt(rawAmount);
        if (isNaN(amount) || amount <= 0) { showToast('Nominal harus lebih dari 0', 'error'); return; }
        if (amount > 9999999999999) { showToast('Nominal terlalu besar', 'error'); return; }
        if (transType === 'convert') {
            const direction = document.querySelector('input[name="convertDirection"]:checked')?.value;
            if (!validateBalance(moneyType, transType, amount, direction)) {
                showToast('Saldo tidak mencukupi untuk konversi', 'error');
                return;
            }
        } else if (transType === 'expense') {
            if (!validateBalance(moneyType, transType, amount)) {
                showToast('Saldo tidak mencukupi untuk pengeluaran', 'error');
                return;
            }
        }
        if (!transactionData[currentEditDate]) transactionData[currentEditDate] = [];
        if (transType === 'convert') {
            const direction = document.querySelector('input[name="convertDirection"]:checked')?.value;
            const now = new Date().toISOString();
            transactionData[currentEditDate].push({
                id: Date.now(),
                moneyType: 'convert',
                type: 'convert',
                direction: direction,
                amount: amount,
                timestamp: now,
                fromMoney: direction === 'cashToSaldo' ? 'cash' : 'saldo',
                toMoney: direction === 'cashToSaldo' ? 'saldo' : 'cash'
            });
            showToast(`Konversi ${formatRupiah(amount)} berhasil`, 'success');
        } else {
            transactionData[currentEditDate].push({
                id: Date.now(),
                moneyType: moneyType,
                type: transType,
                amount: amount,
                timestamp: new Date().toISOString()
            });
            showToast(`${transType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(amount)} ditambahkan`, 'success');
        }
        saveData();
        closeModalFn();
    } finally {
        isSaving = false;
        saveBtn.disabled = false;
    }
}
saveBtn.addEventListener('click', saveTransaction);
closeBtn.addEventListener('click', closeModalFn);
prevMonthBtn.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
nextMonthBtn.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
document.querySelectorAll('input[name="transactionType"]').forEach(r => {
    r.addEventListener('change', function() { convertDirectionGroup.style.display = this.value === 'convert' ? 'block' : 'none'; });
});
const filterMap = { filterAll:'all', filterCash:'cash', filterSaldo:'saldo', filterIncome:'income', filterExpense:'expense', filterConvert:'convert' };
Object.entries(filterMap).forEach(([id, val]) => {
    document.getElementById(id).addEventListener('click', () => {
        currentFilter = val;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        renderHistory();
    });
});
document.getElementById('searchHistory').addEventListener('input', (e) => { searchQuery = e.target.value; renderHistory(); });
document.getElementById('clearSearch').addEventListener('click', () => { document.getElementById('searchHistory').value = ''; searchQuery = ''; renderHistory(); });
transactionAmount.addEventListener('input', function(e) {
    let raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length > 15) raw = raw.slice(0, 15);
    e.target.value = raw ? formatNumberWithDots(parseInt(raw)) : '';
});
transactionAmount.addEventListener('focus', function(e) { e.target.value = e.target.value.replace(/\./g, ''); });
transactionAmount.addEventListener('blur', function(e) {
    let raw = e.target.value.replace(/[^\d]/g, '');
    e.target.value = raw ? formatNumberWithDots(parseInt(raw)) : '';
});
document.getElementById('totalSavingBtn').addEventListener('click', () => {
    showToast('💰 Total seluruh tabunganmu! Terus hemat ✨', 'success');
});
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFn();
    if (e.target === calcModal) calcModal.style.display = 'none';
    if (e.target === notesModal) notesModal.style.display = 'none';
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal.style.display === 'flex') closeModalFn();
        if (calcModal.style.display === 'flex') calcModal.style.display = 'none';
        if (notesModal.style.display === 'flex') notesModal.style.display = 'none';
        if (sidebar.classList.contains('open')) closeSidebarFn();
    }
});
loadData();
renderCalendar();
