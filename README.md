# 🛒 Full-Stack E-Commerce Engine

[![Build Spring Boot with Maven](https://github.com/dennismugane/ecommerce-fullstack/actions/workflows/backend-ci.yaml/badge.svg)](https://github.com/dennismugane/ecommerce-fullstack/actions/workflows/backend-ci.yaml)

A robust full-stack e-commerce checkout system built with React and Spring Boot.  
This project demonstrates advanced state management, real-time price calculations, and relational database integration.

---

## 🚀 Key Features

- ✅ Dynamic Cart Management  
  Add and remove items with real-time quantity updates.

- 🚚 Smart Shipping Logic  
  Integrated delivery options that update order totals, tax, and estimated arrival dates instantly.

- 💾 Persistent Checkout  
  Uses Spring Data JPA and MySQL to preserve cart state across sessions.

- 💳 Automated Payment Summary  
  Backend-driven calculation engine for product costs, tiered shipping fees, and tax.

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Axios
- DayJS (Date calculations)

### Backend

- Java 17+
- Spring Boot
- Spring Data JPA
- Lombok

### Database

- MySQL / PostgreSQL

### API

- RESTful Architecture
- DTO (Data Transfer Object) Pattern

---

## 📐 Architecture & Core Logic

This project uses a **Transient Order Preview Pattern**.

Instead of creating an order immediately, the backend generates a **Summary DTO** based on:

- Active CartItems
- Selected DeliveryOptions
- Pricing rules

This allows users to preview costs before checkout.

---

## 🗂️ Relational Schema

- **Product**  
  Core product data (name, image, price).

- **CartItem**  
  Links user session to products with quantity and shipping.

- **DeliveryOption**  
  Lookup table for shipping cost and transit time.

---

## 🏁 Getting Started

### ✅ Prerequisites

- JDK 17+
- Node.js & npm
- MySQL Server
- Git

---

## 📥 Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/ecommerce-engine.git
cd ecommerce-engine

spring.datasource.url=jdbc:mysql://localhost:3306/ecommerce_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

# Build the project

./mvnw clean install

# Run the backend server

./mvnw spring-boot:run
