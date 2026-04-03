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
const transactionAmountInput = document.getElementById('transactionAmount');
const modalDateTitle = document.getElementById('modalDateTitle');
const convertDirectionGroup = document.getElementById('convertDirectionGroup');

let currentEditDate = null;

function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseNumberFromDots(value) {
    return parseInt(value.replace(/\./g, '')) || 0;
}

function formatMoneyInput(value) {
    let cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue === '') return '';
    let number = parseInt(cleanValue);
    return formatNumberWithDots(number);
}

transactionAmountInput.addEventListener('input', function(e) {
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

transactionAmountInput.addEventListener('focus', function(e) {
    let rawValue = e.target.value.replace(/\./g, '');
    if (rawValue === '') return;
    e.target.value = rawValue;
});

transactionAmountInput.addEventListener('blur', function(e) {
    let rawValue = e.target.value.replace(/[^\d]/g, '');
    if (rawValue === '') {
        e.target.value = '';
        return;
    }
    e.target.value = formatNumberWithDots(parseInt(rawValue));
});

document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'convert') {
            convertDirectionGroup.style.display = 'block';
        } else {
            convertDirectionGroup.style.display = 'none';
        }
    });
});

function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function updateTodayInfo() {
    const today = new Date();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    document.getElementById('todayDateText').innerHTML = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
}

function loadData() {
    const saved = localStorage.getItem('financialCalendar');
    if (saved) transactionData = JSON.parse(saved);
    else transactionData = {};
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
    let cashTotal = 0, saldoTotal = 0;
    for (let date in transactionData) {
        transactionData[date].forEach(t => {
            if (t.moneyType === 'cash') {
                if (t.type === 'income') cashTotal += t.amount;
                else if (t.type === 'expense') cashTotal -= t.amount;
                else if (t.type === 'convert') {
                    if (t.direction === 'cashToSaldo') cashTotal -= t.amount;
                    else if (t.direction === 'saldoToCash') cashTotal += t.amount;
                }
            } else if (t.moneyType === 'saldo') {
                if (t.type === 'income') saldoTotal += t.amount;
                else if (t.type === 'expense') saldoTotal -= t.amount;
                else if (t.type === 'convert') {
                    if (t.direction === 'cashToSaldo') saldoTotal += t.amount;
                    else if (t.direction === 'saldoToCash') saldoTotal -= t.amount;
                }
            }
        });
    }
    document.getElementById('cashTotal').textContent = formatRupiah(cashTotal);
    document.getElementById('saldoTotal').textContent = formatRupiah(saldoTotal);
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        transactionData[date].forEach(t => {
            all.push({ date, formattedDate: formatDate(date), ...t });
        });
    }
    all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (currentFilter === 'cash') all = all.filter(t => t.moneyType === 'cash');
    else if (currentFilter === 'saldo') all = all.filter(t => t.moneyType === 'saldo');
    else if (currentFilter === 'income') all = all.filter(t => t.type === 'income');
    else if (currentFilter === 'expense') all = all.filter(t => t.type === 'expense');
    else if (currentFilter === 'convert') all = all.filter(t => t.type === 'convert');
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        all = all.filter(t => getTransactionText(t).toLowerCase().includes(q) || formatRupiah(t.amount).includes(q) || t.formattedDate.toLowerCase().includes(q));
    }
    
    document.getElementById('historyStats').textContent = `Total: ${all.length} transaksi`;
    const tbody = document.getElementById('historyBody');
    
    if (all.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = all.map(t => {
        let jenisBadge = t.moneyType === 'cash' ? 'cash-badge' : 'saldo-badge';
        let jenisText = t.moneyType === 'cash' ? '💵 Cash' : '🏦 Saldo';
        if (t.type === 'convert') jenisBadge = 'convert-badge';
        
        return `
            <tr>
                <td>${t.formattedDate}</td>
                <td><span class="${jenisBadge}">${jenisText}</span></td>
                <td class="${getTransactionBadgeClass(t)}">${getTransactionText(t)}</td>
                <td class="${getTransactionBadgeClass(t)}">${formatRupiah(t.amount)}</td>
                <td style="font-size:0.8em;color:#666;">${formatTime(t.timestamp)}</td>
            </tr>
        `;
    }).join('');
}

function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';
    
    const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    weekdays.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-weekday';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });
    
    for (let i = 0; i < startWeekday; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }
    
    const isCurrentMonth = (currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth());
    const todayDate = new Date().getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const transactions = transactionData[dateKey] || [];
        const isToday = (isCurrentMonth && day === todayDate);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${transactions.length > 0 ? 'has-transaction' : ''} ${isToday ? 'today' : ''}`;
        
        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = day;
        dayDiv.appendChild(dayNum);
        
        if (transactions.length > 0) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'transaction-info';
            transactions.slice(0, 2).forEach(t => {
                const tDiv = document.createElement('div');
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
            });
            if (transactions.length > 2) {
                const more = document.createElement('div');
                more.className = 'transaction-item';
                more.textContent = `+${transactions.length - 2}`;
                more.style.fontSize = '0.65em';
                more.style.color = '#666';
                infoDiv.appendChild(more);
            }
            dayDiv.appendChild(infoDiv);
        }
        
        dayDiv.addEventListener('click', () => openModal(dateKey, day));
        calendarGrid.appendChild(dayDiv);
    }
}

function openModal(dateKey, day) {
    currentEditDate = dateKey;
    const date = new Date(dateKey);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    modalDateTitle.textContent = `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    transactionAmountInput.value = '';
    document.querySelector('input[name="moneyType"][value="cash"]').checked = true;
    document.querySelector('input[name="transactionType"][value="income"]').checked = true;
    document.querySelector('input[name="convertDirection"][value="cashToSaldo"]').checked = true;
    convertDirectionGroup.style.display = 'none';
    modal.style.display = 'flex';
}

function saveTransaction() {
    const moneyType = document.querySelector('input[name="moneyType"]:checked').value;
    const transType = document.querySelector('input[name="transactionType"]:checked').value;
    let rawAmount = transactionAmountInput.value.replace(/\./g, '');
    const amount = parseInt(rawAmount);
    
    if (isNaN(amount) || amount <= 0) {
        alert('Masukkan nominal yang valid!');
        return;
    }
    
    if (!transactionData[currentEditDate]) transactionData[currentEditDate] = [];
    
    if (transType === 'convert') {
        const direction = document.querySelector('input[name="convertDirection"]:checked').value;
        const fromType = direction === 'cashToSaldo' ? 'cash' : 'saldo';
        const toType = direction === 'cashToSaldo' ? 'saldo' : 'cash';
        
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random(),
            moneyType: fromType,
            type: 'convert',
            direction: direction,
            amount: amount,
            timestamp: new Date().toISOString()
        });
        
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random() + 1,
            moneyType: toType,
            type: 'convert',
            direction: direction,
            amount: amount,
            timestamp: new Date().toISOString()
        });
    } else {
        transactionData[currentEditDate].push({
            id: Date.now() + Math.random(),
            moneyType: moneyType,
            type: transType,
            amount: amount,
            timestamp: new Date().toISOString()
        });
    }
    
    saveData();
    modal.style.display = 'none';
    renderCalendar();
}

function closeModal() {
    modal.style.display = 'none';
    currentEditDate = null;
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

prevMonthBtn.addEventListener('click', prevMonth);
nextMonthBtn.addEventListener('click', nextMonth);
closeBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', saveTransaction);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('filterAll').addEventListener('click', () => {
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterAll').classList.add('active');
    renderHistory();
});
document.getElementById('filterCash').addEventListener('click', () => {
    currentFilter = 'cash';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterCash').classList.add('active');
    renderHistory();
});
document.getElementById('filterSaldo').addEventListener('click', () => {
    currentFilter = 'saldo';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterSaldo').classList.add('active');
    renderHistory();
});
document.getElementById('filterIncome').addEventListener('click', () => {
    currentFilter = 'income';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterIncome').classList.add('active');
    renderHistory();
});
document.getElementById('filterExpense').addEventListener('click', () => {
    currentFilter = 'expense';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterExpense').classList.add('active');
    renderHistory();
});
document.getElementById('filterConvert').addEventListener('click', () => {
    currentFilter = 'convert';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterConvert').classList.add('active');
    renderHistory();
});

document.getElementById('searchHistory').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderHistory();
});
document.getElementById('clearSearch').addEventListener('click', () => {
    document.getElementById('searchHistory').value = '';
    searchQuery = '';
    renderHistory();
});

loadData();
renderCalendar();