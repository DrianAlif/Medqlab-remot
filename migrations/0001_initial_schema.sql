-- Cloudflare D1 Initial Schema for MEDQLAB Remote Portal

DROP TABLE IF EXISTS interfaces;
DROP TABLE IF EXISTS servers;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS apps;
DROP TABLE IF EXISTS vpns;
DROP TABLE IF EXISTS ips;
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS users;

CREATE TABLE interfaces (
  id TEXT PRIMARY KEY,
  name TEXT,
  hospital TEXT,
  rustdeskId TEXT,
  rustdeskPass TEXT,
  tvId TEXT,
  tvPass TEXT,
  anydeskId TEXT,
  anydeskPass TEXT,
  ip TEXT,
  pcUserPass TEXT,
  spec TEXT,
  os TEXT,
  version TEXT,
  notes TEXT,
  rustdeskServer TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE servers (
  id TEXT PRIMARY KEY,
  name TEXT,
  userSsh TEXT,
  passSsh TEXT,
  sshPubkey TEXT,
  extraPass TEXT,
  rustdeskId TEXT,
  rustdeskPass TEXT,
  anydeskId TEXT,
  anydeskPass TEXT,
  tvId TEXT,
  tvPass TEXT,
  notes TEXT,
  rustdeskServer TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  hospital TEXT,
  anydeskId TEXT,
  anydeskPass TEXT,
  rustdeskId TEXT,
  rustdeskPass TEXT,
  tvId TEXT,
  tvPass TEXT,
  ip TEXT,
  notes TEXT,
  rustdeskServer TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE apps (
  id TEXT PRIMARY KEY,
  clientName TEXT,
  version TEXT,
  osVersion TEXT,
  appUrl TEXT,
  adminer TEXT,
  grafana TEXT,
  metabase TEXT,
  ssh TEXT,
  instruments TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE vpns (
  id TEXT PRIMARY KEY,
  hospital TEXT,
  vpnType TEXT,
  username TEXT,
  password TEXT,
  notes TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE ips (
  id TEXT PRIMARY KEY,
  hospital TEXT,
  pcName TEXT,
  ip TEXT,
  notes TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  createdAt TEXT
);

-- Indices for fast searching
CREATE INDEX idx_interfaces_name ON interfaces(name);
CREATE INDEX idx_interfaces_hospital ON interfaces(hospital);
CREATE INDEX idx_servers_name ON servers(name);
CREATE INDEX idx_clients_hospital ON clients(hospital);
CREATE INDEX idx_apps_clientName ON apps(clientName);
CREATE INDEX idx_users_username ON users(username);
