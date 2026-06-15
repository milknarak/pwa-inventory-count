import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { EXCESS_POOL, HEADS } from '../inventory-count/inventory-count-mock-data';

/**
 * Real implementation would use a camera + QR-code decoder. For this practice
 * project we expose a list of "QR codes" (= itemCodes) that the user can pick
 * from a dropdown to simulate scanning.
 */
@Injectable({ providedIn: 'root' })
export class MockScanService {
  scanResult$ = new Subject<string>();

  getAvailableQrCodes(headId: number): { value: string; label: string }[] {
    const head = HEADS.find(h => h.phyCountHeadId === headId);
    const headItems = (head?.phyCounts ?? []).map(p => ({
      value: p.itemCode, label: `${p.licensePlateNo} ${p.provinceName} (${p.brandName} ${p.modelName})`,
    }));
    const excess = EXCESS_POOL.map(p => ({
      value: p.itemCode,
      label: `[เกิน] ${p.licensePlateNo} ${p.provinceName} (${p.brandName} ${p.modelName})`,
    }));
    return [...headItems, ...excess];
  }

  emit(itemCode: string) {
    // mimic real scanner output: "domain/path/.../itemCode"
    this.scanResult$.next(`scan/qr/${itemCode}`);
  }
}
