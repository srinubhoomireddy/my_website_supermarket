const KEY_PRODUCTS="sm_products_v1", KEY_ORDERS="sm_orders_v1";
const demoProducts=[
 {id:crypto.randomUUID(),name:"Rice 5 kg",category:"Groceries",price:320,stock:25},
 {id:crypto.randomUUID(),name:"Wheat Flour 5 kg",category:"Groceries",price:240,stock:18},
 {id:crypto.randomUUID(),name:"Cooking Oil 1 L",category:"Cooking",price:145,stock:32},
 {id:crypto.randomUUID(),name:"Sugar 1 kg",category:"Groceries",price:48,stock:40},
 {id:crypto.randomUUID(),name:"Milk 1 L",category:"Dairy",price:62,stock:12},
 {id:crypto.randomUUID(),name:"Biscuits",category:"Snacks",price:30,stock:8}
];
let products=JSON.parse(localStorage.getItem(KEY_PRODUCTS)||"null")||demoProducts;
let orders=JSON.parse(localStorage.getItem(KEY_ORDERS)||"[]");
let cart=[];

const money=n=>"₹"+Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const save=()=>{localStorage.setItem(KEY_PRODUCTS,JSON.stringify(products));localStorage.setItem(KEY_ORDERS,JSON.stringify(orders));};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
 btn.classList.add("active");document.getElementById(btn.dataset.tab).classList.add("active");
 if(btn.dataset.tab==="dashboard")renderDashboard();
 if(btn.dataset.tab==="products")renderProducts();
 if(btn.dataset.tab==="new-order")renderOrderProducts();
 if(btn.dataset.tab==="orders")renderOrders();
}));

function renderDashboard(){
 document.getElementById("statProducts").textContent=products.length;
 document.getElementById("statStock").textContent=products.reduce((a,p)=>a+Number(p.stock),0);
 document.getElementById("statOrders").textContent=orders.length;
 document.getElementById("statSales").textContent=money(orders.reduce((a,o)=>a+o.total,0));
 const low=products.filter(p=>Number(p.stock)<=10);
 document.getElementById("lowStockList").innerHTML=low.length?`<table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead><tbody>${low.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${p.stock}</td><td><span class="badge warn">Low stock</span></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No low-stock products.</div>`;
}

function renderProducts(){
 const q=document.getElementById("productSearch").value.toLowerCase();
 const list=products.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q));
 document.getElementById("productTable").innerHTML=list.length?`<table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead><tbody>${list.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td><span class="badge ${p.stock<=10?"warn":""}">${p.stock}</span></td><td><button class="action-btn" onclick="editProduct('${p.id}')">Edit</button><button class="action-btn delete" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No products found.</div>`;
}

function renderOrderProducts(){
 const q=document.getElementById("orderSearch").value.toLowerCase();
 const list=products.filter(p=>p.stock>0 && (p.name+" "+p.category).toLowerCase().includes(q));
 document.getElementById("orderProducts").innerHTML=list.length?list.map(p=>`<div class="product-card"><h3>${esc(p.name)}</h3><p>${esc(p.category)} · Stock: ${p.stock}</p><div class="price">${money(p.price)}</div><button class="btn btn-primary" onclick="addToCart('${p.id}')">Add to Cart</button></div>`).join(""):`<div class="empty">No available products.</div>`;
 renderCart();
}

function addToCart(id){
 const p=products.find(x=>x.id===id); if(!p||p.stock<=0)return;
 const item=cart.find(x=>x.id===id);
 if(item){if(item.qty<p.stock)item.qty++;else alert("Not enough stock.");}
 else cart.push({id,qty:1});
 renderCart();
}
function changeQty(id,delta){
 const item=cart.find(x=>x.id===id),p=products.find(x=>x.id===id);if(!item||!p)return;
 item.qty+=delta;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);else if(item.qty>p.stock){item.qty=p.stock;alert("Maximum available stock is "+p.stock);}
 renderCart();
}
function renderCart(){
 const box=document.getElementById("cartItems");
 if(!cart.length)box.innerHTML='<div class="empty">Cart is empty. Add products to create an order.</div>';
 else box.innerHTML=cart.map(i=>{const p=products.find(x=>x.id===i.id);return `<div class="cart-item"><div><div class="cart-item-name">${esc(p.name)}</div><small>${money(p.price)} × ${i.qty}</small></div><div class="cart-controls"><button class="qty-btn" onclick="changeQty('${i.id}',-1)">−</button><b>${i.qty}</b><button class="qty-btn" onclick="changeQty('${i.id}',1)">+</button></div></div>`}).join("");
 const subtotal=cart.reduce((a,i)=>{const p=products.find(x=>x.id===i.id);return a+p.price*i.qty},0),tax=subtotal*.05;
 document.getElementById("cartSubtotal").textContent=money(subtotal);document.getElementById("cartTax").textContent=money(tax);document.getElementById("cartTotal").textContent=money(subtotal+tax);
}
document.getElementById("clearCartBtn").onclick=()=>{cart=[];renderCart()};
document.getElementById("placeOrderBtn").onclick=()=>{
 if(!cart.length)return alert("Please add at least one product.");
 const subtotal=cart.reduce((a,i)=>a+products.find(p=>p.id===i.id).price*i.qty,0),tax=subtotal*.05,total=subtotal+tax;
 cart.forEach(i=>products.find(p=>p.id===i.id).stock-=i.qty);
 orders.unshift({id:"ORD-"+Date.now().toString().slice(-7),date:new Date().toLocaleString("en-IN"),items:cart.map(i=>{const p=products.find(x=>x.id===i.id);return {name:p.name,qty:i.qty,price:p.price}}),subtotal,tax,total});
 save();cart=[];renderCart();renderDashboard();alert("Order placed successfully.");
};

function renderOrders(){
 const q=document.getElementById("orderHistorySearch").value.toLowerCase();
 const list=orders.filter(o=>(o.id+" "+o.date).toLowerCase().includes(q));
 document.getElementById("orderTable").innerHTML=list.length?`<table><thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th></tr></thead><tbody>${list.map(o=>`<tr><td><b>${o.id}</b></td><td>${esc(o.date)}</td><td>${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join(", ")}</td><td><b>${money(o.total)}</b></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No orders found.</div>`;
}

function openProductModal(p=null){
 document.getElementById("productModal").classList.remove("hidden");
 document.getElementById("modalTitle").textContent=p?"Edit Product":"Add Product";
 document.getElementById("productId").value=p?.id||"";
 document.getElementById("productName").value=p?.name||"";
 document.getElementById("productCategory").value=p?.category||"";
 document.getElementById("productPrice").value=p?.price??"";
 document.getElementById("productStock").value=p?.stock??"";
}
function closeModal(){document.getElementById("productModal").classList.add("hidden")}
window.editProduct=id=>openProductModal(products.find(p=>p.id===id));
window.deleteProduct=id=>{const p=products.find(x=>x.id===id);if(confirm(`Delete "${p.name}"?`)){products=products.filter(x=>x.id!==id);save();renderProducts();renderDashboard();renderOrderProducts()}};
document.getElementById("addProductBtn").onclick=()=>openProductModal();
document.getElementById("closeModal").onclick=closeModal;document.getElementById("cancelModal").onclick=closeModal;
document.getElementById("productForm").onsubmit=e=>{
 e.preventDefault();const id=document.getElementById("productId").value;
 const data={id:id||crypto.randomUUID(),name:document.getElementById("productName").value.trim(),category:document.getElementById("productCategory").value.trim(),price:Number(document.getElementById("productPrice").value),stock:Number(document.getElementById("productStock").value)};
 if(id)products=products.map(p=>p.id===id?data:p);else products.push(data);save();closeModal();renderProducts();renderDashboard();renderOrderProducts();
};
document.getElementById("productSearch").oninput=renderProducts;
document.getElementById("orderSearch").oninput=renderOrderProducts;
document.getElementById("orderHistorySearch").oninput=renderOrders;
document.getElementById("resetDataBtn").onclick=()=>{
 if(confirm("Reset all products and orders to demo data?")){products=demoProducts.map(p=>({...p,id:crypto.randomUUID()}));orders=[];cart=[];save();renderDashboard();renderProducts();renderOrderProducts();renderOrders();}
};
renderDashboard();
