-- Database Schema for Lead Scoring Portal
-- Created: 2025-11-04

-- Drop tables if exists (for development)
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Table: users (untuk autentikasi)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: customers (dari dataset Bank Marketing UCI)
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  job VARCHAR(50),
  marital VARCHAR(20),
  education VARCHAR(50),
  has_default BOOLEAN DEFAULT false,
  has_housing_loan BOOLEAN DEFAULT false,
  has_personal_loan BOOLEAN DEFAULT false,
  contact VARCHAR(20),
  month VARCHAR(10),
  day_of_week VARCHAR(10),
  campaign INTEGER DEFAULT 1,
  pdays INTEGER DEFAULT 999,
  previous INTEGER DEFAULT 0,
  poutcome VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: predictions (hasil prediksi ML)
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  probability_score DECIMAL(5,4) NOT NULL CHECK (probability_score >= 0 AND probability_score <= 1),
  will_subscribe BOOLEAN NOT NULL,
  model_version VARCHAR(20) DEFAULT '1.0',
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, predicted_at)
);

-- Indexes untuk optimasi query
CREATE INDEX idx_predictions_score ON predictions(probability_score DESC);
CREATE INDEX idx_predictions_customer_id ON predictions(customer_id);
CREATE INDEX idx_customers_id ON customers(id);
CREATE INDEX idx_customers_job ON customers(job);
CREATE INDEX idx_customers_education ON customers(education);
CREATE INDEX idx_users_email ON users(email);

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments untuk dokumentasi
COMMENT ON TABLE users IS 'Tabel untuk menyimpan data user (admin & sales)';
COMMENT ON TABLE customers IS 'Tabel untuk menyimpan data nasabah bank';
COMMENT ON TABLE predictions IS 'Tabel untuk menyimpan hasil prediksi ML';
COMMENT ON COLUMN predictions.probability_score IS 'Skor probabilitas nasabah akan subscribe (0-1)';
COMMENT ON COLUMN predictions.will_subscribe IS 'Prediksi apakah nasabah akan subscribe';
