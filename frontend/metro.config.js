const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the shared folder to the watch folders
config.watchFolders = [
  path.resolve(__dirname, '../shared'),
];

// Add the shared folder to the resolver
config.resolver.extraNodeModules = {
  '@shared': path.resolve(__dirname, '../shared'),
};

module.exports = config;