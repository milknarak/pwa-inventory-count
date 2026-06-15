import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ShellHeaderComponent } from '../shared/shell-header.component';
import { SlideOverService } from '../shared/slide-over.service';
import { ThaidatePipe } from '../shared/thaidate.pipe';

import {
  DropdownItem, ListQuery, PhyCountHeadListRow,
} from './inventory-count.model';
import { InventoryCountService } from './inventory-count.service';

@Component({
  selector: 'app-inventory-count-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellHeaderComponent, ThaidatePipe],
  templateUrl: './inventory-count-list.component.html',
})
export class InventoryCountListComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private qs = inject(InventoryCountService);
  private slide = inject(SlideOverService);

  private destroy$ = new Subject<void>();

  master = {
    seller: null as any,
    wareHouses: [] as DropdownItem[],
    productCategories: [] as DropdownItem[],
    statuses: [] as DropdownItem[],
  };

  searchForm!: FormGroup;
  term = '';
  rows: PhyCountHeadListRow[] = [];
  loading = false;

  @ViewChild('filterPanel') filterPanel!: TemplateRef<any>;

  ngOnInit() {
    this.searchForm = this.fb.group({
      preparedate: [null],
      wareHouseCode: [null],
      productCategoryCode: [null],
      status: [null],
    });

    this.qs.getMaster().pipe(takeUntil(this.destroy$)).subscribe(m => {
      Object.assign(this.master, m);
      if (this.master.wareHouses.length === 1) {
        this.searchForm.controls['wareHouseCode'].setValue(this.master.wareHouses[0].value);
      }
      if (this.master.productCategories.length === 1) {
        this.searchForm.controls['productCategoryCode'].setValue(this.master.productCategories[0].value);
      }
      this.reload();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  search(term: string) {
    this.term = term;
    this.reload();
  }

  openFilter() {
    this.slide.open(this.filterPanel, 'ตัวกรอง');
  }

  advanceSearch() {
    this.reload();
    this.slide.close();
  }

  clear() {
    this.searchForm.reset({
      preparedate: null,
      wareHouseCode: null,
      productCategoryCode: null,
      status: null,
    });
  }

  open(row: PhyCountHeadListRow) {
    this.router.navigate(['/inventory-count/adjust', row.phyCountHeadId]);
  }

  goDashboard() {
    // single-screen practice app — nowhere to go back to.
  }

  private reload() {
    this.loading = true;
    const v = this.searchForm.getRawValue();
    const query: ListQuery = {
      preparedate: v.preparedate ? new Date(v.preparedate) : null,
      wareHouseCode: v.wareHouseCode,
      productCategoryCode: v.productCategoryCode,
      status: v.status,
      keyword: this.term,
    };
    this.qs.getDatas({ page: 1, pageSize: 100 }, query).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.rows = result.items;
      this.loading = false;
    });
  }
}
