# PWA Inventory Count (QRTS07 Practice)

- **ข้อมูลทั้งหมดเป็น mock** เก็บอยู่ในหน่วยความจำ (ดู `src/app/qrts07/qrts07-mock-data.ts`) — รีเฟรชหน้าแล้วข้อมูลรีเซ็ต
- **ไม่มีระบบ translate** ทุกข้อความถูก hardcode เป็นภาษาไทย
- เปิด `http://localhost:4200/` แล้วจะเด้งเข้าหน้า QRTS07 ทันที (default route = `/qrts07`)

## รัน dev server

```bash
npm install
npm start
```

แล้วเปิด `http://localhost:4200/`

## Build

```bash
npm run build                # production build → dist/pwa-inventory-count
```

## โครงสร้าง

```
src/app/
├── app.ts                          (root standalone component, mount router-outlet + global overlays)
├── app.config.ts                   (providers: router, service-worker)
├── app.routes.ts                   (router: '' → 'qrts07')
├── qrts07/
│   ├── qrts07.model.ts             (interfaces, enums, constants)
│   ├── qrts07-mock-data.ts         (master + transaction seed data)
│   ├── qrts07.service.ts           (mock backend ใน memory)
│   ├── qrts07-list.component.*     (หน้า List + advance filter)
│   └── qrts07-adjust.component.*   (หน้า Adjust: สแกน/กรอกข้อมูล/confirm)
└── shared/
    ├── shell-header.component.ts   (header แถบสีส้ม)
    ├── slide-over.*                (panel เลื่อนจากขวา)
    ├── mobile-modal.*              (modal กลางจอ + confirm dialog)
    ├── snackbar.*                  (toast)
    ├── mock-scan.service.ts        (ใช้ dropdown แทนกล้องสแกน)
    └── thaidate.pipe.ts            (วันที่ไทย พ.ศ. แบบย่อ)
```

## ฟีเจอร์ที่พอร์ตมาครบ

### หน้า List
- Search keyword (คลัง / หมวด / หมายเหตุ)
- Advance filter slide-over: วันที่นับ / คลัง / หมวดสินค้า / สถานะ
- ปุ่ม `ค้นหา` / `ล้าง`
- กดที่ item → ไปหน้า adjust พร้อม `phyCountHeadId`

### หน้า Adjust
- ปุ่ม `สแกน QR Code` (จำลองด้วย dropdown รายการ QR codes — เลือกได้ทั้งคันในรอบนับ และคัน [เกิน] นอกรอบ)
- ปุ่ม `กรอกข้อมูล` (CONTRACT + BODY)
- กด icon clipboard ของแต่ละคัน → confirm NotFound
- Confirm modal 3 แบบ: Found / NotFound / Excess
  - Found ไม่ต้อง validate
  - NotFound / Excess ต้องเลือก Reason
- ปุ่มล่าง `ตรวจนับครบ` / `ดึงกลับ` ตาม `isCompletable()` / `isPullbackable()`
- Status flow: D → I → C ⇄ Pullback I

### Status flow คุมปุ่ม
| HeadStatus | Scan / Manual / แก้ ResultFlag | Complete | Pullback |
|---|---|---|---|
| `D` Draft / `W` Wait / `I` InProgress | ✅ | ตามจำนวน | ❌ |
| `C` Complete | ❌ | ❌ | ✅ |
| `A` Approved / `S` Cancel | ❌ | ❌ | ❌ |

ResultFlag: `W` Wait (null) / `Y` Found / `N` NotFound / `O` Over
