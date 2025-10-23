const axios = require('axios');

async function testAttendance() {
  try {
    const response = await axios.post('http://localhost:3000/api/attendance', {
      employeeId: 1,
      date: '2025-10-21',
      checkInTime: '09:00',
      checkOutTime: '17:00',
      hoursWorked: 8,
      status: 'present',
      timeType: 'working'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAttendance();