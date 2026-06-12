import {
  DropdownItem, HeadStatus, PhyCountHeadDetail, PhyCountItem, ResultFlag
} from './qrts07.model';

// Master mock data
export const SELLER = { sellerCode: 'S001', sellerName: 'บริษัท นาราก ออคชั่น จำกัด' };

export const WAREHOUSES: DropdownItem[] = [
  { value: 'WH01', label: 'คลังกรุงเทพ' },
  { value: 'WH02', label: 'คลังเชียงใหม่' },
  { value: 'WH03', label: 'คลังขอนแก่น' },
];

export const PRODUCT_CATEGORIES: DropdownItem[] = [
  { value: 'CAR', label: 'รถยนต์' },
  { value: 'TRUCK', label: 'รถบรรทุก' },
  { value: 'BIKE', label: 'จักรยานยนต์' },
];

export const STATUSES: DropdownItem[] = [
  { value: HeadStatus.Draft, label: 'แบบร่าง' },
  { value: HeadStatus.Wait, label: 'รอตรวจนับ' },
  { value: HeadStatus.InProgress, label: 'กำลังตรวจนับ' },
  { value: HeadStatus.Complete, label: 'ตรวจนับครบ' },
  { value: HeadStatus.Approved, label: 'อนุมัติแล้ว' },
  { value: HeadStatus.Cancel, label: 'ยกเลิก' },
];

export const REASONS: DropdownItem[] = [
  { value: 'R01', label: 'รถยังไม่เข้าคลัง' },
  { value: 'R02', label: 'รถถูกย้ายโดยไม่แจ้ง' },
  { value: 'R03', label: 'รถเสียหาย' },
  { value: 'R04', label: 'รถถูกส่งคืน' },
  { value: 'R05', label: 'อื่น ๆ' },
];

export const PROVINCES: DropdownItem[] = [
  { value: 'BKK', label: 'กรุงเทพมหานคร' },
  { value: 'CNX', label: 'เชียงใหม่' },
  { value: 'KKC', label: 'ขอนแก่น' },
  { value: 'CRI', label: 'เชียงราย' },
];

export const BRANDS = ['Toyota', 'Honda', 'Isuzu', 'Mitsubishi', 'Ford', 'Mazda'];
export const MODELS: { [key: string]: string[] } = {
  Toyota: ['Vios', 'Yaris', 'Camry', 'Hilux'],
  Honda: ['City', 'Civic', 'Jazz', 'Accord'],
  Isuzu: ['D-Max', 'MU-X'],
  Mitsubishi: ['Triton', 'Mirage', 'Pajero'],
  Ford: ['Ranger', 'Everest'],
  Mazda: ['Mazda2', 'Mazda3', 'BT-50'],
};
export const COLORS = ['ขาว', 'ดำ', 'เทา', 'แดง', 'น้ำเงิน', 'เงิน'];

// ID counter for new detail rows
let nextDetailId = 10000;
let nextHeadId = 100;
let nextItemCode = 1000;

export function newDetailId() { return ++nextDetailId; }
export function newHeadId() { return ++nextHeadId; }
export function newItemCode() { return `ITEM${++nextItemCode}`; }

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePhyCountItem(headId: number, idx: number): PhyCountItem {
  const brand = randomFromArray(BRANDS);
  const model = randomFromArray(MODELS[brand]);
  const province = randomFromArray(PROVINCES);
  const plate = `${1000 + idx}-${String.fromCharCode(65 + (idx % 26))}${String.fromCharCode(65 + ((idx + 1) % 26))}`;

  const item = new PhyCountItem();
  item.phyCountDetailId = newDetailId();
  item.phyCountHeadId = headId;
  item.itemCode = newItemCode();
  item.resultFlag = null;
  item.licensePlateNo = plate;
  item.provinceName = province.label;
  item.brandName = brand;
  item.modelName = model;
  item.color = randomFromArray(COLORS);
  item.year = 2015 + Math.floor(Math.random() * 10);
  item.oceng = `ENG${100000 + Math.floor(Math.random() * 900000)}`;
  item.bodyCode = `BODY${100000 + Math.floor(Math.random() * 900000)}`;
  item.contractNo = `CT${20240000 + Math.floor(Math.random() * 9999)}`;
  return item;
}

function makeHead(opts: {
  warehouseCode: string;
  warehouseName: string;
  categoryCode: string;
  categoryName: string;
  daysAgo: number;
  status: string;
  itemCount: number;
  remark?: string;
}): PhyCountHeadDetail {
  const head = new PhyCountHeadDetail();
  head.phyCountHeadId = newHeadId();
  const d = new Date();
  d.setDate(d.getDate() - opts.daysAgo);
  head.preparedate = d;
  head.wareHouseCode = opts.warehouseCode;
  head.wareHouseName = opts.warehouseName;
  head.productCategoryCode = opts.categoryCode;
  head.productCategoryName = opts.categoryName;
  head.sellerCode = SELLER.sellerCode;
  head.status = opts.status;
  head.remark = opts.remark || null;
  head.phyCounts = Array.from({ length: opts.itemCount }, (_, i) =>
    makePhyCountItem(head.phyCountHeadId, i + 1));

  // Pre-fill some result flags for non-Draft statuses
  if (opts.status === HeadStatus.InProgress) {
    const partial = Math.floor(opts.itemCount * 0.6);
    for (let i = 0; i < partial; i++) {
      head.phyCounts[i].resultFlag = i % 5 === 0 ? ResultFlag.NotFound : ResultFlag.Found;
      if (head.phyCounts[i].resultFlag === ResultFlag.NotFound) {
        head.phyCounts[i].reasonCode = 'R01';
      }
    }
  } else if (opts.status === HeadStatus.Complete || opts.status === HeadStatus.Approved) {
    for (let i = 0; i < opts.itemCount; i++) {
      head.phyCounts[i].resultFlag = i % 7 === 0 ? ResultFlag.NotFound : ResultFlag.Found;
      if (head.phyCounts[i].resultFlag === ResultFlag.NotFound) {
        head.phyCounts[i].reasonCode = 'R02';
      }
    }
  }

  recomputeHeadCounts(head);
  return head;
}

export function recomputeHeadCounts(head: PhyCountHeadDetail) {
  head.totalCount = head.phyCounts.length;
  head.foundCount = head.phyCounts.filter(p => p.resultFlag === ResultFlag.Found).length;
  head.notFoundCount = head.phyCounts.filter(p => p.resultFlag === ResultFlag.NotFound).length;
  head.excessCount = head.phyCounts.filter(p => p.resultFlag === ResultFlag.Over).length;
  head.countedCount = head.foundCount + head.notFoundCount + head.excessCount;
}

// Seed transactions
export const HEADS: PhyCountHeadDetail[] = [
  makeHead({
    warehouseCode: 'WH01', warehouseName: 'คลังกรุงเทพ',
    categoryCode: 'CAR', categoryName: 'รถยนต์',
    daysAgo: 0, status: HeadStatus.InProgress, itemCount: 10,
    remark: 'รอบนับประจำเดือน มิ.ย.',
  }),
  makeHead({
    warehouseCode: 'WH01', warehouseName: 'คลังกรุงเทพ',
    categoryCode: 'TRUCK', categoryName: 'รถบรรทุก',
    daysAgo: 0, status: HeadStatus.Draft, itemCount: 6,
  }),
  makeHead({
    warehouseCode: 'WH02', warehouseName: 'คลังเชียงใหม่',
    categoryCode: 'CAR', categoryName: 'รถยนต์',
    daysAgo: 1, status: HeadStatus.Wait, itemCount: 8,
  }),
  makeHead({
    warehouseCode: 'WH02', warehouseName: 'คลังเชียงใหม่',
    categoryCode: 'BIKE', categoryName: 'จักรยานยนต์',
    daysAgo: 2, status: HeadStatus.Complete, itemCount: 5,
    remark: 'นับครบแล้ว รอตรวจสอบ',
  }),
  makeHead({
    warehouseCode: 'WH03', warehouseName: 'คลังขอนแก่น',
    categoryCode: 'CAR', categoryName: 'รถยนต์',
    daysAgo: 3, status: HeadStatus.Approved, itemCount: 12,
  }),
  makeHead({
    warehouseCode: 'WH03', warehouseName: 'คลังขอนแก่น',
    categoryCode: 'TRUCK', categoryName: 'รถบรรทุก',
    daysAgo: 5, status: HeadStatus.Cancel, itemCount: 4,
    remark: 'ยกเลิกตามคำสั่ง สาขา',
  }),
];

// Spare items that are NOT in any head — these can be scanned/manually entered
// to trigger the "excess" flow.
export const EXCESS_POOL: PhyCountItem[] = Array.from({ length: 8 }, (_, i) => {
  const headId = -1;
  const item = makePhyCountItem(headId, 9000 + i);
  return item;
});
