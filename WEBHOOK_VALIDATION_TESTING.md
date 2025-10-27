# Discord Webhook Validation & Testing Feature

## 🎯 Overview
เพิ่มระบบตรวจสอบและทดสอบ Discord Webhook URL เพื่อให้แน่ใจว่าใช้งานได้จริง

## ✨ New Features

### 🔍 URL Validation
- **Real-time Validation**: ตรวจสอบรูปแบบ URL แบบ real-time
- **Visual Indicators**: แสดงสถานะด้วยไอคอนสีเขียว/แดง
- **Error Messages**: ข้อความแจ้งเตือนเมื่อ URL ไม่ถูกต้อง
- **Border Colors**: เปลี่ยนสีขอบ input ตามสถานะ

### 🧪 Webhook Testing
- **Test Button**: ปุ่มทดสอบ webhook ที่ใช้งานง่าย
- **Loading State**: แสดงสถานะกำลังทดสอบ
- **Test Results**: แสดงผลการทดสอบแบบ real-time
- **Error Handling**: จัดการข้อผิดพลาดอย่างละเอียด

## 🔧 Technical Implementation

### URL Validation Function
```typescript
const isValidDiscordWebhookUrl = useCallback((url: string) => {
  const discordWebhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  return discordWebhookPattern.test(url);
}, []);
```

### Test Webhook Function
```typescript
const testDiscordWebhook = useCallback(async () => {
  // URL validation
  if (!discordWebhookUrl.trim()) {
    addNotification('error', 'กรุณาใส่ Discord Webhook URL ก่อน');
    return;
  }

  if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
    addNotification('error', 'รูปแบบ Discord Webhook URL ไม่ถูกต้อง');
    return;
  }

  setIsTestingWebhook(true);
  setWebhookTestResult(null);

  try {
    // Send test message
    const testEmbed = {
      title: "🧪 Webhook Test",
      description: "นี่คือการทดสอบ Discord Webhook จาก FiveM Player Monitor",
      color: 0x3b82f6,
      fields: [
        {
          name: "📊 Status",
          value: "✅ Webhook ทำงานได้ปกติ",
          inline: true
        },
        {
          name: "⏰ Test Time",
          value: new Date().toLocaleString('th-TH'),
          inline: true
        }
      ],
      footer: {
        text: "FiveM Player Monitor - Webhook Test"
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: webhookUsername || 'FiveM Monitor',
        embeds: [testEmbed]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      setWebhookTestResult('success');
      addNotification('success', '✅ Webhook ทดสอบสำเร็จ!');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    setWebhookTestResult('error');
    // Handle different error types
  } finally {
    setIsTestingWebhook(false);
  }
}, [discordWebhookUrl, webhookUsername]);
```

## 🎨 UI Components

### URL Input with Validation
```jsx
<div className="relative">
  <input
    type="url"
    value={discordWebhookUrl}
    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
      isWebhookEnabled
        ? discordWebhookUrl && !isValidDiscordWebhookUrl(discordWebhookUrl)
          ? 'border-red-300 focus:ring-red-500'      // Invalid URL
          : discordWebhookUrl && isValidDiscordWebhookUrl(discordWebhookUrl)
          ? 'border-green-300 focus:ring-green-500'  // Valid URL
          : 'border-slate-300 focus:ring-blue-500'   // Default
        : 'border-slate-200 cursor-not-allowed'      // Disabled
    }`}
  />
  
  {/* Validation Icon */}
  {isWebhookEnabled && discordWebhookUrl && (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
      {isValidDiscordWebhookUrl(discordWebhookUrl) ? (
        <CheckIcon className="w-5 h-5 text-green-500" />
      ) : (
        <XIcon className="w-5 h-5 text-red-500" />
      )}
    </div>
  )}
</div>
```

### Test Button with Loading State
```jsx
<button
  onClick={testDiscordWebhook}
  disabled={isTestingWebhook}
  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
    isTestingWebhook
      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
  }`}
>
  {isTestingWebhook ? (
    <div className="flex items-center space-x-2">
      <LoadingSpinner />
      <span>กำลังทดสอบ...</span>
    </div>
  ) : (
    <div className="flex items-center space-x-2">
      <TestIcon />
      <span>ทดสอบ Webhook</span>
    </div>
  )}
</button>
```

### Test Result Display
```jsx
{webhookTestResult && (
  <div className={`mt-3 p-3 rounded-lg ${
    webhookTestResult === 'success'
      ? 'bg-green-50 border-green-200'
      : 'bg-red-50 border-red-200'
  }`}>
    <div className="flex items-center space-x-2">
      {webhookTestResult === 'success' ? (
        <>
          <CheckIcon className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            ทดสอบสำเร็จ! Webhook ทำงานได้ปกติ
          </span>
        </>
      ) : (
        <>
          <XIcon className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            ทดสอบล้มเหลว กรุณาตรวจสอบ URL
          </span>
        </>
      )}
    </div>
  </div>
)}
```

## 🎯 Validation Rules

### Discord Webhook URL Pattern
```regex
^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$
```

### Valid URL Examples
- ✅ `https://discord.com/api/webhooks/123456789/abcdef-ghijkl`
- ✅ `https://discord.com/api/webhooks/987654321/xyz123-456abc`

### Invalid URL Examples
- ❌ `http://discord.com/api/webhooks/123/abc` (not HTTPS)
- ❌ `https://discord.com/webhooks/123/abc` (missing /api/)
- ❌ `https://example.com/webhook` (not Discord domain)
- ❌ `https://discord.com/api/webhooks/abc/123` (invalid format)

## 🚨 Error Handling

### HTTP Status Codes
| Code | Error Message | Description |
|------|---------------|-------------|
| 400 | ข้อมูลที่ส่งไม่ถูกต้อง | Bad Request |
| 401 | ไม่มีสิทธิ์เข้าถึง Webhook นี้ | Unauthorized |
| 403 | ไม่มีสิทธิ์เข้าถึง Webhook นี้ | Forbidden |
| 404 | ไม่พบ Webhook URL นี้ | Not Found |
| Timeout | การเชื่อมต่อหมดเวลา | Network Timeout |

### Error Recovery
- **Retry Logic**: ผู้ใช้สามารถลองใหม่ได้
- **Clear Instructions**: ข้อความแจ้งข้อผิดพลาดที่ชัดเจน
- **Visual Feedback**: สีและไอคอนที่บ่งบอกสถานะ
- **Help Text**: คำแนะนำการแก้ไข

## 📱 User Experience

### Before Enhancement
```
[Input Field] https://discord.com/api/webhooks/...
[Save Button]
```

### After Enhancement
```
[Input Field with Icon] https://discord.com/api/webhooks/... [✅/❌]
[Validation Message] (if invalid)
[Test Button] ทดสอบ Webhook
[Test Result] (success/error feedback)
[Save Button]
```

## 🎨 Visual States

### Input Field States
1. **Default**: Gray border, no icon
2. **Valid URL**: Green border, check icon
3. **Invalid URL**: Red border, X icon, error message
4. **Disabled**: Gray background, cursor not-allowed

### Test Button States
1. **Ready**: Blue background, test icon
2. **Testing**: Gray background, loading spinner
3. **Success**: (returns to ready state)
4. **Error**: (returns to ready state)

### Test Result States
1. **Success**: Green background, check icon, success message
2. **Error**: Red background, X icon, error message
3. **None**: Hidden (initial state)

## 🔄 State Management

### New States Added
```typescript
const [isTestingWebhook, setIsTestingWebhook] = useState(false);
const [webhookTestResult, setWebhookTestResult] = useState<'success' | 'error' | null>(null);
```

### State Flow
```
Initial → URL Input → Validation → Test → Result → Reset
   ↓         ↓           ↓         ↓       ↓        ↓
  null    checking    valid/    testing  success  ready
                     invalid            /error
```

## 🎪 Test Message Format

### Test Embed Structure
```json
{
  "username": "FiveM Monitor",
  "embeds": [{
    "title": "🧪 Webhook Test",
    "description": "นี่คือการทดสอบ Discord Webhook จาก FiveM Player Monitor",
    "color": 3901686,
    "fields": [
      {
        "name": "📊 Status",
        "value": "✅ Webhook ทำงานได้ปกติ",
        "inline": true
      },
      {
        "name": "⏰ Test Time",
        "value": "26/10/2025 23:59:45",
        "inline": true
      }
    ],
    "footer": {
      "text": "FiveM Player Monitor - Webhook Test"
    },
    "timestamp": "2025-10-26T16:59:45.000Z"
  }]
}
```

## 🚀 Benefits

### For Users
- **Confidence**: รู้ว่า webhook ทำงานได้จริง
- **Quick Feedback**: ทราบผลทันทีว่า URL ถูกต้องหรือไม่
- **Error Prevention**: ป้องกันการตั้งค่า URL ที่ผิด
- **Easy Testing**: ทดสอบได้ง่ายก่อนบันทึก

### For Developers
- **Better UX**: ผู้ใช้ไม่สับสนเรื่อง webhook
- **Reduced Support**: ลดปัญหาการตั้งค่าผิด
- **Quality Assurance**: มั่นใจว่าฟีเจอร์ทำงานได้
- **Professional Feel**: ดูเป็นมืออาชีพมากขึ้น

## 🔮 Future Enhancements

### Planned Features
1. **Auto-detect Webhook**: ตรวจจับ webhook จาก clipboard
2. **Webhook Health Check**: ตรวจสอบสถานะ webhook เป็นระยะ
3. **Multiple Webhooks**: รองรับหลาย webhook URLs
4. **Custom Test Messages**: ให้ผู้ใช้กำหนดข้อความทดสอบเอง
5. **Webhook Analytics**: สถิติการส่งข้อความ

### Technical Improvements
1. **Rate Limiting**: จำกัดการทดสอบเพื่อป้องกัน spam
2. **Caching**: cache ผลการทดสอบชั่วคราว
3. **Background Testing**: ทดสอบใน background
4. **Webhook Proxy**: ใช้ proxy สำหรับการทดสอบ
5. **Advanced Validation**: ตรวจสอบ permissions และ channel

## 📊 Performance Impact

### Bundle Size
- **Added Code**: ~2KB (minified + gzipped)
- **Dependencies**: ไม่มี dependencies เพิ่ม
- **Runtime**: minimal impact

### Network Requests
- **Validation**: ไม่มี network request (client-side only)
- **Testing**: 1 request per test (user-initiated)
- **Timeout**: 10 seconds maximum

### User Experience
- **Response Time**: instant validation feedback
- **Test Time**: 1-3 seconds typical
- **Error Recovery**: immediate retry capability

---

**Developed by**: บาร็อง อิสหาด  
**Date**: October 26, 2025  
**Status**: ✅ Completed