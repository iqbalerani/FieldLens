const { getDefaultConfig } = require("expo/metro-config");

// Expo SDK 54 already handles npm workspaces in Metro. Keeping custom
// watchFolders overrides here breaks Expo's multipart bundle responses.
module.exports = getDefaultConfig(__dirname);
