# Discord Webhook Integration Feature

## 📋 Overview
เพิ่มฟีเจอร์ Discord Webhook เพื่อส่งการแจ้งเตือนเมื่อมีการค้นหาผู้เล่นในเซิร์ฟเวอร์ FiveM

## ✨ Features

### 🔗 Discord Webhook Settings
- **เปิด/ปิดการใช้งาน**: สามารถเปิดหรือปิดการส่ง webhook ได้
- **Webhook URL**: ใส่ URL ของ Discord Webhook
- **Custom Username**: กำหนดชื่อผู้ส่งข้อความ (ค่าเริ่มต้น: "FiveM Monitor")
- **บันทึกการตั้งค่า**: เก็บการตั้งค่าใน localStorage

### 📨 Automatic Notifications
- **เมื่อเชื่อมต่อเซิร์ฟเวอร์**: ส่งข้อมูลผู้เล่นทั้งหมดที่พบ
- **เมื่อค้นหาผู้เล่น**: ส่งผลการค้นหาตามชื่อหรือ ID
- **Rich Embed**: ข้อมูลแสดงในรูปแบบ Discord Embed ที่สวยงาม

### 🎨 Professional Design
- **Material-UI Dialog**: ใช้ Material-UI สำหรับ UI ที่สวยงาม
- **Dark/Light Theme Support**: รองรับทั้งธีมมืดและสว่าง
- **Animated Indicator**: จุดสีเขียวแสดงสถานะ webhook ที่เปิดใช้งาน
- **Responsive Design**: ใช้งานได้ดีในทุกขนาดหน้าจอ

## 🚀 How to Use

### 1. เปิดการตั้งค่า
1. คลิกไอคอน Settings (⚙️) ที่มุมขวาบน
2. เลือก "Discord Webhook"

### 2. ตั้งค่า Webhook
1. **เปิดใช้งาน**: คลิกปุ่ม "เปิด"
2. **ใส่ Webhook URL**: 
   - ไปที่ Discord Server → Server Settings → Integrations → Webhooks
   - สร้าง New Webhook และคัดลอก URL
   - วาง URL ในช่อง "Discord Webhook URL"
3. **กำหนดชื่อผู้ส่ง**: ใส่ชื่อที่ต้องการ (เช่น "FiveM Monitor")
4. **บันทึก**: คลิกปุ่ม "บันทึก"

### 3. การทำงาน
- เมื่อค้นหาเซิร์ฟเวอร์ → ส่งข้อมูลผู้เล่นทั้งหมด
- เมื่อค้นหาผู้เล่นเฉพาะ → ส่งผลการค้นหา
- ข้อมูลจะแสดงใน Discord channel ที่กำหนด

## 📊 Webhook Data Format

### Embed Fields
- **🌐 Server**: IP:Port ของเซิร์ฟเวอร์
- **🔎 Search Type**: ประเภทการค้นหา (ชื่อผู้เล่น/Player ID/ทั้งหมด)
- **📝 Search Value**: ค่าที่ค้นหา
- **👥 Results Found**: จำนวนผู้เล่นที่พบ
- **🎮 Top Players**: รายชื่อผู้เล่น 5 คนแรก (ถ้ามี)

### Example Webhook Message
```json
{
  "username": "FiveM Monitor",
  "embeds": [{
    "title": "🔍 FiveM Player Search",
    "color": 3901686,
    "fields": [
      {
        "name": "🌐 Server",
        "value": "192.168.1.100:30120",
        "inline": true
      },
      {
        "name": "🔎 Search Type", 
        "value": "ชื่อผู้เล่น",
        "inline": true
      },
      {
        "name": "📝 Search Value",
        "value": "John",
        "inline": true
      },
      {
        "name": "👥 Results Found",
        "value": "3 ผู้เล่น",
        "inline": true
      },
      {
        "name": "🎮 Top Players",
        "value": "**John Doe** (ID: 1, Ping: 45ms)\n**Johnny** (ID: 15, Ping: 67ms)",
        "inline": false
      }
    ],
    "timestamp": "2025-10-26T10:30:00.000Z",
    "footer": {
      "text": "FiveM Player Monitor by บาร็อง อิสหาด"
    }
  }]
}
```

## 🔧 Technical Implementation

### State Management
```typescript
const [showWebhookDialog, setShowWebhookDialog] = useState(false);
const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
const [webhookUsername, setWebhookUsername] = useState('FiveM Monitor');
const [isWebhookEnabled, setIsWebhookEnabled] = useState(false);
```

### Local Storage Keys
- `discordWebhookUrl`: เก็บ URL ของ webhook
- `webhookUsername`: เก็บชื่อผู้ส่ง
- `isWebhookEnabled`: เก็บสถานะการเปิด/ปิด

### Webhook Function
```typescript
const sendDiscordWebhook = async (searchData) => {
  // ส่งข้อมูลไปยัง Discord Webhook
  // รองรับ Rich Embed format
  // จัดการ error อย่างเหมาะสม
}
```

## 🎯 Benefits

### For Users
- **Real-time Notifications**: รับการแจ้งเตือนทันทีเมื่อมีการค้นหา
- **Team Collaboration**: แชร์ข้อมูลกับทีมผ่าน Discord
- **Activity Monitoring**: ติดตามการใช้งานเครื่องมือ
- **Professional Logging**: บันทึกการค้นหาอย่างเป็นระบบ

### For Administrators
- **Server Monitoring**: ติดตามการเข้าถึงเซิร์ฟเวอร์
- **Usage Analytics**: วิเคราะห์การใช้งานเครื่องมือ
- **Security Tracking**: ตรวจสอบการค้นหาที่ผิดปกติ
- **Audit Trail**: มีร่องรอยการใช้งานที่ชัดเจน

## 🔒 Privacy & Security

### Data Handling
- **No Personal Data Storage**: ไม่เก็บข้อมูลส่วนตัวในระบบ
- **Local Storage Only**: การตั้งค่าเก็บในเครื่องผู้ใช้เท่านั้น
- **Optional Feature**: ผู้ใช้สามารถเลือกใช้หรือไม่ใช้ได้
- **Secure Transmission**: ใช้ HTTPS สำหรับการส่งข้อมูล

### Best Practices
- ใช้ Webhook URL ที่ปลอดภัย
- ไม่แชร์ Webhook URL กับบุคคลที่ไม่เกี่ยวข้อง
- ตรวจสอบสิทธิ์การเข้าถึง Discord channel
- ปิดการใช้งานเมื่อไม่จำเป็น

## 🎨 UI/UX Design

### Material-UI Components
- **Dialog**: หน้าต่างการตั้งค่าที่สวยงาม
- **TextField**: ช่องกรอกข้อมูลที่ responsive
- **Button**: ปุ่มที่มี hover effects
- **Typography**: ข้อความที่อ่านง่าย

### Theme Integration
- **Dark Mode**: รองรับธีมมืดอย่างสมบูรณ์
- **Light Mode**: รองรับธีมสว่างอย่างสมบูรณ์
- **Consistent Colors**: ใช้สีที่สอดคล้องกับธีมหลัก
- **Smooth Animations**: การเคลื่อนไหวที่นุ่มนวล

### Responsive Design
- **Mobile Friendly**: ใช้งานได้ดีบนมือถือ
- **Tablet Optimized**: เหมาะสำหรับแท็บเล็ต
- **Desktop Enhanced**: ประสบการณ์ที่ดีบนเดสก์ท็อป

## 🚀 Future Enhancements

### Planned Features
- **Multiple Webhooks**: รองรับหลาย webhook URLs
- **Custom Embed Colors**: กำหนดสีของ embed ได้
- **Webhook Templates**: เทมเพลตข้อความที่หลากหลาย
- **Filtering Options**: กรองข้อมูลที่ส่งได้
- **Rate Limiting**: จำกัดการส่งข้อความ
- **Webhook Testing**: ทดสอบ webhook ก่อนบันทึก

### Integration Ideas
- **Slack Integration**: รองรับ Slack webhooks
- **Teams Integration**: รองรับ Microsoft Teams
- **Email Notifications**: ส่งอีเมลแจ้งเตือน
- **SMS Alerts**: ส่ง SMS แจ้งเตือน

## 📝 Changelog

### Version 1.0.0 (2025-10-26)
- ✅ เพิ่มฟีเจอร์ Discord Webhook
- ✅ UI/UX ที่สวยงามด้วย Material-UI
- ✅ รองรับ Dark/Light theme
- ✅ บันทึกการตั้งค่าใน localStorage
- ✅ ส่งการแจ้งเตือนอัตโนมัติ
- ✅ Rich Embed format
- ✅ Responsive design
- ✅ Animation effects

---

**Created by**: บาร็อง อิสหาด  
**Date**: October 26, 2025  
**Version**: 1.0.0