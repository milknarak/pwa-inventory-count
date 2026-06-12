import { Pipe, PipeTransform } from '@angular/core';

const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

@Pipe({ name: 'thaidate', standalone: true })
export class ThaidatePipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(+d)) return '';
    const day = d.getDate();
    const month = TH_MONTHS_SHORT[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2);
    return `${day} ${month} ${year}`;
  }
}
