# Fix for 403 Forbidden Error

## 🔍 **Problem Analysis**

The error "Access denied: Insufficient permissions" occurs when trying to create departments/positions even after login as admin.

## 🎯 **Root Causes**

1. **JWT Token might not be sent correctly**
2. **User role might not be in the JWT payload correctly**
3. **Routes requiring authentication might be failing**

## ✅ **Solutions Implemented**

### **1. Added Login Route to app.js**
- Login route now in the correct place (before auth middleware)
- Properly generates JWT token with user role

### **2. Enhanced Auth Middleware**
- Added better logging to see what's happening
- Better error messages
- Debug logs for token verification

### **3. Added Debug Logging**
- Logs in department routes to see user info
- Logs in auth middleware to see token verification

### **4. Added /api/users/me endpoint**
- Test authentication is working
- Get current user info

## 🧪 **How to Test**

### **1. Start Backend**
```bash
cd backend
npm run dev
```

### **2. Check Login**
- Open browser console
- Try to login
- Check the logs to see if token is generated

### **3. Check Token**
- After login, check localStorage for 'token'
- Verify the token exists

### **4. Test Department Creation**
- Try to create a department
- Check backend console logs
- Look for the user role in logs

## 🔧 **If Still Getting 403**

### **Option 1: Check User Role in Database**
```sql
SELECT "Id", "UserName", "Role" FROM "User";
```

Make sure your admin user has role = 'admin' or 'Admin'

### **Option 2: Clear and Re-login**
1. Clear localStorage: `localStorage.clear()`
2. Log out and log back in
3. Check new token is generated

### **Option 3: Check Backend Console**
Look for these logs:
```
Auth header received: Bearer ...
Token verified successfully. User: { id: ..., role: ... }
POST /api/departments - Request received
User role: ...
```

### **Option 4: Test with curl**
```bash
# Get token first (replace username/password)
curl -X POST http://10.1.15.33:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Use the token
curl -X POST http://10.1.15.33:3000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"IT Department"}'
```

## 📊 **Expected Behavior**

### **Successful Request:**
- No 403 error
- Department created successfully
- Returns 201 status with department data

### **Failed Request:**
- 403 error with detailed message
- Backend logs show user info
- Can identify if token or role issue

## 🚀 **Next Steps**

After fixing the 403 error:
1. ✅ Test Department Management
2. ✅ Test Position Management
3. ✅ Continue with Notification System
4. ✅ Connect Attendance to Payroll

---

**Status:** Debug logging added. Waiting for test results to identify exact issue.

