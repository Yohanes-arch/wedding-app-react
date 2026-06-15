import type { BudgetTemplateType } from '../types';

export type CostItemTemplate = {
  name: string;
  estimatedAmount: number;
};

export type CategoryTemplate = {
  name: string;
  icon: string;
  colorHex: string;
  items: CostItemTemplate[];
  checklist: string[];
};

export const templateOptions: Array<{ value: BudgetTemplateType; label: string; description: string }> = [
  {
    value: 'general_indonesian',
    label: 'General Indonesian',
    description: 'Kategori umum seperti venue, catering, decor, MUA, dokumentasi, keluarga, dan cadangan.',
  },
  {
    value: 'batak_toba',
    label: 'Batak Toba',
    description: 'Menambahkan sinamot, ulos, marhusip, marhata sinamot, martumpol, pesta adat, dan kebutuhan adat.',
  },
];

export function getTemplate(type: BudgetTemplateType) {
  return type === 'batak_toba' ? batakTobaTemplate : generalIndonesianTemplate;
}

const generalIndonesianTemplate: CategoryTemplate[] = [
  {
    name: 'Venue / Gedung',
    icon: 'building-2',
    colorHex: '#7D9A83',
    items: [
      { name: 'Booking fee', estimatedAmount: 5_000_000 },
      { name: 'DP gedung', estimatedAmount: 10_000_000 },
      { name: 'Pelunasan gedung', estimatedAmount: 25_000_000 },
      { name: 'Overtime / deposit', estimatedAmount: 3_000_000 },
    ],
    checklist: ['Survey gedung', 'Konfirmasi kapasitas tamu', 'Bayar DP gedung'],
  },
  {
    name: 'Catering',
    icon: 'utensils',
    colorHex: '#C47F68',
    items: [
      { name: 'Paket buffet', estimatedAmount: 45_000_000 },
      { name: 'Food stall', estimatedAmount: 12_000_000 },
      { name: 'Test food', estimatedAmount: 1_000_000 },
    ],
    checklist: ['Tentukan jumlah porsi', 'Jadwalkan test food', 'Finalisasi menu'],
  },
  {
    name: 'Decor',
    icon: 'flower-2',
    colorHex: '#D39BA6',
    items: [
      { name: 'Paket dekor utama', estimatedAmount: 20_000_000 },
      { name: 'Bunga', estimatedAmount: 3_000_000 },
      { name: 'Backdrop', estimatedAmount: 5_000_000 },
      { name: 'Lighting', estimatedAmount: 4_000_000 },
    ],
    checklist: ['Kunci konsep dekor', 'Kirim layout venue', 'Finalisasi bunga'],
  },
  {
    name: 'MUA & Beauty',
    icon: 'sparkles',
    colorHex: '#B67AA0',
    items: [
      { name: 'MUA akad', estimatedAmount: 4_000_000 },
      { name: 'MUA resepsi', estimatedAmount: 6_000_000 },
      { name: 'Retouch keluarga', estimatedAmount: 2_500_000 },
    ],
    checklist: ['Booking MUA', 'Trial makeup', 'Konfirmasi jadwal touch up'],
  },
  {
    name: 'Busana',
    icon: 'shirt',
    colorHex: '#A98467',
    items: [
      { name: 'Busana pengantin', estimatedAmount: 12_000_000 },
      { name: 'Busana keluarga', estimatedAmount: 8_000_000 },
      { name: 'Aksesoris', estimatedAmount: 2_000_000 },
    ],
    checklist: ['Fitting pertama', 'Fitting final', 'Siapkan aksesoris'],
  },
  {
    name: 'Dokumentasi',
    icon: 'camera',
    colorHex: '#6D8EA0',
    items: [
      { name: 'Foto wedding', estimatedAmount: 10_000_000 },
      { name: 'Video wedding', estimatedAmount: 8_000_000 },
      { name: 'Same day edit', estimatedAmount: 3_000_000 },
    ],
    checklist: ['Booking fotografer', 'Susun shot list', 'Konfirmasi timeline liputan'],
  },
  {
    name: 'Undangan',
    icon: 'mail',
    colorHex: '#8F8BB3',
    items: [
      { name: 'Undangan digital', estimatedAmount: 1_500_000 },
      { name: 'Cetak undangan', estimatedAmount: 4_000_000 },
      { name: 'Amplop / label', estimatedAmount: 750_000 },
    ],
    checklist: ['Finalisasi daftar tamu', 'Approve desain undangan', 'Kirim undangan'],
  },
  {
    name: 'Souvenir & Hampers',
    icon: 'gift',
    colorHex: '#B59B5F',
    items: [
      { name: 'Souvenir tamu', estimatedAmount: 7_500_000 },
      { name: 'Hampers keluarga', estimatedAmount: 3_000_000 },
      { name: 'Packaging', estimatedAmount: 1_000_000 },
    ],
    checklist: ['Pilih souvenir', 'Approve sample', 'Konfirmasi jumlah produksi'],
  },
  {
    name: 'Entertainment / MC / Sound',
    icon: 'mic-2',
    colorHex: '#8E7D6B',
    items: [
      { name: 'MC', estimatedAmount: 3_500_000 },
      { name: 'Sound system', estimatedAmount: 6_000_000 },
      { name: 'Band / singer', estimatedAmount: 7_500_000 },
    ],
    checklist: ['Booking MC', 'Susun rundown', 'Kirim playlist'],
  },
  {
    name: 'Wedding Organizer / Crew',
    icon: 'users',
    colorHex: '#709C9C',
    items: [
      { name: 'WO full day', estimatedAmount: 12_000_000 },
      { name: 'Crew tambahan', estimatedAmount: 3_000_000 },
      { name: 'Technical meeting', estimatedAmount: 500_000 },
    ],
    checklist: ['Booking WO', 'Kirim list vendor', 'Technical meeting keluarga'],
  },
  {
    name: 'Administrasi Nikah',
    icon: 'file-text',
    colorHex: '#657A95',
    items: [
      { name: 'KUA / gereja / catatan sipil', estimatedAmount: 1_500_000 },
      { name: 'Dokumen legal', estimatedAmount: 750_000 },
      { name: 'Transport administrasi', estimatedAmount: 500_000 },
    ],
    checklist: ['Cek dokumen nikah', 'Ajukan administrasi', 'Konfirmasi jadwal akad'],
  },
  {
    name: 'Seserahan / Mahar',
    icon: 'package',
    colorHex: '#C0907A',
    items: [
      { name: 'Mahar', estimatedAmount: 5_000_000 },
      { name: 'Seserahan', estimatedAmount: 8_000_000 },
      { name: 'Dekor box seserahan', estimatedAmount: 1_500_000 },
    ],
    checklist: ['List item seserahan', 'Beli mahar', 'Packing seserahan'],
  },
  {
    name: 'Transport & Accommodation',
    icon: 'car',
    colorHex: '#7D8C69',
    items: [
      { name: 'Transport keluarga', estimatedAmount: 4_000_000 },
      { name: 'Hotel keluarga', estimatedAmount: 8_000_000 },
      { name: 'Parkir / bensin', estimatedAmount: 1_000_000 },
    ],
    checklist: ['Booking hotel', 'Atur transport keluarga', 'Bagikan itinerary'],
  },
  {
    name: 'Family / Adat',
    icon: 'heart-handshake',
    colorHex: '#B87979',
    items: [
      { name: 'Prosesi adat', estimatedAmount: 8_000_000 },
      { name: 'Konsumsi keluarga', estimatedAmount: 4_000_000 },
      { name: 'Seragam keluarga', estimatedAmount: 6_000_000 },
    ],
    checklist: ['Bahas prosesi keluarga', 'Susun PIC keluarga', 'Konfirmasi seragam'],
  },
  {
    name: 'Miscellaneous',
    icon: 'tray',
    colorHex: '#888888',
    items: [
      { name: 'Kebutuhan mendadak', estimatedAmount: 5_000_000 },
      { name: 'ATK / printing', estimatedAmount: 1_000_000 },
    ],
    checklist: ['Siapkan petty cash', 'Catat kebutuhan mendadak'],
  },
  {
    name: 'Contingency Fund',
    icon: 'shield',
    colorHex: '#5F7566',
    items: [{ name: 'Dana cadangan', estimatedAmount: 15_000_000 }],
    checklist: ['Tetapkan batas dana cadangan'],
  },
];

const batakTobaTemplate: CategoryTemplate[] = [
  {
    name: 'Sinamot / Mahar',
    icon: 'banknote',
    colorHex: '#B59B5F',
    items: [
      { name: 'Sinamot / tuhor', estimatedAmount: 50_000_000 },
      { name: 'Mahar gereja / pemberkatan', estimatedAmount: 5_000_000 },
      { name: 'Tanda pengikat keluarga', estimatedAmount: 2_000_000 },
    ],
    checklist: ['Diskusi awal sinamot', 'Finalisasi angka sinamot', 'Siapkan penyerahan sinamot'],
  },
  {
    name: 'Marhusip & Marhata Sinamot',
    icon: 'messages-square',
    colorHex: '#C0907A',
    items: [
      { name: 'Konsumsi marhusip', estimatedAmount: 4_000_000 },
      { name: 'Konsumsi marhata sinamot', estimatedAmount: 7_500_000 },
      { name: 'Domu-domu / buah / kue', estimatedAmount: 1_500_000 },
      { name: 'Transport keluarga inti', estimatedAmount: 2_000_000 },
    ],
    checklist: ['Tentukan utusan keluarga', 'Susun agenda marhusip', 'Catat kesepakatan marhata sinamot'],
  },
  {
    name: 'Martumpol & Gereja',
    icon: 'church',
    colorHex: '#657A95',
    items: [
      { name: 'Administrasi martumpol', estimatedAmount: 1_500_000 },
      { name: 'Hamuliateon huria saat martumpol', estimatedAmount: 2_000_000 },
      { name: 'Hamuliateon pemberkatan', estimatedAmount: 3_000_000 },
      { name: 'Koor gereja / musik gereja', estimatedAmount: 2_500_000 },
    ],
    checklist: ['Daftar martumpol', 'Konfirmasi pendeta dan jadwal', 'Siapkan dokumen gereja'],
  },
  ...generalIndonesianTemplate.slice(0, 8),
  {
    name: 'Pesta Adat / Ulaon Unjuk',
    icon: 'landmark',
    colorHex: '#B87979',
    items: [
      { name: 'Raja parhata / protokol adat', estimatedAmount: 6_000_000 },
      { name: 'Gondang / musik adat', estimatedAmount: 8_000_000 },
      { name: 'Jambar juhut / pembagian daging', estimatedAmount: 12_000_000 },
      { name: 'Dengke / ikan mas adat', estimatedAmount: 4_000_000 },
      { name: 'Panandaion / amplop adat keluarga', estimatedAmount: 10_000_000 },
    ],
    checklist: ['Tentukan raja parhata', 'Susun urutan ulaon unjuk', 'Konfirmasi kebutuhan jambar dan dengke'],
  },
  {
    name: 'Ulos / Songket / Adat Wear',
    icon: 'shirt',
    colorHex: '#A98467',
    items: [
      { name: 'Ulos hela', estimatedAmount: 2_500_000 },
      { name: 'Ulos pansamot', estimatedAmount: 2_000_000 },
      { name: 'Ulos keluarga', estimatedAmount: 8_000_000 },
      { name: 'Songket / sadum / tumtuman', estimatedAmount: 6_000_000 },
      { name: 'Busana adat pengantin', estimatedAmount: 12_000_000 },
    ],
    checklist: ['List penerima ulos', 'Beli/sewa songket', 'Final fitting busana adat'],
  },
  {
    name: 'Paulak Une / Maningkir Tangga',
    icon: 'home',
    colorHex: '#709C9C',
    items: [
      { name: 'Konsumsi paulak une', estimatedAmount: 4_000_000 },
      { name: 'Konsumsi maningkir tangga', estimatedAmount: 4_000_000 },
      { name: 'Bingkisan keluarga', estimatedAmount: 2_000_000 },
    ],
    checklist: ['Tentukan jadwal paulak une', 'Tentukan jadwal maningkir tangga', 'Siapkan konsumsi keluarga'],
  },
  {
    name: 'Miscellaneous',
    icon: 'tray',
    colorHex: '#888888',
    items: [
      { name: 'Kebutuhan mendadak', estimatedAmount: 7_500_000 },
      { name: 'ATK / printing / signage', estimatedAmount: 1_500_000 },
    ],
    checklist: ['Siapkan petty cash', 'Catat kebutuhan mendadak'],
  },
  {
    name: 'Contingency Fund',
    icon: 'shield',
    colorHex: '#5F7566',
    items: [{ name: 'Dana cadangan adat dan pesta', estimatedAmount: 20_000_000 }],
    checklist: ['Tetapkan batas dana cadangan'],
  },
];
