import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import {
  ChangeStatusAction, CheckItemParams, HeadStatus, ListQuery, PageRequest,
  PageResult, PhyCountHeadDetail, PhyCountHeadListRow, PhyCountItem, ResultFlag,
  SaveAdjust, ScanResult,
} from './inventory-count.model';
import {
  EXCESS_POOL, HEADS, newDetailId, PRODUCT_CATEGORIES, PROVINCES,
  REASONS, recomputeHeadCounts, SELLER, STATUSES, WAREHOUSES,
} from './inventory-count-mock-data';

/**
 * Mock backend for the inventory count screen. Stores state in memory;
 * refreshing the page resets everything.
 */
@Injectable({ providedIn: 'root' })
export class InventoryCountService {

  private heads = HEADS;
  private excessPool = EXCESS_POOL;

  // Latency to mimic real network calls — keep it low so dev feels snappy.
  private readonly latency = 80;

  // ANCHOR Master data
  getMaster(): Observable<any> {
    return of({
      seller: SELLER,
      wareHouses: WAREHOUSES,
      productCategories: PRODUCT_CATEGORIES,
      statuses: STATUSES,
    }).pipe(delay(this.latency));
  }

  getDependency(name: string, extra: any): Observable<any> {
    if (name === 'contract') {
      const head = this.findHead(extra.phyCountHeadId);
      const contracts = Array.from(new Set((head?.phyCounts ?? []).map(p => p.contractNo)))
        .map(c => ({ value: c, label: c }));
      return of({ contracts }).pipe(delay(this.latency));
    }
    if (name === 'body') {
      const head = this.findHead(extra.phyCountHeadId);
      const bodies = (head?.phyCounts ?? [])
        .filter(p => p.contractNo === extra.contractNo)
        .map(p => ({ value: p.bodyCode, label: p.bodyCode }));
      return of({ bodies }).pipe(delay(this.latency));
    }
    return of({}).pipe(delay(this.latency));
  }

  // ANCHOR Adjust-screen master (reasons, license plates, contracts, bodies)
  getAdjustMaster(phyCountHeadId: number): Observable<any> {
    const head = this.findHead(phyCountHeadId);
    const licensePlateNos = (head?.phyCounts ?? []).map(p => ({
      value: p.itemCode, label: `${p.licensePlateNo} ${p.provinceName}`,
    }));
    const contracts = Array.from(new Set((head?.phyCounts ?? []).map(p => p.contractNo)))
      .map(c => ({ value: c, label: c }));
    const bodies = (head?.phyCounts ?? []).map(p => ({ value: p.bodyCode, label: p.bodyCode }));
    return of({
      contracts, bodies, licensePlateNos, reasons: REASONS,
    }).pipe(delay(this.latency));
  }

  // ANCHOR List page
  getDatas(page: PageRequest, query: ListQuery): Observable<PageResult<PhyCountHeadListRow>> {
    let result = this.heads.slice();

    if (query.preparedate) {
      const target = new Date(query.preparedate);
      result = result.filter(h => sameDay(h.preparedate, target));
    }
    if (query.wareHouseCode) result = result.filter(h => h.wareHouseCode === query.wareHouseCode);
    if (query.productCategoryCode) result = result.filter(h => h.productCategoryCode === query.productCategoryCode);
    if (query.status) result = result.filter(h => h.status === query.status);
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      result = result.filter(h =>
        (h.wareHouseName ?? '').toLowerCase().includes(kw) ||
        (h.productCategoryName ?? '').toLowerCase().includes(kw) ||
        (h.remark ?? '').toLowerCase().includes(kw));
    }

    // Default sort: preparedate desc
    result = result.sort((a, b) => +b.preparedate - +a.preparedate);

    const pageNo = page.page ?? 1;
    const pageSize = page.pageSize ?? 20;
    const total = result.length;
    const items = result.slice((pageNo - 1) * pageSize, pageNo * pageSize)
      .map(h => this.headToRow(h));

    return of({ items, total, page: pageNo, pageSize }).pipe(delay(this.latency));
  }

  // ANCHOR Detail
  getDetail(phyCountHeadId: number, keyword?: string): Observable<PhyCountHeadDetail> {
    const head = this.findHead(phyCountHeadId);
    if (!head) return throwError(() => new Error('not found'));
    const clone = this.cloneHead(head);
    if (keyword) {
      const kw = keyword.toLowerCase();
      clone.phyCounts = clone.phyCounts.filter(p =>
        (p.licensePlateNo ?? '').toLowerCase().includes(kw));
    }
    return of(clone).pipe(delay(this.latency));
  }

  // ANCHOR Get one item — used by scan / manual / tap-clipboard flows.
  getItem(params: CheckItemParams): Observable<ScanResult> {
    const head = this.findHead(params.phyCountHeadId);
    if (!head) return throwError(() => new Error('head not found'));

    // 1) itemCode — direct lookup in head
    let item: PhyCountItem | undefined;
    if (params.itemCode) {
      item = head.phyCounts.find(p => p.itemCode === params.itemCode);
    }
    // 2) contract + body
    else if (params.contractNo && params.bodyCode) {
      item = head.phyCounts.find(p =>
        p.contractNo === params.contractNo && p.bodyCode === params.bodyCode);
    }

    if (item) return of(this.itemToScanResult(item, false)).pipe(delay(this.latency));

    // 3) Try excess pool — itemCode only
    if (params.itemCode) {
      const excess = this.excessPool.find(p => p.itemCode === params.itemCode);
      if (excess) return of(this.itemToScanResult(excess, true)).pipe(delay(this.latency));
    }

    return throwError(() => new Error('item not found')).pipe(delay(this.latency));
  }

  // ANCHOR Save adjust — Found / NotFound / Excess
  save(form: SaveAdjust): Observable<void> {
    const head = this.findHead(form.phyCountHeadId);
    if (!head) return throwError(() => new Error('head not found'));

    // Promote Draft / Wait to InProgress on first save (real BE does this).
    if (head.status === HeadStatus.Draft || head.status === HeadStatus.Wait) {
      head.status = HeadStatus.InProgress;
    }

    let item = head.phyCounts.find(p =>
      (form.itemCode && p.itemCode === form.itemCode) ||
      (form.contractNo && form.bodyCode && p.contractNo === form.contractNo && p.bodyCode === form.bodyCode));

    if (!item) {
      // Excess — pull from pool, attach to this head as a new detail.
      const source = this.excessPool.find(p => p.itemCode === form.itemCode);
      if (source) {
        item = { ...source };
        item.phyCountDetailId = newDetailId();
        item.phyCountHeadId = head.phyCountHeadId;
        head.phyCounts.push(item);
      }
    }

    if (!item) return throwError(() => new Error('item not found'));

    item.resultFlag = form.status;
    item.reasonCode = form.reasonCode ?? null;
    item.remark = form.remark ?? null;

    recomputeHeadCounts(head);
    return of(void 0).pipe(delay(this.latency));
  }

  // ANCHOR Change status: Complete / Pullback
  changeStatus(phyCountHeadId: number, action: ChangeStatusAction): Observable<void> {
    const head = this.findHead(phyCountHeadId);
    if (!head) return throwError(() => new Error('head not found'));

    if (action === ChangeStatusAction.Complete) {
      head.status = HeadStatus.Complete;
    } else if (action === ChangeStatusAction.Pullback) {
      head.status = HeadStatus.InProgress;
    }
    return of(void 0).pipe(delay(this.latency));
  }

  // ANCHOR Helpers
  private findHead(id: number): PhyCountHeadDetail | undefined {
    return this.heads.find(h => h.phyCountHeadId === id);
  }

  private cloneHead(h: PhyCountHeadDetail): PhyCountHeadDetail {
    const clone = new PhyCountHeadDetail();
    Object.assign(clone, h);
    clone.phyCounts = h.phyCounts.map(p => ({ ...p }));
    return clone;
  }

  private headToRow(h: PhyCountHeadDetail): PhyCountHeadListRow {
    return {
      phyCountHeadId: h.phyCountHeadId,
      preparedate: h.preparedate,
      wareHouseCode: h.wareHouseCode,
      wareHouseName: h.wareHouseName,
      productCategoryCode: h.productCategoryCode,
      productCategoryName: h.productCategoryName,
      sellerCode: h.sellerCode,
      status: h.status,
      remark: h.remark,
      totalCount: h.totalCount,
      countedCount: h.countedCount,
      foundCount: h.foundCount,
      notFoundCount: h.notFoundCount,
      excessCount: h.excessCount,
    };
  }

  private itemToScanResult(item: PhyCountItem, isExcess: boolean): ScanResult {
    const r = new ScanResult();
    r.itemCode = item.itemCode;
    r.phyCountHeadId = item.phyCountHeadId;
    r.phyCountDetailId = item.phyCountDetailId;
    r.resultFlag = item.resultFlag;
    r.remark = item.remark;
    r.reasonCode = item.reasonCode;
    r.licensePlateNo = item.licensePlateNo;
    r.provinceName = item.provinceName;
    r.brandName = item.brandName;
    r.modelName = item.modelName;
    r.color = item.color;
    r.year = item.year;
    r.bodyCode = item.bodyCode;
    r.contractNo = item.contractNo;
    r.oceng = item.oceng;
    const d = new Date(); d.setDate(d.getDate() - 30);
    r.receivedDate = d;
    r.releaseDate = null;
    r.sellerName = SELLER.sellerName;
    r.isExcess = isExcess;
    return r;
  }
}

function sameDay(a: Date, b: Date): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear()
      && da.getMonth() === db.getMonth()
      && da.getDate() === db.getDate();
}
