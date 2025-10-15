const bcrypt = require('bcrypt');

async function testPassword() {
  const storedHash = '$2b$10$JoFi4Vsy9MhLz8WSRVOvveBywTKItkMmJDKkoEdrZwsOYvXe82U66';
  const password = 'test';
  const isMatch = await bcrypt.compare(password, storedHash);
  console.log('Password match:', isMatch);
}

testPassword();