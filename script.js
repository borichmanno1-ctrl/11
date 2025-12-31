// 页面元素
const startPage = document.getElementById('startPage');
const treePage = document.getElementById('treePage');
const albumPage = document.getElementById('albumPage');
const fireworksPage = document.getElementById('fireworksPage');
const heartBtn = document.getElementById('heartBtn');
const treeContainer = document.getElementById('treeContainer');
const slideshowContainer = document.getElementById('slideshowContainer');
const bgMusic = document.getElementById('bgMusic');
const musicControl = document.getElementById('musicControl');
const blessingText = document.getElementById('blessingText');
const fireworksCanvas = document.getElementById('fireworksCanvas');
const loading = document.getElementById('loading');

// 配置
const CONFIG = {
    photoCount: 14, // 照片数量（根据您有14张图）
    photoPrefix: 'photo', // 照片路径前缀
    photoExtension: '.jpg', // 照片扩展名
    albumDuration: 30, // 相册播放总时长（秒）
    slideDuration: 2, // 每张照片显示时间（秒）
    fireworkDuration: 20, // 烟花持续时间（秒）
    showBlessingTime: 20 // 显示祝福文字的时间（秒）
};

// 状态变量
let photoSlides = [];
let currentSlide = 0;
let slideshowInterval = null;
let fireworkInterval = null;
let isMusicPlaying = false;
let isFireworksActive = false;
let isBlessingShown = false;
let blessingShownTime = 0;

// 烟花相关
let ctx;
let particles = [];
let fireworks = [];
let animationId = null;

// 页面初始化
async function init() {
    console.log('初始化页面...');
    
    // 设置画布
    setupCanvas();
    
    // 预加载照片
    await preloadPhotos();
    
    // 设置事件监听
    setupEventListeners();
    
    console.log('初始化完成');
}

// 设置画布
function setupCanvas() {
    ctx = fireworksCanvas.getContext('2d');
    resizeCanvas();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);
}

// 调整画布大小
function resizeCanvas() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
}

// 预加载照片
async function preloadPhotos() {
    console.log('开始预加载照片...');
    loading.classList.add('active');
    
    const promises = [];
    
    // 创建照片加载Promise数组
    for (let i = 1; i <= CONFIG.photoCount; i++) {
        const photoPath = `${CONFIG.photoPrefix}${i}${CONFIG.photoExtension}`;
        const promise = loadImage(photoPath, i);
        promises.push(promise);
    }
    
    // 等待所有照片加载完成
    try {
        const loadedImages = await Promise.all(promises);
        
        // 将加载成功的图片添加到DOM
        loadedImages.forEach((img) => {
            if (img) {
                slideshowContainer.appendChild(img);
                photoSlides.push(img);
            }
        });
        
        // 如果没有任何照片加载成功，创建默认照片
        if (photoSlides.length === 0) {
            console.warn('没有照片加载成功，创建默认照片');
            createDefaultPhotos();
        }
        
        // 激活第一张照片
        if (photoSlides.length > 0) {
            photoSlides[0].classList.add('active');
        }
        
        console.log(`照片预加载完成，共加载 ${photoSlides.length} 张照片`);
    } catch (error) {
        console.error('照片预加载失败:', error);
        createDefaultPhotos();
    } finally {
        loading.classList.remove('active');
    }
}

// 加载单张图片
function loadImage(photoPath, index) {
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
            console.log(`照片 ${index} 加载成功: ${photoPath}`);
            img.alt = `我们的合照 ${index}`;
            img.className = 'photo-slide';
            resolve(img);
        };
        
        img.onerror = () => {
            console.warn(`照片 ${index} 加载失败: ${photoPath}`);
            // 创建占位图片
            const placeholder = createPlaceholderImage(index);
            resolve(placeholder);
        };
        
        img.src = photoPath;
    });
}

// 创建占位符图片
function createPlaceholderImage(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#ff6699');
    gradient.addColorStop(1, '#ff3366');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // 绘制文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`照片 ${index}`, 400, 250);
    
    ctx.font = '24px "Microsoft YaHei", sans-serif';
    ctx.fillText('美好回忆', 400, 320);
    
    // 绘制爱心
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '100px Arial';
    ctx.fillText('♥', 400, 450);
    
    // 创建img元素
    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg');
    img.alt = `占位照片 ${index}`;
    img.className = 'photo-slide';
    
    return img;
}

// 创建默认照片
function createDefaultPhotos() {
    for (let i = 1; i <= 3; i++) {
        const placeholder = createPlaceholderImage(i);
        slideshowContainer.appendChild(placeholder);
        photoSlides.push(placeholder);
    }
}

// 设置事件监听
function setupEventListeners() {
    // 爱心按钮点击事件
    heartBtn.addEventListener('click', startAnimation);
    heartBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startAnimation();
    });
    
    // 音乐控制按钮事件
    musicControl.addEventListener('click', toggleMusic);
    
    // 微信中音乐自动播放需要用户交互，这里在点击爱心时自动播放
    heartBtn.addEventListener('click', () => {
        if (!isMusicPlaying) {
            playBackgroundMusic();
        }
    });
}

// 开始整个动画序列
function startAnimation() {
    console.log('开始动画序列...');
    
    // 隐藏开始页面
    startPage.classList.add('hidden');
    
    // 显示爱心树
    setTimeout(() => {
        treePage.classList.add('active');
        createHeartTree();
        
        // 3秒后进入相册
        setTimeout(startAlbum, 3000);
    }, 500);
}

// 创建爱心树
function createHeartTree() {
    // 清空容器
    treeContainer.innerHTML = '';
    
    const colors = [
        '#FF3366', '#FF6699', '#FF9966', '#FFCC66',
        '#66CCFF', '#99FF66', '#9966FF', '#FF66CC',
        '#FF3333', '#33FF99', '#3399FF', '#FF9933',
        '#CC66FF', '#66FFCC', '#FF6666', '#FFCC33'
    ];
    
    // 创建树干
    const trunk = document.createElement('div');
    trunk.style.position = 'absolute';
    trunk.style.bottom = '50px';
    trunk.style.left = '50%';
    trunk.style.transform = 'translateX(-50%)';
    trunk.style.width = '20px';
    trunk.style.height = '150px';
    trunk.style.backgroundColor = '#8B4513';
    trunk.style.borderRadius = '10px';
    trunk.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    treeContainer.appendChild(trunk);
    
    // 创建爱心
    const heartCount = 60;
    const centerX = '50%';
    const centerY = '50%';
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '<i class="fas fa-heart"></i>';
            
            // 随机位置（树形分布）
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 140;
            const spread = 0.6 + Math.random() * 1.4;
            
            // 随机颜色
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // 设置样式
            heart.style.position = 'absolute';
            heart.style.left = `calc(${centerX} + ${Math.cos(angle) * distance * spread}px)`;
            heart.style.top = `calc(${centerY} - ${Math.sin(angle) * distance * 0.7}px)`;
            heart.style.color = color;
            heart.style.fontSize = `${18 + Math.random() * 30}px`;
            heart.style.opacity = '0';
            heart.style.transform = 'scale(0)';
            heart.style.transition = 'all 1s ease';
            heart.style.transitionDelay = `${i * 0.03}s`;
            heart.style.textShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            
            treeContainer.appendChild(heart);
            
            // 触发显示动画
            setTimeout(() => {
                heart.style.opacity = '0.9';
                heart.style.transform = 'scale(1)';
                
                // 添加浮动动画
                heart.style.animation = `heartFloat 3s infinite alternate ${Math.random() * 2}s`;
            }, 10);
            
        }, i * 30);
    }
}

// 开始相册播放
function startAlbum() {
    console.log('开始播放相册...');
    
    // 隐藏爱心树
    treePage.classList.remove('active');
    
    // 显示相册
    albumPage.classList.add('active');
    
    // 开始轮播
    startSlideshow();
    
    // 设置30秒后进入烟花
    setTimeout(startFireworks, CONFIG.albumDuration * 1000);
}

// 开始轮播
function startSlideshow() {
    if (photoSlides.length <= 1) {
        console.log('照片数量不足，不进行轮播');
        return;
    }
    
    console.log(`开始轮播，共 ${photoSlides.length} 张照片，每张显示 ${CONFIG.slideDuration} 秒`);
    
    // 清除可能存在的旧定时器
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    
    // 设置轮播定时器
    slideshowInterval = setInterval(() => {
        nextSlide();
    }, CONFIG.slideDuration * 1000);
}

// 切换到下一张照片
function nextSlide() {
    if (photoSlides.length <= 1) return;
    
    // 隐藏当前照片
    photoSlides[currentSlide].classList.remove('active');
    
    // 计算下一张照片索引
    currentSlide = (currentSlide + 1) % photoSlides.length;
    
    // 显示下一张照片
    photoSlides[currentSlide].classList.add('active');
}

// 开始烟花
function startFireworks() {
    console.log('开始烟花表演...');
    
    // 设置烟花激活状态
    isFireworksActive = true;
    isBlessingShown = false;
    
    // 停止相册轮播
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    
    // 隐藏相册
    albumPage.classList.remove('active');
    
    // 显示烟花页面
    fireworksPage.classList.add('active');
    
    // 开始烟花动画循环
    startFireworksAnimation();
    
    // 开始创建烟花
    createFireworks();
    fireworkInterval = setInterval(createFireworks, 800);
    
    // 设置20秒后显示祝福文字，但烟花继续
    setTimeout(showBlessingAndContinueFireworks, CONFIG.fireworkDuration * 1000);
}

// 开始烟花动画循环
function startFireworksAnimation() {
    console.log('开始烟花动画循环...');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // 开始动画循环
    function animate() {
        drawFireworks();
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 显示祝福文字并继续烟花
function showBlessingAndContinueFireworks() {
    console.log('显示祝福文字，烟花继续...');
    
    // 显示祝福文字
    blessingText.style.opacity = '1';
    isBlessingShown = true;
    blessingShownTime = Date.now();
    
    // 祝福文字显示后调整烟花频率，减少密度
    clearInterval(fireworkInterval);
    fireworkInterval = setInterval(createFireworks, 1500); // 每1.5秒创建一个烟花，减少密度
    
    // 祝福文字闪烁效果
    startBlessingTextAnimation();
}

// 祝福文字闪烁动画
function startBlessingTextAnimation() {
    let blinkCount = 0;
    const maxBlinks = 6; // 闪烁次数
    
    const blinkInterval = setInterval(() => {
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            blessingText.style.textShadow = '0 0 10px #ff3366, 0 0 20px #ff3366, 0 0 30px #ff3366';
            return;
        }
        
        if (blinkCount % 2 === 0) {
            blessingText.style.textShadow = '0 0 15px #ffcc00, 0 0 30px #ffcc00, 0 0 45px #ffcc00';
        } else {
            blessingText.style.textShadow = '0 0 10px #ff3366, 0 0 20px #ff3366, 0 0 30px #ff3366';
        }
        
        blinkCount++;
    }, 500);
}

// 创建烟花
function createFireworks() {
    if (!isFireworksActive) return;
    
    // 随机位置创建烟花
    const firework = {
        x: Math.random() * fireworksCanvas.width,
        y: fireworksCanvas.height,
        targetY: 100 + Math.random() * (fireworksCanvas.height * 0.5),
        speed: 2 + Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        particles: [],
        exploded: false,
        size: 3 + Math.random() * 2
    };
    
    fireworks.push(firework);
    
    // 同时创建多个烟花增加效果
    if (Math.random() > 0.5) {
        const secondFirework = {
            x: Math.random() * fireworksCanvas.width,
            y: fireworksCanvas.height,
            targetY: 100 + Math.random() * (fireworksCanvas.height * 0.5),
            speed: 2 + Math.random() * 3,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            particles: [],
            exploded: false,
            size: 3 + Math.random() * 2
        };
        fireworks.push(secondFirework);
    }
}

// 烟花粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 12,
            y: (Math.random() - 0.5) * 12
        };
        this.alpha = 1;
        this.decay = 0.015 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 4;
        this.gravity = 0.07;
        this.friction = 0.97;
    }
    
    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity; // 重力
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }
    
    draw() {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // 绘制圆形粒子
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加光晕效果
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(')', ', 0.3)').replace('hsl', 'hsla');
        ctx.fill();
        
        ctx.restore();
    }
}

// 绘制烟花
function drawFireworks() {
    // 清除画布 - 使用半透明黑色实现拖尾效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    
    // 更新和绘制所有烟花
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        
        if (!firework.exploded) {
            // 上升阶段 - 绘制上升轨迹
            firework.y -= firework.speed;
            
            // 绘制上升轨迹
            ctx.save();
            ctx.fillStyle = firework.color;
            ctx.beginPath();
            ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加火花拖尾
            ctx.beginPath();
            ctx.arc(firework.x, firework.y + 5, firework.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = firework.color.replace(')', ', 0.5)').replace('hsl', 'hsla');
            ctx.fill();
            ctx.restore();
            
            // 到达目标位置时爆炸
            if (firework.y <= firework.targetY) {
                firework.exploded = true;
                
                // 创建爆炸粒子
                const particleCount = 100 + Math.random() * 80;
                for (let j = 0; j < particleCount; j++) {
                    firework.particles.push(new Particle(firework.x, firework.y, firework.color));
                }
            }
        } else {
            // 绘制爆炸粒子
            for (let j = firework.particles.length - 1; j >= 0; j--) {
                const particle = firework.particles[j];
                particle.update();
                particle.draw();
                
                // 移除消失的粒子
                if (particle.alpha <= 0) {
                    firework.particles.splice(j, 1);
                }
            }
            
            // 如果所有粒子都消失了，移除烟花
            if (firework.particles.length === 0) {
                fireworks.splice(i, 1);
            }
        }
    }
    
    // 绘制祝福文字的背景效果（如果祝福文字已显示）
    if (isBlessingShown) {
        // 为祝福文字添加光晕效果
        const elapsedTime = Date.now() - blessingShownTime;
        const pulseIntensity = 0.3 + 0.2 * Math.sin(elapsedTime * 0.005); // 脉动效果
        
        // 在祝福文字周围绘制光晕粒子
        if (Math.random() < 0.4) { // 40%的几率添加光晕粒子
            const x = fireworksCanvas.width * 0.5 + (Math.random() - 0.5) * 120;
            const y = fireworksCanvas.height * 0.5 + (Math.random() - 0.5) * 80;
            
            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.7;
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加外发光
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcc00';
            ctx.globalAlpha = pulseIntensity * 0.3;
            ctx.fill();
            ctx.restore();
        }
        
        // 绘制文字背景光晕
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(
            fireworksCanvas.width * 0.5, 
            fireworksCanvas.height * 0.5, 
            200, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
}

// 播放背景音乐
function playBackgroundMusic() {
    if (isMusicPlaying) return;
    
    bgMusic.volume = 0.7; // 设置音量
    bgMusic.play().then(() => {
        isMusicPlaying = true;
        musicControl.innerHTML = '<i class="fas fa-volume-up"></i>';
        console.log('背景音乐开始播放');
    }).catch((error) => {
        console.log('背景音乐播放失败:', error);
        // 显示提示，需要用户交互
        musicControl.style.animation = 'heartBeat 1s 3';
        setTimeout(() => {
            musicControl.style.animation = '';
        }, 3000);
    });
}

// 暂停背景音乐
function pauseBackgroundMusic() {
    if (!isMusicPlaying) return;
    
    bgMusic.pause();
    isMusicPlaying = false;
    musicControl.innerHTML = '<i class="fas fa-volume-mute"></i>';
    console.log('背景音乐已暂停');
}

// 切换音乐播放状态
function toggleMusic() {
    if (isMusicPlaying) {
        pauseBackgroundMusic();
    } else {
        playBackgroundMusic();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成');
    init();
});

// 确保页面完全加载
window.addEventListener('load', () => {
    console.log('页面完全加载');
    // 初始化画布大小
    resizeCanvas();
});

// 页面关闭前清理
window.addEventListener('beforeunload', () => {
    // 停止所有动画
    isFireworksActive = false;
    if (fireworkInterval) clearInterval(fireworkInterval);
    if (slideshowInterval) clearInterval(slideshowInterval);
    if (animationId) cancelAnimationFrame(animationId);
});

// 添加触摸事件支持
document.addEventListener('touchmove', function(e) {
    e.preventDefault();

}, { passive: false });
