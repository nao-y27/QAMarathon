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

app.use(express.static("public"));
