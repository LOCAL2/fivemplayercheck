# Discord OAuth Setup Guide

## การตั้งค่า Discord OAuth สำหรับ FiveM Player Monitor

### ขั้นตอนการตั้งค่า Discord Application

1. **เข้าสู่ Discord Developer Portal**
   - ไปที่ https://discord.com/developers/applications
   - เข้าสู่ระบบด้วยบัญชี Discord ของคุณ

2. **สร้าง Application ใหม่**
   - คลิก "New Application"
   - ตั้งชื่อแอปพลิเคชัน เช่น "FiveM Player Monitor"
   - คลิก "Create"

3. **ตั้งค่า OAuth2**
   - ไปที่แท็บ "OAuth2" ในเมนูด้านซ้าย
   - ในส่วน "Redirects" เพิ่ม URL:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - คลิก "Save Changes"

4. **คัดลอกข้อมูลสำคัญ**
   - **Client ID**: คัดลอกจากหน้า General Information
   - **Client Secret**: คลิก "Reset Secret" แล้วคัดลอก (เก็บไว้ให้ปลอดภัย!)

### การตั้งค่าไฟล์ Environment

1. **แก้ไขไฟล์ `.env.local`**
   ```env
   # Discord OAuth Configuration
   VITE_DISCORD_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
   VITE_DISCORD_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
   VITE_DISCORD_REDIRECT_URI=http://localhost:3000
   ```

2. **ตัวอย่างค่าที่ถูกต้อง**
   ```env
   VITE_DISCORD_CLIENT_ID=1234567890123456789
   VITE_DISCORD_CLIENT_SECRET=abcdef1234567890abcdef1234567890
   VITE_DISCORD_REDIRECT_URI=http://localhost:3000
   ```

### การทดสอบ

1. **รีสตาร์ทเซิร์ฟเวอร์พัฒนา**
   ```bash
   npm run dev
   # หรือ
   yarn dev
   ```

2. **ทดสอบการเข้าสู่ระบบ**
   - เปิดแอปพลิเคชันในเบราว์เซอร์
   - คลิกปุ่ม "Login with Discord"
   - ควรเปิดหน้าต่าง popup สำหรับ Discord OAuth

### การแก้ไขปัญหา

#### ปัญหาที่พบบ่อย

1. **"Discord Client ID not configured"**
   - ตรวจสอบว่าไฟล์ `.env.local` มีค่า `VITE_DISCORD_CLIENT_ID`
   - รีสตาร์ทเซิร์ฟเวอร์พัฒนาหลังแก้ไข environment variables

2. **"Invalid OAuth2 redirect_uri"**
   - ตรวจสอบว่า redirect URI ใน Discord Application ตรงกับที่ตั้งไว้
   - ตรวจสอบ port ที่ใช้ (3000 หรือ 5173)

3. **"Invalid client_secret"**
   - Client Secret อาจหมดอายุ ให้ reset ใหม่ใน Discord Developer Portal
   - ตรวจสอบว่าคัดลอกถูกต้องและไม่มีช่องว่างเพิ่มเติม

4. **"ERR_CONNECTION_REFUSED" หรือ "This site can't be reached"**
   - เซิร์ฟเวอร์พัฒนายังไม่ทำงาน ให้รัน `npm run dev`
   - ตรวจสอบว่าเซิร์ฟเวอร์ทำงานที่ port ที่ถูกต้อง (5173 สำหรับ Vite)
   - อัปเดต redirect URI ใน Discord Developer Portal ให้ตรงกับ port ที่ใช้งาน

5. **มี OAuth code ใน URL แต่ไม่สามารถเข้าถึงได้**
   - คัดลอก URL ทั้งหมด แล้วเปลี่ยน port จาก 3000 เป็น 5173
   - ตัวอย่าง: เปลี่ยนจาก `http://localhost:3000/?code=...` เป็น `http://localhost:5173/?code=...`
   - หรือคลิกปุ่ม "Clear & Retry" ในแบนเนอร์สีแดงที่ปรากฏ

6. **"Invalid code" หรือ "Authorization code expired"**
   - OAuth code มีอายุสั้นมาก (ประมาณ 10 นาที)
   - คลิกปุ่ม "Clear & Retry" แล้วลองเข้าสู่ระบบใหม่
   - ตรวจสอบว่าเซิร์ฟเวอร์ทำงานก่อนคลิก "Login with Discord"

### ความปลอดภัย

⚠️ **คำเตือนสำคัญ**:
- **ห้าม** commit ไฟล์ `.env.local` ลง Git
- **ห้าม** แชร์ Client Secret กับผู้อื่น
- ใช้ไฟล์ `.env.example` เป็นตัวอย่างเท่านั้น

### สิทธิ์ที่ใช้

แอปพลิเคชันนี้ใช้สิทธิ์ Discord ดังนี้:
- `identify`: อ่านข้อมูลพื้นฐานของผู้ใช้ (username, avatar, ID)

### ขั้นตอนสำคัญ: อัปเดต Discord Developer Portal

**หลังจากเริ่มเซิร์ฟเวอร์แล้ว ให้ทำตามขั้นตอนนี้:**

1. **ไปที่ Discord Developer Portal**
   - เข้า https://discord.com/developers/applications
   - เลือก Application ของคุณ

2. **อัปเดต OAuth2 Redirects**
   - ไปที่แท็บ "OAuth2"
   - ในส่วน "Redirects" ให้มี URL ทั้งสองนี้:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - คลิก "Save Changes"

3. **ทดสอบการเข้าสู่ระบบ**
   - กลับไปที่แอปพลิเคชัน (http://localhost:5173)
   - คลิก "Login with Discord"
   - ควรทำงานได้ปกติ

### การใช้งานใน Production

สำหรับการใช้งานจริง ให้:
1. เปลี่ยน redirect URI เป็น domain จริง
2. ตั้งค่า environment variables ใน hosting platform
3. ใช้ HTTPS เท่านั้น