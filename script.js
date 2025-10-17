const twibbonCanvas = document.getElementById("twibbonCanvas");
const ctx = twibbonCanvas.getContext("2d");
const photoUpload = document.getElementById("photoUpload");
const inputName = document.getElementById("inputName");
const inputPosition = document.getElementById("inputPosition");
const downloadBtn = document.getElementById("downloadBtn");

const namePreview = document.getElementById("name");
const positionPreview = document.getElementById("position");

let baseImage = new Image();
baseImage.crossOrigin = "anonymous";
baseImage.src = "TWIBBON MUKTAMAR.png"; // Ganti dengan path gambar twibbon Anda
let userPhoto = null;

// Koordinat dan ukuran bingkai di gambar latar (sesuaikan ini!)
// Anda perlu mengukur ini secara manual dari gambar Anda.
// Contoh: [pos_x, pos_y, lebar, tinggi]
const FRAME_AREA = {
    x: 485, // Posisi X awal bingkai (dari kiri gambar)
    y: 420, // Posisi Y awal bingkai (dari atas gambar)
    width: 325, // Lebar bingkai
    height: 700, // Tinggi bingkai
    borderRadius: 50 // Radius sudut jika bingkai memiliki sudut membulat
};

// Koordinat teks di gambar latar (sesuaikan ini!)
const TEXT_AREA_NAME = {
    x: 880, // Posisi X akhir (rata kanan) untuk nama
    y: 530, // Posisi Y untuk nama
    maxWidth: 200 // Lebar maksimum untuk teks nama
};

const TEXT_AREA_POSITION = {
    x: 880, // Posisi X akhir (rata kanan) untuk keterangan
    y: 565, // Posisi Y untuk keterangan
    maxWidth: 200 // Lebar maksimum untuk teks keterangan
};


// Fungsi untuk menggambar ulang semua elemen di canvas
async function drawTwibbon() {
    if (!baseImage.complete) {
        await new Promise(resolve => baseImage.onload = resolve);
    }

    twibbonCanvas.width = baseImage.width;
    twibbonCanvas.height = baseImage.height;

    // 1. Gambar gambar dasar twibbon
    ctx.drawImage(baseImage, 0, 0, twibbonCanvas.width, twibbonCanvas.height);

    // 2. Jika ada foto pengguna, gambar di dalam bingkai
    if (userPhoto) {
        // Simpan state canvas saat ini
        ctx.save();

        // Buat path berbentuk bingkai
        ctx.beginPath();
        // Bingkai Anda memiliki bentuk persegi panjang dengan sudut membulat di atas
        // Jadi, kita akan membuat path dengan bentuk yang sama
        const bx = FRAME_AREA.x;
        const by = FRAME_AREA.y;
        const bw = FRAME_AREA.width;
        const bh = FRAME_AREA.height;
        const br = FRAME_AREA.borderRadius; // Radius bingkai di atas

        // Mulai dari sudut kiri atas yang membulat
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + br, br); // Sudut kanan atas
        ctx.lineTo(bx + bw, by + bh); // Garis kanan bawah
        ctx.lineTo(bx, by + bh); // Garis bawah kiri
        ctx.lineTo(bx, by + br); // Garis kiri atas
        ctx.arcTo(bx, by, bx + br, by, br); // Sudut kiri atas

        ctx.closePath();
        ctx.clip(); // Gunakan path ini sebagai clipping mask

        // Hitung rasio aspek foto pengguna dan bingkai
        const photoAspectRatio = userPhoto.width / userPhoto.height;
        const frameAspectRatio = FRAME_AREA.width / FRAME_AREA.height;

        let sx, sy, sWidth, sHeight; // Source x, y, width, height (dari foto asli)
        let dx, dy, dWidth, dHeight; // Destination x, y, width, height (di canvas)

        // Tentukan apakah foto harus mengisi lebar atau tinggi bingkai
        if (photoAspectRatio > frameAspectRatio) {
            // Foto lebih lebar dari bingkai, pangkas lebar foto
            sHeight = userPhoto.height;
            sWidth = sHeight * frameAspectRatio;
            sx = (userPhoto.width - sWidth) / 2;
            sy = 0;
        } else {
            // Foto lebih tinggi dari bingkai, pangkas tinggi foto
            sWidth = userPhoto.width;
            sHeight = sWidth / frameAspectRatio;
            sy = (userPhoto.height - sHeight) / 2;
            sx = 0;
        }

        // Gambar foto di dalam area bingkai
        ctx.drawImage(userPhoto, sx, sy, sWidth, sHeight, FRAME_AREA.x, FRAME_AREA.y, FRAME_AREA.width, FRAME_AREA.height);

        // Pulihkan state canvas agar clipping mask tidak mempengaruhi gambar berikutnya
        ctx.restore();
    }

    // 3. Gambar teks nama dan keterangan (di canvas untuk diunduh)
    await document.fonts.ready; // Pastikan font Montserrat siap

    ctx.fillStyle = "#018297"; // Warna teks untuk di canvas
    ctx.textAlign = "right"; // Rata kanan

    const baseFontSizeName = 28; // Ukuran font dasar untuk nama di canvas (sesuaikan)
    const baseFontSizePosition = 22; // Ukuran font dasar untuk keterangan di canvas (sesuaikan)

    ctx.font = `bold ${baseFontSizeName}px 'Montserrat', sans-serif`;
    ctx.fillText(inputName.value || "Nama Anda", TEXT_AREA_NAME.x, TEXT_AREA_NAME.y, TEXT_AREA_NAME.maxWidth);

    ctx.font = `${baseFontSizePosition}px 'Montserrat', sans-serif`;
    ctx.fillText(inputPosition.value || "Jabatan/Asal", TEXT_AREA_POSITION.x, TEXT_AREA_POSITION.y, TEXT_AREA_POSITION.maxWidth);
}

// Update teks preview dan status tombol download
function updateText() {
    namePreview.innerText = inputName.value || "Nama Anda";
    positionPreview.innerText = inputPosition.value || "Jabatan/Asal";
    
    // Perbarui tampilan di canvas juga setiap ada perubahan teks
    drawTwibbon();

    const canDownload = (inputName.value.trim() !== "" || inputPosition.value.trim() !== "") && userPhoto !== null;
    downloadBtn.disabled = !canDownload;
    downloadBtn.style.backgroundColor = canDownload ? '#018297' : '#ccc';
    downloadBtn.style.cursor = canDownload ? 'pointer' : 'not-allowed';
}

// Event listener untuk upload foto
photoUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            userPhoto = new Image();
            userPhoto.crossOrigin = "anonymous"; // Penting untuk menghindari masalah CORS jika gambar diunduh
            userPhoto.onload = () => {
                drawTwibbon(); // Gambar ulang twibbon setelah foto pengguna dimuat
                updateText(); // Perbarui status tombol download
            };
            userPhoto.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        userPhoto = null;
        drawTwibbon(); // Gambar ulang tanpa foto pengguna
        updateText(); // Perbarui status tombol download
    }
});

// Fungsi untuk mengunduh gambar twibbon
async function downloadTwibbon() {
    if (downloadBtn.disabled) return; // Jangan izinkan jika tombol dinonaktifkan

    // Pastikan gambar sudah digambar di canvas sebelum diunduh
    await drawTwibbon(); 

    let link = document.createElement("a");
    link.href = twibbonCanvas.toDataURL("image/png");
    link.download = "Twibbon_Muktamar_IKA_STIBA.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inisialisasi: Muat gambar dasar twibbon saat halaman dimuat
baseImage.onload = () => {
    drawTwibbon();
    updateText();
};
baseImage.onerror = () => {
    alert("Gagal memuat gambar dasar twibbon. Pastikan 'muktamar.jpg' ada di direktori yang sama.");
};

// Panggil updateText saat pertama kali halaman dimuat untuk mengatur status tombol
updateText();
