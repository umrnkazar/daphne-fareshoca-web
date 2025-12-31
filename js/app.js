// js/app.js


let cart = JSON.parse(localStorage.getItem('cart')) || [];
let user = JSON.parse(localStorage.getItem('user')) || null;
-
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); 
    checkAuth(); 
    
    navigateTo('home');
});


function navigateTo(viewName, param = null) {
    const container = document.getElementById('app-container');
    
    const template = document.getElementById(`view-${viewName}`);
    
    if(!template) {
        console.error(`Template view-${viewName} bulunamadı.`);
        return;
    }
    
    container.innerHTML = '';
    container.appendChild(template.content.cloneNode(true));
    
    if (viewName === 'home') {
        initWeatherAPI();
    }
    else if (viewName === 'shop') {
        
        if (typeof products !== 'undefined') {
            renderShop(products);
        } else {
            console.error("Ürün verisi (products) bulunamadı.");
        }
    }
    else if (viewName === 'product-detail' && param) {
        let product = param;
        if(typeof param === 'string') {
            try { 
                product = JSON.parse(decodeURIComponent(param)); 
            } catch(e) {
                console.error("Ürün verisi parse edilemedi", e);
            }
        }
        renderProductDetail(product);
    }
    else if (viewName === 'cart') {
        renderCartPage();
    }
    
    
    if (window.lucide) lucide.createIcons();
    window.scrollTo(0,0);
}

async function initWeatherAPI() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.4192&longitude=27.1287&current_weather=true');
        const data = await res.json();
        const temp = data.current_weather.temperature;
        const code = data.current_weather.weathercode;
        // hava durumu kodu çevirisi
        const cond = code < 3 ? "Açık" : code > 50 ? "Yağmurlu" : "Bulutlu";
        
        const wText = document.getElementById('weather-text');
        
        if(wText) wText.innerText = `İzmir: ${temp}°C, ${cond}`;
        
        const lDisplay = document.getElementById('weather-display-large');
        
        if(lDisplay) lDisplay.innerHTML = `<span class="text-3xl font-serif text-white">${temp}°C</span> <br> <span class="text-sage-accent">${cond}</span>`;
    } catch(e) { 
        console.log("Hava durumu hatası:", e); 
    }
}


function renderShop(items) {
    const grid = document.getElementById('shop-grid');
    if(grid) {
        grid.innerHTML = items.map(p => createProductCard(p)).join('');
        if (window.lucide) lucide.createIcons();
    }
}

function createProductCard(p) {
  
    const pStr = encodeURIComponent(JSON.stringify(p)).replace(/'/g, "%27");
    
   
    return `
    <div class="group hover-lift bg-midnight-light rounded-xl shadow-md border border-white/5 overflow-hidden cursor-pointer" onclick="navigateTo('product-detail', '${pStr}')">
        <div class="relative h-64 overflow-hidden">
            ${p.tag ? `<span class="absolute top-3 left-3 bg-sage-accent text-midnight-green text-xs px-2 py-1 rounded font-serif z-10 font-bold shadow-md">${p.tag}</span>` : ''}
            <img src="${p.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
            <button onclick="event.stopPropagation(); addToCart(${p.id})" class="absolute bottom-4 right-4 bg-sage-accent text-midnight-green p-2 rounded-full shadow-lg z-20 hover:bg-white transition-colors"><i data-lucide="plus" class="w-5 h-5"></i></button>
        </div>
        <div class="p-5 text-center">
            <h3 class="font-serif text-lg font-medium text-text-header mb-1">${p.name}</h3>
            <p class="text-sage-accent font-bold font-sans">$${p.price.toFixed(2)}</p>
        </div>
    </div>`;
}

function filterProducts(cat) {
   
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-sage-accent', 'text-midnight-green');
        b.classList.add('text-sage-accent');
    });
    
    if(event && event.target) {
        event.target.classList.add('bg-sage-accent', 'text-midnight-green');
    }

    if (typeof products !== 'undefined') {
        renderShop(cat === 'all' ? products : products.filter(p => p.category === cat));
    }
}

function searchProducts(val) {
    if (typeof products !== 'undefined') {
        renderShop(products.filter(p => p.name.toLowerCase().includes(val.toLowerCase())));
    }
}

function renderProductDetail(p) {
    const imgEl = document.getElementById('detail-image');
    if(imgEl) imgEl.src = p.image;
    
    const nameEl = document.getElementById('detail-name');
    if(nameEl) nameEl.innerText = p.name;
    
    const priceEl = document.getElementById('detail-price');
    if(priceEl) priceEl.innerText = "$" + p.price.toFixed(2);
    
    const catEl = document.getElementById('detail-category');
    if(catEl) catEl.innerText = p.category;
    
    const btnEl = document.getElementById('add-to-cart-btn');
    if(btnEl) btnEl.onclick = () => addToCart(p.id);
    
    
    if (typeof products !== 'undefined') {
        const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0,4);
        const relatedGrid = document.getElementById('related-products-grid');
        if(relatedGrid) {
            relatedGrid.innerHTML = related.map(x => createProductCard(x)).join('');
        }
    }
    
    if (window.lucide) lucide.createIcons();
}

function addToCart(id) {
    if (typeof products === 'undefined') return;
    
    const p = products.find(x => x.id === id);
    const exist = cart.find(x => x.id === id);
    
    if(exist) {
        exist.quantity++;
    } else {
        cart.push({...p, quantity: 1});
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    showToast(`${p.name} added`);
    updateCartCount();
}

function updateQuantity(id, change) {
    const item = cart.find(x => x.id === id);
    if(item) {
        item.quantity += change;
        if(item.quantity <= 0) {
            cart = cart.filter(x => x.id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage();
        updateCartCount();
    }
}

function updateCartCount() {
    const count = document.getElementById('cart-count');
    const total = cart.reduce((sum, i) => sum + i.quantity, 0);
    if(count) { 
        count.innerText = total; 
        count.classList.toggle('opacity-0', total === 0); 
    }
}

function renderCartPage() {
    const container = document.getElementById('cart-contents');
    const totalEl = document.getElementById('cart-view-total');
    if(!container) return;
    
    if(cart.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">Basket is empty</div>';
        if(totalEl) totalEl.innerText = "$0.00";
        return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
       
        return `
        <div class="flex justify-between items-center border-b border-white/5 py-4">
            <div class="flex items-center gap-4">
                <img src="${item.image}" class="w-16 h-16 object-cover rounded-md opacity-80" onerror="this.src='https://placehold.co/100?text=N/A'">
                <div>
                    <h4 class="font-serif text-text-header">${item.name}</h4>
                    <p class="text-sm text-gray-400">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                 <button onclick="updateQuantity(${item.id}, -1)" class="px-2 text-sage-accent hover:text-white">-</button>
                 <span>${item.quantity}</span>
                 <button onclick="updateQuantity(${item.id}, 1)" class="px-2 text-sage-accent hover:text-white">+</button>
            </div>
        </div>`;
    }).join('');
    
    if(totalEl) totalEl.innerText = "$" + total.toFixed(2);
}

function toggleAuthMode(mode) {
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');
    
    if(loginForm) loginForm.classList.toggle('hidden', mode === 'register');
    if(registerForm) registerForm.classList.toggle('hidden', mode === 'login');
}

async function handleGoogleLogin() {
    // Not: 'auth' ve 'provider' değişkenleri firebase.js dosyasından gelmeli
    if(typeof auth === 'undefined' || typeof provider === 'undefined') {
        return alert("Firebase Config eksik! Lütfen js/firebase.js dosyasını kontrol edin.");
    }
    
    try {
        const res = await auth.signInWithPopup(provider);
        finishLogin({
            name: res.user.displayName, 
            email: res.user.email, 
            photo: res.user.photoURL
        });
    } catch(e) {
        console.error(e);
        alert("Giriş Başarısız: " + e.message);
    }
}

function handleNormalLogin(e) { 
    e.preventDefault(); 
    // Mock login
    finishLogin({name: "User", email: "user@test.com", photo: null}); 
}

function handleRegister(e) { 
    e.preventDefault(); 
    // Mock register
    finishLogin({name: "New User", email: "new@test.com", photo: null}); 
}

function finishLogin(u) {
    user = u; 
    localStorage.setItem('user', JSON.stringify(user));
    checkAuth(); 
    navigateTo('home'); 
    // DÜZELTME: Backtick eklendi
    showToast(`Welcome ${u.name}`);
}

function logout() {
    if(typeof auth !== 'undefined') auth.signOut();
    user = null; 
    localStorage.removeItem('user');
    checkAuth(); 
    navigateTo('home');
}

function checkAuth() {
    const sec = document.getElementById('auth-section');
    const prof = document.getElementById('user-profile');
    
    if (!sec || !prof) return;

    if(user) {
        sec.classList.add('hidden');
        prof.classList.remove('hidden'); 
        prof.classList.add('flex');
        
        const nameEl = document.getElementById('user-name');
        if(nameEl) nameEl.innerText = user.name;
        
        const avatarEl = document.getElementById('user-avatar');
      
        if(avatarEl) avatarEl.src = user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=9CAF88&color=fff`;
    } else {
        sec.classList.remove('hidden');
        prof.classList.add('hidden'); 
        prof.classList.remove('flex');
    }
}

function toggleSpotify() {
    const player = document.getElementById('spotify-player');
    if(player) player.classList.toggle('hidden');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    
    if(!t || !msgEl) return;
    
    msgEl.innerText = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        t.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}