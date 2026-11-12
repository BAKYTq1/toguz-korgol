// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
// The web app's source: game rules, AI, translations and the online protocol are shared from there.
const sharedRoot = path.resolve(projectRoot, '../src');
const webFirebase = path.join(sharedRoot, 'lib', 'firebase.ts');
const mobileFirebase = path.join(projectRoot, 'src', 'lib', 'firebase.ts');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedRoot];

const isPackageImport = name => !name.startsWith('.') && !path.isAbsolute(name);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Packages imported by shared files come from this app's node_modules (one React, the
  // React Native build of Firebase), never from the web app's node_modules one level up.
  const fromShared = context.originModulePath.startsWith(sharedRoot + path.sep);
  const resolveContext = fromShared && isPackageImport(moduleName)
    ? { ...context, originModulePath: path.join(projectRoot, 'package.json') }
    : context;
  const result = context.resolveRequest(resolveContext, moduleName, platform);

  // Shared code loads Firebase through ../lib/firebase; on mobile that is the React Native setup.
  if (result.type === 'sourceFile' && path.resolve(result.filePath) === webFirebase) {
    return { type: 'sourceFile', filePath: mobileFirebase };
  }
  return result;
};

module.exports = config;
