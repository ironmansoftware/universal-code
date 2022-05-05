const os = require('os');
const path = require('path');

export function tmpdir() {
    if (os.platform() === 'win32') {
        return path.join(os.userInfo().homedir, "AppData", "Local", "Temp");
    } else {
        return os.tmpdir();
    }
}