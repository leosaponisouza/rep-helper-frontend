// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Encontra o projeto raiz do workspace
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Adicionar suporte para extensões específicas
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  'mjs',
];

// Otimizações para Windows
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true; // Melhora performance no Windows

// Ajustes adicionais para resolver problemas de caminhos no Windows
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Ajuste para arquivos de assets longos
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

// Aumentar limites de cache
config.maxWorkers = 2;

module.exports = config; 