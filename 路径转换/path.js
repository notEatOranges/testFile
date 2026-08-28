document.addEventListener('DOMContentLoaded', () => {
    const originalPathInput = document.getElementById('originalPath');
    const convertBtn = document.getElementById('convertBtn');
    const resultElement = document.getElementById('result');

    function convertPath() {
        const originalPath = originalPathInput.value;
        
        // 1. 去掉 'packages\'
        let convertedPath = originalPath.replace(/^packages\\/, '');
        
        // 2. 将 '\' 替换为 '/'
        convertedPath = convertedPath.replace(/\\/g, '/');
        
        // 3. 去掉结尾的 '.vue'
        convertedPath = convertedPath.replace(/\.vue$/, '');
        
        resultElement.textContent = convertedPath;
    }

    convertBtn.addEventListener('click', convertPath);

    // 页面加载时自动转换一次
    convertPath();
});