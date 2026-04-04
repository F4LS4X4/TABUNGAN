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

function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseNumberFromDots(value) {
    return parseInt(value.replace(/\./g, '')) || 0;
}

transactionAmount.addEventListener('input', function(e) {
    let cursorPos = e.target.selectionStart;
    let rawValue = e.target.value;
    let cleanValue = rawValue.replace(/[^\d]/g, '');
    if (cleanValue === '') {
        e.target.value = '';
        return;
    }
    let formatted = formatNumberWithDots(parseInt(cleanValue));
    e.target.value = formatted;
    let newCursorPos = cursorPos + (formatted.length - rawValue.length);
    e.target.setSelectionRange(newCursorPos, newCursorPos);
});

transactionAmount.addEventListener('focus', function(e) {
    let rawValue = e.target.value.replace(/\./g, '');
    if (rawValue === '') return;
    e.target.value = rawValue;
});

transactionAmount.addEventListener('blur', function(e) {
    let rawValue = e.target.value.replace(/[^\d]/g, '');
    if (rawValue === '') {
        e.target.value = '';
        return;
    }
    e.target.value = formatNumberWithDots(parseInt(rawValue));
});

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function formatRupiah(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function getValidNumber(value) {
    let num = parseInt(value);
    if (isNaN(num)) return 0;
    if (num < 0) return 0;
    return num;
}

function loadData() {
    let saved = localStorage.getItem('financialCalendar');
    if (saved) {
        try {
            transactionData = JSON.parse(saved);
        } catch(e) {
            transactionData = {};
        }
    } else {
        transactionData = {};
    }
    updateSummary();
    renderHistory();
    updateTodayInfo();
}

function saveData() {
    localStorage.setItem('financialCalendar', JSON.stringify(transactionData));
    updateSummary();
    renderCalendar();
    renderHistory();
}

function updateSummary() {
    let cashTotal = 0;
    let saldoTotal = 0;
    
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
    
    document.getElementById('cashTotal').textContent = formatRupiah(cashTotal);
    document.getElementById('saldoTotal').textContent = formatRupiah(saldoTotal);
}

function formatDate(dateStr) {
    try {
        let d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch(e) {
        return dateStr;
    }
}

function formatTime(timestamp) {
    try {
        let d = new Date(timestamp);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch(e) {
        return '-';
    }
}

function getTodayString() {
    let t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function updateTodayInfo() {
    let t = new Date();
    let monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    let dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    let todayText = document.getElementById('todayDateText');
    if (todayText) {
        todayText.innerHTML = `${dayNames[t.getDay()]}, ${t.getDate()} ${monthNames[t.getMonth()]} ${t.getFullYear()}`;
    }
}

function getTransactionText(t) {
    if (t.type === 'convert') {
        if (t.direction === 'cashToSaldo') return '🔄 Cash → Saldo';
        return '🔄 Saldo → Cash';
    }
    return t.type === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran';
}

function getTransactionBadgeClass(t) {
    if (t.type === 'convert') return 'transaction-convert-badge';
    return t.type === 'income' ? 'transaction-income-badge' : 'transaction-expense-badge';
}

function renderHistory() {
    let all = [];
    for (let date in transactionData) {
        if (Array.isArray(transactionData[date])) {
            for (let t of transactionData[date]) {
                all.push({ date, formattedDate: formatDate(date), ...t });
            }
        }
    }
    all.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (currentFilter === 'cash') all = all.filter(t => t.moneyType === 'cash');
    else if (currentFilter === 'saldo') all = all.filter(t => t.moneyType === 'saldo');
    else if (currentFilter === 'income') all = all.filter(t => t.type === 'income');
    else if (currentFilter === 'expense') all = all.filter(t => t.type === 'expense');
    else if (currentFilter === 'convert') all = all.filter(t => t.type === 'convert');
    
    if (searchQuery) {
        let q = searchQuery.toLowerCase();
        all = all.filter(t => 
            getTransactionText(t).toLowerCase().includes(q) || 
            formatRupiah(t.amount).includes(q) || 
            t.formattedDate.toLowerCase().includes(q)
        );
    }
    
    let historyStats = document.getElementById('historyStats');
    if (historyStats) historyStats.textContent = `Total: ${all.length} transaksi`;
    
    let tbody = document.getElementById('historyBody');
    if (!tbody) return;
    
    if (all.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    for (let t of all) {
        let jenisBadge = t.moneyType === 'cash' ? 'cash-badge' : 'saldo-badge';
        let jenisText = t.moneyType === 'cash' ? '💵 Cash' : '🏦 Saldo';
        if (t.type === 'convert') jenisBadge = 'convert-badge';
        
        let row = tbody.insertRow();
        row.insertCell(0).textContent = t.formattedDate;
        row.insertCell(1).innerHTML = `<span class="${jenisBadge}">${jenisText}</span>`;
        row.insertCell(2).innerHTML = `<span class="${getTransactionBadgeClass(t)}">${getTransactionText(t)}</span>`;
        row.insertCell(3).innerHTML = `<span class="${getTransactionBadgeClass(t)}">${formatRupiah(t.amount)}</span>`;
        row.insertCell(4).innerHTML = `<span style="font-size:0.75em;color:#666;">${formatTime(t.timestamp)}</span>`;
    }
}

function renderCalendar() {
    let firstDay = new Date(currentYear, currentMonth, 1);
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
    let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';
    
    let weekdays = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
    for (let day of weekdays) {
        let div = document.createElement('div');
        div.className = 'calendar-weekday';
        div.textContent = day;
        calendarGrid.appendChild(div);
    }
    
    for (let i = 0; i < startWeekday; i++) {
        let empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }
    
    let isCurrentMonth = (currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth());
    let todayDate = new Date().getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
        let dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let transactions = transactionData[dateKey] || [];
        let isToday = (isCurrentMonth && d === todayDate);
        
        let dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${transactions.length > 0 ? 'has-transaction' : ''} ${isToday ? 'today' : ''}`;
        
        let dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = d;
        dayDiv.appendChild(dayNum);
        
        if (transactions.length > 0) {
            let infoDiv = document.createElement('div');
            infoDiv.className = 'transaction-info';
            let showCount = Math.min(transactions.length, 2);
            for (let i = 0; i < showCount; i++) {
                let t = transactions[i];
                let tDiv = document.createElement('div');
                let colorClass = 'transaction-income';
                if (t.type === 'expense') colorClass = 'transaction-expense';
                if (t.type === 'convert') colorClass = 'transaction-convert';
                tDiv.className = `transaction-item ${colorClass}`;
                let symbol = t.type === 'income' ? '↑' : (t.type === 'expense' ? '↓' : '🔄');
                let moneyIcon = t.moneyType === 'cash' ? '💵' : '🏦';
                if (t.type === 'convert') {
                    if (t.direction === 'cashToSaldo') symbol = '💵→🏦';
                    else symbol = '🏦→💵';
                }
                tDiv.innerHTML = `${moneyIcon} ${symbol} ${formatRupiah(t.amount)}`;
                infoDiv.appendChild(tDiv);
            }
            if (transactions.length > 2) {
                let more = document.createElement('div');
                more.className = 'transaction-item';
                more.textContent = `+${transactions.length - 2}`;
                more.style.fontSize = '0.55em';
                more.style.color = '#666';
                infoDiv.appendChild(more);
            }
            dayDiv.appendChild(infoDiv);
        }
        
        dayDiv.addEventListener('click', (function(dk, dVal) {
            return function() { openModal(dk, dVal); };
        })(dateKey, d));
        
        calendarGrid.appendChild(dayDiv);
    }
}

function openModal(dateKey, day) {
    currentEditDate = dateKey;
    let dt = new Date(dateKey);
    let monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    modalDateTitle.textContent = `${day} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
    transactionAmount.value = '';
    
    let moneyTypeRadios = document.querySelectorAll('input[name="moneyType"]');
    if (moneyTypeRadios.length) moneyTypeRadios[0].checked = true;
    
    let transTypeRadios = document.querySelectorAll('input[name="transactionType"]');
    if (transTypeRadios.length) transTypeRadios[0].checked = true;
    
    let convertDirectionRadios = document.querySelectorAll('input[name="convertDirection"]');
    if (convertDirectionRadios.length) convertDirectionRadios[0].checked = true;
    
    if (convertDirectionGroup) convertDirectionGroup.style.display = 'none';
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    currentEditDate = null;
}

function saveTransaction() {
    let moneyTypeRadio = document.querySelector('input[name="moneyType"]:checked');
    let transTypeRadio = document.querySelector('input[name="transactionType"]:checked');
    let amountValue = transactionAmount.value.trim();
    
    if (!moneyTypeRadio || !transTypeRadio) {
        showToast('Terjadi kesalahan, coba lagi!', 'error');
        return;
    }
    
    let moneyType = moneyTypeRadio.value;
    let transType = transTypeRadio.value;
    
    if (amountValue === '') {
        showToast('Masukkan nominal terlebih dahulu!', 'error');
        return;
    }
    
    let rawAmount = amountValue.replace(/\./g, '');
    let amount = parseInt(rawAmount);
    
    if (isNaN(amount)) {
        showToast('Masukkan angka yang valid!', 'error');
        return;
    }
    
    if (amount <= 0) {
        showToast('Nominal harus lebih dari 0!', 'error');
        return;
    }
    
    if (!transactionData[currentEditDate]) {
        transactionData[currentEditDate] = [];
    }
    
    if (transType === 'convert') {
        let directionRadio = document.querySelector('input[name="convertDirection"]:checked');
        if (!directionRadio) {
            showToast('Pilih arah konversi!', 'error');
            return;
        }
        let direction = directionRadio.value;
        let fromType = direction === 'cashToSaldo' ? 'cash' : 'saldo';
        let toType = direction === 'cashToSaldo' ? 'saldo' : 'cash';
        let now = new Date().toISOString();
        
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random(),
            moneyType: fromType,
            type: 'convert',
            direction: direction,
            amount: amount,
            timestamp: now
        });
        
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random() + 1,
            moneyType: toType,
            type: 'convert',
            direction: direction,
            amount: amount,
            timestamp: now
        });
        
        showToast(`Berhasil konversi ${formatRupiah(amount)}`, 'success');
    } else {
        let typeText = transType === 'income' ? 'Pemasukan' : 'Pengeluaran';
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random(),
            moneyType: moneyType,
            type: transType,
            amount: amount,
            timestamp: new Date().toISOString()
        });
        showToast(`${typeText} ${formatRupiah(amount)} berhasil ditambahkan!`, 'success');
    }
    
    saveData();
    closeModal();
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

if (prevMonthBtn) prevMonthBtn.addEventListener('click', prevMonth);
if (nextMonthBtn) nextMonthBtn.addEventListener('click', nextMonth);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (saveBtn) saveBtn.addEventListener('click', saveTransaction);

if (modal) {
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

let transTypeRadios = document.querySelectorAll('input[name="transactionType"]');
for (let r of transTypeRadios) {
    r.addEventListener('change', function() {
        if (convertDirectionGroup) {
            if (this.value === 'convert') {
                convertDirectionGroup.style.display = 'block';
            } else {
                convertDirectionGroup.style.display = 'none';
            }
        }
    });
}

let filterAll = document.getElementById('filterAll');
if (filterAll) {
    filterAll.addEventListener('click', () => {
        currentFilter = 'all';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterAll.classList.add('active');
        renderHistory();
    });
}

let filterCash = document.getElementById('filterCash');
if (filterCash) {
    filterCash.addEventListener('click', () => {
        currentFilter = 'cash';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterCash.classList.add('active');
        renderHistory();
    });
}

let filterSaldo = document.getElementById('filterSaldo');
if (filterSaldo) {
    filterSaldo.addEventListener('click', () => {
        currentFilter = 'saldo';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterSaldo.classList.add('active');
        renderHistory();
    });
}

let filterIncome = document.getElementById('filterIncome');
if (filterIncome) {
    filterIncome.addEventListener('click', () => {
        currentFilter = 'income';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterIncome.classList.add('active');
        renderHistory();
    });
}

let filterExpense = document.getElementById('filterExpense');
if (filterExpense) {
    filterExpense.addEventListener('click', () => {
        currentFilter = 'expense';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterExpense.classList.add('active');
        renderHistory();
    });
}

let filterConvert = document.getElementById('filterConvert');
if (filterConvert) {
    filterConvert.addEventListener('click', () => {
        currentFilter = 'convert';
        let btns = document.querySelectorAll('.filter-btn');
        for (let b of btns) b.classList.remove('active');
        filterConvert.classList.add('active');
        renderHistory();
    });
}

let searchInput = document.getElementById('searchHistory');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderHistory();
    });
}

let clearSearchBtn = document.getElementById('clearSearch');
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        let search = document.getElementById('searchHistory');
        if (search) search.value = '';
        searchQuery = '';
        renderHistory();
    });
}

loadData();
renderCalendar();