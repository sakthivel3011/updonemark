export async function getDeviceId() {
  let deviceId = localStorage.getItem('updone_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('updone_device_id', deviceId);
  }
  return deviceId;
}
