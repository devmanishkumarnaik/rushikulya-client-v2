import React from "react";

export default function MedicineList({ items, mode = "user", onEdit, onDelete, onToggleAvailable, onOrder, onShare }) {
  if (!items.length) return <div className="muted">No products</div>;
  
  // Helper function to calculate pricing breakdown
  const calculatePricing = (item) => {
    const mrp = Number(item.mrp || 0);
    const price = Number(item.price || 0);
    const gstPercent = Number(item.gst || 0);
    const deliveryCharge = Number(item.deliveryCharge || 0);
    const gstAmount = (price * gstPercent) / 100;
    const total = price + gstAmount + deliveryCharge;
    return { mrp, price, gstPercent, gstAmount, deliveryCharge, total };
  };
  
  return (
    <div className="grid">
      {items.map((m) => {
        const pricing = calculatePricing(m);
        
        return (
          <div className="card" key={m._id}>
            {m.imageUrl ? (
              <img src={m.imageUrl} alt={m.name} style={{ width: "100%", height: 160, objectFit: "cover", borderTopLeftRadius: 16, borderTopRightRadius: 16, display: "block" }} />
            ) : null}
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="title">{m.name}</div>
                <span className="pill">{m.available ? "Available" : "Not Available"}</span>
              </div>
              <div className="muted" style={{ margin: "8px 0" }}>{m.benefits}</div>
              
              {/* Expiry below description */}
              {m.expiry && (
                <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                  <strong>Expiry:</strong> {m.expiry}
                </div>
              )}
              
              <div className="price-details" style={{ marginTop: 12, padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">MRP:</span>
                  <span style={{ fontWeight: 600 }}>₹{pricing.mrp.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Price:</span>
                  <span style={{ fontWeight: 600 }}>₹{pricing.price.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">GST: {pricing.gstPercent.toFixed(2)}%</span>
                  <span style={{ fontWeight: 600 }}>₹{pricing.gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Delivery:</span>
                  <span style={{ fontWeight: 600 }}>₹{pricing.deliveryCharge.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 15, paddingTop: 8, borderTop: "2px solid var(--border)", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total:</span>
                  <span style={{ color: "var(--primary)" }}>₹{pricing.total.toFixed(2)}</span>
                </div>
              </div>
              {mode === "admin" ? (
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn-outline btn" onClick={() => onToggleAvailable && onToggleAvailable(m)}>{m.available ? "Mark Not Available" : "Mark Available"}</button>
                  <button className="btn-outline btn" onClick={() => onEdit && onEdit(m)}>Edit</button>
                  <button className="btn-outline btn" onClick={() => onDelete && onDelete(m)}>Delete</button>
                </div>
              ) : (
                <div className="row" style={{ marginTop: 10, gap: 8 }}>
                  {m.available ? (
                    <>
                      <button className="btn btn-success" style={{ flex: 1 }} onClick={() => onOrder && onOrder(m)}>Order Now</button>
                      {onShare && (
                        <button className="btn-outline btn" style={{ flex: "0 0 auto", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => onShare(m)} title="Share this product">
                          <span className="share-text">Share</span> 📤
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="muted">Not available</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}