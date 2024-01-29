const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 3521;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_nao_yoshida", // PostgreSQLのユーザー名に置き換えてください
  host: "localhost",
  database: "db_nao_yoshida", // PostgreSQLのデータベース名に置き換えてください
  password: "pass", // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/test-connection", (req, res) => {
  res.send("Database connection is working!");
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/add-customer", async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { company_name, industry, contact, location } = req.body;
    // ログに受信データを表示
    console.log("Received data:", { company_name, industry, contact, location });

    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [company_name, industry, contact, location]
    );
    // ログに挿入された顧客データを表示
    console.log("Inserted customer:", newCustomer.rows[0]);
    
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.get("/customer/detail.html", async (req, res) => {
  console.log("/customer/detail.html ルートにアクセスしました");
  try {
    const customerId = req.query.id;

    if (!/^\d+$/.test(customerId)) {
      res.status(400).json({ error: "無効な顧客IDです" });
      return;
    }

    const customerIdAsInt = parseInt(customerId, 10);
    console.log("Customer ID:", customerIdAsInt);

    const customerData = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [customerIdAsInt]);
    console.log("Customer Data:", customerData.rows);

    if (customerData.rows.length === 0) {
      res.status(404).json({ error: "顧客が見つかりません" });
    } else {
      const detailHtml = `
      <div class="container mt-5">
        <h1 class="mb-4">顧客詳細</h1>
        <div id="customer-details">
          <p>Customer ID: ${customerData.rows[0].customer_id}</p>
          <p>Company Name: ${customerData.rows[0].company_name}</p>
          <p>Industry: ${customerData.rows[0].industry}</p>
          <p>Contact: ${customerData.rows[0].contact}</p>
          <p>Location: ${customerData.rows[0].location}</p>
        </div>
    
        <button id="deleteButton" class="btn btn-danger">削除</button>
        <button id="editButton" class="btn btn-primary">編集</button>
      </div>
    `    
      res.send(detailHtml);
    }
  } catch (err) {
    console.error('/customer/detail.html ルートでエラー:', err);
    res.status(500).json({ error: err.message || "内部サーバーエラー" });
  }
});

app.delete("/customer/delete/:customerId", async (req, res) => {
  console.log("DELETE request received");
  try {
    const customerId = req.params.customerId;

    if (!customerId || !/^\d+$/.test(customerId)) {
      res.status(400).json({ error: "無効な顧客IDです" });
      return;
    }

    // ここに削除のロジックを追加
    const deleteResult = await pool.query("DELETE FROM customers WHERE customer_id = $1 RETURNING *", [customerId]);

    if (deleteResult.rowCount === 0) {
      // 削除されなかった場合の処理
      res.status(404).json({ error: "顧客が見つかりません" });
    } else {
      // 削除が成功した場合の処理
      res.json({ success: true, message: "顧客が削除されました" });
    }
  } catch (error) {
    console.error("削除エラー：", error);
    res.status(500).json({ error: "内部サーバーエラー" });
  }
});

app.use(express.static("public"));
