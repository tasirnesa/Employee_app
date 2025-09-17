const bcrypt = require('bcrypt');
async function hashPassword() {
  const password = 'test';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
}
hashPassword();
const bcrypt = require('bcrypt');
async function hashPassword() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
}
hashPassword();