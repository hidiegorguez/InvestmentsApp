export function logIn (userId: string) {
  return fetch(`http://127.0.0.1:8000/user/assets?user_id=${encodeURIComponent(userId)}`);
}   