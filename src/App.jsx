import React, { useEffect, useState, useMemo } from "react";
import { fetchMedicines, updateMedicine, deleteMedicine, registerSeller, loginSeller, verifySeller, fetchServices, fetchServiceNames, fetchSellerServices, createService, updateService, deleteService, uploadImage, fetchProducts, fetchProductNames, fetchSellerProducts, createProduct, updateProduct, deleteProduct, fetchSellers, updateSeller, deleteSeller, fetchPendingItems, fetchAllItemsAdmin, approveProduct, rejectProduct, approveService, rejectService } from "./api.js";
import MedicineForm from "./components/MedicineForm.jsx";
import MedicineList from "./components/MedicineList.jsx";
import { Routes, Route, Link, NavLink, useNavigate } from "react-router-dom";
import { verifyAdmin } from "./api.js";
import mediImage from "./medi.jpg";
import treeLogo from "./tree.png";
import noImage from "./no-image.png";

// Fallback no-image data URL (in case PNG fails to load)
const noImageFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f5f5f5' width='400' height='300'/%3E%3Cg fill='%23999'%3E%3Cpath d='M200 90c-33.137 0-60 26.863-60 60s26.863 60 60 60 60-26.863 60-60-26.863-60-60-60zm0 100c-22.091 0-40-17.909-40-40s17.909-40 40-40 40 17.909 40 40-17.909 40-40 40z'/%3E%3Cpath d='M170 130l20 30 20-25 30 45H140z'/%3E%3C/g%3E%3Ctext x='200' y='240' font-family='Arial' font-size='18' fill='%23999' text-anchor='middle'%3ENo Image Available%3C/text%3E%3C/svg%3E";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMedicines();
      setProducts(data || []);
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <img src={treeLogo} alt="Rushikulya Logo" className="brand-logo" />
          
        </div>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/order" onClick={() => setMenuOpen(false)}>Order</NavLink>
          <NavLink to="/seller" onClick={() => setMenuOpen(false)}>Seller</NavLink>
          <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin</NavLink>
        </nav>
        <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <div className="section">
        <Routes>
          <Route path="/" element={<Home loading={loading} items={products} />} />
          <Route path="/order" element={<Order loading={loading} items={products} />} />
          <Route path="/seller" element={<Seller />} />
          <Route path="/admin" element={<Admin onCreated={load} loading={loading} items={products} />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
        </Routes>
      </div>
      <div className="sticky-footer">
        <div className="muted">
          © {new Date().getFullYear()} Rushikulya: Goods and Services. All rights reserved.
        </div>
      </div>
    </div>
  );
}

function Home({ loading, items }) {
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cError, setCError] = useState("");
  const [cSuccess, setCSuccess] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const navigate = useNavigate();
  const featuredProducts = items.filter((m) => m.available).slice(0, 6);

  // Order popup state
  const [ordering, setOrdering] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ORDER_EMAIL = "drpatrospvtltd@gmail.com";

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitOrder(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!name || !phone || !location) {
      setError("All fields are required");
      return;
    }
    if (!/^\d{10}$/.test(String(phone))) {
      setError("Phone must be 10 digits");
      return;
    }
    setSubmitting(true);
    
    // Calculate total price
    const mrp = Number(ordering?.mrp ?? 0);
    const price = Number(ordering?.price ?? 0);
    const gstPercent = Number(ordering?.gst ?? 0);
    const deliveryCharge = Number(ordering?.deliveryCharge ?? 0);
    const gstAmount = (price * gstPercent) / 100;
    const totalPrice = price + gstAmount + deliveryCharge;
    
    const subject = `New Product Order from ${name}`;
    const bodyLines = [
      "A new product order request:",
      "",
      `Customer Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${location}`,
      "",
      "Product Details:",
      `- Name: ${ordering?.name || "N/A"}`,
      `- Description: ${ordering?.benefits || "N/A"}`,
      `- MRP: ₹${mrp.toFixed(2)}`,
      `- Price: ₹${price.toFixed(2)}`,
      `- GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}`,
      `- Delivery Charge: ₹${deliveryCharge.toFixed(2)}`,
      `- Total Price: ₹${totalPrice.toFixed(2)}`,
      `- Product ID: ${ordering?._id || "N/A"}`,
      "",
      "Please confirm availability and reply to the customer.",
    ];
    const body = bodyLines.join("\n");
    const mailtoUrl = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email app in the same tab for mobile compatibility
    window.location.href = mailtoUrl;

    setSubmitting(false);
    setInfo("Opening your email app. Please review the email and press Send to complete your order.");
    setName("");
    setPhone("");
    setLocation("");
    setOrdering(null);
  }

  return (
    <div className="admin-page">
      {/* Hero section */}
      <div
        className="hero hero-cover"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.82), rgba(15,23,42,0.6)), url(${mediImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          paddingTop: 0,
          marginTop: 0,
        }}
      >
        <div className="hero-inner hero-inner-cover">
          <div className="hero-content">
            <span className="pill pill-glow">✨ Welcome to Rushikulya</span>
            <div className="hero-title">
              Goods & Services Multimart
            </div>
            <div className="hero-subtitle">
              Offers a unified marketplace connecting buyers and sellers with trusted products, reliable services, fast delivery, and seamless community-driven commerce.
            </div>
            <div className="hero-actions">
              <button className="btn btn-success" onClick={() => navigate("/order")}>
                🛒 Search & Order
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => scrollToSection("about")}
              >
                📖 Read more
              </button>
            </div>
            <div className="hero-kpi-row">
              <div className="hero-kpi">
                <strong>🤝 Trusted Platform</strong>
                <span className="muted">Reliable goods and services.</span>
              </div>
              <div className="hero-kpi">
                <strong>✓ Quality You Trust</strong>
                <span className="muted">Verified goods and services.</span>
              </div>
              <div className="hero-kpi">
                <strong>🚚 Home delivery</strong>
                <span className="muted">within your locality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why generics / resources */}
      <div className="section" id="resources" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="card card-elevated" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="section-title">Why choose Rushikulya Marketplace?</div>
            <div className="feature-grid" style={{ marginTop: 12 }}>
              <div className="feature-card feature-card-hover">
                <div className="feature-icon">✅</div>
                <div className="feature-title">All-in-One Platform</div>
                <div className="muted">
                  Rushikulya integrates diverse goods and services in one platform, delivering seamless access, simplified choices, and fast, reliable purchasing experiences.
                </div>
              </div>
              <div className="feature-card feature-card-hover">
                <div className="feature-icon">🪙</div>
                <div className="feature-title">Opportunity for Every Seller</div>
                <div className="muted">
                  Individuals and businesses can easily list products or services, expand reach, and build sustainable revenue through an inclusive digital experience.
                </div>
              </div>
              <div className="feature-card feature-card-hover">
                <div className="feature-icon">💳</div>
                <div className="feature-title">Secure and Transparent Transactions</div>
                <div className="muted">
                  Rushikulya ensures safe payments, verified listings, and clear processes, creating trust and confidence for buyers and sellers at every stage.
                </div>
              </div>
              <div className="feature-card feature-card-hover">
                <div className="feature-icon">🤝</div>
                <div className="feature-title">Local Growth, Wider Reach</div>
                <div className="muted">
                  The platform supports community-based commerce while enabling sellers to connect with larger audiences, strengthening both local markets and online visibility.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About & services section */}
      <div className="section" id="about" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="card card-elevated about-cover" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="row about-content" style={{ alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div className="about-section" style={{ flex: 1, minWidth: "min(100%, 260px)" }}>
                <div className="title">About Rushikulya Platform</div>
                <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  A comprehensive goods-and-services marketplace that enables customers to purchase essential products and professional services in one unified platform. It also empowers users to sell their own products and services, providing an accessible, scalable environment for commerce, growth, and community-based economic opportunities.
                </div>
              </div>
              <div className="about-section" style={{ flex: 1, minWidth: "min(100%, 260px)" }}>
                <div className="title">What we offer?</div>
                <div className="stack" style={{ marginTop: 8 }}>
                  <span className="pill pill-service">🚚 Goods</span>
                  <span className="pill pill-service">📋 Services</span>
                  <span className="pill pill-service">♻️ Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="card card-elevated" style={{ borderRadius: 0 }}>
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div className="section-title">⭐ Popular Products</div>
                <button className="btn btn-primary" onClick={() => navigate("/order")}>
                  Browse all products →
                </button>
              </div>
              {loading ? (
                <div className="muted" style={{ marginTop: 12 }}>
                  Loading products...
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <MedicineList
                    items={featuredProducts}
                    mode="user"
                    onOrder={setOrdering}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="section" id="contact" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="card card-elevated" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="title">Get in touch</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Have a question about goods and services availability, price? Send us a
              message.
            </div>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                setCError("");
                setCSuccess("");
                
                // Validate all fields are filled
                if (!cName.trim() || !cEmail.trim() || !cPhone.trim() || !cMessage.trim()) {
                  setCError("All fields are required");
                  return;
                }
                
                // Validate Gmail format
                const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
                if (!gmailRegex.test(cEmail.trim())) {
                  setCError("Please enter a valid Gmail address (e.g., yourname@gmail.com)");
                  return;
                }
                
                // Validate phone number (10 digits)
                if (!/^\d{10}$/.test(String(cPhone.trim()))) {
                  setCError("Phone number must be 10 digits");
                  return;
                }
                
                setCSubmitting(true);
                
                // Prepare email content
                const subject = `Contact Form Message from ${cName.trim()}`;
                const body = `
Hello,

You have received a new message from the Get in Touch form:

--- CONTACT INFORMATION ---
Name: ${cName.trim()}
Email: ${cEmail.trim()}
Phone: ${cPhone.trim()}

--- MESSAGE ---
${cMessage.trim()}

---
Sent from Rushikulya Contact Form
                `.trim();
                
                // Send via mailto
                const mailtoUrl = `mailto:drpatrospvtltd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoUrl;
                
                // Clear form and show success message
                setTimeout(() => {
                  setCSubmitting(false);
                  setCName("");
                  setCEmail("");
                  setCPhone("");
                  setCMessage("");
                  setCSuccess("Your message has been prepared for sending. Please check your email client.");
                  setTimeout(() => setCSuccess(""), 4000);
                }, 500);
              }}
              style={{ marginTop: 8 }}
            >
              <input
                className="input"
                placeholder="Your name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Your Gmail (e.g., yourname@gmail.com)"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                required
              />
              <input
                className="input"
                type="tel"
                placeholder="Your phone number (10 digits)"
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                required
              />
              <textarea
                className="textarea"
                placeholder="How can we help you?"
                rows={4}
                value={cMessage}
                onChange={(e) => setCMessage(e.target.value)}
                required
              />
              <div className="row">
                <button className="btn btn-primary" type="submit" disabled={cSubmitting}>
                  {cSubmitting ? "Sending..." : "Send message"}
                </button>
              </div>
              {cError && <div className="alert alert-error"><span className="alert-icon">⚠️</span> {cError}</div>}
              {cSuccess && <div className="alert alert-success"><span className="alert-icon">✓</span> {cSuccess}</div>}
            </form>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="card card-elevated" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="title">📞 Contact Information</div>
            <div className="muted" style={{ marginTop: 6, marginBottom: 20 }}>
              Reach out to us directly through any of the following channels.
            </div>
            <div className="contact-info-grid">
              <div className="contact-info-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <div className="contact-label">Email</div>
                  <a href="mailto:drpatrospvtltd@gmail.com" className="contact-value">drpatrospvtltd@gmail.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon">📱</div>
                <div className="contact-details">
                  <div className="contact-label">Phone</div>
                  <a href="tel:+919876543210" className="contact-value">+91 73308 97373</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon">🕐</div>
                <div className="contact-details">
                  <div className="contact-label">Service Hours</div>
                  <div className="contact-value">Mon - Sat: 9:30 AM - 5:30 PM</div>
                  <div className="contact-value-sub"></div>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <div className="contact-label">Address</div>
                  <div className="contact-value">Rushikulya: Goods & Services</div>
                  <div className="contact-value-sub">Address: Telangana, Hyderabad, Cherukuthota Colony</div>
                  <div className="contact-value-sub">Saroornagar - 500035</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map / location */}
      <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="card card-elevated" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="title">📍 Visit our store</div>
            <div className="muted" style={{ marginTop: 6 }}>
              We&apos;re conveniently located and happy to guide you in person. Click the map to open in Google Maps.
            </div>
            <div 
              className="map-container" 
              style={{ marginTop: 8, borderRadius: 16, overflow: "hidden", cursor: "pointer", position: "relative" }}
              onClick={() => {
                const address = "11-6-414, Rd Number 3, near Narayana collage boys AIEE, Saroornagar, Cherukuthota Colony, Kothapet, Hyderabad, Telangana 500035";
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                window.open(googleMapsUrl, "_blank");
              }}
            >
              <iframe
                title="map"
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=11-6-414,Rd+Number+3,near+Narayana+collage+boys+AIEE,Saroornagar,Cherukuthota+Colony,Kothapet,Hyderabad,Telangana+500035&zoom=17"
                width="100%"
                height="240"
                style={{ border: 0, display: "block", pointerEvents: "none" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="section footer" style={{ marginTop: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="card" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <div className="footer-grid" style={{ marginBottom: 8 }}>
              <div>
                <div className="title">Rushikulya Marketplace</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  A platform to buy and sell goods and services.
                </div>
              </div>
              <div>
                <div className="footer-title">Quick links</div>
                <div className="link-list">
                  <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Home</a>
                  <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}>About</a>
                  {/* <a href="#resources" onClick={(e) => { e.preventDefault(); scrollToSection("resources"); }}>Generics</a> */}
                  <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>Contact</a>
                </div>
              </div>
              <div>
                <div className="footer-title">Stay connected</div>
                <div className="newsletter">
                  <div className="newsletter-row">
                    <input 
                      className="input" 
                      type="email"
                      placeholder="Your email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        if (!newsletterEmail.trim()) {
                          alert("Please enter your email address");
                          return;
                        }
                        
                        // Validate email format
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        if (!emailRegex.test(newsletterEmail.trim())) {
                          alert("Please enter a valid email address");
                          return;
                        }
                        
                        // Prepare email content
                        const subject = "New Newsletter Subscription";
                        const body = `
Hello,

You have a new newsletter subscription:

--- SUBSCRIBER INFORMATION ---
Email: ${newsletterEmail.trim()}

---
Sent from Rushikulya Newsletter Subscription
                        `.trim();
                        
                        // Send via mailto
                        const mailtoUrl = `mailto:drpatrospvtltd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailtoUrl;
                        
                        // Clear input
                        setTimeout(() => {
                          setNewsletterEmail("");
                        }, 500);
                      }}
                    >
                      Subscribe
                    </button>
                  </div>
                  <div className="social-row">
                    <a href="https://www.facebook.com/rushikulya" target="_blank" rel="noopener noreferrer" className="social-pill" style={{ textDecoration: 'none' }}>f</a>
                    <span className="social-pill">x</span>
                    <span className="social-pill">in</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="row footer-bottom"
              style={{ justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}
            >
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="pill">Privacy Policy</span>
                <span className="pill">Refund Policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Popup */}
      {ordering ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 520, width: "100%", margin: "auto" }}>
            <div className="card-body">
              <div className="title">Order {ordering.name}</div>
              <div className="muted" style={{ margin: "8px 0" }}>{ordering.benefits}</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                <strong>Expiry:</strong> {ordering.expiry || "NA"}
              </div>
              
              {/* Price Breakdown */}
              <div style={{ background: "var(--surface)", padding: "12px", borderRadius: "8px", marginTop: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>MRP:</span>
                  <span>₹{Number(ordering.mrp || ordering.price || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Price:</span>
                  <span>₹{Number(ordering.price || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>GST ({Number(ordering.gst || 0).toFixed(2)}%):</span>
                  <span>₹{((Number(ordering.price || 0) * Number(ordering.gst || 0)) / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Delivery Charge:</span>
                  <span>₹{Number(ordering.deliveryCharge || 0).toFixed(2)}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "18px" }}>
                  <span>Total:</span>
                  <span>₹{(Number(ordering.price || 0) + ((Number(ordering.price || 0) * Number(ordering.gst || 0)) / 100) + Number(ordering.deliveryCharge || 0)).toFixed(2)}</span>
                </div>
              </div>
              
              <form onSubmit={submitOrder} className="form" style={{ marginTop: 12 }}>
                <input className="input" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="input" placeholder="10 digit phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <input className="input" placeholder="Your Address" value={location} onChange={(e) => setLocation(e.target.value)} required />
                <input 
                  className="input" 
                  placeholder="Pincode (6 digits)" 
                  value={pincode} 
                  onChange={(e) => setPincode(e.target.value)} 
                  maxLength={6}
                  pattern="\d{6}"
                  required 
                />
                <input 
                  className="input" 
                  placeholder="Quantity (Optional)" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  type="number"
                  min="1"
                  step="1"
                />
                <div className="row">
                  <button className="btn btn-success" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Place Order"}</button>
                  <button className="btn-outline btn" type="button" onClick={() => setOrdering(null)}>Cancel</button>
                </div>
                {error ? <div className="alert alert-error"><span className="alert-icon">⚠️</span> {error}</div> : null}
                {info ? <div className="alert alert-success"><span className="alert-icon">✓</span> {info}</div> : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Order({ loading, items }) {
  const [activeTab, setActiveTab] = useState("medicines");
  const [medicines, setMedicines] = useState(items || []);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Order states
  const [ordering, setOrdering] = useState(null);
  const [orderType, setOrderType] = useState(null); // 'medicine', 'product', 'service'
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Search
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  
  const ORDER_EMAIL = "drpatrospvtltd@gmail.com";

  useEffect(() => {
    setMedicines(items || []);
  }, [items]);

  useEffect(() => {
    loadProductsAndServices();
  }, []);

  // Handle shared link URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');

    if (type && id) {
      // Set active tab based on type
      if (type === 'medicine') {
        setActiveTab('medicines');
      } else if (type === 'product') {
        setActiveTab('products');
      } else if (type === 'service') {
        setActiveTab('services');
      }

      // Wait for data to load, then find and show preview
      setTimeout(() => {
        let item = null;
        if (type === 'medicine') {
          item = medicines.find(m => m._id === id);
        } else if (type === 'product') {
          item = products.find(p => p._id === id);
        } else if (type === 'service') {
          item = services.find(s => s._id === id);
        }

        if (item) {
          // Show preview card instead of order form
          setPreviewItem(item);
          setPreviewType(type);
          
          // Scroll to top to show the preview
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 1000); // Wait for data to load
    }
  }, [medicines, products, services]);

  async function loadProductsAndServices() {
    setLoadingData(true);
    try {
      const [productsData, servicesData] = await Promise.all([
        fetchProducts(),
        fetchServices()
      ]);
      setProducts(productsData);
      setServices(servicesData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoadingData(false);
    }
  }

  function handleOrder(item, type) {
    setOrdering(item);
    setOrderType(type);
  }

  function handleShare(item, type) {
    const baseUrl = window.location.origin;
    let shareUrl = "";

    if (type === "product") {
      shareUrl = `${baseUrl}/order?type=product&id=${item._id}`;
    } else if (type === "service") {
      shareUrl = `${baseUrl}/order?type=service&id=${item._id}`;
    } else if (type === "medicine") {
      shareUrl = `${baseUrl}/order?type=medicine&id=${item._id}`;
    }

    // Copy link to clipboard directly
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        alert("Failed to copy link");
      });
  }

  function submitOrder(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    
    if (!name || !phone || !location || !pincode) {
      setError("All fields are required");
      return;
    }
    
    if (!/^\d{10}$/.test(String(phone))) {
      setError("Phone must be 10 digits");
      return;
    }
    
    if (!/^\d{6}$/.test(String(pincode))) {
      setError("Pincode must be 6 digits");
      return;
    }
    
    setSubmitting(true);
    
    let subject, body;
    
    if (orderType === "medicine") {
      const mrp = Number(ordering?.mrp ?? 0);
      const price = Number(ordering?.price ?? 0);
      const gstPercent = Number(ordering?.gst ?? 0);
      const deliveryCharge = Number(ordering?.deliveryCharge ?? 0);
      const gstAmount = (price * gstPercent) / 100;
      const totalPrice = price + gstAmount + deliveryCharge;
      
      subject = `Product Order - ${ordering.name}`;
      body = `
New Product Order Request:

--- CUSTOMER DETAILS ---
Name: ${name}
Phone: ${phone}
Address: ${location}
Pincode: ${pincode}
${quantity ? `Quantity: ${quantity}` : ''}

--- PRODUCT DETAILS ---
Product Name: ${ordering.name}
Description: ${ordering.benefits}
Expiry: ${ordering.expiry || 'NA'}
MRP: ₹${mrp.toFixed(2)}
Price: ₹${price.toFixed(2)}
GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}
Delivery Charge: ₹${deliveryCharge.toFixed(2)}
Total Price: ₹${totalPrice.toFixed(2)}

Please confirm availability and reply to the customer.
      `.trim();
    } else if (orderType === "product") {
      subject = `Product Inquiry - ${ordering.productName}`;
      body = `
Product Inquiry Request:

--- CUSTOMER DETAILS ---
Name: ${name}
Phone: ${phone}
Address: ${location}
Pincode: ${pincode}

--- PRODUCT DETAILS ---
Product Name: ${ordering.productName}
Details: ${ordering.details || 'N/A'}
Code: ${ordering.code || 'N/A'}
Seller: ${ordering.firstName} ${ordering.lastName}

Please connect the customer with the seller.
      `.trim();
    } else if (orderType === "service") {
      subject = `Service Request - ${ordering.serviceName}`;
      body = `
Service Request:

--- CUSTOMER DETAILS ---
Name: ${name}
Phone: ${phone}
Address: ${location}
Pincode: ${pincode}

--- SERVICE DETAILS ---
Service Name: ${ordering.serviceName}
Description: ${ordering.description || 'N/A'}
Code: ${ordering.code || 'N/A'}
Provider: ${ordering.firstName} ${ordering.lastName}
Price: ${ordering.price}

Please connect the customer with the service provider.
      `.trim();
    }
    
    const mailtoUrl = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    
    setSubmitting(false);
    setInfo("Opening your email app. Please review and send the email to complete your request.");
    setName("");
    setPhone("");
    setLocation("");
    setPincode("");
    setQuantity("");
    setTimeout(() => {
      setOrdering(null);
      setOrderType(null);
    }, 2000);
  }

  // Filter data based on search term
  const filteredMedicines = term 
    ? medicines.filter(m => m.name.toLowerCase().includes(term.toLowerCase()))
    : medicines;
  
  const filteredProducts = term
    ? products.filter(p => p.productName.toLowerCase().includes(term.toLowerCase()))
    : products;
  
  const filteredServices = term
    ? services.filter(s => s.serviceName.toLowerCase().includes(term.toLowerCase()))
    : services;

  const currentData = activeTab === "medicines" ? filteredMedicines 
    : activeTab === "products" ? filteredProducts 
    : filteredServices;

  return (
    <div className="order-page">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div className="section-title" style={{ margin: 0 }}>
          {activeTab === "medicines" ? "Latest Products" : activeTab === "products" ? "Browse Products" : "Browse Services"}
        </div>
        <div className="row" style={{ flexWrap: "wrap", flex: "1", minWidth: "min(100%, 300px)", justifyContent: "flex-end" }}>
          <input 
            className="input" 
            placeholder={activeTab === "medicines" ? "Search latest products" : `Search ${activeTab}`}
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyPress={(e) => { if (e.key === "Enter") setTerm(query); }} 
            style={{ minWidth: "200px", flex: "1" }} 
          />
          <button className="btn" onClick={() => setTerm(query)}>Search</button>
          <button className="btn-outline btn" onClick={() => { setQuery(""); setTerm(""); }}>Clear</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="row" style={{ gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button 
          className={activeTab === "medicines" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("medicines")}
        >
          Latest Products ({medicines.length})
        </button>
        <button 
          className={activeTab === "products" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("products")}
        >
          Products ({products.length})
        </button>
        <button 
          className={activeTab === "services" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("services")}
        >
          Services ({services.length})
        </button>
      </div>

      {/* Content */}
      {(loading || loadingData) ? (
        <div className="muted">Loading...</div>
      ) : currentData.length === 0 ? (
        <div className="muted">No {activeTab === "medicines" ? "latest products" : activeTab} found</div>
      ) : (
        <div>
          {activeTab === "medicines" && (
            <MedicineList items={filteredMedicines} mode="user" onOrder={(item) => handleOrder(item, "medicine")} onShare={(item) => handleShare(item, "medicine")} />
          )}

          {activeTab === "products" && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {filteredProducts.map((product) => (
                <div key={product._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  {product.imageUrl && product.imageUrl.trim() !== "" ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.productName}
                      onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                      style={{ width: "100%", height: 280, objectFit: "cover" }}
                    />
                  ) : (
                    <img 
                      src={noImage} 
                      alt="No image available"
                      onError={(e) => { e.target.src = noImageFallback; }}
                      style={{ width: "100%", height: 280, objectFit: "contain", background: "var(--surface)" }}
                    />
                  )}
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {product.productName}
                    </div>
                    {product.details && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.5 }}>
                        {product.details}
                      </div>
                    )}
                    {product.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                        <strong>🏷️ Code:</strong> {product.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{product.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>👤 Seller:</strong> {product.firstName} {product.lastName}
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleOrder(product, "product")}
                        style={{ flex: 1 }}
                      >
                        Contact Seller
                      </button>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => handleShare(product, "product")}
                        style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                        title="Share this product"
                      >
                        <span className="share-text">Share</span> 📤
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "services" && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {filteredServices.map((service) => (
                <div key={service._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {service.serviceName}
                    </div>
                    {service.description && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.5 }}>
                        {service.description}
                      </div>
                    )}
                    {service.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                        <strong>🏷️ Code:</strong> {service.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Provider:</strong> {service.firstName} {service.lastName}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{service.price}
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleOrder(service, "service")}
                        style={{ flex: 1 }}
                      >
                        Contact Provider
                      </button>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => handleShare(service, "service")}
                        style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                        title="Share this service"
                      >
                        <span className="share-text">Share</span> 📤
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order/Contact Popup */}
      {ordering && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto", zIndex: 2000 }}>
          <div className="card" style={{ maxWidth: 520, width: "100%", margin: "auto" }}>
            <div className="card-body">
              <div className="title">
                {orderType === "medicine" ? `Order ${ordering.name}` 
                  : orderType === "product" ? `Contact Seller - ${ordering.productName}` 
                  : `Contact Provider - ${ordering.serviceName}`}
              </div>
              
              {orderType === "medicine" && (
                <div>
                  <div className="muted" style={{ margin: "8px 0" }}>{ordering.benefits}</div>
                  <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                    <strong>Expiry:</strong> {ordering.expiry || "NA"}
                  </div>
                  
                  <div style={{ background: "var(--surface)", padding: "12px", borderRadius: "8px", marginTop: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>MRP:</span>
                      <span>₹{Number(ordering.mrp || ordering.price || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Price:</span>
                      <span>₹{Number(ordering.price || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>GST ({Number(ordering.gst || 0).toFixed(2)}%):</span>
                      <span>₹{((Number(ordering.price || 0) * Number(ordering.gst || 0)) / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Delivery Charge:</span>
                      <span>₹{Number(ordering.deliveryCharge || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "18px" }}>
                      <span>Total:</span>
                      <span>₹{(Number(ordering.price || 0) + ((Number(ordering.price || 0) * Number(ordering.gst || 0)) / 100) + Number(ordering.deliveryCharge || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {orderType === "product" && (
                <div className="muted" style={{ margin: "12px 0", fontSize: 14 }}>
                  {ordering.details}
                </div>
              )}
              
              {orderType === "service" && (
                <div className="muted" style={{ margin: "12px 0", fontSize: 14 }}>
                  {ordering.description}
                </div>
              )}
              
              <form onSubmit={submitOrder} className="form" style={{ marginTop: 12 }}>
                <input className="input" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="input" placeholder="10 digit phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <input className="input" placeholder="Your Address" value={location} onChange={(e) => setLocation(e.target.value)} required />
                <input 
                  className="input" 
                  placeholder="Pincode (6 digits)" 
                  value={pincode} 
                  onChange={(e) => setPincode(e.target.value)} 
                  maxLength={6}
                  pattern="\d{6}"
                  required 
                />
                {orderType === "medicine" && (
                  <input 
                    className="input" 
                    placeholder="Quantity (Optional)" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    type="number"
                    min="1"
                    step="1"
                  />
                )}
                <div className="row">
                  <button className="btn btn-success" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : orderType === "medicine" ? "Place Order" : "Send Request"}
                  </button>
                  <button className="btn-outline btn" type="button" onClick={() => { setOrdering(null); setOrderType(null); }}>Cancel</button>
                </div>
                {error ? <div className="alert alert-error"><span className="alert-icon">⚠️</span> {error}</div> : null}
                {info ? <div className="alert alert-success"><span className="alert-icon">✓</span> {info}</div> : null}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Card for Shared Links */}
      {previewItem && (
        <div 
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto", zIndex: 2000 }}
          onClick={() => { setPreviewItem(null); setPreviewType(null); }}
        >
          <div className="card" style={{ maxWidth: 600, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
                <div className="title" style={{ margin: 0, flex: 1, paddingRight: 8 }}>
                  {previewType === "product" ? previewItem.productName : previewType === "service" ? previewItem.serviceName : previewItem.name}
                </div>
                <button 
                  className="popup-close" 
                  type="button" 
                  aria-label="Close" 
                  onClick={() => { setPreviewItem(null); setPreviewType(null); }}
                  style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)", flexShrink: 0 }}
                >
                  ×
                </button>
              </div>

              {/* Product Preview */}
              {previewType === "product" && (
                <div>
                  {previewItem.imageUrl && previewItem.imageUrl !== "/uploads/no-image.png" && (
                    <img 
                      src={previewItem.imageUrl} 
                      alt={previewItem.productName}
                      style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8, marginBottom: 16 }}
                    />
                  )}
                  <div style={{ marginBottom: 16 }}>
                    {previewItem.details && (
                      <div className="muted" style={{ marginBottom: 12, fontSize: 15, lineHeight: 1.6 }}>
                        {previewItem.details}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Price</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: "var(--primary)" }}>₹{previewItem.price}</div>
                      </div>
                      <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Code</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{previewItem.code}</div>
                      </div>
                    </div>
                    <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 13 }}>
                        <strong>👤 Seller:</strong> {previewItem.firstName} {previewItem.lastName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Preview */}
              {previewType === "service" && (
                <div>
                  {previewItem.description && (
                    <div className="muted" style={{ marginBottom: 12, fontSize: 15, lineHeight: 1.6 }}>
                      {previewItem.description}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Price</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: "var(--primary)" }}>₹{previewItem.price}</div>
                    </div>
                    <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Code</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{previewItem.code}</div>
                    </div>
                  </div>
                  <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 13 }}>
                      <strong>👤 Provider:</strong> {previewItem.firstName} {previewItem.lastName}
                    </div>
                  </div>
                </div>
              )}

              {/* Medicine Preview */}
              {previewType === "medicine" && (
                <div>
                  {previewItem.imageUrl && (
                    <img 
                      src={previewItem.imageUrl} 
                      alt={previewItem.name}
                      style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8, marginBottom: 16 }}
                    />
                  )}
                  
                  {/* Description and Expiry Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    {previewItem.benefits && (
                      <div className="muted" style={{ flex: 1, fontSize: 15, lineHeight: 1.6 }}>
                        {previewItem.benefits}
                      </div>
                    )}
                    {previewItem.expiry && (
                      <div style={{ flexShrink: 0, padding: 8, background: "var(--surface)", borderRadius: 8, whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 13 }}>
                          <strong>📅 Expiry:</strong> {previewItem.expiry}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Pricing Breakdown */}
                  <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                      <span>MRP:</span>
                      <span style={{ fontWeight: 600 }}>₹{(previewItem.mrp || previewItem.price)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                      <span>Price:</span>
                      <span style={{ fontWeight: 600 }}>₹{previewItem.price}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                      <span>GST ({Number(previewItem.gst || 0).toFixed(2)}%):</span>
                      <span style={{ fontWeight: 600 }}>₹{((previewItem.price * Number(previewItem.gst || 0)) / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                      <span>Delivery:</span>
                      <span style={{ fontWeight: 600 }}>₹{Number(previewItem.deliveryCharge || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: "2px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                      <span style={{ fontWeight: 700 }}>Total:</span>
                      <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 18 }}>₹{(Number(previewItem.price) + ((previewItem.price * Number(previewItem.gst || 0)) / 100) + Number(previewItem.deliveryCharge || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  {previewItem.company && (
                    <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 13 }}>
                        <strong>🏢 Company:</strong> {previewItem.company}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="row" style={{ marginTop: 20, gap: 8 }}>
                <button 
                  className="btn btn-success" 
                  onClick={() => {
                    handleOrder(previewItem, previewType);
                    setPreviewItem(null);
                    setPreviewType(null);
                  }}
                  style={{ flex: 1, fontSize: 16, padding: "12px" }}
                >
                  {previewType === "medicine" ? "📦 Order Now" : "📞 Contact " + (previewType === "product" ? "Seller" : "Provider")}
                </button>
                <button 
                  className="btn-outline btn" 
                  onClick={() => { setPreviewItem(null); setPreviewType(null); }}
                  style={{ padding: "12px 20px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Admin({ onCreated, loading, items }) {
  const [authed, setAuthed] = useState(!!localStorage.getItem("auth"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [popup, setPopup] = useState(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Seller management state
  const [sellers, setSellers] = useState([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [confirmDeleteSeller, setConfirmDeleteSeller] = useState(null);
  
  // Seller items state
  const [sellerServices, setSellerServices] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerItemsLoading, setSellerItemsLoading] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteService, setConfirmDeleteService] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  
  // Search state
  const [searchServiceTerm, setSearchServiceTerm] = useState("");
  const [searchProductTerm, setSearchProductTerm] = useState("");
  
  // Pagination state
  const [currentPageService, setCurrentPageService] = useState(1);
  const [currentPageProduct, setCurrentPageProduct] = useState(1);
  const itemsPerPage = 10;
  
  // Filtered data
  const filteredSellerServices = useMemo(() => {
    if (!searchServiceTerm) return sellerServices;
    return sellerServices.filter(service => 
      (service.serviceName && service.serviceName.toLowerCase().includes(searchServiceTerm)) ||
      (service.code && service.code.toLowerCase().includes(searchServiceTerm))
    );
  }, [sellerServices, searchServiceTerm]);
  
  const filteredSellerProducts = useMemo(() => {
    if (!searchProductTerm) return sellerProducts;
    return sellerProducts.filter(product => 
      (product.productName && product.productName.toLowerCase().includes(searchProductTerm)) ||
      (product.code && product.code.toLowerCase().includes(searchProductTerm))
    );
  }, [sellerProducts, searchProductTerm]);
  
  // Paginated data
  const paginatedSellerServices = useMemo(() => {
    const startIndex = (currentPageService - 1) * itemsPerPage;
    return filteredSellerServices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSellerServices, currentPageService]);
  
  const paginatedSellerProducts = useMemo(() => {
    const startIndex = (currentPageProduct - 1) * itemsPerPage;
    return filteredSellerProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSellerProducts, currentPageProduct]);
  
  // Total pages
  const totalPagesService = Math.ceil(filteredSellerServices.length / itemsPerPage);
  const totalPagesProduct = Math.ceil(filteredSellerProducts.length / itemsPerPage);
  
  // View state
  const [currentView, setCurrentView] = useState("medicines"); // "medicines", "sellers", or "seller-items"

  async function login(e) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Username and password required");
      return;
    }
    const token = `Basic ${btoa(`${username}:${password}`)}`;
    try {
      await verifyAdmin(token);
      localStorage.setItem("auth", token);
      setPopup({ type: "success", message: "Login successful!" });
      setTimeout(() => setAuthed(true), 500);
    } catch (err) {
      setPopup({ type: "error", message: "You are not an admin, only admin can access this." });
      setError("Invalid credentials");
    }
  }

  function logout() {
    localStorage.removeItem("auth");
    setAuthed(false);
    navigate("/");
  }

  function confirmLogout() {
    setConfirmLogoutOpen(true);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    try {
      await deleteMedicine(confirmDelete._id);
      setConfirmDelete(null);
      if (onCreated) onCreated();
      setPopup({ type: "success", message: `${confirmDelete.name} deleted.` });
    } catch (err) {
      console.error(err);
      setPopup({ type: "error", message: "Failed to delete medicine. Please try again." });
    }
  }

  // Seller management functions
  async function loadSellers() {
    setSellerLoading(true);
    try {
      // Get credentials from state or localStorage
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        // Extract username and password from Basic auth token
        const base64Credentials = storedAuth.split(" ")[1];
        const credentials = atob(base64Credentials);
        const [authUsername, authPassword] = credentials.split(":");
        const data = await fetchSellers(authUsername, authPassword);
        setSellers(data);
      }
    } catch (err) {
      console.error("Error loading sellers:", err);
      setPopup({ type: "error", message: "Failed to load sellers. Please try again." });
    } finally {
      setSellerLoading(false);
    }
  }

  useEffect(() => {
    if (authed) {
      loadSellers();
    }
  }, [authed]);

  async function handleUpdateSeller(e) {
    e.preventDefault();
    if (!editingSeller) return;
    
    // Get credentials from localStorage
    const storedAuth = localStorage.getItem("auth");
    if (!storedAuth) {
      setPopup({ type: "error", message: "Authentication required." });
      return;
    }
    
    // Extract username and password from Basic auth token
    const base64Credentials = storedAuth.split(" ")[1];
    const credentials = atob(base64Credentials);
    const [authUsername, authPassword] = credentials.split(":");
    
    const formData = new FormData(e.target);
    const sellerData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone")
    };
    
    try {
      const response = await updateSeller(editingSeller._id, sellerData, authUsername, authPassword);
      setEditingSeller(null);
      loadSellers();
      setPopup({ type: "success", message: `Seller ${response.seller.firstName} ${response.seller.lastName} updated successfully.` });
    } catch (err) {
      console.error("Error updating seller:", err);
      setPopup({ type: "error", message: err.message || "Failed to update seller. Please try again." });
    }
  }

  async function handleConfirmDeleteSeller() {
    if (!confirmDeleteSeller) return;
    
    // Get credentials from localStorage
    const storedAuth = localStorage.getItem("auth");
    if (!storedAuth) {
      setPopup({ type: "error", message: "Authentication required." });
      return;
    }
    
    // Extract username and password from Basic auth token
    const base64Credentials = storedAuth.split(" ")[1];
    const credentials = atob(base64Credentials);
    const [authUsername, authPassword] = credentials.split(":");
    
    try {
      const response = await deleteSeller(confirmDeleteSeller._id, authUsername, authPassword);
      setConfirmDeleteSeller(null);
      loadSellers();
      
      // Show detailed success message with counts
      const servicesDeleted = response.deletedServices || 0;
      const productsDeleted = response.deletedProducts || 0;
      const totalDeleted = servicesDeleted + productsDeleted;
      
      let message = `Seller ${confirmDeleteSeller.firstName} ${confirmDeleteSeller.lastName} deleted successfully.`;
      if (totalDeleted > 0) {
        const details = [];
        if (servicesDeleted > 0) details.push(`${servicesDeleted} service${servicesDeleted > 1 ? 's' : ''}`);
        if (productsDeleted > 0) details.push(`${productsDeleted} product${productsDeleted > 1 ? 's' : ''}`);
        message += ` Also removed ${details.join(' and ')}.`;
      }
      
      setPopup({ type: "success", message });
    } catch (err) {
      console.error("Error deleting seller:", err);
      setPopup({ type: "error", message: err.message || "Failed to delete seller. Please try again." });
    }
  }

  // Handle service update
  async function handleUpdateService(e) {
    e.preventDefault();
    if (!editingService) return;
    
    const formData = new FormData(e.target);
    const serviceData = {
      serviceName: formData.get("serviceName"),      price: Number(formData.get("price")),      location: formData.get("location"),      pincode: formData.get("pincode")
    };
    
    try {
      const response = await updateService(editingService._id, serviceData);
      setEditingService(null);
      loadSellerItems();
      setPopup({ type: "success", message: `Service ${response.service.serviceName} updated successfully.` });
    } catch (err) {
      console.error("Error updating service:", err);
      setPopup({ type: "error", message: err.message || "Failed to update service. Please try again." });
    }
  }

  // Handle product update
  async function handleUpdateProduct(e) {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.target);
    const productData = {
      productName: formData.get("productName"),
      price: Number(formData.get("price")),
      location: formData.get("location"),
      pincode: formData.get("pincode"),
      imageUrl: editingProduct.imageUrl
    };
    
    try {
      const response = await updateProduct(editingProduct._id, productData);
      setEditingProduct(null);
      loadSellerItems();
      setPopup({ type: "success", message: `Product ${response.product.productName} updated successfully.` });
    } catch (err) {
      console.error("Error updating product:", err);
      setPopup({ type: "error", message: err.message || "Failed to update product. Please try again." });
    }
  }

  // Handle service delete confirmation
  async function handleConfirmDeleteService() {
    if (!confirmDeleteService) return;
    
    try {
      await deleteService(confirmDeleteService._id);
      setConfirmDeleteService(null);
      loadSellerItems();
      setPopup({ type: "success", message: `Service ${confirmDeleteService.serviceName} deleted.` });
    } catch (err) {
      console.error("Error deleting service:", err);
      setPopup({ type: "error", message: err.message || "Failed to delete service. Please try again." });
    }
  }

  // Handle product delete confirmation
  async function handleConfirmDeleteProduct() {
    if (!confirmDeleteProduct) return;
    
    try {
      await deleteProduct(confirmDeleteProduct._id);
      setConfirmDeleteProduct(null);
      loadSellerItems();
      setPopup({ type: "success", message: `Product ${confirmDeleteProduct.productName} deleted.` });
    } catch (err) {
      console.error("Error deleting product:", err);
      setPopup({ type: "error", message: err.message || "Failed to delete product. Please try again." });
    }
  }

  // Load all seller items (services and products)
  async function loadSellerItems() {
    setSellerItemsLoading(true);
    setCurrentPageService(1); // Reset to first page
    setCurrentPageProduct(1); // Reset to first page
    try {
      // Fetch services and products using existing API functions
      const [services, products] = await Promise.all([
        fetchServices(),
        fetchProducts()
      ]);
      
      setSellerServices(services);
      setSellerProducts(products);
    } catch (err) {
      console.error("Error loading seller items:", err);
      setPopup({ type: "error", message: "Failed to load seller items. Please try again." });
    } finally {
      setSellerItemsLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="login">
        <div className="card">
          <div className="card-body">
            <div className="title">Admin Login</div>
            <form onSubmit={login} className="form">
              <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="row">
                <button className="btn btn-success" type="submit">Login</button>
                {error ? <div className="muted">{error}</div> : null}
              </div>
            </form>
          </div>
        </div>
        {popup && (
          <div className={`popup ${popup.type}`}>
            <div className="popup-content">
              <div className="popup-message">{popup.message}</div>
              <button className="popup-close" onClick={() => setPopup(null)}>×</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div className="title">Admin Panel</div>
        <div className="row" style={{ gap: "12px" }}>
          <button 
            className={`btn-outline btn ${currentView === "sellers" ? "btn-primary" : ""}`}
            onClick={() => {
              setCurrentView("sellers");
              loadSellers();
            }}
          >
            Manage Sellers
          </button>
          <button 
            className={`btn-outline btn ${currentView === "seller-items" ? "btn-primary" : ""}`}
            onClick={() => {
              setCurrentView("seller-items");
              loadSellerItems();
            }}
          >
            Seller Goods & Services
          </button>
          <button 
            className={`btn-outline btn ${currentView === "medicines" ? "btn-primary" : ""}`}
            onClick={() => setCurrentView("medicines")}
          >
            Our Products
          </button>
          <button 
            className="btn-outline btn"
            onClick={() => navigate("/admin/approvals")}
          >
            Manage Approvals
          </button>
          <button className="btn-outline btn" onClick={confirmLogout}>Logout</button>
        </div>
      </div>
      
      {currentView === "medicines" ? (
        // Product Management View
        <>
          <div className="section centered">
            <div className="card">
              <div className="card-body">
                <div className="title">Add a Product</div>
                <MedicineForm onCreated={onCreated} />
              </div>
            </div>
          </div>
          {editing ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
              onClick={() => setEditing(null)}
            >
              <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="title">Edit Product</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setEditing(null)} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}>×</button>
                  </div>
                  <MedicineForm initial={editing} onUpdated={() => { setEditing(null); onCreated(); }} />
                </div>
              </div>
            </div>
          ) : null}
          {confirmDelete ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
              onClick={() => setConfirmDelete(null)}
            >
              <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ padding: 24 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="title">Delete Product</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDelete(null)}>×</button>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-danger" type="button" onClick={handleConfirmDelete}>Delete</button>
                    <button className="btn-outline btn" type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="section">
            <div className="section-title">Your Products</div>
            {loading ? (
              <div className="muted">Loading...</div>
            ) : (
              <MedicineList
                items={items}
                mode="admin"
                onEdit={(m) => setEditing(m)}
                onDelete={(m) => setConfirmDelete(m)}
                onToggleAvailable={async (m) => { await updateMedicine(m._id, { available: !m.available }); onCreated(); }}
              />
            )}
          </div>
        </>
      ) : currentView === "sellers" ? (
        // Seller Management View
        <>
          <div className="section">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title">Manage Sellers ({sellers.length})</div>
              <button className="btn-outline btn" onClick={loadSellers} disabled={sellerLoading}>
                {sellerLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            
            {sellerLoading ? (
              <div className="muted">Loading sellers...</div>
            ) : sellers.length === 0 ? (
              <div className="muted">No sellers found.</div>
            ) : (
              <div className="grid" style={{ gap: 16 }}>
                {sellers.map((seller) => (
                  <div className="card" key={seller._id} style={{ border: "1px solid var(--border)" }}>
                    <div className="card-body" style={{ padding: 20 }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="title" style={{ fontSize: 18 }}>{seller.firstName} {seller.lastName}</div>
                      </div>
                      <div className="muted" style={{ marginBottom: 4 }}>
                        <strong>📧 Email:</strong> {seller.email}
                      </div>
                      <div className="muted" style={{ marginBottom: 12 }}>
                        <strong>📞 Phone:</strong> {seller.phone}
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <button 
                          className="btn-outline btn" 
                          onClick={() => setEditingSeller(seller)}
                          style={{ flex: 1 }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-outline btn" 
                          onClick={() => setConfirmDeleteSeller(seller)}
                          style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Edit Seller Modal */}
          {editingSeller ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
              onClick={() => setEditingSeller(null)}
            >
              <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="title">Edit Seller</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setEditingSeller(null)} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}>×</button>
                  </div>
                  <form onSubmit={handleUpdateSeller} className="form">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="input form-input"
                        name="firstName"
                        defaultValue={editingSeller.firstName}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="input form-input"
                        name="lastName"
                        defaultValue={editingSeller.lastName}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        className="input form-input"
                        name="email"
                        type="email"
                        defaultValue={editingSeller.email}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        className="input form-input"
                        name="phone"
                        defaultValue={editingSeller.phone}
                        required
                      />
                    </div>
                    
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit">Update Seller</button>
                      <button className="btn-outline btn" type="button" onClick={() => setEditingSeller(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Delete Seller Confirmation Modal */}
          {confirmDeleteSeller ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
              onClick={() => setConfirmDeleteSeller(null)}
            >
              <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ padding: 24 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="title">Delete Seller</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDeleteSeller(null)}>×</button>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Are you sure you want to delete seller <strong>{confirmDeleteSeller.firstName} {confirmDeleteSeller.lastName}</strong>? 
                    <br/><br/>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>⚠️ Warning:</span> This will also permanently delete all their services and products. This action cannot be undone.
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-danger" type="button" onClick={handleConfirmDeleteSeller}>Delete</button>
                    <button className="btn-outline btn" type="button" onClick={() => setConfirmDeleteSeller(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        // Seller Items View (Separate Tables for Services and Products)
        <>
          <div className="section">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title">Seller Goods & Services</div>
              <button className="btn-outline btn" onClick={loadSellerItems} disabled={sellerItemsLoading}>
                {sellerItemsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            
            {/* Services Table */}
            <div className="section">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title">Services ({sellerServices.length})</div>
              </div>
              
              {/* Search for Services */}
              <div className="row" style={{ marginBottom: 16, gap: 12 }}>
                <input 
                  className="input" 
                  placeholder="Search by name or code" 
                  value={searchServiceTerm}
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    setSearchServiceTerm(term);
                    setCurrentPageService(1); // Reset to first page when searching
                  }}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button 
                  className="btn-outline btn" 
                  onClick={() => {
                    setSearchServiceTerm("");
                    setCurrentPageService(1); // Reset to first page when clearing search
                  }}
                >
                  Clear
                </button>
              </div>
              
              {sellerItemsLoading ? (
                <div className="muted">Loading services...</div>
              ) : paginatedSellerServices.length === 0 ? (
                <div className="muted">No services found.</div>
              ) : (
                <>
                  <div className="table-container" style={{ overflowX: "auto" }}>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Code</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Seller</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Phone</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Address</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Pincode</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", textAlign: "left", fontWeight: 600 }}>Initial Price</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", textAlign: "left", fontWeight: 600 }}>Updated Price</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Status</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSellerServices.map((service, index) => (
                          <tr key={service._id} style={{ backgroundColor: index % 2 === 0 ? "var(--background)" : "transparent" }}>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{service.serviceName}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <span className="pill pill-primary">
                                {service.code || "N/A"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              {service.firstName} {service.lastName}
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              {service.phone || "N/A"}
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{service.location}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{service.pincode || "N/A"}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", color: "#6b7280" }}>₹{service.initialPrice || service.price}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>₹{service.price}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <span className={service.available !== false ? "pill pill-success" : "pill pill-danger"}>
                                {service.available !== false ? "Available" : "Not Available"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={async () => {
                                    try {
                                      await updateService(service._id, { available: !service.available });
                                      loadSellerItems();
                                    } catch (err) {
                                      console.error("Failed to toggle availability:", err);
                                    }
                                  }}
                                  style={{ padding: "6px 12px", fontSize: "14px" }}
                                >
                                  {service.available !== false ? "Mark Unavailable" : "Mark Available"}
                                </button>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={() => setEditingService(service)}
                                  style={{ padding: "6px 12px", fontSize: "14px" }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={() => setConfirmDeleteService(service)}
                                  style={{ padding: "6px 12px", fontSize: "14px", borderColor: "#dc2626", color: "#dc2626" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls for Services */}
                  {totalPagesService > 1 && (
                    <div className="row" style={{ justifyContent: "center", marginTop: 16, gap: 8 }}>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => setCurrentPageService(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageService === 1}
                      >
                        Previous
                      </button>
                      <span className="muted" style={{ alignSelf: "center" }}>
                        Page {currentPageService} of {totalPagesService}
                      </span>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => setCurrentPageService(prev => Math.min(prev + 1, totalPagesService))}
                        disabled={currentPageService === totalPagesService}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Products Table */}
            <div className="section">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title">Products ({sellerProducts.length})</div>
              </div>
              
              {/* Search for Products */}
              <div className="row" style={{ marginBottom: 16, gap: 12 }}>
                <input 
                  className="input" 
                  placeholder="Search by name or code" 
                  value={searchProductTerm}
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    setSearchProductTerm(term);
                    setCurrentPageProduct(1); // Reset to first page when searching
                  }}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button 
                  className="btn-outline btn" 
                  onClick={() => {
                    setSearchProductTerm("");
                    setCurrentPageProduct(1); // Reset to first page when clearing search
                  }}
                >
                  Clear
                </button>
              </div>
              
              {sellerItemsLoading ? (
                <div className="muted">Loading products...</div>
              ) : paginatedSellerProducts.length === 0 ? (
                <div className="muted">No products found.</div>
              ) : (
                <>
                  <div className="table-container" style={{ overflowX: "auto" }}>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Code</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Seller</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Phone</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Address</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Pincode</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", textAlign: "left", fontWeight: 600 }}>Initial Price</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid var(--border)", textAlign: "left", fontWeight: 600 }}>Updated Price</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Status</th>
                          <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid var(--border)" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSellerProducts.map((product, index) => (
                          <tr key={product._id} style={{ backgroundColor: index % 2 === 0 ? "var(--background)" : "transparent" }}>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{product.productName}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <span className="pill pill-success">
                                {product.code || "N/A"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              {product.firstName} {product.lastName}
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              {product.phone || "N/A"}
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{product.location}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>{product.pincode || "N/A"}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", color: "#6b7280" }}>₹{product.initialPrice || product.price}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>₹{product.price}</td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <span className={product.available !== false ? "pill pill-success" : "pill pill-danger"}>
                                {product.available !== false ? "Available" : "Not Available"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={async () => {
                                    try {
                                      await updateProduct(product._id, { available: !product.available });
                                      loadSellerItems();
                                    } catch (err) {
                                      console.error("Failed to toggle availability:", err);
                                    }
                                  }}
                                  style={{ padding: "6px 12px", fontSize: "14px" }}
                                >
                                  {product.available !== false ? "Mark Unavailable" : "Mark Available"}
                                </button>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={() => setEditingProduct(product)}
                                  style={{ padding: "6px 12px", fontSize: "14px" }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn-outline btn" 
                                  onClick={() => setConfirmDeleteProduct(product)}
                                  style={{ padding: "6px 12px", fontSize: "14px", borderColor: "#dc2626", color: "#dc2626" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls for Products */}
                  {totalPagesProduct > 1 && (
                    <div className="row" style={{ justifyContent: "center", marginTop: 16, gap: 8 }}>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => setCurrentPageProduct(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageProduct === 1}
                      >
                        Previous
                      </button>
                      <span className="muted" style={{ alignSelf: "center" }}>
                        Page {currentPageProduct} of {totalPagesProduct}
                      </span>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => setCurrentPageProduct(prev => Math.min(prev + 1, totalPagesProduct))}
                        disabled={currentPageProduct === totalPagesProduct}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Edit Service Modal */}
          {editingService ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
              onClick={() => setEditingService(null)}
            >
              <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="title">Edit Service</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setEditingService(null)} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}>×</button>
                  </div>
                  <form onSubmit={handleUpdateService} className="form">
                    <div className="form-group">
                      <label className="form-label">Service Name</label>
                      <input
                        className="input form-input"
                        name="serviceName"
                        defaultValue={editingService.serviceName}
                        maxLength={100}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Initial Price (₹) - Read Only</label>
                      <input
                        className="input form-input"
                        type="number"
                        value={editingService.initialPrice || editingService.price}
                        disabled
                        style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Updated Price (₹)</label>
                      <input
                        className="input form-input"
                        type="number"
                        name="price"
                        defaultValue={editingService.price}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        className="input form-input"
                        name="location"
                        defaultValue={editingService.location}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        className="input form-input"
                        type="text"
                        name="pincode"
                        defaultValue={editingService.pincode}
                        maxLength={6}
                        pattern="\d{6}"
                        required
                      />
                    </div>
                    
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit">Update Service</button>
                      <button className="btn-outline btn" type="button" onClick={() => setEditingService(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Edit Product Modal */}
          {editingProduct ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
              onClick={() => setEditingProduct(null)}
            >
              <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="title">Edit Product</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setEditingProduct(null)} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}>×</button>
                  </div>
                  <form onSubmit={handleUpdateProduct} className="form">
                    <div className="form-group">
                      <label className="form-label">Product Name</label>
                      <input
                        className="input form-input"
                        name="productName"
                        defaultValue={editingProduct.productName}
                        maxLength={100}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Initial Price (₹) - Read Only</label>
                      <input
                        className="input form-input"
                        type="number"
                        value={editingProduct.initialPrice || editingProduct.price}
                        disabled
                        style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Updated Price (₹)</label>
                      <input
                        className="input form-input"
                        type="number"
                        name="price"
                        defaultValue={editingProduct.price}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        className="input form-input"
                        name="location"
                        defaultValue={editingProduct.location}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        className="input form-input"
                        type="text"
                        name="pincode"
                        defaultValue={editingProduct.pincode}
                        maxLength={6}
                        pattern="\d{6}"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Product Image</label>
                      {editingProduct.imageUrl && editingProduct.imageUrl !== "/uploads/no-image.png" && (
                        <div style={{ marginBottom: 12, position: "relative" }}>
                          <img 
                            src={editingProduct.imageUrl} 
                            alt="Product" 
                            style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)" }} 
                          />
                          <button
                            type="button"
                            className="btn-outline btn"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this image?")) {
                                setEditingProduct({ ...editingProduct, imageUrl: "/uploads/no-image.png" });
                              }
                            }}
                            style={{ marginTop: 8, borderColor: "#dc2626", color: "#dc2626", width: "100%" }}
                          >
                            Delete Image
                          </button>
                        </div>
                      )}
                      {(!editingProduct.imageUrl || editingProduct.imageUrl === "/uploads/no-image.png") && (
                        <div style={{ marginBottom: 12, padding: 40, border: "2px dashed var(--border)", borderRadius: 8, textAlign: "center", color: "var(--muted)" }}>
                          No Image
                        </div>
                      )}
                      <input
                        type="file"
                        className="input form-input"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const uploadResult = await uploadImage(file);
                              setEditingProduct({ ...editingProduct, imageUrl: uploadResult.url });
                            } catch (err) {
                              alert(err.message || "Failed to upload image");
                            }
                          }
                        }}
                      />
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Upload new image (PNG, JPG, WEBP up to 2MB)</div>
                    </div>
                    
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit">Update Product</button>
                      <button className="btn-outline btn" type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Delete Service Confirmation Modal */}
          {confirmDeleteService ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
              onClick={() => setConfirmDeleteService(null)}
            >
              <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ padding: 24 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="title">Delete Service</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDeleteService(null)}>×</button>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Are you sure you want to delete service <strong>{confirmDeleteService.serviceName}</strong>? This action cannot be undone.
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-danger" type="button" onClick={handleConfirmDeleteService}>Delete</button>
                    <button className="btn-outline btn" type="button" onClick={() => setConfirmDeleteService(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Delete Product Confirmation Modal */}
          {confirmDeleteProduct ? (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
              onClick={() => setConfirmDeleteProduct(null)}
            >
              <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="card-body" style={{ padding: 24 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="title">Delete Product</div>
                    <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDeleteProduct(null)}>×</button>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Are you sure you want to delete product <strong>{confirmDeleteProduct.productName}</strong>? This action cannot be undone.
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-danger" type="button" onClick={handleConfirmDeleteProduct}>Delete</button>
                    <button className="btn-outline btn" type="button" onClick={() => setConfirmDeleteProduct(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
      
      {confirmLogoutOpen ? (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
          onClick={() => setConfirmLogoutOpen(false)}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="title">Confirm Logout</div>
                <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmLogoutOpen(false)}>×</button>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>Are you sure you want to logout?</div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-danger" type="button" onClick={() => { setConfirmLogoutOpen(false); logout(); }}>Logout</button>
                <button className="btn-outline btn" type="button" onClick={() => setConfirmLogoutOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminApprovals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [allItems, setAllItems] = useState({ products: [], services: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllItemsAdmin();
      setAllItems(data);
    } catch (err) {
      console.error("Error loading items:", err);
      setError(err.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(type, id) {
    try {
      if (type === "product") {
        await approveProduct(id);
      } else {
        await approveService(id);
      }
      setSuccess(`${type === "product" ? "Product" : "Service"} approved successfully`);
      await loadItems();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to approve");
    }
  }

  async function handleReject(type, id) {
    try {
      if (type === "product") {
        await rejectProduct(id);
      } else {
        await rejectService(id);
      }
      setSuccess(`${type === "product" ? "Product" : "Service"} rejected successfully`);
      await loadItems();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to reject");
    }
  }


  const pendingProducts = allItems.products.filter(p => {
    const matchesStatus = !p.approved && !p.rejectedAt;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      p.productName.toLowerCase().includes(searchLower) ||
      (p.details && p.details.toLowerCase().includes(searchLower)) ||
      (p.code && p.code.toLowerCase().includes(searchLower)) ||
      (p.firstName && p.firstName.toLowerCase().includes(searchLower)) ||
      (p.lastName && p.lastName.toLowerCase().includes(searchLower))
    );
  });
  
  const pendingServices = allItems.services.filter(s => {
    const matchesStatus = !s.approved && !s.rejectedAt;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      s.serviceName.toLowerCase().includes(searchLower) ||
      (s.description && s.description.toLowerCase().includes(searchLower)) ||
      (s.code && s.code.toLowerCase().includes(searchLower)) ||
      (s.firstName && s.firstName.toLowerCase().includes(searchLower)) ||
      (s.lastName && s.lastName.toLowerCase().includes(searchLower))
    );
  });
  
  const approvedProducts = allItems.products.filter(p => {
    const matchesStatus = p.approved;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      p.productName.toLowerCase().includes(searchLower) ||
      (p.details && p.details.toLowerCase().includes(searchLower)) ||
      (p.code && p.code.toLowerCase().includes(searchLower)) ||
      (p.firstName && p.firstName.toLowerCase().includes(searchLower)) ||
      (p.lastName && p.lastName.toLowerCase().includes(searchLower))
    );
  });
  
  const approvedServices = allItems.services.filter(s => {
    const matchesStatus = s.approved;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      s.serviceName.toLowerCase().includes(searchLower) ||
      (s.description && s.description.toLowerCase().includes(searchLower)) ||
      (s.code && s.code.toLowerCase().includes(searchLower)) ||
      (s.firstName && s.firstName.toLowerCase().includes(searchLower)) ||
      (s.lastName && s.lastName.toLowerCase().includes(searchLower))
    );
  });
  
  const rejectedProducts = allItems.products.filter(p => {
    const matchesStatus = p.rejectedAt;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      p.productName.toLowerCase().includes(searchLower) ||
      (p.details && p.details.toLowerCase().includes(searchLower)) ||
      (p.code && p.code.toLowerCase().includes(searchLower)) ||
      (p.firstName && p.firstName.toLowerCase().includes(searchLower)) ||
      (p.lastName && p.lastName.toLowerCase().includes(searchLower))
    );
  });
  
  const rejectedServices = allItems.services.filter(s => {
    const matchesStatus = s.rejectedAt;
    if (!searchTerm) return matchesStatus;
    const searchLower = searchTerm.toLowerCase();
    return matchesStatus && (
      s.serviceName.toLowerCase().includes(searchLower) ||
      (s.description && s.description.toLowerCase().includes(searchLower)) ||
      (s.code && s.code.toLowerCase().includes(searchLower)) ||
      (s.firstName && s.firstName.toLowerCase().includes(searchLower)) ||
      (s.lastName && s.lastName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="order-page">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div className="title">Approval Management</div>
        <button className="btn-outline btn" onClick={() => navigate("/admin")}>Back to Admin</button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div className="row" style={{ flexWrap: "wrap", flex: "1", minWidth: "min(100%, 300px)", justifyContent: "flex-start", gap: 8 }}>
          <input 
            className="input" 
            placeholder="Search by name, code, or seller"
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            onKeyPress={(e) => { if (e.key === "Enter") setSearchTerm(searchQuery); }} 
            style={{ minWidth: "250px", flex: "1" }} 
          />
          <button className="btn" onClick={() => setSearchTerm(searchQuery)}>Search</button>
          <button className="btn-outline btn" onClick={() => { setSearchQuery(""); setSearchTerm(""); }}>Clear</button>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button 
          className={activeTab === "pending" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingProducts.length + pendingServices.length})
        </button>
        <button 
          className={activeTab === "approved" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("approved")}
        >
          Approved ({approvedProducts.length + approvedServices.length})
        </button>
        <button 
          className={activeTab === "rejected" ? "btn btn-primary" : "btn-outline btn"}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected ({rejectedProducts.length + rejectedServices.length})
        </button>
      </div>

      {loading ? (
        <div className="muted">Loading...</div>
      ) : (
        <div>
          {activeTab === "pending" && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {pendingProducts.map((product) => (
                <div key={product._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  {product.imageUrl && product.imageUrl.trim() !== "" ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.productName}
                      onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                      style={{ width: "100%", height: 280, objectFit: "cover" }}
                    />
                  ) : (
                    <img 
                      src={noImage} 
                      alt="No image available"
                      onError={(e) => { e.target.src = noImageFallback; }}
                      style={{ width: "100%", height: 280, objectFit: "contain", background: "var(--surface)" }}
                    />
                  )}
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {product.productName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                      🕒 Pending Approval
                    </div>
                    {product.details && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {product.details}
                      </div>
                    )}
                    {product.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {product.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{product.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Seller:</strong> {product.firstName} {product.lastName}
                    </div>
                    {product.phone && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                        <strong>📞 Phone:</strong> {product.phone}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {product.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {product.pincode || "N/A"}
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleApprove("product", product._id)}
                        style={{ flex: 1 }}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => handleReject("product", product._id)}
                        style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingServices.map((service) => (
                <div key={service._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {service.serviceName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                      🕒 Pending Approval
                    </div>
                    {service.description && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {service.description}
                      </div>
                    )}
                    {service.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {service.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Provider:</strong> {service.firstName} {service.lastName}
                    </div>
                    {service.phone && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                        <strong>📞 Phone:</strong> {service.phone}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{service.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {service.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {service.pincode || "N/A"}
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleApprove("service", service._id)}
                        style={{ flex: 1 }}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-outline btn" 
                        onClick={() => handleReject("service", service._id)}
                        style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "approved" && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {approvedProducts.map((product) => (
                <div key={product._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  {product.imageUrl && product.imageUrl.trim() !== "" ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.productName}
                      onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                      style={{ width: "100%", height: 280, objectFit: "cover" }}
                    />
                  ) : (
                    <img 
                      src={noImage} 
                      alt="No image available"
                      onError={(e) => { e.target.src = noImageFallback; }}
                      style={{ width: "100%", height: 280, objectFit: "contain", background: "var(--surface)" }}
                    />
                  )}
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {product.productName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                      ✓ Approved
                    </div>
                    {product.details && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {product.details}
                      </div>
                    )}
                    {product.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {product.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{product.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Seller:</strong> {product.firstName} {product.lastName}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {product.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {product.pincode || "N/A"}
                    </div>
                    <button 
                      className="btn-outline btn" 
                      onClick={() => handleReject("product", product._id)}
                      style={{ width: "100%", borderColor: "#dc2626", color: "#dc2626" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {approvedServices.map((service) => (
                <div key={service._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {service.serviceName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                      ✓ Approved
                    </div>
                    {service.description && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {service.description}
                      </div>
                    )}
                    {service.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {service.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Provider:</strong> {service.firstName} {service.lastName}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{service.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {service.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {service.pincode || "N/A"}
                    </div>
                    <button 
                      className="btn-outline btn" 
                      onClick={() => handleReject("service", service._id)}
                      style={{ width: "100%", borderColor: "#dc2626", color: "#dc2626" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "rejected" && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {rejectedProducts.map((product) => (
                <div key={product._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden", opacity: 0.7 }}>
                  {product.imageUrl && product.imageUrl.trim() !== "" ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.productName}
                      onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                      style={{ width: "100%", height: 280, objectFit: "cover" }}
                    />
                  ) : (
                    <img 
                      src={noImage} 
                      alt="No image available"
                      onError={(e) => { e.target.src = noImageFallback; }}
                      style={{ width: "100%", height: 280, objectFit: "contain", background: "var(--surface)" }}
                    />
                  )}
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {product.productName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#dc2626", fontWeight: 600 }}>
                      ✗ Rejected
                    </div>
                    {product.details && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {product.details}
                      </div>
                    )}
                    {product.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {product.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{product.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Seller:</strong> {product.firstName} {product.lastName}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {product.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {product.pincode || "N/A"}
                    </div>
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleApprove("product", product._id)}
                      style={{ width: "100%" }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {rejectedServices.map((service) => (
                <div key={service._id} className="card card-elevated" style={{ padding: 0, overflow: "hidden", opacity: 0.7 }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="title" style={{ fontSize: 18, marginBottom: 8 }}>
                      {service.serviceName}
                    </div>
                    <div className="muted" style={{ marginBottom: 8, fontSize: 14, color: "#dc2626", fontWeight: 600 }}>
                      ✗ Rejected
                    </div>
                    {service.description && (
                      <div className="muted" style={{ marginBottom: 8, fontSize: 14 }}>
                        {service.description}
                      </div>
                    )}
                    {service.code && (
                      <div className="muted" style={{ marginBottom: 4, fontSize: 12 }}>
                        <strong>🏷️ Code:</strong> {service.code}
                      </div>
                    )}
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>👤 Provider:</strong> {service.firstName} {service.lastName}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>💰 Price:</strong> ₹{service.price}
                    </div>
                    <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>📍 Address:</strong> {service.location}
                    </div>
                    <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                      <strong>📮 Pincode:</strong> {service.pincode || "N/A"}
                    </div>
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleApprove("service", service._id)}
                      style={{ width: "100%" }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pending" && pendingProducts.length === 0 && pendingServices.length === 0 && (
            <div className="muted" style={{ textAlign: "center", padding: 40 }}>No pending items</div>
          )}
          {activeTab === "approved" && approvedProducts.length === 0 && approvedServices.length === 0 && (
            <div className="muted" style={{ textAlign: "center", padding: 40 }}>No approved items</div>
          )}
          {activeTab === "rejected" && rejectedProducts.length === 0 && rejectedServices.length === 0 && (
            <div className="muted" style={{ textAlign: "center", padding: 40 }}>No rejected items</div>
          )}
        </div>
      )}
    </div>
  );
}

function Seller() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [sellerData, setSellerData] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [myServices, setMyServices] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [confirmDeleteService, setConfirmDeleteService] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  
  // Registration form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Service form
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [servicePincode, setServicePincode] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [serviceSuccess, setServiceSuccess] = useState("");
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  
  // Product form
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [productPincode, setProductPincode] = useState("");
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const seller = localStorage.getItem("seller");
    if (seller) {
      const parsed = JSON.parse(seller);
      setSellerData(parsed);
      setIsAuthenticated(true);
      // Verify account on mount
      verifyAccount(parsed.id);
    }
  }, []);

  async function verifyAccount(sellerId) {
    try {
      await verifySeller(sellerId);
    } catch (err) {
      if (err.message === "ACCOUNT_DELETED") {
        setAccountDeleted(true);
        setIsAuthenticated(false);
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated && sellerData?.id) {
      loadMyServices();
      loadMyProducts();
    }
  }, [isAuthenticated, sellerData?.id]);

  async function loadMyServices() {
    setLoadingServices(true);
    try {
      const services = await fetchSellerServices(sellerData.id);
      console.log("Loaded services:", services);
      setMyServices(services);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadMyProducts() {
    setLoadingProducts(true);
    try {
      const products = await fetchSellerProducts(sellerData.id);
      console.log("Loaded products:", products);
      setMyProducts(products);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !phone.trim()) {
      setError("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be 10 digits");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerSeller({ firstName, lastName, email, password, phone });
      if (response.success) {
        localStorage.setItem("seller", JSON.stringify(response.seller));
        localStorage.setItem("sellerPassword", password);
        setSellerData(response.seller);
        setIsAuthenticated(true);
        setSuccess("Registration successful!");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setPhone("");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!loginEmail.trim() || !loginPassword) {
      setError("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await loginSeller({ email: loginEmail, password: loginPassword });
      if (response.success) {
        localStorage.setItem("seller", JSON.stringify(response.seller));
        localStorage.setItem("sellerPassword", loginPassword);
        setSellerData(response.seller);
        setIsAuthenticated(true);
        setSuccess("Login successful!");
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const formData = new FormData(e.target);
    const updatedData = {
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim()
    };

    if (!updatedData.firstName || !updatedData.lastName || !updatedData.email || !updatedData.phone) {
      setProfileError("All fields are required");
      return;
    }

    try {
      const response = await updateSeller(sellerData.id, updatedData, sellerData.email, localStorage.getItem("sellerPassword"));
      
      // Update local seller data
      const updatedSellerData = { ...sellerData, ...updatedData };
      setSellerData(updatedSellerData);
      localStorage.setItem("seller", JSON.stringify(updatedSellerData));
      
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => {
        setEditingProfile(false);
        setProfileError("");
        setProfileSuccess("");
      }, 1500);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    }
  }

  function handleLogout() {
    setConfirmLogout(true);
  }

  function confirmLogoutAction() {
    localStorage.removeItem("seller");
    setIsAuthenticated(false);
    setSellerData(null);
    setConfirmLogout(false);
  }

  function handleServiceSubmit(e) {
    e.preventDefault();
    setServiceError("");
    setServiceSuccess("");

    if (!serviceName.trim() || !serviceDescription.trim() || !servicePrice || !serviceLocation.trim() || !servicePincode.trim()) {
      setServiceError("All fields are required");
      return;
    }

    // Validate service name character count
    if (serviceName.trim().length > 100) {
      setServiceError("Service name must not exceed 100 characters");
      return;
    }

    // Validate description character count
    if (serviceDescription.trim().length > 250) {
      setServiceError("Description must not exceed 250 characters");
      return;
    }

    // Validate available time character count
    if (Number(servicePrice) <= 0) {      setServiceError("Price must be greater than 0");      return;    }

    // Validate address character count
    if (serviceLocation.trim().length > 70) {
      setServiceError("Address must not exceed 70 characters");
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(servicePincode)) {
      setServiceError("Pincode must be exactly 6 digits");
      return;
    }

    setServiceSubmitting(true);
    
    if (editingService) {
      // Update existing service
      updateService(editingService._id, {        serviceName,        description: serviceDescription,        price: Number(servicePrice),        location: serviceLocation,        pincode: servicePincode      })
        .then(() => {
          setServiceSuccess("Service updated successfully!");
          setServiceSubmitting(false);
          setTimeout(() => {
            setServiceName("");
            setServiceDescription("");
            setServicePrice("");
            setServiceLocation("");
            setServicePincode("");
            setShowServiceForm(false);
            setEditingService(null);
            setServiceSuccess("");
            loadMyServices();
          }, 1500);
        })
        .catch((err) => {
          setServiceError(err.message || "Failed to update service");
          setServiceSubmitting(false);
        });
    } else {
      // Create new service
      console.log('Creating service with data:', {
        sellerId: sellerData.id,
        firstName: sellerData.firstName,
        lastName: sellerData.lastName,
        serviceName,
        description: serviceDescription,
        price: Number(servicePrice),
        location: serviceLocation,
        pincode: servicePincode
      });
      createService({
        sellerId: sellerData.id,
        firstName: sellerData.firstName,
        lastName: sellerData.lastName,
        serviceName,
        description: serviceDescription,
        price: Number(servicePrice),
        location: serviceLocation,
        pincode: servicePincode
      })
        .then((response) => {
          console.log("Service created:", response);
          setServiceSuccess(`Service "${serviceName}" added successfully!`);
          setServiceSubmitting(false);
          setTimeout(() => {
            setServiceName("");
            setServiceDescription("");
            setServicePrice("");
            setServiceLocation("");
            setServicePincode("");
            setShowServiceForm(false);
            setServiceSuccess("");
            loadMyServices();
          }, 1500);
        })
        .catch((err) => {
          console.error("Service creation error:", err);
          if (err.message.includes("ACCOUNT_DELETED")) {
            setAccountDeleted(true);
            setIsAuthenticated(false);
          } else {
            setServiceError(err.message || "Failed to create service");
          }
          setServiceSubmitting(false);
        });
    }
  }

  function handleEditService(service) {
    setEditingService(service);
    setServiceName(service.serviceName);
    setServiceDescription(service.description || "");
    setServicePrice(service.price || "");
    setServiceLocation(service.location);
    setServicePincode(service.pincode || "");
    setShowServiceForm(true);
  }

  async function handleDeleteService(serviceId) {
    const service = myServices.find(s => s._id === serviceId);
    setConfirmDeleteService(service);
  }

  async function handleConfirmDeleteService() {
    if (!confirmDeleteService) return;
    
    try {
      await deleteService(confirmDeleteService._id);
      setConfirmDeleteService(null);
      loadMyServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      setServiceError(err.message || "Failed to delete service");
      setConfirmDeleteService(null);
    }
  }

  function handleProductImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setProductError("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setProductError("Image must be 2MB or smaller");
        return;
      }
      setProductError("");
      setProductImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProductImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    setProductError("");
    setProductSuccess("");

    if (!productName.trim() || !productDetails.trim() || !productPrice || !productLocation.trim() || !productPincode.trim()) {
      setProductError("All fields are required");
      return;
    }

    // Validate product name character count
    if (productName.trim().length > 100) {
      setProductError("Product name must not exceed 100 characters");
      return;
    }

    // Validate product details character count
    if (productDetails.trim().length > 250) {
      setProductError("Product details must not exceed 250 characters");
      return;
    }

    // Validate price
    if (Number(productPrice) <= 0) {
      setProductError("Price must be greater than 0");
      return;
    }

    // Validate address character count
    if (productLocation.trim().length > 70) {
      setProductError("Address must not exceed 70 characters");
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(productPincode)) {
      setProductError("Pincode must be exactly 6 digits");
      return;
    }

    setProductSubmitting(true);

    try {
      let imageUrl = productImageUrl;
      
      if (productImage) {
        const uploadResult = await uploadImage(productImage);
        imageUrl = uploadResult.url;
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, {
          productName,
          details: productDetails,
          price: Number(productPrice),
          imageUrl,
          location: productLocation,
          pincode: productPincode
        });
        setProductSuccess("Product updated successfully!");
      } else {
        await createProduct({
          sellerId: sellerData.id,
          firstName: sellerData.firstName,
          lastName: sellerData.lastName,
          productName,
          details: productDetails,
          price: Number(productPrice),
          imageUrl,
          location: productLocation,
          pincode: productPincode
        });
        setProductSuccess(`Product "${productName}" added successfully!`);
      }

      setProductSubmitting(false);
      setTimeout(() => {
        setProductName("");
        setProductDetails("");
        setProductPrice("");
        setProductImage(null);
        setProductImagePreview("");
        setProductLocation("");
        setProductPincode("");
        setProductImageUrl("");
        setShowProductForm(false);
        setEditingProduct(null);
        setProductSuccess("");
        loadMyProducts();
      }, 1500);
    } catch (err) {
      console.error("Product error:", err);
      if (err.message.includes("ACCOUNT_DELETED")) {
        setAccountDeleted(true);
        setIsAuthenticated(false);
      } else {
        setProductError(err.message || "Failed to save product");
      }
      setProductSubmitting(false);
    }
  }

  function handleEditProduct(product) {
    setEditingProduct(product);
    setProductName(product.productName);
    setProductDetails(product.details || "");
    setProductPrice(product.price || "");
    setProductImagePreview(product.imageUrl);
    setProductImageUrl(product.imageUrl);
    setProductLocation(product.location);
    setProductPincode(product.pincode || "");
    setShowProductForm(true);
  }

  async function handleDeleteProduct(productId) {
    const product = myProducts.find(p => p._id === productId);
    setConfirmDeleteProduct(product);
  }

  async function handleConfirmDeleteProduct() {
    if (!confirmDeleteProduct) return;
    
    try {
      await deleteProduct(confirmDeleteProduct._id);
      setConfirmDeleteProduct(null);
      loadMyProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      setProductError(err.message || "Failed to delete product");
      setConfirmDeleteProduct(null);
    }
  }

  if (accountDeleted) {
    return (
      <div className="order-page">
        <div className="section centered" style={{ minHeight: "calc(100vh - 200px)" }}>
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-body" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
              <div className="title" style={{ marginBottom: 16, fontSize: 24, color: "#dc2626" }}>Account Deleted</div>
              <div className="muted" style={{ marginBottom: 24, fontSize: 16 }}>
                Your account has been deleted by the administrator. All your services and products have been removed.
              </div>
              <div className="muted" style={{ marginBottom: 24 }}>
                If you believe this is an error, please contact support.
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  localStorage.removeItem("seller");
                  setAccountDeleted(false);
                  setIsAuthenticated(false);
                  setSellerData(null);
                }}
                style={{ minWidth: 200 }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="order-page">
        <div className="section centered" style={{ minHeight: "calc(100vh - 200px)" }}>
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-body">
              <div className="title" style={{ marginBottom: 16 }}>Seller {isLogin ? "Login" : "Registration"}</div>
              <div className="muted" style={{ marginBottom: 20 }}>
                {isLogin ? "Sign in to your seller account" : "Create a new seller account to start selling"}
              </div>
              
              {isLogin ? (
                <form onSubmit={handleLogin} className="form">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      className="input form-input"
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      className="input form-input"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <span className="alert-icon">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <span className="alert-icon">✓</span>
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    className="btn form-submit-btn"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Signing in..." : "Sign In"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <span className="muted">Don't have an account? </span>
                    <button
                      type="button"
                      className="btn-outline btn"
                      onClick={() => {
                        setIsLogin(false);
                        setError("");
                        setSuccess("");
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Register here
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        className="input form-input"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        className="input form-input"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email (Gmail) *</label>
                    <input
                      className="input form-input"
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="input form-input"
                      type="tel"
                      placeholder="10 digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input
                        className="input form-input"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Confirm Password *</label>
                      <input
                        className="input form-input"
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <span className="alert-icon">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <span className="alert-icon">✓</span>
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    className="btn form-submit-btn"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Creating Account..." : "Create Account"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <span className="muted">Already have an account? </span>
                    <button
                      type="button"
                      className="btn-outline btn"
                      onClick={() => {
                        setIsLogin(true);
                        setError("");
                        setSuccess("");
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Login here
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="title">Seller Dashboard</div>
        <button className="btn-outline btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div className="title">Welcome, {sellerData?.firstName} {sellerData?.lastName}!</div>
            <button 
              className="btn-outline btn" 
              onClick={() => setEditingProfile(true)}
              style={{ padding: "6px 12px", fontSize: "14px" }}
            >
              Edit Profile
            </button>
          </div>
          <div className="muted">Email: {sellerData?.email}</div>
          <div className="muted">Phone: {sellerData?.phone}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: 24 }}>
        {/* Sell Service Card */}
        <div className="card card-elevated">
          <div className="card-body">
            <div style={{ textAlign: "center", padding: "20px 20px 10px" }}>
              <div className="feature-icon" style={{ fontSize: 64, marginBottom: 20 }}>💼</div>
              <div className="title" style={{ fontSize: 22, marginBottom: 12 }}>Sell Service</div>
              <div className="muted" style={{ marginBottom: 20 }}>
                Offer your professional services to customers. List your skills, availability, and pricing.
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowServiceForm(true)}>
                Start Selling Services
              </button>
            </div>

            {/* My Services Section */}
            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="title" style={{ fontSize: 18 }}>My Services ({myServices.length})</div>
                <button 
                  className="btn-outline btn" 
                  onClick={loadMyServices}
                  disabled={loadingServices}
                  style={{ fontSize: 13, padding: "6px 12px" }}
                >
                  {loadingServices ? "Loading..." : "Refresh"}
                </button>
              </div>
              {loadingServices ? (
                <div className="muted">Loading services...</div>
              ) : myServices.length === 0 ? (
                <div className="muted" style={{ textAlign: "center", padding: "20px" }}>
                  No services added yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {myServices.map((service) => (
                    <div className="card" key={service._id} style={{ border: "1px solid var(--border)" }}>
                      <div className="card-body" style={{ padding: 16 }}>
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div className="title" style={{ fontSize: 16, margin: 0 }}>{service.serviceName}</div>
                          {service.rejectedAt ? (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>
                              ✗ Rejected
                            </span>
                          ) : service.approved ? (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#dcfce7", color: "#10b981", fontWeight: 600 }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#fef3c7", color: "#f59e0b", fontWeight: 600 }}>
                              🕒 Pending
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <div className="muted" style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
                            {service.description}
                          </div>
                        )}
                        {service.code && (
                          <div className="muted" style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                            <strong>🏷️ Code:</strong> {service.code}
                          </div>
                        )}
                        <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                          <strong>💰 Price:</strong> ₹{service.initialPrice || service.price}
                        </div>
                        <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                          <strong>📍 Address:</strong> {service.location}
                        </div>
                        <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                          <strong>📮 Pincode:</strong> {service.pincode || "N/A"}
                        </div>
                        {!service.approved && (
                          <div className="row" style={{ gap: 8 }}>
                            <button 
                              className="btn-outline btn" 
                              onClick={() => handleEditService(service)}
                              style={{ flex: 1, fontSize: 13, padding: "8px" }}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-outline btn" 
                              onClick={() => handleDeleteService(service._id)}
                              style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626", fontSize: 13, padding: "8px" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
              }
            </div>
          </div>
        </div>

        {/* Sell Goods Card */}
        <div className="card card-elevated">
          <div className="card-body">
            <div style={{ textAlign: "center", padding: "20px 20px 10px" }}>
              <div className="feature-icon" style={{ fontSize: 64, marginBottom: 20 }}>📦</div>
              <div className="title" style={{ fontSize: 22, marginBottom: 12 }}>Sell Goods</div>
              <div className="muted" style={{ marginBottom: 20 }}>
                List physical products for sale. Manage inventory, pricing, and product details.
              </div>
              <button className="btn btn-success" style={{ width: "100%" }} onClick={() => setShowProductForm(true)}>
                Start Selling Goods
              </button>
            </div>

            {/* My Products Section */}
            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="title" style={{ fontSize: 18 }}>My Products ({myProducts.length})</div>
                <button 
                  className="btn-outline btn" 
                  onClick={loadMyProducts}
                  disabled={loadingProducts}
                  style={{ fontSize: 13, padding: "6px 12px" }}
                >
                  {loadingProducts ? "Loading..." : "Refresh"}
                </button>
              </div>
              {loadingProducts ? (
                <div className="muted">Loading products...</div>
              ) : myProducts.length === 0 ? (
                <div className="muted" style={{ textAlign: "center", padding: "20px" }}>
                  No products added yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {myProducts.map((product) => (
                    <div className="card" key={product._id} style={{ border: "1px solid var(--border)" }}>
                      {product.imageUrl && product.imageUrl.trim() !== "" ? (
                        <img src={product.imageUrl} alt={product.productName} onError={(e) => { e.target.onerror = null; e.target.src = noImage; }} style={{ width: "100%", height: 360, objectFit: "cover", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                      ) : (
                        <img 
                          src={noImage} 
                          alt="No image available"
                          onError={(e) => { e.target.src = noImageFallback; }}
                          style={{ width: "100%", height: 360, objectFit: "contain", background: "var(--surface)", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                        />
                      )}
                      <div className="card-body" style={{ padding: 16 }}>
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div className="title" style={{ fontSize: 16, margin: 0 }}>{product.productName}</div>
                          {product.rejectedAt ? (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>
                              ✗ Rejected
                            </span>
                          ) : product.approved ? (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#dcfce7", color: "#10b981", fontWeight: 600 }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#fef3c7", color: "#f59e0b", fontWeight: 600 }}>
                              🕒 Pending
                            </span>
                          )}
                        </div>
                        {product.details && (
                          <div className="muted" style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
                            {product.details}
                          </div>
                        )}
                        {product.code && (
                          <div className="muted" style={{ marginBottom: 4, fontSize: 12, color: "#6b7280" }}>
                            <strong>🏷️ Code:</strong> {product.code}
                          </div>
                        )}
                        <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                          <strong>💰 Price:</strong> ₹{product.initialPrice || product.price}
                        </div>
                        <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>
                          <strong>📍 Address:</strong> {product.location}
                        </div>
                        <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                          <strong>📮 Pincode:</strong> {product.pincode || "N/A"}
                        </div>
                        {!product.approved && (
                          <div className="row" style={{ gap: 8 }}>
                            <button 
                              className="btn-outline btn" 
                              onClick={() => handleEditProduct(product)}
                              style={{ flex: 1, fontSize: 13, padding: "8px" }}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-outline btn" 
                              onClick={() => handleDeleteProduct(product._id)}
                              style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626", fontSize: 13, padding: "8px" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
              }
            </div>
          </div>
        </div>
      </div>

      {/* Service Form Modal */}
      {showServiceForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
          onClick={() => {
            setShowServiceForm(false);
            setEditingService(null);
            setServiceName("");
            setServiceDescription("");
            setServicePrice("");
            setServiceLocation("");
            setServiceError("");
          }}
        >
          <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="title">{editingService ? "Edit Service" : "Add Your Service"}</div>
                <button 
                  className="popup-close" 
                  type="button" 
                  aria-label="Close" 
                  onClick={() => {
                    setShowServiceForm(false);
                    setEditingService(null);
                    setServiceName("");
                    setServicePrice("");
                    setServiceLocation("");
                    setServiceError("");
                  }}
                  style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleServiceSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      className="input form-input"
                      value={sellerData?.firstName || ""}
                      disabled
                      style={{ background: "#f5f7fb", cursor: "not-allowed" }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      className="input form-input"
                      value={sellerData?.lastName || ""}
                      disabled
                      style={{ background: "#f5f7fb", cursor: "not-allowed" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Service Name *</label>
                  <input
                    className="input form-input"
                    placeholder="e.g., Web Development, Plumbing"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="textarea form-textarea"
                    placeholder="Describe your service..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={4}
                    maxLength={250}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price () *</label>          <input            className="input form-input"            type="number"            placeholder="e.g., 500"            value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input
                    className="input form-input"
                    placeholder="e.g., Street, City, State"
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input
                    className="input form-input"
                    type="text"
                    placeholder="e.g., 110001"
                    value={servicePincode}
                    onChange={(e) => setServicePincode(e.target.value)}
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>

                {serviceError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{serviceError}</span>
                  </div>
                )}

                {serviceSuccess && (
                  <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{serviceSuccess}</span>
                  </div>
                )}

                <button
                  className="btn form-submit-btn"
                  type="submit"
                  disabled={serviceSubmitting}
                >
                  {serviceSubmitting ? (editingService ? "Updating..." : "Adding Service...") : (editingService ? "Update Service" : "Add Service")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
          onClick={() => {
            setShowProductForm(false);
            setEditingProduct(null);
            setProductName("");
            setProductDetails("");
            setProductImage(null);
            setProductImagePreview("");
            setProductLocation("");
            setProductError("");
          }}
        >
          <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="title">{editingProduct ? "Edit Product" : "Add Your Product"}</div>
                <button 
                  className="popup-close" 
                  type="button" 
                  aria-label="Close" 
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductName("");
                    setProductDetails("");
                    setProductPrice("");
                    setProductImage(null);
                    setProductImagePreview("");
                    setProductLocation("");
                    setProductError("");
                  }}
                  style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      className="input form-input"
                      value={sellerData?.firstName || ""}
                      disabled
                      style={{ background: "#f5f7fb", cursor: "not-allowed" }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      className="input form-input"
                      value={sellerData?.lastName || ""}
                      disabled
                      style={{ background: "#f5f7fb", cursor: "not-allowed" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="input form-input"
                    placeholder="e.g., Laptop, Furniture"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Details *</label>
                  <textarea
                    className="textarea form-textarea"
                    placeholder="Describe the product..."
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    rows={3}
                    maxLength={250}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    className="input form-input"
                    type="number"
                    placeholder="e.g., 1000"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image (Optional - Max 2MB)</label>
                  {productImagePreview && (
                    <div style={{ marginBottom: 12 }}>
                      <img src={productImagePreview} alt="Preview" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)" }} />
                    </div>
                  )}
                  <input
                    type="file"
                    className="input form-input"
                    accept="image/*"
                    onChange={handleProductImageChange}
                  />
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>PNG, JPG, WEBP up to 2MB (Optional)</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input
                    className="input form-input"
                    placeholder="e.g., Street, City, State"
                    value={productLocation}
                    onChange={(e) => setProductLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input
                    className="input form-input"
                    type="text"
                    placeholder="e.g., 110001"
                    value={productPincode}
                    onChange={(e) => setProductPincode(e.target.value)}
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>

                {productError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{productError}</span>
                  </div>
                )}

                {productSuccess && (
                  <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{productSuccess}</span>
                  </div>
                )}

                <button
                  className="btn form-submit-btn"
                  type="submit"
                  disabled={productSubmitting}
                >
                  {productSubmitting ? (editingProduct ? "Updating..." : "Adding Product...") : (editingProduct ? "Update Product" : "Add Product")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      {confirmDeleteService ? (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
          onClick={() => setConfirmDeleteService(null)}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="title">Delete Service</div>
                <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDeleteService(null)}>×</button>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Are you sure you want to delete service <strong>{confirmDeleteService.serviceName}</strong>? This action cannot be undone.
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-danger" type="button" onClick={handleConfirmDeleteService}>Delete</button>
                <button className="btn-outline btn" type="button" onClick={() => setConfirmDeleteService(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Product Confirmation Modal */}
      {confirmDeleteProduct ? (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
          onClick={() => setConfirmDeleteProduct(null)}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="title">Delete Product</div>
                <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmDeleteProduct(null)}>×</button>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Are you sure you want to delete product <strong>{confirmDeleteProduct.productName}</strong>? This action cannot be undone.
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-danger" type="button" onClick={handleConfirmDeleteProduct}>Delete</button>
                <button className="btn-outline btn" type="button" onClick={() => setConfirmDeleteProduct(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal */}
      {editingProfile ? (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px 16px", overflowY: "auto" }}
          onClick={() => setEditingProfile(false)}
        >
          <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "calc(100vh - 40px)", margin: "auto", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ overflowY: "auto", padding: 24, flex: 1 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="title">Edit Profile</div>
                <button className="popup-close" type="button" aria-label="Close" onClick={() => setEditingProfile(false)} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "28px", lineHeight: 1, padding: 0, color: "var(--muted)" }}>×</button>
              </div>
              <form onSubmit={handleUpdateProfile} className="form">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="input form-input"
                    name="firstName"
                    defaultValue={sellerData.firstName}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="input form-input"
                    name="lastName"
                    defaultValue={sellerData.lastName}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="input form-input"
                    type="email"
                    name="email"
                    defaultValue={sellerData.email}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="input form-input"
                    name="phone"
                    defaultValue={sellerData.phone}
                    required
                  />
                </div>
                
                {profileError && <div className="error" style={{ marginBottom: 12 }}>{profileError}</div>}
                {profileSuccess && <div className="success" style={{ marginBottom: 12 }}>{profileSuccess}</div>}
                
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" type="submit">Update Profile</button>
                  <button className="btn-outline btn" type="button" onClick={() => setEditingProfile(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Logout Confirmation Modal */}
      {confirmLogout ? (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}
          onClick={() => setConfirmLogout(false)}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="title">Confirm Logout</div>
                <button className="popup-close" type="button" aria-label="Close" onClick={() => setConfirmLogout(false)}>×</button>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Are you sure you want to logout from your seller account?
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn btn-danger" type="button" onClick={confirmLogoutAction}>Logout</button>
                <button className="btn-outline btn" type="button" onClick={() => setConfirmLogout(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


































