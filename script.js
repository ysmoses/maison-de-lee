// --- DATA STORAGE ---
let bookingList = JSON.parse(localStorage.getItem('mdl_bookings')) || [];
let activeTicketCode = null;

document.addEventListener('DOMContentLoaded', () => {
  renderAdminTable();
});

// --- NAVIGASI SCENE ---
function switchScene(sceneId, event) {
  if (event) event.preventDefault();

  const scenes = document.querySelectorAll('.scene');
  scenes.forEach(scene => scene.classList.remove('active'));

  const activeScene = document.getElementById(sceneId);
  if (activeScene) {
    activeScene.classList.add('active');
  }

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => btn.classList.remove('active'));
  
  if (event && event.target && event.target.classList.contains('nav-btn')) {
    event.target.classList.add('active');
  }

  if (sceneId === 'admin-dashboard') {
    renderAdminTable();
  }
}

// --- PILIH PAKET DARI KATALOG ---
function selectPackage(packageName, event) {
  switchScene('booking', event);
  const packageSelect = document.getElementById('packageSelect');
  if (packageSelect) {
    packageSelect.value = packageName;
    updateTotalCost();
  }
}

// --- UPDATE TOTAL BIAYA ---
function updateTotalCost() {
  const packageSelect = document.getElementById('packageSelect');
  const totalCostDisplay = document.getElementById('totalCostDisplay');
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const price = selectedOption.getAttribute('data-price') || 0;

  totalCostDisplay.textContent = 'Rp ' + Number(price).toLocaleString('id-ID');
}

// --- SIMPAN BOOKING (STATUS AWAL: MENUNGGU) ---
function saveBooking(event) {
  event.preventDefault();
  const userName = document.getElementById('userName').value;
  const packageSelect = document.getElementById('packageSelect');
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const packageName = packageSelect.value;
  const price = selectedOption.getAttribute('data-price') || 0;
  const bookingDate = document.getElementById('bookingDate').value;

  if (!userName || !packageName || !bookingDate) {
    showToast('Harap isi semua formulir!', '⚠️');
    return;
  }

  const ticketNo = 'MDL-' + Math.floor(100000 + Math.random() * 900000);
  const formattedPrice = 'Rp ' + Number(price).toLocaleString('id-ID');

  const newBooking = {
    ticketCode: ticketNo,
    name: userName,
    package: packageName,
    date: bookingDate,
    total: formattedPrice,
    status: 'MENUNGGU'
  };

  bookingList.push(newBooking);
  localStorage.setItem('mdl_bookings', JSON.stringify(bookingList));
  activeTicketCode = ticketNo;

  renderTicket(newBooking);
  renderAdminTable();
  showToast('Booking Berhasil! Menunggu Persetujuan Admin.', '⏳');
}

// --- RENDER TIKET DIGITAL ---
function renderTicket(bookingData) {
  const displayArea = document.getElementById('savedDataDisplay');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingData.ticketCode}`;

  const isConfirmed = bookingData.status === 'TERKONFIRMASI';
  const badgeClass = isConfirmed ? 'confirmed' : 'pending';
  const statusIcon = isConfirmed ? '✓' : '⏳';
  const statusText = isConfirmed ? 'TERKONFIRMASI' : 'MENUNGGU PERSETUJUAN';

  displayArea.innerHTML = `
    <div id="printableTicket" class="ticket-card-styled">
      <div class="ticket-header">
        <span class="brand-title">MAISON DE LEE</span>
        <span class="ticket-number">NO: ${bookingData.ticketCode}</span>
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-body">
        <div class="ticket-info">
          <p><strong>Pemesan:</strong> ${bookingData.name}</p>
          <p><strong>Layanan:</strong> ${bookingData.package}</p>
          <p><strong>Jadwal Sesi:</strong> 📅 ${bookingData.date}</p>
          <p class="ticket-total"><strong>Total Biaya:</strong> <span class="highlight-price">${bookingData.total}</span></p>
        </div>
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-footer">
        <div class="badge-status ${badgeClass}">
          <span class="check-icon">${statusIcon}</span> ${statusText}
        </div>
        <img src="${qrCodeUrl}" alt="QR Code Tiket" class="qr-code-img">
      </div>
    </div>

    ${isConfirmed ? `
      <button class="btn-print-pdf" onclick="printTicket()">
        🖨️ Cetak / Simpan Tiket PDF
      </button>
    ` : `
      <p style="text-align: center; font-size: 12px; color: #888; margin-top: 12px;">
        * Tombol cetak PDF akan aktif setelah Admin menyetujui pemesanan ini.
      </p>
    `}
  `;
}

// --- RENDER TABEL ADMIN ---
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  if (bookingList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Belum ada data pemesanan.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookingList.map((item, index) => {
    const isConfirmed = item.status === 'TERKONFIRMASI';
    const statusColor = isConfirmed ? 'green' : '#d97706';

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.ticketCode}</strong></td>
        <td>${item.name}</td>
        <td>${item.package}</td>
        <td>${item.date}</td>
        <td>${item.total}</td>
        <td><span style="color: ${statusColor}; font-weight: bold;">${item.status}</span></td>
        <td>
          ${!isConfirmed ? `
            <button class="btn-approve" onclick="approveBooking(${index})">Setujui</button>
          ` : ''}
          <button class="btn btn-danger" onclick="deleteBooking(${index})" style="padding: 4px 8px; font-size: 12px;">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

// --- ADMIN APPROVE BOOKING ---
function approveBooking(index) {
  bookingList[index].status = 'TERKONFIRMASI';
  localStorage.setItem('mdl_bookings', JSON.stringify(bookingList));

  renderAdminTable();

  if (activeTicketCode === bookingList[index].ticketCode) {
    renderTicket(bookingList[index]);
  }

  showToast(`Pemesanan ${bookingList[index].ticketCode} Disetujui!`, '✅');
}

// --- HAPUS BOOKING ---
function deleteBooking(index) {
  if (confirm('Apakah Anda yakin ingin menghapus pemesanan ini?')) {
    const deletedCode = bookingList[index].ticketCode;
    bookingList.splice(index, 1);
    localStorage.setItem('mdl_bookings', JSON.stringify(bookingList));
    renderAdminTable();

    if (activeTicketCode === deletedCode) {
      document.getElementById('savedDataDisplay').innerHTML = `
        <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
          Tiket telah dihapus oleh Admin.
        </p>
      `;
    }

    showToast('Data pemesanan berhasil dihapus', '🗑️');
  }
}

// --- CETAK PDF ---
function printTicket() {
  window.print();
}

// --- MODAL ZOOM GAMBAR ---
function openModal(imgSrc, captionText) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const modalCaption = document.getElementById('modalCaption');

  modal.style.display = 'flex';
  modalImg.src = imgSrc;
  modalCaption.textContent = captionText;
}

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}

// --- MODAL POP-UP VIDEO ---
function openVideoModal(videoSrc) {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('modalVideoPlayer');
  const source = document.getElementById('modalVideoSource');

  source.src = videoSrc;
  player.load();
  modal.style.display = 'flex';
  player.play();
}

function closeVideoModal(event) {
  if (event.target.id === 'videoModal' || event.target.classList.contains('close-modal')) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');

    player.pause();
    modal.style.display = 'none';
  }
}

// --- LOGIN ADMIN ---
function openLoginModal(event) {
  if (event) event.preventDefault();
  document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
}

function handleAdminLogin(event) {
  event.preventDefault();
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;

  if (user === 'admin' && pass === 'admin123') {
    closeLoginModal();
    switchScene('admin-dashboard');
    showToast('Selamat Datang Admin!', '🔑');
  } else {
    showToast('Username atau Password salah!', '❌');
  }
}

function adminLogout() {
  switchScene('home');
  showToast('Admin Berhasil Logout', 'ℹ️');
}

// --- TOAST NOTIFICATION ---
function showToast(message, icon = '✨') {
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  if (toast && toastMessage) {
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}