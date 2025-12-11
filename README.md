# Eventizer – Permission & Certificate Management System

Eventizer is a centralized platform designed to manage and organize permission letters and certificates efficiently. It minimizes manual tracking, improves accessibility, and ensures all documents remain clean, structured, and easy to retrieve.

---

##  Features

- **Centralized Document Management** – Unified handling of permission letters and certificates.
- **Clean & Organized Structure** – Documents remain easy to find, review, and track.
- **User & Admin Workflows** – Clear separation of responsibilities and access levels.
- **Secure Storage** – Documents stored safely using cloud-backed infrastructure.
- **Fast Retrieval** – Quick document access with structured indexing.

---

##  Technologies Used

- **React** – Frontend UI  
- **Express.js** – Backend API  
- **PostgreSQL** – Database  
- **Firebase** – Authentication / Hosting  
- **MinIO** – File storage  

---

---

##  How It Works (High-Level)

1. Users/admins upload and manage certificates & permission letters.
2. Files are securely stored in MinIO.
3. Document metadata is saved in PostgreSQL for efficient lookup.
4. Firebase handles authentication and controlled access.
5. React provides a smooth, intuitive interface for browsing documents.

---

##  Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/SS-Pradeep/Eventizer.git
cd Eventizer

## Server:
cd backend
npm install
npm start

## Frontend:
cd frontend
npm install
npm run dev


## 📁 Project Structure

