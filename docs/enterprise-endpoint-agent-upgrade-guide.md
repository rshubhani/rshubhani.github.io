Upgrade the Enterprise Endpoint Agent
Use this procedure to upgrade Enterprise Endpoint Agent 4.8 to 5.0 on managed Windows, macOS, and Linux devices. The upgrade preserves existing policy assignments and sends endpoint status to the management service after the device restarts.
> **Important:** Test the upgrade with a pilot group before deploying it broadly. Do not upgrade devices that are offline, near full disk capacity, or running an unsupported operating system.
Before you begin
Confirm the following requirements for each device:
Requirement	Minimum value
Free disk space	1 GB
Network access	HTTPS access to `management.example.com:443`
Privileges	Local administrator or root access
Supported versions	Agent 4.8.x only
Back up any locally customized configuration files before you begin. The installer replaces only settings managed centrally; your operating procedures should identify any local exceptions.
1. Prepare a pilot group
Select 10–20 representative devices that cover the operating systems, network locations, and business applications in your environment. Record the current agent version and service status.
```bash
endpoint-agent --version
```
Expected output:
```text
Enterprise Endpoint Agent 4.8.3
```
2. Install the upgrade package
Windows
Run the installer from an elevated Command Prompt.
```bat
msiexec /i EnterpriseEndpointAgent-5.0.0.msi /qn /norestart
```
Expected output:
```text
Installation completed successfully.
```
macOS
Install the signed package from Terminal.
```bash
sudo installer -pkg EnterpriseEndpointAgent-5.0.0.pkg -target /
```
Expected output:
```text
installer: The install was successful.
```
Linux
Install the package with your supported package manager.
```bash
sudo rpm -Uvh enterprise-endpoint-agent-5.0.0.x86_64.rpm
```
Expected output:
```text
Verifying...                          ################################# [100%]
Updating / installing...
```
3. Restart and verify the agent
Restart the endpoint if the installer requests it. Then confirm that the service is running and the installed version is 5.0.
```bash
endpoint-agent --version
sudo systemctl status endpoint-agent --no-pager
```
Expected output:
```text
Enterprise Endpoint Agent 5.0.0
Active: active (running)
```
On Windows, check Services and confirm that Enterprise Endpoint Agent is running. On macOS, run:
```bash
sudo launchctl print system/com.example.endpoint-agent | grep state
```
Expected output:
```text
state = running
```
4. Confirm policy and telemetry status
In the management console, open Endpoints > Device Status. Confirm that the pilot device reports version 5.0, a recent check-in time, and an assigned policy.
Wait at least one normal check-in interval before evaluating a device as failed.
Troubleshooting
Issue	Action
Installer stops or returns an insufficient-disk-space error	Free 1 GB of disk space and run the installer again.
Service does not start after installation	Review the local agent log, correct the reported issue, and restart the service.
Device does not check in	Verify DNS and HTTPS access to `management.example.com:443`; then restart the agent service.
Policy is missing	Confirm that the device identity and group assignment are unchanged in the management console.
Roll back a failed pilot deployment
Stop further deployment when more than one pilot device has the same unresolved failure. Collect the installer log, agent version, operating-system version, and time of failure. Reinstall the previously approved package only after confirming it is compatible with the device's assigned policy.
> **Tip:** Keep the pilot group active for one business day after the upgrade. This allows you to confirm normal logon, network, and policy behavior before expanding the deployment.
