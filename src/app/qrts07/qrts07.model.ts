// Status flags align with the original AAA eAuction QRTS07 spec.
export const ResultFlag = {
  Wait: 'W',
  Found: 'Y',
  NotFound: 'N',
  Over: 'O',
} as const;

export const HeadStatus = {
  Draft: 'D',
  Wait: 'W',
  InProgress: 'I',
  Complete: 'C',
  Approved: 'A',
  Cancel: 'S',
} as const;

export type ResultFlagType = typeof ResultFlag[keyof typeof ResultFlag];
export type HeadStatusType = typeof HeadStatus[keyof typeof HeadStatus];

export enum ChangeStatusAction {
  Complete = 1,
  Pullback = 2,
}

export class PhyCountItem {
  phyCountDetailId!: number;
  phyCountHeadId!: number;
  itemCode!: string;
  resultFlag: string | null = null; // null = Wait
  remark: string | null = null;
  reasonCode: string | null = null;
  licensePlateNo!: string;
  provinceName!: string;
  brandName!: string;
  modelName!: string;
  color!: string;
  year!: number;
  oceng!: string;
  bodyCode!: string;
  contractNo!: string;
}

export class PhyCountHeadDetail {
  phyCountHeadId!: number;
  preparedate!: Date;
  wareHouseCode!: string;
  wareHouseName!: string;
  productCategoryCode!: string;
  productCategoryName!: string;
  sellerCode!: string;
  status!: string;
  remark: string | null = null;
  totalCount = 0;
  countedCount = 0;
  foundCount = 0;
  notFoundCount = 0;
  excessCount = 0;
  phyCounts: PhyCountItem[] = [];
}

export class PhyCountHeadListRow {
  phyCountHeadId!: number;
  preparedate!: Date;
  wareHouseCode!: string;
  wareHouseName!: string;
  productCategoryCode!: string;
  productCategoryName!: string;
  sellerCode!: string;
  status!: string;
  remark: string | null = null;
  totalCount!: number;
  countedCount!: number;
  foundCount!: number;
  notFoundCount!: number;
  excessCount!: number;
}

export class ScanResult {
  itemCode!: string;
  phyCountHeadId!: number;
  phyCountDetailId: number | null = null;
  resultFlag: string | null = null;
  remark: string | null = null;
  reasonCode: string | null = null;
  licensePlateNo!: string;
  provinceName!: string;
  brandName!: string;
  modelName!: string;
  color!: string;
  year!: number;
  bodyCode!: string;
  contractNo!: string;
  oceng!: string;
  receivedDate: Date | null = null;
  releaseDate: Date | null = null;
  sellerName!: string;
  isExcess = false;
}

export interface SaveAdjust {
  phyCountHeadId: number;
  itemCode?: string;
  contractNo?: string;
  bodyCode?: string;
  status: string; // ResultFlag.Found / NotFound / Over
  reasonCode?: string | null;
  remark?: string | null;
}

export interface CheckItemParams {
  phyCountHeadId: number;
  itemCode?: string;
  contractNo?: string;
  bodyCode?: string;
}

export interface DropdownItem {
  value: string;
  label: string;
}

export interface PageRequest {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  preparedate?: Date | null;
  wareHouseCode?: string | null;
  productCategoryCode?: string | null;
  status?: string | null;
  keyword?: string | null;
}
