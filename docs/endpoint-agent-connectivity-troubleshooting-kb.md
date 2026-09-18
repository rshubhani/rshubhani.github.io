# Troubleshoot Endpoint Agent Connectivity to the Management Service

Use this article when an endpoint agent appears offline or does not receive an updated policy from the management service.

## Symptoms

You may observe one or more of the following symptoms:

- The device status shows an old check-in time.
- The agent version or policy assignment does not update.
- The local agent log includes a connection, certificate, DNS, or authorization error.
- The device can access internal resources but cannot connect to the management service.

## Cause

Connectivity failures usually result from blocked HTTPS traffic, an incorrect proxy configuration, DNS resolution failure, a device clock that is out of sync, or an expired device credential.

## Resolution

### 1. Confirm that the agent service is running

On Linux, run:

```bash
sudo systemctl status endpoint-agent --no-pager
```

Expected output:

```text
Active: active (running)
```

On macOS, run:

```bash
sudo launchctl print system/com.example.endpoint-agent | grep state
```

Expected output:

```text
state = running
```

On Windows, open **Services** and confirm that **Enterprise Endpoint Agent** has a status of **Running**.

### 2. Test name resolution and HTTPS access

Resolve the management-service hostname.

```bash
nslookup management.example.com
```

Expected output:

```text
Name:    management.example.com
Address: 192.0.2.25
```

Then test the HTTPS endpoint.

```bash
curl --verbose https://management.example.com/health
```

Expected output:

```text
< HTTP/2 200
{"status":"ok"}
```

If the command fails, verify that the endpoint, proxy, and firewall allow outbound TCP port `443` to `management.example.com`.

### 3. Check the device time

TLS authentication can fail when the device clock differs significantly from the current time. Synchronize the endpoint with your approved time source, then restart the agent.

```bash
sudo systemctl restart endpoint-agent
```

Expected output:

```text
Restarted endpoint-agent.service.
```

### 4. Request a new check-in

Run the agent diagnostic command after network access is restored.

```bash
sudo endpoint-agent diagnostics --connectivity
```

Expected output:

```text
Management service connection: successful
Device credential: valid
Policy check-in: successful
```

## Verify the resolution

Open **Endpoints** > **Device Status** in the management console. Confirm that the device shows a current check-in time and the expected policy version. If the status does not update after one check-in interval, review the agent log again.

## When to escalate

Escalate the issue when HTTPS connectivity succeeds but the agent still reports an authorization error, or when multiple devices in the same location fail at the same time. Include the following information:

- Device operating system and agent version
- Approximate time of the failure and time zone
- Sanitized diagnostic output and relevant log messages
- Proxy or firewall changes made before the issue started

> **Important:** Remove usernames, access tokens, device IDs, and internal hostnames before sharing logs outside your organization.
