# FiveM Server Player Checker

เว็บไซต์สำหรับตรวจสอบผู้เล่นในเซิร์ฟเวอร์ FiveM โดยใช้ API ของ itools.zone โดยตรง

## คุณสมบัติ

- ✅ หน้าตาทันสมัยและ responsive ด้วย Tailwind CSS
- ✅ ฟอร์มกรอก IP/Domain และ Port
- ✅ **ใช้ itools.zone API ผ่าน CORS Proxy** - ไม่ต้องรัน server แยก
- ✅ **แปลง Domain เป็น IP อัตโนมัติ** (เช่น play.st20.app → 103.91.190.109)
- ✅ แสดงข้อมูลเซิร์ฟเวอร์แบบ JSON
- ✅ แสดงรายละเอียดผู้เล่นเมื่อคลิกชื่อ
- ✅ แสดง Discord Avatar ของผู้เล่น (ใช้ itools.zone API)
- ✅ ตารางผู้เล่นพร้อม Search Filter
- ✅ SweetAlert2 สำหรับ loading และ error messages
- ✅ รองรับ URL parameters (ip_address, port)

## การติดตั้งและรัน

### 🚀 Development

```bash
# วิธีที่ 1: ใช้ start.bat (แนะนำ)
start.bat

# วิธีที่ 2: Manual
npm install
npm run dev
```

**เปิดเว็บไซต์:** http://localhost:5173

### 🌐 Production

```bash
npm run build
```

จากนั้นอัปโหลดไฟล์ใน `dist/` ไปยัง web hosting ใดก็ได้

## วิธีการทำงาน

1. **Frontend** ส่งคำขอไปยัง **CORS Proxy Service** (allorigins.win)
2. **CORS Proxy** ส่งต่อไปยัง `https://itools.zone/fivem/` (แก้ปัญหา CORS)
3. **itools.zone API** แปลง Domain เป็น IP และดึงข้อมูลจาก FiveM Server
4. **CORS Proxy** ส่งข้อมูลกลับไปยัง Frontend
5. **Frontend** แสดงข้อมูลที่ได้รับ

## ตัวอย่างการใช้งาน

### ทดสอบกับ Domain:
- **Input:** `play.st20.app:30120`
- **Frontend → CORS Proxy:** `https://api.allorigins.win/raw?url=https://itools.zone/fivem/?ip_address=play.st20.app&port=30120`
- **CORS Proxy → itools.zone:** `https://itools.zone/fivem/?ip_address=play.st20.app&port=30120`
- **ระบบจะแปลงเป็น:** `103.91.190.109:30120`
- **แต่แสดงใน UI:** `play.st20.app` (ไม่เปลี่ยน)

### ทดสอบกับ IP:
- **Input:** `141.11.158.181:30120`
- **Frontend → CORS Proxy:** `https://api.allorigins.win/raw?url=https://itools.zone/fivem/?ip_address=141.11.158.181&port=30120`
- **CORS Proxy → itools.zone:** `https://itools.zone/fivem/?ip_address=141.11.158.181&port=30120`
- **ระบบใช้:** `141.11.158.181:30120` (ไม่เปลี่ยน)

## เทคโนโลยีที่ใช้

- **Frontend:** React + TypeScript + Tailwind CSS + SweetAlert2
- **API:** itools.zone FiveM API
- **Build Tool:** Vite
- **Package Manager:** npm

## โครงสร้างโปรเจค

```
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── start.bat           # Development start script
└── README.md           # คู่มือการใช้งาน
```

## 🚀 Quick Start

1. **ดับเบิลคลิก `start.bat`**
2. **เปิด http://localhost:5173**
3. **ทดสอบกับ `play.st20.app:30120`**

## 🎯 ข้อดี

- ✅ **ไม่ต้องรัน server แยก** - ใช้ CORS Proxy Service
- ✅ **ใช้ API ที่มีอยู่แล้ว** (itools.zone)
- ✅ **Modern React + TypeScript**
- ✅ **Responsive Design**
- ✅ **Easy to Deploy**

เว็บไซต์พร้อมใช้งานแล้ว! 🎉