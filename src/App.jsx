import { useEffect, useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const DELIVERY_FEE = 499;
const initialCheckout = {
  customerName: '',
  email: '',
  phone: '',
  address: '',
  deliveryNotes: ''
};
const initialAuthForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: true
};

const roleMeta = {
  customer: { label: 'Customer', tagline: 'Track orders, manage installation, and request refunds.' },
  admin: { label: 'Admin', tagline: 'Oversee processing, dispatch, and fulfillment.' },
  delivery: { label: 'Delivery', tagline: 'Move orders from warehouse to doorstep.' },
  installation: { label: 'Installation', tagline: 'Coordinate final setup and completion.' },
  guest: { label: 'Guest', tagline: 'Browse the collection and sign in to order.' }
};

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('shop');
  const [notice, setNotice] = useState('');
  const [checkout, setCheckout] = useState(initialCheckout);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState({ user: null, role: 'guest' });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadData = async (savedToken) => {
      setLoading(true);
      try {
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        if (savedToken) {
          const ordersRes = await fetch('/api/orders', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
          }
        }
      } catch (error) {
        console.error(error);
        setNotice('Unable to reach the backend right now.');
      } finally {
        setLoading(false);
      }
    };

    const savedSession = localStorage.getItem('furnishhub-session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        setToken(parsed.token || null);
        if (parsed.role && parsed.role !== 'guest') {
          setView(parsed.role === 'customer' ? 'shop' : 'dashboard');
        }
        loadData(parsed.token);
      } catch (error) {
        console.error(error);
        loadData(null);
      }
    } else {
      loadData(null);
    }
  }, []);

  useEffect(() => {
    if (session.role === 'guest' || !session.user || !token) {
      localStorage.removeItem('furnishhub-session');
      return;
    }
    localStorage.setItem('furnishhub-session', JSON.stringify({ ...session, token }));
  }, [session, token]);

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const deliveryFee = DELIVERY_FEE;
  const grandTotal = subtotal + deliveryFee;
  const categories = useMemo(() => ['All', ...new Set(products.map((product) => product.category))], [products]);
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      const matchesSearch = !query || [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);
  const visibleOrders = useMemo(() => {
    if (session.role === 'admin') return orders;
    if (session.role === 'delivery') {
      return orders.filter((order) => order.deliveryStatus !== 'Delivered' && order.status !== 'Completed');
    }
    if (session.role === 'installation') {
      return orders.filter((order) => order.installationStatus !== 'Completed' && order.status !== 'Completed');
    }
    if (session.role === 'customer' && session.user) {
      return orders.filter((order) => order.customerEmail === session.user.email);
    }
    return orders;
  }, [orders, session]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to cart.`);
  };

  const updateQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'signin' ? '/api/auth' : '/api/auth/register';
      const payload = authMode === 'signin'
        ? { email: authForm.email, password: authForm.password }
        : {
            name: authForm.name,
            email: authForm.email,
            password: authForm.password
          };

      if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(text || 'Authentication failed');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      setSession({ user: data.user, role: data.user.role });
      setView(data.user.role === 'customer' ? 'shop' : 'dashboard');
      setAuthForm(initialAuthForm);
      setNotice(authMode === 'signin' ? `Welcome back, ${data.user.name}.` : `Account created for ${data.user.name}.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession({ user: null, role: 'guest' });
    setToken(null);
    setView('shop');
    setOrders([]);
    setNotice('Signed out.');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      setNotice('Choose at least one product before checkout.');
      return;
    }
    if (!checkout.customerName || !checkout.email || !checkout.phone || !checkout.address) {
      setNotice('Please complete your delivery details before confirming the order.');
      return;
    }

    const payload = {
      customerName: checkout.customerName,
      customerEmail: checkout.email,
      phone: checkout.phone,
      address: checkout.address,
      deliveryNotes: checkout.deliveryNotes,
      items: cart,
      total: grandTotal,
      status: 'Received',
      deliveryStatus: 'Queued',
      installationStatus: 'Pending',
      refundRequested: false,
      trackingNumber: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      accountType: session.user ? 'registered' : 'guest'
    };

    if (!token || session.role !== 'customer') {
      setNotice('Please sign in as a customer to place an order.');
      return;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || 'Unable to place order.');
      return;
    }

    setOrders((current) => [data, ...current]);
    setCart([]);
    setCheckout(initialCheckout);
    setConfirmation({ id: data.id, total: data.total, address: data.address });
    setNotice(`Order ${data.id.slice(0, 6)} confirmed. Your concierge team will update you shortly.`);
  };

  const updateOrder = async (id, updates, successMessage) => {
    if (!token) {
      setNotice('Please sign in to manage your orders.');
      return;
    }

    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const updated = await response.json();
    if (!response.ok) {
      setNotice(updated.error || 'Unable to update order.');
      return;
    }
    setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
    setNotice(successMessage);
  };

  const renderShop = () => (
    <main className="content-grid">
      <section>
        <div className="section-title">
          <h2>Featured pieces</h2>
          <span>Curated for modern living rooms, dining, and bedrooms.</span>
        </div>
        <div className="product-toolbar">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search furniture" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="empty-state">Loading curated furniture…</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="card" key={product.id}>
                <img className="product-image" src={product.image} alt={product.name} />
                <div className="card-top">
                  <span className="pill">{product.category}</span>
                  <span className="pill subtle">{product.badge}</span>
                </div>
                <div className="product-body">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-meta">
                    <span>{product.material}</span>
                    <span>{product.deliveryWindow}</span>
                  </div>
                </div>
                <div className="card-bottom">
                  <div className="price-block">
                    <strong>{currency.format(product.price)}</strong>
                    <span className={`stock-pill ${product.stock < 4 ? 'low' : ''}`}>{product.stock < 4 ? `Only ${product.stock} left` : 'In stock'}</span>
                  </div>
                  <button onClick={() => addToCart(product)}>Add to cart</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="sidebar">
        <div className="section-title">
          <h2>Your order</h2>
          <span>Elegant cart and delivery details</span>
        </div>
        <div className="cart-list">
          {cart.length === 0 ? (
            <p className="empty">Your cart is beautifully empty.</p>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{currency.format(item.price)} each</p>
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="totals">
          <div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
          <div><span>White-glove delivery</span><strong>{currency.format(deliveryFee)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{currency.format(grandTotal)}</strong></div>
        </div>

        {confirmation ? (
          <div className="success-card">
            <strong>Order confirmed</strong>
            <p>Reference {confirmation.id.slice(0, 8)} • {currency.format(confirmation.total)}</p>
            <span>{confirmation.address}</span>
          </div>
        ) : null}

        <form className="checkout-form" onSubmit={submitOrder}>
          <input required placeholder="Full name" value={checkout.customerName} onChange={(e) => setCheckout({ ...checkout, customerName: e.target.value })} />
          <input required type="email" placeholder="Email" value={checkout.email} onChange={(e) => setCheckout({ ...checkout, email: e.target.value })} />
          <input required placeholder="Phone" value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} />
          <textarea required placeholder="Delivery address" value={checkout.address} onChange={(e) => setCheckout({ ...checkout, address: e.target.value })} />
          <textarea placeholder="Installation notes" value={checkout.deliveryNotes} onChange={(e) => setCheckout({ ...checkout, deliveryNotes: e.target.value })} />
          {session.role === 'customer' ? (
            <button className="primary" type="submit">Confirm order</button>
          ) : (
            <button className="secondary" type="submit">Checkout as guest</button>
          )}
        </form>
      </aside>
    </main>
  );

  const renderDashboard = () => {
    if (session.role === 'customer') {
      return (
        <section className="dashboard-card">
          <div className="section-title">
            <h2>Customer dashboard</h2>
            <span>Monitor your delivery, installation, and refund requests.</span>
          </div>
          <div className="orders-list">
            {visibleOrders.length === 0 ? (
              <div className="empty-state">No orders yet. Start by adding pieces to your cart.</div>
            ) : (
              visibleOrders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-head">
                    <div>
                      <h3>{order.customerName}</h3>
                      <p>{order.address}</p>
                    </div>
                    <span className="status-pill">{order.status}</span>
                  </div>
                  <p className="muted">Tracking: {order.trackingNumber || 'Pending'}</p>
                  <div className="meta-grid">
                    <span>Delivery: {order.deliveryStatus}</span>
                    <span>Installation: {order.installationStatus}</span>
                    <span>Refund: {order.refundRequested ? 'Requested' : 'Not requested'}</span>
                  </div>
                  <div className="order-actions">
                    <button onClick={() => updateOrder(order.id, { refundRequested: true, status: 'Refund Requested' }, 'Refund request submitted.')}>Request refund</button>
                    <button onClick={() => updateOrder(order.id, { installationStatus: 'Scheduled', status: 'Installation Scheduled' }, 'Installation scheduled.')}>Schedule install</button>
                    <strong>{currency.format(order.total)}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      );
    }

    if (session.role === 'admin') {
      return (
        <section className="dashboard-card">
          <div className="section-title">
            <h2>Admin control center</h2>
            <span>Coordinate commerce, dispatch, and fulfillment from one place.</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><strong>{orders.length}</strong><span>Total orders</span></div>
            <div className="stat-card"><strong>{orders.filter((order) => order.deliveryStatus === 'Out for Delivery').length}</strong><span>In transit</span></div>
            <div className="stat-card"><strong>{orders.filter((order) => order.installationStatus === 'Scheduled').length}</strong><span>Install scheduled</span></div>
          </div>
          <div className="orders-list">
            {visibleOrders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-head">
                  <div>
                    <h3>{order.customerName}</h3>
                    <p>{order.address}</p>
                  </div>
                  <span className="status-pill">{order.status}</span>
                </div>
                <p className="muted">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ')}</p>
                <div className="meta-grid">
                  <span>Tracking: {order.trackingNumber || 'Pending'}</span>
                  <span>Delivery: {order.deliveryStatus}</span>
                  <span>Installation: {order.installationStatus}</span>
                </div>
                <div className="order-actions">
                  <button onClick={() => updateOrder(order.id, { deliveryStatus: 'Out for Delivery', status: 'Dispatched' }, 'Order dispatched.')}>Dispatch</button>
                  <button onClick={() => updateOrder(order.id, { installationStatus: 'Scheduled', status: 'Installation Scheduled' }, 'Installation scheduled.')}>Install</button>
                  <button onClick={() => updateOrder(order.id, { deliveryStatus: 'Delivered', status: 'Delivered' }, 'Order delivered.')}>Deliver</button>
                  <button onClick={() => updateOrder(order.id, { refundRequested: true, status: 'Refund Requested' }, 'Refund requested.')}>Refund</button>
                  <strong>{currency.format(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (session.role === 'delivery') {
      return (
        <section className="dashboard-card">
          <div className="section-title">
            <h2>Delivery team dashboard</h2>
            <span>Keep delivery progress moving and confirm handovers.</span>
          </div>
          <div className="orders-list">
            {visibleOrders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-head">
                  <div>
                    <h3>{order.customerName}</h3>
                    <p>{order.address}</p>
                  </div>
                  <span className="status-pill">{order.status}</span>
                </div>
                <div className="meta-grid">
                  <span>Tracking: {order.trackingNumber}</span>
                  <span>Delivery: {order.deliveryStatus}</span>
                  <span>Install: {order.installationStatus}</span>
                </div>
                <div className="order-actions">
                  <button onClick={() => updateOrder(order.id, { deliveryStatus: 'Out for Delivery', status: 'Dispatched' }, 'Order marked out for delivery.')}>Out for delivery</button>
                  <button onClick={() => updateOrder(order.id, { deliveryStatus: 'Delivered', status: 'Delivered' }, 'Delivery confirmed.')}>Delivered</button>
                  <strong>{currency.format(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="dashboard-card">
        <div className="section-title">
          <h2>Installation team dashboard</h2>
          <span>Prepare installations and confirm completion.</span>
        </div>
        <div className="orders-list">
          {visibleOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <h3>{order.customerName}</h3>
                  <p>{order.address}</p>
                </div>
                <span className="status-pill">{order.status}</span>
              </div>
              <div className="meta-grid">
                <span>Tracking: {order.trackingNumber}</span>
                <span>Delivery: {order.deliveryStatus}</span>
                <span>Install: {order.installationStatus}</span>
              </div>
              <div className="order-actions">
                <button onClick={() => updateOrder(order.id, { installationStatus: 'Scheduled', status: 'Installation Scheduled' }, 'Installation scheduled.')}>Schedule install</button>
                <button onClick={() => updateOrder(order.id, { installationStatus: 'Completed', status: 'Completed' }, 'Installation completed.')}>Mark installed</button>
                <strong>{currency.format(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Furnish Hub • Premium Furniture Commerce</p>
          <h1>Luxury furniture for modern homes, with concierge delivery and installation.</h1>
          <p className="hero-copy">
            A refined shopping experience for customers plus role-based dashboards for admin, delivery, and installation teams.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setView('shop')}>Shop collection</button>
            <button className="secondary" onClick={() => setView(session.role === 'guest' ? 'shop' : 'dashboard')}>Go to {session.role === 'guest' ? 'sign in' : `${roleMeta[session.role].label.toLowerCase()} dashboard`}</button>
          </div>
        </div>

        <div className="auth-card">
          <div className="section-title">
            <h2>{authMode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
            <span>{authMode === 'signin' ? 'A secure experience for clients and partners.' : 'Start with a personal profile and service role.'}</span>
          </div>
          {session.user ? (
            <div className="auth-panel">
              <p>Signed in as {session.user.name}</p>
              <button className="secondary" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' ? (
                <input required placeholder="Full name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
              ) : null}
              <input required type="email" placeholder="Email address" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
              <input required type="password" placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
              {authMode === 'signup' ? (
                <>
                  <input required type="password" placeholder="Confirm password" value={authForm.confirmPassword} onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })} />
                </>
              ) : null}
              <label className="checkbox-row">
                <input type="checkbox" checked={authForm.rememberMe} onChange={(e) => setAuthForm({ ...authForm, rememberMe: e.target.checked })} />
                <span>Keep me signed in for faster checkout</span>
              </label>
              <div className="auth-buttons">
                <button className="primary" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</button>
                <button className="secondary" type="button" onClick={() => setAuthForm({ ...initialAuthForm, email: 'customer@furnishhub.com', password: 'customer123' })}>Use customer demo</button>
              </div>
              <div className="auth-switcher">
                <button type="button" className="link-btn" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                  {authMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
                </button>
                <button type="button" className="link-btn" onClick={() => setView('shop')}>Continue as guest</button>
              </div>
            </form>
          )}
        </div>
      </header>

      {notice ? <div className="notice">{notice}</div> : null}

      {view === 'dashboard' && session.role !== 'guest' ? renderDashboard() : renderShop()}
    </div>
  );
}

export default App;
