const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const packagerModule = require('@electron/packager');
const packager = packagerModule.packager || packagerModule;

const rootDir = path.resolve(__dirname, '..');
const stageDir = path.join(rootDir, 'app_stage');
const distDir = path.join(rootDir, 'dist');
const desktopDir = path.join(rootDir, 'desktop');
const outDir = path.join(rootDir, 'dist_desktop');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function removeDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function build() {
  console.log('\n================================================================');
  console.log('  🚀 بدء حزم تطبيق سطح المكتب لنظام Windows | الفارس الذهبي  ');
  console.log('================================================================\n');

  // Step 0: Ensure icons exist
  const iconIco = path.join(desktopDir, 'icon.ico');
  const iconPng = path.join(desktopDir, 'icon.png');
  if (!fs.existsSync(iconIco) || !fs.existsSync(iconPng)) {
    console.log('📌 [0/4] توليد أيقونات سطح المكتب عالية الدقة...');
    require('./generateIcons.cjs');
  }

  // Step 1: Build React/Vite Frontend
  console.log('📦 [1/4] بناء واجهة الويب وترجمة الأصول (Vite Build)...');
  execSync('npm run build', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (!fs.existsSync(distDir)) {
    throw new Error('فشل مجلد dist في التوليد!');
  }

  // Step 2: Prepare Isolated Stage Directory (to avoid bundling bulky root node_modules)
  console.log('\n📂 [2/4] تجهيز المجلد المرحلي المعزول (app_stage) لضغط الحجم وحماية الكود...');
  removeDirSync(stageDir);
  fs.mkdirSync(stageDir, { recursive: true });

  // Copy dist folder to stage
  copyRecursiveSync(distDir, path.join(stageDir, 'dist'));

  // Copy desktop files to stage
  const stageDesktop = path.join(stageDir, 'desktop');
  fs.mkdirSync(stageDesktop, { recursive: true });
  fs.copyFileSync(path.join(desktopDir, 'main.cjs'), path.join(stageDesktop, 'main.cjs'));
  fs.copyFileSync(path.join(desktopDir, 'preload.cjs'), path.join(stageDesktop, 'preload.cjs'));
  if (fs.existsSync(iconIco)) {
    fs.copyFileSync(iconIco, path.join(stageDesktop, 'icon.ico'));
  }
  if (fs.existsSync(iconPng)) {
    fs.copyFileSync(iconPng, path.join(stageDesktop, 'icon.png'));
  }

  // Create clean, minimal package.json for stage
  const stagePackageJson = {
    name: 'al-fares-billboards',
    productName: 'الفارس الذهبي',
    version: '1.0.0',
    main: 'desktop/main.cjs',
    author: 'الفارس الذهبي للدعاية والإعلان',
    description: 'نظام الفارس الذهبي للوحات الإعلانية',
    private: true,
  };
  fs.writeFileSync(
    path.join(stageDir, 'package.json'),
    JSON.stringify(stagePackageJson, null, 2),
    'utf8'
  );

  // Step 3: Run @electron/packager
  console.log('\n⚡ [3/4] إنشاء الحزمة التنفيذية بواسطة @electron/packager...');
  
  const options = {
    dir: stageDir,
    out: outDir,
    name: 'Al-Fares-Billboards',
    executableName: 'Al-Fares-Billboards',
    platform: 'win32',
    arch: 'x64',
    asar: true,
    overwrite: true,
    prune: true,
    icon: fs.existsSync(iconIco) ? iconIco : undefined,
    appCopyright: 'جميع الحقوق محفوظة © الفارس الذهبي للدعاية والإعلان',
    appVersion: '1.0.0',
    buildVersion: '1.0.0',
    win32metadata: {
      CompanyName: 'Al-Fares Al-Dahabi',
      FileDescription: 'الفارس الذهبي للدعاية والإعلان - تطبيق سطح المكتب',
      OriginalFilename: 'Al-Fares-Billboards.exe',
      ProductName: 'الفارس الذهبي للدعاية والإعلان',
      InternalName: 'Al-Fares-Billboards',
    },
  };

  const appPaths = await packager(options);

  // Step 4: Clean up staging folder
  console.log('\n🧹 [4/4] تنظيف الملفات المؤقتة...');
  removeDirSync(stageDir);

  console.log('\n================================================================');
  console.log('  🎉 تم إنشاء تطبيق سطح المكتب بنجاح تام!');
  console.log('================================================================');
  
  if (appPaths && appPaths.length > 0) {
    const outputApp = appPaths[0];
    const exePath = path.join(outputApp, 'Al-Fares-Billboards.exe');
    const asarPath = path.join(outputApp, 'resources', 'app.asar');

    console.log(`📁 مسار المجلد التنفيذي: ${outputApp}`);
    if (fs.existsSync(exePath)) {
      console.log(`✨ الملف التنفيذي: ${exePath}`);
    }
    if (fs.existsSync(asarPath)) {
      const asarSizeMb = (fs.statSync(asarPath).size / (1024 * 1024)).toFixed(2);
      console.log(`🔒 حجم أرشيف التطبيق المحمي (app.asar): ${asarSizeMb} MB (حجم مثالي وخفيف)`);
    }
  }
}

build().catch((err) => {
  console.error('\n❌ حدث خطأ أثناء البناء:', err);
  // Ensure stageDir is cleaned up even on failure
  removeDirSync(stageDir);
  process.exit(1);
});
