import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, catchError, filter, of, switchMap, take, takeUntil } from 'rxjs';

import { MobileModalService } from '../shared/mobile-modal.service';
import { MockScanService } from '../shared/mock-scan.service';
import { ShellHeaderComponent } from '../shared/shell-header.component';
import { SlideOverService } from '../shared/slide-over.service';
import { SnackbarService } from '../shared/snackbar.service';
import { ThaidatePipe } from '../shared/thaidate.pipe';

import {
  ChangeStatusAction, DropdownItem, HeadStatus, PhyCountHeadDetail, PhyCountItem,
  ResultFlag, ScanResult,
} from './qrts07.model';
import { Qrts07Service } from './qrts07.service';

interface MasterDropdowns {
  contracts: DropdownItem[];
  bodies: DropdownItem[];
  licensePlateNos: DropdownItem[];
  reasons: DropdownItem[];
}

@Component({
  selector: 'app-qrts07-adjust',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellHeaderComponent, ThaidatePipe],
  templateUrl: './qrts07-adjust.component.html',
})
export class Qrts07AdjustComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private modal = inject(MobileModalService);
  private slide = inject(SlideOverService);
  private snack = inject(SnackbarService);
  private qs = inject(Qrts07Service);
  private mockScan = inject(MockScanService);

  private destroy$ = new Subject<void>();

  // Constants exposed to template
  ResultFlag = ResultFlag;
  HeadStatus = HeadStatus;

  head: PhyCountHeadDetail = new PhyCountHeadDetail();
  term = '';

  manualForm!: FormGroup;
  master: MasterDropdowns = { contracts: [], bodies: [], licensePlateNos: [], reasons: [] };
  bodies$ = new BehaviorSubject<DropdownItem[]>([]);

  // Confirm modal controls
  confirmRemark = new FormControl<string | null>(null);
  confirmReason = new FormControl<string | null>(null);
  scanResult: ScanResult | null = null;
  private confirmDialogRef: any;
  manualDialogRef: any;
  private currentConfirmStatus: string | null = null;

  // Mock scan picker
  scanPicker = new FormControl<string | null>(null);
  scanOptions: DropdownItem[] = [];

  @ViewChild('confirmFound') confirmFound!: TemplateRef<any>;
  @ViewChild('confirmNotFound') confirmNotFound!: TemplateRef<any>;
  @ViewChild('confirmExcess') confirmExcess!: TemplateRef<any>;
  @ViewChild('manualEntry') manualEntry!: TemplateRef<any>;
  @ViewChild('scanPanel') scanPanel!: TemplateRef<any>;

  ngOnInit() {
    this.createManualForm();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('id'));
      this.loadHead(id);
      this.qs.getAdjustMaster(id).pipe(take(1)).subscribe(m => {
        Object.assign(this.master, m);
        this.scanOptions = this.mockScan.getAvailableQrCodes(id);
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.confirmDialogRef) this.confirmDialogRef.close();
    if (this.manualDialogRef) this.manualDialogRef.close();
  }

  private loadHead(id: number, keyword?: string) {
    this.qs.getDetail(id, keyword).pipe(takeUntil(this.destroy$)).subscribe(head => {
      this.head = head;
    });
  }

  searchByLicense(keyword: string) {
    this.term = keyword;
    this.loadHead(this.head.phyCountHeadId, keyword);
  }

  iconClass(item: PhyCountItem): string {
    const flag = item.resultFlag;
    if (flag === ResultFlag.Found)    return 'text-success';
    if (flag === ResultFlag.NotFound) return 'text-danger';
    if (flag === ResultFlag.Over)     return 'qrts07-icon-excess';
    return 'text-secondary';
  }

  // SA spec ข้อ 4.2.4: เมื่อ status = InProgress ต้องเปิดให้แก้ ResultFlag เดิมได้
  // (รวมคันที่นับเป็น Found/Over มาก่อน) — block เฉพาะเมื่อ head ถูกปิด (C/A/S) แล้ว
  notFound(item: PhyCountItem) {
    if (!this.isEditable()) return;
    this.qs.getItem({ itemCode: item.itemCode, phyCountHeadId: this.head.phyCountHeadId }).pipe(
      catchError(() => of(null)),
      filter(r => r != null),
      take(1)
    ).subscribe(result => {
      this.openConfirm(this.confirmNotFound, result!, ResultFlag.NotFound);
    });
  }

  // Edit guard — SA ข้อ 3.2 Complete disable, ข้อ 4.2 Pullback enable
  isEditable(): boolean {
    return this.head?.status !== HeadStatus.Complete
        && this.head?.status !== HeadStatus.Approved
        && this.head?.status !== HeadStatus.Cancel;
  }

  // Mock scan opens a slide-over with a dropdown of QR codes
  openScan() {
    this.scanPicker.setValue(null);
    this.slide.open(this.scanPanel, 'สแกน QR Code (mock)');
  }

  scanPick(itemCode: string) {
    if (!itemCode) return;
    this.qs.getItem({ itemCode, phyCountHeadId: this.head.phyCountHeadId }).pipe(
      catchError(() => of(null)),
      filter(r => r != null),
      take(1)
    ).subscribe(result => {
      this.scanResult = result;
      if (result!.isExcess) {
        this.openConfirm(this.confirmExcess, result!, ResultFlag.Over);
      } else {
        this.openConfirm(this.confirmFound, result!, ResultFlag.Found);
      }
    });
  }

  // Manual entry — pick CONTRACT + BODY
  openManual() {
    this.manualForm.reset();
    this.bodies$.next([]);
    this.qs.getDependency('contract', { phyCountHeadId: this.head.phyCountHeadId }).pipe(
      take(1)
    ).subscribe(dep => this.master.contracts = dep.contracts || []);

    this.manualDialogRef = this.modal.openTemplate(this.manualEntry, 'กรอกข้อมูล');
    this.manualDialogRef.afterClosed().pipe(take(1)).subscribe((submit: boolean) => {
      if (!submit) return;
      const v = this.manualForm.value;
      this.qs.getItem({
        phyCountHeadId: this.head.phyCountHeadId,
        contractNo: v.contractNo,
        bodyCode: v.bodyCode,
      }).pipe(
        catchError(() => of(null)),
        filter(r => r != null),
        take(1)
      ).subscribe(result => {
        this.scanResult = result!;
        if (result!.isExcess) {
          this.openConfirm(this.confirmExcess, result!, ResultFlag.Over);
        } else {
          this.openConfirm(this.confirmFound, result!, ResultFlag.Found);
        }
      });
    });
  }

  acceptManual() {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }
    this.manualDialogRef?.close(true);
  }

  private openConfirm(template: TemplateRef<any>, result: ScanResult, status: string) {
    this.confirmRemark.setValue(null);
    this.confirmReason.setValue(null);
    this.scanResult = result;
    this.currentConfirmStatus = status;
    this.confirmDialogRef = this.modal.openTemplate(template, 'ยืนยัน');
    this.confirmDialogRef.afterClosed().pipe(take(1)).subscribe((action: 'continue' | 'finish' | null) => {
      if (!action) return;
      this.qs.save({
        phyCountHeadId: this.head.phyCountHeadId,
        itemCode: result.itemCode,
        contractNo: result.contractNo,
        bodyCode: result.bodyCode,
        status,
        reasonCode: this.confirmReason.value,
        remark: this.confirmRemark.value,
      }).pipe(
        switchMap(() => this.qs.getDetail(this.head.phyCountHeadId, this.term))
      ).subscribe(updated => {
        this.head = updated;
        this.snack.success('บันทึกข้อมูลเรียบร้อย');
        if (action === 'finish') {
          this.slide.close();
        }
      });
    });
  }

  acceptFound()    { this.confirmDialogRef?.close('continue'); }
  acceptNotFound() {
    if (!this.confirmReason.value) {
      this.confirmReason.markAsTouched();
      this.confirmReason.setErrors({ required: true });
      return;
    }
    this.confirmDialogRef?.close('finish');
  }
  cancelNotFound() { this.confirmDialogRef?.close(null); }
  acceptExcessContinue() {
    if (!this.confirmReason.value) {
      this.confirmReason.markAsTouched();
      this.confirmReason.setErrors({ required: true });
      return;
    }
    this.confirmDialogRef?.close('continue');
  }
  acceptExcessFinish() {
    if (!this.confirmReason.value) {
      this.confirmReason.markAsTouched();
      this.confirmReason.setErrors({ required: true });
      return;
    }
    this.confirmDialogRef?.close('finish');
  }

  // ตรวจนับครบ / ดึงกลับ
  isCompletable(): boolean {
    return this.head?.totalCount > 0
        && (this.head.foundCount + this.head.notFoundCount) >= this.head.totalCount
        && this.head.status !== HeadStatus.Complete
        && this.head.status !== HeadStatus.Approved;
  }
  isPullbackable(): boolean {
    return this.head?.status === HeadStatus.Complete;
  }

  complete() {
    this.modal.confirm('ต้องการยืนยันว่าตรวจนับครบใช่หรือไม่?').pipe(take(1)).subscribe(ok => {
      if (!ok) return;
      this.qs.changeStatus(this.head.phyCountHeadId, ChangeStatusAction.Complete).pipe(
        switchMap(() => this.qs.getDetail(this.head.phyCountHeadId, this.term))
      ).subscribe(updated => {
        this.head = updated;
        this.snack.success('บันทึกข้อมูลเรียบร้อย');
      });
    });
  }

  pullback() {
    this.modal.confirm('ต้องการดึงกลับเพื่อแก้ไขใช่หรือไม่?').pipe(take(1)).subscribe(ok => {
      if (!ok) return;
      this.qs.changeStatus(this.head.phyCountHeadId, ChangeStatusAction.Pullback).pipe(
        switchMap(() => this.qs.getDetail(this.head.phyCountHeadId, this.term))
      ).subscribe(updated => {
        this.head = updated;
        this.snack.success('บันทึกข้อมูลเรียบร้อย');
      });
    });
  }

  back() {
    this.router.navigate(['/qrts07']);
  }

  private createManualForm() {
    this.manualForm = this.fb.group({
      licensePlateNo: [null],
      contractNo: [null, Validators.required],
      bodyCode: [null, Validators.required],
    });

    this.manualForm.controls['licensePlateNo'].valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(itemCode => {
      if (!itemCode) return;
      this.qs.getItem({ itemCode, phyCountHeadId: this.head.phyCountHeadId }).pipe(
        catchError(() => of(null)),
        filter(r => r != null),
        take(1)
      ).subscribe(result => {
        this.manualForm.patchValue({
          contractNo: result!.contractNo,
          bodyCode: result!.bodyCode,
        }, { emitEvent: false });
      });
    });

    this.manualForm.controls['contractNo'].valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(contractNo => {
      this.bodies$.next([]);
      if (!contractNo) return;
      this.qs.getDependency('body', {
        phyCountHeadId: this.head.phyCountHeadId,
        contractNo,
      }).pipe(take(1)).subscribe(dep => this.bodies$.next(dep.bodies || []));
    });
  }
}
