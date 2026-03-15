const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo root
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// 1. Watch the mobile app directory AND the monorepo root (for shared packages)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve node_modules from
//    (hoisted to workspace root in npm workspaces)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Prevent duplicate React Native modules by blocking the root-level ones
//    when they also exist in the mobile app's node_modules
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
