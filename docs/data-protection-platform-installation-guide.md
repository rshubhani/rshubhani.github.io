# Install the Data Protection Management Server

Install the Data Protection Management Server to centrally manage policies, endpoint registrations, and audit events. This guide uses a single-server deployment for a non-production or pilot environment.

> **Important:** Use a separate, supported database server for production deployments. Confirm sizing, high availability, backup, and network requirements before installation.

## Prerequisites

| Component | Requirement |
| --- | --- |
| Server operating system | 64-bit Windows Server 2022 or supported Linux distribution |
| Memory | 16 GB RAM minimum |
| Disk space | 100 GB free space for application and audit data |
| Database | PostgreSQL 15 or later |
| Network | HTTPS access to `management.example.com:443` |
| Certificate | PKCS#12 certificate and private key for the management-service hostname |

Obtain a certificate issued for the hostname users and endpoints will use. Do not use a self-signed certificate in production.

## 1. Create the database

Create a database and a dedicated application account. Replace the sample password before running the command.

```sql
CREATE USER dpms_service WITH PASSWORD '<STRONG_DATABASE_PASSWORD>';
CREATE DATABASE dpms OWNER dpms_service;
```

Expected output:

```text
CREATE ROLE
CREATE DATABASE
```

## 2. Run the installer

Start the installer with local administrator or root privileges. Select **Management Server** when the installer asks which components to install.

Provide the following values on the **Database Configuration** page:

| Field | Example value |
| --- | --- |
| **Database Host** | `db01.corp.internal` |
| **Database Name** | `dpms` |
| **Database User** | `dpms_service` |
| **Database Password** | Your secure database password |

On the **TLS Certificate** page, select the PKCS#12 file and enter its password. Click **Install**.

Expected installer result:

```text
Management Server installation completed successfully.
```

## 3. Start and verify the service

Start the management service.

```bash
sudo systemctl enable --now dpms-server
```

Expected output:

```text
Created symlink /etc/systemd/system/multi-user.target.wants/dpms-server.service.
```

Confirm that the service is running.

```bash
sudo systemctl status dpms-server --no-pager
```

Expected output:

```text
Active: active (running)
```

Test the health endpoint from an authorized network.

```bash
curl --silent --show-error https://management.example.com/health
```

Expected output:

```json
{"status":"healthy"}
```

## 4. Complete the initial configuration

Open `https://management.example.com` in a supported browser. On the **Initial Setup** page, create the first administrator account, set the organization name, and configure the approved email relay.

Click **Save and Continue**. The console displays the dashboard when configuration is complete.

> **Tip:** Create a second administrator account before onboarding endpoints. This prevents a single-account lockout.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Installer cannot connect to the database | Confirm the host, port, credentials, and firewall rule. Verify that the application account owns the `dpms` database. |
| Browser shows a certificate warning | Confirm that the certificate hostname matches the URL and that the full certificate chain is installed. |
| Service does not start | Review `journalctl -u dpms-server -n 100` and correct the reported configuration error. |
| Health endpoint returns `503` | Confirm that the database is available and wait for initialization to complete. |

## Verify the installation

Sign in to the console and open **System** > **Service Status**. Confirm that **Management Service**, **Database Connection**, and **Audit Processing** display **Healthy**.
