const toLowerString = (v) => (v == null ? '' : String(v).trim().toLowerCase());

const isTrueLike = (v) => {
  const s = toLowerString(v);
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on' || s === 'active';
};

const isFalseLike = (v) => {
  const s = toLowerString(v);
  return s === 'false' || s === '0' || s === 'no' || s === 'n' || s === 'off' || s === 'inactive';
};

const passwordsDifferByAtLeast4Chars = (oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) return true;
  const old = oldPassword.toLowerCase();
  const newPwd = newPassword.toLowerCase();
  if (old === newPwd) return false;
  
  const matrix = [];
  for (let i = 0; i <= newPwd.length; i++) matrix[i] = [i];
  for (let j = 0; j <= old.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= newPwd.length; i++) {
    for (let j = 1; j <= old.length; j++) {
      if (newPwd.charAt(i - 1) === old.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[newPwd.length][old.length] >= 4;
};

module.exports = {
  isTrueLike,
  isFalseLike,
  passwordsDifferByAtLeast4Chars
};
