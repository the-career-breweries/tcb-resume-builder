export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, name, jobTitle, company } = req.body;
  if (!email) return res.status(400).json({ error: "Missing required fields" });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(500).json({ error: "Payment gateway not configured" });

  try {
    const creds = Buffer.from(keyId + ":" + keySecret).toString("base64");
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + creds },
      body: JSON.stringify({ amount: 249900, currency: "INR", receipt: "tcb_build_" + Date.now(), notes: { email, name: name || "", jobTitle: jobTitle || "", company: company || "", product: "Resume Builder" } })
    });
    const order = await orderRes.json();
    if (!orderRes.ok) return res.status(500).json({ error: "Failed to create order" });
    return res.status(200).json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create order" });
  }
}
