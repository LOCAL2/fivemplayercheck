# Discord OAuth Troubleshooting Guide

## ปัญหาที่พบบ่อยและวิธีแก้ไข

### 1. "Invalid code" Error

**สาเหตุ:** OAuth authorization code หมดอายุ (มีอายุประมาณ 10 นาที)

**วิธีแก้ไข:**
1. คลิกปุ่ม "Clear & Retry" ในแบนเนอร์สีแดง
2. หรือรีเฟรชหน้าเว็บ
3. คลิก "Login with Discord" ใหม่

### 2. React Strict Mode ทำให้ OAuth ทำงานซ้ำ

**สาเหตุ:** ใน development mode, React จะรัน useEffect 2 ครั้งเพื่อตรวจสอบ side effects

**วิธีแก้ไข:** 
- แอปพลิเคชันได้ป้องกันปัญหานี้แล้วด้วย `isProcessingOAuth` state
- หากยังมีปัญหา ให้คลิก "Clear & Retry"

### 3. โปรไฟล์รูปไม่แสดง

**สาเหตุ:** Discord API อาจส่งข้อมูล avatar เป็น null หรือ URL ไม่ถูกต้อง

**วิธีแก้ไข:**
- แอปจะใช้รูป default avatar หากไม่มีรูปโปรไฟล์
- ตรวจสอบว่าบัญชี Discord มีรูปโปรไฟล์หรือไม่

### 4. "ERR_CONNECTION_REFUSED"

**สาเหตุ:** เซิร์ฟเวอร์พัฒนาไม่ทำงาน

**วิธีแก้ไข:**
1. เปิด terminal ใหม่
2. รัน `npm run dev`
3. รอจนเซิร์ฟเวอร์เริ่มทำงานที่ http://localhost:5173
4. ลองเข้าสู่ระบบใหม่

### 5. Redirect URI Mismatch

**สาเหตุ:** Discord Application ตั้งค่า redirect URI ไม่ตรงกับที่แอปใช้

**วิธีแก้ไข:**
1. ไปที่ https://discord.com/developers/applications
2. เลือก Application ของคุณ
3. ไปที่แท็บ "OAuth2"
4. ตรวจสอบว่ามี redirect URI ทั้งสองนี้:
   - `http://localhost:5173`
   - `http://localhost:3000`
5. Save Changes

### 6. CORS Error

**สาเหตุ:** Browser บล็อก request ไปยัง Discord API

**วิธีแก้ไข:**
- ปัญหานี้ไม่ควรเกิดขึ้นเพราะ Discord API รองรับ CORS
- หากเกิดขึ้น ให้ลองใช้ browser อื่น
- ตรวจสอบว่าไม่มี browser extension ที่บล็อก request

## ขั้นตอนการแก้ไขปัญหาทั่วไป

1. **ตรวจสอบเซิร์ฟเวอร์**
   ```bash
   npm run dev
   ```

2. **ตรวจสอบ Console**
   - เปิด Developer Tools (F12)
   - ดู Console tab สำหรับ error messages

3. **ล้าง Browser Cache**
   - กด Ctrl+Shift+R (Windows) หรือ Cmd+Shift+R (Mac)

4. **ตรวจสอบ Environment Variables**
   - ตรวจสอบไฟล์ `.env.local`
   - ตรวจสอบว่า `VITE_DISCORD_CLIENT_ID` และ `VITE_DISCORD_CLIENT_SECRET` ถูกต้อง

5. **รีสตาร์ทเซิร์ฟเวอร์**
   - หยุดเซิร์ฟเวอร์ (Ctrl+C)
   - รันใหม่ `npm run dev`

## การตรวจสอบการตั้งค่า

### ตรวจสอบ Discord Application Settings

1. **General Information**
   - Application ID ตรงกับ `VITE_DISCORD_CLIENT_ID`

2. **OAuth2**
   - Client Secret ตรงกับ `VITE_DISCORD_CLIENT_SECRET`
   - Redirects มี `http://localhost:5173`

3. **Bot** (ถ้าใช้)
   - Token ตรงกับ `VITE_DISCORD_BOT_TOKEN`

### ตรวจสอบ Environment Variables

```bash
# ใน terminal
echo $VITE_DISCORD_CLIENT_ID
echo $VITE_DISCORD_CLIENT_SECRET
```

หรือดูใน browser console:
```javascript
console.log(import.meta.env.VITE_DISCORD_CLIENT_ID);
```

## ติดต่อขอความช่วยเหลือ

หากยังแก้ไขปัญหาไม่ได้:

1. เก็บ screenshot ของ error message
2. เก็บ console logs
3. ระบุขั้นตอนที่ทำก่อนเกิดปัญหา
4. ระบุ browser และ OS ที่ใช้